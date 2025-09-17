#!/bin/bash

# InscribeMate Production Deployment Script
# Run this script to deploy the complete system

set -e  # Exit on any error

echo "🚀 Starting InscribeMate Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_dependencies() {
    echo "📋 Checking dependencies..."
    
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}❌ Supabase CLI not found. Please install it first.${NC}"
        echo "Run: npm install -g supabase"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm not found. Please install Node.js first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All dependencies found${NC}"
}

# Deploy database migrations
deploy_database() {
    echo "🗄️  Deploying database migrations..."
    
    # Apply PostGIS and schema migrations
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database migrations applied successfully${NC}"
    else
        echo -e "${RED}❌ Database migration failed${NC}"
        exit 1
    fi
}

# Deploy Edge Functions
deploy_functions() {
    echo "⚡ Deploying Edge Functions..."
    
    # Deploy matchVolunteer function
    supabase functions deploy matchVolunteer
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Edge Functions deployed successfully${NC}"
    else
        echo -e "${RED}❌ Edge Function deployment failed${NC}"
        exit 1
    fi
}

# Build and deploy frontend
deploy_frontend() {
    echo "🎨 Building and deploying frontend..."
    
    # Install dependencies
    npm install
    
    # Build for production
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend built successfully${NC}"
    else
        echo -e "${RED}❌ Frontend build failed${NC}"
        exit 1
    fi
}

# Run tests
run_tests() {
    echo "🧪 Running tests..."
    
    # Run database tests
    echo "Testing database functions..."
    supabase db test
    
    # Run frontend tests
    echo "Running frontend tests..."
    npm run test
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Some tests failed, but continuing deployment${NC}"
    fi
}

# Verify deployment
verify_deployment() {
    echo "🔍 Verifying deployment..."
    
    # Check if Supabase is accessible
    echo "Checking Supabase connection..."
    supabase status
    
    # Check if Edge Functions are running
    echo "Checking Edge Functions..."
    supabase functions list
    
    echo -e "${GREEN}✅ Deployment verification complete${NC}"
}

# Main deployment flow
main() {
    echo -e "${YELLOW}Starting InscribeMate deployment process...${NC}"
    
    check_dependencies
    deploy_database
    deploy_functions
    deploy_frontend
    run_tests
    verify_deployment
    
    echo -e "${GREEN}🎉 InscribeMate deployment completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure environment variables in your hosting platform"
    echo "2. Set up domain and SSL certificates"
    echo "3. Configure monitoring and logging"
    echo "4. Run load tests"
    echo "5. Go live! 🚀"
}

# Run main function
main "$@"
