// Quick script to check how vision is performing
const fs = require('fs').promises;

async function checkPerformance() {
    console.log("🔍 Checking Vision API Performance\n");
    
    try {
        // Read the bot log
        const log = await fs.readFile('bot-vision-test.log', 'utf-8');
        const lines = log.split('\n');
        
        // Extract key metrics
        const visionEnabled = lines.filter(l => l.includes('Vision API enabled')).length;
        const visionComplete = lines.filter(l => l.includes('Vision analysis complete')).length;
        const cardsFound = lines.filter(l => l.includes('cards identified')).map(l => {
            const match = l.match(/(\d+) cards identified/);
            return match ? parseInt(match[1]) : 0;
        }).reduce((a, b) => a + b, 0);
        
        const eventPosters = lines.filter(l => l.includes('Identified as EVENT_POSTER')).length;
        const otherContent = lines.filter(l => l.includes('Identified as OTHER')).length;
        const actualCards = lines.filter(l => l.includes('TYPE: CARD')).length;
        
        // Extract responses
        const responses = [];
        lines.forEach((line, i) => {
            if (line.includes('💬 @')) {
                const username = line.match(/@(\w+):/)?.[1];
                const text = line.split(': "')[1]?.split('"')[0];
                
                // Look for the response
                for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
                    if (lines[j].includes('🧵 [Thread-aware]') || lines[j].includes('🤖 Bot says:')) {
                        const response = lines[j].split('"')[1];
                        responses.push({ username, text, response });
                        break;
                    }
                }
            }
        });
        
        console.log("📊 Vision API Statistics:");
        console.log(`- Vision analyses started: ${visionEnabled}`);
        console.log(`- Vision analyses completed: ${visionComplete}`);
        console.log(`- Total cards identified: ${cardsFound}`);
        console.log(`- Event posters detected: ${eventPosters}`);
        console.log(`- Other content (not cards): ${otherContent}`);
        console.log(`- Actual cards detected: ${actualCards}`);
        
        console.log("\n📝 Response Analysis:");
        responses.forEach(r => {
            console.log(`\n@${r.username}: "${r.text?.substring(0, 50)}..."`);
            console.log(`Bot: "${r.response?.substring(0, 80)}..."`);
            
            // Check for issues
            const issues = [];
            if (r.text?.toLowerCase().includes('tournament') && 
                r.response?.toLowerCase().includes('card') && 
                !r.response?.toLowerCase().includes('prize')) {
                issues.push("❌ Mentioned cards for tournament");
            }
            if (r.response?.toLowerCase().includes('unknown') && 
                (r.text?.toLowerCase().includes('tournament') || 
                 r.text?.toLowerCase().includes('event'))) {
                issues.push("❌ Called mascot 'Unknown'");
            }
            
            if (issues.length > 0) {
                issues.forEach(i => console.log(`  ${i}`));
            } else {
                console.log("  ✅ Response appropriate");
            }
        });
        
        console.log("\n📈 Summary:");
        const successRate = visionComplete > 0 ? (visionComplete / visionEnabled * 100).toFixed(0) : 0;
        console.log(`- Vision API success rate: ${successRate}%`);
        console.log(`- Correctly identified non-card content: ${otherContent + eventPosters} times`);
        console.log(`- This prevents false card comments on product images and event posters`);
        
    } catch (error) {
        console.log("❌ Error reading log:", error.message);
    }
}

checkPerformance().catch(console.error);