class ContentFilter {
    constructor() {
        // Keywords that indicate toxic/controversial content
        this.toxicKeywords = [
            // Violence/threats
            'kill', 'death', 'die', 'murder', 'throat', 'cut', 'suicide', 'harm',
            'violence', 'attack', 'assault', 'weapon', 'gun', 'knife',
            
            // Profanity (partial list)
            'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard',
            
            // Discrimination/hate
            'racist', 'racism', 'sexist', 'homophobic', 'transphobic',
            'discrimination', 'hate', 'nazi', 'supremacist',
            
            // Scams/illegal
            'scam', 'fraud', 'fake', 'counterfeit', 'illegal', 'stolen',
            'exploit', 'hack', 'crack', 'pirate',
            
            // Controversial topics
            'politics', 'trump', 'biden', 'democrat', 'republican',
            'vaccine', 'covid', 'conspiracy', 'qanon',
            
            // Gambling/addiction
            'gambling', 'betting', 'casino', 'addiction', 'drugs',
            
            // Adult content
            'nsfw', 'nude', 'porn', 'onlyfans', 'xxx', '18+',
            
            // Negativity
            'worst', 'terrible', 'horrible', 'disaster', 'trash', 'garbage',
            'sucks', 'pathetic', 'stupid', 'idiot', 'moron'
        ];
        
        // Phrases that indicate drama/arguments
        this.dramaIndicators = [
            'ratio', 'L take', 'touch grass', 'cope', 'seethe', 'mald',
            'clown', 'cringe', 'nobody asked', 'who asked', 'didn\'t ask',
            'stay mad', 'cry about it', 'skill issue', 'get good'
        ];
        
        // Positive Pokemon TCG keywords we want to engage with
        this.positiveKeywords = [
            'pull', 'pulled', 'collection', 'mail day', 'mailday',
            'opening', 'grade', 'graded', 'psa', 'bgs', 'cgc',
            'chase', 'hit', 'gem', 'mint', 'invest', 'portfolio',
            'showcase', 'display', 'binder', 'favorite', 'love',
            'beautiful', 'stunning', 'amazing', 'awesome', 'incredible',
            'deal', 'find', 'pickup', 'haul', 'score', 'steal'
        ];
        
        // Context that makes negative words acceptable
        this.contextualExceptions = {
            'fake': ['fake or real', 'is this fake', 'spot fake', 'avoid fake'],
            'worst': ['worst pull', 'worst luck', 'worst pack'],
            'terrible': ['terrible pull rates', 'terrible luck'],
            'hell': ['hell yeah', 'hell of a pull'],
            'damn': ['damn nice', 'damn good', 'hot damn']
        };
    }
    
    shouldEngageWithPost(tweetText, username = '', isConversation = false) {
        const textLower = tweetText.toLowerCase();
        
        // Skip if username contains problematic terms
        const usernameLower = username.toLowerCase();
        if (this.containsProblematicUsername(usernameLower)) {
            return { engage: false, reason: 'problematic username' };
        }
        
        // Check for toxic content
        const toxicityScore = this.calculateToxicityScore(textLower);
        if (toxicityScore > 2) {
            return { engage: false, reason: 'toxic content detected' };
        }
        
        // Check for drama/arguments
        if (this.containsDrama(textLower)) {
            return { engage: false, reason: 'drama/argument detected' };
        }
        
        // For conversations, be more lenient
        if (isConversation) {
            // Still skip if meaningless
            if (this.isMeaningless(textLower)) {
                return { engage: false, reason: 'too short or meaningless' };
            }
            
            // Skip obvious spam
            if (this.isSpam(textLower)) {
                return { engage: false, reason: 'spam detected' };
            }
            
            // For conversations, we can respond to non-Pokemon content too
            return { 
                engage: true, 
                quality: 5,
                reason: 'conversation reply'
            };
        }
        
        // Check if it's too short or meaningless
        if (tweetText.length < 20 || this.isMeaningless(textLower)) {
            return { engage: false, reason: 'too short or meaningless' };
        }
        
        // Check for spam patterns
        if (this.isSpam(textLower)) {
            return { engage: false, reason: 'spam detected' };
        }
        
        // Check for positive engagement signals
        const positivityScore = this.calculatePositivityScore(textLower);
        
        // Require at least some Pokemon-related content for initial engagement (relaxed)
        if (!this.isPokemonRelated(textLower) && positivityScore < 1) {
            return { engage: false, reason: 'not Pokemon TCG related' };
        }
        
        return { 
            engage: true, 
            quality: positivityScore,
            reason: 'good content'
        };
    }
    
    calculateToxicityScore(text) {
        let score = 0;
        
        for (const keyword of this.toxicKeywords) {
            if (text.includes(keyword)) {
                // Check for contextual exceptions
                if (this.hasContextualException(text, keyword)) {
                    continue;
                }
                score++;
            }
        }
        
        // Extra points for multiple profanities
        const profanityCount = (text.match(/fuck|shit|damn|hell|ass/gi) || []).length;
        if (profanityCount > 2) score += 2;
        
        // Check for ALL CAPS (shouting)
        const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
        if (capsRatio > 0.5 && text.length > 20) score++;
        
        return score;
    }
    
    hasContextualException(text, keyword) {
        if (!this.contextualExceptions[keyword]) return false;
        
        for (const exception of this.contextualExceptions[keyword]) {
            if (text.includes(exception)) return true;
        }
        
        return false;
    }
    
    containsDrama(text) {
        for (const indicator of this.dramaIndicators) {
            if (text.includes(indicator)) return true;
        }
        
        // Check for excessive punctuation (!!!!! or ?????)
        if (text.match(/[!?]{4,}/)) return true;
        
        // Check for excessive emojis (spam indicator)
        const emojiCount = (text.match(/🔥|💰|💎|⚡|🚀|💯/g) || []).length;
        if (emojiCount > 3) return true;
        
        // Check for @mentions in arguments
        const mentionCount = (text.match(/@\w+/g) || []).length;
        if (mentionCount > 3) return true;
        
        return false;
    }
    
    containsProblematicUsername(username) {
        const problematic = [
            'bot', 'spam', 'fake', 'scam', 'xxx', 'porn', 'nsfw',
            'onlyfans', 'crypto', 'nft', 'elon', 'musk', 'official'
        ];
        
        for (const term of problematic) {
            if (username.includes(term)) return true;
        }
        
        return false;
    }
    
    isMeaningless(text) {
        // Skip only if very short
        if (text.length < 10) return true;
        
        // Just emojis or symbols
        if (text.match(/^[\s\W]+$/)) return true;
        
        // Repetitive characters
        if (text.match(/(.)\1{5,}/)) return true;
        
        return false;
    }
    
    isSpam(text) {
        // Multiple URLs
        const urlCount = (text.match(/https?:\/\//g) || []).length;
        if (urlCount > 2) return true;
        
        // Cryptocurrency/NFT spam
        if (text.match(/crypto|bitcoin|ethereum|nft|opensea|mint\s+now/i)) return true;
        
        // Follow for follow
        if (text.match(/follow\s+(for|4)\s+follow|f4f|followback/i)) return true;
        
        // Promotional spam
        if (text.match(/check\s+my\s+(bio|profile)|link\s+in\s+bio|onlyfans/i)) return true;
        
        // SMS/verification services
        if (text.includes('sms認証') || text.includes('認証代行')) return true;
        
        return false;
    }
    
    calculatePositivityScore(text) {
        let score = 0;
        
        for (const keyword of this.positiveKeywords) {
            if (text.includes(keyword)) score++;
        }
        
        // Bonus for images mentioned
        if (text.includes('image') || text.includes('pic') || text.includes('photo')) score++;
        
        // Bonus for questions (engagement opportunity)
        if (text.includes('?')) score++;
        
        // Bonus for excitement
        if (text.match(/!+/) && !text.match(/!{4,}/)) score++;
        
        return score;
    }
    
    isPokemonRelated(text) {
        const pokemonTerms = [
            'pokemon', 'pokémon', 'tcg', 'card', 'pull', 'pack',
            'charizard', 'pikachu', 'eeveelution', 'trainer',
            'psa', 'bgs', 'cgc', 'grade', 'slab', 'mint',
            'booster', 'etb', 'collection', 'binder', 'mail day',
            // Add more terms
            'vmax', 'vstar', 'ex', 'gx', 'full art', 'alt art',
            'evolving skies', 'crown zenith', '151', 'paldea',
            'paradox rift', 'obsidian flames', 'temporal forces',
            'japanese', 'english', 'shiny', 'rare', 'holo',
            'promo', 'box', 'tin', 'sleeve', 'deck'
        ];
        
        for (const term of pokemonTerms) {
            if (text.includes(term)) return true;
        }
        
        return false;
    }
    
    // Clean up response text to be appropriate
    cleanResponse(response) {
        // Remove any accidental profanity from AI
        let cleaned = response;
        
        const mildProfanity = {
            'damn': 'dang',
            'hell': 'heck',
            'crap': 'crud',
            'sucks': 'stinks'
        };
        
        for (const [bad, good] of Object.entries(mildProfanity)) {
            const regex = new RegExp(`\\b${bad}\\b`, 'gi');
            cleaned = cleaned.replace(regex, good);
        }
        
        // Remove excessive punctuation
        cleaned = cleaned.replace(/!{2,}/g, '!');
        cleaned = cleaned.replace(/\?{2,}/g, '?');
        
        // Ensure appropriate length
        if (cleaned.length > 150) {
            cleaned = cleaned.substring(0, 147) + '...';
        }
        
        return cleaned.trim();
    }
}

module.exports = ContentFilter;