const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('Quick Clean Starting...\n');
    
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    
    const pages = await browser.pages();
    const page = pages[0];
    
    let total = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
    console.log(`Starting from: ${total}\n`);
    
    for (let i = 0; i < 50; i++) {
        try {
            // Click retweet
            const clicked = await page.evaluate(() => {
                const t = document.querySelector('article[data-testid="tweet"]');
                if (t && t.innerText.includes('You reposted')) {
                    const btn = t.querySelector('button svg path[d*="M4.75"]')?.closest('button');
                    if (btn) { btn.click(); return true; }
                }
                return false;
            });
            
            if (clicked) {
                await page.waitForTimeout(1000);
                
                // Undo
                await page.evaluate(() => {
                    const undo = [...document.querySelectorAll('*')].find(el => 
                        el.textContent === 'Undo repost'
                    );
                    if (undo) undo.click();
                });
                
                total++;
                fs.writeFileSync('cleanup-progress.txt', total.toString());
                console.log(`✅ ${total}`);
                await page.waitForTimeout(2000);
            } else {
                await page.evaluate(() => window.scrollBy(0, 500));
                await page.waitForTimeout(1000);
            }
        } catch (e) {
            await page.keyboard.press('Escape').catch(() => {});
        }
    }
    
    console.log(`\nTotal: ${total}`);
    browser.disconnect();
})();