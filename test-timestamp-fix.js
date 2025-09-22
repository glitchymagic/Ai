// Test the timestamp filter fix for specific card searches
const TimestampFilter = require('./features/timestamp-filter.js');

const timestampFilter = new TimestampFilter();

// Create test timestamps (old posts)
const now = new Date();
const oldTimestamp1 = new Date(now.getTime() - (48 * 60 * 60 * 1000)); // 48 hours old
const oldTimestamp2 = new Date(now.getTime() - (100 * 60 * 60 * 1000)); // 100 hours old (4+ days)

console.log('🧪 Testing Timestamp Filter Fix\n');

console.log('=== Test 1: General search with old post (should be rejected) ===');
const result1 = timestampFilter.shouldEngageByAge(oldTimestamp1, false);
console.log(`Post: 48 hours old, isSpecificCardSearch: false`);
console.log(`Result: engage=${result1.engage}, reason=${result1.reason}, details=${result1.details}\n`);

console.log('=== Test 2: Specific card search with old post (should be accepted) ===');
const result2 = timestampFilter.shouldEngageByAge(oldTimestamp1, true);
console.log(`Post: 48 hours old, isSpecificCardSearch: true`);
console.log(`Result: engage=${result2.engage}, reason=${result2.reason}, details=${result2.details}\n`);

console.log('=== Test 3: Very old post with specific search (should still be accepted) ===');
const result3 = timestampFilter.shouldEngageByAge(oldTimestamp2, true);
console.log(`Post: 100 hours old, isSpecificCardSearch: true`);
console.log(`Result: engage=${result3.engage}, reason=${result3.reason}, details=${result3.details}\n`);

console.log('=== Test 4: Extremely old post (beyond 7 days, should be rejected) ===');
const veryOldTimestamp = new Date(now.getTime() - (8 * 24 * 60 * 60 * 1000)); // 8 days old
const result4 = timestampFilter.shouldEngageByAge(veryOldTimestamp, true);
console.log(`Post: 192 hours old (8 days), isSpecificCardSearch: true`);
console.log(`Result: engage=${result4.engage}, reason=${result4.reason}, details=${result4.details}\n`);

if (result1.engage === false && result2.engage === true && result3.engage === true && result4.engage === false) {
    console.log('✅ ALL TESTS PASSED! Timestamp filter fix is working correctly.');
} else {
    console.log('❌ TESTS FAILED! There is an issue with the timestamp filter fix.');
}
