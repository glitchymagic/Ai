// Unified Price Service
// Combines all price sources into a single authoritative price

const PriceAggregationSystem = require('../PriceAggregationSystem');
const TCGPlayerScraper = require('../scrapers/TCGPlayerScraper');
const EbaySoldListingsScraper = require('../scrapers/EbaySoldListingsScraper');
const fs = require('fs').promises;
const path = require('path');

class UnifiedPriceService {
    constructor() {
        this.aggregator = new PriceAggregationSystem();
        this.tcgScraper = new TCGPlayerScraper();
        this.ebayScraper = new EbaySoldListingsScraper();
        
        // Price confidence thresholds
        this.confidenceThresholds = {
            high: 0.8,      // 80%+ sources agree
            medium: 0.6,    // 60%+ sources agree
            low: 0.4        // 40%+ sources agree
        };
        
        // Initialize price database
        this.priceDB = new Map();
        this.alertThresholds = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎯 Initializing Unified Price Service...');
        await this.loadPriceDatabase();
    }
    
    // ==================== MAIN PRICE FUNCTION ====================
    
    async getAuthoritativePrice(cardName, setName = null, options = {}) {
        const {
            condition = 'NM',
            includeGraded = false,
            urgency = 'normal' // 'urgent' for hot cards, 'lazy' for background updates
        } = options;
        
        console.log(`💰 Fetching authoritative price for: ${cardName} ${setName || ''}`);
        
        // Check if we need fresh data
        const cacheAge = urgency === 'urgent' ? 60000 : 300000; // 1 min for urgent, 5 min normal
        const cached = this.getCachedPrice(cardName, setName, condition);
        
        if (cached && Date.now() - cached.timestamp < cacheAge) {
            return cached;
        }
        
        // Gather prices from all sources
        const prices = await this.gatherAllPrices(cardName, setName, condition);
        
        // Analyze and combine prices
        const analysis = this.analyzePrices(prices);
        
        // Generate final authoritative price
        const authoritativePrice = {
            cardName: cardName,
            setName: setName,
            condition: condition,
            
            // Main prices
            market: analysis.consensus,
            low: analysis.low,
            high: analysis.high,
            median: analysis.median,
            
            // Trend data
            trend: analysis.trend,
            momentum: analysis.momentum,
            volatility: analysis.volatility,
            
            // Confidence metrics
            confidence: analysis.confidence,
            dataPoints: analysis.dataPoints,
            sources: analysis.sources,
            
            // Recommendations
            recommendation: this.generateRecommendation(analysis),
            alerts: this.checkAlerts(cardName, analysis),
            
            // Metadata
            timestamp: Date.now(),
            nextUpdate: Date.now() + cacheAge
        };
        
        // Store in cache
        this.updateCache(cardName, setName, condition, authoritativePrice);
        
        // Log significant changes
        await this.logPriceMovement(cardName, authoritativePrice);
        
        return authoritativePrice;
    }
    
    // ==================== DATA GATHERING ====================
    
    async gatherAllPrices(cardName, setName, condition) {
        const prices = {
            tcgplayer: null,
            ebay: null,
            local: null,
            historical: null
        };
        
        // Parallel fetch from all sources
        const [tcgData, ebayData, localData, historicalData] = await Promise.allSettled([
            this.tcgScraper.searchCard(cardName, setName),
            this.ebayScraper.getSoldListings(cardName, setName, condition),
            this.aggregator.getCurrentPrice(cardName, setName, condition),
            this.getHistoricalPrice(cardName, setName)
        ]);
        
        // Process TCGPlayer data
        if (tcgData.status === 'fulfilled' && tcgData.value) {
            prices.tcgplayer = {
                market: tcgData.value.prices?.market || 0,
                low: tcgData.value.prices?.low || 0,
                mid: tcgData.value.prices?.mid || 0,
                high: tcgData.value.prices?.high || 0,
                source: 'tcgplayer',
                weight: 0.35
            };
        }
        
        // Process eBay data
        if (ebayData.status === 'fulfilled' && ebayData.value) {
            prices.ebay = {
                market: ebayData.value.analysis?.filteredAverage || 0,
                low: ebayData.value.analysis?.low || 0,
                median: ebayData.value.analysis?.median || 0,
                high: ebayData.value.analysis?.high || 0,
                trend: ebayData.value.analysis?.trend || 'unknown',
                dataPoints: ebayData.value.analysis?.count || 0,
                source: 'ebay',
                weight: 0.30
            };
        }
        
        // Process local data
        if (localData.status === 'fulfilled' && localData.value) {
            prices.local = {
                market: localData.value.price || 0,
                confidence: localData.value.confidence || 0,
                source: 'local',
                weight: 0.20
            };
        }
        
        // Process historical data
        if (historicalData.status === 'fulfilled' && historicalData.value) {
            prices.historical = {
                average: historicalData.value.average || 0,
                trend: historicalData.value.trend || 'stable',
                support: historicalData.value.support || 0,
                resistance: historicalData.value.resistance || 0,
                source: 'historical',
                weight: 0.15
            };
        }
        
        return prices;
    }
    
    // ==================== PRICE ANALYSIS ====================
    
    analyzePrices(prices) {
        const validPrices = [];
        const sources = [];
        let totalWeight = 0;
        let weightedSum = 0;
        
        // Collect valid prices
        Object.entries(prices).forEach(([source, data]) => {
            if (data && data.market > 0) {
                validPrices.push(data.market);
                sources.push(source);
                weightedSum += data.market * data.weight;
                totalWeight += data.weight;
            }
        });
        
        if (validPrices.length === 0) {
            return {
                consensus: 0,
                confidence: 'none',
                dataPoints: 0
            };
        }
        
        // Calculate statistics
        const sorted = validPrices.sort((a, b) => a - b);
        const consensus = totalWeight > 0 ? weightedSum / totalWeight : 0;
        const median = sorted[Math.floor(sorted.length / 2)];
        const low = sorted[0];
        const high = sorted[sorted.length - 1];
        
        // Calculate volatility
        const range = high - low;
        const volatility = consensus > 0 ? (range / consensus) * 100 : 0;
        
        // Determine trend
        let trend = 'stable';
        let momentum = 0;
        
        if (prices.ebay?.trend) {
            trend = prices.ebay.trend;
        }
        
        if (prices.historical) {
            momentum = ((consensus - prices.historical.average) / prices.historical.average) * 100;
        }
        
        // Calculate confidence
        let confidence = 'low';
        if (sources.length >= 3 && volatility < 20) {
            confidence = 'high';
        } else if (sources.length >= 2 && volatility < 30) {
            confidence = 'medium';
        }
        
        // Add eBay data points for extra confidence
        if (prices.ebay?.dataPoints > 10) {
            confidence = 'high';
        }
        
        return {
            consensus: Math.round(consensus * 100) / 100,
            median: Math.round(median * 100) / 100,
            low: Math.round(low * 100) / 100,
            high: Math.round(high * 100) / 100,
            trend: trend,
            momentum: Math.round(momentum * 100) / 100,
            volatility: Math.round(volatility * 100) / 100,
            confidence: confidence,
            dataPoints: prices.ebay?.dataPoints || validPrices.length,
            sources: sources
        };
    }
    
    // ==================== RECOMMENDATIONS ====================
    
    generateRecommendation(analysis) {
        const { consensus, trend, momentum, volatility, confidence } = analysis;
        
        // Don't make recommendations with low confidence
        if (confidence === 'low' || confidence === 'none') {
            return {
                action: 'wait',
                reason: 'Insufficient data for accurate recommendation',
                confidence: confidence
            };
        }
        
        // High volatility warning
        if (volatility > 40) {
            return {
                action: 'caution',
                reason: `High volatility (${volatility.toFixed(0)}%) - prices unstable`,
                confidence: confidence
            };
        }
        
        // Trend-based recommendations
        if (trend === 'hot' || (trend === 'rising' && momentum > 15)) {
            return {
                action: 'sell',
                reason: `Strong upward trend (+${momentum.toFixed(0)}%) - good selling opportunity`,
                target: consensus * 1.1,
                confidence: confidence
            };
        }
        
        if (trend === 'cooling' || (trend === 'falling' && momentum < -15)) {
            return {
                action: 'buy',
                reason: `Downward trend (${momentum.toFixed(0)}%) - potential buying opportunity`,
                target: consensus * 0.9,
                confidence: confidence
            };
        }
        
        if (Math.abs(momentum) < 5 && volatility < 15) {
            return {
                action: 'hold',
                reason: 'Stable price with low volatility',
                confidence: confidence
            };
        }
        
        // Default
        return {
            action: 'monitor',
            reason: `Moderate activity - ${trend} trend with ${momentum.toFixed(0)}% change`,
            confidence: confidence
        };
    }
    
    // ==================== ALERTS ====================
    
    checkAlerts(cardName, analysis) {
        const alerts = [];
        
        // Check for significant price movements
        if (Math.abs(analysis.momentum) > 20) {
            alerts.push({
                type: 'price_movement',
                severity: 'high',
                message: `${cardName} ${analysis.momentum > 0 ? 'up' : 'down'} ${Math.abs(analysis.momentum).toFixed(0)}%`,
                value: analysis.consensus
            });
        }
        
        // Check for high volatility
        if (analysis.volatility > 30) {
            alerts.push({
                type: 'volatility',
                severity: 'medium',
                message: `High price volatility detected (${analysis.volatility.toFixed(0)}%)`,
                range: `$${analysis.low} - $${analysis.high}`
            });
        }
        
        // Check for trend changes
        if (analysis.trend === 'hot' || analysis.trend === 'cooling') {
            alerts.push({
                type: 'trend_change',
                severity: 'medium',
                message: `Market ${analysis.trend} detected`,
                recommendation: this.generateRecommendation(analysis).action
            });
        }
        
        // Check custom alert thresholds
        const threshold = this.alertThresholds.get(cardName);
        if (threshold) {
            if (analysis.consensus >= threshold.high) {
                alerts.push({
                    type: 'threshold',
                    severity: 'high',
                    message: `${cardName} reached target price of $${threshold.high}`,
                    action: 'sell'
                });
            }
            if (analysis.consensus <= threshold.low) {
                alerts.push({
                    type: 'threshold',
                    severity: 'high',
                    message: `${cardName} dropped to buy target of $${threshold.low}`,
                    action: 'buy'
                });
            }
        }
        
        return alerts;
    }
    
    // ==================== ALERT MANAGEMENT ====================
    
    setAlert(cardName, lowThreshold, highThreshold) {
        this.alertThresholds.set(cardName, {
            low: lowThreshold,
            high: highThreshold,
            created: Date.now()
        });
        
        console.log(`🔔 Alert set for ${cardName}: Buy at $${lowThreshold}, Sell at $${highThreshold}`);
    }
    
    // ==================== HISTORICAL DATA ====================
    
    async getHistoricalPrice(cardName, setName) {
        // Get from aggregator's historical data
        const trends = await this.aggregator.detectTrends(cardName, setName);
        
        return {
            average: trends.support ? (trends.support + trends.resistance) / 2 : 0,
            trend: trends.trend,
            support: trends.support,
            resistance: trends.resistance,
            change: trends.change
        };
    }
    
    // ==================== CACHE MANAGEMENT ====================
    
    getCachedPrice(cardName, setName, condition) {
        const key = this.generateCacheKey(cardName, setName, condition);
        return this.priceDB.get(key);
    }
    
    updateCache(cardName, setName, condition, priceData) {
        const key = this.generateCacheKey(cardName, setName, condition);
        this.priceDB.set(key, priceData);
    }
    
    generateCacheKey(cardName, setName, condition) {
        return `${cardName}_${setName || 'any'}_${condition}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    
    // ==================== LOGGING ====================
    
    async logPriceMovement(cardName, priceData) {
        if (Math.abs(priceData.momentum) > 10) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                card: cardName,
                price: priceData.market,
                change: priceData.momentum,
                trend: priceData.trend,
                alerts: priceData.alerts
            };
            
            const logPath = path.join(__dirname, '../logs', `price-movements-${new Date().toISOString().split('T')[0]}.json`);
            
            try {
                let logs = [];
                try {
                    const existing = await fs.readFile(logPath, 'utf8');
                    logs = JSON.parse(existing);
                } catch {}
                
                logs.push(logEntry);
                await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
            } catch (error) {
                console.error('Error logging price movement:', error);
            }
        }
    }
    
    // ==================== DATABASE ====================
    
    async loadPriceDatabase() {
        try {
            const dbPath = path.join(__dirname, '../data', 'unified-price-db.json');
            const data = await fs.readFile(dbPath, 'utf8');
            const parsed = JSON.parse(data);
            
            Object.entries(parsed).forEach(([key, value]) => {
                this.priceDB.set(key, value);
            });
            
            console.log(`📊 Loaded ${this.priceDB.size} cached prices`);
        } catch {
            console.log('📊 Starting with empty price database');
        }
    }
    
    async savePriceDatabase() {
        const dbPath = path.join(__dirname, '../data', 'unified-price-db.json');
        const data = {};
        
        this.priceDB.forEach((value, key) => {
            data[key] = value;
        });
        
        await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
    }
    
    // ==================== CLEANUP ====================
    
    async shutdown() {
        await this.savePriceDatabase();
        await this.tcgScraper.close();
        await this.ebayScraper.close();
        console.log('✅ Unified Price Service shut down cleanly');
    }
}

module.exports = UnifiedPriceService;