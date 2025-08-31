const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('⚡ Rapid Clean\n');
    
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222'
    });
    
    const page = (await browser.pages())[0];
    let total = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
    console.log(`Starting: ${total}\n`);
    
    for (let i = 0; i < 30; i++) {
        try {
            // Click retweet button
            const clicked = await page.evaluate(() => {
                const t = document.querySelector('article[data-testid="tweet"]:has-text("You reposted"), article[data-testid="tweet"]:has-text("You retweeted")');
                if (t) {
                    const btn = t.querySelector('button:has(svg path[d*="M4.75"])');
                    if (btn) { btn.click(); return true; }
                }
                // Fallback
                const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                for (let tweet of tweets) {
                    if (tweet.innerText && tweet.innerText.includes('You repo')) {
                        const btn = tweet.querySelector('button svg path[d*="M4.75"]')?.closest('button');
                        if (btn) { btn.click(); return true; }
                    }
                }
                return false;
            });
            
            if (clicked) {
                await page.waitForTimeout(800);
                
                // Undo
                await page.evaluate(() => {
                    const undo = [...document.querySelectorAll('*')].find(el => 
                        el.textContent === 'Undo repost' || el.textContent === 'Undo Retweet'
                    );
                    if (undo) undo.click();
                });
                
                total++;
                fs.writeFileSync('cleanup-progress.txt', total.toString());
                console.log(`✅ ${total}`);
                await page.waitForTimeout(1500);
            } else {
                if (i % 3 === 0) {
                    await page.evaluate(() => window.scrollBy(0, 600));
                    await page.waitForTimeout(1000);
                }
            }
        } catch (e) {
            await page.keyboard.press('Escape').catch(() => {});
        }
    }
    
    console.log(`\nTotal: ${total}`);
    browser.disconnect();
})();