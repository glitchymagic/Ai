// Adaptive Strategy Engine - Makes the bot automatically improve its strategies
// This uses self-analysis insights to continuously optimize behavior

const fs = require('fs').promises;
const path = require('path');

class AdaptiveStrategyEngine {
    constructor(selfAnalysisEngine) {
        this.selfAnalysis = selfAnalysisEngine;
        this.dataPath = path.join(__dirname, '../data');
        this.strategiesPath = path.join(this.dataPath, 'adaptive-strategies.json');
        
        // Current active strategies - FIXED: More inclusive defaults
        this.strategies = {
            responseStrategy: {
                preferredTypes: ['contextual', 'enthusiastic', 'helpful'],
                avoidTypes: ['generic'],
                tonePreference: 'adaptive', // casual, formal, adaptive
                lengthPreference: 'medium' // short, medium, long
            },
            engagementStrategy: {
                targetUsers: 'expanding_reach', // FIXED: More inclusive targeting
                priorityTopics: [
                    // FIXED: Expanded topic coverage for better engagement
                    'moonbreon', 'charizard', 'market_trends', 'pikachu', 'pokemon_cards',
                    'tcg', 'grading', 'psa', 'cgc', 'vintage_pokemon', 'japanese_cards',
                    'booster_box', 'pack_opening', 'collection', 'investment'
                ],
                timingStrategy: 'adaptive', // FIXED: More flexible timing
                frequencyLimit: 5 // FIXED: Increased from 3 to allow more learning opportunities
            },
            learningStrategy: {
                focusAreas: ['user_personality', 'market_trends', 'conversation_patterns'],
                adaptationSpeed: 'fast', // FIXED: Faster adaptation to break out of low confidence
                confidenceThreshold: 0.5 // FIXED: Lower threshold to encourage more learning
            },
            marketStrategy: {
                trackingPriority: 'trending_cards', // all_cards, trending_cards, high_value
                predictionConfidence: 0.6,
                priceAlertThreshold: 0.15 // 15% price change
            }
        };
        
        // Strategy performance tracking
        this.strategyPerformance = {
            lastUpdate: null,
            adaptationHistory: [],
            currentEffectiveness: 0,
            improvementRate: 0
        };
        
        this.initialize();
    }
    
    async initialize() {
        await this.loadStrategies();

        // Start strategy adaptation loop
        this.startAdaptationLoop();

        console.log('🎯 Adaptive Strategy Engine initialized - Bot will now self-optimize');
    }

    // Dynamic strategy reload for live updates
    async reloadStrategies() {
        console.log('🔄 Reloading adaptive strategies...');
        await this.loadStrategies();
        console.log('✅ Strategies reloaded - Bot will now use updated learning settings');
        return this.strategies;
    }
    
    // ==================== STRATEGY ADAPTATION ====================
    
    async adaptStrategies() {
        console.log('🔄 Adapting strategies based on self-analysis...');
        
        const selfAwareness = this.selfAnalysis.getSelfAwareness();
        const recommendations = this.selfAnalysis.getStrategicRecommendations();
        
        let adaptationsMade = 0;
        
        // Adapt response strategy
        adaptationsMade += await this.adaptResponseStrategy(selfAwareness, recommendations);
        
        // Adapt engagement strategy
        adaptationsMade += await this.adaptEngagementStrategy(selfAwareness, recommendations);
        
        // Adapt learning strategy
        adaptationsMade += await this.adaptLearningStrategy(selfAwareness, recommendations);
        
        // Adapt market strategy
        adaptationsMade += await this.adaptMarketStrategy(selfAwareness, recommendations);
        
        // Track adaptation
        this.trackAdaptation(adaptationsMade, selfAwareness);
        
        // Save strategies
        await this.saveStrategies();
        
        console.log(`✅ Strategy adaptation complete. Made ${adaptationsMade} optimizations`);
        
        return adaptationsMade;
    }
    
    async adaptResponseStrategy(selfAwareness, recommendations) {
        let adaptations = 0;
        const responseInsights = selfAwareness.performanceInsights;
        
        // If response success rate is low, change strategy
        if (responseInsights.responseSuccess < 10) {
            console.log('📉 Low response success detected - switching to more engaging responses');
            
            // Avoid generic responses more aggressively
            if (!this.strategies.responseStrategy.avoidTypes.includes('generic')) {
                this.strategies.responseStrategy.avoidTypes.push('generic');
                adaptations++;
            }
            
            // Prefer more personal responses
            this.strategies.responseStrategy.preferredTypes = [
                'personal', 'enthusiastic', 'contextual', 'market_insight'
            ];
            adaptations++;
            
            // Switch to more casual tone if formal isn't working
            if (this.strategies.responseStrategy.tonePreference === 'formal') {
                this.strategies.responseStrategy.tonePreference = 'casual';
                adaptations++;
            }
        }
        
        // If success rate is good, reinforce current approach
        if (responseInsights.responseSuccess > 20) {
            console.log('📈 Good response success - reinforcing current strategy');
            this.strategies.responseStrategy.tonePreference = 'adaptive';
        }
        
        // Check specific recommendations
        for (const rec of recommendations) {
            if (rec.category === 'response_strategy') {
                if (rec.action === 'reduce_ineffective_responses') {
                    this.strategies.responseStrategy.avoidTypes.push('low_engagement');
                    adaptations++;
                }
                if (rec.action === 'increase_effective_responses') {
                    this.strategies.responseStrategy.preferredTypes.unshift('high_engagement');
                    adaptations++;
                }
            }
        }
        
        return adaptations;
    }
    
    async adaptEngagementStrategy(selfAwareness, recommendations) {
        let adaptations = 0;
        const userInsights = selfAwareness.performanceInsights;
        const confidence = this.selfAnalysis.getConfidenceLevel();
        
        // FIXED: More nuanced engagement adaptation
        if (userInsights.userEngagement < 1.5) {
            console.log('👥 Low user engagement - expanding reach to gather more data');
            
            // FIXED: Instead of restricting, expand reach when engagement is low
            if (confidence < 0.25) {
                // Very low confidence - cast wider net for learning
                this.strategies.engagementStrategy.targetUsers = 'learning_mode';
                this.strategies.engagementStrategy.frequencyLimit = Math.max(3, this.strategies.engagementStrategy.frequencyLimit);
                adaptations += 2;
            } else {
                // Moderate confidence - balanced approach
                this.strategies.engagementStrategy.targetUsers = 'expanding_reach';
                adaptations++;
            }
            
            // FIXED: More flexible timing when learning
            this.strategies.engagementStrategy.timingStrategy = 'adaptive';
            adaptations++;
        }
        
        // If engagement is good, can be more selective
        if (userInsights.userEngagement > 2.5) {
            console.log('🚀 High user engagement - optimizing for quality');
            this.strategies.engagementStrategy.targetUsers = 'active_collectors';
            this.strategies.engagementStrategy.frequencyLimit = Math.min(7, this.strategies.engagementStrategy.frequencyLimit + 1);
            adaptations++;
        }
        
        // FIXED: Confidence-based strategy adjustment
        if (confidence < 0.2) {
            console.log('🔄 Very low confidence - activating aggressive learning mode');
            this.strategies.engagementStrategy.targetUsers = 'learning_mode';
            this.strategies.engagementStrategy.frequencyLimit = 6;
            adaptations += 2;
        }
        
        return adaptations;
    }
    
    async adaptLearningStrategy(selfAwareness, recommendations) {
        let adaptations = 0;
        const learningInsights = selfAwareness.performanceInsights;
        
        // If learning velocity is low, adjust focus
        if (learningInsights.learningVelocity < 30) {
            console.log('🧠 Low learning velocity - refocusing learning priorities');
            
            // Focus on most impactful areas
            this.strategies.learningStrategy.focusAreas = [
                'conversation_patterns', 'response_effectiveness', 'user_personality'
            ];
            adaptations++;
            
            // Increase adaptation speed
            if (this.strategies.learningStrategy.adaptationSpeed === 'slow') {
                this.strategies.learningStrategy.adaptationSpeed = 'moderate';
                adaptations++;
            }
        }
        
        // If learning is going well, can be more selective
        if (learningInsights.learningVelocity > 60) {
            this.strategies.learningStrategy.confidenceThreshold = 0.8;
            adaptations++;
        }
        
        return adaptations;
    }
    
    async adaptMarketStrategy(selfAwareness, recommendations) {
        let adaptations = 0;
        const marketInsights = selfAwareness.performanceInsights;
        
        // If market accuracy is high, be more aggressive with predictions
        if (marketInsights.marketAccuracy > 70) {
            console.log('📊 High market accuracy - increasing prediction confidence');
            this.strategies.marketStrategy.predictionConfidence = 0.5;
            this.strategies.marketStrategy.trackingPriority = 'all_cards';
            adaptations++;
        }
        
        // If accuracy is low, be more conservative
        if (marketInsights.marketAccuracy < 40) {
            console.log('⚠️ Low market accuracy - being more conservative');
            this.strategies.marketStrategy.predictionConfidence = 0.8;
            this.strategies.marketStrategy.trackingPriority = 'trending_cards';
            adaptations++;
        }
        
        return adaptations;
    }
    
    // ==================== STRATEGY APPLICATION ====================
    
    getResponseStrategy(context = {}) {
        const strategy = this.strategies.responseStrategy;
        
        return {
            preferredTypes: strategy.preferredTypes,
            avoidTypes: strategy.avoidTypes,
            tone: this.determineTone(strategy.tonePreference, context),
            length: strategy.lengthPreference,
            confidence: this.selfAnalysis.getConfidenceLevel()
        };
    }
    
    getEngagementStrategy(context = {}) {
        const strategy = this.strategies.engagementStrategy;
        const shouldEngage = this.shouldEngage(context);
        const engagementReason = this.getEngagementReason(context);
        
        return {
            shouldEngage,
            engagementReason,
            targetUsers: strategy.targetUsers,
            priorityTopics: strategy.priorityTopics,
            maxFrequency: strategy.frequencyLimit,
            timing: strategy.timingStrategy,
            confidence: this.selfAnalysis.getConfidenceLevel()
        };
    }
    
    // Helper to explain why engagement decision was made
    getEngagementReason(context) {
        const strategy = this.strategies.engagementStrategy;
        const confidence = this.selfAnalysis.getConfidenceLevel();
        
        if (confidence < 0.15) {
            return 'skipped_low_confidence';
        }
        
        if (this.isHighEngagementTweet(context)) {
            return 'high_engagement_tweet';
        }
        
        if (this.isLearningOpportunity(context)) {
            return 'learning_opportunity';
        }
        
        if (strategy.targetUsers === 'learning_mode') {
            return 'learning_mode_active';
        }
        
        const hasPriorityTopic = context.topics?.some(topic => 
            strategy.priorityTopics.some(priority => 
                topic.toLowerCase().includes(priority.toLowerCase())
            )
        );
        
        if (hasPriorityTopic) {
            return 'priority_topic_match';
        }
        
        if (confidence < 0.25) {
            return 'low_confidence_data_gathering';
        }
        
        return 'standard_engagement';
    }
    
    getLearningStrategy() {
        return {
            ...this.strategies.learningStrategy,
            isConfident: this.selfAnalysis.getConfidenceLevel() > this.strategies.learningStrategy.confidenceThreshold
        };
    }
    
    getMarketStrategy() {
        return {
            ...this.strategies.marketStrategy,
            shouldMakePrediction: this.selfAnalysis.getConfidenceLevel() > this.strategies.marketStrategy.predictionConfidence
        };
    }
    
    // ==================== STRATEGY HELPERS ====================
    
    determineTone(preference, context) {
        if (preference === 'adaptive') {
            // Use self-analysis to determine best tone
            const userEngagement = this.selfAnalysis.getSelfAwareness().performanceInsights?.userEngagement || 0;
            
            if (userEngagement > 2) {
                return 'casual'; // High engagement users prefer casual
            } else if (context.userProfile?.personality?.formality > 0.7) {
                return 'formal'; // Formal users prefer formal
            } else {
                return 'casual'; // Default to casual
            }
        }
        
        return preference;
    }
    
    shouldEngage(context) {
        const strategy = this.strategies.engagementStrategy;
        const confidence = this.selfAnalysis.getConfidenceLevel();
        
        // FIXED: Lower confidence threshold to break death spiral (30% → 15%)
        if (confidence < 0.15) {
            return false;
        }
        
        // FIXED: Graduated engagement based on targeting strategy
        switch (strategy.targetUsers) {
            case 'active_collectors':
                // Original restrictive mode - only for high confidence periods
                if (context.userProfile?.interactions < 2) {
                    return false;
                }
                break;
                
            case 'expanding_reach':
                // Moderate mode - engage with 1+ interactions OR high engagement tweets
                if (context.userProfile?.interactions < 1 && !this.isHighEngagementTweet(context)) {
                    return false;
                }
                break;
                
            case 'learning_mode':
                // Aggressive learning mode - engage with almost anyone for data collection
                // Only skip completely new users with low engagement tweets
                if (!context.userProfile?.interactions && !this.isHighEngagementTweet(context) && !this.isLearningOpportunity(context)) {
                    return false;
                }
                break;
                
            case 'all':
                // No user restrictions
                break;
        }
        
        // FIXED: More flexible topic matching based on confidence level
        if (context.topics && strategy.priorityTopics.length > 0) {
            const hasPriorityTopic = context.topics.some(topic => 
                strategy.priorityTopics.some(priority => 
                    topic.toLowerCase().includes(priority.toLowerCase())
                )
            );
            
            // Flexible topic matching based on confidence and other factors
            if (!hasPriorityTopic) {
                // Allow engagement if ANY of these conditions are met:
                const allowEngagement = 
                    this.isHighEngagementTweet(context) ||           // High engagement tweet
                    this.isLearningOpportunity(context) ||           // Learning opportunity
                    confidence < 0.25 ||                             // Very low confidence (need data)
                    strategy.targetUsers === 'learning_mode' ||      // In learning mode
                    (context.userProfile?.interactions || 0) === 0;  // New user (learning opportunity)
                
                if (!allowEngagement) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // Helper to identify high-engagement tweets worth responding to
    isHighEngagementTweet(context) {
        if (!context.tweetMetrics) return false;
        
        const likes = context.tweetMetrics.likes || 0;
        const retweets = context.tweetMetrics.retweets || 0;
        const replies = context.tweetMetrics.replies || 0;
        
        // Consider high engagement if tweet has significant interaction
        return likes > 10 || retweets > 5 || replies > 3;
    }
    
    // Helper to identify learning opportunities
    isLearningOpportunity(context) {
        if (!context.topics) return false;
        
        // Learning opportunities: questions, new trends, educational content
        const learningKeywords = [
            'question', 'help', 'advice', 'how to', 'what is', 'explain',
            'new to', 'beginner', 'first time', 'learning', 'confused',
            'trending', 'hot', 'popular', 'viral', 'breaking'
        ];
        
        const tweetText = context.tweetText?.toLowerCase() || '';
        return learningKeywords.some(keyword => tweetText.includes(keyword));
    }
    
    // ==================== PERFORMANCE TRACKING ====================
    
    trackAdaptation(adaptationsMade, selfAwareness) {
        const now = Date.now();
        const currentEffectiveness = this.calculateOverallEffectiveness(selfAwareness);
        
        this.strategyPerformance.adaptationHistory.push({
            timestamp: now,
            adaptationsMade,
            effectiveness: currentEffectiveness,
            confidence: this.selfAnalysis.getConfidenceLevel()
        });
        
        // Calculate improvement rate
        if (this.strategyPerformance.adaptationHistory.length > 1) {
            const previous = this.strategyPerformance.adaptationHistory[this.strategyPerformance.adaptationHistory.length - 2];
            this.strategyPerformance.improvementRate = currentEffectiveness - previous.effectiveness;
        }
        
        this.strategyPerformance.lastUpdate = now;
        this.strategyPerformance.currentEffectiveness = currentEffectiveness;
        
        // Keep only last 48 hours of history
        const twoDaysAgo = now - 48 * 60 * 60 * 1000;
        this.strategyPerformance.adaptationHistory = this.strategyPerformance.adaptationHistory
            .filter(entry => entry.timestamp > twoDaysAgo);
    }
    
    calculateOverallEffectiveness(selfAwareness) {
        const insights = selfAwareness.performanceInsights || {};
        
        // Weighted average of key metrics
        const weights = {
            responseSuccess: 0.3,
            userEngagement: 0.3,
            learningVelocity: 0.2,
            marketAccuracy: 0.2
        };
        
        let effectiveness = 0;
        let totalWeight = 0;
        
        Object.keys(weights).forEach(metric => {
            if (insights[metric] !== undefined) {
                effectiveness += (insights[metric] / 100) * weights[metric];
                totalWeight += weights[metric];
            }
        });
        
        return totalWeight > 0 ? (effectiveness / totalWeight) * 100 : 0;
    }
    
    // ==================== PERSISTENCE ====================
    
    async loadStrategies() {
        try {
            const content = await fs.readFile(this.strategiesPath, 'utf8');
            const saved = JSON.parse(content);
            this.strategies = { ...this.strategies, ...saved.strategies };
            this.strategyPerformance = { ...this.strategyPerformance, ...saved.performance };
        } catch (error) {
            console.log('📝 Creating new adaptive strategies file');
        }
    }
    
    async saveStrategies() {
        try {
            const data = {
                strategies: this.strategies,
                performance: this.strategyPerformance,
                lastSaved: Date.now()
            };
            await fs.writeFile(this.strategiesPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save adaptive strategies:', error);
        }
    }
    
    // ==================== ADAPTATION LOOP ====================
    
    startAdaptationLoop() {
        // Adapt strategies every hour
        setInterval(async () => {
            if (this.selfAnalysis.getSelfAwareness().lastAnalysis) {
                await this.adaptStrategies();
            }
        }, 60 * 60 * 1000); // 1 hour
        
        // Initial adaptation after 10 minutes
        setTimeout(async () => {
            await this.adaptStrategies();
        }, 10 * 60 * 1000);
    }
    
    // ==================== PUBLIC INTERFACE ====================
    
    getCurrentStrategies() {
        return this.strategies;
    }
    
    getPerformanceMetrics() {
        return this.strategyPerformance;
    }
    
    isAdaptingWell() {
        return this.strategyPerformance.improvementRate > 0;
    }
    
    getAdaptationSummary() {
        const recent = this.strategyPerformance.adaptationHistory.slice(-5);
        const totalAdaptations = recent.reduce((sum, entry) => sum + entry.adaptationsMade, 0);
        
        return {
            recentAdaptations: totalAdaptations,
            currentEffectiveness: this.strategyPerformance.currentEffectiveness,
            improvementRate: this.strategyPerformance.improvementRate,
            isImproving: this.strategyPerformance.improvementRate > 0
        };
    }
}

module.exports = AdaptiveStrategyEngine;