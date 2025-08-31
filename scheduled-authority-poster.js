// Scheduled Authority Poster
// Posts data-driven content at strategic times to build market authority

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const OriginalContentGenerator = require('./features/original-content-generator.js');
const PredictionTracker = require('./features/prediction-tracker.js');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

class ScheduledAuthorityPoster {
    constructor() {
        this.page = null;
        this.browser = null;
        this.contentGenerator = new OriginalContentGenerator();
        this.predictionTracker = new PredictionTracker();
        this.lastPostTimes = {};
        this.postsToday = 0;
        this.startTime = Date.now();
    }
    
    async init() {
        try {
            console.log('🚀 Connecting to browser for authority posting...');
            
            // Connect to existing Chrome
            this.browser = await puppeteer.connect({
                browserURL: 'http://127.0.0.1:9222',
                defaultViewport: null
            });
            
            const pages = await this.browser.pages();
            this.page = pages.find(p => p.url().includes('x.com') || p.url().includes('twitter.com'));
            
            if (!this.page) {
                this.page = pages[0];
                await this.page.goto('https://x.com/home', { 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                });
            }
            
            await this.contentGenerator.initialize();
            await this.predictionTracker.initialize();
            
            console.log('✅ Authority poster ready!\n');
            return true;
            
        } catch (error) {
            console.log('❌ Init error:', error.message);
            return false;
        }
    }
    
    async postTweet(content) {
        try {
            console.log('\n📝 Posting authority content...');
            console.log(`Content: "${content.substring(0, 50)}..."`);
            
            // Navigate to home
            await this.page.goto('https://x.com/home', {
                waitUntil: 'networkidle2',
                timeout: 30000
            }).catch(() => {});
            
            await this.sleep(3000);
            
            // Click compose button
            const composeButton = await this.page.$('[data-testid="SideNav_NewTweet_Button"]') ||
                                 await this.page.$('[aria-label="Compose Tweet"]') ||
                                 await this.page.$('a[href="/compose/tweet"]');
            
            if (!composeButton) {
                console.log('❌ Could not find compose button');
                return false;
            }
            
            await composeButton.click();
            await this.sleep(2000);
            
            // Find tweet text area
            const tweetBox = await this.page.waitForSelector(
                'div[data-testid="tweetTextarea_0"]',
                { timeout: 10000 }
            );
            
            if (!tweetBox) {
                console.log('❌ Could not find tweet box');
                await this.page.keyboard.press('Escape');
                return false;
            }
            
            // Type content with human speed
            await this.humanType(tweetBox, content);
            await this.sleep(2000);
            
            // Send tweet
            const sent = await this.page.evaluate(() => {
                const btn = document.querySelector('[data-testid="tweetButton"]');
                if (btn && !btn.disabled) {
                    btn.click();
                    return true;
                }
                return false;
            });
            
            if (!sent) {
                // Try keyboard shortcut
                await this.page.keyboard.down('Meta');
                await this.page.keyboard.press('Enter');
                await this.page.keyboard.up('Meta');
            }
            
            await this.sleep(3000);
            
            // Verify sent
            const success = await this.page.$('div[data-testid="tweetTextarea_0"]')
                .then(el => el === null);
            
            if (success) {
                console.log('✅ Authority post published!');
                this.postsToday++;
                return true;
            } else {
                console.log('❌ Failed to post');
                await this.page.keyboard.press('Escape');
                return false;
            }
            
        } catch (error) {
            console.log('❌ Posting error:', error.message);
            return false;
        }
    }
    
    async checkAndPost() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Define posting schedule
        const schedule = [
            { hour: 9, type: 'morning', method: 'generateMorningMarket' },
            { hour: 14, type: 'afternoon', method: 'generateAfternoonAlert' },
            { hour: 19, type: 'evening', method: 'generateEveningRecap' },
            { hour: 23, type: 'prediction', method: 'generateNightPrediction' }
        ];
        
        for (const slot of schedule) {
            // Check if it's time and we haven't posted this hour yet
            if (hour === slot.hour && minute < 30) {
                const lastPost = this.lastPostTimes[slot.type];
                const timeSinceLastPost = lastPost ? (now - lastPost) : Infinity;
                
                // Post if we haven't posted this type in the last 20 hours
                if (timeSinceLastPost > 20 * 60 * 60 * 1000) {
                    console.log(`\n⏰ Time for ${slot.type} post!`);
                    
                    const post = await this.contentGenerator[slot.method]();
                    if (post && post.content) {
                        const success = await this.postTweet(post.content);
                        
                        if (success) {
                            this.lastPostTimes[slot.type] = now;
                            await this.savePostHistory(post);
                            
                            // If it's a prediction, track it
                            if (post.prediction) {
                                await this.predictionTracker.addPrediction(post.prediction);
                            }
                        }
                    }
                    
                    // Wait a bit before checking next slot
                    await this.sleep(60000);
                }
            }
        }
        
        // Also check for accountability posts (once per day)
        if (hour === 12 && !this.lastPostTimes['accountability']) {
            const lastAccountability = this.lastPostTimes['accountability'];
            if (!lastAccountability || (now - lastAccountability) > 23 * 60 * 60 * 1000) {
                console.log('\n📊 Time for accountability post!');
                
                const accountabilityPost = await this.predictionTracker.generateAccountabilityPost();
                if (accountabilityPost) {
                    const success = await this.postTweet(accountabilityPost);
                    if (success) {
                        this.lastPostTimes['accountability'] = now;
                    }
                }
            }
        }
    }
    
    async savePostHistory(post) {
        try {
            const historyPath = path.join(__dirname, 'data', 'post-history.json');
            let history = [];
            
            try {
                const data = await fs.readFile(historyPath, 'utf8');
                history = JSON.parse(data);
            } catch (e) {
                // File doesn't exist yet
            }
            
            history.push({
                ...post,
                postedAt: new Date().toISOString()
            });
            
            // Keep last 100 posts
            if (history.length > 100) {
                history = history.slice(-100);
            }
            
            await fs.mkdir(path.dirname(historyPath), { recursive: true });
            await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
            
        } catch (error) {
            console.log('Could not save post history:', error.message);
        }
    }
    
    async humanType(element, text, wpm = 40) {
        await element.click();
        await this.sleep(500);
        
        // Clear any existing text
        await element.click({ clickCount: 3 });
        await this.page.keyboard.press('Backspace');
        
        const msPerChar = 60000 / (wpm * 5);
        
        for (const char of text) {
            await this.page.keyboard.type(char);
            const variance = 0.5 + Math.random();
            await this.sleep(msPerChar * variance);
            
            if (Math.random() < 0.1) {
                await this.sleep(500 + Math.random() * 1000);
            }
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showStats() {
        const runtime = Math.floor((Date.now() - this.startTime) / 60000);
        console.log('\n📊 === AUTHORITY STATS ===');
        console.log(`   Runtime: ${runtime} minutes`);
        console.log(`   Posts today: ${this.postsToday}`);
        console.log(`   Last posts:`);
        for (const [type, time] of Object.entries(this.lastPostTimes)) {
            const timeAgo = Math.floor((Date.now() - time) / 60000);
            console.log(`   - ${type}: ${timeAgo} min ago`);
        }
        console.log('=======================\n');
    }
    
    async run() {
        if (!await this.init()) {
            console.log('❌ Failed to initialize');
            return;
        }
        
        console.log('🎯 Starting scheduled authority posting...');
        console.log('📅 Schedule:');
        console.log('   - 9:00 AM: Morning market report');
        console.log('   - 2:00 PM: Trend alert');
        console.log('   - 7:00 PM: Evening recap');
        console.log('   - 11:00 PM: Bold prediction');
        console.log('   - 12:00 PM: Accountability check\n');
        
        // Main loop
        while (true) {
            try {
                await this.checkAndPost();
                
                // Show stats every hour
                if (new Date().getMinutes() === 0) {
                    this.showStats();
                }
                
                // Check every 5 minutes
                await this.sleep(5 * 60 * 1000);
                
            } catch (error) {
                console.log('❌ Error in main loop:', error.message);
                await this.sleep(60000); // Wait 1 minute before retrying
            }
        }
    }
}

// Check if running directly
if (require.main === module) {
    const poster = new ScheduledAuthorityPoster();
    poster.run().catch(console.error);
} else {
    module.exports = ScheduledAuthorityPoster;
}