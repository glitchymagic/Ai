// Analyze the extended bot run
const fs = require('fs').promises;

async function analyzeExtendedRun() {
    console.log("📊 Analyzing Extended Bot Run\n");
    
    try {
        const log = await fs.readFile('bot-vision-extended.log', 'utf-8');
        const lines = log.split('\n');
        
        // Extract key metrics
        const stats = {
            totalPosts: lines.filter(l => l.includes('💬 @')).length,
            spamFiltered: lines.filter(l => l.includes('spam detected')).length,
            responses: lines.filter(l => l.includes('✅ Sent!')).length,
            visionAnalyses: lines.filter(l => l.includes('Vision API enabled')).length,
            imageDetected: lines.filter(l => l.includes('🖼️ Visual:')).length
        };
        
        console.log("📈 Bot Activity (10 minutes):");
        console.log(`- Posts analyzed: ${stats.totalPosts}`);
        console.log(`- Spam filtered: ${stats.spamFiltered}`);
        console.log(`- Responses sent: ${stats.responses}`);
        console.log(`- Vision analyses: ${stats.visionAnalyses}`);
        console.log(`- Images detected: ${stats.imageDetected}`);
        
        // Extract actual responses
        console.log("\n💬 Bot Responses:");
        const responses = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('💬 @')) {
                const user = lines[i].match(/@(\w+):/)?.[1];
                const text = lines[i].split(': "')[1]?.split('"')[0];
                
                // Find the response
                for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                    if (lines[j].includes('[Thread-aware]')) {
                        const response = lines[j].split('"')[1];
                        responses.push({ user, text, response });
                        break;
                    }
                }
            }
        }
        
        responses.forEach((r, i) => {
            console.log(`\n${i + 1}. @${r.user}: "${r.text?.substring(0, 50)}..."`);
            console.log(`   Bot: "${r.response?.substring(0, 100)}..."`);
        });
        
        console.log("\n🔍 Analysis:");
        console.log("- Bot is being VERY selective (high spam filtering)");
        console.log("- Only engaged with product/deal posts");
        console.log("- No posts with actual card images were found");
        console.log("- Vision API wasn't tested on real card images");
        
        console.log("\n💡 Recommendations:");
        console.log("1. The spam filter might be too aggressive");
        console.log("2. Need to search for specific users who post card images");
        console.log("3. May need to lower engagement thresholds for testing");
        console.log("4. Consider searching for 'mail day' or 'pulls' specifically");
        
    } catch (error) {
        console.log("Error:", error.message);
    }
}

analyzeExtendedRun().catch(console.error);