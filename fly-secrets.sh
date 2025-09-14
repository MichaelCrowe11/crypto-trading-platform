#!/bin/bash
# Set production secrets for Fly.io deployment

echo "Setting up Crow-e Crypto production secrets..."

~/.fly/bin/flyctl secrets set \
  NODE_ENV=production \
  PORT=8080 \
  JWT_SECRET=$(openssl rand -hex 32) \
  ENCRYPTION_KEY=$(openssl rand -hex 32) \
  SUPABASE_URL=https://your-project.supabase.co \
  SUPABASE_ANON_KEY=your-anon-key \
  SUPABASE_SERVICE_KEY=your-service-key \
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crowe-crypto \
  REDIS_URL=redis://default:password@redis-host:6379 \
  --app crowe-crypto

echo "Secrets configured. You can update them with your actual API keys."