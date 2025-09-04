// Advanced Learning Engine
// Makes the bot smarter over time by learning from every interaction

const fs = require('fs').promises;
const path = require('path');

class LearningEngine {
    constructor() {
        this.dataPath = path.join(__dirname, '../data');
        
        // Core learning databases
        this.userProfiles = new Map();        // Detailed user personality profiles
        this.responseEffectiveness = new Map(); // Track which responses work
        this.conversationPatterns = new Map();  // Learn conversation flows
        this.marketInsights = new Map();        // Learn from price discussions
        this.communityTrends = new Map();       // Track what's hot
        
        // Learning metrics
        this.metrics = {
            totalInteractions: 0,
            successfulEngagements: 0,
            learnedPatterns: 0,
            marketPredictions: 0,
            accuratePredictions: 0
        };
        
        this.initialize();
    }
    
    async initialize() {
        await this.loadLearningData();
        console.log(`🧠 Learning Engine initialized with ${this.userProfiles.size} user profiles`);
    }
    
    // ==================== USER PROFILING ====================
    
    async learnFromInteraction(interaction) {
        const {
            username,
            message,
            botResponse,
            hasImages,
            sentiment,
            topics,
            timestamp = Date.now()
        } = interaction;
        
        // Get or create user profile
        let profile = this.userProfiles.get(username) || {
            username,
            firstSeen: timestamp,
            lastSeen: timestamp,
            interactions: 0,
            personality: {
                formality: 0.5,      // 0 = very casual, 1 = very formal
                enthusiasm: 0.5,     // 0 = reserved, 1 = very enthusiastic
                expertise: 0.5,      // 0 = beginner, 1 = expert
                priceAwareness: 0.5, // 0 = casual collector, 1 = investor
                humor: 0.5          // 0 = serious, 1 = loves memes
            },
            interests: {},
            responsePreferences: {},
            engagementRate: 1.0,
            trustScore: 0.5
        };
        
        // Update basic metrics
        profile.interactions++;
        profile.lastSeen = timestamp;
        
        // Analyze message style
        this.updatePersonalityTraits(profile, message, sentiment);
        
        // Track interests
        this.updateInterests(profile, topics, message);
        
        // Store profile
        this.userProfiles.set(username, profile);
        
        // Track response effectiveness
        await this.trackResponseEffectiveness(username, botResponse, interaction);
        
        // Learn conversation patterns
        this.learnConversationPattern(interaction);
        
        // Save periodically
        if (this.metrics.totalInteractions % 10 === 0) {
            await this.saveLearningData();
        }
        
        this.metrics.totalInteractions++;
    }
    
    updatePersonalityTraits(profile, message, sentiment) {
        const msgLower = message.toLowerCase();
        
        // Formality analysis
        const casualMarkers = ['lol', 'lmao', 'fr', 'ngl', 'gonna', 'wanna', 'yall', '!!', '???'];
        const formalMarkers = ['please', 'thank you', 'would', 'could', 'appreciate'];
        
        const casualCount = casualMarkers.filter(m => msgLower.includes(m)).length;
        const formalCount = formalMarkers.filter(m => msgLower.includes(m)).length;
        
        // Adjust formality score
        if (casualCount > formalCount) {
            profile.personality.formality = Math.max(0, profile.personality.formality - 0.05);
        } else if (formalCount > casualCount) {
            profile.personality.formality = Math.min(1, profile.personality.formality + 0.05);
        }
        
        // Enthusiasm based on punctuation and emojis
        const exclamationCount = (message.match(/!/g) || []).length;
        const emojiCount = (message.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
        const enthusiasmSignal = (exclamationCount + emojiCount) / Math.max(message.length / 50, 1);
        
        profile.personality.enthusiasm = this.smoothUpdate(
            profile.personality.enthusiasm,
            Math.min(1, enthusiasmSignal * 0.3)
        );
        
        // Price awareness
        const priceTerms = ['worth', 'value', 'price', '$', 'sell', 'buy', 'market', 'investment'];
        const hasPriceInterest = priceTerms.some(term => msgLower.includes(term));
        
        if (hasPriceInterest) {
            profile.personality.priceAwareness = Math.min(1, profile.personality.priceAwareness + 0.1);
        }
        
        // Expertise based on terminology
        const expertTerms = ['psa', 'cgc', 'bgs', 'raw', 'nm', 'mint', 'centering', 'surface', 'edges', 'corners', 'pop report', 'market cap'];
        const expertiseSignal = expertTerms.filter(term => msgLower.includes(term)).length;
        
        if (expertiseSignal > 0) {
            profile.personality.expertise = Math.min(1, profile.personality.expertise + 0.05 * expertiseSignal);
        }
    }
    
    updateInterests(profile, topics, message) {
        // Track mentioned cards
        const cardMentions = this.extractCardMentions(message);
        cardMentions.forEach(card => {
            profile.interests[card] = (profile.interests[card] || 0) + 1;
        });
        
        // Track topics
        const topicKeywords = {
            'vintage': ['base set', 'wotc', 'shadowless', '1st edition', 'neo', 'gym'],
            'modern': ['vmax', 'vstar', 'ex', 'gx', 'alt art', 'secret rare'],
            'investing': ['hold', 'sell', 'buy', 'investment', 'portfolio', 'return'],
            'playing': ['deck', 'tournament', 'locals', 'regionals', 'meta', 'competitive'],
            'collecting': ['binder', 'collection', 'complete set', 'master set', 'chase card']
        };
        
        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
            if (keywords.some(kw => message.toLowerCase().includes(kw))) {
                profile.interests[topic] = (profile.interests[topic] || 0) + 1;
            }
        });
    }
    
    // ==================== RESPONSE EFFECTIVENESS ====================
    
    async trackResponseEffectiveness(username, botResponse, interaction) {
        const responseKey = this.generateResponseKey(botResponse);
        
        let effectiveness = this.responseEffectiveness.get(responseKey) || {
            pattern: responseKey,
            uses: 0,
            engagements: 0,
            positiveOutcomes: 0,
            contexts: []
        };
        
        effectiveness.uses++;
        effectiveness.contexts.push({
            sentiment: interaction.sentiment,
            hasImages: interaction.hasImages,
            topics: interaction.topics,
            timestamp: Date.now()
        });
        
        // We'll update engagement metrics when we see if user responds
        this.responseEffectiveness.set(responseKey, effectiveness);
    }
    
    generateResponseKey(response) {
        // Extract pattern from response
        const patterns = {
            'price_mention': /\$\d+/,
            'question': /\?$/,
            'excitement': /!{2,}|🔥|🚀/,
            'data_driven': /\d+%|\d+\s*(sales|volume)/,
            'personal': /@\w+/,
            'emoji_heavy': /([\u{1F300}-\u{1F9FF}].*){3,}/u
        };
        
        const matchedPatterns = [];
        Object.entries(patterns).forEach(([name, regex]) => {
            if (regex.test(response)) {
                matchedPatterns.push(name);
            }
        });
        
        return matchedPatterns.join('_') || 'generic';
    }
    
    // ==================== CONVERSATION PATTERNS ====================
    
    learnConversationPattern(interaction) {
        const { message, sentiment, topics } = interaction;
        
        // Create pattern signature
        const pattern = {
            triggerType: this.classifyTrigger(message),
            sentiment,
            hasQuestion: message.includes('?'),
            hasPriceQuery: /worth|value|price|how much/i.test(message),
            topics: topics || []
        };
        
        const patternKey = JSON.stringify(pattern);
        const existing = this.conversationPatterns.get(patternKey) || {
            pattern,
            occurrences: 0,
            successfulResponses: []
        };
        
        existing.occurrences++;
        this.conversationPatterns.set(patternKey, existing);
        this.metrics.learnedPatterns = this.conversationPatterns.size;
    }
    
    classifyTrigger(message) {
        const triggers = {
            'showcase': ['pulled', 'got', 'opened', 'found', 'check out'],
            'question': ['what', 'how', 'when', 'where', 'why', 'is this'],
            'market': ['worth', 'value', 'sell', 'buy', 'price'],
            'opinion': ['think', 'thoughts', 'opinion', 'feel'],
            'news': ['announced', 'released', 'coming', 'new set']
        };
        
        for (const [type, keywords] of Object.entries(triggers)) {
            if (keywords.some(kw => message.toLowerCase().includes(kw))) {
                return type;
            }
        }
        
        return 'general';
    }
    
    // ==================== MARKET INTELLIGENCE ====================
    
    async learnFromMarketDiscussion(message, username) {
        const priceMatches = message.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
        const cardMentions = this.extractCardMentions(message);
        
        if (priceMatches && cardMentions.length > 0) {
            cardMentions.forEach(card => {
                const insight = this.marketInsights.get(card) || {
                    card,
                    priceMentions: [],
                    sentiment: [],
                    lastUpdated: Date.now()
                };
                
                priceMatches.forEach(price => {
                    insight.priceMentions.push({
                        price: parseFloat(price.replace(/[$,]/g, '')),
                        username,
                        timestamp: Date.now(),
                        context: message.substring(0, 100)
                    });
                });
                
                // Determine sentiment
                const sentiment = this.analyzePriceSentiment(message);
                insight.sentiment.push({ sentiment, timestamp: Date.now() });
                
                this.marketInsights.set(card, insight);
            });
        }
    }
    
    analyzePriceSentiment(message) {
        const bullish = ['moon', 'up', 'rising', 'hot', 'fire', '🚀', '📈', 'pump'];
        const bearish = ['crash', 'down', 'falling', 'dump', 'sell', '📉', 'overpriced'];
        
        const bullScore = bullish.filter(term => message.toLowerCase().includes(term)).length;
        const bearScore = bearish.filter(term => message.toLowerCase().includes(term)).length;
        
        if (bullScore > bearScore) return 'bullish';
        if (bearScore > bullScore) return 'bearish';
        return 'neutral';
    }
    
    // ==================== PREDICTION TRACKING ====================
    
    async trackPrediction(card, prediction, confidence) {
        const predictionId = `pred_${Date.now()}`;
        
        const pred = {
            id: predictionId,
            card,
            prediction,
            confidence,
            timestamp: Date.now(),
            outcome: null // Will be updated later
        };
        
        // Store for future validation
        this.marketInsights.set(predictionId, pred);
        this.metrics.marketPredictions++;
        
        return predictionId;
    }
    
    async validatePrediction(predictionId, actualOutcome) {
        const pred = this.marketInsights.get(predictionId);
        if (pred) {
            pred.outcome = actualOutcome;
            if (actualOutcome === 'correct') {
                this.metrics.accuratePredictions++;
            }
        }
    }
    
    // ==================== RECOMMENDATION ENGINE ====================
    
    getResponseRecommendation(username, context) {
        const profile = this.userProfiles.get(username);
        if (!profile) return null;
        
        const recommendations = {
            style: this.getStyleRecommendation(profile),
            topics: this.getTopicRecommendation(profile),
            approach: this.getApproachRecommendation(profile, context)
        };
        
        return recommendations;
    }
    
    getStyleRecommendation(profile) {
        const { formality, enthusiasm, humor } = profile.personality;
        
        if (formality < 0.3) {
            return 'casual'; // "yo, sick pull!"
        } else if (formality > 0.7) {
            return 'professional'; // "Excellent acquisition. Market value..."
        } else {
            return 'balanced'; // "Nice pull! That's worth..."
        }
    }
    
    getTopicRecommendation(profile) {
        // Find user's top interests
        const sortedInterests = Object.entries(profile.interests)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([topic]) => topic);
            
        return sortedInterests;
    }
    
    getApproachRecommendation(profile, context) {
        const { priceAwareness, expertise } = profile.personality;
        
        if (context.isPriceQuestion && priceAwareness > 0.7) {
            return 'data_heavy'; // Full market analysis
        } else if (expertise < 0.3) {
            return 'educational'; // Explain basics
        } else if (expertise > 0.7) {
            return 'expert'; // Technical discussion
        }
        
        return 'balanced';
    }
    
    // ==================== COMMUNITY INSIGHTS ====================
    
    async updateCommunityTrends(topic, sentiment, volume = 1) {
        const trend = this.communityTrends.get(topic) || {
            topic,
            mentions: 0,
            sentiment: { positive: 0, negative: 0, neutral: 0 },
            momentum: 0,
            lastUpdated: Date.now()
        };
        
        trend.mentions += volume;
        trend.sentiment[sentiment]++;
        trend.lastUpdated = Date.now();
        
        // Calculate momentum (recent activity)
        const hoursSinceUpdate = (Date.now() - trend.lastUpdated) / (1000 * 60 * 60);
        trend.momentum = trend.mentions / Math.max(hoursSinceUpdate, 1);
        
        this.communityTrends.set(topic, trend);
    }
    
    getHotTopics(limit = 5) {
        return Array.from(this.communityTrends.values())
            .sort((a, b) => b.momentum - a.momentum)
            .slice(0, limit);
    }
    
    // ==================== LEARNING FEEDBACK LOOP ====================
    
    async recordEngagementOutcome(username, responseId, outcome) {
        const profile = this.userProfiles.get(username);
        if (!profile) return;
        
        // Update user engagement rate
        if (outcome === 'positive') {
            profile.engagementRate = Math.min(1.2, profile.engagementRate * 1.05);
            profile.trustScore = Math.min(1, profile.trustScore + 0.02);
            this.metrics.successfulEngagements++;
        } else if (outcome === 'negative') {
            profile.engagementRate = Math.max(0.5, profile.engagementRate * 0.95);
        }
        
        // Update response effectiveness
        const response = this.responseEffectiveness.get(responseId);
        if (response) {
            response.engagements++;
            if (outcome === 'positive') {
                response.positiveOutcomes++;
            }
        }
    }
    
    // ==================== UTILITY METHODS ====================
    
    extractCardMentions(message) {
        // Common Pokemon card patterns
        const cardPatterns = [
            /(\w+)\s*(VMAX|VSTAR|V|GX|EX|ex)\s*(Alt Art)?/gi,
            /(Charizard|Pikachu|Umbreon|Rayquaza|Lugia|Giratina)\s*\w*/gi,
            /\b(moonbreon|zard|pika|base set|shadowless)\b/gi
        ];
        
        const mentions = new Set();
        cardPatterns.forEach(pattern => {
            const matches = message.match(pattern);
            if (matches) {
                matches.forEach(match => mentions.add(match.toLowerCase()));
            }
        });
        
        return Array.from(mentions);
    }
    
    smoothUpdate(currentValue, newValue, weight = 0.1) {
        return currentValue * (1 - weight) + newValue * weight;
    }
    
    // ==================== PERSISTENCE ====================
    
    async loadLearningData() {
        try {
            const files = [
                { name: 'user-profiles.json', target: this.userProfiles },
                { name: 'response-effectiveness.json', target: this.responseEffectiveness },
                { name: 'conversation-patterns.json', target: this.conversationPatterns },
                { name: 'market-insights.json', target: this.marketInsights },
                { name: 'community-trends.json', target: this.communityTrends }
            ];
            
            for (const { name, target } of files) {
                const filePath = path.join(this.dataPath, name);
                try {
                    const data = await fs.readFile(filePath, 'utf8');
                    const parsed = JSON.parse(data);
                    Object.entries(parsed).forEach(([key, value]) => {
                        target.set(key, value);
                    });
                } catch (err) {
                    // File doesn't exist yet, that's okay
                }
            }
            
            // Load metrics
            try {
                const metricsPath = path.join(this.dataPath, 'learning-metrics.json');
                const metricsData = await fs.readFile(metricsPath, 'utf8');
                this.metrics = JSON.parse(metricsData);
            } catch (err) {
                // Use default metrics
            }
            
        } catch (error) {
            console.error('Error loading learning data:', error);
        }
    }
    
    async saveLearningData() {
        try {
            const files = [
                { name: 'user-profiles.json', source: this.userProfiles },
                { name: 'response-effectiveness.json', source: this.responseEffectiveness },
                { name: 'conversation-patterns.json', source: this.conversationPatterns },
                { name: 'market-insights.json', source: this.marketInsights },
                { name: 'community-trends.json', source: this.communityTrends }
            ];
            
            for (const { name, source } of files) {
                const filePath = path.join(this.dataPath, name);
                const data = Object.fromEntries(source);
                await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            }
            
            // Save metrics
            const metricsPath = path.join(this.dataPath, 'learning-metrics.json');
            await fs.writeFile(metricsPath, JSON.stringify(this.metrics, null, 2));
            
        } catch (error) {
            console.error('Error saving learning data:', error);
        }
    }
    
    // ==================== INSIGHTS GENERATION ====================
    
    generateInsights() {
        const insights = {
            userInsights: this.generateUserInsights(),
            marketInsights: this.generateMarketInsights(),
            performanceInsights: this.generatePerformanceInsights(),
            recommendations: this.generateRecommendations()
        };
        
        return insights;
    }
    
    generateUserInsights() {
        const profiles = Array.from(this.userProfiles.values());
        
        return {
            totalUsers: profiles.length,
            avgFormality: profiles.reduce((sum, p) => sum + p.personality.formality, 0) / profiles.length,
            highValueUsers: profiles.filter(p => p.trustScore > 0.8).map(p => p.username),
            mostEngaged: profiles.sort((a, b) => b.interactions - a.interactions).slice(0, 5)
        };
    }
    
    generateMarketInsights() {
        const accuracy = this.metrics.marketPredictions > 0 
            ? (this.metrics.accuratePredictions / this.metrics.marketPredictions * 100).toFixed(1)
            : 0;
            
        return {
            predictionAccuracy: `${accuracy}%`,
            hotCards: Array.from(this.marketInsights.entries())
                .filter(([key]) => !key.startsWith('pred_'))
                .sort((a, b) => b[1].priceMentions.length - a[1].priceMentions.length)
                .slice(0, 5)
                .map(([card]) => card)
        };
    }
    
    generatePerformanceInsights() {
        const successRate = this.metrics.totalInteractions > 0
            ? (this.metrics.successfulEngagements / this.metrics.totalInteractions * 100).toFixed(1)
            : 0;
            
        return {
            engagementSuccessRate: `${successRate}%`,
            bestResponsePatterns: Array.from(this.responseEffectiveness.entries())
                .filter(([_, data]) => data.uses > 5)
                .sort((a, b) => {
                    const aRate = a[1].positiveOutcomes / a[1].uses;
                    const bRate = b[1].positiveOutcomes / b[1].uses;
                    return bRate - aRate;
                })
                .slice(0, 3)
                .map(([pattern]) => pattern)
        };
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        // Check if we need more price data
        if (this.marketInsights.size < 50) {
            recommendations.push('Engage more with price discussions to build market intelligence');
        }
        
        // Check user diversity
        const avgInteractions = Array.from(this.userProfiles.values())
            .reduce((sum, p) => sum + p.interactions, 0) / this.userProfiles.size;
        
        if (avgInteractions < 3) {
            recommendations.push('Focus on building deeper relationships with existing users');
        }
        
        return recommendations;
    }
}

module.exports = LearningEngine;