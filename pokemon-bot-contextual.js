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

puppeteer.use(StealthPlugin());

const GEMINI_API_KEY = 'AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7,
    }
});

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
        this.visualAnalyzer = null; // Will initialize after page is ready
        this.conversationChecker = null; // Will initialize after page is ready
        this.conversationTracker = new ConversationTracker();
        
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
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                
                const prompt = `You're in a Pokemon TCG Twitter thread. ${contextSummary}

Latest reply from @${username}: "${latestMessage}"

Respond naturally with full context awareness:
- Reference earlier parts of conversation if relevant
- Answer any questions that were asked
- Use slang: ngl, tbh, fire, banger, W, sheesh
- Stay on the thread's topic
- Be helpful and specific
- Max 25 words

Thread-aware reply:`;

                const result = await model.generateContent(prompt);
                let response = result.response.text().trim()
                    .replace(/^[\"']|[\"']$/g, '')
                    .replace(/#\w+/g, '')
                    .split('\n')[0]
                    .trim();
                
                // Aggressive truncation for Twitter
                if (response.length > 150) {
                    const words = response.split(' ');
                    let truncated = '';
                    for (const word of words) {
                        if ((truncated + ' ' + word).length > 140) break;
                        truncated += (truncated ? ' ' : '') + word;
                    }
                    response = truncated.trim();
                }
                
                console.log(`   🧵 [Thread-aware] "${response}"`);
                return response;
                
            } catch (error) {
                console.log(`   ⚠️ Thread response failed, using regular response`);
            }
        }
        
        // Fallback to regular response
        return this.generateContextualResponse(username, latestMessage, threadContext.hasImages);
    }

    async generateContextualResponse(username, tweetContent, hasImages = false, visualData = null) {
        // CRITICAL: Make response actually relate to the tweet content
        
        // FIRST PRIORITY: Human-like responses that won't get flagged as bot
        const humanResponse = this.humanLike.generateHumanResponse(tweetContent, { hasImages });
        if (humanResponse && Math.random() < 0.7) { // 70% chance to use human-like response
            console.log(`   💬 [Human] "${humanResponse}"`);
            return humanResponse;
        }
        
        // SECOND: Try advanced context extraction for ultra-specific responses
        const advancedContext = this.advancedContext.extractFullContext(tweetContent, hasImages);
        const specificResponse = this.advancedContext.generateSpecificResponse(advancedContext, tweetContent);
        
        if (specificResponse && this.advancedContext.isValuableResponse(specificResponse) && Math.random() < 0.2) {
            console.log(`   🎯 [Advanced] "${specificResponse}"`);
            return specificResponse;
        }
        
        // If we have visual data, prioritize visual-specific responses
        if (visualData && visualData.analysis && (hasImages || visualData.hasVideo)) {
            const visualResponse = this.visualAnalyzer.generateVisualResponse(tweetContent, visualData);
            if (visualResponse && Math.random() < 0.8) {  // 80% chance for visual-aware response
                console.log(`   🖼️ [Visual] "${visualResponse}"`);
                return visualResponse;
            }
        }
        
        // Use advanced context analyzer for best responses
        const contextualResponse = this.contextAnalyzer.generateContextualResponse(tweetContent, hasImages);
        if (contextualResponse && Math.random() < 0.6) {  // Reduced to 60% since we have advanced context
            console.log(`   📊 [Context] "${contextualResponse}"`);
            return contextualResponse;
        }
        
        // Check card knowledge for helpful responses
        const helpfulResponse = this.cardKnowledge.generateHelpfulResponse(tweetContent, hasImages);
        if (helpfulResponse && Math.random() < 0.5) {  // 50% chance for helpful response
            console.log(`   💡 [Knowledge] "${helpfulResponse}"`);
            return helpfulResponse;
        }
        
        // Try varied response patterns
        const variedResponse = this.responseVariety.getVariedResponse(tweetContent, hasImages);
        if (variedResponse && Math.random() < 0.3) {  // 30% chance for varied response
            console.log(`   🎲 [Variety] "${variedResponse}"`);
            return variedResponse;
        }
        
        // Check for memes very occasionally
        const memeResponse = this.pokemonCulture.generateMemeResponse(tweetContent);
        if (memeResponse && Math.random() < 0.05) {  // 5% chance to use meme response
            return memeResponse;
        }
        
        // Check if this is a reply to us (conversation)
        const isConversation = tweetContent.toLowerCase().includes('@glitchygradeai');
        const isPokemonRelated = this.contentFilter.isPokemonRelated(tweetContent.toLowerCase());
        
        // Try Gemini first
        if (this.geminiFailures < 5) {
            try {
                let prompt;
                if (isConversation) {
                    // More conversational for replies
                    if (isPokemonRelated) {
                        prompt = `You're a Pokemon card collector chatting on Twitter.

@${username} replied: "${tweetContent}"
${hasImages ? 'They posted a pic' : ''}

Reply naturally as a collector:
- Match their energy level
- Comment specifically on what they said
- Use minimal slang - only when it fits naturally
- Keep it brief (under 25 words)
- Sound genuine, not forced

Your reply:`;
                    } else {
                        // Non-Pokemon conversation - be friendly and natural
                        prompt = `You collect Pokemon cards and someone's talking to you.

@${username} said: "${tweetContent}"
${hasImages ? 'With a pic' : ''}

Reply naturally:
- Be chill and friendly
- Talk about whatever they brought up
- Don't force Pokemon into it
- Use casual internet speak
- Keep it real

Quick reply:`;
                    }
                } else {
                    // Normal response
                    prompt = `You're scrolling Pokemon Twitter and see this:

@${username}: "${tweetContent}"
${hasImages ? 'They posted a pic of cards' : ''}

You're a knowledgeable Pokemon card collector. Choose ONE approach:
1. Ask a specific question about their post
2. Give helpful advice or information  
3. Make an observation about what they're showing
4. Share relevant market/pricing info
5. Appreciate what they're sharing

Focus on being helpful and specific to their post.
${hasImages ? 
'Comment on the specific cards/condition visible.' : 
'Respond directly to what they wrote.'}
Maximum 25 words. No hashtags or emojis.

Your response:`;
                }

                const result = await model.generateContent(prompt);
                let response = result.response.text().trim()
                    .replace(/^[\"']|[\"']$/g, '')
                    .replace(/#\w+/g, '')
                    .split('\n')[0]  // Take first line only
                    .trim();
                
                // Aggressive truncation for Twitter
                if (response.length > 150) {
                    const words = response.split(' ');
                    let truncated = '';
                    for (const word of words) {
                        if ((truncated + ' ' + word).length > 140) break;
                        truncated += (truncated ? ' ' : '') + word;
                    }
                    response = truncated.trim();
                }
                
                console.log(`   🤖 [Gemini] "${response}"`);
                this.geminiFailures = 0;
                return response;
                
            } catch (error) {
                this.geminiFailures++;
                console.log(`   ⚠️ Gemini failed, trying LM Studio...`);
            }
        }
        
        // Try LM Studio
        if (this.lmStudioAI.available) {
            try {
                let messages;
                if (isConversation) {
                    // Conversational for replies
                    if (isPokemonRelated) {
                        messages = [
                            {
                                role: "system",
                                content: "You're a Pokemon card collector. Reply naturally to what they said. Be specific, not generic. 15-25 words max."
                            },
                            {
                                role: "user",
                                content: `@${username} replied: "${tweetContent}". ${hasImages ? 'With pic.' : ''} Reply back:`
                            }
                        ];
                    } else {
                        // Non-Pokemon conversation
                        messages = [
                            {
                                role: "system",
                                content: "You collect Pokemon cards. Reply casually to whatever they said. Be chill and use internet speak. 15-25 words."
                            },
                            {
                                role: "user",
                                content: `@${username}: "${tweetContent}". ${hasImages ? 'Pic included.' : ''} Quick reply:`
                            }
                        ];
                    }
                } else {
                    // Normal response
                    messages = [
                        {
                            role: "system",
                            content: hasImages ? 
                                "Pokemon collector. React to their pic. Use slang: fire, banger, chase, W pull, sheesh. Max 20 words. Sound casual." :
                                "Pokemon collector. React genuinely. Use: ngl, tbh, lowkey, sick pull, that's heat. Ask about cards. Max 20 words."
                        },
                        {
                            role: "user",
                            content: `@${username}: "${tweetContent}". ${hasImages ? 'Posted cards pic.' : 'No pic.'} Your reaction:`
                        }
                    ];
                }
                
                const response = await this.lmStudioAI.generateDirectResponse(messages);
                if (response) {
                    // Remove any surrounding quotes
                    const cleaned = response.replace(/^["']|["']$/g, '').trim();
                    console.log(`   🤖 [LM Studio] "${cleaned}"`);
                    return cleaned;
                }
            } catch (error) {
                console.log(`   ⚠️ LM Studio error: ${error.message}`);
            }
        }
        
        // Fallback: Context-aware templates
        return this.generateFallbackResponse(tweetContent, hasImages);
    }
    
    generateFallbackResponse(tweetContent, hasImages) {
        const textLower = tweetContent.toLowerCase();
        
        // Extract key information from tweet
        const cards = this.extractCardNames(textLower);
        const prices = this.extractPrices(textLower);
        const isQuestion = tweetContent.includes('?');
        
        // Determine context and respond appropriately
        if (cards.length > 0) {
            const card = cards[0];
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
        return Math.floor(Math.random() * (max - min + 1)) + min;
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
                
                // Better navigation with retry logic
                let navigationSuccess = false;
                for (let navRetry = 0; navRetry < 3; navRetry++) {
                    try {
                        await this.page.goto(`https://x.com/search?q=${encodeURIComponent(query)}&f=live`, {
                            waitUntil: 'domcontentloaded',  // Changed from networkidle2
                            timeout: 20000
                        });
                        navigationSuccess = true;
                        break;
                    } catch (navError) {
                        if (navError.message.includes('Requesting main frame too early')) {
                            console.log('⚠️ Frame not ready, waiting...');
                            await this.sleep(5000);
                        } else {
                            console.log('⚠️ Navigation issue, retrying...');
                            await this.sleep(3000);
                        }
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
                
                let engaged = false;
                
                for (let scroll = 0; scroll < 3; scroll++) {
                    const tweets = await this.page.$$('article[data-testid="tweet"]');
                    console.log(`📊 Found ${tweets.length} posts`);
                    
                    if (tweets.length === 0) break;
                    
                    // Check first few tweets for quality content
                    for (let i = 0; i < Math.min(3, tweets.length); i++) {
                        if (engaged) break;
                        
                        const tweet = tweets[i];
                        const shouldEngage = await this.analyzeTweet(tweet);
                        
                        if (shouldEngage) {
                            const success = await this.engageWithTweet(tweet);
                            if (success) {
                                engaged = true;
                                this.stats.successfulEngagements++;
                                const waitTime = await this.random(30000, 60000);
                                console.log(`⏰ Waiting ${Math.floor(waitTime/1000)}s...\n`);
                                await this.sleep(waitTime);
                            }
                        }
                    }
                    
                    if (!engaged) {
                        await this.page.evaluate(() => {
                            window.scrollBy({ top: 400, behavior: 'smooth' });
                        });
                        await this.sleep(await this.random(3000, 5000));
                    }
                }
                
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
            
            this.stats.postsAnalyzed++;
            
            // More lenient engagement (lowered quality threshold, increased chance)
            return filterResult.quality >= 1 && Math.random() < 0.45;
            
        } catch (error) {
            return false;
        }
    }

    async engageWithTweet(tweet) {
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
            
            // Generate contextual response with visual data
            const response = await this.generateContextualResponse(
                data.username, 
                data.text, 
                data.hasImages,
                visualData
            );
            
            // Interact with tweet
            await tweet.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
            await this.sleep(2000);
            
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
            
            // Smart truncation at word boundary - AGGRESSIVE
            if (aiResponse.length > 150) {  // Much stricter limit
                const words = aiResponse.split(' ');
                let truncated = '';
                for (const word of words) {
                    if ((truncated + ' ' + word).length > 140) break;
                    truncated += (truncated ? ' ' : '') + word;
                }
                aiResponse = truncated.trim();
            }
            
            return aiResponse;
        }
        
        return null;
    } catch (error) {
        return null;
    }
};

const bot = new ContextualPokemonBot();
bot.run().catch(console.error);