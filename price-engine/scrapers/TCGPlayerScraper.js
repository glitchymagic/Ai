// TCGPlayer Price Scraper
// Fetches real-time prices from TCGPlayer for Pokemon cards

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

class TCGPlayerScraper {
    constructor() {
        this.baseUrl = 'https://www.tcgplayer.com';
        this.browser = null;
        this.page = null;
        this.cache = new Map();
        this.cacheExpiry = 300000; // 5 minutes
        this.rateLimitDelay = 2000; // 2 seconds between requests
        this.lastRequestTime = 0;
    }
    
    async initialize() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            
            this.page = await this.browser.newPage();
            
            // Set realistic viewport
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            // Set user agent
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        }
    }
    
    async searchCard(cardName, setName = null) {
        await this.initialize();
        await this.respectRateLimit();
        
        // Check cache first
        const cacheKey = `${cardName}_${setName || 'any'}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        try {
            // Build search URL
            const searchQuery = encodeURIComponent(`${cardName} ${setName || ''} pokemon`);
            const searchUrl = `${this.baseUrl}/search/all/product?q=${searchQuery}&view=grid`;
            
            console.log(`🔍 Searching TCGPlayer for: ${cardName} ${setName || ''}`);
            
            // Navigate to search page
            await this.page.goto(searchUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            // Wait for results to load
            await this.page.waitForSelector('.search-result__content', { timeout: 10000 }).catch(() => {});
            
            // Extract card data
            const results = await this.page.evaluate(() => {
                const cards = [];
                const items = document.querySelectorAll('.search-result');
                
                items.forEach((item, index) => {
                    if (index >= 5) return; // Limit to top 5 results
                    
                    const nameEl = item.querySelector('.search-result__title');
                    const setEl = item.querySelector('.search-result__subtitle');
                    const priceEl = item.querySelector('.search-result__market-price__value');
                    const linkEl = item.querySelector('a');
                    
                    if (nameEl && priceEl) {
                        cards.push({
                            name: nameEl.textContent.trim(),
                            set: setEl ? setEl.textContent.trim() : 'Unknown',
                            marketPrice: priceEl.textContent.trim(),
                            url: linkEl ? linkEl.href : null
                        });
                    }
                });
                
                return cards;
            });
            
            // Find best match
            const bestMatch = this.findBestMatch(results, cardName, setName);
            
            if (bestMatch) {
                // Get detailed prices
                const detailedPrices = await this.getDetailedPrices(bestMatch.url);
                
                const priceData = {
                    cardName: bestMatch.name,
                    setName: bestMatch.set,
                    prices: {
                        market: this.parsePrice(bestMatch.marketPrice),
                        ...detailedPrices
                    },
                    url: bestMatch.url,
                    timestamp: new Date().toISOString(),
                    source: 'tcgplayer'
                };
                
                // Cache the result
                this.addToCache(cacheKey, priceData);
                
                return priceData;
            }
            
            return null;
            
        } catch (error) {
            console.error(`Error searching TCGPlayer for ${cardName}:`, error.message);
            return null;
        }
    }
    
    async getDetailedPrices(url) {
        if (!url) return {};
        
        try {
            await this.page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            // Wait for price table
            await this.page.waitForSelector('.price-point__data', { timeout: 5000 }).catch(() => {});
            
            // Extract detailed prices
            const prices = await this.page.evaluate(() => {
                const priceData = {};
                
                // Market price
                const marketEl = document.querySelector('.price-guide__market-price');
                if (marketEl) {
                    priceData.market = marketEl.textContent.trim();
                }
                
                // Low, mid, high prices
                const pricePoints = document.querySelectorAll('.price-point');
                pricePoints.forEach(point => {
                    const label = point.querySelector('.price-point__label');
                    const value = point.querySelector('.price-point__data');
                    
                    if (label && value) {
                        const key = label.textContent.toLowerCase().trim();
                        priceData[key] = value.textContent.trim();
                    }
                });
                
                // Recent sales
                const salesElements = document.querySelectorAll('.latest-sales__item');
                const recentSales = [];
                
                salesElements.forEach((sale, index) => {
                    if (index >= 5) return; // Limit to 5 recent sales
                    
                    const priceEl = sale.querySelector('.latest-sales__price');
                    const dateEl = sale.querySelector('.latest-sales__date');
                    const conditionEl = sale.querySelector('.latest-sales__condition');
                    
                    if (priceEl) {
                        recentSales.push({
                            price: priceEl.textContent.trim(),
                            date: dateEl ? dateEl.textContent.trim() : null,
                            condition: conditionEl ? conditionEl.textContent.trim() : null
                        });
                    }
                });
                
                if (recentSales.length > 0) {
                    priceData.recentSales = recentSales;
                }
                
                return priceData;
            });
            
            return prices;
            
        } catch (error) {
            console.error('Error getting detailed prices:', error.message);
            return {};
        }
    }
    
    async getBulkPrices(cards) {
        const results = [];
        
        for (const card of cards) {
            const priceData = await this.searchCard(card.name, card.set);
            results.push({
                ...card,
                priceData: priceData
            });
            
            // Small delay between requests
            await this.delay(1000);
        }
        
        return results;
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    findBestMatch(results, targetName, targetSet) {
        if (!results || results.length === 0) return null;
        
        const cleanTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Find exact match first
        for (const result of results) {
            const cleanResult = result.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanResult.includes(cleanTarget)) {
                // If set is specified, check set match too
                if (targetSet) {
                    const cleanTargetSet = targetSet.toLowerCase();
                    const cleanResultSet = result.set.toLowerCase();
                    if (cleanResultSet.includes(cleanTargetSet)) {
                        return result;
                    }
                } else {
                    return result;
                }
            }
        }
        
        // Return first result if no exact match
        return results[0];
    }
    
    parsePrice(priceString) {
        if (!priceString) return 0;
        
        // Remove currency symbols and convert to number
        const cleaned = priceString.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
    }
    
    async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await this.delay(this.rateLimitDelay - timeSinceLastRequest);
        }
        
        this.lastRequestTime = Date.now();
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ==================== CACHE MANAGEMENT ====================
    
    getFromCache(key) {
        const cached = this.cache.get(key);
        
        if (cached) {
            const age = Date.now() - cached.cachedAt;
            if (age < this.cacheExpiry) {
                console.log(`✅ Using cached price for: ${key}`);
                return cached.data;
            }
        }
        
        return null;
    }
    
    addToCache(key, data) {
        this.cache.set(key, {
            data: data,
            cachedAt: Date.now()
        });
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    // ==================== CLEANUP ====================
    
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}

module.exports = TCGPlayerScraper;