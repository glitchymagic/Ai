const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function fastCleanup() {
    console.log('🧹 Fast Profile Cleanup');
    console.log('======================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        // Go to profile
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        console.log('✅ Connected to profile\n');
        
        let cleaned = 0;
        let attempts = 0;
        
        while (attempts < 100) { // Safety limit
            attempts++;
            
            try {
                // Find all tweet articles
                const tweets = await page.$$('article[data-testid="tweet"]');
                
                if (tweets.length === 0) {
                    console.log('\n✅ No more posts found!');
                    break;
                }
                
                // Get the first tweet
                const tweet = tweets[0];
                
                // Check if it's a retweet
                const tweetText = await tweet.evaluate(el => el.innerText);
                const isRetweet = tweetText.includes('You reposted') || tweetText.includes('You retweeted');
                
                if (isRetweet) {
                    // Find the green retweet button and click it
                    const retweetBtn = await tweet.$('[data-testid="retweet"]');
                    if (retweetBtn) {
                        await retweetBtn.click();
                        await page.waitForTimeout(500);
                        
                        // Click undo repost
                        await page.evaluate(() => {
                            const spans = Array.from(document.querySelectorAll('span'));
                            const undo = spans.find(s => s.textContent.includes('Undo repost'));
                            if (undo) undo.click();
                        });
                        
                        cleaned++;
                        console.log(`✅ Undid retweet #${cleaned}`);
                        await page.waitForTimeout(2000);
                    }
                } else {
                    // Regular tweet - use menu
                    const menuBtn = await tweet.$('[data-testid="caret"]');
                    if (menuBtn) {
                        await menuBtn.click();
                        await page.waitForTimeout(500);
                        
                        // Click delete
                        const deleted = await page.evaluate(() => {
                            const spans = Array.from(document.querySelectorAll('span'));
                            const deleteBtn = spans.find(s => s.textContent === 'Delete');
                            if (deleteBtn) {
                                deleteBtn.click();
                                return true;
                            }
                            return false;
                        });
                        
                        if (deleted) {
                            await page.waitForTimeout(500);
                            
                            // Confirm
                            await page.click('[data-testid="confirmationSheetConfirm"]');
                            cleaned++;
                            console.log(`✅ Deleted tweet #${cleaned}`);
                            await page.waitForTimeout(2000);
                        } else {
                            await page.keyboard.press('Escape');
                        }
                    }
                }
                
                // Refresh page every 20 items
                if (cleaned % 20 === 0 && cleaned > 0) {
                    console.log('🔄 Refreshing...');
                    await page.reload({ waitUntil: 'networkidle2' });
                    await page.waitForTimeout(3000);
                }
                
            } catch (error) {
                console.log('⚠️ Retrying...');
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
            }
        }
        
        console.log(`\n✅ Cleanup complete! Cleaned ${cleaned} items\n`);
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

fastCleanup();