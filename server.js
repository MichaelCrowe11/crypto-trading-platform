// Production-Ready Crypto Trading Platform Server
// Multi-Exchange Support with Secure API Integration

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const Redis = require('redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const cron = require('node-cron');
const winston = require('winston');
require('dotenv').config();

// Import trading modules
const TradingEngine = require('./src/trading/TradingEngine');
const ExchangeManager = require('./src/exchanges/ExchangeManager');
const WalletManager = require('./src/wallet/WalletManager');
const MarketDataService = require('./src/services/MarketDataService');
const User = require('./src/models/User');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        credentials: true
    }
});

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'crypto-trading' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "wss:", "https:"],
        },
    },
}));
app.use(compression());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});

const tradingLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit trading operations
    message: 'Trading rate limit exceeded'
});

app.use('/api/', limiter);
app.use('/api/trade/', tradingLimiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-trading', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    logger.info('MongoDB connected successfully');
}).catch(err => {
    logger.error('MongoDB connection error:', err);
});

// Redis connection for caching (optional)
let redisClient = null;
if (process.env.REDIS_URL || process.env.NODE_ENV === 'development') {
    redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));
    redisClient.connect().then(() => {
        logger.info('Redis connected successfully');
    }).catch(err => {
        logger.warn('Redis connection failed, continuing without cache:', err.message);
        redisClient = null;
    });
}

// Initialize services
const exchangeManager = new ExchangeManager();
const walletManager = new WalletManager();
const marketDataService = new MarketDataService(redisClient);
const tradingEngine = new TradingEngine(exchangeManager, walletManager, marketDataService);

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            database: mongoose.connection.readyState === 1,
            redis: redisClient.isReady,
            trading: tradingEngine.isRunning()
        }
    });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // Validate input
        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = new User({
            email,
            username,
            password: hashedPassword,
            createdAt: new Date()
        });

        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username
            }
        });

    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username
            }
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Wallet connection endpoints
app.post('/api/wallet/connect', authenticateToken, async (req, res) => {
    try {
        const { walletAddress, walletType, signature } = req.body;

        // Verify wallet ownership through signature
        const isValid = await walletManager.verifyWalletSignature(walletAddress, signature);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid wallet signature' });
        }

        // Store wallet connection
        const wallet = await walletManager.connectWallet(req.user.userId, {
            address: walletAddress,
            type: walletType,
            connectedAt: new Date()
        });

        res.json({
            success: true,
            wallet: {
                address: wallet.address,
                type: wallet.type,
                balance: await walletManager.getBalance(walletAddress)
            }
        });

    } catch (error) {
        logger.error('Wallet connection error:', error);
        res.status(500).json({ error: 'Failed to connect wallet' });
    }
});

// API key management
app.post('/api/keys/add', authenticateToken, async (req, res) => {
    try {
        const { exchange, apiKey, apiSecret, passphrase } = req.body;

        // Encrypt and store API keys
        const encryptedKeys = await exchangeManager.addApiKeys(req.user.userId, {
            exchange,
            apiKey,
            apiSecret,
            passphrase
        });

        res.json({
            success: true,
            exchange,
            message: 'API keys added successfully'
        });

    } catch (error) {
        logger.error('API key error:', error);
        res.status(500).json({ error: 'Failed to add API keys' });
    }
});

// Market data endpoints
app.get('/api/market/prices', async (req, res) => {
    try {
        const { symbols = 'BTC,ETH,BNB,SOL,ADA' } = req.query;

        // Check cache first
        const cacheKey = `prices:${symbols}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            return res.json(JSON.parse(cached));
        }

        // Fetch from multiple sources
        const prices = await marketDataService.getAggregatedPrices(symbols.split(','));

        // Cache for 30 seconds
        await redisClient.setEx(cacheKey, 30, JSON.stringify(prices));

        res.json(prices);

    } catch (error) {
        logger.error('Market data error:', error);
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

app.get('/api/market/volatility/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { interval = '1h' } = req.query;

        const volatility = await marketDataService.calculateVolatility(symbol, interval);

        res.json({
            symbol,
            interval,
            volatility,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Volatility calculation error:', error);
        res.status(500).json({ error: 'Failed to calculate volatility' });
    }
});

// Trading endpoints
app.post('/api/trade/execute', authenticateToken, async (req, res) => {
    try {
        const { exchange, symbol, side, amount, type = 'market' } = req.body;

        // Validate user has connected exchange
        const hasExchange = await exchangeManager.userHasExchange(req.user.userId, exchange);
        if (!hasExchange) {
            return res.status(400).json({ error: 'Exchange not connected' });
        }

        // Execute trade
        const order = await tradingEngine.executeTrade({
            userId: req.user.userId,
            exchange,
            symbol,
            side,
            amount,
            type
        });

        // Emit to WebSocket
        io.to(req.user.userId).emit('trade-executed', order);

        res.json({
            success: true,
            order
        });

    } catch (error) {
        logger.error('Trade execution error:', error);
        res.status(500).json({ error: 'Trade execution failed' });
    }
});

app.post('/api/trade/auto/start', authenticateToken, async (req, res) => {
    try {
        const { config } = req.body;

        // Start automated trading for user
        await tradingEngine.startAutomatedTrading(req.user.userId, config);

        res.json({
            success: true,
            message: 'Automated trading started'
        });

    } catch (error) {
        logger.error('Auto trading error:', error);
        res.status(500).json({ error: 'Failed to start automated trading' });
    }
});

app.post('/api/trade/auto/stop', authenticateToken, async (req, res) => {
    try {
        await tradingEngine.stopAutomatedTrading(req.user.userId);

        res.json({
            success: true,
            message: 'Automated trading stopped'
        });

    } catch (error) {
        logger.error('Stop trading error:', error);
        res.status(500).json({ error: 'Failed to stop automated trading' });
    }
});

// Portfolio endpoints
app.get('/api/portfolio/summary', authenticateToken, async (req, res) => {
    try {
        const portfolio = await tradingEngine.getPortfolioSummary(req.user.userId);

        res.json(portfolio);

    } catch (error) {
        logger.error('Portfolio error:', error);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

app.get('/api/portfolio/history', authenticateToken, async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;

        const history = await tradingEngine.getTradingHistory(req.user.userId, {
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json(history);

    } catch (error) {
        logger.error('History error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// WebSocket connections
io.on('connection', (socket) => {
    logger.info('New WebSocket connection');

    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            socket.userId = decoded.userId;
            socket.join(decoded.userId);

            // Send initial data
            socket.emit('authenticated', { userId: decoded.userId });

            // Subscribe to user's trading events
            tradingEngine.subscribeToUserEvents(decoded.userId, socket);

        } catch (error) {
            socket.emit('auth-error', 'Invalid token');
            socket.disconnect();
        }
    });

    socket.on('subscribe-market', (symbols) => {
        marketDataService.subscribeToMarketData(symbols, (data) => {
            socket.emit('market-update', data);
        });
    });

    socket.on('disconnect', () => {
        logger.info('WebSocket disconnected');
    });
});

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Static files (production build)
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Scheduled jobs
cron.schedule('*/5 * * * *', async () => {
    // Run portfolio updates every 5 minutes
    logger.info('Running scheduled portfolio updates');
    await tradingEngine.updateAllPortfolios();
});

cron.schedule('0 * * * *', async () => {
    // Clean up old data every hour
    logger.info('Running data cleanup');
    await marketDataService.cleanupOldData();
});

// Error handling
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});