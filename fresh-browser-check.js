const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function freshBrowserCheck() {
    console.log('🌟 Fresh Browser Check');
    console.log('=====================\n');
    
    try {
        // Wait a moment for browser to fully start
        await new Promise(r => setTimeout(r, 3000));
        
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();
        
        // Navigate to Twitter
        console.log('1. Navigating to X.com...');
        await page.goto('https://x.com', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        // Check if logged in
        const isLoggedIn = await page.$('[data-testid="SideNav_AccountSwitcher_Button"]');
        if (!isLoggedIn) {
            console.log('❌ Not logged in. Please log in and run again.');
            browser.disconnect();
            return;
        }
        
        console.log('2. Logged in, navigating to profile...');
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(5000);
        
        // Multiple scroll attempts
        console.log('3. Scrolling to force load all content...');
        let maxPosts = 0;
        
        for (let i = 0; i < 15; i++) {
            // Scroll down
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await page.waitForTimeout(2000);
            
            // Count posts
            const posts = await page.$$('article[data-testid="tweet"]');
            console.log(`   Attempt ${i+1}: ${posts.length} posts loaded`);
            
            if (posts.length > maxPosts) {
                maxPosts = posts.length;
                
                // Check if any are retweets
                const retweetInfo = await page.evaluate(() => {
                    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                    let retweets = 0;
                    let regular = 0;
                    
                    tweets.forEach(tweet => {
                        if (tweet.innerText.includes('You reposted') || tweet.innerText.includes('You retweeted')) {
                            retweets++;
                        } else {
                            regular++;
                        }
                    });
                    
                    return { retweets, regular };
                });
                
                if (retweetInfo.retweets > 0) {
                    console.log(`\n🚨 Found ${retweetInfo.retweets} retweets!`);
                    console.log('Continuing cleanup...\n');
                    
                    // Load progress and continue
                    const fs = require('fs');
                    const total = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 0;
                    console.log(`Total cleaned so far: ${total}\n`);
                    
                    browser.disconnect();
                    
                    // Run marathon cleanup
                    console.log('Launching marathon cleanup...\n');
                    const { execSync } = require('child_process');
                    execSync('node marathon-cleanup.js', { stdio: 'inherit' });
                    return;
                }
            } else if (posts.length === maxPosts && i > 5) {
                // No new posts loading
                break;
            }
        }
        
        console.log(`\n📊 Final result: ${maxPosts} posts found`);
        console.log('No retweets detected.');
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

freshBrowserCheck();