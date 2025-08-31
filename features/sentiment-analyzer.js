// Sentiment Analysis for Pokemon TCG Context
class SentimentAnalyzer {
    constructor() {
        // Strong negative indicators
        this.negativeWords = [
            'suck', 'sucks', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'bad',
            'disappointing', 'trash', 'garbage', 'pathetic', 'useless', 'fail', 'failed',
            'rip off', 'overpriced', 'scam', 'fraud', 'angry', 'mad', 'upset', 'frustrated',
            'disgusted', 'annoyed', 'disappointed', 'complaining', 'complaint', 'insane',
            'ridiculous', 'stupid', 'dumb', 'crazy expensive', 'never find', 'impossible'
        ];
        
        // Sarcasm indicators (often missed)
        this.sarcasmPatterns = [
            'oh great', 'oh wonderful', 'just perfect', 'how lovely',
            'that\'s just great', 'fantastic', 'brilliant', 'wonderful',
            'never find', 'i\'ll never', 'sure i will', 'yeah right'
        ];
        
        // Dangerous/risky topics to avoid
        this.riskyTopics = [
            'life savings', 'invest everything', 'government', 'regulate',
            'political', 'politics', 'healthcare', 'mortgage', 'loan',
            'investment advice', 'financial advice', 'guaranteed profit',
            'easy money', 'get rich', 'make millions'
        ];
        
        // Pokemon GO vs TCG indicators
        this.pokemonGoIndicators = [
            'caught', 'pokemon go', 'pokémon go', 'gym', 'raid', 'pokestop',
            'buddy', 'candy', 'stardust', 'cp', 'iv', 'team rocket',
            'community day', 'research', 'quest'
        ];
        
        // Strong positive indicators
        this.positiveWords = [
            'amazing', 'awesome', 'incredible', 'beautiful', 'stunning', 'perfect', 'love',
            'great', 'excellent', 'fantastic', 'wonderful', 'brilliant', 'outstanding',
            'impressed', 'happy', 'excited', 'thrilled', 'lucky', 'blessed', 'grateful'
        ];
        
        // Store complaint patterns
        this.complaintPatterns = [
            'you suck', 'you guys suck', 'this place sucks', 'terrible service',
            'worst store', 'never shopping', 'horrible experience', 'disappointed',
            'complaint', 'complaining about', 'fed up', 'had enough'
        ];
        
        // Positive shopping patterns
        this.positiveShoppingPatterns = [
            'found at', 'just picked up', 'great haul', 'scored at', 'lucky find',
            'restock at', 'available at', 'in stock', 'grabbed some', 'got lucky'
        ];
        
        // Context-specific negative indicators
        this.contextNegative = {
            store: ['empty shelves', 'sold out', 'nothing left', 'always empty', 'never have', 'poor stock'],
            pulls: ['terrible pulls', 'worst box', 'no hits', 'all bulk', 'wasted money', 'regret buying'],
            grading: ['bad grade', 'disappointed', 'expected higher', 'grading sucks', 'unfair grade'],
            market: ['overpriced', 'too expensive', 'market crash', 'bubble', 'not worth it']
        };
    }
    
    // Analyze overall sentiment of text
    analyzeSentiment(text) {
        const textLower = text.toLowerCase();
        let score = 0;
        let sentiment = 'neutral';
        let confidence = 'low';
        
        // Check for strong negative patterns first
        for (const pattern of this.complaintPatterns) {
            if (textLower.includes(pattern)) {
                return { sentiment: 'negative', score: -2, confidence: 'high', reason: `complaint pattern: "${pattern}"` };
            }
        }
        
        // Count negative words
        let negativeCount = 0;
        for (const word of this.negativeWords) {
            if (textLower.includes(word)) {
                negativeCount++;
                score -= 1;
            }
        }
        
        // Count positive words
        let positiveCount = 0;
        for (const word of this.positiveWords) {
            if (textLower.includes(word)) {
                positiveCount++;
                score += 1;
            }
        }
        
        // Check positive shopping patterns
        for (const pattern of this.positiveShoppingPatterns) {
            if (textLower.includes(pattern)) {
                score += 1;
                positiveCount++;
            }
        }
        
        // Determine sentiment
        if (score <= -2) {
            sentiment = 'very_negative';
            confidence = 'high';
        } else if (score === -1) {
            sentiment = 'negative';
            confidence = negativeCount >= 2 ? 'high' : 'medium';
        } else if (score >= 2) {
            sentiment = 'very_positive';
            confidence = 'high';
        } else if (score === 1) {
            sentiment = 'positive';
            confidence = positiveCount >= 2 ? 'high' : 'medium';
        }
        
        // Check for sarcasm patterns with guard
        let sarcasmHit = null;
        for (const p of this.sarcasmPatterns) {
            if (textLower.includes(p)) { 
                sarcasmHit = p; 
                break; 
            }
        }
        if (sarcasmHit) {
            const strongNeg = this.negativeWords.some(w => textLower.includes(w));
            const sarcasticCue = /\b(yeah|oh|sure)\b/.test(textLower) || /\/s\b/.test(textLower);
            if (strongNeg || sarcasticCue) {
                return { 
                    sentiment: 'negative', 
                    score: -2, 
                    confidence: 'high', 
                    reason: `sarcasm detected: "${sarcasmHit}"` 
                };
            }
        }
        
        // Check for risky topics
        for (const topic of this.riskyTopics) {
            if (textLower.includes(topic)) {
                return {
                    sentiment: 'risky_topic',
                    score: -3,
                    confidence: 'high',
                    reason: `risky topic detected: "${topic}"`
                };
            }
        }
        
        // Check for Pokemon GO (should not get TCG responses)
        for (const indicator of this.pokemonGoIndicators) {
            if (textLower.includes(indicator)) {
                return {
                    sentiment: 'pokemon_go',
                    score: 0,
                    confidence: 'high',
                    reason: `Pokemon GO content detected: "${indicator}"`
                };
            }
        }
        
        // Special case: @ mentions to companies (often complaints)
        if (textLower.match(/@\w+/) && negativeCount > 0) {
            sentiment = sentiment === 'neutral' ? 'negative' : sentiment;
            confidence = 'high';
        }
        
        return {
            sentiment,
            score,
            confidence,
            negativeCount,
            positiveCount,
            reason: `${negativeCount} negative, ${positiveCount} positive words`
        };
    }
    
    // Analyze sentiment in specific context (store, pulls, etc.)
    analyzeContextSentiment(text, context) {
        const textLower = text.toLowerCase();
        const analysis = this.analyzeSentiment(text);
        
        // Check context-specific negative indicators
        if (this.contextNegative[context]) {
            for (const indicator of this.contextNegative[context]) {
                if (textLower.includes(indicator)) {
                    analysis.sentiment = 'negative';
                    analysis.confidence = 'high';
                    analysis.contextReason = `${context} complaint: "${indicator}"`;
                    break;
                }
            }
        }
        
        return analysis;
    }
    
    // Should we engage with this sentiment?
    shouldEngageWithSentiment(sentimentAnalysis) {
        const { sentiment, confidence } = sentimentAnalysis;
        
        // Never engage with risky topics
        if (sentiment === 'risky_topic') {
            return { engage: false, reason: 'risky topic - avoid financial/political advice' };
        }
        
        // Never engage with Pokemon GO content (wrong context)
        if (sentiment === 'pokemon_go') {
            return { engage: false, reason: 'Pokemon GO content - not TCG relevant' };
        }
        
        // Never engage with high-confidence negative posts
        if ((sentiment === 'very_negative' || sentiment === 'negative') && confidence === 'high') {
            return { engage: false, reason: `${sentiment} sentiment (${confidence} confidence)` };
        }
        
        // Be cautious with medium confidence negative
        if (sentiment === 'negative' && confidence === 'medium') {
            return { engage: false, reason: 'negative sentiment detected' };
        }
        
        // Engage with neutral and positive
        return { engage: true, reason: 'sentiment okay' };
    }
    
    // Generate appropriate response based on sentiment
    generateSentimentAwareResponse(text, sentimentAnalysis) {
        const { sentiment, confidence } = sentimentAnalysis;
        
        // Don't generate responses for negative sentiment
        if (sentiment.includes('negative')) {
            return null;
        }
        
        // For very positive sentiment, be more enthusiastic
        if (sentiment === 'very_positive') {
            return ['Amazing find!', 'That\'s incredible!', 'You hit the jackpot!'];
        }
        
        // For positive sentiment, be supportive
        if (sentiment === 'positive') {
            return ['Nice pickup!', 'Good find!', 'Love to see it!'];
        }
        
        // For neutral, be standard
        return ['Solid choice', 'Nice pick', 'Hope it works out'];
    }
}

module.exports = SentimentAnalyzer;