// Linguistics — Chapter 3 shared helpers: a mini morpheme lexicon with a parser (3.1, 3.2, 3.3, 3.5), a small tree drawer (3.3, 3.4).
// Re-exports the chapter 2 helpers (feature system, rule engine, respelling).
export * from './ch02.shared.js';

// ------------------------------------------------------------------ the mini lexicon
// Each entry: id, surface alternatives (spelling changes such as believe/believ-, happy/happi-), type, gloss, free?, derivational/inflectional.
//   type: 'root' | 'prefix' | 'dsuffix' (derivational) | 'isuffix' (inflectional)
const E = (id, surf, type, gloss, extra = {}) => ({ id, surf, type, gloss, ...extra });
export const MORPHEMES = [
  // prefixes (derivational)
  E('un-', ['un'], 'prefix', 'not / reverse the action'), E('re-', ['re'], 'prefix', 'again'), E('dis-', ['dis'], 'prefix', 'not / reverse'),
  E('in-', ['in', 'im', 'il', 'ir'], 'prefix', 'not'), E('mis-', ['mis'], 'prefix', 'wrongly'), E('pre-', ['pre'], 'prefix', 'before'),
  E('over-', ['over'], 'prefix', 'too much'), E('de-', ['de'], 'prefix', 'remove'), E('non-', ['non'], 'prefix', 'not'), E('anti-', ['anti'], 'prefix', 'against'),
  E('co-', ['co'], 'prefix', 'together'), E('en-', ['en', 'em'], 'prefix', 'cause to be'), E('inter-', ['inter'], 'prefix', 'between'),
  // derivational suffixes
  E('-able', ['able', 'abl', 'ible', 'ibl'], 'dsuffix', 'able to be …ed', { cat: 'Adj', from: 'V' }), E('-ly', ['ly', 'ily', 'li', 'y'], 'dsuffix', 'in a … manner', { cat: 'Adv', from: 'Adj' }),
  E('-ness', ['ness'], 'dsuffix', 'the state of being …', { cat: 'N', from: 'Adj' }), E('-ity', ['ity', 'iti'], 'dsuffix', 'the state of being …', { cat: 'N', from: 'Adj' }),
  E('-ful', ['ful'], 'dsuffix', 'full of …', { cat: 'Adj', from: 'N' }), E('-less', ['less'], 'dsuffix', 'without …', { cat: 'Adj', from: 'N' }),
  E('-er', ['er', 'r'], 'dsuffix', 'one who …s', { cat: 'N', from: 'V', sub: 'agent' }), E('-ize', ['ize', 'iz', 'ise'], 'dsuffix', 'make …', { cat: 'V', from: 'Adj/N' }),
  E('-ation', ['ation', 'ition'], 'dsuffix', 'the act of …ing', { cat: 'N', from: 'V' }), E('-ment', ['ment'], 'dsuffix', 'the result of …ing', { cat: 'N', from: 'V' }),
  E('-al', ['al'], 'dsuffix', 'relating to …', { cat: 'Adj', from: 'N' }), E('-ous', ['ous'], 'dsuffix', 'having …', { cat: 'Adj', from: 'N' }),
  E('-y', ['y', 'i'], 'dsuffix', 'characterised by …', { cat: 'Adj', from: 'N' }), E('-ive', ['ive', 'iv'], 'dsuffix', 'tending to …', { cat: 'Adj', from: 'V' }),
  E('-hood', ['hood'], 'dsuffix', 'the state of being a …', { cat: 'N', from: 'N' }), E('-ship', ['ship'], 'dsuffix', 'the status of …', { cat: 'N', from: 'N' }),
  E('-ist', ['ist'], 'dsuffix', 'one who practises …', { cat: 'N', from: 'N' }),
  // inflectional suffixes
  E('-s', ['s', 'es'], 'isuffix', 'plural (nouns) / 3rd person singular (verbs)', { cat: '' }), E('-ed', ['ed', 'd'], 'isuffix', 'past tense / past participle'), E('-ing', ['ing'], 'isuffix', 'progressive / present participle'),
  E('-er (cmp)', ['er', 'r'], 'isuffix', 'comparative (more …)'), E('-est', ['est', 'st'], 'isuffix', 'superlative (most …)'),
  // roots (free unless bound: true)
  ...[['believe', ['believ', 'believe'], 'V', 'accept as true'], ['lock', ['lock'], 'V', 'fasten with a lock'], ['happy', ['happy', 'happi'], 'Adj', 'content'], ['kind', ['kind'], 'Adj', 'caring'],
    ['govern', ['govern'], 'V', 'rule'], ['nation', ['nation'], 'N', 'a people / country'], ['form', ['form'], 'N/V', 'shape'], ['care', ['care', 'car'], 'N/V', 'concern'], ['teach', ['teach'], 'V', 'instruct'],
    ['work', ['work'], 'V/N', 'labour'], ['read', ['read'], 'V', 'read'], ['play', ['play'], 'V', 'play'], ['agree', ['agree', 'agre'], 'V', 'concur'], ['create', ['create', 'creat'], 'V', 'make'],
    ['act', ['act'], 'V/N', 'do'], ['hope', ['hope', 'hop'], 'V/N', 'wish'], ['use', ['use', 'us'], 'V/N', 'employ'], ['true', ['true', 'tru'], 'Adj', 'correct'], ['manage', ['manage', 'manag'], 'V', 'handle'],
    ['place', ['place', 'plac'], 'N/V', 'a position'], ['move', ['move', 'mov'], 'V', 'change position'], ['help', ['help'], 'V', 'assist'], ['friend', ['friend'], 'N', 'companion'], ['child', ['child'], 'N', 'young person'],
    ['book', ['book'], 'N', 'bound pages'], ['dog', ['dog'], 'N', 'canine'], ['cat', ['cat'], 'N', 'feline'], ['color', ['color', 'colour', 'colo'], 'N', 'hue'], ['tie', ['tie', 'ty'], 'V', 'knot'], ['button', ['button'], 'N/V', 'fastener'],
    ['break', ['break'], 'V', 'smash'], ['clean', ['clean'], 'Adj/V', 'free of dirt'], ['fasten', ['fasten'], 'V', 'attach'], ['sad', ['sad'], 'Adj', 'unhappy'], ['quick', ['quick'], 'Adj', 'fast'],
    ['real', ['real'], 'Adj', 'actual'], ['person', ['person'], 'N', 'human being'], ['nature', ['nature', 'natur'], 'N', 'the physical world'], ['fortune', ['fortune', 'fortun'], 'N', 'luck'], ['count', ['count'], 'V', 'enumerate'],
    ['run', ['run', 'runn'], 'V', 'move fast'], ['sing', ['sing'], 'V', 'make music with the voice'], ['jump', ['jump'], 'V', 'leap'], ['walk', ['walk'], 'V', 'step'], ['talk', ['talk'], 'V', 'speak'],
    ['berry', ['berry', 'berri'], 'N', 'small fruit'], ['replace', ['replac'], 'V', 'put back'], ['ride', ['rid', 'ride'], 'V', 'sit on and be carried'], ['sleep', ['sleep'], 'V', 'rest'],
    ['wish', ['wish'], 'V/N', 'want'], ['farm', ['farm'], 'N/V', 'land for crops'], ['cloud', ['cloud'], 'N', 'mass of vapour'], ['rain', ['rain'], 'N/V', 'water from the sky'], ['sun', ['sun', 'sunn'], 'N', 'our star'],
    ['wonder', ['wonder'], 'N/V', 'marvel'], ['real', ['real'], 'Adj', 'actual'], ['modern', ['modern'], 'Adj', 'recent'], ['special', ['special'], 'Adj', 'unusual'],
  ].map(([id, surf, cat, gloss]) => E(id, surf, 'root', gloss, { cat, free: true })),
  E('cran', ['cran'], 'root', '(no independent meaning)', { cat: 'N', free: false, bound: true }),
  E('ceive', ['ceive', 'ceiv'], 'root', '(take, only in re-ceive, de-ceive …)', { cat: 'V', free: false, bound: true }),
];
const TYPE_ORDER = { prefix: 0, root: 1, dsuffix: 2, isuffix: 3 };
export const MORPH_COLOR = { root: 'accent', prefix: 'orange', dsuffix: 'teal', isuffix: 'purple' };
export const MORPH_TYPE_NAME = { root: 'root', prefix: 'derivational prefix', dsuffix: 'derivational suffix', isuffix: 'inflectional suffix' };
/** All parses of a lower-case word as prefix* root dsuffix* isuffix? using the mini lexicon. Each parse = [{m: entry, s: surface piece}]. */
export function parseMorphs(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  const out = [];
  const rec = (rest, acc, stage) => {
    if (out.length > 12) return;
    if (!rest) { if (acc.some((p) => p.m.type === 'root')) out.push(acc); return; }
    for (const m of MORPHEMES) {
      const ord = TYPE_ORDER[m.type];
      if (ord < stage || (ord === 3 && stage === 3)) continue;
      if (m.type === 'prefix' && stage > 0) continue;
      if (m.type === 'root' && acc.some((p) => p.m.type === 'root') && stage !== 1) continue;
      for (const s of m.surf) if (rest.startsWith(s) && (m.type !== 'isuffix' && m.type !== 'dsuffix' || acc.some((p) => p.m.type === 'root'))) {
        const nstage = m.type === 'prefix' ? 0 : ord;
        rec(rest.slice(s.length), [...acc, { m, s }], nstage);
      }
    }
  };
  rec(w, [], 0);
  // fewer morphemes first; drop exact duplicates
  const seen = new Set();
  return out.filter((p) => { const k = p.map((x) => x.m.id).join('|'); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => a.length - b.length);
}

// ------------------------------------------------------------------ trees
/** node = {l: label, c?: category, col?: colour name, k?: [children], head?: true, note?: string}. Leaves sit on the bottom row. */
export function treeHeight(n) { return n.k && n.k.length ? 1 + Math.max(...n.k.map(treeHeight)) : 0; }
export function leaves(n) { return n.k && n.k.length ? n.k.flatMap(leaves) : [n]; }
/** Lay the tree out in stage coordinates: leaves evenly spaced in [x0, x1], leaf row at ybot, levels dy apart. Mutates nodes (x, y). */
export function layoutTree(t, x0, x1, ybot, dy) {
  const L = leaves(t); const step = (x1 - x0) / L.length;
  L.forEach((n, i) => { n.x = x0 + (i + 0.5) * step; });
  const go = (n) => { n.y = ybot + treeHeight(n) * dy; if (n.k && n.k.length) { n.k.forEach(go); n.x = (n.k[0].x + n.k[n.k.length - 1].x) / 2; } };
  go(t); return t;
}
/** Draw a laid-out tree: edges, category labels, leaf pills. Head edges are drawn thicker. */
export function drawTree(s, t, o = {}) {
  const edge = (n) => (n.k || []).forEach((c) => {
    s.line(n.x, n.y - 0.18, c.x, c.y + (c.k && c.k.length ? 0.18 : 0.42), { color: c.head ? (o.headColor || 'green') : 'muted', width: c.head ? 3 : 1.5 }); edge(c);
  });
  edge(t);
  const walk = (n) => {
    if (n.k && n.k.length) {
      s.text(n.c || '', n.x, n.y, { size: 14, color: 'ink', align: 'center', baseline: 'middle' });
      if (n.note) s.text(n.note, n.x + 0.5, n.y, { size: 11.5, color: n.nc || 'muted', align: 'left', baseline: 'middle' });
      n.k.forEach(walk);
    } else {
      const w = Math.max(0.5, (o.pill || 0.2) * n.l.length + 0.35), col = n.col || 'accent';
      s.rect(n.x - w / 2, n.y - 0.36, n.x + w / 2, n.y + 0.36, { fill: col, fillAlpha: 0.22, color: col, width: 1.8, radius: 7 });
      s.text(n.l, n.x, n.y, { size: 15, color: 'ink', align: 'center', baseline: 'middle' });
      if (n.c) s.text(n.c, n.x, n.y - 0.5, { size: 11.5, color: 'muted', align: 'center', baseline: 'top' });
    }
  };
  walk(t);
}
export const catalan = (n) => { let c = 1; for (let i = 0; i < n; i++) c = (c * 2 * (2 * i + 1)) / (i + 2); return Math.round(c); };
