# Key Files for GPT Review

## 1. Main Bot File (REQUIRED)
`/Users/jonathan/pokemon-bot-v2/pokemon-bot-contextual.js`
- Has all the core logic and recent fixes
- Contains generateContextualResponse, shouldIncludeNumbers, etc.

## 2. Visual Analyzer (IMPORTANT - explains the misunderstanding)
`/Users/jonathan/pokemon-bot-v2/features/visual-analyzer.js`
- This is why bot thought tournament poster was a "card showcase"
- Needs GPT's eyes on the visual detection logic

## 3. Strategy Picker (IMPORTANT - deterministic routing)
`/Users/jonathan/pokemon-bot-v2/features/strategy-picker.js`
- Shows how strategies are selected
- No RNG, fully deterministic

## 4. Thread Context Extractor (CRITICAL - explains hallucination)
`/Users/jonathan/pokemon-bot-v2/features/advanced-context.js`
- Might explain why bot imagined "netdecking" conversation
- Thread scraping logic lives here

## 5. Anti-Scam (Good to show the whitelist approach)
`/Users/jonathan/pokemon-bot-v2/features/anti-scam.js`
- Shows the pattern matching for safety
- Includes the whitelist for legit phrases

## Optional but Helpful:
- `features/authority-responses.js` - Seeded responses
- `features/timestamp-filter.js` - Strict parsing
- `features/sentiment-analyzer.js` - Sentiment gates

## Test Results to Include:
- The tournament poster image
- Bot's response about netdecking
- Analysis showing the context mismatch

This gives GPT the full picture of:
1. What we fixed (price suppression working)
2. What's still broken (visual/context understanding)
3. Where the problems might be (visual analyzer, thread context)