// Emergency fix - get the bot working again
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function emergencyFix() {
    console.log('🚨 Emergency Bot Fix\n');
    
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0];
        
        // Method 1: Direct URL search
        console.log('1️⃣ Testing direct URL search...');
        const searchQuery = 'pokemon pulls';
        const searchUrl = `https://x.com/search?q=${encodeURIComponent(searchQuery)}&f=live`;
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        // Check if we have tweets
        const tweets = await page.$$('[data-testid="tweet"]');
        console.log(`✅ Found ${tweets.length} tweets with direct URL method\n`);
        
        if (tweets.length > 0) {
            // Check first few tweets
            console.log('📝 First 3 tweets:');
            for (let i = 0; i < Math.min(3, tweets.length); i++) {
                const tweetData = await tweets[i].evaluate(el => {
                    const text = el.querySelector('[data-testid="tweetText"]')?.innerText || '';
                    const username = el.querySelector('a[href^="/"][dir="ltr"] span')?.innerText || '';
                    const time = el.querySelector('time')?.getAttribute('datetime') || '';
                    return { username, text: text.substring(0, 80), time };
                });
                
                console.log(`\n${i + 1}. @${tweetData.username}`);
                console.log(`   "${tweetData.text}..."`);
                console.log(`   Time: ${new Date(tweetData.time).toLocaleString()}`);
            }
        }
        
        // Method 2: Try hashtag search
        console.log('\n2️⃣ Testing hashtag search...');
        await page.goto('https://x.com/search?q=%23PokemonTCG&f=live', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        const hashtagTweets = await page.$$('[data-testid="tweet"]');
        console.log(`✅ Found ${hashtagTweets.length} tweets with #PokemonTCG\n`);
        
        // Update search method in bot
        console.log('3️⃣ Recommendation: Update bot to use direct URL navigation');
        console.log('   Instead of clicking search box, use:');
        console.log('   await page.goto(`https://x.com/search?q=${query}&f=live`)');
        
        console.log('\n✅ Emergency fix complete!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

emergencyFix().catch(console.error);