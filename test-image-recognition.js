// Test actual image recognition with Gemini Vision API
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');
const puppeteer = require('puppeteer');

async function testImageRecognition() {
    console.log("🧪 Testing Real Image Recognition with Gemini Vision\n");
    console.log("=".repeat(70));
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    const bot = new ContextualPokemonBot();
    await bot.priceResponses.initialize().catch(() => {});
    
    // Initialize visual analyzer with page
    const VisualAnalyzer = require('./features/visual-analyzer');
    const visualAnalyzer = new VisualAnalyzer(page);
    
    // Test with a mock tweet element containing an image
    const testCases = [
        {
            name: "Test Pokemon Card Image",
            text: "Look at this amazing Charizard I just pulled!",
            imageUrl: "https://images.pokemontcg.io/base1/4_hires.png", // Base Set Charizard
            expectedCard: "Charizard"
        }
    ];
    
    for (const test of testCases) {
        console.log(`\n📝 ${test.name}`);
        console.log(`💬 Text: "${test.text}"`);
        console.log(`🖼️ Image: ${test.imageUrl}`);
        
        try {
            // Navigate to a page with the image
            await page.goto(`data:text/html,
                <html>
                <body>
                    <div data-testid="tweetText">${test.text}</div>
                    <img src="${test.imageUrl}" alt="Image">
                </body>
                </html>
            `);
            
            // Get the body element as our mock tweet
            const tweetElement = await page.$('body');
            
            // Test the visual analyzer
            const visualData = await visualAnalyzer.analyzeVisualContent(tweetElement);
            
            console.log(`\n📊 Visual Analysis Results:`);
            console.log(`- Has Image: ${visualData?.hasImage}`);
            console.log(`- Image Count: ${visualData?.imageCount}`);
            
            if (visualData?.visionAnalysis) {
                console.log(`- Vision Analysis: ${visualData.visionAnalysis.analyzed ? 'Success' : 'Failed'}`);
                if (visualData.visionAnalysis.error) {
                    console.log(`- Error: ${visualData.visionAnalysis.error}`);
                }
                console.log(`- Cards Found: ${visualData.visionAnalysis.cards.length}`);
                
                if (visualData.visionAnalysis.cards.length > 0) {
                    console.log(`\n🃏 Recognized Cards:`);
                    visualData.visionAnalysis.cards.forEach((card, i) => {
                        console.log(`  ${i + 1}. ${card.name} (${card.set || 'Unknown Set'})`);
                        console.log(`     - Rarity: ${card.rarity || 'Unknown'}`);
                        console.log(`     - Confidence: ${(card.confidence * 100).toFixed(0)}%`);
                    });
                }
            }
            
            // Test response generation with visual data
            const response = await bot.generateContextualResponse(
                "testuser",
                test.text,
                true,
                visualData
            );
            
            console.log(`\n💬 Bot Response: "${response}"`);
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            console.log(error.stack);
        }
        
        console.log("-".repeat(70));
    }
    
    await browser.close();
}

// Run the test
testImageRecognition().catch(console.error);