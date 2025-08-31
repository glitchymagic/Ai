// features/intent-engine.js
const LEX = {
  retail: {
    must: [['walmart','target','gamestop','store','mall','retail','restock','peg','shelf','aisle']],
    any:  [['find','found','stock','drop','limit','queue','line','buy','resell','scalp','pro member','double limit']],
    weight: 1.0
  },
  price: {
    must: [['price','worth','value','going for','comp','comps','how much','sell for']],
    any:  [['raw','psa','cgc','bgs','slab','auction','ebay','tcgplayer']],
    weight: 1.2
  },
  grading: { any: [['grade','graded','grading','psa','cgc','bgs','slab','sub','pop']], weight: 0.8 },
  pack_opening: { any: [['open','rip','ripped','break','pack','box','blister','booster']], weight: 0.8 },
  pull_rates: { any: [['pull','hit','alt','secret','gold','rate','odds','case','etb']], weight: 0.9 },
  vintage_modern: { any: [['wotc','neo','aquapolis','skyridge','ex era','bw','xy','sun & moon','sword & shield','scarlet & violet']], weight: 0.7 },
};

const norm = s => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const approx = (t, n) => (t.includes(n) || (n.length >= 4 && new RegExp(`\\b${n.slice(0,5)}\\w*\\b`,'i').test(t)));
const groupHit = (t, g) => g.some(term => approx(t, term));

function classifyIntents(raw) {
  const text = norm(raw || '');
  const scores = {};
  for (const [intent, cfg] of Object.entries(LEX)) {
    let s = 0;
    if (cfg.must?.length) {
      const ok = cfg.must.some(g => groupHit(text, g));
      if (!ok) continue;
      s += 1;
    }
    if (cfg.any?.length) {
      const hits = cfg.any.reduce((acc,g)=>acc + (groupHit(text,g) ? 1 : 0), 0);
      s += Math.min(2, hits * 0.6);
    }
    scores[intent] = s * (cfg.weight || 1);
  }
  const ranked = Object.entries(scores).filter(([,s]) => s > 0.8).sort((a,b)=>b[1]-a[1]);
  return { ranked, primary: ranked[0]?.[0] || null, confidence: Math.min(1, (ranked[0]?.[1]||0)/3) };
}

module.exports = { classifyIntents };