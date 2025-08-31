#!/bin/bash

# Pokemon TCG Authority Bot - Quick Start Script

echo "🚀 POKEMON TCG AUTHORITY BOT LAUNCHER"
echo "====================================="
echo ""
echo "💰 Goal: Become the aixbt of Pokemon TCG"
echo "🎯 Target: $24,500/month in 6 months"
echo ""
echo "Choose launch mode:"
echo ""
echo "1) 🔥 FULL AUTHORITY MODE (Recommended)"
echo "   - Reply bot with real prices"
echo "   - Scheduled market posts"
echo "   - Live dashboard"
echo ""
echo "2) 💬 Reply Bot Only"
echo "   - Just replies with prices"
echo ""
echo "3) 📅 Scheduled Poster Only"
echo "   - Just market reports"
echo ""
echo "4) 🧪 Test Price Integration"
echo "   - Verify prices are working"
echo ""
echo "5) 📊 Check Price Database"
echo "   - See what cards we have"
echo ""

read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Launching FULL AUTHORITY MODE..."
        echo "Remember: Open Chrome and login to X.com first!"
        echo ""
        sleep 2
        node launch-authority-bot.js
        ;;
    2)
        echo ""
        echo "💬 Launching Reply Bot..."
        node pokemon-bot-contextual.js
        ;;
    3)
        echo ""
        echo "📅 Launching Scheduled Poster..."
        node scheduled-poster.js
        ;;
    4)
        echo ""
        echo "🧪 Testing Price Integration..."
        node test-price-integration.js
        ;;
    5)
        echo ""
        echo "📊 Checking Price Database..."
        node -e "const pe = require('./price-engine/index.js'); pe.initialize().then(() => { console.log('Cards loaded:', pe.aggregator.priceDatabase.size); pe.aggregator.priceDatabase.forEach((v,k) => console.log('  -', k, '$' + v.price?.toFixed(2))); })"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac