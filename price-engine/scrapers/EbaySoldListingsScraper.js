// eBay Sold Listings Analyzer
// Analyzes recently sold Pokemon cards on eBay for accurate market prices

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

class EbaySoldListingsScraper {
    constructor() {
        this.baseUrl = 'https://www.ebay.com';
        this.browser = null;
        this.page = null;
        this.cache = new Map();
        this.cacheExpiry = 600000; // 10 minutes
    }
    
    async initialize() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'
                ]
            });
            
            this.page = await this.browser.newPage();
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            // Avoid detection
            await this.page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => false,
                });
            });
        }
    }
    
    async getSoldListings(cardName, setName = null, condition = 'Near Mint') {
        await this.initialize();
        
        // Check cache
        const cacheKey = `${cardName}_${setName}_${condition}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        try {
            // Build search query
            const searchTerms = [
                cardName,
                setName,
                'Pokemon TCG',
                condition === 'Near Mint' ? 'NM' : condition
            ].filter(Boolean).join(' ');
            
            const searchUrl = `${this.baseUrl}/sch/i.html?_nkw=${encodeURIComponent(searchTerms)}&LH_Sold=1&LH_Complete=1&_sop=13`;
            
            console.log(`🔍 Searching eBay sold listings for: ${cardName}`);
            
            // Navigate to search results
            await this.page.goto(searchUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            // Wait for results
            await this.page.waitForSelector('.s-item', { timeout: 10000 }).catch(() => {});
            
            // Extract sold listing data
            const listings = await this.page.evaluate(() => {
                const items = [];
                const elements = document.querySelectorAll('.s-item');
                
                elements.forEach((element, index) => {
                    if (index === 0) return; // Skip first (usually an ad)
                    if (index > 20) return; // Limit to 20 results
                    
                    const titleEl = element.querySelector('.s-item__title');
                    const priceEl = element.querySelector('.s-item__price');
                    const dateEl = element.querySelector('.s-item__title--tag__COMPLETED');
                    const shippingEl = element.querySelector('.s-item__shipping');
                    const linkEl = element.querySelector('.s-item__link');
                    const imageEl = element.querySelector('.s-item__image-img');
                    
                    if (titleEl && priceEl) {
                        const title = titleEl.textContent.trim();
                        const priceText = priceEl.textContent.trim();
                        
                        // Extract price value
                        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
                        const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : null;
                        
                        if (price) {
                            items.push({
                                title: title,
                                price: price,
                                priceText: priceText,
                                date: dateEl ? dateEl.textContent.trim() : 'Recent',
                                shipping: shippingEl ? shippingEl.textContent.trim() : 'Unknown',
                                url: linkEl ? linkEl.href : null,
                                image: imageEl ? imageEl.src : null
                            });
                        }
                    }
                });
                
                return items;
            });
            
            // Filter for relevant listings
            const relevantListings = this.filterRelevantListings(listings, cardName, setName);
            
            // Calculate statistics
            const analysis = this.analyzeSoldListings(relevantListings);
            
            const result = {
                cardName: cardName,
                setName: setName,
                condition: condition,
                listings: relevantListings,
                analysis: analysis,
                timestamp: new Date().toISOString(),
                source: 'ebay'
            };
            
            // Cache result
            this.addToCache(cacheKey, result);
            
            return result;
            
        } catch (error) {
            console.error(`Error fetching eBay sold listings:`, error.message);
            return null;
        }
    }
    
    filterRelevantListings(listings, cardName, setName) {
        const cleanCardName = cardName.toLowerCase();
        const cleanSetName = setName ? setName.toLowerCase() : '';
        
        return listings.filter(listing => {
            const title = listing.title.toLowerCase();
            
            // Must contain card name
            if (!title.includes(cleanCardName)) return false;
            
            // If set specified, should contain set name
            if (cleanSetName && !title.includes(cleanSetName)) return false;
            
            // Filter out lots/bundles
            if (title.includes('lot') || title.includes('bundle') || title.includes('x10') || title.includes('pack')) {
                return false;
            }
            
            // Filter out graded unless specifically looking for them
            if (title.includes('psa') || title.includes('bgs') || title.includes('cgc')) {
                // For now, skip graded cards unless we add graded support
                return false;
            }
            
            return true;
        });
    }
    
    analyzeSoldListings(listings) {
        if (!listings || listings.length === 0) {
            return {
                count: 0,
                average: 0,
                median: 0,
                low: 0,
                high: 0,
                trend: 'insufficient data'
            };
        }
        
        const prices = listings.map(l => l.price).sort((a, b) => a - b);
        const count = prices.length;
        const sum = prices.reduce((a, b) => a + b, 0);
        const average = sum / count;
        
        // Calculate median
        let median;
        if (count % 2 === 0) {
            median = (prices[count / 2 - 1] + prices[count / 2]) / 2;
        } else {
            median = prices[Math.floor(count / 2)];
        }
        
        // Remove outliers (prices outside 1.5 * IQR)
        const q1 = prices[Math.floor(count * 0.25)];
        const q3 = prices[Math.floor(count * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - (1.5 * iqr);
        const upperBound = q3 + (1.5 * iqr);
        
        const filteredPrices = prices.filter(p => p >= lowerBound && p <= upperBound);
        const filteredAverage = filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length;
        
        // Determine trend
        let trend = 'stable';
        if (listings.length >= 5) {
            const recentAvg = listings.slice(0, 3).reduce((a, b) => a + b.price, 0) / 3;
            const olderAvg = listings.slice(-3).reduce((a, b) => a + b.price, 0) / 3;
            const change = ((recentAvg - olderAvg) / olderAvg) * 100;
            
            if (change > 5) trend = 'rising';
            if (change > 15) trend = 'hot';
            if (change < -5) trend = 'falling';
            if (change < -15) trend = 'cooling';
        }
        
        return {
            count: count,
            average: Math.round(average * 100) / 100,
            median: Math.round(median * 100) / 100,
            filteredAverage: Math.round(filteredAverage * 100) / 100,
            low: prices[0],
            high: prices[prices.length - 1],
            q1: q1,
            q3: q3,
            trend: trend,
            confidence: this.calculateConfidence(count)
        };
    }
    
    calculateConfidence(sampleSize) {
        if (sampleSize >= 20) return 'high';
        if (sampleSize >= 10) return 'medium';
        if (sampleSize >= 5) return 'low';
        return 'very low';
    }
    
    async getRecentSales(cardName, hours = 24) {
        const listings = await this.getSoldListings(cardName);
        
        if (!listings || !listings.listings) return [];
        
        // Filter for recent sales (this is approximate as eBay doesn't show exact times)
        const recent = listings.listings.filter(listing => {
            const dateText = listing.date.toLowerCase();
            if (dateText.includes('hour') || dateText.includes('today')) {
                return true;
            }
            if (dateText.includes('1 day') && hours >= 24) {
                return true;
            }
            return false;
        });
        
        return recent;
    }
    
    async compareConditions(cardName, setName) {
        const conditions = ['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played'];
        const results = {};
        
        for (const condition of conditions) {
            const data = await this.getSoldListings(cardName, setName, condition);
            if (data && data.analysis) {
                results[condition] = {
                    average: data.analysis.filteredAverage || data.analysis.average,
                    count: data.analysis.count,
                    trend: data.analysis.trend
                };
            }
            
            // Small delay between requests
            await this.delay(2000);
        }
        
        return results;
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getFromCache(key) {
        const cached = this.cache.get(key);
        
        if (cached) {
            const age = Date.now() - cached.cachedAt;
            if (age < this.cacheExpiry) {
                console.log(`✅ Using cached eBay data for: ${key}`);
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
    
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}

module.exports = EbaySoldListingsScraper;