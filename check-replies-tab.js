const puppeteer = require('puppeteer-extra');

async function checkRepliesTab() {
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        console.log('🔍 Checking Posts & Replies tab for hidden retweets...\n');
        
        // Go to posts & replies
        await page.goto('https://x.com/GlitchyGrade/with_replies', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        // Count and analyze
        const analysis = await page.evaluate(() => {
            const tweets = document.querySelectorAll('article[data-testid="tweet"]');
            const results = [];
            
            tweets.forEach((tweet, index) => {
                const text = tweet.innerText || '';
                const isRetweet = text.includes('You reposted') || text.includes('You retweeted');
                const preview = text.substring(0, 100).replace(/\n/g, ' ');
                
                results.push({
                    index: index + 1,
                    isRetweet,
                    preview
                });
            });
            
            return results;
        });
        
        console.log(`Found ${analysis.length} items in Posts & Replies:\n`);
        
        let retweetCount = 0;
        analysis.forEach(item => {
            if (item.isRetweet) {
                console.log(`${item.index}. [RETWEET] ${item.preview}...`);
                retweetCount++;
            } else {
                console.log(`${item.index}. [REPLY] ${item.preview}...`);
            }
        });
        
        console.log(`\n📊 Summary: ${retweetCount} retweets, ${analysis.length - retweetCount} replies`);
        
        if (retweetCount > 0) {
            console.log('\n⚠️  Found more retweets! These are in the replies section.');
            console.log('The cleanup script needs to handle the replies tab too.');
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

checkRepliesTab();