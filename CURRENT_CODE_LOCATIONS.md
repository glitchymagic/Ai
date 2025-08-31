# Current Code Locations - All Recent Edits

## Main Bot File
**Path:** `/Users/jonathan/pokemon-bot-v2/pokemon-bot-contextual.js`

### Recent Edits Made:

#### 1. Deterministic Response Generator (Lines 170-380)
- Replaced entire `generateContextualResponse` method
- Added StrategyPicker integration
- Removed all Math.random() decision gates

#### 2. Price Intent Guards (Lines 1405-1429)
```javascript
// Line 1406: GPT's stricter price-intent guard
shouldIncludeNumbers({ text, thread }) {
    // Artist/social showcase blocking
    // Price question detection
}

// Line 1422: Over-familiarity throttle  
shouldUseFamiliarTone(username) {
    // Requires 3+ interactions in 30 days
}
```

#### 3. Visual-First Showcase Logic (Lines 249-260)
```javascript
// Check if this is a showcase without price intent
const isShowcase = visualData?.analysis?.contentType === 'multiple_showcase'...
if (isShowcase && !numbersOk) {
    // Visual response only
}
```

#### 4. Enhanced DecisionTrace (Lines 342-366)
- Added `price_intent` and `suppressed_price` fields
- Added `rateLimiter` and `modelPath` tracking

#### 5. Thread-Aware Response Fix (Lines 115-160)
- Updated prompt to conditionally include stats
- Only shows prices when price intent detected

#### 6. Human Typing Enhancement (Lines 542-554)
- Added read-time pause before typing
- More natural interaction timing

## Feature Files

### 1. Anti-Scam Module
**Path:** `/Users/jonathan/pokemon-bot-v2/features/anti-scam.js`
- Added whitelist for legitimate phrases (Lines 4-14)
- Enhanced scam patterns (Lines 17-32)

### 2. Strategy Picker
**Path:** `/Users/jonathan/pokemon-bot-v2/features/strategy-picker.js`
- Deterministic strategy selection
- No RNG in decision paths

### 3. Authority Responses  
**Path:** `/Users/jonathan/pokemon-bot-v2/features/authority-responses.js`
- Seeded response selection
- generateAuthorityWithStats method

### 4. Timestamp Filter
**Path:** `/Users/jonathan/pokemon-bot-v2/features/timestamp-filter.js`
- Strict regex parsing: `/^(\d+)\s*h(ours?)?$/`
- No loose includes() checks

### 5. Search Engine
**Path:** `/Users/jonathan/pokemon-bot-v2/features/search-engine.js`
- Dynamic date calculation only
- No static operators (since:2024, geocode)

## Key Changes Summary

### From Original Upload → Current Working Code

1. **RNG Gates:** Had ~8 Math.random() gates → Now 0
2. **Raffle Handling:** Replied "good luck" → Now returns null
3. **Price Injection:** Always added stats → Now checks shouldIncludeNumbers()
4. **Thread Prompt:** Force "add 1 stat" → Conditional based on price intent
5. **Familiarity:** Unrestricted → Now requires 3+ prior interactions
6. **Visual Priority:** Price-first → Visual-first for showcases
7. **Decision Logging:** Basic → Enhanced with price_intent tracking

## Test Files Created
- `test-data-or-silence.js` - Validates price gating
- `test-anti-scam-demo.js` - Anti-scam filtering
- `test-raffle-skip.js` - Raffle null returns
- `test-price-intent.js` - GPT's shouldIncludeNumbers()
- `test-seeded-authority.js` - Deterministic responses

## The Current State
All edits are in the working copy at:
`/Users/jonathan/pokemon-bot-v2/pokemon-bot-contextual.js`

This is NOT the old uploaded version - this has all 50+ fixes including:
- Deterministic StrategyPicker
- Price intent guards
- Enhanced telemetry
- No RNG gates
- Proper raffle skipping