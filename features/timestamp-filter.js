// Timestamp Filter - Only engage with recent posts to avoid bot detection
class TimestampFilter {
    constructor() {
        this.maxPostAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.preferredMaxAge = 6 * 60 * 60 * 1000; // 6 hours preferred (more natural)
    }
    
    // Parse various timestamp formats from Twitter
    parseTimestamp(timestampText) {
        if (!timestampText) return null;
        
        const now = new Date();
        const textLower = timestampText.toLowerCase();
        
        // Handle relative timestamps
        if (textLower.includes('now') || textLower.includes('just now')) {
            return now;
        }
        
        // Stricter regex matching for relative times
        const mRel = textLower.match(/^(\d+)\s*m(in)?$/); // "5m", "5 min"
        if (mRel) { 
            const minutes = +mRel[1]; 
            return new Date(now - minutes*60*1000); 
        }
        
        const hRel = textLower.match(/^(\d+)\s*h(ours?)?$/); // "2h", "2 hours"
        if (hRel) { 
            const hours = +hRel[1]; 
            return new Date(now - hours*3600*1000); 
        }
        
        if (textLower.includes('min')) {
            // "5 minutes ago" format
            const match = textLower.match(/(\d+)\s*min/);
            if (match) {
                const minutes = parseInt(match[1]);
                return new Date(now.getTime() - (minutes * 60 * 1000));
            }
        }
        
        if (textLower.includes('hour')) {
            // "2 hours ago" format
            const match = textLower.match(/(\d+)\s*hour/);
            if (match) {
                const hours = parseInt(match[1]);
                return new Date(now.getTime() - (hours * 60 * 60 * 1000));
            }
        }
        
        // Handle dates like "Dec 15" or "15 Dec"
        if (textLower.includes('dec') || textLower.includes('jan') || textLower.includes('feb') ||
            textLower.includes('mar') || textLower.includes('apr') || textLower.includes('may') ||
            textLower.includes('jun') || textLower.includes('jul') || textLower.includes('aug') ||
            textLower.includes('sep') || textLower.includes('oct') || textLower.includes('nov')) {
            
            // This is likely an old post (shows actual date instead of relative time)
            const parsedDate = new Date(timestampText);
            return isNaN(parsedDate.getTime()) ? null : parsedDate;
        }
        
        // Try to parse as a regular date
        try {
            const parsedDate = new Date(timestampText);
            return isNaN(parsedDate.getTime()) ? null : parsedDate;
        } catch (error) {
            return null;
        }
    }
    
    // Extract timestamp from tweet element
    async extractTimestamp(tweetElement) {
        try {
            // Common Twitter timestamp selectors
            const timestampSelectors = [
                'time',
                '[data-testid="Time"]',
                '[datetime]',
                'a[href*="status"] time',
                '.tweet-timestamp',
                '.time',
                '[aria-label*="ago"]',
                '[title*="AM"], [title*="PM"]'
            ];
            
            for (const selector of timestampSelectors) {
                const timeElement = await tweetElement.$(selector);
                if (timeElement) {
                    // Try to get datetime attribute first
                    const datetime = await timeElement.evaluate(el => el.getAttribute('datetime'));
                    if (datetime) {
                        return this.parseTimestamp(datetime);
                    }
                    
                    // Try to get title attribute
                    const title = await timeElement.evaluate(el => el.getAttribute('title'));
                    if (title) {
                        return this.parseTimestamp(title);
                    }
                    
                    // Try to get text content
                    const text = await timeElement.evaluate(el => el.textContent);
                    if (text) {
                        return this.parseTimestamp(text);
                    }
                }
            }
            
            // Fallback: look for any text that looks like a timestamp
            const tweetText = await tweetElement.evaluate(el => el.textContent);
            const timestampMatch = tweetText.match(/(\d+[mh]|\d+\s*(min|hour|day)s?\s*ago|just now|now)/i);
            if (timestampMatch) {
                return this.parseTimestamp(timestampMatch[0]);
            }
            
        } catch (error) {
            console.log(`   ⚠️ Error extracting timestamp: ${error.message}`);
        }
        
        return null;
    }
    
    // Check if post is recent enough to engage with
    shouldEngageByAge(timestamp) {
        if (!timestamp) {
            // If we can't determine age, be cautious and skip
            return { 
                engage: false, 
                reason: 'unknown_age',
                details: 'Could not determine post age'
            };
        }
        
        const now = new Date();
        const postAge = now.getTime() - timestamp.getTime();
        
        // Posts older than 24 hours - definitely skip
        if (postAge > this.maxPostAge) {
            const hoursOld = Math.round(postAge / (60 * 60 * 1000));
            return { 
                engage: false, 
                reason: 'too_old',
                details: `Post is ${hoursOld} hours old (max: 24h)`
            };
        }
        
        // Posts within 6 hours - preferred engagement window
        if (postAge <= this.preferredMaxAge) {
            const minutesOld = Math.round(postAge / (60 * 1000));
            return { 
                engage: true, 
                reason: 'recent_post',
                details: `Post is ${minutesOld} minutes old (ideal range)`
            };
        }
        
        // Posts 6-24 hours old - acceptable but lower priority
        const hoursOld = Math.round(postAge / (60 * 60 * 1000));
        return { 
            engage: true, 
            reason: 'acceptable_age',
            details: `Post is ${hoursOld} hours old (acceptable range)`
        };
    }
    
    // Get human-readable age description
    getAgeDescription(timestamp) {
        if (!timestamp) return 'unknown age';
        
        const now = new Date();
        const ageMs = now.getTime() - timestamp.getTime();
        
        const minutes = Math.round(ageMs / (60 * 1000));
        const hours = Math.round(ageMs / (60 * 60 * 1000));
        const days = Math.round(ageMs / (24 * 60 * 60 * 1000));
        
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
    }
}

module.exports = TimestampFilter;