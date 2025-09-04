// Test bot with searches more likely to find card images
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

async function testWithCardSearches() {
    console.log("🔍 Testing bot with card-focused searches\n");
    
    const bot = new ContextualPokemonBot();
    
    // Override search terms to find more card showcases
    const cardSearches = [
        "pokemon pulls",
        "pokemon collection", 
        "pulled charizard",
        "pokemon mail day",
        "pokemon binder"
    ];
    
    // Modify bot to use these searches
    bot.searchEngine.getHighActivitySearches = function() {
        const searches = [...cardSearches];
        // Rotate through searches
        const index = Math.floor(Date.now() / 60000) % searches.length;
        return [searches[index]];
    };
    
    // Lower engagement threshold to see more posts
    bot.engagementSelector.calculateEngagementScore = function(analysis) {
        let score = 0.8; // Higher base score
        if (analysis.hasImage) score += 0.3;
        return score;
    };
    
    console.log("🎯 Modified bot to:");
    console.log("- Search for terms more likely to find card images");
    console.log("- Lower threshold for engagement");
    console.log("- Focus on posts with images");
    
    console.log("\n📸 This should find more posts with actual card images to test vision on");
}

testWithCardSearches().catch(console.error);