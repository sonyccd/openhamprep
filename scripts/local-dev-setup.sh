#!/bin/bash

# Quick setup script for local development
# This script helps new contributors get started quickly

set -e  # Exit on error

echo "========================================"
echo "Open Ham Prep - Local Development Setup"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+."
    exit 1
fi

echo "✓ Node.js $(node -v) found"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found."
    echo ""
    echo "Docker is required to run local Supabase."
    echo "Please install Docker Desktop:"
    echo ""
    echo "  macOS:   brew install --cask docker"
    echo "           or download from https://www.docker.com/products/docker-desktop"
    echo ""
    echo "  Linux:   https://docs.docker.com/engine/install/"
    echo ""
    echo "  Windows: https://www.docker.com/products/docker-desktop"
    echo ""
    exit 1
fi

echo "✓ Docker $(docker --version | cut -d' ' -f3 | tr -d ',') found"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running."
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

echo "✓ Docker is running"

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found."
    echo ""
    read -p "Would you like to install it now? (y/n): " INSTALL_CLI
    if [ "$INSTALL_CLI" = "y" ]; then
        echo "Installing Supabase CLI..."
        if command -v brew &> /dev/null; then
            brew install supabase/tap/supabase
        else
            echo "Homebrew not found. Please install manually:"
            echo "https://supabase.com/docs/guides/cli/getting-started"
            exit 1
        fi
    else
        echo "Please install Supabase CLI manually:"
        echo "  macOS:   brew install supabase/tap/supabase"
        echo "  Other:   https://supabase.com/docs/guides/cli/getting-started"
        exit 1
    fi
fi

echo "✓ Supabase CLI $(supabase --version) found"
echo ""

# Install npm dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

echo ""
echo "========================================"
echo "Starting Local Supabase"
echo "========================================"
echo ""
echo "This will:"
echo "  1. Download Docker images (~500MB on first run)"
echo "  2. Start PostgreSQL, PostgREST, GoTrue, etc."
echo "  3. Apply all database migrations"
echo "  4. Seed test data"
echo "  5. Create .env.local with credentials"
echo ""
echo "This may take 2-3 minutes on first run..."
echo ""

# Start Supabase
npm run supabase:start

echo ""
echo "========================================"
echo "Setup Complete! 🎉"
echo "========================================"
echo ""
echo "Your local environment is ready:"
echo ""
echo "  Application:       http://localhost:8080"
echo "  Supabase Studio:   http://localhost:54323"
echo "  Email Testing:     http://localhost:54324"
echo ""
echo "To start developing:"
echo ""
echo "  # In this terminal:"
echo "  npm run dev"
echo ""
echo "  # Or in the background:"
echo "  npm run dev:full"
echo ""
echo "Useful commands:"
echo "  npm run supabase:stop     - Stop Supabase (keeps data)"
echo "  npm run supabase:reset    - Reset database (wipes data)"
echo "  npm run supabase:studio   - Open Supabase Studio"
echo ""
echo "See LOCAL_DEVELOPMENT.md for more details."
echo ""
