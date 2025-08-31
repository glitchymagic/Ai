// Scheduled Poster for Original Content
// Posts market updates, predictions, and analysis on schedule

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const OriginalContentGenerator = require('./features/original-content-generator');
const priceEngine = require('./price-engine/index.js');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

class ScheduledPoster {
    constructor() {
        this.browser = null;
        this.page = null;
        this.contentGenerator = new OriginalContentGenerator();
        this.postsToday = 0;
        this.lastPostTime = null;
        this.postHistory = [];
        this.running = false;
    }
    
    async init() {
        console.log('🚀 Pokemon TCG Market Authority - Scheduled Poster');
        console.log('==================================================');
        console.log('📊 Building authority through data-driven posts');
        console.log('🎯 Target: aixbt-level influence for Pokemon TCG\n');
        
        // Initialize systems
        await this.contentGenerator.initialize();
        await this.loadPostHistory();
        
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
            
            return !!this.page;
            
        } catch (error) {
            console.log('❌ Connection error:', error.message);
            return false;
        }
    }
    
    async postToTwitter(content) {
        try {
            console.log('\n📝 Posting to Twitter...');
            
            // Navigate to compose
            await this.page.goto('https://x.com/compose/post', {
                waitUntil: 'domcontentloaded',
                timeout: 20000
            });
            
            await this.sleep(3000);
            
            // Find tweet box
            const tweetBox = await this.page.waitForSelector(
                'div[data-testid="tweetTextarea_0"]',
                { timeout: 10000 }
            );
            
            if (!tweetBox) {
                console.log('❌ Could not find tweet box');
                return false;
            }
            
            // Type content
            await tweetBox.click();
            await this.sleep(500);
            
            // Type with human-like speed
            for (let char of content) {
                await this.page.keyboard.type(char);
                await this.sleep(this.random(30, 60));
            }
            
            await this.sleep(2000);
            
            // Send tweet
            const posted = await this.page.evaluate(() => {
                const btn = document.querySelector('button[data-testid="tweetButton"]');
                if (btn && !btn.disabled) {
                    btn.click();
                    return true;
                }
                return false;
            });
            
            if (!posted) {
                // Try keyboard shortcut
                await this.page.keyboard.down('Meta');
                await this.page.keyboard.press('Enter');
                await this.page.keyboard.up('Meta');
            }
            
            await this.sleep(3000);
            
            console.log('✅ Posted successfully!');
            
            // Save to history
            this.postHistory.push({
                content: content,
                timestamp: new Date().toISOString(),
                type: 'scheduled'
            });
            
            await this.savePostHistory();
            this.postsToday++;
            this.lastPostTime = Date.now();
            
            return true;
            
        } catch (error) {
            console.log(`❌ Post error: ${error.message}`);
            return false;
        }
    }
    
    async generateAndPost() {
        const hour = new Date().getHours();
        let post = null;
        
        // Check what type of post to generate based on time
        if (hour === 9) {
            console.log('📊 Generating morning market report...');
            post = await this.contentGenerator.generateMorningMarket();
        } else if (hour === 14) {
            console.log('🚨 Generating afternoon alert...');
            post = await this.contentGenerator.generateAfternoonAlert();
        } else if (hour === 19) {
            console.log('🌙 Generating evening recap...');
            post = await this.contentGenerator.generateEveningRecap();
        } else if (hour === 23) {
            console.log('🎯 Generating prediction...');
            post = await this.contentGenerator.generateNightPrediction();
        } else {
            // Off-schedule posts - generate trend alerts
            console.log('📈 Generating trend alert...');
            post = await this.contentGenerator.generateTrendAlert();
        }
        
        if (post && post.content) {
            console.log(`\n📄 Content:\n${post.content}\n`);
            
            const success = await this.postToTwitter(post.content);
            
            if (success) {
                console.log(`✅ ${post.type} posted!`);
                
                // If it was a prediction, track it
                if (post.prediction) {
                    console.log('   📊 Prediction tracked for accountability');
                }
            }
            
            return success;
        }
        
        return false;
    }
    
    async checkSchedule() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Post at specific times: 9am, 2pm, 7pm, 11pm
        const scheduledHours = [9, 14, 19, 23];
        
        if (scheduledHours.includes(hour) && minute < 5) {
            // Check if we already posted in this hour
            if (this.lastPostTime) {
                const lastHour = new Date(this.lastPostTime).getHours();
                if (lastHour === hour) {
                    return false; // Already posted this hour
                }
            }
            
            return true;
        }
        
        // Also post bonus content if we haven't posted in 4 hours
        if (this.lastPostTime) {
            const hoursSincePost = (Date.now() - this.lastPostTime) / (1000 * 60 * 60);
            if (hoursSincePost > 4 && this.postsToday < 8) { // Max 8 posts per day
                return true;
            }
        }
        
        return false;
    }
    
    async run() {
        this.running = true;
        console.log('⏰ Scheduler started - posting at 9am, 2pm, 7pm, 11pm');
        console.log('📊 Additional trend alerts between scheduled posts\n');
        
        while (this.running) {
            try {
                // Check if it's time to post
                if (await this.checkSchedule()) {
                    console.log(`\n⏰ Schedule triggered at ${new Date().toLocaleTimeString()}`);
                    await this.generateAndPost();
                    
                    // Wait a bit before checking again
                    await this.sleep(5 * 60 * 1000); // 5 minutes
                }
                
                // Check predictions periodically
                if (Math.random() < 0.05) { // 5% chance each cycle
                    const successPost = await this.contentGenerator.generateSuccessPost();
                    if (successPost) {
                        console.log('\n✅ Found successful prediction to share!');
                        await this.postToTwitter(successPost.content);
                    }
                }
                
                // Wait before next check
                await this.sleep(60 * 1000); // Check every minute
                
            } catch (error) {
                console.log(`⚠️ Scheduler error: ${error.message}`);
                await this.sleep(5 * 60 * 1000); // Wait 5 minutes on error
            }
        }
    }
    
    async stop() {
        this.running = false;
        console.log('\n🛑 Scheduler stopped');
        await this.showStats();
    }
    
    async showStats() {
        console.log('\n📊 === POSTING STATISTICS ===');
        console.log(`   Posts today: ${this.postsToday}`);
        console.log(`   Total posts: ${this.postHistory.length}`);
        
        // Count by type
        const types = {};
        this.postHistory.forEach(post => {
            types[post.type] = (types[post.type] || 0) + 1;
        });
        
        console.log('   By type:');
        Object.entries(types).forEach(([type, count]) => {
            console.log(`     - ${type}: ${count}`);
        });
        
        console.log('===========================\n');
    }
    
    // Helper methods
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    async loadPostHistory() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, 'data', 'post-history.json'),
                'utf8'
            );
            this.postHistory = JSON.parse(data);
            console.log(`📚 Loaded ${this.postHistory.length} historical posts`);
        } catch {
            this.postHistory = [];
        }
    }
    
    async savePostHistory() {
        try {
            const dir = path.join(__dirname, 'data');
            await fs.mkdir(dir, { recursive: true });
            
            await fs.writeFile(
                path.join(dir, 'post-history.json'),
                JSON.stringify(this.postHistory, null, 2)
            );
        } catch (error) {
            console.log('⚠️ Could not save post history:', error.message);
        }
    }
}

// Command line interface
async function main() {
    const poster = new ScheduledPoster();
    
    if (await poster.init()) {
        console.log('\n🎯 MONETIZATION ROADMAP - PHASE 1 ACTIVE');
        console.log('----------------------------------------');
        console.log('Week 1 Goals:');
        console.log('✅ Day 1: Price integration in replies');
        console.log('🔄 Day 2: Daily market reports (THIS)');
        console.log('⏳ Day 3: Prediction tracking');
        console.log('⏳ Target: 1,000 followers by end of week\n');
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n\n⚠️ Shutting down...');
            await poster.stop();
            process.exit(0);
        });
        
        // Start the scheduler
        await poster.run();
    } else {
        console.log('❌ Failed to initialize');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ScheduledPoster;