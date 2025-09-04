// Test visual awareness in thread-aware responses
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

const testCases = [
    {
        name: "Old Cards Found (with images)",
        username: "gordonrichie",
        text: "Found some old Pokemon Cards while cleaning. #Pokemon #PokemonTCG @Pokemon",
        hasImages: true,
        visualData: {
            analysis: {
                contentType: 'showcase',
                cardCount: 3,
                hasCards: true
            }
        }
    },
    {
        name: "Collection Display (with images)",
        username: "collector99",
        text: "Here's my vintage collection! Been collecting since 1999",
        hasImages: true,
        visualData: {
            analysis: {
                contentType: 'multiple_showcase',
                cardCount: 12
            }
        }
    },
    {
        name: "Single Card Pull (with image)",
        username: "luckypuller",
        text: "Can't believe I pulled this!",
        hasImages: true,
        visualData: {
            analysis: {
                contentType: 'single_card',
                subtypes: ['alt_art']
            }
        }
    },
    {
        name: "Cards Found (NO images)",
        username: "finder123",
        text: "Just found my old Pokemon cards in the attic!",
        hasImages: false,
        visualData: null
    }
];

async function testVisualAwareness() {
    console.log("🧪 Testing Visual Awareness in Thread-Aware Responses\n");
    console.log("=".repeat(70));
    
    await bot.priceResponses.initialize().catch(() => {});
    
    for (const test of testCases) {
        console.log(`\n📝 ${test.name}`);
        console.log(`👤 @${test.username}: "${test.text}"`);
        console.log(`🖼️ Has Images: ${test.hasImages}`);
        if (test.visualData?.analysis) {
            console.log(`📸 Visual Type: ${test.visualData.analysis.contentType}`);
            if (test.visualData.analysis.cardCount) {
                console.log(`🃏 Cards Shown: ${test.visualData.analysis.cardCount}`);
            }
        }
        
        const isSocial = bot.isSocialCommunityPost(
            test.text,
            test.visualData,
            { sentiment: 'positive', confidence: 'high' }
        );
        
        console.log(`📊 Is Social: ${isSocial ? 'YES' : 'NO'}`);
        
        try {
            const response = await bot.generateContextualResponse(
                test.username,
                test.text,
                test.hasImages,
                test.visualData
            );
            
            if (response) {
                console.log(`💬 Bot says: "${response}"`);
                
                // Check if bot asks what they found when images are present
                const asksWhatFound = response.toLowerCase().includes('whatcha find') || 
                                    response.toLowerCase().includes('what did you find') ||
                                    response.toLowerCase().includes('what\'d you find');
                
                if (test.hasImages && asksWhatFound) {
                    console.log(`❌ ERROR: Bot asks what user found despite images being present!`);
                } else if (test.hasImages && !asksWhatFound) {
                    console.log(`✅ Good: Bot acknowledges what's shown in images`);
                } else if (!test.hasImages && asksWhatFound) {
                    console.log(`✅ Good: Bot asks what was found (no images)`);
                }
            } else {
                console.log(`❌ No response generated`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log("-".repeat(70));
    }
    
    console.log("\n📊 Summary:");
    console.log("- Bot should NOT ask 'whatcha find?' when images are present");
    console.log("- Bot should comment on what's shown in the images");
    console.log("- Bot can ask what was found only when NO images are present");
}

testVisualAwareness().catch(console.error);