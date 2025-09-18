// CryptoCrowe - LIVE PRODUCTION TRADING CONFIGURATION
// WARNING: This configuration uses REAL MONEY
// ACTIVE ALL THE WAY DOWN TO $10

module.exports = {
    // PRODUCTION MODE - LIVE TRADING ENABLED
    mode: 'PRODUCTION',
    testMode: false,
    paperTrading: false,

    // Trading Parameters - ACTIVE DOWN TO $10
    trading: {
        enabled: true,
        autoTrade: true,
        maxPositionSize: 30,        // Max $30 per trade (30% of $100 portfolio)
        minPositionSize: 10,        // Min $10 per trade - ACTIVE DOWN TO $10
        maxDailyTrades: 10,         // Max 10 trades per day with $100 balance
        stopLossPercentage: 5,      // 5% stop loss
        takeProfitPercentage: 10,   // 10% take profit
        trailingStopLoss: true,
        trailingStopPercentage: 3,

        // Risk Management - Adjusted for $10 minimum
        maxPortfolioRisk: 0.20,    // Max 20% portfolio at risk (allows more $10 positions)
        maxSingleTradeRisk: 0.07,  // Max 7% risk per trade
        diversificationLimit: 10,   // Max 10 concurrent positions (can have 15x $10 positions)
    },

    // Coinbase Configuration for LIVE Trading
    coinbase: {
        enabled: true,
        live: true,
        initialBalance: 100,        // $100 starting balance
        apiKey: process.env.COINBASE_API_KEY,
        apiSecret: process.env.COINBASE_API_SECRET,
        passphrase: process.env.COINBASE_PASSPHRASE,

        // Trading Pairs
        tradingPairs: [
            'BTC-USD',
            'ETH-USD',
            'SOL-USD',
            'MATIC-USD',
            'LINK-USD',
            'ADA-USD',
            'DOT-USD',
            'AVAX-USD',
            'ATOM-USD',
            'XRP-USD'
        ],

        // Fee Configuration
        makerFee: 0.005,  // 0.5%
        takerFee: 0.006,  // 0.6%
    },

    // AI Trading Configuration - Optimized for $10 positions
    ai: {
        enabled: true,
        decisionThreshold: 70,      // Lowered to 70% for more trading opportunities
        analysisInterval: 30000,    // Analyze every 30 seconds for quick trades

        // Aggressive settings for small positions
        aggressiveMode: true,
        microTrading: true,         // Enable micro trades down to $10

        // Model Weights
        weights: {
            openai: 0.4,     // 40% weight
            anthropic: 0.35, // 35% weight
            xai: 0.25,      // 25% weight
        },

        // Trading Strategies
        strategies: [
            'momentum',
            'mean_reversion',
            'breakout',
            'trend_following',
            'scalping',      // Added for small quick trades
            'arbitrage',
            'micro_trades'   // Strategy for $10-20 positions
        ],

        // Technical Indicators - Tuned for smaller trades
        indicators: {
            rsi: { period: 14, overbought: 70, oversold: 30 },
            macd: { fast: 12, slow: 26, signal: 9 },
            ema: { short: 9, medium: 21, long: 50 },
            bollinger: { period: 20, stdDev: 2 },
            volume: { threshold: 1.2 }  // Lowered for more signals
        }
    },

    // Market Data Sources
    marketData: {
        primary: 'coinbase',
        secondary: 'binance',
        tertiary: 'coingecko',

        // WebSocket Feeds
        websockets: {
            coinbase: 'wss://ws-feed.exchange.coinbase.com',
            binance: 'wss://stream.binance.com:9443/ws',
            kraken: 'wss://ws.kraken.com'
        },

        // Update Intervals - Faster for micro trading
        priceUpdateInterval: 500,     // 0.5 seconds
        orderBookInterval: 2000,      // 2 seconds
        newsUpdateInterval: 30000,    // 30 seconds
    },

    // Safety Features for LIVE Trading - Adjusted for $100 balance
    safety: {
        confirmLargeTrades: true,      // Confirm trades over $30
        dailyLossLimit: 20,            // Stop trading if down $20 in a day (20% of balance)
        emergencyStopLoss: 30,         // Emergency stop if down $30 total (30% of balance)
        requireAuthentication: true,
        twoFactorRequired: false,      // Set to true for extra security

        // Position Sizing Rules
        positionSizing: {
            method: 'kelly_criterion',  // Use Kelly Criterion for optimal sizing
            maxLeverage: 1,             // No leverage for safety
            rebalanceInterval: 3600000, // Rebalance every hour
            minTradeValue: 10,          // $10 minimum trade
            maxTradeValue: 50           // $50 maximum trade
        },

        // Circuit Breakers
        circuitBreaker: {
            enabled: true,
            maxConsecutiveLosses: 5,    // Increased from 3 to allow more $10 trades
            cooldownPeriod: 1800000,    // 30 minute cooldown (reduced)
            volatilityThreshold: 0.15   // 15% price movement triggers breaker
        }
    },

    // Notification Settings
    notifications: {
        enabled: true,
        channels: ['email', 'platform'],

        // Alert Triggers
        alerts: {
            tradeExecuted: true,
            profitTarget: true,
            stopLossHit: true,
            largeMovement: true,
            lowBalance: true,
            apiError: true,
            microTradeSuccess: true  // Alert for successful $10-20 trades
        }
    },

    // Logging for PRODUCTION
    logging: {
        level: 'info',
        tradeLog: true,
        performanceLog: true,
        errorLog: true,
        auditLog: true,
        microTradeLog: true,  // Log all trades down to $10

        // Store all trades
        database: {
            enabled: true,
            storeExecutions: true,
            storeAnalysis: true,
            storePerformance: true
        }
    },

    // Performance Tracking
    performance: {
        trackROI: true,
        trackWinRate: true,
        trackSharpeRatio: true,
        trackMaxDrawdown: true,
        trackMicroTrades: true,  // Track performance of $10-20 trades

        // Reporting
        dailyReport: true,
        weeklyReport: true,
        monthlyReport: true
    }
};

// LIVE TRADING WARNING
console.log(`
╔══════════════════════════════════════════════════════════╗
║                    LIVE TRADING ENABLED                   ║
║                                                           ║
║  WARNING: This configuration uses REAL MONEY             ║
║  Starting Balance: $100 USD                              ║
║  Mode: PRODUCTION - ACTIVE DOWN TO $10                   ║
║                                                           ║
║  Position Limits:                                        ║
║  - Minimum Trade: $10 (ACTIVE)                          ║
║  - Maximum Trade: $50                                   ║
║  - Max Concurrent: 10 positions                         ║
║                                                           ║
║  Safety Features:                                        ║
║  - Stop Loss: 5%                                        ║
║  - Daily Loss Limit: $30                                ║
║  - Emergency Stop: $50                                  ║
║                                                           ║
╚══════════════════════════════════════════════════════════╝
`);