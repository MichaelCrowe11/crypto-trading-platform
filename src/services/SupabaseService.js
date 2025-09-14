// Supabase Authentication and Database Service
const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
    }

    // Authentication methods
    async signUp(email, password, metadata = {}) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });

        if (error) throw error;
        return data;
    }

    async signIn(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    }

    async signOut(token) {
        const { error } = await this.supabase.auth.signOut(token);
        if (error) throw error;
    }

    async verifyToken(token) {
        const { data: { user }, error } = await this.supabase.auth.getUser(token);
        if (error) throw error;
        return user;
    }

    // User profile management
    async getUserProfile(userId) {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async updateUserProfile(userId, updates) {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .upsert({
                user_id: userId,
                ...updates,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Wallet management
    async saveWallet(userId, walletData) {
        const { data, error } = await this.supabase
            .from('user_wallets')
            .insert({
                user_id: userId,
                ...walletData,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getUserWallets(userId) {
        const { data, error } = await this.supabase
            .from('user_wallets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    // API Keys management (encrypted)
    async saveApiKeys(userId, exchange, encryptedKeys) {
        const { data, error } = await this.supabase
            .from('exchange_keys')
            .upsert({
                user_id: userId,
                exchange,
                encrypted_keys: encryptedKeys,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getApiKeys(userId, exchange) {
        const { data, error } = await this.supabase
            .from('exchange_keys')
            .select('encrypted_keys')
            .eq('user_id', userId)
            .eq('exchange', exchange)
            .single();

        if (error && error.code !== 'PGRST116') return null;
        if (error) throw error;
        return data?.encrypted_keys;
    }

    // Trading history
    async saveTrade(tradeData) {
        const { data, error } = await this.supabase
            .from('trades')
            .insert(tradeData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getUserTrades(userId, options = {}) {
        const { limit = 100, offset = 0, startDate, endDate } = options;

        let query = this.supabase
            .from('trades')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (startDate) {
            query = query.gte('created_at', startDate);
        }

        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    // Portfolio data
    async updatePortfolio(userId, portfolioData) {
        const { data, error } = await this.supabase
            .from('portfolios')
            .upsert({
                user_id: userId,
                ...portfolioData,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getPortfolio(userId) {
        const { data, error } = await this.supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') return null;
        if (error) throw error;
        return data;
    }

    // Trading configurations
    async saveTradingConfig(userId, config) {
        const { data, error } = await this.supabase
            .from('trading_configs')
            .upsert({
                user_id: userId,
                config,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getTradingConfig(userId) {
        const { data, error } = await this.supabase
            .from('trading_configs')
            .select('config')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') return null;
        if (error) throw error;
        return data?.config;
    }

    // Real-time subscriptions
    subscribeToTrades(userId, callback) {
        return this.supabase
            .channel(`trades:${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'trades',
                filter: `user_id=eq.${userId}`
            }, callback)
            .subscribe();
    }

    subscribeToPortfolio(userId, callback) {
        return this.supabase
            .channel(`portfolio:${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'portfolios',
                filter: `user_id=eq.${userId}`
            }, callback)
            .subscribe();
    }

    // Cleanup
    async unsubscribe(subscription) {
        await this.supabase.removeChannel(subscription);
    }
}

module.exports = new SupabaseService();