#!/bin/bash

echo "================================"
echo "Kraken API Setup for Trading Bot"
echo "================================"
echo ""
echo "Your Kraken Account Details:"
echo "Username: southwestfungi.289038390"
echo "Public ID: AA57 N84G 7E7Z TOJY"
echo "Verification: Intermediate"
echo ""
echo "To set up your Kraken API:"
echo ""
echo "1. Go to: https://www.kraken.com/u/settings/api"
echo "2. Click 'Generate new key'"
echo "3. Set the following permissions:"
echo "   ✅ Query Funds"
echo "   ✅ Query Open Orders & Trades"
echo "   ✅ Query Closed Orders & Trades"
echo "   ✅ Create & Modify Orders"
echo "   ✅ Cancel/Close Orders"
echo "   ❌ Withdraw Funds (keep disabled for security)"
echo ""
echo "4. Enter your 2FA code"
echo "5. Save the API Key and Private Key"
echo ""

read -p "Do you have your Kraken API credentials ready? (y/n): " ready

if [ "$ready" != "y" ]; then
    echo "Please get your API credentials from Kraken first."
    exit 0
fi

echo ""
read -p "Enter your Kraken API Key: " KRAKEN_API_KEY
echo ""
read -s -p "Enter your Kraken Private Key (hidden): " KRAKEN_API_SECRET
echo ""
echo ""

# Set the secrets on Fly.io
export PATH="/root/.fly/bin:$PATH"

echo "Setting Kraken API secrets on Fly.io..."
fly secrets set \
    KRAKEN_API_KEY="$KRAKEN_API_KEY" \
    KRAKEN_API_SECRET="$KRAKEN_API_SECRET" \
    --app crowe-crypto

echo ""
echo "✅ Kraken API configured successfully!"
echo ""
echo "Your bot can now:"
echo "- Monitor real-time prices"
echo "- Execute trades automatically"
echo "- Manage positions with stop-loss/take-profit"
echo "- Track your portfolio performance"
echo ""
echo "To start trading, your app will use:"
echo "- WebSocket for real-time data"
echo "- REST API for account management"
echo "- Automated trading strategies"
echo ""
echo "Next steps:"
echo "1. Fund your Kraken account"
echo "2. Configure trading parameters in the app"
echo "3. Start with small amounts to test"
echo ""