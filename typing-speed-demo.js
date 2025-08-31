// Typing Speed Demonstration
// Shows the difference between instant and human typing

console.log('🎯 TYPING SPEED COMPARISON\n');

const testText = "Charizard trending at $241. Crown Zenith boxes restocking soon!";

// Calculate instant typing time
console.log('❌ OLD WAY (Instant):');
console.log(`   "${testText}"`);
console.log('   Time: ~0.1 seconds (OBVIOUS BOT!)\n');

// Calculate human typing time
const charCount = testText.length;
let minTime = 0;
let maxTime = 0;

for (let char of testText) {
    if (['.', '!', '?', ','].includes(char)) {
        minTime += 200;
        maxTime += 500;
    } else if (char === ' ') {
        minTime += 50;
        maxTime += 150;
    } else {
        minTime += 80;
        maxTime += 200;
    }
}

// Add thinking pauses (5% chance)
const thinkingPauses = Math.floor(charCount * 0.05);
minTime += thinkingPauses * 500;
maxTime += thinkingPauses * 1500;

// Add final review pause
minTime += 500;
maxTime += 1500;

console.log('✅ NEW WAY (Human-like):');
console.log(`   "${testText}"`);
console.log(`   Characters: ${charCount}`);
console.log(`   Time: ${(minTime/1000).toFixed(1)}-${(maxTime/1000).toFixed(1)} seconds`);
console.log(`   Speed: ~${Math.floor(60000/(maxTime/charCount))} WPM (realistic)\n`);

console.log('📊 BEHAVIOR DIFFERENCES:');
console.log('   • Old: Instant paste (dead giveaway)');
console.log('   • New: Natural typing rhythm');
console.log('   • New: Pauses after punctuation');
console.log('   • New: Occasional thinking pauses');
console.log('   • New: 2% chance of typo + correction');
console.log('   • New: Reviews before sending\n');

console.log('🛡️ This makes the bot appear human and helps avoid detection!');