const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

class TweetDeleter {
    constructor() {
        this.browser = null;
        this.page = null;
        this.deleted = 0;
    }
    
    async init() {
        console.log('🧹 Tweet Deletion Tool');
        console.log('======================\n');
        
        try {
            this.browser = await puppeteer.connect({
                browserURL: 'http://127.0.0.1:9222',
                defaultViewport: null
            });
            
            const pages = await this.browser.pages();
            this.page = pages[0];
            
            console.log('✅ Connected to Chrome\n');
            return true;
        } catch (error) {
            console.log('❌ Error:', error.message);
            return false;
        }
    }
    
    async navigateToProfile() {
        console.log('📍 Navigating to your profile...');
        
        // Try multiple ways to get to profile
        try {
            // Method 1: Direct URL
            await this.page.goto('https://x.com/GlitchyGrade', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            await this.sleep(3000);
            
            // Check if we're on the right page
            const url = this.page.url();
            console.log('Current URL:', url);
            
            // If we're on suspended page, try clicking profile link
            if (url.includes('profile') || url.includes('suspended')) {
                console.log('Trying profile link click...');
                const profileLink = await this.page.$('[data-testid="AppTabBar_Profile_Link"]');
                if (profileLink) {
                    await profileLink.click();
                    await this.sleep(3000);
                }
            }
            
            console.log('✅ On profile page\n');
            return true;
        } catch (error) {
            console.log('⚠️ Navigation error:', error.message);
            return false;
        }
    }
    
    async countTweets() {
        try {
            // Wait for tweets to load
            await this.page.waitForSelector('article[data-testid="tweet"]', { 
                timeout: 5000 
            }).catch(() => null);
            
            const tweets = await this.page.$$('article[data-testid="tweet"]');
            console.log(`📊 Found ${tweets.length} tweets on current view\n`);
            return tweets.length;
        } catch (error) {
            console.log('📊 No tweets found\n');
            return 0;
        }
    }
    
    async deleteAllTweets() {
        console.log('🗑️ Starting deletion process...');
        console.log('• Will delete 1 tweet every 5 seconds');
        console.log('• Press Ctrl+C to stop\n');
        
        let noTweetsCount = 0;
        
        while (noTweetsCount < 3) { // Stop after 3 consecutive "no tweets" checks
            try {
                // Find the first tweet's menu button
                const menuButton = await this.page.$('[data-testid="tweet"] [data-testid="caret"]');
                
                if (!menuButton) {
                    noTweetsCount++;
                    console.log('No more tweets found. Scrolling to check for more...');
                    
                    // Scroll down to load more
                    await this.page.evaluate(() => window.scrollBy(0, 500));
                    await this.sleep(2000);
                    
                    if (noTweetsCount >= 3) {
                        console.log('\n✅ All tweets have been deleted!');
                        break;
                    }
                    continue;
                }
                
                noTweetsCount = 0; // Reset counter when we find a tweet
                
                // Click the menu
                await menuButton.click();
                await this.sleep(1000);
                
                // Look for delete option
                const deleteButton = await this.page.evaluateHandle(() => {
                    const spans = Array.from(document.querySelectorAll('span'));
                    return spans.find(span => 
                        span.textContent === 'Delete' || 
                        span.textContent === 'Delete post' ||
                        span.textContent === 'Delete Tweet'
                    );
                });
                
                if (deleteButton && deleteButton.asElement()) {
                    await deleteButton.asElement().click();
                    await this.sleep(1000);
                    
                    // Confirm deletion
                    const confirmButton = await this.page.$('[data-testid="confirmationSheetConfirm"]');
                    if (confirmButton) {
                        await confirmButton.click();
                        this.deleted++;
                        console.log(`✅ Deleted tweet #${this.deleted}`);
                        
                        // Wait for deletion to complete
                        await this.sleep(5000);
                        
                        // Refresh page every 10 tweets to avoid issues
                        if (this.deleted % 10 === 0) {
                            console.log('🔄 Refreshing page...');
                            await this.page.reload({ waitUntil: 'networkidle2' });
                            await this.sleep(3000);
                        }
                    }
                } else {
                    // No delete option, might be a retweet or something else
                    console.log('⚠️ No delete option found, skipping...');
                    // Press escape to close menu
                    await this.page.keyboard.press('Escape');
                    await this.sleep(1000);
                    
                    // Scroll to next tweet
                    await this.page.evaluate(() => window.scrollBy(0, 200));
                }
                
            } catch (error) {
                console.log('⚠️ Error during deletion:', error.message);
                // Try to recover by pressing escape and scrolling
                await this.page.keyboard.press('Escape');
                await this.sleep(1000);
                await this.page.evaluate(() => window.scrollBy(0, 200));
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(`✅ Deletion complete!`);
        console.log(`   Total deleted: ${this.deleted} tweets`);
        console.log('='.repeat(50));
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function main() {
    const deleter = new TweetDeleter();
    
    if (await deleter.init()) {
        if (await deleter.navigateToProfile()) {
            const tweetCount = await deleter.countTweets();
            
            if (tweetCount > 0 || true) { // Always try even if no tweets visible
                const answer = await new Promise(resolve => {
                    console.log('Ready to delete all tweets? Type "yes" to continue: ');
                    process.stdin.once('data', data => {
                        resolve(data.toString().trim().toLowerCase());
                    });
                });
                
                if (answer === 'yes') {
                    await deleter.deleteAllTweets();
                } else {
                    console.log('Cancelled.');
                }
            }
        }
        
        deleter.browser.disconnect();
    }
}

main().catch(console.error);