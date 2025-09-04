// Card Set Validator - Validates if identified cards belong to mentioned sets
class CardSetValidator {
    constructor() {
        // Common set abbreviations and their full names
        this.setMappings = {
            // Scarlet & Violet Era
            'paradox rift': ['Paradox Rift', 'PAR'],
            'paldea evolved': ['Paldea Evolved', 'PAL'], 
            'obsidian flames': ['Obsidian Flames', 'OBF'],
            'scarlet violet': ['Scarlet & Violet', 'SVI'],
            'crown zenith': ['Crown Zenith', 'CRZ'],
            
            // Sword & Shield Era
            'evolving skies': ['Evolving Skies', 'EVS'],
            'fusion strike': ['Fusion Strike', 'FST'],
            'brilliant stars': ['Brilliant Stars', 'BRS'],
            'astral radiance': ['Astral Radiance', 'ASR'],
            'lost origin': ['Lost Origin', 'LOR'],
            'silver tempest': ['Silver Tempest', 'SIT'],
            
            // Classic Sets
            'base set': ['Base Set', 'Base', 'BS'],
            'jungle': ['Jungle', 'JU'],
            'fossil': ['Fossil', 'FO'],
            'team rocket': ['Team Rocket', 'TR'],
            
            // Special Sets
            'celebrations': ['Celebrations', 'CEL'],
            'shining fates': ['Shining Fates', 'SHF'],
            'hidden fates': ['Hidden Fates', 'HIF'],
            'champions path': ['Champion\'s Path', 'CPA']
        };
        
        // Cards that commonly appear in multiple sets
        this.commonCards = [
            'pikachu', 'charizard', 'mewtwo', 'eevee', 'snorlax',
            'gengar', 'dragonite', 'lucario', 'garchomp', 'umbreon'
        ];
        
        // Generic cards that might be misidentified
        this.genericCards = [
            'energy', 'trainer', 'stadium', 'tool', 'supporter',
            'item', 'pokemon', 'basic', 'stage', 'evolution'
        ];
    }
    
    // Extract set names from text
    extractSetFromText(text) {
        const textLower = text.toLowerCase();
        const foundSets = [];
        
        for (const [key, values] of Object.entries(this.setMappings)) {
            if (textLower.includes(key)) {
                foundSets.push(values[0]); // Return full name
            }
            
            // Also check abbreviations
            for (const abbr of values) {
                if (textLower.includes(abbr.toLowerCase())) {
                    foundSets.push(values[0]);
                    break;
                }
            }
        }
        
        return [...new Set(foundSets)]; // Remove duplicates
    }
    
    // Check if a card name is likely generic/misidentified
    isGenericCard(cardName) {
        const nameLower = cardName.toLowerCase();
        return this.genericCards.some(generic => nameLower.includes(generic));
    }
    
    // Validate if card could belong to mentioned set
    validateCardForSet(cardName, setName) {
        // If no set mentioned, we can't validate
        if (!setName) return { valid: true, confidence: 0.5 };
        
        // Generic cards are likely misidentifications
        if (this.isGenericCard(cardName)) {
            return { valid: false, confidence: 0.2, reason: 'Generic card name' };
        }
        
        // Common cards appear in many sets, so they're plausible
        const cardLower = cardName.toLowerCase();
        if (this.commonCards.some(common => cardLower.includes(common))) {
            return { valid: true, confidence: 0.7, reason: 'Common Pokemon across sets' };
        }
        
        // For specific validation, we'd need a full database
        // For now, return medium confidence
        return { valid: true, confidence: 0.6 };
    }
    
    // Validate vision results against tweet context
    validateVisionResults(visionResult, tweetText) {
        const validatedCards = [];
        const mentionedSets = this.extractSetFromText(tweetText);
        
        for (const card of visionResult.cards || []) {
            // Skip low confidence cards
            if (card.confidence < 0.8) {
                console.log(`   ⚠️ Skipping ${card.name} - low confidence (${card.confidence})`);
                continue;
            }
            
            // Check if card is generic
            if (this.isGenericCard(card.name)) {
                console.log(`   ⚠️ Skipping ${card.name} - generic card name`);
                continue;
            }
            
            // If sets are mentioned, validate against them
            if (mentionedSets.length > 0) {
                let highestValidation = { valid: false, confidence: 0 };
                
                for (const set of mentionedSets) {
                    const validation = this.validateCardForSet(card.name, set);
                    if (validation.confidence > highestValidation.confidence) {
                        highestValidation = validation;
                    }
                }
                
                if (highestValidation.valid && highestValidation.confidence >= 0.6) {
                    validatedCards.push({
                        ...card,
                        adjustedConfidence: card.confidence * highestValidation.confidence
                    });
                }
            } else {
                // No set mentioned, use original confidence
                validatedCards.push(card);
            }
        }
        
        return validatedCards;
    }
    
    // Check if the identified cards make sense for a pack opening
    validatePackOpening(cards, setName) {
        // Pack openings usually show multiple cards
        if (cards.length === 0) return false;
        
        // If only one card with low confidence, probably misidentified
        if (cards.length === 1 && cards[0].confidence < 0.85) {
            return false;
        }
        
        // Check if cards are from the same set (if we had set data)
        // For now, return true if we have any validated cards
        return cards.length > 0;
    }
}

module.exports = CardSetValidator;