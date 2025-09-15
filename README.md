# CryptoCrowe - Autonomous Trading Platform

A comprehensive cryptocurrency trading platform with automated trading strategies, portfolio management, and multi-exchange support.

## 🚀 Features

### Core Trading
- **Multi-Exchange Support**: Binance, Coinbase Pro, Kraken, FTX, KuCoin
- **Order Management**: Market, Limit, Stop orders with advanced risk management
- **Real-time Market Data**: Live price feeds, technical indicators, market sentiment
- **Portfolio Tracking**: Real-time portfolio analytics and performance metrics

### Automated Trading
- **Strategy Templates**: DCA, SMA Grid, Mean Reversion, Momentum, Arbitrage
- **Risk Management**: Position sizing, stop-loss, take-profit automation
- **Backtesting**: Historical strategy performance analysis
- **Real-time Execution**: Automated strategy execution with monitoring

### Advanced Features
- **Multi-Wallet Support**: MetaMask, WalletConnect, Coinbase Wallet
- **Technical Analysis**: 20+ indicators including RSI, MACD, Bollinger Bands
- **Notifications**: Telegram, Discord, Slack, Email alerts
- **Security**: API key encryption, rate limiting, JWT authentication

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL) + Redis for caching
- **Real-time**: Socket.io for WebSocket connections
- **Trading**: CCXT library for exchange integrations
- **Blockchain**: Ethers.js for wallet interactions

### Infrastructure
- **Authentication**: Supabase Auth
- **Deployment**: Fly.io ready with Docker
- **Monitoring**: Winston logging with error tracking
- **Scheduling**: Node-cron for automated tasks

## 📋 Prerequisites

- Node.js 18+
- Redis server
- Supabase account
- Exchange API keys (optional)

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone and install dependencies
git clone <repository>
cd crypto-trading-platform
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your credentials:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
MONGODB_URI=mongodb://localhost:27017/crypto-trading
REDIS_URL=redis://localhost:6379

# Security
ENCRYPTION_KEY=your_32_byte_hex_encryption_key
JWT_SECRET=your_jwt_secret

# RPC Endpoints
ETHEREUM_RPC=https://mainnet.infura.io/v3/your_infura_key
POLYGON_RPC=https://polygon-rpc.com
BSC_RPC=https://bsc-dataseed.binance.org

# Optional: Market Data APIs
COINGECKO_API_KEY=your_api_key
COINMARKETCAP_API_KEY=your_api_key
```

### 3. Database Setup

Execute the SQL schema in your Supabase SQL editor:

```sql
-- Copy contents from database/schema.sql
```

### 4. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

## 🔧 Configuration

### Exchange API Keys

Users can connect their exchange accounts through the web interface:

1. Navigate to Settings → Exchange Connections
2. Add API credentials for supported exchanges
3. Keys are encrypted and stored securely

### Trading Strategies

Create automated trading strategies:

```javascript
// Example DCA Strategy
{
  "name": "Bitcoin DCA",
  "type": "dca",
  "parameters": {
    "symbol": "BTC/USDT",
    "amount": 100,
    "interval": "daily",
    "exchange": "binance"
  }
}
```

### Risk Management

Configure risk parameters:

```javascript
{
  "maxPositionSize": 10000,
  "defaultStopLoss": 5,
  "defaultTakeProfit": 10,
  "maxOpenPositions": 10
}
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Trading
- `POST /api/trade/order` - Place order
- `DELETE /api/trade/order/:exchange/:orderId` - Cancel order
- `GET /api/trade/orders/:exchange` - Get open orders
- `GET /api/trade/history` - Get trade history

### Market Data
- `GET /api/market/ticker/:symbol` - Get ticker data
- `GET /api/market/ohlcv/:symbol` - Get OHLCV data
- `GET /api/market/aggregated/:symbol` - Get aggregated market data

### Portfolio
- `GET /api/portfolio` - Get portfolio overview
- `GET /api/portfolio/performance` - Get performance metrics

### Strategies
- `POST /api/strategy/create` - Create strategy
- `POST /api/strategy/:id/activate` - Activate strategy
- `POST /api/strategy/:id/deactivate` - Deactivate strategy
- `GET /api/strategy/list` - List user strategies

## 🔌 WebSocket Events

### Client to Server
```javascript
// Subscribe to ticker updates
socket.emit('subscribe:ticker', { symbol: 'BTC/USDT', exchange: 'binance' });

// Subscribe to order updates
socket.emit('subscribe:orders');

// Subscribe to portfolio updates
socket.emit('subscribe:portfolio');
```

### Server to Client
```javascript
// Ticker updates
socket.on('ticker:update', (data) => { /* handle ticker */ });

// Order updates
socket.on('order:update', (data) => { /* handle order */ });

// Portfolio updates
socket.on('portfolio:update', (data) => { /* handle portfolio */ });
```

## 🛡️ Security Features

### API Key Encryption
- AES-256-GCM encryption for API keys
- Keys never stored in plaintext
- Individual encryption for each user

### Rate Limiting
- Configurable rate limits per endpoint
- IP-based and user-based limiting
- Prevents API abuse

### Authentication
- JWT-based authentication
- Supabase integration for user management
- Row-level security policies

## 📈 Trading Strategies

### Dollar Cost Averaging (DCA)
- Regular interval purchases
- Configurable amounts and timing
- Reduces market timing risk

### SMA Grid Trading
- Moving average crossover signals
- Grid-based position management
- Trend-following strategy

### Mean Reversion
- RSI and Bollinger Band signals
- Buy oversold, sell overbought
- Counter-trend strategy

### Momentum Trading
- MACD-based signals
- Trend continuation strategy
- Stop-loss and take-profit automation

### Arbitrage
- Cross-exchange price differences
- Automated execution
- Risk-free profit opportunities

## 🔔 Notifications

### Supported Channels
- **Email**: SendGrid integration
- **Telegram**: Bot-based notifications
- **Discord**: Webhook notifications
- **Slack**: Webhook notifications

### Notification Types
- Trade executions
- Strategy alerts
- Portfolio updates
- Price alerts
- Daily reports

## 📊 Performance Metrics

### Portfolio Analytics
- Total return and percentage
- Sharpe ratio calculation
- Maximum drawdown tracking
- Risk-adjusted returns

### Strategy Performance
- Win rate analysis
- Profit factor calculation
- Trade statistics
- Backtest results

## 🚢 Deployment

### Fly.io Deployment

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy application
fly launch
fly deploy
```

### Docker Deployment

```bash
# Build image
docker build -t crypto-trading-platform .

# Run container
docker run -p 8080:8080 --env-file .env crypto-trading-platform
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://your-domain.com
```

## 🔧 Development

### Project Structure
```
├── src/
│   ├── exchanges/           # Exchange integrations
│   ├── services/           # Core business logic
│   ├── wallet/             # Wallet management
│   └── utils/              # Utility functions
├── public/                 # Frontend assets
├── database/               # Database schemas
└── tests/                  # Test suites
```

### Adding New Exchanges

1. Implement exchange class extending base
2. Add to ExchangeManager supported exchanges
3. Update environment variables
4. Test integration

### Creating Custom Strategies

1. Add strategy template to StrategyManager
2. Implement execution logic
3. Add parameter validation
4. Test with backtesting

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "Trading Engine"

# Run with coverage
npm run test:coverage
```

## 📝 Logging

### Log Levels
- **Error**: System errors and exceptions
- **Warn**: Warning conditions
- **Info**: Informational messages
- **Debug**: Debug information

### Log Files
- `error.log`: Error-level logs only
- `trading.log`: All trading-related logs
- Console output with colors (development)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This software is for educational and research purposes only. Cryptocurrency trading involves substantial risk of loss. The authors are not responsible for any financial losses incurred through the use of this software.

## 📞 Support

- 📧 Email: support@cryptocrowe.com
- 💬 Discord: [Join Community](https://discord.gg/cryptocrowe)
- 📚 Documentation: [docs.cryptocrowe.com](https://docs.cryptocrowe.com)
- 🐛 Issues: [GitHub Issues](https://github.com/cryptocrowe/issues)

---

**CryptoCrowe** - Autonomous Trading Platform 🦅