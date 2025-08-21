class ResponseGenerator {
    constructor() {
        this.responseTemplates = {
            // Pulls and openings
            pulls: [
                "That's an amazing pull! 🔥",
                "Wow, that's a chase card right there!",
                "Incredible luck on that one!",
                "That card is beautiful!",
                "Great pull! The centering looks perfect",
                "That's a grail card for sure!",
                "Congrats on the hit!",
                "That's what we love to see!",
                "Pack magic is real!",
                "That artwork is stunning!",
                "Huge W on that pull!",
                "That's a keeper for the PC!",
                "Straight to the sleeve with that one!",
                "That's going to grade well!",
                "Beautiful card! Love that set"
            ],
            
            // Collections
            collections: [
                "Your collection is fire!",
                "Love the organization!",
                "That binder is stacked!",
                "Collection goals right there!",
                "Beautiful display!",
                "Love your taste in cards!",
                "That's an impressive collection!",
                "The variety is amazing!",
                "Quality over quantity, love it!",
                "Your collection is inspiring!",
                "That's years of dedication!",
                "Respect the grind!",
                "Museum worthy collection!",
                "Love the vintage pieces!",
                "That's a solid portfolio!"
            ],
            
            // Mail days
            mailday: [
                "Mail day hits different!",
                "Love a good mail day!",
                "That packaging though 👌",
                "Worth the wait!",
                "Mail day is the best day!",
                "That's a W mail day!",
                "Love seeing mail days!",
                "Package secured!",
                "Mail day dopamine hit!",
                "That's what I call a delivery!",
                "The anticipation paid off!",
                "Mail carrier MVP today!",
                "Christmas came early!",
                "That's a haul!",
                "Mail day never disappoints!"
            ],
            
            // Graded cards
            graded: [
                "That grade though! 🔥",
                "PSA 10 worthy for sure!",
                "Clean slab!",
                "That's a gem mint!",
                "Perfect centering!",
                "Worth the grading cost!",
                "Population report legend!",
                "That's investment grade!",
                "Slab collection on point!",
                "BGS Black Label incoming!",
                "CGC looking clean!",
                "That grade adds serious value!",
                "Mint condition preserved!",
                "Grade goals achieved!",
                "That's a museum piece!"
            ],
            
            // Deals and finds
            deals: [
                "That's a steal!",
                "Great find!",
                "You robbed them!",
                "Deals like this are rare!",
                "That's below market!",
                "Score of the day!",
                "Lucky find!",
                "That's a come up!",
                "Profit secured!",
                "Can't beat that price!",
                "Bargain hunter success!",
                "That's a W purchase!",
                "Investment opportunity!",
                "Deal of the week!",
                "That's free money!"
            ],
            
            // Questions and help
            questions: [
                "Check TCGPlayer for current prices",
                "PSA is backed up but worth it",
                "That's authentic, no worries",
                "Evolving Skies is the move",
                "Japanese exclusives hit different",
                "Double sleeve for protection",
                "Market is bullish on that",
                "Hold for long term gains",
                "Crown Zenith has better rates",
                "That set is undervalued",
                "Moonbreon is the chase",
                "Vintage always holds value",
                "Check the print lines",
                "Population matters for value",
                "Sealed is the way"
            ],
            
            // General engagement
            general: [
                "Pokemon TCG community is the best!",
                "Love to see it!",
                "This is why we collect!",
                "Gotta catch em all!",
                "TCG life!",
                "This hobby is addicting!",
                "Pokemon forever!",
                "Community W!",
                "Living the dream!",
                "That's what it's about!",
                "Pokemon brings us together!",
                "Childhood memories!",
                "Never too old for Pokemon!",
                "The nostalgia hits hard!",
                "Pokemon TCG is life!"
            ]
        };
        
        this.contextKeywords = {
            pulls: ['pull', 'pulled', 'pack', 'opening', 'box', 'etb', 'booster', 'hit', 'chase'],
            collections: ['collection', 'binder', 'display', 'pc', 'personal collection', 'vault', 'showcase'],
            mailday: ['mail', 'delivery', 'arrived', 'package', 'shipped', 'mailday', 'usps', 'fedex'],
            graded: ['psa', 'bgs', 'cgc', 'grade', 'graded', 'slab', 'gem', 'mint', '10', '9'],
            deals: ['deal', 'price', 'bought', 'paid', 'steal', 'find', 'pickup', 'haul', 'score'],
            questions: ['?', 'worth', 'value', 'real', 'fake', 'advice', 'help', 'should', 'what', 'how'],
            specific_cards: ['charizard', 'pikachu', 'moonbreon', 'umbreon', 'rayquaza', 'lugia', 'gengar', 'mewtwo'],
            sets: ['evolving skies', 'crown zenith', '151', 'paradox rift', 'paldean fates', 'obsidian flames']
        };
    }
    
    generateContextualResponse(username, tweetContent, hasImages = false) {
        const textLower = tweetContent.toLowerCase();
        
        // Determine context
        let category = 'general';
        let highestScore = 0;
        
        for (const [cat, keywords] of Object.entries(this.contextKeywords)) {
            const score = keywords.filter(kw => textLower.includes(kw)).length;
            if (score > highestScore) {
                highestScore = score;
                category = cat;
            }
        }
        
        // Special handling for images
        if (hasImages && category === 'general') {
            // If there's an image but no clear context, assume it's a pull or collection
            category = Math.random() < 0.5 ? 'pulls' : 'collections';
        }
        
        // Get response from appropriate category
        const responses = this.responseTemplates[category] || this.responseTemplates.general;
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        // Add personalization occasionally (20% chance)
        if (Math.random() < 0.2) {
            const personalizations = [
                `@${username} `,
                `Hey @${username}, `,
                `Yo @${username}, `,
                ``,
                ``
            ];
            const personalization = personalizations[Math.floor(Math.random() * personalizations.length)];
            return personalization + response;
        }
        
        return response;
    }
    
    // Specific response types for different scenarios
    generatePullResponse(cardName = '') {
        const templates = [
            `That ${cardName} is incredible!`,
            `${cardName} hits different!`,
            `Love that ${cardName}!`,
            `${cardName} is a grail!`,
            `That's the ${cardName} everyone wants!`
        ];
        
        if (cardName) {
            return templates[Math.floor(Math.random() * templates.length)];
        }
        
        return this.responseTemplates.pulls[Math.floor(Math.random() * this.responseTemplates.pulls.length)];
    }
    
    generatePriceResponse(cardName = '', price = '') {
        const templates = [
            `${cardName} is trending up!`,
            `${cardName} holding strong at market`,
            `Good time to buy ${cardName}`,
            `${cardName} is undervalued IMO`,
            `${cardName} will moon soon`
        ];
        
        if (cardName) {
            return templates[Math.floor(Math.random() * templates.length)];
        }
        
        return "Check TCGPlayer for current market!";
    }
    
    generateInvestmentAdvice() {
        const advice = [
            "Sealed product is the safest bet",
            "Vintage always appreciates",
            "Japanese exclusives are heating up",
            "Alt arts are the future",
            "Diversify across sets",
            "Hold for 5+ years minimum",
            "Buy the fear, sell the hype",
            "Focus on PSA 10 potential",
            "Special sets outperform main sets",
            "Eeveelutions never disappoint"
        ];
        
        return advice[Math.floor(Math.random() * advice.length)];
    }
}

module.exports = ResponseGenerator;