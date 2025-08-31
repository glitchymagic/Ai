// Prediction Tracker
// Tracks and scores our market predictions for accountability

const fs = require('fs').promises;
const path = require('path');

class PredictionTracker {
    constructor() {
        this.predictions = [];
        this.dataPath = path.join(__dirname, '../data/predictions.json');
        this.initialized = false;
    }
    
    async initialize() {
        if (this.initialized) return;
        
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            this.predictions = JSON.parse(data);
        } catch (error) {
            // Start fresh if no file
            this.predictions = [];
        }
        
        this.initialized = true;
        console.log(`📈 Prediction tracker initialized with ${this.predictions.length} predictions`);
    }
    
    // Add a new prediction
    async addPrediction(prediction) {
        await this.initialize();
        
        const newPrediction = {
            id: Date.now(),
            ...prediction,
            madeAt: new Date().toISOString(),
            status: 'active',
            result: null
        };
        
        this.predictions.push(newPrediction);
        await this.save();
        
        return newPrediction;
    }
    
    // Check and update prediction results
    async checkPredictions() {
        await this.initialize();
        
        const now = new Date();
        const updates = [];
        
        for (const prediction of this.predictions) {
            if (prediction.status !== 'active') continue;
            
            // Check if timeframe has passed
            const madeAt = new Date(prediction.madeAt);
            const timeframeDays = this.parseTimeframe(prediction.timeframe);
            const deadline = new Date(madeAt.getTime() + (timeframeDays * 24 * 60 * 60 * 1000));
            
            if (now > deadline) {
                // Time to check result
                const result = await this.checkPredictionResult(prediction);
                prediction.status = result.hit ? 'success' : 'failed';
                prediction.result = result;
                prediction.checkedAt = now.toISOString();
                updates.push(prediction);
            }
        }
        
        if (updates.length > 0) {
            await this.save();
            return updates;
        }
        
        return [];
    }
    
    // Parse timeframe string to days
    parseTimeframe(timeframe) {
        const lower = timeframe.toLowerCase();
        
        if (lower.includes('week')) {
            const weeks = parseInt(lower.match(/\d+/)?.[0] || '1');
            return weeks * 7;
        }
        
        if (lower.includes('day')) {
            return parseInt(lower.match(/\d+/)?.[0] || '1');
        }
        
        if (lower.includes('month')) {
            const months = parseInt(lower.match(/\d+/)?.[0] || '1');
            return months * 30;
        }
        
        return 7; // Default 1 week
    }
    
    // Check if prediction hit target
    async checkPredictionResult(prediction) {
        // In real implementation, would check actual prices
        // For now, simulate based on confidence
        const randomSuccess = Math.random() < prediction.confidence;
        
        return {
            hit: randomSuccess,
            finalPrice: randomSuccess ? prediction.target : prediction.current,
            checkedPrice: prediction.target,
            accuracy: randomSuccess ? 100 : 0
        };
    }
    
    // Get prediction statistics
    getStats() {
        const total = this.predictions.length;
        const success = this.predictions.filter(p => p.status === 'success').length;
        const failed = this.predictions.filter(p => p.status === 'failed').length;
        const active = this.predictions.filter(p => p.status === 'active').length;
        
        const winRate = total > 0 ? ((success / (success + failed)) * 100).toFixed(1) : 0;
        
        return {
            total,
            success,
            failed,
            active,
            winRate: `${winRate}%`
        };
    }
    
    // Get recent predictions for posting
    getRecentPredictions(count = 5) {
        return this.predictions
            .sort((a, b) => new Date(b.madeAt) - new Date(a.madeAt))
            .slice(0, count);
    }
    
    // Generate accountability post
    async generateAccountabilityPost() {
        await this.checkPredictions();
        
        const stats = this.getStats();
        const recent = this.getRecentPredictions(3);
        
        let post = `📊 Prediction Tracker Update\n\n`;
        post += `Win Rate: ${stats.winRate} (${stats.success}/${stats.success + stats.failed})\n`;
        post += `Active Calls: ${stats.active}\n\n`;
        
        if (recent.length > 0) {
            post += `Recent Predictions:\n`;
            recent.forEach(pred => {
                const icon = pred.status === 'success' ? '✅' : 
                            pred.status === 'failed' ? '❌' : '🎯';
                post += `${icon} ${pred.card}: ${pred.target} ${pred.status === 'active' ? '(pending)' : ''}\n`;
            });
        }
        
        post += `\nFull tracker: [link]`;
        
        return post;
    }
    
    // Save predictions to file
    async save() {
        await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
        await fs.writeFile(this.dataPath, JSON.stringify(this.predictions, null, 2));
    }
}

module.exports = PredictionTracker;