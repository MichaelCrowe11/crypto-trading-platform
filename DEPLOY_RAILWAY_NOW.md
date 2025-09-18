# 🚀 Deploy to Railway in 2 Minutes

## Best CLI Deployment Method

### Option 1: Direct Local Deployment (Fastest - No GitHub Required)

Run this single command:
```bash
./railway-deploy-cli.sh
```

The script will:
1. Ask for Railway API token (get it from https://railway.app/account/tokens)
2. Create a new project
3. Add PostgreSQL + Redis
4. Set all environment variables
5. Deploy your local code directly
6. Initialize the database

### Option 2: Manual CLI Deployment

```bash
# 1. Get your Railway token from: https://railway.app/account/tokens
export RAILWAY_TOKEN="your-token-here"

# 2. Create new project
railway init

# 3. Add database
railway add --database postgres

# 4. Set security keys
railway variables set \
  ENCRYPTION_KEY="feec2d8b0369b3e5cde1f1a0612b22cf71a2168725e1ca6f69dab5b34bdcdf44" \
  JWT_SECRET="3f673b9ef02166e3d611f04940ab782fd0a59ffb855e74fc579377b608dfede59d8768bbd2469a8532184c893011045903fda249f17954c845bcc2c052ce04c2" \
  SESSION_SECRET="eba0d538a4cfad876ecd48abbaac7e04aef68411735835db841a597d3cee4c69" \
  BINANCE_API_KEY="demo_key" \
  BINANCE_API_SECRET="demo_secret"

# 5. Deploy
railway up --detach

# 6. Initialize database
railway run npm run db:migrate

# 7. Open app
railway open
```

### Option 3: GitHub Connected Deployment

If you want automatic deploys from GitHub:

```bash
# 1. First push to GitHub (create token at https://github.com/settings/tokens/new)
git push https://MichaelCrowe11:YOUR_TOKEN@github.com/MichaelCrowe11/crypto-trading-platform.git main

# 2. Login to Railway
railway login

# 3. Create project from GitHub
railway init --github

# 4. Railway will auto-deploy from GitHub
```

## 📋 Quick Checklist

- [ ] Railway CLI installed (`railway --version`)
- [ ] Railway token ready (https://railway.app/account/tokens)
- [ ] Run `./railway-deploy-cli.sh`
- [ ] Choose option 1 (API Token)
- [ ] Choose option 1 (TEST/DEMO keys for quick start)

## 🔑 Get Railway API Token

1. Go to: **https://railway.app/account/tokens**
2. Click **"Create Token"**
3. Copy the token
4. Use it in the deployment script

## ⚡ Fastest Deployment Command

```bash
export RAILWAY_TOKEN="your-token" && ./railway-deploy-cli.sh
```

## 📊 After Deployment

- **App URL**: Shown after deployment
- **Logs**: `railway logs`
- **Status**: `railway status`
- **Variables**: `railway variables`

## 🔐 Default Login

- Email: `admin@cryptocrowe.com`
- Password: `ChangeMeImmediately123!`

**IMPORTANT**: Change password after first login!

---

**Ready?** Run: `./railway-deploy-cli.sh`