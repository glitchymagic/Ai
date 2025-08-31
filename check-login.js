const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        let xPage = null;
        
        for (const page of pages) {
            const url = page.url();
            if (url.includes('x.com') || url.includes('twitter.com')) {
                xPage = page;
                console.log('Found X.com tab:', url);
                
                const isLoggedIn = await page.evaluate(() => {
                    return document.querySelector('a[href="/compose/post"]') !== null ||
                           document.querySelector('a[href="/home"]') !== null;
                });
                
                if (isLoggedIn) {
                    console.log('✅ Logged in to @GlitchyGrade');
                    console.log('✅ Ready to launch the bot!');
                } else {
                    console.log('❌ Not logged in - Please login to @GlitchyGrade first');
                }
                break;
            }
        }
        
        if (!xPage) {
            console.log('❌ No X.com tab open - Please:');
            console.log('1. Open a new tab in the Chrome debug browser');
            console.log('2. Go to x.com');
            console.log('3. Login to @GlitchyGrade');
        }
        
        browser.disconnect();
    } catch (error) {
        console.log('Error:', error.message);
        if (error.message.includes('connect')) {
            console.log('Chrome not running with debug port!');
            console.log('Run: open -a "Google Chrome" --args --remote-debugging-port=9222');
        }
    }
})();