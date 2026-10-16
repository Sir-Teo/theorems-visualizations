// Programming Languages & Types — Chapter 4: helpers shared by ch04.js, ch04-b.js and ch04-c.js.
// Everything of chapter 3 (and so chapter 2) is re-exported, and on top of it:
//  (a) a typed language TM: the Bool/Nat language of Pierce ch. 8 plus the simply typed lambda-calculus (variables,
//      λx:T. t, application) with a parser, a printer with highlighting, capture-avoiding substitution, call-by-value
//      small-step semantics (with deliberately broken rule sets), full reduction (any redex anywhere), erasure;
//  (b) types, the typing relation as derivation trees (with failures), Curry-style type inference by unification
//      with an occurs check; (c) random well-typed term generation and reduction-path statistics.
import * as NB from './ch01.shared.js';
export * from './ch03.shared.js';
export { NB };
export { drawSegs, hitDeriv, drawRuleSchema, drawTreePx } from './ch01.shared.js';

// ====================================================================== types
export const TB = { k: 'B' }, TN = { k: 'N' };
export const TF = (a, b) => ({ k: 'f', a, b });
export const TV = (n) => ({ k: 'v', n });
export const tyEq = (a, b) => a.k === b.k && (a.k === 'f' ? tyEq(a.a, b.a) && tyEq(a.b, b.b) : a.k === 'v' ? a.n === b.n : true);
const VN = 'αβγδεζηθικλμνξ';
export const tyVarName = (n) => (n < VN.length ? VN[n] : 'α' + n);
export function tyStr(t, left = false) {
  if (t.k === 'B') return 'Bool';
  if (t.k === 'N') return 'Nat';
  if (t.k === 'v') return tyVarName(t.n);
  const s = tyStr(t.a, true) + ' → ' + tyStr(t.b, false);
  return left ? '(' + s + ')' : s;
}
export const tySize = (t) => (t.k === 'f' ? 1 + tySize(t.a) + tySize(t.b) : 1);
export const tyDepth = (t) => (t.k === 'f' ? 1 + Math.max(tyDepth(t.a), tyDepth(t.b)) : 0);
export const TYPES1 = [TB, TN, TF(TB, TB), TF(TN, TN), TF(TN, TB)];

// ====================================================================== terms
export const tV = (x) => ({ t: 'v', x });
export const tL = (x, ty, b) => ({ t: 'l', x, ty, b });
export const tA = (f, a) => ({ t: 'a', f, a });
export const tC = (c) => ({ t: 'c', c });
export const tP = (op, a) => ({ t: 'p', op, a });
export const tI = (a, b, c) => ({ t: 'i', a, b, c });
export const tD = (ty) => ({ t: 'd', ty });
export const tNum = (n) => { let r = tC('zero'); for (let i = 0; i < n; i++) r = tP('succ', r); return r; };
export const tKids = (t) => (t.t === 'l' ? [t.b] : t.t === 'a' ? [t.f, t.a] : t.t === 'p' ? [t.a] : t.t === 'i' ? [t.a, t.b, t.c] : []);
export function tRebuild(t, ks) {
  if (t.t === 'l') return tL(t.x, t.ty, ks[0]);
  if (t.t === 'a') return tA(ks[0], ks[1]);
  if (t.t === 'p') return tP(t.op, ks[0]);
  if (t.t === 'i') return tI(ks[0], ks[1], ks[2]);
  return t;
}
export const tSize = (t) => 1 + tKids(t).reduce((s, k) => s + tSize(k), 0);
export function tSubterms(t, out = new Set()) { out.add(t); tKids(t).forEach((k) => tSubterms(k, out)); return out; }
/** n if t is succ^n 0, else -1. */
export const tNumOf = (t) => { let n = 0; while (t.t === 'p' && t.op === 'succ') { n++; t = t.a; } return t.t === 'c' && t.c === 'zero' ? n : -1; };
export const tIsNV = (t) => tNumOf(t) >= 0;
export const tIsValue = (t) => t.t === 'l' || (t.t === 'c' && t.c !== 'zero') || tIsNV(t);
export function tFV(t, out = new Set(), bound = []) {
  if (t.t === 'v') { if (!bound.includes(t.x)) out.add(t.x); } else if (t.t === 'l') tFV(t.b, out, [...bound, t.x]); else tKids(t).forEach((k) => tFV(k, out, bound));
  return out;
}
function tAll(t, out = new Set()) { if (t.t === 'v') out.add(t.x); else if (t.t === 'l') { out.add(t.x); tAll(t.b, out); } else tKids(t).forEach((k) => tAll(k, out)); return out; }
/** [x ↦ s]t, capture-avoiding. Inserted copies of s keep their object identity (so callers can recognise them). */
export function tSubst(t, x, s, fvS = tFV(s)) {
  if (t.t === 'v') return t.x === x ? s : t;
  if (t.t === 'l') {
    if (t.x === x || !tFV(t.b).has(x)) return t;
    if (fvS.has(t.x)) {
      const avoid = new Set([...fvS, ...tAll(t.b), x]); let y = t.x; while (avoid.has(y)) y += "'";
      return tL(y, t.ty, tSubst(tSubst(t.b, t.x, tV(y)), x, s, fvS));
    }
    return tL(t.x, t.ty, tSubst(t.b, x, s, fvS));
  }
  const ks = tKids(t); if (!ks.length) return t;
  return tRebuild(t, ks.map((k) => tSubst(k, x, s, fvS)));
}
/** alpha-invariant key; with ty = false annotations are ignored (the erasure view). */
export function tKey(t, withTy = true, env = []) {
  switch (t.t) {
    case 'v': { const i = env.lastIndexOf(t.x); return i >= 0 ? String(env.length - 1 - i) : '$' + t.x; }
    case 'l': { env.push(t.x); const s = 'λ' + (withTy && t.ty ? tyStr(t.ty) : '') + '.' + tKey(t.b, withTy, env); env.pop(); return s; }
    case 'a': return '(' + tKey(t.f, withTy, env) + ' ' + tKey(t.a, withTy, env) + ')';
    case 'c': return t.c;
    case 'p': return t.op + '(' + tKey(t.a, withTy, env) + ')';
    case 'i': return 'if(' + tKey(t.a, withTy, env) + ',' + tKey(t.b, withTy, env) + ',' + tKey(t.c, withTy, env) + ')';
    default: return 'default' + (withTy && t.ty ? '[' + tyStr(t.ty) + ']' : '');
  }
}
export function tErase(t) {
  if (t.t === 'l') return tL(t.x, null, tErase(t.b));
  if (t.t === 'd') return tD(null);
  const ks = tKids(t); return ks.length ? tRebuild(t, ks.map(tErase)) : t;
}
/** Convert a term of the arithmetic-and-boolean language of chapter 1 (op-based) to a TM term. */
export function fromNB(t) {
  switch (t.op) {
    case 'true': return tC('true');
    case 'false': return tC('false');
    case 'zero': return tC('zero');
    case 'if': return tI(fromNB(t.a), fromNB(t.b), fromNB(t.c));
    default: return tP(t.op, fromNB(t.a));
  }
}

// ---------------------------------------------------------------------- printing
/** Printed segments [{s, hi}]; hi is a node or an array/Set of nodes (the whole subterm is highlighted). */
export function tSegs(t, hi = null, o = {}) {
  const out = [];
  const isHi = (x) => hi && (Array.isArray(hi) ? hi.includes(x) : hi instanceof Set ? hi.has(x) : hi === x);
  const push = (s, h) => out.push({ s, hi: !!h });
  const go = (x, ctx, h) => {
    const H = h || isHi(x);
    const n = tNumOf(x);
    if (n >= 0) { push(String(n), H); return; }
    const paren = (c) => { if (c) push('(', H); return c; };
    switch (x.t) {
      case 'v': push(x.x, H); break;
      case 'c': push(x.c, H); break;
      case 'd': push(x.ty ? `default[${tyStr(x.ty)}]` : 'default[?]', H); break;
      case 'p': { const p = paren(ctx === 'arg' || ctx === 'fn'); push(x.op + ' ', H); go(x.a, 'arg', H); if (p) push(')', H); break; }
      case 'l': {
        const p = paren(ctx === 'arg' || ctx === 'fn');
        push('λ' + x.x + (x.ty && !o.noTypes ? ':' + tyStr(x.ty) : '') + '. ', H); go(x.b, 'top', H); if (p) push(')', H); break;
      }
      case 'i': { const p = paren(ctx === 'arg' || ctx === 'fn'); push('if ', H); go(x.a, 'top', H); push(' then ', H); go(x.b, 'top', H); push(' else ', H); go(x.c, 'top', H); if (p) push(')', H); break; }
      case 'a': { const p = paren(ctx === 'arg'); go(x.f, 'fn', H); push(' ', H); go(x.a, 'arg', H); if (p) push(')', H); break; }
      default: break;
    }
  };
  go(t, 'top', false);
  return out;
}
export const tStr = (t, o) => tSegs(t, null, o).map((s) => s.s).join('');

// ---------------------------------------------------------------------- parser
const KWS = new Set(['true', 'false', 'if', 'then', 'else', 'succ', 'pred', 'iszero', 'Bool', 'Nat', 'default']);
const isIdent = (w) => /^[a-z][a-z0-9_']*$/.test(w) && !KWS.has(w);
function lex(src) {
  const out = []; const re = /\s+|->|→|λ|\\|[A-Za-z_][A-Za-z_0-9']*|\d+|./gy; let m;
  while ((m = re.exec(src))) { const w = m[0]; if (/^\s+$/.test(w)) continue; out.push({ w: w === '->' ? '→' : w === '\\' ? 'λ' : w, pos: m.index, len: w.length }); }
  return out;
}
/** parseTy(src) → {ast} | {error, pos, len}. */
export function parseTy(src) {
  const toks = lex(src); let k = 0;
  const fail = (msg, tk = toks[k]) => { throw { msg, pos: tk ? tk.pos : src.length, len: tk ? tk.len : 1 }; };
  const ty = () => { const a = atom(); if (toks[k] && toks[k].w === '→') { k++; return TF(a, ty()); } return a; };
  const atom = () => {
    const t = toks[k]; if (!t) fail('the type ends too early');
    if (t.w === 'Bool') { k++; return TB; }
    if (t.w === 'Nat') { k++; return TN; }
    if (t.w === '(') { k++; const r = ty(); if (!toks[k] || toks[k].w !== ')') fail('missing “)”'); k++; return r; }
    fail(`expected Bool, Nat or a parenthesised type, found “${t.w}”`);
  };
  try { if (!toks.length) return { error: 'empty type', pos: 0, len: 1 }; const r = ty(); if (k < toks.length) fail(`unexpected “${toks[k].w}”`); return { ast: r }; } catch (e) { if (e && e.msg) return { error: e.msg, pos: e.pos, len: e.len }; throw e; }
}
/** parseTM(src) → {ast} | {error, pos, len}. Annotations on λ are optional (missing ones give ty = null). */
export function parseTM(src) {
  const toks = lex(src); let k = 0;
  const peek = () => toks[k];
  const fail = (msg, tk = peek()) => { throw { msg, pos: tk ? tk.pos : src.length, len: tk ? tk.len : 1 }; };
  const expect = (w) => { const t = peek(); if (!t || t.w !== w) fail(t ? `expected “${w}” but found “${t.w}”` : `expected “${w}” but the term ends`); k++; };
  const tyAtom = () => {
    const t = peek(); if (!t) fail('the type ends too early');
    if (t.w === 'Bool') { k++; return TB; }
    if (t.w === 'Nat') { k++; return TN; }
    if (t.w === '(') { k++; const r = tyArrow(); expect(')'); return r; }
    fail(`expected a type (Bool, Nat or an arrow type), found “${t.w}”`);
  };
  const tyArrow = () => { const a = tyAtom(); if (peek() && peek().w === '→') { k++; return TF(a, tyArrow()); } return a; };
  const startsAtom = (t) => t && (isIdent(t.w) || /^\d+$/.test(t.w) || ['(', 'true', 'false', 'succ', 'pred', 'iszero', 'default', 'λ', 'if'].includes(t.w));
  const term = () => {
    const t = peek(); if (!t) fail('the term ends too early');
    if (t.w === 'λ') {
      k++; const x = peek();
      if (!x || !isIdent(x.w)) fail('λ needs a variable name', x || t);
      k++; let ty = null;
      if (peek() && peek().w === ':') { k++; ty = tyArrow(); }
      if (!peek() || peek().w !== '.') fail(peek() ? `expected “.” after the binder but found “${peek().w}”` : 'expected “.” after the binder');
      k++;
      if (!peek() || peek().w === ')') fail('the body of the λ is missing', peek() || t);
      return tL(x.w, ty, term());
    }
    if (t.w === 'if') { k++; const a = term(); expect('then'); const b = term(); expect('else'); const c = term(); return tI(a, b, c); }
    let r = prefix();
    while (startsAtom(peek())) {
      if (peek().w === 'λ' || peek().w === 'if') { r = tA(r, term()); break; }
      r = tA(r, prefix());
    }
    return r;
  };
  const prefix = () => {
    const t = peek();
    if (t && (t.w === 'succ' || t.w === 'pred' || t.w === 'iszero')) { k++; if (!startsAtom(peek()) || peek().w === 'λ' || peek().w === 'if') { if (peek() && (peek().w === 'λ' || peek().w === 'if')) fail(`${t.w} applied to a λ or if needs parentheses`); fail(`${t.w} needs an argument`); } return tP(t.w, prefix()); }
    return atom();
  };
  const atom = () => {
    const t = peek(); if (!t) fail('the term ends too early');
    if (t.w === 'true' || t.w === 'false') { k++; return tC(t.w); }
    if (/^\d+$/.test(t.w)) { k++; if (+t.w > 30) fail('numerals above 30 are not supported here', t); return tNum(+t.w); }
    if (t.w === 'default') { k++; expect('['); const T = tyArrow(); expect(']'); return tD(T); }
    if (isIdent(t.w)) { k++; return tV(t.w); }
    if (t.w === '(') { k++; const e = term(); expect(')'); return e; }
    if (t.w === ')') fail('unexpected “)”');
    if (t.w === 'then' || t.w === 'else') fail(`“${t.w}” without a matching “if”`);
    fail(`unexpected “${t.w}”`);
  };
  try {
    if (!toks.length) return { error: 'empty term', pos: 0, len: 1 };
    const r = term(); if (k < toks.length) fail(toks[k].w === ')' ? 'unbalanced “)”' : `unexpected “${toks[k].w}” after a complete term`);
    return { ast: r };
  } catch (e) { if (e && e.msg) return { error: e.msg, pos: e.pos, len: e.len }; throw e; }
}
export const PT = (src) => { const r = parseTM(src); if (!r.ast) throw new Error(`${src}: ${r.error}`); return r.ast; };

// ====================================================================== typing relation
export const TY_RULES = {
  'T-True': { pre: [], concl: '⊢ true : Bool' },
  'T-False': { pre: [], concl: '⊢ false : Bool' },
  'T-Zero': { pre: [], concl: '⊢ 0 : Nat' },
  'T-Succ': { pre: ['⊢ t₁ : Nat'], concl: '⊢ succ t₁ : Nat' },
  'T-Pred': { pre: ['⊢ t₁ : Nat'], concl: '⊢ pred t₁ : Nat' },
  'T-IsZero': { pre: ['⊢ t₁ : Nat'], concl: '⊢ iszero t₁ : Bool' },
  'T-If': { pre: ['⊢ t₁ : Bool', '⊢ t₂ : T', '⊢ t₃ : T'], concl: '⊢ if t₁ then t₂ else t₃ : T' },
  'T-Var': { pre: ['x : T ∈ Γ'], concl: 'Γ ⊢ x : T' },
  'T-Abs': { pre: ['Γ, x:T₁ ⊢ t₂ : T₂'], concl: 'Γ ⊢ λx:T₁. t₂ : T₁ → T₂' },
  'T-App': { pre: ['Γ ⊢ t₁ : T₁ → T₂', 'Γ ⊢ t₂ : T₁'], concl: 'Γ ⊢ t₁ t₂ : T₂' },
  'T-Default': { pre: [], concl: 'Γ ⊢ default[T] : T   (T = Bool or Nat; ours)' },
};
export const ctxStr = (ctx) => (ctx.length ? ctx.map(([x, T]) => `${x}:${tyStr(T)}`).join(', ') + ' ' : '');
/** Derivation tree of Γ ⊢ t : T. Node: {c, rule, kids, ty (or null), fail (own rule inapplicable), open (blocked below), msg, term, ctx}.
 *  opts.turn = false prints `t : T` (no Γ ⊢), as for the Bool/Nat language. */
export function derive(t, ctx = [], opts = {}) {
  const turn = opts.turn !== false;
  const mkc = (ty) => `${turn ? ctxStr(ctx) + '⊢ ' : ''}${tStr(t)} : ${ty ? tyStr(ty) : '?'}`;
  const node = (rule, kids, ty, extra = {}) => {
    const blocked = kids.some((k) => !k.ty);
    const n = { c: mkc(blocked || extra.fail ? null : ty), rule, kids, ty: blocked || extra.fail ? null : ty, term: t, ctx, fail: !!extra.fail, open: blocked && !extra.fail, msg: extra.msg };
    return n;
  };
  switch (t.t) {
    case 'c': return node(t.c === 'true' ? 'T-True' : t.c === 'false' ? 'T-False' : 'T-Zero', [], t.c === 'zero' ? TN : TB);
    case 'd': return t.ty && (t.ty.k === 'B' || t.ty.k === 'N') ? node('T-Default', [], t.ty) : node('T-Default', [], null, { fail: true, msg: 'default[T] is only defined for T = Bool or Nat' });
    case 'v': {
      for (let i = ctx.length - 1; i >= 0; i--) if (ctx[i][0] === t.x) return node('T-Var', [], ctx[i][1]);
      return node('T-Var', [], null, { fail: true, msg: `${t.x} is not in the context, so it is a free variable with no type` });
    }
    case 'p': {
      const a = derive(t.a, ctx, opts), rule = t.op === 'succ' ? 'T-Succ' : t.op === 'pred' ? 'T-Pred' : 'T-IsZero';
      if (a.ty && a.ty.k !== 'N') return node(rule, [a], null, { fail: true, msg: `${t.op} needs a Nat argument but the argument has type ${tyStr(a.ty)}` });
      return node(rule, [a], t.op === 'iszero' ? TB : TN);
    }
    case 'i': {
      const a = derive(t.a, ctx, opts), b = derive(t.b, ctx, opts), c = derive(t.c, ctx, opts);
      if (a.ty && a.ty.k !== 'B') return node('T-If', [a, b, c], null, { fail: true, msg: `the guard has type ${tyStr(a.ty)} but T-If needs Bool` });
      if (b.ty && c.ty && !tyEq(b.ty, c.ty)) return node('T-If', [a, b, c], null, { fail: true, msg: `the branches have different types (${tyStr(b.ty)} and ${tyStr(c.ty)}) and T-If needs one common type` });
      return node('T-If', [a, b, c], b.ty || c.ty);
    }
    case 'l': {
      if (!t.ty) return node('T-Abs', [], null, { fail: true, msg: `the binder ${t.x} has no type annotation, and T-Abs needs one` });
      const b = derive(t.b, [...ctx, [t.x, t.ty]], opts);
      return node('T-Abs', [b], b.ty ? TF(t.ty, b.ty) : null);
    }
    case 'a': {
      const f = derive(t.f, ctx, opts), a = derive(t.a, ctx, opts);
      if (f.ty && f.ty.k !== 'f') return node('T-App', [f, a], null, { fail: true, msg: `the function part has type ${tyStr(f.ty)}, which is not an arrow type` });
      if (f.ty && a.ty && !tyEq(f.ty.a, a.ty)) return node('T-App', [f, a], null, { fail: true, msg: `the function expects ${tyStr(f.ty.a)} but the argument has type ${tyStr(a.ty)}` });
      return node('T-App', [f, a], f.ty ? f.ty.b : null);
    }
    default: return node('?', [], null, { fail: true });
  }
}
/** Type of t in ctx, or null (fast: no tree). */
export function typeOf(t, ctx = []) {
  switch (t.t) {
    case 'c': return t.c === 'zero' ? TN : TB;
    case 'd': return t.ty && (t.ty.k === 'B' || t.ty.k === 'N') ? t.ty : null;
    case 'v': { for (let i = ctx.length - 1; i >= 0; i--) if (ctx[i][0] === t.x) return ctx[i][1]; return null; }
    case 'p': { const a = typeOf(t.a, ctx); return a && a.k === 'N' ? (t.op === 'iszero' ? TB : TN) : null; }
    case 'i': { const a = typeOf(t.a, ctx), b = typeOf(t.b, ctx), c = typeOf(t.c, ctx); return a && a.k === 'B' && b && c && tyEq(b, c) ? b : null; }
    case 'l': { if (!t.ty) return null; const b = typeOf(t.b, [...ctx, [t.x, t.ty]]); return b ? TF(t.ty, b) : null; }
    case 'a': { const f = typeOf(t.f, ctx), a = typeOf(t.a, ctx); return f && a && f.k === 'f' && tyEq(f.a, a) ? f.b : null; }
    default: return null;
  }
}
/** First failing node of a derivation (left to right, innermost first), or null. */
export function firstFail(d) { for (const k of d.kids) { const f = firstFail(k); if (f) return f; } return d.fail ? d : null; }
export function derivNodes(d, out = []) { out.push(d); d.kids.forEach((k) => derivNodes(k, out)); return out; }

// ====================================================================== fast typing of chapter-1 terms (no tree)
export function nbType(t) {
  switch (t.op) {
    case 'true': case 'false': return 'Bool';
    case 'zero': return 'Nat';
    case 'succ': case 'pred': return nbType(t.a) === 'Nat' ? 'Nat' : null;
    case 'iszero': return nbType(t.a) === 'Nat' ? 'Bool' : null;
    case 'if': { const g = nbType(t.a); if (g !== 'Bool') return null; const x = nbType(t.b); return x && x === nbType(t.c) ? x : null; }
    default: return null;
  }
}
/** Guard-aware (less conservative) checker for 4.6: if the guard is the literal true / false only the taken branch must type. */
export function nbTypeLit(t) {
  if (t.op === 'if') {
    const g = nbTypeLit(t.a); if (g !== 'Bool') return null;
    if (t.a.op === 'true') return nbTypeLit(t.b);
    if (t.a.op === 'false') return nbTypeLit(t.c);
    const x = nbTypeLit(t.b); return x && x === nbTypeLit(t.c) ? x : null;
  }
  if (t.op === 'succ' || t.op === 'pred') return nbTypeLit(t.a) === 'Nat' ? 'Nat' : null;
  if (t.op === 'iszero') return nbTypeLit(t.a) === 'Nat' ? 'Bool' : null;
  return nbType(t);
}

// ====================================================================== chapter-1 language NB with broken rule sets
export const NB_MODES = {
  std: { name: 'the standard rules' },
  badIszero: { name: 'a broken rule: iszero 0 → 0', rule: 'E-IszeroZeroBad', text: 'iszero 0 → 0' },
  noPredZero: { name: 'a missing rule: no E-PredZero', rule: null },
  badPred: { name: 'a broken rule: pred (succ nv) → true', rule: 'E-PredSuccBad', text: 'pred (succ nv₁) → true' },
};
/** One deterministic step of an NB term under mode; {to, rule, redex} or null. */
export function nbStep(t, mode = 'std') {
  const { mk, isNV } = NB;
  const rec = (x, rule, build) => { const s = nbStep(x, mode); return s ? { to: build(s.to), rule: s.rule, redex: s.redex, cong: rule } : null; };
  switch (t.op) {
    case 'if':
      if (t.a.op === 'true') return { to: t.b, rule: 'E-IfTrue', redex: t };
      if (t.a.op === 'false') return { to: t.c, rule: 'E-IfFalse', redex: t };
      return rec(t.a, 'E-If', (a) => mk.if(a, t.b, t.c));
    case 'succ': return rec(t.a, 'E-Succ', (a) => mk.succ(a));
    case 'pred':
      if (t.a.op === 'zero') return mode === 'noPredZero' ? null : { to: mk.Z(), rule: 'E-PredZero', redex: t };
      if (t.a.op === 'succ' && isNV(t.a.a)) return mode === 'badPred' ? { to: mk.T(), rule: 'E-PredSuccBad', redex: t } : { to: t.a.a, rule: 'E-PredSucc', redex: t };
      return rec(t.a, 'E-Pred', (a) => mk.pred(a));
    case 'iszero':
      if (t.a.op === 'zero') return mode === 'badIszero' ? { to: mk.Z(), rule: 'E-IszeroZeroBad', redex: t } : { to: mk.T(), rule: 'E-IszeroZero', redex: t };
      if (t.a.op === 'succ' && isNV(t.a.a)) return { to: mk.F(), rule: 'E-IszeroSucc', redex: t };
      return rec(t.a, 'E-Iszero', (a) => mk.iszero(a));
    default: return null;
  }
}
/** Run an NB term to a normal form: {terms, rules, status: 'value' | 'stuck'}. */
export function nbRun(t, mode = 'std', max = 200) {
  const terms = [t], rules = [];
  for (let i = 0; i < max; i++) { const s = nbStep(terms[terms.length - 1], mode); if (!s) break; terms.push(s.to); rules.push(s.rule); }
  const last = terms[terms.length - 1];
  return { terms, rules, status: NB.isVal(last) ? 'value' : 'stuck' };
}
export function nbRunFinal(t, mode = 'std', max = 400) {
  for (let i = 0; i < max; i++) { const s = nbStep(t, mode); if (!s) break; t = s.to; }
  return { t, status: NB.isVal(t) ? 'value' : 'stuck' };
}

// ====================================================================== TM semantics: call-by-value small steps
/** One call-by-value step: {to, rule, redex} or null (a value, or stuck). */
export function tmStep(t) {
  const rec = (x, rule, build) => { const s = tmStep(x); return s ? { to: build(s.to), rule: s.rule, redex: s.redex, cong: rule } : null; };
  switch (t.t) {
    case 'i':
      if (t.a.t === 'c' && t.a.c === 'true') return { to: t.b, rule: 'E-IfTrue', redex: t };
      if (t.a.t === 'c' && t.a.c === 'false') return { to: t.c, rule: 'E-IfFalse', redex: t };
      return rec(t.a, 'E-If', (a) => tI(a, t.b, t.c));
    case 'p':
      if (t.op === 'succ') return rec(t.a, 'E-Succ', (a) => tP('succ', a));
      if (t.op === 'pred') {
        if (t.a.t === 'c' && t.a.c === 'zero') return { to: t.a, rule: 'E-PredZero', redex: t };
        if (t.a.t === 'p' && t.a.op === 'succ' && tIsNV(t.a.a)) return { to: t.a.a, rule: 'E-PredSucc', redex: t };
        return rec(t.a, 'E-Pred', (a) => tP('pred', a));
      }
      if (t.a.t === 'c' && t.a.c === 'zero') return { to: tC('true'), rule: 'E-IszeroZero', redex: t };
      if (t.a.t === 'p' && t.a.op === 'succ' && tIsNV(t.a.a)) return { to: tC('false'), rule: 'E-IszeroSucc', redex: t };
      return rec(t.a, 'E-Iszero', (a) => tP('iszero', a));
    case 'a':
      if (!tIsValue(t.f)) return rec(t.f, 'E-App1', (f) => tA(f, t.a));
      if (!tIsValue(t.a)) return rec(t.a, 'E-App2', (a) => tA(t.f, a));
      if (t.f.t === 'l') return { to: tSubst(t.f.b, t.f.x, t.a), rule: 'E-AppAbs', redex: t };
      return null;
    case 'd':
      if (t.ty && t.ty.k === 'B') return { to: tC('false'), rule: 'E-Default', redex: t };
      if (t.ty && t.ty.k === 'N') return { to: tC('zero'), rule: 'E-Default', redex: t };
      return null;
    default: return null;
  }
}
/** Run call-by-value: {terms, steps:[{rule, redex}], status: 'value' | 'stuck' | 'cut'}. */
export function tmRun(t, max = 60) {
  const terms = [t], steps = [];
  for (let i = 0; i < max; i++) {
    const s = tmStep(terms[terms.length - 1]);
    if (!s) return { terms, steps, status: tIsValue(terms[terms.length - 1]) ? 'value' : 'stuck' };
    terms.push(s.to); steps.push(s);
    if (tSize(s.to) > 400) return { terms, steps, status: 'cut' };
  }
  return { terms, steps, status: 'cut' };
}

// ====================================================================== full reduction (any redex, anywhere)
/** All one-step reducts (one per redex) under full β / δ reduction, including under λ. */
export function allSteps(t) {
  const out = [];
  const root = () => {
    if (t.t === 'a' && t.f.t === 'l') out.push(tSubst(t.f.b, t.f.x, t.a));
    else if (t.t === 'i' && t.a.t === 'c' && t.a.c === 'true') out.push(t.b);
    else if (t.t === 'i' && t.a.t === 'c' && t.a.c === 'false') out.push(t.c);
    else if (t.t === 'p' && t.op === 'pred' && t.a.t === 'c' && t.a.c === 'zero') out.push(t.a);
    else if (t.t === 'p' && t.op === 'pred' && t.a.t === 'p' && t.a.op === 'succ' && tIsNV(t.a.a)) out.push(t.a.a);
    else if (t.t === 'p' && t.op === 'iszero' && t.a.t === 'c' && t.a.c === 'zero') out.push(tC('true'));
    else if (t.t === 'p' && t.op === 'iszero' && t.a.t === 'p' && t.a.op === 'succ' && tIsNV(t.a.a)) out.push(tC('false'));
    else if (t.t === 'd' && t.ty && t.ty.k === 'B') out.push(tC('false'));
    else if (t.t === 'd' && t.ty && t.ty.k === 'N') out.push(tC('zero'));
  };
  root();
  const ks = tKids(t);
  ks.forEach((k, i) => { for (const r of allSteps(k)) out.push(tRebuild(t, ks.map((x, j) => (j === i ? r : x)))); });
  return out;
}
/** Longest and shortest reduction path to normal form over ALL strategies: {max, min, states} | {cut: true, states}. */
export function pathStats(t0, { cap = 3000, maxSize = 300, maxDepth = 400 } = {}) {
  const memo = new Map(), stack = new Set(); let cut = false;
  const go = (t, d) => {
    const k = tKey(t);
    if (memo.has(k)) return memo.get(k);
    if (stack.has(k) || d > maxDepth || memo.size > cap || tSize(t) > maxSize) { cut = true; return { max: 0, min: 0 }; }
    stack.add(k);
    const ss = allSteps(t);
    let r;
    if (!ss.length) r = { max: 0, min: 0 };
    else { let mx = 0, mn = Infinity; for (const s of ss) { const q = go(s, d + 1); mx = Math.max(mx, q.max + 1); mn = Math.min(mn, q.min + 1); if (cut) break; } r = { max: mx, min: mn }; }
    stack.delete(k);
    if (!cut) memo.set(k, r);
    return r;
  };
  const r = go(t0, 0);
  return cut ? { cut: true, states: memo.size } : { max: r.max, min: r.min, states: memo.size };
}
/** Normal order (leftmost-outermost, anywhere) normal form with a step count; {t, n, ok}. */
export function normalizeTM(t, max = 5000, maxSize = 2000) {
  let n = 0;
  while (n < max) {
    const ss = allSteps(t); if (!ss.length) return { t, n, ok: true };
    t = ss[0]; n++; if (tSize(t) > maxSize) break;
  }
  return { t, n, ok: false };
}

// ====================================================================== random terms
const NAMES = 'xyzwuvts';
/** A random well-typed term of type ty in ctx, about n nodes. r = v.rng(seed). */
export function genTyped(r, ty, ctx, n) {
  const vars = ctx.filter(([, T]) => tyEq(T, ty)).map((c) => c[0]);
  const leafBase = () => (vars.length && r() < 0.6 ? tV(r.pick(vars)) : ty.k === 'B' ? tC(r() < 0.5 ? 'true' : 'false') : tNum(Math.floor(r() * 3)));
  if (ty.k === 'f') {
    if (vars.length && n <= 2 && r() < 0.5) return tV(r.pick(vars));
    const x = NAMES[ctx.length % NAMES.length];
    return tL(x, ty.a, genTyped(r, ty.b, [...ctx, [x, ty.a]], Math.max(1, n - 1)));
  }
  if (n <= 1) return leafBase();
  const x = r();
  if (n >= 4 && x < 0.28) {
    const a = 1 + Math.floor(r() * (n - 3)), b = 1 + Math.floor(r() * Math.max(1, n - 2 - a)), c = Math.max(1, n - 1 - a - b);
    return tI(genTyped(r, TB, ctx, a), genTyped(r, ty, ctx, b), genTyped(r, ty, ctx, c));
  }
  if (n >= 3 && x < 0.7) {
    const S = r.pick([TN, TN, TB, TF(TN, TN), TF(TB, TB), TF(TN, TF(TN, TN))]);
    const a = 1 + Math.floor(r() * Math.max(1, n - 3));
    return tA(genTyped(r, TF(S, ty), ctx, Math.max(2, n - 1 - a)), genTyped(r, S, ctx, a));
  }
  if (ty.k === 'N' && x < 0.88) return tP(r() < 0.6 ? 'succ' : 'pred', genTyped(r, TN, ctx, n - 1));
  if (ty.k === 'B' && x < 0.88) return tP('iszero', genTyped(r, TN, ctx, n - 1));
  return leafBase();
}
/** A random pure λ-term (variables, abstractions, applications) of about n nodes; may diverge. */
export function genPure(r, n, vars = []) {
  if (n <= 1) { if (vars.length) return tV(r.pick(vars)); const x = 'x'; return tL(x, null, tV(x)); }
  const x = r();
  if (x < 0.4 || (!vars.length && n <= 2)) { const nm = NAMES[vars.length % NAMES.length]; return tL(nm, null, genPure(r, n - 1, [...vars, nm])); }
  const a = 1 + Math.floor(r() * (n - 2));
  return tA(genPure(r, a, vars), genPure(r, Math.max(1, n - 1 - a), vars));
}

// ====================================================================== Curry-style inference (unification with occurs check)
/** Infer a type for a term whose λ's may lack annotations. Returns
 *  {ok, ty, cons: [{a, b, why}], failed: {a, b, why, occurs}, binders: Map(lambdaNode → Ty), env: free-variable types, nvars}. */
export function infer(t0) {
  let nv = 0; const fresh = () => TV(nv++);
  const cons = [], binders = new Map(), freeEnv = new Map();
  const gen = (t, env) => {
    switch (t.t) {
      case 'v': { for (let i = env.length - 1; i >= 0; i--) if (env[i][0] === t.x) return env[i][1]; if (!freeEnv.has(t.x)) freeEnv.set(t.x, fresh()); return freeEnv.get(t.x); }
      case 'c': return t.c === 'zero' ? TN : TB;
      case 'd': return t.ty || fresh();
      case 'l': { const X = t.ty || fresh(); binders.set(t, X); const R = gen(t.b, [...env, [t.x, X]]); return TF(X, R); }
      case 'a': {
        const f = gen(t.f, env), a = gen(t.a, env), R = fresh();
        cons.push({ a: f, b: TF(a, R), why: `application ${tStr(t, { noTypes: true })}` });
        return R;
      }
      case 'p': { const a = gen(t.a, env); cons.push({ a, b: TN, why: `${t.op} needs Nat` }); return t.op === 'iszero' ? TB : TN; }
      case 'i': {
        const a = gen(t.a, env), b = gen(t.b, env), c = gen(t.c, env);
        cons.push({ a, b: TB, why: 'if guard is Bool' }, { a: b, b: c, why: 'if branches agree' }); return b;
      }
      default: return fresh();
    }
  };
  const ty0 = gen(t0, []);
  const sub = new Map();
  const walk = (T) => { while (T.k === 'v' && sub.has(T.n)) T = sub.get(T.n); return T; };
  const occurs = (n, T) => { T = walk(T); return T.k === 'v' ? T.n === n : T.k === 'f' ? occurs(n, T.a) || occurs(n, T.b) : false; };
  const unify = (a, b) => {
    a = walk(a); b = walk(b);
    if (a.k === 'v' && b.k === 'v' && a.n === b.n) return null;
    if (a.k === 'v') return occurs(a.n, b) ? { occurs: true } : (sub.set(a.n, b), null);
    if (b.k === 'v') return occurs(b.n, a) ? { occurs: true } : (sub.set(b.n, a), null);
    if (a.k === 'f' && b.k === 'f') return unify(a.a, b.a) || unify(a.b, b.b);
    return a.k === b.k ? null : { clash: true };
  };
  let failed = null;
  for (const c of cons) { const e = unify(c.a, c.b); if (e) { failed = { ...c, ...e }; break; } }
  const full = (T) => { T = walk(T); return T.k === 'f' ? TF(full(T.a), full(T.b)) : T; };
  if (failed) return { ok: false, cons, failed, nvars: nv, full, binders, freeEnv };
  const names = new Map(); // rename remaining variables α β γ … in order of appearance
  const ren = (T) => { T = full(T); if (T.k === 'v') { if (!names.has(T.n)) names.set(T.n, names.size); return TV(names.get(T.n)); } return T.k === 'f' ? TF(ren(T.a), ren(T.b)) : T; };
  const ty = ren(ty0);
  const bnd = new Map([...binders].map(([k, T]) => [k, ren(T)]));
  const env = new Map([...freeEnv].map(([k, T]) => [k, ren(T)]));
  return { ok: true, ty, cons, binders: bnd, freeEnv: env, nvars: names.size, full, ren };
}
/** Annotate every λ of t with the given types (Map node → Ty). */
export function annotate(t, binders) {
  if (t.t === 'l') return tL(t.x, binders.get(t) || t.ty, annotate(t.b, binders));
  const ks = tKids(t); return ks.length ? tRebuild(t, ks.map((k) => annotate(k, binders))) : t;
}
/** Substitute closed types for the type variables of T (σ: array indexed by variable number). */
export function tySubst(T, sigma) { return T.k === 'v' ? sigma[T.n] || T : T.k === 'f' ? TF(tySubst(T.a, sigma), tySubst(T.b, sigma)) : T; }
export function tyVars(T, out = new Set()) { if (T.k === 'v') out.add(T.n); else if (T.k === 'f') { tyVars(T.a, out); tyVars(T.b, out); } return out; }

// ====================================================================== small drawing helpers
/** Draw rows of coloured segments one under another in pixel space; returns the y after the last row. */
export function wrapSegs(s, parts, w, size) {
  const ctx = s.ctx; ctx.save(); ctx.font = s._font({ size, weight: 500 });
  const lines = [[]]; let cur = 0;
  for (const p of parts) {
    const pieces = p.s.split(/(?<= )/);
    for (const pc of pieces) {
      const pw = ctx.measureText(pc).width;
      if (cur + pw > w && lines[lines.length - 1].length) { lines.push([]); cur = 0; }
      lines[lines.length - 1].push({ ...p, s: pc }); cur += pw;
    }
  }
  ctx.restore(); return lines;
}
export const okMark = (b) => (b ? '✓' : '✗');

/** KaTeX \mathtt rendering of a plain term string. */
export const tx = (str) => '\\mathtt{' + str.replace(/λ/g, '\\lambda ').replace(/→/g, '\\to ').replace(/⊢/g, '\\vdash ').replace(/ /g, '\\ ') + '}';
export const txTy = (T) => tx(tyStr(T));

function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
/** Flow of rounded chips [{text, color, fill, data}] inside region [x0, y0, x1, y1]; returns boxes [{x, y, w, h, chip}] (and {more} = number not shown). */
export function drawChips(v, s, chips, { region = [0, 0, s.W, s.H], size = 13, gap = 7, rowH = size + 14 } = {}) {
  const ctx = s.ctx, [x0, y0, x1, y1] = region, boxes = []; let x = x0, y = y0, shown = 0;
  ctx.save(); ctx.font = s._font({ size, weight: 600 });
  for (const c of chips) {
    const w = ctx.measureText(c.text).width + 16;
    if (x + w > x1 && x > x0) { x = x0; y += rowH; }
    if (y + rowH > y1 + 2) break;
    boxes.push({ x, y, w, h: rowH - 5, chip: c }); x += w + gap; shown++;
  }
  ctx.restore();
  for (const b of boxes) {
    const col = b.chip.color || 'muted';
    ctx.save(); rrect(ctx, b.x, b.y, b.w, b.h, 8); ctx.fillStyle = v.color(b.chip.fill || col, b.chip.fill ? 0.22 : 0.1); ctx.fill();
    ctx.strokeStyle = v.color(col, 1); ctx.lineWidth = b.chip.hot ? 2.4 : 1.3; ctx.stroke(); ctx.restore();
    s.textPx(b.chip.text, b.x + b.w / 2, b.y + b.h / 2, { size, weight: 600, align: 'center', color: b.chip.text_color || 'ink', halo: false });
  }
  return { boxes, more: chips.length - shown };
}
export const hitChip = (info, px, py) => (info ? info.boxes.find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) : null);

/** A 2-row tally table. rows/cols: labels; counts[r][c]; tone[r][c]: colour name; zero[r][c]: true when the cell must be 0 (shown boldly). Returns cell boxes. */
export function drawTally(v, s, { rows, cols, counts, tone, sel = null, region = [0, 0, s.W, s.H], note = null }) {
  const [x0, y0, x1, y1] = region, lw = Math.min(150, (x1 - x0) * 0.24), cw = (x1 - x0 - lw) / cols.length, hh = 26, rh = (y1 - y0 - hh) / rows.length;
  const ctx = s.ctx, cells = [];
  cols.forEach((c, j) => s.textPx(c, x0 + lw + cw * (j + 0.5), y0 + hh / 2, { size: 12.5, weight: 700, color: 'muted', align: 'center', halo: false }));
  rows.forEach((r, i) => {
    const tot = counts[i].reduce((a, b) => a + b, 0);
    s.textPx(r, x0 + lw - 10, y0 + hh + rh * (i + 0.5), { size: 13, weight: 700, align: 'right', halo: false });
    cols.forEach((c, j) => {
      const n = counts[i][j], bx = x0 + lw + cw * j + 4, by = y0 + hh + rh * i + 4, bw = cw - 8, bh = rh - 8, col = tone[i][j] || 'accent';
      ctx.save(); rrect(ctx, bx, by, bw, bh, 9); ctx.fillStyle = v.color('panel', 1); ctx.fill();
      rrect(ctx, bx, by, bw * (tot ? n / tot : 0), bh, 9); ctx.fillStyle = v.color(col, 0.2); ctx.fill();
      rrect(ctx, bx, by, bw, bh, 9); ctx.strokeStyle = v.color(col, sel && sel[0] === i && sel[1] === j ? 1 : 0.7); ctx.lineWidth = sel && sel[0] === i && sel[1] === j ? 3 : 1.4; ctx.stroke(); ctx.restore();
      s.textPx(String(n), bx + bw / 2, by + bh / 2 - 6, { size: 22, weight: 800, align: 'center', color: n === 0 && tone[i][j] === 'red' ? 'green' : col, halo: false });
      s.textPx(tot ? Math.round(100 * n / tot) + '% of row' : '', bx + bw / 2, by + bh / 2 + 16, { size: 11, color: 'muted', align: 'center', halo: false });
      cells.push({ i, j, x: bx, y: by, w: bw, h: bh });
    });
  });
  if (note) s.textPx(note, x1 - 4, y1 + 0, { size: 11, color: 'muted', align: 'right', halo: false });
  return cells;
}
export const hitCell = (cells, px, py) => (cells || []).find((c) => px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h);

// ====================================================================== census of all NB terms up to a size
const censusCache = new Map();
/** Classify every NB term of at most N nodes: rows 0 = well typed, 1 = ill typed; cols 0 = value, 1 = can step, 2 = stuck (normal form, not a value). */
export function nbCensus(N, mode = 'std') {
  const key = N + mode; if (censusCache.has(key)) return censusCache.get(key);
  const counts = [[0, 0, 0], [0, 0, 0]], ex = [[[], [], []], [[], [], []]];
  for (let n = 1; n <= N; n++) for (const t of NB.termsOfSize(n)) {
    const i = nbType(t) ? 0 : 1, j = NB.isVal(t) ? 0 : nbStep(t, mode) ? 1 : 2;
    counts[i][j]++; if (ex[i][j].length < 14) ex[i][j].push(t);
  }
  const r = { counts, ex }; censusCache.set(key, r); return r;
}
