const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('🔄 Focused Cleanup (50 attempts)');
    console.log('================================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        let total = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
        console.log(`📊 Starting from: ${total}\n`);
        
        let cleaned = 0;
        let scrolls = 0;
        
        // 50 attempts to stay under time limit
        for (let i = 0; i < 50; i++) {
            try {
                // Find retweet
                const found = await page.evaluate(() => {
                    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                    for (let t of tweets) {
                        if (t.innerText && (t.innerText.includes('You reposted') || t.innerText.includes('You retweeted'))) {
                            const btns = t.querySelectorAll('button');
                            for (let b of btns) {
                                const svg = b.querySelector('svg path[d*="M4.75"]');
                                if (svg) {
                                    b.click();
                                    return true;
                                }
                            }
                        }
                    }
                    return false;
                });
                
                if (found) {
                    await page.waitForTimeout(1000);
                    
                    // Undo
                    const undone = await page.evaluate(() => {
                        const items = [...document.querySelectorAll('[role="menuitem"]'), ...document.querySelectorAll('span')];
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
                        total++;
                        fs.writeFileSync('cleanup-progress.txt', total.toString());
                        console.log(`✅ Cleaned: ${total}`);
                        await page.waitForTimeout(2000);
                    } else {
                        await page.keyboard.press('Escape');
                    }
                } else {
                    // Scroll every 5 attempts
                    if (i % 5 === 0) {
                        scrolls++;
                        console.log(`Scrolling... (${scrolls})`);
                        await page.evaluate(() => {
                            window.scrollBy(0, 800);
                        });
                        await page.waitForTimeout(1500);
                    }
                }
            } catch (e) {
                await page.keyboard.press('Escape').catch(() => {});
            }
        }
        
        console.log(`\n✅ Session done: ${cleaned} cleaned (Total: ${total})`);
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
})();