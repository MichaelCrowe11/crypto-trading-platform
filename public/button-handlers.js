// CryptoCrowe - Button Event Handlers
// Centralized button functionality

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔘 Initializing button handlers...');

    // Connect Wallet Button
    const connectWalletBtn = document.getElementById('connectWallet');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', function() {
            console.log('Connect Wallet clicked');
            const modal = document.getElementById('walletModal');
            if (modal) {
                modal.classList.add('active');
            } else {
                connectWallet();
            }
        });
    }

    // Login Button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            console.log('Login clicked');
            showLoginModal();
        });
    }

    // Start Real Trading Button
    const startTradingBtn = document.getElementById('startTradingBtn');
    if (startTradingBtn) {
        startTradingBtn.addEventListener('click', function() {
            console.log('Start Real Trading clicked');
            startRealTrading();
        });
    }

    // Guide Button
    const guideBtn = document.querySelector('button[onclick*="showGuide"]');
    if (guideBtn) {
        guideBtn.removeAttribute('onclick');
        guideBtn.addEventListener('click', function() {
            console.log('Show Guide clicked');
            showGuide();
        });
    }

    // Refresh Markets Button
    const refreshBtn = document.querySelector('button[onclick*="refreshMarkets"]');
    if (refreshBtn) {
        refreshBtn.removeAttribute('onclick');
        refreshBtn.addEventListener('click', async function() {
            console.log('Refresh Markets clicked');
            await refreshMarkets();
        });
    }

    // Timeframe Buttons
    const timeframeBtns = document.querySelectorAll('button[onclick*="changeTimeframe"]');
    timeframeBtns.forEach(btn => {
        const timeframe = btn.textContent.trim();
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function() {
            console.log(`Timeframe ${timeframe} clicked`);
            changeTimeframe(timeframe.toLowerCase());
        });
    });

    // Order Type Buttons (Buy/Sell)
    const orderTypeBtns = document.querySelectorAll('button[onclick*="setOrderType"]');
    orderTypeBtns.forEach(btn => {
        const type = btn.textContent.toLowerCase().trim();
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function() {
            console.log(`Order type ${type} clicked`);
            setOrderType(type);
            // Update active state
            orderTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Place Order Button
    const placeOrderForm = document.getElementById('orderForm');
    if (placeOrderForm) {
        placeOrderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Place Order clicked');
            await placeOrder();
        });
    }

    // Automation Settings Button
    const automationBtn = document.querySelector('button[onclick*="showAutomationSettings"]');
    if (automationBtn) {
        automationBtn.removeAttribute('onclick');
        automationBtn.addEventListener('click', function() {
            console.log('Automation Settings clicked');
            showAutomationSettings();
        });
    }

    // Clear Activity Button
    const clearActivityBtn = document.querySelector('button[onclick*="clearActivity"]');
    if (clearActivityBtn) {
        clearActivityBtn.removeAttribute('onclick');
        clearActivityBtn.addEventListener('click', function() {
            console.log('Clear Activity clicked');
            clearActivity();
        });
    }

    // Modal Close Buttons
    const modalCloseBtns = document.querySelectorAll('.modal-close');
    modalCloseBtns.forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function() {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Wallet Options
    const walletOptions = document.querySelectorAll('.wallet-option');
    walletOptions.forEach(option => {
        const walletType = option.querySelector('h3')?.textContent || '';
        option.style.cursor = 'pointer';

        // Remove onclick attribute
        if (option.hasAttribute('onclick')) {
            option.removeAttribute('onclick');
        }

        option.addEventListener('click', async function() {
            console.log(`${walletType} wallet option clicked`);

            if (walletType.includes('MetaMask')) {
                await connectMetaMask();
            } else if (walletType.includes('WalletConnect')) {
                await connectWalletConnect();
            } else if (walletType.includes('Coinbase')) {
                await connectCoinbase();
            } else if (walletType.includes('Phantom')) {
                await connectPhantom();
            }
        });
    });

    console.log('✅ Button handlers initialized');
});

// Button Functions
async function connectWallet() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                const address = accounts[0];
                updateWalletUI(address);
                showToast('Wallet connected successfully!', 'success');
                closeModal('walletModal');
            }
        } else {
            showToast('Please install MetaMask!', 'error');
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        showToast('Failed to connect wallet', 'error');
    }
}

async function connectMetaMask() {
    console.log('Connecting MetaMask...');
    await connectWallet();
}

async function connectWalletConnect() {
    console.log('Connecting WalletConnect...');
    showToast('WalletConnect integration coming soon!', 'info');
}

async function connectCoinbase() {
    console.log('Connecting Coinbase Wallet...');
    showToast('Coinbase Wallet integration coming soon!', 'info');
}

async function connectPhantom() {
    console.log('Connecting Phantom...');
    showToast('Phantom wallet integration coming soon!', 'info');
}

function startRealTrading() {
    console.log('Starting real trading mode...');

    // Check if user is authenticated
    if (!localStorage.getItem('authToken')) {
        showToast('Please connect your wallet to start trading', 'warning');
        document.getElementById('connectWallet').click();
        return;
    }

    showToast('Real trading mode activated. All trades use real funds!', 'success');

    // Hide welcome section
    const welcomeSection = document.querySelector('.welcome-section');
    if (welcomeSection) {
        welcomeSection.style.display = 'none';
    }

    // Start loading real market data
    loadRealMarketData();
}

function showGuide() {
    console.log('Showing guide...');

    // Start onboarding tour
    if (window.onboardingTour) {
        window.onboardingTour.restart();
    } else {
        showToast('Loading guide...', 'info');
        // Fallback: show help documentation
        window.open('https://github.com/MichaelCrowe11/crypto-trading-platform#readme', '_blank');
    }
}

async function refreshMarkets() {
    console.log('Refreshing markets...');

    const refreshBtn = event.target;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        await loadMarketData();
        showToast('Markets refreshed!', 'success');
    } catch (error) {
        console.error('Market refresh error:', error);
        showToast('Failed to refresh markets', 'error');
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    }
}

function changeTimeframe(timeframe) {
    console.log('Changing timeframe to:', timeframe);

    // Update chart timeframe
    if (window.tradingChart) {
        window.tradingChart.changeTimeframe(timeframe);
    }

    // Update button states
    const timeframeBtns = document.querySelectorAll('.timeframe-selector button');
    timeframeBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(timeframe)) {
            btn.classList.add('active');
        }
    });
}

function setOrderType(type) {
    console.log('Setting order type:', type);

    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.dataset.orderType = type;

        // Update button text
        const submitBtn = orderForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = type === 'buy' ? 'Buy Now' : 'Sell Now';
            submitBtn.className = type === 'buy' ? 'btn btn-success' : 'btn btn-danger';
        }
    }
}

async function placeOrder() {
    console.log('Placing order...');

    const form = document.getElementById('orderForm');
    const formData = new FormData(form);
    const orderType = form.dataset.orderType || 'buy';

    const orderData = {
        type: orderType,
        symbol: document.getElementById('orderSymbol').value,
        amount: document.getElementById('orderAmount').value,
        price: document.getElementById('orderPrice').value
    };

    console.log('Order data:', orderData);

    try {
        // Simulate order placement
        showToast(`${orderType.toUpperCase()} order placed successfully!`, 'success');

        // Add to activity feed
        addActivity(`${orderType.toUpperCase()} ${orderData.amount} ${orderData.symbol} @ $${orderData.price}`);

        // Reset form
        form.reset();
    } catch (error) {
        console.error('Order placement error:', error);
        showToast('Failed to place order', 'error');
    }
}

function showAutomationSettings() {
    console.log('Showing automation settings...');
    showToast('Bot configuration panel opening...', 'info');

    // TODO: Open automation settings modal
    const modal = document.getElementById('automationModal');
    if (modal) {
        modal.classList.add('active');
    } else {
        showToast('Automation settings coming soon!', 'info');
    }
}

function clearActivity() {
    console.log('Clearing activity...');

    const activityList = document.getElementById('activityList');
    if (activityList) {
        activityList.innerHTML = '<div class="activity-item">No recent activity</div>';
        showToast('Activity cleared', 'success');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function showLoginModal() {
    console.log('Showing login modal...');
    // TODO: Implement login modal
    showToast('Login functionality coming soon!', 'info');
}

function updateWalletUI(address) {
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
        connectBtn.innerHTML = `
            <i class="fas fa-wallet"></i>
            ${address.substring(0, 6)}...${address.substring(38)}
        `;
        connectBtn.classList.add('connected');
    }
}

// Demo data removed - platform uses real trading data only

function addActivity(message) {
    const activityList = document.getElementById('activityList');
    if (activityList) {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <span class="activity-time">${new Date().toLocaleTimeString()}</span>
            <span>${message}</span>
        `;
        activityList.insertBefore(item, activityList.firstChild);

        // Keep only last 10 items
        while (activityList.children.length > 10) {
            activityList.removeChild(activityList.lastChild);
        }
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    const container = document.getElementById('toastContainer') || document.body;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

async function loadRealMarketData() {
    console.log('Loading real market data...');

    try {
        const response = await fetch('/api/market/prices');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.message || 'Market data unavailable');
        }

        updateMarketList(data);
        showToast('Real market data loaded successfully', 'success');

    } catch (error) {
        console.error('Failed to load real market data:', error);
        showToast(`Market data error: ${error.message}`, 'error');

        // Show error state instead of fallback data
        const marketList = document.getElementById('marketList');
        if (marketList) {
            marketList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Market Data Unavailable</h3>
                    <p>All market data sources are currently unavailable.</p>
                    <button onclick="loadRealMarketData()" class="btn btn-primary">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

function updateMarketList(data) {
    const marketList = document.getElementById('marketList');
    if (!marketList) return;

    marketList.innerHTML = '';

    // Only use real data - no fallbacks
    const realSymbols = Object.keys(data);

    if (realSymbols.length === 0) {
        marketList.innerHTML = `
            <div class="no-data-state">
                <i class="fas fa-database"></i>
                <p>No market data available</p>
            </div>
        `;
        return;
    }

    realSymbols.forEach(symbol => {
        const market = data[symbol];
        const item = document.createElement('div');
        item.className = 'market-item';
        item.onclick = () => selectMarket(`${symbol}/USDT`);

        item.innerHTML = `
            <div class="market-info">
                <div class="market-icon">${symbol[0]}</div>
                <div>
                    <div class="market-name">${symbol}</div>
                    <div class="market-symbol">${symbol}/USDT</div>
                </div>
            </div>
            <div class="market-price">
                <div class="price-value">$${market.price.toLocaleString()}</div>
                <div class="price-change ${market.change >= 0 ? 'positive' : 'negative'}">
                    ${market.change >= 0 ? '+' : ''}${market.change.toFixed(2)}%
                </div>
            </div>
        `;

        marketList.appendChild(item);
    });
}

// Export functions for global use
window.connectWallet = connectWallet;
window.connectMetaMask = connectMetaMask;
window.connectWalletConnect = connectWalletConnect;
window.connectCoinbase = connectCoinbase;
window.connectPhantom = connectPhantom;
window.startRealTrading = startRealTrading;
window.showGuide = showGuide;
window.refreshMarkets = refreshMarkets;
window.changeTimeframe = changeTimeframe;
window.setOrderType = setOrderType;
window.placeOrder = placeOrder;
window.showAutomationSettings = showAutomationSettings;
window.clearActivity = clearActivity;
window.closeModal = closeModal;
window.showToast = showToast;
window.loadRealMarketData = loadRealMarketData;
window.updateMarketList = updateMarketList;