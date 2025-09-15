// Strategy Manager - Automated trading strategies
const EventEmitter = require('events');

class StrategyManager extends EventEmitter {
    constructor(tradingEngine, marketDataService) {
        super();
        this.tradingEngine = tradingEngine;
        this.marketDataService = marketDataService;
        this.activeStrategies = new Map();
        this.strategyTemplates = this.initializeStrategyTemplates();
    }

    // Initialize built-in strategy templates
    initializeStrategyTemplates() {
        return {
            dca: {
                name: 'Dollar Cost Averaging',
                description: 'Buy a fixed amount at regular intervals',
                parameters: {
                    symbol: { type: 'string', required: true },
                    amount: { type: 'number', required: true },
                    interval: { type: 'string', required: true, options: ['hourly', 'daily', 'weekly'] },
                    exchange: { type: 'string', required: true }
                }
            },
            smaGrid: {
                name: 'SMA Grid Trading',
                description: 'Buy/sell based on SMA crossovers with grid levels',
                parameters: {
                    symbol: { type: 'string', required: true },
                    shortPeriod: { type: 'number', required: true, default: 20 },
                    longPeriod: { type: 'number', required: true, default: 50 },
                    gridLevels: { type: 'number', required: true, default: 5 },
                    gridSpacing: { type: 'number', required: true, default: 2 },
                    positionSize: { type: 'number', required: true },
                    exchange: { type: 'string', required: true }
                }
            },
            meanReversion: {
                name: 'Mean Reversion',
                description: 'Buy oversold, sell overbought based on RSI and Bollinger Bands',
                parameters: {
                    symbol: { type: 'string', required: true },
                    rsiPeriod: { type: 'number', required: true, default: 14 },
                    rsiOversold: { type: 'number', required: true, default: 30 },
                    rsiOverbought: { type: 'number', required: true, default: 70 },
                    bbPeriod: { type: 'number', required: true, default: 20 },
                    bbStdDev: { type: 'number', required: true, default: 2 },
                    positionSize: { type: 'number', required: true },
                    exchange: { type: 'string', required: true }
                }
            },
            momentum: {
                name: 'Momentum Trading',
                description: 'Follow trends using MACD and price momentum',
                parameters: {
                    symbol: { type: 'string', required: true },
                    macdFast: { type: 'number', required: true, default: 12 },
                    macdSlow: { type: 'number', required: true, default: 26 },
                    macdSignal: { type: 'number', required: true, default: 9 },
                    momentumPeriod: { type: 'number', required: true, default: 14 },
                    stopLoss: { type: 'number', required: true, default: 5 },
                    takeProfit: { type: 'number', required: true, default: 10 },
                    positionSize: { type: 'number', required: true },
                    exchange: { type: 'string', required: true }
                }
            },
            arbitrage: {
                name: 'Exchange Arbitrage',
                description: 'Profit from price differences between exchanges',
                parameters: {
                    symbol: { type: 'string', required: true },
                    exchanges: { type: 'array', required: true },
                    minSpread: { type: 'number', required: true, default: 0.5 },
                    positionSize: { type: 'number', required: true }
                }
            }
        };
    }

    // Create a new strategy
    async createStrategy(userId, strategyConfig) {
        try {
            const strategy = {
                id: this.generateStrategyId(),
                userId,
                name: strategyConfig.name,
                type: strategyConfig.type,
                parameters: strategyConfig.parameters,
                status: 'inactive',
                createdAt: new Date().toISOString(),
                performance: {
                    totalTrades: 0,
                    winningTrades: 0,
                    losingTrades: 0,
                    totalProfit: 0,
                    totalLoss: 0,
                    winRate: 0,
                    profitFactor: 0
                },
                lastExecuted: null
            };

            // Validate strategy parameters
            this.validateStrategy(strategy);

            // Save to database
            await this.saveStrategy(strategy);

            this.emit('strategyCreated', { userId, strategy });

            return strategy;

        } catch (error) {
            console.error('Strategy creation error:', error);
            throw error;
        }
    }

    // Validate strategy configuration
    validateStrategy(strategy) {
        const template = this.strategyTemplates[strategy.type];
        if (!template) {
            throw new Error(`Unknown strategy type: ${strategy.type}`);
        }

        for (const [param, config] of Object.entries(template.parameters)) {
            const value = strategy.parameters[param];

            if (config.required && (value === undefined || value === null)) {
                throw new Error(`Missing required parameter: ${param}`);
            }

            if (value !== undefined) {
                if (config.type === 'number' && typeof value !== 'number') {
                    throw new Error(`Parameter ${param} must be a number`);
                }
                if (config.type === 'string' && typeof value !== 'string') {
                    throw new Error(`Parameter ${param} must be a string`);
                }
                if (config.options && !config.options.includes(value)) {
                    throw new Error(`Parameter ${param} must be one of: ${config.options.join(', ')}`);
                }
            }
        }
    }

    // Activate a strategy
    async activateStrategy(userId, strategyId) {
        try {
            const strategy = await this.getStrategy(userId, strategyId);
            if (!strategy) {
                throw new Error('Strategy not found');
            }

            strategy.status = 'active';
            strategy.activatedAt = new Date().toISOString();

            await this.updateStrategy(strategy);

            // Add to active strategies
            this.activeStrategies.set(strategyId, strategy);

            this.emit('strategyActivated', { userId, strategy });

            return { success: true, strategy };

        } catch (error) {
            console.error('Strategy activation error:', error);
            throw error;
        }
    }

    // Deactivate a strategy
    async deactivateStrategy(userId, strategyId) {
        try {
            const strategy = await this.getStrategy(userId, strategyId);
            if (!strategy) {
                throw new Error('Strategy not found');
            }

            strategy.status = 'inactive';
            strategy.deactivatedAt = new Date().toISOString();

            await this.updateStrategy(strategy);

            // Remove from active strategies
            this.activeStrategies.delete(strategyId);

            this.emit('strategyDeactivated', { userId, strategy });

            return { success: true, strategy };

        } catch (error) {
            console.error('Strategy deactivation error:', error);
            throw error;
        }
    }

    // Execute all active strategies
    async executeActiveStrategies() {
        for (const [strategyId, strategy] of this.activeStrategies) {
            try {
                await this.executeStrategy(strategy);
            } catch (error) {
                console.error(`Strategy execution error for ${strategyId}:`, error);

                // Deactivate strategy if too many errors
                strategy.errorCount = (strategy.errorCount || 0) + 1;
                if (strategy.errorCount >= 5) {
                    await this.deactivateStrategy(strategy.userId, strategyId);
                    this.emit('strategyError', { strategy, error: 'Too many execution errors' });
                }
            }
        }
    }

    // Execute a specific strategy
    async executeStrategy(strategy) {
        try {
            const shouldExecute = await this.shouldExecuteStrategy(strategy);
            if (!shouldExecute) {
                return;
            }

            let signal = null;

            switch (strategy.type) {
                case 'dca':
                    signal = await this.executeDCAStrategy(strategy);
                    break;
                case 'smaGrid':
                    signal = await this.executeSMAGridStrategy(strategy);
                    break;
                case 'meanReversion':
                    signal = await this.executeMeanReversionStrategy(strategy);
                    break;
                case 'momentum':
                    signal = await this.executeMomentumStrategy(strategy);
                    break;
                case 'arbitrage':
                    signal = await this.executeArbitrageStrategy(strategy);
                    break;
                default:
                    throw new Error(`Unknown strategy type: ${strategy.type}`);
            }

            if (signal) {
                await this.executeTradeSignal(strategy, signal);
            }

            // Update last executed time
            strategy.lastExecuted = new Date().toISOString();
            await this.updateStrategy(strategy);

        } catch (error) {
            console.error(`Strategy execution error:`, error);
            throw error;
        }
    }

    // Check if strategy should be executed
    async shouldExecuteStrategy(strategy) {
        const now = Date.now();
        const lastExecuted = strategy.lastExecuted ? new Date(strategy.lastExecuted).getTime() : 0;

        // Strategy-specific timing
        const intervals = {
            dca: {
                hourly: 60 * 60 * 1000,
                daily: 24 * 60 * 60 * 1000,
                weekly: 7 * 24 * 60 * 60 * 1000
            }
        };

        if (strategy.type === 'dca') {
            const interval = intervals.dca[strategy.parameters.interval];
            return now - lastExecuted >= interval;
        }

        // Other strategies execute more frequently
        return now - lastExecuted >= 5 * 60 * 1000; // 5 minutes
    }

    // Execute DCA strategy
    async executeDCAStrategy(strategy) {
        const { symbol, amount, exchange } = strategy.parameters;

        return {
            type: 'market',
            side: 'buy',
            symbol,
            amount: amount,
            exchange,
            reason: 'DCA scheduled buy'
        };
    }

    // Execute SMA Grid strategy
    async executeSMAGridStrategy(strategy) {
        const { symbol, shortPeriod, longPeriod, exchange } = strategy.parameters;

        // Get market data and calculate SMAs
        const indicators = await this.marketDataService.calculateIndicators(exchange, symbol);

        if (!indicators || !indicators.sma20 || !indicators.sma50) {
            return null;
        }

        const shortSMA = indicators.sma20;
        const longSMA = indicators.sma50;
        const currentPrice = await this.getCurrentPrice(exchange, symbol);

        // Simple crossover signal
        if (shortSMA > longSMA && currentPrice > shortSMA) {
            return {
                type: 'market',
                side: 'buy',
                symbol,
                amount: strategy.parameters.positionSize,
                exchange,
                reason: 'SMA bullish crossover'
            };
        } else if (shortSMA < longSMA && currentPrice < shortSMA) {
            return {
                type: 'market',
                side: 'sell',
                symbol,
                amount: strategy.parameters.positionSize,
                exchange,
                reason: 'SMA bearish crossover'
            };
        }

        return null;
    }

    // Execute Mean Reversion strategy
    async executeMeanReversionStrategy(strategy) {
        const { symbol, rsiOversold, rsiOverbought, exchange } = strategy.parameters;

        const indicators = await this.marketDataService.calculateIndicators(exchange, symbol);

        if (!indicators || !indicators.rsi || !indicators.bollinger) {
            return null;
        }

        const rsi = indicators.rsi;
        const bollinger = indicators.bollinger;
        const currentPrice = await this.getCurrentPrice(exchange, symbol);

        // Oversold signal
        if (rsi < rsiOversold && currentPrice <= bollinger.lower) {
            return {
                type: 'limit',
                side: 'buy',
                symbol,
                amount: strategy.parameters.positionSize,
                price: currentPrice * 0.999, // Slightly below current price
                exchange,
                reason: 'Mean reversion buy signal'
            };
        }

        // Overbought signal
        if (rsi > rsiOverbought && currentPrice >= bollinger.upper) {
            return {
                type: 'limit',
                side: 'sell',
                symbol,
                amount: strategy.parameters.positionSize,
                price: currentPrice * 1.001, // Slightly above current price
                exchange,
                reason: 'Mean reversion sell signal'
            };
        }

        return null;
    }

    // Execute Momentum strategy
    async executeMomentumStrategy(strategy) {
        const { symbol, exchange, stopLoss, takeProfit } = strategy.parameters;

        const indicators = await this.marketDataService.calculateIndicators(exchange, symbol);

        if (!indicators || !indicators.macd) {
            return null;
        }

        const macd = indicators.macd;
        const currentPrice = await this.getCurrentPrice(exchange, symbol);

        // Bullish momentum
        if (macd.macd > macd.signal && macd.histogram > 0) {
            return {
                type: 'market',
                side: 'buy',
                symbol,
                amount: strategy.parameters.positionSize,
                exchange,
                stopLoss,
                takeProfit,
                reason: 'Momentum buy signal'
            };
        }

        // Bearish momentum
        if (macd.macd < macd.signal && macd.histogram < 0) {
            return {
                type: 'market',
                side: 'sell',
                symbol,
                amount: strategy.parameters.positionSize,
                exchange,
                stopLoss,
                takeProfit,
                reason: 'Momentum sell signal'
            };
        }

        return null;
    }

    // Execute Arbitrage strategy
    async executeArbitrageStrategy(strategy) {
        const { symbol, exchanges, minSpread } = strategy.parameters;

        const prices = {};

        // Get prices from all exchanges
        for (const exchange of exchanges) {
            try {
                prices[exchange] = await this.getCurrentPrice(exchange, symbol);
            } catch (error) {
                console.error(`Failed to get price from ${exchange}:`, error);
            }
        }

        // Find arbitrage opportunities
        const exchangeList = Object.keys(prices);
        if (exchangeList.length < 2) {
            return null;
        }

        let maxSpread = 0;
        let buyExchange = null;
        let sellExchange = null;

        for (let i = 0; i < exchangeList.length; i++) {
            for (let j = i + 1; j < exchangeList.length; j++) {
                const exchange1 = exchangeList[i];
                const exchange2 = exchangeList[j];
                const price1 = prices[exchange1];
                const price2 = prices[exchange2];

                const spread = Math.abs(price1 - price2) / Math.min(price1, price2) * 100;

                if (spread > maxSpread && spread >= minSpread) {
                    maxSpread = spread;
                    if (price1 < price2) {
                        buyExchange = exchange1;
                        sellExchange = exchange2;
                    } else {
                        buyExchange = exchange2;
                        sellExchange = exchange1;
                    }
                }
            }
        }

        if (buyExchange && sellExchange) {
            // Execute arbitrage
            return [
                {
                    type: 'market',
                    side: 'buy',
                    symbol,
                    amount: strategy.parameters.positionSize,
                    exchange: buyExchange,
                    reason: `Arbitrage buy on ${buyExchange}`
                },
                {
                    type: 'market',
                    side: 'sell',
                    symbol,
                    amount: strategy.parameters.positionSize,
                    exchange: sellExchange,
                    reason: `Arbitrage sell on ${sellExchange}`
                }
            ];
        }

        return null;
    }

    // Execute trade signal
    async executeTradeSignal(strategy, signal) {
        try {
            if (Array.isArray(signal)) {
                // Multiple trades (e.g., arbitrage)
                for (const trade of signal) {
                    await this.tradingEngine.placeOrder(
                        strategy.userId,
                        trade.exchange,
                        trade
                    );
                }
            } else {
                // Single trade
                await this.tradingEngine.placeOrder(
                    strategy.userId,
                    signal.exchange,
                    signal
                );
            }

            // Update strategy performance
            await this.updateStrategyPerformance(strategy, signal);

            this.emit('strategyTradeExecuted', { strategy, signal });

        } catch (error) {
            console.error('Trade signal execution error:', error);
            throw error;
        }
    }

    // Update strategy performance
    async updateStrategyPerformance(strategy, signal) {
        strategy.performance.totalTrades++;

        // Track performance would require tracking trade outcomes
        // This is simplified for now
        await this.updateStrategy(strategy);
    }

    // Get current price
    async getCurrentPrice(exchange, symbol) {
        const ticker = await this.marketDataService.getTicker(exchange, symbol);
        return ticker.last;
    }

    // Get user's strategies
    async getUserStrategies(userId) {
        // This would fetch from database
        // Placeholder implementation
        return Array.from(this.activeStrategies.values())
            .filter(strategy => strategy.userId === userId);
    }

    // Generate strategy ID
    generateStrategyId() {
        return 'strategy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Save strategy to database (placeholder)
    async saveStrategy(strategy) {
        // Would save to Supabase
        console.log('Saving strategy:', strategy.name);
    }

    // Update strategy in database (placeholder)
    async updateStrategy(strategy) {
        // Would update in Supabase
        console.log('Updating strategy:', strategy.name);
    }

    // Get strategy from database (placeholder)
    async getStrategy(userId, strategyId) {
        return this.activeStrategies.get(strategyId);
    }

    // Get strategy templates
    getStrategyTemplates() {
        return this.strategyTemplates;
    }

    // Backtest a strategy
    async backtestStrategy(strategyConfig, startDate, endDate) {
        // This would run historical simulation
        // Placeholder implementation
        return {
            totalReturn: 15.5,
            winRate: 0.65,
            maxDrawdown: 8.2,
            sharpeRatio: 1.4,
            totalTrades: 45,
            winningTrades: 29,
            losingTrades: 16
        };
    }
}

module.exports = StrategyManager;