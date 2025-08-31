const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function forceCleanProfile() {
    console.log('🧹 Force Clean Profile - Alternative Method');
    console.log('==========================================\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        console.log('This will hide all your old posts by making your account private temporarily.\n');
        console.log('Steps:');
        console.log('1. Go to Settings > Privacy');
        console.log('2. Enable "Protect your posts"');
        console.log('3. All old posts become hidden');
        console.log('4. Post new Pokemon content');
        console.log('5. Disable protection after a week\n');
        
        // Navigate to settings
        console.log('Opening settings...');
        await page.goto('https://x.com/settings/audience_and_tagging', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        console.log('\n✅ Settings page loaded');
        console.log('\n📝 Manual steps:');
        console.log('1. Look for "Protect your posts" toggle');
        console.log('2. Turn it ON (this hides all existing posts)');
        console.log('3. Click Save');
        console.log('4. Your profile is now clean!\n');
        
        console.log('After protecting your posts:');
        console.log('- Update bio to Pokemon theme');
        console.log('- Post 3 Pokemon tweets');
        console.log('- Wait a week');
        console.log('- Turn OFF protection');
        console.log('- All old content stays hidden, new content visible!\n');
        
        browser.disconnect();
        
    } catch (error) {
        console.log('Error:', error.message);
    }
}

// Alternative: Faster console method
console.log('🚀 FASTEST METHOD - Console Script:\n');
console.log('1. Press Cmd+Option+I to open console');
console.log('2. Go to your profile: https://x.com/GlitchyGrade');
console.log('3. Paste this in console:\n');

console.log(`
// Auto-undo all retweets
setInterval(() => {
    const retweets = [...document.querySelectorAll('[data-testid="unretweet"]')];
    if (retweets.length > 0) {
        retweets[0].click();
        setTimeout(() => {
            const confirm = document.querySelector('[data-testid="unretweetConfirm"]');
            if (confirm) confirm.click();
        }, 500);
    } else {
        window.scrollBy(0, 500);
    }
}, 2000);
`);

console.log('\n4. Let it run until all retweets are gone');
console.log('5. Refresh page when done\n');

forceCleanProfile();