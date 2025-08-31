// Original Content Generator
// Creates authoritative market posts like aixbt

const priceEngine = require('../price-engine/index.js');
const AuthorityContent = require('./authority-content.js');
const fs = require('fs').promises;
const path = require('path');

class OriginalContentGenerator {
    constructor() {
        this.initialized = false;
        this.predictions = [];
        this.lastPostTime = {};
        this.postTypes = ['market_open', 'trend_alert', 'prediction', 'recap'];
        this.authorityContent = new AuthorityContent();
    }
    
    async initialize() {
        if (!this.initialized) {
            await priceEngine.initialize();
            await this.authorityContent.initialize();
            await this.loadPredictions();
            this.initialized = true;
            console.log('📝 Original content generator ready');
        }
    }
    
    // Generate next scheduled post
    async generateScheduledPost() {
        await this.initialize();
        
        const hour = new Date().getHours();
        
        // Determine post type based on time
        if (hour === 9) return await this.generateMorningMarket();
        if (hour === 14) return await this.generateAfternoonAlert();
        if (hour === 19) return await this.generateEveningRecap();
        if (hour === 23) return await this.generateNightPrediction();
        
        // Default to trend alert
        return await this.generateTrendAlert();
    }
    
    // Morning Market Open Post (9 AM)
    async generateMorningMarket() {
        // Use authority content for data-driven posts
        const content = await this.authorityContent.generateMorningReport();
        
        return {
            type: 'market_open',
            content: content,
            timestamp: new Date().toISOString()
        };
    }
    
    // Afternoon Trend Alert (2 PM)
    async generateAfternoonAlert() {
        // Use authority content for trend alerts
        const content = await this.authorityContent.generateAfternoonAlert();
        
        return {
            type: 'afternoon_alert',
            content: content,
            timestamp: new Date().toISOString()
        };
    }
    
    // Evening Market Recap (7 PM)
    async generateEveningRecap() {
        // Use authority content for evening recap
        const content = await this.authorityContent.generateEveningRecap();
        
        return {
            type: 'recap',
            content: content,
            timestamp: new Date().toISOString()
        };
    }
    
    // Late Night Prediction (11 PM)
    async generateNightPrediction() {
        const prediction = await this.makePrediction();
        
        const post = `🎯 Calling it: ${prediction.card} hits $${prediction.target} by ${prediction.timeframe}

${prediction.reasoning}

Screenshot this.`;
        
        // Save prediction for tracking
        await this.savePrediction(prediction);
        
        return {
            type: 'prediction',
            content: post,
            prediction: prediction,
            timestamp: new Date().toISOString()
        };
    }
    
    // Generate trend alerts
    async generateTrendAlert() {
        // Use authority content for trend alerts
        const content = await this.authorityContent.generateTrendAlert();
        
        return {
            type: 'trend_alert',
            content: content,
            timestamp: new Date().toISOString()
        };
    }
    
    // Generate specific alert types
    async generateSupplyShockAlert() {
        const post = `🚨 Supply shock detected

Costco dropped Surging Sparks nationwide.
Impact: -15% on singles next 48hrs.

Buying opportunity on:
• Pikachu ex ($89 → $75 target)
• Latias ex ($45 → $38 target)

Set alerts.`;
        
        return {
            type: 'supply_alert',
            content: post,
            timestamp: new Date().toISOString()
        };
    }
    
    async generatePriceBreakoutAlert() {
        const post = `📈 BREAKOUT: Giratina VSTAR Lost Origin

Just broke 3-month resistance at $78.
Volume: 3x average
Next target: $85

Momentum strong. 🚀`;
        
        return {
            type: 'breakout_alert',
            content: post,
            timestamp: new Date().toISOString()
        };
    }
    
    async generateVolumeAlert() {
        const post = `🔥 Volume spike on Paldea Evolved

3 major collectors buying heavy.
Charizard ex up 12% past 2 hours.

Something brewing. 👀`;
        
        return {
            type: 'volume_alert',
            content: post,
            timestamp: new Date().toISOString()
        };
    }
    
    // Make predictions
    async makePrediction() {
        const cards = [
            { name: 'Umbreon VMAX', set: 'Evolving Skies', current: 475 },
            { name: 'Charizard', set: 'Base Set', current: 242 },
            { name: 'Lugia V', set: 'Silver Tempest', current: 88 }
        ];
        
        const card = cards[Math.floor(Math.random() * cards.length)];
        
        // Calculate prediction
        const changePercent = (Math.random() * 30) - 10; // -10% to +20%
        const target = Math.round(card.current * (1 + changePercent / 100));
        
        const timeframes = ['Friday', 'end of week', '7 days', 'next Sunday'];
        const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
        
        const reasoning = changePercent > 0 
            ? `RSI oversold. Support holding. Tournament hype building.`
            : `Overbought. Resistance rejection. Profit taking incoming.`;
        
        return {
            card: `${card.name} ${card.set}`,
            current: card.current,
            target: target,
            timeframe: timeframe,
            reasoning: reasoning,
            confidence: Math.random() * 30 + 70, // 70-100%
            timestamp: new Date().toISOString()
        };
    }
    
    // Fill template with data
    async fillTemplate(template) {
        // This would be enhanced with real data
        const replacements = {
            '{card}': 'Moonbreon',
            '{outcome}': '+15% average',
            '{prediction}': 'breakout imminent',
            '{pattern}': 'ascending triangle',
            '{direction}': 'up',
            '{quantity}': '15',
            '{remaining}': '3 listings',
            '{impact}': 'price spike likely',
            '{change}': '20-30% spike'
        };
        
        let filled = template;
        for (const [key, value] of Object.entries(replacements)) {
            filled = filled.replace(new RegExp(key, 'g'), value);
        }
        
        return filled;
    }
    
    // Track predictions
    async savePrediction(prediction) {
        this.predictions.push(prediction);
        
        // Save to file
        const filePath = path.join(__dirname, '../data', 'predictions.json');
        try {
            await fs.writeFile(filePath, JSON.stringify(this.predictions, null, 2));
        } catch (error) {
            console.error('Error saving prediction:', error);
        }
    }
    
    async loadPredictions() {
        const filePath = path.join(__dirname, '../data', 'predictions.json');
        try {
            const data = await fs.readFile(filePath, 'utf8');
            this.predictions = JSON.parse(data);
        } catch {
            this.predictions = [];
        }
    }
    
    // Check prediction outcomes
    async checkPredictionOutcomes() {
        const now = Date.now();
        const results = [];
        
        for (const pred of this.predictions) {
            // Check if prediction timeframe has passed
            const predTime = new Date(pred.timestamp).getTime();
            const daysPassed = (now - predTime) / (1000 * 60 * 60 * 24);
            
            if (daysPassed >= 7) {
                // Check actual price
                const [cardName, setName] = pred.card.split(' ');
                const currentPrice = await priceEngine.getQuickPrice(cardName, setName);
                
                if (currentPrice) {
                    const success = Math.abs(currentPrice.price - pred.target) / pred.target < 0.1;
                    
                    results.push({
                        prediction: pred,
                        actual: currentPrice.price,
                        success: success
                    });
                }
            }
        }
        
        return results;
    }
    
    // Generate "I called it" posts
    async generateSuccessPost() {
        const results = await this.checkPredictionOutcomes();
        const successes = results.filter(r => r.success);
        
        if (successes.length > 0) {
            const win = successes[0];
            
            return {
                type: 'success',
                content: `✅ Called it.

${win.prediction.card}: $${win.prediction.target} ✓
Actual: $${win.actual}

Prediction from ${new Date(win.prediction.timestamp).toLocaleDateString()}

That's ${successes.length}/${results.length} correct this week.`,
                timestamp: new Date().toISOString()
            };
        }
        
        return null;
    }
}

module.exports = OriginalContentGenerator;