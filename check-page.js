const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('🔍 Checking Page Status');
    console.log('======================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        console.log(`Found ${pages.length} pages/tabs open\n`);
        
        // Check each page
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const url = page.url();
            const title = await page.title();
            
            console.log(`Tab ${i + 1}:`);
            console.log(`  URL: ${url}`);
            console.log(`  Title: ${title}`);
            
            if (url.includes('x.com') || url.includes('twitter.com')) {
                // Check content
                const content = await page.evaluate(() => {
                    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                    const timeline = document.querySelector('[aria-label*="Timeline"]');
                    const loginButton = document.querySelector('a[href="/login"]');
                    
                    return {
                        tweetsCount: tweets.length,
                        hasTimeline: !!timeline,
                        needsLogin: !!loginButton,
                        bodyText: document.body.innerText.substring(0, 200)
                    };
                });
                
                console.log(`  Tweets visible: ${content.tweetsCount}`);
                console.log(`  Has timeline: ${content.hasTimeline}`);
                console.log(`  Needs login: ${content.needsLogin}`);
                console.log(`  Body preview: "${content.bodyText.replace(/\n/g, ' ').substring(0, 100)}..."`);
            }
            console.log('');
        }
        
        // Focus on first X/Twitter tab
        const twitterPage = pages.find(p => p.url().includes('x.com') || p.url().includes('twitter.com'));
        if (twitterPage) {
            console.log('Focusing on Twitter tab...\n');
            
            // Wait for content
            await twitterPage.waitForTimeout(3000);
            
            // Try to find retweets with more detailed info
            const retweetInfo = await twitterPage.evaluate(() => {
                const results = [];
                
                // Check all text nodes
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let node;
                while (node = walker.nextNode()) {
                    if (node.nodeValue && node.nodeValue.includes('reposted')) {
                        results.push({
                            text: node.nodeValue.trim(),
                            parent: node.parentElement?.tagName,
                            parentClass: node.parentElement?.className
                        });
                    }
                }
                
                return results.slice(0, 5); // First 5 matches
            });
            
            if (retweetInfo.length > 0) {
                console.log('Found repost indicators:');
                retweetInfo.forEach((info, i) => {
                    console.log(`  ${i + 1}. "${info.text}" in <${info.parent}> class="${info.parentClass}"`);
                });
            }
        }
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
})();