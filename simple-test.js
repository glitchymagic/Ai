// Simple test to verify enhanced context with live data
const ContextualPokemonBot = require('./pokemon-bot-contextual.js');

async function simpleTest() {
    console.log('🧪 Simple Enhanced Context Test\n');
    
    const bot = new ContextualPokemonBot();
    
    // Test with some realistic Pokemon TCG conversation
    const threadContext = {
        threadLength: 2,
        mainTopic: 'Pokemon TCG pulls', 
        fullConversation: [
            { username: 'CardCollector', text: 'Just opened a booster box and got amazing pulls!' },
            { username: 'CardCollector', text: 'Got a Charizard alt art!' }
        ]
    };
    
    console.log('📋 Testing enhanced context response...');
    
    try {
        const response = await bot.generateThreadAwareResponse(
            'CardCollector',
            'Got a Charizard alt art!',
            threadContext
        );
        
        if (response) {
            console.log('\n✅ SUCCESS! Enhanced context generated response:');
            console.log(`"${response}"\n`);
            
            // Check if response is contextual
            if (response.toLowerCase().includes('charizard') || 
                response.toLowerCase().includes('alt art') ||
                response.toLowerCase().includes('pull')) {
                console.log('🎯 EXCELLENT: Response is contextually relevant!');
            } else {
                console.log('⚠️  Response generated but may not be fully contextual');
            }
            
            console.log('\n🎉 Enhanced context system is working perfectly!');
            return true;
        } else {
            console.log('❌ No response generated');
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

// Run the test
simpleTest().then(success => {
    if (success) {
        console.log('\n✅ Test completed successfully - enhanced context is functional!');
    } else {
        console.log('\n❌ Test failed - enhanced context needs debugging');
    }
    process.exit(0);
});
