const puppeteer = require('puppeteer-extra');

async function checkProfile() {
    console.log('🔍 Checking profile content...\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        // Refresh and go to profile
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        // Count tweets
        const tweets = await page.$$('article[data-testid="tweet"]');
        console.log(`📊 Found ${tweets.length} posts on current view`);
        
        // Check profile stats
        const stats = await page.evaluate(() => {
            const navLinks = Array.from(document.querySelectorAll('nav a'));
            const postsLink = navLinks.find(a => a.href && a.href.includes('/GlitchyGrade') && !a.href.includes('with_replies'));
            if (postsLink) {
                const text = postsLink.innerText;
                return text;
            }
            return 'Stats not found';
        });
        
        console.log(`📈 Profile shows: ${stats}`);
        
        // Check first few tweets
        if (tweets.length > 0) {
            console.log('\nFirst 3 posts:');
            for (let i = 0; i < Math.min(3, tweets.length); i++) {
                const tweetText = await tweets[i].evaluate(el => {
                    const text = el.innerText.slice(0, 100);
                    return text.replace(/\n/g, ' ');
                });
                console.log(`${i + 1}. ${tweetText}...`);
            }
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

checkProfile();