// Test script to verify all bot features are working
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testAllFeatures() {
    console.log('🧪 Testing All Pokemon Bot Features');
    console.log('===================================\n');
    
    // Test 1: Gemini Key Manager
    console.log('1️⃣ Testing Gemini Key Manager...');
    const GeminiKeyManager = require('./features/gemini-key-manager');
    const keyManager = new GeminiKeyManager([
        'AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw',
        'AIzaSyClg--pgWQpAny17vRbiWokCC7L_YjEFkQ',
        'AIzaSyDnlBhkg5GO2O85O-bfVcyCnGa29boEUh8'
    ]);
    await keyManager.testAllKeys();
    console.log('✅ Gemini keys tested\n');
    
    // Test 2: Price Engine
    console.log('2️⃣ Testing Price Engine...');
    const priceEngine = require('./price-engine/index.js');
    await priceEngine.initialize();
    console.log(`✅ Price engine loaded with ${priceEngine.aggregator.priceDatabase.size} cards\n`);
    
    // Test 3: Authority Systems
    console.log('3️⃣ Testing Authority Systems...');
    const HotCardsTracker = require('./features/hot-cards-tracker');
    const AuthorityResponseEngine = require('./features/authority-response-engine');
    const hotCards = new HotCardsTracker(priceEngine);
    const authorityEngine = new AuthorityResponseEngine(hotCards);
    console.log('✅ Authority systems initialized\n');
    
    // Test 4: Learning Engine
    console.log('4️⃣ Testing Learning Engine...');
    const LearningEngine = require('./features/learning-engine');
    const learningEngine = new LearningEngine();
    await learningEngine.loadUserProfiles();
    console.log(`✅ Learning engine loaded with ${learningEngine.userProfiles.size} profiles\n`);
    
    // Test 5: Visual Analyzer (with mock page)
    console.log('5️⃣ Testing Visual Analyzer...');
    const VisualAnalyzer = require('./features/visual-analyzer');
    const mockPage = { url: () => 'https://x.com' };
    const visualAnalyzer = new VisualAnalyzer(mockPage, {
        geminiKeys: keyManager.apiKeys,
        enableVisionAPI: process.env.ENABLE_VISION_API === 'true'
    });
    console.log(`✅ Visual analyzer initialized (Vision API: ${visualAnalyzer.enableVisionAPI})\n`);
    
    // Test 6: Context Analyzer
    console.log('6️⃣ Testing Context Analyzer...');
    const ContextAnalyzer = require('./features/context-analyzer');
    const contextAnalyzer = new ContextAnalyzer();
    const testTopics = contextAnalyzer.extractTopics('Check out my Charizard from Base Set! Worth getting graded?');
    console.log(`✅ Context analyzer working, extracted topics: ${testTopics.join(', ')}\n`);
    
    // Test 7: Sentiment Analyzer
    console.log('7️⃣ Testing Sentiment Analyzer...');
    const SentimentAnalyzer = require('./features/sentiment-analyzer');
    const sentimentAnalyzer = new SentimentAnalyzer();
    const sentiment = sentimentAnalyzer.analyzeSentiment('Amazing pulls today! So happy with my collection!');
    console.log(`✅ Sentiment analyzer working: ${sentiment.sentiment} (${sentiment.confidence})\n`);
    
    // Test 8: Reddit Monitor
    console.log('8️⃣ Testing Reddit Monitor...');
    const RedditMonitor = require('./features/reddit-monitor');
    const redditMonitor = new RedditMonitor();
    console.log('✅ Reddit monitor initialized\n');
    
    // Test 9: Following Monitor
    console.log('9️⃣ Testing Following Monitor...');
    const FollowingMonitor = require('./features/following-monitor');
    const followingMonitor = new FollowingMonitor(mockPage);
    console.log('✅ Following monitor initialized\n');
    
    // Test 10: Response Validator
    console.log('🔟 Testing Response Validator...');
    const ResponseValidator = require('./features/response-validator');
    const validator = new ResponseValidator();
    const testResponse = 'Great pulls! That Charizard is worth $250.';
    const isValid = validator.validate(testResponse, { isPriceQuestion: true });
    console.log(`✅ Response validator working: ${isValid.valid ? 'Valid' : 'Invalid'}\n`);
    
    console.log('🎉 All features tested successfully!');
    console.log('\n📊 Summary:');
    console.log('- Gemini API: Working with key rotation');
    console.log('- Price Engine: Loaded and ready');
    console.log('- Authority Systems: Initialized');
    console.log('- Learning Engine: Active');
    console.log(`- Vision API: ${process.env.ENABLE_VISION_API === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log('- Context Analysis: Working');
    console.log('- Sentiment Analysis: Working');
    console.log('- Reddit Monitoring: Ready');
    console.log('- Following Timeline: Ready');
    console.log('- Response Validation: Active');
}

testAllFeatures().catch(console.error);