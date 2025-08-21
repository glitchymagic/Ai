const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class OllamaAI {
    constructor(model = 'mistral') {
        this.model = model;
        this.available = false;
        this.checkAvailability();
    }
    
    async checkAvailability() {
        try {
            const { stdout } = await execPromise('ollama list');
            this.available = stdout.includes(this.model);
            
            if (!this.available) {
                console.log(`⚠️ Ollama model ${this.model} not found. Installing...`);
                await execPromise(`ollama pull ${this.model}`);
                this.available = true;
            }
        } catch (error) {
            console.log('⚠️ Ollama not available:', error.message);
            this.available = false;
        }
    }
    
    async generateResponse(username, tweetContent, hasImages = false) {
        if (!this.available) {
            return null;
        }
        
        try {
            const prompt = `You are replying to a Pokemon TCG tweet. Be brief (5-20 words), enthusiastic, and specific. No hashtags.

User @${username} posted: "${tweetContent}"
${hasImages ? '[includes images]' : ''}

Reply:`;
            
            // Escape quotes and special chars for shell
            const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
            
            // Run ollama with timeout
            const command = `echo "${escapedPrompt}" | timeout 10 ollama run ${this.model} --verbose=false 2>/dev/null`;
            
            const { stdout, stderr } = await execPromise(command, {
                maxBuffer: 1024 * 1024, // 1MB buffer
                timeout: 15000 // 15 second timeout
            });
            
            if (stderr) {
                console.log('Ollama stderr:', stderr);
            }
            
            let response = stdout.trim()
                .replace(/^[\"']|[\"']$/g, '')
                .replace(/^Reply:?\s*/i, '')
                .replace(/#\w+/g, '')
                .split('\n')[0] // Take first line only
                .trim();
            
            // Ensure response is appropriate length
            if (response.length > 100) {
                response = response.substring(0, 100).trim() + '...';
            }
            
            if (response && response.length > 5) {
                return response;
            }
            
            return null;
            
        } catch (error) {
            console.log('⚠️ Ollama error:', error.message);
            return null;
        }
    }
    
    async testConnection() {
        try {
            const { stdout } = await execPromise('ollama --version');
            console.log('✅ Ollama installed:', stdout.trim());
            
            const { stdout: models } = await execPromise('ollama list');
            console.log('📚 Available models:');
            console.log(models);
            
            return true;
        } catch (error) {
            console.log('❌ Ollama not installed');
            console.log('Install with: brew install ollama');
            return false;
        }
    }
}

module.exports = OllamaAI;