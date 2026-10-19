// Theory of Computation — Chapter 4: helpers shared by ch04.js, ch04-b.js and ch04-c.js (plain named exports).
// Re-exports the Chapter 3 helpers (which re-export Chapter 2's: DFA structure, pen, keypad, tape, graph drawing, NFAs, subset construction).
import { upTo, texName, nfa, closure, move, hasAcc, run } from './ch03.shared.js';
export * from './ch03.shared.js';

// ---------------------------------------------------------------- small languages over {0,1} (membership predicates)
export const isPrimeN = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
export const count = (w, c) => { let k = 0; for (const x of w) if (x === c) k++; return k; };
/** Languages used by the pumping and Myhill–Nerode items: mem(w), whether regular, and the minimal DFA size when it is (complete DFA, dead state included). */
export const LANGS = {
  zn1n: { name: '0ⁿ1ⁿ', tex: '\\{0^n1^n : n\\ge0\\}', reg: false, mem: (w) => /^0*1*$/.test(w) && count(w, '0') === count(w, '1') },
  pal: { name: 'palindromes', tex: '\\{w : w=w^R\\}', reg: false, mem: (w) => w === [...w].reverse().join('') },
  ww: { name: 'squares ww', tex: '\\{ww\\}', reg: false, mem: (w) => w.length % 2 === 0 && w.slice(0, w.length / 2) === w.slice(w.length / 2) },
  eq: { name: 'equal numbers of 0 and 1', tex: '\\{w : \\#_0(w)=\\#_1(w)\\}', reg: false, mem: (w) => count(w, '0') === count(w, '1') },
  prime: { name: '0ᵖ, p prime', tex: '\\{0^p : p\\text{ prime}\\}', reg: false, mem: (w) => /^0*$/.test(w) && isPrimeN(w.length) },
  even0: { name: 'even number of 0s', tex: '\\{w : \\#_0(w)\\text{ even}\\}', reg: true, size: 2, mem: (w) => count(w, '0') % 2 === 0 },
  ends01: { name: 'ends in 01', tex: '\\{w : w\\text{ ends in }01\\}', reg: true, size: 3, mem: (w) => w.endsWith('01') },
  mod3: { name: 'number of 1s divisible by 3', tex: '\\{w : 3\\mid\\#_1(w)\\}', reg: true, size: 3, mem: (w) => count(w, '1') % 3 === 0 },
  div3: { name: 'binary value divisible by 3', tex: '\\{w : (w)_2\\equiv0 \\pmod 3\\}', reg: true, size: 3, mem: (w) => { let r = 0; for (const c of w) r = (2 * r + +c) % 3; return r === 0; } },
  has011: { name: 'contains 011', tex: '\\{w : 011\\text{ is a substring}\\}', reg: true, size: 4, mem: (w) => w.includes('011') },
  third1: { name: '3rd symbol from the end is 1', tex: '\\{w : w_{|w|-2}=1\\}', reg: true, size: 8, mem: (w) => w.length >= 3 && w[w.length - 3] === '1' },
};
export const BIN = ['0', '1'];

// ---------------------------------------------------------------- Myhill–Nerode machinery (suffix tests up to a bound)
/** Membership pattern of x on all suffixes z in `sufs`: a 0/1 string. */
export function signature(mem, x, sufs) { let s = ''; for (const z of sufs) s += mem(x + z) ? '1' : '0'; return s; }
/** Shortest (shortlex-first) suffix z with exactly one of xz, yz in the language, or null if none of length ≤ S. */
export function sepSuffix(mem, alpha, x, y, S) { for (const z of upTo(alpha, S)) if (mem(x + z) !== mem(y + z)) return z; return null; }
/** Sort all prefixes of length ≤ L into classes by their pattern on suffixes of length ≤ S.
 *  → { classes: [{sig, rep, members}], of: Map(prefix → class index), counts[k] = number of classes met by prefixes of length ≤ k } */
export function classify(mem, alpha, L, S) {
  const sufs = upTo(alpha, S), classes = [], idx = new Map(), of = new Map(), counts = [];
  let k0 = 0;
  for (const x of upTo(alpha, L)) {
    const g = signature(mem, x, sufs);
    if (!idx.has(g)) { idx.set(g, classes.length); classes.push({ sig: g, rep: x, members: [] }); }
    classes[idx.get(g)].members.push(x); of.set(x, idx.get(g));
    counts[x.length] = classes.length; k0 = x.length;
  }
  for (let k = 1; k <= k0; k++) if (counts[k] == null) counts[k] = counts[k - 1];
  return { classes, of, counts, sufs, idx };
}

// ---------------------------------------------------------------- DFA utilities (complete or partial DFAs in the dfa() shape)
export const succ = (D, q, c) => D.delta[q]?.[c]?.[0];
export const stateOf = (D, id) => D.states.find((s) => s.id === id);
/** Copy of D keeping only the states reachable from the start (same state objects). */
export function reachableD(D) {
  const seen = new Set([D.start]), st = [D.start];
  while (st.length) { const u = st.pop(); for (const c of D.alpha) for (const t of D.delta[u]?.[c] || []) if (!seen.has(t)) { seen.add(t); st.push(t); } }
  const delta = {}; for (const q of seen) delta[q] = D.delta[q];
  return { ...D, states: D.states.filter((s) => seen.has(s.id)), delta };
}
/** Number the states 0, 1, … in breadth-first order (alphabet order) from the start; the numbering is canonical for isomorphic DFAs. */
export function relabel(D, prefix = 'q') {
  const order = [D.start], idx = { [D.start]: 0 };
  for (let h = 0; h < order.length; h++) for (const c of D.alpha) { const t = succ(D, order[h], c); if (t != null && !(t in idx)) { idx[t] = order.length; order.push(t); } }
  const states = order.map((q, i) => ({ id: prefix + i, x: 0, y: 0, acc: !!stateOf(D, q).acc, label: texName(prefix + i), orig: q, set: stateOf(D, q).set, of: stateOf(D, q).of }));
  const delta = {};
  order.forEach((q, i) => { delta[prefix + i] = {}; for (const c of D.alpha) { const t = succ(D, q, c); delta[prefix + i][c] = t == null ? [] : [prefix + idx[t]]; } });
  return { alpha: D.alpha, start: prefix + '0', states, delta };
}
/** A string that is equal for two DFAs exactly when they are isomorphic (as reachable DFAs). */
export function canon(D) {
  const R = relabel(D);
  return R.states.map((s) => (s.acc ? '*' : '') + D.alpha.map((c) => (R.delta[s.id][c][0] ?? '-')).join(',')).join(' | ');
}
/** Remove the states from which no accepting state can be reached (the dead state of a complete DFA). */
export function trimDead(D) {
  const good = new Set(D.states.filter((s) => s.acc).map((s) => s.id));
  for (let ch = true; ch;) { ch = false; for (const s of D.states) if (!good.has(s.id)) for (const c of D.alpha) if (good.has(succ(D, s.id, c))) { good.add(s.id); ch = true; break; } }
  const delta = {}; for (const s of D.states) if (good.has(s.id)) { delta[s.id] = {}; for (const c of D.alpha) delta[s.id][c] = (D.delta[s.id][c] || []).filter((t) => good.has(t)); }
  return { ...D, states: D.states.filter((s) => good.has(s.id)), delta };
}
/** Moore's partition refinement on a complete DFA: rounds[r] = {cls: {id: block}, n: number of blocks, sig: {id: signature string}} (round 0 = accepting / rejecting). */
export function moore(D) {
  const ids = D.states.map((s) => s.id), number = (keyOf) => { const m = new Map(), cls = {}, sig = {}; for (const q of ids) { const k = keyOf(q); if (!m.has(k)) m.set(k, m.size); cls[q] = m.get(k); sig[q] = k; } return { cls, n: m.size, sig }; };
  const rounds = [number((q) => (stateOf(D, q).acc ? 'F' : 'N'))];
  for (;;) {
    const prev = rounds[rounds.length - 1].cls, nx = number((q) => prev[q] + '|' + D.alpha.map((c) => prev[succ(D, q, c)]).join(','));
    if (nx.n === rounds[rounds.length - 1].n) return rounds;
    rounds.push(nx);
  }
}
/** The quotient DFA of a (reachable, complete) DFA by a block assignment cls, numbered canonically; each state remembers its member ids in `members`. */
export function quotient(D, cls) {
  const first = {}, members = {};
  for (const s of D.states) { const b = cls[s.id]; if (!(b in first)) first[b] = s.id; (members[b] ||= []).push(s.id); }
  const states = Object.keys(first).map((b) => ({ id: 'b' + b, x: 0, y: 0, acc: !!stateOf(D, first[b]).acc, label: '' })), delta = {};
  for (const b of Object.keys(first)) { delta['b' + b] = {}; for (const c of D.alpha) delta['b' + b][c] = ['b' + cls[succ(D, first[b], c)]]; }
  const R = relabel({ alpha: D.alpha, start: 'b' + cls[D.start], states, delta });
  for (const s of R.states) s.members = members[+s.orig.slice(1)];
  return R;
}
/** Complete minimal DFA of a complete DFA (reachable part, Moore, canonical numbering). */
export function minimize(D, upTo_ = Infinity) {
  const Rd = reachableD(D), rounds = moore(Rd), r = rounds[Math.min(rounds.length - 1, upTo_)];
  return { M: quotient(Rd, r.cls), rounds, reach: Rd };
}
/** Number the states of D along BFS layers and lay them out in a W×H box (x grows with the distance from the start). */
export function layoutBFS(D, W = 10, H = 7, m = 1.15) {
  const nbr = (q) => [...new Set([...D.alpha.flatMap((c) => D.delta[q]?.[c] || []), ...(D.eps?.[q] || [])])];
  const depth = { [D.start]: 0 }, order = [D.start];
  for (let h = 0; h < order.length; h++) for (const t of nbr(order[h])) if (!(t in depth)) { depth[t] = depth[order[h]] + 1; order.push(t); }
  const extra = D.states.filter((s) => !(s.id in depth)); let top = Math.max(...Object.values(depth)) + (extra.length ? 1 : 0);
  for (const s of extra) depth[s.id] = top;
  const layers = []; for (const s of D.states) (layers[depth[s.id]] ||= []).push(s);
  const L = layers.length;
  layers.forEach((col, i) => col.forEach((s, j) => {
    s.x = L === 1 ? W / 2 : m + (i * (W - 2 * m)) / (L - 1);
    const my = Math.max(m, H * 0.2);
    s.y = col.length === 1 ? H / 2 : my + (j * (H - 2 * my)) / (col.length - 1);
  }));
  if (D.alpha.some((c) => (D.delta[D.start]?.[c] || []).includes(D.start))) D.loops = { ...(D.loops || {}), [D.start]: 90 };
  return D;
}
/** Evenly spaced on an ellipse, state 0 at the left. */
export function layoutCircle(D, W = 10, H = 7, m = 1.1) {
  const n = D.states.length;
  D.states.forEach((s, i) => { const a = Math.PI + (2 * Math.PI * i) / n; s.x = W / 2 + (W / 2 - m) * Math.cos(a); s.y = H / 2 + (H / 2 - m * 0.8) * Math.sin(a); });
  return D;
}
/** Reverse of a DFA/NFA as an NFA: every arrow turned around, old accepting states reached by ε from a new start 'z', old start accepting. */
export function reverseN(M) {
  const rd = {}, re = {}, ids = M.states.map((s) => s.id);
  for (const q of ids) { rd[q] = {}; re[q] = []; }
  for (const q of ids) {
    for (const c of M.alpha) for (const t of M.delta[q]?.[c] || []) (rd[t][c] ||= []).push(q);
    for (const t of M.eps?.[q] || []) re[t].push(q);
  }
  let z = 'z'; while (ids.includes(z)) z += '_';
  re[z] = M.states.filter((s) => s.acc).map((s) => s.id);
  const N = nfa(M.alpha, [...M.states.map((s) => [s.id, s.x, s.y, s.id === M.start, s.label]), [z, 0, 0, false, '$\\ast$']], z, { ...rd, [z]: {} }, re);
  N.reverseStart = z;
  return N;
}
/** Accessible subset construction, empty set omitted (partial DFA), the artificial start of reverseN left out of every subset; states renamed q0, q1, … in BFS order, each remembering its subset in `set`. */
export function detRename(N) {
  const drop = (S) => S.filter((q) => q !== N.reverseStart), key = (S) => S.join(','), ids = new Map(), list = [];
  const add = (S) => { const k = key(S); if (!ids.has(k)) { ids.set(k, list.length); list.push(S); } return ids.get(k); };
  add(drop(closure(N, [N.start])));
  const delta = {};
  for (let h = 0; h < list.length; h++) {
    delta['S' + h] = {};
    for (const c of N.alpha) { const T = drop(closure(N, move(N, list[h], c))); delta['S' + h][c] = T.length ? ['S' + add(T)] : []; }
  }
  const states = list.map((S, i) => ({ id: 'S' + i, x: 0, y: 0, acc: hasAcc(N, S), set: S, label: '' }));
  return relabel({ alpha: N.alpha, start: 'S0', states, delta });
}
/** The words of length ≤ n that the complete-or-partial DFA accepts. */
export function langDFA(D, n) {
  const out = new Set();
  for (const w of upTo(D.alpha, n)) { let q = D.start; for (const c of w) { q = succ(D, q, c); if (q == null) break; } if (q != null && stateOf(D, q).acc) out.add(w); }
  return out;
}
const hs = (...a) => { let h = 2166136261; for (const x of a) { h ^= (x + 0x9e3779b9) | 0; h = Math.imul(h, 16777619); h ^= h >>> 13; } return h >>> 0; };
/** An equivalent but redundant DFA: every state of `base` is split into k copies, copies wired pseudo-randomly (by seed); only reachable copies kept. */
export function bloat(base, k, seed) {
  const ids = base.states.map((s) => s.id), cp = [];
  ids.forEach((q, qi) => { for (let j = 0; j < k; j++) cp.push({ q, j, key: hs(seed, qi, j, 7) }); });
  cp.sort((a, b) => a.key - b.key); const name = {}; cp.forEach((c, i) => { name[c.q + '#' + c.j] = 'p' + i; });
  const states = cp.map((c, i) => ({ id: 'p' + i, x: 0, y: 0, acc: !!stateOf(base, c.q).acc, label: texName('p' + i), of: c.q })), delta = {};
  cp.forEach((c) => {
    delta[name[c.q + '#' + c.j]] = {};
    base.alpha.forEach((a, ai) => { const t = succ(base, c.q, a); delta[name[c.q + '#' + c.j]][a] = [name[t + '#' + (hs(seed, ids.indexOf(c.q), c.j, ai + 1) % k)]]; });
  });
  const start = name[base.start + '#' + (hs(seed, 99) % k)];
  return relabel(reachableD({ alpha: base.alpha, start, states, delta }), 'p');
}
/** Pigeonhole split of an accepted/rejected run: x = w[0..i), y = w[i..j) where j is the first time a state repeats. */
export function pumpSplit(D, w) {
  const r = run(D, w), seen = new Map();
  for (let j = 0; j < r.path.length; j++) { const q = r.path[j]; if (seen.has(q)) return { i: seen.get(q), j, path: r.path }; seen.set(q, j); }
  return { i: -1, j: -1, path: r.path };
}
export const rep = (s, k) => (k <= 0 ? '' : s.repeat(k));
/** Colours for the pieces x, y, z of a split. */
export const XYZ = { x: 'blue', y: 'orange', z: 'teal' };
/** A row of letter boxes at height y (pen pixels). parts = [{s, col}] consecutive pieces; o.path = states under the boundaries. → {x0, cell, n} */
export function drawPieces(P, parts, y, o = {}) {
  const all = parts.flatMap((p) => [...p.s].map((ch) => ({ ch, col: p.col }))), n = all.length;
  const cell = Math.min(o.cell ?? 30, (P.W - (o.margin ?? 24)) / Math.max(n, 1));
  const x0 = o.x0 ?? Math.round((P.W - n * cell) / 2);
  if (!n) { P.box(x0, y, 28, 28, { r: 4, stroke: 'faint', dash: true }); P.text('ε', x0 + 14, y + 14, { size: 15, color: 'muted' }); }
  all.forEach((a, k) => {
    P.box(x0 + k * cell, y, cell - 2, cell - 2, { r: Math.min(4, cell / 5), fill: a.col, alpha: 0.24, stroke: a.col });
    P.text(a.ch, x0 + k * cell + cell / 2 - 1, y + cell / 2, { size: cell >= 22 ? 15 : cell >= 14 ? 12 : 9, weight: 600 });
  });
  if (o.path && cell >= 14) o.path.forEach((q, k) => P.text(String(q), x0 + k * cell - 1, y + cell + 11, { size: cell >= 22 ? 11 : 9, color: 'muted', halo: true }));
  return { x0, cell, n };
}

// ---------------------------------------------------------------- machines for the minimization items (complete DFAs)
import { dfa as mkDFA } from './ch03.shared.js';
/** A six-state textbook-style example over {0,1}: A,B and C,D,E are redundant pairs/triples; the minimal DFA has 3 states. */
export function text6() {
  const D = mkDFA(['0', '1'], ['A', 'B', 'C', 'D', 'E', 'F'].map((q, i) => [q, 0, 0, 'CDE'.includes(q)]), 'A',
    { A: { 0: 'B', 1: 'C' }, B: { 0: 'A', 1: 'D' }, C: { 0: 'E', 1: 'F' }, D: { 0: 'E', 1: 'F' }, E: { 0: 'E', 1: 'F' }, F: { 0: 'F', 1: 'F' } }, { name: 'six states' });
  return layoutCircle(D);
}
/** Counting 1s modulo 6, accepting when the count is 0 or 3 (so only the residue mod 3 matters): 6 states, minimal 3. */
export function mod6() {
  const D = mkDFA(['0', '1'], [0, 1, 2, 3, 4, 5].map((i) => ['q' + i, 0, 0, i % 3 === 0]), 'q0', Object.fromEntries([0, 1, 2, 3, 4, 5].map((i) => ['q' + i, { 0: 'q' + i, 1: 'q' + ((i + 1) % 6) }])), { name: 'number of 1s ≡ 0 (mod 3), counted mod 6' });
  return layoutCircle(D);
}
/** "The third symbol is 1": q0 → q1 → q2, then an accepting or a dead sink. 5 states, already minimal, but its reversal needs 8 states to determinize. */
export function third1st() {
  const D = mkDFA(['0', '1'], [['q0', 0, 0, 0], ['q1', 0, 0, 0], ['q2', 0, 0, 0], ['q3', 0, 0, 1], ['q4', 0, 0, 0]], 'q0',
    { q0: { 0: 'q1', 1: 'q1' }, q1: { 0: 'q2', 1: 'q2' }, q2: { 0: 'q4', 1: 'q3' }, q3: { 0: 'q3', 1: 'q3' }, q4: { 0: 'q4', 1: 'q4' } }, { name: 'third symbol is 1' });
  return layoutBFS(D, 10, 6);
}
export const PAL = ['blue', 'orange', 'green', 'red', 'purple', 'teal', 'pink', 'gold'];
