#!/usr/bin/env node

/**
 * Secret Generation Script for Railway Deployment
 * Generates secure keys for encryption and JWT
 */

const crypto = require('crypto');

console.log('Generating secure secrets for Railway deployment...\n');

// Generate encryption key (32 bytes = 256 bits)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('ENCRYPTION_KEY:');
console.log(encryptionKey);
console.log('(32 bytes, 64 hex characters)\n');

// Generate JWT secret (64 bytes = 512 bits)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('(64 bytes, 128 hex characters)\n');

// Generate session secret (32 bytes)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET:');
console.log(sessionSecret);
console.log('(32 bytes, 64 hex characters)\n');

// Generate API key for internal services
const apiKey = crypto.randomBytes(24).toString('base64');
console.log('INTERNAL_API_KEY:');
console.log(apiKey);
console.log('(24 bytes, base64 encoded)\n');

console.log('---');
console.log('Copy these values to your Railway environment variables.');
console.log('NEVER commit these values to your repository!');
console.log('\nFor Railway CLI, you can set them using:');
console.log(`railway variables set ENCRYPTION_KEY="${encryptionKey}"`);
console.log(`railway variables set JWT_SECRET="${jwtSecret}"`);
console.log(`railway variables set SESSION_SECRET="${sessionSecret}"`);
console.log(`railway variables set INTERNAL_API_KEY="${apiKey}"`);