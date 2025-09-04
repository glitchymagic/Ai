// Reddit Monitor for Pokemon TCG Narratives
// Monitors Pokemon subreddits for emerging trends and narratives

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class RedditMonitor {
    constructor() {
        // Pokemon TCG related subreddits
        this.subreddits = [
            { name: 'PokemonTCG', weight: 1.0 },
            { name: 'PokeInvesting', weight: 1.5 },      // More market-focused
            { name: 'PokemonTCGDeals', weight: 1.2 },    // Supply indicators
            { name: 'pkmntcgcollections', weight: 0.8 }, // Showcase trends
            { name: 'PokemonCardValue', weight: 1.3 }    // Direct price discussions
        ];
        
        // Narrative patterns to detect
        this.narrativePatterns = {
            undervalued: {
                keywords: ['undervalued', 'sleeping on', 'underrated', 'hidden gem', 'nobody talking about'],
                strength: 1.5,
                type: 'bullish'
            },
            supplyShock: {
                keywords: ['sold out', 'cant find', 'out of stock', 'allocation', 'restock', 'cleaned out'],
                strength: 1.3,
                type: 'urgent'
            },
            priceDiscovery: {
                keywords: ['worth', 'value', 'how much', 'price check', 'market price', 'going for'],
                strength: 1.0,
                type: 'neutral'
            },
            fomo: {
                keywords: ['glad i bought', 'wish i bought', 'missed out', 'too late', 'priced out', 'moon', 'mooning'],
                strength: 1.4,
                type: 'bullish'
            },
            bearish: {
                keywords: ['overpriced', 'bubble', 'crash', 'dropping', 'tanking', 'sell', 'overvalued'],
                strength: 1.2,
                type: 'bearish'
            },
            grading: {
                keywords: ['psa 10', 'bgs', 'cgc', 'black label', 'gem mint', 'grade', 'population'],
                strength: 1.1,
                type: 'quality'
            }
        };
        
        // Card name patterns
        this.cardPatterns = [
            // Specific high-value cards
            { pattern: /moonbreon|umbreon\s*vmax\s*alt/gi, card: 'Umbreon VMAX Alt Art', weight: 1.5 },
            { pattern: /charizard\s*upc/gi, card: 'Charizard UPC', weight: 1.4 },
            { pattern: /giratina\s*(v\s*)?alt/gi, card: 'Giratina V Alt Art', weight: 1.3 },
            { pattern: /lugia\s*(v\s*)?alt/gi, card: 'Lugia V Alt Art', weight: 1.2 },
            { pattern: /rayquaza\s*vmax\s*alt/gi, card: 'Rayquaza VMAX Alt Art', weight: 1.3 },
            
            // General patterns
            { pattern: /(\w+)\s*vmax\s*alt\s*art/gi, card: '$1 VMAX Alt Art', weight: 1.0 },
            { pattern: /(\w+)\s*v\s*alt\s*art/gi, card: '$1 V Alt Art', weight: 1.0 },
            { pattern: /base\s*set\s*charizard/gi, card: 'Base Set Charizard', weight: 1.5 },
            
            // Set names
            { pattern: /evolving\s*skies/gi, card: 'Evolving Skies', weight: 0.8 },
            { pattern: /lost\s*origin/gi, card: 'Lost Origin', weight: 0.8 },
            { pattern: /silver\s*tempest/gi, card: 'Silver Tempest', weight: 0.8 },
            { pattern: /crown\s*zenith/gi, card: 'Crown Zenith', weight: 0.9 },
            { pattern: /surging\s*sparks/gi, card: 'Surging Sparks', weight: 1.0 }
        ];
        
        this.dataPath = path.join(__dirname, '../data');
        this.narrativeCache = new Map();
        this.lastChecked = new Map();
    }
    
    // Fetch Reddit data without API
    async fetchSubredditData(subreddit, sort = 'hot', limit = 50) {
        return new Promise((resolve, reject) => {
            const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
            
            https.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }, (res) => {
                let data = '';
                
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json.data.children);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }
    
    // Monitor all subreddits
    async monitorAll() {
        console.log('🔍 Monitoring Reddit for Pokemon TCG narratives...');
        
        const allNarratives = [];
        
        for (const subreddit of this.subreddits) {
            try {
                // Check hot and rising posts
                const hotPosts = await this.fetchSubredditData(subreddit.name, 'hot', 25);
                const risingPosts = await this.fetchSubredditData(subreddit.name, 'rising', 15);
                
                // Analyze posts
                const narratives = await this.analyzePosts(
                    [...hotPosts, ...risingPosts],
                    subreddit
                );
                
                allNarratives.push(...narratives);
                
                // Rate limit respect
                await this.sleep(2000);
                
            } catch (error) {
                console.error(`Error monitoring r/${subreddit.name}:`, error.message);
            }
        }
        
        // Aggregate and rank narratives
        const aggregated = this.aggregateNarratives(allNarratives);
        
        // Save to cache
        await this.saveNarratives(aggregated);
        
        return aggregated;
    }
    
    // Analyze posts for narratives
    async analyzePosts(posts, subreddit) {
        const narratives = [];
        const now = Date.now();
        
        for (const post of posts) {
            const data = post.data;
            
            // Skip if we've already analyzed recently
            const postId = data.id;
            if (this.lastChecked.has(postId) && 
                now - this.lastChecked.get(postId) < 3600000) { // 1 hour
                continue;
            }
            
            // Combine title and selftext for analysis
            const fullText = `${data.title} ${data.selftext || ''}`.toLowerCase();
            
            // Skip if too short or likely not relevant
            if (fullText.length < 20) continue;
            
            // Extract card mentions
            const cardMentions = this.extractCardMentions(fullText);
            
            // Detect narrative patterns
            const patterns = this.detectPatterns(fullText);
            
            // Calculate engagement score
            const engagement = this.calculateEngagement(data);
            
            // Create narrative entries
            for (const card of cardMentions) {
                for (const pattern of patterns) {
                    narratives.push({
                        id: `${postId}_${card.card}_${pattern.type}`,
                        subreddit: subreddit.name,
                        subredditWeight: subreddit.weight,
                        card: card.card,
                        cardWeight: card.weight,
                        pattern: pattern.type,
                        patternStrength: pattern.strength,
                        
                        post: {
                            id: postId,
                            title: data.title,
                            url: `https://reddit.com${data.permalink}`,
                            author: data.author,
                            created: data.created_utc * 1000,
                            score: data.score,
                            comments: data.num_comments,
                            upvoteRatio: data.upvote_ratio
                        },
                        
                        engagement: engagement,
                        detectedAt: now,
                        
                        // Overall strength calculation
                        strength: this.calculateNarrativeStrength({
                            subredditWeight: subreddit.weight,
                            cardWeight: card.weight,
                            patternStrength: pattern.strength,
                            engagement: engagement,
                            age: (now - data.created_utc * 1000) / (1000 * 60 * 60) // hours
                        })
                    });
                }
            }
            
            this.lastChecked.set(postId, now);
        }
        
        return narratives;
    }
    
    // Extract card mentions from text
    extractCardMentions(text) {
        const mentions = [];
        const seen = new Set();
        
        for (const cardPattern of this.cardPatterns) {
            const matches = text.matchAll(cardPattern.pattern);
            
            for (const match of matches) {
                let cardName = cardPattern.card;
                
                // Handle capture groups (e.g., $1 for Pokemon name)
                if (match[1]) {
                    cardName = cardName.replace('$1', match[1]);
                }
                
                // Normalize card name
                cardName = this.normalizeCardName(cardName);
                
                if (!seen.has(cardName)) {
                    mentions.push({
                        card: cardName,
                        weight: cardPattern.weight
                    });
                    seen.add(cardName);
                }
            }
        }
        
        return mentions;
    }
    
    // Detect narrative patterns in text
    detectPatterns(text) {
        const detected = [];
        
        for (const [patternName, pattern] of Object.entries(this.narrativePatterns)) {
            let matchCount = 0;
            
            for (const keyword of pattern.keywords) {
                if (text.includes(keyword)) {
                    matchCount++;
                }
            }
            
            if (matchCount > 0) {
                detected.push({
                    type: patternName,
                    strength: pattern.strength * Math.min(matchCount, 3), // Cap multiplier at 3
                    sentiment: pattern.type
                });
            }
        }
        
        return detected;
    }
    
    // Calculate post engagement score
    calculateEngagement(postData) {
        const score = postData.score || 0;
        const comments = postData.num_comments || 0;
        const ratio = postData.upvote_ratio || 0.5;
        const ageHours = (Date.now() - postData.created_utc * 1000) / (1000 * 60 * 60);
        
        // Normalize by age (newer posts haven't had time to accumulate votes)
        const normalizedScore = score / Math.max(ageHours, 1);
        const normalizedComments = comments / Math.max(ageHours, 1);
        
        // Weight factors
        const scoreWeight = 0.4;
        const commentWeight = 0.3;
        const ratioWeight = 0.2;
        const recencyWeight = 0.1;
        
        const engagement = 
            (normalizedScore * scoreWeight) +
            (normalizedComments * 10 * commentWeight) + // Comments worth more
            (ratio * 100 * ratioWeight) +
            ((24 - Math.min(ageHours, 24)) / 24 * 100 * recencyWeight);
            
        return Math.min(engagement / 10, 10); // Scale to 0-10
    }
    
    // Calculate overall narrative strength
    calculateNarrativeStrength(factors) {
        const {
            subredditWeight,
            cardWeight,
            patternStrength,
            engagement,
            age
        } = factors;
        
        // Age decay - narratives lose strength over time
        const ageDecay = Math.max(0, 1 - (age / 72)); // 72 hour decay
        
        // Calculate weighted score
        const strength = 
            subredditWeight * 0.2 +
            cardWeight * 0.25 +
            patternStrength * 0.25 +
            (engagement / 10) * 0.2 +
            ageDecay * 0.1;
            
        return Math.min(strength, 1.0); // Cap at 1.0
    }
    
    // Aggregate narratives by card
    aggregateNarratives(narratives) {
        const cardNarratives = new Map();
        
        for (const narrative of narratives) {
            const key = narrative.card;
            
            if (!cardNarratives.has(key)) {
                cardNarratives.set(key, {
                    card: key,
                    narratives: [],
                    totalStrength: 0,
                    patterns: new Map(),
                    posts: [],
                    firstSeen: narrative.detectedAt,
                    lastSeen: narrative.detectedAt
                });
            }
            
            const cardNarr = cardNarratives.get(key);
            cardNarr.narratives.push(narrative);
            cardNarr.totalStrength += narrative.strength;
            cardNarr.lastSeen = Math.max(cardNarr.lastSeen, narrative.detectedAt);
            
            // Aggregate patterns
            const patternKey = narrative.pattern;
            const current = cardNarr.patterns.get(patternKey) || 0;
            cardNarr.patterns.set(patternKey, current + narrative.strength);
            
            // Collect unique posts
            if (!cardNarr.posts.find(p => p.id === narrative.post.id)) {
                cardNarr.posts.push(narrative.post);
            }
        }
        
        // Convert to array and sort by total strength
        const aggregated = Array.from(cardNarratives.values())
            .map(cardNarr => ({
                ...cardNarr,
                avgStrength: cardNarr.totalStrength / cardNarr.narratives.length,
                dominantPattern: this.getDominantPattern(cardNarr.patterns),
                momentum: this.calculateMomentum(cardNarr.narratives)
            }))
            .sort((a, b) => b.totalStrength - a.totalStrength);
            
        return aggregated;
    }
    
    // Get the strongest pattern for a card
    getDominantPattern(patterns) {
        let maxStrength = 0;
        let dominant = 'neutral';
        
        for (const [pattern, strength] of patterns) {
            if (strength > maxStrength) {
                maxStrength = strength;
                dominant = pattern;
            }
        }
        
        return {
            type: dominant,
            strength: maxStrength,
            sentiment: this.narrativePatterns[dominant]?.type || 'neutral'
        };
    }
    
    // Calculate momentum (how fast narrative is growing)
    calculateMomentum(narratives) {
        if (narratives.length < 2) return 0;
        
        // Sort by time
        narratives.sort((a, b) => a.detectedAt - b.detectedAt);
        
        // Calculate strength over time
        const recent = narratives.slice(-Math.ceil(narratives.length / 2));
        const older = narratives.slice(0, Math.floor(narratives.length / 2));
        
        const recentAvg = recent.reduce((sum, n) => sum + n.strength, 0) / recent.length;
        const olderAvg = older.reduce((sum, n) => sum + n.strength, 0) / older.length;
        
        // Momentum is the rate of change
        return (recentAvg - olderAvg) / olderAvg;
    }
    
    // Normalize card names for consistency
    normalizeCardName(name) {
        return name
            .trim()
            .replace(/\s+/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    
    // Save narratives to disk
    async saveNarratives(narratives) {
        const filePath = path.join(this.dataPath, 'reddit-narratives.json');
        
        try {
            const data = {
                timestamp: new Date().toISOString(),
                narratives: narratives.slice(0, 20), // Top 20
                stats: {
                    totalAnalyzed: this.lastChecked.size,
                    topCard: narratives[0]?.card || 'None',
                    dominantSentiment: this.calculateDominantSentiment(narratives)
                }
            };
            
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Saved ${narratives.length} narratives to disk`);
            
        } catch (error) {
            console.error('Error saving narratives:', error);
        }
    }
    
    // Calculate overall sentiment
    calculateDominantSentiment(narratives) {
        const sentiments = { bullish: 0, bearish: 0, neutral: 0, urgent: 0 };
        
        for (const narr of narratives.slice(0, 10)) { // Top 10
            const sentiment = narr.dominantPattern.sentiment;
            sentiments[sentiment] = (sentiments[sentiment] || 0) + narr.totalStrength;
        }
        
        return Object.entries(sentiments)
            .sort((a, b) => b[1] - a[1])[0][0];
    }
    
    // Get top narratives for bot to discuss
    async getTopNarratives(limit = 5) {
        const filePath = path.join(this.dataPath, 'reddit-narratives.json');
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.narratives.slice(0, limit);
        } catch (error) {
            return [];
        }
    }
    
    // Generate alert for strong narrative
    generateAlert(narrative) {
        const { card, dominantPattern, totalStrength, posts, momentum } = narrative;
        
        let alert = `🚨 REDDIT NARRATIVE: ${card}\n`;
        
        // Pattern-specific messaging
        switch (dominantPattern.type) {
            case 'undervalued':
                alert += `💎 Multiple posts calling it undervalued\n`;
                break;
            case 'supplyShock':
                alert += `📦 Supply issues being reported\n`;
                break;
            case 'fomo':
                alert += `🔥 FOMO building - "glad I bought" vibes\n`;
                break;
            case 'bearish':
                alert += `📉 Bearish sentiment emerging\n`;
                break;
        }
        
        // Add metrics
        alert += `📊 Strength: ${(totalStrength * 100).toFixed(0)}%\n`;
        alert += `📈 Momentum: ${momentum > 0 ? '+' : ''}${(momentum * 100).toFixed(0)}%\n`;
        alert += `💬 ${posts.length} posts across r/PokemonTCG+\n`;
        
        // Add action
        if (dominantPattern.sentiment === 'bullish' && totalStrength > 0.7) {
            alert += `\n👀 High conviction bullish signal detected`;
        } else if (dominantPattern.sentiment === 'urgent' && totalStrength > 0.6) {
            alert += `\n⚡ Time-sensitive opportunity`;
        }
        
        return alert;
    }
    
    // Helper sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = RedditMonitor;