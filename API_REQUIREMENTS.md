# 🦅 Crow-e Crypto - Complete API Requirements & Setup Guide

## 📋 Platform Status Check

### ✅ **Currently Working Features**
- ✅ Platform deployed and accessible at https://crowe-crypto.fly.dev
- ✅ Geometric crow logo and branding
- ✅ Market data display (demo data)
- ✅ Wallet connection UI (MetaMask, WalletConnect, Coinbase, Phantom)
- ✅ Trading interface
- ✅ Portfolio dashboard
- ✅ Real-time charts
- ✅ Activity feed

### ⚠️ **Features Requiring API Keys**
- ❌ Live market data
- ❌ Actual wallet connections (requires Web3 provider)
- ❌ Exchange trading
- ❌ User authentication
- ❌ Database storage

---

## 🔑 **Required API Keys Shopping List**

### **1. Essential APIs (Free Tier Available)**

#### **Supabase (Database & Auth) - FREE**
- **Purpose**: User authentication, data storage
- **Sign up**: https://supabase.com
- **Required Keys**:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_KEY`
- **Setup Time**: 5 minutes

#### **Infura (Web3 Provider) - FREE**
- **Purpose**: Ethereum/Polygon blockchain connection
- **Sign up**: https://infura.io
- **Required Keys**:
  - `INFURA_PROJECT_ID`
- **Free Tier**: 100,000 requests/day
- **Setup Time**: 5 minutes

#### **WalletConnect Cloud - FREE**
- **Purpose**: Mobile wallet connections
- **Sign up**: https://cloud.walletconnect.com
- **Required Keys**:
  - `WALLET_CONNECT_PROJECT_ID`
- **Setup Time**: 5 minutes

---

### **2. Market Data APIs (Choose One)**

#### **Option A: CoinGecko - FREE**
- **Sign up**: https://www.coingecko.com/api/pricing
- **Free Tier**: 10,000 calls/month
- **No API key required for basic tier**

#### **Option B: CoinMarketCap - FREE**
- **Sign up**: https://pro.coinmarketcap.com/signup
- **Required Keys**:
  - `COINMARKETCAP_API_KEY`
- **Free Tier**: 10,000 calls/month

#### **Option C: CryptoCompare - FREE**
- **Sign up**: https://min-api.cryptocompare.com
- **Required Keys**:
  - `CRYPTOCOMPARE_API_KEY`
- **Free Tier**: 100,000 calls/month

---

### **3. Exchange APIs (Optional - For Live Trading)**

#### **Coinbase Pro**
- **Sign up**: https://pro.coinbase.com/profile/api
- **Required Keys**:
  - `COINBASE_API_KEY`
  - `COINBASE_API_SECRET`
  - `COINBASE_PASSPHRASE`
- **Note**: Requires identity verification

#### **Binance**
- **Sign up**: https://www.binance.com/en/my/settings/api-management
- **Required Keys**:
  - `BINANCE_API_KEY`
  - `BINANCE_API_SECRET`
- **Note**: Requires identity verification

#### **Kraken**
- **Sign up**: https://www.kraken.com/u/settings/api
- **Required Keys**:
  - `KRAKEN_API_KEY`
  - `KRAKEN_API_SECRET`

---

## 🚀 **Quick Setup Guide**

### **Step 1: Get Free APIs (10 minutes)**

1. **Supabase Setup**:
   ```bash
   # 1. Go to https://supabase.com
   # 2. Create new project
   # 3. Go to Settings > API
   # 4. Copy your keys
   ```

2. **Infura Setup**:
   ```bash
   # 1. Go to https://infura.io
   # 2. Sign up for free account
   # 3. Create new project
   # 4. Copy Project ID
   ```

3. **CoinGecko** (No signup needed for basic):
   ```bash
   # Just use the public API
   # No key required for 10 calls/minute
   ```

### **Step 2: Add to Fly.io (5 minutes)**

```bash
# Navigate to your project
cd crypto-trading-platform

# Set the secrets
~/.fly/bin/flyctl secrets set \
  SUPABASE_URL="https://xxxxx.supabase.co" \
  SUPABASE_ANON_KEY="eyJhbGc..." \
  SUPABASE_SERVICE_KEY="eyJhbGc..." \
  INFURA_PROJECT_ID="your-infura-id" \
  WALLET_CONNECT_PROJECT_ID="your-wc-id" \
  --app crowe-crypto
```

### **Step 3: Restart App**

```bash
# Restart to apply new secrets
~/.fly/bin/flyctl apps restart crowe-crypto
```

---

## 🔧 **Current Platform Architecture**

```
Frontend (Working)
├── Wallet Connection UI ✅
├── Market Display ✅
├── Trading Interface ✅
└── Portfolio Dashboard ✅

Backend (Partially Working)
├── Express Server ✅
├── API Routes ✅
├── Mock Data ✅
└── Real APIs ❌ (needs keys)

Features Ready to Activate
├── MetaMask Connection (needs Infura)
├── Live Prices (needs CoinGecko/CMC)
├── User Auth (needs Supabase)
└── Trading (needs Exchange APIs)
```

---

## 📊 **Testing Without APIs**

The platform currently works in **Demo Mode**:

1. **Visit**: https://crowe-crypto.fly.dev
2. **Features Available**:
   - View interface and design
   - Click through all screens
   - See demo market data
   - Test UI/UX flow

3. **To Test Wallet Connection**:
   - Install MetaMask extension
   - Click "Connect Wallet"
   - Select MetaMask
   - (Will show error without Infura key)

---

## 🎯 **Minimum APIs for Basic Functionality**

For a working demo with real data, you only need:

1. **CoinGecko** (FREE, no key needed)
2. **Infura** (FREE with signup) - for wallet connections

Total setup time: **10 minutes**

---

## 🛠️ **Troubleshooting**

### **Issue: "Cannot connect wallet"**
- **Solution**: Add Infura Project ID

### **Issue: "No market data"**
- **Solution**: Add CoinGecko or CoinMarketCap API

### **Issue: "Login not working"**
- **Solution**: Add Supabase credentials

### **Issue: "Trading not working"**
- **Solution**: Add exchange API keys (requires KYC)

---

## 📝 **Environment Variables Template**

Create `.env.production` with:

```env
# Required for Wallet Connections
INFURA_PROJECT_ID=your-infura-project-id
WALLET_CONNECT_PROJECT_ID=your-walletconnect-id

# Required for User Auth (Optional)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Market Data (Choose One)
COINMARKETCAP_API_KEY=your-cmc-key
# OR
COINGECKO_API_KEY=your-coingecko-key

# Exchange APIs (Optional - for live trading)
COINBASE_API_KEY=your-key
COINBASE_API_SECRET=your-secret
COINBASE_PASSPHRASE=your-passphrase

BINANCE_API_KEY=your-key
BINANCE_API_SECRET=your-secret
```

---

## ✅ **Platform Health Check**

Run this to verify your setup:

```bash
# Check app status
~/.fly/bin/flyctl status --app crowe-crypto

# Check logs
~/.fly/bin/flyctl logs --app crowe-crypto

# Check secrets (hidden)
~/.fly/bin/flyctl secrets list --app crowe-crypto

# Test health endpoint
curl https://crowe-crypto.fly.dev/health
```

---

## 🎉 **Next Steps**

1. **Get free API keys** (10 min)
2. **Add to Fly.io secrets** (5 min)
3. **Test wallet connection** (2 min)
4. **Enable live market data** (instant)

Your platform is **ready to go live** with just these API keys!