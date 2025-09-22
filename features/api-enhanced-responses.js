class APIEnhancedResponses {
    constructor() {
        this.enhancementTypes = {
            price_data: 'price_enhancement',
            card_info: 'card_enhancement',
            set_info: 'set_enhancement',
            market_trends: 'market_enhancement',
            card_suggestions: 'suggestion_enhancement'
        };

        this.confidenceThresholds = {
            high: 0.8,
            medium: 0.6,
            low: 0.4
        };

        this.responseTemplates = {
            price_enhanced: [
                "Based on current market data, that {cardName} is valued around ${price}. {market_context}",
                "According to the latest pricing, {cardName} goes for about ${price}. {market_context}",
                "Market data shows {cardName} at approximately ${price}. {market_context}"
            ],
            card_enhanced: [
                "{cardName} from {setName} is a {rarity} card. {additional_info}",
                "That's a {rarity} {cardName} card from the {setName} set. {additional_info}",
                "The {cardName} card from {setName} has {rarity} rarity. {additional_info}"
            ],
            set_enhanced: [
                "{setName} was released in {releaseYear} and is known for {theme}. {popularity_info}",
                "The {setName} set ({releaseYear}) features {theme}. {popularity_info}",
                "{setName} from {releaseYear} is {popularity} among collectors. {theme}"
            ]
        };
    }

    async enhanceResponse(context, apiData = {}) {
        const result = {
            enhancedResponse: context.originalResponse || '',
            enhancements: [],
            confidence: 0.5,
            apiCallsUsed: 0,
            metadata: {}
        };

        try {
            // Determine what enhancements are possible
            const availableEnhancements = this.identifyEnhancements(context, apiData);

            if (availableEnhancements.length === 0) {
                return result;
            }

            // Apply enhancements in priority order
            let enhancedText = context.originalResponse || '';

            for (const enhancement of availableEnhancements) {
                const enhancementResult = await this.applyEnhancement(enhancement, context, apiData);

                if (enhancementResult.success) {
                    enhancedText = enhancementResult.enhancedText;
                    result.enhancements.push(enhancementResult);
                    result.apiCallsUsed += enhancementResult.apiCalls || 0;
                    result.confidence = Math.max(result.confidence, enhancementResult.confidence);
                }
            }

            result.enhancedResponse = enhancedText;
            result.metadata = {
                enhancementsApplied: result.enhancements.length,
                originalLength: (context.originalResponse || '').length,
                enhancedLength: enhancedText.length,
                improvement: enhancedText.length - (context.originalResponse || '').length
            };

        } catch (error) {
            console.error('APIEnhancedResponses error:', error);
            result.metadata.error = error.message;
        }

        return result;
    }

    identifyEnhancements(context, apiData) {
        const enhancements = [];

        // Price enhancement
        if (this.shouldEnhancePrice(context, apiData)) {
            enhancements.push({
                type: 'price_data',
                priority: 'high',
                data: apiData.priceData
            });
        }

        // Card information enhancement
        if (this.shouldEnhanceCardInfo(context, apiData)) {
            enhancements.push({
                type: 'card_info',
                priority: 'high',
                data: apiData.cardData
            });
        }

        // Set information enhancement
        if (this.shouldEnhanceSetInfo(context, apiData)) {
            enhancements.push({
                type: 'set_info',
                priority: 'medium',
                data: apiData.setData
            });
        }

        // Market trends enhancement
        if (this.shouldEnhanceMarketTrends(context, apiData)) {
            enhancements.push({
                type: 'market_trends',
                priority: 'medium',
                data: apiData.marketTrends
            });
        }

        // Card suggestions enhancement
        if (this.shouldEnhanceSuggestions(context, apiData)) {
            enhancements.push({
                type: 'card_suggestions',
                priority: 'low',
                data: apiData.suggestions
            });
        }

        // Sort by priority
        return enhancements.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    shouldEnhancePrice(context, apiData) {
        return (
            context.primaryIntent === 'priceInquiry' &&
            apiData.priceData &&
            apiData.priceData.price &&
            !context.originalResponse?.includes('$')
        );
    }

    shouldEnhanceCardInfo(context, apiData) {
        return (
            context.primaryIntent === 'cardIdentification' &&
            apiData.cardData &&
            !context.originalResponse?.includes('from') &&
            !context.originalResponse?.includes('set')
        );
    }

    shouldEnhanceSetInfo(context, apiData) {
        return (
            apiData.setData &&
            context.originalResponse &&
            context.originalResponse.length < 100
        );
    }

    shouldEnhanceMarketTrends(context, apiData) {
        return (
            context.primaryIntent === 'priceInquiry' &&
            apiData.marketTrends &&
            !context.originalResponse?.includes('market') &&
            !context.originalResponse?.includes('trend')
        );
    }

    shouldEnhanceSuggestions(context, apiData) {
        return (
            apiData.suggestions &&
            apiData.suggestions.length > 0 &&
            context.originalResponse &&
            context.originalResponse.length < 150
        );
    }

    async applyEnhancement(enhancement, context, apiData) {
        const result = {
            type: enhancement.type,
            success: false,
            enhancedText: context.originalResponse || '',
            confidence: 0.5,
            apiCalls: 0
        };

        try {
            switch (enhancement.type) {
                case 'price_data':
                    return await this.applyPriceEnhancement(enhancement, context, apiData);
                case 'card_info':
                    return await this.applyCardEnhancement(enhancement, context, apiData);
                case 'set_info':
                    return await this.applySetEnhancement(enhancement, context, apiData);
                case 'market_trends':
                    return await this.applyMarketEnhancement(enhancement, context, apiData);
                case 'card_suggestions':
                    return await this.applySuggestionEnhancement(enhancement, context, apiData);
                default:
                    return result;
            }
        } catch (error) {
            console.error(`Enhancement error for ${enhancement.type}:`, error);
            return result;
        }
    }

    async applyPriceEnhancement(enhancement, context, apiData) {
        const priceData = enhancement.data;
        const templates = this.responseTemplates.price_enhanced;

        const template = templates[Math.floor(Math.random() * templates.length)];

        // Extract card name from context or API data
        const cardName = this.extractCardName(context, apiData);
        const marketContext = this.generateMarketContext(priceData);

        const enhancedText = template
            .replace('{cardName}', cardName)
            .replace('{price}', priceData.price)
            .replace('{market_context}', marketContext);

        return {
            type: 'price_data',
            success: true,
            enhancedText,
            confidence: 0.9,
            apiCalls: 1,
            metadata: {
                priceSource: priceData.market || 'unknown',
                currency: priceData.currency || 'USD'
            }
        };
    }

    async applyCardEnhancement(enhancement, context, apiData) {
        const cardData = enhancement.data;
        const templates = this.responseTemplates.card_enhanced;

        const template = templates[Math.floor(Math.random() * templates.length)];

        const cardName = cardData.name || 'this card';
        const setName = cardData.set?.name || 'that set';
        const rarity = cardData.rarity || 'standard';
        const additionalInfo = this.generateCardAdditionalInfo(cardData);

        const enhancedText = template
            .replace('{cardName}', cardName)
            .replace('{setName}', setName)
            .replace('{rarity}', rarity)
            .replace('{additional_info}', additionalInfo);

        return {
            type: 'card_info',
            success: true,
            enhancedText,
            confidence: 0.8,
            apiCalls: 1,
            metadata: {
                cardId: cardData.id,
                setId: cardData.set?.id
            }
        };
    }

    async applySetEnhancement(enhancement, context, apiData) {
        const setData = enhancement.data;
        const templates = this.responseTemplates.set_enhanced;

        const template = templates[Math.floor(Math.random() * templates.length)];

        const setName = setData.name || 'this set';
        const releaseYear = setData.releaseDate ? new Date(setData.releaseDate).getFullYear() : 'recent years';
        const theme = this.extractSetTheme(setData);
        const popularity = this.assessSetPopularity(setData);

        const enhancedText = template
            .replace('{setName}', setName)
            .replace('{releaseYear}', releaseYear)
            .replace('{theme}', theme)
            .replace('{popularity}', popularity);

        return {
            type: 'set_info',
            success: true,
            enhancedText,
            confidence: 0.7,
            apiCalls: 1,
            metadata: {
                setId: setData.id,
                totalCards: setData.total || 0
            }
        };
    }

    async applyMarketEnhancement(enhancement, context, apiData) {
        const trends = enhancement.data;

        let trendText = '';
        if (trends.trend === 'up') {
            trendText = 'Prices have been trending upward lately.';
        } else if (trends.trend === 'down') {
            trendText = 'The market has been softening recently.';
        } else {
            trendText = 'Market conditions have been relatively stable.';
        }

        const enhancedText = context.originalResponse
            ? `${context.originalResponse} ${trendText}`
            : trendText;

        return {
            type: 'market_trends',
            success: true,
            enhancedText,
            confidence: 0.6,
            apiCalls: 1,
            metadata: {
                trend: trends.trend,
                timeframe: trends.timeframe || 'recent'
            }
        };
    }

    async applySuggestionEnhancement(enhancement, context, apiData) {
        const suggestions = enhancement.data;

        if (!suggestions || suggestions.length === 0) {
            return {
                type: 'card_suggestions',
                success: false,
                enhancedText: context.originalResponse || '',
                confidence: 0.0
            };
        }

        const suggestionText = ` You might also be interested in: ${suggestions.slice(0, 2).join(', ')}.`;
        const enhancedText = (context.originalResponse || '') + suggestionText;

        return {
            type: 'card_suggestions',
            success: true,
            enhancedText,
            confidence: 0.5,
            apiCalls: 0, // Suggestions might come from cached data
            metadata: {
                suggestionsCount: suggestions.length,
                suggestionsShown: Math.min(2, suggestions.length)
            }
        };
    }

    extractCardName(context, apiData) {
        // Try to extract from API data first
        if (apiData.cardData?.name) {
            return apiData.cardData.name;
        }

        // Try to extract from visual data
        if (context.visualData?.visionAnalysis?.cards?.[0]?.name) {
            return context.visualData.visionAnalysis.cards[0].name;
        }

        // Try to extract from original text
        const text = context.originalTweet || '';
        const cardMatches = text.match(/(?:charizard|pikachu|blastoise|vaporeon|dragonite|charmeleon|wartortle|ivysaur)/i);

        return cardMatches ? cardMatches[0] : 'this card';
    }

    generateMarketContext(priceData) {
        if (!priceData) return '';

        const contexts = [
            'This seems to be a fair market price.',
            'Prices can fluctuate, so check current listings.',
            'This is based on recent sales data.',
            'Market value can vary by condition and grading.'
        ];

        return contexts[Math.floor(Math.random() * contexts.length)];
    }

    generateCardAdditionalInfo(cardData) {
        if (!cardData) return '';

        const infos = [];

        if (cardData.types && cardData.types.length > 0) {
            infos.push(`It's a ${cardData.types[0]} type Pokemon.`);
        }

        if (cardData.artist) {
            infos.push(`Artwork by ${cardData.artist}.`);
        }

        if (cardData.flavorText) {
            infos.push(`Fun fact: ${cardData.flavorText.substring(0, 50)}...`);
        }

        return infos.length > 0 ? infos[Math.floor(Math.random() * infos.length)] : '';
    }

    extractSetTheme(setData) {
        if (!setData) return 'various Pokemon';

        // This would be more sophisticated in a real implementation
        const themes = ['powerful Pokemon', 'rare cards', 'trainer cards', 'new evolutions'];

        return themes[Math.floor(Math.random() * themes.length)];
    }

    assessSetPopularity(setData) {
        if (!setData) return 'popular';

        // Simple popularity assessment based on available data
        const popularityIndicators = ['highly sought after', 'popular', 'well-regarded', 'collectible'];

        return popularityIndicators[Math.floor(Math.random() * popularityIndicators.length)];
    }

    getEnhancementStats() {
        return {
            types: Object.keys(this.enhancementTypes),
            templates: Object.keys(this.responseTemplates),
            confidenceThresholds: this.confidenceThresholds
        };
    }

    // Batch enhancement for multiple responses
    async enhanceBatch(contexts, apiDataMap = {}) {
        const results = [];

        for (const context of contexts) {
            const apiData = apiDataMap[context.id] || {};
            const result = await this.enhanceResponse(context, apiData);
            results.push(result);
        }

        return {
            results,
            summary: {
                totalProcessed: results.length,
                successfulEnhancements: results.filter(r => r.enhancements.length > 0).length,
                averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
                totalApiCalls: results.reduce((sum, r) => sum + r.apiCallsUsed, 0)
            }
        };
    }
}

module.exports = APIEnhancedResponses;
