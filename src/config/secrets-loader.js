// CryptoCrowe - Secrets Configuration Loader
// Loads and validates secrets from environment variables

const logger = require('winston');

class SecretsLoader {
    constructor() {
        this.secrets = {};
        this.loadSecrets();
    }

    loadSecrets() {
        console.log('🔐 Loading secrets from environment...');

        // Coinbase Trading Credentials
        this.secrets.coinbase = {
            apiKey: process.env.COINBASE_API_KEY || '',
            apiSecret: process.env.COINBASE_API_SECRET || '',
            passphrase: process.env.COINBASE_PASSPHRASE || '',
            commerceApiKey: process.env.COINBASE_COMMERCE_API_KEY || ''
        };

        // AI Service Credentials
        this.secrets.ai = {
            openaiKey: process.env.OPENAI_API_KEY || '',
            anthropicKey: process.env.ANTHROPIC_API_KEY || '',
            xaiKey: process.env.XAI_API_KEY || ''
        };

        // Database Credentials
        this.secrets.database = {
            mongoUri: process.env.DATABASE_URL || process.env.MONGODB_URI || '',
            redisUrl: process.env.REDIS_URL || ''
        };

        // Other Services
        this.secrets.services = {
            sentryDsn: process.env.SENTRY_DSN || '',
            jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_change_me'
        };

        this.validateSecrets();
    }

    validateSecrets() {
        console.log('🔍 Validating secrets...');

        const validation = {
            hasCoinbaseTrading: false,
            hasAI: false,
            isReady: false
        };

        // Check Coinbase trading credentials
        if (this.secrets.coinbase.apiKey && this.secrets.coinbase.apiSecret) {
            console.log('✅ Coinbase API credentials found');
            validation.hasCoinbaseTrading = true;

            // Log partial key for verification (first 8 chars only for security)
            const partialKey = this.secrets.coinbase.apiKey.substring(0, 8);
            console.log(`   API Key starts with: ${partialKey}...`);

            if (this.secrets.coinbase.passphrase) {
                console.log('   Passphrase: Present');
            } else {
                console.log('   Passphrase: Not set (may not be required for new API)');
            }
        } else {
            console.warn('⚠️  Coinbase trading credentials not found or incomplete');
            console.log('   Required: COINBASE_API_KEY and COINBASE_API_SECRET');
        }

        // Check AI credentials
        if (this.secrets.ai.openaiKey) {
            console.log('✅ OpenAI API key found');
            validation.hasAI = true;
        }
        if (this.secrets.ai.anthropicKey) {
            console.log('✅ Anthropic API key found');
            validation.hasAI = true;
        }

        // Determine if ready for live trading
        validation.isReady = validation.hasCoinbaseTrading;

        if (validation.isReady) {
            console.log('🎯 Platform ready for LIVE TRADING');
        } else {
            console.log('⚠️  Platform will run in SIMULATION MODE');
        }

        this.validation = validation;
        return validation;
    }

    getCoinbaseConfig() {
        return {
            apiKey: this.secrets.coinbase.apiKey,
            secret: this.secrets.coinbase.apiSecret,
            password: this.secrets.coinbase.passphrase,
            // For new Coinbase Advanced Trade API
            apiVersion: '2023-03-01',
            timeout: 10000,
            enableRateLimit: true,
            rateLimit: 100
        };
    }

    isLiveTradingReady() {
        return this.validation && this.validation.hasCoinbaseTrading;
    }

    getStatus() {
        return {
            coinbase: {
                hasApiKey: !!this.secrets.coinbase.apiKey,
                hasApiSecret: !!this.secrets.coinbase.apiSecret,
                hasPassphrase: !!this.secrets.coinbase.passphrase,
                ready: this.validation.hasCoinbaseTrading
            },
            ai: {
                hasOpenAI: !!this.secrets.ai.openaiKey,
                hasAnthropic: !!this.secrets.ai.anthropicKey,
                ready: this.validation.hasAI
            },
            overall: {
                liveTradingReady: this.validation.isReady,
                mode: this.validation.isReady ? 'PRODUCTION' : 'SIMULATION'
            }
        };
    }
}

// Export singleton instance
module.exports = new SecretsLoader();