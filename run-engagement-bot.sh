#!/bin/bash

# Run Engagement Bot with Auto-Restart
# Keeps the bot running even if it crashes

echo "🚀 POKEMON TCG ENGAGEMENT BOT LAUNCHER"
echo "====================================="
echo ""

# Check if Chrome is running
if ! curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
    echo "❌ Chrome not found on port 9222"
    echo ""
    echo "Please start Chrome with:"
    echo "  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222"
    echo ""
    echo "Then log into Twitter/X manually first."
    exit 1
fi

echo "✅ Chrome detected"
echo "🤖 Starting engagement bot..."
echo ""

# Run bot with automatic restart
while true; do
    node pokemon-bot-contextual.js
    
    EXIT_CODE=$?
    echo ""
    echo "Bot exited with code: $EXIT_CODE"
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Bot completed successfully"
        break
    else
        echo "⚠️ Bot crashed, restarting in 30 seconds..."
        sleep 30
    fi
done