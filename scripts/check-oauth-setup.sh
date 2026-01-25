#!/bin/zsh
# Google OAuth Environment Check Script

echo "🔍 Checking Google OAuth Environment Setup..."
echo ""

# Check .env.local file exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file found"
else
    echo "❌ .env.local file not found"
    exit 1
fi

echo ""
echo "📋 Checking required environment variables:"
echo ""

# Check GOOGLE_CLIENT_ID
if grep -q "GOOGLE_CLIENT_ID=" .env.local; then
    VALUE=$(grep "GOOGLE_CLIENT_ID=" .env.local | cut -d'=' -f2 | tr -d ' ')
    if [ -z "$VALUE" ]; then
        echo "⚠️  GOOGLE_CLIENT_ID is set but empty"
    else
        echo "✅ GOOGLE_CLIENT_ID is set"
        echo "   Value: ${VALUE:0:20}...${VALUE: -10}"
    fi
else
    echo "❌ GOOGLE_CLIENT_ID is NOT in .env.local"
fi

echo ""

# Check GOOGLE_CLIENT_SECRET
if grep -q "GOOGLE_CLIENT_SECRET=" .env.local; then
    VALUE=$(grep "GOOGLE_CLIENT_SECRET=" .env.local | cut -d'=' -f2 | tr -d ' ')
    if [ -z "$VALUE" ]; then
        echo "⚠️  GOOGLE_CLIENT_SECRET is set but empty"
    else
        echo "✅ GOOGLE_CLIENT_SECRET is set"
        echo "   Value: ${VALUE:0:20}...${VALUE: -10}"
    fi
else
    echo "❌ GOOGLE_CLIENT_SECRET is NOT in .env.local"
fi

echo ""
echo "📖 Setup Guide: GOOGLE_OAUTH_SETUP.md"
echo ""
echo "To configure Google OAuth:"
echo "1. Open GOOGLE_OAUTH_SETUP.md in your editor"
echo "2. Follow the step-by-step instructions"
echo "3. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local"
echo "4. Restart your development server"
