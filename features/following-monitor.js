// Following Timeline Monitor
// Monitors the "Following" timeline for KOL activity instead of searching

const fs = require('fs').promises;
const path = require('path');

class FollowingMonitor {
    constructor(page) {
        this.page = page;
        this.dataPath = path.join(__dirname, '../data');
        
        // How often to check following timeline
        this.checkInterval = 20 * 60 * 1000; // 20 minutes
        this.lastCheck = 0;
        
        // Track what we've already analyzed
        this.analyzedTweets = new Set();
        
        // Signal patterns specific to Pokemon TCG
        this.signalPatterns = {
            priceMovement: {
                keywords: ['worth', 'value', 'price', '$', 'going for', 'sold for', 'market'],
                strength: 1.3
            },
            marketSentiment: {
                keywords: ['undervalued', 'overvalued', 'sleeping on', 'gem', 'steal', 'bubble'],
                strength: 1.5
            },
            supplyNews: {
                keywords: ['reprint', 'allocation', 'sold out', 'restock', 'print run', 'shortage'],
                strength: 1.4
            },
            grading: {
                keywords: ['psa 10', 'bgs', 'cgc', 'black label', 'gem mint', 'population', 'pop report'],
                strength: 1.2
            },
            hype: {
                keywords: ['insane', 'crazy', 'fire', 'grail', 'chase', 'must have', 'need this'],
                strength: 1.1
            }
        };
    }
    
    // Check if it's time to monitor following timeline
    shouldCheckFollowing() {
        const now = Date.now();
        const timeSinceLastCheck = now - this.lastCheck;
        
        // Check every 20 minutes, but not if we checked recently
        return timeSinceLastCheck > this.checkInterval;
    }
    
    // Navigate to following timeline and analyze
    async checkFollowingTimeline() {
        console.log('👥 Checking Following timeline for KOL activity...');
        
        try {
            // Navigate to Following timeline
            await this.navigateToFollowing();
            
            // Wait for timeline to load
            await this.page.waitForTimeout(3000 + Math.random() * 2000);
            
            // Extract and analyze tweets
            const signals = await this.extractKOLSignals();
            
            // Save signals
            if (signals.length > 0) {
                await this.saveSignals(signals);
                console.log(`   ✅ Found ${signals.length} signals from Following timeline`);
            } else {
                console.log('   📭 No new signals from Following timeline');
            }
            
            this.lastCheck = Date.now();
            return signals;
            
        } catch (error) {
            console.error('Error checking Following timeline:', error.message);
            return [];
        }
    }
    
    // Navigate to Following timeline
    async navigateToFollowing() {
        console.log('   🔄 Navigating to Following timeline...');
        
        // Method 1: Try clicking Following tab if on home
        try {
            const followingTab = await this.page.$('[role="tab"][href="/home"][aria-selected="false"]');
            if (followingTab) {
                await followingTab.click();
                await this.page.waitForTimeout(2000);
                return;
            }
        } catch (e) {
            // Tab might not exist
        }
        
        // Method 2: Direct navigation
        await this.page.goto('https://x.com/home', {
            waitUntil: 'networkidle2',
            timeout: 20000
        });
        
        await this.page.waitForTimeout(2000);
        
        // Look for Following tab and click it
        try {
            const tabs = await this.page.$$('[role="tab"]');
            for (const tab of tabs) {
                const text = await this.page.evaluate(el => el.textContent, tab);
                if (text && text.includes('Following')) {
                    await tab.click();
                    await this.page.waitForTimeout(2000);
                    break;
                }
            }
        } catch (e) {
            console.log('   ⚠️ Could not find Following tab');
        }
    }
    
    // Extract tweets from followed accounts for direct engagement
    async extractFollowingTweets() {
        try {
            console.log('   📋 Extracting tweets from Following timeline for engagement...');
            
            const tweets = await this.page.evaluate(() => {
                const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
                const tweets = [];
                
                // Get up to 20 tweets for engagement
                const limit = Math.min(tweetElements.length, 20);
                
                for (let i = 0; i < limit; i++) {
                    const tweet = tweetElements[i];
                    
                    // Get author info
                    const authorElement = tweet.querySelector('[data-testid="User-Name"]');
                    const authorText = authorElement ? authorElement.innerText : '';
                    const authorMatch = authorText.match(/@(\w+)/);
                    const username = authorMatch ? authorMatch[1] : null;
                    
                    // Skip if no username
                    if (!username) continue;
                    
                    // Get tweet text
                    const textElement = tweet.querySelector('[data-testid="tweetText"]');
                    const text = textElement ? textElement.innerText : '';
                    
                    // Skip if no text
                    if (!text) continue;
                    
                    // Get time
                    const timeElement = tweet.querySelector('time');
                    const timestamp = timeElement ? timeElement.getAttribute('datetime') : null;
                    
                    // Get post age
                    let postAge = 'unknown';
                    if (timestamp) {
                        const postTime = new Date(timestamp);
                        const now = new Date();
                        const diffMinutes = Math.floor((now - postTime) / (1000 * 60));
                        
                        if (diffMinutes < 5) {
                            postAge = 'very_recent';
                        } else if (diffMinutes < 15) {
                            postAge = 'recent_post';
                        } else if (diffMinutes < 60) {
                            postAge = 'moderate_age';
                        } else {
                            postAge = 'older_post';
                        }
                    }
                    
                    // Check for images/videos
                    const hasImages = tweet.querySelector('img[alt*="Image"]') !== null;
                    const hasVideos = tweet.querySelector('[data-testid="videoPlayer"]') !== null || 
                                     tweet.querySelector('video') !== null;
                    
                    // Get engagement metrics
                    const getMetric = (testId) => {
                        const element = tweet.querySelector(`[data-testid="${testId}"]`);
                        if (!element) return 0;
                        const text = element.textContent || '0';
                        const num = parseInt(text.replace(/[^\d]/g, '')) || 0;
                        return num;
                    };
                    
                    const likes = getMetric('like');
                    const replies = getMetric('reply');
                    const retweets = getMetric('retweet');
                    
                    tweets.push({
                        id: `following_${username}_${Date.now()}_${i}`,
                        username,
                        text,
                        timestamp,
                        postAge,
                        hasImages,
                        hasVideos,
                        likes,
                        replies,
                        retweets,
                        source: 'following_feed',
                        element: tweet // Include element for potential interaction
                    });
                }
                
                return tweets;
            });
            
            console.log(`   ✅ Found ${tweets.length} tweets from followed accounts`);
            return tweets;
            
        } catch (error) {
            console.log('   ⚠️ Error extracting following tweets:', error.message);
            return [];
        }
    }
    
    // Extract tweets from KOLs and analyze for signals
    async extractKOLSignals() {
        try {
            const tweets = await this.page.evaluate(() => {
                const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
                const tweets = [];
                
                // Get up to 30 tweets
                const limit = Math.min(tweetElements.length, 30);
                
                for (let i = 0; i < limit; i++) {
                    const tweet = tweetElements[i];
                    
                    // Get author info
                    const authorElement = tweet.querySelector('[data-testid="User-Name"]');
                    const authorText = authorElement ? authorElement.innerText : '';
                    const authorMatch = authorText.match(/@(\w+)/);
                    const handle = authorMatch ? authorMatch[1] : null;
                    
                    // Skip if no handle
                    if (!handle) continue;
                    
                    // Get tweet text
                    const textElement = tweet.querySelector('[data-testid="tweetText"]');
                    const text = textElement ? textElement.innerText : '';
                    
                    // Get time
                    const timeElement = tweet.querySelector('time');
                    const time = timeElement ? timeElement.getAttribute('datetime') : null;
                    
                    // Get engagement
                    const likes = tweet.querySelector('[data-testid="like"]')?.innerText || '0';
                    const retweets = tweet.querySelector('[data-testid="retweet"]')?.innerText || '0';
                    
                    // Get tweet ID
                    const link = tweet.querySelector('a[href*="/status/"]');
                    const tweetId = link ? link.href.split('/status/')[1] : null;
                    
                    if (text && time && handle) {
                        tweets.push({
                            id: tweetId || `${handle}-${Date.now()}`,
                            handle,
                            text,
                            time,
                            engagement: {
                                likes: parseInt(likes.replace(/[^0-9]/g, '')) || 0,
                                retweets: parseInt(retweets.replace(/[^0-9]/g, '')) || 0
                            },
                            isVerified: authorText.includes('✓') || authorElement?.querySelector('[aria-label="Verified account"]') !== null
                        });
                    }
                }
                
                return tweets;
            });
            
            // Analyze tweets for signals
            const signals = [];
            for (const tweet of tweets) {
                // Skip if we've already analyzed this tweet
                if (this.analyzedTweets.has(tweet.id)) continue;
                
                const signal = this.analyzeTweet(tweet);
                if (signal) {
                    signals.push(signal);
                    this.analyzedTweets.add(tweet.id);
                }
            }
            
            // Keep analyzed set from growing too large
            if (this.analyzedTweets.size > 1000) {
                const toKeep = Array.from(this.analyzedTweets).slice(-500);
                this.analyzedTweets = new Set(toKeep);
            }
            
            return signals;
            
        } catch (error) {
            console.error('Error extracting KOL signals:', error);
            return [];
        }
    }
    
    // Analyze tweet for signals
    analyzeTweet(tweet) {
        const textLower = tweet.text.toLowerCase();
        
        // Skip retweets and replies
        if (textLower.startsWith('rt @') || tweet.text.startsWith('@')) {
            return null;
        }
        
        // Check age - only care about recent tweets
        const tweetAge = Date.now() - new Date(tweet.time).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (tweetAge > maxAge) {
            return null;
        }
        
        // Look for Pokemon card mentions
        const cardMentions = this.extractCardMentions(textLower);
        if (cardMentions.length === 0) {
            return null; // No Pokemon cards mentioned
        }
        
        // Detect signal patterns
        const patterns = [];
        for (const [patternName, pattern] of Object.entries(this.signalPatterns)) {
            const matches = pattern.keywords.filter(kw => textLower.includes(kw));
            if (matches.length > 0) {
                patterns.push({
                    type: patternName,
                    strength: pattern.strength,
                    matches: matches.length
                });
            }
        }
        
        if (patterns.length === 0) {
            return null; // No relevant patterns
        }
        
        // Calculate signal strength
        const baseStrength = tweet.isVerified ? 0.7 : 0.5;
        const engagementBoost = Math.min(tweet.engagement.likes / 1000, 0.3);
        const patternBoost = patterns.reduce((sum, p) => sum + (p.strength - 1) * 0.1, 0);
        
        const strength = Math.min(baseStrength + engagementBoost + patternBoost, 1.0);
        
        return {
            tweet: {
                id: tweet.id,
                handle: tweet.handle,
                text: tweet.text,
                time: tweet.time,
                engagement: tweet.engagement,
                url: `https://x.com/${tweet.handle}/status/${tweet.id}`
            },
            cards: cardMentions,
            patterns: patterns,
            strength: strength,
            source: 'following_timeline',
            detectedAt: Date.now()
        };
    }
    
    // Extract card mentions
    extractCardMentions(text) {
        const mentions = [];
        
        // Common card patterns
        const patterns = [
            { regex: /moonbreon|umbreon\s*vmax\s*alt/g, card: 'Umbreon VMAX Alt Art' },
            { regex: /charizard\s*upc/g, card: 'Charizard UPC' },
            { regex: /giratina\s*(v\s*)?alt/g, card: 'Giratina V Alt Art' },
            { regex: /lugia\s*(v\s*)?alt/g, card: 'Lugia V Alt Art' },
            { regex: /rayquaza\s*vmax\s*alt/g, card: 'Rayquaza VMAX Alt Art' },
            { regex: /base\s*set\s*charizard/g, card: 'Base Set Charizard' },
            { regex: /(surging\s*sparks)/g, card: 'Surging Sparks' },
            { regex: /(crown\s*zenith)/g, card: 'Crown Zenith' },
            { regex: /(evolving\s*skies)/g, card: 'Evolving Skies' }
        ];
        
        const found = new Set();
        
        for (const pattern of patterns) {
            if (pattern.regex.test(text)) {
                if (!found.has(pattern.card)) {
                    mentions.push(pattern.card);
                    found.add(pattern.card);
                }
            }
        }
        
        return mentions;
    }
    
    // Save signals to disk
    async saveSignals(signals) {
        const filePath = path.join(this.dataPath, 'following-signals.json');
        
        try {
            let existing = { signals: [], lastUpdate: null };
            
            try {
                const data = await fs.readFile(filePath, 'utf8');
                existing = JSON.parse(data);
            } catch (e) {
                // File doesn't exist yet
            }
            
            // Add new signals
            existing.signals = signals;
            existing.lastUpdate = new Date().toISOString();
            existing.summary = this.generateSummary(signals);
            
            await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
            
        } catch (error) {
            console.error('Error saving following signals:', error);
        }
    }
    
    // Generate summary of signals
    generateSummary(signals) {
        const cardCounts = {};
        const patternCounts = {};
        
        for (const signal of signals) {
            // Count cards
            for (const card of signal.cards) {
                cardCounts[card] = (cardCounts[card] || 0) + 1;
            }
            
            // Count patterns
            for (const pattern of signal.patterns) {
                patternCounts[pattern.type] = (patternCounts[pattern.type] || 0) + 1;
            }
        }
        
        return {
            totalSignals: signals.length,
            topCards: Object.entries(cardCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([card, count]) => ({ card, mentions: count })),
            dominantPatterns: Object.entries(patternCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([pattern, count]) => ({ pattern, count }))
        };
    }
    
    // Get recent signals for bot to use
    async getRecentSignals() {
        const filePath = path.join(this.dataPath, 'following-signals.json');
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(data);
            
            // Only return signals from last 24 hours
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            return parsed.signals.filter(s => s.detectedAt > oneDayAgo);
            
        } catch (error) {
            return [];
        }
    }
}

module.exports = FollowingMonitor;