const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function marathonCleanup() {
    console.log('🏃 Marathon Cleanup Session');
    console.log('==========================\n');
    console.log('This will clean as many retweets as possible.');
    console.log('The script will keep track of progress.\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        // Load saved progress
        let totalCleaned = 0;
        try {
            const fs = require('fs');
            totalCleaned = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 0;
            console.log(`📊 Resuming from: ${totalCleaned} retweets already cleaned\n`);
        } catch (e) {
            console.log('📊 Starting fresh cleanup\n');
        }
        
        const sessionStart = totalCleaned;
        
        // Go to profile
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        let noActionCount = 0;
        
        while (noActionCount < 10) { // More attempts before giving up
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
                        totalCleaned++;
                        noActionCount = 0;
                        
                        // Save progress
                        require('fs').writeFileSync('cleanup-progress.txt', totalCleaned.toString());
                        
                        const sessionCleaned = totalCleaned - sessionStart;
                        console.log(`✅ Total cleaned: ${totalCleaned} | This session: ${sessionCleaned}`);
                        
                        await page.waitForTimeout(2000);
                        
                        // Refresh every 25 to maintain performance
                        if (totalCleaned % 25 === 0) {
                            console.log('🔄 Refreshing...');
                            await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
                            await page.waitForTimeout(3000);
                        }
                    } else {
                        await page.keyboard.press('Escape');
                        noActionCount++;
                    }
                } else {
                    noActionCount++;
                    
                    // More aggressive scrolling
                    await page.evaluate(() => {
                        window.scrollBy(0, 1000);
                        // Force load more content
                        const bottom = document.querySelector('[data-testid="cellInnerDiv"]:last-child');
                        if (bottom) bottom.scrollIntoView();
                    });
                    await page.waitForTimeout(2000);
                    
                    // If stuck, refresh
                    if (noActionCount === 5) {
                        console.log('🔄 Refreshing to find more...');
                        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
                        await page.waitForTimeout(3000);
                    }
                }
                
            } catch (err) {
                noActionCount++;
                await page.keyboard.press('Escape').catch(() => {});
            }
        }
        
        // Final check
        console.log('\n📊 FINAL CHECK...');
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
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
        
        console.log('\n' + '='.repeat(50));
        console.log(`✅ SESSION COMPLETE`);
        console.log(`   Total cleaned ever: ${totalCleaned}`);
        console.log(`   Cleaned this session: ${totalCleaned - sessionStart}`);
        console.log(`   Visible retweets remaining: ${remaining}`);
        console.log('='.repeat(50));
        
        if (remaining > 0) {
            console.log('\nMore retweets detected. Run again to continue!');
        } else {
            console.log('\n🎉 NO MORE RETWEETS VISIBLE!');
            console.log('\nNext steps:');
            console.log('1. Update bio');
            console.log('2. Post Pokemon tweets');
            console.log('3. Wait 72 hours');
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

marathonCleanup();