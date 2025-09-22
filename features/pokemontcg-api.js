const axios = require('axios');

class PokemonTCGAPI {
    constructor(apiKey = null) {
        this.baseURL = 'https://api.pokemontcg.io/v2';
        this.apiKey = apiKey;
        this.rateLimitDelay = 100; // ms between requests
        this.lastRequestTime = 0;
        this.requestQueue = [];
        this.isProcessingQueue = false;
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    async makeRequest(endpoint, params = {}) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
        }

        this.lastRequestTime = Date.now();

        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.apiKey) {
            headers['X-Api-Key'] = this.apiKey;
        }

        const url = `${this.baseURL}${endpoint}`;

        try {
            const response = await axios.get(url, {
                headers,
                params,
                timeout: 10000 // 10 second timeout
            });

            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.response?.status || 500
            };
        }
    }

    async getCardById(cardId) {
        const result = await this.makeRequest(`/cards/${cardId}`);

        if (result.success) {
            return {
                success: true,
                card: result.data.data,
                price: this.extractPrice(result.data.data),
                rarity: result.data.data.rarity,
                set: result.data.data.set
            };
        }

        return result;
    }

    async searchCards(query, options = {}) {
        const params = {
            q: query,
            page: options.page || 1,
            pageSize: options.pageSize || 10,
            orderBy: options.orderBy || 'name'
        };

        const result = await this.makeRequest('/cards', params);

        if (result.success) {
            return {
                success: true,
                cards: result.data.data,
                totalCount: result.data.totalCount,
                page: result.data.page,
                pageSize: result.data.pageSize
            };
        }

        return result;
    }

    async getCardByName(cardName) {
        const query = `name:"${cardName}"`;
        const result = await this.searchCards(query, { pageSize: 1 });

        if (result.success && result.cards.length > 0) {
            const card = result.cards[0];
            return {
                success: true,
                card: card,
                price: this.extractPrice(card),
                rarity: card.rarity,
                set: card.set
            };
        }

        return {
            success: false,
            error: 'Card not found',
            suggestions: await this.getSimilarCards(cardName)
        };
    }

    async getSimilarCards(cardName) {
        // Try partial name matching
        const partialQuery = cardName.split(' ')[0];
        const result = await this.searchCards(`name:${partialQuery}*`, { pageSize: 5 });

        if (result.success) {
            return result.cards.map(card => ({
                name: card.name,
                id: card.id,
                set: card.set.name
            }));
        }

        return [];
    }

    async getSetInfo(setId) {
        const result = await this.makeRequest(`/sets/${setId}`);

        if (result.success) {
            return {
                success: true,
                set: result.data.data
            };
        }

        return result;
    }

    async getSets(options = {}) {
        const params = {
            page: options.page || 1,
            pageSize: options.pageSize || 20,
            orderBy: options.orderBy || 'releaseDate'
        };

        const result = await this.makeRequest('/sets', params);

        if (result.success) {
            return {
                success: true,
                sets: result.data.data,
                totalCount: result.data.totalCount
            };
        }

        return result;
    }

    async getCardsInSet(setId, options = {}) {
        const query = `set.id:${setId}`;
        return await this.searchCards(query, options);
    }

    async getPriceHistory(cardId, timeframe = '30d') {
        // Note: This is a placeholder - the actual Pokemon TCG API may not have price history
        // In a real implementation, you might need to use a different API or service for price history
        return {
            success: false,
            error: 'Price history not available through Pokemon TCG API',
            note: 'Consider using TCGPlayer API for price history'
        };
    }

    extractPrice(card) {
        // Extract price from card data
        // This is a simplified version - real implementation would handle multiple markets
        if (card.cardmarket?.prices?.averageSellPrice) {
            return {
                market: 'cardmarket',
                price: card.cardmarket.prices.averageSellPrice,
                currency: 'EUR'
            };
        }

        if (card.tcgplayer?.prices?.holofoil?.market) {
            return {
                market: 'tcgplayer',
                price: card.tcgplayer.prices.holofoil.market,
                currency: 'USD'
            };
        }

        return null;
    }

    async getMarketPrice(cardId) {
        const cardResult = await this.getCardById(cardId);

        if (cardResult.success) {
            return {
                success: true,
                price: cardResult.price,
                card: {
                    name: cardResult.card.name,
                    rarity: cardResult.card.rarity,
                    set: cardResult.card.set.name
                }
            };
        }

        return cardResult;
    }

    async getBulkCardData(cardIds) {
        const results = [];
        const batchSize = 5; // Process in batches to respect rate limits

        for (let i = 0; i < cardIds.length; i += batchSize) {
            const batch = cardIds.slice(i, i + batchSize);

            const batchPromises = batch.map(cardId => this.getCardById(cardId));
            const batchResults = await Promise.all(batchPromises);

            results.push(...batchResults);

            // Small delay between batches
            if (i + batchSize < cardIds.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        return {
            success: true,
            results,
            totalProcessed: results.length,
            successful: results.filter(r => r.success).length
        };
    }

    async searchByRarity(rarity, options = {}) {
        const query = `rarity:"${rarity}"`;
        return await this.searchCards(query, options);
    }

    async searchByType(pokemonType, options = {}) {
        const query = `types:${pokemonType}`;
        return await this.searchCards(query, options);
    }

    async getRandomCard() {
        // Get a random card by searching with a very broad query
        const result = await this.searchCards('*', {
            page: Math.floor(Math.random() * 100) + 1,
            pageSize: 1
        });

        if (result.success && result.cards.length > 0) {
            return {
                success: true,
                card: result.cards[0]
            };
        }

        return {
            success: false,
            error: 'Could not fetch random card'
        };
    }

    async validateCardExists(cardName) {
        const result = await this.getCardByName(cardName);
        return {
            exists: result.success,
            card: result.success ? result.card : null,
            suggestions: result.suggestions || []
        };
    }

    async getCardStats() {
        // Get some basic statistics
        try {
            const allSets = await this.getSets({ pageSize: 1 });
            const allCards = await this.searchCards('*', { pageSize: 1 });

            if (allSets.success && allCards.success) {
                return {
                    success: true,
                    stats: {
                        totalSets: allSets.totalCount,
                        totalCards: allCards.totalCount,
                        lastUpdated: new Date().toISOString()
                    }
                };
            }
        } catch (error) {
            // Ignore errors for stats
        }

        return {
            success: false,
            error: 'Could not fetch API statistics'
        };
    }

    // Health check for the API
    async healthCheck() {
        const startTime = Date.now();

        try {
            const result = await this.makeRequest('/cards', { pageSize: 1 });
            const responseTime = Date.now() - startTime;

            return {
                success: result.success,
                responseTime,
                status: result.status || (result.success ? 200 : 500),
                healthy: result.success && responseTime < 5000 // Consider healthy if response < 5 seconds
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                healthy: false
            };
        }
    }
}

module.exports = PokemonTCGAPI;
