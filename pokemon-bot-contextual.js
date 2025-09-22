// Load environment variables
require('dotenv').config();

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
const EngagementOutcomeTracker = require('./features/engagement-outcome-tracker');
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
const ResponseQualityChecker = require('./features/response-quality-checker');
const LearningEngine = require('./features/learning-engine');
const ConversationAnalyzer = require('./features/conversation-analyzer');
const SelfAnalysisEngine = require('./features/self-analysis-engine');
const AdaptiveStrategyEngine = require('./features/adaptive-strategy-engine');
const AdaptiveResponseGenerator = require('./features/adaptive-response-generator');
const FollowingMonitor = require('./features/following-monitor');
const BetterContextAnalyzer = require('./features/better-context-analyzer');
const AdaptiveToneGenerator = require('./features/adaptive-tone-generator');
const ContextIntelligence = require('./features/context-intelligence');
const ResponseExamples = require('./features/response-examples');
const APIRateLimiter = require('./features/api-rate-limiter');
const ConversationFollowUp = require('./features/conversation-follow-up');
const IntelligentResponseGenerator = require('./features/intelligent-response-generator');
const UserInteractionHistory = require('./features/user-interaction-history');
const RedditMonitor = require('./features/reddit-monitor');
const AuthorityContent = require('./features/authority-content');
const ContentVerifier = require('./features/content-verifier');
const SetVarietyManager = require('./features/set-variety-manager');
const PokemonTCGAPI = require('./features/pokemontcg-api');
const APIEnhancedResponses = require('./features/api-enhanced-responses');

puppeteer.use(StealthPlugin());

// Use environment variable if set, otherwise use first key from rotation
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw';
if (!GEMINI_API_KEY) throw new Error('No Gemini API keys available');

// Multiple Gemini API keys for rotation
const GEMINI_API_KEYS = [
    'AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw',  // Key 1 (original)
    'AIzaSyClg--pgWqpAny17vRbiWokCC7L_YjEFkQ',  // Key 2 
    'AIzaSyDnlBhkg5GO2O85O-bfVcyCnGa29boEUh8',  // Key 3
    'AIzaSyBQIdvgMyPt0br9D0oa5kEwR147UdejTb0'   // Key 4 (newest)
].filter(key => key && key.length > 0);

// Create key manager for rotation
const GeminiKeyManager = require('./features/gemini-key-manager');
const keyManager = new GeminiKeyManager(GEMINI_API_KEYS);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); // Keep for backward compatibility

// Model will be created with key rotation in generateThreadAwareResponse

// Helper function to extract natural description from visual data
function extractNaturalDescription(visualData) {
    if (!visualData) return null;
    
    // Try known fields first
    const direct = visualData.visionAnalysis?.naturalDescription ||
                   visualData.naturalDescription ||
                   visualData.videoAnalysis?.naturalDescription ||
                   visualData.visionAnalysis?.context;
    if (direct) return direct;
    
    // Fallback: synthesize from recognized cards if present
    const cards = visualData.recognizedCards || visualData.visionAnalysis?.cards || [];
    if (Array.isArray(cards) && cards.length > 0) {
        const top = cards.slice(0, 2).map(c => {
            const name = c.name || 'a card';
            const set = c.set || c.series || c.expansion || null;
            return set ? `${name} (${set})` : name;
        }).join(' and ');
        return `cards shown: ${top}`;
    }
    
    // Fallback: use basic media cues
    if (visualData.hasImage) return 'a Pokemon card photo';
    if (visualData.hasVideo) return 'a Pokemon card video';
    
    return null;
}

// Helper function to clamp tweets to 280 chars consistently
function clampTweet(s, max = 280) {
    if (!s) return '';
    
    // Remove any confidence markers first
    const conf = (s.match(/Confidence:\s*\d{1,3}%/i) || [])[0];
    let body = conf ? s.replace(/Confidence:\s*\d{1,3}%/i, '').trim() : s.trim();
    
    // If already under limit, return as-is
    if (body.length <= max) return body;
    
    // Try to cut at sentence boundary first
    const sentences = body.match(/[^.!?]+[.!?]+/g) || [body];
    let result = '';
    
    for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if ((result + (result ? ' ' : '') + trimmedSentence).length <= max) {
            result += (result ? ' ' : '') + trimmedSentence;
        } else if (result.length === 0) {
            // First sentence is too long, try to cut at natural breakpoints
            // Look for conjunctions or punctuation to break at
            const breakPoints = [
                ', but', ', and', ', while', ', though', ', however',
                '. ', '! ', '? ', '; ', ' - ', ' — ', ', ',
                ' (', ') '
            ];
            
            let bestBreak = -1;
            let bestBreakPoint = '';
            
            // Find the latest natural break point that fits
            for (const breakPoint of breakPoints) {
                const lastIndex = trimmedSentence.lastIndexOf(breakPoint);
                if (lastIndex > bestBreak && lastIndex > 0 && lastIndex < max - 20) {
                    bestBreak = lastIndex;
                    bestBreakPoint = breakPoint;
                }
            }
            
            if (bestBreak > 0) {
                // Cut at natural break point
                result = trimmedSentence.substring(0, bestBreak).trim();
                // Add appropriate ending
                if (bestBreakPoint.includes(',')) {
                    result += '.';
                } else if (!result.match(/[.!?]$/)) {
                    result += '.';
                }
            } else {
                // No good break point, cut at word boundary
                const words = trimmedSentence.split(/\s+/);
                result = '';
                for (const word of words) {
                    if ((result + (result ? ' ' : '') + word).length <= max - 1) {
                        result += (result ? ' ' : '') + word;
                    } else {
                        break;
                    }
                }
                // Add period if it doesn't end with punctuation
                if (!result.match(/[.!?]$/)) {
                    result += '.';
                }
            }
            break;
        } else {
            // We have content and can't fit next sentence
            break;
        }
    }
    
    // Final cleanup - remove incomplete thoughts
    result = result.replace(/\s+(Could|Would|Should|Might|Maybe|Perhaps|Also|Plus|And|But|Or)\s*\.?$/i, '.');
    result = result.replace(/\s+\.\s*$/, '.');
    
    // Remove any trailing hashtags if still over limit
    if (result.length > max) {
        result = result.replace(/#\w+\s*$/, '').trim();
    }
    
    return result.substring(0, max);
}

// Sanitize reply text to avoid hashtags and @mentions
function sanitizeReplyText(text) {
    if (!text) return '';
    let t = String(text);
    // Remove hashtags
    t = t.replace(/(^|\s)#[^\s#@]+/g, '$1').trim();
    // Remove @mentions (tokens starting with @)
    t = t.replace(/(^|\s)@[^\s#@]+/g, '$1').trim();
    // Collapse extra spaces
    t = t.replace(/\s{2,}/g, ' ').trim();
    return t;
}

// Humanize reply per style preferences
function humanizeReply(text, opts = {}, originalText = '') {
    if (!text) return '';
    let t = String(text).trim();
    const options = Object.assign({
        minLen: 80,
        maxLen: 140,
        maxSentences: 2,
        slangLevel: 'medium', // none | light | medium
        allowEmoji: false,
        maxExclamations: 1,
        questionChance: 0.02, // Very low - only 2% chance to avoid stupid questions
        voice: 'collector_casual'
    }, opts);
    
    // 1) Remove emojis and collapse punctuation
    t = t
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '') // remove emoji/symbols
        .replace(/!{2,}/g, '!')
        .replace(/\?{2,}/g, '?')
        .replace(/\.{4,}/g, '...')
        .replace(/\s{2,}/g, ' ')
        .trim();
    
    // 2) Limit exclamations
    const exclamations = (t.match(/!/g) || []).length;
    if (exclamations > options.maxExclamations) {
        // Keep first, drop the rest
        let kept = false;
        t = t.replace(/!/g, () => (kept ? '' : ((kept = true), '!')));
    }
    
    // 3) Remove AI-sounding phrases
    const aiPhrases = [
        /\bas an ai\b/gi,
        /\bi am an ai\b/gi,
        /\bi'm an ai\b/gi,
        /\bi am a bot\b/gi,
        /\bi'm a bot\b/gi,
        /\bi cannot\b/gi,
        /\bi can not\b/gi,
        /\bi do not have the capability\b/gi
    ];
    aiPhrases.forEach(rx => { t = t.replace(rx, '').trim(); });
    
    // 3b) Remove generic openers (strengthened)
    const genericOpeners = [
        /^(great|nice|awesome|amazing|cool|sweet|fire|lit|dope)\s+(post|card|pull|haul|hit)[.!]?\s*/i,
        /^thanks\s+for\s+(sharing|posting|showing)[.!]?\s*/i,
        /^(wow|whoa|dang|damn|nice|cool|awesome)\s*[!]*\s*/i,
        /^(totally|definitely|absolutely)\s*[!]*\s*/i
    ];
    genericOpeners.forEach(rx => { t = t.replace(rx, '').trim(); });

    // 3c) Remove action-claim phrases (no “following/liked/entered” claims)
    const actionClaims = [
        /(i\s*(just\s*)?)?follow(ed)?\s+(you|back)?[^.!?]*[.!?]?/gi,
        /following\s+(you\s+)?(now)?[^.!?]*[.!?]?/gi,
        /i\s*(just\s*)?liked[^.!?]*[.!?]?/gi,
        /i\s*(just\s*)?entered[^.!?]*[.!?]?/gi,
        /good\s+luck(\s+to\s+everyone)?(\s+entering)?[^.!?]*[.!?]?/gi
    ];
    actionClaims.forEach(rx => { t = t.replace(rx, '').trim(); });
    
    // 4) Medium slang sprinkling (light touch)
    if (options.slangLevel === 'medium') {
        // Replace a few formal terms
        t = t
            .replace(/\bhowever\b/gi, 'but')
            .replace(/\btherefore\b/gi, 'so')
            .replace(/\bnevertheless\b/gi, 'still')
            .replace(/\bmoreover\b/gi, 'also');
        // Optional casual filler if short and not ending with question
        const rnd = Math.random();
        if (rnd < 0.2 && t.length < options.maxLen - 8 && !/[?!.]$/.test(t)) {
            t += ' tbh';
        } else if (rnd >= 0.2 && rnd < 0.35 && t.length < options.maxLen - 8 && !/[?!.]$/.test(t)) {
            t += ' low-key';
        }
    }
    
    // 5) Enforce sentence cap
    const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length > options.maxSentences) {
        t = sentences.slice(0, options.maxSentences).join(' ');
    }
    
    // 6) Enforce length range (pad if too short)
    if (t.length < options.minLen && t.length > 10) {
        // Pad with a natural follow-up question or detail
        const lowerOrig = String(originalText || '').toLowerCase();
        const hasQuestion = /\?/g.test(t);
        if (!hasQuestion && t.length + 10 <= options.maxLen) {
            let q = null;
            if (/grade|slab|psa|cgc|bgs/.test(lowerOrig)) q = 'grading it?';
            else if (/pull|pulled|hit|etb|booster|box|opened/.test(lowerOrig)) q = 'best pull?';
            else if (/sell|for sale|fs:|wtb|wts|price|\$\d+/.test(lowerOrig)) q = 'keeping or selling?';
            else q = 'what set?';
            t = /[.?!]$/.test(t) ? `${t} ${q}` : `${t}. ${q}`;
        }
        // If still short, add "Nice find!" or similar as last resort
        if (t.length < options.minLen && t.length + 12 <= options.maxLen) {
            t = `Nice find! ${t}`;
        }
    }

    // 7) Sometimes add one thoughtful follow-up question (only if not already padded, context warrants it, and post invites conversation)
    const lowerOrig = String(originalText || '').toLowerCase();
    const hasQuestion = /\?/g.test(t);
    const postInvitesConversation = /\?|\b(what|how|why|should|think|help|advice|opinions)\b/i.test(lowerOrig);
    if (!hasQuestion && Math.random() < options.questionChance && t.length + 10 <= options.maxLen && postInvitesConversation) {
        let q = null;
        // Only ask specific questions if there's clear missing info AND the post seems open to it
        if (/grade|slab|psa|cgc|bgs/.test(lowerOrig) && !/graded|slabbed|psa|cgc|bgs|\d+/.test(lowerOrig)) {
            q = 'grading it?';
        } else if (/pull|pulled|hit|etb|booster|box|opened/.test(lowerOrig) && !/charizard|moonbreon|umbreon|alt art|specific card/.test(lowerOrig) && /what|which|favorite/.test(lowerOrig)) {
            q = 'best pull?';
        } else if (/sell|for sale|fs:|wtb|wts|price|\$\d+/.test(lowerOrig) && !/keeping|selling|trade|\$\d+/.test(lowerOrig)) {
            q = 'keeping or selling?';
        } else if (!/set:|151|paradox|obsidian|evolving skies|crown zenith/.test(lowerOrig) && /what|which/.test(lowerOrig)) {
            q = 'what set?';
        }
        if (q) {
            t = /[.?!]$/.test(t) ? `${t} ${q}` : `${t}. ${q}`;
        }
    }
    
    // 7) Trim length to range
    if (t.length > options.maxLen) {
        t = clampTweet(t, options.maxLen);
    }
    // Prefer >= minLen but don't force padding; keep natural
    
    // 8) Final cleanup of spaces and punctuation
    t = t.replace(/\s{2,}/g, ' ').trim();
    
    return t;
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
        
        // Track tweet IDs we've seen to avoid analyzing same tweets repeatedly
        this.seenTweetIds = new Map(); // Maps tweet ID to count of times seen
        
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
        this.engagementOutcomeTracker = new EngagementOutcomeTracker();
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
        this.setVarietyManager = new SetVarietyManager();
        this.pokemonTCGAPI = new PokemonTCGAPI();
        this.apiEnhancedResponses = new APIEnhancedResponses(this.pokemonTCGAPI, this.setVarietyManager);
        this.responseValidator = new ResponseValidator();
        this.responseQualityChecker = new ResponseQualityChecker();
        
        // Initialize learning systems
        this.learningEngine = new LearningEngine();
        this.conversationAnalyzer = new ConversationAnalyzer(this.learningEngine);
        this.adaptiveGenerator = new AdaptiveResponseGenerator(this.learningEngine);
        
        // Initialize self-awareness systems
        this.selfAnalysis = new SelfAnalysisEngine();
        this.adaptiveStrategy = new AdaptiveStrategyEngine(this.selfAnalysis);
        
        // Initialize following monitor (will set page later)
        this.followingMonitor = null;
        
        // Initialize better context analyzer
        this.betterContextAnalyzer = new BetterContextAnalyzer();
        this.adaptiveToneGenerator = new AdaptiveToneGenerator();
        this.contextIntelligence = new ContextIntelligence();
        this.responseExamples = new ResponseExamples();
        this.apiRateLimiter = new APIRateLimiter();
        
        // Initialize intelligent response generator
        this.intelligentResponseGenerator = new IntelligentResponseGenerator(this.setVarietyManager);
        
        // Initialize user interaction history
        this.userInteractionHistory = new UserInteractionHistory();
        
        // Initialize conversation follow-up system
        this.conversationFollowUp = null; // Will initialize after page is ready
        
        // Initialize Reddit monitor for cross-platform intelligence
        this.redditMonitor = new RedditMonitor();
        
        // Initialize Authority content generator (will pass reddit monitor later)
        this.authorityContent = new AuthorityContent();
        
        // Initialize Content Verifier for fact-checking
        this.contentVerifier = null; // Will initialize after other services are ready
        
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
        
        // Track tweet IDs we've already replied to (session-level)
        this.repliedTweetIds = new Set();
        // Fallback dedupe by username + text prefix when tweetId is missing
        this.repliedTextKeys = new Set();
        // Track recent replies to prevent spamming same user
        this.recentReplies = new Map(); // username -> timestamp of last reply
        // Track text content hashes to prevent replying to same content multiple times
        this.repliedContentHashes = new Set();
        // Track tweets processed this session to prevent infinite loops
        this.processedTweetsThisSession = new Set();
        
        // Start Reddit monitoring in background
        this.startRedditMonitoring();
    }

    async findTweetByUserAndText(username, textStartsWith) {
        try {
            const handle = await this.page.evaluateHandle((u, t) => {
                const candidates = document.querySelectorAll('article[data-testid="tweet"], [data-testid="tweet"]');
                for (const el of candidates) {
                    const author = el.querySelector('[data-testid="User-Name"]')?.innerText || '';
                    const match = author.match(/@(\w+)/);
                    const user = match ? match[1] : null;
                    const tx = el.querySelector('[data-testid="tweetText"]')?.innerText || '';
                    if (user === u && tx && t && tx.startsWith(t.substring(0, Math.min(40, t.length)))) {
                        return el;
                    }
                }
                return null;
            }, username, textStartsWith);
            const element = handle.asElement();
            if (!element) return null;
            return element;
        } catch (_) {
            return null;
        }
    }

    // Helper function to clean text for JSON/API calls
    cleanTextForAPI(text) {
        if (!text) return '';
        return text
            .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '') // Remove unpaired high surrogates
            .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '') // Remove unpaired low surrogates
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Remove emoticons
            .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Remove misc symbols
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Remove transport/map symbols
            .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Remove alchemical symbols
            .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Remove geometric shapes
            .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Remove supplemental arrows
            .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Remove supplemental symbols
            .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Remove chess symbols
            .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Remove symbols and pictographs
            .replace(/[\u{2600}-\u{26FF}]/gu, '') // Remove misc symbols
            .replace(/[\u{2700}-\u{27BF}]/gu, '') // Remove dingbats
            .trim();
    }

    async generateThreadAwareResponse(username, latestMessage, threadContext, visualData = null) {
        try {
            // Clean text inputs
            const cleanUsername = this.cleanTextForAPI(username);
            const cleanLatestMessage = this.cleanTextForAPI(latestMessage);
            
            // Build simple context - just show Gemini the raw conversation
            let context = `You're replying to @${cleanUsername} on Twitter about Pokemon.\n\n`;
            
            // Add thread history if available
            if (threadContext?.fullConversation?.length > 0) {
                context += `Here's the conversation so far:\n`;
                // Show MORE messages for better context (up to 10 instead of 5)
                const recentMessages = threadContext.fullConversation.slice(-10);
                recentMessages.forEach(msg => {
                    const cleanMsgUsername = this.cleanTextForAPI(msg.username);
                    const cleanMsgText = this.cleanTextForAPI(msg.text);
                    context += `@${cleanMsgUsername}: "${cleanMsgText}"\n`;
                });
                
                // Add topic context if available
                if (threadContext.mainTopic && threadContext.mainTopic !== 'Pokemon TCG') {
                    context += `\nMain topic being discussed: ${threadContext.mainTopic}\n`;
                }
            } else {
                context += `They said: "${cleanLatestMessage}"\n`;
            }
            
            // Add vision context if available
            const naturalDescription = extractNaturalDescription(visualData);
            if (naturalDescription) {
                context += `\nThey also shared an image showing: ${naturalDescription}\n`;
            }
            
            // Enhanced context-aware prompt
            const prompt = `${context}

You're a knowledgeable Pokemon TCG collector replying to this conversation.

Tone rules:
- 1–2 sentences, aim ~80–140 chars
- Use contractions and casual phrasing; no formal disclaimers
- Limit punctuation (≤1 "!") and avoid emojis
- Sometimes ask one natural follow-up question (not every time)

Content rules:
- Do NOT include hashtags or @mentions
- Never say things like "as an AI" or meta commentary
- Mirror a specific detail from their text or image
- Avoid generic openers like "Great post" or "Thanks for sharing"
- Keep focused; no over-explaining
${naturalDescription ? '- You can see their image; reference a specific visible detail' : ''}

Reply naturally and contextually in a collector-casual voice:`;

            console.log('   🧠 Enhanced context-aware prompt created');
            console.log('   📋 Context being sent to Gemini:');
            console.log('   ', context.split('\n').slice(0, 6).join('\n    ')); // Show more context lines
            if (threadContext?.fullConversation?.length > 0) {
                console.log(`   📊 Thread depth: ${threadContext.fullConversation.length} messages`);
                console.log(`   🎯 Topic: ${threadContext.mainTopic || 'General Pokemon TCG'}`);
            }
            if (naturalDescription) {
                console.log(`   👁️ Vision: "${naturalDescription.substring(0, 100)}..."`);
            }
            
            // Get response from Gemini
            const model = await keyManager.createModel("gemini-1.5-flash-8b");
            const result = await model.generateContent(prompt);
            let response = result.response.text().trim().replace(/^[\"']|[\"']$/g, '');
            
            // Remove any @mentions (we don't tag users in replies)
            if (response) {
                response = response.replace(/(^|\s)@[^\s#@]+/g, '$1').trim();
            }
            
            // Check for wrong mentions and remove them
            const wrongMentionPattern = /@(\w+)/g;
            const mentions = response.match(wrongMentionPattern) || [];
            for (const mention of mentions) {
                const mentionedUser = mention.substring(1).toLowerCase();
                // If this mention wasn't in the thread context, remove it
                if (mentionedUser !== cleanUsername.toLowerCase() && 
                    (!threadContext?.fullConversation?.some(msg => msg.username.toLowerCase() === mentionedUser))) {
                    console.log(`   ⚠️ Removing incorrect mention: ${mention}`);
                    response = response.replace(mention, '').trim();
                }
            }
            
            // Ensure it fits Twitter
            if (response.length > 280) {
                const shortenPrompt = `Make this shorter for Twitter (under 280 chars): "${response}"`;
                const shortenResult = await model.generateContent(shortenPrompt);
                response = shortenResult.response.text().trim().replace(/^[\"']|[\"']$/g, '');
            }
            
            console.log(`   🧵 [Thread-aware] "${response}"`);
            return response;
            
        } catch (error) {
            console.log(`   ⚠️ Thread response error: ${error.message}`);
            // Fall back to simpler response if thread-aware fails
            return null;
        }
    }

    // Deterministic Response Generator
    async generateContextualResponse(username, tweetContent, hasImages = false, visualData = null) {
        // 🧠 SELF-AWARE: Get adaptive strategies based on current performance
        const userProfile = this.learningEngine.userProfiles.get(username);
        const responseStrategy = this.adaptiveStrategy.getResponseStrategy({
            userProfile,
            topics: this.contextAnalyzer.extractTopics(tweetContent)
        });
        const engagementStrategy = this.adaptiveStrategy.getEngagementStrategy({
            userProfile,
            topics: this.contextAnalyzer.extractTopics(tweetContent)
        });
        
        console.log(`   🧠 Self-aware mode: confidence ${(responseStrategy.confidence * 100).toFixed(1)}%, tone: ${responseStrategy.tone}`);
        
        // Check if we should engage based on adaptive strategy
        if (!engagementStrategy.shouldEngage) {
            console.log(`   🎯 Adaptive strategy: skipping engagement - ${engagementStrategy.engagementReason}`);
            return null;
        }
        
        console.log(`   🎯 Adaptive strategy: engaging - ${engagementStrategy.engagementReason} (target: ${engagementStrategy.targetUsers})`);
        
        
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
        const contextStrategy = this.betterContextAnalyzer.getResponseStrategy(contextAnalysis, tweetContent);
        console.log(`   📑 Context: ${contextAnalysis.primary} (${contextStrategy.approach})`);
        
        // Enhanced check: If no Pokemon content at all, return null
        const enhancedContext = this.contextIntelligence.extractFullContext(tweetContent, visualData);
        const hasAnyPokemonContent = enhancedContext.pokemon.length > 0 || 
                                    enhancedContext.cards.sets.length > 0 || 
                                    enhancedContext.cards.specific.length > 0 ||
                                    /pokemon|pokémon/i.test(tweetContent);
        
        if (!hasAnyPokemonContent && contextAnalysis.primary === 'personal') {
            console.log(`   ⚠️ No Pokemon content detected in personal post, skipping response`);
            return null;
        }
        
        // FORCE vision-aware response when we have vision data
        const naturalDescription = extractNaturalDescription(visualData);
        if (naturalDescription && hasImages) {
            console.log(`   🎯 [VISION] Forcing vision-aware response path - ${naturalDescription.substring(0, 50)}...`);
            // Skip all the complex logic and go straight to AI generation with vision context
            return await this.tryAIModels(username, tweetContent, hasImages, {}, visualData);
        }
        
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
        
        // Check Reddit narratives if we have card context
        let redditNarrative = null;
        if (this.redditMonitor && cardContext?.cardName) {
            try {
                const topNarratives = await this.redditMonitor.getTopNarratives(5);
                redditNarrative = topNarratives.find(n => 
                    n.card.toLowerCase().includes(cardContext.cardName.toLowerCase())
                );
                if (redditNarrative) {
                    console.log(`   📡 Reddit sentiment: ${redditNarrative.dominantPattern.type} for ${redditNarrative.card}`);
                }
            } catch (error) {
                // Silent fail for Reddit check
            }
        }
        
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
        const existingUserProfile = this.learningEngine.userProfiles.get(username);
        const shouldUseAdaptive = existingUserProfile && existingUserProfile.interactions > 2;
        
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
        
        // HYBRID APPROACH: Use thread-aware for more posts to get better Gemini context
        // Expanded conditions: social posts OR any Pokemon TCG related content
        // Prefer thread-aware whenever there's a thread or media, unless vision explicitly failed on image
        const hasThread = !!(enhancedThreadContext && (enhancedThreadContext.fullConversation?.length || enhancedThreadContext.threadLength));
        const hasMedia = !!hasImages;
        const useThreadAware = (
            hasThread || hasMedia || isSocialPost ||
            contextAnalysis.primary === 'tcgContent' || 
            contextAnalysis.primary === 'salesTrading' ||
            contextAnalysis.primary === 'showcase' ||
            contextAnalysis.primary === 'priceInquiry'
        ) && !visionFailedOnImage && keyManager.getNextAvailableKey();
                              
        if (useThreadAware) {
            // Let thread-aware handle posts with enhanced Gemini context
            console.log('   💬 [Enhanced Context] Using thread-aware for better responses');
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
        // First try intelligent response generator for high-value responses
        let intelligentResponse = null;
        try {
            intelligentResponse = await this.intelligentResponseGenerator.generateResponse({
                text: tweetContent,
                username,
                hasImages,
                threadContext: enhancedThreadContext,
                sentiment
            });
            
            if (intelligentResponse && this.intelligentResponseGenerator.validateResponse(intelligentResponse)) {
                console.log(`   🧠 Generated intelligent response: "${intelligentResponse.substring(0, 60)}..."`);
                this.intelligentResponseGenerator.rememberConversation(username, cardContext?.topic || 'general', intelligentResponse);
            }
        } catch (error) {
            console.log(`   ⚠️ Intelligent response generation failed: ${error.message}`);
        }

        const composedResponse = await composeResponse({
            text: tweetContent,
            hasImages,
            threadContext: enhancedThreadContext,
            isEvent,
            authorityFn: async ({ text, hasImages, intents }) => {
                // Use intelligent response if available
                if (intelligentResponse && numbersOk && !isEvent) {
                    return {
                        primary: intelligentResponse,
                        secondary: '',
                        confidence: 0.95
                    };
                }
                
                // Try API-enhanced response for real-time data
                if (this.apiEnhancedResponses && cardEntities.length > 0 && numbersOk && !isEvent) {
                    try {
                        const apiResponse = await this.apiEnhancedResponses.generateEnhancedResponse({
                            text: tweetContent,
                            cardName: cardEntities[0].name,
                            setName: cardEntities[0].set,
                            hasImages
                        });
                        
                        if (apiResponse) {
                            console.log(`   🌐 API-enhanced response: "${apiResponse.substring(0, 60)}..."`);
                            return {
                                primary: apiResponse,
                                secondary: '',
                                confidence: 0.92
                            };
                        }
                    } catch (error) {
                        console.log(`   ⚠️ API response failed: ${error.message}`);
                    }
                }
                
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
                     (composedResponse && composedResponse.meta && composedResponse.meta.mode === 'event' ? 'event' : 'composed'),
            confidence: 'high',
            reason: isSocialPost && threadContext ? 'social/community post' :
                   (composedResponse && composedResponse.meta && composedResponse.meta.mode === 'event' ? 'event detected' : 'authority + context')
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
                    intents: composedResponse?.meta?.intents || []
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
            console.log(`   ❌ No response from ${strategy?.strategy || 'unknown'} strategy`);
            
            // Try AI models as last resort
            response = await this.tryAIModels(username, tweetContent, hasImages, feats, visualData);
        }

        // Let Gemini be natural - no sanitization
        
        // Skip quality checking - trust Gemini's natural responses
        
        return response ? clampTweet(response, 280) : null;
    }
    
    // Generate appropriate responses for non-TCG content
    async generateNonTCGResponse(username, tweetContent, contextAnalysis, strategy, visualData) {
        try {
            // Clean text to prevent encoding errors
            const cleanUsername = this.cleanTextForAPI(username);
            const cleanTweetContent = this.cleanTextForAPI(tweetContent);
            
            // Build context for Gemini
            let contextInfo = '';
            if (contextAnalysis.primary) {
                const contextMap = {
                    'videoGame': 'They\'re talking about Pokemon video games',
                    'fanArt': 'They\'re sharing Pokemon fan art',
                    'anime': 'They\'re discussing the Pokemon anime',
                    'merchandise': 'They\'re showing Pokemon merchandise',
                    'personal': 'They\'re making a personal/community post'
                };
                contextInfo = contextMap[contextAnalysis.primary] || 'They\'re posting about Pokemon';
            }
            
            // Ultra-simple prompt for maximum naturalness
            const naturalDescription = extractNaturalDescription(visualData);
            const prompt = `@${cleanUsername} tweeted: "${cleanTweetContent}"
${naturalDescription ? `Image shows: ${naturalDescription}` : ''}

Reply naturally (under 280 chars). End with a specific question about their post to encourage conversation.`;
            
            // Create model with key rotation
            const model = await keyManager.createModel("gemini-1.5-flash-8b");
            const result = await model.generateContent(prompt);
            let response = result.response.text().trim()
                .replace(/^[\"']|[\"']$/g, ''); // Remove quotes
            
            // Check if Gemini returned multiple options format
            if (response.includes('Reply options') || response.match(/^\d+\.\s*\(/m)) {
                console.log('   🔄 Gemini returned options, asking for single response...');
                const singlePrompt = `Instead of options, just give me your single best natural response to: "${cleanTweetContent}"
Keep it conversational and under 280 characters.`;
                const singleResult = await model.generateContent(singlePrompt);
                response = singleResult.response.text().trim().replace(/^[\"']|[\"']$/g, '');
            }
            
            // Let Gemini handle character limit naturally
            if (response.length > 280) {
                const shortenPrompt = `That's too long for Twitter. Make it shorter and keep it natural: "${response}"`;
                const shortenResult = await model.generateContent(shortenPrompt);
                response = shortenResult.response.text().trim().replace(/^[\"']|[\"']$/g, '');
            }
            
            console.log(`   🤖 [Gemini Non-TCG] "${response}"`);
            return response;
            
        } catch (error) {
            console.log(`   ⚠️ Gemini non-TCG generation failed: ${error.message}`);
            
            // Simple fallback for non-TCG content
            const fallbacks = {
                videoGame: "Nice gameplay! Love seeing Pokemon content from the games",
                fanArt: "This art looks amazing! Love the style",
                anime: "Great episode! The anime has been really good lately",
                merchandise: "Awesome pickup! That's a great addition",
                personal: "Love the Pokemon community vibes!"
            };
            
            const fallbackResponse = fallbacks[contextAnalysis.primary] || "Cool Pokemon content! Thanks for sharing";
            console.log(`   📌 [FALLBACK] Using generic response: "${fallbackResponse}" (context: ${contextAnalysis.primary || 'unknown'})`);
            if (visualData && visualData.visionAnalysis) {
                console.log(`   📌 [FALLBACK] Despite having vision data:`, {
                    hasNaturalDescription: !!visualData.visionAnalysis.naturalDescription,
                    cardCount: visualData.visionAnalysis.cards?.length || 0
                });
            }
            return fallbackResponse;
        }
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
    
    async tryAIModels(username, tweetContent, hasImages, features, visualData = null) {
        if (this.geminiFailures < 5) {
            try {
                // Clean text to prevent JSON encoding errors
                const cleanUsername = this.cleanTextForAPI(username);
                const cleanTweetContent = this.cleanTextForAPI(tweetContent);
                
                // Natural prompt for any Pokemon content
                const visualDescription = visualData?.visionAnalysis?.naturalDescription;
                const prompt = `You're chatting about Pokemon on Twitter.

@${cleanUsername} said: "${cleanTweetContent}"
${visualDescription ? `\nThey shared an image showing: ${visualDescription}` : (hasImages ? 'They shared an image too.' : '')}

What's your natural response? Keep it casual and appropriate. No hashtags, no "DM me", just genuine conversation. End with a specific question about their post to encourage conversation. ${visualDescription ? 'CRITICAL: You can SEE their image! Do NOT ask "what does it look like" or request to see things already shown. Comment on what you observe!' : ''} If it's inappropriate, either deflect with humor or don't reply. (Max 280 characters)`;
                
                // Create model with key rotation
                let model;
                try {
                    model = await keyManager.createModel("gemini-1.5-flash-8b");
                } catch (keyError) {
                    // If no keys available, throw immediately to avoid retry loop
                    if (keyError.message === 'No available Gemini API keys') {
                        throw keyError;
                    }
                    throw keyError;
                }
                const result = await model.generateContent(prompt);
                let response = result.response.text().trim()
                    .replace(/^[\"']|[\"']$/g, ''); // Only remove quotes
                
                // Check if Gemini returned multiple options format
                if (response.includes('Reply options') || response.match(/^\d+\.\s*\(/m)) {
                    console.log('   🔄 Gemini returned options, asking for single response...');
                    const singlePrompt = `Instead of options, just give me your single best natural response to: "${cleanTweetContent}"
Keep it conversational and under 280 characters.`;
                    const singleResult = await model.generateContent(singlePrompt);
                    response = singleResult.response.text().trim().replace(/^[\"']|[\"']$/g, '');
                }
                
                // Let Gemini handle length naturally
                if (response.length > 280) {
                    const shortenPrompt = `That's too long for Twitter. Can you make it shorter? "${response}"`;
                    const shortenResult = await model.generateContent(shortenPrompt);
                    response = shortenResult.response.text().trim().replace(/^[\"']|[\"']$/g, '');
                }
                
                console.log(`   🤖 [Gemini] "${response}"`);
                this.geminiFailures = 0;
                return response;
            } catch (error) {
                this.geminiFailures++;
                console.log(`   ⚠️ Gemini failed: ${error.message}`);
            }
        }
        
        if (this.lmStudioAI.available) {
            try {
                // Clean text for API call
                const cleanUsername = this.cleanTextForAPI(username);
                const cleanTweetContent = this.cleanTextForAPI(tweetContent);
                
                const messages = [{
                    role: "system",
                    content: "You're chatting about Pokemon on Twitter. Be natural and friendly."
                }, {
                    role: "user",
                    content: `@${cleanUsername}: "${cleanTweetContent}". ${hasImages ? 'With image.' : ''} Reply:`
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

    hashContent(username, text) {
        // Create a simple hash of username + text to detect identical content
        const content = `${String(username || '').toLowerCase()}::${String(text || '').trim()}`;
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    async checkRateLimit() {
        // Clean up old entries (older than 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.repliesThisHour = this.repliesThisHour.filter(time => time > oneHourAgo);
        
        // High engagement rate - allow up to 150 replies per hour
        const maxRepliesPerHour = 150;
        
        // Check if we've hit the high rate limit
        if (this.repliesThisHour.length >= maxRepliesPerHour) {
            const oldestReply = Math.min(...this.repliesThisHour);
            const timeSinceOldest = Date.now() - oldestReply;
            const waitTime = (60 * 60 * 1000) - timeSinceOldest;
            
            if (waitTime > 0) {
                console.log(`\n⚠️ HIGH ENGAGEMENT LIMIT: ${this.repliesThisHour.length}/${maxRepliesPerHour} replies in last hour`);
                console.log(`   ⏰ Brief cooldown: ${Math.ceil(waitTime / 60000)} minutes...`);
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

    async simpleType(element, text) {
        console.log(`   🚀 Using simplified typing for: "${text}"`);
        
        try {
            // Click with retry
            let clicked = false;
            for (let i = 0; i < 3; i++) {
                try {
                    await element.click();
                    clicked = true;
                    break;
                } catch (e) {
                    console.log(`   ⚠️ Click attempt ${i+1} failed, retrying...`);
                    await this.sleep(500);
                }
            }
            
            if (!clicked) {
                throw new Error('Could not click element after 3 attempts');
            }
            
            await this.sleep(500);
            
            // Clear any existing text first (try Meta+A then Control+A, then triple-click+Backspace)
            try {
                await this.page.keyboard.down('Meta');
                await this.page.keyboard.press('a');
                await this.page.keyboard.up('Meta');
            } catch (_) {}
            await this.sleep(100);
            try {
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('a');
                await this.page.keyboard.up('Control');
            } catch (_) {}
            await this.sleep(100);
            try {
                await element.click({ clickCount: 3 });
                await this.page.keyboard.press('Backspace');
            } catch (_) {}
            
            // Type with error handling and verification
            try {
                await this.page.keyboard.type(text, { delay: 50 });
                console.log(`   ✅ Typed text`);
                
                // Verify text was typed correctly
                await this.sleep(500);
                const typedText = await this.page.evaluate(() => {
                    const box = document.querySelector('[data-testid="tweetTextarea_0"]') || 
                               document.querySelector('div[contenteditable="true"][role="textbox"]');
                    return box ? box.textContent || box.innerText || '' : '';
                });
                
                // If text is incomplete, try typing again
                if (typedText.length < text.length - 20) {
                    console.log(`   ⚠️ Only typed ${typedText.length}/${text.length} chars. Retrying...`);
                    
                    // Clear and retype
                    try { await this.page.keyboard.down('Meta'); await this.page.keyboard.press('a'); await this.page.keyboard.up('Meta'); } catch (_) {}
                    await this.sleep(50);
                    try { await this.page.keyboard.down('Control'); await this.page.keyboard.press('a'); await this.page.keyboard.up('Control'); } catch (_) {}
                    await this.sleep(50);
                    try { await element.click({ clickCount: 3 }); await this.page.keyboard.press('Backspace'); } catch (_) {}
                    await this.sleep(100);
                    
                    // Type slower this time
                    await this.page.keyboard.type(text, { delay: 100 });
                    console.log(`   ✅ Retyped with slower delay`);
                }
                
            } catch (typeError) {
                console.log(`   ⚠️ Keyboard.type failed, trying alternative method...`);
                // Fallback: type character by character
                for (const char of text) {
                    await this.page.keyboard.press(char);
                    await this.sleep(100);
                }
                console.log(`   ✅ Typed using fallback method!`);
            }

            // Final fallback: execCommand insertText if still incomplete
            const finalCheck = await this.page.evaluate((desired) => {
                const box = document.querySelector('[data-testid="tweetTextarea_0"]') || 
                           document.querySelector('div[contenteditable="true"][role="textbox"]');
                const current = box ? (box.textContent || box.innerText || '') : '';
                if (!box) return { ok: false, length: 0 };
                if (current.length < desired.length - 20) {
                    box.focus();
                    try {
                        document.execCommand('selectAll', false, null);
                        document.execCommand('insertText', false, desired);
                    } catch (e) {}
                }
                const after = box ? (box.textContent || box.innerText || '') : '';
                return { ok: after.length >= desired.length - 20, length: after.length };
            }, text);
            if (!finalCheck.ok) {
                console.log(`   ⚠️ execCommand fallback length=${finalCheck.length}`);
            }
            
            // Return a reasonable typing time
            return text.length * 50;
            
        } catch (error) {
            console.log(`   ❌ Simple typing failed: ${error.message}`);
            throw error;
        }
    }

    async humanType(element, text) {
        console.log(`   🔍 humanType called with text: "${text}"`);
        console.log(`   🔍 Element exists: ${!!element}`);
        
        // Set typing state early to block navigation
        if (this.conversationFollowUp) {
            this.conversationFollowUp.setTypingState(true);
        }
        this.isTyping = true;
        
        await element.click();
        console.log(`   ✅ Clicked element`);
        await this.sleep(500);
        
        // Add read time pause before typing (GPT's micro-polish)
        const readTimeMs = Math.min(4000, 60 * text.length);
        console.log(`   ⏱️ Read time pause: ${readTimeMs}ms`);
        await this.sleep(readTimeMs * 0.5, readTimeMs);
        
        // Calculate total typing time (more conservative estimate)
        const avgDelayPerChar = 80; // More conservative average (was 60)
        const totalTypingTime = text.length * avgDelayPerChar;
        console.log(`   📝 Total typing time will be: ${totalTypingTime}ms`);
        
        // Verify dialog is open before starting to type
        console.log(`   🔍 Checking if dialog is ready...`);
        const initialCheck = await this.page.evaluate(() => {
            const dialog = document.querySelector('[role="dialog"]');
            const replyBox = document.querySelector('[data-testid="tweetTextarea_0"]');
            return !!(dialog && replyBox);
        });
        console.log(`   🔍 Dialog ready: ${initialCheck}`);
        
        if (!initialCheck) {
            console.log('   ⚠️ Reply dialog not properly open before typing!');
            throw new Error('Dialog not ready for typing');
        }
        
        // typing state already set above
        
        // Also set flag in page context for conversation checker
        await this.page.evaluate(() => {
            window.botIsTyping = true;
        });
        
        // Check every 5 characters if dialog is still open (more frequent)
        console.log(`   🔤 Starting to type ${text.length} characters...`);
        for (let i = 0; i < text.length; i++) {
            // Check if dialog closed every 5 chars
            if (i > 0 && i % 5 === 0) {
                console.log(`   📊 Progress: ${i}/${text.length} characters typed`);
                const dialogCheck = await this.page.evaluate(() => {
                    const dialog = document.querySelector('[role="dialog"]');
                    const replyBox = document.querySelector('[data-testid="tweetTextarea_0"]');
                    const hasReplyingTo = dialog && dialog.innerText.includes('Replying to');
                    return {
                        dialogOpen: !!dialog,
                        replyBoxExists: !!replyBox,
                        isReplyDialog: hasReplyingTo
                    };
                });
                
                if (!dialogCheck.dialogOpen || !dialogCheck.replyBoxExists) {
                    console.log('   ⚠️ Reply dialog closed while typing!');
                    console.log(`   📊 Dialog state: dialog=${dialogCheck.dialogOpen}, box=${dialogCheck.replyBoxExists}, isReply=${dialogCheck.isReplyDialog}`);
                    // Clear typing state before throwing
                    if (this.conversationFollowUp) {
                        this.conversationFollowUp.setTypingState(false);
                    }
                    this.isTyping = false;
                    throw new Error('Dialog closed during typing');
                }
                
                // If dialog changed to something else (not reply dialog), stop
                if (!dialogCheck.isReplyDialog) {
                    console.log('   ⚠️ Dialog changed to non-reply dialog!');
                    // Clear typing state before throwing
                    if (this.conversationFollowUp) {
                        this.conversationFollowUp.setTypingState(false);
                    }
                    this.isTyping = false;
                    throw new Error('Dialog changed during typing');
                }
            }
            
            // Type character with error handling
            try {
                await this.page.keyboard.type(text[i]);
                await this.sleep(await this.random(40, 80));
            } catch (error) {
                console.log(`   ⚠️ Error typing character ${i}: ${error.message}`);
                // Check if we can continue
                const canContinue = await this.page.evaluate(() => {
                    const box = document.querySelector('[data-testid="tweetTextarea_0"]');
                    return !!box;
                });
                
                if (!canContinue) {
                    // Clear typing state before throwing
                    if (this.conversationFollowUp) {
                        this.conversationFollowUp.setTypingState(false);
                    }
                    this.isTyping = false;
                    throw new Error('Lost focus on reply box');
                }
                
                // Try to refocus and continue
                await element.click();
                await this.sleep(100);
                await this.page.keyboard.type(text[i]);
            }
        }
        
        // Final check after typing is complete
        const finalCheck = await this.page.evaluate(() => {
            const dialog = document.querySelector('[role="dialog"]');
            const replyBox = document.querySelector('[data-testid="tweetTextarea_0"]');
            const content = replyBox ? replyBox.textContent || '' : '';
            return {
                dialogOpen: !!dialog,
                replyBoxExists: !!replyBox,
                typedLength: content.length
            };
        });
        
        if (!finalCheck.dialogOpen || !finalCheck.replyBoxExists) {
            console.log('   ⚠️ Dialog closed after typing completed!');
            throw new Error('Dialog closed after typing');
        }
        
        console.log(`   ✅ Typed ${text.length} chars successfully (box shows ${finalCheck.typedLength} chars)`);
        
        // Clear typing state
        if (this.conversationFollowUp) {
            this.conversationFollowUp.setTypingState(false);
        }
        
        // Clear the bot instance flag
        this.isTyping = false;
        
        // Clear flag in page context
        await this.page.evaluate(() => {
            window.botIsTyping = false;
        });
        
        // Return the estimated typing time so caller can wait appropriately
        return totalTypingTime;
    }

    async checkProactiveFollowUps() {
        try {
            console.log('\n🎯 Checking for proactive follow-ups...');
            
            // Get conversations that need follow-up
            const conversationsNeedingFollowUp = await this.conversationFollowUp.getConversationsNeedingFollowUp();
            
            if (conversationsNeedingFollowUp.length === 0) {
                console.log('   No conversations need follow-up right now');
                return;
            }
            
            console.log(`   Found ${conversationsNeedingFollowUp.length} conversations to follow up on`);
            
            // Process up to 2 follow-ups
            let followUpsProcessed = 0;
            
            for (const convData of conversationsNeedingFollowUp.slice(0, 2)) {
                const { conversation, latestReply, analysis } = convData;
                
                console.log(`   🎯 Following up with @${conversation.theirUsername}`);
                console.log(`   📊 Reason: ${analysis.reason}`);
                
                // Generate a follow-up response based on the conversation history
                let response;
                try {
                    // Build context from conversation history
                    const threadContext = {
                        threadLength: conversation.exchanges.length,
                        mainTopic: conversation.context.topic,
                        fullConversation: conversation.exchanges.map(ex => ({
                            username: ex.type.includes('our') ? 'GlitchyGradeAi' : conversation.theirUsername,
                            text: ex.text
                        }))
                    };
                    
                    // Generate thread-aware response for follow-up
                    response = await this.generateThreadAwareResponse(
                        conversation.theirUsername,
                        latestReply.text,
                        threadContext,
                        null // No visual data for follow-ups currently
                    );
                } catch (error) {
                    console.log(`   ⚠️ Follow-up response generation failed: ${error.message}`);
                    continue;
                }
                
                if (!response) continue;
                
                // Navigate to the conversation page (already handled by checkSpecificConversation)
                // The page should already be on the tweet from the check
                
                // Find the tweet element and reply
                const tweetElement = await this.page.$('article[data-testid="tweet"]');
                if (tweetElement) {
                    const success = await this.replyToTweet(tweetElement, response);
                    if (success) {
                        this.replyCount++;
                        followUpsProcessed++;
                        this.repliesThisHour.push(Date.now());
                        console.log(`   ✅ Follow-up sent! [${this.replyCount}/1000]`);
                        
                        // Update the conversation follow-up tracker
                        await this.conversationFollowUp.completeFollowUp(conversation.theirTweetId, response);
                        
                        // Update memory
                        await this.memory.rememberUser(conversation.theirUsername, latestReply.text);
                        await this.memory.saveUsers();
                        
                        // Wait before next follow-up
                        await this.sleep(5000);
                    }
                }
            }
            
            if (followUpsProcessed > 0) {
                console.log(`   📊 Processed ${followUpsProcessed} follow-ups`);
                
                // Show follow-up stats
                const stats = this.conversationFollowUp.getStats();
                console.log(`   📈 Active conversations: ${stats.active}, With questions: ${stats.withQuestions}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Proactive follow-up error: ${error.message}`);
        }
    }

    async checkConversationFollowUps() {
        try {
            console.log('\n🔔 Checking notifications for replies...');
            
            // Navigate to notifications page
            await this.page.goto('https://x.com/notifications', { waitUntil: 'networkidle2' });
            await this.sleep(2000);
            
            // Click on "All" tab to see all notifications (not just mentions)
            const allTab = await this.page.$('[role="tab"][href="/notifications"]');
            if (allTab) {
                await allTab.click();
                await this.sleep(1000);
            }
            
            // Scroll through notifications naturally
            console.log('   📜 Scrolling through notifications...');
            let scrollCount = 0;
            let repliesFound = [];
            let processedNotifications = new Set();
            let emptyScrolls = 0; // Track empty scrolls to prevent infinite loops
            let sameCountRepeats = 0; // Track when we keep finding same number
            let lastNotificationCount = -1;
            
            while (scrollCount < 3 && repliesFound.length < 5) { // Max 3 scrolls, max 5 replies
                // Get all notification divs
                const notifications = await this.page.$$('div[data-testid="cellInnerDiv"]');
                console.log(`   📋 Found ${notifications.length} notifications on page`);
                
                // Check for same notification count repeating
                if (notifications.length === lastNotificationCount && notifications.length > 0) {
                    sameCountRepeats++;
                    if (sameCountRepeats >= 3) {
                        console.log(`   ⚠️ Stuck finding same ${notifications.length} notifications repeatedly, breaking loop`);
                        break;
                    }
                } else {
                    sameCountRepeats = 0; // Reset if count changed
                }
                lastNotificationCount = notifications.length;
                
                // Check for empty notifications
                if (notifications.length === 0) {
                    emptyScrolls++;
                    if (emptyScrolls >= 3) {
                        console.log('   ⚠️ No notifications found after 3 attempts, stopping');
                        break;
                    }
                } else {
                    emptyScrolls = 0; // Reset if we found notifications
                }
                
                for (const notification of notifications) {
                    try {
                        // Get notification text - wrap in try/catch for protocol errors
                        let textContent;
                        try {
                            textContent = await notification.evaluate(el => el.innerText);
                        } catch (protocolError) {
                            // Skip this notification if we get a protocol error
                            console.log(`   ⚠️ Protocol error on notification, skipping`);
                            continue;
                        }
                        
                        // Skip if we've already seen this notification
                        if (processedNotifications.has(textContent)) continue;
                        processedNotifications.add(textContent);
                        
                        // Debug: Show first 100 chars of each notification
                        if (scrollCount === 0 && processedNotifications.size <= 5) {
                            console.log(`   📄 Notification: "${textContent.substring(0, 100).replace(/\n/g, ' ')}..."`);
                        }
                        
                        // Check if it's a reply notification (more flexible matching)
                        const lowerText = textContent.toLowerCase();
                        if (lowerText.includes('replied') || lowerText.includes('replying to') || 
                            lowerText.includes('@glitchygradeai') || textContent.includes('💬')) {
                            
                            // Extract username - look for any @username that's not us
                            const usernames = textContent.match(/@(\w+)/g) || [];
                            const botUsernames = ['@glitchygradeai', '@glitchygrade'];
                            const replyUsername = usernames.find(u => !botUsernames.includes(u.toLowerCase()));
                            
                            if (replyUsername) {
                                const username = replyUsername.substring(1); // Remove @
                                
                                // Skip if this is our own username
                                if (username.toLowerCase() === 'glitchygrade' || username.toLowerCase() === 'glitchygradeai') {
                                    continue;
                                }
                                
                                // Get the reply text
                                const replyText = await notification.$eval('div[data-testid="tweetText"]', el => el.innerText).catch(() => null);
                                
                                if (replyText) {
                                    // Try to extract tweet ID from notification
                                    const tweetIdMatch = textContent.match(/status\/(\d+)/) || 
                                                       await notification.evaluate(el => {
                                                           const link = el.querySelector('a[href*="/status/"]');
                                                           return link ? link.href.match(/status\/(\d+)/) : null;
                                                       });
                                    const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;
                                    
                                    repliesFound.push({
                                        username,
                                        text: replyText,
                                        element: notification,
                                        tweetId
                                    });
                                    console.log(`   💬 Found reply from @${username}: "${replyText.substring(0, 50)}..."`);
                                }
                            }
                        }
                    } catch (error) {
                        // Log what went wrong for debugging
                        console.log(`   ⚠️ Error parsing notification: ${error.message}`);
                    }
                }
                
                // Scroll down naturally
                if (scrollCount < 2) {
                    await this.page.evaluate(() => {
                        window.scrollBy({
                            top: window.innerHeight * 0.8,
                            behavior: 'smooth'
                        });
                    });
                    await this.sleep(2000);
                    scrollCount++;
                } else {
                    // Exit loop after max scrolls
                    break;
                }
            }
            
            if (repliesFound.length === 0) {
                console.log('   No new replies found in notifications');
                console.log(`   Processed ${processedNotifications.size} total notifications`);
                return;
            }
            
            console.log(`   📊 Found ${repliesFound.length} replies to potentially follow up on`);
            
            // Process up to 2 follow-ups
            let followUpsProcessed = 0;
            const maxFollowUps = 2;
            
            // Check ALL replies, but only process up to maxFollowUps
            for (const reply of repliesFound) {
                if (followUpsProcessed >= maxFollowUps) {
                    console.log(`   📊 Reached max follow-ups (${maxFollowUps}), skipping remaining replies`);
                    break;
                }
                // Analyze if follow-up is needed
                const analysis = this.conversationFollowUp.analyzeReply(reply.text);
                
                // Skip hostile or argumentative replies
                const hostilePatterns = /retarded|stupid|bullshit|scamm|idiot|dumb|moron|trash|garbage|imagine being|cope|coping|stay broke|falling for/gi;
                if (hostilePatterns.test(reply.text)) {
                    console.log(`   ❌ Skipping @${reply.username} - hostile/argumentative content detected`);
                    continue;
                }
                
                // Be more lenient - follow up on questions, corrections, or ongoing conversations
                if (!analysis.hasQuestion && !analysis.isNegative && !analysis.wantsContinuation) {
                    console.log(`   ⏭️ Skipping @${reply.username} - no follow-up needed (${analysis.sentiment})`);
                    continue;
                }
                
                // Check if this conversation is being tracked for context
                const trackedConv = await this.conversationFollowUp.findTrackedConversation(reply.username);
                
                if (!trackedConv) {
                    console.log(`   ℹ️ @${reply.username} is not in tracked conversations, but will still follow up`);
                }
                
                // Check if we've already sent a follow-up recently
                if (trackedConv && trackedConv.followUpCount >= 3) {
                    console.log(`   ⏭️ Skipping @${reply.username} - already sent ${trackedConv.followUpCount} follow-ups`);
                    continue;
                }
                
                // Check if last follow-up was too recent (within last hour)
                if (trackedConv && trackedConv.exchanges && trackedConv.exchanges.length > 0) {
                    const lastExchange = trackedConv.exchanges[trackedConv.exchanges.length - 1];
                    const lastExchangeTime = new Date(lastExchange.timestamp);
                    const hoursSinceLastExchange = (Date.now() - lastExchangeTime.getTime()) / (1000 * 60 * 60);
                    
                    if (hoursSinceLastExchange < 1) {
                        console.log(`   ⏭️ Skipping @${reply.username} - last follow-up was ${Math.floor(hoursSinceLastExchange * 60)} minutes ago`);
                        continue;
                    }
                }
                
                // CHECK WITH USER INTERACTION HISTORY
                if (this.userInteractionHistory.shouldSkipUser(reply.username)) {
                    console.log(`   ❌ Skipping @${reply.username} - interaction history says to skip`);
                    continue;
                }
                
                console.log(`   🎯 Following up with @${reply.username}`);
                console.log(`   📊 Reason: ${analysis.reason}`);
                
                // Extra check for BigRed specifically since we keep trying to respond
                if (reply.username.toLowerCase() === 'bigreds retrogmz' || 
                    reply.username.toLowerCase() === 'bigredsretrogmz' ||
                    reply.text.includes("Who can say? Everyday brings new trade-ins")) {
                    console.log(`   ❌ Skipping BigRed - we've already responded to this conversation multiple times`);
                    continue;
                }
                
                // Navigate to the tweet - try direct navigation first if we have tweet ID
                if (reply.tweetId) {
                    console.log(`   📍 Navigating directly to tweet: ${reply.tweetId}`);
                    try {
                        await this.page.goto(`https://x.com/${reply.username}/status/${reply.tweetId}`, { 
                            waitUntil: 'networkidle2',
                            timeout: 10000 
                        });
                    } catch (navError) {
                        console.log(`   ⚠️ Direct navigation failed, trying click method`);
                        // Fall back to clicking
                        try {
                            await reply.element.evaluate(el => el.click());
                        } catch (clickError) {
                            console.log(`   ❌ Could not navigate to tweet`);
                            continue;
                        }
                    }
                } else {
                    // No tweet ID, try clicking the notification
                    console.log(`   🖱️ Clicking on notification...`);
                    try {
                        await reply.element.evaluate(el => el.click());
                    } catch (clickError) {
                        console.log(`   ❌ Click failed: ${clickError.message}`);
                        continue;
                    }
                }
                await this.sleep(5000); // Give time for page to load
                
                // Wait for tweet to be visible
                try {
                    await this.page.waitForSelector('article[data-testid="tweet"]', { timeout: 5000 });
                    console.log(`   ✅ Tweet page loaded`);
                    // Wait specifically for reply buttons to appear
                    await this.page.waitForSelector('button[data-testid="reply"]', { timeout: 5000 });
                    console.log(`   ✅ Reply buttons loaded`);
                    // Extra wait for dynamic content
                    await this.sleep(2000);
                } catch (error) {
                    console.log(`   ⚠️ Page didn't load properly: ${error.message}`);
                    // Go back to notifications
                    await this.page.goto('https://x.com/notifications', { waitUntil: 'networkidle2' });
                    await this.sleep(1500);
                    continue;
                }
                
                // Extract full thread context from the page
                console.log(`   📖 Loading full thread context...`);
                let fullThreadContext = null;
                let skipDuplicate = false;
                try {
                    // Get all tweets in the thread
                    const threadTweets = await this.page.evaluate(() => {
                        const tweets = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
                        return tweets.map(tweet => {
                            // Look for username in the tweet header
                            const userLink = tweet.querySelector('a[href^="/"][role="link"] span');
                            let username = userLink?.textContent || '';
                            // Clean up username - remove @ if present
                            username = username.replace(/^@/, '');
                            
                            const text = tweet.querySelector('[data-testid="tweetText"]')?.innerText || '';
                            const timeEl = tweet.querySelector('time');
                            const timestamp = timeEl ? timeEl.getAttribute('datetime') : null;
                            return { username, text, timestamp };
                        }).filter(t => t.text && t.username);
                    });
                    
                    // Log all tweets found in thread for debugging
                    console.log(`   📊 Found ${threadTweets.length} tweets in thread`);
                    threadTweets.forEach((tweet, i) => {
                        console.log(`     ${i + 1}. @${tweet.username}: "${tweet.text.substring(0, 60)}..."`);
                    });
                    
                    // Find our original message in the thread
                    const ourOriginalMessage = threadTweets.find(t => 
                        t.username.toLowerCase() === 'glitchygradeai' || 
                        t.username.toLowerCase() === '@glitchygradeai' ||
                        t.username.toLowerCase() === 'glitchygrade' || 
                        t.username.toLowerCase() === '@glitchygrade'
                    );
                    
                    if (ourOriginalMessage) {
                        console.log(`   📝 Found our original message: "${ourOriginalMessage.text.substring(0, 50)}..."`);
                    }
                    
                    // Check if we already responded to this specific user's message
                    const ourMessages = threadTweets.filter(t => 
                        t.username.toLowerCase() === 'glitchygradeai' || 
                        t.username.toLowerCase() === '@glitchygradeai' ||
                        t.username.toLowerCase() === 'glitchygrade' || 
                        t.username.toLowerCase() === '@glitchygrade'
                    );
                    
                    // Check if we already have ANY responses in this thread
                    if (ourMessages.length > 0) {
                        console.log(`   ⚠️ We already have ${ourMessages.length} response(s) in this thread`);
                        
                        // Skip if we already have 2 or more responses to prevent spam
                        if (ourMessages.length >= 2) {
                            console.log(`   ❌ Already have ${ourMessages.length} responses in thread - skipping to avoid spam`);
                            skipDuplicate = true;
                        }
                        
                        // Find the specific user's message we're trying to reply to
                        const userReplyInThread = threadTweets.find(t => 
                            t.username.toLowerCase() === reply.username.toLowerCase() && 
                            t.text.includes(reply.text.substring(0, 30))
                        );
                        
                        if (userReplyInThread) {
                            // Check if any of our messages came after this user's reply
                            const userReplyTime = userReplyInThread.timestamp ? new Date(userReplyInThread.timestamp) : null;
                            
                            for (const ourMsg of ourMessages) {
                                const ourMsgTime = ourMsg.timestamp ? new Date(ourMsg.timestamp) : null;
                                
                                // If we have a message after their reply, we already responded
                                if (userReplyTime && ourMsgTime && ourMsgTime > userReplyTime) {
                                    console.log(`   ❌ Already responded to this thread after @${reply.username}'s message! Skipping to avoid spam.`);
                                    skipDuplicate = true;
                                    break;
                                }
                            }
                        }
                        
                        // Also check if this is the same conversation we already engaged with
                        const conversationKey = `${reply.username}-${threadTweets[0]?.text?.substring(0, 50) || 'unknown'}`;
                        if (this.repliedUsers.has(conversationKey)) {
                            console.log(`   ❌ Already engaged in this conversation thread! Skipping duplicate.`);
                            skipDuplicate = true;
                        } else {
                            this.repliedUsers.add(conversationKey);
                        }
                    }
                    
                    // Build proper context
                    fullThreadContext = {
                        threadLength: threadTweets.length,
                        mainTopic: 'Pokemon TCG', // Will be refined based on content
                        fullConversation: threadTweets,
                        ourOriginalMessage: ourOriginalMessage ? ourOriginalMessage.text : null,
                        currentReply: reply.text
                    };
                    
                    // Extract topic from thread content - be more specific and accurate
                    const threadText = threadTweets.map(t => t.text).join(' ').toLowerCase();
                    
                    // More intelligent topic extraction that considers context
                    const topicCounts = {
                        blockchain: (threadText.match(/blockchain|nft|digital|fake|counterfeit/gi) || []).length,
                        gamestop: (threadText.match(/gamestop/gi) || []).length,
                        powerpack: (threadText.match(/power pack/gi) || []).length,
                        charizard: (threadText.match(/charizard/gi) || []).length,
                        pulls: (threadText.match(/pull|pulled|pulls|pulling/gi) || []).length,
                        trade: (threadText.match(/trade|trading|traded/gi) || []).length,
                        price: (threadText.match(/price|worth|value|\$/gi) || []).length,
                        grading: (threadText.match(/psa|bgs|cgc|grade|graded/gi) || []).length,
                        collection: (threadText.match(/collection|collecting|collector/gi) || []).length,
                        market: (threadText.match(/market|bubble|crash|invest/gi) || []).length,
                        authenticity: (threadText.match(/fake|real|authentic|legit|counterfeit/gi) || []).length
                    };
                    
                    // Find the most mentioned topic with better logic
                    let dominantTopic = 'Pokemon TCG';
                    
                    // Check for blockchain/authenticity discussions first
                    if (topicCounts.blockchain >= 2 || (topicCounts.authenticity >= 2 && topicCounts.blockchain >= 1)) {
                        dominantTopic = 'Card authenticity and technology';
                    }
                    // Only mention power packs if they're actually the main topic
                    else if (topicCounts.powerpack >= 2 && topicCounts.gamestop >= 1) {
                        dominantTopic = 'GameStop Power Packs';
                    }
                    else if (topicCounts.market >= 2 || (topicCounts.price >= 3 && topicCounts.market >= 1)) {
                        dominantTopic = 'Pokemon market discussion';
                    }
                    else if (topicCounts.trade >= 2) {
                        dominantTopic = 'Trading cards';
                    }
                    else if (topicCounts.grading >= 2) {
                        dominantTopic = 'Card grading';
                    }
                    else if (topicCounts.price >= 2) {
                        dominantTopic = 'Card values';
                    }
                    else if (topicCounts.charizard >= 1) {
                        dominantTopic = 'Charizard cards';
                    }
                    else if (topicCounts.pulls >= 1) {
                        dominantTopic = 'Card pulls';
                    }
                    else if (topicCounts.collection >= 1) {
                        dominantTopic = 'Card collecting';
                    }
                    
                    fullThreadContext.mainTopic = dominantTopic;
                    
                    console.log(`   🎯 Thread topic: ${fullThreadContext.mainTopic}`);
                    
                    // Check if thread is hostile or irrelevant - skip if so
                    const hostilePatterns = /retarded|stupid|bullshit|scamm|idiot|dumb|moron|trash|garbage/gi;
                    const argumentPatterns = /imagine being|cope|coping|stay broke|falling for|looking retard/gi;
                    
                    if (hostilePatterns.test(threadText) || argumentPatterns.test(threadText)) {
                        console.log(`   ⚠️ Thread contains hostile/argumentative content - skipping to avoid drama`);
                        skipDuplicate = true;
                    }
                    
                    // Skip if we haven't actually participated in this conversation yet
                    const ourBotMessages = threadTweets.filter(t => 
                        t.username.toLowerCase() === 'glitchygradeai' || 
                        t.username.toLowerCase() === '@glitchygradeai' ||
                        t.username.toLowerCase() === 'glitchygrade' || 
                        t.username.toLowerCase() === '@glitchygrade'
                    );
                    
                    if (ourBotMessages.length === 0) {
                        console.log(`   ⚠️ We haven't participated in this conversation - checking if we should join...`);
                        
                        // Only join if it's actually about Pokemon TCG and not just blockchain arguments
                        const tcgRelevance = (topicCounts.charizard + topicCounts.pulls + topicCounts.trade + 
                                            topicCounts.grading + topicCounts.collection + topicCounts.price);
                        
                        if (tcgRelevance < 2 && dominantTopic === 'Card authenticity and technology') {
                            console.log(`   ❌ Not joining - conversation is about blockchain/tech with low TCG relevance`);
                            skipDuplicate = true;
                        }
                    }
                } catch (contextError) {
                    console.log(`   ⚠️ Could not extract full thread context: ${contextError.message}`);
                }
                
                // Skip if we determined this is a duplicate
                if (skipDuplicate) {
                    continue;
                }
                
                // Generate follow-up response
                let response;
                try {
                    // Use the full thread context we just extracted from the page
                    let threadContext = fullThreadContext;
                    
                    // If we couldn't get full context from page, fall back to what we have
                    if (!threadContext) {
                        if (trackedConv) {
                            // We have context from tracking
                            threadContext = {
                                threadLength: trackedConv.exchanges.length + 1,
                                mainTopic: trackedConv.context.topic || 'Pokemon TCG',
                                fullConversation: trackedConv.exchanges.map(ex => ({
                                    username: ex.type.includes('our') ? 'GlitchyGradeAi' : reply.username,
                                    text: ex.text
                                })),
                                ourOriginalMessage: trackedConv.ourLastResponse
                            };
                            
                            // Add the new reply
                            threadContext.fullConversation.push({
                                username: reply.username,
                                text: reply.text
                            });
                        } else {
                            // No context at all - this will likely generate poor responses
                            console.log(`   ⚠️ No context available - response may be generic`);
                            threadContext = {
                                threadLength: 2,
                                mainTopic: 'Pokemon TCG',
                                fullConversation: [{
                                    username: reply.username,
                                    text: reply.text
                                }],
                                ourOriginalMessage: null
                            };
                        }
                    }
                    
                    // Log what context we're using
                    console.log(`   🧵 Using context: ${threadContext.threadLength} messages, topic: ${threadContext.mainTopic}`);
                    if (threadContext.ourOriginalMessage) {
                        console.log(`   💬 Our original: "${threadContext.ourOriginalMessage.substring(0, 50)}..."`);
                    }
                    
                    // Check if this is an identity question
                    const isIdentityQuestion = /who (dis|is this|are you)|what are you/i.test(reply.text);
                    
                    if (isIdentityQuestion) {
                        // Give a friendly introduction
                        response = "Hey! I'm a Pokemon TCG enthusiast who loves talking about cards, pulls, and trades. Just here vibing with the community! 🎴";
                    } else {
                        // First try intelligent response generator for high-value responses
                        try {
                            const intelligentResponse = await this.intelligentResponseGenerator.generateResponse({
                                text: reply.text,
                                username: reply.username,
                                hasImages: false,
                                threadContext: fullThreadContext || threadContext,
                                sentiment: analysis
                            });
                            
                            if (intelligentResponse && this.intelligentResponseGenerator.validateResponse(intelligentResponse)) {
                                response = intelligentResponse;
                                console.log(`   🧠 Using intelligent response: "${response.substring(0, 60)}..."`);
                                
                                // Track in conversation memory
                                this.intelligentResponseGenerator.rememberConversation(
                                    reply.username,
                                    fullThreadContext?.mainTopic || 'general',
                                    response
                                );
                            }
                        } catch (error) {
                            console.log(`   ⚠️ Intelligent response failed: ${error.message}`);
                        }
                        
                        // Fall back to thread-aware response if needed
                        if (!response) {
                            response = await this.generateThreadAwareResponse(
                                reply.username,
                                reply.text,
                                threadContext,
                                null
                            );
                        }
                        
                        // Check if response is too similar to recent ones
                        if (response && this.responseVariety && this.responseVariety.isTooSimilar(reply.username, response)) {
                            console.log(`   🔄 Response too similar to recent ones, regenerating...`);
                            // Try to get a different response
                            response = await this.generateThreadAwareResponse(
                                reply.username,
                                reply.text + " (please vary response)",
                                threadContext,
                                null
                            );
                        }
                    }
                    
                    // Track response for variety
                    if (response && this.responseVariety) {
                        this.responseVariety.trackResponse({ username: reply.username, text: reply.text, response });
                    }
                } catch (error) {
                    console.log(`   ⚠️ Follow-up response generation failed: ${error.message}`);
                    // Go back to notifications
                    await this.page.goto('https://x.com/notifications', { waitUntil: 'networkidle2' });
                    await this.sleep(1500);
                    continue;
                }
                
                if (!response) {
                    // Go back to notifications
                    await this.page.goto('https://x.com/notifications', { waitUntil: 'networkidle2' });
                    await this.sleep(1500);
                    continue;
                }
                
                // Find the reply button and respond - be very specific to avoid compose button
                console.log(`   🔍 Looking for reply button on ${reply.username}'s comment...`);
                // First wait a bit for tweet to fully render
                await this.sleep(2000);
                
                // Find the specific reply from the user
                const userReplyFound = await this.page.evaluate((targetUsername, replyText) => {
                    // Find all tweet articles
                    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                    console.log(`Looking for @${targetUsername}'s reply among ${tweets.length} tweets`);
                    
                    for (const tweet of tweets) {
                        // Look for username in different possible locations
                        const userLinks = tweet.querySelectorAll('a[href*="/' + targetUsername + '"]');
                        let isUserTweet = false;
                        
                        for (const link of userLinks) {
                            // Check if this link contains the username
                            const spans = link.querySelectorAll('span');
                            for (const span of spans) {
                                const text = span.textContent.trim();
                                if (text === '@' + targetUsername || text === targetUsername) {
                                    isUserTweet = true;
                                    break;
                                }
                            }
                            if (isUserTweet) break;
                        }
                        
                        // Also check tweet text to confirm it's the right reply
                        if (isUserTweet && replyText) {
                            const tweetText = tweet.querySelector('[data-testid="tweetText"]');
                            if (tweetText && tweetText.textContent.includes(replyText.substring(0, 50))) {
                                // Found the correct reply
                                const replyButton = tweet.querySelector('button[data-testid="reply"]');
                                if (replyButton) {
                                    console.log(`Found ${targetUsername}'s reply!`);
                                    // Scroll to it and click
                                    tweet.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    setTimeout(() => replyButton.click(), 500);
                                    return true;
                                }
                            }
                        }
                    }
                    console.log(`Could not find @${targetUsername}'s specific reply`);
                    return false;
                }, reply.username, reply.text);
                
                if (!userReplyFound) {
                    console.log(`   ❌ Could not find ${reply.username}'s reply on page`);
                    continue;
                }
                
                console.log(`   ✅ Found and clicked reply button on ${reply.username}'s comment`);
                await this.sleep(3000); // Wait for click to complete and dialog to open
                    
                    // Type the response
                    console.log(`   📝 Looking for text area...`);
                    
                    // Make sure we're in a reply dialog by checking for "Replying to" text
                    const isReplyDialog = await this.page.evaluate(() => {
                        // Get the modal dialog
                        const modal = document.querySelector('[role="dialog"]');
                        if (!modal) return false;
                        
                        // Check if the dialog text contains "Replying to"
                        const modalText = modal.innerText || '';
                        return modalText.includes('Replying to');
                    }).catch(() => false);
                    
                    if (!isReplyDialog) {
                        console.log(`   ❌ This looks like main compose, not a reply! Canceling...`);
                        // Close the dialog
                        const closeButton = await this.page.$('[aria-label="Close"]');
                        if (closeButton) {
                            await closeButton.click();
                            await this.sleep(1000);
                        }
                        continue;
                    }
                    
                    const tweetTextarea = await this.page.$('div[data-testid="tweetTextarea_0"]');
                    if (tweetTextarea) {
                        console.log(`   ⌨️ Typing response: "${response}"`);
                        console.log(`   🔍 REPLY FLOW: About to click textarea...`);
                        
                        // Test if we can type directly without humanType
                        try {
                            await tweetTextarea.click();
                            await this.sleep(500);
                            console.log(`   🔍 TEST: Typing with keyboard.type...`);
                            await this.page.keyboard.type(response, { delay: 50 });
                            console.log(`   ✅ TEST: Direct typing succeeded!`);
                            const typingTime = response.length * 50;
                        } catch (error) {
                            console.log(`   ❌ Direct typing failed: ${error.message}`);
                            throw error;
                        }
                        
                        // Wait for full typing time plus buffer
                        await this.sleep(Math.max(1500, typingTime + 500));
                        
                        // Verify text is fully typed
                        const typedText = await this.page.evaluate(() => {
                            const box = document.querySelector('[data-testid="tweetTextarea_0"]');
                            return box ? box.textContent || box.innerText || '' : '';
                        });
                        
                        if (typedText.length < response.length - 20) {
                            console.log(`   ⚠️ Text not fully typed. Waiting...`);
                            await this.sleep(2000);
                        }
                        
                        // Send the reply
                        console.log(`   🔍 Looking for send button...`);
                        const sendButton = await this.page.$('button[data-testid="tweetButton"]');
                        if (sendButton) {
                            console.log(`   📤 Sending follow-up...`);
                            await sendButton.click();
                            await this.sleep(3000); // More time to ensure it's sent
                            
                            this.replyCount++;
                            followUpsProcessed++;
                            this.repliesThisHour.push(Date.now());
                            console.log(`   ✅ Follow-up sent! [${this.replyCount}/1000]`);
                            
                            // RECORD IN USER INTERACTION HISTORY
                            await this.userInteractionHistory.recordInteraction(
                                reply.username,
                                reply.tweetId,
                                reply.text,
                                response
                            );
                            
                            // Update tracking if we have a tracked conversation
                            if (trackedConv) {
                                await this.conversationFollowUp.completeFollowUp(trackedConv.theirTweetId, response);
                            }
                            await this.memory.rememberUser(reply.username, reply.text);
                        } else {
                            console.log(`   ❌ Send button not found`);
                        }
                    } else {
                        console.log(`   ❌ Text area not found`);
                    }
                
                // Go back to notifications for next reply
                if (followUpsProcessed < maxFollowUps && followUpsProcessed < repliesFound.length - 1) {
                    console.log('   ⏳ Returning to notifications...');
                    await this.page.goto('https://x.com/notifications', { waitUntil: 'networkidle2' });
                    await this.sleep(2000);
                }
            }
            
            if (followUpsProcessed > 0) {
                console.log(`   📊 Processed ${followUpsProcessed} follow-ups`);
                const stats = this.conversationFollowUp.getStats();
                console.log(`   📈 Active conversations: ${stats.active}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Notification check error: ${error.message}`);
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
                    console.log(`   📝 [CONTEXT] Using thread context (${data.threadContext.fullConversation.length} messages)`);
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

                    // Track engagement outcome
                    await this.engagementOutcomeTracker.trackEngagement({
                        type: 'reply',
                        targetTweetId: data.tweetId || 'unknown',
                        targetUsername: data.username || 'unknown',
                        botResponse: response,
                        responseType: 'contextual_reply'
                    });
                    
                    // Mark as processed
                    await this.conversationTracker.markAsProcessed(data.tweetId, data.username, data.tweetText);
                    
                    // Track this follow-up conversation
                    if (this.conversationFollowUp && data.tweetId) {
                        await this.conversationFollowUp.trackConversation(
                            data.tweetId,
                            data.username,
                            response,
                            {
                                topic: data.threadContext?.mainTopic || 'pokemon',
                                sentiment: this.sentimentAnalyzer.analyzeSentiment(data.tweetText).sentiment,
                                hasImages: data.hasImages,
                                cardsMentioned: this.extractCardNames(data.tweetText)
                            }
                        );
                    }
                    
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
            
            // Try multiple possible selectors for the reply box
            let replyBox = null;
            const replySelectors = [
                '[data-testid="tweetTextarea_0"]',
                'div[role="textbox"][data-testid="tweetTextarea_0"]',
                'div[contenteditable="true"][role="textbox"]',
                'div[contenteditable="true"][data-text="true"]',
                '.DraftEditor-root .public-DraftEditor-content',
                'div[aria-label*="Tweet text"]',
                'div[aria-label*="Reply"]',
                'div.public-DraftStyleDefault-block'
            ];
            
            for (const selector of replySelectors) {
                try {
                    replyBox = await this.page.waitForSelector(selector, { timeout: 3000 });
                    if (replyBox) {
                        console.log(`   ✅ Found reply box with selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Try next selector
                }
            }
            
            if (!replyBox) {
                console.log('   ❌ Could not find reply box with any selector');
                // Try to close any open modal
                try {
                    await this.page.keyboard.press('Escape');
                } catch (e) {}
                return false;
            }
            
            // Type the response with dialog monitoring
            let typingTime;
            try {
                // Check if we have a valid response
                if (!response || (typeof response === 'string' && response.trim().length === 0)) {
                    console.log('   ❌ No valid response to type (response is null/empty), closing dialog...');
                    await this.page.keyboard.press('Escape');
                    return false;
                }
                
                typingTime = await this.humanType(replyBox, response);
            } catch (error) {
                console.log('   ⚠️ Error during typing:', error.message);
                // Check if dialog is still open
                const stillOpen = await this.page.evaluate(() => {
                    return !!document.querySelector('[role="dialog"]');
                });
                if (!stillOpen) {
                    console.log('   ❌ Dialog closed during typing, aborting...');
                    return false;
                }
                throw error;
            }
            
            // Wait for full typing time plus buffer to ensure all text is in the box
            await this.sleep(Math.max(2000, typingTime + 1000));
            
            // Verify the full text is in the reply box before sending
            const typedText = await this.page.evaluate(() => {
                const box = document.querySelector('[data-testid="tweetTextarea_0"]') || 
                           document.querySelector('div[contenteditable="true"][role="textbox"]');
                return box ? box.textContent || box.innerText || '' : '';
            });
            
            // Check if we have most of the text (allow for @username prepending)
            const expectedLength = response.length;
            const typedLength = typedText.length;
            if (typedLength < expectedLength - 20) { // Allow 20 char buffer for @username
                console.log(`   ⚠️ Text not fully typed. Expected ~${expectedLength} chars, got ${typedLength}`);
                
                // If very little was typed (like just "y"), the dialog might have been interrupted
                if (typedLength < 10) {
                    console.log(`   ❌ Critical: Only ${typedLength} chars typed. Dialog was likely interrupted.`);
                    // Clear typing state
                    if (this.conversationFollowUp) {
                        this.conversationFollowUp.setTypingState(false);
                    }
                    this.isTyping = false;
                    await this.page.evaluate(() => {
                        window.botIsTyping = false;
                    });
                    // Close dialog
                    await this.page.keyboard.press('Escape');
                    await this.sleep(1000);
                    return false;
                }
                
                // Wait a bit more
                await this.sleep(3000);
                
                // Check again
                const typedTextAfterWait = await this.page.evaluate(() => {
                    const box = document.querySelector('[data-testid="tweetTextarea_0"]') || 
                               document.querySelector('div[contenteditable="true"][role="textbox"]');
                    return box ? box.textContent || box.innerText || '' : '';
                });
                
                if (typedTextAfterWait.length < expectedLength - 20) {
                    console.log(`   ❌ Still incomplete. Aborting reply.`);
                    // Clear typing state
                    if (this.conversationFollowUp) {
                        this.conversationFollowUp.setTypingState(false);
                    }
                    this.isTyping = false;
                    await this.page.evaluate(() => {
                        window.botIsTyping = false;
                    });
                    await this.page.keyboard.press('Escape');
                    return false;
                }
            }
            
            // Final safety check - ensure we're still in reply dialog before sending
            const inReplyDialog = await this.page.evaluate(() => {
                const dialog = document.querySelector('[role="dialog"]');
                const replyBox = document.querySelector('[data-testid="tweetTextarea_0"]');
                const hasReplyingTo = dialog && dialog.innerText.includes('Replying to');
                return !!(dialog && replyBox && hasReplyingTo);
            });
            
            if (!inReplyDialog) {
                console.log('   ❌ Not in reply dialog! Aborting send to prevent misplaced tweet');
                await this.page.keyboard.press('Escape');
                return false;
            }
            
            // Send
            let sent = await this.page.evaluate(() => {
                const primary = document.querySelector('button[data-testid="tweetButton"]');
                if (primary && !primary.disabled) {
                    primary.click();
                    return true;
                }
                const inline = document.querySelector('button[data-testid="tweetButtonInline"]');
                if (inline && !inline.disabled) {
                    inline.click();
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
        await this.userInteractionHistory.initialize();
        
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
                defaultViewport: null,
                protocolTimeout: 180000 // 3 minutes timeout to prevent Runtime.callFunctionOn timeouts
            });
            
            const pages = await this.browser.pages();
            for (const page of pages) {
                const url = page.url();
                if (url.includes('x.com') || url.includes('twitter.com')) {
                    this.page = page;
                    console.log(`✅ Connected to X.com\n`);
                    
                    // Add listener to prevent accidental retweets
                    await this.page.evaluateOnNewDocument(() => {
                        // Override any retweet confirmation dialogs
                        const observer = new MutationObserver((mutations) => {
                            for (const mutation of mutations) {
                                if (mutation.type === 'childList') {
                                    for (const node of mutation.addedNodes) {
                                        if (node.nodeType === 1 && node.tagName) {
                                            // Check for retweet confirmation dialogs
                                            const text = node.innerText || '';
                                            if (text.includes('Retweet') && text.includes('Quote')) {
                                                console.warn('Blocking retweet dialog!');
                                                // Click cancel or press Escape
                                                const cancelBtn = node.querySelector('button[aria-label*="Cancel"]') || 
                                                                node.querySelector('button[data-testid="close"]');
                                                if (cancelBtn) cancelBtn.click();
                                                else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                                            }
                                        }
                                    }
                                }
                            }
                        });
                        observer.observe(document.body, { childList: true, subtree: true });
                    });
                    
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
                    geminiKeys: GEMINI_API_KEYS,
                    enableVisionAPI: process.env.ENABLE_VISION_API === 'true'
                });
                console.log('💬 Conversation checker initialized');
                
                // Initialize following monitor
                this.followingMonitor = new FollowingMonitor(this.page);
                console.log('👥 Following monitor initialized');
                
                // Initialize conversation follow-up system
                this.conversationFollowUp = new ConversationFollowUp(this.page);
                await this.conversationFollowUp.initialize();
                console.log('🎯 Conversation follow-up system initialized');
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
                // DISABLED: Pausing notification responses
                /*
                if (searchCounter > 0 && searchCounter % 7 === 0 && this.conversationChecker) {
                    await this.checkAndReplyToConversations();
                }
                */
                
                // Removed complex search counter logic - follow-ups now happen between searches
                
                // DISABLED: Original market posts - bot should only reply to others
                /*
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
                */
                
                // PRIORITY: Check Following timeline for engagement opportunities first
                if (this.followingMonitor) {
                    console.log('\n👥 Checking Following timeline for engagement opportunities...');
                    try {
                        // Navigate to Following timeline
                        await this.followingMonitor.navigateToFollowing();
                        await this.sleep(3000);

                        // Extract tweets for engagement (includes postAge and meta)
                        const followingTweets = await this.followingMonitor.extractFollowingTweets(this.repliedContentHashes);
                        
                        // COMPREHENSIVE FILTERING: Check session tracking AND already replied tweets
                        console.log(`   🔍 [DEBUG] Session has ${this.processedTweetsThisSession.size} processed tweets`);
                        const safeTweets = followingTweets.filter(tweet => {
                            const sessionKey = `${tweet.username}::${tweet.text.substring(0, 100)}`;
                            const textKey = `${tweet.username.toLowerCase()}::${tweet.text.substring(0, 60)}`;
                            
                            // Check session tracking first
                            if (this.processedTweetsThisSession?.has(sessionKey)) {
                                console.log(`   ⏭️ Skipping tweet already processed this session: @${tweet.username} - "${tweet.text.substring(0, 50)}..."`);
                                return false;
                            }
                            
                            // Check if already replied to this tweet
                            if (tweet.id && this.repliedTweetIds?.has(tweet.id)) {
                                console.log(`   ⏭️ Already replied to tweet ${tweet.id}; skipping from Following timeline`);
                                return false;
                            }
                            
                            // Check text-based duplicate for tweets without IDs
                            if (!tweet.id && this.repliedTextKeys?.has(textKey)) {
                                console.log(`   ⏭️ Already replied to similar post by @${tweet.username}; skipping from Following timeline`);
                                return false;
                            }
                            
                            return true;
                        });

                        if (safeTweets.length > 0) {
                            console.log(`   🎯 Found ${safeTweets.length} safe tweets from followed accounts (${followingTweets.length} total extracted)`);

                            // IMPROVED: Sort by actual timestamp (newest first) and prioritize truly fresh content
                            const sortedTweets = safeTweets.sort((a, b) => {
                                // Parse timestamps and sort newest first
                                const timeA = new Date(a.timestamp || 0).getTime();
                                const timeB = new Date(b.timestamp || 0).getTime();
                                return timeB - timeA; // Newest first
                            });
                            
                            // Prefer very recent content, but fall back to newest if none qualify
                            const preferredCategories = ['very_recent', 'recent_post', 'ideal_range', 'slightly_old'];
                            const preferredTweets = sortedTweets.filter(t => preferredCategories.includes(t.postAge));
                            console.log(`   🕐 Found ${preferredTweets.length} fresh-or-recent tweets (${sortedTweets.length} total after sorting)`);
                            
                            // Take only the top candidates; if none are fresh, use newest overall
                            const basePool = preferredTweets.length > 0 ? preferredTweets : sortedTweets;
                            const candidates = basePool.slice(0, 2);

                            for (const ft of candidates) {
                                // Duplicate guard (before any DOM work)
                                const priorId = ft.id && this.repliedTweetIds && this.repliedTweetIds.has(ft.id);
                                const textKeyCandidate = `${String(ft.username || '').toLowerCase()}::${String(ft.text || '').substring(0, 60)}`;
                                const priorTextKey = this.repliedTextKeys && this.repliedTextKeys.has(textKeyCandidate);
                                if (priorId || (!ft.id && priorTextKey)) {
                                    console.log('   ⏭️ Already replied to this followed tweet; skipping');
                                    continue;
                                }
                                // Skip if this tweet is from our own account (avoid replying to ourselves)
                                const selfNames = new Set([
                                    String(process.env.TWITTER_USERNAME || '').toLowerCase(),
                                    String(process.env.TWITTER_USERNAME || '').replace(/^@/, '').toLowerCase(),
                                    'glitchygrade',
                                    'glitchygradeai'
                                ].filter(Boolean));
                                if (selfNames.has(String(ft.username || '').toLowerCase())) {
                                    console.log('   ⏭️ Skipping self tweet on Following timeline');
                                    continue;
                                }
                // High engagement rate limit check  
                const maxRepliesPerHour = 150;
                const recentReplies = this.repliesThisHour.filter(time => Date.now() - time < 3600000);
                if (recentReplies.length >= maxRepliesPerHour) {
                    console.log(`   ⚠️ High engagement limit reached (${recentReplies.length}/${maxRepliesPerHour}), brief pause on Following engagement`);
                    break;
                }

                                // Find the tweet element again by matching text and username
                                const tweetHandle = await this.findTweetByUserAndText(ft.username, ft.text);
                                if (!tweetHandle) {
                                    console.log('   ⚠️ Could not re-locate followed tweet element; skipping');
                                    continue;
                                }

                                // Proceed to engage; we've already session-guarded earlier in this loop
                                const finalSessionKey = `${ft.username}::${ft.text.substring(0, 100)}`;
                                
                                // Force reply for followed accounts; bypass selector restrictions
                                console.log(`   ✅ Engaging with followed account (reply)`);
                                this.currentEngagementSource = 'following_feed';
                                
                                // Mark as engaged IMMEDIATELY to prevent duplicates
                                this.processedTweetsThisSession.add(finalSessionKey);
                                
                                let success;
                                try {
                                    success = await this.engageWithTweet(tweetHandle, 'reply');
                                } finally {
                                    this.currentEngagementSource = null;
                                }
                                if (success) {
                                    await this.sleep(8000 + Math.random() * 7000);
                                }
                            }
                        }

                        // Also check for intelligence signals while we're here
                        const signals = await this.followingMonitor.checkFollowingTimeline();
                        if (signals.length > 0) {
                            const topSignal = signals[0];
                            console.log(`   📊 Intelligence: ${topSignal.cards[0]} - ${topSignal.patterns[0].type}`);
                        }

                        // Navigate back to search for normal flow
                        console.log('   🔄 Returning to search timeline...');
                        await this.page.goto('https://x.com/search?q=&src=typed_query', {
                            waitUntil: 'networkidle2',
                            timeout: 15000
                        });
                        await this.sleep(2000);

                    } catch (error) {
                        console.log('   ⚠️ Following engagement failed:', error.message);
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
                // Track current search query for session management
                this.currentSearchQuery = query;
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
                
                // Add extra wait to ensure tweets are loaded
                await this.sleep(3000);
                
                // Validate page is ready before proceeding
                try {
                    await this.page.mainFrame();
                } catch (frameError) {
                    if (frameError.message.includes('Requesting main frame too early')) {
                        console.log('   ⚠️ Page not ready, waiting...');
                        await this.sleep(5000);
                        continue;
                    }
                }
                
                console.log(`📊 Collecting tweets for engagement analysis...`);
                
                // Track users found in this search
                const foundUsers = [];
                
                for (let scroll = 0; scroll < 5; scroll++) {
                    const tweets = await this.page.$$('article[data-testid="tweet"]');
                    
                    if (scroll === 0 && tweets.length === 0) {
                        // Debug: Check what's on the page
                        const pageContent = await this.page.evaluate(() => {
                            const hasNoResults = document.querySelector('[data-testid="empty_state_header_text"]');
                            const isLoading = document.querySelector('[role="progressbar"]');
                            return {
                                hasNoResults: !!hasNoResults,
                                isLoading: !!isLoading,
                                bodyText: document.body.innerText.substring(0, 200)
                            };
                        });
                        console.log(`   🔍 Page status:`, pageContent);
                    }
                    
                    // Add only new tweets
                    for (const tweet of tweets) {
                        const tweetData = await tweet.evaluate(el => {
                            const link = el.querySelector('a[href*="/status/"]');
                            const usernameEl = el.querySelector('a[href^="/"]');
                            const username = usernameEl?.getAttribute('href')?.substring(1) || 'unknown';
                            // Use element position as fallback ID
                            const rect = el.getBoundingClientRect();
                            return {
                                id: link?.href || `tweet-${rect.top}-${rect.left}`,
                                username: username
                            };
                        });
                        
                        if (!processedTweetIds.has(tweetData.id)) {
                            processedTweetIds.add(tweetData.id);
                            seenTweets.push(tweet);
                            foundUsers.push(tweetData.username);
                        }
                    }
                    
                    // Scroll to see more
                    await this.page.evaluate(() => {
                        window.scrollBy({ top: 600, behavior: 'smooth' });
                    });
                    await this.sleep(await this.random(2000, 3000));
                }
                
                console.log(`📊 Collected ${seenTweets.length} unique tweets`);
                
                // Track the search results to detect loops
                this.searchEngine.trackSearchResults(query, foundUsers);
                
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
                    
                    // Check session tracking for search timeline (same as Following timeline)
                    try {
                        const tweetData = await tweet.evaluate(el => {
                            const username = el.querySelector('a[href^="/"]')?.getAttribute('href')?.substring(1) || 'unknown';
                            const text = el.querySelector('[data-testid="tweetText"]')?.innerText || '';
                            return { username, text };
                        });
                        
                        const sessionKey = `${tweetData.username}::${tweetData.text.substring(0, 100)}`;
                        if (this.processedTweetsThisSession?.has(sessionKey)) {
                            console.log(`   ⏭️ Skipping tweet already processed this session: @${tweetData.username} - "${tweetData.text.substring(0, 50)}..."`);
                            continue;
                        }
                        // Mark as processed immediately when we encounter it
                        this.processedTweetsThisSession.add(sessionKey);
                    } catch (error) {
                        console.log(`   ⚠️ Session tracking check failed, proceeding: ${error.message}`);
                    }
                    
                    // Check high engagement rate limit
                    const maxRepliesPerHour = 150;
                    const recentReplies = this.repliesThisHour.filter(
                        time => Date.now() - time < 3600000
                    );
                    if (recentReplies.length >= maxRepliesPerHour) {
                        console.log(`⚠️ High engagement limit reached (${recentReplies.length}/${maxRepliesPerHour}), brief pause then resume`);
                        break;
                    }
                    
                    // Burst protection: Check 15-minute window
                    const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
                    const recentBurst = this.repliesThisHour.filter(
                        time => time > fifteenMinutesAgo
                    );
                    if (recentBurst.length >= 8) {
                        console.log(`⚠️ Burst limit reached (${recentBurst.length}/8 in 15 min), short cool down...`);
                        await this.sleep(60 * 1000); // 1 minute cooldown
                        continue;
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
                                const waitTime = await this.random(8000, 15000);
                                console.log(`⏰ Engagement ${engagementsThisRound}/${actualTarget} complete. Waiting ${Math.floor(waitTime/1000)}s...\n`);
                                await this.sleep(waitTime);
                            }
                        }
                    }
                }
                
                console.log(`✅ Completed ${engagementsThisRound}/${actualTarget} engagements this round\n`);
                try {
                    this.searchEngine.trackSearchSuccess(
                        this.currentSearchQuery || 'unknown',
                        seenTweets.length,
                        engagementsThisRound
                    );
                } catch (_) { /* no-op */ }
                
                // Check for conversation follow-ups between searches
                // DISABLED: Pausing notification responses
                /*
                if (this.conversationFollowUp) {
                    await this.checkConversationFollowUps();
                }
                */
                
                // DISABLED: Authority content generation - bot should only reply to others
                /*
                // Authority content generation with fact-checking (DISABLED FOR NOW)
                if (Math.random() < 0.00 && this.authorityContent) { // Disabled until ready - was 0.05
                    try {
                        // Re-initialize with proper data sources if needed
                        if (!this.authorityContent.redditMonitor) {
                            this.authorityContent = new AuthorityContent(this.redditMonitor, this.priceService);
                        }
                        await this.authorityContent.initialize();
                        
                        const hour = new Date().getHours();
                        let authorityPost = '';
                        
                        if (hour >= 6 && hour < 10) {
                            authorityPost = await this.authorityContent.generateMorningReport();
                        } else if (hour >= 11 && hour < 14) {
                            authorityPost = await this.authorityContent.generateTrendAlert();
                        } else if (hour >= 14 && hour < 17) {
                            authorityPost = await this.authorityContent.generateAfternoonAlert();
                        } else if (hour >= 19 && hour < 22) {
                            authorityPost = await this.authorityContent.generateEveningRecap();
                        } else {
                            authorityPost = await this.authorityContent.makePrediction();
                        }
                        
                        if (authorityPost) {
                            // Initialize content verifier if not already done
                            if (!this.contentVerifier) {
                                this.contentVerifier = new ContentVerifier(
                                    this.redditMonitor,
                                    this.priceService,
                                    this.marketData
                                );
                            }
                            
                            // Verify content before posting
                            const verification = await this.contentVerifier.verifyContent(authorityPost);
                            
                            if (verification.verified) {
                                const posted = await this.postOriginalTweet(authorityPost);
                                if (posted) {
                                    console.log('   ✅ Posted verified authority content');
                                    this.replyCount++; // Count as engagement
                                }
                            } else if (verification.safeContent) {
                                console.log('   ⚠️ Using safe alternative content');
                                const posted = await this.postOriginalTweet(verification.safeContent);
                                if (posted) {
                                    console.log('   ✅ Posted safe authority content');
                                    this.replyCount++;
                                }
                            } else {
                                console.log('   ❌ Authority content failed verification:');
                                verification.issues.forEach(issue => 
                                    console.log(`      - ${issue}`)
                                );
                            }
                        }
                    } catch (error) {
                        console.log(`   ⚠️ Authority content failed: ${error.message}`);
                    }
                }
                */
                
                // Show stats periodically
                if (this.replyCount % 10 === 0) {
                    this.showStats();
                }
                
            } catch (error) {
                errorCount++;
                console.log(`⚠️ Error: ${error.message}`);
                console.error('Stack trace:', error.stack);
                console.log('');
                
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
        let decisionData = null; // Define at function scope
        try {
            // Wrap evaluate in try-catch to handle Protocol errors
            let data;
            try {
                data = await tweet.evaluate(el => {
                    const username = el.querySelector('a[href^="/"]')?.getAttribute('href')?.substring(1);
                    const text = el.querySelector('[data-testid="tweetText"]')?.innerText || '';
                    const hasImages = !!el.querySelector('img[alt*="Image"]');
                    const hasVideos = !!el.querySelector('video, [data-testid="videoPlayer"]');
                    const link = el.querySelector('a[href*="/status/"]');
                    const tweetId = link ? (link.href.split('/status/')[1]?.split('?')[0] || null) : null;
                    return { username, text, hasImages, hasVideos, tweetId };
                });
            } catch (evalError) {
                if (evalError.message.includes('Protocol error') || 
                    evalError.message.includes('Node is detached') ||
                    evalError.message.includes('Cannot find context')) {
                    console.log(`   ⚠️ Tweet element detached, skipping...`);
                    return false;
                }
                throw evalError; // Re-throw if it's a different error
            }
            
            if (!data.username || !data.text || data.text.length < 5) {
                return false;
            }
            
            // Log exactly what we're seeing
            console.log(`\n📄 ANALYZING TWEET:`);
            console.log(`   👤 User: @${data.username}`);
            console.log(`   📝 Text: "${data.text}"`);
            console.log(`   🖼️ Has images: ${data.hasImages}`);
            console.log(`   🎥 Has videos: ${data.hasVideos}`);
            
            // Initialize session tracking if not already done
            if (!this.processedTweetsThisSession) {
                this.processedTweetsThisSession = new Set();
            }
            if (!this.currentSearchQuery) {
                this.currentSearchQuery = '';
            }
            
            // Session tracking: Check if we've already processed this tweet in this session
            // BUT be more permissive for specific valuable card searches
            const sessionKey = `${data.username}::${data.text.substring(0, 100)}`;
            const isSpecificCardSearch = this.currentSearchQuery && /\b(alt art|vmax|sir|special illustration|full art|secret rare|gold|rainbow|promo)\b/i.test(this.currentSearchQuery);
            
            if (this.processedTweetsThisSession?.has(sessionKey) && !isSpecificCardSearch) {
                console.log(`   ⏭️ Already processed this tweet in this session: @${data.username} - "${data.text.substring(0, 50)}..."`);
                return false;
            } else if (this.processedTweetsThisSession?.has(sessionKey) && isSpecificCardSearch) {
                console.log(`   🔍 Specific card search - allowing re-analysis: @${data.username} - "${data.text.substring(0, 50)}..."`);
            }
            // Mark as processed immediately to prevent duplicate analysis
            this.processedTweetsThisSession.add(sessionKey);
            
            // Dedupe: if we've already replied to this tweet ID, skip
            if (data.tweetId && this.repliedTweetIds.has(data.tweetId)) {
                console.log(`   ⏭️ Already replied to tweet ${data.tweetId}; skipping duplicate reply`);
                return false;
            }
            // Dedupe fallback: when tweetId missing, use username+text prefix key
            const textKey = `${data.username.toLowerCase()}::${data.text.substring(0, 60)}`;
            if (!data.tweetId && this.repliedTextKeys.has(textKey)) {
                console.log(`   ⏭️ Already replied to similar post by @${data.username}; skipping`);
                return false;
            }
            
            // Track how many times we've seen this tweet
            if (data.tweetId) {
                const seenCount = (this.seenTweetIds.get(data.tweetId) || 0) + 1;
                this.seenTweetIds.set(data.tweetId, seenCount);
                
                // Skip if we've seen this tweet more than 3 times
                if (seenCount > 3) {
                    console.log(`   🔁 Skipping tweet seen ${seenCount} times from @${data.username}`);
                    this.searchEngine.trackSkippedUser(data.username);
                    return false;
                }
                
                // Clean up old entries if map gets too large
                if (this.seenTweetIds.size > 1000) {
                    // Remove oldest entries
                    const entriesToKeep = 500;
                    const entries = Array.from(this.seenTweetIds.entries());
                    this.seenTweetIds = new Map(entries.slice(-entriesToKeep));
                }
            }
            
            // Prepare decision tracing data
            decisionData = {
                username: data.username,
                tweetText: data.text,
                hasImages: data.hasImages,
                hasVideos: data.hasVideos,
                features: {},
                decision: { engage: false }
            };
            
            // FIRST: Check if post is recent enough to avoid bot detection
            const postTimestamp = await this.timestampFilter.extractTimestamp(tweet);
            const timestampDecision = this.timestampFilter.shouldEngageByAge(postTimestamp, isSpecificCardSearch);
            
            // Record timestamp decision
            if (decisionData) {
                decisionData.features.ageDescription = timestampDecision.details;
                decisionData.features.timestampReason = timestampDecision.reason;
            }
            
            if (!timestampDecision.engage) {
                console.log(`   🕐 Skipping old post: ${timestampDecision.details}`);
                // Log decision for old post
                if (this.decisionTrace && decisionData) {
                    decisionData.decision.engage = false;
                    decisionData.decision.reason = 'Too old';
            await this.decisionTrace.logDecision(decisionData || {});
                }
                return false;
            }
            
            // Log post age for monitoring
            const ageDescription = this.timestampFilter.getAgeDescription(postTimestamp);
            console.log(`   🕐 Post age: ${ageDescription} (${timestampDecision.reason})`);
        
            
            // Use engagement selector to decide if we should engage
            let engagementDecision;
            try {
                engagementDecision = await this.engagementSelector.shouldEngageWithPost(tweet, data);
            } catch (selectorError) {
                // Handle Protocol errors specifically
                if (selectorError.message.includes('Protocol error') || 
                    selectorError.message.includes('Node is detached') ||
                    selectorError.message.includes('Cannot find context')) {
                    console.log(`   ⚠️ Tweet element detached during selector analysis`);
                    return false;
                }
                console.log(`   ⚠️ Engagement selector error: ${selectorError.message}`);
                return false;
            }
            
            if (this.currentEngagementSource !== 'following_feed' && engagementDecision.action === 'skip') {
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
            
            // FIRST CHECK: Use interaction history to prevent ALL duplicates
            if (this.userInteractionHistory.shouldSkipUser(data.username)) {
                console.log(`   ❌ Skipping @${data.username} - interaction history says to skip`);
                // Track this skip to help break search loops
                this.searchEngine.trackSkippedUser(data.username);
                return false;
            }
            
            // Check if we've had this exact conversation before
            if (this.userInteractionHistory.hasHadConversation(data.username, data.text)) {
                console.log(`   ❌ Already had similar conversation with @${data.username}`);
                // Track this skip to help break search loops
                this.searchEngine.trackSkippedUser(data.username);
                return false;
            }
            
            // Check if we've already replied to this user's original posts this session
            if (this.repliedUsers.has(usernameLower)) {
                // Track this skip to help break search loops
                this.searchEngine.trackSkippedUser(data.username);
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
                    // Track this skip to help break search loops
                    this.searchEngine.trackSkippedUser(data.username);
                    return false;
                } else {
                    console.log(`   🔄 Re-engaging with @${data.username} after ${Math.floor(hoursSinceLastInteraction)} hours`);
                }
            }
            
            const filterResult = this.currentEngagementSource === 'following_feed'
                ? { engage: true, reason: 'following_bypass' }
                : this.contentFilter.shouldEngageWithPost(data.text, data.username, false);
            
            if (!filterResult.engage) {
                console.log(`   🚫 Filtered: ${filterResult.reason}`);
                this.stats.postsFiltered++;
                return false;
            }
            
            // Check for scams
            if (this.antiScam) {
                const scamCheck = this.antiScam.shouldSkip(data.text, data.username);
                if (scamCheck.skip) {
                    console.log(`   🚨 Scam detected: ${scamCheck.reason} (${scamCheck.confidence})`);
                    this.stats.postsFiltered++;
                    return false;
                }
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
            
            // Check if this is actually about Pokemon or just has Pokemon in hashtags
            const isActuallyAboutPokemon = () => {
                // If Pokemon is only in hashtags at the end, it's likely spam/unrelated
                const hashtagOnlyPattern = /#pokemon\s*$/i;
                if (hashtagOnlyPattern.test(data.text) && !textLower.includes('pokemon') && !textLower.includes('pokémon')) {
                    return false;
                }
                
                // Check if the main content is about something else entirely
                const nonPokemonIndicators = [
                    'mymagicprophecy', 'mchoicemintawards', 'exo', 'weareone',
                    'kpop', 'bts', 'blackpink', 'crypto', 'nft', 'forex',
                    'giveaway', 'follow me', 'check my', 'link in bio'
                ];
                
                const hasNonPokemonContent = nonPokemonIndicators.some(indicator => textLower.includes(indicator));
                if (hasNonPokemonContent) {
                    return false;
                }
                
                return hasPokemonIndicator;
            };
            
            // SIMPLIFIED: Just use the basic Pokemon indicator check
            if (!hasPokemonIndicator) {
                console.log(`   ⏭️ No Pokemon indicators found: "${data.text.substring(0, 50)}..."`);
                return false;
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
                
                // BONUS: Followed accounts get priority (high-value targets)
                if (data.source === 'following_feed') s += 2;                      // accounts we follow
                
                return s;
            }
            const score = computeValueScore();
            
            // Lower threshold to be more inclusive
            if (score < 2) {
                // Log low score decision
                if (this.decisionTrace && decisionData) {
                    decisionData.decision.engage = false;
                    decisionData.decision.score = score;
                    decisionData.decision.reason = `Low value score: ${score}`;
            await this.decisionTrace.logDecision(decisionData || {});
                }
                return { 
                    shouldEngage: false,
                    engage: false,
                    reason: `Low value score: ${score}` 
                }; // skip only very low quality
            }
            
            // Log engagement decision
            if (this.decisionTrace && decisionData) {
                // Ensure strategy object is present for logging
                decisionData.strategy = decisionData.strategy || { strategy: 'composed', confidence: 'unknown', reason: 'auto-default' };
                decisionData.decision.engage = true;
                decisionData.decision.action = data.engagementType || 'reply';
                decisionData.decision.score = score;
            await this.decisionTrace.logDecision(decisionData || {});
            }
            
            // Build engagement reason
            let engagementReason = `Value score: ${score}`;
            if (data.source === 'following_feed') {
                engagementReason = `FOLLOWED ACCOUNT (+2 bonus) - ${engagementReason}`;
            }
            if (isPriceQ && cards.length) {
                engagementReason += ` - Price question about ${cards[0]}`;
            }
            if (timestampDecision.reason === 'recent_post') {
                engagementReason += ` - Fresh content`;
            }

            // Respect engagementSelector's action (like vs reply)
            return { 
                shouldEngage: true,
                engage: true, 
                action: data.engagementType || 'reply', 
                username: data.username, 
                text: data.text, 
                hasImages: data.hasImages,
                score: score,
                reason: engagementReason
            };
            
        } catch (error) {
            // Log error decision
            if (this.decisionTrace && decisionData) {
                decisionData.strategy = decisionData.strategy || { strategy: 'error', confidence: 'unknown', reason: 'exception' };
                decisionData.decision.engage = false;
                decisionData.decision.error = error.message;
            await this.decisionTrace.logDecision(decisionData || {});
            }
            console.log(`   ⚠️ Tweet analysis error: ${error.message}`);
            return false;
        }
    }

    // Helper to get thread context from status page
    async getThreadContextFromStatusPage(page) {
        // Get the original tweet author to filter thread properly
        const originalAuthor = await page.evaluate(() => {
            // Find the main tweet (usually has a different style or is first)
            const mainTweet = document.querySelector('article[data-testid="tweet"]');
            if (mainTweet) {
                const authorLink = mainTweet.querySelector('a[href^="/"]');
                return authorLink ? authorLink.getAttribute('href').split('/')[1] : null;
            }
            return null;
        });
        
        const nodes = await page.$$('[data-testid="cellInnerDiv"] article[data-testid="tweet"]');
        const msgs = [];
        const processedUsers = new Set();
        
        // Only get tweets that are part of the conversation thread
        for (const n of nodes) {
            const m = await n.evaluate((el, origAuthor) => {
                const u = el.querySelector('a[href^="/"]')?.getAttribute('href')?.split('/')[1] || 'user';
                const t = el.querySelector('[data-testid="tweetText"]')?.innerText || '';
                
                // Check if this tweet mentions the original author or is from them
                const isInThread = u === origAuthor || 
                                 t.includes(`@${origAuthor}`) || 
                                 el.querySelector(`a[href="/${origAuthor}"]`);
                
                return { username: u, text: t, isInThread };
            }, originalAuthor);
            
            // Only include tweets that are part of the conversation
            if (m.text && m.isInThread && !processedUsers.has(m.username)) {
                msgs.push({ username: m.username, text: m.text });
                processedUsers.add(m.username);
            }
            
            // Limit to 6 messages for context
            if (msgs.length >= 6) break;
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
                // Try to find the compose tweet box
                let whatsHappening = await this.page.$('[data-testid="tweetTextarea_0"]');
                if (!whatsHappening) {
                    whatsHappening = await this.page.$('div[contenteditable="true"][role="textbox"]');
                }
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
            
            // Type the tweet and wait for typing to complete
            const typingTime = await this.humanType(tweetBox, text);
            
            // Wait for full typing time plus buffer
            await this.sleep(Math.max(2000, typingTime + 1000));
            
            // Verify text is fully typed
            const typedText = await this.page.evaluate(() => {
                const box = document.querySelector('[data-testid="tweetTextarea_0"]');
                return box ? box.textContent || box.innerText || '' : '';
            });
            
            if (typedText.length < text.length - 5) { // Smaller buffer for compose
                console.log(`   ⚠️ Text not fully typed. Waiting...`);
                await this.sleep(2000);
            }
            
            // Send the tweet
            const sent = await this.page.evaluate(() => {
                const primary = document.querySelector('button[data-testid="tweetButton"]');
                if (primary && !primary.disabled) {
                    primary.click();
                    return true;
                }
                const inline = document.querySelector('button[data-testid="tweetButtonInline"]');
                if (inline && !inline.disabled) {
                    inline.click();
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
            // Check if reply was successful by looking for the compose box closing
            const success = await this.page.waitForFunction(
                () => !document.querySelector('[data-testid="tweetTextarea_0"]') && 
                     !document.querySelector('div[contenteditable="true"][role="textbox"]'),
                { timeout: 5000 }
            ).then(() => true).catch(() => false);
            
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
            // Clean up any leftover dialogs from previous engagements
            await this.cleanupDialogs();

            // FIRST: Get basic data and click reply button IMMEDIATELY
            const data = await tweet.evaluate(el => {
                const username = el.querySelector('a[href^="/"]')?.getAttribute('href')?.substring(1);
                const text = el.querySelector('[data-testid="tweetText"]')?.innerText || '';
                const hasImages = !!el.querySelector('img[alt*="Image"]');
                const hasVideos = !!el.querySelector('video, [data-testid="videoPlayer"]');
                // Get the actual tweet URL more carefully
                // Look for the timestamp link which is the actual tweet URL
                const timeLink = el.querySelector('a[href*="/status/"] time')?.parentElement;
                const tweetUrl = timeLink ? timeLink.href : null;
                const tweetId = tweetUrl ? tweetUrl.split('/status/')[1]?.split('?')[0] : null;
                
                // Verify the URL belongs to the tweet author
                const correctUrl = tweetUrl && tweetUrl.includes(`/${username}/status/`);
                
                return { 
                    username, 
                    text, 
                    hasImages, 
                    hasVideos, 
                    tweetUrl: correctUrl ? tweetUrl : null, 
                    tweetId 
                };
            });
            
            // Duplicate guard (session-level)
            if (data.tweetId && this.repliedTweetIds && this.repliedTweetIds.has(data.tweetId)) {
                console.log(`   ⏭️ Already replied to tweet ${data.tweetId}; skipping duplicate reply`);
                return false;
            }
            const dedupeKey = `${String(data.username || '').toLowerCase()}::${String(data.text || '').substring(0, 60)}`;
            if (!data.tweetId && this.repliedTextKeys && this.repliedTextKeys.has(dedupeKey)) {
                console.log('   ⏭️ Already replied to this post (text-key); skipping duplicate reply');
                return false;
            }
            
            // Strong content-based duplicate detection using hash
            const contentHash = this.hashContent(data.username, data.text);
            if (this.repliedContentHashes.has(contentHash)) {
                console.log(`   ⏭️ Already replied to identical content from @${data.username}; skipping duplicate`);
                return false;
            }

            // Guard: never reply to our own tweets
            const botNames = new Set([
                String(process.env.TWITTER_USERNAME || '').toLowerCase(),
                String(process.env.TWITTER_USERNAME || '').replace(/^@/, '').toLowerCase(),
                'glitchygrade',
                'glitchygradeai'
            ].filter(Boolean));
            if (botNames.has(String(data.username || '').toLowerCase())) {
                console.log('   ⏭️ Skipping self tweet; not replying to our own account');
                return false;
            }

            // Guard: prevent spamming same user too frequently (10 minute cooldown)
            const username = String(data.username || '').toLowerCase();
            const lastReplyTime = this.recentReplies.get(username);
            const now = Date.now();
            const cooldownMs = 10 * 60 * 1000; // 10 minutes
            if (lastReplyTime && (now - lastReplyTime) < cooldownMs) {
                const remainingMinutes = Math.ceil((cooldownMs - (now - lastReplyTime)) / 60000);
                console.log(`   ⏰ User @${data.username} cooldown active (${remainingMinutes}m remaining); converting to like-only`);
                await this.tryLikeTweet(tweet);
                console.log('   👍 Like-only due to user cooldown');
                return true;
            }

            console.log(`\n💬 @${data.username}: "${data.text.substring(0, 80)}..."`);
            
            // Save memory quickly
            await this.memory.rememberUser(data.username, data.text);
            await this.memory.learnFromPost(data.text, { username: data.username });
            await this.memory.saveUsers();
            await this.memory.saveKnowledge();
            console.log(`   💾 Memory saved (${this.memory.users.size} users, ${this.memory.knowledge.prices.size} prices)`);
            
            // Check if content is Pokemon-related BEFORE any actions that might refresh the feed
            const textLower = data.text.toLowerCase();
            // SIMPLIFIED and MUCH more permissive Pokemon detection 
            // If it mentions ANY of these terms, it's Pokemon content!
            const isPokemonContent = /pokemon|pokémon|tcg|ptcg|pikachu|charizard|eevee|mewtwo|gengar|snorlax|lucario|garchomp|dragonite|rayquaza|arceus|mew|skarmory|umbreon|espeon|vaporeon|jolteon|flareon|leafeon|glaceon|sylveon|cards?|pack|booster|collection|graded|grade|slab|psa|cgc|bgs|alt.art|full.art|secret.rare|rainbow.rare|gold.card|shiny|holo|foil|mint|nm|lp|mp|hp|dmg|1st.edition|shadowless|base.set|jungle|fossil|gym|neo|stellar|crown|surging|sparks|twilight|masquerade|temporal|forces|obsidian|flames|lost|origin|astral|radiance|celebrations|evolving|skies|fusion|strike|vivid|voltage|battle|styles|sword|shield|scarlet|violet/i.test(data.text);
            
            // REMOVE ALL FILTERING - ALWAYS ALLOW REPLIES
            const shouldReply = true;
            
            // FILTER REMOVED - ALL POSTS CAN BE REPLIED TO
            
            if (action === 'reply') {
                if (isPokemonContent) {
                    console.log(`   ✅ Pokemon-related content detected!`);
                } else if (isFollowedAccount) {
                    console.log(`   ✅ Followed account with card-related content - will reply`);
                }
                console.log(`   📝 Will attempt to reply to: "${data.text.substring(0, 80)}..."`);
                
                // IMMEDIATE DUPLICATE PREVENTION: Mark as replied BEFORE starting reply process
                // This prevents multiple simultaneous attempts to the same tweet
                if (data.tweetId) {
                    this.repliedTweetIds.add(data.tweetId);
                } else {
                    const textKey = `${data.username.toLowerCase()}::${data.text.substring(0, 60)}`;
                    this.repliedTextKeys.add(textKey);
                }
            }
            
            // If action is like-only, like and we're done
            if (action === 'like') {
                await this.tryLikeTweet(tweet);
                console.log('   👍 Like-only engagement');
                return true;
            }
            
            // CRITICAL: Click reply button IMMEDIATELY before any processing
            console.log('   🔍 Clicking reply button immediately...');
            let replyButton;
            try {
                // Re-find the tweet element to ensure it's still valid
                const tweetStillExists = await tweet.evaluate(el => {
                    return el && el.isConnected && document.body.contains(el);
                }).catch(() => false);
                
                if (!tweetStillExists) {
                    console.log('   ⚠️ Tweet element no longer in DOM');
                    // Add delay to prevent rapid retries
                    await this.sleep(3000);
                    return false;
                }
                
                // Scroll to tweet first
                await tweet.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                await this.sleep(500); // Shorter wait
                
                // Try to find and click reply button quickly
                const clicked = await tweet.evaluate(el => {
                    const btn = el.querySelector('button[data-testid="reply"]');
                    if (btn) {
                        btn.click();
                        return true;
                    }
                    return false;
                }).catch(() => false);
                
                if (!clicked) {
                    console.log('   ❌ Reply button not found or couldn\'t click');
                    return false;
                }
                
                console.log('   ✅ Reply button clicked');
            } catch (error) {
                if (error.message.includes('Node is detached') || 
                    error.message.includes('Cannot find context') ||
                    error.message.includes('Execution context was destroyed')) {
                    console.log(`   ⚠️ Tweet element detached before clicking reply`);
                    return false;
                }
                throw error;
            }
            
            // Wait for dialog to open
            await this.sleep(2000);
            
            // Verify dialog opened - check for reply textbox instead of specific text
            const dialogOpened = await this.page.evaluate(() => {
                // Check for the reply textbox which is more reliable
                const replyTextbox = document.querySelector('[data-testid="tweetTextarea_0"]');
                const dialog = document.querySelector('[role="dialog"]');
                // Either we have a reply textbox or a dialog is present
                return !!(replyTextbox || dialog);
            });
            
            if (!dialogOpened) {
                console.log('   ❌ Reply dialog did not open properly');
                await this.page.keyboard.press('Escape');
                // Add delay to prevent rapid clicking that might trigger rate limits
                await this.sleep(5000);
                return false;
            }
            
            console.log('   ✅ Reply dialog opened successfully');
            
            // NOW do all the processing while the dialog is open
            // Get thread context
            let threadContext = null;
            if (data.tweetUrl) {
                console.log(`   🔍 Fetching thread context from: ${data.tweetUrl}`);
                const ctxPage = await this.browser.newPage();
                try {
                    await ctxPage.goto(data.tweetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
                    await this.sleep(2000);
                    threadContext = await this.getThreadContextFromStatusPage(ctxPage);
                    
                    // Validate thread context - ensure it includes the current tweet
                    if (threadContext && threadContext.fullConversation) {
                        const hasCurrentTweet = threadContext.fullConversation.some(msg => 
                            msg.username === data.username && 
                            msg.text.includes(data.text.substring(0, 50))
                        );
                        
                        if (!hasCurrentTweet) {
                            console.log(`   ⚠️ Thread context doesn't match current tweet - discarding`);
                            threadContext = null;
                        } else {
                            console.log(`   ✅ Thread context validated - ${threadContext.fullConversation.length} messages`);
                        }
                    }
                } catch (e) { 
                    console.log(`   ⚠️ Could not get thread context: ${e.message}`);
                }
                await ctxPage.close();
            } else {
                console.log(`   ℹ️ No tweet URL available for thread context`);
            }
            
            // Analyze visual content if present
            let visualData = null;
            if (data.hasImages || data.hasVideos) {
                console.log(`   🔍 [DEBUG] Image/video detected, starting vision analysis...`);
                if (this.visualAnalyzer) {
                    try {
                        // Add timeout to prevent hanging when Gemini is overloaded
                        const visionPromise = this.visualAnalyzer.analyzeVisualContent(tweet);
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Vision analysis timeout')), 20000) // 20 second timeout
                        );
                        
                        visualData = await Promise.race([visionPromise, timeoutPromise]);
                        console.log(`   ✅ Vision analysis completed successfully`);
                    } catch (error) {
                        console.log(`   ⚠️ Vision analysis failed or timed out: ${error.message}`);
                        console.log(`   🔄 Continuing without vision data...`);
                        visualData = null;
                    }
                    
                    // Add delay after vision analysis to prevent API overload
                    console.log(`   ⏱️ Cooling down after vision analysis...`);
                    await this.sleep(5000); // 5 second delay to prevent overload
                    
                    console.log(`   📊 [DEBUG] Vision analysis result:`, {
                        hasVisionAnalysis: !!(visualData && visualData.visionAnalysis),
                        hasNaturalDescription: !!(visualData && visualData.visionAnalysis && visualData.visionAnalysis.naturalDescription),
                        visionAnalysisKeys: visualData && visualData.visionAnalysis ? Object.keys(visualData.visionAnalysis) : []
                    });
                    
                    if (visualData && visualData.analysis) {
                        console.log(`   🖼️ Visual: ${visualData.analysis.contentType} - ${visualData.analysis.focusArea}`);
                    }
                    
                    // Guard: if media present but vision yielded no meaningful content
                    const mediaPresent = data.hasImages || data.hasVideos;
                    const va = (visualData && visualData.visionAnalysis) ? visualData.visionAnalysis : null;
                    const noMeaningfulVision = !va || (va.analyzed === true && (!va.cards || va.cards.length === 0) && !va.isEventPoster && !va.isFanArt && !va.naturalDescription);
                    if (mediaPresent && noMeaningfulVision) {
                        // If this engagement originated from Following flow, allow safe text-only reply
                        const isFollowedSource = this.currentEngagementSource === 'following_feed';
                        if (!isFollowedSource) {
                            console.log('   ❌ Vision could not extract content from media — converting to like-only');
                            await this.page.keyboard.press('Escape');
                            await this.sleep(1000);
                            await this.tryLikeTweet(tweet);
                            console.log('   👍 Like-only engagement');
                            return true;
                        } else {
                            console.log('   ⚠️ Vision low-confidence but user is followed/source prioritized — proceeding with text-only reply');
                        }
                    }
                    // If vision explicitly flags to skip engagement, also convert to like-only
                    if (va && va.skipEngagement) {
                        console.log('   📱 Vision flagged non-TCG content — converting to like-only');
                        await this.page.keyboard.press('Escape');
                        await this.sleep(1000);
                        await this.tryLikeTweet(tweet);
                        console.log('   👍 Like-only engagement');
                        return true;
                    }
                } else {
                    console.log(`   ⚠️ [DEBUG] Visual analyzer not available!`);
                }
            }
            
            // Use CardKnowledge to identify specific cards mentioned
            let cardInsights = null;
            if (this.cardKnowledge) {
                try {
                    const cards = this.extractCardNames(data.text);
                    if (cards.length > 0) {
                        cardInsights = this.cardKnowledge.getCardInfo(cards[0]);
                        if (cardInsights) {
                            console.log(`   🎴 Card identified: ${cardInsights.name} - ${cardInsights.facts?.[0] || 'Known card'}`);
                        }
                    }
                } catch (error) {
                    console.log(`   ⚠️ Card knowledge lookup failed: ${error.message}`);
                }
            }
            
            // Note what type of Pokemon content this is
            if (visualData && visualData.visionAnalysis) {
                const visionType = visualData.visionAnalysis.tcgType || visualData.visionAnalysis.contentType;
                if (visionType === 'ONLINE' || visionType === 'OTHER') {
                    console.log(`   📱 Non-TCG Pokemon content detected (${visionType}) - will respond appropriately`);
                }
            }
            
            // Generate response using simplified thread-aware method (always prefer thread/vision when present)
            let response;
            console.log(`   🧠 Starting response generation for @${data.username}...`);
            try {
                // Always use the simplified thread-aware response that passes raw context to Gemini
                const responsePromise = this.generateThreadAwareResponse(
                    data.username, 
                    data.text, 
                    (threadContext && threadContext.fullConversation ? threadContext : { fullConversation: [] }), 
                    visualData
                );
                
                // Add 15 second timeout (reduced for faster response)
                const timeoutPromise = new Promise((resolve) => {
                    setTimeout(() => resolve(null), 15000);
                });
                
                response = await Promise.race([responsePromise, timeoutPromise]);
                
                if (response === null) {
                    console.log(`   ⚠️ Response generation timed out after 30s`);
                }
                // Filter out self-mentions to prevent tagging ourselves
                if (response) {
                    response = response.replace(/@GlitchyGrade\s*/gi, '').trim();
                }
                
                console.log(`   📝 Response from thread-aware: "${response || 'NULL'}"`);
                
                // If thread-aware fails or returns null, try simple AI response
                if (!response) {
                    console.log('   ⚠️ Thread-aware returned null, trying simple AI response');
                    response = await this.tryAIModels(
                        data.username,
                        data.text,
                        data.hasImages,
                        {},
                        visualData
                    );
                }
                // Deterministic text-only fallback if AI not available or response still empty
                if (!response) {
                    const textSnippet = (data.text || '').slice(0, 120);
                    
                    // First check if it's actually Pokemon/TCG related for appropriate responses
                    if (/pokemon|pokémon|card|tcg|pack|pull|booster|collection/i.test(textSnippet)) {
                        // Use varied Pokemon-specific fallback responses
                        const pokemonFallbacks = [
                            "Nice pull! 🔥",
                            "Sweet card! 💯", 
                            "Great find! 👍",
                            "Awesome pickup! ⭐",
                            "Solid addition! 🎯",
                            "Nice one! 🙌",
                            "Clean card! ✨",
                            "Good stuff! 👌",
                            "Fire pull! 🚀",
                            "Beautiful card! 😍"
                        ];
                        const randomIndex = Math.floor(Math.random() * pokemonFallbacks.length);
                        response = pokemonFallbacks[randomIndex];
                        
                        // Tailor for specific contexts
                        if (/for sale|fs:|wtb|wts|price|\$\d+/i.test(textSnippet)) {
                            response = `Looks solid. Are you taking offers, or firm on price?`;
                        } else if (/stream|live|twitch|youtube/i.test(textSnippet)) {
                            response = `Sounds fun—what time are you going live and what are you opening?`;
                        } else if (/pull|pulled|hit|pack|etb|booster/i.test(textSnippet)) {
                            response = `Let's go! What was the best pull from that run?`;
                        }
                    } else {
                        // Generic responses for non-Pokemon content (followed accounts only)
                        const genericFallbacks = [
                            "Interesting! 👀",
                            "Nice! 👍",
                            "Cool stuff! ✨", 
                            "Sounds good! 😊",
                            "That's awesome! 🔥",
                            "Love it! ❤️"
                        ];
                        const randomIndex = Math.floor(Math.random() * genericFallbacks.length);
                        response = genericFallbacks[randomIndex];
                    }
                }
            } catch (error) {
                console.log(`   ⚠️ Response generation failed: ${error.message}`);
                console.log(`   🔍 Error stack: ${error.stack}`);
                // Last resort - use simple fallback
                response = "Cool Pokemon content! Thanks for sharing";
            }
            
            // DEBUG: Log if we have vision data but response doesn't seem to acknowledge it
            const naturalDesc = extractNaturalDescription(visualData);
            if (naturalDesc && response) {
                const responseLower = response.toLowerCase();
                const visionLower = (naturalDesc || '').toLowerCase();
                
                // Check if response asks for things already visible
                const asksForVisible = [
                    "what.*look like",
                    "what.*chart",
                    "show.*chart",
                    "can.*see",
                    "what.*image",
                    "which.*card",
                    "what card"
                ].some(pattern => new RegExp(pattern).test(responseLower));
                
                if (asksForVisible) {
                    console.log(`   ⚠️ [WARNING] Response asks for visible content!`);
                    console.log(`      Vision saw: "${naturalDesc.substring(0, 100)}..."`);
                    console.log(`      Bot said: "${response}"`);
                }
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
            
            // Final length check and cleanup before sending
            if (response) {
                // Check if response is too generic - require at least one specific reference
                const originalText = data.text || '';
                const hasSpecificReference = /charizard|moonbreon|umbreon|alt art|psa|cgc|bgs|pull|set:|151|paradox|obsidian|evolving skies|crown zenith|gamestop|target|walmart|grade|slab|condition|market|price|power pack|mega evolutions|mail day|booster box/i.test(response);
                if (!hasSpecificReference && originalText.length > 10 && response.length > 20) {
                    console.log(`   ⚠️ Response too generic, enhancing with details...`);
                    // Add a specific element from the original tweet
                    const specificElements = originalText.match(/\b(charizard|moonbreon|umbreon|alt art|psa \d+|cgc \d+|bgs \d+|pull|set|151|paradox|obsidian|evolving skies|crown zenith|power pack|mega evolutions|booster|etb|mail day)\b/i);
                    if (specificElements) {
                        response = `${response} That ${specificElements[0]} is what caught my eye.`;
                    } else if (/pull|opened|hit/i.test(originalText)) {
                        response = `${response} Solid pull.`;
                    } else {
                        response = `${response} Nice find.`;
                    }
                }

                // Remove hashtags and @mentions per user policy
                response = sanitizeReplyText(response);
                // Humanize tone (medium slang, no emojis, sometimes ask question)
                response = humanizeReply(response, {
                    slangLevel: 'medium',
                    allowEmoji: false,
                    questionChance: 0.1,
                    maxExclamations: 1,
                    minLen: 80,
                    maxLen: 140,
                    maxSentences: 2,
                    voice: 'collector_casual'
                }, data.text || '');
                // Check for trailing incomplete thoughts
                const incompletePatterns = [
                    /\.\.\.\s*$/,
                    /\s+(Could|Would|Should|Might|Maybe|Perhaps|But|While|Though|Although|If)\s*\.?\s*$/i,
                    /,\s*$/,
                    /\s+-\s*$/,
                    /\s+—\s*$/
                ];
                
                for (const pattern of incompletePatterns) {
                    if (pattern.test(response)) {
                        console.log(`   ⚠️ Detected incomplete thought, fixing...`);
                        response = response.replace(pattern, '.').trim();
                    }
                }
                
                // Apply length limit with proper clamping
                if (response.length > 280) {
                    console.log(`   ⚠️ Response too long (${response.length} chars), clamping properly...`);
                    response = clampTweet(response, 280);
                } else if (response.length < 10) {
                    console.log(`   ⚠️ Response too short (${response.length} chars), skipping...`);
                    response = null; // Skip very short responses
                }
            }
            
            // Track response variety
            if (this.responseVariety && response) {
                this.responseVariety.trackResponse({ username: data.username, text: data.text, response });
            }
            
            // Record interaction in history (will update later if successful)
            if (this.userInteractionHistory && data.tweetId) {
                this.userInteractionHistory.recordInteraction(data.username, data.text, data.tweetId);
            }
            
            // Now find the reply box in the open dialog
            console.log('   🔍 Looking for reply textbox...');
            console.log(`   📝 [DEBUG] Response ready to type: "${response ? response.substring(0, 50) + '...' : 'NO RESPONSE'}"`);;
            
            // Try multiple possible selectors for the reply box
            let replyBox = null;
            const replySelectors = [
                '[data-testid="tweetTextarea_0"]',
                'div[role="textbox"][data-testid="tweetTextarea_0"]',
                'div[contenteditable="true"][role="textbox"]',
                'div[contenteditable="true"][data-text="true"]',
                '.DraftEditor-root .public-DraftEditor-content',
                'div[aria-label*="Tweet text"]',
                'div[aria-label*="Reply"]',
                'div.public-DraftStyleDefault-block'
            ];
            
            for (const selector of replySelectors) {
                try {
                    replyBox = await this.page.waitForSelector(selector, { timeout: 3000 });
                    if (replyBox) {
                        console.log(`   ✅ Found reply box with selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Try next selector
                }
            }
            
            if (!replyBox) {
                console.log('   ❌ Could not find reply box with any selector');
                // Try to close any open modal
                try {
                    await this.page.keyboard.press('Escape');
                } catch (e) {}
                return false;
            }
            
            // Type the response with dialog monitoring
            let typingTime;
            try {
                // Check if we have a valid response
                if (!response || (typeof response === 'string' && response.trim().length === 0)) {
                    console.log('   ❌ No valid response to type (response is null/empty), closing dialog...');
                    await this.page.keyboard.press('Escape');
                    return false;
                }
                
                typingTime = await this.humanType(replyBox, response);
            } catch (error) {
                console.log('   ⚠️ Error during typing:', error.message);
                // Check if dialog is still open
                const stillOpen = await this.page.evaluate(() => {
                    return !!document.querySelector('[role="dialog"]');
                });
                if (!stillOpen) {
                    console.log('   ❌ Dialog closed during typing, aborting...');
                    return false;
                }
                throw error;
            }
            
            // Wait for full typing time plus buffer to ensure all text is in the box
            await this.sleep(Math.max(2000, typingTime + 1000));
            
            // Verify the full text is in the reply box before sending
            const typedText = await this.page.evaluate(() => {
                const box = document.querySelector('[data-testid="tweetTextarea_0"]') || 
                           document.querySelector('div[contenteditable="true"][role="textbox"]');
                return box ? box.textContent || box.innerText || '' : '';
            });
            
            // Check if we have most of the text (allow for @username prepending)
            const expectedLength = response.length;
            const typedLength = typedText.length;
            if (typedLength < expectedLength - 20) { // Allow 20 char buffer for @username
                console.log(`   ⚠️ Text not fully typed. Expected ~${expectedLength} chars, got ${typedLength}`);
                
                // If very little was typed (like just "y"), the dialog might have been interrupted
                if (typedLength < 10) {
                    console.log(`   ❌ Critical: Only ${typedLength} chars typed. Dialog was likely interrupted.`);
                    // Clear typing state
                    if (this.conversationFollowUp) {
                        this.conversationFollowUp.setTypingState(false);
                    }
                    this.isTyping = false;
                    await this.page.evaluate(() => {
                        window.botIsTyping = false;
                    });
                    // Close dialog
                    await this.page.keyboard.press('Escape');
                    await this.sleep(1000);
                    return false;
                }
                
                // Wait a bit more
                await this.sleep(3000);
                
                // Check again
                const typedTextAfterWait = await this.page.evaluate(() => {
                    const box = document.querySelector('[data-testid="tweetTextarea_0"]') || 
                               document.querySelector('div[contenteditable="true"][role="textbox"]');
                    return box ? box.textContent || box.innerText || '' : '';
                });
                
                if (typedTextAfterWait.length < expectedLength - 20) {
                    console.log(`   ❌ Still incomplete. Aborting reply.`);
                    // Clear typing state
                    if (this.conversationFollowUp) {
                        this.conversationFollowUp.setTypingState(false);
                    }
                    this.isTyping = false;
                    await this.page.evaluate(() => {
                        window.botIsTyping = false;
                    });
                    await this.page.keyboard.press('Escape');
                    return false;
                }
            }
            
            // Final safety check - ensure we're still in reply dialog before sending
            const inReplyDialog = await this.page.evaluate(() => {
                const dialog = document.querySelector('[role="dialog"]');
                const replyBox = document.querySelector('[data-testid="tweetTextarea_0"]');
                const hasReplyingTo = dialog && dialog.innerText.includes('Replying to');
                return !!(dialog && replyBox && hasReplyingTo);
            });
            
            if (!inReplyDialog) {
                console.log('   ❌ Not in reply dialog! Aborting send to prevent misplaced tweet');
                await this.page.keyboard.press('Escape');
                return false;
            }
            
            // Send
            const sent = await this.page.evaluate(() => {
                const primary = document.querySelector('button[data-testid="tweetButton"]');
                if (primary && !primary.disabled) {
                    primary.click();
                    return true;
                }
                const inline = document.querySelector('button[data-testid="tweetButtonInline"]');
                if (inline && !inline.disabled) {
                    inline.click();
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
            
            // Debug: check if button still exists
            const buttonStillExists = await this.page.evaluate(() => {
                return !!document.querySelector('button[data-testid="tweetButton"]');
            });
            console.log(`   📋 Button still exists after click: ${buttonStillExists}`);
            
            // Check what happened after send attempt
            const postSendState = await this.page.evaluate(() => {
                return {
                    textareaExists: !!document.querySelector('[data-testid="tweetTextarea_0"]'),
                    dialogExists: !!document.querySelector('[role="dialog"]'),
                    errorMessage: document.querySelector('[role="alert"]')?.innerText || null,
                    allAlerts: Array.from(document.querySelectorAll('[role="alert"]')).map(a => a.innerText)
                };
            });
            
            console.log('   📋 Post-send state:', JSON.stringify(postSendState, null, 2));
            
            // Check if reply was successful
            const success = await this.page.waitForFunction(
                () => !document.querySelector('[data-testid="tweetTextarea_0"]'),
                { timeout: 5000 }
            ).then(() => true).catch(() => false);
            
            if (success) {
                // Double-check: see if we're still in a dialog
                const stillInDialog = await this.page.evaluate(() => {
                    return !!document.querySelector('[role="dialog"]');
                });
                console.log(`   📋 Still in dialog after success: ${stillInDialog}`);
                
                this.replyCount++;
                this.repliedUsers.add(data.username.toLowerCase());
                if (data.tweetId) {
                    this.repliedTweetIds.add(data.tweetId);
                } else {
                    const textKey = `${data.username.toLowerCase()}::${data.text.substring(0, 60)}`;
                    this.repliedTextKeys.add(textKey);
                }
                // Track user reply timestamp for cooldown
                this.recentReplies.set(data.username.toLowerCase(), Date.now());
                // Track content hash to prevent duplicate replies to same content
                const contentHash = this.hashContent(data.username, data.text);
                this.repliedContentHashes.add(contentHash);
                this.repliesThisHour.push(Date.now()); // Track for rate limiting
                console.log(`   ✅ Sent! [${this.replyCount}/1000]`);
                
                // Like the tweet AFTER successfully sending reply
                try {
                    // Try to find and like the original tweet on the page
                    const liked = await this.page.evaluate((username) => {
                        const tweets = document.querySelectorAll('[data-testid="tweet"]');
                        for (const tweet of tweets) {
                            const tweetUsername = tweet.querySelector('a[href^="/"]')?.getAttribute('href')?.substring(1);
                            if (tweetUsername === username) {
                                const likeButton = tweet.querySelector('[data-testid="like"]');
                                if (likeButton) {
                                    likeButton.click();
                                    return true;
                                }
                            }
                        }
                        return false;
                    }, data.username);
                    
                    if (liked) {
                        console.log('   ❤️ Liked after reply');
                    }
                } catch (e) {
                    // Ignore like errors
                }
                
                // Wait longer to prevent page refresh issues
                await this.sleep(5000);
                
                // Debug: Try to find our reply in the thread
                const ourReplyVisible = await this.page.evaluate((replyText) => {
                    const tweets = document.querySelectorAll('[data-testid="tweet"]');
                    for (const tweet of tweets) {
                        const text = tweet.querySelector('[data-testid="tweetText"]')?.innerText;
                        if (text && text.includes(replyText.substring(0, 50))) {
                            return true;
                        }
                    }
                    return false;
                }, response);
                
                console.log(`   📋 Our reply visible on page: ${ourReplyVisible}`);
                
                // RECORD IN USER INTERACTION HISTORY
                await this.userInteractionHistory.recordInteraction(
                    data.username,
                    data.tweetId,
                    data.text,
                    response
                );
                
                // Update engagement selector AFTER successful reply
                this.engagementSelector.updateAfterReply(data.username);
                
                // Start tracking this conversation for outcomes
                if (data.tweetId) {
                    this.conversationAnalyzer.startConversation(data.tweetId, {
                        ...interaction,
                        responseId: `resp_${Date.now()}`
                    });
                    
                    // Track for proactive follow-ups
                    if (this.conversationFollowUp) {
                        await this.conversationFollowUp.trackConversation(
                            data.tweetId,
                            data.username,
                            response,
                            {
                                topic: interaction.topics?.[0] || 'pokemon',
                                sentiment: interaction.sentiment?.sentiment || 'neutral',
                                hasImages: data.hasImages,
                                cardsMentioned: interaction.topics || []
                            }
                        );
                    }
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

                // Close the reply dialog after successful reply
                await this.sleep(2000); // Wait for reply to post
                await this.page.keyboard.press('Escape');

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
                    // Double-check this is NOT a retweet button
                    const ariaLabel = await likeButton.evaluate(el => el.getAttribute('aria-label') || '');
                    const testId = await likeButton.evaluate(el => el.getAttribute('data-testid') || '');
                    
                    // Skip if this looks like a retweet button
                    if (ariaLabel.toLowerCase().includes('retweet') || 
                        testId.toLowerCase().includes('retweet') ||
                        ariaLabel.toLowerCase().includes('repost')) {
                        console.log('   ⚠️ Skipping - found retweet button instead of like');
                        continue;
                    }
                    
                    await likeButton.click();
                    console.log(`   ❤️ Liked`);
                    liked = true;

                    // Track engagement outcome
                    await this.engagementOutcomeTracker.trackEngagement({
                        type: 'like',
                        targetTweetId: tweet.id || 'unknown',
                        targetUsername: tweet.username || 'unknown',
                        responseType: 'like_only'
                    });
                    
                    // Move mouse away from tweet buttons to avoid accidental interactions
                    await this.page.mouse.move(100, 100);
                    await this.sleep(2000);  // Increased wait to ensure no accidental clicks
                } catch (e) {
                    // Try next selector
                }
            }
        }
        return liked;
    }
    
    async startRedditMonitoring() {
        try {
            console.log('🔍 Starting Reddit narrative monitoring...');
            // Initial scan
            const narratives = await this.redditMonitor.monitorAll();
            console.log(`   📊 Found ${narratives.length} active narratives`);
            
            // Set up periodic monitoring (every 30 minutes)
            setInterval(async () => {
                try {
                    const updates = await this.redditMonitor.monitorAll();
                    console.log(`   🔄 Reddit update: ${updates.length} narratives tracked`);
                } catch (error) {
                    console.log(`   ⚠️ Reddit monitoring error: ${error.message}`);
                }

        // Update engagement outcomes and response effectiveness with real measurement
        try {
            await this.engagementOutcomeTracker.updateResponseEffectiveness(this.page);
            const metrics = this.engagementOutcomeTracker.getSuccessMetrics();
            console.log(`   📊 Engagement metrics: ${metrics.successfulOutcomes}/${metrics.totalTracked} (${metrics.replyRate?.toFixed(1) || 0}%)`);
        } catch (error) {
            console.log(`   ⚠️ Engagement outcome update error: ${error.message}`);
        }
            }, 30 * 60 * 1000);
        } catch (error) {
            console.log(`   ⚠️ Reddit monitor startup failed: ${error.message}`);
        }
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
            
            // Proactive follow-up stats
            if (this.conversationFollowUp) {
                const followUpStats = this.conversationFollowUp.getStats();
                console.log(`\n   Proactive Follow-ups:`);
                console.log(`   • Active Tracking: ${followUpStats.active}`);
                console.log(`   • Archived: ${followUpStats.archived}`);
                console.log(`   • With Questions: ${followUpStats.withQuestions}`);
                console.log(`   • Multi-Exchange: ${followUpStats.multiExchange}`);
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
                    return clampTweet(response, 240);
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
    console.log('🤖 Pokemon Bot v2 Starting...');
    console.log('   🎯 Target: Pokemon TCG Community');
    console.log('   🧠 Mode: Self-Aware Contextual Responses');
    console.log('   📊 Features: Vision, Market Analysis, Learning');
    
    // Global error handlers for 24/7 stability
    process.on('uncaughtException', (error) => {
        console.error('💥 Uncaught Exception:', error);
        console.log('🔄 Bot will continue running...');
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
        console.log('🔄 Bot will continue running...');
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
        console.log('🛑 Received SIGTERM, shutting down gracefully...');
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log('🛑 Received SIGINT, shutting down gracefully...');
        process.exit(0);
    });

    // Start bot with retry logic
    async function startBotWithRetry(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const bot = new ContextualPokemonBot();
                await bot.run();
                console.log('✅ Bot started successfully');
                break;
            } catch (error) {
                console.error(`❌ Bot start attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    console.error('💥 All start attempts failed, exiting...');
                    process.exit(1);
                }
                
                console.log(`⏳ Waiting 10 seconds before retry ${attempt + 1}...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }

    startBotWithRetry();
} else {
    module.exports = ContextualPokemonBot;
}

// Helper method to clean up any leftover dialogs
ContextualPokemonBot.prototype.cleanupDialogs = async function() {
    try {
        // Check if there are any open dialogs
        const hasDialog = await this.page.evaluate(() => {
            return !!document.querySelector('[role="dialog"]') ||
                   !!document.querySelector('[data-testid*="modal"]') ||
                   !!document.querySelector('[aria-modal="true"]');
        });

        if (hasDialog) {
            console.log('   🧹 Cleaning up leftover dialogs...');
            await this.page.keyboard.press('Escape');
            await this.sleep(1000);

            // Double-check and close again if needed
            const stillHasDialog = await this.page.evaluate(() => {
                return !!document.querySelector('[role="dialog"]') ||
                       !!document.querySelector('[data-testid*="modal"]') ||
                       !!document.querySelector('[aria-modal="true"]');
            });

            if (stillHasDialog) {
                await this.page.keyboard.press('Escape');
                await this.sleep(500);
            }

            console.log('   ✅ Dialogs cleaned up');
        }
    } catch (error) {
        // Ignore cleanup errors
    }
};