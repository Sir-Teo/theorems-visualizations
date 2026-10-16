// Logic & Foundations — Chapter 4: helpers shared by ch04.js and ch04-b.js.
// Re-exports the first-order toolkit of chapter 3 and adds: a Hilbert-style calculus (Enderton's logical axioms,
// modus ponens) with a proof checker, the transformations behind the deduction and generalization theorems, a
// soundness tester on small structures, a Henkin construction over a small monadic fragment with a term model,
// a Herbrand-expansion semi-decision procedure, and Gödel's 1930 propositional sequence D_n.
export * from './ch03.shared.js';
import {
  parseFO, toStr, mk, equalAst, freeVars, occurrences, isQ, preorder, kids, clone, holds, range, langOf, structures, assignments,
  sortVars, rng,
} from './ch03.shared.js';
import { dpll } from './ch02.shared.js';
export { dpll };

// ---------------------------------------------------------------- building formulas
export const imp = (a, b) => mk.BIN('imp', a, b);
export const and = (a, b) => mk.BIN('and', a, b);
export const or = (a, b) => mk.BIN('or', a, b);
export const neg = (a) => mk.NOT(a);
export const all = (x, a) => mk.Q('all', x, a);
export const ex = (x, a) => mk.Q('ex', x, a);
export const SIGH = { rels: { P: 1, Q: 1, R: 2 }, funcs: { f: 1 }, consts: ['c', 'd', 'a', 'b'], name: 'the proof language' };
export const P1 = (s, sig = SIGH) => { const r = parseFO(s, sig); if (!r.ast) throw new Error(`parse ${s}: ${r.error}`); return r.ast; };

// ---------------------------------------------------------------- tautologies by propositional skeleton
/** Is f a tautology when quantified and atomic subformulas are treated as propositional letters? */
export function isTautology(f, limit = 14) {
  const keys = new Map();
  const collect = (g) => {
    if (g.op === 'not') return collect(g.a);
    if (g.op === 'and' || g.op === 'or' || g.op === 'imp' || g.op === 'iff') { collect(g.a); collect(g.b); return; }
    if (g.op === 'const') return;
    const k = toStr(g); if (!keys.has(k)) keys.set(k, keys.size);
  };
  collect(f);
  const n = keys.size; if (n > limit) return false;
  const ev = (g, m) => {
    switch (g.op) {
      case 'not': return !ev(g.a, m);
      case 'and': return ev(g.a, m) && ev(g.b, m);
      case 'or': return ev(g.a, m) || ev(g.b, m);
      case 'imp': return !ev(g.a, m) || ev(g.b, m);
      case 'iff': return ev(g.a, m) === ev(g.b, m);
      case 'const': return g.val;
      default: return ((m >> keys.get(toStr(g))) & 1) === 1;
    }
  };
  for (let m = 0; m < 2 ** n; m++) if (!ev(f, m)) return false;
  return true;
}

// ---------------------------------------------------------------- the calculus
export const GROUPS = {
  1: 'tautology', 2: '∀-instantiation', 3: '∀ distributes over →', 4: 'vacuous ∀', 5: 'x = x', 6: 'equality substitution',
};
/** Match φ (with x free) against ψ: finds the term t with ψ = φ[x := t] (strictly, without renaming). → {ok, t, free} */
export function matchInst(a, b, x) {
  let t = null;
  const m = (p, q, bd) => {
    if (p.t === 'var' && p.name === x && !bd.has(x)) { if (t === null) { t = q; return true; } return equalAst(t, q); }
    if (!!p.t !== !!q.t) return false;
    if (p.t) {
      if (p.t !== q.t) return false;
      if (p.t === 'fn') return p.f === q.f && p.args.length === q.args.length && p.args.every((u, i) => m(u, q.args[i], bd));
      return p.name === q.name;
    }
    if (p.op !== q.op) return false;
    if (p.op === 'rel') return p.r === q.r && p.args.length === q.args.length && p.args.every((u, i) => m(u, q.args[i], bd));
    if (p.op === 'const') return p.val === q.val;
    if (p.op === 'not') return m(p.a, q.a, bd);
    if (isQ(p)) { if (p.v !== q.v) return false; const b2 = new Set(bd); b2.add(p.v); return m(p.a, q.a, b2); }
    return m(p.a, q.a, bd) && m(p.b, q.b, bd);
  };
  if (!m(a, b, new Set())) return { ok: false };
  return { ok: true, t };
}
/** Is the term t free for x in φ (no free variable of t is captured at a free occurrence of x)? */
export function substitutable(phi, x, t) {
  const tv = new Set(occurrences(t).map((o) => o.name));
  let bad = null;
  const walk = (n, scope) => {
    if (n.t === 'var') { if (n.name === x && !scope.has(x)) for (const s of scope) if (tv.has(s)) bad = s; return; }
    if (isQ(n)) { const s2 = new Set(scope); s2.add(n.v); walk(n.a, s2); return; }
    for (const c of kids(n)) walk(c, scope);
  };
  walk(phi, new Set());
  return bad === null ? { ok: true } : { ok: false, captured: bad };
}
function replDiff(p, q, x, y) {
  if (p.t === 'var' && q.t === 'var') return p.name === q.name || (p.name === x && q.name === y);
  if (!!p.t !== !!q.t || (p.t && p.t !== q.t)) return false;
  if (p.t === 'fn') return p.f === q.f && p.args.length === q.args.length && p.args.every((u, i) => replDiff(u, q.args[i], x, y));
  if (p.t) return p.name === q.name;
  return false;
}
/** If f is a logical axiom (a generalization of one of the six groups), say which: {group, gen}; else null. */
export function axiomOf(f, gen = 0) {
  if (isTautology(f)) return { group: 1, gen };
  if (f.op === 'imp') {
    const A = f.a, B = f.b;
    if (A.op === 'all') {
      const r = matchInst(A.a, B, A.v);
      if (r.ok && (r.t === null || substitutable(A.a, A.v, r.t).ok)) return { group: 2, gen, x: A.v, t: r.t };
      if (A.a.op === 'imp' && B.op === 'imp' && B.a.op === 'all' && B.b.op === 'all' && B.a.v === A.v && B.b.v === A.v && equalAst(A.a.a, B.a.a) && equalAst(A.a.b, B.b.a)) return { group: 3, gen, x: A.v };
    }
    if (B.op === 'all' && equalAst(A, B.a) && !freeVars(A).includes(B.v)) return { group: 4, gen, x: B.v };
    if (A.op === 'rel' && A.r === '=' && A.args[0].t === 'var' && A.args[1].t === 'var' && B.op === 'imp' && B.a.op === 'rel' && B.b.op === 'rel' && B.a.r === B.b.r && B.a.args.length === B.b.args.length && B.a.args.every((u, i) => replDiff(u, B.b.args[i], A.args[0].name, A.args[1].name))) return { group: 6, gen };
  }
  if (f.op === 'rel' && f.r === '=' && f.args[0].t === 'var' && f.args[1].t === 'var' && f.args[0].name === f.args[1].name) return { group: 5, gen };
  if (f.op === 'all') return axiomOf(f.a, gen + 1);
  return null;
}
/** Justification of line i: hypothesis, logical axiom, or modus ponens from two earlier lines. */
export function justify(lines, i, Gamma = []) {
  const f = lines[i];
  const h = Gamma.findIndex((g) => equalAst(g, f));
  if (h >= 0) return { ok: true, kind: 'hyp', label: 'hypothesis', h };
  const ax = axiomOf(f);
  if (ax) return { ok: true, kind: 'axiom', label: ax.gen ? `${GROUPS[ax.group]}, generalized` : GROUPS[ax.group], ax };
  for (let k = 0; k < i; k++) {
    const m = lines[k];
    if (m.op === 'imp' && equalAst(m.b, f)) {
      const j = lines.findIndex((g, jj) => jj < i && equalAst(g, m.a));
      if (j >= 0) return { ok: true, kind: 'mp', label: `MP ${j + 1}, ${k + 1}`, refs: [j, k] };
    }
  }
  return { ok: false, kind: 'bad', label: 'not justified' };
}
export const checkProof = (lines, Gamma = []) => lines.map((_, i) => justify(lines, i, Gamma));

// ---------------------------------------------------------------- deduction theorem
/**
 * From a derivation of ψ from Γ ∪ {φ} build a derivation of φ → ψ from Γ, line by line.
 * Returns {out: [{f, role, src}], failAt}. roles: copy, ax, id, mp1, mp2, taut.
 */
export function deductionTransform(lines, phi, Gamma) {
  const out = [], at = []; // at[i] = index in out of the line φ → θ_i
  const push = (f, role, src) => { out.push({ f, role, src }); return out.length - 1; };
  const full = [...Gamma, phi];
  for (let i = 0; i < lines.length; i++) {
    const th = lines[i];
    const isG = Gamma.some((g) => equalAst(g, th)) || axiomOf(th);
    if (isG) {
      push(th, 'copy', i); push(imp(th, imp(phi, th)), 'ax', i);
      at[i] = push(imp(phi, th), 'mp1', i);
    } else if (equalAst(th, phi)) {
      at[i] = push(imp(phi, phi), 'id', i);
    } else {
      const j = justify(lines, i, full);
      if (!j.ok || j.kind !== 'mp') return { out, failAt: i, at };
      const [a, b] = j.refs, tj = lines[a];
      const A = out[at[a]].f, Bf = out[at[b]].f;
      const taut = imp(A, imp(Bf, imp(phi, th)));
      out.push({ f: taut, role: 'taut', src: i, sch: `(φ → θ${subNum(a + 1)}) → ((φ → (θ${subNum(a + 1)} → θ${subNum(i + 1)})) → (φ → θ${subNum(i + 1)}))` });
      push(imp(Bf, imp(phi, th)), 'mp2', i);
      at[i] = push(imp(phi, th), 'mp2', i);
      void tj;
    }
  }
  return { out, failAt: -1, at };
}

// ---------------------------------------------------------------- generalization theorem
/** From a derivation of θ from Γ with x not free in Γ build a derivation of ∀x θ. Fails at a hypothesis with x free. */
export function generalizeTransform(lines, x, Gamma) {
  const out = [], at = [];
  const push = (f, role, src) => { out.push({ f, role, src }); return out.length - 1; };
  for (let i = 0; i < lines.length; i++) {
    const th = lines[i], g = all(x, th);
    if (axiomOf(th)) { at[i] = push(g, 'ax', i); continue; }
    if (Gamma.some((h) => equalAst(h, th))) {
      if (freeVars(th).includes(x)) return { out, failAt: i, why: `${x} is free in the hypothesis ${toStr(th)}`, at };
      push(th, 'copy', i); push(imp(th, g), 'ax4', i); at[i] = push(g, 'mp', i); continue;
    }
    const j = justify(lines, i, Gamma);
    if (!j.ok || j.kind !== 'mp') return { out, failAt: i, why: 'line is not justified', at };
    const [a, b] = j.refs;
    push(imp(all(x, lines[b]), imp(all(x, lines[a]), g)), 'ax3', i);
    push(imp(all(x, lines[a]), g), 'mp', i);
    at[i] = push(g, 'mp', i);
  }
  return { out, failAt: -1, at };
}

// ---------------------------------------------------------------- soundness testing
/** Test each line on small structures and assignments that satisfy Γ. → [{tested, fails, counter}] */
export function soundnessTest(lines, Gamma, { maxN = 3, cap = 500, seed = 11 } = {}) {
  const lang = langOf(...lines, ...Gamma), xs = sortVars(new Set([...lines, ...Gamma].flatMap((f) => freeVars(f))));
  const res = lines.map(() => ({ tested: 0, fails: 0, counter: null }));
  const r = rng(seed);
  for (const { n, M } of structures(lang, { minN: 1, maxN, cap, seed })) {
    for (const env of assignments(xs, n)) {
      if (n ** xs.length > 40 && r() > 40 / n ** xs.length) continue;
      if (!Gamma.every((g) => holds(g, M, env))) continue;
      lines.forEach((f, i) => {
        res[i].tested++;
        if (!holds(f, M, env)) { res[i].fails++; if (!res[i].counter) res[i].counter = { M, env, n }; }
      });
    }
  }
  return res;
}

// ---------------------------------------------------------------- drawing proofs
/** A short readable name for a structure: domain size, relations, constants. */
export function structText(M, lang) {
  const parts = [`domain {${range(M.n).join(',')}}`];
  for (const [name, ar] of lang.rels) {
    const els = [];
    if (ar === 1) { for (const a of range(M.n)) if (M.rel(name, [a])) els.push(String(a)); parts.push(`${name} = {${els.join(',')}}`); }
    else if (ar === 2) { for (const a of range(M.n)) for (const b of range(M.n)) if (M.rel(name, [a, b])) els.push(`(${a},${b})`); parts.push(`${name} = {${els.join(' ')}}`); }
  }
  for (const c of lang.consts) parts.push(`${c} = ${M.konst(c)}`);
  for (const [fn, ar] of lang.funcs) if (ar === 1) parts.push(`${fn}: ${range(M.n).map((a) => `${a}↦${M.fn(fn, [a])}`).join(' ')}`);
  return parts;
}
/** Draw lines of a derivation as rows on a stage with pixel-ish coordinates x∈[0,W], y∈[0,H] (top = H). */
export function drawProofRows(s, rows, { W = 100, H = 100, rowH = 7, y0 = null, size = 12.5, numW = 4, colX = null, sel = -1 } = {}) {
  const top = y0 ?? H - 3;
  rows.forEach((r, i) => {
    const y = top - i * rowH;
    if (y < -rowH) return;
    if (i === sel) s.rect(0, y - rowH * 0.5, W, y + rowH * 0.5, { fill: 'gold', fillAlpha: 0.12, stroke: false });
    const col = r.color || 'ink';
    s.text(String(r.n ?? i + 1), numW - 0.8, y, { align: 'right', baseline: 'middle', size: size - 1, color: 'muted' });
    s.text(r.text, numW + 1, y, { align: 'left', baseline: 'middle', size, color: col });
    if (r.just) s.text(r.just, colX ?? W - 1, y, { align: 'right', baseline: 'middle', size: size - 1.5, color: r.jcolor || 'muted' });
  });
}

// ---------------------------------------------------------------- a small monadic fragment (Henkin construction)
export const FRAG_SIG = { rels: { P: 1, Q: 1 }, funcs: {}, consts: ['c0', 'c1', 'c2'], name: 'the fragment' };
const F = (s) => P1(s, FRAG_SIG);
export const FRAG_POOL = [
  { text: '∃x P(x)', wit: 'c0', henkin: '∃x P(x) → P(c0)' },
  { text: '∃x ¬P(x)', wit: 'c1', henkin: '∃x ¬P(x) → ¬P(c1)' },
  { text: '∃x Q(x)', wit: 'c2', henkin: '∃x Q(x) → Q(c2)' },
  { text: '∀x P(x)' },
  { text: 'P(c0)' }, { text: 'P(c1)' }, { text: 'P(c2)' },
  { text: 'Q(c0)' }, { text: 'Q(c1)' }, { text: 'Q(c2)' },
  { text: 'c0 = c1' }, { text: 'c0 = c2' }, { text: 'c1 = c2' },
].map((e, id) => ({ ...e, id, ast: F(e.text), hast: e.henkin ? F(e.henkin) : null }));
export const FRAG_STARTS = {
  A: ['∃x P(x)', '∃x ¬P(x)'],
  B: ['∃x Q(x)', '∀x P(x)'],
  C: ['∀x P(x)', '∃x ¬P(x)'],
  D: ['∃x P(x)', 'c0 = c1'],
};
let FRAG = null;
function fragStructs() {
  if (FRAG) return FRAG;
  const out = [];
  for (let n = 1; n <= 4; n++) {
    const dom = range(n);
    for (let Pm = 0; Pm < 2 ** n; Pm++) for (let Qm = 0; Qm < 2 ** n; Qm++) for (let k = 0; k < n ** 3; k++) {
      const cs = [k % n, Math.floor(k / n) % n, Math.floor(k / (n * n)) % n];
      out.push(fragMake(n, dom, Pm, Qm, cs));
    }
  }
  FRAG = out; return out;
}
export function fragMake(n, dom, Pm, Qm, cs) {
  return {
    n, dom, Pm, Qm, cs, label: String,
    rel: (r, a) => ((r === 'P' ? Pm : Qm) >> a[0]) & 1 ? true : false,
    fn: () => { throw new Error('no functions'); },
    konst: (c) => cs[+c.slice(1)],
  };
}
/**
 * The Henkin construction over the fragment. opts: {start: [text], witness: bool, lazy: bool}.
 * Returns {frames, theta: [{sent, in}] , inconsistent, survivors}. Consistency = a surviving model of size ≤ 4.
 */
export function henkinRun(startTexts, { witness = true, lazy = false } = {}) {
  let alive = fragStructs();
  const frames = [];
  const add = (ast, kind, text, extra = {}) => {
    alive = alive.filter((M) => holds(ast, M));
    frames.push({ kind, text, survivors: alive.length, ...extra });
  };
  let inconsistent = false;
  for (const t of startTexts) { add(F(t), 'given', t); if (!alive.length) { inconsistent = true; break; } }
  if (inconsistent) return { frames, theta: [], inconsistent, survivors: 0 };
  if (witness) for (const e of FRAG_POOL) if (e.hast) add(e.hast, 'witness', e.henkin, { sent: e.text, c: e.wit });
  const theta = [];
  for (const e of FRAG_POOL) {
    const pos = alive.some((M) => holds(e.ast, M)), nega = alive.some((M) => !holds(e.ast, M));
    let val;
    if (pos && nega) val = !lazy; else val = pos;
    const ast = val ? e.ast : mk.NOT(e.ast);
    const text = val ? e.text : `¬${e.text.length > 6 && /[∧∨→= ]/.test(e.text) && !/^[∃∀]/.test(e.text) ? `(${e.text})` : e.text}`;
    const both = pos && nega;
    alive = alive.filter((M) => holds(ast, M));
    frames.push({ kind: 'decide', text, sent: e.text, val, free: both, survivors: alive.length });
    theta.push({ sent: e.text, id: e.id, in: val });
  }
  return { frames, theta, inconsistent: false, survivors: alive.length };
}
/** The term model of a complete theory θ over the fragment: elements = constants modulo the equations in θ. */
export function termModel(theta) {
  const val = (text) => theta.find((t) => t.sent === text).in;
  const cls = [0, 1, 2], find = (i) => { while (cls[i] !== i) i = cls[i]; return i; };
  for (const [a, b, t] of [[0, 1, 'c0 = c1'], [0, 2, 'c0 = c2'], [1, 2, 'c1 = c2']]) if (val(t)) { const ra = find(a), rb = find(b); if (ra !== rb) cls[Math.max(ra, rb)] = Math.min(ra, rb); }
  const reps = [...new Set([0, 1, 2].map(find))], idx = (i) => reps.indexOf(find(i));
  let Pm = 0, Qm = 0;
  for (let i = 0; i < 3; i++) { if (val(`P(c${i})`)) Pm |= 1 << idx(i); if (val(`Q(c${i})`)) Qm |= 1 << idx(i); }
  const cs = [0, 1, 2].map(idx);
  const M = fragMake(reps.length, range(reps.length), Pm, Qm, cs);
  M.members = reps.map((r) => [0, 1, 2].filter((i) => find(i) === r));
  return M;
}

// ---------------------------------------------------------------- Herbrand expansions (equality-free)
/** Negation normal form of a first-order formula (→ and ↔ eliminated). */
export function nnfFO(f, negate = false) {
  switch (f.op) {
    case 'not': return nnfFO(f.a, !negate);
    case 'and': return negate ? or(nnfFO(f.a, true), nnfFO(f.b, true)) : and(nnfFO(f.a), nnfFO(f.b));
    case 'or': return negate ? and(nnfFO(f.a, true), nnfFO(f.b, true)) : or(nnfFO(f.a), nnfFO(f.b));
    case 'imp': return nnfFO(or(neg(f.a), f.b), negate);
    case 'iff': return nnfFO(and(imp(f.a, f.b), imp(f.b, f.a)), negate);
    case 'all': return mk.Q(negate ? 'ex' : 'all', f.v, nnfFO(f.a, negate));
    case 'ex': return mk.Q(negate ? 'all' : 'ex', f.v, nnfFO(f.a, negate));
    case 'const': return mk.TOP().val === f.val ? (negate ? mk.BOT() : mk.TOP()) : (negate ? mk.TOP() : mk.BOT());
    default: return negate ? neg(f) : f;
  }
}
function substT(n, x, t) {
  if (n.t === 'var') return n.name === x ? clone(t) : n;
  if (n.t === 'const') return n;
  if (n.t === 'fn') return { ...n, args: n.args.map((a) => substT(a, x, t)) };
  if (n.op === 'rel') return { ...n, args: n.args.map((a) => substT(a, x, t)) };
  if (n.op === 'const') return n;
  if (n.op === 'not') return { ...n, a: substT(n.a, x, t) };
  if (isQ(n)) return n.v === x ? n : { ...n, a: substT(n.a, x, t) };
  return { ...n, a: substT(n.a, x, t), b: substT(n.b, x, t) };
}
/** Skolemize a sentence: → {matrix (quantifier-free NNF with free universal variables), univ: [vars], skolems: [{name, arity}]}. */
export function skolemize(sentence) {
  const nn = nnfFO(sentence), sk = []; let cnt = 0;
  const go = (n, univ) => {
    if (n.op === 'all') return { m: go(n.a, [...univ, n.v]), univ: null, v: n.v };
    return null;
  };
  void go;
  const univAll = [];
  const walk = (n, univ) => {
    if (n.op === 'all') { if (!univAll.includes(n.v)) univAll.push(n.v); return walk(n.a, [...univ, n.v]); }
    if (n.op === 'ex') {
      const name = `s${++cnt}`; sk.push({ name, arity: univ.length });
      const t = univ.length ? mk.FN(name, univ.map((u) => mk.VAR(u))) : mk.CONST(name);
      return walk(substT(n.a, n.v, t), univ);
    }
    if (n.op === 'and' || n.op === 'or') return { ...n, a: walk(n.a, univ), b: walk(n.b, univ) };
    return n;
  };
  // universals are renamed apart first so that sibling quantifiers with the same variable do not clash
  const matrix = walk(renameApart(nn), []);
  const fv = sortVars(new Set(occurrences(matrix).map((o) => o.name)));
  return { matrix, univ: fv, skolems: sk };
}
function renameApart(f) {
  let k = 0;
  const go = (n, ren) => {
    if (n.t === 'var') return ren.has(n.name) ? mk.VAR(ren.get(n.name)) : n;
    if (n.t === 'const') return n;
    if (n.t === 'fn') return { ...n, args: n.args.map((a) => go(a, ren)) };
    if (n.op === 'rel') return { ...n, args: n.args.map((a) => go(a, ren)) };
    if (n.op === 'const') return n;
    if (n.op === 'not') return { ...n, a: go(n.a, ren) };
    if (isQ(n)) { const nm = `v${++k}`, r2 = new Map(ren); r2.set(n.v, nm); return { ...n, v: nm, a: go(n.a, r2) }; }
    return { ...n, a: go(n.a, ren), b: go(n.b, ren) };
  };
  return go(f, new Map());
}
/** Herbrand universe up to level n as term strings with ASTs. */
export function herbrandTerms(consts, funcs, level, cap = 400) {
  let terms = consts.length ? consts.map((c) => mk.CONST(c)) : [mk.CONST('a')];
  for (let l = 0; l < level; l++) {
    const next = [...terms];
    for (const { name, arity } of funcs) {
      if (arity === 0) continue;
      const tuples = [[]];
      for (let k = 0; k < arity; k++) { const t2 = []; for (const tp of tuples) for (const t of terms) { if (t2.length > cap) break; t2.push([...tp, t]); } tuples.splice(0, tuples.length, ...t2); }
      for (const tp of tuples) { if (next.length > cap) break; const t = mk.FN(name, tp); if (!next.some((u) => equalAst(u, t))) next.push(t); }
    }
    terms = next;
  }
  return terms;
}
/** Tseitin encoding of ground NNF formulas over atoms keyed by string. */
export class Cnf {
  constructor() { this.atoms = new Map(); this.names = []; this.clauses = []; }
  atom(key) { let i = this.atoms.get(key); if (!i) { this.names.push(key); i = this.names.length; this.atoms.set(key, i); } return i; }
  fresh() { this.names.push(null); return this.names.length; }
  lit(f) {
    if (f.op === 'rel') return this.atom(toStr(f));
    if (f.op === 'not') return -this.lit(f.a);
    if (f.op === 'const') { const v = this.fresh(); this.clauses.push([f.val ? v : -v]); return v; }
    const a = this.lit(f.a), b = this.lit(f.b), v = this.fresh();
    if (f.op === 'and') { this.clauses.push([-v, a], [-v, b], [v, -a, -b]); } else { this.clauses.push([-v, a, b], [v, -a], [v, -b]); }
    return v;
  }
  assert(f) { this.clauses.push([this.lit(f)]); }
}
function groundInstances(sk, terms, cap) {
  const out = [], vars = sk.univ, k = vars.length;
  const total = terms.length ** k;
  if (total > cap) return { inst: out, capped: true, total };
  const idx = new Array(k).fill(0);
  for (let c = 0; c < Math.max(total, 1); c++) {
    let g = sk.matrix;
    for (let i = 0; i < k; i++) g = substT(g, vars[i], terms[idx[i]]);
    out.push(g);
    let i = 0; while (i < k && ++idx[i] === terms.length) { idx[i] = 0; i++; }
  }
  return { inst: out, capped: false, total };
}
/**
 * Herbrand expansion of a (not necessarily negated) sentence: is the set of ground instances up to `level` satisfiable?
 * → {sat, instances, atoms, capped, terms, model}
 */
export function herbrandStage(sk, level, { cap = 2500 } = {}) {
  const consts = [...new Set(preorder(sk.matrix).filter((n) => n.t === 'const').map((n) => n.name))];
  const funcs = sk.skolems.filter((s) => s.arity > 0);
  const base = sk.skolems.filter((s) => s.arity === 0).map((s) => s.name);
  const terms = herbrandTerms([...new Set([...consts, ...base])], funcs, level);
  const g = groundInstances(sk, terms, cap);
  if (g.capped) return { sat: null, capped: true, instances: g.total, terms, atoms: 0 };
  const cnf = new Cnf(); g.inst.forEach((f) => cnf.assert(f));
  const r = dpll(cnf.clauses, cnf.names.length, { limit: 4e6 });
  return { sat: r.aborted ? null : r.sat, capped: false, instances: g.inst.length, terms, atoms: cnf.atoms.size, model: r.model, cnf, aborted: r.aborted };
}

// ---------------------------------------------------------------- Gödel's D_n (prenex ∀*∃* sentence, no function symbols, no equality)
/** Split ∀x1…xk ∃y1…ym ψ. Returns null when the prefix is not of this form. */
export function degreeOne(f) {
  const U = [], E = []; let n = f;
  while (n.op === 'all') { U.push(n.v); n = n.a; }
  while (n.op === 'ex') { E.push(n.v); n = n.a; }
  if (isQ(n) || preorder(n).some(isQ)) return null;
  return { U, E, psi: n };
}
/** The n-th k-tuple of positive integers: ordered by coordinate sum, then lexicographically. */
export function tuples(k, count) {
  const out = [];
  for (let sum = k; out.length < count; sum++) {
    const rec = (left, slots, acc) => {
      if (slots === 1) { if (left >= 1) out.push([...acc, left]); return; }
      for (let a = 1; a <= left - (slots - 1); a++) rec(left - a, slots - 1, [...acc, a]);
    };
    rec(sum, k, []);
  }
  return out.slice(0, count);
}
/** B_n for n ≤ N: ψ with universals set to the n-th tuple (as numerals) and existentials to the fresh numbers (n−1)m + j + 1. */
export function godelInstances(d, N) {
  const k = Math.max(d.U.length, 0), m = Math.max(d.E.length, 1);
  const tp = k ? tuples(k, N) : Array.from({ length: N }, () => []);
  const out = [];
  for (let n = 1; n <= N; n++) {
    let g = d.psi;
    d.U.forEach((x, i) => { g = substT(g, x, mk.CONST(String(tp[n - 1][i]))); });
    d.E.forEach((y, j) => { g = substT(g, y, mk.CONST(String((n - 1) * m + j + 2))); });
    out.push({ n, g, tuple: tp[n - 1], fresh: d.E.map((_, j) => (n - 1) * m + j + 2) });
  }
  return out;
}
/** Is B_1 ∧ … ∧ B_N satisfiable (as a propositional formula over atoms R(i,j,…))? With `fixed` = [[atomIndex, bool]…] fixing atoms. */
export function godelSat(inst, fixed = []) {
  const cnf = new Cnf(); inst.forEach((b) => cnf.assert(b.g));
  const atoms = [...cnf.atoms.entries()].sort((a, b) => a[1] - b[1]);
  const cls = [...cnf.clauses];
  for (const [key, val] of fixed) { const i = cnf.atoms.get(key); if (i) cls.push([val ? i : -i]); }
  const r = dpll(cls, cnf.names.length, { limit: 3e6 });
  return { sat: r.aborted ? null : r.sat, atoms, model: r.model, cnf, aborted: r.aborted };
}

// ---------------------------------------------------------------- misc
/** Exact element positions on a circle (data coordinates) starting at the top, clockwise. */
export const circlePos = (i, k, R = 1, cx = 0, cy = 0, start = 90) => { const a = (start - (360 * i) / k) * Math.PI / 180; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; };
export const subNum = (k) => String(k).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');

// ---------------------------------------------------------------- drawing a small structure
/**
 * Draw a finite structure on an equal-aspect stage with view about [-1.7,1.7]²: elements on a circle, binary relations as arrows
 * (first one accent, second orange), unary relations as letters under the element, constants as letters above it.
 * opts: {radius, r (px), lang, mark(a) → colour | null, label(a), noConsts}.
 */
export function drawStruct(s, M, lang, opts = {}) {
  const n = M.n, R = opts.radius ?? (n === 1 ? 0 : 1.0), rpx = opts.r ?? 14, sc = Math.abs(s.X(1) - s.X(0)) || 1;
  const pos = range(n).map((i) => (n === 1 ? [0, 0] : circlePos(i, n, R, 0, 0, 90 + 180 / n)));
  const bins = [...lang.rels].filter(([, ar]) => ar === 2).map(([nm]) => nm), uns = [...lang.rels].filter(([, ar]) => ar === 1).map(([nm]) => nm);
  const cols = ['accent', 'orange', 'purple'];
  bins.forEach((nm, k) => {
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      if (!M.rel(nm, [a, b])) continue;
      const [x1, y1] = pos[a], [x2, y2] = pos[b];
      if (a === b) {
        const ox = n === 1 ? 0 : pos[a][0] * 0.3, oy = n === 1 ? 0.3 : pos[a][1] * 0.3, len = Math.hypot(ox, oy) || 1;
        s.circle(x1 + ox / len * 0.2, y1 + oy / len * 0.2, 0.17, { color: cols[k], width: 1.6, fill: false });
      } else {
        const d = Math.hypot(x2 - x1, y2 - y1), sh = (rpx + 3) / sc / d, bend = bins.length > 1 || M.rel(nm, [b, a]) ? 0.1 : 0;
        const nx = -(y2 - y1) / d * bend, ny = (x2 - x1) / d * bend;
        s.arrow(x1 + (x2 - x1) * sh + nx, y1 + (y2 - y1) * sh + ny, x2 - (x2 - x1) * sh + nx, y2 - (y2 - y1) * sh + ny, { color: cols[k], width: 1.5, head: 7 });
      }
    }
  });
  for (let a = 0; a < n; a++) {
    const [x, y] = pos[a], mk0 = opts.mark ? opts.mark(a) : null;
    s.dot(x, y, { r: rpx, color: mk0 || 'ink', fill: mk0 || 'panel', fillAlpha: mk0 ? 0.25 : 1, width: 1.8 });
    s.text(opts.label ? opts.label(a) : String(a), x, y, { align: 'center', baseline: 'middle', size: 12.5, weight: 600, color: 'ink' });
    const us = uns.filter((u) => M.rel(u, [a])).join(' ');
    if (us) s.text(us, x, y, { align: 'center', baseline: 'top', dy: rpx + 3, size: 12, weight: 700, color: 'teal' });
    const cs = [...lang.consts].filter((c) => !opts.noConsts && !/^\d+$/.test(c) && M.konst(c) === a);
    if (cs.length) s.text(cs.join(','), x, y, { align: 'center', baseline: 'bottom', dy: -rpx - 3, size: 12, weight: 700, color: 'orange', math: true });
  }
  return pos;
}
