const { GoogleGenerativeAI } = require('@google/generative-ai');

class MentionMonitor {
    constructor(page, geminiKey, botUsername = 'GlitchyGradeAi') {
        this.page = page;
        this.botUsername = botUsername;
        this.lastCheckTime = Date.now();
        this.processedMentions = new Set();
        this.expertiseAreas = {
            price: this.handlePriceCheck.bind(this),
            fake: this.handleAuthenticity.bind(this),
            invest: this.handleInvestment.bind(this),
            grade: this.handleGrading.bind(this),
            pulls: this.handlePullRates.bind(this),
            trade: this.handleTradeAdvice.bind(this),
            general: this.handleGeneralQuestion.bind(this)
        };
        
        // Initialize Gemini for smart responses
        const genAI = new GoogleGenerativeAI(geminiKey);
        this.model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                maxOutputTokens: 100,
                temperature: 0.7,
            }
        });
    }

    async checkForMentions() {
        try {
            console.log('\n🔍 Checking for mentions...');
            
            // Search for mentions of our bot
            const searchUrl = `https://x.com/search?q=%40${this.botUsername}&f=live`;
            await this.page.goto(searchUrl, { 
                waitUntil: 'networkidle2',
                timeout: 15000 
            }).catch(() => {
                console.log('⚠️  Navigation timeout, will retry next cycle');
                return false;
            });
            
            await this.sleep(3000);
            
            // Find tweets mentioning us
            const mentions = await this.page.$$('article[data-testid="tweet"]');
            console.log(`📨 Found ${mentions.length} potential mentions`);
            
            let newMentions = 0;
            
            for (const mention of mentions) {
                const processed = await this.processMention(mention);
                if (processed) newMentions++;
                
                // Don't process too many at once
                if (newMentions >= 3) {
                    console.log('📝 Processed 3 mentions, will check again later');
                    break;
                }
            }
            
            return newMentions;
            
        } catch (error) {
            console.log(`⚠️  Mention check error: ${error.message}`);
            return 0;
        }
    }

    async processMention(tweetElement) {
        try {
            // Extract tweet data
            const tweetData = await tweetElement.evaluate(el => {
                // Get tweet ID
                const linkElement = el.querySelector('a[href*="/status/"]');
                const tweetId = linkElement ? linkElement.href.split('/status/')[1] : null;
                
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
                
                // Check if has images
                const hasImages = el.querySelector('img[alt*="Image"]') !== null;
                
                return { tweetId, username, tweetText, hasImages };
            });
            
            // Skip if already processed
            if (!tweetData.tweetId || this.processedMentions.has(tweetData.tweetId)) {
                return false;
            }
            
            // Skip our own tweets
            if (tweetData.username === this.botUsername) {
                return false;
            }
            
            // Check if this actually mentions us
            if (!tweetData.tweetText.toLowerCase().includes('@' + this.botUsername.toLowerCase())) {
                return false;
            }
            
            console.log(`\n🎯 MENTION from @${tweetData.username}:`);
            console.log(`   "${tweetData.tweetText}"`);
            
            // Determine question type and respond
            const response = await this.generateExpertResponse(
                tweetData.username, 
                tweetData.tweetText, 
                tweetData.hasImages
            );
            
            if (response) {
                const success = await this.replyToMention(tweetElement, response);
                if (success) {
                    this.processedMentions.add(tweetData.tweetId);
                    console.log(`   ✅ Responded with expertise!`);
                    return true;
                }
            }
            
            return false;
            
        } catch (error) {
            console.log(`   ❌ Error processing mention: ${error.message}`);
            return false;
        }
    }

    async generateExpertResponse(username, question, hasImages) {
        const questionLower = question.toLowerCase();
        
        // Detect question type
        let responseType = 'general';
        if (questionLower.includes('price') || questionLower.includes('worth') || questionLower.includes('value')) {
            responseType = 'price';
        } else if (questionLower.includes('fake') || questionLower.includes('real') || questionLower.includes('authentic')) {
            responseType = 'fake';
        } else if (questionLower.includes('invest') || questionLower.includes('hold') || questionLower.includes('buy')) {
            responseType = 'invest';
        } else if (questionLower.includes('grade') || questionLower.includes('psa') || questionLower.includes('cgc')) {
            responseType = 'grade';
        } else if (questionLower.includes('pull') || questionLower.includes('rate') || questionLower.includes('odds')) {
            responseType = 'pulls';
        } else if (questionLower.includes('trade') || questionLower.includes('worth it')) {
            responseType = 'trade';
        }
        
        console.log(`   📊 Question type: ${responseType}`);
        
        // Get specialized response
        return await this.expertiseAreas[responseType](username, question, hasImages);
    }

    async handlePriceCheck(username, question, hasImages) {
        // Extract card name if possible
        const cardMatch = question.match(/price.*?([\w\s]+?)(\?|$)/i);
        const cardName = cardMatch ? cardMatch[1].trim() : 'that card';
        
        const responses = [
            `Check TCGPlayer for current ${cardName} prices - they update hourly. Also compare with recent eBay sold listings for real market value.`,
            `For ${cardName}, TCGPlayer mid is usually accurate. Check both raw and graded prices if it's mint condition!`,
            `Price depends on condition heavily. Near mint ${cardName} typically goes for market price, but PSA 10 can be 3-5x more.`,
            `Current market on ${cardName} is volatile. Check TCGPlayer, eBay sold, and PWCC for the full picture.`
        ];
        
        if (hasImages) {
            responses.push(`Based on the image, check TCGPlayer for that specific set/variant. Condition looks important here - might be worth grading!`);
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async handleAuthenticity(username, question, hasImages) {
        const responses = [
            `Key things to check: texture pattern, font weight, border consistency, and holo pattern. Compare with verified images from TCGPlayer.`,
            `Look for: proper texture on textured cards, correct font (not too bold), consistent borders, and the back should match exactly.`,
            `Red flags: off-center text, wrong texture, fuzzy printing, incorrect energy symbols. Real cards have crisp, clear printing.`,
            `Check the card thickness and flexibility. Fakes often feel different. Also, the holo pattern should be consistent with the set.`
        ];
        
        if (hasImages) {
            responses.push(
                `From what I can see, check the texture closely - real cards have distinct patterns. Compare the fonts with verified listings.`,
                `The holo pattern is key here. Real Pokemon holos have specific patterns per era. Does it match verified examples?`
            );
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async handleInvestment(username, question, hasImages) {
        const responses = [
            `Sealed Evolving Skies is the safest bet right now. Crown Zenith and 151 also solid. Singles: Moonbreon, Giratina alt arts.`,
            `For long-term: sealed product > graded 10s > raw singles. Evolving Skies, Brilliant Stars, and 151 are top picks.`,
            `Budget under $500? Sealed ETBs from Evolving Skies or Crown Zenith. Over $500? Booster boxes or UPCs.`,
            `Japanese is outperforming English lately. Vstar Universe, Paradigm Trigger, and Clay Burst are investment grade.`,
            `Vintage is always safe but expensive. Modern: Evolving Skies is the "Base Set" of this era. Can't go wrong there.`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async handleGrading(username, question, hasImages) {
        const responses = [
            `If centering is 60/40 or better and no visible whitening, it's worth grading. PSA for value, BGS for personal collection.`,
            `Grade if: centering is good, corners are sharp, no surface scratches. Current PSA turnaround is ~30 days for express.`,
            `Only grade if you think it's a 9+. PSA 8s rarely worth the grading cost unless it's vintage or high-value.`,
            `Check centering first (55/45 minimum), then corners under magnification. Surface scratches kill grades instantly.`,
            `For modern: only grade if PSA 10 potential. For vintage: PSA 8+ is worth it. Use PSA for resale, CGC for personal.`
        ];
        
        if (hasImages) {
            responses.push(
                `From the image, check the centering carefully. If it's 55/45 or better and corners look sharp, could be PSA 10 potential!`,
                `Centering looks decent from here. Check for any surface scratches under good light - that's what kills most 10s.`
            );
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async handlePullRates(username, question, hasImages) {
        const responses = [
            `Pull rates vary by set. Generally: Ultra Rare 1:10 packs, Secret Rare 1:50, Alt Art 1:100+. Evolving Skies alt arts are brutal.`,
            `Standard rates: V/GX 1:3-4, VMAX 1:8-10, Alt Arts 1:100+. Japanese has better rates than English typically.`,
            `For 151: Regular ex 1:6, Special Art Rare 1:30, Gold cards 1:100. The Charizard Special is about 1:1000 packs.`,
            `Booster box usually guarantees 1-2 secret rares. But alt arts aren't guaranteed - that's why they're valuable!`,
            `Best odds: Japanese boxes have guaranteed SRs. English is more gambling. Elite Trainer Boxes have worse rates than booster boxes.`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async handleTradeAdvice(username, question, hasImages) {
        const responses = [
            `Use TCGPlayer market price as baseline. Fair trade = both sides within 10% value. Check conditions carefully!`,
            `Never trade vintage for modern unless there's significant premium. Sealed product holds value better than singles.`,
            `Trade value: graded > raw, older > newer, chase cards > regular. Always check recent sold prices, not asking prices.`,
            `Fair trades are within 10-15% TCGPlayer value. Factor in condition heavily - a NM is worth 2-3x a MP card.`,
            `Pro tip: trade singles for sealed when possible. Sealed appreciates more consistently than singles over time.`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async handleGeneralQuestion(username, question, hasImages) {
        try {
            // Use AI for general Pokemon questions
            const prompt = `You are a Pokemon TCG expert replying to @${username}'s question: "${question}"
            
Reply as an expert in 20-30 words. Be specific and helpful. Share real knowledge about Pokemon cards, sets, or collecting.
No hashtags or emojis. Sound authoritative but friendly.

Reply:`;

            const result = await this.model.generateContent(prompt);
            let response = result.response.text().trim()
                .replace(/^["']|["']$/g, '')
                .replace(/^Reply:?\s*/i, '')
                .trim();
            
            return response;
            
        } catch (error) {
            // Fallback responses
            const responses = [
                `Great question! The Pokemon TCG market is always evolving. What specifically are you looking to know about?`,
                `Happy to help! For detailed Pokemon TCG info, check TCGPlayer's guides. What aspect interests you most?`,
                `The Pokemon TCG community is amazing! Feel free to ask about specific cards, sets, or collecting strategies.`
            ];
            
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }

    async replyToMention(tweetElement, response) {
        try {
            // Click reply button
            const replyButton = await tweetElement.$('button[data-testid="reply"]');
            if (!replyButton) {
                console.log('   ⚠️ No reply button found');
                return false;
            }
            
            await replyButton.click();
            console.log('   💭 Opening reply box...');
            await this.sleep(3000);
            
            // Wait for reply box
            const replyBox = await this.page.waitForSelector(
                'div[data-testid="tweetTextarea_0"]',
                { timeout: 10000 }
            ).catch(() => null);
            
            if (!replyBox) {
                console.log('   ❌ Reply box did not open');
                await this.page.keyboard.press('Escape');
                return false;
            }
            
            // Type response
            console.log('   ⌨️ Typing expert response...');
            await replyBox.click();
            await this.sleep(500);
            
            for (const char of response) {
                await this.page.keyboard.type(char);
                await this.sleep(50 + Math.random() * 50);
            }
            
            await this.sleep(2000);
            
            // Send reply
            console.log('   📤 Sending...');
            const sent = await this.page.evaluate(() => {
                const btn = document.querySelector('button[data-testid="tweetButton"]');
                if (btn && !btn.disabled) {
                    btn.click();
                    return true;
                }
                return false;
            });
            
            if (!sent) {
                await this.page.keyboard.down('Meta');
                await this.page.keyboard.press('Enter');
                await this.page.keyboard.up('Meta');
            }
            
            await this.sleep(3000);
            
            return true;
            
        } catch (error) {
            console.log(`   ❌ Reply error: ${error.message}`);
            try {
                await this.page.keyboard.press('Escape');
            } catch {}
            return false;
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = MentionMonitor;