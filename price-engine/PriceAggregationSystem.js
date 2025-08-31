// Comprehensive Price Aggregation System for Pokemon TCG Authority Bot
// Day 1-2: Foundation Implementation

const fs = require('fs').promises;
const path = require('path');

class PriceAggregationSystem {
    constructor() {
        // Data directories
        this.dataDir = path.join(__dirname, 'data');
        this.cacheDir = path.join(__dirname, 'cache');
        this.logsDir = path.join(__dirname, 'logs');
        
        // Price sources
        this.sources = {
            tcgplayer: { weight: 0.4, enabled: true },
            ebay: { weight: 0.3, enabled: true },
            pricecharting: { weight: 0.2, enabled: true },
            local: { weight: 0.1, enabled: true }
        };
        
        // Cache settings
        this.cacheSettings = {
            maxAge: 3600000, // 1 hour
            shortTermAge: 300000, // 5 minutes for hot cards
            priceHistory: 2592000000 // 30 days
        };
        
        // Price database
        this.priceDatabase = new Map();
        this.priceHistory = new Map();
        this.trends = new Map();
        
        // Initialize on construction
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Price Aggregation System...');
        
        // Load existing data
        await this.loadExistingData();
        
        // Start price monitoring
        this.startPriceMonitoring();
        
        console.log('✅ Price Aggregation System initialized');
    }
    
    // ==================== DATA LOADING ====================
    
    async loadExistingData() {
        try {
            // Load all JSON files from data directory
            const files = await fs.readdir(this.dataDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));
            
            for (const file of jsonFiles) {
                const filePath = path.join(this.dataDir, file);
                const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
                
                if (file.includes('historical')) {
                    await this.processHistoricalData(data);
                } else if (file.includes('market')) {
                    await this.processMarketData(data);
                } else if (file.includes('price')) {
                    await this.processPriceData(data);
                }
            }
            
            console.log(`📊 Loaded ${this.priceDatabase.size} cards into price database`);
        } catch (error) {
            console.error('Error loading existing data:', error);
        }
    }
    
    async processHistoricalData(data) {
        // Process historical price data
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item.cardName) {
                    const key = this.generateCardKey(item.cardName, item.setName);
                    
                    if (!this.priceHistory.has(key)) {
                        this.priceHistory.set(key, []);
                    }
                    
                    this.priceHistory.get(key).push({
                        date: item.date || new Date().toISOString(),
                        price: this.extractPrice(item),
                        condition: item.condition || 'NM'
                    });
                }
            });
        }
    }
    
    async processMarketData(data) {
        // Process current market data
        if (data.cards) {
            data.cards.forEach(card => {
                const key = this.generateCardKey(card.cardName, card.cardSet);
                
                this.priceDatabase.set(key, {
                    name: card.cardName,
                    set: card.cardSet,
                    number: card.cardNumber,
                    currentPrice: this.extractPrice(card.currentPrices),
                    lastUpdated: card.scrapedAt || new Date().toISOString(),
                    source: 'pricecharting'
                });
            });
        }
    }
    
    async processPriceData(data) {
        // Process general price data
        if (data.prices) {
            Object.entries(data.prices).forEach(([cardId, priceInfo]) => {
                this.priceDatabase.set(cardId, {
                    ...priceInfo,
                    lastUpdated: new Date().toISOString()
                });
            });
        }
    }
    
    // ==================== REAL-TIME PRICE FETCHING ====================
    
    async getCurrentPrice(cardName, setName = null, condition = 'NM') {
        // Try different key variations
        const keys = [
            this.generateCardKey(cardName, setName),
            this.generateCardKey(cardName, setName === 'Base Set' ? 'Base' : setName),
            this.generateCardKey(cardName.toLowerCase(), setName?.toLowerCase())
        ];
        
        // Check cache for each key variation
        for (const key of keys) {
            const cached = this.getCachedPrice(key);
            if (cached) {
                const price = this.extractSinglePrice(cached);
                if (price) {
                    return {
                        price: price,
                        source: cached.source || 'cache',
                        confidence: cached.confidence || 0.95,
                        timestamp: cached.lastUpdated || new Date().toISOString()
                    };
                }
            }
        }
        
        // Fetch fresh prices from all sources
        const prices = await this.fetchFromAllSources(cardName, setName, condition);
        
        // Calculate weighted average
        const finalPrice = this.calculateWeightedPrice(prices);
        
        // Update cache and database if we got a price
        if (finalPrice && finalPrice.price) {
            this.updatePriceDatabase(keys[0], finalPrice);
        }
        
        return finalPrice;
    }
    
    async fetchFromAllSources(cardName, setName, condition) {
        const prices = {};
        
        // Fetch from each enabled source
        if (this.sources.tcgplayer.enabled) {
            prices.tcgplayer = await this.fetchFromTCGPlayer(cardName, setName, condition);
        }
        
        if (this.sources.ebay.enabled) {
            prices.ebay = await this.fetchFromEbay(cardName, setName, condition);
        }
        
        if (this.sources.pricecharting.enabled) {
            prices.pricecharting = await this.fetchFromPriceCharting(cardName, setName);
        }
        
        if (this.sources.local.enabled) {
            prices.local = this.getLocalPrice(cardName, setName);
        }
        
        return prices;
    }
    
    // ==================== PRICE SOURCES ====================
    
    async fetchFromTCGPlayer(cardName, setName, condition) {
        // TODO: Implement actual TCGPlayer API call
        // For now, return mock data based on existing prices
        const key = this.generateCardKey(cardName, setName);
        const existing = this.priceDatabase.get(key);
        
        if (existing) {
            return {
                market: existing.currentPrice,
                low: existing.currentPrice * 0.85,
                mid: existing.currentPrice,
                high: existing.currentPrice * 1.15
            };
        }
        
        return null;
    }
    
    async fetchFromEbay(cardName, setName, condition) {
        // TODO: Implement eBay sold listings scraper
        // For now, return estimated based on TCGPlayer
        const tcgPrice = await this.fetchFromTCGPlayer(cardName, setName, condition);
        
        if (tcgPrice) {
            return {
                recent: tcgPrice.market * 0.95,
                average: tcgPrice.market,
                trending: tcgPrice.market * 1.02
            };
        }
        
        return null;
    }
    
    async fetchFromPriceCharting(cardName, setName) {
        // Check our existing PriceCharting data
        const key = this.generateCardKey(cardName, setName);
        const existing = this.priceDatabase.get(key);
        
        if (existing && existing.source === 'pricecharting') {
            return {
                ungraded: existing.currentPrice,
                graded: {
                    psa10: existing.currentPrice * 3.5,
                    psa9: existing.currentPrice * 2.0,
                    bgs10: existing.currentPrice * 4.0
                }
            };
        }
        
        return null;
    }
    
    getLocalPrice(cardName, setName) {
        const key = this.generateCardKey(cardName, setName);
        return this.priceDatabase.get(key);
    }
    
    // ==================== PRICE ANALYSIS ====================
    
    calculateWeightedPrice(prices) {
        let totalWeight = 0;
        let weightedSum = 0;
        
        Object.entries(prices).forEach(([source, priceData]) => {
            if (priceData && this.sources[source]) {
                const price = this.extractSinglePrice(priceData);
                if (price) {
                    const weight = this.sources[source].weight;
                    weightedSum += price * weight;
                    totalWeight += weight;
                }
            }
        });
        
        if (totalWeight === 0) return null;
        
        return {
            price: Math.round((weightedSum / totalWeight) * 100) / 100,
            confidence: totalWeight,
            sources: Object.keys(prices).filter(s => prices[s]),
            timestamp: new Date().toISOString()
        };
    }
    
    extractSinglePrice(priceData) {
        if (!priceData) return null;
        if (typeof priceData === 'number') return priceData;
        if (priceData.currentPrice) return priceData.currentPrice;
        if (priceData.price) return priceData.price;
        if (priceData.market) return priceData.market;
        if (priceData.average) return priceData.average;
        if (priceData.ungraded) return priceData.ungraded;
        return null;
    }
    
    // ==================== TREND DETECTION ====================
    
    async detectTrends(cardName, setName) {
        const key = this.generateCardKey(cardName, setName);
        const history = this.priceHistory.get(key) || [];
        
        if (history.length < 2) {
            return { trend: 'stable', change: 0 };
        }
        
        // Calculate trends
        const recent = history.slice(-7); // Last 7 data points
        const older = history.slice(-14, -7); // Previous 7 data points
        
        const recentAvg = this.calculateAverage(recent.map(h => h.price));
        const olderAvg = this.calculateAverage(older.map(h => h.price));
        
        const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        let trend = 'stable';
        if (changePercent > 5) trend = 'rising';
        if (changePercent > 15) trend = 'spiking';
        if (changePercent < -5) trend = 'falling';
        if (changePercent < -15) trend = 'crashing';
        
        return {
            trend,
            change: changePercent,
            support: Math.min(...recent.map(h => h.price)),
            resistance: Math.max(...recent.map(h => h.price)),
            volume: recent.length
        };
    }
    
    // ==================== PRICE ALERTS ====================
    
    checkPriceAlerts(cardName, setName, currentPrice) {
        const alerts = [];
        
        // Check for significant price movements
        const key = this.generateCardKey(cardName, setName);
        const history = this.priceHistory.get(key) || [];
        
        if (history.length > 0) {
            const lastPrice = history[history.length - 1].price;
            const change = ((currentPrice - lastPrice) / lastPrice) * 100;
            
            if (Math.abs(change) > 10) {
                alerts.push({
                    type: change > 0 ? 'spike' : 'drop',
                    card: cardName,
                    set: setName,
                    change: change,
                    from: lastPrice,
                    to: currentPrice
                });
            }
        }
        
        return alerts;
    }
    
    // ==================== BULK OPERATIONS ====================
    
    async bulkPriceLookup(cards) {
        const results = [];
        
        for (const card of cards) {
            const price = await this.getCurrentPrice(card.name, card.set, card.condition);
            results.push({
                ...card,
                price: price
            });
        }
        
        return results;
    }
    
    // ==================== CACHE MANAGEMENT ====================
    
    getCachedPrice(key) {
        return this.priceDatabase.get(key);
    }
    
    isCacheFresh(cached) {
        if (!cached || !cached.lastUpdated) return false;
        
        const age = Date.now() - new Date(cached.lastUpdated).getTime();
        return age < this.cacheSettings.maxAge;
    }
    
    updatePriceDatabase(key, priceData) {
        if (!priceData || !priceData.price) return; // Guard against null/invalid data
        
        this.priceDatabase.set(key, {
            ...priceData,
            lastUpdated: new Date().toISOString()
        });
        
        // Also update history
        if (!this.priceHistory.has(key)) {
            this.priceHistory.set(key, []);
        }
        
        this.priceHistory.get(key).push({
            date: new Date().toISOString(),
            price: priceData.price
        });
    }
    
    // ==================== MONITORING ====================
    
    startPriceMonitoring() {
        // Monitor hot cards every 5 minutes
        setInterval(() => {
            this.updateHotCards();
        }, 300000);
        
        // Full update every hour
        setInterval(() => {
            this.fullPriceUpdate();
        }, 3600000);
    }
    
    async updateHotCards() {
        const hotCards = [
            { name: 'Umbreon VMAX', set: 'Evolving Skies' },
            { name: 'Charizard', set: 'Base Set' },
            { name: 'Lugia V', set: 'Silver Tempest' },
            { name: 'Giratina VSTAR', set: 'Lost Origin' }
        ];
        
        for (const card of hotCards) {
            await this.getCurrentPrice(card.name, card.set);
        }
    }
    
    async fullPriceUpdate() {
        console.log('🔄 Running full price update...');
        // Update all cards in database
        for (const [key, card] of this.priceDatabase) {
            await this.getCurrentPrice(card.name, card.set);
        }
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    generateCardKey(cardName, setName) {
        const cleanName = (cardName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanSet = (setName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${cleanName}_${cleanSet}`;
    }
    
    extractPrice(priceObj) {
        if (typeof priceObj === 'number') return priceObj;
        if (typeof priceObj === 'string') {
            return parseFloat(priceObj.replace(/[$,]/g, ''));
        }
        if (priceObj && typeof priceObj === 'object') {
            if (priceObj.ungraded) return this.extractPrice(priceObj.ungraded);
            if (priceObj.market) return this.extractPrice(priceObj.market);
            if (priceObj.price) return this.extractPrice(priceObj.price);
        }
        return 0;
    }
    
    calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
    
    // ==================== EXPORT FUNCTIONS ====================
    
    async exportPriceData() {
        const exportData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                totalCards: this.priceDatabase.size,
                sources: Object.keys(this.sources)
            },
            prices: Array.from(this.priceDatabase.entries()).map(([key, value]) => ({
                key,
                ...value
            })),
            trends: Array.from(this.trends.entries()).map(([key, value]) => ({
                key,
                ...value
            }))
        };
        
        const exportPath = path.join(this.dataDir, `price-export-${Date.now()}.json`);
        await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
        
        return exportPath;
    }
    
    // ==================== API FOR BOT ====================
    
    async getMarketAnalysis(cardName, setName) {
        const price = await this.getCurrentPrice(cardName, setName);
        const trends = await this.detectTrends(cardName, setName);
        
        return {
            current: price,
            trends: trends,
            recommendation: this.generateRecommendation(price, trends)
        };
    }
    
    generateRecommendation(price, trends) {
        if (!price || !trends) return 'insufficient data';
        
        if (trends.trend === 'spiking' && trends.change > 20) {
            return 'sell - peak detected';
        }
        if (trends.trend === 'crashing' && trends.change < -20) {
            return 'buy - bottom forming';
        }
        if (trends.trend === 'rising' && price.price < trends.resistance * 0.9) {
            return 'hold - upward momentum';
        }
        if (trends.trend === 'falling' && price.price > trends.support * 1.1) {
            return 'wait - finding support';
        }
        
        return 'stable - no action needed';
    }
}

module.exports = PriceAggregationSystem;