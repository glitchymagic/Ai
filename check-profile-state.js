const puppeteer = require('puppeteer-extra');

async function checkProfileState() {
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        console.log('🔍 Checking profile state and stats...\n');
        
        // Go to profile
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        // Get profile stats
        const stats = await page.evaluate(() => {
            // Look for the stats in the profile header
            const statElements = document.querySelectorAll('a[href*="/GlitchyGrade/"] span');
            const stats = {};
            
            statElements.forEach(el => {
                const text = el.textContent;
                const parent = el.parentElement?.textContent || '';
                
                if (parent.includes('Following')) {
                    stats.following = text;
                } else if (parent.includes('Followers')) {
                    stats.followers = text;
                } else if (parent.includes('posts') || parent.includes('Posts')) {
                    stats.posts = text;
                }
            });
            
            // Check for any "no posts" message
            const emptyMessage = document.querySelector('[data-testid="emptyState"]');
            stats.isEmpty = !!emptyMessage;
            
            // Get any visible text that might indicate post count
            const headerText = document.querySelector('main')?.innerText || '';
            
            return { stats, headerText: headerText.substring(0, 500) };
        });
        
        console.log('Profile Stats:', stats.stats);
        console.log('Is Empty:', stats.isEmpty);
        
        // Try different URL patterns
        console.log('\nTrying different URL approaches...');
        
        // Try with trailing slash
        await page.goto('https://x.com/GlitchyGrade/', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        let posts = await page.$$('article[data-testid="tweet"]');
        console.log(`With trailing slash: ${posts.length} posts`);
        
        // Try mobile view
        await page.setViewport({ width: 375, height: 812 });
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        posts = await page.$$('article[data-testid="tweet"]');
        console.log(`Mobile view: ${posts.length} posts`);
        
        // Reset viewport
        await page.setViewport({ width: 1366, height: 768 });
        
        // Check if we need to click "Show more posts" or similar
        const showMore = await page.$('button[data-testid="show-more-button"]');
        if (showMore) {
            console.log('Found "Show more" button, clicking...');
            await showMore.click();
            await page.waitForTimeout(3000);
        }
        
        // Final count
        posts = await page.$$('article[data-testid="tweet"]');
        console.log(`\nFinal count: ${posts.length} posts`);
        
        if (posts.length === 0) {
            console.log('\n✅ Profile appears to be completely clean!');
            console.log('No posts are loading, which suggests all content has been removed.');
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

checkProfileState();