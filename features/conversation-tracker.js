const fs = require('fs').promises;
const path = require('path');

class ConversationTracker {
    constructor(dataPath = null) {
        this.dataPath = dataPath || path.join(__dirname, '..', 'data');
        this.conversationsFile = path.join(this.dataPath, 'conversations.json');
        this.processedConversations = new Set();
        this.conversationHistory = [];
    }
    
    async initialize() {
        try {
            // Load existing conversation data
            const data = await fs.readFile(this.conversationsFile, 'utf8');
            const conversationData = JSON.parse(data);
            
            // Load processed IDs into Set
            if (conversationData.processedIds) {
                conversationData.processedIds.forEach(id => this.processedConversations.add(id));
            }
            
            // Load history
            if (conversationData.history) {
                this.conversationHistory = conversationData.history;
            }
            
            console.log(`   📝 Loaded ${this.processedConversations.size} processed conversations`);
            
        } catch (error) {
            // File doesn't exist yet, start fresh
            console.log('   📝 Starting fresh conversation tracking');
        }
    }
    
    async hasProcessed(tweetId) {
        return this.processedConversations.has(tweetId);
    }
    
    async markAsProcessed(tweetId, username, text) {
        this.processedConversations.add(tweetId);
        
        // Add to history
        this.conversationHistory.push({
            tweetId,
            username,
            text: text.substring(0, 100),
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 500 conversations
        if (this.conversationHistory.length > 500) {
            this.conversationHistory = this.conversationHistory.slice(-500);
        }
        
        // Clean up old IDs if Set gets too large
        if (this.processedConversations.size > 1000) {
            const idsArray = Array.from(this.processedConversations);
            const recentIds = idsArray.slice(-800); // Keep most recent 800
            this.processedConversations = new Set(recentIds);
        }
        
        // Save periodically
        if (this.processedConversations.size % 10 === 0) {
            await this.save();
        }
    }
    
    async save() {
        try {
            const data = {
                processedIds: Array.from(this.processedConversations),
                history: this.conversationHistory.slice(-100), // Save last 100 for history
                lastSaved: new Date().toISOString()
            };
            
            await fs.writeFile(
                this.conversationsFile,
                JSON.stringify(data, null, 2)
            );
            
            console.log(`   💾 Saved ${this.processedConversations.size} conversation IDs`);
            
        } catch (error) {
            console.log(`   ⚠️ Error saving conversations: ${error.message}`);
        }
    }
    
    getStats() {
        return {
            totalProcessed: this.processedConversations.size,
            recentConversations: this.conversationHistory.slice(-10)
        };
    }
}

module.exports = ConversationTracker;