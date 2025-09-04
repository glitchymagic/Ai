// Run bot with modified settings to test vision on card images
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function runVisionTest() {
    console.log("🧪 Running Vision Test with Card-Focused Searches\n");
    
    // Set environment variables
    process.env.ENABLE_VISION_API = 'true';
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw';
    
    const ContextualPokemonBot = require('./pokemon-bot-contextual.js');
    const bot = new ContextualPokemonBot();
    
    // Initialize bot
    await bot.initialize();
    
    // Modify search to find card showcases
    console.log("🔍 Searching for posts with card images...\n");
    
    // Search for specific terms that often have card images
    const searchTerms = [
        '"just pulled"',
        '"mail day" pokemon',
        '"my collection" pokemon cards',
        'pokemon "look at this"'
    ];
    
    // Override the search method
    const originalSearch = bot.searchAndEngage.bind(bot);
    bot.searchAndEngage = async function() {
        // Use a search term likely to find card images
        const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        console.log(`   🎯 Using search: ${searchTerm}`);
        
        // Temporarily modify the search engine
        const originalGetSearch = this.searchEngine.getHighActivitySearches;
        this.searchEngine.getHighActivitySearches = () => [searchTerm];
        
        try {
            await originalSearch();
        } finally {
            this.searchEngine.getHighActivitySearches = originalGetSearch;
        }
    };
    
    // Lower thresholds for testing
    bot.engagementSelector.calculateEngagementScore = function(analysis) {
        if (analysis.hasImage) return 0.9; // High score for images
        return 0.3;
    };
    
    // Run for a short time
    console.log("🚀 Starting bot with vision-focused settings...\n");
    await bot.startEngaging();
}

runVisionTest().catch(console.error);