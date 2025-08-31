const puppeteer = require('puppeteer-extra');

async function deepProfileCheck() {
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        console.log('🔍 Deep Profile Check - Scrolling to find all content...\n');
        
        // Navigate fresh
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        let totalPosts = 0;
        let retweets = 0;
        let regularTweets = 0;
        let lastHeight = 0;
        let scrollAttempts = 0;
        
        while (scrollAttempts < 20) { // More aggressive scrolling
            // Count current posts
            const currentStats = await page.evaluate(() => {
                const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                let rtCount = 0;
                let regularCount = 0;
                
                tweets.forEach(tweet => {
                    const text = tweet.innerText || '';
                    if (text.includes('You reposted') || text.includes('You retweeted')) {
                        rtCount++;
                    } else {
                        regularCount++;
                    }
                });
                
                return {
                    total: tweets.length,
                    retweets: rtCount,
                    regular: regularCount,
                    height: document.body.scrollHeight
                };
            });
            
            totalPosts = currentStats.total;
            retweets = currentStats.retweets;
            regularTweets = currentStats.regular;
            
            console.log(`Scroll ${scrollAttempts + 1}: ${totalPosts} posts (${retweets} retweets, ${regularTweets} tweets)`);
            
            // Check if we've hit the bottom
            if (currentStats.height === lastHeight) {
                console.log('Reached end of timeline');
                break;
            }
            lastHeight = currentStats.height;
            
            // Aggressive scroll
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await page.waitForTimeout(2000);
            
            scrollAttempts++;
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 DEEP CHECK RESULTS:');
        console.log(`   Total posts found: ${totalPosts}`);
        console.log(`   Retweets: ${retweets}`);
        console.log(`   Regular tweets: ${regularTweets}`);
        console.log('='.repeat(50));
        
        if (retweets > 0) {
            console.log('\n⚠️  Found hidden retweets! Continue cleaning.');
        } else if (totalPosts === 0) {
            console.log('\n✅ Profile is COMPLETELY EMPTY! Ready for Pokemon content!');
        } else {
            console.log('\n✅ Only regular tweets remain (no retweets).');
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

deepProfileCheck();