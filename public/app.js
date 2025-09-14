// CryptoCrowe - Main Application JavaScript

// Global state
let currentUser = null;
let socket = null;
let walletAddress = null;
let priceChart = null;
let web3 = null;
let provider = null;

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🦅 CryptoCrowe initializing...');

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 1500);

    // Initialize UI
    initializeUI();

    // Initialize WebSocket (optional)
    // initializeWebSocket();

    // Load market data
    await loadMarketData();

    // Initialize chart
    initializeChart();

    // Check for Web3
    checkWeb3Support();
});

// Check Web3 Support
function checkWeb3Support() {
    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        web3 = new Web3(window.ethereum);

        // Check if already connected
        checkWalletConnection();
    } else {
        console.log('Please install MetaMask!');
    }
}

// Check if wallet is already connected
async function checkWalletConnection() {
    try {
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
            walletAddress = accounts[0];
            updateWalletUI(walletAddress);
            console.log('Wallet already connected:', walletAddress);
        }
    } catch (error) {
        console.error('Error checking wallet connection:', error);
    }
}

// Authentication
async function checkAuth() {
    // Check for authenticated user
    const token = localStorage.getItem('authToken');
    if (token) {
        // Verify token with backend
        try {
            const response = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                currentUser = await response.json();
                updateAuthUI(true);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
}

async function login(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('authToken', data.token);
            updateAuthUI(true);
            showToast('Login successful', 'success');
            closeModal('loginModal');
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('Login service unavailable', 'error');
    }
}

async function signup(email, password) {
    showToast('Signup requires authentication service configuration', 'info');
}

async function logout() {
    localStorage.removeItem('authToken');
    currentUser = null;
    updateAuthUI(false);
    showToast('Logged out successfully', 'info');
}

function updateAuthUI(isAuthenticated) {
    const loginBtn = document.getElementById('loginBtn');
    const connectWalletBtn = document.getElementById('connectWallet');

    if (loginBtn) {
        loginBtn.style.display = isAuthenticated ? 'none' : 'inline-flex';
    }
}

// Wallet Connection
document.getElementById('connectWallet').addEventListener('click', () => {
    if (walletAddress) {
        // If already connected, disconnect
        disconnectWallet();
    } else {
        // Show wallet modal
        document.getElementById('walletModal').classList.add('active');
    }
});

async function connectMetaMask() {
    try {
        if (!window.ethereum) {
            showToast('Please install MetaMask extension!', 'error');
            window.open('https://metamask.io/download/', '_blank');
            return;
        }

        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length > 0) {
            walletAddress = accounts[0];
            web3 = new Web3(window.ethereum);

            // Get network
            const networkId = await web3.eth.getChainId();
            console.log('Connected to network:', networkId);

            updateWalletUI(walletAddress);
            closeModal('walletModal');

            // Save wallet connection (optional)
            await saveWalletConnection('metamask', walletAddress);

            showToast('MetaMask connected successfully', 'success');

            // Listen for account changes
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }
    } catch (error) {
        console.error('MetaMask connection error:', error);
        if (error.code === 4001) {
            showToast('Connection request rejected', 'error');
        } else {
            showToast('Failed to connect MetaMask', 'error');
        }
    }
}

async function connectWalletConnect() {
    try {
        // WalletConnect implementation
        showToast('Setting up WalletConnect...', 'info');

        // For production, implement WalletConnect v2
        // const provider = new WalletConnectProvider({
        //     infuraId: "your-infura-id",
        // });
        // await provider.enable();

        showToast('WalletConnect requires additional setup', 'warning');
    } catch (error) {
        showToast('WalletConnect error: ' + error.message, 'error');
    }
}

async function connectCoinbase() {
    try {
        showToast('Coinbase Wallet connection coming soon', 'info');
        // Implement Coinbase Wallet SDK
    } catch (error) {
        showToast('Coinbase Wallet error: ' + error.message, 'error');
    }
}

async function connectPhantom() {
    try {
        if (window.solana && window.solana.isPhantom) {
            const response = await window.solana.connect();
            const publicKey = response.publicKey.toString();

            walletAddress = publicKey;
            updateWalletUI(publicKey);
            closeModal('walletModal');

            showToast('Phantom wallet connected', 'success');
        } else {
            showToast('Please install Phantom wallet', 'error');
            window.open('https://phantom.app/', '_blank');
        }
    } catch (error) {
        showToast('Phantom connection error: ' + error.message, 'error');
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected wallet
        disconnectWallet();
    } else if (accounts[0] !== walletAddress) {
        // User switched accounts
        walletAddress = accounts[0];
        updateWalletUI(walletAddress);
        showToast('Wallet account changed', 'info');
    }
}

function handleChainChanged(chainId) {
    // Handle chain change
    window.location.reload();
}

function updateWalletUI(address) {
    const walletAddressEl = document.getElementById('walletAddress');
    const connectBtn = document.getElementById('connectWallet');

    if (address) {
        walletAddressEl.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        walletAddressEl.style.display = 'block';
        connectBtn.innerHTML = '<i class="fas fa-unlink"></i> Disconnect';
    } else {
        walletAddressEl.style.display = 'none';
        connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
    }
}

async function disconnectWallet() {
    walletAddress = null;

    // Remove event listeners
    if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
    }

    updateWalletUI(null);
    showToast('Wallet disconnected', 'info');
}

async function saveWalletConnection(type, address) {
    try {
        const response = await fetch('/api/wallet/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress: address,
                walletType: type
            })
        });

        const data = await response.json();
        console.log('Wallet saved:', data);
    } catch (error) {
        console.error('Wallet save error:', error);
    }
}

// WebSocket (optional for real-time updates)
function initializeWebSocket() {
    // Only initialize if Socket.io is available
    if (typeof io !== 'undefined') {
        socket = io();

        socket.on('connect', () => {
            console.log('WebSocket connected');
        });

        socket.on('market-update', (data) => {
            updateMarketData(data);
        });

        socket.on('trade-executed', (trade) => {
            addActivityItem(`Trade executed: ${trade.side} ${trade.amount} ${trade.symbol}`);
            updatePortfolioStats();
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });
    }
}

// Market Data
async function loadMarketData() {
    try {
        const response = await fetch('/api/market/prices');
        const data = await response.json();
        updateMarketList(data);
    } catch (error) {
        console.error('Market data error:', error);
        // Use fallback data
        updateMarketList({});
    }
}

function updateMarketList(data) {
    const marketList = document.getElementById('marketList');
    if (!marketList) return;

    marketList.innerHTML = '';

    // Use real data if available, otherwise use demo data
    const markets = [
        { symbol: 'BTC/USDT', name: 'Bitcoin', price: data.BTC?.price || 45234.56, change: data.BTC?.change || 2.34 },
        { symbol: 'ETH/USDT', name: 'Ethereum', price: data.ETH?.price || 2456.78, change: data.ETH?.change || -1.23 },
        { symbol: 'BNB/USDT', name: 'Binance Coin', price: data.BNB?.price || 345.67, change: data.BNB?.change || 0.89 },
        { symbol: 'SOL/USDT', name: 'Solana', price: data.SOL?.price || 98.76, change: data.SOL?.change || 5.67 },
        { symbol: 'ADA/USDT', name: 'Cardano', price: data.ADA?.price || 0.456, change: data.ADA?.change || -2.34 }
    ];

    markets.forEach(market => {
        const item = document.createElement('div');
        item.className = 'market-item';
        item.onclick = () => selectMarket(market.symbol);

        item.innerHTML = `
            <div class="market-info">
                <div class="market-icon">${market.name[0]}</div>
                <div>
                    <div class="market-name">${market.name}</div>
                    <div class="market-symbol">${market.symbol}</div>
                </div>
            </div>
            <div class="market-price">
                <div class="price-value">$${market.price.toLocaleString()}</div>
                <div class="price-change ${market.change >= 0 ? 'positive' : 'negative'}">
                    ${market.change >= 0 ? '+' : ''}${market.change}%
                </div>
            </div>
        `;

        marketList.appendChild(item);
    });
}

function selectMarket(symbol) {
    const titleElement = document.querySelector('.panel-title');
    if (titleElement) {
        titleElement.textContent = symbol;
    }
    updateChart(symbol);
}

// Chart
function initializeChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;

    priceChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Price',
                data: [],
                borderColor: '#4a9eca',
                backgroundColor: 'rgba(74, 158, 202, 0.1)',
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)'
                    }
                }
            }
        }
    });

    // Generate sample data
    updateChart('BTC/USDT');
}

function updateChart(symbol) {
    if (!priceChart) return;

    const labels = [];
    const data = [];
    const basePrice = 45000 + Math.random() * 5000;

    for (let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
        data.push(basePrice + (Math.random() - 0.5) * 1000);
    }

    priceChart.data.labels = labels;
    priceChart.data.datasets[0].data = data;
    priceChart.update();
}

function changeTimeframe(timeframe) {
    console.log('Changing timeframe to:', timeframe);
    const titleElement = document.querySelector('.panel-title');
    if (titleElement) {
        updateChart(titleElement.textContent);
    }
}

// Trading
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!walletAddress) {
            showToast('Please connect your wallet first', 'warning');
            return;
        }

        const formData = {
            type: document.getElementById('orderTypeSelect').value,
            amount: document.getElementById('orderAmount').value,
            price: document.getElementById('orderPrice').value,
            total: document.getElementById('orderTotal').value
        };

        try {
            // Trade execution requires exchange API
            showToast('Trading requires exchange API configuration', 'info');
            addActivityItem(`Order placed: Buy ${formData.amount} BTC`);
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

const orderTypeSelect = document.getElementById('orderTypeSelect');
if (orderTypeSelect) {
    orderTypeSelect.addEventListener('change', (e) => {
        const priceGroup = document.getElementById('priceGroup');
        if (priceGroup) {
            if (e.target.value === 'limit' || e.target.value === 'stop') {
                priceGroup.style.display = 'block';
            } else {
                priceGroup.style.display = 'none';
            }
        }
    });
}

function setOrderType(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Portfolio
async function updatePortfolioStats() {
    // Update portfolio statistics
    const elements = {
        portfolioValue: document.getElementById('portfolioValue'),
        dailyPnl: document.getElementById('dailyPnl'),
        activeTrades: document.getElementById('activeTrades'),
        winRate: document.getElementById('winRate')
    };

    if (elements.portfolioValue) elements.portfolioValue.textContent = '$10,000.00';
    if (elements.dailyPnl) elements.dailyPnl.textContent = '$250.00';
    if (elements.activeTrades) elements.activeTrades.textContent = '3';
    if (elements.winRate) elements.winRate.textContent = '67%';
}

// Activity Feed
function addActivityItem(message) {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;

    const item = document.createElement('div');
    item.className = 'activity-item';

    const time = new Date().toLocaleTimeString();

    item.innerHTML = `
        <div class="activity-time">${time}</div>
        <div class="activity-message">${message}</div>
    `;

    feed.insertBefore(item, feed.firstChild);

    // Keep only last 20 items
    while (feed.children.length > 20) {
        feed.removeChild(feed.lastChild);
    }
}

function clearActivity() {
    const feed = document.getElementById('activityFeed');
    if (feed) {
        feed.innerHTML = '';
    }
    showToast('Activity cleared', 'info');
}

// Automation
function showAutomationSettings() {
    showToast('Automation settings coming soon', 'info');
}

// Utilities
function initializeUI() {
    // Add initial activity
    addActivityItem('Welcome to Crow-e Crypto');
    addActivityItem('System initialized successfully');

    // Update portfolio stats
    updatePortfolioStats();

    // Add event listeners for modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    }[type];

    toast.innerHTML = `
        <span>${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function refreshMarkets() {
    loadMarketData();
    showToast('Markets refreshed', 'success');
}

function startTrading() {
    if (!walletAddress) {
        showToast('Please connect your wallet first', 'warning');
        return;
    }

    showToast('Trading requires exchange API configuration', 'info');
    addActivityItem('Configure exchange APIs to start trading');
}

function showGuide() {
    window.open('https://github.com/crow-e-crypto/docs', '_blank');
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        connectMetaMask,
        updatePortfolioStats,
        showToast
    };
}