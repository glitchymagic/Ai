class SearchEngine {
    constructor() {
        // Start with random counter to vary searches
        this.searchCounter = Math.floor(Math.random() * 10); // For deterministic selection
        this.searchHistory = [];
        this.lastSearchIndex = -1;
        this.searchPerformance = new Map();
        
        // Advanced search operators for better recent post discovery
        this.advancedOperators = {
            // Time-based filters for recent posts (will be computed dynamically)
            recent: [
                'filter:follows',    // From people we follow (more likely recent)
                'filter:replies',    // Include replies for conversation
                '-filter:retweets'   // Exclude retweets (more original content)
            ],
            
            // Engagement filters for quality
            quality: [
                'min_replies:1',     // Has at least 1 reply
                'min_faves:2',       // Has at least 2 likes
                'filter:images',     // Has images (more engaging)
                'filter:videos',     // Has videos
                'filter:verified'    // From verified accounts
            ],
            
            // Language filters only
            locale: [
                'lang:en'           // English posts
            ]
        };
        
        // Recent-focused search strategies
        this.recentSearchStrategies = [
            'time_focused',      // Prioritize recency
            'engagement_focused', // Prioritize engagement
            'mixed_strategy'     // Balance both
        ];
        
        // Comprehensive search library
        this.searchQueries = {
            // Time-based searches (simple queries that actually work)
            morning: [
                'pokemon mail day',
                'pokemon pulls',
                'pokemon tcg opening',
                'pokemon cards arrived', 
                'pokemon delivery',
                '#MailDayMonday',
                'pokemon grail',
                'pokemon mailday'
            ],
            
            afternoon: [
                'pokemon tcg deals',
                'pokemon cards restock',
                'pokemon target find',
                'pokemon walmart stock',
                'pokemon costco',
                'pokemon gamestop',
                'pokemon cards found',
                'pokemon restock'
            ],
            
            evening: [
                'pokemon collection',
                'pokemon binder tour',
                'pokemon display',
                'pokemon showcase',
                'pokemon graded cards',
                'pokemon slab collection',
                'pokemon collection goals',
                'pokemon binder page'
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
            
            // Community searches (simplified)
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
        
        // Simple fallback searches that always find results
        this.fallbackSearches = [
            'pokemon',
            'pokemon cards',
            'pokemon tcg',
            '#pokemon',
            'charizard',
            'pokemon collection',
            'pokemon pull',
            'pokemon pack'
        ];
    }
    
    // Build advanced search query with operators (simplified for better results)
    buildAdvancedSearch(baseQuery, strategy = 'mixed_strategy') {
        let searchQuery = baseQuery;
        
        // Only add filters occasionally to avoid over-filtering
        // Deterministic: use advanced filters every 3rd search
        const useAdvancedFilters = (this.searchCounter % 3) === 0;
        
        if (!useAdvancedFilters) {
            // Most of the time, just use the base query for better results
            return searchQuery;
        }
        
        // When using advanced filters, be very conservative
        if (strategy === 'time_focused') {
            // Dynamically compute date for recent posts
            if (!searchQuery.includes('since:')) {
                const sinceDate = new Date();
                sinceDate.setDate(sinceDate.getDate() - 3); // Last 3 days (more lenient)
                const dateStr = sinceDate.toISOString().slice(0,10);
                searchQuery += ` since:${dateStr}`;
            }
        } else if (strategy === 'engagement_focused') {
            // Only add image filter occasionally
            // Deterministic: add image filter on even searches
            if ((this.searchCounter % 2) === 0 && !searchQuery.includes('filter:images')) {
                searchQuery += ' filter:images';
            }
        } else {
            // Mixed strategy - very light filtering
            // Deterministic: exclude retweets every 4th search
            if ((this.searchCounter % 4) === 0 && !searchQuery.includes('filter:retweets')) {
                searchQuery += ' -filter:retweets'; // Exclude retweets only sometimes
            }
        }
        
        return searchQuery;
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
        
        // Pick deterministically from pool
        let baseQuery = searchPool[this.searchCounter % searchPool.length] || 
                       this.allSearches[this.searchCounter % this.allSearches.length];
        
        // Choose search strategy deterministically
        const strategies = this.recentSearchStrategies;
        const strategy = strategies[this.searchCounter % strategies.length];
        
        // Increment counter for next search
        this.searchCounter++;
        
        // Build advanced search with operators
        const selected = this.buildAdvancedSearch(baseQuery, strategy);
        
        console.log(`   🔍 Search strategy: ${strategy}`);
        console.log(`   📝 Base query: ${baseQuery}`);
        console.log(`   🎯 Final query: ${selected}`);
        
        // Track history
        this.searchHistory.push(selected);
        if (this.searchHistory.length > 50) {
            this.searchHistory.shift(); // Keep only last 50
        }
        
        return selected;
    }
    
    getRandomFrom(array, count) {
        // Deterministic selection based on counter
        const selected = [];
        for (let i = 0; i < count && i < array.length; i++) {
            const index = (this.searchCounter + i) % array.length;
            selected.push(array[index]);
        }
        return selected;
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
        // High priority searches that consistently have fresh content
        const highActivitySearches = [
            '#PokemonTCG',
            '#Pokemon', 
            '#PokemonCards',
            'pokemon target',
            'pokemon walmart',
            'surging sparks',
            'pokemon pulls',
            'pokemon restock',
            'pokemon pack opening'
        ];
        
        console.log(`   📊 Search counter: ${this.searchCounter}`);
        
        // Deterministic: use high activity searches every 2.5 searches (40%)
        if ((this.searchCounter % 5) < 2) {
            const selected = highActivitySearches[
                this.searchCounter % highActivitySearches.length
            ];
            console.log(`   🔥 Using high-activity search: ${selected}`);
            this.searchCounter++; // Increment here too
            return selected;
        }
        
        // Deterministic: use successful searches every 5th search (20%)
        if (this.successfulSearches.length > 0 && (this.searchCounter % 5) === 4) {
            return this.successfulSearches[
                this.searchCounter % this.successfulSearches.length
            ];
        }
        
        // Otherwise normal selection (getNextSearch increments counter)
        return this.getNextSearch();
    }
    
    // Get a simple fallback search when advanced searches fail
    getFallbackSearch() {
        const selected = this.fallbackSearches[this.searchCounter % this.fallbackSearches.length];
        console.log(`   🔄 Using fallback search: ${selected}`);
        this.searchCounter++;
        return selected;
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