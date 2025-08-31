// Post-Ship Canary Monitoring (24h)
const fs = require('fs').promises;
const path = require('path');

class CanaryMonitor {
    constructor() {
        this.metrics = {
            replyAcceptanceRate: 0,
            gateBlocks: {
                sentiment: 0,
                anti_scam: 0,
                timestamp: 0,
                data_or_silence: 0,
                raffle: 0
            },
            repliesWithNumbers: 0,
            totalReplies: 0,
            avgTimeToReply: [],
            followThroughRate: 0,
            strategyCounts: {
                price: 0,
                visual: 0,
                authority: 0,
                thread_aware: 0,
                human_like: 0,
                fallback: 0
            }
        };
        
        this.startTime = Date.now();
    }
    
    async loadDecisionLogs() {
        try {
            const logsDir = path.join(__dirname, 'logs');
            const files = await fs.readdir(logsDir);
            const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
            
            const allDecisions = [];
            for (const file of jsonlFiles) {
                const content = await fs.readFile(path.join(logsDir, file), 'utf8');
                const lines = content.trim().split('\n');
                for (const line of lines) {
                    if (line) {
                        try {
                            allDecisions.push(JSON.parse(line));
                        } catch (e) {
                            // Skip malformed lines
                        }
                    }
                }
            }
            
            return allDecisions;
        } catch (error) {
            console.log('No logs found yet');
            return [];
        }
    }
    
    analyzeDecisions(decisions) {
        // Filter to last 24h
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const recentDecisions = decisions.filter(d => 
            new Date(d.timestamp).getTime() > oneDayAgo
        );
        
        // Reply acceptance rate
        const successfulReplies = recentDecisions.filter(d => d.response && d.response.length > 0);
        this.metrics.replyAcceptanceRate = successfulReplies.length / Math.max(1, recentDecisions.length);
        
        // Gate blocks (from console logs - would need to parse actual logs)
        // For now, counting skipped decisions by reason
        
        // Replies with numbers
        const repliesWithStats = recentDecisions.filter(d => 
            d.response && (
                d.response.includes('%') || 
                d.response.includes('$') ||
                d.response.includes('last ') ||
                d.response.includes('7d') ||
                d.response.includes('30d')
            )
        );
        this.metrics.repliesWithNumbers = repliesWithStats.length / Math.max(1, successfulReplies.length);
        this.metrics.totalReplies = successfulReplies.length;
        
        // Strategy counts
        recentDecisions.forEach(d => {
            if (d.strategy && d.strategy.strategy) {
                this.metrics.strategyCounts[d.strategy.strategy]++;
            }
        });
        
        // Average time to reply (would need tweet timestamp)
        // For now, using features if available
        
        return this.metrics;
    }
    
    generateReport() {
        const runtime = (Date.now() - this.startTime) / 1000 / 60 / 60; // hours
        
        console.log('🔍 Post-Ship Canary Report (24h)');
        console.log('================================\n');
        
        console.log(`Runtime: ${runtime.toFixed(1)} hours\n`);
        
        console.log('📊 Key Metrics:');
        console.log(`• Reply acceptance rate: ${(this.metrics.replyAcceptanceRate * 100).toFixed(1)}%`);
        console.log(`• Replies with numbers: ${(this.metrics.repliesWithNumbers * 100).toFixed(1)}% (target ≥70%)`);
        console.log(`• Total replies: ${this.metrics.totalReplies}`);
        
        console.log('\n🎯 Strategy Distribution:');
        Object.entries(this.metrics.strategyCounts).forEach(([strategy, count]) => {
            const pct = (count / Math.max(1, this.metrics.totalReplies) * 100).toFixed(1);
            console.log(`• ${strategy}: ${count} (${pct}%)`);
        });
        
        console.log('\n✅ Health Checks:');
        const numericReplies = this.metrics.repliesWithNumbers >= 0.7;
        const goodAcceptance = this.metrics.replyAcceptanceRate >= 0.9;
        const balancedStrategy = this.metrics.strategyCounts.fallback < this.metrics.totalReplies * 0.2;
        
        console.log(`• Numeric replies ≥70%: ${numericReplies ? '✅' : '❌'}`);
        console.log(`• Acceptance rate ≥90%: ${goodAcceptance ? '✅' : '❌'}`);
        console.log(`• Fallback <20%: ${balancedStrategy ? '✅' : '❌'}`);
        
        console.log('\n🎬 Recommendations:');
        if (!numericReplies) {
            console.log('• Increase price engine coverage or entity extraction');
        }
        if (!goodAcceptance) {
            console.log('• Check for errors in response generation');
        }
        if (!balancedStrategy) {
            console.log('• Review strategy picker thresholds');
        }
        
        return this.metrics;
    }
}

// Run monitoring
async function runCanaryMonitor() {
    const monitor = new CanaryMonitor();
    const decisions = await monitor.loadDecisionLogs();
    monitor.analyzeDecisions(decisions);
    monitor.generateReport();
}

if (require.main === module) {
    runCanaryMonitor().catch(console.error);
}

module.exports = CanaryMonitor;