    // Deterministic Response Generator
    async generateContextualResponse(username, tweetContent, hasImages = false, visualData = null) {
        // 0) Sentiment + anti-scam hard gates
        const sentiment = this.sentimentAnalyzer.analyzeSentiment(tweetContent);
        console.log(`   📊 Sentiment: ${sentiment.sentiment} (${sentiment.confidence}) - ${sentiment.reason}`);
        
        const sentimentGate = this.sentimentAnalyzer.shouldEngageWithSentiment(sentiment);
        if (!sentimentGate.engage) {
            console.log(`   🚫 Skipping due to sentiment: ${sentimentGate.reason}`);
            return null;
        }

        const scam = this.antiScam.shouldSkip(tweetContent, username);
        if (scam.skip) { 
            console.log(`   🚫 Anti-scam skip: ${scam.reason}`); 
            return null; 
        }

        // Check for raffles
        const textLower = tweetContent.toLowerCase();
        const isRaffle = textLower.includes('spot') && textLower.includes('$') ||
                        textLower.includes('raffle') || textLower.includes('break') ||
                        textLower.includes('giveaway') || textLower.includes('retweet to enter');
        
        if (isRaffle) {
            console.log(`   🎲 [Raffle/Giveaway] Skipping`);
            return null;
        }

        // 1) Features for strategy
        const isPriceQ = /\b(worth|price|value|how much|going for|\$)\b/i.test(textLower);
        const ents = this.extractCardEntities ? this.extractCardEntities(tweetContent) : [];
        const cardEntities = ents;
        const threadLen = visualData?.threadContext?.threadLength || 0;
        const hasStats = !!(this.priceEngineReady && ents.length > 0);
        
        const isShowingOff = textLower.includes('pull') || textLower.includes('got') || 
                            textLower.includes('finally') || textLower.includes('grail') ||
                            (hasImages && (textLower.includes('collection') || textLower.includes('mail')));
        
        const feats = {
            isPriceQ, 
            hasStats, 
            hasImages, 
            cardEntities,
            valueScore: 0, // Can be calculated if needed
            threadDepth: threadLen,
            sentiment: sentiment.sentiment,
            isShowingOff,
            hasVisualData: !!visualData
        };

        // 2) Pick strategy deterministically
        const strategy = this.strategyPicker.pickStrategy(feats);
        console.log(`   🎛️ Strategy: ${strategy.strategy} (${strategy.confidence}) - ${strategy.reason}`);

        // Set seed for authority responses using tweet ID or content hash
        const tweetId = visualData?.tweetId || this.authorityResponses.hashString(tweetContent);
        this.authorityResponses.setSeed(tweetId);

        // 3) Execute strategy
        let response = null;
        let statPresent = false;

        switch (strategy.strategy) {
            case 'price': {
                if (this.priceEngineReady && cardEntities.length > 0) {
                    response = await this.generatePriceAwareResponse(tweetContent, username, hasImages);
                    if (response) {
                        statPresent = response.includes('7d') || response.includes('30d') || response.includes('last $');
                    }
                }
                if (!response && isPriceQ) {
                    // No stats - ask for details
                    response = cardEntities.length > 0 ? 
                        "need set + number for accurate price (e.g., EVS 215/203)" :
                        "which card? need specific name + set for pricing";
                }
                break;
            }
            
            case 'visual': {
                if (visualData && this.visualAnalyzer) {
                    response = this.visualAnalyzer.generateVisualResponse(tweetContent, visualData);
                }
                break;
            }
            
            case 'authority': {
                response = this.authorityResponses.generateAuthorityResponse(tweetContent, hasImages);
                if (response && !this.authorityResponses.isExpertLevel(response)) {
                    response = null; // Only use expert-level responses
                }
                break;
            }
            
            case 'thread_aware': {
                // Should already be handled by generateThreadAwareResponse upstream
                // Fallback to authority
                response = this.authorityResponses.generateAuthorityResponse(tweetContent, hasImages);
                break;
            }
            
            case 'human_like': {
                if (isShowingOff || sentiment.sentiment === 'positive') {
                    response = await this.humanLike.generateHumanResponse(tweetContent, { 
                        hasImages, 
                        username, 
                        imageUrl: visualData?.imageUrl 
                    });
                    // Filter out inappropriate responses
                    if (response && (response.includes('jealous') || response.includes('tcgplayer'))) {
                        response = null;
                    }
                }
                break;
            }
            
            case 'fallback': {
                // Try context analyzer as last resort
                response = this.contextAnalyzer.generateContextualResponse(tweetContent, hasImages);
                break;
            }
        }

        // Log decision trace
        if (this.decisionTrace && response) {
            await this.decisionTrace.logDecision({
                tweetId,
                username,
                tweetText: tweetContent,
                decision: { engage: true, action: 'reply', score: 0 },
                features: {
                    ageDescription: 'N/A',
                    timestampReason: 'N/A',
                    sentiment: sentiment.sentiment,
                    sentimentConfidence: sentiment.confidence,
                    isPriceQ,
                    cardEntities: cardEntities.length,
                    hasImages,
                    hasStats
                },
                strategy: strategy,
                response
            });
        }

        if (!response) {
            console.log(`   ❌ No response from ${strategy.strategy} strategy`);
            
            // Try AI models as absolute last resort
            response = await this.tryAIModels(username, tweetContent, hasImages, feats);
        }

        return response ? clampTweet(response, 280) : null;
    }
    
    async tryAIModels(username, tweetContent, hasImages, features) {
        // Try Gemini
        if (this.geminiFailures < 5) {
            try {
                const prompt = `Pokemon TCG expert. @${username}: "${tweetContent}"
${hasImages ? 'They posted an image.' : ''}
Reply knowledgeably and specifically. Be concise. No hashtags.`;
                
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