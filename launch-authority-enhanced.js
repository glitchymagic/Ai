#!/usr/bin/env node

// Launch script for authority-enhanced Pokemon bot
// This bot provides data-driven market insights instead of casual responses

const ContextualPokemonBot = require('./pokemon-bot-contextual');

async function launchAuthorityBot() {
    console.log(`
🚀 Pokemon Authority Bot Launcher
================================
This enhanced bot provides:
✅ Real-time price data on hot cards
✅ Market analysis and predictions  
✅ Daily market reports (morning, midday, evening)
✅ Data-driven responses with confidence metrics
✅ Whale watch reports on Wednesdays

Starting in 5 seconds...
`);

    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔧 Initializing bot systems...\n');
    
    const bot = new ContextualPokemonBot();
    
    // Check if authority systems initialized properly
    const checkAuthority = setInterval(async () => {
        if (bot.authorityIntegration?.initialized) {
            clearInterval(checkAuthority);
            console.log(`
✅ Authority Systems Online:
- Hot Cards Tracker: Active (tracking ${bot.authorityIntegration.hotCards.HOT_CARDS.length} cards)
- Price Service: Connected
- Market Reporter: Ready
- Authority Engine: Operational

The bot is now ready to provide market intelligence!
`);
        }
    }, 1000);
    
    // Run the bot
    await bot.run();
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled rejection:', error);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down gracefully...');
    process.exit(0);
});

// Launch
launchAuthorityBot().catch(error => {
    console.error('❌ Failed to launch authority bot:', error);
    process.exit(1);
});