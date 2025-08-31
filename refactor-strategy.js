// Refactored generateContextualResponse with deterministic strategy picking

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
    const hasStats = false; // Will be set if we get price data
    
    // Determine post type
    const isShowingOff = textLower.includes('pull') || textLower.includes('got') || 
                        textLower.includes('finally') || textLower.includes('grail') ||
                        (hasImages && (textLower.includes('collection') || textLower.includes('mail')));
    
    const isRaffle = textLower.includes('spot') && textLower.includes('$') ||
                    textLower.includes('raffle') || textLower.includes('break') ||
                    textLower.includes('giveaway') || textLower.includes('retweet to enter');
    
    // Skip raffles
    if (isRaffle) {
        console.log(`   🎲 [Raffle/Giveaway] Skipping`);
        return null;
    }
    
    // Get thread context if available
    const threadDepth = visualData?.threadContext?.threadLength || 0;
    
    // Build features object for strategy picker
    const features = {
        isPriceQ,
        hasStats, // Will update if we get price data
        hasImages,
        cardEntities,
        valueScore: 0, // Calculate if needed
        threadDepth,
        sentiment: sentimentAnalysis.sentiment,
        isShowingOff,
        hasVisualData: !!visualData
    };
    
    // Pick strategy deterministically
    const strategyDecision = this.strategyPicker.pickStrategy(features);
    console.log(`   📋 Strategy: ${strategyDecision.strategy} (${strategyDecision.confidence}) - ${strategyDecision.reason}`);
    
    // Execute chosen strategy
    switch (strategyDecision.strategy) {
        case 'price':
            // Try to get price data with stats
            if (this.priceEngineReady && cardEntities.length > 0) {
                const priceResponse = await this.generatePriceAwareResponse(tweetContent, username, hasImages);
                if (priceResponse) {
                    console.log(`   💰 [Price] "${priceResponse}"`);
                    return priceResponse;
                }
            }
            // No stats available - ask for details
            if (isPriceQ) {
                const followUp = "need set + number for accurate price (e.g., EVS 215/203)";
                console.log(`   💰 [Price Follow-up] "${followUp}"`);
                return followUp;
            }
            break;
            
        case 'visual':
            if (visualData && this.visualAnalyzer) {
                const visualResponse = this.visualAnalyzer.generateVisualResponse(tweetContent, visualData);
                if (visualResponse) {
                    console.log(`   🖼️ [Visual] "${visualResponse}"`);
                    return visualResponse;
                }
            }
            break;
            
        case 'authority':
            const authorityResponse = this.authorityResponses.generateAuthorityResponse(tweetContent, hasImages);
            if (authorityResponse && this.authorityResponses.isExpertLevel(authorityResponse)) {
                console.log(`   👑 [Authority] "${authorityResponse}"`);
                return authorityResponse;
            }
            break;
            
        case 'thread_aware':
            // This should have been handled by generateThreadAwareResponse
            // Fallback to human-like
            
        case 'human_like':
            if (isShowingOff || features.sentiment === 'positive') {
                const humanResponse = await this.humanLike.generateHumanResponse(tweetContent, { 
                    hasImages, 
                    username,
                    imageUrl: visualData?.imageUrl 
                });
                if (humanResponse && !humanResponse.includes('tcgplayer has it at')) {
                    console.log(`   💬 [Human] "${humanResponse}"`);
                    return humanResponse;
                }
            }
            break;
            
        case 'fallback':
            // Try context analyzer as last resort
            const contextualResponse = this.contextAnalyzer.generateContextualResponse(tweetContent, hasImages);
            if (contextualResponse) {
                console.log(`   📊 [Context] "${contextualResponse}"`);
                return contextualResponse;
            }
            break;
    }
    
    // If all strategies fail, try Gemini or LM Studio
    if (this.geminiFailures < 5) {
        try {
            const prompt = this.buildGeminiPrompt(username, tweetContent, hasImages, features);
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
    
    // Final fallback to LM Studio
    if (this.lmStudioAI.available) {
        try {
            const messages = this.buildLMStudioMessages(username, tweetContent, hasImages, features);
            const response = await this.lmStudioAI.generateDirectResponse(messages);
            if (response) {
                console.log(`   🤖 [LM Studio] "${response}"`);
                return response;
            }
        } catch (error) {
            console.log(`   ⚠️ LM Studio error: ${error.message}`);
        }
    }
    
    return null;
}