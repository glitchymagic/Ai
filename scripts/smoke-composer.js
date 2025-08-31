const { composeResponse } = require('../features/response-composer');
const { buildThreadSnippet } = require('../features/thread-snippet');

function fakeAuthority({ text, intents }) {
  // pretend authority lines (no numbers)
  return { primary: `If you're buying sealed, check endcaps and side SKUs.`, secondary: `Solds > listings.`, confidence: 0.72 };
}

const cases = [
  { label:'Poster', text:'POKÉMON TOURNAMENT • Tuesdays 6:00PM • $10 entry • Santa Fe Place Mall' , isEvent:true },
  { label:'Retail', text:'Target doubled limits for Pro members. Worth lining up today?', isEvent:false },
  { label:'PriceQ', text:'What\'s Moonbreon going for raw vs PSA 9?', isEvent:false },
  { label:'Showcase', text:'Pulled this Umbreon last night — insane art.' , isEvent:false },
];

for (const c of cases) {
  const res = composeResponse({
    text: c.text,
    hasImages: false,
    threadContext: { fullConversation: [], threadLength: 1, snippet: '' },
    isEvent: c.isEvent,
    authorityFn: fakeAuthority
  });
  console.log(`\n[${c.label}] → ${res.text}`);
}