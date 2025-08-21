// Response Examples Showcase
// Shows what the bot would actually reply with

const HumanLikeResponses = require('./features/human-like-responses');

const humanBot = new HumanLikeResponses();

const examples = [
    // Amazing pulls
    {
        category: "🔥 AMAZING PULLS",
        tweets: [
            "HOLY GRAIL!! Just pulled the Moonbreon from Evolving Skies!! 😭😭",
            "NO WAY! Charizard ex on my first pack!! 🔥",
            "I'M SHAKING! Lugia V Alt Art from Silver Tempest!!",
            "CHASE CARD ALERT! Got the Giratina VSTAR!! 💀"
        ]
    },
    
    // Regular pulls
    {
        category: "📦 REGULAR PULLS",
        tweets: [
            "Pulled this Alakazam ex today, thoughts?",
            "Not bad for 3 packs from Target",
            "Today's pulls from a booster box",
            "Got some hits from Paradox Rift"
        ]
    },
    
    // Grading questions
    {
        category: "🔍 GRADING QUESTIONS",
        tweets: [
            "Should I grade this Charizard? Centering looks good",
            "Is this worth sending to PSA? Corners look mint",
            "PSA or BGS for this Umbreon?",
            "Think this could get a 10? 55/45 centering"
        ]
    },
    
    // Value questions
    {
        category: "💰 VALUE QUESTIONS",
        tweets: [
            "What's this Moonbreon worth raw?",
            "How much does a PSA 10 Charizard go for?",
            "Price check on Giratina V alt art?",
            "Is $200 fair for this card?"
        ]
    },
    
    // Store questions
    {
        category: "🏪 STORE QUESTIONS",
        tweets: [
            "Where can I find Pokemon cards? Everything's sold out",
            "When does Target restock?",
            "Any tips for finding cards at Walmart?",
            "Best place to buy booster boxes?"
        ]
    },
    
    // Investment questions
    {
        category: "📈 INVESTMENT QUESTIONS",
        tweets: [
            "Is Evolving Skies worth holding sealed?",
            "Should I invest in Crown Zenith?",
            "Better investment: 151 or Obsidian Flames?",
            "Worth keeping modern sealed?"
        ]
    },
    
    // Mail day posts
    {
        category: "📬 MAIL DAY",
        tweets: [
            "Mail day! Added some vintage to the collection 📬",
            "Package arrived! Check out these slabs",
            "Best mail day ever! Look at these beauties",
            "Finally came in from Japan!"
        ]
    },
    
    // Sales posts
    {
        category: "💸 SALES POSTS",
        tweets: [
            "WTS Charizard VMAX $150 shipped",
            "FOR SALE: Umbreon collection, DM for prices",
            "FS: PSA 10 Pikachu $300 OBO",
            "Selling my doubles, prices in comments"
        ]
    },
    
    // Bad luck
    {
        category: "😢 BAD LUCK",
        tweets: [
            "Worst booster box ever... no hits at all",
            "10 packs and nothing but bulk 😭",
            "My luck has been terrible lately",
            "Another L box... I'm done"
        ]
    },
    
    // Authenticity checks
    {
        category: "🔎 AUTHENTICITY",
        tweets: [
            "Is this Base Set Charizard real or fake?",
            "Can someone legit check this for me?",
            "Bought this online, looks sus?",
            "Real or fake? The holo seems off"
        ]
    },
    
    // Set comparisons
    {
        category: "⚔️ SET COMPARISONS",
        tweets: [
            "Surging Sparks or Stellar Crown?",
            "Which set has better pull rates?",
            "Crown Zenith vs Evolving Skies for collecting?",
            "Best modern set to open?"
        ]
    },
    
    // General excitement
    {
        category: "🎉 GENERAL POSTS",
        tweets: [
            "Look at my collection so far!",
            "Finally completed the Eeveelution set!",
            "My display is coming together nicely",
            "Rate my setup!"
        ]
    }
];

console.log("\n" + "=".repeat(60));
console.log("🤖 POKEMON BOT RESPONSE EXAMPLES");
console.log("=".repeat(60));
console.log("Showing actual responses the bot would generate:\n");

examples.forEach(category => {
    console.log("\n" + category.category);
    console.log("-".repeat(40));
    
    category.tweets.forEach(tweet => {
        // Generate 3 possible responses to show variety
        const responses = [];
        for (let i = 0; i < 3; i++) {
            const response = humanBot.generateHumanResponse(tweet);
            if (!responses.includes(response)) {
                responses.push(response);
            }
        }
        
        console.log(`\n📝 Tweet: "${tweet}"`);
        console.log("   Possible responses:");
        responses.forEach(r => {
            console.log(`   • "${r}"`);
        });
    });
});

console.log("\n" + "=".repeat(60));
console.log("KEY FEATURES:");
console.log("• Casual language (no formal grammar)");
console.log("• Natural typos and shortcuts");
console.log("• Appropriate emoji usage (sometimes)");
console.log("• Matches energy of original tweet");
console.log("• Short and Twitter-like");
console.log("• Helpful but not preachy");
console.log("=".repeat(60) + "\n");