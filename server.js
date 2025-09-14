// Crow-e Crypto - Production Server
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
        app: 'Crow-e Crypto',
        version: '1.0.0'
    });
});

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        message: 'Crow-e Crypto API is running',
        timestamp: new Date().toISOString(),
        features: [
            'Multi-wallet support',
            'Exchange integrations',
            'Automated trading',
            'Real-time market data'
        ]
    });
});

// Mock market data
app.get('/api/market/prices', (req, res) => {
    const prices = {
        'BTC': { price: 45234.56, change: 2.34, volume: 1200000000 },
        'ETH': { price: 2456.78, change: -1.23, volume: 800000000 },
        'BNB': { price: 345.67, change: 0.89, volume: 150000000 },
        'SOL': { price: 98.76, change: 5.67, volume: 45000000 },
        'ADA': { price: 0.456, change: -2.34, volume: 25000000 }
    };
    res.json(prices);
});

// Mock auth
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        token: 'demo-token',
        user: { id: 'demo-user', email: 'demo@crowecrypto.com' }
    });
});

// Mock wallet
app.post('/api/wallet/connect', (req, res) => {
    const { walletAddress, walletType } = req.body;
    res.json({
        success: true,
        wallet: { address: walletAddress, type: walletType, balance: '1.5 ETH' }
    });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🦅 Crow-e Crypto server running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
});