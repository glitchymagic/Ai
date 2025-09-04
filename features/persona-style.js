// features/persona-style.js
function formatPersona(text, { confidence=0.6, intents, noPrefix=false }={}) {
  // Better fallback handling
  if (!text || text === 'undefined') {
    text = 'Nice pull! The set has some great cards.';
  }
  const out = String(text).replace(/\s+/g,' ').trim();
  const wantsPrefix = ['price','retail'].includes(intents?.primary) && !noPrefix;
  const prefix = wantsPrefix ? 'Quick signal: ' : '';
  // Remove confidence tag for production
  return `${prefix}${out}`.trim();
}

module.exports = { formatPersona };