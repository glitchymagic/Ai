const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function continueCleanup() {
    console.log('🔄 Continuing Cleanup - Alternative Connection');
    console.log('============================================\n');
    
    try {
        // Try different connection methods
        let browser;
        let page;
        
        // Method 1: Try debug port
        try {
            browser = await puppeteer.connect({
                browserURL: 'http://127.0.0.1:9222',
                defaultViewport: null
            });
            const pages = await browser.pages();
            page = pages[0];
            console.log('✅ Connected via debug port\n');
        } catch (e) {
            console.log('Debug port failed, trying alternative...\n');
            
            // Method 2: Try connecting to any Chrome instance
            try {
                browser = await puppeteer.connect({
                    browserURL: 'http://localhost:9222',
                    defaultViewport: null
                });
                const pages = await browser.pages();
                page = pages[0];
            } catch (e2) {
                console.log('❌ Cannot connect to Chrome.');
                console.log('\nPlease run Chrome with:');
                console.log('/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222\n');
                return;
            }
        }
        
        // Load progress
        const fs = require('fs');
        let totalCleaned = 634; // Fallback to known value
        try {
            totalCleaned = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
        } catch (e) {
            console.log('Using known progress: 634');
        }
        
        console.log(`📊 Continuing from: ${totalCleaned} retweets already cleaned\n`);
        
        // Navigate to profile
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(5000);
        
        // Force scroll to bottom multiple times
        console.log('Scrolling to load all content...');
        for (let i = 0; i < 10; i++) {
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await page.waitForTimeout(2000);
        }
        
        // Check for posts
        const posts = await page.$$('article[data-testid="tweet"]');
        console.log(`\nFound ${posts.length} posts after scrolling\n`);
        
        if (posts.length === 0) {
            console.log('No posts visible. Trying alternate loading...');
            
            // Try refreshing
            await page.reload({ waitUntil: 'networkidle2' });
            await page.waitForTimeout(3000);
            
            // Scroll again
            for (let i = 0; i < 5; i++) {
                await page.evaluate(() => window.scrollBy(0, 1000));
                await page.waitForTimeout(1000);
            }
        }
        
        // Start cleaning loop
        let sessionCleaned = 0;
        let noActionCount = 0;
        
        while (noActionCount < 10) {
            try {
                // Find and click retweet
                const clicked = await page.evaluate(() => {
                    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                    
                    for (let tweet of tweets) {
                        if (tweet.innerText.includes('You reposted') || tweet.innerText.includes('You retweeted')) {
                            const buttons = tweet.querySelectorAll('button');
                            for (let button of buttons) {
                                const svg = button.querySelector('svg');
                                if (svg && svg.querySelector('path[d*="M4.75 3.79l4.603"]')) {
                                    button.click();
                                    return true;
                                }
                            }
                        }
                    }
                    return false;
                });
                
                if (clicked) {
                    await page.waitForTimeout(1500);
                    
                    // Click undo
                    const undone = await page.evaluate(() => {
                        const items = [...document.querySelectorAll('[role="menuitem"]'), ...document.querySelectorAll('span')];
                        for (let item of items) {
                            if (item.textContent && (item.textContent.includes('Undo repost') || item.textContent.includes('Undo Retweet'))) {
                                item.click();
                                return true;
                            }
                        }
                        return false;
                    });
                    
                    if (undone) {
                        sessionCleaned++;
                        totalCleaned++;
                        noActionCount = 0;
                        
                        // Save progress
                        fs.writeFileSync('cleanup-progress.txt', totalCleaned.toString());
                        
                        console.log(`✅ Total cleaned: ${totalCleaned} | This session: ${sessionCleaned}`);
                        await page.waitForTimeout(2500);
                        
                        // Refresh every 20
                        if (totalCleaned % 20 === 0) {
                            console.log('🔄 Refreshing...');
                            await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
                            await page.waitForTimeout(3000);
                        }
                    } else {
                        await page.keyboard.press('Escape');
                        noActionCount++;
                    }
                } else {
                    noActionCount++;
                    
                    // Scroll more
                    await page.evaluate(() => window.scrollBy(0, 1000));
                    await page.waitForTimeout(2000);
                    
                    // If stuck, refresh
                    if (noActionCount === 5) {
                        console.log('🔄 Refreshing to find more...');
                        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
                        await page.waitForTimeout(3000);
                    }
                }
                
            } catch (err) {
                noActionCount++;
                await page.keyboard.press('Escape').catch(() => {});
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(`✅ Session complete`);
        console.log(`   Total cleaned all-time: ${totalCleaned}`);
        console.log(`   Cleaned this session: ${sessionCleaned}`);
        console.log('='.repeat(50));
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
        console.log('\nTrying to continue anyway...');
        
        // If all else fails, just update the count
        const fs = require('fs');
        let total = 634;
        try {
            total = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
        } catch (e) {}
        
        console.log(`\nProgress saved: ${total} retweets cleaned`);
        console.log('Please ensure Chrome is running with debug port and try again.');
    }
}

continueCleanup();