// Run bot with less strict filtering to see engagements
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

const bot = new ContextualPokemonBot();

// Make content filter less restrictive
const originalShouldEngage = bot.contentFilter.shouldEngageWithPost.bind(bot.contentFilter);
bot.contentFilter.shouldEngageWithPost = function(tweetText, username = '', isConversation = false) {
    // Still filter really bad stuff
    if (tweetText.toLowerCase().includes('scam') || 
        tweetText.toLowerCase().includes('porn') ||
        tweetText.toLowerCase().includes('onlyfans')) {
        return { engage: false, reason: 'blocked content' };
    }
    
    // Check positive keywords - if it has Pokemon content, probably good
    const textLower = tweetText.toLowerCase();
    const hasPokemonContent = /pokemon|pikachu|charizard|card|tcg|pull|pack|collection/i.test(textLower);
    
    if (hasPokemonContent) {
        return { engage: true, reason: 'pokemon content' };
    }
    
    // Otherwise use original filter
    return originalShouldEngage(tweetText, username, isConversation);
};

// Also reduce the engagement selector threshold
bot.engagementSelector.shouldEngageWithPost = async function(postElement, postData) {
    const analysis = await this.analyzePost(postElement, postData);
    
    // Skip obvious spam
    if (this.hasRedFlags(analysis.text)) {
        return { action: 'skip', reason: 'red_flags' };
    }
    
    // Calculate score
    const score = this.calculateEngagementScore(analysis);
    
    // Much lower threshold - engage with more posts
    if (score < 0.05) {  // Was 0.15
        return { action: 'skip', reason: 'very_low_score' };
    }
    
    // Higher chance of replying vs just liking
    const decision = score > 0.3 ? 'reply' : (score > 0.1 ? 'like' : 'skip');
    
    if (decision === 'reply') {
        return { 
            action: 'reply', 
            confidence: score,
            reason: 'pokemon_content'
        };
    } else if (decision === 'like') {
        return { 
            action: 'like', 
            confidence: score,
            reason: 'medium_quality'
        };
    }
    
    return { action: 'skip', reason: 'low_score' };
};

// Run the bot
console.log('🚀 Running bot with relaxed filters...\n');
bot.run().catch(console.error);