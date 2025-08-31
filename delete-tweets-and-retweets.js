const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

class TweetAndRetweetDeleter {
    constructor() {
        this.browser = null;
        this.page = null;
        this.deletedTweets = 0;
        this.undoneRetweets = 0;
    }
    
    async init() {
        console.log('🧹 Tweet & Retweet Cleanup Tool');
        console.log('================================\n');
        
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
    
    async cleanupProfile() {
        console.log('🗑️ Starting cleanup (tweets AND retweets)...\n');
        
        // Navigate to profile
        await this.page.goto('https://x.com/GlitchyGrade', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        await this.sleep(3000);
        
        let noPostsCount = 0;
        
        while (noPostsCount < 3) {
            try {
                // Find the first post (tweet or retweet)
                const post = await this.page.$('article[data-testid="tweet"]');
                
                if (!post) {
                    noPostsCount++;
                    console.log('Checking for more posts...');
                    await this.page.evaluate(() => window.scrollBy(0, 500));
                    await this.sleep(2000);
                    continue;
                }
                
                noPostsCount = 0;
                
                // Check if it's a retweet by looking for "You reposted" text
                const isRetweet = await this.page.evaluate(() => {
                    const article = document.querySelector('article[data-testid="tweet"]');
                    if (!article) return false;
                    const text = article.innerText || '';
                    return text.includes('You reposted') || text.includes('You retweeted');
                });
                
                if (isRetweet) {
                    // Handle retweet - click the retweet button to undo
                    console.log('🔄 Found a retweet, undoing...');
                    
                    // Find the retweet button (it should be highlighted/active)
                    const retweetButton = await post.$('[data-testid="retweet"]');
                    if (retweetButton) {
                        await retweetButton.click();
                        await this.sleep(1000);
                        
                        // Click "Undo repost" in the menu
                        const undoOption = await this.page.evaluateHandle(() => {
                            const spans = Array.from(document.querySelectorAll('span'));
                            return spans.find(span => 
                                span.textContent === 'Undo repost' || 
                                span.textContent === 'Undo Retweet'
                            );
                        });
                        
                        if (undoOption && undoOption.asElement()) {
                            await undoOption.asElement().click();
                            this.undoneRetweets++;
                            console.log(`✅ Undid retweet #${this.undoneRetweets}`);
                            await this.sleep(3000);
                        } else {
                            // If no undo option, press escape
                            await this.page.keyboard.press('Escape');
                        }
                    }
                } else {
                    // Handle regular tweet - use the menu
                    console.log('📝 Found a tweet, deleting...');
                    
                    const menuButton = await post.$('[data-testid="caret"]');
                    if (menuButton) {
                        await menuButton.click();
                        await this.sleep(1000);
                        
                        // Find and click delete
                        const deleted = await this.page.evaluate(() => {
                            const spans = Array.from(document.querySelectorAll('span'));
                            const deleteBtn = spans.find(span => 
                                span.textContent === 'Delete' || 
                                span.textContent === 'Delete post' ||
                                span.textContent === 'Delete Tweet'
                            );
                            if (deleteBtn) {
                                deleteBtn.click();
                                return true;
                            }
                            return false;
                        });
                        
                        if (deleted) {
                            await this.sleep(1000);
                            
                            // Confirm deletion
                            const confirmButton = await this.page.$('[data-testid="confirmationSheetConfirm"]');
                            if (confirmButton) {
                                await confirmButton.click();
                                this.deletedTweets++;
                                console.log(`✅ Deleted tweet #${this.deletedTweets}`);
                                await this.sleep(3000);
                            }
                        } else {
                            // Close menu if no delete option
                            await this.page.keyboard.press('Escape');
                            await this.sleep(1000);
                        }
                    }
                }
                
                // Refresh every 10 actions to avoid issues
                if ((this.deletedTweets + this.undoneRetweets) % 10 === 0 && 
                    (this.deletedTweets + this.undoneRetweets) > 0) {
                    console.log('🔄 Refreshing page...');
                    await this.page.reload({ waitUntil: 'networkidle2' });
                    await this.sleep(3000);
                }
                
            } catch (error) {
                console.log('⚠️ Error, retrying...');
                await this.page.keyboard.press('Escape');
                await this.sleep(1000);
                await this.page.evaluate(() => window.scrollBy(0, 200));
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ Cleanup complete!');
        console.log(`   Deleted tweets: ${this.deletedTweets}`);
        console.log(`   Undone retweets: ${this.undoneRetweets}`);
        console.log(`   Total cleaned: ${this.deletedTweets + this.undoneRetweets}`);
        console.log('='.repeat(50));
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function main() {
    const cleaner = new TweetAndRetweetDeleter();
    
    if (await cleaner.init()) {
        await cleaner.cleanupProfile();
        cleaner.browser.disconnect();
        
        console.log('\n✅ NEXT STEPS:');
        console.log('1. Update your bio to Pokemon theme');
        console.log('2. Post 3 Pokemon tweets manually');
        console.log('3. Wait 72 hours before running bot');
        console.log('4. Then launch bot with safe settings\n');
    }
}

main().catch(console.error);