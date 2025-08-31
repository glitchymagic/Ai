// Response Memory System - Prevents repetitive responses
// Tracks recent responses to avoid saying same thing repeatedly

class ResponseMemory {
    constructor() {
        this.recentResponses = [];
        this.maxMemory = 50; // Remember last 50 responses
        this.similarityThreshold = 0.7; // 70% similarity = too similar
        this.timeWindow = 3600000; // 1 hour window
    }
    
    // Check if response is too similar to recent ones
    isResponseTooSimilar(newResponse) {
        const now = Date.now();
        
        // Clean old responses outside time window
        this.recentResponses = this.recentResponses.filter(r => 
            now - r.timestamp < this.timeWindow
        );
        
        // Check similarity against recent responses
        for (const recent of this.recentResponses) {
            const similarity = this.calculateSimilarity(newResponse, recent.text);
            if (similarity > this.similarityThreshold) {
                console.log(`   🔄 Response too similar to recent: "${recent.text}"`);
                return true;
            }
        }
        
        return false;
    }
    
    // Add response to memory
    rememberResponse(response) {
        this.recentResponses.push({
            text: response,
            timestamp: Date.now()
        });
        
        // Keep only recent responses
        if (this.recentResponses.length > this.maxMemory) {
            this.recentResponses.shift();
        }
    }
    
    // Calculate similarity between two responses
    calculateSimilarity(text1, text2) {
        const words1 = this.getWords(text1);
        const words2 = this.getWords(text2);
        
        // If both are very short and different, they're not similar
        if (words1.length <= 2 && words2.length <= 2) {
            return text1.toLowerCase() === text2.toLowerCase() ? 1 : 0;
        }
        
        // Count common words
        const commonWords = words1.filter(word => words2.includes(word));
        const totalWords = Math.max(words1.length, words2.length);
        
        if (totalWords === 0) return 0;
        
        const wordSimilarity = commonWords.length / totalWords;
        
        // Also check phrase similarity for common phrases
        const phraseSimilarity = this.checkPhraseSimilarity(text1, text2);
        
        return Math.max(wordSimilarity, phraseSimilarity);
    }
    
    // Extract meaningful words (ignore common words)
    getWords(text) {
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'cant', 'dont', 'wont', 'that', 'this', 'it', 'its'];
        
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 1 && !commonWords.includes(word));
    }
    
    // Check for similar phrases/patterns
    checkPhraseSimilarity(text1, text2) {
        const phrases1 = this.extractPhrases(text1);
        const phrases2 = this.extractPhrases(text2);
        
        for (const phrase1 of phrases1) {
            for (const phrase2 of phrases2) {
                if (phrase1 === phrase2) {
                    return 0.8; // High similarity for exact phrase match
                }
            }
        }
        
        return 0;
    }
    
    // Extract common phrases
    extractPhrases(text) {
        const lower = text.toLowerCase();
        const phrases = [];
        
        // Common Pokemon phrases
        const patterns = [
            /w pull/,
            /solid pull/,
            /nice hit/,
            /thats clean/,
            /looks good/,
            /worth it/,
            /send it/,
            /grade it/,
            /decent/,
            /not bad/,
            /congrats/,
            /nice cards/,
            /collection/,
            /setup/,
            /pull rates/,
            /crown zenith/,
            /evolving skies/
        ];
        
        for (const pattern of patterns) {
            if (pattern.test(lower)) {
                phrases.push(pattern.source);
            }
        }
        
        return phrases;
    }
    
    // Get alternative response if current one is too similar
    getAlternativeResponse(originalResponse, responsePool) {
        if (!Array.isArray(responsePool) || responsePool.length === 0) {
            return originalResponse;
        }
        
        // Try up to 5 alternatives
        for (let attempt = 0; attempt < 5; attempt++) {
            const alternative = responsePool[Math.floor(Math.random() * responsePool.length)];
            
            if (!this.isResponseTooSimilar(alternative)) {
                return alternative;
            }
        }
        
        // If all alternatives are similar, use original but modify it slightly
        return this.addVariation(originalResponse);
    }
    
    // Add slight variation to avoid exact repetition
    addVariation(response) {
        const variations = {
            'nice': ['solid', 'clean', 'decent'],
            'good': ['solid', 'decent', 'clean'],
            'cool': ['nice', 'solid', 'clean'],
            'awesome': ['sick', 'fire', 'clean'],
            'fr': ['ngl', 'tbh', ''],
            'tbh': ['ngl', 'fr', ''],
            'ngl': ['tbh', 'fr', '']
        };
        
        let varied = response;
        
        // Replace one word with variation
        for (const [original, replacements] of Object.entries(variations)) {
            if (varied.includes(original)) {
                const replacement = replacements[Math.floor(Math.random() * replacements.length)];
                varied = varied.replace(original, replacement);
                break;
            }
        }
        
        // Add occasional variation
        if (Math.random() < 0.3) {
            const endings = ['!!', '..', ' 👀', ' 🔥'];
            const randomEnding = endings[Math.floor(Math.random() * endings.length)];
            if (!varied.includes('!') && !varied.includes('.')) {
                varied += randomEnding;
            }
        }
        
        return varied;
    }
    
    // Get memory stats
    getStats() {
        const now = Date.now();
        const recentCount = this.recentResponses.filter(r => 
            now - r.timestamp < this.timeWindow
        ).length;
        
        return {
            totalRemembered: this.recentResponses.length,
            recentResponses: recentCount,
            memoryWindow: Math.floor(this.timeWindow / 60000) + ' minutes'
        };
    }
    
    // Clear memory (for testing)
    clearMemory() {
        this.recentResponses = [];
    }
}

module.exports = ResponseMemory;