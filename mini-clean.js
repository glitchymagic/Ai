const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('Mini Clean - Just 10 attempts\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null,
            timeout: 5000
        });
        
        console.log('Connected!\n');
        
        const pages = await browser.pages();
        const page = pages[0];
        
        let total = 634;
        try {
            total = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8'));
        } catch (e) {}
        
        console.log(`Starting from: ${total}\n`);
        
        // Just 10 quick attempts
        for (let i = 0; i < 10; i++) {
            console.log(`Attempt ${i+1}...`);
            
            // Click retweet
            const clicked = await page.evaluate(() => {
                const tweets = document.querySelectorAll('article');
                for (let t of tweets) {
                    if (t.innerText && t.innerText.includes('You reposted')) {
                        const btn = t.querySelector('button[data-testid*="retweet"], button[aria-label*="Repost"], button svg path[d*="M4.75"]')?.closest('button');
                        if (btn) {
                            btn.click();
                            return true;
                        }
                    }
                }
                return false;
            }).catch(() => false);
            
            if (clicked) {
                await new Promise(r => setTimeout(r, 1000));
                
                // Undo
                await page.evaluate(() => {
                    const items = document.querySelectorAll('span, div[role="menuitem"]');
                    for (let item of items) {
                        if (item.textContent === 'Undo repost') {
                            item.click();
                            break;
                        }
                    }
                }).catch(() => {});
                
                total++;
                fs.writeFileSync('cleanup-progress.txt', total.toString());
                console.log(`✅ Cleaned! Total: ${total}`);
                
                await new Promise(r => setTimeout(r, 2000));
            } else {
                // Scroll
                await page.evaluate(() => window.scrollBy(0, 300)).catch(() => {});
                await new Promise(r => setTimeout(r, 500));
            }
        }
        
        console.log(`\nDone! Total: ${total}`);
        browser.disconnect();
        
    } catch (err) {
        console.log('Error:', err.message);
    }
})();