// Authority Integration
// Connects the hot cards tracker, authority responses, and market reports to the main bot

const HotCardsTracker = require('./hot-cards-tracker');
const AuthorityResponseEngine = require('./authority-response-engine');
const MarketReporter = require('./market-reporter');
const UnifiedPriceService = require('../price-engine/services/UnifiedPriceService');
const RedditMonitor = require('./reddit-monitor');
const KOLMonitor = require('./kol-monitor');
const NarrativeDetector = require('./narrative-detector');
const CrossPlatformAnalyzer = require('./cross-platform-analyzer');

class AuthorityIntegration {
    constructor(page = null) {
        this.initialized = false;
        this.priceService = null;
        this.hotCards = null;
        this.authorityEngine = null;
        this.marketReporter = null;
        
        // New monitoring systems
        this.redditMonitor = null;
        this.kolMonitor = null;
        this.narrativeDetector = null;
        this.crossPlatformAnalyzer = null;
        this.page = page; // Puppeteer page for KOL monitoring
        
        // Track original posts
        this.lastOriginalPost = null;
        this.originalPostInterval = 2 * 60 * 60 * 1000; // 2 hours between posts (more active like aixbt)
        this.lastNarrativePost = null;
        this.narrativePostInterval = 3 * 60 * 60 * 1000; // 3 hours between narrative posts
    }
    
    async initialize() {
        console.log('🏗️ Initializing Authority Systems...');
        
        try {
            // Initialize price service with your existing infrastructure
            this.priceService = new UnifiedPriceService();
            await this.priceService.initialize();
            console.log('✅ Price service connected');
            
            // Initialize hot cards tracker
            this.hotCards = new HotCardsTracker(this.priceService);
            console.log('✅ Hot cards tracker ready');
            
            // Initialize authority response engine
            this.authorityEngine = new AuthorityResponseEngine(this.hotCards);
            console.log('✅ Authority response engine ready');
            
            // Initialize market reporter
            this.marketReporter = new MarketReporter(this.hotCards);
            console.log('✅ Market reporter ready');
            
            // Initialize monitoring systems
            console.log('🔍 Initializing cross-platform monitoring...');
            this.redditMonitor = new RedditMonitor();
            console.log('✅ Reddit monitor ready');
            
            if (this.page) {
                this.kolMonitor = new KOLMonitor(this.page);
                console.log('✅ KOL monitor ready');
            } else {
                console.log('⚠️ KOL monitor requires Puppeteer page - will initialize later');
            }
            
            // Initialize narrative systems
            this.narrativeDetector = new NarrativeDetector(this.redditMonitor, this.kolMonitor);
            console.log('✅ Narrative detector ready');
            
            this.crossPlatformAnalyzer = new CrossPlatformAnalyzer(
                this.redditMonitor,
                this.kolMonitor,
                this.narrativeDetector,
                this.hotCards,
                this.authorityEngine
            );
            console.log('✅ Cross-platform analyzer ready');
            
            // Pre-load top cards for faster responses
            await this.preloadTopCards();
            
            // Start Reddit monitoring immediately (KOL monitoring can start later)
            await this.crossPlatformAnalyzer.startMonitoring();
            console.log('🚀 Cross-platform monitoring active (Reddit running, KOL pending)!');
            
            this.initialized = true;
            console.log('🚀 Authority systems fully operational!');
            
        } catch (error) {
            console.error('Failed to initialize authority systems:', error);
            // Graceful degradation - bot can still run without prices
            this.initialized = false;
        }
    }
    
    // Pre-load critical cards for instant responses
    async preloadTopCards() {
        console.log('📊 Pre-loading top card prices...');
        const criticalCards = this.hotCards.HOT_CARDS.filter(c => c.priority === 'critical');
        
        for (const card of criticalCards.slice(0, 5)) {
            await this.hotCards.getCardPrice(card);
        }
    }
    
    // ==================== BOT INTEGRATION METHODS ====================
    
    // Enhanced response generation with authority data
    async enhanceResponse(originalResponse, context) {
        if (!this.initialized) return originalResponse;
        
        try {
            // First check for narrative-based responses
            if (this.crossPlatformAnalyzer && context.cardName) {
                const intelligence = await this.crossPlatformAnalyzer.getCardIntelligence(context.cardName);
                
                if (intelligence.narratives.length > 0) {
                    const narrative = intelligence.narratives[0];
                    const priceData = await this.hotCards.getPriceByName(context.cardName);
                    const narrativeResponse = this.authorityEngine.generateNarrativeResponse(
                        context.cardName, 
                        narrative, 
                        priceData
                    );
                    
                    if (narrativeResponse) {
                        console.log('   🎯 [Narrative] Cross-platform intelligence response');
                        return narrativeResponse;
                    }
                }
            }
            
            // Try standard authority response
            const authorityResponse = await this.authorityEngine.generateAuthorityResponse(context);
            
            if (authorityResponse) {
                console.log('   💰 [Authority] Enhanced with price data');
                return authorityResponse;
            }
            
            // If no specific authority response, try to enhance original
            if (context.cardName && context.isPriceRelated) {
                const priceData = await this.hotCards.getPriceByName(context.cardName);
                if (priceData) {
                    return this.addPriceToResponse(originalResponse, priceData);
                }
            }
            
        } catch (error) {
            console.error('Authority enhancement failed:', error);
        }
        
        return originalResponse;
    }
    
    // Add price data to existing response
    addPriceToResponse(response, priceData) {
        const priceSnippet = ` · $${priceData.market} (${priceData.trend > 0 ? '+' : ''}${priceData.trend}%)`;
        
        // Check if response already has price info
        if (response.includes('$')) {
            return response;
        }
        
        // Add price snippet if room
        if (response.length + priceSnippet.length <= 280) {
            return response + priceSnippet;
        }
        
        return response;
    }
    
    // Generate original market post
    async generateOriginalPost() {
        if (!this.initialized) return null;
        
        // Check if it's time for an original post
        if (this.lastOriginalPost && 
            Date.now() - this.lastOriginalPost < this.originalPostInterval) {
            return null;
        }
        
        try {
            const post = await this.marketReporter.generateScheduledPost();
            
            if (post) {
                this.lastOriginalPost = Date.now();
                console.log('📝 Generated original market post');
                return post;
            }
            
        } catch (error) {
            console.error('Failed to generate original post:', error);
        }
        
        return null;
    }
    
    // Extract card context from tweet and images
    extractCardContext(tweetContent, visualData = null) {
        const context = {
            cardName: null,
            isPriceQuestion: false,
            isPriceRelated: false,
            sentiment: 'neutral'
        };
        
        // Check if it's a price question
        const priceTerms = ['worth', 'value', 'price', 'cost', '$', 'how much'];
        context.isPriceQuestion = priceTerms.some(term => 
            tweetContent.toLowerCase().includes(term)
        );
        
        // Price related includes market discussion
        const marketTerms = ['market', 'trend', 'pump', 'dump', 'moon', 'crash'];
        context.isPriceRelated = context.isPriceQuestion || 
            marketTerms.some(term => tweetContent.toLowerCase().includes(term));
        
        // Extract card name from visual data if available
        if (visualData && visualData.visionAnalysis && visualData.visionAnalysis.cards.length > 0) {
            const topCard = visualData.visionAnalysis.cards[0];
            context.cardName = topCard.name;
        }
        
        // Try to extract card name from text
        if (!context.cardName) {
            context.cardName = this.extractCardNameFromText(tweetContent);
        }
        
        // Determine sentiment
        if (tweetContent.includes('🔥') || tweetContent.includes('fire')) {
            context.sentiment = 'positive';
        } else if (tweetContent.includes('😭') || tweetContent.includes('L')) {
            context.sentiment = 'negative';
        }
        
        return context;
    }
    
    // Extract card name from tweet text
    extractCardNameFromText(text) {
        // Check against hot cards list
        const textLower = text.toLowerCase();
        
        for (const card of this.hotCards.HOT_CARDS) {
            // Check various forms of the name
            const searchTerms = [
                card.name.toLowerCase(),
                card.id.replace(/-/g, ' '),
                card.name.split(' ')[0].toLowerCase() // First word (e.g., "Umbreon")
            ];
            
            for (const term of searchTerms) {
                if (textLower.includes(term)) {
                    return card.name;
                }
            }
        }
        
        return null;
    }
    
    // Get market statistics for dashboard
    async getMarketStats() {
        if (!this.initialized) return null;
        
        const movers = await this.hotCards.getTopMovers(5);
        const stats = {
            topGainers: movers.gainers,
            topLosers: movers.losers,
            highVolume: movers.highVolume,
            lastUpdate: new Date().toISOString()
        };
        
        return stats;
    }
    
    // Check if we should post an original
    shouldPostOriginal() {
        if (!this.initialized) return false;
        
        const reportType = this.marketReporter.getNextReportType();
        const timeSinceLastPost = Date.now() - (this.lastOriginalPost || 0);
        
        // Post if we have a scheduled report type and enough time has passed
        return reportType && timeSinceLastPost > this.originalPostInterval;
    }
    
    // Initialize KOL monitor with Puppeteer page
    async setKOLMonitorPage(page) {
        if (!page) return;
        
        console.log('🔗 Setting up KOL monitor with Puppeteer page...');
        this.page = page;
        
        if (!this.kolMonitor && this.initialized) {
            this.kolMonitor = new KOLMonitor(page);
            
            // Re-initialize narrative systems with KOL monitor
            this.narrativeDetector = new NarrativeDetector(this.redditMonitor, this.kolMonitor);
            this.crossPlatformAnalyzer = new CrossPlatformAnalyzer(
                this.redditMonitor,
                this.kolMonitor,
                this.narrativeDetector,
                this.hotCards,
                this.authorityEngine
            );
            
            // Start monitoring
            await this.crossPlatformAnalyzer.startMonitoring();
            console.log('✅ KOL monitoring now active!');
        }
    }
    
    // Generate narrative-based post
    async generateNarrativePost() {
        if (!this.initialized || !this.crossPlatformAnalyzer) return null;
        
        // Check if it's time for a narrative post
        if (this.lastNarrativePost && 
            Date.now() - this.lastNarrativePost < this.narrativePostInterval) {
            return null;
        }
        
        try {
            // Get current narratives
            const narratives = await this.narrativeDetector.getCurrentNarratives('strong');
            
            if (narratives.length > 0) {
                const post = this.authorityEngine.generateNarrativePost(narratives);
                
                if (post) {
                    this.lastNarrativePost = Date.now();
                    console.log('🎯 Generated narrative-based post');
                    return post;
                }
            }
            
        } catch (error) {
            console.error('Failed to generate narrative post:', error);
        }
        
        return null;
    }
    
    // Check if we should engage based on narratives
    async shouldEngageWithPost(postContent, username) {
        if (!this.crossPlatformAnalyzer) return { should: true, reason: 'standard' };
        
        return await this.crossPlatformAnalyzer.shouldRespond(postContent, username);
    }
    
    // Get intelligence report
    async getIntelligenceReport() {
        if (!this.crossPlatformAnalyzer) return null;
        
        return await this.crossPlatformAnalyzer.getLatestReport();
    }
}

// Singleton instance
let authorityInstance = null;

function getAuthorityIntegration(page = null) {
    if (!authorityInstance) {
        authorityInstance = new AuthorityIntegration(page);
    }
    
    // Set page if provided and not already set
    if (page && !authorityInstance.page && authorityInstance.initialized) {
        authorityInstance.setKOLMonitorPage(page);
    }
    
    return authorityInstance;
}

module.exports = {
    AuthorityIntegration,
    getAuthorityIntegration
};