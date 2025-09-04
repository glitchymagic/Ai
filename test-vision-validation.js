// Test to validate vision API accuracy
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const fs = require('fs').promises;

async function testVisionAccuracy() {
    console.log("🧪 Testing Vision API Accuracy with Known Images\n");
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.1, // Lower temperature for more consistent results
        }
    });
    
    // Test cases with known content
    const testCases = [
        {
            name: "Tournament Poster (like Collector's Cave)",
            description: "Should identify as event poster, not a card",
            expectedType: "event_poster",
            prompt: `Analyze this Pokemon-related image. Is this:
1. A Pokemon card (if so, which Pokemon?)
2. An event poster/flyer
3. Something else

Be very specific. If it's an event poster, DO NOT identify any Pokemon cards.
If you see a Pokemon character on a poster, that's part of the poster design, not a card.

Respond with:
TYPE: [card/event_poster/other]
CONTENT: [brief description]`
        },
        {
            name: "Actual Pokemon Card", 
            description: "Should identify the specific Pokemon",
            expectedType: "card",
            prompt: `Analyze this Pokemon card image. Identify:
TYPE: card
POKEMON: [name of the Pokemon]
SET: [set name if visible]
RARITY: [rarity if visible]`
        }
    ];
    
    // You would test with actual images here
    console.log("📋 Test Guidelines:");
    console.log("1. Event posters should NEVER be identified as cards");
    console.log("2. Pokemon mascots on posters are NOT cards");
    console.log("3. Only actual TCG cards should be identified as cards");
    console.log("\n🔍 The issue: Bot is confusing event posters with card showcases");
    
    // Enhanced prompt for better accuracy
    const enhancedPrompt = `You are analyzing Pokemon TCG Twitter content. Users post:
1. CARDS: Actual Pokemon trading cards they own
2. EVENT POSTERS: Tournament/event announcements with Pokemon characters as decoration
3. OTHER: Memes, artwork, etc.

CRITICAL: Event posters often have Pokemon characters (like Chikorita) as mascots. These are NOT cards!
Only identify something as a card if you see an actual Pokemon TCG card with HP, attacks, etc.

For this image, determine:
- Is this an EVENT POSTER? (has date, time, entry fee, location)
- Is this a CARD? (has HP, attacks, card number)
- What Pokemon character appears? (mascot on poster vs actual card)

FORMAT:
CATEGORY: [EVENT_POSTER/CARD/OTHER]
POKEMON_SHOWN: [name]
IS_ACTUAL_CARD: [yes/no]
EVENT_DETAILS: [if poster, list date/time/fee]`;
    
    console.log("\n📝 Enhanced Prompt for Better Recognition:");
    console.log(enhancedPrompt);
}

testVisionAccuracy().catch(console.error);