const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function continuousCleanup() {
    console.log('🔄 Continuous Retweet Cleanup');
    console.log('=============================\n');
    console.log('This will run until ALL retweets are removed.');
    console.log('Press Ctrl+C to stop at any time.\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        // Go to profile
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        console.log('✅ Connected. Starting cleanup...\n');
        
        let totalUndone = 0;
        let consecutiveFailures = 0;
        const startTime = Date.now();
        
        // Continue until we can't find any more retweets
        while (consecutiveFailures < 5) {
            try {
                // Try to undo a retweet
                const success = await undoOneRetweet(page);
                
                if (success) {
                    totalUndone++;
                    consecutiveFailures = 0;
                    
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    const rate = (totalUndone / elapsed * 60).toFixed(1);
                    
                    console.log(`✅ Undid retweet #${totalUndone} (${rate}/min)`);
                    
                    // Refresh periodically to avoid issues
                    if (totalUndone % 20 === 0) {
                        console.log('🔄 Refreshing page...');
                        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
                        await page.waitForTimeout(3000);
                    }
                    
                    // Small delay between actions
                    await page.waitForTimeout(2500);
                } else {
                    consecutiveFailures++;
                    
                    if (consecutiveFailures < 5) {
                        console.log('📜 Scrolling to find more...');
                        await page.evaluate(() => window.scrollBy(0, 1000));
                        await page.waitForTimeout(2000);
                    }
                }
                
            } catch (error) {
                console.log('⚠️ Error, retrying...');
                consecutiveFailures++;
                await page.keyboard.press('Escape').catch(() => {});
                await page.waitForTimeout(1000);
            }
        }
        
        // Final stats
        const totalTime = Math.floor((Date.now() - startTime) / 1000);
        console.log('\n' + '='.repeat(50));
        console.log(`✅ CLEANUP COMPLETE!`);
        console.log(`   Total retweets undone: ${totalUndone}`);
        console.log(`   Time taken: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`);
        console.log('='.repeat(50));
        
        // Check final state
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        const remaining = await page.$$('article[data-testid="tweet"]');
        console.log(`\n📊 ${remaining.length} posts remaining on profile\n`);
        
        browser.disconnect();
        
        console.log('✨ Your profile is now clean!\n');
        console.log('NEXT STEPS:');
        console.log('1. Update bio to: "Pokemon TCG market insights & price tracking 📊"');
        console.log('2. Post 3 Pokemon tweets manually');
        console.log('3. Wait 72 hours before running the bot\n');
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

async function undoOneRetweet(page) {
    // Find and click retweet button
    const clicked = await page.evaluate(() => {
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        
        for (let tweet of tweets) {
            const tweetText = tweet.innerText || '';
            if (tweetText.includes('You reposted') || tweetText.includes('You retweeted')) {
                const buttons = tweet.querySelectorAll('button');
                
                for (let button of buttons) {
                    const svg = button.querySelector('svg');
                    if (svg) {
                        const paths = svg.querySelectorAll('path');
                        for (let path of paths) {
                            const d = path.getAttribute('d');
                            if (d && d.includes('M4.75 3.79l4.603')) {
                                button.click();
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    });
    
    if (!clicked) return false;
    
    await page.waitForTimeout(1500);
    
    // Click undo from menu
    const undone = await page.evaluate(() => {
        const menuItems = document.querySelectorAll('[role="menuitem"]');
        for (let item of menuItems) {
            const text = item.innerText || '';
            if (text.includes('Undo repost') || text.includes('Undo Retweet')) {
                item.click();
                return true;
            }
        }
        
        const spans = document.querySelectorAll('span');
        for (let span of spans) {
            if (span.textContent === 'Undo repost' || span.textContent === 'Undo Retweet') {
                span.click();
                return true;
            }
        }
        return false;
    });
    
    if (!undone) {
        await page.keyboard.press('Escape');
        return false;
    }
    
    return true;
}

// Run the cleanup
continuousCleanup();