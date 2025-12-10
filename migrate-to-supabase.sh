#!/bin/bash

# Migration script for Open Ham Prep - Lovable Cloud to Supabase
# This script helps migrate your database and functions to a new Supabase project

set -e  # Exit on error

echo "========================================"
echo "Open Ham Prep - Supabase Migration"
echo "========================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

echo "✓ Supabase CLI found (version $(supabase --version))"
echo ""

# Check if already logged in
echo "Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "Please login to Supabase:"
    supabase login
fi

echo "✓ Logged in to Supabase"
echo ""

# Prompt for project reference
read -p "Enter your Supabase Project ID (from Settings > General): " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project ID cannot be empty"
    exit 1
fi

echo ""
echo "Linking to Supabase project..."
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "✓ Successfully linked to project"
echo ""

# Apply migrations
echo "========================================"
echo "Step 1: Applying Database Migrations"
echo "========================================"
echo ""
echo "Found the following migrations:"
ls -1 supabase/migrations/*.sql | nl

echo ""
read -p "Do you want to apply all migrations? (y/n): " APPLY_MIGRATIONS

if [ "$APPLY_MIGRATIONS" = "y" ]; then
    echo ""
    echo "Pushing migrations to Supabase..."
    supabase db push
    echo "✓ Migrations applied successfully"
else
    echo "⚠ Skipping migrations. You'll need to apply them manually later."
fi

echo ""
echo "========================================"
echo "Step 2: Deploying Edge Functions"
echo "========================================"
echo ""
echo "Found the following functions:"
ls -1d supabase/functions/*/ 2>/dev/null | xargs -n1 basename || echo "No functions found"

echo ""
read -p "Do you want to deploy all edge functions? (y/n): " DEPLOY_FUNCTIONS

if [ "$DEPLOY_FUNCTIONS" = "y" ]; then
    for func_dir in supabase/functions/*/; do
        if [ -d "$func_dir" ]; then
            func_name=$(basename "$func_dir")
            echo ""
            echo "Deploying function: $func_name"
            supabase functions deploy "$func_name" --no-verify-jwt
        fi
    done
    echo "✓ Functions deployed successfully"
else
    echo "⚠ Skipping function deployment. You'll need to deploy them manually later."
fi

echo ""
echo "========================================"
echo "Step 3: Update Environment Variables"
echo "========================================"
echo ""

# Get project details
PROJECT_URL=$(supabase projects list | grep "$PROJECT_REF" | awk '{print $3}' || echo "")
if [ -z "$PROJECT_URL" ]; then
    PROJECT_URL="https://${PROJECT_REF}.supabase.co"
fi

echo "Your new Supabase credentials:"
echo ""
echo "VITE_SUPABASE_URL=$PROJECT_URL"
echo ""
echo "To get your anon key:"
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
echo "2. Copy the 'anon' 'public' key"
echo ""
read -p "Paste your anon key here: " ANON_KEY

if [ ! -z "$ANON_KEY" ]; then
    echo ""
    echo "Creating .env file..."
    cat > .env << EOF
VITE_SUPABASE_URL=$PROJECT_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
VITE_SUPABASE_PROJECT_ID=$PROJECT_REF
EOF
    echo "✓ .env file created successfully"
fi

echo ""
echo "========================================"
echo "Step 4: Configure Authentication"
echo "========================================"
echo ""
echo "Please complete these steps in the Supabase Dashboard:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/auth/url-configuration"
echo "2. Set Site URL to: https://openhamprep.app"
echo "3. Add redirect URLs:"
echo "   - https://openhamprep.app/auth"
echo "   - http://localhost:8080/auth"
echo ""
read -p "Press Enter when you've completed the auth configuration..."

echo ""
echo "========================================"
echo "Step 5: Set Up Initial Admin User"
echo "========================================"
echo ""
echo "After you sign up your first user, you'll need to grant them admin role."
echo "Run this SQL query in the Supabase SQL Editor:"
echo ""
echo "INSERT INTO public.user_roles (user_id, role)"
echo "VALUES ('your-user-uuid-here', 'admin');"
echo ""
echo "You can find your user UUID in Authentication > Users"
echo ""

echo "========================================"
echo "Migration Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Export data from Lovable Cloud (use admin bulk export)"
echo "2. Import data to new Supabase (use admin bulk import)"
echo "3. Test the application: npm run dev"
echo "4. Update production deployment with new credentials"
echo ""
echo "For detailed instructions, see: docs/SUPABASE_MIGRATION.md"
