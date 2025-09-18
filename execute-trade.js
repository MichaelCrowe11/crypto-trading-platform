#!/usr/bin/env node

// CryptoCrowe - Manual Trade Execution Script
// Execute a LIVE trade with real money

const https = require('https');

// Platform configuration
const PLATFORM_URL = 'crowe-crypto.fly.dev';
const TRADE_AMOUNT = 10; // $10 minimum trade

// Function to make API request
function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: PLATFORM_URL,
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Check platform status
async function checkStatus() {
    console.log('🔍 Checking platform status...\n');

    try {
        // Check health
        const health = await makeRequest('/health');
        console.log('✅ Platform Health:', health.status);

        // Check live trading status
        const liveStatus = await makeRequest('/api/live/status');
        console.log('\n📊 Live Trading Status:');
        console.log('- Mode:', liveStatus.mode || 'Unknown');
        console.log('- Status:', liveStatus.status || 'Unknown');
        console.log('- Message:', liveStatus.message || 'No message');

        // Check balance
        const balance = await makeRequest('/api/live/balance');
        console.log('\n💰 Account Balance:');
        console.log('- Balance:', `$${balance.balance || 0}`);
        console.log('- Mode:', balance.mode);
        console.log('- Min Trade Size:', `$${balance.minTradeSize || 10}`);

        return liveStatus;
    } catch (error) {
        console.error('❌ Error checking status:', error.message);
        return null;
    }
}

// Execute a trade
async function executeTrade(symbol, side, amount) {
    console.log(`\n🎯 Executing ${side.toUpperCase()} trade:`);
    console.log(`- Symbol: ${symbol}`);
    console.log(`- Amount: $${amount}`);
    console.log(`- Type: MARKET ORDER\n`);

    try {
        const tradeData = {
            symbol: symbol,
            side: side,
            amount: amount
        };

        const result = await makeRequest('/api/live/trade', 'POST', tradeData);

        if (result.error) {
            console.error('❌ Trade failed:', result.error);
            if (result.minSize) {
                console.log(`   Minimum trade size: $${result.minSize}`);
            }
        } else {
            console.log('✅ Trade executed successfully!');
            console.log('Order details:', result);
        }

        return result;
    } catch (error) {
        console.error('❌ Trade execution error:', error.message);
        return null;
    }
}

// Main execution
async function main() {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║           CRYPTOCROWE LIVE TRADE EXECUTION               ║
║                                                           ║
║  WARNING: This will execute a REAL MONEY trade           ║
║  Amount: $${TRADE_AMOUNT} USD                                       ║
║                                                           ║
╚══════════════════════════════════════════════════════════╝
    `);

    // First check platform status
    const status = await checkStatus();

    if (!status || status.status === 'disabled') {
        console.log('\n⚠️  Live trading is not enabled on the platform.');
        console.log('The platform may not have valid Coinbase credentials configured.');
        return;
    }

    // Example trade: Buy $10 worth of Bitcoin
    console.log('\n💎 Attempting to execute a $10 BTC purchase...');

    const tradeResult = await executeTrade('BTC-USD', 'buy', TRADE_AMOUNT);

    if (tradeResult && !tradeResult.error) {
        console.log('\n🎉 Trade completed successfully!');

        // Check updated balance
        const newBalance = await makeRequest('/api/live/balance');
        console.log(`\n💰 Updated Balance: $${newBalance.balance || 0}`);
    } else {
        console.log('\n⚠️  Trade could not be executed.');
        console.log('This could be because:');
        console.log('1. Coinbase API credentials are not configured');
        console.log('2. Insufficient balance');
        console.log('3. Market is closed or symbol is invalid');
        console.log('4. Safety limits have been reached');
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkStatus, executeTrade };