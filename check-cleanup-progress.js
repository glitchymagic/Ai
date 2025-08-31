const puppeteer = require('puppeteer-extra');

async function checkProgress() {
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        console.log('🔍 Checking cleanup progress...\n');
        
        // Refresh profile
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        // Count visible posts
        let totalPosts = 0;
        let retweetCount = 0;
        let scrolls = 0;
        let lastCount = 0;
        
        while (scrolls < 10) {
            const posts = await page.$$('article[data-testid="tweet"]');
            totalPosts = posts.length;
            
            // Count retweets
            retweetCount = await page.evaluate(() => {
                const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                let count = 0;
                tweets.forEach(tweet => {
                    const text = tweet.innerText || '';
                    if (text.includes('You reposted') || text.includes('You retweeted')) {
                        count++;
                    }
                });
                return count;
            });
            
            console.log(`Scroll ${scrolls + 1}: ${totalPosts} total posts, ${retweetCount} retweets`);
            
            if (totalPosts === lastCount) break;
            lastCount = totalPosts;
            
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(2000);
            scrolls++;
        }
        
        console.log('\n📊 CURRENT STATUS:');
        console.log(`   Total posts visible: ${totalPosts}`);
        console.log(`   Retweets remaining: ${retweetCount}`);
        console.log(`   Regular tweets: ${totalPosts - retweetCount}`);
        
        if (retweetCount > 0) {
            console.log(`\n⏱️  At ~15 retweets/min, remaining time: ~${Math.ceil(retweetCount / 15)} minutes`);
            console.log('\nRun "node continuous-cleanup.js" to continue cleaning!');
        } else {
            console.log('\n✅ No more retweets found! Your profile is clean!');
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

checkProgress();