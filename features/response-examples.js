class ResponseExamples {
    constructor() {
        this.examples = {
            priceInquiry: {
                high: [
                    "That Charizard VMAX has been holding steady around $800-900 lately, but definitely worth checking TCGPlayer for current market!",
                    "Nice pull! Last I checked that card was going for about $450. Market fluctuates though, so verify current pricing.",
                    "Those Pikachu V-UNION cards are hot right now - each one's worth around $200-250 individually."
                ],
                medium: [
                    "Pretty solid card! I'd say it's worth around $150-200 depending on condition and current market.",
                    "That one's been trending around $300. Always good to check multiple sources for the best price.",
                    "Decent value there - probably looking at $80-120 for that card right now."
                ],
                low: [
                    "Not the most expensive but still worth something! Around $20-30 I'd estimate.",
                    "Solid commons are still worth a few bucks each. That'd be about $5-10.",
                    "Entry level cards like that are usually $1-5 each."
                ]
            },
            cardIdentification: {
                successful: [
                    "That's a Charizard VMAX from the Sword & Shield expansion! One of the most popular cards right now.",
                    "Looks like a Pikachu V from the same set. Great card, especially with the new variants coming out.",
                    "That's the 1st Edition Charizard from Base Set. Those are getting harder to find in good condition!"
                ],
                uncertain: [
                    "Looks like it might be a Charizard card, but I'd need to see it clearer to be sure of the exact version.",
                    "That appears to be from the Pokemon TCG but I can't quite make out which specific card it is.",
                    "Seems like a holographic card, possibly a rare variant. The image is a bit blurry though."
                ]
            },
            showcase: {
                excited: [
                    "BROOOO that's insane!!! What set is that Charizard from? 🔥",
                    "No way!!! That's absolutely beautiful! Congrats on the pull! 🎉",
                    "HOLY CRAP that's gorgeous! The colors on that card are perfect! 😍"
                ],
                appreciative: [
                    "That's a really nice Charizard! Love the condition on it.",
                    "Beautiful card! The artwork on that one is stunning.",
                    "Great pull! That Pikachu has such clean lines and great centering."
                ],
                casual: [
                    "Nice card! That's a solid addition to any collection.",
                    "Cool find! That one's got some good value too.",
                    "Sweet! Love seeing cards in that kind of condition."
                ]
            },
            grading: {
                psa: [
                    "PSA's been a bit slow lately but definitely worth it for high-value cards. Make sure to get it authenticated first!",
                    "If it's a card worth over $100, PSA is usually the way to go. Beckett's good too but PSA has better resale value.",
                    "For that Charizard, I'd definitely recommend PSA 10. The grading standards are really consistent there."
                ],
                general: [
                    "Grading can definitely help with resale value, especially for cards over $50. Just factor in the grading cost too.",
                    "If you're thinking about selling it, graded cards usually get 20-30% more than raw cards in the same condition.",
                    "Always get high-value cards graded before selling. It's like insurance for collectors."
                ]
            },
            event: {
                win: [
                    "CONGRATS on the win!!! That's awesome! What was the prize pool like?",
                    "BROOOO that's amazing! Regional winner? That's huge! 🎉",
                    "No way! Congrats on taking down the tournament! That's seriously impressive!"
                ],
                participation: [
                    "Good luck at the tournament! Those regionals are always intense.",
                    "Hope you crush it at the event! Bring home that trophy! 🏆",
                    "Tournament time! Make sure to have fun regardless of the results."
                ]
            },
            trading: {
                interested: [
                    "I'm always looking to trade! What are you looking for in return?",
                    "Trade interest! Got anything specific in mind for that card?",
                    "That could work for a trade. What else are you collecting?"
                ],
                advice: [
                    "When trading, always make sure both sides feel like they're getting good value.",
                    "TCGPlayer is great for checking current market values before trading.",
                    "Make sure to verify card conditions before agreeing to any trade."
                ]
            },
            general: {
                positive: [
                    "Love seeing more Pokemon TCG content! Keep it up! 🎴",
                    "Always fun seeing what's new in the Pokemon community.",
                    "Nice to see fellow collectors sharing their cards! 📸"
                ],
                questions: [
                    "What's your favorite card from your collection?",
                    "Been collecting Pokemon TCG long? What's your favorite set?",
                    "How'd you get into collecting? Always cool to hear people's stories."
                ],
                casual: [
                    "Pokemon TCG is such a fun hobby! So many great cards out there.",
                    "Love the community around Pokemon collecting. Everyone's so passionate!",
                    "Always exciting to see new cards and sets being released."
                ]
            }
        };

        this.conversationStarters = [
            "What's your favorite Pokemon card of all time?",
            "Been collecting Pokemon long? What's your favorite memory?",
            "What's the rarest card you've ever pulled?",
            "How do you store your card collection?",
            "What's the most you've ever spent on a single card?",
            "Ever been to a Pokemon tournament?",
            "What's your go-to strategy for opening booster packs?"
        ];
    }

    getExample(intent, subType = null, context = {}) {
        const intentExamples = this.examples[intent];
        if (!intentExamples) {
            return this.getFallbackExample();
        }

        let examples;
        if (subType && intentExamples[subType]) {
            examples = intentExamples[subType];
        } else {
            // Get examples from all subtypes for this intent
            examples = Object.values(intentExamples).flat();
        }

        if (examples.length === 0) {
            return this.getFallbackExample();
        }

        // Randomly select an example
        const randomIndex = Math.floor(Math.random() * examples.length);
        return examples[randomIndex];
    }

    getExamplesByIntent(intent, limit = 3) {
        const intentExamples = this.examples[intent];
        if (!intentExamples) {
            return [this.getFallbackExample()];
        }

        const allExamples = Object.values(intentExamples).flat();
        return allExamples.slice(0, limit);
    }

    getConversationStarter() {
        const randomIndex = Math.floor(Math.random() * this.conversationStarters.length);
        return this.conversationStarters[randomIndex];
    }

    getFallbackExample() {
        return "That's awesome! Pokemon TCG has so many great cards out there.";
    }

    getResponseByContext(context) {
        const { primaryIntent, confidence, sentiment, urgency, contextData } = context;

        // High confidence responses
        if (confidence > 0.7) {
            switch (primaryIntent) {
                case 'priceInquiry':
                    return this.getPriceExample(contextData);
                case 'cardIdentification':
                    return this.getIdentificationExample(contextData);
                case 'showcase':
                    return this.getShowcaseExample(sentiment);
                case 'grading':
                    return this.getGradingExample(contextData);
                case 'event':
                    return this.getEventExample(contextData);
                case 'trading':
                    return this.getTradingExample(contextData);
                default:
                    return this.getGeneralExample(sentiment);
            }
        }

        // Lower confidence - more general responses
        return this.getGeneralExample(sentiment);
    }

    getPriceExample(contextData) {
        if (contextData?.visual?.rarity === 'high') {
            return this.getExample('priceInquiry', 'high');
        } else if (contextData?.visual?.rarity === 'medium') {
            return this.getExample('priceInquiry', 'medium');
        } else {
            return this.getExample('priceInquiry', 'low');
        }
    }

    getIdentificationExample(contextData) {
        if (contextData?.visual?.hasCards) {
            return this.getExample('cardIdentification', 'successful');
        } else {
            return this.getExample('cardIdentification', 'uncertain');
        }
    }

    getShowcaseExample(sentiment) {
        if (sentiment === 'excited') {
            return this.getExample('showcase', 'excited');
        } else if (sentiment === 'positive') {
            return this.getExample('showcase', 'appreciative');
        } else {
            return this.getExample('showcase', 'casual');
        }
    }

    getGradingExample(contextData) {
        if (contextData?.specific?.gradingService) {
            return this.getExample('grading', 'psa');
        } else {
            return this.getExample('grading', 'general');
        }
    }

    getEventExample(contextData) {
        if (contextData?.specific?.eventType === 'regional' || contextData?.specific?.eventType === 'tournament') {
            return this.getExample('event', 'win');
        } else {
            return this.getExample('event', 'participation');
        }
    }

    getTradingExample(contextData) {
        return this.getExample('trading', 'interested');
    }

    getGeneralExample(sentiment) {
        if (sentiment === 'positive' || sentiment === 'excited') {
            return this.getExample('general', 'positive');
        } else {
            return this.getExample('general', 'casual');
        }
    }

    getExamplesByQuality(quality) {
        // Return examples based on quality threshold
        const qualityExamples = {
            high: [
                "That Charizard VMAX has been holding steady around $800-900 lately, but definitely worth checking TCGPlayer for current market!",
                "BROOOO that's insane!!! What set is that Charizard from? 🔥",
                "No way!!! That's absolutely beautiful! Congrats on the pull! 🎉"
            ],
            medium: [
                "Pretty solid card! I'd say it's worth around $150-200 depending on condition.",
                "That's a really nice Charizard! Love the condition on it.",
                "Good luck at the tournament! Those regionals are always intense."
            ],
            low: [
                "Nice card! That's a solid addition to any collection.",
                "Love seeing more Pokemon TCG content! Keep it up!",
                "Always fun seeing what's new in the Pokemon community."
            ]
        };

        return qualityExamples[quality] || qualityExamples.medium;
    }

    // Add new examples to the database
    addExample(intent, subType, example) {
        if (!this.examples[intent]) {
            this.examples[intent] = {};
        }

        if (!this.examples[intent][subType]) {
            this.examples[intent][subType] = [];
        }

        this.examples[intent][subType].push(example);
    }

    // Get statistics about examples
    getStats() {
        const stats = {
            totalExamples: 0,
            intents: {},
            subtypes: {}
        };

        for (const [intent, subtypes] of Object.entries(this.examples)) {
            stats.intents[intent] = 0;

            for (const [subtype, examples] of Object.entries(subtypes)) {
                const count = examples.length;
                stats.intents[intent] += count;
                stats.subtypes[`${intent}.${subtype}`] = count;
                stats.totalExamples += count;
            }
        }

        return stats;
    }
}

module.exports = ResponseExamples;
