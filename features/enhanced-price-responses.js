// Enhanced Price-Aware Response System
// Integrates real pricing data into bot responses

const priceEngine = require('../price-engine/index.js');

class EnhancedPriceResponses {
    constructor() {
        this.initialized = false;
        this.priceCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        this.responseCounter = 0; // For deterministic selection
    }
    
    async initialize() {
        if (!this.initialized) {
            await priceEngine.initialize();
            this.initialized = true;
            console.log('💰 Enhanced price responses ready');
        }
    }
    
    // Enhance any response with price data
    async enhanceResponse(originalResponse, context = {}) {
        // Handle null/empty inputs gracefully
        if (!originalResponse) {
            return "that's fire ngl"; // Default fallback
        }
        
        await this.initialize();
        
        // Detect if we're talking about a specific card
        const cardMention = this.detectCardMention(originalResponse, context);
        
        if (cardMention) {
            const priceData = await this.getCardPrice(cardMention.card, cardMention.set);
            
            if (priceData) {
                // Add price to response naturally
                return this.addPriceToResponse(originalResponse, priceData, context);
            }
        }
        
        return originalResponse;
    }
    
    // Detect card mentions in conversation
    detectCardMention(text, context) {
        const lowerText = text.toLowerCase();
        
        // Common cards people ask about - BE SPECIFIC
        const cardPatterns = [
            // Charizards - multiple variants exist!
            { pattern: /base set charizard|charizard #4|charizard 4\/102/i, card: 'Charizard', set: 'Base Set', number: '#4/102' },
            { pattern: /charizard ex|charizard-ex/i, card: 'Charizard ex', set: 'Obsidian Flames', number: '#054' },
            { pattern: /charizard vmax|rainbow charizard/i, card: 'Charizard VMAX', set: 'Champions Path', number: '#074' },
            { pattern: /charizard gx/i, card: 'Charizard GX', set: 'Hidden Fates', number: 'SV49' },
            { pattern: /charizard/i, card: 'Charizard', set: 'Base Set', number: '#4/102' }, // Default to Base Set
            
            // Other specifics
            { pattern: /moonbreon|umbreon vmax/i, card: 'Umbreon VMAX', set: 'Evolving Skies', number: '#215' },
            { pattern: /lugia v alt/i, card: 'Lugia V', set: 'Silver Tempest', number: '#186' },
            { pattern: /pikachu vmax/i, card: 'Pikachu VMAX', set: 'Vivid Voltage', number: '#044' },
            { pattern: /base set pikachu|pikachu #58/i, card: 'Pikachu', set: 'Base Set', number: '#58/102' },
            { pattern: /pikachu/i, card: 'Pikachu', set: 'Base Set', number: '#58/102' }, // Default to Base Set
            { pattern: /giratina vstar/i, card: 'Giratina VSTAR', set: 'Lost Origin', number: '#131' }
        ];
        
        for (const {pattern, card, set, number} of cardPatterns) {
            if (pattern.test(text) || (context.text && pattern.test(context.text))) {
                return { card, set, number };
            }
        }
        
        return null;
    }
    
    // Get price with caching
    async getCardPrice(cardName, setName) {
        const cacheKey = `${cardName}_${setName}`;
        const cached = this.priceCache.get(cacheKey);
        
        if (cached && Date.now() - cached.time < this.cacheTimeout) {
            return cached.data;
        }
        
        const price = await priceEngine.getQuickPrice(cardName, setName);
        
        if (price) {
            this.priceCache.set(cacheKey, {
                data: price,
                time: Date.now()
            });
        }
        
        return price;
    }
    
    // Add price naturally to response
    addPriceToResponse(response, priceData, context) {
        const price = priceEngine.formatPriceResponse(priceData, 'casual');
        
        // Different ways to add price based on context
        const templates = [
            `${response} (worth ${price} btw)`,
            `${response}.. going for ${price} rn`,
            `${response} - ${price} market`,
            `${response}. seeing ${price} lately`
        ];
        
        // Pick random template for variety
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return template;
    }
    
    // Generate price-focused responses
    async generatePriceResponse(cardName, setName, style = 'casual', cardNumber = null) {
        await this.initialize();
        
        const priceData = await priceEngine.getQuickPrice(cardName, setName);
        const analysis = await priceEngine.getMarketAnalysis(cardName, setName);
        
        if (!priceData) {
            return "can't find solid pricing on that one";
        }
        
        const price = priceEngine.formatPriceResponse(priceData, style);
        const trend = analysis.trends?.trend || 'stable';
        const change = analysis.trends?.change || 0;
        
        // Create specific card identifier
        const cardIdentifier = cardNumber ? 
            `${setName} ${cardName} ${cardNumber}` : 
            `${setName} ${cardName}`;
        
        if (style === 'casual') {
            // For replies - ALWAYS specify which card
            const responses = [
                `${cardIdentifier} is ${price} raw depending on condition`,
                `last i saw ${cardIdentifier} was ${price} for nm`,
                `${cardIdentifier} around ${price} but ${trend === 'rising' ? 'climbing' : trend === 'falling' ? 'dropping' : 'pretty stable'}`,
                `${cardIdentifier} bout ${price}${change > 5 ? ' and rising 📈' : change < -5 ? ' and falling 📉' : ''}`,
                `${cardIdentifier} in the ${price} range${trend === 'rising' ? ', better grab now' : ''}`,
                `seeing ${cardIdentifier} at ${price} on tcgplayer`
            ];
            
            return responses[Math.floor(Math.random() * responses.length)];
            
        } else if (style === 'authoritative') {
            // For original posts
            return `${cardIdentifier}: ${price} (${change > 0 ? '+' : ''}${change.toFixed(1)}%). ${this.getTrendAnalysis(trend, change)}`;
        }
        
        return price;
    }
    
    // Get trend analysis text
    getTrendAnalysis(trend, change) {
        if (trend === 'rising' && change > 10) {
            return 'Strong buying pressure. Breakout imminent.';
        }
        if (trend === 'rising') {
            return 'Upward momentum building.';
        }
        if (trend === 'falling' && change < -10) {
            return 'Oversold. Watch for bounce.';
        }
        if (trend === 'falling') {
            return 'Consolidating lower.';
        }
        return 'Stable range. No clear direction.';
    }
    
    // Check if response should include price
    shouldIncludePrice(text, context) {
        const priceTriggers = [
            'worth', 'price', 'value', 'cost', 'how much',
            'what\'s it', 'going for', 'market', 'tcgplayer'
        ];
        
        const lowerText = text.toLowerCase();
        const contextText = (context.text || '').toLowerCase();
        
        return priceTriggers.some(trigger => 
            lowerText.includes(trigger) || contextText.includes(trigger)
        );
    }
    
    // Hash string to number for deterministic selection
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}

module.exports = EnhancedPriceResponses;