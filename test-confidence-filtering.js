// Test confidence filtering and validation improvements
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

// Test cases with various confidence levels
const testCases = [
    {
        name: "🎯 Low Confidence Video (Gloom example)",
        username: "acorntcg",
        text: "Do you like this hit we pulled from Paradox Rift? #pokemontcg",
        hasVideo: true,
        visualData: {
            hasVideo: true,
            hasImage: false,
            analysis: { contentType: 'video' },
            videoAnalysis: {
                analyzed: true,
                cards: [], // Should be empty after filtering
                lowConfidenceCards: [
                    {
                        name: "Gloom",
                        set: "Not visible",
                        confidence: 0.7, // Below 0.85 threshold
                        frameTimestamp: 1
                    }
                ],
                isPackOpening: true
            }
        }
    },
    {
        name: "✅ High Confidence Video",
        username: "PackMaster",
        text: "Just pulled this from Evolving Skies! #PokemonTCG",
        hasVideo: true,
        visualData: {
            hasVideo: true,
            hasImage: false,
            analysis: { contentType: 'video' },
            videoAnalysis: {
                analyzed: true,
                cards: [
                    {
                        name: "Umbreon VMAX",
                        set: "Evolving Skies",
                        confidence: 0.92, // Above threshold
                        frameTimestamp: 5
                    }
                ],
                lowConfidenceCards: [],
                isPackOpening: true
            }
        }
    },
    {
        name: "⚠️ Mixed Confidence Image",
        username: "CollectorJoe",
        text: "My latest pickups!",
        hasImage: true,
        visualData: {
            hasImage: true,
            hasVideo: false,
            analysis: { contentType: 'showcase' },
            visionAnalysis: {
                analyzed: true,
                cards: [
                    {
                        name: "Charizard",
                        set: "Base Set",
                        confidence: 0.85 // Above image threshold
                    }
                ],
                lowConfidenceCards: [
                    {
                        name: "Energy",
                        set: "Unknown",
                        confidence: 0.5 // Generic card, low confidence
                    }
                ]
            }
        }
    },
    {
        name: "🚫 Generic Misidentification",
        username: "TCGPlayer",
        text: "Opening Paradox Rift packs!",
        hasVideo: true,
        visualData: {
            hasVideo: true,
            hasImage: false,
            analysis: { contentType: 'video' },
            videoAnalysis: {
                analyzed: true,
                cards: [], // Filtered out
                lowConfidenceCards: [
                    {
                        name: "Trainer",
                        set: "Unknown",
                        confidence: 0.8 // Generic name
                    },
                    {
                        name: "Basic Energy",
                        set: "Unknown",
                        confidence: 0.9 // Generic despite high confidence
                    }
                ],
                isPackOpening: true
            }
        }
    }
];

async function testConfidenceFiltering() {
    console.log("🔍 Testing Confidence Filtering & Validation\n");
    console.log("=".repeat(70));
    
    await bot.priceResponses.initialize().catch(() => {});
    
    for (const test of testCases) {
        console.log(`\n${test.name}`);
        console.log(`👤 @${test.username}: "${test.text}"`);
        console.log(`📊 Analysis:`);
        
        const analysis = test.visualData.visionAnalysis || test.visualData.videoAnalysis;
        if (analysis) {
            console.log(`   - High-confidence cards: ${analysis.cards?.length || 0}`);
            console.log(`   - Low-confidence filtered: ${analysis.lowConfidenceCards?.length || 0}`);
            
            if (analysis.cards?.length > 0) {
                analysis.cards.forEach(card => {
                    console.log(`   ✅ ${card.name} (${(card.confidence * 100).toFixed(0)}% confidence)`);
                });
            }
            
            if (analysis.lowConfidenceCards?.length > 0) {
                analysis.lowConfidenceCards.forEach(card => {
                    console.log(`   ❌ ${card.name} (${(card.confidence * 100).toFixed(0)}% confidence) - filtered`);
                });
            }
        }
        
        try {
            const response = await bot.generateContextualResponse(
                test.username,
                test.text,
                test.hasImage || false,
                test.visualData
            );
            
            console.log(`\n💬 Bot Response: "${response}"`);
            
            // Check if response appropriately handles confidence levels
            const responseLower = response.toLowerCase();
            
            // Should not mention low-confidence cards
            if (analysis?.lowConfidenceCards?.length > 0) {
                const mentionedFiltered = analysis.lowConfidenceCards.some(card => {
                    const parts = card.name.toLowerCase().split(/[&\s]+/);
                    return parts.some(part => part.length > 3 && responseLower.includes(part));
                });
                
                if (mentionedFiltered) {
                    console.log(`❌ ERROR: Response mentioned filtered low-confidence cards!`);
                } else {
                    console.log(`✅ Correctly avoided mentioning low-confidence cards`);
                }
            }
            
            // Should mention high-confidence cards
            if (analysis?.cards?.length > 0) {
                const mentionedCards = analysis.cards.filter(card => {
                    const parts = card.name.toLowerCase().split(/[&\s]+/);
                    return parts.some(part => part.length > 3 && responseLower.includes(part));
                });
                
                if (mentionedCards.length > 0) {
                    console.log(`✅ Mentioned high-confidence cards: ${mentionedCards.map(c => c.name).join(', ')}`);
                } else {
                    console.log(`⚠️ Did not mention high-confidence cards`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log("-".repeat(70));
    }
    
    console.log("\n📊 Expected Behaviors:");
    console.log("1. Low confidence cards (< 85% for video, < 75% for images) should be filtered");
    console.log("2. Generic card names should be filtered regardless of confidence");
    console.log("3. Bot should only mention high-confidence, validated cards");
    console.log("4. When no high-confidence cards found, use generic responses");
}

testConfidenceFiltering().catch(console.error);