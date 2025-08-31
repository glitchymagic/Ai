// Price Engine Main Entry Point
// This connects the price system to the bot

const PriceAggregationSystem = require('./PriceAggregationSystem');
const UnifiedPriceService = require('./services/UnifiedPriceService');
const fs = require('fs').promises;
const path = require('path');

class PriceEngine {
    constructor() {
        this.aggregator = null;
        this.unifiedService = null;
        this.isInitialized = false;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🚀 Starting Pokemon TCG Price Engine...');
        
        // Initialize the aggregation system
        this.aggregator = new PriceAggregationSystem();
        
        // Wait for it to load data
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Initialize unified service (includes scrapers)
        // For now, we'll just use local data to avoid scraping issues
        // this.unifiedService = new UnifiedPriceService();
        
        this.isInitialized = true;
        console.log('✅ Price Engine Ready!');
        console.log(`   • ${this.aggregator.priceDatabase.size} cards loaded`);
        console.log(`   • ${this.aggregator.priceHistory.size} cards with history`);
    }
    
    // Simple price lookup for bot responses
    async getQuickPrice(cardName, setName = null) {
        if (!this.isInitialized) await this.initialize();
        
        const price = await this.aggregator.getCurrentPrice(cardName, setName);
        
        if (price && price.price) {
            return {
                price: price.price,
                confidence: price.confidence,
                formatted: `$${price.price.toFixed(2)}`
            };
        }
        
        return null;
    }
    
    // Detailed market analysis for original posts
    async getMarketAnalysis(cardName, setName = null) {
        if (!this.isInitialized) await this.initialize();
        
        return await this.aggregator.getMarketAnalysis(cardName, setName);
    }
    
    // Get trending cards for original posts
    async getTrendingCards(limit = 5) {
        if (!this.isInitialized) await this.initialize();
        
        const trending = [];
        
        // Check all cards for trends
        for (const [key, card] of this.aggregator.priceDatabase) {
            const trends = await this.aggregator.detectTrends(card.name, card.set);
            
            if (trends.trend === 'rising' || trends.trend === 'spiking') {
                trending.push({
                    name: card.name,
                    set: card.set,
                    price: card.currentPrice,
                    trend: trends.trend,
                    change: trends.change
                });
            }
        }
        
        // Sort by change percentage and return top X
        return trending
            .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
            .slice(0, limit);
    }
    
    // Get market movers for daily reports
    async getDailyMovers() {
        if (!this.isInitialized) await this.initialize();
        
        const movers = {
            gainers: [],
            losers: [],
            volume: [],
            watching: []
        };
        
        // Sample data for now - will be enhanced with real tracking
        movers.gainers = [
            { name: 'Charizard', set: 'Base Set', change: '+5.2%', price: '$254.12' },
            { name: 'Moonbreon', set: 'Evolving Skies', change: '+3.8%', price: '$492.00' }
        ];
        
        movers.losers = [
            { name: 'Pikachu', set: 'Base Set', change: '-2.1%', price: '$2.93' }
        ];
        
        movers.watching = [
            { name: 'Lugia V', set: 'Silver Tempest', reason: 'Tournament results pending' },
            { name: 'Giratina VSTAR', set: 'Lost Origin', reason: 'Supply shortage reported' }
        ];
        
        return movers;
    }
    
    // Format price for Twitter responses
    formatPriceResponse(priceData, style = 'casual') {
        if (!priceData) return "can't find a price on that one";
        
        const price = priceData.price || priceData;
        
        if (style === 'casual') {
            // For replies - casual style
            if (price < 10) return `like $${price.toFixed(0)}-ish`;
            if (price < 50) return `around $${Math.round(price / 5) * 5}`;
            if (price < 100) return `bout $${Math.round(price / 10) * 10}`;
            return `$${Math.round(price / 25) * 25} range`;
        } else if (style === 'authoritative') {
            // For original posts - precise
            return `$${price.toFixed(2)}`;
        } else if (style === 'movement') {
            // For trend posts
            const change = priceData.change || 0;
            const arrow = change > 0 ? '↗️' : change < 0 ? '↘️' : '→';
            return `$${price.toFixed(2)} ${arrow} ${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        }
        
        return `$${price.toFixed(2)}`;
    }
    
    // Check for price alerts
    async checkAlerts() {
        if (!this.isInitialized) await this.initialize();
        
        const alerts = [];
        
        // Check each card for significant movements
        for (const [key, card] of this.aggregator.priceDatabase) {
            const alertData = this.aggregator.checkPriceAlerts(card.name, card.set, card.currentPrice);
            if (alertData && alertData.length > 0) {
                alerts.push(...alertData);
            }
        }
        
        return alerts;
    }
    
    // Save current state
    async saveState() {
        const statePath = path.join(__dirname, 'data', 'engine-state.json');
        const state = {
            lastUpdate: new Date().toISOString(),
            totalCards: this.aggregator.priceDatabase.size,
            activeAlerts: await this.checkAlerts()
        };
        
        await fs.writeFile(statePath, JSON.stringify(state, null, 2));
    }
}

// Create and export singleton instance
const priceEngine = new PriceEngine();
module.exports = priceEngine;