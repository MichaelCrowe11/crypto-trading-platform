// CryptoCrowe - AI Trading Orchestrator
// Multi-model consensus for trading decisions - ACTIVE DOWN TO $10

const EventEmitter = require('events');
const logger = require('winston');

class AIOrchestrator extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.models = [];
        this.isAnalyzing = false;
        this.signalBuffer = [];
        this.microTradeStrategy = true; // Enable micro trading down to $10
    }

    async initialize() {
        logger.info('🤖 Initializing AI Orchestrator...');
        logger.info('💎 Micro trading strategy enabled - Active down to $10');

        // Initialize AI models
        this.models = [
            { name: 'openai', weight: this.config.ai.weights.openai },
            { name: 'anthropic', weight: this.config.ai.weights.anthropic },
            { name: 'xai', weight: this.config.ai.weights.xai }
        ];

        logger.info(`Loaded ${this.models.length} AI models for consensus`);
        return true;
    }

    async processMarketData(data) {
        if (this.isAnalyzing) return;

        this.isAnalyzing = true;
        try {
            const signals = await this.analyzeMarket(data);

            // Emit high-confidence signals
            for (const signal of signals) {
                if (signal.confidence >= this.config.ai.decisionThreshold) {
                    // Prioritize micro trades for portfolio diversification
                    if (signal.amount <= 20) {
                        logger.info(`🎯 Micro trade signal: ${signal.symbol} ${signal.action} $${signal.amount}`);
                    }
                    this.emit('signal', signal);
                }
            }
        } catch (error) {
            logger.error('AI analysis error:', error);
        } finally {
            this.isAnalyzing = false;
        }
    }

    async analyzeMarket(data) {
        const signals = [];

        // Analyze each trading pair
        for (const pair of this.config.coinbase.tradingPairs) {
            const signal = await this.generateSignal(pair, data);
            if (signal) {
                signals.push(signal);
            }
        }

        return signals;
    }

    async generateSignal(symbol, marketData) {
        // Calculate technical indicators
        const indicators = this.calculateIndicators(marketData);

        // Get model predictions
        const predictions = await this.getModelConsensus(symbol, indicators);

        if (predictions.confidence >= this.config.ai.decisionThreshold) {
            // Determine position size based on confidence and strategy
            const amount = this.calculatePositionSize(predictions.confidence);

            return {
                symbol,
                action: predictions.action,
                side: predictions.action === 'buy' ? 'buy' : 'sell',
                amount,
                confidence: predictions.confidence,
                timestamp: Date.now()
            };
        }

        return null;
    }

    calculateIndicators(data) {
        // Simplified indicator calculation
        return {
            rsi: Math.random() * 100, // Placeholder
            macd: Math.random() * 2 - 1,
            ema_trend: Math.random() > 0.5 ? 'up' : 'down',
            volume_spike: Math.random() > 0.7
        };
    }

    async getModelConsensus(symbol, indicators) {
        // Simulate model predictions
        const predictions = this.models.map(model => ({
            model: model.name,
            action: Math.random() > 0.5 ? 'buy' : 'sell',
            confidence: 60 + Math.random() * 40, // 60-100%
            weight: model.weight
        }));

        // Calculate weighted consensus
        let totalWeight = 0;
        let buyWeight = 0;
        let sellWeight = 0;

        for (const pred of predictions) {
            totalWeight += pred.weight * pred.confidence;
            if (pred.action === 'buy') {
                buyWeight += pred.weight * pred.confidence;
            } else {
                sellWeight += pred.weight * pred.confidence;
            }
        }

        const action = buyWeight > sellWeight ? 'buy' : 'sell';
        const confidence = Math.max(buyWeight, sellWeight) / totalWeight * 100;

        return { action, confidence };
    }

    calculatePositionSize(confidence) {
        const { minPositionSize, maxPositionSize } = this.config.trading;

        // Favor micro trades for diversification
        if (this.microTradeStrategy && Math.random() > 0.4) {
            // 60% chance of micro trade ($10-20)
            return minPositionSize + Math.random() * 10;
        }

        // Scale position size with confidence
        const scaleFactor = (confidence - 70) / 30; // 70-100% confidence
        const size = minPositionSize + (maxPositionSize - minPositionSize) * scaleFactor;

        return Math.min(Math.max(size, minPositionSize), maxPositionSize);
    }

    startAnalysis() {
        logger.info('Starting AI analysis loop...');
        logger.info(`Analysis interval: ${this.config.ai.analysisInterval}ms`);
        logger.info(`Micro trading enabled: $10-$20 positions prioritized`);

        setInterval(() => {
            this.emit('analyze');
        }, this.config.ai.analysisInterval);
    }

    async getStatus() {
        return {
            ready: true,
            models: this.models,
            analyzing: this.isAnalyzing,
            microTradeEnabled: this.microTradeStrategy,
            minTradeSize: this.config.trading.minPositionSize,
            threshold: this.config.ai.decisionThreshold
        };
    }

    stop() {
        logger.info('Stopping AI Orchestrator');
        this.isAnalyzing = false;
    }
}

module.exports = AIOrchestrator;