// CryptoCrowe - Enhanced Production Trading Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const redis = require('redis');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const cron = require('node-cron');

// Import services
const ExchangeManager = require('./src/exchanges/ExchangeManager');
const WalletManager = require('./src/wallet/WalletManager');
const SupabaseService = require('./src/services/SupabaseService');
const TradingEngine = require('./src/services/TradingEngine');
const MarketDataService = require('./src/services/MarketDataService');
const PortfolioService = require('./src/services/PortfolioService');
const StrategyManager = require('./src/services/StrategyManager');
const NotificationService = require('./src/services/NotificationService');
const HealthCheckService = require('./src/services/HealthCheckService');

// LIVE PRODUCTION TRADING
const LiveTradingPlatform = require('./src/init-live-trading');
const liveConfig = require('./config/live-trading-config');
const secretsLoader = require('./src/config/secrets-loader');

// Override config with secrets from Fly.io
const coinbaseSecrets = secretsLoader.getCoinbaseConfig();
if (coinbaseSecrets.apiKey) {
    liveConfig.coinbase.apiKey = coinbaseSecrets.apiKey;
    liveConfig.coinbase.apiSecret = coinbaseSecrets.secret;
    liveConfig.coinbase.passphrase = coinbaseSecrets.password;
    console.log('✅ Coinbase credentials loaded from Fly.io secrets');
}

// Initialize Express app
const app = express();

// Trust proxy for Fly.io deployment - set to specific number for security
app.set('trust proxy', 1);

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 8080;

// Initialize services
const exchangeManager = new ExchangeManager();
const walletManager = new WalletManager();
const tradingEngine = new TradingEngine(exchangeManager);
const marketDataService = new MarketDataService(exchangeManager);
const portfolioService = new PortfolioService();
const strategyManager = new StrategyManager(tradingEngine);
const notificationService = new NotificationService();

// Logger configuration
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'trading.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Database connections
async function connectDatabases() {
    try {
        // MongoDB connection
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            logger.info('MongoDB connected successfully');
        }

        // Redis connection
        if (process.env.REDIS_URL) {
            const redisClient = redis.createClient({
                url: process.env.REDIS_URL
            });

            redisClient.on('error', (err) => logger.error('Redis error:', err));
            await redisClient.connect();
            logger.info('Redis connected successfully');

            app.locals.redis = redisClient;
        }
    } catch (error) {
        logger.error('Database connection error:', error);
    }
}

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://s3.tradingview.com", "https://unpkg.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "wss:", "https:", "https://api.coingecko.com", "https://stream.binance.com"],
            frameSrc: ["'self'", "https://www.tradingview.com"],
            childSrc: ["'self'", "blob:", "https://www.tradingview.com"],
        },
    },
}));

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);

// Authentication middleware
async function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const user = await SupabaseService.verifyToken(token);
        req.user = user;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(403).json({ error: 'Invalid token' });
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        app: 'CryptoCrowe',
        version: '2.0.0',
        services: {
            mongodb: mongoose.connection.readyState === 1,
            redis: app.locals.redis?.isReady || false
        }
    });
});

// API Routes

// Status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        version: '1.0.0',
        timestamp: Date.now(),
        services: {
            exchanges: exchangeManager ? 'connected' : 'disconnected',
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            redis: app.locals.redis ? 'connected' : 'disconnected',
            websocket: io ? 'active' : 'inactive'
        }
    });
});

// Authentication routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, metadata } = req.body;
        const result = await SupabaseService.signUp(email, password, metadata);
        res.json(result);
    } catch (error) {
        logger.error('Signup error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await SupabaseService.signIn(email, password);
        res.json(result);
    } catch (error) {
        logger.error('Login error:', error);
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        res.json({
            authenticated: true,
            user: req.user
        });
    } catch (error) {
        logger.error('Verify error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        await SupabaseService.signOut(req.headers['authorization'].split(' ')[1]);
        res.json({ success: true });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Exchange management routes
app.post('/api/exchanges/connect', authenticateToken, async (req, res) => {
    try {
        const { exchange, apiKey, apiSecret, passphrase } = req.body;
        const result = await exchangeManager.addApiKeys(req.user.id, {
            exchange,
            apiKey,
            apiSecret,
            passphrase
        });
        res.json(result);
    } catch (error) {
        logger.error('Exchange connection error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/exchanges/balance/:exchange', authenticateToken, async (req, res) => {
    try {
        const balance = await exchangeManager.fetchBalance(req.user.id, req.params.exchange);
        res.json(balance);
    } catch (error) {
        logger.error('Balance fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

// Trading routes
app.post('/api/trade/order', authenticateToken, async (req, res) => {
    try {
        const { exchange, symbol, type, side, amount, price } = req.body;
        const order = await tradingEngine.placeOrder(req.user.id, exchange, {
            symbol, type, side, amount, price
        });

        // Save trade to database
        await SupabaseService.saveTrade({
            user_id: req.user.id,
            ...order
        });

        res.json(order);
    } catch (error) {
        logger.error('Order placement error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/trade/order/:exchange/:orderId', authenticateToken, async (req, res) => {
    try {
        const { exchange, orderId } = req.params;
        const { symbol } = req.body;
        const result = await exchangeManager.cancelOrder(req.user.id, exchange, orderId, symbol);
        res.json(result);
    } catch (error) {
        logger.error('Order cancellation error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/trade/orders/:exchange', authenticateToken, async (req, res) => {
    try {
        const { symbol } = req.query;
        const orders = await exchangeManager.fetchOpenOrders(req.user.id, req.params.exchange, symbol);
        res.json(orders);
    } catch (error) {
        logger.error('Orders fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.get('/api/trade/history', authenticateToken, async (req, res) => {
    try {
        const { limit, offset, startDate, endDate } = req.query;
        const trades = await SupabaseService.getUserTrades(req.user.id, {
            limit: parseInt(limit) || 100,
            offset: parseInt(offset) || 0,
            startDate,
            endDate
        });
        res.json(trades);
    } catch (error) {
        logger.error('Trade history error:', error);
        res.status(500).json({ error: 'Failed to fetch trade history' });
    }
});

// Market data routes
app.get('/api/market/prices', async (req, res) => {
    try {
        const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOGE', 'DOT', 'UNI', 'MATIC'];
        const prices = {};

        for (const symbol of symbols) {
            try {
                const ticker = await marketDataService.getTicker('binance', `${symbol}/USDT`);
                prices[symbol] = {
                    price: ticker?.last || 0,
                    change: ticker?.percentage || 0,
                    high: ticker?.high || 0,
                    low: ticker?.low || 0,
                    volume: ticker?.baseVolume || 0
                };
            } catch (err) {
                // Skip symbol if API fails - no fallback data
                logger.error(`Failed to fetch price for ${symbol}:`, err.message);
            }
        }

        res.json(prices);
    } catch (error) {
        logger.error('Market prices error:', error);
        // Return error status if all market data sources fail
        res.status(503).json({
            error: 'Market data unavailable',
            message: 'All market data sources are currently unavailable'
        });
    }
});

app.get('/api/market/ticker/:symbol', async (req, res) => {
    try {
        const { exchange } = req.query;
        const ticker = await marketDataService.getTicker(exchange || 'binance', req.params.symbol);
        res.json(ticker);
    } catch (error) {
        logger.error('Ticker fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch ticker' });
    }
});

app.get('/api/market/ohlcv/:symbol', async (req, res) => {
    try {
        const { exchange, timeframe, limit } = req.query;
        const ohlcv = await marketDataService.getOHLCV(
            exchange || 'binance',
            req.params.symbol,
            timeframe || '5m',
            parseInt(limit) || 100
        );
        res.json(ohlcv);
    } catch (error) {
        logger.error('OHLCV fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch OHLCV data' });
    }
});

app.get('/api/market/aggregated/:symbol', async (req, res) => {
    try {
        const data = await exchangeManager.getAggregatedMarketData(req.params.symbol);
        res.json(data);
    } catch (error) {
        logger.error('Aggregated data error:', error);
        res.status(500).json({ error: 'Failed to fetch aggregated data' });
    }
});

// Debug endpoint to check credentials
app.get('/api/debug/credentials', (req, res) => {
    const status = secretsLoader.getStatus();

    res.json({
        secrets: status,
        config: {
            hasApiKey: !!liveConfig.coinbase.apiKey,
            hasApiSecret: !!liveConfig.coinbase.apiSecret,
            hasPassphrase: !!liveConfig.coinbase.passphrase,
            mode: liveConfig.mode,
            tradingEnabled: liveConfig.trading.enabled
        },
        environment: {
            hasCoinbaseKey: !!process.env.COINBASE_API_KEY,
            hasCoinbaseSecret: !!process.env.COINBASE_API_SECRET,
            hasCoinbasePassphrase: !!process.env.COINBASE_PASSPHRASE,
            hasOpenAI: !!process.env.OPENAI_API_KEY,
            hasAnthropic: !!process.env.ANTHROPIC_API_KEY
        }
    });
});

// LIVE TRADING ROUTES - ACTIVE DOWN TO $10
app.get('/api/live/status', async (req, res) => {
    try {
        const platform = app.locals.liveTradingPlatform;
        if (!platform) {
            return res.json({
                status: 'disabled',
                message: 'Live trading not initialized',
                mode: 'DEMO'
            });
        }

        const status = await platform.getStatus();
        res.json({
            ...status,
            message: 'LIVE PRODUCTION TRADING ACTIVE - $10 MINIMUM',
            warning: 'REAL MONEY TRADING ENABLED'
        });
    } catch (error) {
        logger.error('Live status error:', error);
        res.status(500).json({ error: 'Failed to get live status' });
    }
});

app.post('/api/live/trade', async (req, res) => {
    try {
        const platform = app.locals.liveTradingPlatform;
        if (!platform) {
            return res.status(400).json({ error: 'Live trading not enabled' });
        }

        const { symbol, side, amount } = req.body;

        // Validate minimum $10
        if (amount < 10) {
            return res.status(400).json({
                error: 'Minimum trade size is $10',
                minSize: 10
            });
        }

        const result = await platform.executeTrade({ symbol, side, amount });
        res.json(result);
    } catch (error) {
        logger.error('Live trade error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/live/balance', async (req, res) => {
    try {
        const platform = app.locals.liveTradingPlatform;
        if (!platform) {
            return res.json({ balance: 0, mode: 'DEMO' });
        }

        const balance = await platform.getBalance();
        const status = await platform.getStatus();

        res.json({
            balance: balance.USD || 0,
            positions: balance.positions || 0,
            mode: status.mode,
            minTradeSize: 10
        });
    } catch (error) {
        logger.error('Balance fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

// Portfolio routes
app.get('/api/portfolio', authenticateToken, async (req, res) => {
    try {
        const portfolio = await portfolioService.getUserPortfolio(req.user.id);
        res.json(portfolio);
    } catch (error) {
        logger.error('Portfolio fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

app.get('/api/portfolio/performance', authenticateToken, async (req, res) => {
    try {
        const { period } = req.query;
        const performance = await portfolioService.getPerformance(req.user.id, period || '24h');
        res.json(performance);
    } catch (error) {
        logger.error('Performance fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch performance' });
    }
});

// Strategy routes
app.post('/api/strategy/create', authenticateToken, async (req, res) => {
    try {
        const strategy = await strategyManager.createStrategy(req.user.id, req.body);
        res.json(strategy);
    } catch (error) {
        logger.error('Strategy creation error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/strategy/:strategyId/activate', authenticateToken, async (req, res) => {
    try {
        const result = await strategyManager.activateStrategy(req.user.id, req.params.strategyId);
        res.json(result);
    } catch (error) {
        logger.error('Strategy activation error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/strategy/:strategyId/deactivate', authenticateToken, async (req, res) => {
    try {
        const result = await strategyManager.deactivateStrategy(req.user.id, req.params.strategyId);
        res.json(result);
    } catch (error) {
        logger.error('Strategy deactivation error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/strategy/list', authenticateToken, async (req, res) => {
    try {
        const strategies = await strategyManager.getUserStrategies(req.user.id);
        res.json(strategies);
    } catch (error) {
        logger.error('Strategy list error:', error);
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
});

// Wallet routes
app.post('/api/wallet/connect', authenticateToken, async (req, res) => {
    try {
        const { walletType, address } = req.body;
        const wallet = await walletManager.saveWalletConnection(req.user.id, {
            type: walletType,
            address
        });
        res.json(wallet);
    } catch (error) {
        logger.error('Wallet connection error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/wallet/balance/:address', authenticateToken, async (req, res) => {
    try {
        const { chain } = req.query;
        const balance = await walletManager.getBalance(req.params.address, chain || 'ethereum');
        res.json(balance);
    } catch (error) {
        logger.error('Wallet balance error:', error);
        res.status(500).json({ error: 'Failed to fetch wallet balance' });
    }
});

// WebSocket connections
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        const user = await SupabaseService.verifyToken(token);
        socket.userId = user.id;
        next();
    } catch (error) {
        next(new Error('Authentication failed'));
    }
});

io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected via WebSocket`);

    // Join user room
    socket.join(`user:${socket.userId}`);

    // Subscribe to market data
    socket.on('subscribe:ticker', async (data) => {
        const { symbol, exchange } = data;
        socket.join(`ticker:${exchange}:${symbol}`);

        // Start streaming ticker data
        const interval = setInterval(async () => {
            try {
                const ticker = await marketDataService.getTicker(exchange, symbol);
                socket.emit('ticker:update', ticker);
            } catch (error) {
                logger.error('Ticker streaming error:', error);
            }
        }, 5000);

        socket.on('disconnect', () => {
            clearInterval(interval);
        });
    });

    // Subscribe to order updates
    socket.on('subscribe:orders', () => {
        socket.join(`orders:${socket.userId}`);
    });

    // Subscribe to portfolio updates
    socket.on('subscribe:portfolio', () => {
        socket.join(`portfolio:${socket.userId}`);
    });

    socket.on('disconnect', () => {
        logger.info(`User ${socket.userId} disconnected`);
    });
});

// Scheduled tasks
cron.schedule('*/5 * * * *', async () => {
    // Update portfolio values every 5 minutes
    logger.info('Running portfolio update task');
    await portfolioService.updateAllPortfolios();
});

cron.schedule('*/1 * * * *', async () => {
    // Check and execute trading strategies every minute
    logger.info('Running strategy execution task');
    await strategyManager.executeActiveStrategies();
});

cron.schedule('0 0 * * *', async () => {
    // Daily performance report
    logger.info('Generating daily performance reports');
    await notificationService.sendDailyReports();
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
async function startServer() {
    try {
        await connectDatabases();

<<<<<<< HEAD
        // Initialize LIVE PRODUCTION Trading Platform
        let liveTradingPlatform = null;

        // Use Simple Live Trading for now
        const SimpleLiveTrading = require('./src/services/SimpleLiveTrading');

        // Check if we have any trading credentials
        const hasCredentials = (liveConfig.coinbase.apiKey && liveConfig.coinbase.apiSecret) ||
                             (process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET);

        if (liveConfig.mode === 'PRODUCTION' && liveConfig.trading.enabled && hasCredentials) {
            logger.warn('🚨 INITIALIZING LIVE PRODUCTION TRADING - REAL MONEY');

            // Use simple implementation that works
            liveTradingPlatform = new SimpleLiveTrading(liveConfig);

            // Make platform available globally
            app.locals.liveTradingPlatform = liveTradingPlatform;

            logger.info('✅ Live Trading Platform initialized with credentials');
        } else {
            logger.warn('⚠️  Running in DEMO mode');
        }

        server.listen(PORT, '0.0.0.0', () => {
            logger.info(`CryptoCrowe server running on port ${PORT}`);
            logger.info(`WebSocket server ready`);
            logger.info(`Health check: http://localhost:${PORT}/health`);

            if (liveTradingPlatform) {
                logger.info('💎 LIVE PRODUCTION TRADING ACTIVE - $150 USD');
            }
=======
        // Initialize health check service
        const healthCheckService = new HealthCheckService(app, {
            exchangeManager,
            tradingEngine,
            marketDataService,
            portfolioService
        });
        healthCheckService.initialize();
        app.locals.io = io;

        const HOST = '0.0.0.0';
        server.listen(PORT, HOST, () => {
            logger.info(`CryptoCrowe server running on ${HOST}:${PORT}`);
            logger.info(`WebSocket server ready`);
            logger.info(`Health check: http://${HOST}:${PORT}/health`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
>>>>>>> e47695f6316316df1995649f331e7ada3bf1bd18
        });
    } catch (error) {
        logger.error('Server startup error:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');

    server.close(() => {
        logger.info('HTTP server closed');
    });

    await mongoose.connection.close();
    await app.locals.redis?.quit();

    process.exit(0);
});

startServer();