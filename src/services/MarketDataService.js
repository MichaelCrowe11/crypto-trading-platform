// Crow-e Crypto - Market Data Service
// Aggregates data from multiple sources

const axios = require('axios');

class MarketDataService {
    constructor(redisClient) {
        this.redis = redisClient;
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
                const cached = await this.redis.get(cacheKey);

                if (cached) {
                    prices[symbol] = JSON.parse(cached);
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
                    await this.redis.setEx(cacheKey, 30, JSON.stringify(priceData));
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