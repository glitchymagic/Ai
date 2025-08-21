// Pokemon TCG Culture, Memes, and Lingo Module
class PokemonCulture {
    constructor() {
        // Popular Pokemon TCG memes and references
        this.memes = {
            // Card-specific memes
            'charizard tax': 'the extra price on anything with Charizard',
            'moonbreon': 'Umbreon VMAX alt art - the holy grail',
            'rayquaza vmax': 'the most expensive modern card',
            'machamp': 'everyone has the base set one',
            'bidoof': 'the god pokemon meme',
            'magikarp': 'useless but beloved',
            
            // Pull rate memes
            'god pack': 'all hits in one pack (super rare)',
            'green code': 'guaranteed no hit in online packs',
            'white code': 'possible hit in online packs',
            'resealed': 'tampered packs - biggest fear',
            'mapped': 'boxes with predictable hit locations',
            
            // Collector memes
            'one more pack': 'the eternal lie collectors tell themselves',
            'sealed collector': 'never opens anything, just hoards',
            'rip and ship': 'opening packs on stream/video',
            'mail day': 'best day - cards arriving',
            'psa 10 or bust': 'grading perfectionist',
            'centering': 'the obsession with perfect borders',
            'binder candy': 'satisfying collection pages',
            
            // Market memes
            'logan paul': 'ruined the market with his box break',
            'scalper': 'resellers who clear shelves',
            'msrp': 'mythical retail price no one finds',
            'target/walmart desert': 'stores with no stock',
            'backdoor': 'employees taking stock',
            
            // Community jokes
            'professor oak': 'drawing your whole deck',
            'energy cards': 'the cards nobody wants',
            'bulk': 'worthless commons everyone has tons of',
            'top loader': 'essential protection',
            'penny sleeve': 'basic protection',
            'bgs black label': 'perfect 10 - nearly impossible',
            'pop control': 'PSA controlling population reports'
        };
        
        // Current trending topics/memes
        this.trending = [
            '151 set', // hugely popular
            'paradox rift',
            'surging sparks',
            'temporal forces',
            'paldea evolved',
            'costco drops',
            'pokemon center exclusive',
            'special delivery',
            'van gogh pikachu',
            'mcdonalds promo'
        ];
        
        // Collector slang dictionary
        this.slang = {
            // Condition terms
            'mint': 'perfect condition',
            'nm': 'near mint',
            'lp': 'light play',
            'mp': 'moderate play',
            'hp': 'heavy play',
            'damaged': 'poor condition',
            'raw': 'ungraded card',
            'slab': 'graded card in case',
            'crack': 'open a graded case',
            
            // Pull terms
            'hit': 'good pull',
            'whiff': 'bad pulls',
            'brick': 'box with bad pulls',
            'fire': 'amazing',
            'heat': 'valuable cards',
            'banger': 'great card',
            'chase': 'most wanted card',
            'alt': 'alternate art',
            'full art': 'full artwork card',
            'secret': 'secret rare',
            'gold': 'gold rare card',
            'rainbow': 'rainbow rare',
            'shiny': 'shiny pokemon card',
            
            // Trading/selling
            'fs': 'for sale',
            'ft': 'for trade',
            'nfs': 'not for sale',
            'nft': 'not for trade (not the crypto thing)',
            'wtt': 'want to trade',
            'wts': 'want to sell',
            'obo': 'or best offer',
            'pwe': 'plain white envelope',
            'bmwt': 'bubble mailer with tracking',
            'g&s': 'goods and services (paypal)',
            'f&f': 'friends and family (paypal)',
            
            // Grading terms
            'sub': 'submit for grading',
            'gem': 'gem mint (perfect)',
            'crossover': 'regrade from another company',
            'pop': 'population report',
            'cert': 'certification number',
            
            // Store/market terms
            'lcs': 'local card shop',
            'lgs': 'local game store',
            'tcgp': 'tcgplayer website',
            'msrp': 'retail price',
            'sealed': 'unopened product',
            'singles': 'individual cards',
            'playset': '4 copies for deck',
            
            // Pack/box terms
            'bb': 'booster box',
            'etb': 'elite trainer box',
            'build and battle': 'prerelease kit',
            'sleeved': 'sleeved booster pack',
            'loose': 'unsleeved pack',
            'case': 'multiple booster boxes',
            'master set': 'complete set including all variants'
        };
        
        // Reaction templates for specific scenarios
        this.reactions = {
            // Amazing pulls
            amazingPull: [
                "Amazing pull! That's the chase card",
                "Congrats on the hit!",
                "That centering looks perfect",
                "You just paid for the box with that",
                "Straight to grading with that one",
                "That's a beautiful card"
            ],
            
            // Bad pulls
            badPull: [
                "Better luck next time",
                "That's rough, sorry",
                "At least you got some bulk",
                "Green codes can be tough",
                "Next box will be better",
                "We've all been there"
            ],
            
            // Grading results
            psa10: [
                "Perfect grade! Congrats",
                "Gem mint! Well deserved",
                "That's incredible value",
                "Worth the grading fees for sure",
                "Beautiful PSA 10"
            ],
            
            // Market discussion
            expensive: [
                "Market prices are wild right now",
                "Remember when these were affordable",
                "Prices have gotten crazy",
                "Tough market for collectors",
                "Hopefully prices stabilize soon"
            ],
            
            // Store finds
            restock: [
                "impossible W",
                "backdoor employee confirmed /s",
                "my target could never",
                "scalpers punching air rn",
                "msrp hits different"
            ]
        };
    }
    
    // Detect memes and references in text
    detectMeme(text) {
        const textLower = text.toLowerCase();
        const detected = [];
        
        for (const [meme, meaning] of Object.entries(this.memes)) {
            if (textLower.includes(meme.toLowerCase())) {
                detected.push({ meme, meaning });
            }
        }
        
        // Check for common patterns
        if (textLower.includes('psa') && textLower.includes('10')) {
            detected.push({ meme: 'psa 10', meaning: 'perfect grade obsession' });
        }
        
        if (textLower.includes('one more') && textLower.includes('pack')) {
            detected.push({ meme: 'one more pack', meaning: 'the eternal lie' });
        }
        
        return detected;
    }
    
    // Get appropriate reaction based on context
    getContextualReaction(text, category = null) {
        const textLower = text.toLowerCase();
        
        // Detect context
        if (textLower.includes('psa 10') || textLower.includes('gem mint')) {
            return this.reactions.psa10[Math.floor(Math.random() * this.reactions.psa10.length)];
        }
        
        if (textLower.includes('charizard') || textLower.includes('moonbreon') || 
            textLower.includes('rayquaza vmax')) {
            return this.reactions.amazingPull[Math.floor(Math.random() * this.reactions.amazingPull.length)];
        }
        
        if (textLower.includes('bulk') || textLower.includes('no hits') || 
            textLower.includes('green code')) {
            return this.reactions.badPull[Math.floor(Math.random() * this.reactions.badPull.length)];
        }
        
        if (textLower.includes('restock') || textLower.includes('found at') || 
            textLower.includes('walmart') || textLower.includes('target')) {
            return this.reactions.restock[Math.floor(Math.random() * this.reactions.restock.length)];
        }
        
        if (textLower.includes('expensive') || textLower.includes('price') || 
            textLower.includes('market')) {
            return this.reactions.expensive[Math.floor(Math.random() * this.reactions.expensive.length)];
        }
        
        return null;
    }
    
    // Check if text contains Pokemon TCG culture references
    understandsContext(text) {
        const textLower = text.toLowerCase();
        
        // Check for slang
        for (const term of Object.keys(this.slang)) {
            if (textLower.includes(term)) {
                return true;
            }
        }
        
        // Check for memes
        for (const meme of Object.keys(this.memes)) {
            if (textLower.includes(meme)) {
                return true;
            }
        }
        
        // Check for trending topics
        for (const trend of this.trending) {
            if (textLower.includes(trend.toLowerCase())) {
                return true;
            }
        }
        
        return false;
    }
    
    // Generate meme-aware response
    generateMemeResponse(text) {
        const textLower = text.toLowerCase();
        
        // Specific meme responses - more natural
        if (textLower.includes('charizard tax')) {
            return "Charizard tax is definitely real";
        }
        
        if (textLower.includes('one more pack')) {
            return "We all say that haha";
        }
        
        if (textLower.includes('moonbreon')) {
            return "Moonbreon is such a beautiful card";
        }
        
        if (textLower.includes('logan paul')) {
            return "Market prices have been wild lately";
        }
        
        if (textLower.includes('scalper')) {
            return "Hope real collectors get them";
        }
        
        if (textLower.includes('green code')) {
            return "Green codes can be disappointing";
        }
        
        if (textLower.includes('god pack')) {
            return "Amazing pack! That's incredible luck";
        }
        
        if (textLower.includes('centering')) {
            const responses = [
                "Centering looks a bit off",
                "That centering might affect the grade",
                "Centering actually looks pretty good"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }
        
        return null;
    }
}

module.exports = PokemonCulture;