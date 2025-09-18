// CryptoCrowe - Coinbase Advanced Trade API Integration
// For trading on Coinbase Exchange (not onchain swaps)

const crypto = require('crypto');
const axios = require('axios');
const EventEmitter = require('events');
const logger = require('winston');

class CoinbaseAdvancedTrade extends EventEmitter {
    constructor(config) {
        super();
        this.apiKey = config.apiKey || '';
        this.apiSecret = config.apiSecret || '';
        this.baseURL = 'https://api.coinbase.com/api/v3/brokerage';
        this.balance = config.initialBalance || 100;
        this.positions = new Map();

        // If no credentials, run in simulation mode
        this.simulationMode = !this.apiKey || !this.apiSecret;

        if (this.simulationMode) {
            logger.warn('⚠️  Running in SIMULATION mode - no API credentials');
        } else {
            logger.info('✅ Coinbase Advanced Trade API configured');
        }
    }

    // Generate signature for Coinbase Advanced Trade API
    generateSignature(method, path, body = '') {
        const timestamp = Math.floor(Date.now() / 1000);
        const message = timestamp + method + path + body;

        const key = Buffer.from(this.apiSecret, 'base64');
        const hmac = crypto.createHmac('sha256', key);
        const signature = hmac.update(message).digest('base64');

        return {
            'CB-ACCESS-KEY': this.apiKey,
            'CB-ACCESS-SIGN': signature,
            'CB-ACCESS-TIMESTAMP': timestamp,
            'Content-Type': 'application/json'
        };
    }

    async makeRequest(method, endpoint, data = null) {
        if (this.simulationMode) {
            return this.simulateRequest(method, endpoint, data);
        }

        const path = `/api/v3/brokerage${endpoint}`;
        const body = data ? JSON.stringify(data) : '';
        const headers = this.generateSignature(method, path, body);

        try {
            const response = await axios({
                method,
                url: `${this.baseURL}${endpoint}`,
                headers,
                data: data || undefined
            });

            return response.data;
        } catch (error) {
            logger.error('Coinbase API error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Simulation methods for testing without real API
    simulateRequest(method, endpoint, data) {
        logger.debug(`Simulating ${method} ${endpoint}`);

        if (endpoint === '/accounts') {
            return {
                accounts: [
                    {
                        uuid: 'sim_usd_account',
                        currency: 'USD',
                        available_balance: { value: this.balance.toString(), currency: 'USD' },
                        hold: { value: '0', currency: 'USD' }
                    },
                    {
                        uuid: 'sim_btc_account',
                        currency: 'BTC',
                        available_balance: { value: '0', currency: 'BTC' },
                        hold: { value: '0', currency: 'BTC' }
                    }
                ]
            };
        }

        if (endpoint === '/products') {
            return {
                products: [
                    { product_id: 'BTC-USD', base_currency: 'BTC', quote_currency: 'USD', price: '45000' },
                    { product_id: 'ETH-USD', base_currency: 'ETH', quote_currency: 'USD', price: '3000' }
                ]
            };
        }

        if (endpoint === '/orders' && method === 'POST') {
            const orderId = `sim_${Date.now()}`;
            const price = data.product_id.includes('BTC') ? 45000 : 3000;

            // Simulate order execution
            if (data.order_configuration.market_market_ioc) {
                const size = data.order_configuration.market_market_ioc.quote_size
                    ? parseFloat(data.order_configuration.market_market_ioc.quote_size) / price
                    : parseFloat(data.order_configuration.market_market_ioc.base_size);

                return {
                    success: true,
                    order_id: orderId,
                    product_id: data.product_id,
                    side: data.side,
                    status: 'FILLED',
                    filled_size: size.toString(),
                    filled_value: (size * price).toString(),
                    average_filled_price: price.toString()
                };
            }

            return {
                success: true,
                order_id: orderId,
                product_id: data.product_id,
                side: data.side,
                status: 'PENDING'
            };
        }

        return { success: true, simulation: true };
    }

    async getAccounts() {
        const response = await this.makeRequest('GET', '/accounts');
        return response.accounts;
    }

    async getAccount(currency = 'USD') {
        const accounts = await this.getAccounts();
        return accounts.find(acc => acc.currency === currency);
    }

    async getProducts() {
        const response = await this.makeRequest('GET', '/products');
        return response.products;
    }

    async getProduct(productId) {
        const response = await this.makeRequest('GET', `/products/${productId}`);
        return response;
    }

    async placeMarketOrder(productId, side, amount) {
        // amount is in USD for buy orders, in crypto for sell orders
        const orderConfig = side === 'BUY'
            ? { market_market_ioc: { quote_size: amount.toString() } }
            : { market_market_ioc: { base_size: amount.toString() } };

        const order = {
            client_order_id: `crowe_${Date.now()}`,
            product_id: productId,
            side,
            order_configuration: orderConfig
        };

        logger.info(`📊 Placing ${side} order for ${productId}: $${amount}`);

        const response = await this.makeRequest('POST', '/orders', order);

        if (response.success) {
            logger.info(`✅ Order executed: ${response.order_id}`);
            this.emit('trade', response);
        }

        return response;
    }

    async placeLimitOrder(productId, side, size, limitPrice) {
        const order = {
            client_order_id: `crowe_limit_${Date.now()}`,
            product_id: productId,
            side,
            order_configuration: {
                limit_limit_gtc: {
                    base_size: size.toString(),
                    limit_price: limitPrice.toString()
                }
            }
        };

        const response = await this.makeRequest('POST', '/orders', order);
        return response;
    }

    async getOrders(productId = null) {
        const params = productId ? `?product_id=${productId}` : '';
        const response = await this.makeRequest('GET', `/orders/historical/fills${params}`);
        return response.fills;
    }

    async cancelOrder(orderId) {
        const response = await this.makeRequest('POST', `/orders/batch_cancel`, {
            order_ids: [orderId]
        });
        return response;
    }

    async getBalance() {
        const accounts = await this.getAccounts();
        const balances = {};

        for (const account of accounts) {
            if (parseFloat(account.available_balance.value) > 0) {
                balances[account.currency] = {
                    available: parseFloat(account.available_balance.value),
                    hold: parseFloat(account.hold.value)
                };
            }
        }

        return balances;
    }

    async executeTrade(signal) {
        const { symbol, side, amount, confidence } = signal;

        try {
            // Convert symbol format (BTC-USD is already correct)
            const productId = symbol;

            // Execute market order
            const result = await this.placeMarketOrder(
                productId,
                side.toUpperCase(),
                amount
            );

            // Track position
            if (result.success) {
                this.positions.set(result.order_id, {
                    id: result.order_id,
                    symbol: productId,
                    side,
                    amount: result.filled_size || amount,
                    price: result.average_filled_price || 0,
                    status: 'open',
                    timestamp: Date.now()
                });
            }

            return result;

        } catch (error) {
            logger.error('Trade execution failed:', error);
            return null;
        }
    }

    getStatus() {
        return {
            connected: !this.simulationMode,
            mode: this.simulationMode ? 'SIMULATION' : 'LIVE',
            exchange: 'Coinbase Advanced Trade',
            balance: this.balance,
            positions: Array.from(this.positions.values())
        };
    }
}

module.exports = CoinbaseAdvancedTrade;