// Programming Languages & Types — Chapter 1: helpers shared by ch01.js and ch01-b.js.
// Contains (a) the arithmetic-and-boolean language NB of Pierce (TAPL ch. 3): parser, printer, small-step rules
// (with optional extra rules to break determinacy / termination), big-step derivations, enumeration of all terms
// up to a size; (b) a small imperative language IMP: parser, small-step semantics, structural denotation;
// (c) a generic tree / derivation-tree drawer that works in pixel space on a stage with axes: false.

// ====================================================================== NB terms
const mkT = () => ({ op: 'true' }), mkF = () => ({ op: 'false' }), mkZ = () => ({ op: 'zero' });
export const mk = {
  T: mkT, F: mkF, Z: mkZ,
  succ: (a) => ({ op: 'succ', a }), pred: (a) => ({ op: 'pred', a }), iszero: (a) => ({ op: 'iszero', a }),
  if: (a, b, c) => ({ op: 'if', a, b, c }),
  num: (n) => { let t = mkZ(); for (let i = 0; i < n; i++) t = { op: 'succ', a: t }; return t; },
};
export const kids = (t) => (t.op === 'if' ? [t.a, t.b, t.c] : t.a ? [t.a] : []);
export const withKids = (t, ks) => (t.op === 'if' ? mk.if(ks[0], ks[1], ks[2]) : t.a ? { op: t.op, a: ks[0] } : t);
export const NB_LABEL = { true: 'true', false: 'false', zero: '0', succ: 'succ', pred: 'pred', iszero: 'iszero', if: 'if' };
export const size = (t) => 1 + kids(t).reduce((s, k) => s + size(k), 0);
export const depth = (t) => 1 + Math.max(0, ...kids(t).map(depth)); // Pierce: a constant has depth 1
export function consts(t, out = new Set()) { if (!kids(t).length) out.add(NB_LABEL[t.op]); else kids(t).forEach((k) => consts(k, out)); return out; }
export const numOf = (t) => { let n = 0; while (t.op === 'succ') { n++; t = t.a; } return t.op === 'zero' ? n : -1; };
export const isNV = (t) => numOf(t) >= 0;
export const isVal = (t) => t.op === 'true' || t.op === 'false' || isNV(t);
export function eqT(a, b) {
  if (a.op !== b.op) return false;
  const ka = kids(a), kb = kids(b);
  return ka.every((k, i) => eqT(k, kb[i]));
}
export function preorder(t, out = []) { out.push(t); kids(t).forEach((k) => preorder(k, out)); return out; }
export function postorder(t, out = []) { kids(t).forEach((k) => postorder(k, out)); out.push(t); return out; }
export function subterms(t) { return preorder(t); }

// ---------------------------------------------------------------------- parser
const KW = new Set(['true', 'false', 'if', 'then', 'else', 'succ', 'pred', 'iszero']);
export function tokenizeNB(src) {
  const out = []; const re = /\s+|\d+|[A-Za-z_][A-Za-z_0-9]*|./gy; let m;
  while ((m = re.exec(src))) {
    const w = m[0];
    if (/^\s+$/.test(w)) continue;
    out.push({ w, pos: m.index, len: w.length });
  }
  return out;
}
/** Parse NB. Numerals n are sugar for succ^n 0. Prefix operators bind tighter than if; `if` as an operand needs parentheses. */
export function parseNB(src) {
  const toks = tokenizeNB(src); let k = 0;
  const peek = () => toks[k];
  const fail = (msg, tk = peek()) => { throw { msg, pos: tk ? tk.pos : src.length, len: tk ? tk.len : 1 }; };
  const expect = (w) => { const t = peek(); if (!t || t.w !== w) fail(t ? `expected “${w}” but found “${t.w}”` : `expected “${w}” but the term ends`); k++; };
  const term = () => {
    const t = peek();
    if (!t) fail('the term ends too early');
    if (t.w === 'if') { k++; const a = term(); expect('then'); const b = term(); expect('else'); const c = term(); return mk.if(a, b, c); }
    return prefix();
  };
  const prefix = () => {
    const t = peek();
    if (t && (t.w === 'succ' || t.w === 'pred' || t.w === 'iszero')) { k++; const a = prefix(); return { op: t.w, a }; }
    return atom();
  };
  const atom = () => {
    const t = peek();
    if (!t) fail('the term ends too early');
    if (t.w === 'true') { k++; return mkT(); }
    if (t.w === 'false') { k++; return mkF(); }
    if (/^\d+$/.test(t.w)) { k++; const n = +t.w; if (n > 40) fail('numerals above 40 are not supported here', t); return mk.num(n); }
    if (t.w === '(') { k++; const e = term(); expect(')'); return e; }
    if (t.w === 'if') fail('an “if” used as an operand needs parentheses');
    if (t.w === ')') fail('unexpected “)”');
    if (t.w === 'then' || t.w === 'else') fail(`“${t.w}” without a matching “if”`);
    if (/^[A-Za-z_]/.test(t.w)) fail(`unknown word “${t.w}” (this language has true, false, 0, succ, pred, iszero, if)`);
    fail(`unexpected symbol “${t.w}”`);
  };
  try {
    if (!toks.length) return { error: 'empty term', pos: 0, len: 1 };
    const ast = term();
    if (k < toks.length) fail(`unexpected “${toks[k].w}” after a complete term`);
    return { ast };
  } catch (e) { if (e && e.msg) return { error: e.msg, pos: e.pos, len: e.len }; throw e; }
}

// ---------------------------------------------------------------------- printing
/** Printed segments [{s, hi}]; `hi` is a node (or array of nodes) to highlight (whole subterm). */
export function segs(t, hi = null) {
  const out = [];
  const isHi = (x) => hi && (Array.isArray(hi) ? hi.includes(x) : hi === x);
  const push = (s, h) => out.push({ s, hi: !!h });
  const go = (x, operand, h) => {
    const H = h || isHi(x);
    const n = numOf(x);
    if (n >= 0) { push(String(n), H); return; }
    if (x.op === 'true' || x.op === 'false') { push(x.op, H); return; }
    if (x.op === 'if') {
      if (operand) push('(', H);
      push('if ', H); go(x.a, false, H); push(' then ', H); go(x.b, false, H); push(' else ', H); go(x.c, false, H);
      if (operand) push(')', H);
      return;
    }
    push(x.op + ' ', H); go(x.a, true, H);
  };
  go(t, false, false);
  return out;
}
export const str = (t) => segs(t).map((s) => s.s).join('');
/** Fully expanded string where numerals are not abbreviated (succ succ 0). */
export function strRaw(t) {
  if (t.op === 'true' || t.op === 'false') return t.op;
  if (t.op === 'zero') return '0';
  if (t.op === 'if') return `if ${strRaw(t.a)} then ${strRaw(t.b)} else ${strRaw(t.c)}`;
  const inner = strRaw(t.a);
  return `${t.op} ${t.a.op === 'if' ? `(${inner})` : inner}`;
}

// ---------------------------------------------------------------------- small-step semantics
export const BASE_RULES = ['E-IfTrue', 'E-IfFalse', 'E-If', 'E-Succ', 'E-PredZero', 'E-PredSucc', 'E-Pred', 'E-IszeroZero', 'E-IszeroSucc', 'E-Iszero'];
/** Rule schemas for display: premises and conclusion as plain text. */
export const RULES = {
  'E-IfTrue': { pre: [], concl: 'if true then t₂ else t₃ → t₂' },
  'E-IfFalse': { pre: [], concl: 'if false then t₂ else t₃ → t₃' },
  'E-If': { pre: ['t₁ → t₁′'], concl: 'if t₁ then t₂ else t₃ → if t₁′ then t₂ else t₃' },
  'E-Succ': { pre: ['t₁ → t₁′'], concl: 'succ t₁ → succ t₁′' },
  'E-PredZero': { pre: [], concl: 'pred 0 → 0' },
  'E-PredSucc': { pre: [], concl: 'pred (succ nv₁) → nv₁' },
  'E-Pred': { pre: ['t₁ → t₁′'], concl: 'pred t₁ → pred t₁′' },
  'E-IszeroZero': { pre: [], concl: 'iszero 0 → true' },
  'E-IszeroSucc': { pre: [], concl: 'iszero (succ nv₁) → false' },
  'E-Iszero': { pre: ['t₁ → t₁′'], concl: 'iszero t₁ → iszero t₁′' },
  // extra rules (illustrative, ours): they break determinacy or termination
  'E-Funny1': { pre: [], concl: 'if true then t₂ else t₃ → t₃' },
  'E-Funny2': { pre: ['t₂ → t₂′'], concl: 'if t₁ then t₂ else t₃ → if t₁ then t₂′ else t₃' },
  'E-Loop': { pre: [], concl: 'iszero 0 → if true then iszero 0 else 0' },
};
export const RULE_COLOR = {
  'E-IfTrue': 'green', 'E-IfFalse': 'green', 'E-If': 'accent', 'E-Succ': 'accent', 'E-Pred': 'accent', 'E-Iszero': 'accent',
  'E-PredZero': 'orange', 'E-PredSucc': 'orange', 'E-IszeroZero': 'purple', 'E-IszeroSucc': 'purple',
  'E-Funny1': 'red', 'E-Funny2': 'red', 'E-Loop': 'red',
};
export const isCongruence = (r) => ['E-If', 'E-Succ', 'E-Pred', 'E-Iszero', 'E-Funny2'].includes(r);

/** All one-step successors of t under the rule set R (array of names). Each: {rule (root rule), axiom (innermost rule), to, redex (node), deriv}. */
export function stepsOf(t, R = BASE_RULES) {
  const has = (r) => R.includes(r), res = [];
  const mkRes = (rule, to, redex, axiomOf, kidRes) => { let d = null; return { rule, axiom: axiomOf ? axiomOf.axiom : rule, to, redex, get deriv() { return d || (d = { c: `${str(t)} → ${str(to)}`, rule, kids: kidRes ? [kidRes.deriv] : [] }); } }; };
  const cong = (rule, child, build) => { if (has(rule)) for (const s of stepsOf(child, R)) res.push(mkRes(rule, build(s.to), s.redex, s, s)); };
  switch (t.op) {
    case 'if':
      if (has('E-IfTrue') && t.a.op === 'true') res.push(mkRes('E-IfTrue', t.b, t));
      if (has('E-IfFalse') && t.a.op === 'false') res.push(mkRes('E-IfFalse', t.c, t));
      if (has('E-Funny1') && t.a.op === 'true') res.push(mkRes('E-Funny1', t.c, t));
      cong('E-If', t.a, (a) => mk.if(a, t.b, t.c));
      cong('E-Funny2', t.b, (b) => mk.if(t.a, b, t.c));
      break;
    case 'succ': cong('E-Succ', t.a, (a) => mk.succ(a)); break;
    case 'pred':
      if (has('E-PredZero') && t.a.op === 'zero') res.push(mkRes('E-PredZero', mkZ(), t));
      if (has('E-PredSucc') && t.a.op === 'succ' && isNV(t.a.a)) res.push(mkRes('E-PredSucc', t.a.a, t));
      cong('E-Pred', t.a, (a) => mk.pred(a));
      break;
    case 'iszero':
      if (has('E-IszeroZero') && t.a.op === 'zero') res.push(mkRes('E-IszeroZero', mkT(), t));
      if (has('E-Loop') && t.a.op === 'zero') res.push(mkRes('E-Loop', mk.if(mkT(), mk.iszero(mkZ()), mkZ()), t));
      if (has('E-IszeroSucc') && t.a.op === 'succ' && isNV(t.a.a)) res.push(mkRes('E-IszeroSucc', mkF(), t));
      cong('E-Iszero', t.a, (a) => mk.iszero(a));
      break;
    default: break;
  }
  return res;
}
/** Fast deterministic step with the standard rules; null if none applies. */
export function step1(t) {
  switch (t.op) {
    case 'if': {
      if (t.a.op === 'true') return t.b;
      if (t.a.op === 'false') return t.c;
      const a = step1(t.a); return a ? mk.if(a, t.b, t.c) : null;
    }
    case 'succ': { const a = step1(t.a); return a ? mk.succ(a) : null; }
    case 'pred': {
      if (t.a.op === 'zero') return mkZ();
      if (t.a.op === 'succ' && isNV(t.a.a)) return t.a.a;
      const a = step1(t.a); return a ? mk.pred(a) : null;
    }
    case 'iszero': {
      if (t.a.op === 'zero') return mkT();
      if (t.a.op === 'succ' && isNV(t.a.a)) return mkF();
      const a = step1(t.a); return a ? mk.iszero(a) : null;
    }
    default: return null;
  }
}
/** Run to a normal form (choosing the first applicable step). Returns {terms, steps, status: 'value'|'stuck'|'cut'}. */
export function runSmall(t, R = BASE_RULES, max = 80) {
  const terms = [t], steps = [];
  for (let i = 0; i < max; i++) {
    const s = stepsOf(terms[terms.length - 1], R);
    if (!s.length) { const last = terms[terms.length - 1]; return { terms, steps, status: isVal(last) ? 'value' : 'stuck' }; }
    steps.push(s[0]); terms.push(s[0].to);
  }
  return { terms, steps, status: 'cut' };
}
/** Fast: normal form of t under the standard rules (no cap needed: terminates). */
export function nf(t) { let n = 0; for (let s = step1(t); s; s = step1(t)) { t = s; n++; } return { t, n }; }

// ---------------------------------------------------------------------- big-step semantics
export const BIG_RULES = {
  'B-Value': { pre: [], concl: 'v ⇓ v' },
  'B-IfTrue': { pre: ['t₁ ⇓ true', 't₂ ⇓ v₂'], concl: 'if t₁ then t₂ else t₃ ⇓ v₂' },
  'B-IfFalse': { pre: ['t₁ ⇓ false', 't₃ ⇓ v₃'], concl: 'if t₁ then t₂ else t₃ ⇓ v₃' },
  'B-Succ': { pre: ['t₁ ⇓ nv₁'], concl: 'succ t₁ ⇓ succ nv₁' },
  'B-PredZero': { pre: ['t₁ ⇓ 0'], concl: 'pred t₁ ⇓ 0' },
  'B-PredSucc': { pre: ['t₁ ⇓ succ nv₁'], concl: 'pred t₁ ⇓ nv₁' },
  'B-IszeroZero': { pre: ['t₁ ⇓ 0'], concl: 'iszero t₁ ⇓ true' },
  'B-IszeroSucc': { pre: ['t₁ ⇓ succ nv₁'], concl: 'iszero t₁ ⇓ false' },
};
/** Big-step derivation of t ⇓ v: {t, val, c, rule, kids, ok}; on failure ok=false with the offending node marked. */
export function bigDeriv(t) {
  if (isVal(t)) return { t, val: t, c: `${str(t)} ⇓ ${str(t)}`, rule: 'B-Value', kids: [], ok: true };
  const sub = kids(t).map(() => null);
  const fail = (why, ks) => ({ t, val: null, c: `${str(t)} ⇓ ?`, rule: null, kids: ks, ok: false, why });
  const ok = (rule, val, ks) => ({ t, val, c: `${str(t)} ⇓ ${str(val)}`, rule, kids: ks, ok: true });
  if (t.op === 'if') {
    const d1 = bigDeriv(t.a);
    if (!d1.ok) return fail('the condition has no value', [d1]);
    if (d1.val.op === 'true') { const d2 = bigDeriv(t.b); return d2.ok ? ok('B-IfTrue', d2.val, [d1, d2]) : fail('the then-branch has no value', [d1, d2]); }
    if (d1.val.op === 'false') { const d3 = bigDeriv(t.c); return d3.ok ? ok('B-IfFalse', d3.val, [d1, d3]) : fail('the else-branch has no value', [d1, d3]); }
    return fail(`the condition evaluates to ${str(d1.val)}, which is not a boolean`, [d1]);
  }
  void sub;
  const d1 = bigDeriv(t.a);
  if (!d1.ok) return fail('the argument has no value', [d1]);
  const v = d1.val, n = numOf(v);
  if (t.op === 'succ') return n >= 0 ? ok('B-Succ', mk.succ(v), [d1]) : fail(`succ needs a number, but its argument is ${str(v)}`, [d1]);
  if (t.op === 'pred') {
    if (n === 0) return ok('B-PredZero', mkZ(), [d1]);
    if (n > 0) return ok('B-PredSucc', v.a, [d1]);
    return fail(`pred needs a number, but its argument is ${str(v)}`, [d1]);
  }
  if (t.op === 'iszero') {
    if (n === 0) return ok('B-IszeroZero', mkT(), [d1]);
    if (n > 0) return ok('B-IszeroSucc', mkF(), [d1]);
    return fail(`iszero needs a number, but its argument is ${str(v)}`, [d1]);
  }
  return fail('no rule applies', []);
}
/** Fast big-step evaluator: value term or null. */
export function bigEval(t) {
  switch (t.op) {
    case 'true': case 'false': case 'zero': return t;
    case 'if': { const c = bigEval(t.a); if (!c) return null; return c.op === 'true' ? bigEval(t.b) : c.op === 'false' ? bigEval(t.c) : null; }
    case 'succ': { const v = bigEval(t.a); return v && isNV(v) ? mk.succ(v) : null; }
    case 'pred': { const v = bigEval(t.a); if (!v || !isNV(v)) return null; return v.op === 'zero' ? mkZ() : v.a; }
    case 'iszero': { const v = bigEval(t.a); if (!v || !isNV(v)) return null; return v.op === 'zero' ? mkT() : mkF(); }
    default: return null;
  }
}
/** Annotate a successful big-step derivation with the interval [start, end) of the small-step run it accounts for,
 *  and the one-hole context (function) in which it sits. Returns the step count. */
export function annotate(d, start, ctx) {
  d.start = start; d.ctx = ctx;
  let n = 0;
  const t = d.t;
  if (d.rule === 'B-Value') n = 0;
  else if (t.op === 'if') {
    const [d1, d2] = d.kids;
    const n1 = annotate(d1, start, (x) => ctx(mk.if(x, t.b, t.c)));
    const n2 = annotate(d2, start + n1 + 1, ctx);
    n = n1 + 1 + n2;
  } else {
    const n1 = annotate(d.kids[0], start, (x) => ctx({ op: t.op, a: x }));
    n = t.op === 'succ' ? n1 : n1 + 1;
  }
  d.end = start + n;
  return n;
}
/** Check the annotation against an actual small-step trace: trace[start] = ctx(t) and trace[end] = ctx(val) for every node. */
export function checkAnnotation(d, trace) {
  let ok = 0, bad = 0;
  const go = (x) => {
    if (x.ctx && trace[x.start] && trace[x.end] && eqT(trace[x.start], x.ctx(x.t)) && eqT(trace[x.end], x.ctx(x.val))) ok++; else bad++;
    x.kids.forEach(go);
  };
  go(d);
  return { ok, bad };
}

// ---------------------------------------------------------------------- enumeration
const memoTerms = [null];
/** All NB terms with exactly n nodes (cached). n up to 8 is fine (about 10^5 terms). */
export function termsOfSize(n) {
  if (memoTerms[n]) return memoTerms[n];
  let out = [];
  if (n === 1) out = [mkT(), mkF(), mkZ()];
  else {
    for (const a of termsOfSize(n - 1)) out.push(mk.succ(a), mk.pred(a), mk.iszero(a));
    for (let a = 1; a <= n - 3; a++) for (let b = 1; a + b <= n - 2; b++) {
      const c = n - 1 - a - b;
      for (const x of termsOfSize(a)) for (const y of termsOfSize(b)) for (const z of termsOfSize(c)) out.push(mk.if(x, y, z));
    }
  }
  memoTerms[n] = out; return out;
}
export const countTerms = (n) => termsOfSize(n).length;
/** A random term of about the given size (seeded RNG r(): uniform [0,1)); mostly well-typed when `typed` is true. */
export function randomTerm(r, budget, want = 'any', typed = 0.85) {
  const w = want === 'any' ? (r() < 0.5 ? 'num' : 'bool') : want;
  const sloppy = r() > typed;
  const kind = sloppy ? (w === 'num' ? 'bool' : 'num') : w;
  if (budget <= 1) {
    if (kind === 'bool') return r() < 0.5 ? mkT() : mkF();
    return mkZ();
  }
  if (budget >= 4 && r() < 0.45) {
    const a = 1 + Math.floor(r() * Math.max(1, (budget - 3) / 3)), b = 1 + Math.floor(r() * Math.max(1, (budget - 2 - a) / 2));
    const c = Math.max(1, budget - 1 - a - b);
    return mk.if(randomTerm(r, a, 'bool', typed), randomTerm(r, b, w, typed), randomTerm(r, c, w, typed));
  }
  if (kind === 'bool') return mk.iszero(randomTerm(r, budget - 1, 'num', typed));
  const x = r();
  const inner = randomTerm(r, budget - 1, 'num', typed);
  return x < 0.6 ? mk.succ(inner) : mk.pred(inner);
}

// ====================================================================== generic drawing
function rr(ctx, x, y, w, h, rad) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad); else ctx.rect(x, y, w, h);
}
/** Draw a line of coloured segments [{s, hi, color?}] starting at pixel (X, Y); returns the width. align: left|center. */
export function drawSegs(v, s, parts, X, Y, o = {}) {
  const size = o.size || 15, ctx = s.ctx;
  ctx.save(); ctx.font = s._font({ size, weight: 500 });
  const widths = parts.map((p) => ctx.measureText(p.s).width), total = widths.reduce((a, b) => a + b, 0);
  ctx.restore();
  let x = o.align === 'center' ? X - total / 2 : X;
  const hiColor = o.hiColor || 'gold';
  // highlight pills under merged runs of highlighted segments
  for (let i = 0; i < parts.length;) {
    if (!parts[i].hi) { x += widths[i]; i++; continue; }
    let j = i, w = 0; while (j < parts.length && parts[j].hi) { w += widths[j]; j++; }
    ctx.save(); rr(ctx, x - 3, Y - size * 0.75, w + 6, size * 1.5, 5);
    ctx.fillStyle = v.color(hiColor, 0.28); ctx.fill(); ctx.strokeStyle = v.color(hiColor, 0.95); ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
    x += w; i = j;
  }
  x = o.align === 'center' ? X - total / 2 : X;
  parts.forEach((p, i) => { s.textPx(p.s, x, Y, { size, color: p.color || (p.hi ? 'ink' : o.color || 'ink'), weight: 500, align: 'left', halo: false }); x += widths[i]; });
  return total;
}
export const segWidth = (s, parts, size) => { const ctx = s.ctx; ctx.save(); ctx.font = s._font({ size, weight: 500 }); const w = parts.reduce((a, p) => a + ctx.measureText(p.s).width, 0); ctx.restore(); return w; };

/** Generic tree layout; node = {label, kids?, ...}. Leaves are evenly spaced, parents centred over their children. */
export function layoutG(root, kidsOf = (n) => n.kids || []) {
  const nodes = []; let leaf = 0;
  const go = (n, d, parent) => {
    const nd = { n, d, parent, kids: [], id: nodes.length }; nodes.push(nd);
    const ks = kidsOf(n);
    if (!ks.length) nd.x = leaf++;
    else { for (const k of ks) nd.kids.push(go(k, d + 1, nd)); nd.x = (nd.kids[0].x + nd.kids[nd.kids.length - 1].x) / 2; }
    return nd;
  };
  go(root, 0, null);
  return { nodes, width: Math.max(1, leaf), depth: Math.max(...nodes.map((q) => q.d)) };
}
/** Draw a laid-out tree in pixel space. opts: {fill(nd) → colour, ring(nd) → colour, note(nd) → text, labelOf(nd), size, dy, region:[x0,y0,x1,y1], dim(nd)}.
 *  Sets nd.px, nd.py, nd.pw, nd.ph (pixel box) on every node and returns L. */
export function drawTreePx(v, s, L, opts = {}) {
  const ctx = s.ctx, [rx0, ry0, rx1, ry1] = opts.region || [0, 0, s.W, s.H];
  let size = opts.size || 13.5;
  const labelOf = opts.labelOf || ((nd) => String(nd.n.label));
  const measure = () => { ctx.save(); ctx.font = s._font({ size, weight: 700 }); const w = L.nodes.map((nd) => Math.max(26, ctx.measureText(labelOf(nd)).width + 14)); ctx.restore(); return w; };
  let widths = measure(), W = rx1 - rx0 - 16;
  while (W / L.width < Math.max(...widths) + 4 && size > 8.5) { size -= 0.5; widths = measure(); }
  const dx = Math.min(opts.maxDx || 100, W / L.width), totalW = dx * L.width;
  const ox = rx0 + (rx1 - rx0 - totalW) / 2 + dx / 2;
  const dy = Math.min(opts.dy || 64, (ry1 - ry0 - 44) / Math.max(1, L.depth)), oy = ry0 + 24 + Math.max(0, (ry1 - ry0 - 44 - dy * L.depth) / 2);
  L.nodes.forEach((nd, i) => { nd.px = ox + nd.x * dx; nd.py = oy + nd.d * dy; nd.pw = widths[i]; nd.ph = size + 11; });
  ctx.save();
  for (const nd of L.nodes) for (const k of nd.kids) {
    const dimmed = opts.dim && opts.dim(k);
    ctx.beginPath(); ctx.moveTo(nd.px, nd.py + nd.ph / 2); ctx.lineTo(k.px, k.py - k.ph / 2);
    ctx.strokeStyle = v.color(opts.edgeColor ? opts.edgeColor(k) || 'muted' : 'muted', dimmed ? 0.3 : 0.9); ctx.lineWidth = 1.5; ctx.stroke();
  }
  for (const nd of L.nodes) {
    const fill = opts.fill && opts.fill(nd), ring = opts.ring && opts.ring(nd), dimmed = opts.dim && opts.dim(nd);
    if (ring) { rr(ctx, nd.px - nd.pw / 2 - 4, nd.py - nd.ph / 2 - 4, nd.pw + 8, nd.ph + 8, 10); ctx.strokeStyle = v.color(ring, 1); ctx.lineWidth = 2.4; ctx.stroke(); }
    rr(ctx, nd.px - nd.pw / 2, nd.py - nd.ph / 2, nd.pw, nd.ph, 7);
    ctx.fillStyle = v.color('panel', 1); ctx.fill();
    if (fill) { ctx.fillStyle = v.color(fill, dimmed ? 0.08 : 0.22); ctx.fill(); }
    ctx.strokeStyle = v.color(fill || 'muted', dimmed ? 0.35 : 1); ctx.lineWidth = fill ? 2 : 1.4; ctx.stroke();
  }
  ctx.restore();
  for (const nd of L.nodes) {
    const dimmed = opts.dim && opts.dim(nd);
    s.textPx(labelOf(nd), nd.px, nd.py, { size, weight: 700, align: 'center', color: (opts.labelColor && opts.labelColor(nd)) || (dimmed ? 'muted' : 'ink'), halo: false });
    const note = opts.note && opts.note(nd);
    if (note) s.textPx(String(note), nd.px + nd.pw / 2 + 4, nd.py - nd.ph / 2 - 1, { size: 10.5, weight: 700, align: 'left', color: (opts.noteColor && opts.noteColor(nd)) || 'accent' });
  }
  return L;
}
export function hitNode(L, px, py) {
  let best = null;
  for (const nd of L.nodes) if (nd.px != null && Math.abs(px - nd.px) <= nd.pw / 2 + 4 && Math.abs(py - nd.py) <= nd.ph / 2 + 4) best = nd;
  return best;
}
/** Tree builder for an NB term: {label, term, kids}. */
export function nbTree(t) { return { label: NB_LABEL[t.op], term: t, kids: kids(t).map(nbTree) }; }

/** Draw an inference-rule derivation tree {c, rule, kids, open?, fail?} in pixel space, scaled to fit.
 *  opts: {color(node) → colour, ring(node), size, region, onlyMeasure}. Sets node.box (pixel box of its conclusion). */
export function drawDeriv(v, s, root, opts = {}) {
  const ctx = s.ctx, [rx0, ry0, rx1, ry1] = opts.region || [0, 0, s.W, s.H];
  const size = opts.size || 13, small = size - 3, gap = 18, rowH = size + 11;
  ctx.save();
  const tw = (str_, sz, wt = 500) => { ctx.font = s._font({ size: sz, weight: wt }); return ctx.measureText(str_).width; };
  const lay = (n) => {
    n.cw = tw(n.c, size, n.open ? 400 : 500);
    n.rw = n.rule ? tw(n.rule, small, 600) + 8 : 0;
    n.kids.forEach(lay);
    n.kw = n.kids.length ? n.kids.reduce((a, k) => a + k.w, 0) + gap * (n.kids.length - 1) : 0;
    n.inner = Math.max(n.cw, n.kw);
    n.w = n.inner + n.rw;
    n.h = rowH + (n.kids.length ? 9 + Math.max(...n.kids.map((k) => k.h)) : 0);
  };
  lay(root);
  ctx.restore();
  const k = Math.max(0.42, Math.min(1.25, (rx1 - rx0 - 14) / root.w, (ry1 - ry0 - 14) / root.h));
  const X0 = rx0 + (rx1 - rx0 - root.w * k) / 2, Y1 = opts.anchor === 'top' ? ry0 + 10 + root.h * k : Math.min(ry1 - 8, ry0 + (ry1 - ry0 + root.h * k) / 2);
  const out = [];
  const draw = (n, x, yb) => {
    const cx = x + n.inner / 2, ty = yb - rowH / 2 + 2;
    const col = (opts.color && opts.color(n)) || (n.fail ? 'red' : n.open ? 'orange' : 'ink');
    const ring = opts.ring && opts.ring(n);
    const bw = Math.max(n.cw, n.kw), barY = yb - rowH + 1;
    n.box = { x: X0 + (cx - n.cw / 2) * k, y: ty * k - 0 + 0, w: n.cw * k, h: rowH * k }; // temporary; fixed below
    out.push({ n, cx, ty, barY, bw, col, ring });
    if (n.kids.length) {
      let kx = x + (n.inner - n.kw) / 2;
      for (const kd of n.kids) { draw(kd, kx, barY - 5); kx += kd.w + gap; }
    }
  };
  draw(root, 0, root.h);
  // render with transform
  const T = (x) => X0 + x * k, Ty = (y) => Y1 - (root.h - y) * k;
  for (const o of out) {
    const { n, cx, ty, barY, bw, col, ring } = o;
    n.box = { x: T(cx - n.cw / 2) - 3, y: Ty(ty) - rowH * k / 2, w: n.cw * k + 6, h: rowH * k };
    if (ring) { ctx.save(); rr(ctx, n.box.x - 3, n.box.y - 1, n.box.w + 6, n.box.h + 2, 6); ctx.fillStyle = v.color(ring, 0.22); ctx.fill(); ctx.strokeStyle = v.color(ring, 1); ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore(); }
    s.textPx(n.c, T(cx), Ty(ty), { size: size * k, weight: n.open ? 400 : 600, align: 'center', color: col, halo: false });
    if (n.rule || n.kids.length) {
      ctx.save(); ctx.beginPath(); ctx.moveTo(T(cx - bw / 2), Ty(barY)); ctx.lineTo(T(cx + bw / 2), Ty(barY));
      ctx.strokeStyle = v.color(n.fail ? 'red' : 'muted', 1); ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore();
      if (n.rule) s.textPx(n.rule, T(cx + bw / 2) + 5 * k, Ty(barY), { size: small * k, weight: 600, align: 'left', color: n.fail ? 'red' : 'muted', halo: false });
    } else if (n.open) {
      ctx.save(); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(T(cx - n.cw / 2), Ty(barY)); ctx.lineTo(T(cx + n.cw / 2), Ty(barY));
      ctx.strokeStyle = v.color('orange', 1); ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore();
    }
  }
  return { scale: k, nodes: out.map((o) => o.n), bottom: Y1 };
}
export function hitDeriv(info, px, py) {
  let best = null;
  for (const n of info.nodes) if (n.box && px >= n.box.x && px <= n.box.x + n.box.w && py >= n.box.y && py <= n.box.y + n.box.h) best = n;
  return best;
}
/** Draw the rule schema (premises over a bar, conclusion below, name at right) centred at (cx, y). Returns the height used. */
export function drawRuleSchema(v, s, name, rules, cx, y, o = {}) {
  const r = rules[name]; if (!r) return 0;
  const size = o.size || 12.5, ctx = s.ctx;
  ctx.save(); ctx.font = s._font({ size, weight: 500 });
  const pw = r.pre.map((p) => ctx.measureText(p).width), cw = ctx.measureText(r.concl).width, gap = 22;
  const kw = pw.length ? pw.reduce((a, b) => a + b, 0) + gap * (pw.length - 1) : 0, bw = Math.max(cw, kw, 30);
  ctx.restore();
  const col = o.color || 'ink';
  let x = cx - kw / 2;
  r.pre.forEach((p, i) => { s.textPx(p, x, y, { size, color: col, align: 'left', halo: false }); x += pw[i] + gap; });
  ctx.save(); ctx.beginPath(); ctx.moveTo(cx - bw / 2, y + 11); ctx.lineTo(cx + bw / 2, y + 11); ctx.strokeStyle = v.color('muted', 1); ctx.lineWidth = 1.3; ctx.stroke(); ctx.restore();
  s.textPx(r.concl, cx, y + 25, { size, color: col, weight: 600, align: 'center', halo: false });
  s.textPx(name, cx + bw / 2 + 6, y + 11, { size: size - 2, color: o.nameColor || 'muted', weight: 700, align: 'left', halo: false });
  return 36;
}
/** Wrap a string into lines no wider than w px (canvas text). */
export function wrapText(s, str_, w, size = 12.5) {
  const ctx = s.ctx; ctx.save(); ctx.font = s._font({ size, weight: 500 });
  const words = str_.split(' '), lines = []; let cur = '';
  for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (ctx.measureText(t).width > w && cur) { lines.push(cur); cur = wd; } else cur = t; }
  if (cur) lines.push(cur); ctx.restore(); return lines;
}
/** Error display for a text field: the source with the offending token underlined. */
export function drawParseError(v, s, src, err) {
  const size = 16, X = 20, Y = s.H / 2 - 10;
  const pre = src.slice(0, err.pos), bad = src.slice(err.pos, err.pos + (err.len || 1)), post = src.slice(err.pos + (err.len || 1));
  const x0 = s.ctx; void x0;
  const parts = [{ s: pre }, { s: bad || ' ', color: 'red', hi: true }, { s: post }];
  s.textPx('not a term of the language', s.W / 2, Y - 40, { size: 15, weight: 700, color: 'red', align: 'center' });
  const w = segWidth(s, parts, size);
  drawSegs(v, s, parts, Math.max(X, (s.W - w) / 2), Y, { size, hiColor: 'red' });
  const lines = wrapText(s, err.error, s.W - 40, 13);
  lines.forEach((ln, i) => s.textPx(ln, s.W / 2, Y + 38 + i * 18, { size: 13, color: 'red', align: 'center' }));
}

// ====================================================================== IMP: a small imperative language
// expressions: integers, variables, + - * , comparisons < <= == != > >= (value 1 or 0), && || !, unary −
// commands:   skip | x := e | c ; c | if e then c else c end | while e do c end      (non-zero means true)
const E = { num: (n) => ({ e: 'num', n }), vr: (x) => ({ e: 'var', x }), bin: (op, a, b) => ({ e: 'bin', op, a, b }), not: (a) => ({ e: 'not', a }), neg: (a) => ({ e: 'neg', a }) };
export const C = {
  skip: () => ({ c: 'skip' }), assign: (x, a) => ({ c: 'assign', x, a }), seq: (a, b) => ({ c: 'seq', a, b }),
  if: (b, t, f) => ({ c: 'if', b, t, f }), while: (b, body) => ({ c: 'while', b, body }),
};
const CMD_KW = new Set(['skip', 'if', 'then', 'else', 'end', 'while', 'do']);
export function parseImp(src) {
  const toks = []; const re = /\s+|\d+|[A-Za-z_][A-Za-z_0-9]*|:=|<=|>=|==|!=|&&|\|\||./gy; let m;
  while ((m = re.exec(src))) { if (/^\s+$/.test(m[0])) continue; toks.push({ w: m[0], pos: m.index, len: m[0].length }); }
  let k = 0;
  const peek = () => toks[k];
  const fail = (msg, tk = peek()) => { throw { msg, pos: tk ? tk.pos : src.length, len: tk ? tk.len : 1 }; };
  const eat = (w) => { const t = peek(); if (!t || t.w !== w) fail(t ? `expected “${w}” but found “${t.w}”` : `expected “${w}” but the program ends`); k++; };
  const levels = [['||'], ['&&'], ['==', '!=', '<', '<=', '>', '>='], ['+', '-'], ['*']];
  const expr = (lv = 0) => {
    if (lv === levels.length) return unary();
    let a = expr(lv + 1);
    for (;;) { const t = peek(); if (t && levels[lv].includes(t.w)) { k++; const b = expr(lv + 1); a = E.bin(t.w, a, b); } else return a; }
  };
  const unary = () => {
    const t = peek();
    if (!t) fail('the expression ends too early');
    if (t.w === '!') { k++; return E.not(unary()); }
    if (t.w === '-') { k++; return E.neg(unary()); }
    if (/^\d+$/.test(t.w)) { k++; return E.num(+t.w); }
    if (t.w === '(') { k++; const e = expr(); eat(')'); return e; }
    if (/^[A-Za-z_]/.test(t.w) && !CMD_KW.has(t.w)) { k++; return E.vr(t.w); }
    fail(CMD_KW.has(t.w) ? `“${t.w}” cannot appear in an expression` : `unexpected “${t.w}” in an expression`);
  };
  const seq = () => {
    const first = stmt(); const t = peek();
    if (t && t.w === ';') { k++; const nt = peek(); if (!nt || ['end', 'else', ')'].includes(nt.w)) return first; return C.seq(first, seq()); }
    return first;
  };
  const stmt = () => {
    const t = peek();
    if (!t) fail('the program ends too early');
    if (t.w === 'skip') { k++; return C.skip(); }
    if (t.w === 'if') { k++; const b = expr(); eat('then'); const a = seq(); eat('else'); const c = seq(); eat('end'); return C.if(b, a, c); }
    if (t.w === 'while') { k++; const b = expr(); eat('do'); const body = seq(); eat('end'); return C.while(b, body); }
    if (t.w === '(') { k++; const c = seq(); eat(')'); return c; }
    if (/^[A-Za-z_]/.test(t.w) && !CMD_KW.has(t.w)) { k++; eat(':='); return C.assign(t.w, expr()); }
    fail(`a command cannot start with “${t.w}”`);
  };
  try {
    if (!toks.length) return { error: 'empty program', pos: 0, len: 1 };
    const ast = seq();
    if (k < toks.length) fail(`unexpected “${toks[k].w}”`);
    return { ast };
  } catch (e) { if (e && e.msg) return { error: e.msg, pos: e.pos, len: e.len }; throw e; }
}
export function parseImpExpr(src) {
  const r = parseImp(`z := ${src}`);
  return r.ast && r.ast.c === 'assign' ? { ast: r.ast.a } : { error: r.error || 'not an expression', pos: Math.max(0, (r.pos ?? 5) - 5), len: r.len || 1 };
}
export function evalE(e, st) {
  switch (e.e) {
    case 'num': return e.n;
    case 'var': return st[e.x] ?? 0;
    case 'neg': return -evalE(e.a, st);
    case 'not': return evalE(e.a, st) ? 0 : 1;
    default: {
      const a = evalE(e.a, st), b = evalE(e.b, st);
      switch (e.op) {
        case '+': return a + b; case '-': return a - b; case '*': return a * b;
        case '<': return +(a < b); case '<=': return +(a <= b); case '>': return +(a > b); case '>=': return +(a >= b);
        case '==': return +(a === b); case '!=': return +(a !== b);
        case '&&': return +(!!a && !!b); case '||': return +(!!a || !!b);
        default: return 0;
      }
    }
  }
}
const EP = { '||': 1, '&&': 2, '==': 3, '!=': 3, '<': 3, '<=': 3, '>': 3, '>=': 3, '+': 4, '-': 4, '*': 5 };
export function eStr(e, p = 0) {
  switch (e.e) {
    case 'num': return String(e.n);
    case 'var': return e.x;
    case 'neg': return `−${eStr(e.a, 9)}`;
    case 'not': return `!${eStr(e.a, 9)}`;
    default: { const q = EP[e.op], s_ = `${eStr(e.a, q)} ${e.op} ${eStr(e.b, q + 1)}`; return q < p ? `(${s_})` : s_; }
  }
}
export function varsOf(c, out = []) {
  const ev = (e) => { if (e.e === 'var') { if (!out.includes(e.x)) out.push(e.x); } else if (e.a) { ev(e.a); if (e.b) ev(e.b); } };
  const go = (x) => {
    switch (x.c) {
      case 'assign': if (!out.includes(x.x)) out.push(x.x); ev(x.a); break;
      case 'seq': go(x.a); go(x.b); break;
      case 'if': ev(x.b); go(x.t); go(x.f); break;
      case 'while': ev(x.b); go(x.body); break;
      default: break;
    }
  };
  go(c); return out;
}
/** One small step of ⟨c, σ⟩. Returns {c, st, rule, redex, note} or null when c is skip. Variables not yet assigned read as 0. */
export function cstep(c, st) {
  switch (c.c) {
    case 'skip': return null;
    case 'assign': { const n = evalE(c.a, st); return { c: C.skip(), st: { ...st, [c.x]: n }, rule: 'S-Assign', redex: c, note: `${eStr(c.a)} evaluates to ${n}`, changed: c.x }; }
    case 'seq': {
      if (c.a.c === 'skip') return { c: c.b, st, rule: 'S-SeqSkip', redex: c, note: 'skip; c₂ → c₂', changed: null };
      const r = cstep(c.a, st);
      return { ...r, c: C.seq(r.c, c.b), via: 'S-Seq' };
    }
    case 'if': { const n = evalE(c.b, st); return { c: n ? c.t : c.f, st, rule: n ? 'S-IfTrue' : 'S-IfFalse', redex: c, note: `${eStr(c.b)} is ${n ? 'true (≠ 0)' : 'false (= 0)'}`, changed: null }; }
    case 'while': return { c: C.if(c.b, C.seq(c.body, c), C.skip()), st, rule: 'S-While', redex: c, note: 'unfold: while b do c  →  if b then (c; while b do c) else skip', changed: null };
    default: return null;
  }
}
export const IMP_RULES = {
  'S-Assign': 'x := e  →  skip     (σ ⇒ σ[x ↦ ⟦e⟧σ])',
  'S-SeqSkip': 'skip; c₂  →  c₂',
  'S-Seq': '⟨c₁, σ⟩ → ⟨c₁′, σ′⟩  ⟹  ⟨c₁; c₂, σ⟩ → ⟨c₁′; c₂, σ′⟩',
  'S-IfTrue': '⟦b⟧σ ≠ 0  ⟹  if b then c₁ else c₂  →  c₁',
  'S-IfFalse': '⟦b⟧σ = 0  ⟹  if b then c₁ else c₂  →  c₂',
  'S-While': 'while b do c  →  if b then (c; while b do c) else skip',
};
/** Run ⟨c, σ⟩ for up to max steps; frames[i] = {c, st, rule, redex, note, changed} (frame 0 is the start). */
export function runImp(c, st, max = 400) {
  const frames = [{ c, st, rule: null, redex: null, note: '', changed: null }];
  for (let i = 0; i < max; i++) {
    const r = cstep(frames[frames.length - 1].c, frames[frames.length - 1].st);
    if (!r) return { frames, status: 'halt' };
    frames.push(r);
  }
  return { frames, status: frames[frames.length - 1].c.c === 'skip' ? 'halt' : 'cut' };
}
/** Pretty-print a command as lines [{ind, parts: [{s, hi}], node}]; `hi` is a command node to highlight (headers / simple statements). */
export function cmdLines(c, hi = null) {
  const lines = [];
  const stmts = (x, ind, trail) => {
    const list = []; const flat = (y, holder) => { if (y.c === 'seq') { flat(y.a, y); flat(y.b, null); } else list.push({ node: y, holder }); };
    flat(x, null);
    list.forEach(({ node, holder }, i) => {
      const last = i === list.length - 1, semi = last ? trail : ';';
      const H = hi && (hi === node || (holder && hi === holder && node.c === 'skip'));
      switch (node.c) {
        case 'skip': lines.push({ ind, parts: [{ s: 'skip' + semi, hi: H }], node }); break;
        case 'assign': lines.push({ ind, parts: [{ s: `${node.x} := ${eStr(node.a)}${semi}`, hi: H }], node }); break;
        case 'if':
          lines.push({ ind, parts: [{ s: `if ${eStr(node.b)} then`, hi: hi === node }], node });
          stmts(node.t, ind + 1, '');
          lines.push({ ind, parts: [{ s: 'else', hi: false }], node });
          stmts(node.f, ind + 1, '');
          lines.push({ ind, parts: [{ s: 'end' + semi, hi: false }], node });
          break;
        case 'while':
          lines.push({ ind, parts: [{ s: `while ${eStr(node.b)} do`, hi: hi === node }], node });
          stmts(node.body, ind + 1, '');
          lines.push({ ind, parts: [{ s: 'end' + semi, hi: false }], node });
          break;
        default: break;
      }
    });
  };
  stmts(c, 0, '');
  return lines;
}
export function drawProgram(v, s, c, hi, region, o = {}) {
  const [x0, y0, x1, y1] = region, lines = cmdLines(c, hi);
  const lh = Math.min(o.lh || 24, (y1 - y0 - 10) / Math.max(1, lines.length)), size = Math.max(10.5, Math.min(14.5, lh * 0.62));
  lines.forEach((ln, i) => drawSegs(v, s, ln.parts, x0 + ln.ind * 18 + 8, y0 + 8 + lh * (i + 0.5), { size }));
  return lines.length;
}
/** Structural denotation ⟦c⟧ : Store → Store | null (⊥). Loops are the limit of approximants: ⟦while⟧ is
 *  tried with at most `fuel` unfoldings; exceeding it means "undefined (diverges)". */
export function denote(c, fuel = 400) {
  const D = (x) => {
    switch (x.c) {
      case 'skip': return (st) => st;
      case 'assign': return (st) => ({ ...st, [x.x]: evalE(x.a, st) });
      case 'seq': { const f = D(x.a), g = D(x.b); return (st) => { const m = f(st); return m ? g(m) : null; }; }
      case 'if': { const f = D(x.t), g = D(x.f); return (st) => (evalE(x.b, st) ? f(st) : g(st)); }
      case 'while': {
        const body = D(x.body);
        return (st) => { let cur = st; for (let k = 0; k < fuel; k++) { if (!evalE(x.b, cur)) return cur; cur = body(cur); if (!cur) return null; } return null; };
      }
      default: return () => null;
    }
  };
  return D(c);
}
/** The k-th approximant of ⟦while b do c⟧ (⊥ unless the loop exits within k iterations). */
export function whileApprox(w, k) {
  const body = denote(w.body);
  return (st) => { let cur = st; for (let i = 0; i < k; i++) { if (!evalE(w.b, cur)) return cur; cur = body(cur); if (!cur) return null; } return evalE(w.b, cur) ? null : cur; };
}
export const storeStr = (st, vars) => vars.map((x) => `${x} = ${st[x] ?? 0}`).join(', ');
export const fmtN = (n) => String(n).replace('-', '−');

// ====================================================================== UI helpers
/** A text field that keeps the last input that parsed. parser(src) → {ast} | {error, pos, len}. */
export function field(v, label, def, parser, { width = 300, onChange, placeholder } = {}) {
  let ast = parser(def).ast, err = null, src = def;
  const upd = (x) => { src = x; const r = parser(x); if (r.ast) { ast = r.ast; err = null; } else err = { ...r, src: x }; };
  upd(def);
  const ctl = v.input(label, def, { width, placeholder, onChange: (x) => { upd(x); if (onChange) onChange(); } });
  return { ctl, get ast() { return ast; }, get err() { return err; }, get src() { return src; }, set(x) { ctl.set(x); upd(x); if (onChange) onChange(); } };
}
/** Plain stage for pixel-space drawing. */
export const pxStage = (v, o = {}) => v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, ...o });
