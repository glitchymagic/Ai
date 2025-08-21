const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import all features
const SearchEngine = require('./features/search-engine');
const Memory = require('./features/memory');
const ResponseGenerator = require('./features/response-generator');
const LMStudioAI = require('./features/lmstudio-ai');
const ContentFilter = require('./features/content-filter');
const MentionMonitor = require('./features/mention-monitor');

puppeteer.use(StealthPlugin());

const GEMINI_API_KEY = 'AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.8,
    }
});

class ImprovedPokemonBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.replyCount = 77; // Continue from where we left off
        this.repliedUsers = new Set();
        this.startTime = Date.now();
        
        // Initialize all features
        this.searchEngine = new SearchEngine();
        this.memory = new Memory();
        this.responseGenerator = new ResponseGenerator();
        this.lmStudioAI = new LMStudioAI();
        this.contentFilter = new ContentFilter();
        this.mentionMonitor = null;
        
        this.geminiFailures = 0;
        this.lastMentionCheck = 0;
        
        // Configuration
        this.config = {
            mentionCheckInterval: 300000, // Check mentions every 5 minutes
            replyWaitTime: { min: 30000, max: 60000 },
            engagementChance: 0.4, // 40% chance to engage with posts
            scrollsPerSearch: 5,
            minPostQuality: 2 // Minimum quality score to engage
        };
        
        // Statistics
        this.stats = {
            postsAnalyzed: 0,
            postsFiltered: 0,
            engagementsMade: 0,
            mentionsHandled: 0,
            knowledgeExtracted: 0
        };
    }

    async generateResponse(username, tweetContent, hasImages = false) {
        // Try Gemini first (if we haven't hit too many failures)
        if (this.geminiFailures < 5) {
            try {
                const prompt = `You are a knowledgeable Pokemon TCG enthusiast replying to @${username}. 
Their post: "${tweetContent}"
${hasImages ? '[Post includes images]' : ''}

Reply with 15-30 words. Be specific, knowledgeable, and enthusiastic about Pokemon TCG. Reference specific cards, sets, or market trends when relevant. No hashtags.

Reply:`;

                const result = await model.generateContent(prompt);
                let response = result.response.text().trim()
                    .replace(/^[\"']|[\"']$/g, '')
                    .replace(/^Reply:?\s*/i, '')
                    .replace(/#\w+/g, '')
                    .trim();
                
                // Clean and validate response
                response = this.contentFilter.cleanResponse(response);
                
                console.log(`   🤖 [Gemini] "${response}"`);
                this.geminiFailures = 0;
                return response;
                
            } catch (error) {
                this.geminiFailures++;
                console.log(`   ⚠️ Gemini quota exceeded, trying LM Studio...`);
            }
        }
        
        // Try LM Studio next
        const lmResponse = await this.lmStudioAI.generateResponse(username, tweetContent, hasImages);
        if (lmResponse) {
            const cleaned = this.contentFilter.cleanResponse(lmResponse);
            console.log(`   🤖 [LM Studio] "${cleaned}"`);
            return cleaned;
        }
        
        // Use contextual fallback responses
        const response = this.responseGenerator.generateContextualResponse(
            username, 
            tweetContent, 
            hasImages
        );
        console.log(`   🤖 [Fallback] "${response}"`);
        return response;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    async humanType(element, text) {
        await element.click();
        await this.sleep(500);
        
        for (let char of text) {
            await this.page.keyboard.type(char);
            await this.sleep(await this.random(50, 100));
        }
    }

    async init() {
        console.log('🚀 Pokemon TCG Bot - IMPROVED VERSION');
        console.log('=====================================');
        console.log('✅ Content filtering active');
        console.log('✅ Enhanced knowledge extraction');
        console.log('✅ 100+ search variations');
        console.log('✅ LM Studio AI backup');
        console.log('✅ Mention monitoring');
        console.log('✅ User memory system\n');
        
        // Initialize memory
        await this.memory.initialize();
        
        try {
            // Connect to existing Chrome with debug port
            console.log('🔌 Connecting to Chrome debug session...');
            this.browser = await puppeteer.connect({
                browserURL: 'http://127.0.0.1:9222',
                defaultViewport: null
            });
            
            console.log('✅ Connected!');
            
            // Get pages
            const pages = await this.browser.pages();
            console.log(`📱 Found ${pages.length} tabs open`);
            
            // Find X tab
            for (const page of pages) {
                const url = page.url();
                if (url.includes('x.com') || url.includes('twitter.com')) {
                    this.page = page;
                    console.log(`   ✅ Using X.com tab: ${url.substring(0, 50)}...`);
                    break;
                }
            }
            
            if (!this.page && pages.length > 0) {
                this.page = pages[0];
                console.log('📱 Using first tab, navigating to X.com...');
                await this.page.goto('https://x.com/home', { 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                });
            }
            
            if (!this.page) {
                console.log('❌ No pages found');
                return false;
            }
            
            await this.page.bringToFront();
            
            // Initialize mention monitor
            this.mentionMonitor = new MentionMonitor(this.page, GEMINI_API_KEY);
            
            console.log('✅ Ready to engage intelligently!\n');
            return true;
            
        } catch (error) {
            console.log('❌ Error:', error.message);
            return false;
        }
    }

    async checkMentionsIfTime() {
        if (!this.mentionMonitor) return;
        
        const now = Date.now();
        if (now - this.lastMentionCheck > this.config.mentionCheckInterval) {
            console.log('\n🔔 Checking for mentions...');
            const mentionsHandled = await this.mentionMonitor.checkForMentions();
            
            if (mentionsHandled > 0) {
                console.log(`   ✅ Handled ${mentionsHandled} mentions!`);
                this.replyCount += mentionsHandled;
                this.stats.mentionsHandled += mentionsHandled;
            } else {
                console.log(`   📭 No new mentions`);
            }
            
            this.lastMentionCheck = now;
        }
    }

    async processTimeline() {
        console.log('🔍 Starting intelligent Pokemon TCG engagement...\n');
        
        while (this.replyCount < 1000) {
            try {
                // Check for mentions periodically
                await this.checkMentionsIfTime();
                
                // Get diverse search query
                const query = this.searchEngine.getTrendingSearch();
                console.log(`📍 Searching: "${query}"`);
                
                await this.page.goto(`https://x.com/search?q=${encodeURIComponent(query)}&f=live`, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                }).catch(async (err) => {
                    console.log('⚠️  Navigation timeout, continuing...');
                    await this.sleep(5000);
                });
                
                await this.sleep(await this.random(5000, 8000));
                
                // Track search performance
                let postsFound = 0;
                let postsEngaged = 0;
                let postsFiltered = 0;
                
                for (let scroll = 0; scroll < this.config.scrollsPerSearch; scroll++) {
                    const tweets = await this.page.$$('article[data-testid="tweet"]');
                    postsFound = tweets.length;
                    console.log(`📊 Found ${tweets.length} posts`);
                    
                    if (tweets.length === 0) {
                        console.log('⚠️  No posts found');
                        
                        // Check for error screen
                        const hasError = await this.page.evaluate(() => {
                            const bodyText = document.body.innerText || '';
                            return bodyText.includes('Something went wrong') || 
                                   bodyText.includes('Try reloading');
                        });
                        
                        if (hasError) {
                            console.log('🔄 Error screen - waiting for manual refresh');
                            await this.sleep(10000);
                        }
                        break;
                    }
                    
                    // Analyze posts for quality engagement
                    for (let i = 0; i < Math.min(3, tweets.length); i++) {
                        const tweet = tweets[i];
                        const shouldEngage = await this.analyzeAndMaybeEngage(tweet);
                        
                        if (shouldEngage === 'engaged') {
                            postsEngaged++;
                            const waitTime = await this.random(
                                this.config.replyWaitTime.min,
                                this.config.replyWaitTime.max
                            );
                            console.log(`⏰ Waiting ${Math.floor(waitTime/1000)}s...\n`);
                            await this.sleep(waitTime);
                            break; // Only one engagement per scroll
                        } else if (shouldEngage === 'filtered') {
                            postsFiltered++;
                        }
                    }
                    
                    // Scroll down
                    await this.page.evaluate(() => {
                        window.scrollBy({
                            top: 400 + Math.random() * 200,
                            behavior: 'smooth'
                        });
                    });
                    
                    await this.sleep(await this.random(3000, 5000));
                }
                
                // Track search success with accurate metrics
                this.searchEngine.trackSearchSuccess(query, postsFound, postsEngaged);
                this.stats.postsAnalyzed += postsFound;
                this.stats.postsFiltered += postsFiltered;
                this.stats.engagementsMade += postsEngaged;
                
                // Show stats every 10 replies
                if (this.replyCount % 10 === 0) {
                    this.showStats();
                }
                
            } catch (error) {
                console.log(`⚠️ Error: ${error.message}`);
                console.log('Continuing...\n');
                await this.sleep(10000);
            }
        }
    }

    async analyzeAndMaybeEngage(tweet) {
        try {
            const tweetData = await tweet.evaluate(el => {
                let username = null;
                const links = el.querySelectorAll('a[href^="/"]');
                for (const link of links) {
                    const href = link.getAttribute('href');
                    if (href && href.match(/^\/[^\/]+$/) && !href.includes('/home')) {
                        username = href.substring(1);
                        break;
                    }
                }
                
                const textEl = el.querySelector('[data-testid="tweetText"]');
                const tweetText = textEl ? textEl.innerText : '';
                const hasImages = el.querySelector('img[alt*="Image"]') !== null;
                
                return { username, tweetText, hasImages };
            });
            
            // Basic validation
            if (!tweetData.username || !tweetData.tweetText) {
                return 'skipped';
            }
            
            // Skip if already replied
            if (this.repliedUsers.has(tweetData.username.toLowerCase())) {
                console.log(`   ⚠️ Already replied to @${tweetData.username}`);
                return 'skipped';
            }
            
            // Content filtering
            const filterResult = this.contentFilter.shouldEngageWithPost(
                tweetData.tweetText, 
                tweetData.username
            );
            
            if (!filterResult.engage) {
                console.log(`   🚫 Filtered: ${filterResult.reason}`);
                return 'filtered';
            }
            
            // Quality check
            if (filterResult.quality < this.config.minPostQuality) {
                console.log(`   📉 Low quality score: ${filterResult.quality}`);
                return 'filtered';
            }
            
            // Random engagement chance
            if (Math.random() > this.config.engagementChance) {
                return 'skipped';
            }
            
            // Engage with this post
            console.log(`\n💬 @${tweetData.username}: "${tweetData.tweetText.substring(0, 100)}..."`);
            console.log(`   ✨ Quality score: ${filterResult.quality}`);
            
            // Learn from the post BEFORE replying
            await this.memory.rememberUser(tweetData.username, tweetData.tweetText);
            await this.memory.learnFromPost(tweetData.tweetText, {
                username: tweetData.username
            });
            
            // Reply to the tweet
            const success = await this.replyToTweet(tweet, tweetData);
            
            return success ? 'engaged' : 'failed';
            
        } catch (error) {
            console.log(`   ❌ Analysis error: ${error.message}`);
            return 'error';
        }
    }

    async replyToTweet(tweet, tweetData) {
        try {
            const response = await this.generateResponse(
                tweetData.username,
                tweetData.tweetText,
                tweetData.hasImages
            );
            
            // Scroll to tweet
            await tweet.evaluate(el => el.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            }));
            
            await this.sleep(await this.random(2000, 3000));
            
            // Like the post
            const likeButton = await tweet.$('button[data-testid="like"]');
            if (likeButton) {
                await likeButton.click();
                console.log(`   ❤️ Liked`);
                await this.sleep(await this.random(1500, 2500));
            }
            
            // Click reply button
            const replyButton = await tweet.$('button[data-testid="reply"]');
            if (!replyButton) return false;
            
            await replyButton.click();
            console.log(`   💭 Opening reply...`);
            await this.sleep(await this.random(3000, 5000));
            
            // Wait for reply box
            const replyBox = await this.page.waitForSelector(
                'div[data-testid="tweetTextarea_0"]',
                { timeout: 10000 }
            ).catch(() => null);
            
            if (!replyBox) {
                console.log(`   ❌ Reply box didn't open`);
                await this.page.keyboard.press('Escape');
                return false;
            }
            
            // Type response
            console.log(`   ⌨️ Typing...`);
            await this.humanType(replyBox, response);
            await this.sleep(await this.random(2000, 3000));
            
            // Send
            console.log(`   📤 Sending...`);
            
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
            
            // Check if sent
            const replyBoxGone = await this.page.$('div[data-testid="tweetTextarea_0"]')
                .then(el => el === null);
            
            if (replyBoxGone) {
                this.replyCount++;
                this.repliedUsers.add(tweetData.username.toLowerCase());
                console.log(`   ✅ Sent! [${this.replyCount}/1000]`);
                return true;
            } else {
                console.log(`   ⚠️ May not have sent`);
                await this.page.keyboard.press('Escape');
                return false;
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            try {
                await this.page.keyboard.press('Escape');
            } catch {}
            return false;
        }
    }

    showStats() {
        const runtime = Math.floor((Date.now() - this.startTime) / 60000);
        
        console.log('\n📊 === ENHANCED BOT STATISTICS ===');
        console.log(`   Replies sent: ${this.replyCount}`);
        console.log(`   Runtime: ${runtime} minutes`);
        console.log(`   Rate: ${(this.replyCount / Math.max(runtime, 1)).toFixed(1)} replies/min`);
        console.log(`   Posts analyzed: ${this.stats.postsAnalyzed}`);
        console.log(`   Posts filtered: ${this.stats.postsFiltered} (${((this.stats.postsFiltered/Math.max(this.stats.postsAnalyzed,1))*100).toFixed(1)}%)`);
        console.log(`   Engagement rate: ${((this.stats.engagementsMade/Math.max(this.stats.postsAnalyzed,1))*100).toFixed(1)}%`);
        console.log(`   Mentions handled: ${this.stats.mentionsHandled}`);
        
        const memStats = this.memory.getMemoryStats();
        console.log(`   Users met: ${memStats.totalUsers}`);
        console.log(`   Prices learned: ${memStats.totalKnowledge.prices}`);
        console.log(`   Trends tracked: ${memStats.totalKnowledge.trends.length}`);
        
        const searchStats = this.searchEngine.getSearchStats();
        console.log(`   Unique searches: ${searchStats.uniqueSearches}`);
        console.log(`   Successful searches: ${searchStats.successfulSearches}`);
        
        console.log('==================================\n');
    }

    async run() {
        try {
            const initialized = await this.init();
            
            if (initialized) {
                await this.processTimeline();
            }
            
        } catch (error) {
            console.error('❌ Fatal error:', error);
        } finally {
            console.log('\n✅ Improved bot session complete');
            this.showStats();
            console.log('📌 Browser stays open');
        }
    }
}

// Start the improved bot
const bot = new ImprovedPokemonBot();
bot.run().catch(console.error);