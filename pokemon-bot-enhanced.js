const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import our new features
const MentionMonitor = require('./features/mention-monitor');
const SearchEngine = require('./features/search-engine');
const Memory = require('./features/memory');

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

class EnhancedPokemonBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.replyCount = 35; // Continue from where we are
        this.repliedUsers = new Set();
        this.startTime = Date.now();
        
        // Initialize new features
        this.mentionMonitor = null;
        this.searchEngine = new SearchEngine();
        this.memory = new Memory();
        
        // Feature flags (can toggle features on/off)
        this.features = {
            mentionChecking: true,
            diverseSearches: true,
            userMemory: true,
            learning: true
        };
        
        // Timing configuration
        this.config = {
            mentionCheckInterval: 60000, // Check mentions every minute
            replyWaitTime: { min: 30000, max: 60000 },
            mentionPriority: true // Prioritize mention responses
        };
        
        this.lastMentionCheck = 0;
    }

    async generateResponse(username, tweetContent, hasImages = false) {
        try {
            // Check if we know this user
            let personalizedContext = '';
            if (this.features.userMemory) {
                const greeting = this.memory.generatePersonalizedGreeting(username);
                if (greeting) {
                    personalizedContext = `Start with: "${greeting}" then answer. `;
                }
            }
            
            const prompt = `You are a Pokemon TCG enthusiast replying to @${username}. 
${personalizedContext}
Their post: "${tweetContent}"
${hasImages ? '[Post includes images]' : ''}

Reply in 5-20 words. Be specific to their post. Sound like a real Pokemon fan. No hashtags.

Reply:`;

            const result = await model.generateContent(prompt);
            let response = result.response.text().trim()
                .replace(/^["']|["']$/g, '')
                .replace(/^Reply:?\s*/i, '')
                .replace(/#\w+/g, '')
                .trim();
            
            console.log(`   🤖 "${response}"`);
            return response;
            
        } catch (error) {
            console.log(`   ⚠️ AI Error: ${error.message}`);
            return "Love the Pokemon TCG community!";
        }
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
        console.log('🚀 Pokemon TCG Bot - ENHANCED VERSION');
        console.log('=====================================');
        console.log('✅ Mention monitoring active');
        console.log('✅ 100+ search variations');
        console.log('✅ User memory system');
        console.log('✅ Learning from interactions\n');
        
        // Initialize memory
        if (this.features.userMemory) {
            await this.memory.initialize();
        }
        
        // Set up browser
        this.browser = await puppeteer.launch({
            headless: false,
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            args: [
                '--disable-blink-features=AutomationControlled',
                '--window-size=1400,900'
            ]
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1400, height: 900 });
        
        // Initialize mention monitor
        if (this.features.mentionChecking) {
            this.mentionMonitor = new MentionMonitor(this.page, GEMINI_API_KEY);
            console.log('📨 Mention monitoring enabled\n');
        }
        
        // Login process
        console.log('📱 Please login to X/Twitter');
        await this.page.goto('https://x.com/login', { waitUntil: 'networkidle2' });
        
        console.log('Waiting for login...\n');
        for (let i = 0; i < 60; i++) {
            await this.sleep(5000);
            const loggedIn = await this.page.evaluate(() => {
                return document.querySelector('a[href="/home"]') !== null;
            });
            if (loggedIn) {
                console.log('✅ Login successful!\n');
                return true;
            }
        }
        
        console.log('❌ Login timeout');
        return false;
    }

    async checkMentionsIfTime() {
        if (!this.features.mentionChecking || !this.mentionMonitor) return;
        
        const now = Date.now();
        if (now - this.lastMentionCheck > this.config.mentionCheckInterval) {
            console.log('\n🔔 Checking for mentions...');
            const mentionsHandled = await this.mentionMonitor.checkForMentions();
            
            if (mentionsHandled > 0) {
                console.log(`   ✅ Handled ${mentionsHandled} mentions!\n`);
                this.replyCount += mentionsHandled;
            }
            
            this.lastMentionCheck = now;
        }
    }

    async processTimeline() {
        console.log('🔍 Starting enhanced Pokemon TCG engagement...\n');
        
        while (this.replyCount < 1000) {
            try {
                // Check for mentions periodically
                await this.checkMentionsIfTime();
                
                // Get next search query
                const query = this.features.diverseSearches ? 
                    this.searchEngine.getTrendingSearch() : 
                    this.getBasicSearch();
                
                console.log(`📍 Searching: "${query}"`);
                
                await this.page.goto(`https://x.com/search?q=${encodeURIComponent(query)}&f=live`, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                }).catch(async () => {
                    console.log('⚠️  Navigation issue, retrying...');
                    await this.sleep(5000);
                    return;
                });
                
                await this.sleep(await this.random(5000, 8000));
                
                // Track search performance
                let postsFound = 0;
                let engagementsMade = 0;
                
                for (let scroll = 0; scroll < 5; scroll++) {
                    const tweets = await this.page.$$('article[data-testid="tweet"]');
                    postsFound = tweets.length;
                    console.log(`📊 Found ${tweets.length} posts`);
                    
                    if (tweets.length === 0) {
                        console.log('⚠️  No posts - refresh if you see "Something went wrong"');
                        await this.sleep(5000);
                        break;
                    }
                    
                    // 40% chance to engage
                    if (tweets.length > 0 && Math.random() < 0.4) {
                        const tweetIndex = await this.random(0, Math.min(2, tweets.length - 1));
                        const tweet = tweets[tweetIndex];
                        
                        const success = await this.replyToTweet(tweet);
                        
                        if (success) {
                            engagementsMade++;
                            const waitTime = await this.random(
                                this.config.replyWaitTime.min,
                                this.config.replyWaitTime.max
                            );
                            console.log(`⏰ Waiting ${Math.floor(waitTime/1000)}s...\n`);
                            await this.sleep(waitTime);
                        }
                    }
                    
                    // Scroll
                    await this.page.evaluate(() => {
                        window.scrollBy({
                            top: 400 + Math.random() * 200,
                            behavior: 'smooth'
                        });
                    });
                    
                    await this.sleep(await this.random(3000, 5000));
                }
                
                // Track search success
                if (this.features.diverseSearches) {
                    this.searchEngine.trackSearchSuccess(query, postsFound, engagementsMade);
                }
                
                // Occasionally show stats
                if (this.replyCount % 10 === 0) {
                    this.showStats();
                }
                
            } catch (error) {
                console.log(`⚠️ Error: ${error.message}`);
                console.log('Continuing...');
                await this.sleep(10000);
            }
        }
    }

    async replyToTweet(tweet) {
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
            
            if (!tweetData.username || !tweetData.tweetText || tweetData.tweetText.length < 10) {
                return false;
            }
            
            if (this.repliedUsers.has(tweetData.username.toLowerCase())) {
                console.log(`   ⚠️ Already replied to @${tweetData.username}`);
                return false;
            }
            
            console.log(`\n💬 @${tweetData.username}: "${tweetData.tweetText.substring(0, 100)}..."`);
            
            // Remember this user
            if (this.features.userMemory) {
                await this.memory.rememberUser(tweetData.username, tweetData.tweetText);
            }
            
            // Learn from the post
            if (this.features.learning) {
                await this.memory.learnFromPost(tweetData.tweetText, {
                    username: tweetData.username
                });
            }
            
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
            
            // Like
            const likeButton = await tweet.$('button[data-testid="like"]');
            if (likeButton) {
                await likeButton.click();
                console.log(`   ❤️ Liked`);
                await this.sleep(await this.random(1500, 2500));
            }
            
            // Reply
            const replyButton = await tweet.$('button[data-testid="reply"]');
            if (!replyButton) return false;
            
            await replyButton.click();
            console.log(`   💭 Opening reply...`);
            await this.sleep(await this.random(3000, 5000));
            
            const replyBox = await this.page.waitForSelector(
                'div[data-testid="tweetTextarea_0"]',
                { timeout: 10000 }
            ).catch(() => null);
            
            if (!replyBox) {
                console.log(`   ❌ Reply box didn't open`);
                await this.page.keyboard.press('Escape');
                return false;
            }
            
            console.log(`   ⌨️ Typing...`);
            await this.humanType(replyBox, response);
            await this.sleep(await this.random(2000, 3000));
            
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
            
            const replyBoxGone = await this.page.$('div[data-testid="tweetTextarea_0"]').then(el => el === null);
            
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

    getBasicSearch() {
        const searches = [
            '#PokemonTCG',
            '#PokemonCards',
            'Pokemon TCG',
            'Pokemon cards',
            'Pokemon collection'
        ];
        return searches[Math.floor(Math.random() * searches.length)];
    }

    showStats() {
        const runtime = Math.floor((Date.now() - this.startTime) / 60000);
        
        console.log('\n📊 === BOT STATISTICS ===');
        console.log(`   Replies sent: ${this.replyCount}`);
        console.log(`   Runtime: ${runtime} minutes`);
        console.log(`   Rate: ${(this.replyCount / Math.max(runtime, 1)).toFixed(1)} replies/min`);
        
        if (this.features.userMemory) {
            const memStats = this.memory.getMemoryStats();
            console.log(`   Users met: ${memStats.totalUsers}`);
            console.log(`   Knowledge: ${memStats.totalKnowledge.prices} prices, ${memStats.totalKnowledge.trends.length} trends`);
        }
        
        if (this.features.diverseSearches) {
            const searchStats = this.searchEngine.getSearchStats();
            console.log(`   Unique searches used: ${searchStats.uniqueSearches}`);
            console.log(`   Successful searches found: ${searchStats.successfulSearches}`);
        }
        
        console.log('=======================\n');
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
            const runtime = Math.floor((Date.now() - this.startTime) / 60000);
            console.log('\n📊 Final Summary:');
            console.log(`   Total replies: ${this.replyCount}`);
            console.log(`   Runtime: ${runtime} minutes`);
            
            this.showStats();
            
            console.log('\n✅ Enhanced bot session complete');
            console.log('📌 Browser stays open');
            
            await new Promise(() => {});
        }
    }
}

// Start the enhanced bot
const bot = new EnhancedPokemonBot();
bot.run().catch(console.error);