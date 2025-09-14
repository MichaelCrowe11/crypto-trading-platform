// User model for MongoDB (fallback if not using Supabase)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    wallets: [{
        address: String,
        type: String,
        chainId: Number,
        connectedAt: Date
    }],
    exchanges: [{
        name: String,
        encryptedKeys: Object,
        connectedAt: Date
    }],
    portfolio: {
        totalValue: Number,
        positions: Array,
        lastUpdated: Date
    },
    settings: {
        autoTrade: Boolean,
        riskLevel: String,
        notifications: Boolean
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('User', userSchema);