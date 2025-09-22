class UserInteractionHistory {
    constructor() {
        this.users = new Map();
        this.maxHistoryPerUser = 50;
        this.maxUsers = 10000; // Prevent memory issues
        this.cleanupInterval = 60 * 60 * 1000; // 1 hour
        this.startCleanupTimer();
    }

    async initialize() {
        try {
            console.log('   📝 Starting with fresh user memory');
            // Initialize any data loading here if needed
            // For now, we start fresh each time
            return true;
        } catch (error) {
            console.error('UserInteractionHistory initialization error:', error);
            return false;
        }
    }

    recordInteraction(userId, interactionOrText, tweetId = null) {
        if (!userId) return;

        // Initialize user if not exists
        if (!this.users.has(userId)) {
            this.users.set(userId, {
                interactions: [],
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                stats: {
                    totalInteractions: 0,
                    intents: {},
                    responseTypes: {},
                    avgResponseTime: 0,
                    favoriteTopics: [],
                    engagementLevel: 'new'
                },
                preferences: {
                    responseStyle: 'balanced',
                    topics: [],
                    communicationStyle: 'casual'
                }
            });
        }

        const user = this.users.get(userId);
        const timestamp = Date.now();

        // Support both object and (text, tweetId) signatures
        let interactionRecord;
        if (typeof interactionOrText === 'string') {
            interactionRecord = {
                id: this.generateInteractionId(),
                timestamp,
                userText: interactionOrText,
                tweetId
            };
        } else {
            interactionRecord = {
                id: this.generateInteractionId(),
                timestamp,
                ...(interactionOrText || {})
            };
        }

        user.interactions.push(interactionRecord);
        user.lastSeen = timestamp;
        user.stats.totalInteractions++;

        // Maintain max history limit
        if (user.interactions.length > this.maxHistoryPerUser) {
            user.interactions = user.interactions.slice(-this.maxHistoryPerUser);
        }

        // Update stats
        this.updateUserStats(user, interactionRecord);

        // Clean up old users if we have too many
        this.enforceUserLimit();
    }

    // Simple safeguards used by the bot to throttle repeated users
    shouldSkipUser(userId) {
        const user = this.users.get(userId);
        if (!user) return false;
        // Skip if we interacted very recently (within 30 minutes)
        const last = user.interactions[user.interactions.length - 1];
        if (!last) return false;
        return (Date.now() - last.timestamp) < (30 * 60 * 1000);
    }

    hasHadConversation(userId, text) {
        const user = this.users.get(userId);
        if (!user) return false;
        const lower = (text || '').toLowerCase();
        // If we have 2+ prior interactions with same user and similar text, treat as already conversed
        const similar = user.interactions.filter(i => (i.userText || '').toLowerCase() === lower);
        return similar.length >= 1;
    }

    updateUserStats(user, interaction) {
        const stats = user.stats;

        // Update intent frequency
        if (interaction.intent) {
            stats.intents[interaction.intent] = (stats.intents[interaction.intent] || 0) + 1;
        }

        // Update response type frequency
        if (interaction.responseType) {
            stats.responseTypes[interaction.responseType] = (stats.responseTypes[interaction.responseType] || 0) + 1;
        }

        // Update engagement level
        if (stats.totalInteractions < 5) {
            stats.engagementLevel = 'new';
        } else if (stats.totalInteractions < 20) {
            stats.engagementLevel = 'regular';
        } else if (stats.totalInteractions < 50) {
            stats.engagementLevel = 'active';
        } else {
            stats.engagementLevel = 'power_user';
        }

        // Update favorite topics
        this.updateFavoriteTopics(user);

        // Update response time average
        if (interaction.responseTime) {
            const totalTime = stats.avgResponseTime * (stats.totalInteractions - 1);
            stats.avgResponseTime = (totalTime + interaction.responseTime) / stats.totalInteractions;
        }
    }

    updateFavoriteTopics(user) {
        const intents = user.stats.intents;
        const sortedIntents = Object.entries(intents)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

        user.stats.favoriteTopics = sortedIntents.map(([intent]) => intent);
    }

    getUserHistory(userId, limit = 10) {
        const user = this.users.get(userId);
        if (!user) {
            return {
                exists: false,
                interactions: [],
                stats: null
            };
        }

        return {
            exists: true,
            interactions: user.interactions.slice(-limit),
            stats: user.stats,
            preferences: user.preferences,
            firstSeen: user.firstSeen,
            lastSeen: user.lastSeen
        };
    }

    getUserStats(userId) {
        const user = this.users.get(userId);
        return user ? user.stats : null;
    }

    getUserPreferences(userId) {
        const user = this.users.get(userId);
        return user ? user.preferences : {
            responseStyle: 'balanced',
            topics: [],
            communicationStyle: 'casual'
        };
    }

    updateUserPreferences(userId, preferences) {
        const user = this.users.get(userId);
        if (user) {
            user.preferences = {
                ...user.preferences,
                ...preferences
            };
        }
    }

    analyzeUserBehavior(userId) {
        const user = this.users.get(userId);
        if (!user || user.interactions.length < 3) {
            return {
                behaviorPattern: 'insufficient_data',
                recommendations: ['continue_interacting']
            };
        }

        const interactions = user.interactions;
        const recentInteractions = interactions.slice(-10);

        // Analyze interaction patterns
        const patterns = {
            responseTimePreference: this.analyzeResponseTimePreference(recentInteractions),
            topicConsistency: this.analyzeTopicConsistency(recentInteractions),
            engagementTrend: this.analyzeEngagementTrend(interactions),
            communicationStyle: this.analyzeCommunicationStyle(recentInteractions)
        };

        // Generate recommendations
        const recommendations = this.generateBehaviorRecommendations(patterns, user.stats);

        return {
            behaviorPattern: patterns,
            recommendations,
            confidence: this.calculateBehaviorConfidence(interactions)
        };
    }

    analyzeResponseTimePreference(interactions) {
        const responseTimes = interactions
            .filter(i => i.responseTime)
            .map(i => i.responseTime);

        if (responseTimes.length === 0) return 'unknown';

        const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

        if (avgTime < 5000) return 'fast_responses';
        if (avgTime < 30000) return 'normal_responses';
        return 'patient_user';
    }

    analyzeTopicConsistency(interactions) {
        const intents = interactions.map(i => i.intent).filter(Boolean);
        if (intents.length === 0) return 'varied';

        const primaryIntent = intents[0];
        const consistency = intents.filter(i => i === primaryIntent).length / intents.length;

        if (consistency > 0.7) return 'focused';
        if (consistency > 0.4) return 'somewhat_consistent';
        return 'varied';
    }

    analyzeEngagementTrend(interactions) {
        if (interactions.length < 5) return 'too_early';

        const recent = interactions.slice(-5);
        const older = interactions.slice(-10, -5);

        const recentAvg = recent.reduce((sum, i) => sum + (i.engagement || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum, i) => sum + (i.engagement || 0), 0) / older.length;

        if (recentAvg > olderAvg * 1.2) return 'increasing';
        if (recentAvg < olderAvg * 0.8) return 'decreasing';
        return 'stable';
    }

    analyzeCommunicationStyle(interactions) {
        const texts = interactions.map(i => i.userText || '').filter(t => t.length > 0);

        if (texts.length === 0) return 'unknown';

        let totalLength = 0;
        let questionCount = 0;
        let exclamationCount = 0;
        let casualIndicators = 0;

        for (const text of texts) {
            totalLength += text.length;
            if (text.includes('?')) questionCount++;
            if (text.includes('!')) exclamationCount++;
            if (/\b(lol|omg|brb|idk|k|thx)\b/i.test(text)) casualIndicators++;
        }

        const avgLength = totalLength / texts.length;
        const questionRatio = questionCount / texts.length;
        const exclamationRatio = exclamationCount / texts.length;
        const casualRatio = casualIndicators / texts.length;

        if (casualRatio > 0.3) return 'very_casual';
        if (questionRatio > 0.3) return 'question_oriented';
        if (exclamationRatio > 0.2) return 'enthusiastic';
        if (avgLength > 100) return 'detailed';
        return 'standard';
    }

    generateBehaviorRecommendations(patterns, stats) {
        const recommendations = [];

        if (patterns.engagementTrend === 'decreasing') {
            recommendations.push('increase_engagement');
        }

        if (patterns.topicConsistency === 'focused' && stats.favoriteTopics.length > 0) {
            recommendations.push('personalize_content');
        }

        if (patterns.responseTimePreference === 'fast_responses') {
            recommendations.push('prioritize_speed');
        }

        if (patterns.communicationStyle === 'question_oriented') {
            recommendations.push('be_more_interactive');
        }

        if (stats.engagementLevel === 'new') {
            recommendations.push('welcome_new_user');
        }

        return recommendations;
    }

    calculateBehaviorConfidence(interactions) {
        const baseConfidence = Math.min(interactions.length / 10, 1.0);
        const recencyFactor = interactions.length > 0 ?
            Math.min((Date.now() - interactions[0].timestamp) / (30 * 24 * 60 * 60 * 1000), 1.0) : 0;

        return (baseConfidence + recencyFactor) / 2;
    }

    getConversationContext(userId, currentIntent = null) {
        const user = this.users.get(userId);
        if (!user || user.interactions.length === 0) {
            return {
                conversationState: 'new',
                previousIntent: null,
                topicFlow: [],
                suggestedResponseStyle: 'welcoming'
            };
        }

        const recentInteractions = user.interactions.slice(-5);
        const previousIntent = recentInteractions[recentInteractions.length - 1]?.intent;

        // Analyze topic flow
        const topicFlow = recentInteractions
            .map(i => i.intent)
            .filter(Boolean);

        // Determine conversation state
        let conversationState = 'continuing';
        if (topicFlow.length >= 2 && topicFlow.every(intent => intent === topicFlow[0])) {
            conversationState = 'deep_dive';
        } else if (currentIntent && previousIntent && currentIntent !== previousIntent) {
            conversationState = 'topic_shift';
        }

        // Suggest response style based on history
        const suggestedStyle = this.suggestResponseStyle(user, currentIntent);

        return {
            conversationState,
            previousIntent,
            topicFlow,
            suggestedResponseStyle: suggestedStyle,
            userEngagementLevel: user.stats.engagementLevel
        };
    }

    suggestResponseStyle(user, currentIntent) {
        const preferences = user.preferences;
        const stats = user.stats;

        // Use user preferences if available
        if (preferences.responseStyle && preferences.responseStyle !== 'balanced') {
            return preferences.responseStyle;
        }

        // Suggest based on engagement and intent
        if (stats.engagementLevel === 'power_user') {
            return 'detailed';
        }

        if (currentIntent === 'priceInquiry' || currentIntent === 'cardIdentification') {
            return 'informative';
        }

        if (stats.favoriteTopics.includes('showcase')) {
            return 'enthusiastic';
        }

        return 'balanced';
    }

    searchInteractions(query, limit = 20) {
        const results = [];

        for (const [userId, user] of this.users.entries()) {
            for (const interaction of user.interactions) {
                if (this.matchesQuery(interaction, query)) {
                    results.push({
                        userId,
                        interaction,
                        userStats: user.stats
                    });
                }
            }
        }

        return results
            .sort((a, b) => b.interaction.timestamp - a.interaction.timestamp)
            .slice(0, limit);
    }

    matchesQuery(interaction, query) {
        const searchText = `${interaction.userText || ''} ${interaction.intent || ''} ${interaction.responseType || ''}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
    }

    getGlobalStats() {
        const allUsers = Array.from(this.users.values());
        const totalUsers = allUsers.length;
        const totalInteractions = allUsers.reduce((sum, user) => sum + user.stats.totalInteractions, 0);

        const intentCounts = {};
        const responseTypeCounts = {};

        for (const user of allUsers) {
            for (const [intent, count] of Object.entries(user.stats.intents)) {
                intentCounts[intent] = (intentCounts[intent] || 0) + count;
            }
            for (const [type, count] of Object.entries(user.stats.responseTypes)) {
                responseTypeCounts[type] = (responseTypeCounts[type] || 0) + count;
            }
        }

        return {
            totalUsers,
            totalInteractions,
            avgInteractionsPerUser: totalUsers > 0 ? totalInteractions / totalUsers : 0,
            topIntents: Object.entries(intentCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5),
            topResponseTypes: Object.entries(responseTypeCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
        };
    }

    generateInteractionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    enforceUserLimit() {
        if (this.users.size > this.maxUsers) {
            // Remove oldest users (least recently seen)
            const sortedUsers = Array.from(this.users.entries())
                .sort(([,a], [,b]) => a.lastSeen - b.lastSeen);

            const toRemove = sortedUsers.slice(0, this.users.size - this.maxUsers);
            for (const [userId] of toRemove) {
                this.users.delete(userId);
            }
        }
    }

    startCleanupTimer() {
        setInterval(() => {
            this.enforceUserLimit();
        }, this.cleanupInterval);
    }

    exportUserData(userId) {
        const user = this.users.get(userId);
        if (!user) return null;

        return {
            userId,
            exportDate: Date.now(),
            data: {
                interactions: user.interactions,
                stats: user.stats,
                preferences: user.preferences,
                firstSeen: user.firstSeen,
                lastSeen: user.lastSeen
            }
        };
    }

    importUserData(data) {
        if (!data.userId || !data.data) return false;

        this.users.set(data.userId, data.data);
        return true;
    }
}

module.exports = UserInteractionHistory;
