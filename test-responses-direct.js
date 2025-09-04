// Direct test of response generation with different post types
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

const bot = new ContextualPokemonBot();

// Mock visual data
const mockVisualShowcase = {
    analysis: { 
        contentType: 'showcase',
        hasCards: true,
        cardCount: 5
    },
    threadContext: {
        threadLength: 2,
        mainTopic: 'Pokemon cards',
        fullConversation: [
            { username: 'user1', text: 'Nice collection!' }
        ]
    }
};

const mockVisualTournament = {
    analysis: { 
        contentType: 'event_poster',
        subtypes: ['tournament_info']
    }
};

const testCases = [
    {
        name: "🎉 Social: Collection Achievement",
        username: "collector99",
        text: "Finally completed my entire Charizard collection! Took me 3 years but I did it! 🔥",
        hasImages: true,
        visualData: mockVisualShowcase,
        sentiment: { sentiment: 'very_positive', confidence: 'high' }
    },
    {
        name: "📺 Social: Streaming",
        username: "streamer123",
        text: "Going live now with Pokemon pack openings! Join me on Twitch for some Surging Sparks action!",
        hasImages: false,
        visualData: null,
        sentiment: { sentiment: 'positive', confidence: 'high' }
    },
    {
        name: "💰 Price Question: Moonbreon",
        username: "trader456",
        text: "What's the current price on a raw Moonbreon? Thinking of selling mine",
        hasImages: false,
        visualData: null,
        sentiment: { sentiment: 'neutral', confidence: 'medium' }
    },
    {
        name: "🎮 Tournament Event",
        username: "organizer789",
        text: "POKEMON TCG TOURNAMENT! This Saturday 2PM at GameStop downtown. $10 entry, prizes for top 8!",
        hasImages: true,
        visualData: mockVisualTournament,
        sentiment: { sentiment: 'neutral', confidence: 'high' }
    },
    {
        name: "🔍 Technical: Fake Card",
        username: "newbie123",
        text: "Is this Base Set Charizard real? The holo seems weird compared to pics online",
        hasImages: true,
        visualData: { analysis: { contentType: 'single_card' } },
        sentiment: { sentiment: 'neutral', confidence: 'medium' }
    },
    {
        name: "🎁 Social: Lucky Pull",
        username: "lucky777",
        text: "NO WAY! Just pulled the Pikachu alt art from my first pack! My hands are shaking!!!",
        hasImages: true,
        visualData: mockVisualShowcase,
        sentiment: { sentiment: 'very_positive', confidence: 'high' }
    },
    {
        name: "📚 Educational: Storage Question",
        username: "learner456",
        text: "What's the best way to store valuable Pokemon cards? Should I use toploaders or binders?",
        hasImages: false,
        visualData: null,
        sentiment: { sentiment: 'neutral', confidence: 'medium' }
    },
    {
        name: "🛒 Retail Alert",
        username: "hunter999",
        text: "Target just restocked Crown Zenith ETBs! They have like 20 on the shelf!",
        hasImages: false,
        visualData: null,
        sentiment: { sentiment: 'positive', confidence: 'high' }
    },
    {
        name: "🤝 Community Question",
        username: "social123",
        text: "What's everyone's favorite set to collect? I'm torn between Evolving Skies and Crown Zenith!",
        hasImages: false,
        visualData: null,
        sentiment: { sentiment: 'positive', confidence: 'medium' }
    },
    {
        name: "📸 Social: Mail Day",
        username: "mailday",
        text: "Mail day! Look at these beauties that just arrived! Can't wait to add them to my binder!",
        hasImages: true,
        visualData: mockVisualShowcase,
        sentiment: { sentiment: 'very_positive', confidence: 'high' }
    }
];

async function testDirectResponses() {
    console.log("🧪 Testing Direct Response Generation with Hybrid Approach\n");
    console.log("=" .repeat(80));
    
    // Initialize price engine
    await bot.priceResponses.initialize().catch(() => {});
    
    for (const test of testCases) {
        console.log(`\n${test.name}`);
        console.log(`👤 @${test.username}: "${test.text}"`);
        console.log(`🖼️ Has Images: ${test.hasImages}`);
        console.log(`😊 Sentiment: ${test.sentiment.sentiment}`);
        
        // Check if it's a social post
        const isSocial = bot.isSocialCommunityPost(
            test.text,
            test.visualData,
            test.sentiment
        );
        
        console.log(`📊 Is Social: ${isSocial ? 'YES' : 'NO'}`);
        
        try {
            // Inject sentiment into bot for this test
            bot.sentimentAnalyzer.analyzeSentiment = () => test.sentiment;
            
            const response = await bot.generateContextualResponse(
                test.username,
                test.text,
                test.hasImages,
                test.visualData
            );
            
            if (response) {
                console.log(`💬 Response: "${response}"`);
                console.log(`📏 Length: ${response.length} chars`);
                
                // Analyze response type
                if (response.includes('🔥') || response.includes('!') || 
                    response.toLowerCase().includes('congrats') || 
                    response.toLowerCase().includes('yo @')) {
                    console.log(`🎯 Style: Thread-aware (personality)`);
                } else if (response.includes('$') || response.includes('market')) {
                    console.log(`🎯 Style: Price engine`);
                } else if (response.includes('tournament') || response.includes('fun —')) {
                    console.log(`🎯 Style: Event response`);
                } else {
                    console.log(`🎯 Style: Composer (authority)`);
                }
            } else {
                console.log(`❌ No response generated (would skip)`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log("-".repeat(80));
    }
    
    console.log("\n📊 Summary:");
    console.log("- Social posts should use thread-aware personality");
    console.log("- Technical/educational posts should use composer authority");
    console.log("- Price questions should use price engine");
    console.log("- Events should get casual engagement");
}

testDirectResponses().catch(console.error);