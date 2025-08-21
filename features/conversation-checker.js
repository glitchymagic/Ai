const ThreadReader = require('./thread-reader');

class ConversationChecker {
    constructor(page, botUsername = 'GlitchyGradeAi') {
        this.page = page;
        this.botUsername = botUsername;
        this.lastCheckTime = Date.now();
        this.checkedConversations = new Set();
        this.threadReader = new ThreadReader(page);
    }

    async checkForReplies() {
        try {
            console.log('\n💬 Checking for conversation replies...');
            
            // Load persisted conversation data
            const conversationData = await this.loadConversationData();
            const processedIds = new Set(conversationData.processedIds || []);
            
            // Go to notifications or mentions
            const notificationsUrl = `https://x.com/notifications/mentions`;
            await this.page.goto(notificationsUrl, { 
                waitUntil: 'networkidle2',
                timeout: 15000 
            }).catch(() => {
                console.log('   ⚠️ Could not load notifications');
                return [];
            });
            
            await this.sleep(3000);
            
            // Find tweets that are replies to us
            const replies = await this.page.$$('article[data-testid="tweet"]');
            console.log(`   📨 Found ${replies.length} potential replies`);
            
            const conversationOpportunities = [];
            let newRepliesCount = 0;
            let alreadyProcessedCount = 0;
            
            for (const reply of replies) {
                const replyData = await this.extractReplyData(reply);
                
                if (replyData && replyData.tweetId) {
                    // Check if we've already processed this tweet ID
                    if (processedIds.has(replyData.tweetId)) {
                        alreadyProcessedCount++;
                        continue; // Skip already processed
                    }
                    
                    // Check if this is actually a reply to our bot (not just a mention)
                    // Must be: 1) A reply, 2) To us or mentioning us, 3) Not from us
                    if ((replyData.isReplyToUs || replyData.mentionsBot) && 
                        replyData.username !== this.botUsername &&
                        replyData.username !== 'GlitchyGradeAi') {
                        
                        // Check if it's recent (within last 24 hours)
                        if (this.isRecentReply(replyData.timestamp)) {
                            conversationOpportunities.push({
                                element: reply,
                                data: replyData
                            });
                            newRepliesCount++;
                            console.log(`   ✅ New reply from @${replyData.username}: "${replyData.tweetText.substring(0, 40)}..."`);
                        } else {
                            console.log(`   ⏰ Old reply from @${replyData.username} (>24h old)`);
                        }
                    }
                }
            }
            
            console.log(`   📊 Status: ${newRepliesCount} new, ${alreadyProcessedCount} already processed`);
            console.log(`   🎯 Found ${conversationOpportunities.length} conversation opportunities`);
            return conversationOpportunities;
            
        } catch (error) {
            console.log(`   ❌ Error checking conversations: ${error.message}`);
            return [];
        }
    }

    async extractReplyData(tweetElement) {
        try {
            return await tweetElement.evaluate((el, botUsername) => {
                // Get tweet ID
                const linkElement = el.querySelector('a[href*="/status/"]');
                const tweetId = linkElement ? linkElement.href.split('/status/')[1].split('?')[0] : null;
                
                // Get username
                let username = null;
                const links = el.querySelectorAll('a[href^="/"]');
                for (const link of links) {
                    const href = link.getAttribute('href');
                    if (href && href.match(/^\/[^\/]+$/) && !href.includes('/home')) {
                        username = href.substring(1);
                        break;
                    }
                }
                
                // Get tweet text
                const textEl = el.querySelector('[data-testid="tweetText"]');
                const tweetText = textEl ? textEl.innerText : '';
                
                // Check if this mentions our bot - more specific check
                const mentionsBot = tweetText.toLowerCase().includes('@' + botUsername.toLowerCase());
                
                // Check if this is a reply (has "Replying to" text)
                const replyingToElement = el.querySelector('[data-testid="inReplyToText"]');
                const isReply = !!replyingToElement;
                
                // Check if replying to us specifically
                let isReplyToUs = false;
                if (replyingToElement && mentionsBot) {
                    const replyText = replyingToElement.innerText.toLowerCase();
                    isReplyToUs = replyText.includes('@' + botUsername.toLowerCase());
                }
                
                // Get time if available
                const timeElement = el.querySelector('time');
                const timestamp = timeElement ? timeElement.getAttribute('datetime') : null;
                
                return { 
                    tweetId, 
                    username, 
                    tweetText, 
                    isReplyToUs,
                    isReply,
                    mentionsBot,
                    timestamp
                };
            }, this.botUsername);
        } catch (error) {
            console.log(`   ⚠️ Error extracting reply data: ${error.message}`);
            return null;
        }
    }

    async navigateToReply(replyData) {
        try {
            // Navigate directly to the tweet that replied to us
            const tweetUrl = `https://x.com/${replyData.username}/status/${replyData.tweetId}`;
            console.log(`   🔗 Navigating to conversation: ${tweetUrl}`);
            
            await this.page.goto(tweetUrl, {
                waitUntil: 'networkidle2',
                timeout: 15000
            });
            
            await this.sleep(3000);
            
            // Get full thread context
            const threadContext = await this.threadReader.getFullThreadContext();
            if (threadContext) {
                console.log(`   📖 Read thread: ${threadContext.threadLength} messages, topic: ${threadContext.mainTopic}`);
                replyData.threadContext = threadContext;
            }
            
            // Find the specific tweet on the page
            const tweet = await this.page.$('article[data-testid="tweet"]');
            return tweet;
            
        } catch (error) {
            console.log(`   ❌ Error navigating to reply: ${error.message}`);
            return null;
        }
    }

    isRecentReply(timestamp) {
        if (!timestamp) return true; // If no timestamp, assume it's recent
        
        const replyTime = new Date(timestamp).getTime();
        const now = Date.now();
        const hoursSince = (now - replyTime) / (1000 * 60 * 60);
        
        // Only respond to replies from the last 24 hours
        return hoursSince < 24;
    }

    async loadConversationData() {
        try {
            const fs = require('fs').promises;
            const conversationFile = './data/conversations.json';
            const data = await fs.readFile(conversationFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, return empty data
            return { processedIds: [], history: [] };
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ConversationChecker;