class SetVarietyManager {
    constructor() {
        this.sets = new Map();
        this.currentSetRotation = [];
        this.maxSetsInRotation = 10;
        this.setUsageStats = new Map();

        // Initialize with popular Pokemon TCG sets
        this.initializeDefaultSets();
    }

    initializeDefaultSets() {
        const defaultSets = [
            {
                id: 'base1',
                name: 'Base Set',
                releaseYear: 1999,
                rarity: 'classic',
                popularity: 'high',
                themes: ['first_generation', 'basic_pokemon']
            },
            {
                id: 'gym1',
                name: 'Gym Heroes',
                releaseYear: 2000,
                rarity: 'vintage',
                popularity: 'medium',
                themes: ['gym_leaders', 'johto_region']
            },
            {
                id: 'neo1',
                name: 'Neo Genesis',
                releaseYear: 2000,
                rarity: 'vintage',
                popularity: 'high',
                themes: ['legendary_pokemon', 'hoenn_region']
            },
            {
                id: 'swsh1',
                name: 'Sword & Shield',
                releaseYear: 2020,
                rarity: 'modern',
                popularity: 'high',
                themes: ['galarian_forms', 'dynamax']
            },
            {
                id: 'swsh12',
                name: 'Silver Tempest',
                releaseYear: 2022,
                rarity: 'modern',
                popularity: 'high',
                themes: ['paradox_pokemon', 'future_past']
            },
            {
                id: 'sv1',
                name: 'Scarlet & Violet',
                releaseYear: 2023,
                rarity: 'modern',
                popularity: 'high',
                themes: ['terastallization', 'paldea_region']
            }
        ];

        for (const set of defaultSets) {
            this.sets.set(set.id, set);
            this.setUsageStats.set(set.id, {
                mentions: 0,
                lastUsed: null,
                popularity: set.popularity
            });
        }

        this.updateRotation();
    }

    addSet(setData) {
        const set = {
            id: setData.id,
            name: setData.name,
            releaseYear: setData.releaseYear || new Date().getFullYear(),
            rarity: setData.rarity || 'modern',
            popularity: setData.popularity || 'low',
            themes: setData.themes || [],
            cards: setData.cards || []
        };

        this.sets.set(set.id, set);
        this.setUsageStats.set(set.id, {
            mentions: 0,
            lastUsed: null,
            popularity: set.popularity
        });

        this.updateRotation();
        return set;
    }

    removeSet(setId) {
        this.sets.delete(setId);
        this.setUsageStats.delete(setId);
        this.updateRotation();
    }

    getSet(setId) {
        return this.sets.get(setId);
    }

    getRandomSet() {
        const availableSets = Array.from(this.sets.values());
        if (availableSets.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * availableSets.length);
        return availableSets[randomIndex];
    }

    getSetByTheme(theme) {
        const matchingSets = Array.from(this.sets.values())
            .filter(set => set.themes.includes(theme));

        if (matchingSets.length === 0) return null;

        // Return the most popular set with this theme
        return matchingSets.sort((a, b) => {
            const popularityOrder = { high: 3, medium: 2, low: 1 };
            return popularityOrder[b.popularity] - popularityOrder[a.popularity];
        })[0];
    }

    getSetByRarity(rarity) {
        const matchingSets = Array.from(this.sets.values())
            .filter(set => set.rarity === rarity);

        if (matchingSets.length === 0) return null;

        return matchingSets[Math.floor(Math.random() * matchingSets.length)];
    }

    getCurrentRotation() {
        return this.currentSetRotation.map(setId => this.sets.get(setId)).filter(Boolean);
    }

    updateRotation() {
        // Sort sets by popularity and recency
        const sortedSets = Array.from(this.setUsageStats.entries())
            .sort(([,a], [,b]) => {
                const popularityOrder = { high: 3, medium: 2, low: 1 };
                const aPopularity = popularityOrder[a.popularity] || 1;
                const bPopularity = popularityOrder[b.popularity] || 1;

                if (aPopularity !== bPopularity) {
                    return bPopularity - aPopularity;
                }

                // If same popularity, prefer recently used
                if (a.lastUsed && b.lastUsed) {
                    return b.lastUsed - a.lastUsed;
                }

                return a.lastUsed ? -1 : 1;
            })
            .slice(0, this.maxSetsInRotation)
            .map(([setId]) => setId);

        this.currentSetRotation = sortedSets;
    }

    recordSetUsage(setId) {
        const stats = this.setUsageStats.get(setId);
        if (stats) {
            stats.mentions++;
            stats.lastUsed = Date.now();
            this.updateRotation();
        }
    }

    getPopularSets(limit = 5) {
        return Array.from(this.setUsageStats.entries())
            .sort(([,a], [,b]) => b.mentions - a.mentions)
            .slice(0, limit)
            .map(([setId, stats]) => ({
                ...this.sets.get(setId),
                usageStats: stats
            }))
            .filter(set => set.id);
    }

    searchSets(query) {
        const lowercaseQuery = query.toLowerCase();
        const results = [];

        for (const [setId, set] of this.sets.entries()) {
            const searchableText = `${set.name} ${set.themes.join(' ')} ${set.rarity}`.toLowerCase();

            if (searchableText.includes(lowercaseQuery)) {
                results.push({
                    ...set,
                    usageStats: this.setUsageStats.get(setId)
                });
            }
        }

        return results;
    }

    getSetsByYear(year) {
        return Array.from(this.sets.values())
            .filter(set => set.releaseYear === year)
            .sort((a, b) => b.releaseYear - a.releaseYear);
    }

    getStats() {
        const totalSets = this.sets.size;
        const setsByRarity = {};
        const setsByPopularity = {};

        for (const set of this.sets.values()) {
            setsByRarity[set.rarity] = (setsByRarity[set.rarity] || 0) + 1;
            setsByPopularity[set.popularity] = (setsByPopularity[set.popularity] || 0) + 1;
        }

        return {
            totalSets,
            setsByRarity,
            setsByPopularity,
            currentRotationSize: this.currentSetRotation.length,
            mostUsedSet: this.getPopularSets(1)[0]
        };
    }

    getRandomCardFromSet(setId) {
        const set = this.sets.get(setId);
        if (!set || !set.cards || set.cards.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * set.cards.length);
        return set.cards[randomIndex];
    }

    addCardToSet(setId, cardData) {
        const set = this.sets.get(setId);
        if (!set) return false;

        if (!set.cards) set.cards = [];
        set.cards.push(cardData);
        return true;
    }

    getSetThemes() {
        const themes = new Set();

        for (const set of this.sets.values()) {
            set.themes.forEach(theme => themes.add(theme));
        }

        return Array.from(themes);
    }

    getRecommendations(context) {
        const recommendations = [];

        // Recommend based on current trends
        const popularSets = this.getPopularSets(3);
        recommendations.push(...popularSets.map(set => ({
            type: 'popular',
            set: set,
            reason: 'Currently popular in community discussions'
        })));

        // Recommend based on context
        if (context?.intent === 'priceInquiry') {
            const valuableSets = Array.from(this.sets.values())
                .filter(set => set.rarity === 'vintage' || set.popularity === 'high')
                .slice(0, 2);

            recommendations.push(...valuableSets.map(set => ({
                type: 'valuable',
                set: set,
                reason: 'Often contains valuable cards'
            })));
        }

        // Recommend recent sets for new collectors
        const currentYear = new Date().getFullYear();
        const recentSets = this.getSetsByYear(currentYear).slice(0, 2);
        recommendations.push(...recentSets.map(set => ({
            type: 'recent',
            set: set,
            reason: 'Newly released set with current meta cards'
        })));

        return recommendations.slice(0, 5); // Limit to 5 recommendations
    }
}

module.exports = SetVarietyManager;
