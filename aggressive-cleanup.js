const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function aggressiveCleanup() {
    console.log('💪 Aggressive Cleanup Mode');
    console.log('=========================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        let totalCleaned = 0;
        const startTime = Date.now();
        
        // Multiple passes to ensure we get everything
        for (let pass = 1; pass <= 3; pass++) {
            console.log(`\n🔄 Pass ${pass}/3:`);
            
            // Navigate fresh each pass
            await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
            await page.waitForTimeout(3000);
            
            let passCleanCount = 0;
            let noActionCount = 0;
            
            while (noActionCount < 5) {
                try {
                    // Try clicking any visible retweet button
                    const found = await page.evaluate(() => {
                        // Get all visible retweet buttons
                        const buttons = Array.from(document.querySelectorAll('[data-testid="retweet"]'));
                        
                        // Also try alternative selectors
                        const altButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
                            const svg = btn.querySelector('svg');
                            return svg && svg.querySelector('path[d*="M4.75 3.79l4.603"]');
                        });
                        
                        const allButtons = [...buttons, ...altButtons];
                        
                        // Find one that's in a "You reposted" tweet
                        for (let btn of allButtons) {
                            const article = btn.closest('article');
                            if (article && (article.innerText.includes('You reposted') || article.innerText.includes('You retweeted'))) {
                                btn.click();
                                return true;
                            }
                        }
                        return false;
                    });
                    
                    if (found) {
                        await page.waitForTimeout(1000);
                        
                        // Try multiple ways to click undo
                        const undone = await page.evaluate(() => {
                            // Method 1: Role menuitem
                            const menuItems = document.querySelectorAll('[role="menuitem"]');
                            for (let item of menuItems) {
                                if (item.textContent && item.textContent.includes('Undo')) {
                                    item.click();
                                    return true;
                                }
                            }
                            
                            // Method 2: Any clickable with text
                            const clickables = [...document.querySelectorAll('div[role="button"]'), ...document.querySelectorAll('span'), ...document.querySelectorAll('div[tabindex]')];
                            for (let elem of clickables) {
                                if (elem.textContent === 'Undo repost' || elem.textContent === 'Undo Retweet') {
                                    elem.click();
                                    return true;
                                }
                            }
                            
                            return false;
                        });
                        
                        if (undone) {
                            passCleanCount++;
                            totalCleaned++;
                            noActionCount = 0;
                            console.log(`✅ Cleaned #${totalCleaned}`);
                            await page.waitForTimeout(2000);
                        } else {
                            await page.keyboard.press('Escape');
                            noActionCount++;
                        }
                    } else {
                        noActionCount++;
                        // Aggressive scroll
                        await page.evaluate(() => {
                            window.scrollBy(0, 500);
                            // Also try scrolling the main timeline element
                            const timeline = document.querySelector('[data-testid="primaryColumn"]');
                            if (timeline) timeline.scrollTop += 500;
                        });
                        await page.waitForTimeout(1500);
                    }
                    
                } catch (err) {
                    noActionCount++;
                    await page.keyboard.press('Escape').catch(() => {});
                }
            }
            
            console.log(`Pass ${pass} cleaned: ${passCleanCount} retweets`);
        }
        
        // Final verification
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        // Scroll to load all content
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(1000);
        }
        
        const finalCount = await page.evaluate(() => {
            const tweets = document.querySelectorAll('article[data-testid="tweet"]');
            let retweets = 0;
            tweets.forEach(t => {
                if (t.innerText.includes('You reposted') || t.innerText.includes('You retweeted')) {
                    retweets++;
                }
            });
            return { total: tweets.length, retweets };
        });
        
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ AGGRESSIVE CLEANUP COMPLETE');
        console.log(`   Total cleaned: ${totalCleaned} retweets`);
        console.log(`   Time taken: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`);
        console.log(`   Remaining posts: ${finalCount.total} (${finalCount.retweets} retweets)`);
        console.log('='.repeat(50));
        
        if (finalCount.retweets === 0) {
            console.log('\n🎉 SUCCESS! Your profile is completely clean!\n');
            console.log('✅ NEXT STEPS:');
            console.log('1. Update bio: "Pokemon TCG market insights & price tracking 📊"');
            console.log('2. Post these 3 tweets:');
            console.log('   - "Getting back into Pokemon TCG collecting..."');
            console.log('   - "What\'s everyone\'s chase card right now?..."');
            console.log('   - "Anyone else notice Paldea Evolved prices climbing?..."');
            console.log('3. Follow 20 Pokemon accounts');
            console.log('4. Wait 72 hours before ANY bot activity');
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

aggressiveCleanup();