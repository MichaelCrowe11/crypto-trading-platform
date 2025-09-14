#!/bin/bash

# Crow-e Crypto Platform - Deployment Script
echo "🦅 Deploying Crow-e Crypto to Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Installing..."
    curl -L https://fly.io/install.sh | sh
    export FLYCTL_INSTALL="/home/$USER/.fly"
    export PATH="$FLYCTL_INSTALL/bin:$PATH"
fi

# Login to Fly.io (if not already logged in)
flyctl auth whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "📝 Please login to Fly.io:"
    flyctl auth login
fi

# Check if app exists
flyctl apps list | grep -q "crowe-crypto"
if [ $? -ne 0 ]; then
    echo "🚀 Creating new Fly.io app..."
    flyctl apps create crowe-crypto --org personal

    # Create PostgreSQL database
    echo "🗄️ Creating PostgreSQL database..."
    flyctl postgres create --name crowe-crypto-db --region iad --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1
    flyctl postgres attach crowe-crypto-db --app crowe-crypto

    # Create Redis instance
    echo "📦 Creating Redis instance..."
    flyctl redis create --name crowe-crypto-redis --region iad --no-replicas
fi

# Set secrets
echo "🔐 Setting environment secrets..."

# Check if .env file exists
if [ -f .env ]; then
    echo "Loading secrets from .env file..."

    # Read .env file and set secrets
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue

        # Remove quotes from value
        value="${value%\"}"
        value="${value#\"}"

        # Set the secret
        flyctl secrets set "$key=$value" --app crowe-crypto
    done < .env
else
    echo "⚠️ No .env file found. Setting default secrets..."

    # Set required secrets (you'll need to update these)
    flyctl secrets set \
        SUPABASE_URL="your-supabase-url" \
        SUPABASE_ANON_KEY="your-supabase-anon-key" \
        SUPABASE_SERVICE_KEY="your-supabase-service-key" \
        JWT_SECRET="$(openssl rand -hex 32)" \
        ENCRYPTION_KEY="$(openssl rand -hex 32)" \
        --app crowe-crypto
fi

# Scale the app
echo "⚡ Configuring app scaling..."
flyctl scale count 2 --app crowe-crypto
flyctl scale vm shared-cpu-1x --memory 512 --app crowe-crypto

# Deploy the application
echo "🚀 Deploying application..."
flyctl deploy --app crowe-crypto

# Check deployment status
echo "✅ Checking deployment status..."
flyctl status --app crowe-crypto

# Get the app URL
APP_URL=$(flyctl info --app crowe-crypto -j | jq -r '.Hostname')
echo ""
echo "🎉 Deployment complete!"
echo "🌐 Your app is live at: https://$APP_URL"
echo ""
echo "📊 Dashboard: https://fly.io/apps/crowe-crypto"
echo "📝 Logs: flyctl logs --app crowe-crypto"
echo "🔍 SSH: flyctl ssh console --app crowe-crypto"
echo ""
echo "🦅 Crow-e Crypto is ready for trading!"