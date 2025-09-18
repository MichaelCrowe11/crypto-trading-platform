// CryptoCrowe - WebSocket Service for Real-Time Data
// Live market feeds for production trading

const WebSocket = require('ws');
const EventEmitter = require('events');
const logger = require('winston');

class WebSocketService extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.connections = new Map();
        this.reconnectAttempts = new Map();
        this.maxReconnectAttempts = 5;
    }

    async connect() {
        logger.info('🔌 Establishing WebSocket connections...');

        // Connect to Coinbase
        if (this.config.marketData.websockets.coinbase) {
            await this.connectToCoinbase();
        }

        // Connect to Binance
        if (this.config.marketData.websockets.binance) {
            await this.connectToBinance();
        }

        return true;
    }

    async connectToCoinbase() {
        const url = this.config.marketData.websockets.coinbase;
        const ws = new WebSocket(url);

        ws.on('open', () => {
            logger.info('✅ Connected to Coinbase WebSocket');
            this.connections.set('coinbase', ws);
            this.reconnectAttempts.set('coinbase', 0);

            // Subscribe to trading pairs
            const subscribe = {
                type: 'subscribe',
                product_ids: this.config.coinbase.tradingPairs,
                channels: ['ticker', 'level2', 'matches']
            };

            ws.send(JSON.stringify(subscribe));
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleCoinbaseMessage(message);
            } catch (error) {
                logger.error('Coinbase message parse error:', error);
            }
        });

        ws.on('error', (error) => {
            logger.error('Coinbase WebSocket error:', error);
        });

        ws.on('close', () => {
            logger.warn('Coinbase WebSocket disconnected');
            this.handleReconnect('coinbase', () => this.connectToCoinbase());
        });
    }

    async connectToBinance() {
        // Create combined stream for multiple symbols
        const streams = this.config.coinbase.tradingPairs
            .map(pair => {
                const symbol = pair.replace('-', '').toLowerCase();
                return `${symbol}@ticker/${symbol}@depth20`;
            })
            .join('/');

        const url = `${this.config.marketData.websockets.binance}/${streams}`;
        const ws = new WebSocket(url);

        ws.on('open', () => {
            logger.info('✅ Connected to Binance WebSocket');
            this.connections.set('binance', ws);
            this.reconnectAttempts.set('binance', 0);
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleBinanceMessage(message);
            } catch (error) {
                logger.error('Binance message parse error:', error);
            }
        });

        ws.on('error', (error) => {
            logger.error('Binance WebSocket error:', error);
        });

        ws.on('close', () => {
            logger.warn('Binance WebSocket disconnected');
            this.handleReconnect('binance', () => this.connectToBinance());
        });
    }

    handleCoinbaseMessage(message) {
        switch (message.type) {
            case 'ticker':
                this.emit('price', {
                    exchange: 'coinbase',
                    symbol: message.product_id,
                    price: parseFloat(message.price),
                    volume: parseFloat(message.volume_24h),
                    bid: parseFloat(message.best_bid),
                    ask: parseFloat(message.best_ask),
                    timestamp: Date.now()
                });
                break;

            case 'l2update':
                this.emit('orderbook', {
                    exchange: 'coinbase',
                    symbol: message.product_id,
                    changes: message.changes,
                    timestamp: Date.now()
                });
                break;

            case 'match':
                this.emit('trade', {
                    exchange: 'coinbase',
                    symbol: message.product_id,
                    price: parseFloat(message.price),
                    size: parseFloat(message.size),
                    side: message.side,
                    timestamp: Date.now()
                });
                break;
        }
    }

    handleBinanceMessage(message) {
        if (message.e === '24hrTicker') {
            this.emit('price', {
                exchange: 'binance',
                symbol: message.s,
                price: parseFloat(message.c),
                volume: parseFloat(message.v),
                bid: parseFloat(message.b),
                ask: parseFloat(message.a),
                timestamp: message.E
            });
        } else if (message.e === 'depthUpdate') {
            this.emit('orderbook', {
                exchange: 'binance',
                symbol: message.s,
                bids: message.b,
                asks: message.a,
                timestamp: message.E
            });
        }
    }

    handleReconnect(exchange, reconnectFunc) {
        const attempts = this.reconnectAttempts.get(exchange) || 0;

        if (attempts < this.maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
            logger.info(`Reconnecting to ${exchange} in ${delay}ms (attempt ${attempts + 1})`);

            setTimeout(() => {
                this.reconnectAttempts.set(exchange, attempts + 1);
                reconnectFunc();
            }, delay);
        } else {
            logger.error(`Max reconnection attempts reached for ${exchange}`);
        }
    }

    broadcast(data) {
        // Broadcast to all connected WebSocket clients
        for (const [exchange, ws] of this.connections) {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(JSON.stringify(data));
                } catch (error) {
                    logger.error(`Failed to broadcast to ${exchange}:`, error);
                }
            }
        }
    }

    async getStatus() {
        const status = {};
        for (const [exchange, ws] of this.connections) {
            status[exchange] = {
                connected: ws.readyState === WebSocket.OPEN,
                readyState: ws.readyState
            };
        }
        return status;
    }

    stop() {
        logger.info('Closing WebSocket connections...');
        for (const [exchange, ws] of this.connections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }
        this.connections.clear();
    }
}

module.exports = WebSocketService;