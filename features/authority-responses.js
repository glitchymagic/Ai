// Authority Response System - Demonstrates real Pokemon TCG expertise
class AuthorityResponses {
    constructor() {
        // For seeded randomness
        this.currentSeed = null;
        // Market insights based on real data
        this.marketInsights = {
            'evolving skies': {
                insight: "ES alt arts are still the strongest modern holds",
                data: "Moonbreon up 15% this month",
                context: "Set's been out 3+ years but demand isn't slowing"
            },
            'lost origin': {
                insight: "LOR Giratina V alts showing accumulation patterns",
                data: "Low pop counts keeping prices elevated",
                context: "Underrated compared to ES but similar quality"
            },
            '151': {
                insight: "151 showing classic reprint bounce",
                data: "Prices stabilizing after initial crash",
                context: "Nostalgia factor keeping floor solid"
            },
            'temporal forces': {
                insight: "TF showing early rotation impact",
                data: "Play staples declining, collectibles holding",
                context: "Standard rotation always affects modern differently"
            }
        };
        
        // Technical grading knowledge
        this.gradingInsights = {
            centering: [
                "Centering looks about 65/35 - might hold back a 10",
                "Good centering for modern, print runs are better now",
                "That centering's clean, good shot at gem mint",
                "Japanese cards usually center better than English"
            ],
            condition: [
                "Check for print lines under magnification",
                "Modern cards need perfect edges for PSA 10",
                "That surface looks clean but light can hide scratches",
                "Factory edge wear is common on recent sets"
            ],
            companies: [
                "CGC's been more consistent on modern lately",
                "PSA premiums still strongest on vintage",
                "BGS black labels nearly impossible on new cards",
                "Consider crossover if you're not happy with grade"
            ]
        };
        
        // Investment/market knowledge
        this.investmentInsights = [
            "Japanese promos historically outperform English",
            "First edition Base still the blue chip hold",
            "Alt arts from major sets show strongest appreciation",
            "Sealed WOTC products doubled every 5-7 years",
            "PSA 10 pop control affects ceiling prices",
            "Tournament promos often overlooked but solid",
            "Error cards finding more mainstream acceptance"
        ];
        
        // Set-specific knowledge
        this.setKnowledge = {
            'base set': "WOTC quality control was inconsistent - good centering rare",
            'jungle': "Scythe error card more common than people realize", 
            'fossil': "Aerodactyl holos have notorious centering issues",
            'team rocket': "Dark Charizard still undervalued vs Base Charizard",
            'gym heroes': "Blaine's Charizard Japanese vs English huge gap",
            'neo genesis': "Lugia often has print line issues on holo",
            'expedition': "e-Card holos grade terribly due to texture",
            'ex ruby sapphire': "First ex cards, centering nightmares",
            'diamond pearl': "DP era has great artwork, poor recognition",
            'platinum': "Charizard G LV.X underrated competitive history",
            'call of legends': "SL series extremely low pop counts",
            'black white': "Reshiram/Zekrom full arts aging well",
            'boundaries crossed': "Landorus EX defined a format",
            'xy evolutions': "Nostalgia play but WOTC reprints better",
            'sun moon': "GX era had incredible alternate arts",
            'team up': "Pikachu & Zekrom still tournament relevant",
            'unbroken bonds': "Reshiram & Charizard peak tag team design",
            'unified minds': "Mew & Mewtwo sleeper hit longterm",
            'cosmic eclipse': "Final SM set, several chase cards",
            'sword shield': "Started VMAX era and alt art explosion",
            'vivid voltage': "Pikachu VMAX rainbow extremely popular",
            'battle styles': "Urshifu alt arts underrated artwork",
            'chilling reign': "Ice Rider Calyrex competitive staple",
            'evolving skies': "Peak modern set, multiple chase cards",
            'fusion strike': "Mew VMAX alt art instant classic",
            'brilliant stars': "Charizard VSTAR strong but not chase",
            'astral radiance': "Palkia V alt excellent pull rates",
            'lost origin': "Giratina V alt showing accumulation",
            'silver tempest': "Lugia V alt beautiful but high supply"
        };
    }
    
    // Generate authority response based on content type
    generateAuthorityResponse(text, hasImages = false) {
        const textLower = text.toLowerCase();
        
        // First check if this is actually Pokemon TCG related
        const pokemonTerms = ['pokemon', 'pokémon', 'tcg', 'card', 'pull', 'pack', 'charizard', 'pikachu', 'grade', 'psa', 'cgc', 'bgs', 'collection', 'binder', 'mail day', 'booster', 'etb', 'holo', 'rare', 'shiny', 'base set', 'jungle', 'fossil', 'evolving skies', 'lost origin', 'vintage', 'graded', 'mint', 'nm', 'slab', '#pokemon', 'vmax', 'vstar', 'ex', 'gx', 'full art', 'alt art', 'ripped', 'opening', 'chase'];
        const isPokemonRelated = pokemonTerms.some(term => textLower.includes(term));
        
        if (!isPokemonRelated) {
            return null; // Don't generate Pokemon authority responses for non-Pokemon content
        }
        
        // Investment questions (check first since they're more specific)
        if (this.isInvestmentQuestion(textLower)) {
            // Add context for specific situations
            if (textLower.includes('sealed')) {
                return "Sealed WOTC products doubled every 5-7 years historically - modern boxes less predictable";
            }
            if (textLower.includes('modern')) {
                return "Alt arts from major sets showing 20-30% yearly gains - ES and LOR leading";
            }
            const investmentResponse = this.generateInvestmentInsight();
            return investmentResponse;
        }
        
        // Grading questions
        if (this.isGradingQuestion(textLower)) {
            return this.generateGradingInsight(textLower, hasImages);
        }
        
        // Set-specific discussion
        const setMention = this.detectSetMention(textLower);
        if (setMention) {
            return this.generateSetInsight(setMention);
        }
        
        // Market analysis responses
        if (this.isMarketDiscussion(textLower)) {
            // Special handling for vintage cards
            if (textLower.includes('base set') && textLower.includes('charizard')) {
                return "First edition Base still the blue chip hold - WOTC quality control was inconsistent though";
            }
            return this.generateMarketInsight(textLower);
        }
        
        // General Pokemon TCG discussion - provide specific insights
        if (hasImages && textLower.includes('pull')) {
            return "Pull rates vary by set - ES sits around 1:12 for V/VMAX, worse for alts";
        }
        if (textLower.includes('walmart') || textLower.includes('target')) {
            return "Retail restocks typically Tuesday mornings - check the toy aisle too";
        }
        if (textLower.includes('pack') && textLower.includes('open')) {
            return "Pack mapping's dead on modern sets - all searchable patterns removed post-2020";
        }
        if (textLower.includes('collection') && hasImages) {
            return "Side-loading pages protect corners better than top-loaders for binders";
        }
        
        // Card identification/authentication
        if (this.isAuthenticationRequest(textLower)) {
            return this.generateAuthenticationAdvice(textLower);
        }
        
        return null;
    }
    
    isMarketDiscussion(text) {
        return text.includes('price') || text.includes('market') || 
               text.includes('expensive') || text.includes('cheap') ||
               text.includes('worth') || text.includes('value');
    }
    
    isGradingQuestion(text) {
        return text.includes('grade') || text.includes('psa') || 
               text.includes('cgc') || text.includes('bgs') ||
               text.includes('centering') || text.includes('condition');
    }
    
    isInvestmentQuestion(text) {
        return text.includes('invest') || text.includes('hold') ||
               text.includes('buy') || text.includes('sell') ||
               text.includes('portfolio') || text.includes('collection growth') ||
               text.includes('worth getting') || text.includes('sealed') ||
               text.includes('should i grade') || text.includes('long term');
    }
    
    isAuthenticationRequest(text) {
        return text.includes('fake') || text.includes('real') ||
               text.includes('authentic') || text.includes('legit');
    }
    
    detectSetMention(text) {
        for (const set of Object.keys(this.setKnowledge)) {
            if (text.includes(set)) {
                return set;
            }
        }
        
        // Check abbreviations
        if (text.includes(' es ') || text.includes('evo skies')) return 'evolving skies';
        if (text.includes(' bs ') || text.includes('base set')) return 'base set';
        if (text.includes(' lo ') || text.includes('lost origin')) return 'lost origin';
        if (text.includes(' tf ') || text.includes('temporal forces')) return 'temporal forces';
        
        return null;
    }
    
    generateMarketInsight(text) {
        // Check for specific set mentions first
        for (const [set, data] of Object.entries(this.marketInsights)) {
            if (text.includes(set)) {
                return `${data.insight} - ${data.data}`;
            }
        }
        
        // General market insights
        if (text.includes('expensive') || text.includes('prices')) {
            const generalInsights = [
                "Modern alt arts holding better than expected vs vintage premiums",
                "Japanese exclusives showing 20-30% premiums lately",
                "PSA 10 pop control becoming more obvious on chase cards",
                "Sealed product ROI outpacing singles for most collectors",
                "Crown Zenith showing unusual strength for a special set",
                "Trainer Gallery cards undervalued vs regular V alts",
                "Black Star promos from 2023+ gaining traction finally"
            ];
            const index = this.getSeededIndex(generalInsights.length);
            return generalInsights[index];
        }
        
        // Specific card insights
        if (text.includes('charizard')) {
            return "Charizard tax is real but justified - consistent demand across all eras";
        }
        if (text.includes('pikachu')) {
            return "Pikachu promos saturated but Van Gogh and Special Delivery still climb";
        }
        if (text.includes('umbreon') || text.includes('moonbreon')) {
            return "Moonbreon defined the modern chase - nothing touches ES umbreon alts";
        }
        
        return null;
    }
    
    generateGradingInsight(text, hasImages) {
        if (text.includes('centering')) {
            const index = this.getSeededIndex(this.gradingInsights.centering.length);
            return this.gradingInsights.centering[index];
        }
        
        if (text.includes('condition') && hasImages) {
            const index = this.getSeededIndex(this.gradingInsights.condition.length);
            return this.gradingInsights.condition[index];
        }
        
        if (text.includes('psa') || text.includes('cgc') || text.includes('bgs')) {
            const index = this.getSeededIndex(this.gradingInsights.companies.length);
            return this.gradingInsights.companies[index];
        }
        
        return "Grade looks solid from here, but always check under good lighting";
    }
    
    generateSetInsight(set) {
        const knowledge = this.setKnowledge[set];
        if (knowledge) {
            return knowledge;
        }
        return `${set} has some solid cards worth tracking`;
    }
    
    generateInvestmentInsight() {
        const index = this.getSeededIndex(this.investmentInsights.length);
        return this.investmentInsights[index];
    }
    
    generateAuthenticationAdvice(text) {
        const authAdvice = [
            "Texture test is most reliable - fakes feel too smooth",
            "Font weight on Energy symbols often gives fakes away",
            "Holo pattern should be consistent across the whole card",
            "Back printing should be crisp, not blurry on edges",
            "Color saturation often oversaturated on counterfeits"
        ];
        const index = this.getSeededIndex(authAdvice.length);
        return authAdvice[index];
    }
    
    // Check if response demonstrates expertise
    // Set seed for deterministic variety
    setSeed(tweetId) {
        this.currentSeed = this.hashString(tweetId || Date.now().toString());
    }
    
    // Simple hash function
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    // Get seeded index
    getSeededIndex(arrayLength) {
        if (!this.currentSeed) {
            this.currentSeed = this.hashString(Date.now().toString());
        }
        return this.currentSeed % arrayLength;
    }
    
    isExpertLevel(response) {
        const expertKeywords = [
            'pop control', 'accumulation', 'rotation', 'premium', 'floor', 
            'centering', 'print lines', 'crossover', 'texture test',
            'historically', 'data', 'analysis', 'pattern', 'doubled every',
            'alt arts', 'moon up', 'showing', 'quality control',
            'inconsistent', 'notorious', 'undervalued', 'defined a format',
            'tournament relevant', 'competitive staple', 'peak modern'
        ];
        
        const responseLower = response.toLowerCase();
        return expertKeywords.some(keyword => responseLower.includes(keyword)) ||
               response.length > 40; // Longer responses tend to be more detailed
    }
    
    // Add a new method to generate authority responses with real stats
    generateAuthorityWithStats({ setName, cardDisplay, stats }) {
        // stats: { change7dPct, change30dPct, lastSoldUsd, sample, psa10PopDelta30d }
        const parts = [];
        if (stats?.change7dPct != null) parts.push(`7d ${stats.change7dPct >= 0 ? '+' : ''}${stats.change7dPct.toFixed(1)}%`);
        if (stats?.change30dPct != null) parts.push(`30d ${stats.change30dPct >= 0 ? '+' : ''}${stats.change30dPct.toFixed(1)}%`);
        if (stats?.lastSoldUsd) parts.push(`last ${Math.round(stats.lastSoldUsd)}`);
        if (stats?.psa10PopDelta30d != null) parts.push(`PSA10 Δ30d ${stats.psa10PopDelta30d}`);
        
        const tail = parts.length ? ` — ${parts.join(', ')}` : '';
        
        if (setName && this.marketInsights[setName.toLowerCase()]) {
            const { insight } = this.marketInsights[setName.toLowerCase()];
            return `${insight}${tail}`;
        }
        
        return `${cardDisplay || setName} looks bid — ${parts.join(', ') || 'watch volume'}`;
    }
}

module.exports = AuthorityResponses;