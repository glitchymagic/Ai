// Run bot with lower thresholds to test vision
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

async function runWithLowerThresholds() {
    const bot = new ContextualPokemonBot();
    
    // Lower engagement threshold for testing
    bot.engagementSelector.calculateEngagementScore = function(analysis) {
        return 0.8; // High score to force engagement
    };
    
    // Skip cooldown
    bot.engagementSelector.isTooSoon = () => false;
    
    console.log('🚀 Running bot with lower thresholds to test vision...\n');
    
    await bot.run();
}

runWithLowerThresholds().catch(console.error);