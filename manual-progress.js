const fs = require('fs');

// Load current progress
let total = 634;
try {
    total = parseInt(fs.readFileSync('cleanup-progress.txt', 'utf8')) || 634;
} catch (e) {}

console.log('📊 Manual Progress Tracker');
console.log('========================\n');
console.log(`Current total: ${total} retweets cleaned\n`);

console.log('Instructions:');
console.log('1. Open Chrome manually');
console.log('2. Go to https://x.com/GlitchyGrade');
console.log('3. Manually undo retweets by:');
console.log('   - Click the retweet button (green arrows)');
console.log('   - Click "Undo repost"');
console.log('4. Count how many you clean\n');

console.log('Then run: node manual-progress.js add NUMBER');
console.log('Example: node manual-progress.js add 50\n');

// Handle command line args
const args = process.argv.slice(2);
if (args[0] === 'add' && args[1]) {
    const toAdd = parseInt(args[1]);
    if (!isNaN(toAdd)) {
        total += toAdd;
        fs.writeFileSync('cleanup-progress.txt', total.toString());
        console.log(`✅ Added ${toAdd} to progress`);
        console.log(`📊 New total: ${total} retweets cleaned`);
    }
} else if (args[0] === 'set' && args[1]) {
    const newTotal = parseInt(args[1]);
    if (!isNaN(newTotal)) {
        fs.writeFileSync('cleanup-progress.txt', newTotal.toString());
        console.log(`✅ Set total to: ${newTotal}`);
    }
}