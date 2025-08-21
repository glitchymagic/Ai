// Pokemon Card Knowledge Base
class CardKnowledge {
    constructor() {
        // Popular chase cards and their approximate values
        this.chaseCards = {
            'moonbreon': { name: 'Umbreon VMAX Alt Art', value: '$400-600', set: 'Evolving Skies' },
            'charizard': { name: 'Charizard', value: 'Varies by set', note: 'Always valuable' },
            'lugia': { name: 'Lugia Alt Arts', value: '$200-400', set: 'Silver Tempest' },
            'rayquaza': { name: 'Rayquaza VMAX Alt', value: '$250-350', set: 'Evolving Skies' },
            'giratina': { name: 'Giratina V Alt', value: '$200-300', set: 'Lost Origin' },
            'palkia': { name: 'Palkia V Alt', value: '$150-200', set: 'Astral Radiance' },
            'aerodactyl': { name: 'Aerodactyl V Alt', value: '$80-120', set: 'Lost Origin' },
            'machamp': { name: 'Machamp V Alt', value: '$70-100', set: 'Astral Radiance' }
        };
        
        // Current popular sets
        this.sets = {
            'twilight masquerade': { released: '2024', hot: true, chaseCard: 'Ogerpon ex' },
            'temporal forces': { released: '2024', hot: true, chaseCard: 'Iron Thorns ex' },
            'paradox rift': { released: '2023', hot: true, chaseCard: 'Roaring Moon ex' },
            'obsidian flames': { released: '2023', hot: true, chaseCard: 'Charizard ex' },
            '151': { released: '2023', hot: true, chaseCard: 'Charizard ex', note: 'Nostalgic set' },
            'crown zenith': { released: '2023', hot: true, chaseCard: 'Giratina VSTAR GG' },
            'silver tempest': { released: '2022', hot: true, chaseCard: 'Lugia V Alt' },
            'lost origin': { released: '2022', hot: true, chaseCard: 'Giratina V Alt' },
            'astral radiance': { released: '2022', hot: true, chaseCard: 'Palkia V Alt' },
            'evolving skies': { released: '2021', hot: true, chaseCard: 'Umbreon VMAX Alt', note: 'Most valuable modern set' }
        };
        
        // Store locations and their typical stock
        this.stores = {
            'walmart': { stock: 'Variable', tip: 'Check Friday mornings for restocks' },
            'target': { stock: 'Better selection', tip: 'Tuesday/Thursday restocks common' },
            'gamestop': { stock: 'Singles and exclusives', tip: 'Pre-orders available' },
            'costco': { stock: 'Bundles only', tip: 'Good value on collection boxes' },
            'best buy': { stock: 'Limited', tip: 'Sometimes has exclusives' },
            'cvs': { stock: 'Single packs', tip: 'Often overlooked, check regularly' },
            'walgreens': { stock: 'Single packs', tip: 'Mystery packs sometimes available' }
        };
        
        // Grading scale knowledge
        this.grading = {
            'psa 10': 'Gem Mint - Perfect card',
            'psa 9': 'Mint - Slight imperfection allowed',
            'bgs 10': 'Pristine - Extremely rare',
            'bgs 9.5': 'Gem Mint - High grade',
            'cgc 10': 'Perfect - Comparable to PSA 10',
            'cgc 9.5': 'Mint+ - Very good condition'
        };
        
        // Common issues and advice
        this.cardIssues = {
            'centering': 'Check 60/40 or better for PSA 10',
            'whitening': 'Edges/corners affect grade significantly',
            'print lines': 'Common in modern, can limit to PSA 9',
            'surface': 'Scratches invisible to eye can drop grade',
            'corners': 'Sharp corners crucial for high grades'
        };
    }
    
    // Detect what cards are being discussed
    detectCards(text) {
        const textLower = text.toLowerCase();
        const detected = [];
        
        for (const [key, card] of Object.entries(this.chaseCards)) {
            if (textLower.includes(key)) {
                detected.push(card);
            }
        }
        
        return detected;
    }
    
    // Detect what set is being discussed
    detectSet(text) {
        const textLower = text.toLowerCase();
        
        for (const [setName, setInfo] of Object.entries(this.sets)) {
            if (textLower.includes(setName)) {
                return { name: setName, ...setInfo };
            }
        }
        
        // Check for abbreviations
        if (textLower.includes('es ') || textLower.includes('evolving')) {
            return { name: 'evolving skies', ...this.sets['evolving skies'] };
        }
        if (textLower.includes('bs ') || textLower.includes('base set')) {
            return { name: 'base set', vintage: true, note: 'Original 1999 set' };
        }
        
        return null;
    }
    
    // Detect store mentions
    detectStore(text) {
        const textLower = text.toLowerCase();
        
        for (const [store, info] of Object.entries(this.stores)) {
            if (textLower.includes(store)) {
                return { store, ...info };
            }
        }
        
        return null;
    }
    
    // Get contextual advice
    getAdvice(context) {
        const textLower = context.toLowerCase();
        
        if (textLower.includes('should i grade')) {
            return "Check centering first, then corners and surface under good light";
        }
        
        if (textLower.includes('where to buy') || textLower.includes('where to find')) {
            return "Try Target Tuesday mornings or GameStop for pre-orders";
        }
        
        if (textLower.includes('fake') || textLower.includes('real')) {
            return "Check the texture, font, and compare to verified images online";
        }
        
        if (textLower.includes('worth') || textLower.includes('value')) {
            return "Check TCGPlayer for current market prices";
        }
        
        if (textLower.includes('invest')) {
            return "Sealed products and graded vintage tend to hold value best";
        }
        
        return null;
    }
    
    // Generate helpful response based on context
    generateHelpfulResponse(text, hasImage = false) {
        const cards = this.detectCards(text);
        const set = this.detectSet(text);
        const store = this.detectStore(text);
        const advice = this.getAdvice(text);
        
        // If specific card detected
        if (cards.length > 0) {
            const card = cards[0];
            if (card.value) {
                return `${card.name} is worth ${card.value} in good condition`;
            }
        }
        
        // If set detected
        if (set) {
            if (set.chaseCard) {
                return `${set.name} has great pulls, especially ${set.chaseCard}`;
            }
        }
        
        // If store detected
        if (store) {
            return store.tip;
        }
        
        // If asking for advice
        if (advice) {
            return advice;
        }
        
        // For images, be more specific
        if (hasImage) {
            const textLower = text.toLowerCase();
            if (textLower.includes('pull')) {
                return "Nice pull! Check the centering for grading potential";
            }
            if (textLower.includes('collection')) {
                return "Solid collection! Which one's your favorite?";
            }
            if (textLower.includes('grade')) {
                return "Corners look sharp from here, good grading candidate";
            }
        }
        
        return null;
    }
}

module.exports = CardKnowledge;