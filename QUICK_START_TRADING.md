# 🚀 Quick Start Trading Guide

## Your Platform is Live!
URL: https://crowe-crypto.fly.dev

## Current Status:
- ✅ Platform deployed and running
- ✅ All exchange APIs configured (Coinbase, Binance, Kraken)
- ✅ Blockchain access ready (39 networks via Infura)
- ✅ Database connected (Supabase)
- ⏳ Waiting for initial configuration

## Getting Started:

### 1. Connect Your Wallet (Web Interface)
- Click "Connect Wallet" on the website
- Use MetaMask or WalletConnect
- This allows the bot to trade on your behalf

### 2. Fund Your Exchange Accounts
Make sure you have funds in:
- **Coinbase**: USD or crypto
- **Binance**: USDT or crypto
- **Kraken**: USD or crypto

### 3. Configure Trading Parameters
Set your risk management:
```javascript
{
  "maxPositionSize": 1000,        // Max USD per trade
  "stopLossPercent": 2,            // Stop at 2% loss
  "takeProfitPercent": 5,          // Take profit at 5% gain
  "tradingPairs": ["BTC/USDT", "ETH/USDT"],
  "enableAutomation": true
}
```

### 4. Test with Small Amounts First
- Start with $100-500 to test
- Monitor the bot's performance
- Adjust parameters based on results

## API Endpoints:

### Check Bot Status
```bash
curl https://crowe-crypto.fly.dev/api/status
```

### Get Portfolio Balance
```bash
curl https://crowe-crypto.fly.dev/api/portfolio
```

### Start Trading Bot
```bash
curl -X POST https://crowe-crypto.fly.dev/api/bot/start \
  -H "Content-Type: application/json" \
  -d '{"pairs": ["BTC/USDT"], "strategy": "momentum"}'
```

### Stop Trading Bot
```bash
curl -X POST https://crowe-crypto.fly.dev/api/bot/stop
```

## Trading Strategies Available:

1. **Momentum Trading** - Follows market trends
2. **Mean Reversion** - Buys dips, sells peaks
3. **Arbitrage** - Price differences between exchanges
4. **Grid Trading** - Places orders at intervals
5. **DCA (Dollar Cost Average)** - Regular purchases

## Monitor Performance:

### View Logs
```bash
fly logs --app crowe-crypto
```

### Check Trades
```bash
curl https://crowe-crypto.fly.dev/api/trades
```

## Safety Features:
- ✅ Stop-loss on all trades
- ✅ Maximum position limits
- ✅ No withdrawal permissions
- ✅ IP whitelisting (149.248.201.117)

## Troubleshooting:

### If bot isn't trading:
1. Check exchange balances
2. Verify API permissions
3. Review logs for errors

### If seeing "No Market Data":
The frontend needs to connect to the backend. Try:
1. Refresh the page
2. Check browser console for errors
3. Ensure WebSocket connection is active

## Support Commands:

### Restart bot
```bash
fly machine restart 6832719cd2ee38 --app crowe-crypto
```

### Update configuration
```bash
fly secrets set TRADING_ENABLED=true --app crowe-crypto
```

### Scale for high availability
```bash
fly scale count 2 --app crowe-crypto
```

## Next Steps:
1. 💰 Fund your exchange accounts
2. 🔧 Configure trading parameters
3. 📊 Start with one trading pair
4. 📈 Monitor and adjust

Your bot is ready to trade 24/7 across multiple exchanges!