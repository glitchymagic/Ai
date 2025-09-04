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
const { getAuthorityIntegration } = require('./features/authority-integration');
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
const VisionMonitor = require('./vision-monitor');
const ResponseValidator = require('./features/response-validator');
const LearningEngine = require('./features/learning-engine');
const ConversationAnalyzer = require('./features/conversation-analyzer');
const AdaptiveResponseGenerator = require('./features/adaptive-response-generator');
const FollowingMonitor = require('./features/following-monitor');
const BetterContextAnalyzer = require('./features/better-context-analyzer');
const AdaptiveToneGenerator = require('./features/adaptive-tone-generator');

puppeteer.use(StealthPlugin());

// Use environment variable if set, otherwise use first key from rotation
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw';
if (!GEMINI_API_KEY) throw new Error('No Gemini API keys available');

// Multiple Gemini API keys for rotation
const GEMINI_API_KEYS = [
    'AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw',  // Key 1 (original)
    'AIzaSyClg--pgWqpAny17vRbiWokCC7L_YjEFkQ',  // Key 2 
    'AIzaSyDnlBhkg5GO2O85O-bfVcyCnGa29boEUh8'   // Key 3 (newest)
].filter(key => key && key.length > 0);

// Create key manager for rotation
const GeminiKeyManager = require('./features/gemini-key-manager');
const keyManager = new GeminiKeyManager(GEMINI_API_KEYS);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); // Keep for backward compatibility

// Model will be created with key rotation in generateThreadAwareResponse

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
        this.visionMonitor = new VisionMonitor();
        this.responseValidator = new ResponseValidator();
        
        // Initialize learning systems
        this.learningEngine = new LearningEngine();
        this.conversationAnalyzer = new ConversationAnalyzer(this.learningEngine);
        this.adaptiveGenerator = new AdaptiveResponseGenerator(this.learningEngine);
        
        // Initialize following monitor (will set page later)
        this.followingMonitor = null;
        
        // Initialize better context analyzer
        this.betterContextAnalyzer = new BetterContextAnalyzer();
        this.adaptiveToneGenerator = new AdaptiveToneGenerator();
        
        // Initialize new authority integration
        this.authorityIntegration = getAuthorityIntegration();
        this.authorityIntegration.initialize().catch(err => {
            console.log('   ⚠️ Authority integration init failed:', err.message);
        });
        
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

    async generateThreadAwareResponse(username, latestMessage, threadContext, visualData = null) {
        // Build comprehensive context from thread
        let contextSummary = `Thread has ${threadContext.threadLength} messages about ${threadContext.mainTopic}.\n`;
        
        // Include key conversation points
        if (threadContext.fullConversation && threadContext.fullConversation.length > 1) {
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
                
                // Build visual context if available
                let visualContext = '';
                let visionInstructions = '';
                
                // Check for both image and video analysis
                const visionResult = visualData?.visionAnalysis || visualData?.videoAnalysis;
                
                if (visionResult?.analyzed) {
                    // We have actual vision API results (either image or video)
                    const isVideo = visualData?.videoAnalysis !== undefined;
                    
                    if (visionResult.cards && visionResult.cards.length > 0) {
                        // High-confidence cards were found
                        const cardNames = visionResult.cards.map(c => c.name).join(', ');
                        if (isVideo) {
                            visualContext = `\nVisual: Video analyzed - ${visionResult.cards.length} Pokemon card(s) identified: ${cardNames}`;
                            if (visionResult.isPackOpening) {
                                visualContext += ' (pack opening video)';
                            }
                        } else {
                            visualContext = `\nVisual: ${visionResult.cards.length} Pokemon card(s) identified: ${cardNames}`;
                        }
                        visionInstructions = `\nIMPORTANT: You MUST mention these specific cards: ${cardNames}. Do NOT mention any other cards.`;
                    } else if (visionResult.isEventPoster) {
                        // Event poster detected
                        visualContext = '\nVisual: Event poster detected (no cards shown)';
                        visionInstructions = '\nIMPORTANT: This is an EVENT POSTER. Do NOT mention any cards. Focus on the event.';
                    } else if (visionResult.lowConfidenceCards && visionResult.lowConfidenceCards.length > 0) {
                        // Cards were detected but with low confidence
                        // Check if this is actually about pulls/showcasing based on text
                        const isPullsContext = /\b(pull|pulled|got|hit|found|mail\s*day|pickup|haul|collection|binder)\b/i.test(latestMessage);
                        const isGameplayContext = /\b(deck|play|game|match|tournament|energy|trainer|attack|damage|bench|prize)\b/i.test(latestMessage);
                        
                        if (isVideo) {
                            visualContext = '\nVisual: Video analyzed - cards visible but unclear';
                            if (isPullsContext) {
                                visionInstructions = '\nIMPORTANT: Cards detected but unclear. Respond about their pulls/collection without naming specific cards.';
                            } else if (isGameplayContext) {
                                visionInstructions = '\nIMPORTANT: This seems to be about gameplay/strategy. Focus on the game mechanics discussed, not card identification.';
                            } else {
                                visionInstructions = '\nIMPORTANT: Respond to the actual topic discussed. Do not assume this is about pulls or showcasing.';
                            }
                            // Add hint about pack opening if detected
                            if (visionResult.isPackOpening) {
                                visualContext += ' (pack opening video)';
                                visionInstructions = '\nIMPORTANT: Pack opening detected - react to the opening without naming specific cards.';
                            }
                        } else {
                            visualContext = '\nVisual: Image analyzed - cards visible but unclear';
                            if (isPullsContext) {
                                visionInstructions = '\nIMPORTANT: Cards visible but unclear. Respond about their collection/pulls without naming specific cards.';
                            } else if (isGameplayContext) {
                                visionInstructions = '\nIMPORTANT: This appears to be about gameplay/strategy. Focus on the game aspects discussed, not card identification.';
                            } else {
                                visionInstructions = '\nIMPORTANT: Respond to the actual content of their message. Do not assume this is about showing off cards.';
                            }
                        }
                    } else {
                        // Media analyzed but no cards found at all
                        if (isVideo) {
                            visualContext = '\nVisual: Video analyzed - no specific cards identified';
                            // Check what type of content this might be based on text
                            const textLower = latestMessage.toLowerCase();
                            if (textLower.includes('collection') || textLower.includes('binder')) {
                                visionInstructions = '\nIMPORTANT: Video appears to show collection but specific cards unclear. Be supportive but acknowledge you cannot see details. Example: "Love seeing collections! What are your favorite pieces in there?"';
                            } else if (textLower.includes('open') || textLower.includes('pack')) {
                                visionInstructions = '\nIMPORTANT: Pack opening video but cards not clear. React to the excitement without claiming to see specific cards. Example: "Pack openings are always exciting! Hope you got some good pulls!"';
                            } else {
                                visionInstructions = '\nIMPORTANT: Cannot identify specific content in video. Respond based on their text only. Be honest if asked about specifics.';
                            }
                        } else {
                            visualContext = '\nVisual: Image analyzed - no specific cards identified';
                            const textLower = latestMessage.toLowerCase();
                            if (textLower.includes('look at') || textLower.includes('check out') || textLower.includes('got')) {
                                visionInstructions = '\nIMPORTANT: They want to show something but image is unclear. Acknowledge enthusiasm without pretending to see details. Example: "Nice! Tell me more about what you got!"';
                            } else {
                                visionInstructions = '\nIMPORTANT: Image content unclear. Focus on their message text. If they ask about the image, be honest that you cannot see details clearly.';
                            }
                        }
                    }
                } else if (visualData?.analysis) {
                    // Fallback to old analysis if vision wasn't used
                    const analysis = visualData.analysis;
                    const isPullsContext = /\b(pull|pulled|got|hit|found|mail\s*day|pickup|haul)\b/i.test(latestMessage);
                    const isGameplayContext = /\b(deck|play|game|match|tournament|energy|trainer|attack|damage|bench|prize|rule|effect)\b/i.test(latestMessage);
                    
                    if (analysis.contentType === 'showcase' || analysis.contentType === 'multiple_showcase') {
                        visualContext = '\nVisual: User showing cards (vision unavailable)';
                        if (isPullsContext) {
                            visionInstructions = '\nIMPORTANT: Cards shown but not identifiable. Comment on their pulls/collection generally without naming cards.';
                        } else if (isGameplayContext) {
                            visionInstructions = '\nIMPORTANT: This is about game mechanics/strategy. Focus on gameplay discussion, not card showcasing.';
                        } else {
                            visionInstructions = '\nIMPORTANT: Respond appropriately to their actual message topic. Cards are visible but may not be the main point.';
                        }
                    } else if (analysis.contentType === 'event_poster') {
                        visualContext = '\nVisual: Tournament/event poster';
                        visionInstructions = '\nIMPORTANT: This is an event poster. Focus on the event, not cards.';
                    }
                }
                
                // First check what type of content this is
                const contentType = visualData?.visionAnalysis?.contentType || 
                                  visualData?.analysis?.contentType || 
                                  'general';
                
                // Adjust prompt based on content type
                let contextPrompt;
                if (contentType === 'FAN_ART' || contentType === 'fanart') {
                    contextPrompt = `You're replying to Pokemon fan art. Be supportive and specific about what they created. One tweet only, <=280 chars.`;
                } else if (isPriceRelated || contentType === 'showcase') {
                    contextPrompt = `You're replying in a Pokémon TCG thread. Use the context + numbers below. One tweet only, <=280 chars.`;
                } else {
                    contextPrompt = `You're replying to Pokemon content. Stay on their topic. One tweet only, <=280 chars.`;
                }
                
                const prompt = `
${contextPrompt}
Rules: ${isPriceRelated ? 'add 1 stat (price/Δ%/n sales) if available;' : 'focus on their actual topic;'} NO hashtags; light Gen-Z tone; end crisp. NEVER add context that wasn't mentioned. Be specific to what they shared.
${visualContext ? 'IMPORTANT: Only comment on what they explicitly mentioned. Do NOT add imaginary details.' : ''}${visionInstructions}

Context: Thread=${threadContext.threadLength}${visualContext}
Recent:
${threadContext.fullConversation && threadContext.fullConversation.length > 0 
    ? threadContext.fullConversation.slice(-3).map(m => `• @${m.username}: ${m.text.slice(0,80)}`).join('\n')
    : '• No previous messages'}

Latest from @${username}: "${latestMessage}"

Reply:
`.trim();

                // Create model with key rotation
                let threadModel;
                try {
                    threadModel = await keyManager.createModel("gemini-1.5-flash");
                } catch (keyError) {
                    // If no keys available, throw immediately to avoid retry loop
                    if (keyError.message === 'No available Gemini API keys') {
                        throw keyError;
                    }
                    throw keyError;
                }
                const result = await threadModel.generateContent(prompt);
                let response = result.response.text().trim()
                    .replace(/^[\"']|[\"']$/g, '')
                    .replace(/#\w+/g, '')
                    .split('\n')[0]
                    .trim();
                
                // Use clampTweet for consistent handling
                response = clampTweet(response, 280);
                
                // Validate response against vision results
                if (visualData && this.responseValidator) {
                    const validation = this.responseValidator.validateResponse(response, visualData);
                    if (!validation.valid) {
                        console.log(`   ⚠️ Response validation issues:`, validation.issues);
                        // Attempt to fix the response
                        const fixedResponse = this.responseValidator.fixResponse(
                            response, 
                            validation.issues, 
                            visualData.visionAnalysis
                        );
                        if (fixedResponse !== response) {
                            console.log(`   🔧 Fixed response: "${fixedResponse}"`);
                            response = fixedResponse;
                        }
                    }
                }
                
                console.log(`   🧵 [Thread-aware] "${response}"`);
                return response;
                
            } catch (error) {
                console.log(`   ⚠️ Thread response failed:`, error.message);
                
                // If quota exceeded, try LM Studio
                if (error.message && error.message.includes('429') && this.lmstudio?.available) {
                    console.log(`   🔄 Trying LM Studio for thread response...`);
                    try {
                        const lmResponse = await this.lmstudio.generateThreadResponse(
                            username, 
                            latestMessage, 
                            threadContext,
                            visualData
                        );
                        if (lmResponse) {
                            console.log(`   🤖 [LM Studio Thread] "${lmResponse}"`);
                            return lmResponse;
                        }
                    } catch (lmError) {
                        console.log(`   ⚠️ LM Studio also failed:`, lmError.message);
                    }
                }
                
                console.log(`   ⚠️ Using regular response`);
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
        
        // NEW: Better context analysis
        const contextAnalysis = this.betterContextAnalyzer.analyzeContext(tweetContent, visualData);
        const responseStrategy = this.betterContextAnalyzer.getResponseStrategy(contextAnalysis, tweetContent);
        console.log(`   📑 Context: ${contextAnalysis.primary} (${responseStrategy.approach})`);
        
        // If this is clearly not TCG content and we're forcing TCG responses, skip
        if (contextAnalysis.primary !== 'tcgContent' && 
            contextAnalysis.primary !== 'salesTrading' && 
            !contextAnalysis.contexts.some(c => c.type === 'tcgContent')) {
            // Handle non-TCG content appropriately
            return this.generateNonTCGResponse(username, tweetContent, contextAnalysis, responseStrategy, visualData);
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
        
        // Build thread context with snippet
        const threadContext = visualData?.threadContext || null;
        const snippet = buildThreadSnippet(threadContext);
        const enhancedThreadContext = threadContext ? { ...threadContext, snippet } : null;

        // Check if this is an event (tournament, locals, etc)
        const isEvent = detectEventFromText(tweetContent).isEvent
            || visualData?.analysis?.contentType === 'event_poster'
            || visualData?.isEventPoster === true;
        
        // Learn from market discussions
        if (isPriceQ || tweetContent.toLowerCase().includes('market')) {
            await this.learningEngine.learnFromMarketDiscussion(tweetContent, username);
        }
        
        // Handle explicit price questions separately (keep existing price logic)
        // But ONLY if we actually identified cards or no visual content
        const visionFailed = visualData?.visionAnalysis?.analyzed === true && 
                           (!visualData.visionAnalysis.cards || visualData.visionAnalysis.cards.length === 0);
        const hasVisualWithoutCards = hasImages && visionFailed;
        
        if (isPriceQ && numbersOk && this.priceEngineReady && cardEntities.length > 0 && !hasVisualWithoutCards) {
            const priceResponse = await this.generatePriceAwareResponse(tweetContent, username, hasImages);
            if (priceResponse) {
                console.log(`   💰 [Price] "${priceResponse}"`);
                return clampTweet(priceResponse, 280);
            }
        }

        // Determine if this is a social/community post that benefits from thread-aware personality
        // But exclude fan art and non-TCG content from thread-aware responses
        const isSocialPost = this.isSocialCommunityPost(tweetContent, visualData, sentiment) && 
                           contextAnalysis.primary === 'tcgContent';
        
        // Check if vision failed on an image post
        const visionFailedOnImage = hasImages && (!visualData?.visionAnalysis?.analyzed || 
                                                  (visualData?.visionAnalysis?.analyzed && !visualData?.visionAnalysis?.cards?.length));
        
        // Determine content type from vision analysis
        const contentType = visualData?.visionAnalysis?.contentType || 
                          visualData?.analysis?.contentType || 
                          'general';
        
        // Check if vision identified this as non-card content (OTHER)
        const isNonCardContent = visualData?.visionAnalysis?.analyzed && 
                                visualData?.visionAnalysis?.cards?.length === 0 &&
                                !visualData?.visionAnalysis?.isEventPoster;
        
        // Check if this is fan art
        const isFanArt = visualData?.visionAnalysis?.isFanArt === true || 
                        contentType === 'FAN_ART' || 
                        contentType === 'fanart';
        
        // If vision failed and it's primarily an image showcase, skip or use very generic response
        if (visionFailedOnImage && tweetContent.length < 50) {
            console.log('   ⚠️ Vision failed on image post, using safe generic response');
            const genericResponses = [
                "love the energy! what set is this from?",
                "always exciting to see new pulls! what's your chase card?",
                "nice! how's the collection coming along?",
                "solid! been hunting anything specific lately?",
                "sweet! what other cards you pulling from this set?"
            ];
            const response = genericResponses[Math.floor(Math.random() * genericResponses.length)];
            return response;
        }
        
        // Handle fan art specifically with adaptive tone
        if ((isFanArt || contentType === 'FAN_ART') && hasImages) {
            console.log('   🎨 Fan art detected, using adaptive art response');
            
            // Analyze the context more deeply
            const artContext = this.betterContextAnalyzer.analyzeContext(tweetContent, visualData);
            
            // If we have specific details, use adaptive generator
            if (artContext.details && this.adaptiveToneGenerator) {
                try {
                    const adaptiveResponse = this.adaptiveToneGenerator.generateResponse(
                        artContext,
                        artContext.details,
                        { approach: 'artistic', isQuestion: tweetContent.includes('?') }
                    );
                    
                    console.log(`   🎨 Adaptive art response: ${adaptiveResponse.tone} tone`);
                    return adaptiveResponse.response;
                } catch (error) {
                    console.log('   ⚠️ Adaptive art generation failed, using fallback');
                }
            }
            
            // Fallback responses
            const fanArtResponses = [
                "yo the art style goes hard! love the colors",
                "this design is clean! the details are insane",
                "fire artwork! loving the vibe",
                "sick art! the style is on point",
                "this goes hard! great work on the design"
            ];
            const response = fanArtResponses[Math.floor(Math.random() * fanArtResponses.length)];
            return response;
        }
        
        // If vision identified this as non-Pokemon content, skip mentioning cards entirely
        if (isNonCardContent && hasImages) {
            console.log('   🎨 Non-card content detected, skipping card references');
            // Don't mention cards at all - just engage with the actual content/text
            // Let the normal flow handle it without card-specific responses
        }
        
        // Extract card context for authority integration
        const cardContext = this.authorityIntegration?.initialized ? 
            this.authorityIntegration.extractCardContext(tweetContent, visualData) : null;
        
        // Track this interaction for learning
        const interactionContext = {
            username,
            message: tweetContent,
            hasImages,
            sentiment: sentiment.sentiment,
            topics: cardEntities,
            isPriceQuestion: isPriceQ,
            cardContext,
            visualData,
            timestamp: Date.now()
        };
        
        // Check if we should use adaptive responses based on user history
        const userProfile = this.learningEngine.userProfiles.get(username);
        const shouldUseAdaptive = userProfile && userProfile.interactions > 2;
        
        // Check if we should use adaptive response for known users
        if (shouldUseAdaptive && !visionFailedOnImage) {
            console.log('   🤖 Using adaptive response for known user');
            const adaptiveResponse = await this.adaptiveGenerator.generateResponse(username, {
                type: isPriceQ ? 'priceQuestion' : isShowcase ? 'showcase' : 'discussion',
                isPriceQuestion: isPriceQ,
                hasImages,
                cardName: cardContext?.cardName,
                priceData: cardContext?.isPriceQuestion && this.priceEngineReady ? 
                    await this.authorityIntegration?.hotCards?.getPriceByName(cardContext.cardName) : null,
                sentiment: sentiment.sentiment,
                tweetContent
            });
            
            if (adaptiveResponse && adaptiveResponse.response) {
                // Track the response
                await this.learningEngine.trackResponseEffectiveness(
                    username, 
                    adaptiveResponse.response,
                    interactionContext
                );
                
                return clampTweet(adaptiveResponse.response, 280);
            }
        }
        
        // HYBRID APPROACH: Use thread-aware for social posts, composer for educational
        if (isSocialPost && !visionFailedOnImage && keyManager.getNextAvailableKey()) {
            // Let thread-aware handle community/social posts with its personality
            console.log('   💬 [Social Post] Using thread-aware for community engagement');
            // Use minimal thread context if none exists
            const socialThreadContext = threadContext || {
                threadLength: 1,
                mainTopic: 'Pokemon TCG',
                fullConversation: []
            };
            let threadResponse;
            try {
                threadResponse = await this.generateThreadAwareResponse(username, tweetContent, socialThreadContext, visualData);
            } catch (error) {
                console.log(`   ⚠️ Thread response failed: ${error.message}`);
                // If no Gemini keys available, use fallback immediately
                if (error.message === 'No available Gemini API keys') {
                    console.log('   ⚠️ Using regular response');
                    // Fall through to composer
                    threadResponse = null;
                }
            }
            
            // Enhance with authority data if available
            if (threadResponse && this.authorityIntegration?.initialized && cardContext) {
                threadResponse = await this.authorityIntegration.enhanceResponse(threadResponse, cardContext);
            }
            
            if (threadResponse) {
                return clampTweet(threadResponse, 280);
            }
        }

        // Handle showcase posts without price intent (but not social)
        if (isShowcase && !numbersOk && !isSocialPost) {
            // Visual-first for non-social showcases without price intent
            console.log('   🖼️ Showcase detected without price intent - visual response only');
            const visualResponse = this.visualAnalyzer?.generateVisualResponse(tweetContent, visualData);
            if (visualResponse) {
                return clampTweet(visualResponse, 280);
            }
        }

        // Use the new composer for educational/authority responses
        const composedResponse = await composeResponse({
            text: tweetContent,
            hasImages,
            threadContext: enhancedThreadContext,
            isEvent,
            authorityFn: async ({ text, hasImages, intents }) => {
                // Use authority integration if available
                if (this.authorityIntegration?.initialized && cardContext && numbersOk && !isEvent) {
                    const authorityResponse = await this.authorityIntegration.authorityEngine.generateAuthorityResponse(cardContext);
                    if (authorityResponse) {
                        return {
                            primary: authorityResponse,
                            secondary: '',
                            confidence: 0.9
                        };
                    }
                }
                
                // Fallback to existing authority
                const auth = this.authorityResponses.generateAuthorityResponse(text, hasImages);
                
                // If no authority response and we have images, provide a generic collection response
                if (!auth && hasImages) {
                    const genericResponses = [
                        "Nice cards! The condition looks solid from here.",
                        "Those are some great pulls! The set has been popular.",
                        "Sweet collection! Love seeing what people are collecting.",
                        "Those look clean! Great additions to any collection."
                    ];
                    const randomIndex = Math.floor(Math.random() * genericResponses.length);
                    return {
                        primary: genericResponses[randomIndex],
                        secondary: '',
                        confidence: 0.5
                    };
                }
                
                if (!numbersOk || isEvent) {
                    // Strip any prices/numbers from authority response when not allowed
                    const cleanAuth = auth ? tidyPunctuation(stripMarketNumbers(auth)) : null;
                    return {
                        primary: cleanAuth || 'Those look great! Nice additions to the collection.',
                        secondary: '',
                        confidence: 0.65
                    };
                }
                
                return {
                    primary: auth || 'Nice pulls! Always good to see what people are getting.',
                    secondary: '',
                    confidence: auth ? 0.8 : 0.6
                };
            }
        });

        // Debug composedResponse
        let response;
        if (!composedResponse || !composedResponse.text) {
            console.log('   ⚠️ composedResponse issue:', JSON.stringify(composedResponse));
            // Provide a fallback response
            response = hasImages ? "Nice cards! Those look great." : "Nice pull! Keep collecting!";
        } else {
            response = composedResponse.text;
        }
        
        // Enhance response with authority data if not already done
        if (response && this.authorityIntegration?.initialized && cardContext && !isSocialPost) {
            response = await this.authorityIntegration.enhanceResponse(response, cardContext);
        }
        const strategy = { 
            strategy: isSocialPost && threadContext ? 'thread_aware' : 
                     (composedResponse.meta.mode === 'event' ? 'event' : 'composed'),
            confidence: 'high',
            reason: isSocialPost && threadContext ? 'social/community post' :
                   (composedResponse.meta.mode === 'event' ? 'event detected' : 'authority + context')
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
    
    // Generate appropriate responses for non-TCG content
    async generateNonTCGResponse(username, tweetContent, contextAnalysis, strategy, visualData) {
        // Use adaptive tone generator if we have detailed context
        if (contextAnalysis.details && this.adaptiveToneGenerator) {
            try {
                const adaptiveResponse = this.adaptiveToneGenerator.generateResponse(
                    contextAnalysis,
                    contextAnalysis.details,
                    strategy
                );
                
                console.log(`   🎨 Adaptive response: ${adaptiveResponse.tone} tone, energy ${adaptiveResponse.energy}`);
                return adaptiveResponse.response;
            } catch (error) {
                console.log('   ⚠️ Adaptive generation failed, using fallback');
            }
        }
        
        // Fallback to static responses
        const responses = {
            videoGame: [
                "yo that's sick! what route you hunting on?",
                "shiny hunting hits different fr. how many encounters?",
                "that gameplay though! what's your team looking like?",
                "nice progress! scarlet/violet has been fire for shiny hunting",
                "the grind is real! what method you using?"
            ],
            fanArt: [
                "this art style goes crazy! love the details",
                "yo the colors on this are fire! great work",
                "clean design! the shading is on point",
                "this is heat! love your take on it",
                "the vibes are immaculate! keep creating"
            ],
            anime: [
                "this episode was wild! horizons keeps getting better",
                "that scene hit different! what's been your fav episode?",
                "the animation this season has been insane",
                "facts! this arc is going crazy",
                "no cap this series has been delivering"
            ],
            merchandise: [
                "that's a solid pickup! where'd you snag it?",
                "the quality on these is always fire",
                "nice haul! pokemon center always delivers",
                "that collection is growing! display setup clean",
                "bet that looks fire on display!"
            ],
            personal: [
                "good vibes! hope your day is going well",
                "appreciate you! pokemon community stays positive",
                "right back at you! let's get it",
                "facts! always good energy here",
                "love to see it! keep spreading the positivity"
            ]
        };
        
        // Get appropriate response set
        const responseSet = responses[contextAnalysis.primary] || [
            "yo that's dope! love seeing all types of pokemon content",
            "fire content! the community stays creative",
            "this goes hard! appreciate you sharing",
            "nice share! always here for pokemon vibes",
            "love the energy! pokemon hits different"
        ];
        
        // Pick random response
        const baseResponse = responseSet[Math.floor(Math.random() * responseSet.length)];
        
        // If it's a question, make sure we're being helpful
        if (strategy.isQuestion) {
            console.log('   ❓ Detected question, ensuring helpful response');
        }
        
        return baseResponse;
    }
    
    // Determine if this is a social/community post that benefits from personality
    isSocialCommunityPost(text, visualData, sentiment) {
        const textLower = text.toLowerCase();
        
        // Social indicators that benefit from enthusiastic responses
        const socialPatterns = [
            // Personal achievements
            /\b(finally|got|pulled|hit|found|completed|finished)\b/i,
            // Showing off
            /\b(collection|binder|display|showcase|mail\s*day|haul|pickup)\b/i,
            // Streaming/content creation
            /\b(stream|streaming|video|youtube|twitch|content|channel|live)\b/i,
            // Community celebration
            /\b(congrat|thanks|appreciate|love|excited|happy|blessed)\b/i,
            // Personal stories
            /\b(story|journey|started|remember|nostalgic|childhood|years?\s+ago)\b/i,
            // Social engagement
            /\b(anyone|who else|what do you|thoughts|opinion|favorite)\b/i
        ];
        
        // Check if it matches social patterns
        const matchesSocial = socialPatterns.some(pattern => pattern.test(textLower));
        
        // Additional checks
        const isPersonalStory = textLower.includes('my') && (
            textLower.includes('collection') || 
            textLower.includes('binder') || 
            textLower.includes('first') ||
            textLower.includes('favorite')
        );
        
        const isShowingOff = visualData?.analysis?.contentType === 'showcase' || 
                            visualData?.analysis?.contentType === 'multiple_showcase';
        
        const isPositiveSentiment = sentiment?.sentiment === 'positive' || 
                                   sentiment?.sentiment === 'very_positive';
        
        // Don't use social mode for:
        // - Price questions (handled separately)
        // - Technical questions
        // - Negative sentiment
        // - Scam/suspicious content
        const technicalIndicators = /\b(rule|ruling|judge|legal|ban|errata|reprint|authentic|fake)\b/i;
        const isTechnical = technicalIndicators.test(textLower);
        
        return (matchesSocial || isPersonalStory || isShowingOff) && 
               !isTechnical && 
               (isPositiveSentiment || sentiment?.sentiment === 'neutral');
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
                
                // Create model with key rotation
                let threadModel;
                try {
                    threadModel = await keyManager.createModel("gemini-1.5-flash");
                } catch (keyError) {
                    // If no keys available, throw immediately to avoid retry loop
                    if (keyError.message === 'No available Gemini API keys') {
                        throw keyError;
                    }
                    throw keyError;
                }
                const result = await threadModel.generateContent(prompt);
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
                
                // Analyze this response for learning
                if (data.tweetId && this.conversationAnalyzer.activeConversations.has(data.tweetId)) {
                    const analysis = await this.conversationAnalyzer.analyzeUserResponse(
                        data.tweetId,
                        data.tweetText,
                        data.username
                    );
                    
                    if (analysis) {
                        console.log(`   📈 Response sentiment: ${analysis.sentiment}, outcome: ${analysis.outcome}`);
                    }
                }
                
                // Navigate to the reply (this now includes thread context)
                const tweetElement = await this.conversationChecker.navigateToReply(data);
                if (!tweetElement) continue;
                
                // Generate thread-aware conversational response
                let response;
                if (data.threadContext) {
                    // Use full thread context for better response
                    try {
                        response = await this.generateThreadAwareResponse(
                            data.username,
                            data.tweetText,
                            data.threadContext,
                            data.visualData
                        );
                    } catch (error) {
                        console.log(`   ⚠️ Thread response failed: ${error.message}`);
                        // Fallback to regular response
                        response = await this.generateContextualResponse(
                            data.username,
                            data.tweetText,
                            false
                        );
                    }
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
                this.visualAnalyzer = new VisualAnalyzer(this.page, { 
                    lmstudio: this.lmstudio,
                    geminiKeys: GEMINI_API_KEYS 
                });
                console.log('💬 Conversation checker initialized');
                
                // Initialize following monitor
                this.followingMonitor = new FollowingMonitor(this.page);
                console.log('👥 Following monitor initialized');
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
                
                // Check if it's time for an original market post every 10 searches
                if (searchCounter > 0 && searchCounter % 10 === 0 && this.authorityIntegration?.initialized) {
                    if (this.authorityIntegration.shouldPostOriginal()) {
                        console.log('📊 Checking for scheduled market report...');
                        const originalPost = await this.authorityIntegration.generateOriginalPost();
                        if (originalPost) {
                            console.log('📢 Posting market report...');
                            await this.postOriginalTweet(originalPost);
                        }
                    }
                }
                
                // Check Following timeline every 5 searches (more frequent for testing)
                if (searchCounter > 0 && searchCounter % 5 === 0 && this.followingMonitor) {
                    if (this.followingMonitor.shouldCheckFollowing()) {
                        console.log('\n👀 Time to check what influencers are saying...');
                        try {
                            const signals = await this.followingMonitor.checkFollowingTimeline();
                            
                            // If we found strong signals, maybe reference them later
                            if (signals.length > 0) {
                                const topSignal = signals[0];
                                console.log(`   📊 Top signal: ${topSignal.cards[0]} - ${topSignal.patterns[0].type}`);
                            }
                            
                            // Add a natural delay after checking following
                            await this.sleep(5000 + Math.random() * 5000);
                        } catch (error) {
                            console.log('   ⚠️ Following check failed:', error.message);
                        }
                    }
                }
                
                // Save learning data and cleanup every 20 searches
                if (searchCounter > 0 && searchCounter % 20 === 0) {
                    console.log('🤖 Saving learning insights...');
                    await this.learningEngine.saveLearningData();
                    this.conversationAnalyzer.cleanup();
                    
                    // Show quick learning stats
                    const hotTopics = this.learningEngine.getHotTopics(3);
                    if (hotTopics.length > 0) {
                        console.log(`   🔥 Trending: ${hotTopics.map(t => t.topic).join(', ')}`);
                    }
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
            if (data.username.toLowerCase() === 'glitchygrade') {
                return false;
            }
            
            // Check if this is a reply to our bot (allow conversations)
            const isReplyToUs = data.text.toLowerCase().includes('@glitchygrade');
            
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
            
            // IMPROVED CHECK: Accept ALL Pokemon content, not just TCG
            const textLower = data.text.toLowerCase();
            
            // Broader Pokemon indicators (not just TCG)
            const pokemonIndicators = [
                // General Pokemon terms
                'pokemon', 'pokémon', '#pokemon', 'pkmn',
                
                // TCG specific
                'tcg', 'psa', 'bgs', 'cgc', 'pull', 'pulls', 'pulled', 
                'pack', 'booster', 'etb', 'collection', 'binder', 'slab', 
                'grade', 'graded', 'vmax', 'vstar', 'gx', 'ex', 'alt art',
                
                // Video game terms
                'shiny', 'hunt', 'hunting', 'caught', 'catch', 'battle',
                'trainer', 'gym', 'elite four', 'pokemon go', 'legends',
                'scarlet', 'violet', 'switch', 'nintendo',
                
                // Anime/Show terms
                'anime', 'episode', 'horizons', 'ash', 'team rocket',
                
                // Fan content
                'fanart', 'art', 'drawing', 'commission', 'oc',
                
                // Pokemon names (expanded list)
                'charizard', 'pikachu', 'umbreon', 'gengar', 'lugia', 
                'rayquaza', 'mewtwo', 'mew', 'eevee', 'sylveon', 'garchomp',
                'greninja', 'lucario', 'blaziken', 'sceptile', 'dragonite',
                'gyarados', 'alakazam', 'machamp', 'blastoise', 'venusaur',
                
                // Set names
                'evolving skies', 'crown zenith', 'lost origin', 'silver tempest',
                'surging sparks', 'paradox rift', 'paldea', 'obsidian flames',
                'stellar crown', 'base set'
            ];
            
            const hasPokemonIndicator = pokemonIndicators.some(indicator => textLower.includes(indicator));
            
            if (!hasPokemonIndicator) {
                // Only skip if no Pokemon indicators AND no images
                if (!data.hasImages && !data.hasVideos) {
                    console.log(`   ⏭️ Not Pokemon related: "${data.text.substring(0, 50)}..."`);
                    return false;
                }
                // With media, continue - might be Pokemon visual content
                console.log(`   📸 No Pokemon text but has media, analyzing context...`);
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
                if (data.hasImages || data.hasVideos) s += 1;                      // visual content
                if (filterResult.quality >= 2) s += 1;                             // quality gate
                if (hasPokemonIndicator) s += 1;                                   // clearly Pokemon related
                return s;
            }
            const score = computeValueScore();
            
            // Lower threshold to be more inclusive
            if (score < 2) return false; // skip only very low quality
            
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
    
    async postOriginalTweet(text) {
        try {
            console.log('📢 Posting original tweet...');
            
            // Navigate to home if not already there
            const currentUrl = this.page.url();
            if (!currentUrl.includes('/home')) {
                await this.page.goto('https://x.com/home', {
                    waitUntil: 'domcontentloaded',
                    timeout: 20000
                });
                await this.sleep(3000);
            }
            
            // Click the compose tweet button
            const composeButton = await this.page.$('a[href="/compose/post"], a[href="/compose/tweet"]');
            if (composeButton) {
                await composeButton.click();
            } else {
                // Alternative: Click the "What's happening?" input
                const whatsHappening = await this.page.$('[data-testid="tweetTextarea_0"]');
                if (whatsHappening) {
                    await whatsHappening.click();
                }
            }
            
            await this.sleep(2000);
            
            // Find the tweet text area
            const tweetBox = await this.page.waitForSelector(
                'div[data-testid="tweetTextarea_0"]',
                { timeout: 10000 }
            ).catch(() => null);
            
            if (!tweetBox) {
                console.log('   ⚠️ Could not find tweet box');
                return false;
            }
            
            // Type the tweet
            await this.humanType(tweetBox, text);
            await this.sleep(2000);
            
            // Send the tweet
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
            
            // Check if tweet was posted successfully
            const success = await this.page.$('div[data-testid="tweetTextarea_0"]')
                .then(el => el === null);
            
            if (success) {
                console.log('   ✅ Original market report posted!');
                return true;
            }
            
            console.log('   ⚠️ Failed to post original tweet');
            await this.page.keyboard.press('Escape');
            return false;
            
        } catch (error) {
            console.error('❌ Error posting original tweet:', error);
            return false;
        }
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
            let response;
            if (threadContext) {
                try {
                    response = await this.generateThreadAwareResponse(data.username, data.text, threadContext, visualData);
                } catch (error) {
                    console.log(`   ⚠️ Thread response failed: ${error.message}`);
                    response = await this.generateContextualResponse(
                        data.username, 
                        data.text, 
                        data.hasImages,
                        visualData
                    );
                }
            } else {
                response = await this.generateContextualResponse(
                    data.username, 
                    data.text, 
                    data.hasImages,
                    visualData
                );
            }
            
            // Log vision performance after response generation
            if (this.visionMonitor && process.env.ENABLE_VISION_API === 'true' && visualData && visualData.analysis) {
                await this.visionMonitor.logVisionResult({
                    username: data.username,
                    text: data.text,
                    hasImage: data.hasImages,
                    visionEnabled: this.visualAnalyzer.enableVisionAPI,
                    analysisResult: visualData.visionAnalysis,
                    botResponse: response // Now we have the actual response
                });
            }
            
            // Track this interaction for learning
            const interaction = {
                username: data.username,
                message: data.text,
                botResponse: response,
                hasImages: data.hasImages,
                sentiment: this.sentimentAnalyzer.analyzeSentiment(data.text),
                topics: this.contextAnalyzer.extractTopics(data.text),
                timestamp: Date.now()
            };
            
            // Learn from this interaction
            await this.learningEngine.learnFromInteraction(interaction);
            
            // Extract tweet ID for conversation tracking
            const tweetId = await tweet.evaluate(el => {
                const link = el.querySelector('a[href*="/status/"]');
                return link ? link.href.split('/status/')[1] : null;
            });
            
            // Scroll to tweet
            await tweet.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
            await this.sleep(2000);
            
            // Reply
            let replyButton;
            try {
                replyButton = await tweet.$('button[data-testid="reply"]');
                if (!replyButton) return false;
                
                await replyButton.click();
                console.log(`   💭 Replying...`);
            } catch (error) {
                if (error.message.includes('Node is detached')) {
                    console.log(`   ⚠️ Tweet element detached, skipping...`);
                    return false;
                }
                throw error;
            }
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
                
                // Start tracking this conversation for outcomes
                if (tweetId) {
                    this.conversationAnalyzer.startConversation(tweetId, {
                        ...interaction,
                        responseId: `resp_${Date.now()}`
                    });
                }
                
                // Update community trends
                const topics = interaction.topics || [];
                for (const topic of topics) {
                    await this.learningEngine.updateCommunityTrends(
                        topic, 
                        interaction.sentiment.sentiment || 'neutral'
                    );
                }
                
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
        
        // Show learning insights
        if (this.learningEngine) {
            console.log('\n🤖 === LEARNING INSIGHTS ===');
            const insights = this.learningEngine.generateInsights();
            
            console.log(`   User Profiles: ${insights.userInsights.totalUsers}`);
            console.log(`   Avg Formality: ${(insights.userInsights.avgFormality * 100).toFixed(0)}%`);
            console.log(`   High Value Users: ${insights.userInsights.highValueUsers.length}`);
            console.log(`   Prediction Accuracy: ${insights.marketInsights.predictionAccuracy}`);
            console.log(`   Hot Topics: ${this.learningEngine.getHotTopics(3).map(t => t.topic).join(', ')}`);
            
            // Conversation outcomes
            if (this.conversationAnalyzer) {
                const convStats = this.conversationAnalyzer.getConversationStats();
                console.log(`\n   Conversation Outcomes:`);
                console.log(`   • Successful: ${convStats.successful}`);
                console.log(`   • Engaged: ${convStats.engaged}`);
                console.log(`   • Success Rate: ${convStats.successRate}`);
                console.log(`   • Avg Exchanges: ${convStats.avgExchanges.toFixed(1)}`);
            }
            
            // Show recommendations
            if (insights.recommendations.length > 0) {
                console.log(`\n   💡 Recommendations:`);
                insights.recommendations.forEach(rec => console.log(`   • ${rec}`));
            }
        }
        
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
            // Save all learning data before shutdown
            if (this.learningEngine) {
                console.log('💾 Saving final learning data...');
                await this.learningEngine.saveLearningData();
            }
            
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