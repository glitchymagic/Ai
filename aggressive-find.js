const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('🔍 Aggressive Retweet Finder');
    console.log('===========================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        let total = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
        console.log(`📊 Starting from: ${total}\n`);
        
        // First, let's see what's on the page
        const pageInfo = await page.evaluate(() => {
            const tweets = document.querySelectorAll('article[data-testid="tweet"]');
            let retweets = 0;
            let firstRetweetText = '';
            
            tweets.forEach(tweet => {
                const text = tweet.innerText || '';
                if (text.includes('You reposted') || text.includes('You retweeted') || text.includes('reposted')) {
                    retweets++;
                    if (!firstRetweetText) {
                        firstRetweetText = text.substring(0, 100);
                    }
                }
            });
            
            return {
                totalTweets: tweets.length,
                retweetsFound: retweets,
                firstRetweet: firstRetweetText,
                url: window.location.href
            };
        });
        
        console.log(`📍 Current URL: ${pageInfo.url}`);
        console.log(`📊 Total tweets visible: ${pageInfo.totalTweets}`);
        console.log(`🔄 Retweets found: ${pageInfo.retweetsFound}`);
        if (pageInfo.firstRetweet) {
            console.log(`📝 First retweet preview: "${pageInfo.firstRetweet}..."\n`);
        }
        
        // Try different selectors
        console.log('Trying different methods to find retweets...\n');
        
        for (let attempt = 0; attempt < 20; attempt++) {
            try {
                // Method 1: Look for any variation of repost text
                const clicked = await page.evaluate(() => {
                    const tweets = document.querySelectorAll('article');
                    
                    for (let tweet of tweets) {
                        const text = (tweet.innerText || '').toLowerCase();
                        if (text.includes('you reposted') || text.includes('retweeted') || text.includes('reposted')) {
                            // Try multiple button selectors
                            const selectors = [
                                'button[data-testid="retweet"]',
                                'button[data-testid="unretweet"]',
                                'button[aria-label*="Repost"]',
                                'button svg path[d*="M4.75"]',
                                'div[role="button"][aria-label*="Repost"]'
                            ];
                            
                            for (let selector of selectors) {
                                const btn = tweet.querySelector(selector);
                                if (btn) {
                                    const button = btn.closest('button') || btn;
                                    button.click();
                                    return true;
                                }
                            }
                        }
                    }
                    return false;
                });
                
                if (clicked) {
                    console.log('👆 Clicked retweet button');
                    await page.waitForTimeout(1500);
                    
                    // Try to undo
                    const undone = await page.evaluate(() => {
                        // Try multiple ways to find undo
                        const selectors = [
                            'span:contains("Undo repost")',
                            'div[role="menuitem"]:contains("Undo")',
                            '[role="menuitem"]'
                        ];
                        
                        // Direct text search
                        const allElements = document.querySelectorAll('*');
                        for (let el of allElements) {
                            if (el.textContent === 'Undo repost' || el.textContent === 'Undo Retweet') {
                                el.click();
                                return true;
                            }
                        }
                        
                        // Menu items
                        const menuItems = document.querySelectorAll('[role="menuitem"]');
                        for (let item of menuItems) {
                            if (item.textContent && item.textContent.includes('Undo')) {
                                item.click();
                                return true;
                            }
                        }
                        
                        return false;
                    });
                    
                    if (undone) {
                        total++;
                        fs.writeFileSync('cleanup-progress.txt', total.toString());
                        console.log(`✅ Cleaned! Total: ${total}`);
                        await page.waitForTimeout(2500);
                    } else {
                        console.log('❌ Could not find undo button');
                        await page.keyboard.press('Escape');
                    }
                } else {
                    // Scroll more aggressively
                    if (attempt % 3 === 0) {
                        console.log('📜 Deep scrolling...');
                        await page.evaluate(() => {
                            // Scroll to bottom
                            window.scrollTo(0, document.body.scrollHeight);
                        });
                        await page.waitForTimeout(2000);
                        
                        // Then scroll up a bit
                        await page.evaluate(() => {
                            window.scrollBy(0, -500);
                        });
                        await page.waitForTimeout(1000);
                    }
                }
            } catch (e) {
                console.log('⚠️ Error:', e.message);
                await page.keyboard.press('Escape').catch(() => {});
            }
        }
        
        console.log('\n📊 Final count:', total);
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
})();