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
        console.log('🧹 Auto Tweet Deletion');
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
    
    async deleteAllTweets() {
        console.log('🗑️ Starting automatic deletion...\n');
        
        // Navigate to profile
        await this.page.goto('https://x.com/GlitchyGrade', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        await this.sleep(3000);
        
        let noTweetsCount = 0;
        
        while (noTweetsCount < 3) {
            try {
                // Find menu button
                const menuButton = await this.page.$('[data-testid="tweet"] [data-testid="caret"]');
                
                if (!menuButton) {
                    noTweetsCount++;
                    console.log('Checking for more tweets...');
                    await this.page.evaluate(() => window.scrollBy(0, 500));
                    await this.sleep(2000);
                    continue;
                }
                
                noTweetsCount = 0;
                
                // Click menu
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
                    
                    // Confirm
                    const confirmButton = await this.page.$('[data-testid="confirmationSheetConfirm"]');
                    if (confirmButton) {
                        await confirmButton.click();
                        this.deleted++;
                        console.log(`✅ Deleted tweet #${this.deleted}`);
                        await this.sleep(5000); // Wait for deletion
                    }
                } else {
                    // Close menu
                    await this.page.keyboard.press('Escape');
                    await this.sleep(1000);
                    await this.page.evaluate(() => window.scrollBy(0, 200));
                }
                
            } catch (error) {
                console.log('⚠️ Retrying...');
                await this.page.keyboard.press('Escape');
                await this.sleep(1000);
            }
        }
        
        console.log('\n✅ Complete! Deleted ' + this.deleted + ' tweets');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function main() {
    const deleter = new TweetDeleter();
    
    if (await deleter.init()) {
        await deleter.deleteAllTweets();
        deleter.browser.disconnect();
    }
}

main().catch(console.error);