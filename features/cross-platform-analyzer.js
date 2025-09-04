// Cross-Platform Analyzer - Orchestrates all monitoring systems
// Provides unified intelligence for the Pokemon bot

const fs = require('fs').promises;
const path = require('path');

class CrossPlatformAnalyzer {
    constructor(redditMonitor, kolMonitor, narrativeDetector, hotCardsTracker, authorityEngine) {
        this.redditMonitor = redditMonitor;
        this.kolMonitor = kolMonitor;
        this.narrativeDetector = narrativeDetector;
        this.hotCardsTracker = hotCardsTracker;
        this.authorityEngine = authorityEngine;
        
        this.dataPath = path.join(__dirname, '../data');
        
        // Analysis intervals - less frequent to avoid conflicts
        this.intervals = {
            narrative: 60 * 60 * 1000,    // 60 minutes (was 30)
            kol: 45 * 60 * 1000,          // 45 minutes (was 15)
            reddit: 40 * 60 * 1000,       // 40 minutes (was 20)
            correlation: 90 * 60 * 1000   // 90 minutes (was 45)
        };
        
        // Active monitoring
        this.isMonitoring = false;
        this.monitoringTasks = new Map();
        
        // Intelligence cache
        this.intelligenceCache = {
            narratives: [],
            kolSignals: [],
            redditTrends: [],
            correlations: [],
            lastUpdate: null
        };
        
        // Response strategies based on intelligence
        this.responseStrategies = {
            strongBullish: {
                confidence: 0.8,
                style: 'authoritative',
                action: 'engage_actively'
            },
            moderateBullish: {
                confidence: 0.6,
                style: 'informative',
                action: 'share_data'
            },
            supplyAlert: {
                confidence: 0.9,
                style: 'urgent',
                action: 'alert_followers'
            },
            bearishCaution: {
                confidence: 0.7,
                style: 'analytical',
                action: 'provide_context'
            },
            neutral: {
                confidence: 0.5,
                style: 'conversational',
                action: 'monitor'
            }
        };
    }
    
    // Start cross-platform monitoring
    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ Cross-platform monitoring already active');
            return;
        }
        
        console.log('🚀 Starting cross-platform intelligence monitoring...');
        this.isMonitoring = true;
        
        // Initial analysis
        await this.runFullAnalysis();
        
        // Set up recurring tasks
        this.setupMonitoringTasks();
        
        console.log('✅ Cross-platform monitoring active');
    }
    
    // Stop monitoring
    stopMonitoring() {
        console.log('🛑 Stopping cross-platform monitoring...');
        
        this.isMonitoring = false;
        
        // Clear all intervals
        for (const [task, intervalId] of this.monitoringTasks) {
            clearInterval(intervalId);
        }
        
        this.monitoringTasks.clear();
    }
    
    // Set up recurring monitoring tasks
    setupMonitoringTasks() {
        // Reddit monitoring
        const redditTask = setInterval(async () => {
            if (this.isMonitoring) {
                await this.updateRedditIntelligence();
            }
        }, this.intervals.reddit);
        this.monitoringTasks.set('reddit', redditTask);
        
        // KOL monitoring - DISABLED for now to avoid search conflicts
        // const kolTask = setInterval(async () => {
        //     if (this.isMonitoring) {
        //         await this.updateKOLIntelligence();
        //     }
        // }, this.intervals.kol);
        // this.monitoringTasks.set('kol', kolTask);
        
        // Narrative detection
        const narrativeTask = setInterval(async () => {
            if (this.isMonitoring) {
                await this.updateNarratives();
            }
        }, this.intervals.narrative);
        this.monitoringTasks.set('narrative', narrativeTask);
        
        // Cross-platform correlation
        const correlationTask = setInterval(async () => {
            if (this.isMonitoring) {
                await this.runFullAnalysis();
            }
        }, this.intervals.correlation);
        this.monitoringTasks.set('correlation', correlationTask);
    }
    
    // Run full cross-platform analysis
    async runFullAnalysis() {
        console.log('🔄 Running full cross-platform analysis...');
        
        try {
            // Gather intelligence from all sources
            const [reddit, kol, narratives] = await Promise.all([
                this.updateRedditIntelligence(),
                this.updateKOLIntelligence(),
                this.updateNarratives()
            ]);
            
            // Correlate findings
            const correlations = await this.correlateAllFindings();
            
            // Update intelligence cache
            this.intelligenceCache = {
                narratives,
                kolSignals: kol,
                redditTrends: reddit,
                correlations,
                lastUpdate: Date.now()
            };
            
            // Generate insights report
            const report = this.generateIntelligenceReport();
            await this.saveIntelligenceReport(report);
            
            console.log('✅ Full analysis complete');
            
            return report;
            
        } catch (error) {
            console.error('Error in full analysis:', error);
            return null;
        }
    }
    
    // Update Reddit intelligence
    async updateRedditIntelligence() {
        console.log('📊 Updating Reddit intelligence...');
        
        try {
            const narratives = await this.redditMonitor.monitorAll();
            return narratives.slice(0, 10); // Top 10
        } catch (error) {
            console.error('Reddit update error:', error);
            return [];
        }
    }
    
    // Update KOL intelligence
    async updateKOLIntelligence() {
        console.log('🐦 KOL monitoring temporarily disabled to avoid search conflicts');
        return []; // Disabled for now
        
        // console.log('🐦 Updating KOL intelligence...');
        // 
        // try {
        //     const signals = await this.kolMonitor.monitorNextBatch(3);
        //     return signals;
        // } catch (error) {
        //     console.error('KOL update error:', error);
        //     return [];
        // }
    }
    
    // Update narrative detection
    async updateNarratives() {
        console.log('🎯 Updating narrative detection...');
        
        try {
            const narratives = await this.narrativeDetector.detectNarratives();
            return narratives;
        } catch (error) {
            console.error('Narrative update error:', error);
            return [];
        }
    }
    
    // Correlate all findings
    async correlateAllFindings() {
        const correlations = [];
        
        // Find cards mentioned across multiple sources
        const cardMentions = new Map();
        
        // Count Reddit mentions
        for (const trend of this.intelligenceCache.redditTrends) {
            const card = trend.card;
            if (!cardMentions.has(card)) {
                cardMentions.set(card, {
                    card,
                    sources: new Set(),
                    reddit: 0,
                    twitter: 0,
                    totalStrength: 0
                });
            }
            cardMentions.get(card).sources.add('reddit');
            cardMentions.get(card).reddit += trend.totalStrength || 1;
            cardMentions.get(card).totalStrength += trend.totalStrength || 1;
        }
        
        // Count Twitter KOL mentions
        for (const signal of this.intelligenceCache.kolSignals) {
            const card = signal.card;
            if (!cardMentions.has(card)) {
                cardMentions.set(card, {
                    card,
                    sources: new Set(),
                    reddit: 0,
                    twitter: 0,
                    totalStrength: 0
                });
            }
            cardMentions.get(card).sources.add('twitter');
            cardMentions.get(card).twitter += signal.totalStrength || 1;
            cardMentions.get(card).totalStrength += signal.totalStrength || 1;
        }
        
        // Create correlation entries
        for (const [card, data] of cardMentions) {
            if (data.sources.size > 1) {
                // Multi-platform mention
                correlations.push({
                    card,
                    type: 'cross_platform',
                    strength: data.totalStrength * 1.5, // Boost for cross-platform
                    platforms: Array.from(data.sources),
                    breakdown: {
                        reddit: data.reddit,
                        twitter: data.twitter
                    }
                });
            }
        }
        
        // Sort by strength
        return correlations.sort((a, b) => b.strength - a.strength);
    }
    
    // Generate intelligence report
    generateIntelligenceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                topNarratives: this.intelligenceCache.narratives.slice(0, 3),
                strongestSignals: this.getStrongestSignals(),
                crossPlatformAlerts: this.intelligenceCache.correlations.slice(0, 3),
                marketSentiment: this.calculateOverallSentiment()
            },
            recommendations: this.generateRecommendations(),
            predictions: this.generatePredictions(),
            responseStrategies: this.determineResponseStrategies()
        };
        
        return report;
    }
    
    // Get strongest signals across all platforms
    getStrongestSignals() {
        const allSignals = [];
        
        // Add narratives
        for (const narrative of this.intelligenceCache.narratives) {
            allSignals.push({
                type: 'narrative',
                card: narrative.card,
                strength: narrative.strength,
                source: narrative.platforms.join('+')
            });
        }
        
        // Add KOL signals
        for (const signal of this.intelligenceCache.kolSignals) {
            allSignals.push({
                type: 'kol',
                card: signal.card,
                strength: signal.avgStrength || signal.totalStrength,
                source: 'twitter'
            });
        }
        
        // Add Reddit trends
        for (const trend of this.intelligenceCache.redditTrends) {
            allSignals.push({
                type: 'reddit',
                card: trend.card,
                strength: trend.avgStrength || trend.totalStrength,
                source: 'reddit'
            });
        }
        
        // Sort and return top 5
        return allSignals
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 5);
    }
    
    // Calculate overall market sentiment
    calculateOverallSentiment() {
        const sentiments = {
            bullish: 0,
            bearish: 0,
            neutral: 0,
            urgent: 0
        };
        
        // Aggregate from narratives
        for (const narrative of this.intelligenceCache.narratives) {
            const sentiment = narrative.classification?.action || 'neutral';
            sentiments[sentiment] = (sentiments[sentiment] || 0) + narrative.strength;
        }
        
        // Normalize
        const total = Object.values(sentiments).reduce((a, b) => a + b, 0) || 1;
        for (const key in sentiments) {
            sentiments[key] = (sentiments[key] / total * 100).toFixed(1);
        }
        
        // Determine dominant
        const dominant = Object.entries(sentiments)
            .sort((a, b) => b[1] - a[1])[0][0];
        
        return {
            dominant,
            breakdown: sentiments
        };
    }
    
    // Generate recommendations for bot behavior
    generateRecommendations() {
        const recommendations = [];
        
        // Check for strong narratives
        const strongNarratives = this.intelligenceCache.narratives
            .filter(n => n.actionability === 'strong' || n.actionability === 'critical');
        
        if (strongNarratives.length > 0) {
            recommendations.push({
                type: 'engage',
                priority: 'high',
                action: 'Actively engage with discussions about: ' + 
                    strongNarratives.map(n => n.card).join(', '),
                reason: 'Strong narratives detected across platforms'
            });
        }
        
        // Check for cross-platform correlations
        if (this.intelligenceCache.correlations.length > 0) {
            const topCorrelation = this.intelligenceCache.correlations[0];
            recommendations.push({
                type: 'alert',
                priority: 'high',
                action: `Post analysis about ${topCorrelation.card}`,
                reason: 'Cross-platform momentum detected'
            });
        }
        
        // Check sentiment
        const sentiment = this.calculateOverallSentiment();
        if (sentiment.dominant === 'urgent') {
            recommendations.push({
                type: 'monitor',
                priority: 'critical',
                action: 'Increase monitoring frequency and alert followers',
                reason: 'Urgent market conditions detected'
            });
        }
        
        return recommendations;
    }
    
    // Get current Reddit insights for bot responses
    getCurrentRedditInsights(cardName = null) {
        // Return relevant Reddit data for enhanced responses
        if (!this.intelligenceCache.redditTrends || this.intelligenceCache.redditTrends.length === 0) {
            return null;
        }
        
        // If looking for specific card
        if (cardName) {
            const relevantTrend = this.intelligenceCache.redditTrends.find(trend => 
                trend.card && trend.card.toLowerCase().includes(cardName.toLowerCase())
            );
            if (relevantTrend) {
                return {
                    card: relevantTrend.card,
                    sentiment: relevantTrend.sentiment,
                    narrative: relevantTrend.narrativeType,
                    mentions: relevantTrend.score || 0,
                    summary: this.formatRedditInsight(relevantTrend)
                };
            }
        }
        
        // Return top trending narrative
        const topTrend = this.intelligenceCache.redditTrends[0];
        if (topTrend) {
            return {
                card: topTrend.card,
                sentiment: topTrend.sentiment,
                narrative: topTrend.narrativeType,
                trending: true,
                summary: this.formatRedditInsight(topTrend)
            };
        }
        
        return null;
    }
    
    formatRedditInsight(trend) {
        const sentimentMap = {
            bullish: 'community is hyped on',
            bearish: 'some concerns about',
            urgent: 'supply alerts for',
            neutral: 'discussion around'
        };
        
        const sentiment = sentimentMap[trend.sentiment] || 'buzz about';
        return `reddit ${sentiment} ${trend.card}`;
    }
    
    // Generate market predictions
    generatePredictions() {
        const predictions = [];
        
        // Based on strongest signals
        for (const signal of this.getStrongestSignals().slice(0, 3)) {
            const prediction = {
                id: `XPLAT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                card: signal.card,
                confidence: signal.strength,
                timeframe: '24-72h',
                source: signal.source
            };
            
            // Determine prediction based on signal strength and type
            if (signal.strength > 0.8) {
                prediction.expectation = 'significant_movement';
                prediction.direction = 'up';
                prediction.range = '10-20%';
            } else if (signal.strength > 0.6) {
                prediction.expectation = 'moderate_interest';
                prediction.direction = 'up';
                prediction.range = '5-10%';
            } else {
                prediction.expectation = 'increased_discussion';
                prediction.direction = 'volatile';
                prediction.range = 'watch_closely';
            }
            
            predictions.push(prediction);
        }
        
        return predictions;
    }
    
    // Determine response strategies for bot
    determineResponseStrategies() {
        const strategies = [];
        
        // Analyze each strong narrative
        for (const narrative of this.intelligenceCache.narratives) {
            if (narrative.strength < 0.5) continue;
            
            let strategy = this.responseStrategies.neutral;
            
            // Select strategy based on classification
            if (narrative.classification) {
                switch (narrative.classification.action) {
                    case 'bullish':
                        strategy = narrative.strength > 0.7 
                            ? this.responseStrategies.strongBullish
                            : this.responseStrategies.moderateBullish;
                        break;
                    case 'urgent':
                        strategy = this.responseStrategies.supplyAlert;
                        break;
                    case 'caution':
                    case 'bearish':
                        strategy = this.responseStrategies.bearishCaution;
                        break;
                }
            }
            
            strategies.push({
                card: narrative.card,
                strategy: strategy.style,
                action: strategy.action,
                confidence: strategy.confidence
            });
        }
        
        return strategies;
    }
    
    // Get intelligence for a specific card
    async getCardIntelligence(cardName) {
        const intelligence = {
            card: cardName,
            narratives: [],
            kolMentions: [],
            redditDiscussion: [],
            priceData: null,
            recommendation: null
        };
        
        // Check narratives
        intelligence.narratives = this.intelligenceCache.narratives
            .filter(n => n.card.toLowerCase().includes(cardName.toLowerCase()));
        
        // Check KOL signals
        intelligence.kolMentions = this.intelligenceCache.kolSignals
            .filter(s => s.card.toLowerCase().includes(cardName.toLowerCase()));
        
        // Check Reddit
        intelligence.redditDiscussion = this.intelligenceCache.redditTrends
            .filter(t => t.card.toLowerCase().includes(cardName.toLowerCase()));
        
        // Get price data
        try {
            intelligence.priceData = await this.hotCardsTracker.getCardData(cardName);
        } catch (error) {
            // Price data not available
        }
        
        // Generate recommendation
        if (intelligence.narratives.length > 0) {
            const strongestNarrative = intelligence.narratives[0];
            intelligence.recommendation = {
                action: strongestNarrative.suggestedAction,
                confidence: strongestNarrative.strength,
                reasoning: strongestNarrative.summary
            };
        }
        
        return intelligence;
    }
    
    // Check if bot should respond to a post
    async shouldRespond(postContent, username) {
        // Extract potential card mentions
        const cardMentions = this.extractCardMentions(postContent);
        
        if (cardMentions.length === 0) {
            return { should: false, reason: 'no_cards_mentioned' };
        }
        
        // Check if any mentioned cards have active narratives
        for (const card of cardMentions) {
            const intelligence = await this.getCardIntelligence(card);
            
            if (intelligence.narratives.length > 0 || 
                intelligence.kolMentions.length > 0) {
                return {
                    should: true,
                    reason: 'active_narrative',
                    intelligence,
                    confidence: intelligence.narratives[0]?.strength || 0.5
                };
            }
        }
        
        // Default to normal response logic
        return { should: true, reason: 'standard_engagement' };
    }
    
    // Extract card mentions from text
    extractCardMentions(text) {
        const mentions = [];
        const patterns = [
            /moonbreon|umbreon\s*vmax/gi,
            /charizard/gi,
            /giratina/gi,
            /lugia/gi,
            /rayquaza/gi,
            /(\w+)\s*vmax/gi,
            /(\w+)\s*v\s*alt/gi
        ];
        
        for (const pattern of patterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                mentions.push(match[0]);
            }
        }
        
        return [...new Set(mentions)]; // Remove duplicates
    }
    
    // Generate response based on intelligence
    async generateIntelligentResponse(context) {
        const { username, postContent, cardMentions } = context;
        
        // Get intelligence for mentioned cards
        const cardIntelligence = [];
        for (const card of cardMentions) {
            const intel = await this.getCardIntelligence(card);
            if (intel.narratives.length > 0) {
                cardIntelligence.push(intel);
            }
        }
        
        if (cardIntelligence.length === 0) {
            // Fall back to authority engine
            return null;
        }
        
        // Use strongest narrative
        const strongest = cardIntelligence[0];
        const narrative = strongest.narratives[0];
        
        // Generate response based on narrative
        return this.authorityEngine.generateNarrativeResponse(
            strongest.card,
            narrative,
            strongest.priceData
        );
    }
    
    // Save intelligence report
    async saveIntelligenceReport(report) {
        const filePath = path.join(this.dataPath, 'intelligence-report.json');
        
        try {
            await fs.writeFile(filePath, JSON.stringify(report, null, 2));
            console.log('📊 Intelligence report saved');
        } catch (error) {
            console.error('Error saving report:', error);
        }
    }
    
    // Get latest intelligence report
    async getLatestReport() {
        const filePath = path.join(this.dataPath, 'intelligence-report.json');
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }
}

module.exports = CrossPlatformAnalyzer;