// Tournament Table Scraper
// Extracts data from the tournament table

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

async function scrapeTournamentTable() {
    console.log('🏆 SCRAPING TOURNAMENT TABLE DATA');
    console.log('=================================\n');
    
    let browser;
    
    try {
        // Connect to existing Chrome
        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        
        const page = await browser.newPage();
        
        // Navigate to completed tournaments
        console.log('📍 Loading tournament page...');
        await page.goto('https://play.limitlesstcg.com/tournaments/completed', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
        
        // Wait for table to load
        await page.waitForTimeout(5000);
        
        console.log('📊 Extracting tournament data from table...\n');
        
        // Extract data from the table
        const tournaments = await page.evaluate(() => {
            const results = [];
            
            // Find all table rows
            const rows = document.querySelectorAll('tr');
            
            rows.forEach((row, index) => {
                // Skip header row
                if (index === 0) return;
                
                const cells = row.querySelectorAll('td');
                if (cells.length >= 5) {
                    const date = cells[0]?.textContent?.trim() || '';
                    const name = cells[1]?.textContent?.trim() || '';
                    const organizer = cells[2]?.textContent?.trim() || '';
                    const players = cells[3]?.textContent?.trim() || '';
                    const winner = cells[4]?.textContent?.trim() || '';
                    
                    // Only include if it has meaningful data
                    if (name && name.length > 3) {
                        results.push({
                            date,
                            name,
                            organizer,
                            players,
                            winner,
                            index: index
                        });
                    }
                }
            });
            
            return results;
        });
        
        console.log(`Found ${tournaments.length} tournaments\n`);
        
        // Filter for major tournaments
        const majorTournaments = tournaments.filter(t => 
            t.name.toLowerCase().includes('regional') ||
            t.name.toLowerCase().includes('championship') ||
            t.name.toLowerCase().includes('special event') ||
            parseInt(t.players) > 100
        );
        
        console.log('🏆 MAJOR TOURNAMENTS:');
        console.log('====================\n');
        
        majorTournaments.slice(0, 10).forEach((t, i) => {
            console.log(`${i + 1}. ${t.name}`);
            console.log(`   Date: ${t.date}`);
            console.log(`   Players: ${t.players}`);
            console.log(`   Winner: ${t.winner}`);
            console.log();
        });
        
        // Get all recent tournaments for analysis
        const recentTournaments = tournaments.slice(0, 30);
        
        // Analyze winning decks
        console.log('📈 DECK ANALYSIS:');
        console.log('================\n');
        
        const deckCounts = {};
        recentTournaments.forEach(t => {
            const winner = t.winner;
            if (winner && winner !== 'TBD') {
                // Try to identify deck from winner name (sometimes includes deck)
                const deckPatterns = [
                    'Giratina', 'Lost Box', 'Lugia', 'Gardevoir', 'Charizard',
                    'Miraidon', 'Mew', 'Palkia', 'Arceus', 'Snorlax'
                ];
                
                deckPatterns.forEach(deck => {
                    if (winner.includes(deck) || t.name.includes(deck)) {
                        deckCounts[deck] = (deckCounts[deck] || 0) + 1;
                    }
                });
            }
        });
        
        // Click on first major tournament for deck details
        if (majorTournaments.length > 0) {
            console.log(`\n🔍 Getting deck details from: ${majorTournaments[0].name}`);
            
            try {
                // Find and click the tournament link
                const clicked = await page.evaluate((tournamentName) => {
                    const links = Array.from(document.querySelectorAll('a'));
                    const link = links.find(a => a.textContent.includes(tournamentName));
                    if (link) {
                        link.click();
                        return true;
                    }
                    return false;
                }, majorTournaments[0].name);
                
                if (clicked) {
                    await page.waitForTimeout(5000);
                    
                    // Extract deck data from tournament page
                    const deckData = await page.evaluate(() => {
                        const decks = [];
                        
                        // Look for standings or deck information
                        const standingsRows = document.querySelectorAll('tr');
                        
                        standingsRows.forEach((row, i) => {
                            if (i === 0 || i > 8) return; // Header or beyond top 8
                            
                            const cells = row.querySelectorAll('td');
                            if (cells.length >= 2) {
                                const placement = cells[0]?.textContent?.trim() || `${i}`;
                                const player = cells[1]?.textContent?.trim() || '';
                                const deck = cells[2]?.textContent?.trim() || cells[3]?.textContent?.trim() || '';
                                
                                if (player) {
                                    decks.push({
                                        placement,
                                        player,
                                        deck: deck || 'Unknown'
                                    });
                                }
                            }
                        });
                        
                        return decks;
                    });
                    
                    if (deckData.length > 0) {
                        console.log('\nTop 8 Results:');
                        deckData.forEach(d => {
                            console.log(`${d.placement}. ${d.player} - ${d.deck}`);
                        });
                    }
                }
            } catch (error) {
                console.log('Could not get deck details:', error.message);
            }
        }
        
        // Save all data
        const saveData = {
            majorTournaments: majorTournaments.slice(0, 10),
            recentTournaments: recentTournaments,
            deckAnalysis: deckCounts,
            totalTournaments: tournaments.length,
            scrapedAt: new Date().toISOString()
        };
        
        const dataPath = path.join(__dirname, 'data', 'tournament-results.json');
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        await fs.writeFile(dataPath, JSON.stringify(saveData, null, 2));
        
        console.log('\n✅ Tournament data saved to tournament-results.json');
        
        // Generate insights
        console.log('\n💡 INSIGHTS FOR BOT:');
        console.log('===================\n');
        
        if (majorTournaments.length > 0) {
            console.log(`• "${majorTournaments[0].name}" just concluded with ${majorTournaments[0].players} players`);
            console.log(`• ${majorTournaments[0].winner} took down the event`);
        }
        
        if (Object.keys(deckCounts).length > 0) {
            const topDeck = Object.entries(deckCounts).sort((a, b) => b[1] - a[1])[0];
            console.log(`• ${topDeck[0]} appearing in multiple top finishes`);
        }
        
        await page.close();
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    } finally {
        if (browser) browser.disconnect();
    }
}

// Run scraper
scrapeTournamentTable().catch(console.error);