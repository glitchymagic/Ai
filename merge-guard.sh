#!/bin/bash

# Merge Guard - Prevents regression of old patterns
# Run this before any merge to ensure clean code

echo "🛡️ Running Merge Guard Checks..."
echo "================================"

FAILED=0

# 1. Check for RNG gates in decision logic
echo -n "1. RNG Decision Gates: "
RNG_COUNT=$(rg -n "Math\.random\(\).*<\s*0\." pokemon-bot-contextual.js 2>/dev/null | grep -v "sleep\|humanType\|random\|//" | wc -l)
if [ "$RNG_COUNT" -eq 0 ]; then
    echo "✅ Clean (0 found)"
else
    echo "❌ FAIL ($RNG_COUNT RNG gates found)"
    FAILED=1
fi

# 2. Check for raffle replies instead of skips
echo -n "2. Raffle Handling: "
RAFFLE_REPLY=$(grep -n "good luck everyone\|gl everyone" pokemon-bot-contextual.js 2>/dev/null | wc -l)
if [ "$RAFFLE_REPLY" -eq 0 ]; then
    echo "✅ Clean (returns null)"
else
    echo "❌ FAIL (still replying to raffles)"
    FAILED=1
fi

# 3. Check for hardcoded API keys
echo -n "3. Hardcoded Keys: "
KEY_COUNT=$(rg "AIza[a-zA-Z0-9_-]{35}" . --type js 2>/dev/null | grep -v "test-" | wc -l)
if [ "$KEY_COUNT" -eq 0 ]; then
    echo "✅ Clean (env only)"
else
    echo "❌ FAIL ($KEY_COUNT hardcoded keys found)"
    FAILED=1
fi

# 4. Check for static search operators
echo -n "4. Static Search Ops: "
STATIC_OPS=$(rg "since:2024|until:2024|geocode:40\." features/search-engine.js 2>/dev/null | wc -l)
if [ "$STATIC_OPS" -eq 0 ]; then
    echo "✅ Clean (dynamic only)"
else
    echo "❌ FAIL (static operators found)"
    FAILED=1
fi

# 5. Check for authority RNG
echo -n "5. Authority Seeding: "
AUTH_RNG=$(rg "Math\.random\(\)" features/authority-responses.js 2>/dev/null | grep -v "setSeed\|//" | wc -l)
if [ "$AUTH_RNG" -eq 0 ]; then
    echo "✅ Clean (seeded picks)"
else
    echo "❌ FAIL (RNG picks found)"
    FAILED=1
fi

# 6. Check for loose timestamp parsing
echo -n "6. Timestamp Strictness: "
LOOSE_TIME=$(grep -E "includes\(['\"]h['\"])|includes\(['\"]m['\"])" features/timestamp-filter.js 2>/dev/null | grep -v "//" | wc -l)
if [ "$LOOSE_TIME" -eq 0 ]; then
    echo "✅ Clean (strict regex)"
else
    echo "❌ FAIL (loose parsing found)"
    FAILED=1
fi

# 7. Check for double-escaped regex
echo -n "7. Regex Escaping: "
DOUBLE_ESCAPE=$(grep -E "\\\\\\\\d" features/timestamp-filter.js 2>/dev/null | wc -l)
if [ "$DOUBLE_ESCAPE" -eq 0 ]; then
    echo "✅ Clean (proper escapes)"
else
    echo "❌ FAIL (double escapes found)"
    FAILED=1
fi

# 8. Check for old truncation limits
echo -n "8. Tweet Clamping: "
OLD_TRUNCATE=$(grep -E "slice\(0,\s*1[45]0\)|substring\(0,\s*1[45]0\)" pokemon-bot-contextual.js 2>/dev/null | grep -v "//" | wc -l)
if [ "$OLD_TRUNCATE" -eq 0 ]; then
    echo "✅ Clean (280 limit)"
else
    echo "❌ FAIL (150/140 truncation found)"
    FAILED=1
fi

# 9. Check for duplicate helper definitions
echo -n "9. Helper Duplicates: "
for helper in "sleep" "random" "humanType" "checkRateLimit" "checkForBreak"; do
    COUNT=$(grep -n "async $helper\|function $helper" pokemon-bot-contextual.js 2>/dev/null | wc -l)
    if [ "$COUNT" -gt 1 ]; then
        echo "❌ FAIL ($helper defined $COUNT times)"
        FAILED=1
        break
    fi
done
if [ "$FAILED" -eq 0 ]; then
    echo "✅ Clean (no duplicates)"
fi

# 10. Check for ValueScore implementation
echo -n "10. ValueScore Gate: "
VALUESCORE=$(grep -c "computeValueScore" pokemon-bot-contextual.js 2>/dev/null)
OLD_GATE=$(grep -c "filterResult\.quality.*Math\.random" pokemon-bot-contextual.js 2>/dev/null)
if [ "$VALUESCORE" -gt 0 ] && [ "$OLD_GATE" -eq 0 ]; then
    echo "✅ Clean (deterministic)"
else
    echo "❌ FAIL (RNG gate present or ValueScore missing)"
    FAILED=1
fi

# 11. Decision clamp enforcer
echo -n "11. Clamp Enforcer: "
ADHOC_TRUNCATE=$(rg -n "length > 1[45]0|Max(imum)?\s+\d+\s+words" . -g '!node_modules' -g '!test-*' 2>/dev/null | wc -l)
if [ "$ADHOC_TRUNCATE" -eq 0 ]; then
    echo "✅ Clean (clampTweet only)"
else
    echo "❌ FAIL (ad hoc truncation found)"
    FAILED=1
fi

# 12. Deterministic authority picks
echo -n "12. Authority Determinism: "
AUTH_RANDOM=$(rg -n "Math\.random" features/authority-responses.js 2>/dev/null | wc -l)
if [ "$AUTH_RANDOM" -eq 0 ]; then
    echo "✅ Clean (seeded picks)"
else
    echo "❌ FAIL (Math.random in authority)"
    FAILED=1
fi

echo "================================"

if [ "$FAILED" -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED - Safe to merge!"
    exit 0
else
    echo "❌ MERGE BLOCKED - Fix issues above"
    exit 1
fi