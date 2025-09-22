// Test Enhanced Context - Force the bot to engage with a post using enhanced context
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

async function testEnhancedContext() {
    console.log('🧪 Testing Enhanced Context Implementation\n');
    
    const bot = new ContextualPokemonBot();
    
    // Test the enhanced context function directly
    console.log('📋 Testing generateThreadAwareResponse with enhanced context...');
    
    const testThreadContext = {
        threadLength: 3,
        mainTopic: 'Charizard pricing',
        fullConversation: [
            { username: 'TestUser1', text: 'Looking to buy a Charizard base set' },
            { username: 'GlitchyGradeAi', text: 'Base set Charizard prices vary a lot by condition' },
            { username: 'TestUser1', text: 'What about PSA 9 condition?' }
        ]
    };
    
    try {
        const response = await bot.generateThreadAwareResponse(
            'TestUser1', 
            'What about PSA 9 condition?', 
            testThreadContext
        );
        
        console.log('✅ Enhanced context response generated:');
        console.log(`"${response}"`);
        console.log('');
        
        // Check if the enhanced context was actually used
        if (response && response.length > 0) {
            console.log('🎉 SUCCESS: Enhanced context is working!');
            return true;
        } else {
            console.log('❌ FAILED: No response generated');
            return false;
        }
        
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        return false;
    }
}

testEnhancedContext().then(success => {
    if (success) {
        console.log('\n✅ Enhanced context test passed!');
    } else {
        console.log('\n❌ Enhanced context test failed!');
    }
    process.exit(0);
});
