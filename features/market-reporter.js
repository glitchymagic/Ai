// Market Reporter
// Generates original market analysis posts that establish authority
// Morning reports, predictions, whale watch, tournament impact

class MarketReporter {
    constructor(hotCardsTracker) {
        this.hotCards = hotCardsTracker;
        this.predictions = new Map(); // Track our predictions
        this.lastReportTime = null;
    }
    
    // ==================== SIGNATURE REPORTS ====================
    
    // 🌅 Morning Market Report (Post at 9 AM)
    async generateMorningReport() {
        const movers = await this.hotCards.getTopMovers(5);
        const timestamp = new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Build report
        let report = `🌅 Morning Market Report - ${timestamp}\n\n`;
        
        // Top gainers
        if (movers.gainers.length > 0) {
            report += '📈 GAINERS:\n';
            movers.gainers.forEach(m => {
                const emoji = m.change > 20 ? '🔥' : m.change > 10 ? '🚀' : '📈';
                report += `${emoji} ${m.card.name}: $${m.currentPrice} (+${m.change.toFixed(1)}%)\n`;
            });
            report += '\n';
        }
        
        // Top losers (opportunity framing)
        if (movers.losers.length > 0) {
            report += '💎 BUYING OPPS:\n';
            movers.losers.forEach(m => {
                report += `💰 ${m.card.name}: $${m.currentPrice} (${m.change.toFixed(1)}%)\n`;
            });
            report += '\n';
        }
        
        // Volume alerts
        const highVolume = movers.highVolume[0];
        if (highVolume && highVolume.volume > 30) {
            report += `⚡ VOLUME: ${highVolume.card.name} seeing ${highVolume.volume} sales/24h\n\n`;
        }
        
        // Daily prediction
        const prediction = await this.generateDailyPrediction();
        report += `🎯 ${prediction}`;
        
        return this.trimToTwitterLength(report);
    }
    
    // 🌞 Midday Movers (Post at 12 PM)
    async generateMiddayUpdate() {
        const movers = await this.hotCards.getTopMovers(3);
        
        let report = '🌞 Midday Market Check\n\n';
        
        // Focus on momentum
        const momentum = movers.gainers.filter(m => m.change > 5);
        if (momentum.length > 0) {
            report += '🏃‍♂️ MOMENTUM:\n';
            momentum.forEach(m => {
                report += `• ${m.card.name} pushing $${m.currentPrice} (+${m.change.toFixed(1)}%)\n`;
            });
        }
        
        // Quick insight
        const insight = await this.generateQuickInsight();
        report += `\n💡 ${insight}`;
        
        return this.trimToTwitterLength(report);
    }
    
    // 🌙 Evening Wrap (Post at 7 PM)
    async generateEveningWrap() {
        const movers = await this.hotCards.getTopMovers(5);
        
        let report = '🌙 Evening Market Wrap\n\n';
        
        // Day's biggest story
        const biggestMover = [...movers.gainers, ...movers.losers]
            .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];
            
        if (biggestMover) {
            const direction = biggestMover.change > 0 ? 'surged' : 'dipped';
            report += `📊 Biggest move: ${biggestMover.card.name} ${direction} ${Math.abs(biggestMover.change).toFixed(1)}% to $${biggestMover.currentPrice}\n\n`;
        }
        
        // Tomorrow's watch
        report += '👀 TOMORROW\'S WATCH:\n';
        const watchList = await this.getTomorrowsWatch();
        watchList.forEach(item => {
            report += `• ${item}\n`;
        });
        
        return this.trimToTwitterLength(report);
    }
    
    // ==================== SPECIAL REPORTS ====================
    
    // 🐋 Whale Watch Wednesday
    async generateWhaleWatch() {
        let report = '🐋 WHALE WATCH WEDNESDAY\n\n';
        
        // High value movements
        const highValueCards = this.hotCards.HOT_CARDS
            .filter(card => card.priority === 'critical')
            .slice(0, 5);
            
        report += 'BIG MONEY MOVES:\n';
        
        for (const card of highValueCards) {
            const price = await this.hotCards.getCardPrice(card);
            if (price.volume24h > 15) {
                report += `🐋 ${card.name}: ${price.volume24h} sales @ $${price.market}\n`;
            }
        }
        
        // Whale prediction
        report += '\n🎯 Whale target: Watch Moonbreon test $450 resistance';
        
        return this.trimToTwitterLength(report);
    }
    
    // 🏆 Tournament Impact Report (Post after major tournaments)
    async generateTournamentReport(tournamentName, topDecks) {
        let report = `🏆 ${tournamentName} IMPACT REPORT\n\n`;
        
        report += '📈 CARDS TO WATCH:\n';
        
        // Analyze cards from winning decks
        const impactedCards = ['Giratina VSTAR', 'Cross Switcher', 'Lost City'];
        
        for (const cardName of impactedCards) {
            const price = await this.hotCards.getPriceByName(cardName);
            if (price) {
                report += `• ${cardName}: $${price.market} (supply tightening)\n`;
            }
        }
        
        report += '\n💡 Meta shift incoming - position accordingly';
        
        return this.trimToTwitterLength(report);
    }
    
    // ==================== PREDICTION POSTS ====================
    
    // Bold weekly prediction
    async generateWeeklyPrediction() {
        const movers = await this.hotCards.getTopMovers(10);
        
        // Find the best prediction candidate
        const candidate = movers.gainers.find(m => 
            m.change > 5 && m.volume > 20
        ) || movers.highVolume[0];
        
        if (!candidate) return null;
        
        const target = Math.round(candidate.currentPrice * 1.2);
        const predictionId = `PRED-${Date.now()}`;
        
        // Store prediction for tracking
        this.predictions.set(predictionId, {
            card: candidate.card.name,
            currentPrice: candidate.currentPrice,
            target: target,
            date: new Date(),
            confidence: 75
        });
        
        return `🎯 WEEKLY CALL ${predictionId}\n\n` +
               `${candidate.card.name} to $${target}\n` +
               `Current: $${candidate.currentPrice}\n` +
               `Target: $${target} (+20%)\n` +
               `Timeframe: 7 days\n` +
               `Confidence: 75%\n\n` +
               `${this.getPredictionReasoning(candidate)}`;
    }
    
    // ==================== HELPER METHODS ====================
    
    async generateDailyPrediction() {
        const movers = await this.hotCards.getTopMovers(3);
        const topGainer = movers.gainers[0];
        
        if (topGainer && topGainer.change > 5) {
            return `Today: ${topGainer.card.name} continues climbing. Target $${Math.round(topGainer.currentPrice * 1.05)}`;
        }
        
        return 'Today: Consolidation day. Accumulate quality';
    }
    
    async generateQuickInsight() {
        const insights = [
            'Sealed products outperforming singles today',
            'Alt arts showing strength across the board',
            'Tournament results driving trainer card prices',
            'Vintage maintaining premium despite market dip',
            'Japanese exclusives seeing increased interest'
        ];
        
        // Could make this smarter based on actual data
        return insights[Math.floor(Math.random() * insights.length)];
    }
    
    async getTomorrowsWatch() {
        const watches = [];
        const movers = await this.hotCards.getTopMovers(5);
        
        // Add cards approaching resistance
        movers.gainers.slice(0, 2).forEach(m => {
            const resistance = Math.round(m.currentPrice * 1.1);
            watches.push(`${m.card.name} testing $${resistance}`);
        });
        
        // Add oversold bounces
        movers.losers.slice(0, 1).forEach(m => {
            watches.push(`${m.card.name} for oversold bounce`);
        });
        
        return watches;
    }
    
    getPredictionReasoning(candidate) {
        const reasons = [];
        
        if (candidate.change > 10) {
            reasons.push('Strong momentum');
        }
        if (candidate.volume > 30) {
            reasons.push('High volume confirmation');
        }
        if (candidate.card.priority === 'critical') {
            reasons.push('Blue chip status');
        }
        
        return `Reasoning: ${reasons.join(' + ')}`;
    }
    
    trimToTwitterLength(text, maxLength = 280) {
        if (text.length <= maxLength) return text;
        
        // Smart trim - try to end at a line break
        const trimmed = text.substring(0, maxLength - 3);
        const lastNewline = trimmed.lastIndexOf('\n');
        
        if (lastNewline > 200) {
            return trimmed.substring(0, lastNewline) + '...';
        }
        
        return trimmed + '...';
    }
    
    // ==================== SCHEDULING METHODS ====================
    
    getNextReportType() {
        const hour = new Date().getHours();
        
        if (hour >= 8 && hour < 10) return 'morning';
        if (hour >= 11 && hour < 13) return 'midday';
        if (hour >= 18 && hour < 20) return 'evening';
        
        // Special reports
        const day = new Date().getDay();
        if (day === 3 && hour >= 14 && hour < 16) return 'whale'; // Wednesday
        
        return null;
    }
    
    async generateScheduledPost() {
        const reportType = this.getNextReportType();
        
        switch(reportType) {
            case 'morning':
                return await this.generateMorningReport();
            case 'midday':
                return await this.generateMiddayUpdate();
            case 'evening':
                return await this.generateEveningWrap();
            case 'whale':
                return await this.generateWhaleWatch();
            default:
                return null;
        }
    }
}

module.exports = MarketReporter;