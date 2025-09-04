// Run bot with aggressive engagement for testing
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');
const bot = new ContextualPokemonBot();

// Override engagement selector to be very aggressive
bot.engagementSelector.calculateEngagementScore = function() {
    return 0.9; // High score for everything
};

bot.engagementSelector.isTooSoon = function() {
    return false; // Never too soon
};

// Make it reply more often
bot.engagementSelector.decideEngagementType = function(score, analysis) {
    // 80% chance to reply
    if (Math.random() < 0.8) {
        return { 
            action: 'reply', 
            confidence: score,
            reason: 'aggressive_test_mode'
        };
    }
    return { 
        action: 'like', 
        confidence: score,
        reason: 'aggressive_test_like'
    };
};

console.log('🚨 Running bot in AGGRESSIVE mode for testing...\n');

// Run the bot
bot.run().catch(console.error);