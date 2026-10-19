// Logic & Foundations — Chapter 5: helpers shared by ch05.js and ch05-b.js.
// Re-exports the chapter-4 toolkit (first-order parser, model checker, finite structures, ...) and adds: exact
// fractions and a back-and-forth matcher, evaluators for infinite dense orders / pure sets / the naturals with
// successor (through the `cands` hook of the model checker), a real quantifier-elimination procedure for
// (N, 0, S), truncated power series (to take standard parts of difference quotients), Laurent series in an
// infinitesimal, and the catalogue of theories used by the categoricity items.
export * from './ch04.shared.js';
import { range, rng } from './ch04.shared.js';

// ---------------------------------------------------------------- fractions
const gcd2 = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
export const fr = (p, q = 1) => { if (q < 0) { p = -p; q = -q; } const g = gcd2(p, q) || 1; return { p: p / g, q: q / g }; };
export const frVal = (a) => a.p / a.q;
export const frCmp = (a, b) => a.p * b.q - b.p * a.q;
export const frKey = (a) => `${a.p}/${a.q}`;
export const frStr = (a) => (a.q === 1 ? `${a.p}`.replace('-', '−') : `${a.p}/${a.q}`.replace('-', '−'));
export const frTex = (a) => (a.q === 1 ? `${a.p}` : `${a.p < 0 ? '-' : ''}\\tfrac{${Math.abs(a.p)}}{${a.q}}`);
const floorDiv = (a, b) => Math.floor(a / b);
const ceilDiv = (a, b) => Math.ceil(a / b);

/** Rationals ordered by height |p| + q (then by value): 0, -1, 1, -2, -1/2, 1/2, 2, ... */
export function enumQ(count) {
  const out = [fr(0)];
  for (let h = 2; out.length < count; h++) {
    const grp = [];
    for (let q = 1; q < h; q++) { const p = h - q; if (gcd2(p, q) === 1) { grp.push(fr(p, q)); grp.push(fr(-p, q)); } }
    grp.sort(frCmp); out.push(...grp);
  }
  return out.slice(0, count);
}
/** Dyadic rationals j/2^k by denominator, in (0,1) or [0,1]. */
export function enumDyadic(count, closed = false) {
  const out = closed ? [fr(0), fr(1)] : [];
  for (let k = 1; out.length < count; k++) for (let j = 1; j < 2 ** k; j += 2) out.push(fr(j, 2 ** k));
  return out.slice(0, count);
}
/**
 * A fraction in the interval with ends lo, hi ({p,q} or null = unbounded), inclusive or not; the one with the smallest
 * denominator (powers of two only when dyadic), and among those the one nearest the middle (or to 0 if unbounded).
 * Returns null when the interval has no such fraction.
 */
export function pickIn(lo, hi, { loIn = false, hiIn = false, dyadic = false } = {}) {
  if (lo && hi && frCmp(lo, hi) > 0) return null;
  if (lo && hi && frCmp(lo, hi) === 0 && !(loIn && hiIn)) return null;
  for (let q = 1, step = 0; step < 40; step++, q = dyadic ? q * 2 : q + 1) {
    let pmin = -Infinity, pmax = Infinity;
    if (lo) pmin = loIn ? ceilDiv(lo.p * q, lo.q) : floorDiv(lo.p * q, lo.q) + 1;
    if (hi) pmax = hiIn ? floorDiv(hi.p * q, hi.q) : ceilDiv(hi.p * q, hi.q) - 1;
    if (lo && loIn && lo.p * q === pmin * lo.q) pmin++;     // never take an end of the carrier, which would
    if (hi && hiIn && hi.p * q === pmax * hi.q) pmax--;     // use up a distinguished point
    if (pmin > pmax) continue;
    let p;
    if (lo && hi) { const mid = (frVal(lo) + frVal(hi)) / 2 * q; p = Math.min(pmax, Math.max(pmin, Math.round(mid))); }
    else if (pmin <= 0 && pmax >= 0) p = 0; else p = pmin > 0 ? pmin : pmax;
    return fr(p, q);
  }
  return null;
}

/**
 * Back-and-forth between (Q, <) and the dyadic rationals of (0,1) (or of [0,1] when `closed`). Each step extends a finite
 * order-preserving matching by one pair: even steps take the first unmatched rational (forth), odd steps the first
 * unmatched dyadic (back); `mode: 'forth'` only ever goes forth. Stops at the first step that cannot be completed.
 */
export function backForth(steps, { mode = 'bf', closed = false } = {}) {
  const A = enumQ(500), B = enumDyadic(500, closed);
  const pairs = []; const usedA = new Set(), usedB = new Set(); let stuck = null;
  const lowB = fr(0), highB = fr(1);
  for (let t = 0; t < steps; t++) {
    const forth = mode === 'forth' || t % 2 === 0;
    if (forth) {
      const a = A.find((x) => !usedA.has(frKey(x)));
      let lower = null, upper = null;
      for (const p of pairs) { if (frCmp(p.a, a) < 0) lower = p; else if (frCmp(p.a, a) > 0 && !upper) upper = p; }
      const lo = lower ? lower.b : lowB, hi = upper ? upper.b : highB;
      const loIn = lower ? false : closed, hiIn = upper ? false : closed;
      const b = pickIn(lo, hi, { loIn, hiIn, dyadic: true });
      if (!b) { stuck = { t, dir: 'forth', elem: a, why: !lower && upper ? `nothing in the target lies below ${frStr(upper.b)}` : lower && !upper ? `nothing in the target lies above ${frStr(lower.b)}` : 'no point of the target fits' }; break; }
      pairs.push({ a, b, t, dir: 'forth' }); usedA.add(frKey(a)); usedB.add(frKey(b));
    } else {
      const b = B.find((x) => !usedB.has(frKey(x)));
      let lower = null, upper = null;
      for (const p of pairs.slice().sort((x, y) => frCmp(x.b, y.b))) { if (frCmp(p.b, b) < 0) lower = p; else if (frCmp(p.b, b) > 0 && !upper) upper = p; }
      const a = pickIn(lower ? lower.a : null, upper ? upper.a : null, { dyadic: false });
      pairs.push({ a, b, t, dir: 'back' }); usedA.add(frKey(a)); usedB.add(frKey(b));
    }
    pairs.sort((x, y) => frCmp(x.a, y.a));
  }
  return { pairs, stuck, A, B, usedA, usedB };
}

// ---------------------------------------------------------------- infinite structures through the `cands` hook
/** (carrier, <) for an interval of Q with the given ends (null = unbounded) and closedness. Witness candidates: the assigned values, one point in every gap, the ends. */
export function orderStruct(lo = null, hi = null, loIn = false, hiIn = false) {
  const cands = (env) => {
    const vs = [...new Set(Object.values(env).filter((x) => typeof x === 'number'))].sort((a, b) => a - b);
    const out = new Set(vs);
    if (lo !== null && loIn) out.add(lo);
    if (hi !== null && hiIn) out.add(hi);
    if (!vs.length) { out.add(lo === null && hi === null ? 0 : lo === null ? hi - 1 : hi === null ? lo + 1 : (lo + hi) / 2); }
    else {
      for (let i = 0; i + 1 < vs.length; i++) out.add((vs[i] + vs[i + 1]) / 2);
      const first = vs[0], last = vs[vs.length - 1];
      if (lo === null) out.add(first - 1); else if (first > lo) out.add((lo + first) / 2);
      if (hi === null) out.add(last + 1); else if (last < hi) out.add((last + hi) / 2);
    }
    return [...out];
  };
  return { dom: [], rel: (r, a) => (r === '<' ? a[0] < a[1] : false), fn: () => { throw new Error('no functions'); }, konst: () => { throw new Error('no constants'); }, cands };
}
/** A finite linear order 0 < 1 < ... < n-1. */
export const finiteOrder = (n) => ({ dom: range(n), rel: (r, a) => (r === '<' ? a[0] < a[1] : false), fn: () => 0, konst: () => 0 });
/** An infinite set (language of equality only): the assigned values and one fresh element. */
export const infiniteSet = () => ({
  dom: [], rel: () => false, fn: () => 0, konst: () => 0,
  cands: (env) => { const vs = Object.values(env).filter((x) => typeof x === 'number'); return [...new Set(vs), vs.length ? Math.max(...vs) + 1 : 0]; },
});
/** (N, 0, S, <) with quantifiers ranging over 0..max(assigned)+bound. */
export const natStruct = (bound = 20) => ({
  dom: [], rel: (r, a) => (r === '<' ? a[0] < a[1] : false), fn: (f, a) => (f === 'S' ? a[0] + 1 : 0), konst: () => 0,
  cands: (env) => { const m = Math.max(0, ...Object.values(env).filter((x) => typeof x === 'number')); return range(m + bound + 1); },
});
/** (Z, S, <): integers within a window around the assigned values. */
export const intStruct = (bound = 4) => ({
  dom: [], rel: (r, a) => (r === '<' ? a[0] < a[1] : false), fn: (f, a) => (f === 'S' ? a[0] + 1 : 0), konst: () => 0,
  cands: (env) => { const vs = Object.values(env).filter((x) => typeof x === 'number'); const lo = Math.min(0, ...vs) - bound, hi = Math.max(0, ...vs) + bound; return range(hi - lo + 1).map((i) => lo + i); },
});
/** The field F_p as a finite structure for the ring language (+, ·, 0, 1). */
export function fieldStruct(p) {
  const add = new Int32Array(p * p), mul = new Int32Array(p * p);
  for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) { add[a + b * p] = (a + b) % p; mul[a + b * p] = (a * b) % p; }
  return { n: p, dom: range(p), label: String, rel: () => false, fn: (f, a) => (f === '+' ? add : mul)[a[0] + a[1] * p], konst: (c) => (c === '1' ? 1 % p : 0) };
}
export const primesUpTo = (n) => { const out = []; for (let k = 2; k <= n; k++) { let ok = true; for (let d = 2; d * d <= k; d++) if (k % d === 0) { ok = false; break; } if (ok) out.push(k); } return out; };

// ---------------------------------------------------------------- quantifier elimination for (N, 0, S)
// Terms are (variable-or-null, offset) = S^offset(variable). Literals are  v = n  |  u + c = w  (c >= 0), each possibly negated.
const termOf = (t) => {
  if (t.t === 'const') { if (t.name !== '0') throw new Error(`unknown constant ${t.name}`); return { v: null, k: 0 }; }
  if (t.t === 'var') return { v: t.name, k: 0 };
  if (t.t === 'fn' && t.f === 'S') { const s = termOf(t.args[0]); return { v: s.v, k: s.k + 1 }; }
  throw new Error('only 0, variables and S are allowed');
};
/** Normalize  a = b  (or its negation): true / false / a literal. */
export function mkLit(a, b, eq = true) {
  if (a.v === null && b.v === null) return (a.k === b.k) === eq;
  if (a.v !== null && a.v === b.v) return (a.k === b.k) === eq;
  if (a.v === null || b.v === null) {
    const [x, n] = a.v === null ? [b, a.k] : [a, b.k];
    if (n < x.k) return !eq;
    return { t: 'c', v: x.v, n: n - x.k, eq };
  }
  const m = Math.min(a.k, b.k), ka = a.k - m, kb = b.k - m;
  if (ka >= kb) return { t: 'v', u: a.v, c: ka - kb, w: b.v, eq };     // a.v + c = b.v
  return { t: 'v', u: b.v, c: kb - ka, w: a.v, eq };                   // b.v + c = a.v
}
const litKey = (l) => (l.t === 'c' ? `c:${l.v}:${l.n}:${l.eq}` : `v:${l.u}:${l.c}:${l.w}:${l.eq}`);
const negLit = (l) => ({ ...l, eq: !l.eq });
const litVars = (l) => (l.t === 'c' ? [l.v] : [l.u, l.w]);
function tidy(cl) { // remove duplicates, detect contradictions
  const seen = new Map();
  for (const l of cl) {
    const k = litKey(l), nk = litKey(negLit(l));
    if (seen.has(nk)) return null;
    seen.set(k, l);
  }
  // x = n and x = m with n != m contradict
  const eqs = new Map();
  for (const l of seen.values()) if (l.t === 'c' && l.eq) { if (eqs.has(l.v) && eqs.get(l.v) !== l.n) return null; eqs.set(l.v, l.n); }
  return [...seen.values()];
}
const CAP = 3000;
function dAnd(D1, D2) {
  const out = [];
  for (const a of D1) for (const b of D2) { const c = tidy([...a, ...b]); if (c) out.push(c); if (out.length > CAP) throw new Error('the formula is too large for this demonstration'); }
  return dedupe(out);
}
function dedupe(D) { const m = new Map(); for (const c of D) m.set(c.map(litKey).sort().join('&'), c); return [...m.values()]; }
function dNot(D) {
  let out = [[]];
  for (const cl of D) {
    if (!cl.length) return [];
    const nxt = [];
    for (const o of out) for (const l of cl) { const c = tidy([...o, negLit(l)]); if (c) nxt.push(c); }
    out = dedupe(nxt);
    if (out.length > CAP) throw new Error('the formula is too large for this demonstration');
  }
  return out;
}
const subTerm = (tm, y, rep) => (tm.v === y ? { v: rep.v, k: rep.k + tm.k } : tm);
/** Replace variable y by the term rep in a literal; returns true/false/literal. */
function subLit(l, y, rep) {
  const t = (v, k) => subTerm({ v, k }, y, rep);
  if (l.t === 'c') return mkLit(t(l.v, 0), { v: null, k: l.n }, l.eq);
  return mkLit(t(l.u, l.c), t(l.w, 0), l.eq);
}
/** ∃y (conjunction of literals) as a DNF without y. */
function elimClause(y, cl) {
  const withY = cl.filter((l) => litVars(l).includes(y)), rest = cl.filter((l) => !litVars(l).includes(y));
  const eq = withY.find((l) => l.eq);
  if (!eq) return [rest];
  let rep, guard = [];
  if (eq.t === 'c') rep = { v: null, k: eq.n };
  else if (eq.w === y) rep = { v: eq.u, k: eq.c };                         // y = u + c
  else { rep = { v: eq.w, k: -eq.c }; for (let i = 0; i < eq.c; i++) guard.push(mkLit({ v: eq.w, k: 0 }, { v: null, k: i }, false)); } // y + c = w
  const out = [...rest, ...guard];
  for (const l of withY) {
    if (l === eq) continue;
    const r = subLit(l, y, rep);
    if (r === false) return [];
    if (r !== true) out.push(r);
  }
  const g = out.filter((l) => l !== true);
  if (g.some((l) => l === false)) return [];
  const c = tidy(g);
  return c ? [c] : [];
}
/** Quantifier-free DNF equivalent to the formula ast over (N, 0, S). */
export function qeNat(ast) {
  const go = (f) => {
    switch (f.op) {
      case 'const': return f.val ? [[]] : [];
      case 'rel': {
        if (f.r !== '=' && f.r !== '≠') throw new Error('only equations x = y are allowed here (no < or +)');
        const l = mkLit(termOf(f.args[0]), termOf(f.args[1]), f.r === '=');
        return l === true ? [[]] : l === false ? [] : [[l]];
      }
      case 'not': return dNot(go(f.a));
      case 'and': return dAnd(go(f.a), go(f.b));
      case 'or': return dedupe([...go(f.a), ...go(f.b)]);
      case 'imp': return dedupe([...dNot(go(f.a)), ...go(f.b)]);
      case 'iff': { const a = go(f.a), b = go(f.b); return dedupe([...dAnd(a, b), ...dAnd(dNot(a), dNot(b))]); }
      case 'ex': return dedupe(go(f.a).flatMap((cl) => elimClause(f.v, cl)));
      case 'all': return dNot(dedupe(dNot(go(f.a)).flatMap((cl) => elimClause(f.v, cl))));
      default: throw new Error('unsupported formula');
    }
  };
  return go(ast);
}
const SN = (n) => (n === 0 ? '0' : n === 1 ? 'S0' : `S^{${n}}0`);
const SV = (v, c) => (c === 0 ? v : c === 1 ? `S${v}` : `S^{${c}}${v}`);
export function litTexN(l) {
  if (l.t === 'c') return `${l.v} ${l.eq ? '=' : '\\ne'} ${SN(l.n)}`;
  return `${SV(l.u, l.c)} ${l.eq ? '=' : '\\ne'} ${l.w}`;
}
export function dnfTex(D) {
  if (!D.length) return '\\bot';
  if (D.some((c) => !c.length)) return '\\top';
  return D.map((c) => c.map(litTexN).join(' \\land ')).join(' \\ \\lor\\ ');
}
export function dnfFreeVars(D) { const s = new Set(); for (const c of D) for (const l of c) for (const v of litVars(l)) s.add(v); return [...s].sort(); }
/** Truth of a quantifier-free DNF at an assignment. */
export function dnfEval(D, env) {
  const val = (v) => env[v];
  return D.some((c) => c.every((l) => (l.t === 'c' ? (val(l.v) === l.n) === l.eq : (val(l.u) + l.c === val(l.w)) === l.eq)));
}
/** The set defined by a DNF in one variable x: finite list, or cofinite (complement list). */
export function describeSet(D, x = 'x') {
  let T = 1; for (const c of D) for (const l of c) if (l.t === 'c') T = Math.max(T, l.n + 1);
  const inSet = (n) => dnfEval(D, { [x]: n });
  const tail = inSet(T + 1);
  const pts = range(T + 1).filter((n) => inSet(n) !== tail);
  return { tail, pts, T };
}

// ---------------------------------------------------------------- truncated power series  Σ c_k ε^k  (k < K)
export const SK = 7;
export const sConst = (a) => { const c = new Array(SK).fill(0); c[0] = a; return c; };
export const sAdd = (a, b) => a.map((x, i) => x + b[i]);
export const sSub = (a, b) => a.map((x, i) => x - b[i]);
export const sScale = (a, s) => a.map((x) => x * s);
export const sMul = (a, b) => { const c = new Array(SK).fill(0); for (let i = 0; i < SK; i++) for (let j = 0; i + j < SK; j++) c[i + j] += a[i] * b[j]; return c; };
export const sInv = (a) => { const c = new Array(SK).fill(0); c[0] = 1 / a[0]; for (let n = 1; n < SK; n++) { let s = 0; for (let k = 1; k <= n; k++) s += a[k] * c[n - k]; c[n] = -s / a[0]; } return c; };
const sPos = (a) => { const h = a.slice(); h[0] = 0; return h; };
function sSeries(h, coef) { // Σ coef[n] h^n for h with zero constant term
  let out = sConst(0), pw = sConst(1);
  for (let n = 0; n < SK; n++) { out = sAdd(out, sScale(pw, coef(n))); pw = sMul(pw, h); }
  return out;
}
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const binomR = (p, n) => { let r = 1; for (let i = 0; i < n; i++) r *= (p - i) / (i + 1); return r; };
export const sExp = (a) => sScale(sSeries(sPos(a), (n) => 1 / fact(n)), Math.exp(a[0]));
export const sSin = (a) => { const h = sPos(a); const s = sSeries(h, (n) => (n % 2 ? (n % 4 === 1 ? 1 : -1) / fact(n) : 0)), c = sSeries(h, (n) => (n % 2 ? 0 : (n % 4 === 0 ? 1 : -1) / fact(n))); return sAdd(sScale(c, Math.sin(a[0])), sScale(s, Math.cos(a[0]))); };
export const sCos = (a) => { const h = sPos(a); const s = sSeries(h, (n) => (n % 2 ? (n % 4 === 1 ? 1 : -1) / fact(n) : 0)), c = sSeries(h, (n) => (n % 2 ? 0 : (n % 4 === 0 ? 1 : -1) / fact(n))); return sSub(sScale(c, Math.cos(a[0])), sScale(s, Math.sin(a[0]))); };
export const sPow = (a, p) => { const u = sScale(sPos(a), 1 / a[0]); return sScale(sSeries(u, (n) => binomR(p, n)), a[0] ** p); };
export const sLog = (a) => { const u = sScale(sPos(a), 1 / a[0]); const s = sSeries(u, (n) => (n === 0 ? 0 : (n % 2 ? 1 : -1) / n)); s[0] += Math.log(a[0]); return s; };
/** abs of a series: the sign of its first non-zero term, with ε of sign `es` (+1 or -1). */
export const sAbs = (a, es = 1) => { for (let k = 0; k < SK; k++) if (a[k] !== 0) return sScale(a, Math.sign(a[k]) * (es < 0 && k % 2 ? -1 : 1)); return a; };

/** Parse an expression in x into an AST: numbers, x, pi, E, + - * / ^, sin cos exp log sqrt abs atan-free. */
export function parseFx(src) {
  const toks = [];
  let m;
  const s = src.replace(/π/g, 'pi').replace(/·/g, '*').replace(/−/g, '-');
  const re2 = /\s*(?:(\d+\.?\d*|\.\d+)|([A-Za-z]+)|(\S))/g;
  while ((m = re2.exec(s))) { if (m[1] !== undefined) toks.push({ n: +m[1] }); else if (m[2]) toks.push({ id: m[2] }); else toks.push({ op: m[3] }); }
  let k = 0;
  const peek = () => toks[k];
  const FN = ['sin', 'cos', 'exp', 'log', 'ln', 'sqrt', 'abs'];
  const err = (t) => { throw new Error(t); };
  function expr() { let a = term(); for (;;) { const t = peek(); if (t && (t.op === '+' || t.op === '-')) { k++; const b = term(); a = { o: t.op, a, b }; } else return a; } }
  function term() {
    let a = unary();
    for (;;) {
      const t = peek();
      if (t && (t.op === '*' || t.op === '/')) { k++; a = { o: t.op, a, b: unary() }; }
      else if (t && (t.id || t.op === '(' || t.n !== undefined)) { a = { o: '*', a, b: unary() }; }
      else return a;
    }
  }
  function unary() { const t = peek(); if (t && t.op === '-') { k++; return { o: 'neg', a: unary() }; } if (t && t.op === '+') { k++; return unary(); } return power(); }
  function power() { const a = atom(); const t = peek(); if (t && t.op === '^') { k++; const b = unary(); return { o: '^', a, b }; } return a; }
  function atom() {
    const t = toks[k++];
    if (!t) err('unexpected end');
    if (t.n !== undefined) return { c: t.n };
    if (t.op === '(') { const a = expr(); if (!peek() || peek().op !== ')') err('missing )'); k++; return a; }
    if (t.id === 'x') return { x: 1 };
    if (t.id === 'pi') return { c: Math.PI };
    if (t.id === 'E') return { c: Math.E };
    if (FN.includes(t.id)) { let a; if (peek() && peek().op === '(') { k++; a = expr(); if (!peek() || peek().op !== ')') err('missing )'); k++; } else a = power(); return { f: t.id === 'ln' ? 'log' : t.id, a }; }
    return err(`unknown “${t.id || t.op}”`);
  }
  const ast = expr();
  if (k < toks.length) err(`unexpected “${toks[k].op || toks[k].id || toks[k].n}”`);
  return ast;
}
const NUMF = { sin: Math.sin, cos: Math.cos, exp: Math.exp, log: Math.log, sqrt: Math.sqrt, abs: Math.abs };
export function evalNum(ast, x) {
  if (ast.c !== undefined) return ast.c;
  if (ast.x) return x;
  if (ast.f) return NUMF[ast.f](evalNum(ast.a, x));
  const a = evalNum(ast.a, x);
  switch (ast.o) {
    case 'neg': return -a;
    case '+': return a + evalNum(ast.b, x);
    case '-': return a - evalNum(ast.b, x);
    case '*': return a * evalNum(ast.b, x);
    case '/': return a / evalNum(ast.b, x);
    case '^': return a ** evalNum(ast.b, x);
  }
  return NaN;
}
/** f(a + ε) as a truncated series; throws on a function that has no power-series expansion at a (e.g. sqrt at 0). */
export function evalSer(ast, a, es = 1) {
  if (ast.c !== undefined) return sConst(ast.c);
  if (ast.x) { const s = sConst(a); s[1] = 1; return s; }
  if (ast.f) {
    const u = evalSer(ast.a, a, es);
    if (ast.f === 'abs') return sAbs(u, es);
    if (ast.f === 'sin') return sSin(u);
    if (ast.f === 'cos') return sCos(u);
    if (ast.f === 'exp') return sExp(u);
    if (u[0] <= 0) throw new Error(`${ast.f} has no power series at this point`);
    return ast.f === 'log' ? sLog(u) : sPow(u, 0.5);
  }
  const A = evalSer(ast.a, a, es);
  if (ast.o === 'neg') return sScale(A, -1);
  if (ast.o === '^') {
    const B = evalSer(ast.b, a, es);
    if (B.slice(1).some((q) => q !== 0)) throw new Error('exponent must be a constant');
    const p = B[0];
    if (Number.isInteger(p) && p >= 0) { let r = sConst(1); for (let i = 0; i < p; i++) r = sMul(r, A); return r; }
    if (Number.isInteger(p) && A[0] !== 0) return sPow(A, p);
    if (A[0] <= 0) throw new Error('fractional power of a non-positive number');
    return sPow(A, p);
  }
  const B = evalSer(ast.b, a, es);
  if (ast.o === '+') return sAdd(A, B);
  if (ast.o === '-') return sSub(A, B);
  if (ast.o === '*') return sMul(A, B);
  if (B[0] === 0) throw new Error('division by an infinitesimal: not handled here');
  return sMul(A, sInv(B));
}

// ---------------------------------------------------------------- Laurent series in an infinitesimal e   (the ordered field R((e)))
const LTR = 9; // relative truncation
export const lConst = (c) => (c ? new Map([[0, c]]) : new Map());
export const lMono = (c, k) => (c ? new Map([[k, c]]) : new Map());
export function lClean(a) { const m = new Map(); for (const [k, c] of a) if (Math.abs(c) > 1e-12) m.set(k, c); return m; }
export const lAdd = (a, b, s = 1) => { const m = new Map(a); for (const [k, c] of b) m.set(k, (m.get(k) || 0) + s * c); return lClean(m); };
export const lMul = (a, b) => { const m = new Map(); for (const [i, p] of a) for (const [j, q] of b) m.set(i + j, (m.get(i + j) || 0) + p * q); return lClean(m); };
export const lLead = (a) => { let k = Infinity; for (const e of a.keys()) k = Math.min(k, e); return k; };
export function lInv(a) {
  if (!a.size) throw new Error('division by zero');
  const m = lLead(a), c = a.get(m);
  const u = new Map(); for (const [k, q] of a) if (k !== m) u.set(k - m, q / c);       // a = c e^m (1 + u)
  let out = lConst(1), pw = lConst(1);
  for (let n = 1; n <= LTR; n++) { pw = lMul(pw, u); out = lAdd(out, pw, n % 2 ? -1 : 1); }
  return lMul(lMono(1 / c, -m), out);
}
export function lParse(src) {
  const s = src.replace(/−/g, '-').replace(/·/g, '*').replace(/ε/g, 'e').replace(/ω/g, '(1/e)');
  const toks = []; const re = /\s*(?:(\d+\.?\d*|\.\d+)|(e)|(\S))/g; let m;
  while ((m = re.exec(s))) { if (m[1] !== undefined) toks.push({ n: +m[1] }); else if (m[2]) toks.push({ e: 1 }); else toks.push({ op: m[3] }); }
  let k = 0; const peek = () => toks[k];
  const expr = () => { let a = term(); for (;;) { const t = peek(); if (t && (t.op === '+' || t.op === '-')) { k++; a = lAdd(a, term(), t.op === '-' ? -1 : 1); } else return a; } };
  const term = () => { let a = unary(); for (;;) { const t = peek(); if (t && t.op === '*') { k++; a = lMul(a, unary()); } else if (t && t.op === '/') { k++; a = lMul(a, lInv(unary())); } else if (t && (t.n !== undefined || t.e || t.op === '(')) a = lMul(a, unary()); else return a; } };
  const unary = () => { const t = peek(); if (t && t.op === '-') { k++; return lAdd(new Map(), unary(), -1); } if (t && t.op === '+') { k++; return unary(); } return power(); };
  const power = () => {
    const a = atom(); const t = peek();
    if (t && t.op === '^') {
      k++; let neg = false; if (peek() && peek().op === '-') { neg = true; k++; }
      const n = toks[k++]; if (!n || n.n === undefined || !Number.isInteger(n.n)) throw new Error('exponents must be integers');
      let r = lConst(1); const base = neg ? lInv(a) : a; for (let i = 0; i < n.n; i++) r = lMul(r, base); return r;
    }
    return a;
  };
  const atom = () => {
    const t = toks[k++]; if (!t) throw new Error('unexpected end');
    if (t.n !== undefined) return lConst(t.n);
    if (t.e) return lMono(1, 1);
    if (t.op === '(') { const a = expr(); if (!peek() || peek().op !== ')') throw new Error('missing )'); k++; return a; }
    throw new Error(`unexpected “${t.op}”`);
  };
  const r = expr(); if (k < toks.length) throw new Error(`unexpected “${toks[k].op || 'symbol'}”`); return r;
}
export const lSign = (a) => (a.size ? Math.sign(a.get(lLead(a))) : 0);
export const lCmp = (a, b) => lSign(lAdd(a, b, -1));
export const lStd = (a) => (a.size && lLead(a) < 0 ? NaN : a.get(0) || 0);
export const lKind = (a) => (!a.size ? 'zero' : lLead(a) > 0 ? 'infinitesimal' : lLead(a) === 0 ? 'finite' : 'infinite');
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const supStr = (k) => String(Math.abs(k)).split('').map((d) => SUP[+d]).join('');
export function lStr(a, digits = 3) {
  if (!a.size) return '0';
  const ks = [...a.keys()].sort((x, y) => x - y).slice(0, 5);
  let s = '';
  ks.forEach((k, i) => {
    const c = a.get(k), mag = Math.abs(c), ms = +mag.toFixed(digits);
    const coef = k !== 0 && ms === 1 ? '' : String(ms);
    const term = k === 0 ? coef || '1' : `${coef}ε${k === 1 ? '' : (k < 0 ? '⁻' : '') + supStr(k)}`;
    s += (i === 0 ? (c < 0 ? '−' : '') : c < 0 ? ' − ' : ' + ') + term;
  });
  if (a.size > ks.length) s += ' + …';
  return s;
}

// ---------------------------------------------------------------- the catalogue of theories (items 5.4 and 5.14)
/** c0: categorical in aleph_0; cu: categorical in the uncountable cardinals; models[k]: how many models of size aleph_k. */
export const THEORIES = [
  { id: 'set', name: 'Infinite sets', tex: String.raw`\text{infinite sets},\ \{=\}`, c0: true, cu: true, dims: ['cardinality'],
    n0: '1', nu: '1', why0: 'a bijection between two countable sets is an isomorphism', whyu: 'a bijection between two sets of size κ is an isomorphism' },
  { id: 'dlo', name: 'Dense orders without endpoints', tex: String.raw`\mathrm{DLO}`, c0: true, cu: false, dims: [],
    n0: '1', nu: '≥ 2', why0: 'back-and-forth (5.5): any two countable ones are isomorphic',
    wit0: '', witu: 'lay copies of ℚ end to end over the ordinal κ·ω₁: this dense order has size κ and cofinality ω₁; appending one copy of ℚ leaves size κ and makes cofinality ω, so the orders are not isomorphic' },
  { id: 'qvs', name: 'Non-trivial ℚ-vector spaces', tex: String.raw`\mathbb{Q}\text{-vector spaces}\ (\neq 0)`, c0: false, cu: true, dims: ['dimension d'],
    n0: 'ℵ₀', nu: '1', wit0: 'dimension 1 (ℚ itself) versus dimension 2 (ℚ²): both countable, not isomorphic', whyu: 'size κ forces dimension exactly κ, and equal dimension means isomorphic' },
  { id: 'acf', name: 'Algebraically closed fields, fixed char.', tex: String.raw`\mathrm{ACF}_p`, c0: false, cu: true, dims: ['transcendence degree d'],
    n0: 'ℵ₀', nu: '1', wit0: 'transcendence degree 0 (the algebraic closure of the prime field) versus degree 1 (the algebraic closure of F(t))', whyu: 'size κ forces transcendence degree exactly κ, and equal degree means isomorphic (Steinitz)' },
  { id: 'eq', name: 'Equivalence relation, ∞ classes, all ∞', tex: String.raw`E:\ \infty\text{ classes, each infinite}`, c0: true, cu: false, dims: ['number of classes c', 'class size s'],
    n0: '1', nu: '≥ 2', why0: 'countably many classes, each countably infinite: match classes, then elements', witu: 'κ classes of size ℵ₀ versus ℵ₀ classes of size κ: both structures have size κ, and their numbers of equivalence classes differ' },
  { id: 'succ', name: '(ℕ, 0, S): zero and successor', tex: String.raw`(\mathbb{N},0,S)`, c0: false, cu: true, dims: ['number of ℤ-chains d'],
    n0: 'ℵ₀', nu: '1', wit0: 'ℕ alone versus ℕ plus one copy of ℤ', whyu: 'a model is ℕ plus d copies of ℤ; size κ forces d = κ' },
  { id: 'rcf', name: 'Real closed ordered fields', tex: String.raw`\mathrm{RCF}`, c0: false, cu: false, dims: [],
    n0: '2^ℵ₀', nu: '≥ 2', wit0: 'there are continuum many countable isomorphism types: every transcendental real cut occurs in a countable real closure of ℚ(t), while one countable ordered field can realize only countably many cuts over ℚ' , witu: 'for every uncountable κ, form ℚ(tᵢ : i < κ·ω) and ℚ(sⱼ : j < κ·ω₁), adjoining each variable positive and infinite over its predecessors, then take real closures. Both have size κ. Algebraic root bounds and finite supports give cofinalities ω and ω₁ respectively, so the fields are not isomorphic; the verification report gives the complete construction' },
  { id: 'rado', name: 'The random graph (Rado)', tex: String.raw`\mathrm{Th}(\text{Rado graph})`, c0: true, cu: false, dims: [],
    n0: '1', nu: '≥ 2', why0: 'back-and-forth again: the extension property determines the countable model', witu: 'start once from a κ-clique and once from κ independent vertices. In each graph, repeatedly add an independent layer realizing every finite adjacency/nonadjacency pattern. Both size-κ limits have the random-graph extension property; the first has an uncountable clique, whereas the second is countably colorable and has no uncountable clique' },
];
