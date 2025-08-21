// Pokemon Bot Response Simulator - Test responses without posting to X
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import all features
const Memory = require('./features/memory');
const LMStudioAI = require('./features/lmstudio-ai');
const ContentFilter = require('./features/content-filter');
const PokemonCulture = require('./features/pokemon-culture');
const CardKnowledge = require('./features/card-knowledge');
const ResponseVariety = require('./features/response-variety');
const ContextAnalyzer = require('./features/context-analyzer');
const AdvancedContextExtractor = require('./features/advanced-context');
const NaturalResponseGenerator = require('./features/natural-responses');
const HumanLikeResponses = require('./features/human-like-responses');

const GEMINI_API_KEY = 'AIzaSyD9Hl53GRtWyZyQCgrfPDuYljIHEulIKcw';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7,
    }
});

class ResponseSimulator {
    constructor() {
        // Initialize all modules
        this.memory = new Memory();
        this.lmStudioAI = new LMStudioAI();
        this.contentFilter = new ContentFilter();
        this.pokemonCulture = new PokemonCulture();
        this.cardKnowledge = new CardKnowledge();
        this.responseVariety = new ResponseVariety();
        this.contextAnalyzer = new ContextAnalyzer();
        this.advancedContext = new AdvancedContextExtractor();
        this.naturalResponse = new NaturalResponseGenerator();
        this.humanLike = new HumanLikeResponses();
        
        // Test scenarios
        this.testScenarios = [
            {
                username: "TestUser1",
                tweet: "Just pulled a Charizard ex from Obsidian Flames! Is this worth grading?",
                hasImage: true,
                expectedType: "grading advice"
            },
            {
                username: "TestUser2",
                tweet: "Where can I find Pokemon cards in stock? Target and Walmart are always empty",
                hasImage: false,
                expectedType: "store advice"
            },
            {
                username: "TestUser3",
                tweet: "Check out my Moonbreon! Finally got the chase card 🔥",
                hasImage: true,
                expectedType: "specific card knowledge"
            },
            {
                username: "TestUser4",
                tweet: "Is Evolving Skies worth investing in sealed?",
                hasImage: false,
                expectedType: "investment advice"
            },
            {
                username: "TestUser5",
                tweet: "What's the pull rate for alt arts in Crown Zenith?",
                hasImage: false,
                expectedType: "pull rate info"
            },
            {
                username: "TestUser6",
                tweet: "My Lugia V alt art has 55/45 centering, PSA 10 possible?",
                hasImage: true,
                expectedType: "centering analysis"
            },
            {
                username: "TestUser7",
                tweet: "Found these at Costco for $39! Good deal?",
                hasImage: true,
                expectedType: "deal evaluation"
            },
            {
                username: "TestUser8",
                tweet: "Starting my Pokemon collection, what set should I buy first?",
                hasImage: false,
                expectedType: "beginner advice"
            },
            {
                username: "TestUser9",
                tweet: "Pulled this from a single pack at GameStop!",
                hasImage: true,
                expectedType: "pull reaction"
            },
            {
                username: "TestUser10",
                tweet: "Is this Pikachu real or fake? Bought it online",
                hasImage: true,
                expectedType: "authenticity check"
            },
            {
                username: "TestUser11",
                tweet: "WTS Giratina V Alt Art $200 shipped",
                hasImage: true,
                expectedType: "sale response"
            },
            {
                username: "TestUser12",
                tweet: "Just got back my PSA submission - all 9s and 10s!",
                hasImage: true,
                expectedType: "grading celebration"
            },
            {
                username: "TestUser13",
                tweet: "Which is better for grading, PSA or BGS?",
                hasImage: false,
                expectedType: "grading comparison"
            },
            {
                username: "TestUser14",
                tweet: "Mail day! Added some vintage to the collection",
                hasImage: true,
                expectedType: "mail day reaction"
            },
            {
                username: "TestUser15",
                tweet: "Surging Sparks or Stellar Crown - which has better pulls?",
                hasImage: false,
                expectedType: "set comparison"
            }
        ];
    }

    async initialize() {
        await this.memory.initialize();
        await this.lmStudioAI.checkAvailability();
        console.log('\n🧪 POKEMON BOT RESPONSE SIMULATOR');
        console.log('=' .repeat(50));
        console.log('Testing all response modules...\n');
    }

    async generateResponse(username, tweetContent, hasImage = false) {
        // Simulate the exact response generation logic from the bot
        
        // FIRST: Try human-like response generator for most natural responses
        const humanResp = this.humanLike.generateHumanResponse(tweetContent, {});
        if (humanResp) {
            return { response: humanResp, module: 'Human-Like' };
        }
        
        // Then try natural response generator
        const naturalResp = this.naturalResponse.generateNaturalResponse(tweetContent, {});
        if (naturalResp && Math.random() < 0.3) { // Only 30% chance to use this
            return { response: naturalResp, module: 'Natural Response' };
        }
        
        // Then try advanced context extraction
        const advancedContext = this.advancedContext.extractFullContext(tweetContent, hasImage);
        const specificResponse = this.advancedContext.generateSpecificResponse(advancedContext, tweetContent);
        
        if (specificResponse && this.advancedContext.isValuableResponse(specificResponse)) {
            return { response: specificResponse, module: 'Advanced Context' };
        }
        
        // Try context analyzer
        const contextualResponse = this.contextAnalyzer.generateContextualResponse(tweetContent, hasImage);
        if (contextualResponse && Math.random() < 0.7) {
            return { response: contextualResponse, module: 'Context Analyzer' };
        }
        
        // Try card knowledge
        const helpfulResponse = this.cardKnowledge.generateHelpfulResponse(tweetContent, hasImage);
        if (helpfulResponse && Math.random() < 0.5) {
            return { response: helpfulResponse, module: 'Card Knowledge' };
        }
        
        // Try response variety
        const variedResponse = this.responseVariety.getVariedResponse(tweetContent, hasImage);
        if (variedResponse && Math.random() < 0.3) {
            return { response: variedResponse, module: 'Response Variety' };
        }
        
        // Try LM Studio as fallback
        const lmResponse = await this.lmStudioAI.generateResponse(username, tweetContent, hasImage);
        if (lmResponse) {
            return { response: lmResponse, module: 'LM Studio' };
        }
        
        // Final fallback
        return { response: "Nice cards! The collection is looking good", module: 'Fallback' };
    }

    async runTests() {
        const results = [];
        
        for (const scenario of this.testScenarios) {
            console.log(`\n📝 TEST ${this.testScenarios.indexOf(scenario) + 1}/${this.testScenarios.length}`);
            console.log(`👤 @${scenario.username}`);
            console.log(`💬 "${scenario.tweet}"`);
            console.log(`📷 Has Image: ${scenario.hasImage}`);
            console.log(`🎯 Expected: ${scenario.expectedType}`);
            
            const result = await this.generateResponse(
                scenario.username,
                scenario.tweet,
                scenario.hasImage
            );
            
            console.log(`\n✅ RESPONSE [${result.module}]:`);
            console.log(`   "${result.response}"`);
            
            // Evaluate response quality
            const evaluation = this.evaluateResponse(result.response, scenario);
            console.log(`\n📊 EVALUATION:`);
            console.log(`   Length: ${result.response.length} chars ${result.response.length > 280 ? '❌ TOO LONG' : '✅'}`);
            console.log(`   Specific: ${evaluation.isSpecific ? '✅' : '❌'}`);
            console.log(`   Helpful: ${evaluation.isHelpful ? '✅' : '❌'}`);
            console.log(`   Natural: ${evaluation.isNatural ? '✅' : '❌'}`);
            
            results.push({
                scenario,
                response: result.response,
                module: result.module,
                evaluation
            });
            
            console.log('-'.repeat(50));
            await this.sleep(1000);
        }
        
        // Summary
        this.printSummary(results);
    }

    evaluateResponse(response, scenario) {
        const evaluation = {
            isSpecific: false,
            isHelpful: false,
            isNatural: false
        };
        
        // Check if response is specific (contains prices, numbers, store names, card names)
        evaluation.isSpecific = 
            response.includes('$') ||
            response.includes('PSA') ||
            response.includes('Target') ||
            response.includes('Walmart') ||
            /\d+/.test(response) ||
            response.toLowerCase().includes('charizard') ||
            response.toLowerCase().includes('moonbreon');
        
        // Check if response is helpful (answers the question or provides value)
        evaluation.isHelpful = 
            response.length > 20 &&
            !response.toLowerCase().includes('nice') ||
            response.includes('Check') ||
            response.includes('worth') ||
            response.includes('restock');
        
        // Check if response sounds natural (like a real human)
        evaluation.isNatural = 
            !response.startsWith('I ') && // Doesn't start with "I think/feel"
            !response.includes('should') && // Doesn't give preachy advice
            !response.includes('Check') && // Doesn't start with commands
            !response.includes('. ') && // No multiple formal sentences
            response.length < 100 && // Short and casual
            (response.includes('fr') || response.includes('ngl') || response.includes('tbh') || 
             response.includes('lol') || response.includes('def') || response.includes('prob') ||
             response.includes('gonna') || response.includes('!!') || response.includes('..') ||
             !response.match(/[.!?]$/) || // No punctuation is natural
             response.match(/^[a-z]/) || // Starts lowercase
             response.length < 40); // Very short responses are natural
        
        return evaluation;
    }

    printSummary(results) {
        console.log('\n\n' + '='.repeat(50));
        console.log('📊 SIMULATION SUMMARY');
        console.log('='.repeat(50));
        
        // Count module usage
        const moduleUsage = {};
        results.forEach(r => {
            moduleUsage[r.module] = (moduleUsage[r.module] || 0) + 1;
        });
        
        console.log('\n🔧 Module Usage:');
        Object.entries(moduleUsage).forEach(([module, count]) => {
            console.log(`   ${module}: ${count} times (${Math.round(count/results.length*100)}%)`);
        });
        
        // Count evaluation scores
        let totalSpecific = 0;
        let totalHelpful = 0;
        let totalNatural = 0;
        
        results.forEach(r => {
            if (r.evaluation.isSpecific) totalSpecific++;
            if (r.evaluation.isHelpful) totalHelpful++;
            if (r.evaluation.isNatural) totalNatural++;
        });
        
        console.log('\n✅ Quality Metrics:');
        console.log(`   Specific: ${totalSpecific}/${results.length} (${Math.round(totalSpecific/results.length*100)}%)`);
        console.log(`   Helpful: ${totalHelpful}/${results.length} (${Math.round(totalHelpful/results.length*100)}%)`);
        console.log(`   Natural: ${totalNatural}/${results.length} (${Math.round(totalNatural/results.length*100)}%)`);
        
        // Show problematic responses
        console.log('\n⚠️ Responses Needing Improvement:');
        results.forEach((r, i) => {
            if (!r.evaluation.isSpecific || !r.evaluation.isHelpful) {
                console.log(`   Test ${i+1}: "${r.response.substring(0, 50)}..."`);
            }
        });
        
        console.log('\n' + '='.repeat(50));
        console.log('Simulation complete! Review responses above.');
        console.log('Make adjustments to modules as needed.\n');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the simulator
async function main() {
    const simulator = new ResponseSimulator();
    await simulator.initialize();
    await simulator.runTests();
}

main().catch(console.error);