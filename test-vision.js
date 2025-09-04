// Quick test script to verify vision is working
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

async function testVision() {
    const bot = new ContextualPokemonBot();
    
    // Override to search for popular terms
    bot.searchEngine.getNextSearch = () => '#PokemonTCG';
    
    // Run bot
    await bot.run();
}

testVision().catch(console.error);