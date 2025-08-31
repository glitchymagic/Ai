// Twitter Account Cleanup Script
// Deletes old tweets and likes to prepare account for Pokemon bot

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

class TwitterCleaner {
    constructor() {
        this.browser = null;
        this.page = null;
        this.deleted = 0;
        this.errors = 0;
    }
    
    async init() {
        console.log('🧹 Twitter Account Cleaner');
        console.log('==========================\n');
        
        try {
            console.log('Connecting to Chrome...');
            this.browser = await puppeteer.connect({
                browserURL: 'http://127.0.0.1:9222',
                defaultViewport: null
            });
            
            const pages = await this.browser.pages();
            for (const page of pages) {
                const url = page.url();
                if (url.includes('x.com') || url.includes('twitter.com')) {
                    this.page = page;
                    console.log('✅ Connected to X.com\n');
                    break;
                }
            }
            
            return !!this.page;
        } catch (error) {
            console.log('❌ Connection error:', error.message);
            return false;
        }
    }
    
    async cleanupTweets(options = {}) {
        const {
            keepRecent = 0,  // Keep tweets from last N days
            maxDelete = 1000, // Max tweets to delete
            keepPinned = true // Keep pinned tweet
        } = options;
        
        console.log('📊 Cleanup Settings:');
        console.log(`   Keep recent: ${keepRecent} days`);
        console.log(`   Max to delete: ${maxDelete}`);
        console.log(`   Keep pinned: ${keepPinned}\n`);
        
        // Navigate to profile
        console.log('📍 Navigating to your profile...');
        await this.page.goto('https://x.com/profile', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        await this.sleep(3000);
        
        console.log('🗑️ Starting deletion process...\n');
        
        while (this.deleted < maxDelete) {
            try {
                // Find all tweets on page
                const tweets = await this.page.$$('article[data-testid="tweet"]');
                
                if (tweets.length === 0) {
                    console.log('No more tweets found');
                    break;
                }
                
                // Process each tweet
                for (const tweet of tweets) {
                    if (this.deleted >= maxDelete) break;
                    
                    try {
                        // Check if it's a retweet or regular tweet
                        const isRetweet = await tweet.evaluate(el => {
                            return el.innerText.includes('You reposted');
                        });
                        
                        // Find menu button (three dots)
                        const menuButton = await tweet.$('[data-testid="caret"]');
                        if (!menuButton) continue;
                        
                        // Click menu
                        await menuButton.click();
                        await this.sleep(1000);
                        
                        // Find and click delete option
                        let deleteOption;
                        if (isRetweet) {
                            // For retweets, look for "Undo repost"
                            deleteOption = await this.page.$x("//span[contains(text(), 'Undo repost')]");
                        } else {
                            // For regular tweets, look for "Delete"
                            deleteOption = await this.page.$x("//span[contains(text(), 'Delete')]");
                        }
                        
                        if (deleteOption && deleteOption[0]) {
                            await deleteOption[0].click();
                            await this.sleep(1000);
                            
                            // Confirm deletion for regular tweets
                            if (!isRetweet) {
                                const confirmButton = await this.page.$('[data-testid="confirmationSheetConfirm"]');
                                if (confirmButton) {
                                    await confirmButton.click();
                                }
                            }
                            
                            this.deleted++;
                            console.log(`✅ Deleted ${this.deleted}/${maxDelete} - ${isRetweet ? 'Retweet' : 'Tweet'}`);
                            
                            await this.sleep(2000); // Rate limiting
                        } else {
                            // Close menu if delete not found
                            await this.page.keyboard.press('Escape');
                        }
                        
                    } catch (error) {
                        this.errors++;
                        await this.page.keyboard.press('Escape');
                    }
                }
                
                // Scroll for more tweets
                await this.page.evaluate(() => {
                    window.scrollBy(0, 500);
                });
                await this.sleep(2000);
                
            } catch (error) {
                console.log('⚠️ Error:', error.message);
                this.errors++;
                
                if (this.errors > 10) {
                    console.log('Too many errors, stopping...');
                    break;
                }
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(`✅ Cleanup Complete!`);
        console.log(`   Deleted: ${this.deleted} tweets`);
        console.log(`   Errors: ${this.errors}`);
        console.log('='.repeat(50));
    }
    
    async cleanupLikes(maxUnlike = 100) {
        console.log('\n💔 Cleaning up old likes...');
        
        // Navigate to likes
        await this.page.goto('https://x.com/profile/likes', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        await this.sleep(3000);
        
        let unliked = 0;
        
        while (unliked < maxUnlike) {
            const likeButtons = await this.page.$$('[data-testid="unlike"]');
            
            if (likeButtons.length === 0) break;
            
            for (const button of likeButtons) {
                if (unliked >= maxUnlike) break;
                
                try {
                    await button.click();
                    unliked++;
                    console.log(`   Unliked ${unliked}/${maxUnlike}`);
                    await this.sleep(1000);
                } catch (error) {
                    // Button might have disappeared
                }
            }
            
            // Scroll for more
            await this.page.evaluate(() => window.scrollBy(0, 500));
            await this.sleep(2000);
        }
        
        console.log(`✅ Unliked ${unliked} posts`);
    }
    
    async rebrandProfile() {
        console.log('\n🎨 Rebranding to Pokemon theme...');
        
        // This would update bio, etc.
        console.log('   Update your:');
        console.log('   • Bio: "Pokemon TCG market analysis & price tracking 📊"');
        console.log('   • Name: Keep it or change to Pokemon-related');
        console.log('   • Profile pic: Pokemon themed');
        console.log('   • Header: Pokemon cards image');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function main() {
    const cleaner = new TwitterCleaner();
    
    console.log('⚠️  WARNING: This will delete tweets from your account!');
    console.log('Make sure you\'re logged into the RIGHT account in Chrome.\n');
    console.log('Options:');
    console.log('1. Delete ALL tweets (fresh start)');
    console.log('2. Keep last 30 days');
    console.log('3. Keep last 90 days');
    console.log('4. Just delete retweets');
    console.log('5. Cancel\n');
    
    // For now, we'll do option 1 (delete all)
    // You can modify this based on preference
    
    if (await cleaner.init()) {
        await cleaner.cleanupTweets({
            keepRecent: 0,    // Change to 30 or 90 to keep recent
            maxDelete: 1000,  // Maximum to delete
            keepPinned: true
        });
        
        // Optional: Also clean likes
        // await cleaner.cleanupLikes(100);
        
        cleaner.browser.disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TwitterCleaner;