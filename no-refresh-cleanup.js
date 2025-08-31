const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function noRefreshCleanup() {
    console.log('🔄 Continuing Cleanup - No Refresh Mode');
    console.log('=======================================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        console.log('✅ Connected to Chrome\n');
        
        // Load progress
        let totalCleaned = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
        console.log(`📊 Continuing from: ${totalCleaned} retweets already cleaned\n`);
        
        const sessionStart = totalCleaned;
        let noActionCount = 0;
        
        console.log('Starting cleanup (NO REFRESH)...\n');
        
        while (noActionCount < 15) { // More attempts since no refresh
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
                    await page.waitForTimeout(1500);
                    
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
                        totalCleaned++;
                        noActionCount = 0;
                        
                        // Save progress
                        fs.writeFileSync('cleanup-progress.txt', totalCleaned.toString());
                        
                        const sessionCleaned = totalCleaned - sessionStart;
                        console.log(`✅ Total cleaned: ${totalCleaned} | This session: ${sessionCleaned}`);
                        
                        await page.waitForTimeout(2500); // Wait for action to complete
                    } else {
                        await page.keyboard.press('Escape');
                        noActionCount++;
                    }
                } else {
                    noActionCount++;
                    
                    // Just scroll, no refresh
                    console.log('Scrolling to find more...');
                    await page.evaluate(() => {
                        window.scrollBy(0, 1000);
                        // Also try scrolling to very bottom
                        window.scrollTo(0, document.body.scrollHeight);
                    });
                    await page.waitForTimeout(2000);
                }
                
            } catch (err) {
                console.log('⚠️ Minor error, continuing...');
                noActionCount++;
                await page.keyboard.press('Escape').catch(() => {});
                await page.waitForTimeout(1000);
            }
        }
        
        // Final stats
        const sessionCleaned = totalCleaned - sessionStart;
        console.log('\n' + '='.repeat(50));
        console.log('✅ SESSION COMPLETE (No Refresh Mode)');
        console.log(`   Total cleaned ever: ${totalCleaned}`);
        console.log(`   Cleaned this session: ${sessionCleaned}`);
        console.log('='.repeat(50));
        
        // Check remaining
        const remaining = await page.evaluate(() => {
            const tweets = document.querySelectorAll('article[data-testid="tweet"]');
            let retweets = 0;
            tweets.forEach(t => {
                if (t.innerText.includes('You reposted') || t.innerText.includes('You retweeted')) {
                    retweets++;
                }
            });
            return retweets;
        });
        
        console.log(`\n📊 Visible retweets remaining: ${remaining}`);
        
        if (remaining > 0) {
            console.log('\nMore retweets still visible. Run again to continue!');
        } else {
            console.log('\n🎉 No more retweets visible!');
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

noRefreshCleanup();