const puppeteer = require('puppeteer-extra');

async function checkAllTabs() {
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        console.log('🔍 Checking all profile tabs...\n');
        
        // Check main profile
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        // Try clicking on "Posts" tab explicitly
        const postsTab = await page.$('a[href="/GlitchyGrade"][role="tab"]');
        if (postsTab) {
            await postsTab.click();
            await page.waitForTimeout(2000);
        }
        
        // Count posts
        let posts = await page.$$('article[data-testid="tweet"]');
        console.log(`Posts tab: ${posts.length} items`);
        
        // Try "Posts & replies" tab
        await page.goto('https://x.com/GlitchyGrade/with_replies', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        posts = await page.$$('article[data-testid="tweet"]');
        console.log(`Posts & replies tab: ${posts.length} items`);
        
        // Try media tab
        await page.goto('https://x.com/GlitchyGrade/media', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        posts = await page.$$('article[data-testid="tweet"]');
        console.log(`Media tab: ${posts.length} items`);
        
        // Try likes tab
        await page.goto('https://x.com/GlitchyGrade/likes', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        posts = await page.$$('article[data-testid="tweet"]');
        console.log(`Likes tab: ${posts.length} items`);
        
        // Go back to main profile and scroll aggressively
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        // Force scroll multiple times
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
                // Also try scrolling the timeline element directly
                const timeline = document.querySelector('[aria-label="Timeline: Your timeline"]');
                if (timeline) timeline.scrollTop = timeline.scrollHeight;
            });
            await page.waitForTimeout(1500);
        }
        
        const finalCount = await page.$$('article[data-testid="tweet"]');
        console.log(`\nAfter aggressive scrolling: ${finalCount.length} posts`);
        
        if (finalCount.length > 0) {
            // Check what they are
            const details = await page.evaluate(() => {
                const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                const first = tweets[0];
                if (first) {
                    return first.innerText.substring(0, 200);
                }
                return 'No content';
            });
            console.log('\nFirst post preview:', details);
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

checkAllTabs();