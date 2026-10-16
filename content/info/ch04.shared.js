// Information & Coding Theory — Chapter 4: helpers shared by ch04.js, ch04-b.js and ch04-c.js (plain named exports).
// Re-exports the chapter-3 helpers (which re-export chapter 2's and chapter 1's); adds prefix-code tools
// (Kraft assignment, Huffman lengths, Sardinas–Patterson with witnesses, parse enumeration), a binary
// code-tree frame, LZ78 / KT code lengths and small bit-string utilities.
// House style: bits, log base 2; the source p is blue, entropies and success green, bounds orange, failures red.

import { clamp, sum, H, h2, KL, commas, hashStr, LET } from './ch03.shared.js';
export * from './ch03.shared.js';

export const log2 = Math.log2;
export const pw2 = (x) => Math.pow(2, x);

// ---- codes ---------------------------------------------------------------------------------------------
/** Shannon code lengths ⌈−log₂ p⌉ (0 for p = 0). */
export const shannonLens = (p) => p.map((x) => (x > 0 ? Math.ceil(-log2(x) - 1e-12) : 0));
/** Expected length Σ p_i ℓ_i. */
export const expLen = (p, l) => { let s = 0; for (let i = 0; i < p.length; i++) if (p[i] > 0) s += p[i] * l[i]; return s; };
/** Kraft sum Σ 2^{−ℓ_i}. */
export const kraft = (l) => { let s = 0; for (const x of l) s += pw2(-x); return s; };
/** Huffman codeword lengths for weights w (any positive weights; zero weights get length 0). Two-queue method. */
export function huffLens(w) {
  const n = w.length, lens = new Array(n).fill(0);
  const idx = []; for (let i = 0; i < n; i++) if (w[i] > 0) idx.push(i);
  if (idx.length === 0) return lens;
  if (idx.length === 1) { lens[idx[0]] = 1; return lens; }
  idx.sort((a, b) => w[a] - w[b]);
  const nodes = idx.map((i) => ({ w: w[i], leaf: i })); // sorted leaves queue
  const q1 = nodes, q2 = []; let a = 0, b = 0;
  const pop = () => { if (a < q1.length && (b >= q2.length || q1[a].w <= q2[b].w)) return q1[a++]; return q2[b++]; };
  let remaining = q1.length;
  while (remaining > 1) { const x = pop(), y = pop(); q2.push({ w: x.w + y.w, l: x, r: y }); remaining--; }
  const root = q2[q2.length - 1];
  const stack = [[root, 0]];
  while (stack.length) { const [nd, d] = stack.pop(); if (nd.leaf !== undefined) lens[nd.leaf] = d; else { stack.push([nd.l, d + 1], [nd.r, d + 1]); } }
  return lens;
}
/** Canonical prefix code for lengths l (in the given order of symbols): returns words (strings) or null if Kraft fails;
 *  `fail` is the index (in sorted-by-length order) of the first word that does not fit. */
export function canon(l) {
  const order = l.map((x, i) => i).filter((i) => l[i] > 0).sort((a, b) => l[a] - l[b] || a - b);
  const words = new Array(l.length).fill(''); let code = 0, prev = order.length ? l[order[0]] : 0;
  for (let k = 0; k < order.length; k++) {
    const i = order[k];
    code <<= l[i] - prev; prev = l[i];
    if (code >= (1 << l[i])) return { words, ok: false, fail: k, order };
    words[i] = code.toString(2).padStart(l[i], '0'); code++;
  }
  return { words, ok: true, fail: -1, order };
}
/** Huffman codewords for weights w. */
export const huffCode = (w) => canon(huffLens(w)).words;
export const isPrefixFree = (C) => { for (let i = 0; i < C.length; i++) for (let j = 0; j < C.length; j++) if (i !== j && C[j].startsWith(C[i])) return false; return true; };

/** Parse a comma/space separated codebook string into distinct 0/1 words (empty word removed). */
export function parseBook(str) {
  const w = String(str).split(/[\s,;]+/).map((x) => x.replace(/[^01]/g, '')).filter((x) => x.length);
  return w.slice(0, 12);
}
/** All parses of a bitstring into codewords (up to `cap`); returns {list: [[word,…]], total, partial} where total counts all parses
 *  (DP) and `partial` is the number of positions reachable as a codeword boundary. */
export function parses(book, bits, cap = 12) {
  const n = bits.length, cnt = new Array(n + 1).fill(0); cnt[n] = 1;
  for (let i = n - 1; i >= 0; i--) for (const w of book) if (w && bits.startsWith(w, i)) cnt[i] += cnt[i + w.length];
  const list = [];
  const rec = (i, acc) => {
    if (list.length >= cap) return;
    if (i === n) { list.push(acc.slice()); return; }
    for (const w of book) if (w && bits.startsWith(w, i) && cnt[i + w.length] > 0) { acc.push(w); rec(i + w.length, acc); acc.pop(); if (list.length >= cap) return; }
  };
  rec(0, []);
  return { list, total: cnt[0] };
}
/** Sardinas–Patterson. Returns {ud, rounds: [[suffixes]], witness: {text, a: [words], b: [words]} | null, loop}. */
export function sardinasPatterson(book) {
  const C = [...new Set(book)];
  const isC = new Set(C);
  const rounds = [];
  // state: suffix -> {lead: words, lag: words}
  let cur = new Map();
  for (const a of C) for (const b of C) if (a !== b && b.startsWith(a)) { const s = b.slice(a.length); if (!cur.has(s)) cur.set(s, { lead: [b], lag: [a] }); }
  const seen = new Set();
  for (let r = 0; r < 12; r++) {
    rounds.push([...cur.keys()]);
    for (const [s, st] of cur) if (isC.has(s)) { return { ud: false, rounds, witness: { a: st.lag.concat([s]), b: st.lead, text: st.lead.join('') }, loop: false }; }
    const key = [...cur.keys()].sort().join('|');
    if (cur.size === 0) return { ud: true, rounds, witness: null, loop: false };
    if (seen.has(key)) return { ud: true, rounds, witness: null, loop: true };
    seen.add(key);
    const nxt = new Map();
    for (const [s, st] of cur) {
      for (const c of C) {
        if (s.startsWith(c) && s.length > c.length) { const t = s.slice(c.length); if (!nxt.has(t)) nxt.set(t, { lead: st.lead, lag: st.lag.concat([c]) }); }
        else if (c.startsWith(s) && c.length > s.length) { const t = c.slice(s.length); if (!nxt.has(t)) nxt.set(t, { lead: st.lag.concat([c]), lag: st.lead }); }
      }
    }
    cur = nxt;
  }
  return { ud: true, rounds, witness: null, loop: true };
}
export const PRESETS = {
  prefix: '0, 10, 110, 111',
  suffix: '0, 01, 11',
  ud: '0, 01, 011, 111',
  amb: '0, 01, 10',
  amb2: '1, 10, 01, 011',
  sing: '0, 0, 10',
};

// ---- binary tree frame -------------------------------------------------------------------------------------
/** Node centre of the complete binary tree of depth D drawn with leaves spread over x ∈ [0,1] and the root on top (y = 0, depth d at −d). */
export const nodeX = (depth, idx, D) => (idx + 0.5) / pw2(depth);
export const nodeY = (depth) => -depth;
/** Draw the complete binary tree down to depth D; `word` colours/labels come from callbacks. Edges are labelled 0 (left) / 1 (right). */
export function drawTree(s, D, { nodeFn, edgeFn } = {}) {
  for (let d = 0; d < D; d++) for (let i = 0; i < (1 << d); i++) {
    const x = nodeX(d, i, D), y = nodeY(d);
    for (const b of [0, 1]) {
      const cx = nodeX(d + 1, 2 * i + b, D), cy = nodeY(d + 1), st = edgeFn ? edgeFn(d + 1, 2 * i + b) : null;
      s.line(x, y, cx, cy, { color: st?.color || 'faint', width: st?.width || 1, alpha: st?.alpha ?? 0.8 });
    }
  }
  if (nodeFn) for (let d = 0; d <= D; d++) for (let i = 0; i < (1 << d); i++) nodeFn(d, i, nodeX(d, i, D), nodeY(d));
}

// ---- adaptive models and LZ -----------------------------------------------------------------------------------
/** Ideal code length (bits) of a binary string under the Krichevsky–Trofimov sequential estimator (the arithmetic-coding cost, up to 2 bits). */
export function ktBits(bits) {
  let n0 = 0, n1 = 0, L = 0;
  for (let i = 0; i < bits.length; i++) {
    const b = bits[i], p1 = (n1 + 0.5) / (n0 + n1 + 1);
    L -= log2(b ? p1 : 1 - p1); if (b) n1++; else n0++;
  }
  return L;
}
/** LZ78 parse of an array/string of symbols: phrases [{parent, ch}] (parent index into the list, 0 = empty). */
export function lz78(seq) {
  const trie = new Map(); const phrases = []; let node = 0, start = 0;
  const n = seq.length;
  for (let i = 0; i < n; i++) {
    const key = node * 4096 + (typeof seq[i] === 'number' ? seq[i] : seq.charCodeAt(i));
    const nx = trie.get(key);
    if (nx !== undefined && i < n - 1) { node = nx; continue; }
    if (nx !== undefined) { phrases.push({ parent: node, ch: seq[i], from: start, to: i + 1, partial: true }); break; }
    phrases.push({ parent: node, ch: seq[i], from: start, to: i + 1 });
    trie.set(key, phrases.length); node = 0; start = i + 1;
  }
  return phrases;
}
/** LZ78 code length in bits for c phrases over an alphabet of size a: Σ_{j=1..c} (⌈log₂ j⌉ + ⌈log₂ a⌉). */
export function lz78Bits(c, a) { let s = 0; const la = Math.ceil(log2(a)); for (let j = 1; j <= c; j++) s += Math.ceil(log2(j)) + la; return s; }
/** Entropy rate (bits) of the two-state Markov chain that flips 0→1 with probability a and 1→0 with probability b. */
export function markovRate(a, b) { const s = a + b; if (s <= 0) return 0; return (b / s) * h2(a) + (a / s) * h2(b); }
/** Sample n bits from the two-state chain (flip probabilities a: 0→1, b: 1→0), starting from the stationary law. */
export function markovBits(n, a, b, r) {
  const x = new Uint8Array(n); let s = r() < (a + b > 0 ? a / (a + b) : 0.5) ? 1 : 0;
  for (let i = 0; i < n; i++) { x[i] = s; s = s ? (r() < b ? 0 : 1) : (r() < a ? 1 : 0); }
  return x;
}
export const bitsStr = (x) => { let s = ''; for (const b of x) s += b ? '1' : '0'; return s; };
/** Binary expansion helper: first k bits of the fraction f ∈ [0,1) as a string. */
export function fracBits(f, k) { let s = ''; for (let i = 0; i < k; i++) { f *= 2; if (f >= 1) { s += '1'; f -= 1; } else s += '0'; } return s; }

/** Canvas monospace text with optional per-character colours (palette names). Returns the character width in pixels. */
export function mono(v, st, str, x, y, { size = 13, color = 'ink', colors = null, w = 500, align = 'left' } = {}) {
  const c = st.ctx; c.save(); c.font = `${w} ${size}px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`; c.textBaseline = 'middle'; c.textAlign = 'left';
  const cw = c.measureText('M').width; let X0 = st.X(x); if (align === 'center') X0 -= (str.length * cw) / 2; else if (align === 'right') X0 -= str.length * cw;
  const Y = st.Y(y);
  for (let i = 0; i < str.length; i++) { c.fillStyle = v.color((colors && colors[i]) || color); c.fillText(str[i], X0 + i * cw, Y); }
  c.restore(); return cw;
}
