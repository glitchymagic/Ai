// Test the stripMarketNumbers function
function stripMarketNumbers(s='') {
  return String(s)
    // money $12.34 / €12,34
    .replace(/[$€£]\s?\d[\d,\.]*/g, '')
    // percentages 15% / +15% WoW
    .replace(/[+\-]?\s?\d{1,3}\s?%(\s?\w+)?/gi, '')
    // time windows 7d / 30d / last 7 days / 24h
    .replace(/\b(7|14|30|60|90|365)\s?d\b/gi, '')
    .replace(/\b(12|24)\s?h\b/gi, '')
    .replace(/\blast\s?\d+\s?(d|days|hours|hrs|h)\b/gi, '')
    // volume counts: 100 sales / 100+ sold
    .replace(/\b\d{2,}\s?(sales|sold|listings)\b/gi, '')
    .replace(/\b\d{2,}\s?\+\s?(sales|sold|listings)\b/gi, '')
    .replace(/\b\s{2,}\b/g,' ')
    .trim();
}

// Clean up punctuation after stripping
function tidyPunctuation(s='') {
  return String(s)
    .replace(/\(\s*\)/g, '')          // remove empty ()
    .replace(/\s+,/g, ',')            // no space before commas
    .replace(/,\s*(,|\.)/g, '$1')     // no double punctuation
    .replace(/\s{2,}/g, ' ')          // collapse spaces
    .replace(/\s+([?!.,;:])/g, '$1')  // no space before punctuation
    .trim();
}

const tests = [
  "Moonbreon up $50 (15% WoW) last 7d",
  "100+ sales in 24h, trending at $450",
  "PSA 10 going for €1,200 with 365 sold",
  "Market shows +25% gains last 30 days",
  "Check recent solds: 500 listings at various prices",
  "Focus on centering, avoid the 7-day hype"
];

console.log('Testing stripMarketNumbers + tidyPunctuation:\n');
tests.forEach(test => {
  console.log(`Original: "${test}"`);
  const stripped = stripMarketNumbers(test);
  console.log(`Stripped: "${stripped}"`);
  console.log(`Tidied:   "${tidyPunctuation(stripped)}"`);
  console.log('');
});