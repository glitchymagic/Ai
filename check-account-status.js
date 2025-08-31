const puppeteer = require('puppeteer-extra');

async function checkAccountStatus() {
    console.log('🔍 Checking account status...\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        console.log('Current URL:', page.url());
        console.log('Page title:', await page.title());
        
        // Try to navigate to home
        console.log('\nNavigating to home...');
        await page.goto('https://x.com/home', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        // Check if we can see the compose tweet button
        const composeButton = await page.$('[data-testid="SideNav_NewTweet_Button"]');
        if (composeButton) {
            console.log('✅ Can see compose tweet button - account is active!');
            
            // Try to get the username
            const profileLink = await page.$('[data-testid="AppTabBar_Profile_Link"]');
            if (profileLink) {
                const href = await profileLink.evaluate(el => el.href);
                const username = href.split('/').pop();
                console.log(`✅ Logged in as: @${username}`);
            }
        } else {
            console.log('❌ Cannot see compose button - might be suspended');
        }
        
        // Check for suspension message
        const suspensionText = await page.evaluate(() => {
            return document.body.innerText.includes('Account suspended');
        });
        
        if (suspensionText) {
            console.log('❌ SUSPENSION MESSAGE DETECTED');
        } else {
            console.log('✅ No suspension message found');
        }
        
        // Try to navigate directly to the profile
        console.log('\nTrying direct profile navigation...');
        await page.goto('https://x.com/GlitchyGrade', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        const finalUrl = page.url();
        console.log('Final URL:', finalUrl);
        
        if (finalUrl.includes('suspended')) {
            console.log('❌ Profile redirects to suspended page');
        } else if (finalUrl.includes('GlitchyGrade')) {
            console.log('✅ Profile loads correctly');
        }
        
        browser.disconnect();
    } catch (error) {
        console.log('Error:', error.message);
    }
}

checkAccountStatus();