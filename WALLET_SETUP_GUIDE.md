# 🦅 Crow-e Crypto - Wallet Connection Fix Guide

## ⚡ QUICK ANSWER: What's Needed for Each Wallet

### 🦊 **MetaMask** - NO API KEY NEEDED! ✅
- **Status**: Should work immediately if you have MetaMask installed
- **Required**: MetaMask browser extension
- **API Keys**: NONE
- **Setup Time**: 0 minutes

### 🔗 **WalletConnect** - NEEDS API KEY ❌
- **Required API**: WalletConnect Project ID
- **Get it here**: https://cloud.walletconnect.com/sign-in
- **Setup Time**: 5 minutes

### 💰 **Coinbase Wallet** - NEEDS SETUP ❌
- **Required**: Coinbase Wallet SDK configuration
- **API Keys**: Optional (works with default config)
- **Setup Time**: 2 minutes

### 👻 **Phantom** - NO API KEY NEEDED! ✅
- **Status**: Should work if you have Phantom installed
- **Required**: Phantom browser extension (for Solana)
- **API Keys**: NONE
- **Setup Time**: 0 minutes

---

## 🚨 IMMEDIATE FIX: Get MetaMask Working NOW

### Step 1: Install MetaMask
1. Go to: https://metamask.io/download/
2. Click "Install MetaMask for Chrome/Firefox/Brave"
3. Create or import a wallet

### Step 2: Test Connection
1. Visit: https://crowe-crypto.fly.dev
2. Click "Connect Wallet"
3. Click MetaMask option
4. Approve connection in MetaMask popup

**If MetaMask doesn't work, there's a bug in the code. Let me fix it...**

---

## 🔧 For WalletConnect (5 minutes)

### Step 1: Get Free WalletConnect Project ID
1. Go to: https://cloud.walletconnect.com
2. Sign up for free account
3. Create new project
4. Copy Project ID

### Step 2: Add to Fly.io
```bash
~/.fly/bin/flyctl secrets set \
  WALLET_CONNECT_PROJECT_ID="your-project-id-here" \
  --app crowe-crypto
```

---

## 🛠️ For Coinbase Wallet (2 minutes)

The SDK should work with default settings, but for production:

1. Go to: https://www.coinbase.com/wallet/api
2. Get your App Name registered
3. Add to configuration

---

## 📱 For Phantom Wallet (Solana)

1. Install Phantom: https://phantom.app/
2. It should work immediately for Solana connections

---

## 🚨 TROUBLESHOOTING

### If MetaMask button does nothing:
- Check browser console (F12) for errors
- Make sure MetaMask is unlocked
- Try refreshing the page

### Common Console Errors:
- `"window.ethereum is undefined"` = MetaMask not installed
- `"User rejected request"` = You declined the connection
- `"Web3 is not defined"` = Web3 library not loading

---

## 🎯 What Should Work RIGHT NOW Without Any APIs:

✅ **MetaMask** - Just needs the extension installed
✅ **Phantom** - Just needs the extension installed

❌ **WalletConnect** - Needs Project ID
❌ **Coinbase Wallet** - Needs configuration