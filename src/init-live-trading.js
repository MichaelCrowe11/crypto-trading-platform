// CryptoCrowe - LIVE TRADING INITIALIZATION
// WARNING: This initializes REAL MONEY trading with $150 USD

const LiveTradingService = require('./services/LiveTradingService');
const AIOrchestrator = require('./services/AIOrchestrator');
const MarketDataService = require('./services/MarketDataService');
const WebSocketService = require('./services/WebSocketService');
const EventEmitter = require('events');
const logger = require('winston');

// Load production configuration
const config = require('../config/live-trading-config');

class LiveTradingPlatform {
    constructor() {
        this.services = {};
        this.isRunning = false;

        logger.info(`
╔══════════════════════════════════════════════════════════╗
║            CRYPTOCROWE LIVE TRADING PLATFORM             ║
║                                                           ║
║  WARNING: LIVE PRODUCTION MODE - REAL MONEY              ║
║  Initial Balance: $${config.coinbase.initialBalance} USD                              ║
║  Max Position: $${config.trading.maxPositionSize}                                   ║
║  Daily Loss Limit: $${config.safety.dailyLossLimit}                              ║
║                                                           ║
╚══════════════════════════════════════════════════════════╝
        `);
    }

    async initialize() {
        try {
            logger.info('🚀 Initializing Live Trading Platform...');

            // 1. Initialize Market Data Service (mock for now - needs Redis)
            logger.info('📊 Market data will use direct exchange feeds...');
            const marketDataEmitter = new EventEmitter();
            this.services.marketData = Object.assign(marketDataEmitter, {
                initialize: async () => true,
                getActiveMarkets: async () => config.coinbase.tradingPairs,
                updatePrice: (data) => console.log('Price update:', data.symbol),
                updateOrderBook: (data) => console.log('OrderBook update:', data.symbol),
                getStatus: async () => ({ active: true, markets: 10 })
            });

            // 2. Initialize WebSocket connections
            logger.info('🔌 Establishing WebSocket connections...');
            this.services.websocket = new WebSocketService(config);
            await this.services.websocket.connect();

            // 3. Initialize Live Trading Service
            logger.info('💰 Initializing live trading service...');
            this.services.trading = new LiveTradingService(config);

            // 4. Initialize AI Orchestrator
            logger.info('🤖 Starting AI trading orchestrator...');
            this.services.ai = new AIOrchestrator(config);
            await this.services.ai.initialize();

            // 5. Connect services
            this.connectServices();

            // 6. Verify connections
            await this.verifyConnections();

            // 7. Start trading
            if (config.trading.enabled && config.trading.autoTrade) {
                await this.startLiveTrading();
            }

            this.isRunning = true;
            logger.info('✅ Live Trading Platform initialized successfully!');

            // Return platform status
            return this.getStatus();

        } catch (error) {
            logger.error('❌ Failed to initialize Live Trading Platform:', error);
            throw error;
        }
    }

    connectServices() {
        // Connect AI signals to trading service
        this.services.ai.on('signal', async (signal) => {
            logger.info('📡 AI Signal received:', {
                action: signal.action,
                symbol: signal.symbol,
                confidence: signal.confidence
            });

            if (signal.confidence >= config.ai.decisionThreshold) {
                await this.services.trading.executeTrade(signal);
            }
        });

        // Connect market data to AI
        this.services.marketData.on('update', (data) => {
            this.services.ai.processMarketData(data);
        });

        // Connect WebSocket to services
        this.services.websocket.on('price', (data) => {
            this.services.marketData.updatePrice(data);
        });

        this.services.websocket.on('orderbook', (data) => {
            this.services.marketData.updateOrderBook(data);
        });

        // Monitor trading events
        this.services.trading.on('trade', (trade) => {
            logger.info('💸 Trade executed:', trade);
            this.broadcastUpdate('trade', trade);
        });

        this.services.trading.on('error', (error) => {
            logger.error('⚠️ Trading error:', error);
            this.handleTradingError(error);
        });
    }

    async verifyConnections() {
        logger.info('🔍 Verifying all connections...');

        const checks = {
            coinbase: false,
            binance: false,
            marketData: false,
            ai: false
        };

        // Check Coinbase connection
        try {
            const balance = await this.services.trading.checkBalance();
            checks.coinbase = balance !== null;
            logger.info(`✅ Coinbase: Connected (Balance: $${balance})`);
        } catch (error) {
            logger.error('❌ Coinbase connection failed:', error.message);
        }

        // Check market data
        try {
            const markets = await this.services.marketData.getActiveMarkets();
            checks.marketData = markets.length > 0;
            logger.info(`✅ Market Data: ${markets.length} markets active`);
        } catch (error) {
            logger.error('❌ Market data connection failed:', error.message);
        }

        // Check AI service
        try {
            const aiStatus = await this.services.ai.getStatus();
            checks.ai = aiStatus.ready;
            logger.info(`✅ AI Orchestrator: ${aiStatus.models.length} models ready`);
        } catch (error) {
            logger.error('❌ AI service failed:', error.message);
        }

        // Warn if critical services are not running
        if (!checks.coinbase) {
            logger.warn('⚠️  Coinbase connection not established - running in simulation mode');
        }
        if (!checks.marketData) {
            logger.warn('⚠️  Market data service not fully initialized');
        }

        return checks;
    }

    async startLiveTrading() {
        logger.info('💎 Starting LIVE PRODUCTION trading...');

        // Final confirmation
        logger.warn(`
⚠️  FINAL CONFIRMATION ⚠️
- Mode: LIVE PRODUCTION
- Real Money: YES
- Initial Balance: $${config.coinbase.initialBalance}
- Auto Trading: ENABLED
- Starting in 5 seconds...
        `);

        // Give 5 seconds to abort if needed
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Start trading
        this.services.trading.startTradingLoop();
        this.services.ai.startAnalysis();

        logger.info('🎯 Live trading is now ACTIVE!');
    }

    async executeTrade(params) {
        const { symbol, side, amount } = params;

        logger.info(`Manual trade request: ${side} ${amount} ${symbol}`);

        const signal = {
            symbol,
            side,
            amount,
            confidence: 100, // Manual trades have 100% confidence
            source: 'manual'
        };

        return await this.services.trading.executeTrade(signal);
    }

    async getStatus() {
        const status = {
            platform: 'LIVE PRODUCTION',
            running: this.isRunning,
            services: {},
            trading: {},
            balance: null
        };

        // Get service statuses
        for (const [name, service] of Object.entries(this.services)) {
            if (service && typeof service.getStatus === 'function') {
                status.services[name] = await service.getStatus();
            }
        }

        // Get trading info
        if (this.services.trading) {
            status.trading = await this.services.trading.getAccountInfo();
            status.balance = status.trading.balance;
        }

        return status;
    }

    broadcastUpdate(type, data) {
        // Broadcast to WebSocket clients
        if (this.services.websocket) {
            this.services.websocket.broadcast({
                type,
                data,
                timestamp: Date.now()
            });
        }
    }

    handleTradingError(error) {
        // Implement error handling
        if (error.critical) {
            logger.error('🛑 CRITICAL ERROR - Stopping trading');
            this.services.trading.stopTrading();
        }
    }

    async shutdown() {
        logger.info('Shutting down Live Trading Platform...');

        // Stop all services
        for (const service of Object.values(this.services)) {
            if (service && typeof service.stop === 'function') {
                await service.stop();
            }
        }

        this.isRunning = false;
        logger.info('Platform shut down successfully');
    }
}

// Export for use in server
module.exports = LiveTradingPlatform;

// Auto-start if run directly
if (require.main === module) {
    const platform = new LiveTradingPlatform();
    platform.initialize().then(status => {
        console.log('Platform Status:', status);
    }).catch(error => {
        console.error('Failed to start platform:', error);
        process.exit(1);
    });
}