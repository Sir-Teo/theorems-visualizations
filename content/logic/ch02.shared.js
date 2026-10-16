// Logic & Foundations — Chapter 2: helpers shared by ch02.js and ch02-b.js.
// A small propositional toolkit: tokenizer and parsers (precedence and Enderton's fully parenthesised
// grammar), evaluation and truth tables, normal forms (canonical, distributive, Tseitin), a DPLL solver
// with work counters, resolution with proof extraction, random k-CNF, and a seeded RNG.

// ---------------------------------------------------------------- tokens
const OPS = {
  '¬': 'not', '~': 'not', '!': 'not',
  '∧': 'and', '&': 'and', '/\\': 'and',
  '∨': 'or', '|': 'or', '\\/': 'or',
  '→': 'imp', '->': 'imp', '=>': 'imp', '⊃': 'imp',
  '↔': 'iff', '<->': 'iff', '<=>': 'iff', '≡': 'iff',
  '⊕': 'xor', '^': 'and', '+': 'xor',
  '↑': 'nand', '↓': 'nor',
};
const MULTI = ['<->', '<=>', '->', '=>', '/\\', '\\/'];
export const SYM = { not: '¬', and: '∧', or: '∨', imp: '→', iff: '↔', xor: '⊕', nand: '↑', nor: '↓' };
export const TEXOP = { not: '\\neg ', and: '\\land', or: '\\lor', imp: '\\to', iff: '\\leftrightarrow', xor: '\\oplus', nand: '\\uparrow', nor: '\\downarrow' };
const PREC = { iff: 1, imp: 2, xor: 3, or: 4, nor: 4, and: 5, nand: 5 };
export const BIN = { and: (a, b) => a && b, or: (a, b) => a || b, imp: (a, b) => !a || b, iff: (a, b) => a === b, xor: (a, b) => a !== b, nand: (a, b) => !(a && b), nor: (a, b) => !(a || b) };

/** Split a string into tokens {t: 'var'|'op'|'('|')'|'const', v, pos}. Throws {msg, pos}. */
export function tokenize(src) {
  const out = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '(' || c === ')') { out.push({ t: c, v: c, pos: i }); i++; continue; }
    const m = MULTI.find((w) => src.startsWith(w, i));
    if (m) { out.push({ t: 'op', v: OPS[m], pos: i }); i += m.length; continue; }
    if (c === '⊤' || c === '⊥') { out.push({ t: 'const', v: c === '⊤', pos: i }); i++; continue; }
    if (OPS[c]) { out.push({ t: 'op', v: OPS[c], pos: i }); i++; continue; }
    if (/[A-Za-z]/.test(c)) {
      let j = i + 1; while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const w = src.slice(i, j), lw = w.toLowerCase();
      const word = { not: 'not', and: 'and', or: 'or', xor: 'xor', nand: 'nand', nor: 'nor', implies: 'imp', iff: 'iff' }[lw];
      if (word) out.push({ t: 'op', v: word, pos: i });
      else if (w === 'T' || w === 'F') out.push({ t: 'const', v: w === 'T', pos: i });
      else out.push({ t: 'var', v: w, pos: i });
      i = j; continue;
    }
    if (c === '1' || c === '0') { out.push({ t: 'const', v: c === '1', pos: i }); i++; continue; }
    throw { msg: `unexpected symbol “${c}”`, pos: i };
  }
  return out;
}

const V = (name) => ({ op: 'var', name });
const N = (a) => ({ op: 'not', a });
const B = (op, a, b) => ({ op, a, b });
export const mk = { V, N, B, C: (val) => ({ op: 'const', val }) };

/** Precedence parser: ¬ > ∧,↑ > ∨,↓ > ⊕ > → > ↔; → is right associative. Returns {ast} or {error, pos}. */
export function parse(src) {
  let toks;
  try { toks = tokenize(src); } catch (e) { return { error: e.msg, pos: e.pos }; }
  let k = 0;
  const peek = () => toks[k];
  const fail = (msg) => { throw { msg, pos: peek() ? peek().pos : src.length }; };
  const atom = () => {
    const t = peek();
    if (!t) fail('formula ends too early');
    if (t.t === 'op' && t.v === 'not') { k++; return N(atom()); }
    if (t.t === 'var') { k++; return V(t.v); }
    if (t.t === 'const') { k++; return { op: 'const', val: t.v }; }
    if (t.t === '(') { k++; const e = expr(0); if (!peek() || peek().t !== ')') fail('missing “)”'); k++; return e; }
    fail(t.t === ')' ? 'unexpected “)”' : `“${SYM[t.v] || t.v}” needs a left operand`);
  };
  const expr = (minP) => {
    let lhs = atom();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op' || t.v === 'not') break;
      const p = PREC[t.v]; if (p < minP) break;
      k++;
      const rhs = expr(t.v === 'imp' ? p : p + 1);
      lhs = B(t.v, lhs, rhs);
    }
    return lhs;
  };
  try {
    if (!toks.length) return { error: 'empty formula', pos: 0 };
    const ast = expr(0);
    if (k < toks.length) fail(toks[k].t === ')' ? 'unbalanced “)”' : 'two formulas side by side need a connective');
    return { ast };
  } catch (e) { return { error: e.msg, pos: e.pos }; }
}

/** Enderton's grammar: letter | (¬α) | (α □ β). Also accepts ¬α without parentheses. {ast, toks} or {error, pos, toks}. */
export function parseStrict(src) {
  let toks;
  try { toks = tokenize(src); } catch (e) { return { error: e.msg, pos: e.pos, toks: [] }; }
  let k = 0;
  const fail = (msg) => { throw { msg, at: k }; };
  const F = () => {
    const t = toks[k];
    if (!t) fail('the string ends before the formula does');
    if (t.t === 'var') { k++; return V(t.v); }
    if (t.t === 'const') { k++; return { op: 'const', val: t.v }; }
    if (t.t === 'op' && t.v === 'not') { k++; return N(F()); }
    if (t.t === '(') {
      k++;
      const negFirst = toks[k] && toks[k].t === 'op' && toks[k].v === 'not';
      const a = F();
      const o = toks[k];
      if (o && o.t === ')') { if (negFirst && a.op === 'not') { k++; return a; } fail('a pair of parentheses around a single letter or formula is not allowed'); }
      if (!o || o.t !== 'op' || o.v === 'not') fail('expected a binary connective');
      k++;
      const b = F();
      if (!toks[k] || toks[k].t !== ')') fail(toks[k] && toks[k].t === 'op' ? 'a binary connective needs its own parentheses' : 'expected “)”');
      k++;
      return B(o.v, a, b);
    }
    fail(t.t === ')' ? 'unexpected “)”' : 'a binary connective needs a left operand');
  };
  try {
    if (!toks.length) return { error: 'empty string', at: 0, toks };
    const ast = F();
    if (k < toks.length) fail('symbols left over after a complete formula');
    return { ast, toks };
  } catch (e) { return { error: e.msg, at: e.at, toks }; }
}

// ---------------------------------------------------------------- structure
export function letters(ast, out = new Set()) {
  if (ast.op === 'var') out.add(ast.name);
  else if (ast.op === 'not') letters(ast.a, out);
  else if (ast.a) { letters(ast.a, out); letters(ast.b, out); }
  return out;
}
/** Sort letters naturally (p, q, r, s, … then p1, p2, … by number). */
export function sortLetters(set) {
  return [...set].sort((a, b) => {
    const ma = a.match(/^([A-Za-z_]+)(\d*)$/), mb = b.match(/^([A-Za-z_]+)(\d*)$/);
    if (ma && mb && ma[1] === mb[1]) return (+ma[2] || 0) - (+mb[2] || 0);
    return a < b ? -1 : a > b ? 1 : 0;
  });
}
export const lettersOf = (ast) => sortLetters(letters(ast));
export function size(ast) { return ast.op === 'var' || ast.op === 'const' ? 1 : ast.op === 'not' ? 1 + size(ast.a) : 1 + size(ast.a) + size(ast.b); }
export function depth(ast) { return ast.op === 'var' || ast.op === 'const' ? 0 : ast.op === 'not' ? 1 + depth(ast.a) : 1 + Math.max(depth(ast.a), depth(ast.b)); }
export function equalAst(x, y) {
  if (x.op !== y.op) return false;
  if (x.op === 'var') return x.name === y.name;
  if (x.op === 'const') return x.val === y.val;
  if (x.op === 'not') return equalAst(x.a, y.a);
  return equalAst(x.a, y.a) && equalAst(x.b, y.b);
}
/** Post-order list of nodes (children before parents). */
export function postorder(ast, out = []) {
  if (ast.op === 'not') postorder(ast.a, out);
  else if (ast.a) { postorder(ast.a, out); postorder(ast.b, out); }
  out.push(ast); return out;
}

/** Letter name → TeX (p1 → p_{1}). */
export const letterTex = (n) => { const m = n.match(/^([A-Za-z]+)_?(\d+)$/); return m ? `${m[1]}_{${m[2]}}` : n.length > 1 ? `\\mathit{${n}}` : n; };
/** TeX with minimal parentheses (mode 'min') or Enderton's full parentheses ('full'). */
export function toTex(ast, mode = 'min', parentP = 0, side = '') {
  if (ast.op === 'var') return letterTex(ast.name);
  if (ast.op === 'const') return ast.val ? '\\top' : '\\bot';
  if (ast.op === 'not') { const s = '\\neg ' + toTex(ast.a, mode, 9); return mode === 'full' ? `(${s})` : s; }
  const p = PREC[ast.op];
  const s = `${toTex(ast.a, mode, p, 'l')} ${TEXOP[ast.op]} ${toTex(ast.b, mode, p, 'r')}`;
  if (mode === 'full') return `(${s})`;
  const need = p < parentP || (p === parentP && (ast.op === 'imp' ? side === 'l' : side === 'r' || ast.op === 'nand' || ast.op === 'nor'));
  return need ? `(${s})` : s;
}
/** Plain unicode string (same parenthesisation rules). */
export function toStr(ast, mode = 'min', parentP = 0, side = '') {
  if (ast.op === 'var') return ast.name;
  if (ast.op === 'const') return ast.val ? '⊤' : '⊥';
  if (ast.op === 'not') { const s = '¬' + toStr(ast.a, mode, 9); return mode === 'full' ? `(${s})` : s; }
  const p = PREC[ast.op];
  const s = `${toStr(ast.a, mode, p, 'l')} ${SYM[ast.op]} ${toStr(ast.b, mode, p, 'r')}`;
  if (mode === 'full') return `(${s})`;
  const need = p < parentP || (p === parentP && (ast.op === 'imp' ? side === 'l' : side === 'r' || ast.op === 'nand' || ast.op === 'nor'));
  return need ? `(${s})` : s;
}

// ---------------------------------------------------------------- semantics
/** Evaluate under env: object name → boolean. */
export function evaluate(ast, env) {
  switch (ast.op) {
    case 'var': return !!env[ast.name];
    case 'const': return ast.val;
    case 'not': return !evaluate(ast.a, env);
    default: return BIN[ast.op](evaluate(ast.a, env), evaluate(ast.b, env));
  }
}
/** Truth-table convention used throughout: row i (0 = top) gives letter j the value of bit (n−1−j) of i, **inverted**, so row 0 is all T. */
export const rowVal = (i, j, n) => !((i >> (n - 1 - j)) & 1);
export function rowEnv(i, vars) { const env = {}; vars.forEach((x, j) => { env[x] = rowVal(i, j, vars.length); }); return env; }
/** Column of truth values over all 2ⁿ rows (Uint8Array). */
export function table(ast, vars) {
  const n = vars.length, R = 1 << n, out = new Uint8Array(R);
  for (let i = 0; i < R; i++) out[i] = evaluate(ast, rowEnv(i, vars)) ? 1 : 0;
  return out;
}
/** Fast evaluator over a bitmask of letter values (bit j = letter j). */
export function compileMask(ast, vars) {
  const idx = Object.fromEntries(vars.map((x, j) => [x, j]));
  const go = (e) => {
    if (e.op === 'var') { const j = idx[e.name]; return (m) => ((m >> j) & 1) === 1; }
    if (e.op === 'const') { const c = e.val; return () => c; }
    if (e.op === 'not') { const f = go(e.a); return (m) => !f(m); }
    const f = go(e.a), g = go(e.b), o = BIN[e.op]; return (m) => o(f(m), g(m));
  };
  return go(ast);
}

// ---------------------------------------------------------------- normal forms
/** Literal as {v: name, neg}. Clause/term = array of literals. */
export const litTex = (l) => (l.neg ? '\\neg ' : '') + letterTex(l.v);
export const litStr = (l) => (l.neg ? '¬' : '') + l.v;
/** Canonical DNF terms (true rows) and CNF clauses (false rows) of a table over vars. */
export function canonical(col, vars) {
  const n = vars.length, dnf = [], cnf = [];
  for (let i = 0; i < col.length; i++) {
    const lits = vars.map((x, j) => ({ v: x, neg: !rowVal(i, j, n) }));
    if (col[i]) dnf.push(lits); else cnf.push(lits.map((l) => ({ v: l.v, neg: !l.neg })));
  }
  return { dnf, cnf };
}
export function dnfAst(terms) {
  if (!terms.length) return { op: 'const', val: false };
  const t = terms.map((c) => c.map((l) => (l.neg ? N(V(l.v)) : V(l.v))).reduce((a, b) => B('and', a, b)));
  return t.reduce((a, b) => B('or', a, b));
}
export function cnfAst(clauses) {
  if (!clauses.length) return { op: 'const', val: true };
  const t = clauses.map((c) => (c.length ? c.map((l) => (l.neg ? N(V(l.v)) : V(l.v))).reduce((a, b) => B('or', a, b)) : { op: 'const', val: false }));
  return t.reduce((a, b) => B('and', a, b));
}
/** Negation normal form using only ∧, ∨, ¬ on letters. */
export function nnf(e, neg = false) {
  switch (e.op) {
    case 'var': return neg ? N(e) : e;
    case 'const': return { op: 'const', val: neg ? !e.val : e.val };
    case 'not': return nnf(e.a, !neg);
    case 'and': return B(neg ? 'or' : 'and', nnf(e.a, neg), nnf(e.b, neg));
    case 'or': return B(neg ? 'and' : 'or', nnf(e.a, neg), nnf(e.b, neg));
    case 'imp': return nnf(B('or', N(e.a), e.b), neg);
    case 'nand': return nnf(N(B('and', e.a, e.b)), neg);
    case 'nor': return nnf(N(B('or', e.a, e.b)), neg);
    case 'iff': return nnf(B('and', B('imp', e.a, e.b), B('imp', e.b, e.a)), neg);
    case 'xor': return nnf(B('or', B('and', e.a, N(e.b)), B('and', N(e.a), e.b)), neg);
  }
}
/** CNF by distributing ∨ over ∧ (no simplification beyond removing duplicate literals): array of clauses. Caps at `cap` clauses. */
export function distributeCNF(e, cap = 1 << 16) {
  const go = (x) => {
    if (x.op === 'var') return [[{ v: x.name, neg: false }]];
    if (x.op === 'not') return [[{ v: x.a.name, neg: true }]];
    if (x.op === 'const') return x.val ? [] : [[]];
    if (x.op === 'and') return go(x.a).concat(go(x.b));
    const A = go(x.a), Bc = go(x.b), out = [];
    for (const c of A) for (const d of Bc) { out.push(c.concat(d)); if (out.length > cap) throw new Error('cap'); }
    return out;
  };
  return go(nnf(e));
}
/** Tseitin encoding: one fresh letter per connective; returns clauses (letters as names). */
export function tseitin(e) {
  const clauses = []; let k = 0;
  const L = (v, neg = false) => ({ v, neg });
  const go = (x) => {
    if (x.op === 'var') return x.name;
    const g = `t${++k}`;
    if (x.op === 'not') { const a = go(x.a); clauses.push([L(g, true), L(a, true)], [L(g), L(a)]); return g; }
    const a = go(x.a), b = go(x.b);
    if (x.op === 'and') clauses.push([L(g, true), L(a)], [L(g, true), L(b)], [L(g), L(a, true), L(b, true)]);
    else if (x.op === 'or') clauses.push([L(g), L(a, true)], [L(g), L(b, true)], [L(g, true), L(a), L(b)]);
    else throw new Error('tseitin: use ∧ ∨ ¬');
    return g;
  };
  const top = go(nnf(e));
  clauses.push([L(top)]);
  return clauses;
}

// ---------------------------------------------------------------- integer clauses, DPLL, resolution
/** Clauses over names → integer clauses (±(index+1)) and the variable list. */
export function toInt(clauses, vars = null) {
  const names = vars ? [...vars] : sortLetters(new Set(clauses.flat().map((l) => l.v)));
  const idx = new Map(names.map((x, j) => [x, j + 1]));
  for (const c of clauses) for (const l of c) if (!idx.has(l.v)) { names.push(l.v); idx.set(l.v, names.length); }
  return { names, cls: clauses.map((c) => c.map((l) => (l.neg ? -idx.get(l.v) : idx.get(l.v)))) };
}
/** Normalise an integer clause: sorted, no duplicates; null if it is a tautology (contains x and −x). */
export function normClause(c) {
  const s = [...new Set(c)].sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
  for (let i = 1; i < s.length; i++) if (s[i] === -s[i - 1]) return null;
  return s;
}
/**
 * DPLL with unit propagation; branches on the most frequent unassigned variable in the shortest open clauses.
 * Returns {sat, model (array index 1..n of booleans), nodes (decisions), props (unit propagations), conflicts (dead ends), work (clause visits)}.
 */
export function dpll(cls, n, { limit = 2e6 } = {}) {
  const val = new Int8Array(n + 1); // 0 unassigned, 1 true, −1 false
  let nodes = 0, props = 0, work = 0, conflicts = 0, aborted = false;
  const litVal = (l) => (l > 0 ? val[l] : -val[-l]);
  const trail = [];
  const assign = (l) => { val[Math.abs(l)] = l > 0 ? 1 : -1; trail.push(Math.abs(l)); };
  const undo = (to) => { while (trail.length > to) val[trail.pop()] = 0; };
  // returns false on conflict
  const propagate = () => {
    for (let changed = true; changed;) {
      changed = false;
      for (const c of cls) {
        work++;
        let free = 0, last = 0, sat = false;
        for (const l of c) { const x = litVal(l); if (x === 1) { sat = true; break; } if (x === 0) { free++; last = l; } }
        if (sat) continue;
        if (free === 0) return false;
        if (free === 1) { assign(last); props++; changed = true; }
      }
    }
    return true;
  };
  const choose = () => {
    let best = 0, bestLen = 1e9; const cnt = new Float64Array(n + 1);
    for (const c of cls) {
      work++;
      let free = 0, sat = false;
      for (const l of c) { const x = litVal(l); if (x === 1) { sat = true; break; } if (x === 0) free++; }
      if (sat || free === 0) continue;
      const w = 2 ** -free;
      for (const l of c) if (litVal(l) === 0) cnt[Math.abs(l)] += w;
      if (free < bestLen) bestLen = free;
    }
    let bw = 0; for (let x = 1; x <= n; x++) if (!val[x] && cnt[x] > bw) { bw = cnt[x]; best = x; }
    if (!best) for (let x = 1; x <= n; x++) if (!val[x]) return x;
    return best;
  };
  const rec = () => {
    if (work > limit) { aborted = true; return false; }
    if (!propagate()) { conflicts++; return false; }
    const x = choose();
    if (!x) return true;
    for (const l of [x, -x]) {
      nodes++;
      const save = trail.length;
      assign(l);
      if (rec()) return true;
      undo(save);
      if (aborted) return false;
    }
    return false;
  };
  const sat = rec();
  return { sat, aborted, nodes, props, work, conflicts, model: sat ? Array.from(val, (x) => x === 1) : null };
}
/** Brute-force check by truth table over integer clauses: rows scanned and clause checks until a model is found. */
export function bruteSat(cls, n) {
  const R = 2 ** n; let checks = 0;
  for (let m = 0; m < R; m++) {
    let ok = true;
    for (const c of cls) { checks++; let s = false; for (const l of c) { const b = (m >> (Math.abs(l) - 1)) & 1; if ((l > 0) === (b === 1)) { s = true; break; } } if (!s) { ok = false; break; } }
    if (ok) return { sat: true, rows: m + 1, checks };
  }
  return { sat: false, rows: R, checks };
}
/**
 * Resolution saturation, level by level, with tautology removal and forward subsumption.
 * Returns {refuted, clauses: [{c, parents: [i, j] | null, pivot, level}], empty (index), proof (indices in order)}.
 */
export function resolve(cls, { maxClauses = 400 } = {}) {
  const all = [], key = new Map();
  const subsumed = (c) => all.some((d) => d.c.length <= c.length && d.c.every((l) => c.includes(l)));
  const add = (c, parents, pivot, level) => {
    const k = c.join(','); if (key.has(k)) return -1;
    if (subsumed(c)) return -1;
    key.set(k, all.length); all.push({ c, parents, pivot, level }); return all.length - 1;
  };
  for (const c0 of cls) { const c = normClause(c0); if (c) add(c, null, 0, 0); }
  let empty = all.findIndex((d) => d.c.length === 0);
  let level = 0, done = 0;
  while (empty < 0) {
    level++;
    const start = all.length; let added = 0;
    for (let i = 0; i < start && empty < 0; i++) for (let j = Math.max(i + 1, done); j < start && empty < 0; j++) {
      if (j < done && i < done) continue;
      const a = all[i].c, b = all[j].c;
      for (const l of a) {
        if (!b.includes(-l)) continue;
        const r = normClause(a.filter((x) => x !== l).concat(b.filter((x) => x !== -l)));
        if (!r) continue;
        const id = add(r, [i, j], Math.abs(l), level);
        if (id >= 0) { added++; if (r.length === 0) { empty = id; break; } }
        if (all.length > maxClauses) break;
      }
      if (all.length > maxClauses) break;
    }
    done = start;
    if (!added || all.length > maxClauses) break;
  }
  const proof = [];
  if (empty >= 0) {
    const seen = new Set();
    const walk = (i) => { if (seen.has(i)) return; seen.add(i); const p = all[i].parents; if (p) { walk(p[0]); walk(p[1]); } proof.push(i); };
    walk(empty);
  }
  return { refuted: empty >= 0, clauses: all, empty, proof, capped: all.length > maxClauses };
}
export const clauseStr = (c, names) => (c.length ? c.map((l) => (l < 0 ? '¬' : '') + names[Math.abs(l) - 1]).join(' ∨ ') : '□');
export const clauseTex = (c, names) => (c.length ? c.map((l) => (l < 0 ? '\\neg ' : '') + letterTex(names[Math.abs(l) - 1])).join(' \\lor ') : '\\square');

// ---------------------------------------------------------------- randomness
/** Mulberry32 seeded RNG in [0, 1). */
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Random k-CNF: m clauses over n variables, k distinct variables per clause, random signs. */
export function randomKCNF(n, m, k, r) {
  const cls = [];
  for (let i = 0; i < m; i++) {
    const vs = new Set(); while (vs.size < k) vs.add(1 + Math.floor(r() * n));
    cls.push([...vs].map((x) => (r() < 0.5 ? -x : x)));
  }
  return cls;
}

// ---------------------------------------------------------------- tree layout
/**
 * Tidy-ish layout of a formula tree: leaves at consecutive x, parents centred over children, y = −depth.
 * Returns {nodes: [{e, x, y, parent, kids, id}], width, depth}.
 */
export function layoutTree(ast) {
  const nodes = []; let leaf = 0;
  const go = (e, d, parent) => {
    const nd = { e, y: -d, parent, kids: [], id: nodes.length };
    nodes.push(nd);
    if (e.op === 'not') { const c = go(e.a, d + 1, nd); nd.kids.push(c); nd.x = c.x; }
    else if (e.a) { const a = go(e.a, d + 1, nd), b = go(e.b, d + 1, nd); nd.kids.push(a, b); nd.x = (a.x + b.x) / 2; }
    else nd.x = leaf++;
    return nd;
  };
  go(ast, 0, null);
  // a negation directly above a leaf would sit on the same x: fine, it is one level up.
  return { nodes, width: Math.max(1, leaf), depth: Math.max(0, ...nodes.map((n) => -n.y)) };
}
/** Label of a tree node: connective symbol or letter. */
export const nodeLabel = (e) => (e.op === 'var' ? e.name : e.op === 'const' ? (e.val ? '⊤' : '⊥') : SYM[e.op]);

/**
 * Draw a laid-out formula tree on a stage whose view the caller sets (x in [−0.6, width − 0.4], y in [−depth − 0.6, 0.6]).
 * opts: fill(nd) → colour|null, ring(nd), note(nd) → string, noteColor(nd), r (px), labelColor(nd), edgeColor(nd)
 */
export function drawTree(s, L, opts = {}) {
  const r = opts.r ?? 14;
  for (const nd of L.nodes) for (const c of nd.kids) s.line(nd.x, nd.y, c.x, c.y, { color: (opts.edgeColor && opts.edgeColor(c)) || 'muted', width: 1.6 });
  for (const nd of L.nodes) {
    const f = opts.fill ? opts.fill(nd) : null;
    const ring = opts.ring && opts.ring(nd);
    if (ring) { s.dot(nd.x, nd.y, { r: r + 4.5, color: ring, ring: false }); s.dot(nd.x, nd.y, { r: r + 1, color: 'panel', ring: false }); }
    s.dot(nd.x, nd.y, { r, color: 'panel', ring: false });
    if (f) { s.dot(nd.x, nd.y, { r, color: f, alpha: 0.2, ring: false }); s.dot(nd.x, nd.y, { r, color: f, hollow: true, width: 2.2, alpha: 1 }); }
    else s.dot(nd.x, nd.y, { r, color: 'muted', hollow: true, width: 1.6 });
    const leafy = nd.e.op === 'var';
    s.text(nodeLabel(nd.e), nd.x, nd.y, { align: 'center', baseline: 'middle', size: leafy ? 14 : 15, math: leafy, weight: leafy ? 400 : 600, color: (opts.labelColor && opts.labelColor(nd)) || 'ink' });
    const note = opts.note && opts.note(nd);
    if (note != null && note !== '') s.text(String(note), nd.x, nd.y, { dx: r + 4, dy: -r + 2, align: 'left', baseline: 'middle', size: 11, weight: 600, color: (opts.noteColor && opts.noteColor(nd)) || 'accent' });
  }
}

/** Pick a nice set of rows-first letters for a function table: names p, q, r, s, t, u. */
export const LETTERS = ['p', 'q', 'r', 's', 't', 'u'];
