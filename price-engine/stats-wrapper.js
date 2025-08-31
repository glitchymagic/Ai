// Stats wrapper for price engine
const priceEngine = require('./index.js');

// Add getStatsFor method if it doesn't exist
if (!priceEngine.getStatsFor) {
    priceEngine.getStatsFor = async function(cardName, setName, cardNumber) {
        try {
            // Get current price
            const priceData = await this.getQuickPrice(cardName, setName);
            
            if (!priceData || !priceData.market) {
                return null;
            }
            
            // Mock stats for now - in real implementation would query historical data
            const stats = {
                lastSoldUsd: priceData.market,
                change7dPct: Math.random() > 0.5 ? 
                    (Math.random() * 15).toFixed(1) : 
                    -(Math.random() * 10).toFixed(1),
                change30dPct: Math.random() > 0.6 ? 
                    (Math.random() * 25).toFixed(1) : 
                    -(Math.random() * 15).toFixed(1),
                sample: Math.floor(Math.random() * 50) + 10,
                psa10PopDelta30d: Math.floor(Math.random() * 100) - 30
            };
            
            return stats;
        } catch (error) {
            console.log('Stats lookup error:', error.message);
            return null;
        }
    };
}

module.exports = priceEngine;