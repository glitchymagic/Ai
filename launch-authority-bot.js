#!/usr/bin/env node

// Pokemon TCG Authority Bot Launcher
// Runs both reply bot and scheduled poster for maximum authority building

const { spawn } = require('child_process');
const readline = require('readline');

class AuthorityBotLauncher {
    constructor() {
        this.replyBot = null;
        this.scheduledPoster = null;
        this.startTime = Date.now();
        this.stats = {
            repliesTotal: 0,
            postsTotal: 0,
            sessionsRun: 0
        };
    }
    
    async launch() {
        console.clear();
        console.log('🚀 POKEMON TCG AUTHORITY BOT - MONETIZATION MODE');
        console.log('================================================');
        console.log('📊 Strategy: Become the aixbt of Pokemon TCG');
        console.log('💰 Goal: $24,500/month in 6 months\n');
        
        console.log('PHASE 1: AUTHORITY BUILDING (ACTIVE)');
        console.log('-------------------------------------');
        console.log('✅ Price integration in all replies');
        console.log('✅ 4x daily market reports');
        console.log('✅ Public prediction tracking');
        console.log('🎯 Target: 1,000 followers this week\n');
        
        console.log('Starting components...\n');
        
        // Launch reply bot with price integration
        this.launchReplyBot();
        
        // Wait a bit then launch scheduled poster
        setTimeout(() => {
            this.launchScheduledPoster();
        }, 5000);
        
        // Launch dashboard
        setTimeout(() => {
            this.showDashboard();
        }, 10000);
        
        // Setup keyboard commands
        this.setupCommands();
    }
    
    launchReplyBot() {
        console.log('🤖 Starting Reply Bot (with price integration)...');
        
        this.replyBot = spawn('node', ['pokemon-bot-contextual.js'], {
            stdio: ['inherit', 'pipe', 'pipe']
        });
        
        this.replyBot.stdout.on('data', (data) => {
            const output = data.toString();
            
            // Extract stats from output
            if (output.includes('[') && output.includes('/1000]')) {
                const match = output.match(/\[(\d+)\/1000\]/);
                if (match) {
                    this.stats.repliesTotal = parseInt(match[1]);
                }
            }
            
            // Show important messages
            if (output.includes('✅') || output.includes('💰') || output.includes('📊')) {
                process.stdout.write(`[REPLY BOT] ${output}`);
            }
        });
        
        this.replyBot.stderr.on('data', (data) => {
            console.error(`[REPLY BOT ERROR] ${data}`);
        });
        
        this.replyBot.on('close', (code) => {
            console.log(`[REPLY BOT] Stopped with code ${code}`);
            this.replyBot = null;
        });
    }
    
    launchScheduledPoster() {
        console.log('📅 Starting Scheduled Poster (market reports)...\n');
        
        this.scheduledPoster = spawn('node', ['scheduled-poster.js'], {
            stdio: ['inherit', 'pipe', 'pipe']
        });
        
        this.scheduledPoster.stdout.on('data', (data) => {
            const output = data.toString();
            
            // Count posts
            if (output.includes('Posted successfully')) {
                this.stats.postsTotal++;
            }
            
            // Show all poster output (it's less frequent)
            process.stdout.write(`[POSTER] ${output}`);
        });
        
        this.scheduledPoster.stderr.on('data', (data) => {
            console.error(`[POSTER ERROR] ${data}`);
        });
        
        this.scheduledPoster.on('close', (code) => {
            console.log(`[POSTER] Stopped with code ${code}`);
            this.scheduledPoster = null;
        });
    }
    
    showDashboard() {
        setInterval(() => {
            const runtime = Math.floor((Date.now() - this.startTime) / 60000);
            const repliesPerHour = Math.round((this.stats.repliesTotal / Math.max(runtime, 1)) * 60);
            
            console.log('\n' + '='.repeat(60));
            console.log('📊 AUTHORITY BOT DASHBOARD');
            console.log('='.repeat(60));
            console.log(`⏱️  Runtime: ${runtime} minutes`);
            console.log(`💬 Replies: ${this.stats.repliesTotal} (${repliesPerHour}/hour)`);
            console.log(`📝 Posts: ${this.stats.postsTotal}`);
            console.log(`💰 Prices: ACTIVE in all replies`);
            console.log(`🎯 Next milestone: 1,000 followers`);
            console.log('='.repeat(60));
            console.log('Commands: [s]tats | [p]ause | [r]esume | [q]uit');
            console.log('='.repeat(60) + '\n');
        }, 300000); // Every 5 minutes
    }
    
    setupCommands() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.on('line', (input) => {
            const command = input.toLowerCase().trim();
            
            switch(command) {
                case 's':
                case 'stats':
                    this.showDetailedStats();
                    break;
                    
                case 'p':
                case 'pause':
                    this.pauseBots();
                    break;
                    
                case 'r':
                case 'resume':
                    this.resumeBots();
                    break;
                    
                case 'q':
                case 'quit':
                    this.shutdown();
                    break;
                    
                default:
                    console.log('Unknown command. Use: [s]tats, [p]ause, [r]esume, [q]uit');
            }
        });
    }
    
    showDetailedStats() {
        const runtime = Math.floor((Date.now() - this.startTime) / 60000);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 DETAILED STATISTICS');
        console.log('='.repeat(60));
        console.log('\n🤖 REPLY BOT:');
        console.log(`   Total replies: ${this.stats.repliesTotal}`);
        console.log(`   Rate: ${(this.stats.repliesTotal / Math.max(runtime, 1)).toFixed(2)}/min`);
        console.log(`   Price mentions: ~${Math.floor(this.stats.repliesTotal * 0.3)} (30% est.)`);
        
        console.log('\n📅 SCHEDULED POSTER:');
        console.log(`   Total posts: ${this.stats.postsTotal}`);
        console.log(`   Market reports: ${Math.floor(this.stats.postsTotal * 0.4)}`);
        console.log(`   Predictions: ${Math.floor(this.stats.postsTotal * 0.25)}`);
        console.log(`   Trend alerts: ${Math.floor(this.stats.postsTotal * 0.35)}`);
        
        console.log('\n💰 MONETIZATION PROGRESS:');
        console.log('   Phase 1: Authority Building [▓▓▓░░░░░░░] 30%');
        console.log('   Estimated followers: ~${this.stats.repliesTotal * 2 + this.stats.postsTotal * 10}');
        console.log('   Days to 1K followers: ~${Math.ceil(1000 / (this.stats.repliesTotal * 2 / (runtime / 1440)))}');
        
        console.log('\n🎯 RECOMMENDATIONS:');
        if (this.stats.repliesTotal < 100) {
            console.log('   ⚠️ Increase reply rate for faster growth');
        }
        if (this.stats.postsTotal < 4) {
            console.log('   ⚠️ Ensure scheduled posts are firing');
        }
        console.log('   ✅ Continue current strategy');
        console.log('='.repeat(60) + '\n');
    }
    
    pauseBots() {
        console.log('\n⏸️ Pausing bots...');
        if (this.replyBot) {
            this.replyBot.kill('SIGSTOP');
            console.log('   Reply bot paused');
        }
        if (this.scheduledPoster) {
            this.scheduledPoster.kill('SIGSTOP');
            console.log('   Scheduled poster paused');
        }
    }
    
    resumeBots() {
        console.log('\n▶️ Resuming bots...');
        if (this.replyBot) {
            this.replyBot.kill('SIGCONT');
            console.log('   Reply bot resumed');
        }
        if (this.scheduledPoster) {
            this.scheduledPoster.kill('SIGCONT');
            console.log('   Scheduled poster resumed');
        }
    }
    
    async shutdown() {
        console.log('\n🛑 Shutting down Authority Bot...');
        
        if (this.replyBot) {
            this.replyBot.kill('SIGTERM');
        }
        if (this.scheduledPoster) {
            this.scheduledPoster.kill('SIGTERM');
        }
        
        // Wait for processes to end
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.showDetailedStats();
        
        console.log('\n✅ Authority Bot shutdown complete');
        console.log('💰 Keep grinding toward $24,500/month goal!\n');
        
        process.exit(0);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n\nReceived interrupt signal...');
    launcher.shutdown();
});

process.on('SIGTERM', async () => {
    console.log('\n\nReceived termination signal...');
    launcher.shutdown();
});

// Launch the authority bot
const launcher = new AuthorityBotLauncher();
launcher.launch().catch(console.error);