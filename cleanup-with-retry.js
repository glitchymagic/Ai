const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function cleanupWithRetry() {
    console.log('🔄 Cleanup with Retry Logic');
    console.log('==========================\n');
    
    let browser;
    let retries = 0;
    
    // Keep trying to connect
    while (retries < 5) {
        try {
            console.log(`Connection attempt ${retries + 1}...`);
            browser = await puppeteer.connect({
                browserURL: 'http://127.0.0.1:9222',
                defaultViewport: null,
                timeout: 5000
            });
            console.log('✅ Connected!\n');
            break;
        } catch (e) {
            retries++;
            if (retries < 5) {
                console.log('Retrying in 2 seconds...');
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }
    
    if (!browser) {
        console.log('❌ Could not connect to Chrome');
        return;
    }
    
    try {
        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();
        
        // Load progress
        let totalCleaned = 634;
        try {
            totalCleaned = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
        } catch (e) {}
        
        console.log(`📊 Continuing from: ${totalCleaned} retweets already cleaned`);
        console.log('ℹ️  NO REFRESH mode - just scrolling\n');
        
        // Make sure we're on the right page
        const currentUrl = page.url();
        if (!currentUrl.includes('GlitchyGrade')) {
            console.log('Navigating to profile...');
            await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
            await page.waitForTimeout(5000);
        }
        
        let sessionCleaned = 0;
        let noProgress = 0;
        
        // Main cleanup loop
        while (noProgress < 20) {
            try {
                // Try to find and click a retweet
                const found = await page.evaluate(() => {
                    // Find all visible tweets
                    const tweets = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
                    
                    // Look for one that says "You reposted"
                    for (let tweet of tweets) {
                        if (tweet.innerText && (tweet.innerText.includes('You reposted') || tweet.innerText.includes('You retweeted'))) {
                            // Find the retweet button in this tweet
                            const buttons = tweet.querySelectorAll('button');
                            for (let btn of buttons) {
                                const svg = btn.querySelector('svg');
                                if (svg && svg.querySelector('path[d*="M4.75"]')) {
                                    btn.click();
                                    return true;
                                }
                            }
                        }
                    }
                    return false;
                });
                
                if (found) {
                    await page.waitForTimeout(1500);
                    
                    // Click undo
                    const undone = await page.evaluate(() => {
                        const items = document.querySelectorAll('[role="menuitem"], span');
                        for (let item of items) {
                            if (item.textContent && (item.textContent.includes('Undo repost') || item.textContent.includes('Undo Retweet'))) {
                                item.click();
                                return true;
                            }
                        }
                        return false;
                    });
                    
                    if (undone) {
                        sessionCleaned++;
                        totalCleaned++;
                        noProgress = 0;
                        fs.writeFileSync('cleanup-progress.txt', totalCleaned.toString());
                        console.log(`✅ Cleaned: ${totalCleaned} total (${sessionCleaned} this session)`);
                        await page.waitForTimeout(2500);
                    } else {
                        await page.keyboard.press('Escape');
                        noProgress++;
                    }
                } else {
                    noProgress++;
                    
                    // Scroll to load more
                    console.log('Scrolling to find more...');
                    await page.evaluate(() => {
                        window.scrollBy(0, 1000);
                    });
                    await page.waitForTimeout(2000);
                }
                
            } catch (e) {
                console.log('Minor error, continuing...');
                noProgress++;
                await page.keyboard.press('Escape').catch(() => {});
                await page.waitForTimeout(1000);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(`✅ Session complete!`);
        console.log(`   Total all-time: ${totalCleaned}`);
        console.log(`   This session: ${sessionCleaned}`);
        console.log('='.repeat(50));
        
    } catch (error) {
        console.log('Error during cleanup:', error.message);
    } finally {
        if (browser) {
            browser.disconnect();
        }
    }
}

cleanupWithRetry();