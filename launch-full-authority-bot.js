// Launch Full Authority Bot
// Runs both engagement bot and scheduled poster together

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class FullAuthorityBot {
    constructor() {
        this.processes = [];
        this.startTime = Date.now();
        this.stats = {
            engagementBot: { status: 'stopped', replies: 0 },
            authorityPoster: { status: 'stopped', posts: 0 }
        };
    }
    
    async checkChrome() {
        console.log('🔍 Checking Chrome setup...');
        
        try {
            const axios = require('axios');
            const response = await axios.get('http://127.0.0.1:9222/json/version', { timeout: 5000 });
            console.log('✅ Chrome is running with remote debugging');
            return true;
        } catch (error) {
            console.log('❌ Chrome not found on port 9222');
            console.log('\n📝 Please start Chrome with:');
            console.log('   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
            console.log('\nThen log into Twitter/X manually first.\n');
            return false;
        }
    }
    
    startProcess(scriptPath, name) {
        console.log(`\n🚀 Starting ${name}...`);
        
        const proc = spawn('node', [scriptPath], {
            stdio: ['inherit', 'pipe', 'pipe']
        });
        
        // Capture output
        proc.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`[${name}] ${output.trim()}`);
            
            // Track stats from output
            if (name === 'Engagement' && output.includes('Sent!')) {
                this.stats.engagementBot.replies++;
            } else if (name === 'Authority' && output.includes('Authority post published!')) {
                this.stats.authorityPoster.posts++;
            }
        });
        
        proc.stderr.on('data', (data) => {
            console.error(`[${name} ERROR] ${data.toString().trim()}`);
        });
        
        proc.on('close', (code) => {
            console.log(`[${name}] Process exited with code ${code}`);
            this.stats[name.toLowerCase() + 'Bot'].status = 'stopped';
            
            // Remove from active processes
            this.processes = this.processes.filter(p => p !== proc);
            
            // Restart if it crashed
            if (code !== 0) {
                console.log(`[${name}] Restarting in 30 seconds...`);
                setTimeout(() => {
                    if (this.processes.length > 0) { // Only restart if we're still running
                        this.startProcess(scriptPath, name);
                    }
                }, 30000);
            }
        });
        
        this.processes.push(proc);
        this.stats[name.toLowerCase() + 'Bot'].status = 'running';
        
        return proc;
    }
    
    async run() {
        console.log('🤖 POKEMON TCG AUTHORITY BOT');
        console.log('============================');
        console.log('Building market authority like aixbt\n');
        
        // Check Chrome first
        if (!await this.checkChrome()) {
            return;
        }
        
        // Start both processes
        this.startProcess('./pokemon-bot-contextual.js', 'Engagement');
        
        // Wait a bit before starting the poster to avoid conflicts
        setTimeout(() => {
            this.startProcess('./scheduled-authority-poster.js', 'Authority');
        }, 5000);
        
        console.log('\n✅ Both bots are now running!');
        console.log('   - Engagement bot: Replying to Pokemon TCG posts');
        console.log('   - Authority poster: Posting market insights on schedule\n');
        
        // Show stats periodically
        setInterval(() => {
            this.showStats();
        }, 5 * 60 * 1000); // Every 5 minutes
        
        // Handle shutdown gracefully
        process.on('SIGINT', () => {
            console.log('\n\n🛑 Shutting down gracefully...');
            this.shutdown();
        });
        
        // Keep the main process alive
        process.stdin.resume();
    }
    
    showStats() {
        const runtime = Math.floor((Date.now() - this.startTime) / 60000);
        console.log('\n📊 === AUTHORITY BOT STATS ===');
        console.log(`   Runtime: ${runtime} minutes`);
        console.log(`   Engagement Bot:`);
        console.log(`     - Status: ${this.stats.engagementBot.status}`);
        console.log(`     - Replies: ${this.stats.engagementBot.replies}`);
        console.log(`   Authority Poster:`);
        console.log(`     - Status: ${this.stats.authorityPoster.status}`);
        console.log(`     - Posts: ${this.stats.authorityPoster.posts}`);
        console.log('=============================\n');
    }
    
    shutdown() {
        console.log('Stopping all processes...');
        
        this.processes.forEach(proc => {
            proc.kill('SIGTERM');
        });
        
        setTimeout(() => {
            this.processes.forEach(proc => {
                proc.kill('SIGKILL');
            });
            process.exit(0);
        }, 5000);
    }
}

// Run the full bot
const bot = new FullAuthorityBot();
bot.run().catch(console.error);