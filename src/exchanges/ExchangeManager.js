// Crow-e Crypto - Multi-Exchange Manager
// Support for Coinbase, Binance, Kraken, and more

const ccxt = require('ccxt');
const crypto = require('crypto');

class ExchangeManager {
    constructor() {
        this.exchanges = new Map();
        this.supportedExchanges = {
            coinbase: {
                name: 'Coinbase Pro',
                class: ccxt.coinbasepro,
                requiredCredentials: ['apiKey', 'secret', 'password']
            },
            binance: {
                name: 'Binance',
                class: ccxt.binance,
                requiredCredentials: ['apiKey', 'secret']
            },
            kraken: {
                name: 'Kraken',
                class: ccxt.kraken,
                requiredCredentials: ['apiKey', 'secret']
            },
            ftx: {
                name: 'FTX',
                class: ccxt.ftx,
                requiredCredentials: ['apiKey', 'secret']
            },
            kucoin: {
                name: 'KuCoin',
                class: ccxt.kucoin,
                requiredCredentials: ['apiKey', 'secret', 'password']
            }
        };
    }

    // Initialize exchange connection
    async initializeExchange(userId, exchangeName, credentials) {
        try {
            const exchangeConfig = this.supportedExchanges[exchangeName];
            if (!exchangeConfig) {
                throw new Error(`Exchange ${exchangeName} not supported`);
            }

            // Decrypt credentials
            const decryptedCreds = this.decryptCredentials(credentials);

            // Create exchange instance
            const ExchangeClass = exchangeConfig.class;
            const exchange = new ExchangeClass({
                apiKey: decryptedCreds.apiKey,
                secret: decryptedCreds.secret,
                password: decryptedCreds.password,
                enableRateLimit: true,
                options: {
                    defaultType: 'spot',
                    adjustForTimeDifference: true
                }
            });

            // Test connection
            await exchange.loadMarkets();

            // Store exchange instance
            const exchangeKey = `${userId}:${exchangeName}`;
            this.exchanges.set(exchangeKey, exchange);

            return {
                success: true,
                exchange: exchangeName,
                markets: Object.keys(exchange.markets).length
            };

        } catch (error) {
            console.error('Exchange initialization error:', error);
            throw error;
        }
    }

    // Get user's exchange instance
    getExchange(userId, exchangeName) {
        const exchangeKey = `${userId}:${exchangeName}`;
        return this.exchanges.get(exchangeKey);
    }

    // Fetch balance from exchange
    async fetchBalance(userId, exchangeName) {
        try {
            const exchange = this.getExchange(userId, exchangeName);
            if (!exchange) {
                throw new Error('Exchange not connected');
            }

            const balance = await exchange.fetchBalance();

            // Format balance data
            const formattedBalance = {
                total: {},
                free: {},
                used: {},
                timestamp: Date.now()
            };

            for (const [currency, amount] of Object.entries(balance.total)) {
                if (amount > 0) {
                    formattedBalance.total[currency] = amount;
                    formattedBalance.free[currency] = balance.free[currency] || 0;
                    formattedBalance.used[currency] = balance.used[currency] || 0;
                }
            }

            return formattedBalance;

        } catch (error) {
            console.error('Balance fetch error:', error);
            throw error;
        }
    }

    // Place order
    async placeOrder(userId, exchangeName, orderParams) {
        try {
            const exchange = this.getExchange(userId, exchangeName);
            if (!exchange) {
                throw new Error('Exchange not connected');
            }

            const { symbol, type, side, amount, price } = orderParams;

            let order;
            if (type === 'market') {
                order = await exchange.createMarketOrder(symbol, side, amount);
            } else if (type === 'limit') {
                order = await exchange.createLimitOrder(symbol, side, amount, price);
            } else if (type === 'stop') {
                order = await exchange.createStopLossOrder(symbol, side, amount, price);
            }

            return {
                id: order.id,
                symbol: order.symbol,
                type: order.type,
                side: order.side,
                price: order.price,
                amount: order.amount,
                status: order.status,
                timestamp: order.timestamp,
                exchange: exchangeName
            };

        } catch (error) {
            console.error('Order placement error:', error);
            throw error;
        }
    }

    // Cancel order
    async cancelOrder(userId, exchangeName, orderId, symbol) {
        try {
            const exchange = this.getExchange(userId, exchangeName);
            if (!exchange) {
                throw new Error('Exchange not connected');
            }

            const result = await exchange.cancelOrder(orderId, symbol);
            return result;

        } catch (error) {
            console.error('Order cancellation error:', error);
            throw error;
        }
    }

    // Fetch open orders
    async fetchOpenOrders(userId, exchangeName, symbol = undefined) {
        try {
            const exchange = this.getExchange(userId, exchangeName);
            if (!exchange) {
                throw new Error('Exchange not connected');
            }

            const orders = await exchange.fetchOpenOrders(symbol);

            return orders.map(order => ({
                id: order.id,
                symbol: order.symbol,
                type: order.type,
                side: order.side,
                price: order.price,
                amount: order.amount,
                filled: order.filled,
                remaining: order.remaining,
                status: order.status,
                timestamp: order.timestamp
            }));

        } catch (error) {
            console.error('Open orders fetch error:', error);
            throw error;
        }
    }

    // Fetch order history
    async fetchOrderHistory(userId, exchangeName, symbol = undefined, limit = 100) {
        try {
            const exchange = this.getExchange(userId, exchangeName);
            if (!exchange) {
                throw new Error('Exchange not connected');
            }

            const orders = await exchange.fetchClosedOrders(symbol, undefined, limit);

            return orders.map(order => ({
                id: order.id,
                symbol: order.symbol,
                type: order.type,
                side: order.side,
                price: order.price,
                amount: order.amount,
                cost: order.cost,
                filled: order.filled,
                status: order.status,
                timestamp: order.timestamp,
                fee: order.fee
            }));

        } catch (error) {
            console.error('Order history fetch error:', error);
            throw error;
        }
    }

    // Fetch ticker data
    async fetchTicker(exchangeName, symbol) {
        try {
            // Use a public exchange instance for ticker data
            const ExchangeClass = this.supportedExchanges[exchangeName].class;
            const exchange = new ExchangeClass({ enableRateLimit: true });

            const ticker = await exchange.fetchTicker(symbol);

            return {
                symbol: ticker.symbol,
                last: ticker.last,
                bid: ticker.bid,
                ask: ticker.ask,
                high: ticker.high,
                low: ticker.low,
                volume: ticker.baseVolume,
                change: ticker.change,
                percentage: ticker.percentage,
                timestamp: ticker.timestamp
            };

        } catch (error) {
            console.error('Ticker fetch error:', error);
            throw error;
        }
    }

    // Fetch OHLCV data
    async fetchOHLCV(exchangeName, symbol, timeframe = '5m', limit = 100) {
        try {
            const ExchangeClass = this.supportedExchanges[exchangeName].class;
            const exchange = new ExchangeClass({ enableRateLimit: true });

            const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);

            return ohlcv.map(candle => ({
                timestamp: candle[0],
                open: candle[1],
                high: candle[2],
                low: candle[3],
                close: candle[4],
                volume: candle[5]
            }));

        } catch (error) {
            console.error('OHLCV fetch error:', error);
            throw error;
        }
    }

    // Encrypt API credentials
    encryptCredentials(credentials) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);

        let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            authTag: authTag.toString('hex'),
            iv: iv.toString('hex')
        };
    }

    // Decrypt API credentials
    decryptCredentials(encryptedData) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        const decipher = crypto.createDecipheriv(
            algorithm,
            key,
            Buffer.from(encryptedData.iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }

    // Add API keys for user
    async addApiKeys(userId, credentials) {
        const supabase = require('../services/SupabaseService');

        // Encrypt credentials
        const encryptedCreds = this.encryptCredentials({
            apiKey: credentials.apiKey,
            secret: credentials.apiSecret,
            password: credentials.passphrase
        });

        // Save to database
        await supabase.saveApiKeys(userId, credentials.exchange, encryptedCreds);

        // Initialize exchange
        await this.initializeExchange(userId, credentials.exchange, encryptedCreds);

        return { success: true };
    }

    // Check if user has exchange connected
    async userHasExchange(userId, exchangeName) {
        const exchangeKey = `${userId}:${exchangeName}`;
        return this.exchanges.has(exchangeKey);
    }

    // Load user's exchanges from database
    async loadUserExchanges(userId) {
        const supabase = require('../services/SupabaseService');

        for (const exchangeName of Object.keys(this.supportedExchanges)) {
            const encryptedCreds = await supabase.getApiKeys(userId, exchangeName);

            if (encryptedCreds) {
                try {
                    await this.initializeExchange(userId, exchangeName, encryptedCreds);
                } catch (error) {
                    console.error(`Failed to load ${exchangeName} for user ${userId}:`, error);
                }
            }
        }
    }

    // Get market data aggregated from multiple exchanges
    async getAggregatedMarketData(symbol) {
        const marketData = [];

        for (const [exchangeName, config] of Object.entries(this.supportedExchanges)) {
            try {
                const ticker = await this.fetchTicker(exchangeName, symbol);
                marketData.push({
                    exchange: exchangeName,
                    ...ticker
                });
            } catch (error) {
                console.error(`Failed to fetch ${symbol} from ${exchangeName}:`, error);
            }
        }

        // Calculate aggregated data
        if (marketData.length > 0) {
            const prices = marketData.map(d => d.last);
            const volumes = marketData.map(d => d.volume);

            return {
                symbol,
                averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
                totalVolume: volumes.reduce((a, b) => a + b, 0),
                exchanges: marketData,
                timestamp: Date.now()
            };
        }

        return null;
    }
}

module.exports = ExchangeManager;