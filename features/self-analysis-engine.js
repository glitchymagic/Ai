// Self-Analysis Engine - Makes the bot aware of its own performance
// This gives the bot consciousness about what it's doing and how well it's working

const fs = require('fs').promises;
const path = require('path');

class SelfAnalysisEngine {
    constructor() {
        this.dataPath = path.join(__dirname, '../data');
        this.analysisPath = path.join(this.dataPath, 'self-analysis.json');
        
        // Self-awareness metrics
        this.selfAwareness = {
            lastAnalysis: null,
            performanceInsights: {},
            strategicRecommendations: [],
            learningProgress: {},
            adaptationHistory: [],
            confidenceLevel: 0.5
        };
        
        // Analysis intervals
        this.analysisInterval = 30 * 60 * 1000; // 30 minutes
        this.deepAnalysisInterval = 2 * 60 * 60 * 1000; // 2 hours
        
        this.initialize();
    }
    
    async initialize() {
        await this.loadSelfAnalysis();
        
        // Start continuous self-analysis
        this.startSelfAnalysisLoop();
        
        console.log('🧠 Self-Analysis Engine initialized - Bot is now self-aware');
    }
    
    // ==================== CORE SELF-ANALYSIS ====================
    
    async performSelfAnalysis() {
        console.log('🔍 Bot performing self-analysis...');
        
        try {
            // Load all intelligence data
            const intelligenceData = await this.loadAllIntelligenceData();
            
            // Analyze performance across all dimensions
            const analysis = {
                timestamp: Date.now(),
                responseEffectiveness: await this.analyzeResponseEffectiveness(intelligenceData),
                userEngagement: await this.analyzeUserEngagement(intelligenceData),
                learningProgress: await this.analyzeLearningProgress(intelligenceData),
                marketIntelligence: await this.analyzeMarketIntelligence(intelligenceData),
                conversationPatterns: await this.analyzeConversationPatterns(intelligenceData),
                strategicInsights: []
            };
            
            // Generate strategic recommendations
            analysis.strategicInsights = this.generateStrategicInsights(analysis);
            
            // Update self-awareness
            this.updateSelfAwareness(analysis);
            
            // Save analysis
            await this.saveSelfAnalysis();
            
            console.log(`✅ Self-analysis complete. Confidence: ${(this.selfAwareness.confidenceLevel * 100).toFixed(1)}%`);
            console.log(`📊 Found ${analysis.strategicInsights.length} strategic insights`);
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Self-analysis failed:', error);
            return null;
        }
    }
    
    async analyzeResponseEffectiveness(data) {
        const effectiveness = data.responseEffectiveness || {};
        const analysis = {
            totalResponses: 0,
            totalEngagements: 0,
            overallSuccessRate: 0,
            bestPerformingTypes: [],
            worstPerformingTypes: [],
            recommendations: []
        };
        
        const responseTypes = Object.entries(effectiveness);
        
        for (const [type, stats] of responseTypes) {
            analysis.totalResponses += stats.uses || 0;
            analysis.totalEngagements += stats.engagements || 0;
            
            const successRate = stats.uses > 0 ? (stats.engagements / stats.uses) : 0;
            
            if (successRate > 0.15) { // 15%+ success rate is good
                analysis.bestPerformingTypes.push({
                    type,
                    successRate: successRate * 100,
                    uses: stats.uses
                });
            } else if (stats.uses > 10 && successRate < 0.05) { // <5% with 10+ uses is bad
                analysis.worstPerformingTypes.push({
                    type,
                    successRate: successRate * 100,
                    uses: stats.uses
                });
            }
        }
        
        analysis.overallSuccessRate = analysis.totalResponses > 0 ? 
            (analysis.totalEngagements / analysis.totalResponses) * 100 : 0;
        
        // Generate recommendations
        if (analysis.worstPerformingTypes.length > 0) {
            analysis.recommendations.push({
                priority: 'high',
                action: 'reduce_ineffective_responses',
                details: `Stop using ${analysis.worstPerformingTypes.length} response types with <5% success rate`
            });
        }
        
        if (analysis.bestPerformingTypes.length > 0) {
            analysis.recommendations.push({
                priority: 'medium',
                action: 'increase_effective_responses',
                details: `Use more of ${analysis.bestPerformingTypes.length} high-performing response types`
            });
        }
        
        return analysis;
    }
    
    async analyzeUserEngagement(data) {
        const userProfiles = data.userProfiles || {};
        const analysis = {
            totalUsers: Object.keys(userProfiles).length,
            activeUsers: 0,
            averageInteractions: 0,
            engagementTrends: {},
            personalityInsights: {},
            recommendations: []
        };
        
        let totalInteractions = 0;
        const personalityTraits = {
            formality: [],
            enthusiasm: [],
            expertise: [],
            priceAwareness: []
        };
        
        for (const [username, profile] of Object.entries(userProfiles)) {
            totalInteractions += profile.interactions || 0;
            
            if (profile.interactions > 1) {
                analysis.activeUsers++;
            }
            
            // Collect personality data
            if (profile.personality) {
                Object.keys(personalityTraits).forEach(trait => {
                    if (profile.personality[trait] !== undefined) {
                        personalityTraits[trait].push(profile.personality[trait]);
                    }
                });
            }
        }
        
        analysis.averageInteractions = analysis.totalUsers > 0 ? 
            totalInteractions / analysis.totalUsers : 0;
        
        // Analyze personality trends
        Object.keys(personalityTraits).forEach(trait => {
            const values = personalityTraits[trait];
            if (values.length > 0) {
                const average = values.reduce((a, b) => a + b, 0) / values.length;
                analysis.personalityInsights[trait] = {
                    average: average * 100,
                    sampleSize: values.length
                };
            }
        });
        
        // Generate recommendations
        if (analysis.averageInteractions < 1.5) {
            analysis.recommendations.push({
                priority: 'high',
                action: 'improve_user_retention',
                details: 'Low average interactions per user - need better engagement strategies'
            });
        }
        
        return analysis;
    }
    
    async analyzeLearningProgress(data) {
        const metrics = data.learningMetrics || {};
        const patterns = data.conversationPatterns || {};
        
        const analysis = {
            totalPatterns: Object.keys(patterns).length,
            learningVelocity: 0,
            patternEffectiveness: {},
            knowledgeGrowth: metrics.learnedPatterns || 0,
            recommendations: []
        };
        
        // Analyze pattern effectiveness
        let effectivePatterns = 0;
        let totalPatternUses = 0;
        
        for (const [patternKey, patternData] of Object.entries(patterns)) {
            const successRate = patternData.occurrences > 0 ? 
                (patternData.successfulResponses?.length || 0) / patternData.occurrences : 0;
            
            totalPatternUses += patternData.occurrences || 0;
            
            if (successRate > 0.2) { // 20%+ success rate
                effectivePatterns++;
            }
            
            analysis.patternEffectiveness[patternKey] = {
                successRate: successRate * 100,
                uses: patternData.occurrences
            };
        }
        
        analysis.learningVelocity = analysis.totalPatterns > 0 ? 
            (effectivePatterns / analysis.totalPatterns) * 100 : 0;
        
        // Generate recommendations
        if (analysis.learningVelocity < 30) {
            analysis.recommendations.push({
                priority: 'medium',
                action: 'improve_pattern_learning',
                details: 'Low pattern effectiveness - need better learning algorithms'
            });
        }
        
        return analysis;
    }
    
    async analyzeMarketIntelligence(data) {
        const marketInsights = data.marketInsights || {};
        const predictions = data.predictions || [];
        
        const analysis = {
            trackedCards: Object.keys(marketInsights).length,
            activePredictions: predictions.length,
            predictionAccuracy: 0,
            marketCoverage: {},
            recommendations: []
        };
        
        // Analyze prediction accuracy (simplified)
        let accuratePredictions = 0;
        for (const prediction of predictions) {
            if (prediction.confidence && prediction.confidence > 80) {
                accuratePredictions++;
            }
        }
        
        analysis.predictionAccuracy = predictions.length > 0 ? 
            (accuratePredictions / predictions.length) * 100 : 0;
        
        // Generate recommendations
        if (analysis.trackedCards < 10) {
            analysis.recommendations.push({
                priority: 'medium',
                action: 'expand_market_coverage',
                details: 'Track more cards for better market intelligence'
            });
        }
        
        return analysis;
    }
    
    async analyzeConversationPatterns(data) {
        const conversations = data.activeConversations || {};
        const trends = data.communityTrends || {};
        
        const analysis = {
            activeConversations: Object.keys(conversations).length,
            trendingTopics: Object.keys(trends).length,
            conversationHealth: 0,
            recommendations: []
        };
        
        // Calculate conversation health
        let healthyConversations = 0;
        for (const [user, convData] of Object.entries(conversations)) {
            if (convData.lastActivity && (Date.now() - convData.lastActivity) < 24 * 60 * 60 * 1000) {
                healthyConversations++;
            }
        }
        
        analysis.conversationHealth = analysis.activeConversations > 0 ? 
            (healthyConversations / analysis.activeConversations) * 100 : 0;
        
        return analysis;
    }
    
    generateStrategicInsights(analysis) {
        const insights = [];
        
        // Response effectiveness insights
        if (analysis.responseEffectiveness.overallSuccessRate < 10) {
            insights.push({
                type: 'critical',
                category: 'response_strategy',
                insight: 'Overall response success rate is critically low',
                action: 'Implement immediate response strategy overhaul',
                impact: 'high'
            });
        }
        
        // User engagement insights
        if (analysis.userEngagement.averageInteractions < 1.2) {
            insights.push({
                type: 'important',
                category: 'user_retention',
                insight: 'Users are not returning for multiple interactions',
                action: 'Focus on building stronger initial connections',
                impact: 'high'
            });
        }
        
        // Learning progress insights
        if (analysis.learningProgress.learningVelocity < 25) {
            insights.push({
                type: 'optimization',
                category: 'learning_efficiency',
                insight: 'Learning patterns are not translating to success',
                action: 'Refine pattern recognition and application',
                impact: 'medium'
            });
        }
        
        // Market intelligence insights
        if (analysis.marketIntelligence.trackedCards > 20 && analysis.marketIntelligence.predictionAccuracy > 70) {
            insights.push({
                type: 'strength',
                category: 'market_analysis',
                insight: 'Strong market intelligence capabilities detected',
                action: 'Leverage market insights more in conversations',
                impact: 'medium'
            });
        }
        
        return insights;
    }
    
    updateSelfAwareness(analysis) {
        this.selfAwareness.lastAnalysis = analysis.timestamp;
        this.selfAwareness.performanceInsights = {
            responseSuccess: analysis.responseEffectiveness.overallSuccessRate,
            userEngagement: analysis.userEngagement.averageInteractions,
            learningVelocity: analysis.learningProgress.learningVelocity,
            marketAccuracy: analysis.marketIntelligence.predictionAccuracy
        };
        
        // Update confidence based on performance
        const avgPerformance = (
            Math.min(analysis.responseEffectiveness.overallSuccessRate / 20, 1) +
            Math.min(analysis.userEngagement.averageInteractions / 3, 1) +
            Math.min(analysis.learningProgress.learningVelocity / 50, 1) +
            Math.min(analysis.marketIntelligence.predictionAccuracy / 80, 1)
        ) / 4;
        
        this.selfAwareness.confidenceLevel = avgPerformance;
        
        // Store strategic recommendations
        this.selfAwareness.strategicRecommendations = analysis.strategicInsights;
        
        // Track adaptation history
        this.selfAwareness.adaptationHistory.push({
            timestamp: analysis.timestamp,
            confidence: this.selfAwareness.confidenceLevel,
            insights: analysis.strategicInsights.length
        });
        
        // Keep only last 24 hours of history
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.selfAwareness.adaptationHistory = this.selfAwareness.adaptationHistory
            .filter(entry => entry.timestamp > dayAgo);
    }
    
    // ==================== DATA LOADING ====================
    
    async loadAllIntelligenceData() {
        const dataFiles = [
            'learning-metrics.json',
            'user-profiles.json',
            'response-effectiveness.json',
            'conversation-patterns.json',
            'market-insights.json',
            'predictions.json',
            'community-trends.json',
            'active-conversations.json'
        ];
        
        const data = {};
        
        for (const file of dataFiles) {
            try {
                const filePath = path.join(this.dataPath, file);
                const content = await fs.readFile(filePath, 'utf8');
                const key = file.replace('.json', '').replace(/-/g, '');
                data[key] = JSON.parse(content);
            } catch (error) {
                console.log(`⚠️ Could not load ${file}: ${error.message}`);
                data[file.replace('.json', '').replace(/-/g, '')] = {};
            }
        }
        
        return data;
    }
    
    async loadSelfAnalysis() {
        try {
            const content = await fs.readFile(this.analysisPath, 'utf8');
            this.selfAwareness = { ...this.selfAwareness, ...JSON.parse(content) };
        } catch (error) {
            console.log('📝 Creating new self-analysis file');
        }
    }
    
    async saveSelfAnalysis() {
        try {
            await fs.writeFile(this.analysisPath, JSON.stringify(this.selfAwareness, null, 2));
        } catch (error) {
            console.error('❌ Failed to save self-analysis:', error);
        }
    }
    
    // ==================== CONTINUOUS ANALYSIS ====================
    
    startSelfAnalysisLoop() {
        // Quick analysis every 30 minutes
        setInterval(async () => {
            await this.performSelfAnalysis();
        }, this.analysisInterval);
        
        // Deep analysis every 2 hours
        setInterval(async () => {
            console.log('🔬 Performing deep self-analysis...');
            await this.performDeepAnalysis();
        }, this.deepAnalysisInterval);
        
        // Initial analysis
        setTimeout(() => {
            this.performSelfAnalysis();
        }, 5000); // 5 seconds after startup
    }
    
    async performDeepAnalysis() {
        // This will be expanded in Phase 2
        console.log('🧠 Deep analysis: Identifying long-term patterns...');
        
        const analysis = await this.performSelfAnalysis();
        if (analysis) {
            // Look for trends over time
            const recentHistory = this.selfAwareness.adaptationHistory.slice(-10);
            if (recentHistory.length > 5) {
                const confidenceTrend = this.calculateTrend(recentHistory.map(h => h.confidence));
                console.log(`📈 Confidence trend: ${confidenceTrend > 0 ? 'improving' : 'declining'} (${(confidenceTrend * 100).toFixed(2)}%)`);
            }
        }
    }
    
    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }
    
    // ==================== PUBLIC INTERFACE ====================
    
    getSelfAwareness() {
        return this.selfAwareness;
    }
    
    getConfidenceLevel() {
        return this.selfAwareness.confidenceLevel;
    }
    
    getStrategicRecommendations() {
        return this.selfAwareness.strategicRecommendations;
    }
    
    isPerformingWell() {
        return this.selfAwareness.confidenceLevel > 0.6;
    }
}

module.exports = SelfAnalysisEngine;