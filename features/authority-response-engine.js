// Authority Response Engine
// Generates data-driven, authoritative responses using real price data
// This is what transforms the bot from "nice pull!" to market authority

class AuthorityResponseEngine {
    constructor(hotCardsTracker) {
        this.hotCards = hotCardsTracker;
        
        // Response confidence thresholds
        this.confidenceLevels = {
            veryHigh: 90,   // "Calling it now"
            high: 75,       // "Highly likely"
            medium: 60,     // "Possible movement"
            low: 40         // "Worth watching"
        };
    }
    
    // Main response generation
    async generateAuthorityResponse(context) {
        const { 
            cardName, 
            username,
            tweetContent,
            hasImages,
            isPriceQuestion,
            sentiment
        } = context;
        
        // Get price data if card is identified
        let priceData = null;
        if (cardName) {
            priceData = await this.hotCards.getPriceByName(cardName);
        }
        
        // Route to appropriate response type
        if (isPriceQuestion && priceData) {
            return this.generatePriceResponse(cardName, priceData);
        }
        
        if (hasImages && priceData) {
            return this.generatePullResponse(cardName, priceData, sentiment);
        }
        
        if (tweetContent && this.isMarketQuestion(tweetContent)) {
            return this.generateMarketInsight(tweetContent);
        }
        
        if (tweetContent && this.isPredictionRequest(tweetContent)) {
            return this.generatePrediction(cardName, priceData);
        }
        
        // Default to standard response if no price data
        return null;
    }
    
    // Price inquiry responses
    generatePriceResponse(cardName, priceData) {
        const { market, low, high, trend, volume24h } = priceData;
        
        // Format trend
        const trendStr = trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`;
        const trendEmoji = trend > 5 ? '📈' : trend < -5 ? '📉' : '➡️';
        
        // Different formats based on card value
        if (market > 200) {
            return `${cardName} ${trendEmoji} $${market} (${trendStr} 7d) · ` +
                   `Range: $${low}-${high} · ${volume24h || 'Low'} volume · ` +
                   this.getMarketContext(trend);
        } else {
            return `${cardName}: $${market} (${trendStr}) · ` +
                   `Recent sales: $${low}-${high}`;
        }
    }
    
    // Pull/showcase responses
    generatePullResponse(cardName, priceData, sentiment) {
        const { market, trend, volume24h } = priceData;
        const isPositiveTrend = trend > 0;
        const isHotCard = volume24h > 20;
        
        // High value pull (>$100)
        if (market > 100) {
            if (isPositiveTrend && trend > 10) {
                return `${cardName} is on fire! $${market}, up ${trend.toFixed(1)}% this week 🔥 ` +
                       `Seeing ${volume24h} sales/day. ${this.getPredictionSnippet(priceData)}`;
            } else if (trend < -10) {
                return `Solid pull! ${cardName} at $${market} finding support. ` +
                       `Down from recent highs but ${this.getSupportLevel(priceData)} holding`;
            } else {
                return `${cardName} holding steady at $${market}. ` +
                       `${isHotCard ? 'Active market' : 'Stable'} with ${volume24h || 'moderate'} volume`;
            }
        }
        
        // Mid-value pull ($20-100)
        if (market > 20) {
            if (isPositiveTrend) {
                return `Nice ${cardName}! Currently $${market} (${trend > 0 ? '+' : ''}${trend.toFixed(1)}% trend). ` +
                       `${this.getValueContext(market, trend)}`;
            } else {
                return `${cardName} at $${market}. ${this.getCollectorContext(priceData)}`;
            }
        }
        
        // Lower value but with context
        return `${cardName} tracking at $${market}. ${this.getPlayabilityContext(cardName)}`;
    }
    
    // Market insight responses
    async generateMarketInsight(tweetContent) {
        const movers = await this.hotCards.getTopMovers(3);
        
        if (tweetContent.includes('hot') || tweetContent.includes('moving')) {
            if (movers.gainers.length > 0) {
                const gainersText = movers.gainers.slice(0, 2).map(m => 
                    `${m.card.name} +${m.change.toFixed(1)}%`
                ).join(', ');
                const volumeText = movers.highVolume.length > 0 ? 
                    `. Volume spike on ${movers.highVolume[0].card.name}` : '';
                return `🔥 Today's movers: ${gainersText}${volumeText}`;
            }
            return '🔥 Market is quiet today. Good time to accumulate quality cards';
        }
        
        if (tweetContent.includes('crash') || tweetContent.includes('drop')) {
            const biggestDrop = movers.losers[0];
            if (biggestDrop) {
                return `Biggest dip: ${biggestDrop.card.name} ${biggestDrop.change.toFixed(1)}% to $${biggestDrop.currentPrice}. ` +
                       `Could be a buy opportunity if support holds`;
            }
        }
        
        return null;
    }
    
    // Prediction generation
    generatePrediction(cardName, priceData) {
        if (!priceData) return null;
        
        const { market, trend, volume24h } = priceData;
        const confidence = this.calculateConfidence(priceData);
        
        // Bull case
        if (trend > 5 && volume24h > 20) {
            const target = Math.round(market * 1.15);
            return `${cardName} momentum strong. Target: $${target} if volume sustains. ` +
                   `Confidence: ${confidence}%`;
        }
        
        // Bear case
        if (trend < -5) {
            const support = Math.round(market * 0.9);
            return `${cardName} testing support at $${support}. ` +
                   `Watch for bounce or breakdown. Confidence: ${confidence}%`;
        }
        
        // Neutral
        return `${cardName} consolidating around $${market}. ` +
               `Breakout likely above $${Math.round(market * 1.1)}`;
    }
    
    // Helper methods
    getMarketContext(trend) {
        if (trend > 15) return 'Breaking out 🚀';
        if (trend > 8) return 'Strong momentum';
        if (trend > 0) return 'Upward pressure';
        if (trend < -15) return 'Heavy selling';
        if (trend < -8) return 'Correction mode';
        if (trend < 0) return 'Slight weakness';
        return 'Stable';
    }
    
    getPredictionSnippet(priceData) {
        const { market, trend } = priceData;
        if (trend > 10) {
            return `Next target: $${Math.round(market * 1.1)}`;
        }
        return `Watch $${Math.round(market * 1.05)} resistance`;
    }
    
    getSupportLevel(priceData) {
        const { low, market } = priceData;
        const support = low || Math.round(market * 0.9);
        return `$${support} support`;
    }
    
    getValueContext(market, trend) {
        if (market > 50 && trend > 5) {
            return 'Tournament play driving demand';
        }
        if (market > 30 && trend > 0) {
            return 'Collector favorite gaining traction';
        }
        return 'Solid addition to any collection';
    }
    
    getCollectorContext(priceData) {
        const { market } = priceData;
        if (market > 50) return 'Long-term hold potential';
        if (market > 25) return 'Popular with collectors';
        return 'Affordable collector piece';
    }
    
    getPlayabilityContext(cardName) {
        // Add tournament meta context
        const metaCards = ['giratina', 'gardevoir', 'miraidon', 'lost box'];
        const isMetaCard = metaCards.some(meta => cardName.toLowerCase().includes(meta));
        
        if (isMetaCard) {
            return 'Seeing tournament play';
        }
        return 'Great binder card';
    }
    
    calculateConfidence(priceData) {
        let confidence = 50; // Base confidence
        
        // Add confidence based on volume
        if (priceData.volume24h > 50) confidence += 20;
        else if (priceData.volume24h > 20) confidence += 10;
        
        // Add confidence based on trend consistency
        if (Math.abs(priceData.trend) > 10) confidence += 15;
        
        // Add confidence based on data freshness
        if (priceData.dataPoints > 5) confidence += 10;
        
        return Math.min(confidence, 95); // Cap at 95%
    }
    
    isMarketQuestion(text) {
        if (!text || typeof text !== 'string') return false;
        const marketTerms = ['market', 'moving', 'hot', 'trending', 'crash', 'pump', 'dump'];
        return marketTerms.some(term => text.toLowerCase().includes(term));
    }
    
    isPredictionRequest(text) {
        if (!text || typeof text !== 'string') return false;
        const predictionTerms = ['predict', 'will it', 'going to', 'target', 'think'];
        return predictionTerms.some(term => text.toLowerCase().includes(term));
    }
    
    // Generate response based on detected narrative
    generateNarrativeResponse(cardName, narrative, priceData) {
        const { classification, strength, platforms, summary } = narrative;
        
        // Get base price info
        const priceInfo = priceData ? 
            `$${priceData.market} (${priceData.trend > 0 ? '+' : ''}${priceData.trend.toFixed(1)}%)` : 
            'price data loading';
        
        // Build response based on narrative type and strength
        if (classification.action === 'bullish' && strength > 0.7) {
            // Strong bullish narrative
            const target = priceData ? Math.round(priceData.market * 1.15) : 'TBD';
            const confidence = Math.round(strength * 100);
            
            return `🎯 ${cardName} ${priceInfo} · Strong accumulation pattern detected. ` +
                   `Target: $${target}. Confidence: ${confidence}%`;
        }
        
        if (classification.action === 'urgent' && strength > 0.6) {
            // Supply shock narrative
            return `⚡ ${cardName} SUPPLY ALERT · ${priceInfo} · ` +
                   `Multiple reports of shortages. Inventory drying up. ` +
                   `Act fast or miss out 🏃`;
        }
        
        if (classification.action === 'volatile' && priceData) {
            // Price discovery narrative
            const range = `$${priceData.low}-${priceData.high}`;
            return `🌊 ${cardName} in price discovery · Currently ${priceInfo} · ` +
                   `24h range: ${range}. Heavy market activity. ` +
                   `Volatility expected`;
        }
        
        if (classification.action === 'premium') {
            // Grading focus narrative
            return `💎 ${cardName} grading hype building · Raw: ${priceInfo} · ` +
                   `PSA 10 premiums expanding. Smart money accumulating graded copies`;
        }
        
        if (classification.action === 'gameplay') {
            // Tournament meta narrative
            return `🎮 ${cardName} seeing tournament play · ${priceInfo} · ` +
                   `Meta shift detected. Competitive players stocking up. ` +
                   `${priceData && priceData.volume24h > 20 ? 'Volume confirms' : 'Early signal'}`;
        }
        
        if (classification.action === 'caution') {
            // Bearish narrative
            const support = priceData ? Math.round(priceData.market * 0.85) : 'unknown';
            return `⚠️ ${cardName} facing headwinds · ${priceInfo} · ` +
                   `Market cooling off. Watch $${support} support`;
        }
        
        // Default narrative response
        return `📊 ${cardName} showing unusual activity · ${priceInfo} · ` +
               `Market signals strengthening. Confidence: ${(strength * 100).toFixed(0)}%`;
    }
    
    // Generate insight posts based on narratives
    generateNarrativePost(narratives) {
        if (!narratives || narratives.length === 0) return null;
        
        // Get strongest narrative
        const top = narratives[0];
        const { card, classification, platforms, strength } = top;
        
        let post = `🎯 MARKET ALERT: ${card}\n\n`;
        
        // Add narrative type
        const narrativeEmojis = {
            bullish: '📈',
            urgent: '⚡',
            volatile: '🌊', 
            premium: '💎',
            gameplay: '🎮',
            caution: '⚠️'
        };
        
        const emoji = narrativeEmojis[classification.action] || '📊';
        
        // Create narrative-specific message
        if (classification.action === 'bullish') {
            post += `${emoji} Strong accumulation pattern detected\n`;
            post += `💪 Signal strength: ${(strength * 100).toFixed(0)}%\n`;
            post += `📊 Volume and momentum confirming\n\n`;
            post += strength > 0.8 
                ? `Next leg up imminent. Position accordingly.`
                : `Building momentum. Watch for breakout.`;
        } else if (classification.action === 'urgent') {
            post += `${emoji} SUPPLY SHORTAGE DETECTED\n`;
            post += `🚨 Multiple vendors reporting low stock\n`;
            post += `📈 Prices responding to scarcity\n\n`;
            post += `Act fast. This window won't last.`;
        } else if (classification.action === 'volatile') {
            post += `${emoji} Price discovery phase active\n`;
            post += `📊 Wide spreads and heavy volume\n`;
            post += `⚡ Market seeking equilibrium\n\n`;
            post += `Volatility = Opportunity. Set your levels.`;
        } else if (classification.action === 'premium') {
            post += `${emoji} Grading premiums expanding\n`;
            post += `📈 PSA 10s commanding strong multiples\n`;
            post += `💰 Smart money targeting quality\n\n`;
            post += `Raw copies undervalued. Grade or trade.`;
        } else if (classification.action === 'gameplay') {
            post += `${emoji} Tournament meta shift detected\n`;
            post += `🏆 Competitive demand increasing\n`;
            post += `📊 Playsets moving fast\n\n`;
            post += `Meta drives prices. Load before events.`;
        } else {
            post += `${emoji} Market dynamics shifting\n`;
            post += `📊 Unusual activity detected\n`;
            post += `💪 Signal strength: ${(strength * 100).toFixed(0)}%\n\n`;
            post += `Stay alert. Changes coming.`;
        }
        
        return post;
    }
}

module.exports = AuthorityResponseEngine;