// Crow-e Crypto - Main Application JavaScript

// Initialize Supabase
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global state
let currentUser = null;
let socket = null;
let walletAddress = null;
let priceChart = null;

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🦅 Crow-e Crypto initializing...');

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 1500);

    // Check authentication
    await checkAuth();

    // Initialize UI
    initializeUI();

    // Initialize WebSocket
    initializeWebSocket();

    // Load market data
    await loadMarketData();

    // Initialize chart
    initializeChart();
});

// Authentication
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
        updateAuthUI(true);
    }
}

async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        currentUser = data.user;
        updateAuthUI(true);
        showToast('Login successful', 'success');
        closeModal('loginModal');

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function signup(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        showToast('Signup successful! Check your email to confirm.', 'success');
        closeModal('signupModal');

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    updateAuthUI(false);
    showToast('Logged out successfully', 'info');
}

function updateAuthUI(isAuthenticated) {
    const loginBtn = document.getElementById('loginBtn');
    const connectWalletBtn = document.getElementById('connectWallet');

    if (isAuthenticated) {
        loginBtn.style.display = 'none';
        connectWalletBtn.style.display = 'inline-flex';
    } else {
        loginBtn.style.display = 'inline-flex';
    }
}

// Wallet Connection
document.getElementById('connectWallet').addEventListener('click', () => {
    document.getElementById('walletModal').classList.add('active');
});

async function connectMetaMask() {
    try {
        if (!window.ethereum) {
            throw new Error('MetaMask is not installed');
        }

        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        walletAddress = accounts[0];
        updateWalletUI(walletAddress);
        closeModal('walletModal');

        // Save wallet to backend
        await saveWalletConnection('metamask', walletAddress);

        showToast('MetaMask connected successfully', 'success');

    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function connectWalletConnect() {
    showToast('WalletConnect integration coming soon', 'info');
}

async function connectCoinbase() {
    showToast('Coinbase Wallet integration coming soon', 'info');
}

async function connectPhantom() {
    showToast('Phantom Wallet integration coming soon', 'info');
}

function updateWalletUI(address) {
    const walletAddressEl = document.getElementById('walletAddress');
    const connectBtn = document.getElementById('connectWallet');

    if (address) {
        walletAddressEl.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        walletAddressEl.style.display = 'block';
        connectBtn.textContent = 'Disconnect';
        connectBtn.onclick = disconnectWallet;
    } else {
        walletAddressEl.style.display = 'none';
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.onclick = () => document.getElementById('walletModal').classList.add('active');
    }
}

async function disconnectWallet() {
    walletAddress = null;
    updateWalletUI(null);
    showToast('Wallet disconnected', 'info');
}

async function saveWalletConnection(type, address) {
    try {
        const response = await fetch('/api/wallet/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser?.access_token}`
            },
            body: JSON.stringify({
                walletAddress: address,
                walletType: type
            })
        });

        if (!response.ok) throw new Error('Failed to save wallet');

    } catch (error) {
        console.error('Wallet save error:', error);
    }
}

// WebSocket
function initializeWebSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('WebSocket connected');
        if (currentUser) {
            socket.emit('authenticate', currentUser.access_token);
        }
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

// Market Data
async function loadMarketData() {
    try {
        const response = await fetch('/api/market/prices?symbols=BTC,ETH,BNB,SOL,ADA');
        const data = await response.json();

        updateMarketList(data);

    } catch (error) {
        console.error('Market data error:', error);
    }
}

function updateMarketList(data) {
    const marketList = document.getElementById('marketList');
    marketList.innerHTML = '';

    const markets = [
        { symbol: 'BTC/USDT', name: 'Bitcoin', price: 45234.56, change: 2.34 },
        { symbol: 'ETH/USDT', name: 'Ethereum', price: 2456.78, change: -1.23 },
        { symbol: 'BNB/USDT', name: 'Binance Coin', price: 345.67, change: 0.89 },
        { symbol: 'SOL/USDT', name: 'Solana', price: 98.76, change: 5.67 },
        { symbol: 'ADA/USDT', name: 'Cardano', price: 0.456, change: -2.34 }
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
    document.querySelector('.panel-title').textContent = symbol;
    updateChart(symbol);
}

// Chart
function initializeChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Price',
                data: [],
                borderColor: '#7c3aed',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
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
    updateChart(document.querySelector('.panel-title').textContent);
}

// Trading
document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        showToast('Please login to trade', 'warning');
        return;
    }

    const formData = {
        type: document.getElementById('orderTypeSelect').value,
        amount: document.getElementById('orderAmount').value,
        price: document.getElementById('orderPrice').value,
        total: document.getElementById('orderTotal').value
    };

    try {
        const response = await fetch('/api/trade/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser?.access_token}`
            },
            body: JSON.stringify({
                exchange: 'binance',
                symbol: 'BTC/USDT',
                side: 'buy',
                amount: formData.amount,
                type: formData.type
            })
        });

        if (!response.ok) throw new Error('Trade failed');

        const result = await response.json();
        showToast('Trade executed successfully', 'success');
        addActivityItem(`Order placed: Buy ${formData.amount} BTC`);

    } catch (error) {
        showToast(error.message, 'error');
    }
});

document.getElementById('orderTypeSelect').addEventListener('change', (e) => {
    const priceGroup = document.getElementById('priceGroup');
    if (e.target.value === 'limit' || e.target.value === 'stop') {
        priceGroup.style.display = 'block';
    } else {
        priceGroup.style.display = 'none';
    }
});

function setOrderType(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Portfolio
async function updatePortfolioStats() {
    // Update portfolio statistics
    document.getElementById('portfolioValue').textContent = '$10,000.00';
    document.getElementById('dailyPnl').textContent = '$250.00';
    document.getElementById('activeTrades').textContent = '3';
    document.getElementById('winRate').textContent = '67%';
}

// Activity Feed
function addActivityItem(message) {
    const feed = document.getElementById('activityFeed');
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
    document.getElementById('activityFeed').innerHTML = '';
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
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
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
    document.getElementById(modalId).classList.remove('active');
}

function refreshMarkets() {
    loadMarketData();
    showToast('Markets refreshed', 'success');
}

function startDemo() {
    if (!currentUser) {
        showToast('Please login to start trading', 'warning');
        return;
    }

    showToast('Demo mode activated', 'success');
    addActivityItem('Demo trading started with $10,000 virtual balance');
}

function showGuide() {
    window.open('https://docs.crowe-crypto.com', '_blank');
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        connectMetaMask,
        updatePortfolioStats,
        showToast
    };
}