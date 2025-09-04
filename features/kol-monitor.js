// KOL (Key Opinion Leader) Monitor for Pokemon TCG
// Monitors influential Twitter/X accounts for market signals

const fs = require('fs').promises;
const path = require('path');

class KOLMonitor {
    constructor(page) {
        this.page = page;
        this.dataPath = path.join(__dirname, '../data');
        
        // Top Pokemon TCG influencers categorized by influence type
        this.kols = {
            tier1_market: [
                { handle: 'PokeRev', influence: 0.95, type: 'content_market' },          // 2.5M YouTube subs
                { handle: 'UnlistedLeaf', influence: 0.93, type: 'content_market' },     // 2.7M YouTube subs
                { handle: 'LeonhartYT', influence: 0.9, type: 'content_mainstream' },    // 1.9M YouTube subs
                { handle: 'RealBreakinNate', influence: 0.88, type: 'pack_opener' },     // 1.5M YouTube subs
                { handle: 'MaxmoefoePokemon', influence: 0.9, type: 'content' },         // Massive influencer
                { handle: 'PokemonTCG', influence: 0.95, type: 'official' },             // Official account
                { handle: 'TCGplayer', influence: 0.85, type: 'marketplace' },           // Major marketplace
                { handle: 'PokeBeach', influence: 0.85, type: 'news' }                   // Pokemon news site
            ],
            tier2_community: [
                { handle: 'PokemonTCGDrops', influence: 0.75, type: 'restock_alerts' },
                { handle: 'PokemonRestocks', influence: 0.75, type: 'restock_alerts' }, 
                { handle: 'TCGTracker', influence: 0.7, type: 'restock_alerts' },
                { handle: 'DeepPocketMnstr', influence: 0.8, type: 'content' },         // 1M+ Instagram
                { handle: 'trickygym', influence: 0.75, type: 'competitive' },
                { handle: 'Azul_GG', influence: 0.7, type: 'competitive' },
                { handle: 'PokemariTCG', influence: 0.65, type: 'competitive' },
                { handle: 'playpokemon', influence: 0.8, type: 'official_tournament' },
                { handle: 'PSA_Card', influence: 0.8, type: 'grading' },
                { handle: 'CGCComics', influence: 0.75, type: 'grading' }
            ],
            tier3_signals: [
                { handle: 'TwicebakedJake', influence: 0.65, type: 'content' },
                { handle: 'TheJWitzz', influence: 0.6, type: 'competitive' },
                { handle: 'PokeMartYT', influence: 0.6, type: 'content' },
                { handle: 'ptcgradio', influence: 0.55, type: 'podcast' },
                { handle: 'TheCatsMeowth', influence: 0.55, type: 'content' },
                { handle: 'PKMNcast', influence: 0.6, type: 'podcast' },
                { handle: 'pokemaniac_aus', influence: 0.55, type: 'collector' },
                { handle: 'limitlessTCG', influence: 0.65, type: 'tournament_data' }
            ]
        };
        
        // Combine all KOLs with their tier info
        this.allKols = [];
        for (const [tier, kols] of Object.entries(this.kols)) {
            kols.forEach(kol => {
                this.allKols.push({ ...kol, tier });
            });
        }
        
        // Rotation state
        this.currentIndex = 0;
        this.lastMonitored = new Map();
        
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
            },
            tournament: {
                keywords: ['topping', 'winning', 'meta', 'tier 1', 'tournament', 'regionals', 'worlds'],
                strength: 1.3
            }
        };
    }
    
    // Monitor next batch of KOLs in rotation
    async monitorNextBatch(batchSize = 3) {  // Reduced from 5 to 3
        console.log('👁️ Monitoring next batch of Pokemon TCG KOLs...');
        
        const batch = [];
        const now = Date.now();
        
        // Select next batch based on tier and last monitored time
        for (let i = 0; i < batchSize; i++) {
            const kol = this.selectNextKOL();
            if (kol) {
                batch.push(kol);
            }
        }
        
        const signals = [];
        
        for (const kol of batch) {
            try {
                const kolSignals = await this.monitorKOL(kol);
                signals.push(...kolSignals);
                
                // Update last monitored
                this.lastMonitored.set(kol.handle, now);
                
                // Human-like rate limit - longer delay between accounts
                await this.sleep(15000 + Math.random() * 10000); // 15-25 seconds between accounts
                
            } catch (error) {
                console.error(`Error monitoring @${kol.handle}:`, error.message);
            }
        }
        
        // Aggregate and save signals
        const aggregated = this.aggregateSignals(signals);
        await this.saveSignals(aggregated);
        
        return aggregated;
    }
    
    // Select next KOL based on priority and rotation
    selectNextKOL() {
        const now = Date.now();
        const tier1Interval = 30 * 60 * 1000; // 30 minutes
        const tier2Interval = 2 * 60 * 60 * 1000; // 2 hours
        const tier3Interval = 6 * 60 * 60 * 1000; // 6 hours
        
        // Check tier 1 first
        for (const kol of this.kols.tier1_market) {
            const lastChecked = this.lastMonitored.get(kol.handle) || 0;
            if (now - lastChecked > tier1Interval) {
                return kol;
            }
        }
        
        // Then tier 2
        for (const kol of this.kols.tier2_community) {
            const lastChecked = this.lastMonitored.get(kol.handle) || 0;
            if (now - lastChecked > tier2Interval) {
                return kol;
            }
        }
        
        // Finally tier 3
        for (const kol of this.kols.tier3_signals) {
            const lastChecked = this.lastMonitored.get(kol.handle) || 0;
            if (now - lastChecked > tier3Interval) {
                return kol;
            }
        }
        
        // If all recently checked, force check oldest
        let oldest = { handle: null, time: now };
        for (const kol of this.allKols) {
            const lastChecked = this.lastMonitored.get(kol.handle) || 0;
            if (lastChecked < oldest.time) {
                oldest = { handle: kol.handle, time: lastChecked };
            }
        }
        
        return this.allKols.find(k => k.handle === oldest.handle);
    }
    
    // Monitor a single KOL
    async monitorKOL(kol) {
        console.log(`   📊 Checking @${kol.handle} (${kol.type})`);
        
        try {
            // Human-like navigation instead of direct URL jump
            await this.humanLikeNavigateToProfile(kol.handle);
            
            await this.sleep(2000 + Math.random() * 2000); // 2-4 seconds random wait
            
            // Check if account is suspended
            const pageContent = await this.page.content();
            if (pageContent.includes('Account suspended') || 
                pageContent.includes('This account doesn\'t exist') ||
                pageContent.includes('Something went wrong')) {
                console.log(`   ⚠️ @${kol.handle} is suspended or unavailable - skipping`);
                return [];
            }
            
            // Extract recent tweets
            const tweets = await this.extractTweets();
            
            // Analyze for signals
            const signals = [];
            for (const tweet of tweets) {
                const signal = this.analyzeTweet(tweet, kol);
                if (signal) {
                    signals.push(signal);
                }
            }
            
            return signals;
            
        } catch (error) {
            console.log(`   ❌ Error monitoring @${kol.handle}: ${error.message}`);
            return [];
        }
    }
    
    // Extract tweets from page
    async extractTweets() {
        try {
            return await this.page.evaluate(() => {
                const tweets = [];
                const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
                
                // Get up to 20 recent tweets
                const limit = Math.min(tweetElements.length, 20);
                
                for (let i = 0; i < limit; i++) {
                    const tweet = tweetElements[i];
                    
                    const text = tweet.querySelector('[data-testid="tweetText"]')?.innerText || '';
                    const timeElement = tweet.querySelector('time');
                    const time = timeElement ? timeElement.getAttribute('datetime') : null;
                    
                    // Get engagement metrics
                    const likes = tweet.querySelector('[data-testid="like"]')?.innerText || '0';
                    const retweets = tweet.querySelector('[data-testid="retweet"]')?.innerText || '0';
                    const replies = tweet.querySelector('[data-testid="reply"]')?.innerText || '0';
                    
                    // Get tweet ID from link
                    const link = tweet.querySelector('a[href*="/status/"]');
                    const tweetId = link ? link.href.split('/status/')[1] : null;
                    
                    if (text && time) {
                        tweets.push({
                            id: tweetId,
                            text,
                            time,
                            engagement: {
                                likes: parseInt(likes.replace(/[^0-9]/g, '')) || 0,
                                retweets: parseInt(retweets.replace(/[^0-9]/g, '')) || 0,
                                replies: parseInt(replies.replace(/[^0-9]/g, '')) || 0
                            }
                        });
                    }
                }
                
                return tweets;
            });
        } catch (error) {
            console.error('Error extracting tweets:', error);
            return [];
        }
    }
    
    // Analyze tweet for signals
    analyzeTweet(tweet, kol) {
        const textLower = tweet.text.toLowerCase();
        
        // Skip retweets and replies (focus on original content)
        if (textLower.startsWith('rt @') || tweet.text.startsWith('@')) {
            return null;
        }
        
        // Check age - only care about recent tweets
        const tweetAge = Date.now() - new Date(tweet.time).getTime();
        const maxAge = 48 * 60 * 60 * 1000; // 48 hours
        
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
        const engagementScore = this.calculateEngagementScore(tweet.engagement, tweetAge);
        const signalStrength = this.calculateSignalStrength(kol, patterns, engagementScore);
        
        return {
            kol: {
                handle: kol.handle,
                influence: kol.influence,
                type: kol.type,
                tier: kol.tier
            },
            tweet: {
                id: tweet.id,
                text: tweet.text,
                time: tweet.time,
                engagement: tweet.engagement,
                url: `https://x.com/${kol.handle}/status/${tweet.id}`
            },
            cards: cardMentions,
            patterns: patterns,
            strength: signalStrength,
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
            { regex: /(\w+)\s*vmax/g, card: '$1 VMAX' },
            { regex: /(\w+)\s*v\s*alt/g, card: '$1 V Alt Art' }
        ];
        
        const found = new Set();
        
        for (const pattern of patterns) {
            const matches = text.matchAll(pattern.regex);
            for (const match of matches) {
                let cardName = pattern.card;
                if (match[1]) {
                    cardName = cardName.replace('$1', match[1]);
                }
                
                // Normalize
                cardName = cardName.split(' ')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');
                
                if (!found.has(cardName)) {
                    mentions.push(cardName);
                    found.add(cardName);
                }
            }
        }
        
        return mentions;
    }
    
    // Calculate engagement score
    calculateEngagementScore(engagement, ageMs) {
        const ageHours = ageMs / (1000 * 60 * 60);
        
        // Normalize by age
        const normalizedLikes = engagement.likes / Math.max(ageHours, 1);
        const normalizedRetweets = engagement.retweets / Math.max(ageHours, 1);
        
        // Weight retweets more heavily (they spread the narrative)
        return (normalizedLikes + normalizedRetweets * 2) / 100;
    }
    
    // Calculate overall signal strength
    calculateSignalStrength(kol, patterns, engagementScore) {
        // Base strength from KOL influence
        let strength = kol.influence;
        
        // Add pattern strength
        const patternBonus = patterns.reduce((sum, p) => sum + (p.strength * p.matches), 0);
        strength *= (1 + patternBonus / 10);
        
        // Factor in engagement
        strength *= (1 + Math.min(engagementScore, 1));
        
        // Boost for certain KOL types
        if (kol.type === 'market_authority' || kol.type === 'investor') {
            strength *= 1.2;
        }
        
        return Math.min(strength, 1.0);
    }
    
    // Aggregate signals by card
    aggregateSignals(signals) {
        const cardSignals = new Map();
        
        for (const signal of signals) {
            for (const card of signal.cards) {
                if (!cardSignals.has(card)) {
                    cardSignals.set(card, {
                        card,
                        signals: [],
                        totalStrength: 0,
                        kols: new Set(),
                        patterns: new Map()
                    });
                }
                
                const cardSig = cardSignals.get(card);
                cardSig.signals.push(signal);
                cardSig.totalStrength += signal.strength;
                cardSig.kols.add(signal.kol.handle);
                
                // Aggregate patterns
                for (const pattern of signal.patterns) {
                    const current = cardSig.patterns.get(pattern.type) || 0;
                    cardSig.patterns.set(pattern.type, current + signal.strength);
                }
            }
        }
        
        // Convert to array and sort
        return Array.from(cardSignals.values())
            .map(sig => ({
                ...sig,
                kolCount: sig.kols.size,
                avgStrength: sig.totalStrength / sig.signals.length,
                dominantPattern: this.getDominantPattern(sig.patterns)
            }))
            .sort((a, b) => b.totalStrength - a.totalStrength);
    }
    
    // Get dominant pattern
    getDominantPattern(patterns) {
        let max = { type: 'general', strength: 0 };
        
        for (const [type, strength] of patterns) {
            if (strength > max.strength) {
                max = { type, strength };
            }
        }
        
        return max;
    }
    
    // Save signals to disk
    async saveSignals(signals) {
        const filePath = path.join(this.dataPath, 'kol-signals.json');
        
        try {
            const data = {
                timestamp: new Date().toISOString(),
                signals: signals.slice(0, 10), // Top 10
                monitored: Array.from(this.lastMonitored.entries())
                    .map(([handle, time]) => ({
                        handle,
                        lastChecked: new Date(time).toISOString()
                    }))
            };
            
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Saved ${signals.length} KOL signals`);
            
        } catch (error) {
            console.error('Error saving signals:', error);
        }
    }
    
    // Get recent signals
    async getRecentSignals(limit = 5) {
        const filePath = path.join(this.dataPath, 'kol-signals.json');
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.signals.slice(0, limit);
        } catch (error) {
            return [];
        }
    }
    
    // Generate alert for strong signal
    generateAlert(signal) {
        const { card, kolCount, dominantPattern, totalStrength } = signal;
        
        let alert = `🎯 KOL SIGNAL: ${card}\n`;
        alert += `👥 ${kolCount} influencer${kolCount > 1 ? 's' : ''} discussing\n`;
        
        // Pattern-specific message
        switch (dominantPattern.type) {
            case 'marketSentiment':
                alert += `💭 Market sentiment shift detected\n`;
                break;
            case 'priceMovement':
                alert += `💰 Price action being discussed\n`;
                break;
            case 'supplyNews':
                alert += `📦 Supply news impacting market\n`;
                break;
            case 'grading':
                alert += `💎 Grading/population focus\n`;
                break;
        }
        
        alert += `📊 Signal strength: ${(totalStrength * 100).toFixed(0)}%`;
        
        return alert;
    }
    
    // Human-like navigation to profile
    async humanLikeNavigateToProfile(handle) {
        console.log(`   🔍 Searching for @${handle} (human-like)...`);
        
        try {
            // First, let's go back to home to reset state
            await this.page.goto('https://x.com/home', {
                waitUntil: 'networkidle2',
                timeout: 20000
            });
            await this.sleep(2000);
            
            // Now search from a clean state
            const searchBox = await this.page.waitForSelector('[data-testid="SearchBox_Search_Input"]', {
                visible: true,
                timeout: 10000
            });
            
            await this.sleep(500 + Math.random() * 1000);
            await searchBox.click();
            await this.sleep(300);
            
            // Triple-click to select all and clear
            await searchBox.click({ clickCount: 3 });
            await this.sleep(200);
            await this.page.keyboard.press('Delete');
            await this.sleep(300);
            
            // Type the exact handle with @ symbol for precision
            const searchQuery = `@${handle}`;
            for (const char of searchQuery) {
                await this.page.keyboard.type(char);
                await this.sleep(50 + Math.random() * 100); // Human typing speed
            }
            
            // Wait a bit before searching
            await this.sleep(1500 + Math.random() * 1000);
            
            // Press Enter to search
            await this.page.keyboard.press('Enter');
            
            // Wait for search results page to load
            await this.page.waitForNavigation({ 
                waitUntil: 'networkidle2',
                timeout: 20000 
            });
            await this.sleep(2000);
            
            // Try to click on People tab first
            const peopleTabSelector = 'a[href*="f=user"]';
            const peopleTab = await this.page.$(peopleTabSelector);
            if (peopleTab) {
                await peopleTab.click();
                await this.sleep(2000);
            }
            
            // Look for the account in results
            // Try multiple selectors as Twitter changes them
            const possibleSelectors = [
                `a[href="/${handle}"]`,
                `div[data-testid="UserCell"] a[href="/${handle}"]`,
                `[data-testid="TypeaheadUser"] a[href="/${handle}"]`
            ];
            
            let clicked = false;
            for (const selector of possibleSelectors) {
                try {
                    const accountLink = await this.page.waitForSelector(selector, {
                        visible: true,
                        timeout: 3000
                    });
                    
                    if (accountLink) {
                        await this.sleep(500 + Math.random() * 500);
                        await accountLink.click();
                        clicked = true;
                        break;
                    }
                } catch (e) {
                    // Try next selector
                }
            }
            
            if (!clicked) {
                // If we can't find the account in search, go directly
                console.log(`   ⚠️ Couldn't find @${handle} in search, trying direct navigation`);
                await this.page.goto(`https://x.com/${handle}`, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
            } else {
                // Wait for profile to load after click
                await this.page.waitForNavigation({ 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                });
            }
            
            await this.sleep(2000);
            
        } catch (error) {
            console.log(`   ❌ Error navigating to @${handle}: ${error.message}`);
            // Final fallback to direct navigation
            try {
                await this.page.goto(`https://x.com/${handle}`, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
            } catch (e) {
                console.log(`   ❌ Failed to reach @${handle} - skipping`);
                throw e;
            }
        }
    }
    
    // Sleep helper
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = KOLMonitor;