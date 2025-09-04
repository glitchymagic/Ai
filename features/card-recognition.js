// Card Recognition System - Identifies Pokemon cards from images
// Uses AI vision to recognize specific cards and provide accurate info

const { GoogleGenerativeAI } = require('@google/generative-ai');
const MarketData = require('./market-data');
const GeminiKeyManager = require('./gemini-key-manager');

class CardRecognition {
    constructor(lmstudio = null, geminiKeys = null) {
        // Use key manager if multiple keys provided
        if (geminiKeys && geminiKeys.length > 0) {
            this.keyManager = new GeminiKeyManager(geminiKeys);
            this.useKeyManager = true;
        } else {
            // Fallback to single key
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
            this.useKeyManager = false;
        }
        
        this.marketData = new MarketData();
        this.lmstudio = lmstudio;
        
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
    async identifyCard(imageBase64, userMessage = '') {
        try {
            // If no image provided, fall back to text analysis
            if (!imageBase64) {
                return this.simulateCardRecognition(userMessage);
            }
            
            // Try up to 3 times with exponential backoff for 503 errors
            let lastError;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    // Use key manager or regular model
                    const model = this.useKeyManager 
                        ? await this.keyManager.createModel("gemini-1.5-flash")
                        : this.genAI.getGenerativeModel({ 
                            model: "gemini-1.5-flash",
                            generationConfig: {
                                maxOutputTokens: 200,
                                temperature: 0.3,
                            }
                        });
                
                    const prompt = `Analyze this Pokemon-related image carefully.

FIRST, determine what type of image this is:
- EVENT POSTER: Has event details (date, time, location, entry fee), Pokemon are decorative mascots
- POKEMON CARD: Actual TCG card with HP, attacks, energy costs, card number
- CARD COLLECTION: Multiple cards in binder/display
- FAN ART: Drawings, digital art, custom Pokemon designs, artistic renderings
- OTHER: Memes, products, screenshots, non-art content

If this is an EVENT POSTER, FAN ART, or OTHER, respond with:
TYPE: EVENT_POSTER (or FAN_ART or OTHER)
DESCRIPTION: [what the poster/image shows]

If this is a POKEMON CARD, provide:
TYPE: CARD
CARD: [Pokemon name] [type if special like ex, V, VMAX, etc]
SET: [Set name if visible]
NUMBER: [Card number if visible like 051/185]
RARITY: [Rarity like Rare, Ultra Rare, etc]
CONDITION: [Mint, Near Mint, etc based on visible condition]
SPECIAL: [Alt Art, Rainbow Rare, Full Art, etc if applicable]

Important: Pokemon characters on event posters are NOT cards!`;
                
                    const imageParts = [{
                        inlineData: {
                            data: imageBase64,
                            mimeType: "image/jpeg"
                        }
                    }];
                    
                    // Call Gemini Vision API
                    const result = await model.generateContent([prompt, ...imageParts]);
                    const response = result.response.text();
                    
                    // Parse the response
                    return this.parseCardRecognition(response, userMessage);
                    
                } catch (error) {
                    lastError = error;
                    
                    // If it's a 503 error and we have attempts left, retry
                    if (error.message && error.message.includes('503') && attempt < 3) {
                        const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
                        console.log(`   🔄 Gemini overloaded, retrying in ${waitTime/1000}s (attempt ${attempt}/3)...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }
                    
                    // For other errors or final attempt, throw
                    throw error;
                }
            }
            
            // If we get here, all retries failed
            throw lastError;
            
        } catch (error) {
            console.log('⚠️ Card recognition failed:', error.message);
            
            // Check if it's a quota error
            if (error.message && error.message.includes('429')) {
                console.log('   🔄 Quota exceeded, trying local LLM fallback...');
                return await this.analyzeWithLocalLLM(imageBase64, userMessage);
            }
            
            // Check if it's a service overload error (503)
            if (error.message && error.message.includes('503')) {
                console.log('   ⚠️ Gemini service overloaded (503), using fallback...');
                // Try local LLM first
                if (this.lmstudio && this.lmstudio.available) {
                    return await this.analyzeWithLocalLLM(imageBase64, userMessage);
                }
                // Otherwise use text-based fallback
                return this.simulateCardRecognition(userMessage);
            }
            
            // For other errors, use text-based fallback
            return this.simulateCardRecognition(userMessage);
        }
    }
    
    // Parse Gemini's card recognition response
    parseCardRecognition(apiResponse, userMessage) {
        const lines = apiResponse.split('\n');
        const responseData = {};
        
        lines.forEach(line => {
            if (line.startsWith('TYPE:')) {
                responseData.type = line.replace('TYPE:', '').trim();
            } else if (line.startsWith('DESCRIPTION:')) {
                responseData.description = line.replace('DESCRIPTION:', '').trim();
            } else if (line.startsWith('CARD:')) {
                responseData.name = line.replace('CARD:', '').trim();
            } else if (line.startsWith('SET:')) {
                responseData.set = line.replace('SET:', '').trim();
            } else if (line.startsWith('NUMBER:')) {
                responseData.number = line.replace('NUMBER:', '').trim();
            } else if (line.startsWith('RARITY:')) {
                responseData.rarity = line.replace('RARITY:', '').trim();
            } else if (line.startsWith('SPECIAL:')) {
                responseData.special = line.replace('SPECIAL:', '').trim();
            }
        });
        
        // If it's not a card, return not identified
        if (responseData.type === 'EVENT_POSTER' || responseData.type === 'FAN_ART' || responseData.type === 'OTHER') {
            console.log(`   📋 Identified as ${responseData.type}, not a card`);
            return {
                identified: false,
                isEventPoster: responseData.type === 'EVENT_POSTER',
                isFanArt: responseData.type === 'FAN_ART',
                description: responseData.description,
                confidence: 0,
                fallbackType: responseData.type === 'FAN_ART' ? 'fanart' : 'event'
            };
        }
        
        // Try to match with our database
        let recognizedCard = null;
        const searchKey = `${responseData.name} ${responseData.set}`.toLowerCase();
        
        // Look for exact match first
        for (const [key, card] of Object.entries(this.cardDatabase)) {
            if (key.includes(responseData.name?.toLowerCase() || '') || 
                (responseData.name && card.name.toLowerCase().includes(responseData.name.toLowerCase()))) {
                recognizedCard = card;
                break;
            }
        }
        
        // If we have card info from vision API
        if (responseData.name && responseData.name !== 'Unknown') {
            return {
                identified: true,
                card: recognizedCard || {
                    name: responseData.name,
                    set: responseData.set || 'Unknown Set',
                    rarity: responseData.rarity || 'Unknown Rarity',
                    marketValue: { raw: 0, psa9: 0, psa10: 0 },
                    notes: `${responseData.special || 'Nice card'}!`
                },
                confidence: recognizedCard ? 0.95 : 0.7,
                visionData: responseData,
                fallbackType: this.detectCardType(responseData.name + ' ' + userMessage)
            };
        }
        
        // Fall back to text analysis
        return this.simulateCardRecognition(userMessage);
    }
    
    // Analyze image with local LLM when Gemini quota is exceeded
    async analyzeWithLocalLLM(imageBase64, userMessage) {
        try {
            // Check if LM Studio is available
            if (!this.lmstudio || !this.lmstudio.available) {
                console.log('   ⚠️ LM Studio not available, using text fallback');
                return this.simulateCardRecognition(userMessage);
            }
            
            // Note: Most local LLMs don't support vision yet
            // We'll use a hybrid approach: describe what we expect and use context
            console.log('   🤖 Using LM Studio for context-aware analysis...');
            
            const prompt = `Based on a Pokemon TCG image posted with the text: "${userMessage}"
            
Common cards mentioned in similar posts:
- Charizard ex (Obsidian Flames) - popular pull
- Umbreon VMAX Alt Art - high value
- Base Set cards - vintage
- Paradox Rift pulls - recent set

What Pokemon card is most likely being shown? Consider:
1. The tweet text context
2. Recent popular pulls
3. Set mentions

Respond with: CARD_NAME|SET_NAME|RARITY or NONE if unclear`;

            const response = await this.lmstudio.generateCustom(prompt);
            
            if (response && response !== 'NONE') {
                const [cardName, setName, rarity] = response.split('|');
                console.log(`   🎯 LM Studio identified: ${cardName} from ${setName}`);
                
                // Look up in database
                const searchKey = cardName.toLowerCase();
                for (const [key, card] of Object.entries(this.cardDatabase)) {
                    if (key.includes(searchKey) || card.name.toLowerCase().includes(searchKey)) {
                        return {
                            identified: true,
                            card: card,
                            confidence: 0.65, // Lower confidence for context-based
                            fallbackType: 'lmstudio_context'
                        };
                    }
                }
                
                // Return generic card info if not in database
                return {
                    identified: true,
                    card: {
                        name: cardName,
                        set: setName || 'Unknown Set',
                        rarity: rarity || 'Unknown Rarity',
                        marketValue: { raw: 0, psa9: 0, psa10: 0 },
                        notes: 'Nice pull!'
                    },
                    confidence: 0.6,
                    fallbackType: 'lmstudio_generic'
                };
            }
            
            // If LM Studio couldn't determine, use text fallback
            return this.simulateCardRecognition(userMessage);
            
        } catch (error) {
            console.log('   ⚠️ LM Studio fallback failed:', error.message);
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