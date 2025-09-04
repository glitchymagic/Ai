// Simple test for authority integration with mock data
const HotCardsTracker = require('./features/hot-cards-tracker');
const AuthorityResponseEngine = require('./features/authority-response-engine');
const MarketReporter = require('./features/market-reporter');

async function testAuthoritySimple() {
    console.log('🧪 Testing Authority Components with Mock Data...\n');
    
    // Test without price service (uses mock data)
    const hotCards = new HotCardsTracker(null);
    const authorityEngine = new AuthorityResponseEngine(hotCards);
    const marketReporter = new MarketReporter(hotCards);
    
    console.log('1️⃣ Testing hot cards tracker...');
    const moonbreon = hotCards.findCard('moonbreon');
    console.log('Found card:', moonbreon);
    
    const price = await hotCards.getCardPrice(moonbreon);
    console.log('Mock price data:', price);
    
    console.log('\n2️⃣ Testing authority response generation...');
    const priceContext = {
        cardName: 'Umbreon VMAX Alt Art',
        isPriceQuestion: true,
        isPriceRelated: true,
        tweetContent: 'How much is moonbreon worth?',
        username: 'testuser'
    };
    
    const priceResponse = await authorityEngine.generateAuthorityResponse(priceContext);
    console.log('Price response:', priceResponse);
    
    console.log('\n3️⃣ Testing pull response...');
    const pullContext = {
        cardName: 'Charizard UPC',
        isPriceQuestion: false,
        isPriceRelated: false,
        hasImages: true,
        tweetContent: 'Just pulled this!',
        username: 'testuser',
        sentiment: 'positive'
    };
    
    const pullResponse = await authorityEngine.generateAuthorityResponse(pullContext);
    console.log('Pull response:', pullResponse);
    
    console.log('\n4️⃣ Testing market insight...');
    const marketContext = {
        tweetContent: 'Whats hot in the market right now?',
        isPriceQuestion: false,
        isPriceRelated: true,
        username: 'testuser'
    };
    
    const marketResponse = await authorityEngine.generateAuthorityResponse(marketContext);
    console.log('Market response:', marketResponse);
    
    console.log('\n5️⃣ Testing top movers...');
    const movers = await hotCards.getTopMovers(3);
    console.log('Top gainers:', movers.gainers.map(g => 
        `${g.card.name}: $${g.currentPrice} (+${g.change.toFixed(1)}%)`
    ));
    console.log('Top losers:', movers.losers.map(l => 
        `${l.card.name}: $${l.currentPrice} (${l.change.toFixed(1)}%)`
    ));
    
    console.log('\n6️⃣ Testing market reporter...');
    // Test morning report
    const morningReport = await marketReporter.generateMorningReport();
    console.log('\nMorning Report:');
    console.log('---');
    console.log(morningReport);
    console.log('---');
    
    // Test prediction
    const prediction = await marketReporter.generateWeeklyPrediction();
    console.log('\nWeekly Prediction:');
    console.log('---');
    console.log(prediction || 'No prediction available');
    console.log('---');
    
    console.log('\n✅ Simple authority test complete!');
}

// Run the test
testAuthoritySimple().catch(console.error);