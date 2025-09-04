const axios = require('axios');

class LMStudioAI {
    constructor(port = 1234) {
        this.baseURL = `http://localhost:${port}/v1`;
        this.available = false;
        this.modelName = 'unknown';
        this.checkAvailability();
    }
    
    async checkAvailability() {
        try {
            // Check if LM Studio server is running
            const response = await axios.get(`${this.baseURL}/models`, {
                timeout: 2000
            });
            
            if (response.data && response.data.data && response.data.data.length > 0) {
                this.available = true;
                this.modelName = response.data.data[0].id;
                console.log(`✅ LM Studio connected! Model: ${this.modelName}`);
            } else {
                console.log('⚠️ LM Studio running but no model loaded');
                console.log('Please load a model in LM Studio first');
                this.available = false;
            }
        } catch (error) {
            console.log('⚠️ LM Studio not running on port 1234');
            console.log('Start LM Studio and enable the local server');
            this.available = false;
        }
    }
    
    async generateCustom(prompt) {
        if (!this.available) {
            return null;
        }
        
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: this.modelName,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 100
                },
                { timeout: 10000 }
            );
            
            return response.data.choices[0].message.content.trim();
        } catch (error) {
            console.log('LM Studio custom generation error:', error.message);
            return null;
        }
    }
    
    async generateThreadResponse(username, latestMessage, threadContext, visualData = null) {
        if (!this.available) {
            return null;
        }
        
        const isPriceRelated = latestMessage.toLowerCase().match(/worth|value|price|cost|\$|dollar/);
        const visualContext = visualData?.visionAnalysis?.analyzed ? 
            'User shared an image/video with Pokemon cards' : '';
        
        const prompt = `Generate a short Pokemon TCG reply (max 280 chars) for this thread:

Thread Topic: ${threadContext.mainTopic || 'Pokemon TCG'}
Recent messages:
${threadContext.fullConversation?.slice(-3).map(m => `@${m.username}: ${m.text.slice(0,80)}`).join('\n') || 'No previous messages'}

Latest from @${username}: "${latestMessage}"
${visualContext}

Rules:
- One short conversational reply
- Reference the conversation naturally
- ${isPriceRelated ? 'Include a price/stat if relevant' : 'Focus on the topic'}
- No hashtags
- Casual Gen-Z tone
- ${visualData ? 'DO NOT ask what they found - comment on what they showed' : ''}

Reply:`;
        
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: this.modelName,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.8,
                    max_tokens: 100
                },
                { timeout: 10000 }
            );
            
            let reply = response.data.choices[0].message.content.trim();
            // Clean up the response
            reply = reply.replace(/^[\"']|[\"']$/g, '') // Remove quotes
                        .replace(/#\w+/g, '') // Remove hashtags
                        .split('\n')[0] // Take first line only
                        .trim();
            
            // Ensure it's under 280 chars
            if (reply.length > 280) {
                reply = reply.substring(0, 277) + '...';
            }
            
            return reply;
        } catch (error) {
            console.log('LM Studio thread generation error:', error.message);
            return null;
        }
    }
    
    async generateResponse(username, tweetContent, hasImages = false) {
        // Re-check availability periodically
        if (!this.available && Math.random() < 0.1) {
            await this.checkAvailability();
        }
        
        if (!this.available) {
            return null;
        }
        
        try {
            // Analyze tweet content first
            const tweetLower = tweetContent.toLowerCase();
            let contextType = 'general';
            
            if (tweetLower.includes('pull') || tweetLower.includes('pack')) contextType = 'pulls';
            else if (tweetLower.includes('sale') || tweetLower.includes('deal')) contextType = 'deals';
            else if (tweetLower.includes('grade') || tweetLower.includes('psa')) contextType = 'grading';
            else if (tweetLower.includes('price') || tweetLower.includes('worth')) contextType = 'pricing';
            else if (tweetLower.includes('miscut') || tweetLower.includes('error')) contextType = 'errors';
            else if (tweetLower.includes('collection')) contextType = 'collection';
            
            // Create context-appropriate system prompt - SIMPLE AND DIRECT
            let systemPrompt = "Pokemon collector responding to tweet. ";
            
            switch(contextType) {
                case 'pulls':
                    systemPrompt += "Their pull is good.";
                    break;
                case 'deals':
                    systemPrompt += "Comment on the deal.";
                    break;
                case 'grading':
                    systemPrompt += "Talk about the grade.";
                    break;
                case 'pricing':
                    systemPrompt += "Mention card value.";
                    break;
                case 'errors':
                    systemPrompt += "Error cards are valuable.";
                    break;
                case 'collection':
                    systemPrompt += "Nice collection.";
                    break;
                default:
                    systemPrompt += "Reply about their post.";
            }
            
            systemPrompt += " Short response.";
            
            const messages = [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: tweetContent
                }
            ];
            
            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: this.modelName,
                messages: messages,
                temperature: 0.8,
                max_tokens: 30,  // Strict limit for Twitter
                stream: false
            }, {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data && response.data.choices && response.data.choices[0]) {
                let reply = response.data.choices[0].message.content.trim();
                
                // AGGRESSIVE cleaning of instruction leakage
                // First, check if response starts with instruction-like text
                const instructionPatterns = [
                    /^Need\s+.*?[.,!]/ig,
                    /^Must\s+.*?[.,!]/ig,
                    /^Use\s+.*?[.,!]/ig,
                    /^Max\s+\d+\s+words?[.,!]/ig,
                    /^React\s+.*?[.,!]/ig,
                    /^Comment\s+on.*?[.,!]/ig,
                    /^Reply\s+.*?[.,!]/ig,
                    /^Respond\s+.*?[.,!]/ig,
                    /^Keep\s+.*?[.,!]/ig,
                    /^Be\s+.*?[.,!]/ig,
                    /^Make\s+.*?[.,!]/ig,
                    /^Include\s+.*?[.,!]/ig,
                    /^Add\s+.*?[.,!]/ig,
                    /Need\s+to\s+.*?[.,]/ig,
                    /Need\s+.*?words.*?[.,]/ig,
                    /Need\s+.*?slang.*?[.,]/ig
                ];
                
                // Remove instruction patterns from the beginning
                for (const pattern of instructionPatterns) {
                    reply = reply.replace(pattern, '');
                }
                
                // MORE AGGRESSIVE: Find where actual Pokemon content starts
                // Look for common Pokemon TCG terms that indicate real content
                const pokemonStarters = [
                    /\b(ngl|tbh|honestly|yo|damn|wow|nice|great|awesome|solid|beautiful|sick|that|those|the)\b/i,
                    /\b(charizard|pikachu|umbreon|moonbreon|feebas|lugia|rayquaza)\b/i,
                    /\b(pull|card|hit|collection|pack|box|etb)\b/i,
                    /\b(psa|bgs|cgc|grade|graded)\b/i,
                    /\b(evolving skies|crown zenith|surging sparks|obsidian flames)\b/i
                ];
                
                // Try to find where real content starts
                let realContentStart = -1;
                for (const starter of pokemonStarters) {
                    const match = reply.match(starter);
                    if (match && match.index !== undefined) {
                        if (realContentStart === -1 || match.index < realContentStart) {
                            realContentStart = match.index;
                        }
                    }
                }
                
                // If we found a content start point, extract from there
                if (realContentStart > 0) {
                    reply = reply.substring(realContentStart).trim();
                }
                
                // Now clean up sentences
                const sentences = reply.split(/[.!?]+/);
                let cleanSentences = [];
                let foundRealContent = false;
                
                for (const sentence of sentences) {
                    const lower = sentence.toLowerCase().trim();
                    // Skip instruction-like sentences
                    if (lower.includes('need') && (lower.includes('casual') || lower.includes('slang') || lower.includes('words') || lower.includes('reply'))) continue;
                    if (lower.includes('max') && lower.includes('words')) continue;
                    if (lower.includes('use') && (lower.includes('slang') || lower.includes('fire') || lower.includes('banger'))) continue;
                    if (lower.includes('react') && lower.includes('pic')) continue;
                    if (lower.includes('using slang')) continue;
                    
                    // This looks like actual response content
                    if (sentence.trim().length > 5) {
                        cleanSentences.push(sentence.trim());
                        foundRealContent = true;
                    }
                }
                
                if (foundRealContent) {
                    reply = cleanSentences.join('. ').trim();
                    if (reply && !reply.endsWith('.') && !reply.endsWith('!') && !reply.endsWith('?')) {
                        reply += '.';
                    }
                }
                
                // Remove common instruction patterns
                reply = reply
                    .replace(/^[\"']|[\"']$/g, '')
                    .replace(/^Reply:?\s*/i, '')
                    .replace(/^Response:?\s*/i, '')
                    .replace(/^Your reply:?\s*/i, '')
                    .replace(/Need.*?\./gi, '') // Remove "Need..." instructions
                    .replace(/Max \d+ words?\./gi, '') // Remove word count instructions
                    .replace(/Use.*?terms?\./gi, '') // Remove term instructions
                    .replace(/#\w+/g, '') // Remove hashtags
                    .replace(/🔥|😊|👍|💯|🎉|✨/g, '') // Remove emojis
                    .split('\n')[0] // Take first line only
                    .trim();
                
                // Remove excessive slang by replacing common overused terms
                const slangReplacements = {
                    'sheesh': '',
                    'fire': 'nice',
                    'banger': 'great card',
                    'W pull': 'good pull',
                    'L pull': 'tough luck',
                    'no cap': '',
                    'lowkey': '',
                    'highkey': '',
                    'bussin': 'good',
                    'fr fr': '',
                    'ngl': 'honestly'
                };
                
                for (const [slang, replacement] of Object.entries(slangReplacements)) {
                    const regex = new RegExp(`\\b${slang}\\b`, 'gi');
                    reply = reply.replace(regex, replacement);
                }
                
                // Clean up multiple spaces and punctuation
                reply = reply
                    .replace(/\s+/g, ' ')
                    .replace(/\s+([.,!?])/g, '$1')
                    .replace(/([.,!?])\1+/g, '$1')
                    .trim();
                
                // Ensure appropriate length - much stricter
                if (reply.length > 80) {
                    // Cut at word boundary
                    const words = reply.split(' ');
                    let truncated = '';
                    for (const word of words) {
                        if ((truncated + ' ' + word).length > 75) break;
                        truncated += (truncated ? ' ' : '') + word;
                    }
                    reply = truncated.trim();
                }
                
                // Final cleanup - remove empty parentheses or brackets
                reply = reply.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '');
                
                // FINAL FALLBACK: If reply still contains obvious instruction patterns, try to extract just the Pokemon content
                if (reply && (reply.toLowerCase().includes('ngl') || reply.toLowerCase().includes('lowkey') || 
                    reply.toLowerCase().includes('tbh') || reply.toLowerCase().includes('that') ||
                    reply.toLowerCase().includes('card') || reply.toLowerCase().includes('pull') ||
                    reply.toLowerCase().includes('pack') || reply.toLowerCase().includes('nice'))) {
                    
                    // Try to find the actual Pokemon-related content
                    const pokemonPatterns = [
                        /(that['']?s?\s+a?\s*(?:sick|nice|great|awesome|solid|good|beautiful|amazing|incredible|fire|sweet)\s+(?:pull|card|hit|collection|pickup|find).*)/i,
                        /((?:nice|great|awesome|solid|good|beautiful|amazing|incredible|fire|sweet)\s+(?:pull|card|hit|collection|pickup|find).*)/i,
                        /((?:moonbreon|charizard|pikachu|umbreon|rayquaza|lugia|gengar|mewtwo).*)/i,
                        /((?:psa|bgs|cgc)\s*\d+.*)/i,
                        /((?:evolving skies|crown zenith|lost origin|151|obsidian flames).*)/i
                    ];
                    
                    for (const pattern of pokemonPatterns) {
                        const match = reply.match(pattern);
                        if (match) {
                            reply = match[1].trim();
                            break;
                        }
                    }
                }
                
                // Absolute final check - if it's still too instruction-like, return null
                const badPhrases = ['need casual', 'max 20 words', 'use slang', 'react using', 'need short'];
                const replyLower = reply.toLowerCase();
                for (const phrase of badPhrases) {
                    if (replyLower.includes(phrase)) {
                        return null; // Reject this response entirely
                    }
                }
                
                if (reply && reply.length > 5 && reply.length < 100) {
                    return reply;
                }
            }
            
            return null;
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                this.available = false;
                console.log('⚠️ LM Studio connection lost');
            } else {
                console.log('⚠️ LM Studio error:', error.message);
            }
            return null;
        }
    }
    
    async testConnection() {
        await this.checkAvailability();
        
        if (this.available) {
            console.log('🚀 LM Studio is ready!');
            console.log(`   Model: ${this.modelName}`);
            console.log(`   API: ${this.baseURL}`);
            
            // Test generation
            const test = await this.generateResponse('testuser', 'Check out my Charizard pull!', true);
            if (test) {
                console.log(`   Test response: "${test}"`);
            }
            
            return true;
        } else {
            console.log('\n📝 To use LM Studio:');
            console.log('1. Open LM Studio');
            console.log('2. Download a model (e.g., Mistral 7B, Llama 2 7B)');
            console.log('3. Load the model');
            console.log('4. Go to Settings → Local Server');
            console.log('5. Enable "Start Server"');
            console.log('6. Make sure port is 1234');
            console.log('7. Restart this bot\n');
            
            return false;
        }
    }
}

module.exports = LMStudioAI;