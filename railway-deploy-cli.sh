#!/bin/bash

# Railway CLI Deployment Script
# Deploys directly from local code without GitHub

set -e

echo "🚀 Railway CLI Direct Deployment"
echo "================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Railway CLI not found!${NC}"
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo -e "${GREEN}✓ Railway CLI v$(railway --version)${NC}"

# Option 1: Use Railway API Token (Non-interactive)
use_token_auth() {
    echo -e "\n${YELLOW}Using Railway API Token Authentication${NC}"
    echo "To get your Railway API token:"
    echo "1. Go to: https://railway.app/account/tokens"
    echo "2. Click 'Create Token'"
    echo "3. Copy the token"
    echo ""
    read -p "Enter your Railway API Token: " -s RAILWAY_TOKEN
    echo ""
    export RAILWAY_TOKEN
    echo -e "${GREEN}✓ Token set${NC}"
}

# Option 2: Browser login (Interactive)
use_browser_auth() {
    echo -e "\n${YELLOW}Opening browser for Railway login...${NC}"
    railway login
}

# Choose authentication method
echo "Choose authentication method:"
echo "1) API Token (Recommended for CLI)"
echo "2) Browser Login"
read -p "Enter choice (1-2): " auth_choice

case $auth_choice in
    1)
        use_token_auth
        ;;
    2)
        use_browser_auth
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Create new project or link existing
echo -e "\n${YELLOW}Railway Project Setup${NC}"
echo "Choose an option:"
echo "1) Create NEW Railway project"
echo "2) Link to EXISTING Railway project"
read -p "Enter choice (1-2): " project_choice

case $project_choice in
    1)
        echo "Creating new Railway project..."
        read -p "Enter project name (or press Enter for auto-generated): " project_name
        if [ -z "$project_name" ]; then
            railway init
        else
            railway init --name "$project_name"
        fi
        PROJECT_ID=$(railway status --json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✓ Project created: $PROJECT_ID${NC}"
        ;;
    2)
        echo "Available projects:"
        railway projects
        read -p "Enter project ID to link: " PROJECT_ID
        railway link $PROJECT_ID
        echo -e "${GREEN}✓ Linked to project: $PROJECT_ID${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Add services
echo -e "\n${YELLOW}Adding Required Services${NC}"

# Add PostgreSQL
echo "Adding PostgreSQL database..."
railway add --database postgres || {
    echo "PostgreSQL might already exist or needs to be added manually"
}

# Add Redis
read -p "Add Redis cache? (recommended) (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Adding Redis..."
    railway add --database redis || {
        echo "Redis might already exist or needs to be added manually"
    }
fi

# Set environment variables
echo -e "\n${YELLOW}Setting Environment Variables${NC}"

# Set generated security keys
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
railway variables set ENCRYPTION_KEY="feec2d8b0369b3e5cde1f1a0612b22cf71a2168725e1ca6f69dab5b34bdcdf44"
railway variables set JWT_SECRET="3f673b9ef02166e3d611f04940ab782fd0a59ffb855e74fc579377b608dfede59d8768bbd2469a8532184c893011045903fda249f17954c845bcc2c052ce04c2"
railway variables set SESSION_SECRET="eba0d538a4cfad876ecd48abbaac7e04aef68411735835db841a597d3cee4c69"
railway variables set INTERNAL_API_KEY="4sDIygsyU7V266C4Ew85Gc7kB930vCrm"

echo -e "${GREEN}✓ Security keys configured${NC}"

# Configure exchange APIs
echo -e "\n${YELLOW}Configure Exchange APIs (at least one required)${NC}"

# Quick option for testing
echo "Choose configuration:"
echo "1) Use TEST/DEMO keys (for testing only)"
echo "2) Enter REAL exchange API keys"
read -p "Enter choice (1-2): " api_choice

case $api_choice in
    1)
        echo "Setting demo keys (trading will be simulated)..."
        railway variables set BINANCE_API_KEY="demo_api_key_for_testing"
        railway variables set BINANCE_API_SECRET="demo_api_secret_for_testing"
        railway variables set ENABLE_PAPER_TRADING="true"
        railway variables set ENABLE_TRADING="false"
        echo -e "${GREEN}✓ Demo mode configured${NC}"
        ;;
    2)
        echo "Enter your exchange API credentials:"
        read -p "Binance API Key (or press Enter to skip): " binance_key
        if [ ! -z "$binance_key" ]; then
            read -p "Binance API Secret: " -s binance_secret
            echo
            railway variables set BINANCE_API_KEY="$binance_key"
            railway variables set BINANCE_API_SECRET="$binance_secret"
            railway variables set ENABLE_TRADING="true"
            echo -e "${GREEN}✓ Binance configured${NC}"
        fi
        ;;
esac

# Deploy the application
echo -e "\n${YELLOW}Deploying Application${NC}"
echo "Deploying your code to Railway..."

# Create a .railwayignore if needed
cat > .railwayignore << EOF
node_modules
.git
.env
*.log
.DS_Store
EOF

# Deploy
railway up --detach

echo -e "${GREEN}✓ Deployment started${NC}"

# Wait for deployment
echo "Waiting for deployment to complete..."
sleep 10

# Get deployment URL
echo -e "\n${YELLOW}Getting deployment information...${NC}"
DEPLOYMENT_URL=$(railway status --json 2>/dev/null | grep -o '"domain":"[^"]*' | cut -d'"' -f4 | head -1) || true

if [ ! -z "$DEPLOYMENT_URL" ]; then
    echo -e "${GREEN}✓ App deployed at: https://$DEPLOYMENT_URL${NC}"
    railway variables set FRONTEND_URL="https://$DEPLOYMENT_URL"
else
    echo "Getting deployment URL..."
    railway domain
fi

# Initialize database
echo -e "\n${YELLOW}Initialize Database${NC}"
read -p "Initialize database now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Installing dependencies..."
    railway run npm install

    echo "Running database migration..."
    railway run npm run db:migrate || {
        echo -e "${YELLOW}Note: Database might already be initialized${NC}"
    }
    echo -e "${GREEN}✓ Database initialized${NC}"
fi

# View logs
echo -e "\n${YELLOW}Checking deployment status...${NC}"
railway logs --tail || true

# Summary
echo -e "\n${GREEN}================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "================================${NC}"
echo ""
echo "Your CryptoCrowe Trading Platform is deployed!"
echo ""
echo "Useful commands:"
echo "  railway logs          - View application logs"
echo "  railway variables     - List environment variables"
echo "  railway open          - Open app in browser"
echo "  railway status        - Check deployment status"
echo "  railway down          - Stop the deployment"
echo ""

# Open in browser
read -p "Open app in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    railway open
fi

echo ""
echo "Default admin credentials:"
echo "  Email: admin@cryptocrowe.com"
echo "  Password: ChangeMeImmediately123!"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Change the admin password after first login!${NC}"