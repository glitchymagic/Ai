const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function persistentCleanup() {
    console.log('💪 Persistent Cleanup Mode');
    console.log('=========================\n');
    
    // Load progress
    let totalCleaned = 634;
    try {
        totalCleaned = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
    } catch (e) {}
    
    console.log(`📊 Starting from: ${totalCleaned} retweets already cleaned`);
    console.log('ℹ️  This script will keep trying to connect and clean\n');
    
    let attempts = 0;
    
    while (attempts < 10) {
        attempts++;
        console.log(`\nAttempt ${attempts}/10:`);
        
        try {
            const browser = await puppeteer.connect({
                browserURL: 'http://127.0.0.1:9222',
                defaultViewport: null,
                timeout: 10000
            });
            
            console.log('✅ Connected to Chrome!');
            
            const pages = await browser.pages();
            const page = pages[0];
            
            if (!page) {
                console.log('No pages found, creating new page...');
                page = await browser.newPage();
            }
            
            // Navigate to profile
            console.log('Navigating to profile...');
            await page.goto('https://x.com/GlitchyGrade', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            await page.waitForTimeout(5000);
            
            // Scroll aggressively
            console.log('Loading all content...');
            for (let i = 0; i < 10; i++) {
                await page.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                });
                await page.waitForTimeout(1500);
            }
            
            // Count posts
            const stats = await page.evaluate(() => {
                const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                let retweets = 0;
                tweets.forEach(t => {
                    if (t.innerText.includes('You reposted') || t.innerText.includes('You retweeted')) {
                        retweets++;
                    }
                });
                return { total: tweets.length, retweets };
            });
            
            console.log(`\nFound: ${stats.total} posts (${stats.retweets} retweets)`);
            
            if (stats.retweets > 0) {
                console.log('Starting cleanup...\n');
                
                let sessionCleaned = 0;
                let noAction = 0;
                
                while (noAction < 10 && sessionCleaned < 100) {
                    try {
                        // Click retweet button
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
                                noAction = 0;
                                fs.writeFileSync('cleanup-progress.txt', totalCleaned.toString());
                                console.log(`✅ Total: ${totalCleaned} | Session: ${sessionCleaned}`);
                                await page.waitForTimeout(2000);
                                
                                if (totalCleaned % 25 === 0) {
                                    console.log('🔄 Refreshing...');
                                    await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
                                    await page.waitForTimeout(3000);
                                }
                            } else {
                                await page.keyboard.press('Escape');
                                noAction++;
                            }
                        } else {
                            noAction++;
                            await page.evaluate(() => window.scrollBy(0, 500));
                            await page.waitForTimeout(1500);
                        }
                    } catch (e) {
                        noAction++;
                    }
                }
                
                console.log(`\n✅ Cleaned ${sessionCleaned} in this session`);
                console.log(`📊 Total all-time: ${totalCleaned}`);
            } else {
                console.log('\n✅ No retweets found!');
            }
            
            browser.disconnect();
            break; // Success, exit loop
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            console.log('Waiting 5 seconds before retry...');
            await new Promise(r => setTimeout(r, 5000));
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 FINAL STATUS: ${totalCleaned} retweets cleaned total`);
    console.log('='.repeat(50));
}

// Run it
persistentCleanup().catch(console.error);