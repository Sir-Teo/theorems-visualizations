// Theory of Computation — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
// Re-exports the Chapter 2 helpers (DFA structure, pen, keypad, tape, graph drawing).
// An NFA is a DFA-shaped object { alpha, states:[{id,x,y,acc,label}], start, delta:{id:{sym:[targets]}}, eps:{id:[targets]} }.
import { EPS, DEAD, layer, upTo, dfa, texName, startArrow, onColor, MONO, SANS, pen } from './ch02.shared.js';
export * from './ch02.shared.js';

// ---------------------------------------------------------------- NFAs
/** nfa(alpha, [[id,x,y,acc,label?]…], start, delta {id:{sym: id | [ids]}}, eps {id: [ids]}, extra) */
export function nfa(alpha, states, start, delta, eps = {}, extra = {}) {
  const N = dfa(alpha, states, start, delta, extra);
  N.eps = {}; for (const s of N.states) N.eps[s.id] = (eps[s.id] || []).slice();
  return N;
}
export const idx = (N) => Object.fromEntries(N.states.map((s, i) => [s.id, i]));
/** ε-closure of a set of state ids (returned in state order). */
export function closure(N, S) {
  const seen = new Set(S), st = [...S];
  while (st.length) { const u = st.pop(); for (const t of N.eps?.[u] || []) if (!seen.has(t)) { seen.add(t); st.push(t); } }
  return N.states.map((s) => s.id).filter((q) => seen.has(q));
}
export function move(N, S, c) {
  const out = new Set(); for (const q of S) for (const t of N.delta[q]?.[c] || []) out.add(t);
  return N.states.map((s) => s.id).filter((q) => out.has(q));
}
export const hasAcc = (N, S) => S.some((q) => N.states.find((s) => s.id === q)?.acc);
/** Sets of live states: sets[k] after k symbols (ε-closed); acc = some state accepting. */
export function nfaRun(N, w) {
  const sets = [closure(N, [N.start])];
  for (let k = 0; k < w.length; k++) sets.push(closure(N, move(N, sets[k], w[k])));
  return { sets, acc: hasAcc(N, sets[w.length]) };
}
export const nfaAccepts = (N, w) => nfaRun(N, w).acc;
/** Subset construction from the start closure; only reachable subsets. Returns a DFA-shaped object whose state ids are 'S' + indices. */
export function determinize(N, o = {}) {
  const key = (S) => S.join(','), ids = new Map(), list = [];
  const start = closure(N, [N.start]);
  const add = (S) => { const k = key(S); if (!ids.has(k)) { ids.set(k, list.length); list.push({ S, id: 'S' + list.length, acc: hasAcc(N, S) }); } return ids.get(k); };
  add(start); const delta = {};
  for (let h = 0; h < list.length; h++) {
    const cur = list[h]; delta[cur.id] = {};
    for (const c of N.alpha) { const T = closure(N, move(N, cur.S, c)); if (!o.dropEmpty || T.length) delta[cur.id][c] = [list[add(T)].id]; else delta[cur.id][c] = []; }
  }
  const D = { alpha: N.alpha, start: 'S0', states: list.map((x, i) => ({ id: x.id, x: 0, y: 0, acc: x.acc, set: x.S, label: setTeX(N, x.S) })), delta, order: list.map((x) => x.id) };
  return D;
}
export function setTeX(N, S) {
  if (!S.length) return '$\\varnothing$';
  const nm = (q) => (N.states.find((s) => s.id === q)?.label ?? q).replace(/\$/g, '');
  return '$\\{' + S.map(nm).join(',') + '\\}$';
}
/** Number of states of the minimal complete DFA for a (complete, reachable) DFA, by Moore's partition refinement. */
export function minimalSize(D) {
  const ids = D.states.map((s) => s.id), tg = (q, c) => D.delta[q][c][0];
  let cls = Object.fromEntries(D.states.map((s) => [s.id, s.acc ? 1 : 0])), n = new Set(Object.values(cls)).size;
  for (;;) {
    const sig = {}, nx = {}; let m = 0;
    for (const q of ids) { const k = cls[q] + '|' + D.alpha.map((c) => cls[tg(q, c)]).join(','); if (!(k in sig)) sig[k] = m++; nx[q] = sig[k]; }
    cls = nx; if (m === n) return m; n = m;
  }
}
export const dfaAccepts = (D, w) => { let q = D.start; for (const c of w) q = D.delta[q][c][0]; return !!D.states.find((s) => s.id === q).acc; };
/** All strings over alpha up to length n that the NFA accepts (as a Set). */
export function nfaLang(N, n) { const out = new Set(); for (const w of upTo(N.alpha, n)) if (nfaAccepts(N, w)) out.add(w); return out; }
export function eqSets(A, B) { if (A.size !== B.size) return false; for (const x of A) if (!B.has(x)) return false; return true; }
export function firstDiff(A, B) { for (const x of [...A].sort((p, q) => p.length - q.length || (p < q ? -1 : 1))) if (!B.has(x)) return x; for (const x of [...B].sort((p, q) => p.length - q.length || (p < q ? -1 : 1))) if (!A.has(x)) return x; return null; }

// ---------------------------------------------------------------- drawing NFAs
export function nfaEdges(N, o = {}) {
  const map = new Map(), out = [];
  const add = (from, to, c) => {
    const k = from + '\u0001' + to;
    if (!map.has(k)) { const e = { from, to, syms: [], directed: true }; if (from === to && N.loops?.[from] != null) e.angle = N.loops[from]; if (N.bends?.[k] != null) e.bend = N.bends[k]; map.set(k, e); out.push(e); }
    map.get(k).syms.push(c);
  };
  for (const s of N.states) {
    for (const c of N.alpha) for (const t of N.delta[s.id]?.[c] || []) add(s.id, t, c);
    for (const t of N.eps?.[s.id] || []) add(s.id, t, EPS);
  }
  for (const e of out) { e.label = e.syms.join(', '); e.eps = e.syms.includes(EPS); e.epsOnly = e.syms.every((c) => c === EPS); const f = N.flag?.[e.from + '>' + e.to]; if (f) { e.kind = f.kind; e.h = f.h; } }
  return out;
}
/** Thompson loop-back / bypass arcs: bend them clear of the fragment (px per layout unit). */
export function bendEdges(G, unit) { for (const e of G.edges) if (e.kind) e.bend = (e.kind === 'loop' ? 1 : -1) * (e.h ?? 1) * unit * 1.25; }
/** Fit the stage window to a Thompson NFA's layout; returns pixels per layout unit. */
export function fitThompson(s, N) { const h = Math.max(N.top, N.bot) + 0.9; s.setView([-0.8, N.W + 0.8], [-h, h]); return Math.abs(s.X(1) - s.X(0)); }
export function nfaGraph(v, s, N, o = {}) {
  const G = v.graph(s, { nodes: [], edges: [], layout: 'none', directed: true, r: o.r ?? 18, autoRadius: false, texSize: o.texSize ?? 15, draggable: o.draggable !== false, editable: false, edgeFontSize: 11.5, shape: o.shape });
  G.sync = (NN = N) => { G.set({ nodes: NN.states, edges: nfaEdges(NN) }); return G; };
  G.sync(N);
  return G;
}
export function drawNFA(v, s, G, N, o = {}) {
  G.draw({
    nodeLabel: (id, n) => n.label ?? id,
    nodeRing: (id) => (N.states.find((x) => x.id === id)?.acc ? o.ring?.(id) ?? 'ink' : null),
    nodeFill: (id) => o.fill?.(id) ?? null,
    nodeColor: (id) => o.color?.(id) ?? null,
    labelColor: (id) => o.labelColor?.(id) ?? (o.fill?.(id) ? onColor(v, o.fill(id)) : null),
    edgeColor: (e) => o.edgeColor?.(e) ?? null,
    edgeWidth: (e) => o.edgeWidth?.(e) ?? null,
    edgeDash: (e) => (e.epsOnly ? [5, 4] : null),
    edgeLabel: (e) => e.label,
    edgeLabelColor: (e) => o.edgeLabelColor?.(e) ?? (e.epsOnly ? 'muted' : null),
    dim: o.dim,
  });
  if (o.start !== false) startArrow(s, G, N, o.startColor);
}

/** Presets (positions in a 0–10 × 0–7 box). */
export const NFAS = {
  secondA: () => nfa(['a', 'b'], [['q0', 1.6, 3.6, 0], ['q1', 5, 3.6, 0], ['q2', 8.4, 3.6, 1]], 'q0',
    { q0: { a: ['q0', 'q1'], b: 'q0' }, q1: { a: 'q2', b: 'q2' } }, {}, { name: '2nd symbol from the end is a', loops: { q0: 90 } }),
  endsAB: () => nfa(['a', 'b'], [['q0', 1.6, 3.6, 0], ['q1', 5, 3.6, 0], ['q2', 8.4, 3.6, 1]], 'q0',
    { q0: { a: ['q0', 'q1'], b: 'q0' }, q1: { b: 'q2' } }, {}, { name: 'ends in ab', loops: { q0: 90 } }),
  aaOrBb: () => nfa(['a', 'b'], [['q0', 1.4, 3.6, 0], ['q1', 4.8, 5.6, 0], ['q2', 4.8, 1.6, 0], ['q3', 8.4, 3.6, 1]], 'q0',
    { q0: { a: ['q0', 'q1'], b: ['q0', 'q2'] }, q1: { a: 'q3' }, q2: { b: 'q3' }, q3: { a: 'q3', b: 'q3' } }, {}, { name: 'contains aa or bb', loops: { q0: 180 + 90, q3: 90 } }),
  third1: () => nfa(['0', '1'], [['q0', 1.2, 3.6, 0], ['q1', 3.9, 3.6, 0], ['q2', 6.5, 3.6, 0], ['q3', 9.1, 3.6, 1]], 'q0',
    { q0: { 0: 'q0', 1: ['q0', 'q1'] }, q1: { 0: 'q2', 1: 'q2' }, q2: { 0: 'q3', 1: 'q3' } }, {}, { name: '3rd symbol from the end is 1', loops: { q0: 90 } }),
};

// ---------------------------------------------------------------- regular expressions
// AST: {t:'sym',c} {t:'eps'} {t:'empty'} {t:'cat',l,r} {t:'alt',l,r} {t:'star',e}
export const R = {
  sym: (c) => ({ t: 'sym', c }), eps: { t: 'eps' }, empty: { t: 'empty' },
  cat: (l, r) => ({ t: 'cat', l, r }), alt: (l, r) => ({ t: 'alt', l, r }), star: (e) => ({ t: 'star', e }),
};
export const catAll = (xs) => xs.reduce((a, b) => R.cat(a, b));
export const altAll = (xs) => xs.reduce((a, b) => R.alt(a, b));
/** Parse: alternation with | or ∪, juxtaposition, postfix * + ?, parentheses, ε (or #), ∅. Throws {msg,pos}. */
export function parseRegex(src) {
  const s = src.replace(/\s+/g, ''); let i = 0;
  const err = (msg) => { const e = new Error(msg); e.pos = i; throw e; };
  const atomStart = () => i < s.length && s[i] !== ')' && s[i] !== '|' && s[i] !== '∪';
  function alt() { let a = cat(); while (s[i] === '|' || s[i] === '∪') { i++; if (!atomStart()) err('missing operand after ∪'); a = R.alt(a, cat()); } return a; }
  function cat() { if (!atomStart()) err(i >= s.length ? 'the expression is empty or ends too early' : `unexpected "${s[i]}"`); let a = post(); while (atomStart()) a = R.cat(a, post()); return a; }
  function post() {
    let a = atom();
    for (;;) {
      if (s[i] === '*') { i++; a = R.star(a); } else if (s[i] === '+') { i++; a = R.cat(a, R.star(a)); } else if (s[i] === '?') { i++; a = R.alt(a, R.eps); } else break;
    }
    return a;
  }
  function atom() {
    const c = s[i];
    if (c === '(') { i++; const a = alt(); if (s[i] !== ')') err('missing )'); i++; return a; }
    if (c === 'ε' || c === '#') { i++; return R.eps; }
    if (c === '∅') { i++; return R.empty; }
    if (/[a-z0-9]/.test(c)) { i++; return R.sym(c); }
    if (c === '*' || c === '+' || c === '?') err(`"${c}" has nothing to repeat`);
    err(`unexpected "${c}"`);
  }
  if (!s.length) err('type an expression');
  const a = alt(); if (i < s.length) err(`unexpected "${s[i]}"`);
  return a;
}
export const tryParse = (src) => { try { return { ast: parseRegex(src) }; } catch (e) { return { error: e.message, pos: e.pos }; } };
const prec = { alt: 0, cat: 1, star: 2, sym: 3, eps: 3, empty: 3 };
/** Plain text (canvas) or TeX rendering. */
export function rx(e, tex = false) {
  const p = (x, min) => { const t = rx(x, tex); return prec[x.t] < min ? '(' + t + ')' : t; };
  switch (e.t) {
    case 'sym': return tex ? `\\mathtt{${e.c}}` : e.c;
    case 'eps': return tex ? '\\varepsilon' : 'ε';
    case 'empty': return tex ? '\\varnothing' : '∅';
    case 'cat': return p(e.l, 1) + (tex ? '\\,' : '') + p(e.r, 1);
    case 'alt': return p(e.l, 0) + (tex ? '\\cup ' : '∪') + p(e.r, 0);
    case 'star': return p(e.e, 3) + (tex ? '^{*}' : '*');
  }
}
export const rxTeX = (e) => rx(e, true);
export const key = (e) => rx(e, false);
export function rxSize(e) { return e.t === 'cat' || e.t === 'alt' ? 1 + rxSize(e.l) + rxSize(e.r) : e.t === 'star' ? 1 + rxSize(e.e) : 1; }
export function countParts(e) { // symbols (operands) and operators
  const r = { operands: 0, operators: 0 };
  (function walk(x) { if (x.t === 'cat' || x.t === 'alt') { r.operators++; walk(x.l); walk(x.r); } else if (x.t === 'star') { r.operators++; walk(x.e); } else r.operands++; })(e);
  return r;
}
export function nullable(e) { switch (e.t) { case 'eps': case 'star': return true; case 'sym': case 'empty': return false; case 'cat': return nullable(e.l) && nullable(e.r); case 'alt': return nullable(e.l) || nullable(e.r); } }
/** Language up to length n: array of Sets (index = length). */
export function langSets(e, n) {
  const memo = new Map();
  const go = (x) => {
    if (memo.has(x)) return memo.get(x);
    const out = Array.from({ length: n + 1 }, () => new Set());
    if (x.t === 'eps') out[0].add('');
    else if (x.t === 'sym') { if (n >= 1) out[1].add(x.c); }
    else if (x.t === 'alt') { const a = go(x.l), b = go(x.r); for (let k = 0; k <= n; k++) { a[k].forEach((u) => out[k].add(u)); b[k].forEach((u) => out[k].add(u)); } }
    else if (x.t === 'cat') { const a = go(x.l), b = go(x.r); for (let i = 0; i <= n; i++) for (let j = 0; i + j <= n; j++) for (const u of a[i]) for (const w of b[j]) out[i + j].add(u + w); }
    else if (x.t === 'star') {
      const a = go(x.e); out[0].add('');
      for (let k = 1; k <= n; k++) for (let i = 1; i <= k; i++) for (const u of a[i]) for (const w of out[k - i]) out[k].add(u + w);
    }
    memo.set(x, out); return out;
  };
  return go(e);
}
export const langFlat = (e, n) => { const S = new Set(); langSets(e, n).forEach((L) => L.forEach((u) => S.add(u))); return S; };
export function symbolsOf(e, acc = new Set()) { if (e.t === 'sym') acc.add(e.c); else { if (e.l) symbolsOf(e.l, acc); if (e.r) symbolsOf(e.r, acc); if (e.e) symbolsOf(e.e, acc); } return acc; }

// ---- smart constructors (simplifying) and Brzozowski derivatives
export function flatAlt(e, out = []) { if (e.t === 'alt') { flatAlt(e.l, out); flatAlt(e.r, out); } else out.push(e); return out; }
/** Alternation with ∅ removed, duplicates removed; if aci, also flattened and sorted. */
export function sAlt(a, b, aci = true) {
  if (a.t === 'empty') return b; if (b.t === 'empty') return a;
  if (!aci) return key(a) === key(b) ? a : R.alt(a, b);
  const parts = [...flatAlt(a), ...flatAlt(b)], seen = new Map();
  for (const p of parts) if (p.t !== 'empty') seen.set(key(p), p);
  const xs = [...seen.values()].sort((p, q) => (key(p) < key(q) ? -1 : 1));
  if (!xs.length) return R.empty;
  return xs.reduce((x, y) => R.alt(x, y));
}
export function sCat(a, b) { if (a.t === 'empty' || b.t === 'empty') return R.empty; if (a.t === 'eps') return b; if (b.t === 'eps') return a; return R.cat(a, b); }
export function sStar(a) { if (a.t === 'empty' || a.t === 'eps') return R.eps; if (a.t === 'star') return a; return R.star(a); }
/** Derivative d_c(e); with simp the smart constructors are used (similarity: ∅, ε, associativity/commutativity/idempotence of ∪). */
export function deriv(e, c, simp = true) {
  const mAlt = (a, b) => (simp ? sAlt(a, b) : R.alt(a, b)), mCat = (a, b) => (simp ? sCat(a, b) : R.cat(a, b)), mStar = (a) => (simp ? sStar(a) : R.star(a));
  switch (e.t) {
    case 'eps': case 'empty': return R.empty;
    case 'sym': return e.c === c ? R.eps : R.empty;
    case 'alt': return mAlt(deriv(e.l, c, simp), deriv(e.r, c, simp));
    case 'cat': { const d = mCat(deriv(e.l, c, simp), e.r); return nullable(e.l) ? mAlt(d, deriv(e.r, c, simp)) : d; }
    case 'star': return mCat(deriv(e.e, c, simp), e);
  }
}

// ---- Thompson construction (the textbook version: concatenation identifies the joined states)
/** Returns {N, events, root, size}: events in post-order, one per AST node, each {node, text, newStates, newEdges, merged}. */
export function thompson(ast, alpha) {
  let cnt = 0; const edges = [], nodes = [], events = [], merge = new Map();
  const mk = (x, y) => { const id = cnt++; nodes.push({ id, x, y }); return id; };
  const ed = (a, b, c, extra = {}) => { const e = { a, b, c, ...extra }; edges.push(e); return e; };
  // each fragment: {s, f, ids:[node ids], W, top, bot}; coordinates are stored relative and fixed up through offsets
  function build(x) {
    let fr;
    const ev = { node: x, newStates: [], newEdges: [], merged: null };
    if (x.t === 'sym' || x.t === 'eps' || x.t === 'empty') {
      const s = mk(0, 0), f = mk(1, 0); fr = { s, f, ids: [s, f], W: 1, top: 0.5, bot: 0.5 };
      if (x.t !== 'empty') ev.newEdges.push(ed(s, f, x.t === 'sym' ? x.c : EPS));
      ev.newStates.push(s, f);
    } else if (x.t === 'cat') {
      const A = build(x.l), B = build(x.r);
      // identify B.s with A.f, B placed to the right
      offset(B, A.W, 0); merge.set(B.s, A.f);
      ev.merged = [B.s, A.f];
      fr = { s: A.s, f: B.f, ids: [...A.ids, ...B.ids.filter((q) => q !== B.s)], W: A.W + B.W, top: Math.max(A.top, B.top), bot: Math.max(A.bot, B.bot) };
    } else if (x.t === 'alt') {
      const A = build(x.l), B = build(x.r), dy = 0.62;
      const cyA = A.bot + dy, cyB = -(B.top + dy);
      offset(A, 1, cyA); offset(B, 1, cyB);
      const W = Math.max(A.W, B.W) + 2, s = mk(0, 0), f = mk(W, 0);
      ev.newStates.push(s, f);
      ev.newEdges.push(ed(s, A.s, EPS), ed(s, B.s, EPS), ed(A.f, f, EPS), ed(B.f, f, EPS));
      // stretch the shorter branch to the full width by moving its final node
      fr = { s, f, ids: [...A.ids, ...B.ids, s, f], W, top: cyA + A.top, bot: -cyB + B.bot };
      if (A.W < B.W) nodes[A.f].x += B.W - A.W; if (B.W < A.W) nodes[B.f].x += A.W - B.W;
    } else { // star
      const A = build(x.e);
      offset(A, 1, 0);
      const s = mk(0, 0), f = mk(A.W + 2, 0);
      ev.newStates.push(s, f);
      ev.newEdges.push(ed(s, A.s, EPS), ed(A.f, f, EPS), ed(A.f, A.s, EPS, { loopBack: true, h: A.top + 0.5 }), ed(s, f, EPS, { bypass: true, h: A.bot + 0.5 }));
      fr = { s, f, ids: [...A.ids, s, f], W: A.W + 2, top: A.top + 0.9, bot: A.bot + 0.9 };
    }
    ev.fr = fr; events.push(ev);
    return fr;
  }
  function offset(fr, dx, dy) { for (const q of fr.ids) { nodes[q].x += dx; nodes[q].y += dy; } }
  const root = build(ast);
  // resolve merges and renumber states in creation order
  const rep = (q) => { while (merge.has(q)) q = merge.get(q); return q; };
  const alive = nodes.filter((n) => !merge.has(n.id)).map((n) => n.id), name = new Map(alive.map((q, i) => [q, 'q' + i]));
  // the dead end of a cat merge keeps the position of A.f
  const alpha2 = alpha || [...symbolsOf(ast)].sort();
  const E = edges.map((e) => ({ ...e, from: name.get(rep(e.a)), to: name.get(rep(e.b)) }));
  const states = alive.map((q) => [name.get(q), nodes[q].x, nodes[q].y, q === rep(root.f)]);
  const delta = {}, eps = {};
  for (const [id] of states) { delta[id] = {}; eps[id] = []; }
  for (const e of E) { if (e.c === EPS) eps[e.from].push(e.to); else { (delta[e.from][e.c] = delta[e.from][e.c] || []).push(e.to); } }
  const N = nfa(alpha2, states, name.get(rep(root.s)), delta, eps, { thompson: true, W: root.W, top: root.top, bot: root.bot });
  N.bends = {}; N.edgeInfo = E; N.flag = {}; for (const e of E) if (e.loopBack || e.bypass) N.flag[e.from + '>' + e.to] = { kind: e.loopBack ? 'loop' : 'bypass', h: e.h };
  // list of events with resolved ids (for stepping)
  const evs = events.map((ev) => ({ node: ev.node, newStates: ev.newStates.map(rep).map((q) => name.get(q)), newEdges: ev.newEdges.map((e) => E[edges.indexOf(e)]), merged: ev.merged ? { from: name.get(rep(ev.merged[0])), raw: ev.merged[0], into: name.get(rep(ev.merged[1])) } : null, fr: { s: name.get(rep(ev.fr.s)), f: name.get(rep(ev.fr.f)), ids: [...new Set(ev.fr.ids.map(rep))].map((q) => name.get(q)) } }));
  return { N, events: evs, rawCount: nodes.length, root, nameOf: (q) => name.get(rep(q)) };
}
// ---- subset construction + backtracking matcher step counts
/** Backtracking matcher over the AST (continuation passing). Counts calls; stops at `cap`. Returns {ok, steps, capped}. */
export function backtrack(ast, w, cap = 3e6) {
  let steps = 0, capped = false;
  function m(e, i, k) {
    if (++steps > cap) { capped = true; return false; }
    switch (e.t) {
      case 'eps': return k(i);
      case 'empty': return false;
      case 'sym': return i < w.length && w[i] === e.c && k(i + 1);
      case 'alt': return m(e.l, i, k) || m(e.r, i, k);
      case 'cat': return m(e.l, i, (j) => m(e.r, j, k));
      case 'star': return m(e.e, i, (j) => j > i && m(e, j, k)) || k(i);
    }
  }
  const ok = m(ast, 0, (j) => j === w.length);
  return { ok: capped ? null : ok, steps: Math.min(steps, cap), capped };
}
/** Simulate the (ε-)NFA on w and count work: every state visited in a closure or a move counts one. */
export function nfaWork(N, w) {
  let work = 0, S = [N.start];
  const clos = (T) => { const seen = new Set(T), st = [...T]; work += T.length; while (st.length) { const u = st.pop(); for (const t of N.eps[u] || []) { work++; if (!seen.has(t)) { seen.add(t); st.push(t); } } } return [...seen]; };
  S = clos(S); const live = [S.length];
  for (const c of w) { const T = new Set(); for (const q of S) { work++; for (const t of N.delta[q]?.[c] || []) T.add(t); } S = clos([...T]); live.push(S.length); }
  return { work, ok: S.some((q) => N.states.find((x) => x.id === q)?.acc), live };
}

// ---- GNFA state elimination (labels are ASTs, with light simplification)
export function gnfaFromNFA(N) {
  const ids = ['I', ...N.states.map((s) => s.id), 'F'], E = {};
  const put = (a, b, r) => { const k = a + '>' + b; E[k] = E[k] ? sAlt(E[k], r, false) : r; };
  put('I', N.start, R.eps);
  for (const s of N.states) {
    if (s.acc) put(s.id, 'F', R.eps);
    for (const c of N.alpha) for (const t of N.delta[s.id]?.[c] || []) put(s.id, t, R.sym(c));
    for (const t of N.eps?.[s.id] || []) put(s.id, t, R.eps);
  }
  return { ids, E, alive: new Set(ids) };
}
export function eliminate(Gn, q) {
  const E = { ...Gn.E }, loop = E[q + '>' + q] ? sStar(E[q + '>' + q]) : null, alive = new Set(Gn.alive); alive.delete(q);
  for (const i of alive) for (const j of alive) {
    const a = Gn.E[i + '>' + q], b = Gn.E[q + '>' + j]; if (!a || !b) continue;
    let r = loop ? sCat(sCat(a, loop), b) : sCat(a, b);
    const k = i + '>' + j; E[k] = Gn.E[k] ? sAlt(Gn.E[k], r, false) : r;
  }
  for (const k of Object.keys(E)) { const [x, y] = k.split('>'); if (x === q || y === q) delete E[k]; }
  return { ids: Gn.ids, E, alive };
}
export function nfaToRegex(N, order) {
  let G = gnfaFromNFA(N);
  for (const q of order ?? N.states.map((s) => s.id)) G = eliminate(G, q);
  return G.E['I>F'] || R.empty;
}
/** Convert a DFA-shaped object (targets arrays) to NFA-shaped for the helpers above. */
export const asNFA = (D) => ({ ...D, eps: D.eps || Object.fromEntries(D.states.map((s) => [s.id, []])) });
/** Language-equality check of an AST against a set (strings up to n). */
export function sameLang(ast, set, n) { return eqSets(langFlat(ast, n), set); }


// ---------------------------------------------------------------- UI helpers
/** A regular-expression text field with ε / ∪ buttons and optional presets. cur() → {ast} | {error, pos}. */
export function rxInput(v, o = {}) {
  const inp = v.input(o.label ?? 'expression', o.value, { width: o.width ?? 230, placeholder: o.placeholder ?? '(a|b)*abb' });
  let last = null, res = null;
  const cur = () => { if (inp.value !== last) { last = inp.value; res = tryParse(last); } return res; };
  if (o.presets) v.select(o.presetLabel ?? 'example', o.presets.map(([label, src]) => ({ value: src, label })), o.value, { onChange: (s) => { inp.set(s); o.onPick?.(s); } });
  if (o.buttons !== false) { v.button('ε', () => inp.set(inp.value + 'ε')); v.button('∪', () => inp.set(inp.value + '|')); }
  return { inp, cur, set: (s) => inp.set(s) };
}
/** Strings of each length as green chips, one row per length (rows[k] = array of strings). */
export function drawLangRows(P, rows, alphaSize, o = {}) {
  const rh = o.rh ?? 22, top = o.top ?? 8, x0 = o.x0 ?? 62;
  rows.forEach((row, k) => {
    const y = top + k * rh; let x = x0;
    P.sans(`|w| = ${k}`, 10, y + rh / 2, { align: 'left', size: 11, color: 'muted' });
    P.text(`${row.length} / ${alphaSize ** k}`, P.W - 10, y + rh / 2, { align: 'right', size: 11.5, weight: 600, color: row.length ? 'green' : 'muted' });
    let shown = 0;
    for (const u of row) {
      const t = u === '' ? EPS : u, wpx = P.tw(t, 11.5) + 10;
      if (x + wpx > P.W - 96) { P.sans(`+ ${row.length - shown} more`, x + 2, y + rh / 2, { align: 'left', size: 11, color: 'muted' }); break; }
      P.box(x, y + 2, wpx, rh - 5, { r: 4, fill: o.color ?? 'green', alpha: 0.16, stroke: o.color ?? 'green', strokeAlpha: 0.6 });
      P.text(t, x + wpx / 2, y + rh / 2, { size: 11.5, color: 'ink' });
      x += wpx + 5; shown++;
    }
    if (!row.length) P.text('—', x + 6, y + rh / 2, { size: 12, color: 'faint' });
  });
}
export const tt = (u) => (u ? `\\mathtt{${u}}` : '\\varepsilon');
export const texName3 = (N, q) => String(N.states.find((s) => s.id === q)?.label ?? q).replace(/\$/g, '');
export const setStr = (S) => '{' + S.join(',') + '}';
export const setTex = (N, S) => (S.length ? '\\{' + S.map((q) => texName3(N, q)).join(',') + '\\}' : '\\varnothing');
/** Barcode rows: for each length k ≤ n, one cell per string in lexicographic order, coloured by colorOf(string). */
export function drawBarcode(P, alpha, n, colorOf, o = {}) {
  const rows = n + 1, rh = (P.H - 8) / rows, L0 = o.l0 ?? 54, L1 = P.W - (o.r ?? 70);
  for (let k = 0; k <= n; k++) {
    const strs = layer(alpha, k), bw = (L1 - L0) / strs.length, y = 4 + k * rh; let hits = 0;
    P.sans(`n = ${k}`, 10, y + rh / 2, { align: 'left', size: 10.5, color: 'muted' });
    strs.forEach((u, j) => { const c = colorOf(u); if (c && c.hit) hits++; P.box(L0 + j * bw, y + 2, Math.max(1, bw - (bw > 3 ? 1 : 0)), rh - 4, { r: bw > 6 ? 2 : 0, fill: c ? c.color : 'faint', alpha: c ? c.alpha ?? 0.75 : 0.22, stroke: c?.outline ? c.outline : false, width: 1.4 }); });
    P.text(`${hits}`, P.W - 12, y + rh / 2, { align: 'right', size: 11, weight: 600, color: 'green' });
  }
}
