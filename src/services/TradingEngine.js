// Trading Engine - Core trading logic and order management
const EventEmitter = require('events');
const winston = require('winston');

class TradingEngine extends EventEmitter {
    constructor(exchangeManager) {
        super();
        this.exchangeManager = exchangeManager;
        this.activeOrders = new Map();
        this.positions = new Map();

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'trading-engine.log' })
            ]
        });
    }

    // Place order with risk management
    async placeOrder(userId, exchange, orderParams) {
        try {
            // Validate order parameters
            this.validateOrder(orderParams);

            // Check risk limits
            await this.checkRiskLimits(userId, orderParams);

            // Calculate position size
            const positionSize = await this.calculatePositionSize(userId, orderParams);

            // Place the order
            const order = await this.exchangeManager.placeOrder(userId, exchange, {
                ...orderParams,
                amount: positionSize
            });

            // Track the order
            this.trackOrder(userId, order);

            // Set stop loss and take profit if specified
            if (orderParams.stopLoss || orderParams.takeProfit) {
                await this.setProtectionOrders(userId, exchange, order, orderParams);
            }

            this.emit('orderPlaced', { userId, order });
            this.logger.info(`Order placed: ${JSON.stringify(order)}`);

            return order;

        } catch (error) {
            this.logger.error(`Order placement failed: ${error.message}`);
            throw error;
        }
    }

    // Validate order parameters
    validateOrder(orderParams) {
        const { symbol, type, side, amount, price } = orderParams;

        if (!symbol || !type || !side || !amount) {
            throw new Error('Missing required order parameters');
        }

        if (!['market', 'limit', 'stop'].includes(type)) {
            throw new Error('Invalid order type');
        }

        if (!['buy', 'sell'].includes(side)) {
            throw new Error('Invalid order side');
        }

        if (amount <= 0) {
            throw new Error('Invalid order amount');
        }

        if (type === 'limit' && !price) {
            throw new Error('Price required for limit orders');
        }
    }

    // Check risk management limits
    async checkRiskLimits(userId, orderParams) {
        const maxPositionSize = parseFloat(process.env.MAX_POSITION_SIZE || 10000);
        const userPositions = this.positions.get(userId) || [];

        // Calculate total exposure
        const totalExposure = userPositions.reduce((sum, pos) => {
            return sum + (pos.amount * pos.price);
        }, 0);

        const newExposure = orderParams.amount * (orderParams.price || 0);

        if (totalExposure + newExposure > maxPositionSize) {
            throw new Error('Position size exceeds risk limits');
        }

        // Check maximum number of open positions
        const maxOpenPositions = 10;
        if (userPositions.length >= maxOpenPositions) {
            throw new Error('Maximum number of open positions reached');
        }
    }

    // Calculate optimal position size
    async calculatePositionSize(userId, orderParams) {
        // Kelly Criterion or fixed percentage risk
        const riskPercentage = 0.02; // 2% risk per trade
        const accountBalance = await this.getAccountBalance(userId, orderParams.symbol);

        if (orderParams.useKellyCriterion) {
            return this.kellyCriterion(accountBalance, orderParams);
        }

        return Math.min(
            orderParams.amount,
            accountBalance * riskPercentage / (orderParams.stopLossPercentage || 5) * 100
        );
    }

    // Kelly Criterion position sizing
    kellyCriterion(balance, orderParams) {
        const winRate = orderParams.winRate || 0.55;
        const avgWin = orderParams.avgWin || 1.5;
        const avgLoss = orderParams.avgLoss || 1;

        const kellyPercentage = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
        const position = balance * Math.max(0, Math.min(kellyPercentage, 0.25)); // Cap at 25%

        return position / (orderParams.price || 1);
    }

    // Set stop loss and take profit orders
    async setProtectionOrders(userId, exchange, mainOrder, params) {
        const promises = [];

        if (params.stopLoss) {
            const stopLossPrice = mainOrder.side === 'buy'
                ? mainOrder.price * (1 - params.stopLoss / 100)
                : mainOrder.price * (1 + params.stopLoss / 100);

            promises.push(
                this.exchangeManager.placeOrder(userId, exchange, {
                    symbol: mainOrder.symbol,
                    type: 'stop',
                    side: mainOrder.side === 'buy' ? 'sell' : 'buy',
                    amount: mainOrder.amount,
                    price: stopLossPrice
                })
            );
        }

        if (params.takeProfit) {
            const takeProfitPrice = mainOrder.side === 'buy'
                ? mainOrder.price * (1 + params.takeProfit / 100)
                : mainOrder.price * (1 - params.takeProfit / 100);

            promises.push(
                this.exchangeManager.placeOrder(userId, exchange, {
                    symbol: mainOrder.symbol,
                    type: 'limit',
                    side: mainOrder.side === 'buy' ? 'sell' : 'buy',
                    amount: mainOrder.amount,
                    price: takeProfitPrice
                })
            );
        }

        await Promise.all(promises);
    }

    // Track active orders
    trackOrder(userId, order) {
        if (!this.activeOrders.has(userId)) {
            this.activeOrders.set(userId, []);
        }

        this.activeOrders.get(userId).push({
            ...order,
            timestamp: Date.now()
        });
    }

    // Update position tracking
    updatePosition(userId, order) {
        if (!this.positions.has(userId)) {
            this.positions.set(userId, []);
        }

        const positions = this.positions.get(userId);
        const existingPosition = positions.find(p => p.symbol === order.symbol);

        if (existingPosition) {
            // Update existing position
            if (order.side === existingPosition.side) {
                // Adding to position
                const totalAmount = existingPosition.amount + order.amount;
                const avgPrice = (existingPosition.amount * existingPosition.price +
                                 order.amount * order.price) / totalAmount;

                existingPosition.amount = totalAmount;
                existingPosition.price = avgPrice;
            } else {
                // Reducing or closing position
                existingPosition.amount -= order.amount;

                if (existingPosition.amount <= 0) {
                    // Position closed
                    const index = positions.indexOf(existingPosition);
                    positions.splice(index, 1);

                    // Calculate P&L
                    const pnl = this.calculatePnL(existingPosition, order);
                    this.emit('positionClosed', { userId, position: existingPosition, pnl });
                }
            }
        } else if (order.side === 'buy') {
            // New position
            positions.push({
                symbol: order.symbol,
                side: order.side,
                amount: order.amount,
                price: order.price,
                openTime: Date.now()
            });
        }
    }

    // Calculate profit and loss
    calculatePnL(position, closeOrder) {
        const entryValue = position.amount * position.price;
        const exitValue = position.amount * closeOrder.price;

        if (position.side === 'buy') {
            return exitValue - entryValue;
        } else {
            return entryValue - exitValue;
        }
    }

    // Get account balance for a symbol
    async getAccountBalance(userId, symbol) {
        const [base, quote] = symbol.split('/');
        const balances = await this.exchangeManager.fetchBalance(userId, 'binance');
        return balances.free[quote] || 0;
    }

    // Monitor and manage orders
    async monitorOrders(userId) {
        const orders = this.activeOrders.get(userId) || [];

        for (const order of orders) {
            try {
                // Check order status
                const currentOrder = await this.exchangeManager.getOrder(
                    userId,
                    order.exchange,
                    order.id,
                    order.symbol
                );

                if (currentOrder.status === 'closed' || currentOrder.status === 'canceled') {
                    // Remove from active orders
                    const index = orders.indexOf(order);
                    orders.splice(index, 1);

                    if (currentOrder.status === 'closed') {
                        // Update position
                        this.updatePosition(userId, currentOrder);
                    }

                    this.emit('orderUpdated', { userId, order: currentOrder });
                }
            } catch (error) {
                this.logger.error(`Order monitoring error: ${error.message}`);
            }
        }
    }

    // Execute trailing stop
    async executeTrailingStop(userId, exchange, position, trailingPercent) {
        try {
            const currentPrice = await this.getCurrentPrice(exchange, position.symbol);
            const stopPrice = position.side === 'buy'
                ? currentPrice * (1 - trailingPercent / 100)
                : currentPrice * (1 + trailingPercent / 100);

            // Update stop loss if price moved favorably
            if ((position.side === 'buy' && stopPrice > position.stopLoss) ||
                (position.side === 'sell' && stopPrice < position.stopLoss)) {

                position.stopLoss = stopPrice;

                // Cancel old stop order and place new one
                await this.updateStopLoss(userId, exchange, position, stopPrice);

                this.logger.info(`Trailing stop updated for ${position.symbol}: ${stopPrice}`);
            }
        } catch (error) {
            this.logger.error(`Trailing stop error: ${error.message}`);
        }
    }

    // Get current price
    async getCurrentPrice(exchange, symbol) {
        const ticker = await this.exchangeManager.fetchTicker(exchange, symbol);
        return ticker.last;
    }

    // Update stop loss order
    async updateStopLoss(userId, exchange, position, newStopPrice) {
        // Cancel existing stop loss
        if (position.stopLossOrderId) {
            await this.exchangeManager.cancelOrder(
                userId,
                exchange,
                position.stopLossOrderId,
                position.symbol
            );
        }

        // Place new stop loss
        const stopOrder = await this.exchangeManager.placeOrder(userId, exchange, {
            symbol: position.symbol,
            type: 'stop',
            side: position.side === 'buy' ? 'sell' : 'buy',
            amount: position.amount,
            price: newStopPrice
        });

        position.stopLossOrderId = stopOrder.id;
    }

    // Get trading statistics
    async getTradingStats(userId, period = '30d') {
        const trades = await this.getTradeHistory(userId, period);

        const stats = {
            totalTrades: trades.length,
            winningTrades: 0,
            losingTrades: 0,
            totalProfit: 0,
            totalLoss: 0,
            winRate: 0,
            avgWin: 0,
            avgLoss: 0,
            profitFactor: 0,
            sharpeRatio: 0,
            maxDrawdown: 0
        };

        let equity = 10000; // Starting equity
        let peakEquity = equity;
        const returns = [];

        for (const trade of trades) {
            const pnl = trade.pnl || 0;

            if (pnl > 0) {
                stats.winningTrades++;
                stats.totalProfit += pnl;
            } else if (pnl < 0) {
                stats.losingTrades++;
                stats.totalLoss += Math.abs(pnl);
            }

            equity += pnl;
            returns.push(pnl / equity);

            // Track drawdown
            if (equity > peakEquity) {
                peakEquity = equity;
            }
            const drawdown = (peakEquity - equity) / peakEquity;
            stats.maxDrawdown = Math.max(stats.maxDrawdown, drawdown);
        }

        if (stats.totalTrades > 0) {
            stats.winRate = stats.winningTrades / stats.totalTrades;
            stats.avgWin = stats.winningTrades > 0 ? stats.totalProfit / stats.winningTrades : 0;
            stats.avgLoss = stats.losingTrades > 0 ? stats.totalLoss / stats.losingTrades : 0;
            stats.profitFactor = stats.totalLoss > 0 ? stats.totalProfit / stats.totalLoss : 0;

            // Calculate Sharpe ratio
            if (returns.length > 0) {
                const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
                const stdDev = Math.sqrt(
                    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
                );
                stats.sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
            }
        }

        return stats;
    }

    // Get trade history
    async getTradeHistory(userId, period) {
        // This would fetch from database
        // Placeholder implementation
        return [];
    }
}

module.exports = TradingEngine;