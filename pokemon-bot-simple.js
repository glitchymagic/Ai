const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import our new features
const SearchEngine = require('./features/search-engine');
const Memory = require('./features/memory');
const ResponseGenerator = require('./features/response-generator');
const LMStudioAI = require('./features/lmstudio-ai');

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

class SimplePokemonBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.replyCount = 35; // Continue from where we are
        this.repliedUsers = new Set();
        this.startTime = Date.now();
        
        // Initialize new features
        this.searchEngine = new SearchEngine();
        this.memory = new Memory();
        this.responseGenerator = new ResponseGenerator();
        this.lmStudioAI = new LMStudioAI(); // Connects to LM Studio on port 1234
        this.geminiFailures = 0;
    }

    async generateResponse(username, tweetContent, hasImages = false) {
        // Try Gemini first (if we haven't hit too many failures)
        if (this.geminiFailures < 5) {
            try {
                const prompt = `You are a Pokemon TCG enthusiast replying to @${username}. 
Their post: "${tweetContent}"
${hasImages ? '[Post includes images]' : ''}

Reply in 5-20 words. Be specific to their post. Sound like a real Pokemon fan. No hashtags.

Reply:`;

                const result = await model.generateContent(prompt);
                let response = result.response.text().trim()
                    .replace(/^[\"']|[\"']$/g, '')
                    .replace(/^Reply:?\s*/i, '')
                    .replace(/#\w+/g, '')
                    .trim();
                
                console.log(`   🤖 [Gemini] "${response}"`);
                this.geminiFailures = 0; // Reset on success
                return response;
                
            } catch (error) {
                this.geminiFailures++;
                console.log(`   ⚠️ Gemini quota exceeded, trying LM Studio...`);
            }
        }
        
        // Try LM Studio next
        const lmResponse = await this.lmStudioAI.generateResponse(username, tweetContent, hasImages);
        if (lmResponse) {
            console.log(`   🤖 [LM Studio] "${lmResponse}"`);
            return lmResponse;
        }
        
        // Use fallback response generator as last resort
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
        console.log('🚀 Pokemon TCG Bot - SIMPLE VERSION');
        console.log('=====================================');
        console.log('✅ 100+ search variations active');
        console.log('✅ User memory system active');
        console.log('✅ Learning from interactions\n');
        
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
            
            // Find X tab or use first page
            for (const page of pages) {
                const url = page.url();
                console.log(`   Tab: ${url.substring(0, 50)}...`);
                if (url.includes('x.com') || url.includes('twitter.com')) {
                    this.page = page;
                    console.log('   ✅ Using this X.com tab!');
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
            
            // Quick check if we're on X
            const url = this.page.url();
            if (!url.includes('x.com') && !url.includes('twitter.com')) {
                console.log('📱 Navigating to X.com...');
                await this.page.goto('https://x.com/home', { 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                });
            }
            
            console.log('✅ Ready to start engaging!\n');
            return true;
            
        } catch (error) {
            console.log('❌ Error:', error.message);
            return false;
        }
    }

    async processTimeline() {
        console.log('🔍 Starting Pokemon TCG engagement...\n');
        
        while (this.replyCount < 1000) {
            try {
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
                let engagementsMade = 0;
                
                for (let scroll = 0; scroll < 5; scroll++) {
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
                            console.log('🔄 Error screen detected - please refresh manually');
                            await this.sleep(10000);
                        }
                        break;
                    }
                    
                    // 40% chance to engage with posts
                    if (tweets.length > 0 && Math.random() < 0.4) {
                        const tweetIndex = await this.random(0, Math.min(2, tweets.length - 1));
                        const tweet = tweets[tweetIndex];
                        
                        const success = await this.replyToTweet(tweet);
                        
                        if (success) {
                            engagementsMade++;
                            const waitTime = await this.random(30000, 60000);
                            console.log(`⏰ Waiting ${Math.floor(waitTime/1000)}s...\n`);
                            await this.sleep(waitTime);
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
                
                // Track search success
                this.searchEngine.trackSearchSuccess(query, postsFound, engagementsMade);
                
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
            
            // Remember user and learn
            await this.memory.rememberUser(tweetData.username, tweetData.tweetText);
            await this.memory.learnFromPost(tweetData.tweetText, {
                username: tweetData.username
            });
            
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
        
        console.log('\n📊 === BOT STATISTICS ===');
        console.log(`   Replies sent: ${this.replyCount}`);
        console.log(`   Runtime: ${runtime} minutes`);
        console.log(`   Rate: ${(this.replyCount / Math.max(runtime, 1)).toFixed(1)} replies/min`);
        
        const memStats = this.memory.getMemoryStats();
        console.log(`   Users met: ${memStats.totalUsers}`);
        console.log(`   Knowledge: ${memStats.totalKnowledge.prices} prices`);
        
        const searchStats = this.searchEngine.getSearchStats();
        console.log(`   Unique searches: ${searchStats.uniqueSearches}`);
        console.log(`   Successful searches: ${searchStats.successfulSearches}`);
        
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
            console.log('\n✅ Bot session complete');
            console.log('📌 Browser stays open');
        }
    }
}

// Start the bot
const bot = new SimplePokemonBot();
bot.run().catch(console.error);