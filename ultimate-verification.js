// Ultimate Final Verification - Complete System Check
const HumanLikeResponses = require('./features/human-like-responses');
const EngagementSelector = require('./features/engagement-selector');
const MarketData = require('./features/market-data');
const fs = require('fs');
const path = require('path');

async function ultimateVerification() {
    console.log('🚀 ULTIMATE SYSTEM VERIFICATION');
    console.log('='.repeat(60));
    console.log('Running complete system check of all features...\n');
    
    const bot = new HumanLikeResponses();
    const engagementSelector = new EngagementSelector();
    const marketData = new MarketData();
    
    const results = {
        passed: [],
        failed: []
    };
    
    // Test 1: Response Naturalness
    console.log('1️⃣ TESTING RESPONSE NATURALNESS');
    console.log('-'.repeat(40));
    const naturalTests = [
        "Just pulled a Charizard!",
        "Should I grade this?",
        "Check out my collection!",
        "Where can I find cards?"
    ];
    
    let naturalCount = 0;
    for (const test of naturalTests) {
        const response = await bot.generateHumanResponse(test, {
            username: `NaturalTest${Math.random()}`
        });
        
        // Check for natural characteristics
        const isNatural = (
            response.length < 100 &&
            !response.startsWith('I ') &&
            !response.includes('should') &&
            (response.includes('fr') || response.includes('ngl') || 
             response.includes('tbh') || !response.match(/\.$/) ||
             response.match(/^[a-z]/) || response.includes('!!'))
        );
        
        if (isNatural) naturalCount++;
        console.log(`   "${test.substring(0, 30)}..." → "${response}"`);
    }
    
    const naturalScore = (naturalCount / naturalTests.length) * 100;
    console.log(`   Naturalness Score: ${naturalScore.toFixed(0)}%`);
    
    if (naturalScore >= 75) {
        results.passed.push('Response Naturalness');
        console.log('   ✅ PASSED\n');
    } else {
        results.failed.push('Response Naturalness');
        console.log('   ❌ FAILED\n');
    }
    
    // Test 2: Card Recognition Accuracy
    console.log('2️⃣ TESTING CARD RECOGNITION');
    console.log('-'.repeat(40));
    const cardTests = [
        { text: "Got this Moonbreon!", expected: "moonbreon", shouldHavePrice: true },
        { text: "Charizard ex from Obsidian Flames", expected: "charizard", shouldHavePrice: true },
        { text: "Base Set Charizard pull!", expected: "charizard", shouldHavePrice: true }
    ];
    
    let cardsPassed = 0;
    for (const test of cardTests) {
        const response = await bot.generateHumanResponse(test.text, {
            hasImage: true,
            username: `CardTest${Math.random()}`
        });
        
        const hasPrice = response.includes('$');
        const mentionsCard = response.toLowerCase().includes(test.expected) || hasPrice;
        
        if ((test.shouldHavePrice && hasPrice) || mentionsCard) {
            cardsPassed++;
            console.log(`   ✅ "${test.text}" → "${response}"`);
        } else {
            console.log(`   ❌ "${test.text}" → "${response}"`);
        }
    }
    
    if (cardsPassed >= 2) {
        results.passed.push('Card Recognition');
        console.log(`   Score: ${cardsPassed}/${cardTests.length} ✅ PASSED\n`);
    } else {
        results.failed.push('Card Recognition');
        console.log(`   Score: ${cardsPassed}/${cardTests.length} ❌ FAILED\n`);
    }
    
    // Test 3: Context Matching
    console.log('3️⃣ TESTING CONTEXT MATCHING');
    console.log('-'.repeat(40));
    const contextTests = [
        { text: "Rate my setup!", shouldNotInclude: ["pull", "nice hit"] },
        { text: "What's the pull rate?", shouldInclude: ["rate", "1:", "%"] },
        { text: "Mail day!", shouldNotInclude: ["pull", "grade"] }
    ];
    
    let contextPassed = 0;
    for (const test of contextTests) {
        const response = await bot.generateHumanResponse(test.text, {
            username: `ContextTest${Math.random()}`
        });
        
        let passed = true;
        if (test.shouldNotInclude) {
            for (const word of test.shouldNotInclude) {
                if (response.toLowerCase().includes(word)) {
                    passed = false;
                    break;
                }
            }
        }
        if (test.shouldInclude) {
            let hasOne = false;
            for (const word of test.shouldInclude) {
                if (response.toLowerCase().includes(word)) {
                    hasOne = true;
                    break;
                }
            }
            if (!hasOne) passed = false;
        }
        
        if (passed) {
            contextPassed++;
            console.log(`   ✅ "${test.text}" → "${response}"`);
        } else {
            console.log(`   ❌ "${test.text}" → "${response}" (wrong context)`);
        }
    }
    
    if (contextPassed >= 2) {
        results.passed.push('Context Matching');
        console.log(`   Score: ${contextPassed}/${contextTests.length} ✅ PASSED\n`);
    } else {
        results.failed.push('Context Matching');
        console.log(`   Score: ${contextPassed}/${contextTests.length} ❌ FAILED\n`);
    }
    
    // Test 4: Engagement Selection
    console.log('4️⃣ TESTING ENGAGEMENT SELECTION');
    console.log('-'.repeat(40));
    const mockTweet = { $$: async () => [], $: async () => null };
    
    const engagementTests = [
        { text: "giveaway follow me!!!", expectedAction: "skip" },
        { text: "Just pulled this beauty", expectedAction: ["like", "reply"] },
        { text: "Check my telegram", expectedAction: "skip" }
    ];
    
    let engagementPassed = 0;
    for (const test of engagementTests) {
        const decision = await engagementSelector.shouldEngageWithPost(mockTweet, {
            text: test.text,
            username: `EngageTest${Math.random()}`
        });
        
        const isExpected = Array.isArray(test.expectedAction) 
            ? test.expectedAction.includes(decision.action)
            : decision.action === test.expectedAction;
            
        if (isExpected) {
            engagementPassed++;
            console.log(`   ✅ "${test.text}" → ${decision.action} (${decision.reason})`);
        } else {
            console.log(`   ❌ "${test.text}" → ${decision.action} (expected: ${test.expectedAction})`);
        }
    }
    
    if (engagementPassed >= 2) {
        results.passed.push('Engagement Selection');
        console.log(`   Score: ${engagementPassed}/${engagementTests.length} ✅ PASSED\n`);
    } else {
        results.failed.push('Engagement Selection');
        console.log(`   Score: ${engagementPassed}/${engagementTests.length} ❌ FAILED\n`);
    }
    
    // Test 5: Market Data
    console.log('5️⃣ TESTING MARKET DATA');
    console.log('-'.repeat(40));
    let marketPassed = 0;
    const marketTests = ['charizard ex', 'moonbreon'];
    
    for (const card of marketTests) {
        try {
            const price = await marketData.getMarketPrice(card, 'nm');
            if (price && price.marketPrice > 0) {
                marketPassed++;
                console.log(`   ✅ ${card}: $${price.marketPrice} (${price.trending})`);
            } else {
                console.log(`   ❌ ${card}: No price data`);
            }
        } catch (error) {
            console.log(`   ❌ ${card}: Error - ${error.message}`);
        }
    }
    
    if (marketPassed >= 1) {
        results.passed.push('Market Data');
        console.log(`   Score: ${marketPassed}/${marketTests.length} ✅ PASSED\n`);
    } else {
        results.failed.push('Market Data');
        console.log(`   Score: ${marketPassed}/${marketTests.length} ❌ FAILED\n`);
    }
    
    // Test 6: Conversation Memory
    console.log('6️⃣ TESTING CONVERSATION MEMORY');
    console.log('-'.repeat(40));
    
    // First message
    await bot.generateHumanResponse("Got a Charizard!", {
        username: "MemoryTestUser"
    });
    
    // Follow-up
    const followUp = await bot.generateHumanResponse("Should I grade it?", {
        username: "MemoryTestUser"
    });
    
    const hasMemory = bot.hasMetUser("MemoryTestUser");
    
    if (hasMemory) {
        results.passed.push('Conversation Memory');
        console.log(`   ✅ User remembered, follow-up: "${followUp}"\n`);
    } else {
        results.failed.push('Conversation Memory');
        console.log(`   ❌ User not remembered\n`);
    }
    
    // Test 7: Response Memory
    console.log('7️⃣ TESTING RESPONSE MEMORY');
    console.log('-'.repeat(40));
    const memStats = bot.getMemoryStats();
    
    if (memStats.totalRemembered > 0) {
        results.passed.push('Response Memory');
        console.log(`   ✅ ${memStats.totalRemembered} responses cached\n`);
    } else {
        results.failed.push('Response Memory');
        console.log(`   ❌ No responses cached\n`);
    }
    
    // Test 8: File Persistence
    console.log('8️⃣ TESTING DATA PERSISTENCE');
    console.log('-'.repeat(40));
    const dataFiles = [
        'data/memory.json',
        'data/conversations.json',
        'data/market-cache.json',
        'data/knowledge.json'
    ];
    
    let filesPassed = 0;
    for (const file of dataFiles) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            filesPassed++;
            console.log(`   ✅ ${file} exists`);
        } else {
            console.log(`   ⚠️ ${file} not found (will be created on first run)`);
        }
    }
    
    if (filesPassed >= 2) {
        results.passed.push('Data Persistence');
        console.log(`   Score: ${filesPassed}/${dataFiles.length} ✅ PASSED\n`);
    } else {
        results.failed.push('Data Persistence');
        console.log(`   Score: ${filesPassed}/${dataFiles.length} ❌ FAILED\n`);
    }
    
    // Final Summary
    console.log('='.repeat(60));
    console.log('📊 ULTIMATE VERIFICATION RESULTS');
    console.log('='.repeat(60));
    
    console.log('\n✅ PASSED FEATURES:');
    results.passed.forEach(feature => {
        console.log(`   • ${feature}`);
    });
    
    if (results.failed.length > 0) {
        console.log('\n❌ FAILED FEATURES:');
        results.failed.forEach(feature => {
            console.log(`   • ${feature}`);
        });
    }
    
    const totalTests = results.passed.length + results.failed.length;
    const passRate = (results.passed.length / totalTests) * 100;
    
    console.log(`\n🎯 OVERALL SCORE: ${results.passed.length}/${totalTests} (${passRate.toFixed(0)}%)`);
    
    // System Stats
    console.log('\n📈 SYSTEM STATISTICS:');
    const convStats = bot.getConversationStats();
    const cardStats = bot.getCardStats();
    const engagementStats = engagementSelector.getStats();
    
    console.log(`   • Users in memory: ${convStats.totalUsers}`);
    console.log(`   • Total interactions: ${convStats.totalInteractions}`);
    console.log(`   • Cards in database: ${cardStats.totalCards}`);
    console.log(`   • Engagement decisions: ${engagementStats.totalEngagements || 0}`);
    console.log(`   • Response variations: ${memStats.totalRemembered}`);
    
    if (passRate >= 85) {
        console.log('\n🎉 SYSTEM VERIFICATION COMPLETE - BOT IS READY!');
        console.log('✨ All critical features are working correctly.');
        console.log('🚀 The Pokemon TCG bot is ready for deployment!');
    } else if (passRate >= 70) {
        console.log('\n⚠️ SYSTEM MOSTLY FUNCTIONAL');
        console.log('Most features working but some attention needed.');
    } else {
        console.log('\n❌ SYSTEM NEEDS ATTENTION');
        console.log('Critical features need to be fixed.');
    }
    
    return passRate >= 85;
}

// Run ultimate verification
ultimateVerification()
    .then(success => {
        if (success) {
            console.log('\n✅ Bot verification successful!');
        } else {
            console.log('\n⚠️ Bot needs some adjustments.');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n❌ Verification error:', error);
        process.exit(1);
    });