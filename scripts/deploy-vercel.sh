#!/bin/bash

# Vercel Deployment Script for InscribeMate
echo "🚀 Starting Vercel deployment process..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Set environment variables
echo "📝 Setting up environment variables..."
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add ENCRYPTION_KEY production
vercel env add NODE_ENV production
vercel env add CORS_ORIGIN production

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at the provided URL"
echo "📊 Check the Vercel dashboard for deployment status and logs"