// features/response-composer.js
const { classifyIntents } = require('./intent-engine.js');
const { formatPersona } = require('./persona-style.js');
const { detectEventFromText } = require('./event-detector.js');

async function composeResponse({ text, hasImages, threadContext, authorityFn, isEvent=false }) {
  const intents = classifyIntents(text);

  // Event mode: never inject prices; keep it social and specific
  if (isEvent) {
    const eventLine = `Looks fun — what's the usual turnout?`;
    return {
      text: formatPersona(eventLine, { confidence: 0.7, intents: { primary: 'general' }, noPrefix: true }),
      meta: { intents, mode: 'event' }
    };
  }

  // Authority section (always attempt; must never return null)
  const authority = authorityFn ? await authorityFn({ text, hasImages, intents }) : 
                   { primary: '', secondary: '', confidence: 0.6 };
  const threadBit = (threadContext && threadContext.snippet) ? threadContext.snippet : '';

  let body = [authority.primary, authority.secondary].filter(Boolean).join(' ');
  if (threadBit && (body.length + 3 + threadBit.length) <= 280) {
    body = `${body} ${threadBit}`;
  }
  const styled = formatPersona(body, { confidence: authority.confidence, intents });
  return { text: styled, meta: { intents, mode: 'composed' } };
}

module.exports = { composeResponse };