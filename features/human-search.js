// Human-like Search Behavior
class HumanSearch {
    constructor() {
        this.typingSpeed = {
            min: 80,     // Minimum ms between keystrokes
            max: 200,    // Maximum ms between keystrokes
            pause: 500,  // Pause between words
            mistake: 0.02 // 2% chance of typos
        };
    }
    
    // Sleep helper
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Random delay between keystrokes
    randomTypingDelay() {
        return this.typingSpeed.min + Math.random() * (this.typingSpeed.max - this.typingSpeed.min);
    }
    
    // Generate random typing mistakes
    getRandomTypo(char) {
        const keyboard = {
            'a': ['s', 'q', 'w'],
            'b': ['v', 'g', 'h', 'n'],
            'c': ['x', 'd', 'f', 'v'],
            'd': ['s', 'e', 'r', 'f'],
            'e': ['w', 's', 'd', 'r'],
            'f': ['d', 'r', 't', 'g'],
            'g': ['f', 't', 'y', 'h'],
            'h': ['g', 'y', 'u', 'j'],
            'i': ['u', 'j', 'k', 'o'],
            'j': ['h', 'u', 'i', 'k'],
            'k': ['j', 'i', 'o', 'l'],
            'l': ['k', 'o', 'p'],
            'm': ['n', 'j', 'k'],
            'n': ['b', 'h', 'j', 'm'],
            'o': ['i', 'k', 'l', 'p'],
            'p': ['o', 'l'],
            'q': ['w', 'a', 's'],
            'r': ['e', 'd', 'f', 't'],
            's': ['a', 'w', 'e', 'd'],
            't': ['r', 'f', 'g', 'y'],
            'u': ['y', 'h', 'j', 'i'],
            'v': ['c', 'f', 'g', 'b'],
            'w': ['q', 'a', 's', 'e'],
            'x': ['z', 's', 'd', 'c'],
            'y': ['t', 'g', 'h', 'u'],
            'z': ['a', 's', 'x']
        };
        
        const mistakes = keyboard[char.toLowerCase()] || [char];
        return mistakes[Math.floor(Math.random() * mistakes.length)];
    }
    
    // Human-like typing with pauses and occasional mistakes
    async typeHumanLike(page, text, selector = null) {
        console.log(`   ⌨️ Typing: "${text}"`);
        const startTime = Date.now();
        
        // Clear existing text first if there's a selector
        if (selector) {
            try {
                await page.focus(selector);
                await page.keyboard.down('Control');
                await page.keyboard.press('a');
                await page.keyboard.up('Control');
                await this.sleep(50);
            } catch (error) {
                // Silent fail, continue typing
            }
        }
        
        const words = text.split(' ');
        
        for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex];
            
            // Type each character in the word
            for (let charIndex = 0; charIndex < word.length; charIndex++) {
                let char = word[charIndex];
                
                // Occasional typo (then correct it)
                if (Math.random() < this.typingSpeed.mistake) {
                    const wrongChar = this.getRandomTypo(char);
                    await page.keyboard.type(wrongChar);
                    await this.sleep(this.randomTypingDelay());
                    
                    // Realize mistake and backspace
                    await this.sleep(200 + Math.random() * 300);
                    await page.keyboard.press('Backspace');
                    await this.sleep(100);
                }
                
                // Type the correct character
                await page.keyboard.type(char);
                await this.sleep(this.randomTypingDelay());
            }
            
            // Add space between words (except for last word)
            if (wordIndex < words.length - 1) {
                await page.keyboard.press('Space');
                await this.sleep(this.typingSpeed.pause + Math.random() * 200);
            }
        }
        
        const elapsed = Date.now() - startTime;
        console.log(`   ⏱️ Typed in ${(elapsed/1000).toFixed(1)}s (human-like)`);
    }
    
    // Perform human-like search on Twitter
    async performSearch(page, query) {
        try {
            console.log(`   🔍 Starting human-like search for: "${query}"`);
            const searchStartTime = Date.now();
            
            // Go to Twitter home first (more natural)
            await page.goto('https://x.com/home', {
                waitUntil: 'domcontentloaded',
                timeout: 20000
            });
            
            await this.sleep(2000 + Math.random() * 2000);
            
            // Find and click the search box
            const searchBoxSelectors = [
                '[data-testid="SearchBox_Search_Input"]',
                '[placeholder*="Search"]',
                'input[placeholder*="Search"]',
                '[aria-label*="Search"]',
                'input[type="search"]'
            ];
            
            let searchBox = null;
            for (const selector of searchBoxSelectors) {
                try {
                    searchBox = await page.$(selector);
                    if (searchBox) {
                        console.log(`   ✅ Found search box with selector: ${selector}`);
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            if (!searchBox) {
                console.log('   ❌ Could not find search box, trying alternative method');
                // Fallback to direct URL navigation
                await page.goto(`https://x.com/search?q=${encodeURIComponent(query)}&f=live`, {
                    waitUntil: 'domcontentloaded',
                    timeout: 20000
                });
                return true;
            }
            
            // Click the search box (human-like)
            await searchBox.click();
            await this.sleep(300 + Math.random() * 200);
            
            // Type the query human-like
            await this.typeHumanLike(page, query);
            
            // Brief pause before pressing Enter (human behavior)
            await this.sleep(500 + Math.random() * 1000);
            
            // Press Enter to search
            await page.keyboard.press('Enter');
            
            // Wait for search results to load
            await this.sleep(2000 + Math.random() * 1000);
            
            // Try to click on "Latest" tab for most recent posts
            try {
                const latestTabSelectors = [
                    '[data-testid="ScrollSnap-List"] a[href*="f=live"]',
                    'a[href*="f=live"]',
                    'nav a:contains("Latest")',
                    '[role="tab"]:contains("Latest")'
                ];
                
                for (const selector of latestTabSelectors) {
                    try {
                        const latestTab = await page.$(selector);
                        if (latestTab) {
                            console.log('   📈 Clicking Latest tab for recent posts');
                            await latestTab.click();
                            await this.sleep(2000);
                            break;
                        }
                    } catch (error) {
                        continue;
                    }
                }
            } catch (error) {
                console.log(`   ⚠️ Could not find Latest tab: ${error.message}`);
            }
            
            const searchElapsed = Date.now() - searchStartTime;
            console.log(`   ⏱️ Search completed in ${(searchElapsed/1000).toFixed(1)}s (human-like)`);
            
            return true;
            
        } catch (error) {
            console.log(`   ❌ Search failed: ${error.message}`);
            
            // Fallback to direct navigation
            try {
                await page.goto(`https://x.com/search?q=${encodeURIComponent(query)}&f=live`, {
                    waitUntil: 'domcontentloaded',
                    timeout: 20000
                });
                return true;
            } catch (fallbackError) {
                console.log(`   ❌ Fallback also failed: ${fallbackError.message}`);
                return false;
            }
        }
    }
}

module.exports = HumanSearch;