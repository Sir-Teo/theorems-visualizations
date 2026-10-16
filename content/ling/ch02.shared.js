// Linguistics — Chapter 2 shared helpers: a small distinctive-feature system for English-like segments,
// a rewrite-rule engine (A → B / C __ D), an ASCII respelling → phoneme converter, and a syllabifier.
// Everything here is a *teaching* system: the feature values are simplified (see 2.3's caption).

export const FEATS = ['syl', 'cons', 'son', 'cont', 'nas', 'voi', 'lab', 'cor', 'dor', 'ant', 'strid', 'lat', 'hi', 'lo', 'bk', 'rd', 'tns'];
export const FEAT_NAME = {
  syl: 'syllabic', cons: 'consonantal', son: 'sonorant', cont: 'continuant', nas: 'nasal', voi: 'voiced', lab: 'labial', cor: 'coronal',
  dor: 'dorsal', ant: 'anterior', strid: 'strident', lat: 'lateral', hi: 'high', lo: 'low', bk: 'back', rd: 'round', tns: 'tense', str: 'stressed',
};
const MINUS = '−';
export const sgn = (c) => (c === '-' ? MINUS : c === '+' ? '+' : '0');

function mk(sym, spec, extra = {}) {
  const f = {}; for (const k of FEATS) f[k] = '-';
  const set = {};
  for (const t of spec.split(/\s+/).filter(Boolean)) set[t.slice(1)] = t[0];
  Object.assign(f, set);
  if (f.cor !== '+' && !('ant' in set)) f.ant = '0';
  if (f.dor !== '+') for (const k of ['hi', 'lo', 'bk', 'rd']) if (!(k in set)) f[k] = '0';
  if (!('tns' in set)) f.tns = f.syl === '+' ? '-' : '0';
  return { s: sym, f, ...extra };
}
const V = '+syl +son +cont +voi +dor ';
const CONS = [
  ['p', '+cons +lab'], ['b', '+cons +lab +voi'], ['t', '+cons +cor +ant'], ['d', '+cons +cor +ant +voi'],
  ['k', '+cons +dor +hi +bk'], ['g', '+cons +dor +hi +bk +voi'], ['ʔ', ''],
  ['tʃ', '+cons +cor -ant +strid'], ['dʒ', '+cons +cor -ant +strid +voi'],
  ['f', '+cons +cont +lab'], ['v', '+cons +cont +lab +voi'], ['θ', '+cons +cont +cor +ant'], ['ð', '+cons +cont +cor +ant +voi'],
  ['s', '+cons +cont +cor +ant +strid'], ['z', '+cons +cont +cor +ant +strid +voi'],
  ['ʃ', '+cons +cont +cor -ant +strid'], ['ʒ', '+cons +cont +cor -ant +strid +voi'], ['h', '+cont'],
  ['m', '+cons +son +nas +voi +lab'], ['n', '+cons +son +nas +voi +cor +ant'], ['ŋ', '+cons +son +nas +voi +dor +hi +bk'],
  ['l', '+cons +son +cont +voi +cor +ant +lat'], ['ɹ', '+cons +son +cont +voi +cor -ant'], ['ɾ', '+cons +son +voi +cor +ant'],
  ['j', '+son +cont +voi +dor +hi'], ['w', '+son +cont +voi +lab +dor +hi +bk +rd'],
  ['ɫ', '+cons +son +cont +voi +cor +ant +lat +dor +hi +bk'],
];
const VOW = [
  ['i', '+hi +tns'], ['ɪ', '+hi'], ['e', '+tns'], ['ɛ', ''], ['æ', '+lo'], ['a', '+lo +tns'], ['ɑ', '+lo +bk'], ['ʌ', '+bk'],
  ['ɔ', '+bk +rd'], ['o', '+bk +rd +tns'], ['ʊ', '+hi +bk +rd'], ['u', '+hi +bk +rd +tns'], ['ə', '0bk'], ['ɚ', '+cor 0bk'],
];
export const SEG = {};
for (const [s, sp] of CONS) SEG[s] = mk(s, sp);
for (const [s, sp] of VOW) SEG[s] = mk(s, V + sp);
for (const [d, b] of [['aɪ', 'a'], ['aʊ', 'a'], ['eɪ', 'e'], ['oʊ', 'o'], ['ɔɪ', 'ɔ'], ['ʌɪ', 'ʌ']]) SEG[d] = { s: d, f: { ...SEG[b].f }, dip: true };
/** Segments that appear in the feature chart of 2.3 and 2.4, in rows. */
export const CHART_ROWS = [
  ['stops', 'p b t d k g ʔ'], ['affricates', 'tʃ dʒ'], ['fricatives', 'f v θ ð s z ʃ ʒ h'], ['nasals', 'm n ŋ'],
  ['liquids, glides', 'l ɹ ɾ j w'], ['vowels (front, central)', 'i ɪ e ɛ æ ə'], ['vowels (low, back)', 'a ʌ ɑ ɔ o ʊ u'],
].map(([name, syms]) => [name, syms.split(' ')]);
export const CHART_SYMS = CHART_ROWS.flatMap((r) => r[1]);
export const isVowel = (s) => SEG[s]?.f.syl === '+';
const strip = (s) => s.replace(/[̥̃ʰ̚]/g, '');

// ------------------------------------------------------------------ words, features, specs
/** 'ɹ ˈaɪ t ɚ' → tokens {s, str}. A leading ˈ marks the stressed vowel. */
export function parseWord(src) {
  return src.trim().split(/\s+/).map((t) => (t.startsWith('ˈ') ? { s: t.slice(1), str: true } : { s: t, str: false }));
}
export function showWord(w, o = {}) { return w.map((t) => (t.str && o.stress !== false ? 'ˈ' : '') + t.s).join(''); }
/** Feature values of a token (with the pseudo-feature str); diacritics ̃ (nasalised) and ̥ (voiceless) are honoured. */
export function feats(t) {
  const b = SEG[strip(t.s)]; const f = { ...(b ? b.f : {}) };
  if (t.s.includes('̃')) f.nas = '+';
  if (t.s.includes('̥')) f.voi = '-';
  f.str = t.str ? '+' : '-';
  return f;
}
/** The segment whose feature values equal f (diphthong status preserved), or null. */
export function findSym(f, dip = false) {
  for (const s in SEG) { const g = SEG[s]; if (!!g.dip === dip && FEATS.every((k) => g.f[k] === f[k])) return s; }
  return null;
}
/** Parse a rule element: '[+voi -son]', 'V', 'C', 'ˈV', '#', or a symbol (alternatives separated by |). */
export function parseSpec(src) {
  if (src === '#') return { boundary: true };
  if (src === 'V') src = '[+syl]'; else if (src === 'C') src = '[-syl]'; else if (src === 'ˈV') src = '[+syl +str]';
  if (src[0] === '[') {
    const req = src.slice(1, -1).trim().split(/\s+/).map((t) => [t.slice(1), t[0]]);
    return { test: (t) => { const f = feats(t); return req.every(([k, v]) => f[k] === v); } };
  }
  const alts = src.split('|');
  return { test: (t) => alts.includes(t.s) };
}
/** Pretty TeX for a spec: [+voi -son] → feature column; a symbol → itself. */
export function specTeX(src) {
  if (src === '∅') return '\\varnothing';
  if (src === '#') return '\\#';
  if (src === 'V' || src === 'C') return src === 'V' ? '\\mathrm{V}' : '\\mathrm{C}';
  if (src === 'ˈV') return '\\acute{\\mathrm{V}}';
  if (src[0] === '[') {
    const parts = src.slice(1, -1).trim().split(/\s+/).map((t) => `${t[0] === '-' ? '-' : t[0]}\\text{${t.slice(1)}}`);
    return parts.length === 1 ? `[${parts[0]}]` : `\\begin{bmatrix}${parts.join('\\\\')}\\end{bmatrix}`;
  }
  return `\\text{/${src}/}`;
}
/** Natural-language label for a spec, e.g. '[+voi -son]' → '[+voi, −son]'. */
export function specText(src) {
  if (src[0] !== '[') return src;
  return '[' + src.slice(1, -1).trim().split(/\s+/).map((t) => sgn(t[0]) + t.slice(1)).join(', ') + ']';
}

function changeFeatures(t, B) {
  const f = feats(t);
  for (const c of B.slice(1, -1).trim().split(/\s+/)) f[c.slice(1)] = c[0];
  const dip = !!SEG[strip(t.s)]?.dip;
  let s = findSym(f, dip);
  if (!s) {
    s = strip(t.s);
    if (f.nas === '+' && SEG[s]?.f.nas !== '+') s += '̃';
    if (f.voi === '-' && SEG[s]?.f.voi === '+') s += '̥';
    else if (f.nas === '+' && t.s.includes('̃')) { /* keep */ }
  }
  return { s, str: t.str };
}
function rewrite(t, B, w, i) {
  if (B === '∅') return null;
  if (typeof B === 'function') return { s: B(t, w[i - 1], w[i + 1]), str: t.str };
  if (B[0] === '[') return changeFeatures(t, B);
  return { s: B, str: t.str };
}
/**
 * Apply a rewrite rule {A, B, L, R} simultaneously to every site of the word (left to right on the input).
 * A: spec or '∅' (insertion). B: feature change '[−voi]', a symbol, '∅' (deletion) or a function (t, left, right) → symbol.
 * L, R: arrays of specs. Returns {out, hits} with hits = [{i (index in out or in input for deletions), kind, from, to}].
 */
export function applyRule(word, rule) {
  const A = rule.A === '∅' ? null : parseSpec(rule.A);
  const L = (rule.L || []).map(parseSpec), R = (rule.R || []).map(parseSpec), n = word.length;
  const okL = (i) => { let p = i - 1; for (let k = L.length - 1; k >= 0; k--, p--) { const q = L[k]; if (q.boundary ? p >= 0 : !(p >= 0 && q.test(word[p]))) return false; } return true; };
  const okR = (i) => { let p = i; for (let k = 0; k < R.length; k++, p++) { const q = R[k]; if (q.boundary ? p < n : !(p < n && q.test(word[p]))) return false; } return true; };
  const out = [], hits = [];
  for (let i = 0; i <= n; i++) {
    if (A === null) {
      if (okL(i) && okR(i)) { out.push({ s: rule.B, str: false, ins: true }); hits.push({ i: out.length - 1, kind: 'ins', to: rule.B }); }
      if (i < n) out.push(word[i]);
    } else if (i < n) {
      const t = word[i];
      if (A.test(t) && okL(i) && okR(i + 1)) {
        const r = rewrite(t, rule.B, word, i);
        if (r === null) hits.push({ i, kind: 'del', from: t.s });
        else if (r.s !== t.s) { out.push({ ...r, chg: true }); hits.push({ i: out.length - 1, kind: 'chg', from: t.s, to: r.s }); }
        else out.push(t);
      } else out.push(t);
    }
  }
  return { out, hits };
}
/** Number of sites at which the rule would apply (does not rewrite). */
export function sites(word, rule) { return applyRule(word, rule).hits.length; }

// ------------------------------------------------------------------ respelling and syllables
const RESPELL_MULTI = {
  air: ['ɛ', 'ɹ'], ear: ['ɪ', 'ɹ'], ch: ['tʃ'], sh: ['ʃ'], zh: ['ʒ'], th: ['θ'], dh: ['ð'], ng: ['ŋ'], ee: ['i'], oo: ['u'], ay: ['eɪ'],
  ie: ['aɪ'], ow: ['aʊ'], oy: ['ɔɪ'], oh: ['oʊ'], aw: ['ɔ'], uh: ['ə'], er: ['ɚ'], ar: ['ɑ', 'ɹ'], or: ['ɔ', 'ɹ'],
};
const RESPELL_ONE = { a: 'æ', e: 'ɛ', i: 'ɪ', o: 'ɑ', u: 'ʌ', j: 'dʒ', y: 'j', r: 'ɹ', c: 'k', q: 'k', b: 'b', d: 'd', f: 'f', g: 'g', h: 'h', k: 'k', l: 'l', m: 'm', n: 'n', p: 'p', s: 's', t: 't', v: 'v', w: 'w', z: 'z' };
/** Simple ASCII respelling → phoneme symbols (a e i o u = æ ɛ ɪ ɑ ʌ; ee oo ay ie ow oh aw = i u eɪ aɪ aʊ oʊ ɔ; j = dʒ; y = j; r = ɹ). IPA symbols pass through. */
export function respell(src) {
  const out = []; const s = src.toLowerCase().replace(/[^a-zʔɹɾŋθðʃʒɪɛæʌɑɔʊəɚ]/g, '');
  for (let i = 0; i < s.length;) {
    let hit = false;
    for (const len of [3, 2]) { const m = RESPELL_MULTI[s.slice(i, i + len)]; if (m && s.length >= i + len) { out.push(...m); i += len; hit = true; break; } }
    if (hit) continue;
    const c = s[i++];
    if (c === 'x') out.push('k', 's'); else if (RESPELL_ONE[c]) out.push(RESPELL_ONE[c]); else if (SEG[c]) out.push(c);
  }
  return out;
}

/** The sonority scale used in this chapter (see 2.10). */
export function sonority(sym) {
  const g = SEG[strip(sym)]; if (!g) return 0; const f = g.f;
  if (f.syl === '+') return f.lo === '+' ? 11 : f.hi === '+' ? 9 : 10;
  if (f.son === '+') return f.nas === '+' ? 5 : f.lat === '+' ? 6 : f.cons === '-' ? 8 : f.cor === '+' && f.ant === '-' ? 7 : 6;
  if (f.cont === '+') return sym === 'h' ? 3 : f.voi === '+' ? 4 : 3;
  return f.voi === '+' ? 2 : 1;
}
export const SON_NAMES = { 1: 'voiceless stop', 2: 'voiced stop', 3: 'voiceless fricative', 4: 'voiced fricative', 5: 'nasal', 6: 'lateral / flap', 7: 'rhotic', 8: 'glide', 9: 'high vowel', 10: 'mid vowel', 11: 'low vowel' };

/** Onset clusters of English (a standard textbook inventory; Gen. Am. j-onsets included). */
const ONSETS2 = 'pl bl kl gl fl sl pɹ bɹ tɹ dɹ kɹ gɹ fɹ θɹ ʃɹ tw dw kw gw θw sw sp st sk sm sn pj bj tj dj kj gj fj vj mj nj hj sj zj θj lj'.split(' ');
const ONSETS3 = 'spl spɹ stɹ skɹ skw skl spj stj skj smj snj'.split(' ');
export const LEGAL_ONSETS = new Set(['', ...'p b t d k g f v θ ð s z ʃ h tʃ dʒ m n l ɹ j w'.split(' '), ...ONSETS2, ...ONSETS3]);
const LAX = new Set(['ɪ', 'ɛ', 'æ', 'ʌ', 'ʊ', 'ə', 'ɑ']);
/**
 * Split phoneme symbols into syllables {on, nu, co}. strategy 'onset': maximal legal onset (a medial cluster gives the
 * longest legal suffix to the next onset). 'coda': as 'onset', but a stressed lax vowel keeps one following consonant
 * as a coda (the stressed syllable must be heavy). `stress` is the index of the stressed syllable.
 */
export function syllabify(syms, strategy = 'onset', stress = 0) {
  const nuc = []; syms.forEach((s, i) => { if (isVowel(s)) nuc.push(i); });
  if (!nuc.length) return [{ on: syms.slice(), nu: [], co: [] }];
  const syl = nuc.map((i) => ({ on: [], nu: [syms[i]], co: [] }));
  syl[0].on = syms.slice(0, nuc[0]);
  syl[syl.length - 1].co = syms.slice(nuc[nuc.length - 1] + 1);
  for (let k = 0; k + 1 < nuc.length; k++) {
    const cl = syms.slice(nuc[k] + 1, nuc[k + 1]);
    let j = 0; while (j < cl.length && !LEGAL_ONSETS.has(cl.slice(j).join(''))) j++;
    syl[k].co = cl.slice(0, j); syl[k + 1].on = cl.slice(j);
  }
  if (strategy === 'coda') {
    const k = Math.min(stress, syl.length - 2);
    if (k >= 0 && syl.length > 1 && LAX.has(syl[k].nu[0]) && !syl[k].co.length && syl[k + 1].on.length) syl[k].co = [syl[k + 1].on.shift()];
  }
  return syl;
}
export const sylText = (s) => [...s.on, ...s.nu, ...s.co].join('');

// ------------------------------------------------------------------ the segment chart used by 2.3 and 2.4
/** Positions of the symbols of CHART_ROWS on a stage with x ∈ [0, 11], y ∈ [0, rows]; returns {pos, rows, w, h}. */
export function chartLayout() {
  const pos = {}; const rows = CHART_ROWS.length;
  CHART_ROWS.forEach(([, syms], r) => syms.forEach((s, k) => { pos[s] = [2.3 + k + 0.5, rows - r - 0.5]; }));
  return { pos, rows, w: 11.4, h: rows };
}
export function chartSymAt(L, x, y) {
  let best = null, bd = 0.55;
  for (const s in L.pos) { const d = Math.hypot(L.pos[s][0] - x, (L.pos[s][1] - y) * 1.1); if (d < bd) { bd = d; best = s; } }
  return best;
}
/** Draw the chart. state(sym) → 'on' | 'off' | 'sel'; sel draws an accent plate. */
export function drawChart(s, L, state, o = {}) {
  CHART_ROWS.forEach(([name], r) => s.text(name, 0.1, L.rows - r - 0.5, { size: 10.5, color: 'muted', align: 'left', baseline: 'middle' }));
  for (const sym in L.pos) {
    const [x, y] = L.pos[sym], st = state(sym);
    if (st === 'on') s.rect(x - 0.44, y - 0.4, x + 0.44, y + 0.4, { fill: o.color || 'accent', fillAlpha: 0.28, color: o.color || 'accent', width: 1.5, radius: 5 });
    else if (st === 'sel') s.rect(x - 0.44, y - 0.4, x + 0.44, y + 0.4, { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 2, radius: 5 });
    s.text(sym, x, y, { size: 17, color: st === 'off' ? 'faint' : 'ink', align: 'center', baseline: 'middle' });
  }
}

// ------------------------------------------------------------------ small utilities
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
/** Number of differing feature values between two segment symbols (unspecified 0 values never count; aspirated ʰ counts as one more difference). */
export function segDistance(a, b) {
  const sa = SEG[strip(a)], sb = SEG[strip(b)]; if (!sa || !sb) return 99;
  let d = 0; for (const k of FEATS) if (sa.f[k] !== sb.f[k] && sa.f[k] !== '0' && sb.f[k] !== '0') d++;
  d += (a.includes('ʰ') ? 1 : 0) !== (b.includes('ʰ') ? 1 : 0) ? 1 : 0;
  return d;
}
