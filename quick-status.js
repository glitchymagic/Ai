const puppeteer = require('puppeteer-extra');

async function quickStatus() {
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        const fs = require('fs');
        const totalCleaned = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 0;
        
        console.log(`\n📊 CLEANUP STATUS`);
        console.log(`=================`);
        console.log(`✅ Total retweets cleaned: ${totalCleaned}`);
        console.log(`⏱️  Time estimate: ~${Math.floor(totalCleaned / 15)} minutes of work done`);
        
        // Check current state
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        const visible = await page.evaluate(() => {
            const tweets = document.querySelectorAll('article[data-testid="tweet"]');
            return tweets.length;
        });
        
        console.log(`\n🔍 Currently visible: ${visible} posts`);
        console.log(`\nKeep running marathon-cleanup.js until no more retweets!`);
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

quickStatus();