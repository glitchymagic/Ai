const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function undoAllRetweets() {
    console.log('🔄 Undoing All Retweets');
    console.log('=======================\n');
    
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
        console.log('Starting to undo retweets...\n');
        
        let undone = 0;
        let noMoreRetweets = 0;
        
        while (noMoreRetweets < 3) {
            try {
                // Find all retweet buttons (they're usually green/highlighted when active)
                const retweetButtons = await page.$$('[data-testid="retweet"]');
                
                let foundRetweet = false;
                
                for (const button of retweetButtons) {
                    try {
                        // Check if this button is for a retweeted post
                        const isRetweeted = await button.evaluate(btn => {
                            // Check if the button or its parent has styles indicating it's active
                            const svg = btn.querySelector('svg');
                            if (svg) {
                                const color = window.getComputedStyle(svg).color;
                                return color.includes('rgb(0, 186, 124)') || color.includes('rgb(34, 139, 230)');
                            }
                            return false;
                        });
                        
                        if (isRetweeted) {
                            foundRetweet = true;
                            
                            // Click the retweet button
                            await button.click();
                            await page.waitForTimeout(1000);
                            
                            // Find and click "Undo repost"
                            const undoClicked = await page.evaluate(() => {
                                const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
                                const undoItem = menuItems.find(item => {
                                    const text = item.innerText;
                                    return text.includes('Undo repost') || text.includes('Undo Retweet');
                                });
                                
                                if (undoItem) {
                                    undoItem.click();
                                    return true;
                                }
                                return false;
                            });
                            
                            if (undoClicked) {
                                undone++;
                                console.log(`✅ Undid retweet #${undone}`);
                                await page.waitForTimeout(2000);
                                break; // Move to next check
                            } else {
                                // Close menu if undo wasn't found
                                await page.keyboard.press('Escape');
                            }
                        }
                    } catch (err) {
                        // Skip this button
                    }
                }
                
                if (!foundRetweet) {
                    noMoreRetweets++;
                    console.log('Scrolling to check for more...');
                    await page.evaluate(() => window.scrollBy(0, 500));
                    await page.waitForTimeout(2000);
                } else {
                    noMoreRetweets = 0; // Reset counter
                }
                
                // Refresh every 10 undos
                if (undone % 10 === 0 && undone > 0) {
                    console.log('🔄 Refreshing page...');
                    await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
                    await page.waitForTimeout(3000);
                }
                
            } catch (error) {
                console.log('⚠️ Error, continuing...');
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
            }
        }
        
        console.log(`\n✅ Complete! Undid ${undone} retweets\n`);
        
        // Final check
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        const remainingTweets = await page.$$('article[data-testid="tweet"]');
        console.log(`📊 ${remainingTweets.length} posts remaining on profile\n`);
        
        browser.disconnect();
        
        console.log('NEXT STEPS:');
        console.log('1. Update bio to Pokemon theme');
        console.log('2. Post 3 Pokemon tweets manually');
        console.log('3. Wait 72 hours before bot activity');
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

undoAllRetweets();