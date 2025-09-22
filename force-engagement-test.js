// Force engagement test with enhanced context
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

async function forceEngagementTest() {
    console.log('🚀 Force Engagement Test with Enhanced Context\n');
    
    const bot = new ContextualPokemonBot();
    
    // Override the timestamp filter to allow older posts for testing
    console.log('⚙️ Temporarily modifying timestamp filter for testing...');
    if (bot.timestampFilter) {
        bot.timestampFilter.isPostTooOld = function() {
            return false; // Allow all posts for testing
        };
    }
    
    // Override engagement selector to be more aggressive
    if (bot.engagementSelector) {
        bot.engagementSelector.calculateEngagementScore = function(analysis) {
            return 0.8; // High score for testing
        };
        bot.engagementSelector.isTooSoon = () => false; // No cooldown
    }
    
    console.log('🔍 Starting bot with enhanced settings...');
    
    try {
        await bot.launchBot();
        
        console.log('✅ Bot launched successfully');
        console.log('🎯 Bot will now search for content and use enhanced context');
        console.log('📊 Monitoring for 2 minutes...');
        
        // Let it run for 2 minutes then stop
        setTimeout(() => {
            console.log('\n⏹️ Stopping test...');
            process.exit(0);
        }, 120000); // 2 minutes
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

forceEngagementTest();
