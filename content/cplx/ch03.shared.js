// Computational Complexity — Chapter 3 (coNP and the polynomial hierarchy): helpers shared by ch03.js and ch03-b.js.
// Re-exports the chapter-2 helpers (CNF, DPLL, clamp, big, ...). New here: a Boolean-formula parser, exact minimal formula
// sizes over three variables, Pratt certificates, full QBF game trees with strategies and depth-first evaluation traces.
export * from './ch02.shared.js';
import { cnfSat } from './ch02.shared.js';

// ---------------------------------------------------------------------------------------------------------------
// Boolean formulas typed by the reader. Operators (tightest first): ~ ! ¬  |  & ∧ *  |  ^ ⊕  |  | ∨ +  |  -> →  |  <-> ↔.
// Variables are single letters; 0 and 1 are constants.
export function parseBool(src) {
  const s = String(src).replace(/\s+/g, ''), toks = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (s.startsWith('<->', i) || s.startsWith('<=>', i)) { toks.push('iff'); i += 3; continue; }
    if (s.startsWith('->', i) || s.startsWith('=>', i)) { toks.push('imp'); i += 2; continue; }
    if (c === '↔') toks.push('iff'); else if (c === '→') toks.push('imp');
    else if ('~!¬'.includes(c)) toks.push('not'); else if ('&∧*'.includes(c)) toks.push('and');
    else if ('|∨+'.includes(c)) toks.push('or'); else if ('^⊕'.includes(c)) toks.push('xor');
    else if (c === '(' || c === ')') toks.push(c);
    else if (c === '0' || c === '1') toks.push({ c: +c });
    else if (/[a-zA-Z]/.test(c)) toks.push({ v: c.toLowerCase() });
    else return { ok: false, error: `unexpected “${c}”` };
    i++;
  }
  if (!toks.length) return { ok: false, error: 'empty formula' };
  let p = 0;
  const peek = () => toks[p], eat = () => toks[p++];
  const bin = (next, ops, right = false) => () => {
    let a = next();
    while (typeof peek() === 'string' && ops.includes(peek())) {
      const op = eat();
      const b = right ? parseImp() : next();
      a = { t: op, a, b };
      if (right) break;
    }
    return a;
  };
  function atom() {
    const t = eat();
    if (t === undefined) throw new Error('formula ends too early');
    if (t === 'not') return { t: 'not', a: atom() };
    if (t === '(') { const e = parseIff(); if (eat() !== ')') throw new Error('missing )'); return e; }
    if (typeof t === 'object') return t.v !== undefined ? { t: 'var', v: t.v } : { t: 'const', b: t.c };
    throw new Error(`unexpected “${t === 'iff' ? '↔' : t === 'imp' ? '→' : t === ')' ? ')' : t === 'and' ? '∧' : t === 'or' ? '∨' : '⊕'}”`);
  }
  const parseAnd = bin(atom, ['and']), parseXor = bin(parseAnd, ['xor']), parseOr = bin(parseXor, ['or']);
  function parseImp() { const a = parseOr(); if (peek() === 'imp') { eat(); return { t: 'imp', a, b: parseImp() }; } return a; }
  const parseIff = bin(parseImp, ['iff']);
  try {
    const ast = parseIff();
    if (p < toks.length) throw new Error(`unexpected “${toks[p] === ')' ? ')' : typeof toks[p] === 'object' ? (toks[p].v ?? toks[p].c) : toks[p]}”`);
    const vars = [...new Set(collectVars(ast))].sort();
    return { ok: true, ast, vars };
  } catch (e) { return { ok: false, error: e.message }; }
}
function collectVars(a, out = []) { if (a.t === 'var') out.push(a.v); else if (a.t !== 'const') { collectVars(a.a, out); if (a.b) collectVars(a.b, out); } return out; }
export function evalAst(a, env) {
  switch (a.t) {
    case 'var': return env[a.v] ? 1 : 0;
    case 'const': return a.b;
    case 'not': return evalAst(a.a, env) ? 0 : 1;
    case 'and': return evalAst(a.a, env) & evalAst(a.b, env);
    case 'or': return evalAst(a.a, env) | evalAst(a.b, env);
    case 'xor': return evalAst(a.a, env) ^ evalAst(a.b, env);
    case 'imp': return evalAst(a.a, env) ? evalAst(a.b, env) : 1;
    default: return evalAst(a.a, env) === evalAst(a.b, env) ? 1 : 0;
  }
}
/** Number of variable/constant occurrences (the usual "formula size" for De Morgan formulas). */
export const leafCount = (a) => (a.t === 'var' || a.t === 'const' ? 1 : leafCount(a.a) + (a.b ? leafCount(a.b) : 0));
const SYM = { and: '∧', or: '∨', xor: '⊕', imp: '→', iff: '↔' }, TSYM = { and: '\\land', or: '\\lor', xor: '\\oplus', imp: '\\to', iff: '\\leftrightarrow' };
export function astText(a, top = true) {
  if (a.t === 'var') return a.v;
  if (a.t === 'const') return String(a.b);
  if (a.t === 'not') return `¬${astText(a.a, false)}`;
  const s = `${astText(a.a, false)} ${SYM[a.t]} ${astText(a.b, false)}`;
  return top ? s : `(${s})`;
}
export function astTex(a, top = true) {
  if (a.t === 'var') return a.v;
  if (a.t === 'const') return String(a.b);
  if (a.t === 'not') return `\\lnot ${astTex(a.a, false)}`;
  const s = `${astTex(a.a, false)} ${TSYM[a.t]} ${astTex(a.b, false)}`;
  return top ? s : `(${s})`;
}
/** Truth table of a parsed formula over the variable list `vars`: array of 2^n bits, row r has var j = bit (n-1-j) of r. */
export function truthTable(ast, vars) {
  const n = vars.length, out = [];
  for (let r = 0; r < (1 << n); r++) { const env = {}; vars.forEach((x, j) => { env[x] = (r >> (n - 1 - j)) & 1; }); out.push(evalAst(ast, env)); }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Exact minimal De Morgan formula sizes over x, y, z (∧, ∨, ¬ allowed anywhere; size = number of variable occurrences).
// A function is an 8-bit mask: bit r is its value at row r (x = bit 2 of r, y = bit 1, z = bit 0). Bellman–Ford over all 256.
let minCache = null;
export function minFormulas3() {
  if (minCache) return minCache;
  const INF = 1e9, cost = Array(256).fill(INF), expr = Array(256).fill(null);
  const leaf = [['x', 0xf0], ['y', 0xcc], ['z', 0xaa]];
  for (const [nm, m] of leaf) { cost[m] = 1; expr[m] = nm; }
  const paren = (e) => (/[∧∨]/.test(e) && !/^\(.*\)$/.test(e) ? `(${e})` : e);
  for (let changed = true; changed;) {
    changed = false;
    for (let f = 0; f < 256; f++) {
      if (cost[f] >= INF) continue;
      const nf = ~f & 255;
      if (cost[f] < cost[nf]) { cost[nf] = cost[f]; expr[nf] = /^[xyz]$/.test(expr[f]) ? `¬${expr[f]}` : /^¬[xyz]$/.test(expr[f]) ? expr[f][1] : `¬${paren(expr[f]).startsWith('(') ? paren(expr[f]) : `(${expr[f]})`}`; changed = true; }
      for (let g = f; g < 256; g++) {
        if (cost[g] >= INF) continue;
        const c = cost[f] + cost[g];
        const a = f & g, o = f | g;
        if (c < cost[a]) { cost[a] = c; expr[a] = `${paren(expr[f])} ∧ ${paren(expr[g])}`; changed = true; }
        if (c < cost[o]) { cost[o] = c; expr[o] = `${paren(expr[f])} ∨ ${paren(expr[g])}`; changed = true; }
      }
    }
  }
  minCache = { cost, expr };
  return minCache;
}
/** 8-bit mask of a parsed formula over (x, y, z); unused variables are fine, other letters are not. */
export function mask3(ast) {
  let m = 0;
  for (let r = 0; r < 8; r++) if (evalAst(ast, { x: (r >> 2) & 1, y: (r >> 1) & 1, z: r & 1 })) m |= 1 << r;
  return m;
}

// ---------------------------------------------------------------------------------------------------------------
// Number theory for Pratt certificates (Numbers below 2^53; products via BigInt).
export const mulmod = (a, b, m) => Number((BigInt(a) * BigInt(b)) % BigInt(m));
export function powmod(b, e, m) { let r = 1; b %= m; while (e > 0) { if (e % 2 === 1) r = mulmod(r, b, m); b = mulmod(b, b, m); e = Math.floor(e / 2); } return r; }
/** Prime factorization by trial division: [[p, e], ...]. */
export function factorInt(n) {
  const out = [];
  for (let p = 2; p * p <= n; p += p === 2 ? 1 : 2) { if (n % p === 0) { let e = 0; while (n % p === 0) { n /= p; e++; } out.push([p, e]); } }
  if (n > 1) out.push([n, 1]);
  return out;
}
export const isPrimeInt = (n) => n >= 2 && factorInt(n).length === 1 && factorInt(n)[0][1] === 1;
export function carmichaelLambda(n) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a), lcm = (a, b) => (a / gcd(a, b)) * b;
  let L = 1;
  for (const [p, e] of factorInt(n)) { const l = p === 2 ? (e >= 3 ? 2 ** (e - 2) : e === 2 ? 2 : 1) : (p ** (e - 1)) * (p - 1); L = lcm(L, l); }
  return L;
}
/** Pratt certificate tree of a prime p: {p, g, fac: [[q, e]], kids: [nodes for odd q]}; shared primes are re-used and marked dup. */
export function prattTree(p, seen = new Set()) {
  if (p === 2) return { p, base: true, dup: false, kids: [], fac: [] };
  const fac = factorInt(p - 1);
  let g = 2;
  for (;; g++) if (fac.every(([q]) => powmod(g, (p - 1) / q, p) !== 1)) break;
  const dup = seen.has(p); seen.add(p);
  const node = { p, g, fac, dup, kids: [] };
  if (dup) return node;
  for (const [q] of fac) node.kids.push(q === 2 ? { p: 2, base: true, kids: [], fac: [], dup: false } : prattTree(q, seen));
  return node;
}
/** Verify a Pratt node: returns {ok, checks:[…]} for the local conditions only. */
export function prattCheck(node) {
  if (node.base) return { ok: true, checks: ['2 is prime (base case)'] };
  const { p, g, fac } = node;
  const prod = fac.reduce((a, [q, e]) => a * q ** e, 1);
  const c1 = powmod(g, p - 1, p) === 1, c2 = fac.map(([q]) => [q, powmod(g, (p - 1) / q, p)]);
  return { ok: prod === p - 1 && c1 && c2.every(([, r]) => r !== 1), checks: [prod === p - 1, c1, c2], prod };
}
export function prattStats(node, acc = { lines: 0, bits: 0, depth: 0, distinct: new Set() }, d = 0) {
  acc.depth = Math.max(acc.depth, d);
  if (!node.dup && !acc.distinct.has(node.p)) { acc.distinct.add(node.p); acc.lines++; acc.bits += node.base ? 2 : Math.ceil(Math.log2(node.p + 1)) * 2 + node.fac.reduce((s, [q, e]) => s + Math.ceil(Math.log2(q + 1)) + Math.ceil(Math.log2(e + 1)), 0); }
  node.kids.forEach((k) => prattStats(k, acc, d + 1));
  return acc;
}

// ---------------------------------------------------------------------------------------------------------------
// QBF game trees. Variables 1..n are quantified in order; quant[i] = 'E' | 'A' (index 1..n); cl is a CNF over them.
// levels[d][i] = value of the subformula after fixing the first d variables to the d bits of i (most significant first).
export function qLevels(n, quant, cl) {
  const levels = [];
  const leaves = [];
  for (let i = 0; i < (1 << n); i++) { const a = [null]; for (let j = 0; j < n; j++) a.push((i >> (n - 1 - j)) & 1); leaves.push(cnfSat(cl, a) ? 1 : 0); }
  levels[n] = leaves;
  for (let d = n - 1; d >= 0; d--) {
    levels[d] = [];
    for (let i = 0; i < (1 << d); i++) { const a = levels[d + 1][2 * i], b = levels[d + 1][2 * i + 1]; levels[d][i] = quant[d + 1] === 'E' ? a | b : a & b; }
  }
  return levels;
}
/** The winning player's strategy tree: keys "d:i". The player is ∃ if the root is true, ∀ otherwise. */
export function qStrategy(n, quant, levels) {
  const win = levels[0][0] === 1 ? 1 : 0, keep = new Set(), mine = win ? 'E' : 'A';
  (function rec(d, i) {
    keep.add(`${d}:${i}`);
    if (d === n) return;
    if (quant[d + 1] === mine) { const c = [2 * i, 2 * i + 1].find((k) => levels[d + 1][k] === win); rec(d + 1, c); } else { rec(d + 1, 2 * i); rec(d + 1, 2 * i + 1); }
  })(0, 0);
  return { keep, win };
}
/** Depth-first evaluation with short-circuiting; returns the event trace {d, i, kind: 'enter'|'exit', val, stack}. */
export function qTrace(n, quant, levels) {
  const ev = [], stack = [];
  let maxStack = 0, visited = 0;
  (function rec(d, i) {
    stack.push([d, i]); visited++; maxStack = Math.max(maxStack, stack.length);
    ev.push({ d, i, kind: 'enter', stack: stack.map((x) => x.slice()) });
    let val;
    if (d === n) val = levels[n][i];
    else {
      const a = rec(d + 1, 2 * i);
      if (quant[d + 1] === 'E') val = a ? 1 : rec(d + 1, 2 * i + 1); else val = a ? rec(d + 1, 2 * i + 1) : 0;
    }
    ev.push({ d, i, kind: 'exit', val, stack: stack.map((x) => x.slice()) });
    stack.pop();
    return val;
  })(0, 0);
  return { ev, maxStack, visited };
}
/** Tree node position in a stage window [0,W]×[ytop, ybot]: depth d, index i. */
export const treePos = (d, i, n, W, y0, dy) => [(W * (i + 0.5)) / (1 << d), y0 - d * dy, n];
