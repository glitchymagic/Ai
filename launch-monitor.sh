#!/bin/bash

# Launch Monitor - Real-time bot monitoring

echo "🔍 Pokemon Bot v2 - Launch Monitor"
echo "================================="
echo ""

# Check environment
echo "📋 Environment Check:"
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY not set"
    exit 1
else
    echo "✅ GEMINI_API_KEY set"
fi

if [ -z "$TWITTER_USERNAME" ] || [ -z "$TWITTER_PASSWORD" ]; then
    echo "❌ Twitter credentials not set"
    exit 1
else
    echo "✅ Twitter credentials set"
fi

echo ""
echo "🚀 Starting bot with monitoring..."
echo "================================="

# Create monitoring pipes
LOGFILE="logs/bot-$(date +%Y%m%d-%H%M%S).log"
DECISION_LOG="logs/decisions-$(date +%Y%m%d).jsonl"

# Start bot with real-time monitoring
echo "📝 Logging to: $LOGFILE"
echo "📊 Decisions to: $DECISION_LOG"
echo ""

# Function to display stats
show_stats() {
    echo -e "\n📊 Current Stats:"
    if [ -f "$DECISION_LOG" ]; then
        TOTAL=$(wc -l < "$DECISION_LOG" 2>/dev/null || echo 0)
        REPLIES=$(grep -c '"action":"reply"' "$DECISION_LOG" 2>/dev/null || echo 0)
        SKIPS=$(grep -c '"action":"skip"' "$DECISION_LOG" 2>/dev/null || echo 0)
        PRICE_STRAT=$(grep -c '"strategy":"price"' "$DECISION_LOG" 2>/dev/null || echo 0)
        
        echo "• Total decisions: $TOTAL"
        echo "• Replies: $REPLIES"
        echo "• Skips: $SKIPS"
        echo "• Price strategy: $PRICE_STRAT"
    fi
}

# Trap to show stats on exit
trap show_stats EXIT

# Start the bot with output monitoring
node pokemon-bot-contextual.js 2>&1 | while IFS= read -r line; do
    # Log everything
    echo "$(date +%H:%M:%S) $line" | tee -a "$LOGFILE"
    
    # Highlight important events
    if echo "$line" | grep -q "💬 Reply sent"; then
        echo "🎯 REPLY SENT!" | tee -a "$LOGFILE"
        show_stats
    elif echo "$line" | grep -q "🚫"; then
        echo "⏭️ SKIP DETECTED: $line" | tee -a "$LOGFILE"
    elif echo "$line" | grep -q "Strategy:"; then
        echo "📋 $line" | tee -a "$LOGFILE"
    fi
done

echo ""
echo "Bot stopped. Final stats:"
show_stats