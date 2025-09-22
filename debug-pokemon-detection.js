// Debug exactly what the bot is doing with Pokemon detection
const testTexts = [
    "I don't see how these grade slabs hold any value then...",
    "isn't this Skarmory beautiful?",
    "Pokemon cards for sale"
];

console.log('🔍 Debugging Pokemon Detection Logic\n');

testTexts.forEach((text, i) => {
    console.log(`\n=== TEST ${i + 1}: "${text}" ===`);
    
    // Exact copy of bot's Pokemon detection logic
    const textLower = text.toLowerCase();
    const isPokemonContent = /pokemon|pokémon|tcg|ptcg|pikachu|charizard|eevee|mewtwo|gengar|snorlax|lucario|garchomp|dragonite|rayquaza|arceus|mew|skarmory|umbreon|espeon|vaporeon|jolteon|flareon|leafeon|glaceon|sylveon|cards?|pack|booster|collection|graded|grade|slab|psa|cgc|bgs|alt.art|full.art|secret.rare|rainbow.rare|gold.card|shiny|holo|foil|mint|nm|lp|mp|hp|dmg|1st.edition|shadowless|base.set|jungle|fossil|gym|neo|stellar|crown|surging|sparks|twilight|masquerade|temporal|forces|obsidian|flames|lost|origin|astral|radiance|celebrations|evolving|skies|fusion|strike|vivid|voltage|battle|styles|sword|shield|scarlet|violet/i.test(text);
    
    console.log(`textLower: "${textLower}"`);
    console.log(`isPokemonContent: ${isPokemonContent}`);
    
    // The bot's shouldReply logic
    const shouldReply = isPokemonContent;
    console.log(`shouldReply: ${shouldReply}`);
    
    // What the bot would do
    const action = 'reply';
    if (!shouldReply && action === 'reply') {
        console.log('❌ Would convert to like-only: "Not Pokemon-related content"');
    } else {
        console.log('✅ Would allow reply');
    }
});
