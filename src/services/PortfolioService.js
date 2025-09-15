// Portfolio Service - Track and analyze user portfolios
const EventEmitter = require('events');

class PortfolioService extends EventEmitter {
    constructor(marketDataService, supabaseService) {
        super();
        this.marketDataService = marketDataService;
        this.supabaseService = supabaseService;
        this.portfolioCache = new Map();
    }

    // Get user's complete portfolio
    async getUserPortfolio(userId) {
        try {
            // Check cache first
            const cached = this.portfolioCache.get(userId);
            if (cached && Date.now() - cached.lastUpdated < 30000) {
                return cached.data;
            }

            // Fetch portfolio data from database
            const portfolioData = await this.supabaseService.getPortfolio(userId);

            if (!portfolioData) {
                return this.createEmptyPortfolio(userId);
            }

            // Get current market prices
            const holdings = portfolioData.holdings || {};
            const symbols = Object.keys(holdings);

            if (symbols.length === 0) {
                return this.createEmptyPortfolio(userId);
            }

            const currentPrices = await this.marketDataService.getAggregatedPrices(symbols);

            // Calculate current values
            let totalValue = 0;
            const positions = {};

            for (const [symbol, holding] of Object.entries(holdings)) {
                const currentPrice = currentPrices[symbol]?.price || 0;
                const value = holding.amount * currentPrice;
                const unrealizedPnL = (currentPrice - holding.avgPrice) * holding.amount;
                const unrealizedPnLPercent = holding.avgPrice > 0 ?
                    ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100 : 0;

                positions[symbol] = {
                    symbol,
                    amount: holding.amount,
                    avgPrice: holding.avgPrice,
                    currentPrice,
                    value,
                    unrealizedPnL,
                    unrealizedPnLPercent,
                    allocation: 0 // Will be calculated after total
                };

                totalValue += value;
            }

            // Calculate allocations
            for (const position of Object.values(positions)) {
                position.allocation = totalValue > 0 ? (position.value / totalValue) * 100 : 0;
            }

            // Calculate portfolio metrics
            const performance = await this.calculatePerformanceMetrics(userId, portfolioData, totalValue);

            const portfolio = {
                userId,
                totalValue,
                positions,
                performance,
                diversification: this.calculateDiversification(positions),
                riskMetrics: this.calculateRiskMetrics(positions),
                lastUpdated: Date.now()
            };

            // Cache the portfolio
            this.portfolioCache.set(userId, {
                data: portfolio,
                lastUpdated: Date.now()
            });

            return portfolio;

        } catch (error) {
            console.error('Portfolio fetch error:', error);
            throw error;
        }
    }

    // Create empty portfolio
    createEmptyPortfolio(userId) {
        return {
            userId,
            totalValue: 0,
            positions: {},
            performance: {
                totalReturn: 0,
                totalReturnPercent: 0,
                dayChange: 0,
                dayChangePercent: 0,
                weekChange: 0,
                weekChangePercent: 0,
                monthChange: 0,
                monthChangePercent: 0
            },
            diversification: {
                score: 0,
                numberOfAssets: 0,
                maxAllocation: 0
            },
            riskMetrics: {
                volatility: 0,
                sharpeRatio: 0,
                maxDrawdown: 0,
                beta: 0
            },
            lastUpdated: Date.now()
        };
    }

    // Update portfolio holdings after a trade
    async updatePortfolioAfterTrade(userId, trade) {
        try {
            const portfolio = await this.supabaseService.getPortfolio(userId) || { holdings: {} };
            const holdings = portfolio.holdings || {};

            const symbol = trade.symbol;
            const amount = parseFloat(trade.amount);
            const price = parseFloat(trade.price);
            const side = trade.side;

            if (!holdings[symbol]) {
                holdings[symbol] = { amount: 0, avgPrice: 0, totalCost: 0 };
            }

            const holding = holdings[symbol];

            if (side === 'buy') {
                // Add to position
                const newTotalCost = holding.totalCost + (amount * price);
                const newAmount = holding.amount + amount;
                holding.avgPrice = newAmount > 0 ? newTotalCost / newAmount : 0;
                holding.amount = newAmount;
                holding.totalCost = newTotalCost;
            } else if (side === 'sell') {
                // Reduce position
                const soldValue = amount * price;
                const costBasis = amount * holding.avgPrice;

                holding.amount = Math.max(0, holding.amount - amount);
                holding.totalCost = Math.max(0, holding.totalCost - costBasis);

                // Calculate realized P&L
                const realizedPnL = soldValue - costBasis;

                // Track realized P&L
                if (!portfolio.realizedPnL) portfolio.realizedPnL = 0;
                portfolio.realizedPnL += realizedPnL;

                // Remove holding if amount is zero
                if (holding.amount === 0) {
                    delete holdings[symbol];
                }
            }

            // Update portfolio in database
            await this.supabaseService.updatePortfolio(userId, {
                holdings,
                realizedPnL: portfolio.realizedPnL || 0,
                lastTradeAt: new Date().toISOString()
            });

            // Clear cache to force refresh
            this.portfolioCache.delete(userId);

            this.emit('portfolioUpdated', { userId, trade });

        } catch (error) {
            console.error('Portfolio update error:', error);
            throw error;
        }
    }

    // Calculate performance metrics
    async calculatePerformanceMetrics(userId, portfolioData, currentValue) {
        try {
            const initialValue = portfolioData.initialValue || 10000; // Default starting value
            const realizedPnL = portfolioData.realizedPnL || 0;

            // Get historical values for different periods
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const [dayValue, weekValue, monthValue] = await Promise.all([
                this.getPortfolioValueAtTime(userId, dayAgo),
                this.getPortfolioValueAtTime(userId, weekAgo),
                this.getPortfolioValueAtTime(userId, monthAgo)
            ]);

            return {
                totalReturn: currentValue - initialValue + realizedPnL,
                totalReturnPercent: ((currentValue - initialValue + realizedPnL) / initialValue) * 100,
                dayChange: currentValue - (dayValue || currentValue),
                dayChangePercent: dayValue ? ((currentValue - dayValue) / dayValue) * 100 : 0,
                weekChange: currentValue - (weekValue || currentValue),
                weekChangePercent: weekValue ? ((currentValue - weekValue) / weekValue) * 100 : 0,
                monthChange: currentValue - (monthValue || currentValue),
                monthChangePercent: monthValue ? ((currentValue - monthValue) / monthValue) * 100 : 0,
                realizedPnL
            };
        } catch (error) {
            console.error('Performance calculation error:', error);
            return {
                totalReturn: 0,
                totalReturnPercent: 0,
                dayChange: 0,
                dayChangePercent: 0,
                weekChange: 0,
                weekChangePercent: 0,
                monthChange: 0,
                monthChangePercent: 0,
                realizedPnL: 0
            };
        }
    }

    // Get portfolio value at specific time (placeholder)
    async getPortfolioValueAtTime(userId, timestamp) {
        // This would require historical portfolio snapshots
        // For now, return null to indicate no historical data
        return null;
    }

    // Calculate diversification metrics
    calculateDiversification(positions) {
        const allocations = Object.values(positions).map(p => p.allocation);
        const numberOfAssets = allocations.length;

        if (numberOfAssets === 0) {
            return { score: 0, numberOfAssets: 0, maxAllocation: 0 };
        }

        const maxAllocation = Math.max(...allocations);

        // Calculate Herfindahl-Hirschman Index (lower is more diversified)
        const hhi = allocations.reduce((sum, allocation) => {
            return sum + Math.pow(allocation / 100, 2);
        }, 0);

        // Convert to diversification score (0-100, higher is better)
        const diversificationScore = numberOfAssets > 1 ?
            Math.max(0, 100 - (hhi * 100)) : 0;

        return {
            score: diversificationScore,
            numberOfAssets,
            maxAllocation,
            hhi
        };
    }

    // Calculate risk metrics
    calculateRiskMetrics(positions) {
        const allocations = Object.values(positions).map(p => p.allocation);

        if (allocations.length === 0) {
            return { volatility: 0, sharpeRatio: 0, maxDrawdown: 0, beta: 0 };
        }

        // Simplified risk calculation
        // In a real implementation, you'd use historical price data
        const avgAllocation = allocations.reduce((a, b) => a + b, 0) / allocations.length;
        const variance = allocations.reduce((sum, allocation) => {
            return sum + Math.pow(allocation - avgAllocation, 2);
        }, 0) / allocations.length;

        const volatility = Math.sqrt(variance);

        return {
            volatility,
            sharpeRatio: 0, // Would need risk-free rate and returns
            maxDrawdown: 0, // Would need historical data
            beta: 1 // Would need market comparison
        };
    }

    // Get portfolio performance over time
    async getPerformance(userId, period = '24h') {
        try {
            const portfolio = await this.getUserPortfolio(userId);

            const periods = {
                '1h': { hours: 1 },
                '24h': { hours: 24 },
                '7d': { days: 7 },
                '30d': { days: 30 },
                '90d': { days: 90 },
                '1y': { days: 365 }
            };

            const periodConfig = periods[period];
            if (!periodConfig) {
                throw new Error('Invalid period');
            }

            // Generate performance data points
            const dataPoints = [];
            const now = Date.now();
            const interval = periodConfig.hours ?
                periodConfig.hours * 60 * 60 * 1000 / 24 : // 24 points for hours
                periodConfig.days * 24 * 60 * 60 * 1000 / 30; // 30 points for days

            for (let i = 30; i >= 0; i--) {
                const timestamp = now - (i * interval);
                const value = await this.getPortfolioValueAtTime(userId, new Date(timestamp));

                dataPoints.push({
                    timestamp,
                    value: value || portfolio.totalValue, // Use current value if no historical data
                    change: 0, // Would calculate from previous point
                    changePercent: 0
                });
            }

            return {
                period,
                dataPoints,
                summary: {
                    startValue: dataPoints[0]?.value || 0,
                    endValue: dataPoints[dataPoints.length - 1]?.value || 0,
                    change: portfolio.performance[`${period.replace(/\d+/, '')}Change`] || 0,
                    changePercent: portfolio.performance[`${period.replace(/\d+/, '')}ChangePercent`] || 0,
                    high: Math.max(...dataPoints.map(p => p.value)),
                    low: Math.min(...dataPoints.map(p => p.value))
                }
            };
        } catch (error) {
            console.error('Performance fetch error:', error);
            throw error;
        }
    }

    // Update all portfolios (for scheduled tasks)
    async updateAllPortfolios() {
        try {
            // This would fetch all user IDs from database
            // For now, just update cached portfolios
            for (const userId of this.portfolioCache.keys()) {
                try {
                    await this.getUserPortfolio(userId);
                } catch (error) {
                    console.error(`Failed to update portfolio for user ${userId}:`, error);
                }
            }
        } catch (error) {
            console.error('Bulk portfolio update error:', error);
        }
    }

    // Get portfolio allocation recommendations
    async getRebalanceRecommendations(userId) {
        try {
            const portfolio = await this.getUserPortfolio(userId);
            const positions = Object.values(portfolio.positions);

            if (positions.length === 0) {
                return { recommendations: [], reason: 'No positions to rebalance' };
            }

            const recommendations = [];

            // Check for over-concentrated positions
            const maxRecommendedAllocation = 25; // 25% max per asset
            for (const position of positions) {
                if (position.allocation > maxRecommendedAllocation) {
                    const excessAmount = position.value *
                        ((position.allocation - maxRecommendedAllocation) / 100);

                    recommendations.push({
                        type: 'reduce',
                        symbol: position.symbol,
                        currentAllocation: position.allocation,
                        recommendedAllocation: maxRecommendedAllocation,
                        action: `Sell ${excessAmount.toFixed(2)} USD worth of ${position.symbol}`,
                        reason: 'Over-concentrated position'
                    });
                }
            }

            // Check for insufficient diversification
            if (portfolio.diversification.score < 50 && portfolio.totalValue > 1000) {
                recommendations.push({
                    type: 'diversify',
                    action: 'Consider adding more assets to improve diversification',
                    reason: `Diversification score: ${portfolio.diversification.score.toFixed(1)}/100`,
                    suggestions: ['BTC', 'ETH', 'SOL', 'ADA'].filter(symbol =>
                        !positions.find(p => p.symbol.startsWith(symbol))
                    )
                });
            }

            return {
                recommendations,
                diversificationScore: portfolio.diversification.score,
                riskLevel: this.assessRiskLevel(portfolio)
            };

        } catch (error) {
            console.error('Rebalance recommendations error:', error);
            throw error;
        }
    }

    // Assess portfolio risk level
    assessRiskLevel(portfolio) {
        const { volatility } = portfolio.riskMetrics;
        const { maxAllocation } = portfolio.diversification;

        if (volatility > 20 || maxAllocation > 50) {
            return 'HIGH';
        } else if (volatility > 10 || maxAllocation > 30) {
            return 'MEDIUM';
        } else {
            return 'LOW';
        }
    }

    // Get top performers and losers
    getTopPerformers(userId, limit = 5) {
        const cached = this.portfolioCache.get(userId);
        if (!cached) return { gainers: [], losers: [] };

        const positions = Object.values(cached.data.positions);

        const gainers = positions
            .filter(p => p.unrealizedPnLPercent > 0)
            .sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
            .slice(0, limit);

        const losers = positions
            .filter(p => p.unrealizedPnLPercent < 0)
            .sort((a, b) => a.unrealizedPnLPercent - b.unrealizedPnLPercent)
            .slice(0, limit);

        return { gainers, losers };
    }

    // Clear portfolio cache
    clearCache(userId) {
        this.portfolioCache.delete(userId);
    }
}

module.exports = PortfolioService;