// Crow-e Crypto - Trading Engine
// Core trading logic and automation

const EventEmitter = require('events');

class TradingEngine extends EventEmitter {
    constructor(exchangeManager, walletManager, marketDataService) {
        super();
        this.exchangeManager = exchangeManager;
        this.walletManager = walletManager;
        this.marketDataService = marketDataService;
        this.activeTrades = new Map();
        this.automatedStrategies = new Map();
        this.running = false;
    }

    // Execute a trade
    async executeTrade(params) {
        const { userId, exchange, symbol, side, amount, type = 'market', price } = params;

        try {
            // Validate user has sufficient balance
            const balance = await this.exchangeManager.fetchBalance(userId, exchange);

            // Place order on exchange
            const order = await this.exchangeManager.placeOrder(userId, exchange, {
                symbol,
                type,
                side,
                amount,
                price
            });

            // Store trade in database
            const supabase = require('../services/SupabaseService');
            await supabase.saveTrade({
                user_id: userId,
                exchange,
                symbol,
                side,
                type,
                price: order.price,
                amount: order.amount,
                total: order.price * order.amount,
                fee: order.fee || 0,
                status: order.status,
                order_id: order.id
            });

            // Emit trade event
            this.emit('trade-executed', { userId, order });

            return order;

        } catch (error) {
            console.error('Trade execution error:', error);
            this.emit('trade-error', { userId, error: error.message });
            throw error;
        }
    }

    // Start automated trading for a user
    async startAutomatedTrading(userId, config) {
        try {
            const strategy = {
                userId,
                config,
                active: true,
                startedAt: Date.now(),
                trades: [],
                performance: {
                    wins: 0,
                    losses: 0,
                    totalProfit: 0
                }
            };

            this.automatedStrategies.set(userId, strategy);

            // Start the trading loop
            this.runAutomatedStrategy(userId);

            return { success: true, message: 'Automated trading started' };

        } catch (error) {
            console.error('Failed to start automated trading:', error);
            throw error;
        }
    }

    // Run automated strategy
    async runAutomatedStrategy(userId) {
        const strategy = this.automatedStrategies.get(userId);
        if (!strategy || !strategy.active) return;

        try {
            const { config } = strategy;

            // Analyze market conditions
            const marketAnalysis = await this.analyzeMarkets(config.marketPairs);

            // Detect trading opportunities
            const opportunities = this.detectOpportunities(marketAnalysis, config);

            // Execute trades based on opportunities
            for (const opportunity of opportunities) {
                if (this.validateOpportunity(opportunity, config)) {
                    await this.executeTrade({
                        userId,
                        exchange: config.exchange,
                        symbol: opportunity.symbol,
                        side: opportunity.side,
                        amount: this.calculatePositionSize(opportunity, config),
                        type: 'limit',
                        price: opportunity.price
                    });

                    strategy.trades.push(opportunity);
                }
            }

            // Schedule next run
            setTimeout(() => {
                this.runAutomatedStrategy(userId);
            }, config.interval || 60000); // Default 1 minute

        } catch (error) {
            console.error('Automated strategy error:', error);
            this.emit('strategy-error', { userId, error: error.message });
        }
    }

    // Analyze markets
    async analyzeMarkets(pairs) {
        const analysis = {};

        for (const pair of pairs) {
            try {
                // Get market data from multiple exchanges
                const marketData = await this.marketDataService.getAggregatedPrices([pair]);

                // Calculate technical indicators
                const indicators = await this.calculateIndicators(pair);

                analysis[pair] = {
                    ...marketData,
                    ...indicators,
                    timestamp: Date.now()
                };

            } catch (error) {
                console.error(`Failed to analyze ${pair}:`, error);
            }
        }

        return analysis;
    }

    // Detect trading opportunities
    detectOpportunities(marketAnalysis, config) {
        const opportunities = [];

        for (const [pair, data] of Object.entries(marketAnalysis)) {
            // Check for volatility
            if (data.volatility > config.volatilityThreshold) {
                // Determine trade direction based on indicators
                const side = this.determineTradeDirection(data);

                if (side) {
                    opportunities.push({
                        symbol: pair,
                        side,
                        price: data.price,
                        volatility: data.volatility,
                        confidence: this.calculateConfidence(data),
                        timestamp: Date.now()
                    });
                }
            }
        }

        return opportunities;
    }

    // Validate opportunity
    validateOpportunity(opportunity, config) {
        // Check confidence threshold
        if (opportunity.confidence < config.minConfidence) return false;

        // Check maximum positions
        const userTrades = Array.from(this.activeTrades.values())
            .filter(t => t.userId === config.userId);

        if (userTrades.length >= config.maxPositions) return false;

        // Risk management checks
        const risk = this.calculateRisk(opportunity, config);
        if (risk > config.maxRisk) return false;

        return true;
    }

    // Calculate position size
    calculatePositionSize(opportunity, config) {
        const baseSize = config.positionSize || 100;
        const adjustment = opportunity.confidence;

        return baseSize * adjustment;
    }

    // Calculate technical indicators
    async calculateIndicators(pair) {
        // This would integrate with TA-Lib or similar
        return {
            rsi: Math.random() * 100,
            macd: (Math.random() - 0.5) * 10,
            bollingerBands: {
                upper: 50000,
                middle: 48000,
                lower: 46000
            },
            ema: {
                ema12: 47500,
                ema26: 47800
            },
            volume: Math.random() * 1000000
        };
    }

    // Determine trade direction
    determineTradeDirection(data) {
        // Simplified logic - in production, use complex strategy
        if (data.rsi < 30) return 'buy';
        if (data.rsi > 70) return 'sell';
        if (data.macd > 0) return 'buy';
        if (data.macd < 0) return 'sell';

        return null;
    }

    // Calculate confidence
    calculateConfidence(data) {
        let confidence = 0.5;

        // RSI confidence
        if (data.rsi < 30 || data.rsi > 70) confidence += 0.2;

        // MACD confidence
        if (Math.abs(data.macd) > 5) confidence += 0.2;

        // Volume confidence
        if (data.volume > 500000) confidence += 0.1;

        return Math.min(confidence, 1);
    }

    // Calculate risk
    calculateRisk(opportunity, config) {
        const positionSize = this.calculatePositionSize(opportunity, config);
        const maxLoss = positionSize * 0.02; // 2% stop loss

        return maxLoss / config.totalBalance;
    }

    // Stop automated trading
    async stopAutomatedTrading(userId) {
        const strategy = this.automatedStrategies.get(userId);

        if (strategy) {
            strategy.active = false;
            this.automatedStrategies.delete(userId);

            return { success: true, message: 'Automated trading stopped' };
        }

        return { success: false, message: 'No active strategy found' };
    }

    // Get portfolio summary
    async getPortfolioSummary(userId) {
        const supabase = require('../services/SupabaseService');

        // Get portfolio from database
        const portfolio = await supabase.getPortfolio(userId);

        // Get current balances from exchanges
        const balances = {};
        for (const exchange of ['coinbase', 'binance', 'kraken']) {
            try {
                const balance = await this.exchangeManager.fetchBalance(userId, exchange);
                if (balance) {
                    balances[exchange] = balance;
                }
            } catch (error) {
                console.error(`Failed to fetch ${exchange} balance:`, error);
            }
        }

        // Calculate total value
        const totalValue = this.calculateTotalValue(balances);

        return {
            totalValue,
            balances,
            positions: portfolio?.positions || [],
            metrics: portfolio?.metrics || {},
            lastUpdated: Date.now()
        };
    }

    // Calculate total portfolio value
    calculateTotalValue(balances) {
        let total = 0;

        for (const [exchange, balance] of Object.entries(balances)) {
            for (const [currency, amount] of Object.entries(balance.total || {})) {
                // Convert to USD (simplified - use real rates in production)
                const usdValue = this.convertToUSD(currency, amount);
                total += usdValue;
            }
        }

        return total;
    }

    // Convert currency to USD
    convertToUSD(currency, amount) {
        // Simplified conversion - integrate with price feeds in production
        const rates = {
            BTC: 45000,
            ETH: 2500,
            BNB: 300,
            USDT: 1,
            USD: 1
        };

        return amount * (rates[currency] || 0);
    }

    // Get trading history
    async getTradingHistory(userId, options) {
        const supabase = require('../services/SupabaseService');
        return await supabase.getUserTrades(userId, options);
    }

    // Subscribe to user events
    subscribeToUserEvents(userId, socket) {
        // Subscribe to trade events
        this.on('trade-executed', (data) => {
            if (data.userId === userId) {
                socket.emit('trade-executed', data.order);
            }
        });

        // Subscribe to strategy events
        this.on('strategy-error', (data) => {
            if (data.userId === userId) {
                socket.emit('strategy-error', data.error);
            }
        });
    }

    // Update all portfolios
    async updateAllPortfolios() {
        for (const [userId, strategy] of this.automatedStrategies) {
            try {
                const portfolio = await this.getPortfolioSummary(userId);

                // Save to database
                const supabase = require('../services/SupabaseService');
                await supabase.updatePortfolio(userId, portfolio);

            } catch (error) {
                console.error(`Failed to update portfolio for ${userId}:`, error);
            }
        }
    }

    // Check if engine is running
    isRunning() {
        return this.running;
    }

    // Start the trading engine
    start() {
        this.running = true;
        this.emit('engine-started');
    }

    // Stop the trading engine
    stop() {
        this.running = false;

        // Stop all automated strategies
        for (const [userId, strategy] of this.automatedStrategies) {
            strategy.active = false;
        }

        this.automatedStrategies.clear();
        this.emit('engine-stopped');
    }
}

module.exports = TradingEngine;