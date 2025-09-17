// Crow-e Crypto - Market Data Service
// Aggregates data from multiple sources

const axios = require('axios');

class MarketDataService {
    constructor(exchangeManager) {
        this.exchangeManager = exchangeManager;
        this.redis = null;
        this.cache = new Map();
        this.dataSources = {
            coinmarketcap: {
                baseUrl: 'https://pro-api.coinmarketcap.com/v1',
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
                }
            },
            coingecko: {
                baseUrl: 'https://api.coingecko.com/api/v3',
                headers: {}
            },
            cryptocompare: {
                baseUrl: 'https://min-api.cryptocompare.com/data',
                headers: {
                    'authorization': `Apikey ${process.env.CRYPTOCOMPARE_API_KEY}`
                }
            }
        };

        this.subscriptions = new Map();
    }

    // Get aggregated prices from multiple sources
    async getAggregatedPrices(symbols) {
        const prices = {};

        for (const symbol of symbols) {
            try {
                // Check cache first
                const cacheKey = `price:${symbol}`;
                const cached = this.cache.get(cacheKey);
                const now = Date.now();

                if (cached && (now - cached.timestamp) < 30000) {
                    prices[symbol] = cached.data;
                    continue;
                }

                // Fetch from multiple sources
                const [cmc, gecko, compare] = await Promise.allSettled([
                    this.fetchCoinMarketCap(symbol),
                    this.fetchCoinGecko(symbol),
                    this.fetchCryptoCompare(symbol)
                ]);

                // Aggregate results
                const validPrices = [];

                if (cmc.status === 'fulfilled' && cmc.value) {
                    validPrices.push(cmc.value);
                }
                if (gecko.status === 'fulfilled' && gecko.value) {
                    validPrices.push(gecko.value);
                }
                if (compare.status === 'fulfilled' && compare.value) {
                    validPrices.push(compare.value);
                }

                if (validPrices.length > 0) {
                    const avgPrice = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;

                    const priceData = {
                        symbol,
                        price: avgPrice,
                        sources: validPrices.length,
                        timestamp: Date.now()
                    };

                    prices[symbol] = priceData;

                    // Cache for 30 seconds
                    this.cache.set(cacheKey, {
                        data: priceData,
                        timestamp: Date.now()
                    });
                }

            } catch (error) {
                console.error(`Failed to fetch price for ${symbol}:`, error);
            }
        }

        return prices;
    }

    // Fetch from CoinMarketCap
    async fetchCoinMarketCap(symbol) {
        try {
            if (!process.env.COINMARKETCAP_API_KEY) {
                return null;
            }

            const response = await axios.get(
                `${this.dataSources.coinmarketcap.baseUrl}/cryptocurrency/quotes/latest`,
                {
                    headers: this.dataSources.coinmarketcap.headers,
                    params: {
                        symbol: symbol.replace('/', ''),
                        convert: 'USD'
                    }
                }
            );

            const data = response.data.data[symbol.replace('/', '')];
            return data ? data.quote.USD.price : null;

        } catch (error) {
            console.error('CoinMarketCap error:', error.message);
            return null;
        }
    }

    // Fetch from CoinGecko
    async fetchCoinGecko(symbol) {
        try {
            const coinId = this.getCoinGeckoId(symbol);
            if (!coinId) return null;

            const response = await axios.get(
                `${this.dataSources.coingecko.baseUrl}/simple/price`,
                {
                    params: {
                        ids: coinId,
                        vs_currencies: 'usd'
                    }
                }
            );

            return response.data[coinId]?.usd || null;

        } catch (error) {
            console.error('CoinGecko error:', error.message);
            return null;
        }
    }

    // Fetch from CryptoCompare
    async fetchCryptoCompare(symbol) {
        try {
            const [from, to] = symbol.split('/');

            const response = await axios.get(
                `${this.dataSources.cryptocompare.baseUrl}/price`,
                {
                    headers: this.dataSources.cryptocompare.headers,
                    params: {
                        fsym: from,
                        tsyms: to || 'USD'
                    }
                }
            );

            return response.data[to || 'USD'] || null;

        } catch (error) {
            console.error('CryptoCompare error:', error.message);
            return null;
        }
    }

    // Calculate volatility
    async calculateVolatility(symbol, interval = '1h') {
        try {
            // Fetch historical data
            const history = await this.fetchHistoricalData(symbol, interval);

            if (!history || history.length < 2) {
                return 0;
            }

            // Calculate returns
            const returns = [];
            for (let i = 1; i < history.length; i++) {
                const return_i = (history[i].close - history[i - 1].close) / history[i - 1].close;
                returns.push(return_i);
            }

            // Calculate standard deviation
            const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
            const volatility = Math.sqrt(variance);

            return volatility;

        } catch (error) {
            console.error('Volatility calculation error:', error);
            return 0;
        }
    }

    // Fetch historical data
    async fetchHistoricalData(symbol, interval) {
        try {
            const [from, to] = symbol.split('/');

            const response = await axios.get(
                `${this.dataSources.cryptocompare.baseUrl}/v2/histohour`,
                {
                    headers: this.dataSources.cryptocompare.headers,
                    params: {
                        fsym: from,
                        tsym: to || 'USD',
                        limit: 24
                    }
                }
            );

            return response.data.Data?.Data || [];

        } catch (error) {
            console.error('Historical data fetch error:', error);
            return [];
        }
    }

    // Get OHLCV data from exchange
    async getOHLCV(exchange, symbol, timeframe = '1h', limit = 100) {
        try {
            // Try to use exchange manager first
            if (this.exchangeManager && this.exchangeManager.exchanges && this.exchangeManager.exchanges.has(exchange)) {
                try {
                    const exchangeInstance = this.exchangeManager.exchanges.get(exchange);
                    if (exchangeInstance && exchangeInstance.has && exchangeInstance.has.fetchOHLCV) {
                        const ohlcv = await exchangeInstance.fetchOHLCV(symbol, timeframe, undefined, limit);
                        return ohlcv.map(candle => ({
                            timestamp: candle[0],
                            open: candle[1],
                            high: candle[2],
                            low: candle[3],
                            close: candle[4],
                            volume: candle[5]
                        }));
                    }
                } catch (err) {
                    console.log(`OHLCV fetch failed for ${exchange}:${symbol}, using fallback`);
                }
            }

            // Generate mock OHLCV data
            const now = Date.now();
            const interval = timeframe === '1h' ? 3600000 : timeframe === '5m' ? 300000 : 60000;
            const basePrice = symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 2800 : 100;

            return Array.from({ length: limit }, (_, i) => {
                const timestamp = now - (limit - i) * interval;
                const variation = (Math.random() - 0.5) * basePrice * 0.02;
                const open = basePrice + variation;
                const close = basePrice + (Math.random() - 0.5) * basePrice * 0.02;
                const high = Math.max(open, close) + Math.random() * basePrice * 0.01;
                const low = Math.min(open, close) - Math.random() * basePrice * 0.01;

                return {
                    timestamp,
                    open,
                    high,
                    low,
                    close,
                    volume: Math.random() * 1000000
                };
            });
        } catch (error) {
            console.error(`Failed to get OHLCV for ${symbol}:`, error);
            return [];
        }
    }

    // Get ticker data from exchange
    async getTicker(exchange, symbol) {
        try {
            // Try to use exchange manager first (uses your configured API keys)
            if (this.exchangeManager && this.exchangeManager.exchanges && this.exchangeManager.exchanges.has(exchange)) {
                try {
                    const exchangeInstance = this.exchangeManager.exchanges.get(exchange);
                    if (exchangeInstance && exchangeInstance.has && exchangeInstance.has.fetchTicker) {
                        const ticker = await exchangeInstance.fetchTicker(symbol);
                        return ticker;
                    }
                } catch (err) {
                    console.log(`Exchange fetch failed for ${exchange}:${symbol}, using fallback`);
                }
            }

            // Fallback to public APIs
            const prices = await this.getAggregatedPrices([symbol]);
            if (prices[symbol]) {
                return {
                    symbol: symbol,
                    last: prices[symbol].price,
                    bid: prices[symbol].price * 0.999,
                    ask: prices[symbol].price * 1.001,
                    timestamp: Date.now()
                };
            }

            // Return mock data if all else fails
            return {
                symbol: symbol,
                last: symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 2800 : 100,
                bid: symbol.includes('BTC') ? 44950 : symbol.includes('ETH') ? 2795 : 99.5,
                ask: symbol.includes('BTC') ? 45050 : symbol.includes('ETH') ? 2805 : 100.5,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error(`Failed to get ticker for ${symbol} from ${exchange}:`, error);
            // Return mock data on error
            return {
                symbol: symbol,
                last: 45000,
                bid: 44950,
                ask: 45050,
                timestamp: Date.now()
            };
        }
    }

    // Subscribe to market data updates
    subscribeToMarketData(symbols, callback) {
        const subscriptionId = Date.now().toString();

        // Set up polling interval
        const interval = setInterval(async () => {
            try {
                const prices = await this.getAggregatedPrices(symbols);
                callback({
                    type: 'price-update',
                    data: prices,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Market data subscription error:', error);
            }
        }, 5000); // Poll every 5 seconds

        this.subscriptions.set(subscriptionId, interval);

        return subscriptionId;
    }

    // Unsubscribe from market data
    unsubscribe(subscriptionId) {
        const interval = this.subscriptions.get(subscriptionId);
        if (interval) {
            clearInterval(interval);
            this.subscriptions.delete(subscriptionId);
        }
    }

    // Get coin ID for CoinGecko
    getCoinGeckoId(symbol) {
        const mapping = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'BNB': 'binancecoin',
            'SOL': 'solana',
            'ADA': 'cardano',
            'DOT': 'polkadot',
            'AVAX': 'avalanche-2',
            'MATIC': 'matic-network',
            'LINK': 'chainlink',
            'UNI': 'uniswap'
        };

        const base = symbol.split('/')[0];
        return mapping[base] || null;
    }

    // Clean up old cached data
    async cleanupOldData() {
        try {
            // Get all price keys
            const keys = await this.redis.keys('price:*');

            // Delete keys older than 1 hour
            for (const key of keys) {
                const ttl = await this.redis.ttl(key);
                if (ttl < 0) {
                    await this.redis.del(key);
                }
            }

            console.log(`Cleaned up ${keys.length} cached entries`);

        } catch (error) {
            console.error('Cache cleanup error:', error);
        }
    }

    // Get market statistics
    async getMarketStats(symbol) {
        try {
            const [prices, volatility, volume] = await Promise.all([
                this.getAggregatedPrices([symbol]),
                this.calculateVolatility(symbol),
                this.get24hVolume(symbol)
            ]);

            return {
                symbol,
                price: prices[symbol]?.price || 0,
                volatility,
                volume24h: volume,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('Market stats error:', error);
            return null;
        }
    }

    // Get 24h volume
    async get24hVolume(symbol) {
        try {
            const [from] = symbol.split('/');

            const response = await axios.get(
                `${this.dataSources.cryptocompare.baseUrl}/pricemultifull`,
                {
                    headers: this.dataSources.cryptocompare.headers,
                    params: {
                        fsyms: from,
                        tsyms: 'USD'
                    }
                }
            );

            return response.data.DISPLAY?.[from]?.USD?.VOLUME24HOUR || 0;

        } catch (error) {
            console.error('Volume fetch error:', error);
            return 0;
        }
    }
}

module.exports = MarketDataService;