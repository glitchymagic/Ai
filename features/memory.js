const fs = require('fs').promises;
const path = require('path');

class Memory {
    constructor(dataPath = null) {
        // Use absolute path to ensure correct location
        this.dataPath = dataPath || path.join(__dirname, '..', 'data');
        this.usersFile = path.join(this.dataPath, 'users.json');
        this.knowledgeFile = path.join(this.dataPath, 'knowledge.json');
        this.users = new Map();
        this.knowledge = {
            cards: new Map(),
            prices: new Map(),
            trends: [],
            memes: [],
            terminology: new Map()
        };
        this.initialized = false;
    }
    
    async initialize() {
        try {
            // Create data directory if it doesn't exist
            await fs.mkdir(this.dataPath, { recursive: true });
            
            // Load existing data
            await this.loadUsers();
            await this.loadKnowledge();
            
            this.initialized = true;
            console.log('💾 Memory system initialized');
            
        } catch (error) {
            console.log(`⚠️ Memory init error: ${error.message}`);
            // Start with empty memory if files don't exist
            this.initialized = true;
        }
    }
    
    async loadUsers() {
        try {
            const data = await fs.readFile(this.usersFile, 'utf8');
            const userData = JSON.parse(data);
            
            for (const [username, info] of Object.entries(userData)) {
                this.users.set(username, info);
            }
            
            console.log(`   📚 Loaded ${this.users.size} user profiles`);
        } catch (error) {
            // File doesn't exist yet, start fresh
            console.log('   📝 Starting with fresh user memory');
        }
    }
    
    async loadKnowledge() {
        try {
            const data = await fs.readFile(this.knowledgeFile, 'utf8');
            const knowledgeData = JSON.parse(data);
            
            if (knowledgeData.cards) {
                this.knowledge.cards = new Map(knowledgeData.cards);
            }
            if (knowledgeData.prices) {
                this.knowledge.prices = new Map(knowledgeData.prices);
            }
            if (knowledgeData.trends) {
                this.knowledge.trends = knowledgeData.trends;
            }
            
            console.log(`   🧠 Loaded knowledge base`);
        } catch (error) {
            console.log('   📝 Starting with fresh knowledge base');
        }
    }
    
    async saveUsers() {
        try {
            const userData = Object.fromEntries(this.users);
            await fs.writeFile(
                this.usersFile, 
                JSON.stringify(userData, null, 2)
            );
        } catch (error) {
            console.log(`⚠️ Error saving users: ${error.message}`);
        }
    }
    
    async saveKnowledge() {
        try {
            const knowledgeData = {
                cards: Array.from(this.knowledge.cards.entries()),
                prices: Array.from(this.knowledge.prices.entries()),
                trends: this.knowledge.trends,
                memes: this.knowledge.memes,
                terminology: Array.from(this.knowledge.terminology.entries())
            };
            
            await fs.writeFile(
                this.knowledgeFile,
                JSON.stringify(knowledgeData, null, 2)
            );
        } catch (error) {
            console.log(`⚠️ Error saving knowledge: ${error.message}`);
        }
    }
    
    // User Management
    async rememberUser(username, interaction) {
        if (!this.users.has(username)) {
            this.users.set(username, {
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                interactionCount: 0,
                interests: [],
                cards_mentioned: [],
                questions_asked: [],
                personality: 'unknown',
                relationship_level: 0 // 0-10 scale
            });
        }
        
        const user = this.users.get(username);
        user.lastSeen = new Date().toISOString();
        user.interactionCount++;
        
        // Extract interests from interaction
        this.extractUserInterests(user, interaction);
        
        // Increase relationship level
        if (user.interactionCount > 1) user.relationship_level = Math.min(10, user.relationship_level + 0.5);
        
        // Save periodically
        if (user.interactionCount % 5 === 0) {
            await this.saveUsers();
        }
        
        return user;
    }
    
    extractUserInterests(user, text) {
        const textLower = text.toLowerCase();
        
        // Extract card mentions
        const cardPatterns = [
            /charizard/gi, /pikachu/gi, /umbreon/gi, /moonbreon/gi,
            /rayquaza/gi, /lugia/gi, /mewtwo/gi, /gengar/gi,
            /eeveelution/gi, /trainer gallery/gi
        ];
        
        for (const pattern of cardPatterns) {
            const matches = textLower.match(pattern);
            if (matches) {
                matches.forEach(card => {
                    if (!user.cards_mentioned.includes(card)) {
                        user.cards_mentioned.push(card);
                    }
                });
            }
        }
        
        // Extract interests
        if (textLower.includes('invest')) user.interests.push('investing');
        if (textLower.includes('grade') || textLower.includes('psa')) user.interests.push('grading');
        if (textLower.includes('collect')) user.interests.push('collecting');
        if (textLower.includes('compet') || textLower.includes('tournament')) user.interests.push('competitive');
        if (textLower.includes('vintage') || textLower.includes('base set')) user.interests.push('vintage');
        if (textLower.includes('japanese') || textLower.includes('jp')) user.interests.push('japanese');
        
        // Remove duplicates
        user.interests = [...new Set(user.interests)];
        user.cards_mentioned = [...new Set(user.cards_mentioned)].slice(0, 10); // Keep top 10
    }
    
    getUser(username) {
        return this.users.get(username) || null;
    }
    
    generatePersonalizedGreeting(username) {
        const user = this.getUser(username);
        
        if (!user) {
            return null; // First time meeting
        }
        
        const greetings = [];
        
        // Based on relationship level
        if (user.relationship_level >= 7) {
            greetings.push(
                `Hey again @${username}! Always good to see you!`,
                `@${username} my friend! What's good?`,
                `Yo @${username}! Back again I see!`
            );
        } else if (user.relationship_level >= 4) {
            greetings.push(
                `Hey @${username}! Good to see you again!`,
                `@${username} welcome back!`,
                `Oh hey @${username}! How's it going?`
            );
        } else if (user.relationship_level >= 1) {
            greetings.push(
                `Hey again @${username}!`,
                `@${username} nice to see you!`
            );
        }
        
        // Add interest-based context
        if (user.cards_mentioned.length > 0) {
            const favoriteCard = user.cards_mentioned[0];
            greetings.push(`Still hunting for that ${favoriteCard}, @${username}?`);
        }
        
        if (user.interests.includes('investing')) {
            greetings.push(`@${username} how's the investment portfolio looking?`);
        }
        
        if (user.interests.includes('grading')) {
            greetings.push(`@${username} send anything to PSA lately?`);
        }
        
        return greetings.length > 0 ? 
            greetings[Math.floor(Math.random() * greetings.length)] : 
            null;
    }
    
    // Knowledge Management
    async learnFromPost(text, metadata = {}) {
        const textLower = text.toLowerCase();
        
        // Extract card prices mentioned - BALANCED PATTERNS
        const pricePatterns = [
            // Card name followed by price - expanded list
            /(charizard|pikachu|umbreon|moonbreon|rayquaza|lugia|mewtwo|gengar|eeveelution|vmax|vstar|ex|gx)[\s\w]*?\s*(?:is|worth|at|going for|selling for|priced at|valued at)\s*\$?([\d,]+(?:\.\d{2})?)/gi,
            // Price for specific card
            /\$?([\d,]+(?:\.\d{2})?)\s+for\s+(?:a\s+)?([\w\s]+?(?:charizard|pikachu|umbreon|moonbreon|rayquaza|lugia|mewtwo|gengar|vmax|vstar|ex|gx)[\w\s]*?)/gi,
            // PSA/BGS/CGC graded cards
            /(?:PSA|BGS|CGC)\s*(?:10|9\.5|9)\s+([\w\s]+?)\s*\$?([\d,]+)/gi,
            // Sold/purchased/bought statements
            /(?:sold|purchased|bought)\s+(?:my\s+)?([\w\s]+?(?:card|slab|box|etb))\s+for\s+\$?([\d,]+(?:\.\d{2})?)/gi,
            // Box/ETB/sealed product prices
            /(booster box|etb|elite trainer box|collection box|upc|bundle|tin)\s*(?:is|worth|at|selling for|going for)?\s*\$?([\d,]+(?:\.\d{2})?)/gi,
            // Set names with prices
            /(evolving skies|crown zenith|151|paldea evolved|paradox rift)[\s\w]*?\s*\$?([\d,]+(?:\.\d{2})?)/gi
        ];
        
        for (const pattern of pricePatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                // Handle different capture group orders
                let card, priceStr;
                if (match[1] && match[2]) {
                    if (match[1].match(/^\d/)) {
                        priceStr = match[1];
                        card = match[2];
                    } else {
                        card = match[1];
                        priceStr = match[2];
                    }
                }
                
                const price = parseFloat(priceStr.replace(/,/g, ''));
                
                // Only save reasonable prices for Pokemon cards
                if (!isNaN(price) && price > 1 && price < 50000) {
                    card = card.trim().toLowerCase();
                    // Filter out common non-card words and ensure it's Pokemon related
                    if (!card.match(/^(the|for|per|each|lot|bundle|or|to|https?|www|\d+)$/) && 
                        card.length > 2 && card.length < 50) {
                        this.knowledge.prices.set(card, {
                            price,
                            date: new Date().toISOString(),
                            source: metadata.username || 'unknown'
                        });
                        console.log(`   💰 Learned: ${card} ≈ $${price}`);
                    }
                }
            }
        }
        
        // Extract trends
        if (textLower.includes('trending') || textLower.includes('hot') || textLower.includes('fire')) {
            const trendItem = {
                text: text.substring(0, 100),
                date: new Date().toISOString(),
                category: this.categorizeTrend(textLower)
            };
            
            this.knowledge.trends.push(trendItem);
            if (this.knowledge.trends.length > 50) {
                this.knowledge.trends.shift(); // Keep only recent 50
            }
        }
        
        // Learn terminology
        const terms = {
            'slab': 'graded card in case',
            'raw': 'ungraded card',
            'hit': 'good pull from pack',
            'chase': 'most desired card in set',
            'alt art': 'alternate artwork card',
            'trainer gallery': 'subset with special art',
            'god pack': 'all rare pack',
            'mail day': 'cards arrived in mail',
            'pc': 'personal collection',
            'fs': 'for sale',
            'ft': 'for trade',
            'lgs': 'local game store',
            'tcgp': 'tcgplayer website',
            'nm': 'near mint condition',
            'lp': 'light play condition',
            'mp': 'moderate play condition',
            'hp': 'heavy play condition'
        };
        
        for (const [term, meaning] of Object.entries(terms)) {
            if (textLower.includes(term) && !this.knowledge.terminology.has(term)) {
                this.knowledge.terminology.set(term, meaning);
            }
        }
        
        // Save periodically
        if (Math.random() < 0.1) { // 10% chance to save
            await this.saveKnowledge();
        }
    }
    
    categorizeTrend(text) {
        if (text.includes('price') || text.includes('value')) return 'market';
        if (text.includes('pull') || text.includes('pack')) return 'pulls';
        if (text.includes('invest')) return 'investment';
        if (text.includes('fake') || text.includes('scam')) return 'warning';
        return 'general';
    }
    
    getKnowledgeAbout(topic) {
        const topicLower = topic.toLowerCase();
        const relevant = {
            prices: [],
            trends: [],
            facts: []
        };
        
        // Find relevant prices
        for (const [card, data] of this.knowledge.prices.entries()) {
            if (card.includes(topicLower) || topicLower.includes(card)) {
                relevant.prices.push({ card, ...data });
            }
        }
        
        // Find relevant trends
        relevant.trends = this.knowledge.trends.filter(t => 
            t.text.toLowerCase().includes(topicLower)
        );
        
        return relevant;
    }
    
    // Analytics
    getMemoryStats() {
        return {
            totalUsers: this.users.size,
            totalKnowledge: {
                cards: this.knowledge.cards.size,
                prices: this.knowledge.prices.size,
                trends: this.knowledge.trends.length,
                terms: this.knowledge.terminology.size
            },
            topUsers: this.getTopUsers(),
            recentTrends: this.knowledge.trends.slice(-5)
        };
    }
    
    getTopUsers() {
        const userArray = Array.from(this.users.entries())
            .map(([username, data]) => ({
                username,
                interactions: data.interactionCount,
                relationship: data.relationship_level
            }))
            .sort((a, b) => b.interactions - a.interactions)
            .slice(0, 10);
        
        return userArray;
    }
}

module.exports = Memory;