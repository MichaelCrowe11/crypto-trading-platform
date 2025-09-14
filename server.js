// CryptoCrowe - Production Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "https:"],
        },
    },
}));

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        app: 'CryptoCrowe',
        version: '1.0.0'
    });
});

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        message: 'CryptoCrowe API is running',
        timestamp: new Date().toISOString(),
        features: [
            'Multi-wallet support',
            'Exchange integrations',
            'Automated trading',
            'Real-time market data'
        ]
    });
});

// Real market data endpoint - requires API keys
app.get('/api/market/prices', async (req, res) => {
    try {
        // Return empty object if no API configured
        // In production, integrate with CoinGecko/CoinMarketCap/etc
        res.json({});
    } catch (error) {
        res.status(500).json({ error: 'Market data unavailable' });
    }
});

// Authentication endpoint - requires Supabase or other auth provider
app.post('/api/auth/login', (req, res) => {
    // Requires proper authentication setup
    res.status(503).json({
        success: false,
        message: 'Authentication service not configured'
    });
});

// Wallet connection endpoint
app.post('/api/wallet/connect', (req, res) => {
    const { walletAddress, walletType } = req.body;
    // Real wallet connection handled client-side
    res.json({
        success: true,
        wallet: { address: walletAddress, type: walletType }
    });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🦅 CryptoCrowe server running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
});