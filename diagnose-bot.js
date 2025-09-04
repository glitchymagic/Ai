// Diagnostic script to check what's wrong with the bot
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function diagnoseBotIssues() {
    console.log('🔍 Diagnosing Pokemon Bot Issues\n');
    
    let browser, page;
    
    try {
        // Connect to Chrome
        console.log('1️⃣ Testing Chrome connection...');
        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        const pages = await browser.pages();
        page = pages[0];
        console.log('✅ Connected to Chrome\n');
        
        // Check current URL
        console.log('2️⃣ Checking current page...');
        const url = page.url();
        console.log(`📍 Current URL: ${url}`);
        if (!url.includes('x.com') && !url.includes('twitter.com')) {
            console.log('❌ Not on Twitter/X!');
            return;
        }
        console.log('✅ On Twitter/X\n');
        
        // Test search
        console.log('3️⃣ Testing search functionality...');
        await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        // Find search box
        const searchSelectors = [
            '[data-testid="SearchBox_Search_Input"]',
            'input[placeholder*="Search"]',
            '[aria-label="Search query"]',
            'input[type="search"]'
        ];
        
        let searchBox = null;
        for (const selector of searchSelectors) {
            searchBox = await page.$(selector);
            if (searchBox) {
                console.log(`✅ Found search box: ${selector}`);
                break;
            }
        }
        
        if (!searchBox) {
            console.log('❌ No search box found!\n');
            return;
        }
        
        // Try a search
        await searchBox.click();
        await page.keyboard.type('pokemon pulls', { delay: 100 });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
        
        console.log('✅ Search executed\n');
        
        // Check for tweets
        console.log('4️⃣ Checking for tweets...');
        const tweets = await page.$$('[data-testid="tweet"]');
        console.log(`📊 Found ${tweets.length} tweets`);
        
        if (tweets.length > 0) {
            // Sample first tweet
            const firstTweet = await tweets[0].evaluate(el => {
                const text = el.querySelector('[data-testid="tweetText"]')?.innerText || 'No text';
                const username = el.querySelector('[data-testid="User-Name"]')?.innerText || 'Unknown';
                return { username, text: text.substring(0, 100) };
            });
            console.log(`\n📝 First tweet sample:`);
            console.log(`   User: ${firstTweet.username}`);
            console.log(`   Text: ${firstTweet.text}...`);
        }
        
        // Test content filter
        console.log('\n5️⃣ Testing content filter...');
        const ContentFilter = require('./features/content-filter');
        const filter = new ContentFilter();
        
        const testCases = [
            { text: 'Check out my Charizard pulls!', username: 'testuser' },
            { text: 'Pokemon cards for sale DM me', username: 'testuser' },
            { text: 'Just pulled an Umbreon VMAX!!!!!!!', username: 'testuser' },
            { text: 'My pokemon collection 🔥🔥🔥🔥🔥', username: 'testuser' }
        ];
        
        for (const test of testCases) {
            const result = filter.shouldEngageWithPost(test.text, test.username);
            console.log(`   "${test.text}"`);
            console.log(`   → ${result.engage ? '✅' : '❌'} ${result.reason}\n`);
        }
        
        // Test engagement selector
        console.log('6️⃣ Testing engagement selector...');
        const EngagementSelector = require('./features/engagement-selector');
        const selector = new EngagementSelector();
        
        const mockPost = {
            text: 'Just pulled a Charizard from Obsidian Flames!',
            username: 'pokefan123',
            hasImage: true
        };
        
        const decision = await selector.shouldEngageWithPost(null, mockPost);
        console.log(`   Mock post: "${mockPost.text}"`);
        console.log(`   Decision: ${decision.action} (${decision.reason})`);
        
        console.log('\n✅ Diagnostic complete!');
        
    } catch (error) {
        console.error('❌ Error during diagnosis:', error);
    }
}

diagnoseBotIssues().catch(console.error);