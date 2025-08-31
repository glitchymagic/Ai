const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function simpleContinue() {
    console.log('🔄 Simple Continue Cleanup');
    console.log('=========================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        let page = pages[0];
        
        // If no page or wrong page, navigate
        if (!page || !page.url().includes('x.com')) {
            console.log('Navigating to profile...');
            page = pages[0] || await browser.newPage();
            await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
            await page.waitForTimeout(5000);
        }
        
        console.log('✅ Connected and ready\n');
        
        // Load progress
        let totalCleaned = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
        console.log(`📊 Continuing from: ${totalCleaned} retweets already cleaned\n`);
        
        let cleaned = 0;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            attempts++;
            
            try {
                // Wait a bit before each attempt
                await page.waitForTimeout(1000);
                
                // Find and click retweet button
                const clicked = await page.evaluate(() => {
                    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                    
                    for (let tweet of tweets) {
                        const text = tweet.innerText || '';
                        if (text.includes('You reposted') || text.includes('You retweeted')) {
                            // Find the retweet button
                            const buttons = tweet.querySelectorAll('button');
                            for (let button of buttons) {
                                const svg = button.querySelector('svg');
                                if (svg) {
                                    const path = svg.querySelector('path');
                                    if (path && path.getAttribute('d') && path.getAttribute('d').includes('M4.75 3.79l4.603')) {
                                        button.click();
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                    return false;
                }).catch(() => false);
                
                if (clicked) {
                    await page.waitForTimeout(1500);
                    
                    // Click undo
                    const undone = await page.evaluate(() => {
                        // Try multiple selectors
                        const selectors = [
                            '[role="menuitem"] span:contains("Undo repost")',
                            '[role="menuitem"]:contains("Undo repost")',
                            'span:contains("Undo repost")',
                            'div[role="menuitem"]'
                        ];
                        
                        // First try role="menuitem"
                        const menuItems = document.querySelectorAll('[role="menuitem"]');
                        for (let item of menuItems) {
                            if (item.textContent && item.textContent.includes('Undo repost')) {
                                item.click();
                                return true;
                            }
                        }
                        
                        // Then try any span
                        const spans = document.querySelectorAll('span');
                        for (let span of spans) {
                            if (span.textContent === 'Undo repost' || span.textContent === 'Undo Retweet') {
                                span.click();
                                return true;
                            }
                        }
                        
                        return false;
                    }).catch(() => false);
                    
                    if (undone) {
                        cleaned++;
                        totalCleaned++;
                        fs.writeFileSync('cleanup-progress.txt', totalCleaned.toString());
                        console.log(`✅ Total cleaned: ${totalCleaned} | This session: ${cleaned}`);
                        await page.waitForTimeout(2000);
                    } else {
                        // Close menu
                        await page.keyboard.press('Escape').catch(() => {});
                    }
                } else {
                    // Scroll to load more
                    if (attempts % 5 === 0) {
                        console.log('Scrolling...');
                        await page.evaluate(() => {
                            window.scrollBy(0, 500);
                        }).catch(() => {});
                    }
                }
                
            } catch (err) {
                // Ignore errors and continue
                await page.keyboard.press('Escape').catch(() => {});
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(`✅ Session complete`);
        console.log(`   Total all-time: ${totalCleaned}`);
        console.log(`   Cleaned this session: ${cleaned}`);
        console.log('='.repeat(50));
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

simpleContinue();