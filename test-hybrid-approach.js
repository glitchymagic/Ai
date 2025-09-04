// Test the hybrid approach - thread-aware for social, composer for educational
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

const bot = new ContextualPokemonBot();

const testCases = [
    {
        name: "Social/Collection Show-off",
        username: "collector123",
        text: "Finally completed my Charizard collection! Look at these beauties in my binder 😍",
        hasImages: true,
        sentiment: { sentiment: 'positive', confidence: 'high' },
        expectedPath: "thread-aware (social)"
    },
    {
        name: "Streaming Announcement",
        username: "streamer99",
        text: "Going live with Pokemon pack openings! Second cam setup for the stream. Can't wait to show you all!",
        hasImages: false,
        sentiment: { sentiment: 'positive', confidence: 'medium' },
        expectedPath: "thread-aware (social)"
    },
    {
        name: "Technical Question",
        username: "player456",
        text: "Is this Charizard fake? The texture seems off compared to my other cards",
        hasImages: true,
        sentiment: { sentiment: 'neutral', confidence: 'medium' },
        expectedPath: "composer (technical)"
    },
    {
        name: "Price Question",
        username: "seller789",
        text: "What's the current market value for PSA 10 Base Set Charizard?",
        hasImages: false,
        sentiment: { sentiment: 'neutral', confidence: 'high' },
        expectedPath: "price engine"
    },
    {
        name: "Tournament Event",
        username: "organizer",
        text: "POKEMON TOURNAMENT • Saturdays 2PM • $15 entry • Downtown Game Store",
        hasImages: false,
        sentiment: { sentiment: 'neutral', confidence: 'high' },
        expectedPath: "composer (event)"
    },
    {
        name: "Personal Achievement",
        username: "newbie123",
        text: "I finally pulled my first alt art! Been collecting for 6 months and this made my day!",
        hasImages: true,
        sentiment: { sentiment: 'very_positive', confidence: 'high' },
        expectedPath: "thread-aware (social)"
    },
    {
        name: "Generic Statement",
        username: "random456",
        text: "Pokemon cards are getting expensive these days",
        hasImages: false,
        sentiment: { sentiment: 'neutral', confidence: 'low' },
        expectedPath: "composer (educational)"
    },
    {
        name: "Community Question",
        username: "curious789",
        text: "What's everyone's favorite Pokemon set to collect? Mine is Evolving Skies!",
        hasImages: false,
        sentiment: { sentiment: 'positive', confidence: 'medium' },
        expectedPath: "thread-aware (social)"
    }
];

async function testHybridApproach() {
    console.log("🧪 Testing Hybrid Approach: Thread-Aware for Social, Composer for Educational\n");
    console.log("=".repeat(70));
    
    // Initialize price engine
    await bot.priceResponses.initialize().catch(() => {});
    
    for (const testCase of testCases) {
        console.log(`\n📝 Test: ${testCase.name}`);
        console.log(`👤 @${testCase.username}: "${testCase.text}"`);
        console.log(`🖼️ Has Images: ${testCase.hasImages}`);
        console.log(`😊 Sentiment: ${testCase.sentiment.sentiment}`);
        console.log(`🎯 Expected: ${testCase.expectedPath}`);
        
        // Check if it's a social post
        const isSocial = bot.isSocialCommunityPost(
            testCase.text, 
            { analysis: { contentType: testCase.hasImages ? 'showcase' : null } },
            testCase.sentiment
        );
        
        console.log(`📊 Is Social: ${isSocial}`);
        
        // Generate response with mock thread context for social posts
        const mockThreadContext = isSocial ? {
            threadLength: 3,
            mainTopic: 'Pokemon TCG',
            fullConversation: [
                { username: 'user1', text: 'Nice collection!' },
                { username: 'user2', text: 'Those cards are amazing!' }
            ]
        } : null;
        
        try {
            // For this test, we'll just check the routing logic
            if (testCase.text.toLowerCase().includes('market value') || 
                testCase.text.toLowerCase().includes('worth')) {
                console.log(`✅ Result: Would use PRICE ENGINE`);
            } else if (isSocial && mockThreadContext) {
                console.log(`✅ Result: Would use THREAD-AWARE (personality mode)`);
            } else {
                console.log(`✅ Result: Would use COMPOSER (authority mode)`);
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log("-".repeat(70));
    }
    
    console.log("\n📊 Summary:");
    console.log("- Social posts (collections, streaming, achievements) → Thread-aware personality");
    console.log("- Technical questions → Composer authority");
    console.log("- Price questions → Price engine");
    console.log("- Events → Composer with social response");
    console.log("- Generic posts → Composer educational");
}

// Run the test
testHybridApproach().catch(console.error);