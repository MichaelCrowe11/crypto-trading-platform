// Notification Service - Handle alerts and notifications
const axios = require('axios');

class NotificationService {
    constructor() {
        this.providers = {
            telegram: process.env.TELEGRAM_BOT_TOKEN,
            discord: process.env.DISCORD_WEBHOOK_URL,
            slack: process.env.SLACK_WEBHOOK_URL,
            email: process.env.SENDGRID_API_KEY
        };

        this.userPreferences = new Map();
    }

    // Send trade notification
    async sendTradeNotification(userId, trade) {
        try {
            const preferences = await this.getUserPreferences(userId);
            if (!preferences.tradeAlerts) return;

            const message = this.formatTradeMessage(trade);
            await this.sendNotification(userId, message, 'trade');

        } catch (error) {
            console.error('Trade notification error:', error);
        }
    }

    // Send price alert
    async sendPriceAlert(userId, alert, currentPrice) {
        try {
            const message = this.formatPriceAlertMessage(alert, currentPrice);
            await this.sendNotification(userId, message, 'price_alert');

        } catch (error) {
            console.error('Price alert error:', error);
        }
    }

    // Send portfolio update
    async sendPortfolioUpdate(userId, portfolio) {
        try {
            const preferences = await this.getUserPreferences(userId);
            if (!preferences.portfolioUpdates) return;

            const message = this.formatPortfolioMessage(portfolio);
            await this.sendNotification(userId, message, 'portfolio');

        } catch (error) {
            console.error('Portfolio notification error:', error);
        }
    }

    // Send strategy notification
    async sendStrategyNotification(userId, strategy, action) {
        try {
            const preferences = await this.getUserPreferences(userId);
            if (!preferences.strategyAlerts) return;

            const message = this.formatStrategyMessage(strategy, action);
            await this.sendNotification(userId, message, 'strategy');

        } catch (error) {
            console.error('Strategy notification error:', error);
        }
    }

    // Send general notification
    async sendNotification(userId, message, type) {
        const preferences = await this.getUserPreferences(userId);
        const channels = preferences.channels || ['email'];

        for (const channel of channels) {
            try {
                switch (channel) {
                    case 'telegram':
                        await this.sendTelegram(userId, message);
                        break;
                    case 'discord':
                        await this.sendDiscord(message);
                        break;
                    case 'slack':
                        await this.sendSlack(message);
                        break;
                    case 'email':
                        await this.sendEmail(userId, message, type);
                        break;
                }
            } catch (error) {
                console.error(`Failed to send ${channel} notification:`, error);
            }
        }
    }

    // Send Telegram notification
    async sendTelegram(userId, message) {
        if (!this.providers.telegram) return;

        const chatId = await this.getTelegramChatId(userId);
        if (!chatId) return;

        await axios.post(`https://api.telegram.org/bot${this.providers.telegram}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
    }

    // Send Discord notification
    async sendDiscord(message) {
        if (!this.providers.discord) return;

        await axios.post(this.providers.discord, {
            content: message,
            embeds: [{
                title: 'CryptoCrowe Trading Alert',
                description: message,
                color: 0x00ff00,
                timestamp: new Date().toISOString()
            }]
        });
    }

    // Send Slack notification
    async sendSlack(message) {
        if (!this.providers.slack) return;

        await axios.post(this.providers.slack, {
            text: message,
            attachments: [{
                color: 'good',
                text: message,
                timestamp: Math.floor(Date.now() / 1000)
            }]
        });
    }

    // Send Email notification
    async sendEmail(userId, message, type) {
        if (!this.providers.email) return;

        const userEmail = await this.getUserEmail(userId);
        if (!userEmail) return;

        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(this.providers.email);

        const msg = {
            to: userEmail,
            from: 'alerts@cryptocrowe.com',
            subject: this.getEmailSubject(type),
            text: message,
            html: this.formatEmailHTML(message, type)
        };

        await sgMail.send(msg);
    }

    // Format trade message
    formatTradeMessage(trade) {
        const emoji = trade.side === 'buy' ? '🟢' : '🔴';
        const action = trade.side.toUpperCase();

        return `${emoji} **Trade Executed**

**Action:** ${action}
**Symbol:** ${trade.symbol}
**Amount:** ${trade.amount}
**Price:** $${trade.price}
**Exchange:** ${trade.exchange}
**Total:** $${(trade.amount * trade.price).toFixed(2)}

*Time: ${new Date().toLocaleString()}*`;
    }

    // Format price alert message
    formatPriceAlertMessage(alert, currentPrice) {
        const direction = currentPrice >= alert.targetPrice ? 'above' : 'below';
        const emoji = direction === 'above' ? '📈' : '📉';

        return `${emoji} **Price Alert Triggered**

**${alert.symbol}** is now ${direction} your target price!

**Current Price:** $${currentPrice}
**Target Price:** $${alert.targetPrice}
**Change:** ${((currentPrice - alert.targetPrice) / alert.targetPrice * 100).toFixed(2)}%

*Alert created: ${new Date(alert.createdAt).toLocaleDateString()}*`;
    }

    // Format portfolio message
    formatPortfolioMessage(portfolio) {
        const changeEmoji = portfolio.performance.dayChangePercent >= 0 ? '📈' : '📉';
        const changeSign = portfolio.performance.dayChangePercent >= 0 ? '+' : '';

        return `💼 **Portfolio Update**

**Total Value:** $${portfolio.totalValue.toFixed(2)}
**24h Change:** ${changeSign}${portfolio.performance.dayChangePercent.toFixed(2)}%
**24h P&L:** ${changeSign}$${portfolio.performance.dayChange.toFixed(2)}

**Top Performers:**
${this.getTopPerformersText(portfolio.positions)}

**Diversification Score:** ${portfolio.diversification.score.toFixed(1)}/100
**Risk Level:** ${portfolio.riskMetrics.volatility > 20 ? 'HIGH' : 'MODERATE'}

*Updated: ${new Date().toLocaleString()}*`;
    }

    // Format strategy message
    formatStrategyMessage(strategy, action) {
        const emoji = {
            activated: '✅',
            deactivated: '⏹️',
            trade_executed: '⚡',
            error: '❌'
        }[action] || '🔔';

        return `${emoji} **Strategy ${action.replace('_', ' ').toUpperCase()}**

**Strategy:** ${strategy.name}
**Type:** ${strategy.type}
**Symbol:** ${strategy.parameters.symbol}

**Performance:**
- Total Trades: ${strategy.performance.totalTrades}
- Win Rate: ${(strategy.performance.winRate * 100).toFixed(1)}%
- Profit Factor: ${strategy.performance.profitFactor.toFixed(2)}

*Time: ${new Date().toLocaleString()}*`;
    }

    // Get top performers text
    getTopPerformersText(positions) {
        const positionArray = Object.values(positions);
        const sorted = positionArray
            .sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
            .slice(0, 3);

        return sorted.map(pos => {
            const sign = pos.unrealizedPnLPercent >= 0 ? '+' : '';
            return `• ${pos.symbol}: ${sign}${pos.unrealizedPnLPercent.toFixed(2)}%`;
        }).join('\n') || 'No positions';
    }

    // Get email subject
    getEmailSubject(type) {
        const subjects = {
            trade: 'Trade Executed - CryptoCrowe',
            price_alert: 'Price Alert Triggered - CryptoCrowe',
            portfolio: 'Portfolio Update - CryptoCrowe',
            strategy: 'Strategy Notification - CryptoCrowe'
        };

        return subjects[type] || 'CryptoCrowe Notification';
    }

    // Format email HTML
    formatEmailHTML(message, type) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background: #1a73e8; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f8f9fa; }
                .footer { padding: 10px; text-align: center; color: #666; }
                pre { background: white; padding: 15px; border-left: 4px solid #1a73e8; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🦅 CryptoCrowe</h1>
                <p>Autonomous Trading Platform</p>
            </div>
            <div class="content">
                <pre>${message}</pre>
            </div>
            <div class="footer">
                <p>This is an automated message from CryptoCrowe Trading Platform</p>
                <p><a href="#">Manage Notifications</a> | <a href="#">Support</a></p>
            </div>
        </body>
        </html>`;
    }

    // Send daily reports
    async sendDailyReports() {
        try {
            // This would fetch all users with daily report preferences
            const users = await this.getUsersWithDailyReports();

            for (const user of users) {
                const portfolio = await this.getPortfolio(user.id);
                const trades = await this.getDailyTrades(user.id);

                const report = this.generateDailyReport(portfolio, trades);
                await this.sendNotification(user.id, report, 'daily_report');
            }

        } catch (error) {
            console.error('Daily reports error:', error);
        }
    }

    // Generate daily report
    generateDailyReport(portfolio, trades) {
        return `📊 **Daily Trading Report**

**Portfolio Summary:**
- Total Value: $${portfolio.totalValue.toFixed(2)}
- 24h Change: ${portfolio.performance.dayChangePercent >= 0 ? '+' : ''}${portfolio.performance.dayChangePercent.toFixed(2)}%
- P&L: $${portfolio.performance.dayChange.toFixed(2)}

**Today's Activity:**
- Trades Executed: ${trades.length}
- Total Volume: $${trades.reduce((sum, t) => sum + (t.amount * t.price), 0).toFixed(2)}

**Market Sentiment:** ${this.getMarketSentiment()}

*Report generated: ${new Date().toLocaleDateString()}*`;
    }

    // Get market sentiment (placeholder)
    getMarketSentiment() {
        const sentiments = ['Bullish 🐂', 'Bearish 🐻', 'Neutral 😐', 'Volatile ⚡'];
        return sentiments[Math.floor(Math.random() * sentiments.length)];
    }

    // Set user notification preferences
    async setUserPreferences(userId, preferences) {
        this.userPreferences.set(userId, preferences);

        // Save to database
        await this.savePreferences(userId, preferences);
    }

    // Get user notification preferences
    async getUserPreferences(userId) {
        let preferences = this.userPreferences.get(userId);

        if (!preferences) {
            preferences = await this.loadPreferences(userId);
            this.userPreferences.set(userId, preferences);
        }

        return preferences || this.getDefaultPreferences();
    }

    // Get default preferences
    getDefaultPreferences() {
        return {
            tradeAlerts: true,
            portfolioUpdates: true,
            strategyAlerts: true,
            priceAlerts: true,
            dailyReports: false,
            channels: ['email']
        };
    }

    // Placeholder database methods
    async getTelegramChatId(userId) {
        // Would fetch from database
        return null;
    }

    async getUserEmail(userId) {
        // Would fetch from database
        return 'user@example.com';
    }

    async getUsersWithDailyReports() {
        // Would fetch from database
        return [];
    }

    async getPortfolio(userId) {
        // Would fetch portfolio data
        return { totalValue: 0, performance: { dayChangePercent: 0, dayChange: 0 } };
    }

    async getDailyTrades(userId) {
        // Would fetch today's trades
        return [];
    }

    async savePreferences(userId, preferences) {
        // Would save to database
        console.log(`Saving preferences for user ${userId}`);
    }

    async loadPreferences(userId) {
        // Would load from database
        return null;
    }
}

module.exports = NotificationService;