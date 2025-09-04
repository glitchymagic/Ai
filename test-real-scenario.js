// Test with real-world scenario similar to Collector's Cave
const puppeteer = require('puppeteer');
const VisualAnalyzer = require('./features/visual-analyzer');
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

async function testRealScenario() {
    console.log("🧪 Testing Real-World Scenario: Event Poster vs Card\n");
    console.log("=".repeat(70));
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Enable vision API
    process.env.ENABLE_VISION_API = 'true';
    
    const bot = new ContextualPokemonBot();
    const visualAnalyzer = new VisualAnalyzer(page, { enableVisionAPI: true });
    
    await bot.priceResponses.initialize().catch(() => {});
    
    // Test scenarios matching real tweets
    const scenarios = [
        {
            name: "Collector's Cave Event Poster",
            username: "CollectorsCave_",
            text: "September 13, 4pm! Are you ready?! 15$ Entry Fee! All participants get a prize pack! Store credit for top three players!",
            imageUrl: "https://pbs.twimg.com/media/GXKt5XYWIAAl0Yt?format=jpg&name=medium", // Example event poster
            expectedBehavior: "Should NOT mention any Pokemon cards, should engage about the tournament"
        },
        {
            name: "Actual Card Showcase",
            username: "trainer123",
            text: "Check out my latest pulls from Crown Zenith!",
            imageUrl: "https://images.pokemontcg.io/swsh12pt5/159_hires.png", // Actual card
            expectedBehavior: "Should identify and comment on the specific Pokemon card"
        }
    ];
    
    for (const scenario of scenarios) {
        console.log(`\n📝 Testing: ${scenario.name}`);
        console.log(`👤 @${scenario.username}: "${scenario.text}"`);
        console.log(`🔗 Image URL: ${scenario.imageUrl}`);
        console.log(`📋 Expected: ${scenario.expectedBehavior}`);
        
        try {
            // Create a test page with the tweet
            await page.goto(`data:text/html,
                <html>
                <body>
                    <div data-testid="tweetText">${scenario.text}</div>
                    <img src="${scenario.imageUrl}" alt="Image">
                </body>
                </html>
            `);
            
            // Wait for image to load
            await page.waitForSelector('img', { timeout: 5000 });
            
            // Get the tweet element
            const tweetElement = await page.$('body');
            
            // Analyze with vision
            console.log("\n🔍 Running Visual Analysis...");
            const visualData = await visualAnalyzer.analyzeVisualContent(tweetElement);
            
            // Log what was detected
            console.log("\n📊 Visual Analysis Results:");
            console.log(`- Has Image: ${visualData?.hasImage}`);
            console.log(`- Vision Enabled: ${visualAnalyzer.enableVisionAPI}`);
            
            if (visualData?.visionAnalysis) {
                console.log(`- Analysis Completed: ${visualData.visionAnalysis.analyzed}`);
                console.log(`- Is Event Poster: ${visualData.visionAnalysis.isEventPoster || false}`);
                console.log(`- Cards Found: ${visualData.visionAnalysis.cards?.length || 0}`);
                
                if (visualData.visionAnalysis.isEventPoster) {
                    console.log(`- Event Description: ${visualData.visionAnalysis.eventDescription}`);
                }
                
                if (visualData.visionAnalysis.cards?.length > 0) {
                    visualData.visionAnalysis.cards.forEach(card => {
                        console.log(`- Card: ${card.name} (${card.set || 'Unknown set'})`);
                    });
                }
            }
            
            // Generate response
            console.log("\n💬 Generating Bot Response...");
            const response = await bot.generateContextualResponse(
                scenario.username,
                scenario.text,
                true,
                visualData
            );
            
            console.log(`🤖 Bot says: "${response}"`);
            
            // Validate response
            console.log("\n✅ Validation:");
            if (scenario.name.includes("Event Poster")) {
                // For event posters
                if (response.toLowerCase().includes('card') && 
                    !response.toLowerCase().includes('tournament') && 
                    !response.toLowerCase().includes('prize')) {
                    console.log("❌ FAIL: Bot mentioned cards for an event poster!");
                } else if (response.toLowerCase().includes('unknown') || 
                          response.toLowerCase().includes('chikorita')) {
                    console.log("❌ FAIL: Bot identified poster mascot as a card!");
                } else {
                    console.log("✅ PASS: Bot correctly handled event poster");
                }
            } else {
                // For actual cards
                if (visualData?.visionAnalysis?.cards?.length > 0) {
                    const card = visualData.visionAnalysis.cards[0];
                    if (response.toLowerCase().includes(card.name.toLowerCase())) {
                        console.log("✅ PASS: Bot correctly identified the card");
                    } else {
                        console.log("⚠️ WARNING: Bot didn't mention the specific card");
                    }
                }
            }
            
        } catch (error) {
            console.log(`\n❌ Error: ${error.message}`);
            console.log(error.stack);
        }
        
        console.log("\n" + "-".repeat(70));
    }
    
    await browser.close();
    
    console.log("\n📊 Summary:");
    console.log("The bot should now:");
    console.log("1. Correctly identify event posters and NOT comment on mascot Pokemon");
    console.log("2. Properly identify actual Pokemon cards and comment on them specifically");
    console.log("3. Generate appropriate responses for each type of content");
}

testRealScenario().catch(console.error);