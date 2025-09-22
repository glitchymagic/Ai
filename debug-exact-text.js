// Test the exact failing texts from the logs
const texts = [
    "I don't see how these grade slabs hold any value then...",
    "isn't this Skarmory beautiful?",
    "Reposts always appreciated..."
];

console.log('🔍 Testing exact texts that are failing...\n');

texts.forEach((text, i) => {
    console.log(`=== TEST ${i + 1}: "${text}" ===`);
    
    // Exact same logic as in the bot
    const textLower = text.toLowerCase();
    const isPokemonContent = /pokemon|pokémon|tcg|ptcg|pikachu|charizard|eevee|mewtwo|gengar|snorlax|lucario|garchomp|dragonite|rayquaza|arceus|mew|skarmory|umbreon|espeon|vaporeon|jolteon|flareon|leafeon|glaceon|sylveon|cards?|pack|booster|collection|graded|grade|slab|psa|cgc|bgs|alt.art|full.art|secret.rare|rainbow.rare|gold.card|shiny|holo|foil|mint|nm|lp|mp|hp|dmg|1st.edition|shadowless|base.set|jungle|fossil|gym|neo|stellar|crown|surging|sparks|twilight|masquerade|temporal|forces|obsidian|flames|lost|origin|astral|radiance|celebrations|evolving|skies|fusion|strike|vivid|voltage|battle|styles|sword|shield|scarlet|violet/i.test(text);
    const shouldReply = isPokemonContent;
    
    console.log(`textLower: "${textLower}"`);
    console.log(`isPokemonContent: ${isPokemonContent}`);
    console.log(`shouldReply: ${shouldReply}`);
    
    if (!shouldReply) {
        console.log('❌ Would convert to like-only');
    } else {
        console.log('✅ Would allow reply');
    }
    console.log('');
});

// Test individual keywords
console.log('=== Testing individual keywords ===');
const keywords = ['grade', 'slab', 'skarmory'];
keywords.forEach(keyword => {
    const test = /pokemon|pokémon|tcg|ptcg|pikachu|charizard|eevee|mewtwo|gengar|snorlax|lucario|garchomp|dragonite|rayquaza|arceus|mew|skarmory|umbreon|espeon|vaporeon|jolteon|flareon|leafeon|glaceon|sylveon|cards?|pack|booster|collection|graded|grade|slab|psa|cgc|bgs|alt.art|full.art|secret.rare|rainbow.rare|gold.card|shiny|holo|foil|mint|nm|lp|mp|hp|dmg|1st.edition|shadowless|base.set|jungle|fossil|gym|neo|stellar|crown|surging|sparks|twilight|masquerade|temporal|forces|obsidian|flames|lost|origin|astral|radiance|celebrations|evolving|skies|fusion|strike|vivid|voltage|battle|styles|sword|shield|scarlet|violet/i.test(keyword);
    console.log(`"${keyword}": ${test}`);
});
