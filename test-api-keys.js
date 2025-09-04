// Test each Gemini API key individually
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEYS = [
    'AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw',
    'AIzaSyClg-pgWQpAny17vRbiWokCC7L_YjEFkQ',  // Fixed: removed double dash
    'AIzaSyDnlBhkg5GO2O85O-bfVcyCnGa29boEUh8'
];

async function testKey(apiKey, keyNumber) {
    console.log(`\n🔑 Testing Key ${keyNumber}...`);
    console.log(`   Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // Try a simple test
        const result = await model.generateContent('Say "API key works"');
        const response = result.response.text();
        
        console.log(`   ✅ Key ${keyNumber} is WORKING!`);
        console.log(`   Response: ${response.substring(0, 50)}...`);
        
        // Try to get usage info
        try {
            // Make multiple calls to test quota
            console.log(`   Testing quota with 3 rapid calls...`);
            for (let i = 1; i <= 3; i++) {
                const testResult = await model.generateContent(`Test ${i}`);
                console.log(`   Call ${i}: ✓`);
            }
            console.log(`   ✅ Key ${keyNumber} has remaining quota!`);
            return { status: 'available', remainingQuota: true };
        } catch (quotaError) {
            if (quotaError.message.includes('429')) {
                console.log(`   ⚠️ Key ${keyNumber} quota might be limited`);
                return { status: 'limited', error: quotaError.message };
            }
            throw quotaError;
        }
        
    } catch (error) {
        if (error.message.includes('429')) {
            console.log(`   ❌ Key ${keyNumber} QUOTA EXCEEDED`);
            console.log(`   Error: ${error.message.substring(0, 100)}...`);
            return { status: 'quota_exceeded', error: error.message };
        } else if (error.message.includes('API_KEY_INVALID')) {
            console.log(`   ❌ Key ${keyNumber} is INVALID`);
            return { status: 'invalid', error: error.message };
        } else if (error.message.includes('503')) {
            console.log(`   ⚠️ Key ${keyNumber} - Service temporarily unavailable (503)`);
            return { status: 'service_unavailable', error: error.message };
        } else {
            console.log(`   ❌ Key ${keyNumber} - Unknown error`);
            console.log(`   Error: ${error.message}`);
            return { status: 'error', error: error.message };
        }
    }
}

async function testAllKeys() {
    console.log('🔍 Testing all Gemini API keys individually...\n');
    console.log('Free tier limit: 50 requests per day per key');
    console.log('Total capacity: 150 requests/day with 3 keys\n');
    
    const results = {};
    let availableCount = 0;
    let totalUsage = 0;
    
    for (let i = 0; i < API_KEYS.length; i++) {
        const result = await testKey(API_KEYS[i], i + 1);
        results[`Key ${i + 1}`] = result;
        
        if (result.status === 'available' || result.status === 'limited') {
            availableCount++;
        }
        
        // Add small delay between tests
        if (i < API_KEYS.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`Total Keys: ${API_KEYS.length}`);
    console.log(`Available Keys: ${availableCount}`);
    console.log(`Exhausted Keys: ${API_KEYS.length - availableCount}`);
    
    console.log('\n📈 Key Status Details:');
    Object.entries(results).forEach(([key, result]) => {
        console.log(`${key}: ${result.status}`);
    });
    
    if (availableCount === 0) {
        console.log('\n⚠️ All API keys are exhausted!');
        console.log('The free tier resets daily. You may need to:');
        console.log('1. Wait until tomorrow for quota reset');
        console.log('2. Get new API keys');
        console.log('3. Upgrade to paid tier for higher limits');
    } else {
        console.log(`\n✅ ${availableCount} key(s) still have quota available`);
    }
}

testAllKeys().catch(console.error);