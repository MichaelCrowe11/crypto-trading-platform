# Crowe-Crypto Bot Setup Guide

## Current Status
✅ App is deployed and running at: https://crowe-crypto.fly.dev
✅ Core security secrets are configured
⏳ Exchange and wallet APIs need to be connected

## Adding Your API Keys

### 1. Exchange APIs (for automated trading)

#### Coinbase
```bash
fly secrets set \
  COINBASE_API_KEY='your-api-key' \
  COINBASE_API_SECRET='your-api-secret' \
  COINBASE_PASSPHRASE='your-passphrase' \
  --app crowe-crypto
```

#### Binance
```bash
fly secrets set \
  BINANCE_API_KEY='your-api-key' \
  BINANCE_API_SECRET='your-api-secret' \
  --app crowe-crypto
```

#### Kraken
```bash
fly secrets set \
  KRAKEN_API_KEY='your-api-key' \
  KRAKEN_API_SECRET='your-api-secret' \
  --app crowe-crypto
```

### 2. Wallet Connection (for DeFi/DEX trading)

#### WalletConnect (for connecting user wallets)
```bash
fly secrets set \
  WALLET_CONNECT_PROJECT_ID='your-project-id' \
  --app crowe-crypto
```
Get your project ID at: https://cloud.walletconnect.com/

#### Ethereum/Web3 Setup (for automated blockchain transactions)
```bash
fly secrets set \
  ETHEREUM_RPC='https://mainnet.infura.io/v3/your-key' \
  WALLET_PRIVATE_KEY='your-bot-wallet-private-key' \
  --app crowe-crypto
```

**⚠️ SECURITY WARNING**:
- Never share your private keys
- Use a dedicated bot wallet with limited funds
- Consider using a hardware wallet for large amounts

### 3. Additional Blockchain Networks (optional)

```bash
fly secrets set \
  POLYGON_RPC='https://polygon-rpc.com' \
  BSC_RPC='https://bsc-dataseed.binance.org' \
  ARBITRUM_RPC='https://arb1.arbitrum.io/rpc' \
  --app crowe-crypto
```

### 4. Database Setup (optional but recommended)

#### MongoDB (for trade history and analytics)
```bash
fly secrets set \
  MONGODB_URI='mongodb+srv://username:password@cluster.mongodb.net/crowe-crypto' \
  --app crowe-crypto
```

#### Redis (for caching and real-time data)
```bash
fly secrets set \
  REDIS_URL='redis://default:password@redis-host:6379' \
  --app crowe-crypto
```

#### Supabase (for user management and data)
```bash
fly secrets set \
  SUPABASE_URL='https://your-project.supabase.co' \
  SUPABASE_ANON_KEY='your-anon-key' \
  SUPABASE_SERVICE_KEY='your-service-key' \
  --app crowe-crypto
```

### 5. Market Data APIs (for better trading insights)

```bash
fly secrets set \
  COINMARKETCAP_API_KEY='your-key' \
  COINGECKO_API_KEY='your-key' \
  CRYPTOCOMPARE_API_KEY='your-key' \
  --app crowe-crypto
```

## How to Get API Keys

### Exchange API Keys

1. **Coinbase Pro/Advanced Trade**:
   - Go to https://pro.coinbase.com/profile/api
   - Create new API key
   - Enable "View" and "Trade" permissions
   - Save the API key, secret, and passphrase

2. **Binance**:
   - Go to https://www.binance.com/en/my/settings/api-management
   - Create API
   - Enable "Enable Reading" and "Enable Spot & Margin Trading"
   - Save the API key and secret

3. **Kraken**:
   - Go to https://www.kraken.com/u/settings/api
   - Generate new key
   - Set permissions for trading
   - Save the API key and private key

### Blockchain RPC Providers

1. **Infura** (recommended):
   - Sign up at https://infura.io
   - Create a new project
   - Copy the Ethereum mainnet endpoint

2. **Alchemy** (alternative):
   - Sign up at https://www.alchemy.com
   - Create an app
   - Copy the HTTP endpoint

### Best Practices

1. **API Key Security**:
   - Use IP whitelisting when available
   - Enable only necessary permissions
   - Rotate keys regularly
   - Never commit keys to git

2. **Trading Bot Wallet**:
   - Create a separate wallet for the bot
   - Only fund with what you're willing to risk
   - Use a multisig wallet for large amounts
   - Consider using a gas-efficient wallet

3. **Rate Limits**:
   - Be aware of exchange rate limits
   - Implement proper retry logic
   - Use websockets for real-time data when possible

## Verify Your Setup

Check current secrets:
```bash
fly secrets list --app crowe-crypto
```

View logs to ensure connections are working:
```bash
fly logs --app crowe-crypto
```

Test the app:
```bash
curl https://crowe-crypto.fly.dev/api/status
```

## Interactive Setup

Run the interactive setup script:
```bash
cd /mnt/c/Users/micha/crypto-trading-platform
./setup-crypto-secrets.sh
```

## Support

- Check logs: `fly logs --app crowe-crypto`
- Restart app: `fly machine restart 6832719cd2ee38 --app crowe-crypto`
- Scale app: `fly scale count 2 --app crowe-crypto`

## Next Steps

1. Add your exchange API credentials
2. Configure wallet connection
3. Set up database (optional)
4. Configure trading strategies in the app
5. Monitor bot performance