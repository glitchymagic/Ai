class ConversationFollowUp {
    constructor() {
        this.followUpPatterns = {
            priceQuestion: [
                "Have you checked TCGPlayer for current market prices?",
                "What's your condition like on that card?",
                "Are you looking to sell it or just curious about the value?",
                "Any specific edition or variant of that card?"
            ],
            cardQuestion: [
                "What set is that card from?",
                "Got a picture? I'd love to see it!",
                "How's the condition? Any wear or tear?",
                "Is it graded or raw?"
            ],
            showcaseResponse: [
                "How did you pull that one?",
                "What's your favorite card from your collection?",
                "Been collecting Pokemon long?",
                "What's the story behind that card?"
            ],
            gradingQuestion: [
                "Which grading service are you thinking about using?",
                "What's the current market value before grading?",
                "Have you gotten cards graded before?",
                "Planning to sell it after grading?"
            ],
            eventQuestion: [
                "What format was the tournament?",
                "How was the prize pool?",
                "What's your favorite deck to play?",
                "How often do you compete?"
            ],
            tradeInterest: [
                "What are you looking for in return?",
                "Got a specific card or set you're collecting?",
                "What's your favorite trade you've made?",
                "How do you usually value trades?"
            ]
        };

        this.questionStarters = [
            "What's your",
            "How did you",
            "Have you ever",
            "What's the",
            "How do you",
            "What's your favorite",
            "How long have you",
            "What's the story behind"
        ];

        this.conversationFlows = {
            price_discussion: [
                "check_current_prices",
                "ask_condition",
                "discuss_market_trends",
                "ask_selling_intent"
            ],
            card_identification: [
                "ask_for_image",
                "identify_card",
                "discuss_value",
                "ask_collection_context"
            ],
            showcase: [
                "express_appreciation",
                "ask_origin_story",
                "discuss_collection",
                "ask_favorites"
            ],
            grading: [
                "ask_service_preference",
                "discuss_costs",
                "ask_experience",
                "discuss_benefits"
            ]
        };
    }

    async initialize() {
        try {
            // Nothing to load yet; keeping interface consistent with other modules
            this._conversations = this._conversations || new Map();
            this._isTyping = false;
            return true;
        } catch (e) {
            return false;
        }
    }

    getStats() {
        const active = this._conversations ? this._conversations.size : 0;
        const withQuestions = (() => {
            if (!this._conversations) return 0;
            let count = 0;
            for (const [, rec] of this._conversations) {
                const texts = (rec.messages || []).slice(-3).join(' ').toLowerCase();
                if (/[?]/.test(texts)) count++;
            }
            return count;
        })();

        return {
            active,
            withQuestions,
            patternGroups: Object.keys(this.followUpPatterns).length,
            totalPatterns: Object.values(this.followUpPatterns).reduce((sum, arr) => sum + arr.length, 0),
            flows: Object.keys(this.conversationFlows).length
        };
    }

    generateFollowUp(context, conversationHistory = [], intent = null) {
        const result = {
            shouldFollowUp: false,
            followUpText: null,
            followUpType: null,
            confidence: 0.5
        };

        // Don't follow up if conversation is too short
        if (conversationHistory.length < 2) {
            return result;
        }

        // Don't follow up if last message was already a question
        const lastMessage = conversationHistory[conversationHistory.length - 1];
        if (this.isQuestion(lastMessage)) {
            return result;
        }

        // Determine follow-up strategy based on intent
        const strategy = this.determineFollowUpStrategy(context, conversationHistory, intent);

        if (!strategy || strategy.confidence < 0.3) {
            return result;
        }

        result.shouldFollowUp = true;
        result.followUpText = strategy.text;
        result.followUpType = strategy.type;
        result.confidence = strategy.confidence;

        return result;
    }

    determineFollowUpStrategy(context, conversationHistory, intent) {
        const lastFewMessages = conversationHistory.slice(-3);
        const conversationText = lastFewMessages.join(' ').toLowerCase();

        // Price-related follow-ups
        if (intent === 'priceInquiry' || conversationText.includes('worth') || conversationText.includes('price')) {
            return this.generatePriceFollowUp(context, conversationText);
        }

        // Card identification follow-ups
        if (intent === 'cardIdentification' || conversationText.includes('what card') || conversationText.includes('identify')) {
            return this.generateIdentificationFollowUp(context, conversationText);
        }

        // Showcase follow-ups
        if (intent === 'showcase' || conversationText.includes('look') || conversationText.includes('check out')) {
            return this.generateShowcaseFollowUp(context, conversationText);
        }

        // Grading follow-ups
        if (intent === 'grading' || conversationText.includes('grade') || conversationText.includes('psa')) {
            return this.generateGradingFollowUp(context, conversationText);
        }

        // General follow-ups
        return this.generateGeneralFollowUp(context, conversationText);
    }

    generatePriceFollowUp(context, conversationText) {
        const followUps = this.followUpPatterns.priceQuestion;

        // Avoid asking about TCGPlayer if already mentioned
        if (conversationText.includes('tcgplayer')) {
            const filtered = followUps.filter(f => !f.includes('TCGPlayer'));
            if (filtered.length > 0) {
                return {
                    text: this.selectRandom(filtered),
                    type: 'price_followup',
                    confidence: 0.8
                };
            }
        }

        // Avoid asking about condition if already discussed
        if (conversationText.includes('condition')) {
            const filtered = followUps.filter(f => !f.includes('condition'));
            if (filtered.length > 0) {
                return {
                    text: this.selectRandom(filtered),
                    type: 'price_followup',
                    confidence: 0.7
                };
            }
        }

        return {
            text: this.selectRandom(followUps),
            type: 'price_followup',
            confidence: 0.8
        };
    }

    generateIdentificationFollowUp(context, conversationText) {
        const followUps = this.followUpPatterns.cardQuestion;

        // Don't ask for picture if we already have visual data
        if (context.hasImages || conversationText.includes('picture') || conversationText.includes('image')) {
            const filtered = followUps.filter(f => !f.includes('picture') && !f.includes('see'));
            if (filtered.length > 0) {
                return {
                    text: this.selectRandom(filtered),
                    type: 'identification_followup',
                    confidence: 0.8
                };
            }
        }

        return {
            text: this.selectRandom(followUps),
            type: 'identification_followup',
            confidence: 0.8
        };
    }

    generateShowcaseFollowUp(context, conversationText) {
        const followUps = this.followUpPatterns.showcaseResponse;

        // Personalize based on what's already been discussed
        if (conversationText.includes('collection')) {
            const filtered = followUps.filter(f => !f.includes('collection'));
            if (filtered.length > 0) {
                return {
                    text: this.selectRandom(filtered),
                    type: 'showcase_followup',
                    confidence: 0.7
                };
            }
        }

        return {
            text: this.selectRandom(followUps),
            type: 'showcase_followup',
            confidence: 0.8
        };
    }

    generateGradingFollowUp(context, conversationText) {
        const followUps = this.followUpPatterns.gradingQuestion;

        // Filter based on what's already been discussed
        let available = followUps;

        if (conversationText.includes('psa') || conversationText.includes('cgc')) {
            available = available.filter(f => !f.includes('service'));
        }

        if (conversationText.includes('cost') || conversationText.includes('money')) {
            available = available.filter(f => !f.includes('cost'));
        }

        if (available.length === 0) {
            available = followUps; // Fallback to all options
        }

        return {
            text: this.selectRandom(available),
            type: 'grading_followup',
            confidence: 0.8
        };
    }

    generateGeneralFollowUp(context, conversationText) {
        // Generate a contextual question based on the conversation
        const questionTemplates = [
            "What's your favorite part about collecting Pokemon cards?",
            "How did you get started with Pokemon TCG?",
            "What's the rarest card you've ever owned?",
            "Do you have a favorite Pokemon or card type?",
            "What's your most memorable Pokemon TCG moment?",
            "How do you like to display your collection?",
            "What's your strategy for finding good deals?"
        ];

        // Avoid repeating similar questions
        const recentQuestions = conversationText.match(/\?[^?]*$/g) || [];
        const filtered = questionTemplates.filter(template => {
            return !recentQuestions.some(recent =>
                this.similarity(template.toLowerCase(), recent.toLowerCase()) > 0.6
            );
        });

        const selected = filtered.length > 0 ? this.selectRandom(filtered) : this.selectRandom(questionTemplates);

        return {
            text: selected,
            type: 'general_followup',
            confidence: 0.6
        };
    }

    isQuestion(text) {
        return text.includes('?') ||
               text.match(/\b(what|how|when|where|why|who|which|do you|have you|are you|is it|can you|would you)\b/i);
    }

    selectRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    similarity(str1, str2) {
        // Simple word overlap similarity
        const words1 = new Set(str1.split(/\s+/));
        const words2 = new Set(str2.split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }

    generateConversationFlow(intent, currentStep = 0) {
        const flow = this.conversationFlows[intent];
        if (!flow || currentStep >= flow.length) {
            return null;
        }

        const step = flow[currentStep];
        let followUpText = null;

        switch (step) {
            case 'check_current_prices':
                followUpText = "Have you checked the current market prices for that card?";
                break;
            case 'ask_condition':
                followUpText = "What's the condition like on that card?";
                break;
            case 'discuss_market_trends':
                followUpText = "Have you noticed how the market's been trending lately?";
                break;
            case 'ask_selling_intent':
                followUpText = "Are you thinking about selling it or just curious?";
                break;
            case 'ask_for_image':
                followUpText = "Got a clearer picture of that card?";
                break;
            case 'identify_card':
                followUpText = "I think I can identify that card if you describe it!";
                break;
            case 'discuss_value':
                followUpText = "Want me to help figure out what that's worth?";
                break;
            case 'ask_collection_context':
                followUpText = "What's the story behind that card in your collection?";
                break;
            case 'express_appreciation':
                followUpText = "That's really cool! How did you get it?";
                break;
            case 'ask_origin_story':
                followUpText = "What's the story behind how you got that card?";
                break;
            case 'discuss_collection':
                followUpText = "How big is your Pokemon collection?";
                break;
            case 'ask_favorites':
                followUpText = "What's your favorite card from your collection?";
                break;
            case 'ask_service_preference':
                followUpText = "Which grading service are you thinking of using?";
                break;
            case 'discuss_costs':
                followUpText = "Have you looked into the grading costs yet?";
                break;
            case 'ask_experience':
                followUpText = "Have you gotten cards graded before?";
                break;
            case 'discuss_benefits':
                followUpText = "What are you hoping to get out of grading it?";
                break;
            default:
                followUpText = "That's interesting! Tell me more about it.";
        }

        return {
            text: followUpText,
            type: 'flow_followup',
            step: currentStep + 1,
            totalSteps: flow.length,
            confidence: 0.7
        };
    }

    shouldContinueConversation(context, conversationHistory) {
        // Continue if conversation is engaging
        if (conversationHistory.length < 5) {
            return true; // Keep going for short conversations
        }

        // Check if user is still engaged (responding with questions/enthusiasm)
        const recentMessages = conversationHistory.slice(-3);
        const userEngagement = recentMessages.some(msg =>
            msg.includes('?') ||
            msg.includes('!') ||
            msg.includes('thanks') ||
            msg.includes('yeah') ||
            msg.includes('cool')
        );

        return userEngagement;
    }

    generateNaturalTransition(lastTopic, newTopic) {
        const transitions = {
            price_to_grading: "Speaking of value, have you thought about getting that graded?",
            card_to_price: "That reminds me, do you know what that's worth these days?",
            showcase_to_collection: "That card looks great! How's the rest of your collection?",
            general_to_personal: "That's cool! What's your favorite Pokemon card?"
        };

        const key = `${lastTopic}_to_${newTopic}`;
        return transitions[key] || "That reminds me...";
    }

    // Record a conversation so we can do follow-ups later
    async trackConversation(username, message, options = {}) {
        try {
            this._conversations = this._conversations || new Map();
            const key = String(username || 'unknown').toLowerCase();
            const record = this._conversations.get(key) || { messages: [], last: 0, meta: {}, exchanges: [], theirTweetId: null, theirUsername: key, context: {} };
            record.messages.push(String(message || ''));
            if (record.messages.length > 20) record.messages.shift();
            record.last = Date.now();
            record.meta = { followUpCount: record.meta.followUpCount || 0, ...record.meta, ...options };
            // Track as our exchange by default
            record.exchanges.push({ type: 'our', text: String(message || ''), timestamp: new Date().toISOString() });
            this._conversations.set(key, record);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Typing state guard used by the main bot
    setTypingState(isTyping) {
        this._isTyping = !!isTyping;
        return this._isTyping;
    }

    // Minimal reply analyzer expected by the bot
    analyzeReply(text) {
        const t = String(text || '');
        const lower = t.toLowerCase();
        const hasQuestion = /\?/g.test(t) || /(what|how|why|where|which|who|when|price|worth|value|trade|sell|buy)\b/i.test(t);
        const negative = /(stupid|idiot|trash|garbage|scam+|retarded|dumb|hate|worst|awful|bs|bullshit)/i.test(lower);
        const wantsContinuation = /(what|how|why|which|who|when|price|worth|value|trade|sell|buy|grade|psa|cgc)\b/i.test(lower);
        const sentiment = negative ? 'negative' : (/(love|nice|cool|great|awesome|sick|clean|mint|🔥|😍|😄)/i.test(lower) ? 'positive' : 'neutral');
        const reason = hasQuestion ? 'question detected' : (wantsContinuation ? 'follow-up topic' : (negative ? 'negative tone' : 'no follow-up needed'));
        return { hasQuestion, isNegative: negative, wantsContinuation, sentiment, reason };
    }

    // Look up a tracked conversation by username
    async findTrackedConversation(username) {
        const key = String(username || 'unknown').toLowerCase();
        if (!this._conversations || !this._conversations.has(key)) return null;
        const rec = this._conversations.get(key);
        return {
            followUpCount: (rec.meta && rec.meta.followUpCount) || 0,
            exchanges: rec.exchanges || [],
            theirTweetId: rec.theirTweetId || null,
            theirUsername: rec.theirUsername || key,
            context: rec.context || {}
        };
    }

    // Mark a follow-up as completed and increment counters
    async completeFollowUp(theirTweetId, ourResponse) {
        // Find a conversation by tweetId or leave it generic
        if (this._conversations) {
            for (const [key, rec] of this._conversations) {
                if (!theirTweetId || rec.theirTweetId === theirTweetId) {
                    rec.meta = rec.meta || {};
                    rec.meta.followUpCount = (rec.meta.followUpCount || 0) + 1;
                    rec.exchanges = rec.exchanges || [];
                    rec.exchanges.push({ type: 'our_followup', text: String(ourResponse || ''), timestamp: new Date().toISOString() });
                    this._conversations.set(key, rec);
                    break;
                }
            }
        }
        return true;
    }

    // Select conversations that likely need a proactive follow-up
    async getConversationsNeedingFollowUp() {
        // Minimal implementation: return empty to avoid noisy follow-ups unless explicitly tracked
        return [];
    }
}

module.exports = ConversationFollowUp;
