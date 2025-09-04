# Gemini API Usage Workflow & Token Count

## Complete Workflow When Bot Finds a Good Post

### 1. **Post Discovery Phase** (No Gemini calls)
- Bot searches Twitter/X using queries like "surging sparks", "#Pokemon"
- Collects tweets and filters by age, quality, spam detection
- Engagement selector decides whether to reply or like-only

### 2. **Visual Analysis Phase** (0-1 Gemini calls)
If the post has images or videos:
- **1 Vision API call** to analyze the image/video
- Identifies Pokemon cards, event posters, or other content
- ~300-500 tokens per call (image + prompt + response)

### 3. **Thread Context Gathering** (No Gemini calls)
- Opens tweet in new tab to get full conversation context
- Extracts previous messages in the thread
- No API calls - just DOM scraping

### 4. **Response Generation Phase** (1 Gemini call)
Two possible paths:

**Path A - Thread-Aware Response** (for social posts):
- **1 Gemini call** with thread context
- Prompt includes: thread history, visual analysis results, user message
- ~400-600 tokens total

**Path B - Authority Response** (for market/price questions):
- Uses local authority engine first (no Gemini)
- Falls back to **1 Gemini call** if needed
- ~300-400 tokens

### 5. **Authority Enhancement** (No Gemini calls)
- Enhances response with price data from local cache
- No additional API calls

## Total Gemini Calls Per Engagement

- **Minimum**: 1 call (text-only post)
- **Typical**: 2 calls (image post + response)
- **Maximum**: 2 calls (vision + response)

## Token Usage Breakdown

### Per Engagement:
- Vision API call: ~300-500 tokens
- Response generation: ~400-600 tokens
- **Total per reply**: ~700-1,100 tokens

### Daily Usage Estimate:
- Bot makes ~15 replies/hour when active
- If running 8 hours: ~120 replies/day
- **Daily tokens**: ~84,000 - 132,000 tokens

### Gemini Free Tier Limits:
- **15 requests per minute** (RPM)
- **1,000,000 tokens per day** (TPD)
- **1,500 requests per day** (RPD)

With 3 API keys rotating:
- 45 RPM combined
- 3,000,000 TPD combined
- 4,500 RPD combined

## Actual Workflow Example

```
User posts: "Just pulled a moonbreon! How much is it worth?" [with image]

1. Bot discovers post during search (0 API calls)
2. Vision API analyzes image → identifies "Umbreon VMAX Alt Art" (1 call, ~400 tokens)
3. Bot extracts price question intent (0 calls)
4. Authority engine generates response with price data (0 calls)
5. If authority fails, falls back to Gemini for response (1 call, ~500 tokens)

Total: 2 API calls, ~900 tokens
```

## Optimization Notes

The bot is quite efficient with API usage:
- Caches responses to avoid duplicate calls
- Uses local LLM fallback when available
- Authority system reduces Gemini dependency
- Smart filtering prevents wasted API calls on spam

Your 3 API keys provide plenty of capacity for 24/7 operation!