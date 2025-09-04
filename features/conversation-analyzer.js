// Conversation Analyzer
// Tracks conversation outcomes and feeds insights back to the learning engine

class ConversationAnalyzer {
    constructor(learningEngine) {
        this.learningEngine = learningEngine;
        this.activeConversations = new Map(); // Track ongoing conversations
        this.conversationHistory = new Map(); // Store completed conversations
        
        this.outcomeIndicators = {
            positive: [
                'thanks', 'thank you', 'appreciate', 'helpful', 'awesome', 
                'great', 'perfect', 'exactly', 'right', '👍', '🙏', '❤️',
                'W', 'based', 'facts', 'this', 'true', 'agreed'
            ],
            negative: [
                'wrong', 'incorrect', 'actually', 'no', 'nope', 'bad',
                'terrible', 'awful', '👎', '❌', 'L', 'cap', 'nah',
                'disagree', 'false'
            ],
            continuation: [
                '?', 'what about', 'how about', 'also', 'another',
                'more', 'else', 'other', 'too'
            ]
        };
    }
    
    // Track when bot engages with a tweet
    startConversation(tweetId, interaction) {
        this.activeConversations.set(tweetId, {
            tweetId,
            startTime: Date.now(),
            originalInteraction: interaction,
            responses: [],
            outcome: 'pending'
        });
    }
    
    // Analyze user's response to bot
    async analyzeUserResponse(tweetId, userResponse, username) {
        const conversation = this.activeConversations.get(tweetId);
        if (!conversation) return null;
        
        // Determine response sentiment
        const sentiment = this.analyzeResponseSentiment(userResponse);
        const outcome = this.determineOutcome(userResponse, conversation);
        
        // Update conversation
        conversation.responses.push({
            username,
            message: userResponse,
            sentiment,
            timestamp: Date.now()
        });
        
        conversation.outcome = outcome;
        
        // If conversation seems complete, process it
        if (outcome !== 'ongoing') {
            await this.processCompletedConversation(tweetId, conversation);
        }
        
        return { sentiment, outcome };
    }
    
    analyzeResponseSentiment(message) {
        const msgLower = message.toLowerCase();
        
        const positiveScore = this.outcomeIndicators.positive
            .filter(ind => msgLower.includes(ind)).length;
        const negativeScore = this.outcomeIndicators.negative
            .filter(ind => msgLower.includes(ind)).length;
        
        if (positiveScore > negativeScore) return 'positive';
        if (negativeScore > positiveScore) return 'negative';
        return 'neutral';
    }
    
    determineOutcome(userResponse, conversation) {
        const sentiment = this.analyzeResponseSentiment(userResponse);
        const msgLower = userResponse.toLowerCase();
        
        // Check if conversation is continuing
        const hasContinuation = this.outcomeIndicators.continuation
            .some(ind => msgLower.includes(ind));
        
        if (hasContinuation) return 'ongoing';
        
        // Check response length - very short might indicate dismissal
        if (userResponse.length < 10 && sentiment !== 'positive') {
            return 'dismissed';
        }
        
        // Determine final outcome
        if (sentiment === 'positive') return 'successful';
        if (sentiment === 'negative') return 'unsuccessful';
        
        // If user engaged meaningfully (20+ chars), consider it successful
        if (userResponse.length > 20) return 'engaged';
        
        return 'neutral';
    }
    
    async processCompletedConversation(tweetId, conversation) {
        const { originalInteraction, outcome, responses } = conversation;
        
        // Move to history
        this.conversationHistory.set(tweetId, conversation);
        this.activeConversations.delete(tweetId);
        
        // Feed back to learning engine
        await this.learningEngine.recordEngagementOutcome(
            originalInteraction.username,
            originalInteraction.responseId,
            outcome === 'successful' || outcome === 'engaged' ? 'positive' : 
            outcome === 'unsuccessful' || outcome === 'dismissed' ? 'negative' : 'neutral'
        );
        
        // Learn from the full conversation flow
        if (responses.length > 0) {
            await this.analyzeConversationFlow(conversation);
        }
        
        // Log insights
        console.log(`   📊 Conversation outcome: ${outcome} (${responses.length} exchanges)`);
    }
    
    async analyzeConversationFlow(conversation) {
        const { originalInteraction, responses, outcome } = conversation;
        
        // Extract insights from successful conversations
        if (outcome === 'successful' || outcome === 'engaged') {
            // What made this conversation work?
            const factors = {
                responseLength: originalInteraction.botResponse.length,
                hadQuestion: originalInteraction.botResponse.includes('?'),
                hadData: /\d+/.test(originalInteraction.botResponse),
                personalizedMention: originalInteraction.botResponse.includes('@'),
                enthusiasm: (originalInteraction.botResponse.match(/!|🔥|🚀/g) || []).length
            };
            
            // Store successful pattern
            await this.learningEngine.learnConversationPattern({
                ...originalInteraction,
                successFactors: factors,
                outcome: 'success'
            });
        }
        
        // Learn from user's language style
        for (const response of responses) {
            await this.learningEngine.learnFromInteraction({
                username: response.username,
                message: response.message,
                botResponse: originalInteraction.botResponse,
                sentiment: response.sentiment,
                timestamp: response.timestamp
            });
        }
    }
    
    // Get conversation insights
    getConversationStats() {
        const completed = Array.from(this.conversationHistory.values());
        
        const stats = {
            total: completed.length,
            successful: completed.filter(c => c.outcome === 'successful').length,
            engaged: completed.filter(c => c.outcome === 'engaged').length,
            unsuccessful: completed.filter(c => c.outcome === 'unsuccessful').length,
            avgExchanges: completed.reduce((sum, c) => sum + c.responses.length, 0) / completed.length || 0
        };
        
        stats.successRate = ((stats.successful + stats.engaged) / stats.total * 100).toFixed(1) + '%';
        
        return stats;
    }
    
    // Check if we should follow up
    shouldFollowUp(conversation) {
        if (!conversation || conversation.responses.length === 0) return false;
        
        const lastResponse = conversation.responses[conversation.responses.length - 1];
        const timeSinceResponse = Date.now() - lastResponse.timestamp;
        
        // Don't follow up if it's been too long (> 1 hour)
        if (timeSinceResponse > 60 * 60 * 1000) return false;
        
        // Follow up if they asked a question
        if (lastResponse.message.includes('?')) return true;
        
        // Follow up if sentiment was very positive
        if (lastResponse.sentiment === 'positive' && 
            this.outcomeIndicators.continuation.some(ind => 
                lastResponse.message.toLowerCase().includes(ind))) {
            return true;
        }
        
        return false;
    }
    
    // Generate follow-up response based on conversation context
    generateFollowUpContext(conversation) {
        const lastResponse = conversation.responses[conversation.responses.length - 1];
        
        return {
            isFollowUp: true,
            previousExchanges: conversation.responses.length,
            lastUserMessage: lastResponse.message,
            lastSentiment: lastResponse.sentiment,
            timeSinceLastResponse: Date.now() - lastResponse.timestamp,
            conversationTone: this.determineConversationTone(conversation)
        };
    }
    
    determineConversationTone(conversation) {
        const sentiments = conversation.responses.map(r => r.sentiment);
        const positiveCount = sentiments.filter(s => s === 'positive').length;
        const negativeCount = sentiments.filter(s => s === 'negative').length;
        
        if (positiveCount > negativeCount) return 'friendly';
        if (negativeCount > positiveCount) return 'challenging';
        return 'neutral';
    }
    
    // Clean up old conversations
    cleanup() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        // Remove stale active conversations
        for (const [tweetId, conversation] of this.activeConversations.entries()) {
            if (conversation.startTime < oneHourAgo) {
                // Mark as abandoned and process
                conversation.outcome = 'abandoned';
                this.processCompletedConversation(tweetId, conversation);
            }
        }
        
        // Limit history size
        if (this.conversationHistory.size > 1000) {
            const sorted = Array.from(this.conversationHistory.entries())
                .sort((a, b) => b[1].startTime - a[1].startTime);
            
            // Keep only the most recent 1000
            this.conversationHistory.clear();
            sorted.slice(0, 1000).forEach(([id, conv]) => {
                this.conversationHistory.set(id, conv);
            });
        }
    }
}

module.exports = ConversationAnalyzer;