class ContextIntelligence {
    constructor() {
        this.contextPatterns = {
            priceInquiry: [
                /worth/i, /value/i, /price/i, /cost/i, /market/i,
                /how much/i, /what.*cost/i, /selling for/i, /going for/i
            ],
            cardIdentification: [
                /what.*card/i, /identify/i, /what.*this/i, /card name/i,
                /what.*pokemon/i, /recognize/i
            ],
            showcase: [
                /check.*out/i, /look.*at/i, /pulled/i, /got.*this/i,
                /my.*card/i, /collection/i, /showcase/i
            ],
            grading: [
                /grade/i, /psa/i, /cgc/i, /slab/i, /condition/i,
                /grading.*service/i, /submit.*grading/i
            ],
            event: [
                /tournament/i, /regional/i, /league/i, /cup/i,
                /competition/i, /prize/i, /winner/i, /event/i
            ],
            trading: [
                /trade/i, /looking.*for/i, /wants/i, /needs/i,
                /have.*want/i, /trading/i
            ]
        };

        this.intentConfidence = new Map();
    }

    analyzeContext(tweet, visualData = null, threadContext = []) {
        const result = {
            primaryIntent: 'general',
            confidence: 0.5,
            intents: {},
            contextData: {},
            keywords: [],
            sentiment: 'neutral',
            urgency: 'normal'
        };

        const text = tweet.toLowerCase();

        // Analyze each intent pattern
        for (const [intent, patterns] of Object.entries(this.contextPatterns)) {
            let matches = 0;
            const matchedKeywords = [];

            for (const pattern of patterns) {
                if (pattern.test(text)) {
                    matches++;
                    // Extract matched keywords
                    const match = text.match(pattern);
                    if (match) {
                        matchedKeywords.push(match[0]);
                    }
                }
            }

            const confidence = Math.min(matches / patterns.length, 1.0);
            result.intents[intent] = confidence;

            if (confidence > result.confidence) {
                result.primaryIntent = intent;
                result.confidence = confidence;
            }

            if (matchedKeywords.length > 0) {
                result.keywords.push(...matchedKeywords);
            }
        }

        // Analyze visual context
        if (visualData?.visionAnalysis) {
            result.contextData.visual = this.analyzeVisualContext(visualData.visionAnalysis);
        }

        // Analyze thread context
        if (threadContext.length > 0) {
            result.contextData.thread = this.analyzeThreadContext(threadContext);
        }

        // Determine sentiment
        result.sentiment = this.analyzeSentiment(text);

        // Determine urgency
        result.urgency = this.analyzeUrgency(text);

        // Extract specific data based on intent
        result.contextData.specific = this.extractSpecificData(text, result.primaryIntent);

        return result;
    }

    analyzeVisualContext(visionAnalysis) {
        const visual = {
            hasCards: false,
            cardCount: 0,
            cards: [],
            quality: 'unknown',
            rarity: 'unknown'
        };

        if (visionAnalysis.cards && visionAnalysis.cards.length > 0) {
            visual.hasCards = true;
            visual.cardCount = visionAnalysis.cards.length;
            visual.cards = visionAnalysis.cards.map(card => ({
                name: card.name || 'Unknown',
                set: card.set || 'Unknown',
                rarity: card.rarity || 'Unknown'
            }));

            // Determine overall rarity
            const rarities = visual.cards.map(card => card.rarity.toLowerCase());
            if (rarities.some(r => r.includes('secret') || r.includes('ultra') || r.includes('1st'))) {
                visual.rarity = 'high';
            } else if (rarities.some(r => r.includes('rare') || r.includes('vmax') || r.includes('vstar'))) {
                visual.rarity = 'medium';
            } else {
                visual.rarity = 'low';
            }
        }

        return visual;
    }

    analyzeThreadContext(threadContext) {
        const thread = {
            messageCount: threadContext.length,
            conversationType: 'general',
            topics: [],
            participants: new Set()
        };

        // Analyze conversation flow
        const messages = threadContext.map(msg => msg.toLowerCase());

        // Determine conversation type based on thread content
        const priceMentions = messages.filter(msg => /worth|price|value|cost/i.test(msg)).length;
        const cardMentions = messages.filter(msg => /card|pokemon/i.test(msg)).length;
        const tradeMentions = messages.filter(msg => /trade|looking|want/i.test(msg)).length;

        if (priceMentions > cardMentions && priceMentions > tradeMentions) {
            thread.conversationType = 'price_discussion';
        } else if (tradeMentions > priceMentions && tradeMentions > cardMentions) {
            thread.conversationType = 'trading';
        } else if (cardMentions > 0) {
            thread.conversationType = 'card_discussion';
        }

        // Extract topics
        const allText = messages.join(' ');
        const topicPatterns = [
            /charizard|vaporeon|blastoise/i,
            /vmax|vstar|ex|gx/i,
            /base set|jungle|fossil/i,
            /graded|psa|cgc/i
        ];

        for (const pattern of topicPatterns) {
            if (pattern.test(allText)) {
                const match = allText.match(pattern);
                if (match && !thread.topics.includes(match[0])) {
                    thread.topics.push(match[0]);
                }
            }
        }

        return thread;
    }

    analyzeSentiment(text) {
        const positiveWords = ['amazing', 'awesome', 'great', 'love', 'excited', 'happy', 'nice', 'cool', 'insane', 'fire'];
        const negativeWords = ['disappointed', 'bad', 'terrible', 'hate', 'sad', 'angry', 'trash', 'garbage'];
        const excitedWords = ['omg', 'wtf', 'holy', 'crazy', 'insane', 'unbelievable', 'wow'];

        let positive = 0, negative = 0, excited = 0;

        const words = text.split(/\s+/);

        for (const word of words) {
            if (positiveWords.some(pw => word.includes(pw))) positive++;
            if (negativeWords.some(nw => word.includes(nw))) negative++;
            if (excitedWords.some(ew => word.includes(ew))) excited++;
        }

        // Check for exclamation marks
        const exclamations = (text.match(/!/g) || []).length;
        if (exclamations > 2) excited += 0.5;

        if (excited > 0) return 'excited';
        if (positive > negative) return 'positive';
        if (negative > positive) return 'negative';
        return 'neutral';
    }

    analyzeUrgency(text) {
        const urgentPatterns = [
            /urgent/i, /asap/i, /quick/i, /fast/i, /now/i, /today/i,
            /help/i, /please/i, /emergency/i, /important/i
        ];

        const questionPatterns = [
            /\?$/, /what/i, /how/i, /when/i, /where/i, /why/i, /which/i
        ];

        for (const pattern of urgentPatterns) {
            if (pattern.test(text)) return 'high';
        }

        for (const pattern of questionPatterns) {
            if (pattern.test(text)) return 'medium';
        }

        return 'normal';
    }

    extractSpecificData(text, intent) {
        const data = {};

        switch (intent) {
            case 'priceInquiry':
                // Extract price-related keywords
                const priceKeywords = text.match(/\$?\d+(\.\d+)?|hundred|thousand/i);
                if (priceKeywords) {
                    data.priceMentioned = priceKeywords[0];
                }
                break;

            case 'cardIdentification':
                // Look for card name hints
                const cardHints = text.match(/(charizard|pikachu|blastoise|vaporeon|dragonite)/i);
                if (cardHints) {
                    data.possibleCard = cardHints[0];
                }
                break;

            case 'grading':
                // Extract grading service mentions
                const gradingServices = text.match(/(psa|cgc| Beckett|BGS)/i);
                if (gradingServices) {
                    data.gradingService = gradingServices[0];
                }
                break;

            case 'event':
                // Extract event type
                const eventTypes = text.match(/(regional|tournament|league|cup|championship)/i);
                if (eventTypes) {
                    data.eventType = eventTypes[0];
                }
                break;
        }

        return data;
    }

    getResponseStrategy(contextAnalysis) {
        const strategies = {
            priceInquiry: {
                priority: 'high',
                responseType: 'informative',
                includePriceData: true,
                beConfident: true
            },
            cardIdentification: {
                priority: 'high',
                responseType: 'helpful',
                includeCardInfo: true,
                beSpecific: true
            },
            showcase: {
                priority: 'medium',
                responseType: 'appreciative',
                includeSpecificPraise: true,
                matchEnergy: true
            },
            grading: {
                priority: 'medium',
                responseType: 'advisory',
                includeGradingTips: true,
                beHelpful: true
            },
            event: {
                priority: 'medium',
                responseType: 'congratulatory',
                includeEventContext: true,
                beEnthusiastic: true
            },
            trading: {
                priority: 'low',
                responseType: 'interested',
                includeTradeAdvice: true,
                beConversational: true
            },
            general: {
                priority: 'low',
                responseType: 'friendly',
                beNatural: true,
                keepSimple: true
            }
        };

        return strategies[contextAnalysis.primaryIntent] || strategies.general;
    }
}

module.exports = ContextIntelligence;
