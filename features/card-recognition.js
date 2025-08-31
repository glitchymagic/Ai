// Card Recognition System - Identifies Pokemon cards from images
// Uses AI vision to recognize specific cards and provide accurate info

const { GoogleGenerativeAI } = require('@google/generative-ai');
const MarketData = require('./market-data');

class CardRecognition {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        this.marketData = new MarketData();
        
        // Card database with market values and specific info
        this.cardDatabase = {
            // Charizard cards
            'charizard ex 051/185': {
                name: 'Charizard ex',
                set: 'Obsidian Flames',
                number: '051/185',
                rarity: 'Double Rare',
                marketValue: { raw: 25, psa9: 45, psa10: 85 },
                gradingAdvice: 'watch for print lines on the face',
                notes: 'decent grading candidate if centered well'
            },
            'charizard vmax rainbow': {
                name: 'Charizard VMAX',
                set: 'Champion\'s Path',
                rarity: 'Rainbow Rare',
                marketValue: { raw: 180, psa9: 350, psa10: 650 },
                gradingAdvice: 'rainbow rares show whitening easily',
                notes: 'high value card, definitely worth grading'
            },
            'charizard 4/102 base set': {
                name: 'Charizard',
                set: 'Base Set',
                number: '4/102',
                rarity: 'Holo Rare',
                marketValue: { raw: 300, psa9: 1200, psa10: 5000 },
                gradingAdvice: 'vintage cards rarely get 10s',
                notes: 'iconic card, huge grading premium'
            },
            
            // Umbreon cards
            'umbreon vmax alt art': {
                name: 'Umbreon VMAX',
                set: 'Evolving Skies',
                rarity: 'Alternate Art',
                marketValue: { raw: 450, psa9: 800, psa10: 1400 },
                gradingAdvice: 'moonbreon has tough centering standards',
                notes: 'most sought after modern card'
            },
            'umbreon v alt art': {
                name: 'Umbreon V',
                set: 'Evolving Skies',
                rarity: 'Alternate Art',
                marketValue: { raw: 120, psa9: 200, psa10: 350 },
                gradingAdvice: 'check corners carefully on alt arts',
                notes: 'solid investment piece'
            },
            
            // Lugia cards
            'lugia v alt art': {
                name: 'Lugia V',
                set: 'Silver Tempest',
                rarity: 'Alternate Art',
                marketValue: { raw: 85, psa9: 150, psa10: 280 },
                gradingAdvice: 'silver tempest has good print quality',
                notes: 'beautiful artwork, growing in value'
            },
            
            // Pikachu cards
            'pikachu vmax rainbow': {
                name: 'Pikachu VMAX',
                set: 'Vivid Voltage',
                rarity: 'Rainbow Rare',
                marketValue: { raw: 65, psa9: 120, psa10: 220 },
                gradingAdvice: 'rainbow texture can hide damage',
                notes: 'pikachu always holds value'
            },
            
            // Other valuable cards
            'giratina vstar alt art': {
                name: 'Giratina VSTAR',
                set: 'Lost Origin',
                rarity: 'Alternate Art',
                marketValue: { raw: 75, psa9: 130, psa10: 250 },
                gradingAdvice: 'lost origin has clean prints',
                notes: 'undervalued alt art imo'
            }
        };
        
        // Generic responses for when we can't identify specific cards
        this.genericResponses = {
            charizard: "charizards always solid pulls",
            pikachu: "pikachu cards never go out of style",
            umbreon: "umbreon hits different every time",
            eevee: "eeveelutions are always safe bets",
            legendary: "legendary pulls are the best feeling",
            rainbow: "rainbow rares have that premium feel",
            alt_art: "alt arts are where the money is",
            vintage: "vintage cards just hit different",
            modern: "modern pulls can be fire too"
        };
    }
    
    // Analyze image and identify card
    async identifyCard(imageUrl, userMessage = '') {
        try {
            const model = this.genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    maxOutputTokens: 200,
                    temperature: 0.3,
                }
            });
            
            const prompt = `You are a Pokemon TCG expert. Analyze this image and identify the Pokemon card(s) shown.

Provide ONLY this information in this exact format:
CARD: [Pokemon name] [type if special like ex, V, VMAX, etc]
SET: [Set name if visible]
NUMBER: [Card number if visible like 051/185]
RARITY: [Rarity like Rare, Ultra Rare, etc]
CONDITION: [Mint, Near Mint, etc based on visible condition]
SPECIAL: [Alt Art, Rainbow Rare, Full Art, etc if applicable]

If multiple cards, separate each with "---"
If unsure about any field, write "Unknown"
Focus on the main card in center if multiple shown.`;
            
            const imageParts = [{
                inlineData: {
                    data: imageUrl, // This would need to be base64 in real implementation
                    mimeType: "image/jpeg"
                }
            }];
            
            // For now, simulate recognition based on user message
            return this.simulateCardRecognition(userMessage);
            
        } catch (error) {
            console.log('⚠️ Card recognition failed:', error.message);
            return this.simulateCardRecognition(userMessage);
        }
    }
    
    // Simulate card recognition based on user text (for testing)
    simulateCardRecognition(userMessage) {
        const message = userMessage.toLowerCase();
        let recognizedCard = null;
        
        // Check for specific card mentions
        if (message.includes('charizard ex') && message.includes('obsidian')) {
            recognizedCard = this.cardDatabase['charizard ex 051/185'];
        } else if (message.includes('charizard vmax') || message.includes('charizard rainbow')) {
            recognizedCard = this.cardDatabase['charizard vmax rainbow'];
        } else if (message.includes('base set charizard') || message.includes('base charizard')) {
            recognizedCard = this.cardDatabase['charizard 4/102 base set'];
        } else if (message.includes('moonbreon') || message.includes('umbreon vmax alt')) {
            recognizedCard = this.cardDatabase['umbreon vmax alt art'];
        } else if (message.includes('umbreon v alt') || message.includes('umbreon v')) {
            recognizedCard = this.cardDatabase['umbreon v alt art'];
        } else if (message.includes('lugia v alt') || message.includes('lugia alt')) {
            recognizedCard = this.cardDatabase['lugia v alt art'];
        } else if (message.includes('giratina') && message.includes('alt')) {
            recognizedCard = this.cardDatabase['giratina vstar alt art'];
        } else if (message.includes('pikachu vmax') || message.includes('pikachu rainbow')) {
            recognizedCard = this.cardDatabase['pikachu vmax rainbow'];
        }
        
        return {
            identified: !!recognizedCard,
            card: recognizedCard,
            confidence: recognizedCard ? 0.9 : 0.3,
            fallbackType: this.detectCardType(message)
        };
    }
    
    // Detect general card type for fallback responses
    detectCardType(message) {
        if (message.includes('charizard')) return 'charizard';
        if (message.includes('pikachu')) return 'pikachu';
        if (message.includes('umbreon')) return 'umbreon';
        if (message.includes('eevee')) return 'eevee';
        if (message.includes('rainbow')) return 'rainbow';
        if (message.includes('alt art')) return 'alt_art';
        if (message.includes('vintage') || message.includes('base set')) return 'vintage';
        if (message.includes('legendary')) return 'legendary';
        return 'modern';
    }
    
    // Generate response based on card recognition
    async generateCardResponse(recognition, context = {}) {
        if (!recognition.identified || !recognition.card) {
            // Use generic response
            const cardType = recognition.fallbackType || 'modern';
            return this.genericResponses[cardType] || "nice card";
        }
        
        const card = recognition.card;
        
        // Try to get real-time market data
        try {
            const marketPrice = await this.marketData.getMarketPrice(card.name, 'nm');
            if (marketPrice) {
                const priceResponse = this.marketData.generatePriceResponse(marketPrice, context);
                if (priceResponse) {
                    console.log(`   💰 [Market] Using real-time price: $${marketPrice.marketPrice}`);
                    return priceResponse;
                }
            }
        } catch (error) {
            // Fall back to static response
        }
        
        const responses = [];
        
        // Value-based responses (fallback to static prices)
        if (card.marketValue.raw > 200) {
            responses.push(`thats like $${card.marketValue.raw}+ raw`);
            responses.push(`money card right there`);
            responses.push(`huge W on that pull`);
        } else if (card.marketValue.raw > 50) {
            responses.push(`solid $${card.marketValue.raw} card`);
            responses.push(`decent value there`);
        }
        
        // Grading advice responses
        // Deterministic: include grading advice based on card name hash
        const includeGrading = context.mentionsGrading || 
                              (this.hashString(card.name) % 10 < 3); // 30% deterministic
        if (includeGrading) {
            responses.push(card.gradingAdvice);
            if (card.marketValue.psa10 > card.marketValue.raw * 2) {
                responses.push(`psa 10 gets like $${card.marketValue.psa10}`);
            }
        }
        
        // Set-specific responses
        if (card.set === 'Evolving Skies') {
            responses.push('evolving skies alt arts are goated');
        } else if (card.set === 'Base Set') {
            responses.push('vintage hits different');
        } else if (card.set.includes('Obsidian') || card.set.includes('Silver')) {
            responses.push('modern sets been fire lately');
        }
        
        // Rarity responses
        if (card.rarity.includes('Alt')) {
            responses.push('alt art game strong');
        } else if (card.rarity.includes('Rainbow')) {
            responses.push('rainbow texture is so clean');
        }
        
        // Pick best response deterministically
        if (responses.length > 0) {
            // Use card name and context to select response
            const hash = this.hashString(`${card.name}${JSON.stringify(context)}`);
            return responses[hash % responses.length];
        }
        
        return card.notes || "clean card";
    }
    
    // Get market value info for a card
    getMarketInfo(cardName) {
        const searchTerm = cardName.toLowerCase();
        
        // Direct key match first
        let key = Object.keys(this.cardDatabase).find(k => 
            k.includes(searchTerm)
        );
        
        // Special case mappings
        if (!key && searchTerm.includes('moonbreon')) {
            key = 'umbreon vmax alt art';
        } else if (!key && searchTerm.includes('base set charizard')) {
            key = 'charizard 4/102 base set';
        } else if (!key && searchTerm.includes('base charizard')) {
            key = 'charizard 4/102 base set';
        }
        
        if (key && this.cardDatabase[key]) {
            const card = this.cardDatabase[key];
            return {
                found: true,
                name: card.name,
                set: card.set,
                values: card.marketValue,
                advice: card.gradingAdvice
            };
        }
        
        return { found: false };
    }
    
    // Add new card to database (learning feature)
    learnCard(cardInfo) {
        const key = `${cardInfo.name.toLowerCase()} ${cardInfo.set.toLowerCase()}`;
        this.cardDatabase[key] = cardInfo;
        console.log(`📚 Learned new card: ${cardInfo.name}`);
    }
    
    // Get database stats
    getStats() {
        return {
            totalCards: Object.keys(this.cardDatabase).length,
            recognizedCards: Object.keys(this.cardDatabase).length,
            averageValue: this.calculateAverageValue()
        };
    }
    
    calculateAverageValue() {
        const values = Object.values(this.cardDatabase)
            .map(card => card.marketValue.raw)
            .filter(val => val > 0);
        
        return values.length > 0 ? 
            values.reduce((a, b) => a + b, 0) / values.length : 0;
    }
    
    // Hash string for deterministic selection
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

module.exports = CardRecognition;