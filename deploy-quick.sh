#!/bin/bash

# Quick deployment script for CryptoCrowe platform
echo "🚀 Starting quick deployment to Fly.io..."

# Set Fly CLI path
export FLYCTL_INSTALL="/root/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Navigate to project directory
cd /mnt/c/Users/micha/crypto-trading-platform

# Create a minimal deployment with only essential files
echo "📦 Creating minimal deployment package..."

# Create temp directory for deployment
rm -rf .deploy-temp 2>/dev/null
mkdir -p .deploy-temp

# Copy only essential files
cp -r package*.json server.js Dockerfile fly.toml .deploy-temp/
cp -r public .deploy-temp/
cp -r src .deploy-temp/
cp -r config .deploy-temp/ 2>/dev/null || true

# Deploy from minimal directory
cd .deploy-temp

echo "🔄 Deploying to Fly.io..."
flyctl deploy --strategy rolling --wait-timeout 300

# Clean up
cd ..
rm -rf .deploy-temp

echo "✅ Deployment complete!"
echo "🌐 Visit: https://crowe-crypto.fly.dev"