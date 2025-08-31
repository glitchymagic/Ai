const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function finalCleanup() {
    console.log('🏁 Final Cleanup Push');
    console.log('====================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        // Start fresh
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        console.log('Cleaning remaining retweets...\n');
        
        let cleaned = 0;
        let attempts = 0;
        
        // Keep trying until we've made 50 attempts or cleaned 50 retweets
        while (attempts < 50 && cleaned < 50) {
            attempts++;
            
            try {
                // Always start from top of page
                if (attempts % 10 === 0) {
                    await page.evaluate(() => window.scrollTo(0, 0));
                    await page.waitForTimeout(1000);
                }
                
                // Find and click first retweet
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
                        console.log(`✅ Cleaned ${cleaned}`);
                        await page.waitForTimeout(2000);
                    } else {
                        await page.keyboard.press('Escape');
                    }
                } else {
                    // Scroll and try again
                    await page.evaluate(() => window.scrollBy(0, 300));
                    await page.waitForTimeout(1000);
                }
                
            } catch (err) {
                await page.keyboard.press('Escape').catch(() => {});
            }
        }
        
        // Final check
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        const remaining = await page.evaluate(() => {
            const tweets = document.querySelectorAll('article[data-testid="tweet"]');
            let retweets = 0;
            tweets.forEach(t => {
                if (t.innerText.includes('You reposted') || t.innerText.includes('You retweeted')) {
                    retweets++;
                }
            });
            return { total: tweets.length, retweets };
        });
        
        console.log('\n' + '='.repeat(40));
        console.log(`✅ Cleaned ${cleaned} retweets`);
        console.log(`📊 Remaining: ${remaining.total} posts (${remaining.retweets} retweets)`);
        console.log('='.repeat(40));
        
        if (remaining.retweets === 0) {
            console.log('\n🎉 YOUR PROFILE IS CLEAN!\n');
            console.log('Next steps:');
            console.log('1. Update bio to Pokemon theme');
            console.log('2. Post 3 Pokemon tweets');
            console.log('3. Wait 72 hours before bot');
        } else {
            console.log('\nRun again to continue cleaning.');
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

finalCleanup();