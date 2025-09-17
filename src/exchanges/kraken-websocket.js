const WebSocket = require('ws');
const crypto = require('crypto');
const axios = require('axios');

class KrakenWebSocketClient {
    constructor(apiKey, apiSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.wsAuth = null;
        this.wsPublic = null;
        this.token = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    // Generate WebSocket authentication token
    async getWebSocketToken() {
        try {
            const nonce = Date.now() * 1000;
            const postData = `nonce=${nonce}`;
            const path = '/0/private/GetWebSocketsToken';

            // Create signature
            const sha256 = crypto.createHash('sha256').update(nonce + postData).digest();
            const hmac = crypto.createHmac('sha512', Buffer.from(this.apiSecret, 'base64'));
            hmac.update(path + sha256);
            const signature = hmac.digest('base64');

            // Make REST API call to get WebSocket token
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
                throw new Error(`Kraken API error: ${response.data.error.join(', ')}`);
            }

            this.token = response.data.result.token;
            console.log('WebSocket token obtained successfully');
            return this.token;
        } catch (error) {
            console.error('Error getting WebSocket token:', error);
            throw error;
        }
    }

    // Connect to authenticated WebSocket
    async connectAuth() {
        if (!this.token) {
            await this.getWebSocketToken();
        }

        return new Promise((resolve, reject) => {
            this.wsAuth = new WebSocket('wss://ws-auth.kraken.com/v2');

            this.wsAuth.on('open', () => {
                console.log('Connected to Kraken authenticated WebSocket');
                this.reconnectAttempts = 0;
                resolve();
            });

            this.wsAuth.on('message', (data) => {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            });

            this.wsAuth.on('error', (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            });

            this.wsAuth.on('close', () => {
                console.log('WebSocket disconnected');
                this.handleReconnect();
            });
        });
    }

    // Connect to public WebSocket
    connectPublic() {
        return new Promise((resolve, reject) => {
            this.wsPublic = new WebSocket('wss://ws.kraken.com/v2');

            this.wsPublic.on('open', () => {
                console.log('Connected to Kraken public WebSocket');
                resolve();
            });

            this.wsPublic.on('message', (data) => {
                const message = JSON.parse(data.toString());
                this.handlePublicMessage(message);
            });

            this.wsPublic.on('error', (error) => {
                console.error('Public WebSocket error:', error);
                reject(error);
            });
        });
    }

    // Subscribe to ticker data
    subscribeTicker(symbols) {
        const subscription = {
            method: 'subscribe',
            params: {
                channel: 'ticker',
                symbol: symbols,
                snapshot: true
            }
        };

        if (this.wsPublic && this.wsPublic.readyState === WebSocket.OPEN) {
            this.wsPublic.send(JSON.stringify(subscription));
        }
    }

    // Subscribe to order book
    subscribeOrderBook(symbols, depth = 10) {
        const subscription = {
            method: 'subscribe',
            params: {
                channel: 'book',
                symbol: symbols,
                depth: depth
            }
        };

        if (this.wsPublic && this.wsPublic.readyState === WebSocket.OPEN) {
            this.wsPublic.send(JSON.stringify(subscription));
        }
    }

    // Place a limit order
    addLimitOrder(symbol, side, quantity, price, options = {}) {
        const order = {
            method: 'add_order',
            params: {
                order_type: 'limit',
                side: side,
                order_qty: quantity,
                symbol: symbol,
                limit_price: price,
                time_in_force: options.timeInForce || 'gtc',
                post_only: options.postOnly || false,
                reduce_only: options.reduceOnly || false,
                margin: options.margin || false,
                token: this.token
            }
        };

        if (options.clientOrderId) {
            order.params.cl_ord_id = options.clientOrderId;
        }

        if (this.wsAuth && this.wsAuth.readyState === WebSocket.OPEN) {
            this.wsAuth.send(JSON.stringify(order));
        } else {
            console.error('Authenticated WebSocket not connected');
        }
    }

    // Place a market order
    addMarketOrder(symbol, side, quantity, options = {}) {
        const order = {
            method: 'add_order',
            params: {
                order_type: 'market',
                side: side,
                order_qty: quantity,
                symbol: symbol,
                reduce_only: options.reduceOnly || false,
                margin: options.margin || false,
                token: this.token
            }
        };

        if (side === 'buy' && options.quoteOrderQty) {
            order.params.cash_order_qty = options.quoteOrderQty;
            delete order.params.order_qty;
        }

        if (this.wsAuth && this.wsAuth.readyState === WebSocket.OPEN) {
            this.wsAuth.send(JSON.stringify(order));
        } else {
            console.error('Authenticated WebSocket not connected');
        }
    }

    // Place a stop-loss order
    addStopLossOrder(symbol, side, quantity, stopPrice, options = {}) {
        const order = {
            method: 'add_order',
            params: {
                order_type: options.limitPrice ? 'stop-loss-limit' : 'stop-loss',
                side: side,
                order_qty: quantity,
                symbol: symbol,
                triggers: {
                    reference: options.reference || 'last',
                    price: stopPrice,
                    price_type: options.priceType || 'static'
                },
                token: this.token
            }
        };

        if (options.limitPrice) {
            order.params.limit_price = options.limitPrice;
        }

        if (this.wsAuth && this.wsAuth.readyState === WebSocket.OPEN) {
            this.wsAuth.send(JSON.stringify(order));
        } else {
            console.error('Authenticated WebSocket not connected');
        }
    }

    // Place One-Triggers-Other (OTO) order
    addOTOOrder(symbol, side, quantity, price, stopLoss, takeProfit) {
        const order = {
            method: 'add_order',
            params: {
                order_type: 'limit',
                side: side,
                order_qty: quantity,
                symbol: symbol,
                limit_price: price,
                conditional: {
                    order_type: 'stop-loss',
                    trigger_price: stopLoss,
                    trigger_price_type: 'static'
                },
                token: this.token
            }
        };

        if (this.wsAuth && this.wsAuth.readyState === WebSocket.OPEN) {
            this.wsAuth.send(JSON.stringify(order));
        } else {
            console.error('Authenticated WebSocket not connected');
        }
    }

    // Cancel order
    cancelOrder(orderId) {
        const request = {
            method: 'cancel_order',
            params: {
                order_id: [orderId],
                token: this.token
            }
        };

        if (this.wsAuth && this.wsAuth.readyState === WebSocket.OPEN) {
            this.wsAuth.send(JSON.stringify(request));
        } else {
            console.error('Authenticated WebSocket not connected');
        }
    }

    // Cancel all orders
    cancelAllOrders(symbol = null) {
        const request = {
            method: 'cancel_all',
            params: {
                token: this.token
            }
        };

        if (symbol) {
            request.params.symbol = symbol;
        }

        if (this.wsAuth && this.wsAuth.readyState === WebSocket.OPEN) {
            this.wsAuth.send(JSON.stringify(request));
        } else {
            console.error('Authenticated WebSocket not connected');
        }
    }

    // Subscribe to own trades
    subscribeOwnTrades() {
        const subscription = {
            method: 'subscribe',
            params: {
                channel: 'executions',
                snapshot_trades: true,
                token: this.token
            }
        };

        if (this.wsAuth && this.wsAuth.readyState === WebSocket.OPEN) {
            this.wsAuth.send(JSON.stringify(subscription));
        }
    }

    // Subscribe to open orders
    subscribeOpenOrders() {
        const subscription = {
            method: 'subscribe',
            params: {
                channel: 'openorders',
                snapshot: true,
                token: this.token
            }
        };

        if (this.wsAuth && this.wsAuth.readyState === WebSocket.OPEN) {
            this.wsAuth.send(JSON.stringify(subscription));
        }
    }

    // Handle authenticated messages
    handleMessage(message) {
        if (message.method === 'add_order') {
            if (message.success) {
                console.log('Order placed successfully:', message.result);
                this.onOrderPlaced && this.onOrderPlaced(message.result);
            } else {
                console.error('Order failed:', message.error);
                this.onOrderError && this.onOrderError(message.error);
            }
        } else if (message.channel === 'executions') {
            console.log('Trade executed:', message.data);
            this.onTradeExecuted && this.onTradeExecuted(message.data);
        } else if (message.channel === 'openorders') {
            console.log('Open orders update:', message.data);
            this.onOrderUpdate && this.onOrderUpdate(message.data);
        }
    }

    // Handle public messages
    handlePublicMessage(message) {
        if (message.channel === 'ticker') {
            this.onTickerUpdate && this.onTickerUpdate(message.data);
        } else if (message.channel === 'book') {
            this.onOrderBookUpdate && this.onOrderBookUpdate(message.data);
        } else if (message.channel === 'trade') {
            this.onPublicTrade && this.onPublicTrade(message.data);
        }
    }

    // Handle reconnection
    async handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(async () => {
                try {
                    await this.connectAuth();
                    console.log('Reconnected successfully');
                } catch (error) {
                    console.error('Reconnection failed:', error);
                }
            }, 5000 * this.reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    // Disconnect WebSocket
    disconnect() {
        if (this.wsAuth) {
            this.wsAuth.close();
        }
        if (this.wsPublic) {
            this.wsPublic.close();
        }
    }
}

module.exports = KrakenWebSocketClient;