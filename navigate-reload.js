const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function navigateReload() {
    console.log('🔄 Navigate & Reload Strategy');
    console.log('=============================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        // Navigate to home first
        console.log('1. Going to home timeline...');
        await page.goto('https://x.com/home', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        // Search for the account
        console.log('2. Searching for @GlitchyGrade...');
        await page.goto('https://x.com/search?q=%40GlitchyGrade&src=typed_query&f=user', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        // Click on the profile from search results
        const profileLink = await page.$('a[href="/GlitchyGrade"]');
        if (profileLink) {
            console.log('3. Clicking profile from search...');
            await profileLink.click();
            await page.waitForTimeout(5000);
        } else {
            // Direct navigation
            console.log('3. Direct navigation to profile...');
            await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
            await page.waitForTimeout(5000);
        }
        
        // Aggressive scrolling to load content
        console.log('4. Scrolling to load posts...');
        for (let i = 0; i < 10; i++) {
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await page.waitForTimeout(1500);
            
            // Check if posts loaded
            const posts = await page.$$('article[data-testid="tweet"]');
            console.log(`   Scroll ${i+1}: ${posts.length} posts visible`);
            
            if (posts.length > 0) {
                // Check for retweets
                const hasRetweets = await page.evaluate(() => {
                    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                    for (let tweet of tweets) {
                        if (tweet.innerText.includes('You reposted') || tweet.innerText.includes('You retweeted')) {
                            return true;
                        }
                    }
                    return false;
                });
                
                if (hasRetweets) {
                    console.log('\n✅ Found more retweets! Resuming cleanup...\n');
                    
                    // Run marathon cleanup
                    browser.disconnect();
                    const { spawn } = require('child_process');
                    const cleanup = spawn('node', ['marathon-cleanup.js']);
                    
                    cleanup.stdout.on('data', (data) => {
                        process.stdout.write(data);
                    });
                    
                    cleanup.stderr.on('data', (data) => {
                        process.stderr.write(data);
                    });
                    
                    return;
                }
            }
        }
        
        console.log('\n📊 No more retweets found after aggressive loading attempts.');
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

navigateReload();