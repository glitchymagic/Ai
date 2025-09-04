// Test actual responses from hybrid approach
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

const bot = new ContextualPokemonBot();

// Mock visual data for social posts
const mockVisualData = {
    analysis: { contentType: 'showcase' },
    threadContext: {
        threadLength: 2,
        mainTopic: 'Pokemon cards',
        fullConversation: [
            { username: 'fan1', text: 'Wow amazing collection!' }
        ]
    }
};

const testCases = [
    {
        name: "Social: Binder Collection",
        username: "pokefan",
        text: "Here some of my poke cards from my favorite binder. I'm going to schedule a pokemon stream soon!",
        hasImages: true,
        visualData: mockVisualData
    },
    {
        name: "Technical: Fake Card Question",  
        username: "buyer123",
        text: "Is this Charizard authentic? The holo pattern looks different from my other cards",
        hasImages: true,
        visualData: null
    },
    {
        name: "Social: Pull Excitement",
        username: "lucky777",
        text: "I FINALLY PULLED MOONBREON! Been hunting this card for months!",
        hasImages: true,
        visualData: mockVisualData
    },
    {
        name: "Educational: General Question",
        username: "newbie",
        text: "What's the best way to store Pokemon cards long term?",
        hasImages: false,
        visualData: null
    }
];

async function testResponses() {
    console.log("🧪 Testing Actual Responses from Hybrid System\n");
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
            
            console.log(`💬 Response: "${response}"`);
            console.log(`📏 Length: ${response ? response.length : 0} chars`);
            
            // Check which path was used based on response style
            if (response && (response.includes('🔥') || response.includes('!') || 
                response.toLowerCase().includes('congrats') || 
                response.toLowerCase().includes('fire'))) {
                console.log(`🎯 Path: Thread-aware (personality mode)`);
            } else {
                console.log(`🎯 Path: Composer (authority mode)`);
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log("-".repeat(70));
    }
}

testResponses().catch(console.error);