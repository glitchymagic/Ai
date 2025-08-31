// Decision Trace Logger for Observability
const fs = require('fs').promises;
const path = require('path');

class DecisionTrace {
    constructor(logDir = './logs') {
        this.logDir = logDir;
        this.logFile = path.join(logDir, `decision-trace-${new Date().toISOString().split('T')[0]}.jsonl`);
        this.ensureLogDir();
    }
    
    async ensureLogDir() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
        } catch (error) {
            console.error('Could not create log directory:', error.message);
        }
    }
    
    async logDecision({
        tweetId,
        username,
        tweetText,
        timestamp = new Date().toISOString(),
        decision,
        features,
        strategy,
        response,
        // NEW: Additional context fields
        eventDetails = null,
        numbersSuppressed = false,
        priceIntent = null,
        familiarityScore = 0,
        threadContext = null
    }) {
        const trace = {
            ts: timestamp,
            tweetId,
            username,
            tweetSnippet: tweetText.substring(0, 100),
            
            // Decision data
            engaged: decision.engage,
            action: decision.action,
            valueScore: decision.score,
            
            // Features
            age: features.ageDescription,
            timestampReason: features.timestampReason,
            sentiment: features.sentiment,
            sentimentConf: features.sentimentConfidence,
            isPriceQ: features.isPriceQ,
            cardHits: features.cardEntities?.length || 0,
            hasImages: features.hasImages,
            hasStats: features.hasStats,
            
            // Strategy
            chosenStrategy: strategy.strategy,
            strategyConfidence: strategy.confidence,
            strategyReason: strategy.reason,
            
            // Response
            responseLength: response?.length || 0,
            responseSnippet: response?.substring(0, 50),
            usedStats: response?.includes('7d') || response?.includes('30d') || response?.includes('last $'),
            
            // NEW: Enhanced fields per GPT's request
            eventDetails: eventDetails,
            numbersSuppressed: numbersSuppressed,
            price_intent: priceIntent,
            familiarity_throttled: familiarityScore < 3,
            threadDepth: threadContext?.threadLength || 0,
            threadHallucinated: false, // Will be set if thread claims were sanitized
            
            // Meta
            reason: decision.reason || strategy.reason
        };
        
        try {
            await fs.appendFile(this.logFile, JSON.stringify(trace) + '\n');
        } catch (error) {
            console.error('Failed to log decision trace:', error.message);
        }
        
        return trace;
    }
    
    // Get summary stats for the session
    async getSessionStats() {
        try {
            const content = await fs.readFile(this.logFile, 'utf-8');
            const lines = content.trim().split('\n').filter(l => l);
            const traces = lines.map(l => JSON.parse(l));
            
            const stats = {
                totalDecisions: traces.length,
                engaged: traces.filter(t => t.engaged).length,
                replies: traces.filter(t => t.action === 'reply').length,
                likes: traces.filter(t => t.action === 'like').length,
                
                // Strategy breakdown
                strategies: {},
                
                // Stats usage
                priceRepliesWithStats: 0,
                priceRepliesTotal: 0
            };
            
            // Count strategies
            traces.forEach(t => {
                stats.strategies[t.chosenStrategy] = (stats.strategies[t.chosenStrategy] || 0) + 1;
                
                if (t.isPriceQ && t.action === 'reply') {
                    stats.priceRepliesTotal++;
                    if (t.usedStats) stats.priceRepliesWithStats++;
                }
            });
            
            stats.statsUsageRate = stats.priceRepliesTotal > 0 ? 
                (stats.priceRepliesWithStats / stats.priceRepliesTotal * 100).toFixed(1) + '%' : 
                'N/A';
            
            return stats;
        } catch (error) {
            return null;
        }
    }
}

module.exports = DecisionTrace;