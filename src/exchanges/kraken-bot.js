const KrakenWebSocketClient = require('./kraken-websocket');
const axios = require('axios');
const crypto = require('crypto');

class KrakenTradingBot {
    constructor(config = {}) {
        this.apiKey = process.env.KRAKEN_API_KEY;
        this.apiSecret = process.env.KRAKEN_API_SECRET;
        this.username = 'southwestfungi.289038390';
        this.publicId = 'AA57 N84G 7E7Z TOJY';

        // Trading configuration
        this.config = {
            maxPositionSize: config.maxPositionSize || 1000, // Max USD per position
            stopLossPercent: config.stopLossPercent || 2, // 2% stop loss
            takeProfitPercent: config.takeProfitPercent || 5, // 5% take profit
            enableMargin: false, // Start without margin
            tradingPairs: config.tradingPairs || ['BTC/USD', 'ETH/USD'],
            ...config
        };

        this.wsClient = new KrakenWebSocketClient(this.apiKey, this.apiSecret);
        this.positions = new Map();
        this.orderBook = new Map();
        this.balance = { USD: 0, BTC: 0, ETH: 0 };
    }

    // Initialize the bot
    async initialize() {
        try {
            console.log(`Initializing Kraken Trading Bot for user: ${this.username}`);

            // Connect to WebSocket
            await this.wsClient.connectAuth();
            await this.wsClient.connectPublic();

            // Set up event handlers
            this.setupEventHandlers();

            // Subscribe to market data
            this.wsClient.subscribeTicker(this.config.tradingPairs);
            this.wsClient.subscribeOrderBook(this.config.tradingPairs, 25);

            // Subscribe to account updates
            this.wsClient.subscribeOwnTrades();
            this.wsClient.subscribeOpenOrders();

            // Get initial balance
            await this.updateBalance();

            console.log('Bot initialized successfully');
            console.log('Current balance:', this.balance);
        } catch (error) {
            console.error('Failed to initialize bot:', error);
            throw error;
        }
    }

    // REST API call helper
    async krakenApi(endpoint, params = {}) {
        const nonce = Date.now() * 1000;
        const postData = `nonce=${nonce}&${new URLSearchParams(params).toString()}`;
        const path = `/0/private/${endpoint}`;

        // Create signature
        const sha256 = crypto.createHash('sha256').update(nonce + postData).digest();
        const hmac = crypto.createHmac('sha512', Buffer.from(this.apiSecret, 'base64'));
        hmac.update(path + sha256);
        const signature = hmac.digest('base64');

        try {
            const response = await axios.post(
                `https://api.kraken.com${path}`,
                postData,
                {
                    headers: {
                        'API-Key': this.apiKey,
                        'API-Sign': signature,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.data.error && response.data.error.length > 0) {
                throw new Error(response.data.error.join(', '));
            }

            return response.data.result;
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error.message);
            throw error;
        }
    }

    // Update account balance
    async updateBalance() {
        try {
            const balances = await this.krakenApi('Balance');

            // Map Kraken balance codes to standard symbols
            this.balance.USD = parseFloat(balances.ZUSD || balances.USD || 0);
            this.balance.BTC = parseFloat(balances.XXBT || balances.XBT || 0);
            this.balance.ETH = parseFloat(balances.XETH || balances.ETH || 0);

            console.log('Balance updated:', this.balance);
            return this.balance;
        } catch (error) {
            console.error('Failed to update balance:', error);
        }
    }

    // Setup WebSocket event handlers
    setupEventHandlers() {
        // Ticker updates
        this.wsClient.onTickerUpdate = (data) => {
            this.analyzePriceAction(data);
        };

        // Order book updates
        this.wsClient.onOrderBookUpdate = (data) => {
            this.updateOrderBook(data);
        };

        // Order placed
        this.wsClient.onOrderPlaced = (result) => {
            console.log(`Order placed: ${result.order_id}`);
            this.trackOrder(result);
        };

        // Trade executed
        this.wsClient.onTradeExecuted = (trade) => {
            console.log(`Trade executed: ${trade.symbol} ${trade.side} ${trade.qty} @ ${trade.price}`);
            this.updatePosition(trade);
        };

        // Order updates
        this.wsClient.onOrderUpdate = (orders) => {
            this.manageOrders(orders);
        };

        // Error handling
        this.wsClient.onOrderError = (error) => {
            console.error('Order error:', error);
        };
    }

    // Analyze price action for trading signals
    analyzePriceAction(ticker) {
        const symbol = ticker.symbol;
        const price = parseFloat(ticker.last);
        const volume = parseFloat(ticker.volume_24h);
        const change24h = parseFloat(ticker.price_change_pct_24h);

        console.log(`${symbol}: $${price} (${change24h > 0 ? '+' : ''}${change24h}%)`);

        // Simple trading strategy example
        if (this.shouldBuy(symbol, price, change24h, volume)) {
            this.executeBuy(symbol, price);
        } else if (this.shouldSell(symbol, price, change24h)) {
            this.executeSell(symbol, price);
        }
    }

    // Buy signal logic
    shouldBuy(symbol, price, change24h, volume) {
        // Example criteria (customize based on your strategy)
        const hasPosition = this.positions.has(symbol);
        const hasBalance = this.balance.USD > this.config.maxPositionSize;
        const isBullish = change24h > -5 && change24h < 2; // Slight dip, potential bounce
        const hasVolume = volume > 100; // Minimum volume threshold

        return !hasPosition && hasBalance && isBullish && hasVolume;
    }

    // Sell signal logic
    shouldSell(symbol, price, change24h) {
        const position = this.positions.get(symbol);
        if (!position) return false;

        const profitPercent = ((price - position.avgPrice) / position.avgPrice) * 100;

        // Take profit or stop loss
        return profitPercent >= this.config.takeProfitPercent ||
               profitPercent <= -this.config.stopLossPercent;
    }

    // Execute buy order
    async executeBuy(symbol, currentPrice) {
        try {
            const orderSize = this.config.maxPositionSize;
            const quantity = orderSize / currentPrice;

            console.log(`Placing BUY order: ${quantity.toFixed(8)} ${symbol} @ market`);

            // Place market buy with OTO (One-Triggers-Other) for stop loss and take profit
            const stopLoss = currentPrice * (1 - this.config.stopLossPercent / 100);
            const takeProfit = currentPrice * (1 + this.config.takeProfitPercent / 100);

            this.wsClient.addMarketOrder(symbol, 'buy', quantity, {
                quoteOrderQty: orderSize
            });

            // Track pending position
            this.positions.set(symbol, {
                symbol: symbol,
                side: 'long',
                quantity: quantity,
                avgPrice: currentPrice,
                stopLoss: stopLoss,
                takeProfit: takeProfit,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('Buy order failed:', error);
        }
    }

    // Execute sell order
    async executeSell(symbol, currentPrice) {
        try {
            const position = this.positions.get(symbol);
            if (!position) return;

            console.log(`Placing SELL order: ${position.quantity.toFixed(8)} ${symbol} @ market`);

            this.wsClient.addMarketOrder(symbol, 'sell', position.quantity);

            // Calculate profit/loss
            const pnl = (currentPrice - position.avgPrice) * position.quantity;
            const pnlPercent = ((currentPrice - position.avgPrice) / position.avgPrice) * 100;

            console.log(`Closing position: ${symbol} P&L: $${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);

            // Remove position
            this.positions.delete(symbol);

        } catch (error) {
            console.error('Sell order failed:', error);
        }
    }

    // Update order book
    updateOrderBook(data) {
        const symbol = data.symbol;
        this.orderBook.set(symbol, {
            bids: data.bids || [],
            asks: data.asks || [],
            timestamp: Date.now()
        });
    }

    // Track orders
    trackOrder(order) {
        console.log(`Tracking order ${order.order_id} for ${order.cl_ord_id || 'N/A'}`);
    }

    // Update positions after trade
    updatePosition(trade) {
        const position = this.positions.get(trade.symbol);

        if (position) {
            if (trade.side === 'buy') {
                // Add to position
                const totalCost = (position.avgPrice * position.quantity) + (trade.price * trade.qty);
                position.quantity += trade.qty;
                position.avgPrice = totalCost / position.quantity;
            } else {
                // Reduce position
                position.quantity -= trade.qty;
                if (position.quantity <= 0) {
                    this.positions.delete(trade.symbol);
                }
            }
        }

        // Update balance after trade
        this.updateBalance();
    }

    // Manage open orders
    manageOrders(orders) {
        for (const order of orders) {
            console.log(`Open order: ${order.order_id} - ${order.symbol} ${order.side} ${order.qty} @ ${order.price}`);
        }
    }

    // Get account info
    async getAccountInfo() {
        try {
            const balance = await this.krakenApi('Balance');
            const tradeBalance = await this.krakenApi('TradeBalance', { asset: 'USD' });
            const openOrders = await this.krakenApi('OpenOrders');
            const openPositions = await this.krakenApi('OpenPositions');

            return {
                username: this.username,
                publicId: this.publicId,
                balance: balance,
                tradeBalance: tradeBalance,
                openOrders: openOrders,
                openPositions: openPositions,
                botPositions: Array.from(this.positions.values())
            };
        } catch (error) {
            console.error('Failed to get account info:', error);
            return null;
        }
    }

    // Start trading
    async startTrading() {
        console.log('Starting automated trading...');
        console.log('Trading pairs:', this.config.tradingPairs);
        console.log('Max position size:', `$${this.config.maxPositionSize}`);
        console.log('Stop loss:', `${this.config.stopLossPercent}%`);
        console.log('Take profit:', `${this.config.takeProfitPercent}%`);

        // Initialize and start
        await this.initialize();

        // Periodic balance check
        setInterval(() => {
            this.updateBalance();
        }, 60000); // Every minute

        // Periodic status report
        setInterval(() => {
            this.printStatus();
        }, 300000); // Every 5 minutes
    }

    // Print bot status
    printStatus() {
        console.log('\n=== Bot Status ===');
        console.log(`Time: ${new Date().toISOString()}`);
        console.log(`Balance: USD: $${this.balance.USD.toFixed(2)}, BTC: ${this.balance.BTC}, ETH: ${this.balance.ETH}`);
        console.log(`Active positions: ${this.positions.size}`);

        for (const [symbol, position] of this.positions) {
            console.log(`  ${symbol}: ${position.quantity} @ $${position.avgPrice}`);
        }
        console.log('==================\n');
    }

    // Stop trading
    stop() {
        console.log('Stopping bot...');
        this.wsClient.disconnect();
    }
}

module.exports = KrakenTradingBot;