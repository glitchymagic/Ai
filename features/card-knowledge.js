// Pokemon Card Knowledge Base
class CardKnowledge {
    constructor() {
        // Card eras for proper knowledge
        this.cardEras = {
            vintage: {
                years: [1998, 1999, 2000, 2001, 2002, 2003],
                sets: ['base set', 'jungle', 'fossil', 'team rocket', 'gym heroes', 'gym challenge', 'neo genesis', 'neo discovery', 'neo destiny', 'neo revelation', 'legendary collection', 'expedition']
            },
            ex: {
                years: [2003, 2004, 2005, 2006, 2007],
                sets: ['ruby sapphire', 'sandstorm', 'dragon', 'team magma vs aqua', 'hidden legends', 'firered leafgreen', 'team rocket returns', 'deoxys', 'emerald', 'unseen forces', 'delta species', 'legend maker']
            },
            diamond_pearl: {
                years: [2007, 2008, 2009, 2010],
                sets: ['diamond pearl', 'mysterious treasures', 'secret wonders', 'great encounters', 'majestic dawn', 'legends awakened', 'stormfront', 'platinum', 'rising rivals', 'supreme victors', 'arceus']
            },
            bw: {
                years: [2011, 2012, 2013],
                sets: ['black white', 'emerging powers', 'noble victories', 'next destinies', 'dark explorers', 'dragons exalted', 'boundaries crossed', 'plasma storm', 'plasma freeze', 'plasma blast', 'legendary treasures']
            },
            xy: {
                years: [2014, 2015, 2016, 2017],
                sets: ['xy', 'flashfire', 'furious fists', 'phantom forces', 'primal clash', 'roaring skies', 'ancient origins', 'breakthrough', 'breakpoint', 'fates collide', 'steam siege', 'evolutions']
            },
            sun_moon: {
                years: [2017, 2018, 2019],
                sets: ['sun moon', 'guardians rising', 'burning shadows', 'shining legends', 'crimson invasion', 'ultra prism', 'forbidden light', 'celestial storm', 'dragon majesty', 'lost thunder', 'team up', 'detective pikachu', 'unbroken bonds', 'unified minds', 'hidden fates', 'cosmic eclipse']
            },
            sword_shield: {
                years: [2020, 2021, 2022],
                sets: ['sword shield', 'rebel clash', 'darkness ablaze', 'champions path', 'vivid voltage', 'shining fates', 'battle styles', 'chilling reign', 'evolving skies', 'celebrations', 'fusion strike', 'brilliant stars', 'astral radiance', 'pokemon go', 'lost origin', 'silver tempest']
            },
            scarlet_violet: {
                years: [2023, 2024, 2025],
                sets: ['scarlet violet', 'paldea evolved', 'obsidian flames', '151', 'paradox rift', 'paldean fates', 'temporal forces', 'twilight masquerade', 'shrouded fable', 'stellar crown', 'surging sparks']
            }
        };
        
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
    
    // Determine card era based on year or set name
    determineEra(text) {
        const textLower = text.toLowerCase();
        
        // Check for explicit years
        const yearMatch = textLower.match(/(19|20)\d{2}/);
        if (yearMatch) {
            const year = parseInt(yearMatch[0]);
            for (const [era, data] of Object.entries(this.cardEras)) {
                if (data.years.includes(year)) {
                    return { era, year, ...data };
                }
            }
        }
        
        // Check for set names
        for (const [era, data] of Object.entries(this.cardEras)) {
            for (const set of data.sets) {
                if (textLower.includes(set)) {
                    return { era, set, ...data };
                }
            }
        }
        
        // Special checks for specific cards
        if (textLower.includes('tag team')) {
            return { era: 'sun_moon', note: 'TAG TEAM cards are from 2019 (Sun & Moon era), not vintage' };
        }
        
        if (textLower.includes('vmax') || textLower.includes('v max')) {
            return { era: 'sword_shield', note: 'VMAX cards are from 2020+ (Sword & Shield era)' };
        }
        
        if (textLower.includes('ex') && !textLower.includes('vmax')) {
            // Could be vintage EX or modern ex - need context
            if (textLower.includes('2003') || textLower.includes('2004') || textLower.includes('ruby') || textLower.includes('sapphire')) {
                return { era: 'ex', note: 'Original EX cards from 2003-2007 era' };
            } else {
                return { era: 'modern', note: 'Modern ex cards (lowercase) are recent' };
            }
        }
        
        return null;
    }
    
    // Generate era-appropriate response
    generateEraResponse(text, eraInfo) {
        if (!eraInfo) return null;
        
        const responses = {
            vintage: [
                "That's a classic! Vintage cards from the late 90s/early 2000s",
                "Beautiful vintage piece from the original sets",
                "True vintage - these cards have serious history",
                "Love the vintage era artwork and design"
            ],
            sun_moon: [
                "Nice modern card! Sun & Moon era had great artwork",
                "2017-2019 was a solid era for Pokemon cards",
                "Modern card but already becoming collectible",
                "Sun & Moon series had some beautiful designs"
            ],
            sword_shield: [
                "Love the modern VMAX era cards",
                "Sword & Shield series has incredible alt arts",
                "The texture on these modern cards is amazing",
                "2020+ era brought some of the best artwork yet"
            ],
            scarlet_violet: [
                "The newest era! These just came out",
                "Current generation cards with amazing quality",
                "Fresh from the newest sets",
                "The art evolution in recent sets is incredible"
            ]
        };
        
        // Return era-specific response
        const eraResponses = responses[eraInfo.era] || responses.modern || [
            "Nice card from that era",
            "Solid piece from the collection"
        ];
        
        return eraResponses[Math.floor(Math.random() * eraResponses.length)];
    }
    
    // Generate helpful response based on context
    generateHelpfulResponse(text, hasImage = false) {
        // First check for era-specific context to avoid wrong vintage calls
        const eraInfo = this.determineEra(text);
        if (eraInfo) {
            const eraResponse = this.generateEraResponse(text, eraInfo);
            if (eraResponse) return eraResponse;
        }
        
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