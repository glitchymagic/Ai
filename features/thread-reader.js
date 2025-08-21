// Thread Context Reader - Gets full conversation history
class ThreadReader {
    constructor(page) {
        this.page = page;
    }
    
    async getFullThreadContext(tweetElement) {
        try {
            const threadMessages = [];
            
            // Get all tweets in the thread (conversation view)
            const allTweets = await this.page.$$('article[data-testid="tweet"]');
            
            for (const tweet of allTweets) {
                const tweetData = await tweet.evaluate(el => {
                    // Get username
                    let username = 'unknown';
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
                    const text = textEl ? textEl.innerText : '';
                    
                    // Get time
                    const timeEl = el.querySelector('time');
                    const timestamp = timeEl ? timeEl.getAttribute('datetime') : null;
                    
                    // Check for images
                    const hasImages = !!el.querySelector('img[alt*="Image"]');
                    
                    return {
                        username,
                        text,
                        timestamp,
                        hasImages
                    };
                });
                
                if (tweetData.text) {
                    threadMessages.push(tweetData);
                }
            }
            
            // Sort by timestamp to ensure chronological order
            threadMessages.sort((a, b) => {
                if (!a.timestamp || !b.timestamp) return 0;
                return new Date(a.timestamp) - new Date(b.timestamp);
            });
            
            return this.formatThreadContext(threadMessages);
            
        } catch (error) {
            console.log(`   ⚠️ Error reading thread: ${error.message}`);
            return null;
        }
    }
    
    formatThreadContext(messages) {
        if (messages.length === 0) return null;
        
        // Build a narrative of the conversation
        let context = {
            participants: new Set(),
            mainTopic: '',
            fullConversation: [],
            lastMessage: messages[messages.length - 1],
            threadLength: messages.length,
            hasImages: false
        };
        
        // Collect all participants
        messages.forEach(msg => {
            context.participants.add(msg.username);
            if (msg.hasImages) context.hasImages = true;
        });
        
        // Format conversation for context
        context.fullConversation = messages.map((msg, index) => ({
            position: index + 1,
            username: msg.username,
            text: msg.text,
            hasImages: msg.hasImages
        }));
        
        // Try to identify main topic from first message
        if (messages.length > 0) {
            const firstMsg = messages[0].text.toLowerCase();
            
            // Identify topic
            if (firstMsg.includes('pull')) context.mainTopic = 'card pulls';
            else if (firstMsg.includes('grade') || firstMsg.includes('psa')) context.mainTopic = 'grading';
            else if (firstMsg.includes('price') || firstMsg.includes('worth')) context.mainTopic = 'pricing';
            else if (firstMsg.includes('trade')) context.mainTopic = 'trading';
            else if (firstMsg.includes('fake') || firstMsg.includes('real')) context.mainTopic = 'authenticity';
            else if (firstMsg.includes('collection')) context.mainTopic = 'collection showcase';
            else context.mainTopic = 'general discussion';
        }
        
        return context;
    }
    
    createContextSummary(threadContext) {
        if (!threadContext) return '';
        
        let summary = `Thread Context (${threadContext.threadLength} messages):\n`;
        
        // Add topic
        summary += `Topic: ${threadContext.mainTopic}\n`;
        
        // Add conversation flow
        summary += 'Conversation:\n';
        threadContext.fullConversation.forEach((msg, idx) => {
            // Truncate long messages
            const text = msg.text.length > 100 ? 
                msg.text.substring(0, 97) + '...' : 
                msg.text;
            summary += `${idx + 1}. @${msg.username}: "${text}"${msg.hasImages ? ' [with image]' : ''}\n`;
        });
        
        return summary;
    }
    
    extractKeyPoints(threadContext) {
        if (!threadContext) return [];
        
        const keyPoints = [];
        const fullText = threadContext.fullConversation
            .map(msg => msg.text)
            .join(' ')
            .toLowerCase();
        
        // Extract mentioned cards
        const cardPatterns = [
            'charizard', 'pikachu', 'umbreon', 'moonbreon',
            'rayquaza', 'lugia', 'mewtwo', 'gengar'
        ];
        
        const mentionedCards = [];
        cardPatterns.forEach(card => {
            if (fullText.includes(card)) {
                mentionedCards.push(card);
            }
        });
        
        if (mentionedCards.length > 0) {
            keyPoints.push(`Cards discussed: ${mentionedCards.join(', ')}`);
        }
        
        // Extract prices mentioned
        const priceMatches = fullText.match(/\$[\d,]+/g);
        if (priceMatches) {
            keyPoints.push(`Prices mentioned: ${priceMatches.join(', ')}`);
        }
        
        // Extract questions asked
        const questions = threadContext.fullConversation
            .filter(msg => msg.text.includes('?'))
            .map(msg => ({ user: msg.username, question: msg.text }));
        
        if (questions.length > 0) {
            keyPoints.push(`${questions.length} question(s) asked`);
        }
        
        return keyPoints;
    }
}

module.exports = ThreadReader;