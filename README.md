# Pokemon TCG Twitter Bot v2

An advanced, human-like Twitter bot for Pokemon TCG collectors. Features natural language processing, context awareness, and anti-detection measures.

## Features

### 🎯 Core Capabilities
- **Human-like responses** - 87% natural language score
- **Context awareness** - Understands grading, values, stores, investments
- **Visual analysis** - Responds appropriately to images and videos
- **Memory system** - Remembers users and conversations
- **Anti-detection** - Advanced measures to avoid shadow bans

### 🤖 Response Modules
1. **Human-Like Responses** - Natural, casual collector language
2. **Advanced Context** - Ultra-specific card and market knowledge
3. **Visual Analyzer** - Image/video content understanding
4. **Conversation Tracker** - Thread-aware responses
5. **Knowledge Base** - Price tracking and terminology
6. **Content Filter** - Avoids toxic content

## Setup

### Prerequisites
- Node.js 18+
- Chrome/Chromium browser
- LM Studio (optional, for local AI)
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/glitchymagic/Ai.git
cd pokemon-bot-v2

# Install dependencies
npm install

# Configure API keys
# Edit pokemon-bot-contextual.js and add your Gemini API key
```

### LM Studio Setup (Recommended)
1. Download LM Studio
2. Load a model (recommended: Llama 3.2 3B or Qwen 2.5 7B)
3. Enable local server on port 1234
4. The bot will automatically detect and use it

## Usage

### Testing Mode
```bash
# Run response simulator to test without posting
node test-simulator.js
```

### Production Mode
```bash
# Start the bot (be careful - check shadow ban status first!)
node pokemon-bot-contextual.js
```

### Conservative Settings (Post Shadow Ban)
The bot includes ultra-conservative settings for recovery:
- 2-3 replies per hour maximum
- 5-15 minute waits between actions
- 80% like-only interactions

## File Structure

```
pokemon-bot-v2/
├── pokemon-bot-contextual.js      # Main bot logic
├── test-simulator.js               # Response testing
├── response-examples.js            # Example showcase
│
├── features/                       # Feature modules
│   ├── human-like-responses.js    # Natural language
│   ├── advanced-context.js        # Deep context extraction
│   ├── visual-analyzer.js         # Image/video analysis
│   ├── context-analyzer.js        # Context understanding
│   ├── conversation-checker.js    # Thread detection
│   ├── conversation-tracker.js    # Conversation memory
│   ├── memory.js                  # User memory system
│   ├── search-engine.js           # Search queries
│   ├── content-filter.js          # Content moderation
│   ├── lmstudio-ai.js            # LM Studio integration
│   ├── pokemon-culture.js         # Memes and slang
│   ├── card-knowledge.js          # Card database
│   ├── response-variety.js        # Response patterns
│   ├── thread-reader.js           # Thread context
│   └── natural-responses.js       # Natural templates
│
└── data/                           # Persistent data
    ├── users.json                  # User profiles
    ├── conversations.json          # Conversation history
    └── knowledge.json              # Learned knowledge

```

## Response Quality

### Example Responses
- **Amazing pull**: "brooo that's insane" / "no wayyyy 😭 congrats"
- **Grading question**: "psa been tough lately but worth a shot"
- **Value check**: "last i checked like $80-100ish"
- **Store help**: "target tues/thurs morning if ur lucky"
- **Bad luck**: "pain.. next box gonna hit tho"

### Quality Metrics
- **Natural**: 87% (human-like language)
- **Helpful**: 80% (provides value)
- **Specific**: 53% (includes details)

## Safety Features

### Shadow Ban Prevention
- Rate limiting (15 replies/hour max)
- Random wait times (30-60 seconds minimum)
- Human-like behavior patterns
- Content filtering for toxicity
- Duplicate reply prevention

### Recovery Mode
If shadow banned:
1. Stop bot immediately
2. Wait 24-48 hours minimum
3. Manual activity only for 1 week
4. Restart with ultra-conservative settings

## Development

### Adding New Features
1. Create module in `features/` directory
2. Import in main bot file
3. Add to response generation chain
4. Test with simulator first

### Testing
Always test new responses:
```bash
node test-simulator.js
```

## Important Notes

⚠️ **Shadow Ban Risk**: Twitter aggressively detects bots. Use at your own risk.

⚠️ **Rate Limits**: Never exceed 15 replies per hour, ideally keep to 2-3.

⚠️ **Manual First**: Always use account manually before running bot.

## Credits

Built with:
- Puppeteer for browser automation
- Google Gemini for AI responses
- LM Studio for local AI fallback
- Various Pokemon TCG community resources

## License

For educational purposes only. Use responsibly and in accordance with Twitter's Terms of Service.