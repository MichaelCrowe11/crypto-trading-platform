// CryptoCrowe - In-House Custodial Wallet System
// Enterprise-grade wallet management with multi-chain support

const crypto = require('crypto');
const { HDKey } = require('ethereum-cryptography/hdkey');
const { mnemonicToSeedSync } = require('ethereum-cryptography/bip39');
const { keccak256 } = require('ethereum-cryptography/keccak');
const { secp256k1 } = require('ethereum-cryptography/secp256k1');
const bs58 = require('bs58');

class CustodialWalletService {
    constructor() {
        this.masterSeed = process.env.MASTER_WALLET_SEED;
        this.encryptionKey = process.env.WALLET_ENCRYPTION_KEY;

        // Supported chains
        this.supportedChains = {
            ethereum: {
                chainId: 1,
                derivationPath: "m/44'/60'/0'/0",
                rpcUrl: process.env.ETHEREUM_RPC,
                explorerUrl: 'https://etherscan.io'
            },
            polygon: {
                chainId: 137,
                derivationPath: "m/44'/60'/0'/0",
                rpcUrl: process.env.POLYGON_RPC,
                explorerUrl: 'https://polygonscan.com'
            },
            bsc: {
                chainId: 56,
                derivationPath: "m/44'/60'/0'/0",
                rpcUrl: process.env.BSC_RPC,
                explorerUrl: 'https://bscscan.com'
            },
            arbitrum: {
                chainId: 42161,
                derivationPath: "m/44'/60'/0'/0",
                rpcUrl: process.env.ARBITRUM_RPC,
                explorerUrl: 'https://arbiscan.io'
            },
            optimism: {
                chainId: 10,
                derivationPath: "m/44'/60'/0'/0",
                rpcUrl: process.env.OPTIMISM_RPC,
                explorerUrl: 'https://optimistic.etherscan.io'
            },
            bitcoin: {
                chainId: 'btc',
                derivationPath: "m/44'/0'/0'/0",
                rpcUrl: process.env.BITCOIN_RPC,
                explorerUrl: 'https://blockstream.info'
            },
            solana: {
                chainId: 'sol',
                derivationPath: "m/44'/501'/0'/0'",
                rpcUrl: process.env.SOLANA_RPC,
                explorerUrl: 'https://explorer.solana.com'
            }
        };

        this.walletCache = new Map();
    }

    // ============================
    // Wallet Creation & Management
    // ============================

    async createUserWallet(userId, walletName = 'Primary Wallet') {
        /**
         * Creates a new hierarchical deterministic (HD) wallet for a user
         * - Generates unique seed from master seed + user ID
         * - Creates addresses for all supported chains
         * - Encrypts and stores private keys
         * - Returns public addresses only
         */

        try {
            console.log(`Creating wallet for user ${userId}...`);

            // Generate deterministic seed for user
            const userSeed = this.generateUserSeed(userId);

            // Create HD wallet from seed
            const hdWallet = HDKey.fromMasterSeed(userSeed);

            // Generate addresses for all chains
            const walletData = {
                userId,
                walletId: this.generateWalletId(),
                name: walletName,
                createdAt: Date.now(),
                addresses: {},
                encryptedKeys: {},
                publicKeys: {}
            };

            // Generate addresses for each supported chain
            for (const [chainName, chainConfig] of Object.entries(this.supportedChains)) {
                const chainWallet = await this.generateChainWallet(hdWallet, chainConfig, 0);

                walletData.addresses[chainName] = chainWallet.address;
                walletData.publicKeys[chainName] = chainWallet.publicKey;
                walletData.encryptedKeys[chainName] = this.encryptPrivateKey(chainWallet.privateKey);
            }

            // Store wallet data securely
            await this.storeWalletData(walletData);

            console.log(`✅ Wallet created for user ${userId}:`, {
                walletId: walletData.walletId,
                addresses: walletData.addresses
            });

            return {
                walletId: walletData.walletId,
                addresses: walletData.addresses,
                supportedChains: Object.keys(this.supportedChains),
                createdAt: walletData.createdAt
            };

        } catch (error) {
            console.error('Wallet creation error:', error);
            throw new Error(`Failed to create wallet: ${error.message}`);
        }
    }

    async generateChainWallet(hdWallet, chainConfig, index = 0) {
        /**
         * Generates wallet for specific blockchain
         */

        const derivationPath = `${chainConfig.derivationPath}/${index}`;
        const childWallet = hdWallet.derive(derivationPath);

        if (chainConfig.chainId === 'btc') {
            return this.generateBitcoinWallet(childWallet);
        } else if (chainConfig.chainId === 'sol') {
            return this.generateSolanaWallet(childWallet);
        } else {
            return this.generateEVMWallet(childWallet);
        }
    }

    generateEVMWallet(hdWallet) {
        /**
         * Generate Ethereum-compatible wallet (ETH, Polygon, BSC, etc.)
         */

        const privateKey = hdWallet.privateKey;
        const publicKey = secp256k1.getPublicKey(privateKey, false);

        // Ethereum address from public key
        const address = '0x' + keccak256(publicKey.slice(1)).slice(-20).toString('hex');

        return {
            privateKey: privateKey.toString('hex'),
            publicKey: publicKey.toString('hex'),
            address: address
        };
    }

    generateBitcoinWallet(hdWallet) {
        /**
         * Generate Bitcoin wallet (P2PKH)
         */

        const privateKey = hdWallet.privateKey;
        const publicKey = secp256k1.getPublicKey(privateKey, true);

        // Bitcoin address generation (simplified)
        const hash160 = crypto.createHash('sha256').update(publicKey).digest();
        const ripemd160 = crypto.createHash('ripemd160').update(hash160).digest();

        // Add version byte (0x00 for mainnet)
        const versioned = Buffer.concat([Buffer.from([0x00]), ripemd160]);

        // Double SHA256 for checksum
        const checksum = crypto.createHash('sha256')
            .update(crypto.createHash('sha256').update(versioned).digest())
            .digest().slice(0, 4);

        // Combine and encode with Base58
        const address = bs58.encode(Buffer.concat([versioned, checksum]));

        return {
            privateKey: privateKey.toString('hex'),
            publicKey: publicKey.toString('hex'),
            address: address
        };
    }

    generateSolanaWallet(hdWallet) {
        /**
         * Generate Solana wallet
         */

        const privateKey = hdWallet.privateKey;
        // Solana uses ed25519 but we'll use secp256k1 for simplicity
        const publicKey = secp256k1.getPublicKey(privateKey, false);

        // Solana address (simplified - normally uses ed25519)
        const address = bs58.encode(publicKey.slice(1, 33));

        return {
            privateKey: privateKey.toString('hex'),
            publicKey: publicKey.toString('hex'),
            address: address
        };
    }

    // ============================
    // Wallet Utilities
    // ============================

    generateUserSeed(userId) {
        /**
         * Generate deterministic seed for user
         * Combines master seed with user ID for uniqueness
         */

        const combined = `${this.masterSeed}:${userId}:cryptocrowe-wallet`;
        return crypto.createHash('sha256').update(combined).digest();
    }

    generateWalletId() {
        return 'crowe_' + crypto.randomBytes(16).toString('hex');
    }

    encryptPrivateKey(privateKey) {
        /**
         * Encrypt private key using AES-256-GCM
         */

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);

        let encrypted = cipher.update(privateKey, 'hex', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex')
        };
    }

    decryptPrivateKey(encryptedData) {
        /**
         * Decrypt private key
         */

        const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'hex');
        decrypted += decipher.final('hex');

        return decrypted;
    }

    // ============================
    // Transaction Management
    // ============================

    async signTransaction(userId, chainName, transactionData) {
        /**
         * Sign transaction with user's private key
         */

        try {
            // Get user's wallet
            const wallet = await this.getUserWallet(userId);
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            // Decrypt private key for chain
            const encryptedKey = wallet.encryptedKeys[chainName];
            const privateKey = this.decryptPrivateKey(encryptedKey);

            // Sign based on chain type
            if (chainName === 'bitcoin') {
                return this.signBitcoinTransaction(privateKey, transactionData);
            } else if (chainName === 'solana') {
                return this.signSolanaTransaction(privateKey, transactionData);
            } else {
                return this.signEVMTransaction(privateKey, transactionData);
            }

        } catch (error) {
            console.error('Transaction signing error:', error);
            throw error;
        }
    }

    async signEVMTransaction(privateKey, txData) {
        /**
         * Sign Ethereum-compatible transaction
         */

        const { ethers } = require('ethers');

        const wallet = new ethers.Wallet(privateKey);
        const signedTx = await wallet.signTransaction(txData);

        return {
            signedTransaction: signedTx,
            hash: ethers.utils.keccak256(signedTx),
            from: wallet.address
        };
    }

    // ============================
    // Balance Management
    // ============================

    async getWalletBalances(userId) {
        /**
         * Get balances across all chains for user
         */

        const wallet = await this.getUserWallet(userId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const balances = {};

        for (const [chainName, address] of Object.entries(wallet.addresses)) {
            try {
                const balance = await this.getChainBalance(chainName, address);
                balances[chainName] = balance;
            } catch (error) {
                console.error(`Failed to get ${chainName} balance:`, error);
                balances[chainName] = { error: error.message };
            }
        }

        return balances;
    }

    async getChainBalance(chainName, address) {
        /**
         * Get balance for specific chain
         */

        const chainConfig = this.supportedChains[chainName];
        if (!chainConfig) {
            throw new Error(`Unsupported chain: ${chainName}`);
        }

        // This would integrate with actual blockchain RPCs
        // For now, return structure
        return {
            address,
            nativeBalance: '0',
            tokens: [],
            usdValue: 0,
            lastUpdated: Date.now()
        };
    }

    // ============================
    // Security Features
    // ============================

    async enableMultiSig(userId, walletId, signers) {
        /**
         * Enable multi-signature for high-value transactions
         */

        const wallet = await this.getUserWallet(userId);

        wallet.security = {
            multiSig: {
                enabled: true,
                threshold: Math.ceil(signers.length / 2),
                signers: signers,
                requiredForAmounts: {
                    above: 10000 // USD
                }
            }
        };

        await this.updateWalletData(wallet);
        return wallet.security;
    }

    async enableTimelock(userId, walletId, delayHours = 24) {
        /**
         * Enable timelock for large withdrawals
         */

        const wallet = await this.getUserWallet(userId);

        wallet.security = wallet.security || {};
        wallet.security.timelock = {
            enabled: true,
            delayHours,
            requiredForAmounts: {
                above: 50000 // USD
            }
        };

        await this.updateWalletData(wallet);
        return wallet.security;
    }

    // ============================
    // Data Storage (to be integrated with Supabase)
    // ============================

    async storeWalletData(walletData) {
        // Store in Supabase wallets table
        console.log('Storing wallet data:', walletData.walletId);
        // Implementation would use Supabase client
    }

    async getUserWallet(userId) {
        // Retrieve from Supabase
        console.log('Retrieving wallet for user:', userId);
        // Implementation would query Supabase
        return null;
    }

    async updateWalletData(walletData) {
        // Update in Supabase
        console.log('Updating wallet:', walletData.walletId);
        // Implementation would use Supabase client
    }

    // ============================
    // Portfolio Integration
    // ============================

    async getPortfolioValue(userId) {
        /**
         * Calculate total portfolio value across all chains
         */

        const balances = await this.getWalletBalances(userId);
        let totalValue = 0;
        const breakdown = {};

        for (const [chainName, balance] of Object.entries(balances)) {
            if (!balance.error) {
                totalValue += balance.usdValue || 0;
                breakdown[chainName] = balance.usdValue || 0;
            }
        }

        return {
            totalValue,
            breakdown,
            lastUpdated: Date.now()
        };
    }

    // ============================
    // Backup & Recovery
    // ============================

    async generateBackupPhrase(userId) {
        /**
         * Generate backup phrase for wallet recovery
         * Only returns encrypted version for security
         */

        const wallet = await this.getUserWallet(userId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        // Generate recovery phrase (encrypted)
        const recoveryPhrase = crypto.randomBytes(32).toString('hex');
        const encryptedPhrase = this.encryptPrivateKey(recoveryPhrase);

        wallet.backup = {
            encryptedPhrase,
            createdAt: Date.now(),
            used: false
        };

        await this.updateWalletData(wallet);

        return {
            backupId: crypto.randomBytes(8).toString('hex'),
            instructions: 'Store this backup ID safely. Contact support for recovery.',
            createdAt: Date.now()
        };
    }
}

module.exports = CustodialWalletService;