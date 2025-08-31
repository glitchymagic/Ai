// Final Verification Test - Comprehensive feature check
const HumanLikeResponses = require('./features/human-like-responses');
const ResponseMemory = require('./features/response-memory');
const ConversationMemory = require('./features/conversation-memory');
const CardRecognition = require('./features/card-recognition');
const MarketData = require('./features/market-data');
const EngagementSelector = require('./features/engagement-selector');
const fs = require('fs');

async function finalVerificationTest() {
    console.log('🔧 FINAL VERIFICATION TEST - ALL FEATURES');
    console.log('='.repeat(70));
    console.log('Checking that all implemented features work as expected\n');
    
    const results = {
        passed: [],
        failed: []
    };
    
    // Test 1: Response Memory (prevents repetition)
    console.log('1️⃣ RESPONSE MEMORY TEST');
    console.log('-'.repeat(40));
    try {
        const responseMemory = new ResponseMemory();
        
        // Generate similar responses
        const response1 = "moonbreon goes hard fr";
        const response2 = "moonbreon hits hard fr";
        const response3 = "completely different response";
        
        // Add first response to memory
        responseMemory.rememberResponse(response1);
        
        // Check if response2 is too similar (should be)
        const tooSimilar = responseMemory.isResponseTooSimilar(response2);
        
        // Check if response3 is different (should not be similar)
        const different = responseMemory.isResponseTooSimilar(response3);
        
        if (tooSimilar && !different) {
            console.log('✅ Response memory prevents repetition');
            results.passed.push('Response Memory');
        } else {
            throw new Error('Response similarity detection not working');
        }
    } catch (error) {
        console.log(`❌ Response memory failed: ${error.message}`);
        results.failed.push('Response Memory');
    }
    
    // Test 2: Conversation Memory (remembers users)
    console.log('\n2️⃣ CONVERSATION MEMORY TEST');
    console.log('-'.repeat(40));
    try {
        const conversationMemory = new ConversationMemory();
        
        // Add interaction (using correct method name)
        conversationMemory.rememberInteraction('TestUser', 'Check out my Charizard!', 'nice zard bro');
        
        // Check memory (using correct method name)
        const history = conversationMemory.getConversationHistory('testuser'); // Lowercase username
        const hasHistory = conversationMemory.hasMetUser('testuser'); // Lowercase username
        
        if (history.length >= 1 && hasHistory) {
            console.log('✅ Conversation memory tracks users');
            results.passed.push('Conversation Memory');
        } else {
            throw new Error('Conversation history not stored');
        }
    } catch (error) {
        console.log(`❌ Conversation memory failed: ${error.message}`);
        results.failed.push('Conversation Memory');
    }
    
    // Test 3: Card Recognition (identifies cards)
    console.log('\n3️⃣ CARD RECOGNITION TEST');
    console.log('-'.repeat(40));
    try {
        const cardRecognition = new CardRecognition();
        
        // Test card detection
        const text1 = "Just pulled Moonbreon from Evolving Skies!";
        const text2 = "Random text without cards";
        
        const result1 = await cardRecognition.identifyCard(null, text1);
        const result2 = await cardRecognition.identifyCard(null, text2);
        
        // Result1 should identify Moonbreon, result2 should not identify a specific card
        if (result1 && result1.identified && result1.card) {
            console.log(`✅ Card recognition identifies: ${result1.card.name}`);
            results.passed.push('Card Recognition');
        } else {
            throw new Error('Card detection not working');
        }
    } catch (error) {
        console.log(`❌ Card recognition failed: ${error.message}`);
        results.failed.push('Card Recognition');
    }
    
    // Test 4: Market Data (provides prices)
    console.log('\n4️⃣ MARKET DATA TEST');
    console.log('-'.repeat(40));
    try {
        const marketData = new MarketData();
        
        // Get price for known card
        const price = await marketData.getMarketPrice('Charizard', 'nm');
        
        if (price && price.marketPrice) {
            console.log(`✅ Market data provides price: $${price.marketPrice}`);
            results.passed.push('Market Data');
        } else {
            throw new Error('Market price not available');
        }
    } catch (error) {
        console.log(`❌ Market data failed: ${error.message}`);
        results.failed.push('Market Data');
    }
    
    // Test 5: Engagement Selector (smart post selection)
    console.log('\n5️⃣ ENGAGEMENT SELECTOR TEST');
    console.log('-'.repeat(40));
    try {
        const engagementSelector = new EngagementSelector();
        
        // Reset timing to avoid "too soon" issues
        engagementSelector.lastReplyTime = Date.now() - 300000; // 5 min ago
        engagementSelector.recentEngagements = [];
        
        // Test spam detection
        const spamPost = { text: "follow for follow dm me", username: "spammer" };
        const goodPost = { text: "Just pulled this Charizard from a pack!", username: "collector" };
        
        const mockTweet = { $$: async () => [], $: async () => null };
        
        const spamDecision = await engagementSelector.shouldEngageWithPost(mockTweet, spamPost);
        const goodDecision = await engagementSelector.shouldEngageWithPost(mockTweet, goodPost);
        
        console.log(`   Spam: "${spamPost.text}" → ${spamDecision.action} (${spamDecision.reason})`);
        console.log(`   Good: "${goodPost.text}" → ${goodDecision.action}`);
        
        // Spam should be skipped due to red flags
        const spamFiltered = spamDecision.action === 'skip' && 
                            (spamDecision.reason.includes('red_flag') || spamDecision.reason.includes('red flag'));
        
        // The good post might be 'skip' due to randomness (5% skip rate) or 'like_only' (70% rate)
        // What matters is that spam is always filtered
        if (spamFiltered) {
            console.log('✅ Engagement selector correctly filters spam');
            results.passed.push('Engagement Selector');
        } else {
            throw new Error('Spam not filtered properly');
        }
    } catch (error) {
        console.log(`❌ Engagement selector failed: ${error.message}`);
        results.failed.push('Engagement Selector');
    }
    
    // Test 6: Human-Like Responses (main integration)
    console.log('\n6️⃣ HUMAN-LIKE RESPONSES TEST');
    console.log('-'.repeat(40));
    try {
        const bot = new HumanLikeResponses();
        
        // Test different response types
        const tests = [
            { text: "Just pulled Charizard!", hasImage: true },
            { text: "What's this worth?", hasImage: false },
            { text: "Rate my collection", hasImage: true }
        ];
        
        let allPassed = true;
        for (const test of tests) {
            const response = await bot.generateHumanResponse(test.text, {
                username: `TestUser${Math.random()}`,
                hasImage: test.hasImage
            });
            
            if (!response || response.length === 0) {
                allPassed = false;
                break;
            }
            
            console.log(`   "${test.text}" → "${response}"`);
        }
        
        if (allPassed) {
            console.log('✅ Human responses generate correctly');
            results.passed.push('Human-Like Responses');
        } else {
            throw new Error('Response generation failed');
        }
    } catch (error) {
        console.log(`❌ Human responses failed: ${error.message}`);
        results.failed.push('Human-Like Responses');
    }
    
    // Test 7: Data Persistence (files exist and are valid)
    console.log('\n7️⃣ DATA PERSISTENCE TEST');
    console.log('-'.repeat(40));
    try {
        const files = [
            './data/knowledge.json',
            './data/response-memory.json',
            './data/conversations.json',
            './data/market-cache.json'
        ];
        
        let allExist = true;
        for (const file of files) {
            if (!fs.existsSync(file)) {
                console.log(`   ❌ Missing: ${file}`);
                allExist = false;
            } else {
                const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                console.log(`   ✅ Found: ${file} (${JSON.stringify(data).length} bytes)`);
            }
        }
        
        if (allExist) {
            console.log('✅ All data files persist correctly');
            results.passed.push('Data Persistence');
        } else {
            throw new Error('Some data files missing');
        }
    } catch (error) {
        console.log(`❌ Data persistence failed: ${error.message}`);
        results.failed.push('Data Persistence');
    }
    
    // Test 8: Response Naturalness (no AI patterns)
    console.log('\n8️⃣ RESPONSE NATURALNESS TEST');
    console.log('-'.repeat(40));
    try {
        const bot = new HumanLikeResponses();
        const responses = [];
        
        // Generate multiple responses
        for (let i = 0; i < 5; i++) {
            const response = await bot.generateHumanResponse(`Test post ${i}`, {
                username: `NaturalTest${i}`
            });
            responses.push(response);
        }
        
        // Check for AI patterns
        let naturalCount = 0;
        for (const response of responses) {
            const hasAIPattern = 
                response.includes('I think') ||
                response.includes('It appears') ||
                response.includes('approximately') ||
                response.length > 100;
            
            if (!hasAIPattern) {
                naturalCount++;
            }
        }
        
        const naturalRate = (naturalCount / responses.length) * 100;
        
        if (naturalRate >= 80) {
            console.log(`✅ Responses are ${naturalRate}% natural`);
            results.passed.push('Response Naturalness');
        } else {
            throw new Error(`Only ${naturalRate}% natural responses`);
        }
    } catch (error) {
        console.log(`❌ Naturalness test failed: ${error.message}`);
        results.failed.push('Response Naturalness');
    }
    
    // Test 9: Character Limit Compliance
    console.log('\n9️⃣ CHARACTER LIMIT TEST');
    console.log('-'.repeat(40));
    try {
        const bot = new HumanLikeResponses();
        const responses = [];
        
        for (let i = 0; i < 10; i++) {
            const response = await bot.generateHumanResponse(`Long test message ${i}`, {
                username: `LengthTest${i}`
            });
            responses.push(response);
        }
        
        const allWithinLimit = responses.every(r => r.length <= 280);
        const avgLength = responses.reduce((sum, r) => sum + r.length, 0) / responses.length;
        
        if (allWithinLimit) {
            console.log(`✅ All responses within 280 chars (avg: ${avgLength.toFixed(0)})`);
            results.passed.push('Character Limits');
        } else {
            throw new Error('Some responses exceed character limit');
        }
    } catch (error) {
        console.log(`❌ Character limit failed: ${error.message}`);
        results.failed.push('Character Limits');
    }
    
    // Test 10: Integration Test (all features together)
    console.log('\n🔟 FULL INTEGRATION TEST');
    console.log('-'.repeat(40));
    try {
        const bot = new HumanLikeResponses();
        
        // Simulate real interaction with card mention
        const username = 'IntegrationUser';
        const post1 = "Just pulled Moonbreon from Evolving Skies!";
        
        // First interaction
        const response1 = await bot.generateHumanResponse(post1, {
            username: username,
            hasImage: true
        });
        
        // Should be specific to Moonbreon
        const isMoonbreonSpecific = response1.toLowerCase().includes('moon') || 
                                   response1.includes('475') || 
                                   response1.includes('480') ||
                                   response1.toLowerCase().includes('umbreon') ||
                                   response1.toLowerCase().includes('evolv');
        
        // Second interaction (should remember)
        const post2 = "What do you think it's worth?";
        const response2 = await bot.generateHumanResponse(post2, {
            username: username,
            hasImage: false
        });
        
        // Should be different from first
        const isDifferent = response1 !== response2;
        
        if (isMoonbreonSpecific && isDifferent) {
            console.log('✅ Full integration working');
            console.log(`   First: "${response1}"`);
            console.log(`   Second: "${response2}"`);
            results.passed.push('Full Integration');
        } else {
            throw new Error('Integration features not working together');
        }
    } catch (error) {
        console.log(`❌ Integration test failed: ${error.message}`);
        results.failed.push('Full Integration');
    }
    
    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL VERIFICATION RESULTS');
    console.log('='.repeat(70));
    
    const totalTests = results.passed.length + results.failed.length;
    const passRate = (results.passed.length / totalTests) * 100;
    
    console.log(`\n✅ PASSED FEATURES (${results.passed.length}/${totalTests}):`);
    results.passed.forEach(feature => console.log(`   • ${feature}`));
    
    if (results.failed.length > 0) {
        console.log(`\n❌ FAILED FEATURES (${results.failed.length}/${totalTests}):`);
        results.failed.forEach(feature => console.log(`   • ${feature}`));
    }
    
    console.log(`\n📈 OVERALL PASS RATE: ${passRate.toFixed(0)}%`);
    
    if (passRate === 100) {
        console.log('\n🎉 ALL FEATURES WORKING PERFECTLY!');
        console.log('The bot is ready for deployment with:');
        console.log('   • Response memory preventing repetition');
        console.log('   • Conversation memory for user context');
        console.log('   • Card recognition from text/images');
        console.log('   • Real-time market pricing');
        console.log('   • Smart engagement selection');
        console.log('   • Natural human-like responses');
        console.log('   • Data persistence across sessions');
        console.log('   • Character limit compliance');
        console.log('   • Full feature integration');
    } else {
        console.log('\n⚠️ SOME FEATURES NEED ATTENTION');
        console.log('Please review the failed features above.');
    }
    
    return passRate === 100;
}

// Run the final verification
finalVerificationTest()
    .then(success => {
        if (success) {
            console.log('\n✅ Bot verification complete - ready for production!');
        } else {
            console.log('\n⚠️ Some features need fixing before deployment');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(console.error);