const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('🔄 Fresh Continue');
    console.log('================\n');
    
    // Wait for Chrome to fully start
    await new Promise(r => setTimeout(r, 3000));
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();
        
        // Navigate to profile
        console.log('Going to profile...');
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(5000);
        
        let total = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
        console.log(`\n📊 Starting from: ${total}\n`);
        
        let cleaned = 0;
        
        // Clean retweets
        for (let i = 0; i < 30; i++) {
            try {
                const clicked = await page.evaluate(() => {
                    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                    for (let tweet of tweets) {
                        if (tweet.innerText && tweet.innerText.includes('You reposted')) {
                            const btn = tweet.querySelector('button svg path[d*="M4.75"]')?.closest('button');
                            if (btn) {
                                btn.click();
                                return true;
                            }
                        }
                    }
                    return false;
                });
                
                if (clicked) {
                    await page.waitForTimeout(1500);
                    
                    await page.evaluate(() => {
                        const undo = [...document.querySelectorAll('*')].find(el => 
                            el.textContent === 'Undo repost'
                        );
                        if (undo) undo.click();
                    });
                    
                    cleaned++;
                    total++;
                    fs.writeFileSync('cleanup-progress.txt', total.toString());
                    console.log(`✅ ${total}`);
                    await page.waitForTimeout(2000);
                } else {
                    if (i % 5 === 0) {
                        console.log('Scrolling...');
                        await page.evaluate(() => window.scrollBy(0, 600));
                        await page.waitForTimeout(1500);
                    }
                }
            } catch (e) {
                await page.keyboard.press('Escape').catch(() => {});
            }
        }
        
        console.log(`\n✅ Cleaned ${cleaned} (Total: ${total})`);
        browser.disconnect();
        
    } catch (err) {
        console.log('Error:', err.message);
    }
})();