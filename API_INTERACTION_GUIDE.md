# CryptoCrowe Platform - API Interaction Flow Guide

## 🔗 Complete Button-to-API Integration Map

### 1. 🔐 **Connect Wallet Button**
**Location**: Header
**What Happens**:
```javascript
Click → Opens Wallet Modal → Select Provider → Connect
```

#### API Flow:
1. **MetaMask Selected**:
   - Calls `window.ethereum.request({ method: 'eth_requestAccounts' })`
   - Gets wallet address from Web3 provider
   - Stores in local state (no backend API call initially)

2. **After Connection**:
   - POST `/api/wallet/connect` with wallet address
   - Saves wallet to Supabase database
   - Returns wallet ID and verification status

**Your Configured APIs Used**:
- ✅ **WEB3AUTH_CLIENT_ID**: For Web3Auth authentication
- ✅ **SUPABASE_URL/ANON_KEY**: Store wallet data

---

### 2. 📊 **Refresh Markets Button**
**Location**: Markets panel
**What Happens**:
```javascript
Click → Fetch live prices → Update UI
```

#### API Flow:
1. **Frontend** calls `GET /api/market/prices`
2. **Server** uses MarketDataService which:
   - Primary: Uses your **BINANCE_API_KEY** to fetch from Binance
   - Fallback 1: Uses **COINMARKETCAP_API_KEY** for CoinMarketCap
   - Fallback 2: Uses **COINGECKO_API_KEY** for CoinGecko
   - Fallback 3: Returns mock data if all fail

**Your Configured APIs Used**:
- ✅ **BINANCE_API_KEY/SECRET**: Real-time exchange prices
- ✅ **COINMARKETCAP_API_KEY**: Market cap data
- ✅ **COINGECKO_API_KEY**: Additional price feeds

**Response Example**:
```json
{
  "BTC": { "price": 45234.56, "change": 2.34, "volume": 28439238 },
  "ETH": { "price": 2456.78, "change": -1.23, "volume": 12384923 }
}
```

---

### 3. 📈 **Timeframe Buttons** (1m, 5m, 1h, 1D)
**Location**: Chart toolbar
**What Happens**:
```javascript
Click → Change chart timeframe → Fetch OHLCV data
```

#### API Flow:
1. **Frontend** calls `GET /api/market/ohlcv/BTC-USDT?timeframe=1h`
2. **Server** uses ExchangeManager:
   - Connects to Binance/Kraken using your API keys
   - Fetches candlestick data via CCXT library
   - Returns OHLCV (Open, High, Low, Close, Volume) data

**Your Configured APIs Used**:
- ✅ **BINANCE_API_KEY**: Historical price data
- ✅ **KRAKEN_API_KEY**: Alternative exchange data

**WebSocket Stream** (Real-time updates):
- Kraken WebSocket v2 streams live candles
- Updates chart without refresh

---

### 4. 💰 **Buy/Sell Order Buttons**
**Location**: Order form
**What Happens**:
```javascript
Click Buy → Fill form → Submit → Place order on exchange
```

#### API Flow:
1. **Frontend** POST `/api/trade/order`:
```json
{
  "exchange": "binance",
  "symbol": "BTC/USDT",
  "type": "limit",
  "side": "buy",
  "amount": 0.01,
  "price": 45000
}
```

2. **Server** processes:
   - Validates user authentication (JWT token)
   - Uses **TradingEngine** → **ExchangeManager**
   - Calls Binance API with your **BINANCE_API_KEY**
   - Places actual order on exchange
   - Saves to Supabase database

3. **Exchange Response**:
```json
{
  "id": "12345",
  "status": "open",
  "filled": 0,
  "remaining": 0.01,
  "timestamp": 1697654321
}
```

**Your Configured APIs Used**:
- ✅ **BINANCE_API_KEY/SECRET**: Execute trades
- ✅ **COINBASE_API_KEY/SECRET/PASSPHRASE**: Alternative exchange
- ✅ **KRAKEN_API_KEY/SECRET**: Alternative exchange
- ✅ **SUPABASE_URL**: Store trade history

---

### 5. 🤖 **Configure Bot Button**
**Location**: Order form
**What Happens**:
```javascript
Click → Opens bot settings → Configure strategy → Activate
```

#### API Flow:
1. **Frontend** POST `/api/strategy/create`:
```json
{
  "name": "DCA Bot",
  "type": "grid",
  "params": {
    "gridLevels": 10,
    "investment": 1000,
    "stopLoss": 5,
    "takeProfit": 10
  }
}
```

2. **Server** creates strategy:
   - Stores in MongoDB (using **MONGODB_URI**)
   - Initializes StrategyManager
   - Sets up automated trading loops

3. **Bot Execution** (Background):
   - Every tick, checks market conditions
   - Uses your exchange APIs to place orders
   - Uses AI APIs for predictions (optional):
     - **OPENAI_API_KEY**: Market analysis
     - **ANTHROPIC_API_KEY**: Strategy optimization

**Your Configured APIs Used**:
- ✅ **BOT_ENABLED**: Feature flag
- ✅ **MAX_POSITION_SIZE**: Risk limits
- ✅ **STOP_LOSS_PERCENT/TAKE_PROFIT_PERCENT**: Auto exit

---

### 6. 📜 **View Activity/Clear Activity**
**Location**: Activity panel
**What Happens**:
```javascript
View → Fetch trade history
Clear → Reset local display (doesn't delete from DB)
```

#### API Flow:
1. **Frontend** GET `/api/trade/history?limit=10`
2. **Server** queries:
   - Supabase for user's trades
   - Returns last 10 trades with details

**WebSocket Updates** (Real-time):
- Socket.io connection streams new trades
- Auto-updates activity feed

---

### 7. 🚀 **Start Demo Button**
**Location**: Welcome section
**What Happens**:
```javascript
Click → Load mock data → Enable paper trading
```

#### API Flow:
- No real API calls
- Uses local mock data
- Simulates trading without real money
- Good for testing before using real APIs

---

## 🔄 Real-Time Data Flow

### WebSocket Connections:
1. **Price Updates**:
   - Binance WebSocket: `wss://stream.binance.com:9443/ws`
   - Kraken WebSocket: `wss://ws.kraken.com/v2`
   - Updates every 100ms

2. **Order Updates**:
   - Monitors order status changes
   - Notifies when orders fill

3. **Portfolio Updates**:
   - Recalculates on price changes
   - Updates P&L in real-time

---

## 🔑 Your API Keys in Action

### Exchange APIs (Trading):
- **BINANCE_API_KEY/SECRET**: ✅ Main exchange for trading
- **COINBASE_API_KEY/SECRET/PASSPHRASE**: ✅ US-based trading
- **KRAKEN_API_KEY/SECRET**: ✅ European trading

### Market Data APIs:
- **COINMARKETCAP_API_KEY**: ✅ Global crypto rankings
- **COINGECKO_API_KEY**: ✅ Historical data
- **INFURA_PROJECT_ID**: ✅ Ethereum blockchain data

### Infrastructure:
- **SUPABASE_URL/ANON_KEY**: ✅ User data, trades, auth
- **MONGODB_URI**: ✅ Strategy storage, analytics
- **REDIS_URL**: ❌ Not configured (optional cache)

### AI/ML (Optional):
- **OPENAI_API_KEY**: ✅ Trading signals
- **ANTHROPIC_API_KEY**: ✅ Strategy analysis
- **XAI_API_KEY**: ✅ Alternative AI

### Blockchain RPCs:
- **ETHEREUM_RPC**: ✅ ETH transactions
- **POLYGON_RPC**: ✅ Polygon transactions
- **ARBITRUM_RPC**: ✅ L2 transactions
- **BASE_RPC**: ✅ Base chain
- **BSC_RPC**: ✅ Binance Smart Chain
- **OPTIMISM_RPC**: ✅ Optimism L2

---

## 🚨 Current Status

### ✅ Working:
1. Market price fetching (with fallbacks)
2. Chart data display
3. WebSocket connections
4. Button event handlers
5. UI updates

### ⚠️ Needs Authentication:
1. Place real orders (needs login)
2. View portfolio (needs wallet connection)
3. Bot configuration (needs API keys in settings)

### 🔧 To Activate Full Trading:
1. User must login/signup
2. Connect wallet for on-chain trades
3. Add exchange API keys in settings
4. Enable bot in configuration

---

## 📝 Testing Your APIs

### Test Market Data:
```bash
curl https://crowe-crypto.fly.dev/api/market/prices
```

### Test Health Check:
```bash
curl https://crowe-crypto.fly.dev/health
```

### View Logs:
```bash
fly logs
```

---

## 🎯 Next Steps for Full Activation

1. **Add Login System**:
   - Implement Supabase auth UI
   - Create user dashboard

2. **API Key Management**:
   - Build settings page
   - Encrypt and store user API keys

3. **Enable Real Trading**:
   - Remove demo mode flag
   - Activate exchange connections

4. **Monitor Performance**:
   - Check `/metrics` endpoint
   - Watch error rates

Your platform is configured with all necessary APIs but operates in a hybrid mode - showing real market data while protecting users from accidental trades until they explicitly configure their accounts.