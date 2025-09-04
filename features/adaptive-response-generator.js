// Adaptive Response Generator
// Uses learning insights to generate increasingly better responses

class AdaptiveResponseGenerator {
    constructor(learningEngine) {
        this.learningEngine = learningEngine;
        
        // Response templates that evolve based on success
        this.responseTemplates = {
            showcase: {
                casual: [
                    "{greeting} {card_comment} {enthusiasm}",
                    "{card_comment} {market_hint} {engagement_question}"
                ],
                balanced: [
                    "{card_comment} {brief_analysis} {friendly_closer}",
                    "solid {card_name}! {market_context} {conversation_starter}"
                ],
                expert: [
                    "{technical_analysis} {market_position} {expert_insight}",
                    "{card_assessment} {comparative_analysis} {prediction}"
                ]
            },
            priceQuestion: {
                casual: [
                    "{card_name} {price_range} {simple_context}",
                    "{price} {trend_emoji} {casual_insight}"
                ],
                balanced: [
                    "{card_name}: {current_price} ({trend_detail}) {market_context}",
                    "{price_analysis} {recommendation} {engagement}"
                ],
                expert: [
                    "{detailed_price} {market_analysis} {technical_indicators}",
                    "{comprehensive_assessment} {prediction} {data_points}"
                ]
            },
            discussion: {
                casual: [
                    "{agreement/disagreement} {casual_opinion} {emoji}",
                    "{reaction} {simple_point} {question}"
                ],
                balanced: [
                    "{thoughtful_response} {supporting_data} {engagement}",
                    "{perspective} {market_example} {conversation_continuation}"
                ],
                expert: [
                    "{analytical_response} {data_driven_argument} {expert_perspective}",
                    "{market_thesis} {evidence} {strategic_insight}"
                ]
            }
        };
        
        // Component generators
        this.components = {
            greetings: {
                casual: ['yo', 'ayy', 'oh snap', 'sheesh', 'yooo'],
                balanced: ['nice', 'solid', 'great pull', 'excellent'],
                formal: ['impressive', 'congratulations on', 'excellent acquisition']
            },
            enthusiasm: {
                low: ['👌', 'decent', 'not bad'],
                medium: ['nice one!', 'solid pull!', 'looking good!'],
                high: ['🔥🔥🔥', 'HUGE W!', 'absolutely fire!!', 'LFG!!!']
            },
            marketContext: {
                bullish: ['trending up', 'gaining momentum', 'hot right now'],
                neutral: ['holding steady', 'stable market', 'consistent'],
                bearish: ['cooling off', 'finding support', 'good entry point']
            }
        };
    }
    
    // Generate adaptive response based on user profile and context
    async generateResponse(username, context) {
        // Get user profile and recommendations
        const profile = this.learningEngine.userProfiles.get(username);
        const recommendations = this.learningEngine.getResponseRecommendation(username, context);
        
        // Determine response strategy
        const strategy = this.determineStrategy(profile, recommendations, context);
        
        // Build response using learned patterns
        const response = await this.buildAdaptiveResponse(strategy, context, profile);
        
        // Track what we're trying
        const responseId = `resp_${Date.now()}`;
        await this.learningEngine.trackResponseEffectiveness(username, response, {
            ...context,
            strategy: strategy.type,
            components: strategy.components
        });
        
        return { response, responseId, strategy };
    }
    
    determineStrategy(profile, recommendations, context) {
        const strategy = {
            type: context.type || 'discussion',
            style: recommendations?.style || 'balanced',
            components: []
        };
        
        // Adapt based on user personality
        if (profile) {
            // Match user's formality
            if (profile.personality.formality < 0.3) {
                strategy.style = 'casual';
                strategy.components.push('slang', 'emojis');
            } else if (profile.personality.formality > 0.7) {
                strategy.style = 'expert';
                strategy.components.push('data', 'analysis');
            }
            
            // Match enthusiasm
            if (profile.personality.enthusiasm > 0.7) {
                strategy.components.push('high_energy', 'excitement');
            }
            
            // Add data for price-aware users
            if (profile.personality.priceAwareness > 0.6) {
                strategy.components.push('prices', 'market_data');
            }
            
            // Adjust for expertise
            if (profile.personality.expertise > 0.7) {
                strategy.components.push('technical', 'advanced');
            } else if (profile.personality.expertise < 0.3) {
                strategy.components.push('educational', 'simple');
            }
        }
        
        // Context-based adjustments
        if (context.isPriceQuestion) {
            strategy.type = 'priceQuestion';
            strategy.components.push('price_data', 'trend');
        } else if (context.hasImages) {
            strategy.type = 'showcase';
            strategy.components.push('visual_comment');
        }
        
        return strategy;
    }
    
    async buildAdaptiveResponse(strategy, context, profile) {
        const templates = this.responseTemplates[strategy.type][strategy.style];
        
        // Pick template based on what's worked before
        const template = this.selectBestTemplate(templates, profile);
        
        // Build response components
        const components = await this.generateComponents(strategy, context, profile);
        
        // Fill template
        let response = template;
        Object.entries(components).forEach(([key, value]) => {
            response = response.replace(`{${key}}`, value);
        });
        
        // Clean up any remaining placeholders
        response = response.replace(/\{[^}]+\}/g, '');
        
        // Apply learned optimizations
        response = this.applyLearnedOptimizations(response, profile);
        
        return response.trim();
    }
    
    selectBestTemplate(templates, profile) {
        if (!profile || profile.interactions < 3) {
            // For new users, pick randomly
            return templates[Math.floor(Math.random() * templates.length)];
        }
        
        // For known users, pick based on what worked before
        const successfulPatterns = profile.responsePreferences.successful || [];
        
        // Try to find a template matching successful patterns
        for (const template of templates) {
            const templatePattern = this.extractTemplatePattern(template);
            if (successfulPatterns.some(pattern => this.patternsMatch(pattern, templatePattern))) {
                return template;
            }
        }
        
        // Default to first template
        return templates[0];
    }
    
    async generateComponents(strategy, context, profile) {
        const components = {};
        
        // Greeting based on style
        if (strategy.components.includes('greeting')) {
            const greetings = this.components.greetings[strategy.style] || this.components.greetings.balanced;
            components.greeting = greetings[Math.floor(Math.random() * greetings.length)];
        }
        
        // Card-specific components
        if (context.cardName) {
            components.card_name = context.cardName;
            components.card_comment = this.generateCardComment(context.cardName, strategy.style);
        }
        
        // Price components
        if (context.priceData && strategy.components.includes('prices')) {
            components.current_price = `$${context.priceData.market}`;
            components.price_range = `$${context.priceData.low}-${context.priceData.high}`;
            components.trend_detail = context.priceData.trend > 0 ? 
                `+${context.priceData.trend}%` : `${context.priceData.trend}%`;
            components.trend_emoji = context.priceData.trend > 5 ? '📈' : 
                                    context.priceData.trend < -5 ? '📉' : '➡️';
        }
        
        // Market context
        if (strategy.components.includes('market_data')) {
            const marketSentiment = await this.determineMarketSentiment(context.cardName);
            components.market_context = this.components.marketContext[marketSentiment][
                Math.floor(Math.random() * this.components.marketContext[marketSentiment].length)
            ];
        }
        
        // Enthusiasm level
        if (strategy.components.includes('excitement')) {
            const enthusiasmLevel = profile?.personality.enthusiasm > 0.7 ? 'high' : 
                                  profile?.personality.enthusiasm < 0.3 ? 'low' : 'medium';
            const enthusiasmOptions = this.components.enthusiasm[enthusiasmLevel];
            components.enthusiasm = enthusiasmOptions[Math.floor(Math.random() * enthusiasmOptions.length)];
        }
        
        // Questions for engagement
        if (strategy.components.includes('engagement')) {
            components.engagement_question = this.generateEngagementQuestion(context, profile);
        }
        
        return components;
    }
    
    generateCardComment(cardName, style) {
        const comments = {
            casual: [
                `sick ${cardName}!`,
                `that ${cardName} tho 👀`,
                `${cardName} hits different`,
                `yooo ${cardName} goes crazy`
            ],
            balanced: [
                `solid ${cardName} pull`,
                `great ${cardName} find`,
                `nice ${cardName} addition`,
                `excellent ${cardName}`
            ],
            expert: [
                `exceptional ${cardName} specimen`,
                `premium ${cardName} acquisition`,
                `high-grade ${cardName}`,
                `investment-grade ${cardName}`
            ]
        };
        
        const options = comments[style] || comments.balanced;
        return options[Math.floor(Math.random() * options.length)];
    }
    
    generateEngagementQuestion(context, profile) {
        const questions = [];
        
        // Based on user interests
        if (profile?.interests.vintage > 5) {
            questions.push('you into vintage too?', 'got any WOTC gems?');
        }
        
        if (profile?.interests.investing > 3) {
            questions.push('holding or flipping?', 'what\'s your exit strategy?');
        }
        
        if (profile?.interests.collecting > 5) {
            questions.push('completing the set?', 'how\'s the collection coming?');
        }
        
        // Generic fallbacks
        questions.push(
            'what else you pulling?',
            'any other hits?',
            'what set you ripping?',
            'hunting anything specific?'
        );
        
        return questions[Math.floor(Math.random() * questions.length)];
    }
    
    async determineMarketSentiment(cardName) {
        if (!cardName) return 'neutral';
        
        const marketInsight = this.learningEngine.marketInsights.get(cardName);
        if (!marketInsight) return 'neutral';
        
        const recentSentiment = marketInsight.sentiment
            .filter(s => Date.now() - s.timestamp < 24 * 60 * 60 * 1000);
        
        if (recentSentiment.length === 0) return 'neutral';
        
        const sentimentCounts = { bullish: 0, bearish: 0, neutral: 0 };
        recentSentiment.forEach(s => sentimentCounts[s.sentiment]++);
        
        if (sentimentCounts.bullish > sentimentCounts.bearish) return 'bullish';
        if (sentimentCounts.bearish > sentimentCounts.bullish) return 'bearish';
        return 'neutral';
    }
    
    applyLearnedOptimizations(response, profile) {
        let optimized = response;
        
        // Apply length preference
        if (profile && profile.responsePreferences.avgLength) {
            const targetLength = profile.responsePreferences.avgLength;
            if (optimized.length > targetLength * 1.5) {
                // Trim if too long
                optimized = this.smartTrim(optimized, targetLength);
            }
        }
        
        // Apply successful patterns
        if (profile?.responsePreferences.successfulElements) {
            profile.responsePreferences.successfulElements.forEach(element => {
                if (element === 'emoji' && !optimized.match(/[\u{1F300}-\u{1F9FF}]/u)) {
                    // Add emoji if successful but missing
                    optimized += ' 🔥';
                }
                if (element === 'question' && !optimized.includes('?')) {
                    // Add question if helpful
                    optimized += ' you?';
                }
            });
        }
        
        return optimized;
    }
    
    smartTrim(text, targetLength) {
        if (text.length <= targetLength) return text;
        
        // Try to trim at sentence boundaries
        const sentences = text.split(/[.!?]\s+/);
        let trimmed = '';
        
        for (const sentence of sentences) {
            if (trimmed.length + sentence.length <= targetLength) {
                trimmed += (trimmed ? '. ' : '') + sentence;
            } else {
                break;
            }
        }
        
        return trimmed || text.substring(0, targetLength);
    }
    
    extractTemplatePattern(template) {
        return template.replace(/\{[^}]+\}/g, '*');
    }
    
    patternsMatch(pattern1, pattern2) {
        return pattern1 === pattern2 || 
               (pattern1.includes('*') && pattern2.includes('*'));
    }
}

module.exports = AdaptiveResponseGenerator;