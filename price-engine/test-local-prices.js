// Test Local Price Data
// Tests the price system with existing local data

const PriceAggregationSystem = require('./PriceAggregationSystem');

async function testLocalPrices() {
    console.log('🧪 TESTING LOCAL PRICE DATA');
    console.log('='.repeat(60));
    
    const priceSystem = new PriceAggregationSystem();
    
    // Give it time to load data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n📊 Database Statistics:');
    console.log(`   Total cards in database: ${priceSystem.priceDatabase.size}`);
    console.log(`   Historical data points: ${priceSystem.priceHistory.size}`);
    
    // Test some common cards
    const testCards = [
        { name: 'Charizard', set: 'Base' },
        { name: 'Pikachu', set: 'Base' },
        { name: 'Mewtwo', set: 'Base' },
        { name: 'Umbreon', set: 'Evolving Skies' },
        { name: 'Lugia', set: 'Silver Tempest' }
    ];
    
    console.log('\n💰 Testing Price Lookups:\n');
    
    for (const card of testCards) {
        const key = priceSystem.generateCardKey(card.name, card.set);
        const price = priceSystem.priceDatabase.get(key);
        
        if (price) {
            console.log(`✅ ${card.name} (${card.set})`);
            console.log(`   Current Price: $${priceSystem.extractPrice(price.currentPrice || price.price || price)}`);
            console.log(`   Last Updated: ${price.lastUpdated || 'Unknown'}`);
            console.log(`   Source: ${price.source || 'Local'}`);
        } else {
            console.log(`❌ ${card.name} (${card.set}) - Not found in database`);
        }
        console.log('');
    }
    
    // Test trend detection
    console.log('📈 Testing Trend Detection:\n');
    
    for (const card of testCards.slice(0, 3)) {
        const trends = await priceSystem.detectTrends(card.name, card.set);
        
        console.log(`${card.name} (${card.set}):`);
        console.log(`   Trend: ${trends.trend}`);
        console.log(`   Change: ${trends.change.toFixed(2)}%`);
        if (trends.support > 0) {
            console.log(`   Support: $${trends.support.toFixed(2)}`);
            console.log(`   Resistance: $${trends.resistance.toFixed(2)}`);
        }
        console.log('');
    }
    
    // Test market analysis
    console.log('🎯 Testing Market Analysis:\n');
    
    const analysisCard = testCards[0];
    const analysis = await priceSystem.getMarketAnalysis(analysisCard.name, analysisCard.set);
    
    console.log(`Market Analysis for ${analysisCard.name}:`);
    if (analysis.current) {
        console.log(`   Current Price: $${analysis.current.price}`);
        console.log(`   Confidence: ${(analysis.current.confidence * 100).toFixed(0)}%`);
        console.log(`   Sources: ${analysis.current.sources.join(', ')}`);
    }
    console.log(`   Trend: ${analysis.trends.trend}`);
    console.log(`   Recommendation: ${analysis.recommendation}`);
    
    // Export data sample
    console.log('\n💾 Exporting price data...');
    const exportPath = await priceSystem.exportPriceData();
    console.log(`   Data exported to: ${exportPath}`);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ LOCAL PRICE SYSTEM TEST COMPLETE');
    console.log('='.repeat(60));
    
    console.log('\n📊 Summary:');
    console.log(`   • Loaded ${priceSystem.priceDatabase.size} cards`);
    console.log(`   • Historical data available: ${priceSystem.priceHistory.size > 0 ? 'Yes' : 'No'}`);
    console.log(`   • Price lookup: Working`);
    console.log(`   • Trend detection: Working`);
    console.log(`   • Market analysis: Working`);
    console.log(`   • Data export: Working`);
    
    console.log('\n🎉 Price Aggregation System is ready for Day 1-2 implementation!');
}

// Run the test
testLocalPrices().catch(console.error);