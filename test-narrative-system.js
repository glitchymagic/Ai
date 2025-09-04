// Test script for the narrative detection system
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RedditMonitor = require('./features/reddit-monitor');
const KOLMonitor = require('./features/kol-monitor');
const NarrativeDetector = require('./features/narrative-detector');
const CrossPlatformAnalyzer = require('./features/cross-platform-analyzer');

puppeteer.use(StealthPlugin());

async function testNarrativeSystem() {
    console.log('🧪 Testing Narrative Detection System\n');
    
    let browser;
    
    try {
        // Initialize components
        console.log('1️⃣ Initializing monitoring components...');
        const redditMonitor = new RedditMonitor();
        console.log('✅ Reddit monitor ready');
        
        // Launch browser for KOL monitoring
        console.log('\n2️⃣ Launching browser for KOL monitoring...');
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.goto('https://x.com', { waitUntil: 'networkidle2' });
        
        const kolMonitor = new KOLMonitor(page);
        console.log('✅ KOL monitor ready');
        
        // Initialize narrative detector
        const narrativeDetector = new NarrativeDetector(redditMonitor, kolMonitor);
        console.log('✅ Narrative detector ready');
        
        // Test Reddit monitoring
        console.log('\n3️⃣ Testing Reddit monitoring...');
        console.log('Fetching Pokemon TCG subreddit narratives...');
        const redditNarratives = await redditMonitor.monitorAll();
        
        console.log(`\n📊 Reddit Results:`);
        console.log(`Found ${redditNarratives.length} card narratives`);
        
        if (redditNarratives.length > 0) {
            console.log('\nTop 3 Reddit narratives:');
            redditNarratives.slice(0, 3).forEach((narr, i) => {
                console.log(`${i + 1}. ${narr.card}`);
                console.log(`   Pattern: ${narr.dominantPattern.type}`);
                console.log(`   Strength: ${(narr.totalStrength * 100).toFixed(0)}%`);
                console.log(`   Posts: ${narr.posts.length}`);
            });
        }
        
        // Test KOL monitoring
        console.log('\n4️⃣ Testing KOL monitoring...');
        console.log('Monitoring Pokemon TCG influencers...');
        const kolSignals = await kolMonitor.monitorNextBatch(3);
        
        console.log(`\n🐦 KOL Results:`);
        console.log(`Found ${kolSignals.length} signals`);
        
        if (kolSignals.length > 0) {
            console.log('\nTop KOL signals:');
            kolSignals.slice(0, 3).forEach((signal, i) => {
                console.log(`${i + 1}. ${signal.card}`);
                console.log(`   KOLs: ${signal.kolCount}`);
                console.log(`   Pattern: ${signal.dominantPattern.type}`);
                console.log(`   Strength: ${(signal.totalStrength * 100).toFixed(0)}%`);
            });
        }
        
        // Test narrative detection
        console.log('\n5️⃣ Testing narrative detection...');
        console.log('Correlating cross-platform signals...');
        const narratives = await narrativeDetector.detectNarratives();
        
        console.log(`\n🎯 Narrative Results:`);
        console.log(`Detected ${narratives.length} actionable narratives`);
        
        if (narratives.length > 0) {
            console.log('\nTop narratives:');
            narratives.slice(0, 3).forEach((narr, i) => {
                console.log(`\n${i + 1}. ${narr.card}`);
                console.log(`   Platforms: ${narr.platforms.join(' + ')}`);
                console.log(`   Classification: ${narr.classification.type}`);
                console.log(`   Action: ${narr.classification.action}`);
                console.log(`   Strength: ${(narr.strength * 100).toFixed(0)}%`);
                console.log(`   Summary: ${narr.summary}`);
                
                if (narr.prediction) {
                    console.log(`   Prediction: ${narr.prediction.target} ${narr.prediction.range || ''}`);
                }
            });
        }
        
        // Test cross-platform analyzer
        console.log('\n6️⃣ Testing cross-platform analyzer...');
        const hotCards = null; // We don't need price data for this test
        const authorityEngine = null;
        const analyzer = new CrossPlatformAnalyzer(
            redditMonitor,
            kolMonitor,
            narrativeDetector,
            hotCards,
            authorityEngine
        );
        
        // Run analysis
        const report = await analyzer.runFullAnalysis();
        
        if (report) {
            console.log('\n📋 Intelligence Report Summary:');
            console.log(`Market Sentiment: ${report.summary.marketSentiment.dominant}`);
            console.log(`Top Recommendations:`);
            report.recommendations.slice(0, 2).forEach((rec, i) => {
                console.log(`${i + 1}. ${rec.action} (${rec.priority} priority)`);
                console.log(`   Reason: ${rec.reason}`);
            });
        }
        
        console.log('\n✅ Narrative system test complete!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
testNarrativeSystem().catch(console.error);