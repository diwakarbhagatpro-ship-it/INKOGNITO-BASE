#!/bin/bash

# InscribeMate Deployment Script
# Usage: ./scripts/deploy.sh [environment] [version]

set -e

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
APP_NAME="inscribemate"

echo "🚀 Starting deployment to $ENVIRONMENT environment..."

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Set environment-specific variables
if [[ "$ENVIRONMENT" == "production" ]]; then
    DOCKER_TAG="$APP_NAME-prod:$VERSION"
    COMPOSE_FILE="docker-compose.prod.yml"
else
    DOCKER_TAG="$APP_NAME-staging:$VERSION"
    COMPOSE_FILE="docker-compose.staging.yml"
fi

echo "📦 Building Docker image: $DOCKER_TAG"

# Build the Docker image
docker build -f docker/Dockerfile -t $DOCKER_TAG .

echo "🧪 Running tests..."

# Run tests
npm run test:run

echo "🔍 Running security scan..."

# Run security scan (if trivy is installed)
if command -v trivy &> /dev/null; then
    trivy image --severity HIGH,CRITICAL $DOCKER_TAG
else
    echo "⚠️  Trivy not found, skipping security scan"
fi

echo "🗄️  Running database migrations..."

# Run database migrations
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "⚠️  Production migration - ensure you have backups!"
    read -p "Continue with production migration? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Migration cancelled"
        exit 1
    fi
fi

# Run migrations using Supabase CLI
supabase db push --project-ref $SUPABASE_PROJECT_REF

echo "🚀 Deploying application..."

# Deploy using Docker Compose
docker-compose -f docker/$COMPOSE_FILE up -d

echo "⏳ Waiting for application to start..."

# Wait for application to be healthy
for i in {1..30}; do
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    fi
    echo "⏳ Waiting for application... ($i/30)"
    sleep 10
done

# Check if application is healthy
if ! curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "❌ Application failed to start properly"
    docker-compose -f docker/$COMPOSE_FILE logs
    exit 1
fi

echo "🧹 Cleaning up old images..."

# Remove old images (keep last 3 versions)
docker images $APP_NAME-$ENVIRONMENT --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}" | \
    tail -n +4 | \
    awk '{print $1":"$2}' | \
    head -n -3 | \
    xargs -r docker rmi || true

echo "📊 Deployment summary:"
echo "   Environment: $ENVIRONMENT"
echo "   Version: $VERSION"
echo "   Docker Tag: $DOCKER_TAG"
echo "   Health Check: http://localhost:5000/health"
echo "   Metrics: http://localhost:5000/metrics"

echo "✅ Deployment completed successfully!"

# Send notification (if configured)
if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ InscribeMate deployed to $ENVIRONMENT (v$VERSION)\"}" \
        $SLACK_WEBHOOK_URL
fi