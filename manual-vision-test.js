// Manual test to check specific types of posts
const puppeteer = require('puppeteer');

async function manualVisionTest() {
    console.log("🔍 Manual Vision Test - Finding Posts with Card Images\n");
    
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto('https://twitter.com/search?q=pokemon%20%22just%20pulled%22&f=live');
    
    console.log("📱 Opened Twitter search for 'pokemon just pulled'");
    console.log("👀 Please look for posts with actual card images");
    console.log("📸 Common patterns to find:");
    console.log("   - 'Just pulled this [card name]!'");
    console.log("   - 'Look at my pulls!'");
    console.log("   - 'Mail day!' with card photos");
    console.log("   - Collection showcases");
    console.log("\n✋ Keep browser open to manually check posts");
    console.log("🎯 Look for posts where bot might confuse mascots with cards");
    
    // Keep alive
    await new Promise(() => {});
}

manualVisionTest().catch(console.error);