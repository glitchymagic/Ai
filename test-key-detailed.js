// Detailed test for Key 2
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testKeyDetailed() {
    const key2 = 'AIzaSyClg-pgWQpAny17vRbiWokCC7L_YjEFkQ';
    
    console.log('🔍 Testing Key 2 in detail...');
    console.log(`Full key: ${key2}`);
    console.log(`Length: ${key2.length} characters`);
    console.log(`Format check: ${key2.startsWith('AIza') ? '✓ Starts correctly' : '✗ Bad start'}`);
    console.log(`Character check: ${/^[A-Za-z0-9_-]+$/.test(key2) ? '✓ Valid characters' : '✗ Invalid characters'}`);
    
    try {
        const genAI = new GoogleGenerativeAI(key2);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        console.log('\nAttempting API call...');
        const result = await model.generateContent('test');
        console.log('✅ API call successful!');
        
    } catch (error) {
        console.log('\n❌ API call failed');
        console.log('Full error:', error.message);
        
        if (error.message.includes('API_KEY_INVALID')) {
            console.log('\n⚠️ This key is not recognized by Google');
            console.log('Possible issues:');
            console.log('1. The key was never valid');
            console.log('2. The key has been revoked/deleted'); 
            console.log('3. The key has typos');
            console.log('4. The project associated with this key was deleted');
        } else if (error.message.includes('429')) {
            console.log('\n✅ Key is valid but quota exceeded');
        }
    }
}

testKeyDetailed().catch(console.error);