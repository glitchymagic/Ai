// Anti-Scam Heuristics - Avoid boosting sketchy behavior
class AntiScam {
    constructor() {
        // Legitimate phrases to whitelist
        this.whitelist = [
            'official pokémon center discord',
            'official pokemon center discord',
            'pokémon center website',
            'pokemon center website',
            'tcgplayer seller',
            'ebay seller with',
            'paypal goods and services',
            'g&s accepted'
        ];
        
        // Scam indicators
        this.scamPatterns = [
            // Payment methods that bypass protection
            'f&f only', 'friends and family only', 'ff only', 'f and f',
            'no g&s', 'no goods and services', 'no invoice',
            
            // Pressure tactics
            'no holds', 'first come', 'fcfs', 'will sell fast',
            'dm to buy', 'dm me to buy', 'dm for payment',
            
            // Gambling/raffle patterns (already handled separately)
            'raz', 'razor', 'razz', 'fill', 'spot list', 'spots open',
            'break spot', 'team spot', 'random team',
            
            // External platforms (often used for scams)
            'telegram:', 'whatsapp:', 'discord only', 'cashapp:', 'venmo:',
            'crypto only', 'btc only', 'eth only',
            'dm me on telegram', 'message me on telegram', 'hit me on telegram',
            'dm me on whatsapp', 'message me on whatsapp',
            
            // Too good to be true
            'guaranteed psa 10', 'definitely gem mint', '100% authentic',
            'estate sale', 'moving sale everything must go',
            
            // Suspicious URLs
            'bit.ly', 'tinyurl', 'shorturl', 'goo.gl',
            
            // Common scam phrases
            'wire transfer', 'western union', 'money order only',
            'shipped after payment clears', 'new account', 'backup account'
        ];
        
        // High-risk account patterns
        this.suspiciousAccountPatterns = [
            /^\d{8,}$/,              // All numbers (often bot accounts)
            /_\d{6,}$/,              // Ends with many numbers
            /^[A-Z]{8,}\d+$/,        // All caps + numbers
            /buyer\d+/i,             // buyerXXXXXX pattern
            /seller\d+/i             // sellerXXXXXX pattern
        ];
    }
    
    // Check if we should skip this post
    shouldSkip(text, username = '') {
        const textLower = text.toLowerCase();
        
        // Check whitelist first
        for (const legitPhrase of this.whitelist) {
            if (textLower.includes(legitPhrase)) {
                return { skip: false, reason: 'whitelisted phrase' };
            }
        }
        
        // Check for scam patterns
        for (const pattern of this.scamPatterns) {
            if (textLower.includes(pattern)) {
                return {
                    skip: true,
                    reason: `scam pattern detected: "${pattern}"`,
                    confidence: 'high'
                };
            }
        }
        
        // Check username patterns
        for (const pattern of this.suspiciousAccountPatterns) {
            if (pattern.test(username)) {
                return {
                    skip: true,
                    reason: 'suspicious username pattern',
                    confidence: 'medium'
                };
            }
        }
        
        // Check for multiple red flags
        let redFlags = 0;
        
        if (textLower.includes('dm')) redFlags++;
        if (textLower.includes('only')) redFlags++;
        if (textLower.includes('fast')) redFlags++;
        if (textLower.includes('$') && textLower.includes('send')) redFlags++;
        if (!textLower.includes('paypal') && textLower.includes('pay')) redFlags++;
        
        if (redFlags >= 3) {
            return {
                skip: true,
                reason: 'multiple red flags detected',
                confidence: 'medium'
            };
        }
        
        return {
            skip: false,
            reason: 'no scam indicators detected',
            confidence: 'high'
        };
    }
    
    // Clean response to avoid endorsing sketchy behavior
    cleanResponse(response, originalPost) {
        const responseClean = response.toLowerCase();
        const postLower = originalPost.toLowerCase();
        
        // Don't express buying interest on sketchy sales
        if (postLower.includes('f&f') || postLower.includes('dm to buy')) {
            if (responseClean.includes('interested') || 
                responseClean.includes('i\'ll take') ||
                responseClean.includes('still available')) {
                return null; // Don't respond at all
            }
        }
        
        // Remove any accidental payment method mentions
        const cleanedResponse = response
            .replace(/paypal/gi, '')
            .replace(/venmo/gi, '')
            .replace(/cashapp/gi, '')
            .replace(/f&f/gi, '')
            .replace(/friends (and|&) family/gi, '');
        
        return cleanedResponse.trim();
    }
}

module.exports = AntiScam;