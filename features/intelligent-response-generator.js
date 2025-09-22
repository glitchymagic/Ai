class IntelligentResponseGenerator {
    constructor() {
        this.responseStrategies = {
            priceInquiry: {
                confidence: 'high',
                style: 'informative',
                elements: ['price_estimate', 'market_context', 'advice'],
                tone: 'confident'
            },
            cardIdentification: {
                confidence: 'high',
                style: 'helpful',
                elements: ['card_name', 'set_info', 'rarity_level'],
                tone: 'educational'
            },
            showcase: {
                confidence: 'medium',
                style: 'enthusiastic',
                elements: ['appreciation', 'specific_observation', 'question'],
                tone: 'excited'
            },
            grading: {
                confidence: 'medium',
                style: 'advisory',
                elements: ['service_recommendation', 'cost_estimate', 'benefit_analysis'],
                tone: 'professional'
            },
            event: {
                confidence: 'medium',
                style: 'congratulatory',
                elements: ['celebration', 'context_question', 'engagement'],
                tone: 'enthusiastic'
            },
            trading: {
                confidence: 'low',
                style: 'conversational',
                elements: ['interest_expression', 'counter_offer', 'negotiation'],
                tone: 'friendly'
            },
            general: {
                confidence: 'low',
                style: 'natural',
                elements: ['acknowledgment', 'relatable_comment', 'question'],
                tone: 'casual'
            }
        };

        this.toneModifiers = {
            excited: ['!', 'omg', 'wow', 'awesome', 'insane', 'crazy'],
            professional: ['certainly', 'recommend', 'suggest', 'consider', 'important'],
            casual: ['yeah', 'cool', 'nice', 'pretty', 'kinda', 'sorta'],
            confident: ['definitely', 'absolutely', 'without doubt', 'clearly']
        };

        this.contextualPhrases = {
            visual_available: ['I can see', 'Looking at that', 'From the image', 'That card shows'],
            high_value: ['premium', 'valuable', 'high-end', 'collectible', 'investment'],
            recent_event: ['just happened', 'recently', 'fresh off', 'right after'],
            market_fluctuation: ['currently', 'right now', 'these days', 'lately']
        };
    }

    async generateResponse(context, userHistory = [], apiData = {}) {
        try {
            const strategy = this.selectStrategy(context);
            const components = await this.buildResponseComponents(context, strategy, apiData);
            const response = this.assembleResponse(components, strategy, context);

            return {
                response: response,
                strategy: strategy,
                confidence: this.calculateConfidence(context, components),
                metadata: {
                    intent: context.primaryIntent,
                    tone: strategy.tone,
                    elements: components.usedElements,
                    apiCalls: apiData.apiCalls || 0
                }
            };
        } catch (error) {
            console.error('IntelligentResponseGenerator error:', error);
            return {
                response: "That's really cool! Pokemon TCG has so many amazing cards out there.",
                strategy: this.responseStrategies.general,
                confidence: 0.3,
                metadata: {
                    intent: 'general',
                    fallback: true,
                    error: error.message
                }
            };
        }
    }

    selectStrategy(context) {
        const intent = context.primaryIntent || 'general';
        const baseStrategy = this.responseStrategies[intent] || this.responseStrategies.general;

        // Adjust strategy based on context
        const adjustedStrategy = { ...baseStrategy };

        // Increase confidence if we have strong visual data
        if (context.hasImages && context.visualData?.visionAnalysis?.cards?.length > 0) {
            adjustedStrategy.confidence = 'high';
        }

        // Adjust tone based on user sentiment
        if (context.sentiment === 'excited' && adjustedStrategy.tone !== 'professional') {
            adjustedStrategy.tone = 'excited';
        }

        // Adjust style based on conversation history
        if (userHistory.length > 3) {
            adjustedStrategy.style = 'conversational'; // More natural for longer conversations
        }

        return adjustedStrategy;
    }

    async buildResponseComponents(context, strategy, apiData) {
        const components = {
            usedElements: [],
            parts: []
        };

        for (const element of strategy.elements) {
            const part = await this.generateElement(element, context, apiData);
            if (part) {
                components.parts.push(part);
                components.usedElements.push(element);
            }
        }

        return components;
    }

    async generateElement(element, context, apiData) {
        switch (element) {
            case 'price_estimate':
                return this.generatePriceEstimate(context, apiData);
            case 'market_context':
                return this.generateMarketContext(context, apiData);
            case 'card_name':
                return this.generateCardName(context);
            case 'set_info':
                return this.generateSetInfo(context, apiData);
            case 'appreciation':
                return this.generateAppreciation(context);
            case 'specific_observation':
                return this.generateSpecificObservation(context);
            case 'question':
                return this.generateQuestion(context);
            case 'advice':
                return this.generateAdvice(context);
            case 'rarity_level':
                return this.generateRarityLevel(context);
            case 'acknowledgment':
                return this.generateAcknowledgment(context);
            case 'relatable_comment':
                return this.generateRelatableComment(context);
            default:
                return null;
        }
    }

    generatePriceEstimate(context, apiData) {
        if (!apiData.priceData && !context.visualData?.visionAnalysis?.cards) {
            return "I'd need to see the card to give you an accurate price estimate.";
        }

        const card = context.visualData?.visionAnalysis?.cards?.[0];
        const priceData = apiData.priceData;

        if (priceData?.price) {
            return `That card is currently worth around $${priceData.price}.`;
        } else if (card?.name) {
            return `That ${card.name} is probably worth checking on TCGPlayer for current market value.`;
        }

        return "For accurate pricing, I'd recommend checking TCGPlayer or eBay for current market values.";
    }

    generateMarketContext(context, apiData) {
        const marketTrends = apiData.marketTrends;

        if (marketTrends?.trend === 'up') {
            return "The market has been trending upward lately, so values might be higher than usual.";
        } else if (marketTrends?.trend === 'down') {
            return "The market's been a bit soft recently, so prices might be lower than peak values.";
        }

        return "Market conditions can change quickly, so it's always good to check current listings.";
    }

    generateCardName(context) {
        const card = context.visualData?.visionAnalysis?.cards?.[0];

        if (card?.name) {
            return `That looks like a ${card.name}!`;
        }

        return "I'd need a clearer image to identify the exact card.";
    }

    generateSetInfo(context, apiData) {
        const card = context.visualData?.visionAnalysis?.cards?.[0];
        const setData = apiData.setData;

        if (setData?.setName) {
            return `It's from the ${setData.setName} set, released in ${setData.releaseYear || 'recent years'}.`;
        } else if (card?.set) {
            return `It's from the ${card.set} set.`;
        }

        return "I can tell it's a Pokemon TCG card, but would need the set details for more specific information.";
    }

    generateAppreciation(context) {
        const modifiers = this.toneModifiers[context.sentiment] || this.toneModifiers.casual;
        const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];

        return `That's ${modifier}!`;
    }

    generateSpecificObservation(context) {
        const card = context.visualData?.visionAnalysis?.cards?.[0];

        if (card?.name) {
            return `The artwork on that ${card.name} is really striking.`;
        }

        return "The card has such great artwork and colors!";
    }

    generateQuestion(context) {
        const questions = {
            priceInquiry: "Have you checked current market prices?",
            cardIdentification: "What set is that card from?",
            showcase: "How did you pull that card?",
            grading: "Are you thinking about getting it graded?",
            general: "What's your favorite Pokemon card?"
        };

        return questions[context.primaryIntent] || questions.general;
    }

    generateAdvice(context) {
        const advices = {
            priceInquiry: "Always check multiple sources for the best price information.",
            grading: "If it's a high-value card, professional grading can really help with resale.",
            trading: "Make sure both sides feel good about the trade value.",
            general: "The Pokemon TCG community is so passionate and helpful!"
        };

        return advices[context.primaryIntent] || advices.general;
    }

    generateRarityLevel(context) {
        const card = context.visualData?.visionAnalysis?.cards?.[0];

        if (card?.rarity) {
            const rarity = card.rarity.toLowerCase();
            if (rarity.includes('secret') || rarity.includes('ultra')) {
                return "That's a super rare card! Those don't come around often.";
            } else if (rarity.includes('rare') || rarity.includes('vmax')) {
                return "That's a pretty rare card with good collectible value.";
            }
        }

        return "It looks like a valuable card from what I can see.";
    }

    generateAcknowledgment(context) {
        return "That's really interesting!";
    }

    generateRelatableComment(context) {
        const comments = [
            "I love seeing fellow Pokemon collectors sharing their cards.",
            "The Pokemon TCG community is so awesome.",
            "There's always something new and exciting in Pokemon TCG.",
            "Every collection tells a unique story."
        ];

        return comments[Math.floor(Math.random() * comments.length)];
    }

    assembleResponse(components, strategy, context) {
        if (components.parts.length === 0) {
            return this.getFallbackResponse();
        }

        let response = components.parts.join(' ');

        // Add tone modifiers
        response = this.applyToneModifiers(response, strategy.tone);

        // Add contextual phrases
        response = this.addContextualPhrases(response, context);

        // Ensure proper punctuation
        response = this.ensureProperPunctuation(response);

        // Keep response length reasonable
        if (response.length > 280) {
            response = this.truncateResponse(response);
        }

        return response;
    }

    applyToneModifiers(response, tone) {
        if (tone === 'excited') {
            if (!response.includes('!')) {
                response += '!';
            }
            // Add excited words occasionally
            if (Math.random() > 0.7) {
                const excitedWords = ['Wow', 'OMG', 'Amazing', 'Awesome'];
                const word = excitedWords[Math.floor(Math.random() * excitedWords.length)];
                response = word + '! ' + response;
            }
        } else if (tone === 'professional') {
            // More formal language
            response = response.replace(/\bgreat\b/g, 'excellent');
            response = response.replace(/\bcool\b/g, 'impressive');
        }

        return response;
    }

    addContextualPhrases(response, context) {
        // Add visual context if we have images
        if (context.hasImages && !response.includes('see') && !response.includes('look')) {
            const phrases = this.contextualPhrases.visual_available;
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];
            response = phrase + ' ' + response.charAt(0).toLowerCase() + response.slice(1);
        }

        return response;
    }

    ensureProperPunctuation(response) {
        // Ensure ends with proper punctuation
        if (!response.match(/[.!?]$/)) {
            response += '.';
        }

        // Capitalize first letter
        response = response.charAt(0).toUpperCase() + response.slice(1);

        return response;
    }

    truncateResponse(response) {
        // Try to truncate at sentence boundary
        const sentences = response.split(/[.!?]/);
        let truncated = '';

        for (const sentence of sentences) {
            if ((truncated + sentence).length > 250) {
                break;
            }
            truncated += sentence + '.';
        }

        if (truncated.length < 50) {
            // If truncation is too short, just cut at word boundary
            truncated = response.substring(0, 250);
            const lastSpace = truncated.lastIndexOf(' ');
            if (lastSpace > 200) {
                truncated = truncated.substring(0, lastSpace);
            }
            truncated += '...';
        }

        return truncated;
    }

    calculateConfidence(context, components) {
        let confidence = 0.5;

        // Higher confidence with more components used
        confidence += (components.usedElements.length / 5) * 0.2;

        // Higher confidence with visual data
        if (context.hasImages) {
            confidence += 0.2;
        }

        // Higher confidence with API data
        if (Object.keys(context.apiData || {}).length > 0) {
            confidence += 0.1;
        }

        // Adjust based on intent confidence
        if (context.confidence > 0.7) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    getFallbackResponse() {
        const fallbacks = [
            "That's awesome! Pokemon TCG has so many great cards.",
            "Cool! Love seeing the Pokemon community in action.",
            "Nice! The Pokemon TCG scene is really exciting right now.",
            "That's really cool! Keep collecting!"
        ];

        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}

module.exports = IntelligentResponseGenerator;
