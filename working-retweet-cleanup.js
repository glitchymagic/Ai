const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function cleanupRetweets() {
    console.log('🔄 Retweet Cleanup - Fixed Version');
    console.log('==================================\n');
    
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
        
        let totalUndone = 0;
        let noChanges = 0;
        
        while (noChanges < 3) {
            try {
                // Count posts before action
                const beforeCount = await page.$$eval('article[data-testid="tweet"]', tweets => tweets.length);
                
                // Find and click the first visible retweet's action button
                const clicked = await page.evaluate(() => {
                    // Find all tweet articles
                    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                    
                    for (let tweet of tweets) {
                        // Check if this is a retweet
                        const tweetText = tweet.innerText || '';
                        if (tweetText.includes('You reposted') || tweetText.includes('You retweeted')) {
                            // Find the retweet button (green button with arrow icon)
                            const buttons = tweet.querySelectorAll('button');
                            
                            for (let button of buttons) {
                                // Look for the retweet button by checking for the svg path
                                const svg = button.querySelector('svg');
                                if (svg) {
                                    const paths = svg.querySelectorAll('path');
                                    for (let path of paths) {
                                        const d = path.getAttribute('d');
                                        // This is the retweet icon path pattern
                                        if (d && d.includes('M4.75 3.79l4.603')) {
                                            button.click();
                                            return true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return false;
                });
                
                if (clicked) {
                    await page.waitForTimeout(1500);
                    
                    // Click "Undo repost" from the menu
                    const undoClicked = await page.evaluate(() => {
                        // Find menu items
                        const menuItems = document.querySelectorAll('[role="menuitem"]');
                        for (let item of menuItems) {
                            const text = item.innerText || '';
                            if (text.includes('Undo repost') || text.includes('Undo Retweet')) {
                                item.click();
                                return true;
                            }
                        }
                        
                        // Alternative: look for spans with the text
                        const spans = document.querySelectorAll('span');
                        for (let span of spans) {
                            if (span.textContent === 'Undo repost' || span.textContent === 'Undo Retweet') {
                                span.click();
                                return true;
                            }
                        }
                        return false;
                    });
                    
                    if (undoClicked) {
                        totalUndone++;
                        noChanges = 0;
                        console.log(`✅ Undid retweet #${totalUndone}`);
                        await page.waitForTimeout(3000); // Wait for the action to complete
                        
                        // Refresh every 15 undos
                        if (totalUndone % 15 === 0) {
                            console.log('🔄 Refreshing page...');
                            await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
                            await page.waitForTimeout(3000);
                        }
                    } else {
                        // Menu didn't have undo option, close it
                        await page.keyboard.press('Escape');
                        await page.waitForTimeout(1000);
                        noChanges++;
                    }
                } else {
                    // No retweet button found, scroll down
                    console.log('Scrolling to find more retweets...');
                    await page.evaluate(() => window.scrollBy(0, 800));
                    await page.waitForTimeout(2000);
                    
                    // Check if count changed after scroll
                    const afterCount = await page.$$eval('article[data-testid="tweet"]', tweets => tweets.length);
                    if (afterCount === beforeCount) {
                        noChanges++;
                    } else {
                        noChanges = 0;
                    }
                }
                
            } catch (error) {
                console.log('⚠️ Minor error, continuing...');
                await page.keyboard.press('Escape').catch(() => {});
                await page.waitForTimeout(1000);
                noChanges++;
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(`✅ Cleanup complete!`);
        console.log(`   Total retweets undone: ${totalUndone}`);
        console.log('='.repeat(50));
        
        // Final refresh and count
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        const finalPosts = await page.$$('article[data-testid="tweet"]');
        console.log(`\n📊 ${finalPosts.length} posts remaining on profile\n`);
        
        if (finalPosts.length > 0) {
            console.log('ℹ️  If retweets remain, they might be:');
            console.log('   - Quote tweets (need manual deletion)');
            console.log('   - Protected/deleted original tweets');
            console.log('   - Regular tweets (not retweets)\n');
        }
        
        browser.disconnect();
        
        console.log('NEXT STEPS:');
        console.log('1. Update bio to Pokemon theme');
        console.log('2. Post 3 Pokemon tweets manually');
        console.log('3. Wait 72 hours before bot activity\n');
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

cleanupRetweets();