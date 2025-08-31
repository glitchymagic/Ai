// Tournament Results Tracker
// Scrapes Limitless TCG for meta insights

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

class TournamentTracker {
    constructor() {
        this.tournaments = [];
        this.metaDecks = [];
        this.cardPerformance = new Map();
        this.dataPath = path.join(__dirname, '../data/tournament-data.json');
        this.browser = null;
    }
    
    async initialize() {
        await this.loadData();
        console.log('🏆 Tournament tracker initialized');
    }
    
    async loadData() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const parsed = JSON.parse(data);
            this.tournaments = parsed.tournaments || [];
            this.metaDecks = parsed.metaDecks || [];
            this.cardPerformance = new Map(parsed.cardPerformance || []);
        } catch (error) {
            // Start fresh if no data
            console.log('📊 Starting fresh tournament data');
        }
    }
    
    async saveData() {
        const data = {
            tournaments: this.tournaments,
            metaDecks: this.metaDecks,
            cardPerformance: Array.from(this.cardPerformance.entries()),
            lastUpdated: new Date().toISOString()
        };
        
        await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    }
    
    async scrapeLatestTournaments() {
        console.log('🔍 Scraping latest tournament results...');
        
        try {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await this.browser.newPage();
            
            // Go to Limitless tournaments page
            await page.goto('https://play.limitlesstcg.com/tournaments/completed', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            // Wait for tournament list
            await page.waitForSelector('.tournament-info', { timeout: 10000 });
            
            // Scrape recent tournaments
            const tournaments = await page.evaluate(() => {
                const tourneyElements = document.querySelectorAll('.tournament-info');
                const results = [];
                
                // Get top 5 recent tournaments
                for (let i = 0; i < Math.min(5, tourneyElements.length); i++) {
                    const el = tourneyElements[i];
                    const name = el.querySelector('.tournament-name')?.textContent?.trim();
                    const date = el.querySelector('.tournament-date')?.textContent?.trim();
                    const players = el.querySelector('.player-count')?.textContent?.trim();
                    const link = el.querySelector('a')?.href;
                    
                    if (name && link) {
                        results.push({ name, date, players, link });
                    }
                }
                
                return results;
            });
            
            console.log(`📊 Found ${tournaments.length} recent tournaments`);
            
            // Analyze each tournament
            for (const tournament of tournaments.slice(0, 3)) { // Top 3 for speed
                await this.analyzeTournament(page, tournament);
                await this.sleep(2000); // Be respectful
            }
            
            await this.browser.close();
            await this.saveData();
            
            console.log('✅ Tournament data updated');
            
        } catch (error) {
            console.log(`❌ Tournament scrape error: ${error.message}`);
            if (this.browser) await this.browser.close();
        }
    }
    
    async analyzeTournament(page, tournament) {
        console.log(`📈 Analyzing ${tournament.name}...`);
        
        try {
            await page.goto(tournament.link, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            // Get top 8 decks
            const top8Decks = await page.evaluate(() => {
                const deckElements = document.querySelectorAll('.deck-tile');
                const decks = [];
                
                for (let i = 0; i < Math.min(8, deckElements.length); i++) {
                    const el = deckElements[i];
                    const archetype = el.querySelector('.deck-archetype')?.textContent?.trim();
                    const player = el.querySelector('.player-name')?.textContent?.trim();
                    const placement = i + 1;
                    
                    // Get key cards
                    const cards = Array.from(el.querySelectorAll('.card-name'))
                        .map(c => c.textContent.trim())
                        .slice(0, 5); // Top 5 cards
                    
                    if (archetype) {
                        decks.push({ archetype, player, placement, cards });
                    }
                }
                
                return decks;
            });
            
            // Store tournament data
            this.tournaments.push({
                ...tournament,
                top8: top8Decks,
                analyzed: new Date().toISOString()
            });
            
            // Update meta analysis
            this.updateMetaAnalysis(top8Decks);
            
        } catch (error) {
            console.log(`⚠️ Could not analyze ${tournament.name}`);
        }
    }
    
    updateMetaAnalysis(decks) {
        // Track deck performance
        for (const deck of decks) {
            const existing = this.metaDecks.find(d => d.archetype === deck.archetype);
            
            if (existing) {
                existing.top8Count++;
                existing.placements.push(deck.placement);
                existing.lastSeen = new Date().toISOString();
            } else {
                this.metaDecks.push({
                    archetype: deck.archetype,
                    top8Count: 1,
                    placements: [deck.placement],
                    keyCards: deck.cards,
                    firstSeen: new Date().toISOString(),
                    lastSeen: new Date().toISOString()
                });
            }
            
            // Track individual card performance
            for (const card of deck.cards) {
                const perf = this.cardPerformance.get(card) || { appearances: 0, avgPlacement: 0 };
                perf.appearances++;
                perf.avgPlacement = ((perf.avgPlacement * (perf.appearances - 1)) + deck.placement) / perf.appearances;
                this.cardPerformance.set(card, perf);
            }
        }
    }
    
    // Get current meta snapshot
    getMetaSnapshot() {
        // Sort by recent performance
        const topDecks = this.metaDecks
            .sort((a, b) => b.top8Count - a.top8Count)
            .slice(0, 5);
        
        return {
            topDecks,
            risingDecks: this.getRisingDecks(),
            hotCards: this.getHotCards(),
            lastUpdated: this.tournaments[0]?.analyzed || 'Never'
        };
    }
    
    // Find rising decks
    getRisingDecks() {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 7); // Last week
        
        return this.metaDecks
            .filter(d => new Date(d.lastSeen) > recentDate)
            .filter(d => d.placements.some(p => p <= 3)) // Top 3 finishes
            .slice(0, 3);
    }
    
    // Get cards appearing in winning decks
    getHotCards() {
        const cards = Array.from(this.cardPerformance.entries())
            .filter(([_, perf]) => perf.avgPlacement <= 4) // Top 4 average
            .sort((a, b) => b[1].appearances - a[1].appearances)
            .slice(0, 10)
            .map(([card, perf]) => ({
                card,
                appearances: perf.appearances,
                avgPlacement: perf.avgPlacement.toFixed(1)
            }));
        
        return cards;
    }
    
    // Generate tournament insights for posts
    generateInsight() {
        const meta = this.getMetaSnapshot();
        
        if (meta.topDecks.length === 0) {
            return null;
        }
        
        const insights = [
            {
                type: 'meta_leader',
                text: `${meta.topDecks[0].archetype} dominating with ${meta.topDecks[0].top8Count} recent top 8s`,
                confidence: 0.9
            },
            {
                type: 'rising_deck',
                text: meta.risingDecks[0] ? `${meta.risingDecks[0].archetype} breaking into top tables` : null,
                confidence: 0.8
            },
            {
                type: 'hot_card',
                text: meta.hotCards[0] ? `${meta.hotCards[0].card} in ${meta.hotCards[0].appearances} top decks` : null,
                confidence: 0.85
            }
        ];
        
        // Return non-null insights
        return insights.filter(i => i.text);
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = TournamentTracker;