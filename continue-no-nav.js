const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('🔄 Continuing Cleanup - NO NAVIGATION');
    console.log('=====================================\n');
    
    try {
        // Connect to existing browser
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        console.log('✅ Connected to existing session\n');
        
        // Load progress
        let totalCleaned = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
        console.log(`📊 Continuing from: ${totalCleaned} retweets\n`);
        
        let cleaned = 0;
        let attempts = 0;
        
        // Main loop - no navigation, just work with what's there
        while (attempts < 50) {
            attempts++;
            
            try {
                // Find and click retweet
                const clicked = await page.evaluate(() => {
                    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                    
                    for (let tweet of tweets) {
                        if (tweet.innerText && tweet.innerText.includes('You reposted')) {
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
                        const items = document.querySelectorAll('[role="menuitem"], span');
                        for (let item of items) {
                            if (item.textContent && item.textContent.includes('Undo repost')) {
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
                        console.log(`✅ Cleaned: ${totalCleaned} total (${cleaned} this run)`);
                        await page.waitForTimeout(2500);
                    } else {
                        await page.keyboard.press('Escape');
                    }
                } else {
                    // Just scroll, don't refresh
                    if (attempts % 5 === 0) {
                        console.log('Scrolling...');
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
        
        console.log(`\n✅ Session done: ${cleaned} cleaned (Total: ${totalCleaned})`);
        
        // Don't close, just disconnect
        browser.disconnect();
        
    } catch (error) {
        console.log('Connection error - Chrome might need to be restarted');
        console.log('Error:', error.message);
    }
})();