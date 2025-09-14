// Crow-e Crypto - Wallet Connection Manager
// Support for MetaMask, WalletConnect, Coinbase Wallet, and more

const { ethers } = require('ethers');
const WalletConnectProvider = require('@walletconnect/web3-provider').default;
const Web3 = require('web3');
const crypto = require('crypto');

class WalletManager {
    constructor() {
        this.providers = new Map();
        this.connectedWallets = new Map();
        this.supportedChains = {
            ethereum: {
                chainId: 1,
                rpc: process.env.ETHEREUM_RPC,
                name: 'Ethereum Mainnet'
            },
            polygon: {
                chainId: 137,
                rpc: process.env.POLYGON_RPC,
                name: 'Polygon'
            },
            bsc: {
                chainId: 56,
                rpc: process.env.BSC_RPC,
                name: 'Binance Smart Chain'
            },
            arbitrum: {
                chainId: 42161,
                rpc: process.env.ARBITRUM_RPC,
                name: 'Arbitrum One'
            },
            optimism: {
                chainId: 10,
                rpc: 'https://mainnet.optimism.io',
                name: 'Optimism'
            },
            avalanche: {
                chainId: 43114,
                rpc: 'https://api.avax.network/ext/bc/C/rpc',
                name: 'Avalanche'
            }
        };
    }

    // Connect MetaMask wallet
    async connectMetaMask(userId) {
        try {
            if (typeof window === 'undefined' || !window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            const walletInfo = {
                address,
                type: 'metamask',
                chainId: network.chainId,
                provider: provider,
                signer: signer
            };

            this.connectedWallets.set(userId, walletInfo);
            return walletInfo;

        } catch (error) {
            console.error('MetaMask connection error:', error);
            throw error;
        }
    }

    // Connect using WalletConnect
    async connectWalletConnect(userId) {
        try {
            const provider = new WalletConnectProvider({
                infuraId: process.env.INFURA_ID,
                rpc: {
                    1: this.supportedChains.ethereum.rpc,
                    137: this.supportedChains.polygon.rpc,
                    56: this.supportedChains.bsc.rpc,
                    42161: this.supportedChains.arbitrum.rpc
                },
                chainId: 1,
                qrcodeModalOptions: {
                    mobileLinks: [
                        'rainbow',
                        'metamask',
                        'argent',
                        'trust',
                        'imtoken',
                        'pillar'
                    ]
                }
            });

            await provider.enable();

            const web3Provider = new ethers.providers.Web3Provider(provider);
            const signer = web3Provider.getSigner();
            const address = await signer.getAddress();
            const network = await web3Provider.getNetwork();

            const walletInfo = {
                address,
                type: 'walletconnect',
                chainId: network.chainId,
                provider: web3Provider,
                signer: signer
            };

            this.connectedWallets.set(userId, walletInfo);
            return walletInfo;

        } catch (error) {
            console.error('WalletConnect error:', error);
            throw error;
        }
    }

    // Connect Coinbase Wallet
    async connectCoinbaseWallet(userId) {
        try {
            const CoinbaseWalletSDK = require('@coinbase/wallet-sdk');

            const coinbaseWallet = new CoinbaseWalletSDK({
                appName: 'Crow-e Crypto',
                appLogoUrl: 'https://crowe-crypto.fly.dev/logo.png',
                darkMode: false
            });

            const ethereum = coinbaseWallet.makeWeb3Provider(
                process.env.ETHEREUM_RPC,
                1
            );

            const provider = new ethers.providers.Web3Provider(ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            const walletInfo = {
                address,
                type: 'coinbase',
                chainId: 1,
                provider: provider,
                signer: signer
            };

            this.connectedWallets.set(userId, walletInfo);
            return walletInfo;

        } catch (error) {
            console.error('Coinbase Wallet error:', error);
            throw error;
        }
    }

    // Get wallet balance
    async getBalance(address, chain = 'ethereum') {
        try {
            const chainConfig = this.supportedChains[chain];
            const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpc);

            const balance = await provider.getBalance(address);
            const formattedBalance = ethers.utils.formatEther(balance);

            return {
                raw: balance.toString(),
                formatted: formattedBalance,
                chain: chain,
                symbol: chain === 'ethereum' ? 'ETH' : chain.toUpperCase()
            };

        } catch (error) {
            console.error('Balance fetch error:', error);
            throw error;
        }
    }

    // Get multiple token balances
    async getTokenBalances(address, tokens = [], chain = 'ethereum') {
        try {
            const chainConfig = this.supportedChains[chain];
            const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpc);
            const balances = [];

            // ERC20 ABI for balanceOf
            const erc20Abi = [
                'function balanceOf(address owner) view returns (uint256)',
                'function decimals() view returns (uint8)',
                'function symbol() view returns (string)'
            ];

            for (const tokenAddress of tokens) {
                try {
                    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
                    const [balance, decimals, symbol] = await Promise.all([
                        contract.balanceOf(address),
                        contract.decimals(),
                        contract.symbol()
                    ]);

                    balances.push({
                        token: tokenAddress,
                        symbol,
                        balance: ethers.utils.formatUnits(balance, decimals),
                        rawBalance: balance.toString(),
                        decimals
                    });
                } catch (err) {
                    console.error(`Error fetching balance for token ${tokenAddress}:`, err);
                }
            }

            return balances;

        } catch (error) {
            console.error('Token balances error:', error);
            throw error;
        }
    }

    // Verify wallet ownership through signature
    async verifyWalletSignature(address, signature, message = null) {
        try {
            const messageToSign = message || `Sign this message to connect your wallet to Crow-e Crypto.\n\nTimestamp: ${Date.now()}`;
            const recoveredAddress = ethers.utils.verifyMessage(messageToSign, signature);

            return recoveredAddress.toLowerCase() === address.toLowerCase();

        } catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    }

    // Sign a message with connected wallet
    async signMessage(userId, message) {
        try {
            const wallet = this.connectedWallets.get(userId);
            if (!wallet) {
                throw new Error('No wallet connected');
            }

            const signature = await wallet.signer.signMessage(message);
            return signature;

        } catch (error) {
            console.error('Message signing error:', error);
            throw error;
        }
    }

    // Send transaction
    async sendTransaction(userId, txParams) {
        try {
            const wallet = this.connectedWallets.get(userId);
            if (!wallet) {
                throw new Error('No wallet connected');
            }

            const tx = await wallet.signer.sendTransaction({
                to: txParams.to,
                value: ethers.utils.parseEther(txParams.value || '0'),
                data: txParams.data || '0x',
                gasLimit: txParams.gasLimit || 21000,
                gasPrice: txParams.gasPrice || await wallet.provider.getGasPrice()
            });

            const receipt = await tx.wait();
            return receipt;

        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    }

    // Switch network
    async switchNetwork(userId, chainId) {
        try {
            const wallet = this.connectedWallets.get(userId);
            if (!wallet) {
                throw new Error('No wallet connected');
            }

            if (wallet.type === 'metamask' && typeof window !== 'undefined') {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${chainId.toString(16)}` }]
                });
            }

            return true;

        } catch (error) {
            console.error('Network switch error:', error);

            // If the chain hasn't been added, add it
            if (error.code === 4902) {
                const chain = Object.values(this.supportedChains).find(c => c.chainId === chainId);
                if (chain && typeof window !== 'undefined') {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${chainId.toString(16)}`,
                            chainName: chain.name,
                            rpcUrls: [chain.rpc],
                            nativeCurrency: {
                                name: chain.name,
                                symbol: chain.name.substring(0, 3).toUpperCase(),
                                decimals: 18
                            }
                        }]
                    });
                }
            }

            throw error;
        }
    }

    // Disconnect wallet
    async disconnectWallet(userId) {
        try {
            const wallet = this.connectedWallets.get(userId);

            if (wallet && wallet.type === 'walletconnect') {
                await wallet.provider.disconnect();
            }

            this.connectedWallets.delete(userId);
            return true;

        } catch (error) {
            console.error('Disconnect error:', error);
            throw error;
        }
    }

    // Get connected wallet info
    getWalletInfo(userId) {
        const wallet = this.connectedWallets.get(userId);
        if (!wallet) return null;

        return {
            address: wallet.address,
            type: wallet.type,
            chainId: wallet.chainId,
            connected: true
        };
    }

    // Monitor wallet events
    async monitorWalletEvents(userId, callbacks) {
        const wallet = this.connectedWallets.get(userId);
        if (!wallet) return;

        // Listen for account changes
        if (callbacks.onAccountsChanged) {
            wallet.provider.on('accountsChanged', callbacks.onAccountsChanged);
        }

        // Listen for chain changes
        if (callbacks.onChainChanged) {
            wallet.provider.on('chainChanged', callbacks.onChainChanged);
        }

        // Listen for disconnection
        if (callbacks.onDisconnect) {
            wallet.provider.on('disconnect', callbacks.onDisconnect);
        }
    }

    // Store wallet connection in database (encrypted)
    async saveWalletConnection(userId, walletData) {
        const supabase = require('./SupabaseService');

        // Encrypt sensitive data
        const encryptedData = this.encryptData({
            address: walletData.address,
            type: walletData.type,
            chainId: walletData.chainId
        });

        return await supabase.saveWallet(userId, {
            encrypted_data: encryptedData,
            wallet_type: walletData.type,
            is_active: true
        });
    }

    // Encrypt sensitive data
    encryptData(data) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);

        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            authTag: authTag.toString('hex'),
            iv: iv.toString('hex')
        };
    }

    // Decrypt sensitive data
    decryptData(encryptedData) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        const decipher = crypto.createDecipheriv(
            algorithm,
            key,
            Buffer.from(encryptedData.iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }
}

module.exports = WalletManager;