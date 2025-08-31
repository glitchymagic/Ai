// Test script to verify response quality with new composer system
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

// Mock some components we don't need for testing
const bot = new ContextualPokemonBot();

// Test cases
const testCases = [
    {
        name: "Event Post",
        username: "testuser",
        text: "POKÉMON TOURNAMENT • Tuesdays 6:00PM • $10 entry • Santa Fe Place Mall",
        hasImages: false
    },
    {
        name: "Price Question",
        username: "collector123", 
        text: "What's moonbreon worth these days? Thinking of selling mine",
        hasImages: false
    },
    {
        name: "Card Showcase",
        username: "pokefan",
        text: "Just pulled this amazing Charizard! Can't believe my luck!",
        hasImages: true
    },
    {
        name: "Retail/Restock",
        username: "hunter99",
        text: "Target just restocked! They have Crown Zenith ETBs!",
        hasImages: false
    },
    {
        name: "Generic Post",
        username: "randomuser",
        text: "Love collecting Pokemon cards, it's such a fun hobby",
        hasImages: false
    }
];

async function testResponses() {
    console.log("Testing Response Quality with New Composer System\n");
    console.log("=".repeat(50));
    
    // Initialize what we can
    await bot.priceResponses.initialize().catch(() => {});
    
    for (const testCase of testCases) {
        console.log(`\n📝 Test: ${testCase.name}`);
        console.log(`👤 User: @${testCase.username}`);
        console.log(`💬 Tweet: "${testCase.text}"`);
        console.log(`🖼️ Has Images: ${testCase.hasImages}`);
        
        try {
            const response = await bot.generateContextualResponse(
                testCase.username,
                testCase.text,
                testCase.hasImages
            );
            
            console.log(`✅ Response: "${response || '[No response - would skip]'}"`);
            
            if (response) {
                console.log(`📏 Length: ${response.length} chars`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log("-".repeat(50));
    }
}

// Run tests
testResponses().catch(console.error);