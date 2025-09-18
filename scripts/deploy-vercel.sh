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

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Run type check
echo "🔍 Running type check..."
npm run check

# Run tests
echo "🧪 Running tests..."
npm run test:run

# Build the project
echo "🏗️ Building project..."
npm run build

# Set environment variables
echo "📝 Setting up environment variables..."
echo "Please set these environment variables in your Vercel dashboard:"
echo ""
echo "VITE_SUPABASE_URL=https://aqvpvtqywojhybhjogiv.supabase.co"
echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnB2dHF5d29oanliaGpvZ2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDAyNDMsImV4cCI6MjA3MzcxNjI0M30.rwPp2JzLlFsGXslS1KvSSUbzNgS1dWO9q9mOSkFmjm8"
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnB2dHF5d29oanliaGpvZ2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDAyNDMsImV4cCI6MjA3MzcxNjI0M30.rwPp2JzLlFsGXslS1KvSSUbzNgS1dWO9q9mOSkFmjm8"
echo "DATABASE_URL=postgresql://postgres.aqvpvtqywojhybhjogiv:Jc775869w@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
echo "JWT_SECRET=inscribemate_jwt_secret_2024_production_ready"
echo "ENCRYPTION_KEY=inscribemate_encryption_key_32_chars_long"
echo "NODE_ENV=production"
echo "CORS_ORIGIN=https://your-app-name.vercel.app"
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at the provided URL"
echo "📊 Check the Vercel dashboard for deployment status and logs"
echo ""
echo "🔧 Next steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Run database migrations in Supabase"
echo "3. Test the deployed application"
echo "4. Configure custom domain (optional)"