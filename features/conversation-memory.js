// Conversation Memory System - Remembers past interactions with users
// Enables contextual follow-up responses and relationship building

const fs = require('fs');
const path = require('path');

class ConversationMemory {
    constructor() {
        this.conversations = new Map(); // username -> conversation history
        this.dataFile = path.join(__dirname, '../data/conversations.json');
        this.maxConversationsPerUser = 10; // Keep last 10 interactions per user
        this.maxUsers = 500; // Remember up to 500 users
        this.loadConversations();
    }
    
    // Remember an interaction with a user
    rememberInteraction(username, theirMessage, myResponse, context = {}) {
        const userLower = username.toLowerCase();
        
        if (!this.conversations.has(userLower)) {
            this.conversations.set(userLower, []);
        }
        
        const conversation = this.conversations.get(userLower);
        
        const interaction = {
            timestamp: Date.now(),
            theirMessage: theirMessage,
            myResponse: myResponse,
            context: {
                hasImage: context.hasImage || false,
                postType: this.detectPostType(theirMessage),
                cards: this.extractCards(theirMessage),
                topics: this.extractTopics(theirMessage)
            }
        };
        
        conversation.push(interaction);
        
        // Keep only recent interactions
        if (conversation.length > this.maxConversationsPerUser) {
            conversation.shift();
        }
        
        // Limit total users remembered
        if (this.conversations.size > this.maxUsers) {
            const oldestUser = this.getOldestUser();
            this.conversations.delete(oldestUser);
        }
        
        this.saveConversations();
    }
    
    // Get past interactions with a user
    getConversationHistory(username) {
        const userLower = username.toLowerCase();
        return this.conversations.get(userLower) || [];
    }
    
    // Check if we've talked to this user before
    hasMetUser(username) {
        const userLower = username.toLowerCase();
        return this.conversations.has(userLower);
    }
    
    // Get contextual response based on conversation history
    getContextualResponse(username, currentMessage) {
        const history = this.getConversationHistory(username);
        
        if (history.length === 0) {
            return null; // First time meeting, no context
        }
        
        const lastInteraction = history[history.length - 1];
        const daysSinceLastTalk = (Date.now() - lastInteraction.timestamp) / (1000 * 60 * 60 * 24);
        
        // Only use conversation memory for meaningful follow-ups
        // Recent conversation (same day) and meaningful context
        if (daysSinceLastTalk < 1 && history.length >= 2) {
            const followUp = this.getFollowUpResponse(lastInteraction, currentMessage, history);
            if (followUp) return followUp;
        }
        
        // Haven't talked in a while but remember them (less frequent)
        if (daysSinceLastTalk < 30 && Math.random() < 0.3) { // Only 30% chance
            return this.getReconnectionResponse(lastInteraction, currentMessage);
        }
        
        return null; // Let normal response system handle it
    }
    
    // Generate follow-up response for recent conversation
    getFollowUpResponse(lastInteraction, currentMessage, history) {
        const current = currentMessage.toLowerCase();
        const lastTopic = lastInteraction.context.postType;
        const lastCards = lastInteraction.context.cards;
        
        // They're updating on something we discussed
        if (lastTopic === 'grading' && (current.includes('got back') || current.includes('came back'))) {
            const gradingResults = ['nice! what did it get?', 'ooh results time', 'fingers crossed for 10s'];
            return gradingResults[Math.floor(Math.random() * gradingResults.length)];
        }
        
        if (lastTopic === 'pull' && current.includes('grade')) {
            return 'oh you sending that one in?';
        }
        
        if (lastTopic === 'investment' && (current.includes('bought') || current.includes('got'))) {
            return 'you went for it! nice';
        }
        
        // They mentioned same card again
        if (lastCards.length > 0) {
            for (const card of lastCards) {
                if (current.includes(card)) {
                    return `another ${card}? you collecting those?`;
                }
            }
        }
        
        // Multiple interactions - show familiarity
        if (history.length >= 3) {
            const casualGreetings = ['yooo whats good', 'back again lol', 'ayy', 'more heat incoming?'];
            if (Math.random() < 0.3) { // 30% chance for casual greeting
                return casualGreetings[Math.floor(Math.random() * casualGreetings.length)];
            }
        }
        
        return null;
    }
    
    // Generate response for user we haven't talked to recently
    getReconnectionResponse(lastInteraction, currentMessage) {
        const lastTopic = lastInteraction.context.postType;
        const daysSince = Math.floor((Date.now() - lastInteraction.timestamp) / (1000 * 60 * 60 * 24));
        
        if (daysSince < 7) {
            // Same week
            const reconnect = ['back with more pulls?', 'whats good', 'more pokemon content i see'];
            return reconnect[Math.floor(Math.random() * reconnect.length)];
        } else {
            // Been a while, more casual
            const longTime = ['been a minute', 'havent seen u in a while', 'long time no see'];
            if (Math.random() < 0.2) { // 20% chance to acknowledge time gap
                return longTime[Math.floor(Math.random() * longTime.length)];
            }
        }
        
        return null;
    }
    
    // Detect what type of post this is
    detectPostType(message) {
        const lower = message.toLowerCase();
        
        if (lower.includes('grade') || lower.includes('psa') || lower.includes('bgs')) {
            return 'grading';
        }
        if (lower.includes('pull') || lower.includes('pack') || lower.includes('hit')) {
            return 'pull';
        }
        if (lower.includes('invest') || lower.includes('sealed') || lower.includes('hold')) {
            return 'investment';
        }
        if (lower.includes('worth') || lower.includes('price') || lower.includes('value')) {
            return 'value';
        }
        if (lower.includes('collection') || lower.includes('display') || lower.includes('setup')) {
            return 'collection';
        }
        if (lower.includes('mail day') || lower.includes('arrived')) {
            return 'mailday';
        }
        if (lower.includes('wts') || lower.includes('for sale')) {
            return 'sale';
        }
        
        return 'general';
    }
    
    // Extract card names from message
    extractCards(message) {
        const cards = [];
        const lower = message.toLowerCase();
        
        // Common card names
        const cardPatterns = [
            'charizard', 'pikachu', 'lugia', 'giratina', 'rayquaza',
            'umbreon', 'espeon', 'vaporeon', 'jolteon', 'flareon',
            'moonbreon', 'leafeon', 'glaceon', 'sylveon',
            'mew', 'mewtwo', 'celebi', 'jirachi',
            'dialga', 'palkia', 'arceus', 'darkrai',
            'reshiram', 'zekrom', 'kyurem'
        ];
        
        for (const card of cardPatterns) {
            if (lower.includes(card)) {
                cards.push(card);
            }
        }
        
        return cards;
    }
    
    // Extract topics from message
    extractTopics(message) {
        const topics = [];
        const lower = message.toLowerCase();
        
        const topicPatterns = {
            'alt art': ['alt art', 'alternate art'],
            'vintage': ['vintage', 'wotc', 'base set', 'jungle', 'fossil'],
            'modern': ['modern', 'sword shield', 'sun moon', 'xy'],
            'japanese': ['japanese', 'japan', 'jp'],
            'error': ['error', 'misprint', 'miscut'],
            'first edition': ['1st edition', 'first edition'],
            'shadowless': ['shadowless'],
            'unlimited': ['unlimited']
        };
        
        for (const [topic, patterns] of Object.entries(topicPatterns)) {
            if (patterns.some(pattern => lower.includes(pattern))) {
                topics.push(topic);
            }
        }
        
        return topics;
    }
    
    // Get oldest user for cleanup
    getOldestUser() {
        let oldestUser = null;
        let oldestTime = Date.now();
        
        for (const [username, conversation] of this.conversations) {
            if (conversation.length > 0) {
                const lastTime = conversation[conversation.length - 1].timestamp;
                if (lastTime < oldestTime) {
                    oldestTime = lastTime;
                    oldestUser = username;
                }
            }
        }
        
        return oldestUser;
    }
    
    // Save conversations to disk
    saveConversations() {
        try {
            const data = Object.fromEntries(this.conversations);
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.log('⚠️ Could not save conversations:', error.message);
        }
    }
    
    // Load conversations from disk
    loadConversations() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                this.conversations = new Map(Object.entries(data));
                console.log(`💾 Loaded ${this.conversations.size} conversation histories`);
            }
        } catch (error) {
            console.log('⚠️ Could not load conversations:', error.message);
            this.conversations = new Map();
        }
    }
    
    // Get statistics
    getStats() {
        let totalInteractions = 0;
        let recentUsers = 0;
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (const [username, conversation] of this.conversations) {
            totalInteractions += conversation.length;
            if (conversation.length > 0 && conversation[conversation.length - 1].timestamp > weekAgo) {
                recentUsers++;
            }
        }
        
        return {
            totalUsers: this.conversations.size,
            totalInteractions,
            recentlyActiveUsers: recentUsers,
            averageInteractionsPerUser: totalInteractions / Math.max(this.conversations.size, 1)
        };
    }
    
    // Clear all conversations (for testing)
    clearConversations() {
        this.conversations.clear();
        this.saveConversations();
    }
}

module.exports = ConversationMemory;