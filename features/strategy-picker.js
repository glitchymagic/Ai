// Deterministic Strategy Picker - No RNG
class StrategyPicker {
    constructor() {
        this.strategies = {
            PRICE: 'price',
            VISUAL: 'visual',
            AUTHORITY: 'authority',
            THREAD_AWARE: 'thread_aware',
            HUMAN_LIKE: 'human_like',
            FALLBACK: 'fallback'
        };
    }
    
    // Pick strategy based on features, not randomness
    pickStrategy({ 
        isPriceQ, 
        hasStats, 
        hasImages, 
        cardEntities, 
        valueScore, 
        threadDepth = 0,
        sentiment,
        isShowingOff,
        hasVisualData
    }) {
        // Priority 1: Price questions (with or without stats)
        if (isPriceQ) {
            return {
                strategy: this.strategies.PRICE,
                confidence: hasStats ? 'high' : 'medium',
                reason: hasStats ? 'price question with available stats' : 'price question - will check market'
            };
        }
        
        // Priority 2: Visual content with detected cards
        if (hasImages && hasVisualData && cardEntities?.length > 0) {
            return {
                strategy: this.strategies.VISUAL,
                confidence: 'high',
                reason: 'visual content with card entities'
            };
        }
        
        // Priority 3: Thread conversations need context awareness
        if (threadDepth >= 2) {
            return {
                strategy: this.strategies.THREAD_AWARE,
                confidence: 'high',
                reason: 'deep conversation thread'
            };
        }
        
        // Priority 4: Authority for Pokemon TCG discussions
        if (valueScore >= 3 && cardEntities?.length > 0) {
            return {
                strategy: this.strategies.AUTHORITY,
                confidence: valueScore >= 5 ? 'high' : 'medium',
                reason: 'Pokemon TCG discussion with entities'
            };
        }
        
        // Priority 5: Authority for any Pokemon content (fallback if no specific strategy)
        if (cardEntities?.length > 0) {
            return {
                strategy: this.strategies.AUTHORITY,
                confidence: 'low',
                reason: 'Pokemon content detected'
            };
        }
        
        // Priority 6: Human-like for show-off posts
        if (isShowingOff && sentiment === 'positive' && !isPriceQ) {
            return {
                strategy: this.strategies.HUMAN_LIKE,
                confidence: 'medium',
                reason: 'showing off cards, non-price context'
            };
        }
        
        // Fallback: Context-appropriate response
        return {
            strategy: this.strategies.FALLBACK,
            confidence: 'low',
            reason: 'no specific strategy matched'
        };
    }
    
    // Get weighted fallback if primary strategy fails
    getWeightedFallback(primaryStrategy, features) {
        // Map of what to try next if primary fails
        const fallbackMap = {
            [this.strategies.PRICE]: this.strategies.AUTHORITY,
            [this.strategies.VISUAL]: this.strategies.HUMAN_LIKE,
            [this.strategies.AUTHORITY]: this.strategies.HUMAN_LIKE,
            [this.strategies.THREAD_AWARE]: this.strategies.FALLBACK,
            [this.strategies.HUMAN_LIKE]: this.strategies.FALLBACK
        };
        
        const nextStrategy = fallbackMap[primaryStrategy] || this.strategies.FALLBACK;
        
        return {
            strategy: nextStrategy,
            confidence: 'fallback',
            reason: `fallback from ${primaryStrategy}`
        };
    }
}

module.exports = StrategyPicker;