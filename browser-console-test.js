// PASTE THIS IN YOUR BROWSER CONSOLE AT https://crowe-crypto.fly.dev
// This will force-update the display with REAL data

console.log('🔴 FORCING LIVE DATA UPDATE...');

// Override the portfolio display with REAL data
async function forceLiveUpdate() {
    try {
        // Fetch real balance
        const balanceRes = await fetch('/api/live/balance');
        const balanceData = await balanceRes.json();

        // Fetch real status
        const statusRes = await fetch('/api/live/status');
        const statusData = await statusRes.json();

        console.log('REAL BALANCE:', balanceData);
        console.log('REAL STATUS:', statusData);

        // Force update the display
        const portfolioValue = document.getElementById('portfolioValue');
        if (portfolioValue) {
            portfolioValue.innerHTML = `$${balanceData.balance}.00 <span style="color: #00ff00; font-size: 10px;">●LIVE</span>`;
            console.log('✅ Updated portfolio to $' + balanceData.balance);
        }

        const activeTrades = document.getElementById('activeTrades');
        if (activeTrades) {
            activeTrades.textContent = statusData.positions ? statusData.positions.length : 0;
        }

        // Update market list header
        const marketHeader = document.querySelector('.panel-header');
        if (marketHeader) {
            const badge = document.createElement('span');
            badge.style.cssText = 'background: red; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;';
            badge.textContent = '🔴 LIVE TRADING ACTIVE';
            marketHeader.appendChild(badge);
        }

        // Show notification
        const toast = document.createElement('div');
        toast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #00ff00; color: black; padding: 15px; border-radius: 8px; z-index: 10000; font-weight: bold;';
        toast.innerHTML = '🔴 LIVE TRADING ACTIVE<br>Balance: $' + balanceData.balance;
        document.body.appendChild(toast);

        return { balance: balanceData, status: statusData };

    } catch (error) {
        console.error('❌ Error fetching live data:', error);
    }
}

// Run immediately
forceLiveUpdate().then(data => {
    console.log('✅ LIVE DATA LOADED:', data);
});

// Update every 5 seconds
setInterval(forceLiveUpdate, 5000);

console.log('✅ Live updater installed - refreshing every 5 seconds');