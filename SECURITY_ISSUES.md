# Security Issues to Fix Before Merge

## 1. Hardcoded API Key ⚠️
**File**: `run-bot.sh`
```bash
export GEMINI_API_KEY="AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw"
```

**Issue**: Exposed API key in repository
**Fix**: Use environment variables or `.env` file (gitignored)

```bash
# Fixed version:
export GEMINI_API_KEY="${GEMINI_API_KEY}"  # Read from environment
```

## 2. Temporary Test Files with Keys
**File**: `force-replies.js` (created during testing)
```javascript
env: { ...process.env, GEMINI_API_KEY: 'AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw' }
```

**Fix**: Delete test files before merge

## 3. RNG Still Present 🎲
Despite GPT's previous fixes, Math.random() still exists in:
- `features/engagement-selector.js` - Controls reply vs like decision
- `features/search-engine.js` - Random search strategies
- `features/enhanced-price-responses.js` - Random response templates
- `features/card-recognition.js` - Random grading advice (30% chance)
- `features/human-like-responses.js` - Multiple RNG decisions
- `features/response-variety.js` - Response type selection

**Critical Issue**: Engagement selector RNG makes bot behavior unpredictable

## 4. Raffle/Giveaway Responses
**Status**: Could not find "good luck everyone" response in current codebase
**Note**: May be in a different branch or removed

## 5. Other Security Considerations
- No `.env` file in repo (good)
- No other API keys found in JavaScript files
- Test files contain mock keys (should be cleaned up)

## Recommendations for Merge Guard
1. Block any file containing `AIzaSy` pattern
2. Block any file with hardcoded API keys
3. Require environment variable usage for all secrets
4. Add pre-commit hook to check for exposed keys
5. Scan for Math.random() in decision-critical paths

## Clean Up Commands
```bash
# Remove test files
rm force-replies.js force-test-responses.js test-*.js

# Remove backup files
find . -name "*.backup" -delete

# Check for any remaining keys
grep -r "AIzaSy" . --exclude-dir=node_modules --exclude-dir=.git
```