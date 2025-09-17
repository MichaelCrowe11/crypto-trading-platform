# 🚀 Deploy to Railway - Quick Start Guide

Your crypto trading platform is ready for deployment! Follow these steps:

## ✅ Pre-Deployment Checklist

- [x] Railway CLI installed
- [x] Security keys generated
- [x] Database schema prepared
- [x] Deployment scripts created
- [x] Dependencies installed

## 🔑 Generated Security Keys

Your security keys have been generated and are ready to use:

```bash
ENCRYPTION_KEY: feec2d8b0369b3e5cde1f1a0612b22cf71a2168725e1ca6f69dab5b34bdcdf44
JWT_SECRET: 3f673b9ef02166e3d611f04940ab782fd0a59ffb855e74fc579377b608dfede59d8768bbd2469a8532184c893011045903fda249f17954c845bcc2c052ce04c2
SESSION_SECRET: eba0d538a4cfad876ecd48abbaac7e04aef68411735835db841a597d3cee4c69
INTERNAL_API_KEY: 4sDIygsyU7V266C4Ew85Gc7kB930vCrm
```

## 📋 Deploy in 3 Steps

### Option A: Automated Deployment (Recommended)

Run the automated deployment script:

```bash
./deploy-to-railway.sh
```

This script will:
1. Login to Railway
2. Create a new project
3. Add PostgreSQL database
4. Set all environment variables
5. Deploy the application
6. Initialize the database

### Option B: Manual Deployment

#### Step 1: Login and Create Project

```bash
# Login to Railway
railway login

# Create new project
railway init
```

#### Step 2: Add Database and Set Variables

```bash
# Add PostgreSQL
railway add
# Select "PostgreSQL" from the list

# Set security keys
railway variables set ENCRYPTION_KEY="feec2d8b0369b3e5cde1f1a0612b22cf71a2168725e1ca6f69dab5b34bdcdf44"
railway variables set JWT_SECRET="3f673b9ef02166e3d611f04940ab782fd0a59ffb855e74fc579377b608dfede59d8768bbd2469a8532184c893011045903fda249f17954c845bcc2c052ce04c2"
railway variables set SESSION_SECRET="eba0d538a4cfad876ecd48abbaac7e04aef68411735835db841a597d3cee4c69"

# Set at least one exchange API (example with test keys)
railway variables set BINANCE_API_KEY="your-binance-api-key"
railway variables set BINANCE_API_SECRET="your-binance-api-secret"
```

#### Step 3: Deploy and Initialize

```bash
# Deploy the application
railway up

# Initialize database
railway run npm run db:migrate

# View logs
railway logs --tail
```

## 🔗 Quick Links

After deployment, access your app:

```bash
# Open in browser
railway open

# View deployment status
railway status

# Check logs
railway logs
```

## ⚠️ Important First Steps

1. **Access your app** at the Railway-provided URL
2. **Login** with default admin credentials:
   - Email: `admin@cryptocrowe.com`
   - Password: `ChangeMeImmediately123!`
3. **CHANGE THE ADMIN PASSWORD IMMEDIATELY**

## 🛠️ Troubleshooting

If deployment fails:

```bash
# Check build logs
railway logs --build

# Verify environment variables
railway variables

# Test database connection
railway run node -e "console.log('DB URL:', process.env.DATABASE_URL ? 'Set' : 'Missing')"
```

## 📝 Required Exchange APIs

You need at least one exchange API to run the platform. Get your API keys from:

- **Binance**: https://www.binance.com/en/my/settings/api-management
- **Coinbase**: https://www.coinbase.com/settings/api
- **Kraken**: https://www.kraken.com/u/security/api

## 🎯 Next Steps

1. Configure your exchange API keys
2. Set up trading strategies
3. Configure notification webhooks
4. Monitor the dashboard

## 📞 Need Help?

- Railway Discord: https://discord.gg/railway
- Project Issues: https://github.com/MichaelCrowe11/crypto-trading-platform/issues
- Railway Docs: https://docs.railway.app

---

**Your platform is ready to deploy!** Run `./deploy-to-railway.sh` to start the deployment process.