# 🚀 Final Ship Checklist - Pokemon Bot v2

## Pre-Launch Verification

### ✅ Determinism Locked
- [x] 0 RNG gates in decision paths
- [x] ValueScore controls engage/skip
- [x] StrategyPicker routes all responses
- [x] Authority responses seeded

### ✅ Security & Hygiene
- [x] 0 hardcoded API keys
- [x] 0 static search operators
- [x] 6 legacy files deleted
- [x] Environment variables only

### ✅ Quality Gates
- [x] Anti-scam with whitelist
- [x] Sentiment with sarcasm guards
- [x] Timestamp strict parsing
- [x] Data-or-silence enforced

### ✅ Observability
- [x] Enhanced DecisionTrace fields
- [x] Canary monitoring ready
- [x] Merge guard script active

## Launch Commands

```bash
# 1. Final merge guard check
./merge-guard.sh

# 2. Set environment variables
export GEMINI_API_KEY=your_key_here
export TWITTER_USERNAME=your_username
export TWITTER_PASSWORD=your_password

# 3. Run the bot
node pokemon-bot-contextual.js

# 4. Monitor (24h later)
node canary-monitor.js
```

## Platform Safety Config

### Rate Limits
- **15 replies/hour** max
- **80-90% like-only** ratio  
- **6-hour re-engage** cooldown
- **100 engagement** break points

### Bio Disclaimer
```
Not financial advice. Prices from public sales/pop data. 
Check before you buy. 🔍
```

## Post-Ship Monitoring

### 24h Canary Metrics
- Reply acceptance rate (target ≥90%)
- Replies with numbers (target ≥70%)
- Strategy distribution (fallback <20%)
- Average time to reply (2-5 min)
- Follow-through rate

### Red Flags to Watch
- Acceptance rate <80%
- Numeric replies <60%
- Fallback strategy >30%
- Any hardcoded key alerts
- Duplicate helper warnings

## Regression Prevention

### Before Any Merge
1. Run `./merge-guard.sh`
2. Check for old patterns:
   - RNG gates (Math.random() < 0.X)
   - Raffle replies ("good luck")
   - Static dates (since:2024)
   - Loose parsing (includes('h'))
   - Hardcoded keys (AIza...)

### CI/CD Integration
```yaml
# Add to .github/workflows/merge-check.yml
- name: Merge Guard
  run: |
    chmod +x merge-guard.sh
    ./merge-guard.sh
```

## The aixbt Vibe ✅

**Deterministic**: Same tweet → same strategy → same response type
**Context-aware**: Thread scraping, visual analysis, sentiment gates
**Data-first**: Stats or precise follow-ups, no vibes-only
**Anti-scam**: Community protection with smart whitelisting

## Final Status
- 🟢 Production ready
- 🟢 All GPT requirements met
- 🟢 Regression-proof safeguards
- 🟢 Monitoring in place

Ship it! 🚀