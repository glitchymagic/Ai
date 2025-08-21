// Advanced Context Analyzer for Better Response Generation
class ContextAnalyzer {
    constructor() {
        // Keywords for different contexts
        this.contexts = {
            showing_pulls: {
                keywords: ['pulled', 'pulls', 'pack', 'opened', 'hit', 'got', 'from'],
                responseType: 'appreciation',
                focus: 'specific_card'
            },
            asking_value: {
                keywords: ['worth', 'value', 'price', 'how much', 'sell', 'buy'],
                responseType: 'informative',
                focus: 'market_price'
            },
            showing_collection: {
                keywords: ['collection', 'my cards', 'binder', 'display', 'showcase'],
                responseType: 'appreciation',
                focus: 'collection_quality'
            },
            seeking_advice: {
                keywords: ['should i', 'what do you think', 'advice', 'help', 'which'],
                responseType: 'helpful',
                focus: 'give_advice'
            },
            grading_discussion: {
                keywords: ['grade', 'psa', 'bgs', 'cgc', 'centering', 'condition'],
                responseType: 'technical',
                focus: 'grading_tips'
            },
            trade_offer: {
                keywords: ['trade', 'trading', 'ft', 'lf', 'swap', 'exchange'],
                responseType: 'engagement',
                focus: 'trade_interest'
            },
            store_find: {
                keywords: ['found', 'walmart', 'target', 'store', 'restock', 'shelf'],
                responseType: 'excitement',
                focus: 'store_tips'
            },
            mail_day: {
                keywords: ['mail day', 'mailday', 'arrived', 'came in', 'delivered', 'package'],
                responseType: 'celebration',
                focus: 'mail_excitement'
            },
            error_card: {
                keywords: ['error', 'misprint', 'miscut', 'crimp', 'defect', 'factory'],
                responseType: 'technical',
                focus: 'error_value'
            },
            sale_post: {
                keywords: ['sale', 'selling', 'fs', 'for sale', 'available', 'dm'],
                responseType: 'neutral',
                focus: 'sale_acknowledgment'
            },
            question: {
                keywords: ['?', 'what', 'when', 'where', 'how', 'why', 'which'],
                responseType: 'answer',
                focus: 'direct_answer'
            },
            disappointment: {
                keywords: ['worst', 'bad', 'terrible', 'no hits', 'bulk', 'unlucky', 'rip'],
                responseType: 'supportive',
                focus: 'encouragement'
            },
            achievement: {
                keywords: ['finally', 'completed', 'master set', 'goal', 'grail', 'chase'],
                responseType: 'celebration',
                focus: 'congratulations'
            }
        };
        
        // Specific card mentions to recognize
        this.specificCards = {
            'charizard': { value: 'high', interest: 'very high' },
            'pikachu': { value: 'varies', interest: 'high' },
            'umbreon': { value: 'high', interest: 'very high' },
            'moonbreon': { value: 'very high', interest: 'extreme' },
            'lugia': { value: 'high', interest: 'high' },
            'rayquaza': { value: 'high', interest: 'high' },
            'gengar': { value: 'medium-high', interest: 'high' },
            'mewtwo': { value: 'medium-high', interest: 'high' },
            'eevee': { value: 'medium', interest: 'high' },
            'eeveelution': { value: 'medium-high', interest: 'very high' }
        };
        
        // Set recognition
        this.sets = {
            'evolving skies': { hot: true, focus: 'eeveelutions' },
            'lost origin': { hot: true, focus: 'giratina' },
            'silver tempest': { hot: true, focus: 'lugia' },
            'crown zenith': { hot: true, focus: 'galarian gallery' },
            '151': { hot: true, focus: 'nostalgia' },
            'obsidian flames': { hot: true, focus: 'charizard' },
            'paradox rift': { hot: true, focus: 'roaring moon' },
            'twilight masquerade': { hot: true, focus: 'ogerpon' },
            'base set': { hot: true, focus: 'vintage' },
            'hidden fates': { hot: true, focus: 'shiny vault' },
            'champions path': { hot: false, focus: 'charizard hunt' }
        };
    }
    
    // Analyze the full context of a post
    analyzePost(text, hasImage = false) {
        const textLower = text.toLowerCase();
        const analysis = {
            primaryContext: null,
            secondaryContexts: [],
            specificCards: [],
            sets: [],
            sentiment: 'neutral',
            hasQuestion: false,
            needsAdvice: false,
            showingOff: false,
            responseStrategy: null,
            keyPoints: []
        };
        
        // Detect primary context
        let highestScore = 0;
        for (const [contextName, contextData] of Object.entries(this.contexts)) {
            const score = this.calculateContextScore(textLower, contextData.keywords);
            if (score > highestScore) {
                highestScore = score;
                analysis.primaryContext = {
                    type: contextName,
                    ...contextData,
                    confidence: score
                };
            } else if (score > 0) {
                analysis.secondaryContexts.push(contextName);
            }
        }
        
        // Detect specific cards mentioned
        for (const [cardName, cardData] of Object.entries(this.specificCards)) {
            if (textLower.includes(cardName)) {
                analysis.specificCards.push({ name: cardName, ...cardData });
                analysis.keyPoints.push(`Mentions ${cardName}`);
            }
        }
        
        // Detect sets mentioned
        for (const [setName, setData] of Object.entries(this.sets)) {
            if (textLower.includes(setName)) {
                analysis.sets.push({ name: setName, ...setData });
                analysis.keyPoints.push(`${setName} set`);
            }
        }
        
        // Analyze sentiment
        if (textLower.includes('!') || textLower.includes('amazing') || textLower.includes('awesome')) {
            analysis.sentiment = 'excited';
            analysis.showingOff = true;
        } else if (textLower.includes('sad') || textLower.includes('disappointed') || textLower.includes('worst')) {
            analysis.sentiment = 'disappointed';
        } else if (textLower.includes('?')) {
            analysis.hasQuestion = true;
            analysis.sentiment = 'curious';
        }
        
        // Check if they need advice
        if (textLower.includes('should') || textLower.includes('help') || textLower.includes('advice')) {
            analysis.needsAdvice = true;
        }
        
        // Determine response strategy
        analysis.responseStrategy = this.determineResponseStrategy(analysis, hasImage);
        
        return analysis;
    }
    
    // Calculate how well text matches context keywords
    calculateContextScore(text, keywords) {
        let score = 0;
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                score += keyword.length > 5 ? 2 : 1; // Longer keywords = stronger signal
            }
        }
        return score;
    }
    
    // Determine the best response strategy
    determineResponseStrategy(analysis, hasImage) {
        // If they're asking a question, answer it
        if (analysis.hasQuestion) {
            return {
                approach: 'answer_question',
                tone: 'helpful',
                elements: ['direct_answer', 'additional_info']
            };
        }
        
        // If they need advice, give it
        if (analysis.needsAdvice) {
            return {
                approach: 'give_advice',
                tone: 'knowledgeable',
                elements: ['specific_tip', 'reasoning']
            };
        }
        
        // If they're showing off, appreciate
        if (analysis.showingOff) {
            return {
                approach: 'appreciate',
                tone: 'excited',
                elements: ['compliment', 'specific_observation']
            };
        }
        
        // If disappointed, encourage
        if (analysis.sentiment === 'disappointed') {
            return {
                approach: 'encourage',
                tone: 'supportive',
                elements: ['empathy', 'positive_outlook']
            };
        }
        
        // If specific valuable card mentioned
        if (analysis.specificCards.length > 0) {
            const highValueCard = analysis.specificCards.find(c => c.value.includes('high'));
            if (highValueCard) {
                return {
                    approach: 'discuss_card',
                    tone: 'knowledgeable',
                    elements: ['card_value', 'market_insight']
                };
            }
        }
        
        // Default based on primary context
        if (analysis.primaryContext) {
            return {
                approach: analysis.primaryContext.responseType,
                tone: 'friendly',
                elements: [analysis.primaryContext.focus]
            };
        }
        
        // Fallback
        return {
            approach: 'general_engagement',
            tone: 'friendly',
            elements: ['observation', 'question']
        };
    }
    
    // Generate a context-aware response
    generateContextualResponse(text, hasImage = false) {
        const analysis = this.analyzePost(text, hasImage);
        const strategy = analysis.responseStrategy;
        
        // Build response based on strategy
        let response = '';
        
        switch (strategy.approach) {
            case 'answer_question':
                response = this.generateAnswer(analysis, text);
                break;
                
            case 'give_advice':
                response = this.generateAdvice(analysis, text);
                break;
                
            case 'appreciate':
                response = this.generateAppreciation(analysis, text);
                break;
                
            case 'encourage':
                response = this.generateEncouragement(analysis);
                break;
                
            case 'discuss_card':
                response = this.generateCardDiscussion(analysis);
                break;
                
            case 'technical':
                response = this.generateTechnicalResponse(analysis, text);
                break;
                
            default:
                response = this.generateGeneralResponse(analysis, hasImage);
        }
        
        return response;
    }
    
    // Generate specific response types
    generateAnswer(analysis, text) {
        const textLower = text.toLowerCase();
        
        if (textLower.includes('worth') || textLower.includes('value')) {
            if (analysis.specificCards.length > 0) {
                const card = analysis.specificCards[0];
                return `That ${card.name} has ${card.value} value. Check TCGPlayer for current prices`;
            }
            return "Check TCGPlayer for current market value";
        }
        
        if (textLower.includes('where')) {
            return "Target restocks Tuesday/Thursday mornings usually";
        }
        
        if (textLower.includes('grade')) {
            return "Check centering and corners first. PSA is popular for Pokemon";
        }
        
        return "Depends on condition and current market";
    }
    
    generateAdvice(analysis, text) {
        const textLower = text.toLowerCase();
        
        if (textLower.includes('grade')) {
            return "If centering is 60/40 or better and corners are sharp, worth grading";
        }
        
        if (textLower.includes('invest')) {
            return "Sealed products and vintage cards tend to hold value best";
        }
        
        if (textLower.includes('buy')) {
            return "TCGPlayer has competitive prices. Check sold listings on eBay too";
        }
        
        return "Research recent sales before deciding";
    }
    
    generateAppreciation(analysis, text) {
        if (analysis.specificCards.length > 0) {
            const card = analysis.specificCards[0];
            return `That ${card.name} is beautiful! Great pull`;
        }
        
        if (analysis.sets.length > 0) {
            const set = analysis.sets[0];
            return `${set.name} has amazing cards. Nice addition!`;
        }
        
        return "Awesome card! The artwork on that is incredible";
    }
    
    generateEncouragement(analysis) {
        return "Better luck next time! Every collector has those days";
    }
    
    generateCardDiscussion(analysis) {
        const card = analysis.specificCards[0];
        
        if (card.name === 'moonbreon') {
            return "Moonbreon is the grail! Evolving Skies chase card right there";
        }
        
        if (card.name === 'charizard') {
            return "Charizard always holds value. Which set is it from?";
        }
        
        return `${card.name} is a solid card with ${card.interest} collector interest`;
    }
    
    generateTechnicalResponse(analysis, text) {
        const textLower = text.toLowerCase();
        
        if (textLower.includes('centering')) {
            return "Centering looks good from here. Front/back alignment matters for grades";
        }
        
        if (textLower.includes('error') || textLower.includes('miscut')) {
            return "Error cards can be valuable to the right collector";
        }
        
        if (textLower.includes('psa 10')) {
            return "PSA 10s command premium prices. Congrats on the gem!";
        }
        
        return "Condition is key for value. Keep it protected";
    }
    
    generateGeneralResponse(analysis, hasImage) {
        if (hasImage) {
            if (analysis.primaryContext && analysis.primaryContext.type === 'showing_pulls') {
                return "Nice pulls! Which one's your favorite?";
            }
            return "Great cards! The condition looks solid";
        }
        
        if (analysis.sets.length > 0) {
            return `${analysis.sets[0].name} is a great set to collect`;
        }
        
        return "Cool to see the collection growing!";
    }
}

module.exports = ContextAnalyzer;