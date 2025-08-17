#!/bin/bash

# Database Setup Script for Personalized LMS
# This script helps set up the local development database

set -e  # Exit on any error

echo "🚀 Setting up Personalized LMS Database..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo "  or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if supabase directory exists
if [ ! -d "supabase" ]; then
    echo "📁 Initializing Supabase project..."
    supabase init
else
    echo "✅ Supabase project already initialized"
fi

# Start Supabase services
echo "🔄 Starting Supabase services..."
supabase start

# Wait a moment for services to fully start
echo "⏳ Waiting for services to start..."
sleep 5

# Apply migrations
echo "📊 Applying database migrations..."
supabase db reset --debug

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual values"
else
    echo "✅ .env file already exists"
fi

# Get local database info
echo ""
echo "🎉 Database setup complete!"
echo ""
echo "📋 Local Development URLs:"
echo "  - Supabase Studio: http://localhost:54323"
echo "  - API URL: http://localhost:54321"
echo "  - Database URL: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
echo "🔑 Default Credentials:"
echo "  - Database: postgres/postgres"
echo "  - Studio: No authentication required for local development"
echo ""
echo "📚 Next Steps:"
echo "  1. Update your .env file with the local values above"
echo "  2. Run 'npm run dev' to start the application"
echo "  3. Visit http://localhost:54323 to explore your database"
echo ""
echo "🛠️  Useful Commands:"
echo "  - supabase status: Check service status"
echo "  - supabase stop: Stop all services"
echo "  - supabase db reset: Reset database and apply migrations"
echo "  - supabase db diff: Generate migration from schema changes"
echo ""

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

echo "✨ Setup complete! Happy coding!"