// Test script for authority integration
const { getAuthorityIntegration } = require('./features/authority-integration');

async function testAuthorityIntegration() {
    console.log('🧪 Testing Authority Integration...\n');
    
    const authority = getAuthorityIntegration();
    
    // Initialize the system
    console.log('1️⃣ Initializing authority systems...');
    await authority.initialize();
    
    // Test card context extraction
    console.log('\n2️⃣ Testing card context extraction...');
    const testTweet1 = "Just pulled a moonbreon! How much is it worth?";
    const context1 = authority.extractCardContext(testTweet1);
    console.log('Tweet:', testTweet1);
    console.log('Context:', JSON.stringify(context1, null, 2));
    
    // Test with visual data
    const visualData = {
        visionAnalysis: {
            analyzed: true,
            cards: [
                { name: 'Umbreon VMAX Alt Art', confidence: 0.95 }
            ]
        }
    };
    const context2 = authority.extractCardContext("Check out this pull!", visualData);
    console.log('\nTweet with visual: "Check out this pull!"');
    console.log('Context:', JSON.stringify(context2, null, 2));
    
    // Test response enhancement
    console.log('\n3️⃣ Testing response enhancement...');
    const originalResponse = "Nice Umbreon VMAX pull!";
    const enhancedResponse = await authority.enhanceResponse(originalResponse, context2);
    console.log('Original:', originalResponse);
    console.log('Enhanced:', enhancedResponse);
    
    // Test authority response generation
    console.log('\n4️⃣ Testing authority response generation...');
    if (authority.authorityEngine) {
        const authorityResponse = await authority.authorityEngine.generateAuthorityResponse(context2);
        console.log('Authority response:', authorityResponse);
    }
    
    // Test price lookup
    console.log('\n5️⃣ Testing price lookup for top cards...');
    const topCards = ['Moonbreon', 'Charizard UPC', 'Giratina V Alt Art'];
    for (const cardName of topCards) {
        const price = await authority.hotCards.getPriceByName(cardName);
        if (price) {
            console.log(`${cardName}: $${price.market} (${price.trend > 0 ? '+' : ''}${price.trend}%)`);
        }
    }
    
    // Test market statistics
    console.log('\n6️⃣ Testing market statistics...');
    const stats = await authority.getMarketStats();
    if (stats) {
        console.log('Top Gainers:', stats.topGainers.map(g => `${g.card.name} +${g.change.toFixed(1)}%`));
        console.log('Top Losers:', stats.topLosers.map(l => `${l.card.name} ${l.change.toFixed(1)}%`));
    }
    
    // Test original post generation
    console.log('\n7️⃣ Testing market report generation...');
    const shouldPost = authority.shouldPostOriginal();
    console.log('Should post original?', shouldPost);
    
    if (authority.marketReporter) {
        const reportType = authority.marketReporter.getNextReportType();
        console.log('Next report type:', reportType || 'none');
        
        // Force generate a morning report for testing
        const morningReport = await authority.marketReporter.generateMorningReport();
        console.log('\nSample Morning Report:');
        console.log('---');
        console.log(morningReport);
        console.log('---');
    }
    
    console.log('\n✅ Authority integration test complete!');
}

// Run the test
testAuthorityIntegration().catch(console.error);