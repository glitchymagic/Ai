// Test Pokemon detection with problematic text
const testTexts = [
    "I don't see how these grade slabs hold any value then...",
    "isn't this Skarmory beautiful?",
    "Reposts always appreciated...",
    "Pokemon cards for sale",
    "grade slab PSA",
    "cards collection"
];

console.log('🧪 Testing Pokemon Detection\n');

// Copy the exact regex from the bot
const isPokemonContent = (text) => {
    return /pokemon|pokémon|tcg|ptcg|pikachu|charizard|eevee|mewtwo|gengar|snorlax|lucario|garchomp|dragonite|rayquaza|arceus|mew|skarmory|umbreon|espeon|vaporeon|jolteon|flareon|leafeon|glaceon|sylveon|cards?|pack|booster|collection|graded|grade|slab|psa|cgc|bgs|alt.art|full.art|secret.rare|rainbow.rare|gold.card|shiny|holo|foil|mint|nm|lp|mp|hp|dmg|1st.edition|shadowless|base.set|jungle|fossil|gym|neo|stellar|crown|surging|sparks|twilight|masquerade|temporal|forces|obsidian|flames|lost|origin|astral|radiance|celebrations|evolving|skies|fusion|strike|vivid|voltage|battle|styles|sword|shield|scarlet|violet/i.test(text);
};

testTexts.forEach((text, i) => {
    const result = isPokemonContent(text);
    console.log(`${i + 1}. "${text}"`);
    console.log(`   Pokemon Content: ${result ? '✅ YES' : '❌ NO'}\n`);
});
