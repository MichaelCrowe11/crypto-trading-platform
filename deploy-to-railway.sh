#!/bin/bash

# Railway Deployment Script for CryptoCrowe Trading Platform
# This script automates the deployment process to Railway

set -e

echo "🚀 Starting Railway Deployment for CryptoCrowe Trading Platform"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

echo -e "${GREEN}✓ Railway CLI is installed${NC}"

# Step 1: Login to Railway
echo -e "\n${YELLOW}Step 1: Login to Railway${NC}"
echo "Please login to Railway (this will open a browser):"
railway login

# Step 2: Initialize Railway project
echo -e "\n${YELLOW}Step 2: Initialize Railway Project${NC}"
echo "Choose option to create a new project or link to existing one:"
railway init

# Step 3: Add PostgreSQL database
echo -e "\n${YELLOW}Step 3: Adding PostgreSQL Database${NC}"
railway add

echo -e "${GREEN}✓ PostgreSQL database added${NC}"
echo "Railway will automatically provide DATABASE_URL and DATABASE_PRIVATE_URL"

# Step 4: Add Redis (optional but recommended)
echo -e "\n${YELLOW}Step 4: Adding Redis Cache (Optional)${NC}"
read -p "Do you want to add Redis cache? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    railway add
    echo -e "${GREEN}✓ Redis added${NC}"
fi

# Step 5: Set environment variables
echo -e "\n${YELLOW}Step 5: Setting Environment Variables${NC}"

# Security Keys (using generated values)
railway variables set ENCRYPTION_KEY="feec2d8b0369b3e5cde1f1a0612b22cf71a2168725e1ca6f69dab5b34bdcdf44"
railway variables set JWT_SECRET="3f673b9ef02166e3d611f04940ab782fd0a59ffb855e74fc579377b608dfede59d8768bbd2469a8532184c893011045903fda249f17954c845bcc2c052ce04c2"
railway variables set SESSION_SECRET="eba0d538a4cfad876ecd48abbaac7e04aef68411735835db841a597d3cee4c69"
railway variables set INTERNAL_API_KEY="4sDIygsyU7V266C4Ew85Gc7kB930vCrm"

# Server Configuration
railway variables set NODE_ENV="production"
railway variables set PORT="3000"

echo -e "${GREEN}✓ Security keys configured${NC}"

# Step 6: Configure Exchange APIs
echo -e "\n${YELLOW}Step 6: Configure Exchange APIs${NC}"
echo "You need at least one exchange API to run the platform."
echo "Choose which exchange(s) to configure:"

# Binance
read -p "Configure Binance API? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter Binance API Key: " BINANCE_KEY
    read -p "Enter Binance API Secret: " BINANCE_SECRET
    railway variables set BINANCE_API_KEY="$BINANCE_KEY"
    railway variables set BINANCE_API_SECRET="$BINANCE_SECRET"
    echo -e "${GREEN}✓ Binance API configured${NC}"
fi

# Coinbase
read -p "Configure Coinbase API? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter Coinbase API Key: " COINBASE_KEY
    read -p "Enter Coinbase API Secret: " COINBASE_SECRET
    read -p "Enter Coinbase Passphrase: " COINBASE_PASS
    railway variables set COINBASE_API_KEY="$COINBASE_KEY"
    railway variables set COINBASE_API_SECRET="$COINBASE_SECRET"
    railway variables set COINBASE_PASSPHRASE="$COINBASE_PASS"
    echo -e "${GREEN}✓ Coinbase API configured${NC}"
fi

# Step 7: Configure Market Data API (optional but recommended)
echo -e "\n${YELLOW}Step 7: Configure Market Data API (Optional)${NC}"
read -p "Configure CoinGecko API? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter CoinGecko API Key: " COINGECKO_KEY
    railway variables set COINGECKO_API_KEY="$COINGECKO_KEY"
    echo -e "${GREEN}✓ CoinGecko API configured${NC}"
fi

# Step 8: Deploy the application
echo -e "\n${YELLOW}Step 8: Deploying Application${NC}"
echo "Deploying to Railway..."
railway up

echo -e "${GREEN}✓ Application deployed${NC}"

# Step 9: Initialize database
echo -e "\n${YELLOW}Step 9: Initialize Database${NC}"
echo "Installing dependencies for database migration..."
railway run npm install

echo "Running database migration..."
railway run npm run db:migrate

echo -e "${GREEN}✓ Database initialized${NC}"

# Step 10: Verify deployment
echo -e "\n${YELLOW}Step 10: Verifying Deployment${NC}"
echo "Getting deployment URL..."
railway open

# Get logs
echo -e "\nChecking application logs..."
railway logs --tail

# Final instructions
echo -e "\n${GREEN}=================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=================================================="
echo -e "${NC}"
echo "Your CryptoCrowe Trading Platform is now deployed on Railway!"
echo ""
echo "Next steps:"
echo "1. Access your application at the provided Railway URL"
echo "2. The default admin account is: admin@cryptocrowe.com"
echo "3. IMPORTANT: Change the admin password immediately!"
echo "4. Configure additional settings through the web interface"
echo ""
echo "Useful commands:"
echo "  railway logs          - View application logs"
echo "  railway variables     - List all environment variables"
echo "  railway open          - Open your app in browser"
echo "  railway run [command] - Run commands in production environment"
echo ""
echo "For help, visit: https://docs.railway.app"