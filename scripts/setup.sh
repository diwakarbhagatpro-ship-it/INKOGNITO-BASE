#!/bin/bash

# InscribeMate Setup Script
# Usage: ./scripts/setup.sh

set -e

echo "🔧 Setting up InscribeMate development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [[ $NODE_VERSION -lt 18 ]]; then
    echo "❌ Node.js version 18 or later is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [[ ! -f .env ]]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your actual values"
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

echo "✅ Supabase CLI version: $(supabase --version)"

# Check if Docker is installed (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker version: $(docker --version)"
else
    echo "⚠️  Docker not found. Docker is optional but recommended for production deployment."
fi

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed."
    exit 1
fi

echo "✅ Git version: $(git --version)"

# Set up Git hooks (optional)
if [[ -d .git ]]; then
    echo "🔗 Setting up Git hooks..."
    # Add pre-commit hook for linting
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
npm run lint
npm run test:run
EOF
    chmod +x .git/hooks/pre-commit
    echo "✅ Git hooks configured"
fi

# Run type checking
echo "🔍 Running type check..."
npm run check

# Run linting
echo "🧹 Running linter..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test:run

echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your actual values"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Run 'supabase start' to start local Supabase (if using local development)"
echo "4. Visit http://localhost:5173 to view the application"
echo ""
echo "For production deployment:"
echo "1. Configure your environment variables"
echo "2. Run './scripts/deploy.sh production'"
echo ""
echo "Happy coding! 🚀"