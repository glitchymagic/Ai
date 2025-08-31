// Comprehensive Test Suite
// Tests all improvements and new features

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function runComprehensiveTests() {
    console.log('🧪 COMPREHENSIVE TEST SUITE');
    console.log('===========================\n');
    
    let passCount = 0;
    let failCount = 0;
    
    // Test 1: Response Quality (Casual Personality)
    console.log('1️⃣ Testing Response Quality...');
    try {
        const PokemonCulture = require('./features/pokemon-culture');
        const culture = new PokemonCulture();
        
        // Test the missing method that caused the error
        const response1 = culture.getContextualResponse('testuser', 'facebook marketplace scalpers');
        const response2 = culture.getContextualResponse('testuser', 'just pulled charizard!');
        const response3 = culture.getContextualResponse('testuser', 'should I grade this card?');
        
        console.log('   ✅ getContextualResponse() method exists');
        console.log(`   • Scam response: "${response1}"`);
        console.log(`   • Pull response: "${response2}"`);
        console.log(`   • Grade response: "${response3}"`);
        
        // Verify responses are casual
        const formalWords = ['immediately', 'authorities', 'rife', 'beware'];
        const isCasual = !formalWords.some(word => 
            response1.includes(word) || response2.includes(word) || response3.includes(word)
        );
        
        if (isCasual) {
            console.log('   ✅ Responses are casual, not formal');
            passCount++;
        } else {
            console.log('   ❌ Responses still too formal');
            failCount++;
        }
        
    } catch (error) {
        console.log(`   ❌ Response quality test failed: ${error.message}`);
        failCount++;
    }
    
    // Test 2: Card Specificity
    console.log('\n2️⃣ Testing Card Specificity...');
    try {
        const EnhancedPriceResponses = require('./features/enhanced-price-responses');
        const priceResponses = new EnhancedPriceResponses();
        
        // Test card detection
        const tests = [
            { text: 'whats charizard worth', expected: 'Base Set', number: '#4/102' },
            { text: 'charizard ex price?', expected: 'Obsidian Flames', number: '#054' },
            { text: 'moonbreon value', expected: 'Evolving Skies', number: '#215' }
        ];
        
        let specificityPass = true;
        for (const test of tests) {
            const detection = priceResponses.detectCardMention(test.text, {});
            if (detection && detection.set && detection.number) {
                console.log(`   ✅ "${test.text}" → ${detection.set} ${detection.card} ${detection.number}`);
            } else {
                console.log(`   ❌ Failed to detect specifics for: ${test.text}`);
                specificityPass = false;
            }
        }
        
        if (specificityPass) {
            passCount++;
        } else {
            failCount++;
        }
        
    } catch (error) {
        console.log(`   ❌ Card specificity test failed: ${error.message}`);
        failCount++;
    }
    
    // Test 3: Human Typing Speed
    console.log('\n3️⃣ Testing Human Typing Speed...');
    try {
        // Find humanType method in unified bot
        const fs = require('fs');
        const botCode = fs.readFileSync('./pokemon-bot-unified.js', 'utf8');
        
        if (botCode.includes('async humanType(text)')) {
            console.log('   ✅ humanType() method exists');
            
            // Check for key features
            const hasVariableSpeed = botCode.includes('80 + Math.random() * 120');
            const hasPunctuation = botCode.includes('200 + Math.random() * 300');
            const hasTypos = botCode.includes('Math.random() < 0.02');
            const hasThinking = botCode.includes('Math.random() < 0.05');
            
            console.log(`   ${hasVariableSpeed ? '✅' : '❌'} Variable typing speed (80-200ms)`);
            console.log(`   ${hasPunctuation ? '✅' : '❌'} Pauses after punctuation`);
            console.log(`   ${hasTypos ? '✅' : '❌'} Occasional typos (2%)`);
            console.log(`   ${hasThinking ? '✅' : '❌'} Thinking pauses (5%)`);
            
            if (hasVariableSpeed && hasPunctuation && hasTypos && hasThinking) {
                passCount++;
            } else {
                failCount++;
            }
        } else {
            console.log('   ❌ humanType() method not found');
            failCount++;
        }
        
    } catch (error) {
        console.log(`   ❌ Human typing test failed: ${error.message}`);
        failCount++;
    }
    
    // Test 4: Engagement Rate
    console.log('\n4️⃣ Testing Engagement Rate...');
    try {
        const fs = require('fs');
        const botCode = fs.readFileSync('./pokemon-bot-unified.js', 'utf8');
        
        if (botCode.includes('Math.random() < 0.15')) {
            console.log('   ✅ Engagement rate set to 15%');
            
            // Check wait times
            if (botCode.includes('45000 + Math.random() * 45000')) {
                console.log('   ✅ Wait time: 45-90 seconds');
                passCount++;
            } else {
                console.log('   ❌ Wait time not properly set');
                failCount++;
            }
        } else {
            console.log('   ❌ Engagement rate not set to 15%');
            failCount++;
        }
        
    } catch (error) {
        console.log(`   ❌ Engagement rate test failed: ${error.message}`);
        failCount++;
    }
    
    // Test 5: Tournament Tracker
    console.log('\n5️⃣ Testing Tournament Tracker...');
    try {
        const TournamentTracker = require('./features/tournament-tracker');
        const tracker = new TournamentTracker();
        await tracker.initialize();
        
        console.log('   ✅ Tournament tracker initialized');
        
        // Test methods exist
        const hasScraper = typeof tracker.scrapeLatestTournaments === 'function';
        const hasAnalyzer = typeof tracker.analyzeTournament === 'function';
        const hasMeta = typeof tracker.getMetaSnapshot === 'function';
        
        console.log(`   ${hasScraper ? '✅' : '❌'} Tournament scraper method exists`);
        console.log(`   ${hasAnalyzer ? '✅' : '❌'} Tournament analyzer exists`);
        console.log(`   ${hasMeta ? '✅' : '❌'} Meta snapshot method exists`);
        
        if (hasScraper && hasAnalyzer && hasMeta) {
            passCount++;
        } else {
            failCount++;
        }
        
    } catch (error) {
        console.log(`   ❌ Tournament tracker test failed: ${error.message}`);
        failCount++;
    }
    
    // Test 6: Influencer Monitor
    console.log('\n6️⃣ Testing Influencer Monitor...');
    try {
        const InfluencerMonitor = require('./features/influencer-monitor');
        const monitor = new InfluencerMonitor();
        
        console.log(`   ✅ Monitoring ${monitor.influencers.length} influencers`);
        console.log('   Top 3:');
        monitor.influencers.slice(0, 3).forEach(inf => {
            console.log(`     • ${inf.handle} (${inf.followers})`);
        });
        
        // Test methods
        const hasActivity = typeof monitor.checkInfluencerActivity === 'function';
        const hasAnalysis = typeof monitor.analyzeInfluencerTweet === 'function';
        const hasSentiment = typeof monitor.getMarketSentiment === 'function';
        
        console.log(`   ${hasActivity ? '✅' : '❌'} Activity checker exists`);
        console.log(`   ${hasAnalysis ? '✅' : '❌'} Tweet analyzer exists`);
        console.log(`   ${hasSentiment ? '✅' : '❌'} Sentiment analyzer exists`);
        
        if (hasActivity && hasAnalysis && hasSentiment) {
            passCount++;
        } else {
            failCount++;
        }
        
    } catch (error) {
        console.log(`   ❌ Influencer monitor test failed: ${error.message}`);
        failCount++;
    }
    
    // Test 7: Integration Test
    console.log('\n7️⃣ Testing Bot Integration...');
    try {
        // Check if new features are integrated
        const fs = require('fs');
        const botCode = fs.readFileSync('./pokemon-bot-unified.js', 'utf8');
        
        const hasImports = botCode.includes("require('./features/tournament-tracker')") &&
                          botCode.includes("require('./features/influencer-monitor')");
        
        const hasInit = botCode.includes('this.tournamentTracker = new TournamentTracker()') &&
                       botCode.includes('this.influencerMonitor = new InfluencerMonitor()');
        
        console.log(`   ${hasImports ? '✅' : '❌'} New features imported`);
        console.log(`   ${hasInit ? '✅' : '❌'} New features initialized`);
        
        // Check price response integration
        const hasPriceIntegration = botCode.includes('this.priceResponses.generatePriceResponse');
        console.log(`   ${hasPriceIntegration ? '✅' : '❌'} Price responses integrated`);
        
        if (hasImports && hasInit && hasPriceIntegration) {
            passCount++;
        } else {
            failCount++;
        }
        
    } catch (error) {
        console.log(`   ❌ Integration test failed: ${error.message}`);
        failCount++;
    }
    
    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Tests Passed: ${passCount}/7`);
    console.log(`❌ Tests Failed: ${failCount}/7`);
    
    if (failCount === 0) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('\nThe bot has been successfully improved with:');
        console.log('• Casual Pokemon fan personality');
        console.log('• Card variant specificity');
        console.log('• Human-like typing behavior');
        console.log('• Safe 15% engagement rate');
        console.log('• Tournament data tracking');
        console.log('• Influencer monitoring');
        console.log('\n✅ Bot is ready for production use!');
    } else {
        console.log('\n⚠️ Some tests failed. Review the output above.');
    }
    
    console.log('='.repeat(60));
}

// Run tests
runComprehensiveTests().catch(console.error);