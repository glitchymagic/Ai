// Influencer Monitoring System
// Tracks top Pokemon TCG voices for early trend detection

class InfluencerMonitor {
    constructor() {
        this.influencers = [
            // Top 5 Pokemon TCG influencers to start
            {
                username: 'PokeRev',
                handle: '@PokeRev',
                followers: '1.5M',
                category: 'collector',
                keywords: ['opening', 'vintage', 'grading', 'investment']
            },
            {
                username: 'RealBreakingNate', 
                handle: '@RealBreakingNate',
                followers: '500K',
                category: 'collector',
                keywords: ['breaks', 'hits', 'pulls', 'market']
            },
            {
                username: 'TwiceBakedJake',
                handle: '@TwiceBakedJake',
                followers: '400K',
                category: 'collector',
                keywords: ['vintage', 'graded', 'investment', 'market']
            },
            {
                username: 'ThePokeCapital',
                handle: '@ThePokeCapital',
                followers: '100K',
                category: 'investor',
                keywords: ['market', 'analysis', 'prediction', 'trends']
            },
            {
                username: 'smpratte',
                handle: '@smpratte',
                followers: '80K',
                category: 'historian',
                keywords: ['history', 'rare', 'trophy', 'market']
            }
        ];
        
        this.recentActivity = [];
        this.trends = new Map();
    }
    
    // Monitor influencer activity (would connect to Twitter API)
    async checkInfluencerActivity(page) {
        console.log('👀 Checking influencer activity...');
        
        const insights = [];
        
        for (const influencer of this.influencers) {
            try {
                // Navigate to influencer profile
                await page.goto(`https://x.com/${influencer.username}`, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
                
                await this.sleep(3000);
                
                // Get recent tweets (simplified - would use API in production)
                const recentTweets = await page.evaluate(() => {
                    const tweets = [];
                    const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');
                    
                    for (let i = 0; i < Math.min(3, tweetElements.length); i++) {
                        const el = tweetElements[i];
                        const text = el.querySelector('[data-testid="tweetText"]')?.textContent || '';
                        const time = el.querySelector('time')?.getAttribute('datetime') || '';
                        
                        if (text) {
                            tweets.push({ text, time });
                        }
                    }
                    
                    return tweets;
                });
                
                // Analyze tweets for market signals
                for (const tweet of recentTweets) {
                    const signal = this.analyzeInfluencerTweet(influencer, tweet);
                    if (signal) {
                        insights.push(signal);
                    }
                }
                
                await this.sleep(2000); // Rate limit
                
            } catch (error) {
                console.log(`⚠️ Could not check ${influencer.username}`);
            }
        }
        
        return insights;
    }
    
    // Analyze tweet for market signals
    analyzeInfluencerTweet(influencer, tweet) {
        const text = tweet.text.toLowerCase();
        
        // Look for key market signals
        const signals = {
            bullish: [
                'buying', 'picked up', 'investing', 'undervalued', 'sleeper',
                'before it', 'get now', 'moon', 'explode', 'next big'
            ],
            bearish: [
                'selling', 'overpriced', 'bubble', 'crash', 'dropping',
                'peaked', 'too high', 'wait for', 'correction'
            ],
            cardMentions: [
                'charizard', 'pikachu', 'moonbreon', 'lugia', 'rayquaza',
                'giratina', 'mewtwo', 'gengar', 'umbreon', 'sylveon'
            ],
            setMentions: [
                '151', 'crown zenith', 'evolving skies', 'fusion strike',
                'brilliant stars', 'silver tempest', 'lost origin', 'base set'
            ]
        };
        
        // Detect sentiment and cards
        let sentiment = 'neutral';
        let confidence = 0;
        const mentionedCards = [];
        const mentionedSets = [];
        
        // Check bullish signals
        const bullishCount = signals.bullish.filter(word => text.includes(word)).length;
        const bearishCount = signals.bearish.filter(word => text.includes(word)).length;
        
        if (bullishCount > bearishCount) {
            sentiment = 'bullish';
            confidence = Math.min(bullishCount * 0.3, 0.9);
        } else if (bearishCount > bullishCount) {
            sentiment = 'bearish';
            confidence = Math.min(bearishCount * 0.3, 0.9);
        }
        
        // Find card mentions
        signals.cardMentions.forEach(card => {
            if (text.includes(card)) {
                mentionedCards.push(card);
            }
        });
        
        // Find set mentions
        signals.setMentions.forEach(set => {
            if (text.includes(set)) {
                mentionedSets.push(set);
            }
        });
        
        // Only return if significant signal
        if (confidence > 0.5 || mentionedCards.length > 0) {
            return {
                influencer: influencer.handle,
                category: influencer.category,
                sentiment,
                confidence,
                cards: mentionedCards,
                sets: mentionedSets,
                text: tweet.text.substring(0, 100) + '...',
                time: tweet.time,
                impact: this.calculateImpact(influencer, sentiment, confidence)
            };
        }
        
        return null;
    }
    
    // Calculate market impact score
    calculateImpact(influencer, sentiment, confidence) {
        // Base impact on follower count
        const followerScore = parseInt(influencer.followers.replace(/[KM]/, '')) * 
            (influencer.followers.includes('M') ? 1000 : 1);
        
        // Weight by category
        const categoryWeight = {
            'investor': 1.5,
            'collector': 1.2,
            'historian': 1.3,
            'player': 0.8
        }[influencer.category] || 1;
        
        // Calculate impact (0-10 scale)
        const impact = Math.min(
            (followerScore / 100) * categoryWeight * confidence,
            10
        );
        
        return impact.toFixed(1);
    }
    
    // Get current market sentiment from influencers
    getMarketSentiment() {
        const recentSignals = this.recentActivity.filter(a => {
            const hourAgo = new Date();
            hourAgo.setHours(hourAgo.getHours() - 24);
            return new Date(a.time) > hourAgo;
        });
        
        if (recentSignals.length === 0) {
            return { sentiment: 'neutral', confidence: 0 };
        }
        
        let bullishScore = 0;
        let bearishScore = 0;
        
        recentSignals.forEach(signal => {
            const score = parseFloat(signal.impact);
            if (signal.sentiment === 'bullish') {
                bullishScore += score;
            } else if (signal.sentiment === 'bearish') {
                bearishScore += score;
            }
        });
        
        const totalScore = bullishScore + bearishScore;
        
        if (totalScore === 0) {
            return { sentiment: 'neutral', confidence: 0 };
        }
        
        const sentiment = bullishScore > bearishScore ? 'bullish' : 'bearish';
        const confidence = Math.abs(bullishScore - bearishScore) / totalScore;
        
        return { sentiment, confidence };
    }
    
    // Get trending cards from influencer mentions
    getTrendingCards() {
        const cardMentions = new Map();
        
        this.recentActivity.forEach(activity => {
            activity.cards.forEach(card => {
                const current = cardMentions.get(card) || { count: 0, impact: 0 };
                current.count++;
                current.impact += parseFloat(activity.impact);
                cardMentions.set(card, current);
            });
        });
        
        // Sort by impact
        return Array.from(cardMentions.entries())
            .map(([card, data]) => ({ card, ...data }))
            .sort((a, b) => b.impact - a.impact)
            .slice(0, 5);
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = InfluencerMonitor;