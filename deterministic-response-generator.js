// Deterministic Response Generator - Replaces RNG with Strategy-based selection

    async generateContextualResponse(username, tweetContent, hasImages = false, visualData = null) {
        // FIRST: Analyze sentiment to avoid responding to complaints/negative posts
        const sentimentAnalysis = this.sentimentAnalyzer.analyzeSentiment(tweetContent);
        console.log(`   📊 Sentiment: ${sentimentAnalysis.sentiment} (${sentimentAnalysis.confidence}) - ${sentimentAnalysis.reason}`);
        
        const engagementDecision = this.sentimentAnalyzer.shouldEngageWithSentiment(sentimentAnalysis);
        if (!engagementDecision.engage) {
            console.log(`   🚫 Skipping due to sentiment: ${engagementDecision.reason}`);
            return null;
        }
        
        // SECOND: Check for scams
        const scamCheck = this.antiScam.shouldSkip(tweetContent, username);
        if (scamCheck.skip) {
            console.log(`   🚫 Anti-scam skip: ${scamCheck.reason}`);
            return null;
        }
        
        // THIRD: Extract features for strategy decision
        const textLower = tweetContent.toLowerCase();
        const cardEntities = this.extractCardEntities(tweetContent);
        const isPriceQ = /\b(worth|price|value|how much|going for|\$)\b/i.test(textLower);
        const isShowingCards = hasImages && (textLower.includes('pull') || textLower.includes('got') || 
                              textLower.includes('collection') || textLower.includes('mail') ||
                              textLower.includes('new') || textLower.includes('arrived'));
        
        // Skip raffles/giveaways
        const isRaffle = textLower.includes('spot') && textLower.includes('$') ||
                        textLower.includes('raffle') || textLower.includes('break') ||
                        textLower.includes('giveaway') || textLower.includes('retweet to enter');
        if (isRaffle) {
            console.log(`   🎲 [Raffle/Giveaway] Skipping`);
            return null;
        }
        
        // Build features for strategy picker
        const features = {
            isPriceQ,
            hasStats: false, // Will be set if price data available
            hasImages,
            cardEntities,
            valueScore: 0, // Can be calculated if needed
            threadDepth: 0, // From thread context if available
            sentiment: sentimentAnalysis.sentiment,
            isShowingOff: isShowingCards,
            hasVisualData: !!visualData
        };
        
        // Pick strategy deterministically
        const strategyDecision = this.strategyPicker.pickStrategy(features);
        console.log(`   📋 Strategy: ${strategyDecision.strategy} (${strategyDecision.confidence}) - ${strategyDecision.reason}`);
        
        // Set seed for authority responses
        if (visualData?.tweetId) {
            this.authorityResponses.setSeed(visualData.tweetId);
        }
        
        // Execute chosen strategy
        let response = null;
        
        switch (strategyDecision.strategy) {
            case 'price':
                if (isPriceQ && this.priceEngineReady && cardEntities.length > 0) {
                    response = await this.generatePriceAwareResponse(tweetContent, username, hasImages);
                    if (response) {
                        console.log(`   💰 [Price] "${response}"`);
                        return response;
                    }
                }
                // No stats - ask for details
                if (isPriceQ) {
                    response = cardEntities.length > 0 ? 
                        "need set + number for accurate price (e.g., EVS 215/203)" :
                        "which card? need specific name + set for pricing";
                    console.log(`   💰 [Price Follow-up] "${response}"`);
                    return response;
                }
                break;
                
            case 'visual':
                if (visualData && this.visualAnalyzer) {
                    response = this.visualAnalyzer.generateVisualResponse(tweetContent, visualData);
                    if (response) {
                        console.log(`   🖼️ [Visual] "${response}"`);
                        return response;
                    }
                }
                break;
                
            case 'authority':
                response = this.authorityResponses.generateAuthorityResponse(tweetContent, hasImages);
                if (response && this.authorityResponses.isExpertLevel(response)) {
                    console.log(`   👑 [Authority] "${response}"`);
                    return response;
                }
                break;
                
            case 'human_like':
                if (features.isShowingOff && features.sentiment !== 'negative') {
                    response = await this.humanLike.generateHumanResponse(tweetContent, { 
                        hasImages, 
                        username,
                        imageUrl: visualData?.imageUrl 
                    });
                    if (response && !response.includes('jealous') && !response.includes('tcgplayer')) {
                        console.log(`   💬 [Human] "${response}"`);
                        return response;
                    }
                }
                break;
                
            case 'fallback':
                // Try context analyzer
                response = this.contextAnalyzer.generateContextualResponse(tweetContent, hasImages);
                if (response) {
                    console.log(`   📊 [Context] "${response}"`);
                    return response;
                }
                break;
        }
        
        // If strategy didn't produce response, try fallback strategy
        if (!response && strategyDecision.strategy !== 'fallback') {
            const fallbackStrategy = this.strategyPicker.getWeightedFallback(strategyDecision.strategy, features);
            console.log(`   🔄 Fallback strategy: ${fallbackStrategy.strategy}`);
            
            // Recursive call with fallback (max depth 1)
            features._forcedStrategy = fallbackStrategy.strategy;
            return this.generateContextualResponse(username, tweetContent, hasImages, visualData);
        }
        
        // Last resort: Try AI models
        if (!response) {
            response = await this.tryAIModels(username, tweetContent, hasImages, features);
        }
        
        return response;
    }
    
    async tryAIModels(username, tweetContent, hasImages, features) {
        // Try Gemini
        if (this.geminiFailures < 5) {
            try {
                const prompt = this.buildContextAwarePrompt(username, tweetContent, hasImages, features);
                const result = await model.generateContent(prompt);
                let response = result.response.text().trim()
                    .replace(/^[\"']|[\"']$/g, '')
                    .replace(/#\w+/g, '')
                    .split('\n')[0]
                    .trim();
                
                response = clampTweet(response, 280);
                console.log(`   🤖 [Gemini] "${response}"`);
                this.geminiFailures = 0;
                return response;
                
            } catch (error) {
                this.geminiFailures++;
                console.log(`   ⚠️ Gemini failed, trying LM Studio...`);
            }
        }
        
        // Try LM Studio
        if (this.lmStudioAI.available) {
            try {
                const messages = [{
                    role: "system",
                    content: "Pokemon TCG collector. Be concise, specific, knowledgeable. No hashtags."
                }, {
                    role: "user",
                    content: `@${username}: "${tweetContent}". ${hasImages ? 'With image.' : ''} Reply:`
                }];
                
                const response = await this.lmStudioAI.generateDirectResponse(messages);
                if (response) {
                    const cleaned = response.replace(/^["']|["']$/g, '').trim();
                    console.log(`   🤖 [LM Studio] "${cleaned}"`);
                    return cleaned;
                }
            } catch (error) {
                console.log(`   ⚠️ LM Studio error: ${error.message}`);
            }
        }
        
        return null;
    }
    
    buildContextAwarePrompt(username, tweetContent, hasImages, features) {
        const isPokemonRelated = this.contentFilter.isPokemonRelated(tweetContent.toLowerCase());
        
        if (features.isPriceQ) {
            return `Pokemon TCG price expert. @${username} asks: "${tweetContent}"
Reply with specific market insight. If missing info, ask for set/number/condition.
Be concise. No hashtags.`;
        }
        
        if (features.isShowingOff && hasImages) {
            return `Pokemon collector seeing someone's pulls. @${username}: "${tweetContent}"
React genuinely. Comment on specific cards if mentioned. Use collector slang sparingly.
Be concise. No hashtags.`;
        }
        
        return `Pokemon TCG expert. @${username}: "${tweetContent}"
${hasImages ? 'They posted an image.' : ''}
Reply knowledgeably and specifically. Be concise. No hashtags.`;
    }