// Navigate to X and prepare for bot
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function navigateToX() {
    try {
        console.log('🌐 Navigating to X.com...\n');
        
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();
        
        console.log('📍 Going to X.com...');
        await page.goto('https://x.com', { waitUntil: 'networkidle2' });
        
        console.log('⏳ Waiting for page to load...');
        await page.waitForTimeout(5000);
        
        const url = page.url();
        const title = await page.title();
        
        console.log(`\n✅ Navigation complete!`);
        console.log(`📍 Current URL: ${url}`);
        console.log(`📄 Page title: ${title}`);
        
        // Check if we need to log in
        const needsLogin = await page.evaluate(() => {
            const loginButton = document.querySelector('a[href="/login"], a[data-testid="loginButton"]');
            return !!loginButton;
        });
        
        if (needsLogin) {
            console.log('\n⚠️ You need to log in to X manually!');
            console.log('Please log in and then run the bot.');
        } else {
            console.log('\n✅ Ready for bot! Run: node pokemon-bot-contextual.js');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

navigateToX().catch(console.error);