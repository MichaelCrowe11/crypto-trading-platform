# 🦅 Crow-e Crypto - Production Deployment Guide

## Prerequisites

1. **Fly.io Account**
   - Sign up at [fly.io](https://fly.io)
   - Install flyctl: `curl -L https://fly.io/install.sh | sh`

2. **Supabase Account**
   - Create account at [supabase.com](https://supabase.com)
   - Create a new project
   - Get your API keys from Settings > API

3. **Exchange API Keys**
   - Coinbase Pro: [pro.coinbase.com/profile/api](https://pro.coinbase.com/profile/api)
   - Binance: [binance.com/en/my/settings/api-management](https://binance.com/en/my/settings/api-management)
   - CoinMarketCap: [pro.coinmarketcap.com/account](https://pro.coinmarketcap.com/account)

## Quick Deploy

```bash
# 1. Clone and setup
cd crypto-trading-platform
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Deploy to Fly.io
chmod +x deploy.sh
./deploy.sh
```

## Manual Deployment Steps

### 1. Setup Supabase Database

Create these tables in Supabase SQL editor:

```sql
-- Users profile table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User wallets
CREATE TABLE user_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  wallet_type TEXT,
  chain_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Exchange API keys (encrypted)
CREATE TABLE exchange_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL,
  encrypted_keys JSONB,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, exchange)
);

-- Trading configurations
CREATE TABLE trading_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trades history
CREATE TABLE trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange TEXT,
  symbol TEXT,
  side TEXT,
  type TEXT,
  price DECIMAL,
  amount DECIMAL,
  total DECIMAL,
  fee DECIMAL,
  status TEXT,
  order_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio snapshots
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_value DECIMAL,
  positions JSONB,
  metrics JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own wallets" ON user_wallets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own exchange keys" ON exchange_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own configs" ON trading_configs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trades" ON trades
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own portfolio" ON portfolios
  FOR ALL USING (auth.uid() = user_id);
```

### 2. Configure Environment Variables

Create `.env` file with your credentials:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-32-byte-hex-key

# Exchange APIs
COINBASE_API_KEY=your-key
COINBASE_API_SECRET=your-secret
COINBASE_PASSPHRASE=your-passphrase

BINANCE_API_KEY=your-key
BINANCE_API_SECRET=your-secret

# Market Data
COINMARKETCAP_API_KEY=your-key
COINGECKO_API_KEY=your-key

# Blockchain RPCs
ETHEREUM_RPC=https://mainnet.infura.io/v3/your-key
POLYGON_RPC=https://polygon-rpc.com
BSC_RPC=https://bsc-dataseed.binance.org

# Wallet Connect
WALLET_CONNECT_PROJECT_ID=your-project-id
```

### 3. Deploy to Fly.io

```bash
# Login to Fly.io
flyctl auth login

# Create app
flyctl apps create crowe-crypto

# Create PostgreSQL (optional, if not using Supabase)
flyctl postgres create --name crowe-crypto-db

# Create Redis
flyctl redis create --name crowe-crypto-redis

# Set secrets from .env
flyctl secrets import < .env

# Deploy
flyctl deploy

# Scale
flyctl scale count 2
flyctl scale vm shared-cpu-1x --memory 512
```

### 4. Post-Deployment Setup

1. **DNS Configuration**
   ```bash
   # Add custom domain
   flyctl certs add yourdomain.com
   ```

2. **Monitor Application**
   ```bash
   # View logs
   flyctl logs

   # Check status
   flyctl status

   # SSH into container
   flyctl ssh console
   ```

3. **Setup Monitoring**
   - Add Sentry for error tracking
   - Configure Datadog or New Relic for APM
   - Setup alerts for critical errors

## Security Checklist

- [ ] All API keys stored as secrets
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Authentication required for all trading endpoints
- [ ] API keys encrypted in database
- [ ] Regular security audits scheduled

## Testing Production

1. **Test Wallet Connection**
   - Connect MetaMask
   - Connect WalletConnect
   - Verify balance display

2. **Test Trading Features**
   - Place test order (small amount)
   - Check order history
   - Verify portfolio updates

3. **Test Automation**
   - Configure bot settings
   - Run for 1 hour with minimal funds
   - Monitor logs for errors

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   flyctl secrets set DATABASE_URL="your-connection-string"
   ```

2. **WebSocket Issues**
   ```bash
   # Check WebSocket configuration
   flyctl config show
   ```

3. **Memory Issues**
   ```bash
   # Scale up memory
   flyctl scale memory 1024
   ```

## Maintenance

### Daily Tasks
- Check error logs
- Monitor trading performance
- Review security alerts

### Weekly Tasks
- Update dependencies
- Backup database
- Review trading strategies

### Monthly Tasks
- Security audit
- Performance optimization
- Cost analysis

## Support

- Documentation: [crowe-crypto.fly.dev/docs](https://crowe-crypto.fly.dev/docs)
- Issues: [github.com/crowe-crypto/issues](https://github.com/crowe-crypto/issues)
- Discord: [discord.gg/crowe-crypto](https://discord.gg/crowe-crypto)

## License

Copyright © 2024 Crow-e Crypto. All rights reserved.