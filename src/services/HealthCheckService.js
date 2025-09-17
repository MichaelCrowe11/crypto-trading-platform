// CryptoCrowe Health Check & Monitoring Service

const axios = require('axios');
const os = require('os');

class HealthCheckService {
    constructor(app, services) {
        this.app = app;
        this.services = services;
        this.startTime = Date.now();
        this.healthChecks = new Map();
        this.metrics = {
            requests: 0,
            errors: 0,
            apiCalls: new Map(),
            responseTime: []
        };
    }

    // Initialize health check endpoints
    initialize() {
        // Basic health check
        this.app.get('/health', (req, res) => {
            const health = this.getBasicHealth();
            res.status(health.status === 'healthy' ? 200 : 503).json(health);
        });

        // Detailed health check
        this.app.get('/health/detailed', async (req, res) => {
            const health = await this.getDetailedHealth();
            res.status(health.status === 'healthy' ? 200 : 503).json(health);
        });

        // Readiness check
        this.app.get('/ready', (req, res) => {
            const ready = this.checkReadiness();
            res.status(ready.ready ? 200 : 503).json(ready);
        });

        // Liveness check
        this.app.get('/alive', (req, res) => {
            res.status(200).json({
                alive: true,
                timestamp: new Date().toISOString()
            });
        });

        // Metrics endpoint
        this.app.get('/metrics', (req, res) => {
            res.json(this.getMetrics());
        });

        // Start periodic health checks
        this.startPeriodicChecks();

        console.log('✓ Health check service initialized');
    }

    // Basic health check
    getBasicHealth() {
        const uptime = Date.now() - this.startTime;
        const memory = process.memoryUsage();

        return {
            status: 'healthy',
            app: 'CryptoCrowe',
            version: process.env.npm_package_version || '2.0.0',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(uptime / 1000),
            environment: process.env.NODE_ENV || 'development',
            memory: {
                used: Math.round(memory.heapUsed / 1024 / 1024),
                total: Math.round(memory.heapTotal / 1024 / 1024),
                unit: 'MB'
            }
        };
    }

    // Detailed health check with service status
    async getDetailedHealth() {
        const basic = this.getBasicHealth();
        const services = await this.checkServices();
        const system = this.getSystemHealth();

        const allHealthy = Object.values(services).every(s => s.status === 'healthy');

        return {
            ...basic,
            status: allHealthy ? 'healthy' : 'degraded',
            services,
            system,
            checks: Array.from(this.healthChecks.entries()).map(([name, check]) => ({
                name,
                status: check.status,
                lastCheck: check.lastCheck,
                message: check.message
            }))
        };
    }

    // Check all services
    async checkServices() {
        const serviceStatus = {};

        // Database check
        serviceStatus.database = await this.checkDatabase();

        // Redis check
        serviceStatus.redis = await this.checkRedis();

        // Exchange APIs check
        serviceStatus.exchanges = await this.checkExchanges();

        // WebSocket check
        serviceStatus.websocket = this.checkWebSocket();

        // External APIs check
        serviceStatus.externalAPIs = await this.checkExternalAPIs();

        return serviceStatus;
    }

    // Database health check
    async checkDatabase() {
        try {
            const mongoose = require('mongoose');
            const isConnected = mongoose.connection.readyState === 1;

            if (isConnected) {
                // Ping database
                await mongoose.connection.db.admin().ping();

                this.updateHealthCheck('database', 'healthy', 'Connected');

                return {
                    status: 'healthy',
                    connected: true,
                    latency: null
                };
            }

            this.updateHealthCheck('database', 'unhealthy', 'Not connected');

            return {
                status: 'unhealthy',
                connected: false,
                error: 'Not connected'
            };
        } catch (error) {
            this.updateHealthCheck('database', 'unhealthy', error.message);

            return {
                status: 'unhealthy',
                connected: false,
                error: error.message
            };
        }
    }

    // Redis health check
    async checkRedis() {
        try {
            if (this.app.locals.redis) {
                const start = Date.now();
                await this.app.locals.redis.ping();
                const latency = Date.now() - start;

                this.updateHealthCheck('redis', 'healthy', `Latency: ${latency}ms`);

                return {
                    status: 'healthy',
                    connected: true,
                    latency: `${latency}ms`
                };
            }

            this.updateHealthCheck('redis', 'disabled', 'Redis not configured');

            return {
                status: 'disabled',
                connected: false,
                message: 'Redis not configured'
            };
        } catch (error) {
            this.updateHealthCheck('redis', 'unhealthy', error.message);

            return {
                status: 'unhealthy',
                connected: false,
                error: error.message
            };
        }
    }

    // Exchange APIs health check
    async checkExchanges() {
        const exchanges = {
            coinbase: false,
            binance: false,
            kraken: false
        };

        try {
            if (this.services.exchangeManager) {
                const manager = this.services.exchangeManager;

                // Check each exchange
                for (const [name, exchange] of manager.exchanges || []) {
                    try {
                        await exchange.fetchTicker('BTC/USDT');
                        exchanges[name] = true;
                    } catch {
                        exchanges[name] = false;
                    }
                }
            }

            const connected = Object.values(exchanges).filter(Boolean).length;
            const total = Object.keys(exchanges).length;

            this.updateHealthCheck('exchanges',
                connected > 0 ? 'healthy' : 'unhealthy',
                `${connected}/${total} connected`
            );

            return {
                status: connected > 0 ? 'healthy' : 'unhealthy',
                connected: `${connected}/${total}`,
                exchanges
            };
        } catch (error) {
            this.updateHealthCheck('exchanges', 'unhealthy', error.message);

            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    // WebSocket health check
    checkWebSocket() {
        try {
            const io = this.app.locals.io;

            if (io) {
                const connectedSockets = io.sockets.sockets.size;

                this.updateHealthCheck('websocket', 'healthy',
                    `${connectedSockets} clients connected`
                );

                return {
                    status: 'healthy',
                    active: true,
                    connections: connectedSockets
                };
            }

            this.updateHealthCheck('websocket', 'inactive', 'No WebSocket server');

            return {
                status: 'inactive',
                active: false
            };
        } catch (error) {
            this.updateHealthCheck('websocket', 'unhealthy', error.message);

            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    // External APIs health check
    async checkExternalAPIs() {
        const apis = {};

        // Check CoinMarketCap
        if (process.env.COINMARKETCAP_API_KEY) {
            apis.coinmarketcap = await this.pingAPI(
                'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=1',
                { 'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY }
            );
        }

        // Check CoinGecko
        apis.coingecko = await this.pingAPI(
            'https://api.coingecko.com/api/v3/ping'
        );

        const healthyAPIs = Object.values(apis).filter(a => a === 'healthy').length;
        const totalAPIs = Object.keys(apis).length;

        return {
            status: healthyAPIs > 0 ? 'healthy' : 'unhealthy',
            connected: `${healthyAPIs}/${totalAPIs}`,
            apis
        };
    }

    // Ping an API endpoint
    async pingAPI(url, headers = {}) {
        try {
            const start = Date.now();
            const response = await axios.get(url, {
                headers,
                timeout: 5000
            });
            const latency = Date.now() - start;

            return response.status === 200 ? 'healthy' : 'unhealthy';
        } catch (error) {
            return 'unhealthy';
        }
    }

    // System health information
    getSystemHealth() {
        const cpuUsage = os.loadavg();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        return {
            cpu: {
                cores: os.cpus().length,
                loadAverage: {
                    '1m': cpuUsage[0].toFixed(2),
                    '5m': cpuUsage[1].toFixed(2),
                    '15m': cpuUsage[2].toFixed(2)
                }
            },
            memory: {
                total: Math.round(totalMemory / 1024 / 1024),
                used: Math.round(usedMemory / 1024 / 1024),
                free: Math.round(freeMemory / 1024 / 1024),
                percentage: Math.round((usedMemory / totalMemory) * 100),
                unit: 'MB'
            },
            platform: os.platform(),
            uptime: Math.floor(os.uptime())
        };
    }

    // Check if service is ready
    checkReadiness() {
        const checks = {
            database: false,
            server: true
        };

        // Check database connection
        const mongoose = require('mongoose');
        checks.database = mongoose.connection.readyState === 1;

        const ready = Object.values(checks).every(Boolean);

        return {
            ready,
            checks,
            timestamp: new Date().toISOString()
        };
    }

    // Update health check status
    updateHealthCheck(name, status, message = '') {
        this.healthChecks.set(name, {
            status,
            message,
            lastCheck: new Date().toISOString()
        });
    }

    // Get metrics
    getMetrics() {
        const avgResponseTime = this.metrics.responseTime.length > 0
            ? Math.round(this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length)
            : 0;

        return {
            requests: {
                total: this.metrics.requests,
                errors: this.metrics.errors,
                errorRate: this.metrics.requests > 0
                    ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2) + '%'
                    : '0%'
            },
            performance: {
                averageResponseTime: `${avgResponseTime}ms`,
                samples: this.metrics.responseTime.length
            },
            apiCalls: Array.from(this.metrics.apiCalls.entries()).map(([api, count]) => ({
                api,
                calls: count
            })),
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            timestamp: new Date().toISOString()
        };
    }

    // Track request metrics
    trackRequest(duration, error = false) {
        this.metrics.requests++;

        if (error) {
            this.metrics.errors++;
        }

        // Keep last 100 response times
        this.metrics.responseTime.push(duration);
        if (this.metrics.responseTime.length > 100) {
            this.metrics.responseTime.shift();
        }
    }

    // Track API calls
    trackAPICall(api) {
        const current = this.metrics.apiCalls.get(api) || 0;
        this.metrics.apiCalls.set(api, current + 1);
    }

    // Start periodic health checks
    startPeriodicChecks() {
        // Check services every 30 seconds
        setInterval(async () => {
            await this.checkServices();
        }, 30000);

        // Clean old metrics every hour
        setInterval(() => {
            this.metrics.responseTime = [];
            this.metrics.apiCalls.clear();
        }, 3600000);
    }
}

module.exports = HealthCheckService;