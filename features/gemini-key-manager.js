// Gemini API Key Rotation Manager
// Automatically rotates between multiple API keys to maximize free quota

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiKeyManager {
    constructor(apiKeys = []) {
        this.apiKeys = apiKeys.filter(key => key && key.length > 0);
        this.currentKeyIndex = 0;
        this.keyStatus = new Map(); // Track quota status for each key
        this.keyUsage = new Map();  // Track usage count for load balancing
        
        // Initialize usage counters
        this.apiKeys.forEach(key => {
            this.keyUsage.set(key, 0);
            this.keyStatus.set(key, 'unknown');
        });
        
        console.log(`🔑 Gemini Key Manager initialized with ${this.apiKeys.length} keys`);
        this.testAllKeys();
    }
    
    async testAllKeys() {
        console.log('🔍 Testing all Gemini API keys...');
        
        for (let i = 0; i < this.apiKeys.length; i++) {
            const key = this.apiKeys[i];
            const status = await this.testKey(key);
            this.keyStatus.set(key, status);
            console.log(`   Key ${i + 1}: ${status}`);
        }
        
        const availableKeys = Array.from(this.keyStatus.entries())
            .filter(([_, status]) => status === 'available')
            .length;
            
        console.log(`✅ ${availableKeys}/${this.apiKeys.length} keys available`);
    }
    
    async testKey(apiKey) {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent('Test');
            return 'available';
        } catch (error) {
            if (error.message.includes('429')) {
                return 'quota_exceeded';
            } else if (error.message.includes('API_KEY_INVALID')) {
                return 'invalid';
            } else {
                return 'error';
            }
        }
    }
    
    getNextAvailableKey() {
        // First try to find the least used available key
        const availableKeys = this.apiKeys.filter(key => 
            this.keyStatus.get(key) === 'available' || 
            this.keyStatus.get(key) === 'unknown'
        );
        
        if (availableKeys.length === 0) {
            console.log('⚠️ No available Gemini keys');
            return null;
        }
        
        // Sort by usage count to balance load
        availableKeys.sort((a, b) => 
            (this.keyUsage.get(a) || 0) - (this.keyUsage.get(b) || 0)
        );
        
        return availableKeys[0];
    }
    
    markKeyAsExceeded(apiKey) {
        this.keyStatus.set(apiKey, 'quota_exceeded');
        console.log(`❌ Marked key as quota exceeded (${this.getKeyIndex(apiKey) + 1}/${this.apiKeys.length})`);
        
        // Check if we have any keys left
        const availableCount = Array.from(this.keyStatus.values())
            .filter(status => status === 'available' || status === 'unknown')
            .length;
            
        if (availableCount === 0) {
            console.log('⚠️ All Gemini keys exhausted for today');
        } else {
            console.log(`✅ ${availableCount} backup key(s) still available`);
        }
    }
    
    getKeyIndex(apiKey) {
        return this.apiKeys.indexOf(apiKey);
    }
    
    incrementUsage(apiKey) {
        const current = this.keyUsage.get(apiKey) || 0;
        this.keyUsage.set(apiKey, current + 1);
    }
    
    async createModel(modelName = 'gemini-1.5-flash') {
        const apiKey = this.getNextAvailableKey();
        
        if (!apiKey) {
            throw new Error('No available Gemini API keys');
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Wrap the model to track usage and handle quota errors
        const wrappedModel = {
            ...model,
            generateContent: async (...args) => {
                try {
                    const result = await model.generateContent(...args);
                    this.incrementUsage(apiKey);
                    return result;
                } catch (error) {
                    if (error.message.includes('429')) {
                        this.markKeyAsExceeded(apiKey);
                        
                        // Try next available key
                        const nextKey = this.getNextAvailableKey();
                        if (nextKey && nextKey !== apiKey) {
                            console.log('🔄 Rotating to next available key...');
                            return this.createModel(modelName).then(newModel => 
                                newModel.generateContent(...args)
                            );
                        }
                    } else if (error.message.includes('503')) {
                        // Don't mark key as exceeded for 503 errors - it's temporary
                        console.log('⚠️ Gemini service temporarily overloaded (503)');
                    }
                    throw error;
                }
            },
            generateContentStream: async (...args) => {
                try {
                    const result = await model.generateContentStream(...args);
                    this.incrementUsage(apiKey);
                    return result;
                } catch (error) {
                    if (error.message.includes('429')) {
                        this.markKeyAsExceeded(apiKey);
                        
                        // Try next available key
                        const nextKey = this.getNextAvailableKey();
                        if (nextKey && nextKey !== apiKey) {
                            console.log('🔄 Rotating to next available key...');
                            return this.createModel(modelName).then(newModel => 
                                newModel.generateContentStream(...args)
                            );
                        }
                    }
                    throw error;
                }
            }
        };
        
        return wrappedModel;
    }
    
    getStatus() {
        const total = this.apiKeys.length;
        const available = Array.from(this.keyStatus.values())
            .filter(status => status === 'available' || status === 'unknown')
            .length;
        const exhausted = Array.from(this.keyStatus.values())
            .filter(status => status === 'quota_exceeded')
            .length;
            
        return {
            total,
            available,
            exhausted,
            keyStatus: Object.fromEntries(
                this.apiKeys.map((key, i) => [
                    `Key ${i + 1}`,
                    {
                        status: this.keyStatus.get(key),
                        usage: this.keyUsage.get(key) || 0
                    }
                ])
            )
        };
    }
}

module.exports = GeminiKeyManager;