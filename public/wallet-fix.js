// Crow-e Crypto - Simple Wallet Connection (No API Keys Required)

// This file provides wallet connections that work WITHOUT any API keys

// MetaMask Connection (Works immediately - no API needed)
async function connectMetaMaskDirect() {
    console.log('Attempting MetaMask connection...');

    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed! Please install it from https://metamask.io');
        window.open('https://metamask.io/download/', '_blank');
        return null;
    }

    try {
        // Request accounts from MetaMask
        console.log('Requesting accounts from MetaMask...');
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length > 0) {
            const address = accounts[0];
            console.log('Connected to MetaMask:', address);

            // Get network info
            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            console.log('Connected to chain:', chainId);

            // Update UI
            displayWalletAddress(address);

            // Show success message
            showMessage(`MetaMask connected: ${address.slice(0, 6)}...${address.slice(-4)}`, 'success');

            return address;
        }
    } catch (error) {
        console.error('MetaMask connection error:', error);

        if (error.code === 4001) {
            showMessage('You rejected the connection request', 'error');
        } else if (error.code === -32002) {
            showMessage('Please unlock MetaMask first', 'warning');
        } else {
            showMessage('Failed to connect MetaMask: ' + error.message, 'error');
        }

        return null;
    }
}

// Phantom Connection (For Solana - Works immediately)
async function connectPhantomDirect() {
    console.log('Attempting Phantom connection...');

    // Check if Phantom is installed
    const isPhantomInstalled = window.solana && window.solana.isPhantom;

    if (!isPhantomInstalled) {
        alert('Phantom wallet is not installed! Please install it from https://phantom.app');
        window.open('https://phantom.app/', '_blank');
        return null;
    }

    try {
        // Connect to Phantom
        const response = await window.solana.connect();
        const publicKey = response.publicKey.toString();

        console.log('Connected to Phantom:', publicKey);

        // Update UI
        displayWalletAddress(publicKey);

        // Show success message
        showMessage(`Phantom connected: ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`, 'success');

        return publicKey;
    } catch (error) {
        console.error('Phantom connection error:', error);
        showMessage('Failed to connect Phantom: ' + error.message, 'error');
        return null;
    }
}

// Display wallet address in UI
function displayWalletAddress(address) {
    const walletAddressEl = document.getElementById('walletAddress');
    const connectBtn = document.getElementById('connectWallet');

    if (walletAddressEl && address) {
        walletAddressEl.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        walletAddressEl.style.display = 'block';
    }

    if (connectBtn) {
        connectBtn.innerHTML = '<i class="fas fa-unlink"></i> Disconnect';
        connectBtn.onclick = disconnectWallet;
    }
}

// Disconnect wallet
function disconnectWallet() {
    const walletAddressEl = document.getElementById('walletAddress');
    const connectBtn = document.getElementById('connectWallet');

    if (walletAddressEl) {
        walletAddressEl.style.display = 'none';
    }

    if (connectBtn) {
        connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
        connectBtn.onclick = () => document.getElementById('walletModal').classList.add('active');
    }

    showMessage('Wallet disconnected', 'info');
}

// Show message to user
function showMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Try to use existing toast function
    if (typeof showToast === 'function') {
        showToast(message, type);
    } else {
        // Fallback to alert
        if (type === 'error') {
            alert('Error: ' + message);
        } else {
            alert(message);
        }
    }
}

// Initialize wallet connections on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Wallet fix script loaded');

    // Override the connect functions
    window.connectMetaMask = connectMetaMaskDirect;
    window.connectPhantom = connectPhantomDirect;

    // For WalletConnect - show message
    window.connectWalletConnect = function() {
        showMessage('WalletConnect requires a Project ID. Get one free at: cloud.walletconnect.com', 'warning');
        window.open('https://cloud.walletconnect.com/sign-in', '_blank');
    };

    // For Coinbase - show message
    window.connectCoinbase = function() {
        showMessage('Coinbase Wallet SDK needs configuration. MetaMask works immediately!', 'info');
    };

    // Check if MetaMask is already connected
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.request({ method: 'eth_accounts' })
            .then(accounts => {
                if (accounts.length > 0) {
                    console.log('Wallet already connected:', accounts[0]);
                    displayWalletAddress(accounts[0]);
                }
            })
            .catch(console.error);
    }
});

// Log wallet status for debugging
console.log('Wallet Status Check:');
console.log('- MetaMask installed:', typeof window.ethereum !== 'undefined');
console.log('- Phantom installed:', window.solana && window.solana.isPhantom);
console.log('- Web3 available:', typeof Web3 !== 'undefined');

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        connectMetaMaskDirect,
        connectPhantomDirect,
        disconnectWallet
    };
}