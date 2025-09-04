// Test video analysis capabilities
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

// Test cases for video content
const testCases = [
    {
        name: "🎥 Pack Opening Video",
        username: "PackRipper2000",
        text: "Opening a Paldea Evolved booster box! Let's see what we pull!",
        hasVideo: true,
        visualData: {
            hasVideo: true,
            hasImage: false,
            analysis: { contentType: 'video' },
            videoAnalysis: {
                analyzed: true,
                cards: [
                    {
                        name: "Iono Special Art",
                        set: "Paldea Evolved",
                        confidence: 0.85,
                        frameTimestamp: "00:00:05"
                    },
                    {
                        name: "Skeledirge ex",
                        set: "Paldea Evolved", 
                        confidence: 0.9,
                        frameTimestamp: "00:00:10"
                    }
                ],
                isPackOpening: true
            }
        }
    },
    {
        name: "📹 Collection Tour Video",
        username: "VintageCollector",
        text: "Quick tour of my Base Set collection!",
        hasVideo: true,
        visualData: {
            hasVideo: true,
            hasImage: false,
            analysis: { contentType: 'video' },
            videoAnalysis: {
                analyzed: true,
                cards: [
                    {
                        name: "Charizard",
                        set: "Base Set",
                        confidence: 0.95,
                        frameTimestamp: "00:00:01"
                    }
                ],
                isPackOpening: false
            }
        }
    },
    {
        name: "🎬 Tournament Coverage",
        username: "TCGTournaments",
        text: "Finals match starting now! Standard format championship",
        hasVideo: true,
        visualData: {
            hasVideo: true,
            hasImage: false,
            analysis: { contentType: 'video' },
            videoAnalysis: {
                analyzed: true,
                cards: [],
                isPackOpening: false
            }
        }
    },
    {
        name: "🎯 Pull Reveal Video",
        username: "LuckyPulls",
        text: "You won't believe what I just pulled!!!",
        hasVideo: true,
        visualData: {
            hasVideo: true,
            hasImage: false,
            analysis: { contentType: 'video' },
            videoAnalysis: {
                analyzed: true,
                cards: [
                    {
                        name: "Umbreon VMAX Alt Art",
                        set: "Evolving Skies",
                        confidence: 0.92,
                        frameTimestamp: "00:00:01"
                    }
                ],
                isPackOpening: true
            }
        }
    }
];

async function testVideoAnalysis() {
    console.log("🎥 Testing Video Analysis Capabilities\n");
    console.log("=".repeat(70));
    
    await bot.priceResponses.initialize().catch(() => {});
    
    for (const test of testCases) {
        console.log(`\n${test.name}`);
        console.log(`👤 @${test.username}: "${test.text}"`);
        console.log(`🎥 Video Analysis:`);
        
        const videoAnalysis = test.visualData.videoAnalysis;
        if (videoAnalysis) {
            console.log(`   - Analyzed: ${videoAnalysis.analyzed}`);
            console.log(`   - Cards found: ${videoAnalysis.cards?.length || 0}`);
            console.log(`   - Pack opening: ${videoAnalysis.isPackOpening ? 'Yes' : 'No'}`);
            
            if (videoAnalysis.cards?.length > 0) {
                videoAnalysis.cards.forEach(card => {
                    console.log(`   - ${card.name} from ${card.set} (at ${card.frameTimestamp})`);
                });
            }
        }
        
        try {
            // Test with video data
            const response = await bot.generateContextualResponse(
                test.username,
                test.text,
                false, // hasImages
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
            
            // Check if response mentions the specific cards found
            if (videoAnalysis?.cards?.length > 0) {
                const responseLower = response.toLowerCase();
                const mentionedCards = videoAnalysis.cards.filter(card => {
                    const parts = card.name.toLowerCase().split(/[&\s]+/);
                    return parts.some(part => part.length > 3 && responseLower.includes(part));
                });
                
                if (mentionedCards.length > 0) {
                    console.log(`✅ Mentioned cards: ${mentionedCards.map(c => c.name).join(', ')}`);
                } else {
                    console.log(`⚠️ No specific cards mentioned in response`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log("-".repeat(70));
    }
    
    console.log("\n📊 Expected Behaviors:");
    console.log("1. Pack opening videos should mention specific pulled cards");
    console.log("2. Collection videos should acknowledge the cards shown");
    console.log("3. Tournament videos shouldn't mention cards if none visible");
    console.log("4. Pull reveal videos should react to the specific card");
}

testVideoAnalysis().catch(console.error);