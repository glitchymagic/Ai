// Smart Engagement Selector - Decides what to engage with and how
// Prevents shadow bans by being selective and natural

class EngagementSelector {
    constructor() {
        // Engagement strategy weights (more aggressive)
        this.strategy = {
            likeOnly: 0.2,        // 20% just like (reduced from 70%)
            likeAndReply: 0.75,   // 75% like and reply (increased from 25%)
            skipEntirely: 0.05    // 5% skip even good posts
        };
        
        // Quality indicators for accounts
        this.accountQuality = {
            minFollowers: 50,      // Skip accounts with < 50 followers
            minAge: 30,            // Account should be 30+ days old
            maxFollowing: 5000,    // Avoid follow-spam accounts
            verifiedBonus: true    // Prefer verified accounts
        };
        
        // Post quality indicators
        this.postQuality = {
            hasImage: 0.3,         // 30% boost for images
            hasQuestion: 0.4,      // 40% boost for questions
            isConversation: 0.2,   // 20% boost if part of thread
            highEngagement: 0.3,   // 30% boost if has likes/replies
            originalContent: 0.4   // 40% boost for original (not RT)
        };
        
        // Red flags to avoid
        this.redFlags = [
            'giveaway',
            'follow me',
            'dm me',
            'check my',
            'link in bio',
            '🔥🔥🔥🔥',  // Spam indicators
            'telegram',
            'whatsapp',
            'cashapp',
            '$$$',
            'guaranteed',
            'profit'
        ];
        
        // Track recent engagement to avoid patterns
        this.recentEngagements = [];
        this.lastReplyTime = 0;
        this.repliesThisHour = 0;
        this.likesThisSession = 0;
    }
    
    // Main decision maker
    async shouldEngageWithPost(postElement, postData) {
        // Extract post information
        const analysis = await this.analyzePost(postElement, postData);
        
        // Check red flags first
        if (this.hasRedFlags(analysis.text)) {
            console.log('   🚫 Red flags detected, skipping');
            return { action: 'skip', reason: 'red_flags' };
        }
        
        // Check if we've engaged too recently
        if (this.isTooSoon()) {
            console.log('   ⏰ Too soon since last engagement');
            return { action: 'skip', reason: 'cooldown' };
        }
        
        // Calculate engagement score
        const score = this.calculateEngagementScore(analysis);
        
        // Very low score = skip (further lowered threshold)
        if (score < 0.15) {
            console.log(`   📊 Very low score (${(score * 100).toFixed(0)}%), skipping`);
            return { action: 'skip', reason: 'low_score' };
        }
        
        // Decide engagement type based on score and strategy
        const decision = this.decideEngagementType(score, analysis);
        
        // DON'T track engagement here - only track AFTER successful reply
        // This was causing permanent cooldown!
        
        return decision;
    }
    
    // Analyze post for quality signals
    async analyzePost(element, data) {
        const analysis = {
            text: data.text || '',
            username: data.username || '',
            hasImage: false,
            hasVideo: false,
            hasQuestion: false,
            isReply: false,
            likeCount: 0,
            replyCount: 0,
            isVerified: false,
            accountAge: 'unknown',
            followerCount: 0
        };
        
        try {
            // Check for media
            const images = await element.$$('img[alt*="Image"]');
            analysis.hasImage = images.length > 0;
            
            const videos = await element.$$('video');
            analysis.hasVideo = videos.length > 0;
            
            // Check if it's a question
            analysis.hasQuestion = analysis.text.includes('?');
            
            // Check if it's a reply
            analysis.isReply = analysis.text.includes('@');
            
            // Try to get engagement metrics (these selectors might need updating)
            const likeButton = await element.$('[data-testid="like"]');
            if (likeButton) {
                const likeText = await likeButton.innerText;
                analysis.likeCount = this.parseCount(likeText);
            }
            
            // Check for verified badge
            const verifiedBadge = await element.$('[data-testid="icon-verified"]');
            analysis.isVerified = !!verifiedBadge;
            
        } catch (error) {
            // Silent fail, use defaults
        }
        
        return analysis;
    }
    
    // Calculate engagement score (0-1)
    calculateEngagementScore(analysis) {
        let score = 0.5; // Base score
        
        // Boost for media
        if (analysis.hasImage) score += 0.2;
        if (analysis.hasVideo) score += 0.15;
        
        // Boost for questions (good for engagement)
        if (analysis.hasQuestion) score += 0.25;
        
        // Boost for verified accounts
        if (analysis.isVerified) score += 0.15;
        
        // Penalty for replies (less visibility)
        if (analysis.isReply) score -= 0.2;
        
        // Boost for engagement
        if (analysis.likeCount > 10) score += 0.1;
        if (analysis.likeCount > 50) score += 0.1;
        if (analysis.replyCount > 5) score += 0.1;
        
        // Check text quality
        const textQuality = this.assessTextQuality(analysis.text);
        score += textQuality;
        
        // Cap between 0 and 1
        return Math.max(0, Math.min(1, score));
    }
    
    // Assess text quality (more generous scoring)
    assessTextQuality(text) {
        let quality = 0.1; // Base positive score
        
        // Strong positive indicators
        if (text.includes('pulled') || text.includes('pull')) quality += 0.15;
        if (text.includes('grade') || text.includes('PSA') || text.includes('CGC')) quality += 0.15;
        if (text.includes('collection') || text.includes('binder')) quality += 0.1;
        if (text.includes('mail day') || text.includes('mailday')) quality += 0.15;
        if (text.includes('?') && text.length > 15) quality += 0.2; // Questions are great
        
        // Pokemon-specific content
        if (text.match(/charizard|pikachu|pokemon|tcg|card/i)) quality += 0.1;
        if (text.match(/pack|box|booster|etb/i)) quality += 0.1;
        if (text.match(/shiny|holo|rare|alt art/i)) quality += 0.1;
        
        // Engagement indicators
        if (text.includes('love') || text.includes('favorite')) quality += 0.05;
        if (text.includes('finally') || text.includes('got')) quality += 0.05;
        
        // Only penalize really bad content
        if (text.length < 8) quality -= 0.3; // Very short
        if (text.includes('http') && text.split('http').length > 2) quality -= 0.2; // Multiple links
        if (text.split('!').length > 4) quality -= 0.1; // Excessive exclamations
        if (text.includes('@') && text.split('@').length > 4) quality -= 0.15; // Too many mentions
        
        return quality;
    }
    
    // Check for red flags
    hasRedFlags(text) {
        const textLower = text.toLowerCase();
        return this.redFlags.some(flag => textLower.includes(flag));
    }
    
    // Check if engaging too soon
    isTooSoon() {
        const now = Date.now();
        const timeSinceLastReply = now - this.lastReplyTime;
        
        // Only check cooldown if we've actually replied before
        // Reduced to 30 seconds for testing (was 3 minutes)
        if (this.lastReplyTime > 0 && timeSinceLastReply < 30000) {
            return true;
        }
        
        // Check hourly limit (raised to 15 for better engagement)
        const hourAgo = now - 3600000;
        const recentReplies = this.recentEngagements.filter(e => 
            e.type === 'reply' && e.timestamp > hourAgo
        ).length;
        
        if (recentReplies >= 15) {
            return true;
        }
        
        return false;
    }
    
    // Decide what type of engagement (deterministic)
    decideEngagementType(score, analysis) {
        // Create deterministic value from username and text
        const hashInput = `${analysis.username}|${analysis.text}|${score}`;
        const deterministicValue = this.hashToFloat(hashInput);
        
        // High score posts get better engagement
        if (score > 0.7) {
            // High quality post
            if (analysis.hasQuestion) {
                // Always reply to high quality questions
                return { 
                    action: 'reply', 
                    confidence: score,
                    reason: 'high_quality_question'
                };
            } else if (deterministicValue < 0.8) {
                // 80% deterministic chance to reply (increased from 40%)
                return { 
                    action: 'reply', 
                    confidence: score,
                    reason: 'high_quality_post'
                };
            } else {
                // Otherwise like
                return { 
                    action: 'like', 
                    confidence: score,
                    reason: 'like_quality_content'
                };
            }
        } else if (score > 0.5) {
            // Medium quality
            if (deterministicValue < 0.6) {
                // 60% deterministic chance to reply (increased from 20%)
                return { 
                    action: 'reply', 
                    confidence: score,
                    reason: 'medium_quality_engagement'
                };
            } else if (deterministicValue < 0.9) {
                // 30% chance to like
                return { 
                    action: 'like', 
                    confidence: score,
                    reason: 'like_decent_content'
                };
            } else {
                // 10% skip for natural behavior
                return { 
                    action: 'skip', 
                    confidence: score,
                    reason: 'natural_skip'
                };
            }
        } else {
            // Low quality
            if (deterministicValue < 0.4) {
                // 40% deterministic chance to reply even for lower quality
                return { 
                    action: 'reply', 
                    confidence: score,
                    reason: 'engagement_opportunity'
                };
            } else if (deterministicValue < 0.6) {
                // 20% like
                return { 
                    action: 'like', 
                    confidence: score,
                    reason: 'courtesy_like'
                };
            } else {
                // 40% skip
                return { 
                    action: 'skip', 
                    confidence: score,
                    reason: 'low_quality'
                };
            }
        }
    }
    
    // Hash string to float between 0 and 1
    hashToFloat(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        // Convert to float between 0 and 1
        return Math.abs(hash % 1000) / 1000;
    }
    
    // Track engagement for pattern avoidance
    trackEngagement(decision, analysis) {
        const now = Date.now();
        
        this.recentEngagements.push({
            type: decision.action,
            timestamp: now,
            username: analysis.username,
            score: decision.confidence
        });
        
        // Keep only last 100 engagements
        if (this.recentEngagements.length > 100) {
            this.recentEngagements.shift();
        }
        
        if (decision.action === 'reply') {
            this.lastReplyTime = now;
            this.repliesThisHour++;
        } else if (decision.action === 'like') {
            this.likesThisSession++;
        }
        
        // Reset hourly counter
        const hourAgo = now - 3600000;
        this.recentEngagements = this.recentEngagements.filter(e => 
            e.timestamp > hourAgo
        );
    }
    
    // Update after successful reply
    updateAfterReply(username) {
        const now = Date.now();
        this.lastReplyTime = now;
        
        this.recentEngagements.push({
            type: 'reply',
            timestamp: now,
            username: username,
            score: 1
        });
        
        // Clean old entries
        const hourAgo = now - 3600000;
        this.recentEngagements = this.recentEngagements.filter(e => 
            e.timestamp > hourAgo
        );
    }
    
    // Parse engagement counts
    parseCount(text) {
        if (!text) return 0;
        
        // Remove commas and parse
        const num = text.replace(/,/g, '').match(/\d+/);
        if (num) {
            const value = parseInt(num[0]);
            // Handle K (thousands)
            if (text.includes('K')) return value * 1000;
            // Handle M (millions)
            if (text.includes('M')) return value * 1000000;
            return value;
        }
        
        return 0;
    }
    
    // Get current stats
    getStats() {
        const now = Date.now();
        const hourAgo = now - 3600000;
        
        const recentReplies = this.recentEngagements.filter(e => 
            e.type === 'reply' && e.timestamp > hourAgo
        ).length;
        
        const recentLikes = this.recentEngagements.filter(e => 
            e.type === 'like' && e.timestamp > hourAgo
        ).length;
        
        return {
            repliesThisHour: recentReplies,
            likesThisHour: recentLikes,
            totalEngagements: this.recentEngagements.length,
            timeSinceLastReply: now - this.lastReplyTime
        };
    }
}

module.exports = EngagementSelector;