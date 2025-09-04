// Test event poster recognition
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

const bot = new ContextualPokemonBot();

// Override filters
bot.engagementSelector.shouldEngageWithPost = async () => ({
    action: 'engage',
    type: 'contextual',
    reason: 'forced_test'
});

bot.sentimentAnalyzer.shouldEngageWithSentiment = () => ({
    engage: true,
    reason: 'forced_test'
});

const testCases = [
    {
        name: "Event Poster (Collector's Cave style)",
        username: "CollectorsCave_",
        text: "September 13, 4pm! Are you ready?! $15 Entry Fee! All participants get a prize pack!",
        hasImages: true,
        visualData: {
            analysis: {
                contentType: 'event_poster',
                subtypes: ['tournament_info']
            },
            visionAnalysis: {
                isEventPoster: true,
                eventDescription: "Pokemon tournament poster with Chikorita mascot",
                cards: []
            }
        }
    },
    {
        name: "Actual Card Pull",
        username: "luckytrainer",
        text: "Just pulled this amazing Charizard!",
        hasImages: true,
        visualData: {
            analysis: {
                contentType: 'single_card'
            },
            visionAnalysis: {
                cards: [{
                    name: "Charizard",
                    set: "Base Set",
                    confidence: 0.95
                }]
            }
        }
    }
];

async function testEventDetection() {
    console.log("🧪 Testing Event Poster vs Card Detection\n");
    console.log("=".repeat(70));
    
    await bot.priceResponses.initialize().catch(() => {});
    
    for (const test of testCases) {
        console.log(`\n📝 ${test.name}`);
        console.log(`👤 @${test.username}: "${test.text}"`);
        
        try {
            const response = await bot.generateContextualResponse(
                test.username,
                test.text,
                test.hasImages,
                test.visualData
            );
            
            console.log(`💬 Bot Response: "${response}"`);
            
            // Check if response is appropriate
            if (test.visualData.visionAnalysis?.isEventPoster) {
                if (response.toLowerCase().includes('card') && !response.includes('tournament')) {
                    console.log(`❌ ERROR: Bot talked about cards for an event poster!`);
                } else {
                    console.log(`✅ Good: Bot recognized this as an event`);
                }
            } else if (test.visualData.visionAnalysis?.cards.length > 0) {
                const card = test.visualData.visionAnalysis.cards[0];
                if (response.includes(card.name)) {
                    console.log(`✅ Good: Bot mentioned ${card.name}`);
                } else {
                    console.log(`⚠️ Warning: Bot didn't mention the ${card.name} card`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log("-".repeat(70));
    }
    
    console.log("\n📊 Key Points:");
    console.log("- Event posters should trigger event responses");
    console.log("- Pokemon mascots on posters are NOT cards");
    console.log("- Only actual TCG cards should get card-specific responses");
}

testEventDetection().catch(console.error);