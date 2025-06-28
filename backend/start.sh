#!/bin/bash

# HelpMe Backend Startup Script
# This script ensures proper environment variables and process management

echo "🚀 Starting HelpMe Backend..."

# Kill any existing processes on port 8000
echo "🔧 Checking for existing processes on port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
sleep 2

# Set required environment variables if not already set
export JWT_SECRET="${JWT_SECRET:-your_super_secure_jwt_secret_at_least_32_characters_long_here}"
export REFRESH_TOKEN_SECRET="${REFRESH_TOKEN_SECRET:-your_super_secure_refresh_token_secret_at_least_32_characters_long}"
export DB_PASSWORD="${DB_PASSWORD:-password}"
export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-8000}"

# Validate environment variables
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "❌ Error: JWT_SECRET must be at least 32 characters long"
    exit 1
fi

if [ ${#REFRESH_TOKEN_SECRET} -lt 32 ]; then
    echo "❌ Error: REFRESH_TOKEN_SECRET must be at least 32 characters long"
    exit 1
fi

echo "✅ Environment variables validated"

# Run database migrations
echo "🗄️  Running database migrations..."
npx knex migrate:latest

# Start the application
echo "🚀 Starting the application..."
if [ "$NODE_ENV" = "development" ]; then
    npm run dev
else
    npm start
fi
