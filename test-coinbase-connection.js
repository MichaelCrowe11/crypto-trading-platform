#!/usr/bin/env node

// Test Coinbase Connection
// This script tests if we can connect to Coinbase with the provided credentials

const https = require('https');

async function testConnection() {
    console.log('🔍 Testing Coinbase Connection...\n');

    // First check if credentials are loaded
    const credsResponse = await fetch('https://crowe-crypto.fly.dev/api/debug/credentials');
    const credsData = await credsResponse.json();

    console.log('📋 Credentials Status:');
    console.log(`- API Key: ${credsData.environment.hasCoinbaseKey ? '✅' : '❌'}`);
    console.log(`- API Secret: ${credsData.environment.hasCoinbaseSecret ? '✅' : '❌'}`);
    console.log(`- Passphrase: ${credsData.environment.hasCoinbasePassphrase ? '✅' : '❌'}`);
    console.log(`- Overall Ready: ${credsData.secrets.overall.liveTradingReady ? '✅' : '❌'}`);

    // Check live status
    const statusResponse = await fetch('https://crowe-crypto.fly.dev/api/live/status');
    const statusData = await statusResponse.json();

    console.log('\n📊 Live Trading Status:');
    console.log(`- Status: ${statusData.status}`);
    console.log(`- Mode: ${statusData.mode}`);
    console.log(`- Message: ${statusData.message}`);

    // Try to get balance
    const balanceResponse = await fetch('https://crowe-crypto.fly.dev/api/live/balance');
    const balanceData = await balanceResponse.json();

    console.log('\n💰 Balance Check:');
    console.log(`- Balance: $${balanceData.balance || 0}`);
    console.log(`- Mode: ${balanceData.mode}`);

    if (statusData.status === 'disabled') {
        console.log('\n⚠️  Live trading is not initialized.');
        console.log('\nPossible reasons:');
        console.log('1. The credentials might be for the wrong Coinbase API');
        console.log('   - Ensure you are using Coinbase Advanced Trade API keys');
        console.log('   - NOT Coinbase Commerce or regular Coinbase API');
        console.log('\n2. The API keys might not have the correct permissions');
        console.log('   - Required: View and Trade permissions');
        console.log('\n3. The platform initialization might be failing');
        console.log('   - Check app logs: fly logs --app crowe-crypto');
    } else {
        console.log('\n✅ Live trading is ACTIVE!');
    }
}

// Polyfill fetch for Node.js
if (!global.fetch) {
    global.fetch = require('https').request;
    global.fetch = (url) => {
        return new Promise((resolve) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({
                    json: () => Promise.resolve(JSON.parse(data))
                }));
            });
        });
    };
}

testConnection().catch(console.error);