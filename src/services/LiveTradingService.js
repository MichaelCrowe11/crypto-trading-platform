// CryptoCrowe - LIVE TRADING SERVICE
// Production trading with real funds - ACTIVE DOWN TO $10

const CoinbaseAdvancedTrade = require('./CoinbaseAdvancedTrade');
const EventEmitter = require('events');
const logger = require('winston');

class LiveTradingService extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.exchange = null;
        this.balance = config.coinbase.initialBalance;
        this.positions = new Map();
        this.tradingEnabled = config.trading.enabled;
        this.isLive = true; // PRODUCTION MODE
        this.microTradeCount = 0; // Track $10-20 trades

        this.initialize();
    }

    async initialize() {
        try {
            // Initialize Coinbase Advanced Trade API
            this.exchange = new CoinbaseAdvancedTrade({
                apiKey: this.config.coinbase.apiKey,
                apiSecret: this.config.coinbase.apiSecret,
                initialBalance: this.config.coinbase.initialBalance
            });

            logger.info('🚀 Live Trading Service initialized for PRODUCTION');
            logger.info(`Exchange: Coinbase | Mode: LIVE | Balance: $${this.balance}`);
            logger.info(`💎 ACTIVE TRADING DOWN TO $10 MINIMUM`);

            // Try to load markets (won't crash if it fails)
            try {
                await this.loadMarkets();
            } catch (error) {
                logger.warn('Could not load markets:', error.message);
            }

            // Try to check balance (won't crash if it fails)
            try {
                await this.checkBalance();
            } catch (error) {
                logger.warn('Could not check balance:', error.message);
            }

            // Start trading loop
            if (this.tradingEnabled) {
                this.startTradingLoop();
            }

        } catch (error) {
            logger.error('Failed to initialize Live Trading Service:', error);
            throw error;
        }
    }

    async loadMarkets() {
        try {
            const products = await this.exchange.getProducts();
            const tradingPairs = this.config.coinbase.tradingPairs;

            logger.info(`Loaded ${products.length} markets`);
            logger.info(`Active trading pairs: ${tradingPairs.join(', ')}`);

            return products;
        } catch (error) {
            logger.warn('Could not load markets:', error.message);
            return [];
        }
    }

    async checkBalance() {
        try {
            const balance = await this.exchange.getBalance();

            // Log USD balance
            const usdBalance = balance.USD?.available || balance.USD || 0;
            const totalBalance = usdBalance;

            logger.info(`💰 Current Balance: $${totalBalance.toFixed(2)} USD`);
            logger.info(`📊 Available for trading: $${usdBalance.toFixed(2)} (Can make ${Math.floor(usdBalance / 10)} micro trades)`);

            // Check crypto balances
            const cryptoBalances = {};
            for (const currency of ['BTC', 'ETH', 'SOL', 'MATIC', 'LINK', 'ADA', 'DOT', 'AVAX', 'ATOM', 'XRP']) {
                if (balance[currency] && balance[currency].total > 0) {
                    cryptoBalances[currency] = balance[currency].total;
                }
            }

            if (Object.keys(cryptoBalances).length > 0) {
                logger.info('Crypto Holdings:', cryptoBalances);
            }

            this.balance = totalBalance;
            return balance;

        } catch (error) {
            logger.error('Failed to check balance:', error);
            throw error;
        }
    }

    async executeTrade(signal) {
        try {
            const { symbol, side, amount, confidence } = signal;

            // Safety checks for LIVE trading
            if (!this.validateTrade(signal)) {
                logger.warn(`Trade validation failed for ${symbol}`);
                return null;
            }

            // Use the new Coinbase Advanced Trade API
            const result = await this.exchange.executeTrade(signal);

            // Flag micro trades
            const isMicroTrade = amount <= 20;
            if (isMicroTrade) {
                this.microTradeCount++;
                logger.info(`🎯 MICRO TRADE #${this.microTradeCount} - Active at $${amount}`);
            }

            if (result && result.success) {
                logger.info(`✅ Trade executed successfully via Coinbase Advanced Trade`);

                // Emit trade event
                this.emit('trade', {
                    order: result,
                    balance: await this.checkBalance(),
                    microTrade: isMicroTrade
                });
            }

            return result;

        } catch (error) {
            logger.error(`Trade execution failed:`, error);
            this.emit('error', error);
            return null;
        }
    }

    validateTrade(signal) {
        const { amount, confidence } = signal;

        // Check confidence threshold (70% for micro trades)
        if (confidence < this.config.ai.decisionThreshold) {
            logger.warn(`Confidence too low: ${confidence}% < ${this.config.ai.decisionThreshold}%`);
            return false;
        }

        // Check position size - ACTIVE DOWN TO $10
        if (amount > this.config.trading.maxPositionSize) {
            logger.warn(`Position too large: $${amount} > $${this.config.trading.maxPositionSize}`);
            return false;
        }

        if (amount < this.config.trading.minPositionSize) {
            logger.warn(`Position too small: $${amount} < $${this.config.trading.minPositionSize} (minimum $10)`);
            return false;
        }

        // Log micro trade validation
        if (amount <= 20) {
            logger.info(`✅ Micro trade validated: $${amount} (Active down to $10)`);
        }

        // Check daily loss limit
        const dailyPnL = this.calculateDailyPnL();
        if (dailyPnL < -this.config.safety.dailyLossLimit) {
            logger.error(`Daily loss limit reached: $${dailyPnL}`);
            this.stopTrading();
            return false;
        }

        // Check maximum concurrent positions
        const openPositions = Array.from(this.positions.values()).filter(p => p.status === 'open').length;
        if (openPositions >= this.config.trading.diversificationLimit) {
            logger.warn(`Max concurrent positions reached: ${openPositions}/${this.config.trading.diversificationLimit}`);
            return false;
        }

        return true;
    }

    trackPosition(order, isMicroTrade = false) {
        const position = {
            id: order.id,
            symbol: order.symbol,
            side: order.side,
            amount: order.filled,
            price: order.average || order.price,
            cost: order.cost,
            timestamp: order.timestamp,
            status: 'open',
            microTrade: isMicroTrade
        };

        this.positions.set(order.id, position);

        // Tighter stop loss for micro trades
        const stopLossPercentage = isMicroTrade ? 3 : this.config.trading.stopLossPercentage;
        const takeProfitPercentage = isMicroTrade ? 5 : this.config.trading.takeProfitPercentage;

        // Set stop loss and take profit
        if (stopLossPercentage) {
            this.setStopLoss(position, stopLossPercentage);
        }

        if (takeProfitPercentage) {
            this.setTakeProfit(position, takeProfitPercentage);
        }
    }

    async setStopLoss(position, percentage) {
        try {
            const stopPrice = position.side === 'buy'
                ? position.price * (1 - percentage / 100)
                : position.price * (1 + percentage / 100);

            const stopOrder = await this.exchange.createOrder(
                position.symbol,
                'stop',
                position.side === 'buy' ? 'sell' : 'buy',
                position.amount,
                stopPrice
            );

            logger.info(`Stop loss set at $${stopPrice.toFixed(2)} for position ${position.id} ${position.microTrade ? '(MICRO)' : ''}`);
            position.stopLossId = stopOrder.id;

        } catch (error) {
            logger.error('Failed to set stop loss:', error);
        }
    }

    async setTakeProfit(position, percentage) {
        try {
            const profitPrice = position.side === 'buy'
                ? position.price * (1 + percentage / 100)
                : position.price * (1 - percentage / 100);

            const profitOrder = await this.exchange.createLimitOrder(
                position.symbol,
                position.side === 'buy' ? 'sell' : 'buy',
                position.amount,
                profitPrice
            );

            logger.info(`Take profit set at $${profitPrice.toFixed(2)} for position ${position.id} ${position.microTrade ? '(MICRO)' : ''}`);
            position.takeProfitId = profitOrder.id;

        } catch (error) {
            logger.error('Failed to set take profit:', error);
        }
    }

    calculateDailyPnL() {
        const today = new Date().setHours(0, 0, 0, 0);
        let dailyPnL = 0;
        let microTradePnL = 0;

        for (const position of this.positions.values()) {
            const positionDate = new Date(position.timestamp).setHours(0, 0, 0, 0);
            if (positionDate === today && position.status === 'closed') {
                dailyPnL += position.pnl || 0;
                if (position.microTrade) {
                    microTradePnL += position.pnl || 0;
                }
            }
        }

        logger.info(`Daily P&L: $${dailyPnL.toFixed(2)} (Micro trades: $${microTradePnL.toFixed(2)})`);
        return dailyPnL;
    }

    async startTradingLoop() {
        logger.info('🤖 Starting automated trading loop...');
        logger.info('💎 Micro trading enabled - Active down to $10');

        setInterval(async () => {
            try {
                // Get AI trading signals
                const signals = await this.getAISignals();

                // Process signals, prioritizing micro trades for diversification
                const microSignals = signals.filter(s => s.amount <= 20);
                const regularSignals = signals.filter(s => s.amount > 20);

                // Execute micro trades first
                for (const signal of microSignals) {
                    if (signal.action === 'buy' || signal.action === 'sell') {
                        await this.executeTrade(signal);
                    }
                }

                // Then regular trades
                for (const signal of regularSignals) {
                    if (signal.action === 'buy' || signal.action === 'sell') {
                        await this.executeTrade(signal);
                    }
                }

                // Update positions
                await this.updatePositions();

            } catch (error) {
                logger.error('Trading loop error:', error);
            }

        }, this.config.ai.analysisInterval);
    }

    async getAISignals() {
        // This would integrate with your AI orchestrator
        // For now, returning empty array for safety
        return [];
    }

    async updatePositions() {
        for (const [id, position] of this.positions) {
            if (position.status === 'open') {
                try {
                    const ticker = await this.exchange.fetchTicker(position.symbol);
                    const currentPrice = ticker.last;

                    const pnl = position.side === 'buy'
                        ? (currentPrice - position.price) * position.amount
                        : (position.price - currentPrice) * position.amount;

                    position.unrealizedPnL = pnl;
                    position.currentPrice = currentPrice;

                    if (position.microTrade) {
                        logger.debug(`Micro Position ${id}: PnL $${pnl.toFixed(2)}`);
                    } else {
                        logger.debug(`Position ${id}: PnL $${pnl.toFixed(2)}`);
                    }

                } catch (error) {
                    logger.error(`Failed to update position ${id}:`, error);
                }
            }
        }
    }

    stopTrading() {
        this.tradingEnabled = false;
        logger.error('🛑 TRADING STOPPED - Safety limit reached');
        this.emit('trading-stopped', {
            reason: 'Safety limit reached',
            balance: this.balance,
            microTradeCount: this.microTradeCount
        });
    }

    async getAccountInfo() {
        const balance = await this.checkBalance();
        const openPositions = Array.from(this.positions.values())
            .filter(p => p.status === 'open');

        const microPositions = openPositions.filter(p => p.microTrade);

        return {
            mode: 'LIVE PRODUCTION - ACTIVE DOWN TO $10',
            exchange: 'Coinbase Pro',
            balance,
            positions: openPositions,
            microPositions: microPositions.length,
            totalMicroTrades: this.microTradeCount,
            tradingEnabled: this.tradingEnabled,
            dailyPnL: this.calculateDailyPnL(),
            minTradeSize: this.config.trading.minPositionSize
        };
    }
}

module.exports = LiveTradingService;