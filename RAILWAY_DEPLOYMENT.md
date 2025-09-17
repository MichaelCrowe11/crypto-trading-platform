# Railway Deployment Guide for CryptoCrowe Trading Platform

This guide provides step-by-step instructions for deploying the CryptoCrowe trading platform on Railway with PostgreSQL database initialization.

## Prerequisites

- Railway account (https://railway.app)
- Railway CLI installed (`npm install -g @railway/cli`)
- GitHub repository connected to Railway
- Node.js 18+ installed locally

## Quick Start

### 1. Fork and Clone Repository

```bash
git clone https://github.com/MichaelCrowe11/crypto-trading-platform.git
cd crypto-trading-platform
```

### 2. Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### 3. Create Railway Project

```bash
# Create new project
railway init

# Or link to existing project
railway link
```

## Database Setup

### Option A: Railway PostgreSQL (Recommended)

1. **Add PostgreSQL to your Railway project:**
   ```bash
   railway add postgresql
   ```

2. **Railway automatically provides:**
   - `DATABASE_URL` - Public database connection string
   - `DATABASE_PRIVATE_URL` - Private network connection string

3. **Initialize the database:**
   ```bash
   # Connect to Railway project
   railway run npm install pg

   # Run migration script
   railway run node scripts/db-migrate.js
   ```

### Option B: External Database (Supabase/Custom PostgreSQL)

1. Set up your PostgreSQL database
2. Add the connection string to Railway variables:
   ```bash
   railway variables set DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   ```

## Environment Variables Configuration

### 1. Generate Security Keys

```bash
# Run the secret generation script
node scripts/generate-secrets.js

# This will output:
# - ENCRYPTION_KEY
# - JWT_SECRET
# - SESSION_SECRET
# - INTERNAL_API_KEY
```

### 2. Set Required Variables

Using Railway CLI:

```bash
# Security (use values from generate-secrets.js)
railway variables set ENCRYPTION_KEY="your-generated-key"
railway variables set JWT_SECRET="your-generated-jwt-secret"
railway variables set SESSION_SECRET="your-generated-session-secret"

# Server Configuration
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="https://your-app.railway.app"

# Redis (add Railway Redis or external)
railway add redis
# or
railway variables set REDIS_URL="redis://your-redis-url"

# At least one exchange API (example: Binance)
railway variables set BINANCE_API_KEY="your-api-key"
railway variables set BINANCE_API_SECRET="your-api-secret"

# Market Data (at least one recommended)
railway variables set COINGECKO_API_KEY="your-api-key"
```

### 3. Complete Variable List

See `.env.railway` for the complete list of available environment variables. Required variables:

- ✅ `ENCRYPTION_KEY` - 32-byte hex string for encryption
- ✅ `JWT_SECRET` - Strong secret for JWT tokens
- ✅ `DATABASE_URL` - Automatically provided by Railway PostgreSQL
- ✅ `REDIS_URL` - Redis connection string
- ✅ At least one exchange API (Coinbase, Binance, or Kraken)

## Deployment

### Method 1: GitHub Integration (Recommended)

1. **Connect GitHub repository:**
   ```bash
   railway github:repo
   ```

2. **Railway will automatically deploy on push to main branch**

3. **Monitor deployment:**
   ```bash
   railway logs
   ```

### Method 2: Manual Deployment

```bash
# Deploy current directory
railway up

# Or deploy specific branch
railway up --branch staging
```

## Post-Deployment Steps

### 1. Initialize Database

```bash
# Run database migration
railway run node scripts/db-migrate.js

# Verify tables were created
railway run psql $DATABASE_URL -c "\\dt"
```

### 2. Verify Deployment

```bash
# Check application logs
railway logs

# Open deployed app
railway open
```

### 3. Health Check

```bash
# Test health endpoint
curl https://your-app.railway.app/health
```

## Adding Services

### Redis Cache

```bash
# Add Redis to project
railway add redis

# Redis URL will be automatically available as REDIS_URL
```

### Custom Domain

```bash
# Add custom domain
railway domain
```

## Database Management

### Run SQL Commands

```bash
# Connect to database
railway run psql $DATABASE_URL

# Run SQL file
railway run psql $DATABASE_URL < database/init-railway.sql
```

### Backup Database

```bash
# Create backup
railway run pg_dump $DATABASE_URL > backup.sql

# Restore backup
railway run psql $DATABASE_URL < backup.sql
```

## Monitoring & Debugging

### View Logs

```bash
# Stream logs
railway logs --tail

# View last 100 lines
railway logs -n 100
```

### Environment Variables

```bash
# List all variables
railway variables

# Set variable
railway variables set KEY=value

# Remove variable
railway variables remove KEY
```

### SSH into Container

```bash
railway shell
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify DATABASE_URL is set correctly
   - Check if PostgreSQL plugin is provisioned
   - Ensure SSL is configured: `?sslmode=require`

2. **Build Failures**
   - Check Node.js version (requires 18+)
   - Verify all dependencies in package.json
   - Check build logs: `railway logs --build`

3. **Environment Variables Missing**
   - List variables: `railway variables`
   - Check for typos in variable names
   - Ensure secrets are properly generated

4. **Port Binding Issues**
   - Railway automatically sets PORT variable
   - Don't hardcode port 3000, use `process.env.PORT`

### Debug Commands

```bash
# Check deployment status
railway status

# View build logs
railway logs --build

# Check environment
railway run env | grep -E "DATABASE|REDIS|NODE"

# Test database connection
railway run node -e "const pg = require('pg'); const client = new pg.Client(process.env.DATABASE_URL); client.connect().then(() => console.log('Connected!')).catch(console.error).finally(() => client.end())"
```

## Production Checklist

- [ ] All required environment variables set
- [ ] Database initialized with schema
- [ ] Redis cache configured
- [ ] Security keys generated and set
- [ ] Exchange API keys configured
- [ ] Health check endpoint responding
- [ ] Logs monitored for errors
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Backup strategy in place

## Security Best Practices

1. **Never commit secrets to repository**
2. **Use Railway's variable management for sensitive data**
3. **Rotate API keys regularly**
4. **Enable 2FA on Railway account**
5. **Monitor logs for unauthorized access attempts**
6. **Keep dependencies updated**
7. **Use DATABASE_PRIVATE_URL for internal connections**

## Support & Resources

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: https://github.com/MichaelCrowe11/crypto-trading-platform/issues
- Railway Status: https://status.railway.app

## Additional Scripts

### Full Reset and Deploy

```bash
#!/bin/bash
# reset-deploy.sh

# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Generate new secrets
node scripts/generate-secrets.js

# Deploy to Railway
railway up

# Initialize database
railway run node scripts/db-migrate.js

# Check deployment
railway logs --tail
```

### Environment Export

```bash
# Export all variables to file
railway variables > railway-vars.txt

# Import variables from file
cat railway-vars.txt | while read line; do
  railway variables set "$line"
done
```

## Next Steps

After successful deployment:

1. Access your app at `https://your-app.railway.app`
2. Create first user account
3. Configure trading strategies
4. Add exchange API keys through the UI
5. Monitor performance metrics
6. Set up alerts and notifications

---

For questions or issues, please open an issue on GitHub or contact support.