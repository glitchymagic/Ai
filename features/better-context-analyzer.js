// Better Context Analyzer - Understands what tweets are actually about
class BetterContextAnalyzer {
    constructor() {
        this.contextPatterns = {
            // Gaming contexts
            videoGame: {
                patterns: [
                    /\b(playing|gameplay|nintendo|switch|legends|arceus|scarlet|violet|battle|caught|shiny|level|trainer)\b/i,
                    /\b(pokemon go|pokemongo|raids?|gym|pokestop)\b/i,
                    /\b(team rocket|giovanni|professor|elite four)\b/i
                ],
                notPatterns: [/\b(tcg|card|pull|pack|booster)\b/i]
            },
            
            // Fan content
            fanArt: {
                patterns: [
                    /\b(drew|drawing|painted|painting|art|artwork|design|oc|commission|sketch|doodle|illustration)\b/i,
                    /\b(my art|i made|created|designed)\b/i
                ],
                notPatterns: [/\b(card art|alt art)\b/i]
            },
            
            // Anime/Show
            anime: {
                patterns: [
                    /\b(episode|anime|series|season|watching|watched|horizons|journeys|ash|pikachu's)\b/i,
                    /\b(pokemon horizons|anipoke)\b/i
                ],
                notPatterns: [/\b(tcg|card collection)\b/i]
            },
            
            // Merchandise (non-card)
            merchandise: {
                patterns: [
                    /\b(plush|plushie|figure|figurine|toy|merch|shirt|hoodie|bag|keychain|pin|badge)\b/i,
                    /\b(pokemon center|store|shop|bought|ordered)\b/i
                ],
                notPatterns: [/\b(card|pack|booster|etb)\b/i]
            },
            
            // TCG specific
            tcgContent: {
                patterns: [
                    /\b(tcg|pokemon card|pulls?|pulled|pack|booster|etb|collection|binder|sleeve|toploader)\b/i,
                    /\b(psa|bgs|cgc|grade|graded|mint|near mint|centering)\b/i,
                    /\b(charizard|pikachu|umbreon|rayquaza|gengar|mewtwo).*(vmax|vstar|ex|gx|alt art|rainbow)\b/i,
                    /\b(evolving skies|lost origin|crown zenith|base set|vintage|modern)\b/i
                ],
                notPatterns: []
            },
            
            // Sales/Trading
            salesTrading: {
                patterns: [
                    /\b(wts|wtb|lf|looking for|selling|trading|trade|sale|price|offer)\b/i,
                    /\b(dm for|dm me|interested|available|shipping)\b/i
                ],
                notPatterns: []
            },
            
            // Personal/Social
            personal: {
                patterns: [
                    /\b(good morning|good night|how are you|happy|birthday|congrats|thank you)\b/i,
                    /\b(my day|today i|yesterday|tomorrow|weekend)\b/i
                ],
                notPatterns: []
            }
        };
    }
    
    analyzeContext(text, visualData = null) {
        const contexts = [];
        const textLower = text.toLowerCase();
        
        // Check each context type
        for (const [contextType, config] of Object.entries(this.contextPatterns)) {
            let matches = 0;
            let blocked = false;
            let matchedPatterns = [];
            
            // Check positive patterns
            for (const pattern of config.patterns) {
                if (pattern.test(text)) {
                    matches++;
                    matchedPatterns.push(pattern.source);
                }
            }
            
            // Check negative patterns
            for (const notPattern of config.notPatterns) {
                if (notPattern.test(text)) {
                    blocked = true;
                    break;
                }
            }
            
            if (matches > 0 && !blocked) {
                contexts.push({
                    type: contextType,
                    confidence: Math.min(matches / config.patterns.length, 1),
                    matches,
                    matchedPatterns
                });
            }
        }
        
        // Sort by confidence
        contexts.sort((a, b) => b.confidence - a.confidence);
        
        // Determine primary context
        const primaryContext = contexts[0]?.type || 'general';
        
        // Special handling for mixed contexts
        const isMixedContext = contexts.length > 1 && contexts[0].confidence < 0.7;
        
        // Extract specific details
        const extractedDetails = this.extractSpecificDetails(text);
        
        return {
            primary: primaryContext,
            secondary: contexts[1]?.type || null,
            contexts,
            isMixedContext,
            hasVisualContent: !!visualData,
            isAmbiguous: contexts.length === 0 || contexts[0]?.confidence < 0.3,
            details: extractedDetails
        };
    }
    
    // Extract specific Pokemon names, emotions, and actions
    extractSpecificDetails(text) {
        const details = {
            pokemon: [],
            emotions: [],
            actions: [],
            sets: [],
            products: []
        };
        
        // Pokemon names (comprehensive list)
        const pokemonPatterns = [
            /\b(charizard|pikachu|umbreon|eevee|gengar|mewtwo|mew|lugia|rayquaza)\b/gi,
            /\b(dragonite|gyarados|blastoise|venusaur|snorlax|lapras|articuno|zapdos|moltres)\b/gi,
            /\b(garchomp|lucario|greninja|sylveon|espeon|glaceon|leafeon|flareon|jolteon|vaporeon)\b/gi,
            /\b(alakazam|machamp|scyther|aerodactyl|tyranitar|salamence|metagross|dialga|palkia)\b/gi,
            /\b(giratina|arceus|darkrai|shaymin|victini|zekrom|reshiram|kyurem|xerneas|yveltal)\b/gi,
            /\b(ditto|magikarp|psyduck|squirtle|bulbasaur|charmander|totodile|cyndaquil|chikorita)\b/gi
        ];
        
        for (const pattern of pokemonPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                details.pokemon.push(...matches.map(m => m.toLowerCase()));
            }
        }
        
        // Emotions and sentiment
        const emotionPatterns = {
            excited: /\b(excited|hyped|pumped|stoked|thrilled|amazing|incredible|wow|omg|lets go)\b/gi,
            happy: /\b(happy|glad|pleased|satisfied|love|awesome|great|nice|cool)\b/gi,
            disappointed: /\b(disappointed|sad|upset|bummed|sucks|terrible|awful|bad)\b/gi,
            anxious: /\b(worried|nervous|anxious|concerned|hoping|fingers crossed|pray)\b/gi,
            curious: /\b(wonder|curious|thinking|maybe|possibly|what if|anyone know)\b/gi
        };
        
        for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
            if (pattern.test(text)) {
                details.emotions.push(emotion);
            }
        }
        
        // Actions
        const actionPatterns = {
            pulled: /\b(pulled|got|hit|found|opened)\b/gi,
            buying: /\b(buying|bought|purchasing|ordered|preordered)\b/gi,
            selling: /\b(selling|sold|listing|for sale|wts)\b/gi,
            trading: /\b(trading|trade|swap|looking for|lf|ft)\b/gi,
            hunting: /\b(hunting|searching|looking|chasing|seeking)\b/gi,
            grading: /\b(grading|graded|submitting|sent to psa|sending)\b/gi
        };
        
        for (const [action, pattern] of Object.entries(actionPatterns)) {
            if (pattern.test(text)) {
                details.actions.push(action);
            }
        }
        
        // Sets
        const setPatterns = [
            /\b(base set|jungle|fossil|team rocket|base set 2)\b/gi,
            /\b(evolving skies|lost origin|silver tempest|crown zenith)\b/gi,
            /\b(stellar crown|surging sparks|paradox rift|obsidian flames)\b/gi,
            /\b(paldea evolved|scarlet violet|temporal forces)\b/gi
        ];
        
        for (const pattern of setPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                details.sets.push(...matches.map(m => m.toLowerCase()));
            }
        }
        
        // Products
        const productPatterns = [
            /\b(booster box|booster|pack|etb|elite trainer box)\b/gi,
            /\b(collection box|premium collection|upc|ultra premium)\b/gi,
            /\b(tin|blister|bundle|case)\b/gi
        ];
        
        for (const pattern of productPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                details.products.push(...matches.map(m => m.toLowerCase()));
            }
        }
        
        // Deduplicate
        details.pokemon = [...new Set(details.pokemon)];
        details.emotions = [...new Set(details.emotions)];
        details.actions = [...new Set(details.actions)];
        details.sets = [...new Set(details.sets)];
        details.products = [...new Set(details.products)];
        
        return details;
    }
    
    // Generate response strategy based on context
    getResponseStrategy(contextAnalysis, text) {
        const strategies = {
            videoGame: {
                approach: 'gaming',
                topics: ['gameplay', 'achievements', 'game mechanics', 'shiny hunting'],
                avoid: ['card prices', 'TCG terms', 'pulls']
            },
            fanArt: {
                approach: 'artistic',
                topics: ['art style', 'colors', 'design', 'creativity'],
                avoid: ['card value', 'TCG rarity', 'alt art prices']
            },
            anime: {
                approach: 'entertainment',
                topics: ['episodes', 'characters', 'story', 'favorite moments'],
                avoid: ['card collecting', 'market values']
            },
            merchandise: {
                approach: 'collector',
                topics: ['quality', 'where to buy', 'favorites', 'display'],
                avoid: ['card grading', 'TCG specific terms']
            },
            tcgContent: {
                approach: 'tcg',
                topics: ['pulls', 'collection', 'market', 'condition'],
                avoid: []
            },
            salesTrading: {
                approach: 'market',
                topics: ['price', 'condition', 'shipping', 'availability'],
                avoid: ['personal opinions unless asked']
            },
            personal: {
                approach: 'friendly',
                topics: ['shared interests', 'positivity', 'community'],
                avoid: ['technical jargon', 'market talk']
            },
            general: {
                approach: 'adaptive',
                topics: ['pokemon in general', 'community', 'shared enjoyment'],
                avoid: ['assuming specific context']
            }
        };
        
        const primary = contextAnalysis.primary;
        const strategy = strategies[primary] || strategies.general;
        
        // Add specific guidance based on text analysis
        if (text.includes('?')) {
            strategy.isQuestion = true;
        }
        
        if (contextAnalysis.isMixedContext) {
            strategy.approach = 'balanced';
            strategy.considerSecondary = contextAnalysis.secondary;
        }
        
        return strategy;
    }
}

module.exports = BetterContextAnalyzer;