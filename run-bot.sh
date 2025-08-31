#!/bin/bash

echo "🚀 Starting Pokemon Bot v2..."
echo "================================"
echo ""
echo "✅ Using existing Chrome tab"
echo "✅ Account: @GlitchyGrade"
echo ""

# Set credentials (though it will use existing session)
# Load API key from environment or .env file
if [ -z "$GEMINI_API_KEY" ]; then
    if [ -f .env ]; then
        export $(cat .env | grep GEMINI_API_KEY | xargs)
    fi
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: GEMINI_API_KEY not set"
    echo "Please set GEMINI_API_KEY environment variable or create .env file"
    exit 1
fi
export TWITTER_USERNAME="GlitchyGrade"
export TWITTER_PASSWORD="$3xyTank1997"

# Enable Chrome remote debugging
echo "🔧 Enabling Chrome DevTools Protocol..."
echo "Make sure Chrome is running with: --remote-debugging-port=9222"
echo ""

# Run the bot
echo "🤖 Starting bot..."
echo "================================"
node pokemon-bot-contextual.js