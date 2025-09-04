// Hot Cards Price Tracker
// Tracks the most important Pokemon cards in real-time
// These are the cards that actually move markets and people ask about

class HotCardsTracker {
    constructor(priceService = null) {
        this.priceService = priceService; // Will use existing UnifiedPriceService
        this.lastUpdate = new Map();
        this.priceCache = new Map();
        this.priceHistory = new Map(); // Track 24h price movements
        
        // THE HOT 100 - Cards that matter in today's market
        this.HOT_CARDS = [
            // ============ TIER 1: GRAILS (Update every 10 minutes) ============
            { name: 'Umbreon VMAX Alt Art', set: 'Evolving Skies', id: 'moonbreon', priority: 'critical' },
            { name: 'Charizard UPC', set: 'Ultra Premium Collection', id: 'charizard-upc', priority: 'critical' },
            { name: 'Pikachu Van Gogh', set: 'Promo', id: 'van-gogh-pikachu', priority: 'critical' },
            { name: 'Giratina V Alt Art', set: 'Lost Origin', id: 'giratina-alt', priority: 'critical' },
            { name: 'Lugia V Alt Art', set: 'Silver Tempest', id: 'lugia-alt', priority: 'critical' },
            { name: 'Charizard ex Special Illustration', set: '151', id: 'charizard-sir-151', priority: 'critical' },
            
            // ============ TIER 2: HIGH VALUE CHASE (Update every 20 minutes) ============
            { name: 'Rayquaza VMAX Alt Art', set: 'Evolving Skies', id: 'rayquaza-alt', priority: 'high' },
            { name: 'Umbreon V Alt Art', set: 'Evolving Skies', id: 'umbreon-v-alt', priority: 'high' },
            { name: 'Gengar VMAX Alt Art', set: 'Fusion Strike', id: 'gengar-alt', priority: 'high' },
            { name: 'Machamp V Alt Art', set: 'Astral Radiance', id: 'machamp-alt', priority: 'high' },
            { name: 'Aerodactyl V Alt Art', set: 'Lost Origin', id: 'aerodactyl-alt', priority: 'high' },
            { name: 'Palkia V Alt Art', set: 'Astral Radiance', id: 'palkia-alt', priority: 'high' },
            { name: 'Garchomp V Alt Art', set: 'Astral Radiance', id: 'garchomp-alt', priority: 'high' },
            { name: 'Mewtwo VSTAR Rainbow', set: 'Pokemon GO', id: 'mewtwo-vstar-rainbow', priority: 'high' },
            
            // ============ TIER 3: TOURNAMENT META (Update every 30 minutes) ============
            { name: 'Giratina VSTAR', set: 'Lost Origin', id: 'giratina-vstar', priority: 'medium' },
            { name: 'Gardevoir ex', set: 'Scarlet & Violet', id: 'gardevoir-ex', priority: 'medium' },
            { name: 'Miraidon ex', set: 'Scarlet & Violet', id: 'miraidon-ex', priority: 'medium' },
            { name: 'Charizard ex', set: 'Obsidian Flames', id: 'charizard-ex-obf', priority: 'medium' },
            { name: 'Lost City', set: 'Lost Origin', id: 'lost-city', priority: 'medium' },
            { name: 'Cross Switcher', set: 'Astral Radiance', id: 'cross-switcher', priority: 'medium' },
            { name: 'Prime Catcher', set: 'Temporal Forces', id: 'prime-catcher-ace', priority: 'medium' },
            
            // ============ TIER 4: NEW SET HITS (Update hourly) ============
            { name: 'Pikachu ex', set: 'Surging Sparks', id: 'pikachu-ex-surging', priority: 'standard' },
            { name: 'Latias ex', set: 'Surging Sparks', id: 'latias-ex-surging', priority: 'standard' },
            { name: 'Alolan Exeggutor ex', set: 'Surging Sparks', id: 'exeggutor-ex-surging', priority: 'standard' },
            
            // ============ TIER 5: SEALED PRODUCTS (Update every 2 hours) ============
            { name: 'Surging Sparks Elite Trainer Box', set: 'Sealed', id: 'surging-sparks-etb', priority: 'low' },
            { name: 'Surging Sparks Booster Box', set: 'Sealed', id: 'surging-sparks-bb', priority: 'low' },
            { name: '151 Elite Trainer Box', set: 'Sealed', id: '151-etb', priority: 'low' },
            { name: 'Crown Zenith Elite Trainer Box', set: 'Sealed', id: 'crown-zenith-etb', priority: 'low' },
            { name: 'Evolving Skies Booster Box', set: 'Sealed', id: 'evolving-skies-bb', priority: 'low' },
            
            // ============ TIER 6: VINTAGE MOVERS ============
            { name: 'Charizard Base Set', set: 'Base Set', id: 'charizard-base', priority: 'standard' },
            { name: 'Blastoise Base Set', set: 'Base Set', id: 'blastoise-base', priority: 'standard' },
            { name: 'Shining Charizard', set: 'Neo Destiny', id: 'shining-charizard', priority: 'standard' },
            { name: 'Gold Star Rayquaza', set: 'EX Deoxys', id: 'rayquaza-gold-star', priority: 'standard' },
            
            // Add more to reach 100...
        ];
        
        // Update intervals based on priority
        this.updateIntervals = {
            critical: 10 * 60 * 1000,    // 10 minutes
            high: 20 * 60 * 1000,        // 20 minutes
            medium: 30 * 60 * 1000,      // 30 minutes
            standard: 60 * 60 * 1000,    // 1 hour
            low: 120 * 60 * 1000         // 2 hours
        };
    }
    
    // Check if a card needs price update
    needsUpdate(card) {
        const lastUpdate = this.lastUpdate.get(card.id);
        if (!lastUpdate) return true;
        
        const interval = this.updateIntervals[card.priority];
        return Date.now() - lastUpdate > interval;
    }
    
    // Get price data for a card
    async getCardPrice(card) {
        try {
            // Check cache first
            if (!this.needsUpdate(card)) {
                return this.priceCache.get(card.id);
            }
            
            // Use existing price service if available
            if (this.priceService) {
                const priceData = await this.priceService.getAuthoritativePrice(
                    card.name, 
                    card.set,
                    { urgency: card.priority === 'critical' ? 'urgent' : 'normal' }
                );
                
                // Store in cache
                this.priceCache.set(card.id, priceData);
                this.lastUpdate.set(card.id, Date.now());
                
                // Track price history
                this.updatePriceHistory(card.id, priceData);
                
                return priceData;
            }
            
            // Fallback to mock data for testing
            return this.getMockPrice(card);
            
        } catch (error) {
            console.error(`Failed to get price for ${card.name}:`, error);
            return this.priceCache.get(card.id) || this.getMockPrice(card);
        }
    }
    
    // Update price history for trend calculation
    updatePriceHistory(cardId, priceData) {
        const history = this.priceHistory.get(cardId) || [];
        history.push({
            timestamp: Date.now(),
            price: priceData.market,
            volume: priceData.volume24h
        });
        
        // Keep only last 24 hours
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const filtered = history.filter(h => h.timestamp > dayAgo);
        
        this.priceHistory.set(cardId, filtered);
    }
    
    // Get top movers (for market reports)
    async getTopMovers(limit = 5) {
        const movements = [];
        
        for (const card of this.HOT_CARDS.slice(0, 30)) { // Check top 30
            const current = await this.getCardPrice(card);
            const history = this.priceHistory.get(card.id) || [];
            
            if (history.length > 0 && current.market) {
                const oldestPrice = history[0].price;
                const change = ((current.market - oldestPrice) / oldestPrice) * 100;
                
                movements.push({
                    card: card,
                    currentPrice: current.market,
                    change: change,
                    volume: current.volume24h || 0,
                    trend: current.trend
                });
            }
        }
        
        // Sort by absolute change
        movements.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
        
        return {
            gainers: movements.filter(m => m.change > 0).slice(0, limit),
            losers: movements.filter(m => m.change < 0).slice(0, limit),
            highVolume: movements.sort((a, b) => b.volume - a.volume).slice(0, limit)
        };
    }
    
    // Get price for a specific card by name
    async getPriceByName(cardName) {
        // Fuzzy match against hot cards
        const card = this.findCard(cardName);
        if (card) {
            return await this.getCardPrice(card);
        }
        
        // Not in hot cards - use price service directly
        if (this.priceService) {
            return await this.priceService.getAuthoritativePrice(cardName);
        }
        
        return null;
    }
    
    // Find card in hot list
    findCard(searchName) {
        const search = searchName.toLowerCase();
        return this.HOT_CARDS.find(card => 
            card.name.toLowerCase().includes(search) ||
            card.id.includes(search.replace(/\s+/g, '-'))
        );
    }
    
    // Mock price data for testing
    getMockPrice(card) {
        const basePrice = {
            'moonbreon': 425,
            'charizard-upc': 165,
            'van-gogh-pikachu': 300,
            'giratina-alt': 275,
            'lugia-alt': 195
        }[card.id] || 50;
        
        // Add some randomness
        const variance = (Math.random() - 0.5) * 0.1;
        const price = Math.round(basePrice * (1 + variance));
        
        return {
            cardName: card.name,
            market: price,
            low: Math.round(price * 0.9),
            high: Math.round(price * 1.1),
            trend: (Math.random() - 0.5) * 20,
            volume24h: Math.floor(Math.random() * 50) + 10,
            confidence: 0.85,
            lastUpdated: new Date().toISOString()
        };
    }
}

module.exports = HotCardsTracker;