const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('🎯 Interactive Helper');
    console.log('====================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const page = (await browser.pages())[0];
        
        console.log('📍 Current page:', page.url());
        
        // Check what tabs are available
        const tabs = await page.evaluate(() => {
            const tabElements = document.querySelectorAll('[role="tab"]');
            const tabs = [];
            tabElements.forEach(tab => {
                tabs.push({
                    text: tab.textContent,
                    selected: tab.getAttribute('aria-selected') === 'true'
                });
            });
            return tabs;
        });
        
        console.log('\n📑 Available tabs:');
        tabs.forEach(tab => {
            console.log(`  ${tab.selected ? '✓' : ' '} ${tab.text}`);
        });
        
        // Check if we need to click Posts tab
        const postsTab = tabs.find(t => t.text === 'Posts');
        if (postsTab && !postsTab.selected) {
            console.log('\n👆 Clicking Posts tab...');
            await page.evaluate(() => {
                const tab = [...document.querySelectorAll('[role="tab"]')].find(t => t.textContent === 'Posts');
                if (tab) tab.click();
            });
            await page.waitForTimeout(3000);
        }
        
        // Now create a semi-automated helper
        console.log('\n🤖 Semi-Automated Cleanup Helper');
        console.log('================================\n');
        console.log('Instructions:');
        console.log('1. Make sure you can see retweets on the page');
        console.log('2. This script will help click them\n');
        
        let total = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
        console.log(`📊 Current total: ${total}\n`);
        
        console.log('Press Ctrl+C to stop\n');
        
        // Helper loop
        while (true) {
            try {
                // Look for retweets
                const retweetInfo = await page.evaluate(() => {
                    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                    let found = null;
                    
                    for (let tweet of tweets) {
                        if (tweet.innerText && tweet.innerText.includes('reposted')) {
                            // Get position
                            const rect = tweet.getBoundingClientRect();
                            
                            // Find retweet button
                            const buttons = tweet.querySelectorAll('button');
                            for (let btn of buttons) {
                                const svg = btn.querySelector('svg path[d*="M4.75"]');
                                if (svg) {
                                    found = {
                                        text: tweet.innerText.substring(0, 50),
                                        y: rect.top + rect.height / 2
                                    };
                                    
                                    // Scroll it into view
                                    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    
                                    // Highlight it
                                    btn.style.border = '3px solid red';
                                    setTimeout(() => {
                                        btn.style.border = '';
                                        btn.click();
                                    }, 500);
                                    
                                    return found;
                                }
                            }
                        }
                    }
                    
                    return found;
                });
                
                if (retweetInfo) {
                    console.log(`\n🎯 Found: "${retweetInfo.text}..."`);
                    console.log('⏳ Waiting for menu...');
                    
                    await page.waitForTimeout(2000);
                    
                    // Click undo
                    const undone = await page.evaluate(() => {
                        const items = [...document.querySelectorAll('*')];
                        for (let item of items) {
                            if (item.textContent === 'Undo repost') {
                                item.style.border = '3px solid green';
                                setTimeout(() => {
                                    item.click();
                                }, 500);
                                return true;
                            }
                        }
                        return false;
                    });
                    
                    if (undone) {
                        total++;
                        fs.writeFileSync('cleanup-progress.txt', total.toString());
                        console.log(`✅ Cleaned! Total: ${total}`);
                        await page.waitForTimeout(3000);
                    } else {
                        console.log('❌ Undo not found, pressing Escape');
                        await page.keyboard.press('Escape');
                        await page.waitForTimeout(1000);
                    }
                } else {
                    // No retweets visible, scroll
                    console.log('📜 Scrolling to find more...');
                    await page.evaluate(() => {
                        window.scrollBy(0, 500);
                    });
                    await page.waitForTimeout(2000);
                }
                
            } catch (e) {
                console.log('⚠️ Error:', e.message);
                await page.keyboard.press('Escape').catch(() => {});
                await page.waitForTimeout(1000);
            }
        }
        
    } catch (error) {
        console.log('Error:', error.message);
    }
})();