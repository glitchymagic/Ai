class ResponseQualityChecker {
    constructor() {
        // Grammar patterns to fix
        this.grammarPatterns = [
            { pattern: /\ba\s+(a|e|i|o|u)/gi, replacement: 'an $1' }, // a -> an before vowels
            { pattern: /\ban\s+(b|c|d|f|g|h|j|k|l|m|n|p|q|r|s|t|v|w|x|y|z)/gi, replacement: 'a $1' }, // an -> a before consonants
            { pattern: /\bdont\b/gi, replacement: "don't" },
            { pattern: /\bcant\b/gi, replacement: "can't" },
            { pattern: /\bwont\b/gi, replacement: "won't" },
            { pattern: /\bisnt\b/gi, replacement: "isn't" },
            { pattern: /\barent\b/gi, replacement: "aren't" },
            { pattern: /\bhasnt\b/gi, replacement: "hasn't" },
            { pattern: /\bhavent\b/gi, replacement: "haven't" },
            { pattern: /\bdidnt\b/gi, replacement: "didn't" },
            { pattern: /\bwouldnt\b/gi, replacement: "wouldn't" },
            { pattern: /\bcouldnt\b/gi, replacement: "couldn't" },
            { pattern: /\bshouldnt\b/gi, replacement: "shouldn't" },
            { pattern: /\bteh\b/gi, replacement: 'the' },
            { pattern: /\balot\b/gi, replacement: 'a lot' },
            { pattern: /\bthier\b/gi, replacement: 'their' },
            { pattern: /\brecieve\b/gi, replacement: 'receive' },
            { pattern: /\bseperate\b/gi, replacement: 'separate' },
            { pattern: /\bdefinately\b/gi, replacement: 'definitely' },
            { pattern: /\baccomodate\b/gi, replacement: 'accommodate' },
            { pattern: /\boccured\b/gi, replacement: 'occurred' },
            { pattern: /\bbegining\b/gi, replacement: 'beginning' },
            { pattern: /\bexistant\b/gi, replacement: 'existent' },
            { pattern: /\boccassion\b/gi, replacement: 'occasion' },
            { pattern: /\bcomparision\b/gi, replacement: 'comparison' },
            { pattern: /\bneccessary\b/gi, replacement: 'necessary' },
            { pattern: /\bpriviledge\b/gi, replacement: 'privilege' },
            { pattern: /\brecommendation\b/gi, replacement: 'recommendation' },
            { pattern: /\breccommend\b/gi, replacement: 'recommend' }
        ];

        // Generic response patterns to avoid
        this.genericPatterns = [
            /\bnice\b/i,
            /\bcool\b/i,
            /\bgreat\b/i,
            /\bawesome\b/i,
            /\bamazing\b/i,
            /\blooks good\b/i,
            /\blooks nice\b/i,
            /\blooks cool\b/i,
            /\blooks great\b/i,
            /\blooks awesome\b/i,
            /\blooks amazing\b/i
        ];

        // Words that indicate uncertainty (should avoid in price responses)
        this.uncertaintyWords = [
            'maybe', 'perhaps', 'might', 'could', 'possibly', 'probably',
            'i think', 'i believe', 'seems like', 'looks like', 'appears to be',
            'around', 'about', 'roughly', 'approximately', 'estimated'
        ];
    }

    async checkAndImprove(response, context = {}) {
        try {
            const result = {
                originalResponse: response,
                response: response,
                validation: {
                    valid: true,
                    score: 1.0,
                    issues: [],
                    improvements: []
                },
                wasImproved: false
            };

            // Run all checks
            const grammarResult = this.checkGrammar(response);
            const relevanceResult = this.checkRelevance(response, context);
            const specificityResult = this.checkSpecificity(response, context);
            const flowResult = this.checkFlow(response, context);
            const toneResult = this.checkTone(response, context);

            // Calculate weighted score
            const grammarScore = grammarResult.score;
            const relevanceScore = relevanceResult.score;
            const specificityScore = specificityResult.score;
            const flowScore = flowResult.score;
            const toneScore = toneResult.score;

            const overallScore = (
                grammarScore * 0.25 +
                relevanceScore * 0.35 +
                specificityScore * 0.20 +
                flowScore * 0.10 +
                toneScore * 0.10
            );

            result.validation.score = overallScore;

            // Collect all issues
            result.validation.issues = [
                ...grammarResult.issues,
                ...relevanceResult.issues,
                ...specificityResult.issues,
                ...flowResult.issues,
                ...toneResult.issues
            ];

            result.validation.improvements = [
                ...grammarResult.improvements,
                ...relevanceResult.improvements,
                ...specificityResult.improvements,
                ...flowResult.improvements,
                ...toneResult.improvements
            ];

            // Apply automatic improvements
            let improvedResponse = response;
            if (grammarResult.improvedResponse) {
                improvedResponse = grammarResult.improvedResponse;
                result.wasImproved = true;
            }

            // Check if response needs regeneration
            if (overallScore < 0.6) {
                result.validation.valid = false;
                result.response = improvedResponse;
                return result;
            }

            // For scores 0.6-0.8, apply additional improvements
            if (overallScore >= 0.6 && overallScore < 0.8) {
                improvedResponse = this.applyAdditionalImprovements(improvedResponse, context);
                if (improvedResponse !== response) {
                    result.wasImproved = true;
                }
            }

            result.response = improvedResponse;
            return result;

        } catch (error) {
            console.error('ResponseQualityChecker error:', error);
            return {
                originalResponse: response,
                response: response,
                validation: {
                    valid: true, // Allow response to go through on error
                    score: 0.8,
                    issues: [`Quality check error: ${error.message}`],
                    improvements: []
                },
                wasImproved: false
            };
        }
    }

    checkGrammar(response) {
        const result = {
            score: 1.0,
            issues: [],
            improvements: [],
            improvedResponse: null
        };

        let improved = response;
        let hasImprovements = false;

        // Check for repeated words
        const words = response.toLowerCase().split(/\s+/);
        for (let i = 0; i < words.length - 1; i++) {
            if (words[i] === words[i + 1] && words[i].length > 2) {
                result.issues.push(`Repeated word: "${words[i]}"`);
                result.score -= 0.1;
                // Remove repeated word
                const regex = new RegExp(`\\b${words[i]}\\s+\\b${words[i]}\\b`, 'gi');
                improved = improved.replace(regex, words[i]);
                hasImprovements = true;
            }
        }

        // Apply grammar pattern fixes
        for (const pattern of this.grammarPatterns) {
            if (pattern.pattern.test(improved)) {
                improved = improved.replace(pattern.pattern, pattern.replacement);
                result.improvements.push(`Fixed grammar: ${pattern.pattern.source}`);
                hasImprovements = true;
            }
        }

        // Check for sentence fragments
        const sentences = improved.split(/[.!?]+/);
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (trimmed.length > 0 && trimmed.length < 5 && !trimmed.includes('!') && !trimmed.includes('?')) {
                result.issues.push('Possible sentence fragment detected');
                result.score -= 0.05;
            }
        }

        if (hasImprovements) {
            result.improvedResponse = improved;
        }

        // Cap score at 1.0 and 0.0
        result.score = Math.max(0, Math.min(1, result.score));

        return result;
    }

    checkRelevance(response, context) {
        const result = {
            score: 1.0,
            issues: [],
            improvements: []
        };

        if (!context.originalTweet) {
            return result; // No context to check against
        }

        const original = context.originalTweet.toLowerCase();
        const resp = response.toLowerCase();

        // Check if response addresses the original tweet
        const originalWords = original.split(/\s+/).filter(word => word.length > 3);
        let relevantWords = 0;

        for (const word of originalWords) {
            if (resp.includes(word)) {
                relevantWords++;
            }
        }

        const relevanceRatio = originalWords.length > 0 ? relevantWords / originalWords.length : 1;

        if (relevanceRatio < 0.3) {
            result.issues.push('Response may not be relevant to original tweet');
            result.score -= 0.2;
        }

        // Check for questions in original that should be answered
        if (original.includes('?') || original.includes('what') || original.includes('how') ||
            original.includes('worth') || original.includes('price') || original.includes('value')) {
            if (!resp.includes('worth') && !resp.includes('price') && !resp.includes('value') &&
                !resp.includes('check') && !resp.includes('around') && !resp.includes('$')) {
                result.issues.push('Original tweet appears to ask a question but response may not answer it');
                result.score -= 0.15;
            }
        }

        // Check visual context
        if (context.hasImages && context.visualData?.visionAnalysis?.cards) {
            const cardNames = context.visualData.visionAnalysis.cards.map(card => card.name?.toLowerCase()).filter(Boolean);
            let cardMentions = 0;

            for (const cardName of cardNames) {
                if (resp.includes(cardName)) {
                    cardMentions++;
                }
            }

            if (cardMentions === 0 && cardNames.length > 0) {
                result.issues.push('Response should reference the card(s) shown in the image');
                result.score -= 0.1;
            }
        }

        result.score = Math.max(0, Math.min(1, result.score));
        return result;
    }

    checkSpecificity(response, context) {
        const result = {
            score: 1.0,
            issues: [],
            improvements: []
        };

        // Check for generic responses
        const resp = response.toLowerCase();
        let genericMatches = 0;

        for (const pattern of this.genericPatterns) {
            if (pattern.test(resp)) {
                genericMatches++;
            }
        }

        if (genericMatches > 0) {
            result.issues.push('Response contains generic praise - consider being more specific');
            result.score -= genericMatches * 0.1;
        }

        // Check for specific card mentions
        const hasCardReference = resp.includes('charizard') || resp.includes('pikachu') ||
                                resp.includes('vmax') || resp.includes('vstar') ||
                                resp.includes('alt art') || resp.includes('secret rare') ||
                                /\$\d+/.test(resp); // Price reference

        if (!hasCardReference && context.conversationType === 'priceResponse') {
            result.issues.push('Price response should include specific card or price information');
            result.score -= 0.15;
        }

        // Check word variety
        const words = resp.split(/\s+/);
        const uniqueWords = new Set(words);
        const varietyRatio = uniqueWords.size / words.length;

        if (varietyRatio < 0.6 && words.length > 10) {
            result.issues.push('Response lacks word variety');
            result.score -= 0.05;
        }

        // Check for uncertainty words in price responses
        if (context.conversationType === 'priceResponse') {
            let uncertaintyCount = 0;
            for (const word of this.uncertaintyWords) {
                if (resp.includes(word)) {
                    uncertaintyCount++;
                }
            }
            if (uncertaintyCount > 0) {
                result.issues.push('Price response contains uncertainty - be more confident');
                result.score -= uncertaintyCount * 0.1;
            }
        }

        result.score = Math.max(0, Math.min(1, result.score));
        return result;
    }

    checkFlow(response, context) {
        const result = {
            score: 1.0,
            issues: [],
            improvements: []
        };

        const resp = response.toLowerCase();

        // Check for forced transitions
        const forcedTransitions = ['by the way', 'speaking of', 'that reminds me', 'anyway'];
        for (const transition of forcedTransitions) {
            if (resp.includes(transition)) {
                result.issues.push(`Forced transition detected: "${transition}"`);
                result.score -= 0.1;
            }
        }

        // Check for natural follow-ups (questions are good)
        const hasQuestion = resp.includes('?') || resp.includes('right?') || resp.includes('yeah?');
        if (hasQuestion) {
            result.score += 0.05; // Slight bonus for questions
        }

        // Check thread context
        if (context.threadContext && context.threadContext.length > 0) {
            // Avoid repeating similar responses in threads
            const previousResponses = context.threadContext.map(msg => msg.toLowerCase());
            for (const prevResp of previousResponses) {
                const similarity = this.calculateSimilarity(resp, prevResp);
                if (similarity > 0.7) {
                    result.issues.push('Response too similar to previous message in thread');
                    result.score -= 0.1;
                    break;
                }
            }
        }

        result.score = Math.max(0, Math.min(1, result.score));
        return result;
    }

    checkTone(response, context) {
        const result = {
            score: 1.0,
            issues: [],
            improvements: []
        };

        if (!context.originalTweet) {
            return result;
        }

        const original = context.originalTweet.toLowerCase();
        const resp = response.toLowerCase();

        // Analyze energy levels
        const originalEnergy = this.analyzeEnergy(original);
        const responseEnergy = this.analyzeEnergy(resp);

        // Energy should roughly match (within 1 level)
        const energyDiff = Math.abs(originalEnergy - responseEnergy);
        if (energyDiff > 1) {
            result.issues.push('Response energy level does not match original tweet');
            result.score -= 0.1;
        }

        // Check exclamation usage
        const originalExclamations = (original.match(/!/g) || []).length;
        const responseExclamations = (resp.match(/!/g) || []).length;

        if (originalExclamations > 2 && responseExclamations === 0) {
            result.issues.push('Original tweet is excited but response lacks enthusiasm');
            result.score -= 0.05;
        }

        result.score = Math.max(0, Math.min(1, result.score));
        return result;
    }

    analyzeEnergy(text) {
        let energy = 1; // 0 = low, 1 = medium, 2 = high

        // High energy indicators
        if (text.includes('!!!') || text.includes('omg') || text.includes('insane') ||
            text.includes('crazy') || text.includes('unbelievable') || text.includes('wtf') ||
            (text.match(/!/g) || []).length > 2) {
            energy = 2;
        }
        // Low energy indicators
        else if (text.includes('meh') || text.includes('whatever') || text.includes('idk') ||
                 text.includes('kinda') || text.length < 20) {
            energy = 0;
        }

        return energy;
    }

    calculateSimilarity(text1, text2) {
        // Simple word overlap similarity
        const words1 = new Set(text1.split(/\s+/));
        const words2 = new Set(text2.split(/\s+/));

        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size;
    }

    applyAdditionalImprovements(response, context) {
        let improved = response;

        // Add more specificity if needed
        if (context.visualData?.visionAnalysis?.cards && context.visualData.visionAnalysis.cards.length > 0) {
            const cardName = context.visualData.visionAnalysis.cards[0].name;
            if (cardName && !improved.toLowerCase().includes(cardName.toLowerCase())) {
                // Add card reference if missing
                improved = improved.replace(/^(.*?)(\.|\!|\?|$)/, `$1 about that ${cardName}$2`);
            }
        }

        // Add price context if it's a price question
        if (context.originalTweet && context.originalTweet.toLowerCase().includes('worth') &&
            !improved.toLowerCase().includes('worth') && !improved.toLowerCase().includes('price')) {
            improved += ' Check TCGPlayer for current market value!';
        }

        return improved;
    }
}

module.exports = ResponseQualityChecker;
