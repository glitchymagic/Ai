// Test Gemini API status and check for 503 errors
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEYS = [
    'AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw',  // Key 1
    'AIzaSyClg--pgWqpAny17vRbiWokCC7L_YjEFkQ',  // Key 2
    'AIzaSyDnlBhkg5GO2O85O-bfVcyCnGa29boEUh8'   // Key 3
];

async function testGeminiKeys() {
    console.log('🔍 Testing Gemini API Keys Status...\n');
    
    for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
        const key = GEMINI_API_KEYS[i];
        console.log(`Testing Key ${i + 1}...`);
        
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            
            // Test 1: Simple text generation
            console.log('  📝 Text generation test...');
            const textResult = await model.generateContent('Hello');
            console.log('  ✅ Text generation: SUCCESS');
            
            // Test 2: Vision API with a simple image
            console.log('  🖼️ Vision API test...');
            const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            
            // Create a tiny test image (1x1 white pixel)
            const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
            
            const visionResult = await visionModel.generateContent([
                'What do you see?',
                {
                    inlineData: {
                        mimeType: 'image/png',
                        data: testImageBase64
                    }
                }
            ]);
            console.log('  ✅ Vision API: SUCCESS');
            
            // Show usage if available
            const usage = visionResult.response.usageMetadata;
            if (usage) {
                console.log(`  📊 Usage: ${usage.promptTokenCount} prompt tokens, ${usage.candidatesTokenCount} response tokens`);
            }
            
        } catch (error) {
            console.log(`  ❌ ERROR: ${error.message}`);
            
            // Analyze the error type
            if (error.message.includes('503')) {
                console.log('  ⚠️ Status: SERVICE OVERLOADED (503)');
                console.log('  💡 The Gemini API is experiencing high load. This is temporary.');
            } else if (error.message.includes('429')) {
                console.log('  ⚠️ Status: QUOTA EXCEEDED (429)');
            } else if (error.message.includes('API_KEY_INVALID')) {
                console.log('  ⚠️ Status: INVALID KEY');
            } else {
                console.log('  ⚠️ Status: OTHER ERROR');
            }
        }
        
        console.log('');
    }
    
    console.log('\n💡 Recommendations:');
    console.log('- 503 errors are temporary and indicate the service is overloaded');
    console.log('- Wait a few minutes and try again');
    console.log('- Consider implementing exponential backoff for retries');
    console.log('- The bot already has fallback to local LLM when vision fails');
}

// Run the test
testGeminiKeys().catch(console.error);