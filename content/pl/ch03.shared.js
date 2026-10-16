// Programming Languages & Types — Chapter 3: helpers shared by ch03.js and ch03-b.js.
// Everything of chapter 2 (λ-term parser, reducer, reduction graphs, tree drawer) is re-exported, and on top of it:
// reduction search (joins of two reducts), parallel reduction and complete developments, finite abstract rewriting
// systems, combinatory logic (parser, printer, reducer), bracket abstraction, and a Turing-machine → λ-term compiler.
import {
  V, L, A, subst, P, DEFS, key, redexes, contract, getAt, setAt, cat, size, findRedex, normalize,
} from './ch02.shared.js';
export * from './ch02.shared.js';
export { drawDeriv } from './ch01.shared.js';

// ====================================================================== reduction search
/** All one-step β-reducts of t (one per redex): [{path, term}] (terms larger than maxSize are skipped). */
export function succs(t, maxSize = 200) {
  const out = [];
  for (const p of redexes(t)) { const u = contract(t, p); if (size(u) <= maxSize) out.push({ path: p, term: u }); }
  return out;
}
/** Breadth-first search below t: Map key → {term, d, par (key), path}. Stops at depth D or when `cap` terms are known. */
export function bfs(t, D = 6, cap = 800, maxSize = 160) {
  const seen = new Map([[key(t), { term: t, d: 0, par: null, path: null }]]);
  let layer = [t];
  for (let d = 1; d <= D && layer.length && seen.size < cap; d++) {
    const next = [];
    for (const u of layer) {
      const ku = key(u);
      for (const s of succs(u, maxSize)) {
        const k = key(s.term);
        if (!seen.has(k) && seen.size < cap) { seen.set(k, { term: s.term, d, par: ku, path: s.path }); next.push(s.term); }
      }
    }
    layer = next;
  }
  return seen;
}
const chainOf = (seen, k) => { const out = []; for (let c = k; c !== null; c = seen.get(c).par) out.push(seen.get(c).term); return out.reverse(); };
/** Find a common reduct of a and b with the fewest total steps: {meet, left: [a … meet], right: [b … meet]} or null. */
export function joinSearch(a, b, { depth = 7, cap = 900, maxSize = 160 } = {}) {
  const A_ = bfs(a, depth, cap, maxSize), B_ = bfs(b, depth, cap, maxSize);
  let best = null;
  for (const [k, ea] of A_) {
    const eb = B_.get(k); if (!eb) continue;
    const tot = ea.d + eb.d, mx = Math.max(ea.d, eb.d);
    if (!best || tot < best.tot || (tot === best.tot && mx < best.mx)) best = { k, tot, mx };
  }
  if (!best) return null;
  return { meet: A_.get(best.k).term, left: chainOf(A_, best.k), right: chainOf(B_, best.k) };
}
/** Minimum number of β-steps from a to b (b given up to α), or -1 within the budget. */
export function betaDist(a, b, depth = 8, cap = 1200, maxSize = 200) {
  const seen = bfs(a, depth, cap, maxSize), e = seen.get(key(b));
  return e ? e.d : -1;
}

// ====================================================================== parallel reduction
/** Contract the set S of (original) redex paths simultaneously: the parallel step t ⇒ u of Tait and Martin-Löf. Redexes inside a contracted
 *  redex's body or argument in S are contracted first. Paths refer to the original term. */
export function contractSet(t, S, p = '') {
  if (t.t === 'v') return t;
  if (t.t === 'l') return L(t.x, contractSet(t.b, S, cat(p, 'b')));
  if (S.has(p) && t.f.t === 'l') {
    const body = contractSet(t.f.b, S, cat(cat(p, 'f'), 'b')), arg = contractSet(t.a, S, cat(p, 'a'));
    return subst(body, t.f.x, arg);
  }
  return A(contractSet(t.f, S, cat(p, 'f')), contractSet(t.a, S, cat(p, 'a')));
}
/** Complete development t*: contract every redex present in t, all at once. */
export function dev(t) {
  if (t.t === 'v') return t;
  if (t.t === 'l') return L(t.x, dev(t.b));
  if (t.f.t === 'l') return subst(dev(t.f.b), t.f.x, dev(t.a));
  return A(dev(t.f), dev(t.a));
}
/** Every u with t ⇒ u (parallel reduction), up to α; {list, complete} (capped). */
export function parAll(t, cap = 600) {
  let complete = true;
  const dedupe = (arr) => { const m = new Map(); for (const u of arr) if (!m.has(key(u))) m.set(key(u), u); if (m.size > cap) { complete = false; return [...m.values()].slice(0, cap); } return [...m.values()]; };
  const go = (u) => {
    if (u.t === 'v') return [u];
    if (u.t === 'l') return dedupe(go(u.b).map((b) => L(u.x, b)));
    const fs = go(u.f), as = go(u.a), out = [];
    for (const f of fs) for (const a of as) out.push(A(f, a));
    if (u.f.t === 'l') { const bs = go(u.f.b); for (const b of bs) for (const a of as) out.push(subst(b, u.f.x, a)); }
    return dedupe(out);
  };
  return { list: go(t), complete };
}
/** Does u ⇒ w hold (parallel step)? true / false / null when the search was cut off. */
export function isParallel(u, w) {
  const r = parAll(u, 1500), k = key(w);
  if (r.list.some((x) => key(x) === k)) return true;
  return r.complete ? false : null;
}
/** Number of β-redexes of t that the parallel step with set S contracts, counting nothing twice: just |S ∩ redexes|. */
export const redexCount = (t) => redexes(t).length;

// ====================================================================== finite abstract rewriting systems
/** adj: n×n array of 0/1 (adj[i][j] = 1 iff i → j). Returns closures and the confluence-related analysis. */
export function arsAnalyse(adj) {
  const n = adj.length;
  const T = adj.map((r) => r.map((x) => !!x));
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) if (T[i][k]) for (let j = 0; j < n; j++) if (T[k][j]) T[i][j] = true;
  const R = T.map((r, i) => r.map((x, j) => x || i === j)); // reflexive-transitive closure
  const cycle = T.map((r, i) => r[i]);
  const terminating = !cycle.some(Boolean);
  const succ = adj.map((r) => r.map((x, j) => (x ? j : -1)).filter((j) => j >= 0));
  const normal = succ.map((s) => s.length === 0);
  const joinable = (b, c) => { for (let d = 0; d < n; d++) if (R[b][d] && R[c][d]) return d; return -1; };
  const localFail = [];
  for (let a = 0; a < n; a++) for (const b of succ[a]) for (const c of succ[a]) if (b < c && joinable(b, c) < 0) localFail.push([a, b, c]);
  const confFail = [];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (R[a][b]) for (let c = b + 1; c < n; c++) if (R[a][c] && joinable(b, c) < 0) confFail.push([a, b, c]);
  return { n, T, R, terminating, cycle, normal, succ, joinable, localFail, confFail, locallyConfluent: localFail.length === 0, confluent: confFail.length === 0 };
}

// ====================================================================== combinatory logic
// terms: {t:'c', c:'S'|'K'|'I'} | {t:'v', x} | {t:'a', f, a}; the bracket abstraction also uses {t:'l', x, b} in mixed terms.
export const CS = { t: 'c', c: 'S' }, CK = { t: 'c', c: 'K' }, CI = { t: 'c', c: 'I' };
export const CA = (f, ...as) => as.reduce((acc, a) => ({ t: 'a', f: acc, a }), f);
export const clSize = (t) => (t.t === 'a' ? 1 + clSize(t.f) + clSize(t.a) : t.t === 'l' ? 1 + clSize(t.b) : 1);
/** Number of leaves (S, K, I and variables) — the usual size measure for combinator terms. */
export const clLeaves = (t) => (t.t === 'a' ? clLeaves(t.f) + clLeaves(t.a) : t.t === 'l' ? clLeaves(t.b) : 1);
export const clKey = (t) => (t.t === 'c' ? t.c : t.t === 'v' ? '$' + t.x : t.t === 'l' ? 'λ' + t.x + '.' + clKey(t.b) : '(' + clKey(t.f) + ' ' + clKey(t.a) + ')');
export function clFV(t, out = new Set()) {
  if (t.t === 'v') out.add(t.x);
  else if (t.t === 'a') { clFV(t.f, out); clFV(t.a, out); }
  else if (t.t === 'l') { const s = clFV(t.b, new Set()); s.delete(t.x); for (const x of s) out.add(x); }
  return out;
}
export function parseCL(src, macros = {}) {
  const toks = []; const re = /\s+|[()]|[SKI]|[a-z][0-9']*|[A-Z][a-z]+|./gy; let m;
  while ((m = re.exec(src))) { if (!/^\s+$/.test(m[0])) toks.push({ w: m[0], pos: m.index, len: m[0].length }); if (re.lastIndex >= src.length) break; }
  let k = 0;
  const fail = (msg, tk = toks[k]) => { throw { msg, pos: tk ? tk.pos : src.length, len: tk ? tk.len : 1 }; };
  const isAtomStart = (tk) => tk && (tk.w === '(' || /^[SKI]$/.test(tk.w) || /^[a-z][0-9']*$/.test(tk.w) || macros[tk.w]);
  function atom() {
    const tk = toks[k]; if (!tk) fail('the term ends too early');
    if (/^[SKI]$/.test(tk.w)) { k++; return { t: 'c', c: tk.w }; }
    if (/^[a-z][0-9']*$/.test(tk.w)) { k++; return { t: 'v', x: tk.w }; }
    if (macros[tk.w]) { k++; return macros[tk.w]; }
    if (tk.w === '(') { k++; const r = term(); if (!toks[k] || toks[k].w !== ')') fail(toks[k] ? `expected “)” but found “${toks[k].w}”` : 'missing “)”'); k++; return r; }
    fail(tk.w === ')' ? 'unexpected “)”' : `unexpected “${tk.w}” (use S, K, I, lower-case variables and parentheses)`);
  }
  function term() { let r = atom(); while (isAtomStart(toks[k])) r = { t: 'a', f: r, a: atom() }; return r; }
  try {
    if (!toks.length) return { error: 'empty term', pos: 0, len: 1 };
    const r = term(); if (k < toks.length) fail(toks[k].w === ')' ? 'unbalanced “)”' : `unexpected “${toks[k].w}”`);
    return { ast: r };
  } catch (e) { if (e && e.msg) return { error: e.msg, pos: e.pos, len: e.len }; throw e; }
}
/** Layout for drawLine / click handling, like layoutTerm: handles combinator terms and mixed λ/combinator terms. style(node, path, inherited) → colour. */
export function layoutCL(t, o = {}) {
  const toks = [], spans = new Map(); let n = 0;
  const emit = (s, node, path, color) => { toks.push({ s, a: n, b: n + s.length, node, path, color }); n += s.length; };
  const go = (node, path, ctx, inh) => {
    const col = (o.style && o.style(node, path, inh)) || inh;
    const paren = o.full ? node.t === 'a' || node.t === 'l' : (node.t === 'l' && (ctx === 'fn' || ctx === 'arg')) || (node.t === 'a' && ctx === 'arg');
    if (paren) emit('(', node, path, col);
    const a0 = n;
    if (node.t === 'c') emit(node.c, node, path, col);
    else if (node.t === 'v') emit(node.x, node, path, col);
    else if (node.t === 'l') { emit('λ' + node.x + '. ', node, path, col); go(node.b, cat(path, 'b'), 'body', col); }
    else { go(node.f, cat(path, 'f'), 'fn', col); emit(' ', node, path, col); go(node.a, cat(path, 'a'), 'arg', col); }
    spans.set(path, [a0, n]);
    if (paren) emit(')', node, path, col);
  };
  go(t, '', 'top', undefined);
  return { text: toks.map((k) => k.s).join(''), toks, spans };
}
export const clStr = (t, o) => layoutCL(t, o).text;
const spine = (t) => { const args = []; let h = t; while (h.t === 'a') { args.unshift(h.a); h = h.f; } return { head: h, args }; };
/** Path of the leftmost-outermost redex of a combinator term (I x, K x y, S x y z), or null. */
export function clRedex(t, p = '') {
  if (t.t !== 'a') return null;
  const { head, args } = spine(t);
  if (head.t === 'c') {
    const need = head.c === 'I' ? 1 : head.c === 'K' ? 2 : 3;
    if (args.length >= need) { let q = p; for (let i = 0; i < args.length - need; i++) q = cat(q, 'f'); return q; }
  }
  for (let i = 0; i < args.length; i++) {
    let q = p; for (let j = 0; j < args.length - 1 - i; j++) q = cat(q, 'f');
    const r = clRedex(args[i], cat(q, 'a')); if (r !== null) return r;
  }
  return null;
}
export function clContract(t, p) {
  const node = getAt(t, p), { head, args } = spine(node);
  let r;
  if (head.c === 'I') r = args[0];
  else if (head.c === 'K') r = args[0];
  else r = { t: 'a', f: { t: 'a', f: args[0], a: args[2] }, a: { t: 'a', f: args[1], a: args[2] } };
  return setAt(t, p, r);
}
/** Run leftmost-outermost reduction: {states, paths, status: 'done' | 'cap'}. */
export function clRun(t0, max = 80, maxLeaves = 400) {
  const states = [t0], paths = []; let t = t0, status = 'cap';
  for (let i = 0; i < max; i++) {
    const p = clRedex(t); if (p === null) { status = 'done'; break; }
    t = clContract(t, p); states.push(t); paths.push(p);
    if (clLeaves(t) > maxLeaves) break;
  }
  if (status === 'cap' && clRedex(t) === null) status = 'done';
  return { states, paths, status };
}
export function clNormalForm(t, max = 4000, maxLeaves = 3000) {
  let steps = 0;
  while (steps < max) { const p = clRedex(t); if (p === null) return { t, steps, ok: true }; t = clContract(t, p); steps++; if (clLeaves(t) > maxLeaves) break; }
  return { t, steps, ok: false };
}

// ---------------------------------------------------------------------- bracket abstraction
/** [x]M for a lambda-free M (combinators and variables). eta: use [x](P x) = P when x is not free in P. */
export function bracket(x, m, eta = false) {
  if (m.t === 'v' && m.x === x) return CI;
  if (!clFV(m).has(x)) return { t: 'a', f: CK, a: m };
  if (eta && m.t === 'a' && m.a.t === 'v' && m.a.x === x && !clFV(m.f).has(x)) return m.f;
  return { t: 'a', f: { t: 'a', f: CS, a: bracket(x, m.f, eta) }, a: bracket(x, m.a, eta) };
}
export function fromLambda(t) {
  if (t.t === 'v') return t;
  if (t.t === 'a') return { t: 'a', f: fromLambda(t.f), a: fromLambda(t.a) };
  return { t: 'l', x: t.x, b: fromLambda(t.b) };
}
const hasLam = (t) => (t.t === 'l' ? true : t.t === 'a' ? hasLam(t.f) || hasLam(t.a) : false);
/** The innermost-first elimination of binders: returns the list of mixed terms [λ-term, after 1 binder, …, combinator term] and the binder removed at each step. */
export function bracketSteps(lam, eta = false) {
  let t = fromLambda(lam); const states = [t], removed = [];
  const step = (u) => {
    if (u.t === 'l') {
      if (!hasLam(u.b)) { removed.push(u.x); return bracket(u.x, u.b, eta); }
      return { t: 'l', x: u.x, b: step(u.b) };
    }
    if (u.t === 'a') { if (hasLam(u.f)) return { t: 'a', f: step(u.f), a: u.a }; return { t: 'a', f: u.f, a: step(u.a) }; }
    return u;
  };
  let guard = 0;
  while (hasLam(t) && guard++ < 200) { t = step(t); states.push(t); }
  return { states, removed };
}
/** Convert a lambda-free combinator term of variables to the λ-calculus term of its applicative skeleton (variables only), for comparison by key. */
export const clToApp = (t) => (t.t === 'a' ? A(clToApp(t.f), clToApp(t.a)) : t.t === 'v' ? V(t.x) : t.t === 'c' ? V('#' + t.c) : V('?'));
export const lamAppKey = (t) => (t.t === 'v' ? t.x : t.t === 'a' ? '(' + lamAppKey(t.f) + ' ' + lamAppKey(t.a) + ')' : null);
/** Observe a closed λ-term on fresh arguments: finds the smallest n ≤ maxArgs such that T a1 … an normalises to a λ-free term; returns {n, lam: key, cl: key} (cl from the translated term) or null. */
export function observe(lam, cl, maxArgs = 4) {
  const names = ['a', 'b', 'c', 'd', 'e'];
  for (let n = 0; n <= maxArgs; n++) {
    let tl = lam, tc = cl;
    for (let i = 0; i < n; i++) { tl = A(tl, V(names[i])); tc = { t: 'a', f: tc, a: { t: 'v', x: names[i] } }; }
    const r = normalize(tl, 3000, 3000);
    if (!r.ok) continue;
    const lk = lamAppKey(r.t); if (lk === null) continue;
    const c = clNormalForm(tc);
    const ck = c.ok ? clKeyApp(c.t) : null;
    return { n, lam: lk, cl: ck, lamSteps: r.steps, clSteps: c.steps, lamTerm: r.t, clTerm: c.t };
  }
  return null;
}
export const clKeyApp = (t) => (t.t === 'v' ? t.x : t.t === 'a' ? '(' + clKeyApp(t.f) + ' ' + clKeyApp(t.a) + ')' : null);

// ====================================================================== Turing machines compiled to λ-terms
/** table[state][symbol] = [nextState, write, 'R' | 'L']; the halting state has index nst. */
export const TM_LIB = [
  { id: 'write', name: 'write a 1 and halt', nst: 1, table: [[[1, 1, 'R'], [1, 1, 'R']]], note: 'halts after 1 step' },
  { id: 'bb2', name: '2-state champion', nst: 2, table: [[[1, 1, 'R'], [1, 1, 'L']], [[0, 1, 'L'], [2, 1, 'R']]], note: 'four 1s, halts after 6 steps' },
  { id: 'bb3', name: '3-state, six 1s', nst: 3, table: [[[1, 1, 'R'], [3, 1, 'R']], [[2, 0, 'R'], [1, 1, 'R']], [[2, 1, 'L'], [0, 1, 'L']]], note: 'six 1s, halts after 14 steps' },
  { id: 'right', name: 'run right forever', nst: 1, table: [[[0, 1, 'R'], [0, 1, 'R']]], note: 'never halts' },
  { id: 'pingpong', name: 'ping-pong', nst: 2, table: [[[1, 1, 'R'], [1, 1, 'R']], [[0, 1, 'L'], [0, 1, 'L']]], note: 'never halts, it cycles between two configurations' },
];
/** Direct simulation: snapshots [{q, tape: Map, head}] until halting or maxSteps. */
export function tmSim(m, maxSteps = 200) {
  const tape = new Map(); let q = 0, head = 0;
  const snaps = [{ q, tape: new Map(tape), head }];
  while (q !== m.nst && snaps.length <= maxSteps) {
    const s = tape.get(head) || 0, [q2, w, d] = m.table[q][s];
    if (w) tape.set(head, 1); else tape.delete(head);
    head += d === 'R' ? 1 : -1; q = q2;
    snaps.push({ q, tape: new Map(tape), head });
  }
  return { snaps, halted: q === m.nst, steps: snaps.length - 1 };
}
let tmDefsCache = null;
/** The λ-term Run c0 for machine m, together with the library of named subterms used to build it. */
export function tmTerm(m, lazy = false) {
  if (!tmDefsCache) {
    tmDefsCache = { ...DEFS };
    const def = (n, s) => { tmDefsCache[n] = P(s, tmDefsCache); };
    def('Nil', 'λc n. n'); def('Cons', 'λh t c n. c h t');
    def('Hd', 'λl. l (λh t. h) False'); def('Tl', 'λl. l (λh t. t) Nil');
    def('Cfg', 'λq l s r f. f q l s r');
  }
  const defs = { ...tmDefsCache };
  const def = (n, s) => { defs[n] = P(s, defs); };
  const nst = m.nst, table = m.table;
  const sel = (i) => 'λ' + Array.from({ length: nst + 1 }, (_, j) => 'r' + j).join(' ') + '. r' + i;
  const ent = (e) => `(λf. f (${sel(e[0])}) ${e[1] ? 'True' : 'False'} ${e[2] === 'R' ? 'True' : 'False'})`;
  const rows = []; for (let i = 0; i < nst; i++) rows.push(`(λs. s ${ent(table[i][1])} ${ent(table[i][0])})`); rows.push('I');
  def('Delta', 'λq s. q ' + rows.join(' ') + ' s');
  def('IsHalt', 'λq. q ' + Array(nst).fill('False').join(' ') + ' True');
  def('Step', 'λc. c (λq l s r. Delta q s (λp w d. d (Cfg p (Cons w l) (Hd r) (Tl r)) (Cfg p (Tl l) (Hd l) (Cons w r))))');
  if (lazy) def('Run', 'Y (λg c. c (λq l s r. IsHalt q True (g (Step c))))');
  else def('Run', 'Z (λg c. c (λq l s r. IsHalt q (λu. True) (λu. g (Step c)) I))');
  def('Start', `Cfg (${sel(0)}) Nil False Nil`);
  return { term: P('Run Start', defs), defs };
}
/** Fast reduction by a strategy without cycle detection; returns {t, steps, status: 'done' | 'cap'}. */
export function fastRun(t, strat, max = 4000, maxSize = 6000) {
  let steps = 0;
  while (steps < max) {
    const p = findRedex(t, strat); if (p === null) return { t, steps, status: 'done' };
    t = contract(t, p); steps++; if (size(t) > maxSize) return { t, steps, status: 'cap' };
  }
  return { t, steps, status: 'cap' };
}

// ====================================================================== drawing: a diamond (or any two chains from a top node to a bottom node)
function trunc(s, ctx, text, maxW, size, weight = 600) {
  ctx.save(); ctx.font = s._font({ size, weight });
  let w = ctx.measureText(text).width;
  if (w <= maxW) { ctx.restore(); return [text, w]; }
  let lo = 1, hi = text.length;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ctx.measureText(text.slice(0, mid) + '…').width <= maxW) lo = mid; else hi = mid - 1; }
  const r = text.slice(0, lo) + '…'; w = ctx.measureText(r).width; ctx.restore(); return [r, w];
}
/** Draw a diamond. o: {top: {text, color}, bottom: {text, color, missing} | null, left: [{text, color}], right: [...],
 *  leftColor, rightColor, leftLabels, rightLabels (edge labels, length = chain + 1), region [x0,y0,x1,y1], size, topLabel, bottomLabel}.
 *  Returns the list of drawn nodes with px, py, pw, ph, text, full. */
export function drawDiamond(v, s, o) {
  const [rx0, ry0, rx1, ry1] = o.region || [0, 0, s.W, s.H], ctx = s.ctx, size = o.size || 12.5, bh = size + 12;
  const cx = (rx0 + rx1) / 2, yT = ry0 + 6 + bh / 2, yB = ry1 - 6 - bh / 2;
  const maxW = Math.min(230, (rx1 - rx0) * 0.42);
  const nodes = [];
  const mk = (n, x, y, kind) => { const [txt, w] = trunc(s, ctx, n.text, maxW, size); const nd = { px: x, py: y, pw: Math.max(30, w + 14), ph: bh, text: txt, full: n.text, color: n.color, kind, missing: n.missing }; nodes.push(nd); return nd; };
  const top = mk(o.top, cx, yT, 'top');
  const bot = o.bottom ? mk(o.bottom, cx, yB, 'bottom') : null;
  const bulge = Math.min((rx1 - rx0) * 0.3, 190);
  const chain = (arr, side) => arr.map((n, i) => {
    const f = (i + 1) / (arr.length + 1), off = Math.max(bulge * Math.sin(Math.PI * f), bulge * 0.35);
    return mk(n, cx + side * off, yT + (yB - yT) * f, side < 0 ? 'left' : 'right');
  });
  const L1 = chain(o.left || [], -1), R1 = chain(o.right || [], 1);
  const arrow = (a, b, col, label, side, alpha = 0.95) => {
    const dy = b.py - a.py, sx = a.px, sy = a.py + a.ph / 2, ex = b.px, ey = b.py - b.ph / 2;
    ctx.save(); ctx.strokeStyle = v.color(col, alpha); ctx.fillStyle = v.color(col, alpha); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx, sy);
    let mx = (sx + ex) / 2, my = (sy + ey) / 2, ang;
    if (a.kind === 'top' && b.kind === 'bottom') { const cxp = sx + side * bulge * 1.3; ctx.quadraticCurveTo(cxp, my, ex, ey); mx = (sx + 2 * cxp + ex) / 4; ang = Math.atan2(ey - my, ex - cxp); }
    else { ctx.lineTo(ex, ey); ang = Math.atan2(ey - sy, ex - sx); }
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 8 * Math.cos(ang - 0.4), ey - 8 * Math.sin(ang - 0.4)); ctx.lineTo(ex - 8 * Math.cos(ang + 0.4), ey - 8 * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
    ctx.restore();
    if (label) s.textPx(label, mx + side * 6, my, { size: 11, weight: 700, color: col, align: side < 0 ? 'right' : 'left', halo: true });
    void dy;
  };
  const seq = (arr, side, col, labels) => {
    const all = [top, ...arr, ...(bot && !bot.missing ? [bot] : [])];
    for (let i = 0; i + 1 < all.length; i++) arrow(all[i], all[i + 1], col, labels ? labels[i] : '', side);
  };
  seq(L1, -1, o.leftColor || 'accent', o.leftLabels);
  seq(R1, 1, o.rightColor || 'orange', o.rightLabels);
  for (const nd of nodes) {
    const x = nd.px - nd.pw / 2, y = nd.py - nd.ph / 2, col = nd.color || (nd.kind === 'top' ? 'accent' : nd.kind === 'left' ? o.leftColor || 'accent' : nd.kind === 'right' ? o.rightColor || 'orange' : 'green');
    ctx.save(); rrectPath(ctx, x, y, nd.pw, nd.ph, 7); ctx.fillStyle = v.color('panel', 1); ctx.fill();
    ctx.fillStyle = v.color(col, 0.2); ctx.fill();
    ctx.strokeStyle = v.color(col, 1); ctx.lineWidth = 1.8; if (nd.missing) ctx.setLineDash([4, 3]); ctx.stroke(); ctx.restore();
    s.textPx(nd.text, nd.px, nd.py, { size, weight: 600, align: 'center', color: nd.missing ? 'red' : 'ink', halo: false });
  }
  if (o.topLabel) s.textPx(o.topLabel, top.px - top.pw / 2 - 8, top.py, { size: 11.5, weight: 700, color: 'muted', align: 'right', halo: false });
  if (bot && o.bottomLabel) s.textPx(o.bottomLabel, bot.px + bot.pw / 2 + 8, bot.py, { size: 11.5, weight: 700, color: 'muted', align: 'left', halo: false });
  return nodes;
}
function rrectPath(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
export const hitNodes = (nodes, px, py) => { let best = null; for (const nd of nodes) if (Math.abs(px - nd.px) <= nd.pw / 2 + 3 && Math.abs(py - nd.py) <= nd.ph / 2 + 3) best = nd; return best; };
/** Underline the redexes of a drawn term line: marks[{path, color, level}] ; spans from layoutTerm. */
export function underlineSpans(v, s, d, lay, y, marks, lw = 3) {
  const ctx = s.ctx;
  for (const m of marks) {
    if (!lay.spans.has(m.path)) continue;
    const [a, b] = lay.spans.get(m.path), x0 = d.xOf(a), x1 = d.xOf(b), yy = y + d.size * 0.78 + (m.level || 0) * 6;
    ctx.save(); ctx.strokeStyle = v.color(m.color, 1); ctx.lineWidth = m.width || lw; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke(); ctx.restore();
  }
}
