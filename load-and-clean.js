const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('📜 Load and Clean');
    console.log('=================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const page = (await browser.pages())[0];
        let total = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
        
        console.log(`📊 Starting from: ${total}`);
        console.log('⏳ Loading tweets...\n');
        
        // Scroll to trigger loading
        await page.evaluate(() => {
            window.scrollTo(0, 0); // Go to top first
        });
        await page.waitForTimeout(2000);
        
        // Scroll down to load content
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => {
                window.scrollBy(0, 500);
            });
            await page.waitForTimeout(1000);
        }
        
        console.log('🔍 Looking for retweets...\n');
        
        let cleaned = 0;
        
        // Now try to clean
        for (let attempt = 0; attempt < 30; attempt++) {
            try {
                // Count what we can see
                if (attempt % 10 === 0) {
                    const stats = await page.evaluate(() => {
                        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                        let repostCount = 0;
                        tweets.forEach(t => {
                            if (t.innerText && t.innerText.includes('reposted')) {
                                repostCount++;
                            }
                        });
                        return { total: tweets.length, reposts: repostCount };
                    });
                    console.log(`📊 Visible: ${stats.total} tweets, ${stats.reposts} reposts`);
                }
                
                // Try to click retweet
                const clicked = await page.evaluate(() => {
                    // Look for tweets containing repost text
                    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                    
                    for (let tweet of tweets) {
                        const text = tweet.innerText || '';
                        if (text.includes('You reposted') || text.includes('reposted')) {
                            // Find the retweet button - try multiple selectors
                            const buttons = tweet.querySelectorAll('button[role="button"]');
                            
                            for (let btn of buttons) {
                                // Check if this button has the retweet icon
                                const svg = btn.querySelector('svg');
                                if (svg) {
                                    const path = svg.querySelector('path');
                                    if (path && path.getAttribute('d') && path.getAttribute('d').startsWith('M4.75')) {
                                        btn.click();
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                    
                    return false;
                });
                
                if (clicked) {
                    console.log('👆 Clicked!');
                    await page.waitForTimeout(1500);
                    
                    // Click undo
                    const undone = await page.evaluate(() => {
                        // Find anything that says "Undo repost"
                        const allElements = [...document.querySelectorAll('*')];
                        for (let el of allElements) {
                            if (el.textContent === 'Undo repost' || el.textContent === 'Undo Repost') {
                                el.click();
                                return true;
                            }
                        }
                        return false;
                    });
                    
                    if (undone) {
                        cleaned++;
                        total++;
                        fs.writeFileSync('cleanup-progress.txt', total.toString());
                        console.log(`✅ Cleaned! Total: ${total}`);
                        await page.waitForTimeout(2500);
                    } else {
                        console.log('❌ No undo found');
                        await page.keyboard.press('Escape');
                        await page.waitForTimeout(1000);
                    }
                } else {
                    // Scroll to find more
                    if (attempt % 5 === 0) {
                        console.log('📜 Scrolling...');
                        await page.evaluate(() => {
                            window.scrollBy(0, 800);
                        });
                        await page.waitForTimeout(2000);
                    }
                }
                
            } catch (e) {
                await page.keyboard.press('Escape').catch(() => {});
            }
        }
        
        console.log(`\n✅ Done! Cleaned ${cleaned} (Total: ${total})`);
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
})();