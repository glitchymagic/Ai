const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function forceRefreshCleanup() {
    console.log('🔄 Force Refresh & Continue Cleanup');
    console.log('===================================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        // Load progress
        const fs = require('fs');
        let totalCleaned = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 0;
        console.log(`📊 Continuing from: ${totalCleaned} retweets already cleaned\n`);
        
        // Force hard refresh
        console.log('Force refreshing profile...');
        await page.goto('https://x.com/GlitchyGrade', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        await page.waitForTimeout(3000);
        
        // Clear cache and reload
        await page.evaluate(() => {
            location.reload(true);
        });
        await page.waitForTimeout(5000);
        
        // Scroll to trigger loading
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, 1000));
            await page.waitForTimeout(1000);
        }
        
        // Check what loaded
        const posts = await page.$$('article[data-testid="tweet"]');
        console.log(`\n📊 After refresh: ${posts.length} posts visible`);
        
        if (posts.length > 0) {
            // Check if they're retweets
            const retweetCount = await page.evaluate(() => {
                const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                let count = 0;
                tweets.forEach(tweet => {
                    if (tweet.innerText.includes('You reposted') || tweet.innerText.includes('You retweeted')) {
                        count++;
                    }
                });
                return count;
            });
            
            console.log(`Found ${retweetCount} retweets to clean\n`);
            
            if (retweetCount > 0) {
                // Continue cleaning
                let cleaned = 0;
                let attempts = 0;
                
                while (attempts < 50 && cleaned < 50) {
                    attempts++;
                    
                    try {
                        // Find and click retweet button
                        const clicked = await page.evaluate(() => {
                            const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                            
                            for (let tweet of tweets) {
                                if (tweet.innerText.includes('You reposted') || tweet.innerText.includes('You retweeted')) {
                                    const buttons = tweet.querySelectorAll('button');
                                    for (let button of buttons) {
                                        const svg = button.querySelector('svg');
                                        if (svg && svg.querySelector('path[d*="M4.75 3.79l4.603"]')) {
                                            button.click();
                                            return true;
                                        }
                                    }
                                }
                            }
                            return false;
                        });
                        
                        if (clicked) {
                            await page.waitForTimeout(1000);
                            
                            // Click undo
                            const undone = await page.evaluate(() => {
                                const items = [...document.querySelectorAll('[role="menuitem"]'), ...document.querySelectorAll('span')];
                                for (let item of items) {
                                    if (item.textContent && (item.textContent.includes('Undo repost') || item.textContent.includes('Undo Retweet'))) {
                                        item.click();
                                        return true;
                                    }
                                }
                                return false;
                            });
                            
                            if (undone) {
                                cleaned++;
                                totalCleaned++;
                                fs.writeFileSync('cleanup-progress.txt', totalCleaned.toString());
                                console.log(`✅ Total cleaned: ${totalCleaned}`);
                                await page.waitForTimeout(2000);
                            } else {
                                await page.keyboard.press('Escape');
                            }
                        } else {
                            // Scroll for more
                            await page.evaluate(() => window.scrollBy(0, 500));
                            await page.waitForTimeout(1000);
                        }
                        
                    } catch (err) {
                        await page.keyboard.press('Escape').catch(() => {});
                    }
                }
                
                console.log(`\n✅ Cleaned ${cleaned} more retweets this session`);
                console.log(`📊 Total all-time: ${totalCleaned}`);
            }
        } else {
            console.log('No posts loaded after refresh - trying alternative approach...');
            
            // Try going to likes and back
            await page.goto('https://x.com/GlitchyGrade/likes', { waitUntil: 'networkidle2' });
            await page.waitForTimeout(2000);
            await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
            await page.waitForTimeout(3000);
            
            const finalCheck = await page.$$('article[data-testid="tweet"]');
            console.log(`Final check: ${finalCheck.length} posts`);
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

forceRefreshCleanup();