#!/bin/bash

# Crypto Trading Bot Secrets Setup for Fly.io
# This script helps you configure all necessary API keys and secrets

echo "==================================="
echo "Crowe-Crypto Bot Secrets Setup"
echo "==================================="
echo ""
echo "This script will help you set up all the API keys and secrets needed for automated trading."
echo "You'll need API keys from your exchanges and wallet providers."
echo ""

# Function to set secrets
set_secrets() {
    export PATH="/root/.fly/bin:$PATH"

    echo "Setting up secrets on Fly.io..."

    # Core configuration
    fly secrets set NODE_ENV=production --app crowe-crypto
    fly secrets set PORT=8080 --app crowe-crypto

    # Generate secure keys if not provided
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -hex 32)
        echo "Generated JWT_SECRET"
    fi

    if [ -z "$ENCRYPTION_KEY" ]; then
        ENCRYPTION_KEY=$(openssl rand -hex 32)
        echo "Generated ENCRYPTION_KEY"
    fi

    fly secrets set JWT_SECRET=$JWT_SECRET --app crowe-crypto
    fly secrets set ENCRYPTION_KEY=$ENCRYPTION_KEY --app crowe-crypto
}

# Exchange API Setup
setup_exchanges() {
    echo ""
    echo "=== EXCHANGE API SETUP ==="
    echo ""

    read -p "Do you have Coinbase API credentials? (y/n): " has_coinbase
    if [ "$has_coinbase" = "y" ]; then
        read -p "Enter Coinbase API Key: " COINBASE_API_KEY
        read -s -p "Enter Coinbase API Secret: " COINBASE_API_SECRET
        echo ""
        read -p "Enter Coinbase Passphrase: " COINBASE_PASSPHRASE

        fly secrets set COINBASE_API_KEY=$COINBASE_API_KEY --app crowe-crypto
        fly secrets set COINBASE_API_SECRET=$COINBASE_API_SECRET --app crowe-crypto
        fly secrets set COINBASE_PASSPHRASE=$COINBASE_PASSPHRASE --app crowe-crypto
    fi

    read -p "Do you have Binance API credentials? (y/n): " has_binance
    if [ "$has_binance" = "y" ]; then
        read -p "Enter Binance API Key: " BINANCE_API_KEY
        read -s -p "Enter Binance API Secret: " BINANCE_API_SECRET
        echo ""

        fly secrets set BINANCE_API_KEY=$BINANCE_API_KEY --app crowe-crypto
        fly secrets set BINANCE_API_SECRET=$BINANCE_API_SECRET --app crowe-crypto
    fi

    read -p "Do you have Kraken API credentials? (y/n): " has_kraken
    if [ "$has_kraken" = "y" ]; then
        read -p "Enter Kraken API Key: " KRAKEN_API_KEY
        read -s -p "Enter Kraken API Secret: " KRAKEN_API_SECRET
        echo ""

        fly secrets set KRAKEN_API_KEY=$KRAKEN_API_KEY --app crowe-crypto
        fly secrets set KRAKEN_API_SECRET=$KRAKEN_API_SECRET --app crowe-crypto
    fi
}

# Wallet and Blockchain Setup
setup_wallets() {
    echo ""
    echo "=== WALLET & BLOCKCHAIN SETUP ==="
    echo ""

    read -p "Do you have a WalletConnect Project ID? (y/n): " has_walletconnect
    if [ "$has_walletconnect" = "y" ]; then
        read -p "Enter WalletConnect Project ID: " WALLET_CONNECT_PROJECT_ID
        fly secrets set WALLET_CONNECT_PROJECT_ID=$WALLET_CONNECT_PROJECT_ID --app crowe-crypto
    fi

    read -p "Do you have an Ethereum RPC endpoint (e.g., Infura)? (y/n): " has_eth_rpc
    if [ "$has_eth_rpc" = "y" ]; then
        read -p "Enter Ethereum RPC URL: " ETHEREUM_RPC
        fly secrets set ETHEREUM_RPC=$ETHEREUM_RPC --app crowe-crypto
    fi

    read -p "Do you have a private wallet key for automated trading? (y/n): " has_private_key
    if [ "$has_private_key" = "y" ]; then
        echo "WARNING: Never share your private key. This will be encrypted."
        read -s -p "Enter Private Wallet Key: " WALLET_PRIVATE_KEY
        echo ""
        fly secrets set WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY --app crowe-crypto
    fi
}

# Database Setup
setup_database() {
    echo ""
    echo "=== DATABASE SETUP ==="
    echo ""

    read -p "Do you have a MongoDB connection string? (y/n): " has_mongodb
    if [ "$has_mongodb" = "y" ]; then
        read -p "Enter MongoDB URI: " MONGODB_URI
        fly secrets set MONGODB_URI=$MONGODB_URI --app crowe-crypto
    fi

    read -p "Do you have a Redis connection string? (y/n): " has_redis
    if [ "$has_redis" = "y" ]; then
        read -p "Enter Redis URL: " REDIS_URL
        fly secrets set REDIS_URL=$REDIS_URL --app crowe-crypto
    fi

    read -p "Do you have Supabase credentials? (y/n): " has_supabase
    if [ "$has_supabase" = "y" ]; then
        read -p "Enter Supabase URL: " SUPABASE_URL
        read -p "Enter Supabase Anon Key: " SUPABASE_ANON_KEY
        read -s -p "Enter Supabase Service Key: " SUPABASE_SERVICE_KEY
        echo ""

        fly secrets set SUPABASE_URL=$SUPABASE_URL --app crowe-crypto
        fly secrets set SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY --app crowe-crypto
        fly secrets set SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY --app crowe-crypto
    fi
}

# Market Data APIs
setup_market_data() {
    echo ""
    echo "=== MARKET DATA APIS (Optional) ==="
    echo ""

    read -p "Do you have a CoinMarketCap API key? (y/n): " has_cmc
    if [ "$has_cmc" = "y" ]; then
        read -p "Enter CoinMarketCap API Key: " COINMARKETCAP_API_KEY
        fly secrets set COINMARKETCAP_API_KEY=$COINMARKETCAP_API_KEY --app crowe-crypto
    fi

    read -p "Do you have a CoinGecko API key? (y/n): " has_coingecko
    if [ "$has_coingecko" = "y" ]; then
        read -p "Enter CoinGecko API Key: " COINGECKO_API_KEY
        fly secrets set COINGECKO_API_KEY=$COINGECKO_API_KEY --app crowe-crypto
    fi
}

# Main execution
main() {
    echo "Starting secret configuration..."
    echo ""

    # Check if fly CLI is available
    if ! command -v fly &> /dev/null; then
        export PATH="/root/.fly/bin:$PATH"
    fi

    # Set core secrets
    set_secrets

    # Set up exchanges
    setup_exchanges

    # Set up wallets
    setup_wallets

    # Set up databases
    setup_database

    # Set up market data (optional)
    setup_market_data

    echo ""
    echo "==================================="
    echo "Secret configuration complete!"
    echo "==================================="
    echo ""
    echo "Your app will restart automatically with the new secrets."
    echo "You can verify secrets with: fly secrets list --app crowe-crypto"
    echo ""
    echo "To add more secrets later, use:"
    echo "fly secrets set KEY=value --app crowe-crypto"
}

# Run main function
main