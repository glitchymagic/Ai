// Vision Performance Monitor - Tracks how well the bot's image recognition is working
const fs = require('fs').promises;
const path = require('path');

class VisionMonitor {
    constructor() {
        this.logFile = path.join(__dirname, 'vision-performance.log');
        this.stats = {
            totalImages: 0,
            successfulAnalysis: 0,
            eventPostersDetected: 0,
            cardsIdentified: 0,
            errors: 0,
            falsePositives: [],
            missedCards: [],
            correctIdentifications: []
        };
    }
    
    async logVisionResult(data) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            username: data.username,
            text: data.text,
            hasImage: data.hasImage,
            visionEnabled: data.visionEnabled,
            analysisResult: data.analysisResult,
            botResponse: data.botResponse,
            performance: this.evaluatePerformance(data)
        };
        
        // Update stats
        if (data.hasImage) {
            this.stats.totalImages++;
            
            if (data.analysisResult?.analyzed) {
                this.stats.successfulAnalysis++;
            }
            
            if (data.analysisResult?.isEventPoster) {
                this.stats.eventPostersDetected++;
            }
            
            if (data.analysisResult?.cards?.length > 0) {
                this.stats.cardsIdentified += data.analysisResult.cards.length;
            }
            
            if (data.analysisResult?.error) {
                this.stats.errors++;
            }
        }
        
        // Write to log file
        const logLine = JSON.stringify(logEntry) + '\n';
        await fs.appendFile(this.logFile, logLine).catch(console.error);
        
        // Console output for real-time monitoring
        this.displayResult(logEntry);
    }
    
    evaluatePerformance(data) {
        const issues = [];
        const successes = [];
        
        // Check for common issues
        if (data.text?.toLowerCase().includes('tournament') || 
            data.text?.toLowerCase().includes('entry fee')) {
            // This is likely an event
            if (data.botResponse?.toLowerCase().includes('card') && 
                !data.botResponse?.toLowerCase().includes('prize')) {
                issues.push('❌ Mentioned cards for event poster');
            } else {
                successes.push('✅ Correctly handled event');
            }
        }
        
        if (data.analysisResult?.isEventPoster && 
            data.botResponse?.toLowerCase().includes('unknown')) {
            issues.push('❌ Identified mascot as Unknown card');
        }
        
        if (data.hasImage && !data.visionEnabled) {
            issues.push('⚠️ Vision API was disabled');
        }
        
        if (data.analysisResult?.cards?.length > 0) {
            const cards = data.analysisResult.cards;
            cards.forEach(card => {
                if (data.botResponse?.toLowerCase().includes(card.name.toLowerCase())) {
                    successes.push(`✅ Mentioned ${card.name}`);
                } else {
                    issues.push(`❌ Didn't mention ${card.name}`);
                }
            });
        }
        
        return {
            issues,
            successes,
            score: successes.length / (successes.length + issues.length) || 0
        };
    }
    
    displayResult(logEntry) {
        console.log('\n' + '='.repeat(70));
        console.log(`📸 Vision Analysis Result - ${logEntry.timestamp}`);
        console.log(`👤 @${logEntry.username}: "${logEntry.text?.substring(0, 60)}..."`);
        
        if (logEntry.analysisResult) {
            console.log(`\n🔍 Analysis:`);
            console.log(`- Vision Enabled: ${logEntry.visionEnabled ? 'YES' : 'NO'}`);
            console.log(`- Analysis Success: ${logEntry.analysisResult.analyzed ? 'YES' : 'NO'}`);
            console.log(`- Event Poster: ${logEntry.analysisResult.isEventPoster ? 'YES' : 'NO'}`);
            console.log(`- Cards Found: ${logEntry.analysisResult.cards?.length || 0}`);
            
            if (logEntry.analysisResult.cards?.length > 0) {
                logEntry.analysisResult.cards.forEach(card => {
                    console.log(`  • ${card.name} (${card.confidence ? Math.round(card.confidence * 100) : '?'}% confidence)`);
                });
            }
        }
        
        console.log(`\n💬 Bot Response: "${logEntry.botResponse?.substring(0, 100)}..."`);
        
        if (logEntry.performance.successes.length > 0) {
            console.log(`\n✅ Successes:`);
            logEntry.performance.successes.forEach(s => console.log(`  ${s}`));
        }
        
        if (logEntry.performance.issues.length > 0) {
            console.log(`\n❌ Issues:`);
            logEntry.performance.issues.forEach(i => console.log(`  ${i}`));
        }
        
        console.log(`\n📊 Performance Score: ${Math.round(logEntry.performance.score * 100)}%`);
    }
    
    async getStats() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 Vision Performance Statistics');
        console.log('='.repeat(70));
        console.log(`Total Images Processed: ${this.stats.totalImages}`);
        console.log(`Successful Analysis: ${this.stats.successfulAnalysis} (${Math.round(this.stats.successfulAnalysis / this.stats.totalImages * 100)}%)`);
        console.log(`Event Posters Detected: ${this.stats.eventPostersDetected}`);
        console.log(`Cards Identified: ${this.stats.cardsIdentified}`);
        console.log(`Errors: ${this.stats.errors}`);
        console.log(`Success Rate: ${Math.round((this.stats.successfulAnalysis - this.stats.errors) / this.stats.totalImages * 100)}%`);
        
        // Load and analyze recent logs
        try {
            const logs = await fs.readFile(this.logFile, 'utf-8');
            const entries = logs.trim().split('\n').map(line => JSON.parse(line));
            
            // Find patterns
            const recentErrors = entries.slice(-10).filter(e => e.performance.issues.length > 0);
            if (recentErrors.length > 0) {
                console.log('\n⚠️ Recent Issues:');
                recentErrors.forEach(e => {
                    console.log(`- @${e.username}: ${e.performance.issues.join(', ')}`);
                });
            }
        } catch (error) {
            // Log file might not exist yet
        }
    }
}

// Export for use in the bot
module.exports = VisionMonitor;

// If run directly, show stats
if (require.main === module) {
    const monitor = new VisionMonitor();
    monitor.getStats().catch(console.error);
}