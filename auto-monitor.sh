#!/bin/bash

# Auto-Monitor Script for Pokemon TCG Bot
# This runs the bot and auto-restarts if it crashes

echo "🤖 AUTO-MONITOR MODE ACTIVATED"
echo "================================"
echo "Bot will run continuously and restart if needed"
echo "Press Ctrl+C to stop completely"
echo ""

while true; do
    echo "🚀 Starting Pokemon TCG Authority Bot..."
    echo "Time: $(date)"
    echo ""
    
    # Run the bot
    node launch-authority-bot.js
    
    # If bot exits, wait before restarting
    echo ""
    echo "⚠️ Bot stopped at $(date)"
    echo "Restarting in 30 seconds..."
    echo "Press Ctrl+C now to stop completely"
    
    sleep 30
done