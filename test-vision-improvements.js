// Test the vision improvements with problematic scenarios
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

const bot = new ContextualPokemonBot();

// Override filters for testing
bot.engagementSelector.shouldEngageWithPost = async () => ({
    action: 'engage',
    type: 'contextual',
    reason: 'forced_test'
});

bot.sentimentAnalyzer.shouldEngageWithSentiment = () => ({
    engage: true,
    reason: 'forced_test'
});

// Test cases that previously had issues
const testCases = [
    {
        name: "❌ Previous Issue: Pack Opening Promo (not a card)",
        username: "SnarlaxCollects",
        text: "Hey Guys! We're going to be ripping open a Destined Rivals ETB if we can get 500+ views",
        hasImages: true,
        visualData: {
            analysis: { contentType: 'showcase' },
            visionAnalysis: {
                analyzed: true,
                cards: [],  // NO CARDS DETECTED
                isEventPoster: false
            }
        }
    },
    {
        name: "✅ Correct: Actual Card (Gengar & Mimikyu GX)",
        username: "KisekiShintaro",
        text: "Showing off cards from my collection, here's my gengar card",
        hasImages: true,
        visualData: {
            analysis: { contentType: 'single_card' },
            visionAnalysis: {
                analyzed: true,
                cards: [{
                    name: "Gengar & Mimikyu GX",
                    set: "Team Up",
                    confidence: 0.9
                }]
            }
        }
    },
    {
        name: "🎯 Event Poster (not cards)",
        username: "CollectorsCave",
        text: "Pokemon Tournament Friday 4PM! $15 entry fee, prizes for all!",
        hasImages: true,
        visualData: {
            analysis: { contentType: 'event_poster' },
            visionAnalysis: {
                analyzed: true,
                cards: [],
                isEventPoster: true,
                eventDescription: "Tournament poster with Chikorita mascot"
            }
        }
    },
    {
        name: "🛍️ Product Image (not cards)",
        username: "pokemondeals",
        text: "Great deal on Pokemon TCG box sets at Target!",
        hasImages: true,
        visualData: {
            analysis: { contentType: 'showcase' },
            visionAnalysis: {
                analyzed: true,
                cards: [],
                isEventPoster: false
            }
        }
    }
];

async function testVisionImprovements() {
    console.log("🧪 Testing Vision Improvements\n");
    console.log("=".repeat(70));
    
    await bot.priceResponses.initialize().catch(() => {});
    
    for (const test of testCases) {
        console.log(`\n${test.name}`);
        console.log(`👤 @${test.username}: "${test.text}"`);
        console.log(`🔍 Vision Analysis:`);
        console.log(`   - Cards found: ${test.visualData.visionAnalysis.cards?.length || 0}`);
        if (test.visualData.visionAnalysis.cards?.length > 0) {
            test.visualData.visionAnalysis.cards.forEach(card => {
                console.log(`   - Card: ${card.name}`);
            });
        }
        if (test.visualData.visionAnalysis.isEventPoster) {
            console.log(`   - Type: Event Poster`);
        }
        
        try {
            const response = await bot.generateContextualResponse(
                test.username,
                test.text,
                test.hasImages,
                test.visualData
            );
            
            console.log(`\n💬 Bot Response: "${response}"`);
            
            // Validate the response
            const validator = bot.responseValidator;
            const validation = validator.validateResponse(response, test.visualData);
            
            if (validation.valid) {
                console.log(`✅ Response validation: PASSED`);
            } else {
                console.log(`❌ Response validation: FAILED`);
                validation.issues.forEach(issue => {
                    console.log(`   - ${issue.message}`);
                });
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log("-".repeat(70));
    }
    
    console.log("\n📊 Expected Improvements:");
    console.log("1. Pack opening promo should NOT mention cards");
    console.log("2. Gengar card should mention 'Gengar & Mimikyu GX' specifically");
    console.log("3. Event poster should focus on tournament, not cards");
    console.log("4. Product deals should talk about deals, not specific cards");
}

testVisionImprovements().catch(console.error);