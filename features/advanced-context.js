// Advanced Context Extraction for Ultra-Specific Responses
class AdvancedContextExtractor {
    constructor() {
        // Detailed card database with specific info
        this.cardDatabase = {
            // Charizard variants
            'charizard': {
                'base set': { number: '4/102', value: '$200-500 raw, $2000+ PSA 10', rarity: 'Holo Rare' },
                'shining': { number: '107/105', value: '$400-600 raw, $3000+ PSA 10', rarity: 'Secret Rare' },
                'rainbow': { number: '150/147', value: '$150-200 raw', rarity: 'Rainbow Rare' },
                'vmax': { number: '20/189', value: '$100-150', rarity: 'VMAX' },
                'ex': { number: '183/165', value: '$80-120', rarity: 'Special Art' }
            },
            'umbreon': {
                'vmax alt': { number: '215/203', value: '$400-500 raw, $800+ PSA 10', nickname: 'Moonbreon' },
                'gold star': { number: '17/17', value: '$2000+ raw', rarity: 'Gold Star' },
                'v alt': { number: '189/203', value: '$150-200', rarity: 'Alt Art' }
            },
            'pikachu': {
                'illustrator': { value: '$5M+', note: 'Most expensive card ever' },
                'base set': { number: '58/102', value: '$20-50', rarity: 'Common' },
                'birthday': { value: '$50-100', note: 'Promo card' },
                'flying': { number: '110/108', value: '$100-150', rarity: 'Secret Rare' },
                'vmax': { number: '188/185', value: '$200-300', rarity: 'Rainbow' }
            },
            'lugia': {
                'alt art': { number: '186/195', value: '$150-250', set: 'Silver Tempest' },
                'neo genesis': { number: '9/111', value: '$100-200', rarity: 'Holo' }
            },
            'giratina': {
                'v alt': { number: '186/196', value: '$200-300', set: 'Lost Origin' },
                'vstar gold': { number: '280/264', value: '$100-150', rarity: 'Gold' }
            }
        };

        // Set-specific information
        this.setInfo = {
            'evolving skies': {
                released: '2021',
                chaseCards: ['Moonbreon', 'Rayquaza VMAX Alt', 'Sylveon VMAX Alt'],
                boxPrice: '$140-160',
                pullRates: 'Alt arts 1:200 packs'
            },
            'lost origin': {
                released: '2022',
                chaseCards: ['Giratina V Alt', 'Aerodactyl V Alt', 'Rotom V Alt'],
                boxPrice: '$120-140',
                note: 'Great for alt art hunters'
            },
            'crown zenith': {
                released: '2023',
                chaseCards: ['Galarian Gallery cards', 'Golden cards'],
                boxPrice: '$100-120',
                note: 'Special set with great pull rates'
            },
            '151': {
                released: '2023',
                chaseCards: ['Charizard ex', 'All original 151'],
                boxPrice: '$120-140',
                note: 'Nostalgia set, very popular'
            },
            'obsidian flames': {
                released: '2023',
                chaseCards: ['Charizard ex', 'Tyranitar ex'],
                boxPrice: '$100-120'
            },
            'paradox rift': {
                released: '2023',
                chaseCards: ['Roaring Moon ex', 'Iron Valiant ex'],
                boxPrice: '$90-110'
            },
            'paldean fates': {
                released: '2024',
                chaseCards: ['Shiny cards', 'Baby shinies'],
                boxPrice: 'ETB $40-50',
                note: 'Special subset like Hidden Fates'
            },
            'temporal forces': {
                released: '2024',
                chaseCards: ['Walking Wake ex', 'Iron Leaves ex'],
                boxPrice: '$90-100'
            },
            'twilight masquerade': {
                released: '2024',
                chaseCards: ['Ogerpon ex', 'Bloodmoon Ursaluna ex'],
                boxPrice: '$90-100'
            },
            'shrouded fable': {
                released: '2024',
                chaseCards: ['Pecharunt ex', 'Fezandipiti ex'],
                boxPrice: '$90-100'
            },
            'stellar crown': {
                released: '2024',
                chaseCards: ['Terapagos ex', 'Cinderace ex'],
                boxPrice: '$90-100'
            },
            'surging sparks': {
                released: '2024',
                chaseCards: ['Pikachu ex', 'Alolan Exeggutor ex'],
                boxPrice: '$100-120',
                note: 'Newest set, high demand'
            }
        };

        // Grading scale knowledge
        this.gradingInfo = {
            'psa 10': 'Gem Mint - Perfect card',
            'psa 9': 'Mint - One minor flaw allowed',
            'psa 8': 'Near Mint-Mint - Minor wear',
            'bgs 10': 'Pristine - Extremely rare',
            'bgs 9.5': 'Gem Mint - Equivalent to PSA 10',
            'cgc 10': 'Perfect - Very strict grading',
            'cgc 9.5': 'Mint+ - Between PSA 9 and 10'
        };

        // Store locations and restock patterns
        this.storeInfo = {
            'target': {
                restockDays: 'Tuesday/Thursday mornings',
                location: 'Toy aisle, sometimes electronics',
                tip: 'Check Brickseek for inventory'
            },
            'walmart': {
                restockDays: 'Wednesday/Friday',
                location: 'Trading card section near checkout',
                tip: 'Often limits 2 per customer'
            },
            'gamestop': {
                restockDays: 'Varies by location',
                location: 'Behind counter usually',
                tip: 'Pre-orders available online'
            },
            'costco': {
                products: 'Collection boxes, tins',
                price: 'Usually $10-20 below MSRP',
                tip: 'Great bulk deals'
            },
            'barnes & noble': {
                products: 'ETBs, collection boxes',
                tip: 'Often has older sets in stock'
            }
        };

        // Common questions and specific answers
        this.questionPatterns = {
            'worth': this.generateValueResponse.bind(this),
            'grade': this.generateGradingResponse.bind(this),
            'where': this.generateLocationResponse.bind(this),
            'when': this.generateTimingResponse.bind(this),
            'real or fake': this.generateAuthenticityResponse.bind(this),
            'invest': this.generateInvestmentResponse.bind(this),
            'pull rate': this.generatePullRateResponse.bind(this),
            'centering': this.generateCenteringResponse.bind(this)
        };

        // Event/Tournament patterns
        this.eventPatterns = [
            // Major Championships
            /world\s*championship/i,
            /worlds\s*\d{4}/i,
            /regional\s*championship/i,
            /regionals/i,
            /international\s*championship/i,
            /\bIC\b/i,
            /nationals/i,
            
            // Local Events
            /league\s*cup/i,
            /league\s*challenge/i,
            /pre\s*release/i,
            /premier\s*challenge/i,
            /city\s*championship/i,
            
            // Special Events
            /pokemon\s*center\s*event/i,
            /special\s*event/i,
            /tournament/i,
            /championship\s*series/i,
            /\bVGC\b/i,
            /\bTCG\b.*tournament/i,
            
            // Specific tournament names
            /NAIC/i,  // North America International Championship
            /EUIC/i,  // Europe International Championship
            /LAIC/i,  // Latin America International Championship
            /OCIC/i   // Oceania International Championship
        ];

        // Tournament locations and dates
        this.knownEvents = {
            'worlds 2024': {
                location: 'Honolulu, Hawaii',
                date: 'August 16-18, 2024',
                format: 'Standard',
                champion: 'TBD'
            },
            'NAIC 2024': {
                location: 'New Orleans, LA',
                date: 'June 7-9, 2024',
                format: 'Standard',
                prizing: '$250,000 prize pool'
            },
            'EUIC 2024': {
                location: 'London, UK',
                date: 'April 26-28, 2024',
                format: 'Standard'
            }
        };
    }

    // Extract event/tournament details from text
    extractEventDetails(text) {
        const eventDetails = {
            isEvent: false,
            eventType: null,
            eventName: null,
            location: null,
            date: null,
            format: null,
            matchedPatterns: []
        };

        const textLower = text.toLowerCase();

        // Check for event patterns
        for (const pattern of this.eventPatterns) {
            if (pattern.test(text)) {
                eventDetails.isEvent = true;
                eventDetails.matchedPatterns.push(pattern.source);
            }
        }

        // Check for known specific events
        for (const [eventKey, eventInfo] of Object.entries(this.knownEvents)) {
            if (textLower.includes(eventKey)) {
                eventDetails.isEvent = true;
                eventDetails.eventName = eventKey;
                eventDetails.location = eventInfo.location;
                eventDetails.date = eventInfo.date;
                eventDetails.format = eventInfo.format;
                break;
            }
        }

        // Extract event type
        if (textLower.includes('worlds') || textLower.includes('world championship')) {
            eventDetails.eventType = 'World Championship';
        } else if (textLower.includes('regional')) {
            eventDetails.eventType = 'Regional Championship';
        } else if (textLower.includes('international')) {
            eventDetails.eventType = 'International Championship';
        } else if (textLower.includes('league cup')) {
            eventDetails.eventType = 'League Cup';
        } else if (textLower.includes('league challenge')) {
            eventDetails.eventType = 'League Challenge';
        } else if (textLower.includes('pre') && textLower.includes('release')) {
            eventDetails.eventType = 'Pre-release Event';
        } else if (textLower.includes('tournament')) {
            eventDetails.eventType = 'Tournament';
        }

        // Look for location mentions (common tournament locations)
        const locationPatterns = [
            /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
            /at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
            /(\w+,\s*\w{2})\b/  // City, State pattern
        ];

        for (const pattern of locationPatterns) {
            const match = text.match(pattern);
            if (match) {
                eventDetails.location = match[1];
                break;
            }
        }

        // Look for date mentions
        const datePatterns = [
            /(\w+\s+\d{1,2}(?:-\d{1,2})?(?:,?\s+\d{4})?)/,
            /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                eventDetails.date = match[1];
                break;
            }
        }

        // Look for format mentions
        if (textLower.includes('standard')) {
            eventDetails.format = 'Standard';
        } else if (textLower.includes('expanded')) {
            eventDetails.format = 'Expanded';
        } else if (textLower.includes('limited')) {
            eventDetails.format = 'Limited';
        }

        return eventDetails;
    }

    // Extract all context from a tweet
    extractFullContext(text, hasImage = false) {
        const context = {
            cards: [],
            sets: [],
            stores: [],
            questions: [],
            pricesMentioned: [],
            gradingMentioned: false,
            isAsking: false,
            isShowing: false,
            isSelling: false,
            isTrading: false,
            isEvent: false,
            eventDetails: null,
            sentiment: 'neutral',
            specificDetails: []
        };

        const textLower = text.toLowerCase();

        // Extract specific cards mentioned
        for (const [cardName, variants] of Object.entries(this.cardDatabase)) {
            if (textLower.includes(cardName)) {
                context.cards.push({
                    name: cardName,
                    variants: variants,
                    mentioned: true
                });

                // Check for specific variants
                for (const [variant, info] of Object.entries(variants)) {
                    if (textLower.includes(variant)) {
                        context.specificDetails.push({
                            type: 'card_variant',
                            card: cardName,
                            variant: variant,
                            info: info
                        });
                    }
                }
            }
        }

        // Extract sets mentioned
        for (const [setName, info] of Object.entries(this.setInfo)) {
            if (textLower.includes(setName)) {
                context.sets.push({
                    name: setName,
                    info: info
                });
            }
        }

        // Extract stores mentioned
        for (const [storeName, info] of Object.entries(this.storeInfo)) {
            if (textLower.includes(storeName)) {
                context.stores.push({
                    name: storeName,
                    info: info
                });
            }
        }

        // Check for questions
        if (text.includes('?')) {
            context.isAsking = true;
            
            // Identify question type
            for (const [pattern, handler] of Object.entries(this.questionPatterns)) {
                if (textLower.includes(pattern)) {
                    context.questions.push({
                        type: pattern,
                        handler: handler
                    });
                }
            }
        }

        // Check for grading mentions
        if (textLower.match(/psa|bgs|cgc|\bgrade/)) {
            context.gradingMentioned = true;
            
            // Extract specific grades
            const gradeMatch = textLower.match(/(psa|bgs|cgc)\s*(\d+(?:\.\d+)?)/);
            if (gradeMatch) {
                context.specificDetails.push({
                    type: 'grade',
                    company: gradeMatch[1].toUpperCase(),
                    grade: gradeMatch[2]
                });
            }
        }

        // Extract prices mentioned
        const priceMatches = text.match(/\$\d+(?:,?\d{3})*(?:\.\d{2})?/g);
        if (priceMatches) {
            context.pricesMentioned = priceMatches;
        }

        // Determine intent
        if (textLower.includes('pulled') || textLower.includes('got') || textLower.includes('hit')) {
            context.isShowing = true;
            context.sentiment = 'excited';
        }
        if (textLower.match(/\b(fs|for sale|selling|sale)\b/)) {
            context.isSelling = true;
        }
        if (textLower.match(/\b(ft|for trade|trading|wtt)\b/)) {
            context.isTrading = true;
        }

        // Extract specific numbers (card numbers, quantities)
        const numberMatches = text.match(/\b\d{1,3}\/\d{1,3}\b/g);
        if (numberMatches) {
            context.specificDetails.push({
                type: 'card_numbers',
                numbers: numberMatches
            });
        }

        // Extract event/tournament information
        const eventDetails = this.extractEventDetails(text);
        if (eventDetails.isEvent) {
            context.isEvent = true;
            context.eventDetails = eventDetails;
        }

        return context;
    }

    // Generate ultra-specific responses based on context
    generateSpecificResponse(context, text) {
        // If asking a question, provide specific answer
        if (context.isAsking && context.questions.length > 0) {
            return context.questions[0].handler(context, text);
        }

        // If talking about events/tournaments
        if (context.isEvent && context.eventDetails) {
            return this.generateEventResponse(context.eventDetails, text);
        }

        // If showing pulls with specific cards
        if (context.isShowing && context.cards.length > 0) {
            const card = context.cards[0];
            if (context.specificDetails.length > 0) {
                const detail = context.specificDetails[0];
                if (detail.type === 'card_variant') {
                    return `That ${detail.card} ${detail.variant} is worth ${detail.info.value}! ${detail.info.note || 'Great pull'}`;
                }
            }
            return `Nice ${card.name}! Check recent sales - seeing ${card.variants[Object.keys(card.variants)[0]].value}`;
        }

        // If mentioning specific set
        if (context.sets.length > 0) {
            const set = context.sets[0];
            return `${set.name} ${set.info.note || `has amazing chase cards like ${set.info.chaseCards[0]}`}`;
        }

        // If discussing grading with specific grade
        if (context.gradingMentioned && context.specificDetails.length > 0) {
            const grade = context.specificDetails.find(d => d.type === 'grade');
            if (grade) {
                return `${grade.company} ${grade.grade} - ${this.gradingInfo[`${grade.company.toLowerCase()} ${grade.grade}`] || 'Solid grade for the collection'}`;
            }
        }

        // If selling with price
        if (context.isSelling && context.pricesMentioned.length > 0) {
            return `${context.pricesMentioned[0]} seems fair based on recent eBay sold listings`;
        }

        // Store-specific response
        if (context.stores.length > 0) {
            const store = context.stores[0];
            return `${store.name} ${store.info.tip}. Restocks ${store.info.restockDays || 'vary by location'}`;
        }

        return null; // Let other modules handle if no specific context
    }

    // Specific response generators
    generateValueResponse(context, text) {
        if (context.cards.length > 0 && context.specificDetails.length > 0) {
            const detail = context.specificDetails[0];
            if (detail.info && detail.info.value) {
                return `Current market: ${detail.info.value}. Check TCGPlayer for latest`;
            }
        }
        return 'Check TCGPlayer and eBay sold listings for current market value';
    }

    generateGradingResponse(context, text) {
        const textLower = text.toLowerCase();
        if (textLower.includes('should')) {
            return 'If centering is 60/40 or better and no whitening, worth grading with PSA';
        }
        if (textLower.includes('centering')) {
            return 'Looks 55/45 front, check the back too. PSA allows 60/40 for a 10';
        }
        return 'PSA is most popular for Pokemon. CGC for subgrades. BGS for high-end';
    }

    generateLocationResponse(context, text) {
        if (context.stores.length > 0) {
            const store = context.stores[0];
            return `${store.name}: ${store.info.location}. ${store.info.tip}`;
        }
        return 'Target/Walmart restock Tues/Thurs mornings. GameStop gets allocations monthly';
    }

    generateTimingResponse(context, text) {
        const textLower = text.toLowerCase();
        if (textLower.includes('restock')) {
            return 'Most stores restock Tuesday/Thursday mornings between 7-10am';
        }
        if (textLower.includes('release')) {
            return 'New sets release every 3 months. Prismatic Evolution coming January 2025';
        }
        return 'Depends on your local store. Call ahead or check Discord groups';
    }

    generateAuthenticityResponse(context, text) {
        return 'Check: texture feel, font kerning, color saturation, and holo pattern. Fakes often too glossy';
    }

    generateInvestmentResponse(context, text) {
        if (context.sets.length > 0) {
            const set = context.sets[0];
            return `${set.name} sealed at ${set.info.boxPrice} could appreciate. Alt arts best singles investment`;
        }
        return 'Sealed products and graded vintage best long-term. Modern alt arts risky but high ceiling';
    }

    generatePullRateResponse(context, text) {
        if (context.sets.length > 0) {
            const set = context.sets[0];
            return set.info.pullRates || 'Alt arts roughly 1:200 packs, Secret rares 1:100';
        }
        return 'V/VMAX ~1:6 packs, Full arts ~1:30, Alt arts ~1:200, depends on set';
    }

    generateCenteringResponse(context, text) {
        return 'Measure borders with ruler. 50/50 perfect, 55/45 excellent, 60/40 PSA 10 limit';
    }

    generateEventResponse(eventDetails, text) {
        const textLower = text.toLowerCase();
        
        // If asking about specific event details
        if (textLower.includes('when') && eventDetails.date) {
            return `${eventDetails.eventType || 'Event'} ${eventDetails.date}${eventDetails.location ? ' in ' + eventDetails.location : ''}`;
        }
        
        if (textLower.includes('where') && eventDetails.location) {
            return `${eventDetails.eventType || 'Tournament'} location: ${eventDetails.location}${eventDetails.date ? ' on ' + eventDetails.date : ''}`;
        }
        
        // General event responses based on type
        if (eventDetails.eventType === 'World Championship') {
            return 'Worlds is the pinnacle of competitive Pokemon! Best players from each region compete for the title';
        }
        
        if (eventDetails.eventType === 'Regional Championship') {
            return 'Regionals are major tournaments with CP on the line. Usually 500+ players, 9 rounds Day 1';
        }
        
        if (eventDetails.eventType === 'International Championship') {
            return 'ICs are massive events with players from multiple countries. Great prizing and championship points!';
        }
        
        if (eventDetails.eventType === 'League Cup') {
            return 'League Cups are local tournaments, usually 15-50 players. Great for earning CP and practice';
        }
        
        if (eventDetails.eventType === 'Pre-release Event') {
            return 'Pre-release events let you play with new cards early! Build a deck from 6 packs, casual and fun';
        }
        
        // If known specific event
        if (eventDetails.eventName && this.knownEvents[eventDetails.eventName]) {
            const event = this.knownEvents[eventDetails.eventName];
            return `${eventDetails.eventName.toUpperCase()}: ${event.location}, ${event.date}. ${event.prizing || event.format + ' format'}`;
        }
        
        // Generic tournament response
        return 'Tournament play is where the best trainers prove themselves! Check Pokemon.com for event locator';
    }

    // Check if response would be valuable
    isValuableResponse(response) {
        // Response should contain specific information
        return response && (
            response.includes('$') ||
            response.includes('PSA') ||
            response.includes('restock') ||
            response.includes('/') ||
            response.includes('Target') ||
            response.includes('TCGPlayer') ||
            response.length > 30
        );
    }
}

module.exports = AdvancedContextExtractor;