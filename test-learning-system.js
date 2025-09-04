// Test script to demonstrate the learning system
const LearningEngine = require('./features/learning-engine');
const AdaptiveResponseGenerator = require('./features/adaptive-response-generator');

async function testLearningSystem() {
    console.log('🧪 Testing Pokemon Bot Learning System\n');
    
    const learningEngine = new LearningEngine();
    const adaptiveGenerator = new AdaptiveResponseGenerator(learningEngine);
    
    // Simulate interactions with different users
    console.log('1️⃣ Simulating user interactions...\n');
    
    // User 1: Casual collector
    await learningEngine.learnFromInteraction({
        username: 'casualcollector',
        message: 'yo just pulled a moonbreon!! 🔥🔥',
        botResponse: 'Nice Umbreon VMAX pull!',
        hasImages: true,
        sentiment: 'positive',
        topics: ['moonbreon', 'umbreon vmax'],
        timestamp: Date.now()
    });
    
    // User 2: Formal investor
    await learningEngine.learnFromInteraction({
        username: 'investorpro',
        message: 'Could you please provide the current market value for Umbreon VMAX Alt Art?',
        botResponse: 'Umbreon VMAX Alt Art: $425 (stable)',
        hasImages: false,
        sentiment: 'neutral',
        topics: ['moonbreon', 'price'],
        timestamp: Date.now()
    });
    
    // User 3: Expert with multiple interactions
    for (let i = 0; i < 3; i++) {
        await learningEngine.learnFromInteraction({
            username: 'pokemonexpert',
            message: `PSA 10 moonbreon market analysis? Seeing movement at $${600 + i * 50}`,
            botResponse: `PSA 10 Moonbreon: $${650 + i * 50}. Pop report shows 342. Strong holder.`,
            hasImages: false,
            sentiment: 'neutral',
            topics: ['moonbreon', 'psa', 'grading', 'market'],
            timestamp: Date.now() - (i * 60000)
        });
    }
    
    // Show user profiles
    console.log('2️⃣ User Profiles Learned:\n');
    
    for (const [username, profile] of learningEngine.userProfiles) {
        console.log(`👤 @${username}:`);
        console.log(`   Interactions: ${profile.interactions}`);
        console.log(`   Formality: ${(profile.personality.formality * 100).toFixed(0)}%`);
        console.log(`   Price Awareness: ${(profile.personality.priceAwareness * 100).toFixed(0)}%`);
        console.log(`   Expertise: ${(profile.personality.expertise * 100).toFixed(0)}%`);
        console.log('');
    }
    
    // Generate adaptive responses
    console.log('3️⃣ Adaptive Responses for Each User:\n');
    
    const testContext = {
        isPriceQuestion: true,
        cardName: 'Umbreon VMAX Alt Art',
        priceData: {
            market: 425,
            low: 410,
            high: 440,
            trend: 5.2,
            volume24h: 23
        }
    };
    
    for (const username of ['casualcollector', 'investorpro', 'pokemonexpert']) {
        const response = await adaptiveGenerator.generateResponse(username, testContext);
        console.log(`Response for @${username}:`);
        console.log(`Style: ${response.strategy.style}`);
        console.log(`Response: "${response.response}"`);
        console.log('');
    }
    
    // Show market insights
    console.log('4️⃣ Market Intelligence Learned:\n');
    
    await learningEngine.learnFromMarketDiscussion(
        'Moonbreon hitting $450 soon, volume picking up 🚀',
        'traderguru'
    );
    
    await learningEngine.learnFromMarketDiscussion(
        'Giratina V Alt at $275 is a steal, way undervalued',
        'valuehunter'
    );
    
    const marketInsights = learningEngine.generateInsights().marketInsights;
    console.log(`Hot Cards: ${marketInsights.hotCards.join(', ') || 'Building data...'}`);
    
    // Show learning metrics
    console.log('\n5️⃣ Learning Metrics:\n');
    const insights = learningEngine.generateInsights();
    console.log(`Total Interactions: ${learningEngine.metrics.totalInteractions}`);
    console.log(`Patterns Learned: ${learningEngine.metrics.learnedPatterns}`);
    console.log(`Average User Formality: ${(insights.userInsights.avgFormality * 100).toFixed(0)}%`);
    
    // Save data
    console.log('\n💾 Saving learning data...');
    await learningEngine.saveLearningData();
    
    console.log('\n✅ Learning system test complete!');
    console.log('\nThe bot will now generate different responses based on each user\'s personality and preferences.');
}

// Run the test
testLearningSystem().catch(console.error);