const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function massUndoRetweets() {
    console.log('🔄 Mass Retweet Cleanup');
    console.log('======================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        // Navigate to profile
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        console.log('✅ Connected. Starting cleanup...\n');
        
        let totalUndone = 0;
        let consecutiveFailures = 0;
        
        // Keep going until we've cleared everything
        while (consecutiveFailures < 5) {
            try {
                // Count current visible posts
                const visiblePosts = await page.$$('article[data-testid="tweet"]');
                console.log(`Currently ${visiblePosts.length} posts visible`);
                
                // Try to find and click the first retweet button
                const undone = await page.evaluate(() => {
                    // Find the first article that contains "You reposted"
                    const articles = document.querySelectorAll('article[data-testid="tweet"]');
                    
                    for (let article of articles) {
                        if (article.innerText.includes('You reposted') || article.innerText.includes('You retweeted')) {
                            // Find the retweet button within this article
                            const retweetBtn = article.querySelector('[data-testid="retweet"]');
                            if (retweetBtn) {
                                retweetBtn.click();
                                return true;
                            }
                        }
                    }
                    return false;
                });
                
                if (undone) {
                    await page.waitForTimeout(1000);
                    
                    // Click undo repost in the menu
                    const menuClicked = await page.evaluate(() => {
                        const menuItems = document.querySelectorAll('[role="menuitem"]');
                        for (let item of menuItems) {
                            if (item.innerText.includes('Undo repost') || item.innerText.includes('Undo Retweet')) {
                                item.click();
                                return true;
                            }
                        }
                        return false;
                    });
                    
                    if (menuClicked) {
                        totalUndone++;
                        consecutiveFailures = 0;
                        console.log(`✅ Undid retweet #${totalUndone}`);
                        await page.waitForTimeout(2500);
                        
                        // Refresh every 20 to avoid issues
                        if (totalUndone % 20 === 0) {
                            console.log('🔄 Refreshing page...');
                            await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
                            await page.waitForTimeout(3000);
                        }
                    } else {
                        await page.keyboard.press('Escape');
                        consecutiveFailures++;
                    }
                } else {
                    // No retweet found, scroll down
                    consecutiveFailures++;
                    console.log('Scrolling to find more...');
                    await page.evaluate(() => window.scrollBy(0, 1000));
                    await page.waitForTimeout(2000);
                    
                    // If we've scrolled a lot without finding anything, refresh
                    if (consecutiveFailures === 3) {
                        console.log('🔄 Refreshing to check for more...');
                        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
                        await page.waitForTimeout(3000);
                    }
                }
                
            } catch (error) {
                console.log('⚠️ Error, retrying...');
                consecutiveFailures++;
                await page.keyboard.press('Escape').catch(() => {});
                await page.waitForTimeout(1000);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(`✅ Cleanup complete!`);
        console.log(`   Total retweets undone: ${totalUndone}`);
        console.log('='.repeat(50));
        
        // Final check
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        const remaining = await page.$$('article[data-testid="tweet"]');
        console.log(`\n📊 ${remaining.length} posts remaining on profile`);
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

massUndoRetweets();