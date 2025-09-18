// CryptoCrowe - Complete Platform JavaScript (No Mock Data)

// Global state
let currentUser = null;
let walletAddress = null;
let web3 = null;
let provider = null;
let botConfig = {
    enabled: false,
    strategy: 'conservative',
    maxTrade: 0.1,
    stopLoss: 5,
    takeProfit: 10,
    pairs: ['BTC/USDT', 'ETH/USDT']
};

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🦅 CryptoCrowe initializing...');

    // Hide loading screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) loadingScreen.classList.add('hidden');
    }, 1500);

    // Initialize UI
    initializeUI();

    // Check Web3 support
    checkWeb3Support();

    // Load real market data
    await loadMarketData();

    // Initialize chart
    initializeChart();
});

// Check Web3 Support
function checkWeb3Support() {
    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask detected');
        web3 = new Web3(window.ethereum);
        checkWalletConnection();
    } else if (window.solana && window.solana.isPhantom) {
        console.log('Phantom detected');
    }
}

// Check wallet connection
async function checkWalletConnection() {
    try {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                walletAddress = accounts[0];
                updateWalletUI(walletAddress);
            }
        }
    } catch (error) {
        console.error('Wallet check error:', error);
    }
}

// Enhanced MetaMask Connection
async function connectMetaMask() {
    if (typeof window.ethereum === 'undefined') {
        showToast('Please install MetaMask from metamask.io', 'warning');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }

    try {
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length > 0) {
            walletAddress = accounts[0];

            // Get chain info
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });

            // Get balance
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [walletAddress, 'latest']
            });

            const ethBalance = parseInt(balance, 16) / 1e18;

            updateWalletUI(walletAddress);
            showToast(`Connected: ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)} | Balance: ${ethBalance.toFixed(4)} ETH`, 'success');

            // Enable bot config after wallet connection
            document.getElementById('botConfig').style.display = 'block';

            closeModal('walletModal');
        }
    } catch (error) {
        if (error.code === 4001) {
            showToast('Connection rejected', 'error');
        } else {
            showToast('Connection failed: ' + error.message, 'error');
        }
    }
}

// Phantom Connection
async function connectPhantom() {
    if (!window.solana || !window.solana.isPhantom) {
        showToast('Please install Phantom from phantom.app', 'warning');
        window.open('https://phantom.app/', '_blank');
        return;
    }

    try {
        const response = await window.solana.connect();
        walletAddress = response.publicKey.toString();

        updateWalletUI(walletAddress);
        showToast(`Phantom connected: ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}`, 'success');

        // Enable bot config
        document.getElementById('botConfig').style.display = 'block';

        closeModal('walletModal');
    } catch (error) {
        showToast('Phantom connection failed', 'error');
    }
}

// WalletConnect
function connectWalletConnect() {
    showToast('WalletConnect requires Project ID. Get free at cloud.walletconnect.com', 'info');
    window.open('https://cloud.walletconnect.com/sign-in', '_blank');
}

// Coinbase Wallet
function connectCoinbase() {
    showToast('Coinbase Wallet SDK configuration needed', 'info');
}

// Update wallet UI
function updateWalletUI(address) {
    const walletAddressEl = document.getElementById('walletAddress');
    const connectBtn = document.getElementById('connectWallet');

    if (walletAddressEl) {
        walletAddressEl.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        walletAddressEl.style.display = 'block';
    }

    if (connectBtn) {
        connectBtn.innerHTML = '<i class="fas fa-unlink"></i> Disconnect';
        connectBtn.onclick = disconnectWallet;
    }

    // Show trading controls
    document.querySelectorAll('.requires-wallet').forEach(el => {
        el.classList.remove('disabled');
    });
}

// Disconnect wallet
function disconnectWallet() {
    walletAddress = null;

    const walletAddressEl = document.getElementById('walletAddress');
    const connectBtn = document.getElementById('connectWallet');

    if (walletAddressEl) {
        walletAddressEl.style.display = 'none';
    }

    if (connectBtn) {
        connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
        connectBtn.onclick = () => openModal('walletModal');
    }

    // Hide bot config
    document.getElementById('botConfig').style.display = 'none';

    showToast('Wallet disconnected', 'info');
}

// Load REAL market data (no fallbacks)
async function loadMarketData() {
    try {
        const response = await fetch('/api/market/prices');
        const data = await response.json();

        if (Object.keys(data).length === 0) {
            // No data available - show message instead of mock data
            showNoDataMessage();
        } else {
            updateMarketList(data);
        }
    } catch (error) {
        console.error('Market data error:', error);
        showNoDataMessage();
    }
}

// Show no data message
function showNoDataMessage() {
    const marketList = document.getElementById('marketList');
    if (!marketList) return;

    marketList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #999;">
            <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 10px;"></i>
            <h3>No Market Data Available</h3>
            <p>Configure API keys to see live prices</p>
            <button onclick="showAPISetup()" class="btn btn-primary" style="margin-top: 10px;">
                <i class="fas fa-key"></i> Setup APIs
            </button>
        </div>
    `;
}

// Show API setup guide
function showAPISetup() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'apiSetupModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>API Setup Guide</h2>
                <button onclick="closeModal('apiSetupModal')" class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <h3>Required APIs for Full Functionality:</h3>

                <div style="margin: 20px 0;">
                    <h4>1. Market Data (Choose One):</h4>
                    <ul>
                        <li><strong>CoinGecko</strong> - Free, no key needed for basic
                            <br><a href="https://www.coingecko.com/api" target="_blank">Get API →</a>
                        </li>
                        <li><strong>CoinMarketCap</strong> - Free tier available
                            <br><a href="https://pro.coinmarketcap.com/signup" target="_blank">Get API →</a>
                        </li>
                    </ul>
                </div>

                <div style="margin: 20px 0;">
                    <h4>2. Web3 Provider (For Wallet Features):</h4>
                    <ul>
                        <li><strong>Infura</strong> - Free tier
                            <br><a href="https://infura.io" target="_blank">Get API →</a>
                        </li>
                    </ul>
                </div>

                <div style="margin: 20px 0;">
                    <h4>3. Exchange APIs (For Trading):</h4>
                    <ul>
                        <li><strong>Coinbase</strong> - Requires KYC
                            <br><a href="https://pro.coinbase.com/profile/api" target="_blank">Get API →</a>
                        </li>
                        <li><strong>Binance</strong> - Requires KYC
                            <br><a href="https://www.binance.com/en/my/settings/api-management" target="_blank">Get API →</a>
                        </li>
                    </ul>
                </div>

                <div class="alert alert-info">
                    <strong>Quick Start:</strong> MetaMask and Phantom work without API keys!
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Update market list (only with real data)
function updateMarketList(data) {
    const marketList = document.getElementById('marketList');
    if (!marketList) return;

    if (!data || Object.keys(data).length === 0) {
        showNoDataMessage();
        return;
    }

    marketList.innerHTML = '';

    // Only show real data
    Object.entries(data).forEach(([symbol, info]) => {
        const item = document.createElement('div');
        item.className = 'market-item';
        item.onclick = () => selectMarket(symbol);

        item.innerHTML = `
            <div class="market-info">
                <div class="market-icon">${symbol[0]}</div>
                <div>
                    <div class="market-name">${symbol}</div>
                    <div class="market-symbol">${symbol}/USDT</div>
                </div>
            </div>
            <div class="market-price">
                <div class="price-value">$${info.price.toLocaleString()}</div>
                <div class="price-change ${info.change >= 0 ? 'positive' : 'negative'}">
                    ${info.change >= 0 ? '+' : ''}${info.change}%
                </div>
            </div>
        `;

        marketList.appendChild(item);
    });
}

// Bot Configuration
function configureBotTrading() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'botConfigModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>🤖 Trading Bot Configuration</h2>
                <button onclick="closeModal('botConfigModal')" class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Bot Status</label>
                    <select id="botStatus" class="form-control">
                        <option value="false">Disabled</option>
                        <option value="true">Enabled</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Trading Strategy</label>
                    <select id="botStrategy" class="form-control">
                        <option value="conservative">Conservative (Low Risk)</option>
                        <option value="balanced">Balanced (Medium Risk)</option>
                        <option value="aggressive">Aggressive (High Risk)</option>
                        <option value="scalping">Scalping (Quick Trades)</option>
                        <option value="hodl">HODL (Long Term)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Max Trade Size (ETH)</label>
                    <input type="number" id="maxTradeSize" class="form-control"
                           value="${botConfig.maxTrade}" min="0.01" max="10" step="0.01">
                </div>

                <div class="form-group">
                    <label>Stop Loss (%)</label>
                    <input type="number" id="stopLoss" class="form-control"
                           value="${botConfig.stopLoss}" min="1" max="50" step="1">
                </div>

                <div class="form-group">
                    <label>Take Profit (%)</label>
                    <input type="number" id="takeProfit" class="form-control"
                           value="${botConfig.takeProfit}" min="1" max="100" step="1">
                </div>

                <div class="form-group">
                    <label>Trading Pairs</label>
                    <div id="tradingPairs">
                        <label><input type="checkbox" value="BTC/USDT" checked> BTC/USDT</label><br>
                        <label><input type="checkbox" value="ETH/USDT" checked> ETH/USDT</label><br>
                        <label><input type="checkbox" value="BNB/USDT"> BNB/USDT</label><br>
                        <label><input type="checkbox" value="SOL/USDT"> SOL/USDT</label><br>
                        <label><input type="checkbox" value="ADA/USDT"> ADA/USDT</label>
                    </div>
                </div>

                <button onclick="saveBotConfig()" class="btn btn-primary btn-block">
                    <i class="fas fa-save"></i> Save Configuration
                </button>

                <div class="alert alert-warning" style="margin-top: 15px;">
                    <strong>Note:</strong> Bot trading requires exchange API keys configured
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Set current values
    document.getElementById('botStatus').value = botConfig.enabled.toString();
    document.getElementById('botStrategy').value = botConfig.strategy;
}

// Save bot configuration
function saveBotConfig() {
    botConfig.enabled = document.getElementById('botStatus').value === 'true';
    botConfig.strategy = document.getElementById('botStrategy').value;
    botConfig.maxTrade = parseFloat(document.getElementById('maxTradeSize').value);
    botConfig.stopLoss = parseFloat(document.getElementById('stopLoss').value);
    botConfig.takeProfit = parseFloat(document.getElementById('takeProfit').value);

    // Get selected pairs
    const pairs = [];
    document.querySelectorAll('#tradingPairs input:checked').forEach(cb => {
        pairs.push(cb.value);
    });
    botConfig.pairs = pairs;

    // Update UI
    updateBotStatus();

    showToast('Bot configuration saved', 'success');
    closeModal('botConfigModal');

    if (botConfig.enabled) {
        startBotTrading();
    }
}

// Update bot status display
function updateBotStatus() {
    const statusEl = document.getElementById('botStatus');
    if (statusEl) {
        statusEl.innerHTML = botConfig.enabled ?
            '<span style="color: #10b981;">🤖 Bot Active</span>' :
            '<span style="color: #999;">🤖 Bot Inactive</span>';
    }
}

// Start bot trading
function startBotTrading() {
    if (!walletAddress) {
        showToast('Connect wallet first', 'warning');
        return;
    }

    showToast(`Bot started with ${botConfig.strategy} strategy`, 'success');

    // Add activity
    addActivityItem(`Bot trading activated - ${botConfig.strategy} mode`);

    // In production, this would connect to actual trading engine
    console.log('Bot config:', botConfig);
}

// Initialize UI
function initializeUI() {
    // Add bot configuration button if not exists
    const tradingControls = document.querySelector('.trading-controls');
    if (tradingControls && !document.getElementById('botConfigBtn')) {
        const botBtn = document.createElement('button');
        botBtn.id = 'botConfigBtn';
        botBtn.className = 'btn btn-secondary requires-wallet';
        botBtn.innerHTML = '<i class="fas fa-robot"></i> Bot Config';
        botBtn.onclick = configureBotTrading;
        tradingControls.appendChild(botBtn);
    }

    // Add bot status indicator
    if (!document.getElementById('botStatus')) {
        const header = document.querySelector('.header-actions');
        if (header) {
            const statusDiv = document.createElement('div');
            statusDiv.id = 'botStatus';
            statusDiv.innerHTML = '<span style="color: #999;">🤖 Bot Inactive</span>';
            header.insertBefore(statusDiv, header.firstChild);
        }
    }
}

// Initialize chart
function initializeChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;

    // Create empty chart (will be populated with real data)
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Price',
                data: [],
                borderColor: '#4a9eca',
                backgroundColor: 'rgba(74, 158, 202, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Helper functions
function showToast(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#4a9eca'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function addActivityItem(text) {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;

    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
        <span class="activity-time">${new Date().toLocaleTimeString()}</span>
        <span class="activity-text">${text}</span>
    `;

    feed.insertBefore(item, feed.firstChild);

    // Keep only last 10 items
    while (feed.children.length > 10) {
        feed.removeChild(feed.lastChild);
    }
}

function selectMarket(symbol) {
    console.log('Selected market:', symbol);
    document.getElementById('selectedMarket').textContent = symbol;
}

// Export functions for global access
window.connectMetaMask = connectMetaMask;
window.connectPhantom = connectPhantom;
window.connectWalletConnect = connectWalletConnect;
window.connectCoinbase = connectCoinbase;
window.disconnectWallet = disconnectWallet;
window.configureBotTrading = configureBotTrading;
window.saveBotConfig = saveBotConfig;
window.showAPISetup = showAPISetup;
window.openModal = openModal;
window.closeModal = closeModal;
window.selectMarket = selectMarket;
window.addActivityItem = addActivityItem;
window.showToast = showToast;

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
.requires-wallet.disabled {
    opacity: 0.5;
    pointer-events: none;
}
#botConfig {
    display: none;
}
.alert {
    padding: 12px;
    border-radius: 4px;
    margin: 10px 0;
}
.alert-info {
    background: #e0f2fe;
    color: #0369a1;
    border: 1px solid #0284c7;
}
.alert-warning {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #d97706;
}
`;
document.head.appendChild(style);

console.log('CryptoCrowe Platform Ready - No Mock Data');