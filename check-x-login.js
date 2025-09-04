// Check if logged into X
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function checkLogin() {
    try {
        console.log('🔍 Checking X login status...\n');
        
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        console.log(`📄 Found ${pages.length} pages\n`);
        
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const url = page.url();
            const title = await page.title();
            
            console.log(`Page ${i + 1}:`);
            console.log(`  URL: ${url}`);
            console.log(`  Title: ${title}`);
            
            if (url.includes('x.com') || url.includes('twitter.com')) {
                console.log('  ✅ X/Twitter page found!\n');
                
                // Check if logged in by looking for key elements
                const isLoggedIn = await page.evaluate(() => {
                    // Check for compose tweet button
                    const composeButton = document.querySelector('a[href="/compose/post"], a[href="/compose/tweet"]');
                    // Check for home timeline
                    const homeTimeline = document.querySelector('[data-testid="primaryColumn"]');
                    // Check for user avatar
                    const userAvatar = document.querySelector('div[data-testid="SideNav_AccountSwitcher_Button"]');
                    
                    return {
                        hasComposeButton: !!composeButton,
                        hasHomeTimeline: !!homeTimeline,
                        hasUserAvatar: !!userAvatar,
                        currentUrl: window.location.href
                    };
                });
                
                console.log('  Login status:');
                console.log(`    Compose button: ${isLoggedIn.hasComposeButton ? '✅' : '❌'}`);
                console.log(`    Home timeline: ${isLoggedIn.hasHomeTimeline ? '✅' : '❌'}`);
                console.log(`    User avatar: ${isLoggedIn.hasUserAvatar ? '✅' : '❌'}`);
                console.log(`    Current URL: ${isLoggedIn.currentUrl}`);
                
                if (isLoggedIn.hasComposeButton || isLoggedIn.hasUserAvatar) {
                    console.log('\n✅ You are logged into X!');
                    
                    // Navigate to home if not there
                    if (!isLoggedIn.currentUrl.includes('/home')) {
                        console.log('\n📍 Navigating to home...');
                        await page.goto('https://x.com/home', { waitUntil: 'networkidle2' });
                    }
                } else {
                    console.log('\n❌ Not logged in! Please log in manually.');
                }
            }
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkLogin().catch(console.error);