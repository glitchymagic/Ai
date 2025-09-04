// Debug wrapper for the bot to see why it's not engaging
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

const bot = new ContextualPokemonBot();

// Override the engagement selector to be less restrictive for debugging
const originalShouldEngage = bot.engagementSelector.shouldEngageWithPost.bind(bot.engagementSelector);
bot.engagementSelector.shouldEngageWithPost = async function(postElement, postData) {
    const result = await originalShouldEngage(postElement, postData);
    
    // Log why we're skipping
    if (result.action === 'skip') {
        console.log(`   🔍 DEBUG: Skipped because: ${result.reason}`);
        if (result.reason === 'low_score') {
            // Force engagement on some low score posts to test
            const randomEngage = Math.random() < 0.3; // 30% chance
            if (randomEngage) {
                console.log('   🎲 DEBUG: Forcing engagement for testing');
                return { 
                    action: 'reply', 
                    confidence: 0.5,
                    reason: 'debug_forced'
                };
            }
        }
    }
    
    return result;
};

// Also reduce cooldown for testing
bot.engagementSelector.isTooSoon = function() {
    return false; // Disable cooldown for debugging
};

// Run the bot
bot.run().catch(console.error);