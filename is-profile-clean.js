const puppeteer = require('puppeteer-extra');

async function checkIfClean() {
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        console.log('🔍 Checking if profile is clean...\n');
        
        // Go to profile with fresh load
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        // Check what's visible
        const stats = await page.evaluate(() => {
            const articles = document.querySelectorAll('article[data-testid="tweet"]');
            const firstFew = [];
            
            for (let i = 0; i < Math.min(3, articles.length); i++) {
                const text = articles[i].innerText.substring(0, 100);
                firstFew.push(text);
            }
            
            return {
                total: articles.length,
                samples: firstFew
            };
        });
        
        console.log(`📊 Found ${stats.total} posts on initial load\n`);
        
        if (stats.total === 0) {
            console.log('✅ YOUR PROFILE IS COMPLETELY CLEAN!\n');
            console.log('Time to rebuild with Pokemon content!');
        } else {
            console.log('First few posts:');
            stats.samples.forEach((text, i) => {
                console.log(`${i + 1}. ${text}...`);
            });
            
            // Check if they're retweets
            const hasRetweets = stats.samples.some(text => 
                text.includes('You reposted') || text.includes('You retweeted')
            );
            
            if (hasRetweets) {
                console.log('\n⚠️  Still some retweets remaining');
                console.log('Run cleanup script again or do manually');
            } else {
                console.log('\n✅ No retweets visible! Just regular tweets');
            }
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

checkIfClean();