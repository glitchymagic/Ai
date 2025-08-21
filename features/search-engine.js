class SearchEngine {
    constructor() {
        this.searchHistory = [];
        this.lastSearchIndex = -1;
        this.searchPerformance = new Map();
        
        // Comprehensive search library
        this.searchQueries = {
            // Time-based searches
            morning: [
                'pokemon mail day',
                'pokemon pulls morning',
                'pokemon tcg opening',
                'pokemon cards arrived',
                'pokemon delivery today',
                '#MailDayMonday pokemon'
            ],
            
            afternoon: [
                'pokemon tcg deals',
                'pokemon cards restock',
                'pokemon target find',
                'pokemon walmart stock',
                'pokemon costco',
                'pokemon gamestop'
            ],
            
            evening: [
                'pokemon collection',
                'pokemon binder tour',
                'pokemon display',
                'pokemon showcase',
                'pokemon graded cards',
                'pokemon slab collection'
            ],
            
            night: [
                'pokemon investing',
                'pokemon market analysis',
                'pokemon tcg portfolio',
                'pokemon sealed collection',
                'pokemon card value',
                'pokemon investment advice'
            ],
            
            // Specific card searches
            specific_cards: [
                'moonbreon vmax',
                'charizard upc',
                'giratina vstar alt art',
                'umbreon vmax alt',
                'rayquaza vmax alt',
                'lugia v alt art',
                'aerodactyl v alt art',
                'machamp v alt art',
                'gengar vmax alt art',
                'mew vmax alt art',
                'pikachu vmax',
                'blaziken vmax alt',
                'gold star pokemon',
                'crystal charizard',
                'base set charizard',
                'shining pokemon cards',
                'rainbow rare charizard',
                'gold mew pokemon',
                'latias latios alt art',
                'eeveelution cards'
            ],
            
            // Set-specific searches
            sets: [
                'evolving skies',
                'crown zenith',
                '151 pokemon tcg',
                'paradox rift',
                'paldean fates',
                'obsidian flames',
                'temporal forces',
                'twilight masquerade',
                'shrouded fable',
                'stellar crown',
                'surging sparks',
                'brilliant stars',
                'fusion strike',
                'chilling reign',
                'vivid voltage',
                'shining fates',
                'hidden fates',
                'cosmic eclipse',
                'team up pokemon',
                'unbroken bonds'
            ],
            
            // Activity searches
            activities: [
                'pokemon pack opening',
                'pokemon booster box',
                'pokemon etb opening',
                'pokemon pulls today',
                'pokemon hits',
                'pokemon chase card',
                'pokemon pull rates',
                'pokemon pack magic',
                'pokemon god pack',
                'pokemon error card',
                'pokemon misprint',
                'pokemon miscut',
                'pokemon crimped card',
                'pokemon test print',
                'pokemon prerelease'
            ],
            
            // Market/Trading searches
            market: [
                'pokemon for sale',
                'pokemon trade',
                'pokemon tcg market',
                'pokemon price check',
                'pokemon psa 10',
                'pokemon bgs 10',
                'pokemon cgc 10',
                'pokemon grading',
                'pokemon raw cards',
                'pokemon auction',
                'pokemon ebay finds',
                'pokemon mercari',
                'pokemon whatnot',
                'pokemon facebook marketplace',
                'pokemon deal alert'
            ],
            
            // Community searches
            community: [
                '#PokemonTCG',
                '#PokemonCards',
                '#PokemonCommunity',
                '#PokemonCollector',
                '#PokemonTCGCollector',
                '#PokemonPulls',
                '#PokemonInvesting',
                '#ModernPokemon',
                '#VintagePokemon',
                '#PokemonGrading',
                '#PokemonDeals',
                '#PokemonMailDay',
                '#PokemonCollection',
                '#JapanesePokemon',
                '#PokemonTCGJapan'
            ],
            
            // Trending/Event searches
            events: [
                'pokemon worlds 2024',
                'pokemon regionals',
                'pokemon tournament',
                'pokemon league',
                'pokemon championship',
                'pokemon vgc',
                'pokemon tcg meta',
                'pokemon deck profile',
                'pokemon competitive',
                'pokemon prize card'
            ],
            
            // Store-specific
            stores: [
                'pokemon center exclusive',
                'pokemon costco tin',
                'pokemon sams club',
                'pokemon best buy',
                'pokemon barnes noble',
                'pokemon target exclusive',
                'pokemon walmart exclusive',
                'pokemon gamestop exclusive',
                'pokemon pokemoncenter'
            ],
            
            // Japanese searches
            japanese: [
                'japanese pokemon cards',
                'pokemon japan exclusive',
                'pokemon vstar universe',
                'pokemon paradigm trigger',
                'pokemon clay burst',
                'pokemon snow hazard',
                'pokemon raging surf',
                'pokemon shiny treasure',
                'pokemon wild force',
                'pokemon cyber judge'
            ]
        };
        
        // Flatten all searches for easy access
        this.allSearches = Object.values(this.searchQueries).flat();
        
        // Track which searches work best
        this.successfulSearches = [];
    }
    
    getNextSearch() {
        const hour = new Date().getHours();
        let searchPool = [];
        
        // Time-based selection (40% weight)
        if (hour >= 5 && hour < 12) {
            searchPool.push(...this.searchQueries.morning);
        } else if (hour >= 12 && hour < 17) {
            searchPool.push(...this.searchQueries.afternoon);
        } else if (hour >= 17 && hour < 22) {
            searchPool.push(...this.searchQueries.evening);
        } else {
            searchPool.push(...this.searchQueries.night);
        }
        
        // Add variety (60% weight)
        searchPool.push(
            ...this.getRandomFrom(this.searchQueries.specific_cards, 3),
            ...this.getRandomFrom(this.searchQueries.sets, 2),
            ...this.getRandomFrom(this.searchQueries.activities, 2),
            ...this.getRandomFrom(this.searchQueries.market, 2),
            ...this.getRandomFrom(this.searchQueries.community, 3)
        );
        
        // Avoid recent searches
        const recentSearches = this.searchHistory.slice(-10);
        searchPool = searchPool.filter(s => !recentSearches.includes(s));
        
        // Pick random from pool
        const selected = searchPool[Math.floor(Math.random() * searchPool.length)] || 
                        this.allSearches[Math.floor(Math.random() * this.allSearches.length)];
        
        // Track history
        this.searchHistory.push(selected);
        if (this.searchHistory.length > 50) {
            this.searchHistory.shift(); // Keep only last 50
        }
        
        return selected;
    }
    
    getRandomFrom(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    trackSearchSuccess(query, postsFound, engagementsMade) {
        const success = engagementsMade / Math.max(postsFound, 1);
        
        if (!this.searchPerformance.has(query)) {
            this.searchPerformance.set(query, {
                uses: 0,
                totalSuccess: 0,
                avgPosts: 0
            });
        }
        
        const perf = this.searchPerformance.get(query);
        perf.uses++;
        perf.totalSuccess += success;
        perf.avgPosts = (perf.avgPosts * (perf.uses - 1) + postsFound) / perf.uses;
        
        // Mark as successful if good engagement
        if (success > 0.3 && postsFound > 5) {
            if (!this.successfulSearches.includes(query)) {
                this.successfulSearches.push(query);
                console.log(`   ⭐ Marked "${query}" as successful search`);
            }
        }
    }
    
    getTrendingSearch() {
        // Priority to successful searches
        if (this.successfulSearches.length > 0 && Math.random() < 0.3) {
            return this.successfulSearches[
                Math.floor(Math.random() * this.successfulSearches.length)
            ];
        }
        
        // Otherwise normal selection
        return this.getNextSearch();
    }
    
    getSearchStats() {
        const stats = {
            totalSearches: this.searchHistory.length,
            uniqueSearches: new Set(this.searchHistory).size,
            successfulSearches: this.successfulSearches.length,
            topPerformers: []
        };
        
        // Find top performing searches
        for (const [query, perf] of this.searchPerformance.entries()) {
            if (perf.uses > 2) {
                stats.topPerformers.push({
                    query,
                    successRate: perf.totalSuccess / perf.uses,
                    avgPosts: perf.avgPosts
                });
            }
        }
        
        stats.topPerformers.sort((a, b) => b.successRate - a.successRate);
        stats.topPerformers = stats.topPerformers.slice(0, 5);
        
        return stats;
    }
}

module.exports = SearchEngine;