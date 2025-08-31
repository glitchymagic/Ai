const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import features
const SearchEngine = require('./features/search-engine');
const Memory = require('./features/memory');
const LMStudioAI = require('./features/lmstudio-ai');
const ContentFilter = require('./features/content-filter');
const ConversationChecker = require('./features/conversation-checker');
const ConversationTracker = require('./features/conversation-tracker');
const PokemonCulture = require('./features/pokemon-culture');
const CardKnowledge = require('./features/card-knowledge');
const ResponseVariety = require('./features/response-variety');
const ContextAnalyzer = require('./features/context-analyzer');
const VisualAnalyzer = require('./features/visual-analyzer');
const AdvancedContextExtractor = require('./features/advanced-context');
const HumanLikeResponses = require('./features/human-like-responses');
const EngagementSelector = require('./features/engagement-selector');
const AuthorityResponses = require('./features/authority-responses');
const SentimentAnalyzer = require('./features/sentiment-analyzer');
const TimestampFilter = require('./features/timestamp-filter');
const HumanSearch = require('./features/human-search');
const priceEngine = require('./price-engine/index.js');
const EnhancedPriceResponses = require('./features/enhanced-price-responses');
const StrategyPicker = require('./features/strategy-picker');
const AntiScam = require('./features/anti-scam');
const DecisionTrace = require('./features/decision-trace');
const { buildThreadSnippet } = require('./features/thread-snippet');
const { composeResponse } = require('./features/response-composer');
const { detectEventFromText } = require('./features/event-detector');

puppeteer.use(StealthPlugin());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY environment variable is required');
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7,
    }
});

// Helper function to clamp tweets to 280 chars consistently
function clampTweet(s, max = 280) {
    const conf = (s.match(/Confidence:\s*\d{1,3}%/i) || [])[0];
    const body = conf ? s.replace(/Confidence:\s*\d{1,3}%/i, '').trim() : s.trim();
    const pad = conf ? (' ' + conf) : '';
    if ((body + pad).length <= max) return (body + pad);
    const words = body.split(/\s+/);
    let out = '';
    for (const w of words) { 
        if ((out + ' ' + w + pad).length > max) break; 
        out += (out ? ' ' : '') + w; 
    }
    return (out + pad).trim();
}

// Deterministic hash function for consistent randomness
function seededHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Deterministic pick from array using seed
function seededPick(arr, seed) {
    const hash = typeof seed === 'string' ? seededHash(seed) : seed;
    return arr[hash % arr.length];
}

// Strip market numbers when they shouldn't be shown
function stripMarketNumbers(s='') {
  return String(s)
    // money $12.34 / €12,34
    .replace(/[$€£]\s?\d[\d,\.]*/g, '')
    // percentages 15% / +15% WoW
    .replace(/[+\-]?\s?\d{1,3}\s?%(\s?\w+)?/gi, '')
    // time windows 7d / 30d / last 7 days / 24h
    .replace(/\b(7|14|30|60|90|365)\s?d\b/gi, '')
    .replace(/\b(12|24)\s?h\b/gi, '')
    .replace(/\blast\s?\d+\s?(d|days|hours|hrs|h)\b/gi, '')
    // volume counts: 100 sales / 100+ sold
    .replace(/\b\d{2,}\s?(sales|sold|listings)\b/gi, '')
    .replace(/\b\d{2,}\s?\+\s?(sales|sold|listings)\b/gi, '')
    .replace(/\b\s{2,}\b/g,' ')
    .trim();
}

// Clean up punctuation after stripping
function tidyPunctuation(s='') {
  return String(s)
    .replace(/\(\s*\)/g, '')          // remove empty ()
    .replace(/\s+,/g, ',')            // no space before commas
    .replace(/,\s*(,|\.)/g, '$1')     // no double punctuation
    .replace(/\s{2,}/g, ' ')          // collapse spaces
    .replace(/\s+([?!.,;:])/g, '$1')  // no space before punctuation
    .trim();
}

class ContextualPokemonBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.replyCount = 106; // Continue from where we left off
        this.repliedUsers = new Set();
        this.startTime = Date.now();
        
        // Initialize features
        this.searchEngine = new SearchEngine();
        this.memory = new Memory();
        this.lmStudioAI = new LMStudioAI();
        this.contentFilter = new ContentFilter();
        this.pokemonCulture = new PokemonCulture();
        this.cardKnowledge = new CardKnowledge();
        this.responseVariety = new ResponseVariety();
        this.contextAnalyzer = new ContextAnalyzer();
        this.advancedContext = new AdvancedContextExtractor();
        this.humanLike = new HumanLikeResponses();
        this.engagementSelector = new EngagementSelector();
        this.authorityResponses = new AuthorityResponses();
        this.sentimentAnalyzer = new SentimentAnalyzer();
        this.timestampFilter = new TimestampFilter();
        this.humanSearch = new HumanSearch();
        this.priceResponses = new EnhancedPriceResponses();
        this.visualAnalyzer = null; // Will initialize after page is ready
        this.conversationChecker = null; // Will initialize after page is ready
        this.conversationTracker = new ConversationTracker();
        this.strategyPicker = new StrategyPicker();
        this.antiScam = new AntiScam();
        this.decisionTrace = new DecisionTrace();
        
        // Initialize price engine
        this.priceEngineReady = false;
        priceEngine.initialize().then(() => {
            this.priceEngineReady = true;
            console.log('   💰 Price engine ready with real-time data');
        }).catch(err => {
            console.log('   ⚠️ Price engine init failed:', err.message);
        });
        
        this.geminiFailures = 0;
        
        // Rate limiting
        this.sessionStartTime = Date.now();
        this.repliesThisHour = [];
        this.lastBreakReplyCount = this.replyCount;
        
        // Stats
        this.stats = {
            postsAnalyzed: 0,
            postsFiltered: 0,
            successfulEngagements: 0
        };
    }

    async generateThreadAwareResponse(username, latestMessage, threadContext) {
        // Build comprehensive context from thread
        let contextSummary = `Thread has ${threadContext.threadLength} messages about ${threadContext.mainTopic}.\n`;
        
        // Include key conversation points
        if (threadContext.fullConversation.length > 1) {
            contextSummary += "Previous discussion:\n";
            // Get last 3 messages before the current one
            const previousMsgs = threadContext.fullConversation.slice(-4, -1);
            previousMsgs.forEach(msg => {
                const snippet = msg.text.length > 60 ? msg.text.substring(0, 57) + "..." : msg.text;
                contextSummary += `- @${msg.username}: "${snippet}"\n`;
            });
        }
        
        // Try Gemini with thread context
        if (this.geminiFailures < 5) {
            try {
                // Use top-level model instance
                
                // Check if there's price intent in the message
                const isPriceRelated = /\b(worth|price|value|how much|going for|\$|cost|sell|buy|market)\b/i.test(latestMessage);
                
                const prompt = `
You're replying in a Pokémon TCG thread. Use the context + numbers below. One tweet only, <=280 chars.
Rules: ${isPriceRelated ? 'add 1 stat (price/Δ%/n sales) if available;' : 'focus on the topic without price stats;'} reference the convo; no hashtags; light Gen-Z tone; end crisp.

Context: Thread=${threadContext.threadLength}, Topic=${threadContext.mainTopic}
Recent:
${threadContext.fullConversation.slice(-3).map(m => `• @${m.username}: ${m.text.slice(0,80)}`).join('\n')}

Latest from @${username}: "${latestMessage}"

Reply:
`.trim();

                const result = await model.generateContent(prompt);
                let response = result.response.text().trim()
                    .replace(/^[\"']|[\"']$/g, '')
                    .replace(/#\w+/g, '')
                    .split('\n')[0]
                    .trim();
                
                // Use clampTweet for consistent handling
                response = clampTweet(response, 280);
                
                console.log(`   🧵 [Thread-aware] "${response}"`);
                return response;
                
            } catch (error) {
                console.log(`   ⚠️ Thread response failed, using regular response`);
            }
        }
        
        // Fallback to regular response
        return this.generateContextualResponse(username, latestMessage, threadContext.hasImages);
    }

    // Deterministic Response Generator
    async generateContextualResponse(username, tweetContent, hasImages = false, visualData = null) {
        // 0) Sentiment + anti-scam hard gates
        const sentiment = this.sentimentAnalyzer.analyzeSentiment(tweetContent);
        console.log(`   📊 Sentiment: ${sentiment.sentiment} (${sentiment.confidence}) - ${sentiment.reason}`);
        
        const sentimentGate = this.sentimentAnalyzer.shouldEngageWithSentiment(sentiment);
        if (!sentimentGate.engage) {
            console.log(`   🚫 Skipping due to sentiment: ${sentimentGate.reason}`);
            return null;
        }

        const scam = this.antiScam.shouldSkip(tweetContent, username);
        if (scam.skip) { 
            console.log(`   🚫 Anti-scam skip: ${scam.reason}`); 
            return null; 
        }

        // Check for raffles
        const textLower = tweetContent.toLowerCase();
        const isRaffle = textLower.includes('spot') && textLower.includes('$') ||
                        textLower.includes('raffle') || textLower.includes('break') ||
                        textLower.includes('giveaway') || textLower.includes('retweet to enter');
        
        if (isRaffle) {
            console.log(`   🎲 [Raffle/Giveaway] Skipping`);
            return null;
        }

        // 1) Features for strategy
        // Enhanced price intent detection
        const explicitPriceQ = /\b(worth|price|value|how much|going for|cost|market)\b/i.test(textLower);
        const implicitPriceQ = /\b(pulled|got|hit|found|mail\s*day|pickup|haul)\b/i.test(textLower) && 
                              /\b(rare|chase|grail|fire|insane|crazy|vmax|alt\s*art|secret)\b/i.test(textLower);
        const isPriceQ = explicitPriceQ || (implicitPriceQ && hasImages);
        const ents = this.extractCardEntities(tweetContent);
        const cardEntities = ents;
        const threadLen = visualData?.threadContext?.threadLength || 0;
        const hasStats = !!(this.priceEngineReady && ents.length > 0);
        
        // Check if this is an event/tournament post
        const isEventLike = (visualData?.analysis?.contentType === 'event_poster') || 
                           (visualData?.analysis?.contentType === 'artist_meet') ||
                           (visualData?.isEventPoster) ||
                           (visualData?.isArtistMeet);
        const eventDetails = this.advancedContext?.extractEventDetails?.(tweetContent);
        const hardNoNumbers = !!(isEventLike || eventDetails?.isEvent);
        
        // Check if we should include numbers (GPT's guard)
        let numbersOk = this.shouldIncludeNumbers({ 
            text: tweetContent, 
            thread: visualData?.threadContext 
        });
        
        // Enforce: no numbers for event/artist posts unless explicitly asked
        if (hardNoNumbers && !isPriceQ) {
            numbersOk = false;
        }
        
        const isShowingOff = textLower.includes('pull') || textLower.includes('got') || 
                            textLower.includes('finally') || textLower.includes('grail') ||
                            (hasImages && (textLower.includes('collection') || textLower.includes('mail')));
        
        // Calculate ValueScore for features
        function computeValueScore(isPriceQ, cardEntities, timestampRecent, hasImages, quality) {
            let s = 0;
            if (isPriceQ && cardEntities.length > 0) s += 3;
            if (timestampRecent) s += 2;
            if (hasImages) s += 1;
            if (quality >= 2) s += 1;
            return s;
        }
        
        const valueScore = computeValueScore(
            isPriceQ, 
            cardEntities, 
            visualData?.timestampReason === 'recent_post',
            hasImages,
            2 // default quality since we passed sentiment/scam gates
        );
        
        const feats = {
            isPriceQ, 
            hasStats, 
            hasImages, 
            cardEntities,
            valueScore,
            threadDepth: threadLen,
            sentiment: sentiment.sentiment,
            isShowingOff,
            hasVisualData: !!visualData
        };

        // Check if this is a showcase without price intent
        const isShowcase = visualData?.analysis?.contentType === 'multiple_showcase' || 
                          visualData?.analysis?.contentType === 'showcase';
        
        if (isShowcase && !numbersOk) {
            // Visual-first for showcases without price intent
            console.log('   🖼️ Showcase detected without price intent - visual response only');
            const visualResponse = this.visualAnalyzer?.generateVisualResponse(tweetContent, visualData);
            if (visualResponse) {
                return clampTweet(visualResponse, 280);
            }
        }
        
        // Build thread context with snippet
        const threadContext = visualData?.threadContext || null;
        const snippet = buildThreadSnippet(threadContext);
        const enhancedThreadContext = threadContext ? { ...threadContext, snippet } : null;

        // Check if this is an event (tournament, locals, etc)
        const isEvent = detectEventFromText(tweetContent).isEvent
            || visualData?.analysis?.contentType === 'event_poster'
            || visualData?.isEventPoster === true;
        
        // Handle explicit price questions separately (keep existing price logic)
        if (isPriceQ && numbersOk && this.priceEngineReady && cardEntities.length > 0) {
            const priceResponse = await this.generatePriceAwareResponse(tweetContent, username, hasImages);
            if (priceResponse) {
                console.log(`   💰 [Price] "${priceResponse}"`);
                return clampTweet(priceResponse, 280);
            }
        }

        // Use the new composer for all other responses
        const composedResponse = composeResponse({
            text: tweetContent,
            hasImages,
            threadContext: enhancedThreadContext,
            isEvent,
            authorityFn: ({ text, hasImages, intents }) => {
                // Wrap existing authority to ensure non-null and respect numbersOk
                const auth = this.authorityResponses.generateAuthorityResponse(text, hasImages);
                
                if (!numbersOk || isEvent) {
                    // Strip any prices/numbers from authority response when not allowed
                    const cleanAuth = auth ? tidyPunctuation(stripMarketNumbers(auth)) : null;
                    return {
                        primary: cleanAuth || 'Focus on centering/surfaces; solds > listings.',
                        secondary: '',
                        confidence: 0.65
                    };
                }
                
                return {
                    primary: auth || 'Check recent solds, not just listings.',
                    secondary: '',
                    confidence: auth ? 0.8 : 0.6
                };
            }
        });

        let response = composedResponse.text;
        const strategy = { 
            strategy: composedResponse.meta.mode === 'event' ? 'event' : 'composed',
            confidence: 'high',
            reason: composedResponse.meta.mode === 'event' ? 'event detected' : 'authority + context'
        };
        
        console.log(`   🎛️ Strategy: ${strategy.strategy} (${strategy.confidence}) - ${strategy.reason}`);

        // Log decision trace with comprehensive fields
        if (this.decisionTrace && response) {
            const tweetId = visualData?.tweetId || seededHash(tweetContent);
            const statPresent = response && (response.includes('7d') || response.includes('30d') || response.includes('last'));
            
            await this.decisionTrace.logDecision({
                tweetId,
                username,
                tweetText: tweetContent,
                decision: { engage: true, action: 'reply', score: feats.valueScore },
                features: {
                    ageDescription: visualData?.ageDescription || 'N/A',
                    timestampReason: visualData?.timestampReason || 'N/A',
                    sentiment: sentiment.sentiment,
                    sentimentConfidence: sentiment.confidence,
                    isPriceQ,
                    cardEntities: cardEntities,
                    hasImages,
                    hasStats: statPresent,
                    valueScore: feats.valueScore,
                    stat_present: statPresent,
                    used_authority_with_stats: strategy.strategy === 'composed' && statPresent,
                    anti_scam: 'passed',
                    timestamp_reason: visualData?.timestampReason || 'unknown_age',
                    engagementType: 'reply',
                    source: visualData?.source || 'search',
                    searchQuery: visualData?.searchQuery || 'N/A',
                    rateLimiter: {
                        repliesThisHour: this.repliesThisHour.length,
                        minutesToReset: 60 - (new Date().getMinutes())
                    },
                    modelPath: 'composed',
                    price_intent: numbersOk ? 'present' : 'absent',
                    suppressed_price: isShowcase && !numbersOk ? true : false,
                    numbersSuppressed: hardNoNumbers && !isPriceQ,
                    suppressionReason: hardNoNumbers ? 'event_or_artist_post' : 'none',
                    contentType: visualData?.analysis?.contentType || 'unknown',
                    eventDetails: eventDetails || null,
                    isEvent: isEvent,
                    intents: composedResponse.meta.intents
                },
                strategy: strategy,
                response,
                // Additional context fields
                eventDetails: eventDetails,
                numbersSuppressed: hardNoNumbers && !isPriceQ,
                priceIntent: numbersOk ? 'allowed' : 'suppressed',
                familiarityScore: this.memory.getUser(username.toLowerCase())?.interactionCount || 0,
                threadContext: enhancedThreadContext || null
            });
        }

        if (!response) {
            console.log(`   ❌ No response from ${strategy.strategy} strategy`);
            
            // Try AI models as last resort
            response = await this.tryAIModels(username, tweetContent, hasImages, feats);
        }

        // Apply thread truth gate before returning
        if (response) {
            response = this.sanitizeAgainstThread(response, visualData?.threadContext);
        }
        
        return response ? clampTweet(response, 280) : null;
    }
    
    // Thread Truth Gate - prevent hallucinated context
    sanitizeAgainstThread(response, threadContext) {
        if (!response) return response;
        const text = response.toLowerCase();
        
        // Only allow "thread" claims if threadContext exists and actually deep
        if (/\bthread(s)?\b/.test(text)) {
            const depth = threadContext?.threadLength || 0;
            if (depth < 2) {
                // Remove thread claims if not actually in a deep thread
                response = response.replace(/.*thread[^.?!]*[.?!]\s*/gi, '').trim();
            }
        }
        
        // Only mention topic words if present in thread text
        const safeTopics = ['netdecking', 'pricing', 'grading', 'restock', 'tournament', 'artist'];
        const threadBlob = (threadContext?.fullConversation || []).map(m => (m.text || '').toLowerCase()).join(' ');
        
        for (const topic of safeTopics) {
            if (text.includes(topic) && !threadBlob.includes(topic)) {
                // Remove sentences containing topics not actually in thread
                response = response.replace(new RegExp(`[^.?!]*${topic}[^.?!]*[.?!]\\s*`, 'gi'), '').trim();
            }
        }
        
        return response || null;
    }
    
    async tryAIModels(username, tweetContent, hasImages, features) {
        if (this.geminiFailures < 5) {
            try {
                const prompt = `Pokemon TCG expert. @${username}: "${tweetContent}"
${hasImages ? 'With image.' : ''}
Be specific and knowledgeable. Concise. No hashtags.`;
                
                const result = await model.generateContent(prompt);
                let response = result.response.text().trim()
                    .replace(/^[\"']|[\"']$/g, '')
                    .replace(/#\w+/g, '')
                    .split('\n')[0]
                    .trim();
                
                console.log(`   🤖 [Gemini] "${response}"`);
                this.geminiFailures = 0;
                return clampTweet(response, 280);
            } catch (error) {
                this.geminiFailures++;
                console.log(`   ⚠️ Gemini failed`);
            }
        }
        
        if (this.lmStudioAI.available) {
            try {
                const messages = [{
                    role: "system",
                    content: "Pokemon TCG expert. Concise, specific. No hashtags."
                }, {
                    role: "user",
                    content: `@${username}: "${tweetContent}". ${hasImages ? 'With image.' : ''} Reply:`
                }];
                
                const response = await this.lmStudioAI.generateDirectResponse(messages);
                if (response) {
                    console.log(`   🤖 [LM Studio] "${response}"`);
                    return response;
                }
            } catch (error) {
                console.log(`   ⚠️ LM Studio error: ${error.message}`);
            }
        }
        
        return null;
    }
    
    async generateFallbackResponse(tweetContent, hasImages) {
        const textLower = tweetContent.toLowerCase();
        
        // Extract key information from tweet
        const cards = this.extractCardNames(textLower);
        const prices = this.extractPrices(textLower);
        const isQuestion = tweetContent.includes('?');
        
        // Determine context and respond appropriately
        if (cards.length > 0) {
            const card = cards[0];
            
            // Try to get real price data if available
            if (this.priceEngineReady) {
                const priceData = await priceEngine.getQuickPrice(card);
                if (priceData) {
                    const priceStr = priceEngine.formatPriceResponse(priceData, 'casual');
                    
                    if (textLower.includes('pull') || textLower.includes('pulled')) {
                        return `${card} is straight fire, ${priceStr} raw`;
                    } else if (prices.length > 0) {
                        return `${prices[0]} for ${card}? market's at ${priceStr}`;
                    } else if (textLower.includes('grade') || textLower.includes('psa')) {
                        return `that ${card} def PSA 10 worthy, ${priceStr} raw rn`;
                    } else {
                        return `${card} goes hard, ${priceStr} market`;
                    }
                }
            }
            
            // Fallback without price
            if (textLower.includes('pull') || textLower.includes('pulled')) {
                return `${card} is straight fire ngl`;
            } else if (prices.length > 0) {
                return `${prices[0]} for ${card}? not bad tbh`;
            } else if (textLower.includes('grade') || textLower.includes('psa')) {
                return `that ${card} def PSA 10 worthy if centering's good`;
            } else {
                return `${card} goes hard fr`;
            }
        }
        
        if (textLower.includes('mail day') || textLower.includes('mailday')) {
            return hasImages ? "sheesh mail day W" : "mail day hits different, whatd you get?";
        }
        
        if (textLower.includes('collection') || textLower.includes('binder')) {
            return "collection goes crazy ngl";
        }
        
        if (isQuestion) {
            if (textLower.includes('worth') || textLower.includes('value')) {
                return "check tcgplayer, prices been wild lately";
            } else if (textLower.includes('real') || textLower.includes('fake')) {
                return "texture test never lies, check the holo pattern";
            } else {
                return "good question tbh";
            }
        }
        
        // Generic but still Pokemon-relevant
        return hasImages ? "those are heat fr" : "W post";
    }
    
    extractCardNames(text) {
        const cards = [];
        const cardPatterns = [
            /charizard/gi, /pikachu/gi, /moonbreon/gi, /umbreon/gi,
            /rayquaza/gi, /lugia/gi, /mewtwo/gi, /gengar/gi,
            /blaziken/gi, /gyarados/gi, /dragonite/gi, /garchomp/gi,
            /sylveon/gi, /leafeon/gi, /glaceon/gi, /vaporeon/gi
        ];
        
        for (const pattern of cardPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                cards.push(matches[0]);
            }
        }
        
        return cards;
    }
    
    extractPrices(text) {
        const prices = [];
        const pricePattern = /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
        let match;
        
        while ((match = pricePattern.exec(text)) !== null) {
            prices.push(match[0]);
        }
        
        return prices;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async random(min, max) {
        // Use deterministic value based on current state
        const seed = `${this.replyCount}|${Date.now()}`;
        const hash = seededHash(seed);
        const range = max - min + 1;
        return min + (hash % range);
    }

    async checkRateLimit() {
        // Clean up old entries (older than 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.repliesThisHour = this.repliesThisHour.filter(time => time > oneHourAgo);
        
        // Check if we've hit the rate limit (15 replies per hour)
        if (this.repliesThisHour.length >= 15) {
            const oldestReply = Math.min(...this.repliesThisHour);
            const timeSinceOldest = Date.now() - oldestReply;
            const waitTime = (60 * 60 * 1000) - timeSinceOldest;
            
            if (waitTime > 0) {
                console.log(`\n⚠️ RATE LIMIT: ${this.repliesThisHour.length} replies in last hour`);
                console.log(`   ⏰ Waiting ${Math.ceil(waitTime / 60000)} minutes...`);
                await this.sleep(waitTime);
                this.repliesThisHour = []; // Reset after waiting
            }
        }
    }

    async checkForBreak() {
        // Take a break every 20 replies
        const repliesSinceBreak = this.replyCount - this.lastBreakReplyCount;
        
        if (repliesSinceBreak >= 20) {
            const breakTime = await this.random(5 * 60 * 1000, 10 * 60 * 1000); // 5-10 minutes
            console.log(`\n☕ BREAK TIME: Taking ${Math.floor(breakTime / 60000)} minute break after ${repliesSinceBreak} replies`);
            console.log(`   📊 Total replies: ${this.replyCount}`);
            console.log(`   💤 Resting to avoid detection...\n`);
            
            await this.sleep(breakTime);
            this.lastBreakReplyCount = this.replyCount;
            console.log(`   ✅ Break complete, resuming...\n`);
        }
    }

    async humanType(element, text) {
        await element.click();
        await this.sleep(500);
        
        // Add read time pause before typing (GPT's micro-polish)
        const readTimeMs = Math.min(4000, 60 * text.length);
        await this.sleep(readTimeMs * 0.5, readTimeMs);
        
        for (let char of text) {
            await this.page.keyboard.type(char);
            await this.sleep(await this.random(40, 80));
        }
    }

    async checkAndReplyToConversations() {
        try {
            console.log('\n💬 Checking for conversation replies...');
            const conversations = await this.conversationChecker.checkForReplies();
            
            if (conversations.length === 0) {
                console.log('   No new conversation replies found');
                return;
            }
            
            let newConversations = 0;
            
            for (const conv of conversations.slice(0, 5)) { // Check up to 5
                const { data } = conv;
                
                // Check if we've already processed this conversation
                if (await this.conversationTracker.hasProcessed(data.tweetId)) {
                    console.log(`   ⏭️ Already replied to @${data.username}'s tweet`);
                    continue;
                }
                
                // Stop after 2 new conversations
                if (newConversations >= 2) break;
                
                console.log(`   🎯 Found NEW reply from @${data.username}: "${data.tweetText.substring(0, 50)}..."`);
                
                // Navigate to the reply (this now includes thread context)
                const tweetElement = await this.conversationChecker.navigateToReply(data);
                if (!tweetElement) continue;
                
                // Generate thread-aware conversational response
                let response;
                if (data.threadContext) {
                    // Use full thread context for better response
                    response = await this.generateThreadAwareResponse(
                        data.username,
                        data.tweetText,
                        data.threadContext
                    );
                } else {
                    // Fallback to regular response
                    response = await this.generateContextualResponse(
                        data.username,
                        data.tweetText,
                        false
                    );
                }
                
                if (!response) continue;
                
                // Reply to continue conversation
                const success = await this.replyToTweet(tweetElement, response);
                if (success) {
                    this.replyCount++;
                    newConversations++;
                    this.repliesThisHour.push(Date.now()); // Track for rate limiting
                    console.log(`   ✅ Continued conversation! [${this.replyCount}/1000]`);
                    
                    // Mark as processed
                    await this.conversationTracker.markAsProcessed(data.tweetId, data.username, data.tweetText);
                    
                    // Update memory
                    await this.memory.rememberUser(data.username, data.tweetText);
                    await this.memory.saveUsers();
                    
                    // Check if we need a break
                    await this.checkForBreak();
                    
                    // Check rate limit
                    await this.checkRateLimit();
                }
                
                await this.sleep(3000);
            }
            
            if (newConversations > 0) {
                console.log(`   📊 Processed ${newConversations} new conversations`);
                await this.conversationTracker.save();
            }
            
            // Navigate back to search
            console.log('   📍 Returning to search...\n');
            
        } catch (error) {
            console.log(`   ❌ Conversation check error: ${error.message}\n`);
        }
    }

    async replyToTweet(tweetElement, response) {
        try {
            // Click reply button
            const replyButton = await tweetElement.$('button[data-testid="reply"]');
            if (!replyButton) return false;
            
            await replyButton.click();
            await this.sleep(3000);
            
            const replyBox = await this.page.waitForSelector(
                'div[data-testid="tweetTextarea_0"]',
                { timeout: 10000 }
            ).catch(() => null);
            
            if (!replyBox) {
                await this.page.keyboard.press('Escape');
                return false;
            }
            
            await this.humanType(replyBox, response);
            await this.sleep(2000);
            
            // Send
            const sent = await this.page.evaluate(() => {
                const btn = document.querySelector('button[data-testid="tweetButton"]');
                if (btn && !btn.disabled) {
                    btn.click();
                    return true;
                }
                return false;
            });
            
            if (!sent) {
                await this.page.keyboard.down('Meta');
                await this.page.keyboard.press('Enter');
                await this.page.keyboard.up('Meta');
            }
            
            await this.sleep(3000);
            return true;
            
        } catch (error) {
            console.log(`   ❌ Reply error: ${error.message}`);
            return false;
        }
    }

    async init() {
        console.log('🚀 Pokemon TCG Bot - CONTEXTUAL VERSION');
        console.log('========================================');
        console.log('✅ Context-aware responses');
        console.log('✅ Actually reads tweets');
        console.log('✅ Specific, not generic');
        console.log('✅ Content filtering\n');
        
        await this.memory.initialize();
        await this.conversationTracker.initialize();
        
        // Load previously replied users into our Set
        for (const [username, userData] of this.memory.users.entries()) {
            if (userData.interactionCount > 0) {
                this.repliedUsers.add(username.toLowerCase());
            }
        }
        console.log(`   📝 Loaded ${this.repliedUsers.size} previously replied users`);
        
        try {
            console.log('🔌 Connecting to Chrome...');
            this.browser = await puppeteer.connect({
                browserURL: 'http://127.0.0.1:9222',
                defaultViewport: null
            });
            
            const pages = await this.browser.pages();
            for (const page of pages) {
                const url = page.url();
                if (url.includes('x.com') || url.includes('twitter.com')) {
                    this.page = page;
                    console.log(`✅ Connected to X.com\n`);
                    break;
                }
            }
            
            if (!this.page && pages.length > 0) {
                this.page = pages[0];
                await this.page.goto('https://x.com/home', { 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                });
            }
            
            // Initialize conversation checker now that page is ready
            if (this.page) {
                this.conversationChecker = new ConversationChecker(this.page);
                this.visualAnalyzer = new VisualAnalyzer(this.page);
                console.log('💬 Conversation checker initialized');
            }
            
            return !!this.page;
            
        } catch (error) {
            console.log('❌ Connection error:', error.message);
            return false;
        }
    }

    async checkPageHealth() {
        try {
            // Check if page is still connected
            const isConnected = this.page && !this.page.isClosed();
            if (!isConnected) {
                console.log('⚠️ Page disconnected, reconnecting...');
                return await this.init();
            }
            
            // Check if we're still on X/Twitter
            const url = this.page.url();
            if (!url.includes('x.com') && !url.includes('twitter.com')) {
                console.log('⚠️ Not on X.com, navigating back...');
                await this.page.goto('https://x.com/home', {
                    waitUntil: 'domcontentloaded',
                    timeout: 20000
                }).catch(() => {});
                await this.sleep(3000);
            }
            
            return true;
        } catch (error) {
            console.log('⚠️ Page health check failed:', error.message);
            return false;
        }
    }

    async processTimeline() {
        console.log('🔍 Starting contextual engagement...\n');
        
        let searchCounter = 0;
        let errorCount = 0;
        
        while (this.replyCount < 1000) {
            try {
                // Check page health every 10 searches
                if (searchCounter % 10 === 0) {
                    const healthy = await this.checkPageHealth();
                    if (!healthy) {
                        console.log('⚠️ Page unhealthy, attempting recovery...');
                        await this.sleep(10000);
                        continue;
                    }
                }
                
                // Reset error count on successful iteration
                if (errorCount > 0 && searchCounter % 5 === 0) {
                    errorCount = 0;
                }
                
                // Check for conversation replies every 7 searches
                if (searchCounter > 0 && searchCounter % 7 === 0 && this.conversationChecker) {
                    await this.checkAndReplyToConversations();
                }
                
                const query = this.searchEngine.getTrendingSearch();
                console.log(`📍 Searching: "${query}"`);
                searchCounter++;
                
                // Perform human-like search instead of direct URL navigation
                let navigationSuccess = false;
                for (let navRetry = 0; navRetry < 3; navRetry++) {
                    try {
                        navigationSuccess = await this.humanSearch.performSearch(this.page, query);
                        if (navigationSuccess) break;
                    } catch (searchError) {
                        console.log(`⚠️ Human search attempt ${navRetry + 1} failed: ${searchError.message}`);
                        if (navRetry === 2) {
                            // Final fallback to direct navigation
                            console.log('⚠️ Falling back to direct URL navigation');
                            try {
                                await this.page.goto(`https://x.com/search?q=${encodeURIComponent(query)}&f=live`, {
                                    waitUntil: 'domcontentloaded',
                                    timeout: 20000
                                });
                                navigationSuccess = true;
                            } catch (fallbackError) {
                                console.log('⚠️ Even fallback navigation failed');
                            }
                        }
                        await this.sleep(3000);
                    }
                }
                
                if (!navigationSuccess) {
                    console.log('⚠️ Could not navigate, checking current page...');
                    const currentUrl = this.page.url();
                    if (!currentUrl.includes('x.com')) {
                        // Try to recover by going to home first
                        await this.page.goto('https://x.com/home', {
                            waitUntil: 'domcontentloaded',
                            timeout: 20000
                        }).catch(() => {});
                        await this.sleep(3000);
                    }
                    continue;  // Skip this search iteration
                }
                
                await this.sleep(await this.random(5000, 8000));
                
                // Collect all tweets we can see with scrolling
                const seenTweets = [];
                const processedTweetIds = new Set();
                
                console.log(`📊 Collecting tweets for engagement analysis...`);
                
                for (let scroll = 0; scroll < 5; scroll++) {
                    const tweets = await this.page.$$('article[data-testid="tweet"]');
                    
                    // Add only new tweets
                    for (const tweet of tweets) {
                        const tweetId = await tweet.evaluate(el => {
                            const link = el.querySelector('a[href*="/status/"]');
                            // Use element position as fallback ID
                            const rect = el.getBoundingClientRect();
                            return link?.href || `tweet-${rect.top}-${rect.left}`;
                        });
                        
                        if (!processedTweetIds.has(tweetId)) {
                            processedTweetIds.add(tweetId);
                            seenTweets.push(tweet);
                        }
                    }
                    
                    // Scroll to see more
                    await this.page.evaluate(() => {
                        window.scrollBy({ top: 600, behavior: 'smooth' });
                    });
                    await this.sleep(await this.random(2000, 3000));
                }
                
                console.log(`📊 Collected ${seenTweets.length} unique tweets`);
                
                // If no tweets found, try a simpler fallback search
                if (seenTweets.length === 0) {
                    console.log('⚠️ No tweets found, trying fallback search...');
                    
                    const fallbackQuery = this.searchEngine.getFallbackSearch();
                    const fallbackSuccess = await this.humanSearch.performSearch(this.page, fallbackQuery);
                    
                    if (fallbackSuccess) {
                        await this.sleep(2000);
                        
                        // Try collecting tweets again with fallback
                        for (let scroll = 0; scroll < 3; scroll++) {
                            const tweets = await this.page.$$('article[data-testid="tweet"]');
                            
                            for (const tweet of tweets) {
                                const tweetId = await tweet.evaluate(el => {
                                    const link = el.querySelector('a[href*="/status/"]');
                                    // Use element position as fallback ID
                                    const rect = el.getBoundingClientRect();
                                    return link?.href || `tweet-${rect.top}-${rect.left}`;
                                });
                                
                                if (!processedTweetIds.has(tweetId)) {
                                    processedTweetIds.add(tweetId);
                                    seenTweets.push(tweet);
                                }
                            }
                            
                            await this.page.evaluate(() => {
                                window.scrollBy({ top: 400, behavior: 'smooth' });
                            });
                            await this.sleep(2000);
                        }
                        
                        console.log(`📊 Fallback collected ${seenTweets.length} tweets`);
                    }
                }
                
                // Calculate target engagements (15% of what we saw)
                const targetEngagements = Math.ceil(seenTweets.length * 0.15);
                const maxPerSearch = 3; // Safety limit per search
                const actualTarget = Math.min(targetEngagements, maxPerSearch);
                
                console.log(`🎯 Target: ${actualTarget} engagements (15% of ${seenTweets.length})`);
                
                let engagementsThisRound = 0;
                const engagedTweets = [];
                
                // Try to engage with our target number of tweets
                for (const tweet of seenTweets) {
                    if (engagementsThisRound >= actualTarget) break;
                    
                    // Check hourly rate limit
                    const recentReplies = this.repliesThisHour.filter(
                        time => Date.now() - time < 3600000
                    );
                    if (recentReplies.length >= 15) {
                        console.log(`⚠️ Hourly limit reached (${recentReplies.length}/15), will resume later`);
                        break;
                    }
                    
                    const decision = await this.analyzeTweet(tweet);
                    
                    if (decision && decision.engage) {
                        const success = await this.engageWithTweet(tweet, decision.action);
                        if (success) {
                            engagementsThisRound++;
                            engagedTweets.push(tweet);
                            this.stats.successfulEngagements++;
                            
                            // Track for rate limiting
                            this.repliesThisHour.push(Date.now());
                            
                            // Update engagement selector AFTER successful reply
                            const tweetData = await tweet.evaluate(el => {
                                const username = el.querySelector('a[href^="/"]')?.getAttribute('href')?.substring(1) || 'unknown';
                                return username;
                            });
                            this.engagementSelector.updateAfterReply(tweetData);
                            
                            // Wait between engagements (longer if multiple)
                            if (engagementsThisRound < actualTarget) {
                                const waitTime = await this.random(30000, 60000);
                                console.log(`⏰ Engagement ${engagementsThisRound}/${actualTarget} complete. Waiting ${Math.floor(waitTime/1000)}s...\n`);
                                await this.sleep(waitTime);
                            }
                        }
                    }
                }
                
                console.log(`✅ Completed ${engagementsThisRound}/${actualTarget} engagements this round\n`);
                
                // Show stats periodically
                if (this.replyCount % 10 === 0) {
                    this.showStats();
                }
                
            } catch (error) {
                errorCount++;
                console.log(`⚠️ Error: ${error.message}\n`);
                
                // If too many errors, take a longer break
                if (errorCount > 5) {
                    console.log('⚠️ Too many errors, taking extended break...');
                    await this.sleep(60000);  // 1 minute break
                    errorCount = 0;
                    
                    // Try to reset by going back to home
                    try {
                        await this.page.goto('https://x.com/home', {
                            waitUntil: 'domcontentloaded',
                            timeout: 20000
                        });
                    } catch (resetError) {
                        console.log('⚠️ Reset failed, will retry...');
                    }
                } else {
                    await this.sleep(10000);
                }
            }
        }
    }

    async analyzeTweet(tweet) {
        try {
            const data = await tweet.evaluate(el => {
                const username = el.querySelector('a[href^="/"]')?.getAttribute('href')?.substring(1);
                const text = el.querySelector('[data-testid="tweetText"]')?.innerText || '';
                const hasImages = !!el.querySelector('img[alt*="Image"]');
                const hasVideos = !!el.querySelector('video, [data-testid="videoPlayer"]');
                return { username, text, hasImages, hasVideos };
            });
            
            if (!data.username || !data.text || data.text.length < 20) {
                return false;
            }
            
            // FIRST: Check if post is recent enough to avoid bot detection
            const postTimestamp = await this.timestampFilter.extractTimestamp(tweet);
            const timestampDecision = this.timestampFilter.shouldEngageByAge(postTimestamp);
            
            if (!timestampDecision.engage) {
                console.log(`   🕐 Skipping old post: ${timestampDecision.details}`);
                return false;
            }
            
            // Log post age for monitoring
            const ageDescription = this.timestampFilter.getAgeDescription(postTimestamp);
            console.log(`   🕐 Post age: ${ageDescription} (${timestampDecision.reason})`);
        
            
            // Use engagement selector to decide if we should engage
            const engagementDecision = await this.engagementSelector.shouldEngageWithPost(tweet, data);
            if (engagementDecision.action === 'skip') {
                console.log(`   ⏭️ [Selector] Skipping: ${engagementDecision.reason}`);
                return false;
            }
            
            // Store engagement type for later use
            data.engagementType = engagementDecision.action; // 'like' or 'reply'
            
            // Skip our own bot
            if (data.username.toLowerCase() === 'glitchygradeai') {
                return false;
            }
            
            // Check if this is a reply to our bot (allow conversations)
            const isReplyToUs = data.text.toLowerCase().includes('@glitchygradeai');
            
            if (isReplyToUs) {
                // This is a conversation - check with lenient filter
                const filterResult = this.contentFilter.shouldEngageWithPost(data.text, data.username, true);
                
                if (!filterResult.engage) {
                    console.log(`   🚫 Conversation filtered: ${filterResult.reason}`);
                    return false;
                }
                
                console.log(`   💬 Continuing conversation with @${data.username}`);
                return true; // Respond to conversation
            }
            
            // For non-replies, check if we've already interacted
            const usernameLower = data.username.toLowerCase();
            
            // Check if we've already replied to this user's original posts this session
            if (this.repliedUsers.has(usernameLower)) {
                return false;
            }
            
            // Check if we've interacted before (but allow if significant time has passed)
            const existingUser = this.memory.users.get(data.username);
            if (existingUser && existingUser.interactionCount > 0) {
                // Allow re-interaction after 6 hours (reduced from 24)
                const lastSeen = new Date(existingUser.lastSeen);
                const hoursSinceLastInteraction = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60);
                
                if (hoursSinceLastInteraction < 6) {
                    console.log(`   ⏭️ Already interacted with @${data.username} recently`);
                    this.repliedUsers.add(usernameLower); // Add to Set for this session
                    return false;
                } else {
                    console.log(`   🔄 Re-engaging with @${data.username} after ${Math.floor(hoursSinceLastInteraction)} hours`);
                }
            }
            
            const filterResult = this.contentFilter.shouldEngageWithPost(data.text, data.username, false);
            
            if (!filterResult.engage) {
                console.log(`   🚫 Filtered: ${filterResult.reason}`);
                this.stats.postsFiltered++;
                return false;
            }
            
            // ADDITIONAL CHECK: Ensure the tweet is ACTUALLY about Pokemon TCG
            // Not just matching our search terms coincidentally
            const textLower = data.text.toLowerCase();
            const definitelyPokemon = 
                textLower.includes('pokemon') || textLower.includes('pokémon') ||
                textLower.includes('tcg') || textLower.includes('psa') ||
                textLower.includes('charizard') || textLower.includes('pikachu') ||
                textLower.includes('card') && (textLower.includes('pull') || textLower.includes('collection')) ||
                textLower.includes('booster') || textLower.includes('etb') ||
                data.hasImages && (textLower.includes('mail') || textLower.includes('got'));
            
            if (!definitelyPokemon) {
                // If no clear Pokemon indicators, skip unless it has images
                if (!data.hasImages) {
                    console.log(`   ⏭️ Not clearly Pokemon TCG related`);
                    return false;
                }
            }
            
            this.stats.postsAnalyzed++;
            
            // Build quick features for ValueScore
            const isPriceQ = /\b(worth|price|value|how much|going for|\$)\b/i.test(data.text);
            const cards = this.extractCardNames(data.text.toLowerCase());
            const threadLen = 0; // default; if you add thread scraping, fill this in
            
            // ValueScore: data-first > context > vibes
            function computeValueScore() {
                let s = 0;
                if (isPriceQ && cards.length) s += 3;
                if (timestampDecision.reason === 'recent_post') s += 2;            // fresh
                if (data.hasImages) s += 1;                                        // we can comment condition
                if (filterResult.quality >= 2) s += 1;                             // your own quality gate
                return s;
            }
            const score = computeValueScore();
            
            // Decide engagement deterministically
            if (score < 3) return false; // skip
            
            // Respect engagementSelector's action (like vs reply)
            return { 
                engage: true, 
                action: data.engagementType || 'reply', 
                username: data.username, 
                text: data.text, 
                hasImages: data.hasImages,
                score: score
            };
            
        } catch (error) {
            return false;
        }
    }

    // Helper to get thread context from status page
    async getThreadContextFromStatusPage(page) {
        // assumes you're on the status page
        const nodes = await page.$$('[data-testid="cellInnerDiv"] article[data-testid="tweet"]');
        const msgs = [];
        for (const n of nodes.slice(-6)) {
            const m = await n.evaluate(el => {
                const u = el.querySelector('a[href^="/"]')?.getAttribute('href')?.split('/')[1] || 'user';
                const t = el.querySelector('[data-testid="tweetText"]')?.innerText || '';
                return { username: u, text: t };
            });
            if (m.text) msgs.push(m);
        }
        const topic = /(charizard|umbreon|pikachu|tcg|grade|psa|binder|pull|evolving skies|lost origin)/i
                        .exec(msgs.map(x=>x.text).join(' '))?.[0] || 'Pokemon TCG';
        return { threadLength: msgs.length, mainTopic: topic, fullConversation: msgs };
    }
    
    async engageWithTweet(tweet, action = 'reply') {
        try {
            const data = await tweet.evaluate(el => {
                const username = el.querySelector('a[href^="/"]')?.getAttribute('href')?.substring(1);
                const text = el.querySelector('[data-testid="tweetText"]')?.innerText || '';
                const hasImages = !!el.querySelector('img[alt*="Image"]');
                const hasVideos = !!el.querySelector('video, [data-testid="videoPlayer"]');
                return { username, text, hasImages, hasVideos };
            });
            
            console.log(`\n💬 @${data.username}: "${data.text.substring(0, 80)}..."`);
            
            // Learn from post
            const user = await this.memory.rememberUser(data.username, data.text);
            await this.memory.learnFromPost(data.text, { username: data.username });
            
            // Save memory after each interaction
            await this.memory.saveUsers();
            await this.memory.saveKnowledge();
            console.log(`   💾 Memory saved (${this.memory.users.size} users, ${this.memory.knowledge.prices.size} prices)`);
            
            // Try to like the tweet first
            await this.tryLikeTweet(tweet);
            
            // If action is like-only, we're done
            if (action === 'like') {
                console.log('   👍 Like-only per selector. Skipping reply.');
                return true;
            }
            
            // BEFORE opening the reply modal, open the status in a new tab to harvest context
            const url = await tweet.evaluate(el => el.querySelector('a[href*="/status/"]')?.href);
            let threadContext = null;
            if (url) {
                const ctxPage = await this.browser.newPage();
                try {
                    await ctxPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
                    await this.sleep(2000);
                    threadContext = await this.getThreadContextFromStatusPage(ctxPage);
                } catch (e) { 
                    console.log(`   ⚠️ Could not get thread context: ${e.message}`);
                }
                await ctxPage.close();
            }
            
            // Analyze visual content if present
            let visualData = null;
            if (data.hasImages || data.hasVideos) {
                if (this.visualAnalyzer) {
                    visualData = await this.visualAnalyzer.analyzeVisualContent(tweet);
                    if (visualData && visualData.analysis) {
                        console.log(`   🖼️ Visual: ${visualData.analysis.contentType} - ${visualData.analysis.focusArea}`);
                    }
                }
            }
            
            // Generate contextual response with thread context if available
            const response = threadContext
                ? await this.generateThreadAwareResponse(data.username, data.text, threadContext)
                : await this.generateContextualResponse(
                    data.username, 
                    data.text, 
                    data.hasImages,
                    visualData
                );
            
            // Scroll to tweet
            await tweet.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
            await this.sleep(2000);
            
            // Reply
            const replyButton = await tweet.$('button[data-testid="reply"]');
            if (!replyButton) return false;
            
            await replyButton.click();
            console.log(`   💭 Replying...`);
            await this.sleep(3000);
            
            const replyBox = await this.page.waitForSelector(
                'div[data-testid="tweetTextarea_0"]',
                { timeout: 10000 }
            ).catch(() => null);
            
            if (!replyBox) {
                await this.page.keyboard.press('Escape');
                return false;
            }
            
            await this.humanType(replyBox, response);
            await this.sleep(2000);
            
            // Send
            const sent = await this.page.evaluate(() => {
                const btn = document.querySelector('button[data-testid="tweetButton"]');
                if (btn && !btn.disabled) {
                    btn.click();
                    return true;
                }
                return false;
            });
            
            if (!sent) {
                await this.page.keyboard.down('Meta');
                await this.page.keyboard.press('Enter');
                await this.page.keyboard.up('Meta');
            }
            
            await this.sleep(3000);
            
            const success = await this.page.$('div[data-testid="tweetTextarea_0"]')
                .then(el => el === null);
            
            if (success) {
                this.replyCount++;
                this.repliedUsers.add(data.username.toLowerCase());
                this.repliesThisHour.push(Date.now()); // Track for rate limiting
                console.log(`   ✅ Sent! [${this.replyCount}/1000]`);
                
                // Update engagement selector AFTER successful reply
                this.engagementSelector.updateAfterReply(data.username);
                
                // Check if we need a break
                await this.checkForBreak();
                
                // Check rate limit
                await this.checkRateLimit();
                
                return true;
            }
            
            await this.page.keyboard.press('Escape');
            return false;
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return false;
        }
    }

    async tryLikeTweet(tweet) {
        // Like with multiple attempts
        let liked = false;
        const likeSelectors = [
            'button[data-testid="like"]',
            'button[aria-label*="Like"]',
            'div[role="button"][aria-label*="Like"]'
        ];
        
        for (const selector of likeSelectors) {
            if (liked) break;
            const likeButton = await tweet.$(selector);
            if (likeButton) {
                try {
                    await likeButton.click();
                    console.log(`   ❤️ Liked`);
                    liked = true;
                    await this.sleep(1500);
                } catch (e) {
                    // Try next selector
                }
            }
        }
        return liked;
    }
    
    showStats() {
        const runtime = Math.floor((Date.now() - this.startTime) / 60000);
        
        console.log('\n📊 === BOT STATISTICS ===');
        console.log(`   Replies: ${this.replyCount}`);
        console.log(`   Runtime: ${runtime} min`);
        console.log(`   Rate: ${(this.replyCount / Math.max(runtime, 1)).toFixed(1)}/min`);
        console.log(`   Analyzed: ${this.stats.postsAnalyzed}`);
        console.log(`   Filtered: ${this.stats.postsFiltered}`);
        console.log(`   Success rate: ${((this.stats.successfulEngagements / Math.max(this.stats.postsAnalyzed, 1)) * 100).toFixed(1)}%`);
        
        const memStats = this.memory.getMemoryStats();
        console.log(`   Users: ${memStats.totalUsers}`);
        console.log(`   Prices learned: ${memStats.totalKnowledge.prices}`);
        console.log('========================\n');
    }

    async generatePriceAwareResponse(tweetContent, username, hasImages) {
        try {
            const textLower = tweetContent.toLowerCase();
            const ents = this.extractCardEntities ? this.extractCardEntities(tweetContent) : null;
            const cards = ents?.length ? [ents[0].name] : this.extractCardNames(textLower);
            
            if (cards.length > 0) {
                const primary = ents?.[0] || { name: cards[0], set: this.extractSetName(textLower) || null };
                let stats = null;
                
                // Try to get stats from price engine
                if (this.priceEngineReady && priceEngine.getStatsFor) {
                    try {
                        stats = await priceEngine.getStatsFor(primary.name, primary.set, primary.number);
                    } catch (e) {
                        console.log('   ⚠️ Could not get stats:', e.message);
                    }
                }
                
                // If we have stats, use authority response with numbers
                if (stats && Object.keys(stats).length > 0) {
                    const line = this.authorityResponses.generateAuthorityWithStats({
                        setName: primary.set,
                        cardDisplay: `${primary.name}${primary.number ? ' ' + primary.number : ''}${primary.set ? ' (' + primary.set + ')' : ''}`,
                        stats
                    });
                    return clampTweet(line, 280);
                }
                
                // Fallback to regular price response
                const response = await this.priceResponses.generatePriceResponse(primary.name, primary.set, 'casual');
                if (response) {
                    return clampTweet(response, 280);
                }
            }
            
            return null;
        } catch (error) {
            console.log('   ⚠️ Price response error:', error.message);
            return null;
        }
    }
    
    shouldIncludePrice(text) {
        const priceTriggers = [
            'worth', 'price', 'value', 'cost', 'how much',
            'what\'s it', 'going for', 'market', 'tcgplayer',
            'sell', 'buy', 'trade', '$'
        ];
        
        const lowerText = text.toLowerCase();
        return priceTriggers.some(trigger => lowerText.includes(trigger));
    }
    
    // GPT's stricter price-intent guard
    shouldIncludeNumbers({ text, thread }) {
        const t = (text || '').toLowerCase();
        const priceQ = /\b(worth|price|value|how much|going for|\$)\b/.test(t);
        const selling = /\b(selling|for sale|wts|fs|trade|pc for trade)\b/.test(t);

        // Artist/social showcase block
        const socialArtist = /(met|meet|autograph|signed|artist|illustrator|commission|artist alley|gallery|sketch|top\s*\d+)/.test(t)
            || (thread?.fullConversation || []).some(m => /(met|artist|illustrator)/i.test(m.text));

        if (priceQ || selling) return true;
        if (socialArtist) return false;
        // Default conservative: no numbers unless asked
        return false;
    }
    
    // Over-familiarity throttle
    shouldUseFamiliarTone(username) {
        const u = this.memory?.users?.get?.(username);
        if (!u) return false;
        const MIN_TOUCHES = 3;
        const last = new Date(u.lastSeen || 0);
        const recent = (Date.now() - last) < 30*24*3600*1000; // last 30 days
        return (u.interactionCount || 0) >= MIN_TOUCHES && recent;
    }
    
    // Card nickname resolution for better price matching
    CARD_NICKNAMES = {
        moonbreon: { name: 'Umbreon VMAX', set: 'Evolving Skies', number: '215/203' },
        zard: { name: 'Charizard' },
        tina: { name: 'Giratina' },
        rayray: { name: 'Rayquaza VMAX' },
        pika: { name: 'Pikachu' },
        eevee: { name: 'Eevee' },
        mew2: { name: 'Mewtwo' },
        gary: { name: 'Gyarados' },
        blast: { name: 'Blastoise' },
        venu: { name: 'Venusaur' }
    };
    
    // Set abbreviations for better entity resolution
    SET_ABBREVIATIONS = {
        'evs': 'Evolving Skies',
        'es': 'Evolving Skies',
        'lor': 'Lost Origin',
        'lo': 'Lost Origin',
        'sit': 'Silver Tempest',
        'st': 'Silver Tempest',
        'brs': 'Brilliant Stars',
        'bs': 'Brilliant Stars',
        'cz': 'Crown Zenith',
        'sv': 'Scarlet & Violet',
        'pgo': 'Pokemon GO',
        'prf': 'Paradox Rift',
        'pr': 'Paradox Rift',
        'obf': 'Obsidian Flames',
        'of': 'Obsidian Flames',
        'pal': 'Paldea Evolved',
        'pe': 'Paldea Evolved',
        'tmp': 'Temporal Forces',
        'tf': 'Temporal Forces',
        'shf': 'Shining Fates',
        'hf': 'Hidden Fates',
        'vv': 'Vivid Voltage',
        'cr': 'Chilling Reign',
        'fs': 'Fusion Strike',
        'cel': 'Celebrations',
        'upc': 'Ultimate Premium Collection'
    };
    
    extractCardEntities(text) {
        const t = text.toLowerCase();
        const ents = [];
        
        // Check for nicknames
        for (const k in this.CARD_NICKNAMES) {
            if (t.includes(k)) ents.push({...this.CARD_NICKNAMES[k]});
        }
        
        // Extract regular card names
        const base = this.extractCardNames(t).map(n => ({ name: n }));
        
        // Check for set abbreviations
        let expandedSet = this.extractSetName(text);
        for (const [abbrev, fullName] of Object.entries(this.SET_ABBREVIATIONS)) {
            const pattern = new RegExp(`\\b${abbrev}\\b`, 'i');
            if (pattern.test(t)) {
                expandedSet = fullName;
                break;
            }
        }
        
        const num = (t.match(/\b(\d{1,3}\/\d{1,3}[a-z]?)\b/i) || [])[1];
        
        // Language detection
        const isJapanese = /\bjp\b|\bjpn\b|japanese|japan/.test(t);
        const isEnglish = /\ben\b|\beng\b|english/.test(t) || (!isJapanese && t.includes('english'));
        
        // Rarity detection
        const rarityPattern = /\b(alt art|alt|sar|fa|full art|hr|hyper rare|gold star|crystal|shiny|rainbow|secret|promo)\b/i;
        const rarityMatch = t.match(rarityPattern);
        
        // Enhanced: Detect general Pokemon TCG content even without specific names
        const tcgIndicators = [
            /pokemon\s*(tcg|cards?|collection|pulls?|pack|box)/i,
            /#pokemon/i,
            /#tcg/i,
            /\b(vmax|vstar|ex|gx|v\b)/i,
            /\b(booster|etb|trainer\s*box|collection\s*box)/i,
            /\b(pulls?|pulled|opening|ripped)/i,
            /\b(graded?|psa|bgs|cgc|slab)/i,
            /\b(chase\s*card|hit|fire\s*pull)/i
        ];
        
        const hasTCGContent = tcgIndicators.some(pattern => pattern.test(t));
        
        // If we found TCG content but no specific cards, add a generic entity
        if (hasTCGContent && ents.length === 0 && base.length === 0) {
            // Extract product or card type mentioned
            const productMatch = t.match(/\b(vmax|vstar|ex|gx|full\s*art|alt\s*art|secret\s*rare)\b/i);
            const setMatch = expandedSet || this.extractSetName(text);
            
            ents.push({
                name: productMatch ? productMatch[0] : 'pokemon_tcg',
                type: 'generic',
                set: setMatch,
                context: 'tcg_content'
            });
        }
        
        // Combine all entities
        const allEntities = [...ents, ...base].map(e => ({ 
            ...e, 
            set: e.set || expandedSet || undefined, 
            number: e.number || num || undefined,
            language: isJapanese ? 'Japanese' : (isEnglish ? 'English' : undefined),
            rarity: rarityMatch ? rarityMatch[1] : undefined
        }));
        
        // Return up to 3 entities, prioritizing specific cards over generic
        return allEntities.sort((a, b) => {
            if (a.type === 'generic' && b.type !== 'generic') return 1;
            if (a.type !== 'generic' && b.type === 'generic') return -1;
            return 0;
        }).slice(0, 3);
    }
    
    extractCardNames(text) {
        const cards = [];
        const cardPatterns = [
            /charizard/i, /pikachu/i, /umbreon/i, /rayquaza/i,
            /lugia/i, /mewtwo/i, /gengar/i, /eevee/i,
            /dragonite/i, /gyarados/i, /blastoise/i, /venusaur/i,
            /giratina/i, /garchomp/i, /lucario/i, /zoroark/i,
            /sylveon/i, /glaceon/i, /leafeon/i, /espeon/i,
            /flareon/i, /jolteon/i, /vaporeon/i
        ];
        
        for (const pattern of cardPatterns) {
            const match = text.match(pattern);
            if (match) cards.push(match[0]);
        }
        
        return cards;
    }
    
    extractPrices(text) {
        const prices = [];
        const pricePattern = /\$\d+(\.\d{2})?/g;
        const matches = text.match(pricePattern);
        if (matches) prices.push(...matches);
        return prices;
    }
    
    extractSetName(text) {
        const sets = [
            { pattern: /base set/i, name: 'Base Set' },
            { pattern: /evolving skies/i, name: 'Evolving Skies' },
            { pattern: /lost origin/i, name: 'Lost Origin' },
            { pattern: /silver tempest/i, name: 'Silver Tempest' },
            { pattern: /crown zenith/i, name: 'Crown Zenith' },
            { pattern: /paldea evolved/i, name: 'Paldea Evolved' },
            { pattern: /obsidian flames/i, name: 'Obsidian Flames' },
            { pattern: /paradox rift/i, name: 'Paradox Rift' },
            { pattern: /surging sparks/i, name: 'Surging Sparks' }
        ];
        
        for (const {pattern, name} of sets) {
            if (pattern.test(text)) {
                return name;
            }
        }
        
        return null;
    }
    
    async run() {
        try {
            if (await this.init()) {
                await this.processTimeline();
            }
        } catch (error) {
            console.error('❌ Fatal:', error);
        } finally {
            this.showStats();
            console.log('✅ Session complete');
        }
    }
}

// Add helper method to LMStudioAI
LMStudioAI.prototype.generateDirectResponse = async function(messages) {
    if (!this.available) return null;
    
    try {
        const axios = require('axios');
        const response = await axios.post(`${this.baseURL}/chat/completions`, {
            model: this.modelName,
            messages: messages,
            temperature: 0.7,
            max_tokens: 50,  // Reduced to prevent long messages
            stream: false
        }, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data?.choices?.[0]?.message?.content) {
            let aiResponse = response.data.choices[0].message.content.trim()
                .replace(/^["']|["']$/g, '') // Remove surrounding quotes
                .replace(/^[""]|[""]$/g, '') // Remove smart quotes
                .replace(/#\w+/g, '')
                .split('\n')[0]
                .trim();
            
            // Use clampTweet for consistent handling
            aiResponse = clampTweet(aiResponse, 280);
            
            return aiResponse;
        }
        
        return null;
    } catch (error) {
        return null;
    }
};

// Export for testing or run as main script
if (require.main === module) {
    const bot = new ContextualPokemonBot();
    bot.run().catch(console.error);
} else {
    module.exports = ContextualPokemonBot;
}