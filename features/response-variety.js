// Response Variety Generator
class ResponseVariety {
    constructor() {
        // Different response patterns for variety
        this.patterns = {
            question: [
                "What set is that from?",
                "How long have you been collecting?",
                "Did you pull that or buy it?",
                "Is that for your PC or for trade?",
                "What's your chase card?",
                "Have you completed the set?",
                "Planning to grade it?",
                "Where did you find that?",
                "What's your favorite card in the set?"
            ],
            
            observation: [
                "The centering looks really good on that",
                "That's getting harder to find at retail",
                "Prices on those have been climbing",
                "That set has amazing art",
                "The texture on those cards is incredible",
                "That's a tough pull from packs",
                "Sealed product from that era is gold",
                "The print quality looks solid"
            ],
            
            advice: [
                "Double sleeve that for sure",
                "Check the edges under good light before grading",
                "TCGPlayer has good prices on those",
                "Target restocks Tuesday mornings usually",
                "Compare grading company prices first",
                "Penny sleeve and toploader immediately",
                "Keep it sealed if you can resist",
                "Check for print lines before submitting"
            ],
            
            appreciation: [
                "Beautiful card, great addition",
                "Solid pickup for the collection",
                "That art is absolutely stunning",
                "One of the best cards in the set",
                "Classic card, love seeing these",
                "Underrated card for sure",
                "That's a grail for many collectors",
                "The colors on that are perfect"
            ],
            
            market: [
                "Those are holding value well",
                "Good time to buy before prices jump",
                "Market's been wild on those lately",
                "Seen those selling quick at shows",
                "Investment potential is strong",
                "Supply is drying up on those",
                "Vintage is always a safe bet",
                "Those are due for a price correction"
            ]
        };
        
        // Context-specific openers
        this.openers = {
            excited: ["Nice!", "Awesome!", "Sweet!", "Love it!"],
            surprised: ["No way!", "Whoa!", "Wow!", "Incredible!"],
            supportive: ["Good luck!", "Hope you hit it!", "Fingers crossed!", "You got this!"],
            interested: ["Interesting!", "Cool!", "Oh nice!", "Good find!"]
        };
        
        // Closing additions (used sparingly)
        this.closers = {
            community: ["Keep sharing the pulls", "Love seeing collections grow", "This hobby is the best"],
            encouraging: ["Keep hunting", "Good luck with future pulls", "Hope you find your chase"],
            trading: ["Hit me up if you're trading", "Always looking for trades", "Let me know if it's FS"]
        };
    }
    
    // Track responses used to avoid repetition (no-op safe)
    trackResponse({ username, text, response }) {
        try {
            this._recent = this._recent || [];
            this._recent.push({ username, text, response, ts: Date.now() });
            if (this._recent.length > 100) this._recent.shift();
        } catch (_) {}
    }
    
    // Get a varied response based on context
    getVariedResponse(text, hasImage = false) {
        const textLower = text.toLowerCase();
        
        // First check if this is actually Pokemon-related
        const pokemonTerms = ['pokemon', 'pokémon', 'tcg', 'card', 'pull', 'pack', 'charizard', 'pikachu', 'grade', 'psa', 'collection', 'binder', 'mail day', 'booster', 'etb', 'holo', 'rare', 'shiny'];
        const isPokemonRelated = pokemonTerms.some(term => textLower.includes(term));
        
        if (!isPokemonRelated) {
            return null; // Don't generate Pokemon responses for non-Pokemon content
        }
        
        let responseType = 'appreciation'; // default
        let response = '';
        
        // Determine best response type
        if (textLower.includes('pull') || textLower.includes('pack')) {
            // For pulls, mix questions and appreciation
            responseType = Math.random() < 0.5 ? 'appreciation' : 'question';
            
            // Add opener for good pulls
            if (textLower.includes('hit') || textLower.includes('chase') || hasImage) {
                const openers = this.openers.excited;
                response = openers[Math.floor(Math.random() * openers.length)] + ' ';
            }
        }
        else if (textLower.includes('price') || textLower.includes('worth') || textLower.includes('value')) {
            responseType = 'market';
        }
        else if (textLower.includes('grade') || textLower.includes('psa') || textLower.includes('bgs')) {
            responseType = Math.random() < 0.5 ? 'advice' : 'observation';
        }
        else if (textLower.includes('collection') || textLower.includes('mail day')) {
            responseType = Math.random() < 0.3 ? 'question' : 'appreciation';
        }
        else if (textLower.includes('find') || textLower.includes('found') || textLower.includes('store')) {
            responseType = Math.random() < 0.5 ? 'question' : 'advice';
        }
        else if (hasImage) {
            // For images, prefer observations
            responseType = Math.random() < 0.6 ? 'observation' : 'appreciation';
        }
        
        // Get response from pattern
        const patterns = this.patterns[responseType];
        response += patterns[Math.floor(Math.random() * patterns.length)];
        
        // Occasionally add a closer (10% chance)
        if (Math.random() < 0.1) {
            const closerTypes = Object.keys(this.closers);
            const closerType = closerTypes[Math.floor(Math.random() * closerTypes.length)];
            const closers = this.closers[closerType];
            response += '. ' + closers[Math.floor(Math.random() * closers.length)];
        }
        
        return response;
    }
    
    // Generate a question response
    askQuestion(context) {
        const questions = this.patterns.question;
        return questions[Math.floor(Math.random() * questions.length)];
    }
    
    // Generate an observation
    makeObservation(context, hasImage) {
        const observations = this.patterns.observation;
        let observation = observations[Math.floor(Math.random() * observations.length)];
        
        if (hasImage) {
            // Image-specific observations
            const imageObservations = [
                "The condition looks great from what I can see",
                "Love the way that card photographs",
                "That's displaying really well",
                "The colors really pop in that lighting"
            ];
            
            if (Math.random() < 0.5) {
                observation = imageObservations[Math.floor(Math.random() * imageObservations.length)];
            }
        }
        
        return observation;
    }
    
    // Generate helpful advice
    giveAdvice(context) {
        const advice = this.patterns.advice;
        return advice[Math.floor(Math.random() * advice.length)];
    }
    
    // Check if response adds value
    isValueAdding(response) {
        // Check if response contains useful information
        const valueKeywords = ['price', 'grade', 'find', 'restock', 'worth', 'tip', 'advice', 'psa', 'tcg'];
        const responseLower = response.toLowerCase();
        
        return valueKeywords.some(keyword => responseLower.includes(keyword));
    }
}

module.exports = ResponseVariety;