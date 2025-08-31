// X Platform Detection Test - Realistic Anti-Bot Detection Scenarios
const HumanLikeResponses = require('./features/human-like-responses');
const EngagementSelector = require('./features/engagement-selector');

async function xDetectionTest() {
    console.log('🔍 X PLATFORM ANTI-BOT DETECTION TEST');
    console.log('='.repeat(70));
    console.log('Testing against X\'s known bot detection patterns\n');
    
    const bot = new HumanLikeResponses();
    const engagementSelector = new EngagementSelector();
    
    const results = {
        passed: [],
        warnings: [],
        failed: []
    };
    
    // Test 1: Repetition Detection (X flags repetitive responses)
    console.log('1️⃣ REPETITION DETECTION TEST');
    console.log('-'.repeat(40));
    console.log('X flags accounts that use the same phrases repeatedly.\n');
    
    const repetitionTests = [
        "Just pulled a Charizard!",
        "Check out this Charizard!",
        "Got a Charizard today!",
        "Found this Charizard!",
        "Charizard pull!"
    ];
    
    const responses = [];
    for (let i = 0; i < repetitionTests.length; i++) {
        const response = await bot.generateHumanResponse(repetitionTests[i], {
            username: `RepeatUser${i}`
        });
        responses.push(response);
        console.log(`   ${i+1}. "${response}"`);
    }
    
    const uniqueResponses = [...new Set(responses)];
    const repetitionScore = (uniqueResponses.length / responses.length) * 100;
    console.log(`\n   Unique responses: ${uniqueResponses.length}/${responses.length} (${repetitionScore}%)`);
    
    if (repetitionScore >= 80) {
        results.passed.push('Repetition Detection');
        console.log('   ✅ PASSED - Responses are varied\n');
    } else if (repetitionScore >= 60) {
        results.warnings.push('Repetition Detection');
        console.log('   ⚠️ WARNING - Some repetition detected\n');
    } else {
        results.failed.push('Repetition Detection');
        console.log('   ❌ FAILED - Too much repetition\n');
    }
    
    // Test 2: Timing Pattern Detection
    console.log('2️⃣ TIMING PATTERN DETECTION TEST');
    console.log('-'.repeat(40));
    console.log('X flags accounts with mechanical timing patterns.\n');
    
    const timingTests = [];
    for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await bot.generateHumanResponse(`Test post ${i}`, {
            username: `TimingUser${i}`
        });
        const responseTime = Date.now() - start;
        timingTests.push(responseTime);
    }
    
    // Calculate variance in response times
    const avgTime = timingTests.reduce((a, b) => a + b, 0) / timingTests.length;
    const variance = timingTests.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / timingTests.length;
    const stdDev = Math.sqrt(variance);
    
    console.log(`   Response times: ${timingTests.map(t => t + 'ms').join(', ')}`);
    console.log(`   Average: ${avgTime.toFixed(0)}ms, Std Dev: ${stdDev.toFixed(0)}ms`);
    
    if (stdDev > 5) { // Natural variation
        results.passed.push('Timing Patterns');
        console.log('   ✅ PASSED - Natural timing variation\n');
    } else {
        results.warnings.push('Timing Patterns');
        console.log('   ⚠️ WARNING - Timing too consistent\n');
    }
    
    // Test 3: Engagement Rate Test (X flags accounts that reply to everything)
    console.log('3️⃣ ENGAGEMENT RATE TEST');
    console.log('-'.repeat(40));
    console.log('X flags accounts that engage with too many posts.\n');
    
    const mockTweet = { $$: async () => [], $: async () => null };
    const engagementTests = [
        { text: "Just pulled a card!", username: "user1" },
        { text: "Check this out", username: "user2" },
        { text: "Pokemon cards", username: "user3" },
        { text: "Look at this", username: "user4" },
        { text: "giveaway time!", username: "spammer1" },
        { text: "follow for follow", username: "spammer2" },
        { text: "telegram link", username: "spammer3" },
        { text: "Nice collection", username: "user5" },
        { text: "Rate my pulls", username: "user6" },
        { text: "What do you think?", username: "user7" }
    ];
    
    let engagements = 0;
    let skips = 0;
    
    for (const test of engagementTests) {
        const decision = await engagementSelector.shouldEngageWithPost(mockTweet, test);
        if (decision.action === 'skip') {
            skips++;
            console.log(`   ⏭️ Skipped: "${test.text}" (${decision.reason})`);
        } else {
            engagements++;
            console.log(`   ✅ Engaged: "${test.text}" (${decision.action})`);
        }
    }
    
    const engagementRate = (engagements / engagementTests.length) * 100;
    console.log(`\n   Engagement rate: ${engagementRate}% (${engagements}/${engagementTests.length})`);
    
    if (engagementRate <= 70 && engagementRate >= 20) {
        results.passed.push('Engagement Rate');
        console.log('   ✅ PASSED - Natural engagement rate\n');
    } else {
        results.warnings.push('Engagement Rate');
        console.log('   ⚠️ WARNING - Engagement rate suspicious\n');
    }
    
    // Test 4: Keyword Stuffing Detection
    console.log('4️⃣ KEYWORD STUFFING TEST');
    console.log('-'.repeat(40));
    console.log('X flags responses with too many Pokemon/TCG keywords.\n');
    
    const keywordTests = [
        "Nice cards!",
        "What set is this from?",
        "Cool collection!",
        "Where did you find these?",
        "Awesome pulls!"
    ];
    
    const suspiciousKeywords = [
        'pokemon', 'tcg', 'card', 'pull', 'grade', 'psa', 'charizard', 
        'pikachu', 'rare', 'holo', 'mint', 'nm', 'pack', 'box'
    ];
    
    let keywordScores = [];
    for (const test of keywordTests) {
        const response = await bot.generateHumanResponse(test, {
            username: `KeywordUser${Math.random()}`
        });
        
        const lower = response.toLowerCase();
        let keywordCount = 0;
        suspiciousKeywords.forEach(keyword => {
            if (lower.includes(keyword)) keywordCount++;
        });
        
        const score = keywordCount / response.split(' ').length;
        keywordScores.push(score);
        
        console.log(`   "${test}" → "${response}"`);
        console.log(`     Keywords: ${keywordCount}, Density: ${(score * 100).toFixed(0)}%`);
    }
    
    const avgKeywordDensity = keywordScores.reduce((a, b) => a + b, 0) / keywordScores.length;
    
    if (avgKeywordDensity < 0.3) { // Less than 30% keyword density
        results.passed.push('Keyword Stuffing');
        console.log(`   ✅ PASSED - Natural keyword density (${(avgKeywordDensity * 100).toFixed(0)}%)\n`);
    } else {
        results.warnings.push('Keyword Stuffing');
        console.log(`   ⚠️ WARNING - High keyword density (${(avgKeywordDensity * 100).toFixed(0)}%)\n`);
    }
    
    // Test 5: Response Length Patterns
    console.log('5️⃣ RESPONSE LENGTH TEST');
    console.log('-'.repeat(40));
    console.log('X flags accounts with uniform response lengths.\n');
    
    const lengthTests = [];
    for (let i = 0; i < 10; i++) {
        const response = await bot.generateHumanResponse(`Test message ${i}`, {
            username: `LengthUser${i}`
        });
        lengthTests.push(response.length);
        console.log(`   ${i+1}. Length: ${response.length} chars - "${response}"`);
    }
    
    const minLength = Math.min(...lengthTests);
    const maxLength = Math.max(...lengthTests);
    const lengthVariance = maxLength - minLength;
    
    console.log(`\n   Length range: ${minLength}-${maxLength} chars (variance: ${lengthVariance})`);
    
    if (lengthVariance > 20) {
        results.passed.push('Response Length');
        console.log('   ✅ PASSED - Natural length variation\n');
    } else if (lengthVariance > 10) {
        results.warnings.push('Response Length');
        console.log('   ⚠️ WARNING - Limited length variation\n');
    } else {
        results.failed.push('Response Length');
        console.log('   ❌ FAILED - Responses too uniform\n');
    }
    
    // Test 6: Natural Language Patterns
    console.log('6️⃣ NATURAL LANGUAGE TEST');
    console.log('-'.repeat(40));
    console.log('X\'s AI detection looks for unnatural language patterns.\n');
    
    const naturalTests = [
        "This is amazing!",
        "What do you think?",
        "How much is it worth?",
        "Should I buy this?"
    ];
    
    let naturalScore = 0;
    for (const test of naturalTests) {
        const response = await bot.generateHumanResponse(test, {
            username: `NaturalUser${Math.random()}`
        });
        
        // Check for bot-like patterns
        const botPatterns = [
            response.startsWith('I think'),
            response.startsWith('You should'),
            response.includes('In my opinion'),
            response.includes('It appears'),
            response.includes('approximately'),
            response.length > 100,
            response.split('.').length > 2
        ];
        
        const hasBotPattern = botPatterns.some(p => p);
        
        if (!hasBotPattern) {
            naturalScore++;
            console.log(`   ✅ Natural: "${response}"`);
        } else {
            console.log(`   ⚠️ Bot-like: "${response}"`);
        }
    }
    
    const naturalPercentage = (naturalScore / naturalTests.length) * 100;
    
    if (naturalPercentage >= 75) {
        results.passed.push('Natural Language');
        console.log(`   ✅ PASSED - ${naturalPercentage}% natural responses\n`);
    } else {
        results.warnings.push('Natural Language');
        console.log(`   ⚠️ WARNING - Only ${naturalPercentage}% natural\n`);
    }
    
    // Test 7: Rate Limiting
    console.log('7️⃣ RATE LIMITING TEST');
    console.log('-'.repeat(40));
    console.log('X enforces rate limits on replies.\n');
    
    const stats = engagementSelector.getStats();
    console.log(`   Replies this hour: ${stats.repliesThisHour}`);
    console.log(`   Time since last reply: ${Math.floor(stats.timeSinceLastReply / 1000)}s`);
    
    if (stats.repliesThisHour <= 3) {
        results.passed.push('Rate Limiting');
        console.log('   ✅ PASSED - Within safe rate limits\n');
    } else {
        results.warnings.push('Rate Limiting');
        console.log('   ⚠️ WARNING - Approaching rate limits\n');
    }
    
    // Final Summary
    console.log('='.repeat(70));
    console.log('🎯 X PLATFORM DETECTION TEST RESULTS');
    console.log('='.repeat(70));
    
    console.log('\n✅ PASSED (Safe from detection):');
    if (results.passed.length > 0) {
        results.passed.forEach(test => console.log(`   • ${test}`));
    } else {
        console.log('   None');
    }
    
    console.log('\n⚠️ WARNINGS (Could trigger detection):');
    if (results.warnings.length > 0) {
        results.warnings.forEach(test => console.log(`   • ${test}`));
    } else {
        console.log('   None');
    }
    
    console.log('\n❌ FAILED (Will trigger detection):');
    if (results.failed.length > 0) {
        results.failed.forEach(test => console.log(`   • ${test}`));
    } else {
        console.log('   None');
    }
    
    const totalTests = 7;
    const passedCount = results.passed.length;
    const warningCount = results.warnings.length;
    const failedCount = results.failed.length;
    
    console.log(`\n📊 OVERALL SCORE:`);
    console.log(`   Passed: ${passedCount}/${totalTests}`);
    console.log(`   Warnings: ${warningCount}/${totalTests}`);
    console.log(`   Failed: ${failedCount}/${totalTests}`);
    
    if (failedCount === 0 && warningCount <= 2) {
        console.log('\n🎉 BOT IS SAFE FROM X DETECTION!');
        console.log('The bot passes all critical anti-detection tests.');
    } else if (failedCount === 0) {
        console.log('\n⚠️ BOT IS MOSTLY SAFE');
        console.log('Some behaviors could trigger detection with extended use.');
    } else {
        console.log('\n❌ BOT WOULD BE DETECTED');
        console.log('Critical issues that would trigger X\'s anti-bot systems.');
    }
    
    // Recommendations
    console.log('\n💡 ANTI-DETECTION FEATURES ACTIVE:');
    console.log('   • Response memory prevents repetition');
    console.log('   • 70% like-only strategy reduces reply rate');
    console.log('   • Natural language with typos and slang');
    console.log('   • Variable response lengths (10-50 chars avg)');
    console.log('   • Smart engagement selection filters spam');
    console.log('   • Rate limiting (max 3 replies/hour)');
    console.log('   • No keyword stuffing - casual language');
    console.log('   • Human-like timing variations built-in');
    
    return failedCount === 0;
}

// Run the X detection test
xDetectionTest()
    .then(safe => {
        if (safe) {
            console.log('\n✅ Bot is safe to deploy on X platform');
        } else {
            console.log('\n⚠️ Bot needs adjustments before deployment');
        }
        process.exit(safe ? 0 : 1);
    })
    .catch(console.error);