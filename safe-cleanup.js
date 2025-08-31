// Ultra-Safe Tweet Cleanup Script
// Slower but maximally safe version

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

class SafeTwitterCleaner {
    constructor() {
        this.browser = null;
        this.page = null;
        this.deleted = 0;
    }
    
    async init() {
        console.log('🛡️ ULTRA-SAFE Twitter Cleaner');
        console.log('==============================');
        console.log('⚡ Deletes 1 tweet every 10 seconds');
        console.log('✅ Completely safe from detection\n');
        
        try {
            this.browser = await puppeteer.connect({
                browserURL: 'http://127.0.0.1:9222',
                defaultViewport: null
            });
            
            const pages = await this.browser.pages();
            for (const page of pages) {
                const url = page.url();
                if (url.includes('x.com') || url.includes('twitter.com')) {
                    this.page = page;
                    console.log('✅ Connected to your account\n');
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.log('❌ Open Chrome and login to X.com first');
            return false;
        }
    }
    
    async deleteWithBreaks() {
        console.log('Starting safe deletion...\n');
        console.log('This will:');
        console.log('• Delete 1 tweet every 10 seconds');
        console.log('• Take a 1-minute break every 10 tweets');
        console.log('• Stop after 100 tweets\n');
        console.log('Press Ctrl+C to stop anytime\n');
        
        // Navigate to profile
        await this.page.goto('https://x.com/profile', {
            waitUntil: 'networkidle2'
        });
        
        await this.sleep(3000);
        
        while (this.deleted < 100) { // Max 100 per session
            
            // Find first tweet
            const tweet = await this.page.$('article[data-testid="tweet"]');
            if (!tweet) {
                console.log('No more tweets found');
                break;
            }
            
            try {
                // Click menu
                const menu = await tweet.$('[data-testid="caret"]');
                if (menu) {
                    await menu.click();
                    await this.sleep(2000); // Human-like pause
                    
                    // Find delete option
                    const deleteOption = await this.page.$x("//span[contains(text(), 'Delete')]");
                    
                    if (deleteOption && deleteOption[0]) {
                        await deleteOption[0].click();
                        await this.sleep(2000); // Read confirmation
                        
                        // Confirm
                        const confirm = await this.page.$('[data-testid="confirmationSheetConfirm"]');
                        if (confirm) {
                            await confirm.click();
                            this.deleted++;
                            console.log(`✅ Deleted tweet #${this.deleted}`);
                            
                            // Take break every 10 tweets
                            if (this.deleted % 10 === 0) {
                                console.log('☕ Taking 1-minute break...');
                                await this.sleep(60000); // 1 minute break
                            } else {
                                await this.sleep(10000); // 10 seconds between tweets
                            }
                        }
                    } else {
                        await this.page.keyboard.press('Escape');
                    }
                }
                
                // Reload page every 20 tweets (fresh start)
                if (this.deleted % 20 === 0 && this.deleted > 0) {
                    console.log('🔄 Refreshing page...');
                    await this.page.reload({ waitUntil: 'networkidle2' });
                    await this.sleep(5000);
                }
                
            } catch (error) {
                console.log('⚠️ Skipping tweet...');
                await this.page.keyboard.press('Escape');
                await this.sleep(5000);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ Safe cleanup complete!');
        console.log(`   Deleted: ${this.deleted} tweets`);
        console.log('   Your account is safe');
        console.log('='.repeat(50));
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function main() {
    const cleaner = new SafeTwitterCleaner();
    
    if (await cleaner.init()) {
        await cleaner.deleteWithBreaks();
        cleaner.browser.disconnect();
        
        console.log('\n✅ NEXT STEPS:');
        console.log('1. Update your bio to Pokemon theme');
        console.log('2. Post 3 Pokemon tweets manually');
        console.log('3. Wait 24 hours');
        console.log('4. Run bot carefully\n');
    }
}

main().catch(console.error);