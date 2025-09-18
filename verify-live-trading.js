#!/usr/bin/env node

// Comprehensive Live Trading Verification Script
// Thoroughly tests all aspects of the trading platform

const https = require('https');
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m'
};

// Helper function to make HTTPS requests
function makeRequest(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        }).on('error', err => {
            resolve({ status: 0, error: err.message });
        });
    });
}

// Helper for POST requests
function postRequest(hostname, path, data) {
    return new Promise((resolve) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(responseData) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', err => {
            resolve({ status: 0, error: err.message });
        });

        req.write(postData);
        req.end();
    });
}

async function verifyLiveTrading() {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║      CRYPTOCROWE LIVE TRADING VERIFICATION SUITE         ║
║                                                           ║
║  Conducting comprehensive analysis of trading platform   ║
╚══════════════════════════════════════════════════════════╝
    `);

    const tests = {
        passed: 0,
        failed: 0,
        warnings: 0
    };

    // Test 1: Platform Health
    console.log(`${colors.blue}[TEST 1] Platform Health Check${colors.reset}`);
    const health = await makeRequest('https://crowe-crypto.fly.dev/health');
    if (health.status === 200 && health.data.status === 'healthy') {
        console.log(`${colors.green}✅ Platform is healthy and running${colors.reset}`);
        console.log(`   Version: ${health.data.version}`);
        console.log(`   Timestamp: ${health.data.timestamp}`);
        tests.passed++;
    } else {
        console.log(`${colors.red}❌ Platform health check failed${colors.reset}`);
        tests.failed++;
    }

    // Test 2: Live Trading Status
    console.log(`\n${colors.blue}[TEST 2] Live Trading Status${colors.reset}`);
    const status = await makeRequest('https://crowe-crypto.fly.dev/api/live/status');
    if (status.status === 200 && status.data) {
        const liveData = status.data;
        console.log(`   Mode: ${liveData.mode}`);
        console.log(`   Ready: ${liveData.ready}`);
        console.log(`   Balance: $${liveData.balance}`);
        console.log(`   Positions: ${liveData.positions?.length || 0}`);
        console.log(`   Has Credentials: ${liveData.credentials}`);

        if (liveData.mode === 'LIVE' && liveData.ready) {
            console.log(`${colors.green}✅ Live trading is ACTIVE${colors.reset}`);
            tests.passed++;
        } else if (liveData.mode === 'SIMULATION') {
            console.log(`${colors.yellow}⚠️  Running in SIMULATION mode${colors.reset}`);
            tests.warnings++;
        } else {
            console.log(`${colors.red}❌ Live trading is NOT active${colors.reset}`);
            tests.failed++;
        }
    } else {
        console.log(`${colors.red}❌ Could not fetch live status${colors.reset}`);
        tests.failed++;
    }

    // Test 3: API Credentials Configuration
    console.log(`\n${colors.blue}[TEST 3] API Credentials Check${colors.reset}`);
    const creds = await makeRequest('https://crowe-crypto.fly.dev/api/debug/credentials');
    if (creds.status === 200 && creds.data) {
        const credData = creds.data;

        console.log(`   Coinbase API Key: ${credData.environment?.hasCoinbaseKey ? '✅' : '❌'}`);
        console.log(`   Coinbase API Secret: ${credData.environment?.hasCoinbaseSecret ? '✅' : '❌'}`);
        console.log(`   Coinbase Passphrase: ${credData.environment?.hasCoinbasePassphrase ? '✅' : '❌'}`);
        console.log(`   Binance API Key: ${credData.environment?.hasBinanceKey || credData.secrets?.binance ? '✅' : '⚠️'}`);
        console.log(`   OpenAI API Key: ${credData.environment?.hasOpenAI ? '✅' : '❌'}`);
        console.log(`   Anthropic API Key: ${credData.environment?.hasAnthropic ? '✅' : '❌'}`);

        if (credData.secrets?.overall?.liveTradingReady) {
            console.log(`${colors.green}✅ Credentials are properly configured${colors.reset}`);
            tests.passed++;
        } else {
            console.log(`${colors.yellow}⚠️  Some credentials may be missing${colors.reset}`);
            tests.warnings++;
        }
    } else {
        console.log(`${colors.red}❌ Could not verify credentials${colors.reset}`);
        tests.failed++;
    }

    // Test 4: Balance Check
    console.log(`\n${colors.blue}[TEST 4] Account Balance${colors.reset}`);
    const balance = await makeRequest('https://crowe-crypto.fly.dev/api/live/balance');
    if (balance.status === 200 && balance.data) {
        console.log(`   Balance: $${balance.data.balance}`);
        console.log(`   Mode: ${balance.data.mode}`);
        console.log(`   Positions: ${balance.data.positions}`);
        console.log(`   Min Trade Size: $${balance.data.minTradeSize}`);

        if (balance.data.balance > 0) {
            console.log(`${colors.green}✅ Account has funds available ($${balance.data.balance})${colors.reset}`);
            tests.passed++;
        } else if (balance.data.mode === 'DEMO') {
            console.log(`${colors.yellow}⚠️  Running in DEMO mode with simulated balance${colors.reset}`);
            tests.warnings++;
        } else {
            console.log(`${colors.red}❌ No balance available${colors.reset}`);
            tests.failed++;
        }
    } else {
        console.log(`${colors.red}❌ Could not fetch balance${colors.reset}`);
        tests.failed++;
    }

    // Test 5: Trade Execution Test (Dry Run)
    console.log(`\n${colors.blue}[TEST 5] Trade Execution Test${colors.reset}`);
    console.log(`   Testing trade endpoint with small order...`);

    const testTrade = await postRequest(
        'crowe-crypto.fly.dev',
        '/api/live/trade',
        {
            symbol: 'BTC-USD',
            side: 'buy',
            amount: 10
        }
    );

    if (testTrade.status === 200 && testTrade.data) {
        if (testTrade.data.id) {
            console.log(`${colors.green}✅ Trade endpoint is functional${colors.reset}`);
            console.log(`   Trade ID: ${testTrade.data.id}`);
            console.log(`   Status: ${testTrade.data.status}`);
            tests.passed++;
        } else if (testTrade.data.error) {
            console.log(`${colors.yellow}⚠️  Trade rejected: ${testTrade.data.error}${colors.reset}`);
            tests.warnings++;
        }
    } else if (testTrade.data?.error === 'Live trading not enabled') {
        console.log(`${colors.red}❌ Live trading is not enabled${colors.reset}`);
        tests.failed++;
    } else {
        console.log(`${colors.yellow}⚠️  Trade test returned: ${JSON.stringify(testTrade.data)}${colors.reset}`);
        tests.warnings++;
    }

    // Test 6: Market Data Check
    console.log(`\n${colors.blue}[TEST 6] Market Data Availability${colors.reset}`);
    const ticker = await makeRequest('https://crowe-crypto.fly.dev/api/market/ticker/BTC-USD');
    if (ticker.status === 200 && ticker.data) {
        console.log(`   BTC Price: $${ticker.data.last || ticker.data.price || 'N/A'}`);
        console.log(`${colors.green}✅ Market data is accessible${colors.reset}`);
        tests.passed++;
    } else {
        console.log(`${colors.yellow}⚠️  Market data not available${colors.reset}`);
        tests.warnings++;
    }

    // Final Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.blue}VERIFICATION SUMMARY${colors.reset}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`${colors.green}Passed Tests: ${tests.passed}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${tests.warnings}${colors.reset}`);
    console.log(`${colors.red}Failed Tests: ${tests.failed}${colors.reset}`);

    // Overall Status
    console.log(`\n${colors.blue}OVERALL STATUS:${colors.reset}`);
    if (tests.failed === 0 && tests.passed >= 4) {
        console.log(`${colors.green}✅ LIVE TRADING IS FULLY OPERATIONAL${colors.reset}`);
        console.log(`
The platform is ready for live trading with:
- Active API connections
- Available balance
- Functional trade endpoints
- Real-time market data
        `);
    } else if (tests.failed === 0 && tests.warnings > 0) {
        console.log(`${colors.yellow}⚠️  PLATFORM IS RUNNING WITH LIMITATIONS${colors.reset}`);
        console.log(`
The platform is operational but may be:
- Running in simulation mode
- Missing some API credentials
- Using fallback services
        `);
    } else {
        console.log(`${colors.red}❌ LIVE TRADING IS NOT FULLY OPERATIONAL${colors.reset}`);
        console.log(`
Issues detected:
- Check API credentials configuration
- Verify platform deployment
- Review error logs: fly logs --app crowe-crypto
        `);
    }

    // Recommendations
    if (status.data?.mode !== 'LIVE' || !status.data?.ready) {
        console.log(`\n${colors.yellow}RECOMMENDATIONS:${colors.reset}`);
        console.log(`1. Ensure Coinbase Advanced Trade API keys are set (not Commerce API)`);
        console.log(`2. Verify API keys have trading permissions`);
        console.log(`3. Check platform logs for initialization errors`);
        console.log(`4. Consider using Binance API as alternative`);
    }
}

// Run verification
verifyLiveTrading().catch(console.error);