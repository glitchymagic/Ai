// Tournament Data Scraper using Chrome
// Uses existing Chrome instance to get real data

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

async function scrapeTournamentData() {
    console.log('🏆 SCRAPING REAL TOURNAMENT DATA');
    console.log('================================\n');
    
    let browser;
    
    try {
        // Connect to existing Chrome
        console.log('🔌 Connecting to Chrome...');
        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        console.log('✅ Connected to Chrome\n');
        
        // Create new page
        const page = await browser.newPage();
        
        // Navigate to Limitless
        console.log('📍 Navigating to Limitless TCG...');
        await page.goto('https://play.limitlesstcg.com/tournaments/completed', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        
        console.log('⏳ Waiting for page to load...');
        await page.waitForTimeout(5000);
        
        // Extract tournament data
        console.log('📊 Extracting tournament results...\n');
        
        const tournaments = await page.evaluate(() => {
            const results = [];
            
            // Look for tournament cards/links
            const tournamentElements = document.querySelectorAll('a[href*="/tournaments/"]');
            
            tournamentElements.forEach(el => {
                // Skip if it's not a tournament link
                if (el.href.includes('?') || el.href.includes('#')) return;
                
                const text = el.textContent || '';
                
                // Look for tournament names
                if (text.includes('Regional') || text.includes('Championship') || 
                    text.includes('Cup') || text.includes('Tournament')) {
                    
                    // Extract date if available
                    const dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) || 
                                     text.match(/\d{4}-\d{2}-\d{2}/);
                    
                    results.push({
                        name: text.trim(),
                        url: el.href,
                        date: dateMatch ? dateMatch[0] : 'Recent'
                    });
                }
            });
            
            // Also check for any tournament listings
            const listings = document.querySelectorAll('.tournament-item, .event-item, [class*="tournament"]');
            listings.forEach(item => {
                const nameEl = item.querySelector('h2, h3, .name, .title');
                const dateEl = item.querySelector('.date, time, [class*="date"]');
                
                if (nameEl) {
                    results.push({
                        name: nameEl.textContent.trim(),
                        date: dateEl ? dateEl.textContent.trim() : 'Recent',
                        fromListing: true
                    });
                }
            });
            
            return results;
        });
        
        console.log(`Found ${tournaments.length} tournaments\n`);
        
        if (tournaments.length === 0) {
            // Try alternative selectors
            console.log('Trying alternative extraction...\n');
            
            const pageContent = await page.evaluate(() => {
                return {
                    title: document.title,
                    hasReactApp: !!document.querySelector('#root, #app, [data-reactroot]'),
                    bodyText: document.body.innerText.substring(0, 500)
                };
            });
            
            console.log('Page info:', pageContent);
        }
        
        // Navigate to a specific recent tournament for more data
        if (tournaments.length > 0 && tournaments[0].url) {
            console.log(`\n📈 Getting details from: ${tournaments[0].name}`);
            await page.goto(tournaments[0].url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            
            await page.waitForTimeout(3000);
            
            // Extract deck data
            const deckData = await page.evaluate(() => {
                const decks = [];
                
                // Look for deck listings
                const deckElements = document.querySelectorAll('[class*="deck"], .player-deck, .standings-row');
                
                deckElements.forEach((el, i) => {
                    if (i >= 8) return; // Top 8 only
                    
                    const playerName = el.querySelector('.player-name, .name, h3')?.textContent || `Player ${i+1}`;
                    const deckName = el.querySelector('.deck-name, .archetype')?.textContent || 'Unknown Deck';
                    
                    decks.push({
                        placement: i + 1,
                        player: playerName.trim(),
                        deck: deckName.trim()
                    });
                });
                
                return decks;
            });
            
            console.log('\nTop 8 Decks:');
            deckData.forEach(d => {
                console.log(`${d.placement}. ${d.deck} - ${d.player}`);
            });
        }
        
        // Save whatever data we collected
        const dataPath = path.join(__dirname, 'data', 'tournament-data.json');
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        
        const saveData = {
            tournaments: tournaments.slice(0, 10),
            scrapedAt: new Date().toISOString(),
            source: 'limitlesstcg'
        };
        
        await fs.writeFile(dataPath, JSON.stringify(saveData, null, 2));
        console.log('\n✅ Tournament data saved!');
        
        // Close the page
        await page.close();
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    } finally {
        if (browser) {
            browser.disconnect();
        }
    }
}

// Run scraper
scrapeTournamentData().catch(console.error);