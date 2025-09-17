#!/bin/bash

# Quick Setup for Crypto Trading Secrets
# Run this with your actual API keys

export PATH="/root/.fly/bin:$PATH"

echo "Setting up essential crypto trading secrets..."

# Core Security (auto-generated if not provided)
fly secrets set \
  NODE_ENV=production \
  PORT=8080 \
  JWT_SECRET=$(openssl rand -hex 32) \
  ENCRYPTION_KEY=$(openssl rand -hex 32) \
  --app crowe-crypto

echo ""
echo "Core secrets set. Now add your exchange API keys:"
echo ""
echo "For Coinbase:"
echo "fly secrets set COINBASE_API_KEY='your-key' COINBASE_API_SECRET='your-secret' COINBASE_PASSPHRASE='your-passphrase' --app crowe-crypto"
echo ""
echo "For Binance:"
echo "fly secrets set BINANCE_API_KEY='your-key' BINANCE_API_SECRET='your-secret' --app crowe-crypto"
echo ""
echo "For Kraken:"
echo "fly secrets set KRAKEN_API_KEY='your-key' KRAKEN_API_SECRET='your-secret' --app crowe-crypto"
echo ""
echo "For Wallet Connection:"
echo "fly secrets set WALLET_CONNECT_PROJECT_ID='your-project-id' --app crowe-crypto"
echo ""
echo "For Ethereum/Web3 (needed for DeFi trading):"
echo "fly secrets set ETHEREUM_RPC='your-infura-or-alchemy-url' WALLET_PRIVATE_KEY='your-private-key' --app crowe-crypto"
echo ""
echo "Current secrets:"
fly secrets list --app crowe-crypto