// features/event-detector.js
const DOW = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday','tues','wed','thu','fri','sat','sun'];
const TIME = /\b(\d{1,2})(?::(\d{2}))?\s?(am|pm)\b/i;
const TIME24 = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;           // 18:00
const ENTRY = /\$?\d{1,3}\s?(entry|buy[- ]?in|fee)/i;
const ADDRESS = /\d{2,5}\s+[\w\s]+(rd|road|st|street|ave|avenue|blvd|lane|ln|mall)/i;
const TOURNEY = /(tournament|locals|league|event|play|round|pairings|prizing|bo[13] swiss|8pt|format)/i;
const SIGNUP = /(register|sign[-\s]?up|prizing|pairings)/i; // common poster words
const VENUE = /(lgs|local game store|pokemon league)/i;

function detectEventFromText(text='') {
  const t = text.toLowerCase();
  const hasDow = DOW.some(d=>t.includes(d));
  const hasTime = TIME.test(t) || TIME24.test(t);
  const hasEntry = ENTRY.test(t);
  const hasAddr = ADDRESS.test(t) || VENUE.test(t);
  const hasTourney = TOURNEY.test(t) || SIGNUP.test(t);
  const strongSignals = [hasDow, hasTime, hasEntry, hasAddr, hasTourney].filter(Boolean).length;
  return { isEvent: strongSignals >= 2, reasons: { hasDow, hasTime, hasEntry, hasAddr, hasTourney } };
}

module.exports = { detectEventFromText };