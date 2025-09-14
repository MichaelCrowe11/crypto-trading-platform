// Crow-e Crypto - Production Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
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

// Initialize Supabase (optional)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        app: 'Crow-e Crypto',
        version: '1.0.0',
        services: {
            supabase: !!supabase,
            env: process.env.NODE_ENV
        }
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

// Mock market data endpoint
app.get('/api/market/prices', (req, res) => {
    const mockPrices = {
        'BTC': { price: 45234.56, change: 2.34, volume: 1200000000 },
        'ETH': { price: 2456.78, change: -1.23, volume: 800000000 },
        'BNB': { price: 345.67, change: 0.89, volume: 150000000 },
        'SOL': { price: 98.76, change: 5.67, volume: 45000000 },
        'ADA': { price: 0.456, change: -2.34, volume: 25000000 }
    };

    res.json(mockPrices);
});

// Authentication endpoints (simplified)
app.post('/api/auth/login', (req, res) => {
    // Simplified auth for demo
    res.json({
        success: true,
        token: 'demo-token',
        user: {
            id: 'demo-user',
            email: 'demo@crowecrypto.com'
        }
    });
});

// Wallet connection endpoint (mock)
app.post('/api/wallet/connect', (req, res) => {
    const { walletAddress, walletType } = req.body;

    res.json({
        success: true,
        wallet: {
            address: walletAddress,
            type: walletType,
            balance: '1.5 ETH'
        }
    });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🦅 Crow-e Crypto server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});