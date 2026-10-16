// Programming Languages & Types — Chapter 1: Syntax, induction and operational semantics (items 1.1–1.6; 1.7–1.11 in ch01-b.js)
import {
  mk, kids, size, depth, consts, numOf, isNV, isVal, eqT, postorder, parseNB, segs, str, strRaw, BASE_RULES, RULES, RULE_COLOR,
  stepsOf, runSmall, step1, nf, termsOfSize, countTerms, layoutG, drawTreePx, hitNode, nbTree, drawSegs, segWidth, drawDeriv,
  drawRuleSchema, drawParseError, wrapText, field, pxStage, hitDeriv, bigDeriv, NB_LABEL, BIG_RULES, bigEval,
} from './ch01.shared.js';

// ---------- 1.1: an infix expression language with a concrete and an abstract syntax ----------
/** Parse + - * expressions. Returns {ast, concrete, toks, dropped} or {error, pos, len}. Both trees are built in one pass. */
function infix(src, assoc) {
  const toks = []; const re = /\s+|\d+|[A-Za-z_][A-Za-z_0-9]*|./gy; let m;
  while ((m = re.exec(src))) { if (!/^\s+$/.test(m[0])) toks.push({ w: m[0], pos: m.index, len: m[0].length }); }
  let k = 0, dropped = 0;
  const peek = () => toks[k];
  const fail = (msg, tk = peek()) => { throw { msg, pos: tk ? tk.pos : src.length, len: tk ? tk.len : 1 }; };
  const leaf = (tk, kind) => ({ label: tk.w, kids: [], kind });
  const F = () => {
    const t = peek();
    if (!t) fail('the expression ends too early');
    if (/^[A-Za-z0-9_]+$/.test(t.w)) {
      const i0 = k; k++;
      const c = { label: 'F', kids: [leaf(t, 'tok')], kind: 'nt' }, a = { label: t.w, kids: [], span: [i0, k], ref: c, leaf: true };
      return { c, a, i0, i1: k };
    }
    if (t.w === '(') {
      const i0 = k; k++;
      const r = E(); const cl = peek();
      if (!cl || cl.w !== ')') fail(cl ? `expected “)” but found “${cl.w}”` : 'missing “)”');
      k++; dropped++;
      const c = { label: 'F', kids: [leaf(t, 'paren'), r.c, leaf(cl, 'paren')], kind: 'nt' };
      return { c, a: r.a, i0, i1: k };
    }
    fail(t.w === ')' ? 'unexpected “)”' : `“${t.w}” needs a left operand`);
  };
  const level = (sub, ops, name) => {
    const self = () => {
      if (assoc === 'left') {
        let r = sub(); r = { ...r, c: { label: name, kids: [r.c], kind: 'nt' } };
        while (peek() && ops.includes(peek().w)) {
          const op = peek(); k++; const r2 = sub();
          const c = { label: name, kids: [r.c, leaf(op, 'tok'), r2.c], kind: 'nt' };
          const a = { label: op.w, kids: [r.a, r2.a], span: [r.i0, r2.i1] }; a.ref = c;
          r = { c, a, i0: r.i0, i1: r2.i1 };
        }
        return r;
      }
      const r = sub();
      if (peek() && ops.includes(peek().w)) {
        const op = peek(); k++; const r2 = self();
        const c = { label: name, kids: [r.c, leaf(op, 'tok'), r2.c], kind: 'nt' };
        const a = { label: op.w, kids: [r.a, r2.a], span: [r.i0, r2.i1] }; a.ref = c;
        return { c, a, i0: r.i0, i1: r2.i1 };
      }
      return { c: { label: name, kids: [r.c], kind: 'nt' }, a: r.a, i0: r.i0, i1: r.i1 };
    };
    return self;
  };
  const T = level(F, ['*'], 'T');
  const E = level(T, ['+', '-'], 'E');
  try {
    if (!toks.length) return { error: 'empty expression', pos: 0, len: 1 };
    const r = E();
    if (k < toks.length) fail(toks[k].w === ')' ? 'unbalanced “)”' : `two operands side by side need an operator before “${toks[k].w}”`);
    return { ast: r.a, concrete: r.c, toks, dropped };
  } catch (e) { if (e && e.msg) return { error: e.msg, pos: e.pos, len: e.len }; throw e; }
}
const astKey = (a) => (a.kids.length ? `(${a.label} ${a.kids.map(astKey).join(' ')})` : a.label);
const astEval = (a, env) => {
  if (!a.kids.length) return /^\d+$/.test(a.label) ? +a.label : env[a.label];
  const x = astEval(a.kids[0], env), y = astEval(a.kids[1], env);
  return a.label === '+' ? x + y : a.label === '-' ? x - y : x * y;
};
/** Every abstract tree the ambiguous grammar E ::= E op E | ( E ) | atom admits for the token list (capped). */
function readings(toks, cap = 40) {
  const memo = new Map();
  const go = (i, j) => {
    const key = i * 100 + j; if (memo.has(key)) return memo.get(key);
    let res = []; const seen = new Set();
    const add = (a) => { const q = astKey(a); if (!seen.has(q) && res.length < cap) { seen.add(q); res.push(a); } };
    if (j === i + 1 && /^[A-Za-z0-9_]+$/.test(toks[i].w)) add({ label: toks[i].w, kids: [] });
    if (j - i >= 3 && toks[i].w === '(' && toks[j - 1].w === ')') for (const a of go(i + 1, j - 1)) add(a);
    for (let p = i + 1; p < j - 1; p++) if (['+', '-', '*'].includes(toks[p].w)) {
      const L = go(i, p), R = go(p + 1, j);
      for (const a of L) for (const b of R) add({ label: toks[p].w, kids: [a, b] });
    }
    memo.set(key, res); return res;
  };
  return go(0, toks.length);
}

// ---------- 1.2: three properties proved by structural induction ----------
const PROPS = {
  consts: { name: 'consts ≤ size', tex: String.raw`|\mathrm{consts}(t)| \le \mathrm{size}(t)`, lhs: (t) => consts(t).size, rhs: (t) => size(t), cmp: '≤', text: '|consts(t)| ≤ size(t)' },
  size: { name: 'size ≤ (3^depth − 1)/2', tex: String.raw`\mathrm{size}(t)\le (3^{\mathrm{depth}(t)}-1)/2`, lhs: (t) => size(t), rhs: (t) => (3 ** depth(t) - 1) / 2, cmp: '≤', text: 'size(t) ≤ (3^depth(t) − 1)/2' },
  depth: { name: 'consts ≤ depth  (false)', tex: String.raw`|\mathrm{consts}(t)| \le \mathrm{depth}(t)`, lhs: (t) => consts(t).size, rhs: (t) => depth(t), cmp: '≤', text: '|consts(t)| ≤ depth(t)' },
  strict: { name: 'consts < size  (false)', tex: String.raw`|\mathrm{consts}(t)| < \mathrm{size}(t)`, lhs: (t) => consts(t).size, rhs: (t) => size(t), cmp: '<', text: '|consts(t)| < size(t)' },
};
const holdsP = (P, t) => (P.cmp === '≤' ? P.lhs(t) <= P.rhs(t) : P.lhs(t) < P.rhs(t));
const CASE_RULE = {
  true: { pre: [], concl: 'P(true)' }, false: { pre: [], concl: 'P(false)' }, zero: { pre: [], concl: 'P(0)' },
  succ: { pre: ['P(t₁)'], concl: 'P(succ t₁)' }, pred: { pre: ['P(t₁)'], concl: 'P(pred t₁)' }, iszero: { pre: ['P(t₁)'], concl: 'P(iszero t₁)' },
  if: { pre: ['P(t₁)', 'P(t₂)', 'P(t₃)'], concl: 'P(if t₁ then t₂ else t₃)' },
};
const caseName = (op) => ({ true: 'Base case: true', false: 'Base case: false', zero: 'Base case: 0', succ: 'Case succ t₁', pred: 'Case pred t₁', iszero: 'Case iszero t₁', if: 'Case if t₁ then t₂ else t₃' }[op]);
const counterexample = (P, maxSize = 7) => {
  for (let n = 1; n <= maxSize; n++) for (const t of termsOfSize(n)) if (!holdsP(P, t)) return t;
  return null;
};

// ---------- 1.3: judgments, rules and derivation trees ----------
const FIRST = { nv: 'NV-Succ', val: 'V-Num', step: 'E-If', big: 'B-IfTrue' };
const J = {
  nv: (t) => ({ k: 'nv', t }), val: (t) => ({ k: 'val', t }), step: (t, u) => ({ k: 'step', t, u }), big: (t, u) => ({ k: 'big', t, u }),
};
const jStr = (j) => (j.k === 'nv' ? `${str(j.t)}  nv` : j.k === 'val' ? `${str(j.t)}  value` : j.k === 'step' ? `${str(j.t)} → ${str(j.u)}` : `${str(j.t)} ⇓ ${str(j.u)}`);
/** Is the judgment derivable (i.e. true in the inductively defined relation)? */
function derivable(j) {
  switch (j.k) {
    case 'nv': return isNV(j.t);
    case 'val': return isVal(j.t);
    case 'step': return stepsOf(j.t).some((s) => eqT(s.to, j.u));
    default: { const v = bigEval(j.t); return !!v && eqT(v, j.u); }
  }
}
const RULESETS = {
  nv: ['NV-Zero', 'NV-Succ'],
  val: ['V-True', 'V-False', 'V-Num'],
  step: BASE_RULES,
  big: ['B-Value', 'B-IfTrue', 'B-IfFalse', 'B-Succ', 'B-PredZero', 'B-PredSucc', 'B-IszeroZero', 'B-IszeroSucc'],
};
const MISC_RULES = {
  'NV-Zero': { pre: [], concl: '0 nv' }, 'NV-Succ': { pre: ['t₁ nv'], concl: 'succ t₁ nv' },
  'V-True': { pre: [], concl: 'true value' }, 'V-False': { pre: [], concl: 'false value' }, 'V-Num': { pre: ['t nv'], concl: 't value' },
  ...RULES, ...BIG_RULES,
};
/** Apply a rule to a goal: {pre: [goals]} or {error}. */
function applyRule(rule, g) {
  const { t } = g, no = (e) => ({ error: e });
  const expect = (cond, e) => (cond ? null : no(e));
  const need = (op, what) => expect(t.op === op, `${rule} concludes a judgment about a term of the form ${what}, but here the term is “${str(t)}” (head: ${NB_LABEL[t.op]})`);
  if (g.k === 'nv') {
    if (rule === 'NV-Zero') return expect(t.op === 'zero', `NV-Zero only concludes “0 nv”; this term is ${NB_LABEL[t.op]}`) || { pre: [] };
    if (rule === 'NV-Succ') return need('succ', 'succ t₁') || { pre: [J.nv(t.a)] };
  }
  if (g.k === 'val') {
    if (rule === 'V-True') return expect(t.op === 'true', 'V-True only concludes “true value”') || { pre: [] };
    if (rule === 'V-False') return expect(t.op === 'false', 'V-False only concludes “false value”') || { pre: [] };
    if (rule === 'V-Num') return { pre: [J.nv(t)] };
  }
  if (g.k === 'step') {
    const u = g.u;
    const mismatch = (what) => no(`the right-hand side must be ${what}, but it is “${str(u)}”`);
    switch (rule) {
      case 'E-IfTrue': return need('if', 'if t₁ then t₂ else t₃') || expect(t.a.op === 'true', 'E-IfTrue needs the condition to be literally true') || (eqT(u, t.b) ? { pre: [] } : mismatch(`the then-branch “${str(t.b)}”`));
      case 'E-IfFalse': return need('if', 'if t₁ then t₂ else t₃') || expect(t.a.op === 'false', 'E-IfFalse needs the condition to be literally false') || (eqT(u, t.c) ? { pre: [] } : mismatch(`the else-branch “${str(t.c)}”`));
      case 'E-If': return need('if', 'if t₁ then t₂ else t₃') || expect(u.op === 'if' && eqT(u.b, t.b) && eqT(u.c, t.c), 'E-If changes only the condition: both branches must stay the same') || { pre: [J.step(t.a, u.a)] };
      case 'E-Succ': return need('succ', 'succ t₁') || expect(u.op === 'succ', 'the result must again be a succ') || { pre: [J.step(t.a, u.a)] };
      case 'E-Pred': return need('pred', 'pred t₁') || expect(u.op === 'pred', 'the result must again be a pred') || { pre: [J.step(t.a, u.a)] };
      case 'E-Iszero': return need('iszero', 'iszero t₁') || expect(u.op === 'iszero', 'the result must again be an iszero') || { pre: [J.step(t.a, u.a)] };
      case 'E-PredZero': return need('pred', 'pred 0') || expect(t.a.op === 'zero', 'E-PredZero needs the argument to be exactly 0') || (u.op === 'zero' ? { pre: [] } : mismatch('0'));
      case 'E-PredSucc': return need('pred', 'pred (succ nv₁)') || expect(t.a.op === 'succ' && isNV(t.a.a), 'E-PredSucc needs the argument to be succ of a numeric value') || (eqT(u, t.a.a) ? { pre: [] } : mismatch(`nv₁ = “${str(t.a.a)}”`));
      case 'E-IszeroZero': return need('iszero', 'iszero 0') || expect(t.a.op === 'zero', 'E-IszeroZero needs the argument to be exactly 0') || (u.op === 'true' ? { pre: [] } : mismatch('true'));
      case 'E-IszeroSucc': return need('iszero', 'iszero (succ nv₁)') || expect(t.a.op === 'succ' && isNV(t.a.a), 'E-IszeroSucc needs the argument to be succ of a numeric value') || (u.op === 'false' ? { pre: [] } : mismatch('false'));
      default: break;
    }
  }
  if (g.k === 'big') {
    const u = g.u;
    switch (rule) {
      case 'B-Value': return expect(isVal(t), `“${str(t)}” is not a value, so B-Value does not apply`) || (eqT(t, u) ? { pre: [] } : no(`B-Value gives v ⇓ v: the result must be “${str(t)}”`));
      case 'B-IfTrue': return need('if', 'if t₁ then t₂ else t₃') || { pre: [J.big(t.a, mk.T()), J.big(t.b, u)] };
      case 'B-IfFalse': return need('if', 'if t₁ then t₂ else t₃') || { pre: [J.big(t.a, mk.F()), J.big(t.c, u)] };
      case 'B-Succ': return need('succ', 'succ t₁') || expect(u.op === 'succ' && isNV(u), 'B-Succ concludes succ nv₁, so the result must be a successor numeral') || { pre: [J.big(t.a, u.a)] };
      case 'B-PredZero': return need('pred', 'pred t₁') || expect(u.op === 'zero', 'B-PredZero concludes 0') || { pre: [J.big(t.a, mk.Z())] };
      case 'B-PredSucc': return need('pred', 'pred t₁') || expect(isNV(u), 'B-PredSucc concludes a numeric value nv₁') || { pre: [J.big(t.a, mk.succ(u))] };
      case 'B-IszeroZero': return need('iszero', 'iszero t₁') || expect(u.op === 'true', 'B-IszeroZero concludes true') || { pre: [J.big(t.a, mk.Z())] };
      case 'B-IszeroSucc': {
        const r = need('iszero', 'iszero t₁') || expect(u.op === 'false', 'B-IszeroSucc concludes false'); if (r) return r;
        const w = bigEval(t.a); // the rule's nv₁ is existential: take the witness from the actual value
        return w && w.op === 'succ' && isNV(w) ? { pre: [J.big(t.a, w)] } : no(`B-IszeroSucc needs ${str(t.a)} to evaluate to succ nv₁`);
      }
      default: break;
    }
  }
  return no(`${rule} is not a rule for this kind of judgment`);
}
const newNode = (g) => ({ g, c: jStr(g), rule: null, kids: [], open: true });
const cloneD = (n) => ({ ...n, kids: n.kids.map(cloneD) });
function openNodes(n, out = []) { if (n.open) out.push(n); n.kids.forEach((k) => openNodes(k, out)); return out; }
function autoSolve(n) {
  if (!n.open) { n.kids.forEach(autoSolve); return; }
  for (const r of RULESETS[n.g.k]) {
    const a = applyRule(r, n.g);
    if (a.error || !a.pre.every(derivable)) continue;
    n.rule = r; n.open = false; n.kids = a.pre.map(newNode); n.kids.forEach(autoSolve); return;
  }
}
const dHeight = (n) => (n.kids.length ? 1 + Math.max(...n.kids.map(dHeight)) : 1);
const dCount = (n) => 1 + n.kids.reduce((s, k) => s + dCount(k), 0);

// ---------- 1.5: head-conflicts of the step relation ----------
const EXTRA = { none: [], f1: ['E-Funny1'], f2: ['E-Funny2'], both: ['E-Funny1', 'E-Funny2'] };
const pairCache = new Map();
/** For all terms up to maxSize: which pairs of root rules can give different successors on one term. */
function conflicts(R, maxSize) {
  const key = R.join() + maxSize; if (pairCache.has(key)) return pairCache.get(key);
  const pairs = new Map(); let multi = 0, total = 0, first = null;
  for (let n = 1; n <= maxSize; n++) for (const t of termsOfSize(n)) {
    total++;
    const ss = stepsOf(t, R); if (ss.length < 2) continue;
    let diff = false;
    for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) if (!eqT(ss[i].to, ss[j].to)) {
      diff = true; const k = [ss[i].axiom, ss[j].axiom].sort().join('|'); pairs.set(k, (pairs.get(k) || 0) + 1);
    }
    if (diff) { multi++; if (!first) first = t; }
  }
  const res = { pairs, multi, total, first }; pairCache.set(key, res); return res;
}

// ---------- 1.6: classification ----------
const classify = (t) => (isVal(t) ? 'value' : step1(t) ? 'steps' : 'stuck');
/** The smallest stuck subterm responsible for a stuck term (the node where no rule applies). */
function blameOf(t) {
  if (classify(t) !== 'stuck') return null;
  const k = kids(t);
  if (t.op === 'if') { if (!isVal(t.a)) return blameOf(t.a) || t; return t; }
  if (k.length === 1 && !isVal(t.a)) return blameOf(t.a) || t;
  return t;
}
const CLS = { value: ['green', 'value'], stuck: ['red', 'stuck'], steps: ['accent', 'can step'] };
const classCache = new Map();
function classCounts(maxSize) {
  if (classCache.has(maxSize)) return classCache.get(maxSize);
  const rows = [];
  for (let n = 1; n <= maxSize; n++) {
    const r = { n, value: 0, stuck: 0, steps: 0, ex: { value: [], stuck: [], steps: [] } };
    for (const t of termsOfSize(n)) { const c = classify(t); r[c]++; if (r.ex[c].length < 6 && (c !== 'steps' || r.ex[c].length < 6)) r.ex[c].push(t); }
    rows.push(r);
  }
  classCache.set(maxSize, rows); return rows;
}
const PRESETS_NB = {
  ex1: 'if iszero (pred 1) then succ succ 0 else pred 3',
  stuck: 'if succ true then 0 else 1',
  bad: 'succ (if false then 0 else true)',
  deep: 'iszero pred pred succ succ succ 0',
};

export default {
  collection: 'pl',
  chapter: 1,
  title: 'Syntax, induction and operational semantics',
  summary: String.raw`A language is defined by its abstract syntax and by rules saying how programs compute. Inductive definitions give both, and structural induction proves facts about them. Small-step semantics describes computation one rewrite at a time, big-step semantics relates a program directly to its result; for simple languages they agree, evaluation is deterministic, and every closed term either reaches a value or gets stuck.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1', kind: 'Definition', name: 'Abstract syntax trees',
      statement: String.raw`The **concrete syntax** of a language is a set of strings, generated by a grammar whose non-terminals (like $E$, $T$, $F$ for sums, products and atoms) and punctuation (parentheses, precedence) exist only to make parsing unambiguous. The **abstract syntax** forgets all of that: a program is a finite *tree* whose nodes are the language's constructors — here $+,-,*$ with two children, and numerals and variables as leaves — and a parser is a function from strings to such trees. Semantics, type checking and induction are all defined on the tree, never on the string.`,
      idea: String.raw`A grammar is a recipe for derivation (parse) trees; most of their nodes are bookkeeping. Precedence and associativity conventions select *one* of the several trees the plain ambiguous grammar $E ::= E\,\mathrm{op}\,E \mid (E) \mid \mathrm{atom}$ allows, and parentheses merely route the parser: once the tree exists they are gone, because the tree structure already says what is grouped with what. Everything later in the atlas is defined by recursion on these trees.`,
      caption: String.raw`Edit the expression. The strip shows the text, the left tree is the concrete parse tree of the layered grammar $E\to E{+}T\mid E{-}T\mid T$, $T\to T{*}F\mid F$, $F\to n\mid x\mid(E)$, the right tree is the abstract syntax tree. **Click an operator in the abstract tree** to see which text it covers and which grammar node built it. Switch the associativity, or open “All readings” to see every tree the ambiguous grammar allows and which one the convention picks.`,
      deps: ['toc-5.2'], refs: ['Pierce §3.2'], tags: ['syntax', 'parsing', 'trees'],
      credit: 'McCarthy, 1962 (abstract syntax)',
      viz(v) {
        let ro = ""; v.readout(() => ro);
        const strip = pxStage(v, { height: 74, full: true, title: 'Concrete text' });
        const sP = pxStage(v, { height: 340, minWidth: 300, title: 'Parse tree (concrete syntax)' });
        const sA = pxStage(v, { height: 340, minWidth: 300, title: 'Abstract syntax tree' });
        let sel = null, ambK = 0;
        const view = v.select('View', [{ value: 'conv', label: 'Parse tree and AST' }, { value: 'amb', label: 'All readings' }], 'conv', { onChange: () => { ambK = 0; v.invalidate(); } });
        const assoc = v.select('Operators associate', [{ value: 'left', label: 'to the left' }, { value: 'right', label: 'to the right' }], 'left', { onChange: () => { sel = null; } });
        const xs = v.slider('x', 0, 9, 3, { step: 1, int: true });
        const ys = v.slider('y', 0, 9, 2, { step: 1, int: true });
        const stepper = v.slider('reading', 1, 12, 1, { step: 1, int: true, onChange: () => { ambK = stepper.value - 1; } });
        let R = null;
        const reparse = () => { sel = null; ambK = 0; R = infix(f.src, assoc.value); };
        const f = field(v, 'expression', '10 - 4 - (x + 1) * y', (s) => { const r = infix(s, 'left'); return r.ast ? { ast: true } : r; }, { width: 320, onChange: reparse });
        const ex = { a: '10 - 4 - 3', b: '1 + 2 * 3', c: '((x))', d: '(1 + 2) * (3 - y)' };
        const exSel = v.select('Try', [{ value: 'a', label: '10 − 4 − 3' }, { value: 'b', label: '1 + 2 * 3' }, { value: 'c', label: '((x))' }, { value: 'd', label: '(1+2)*(3−y)' }], 'a', { onChange: () => f.set(ex[exSel.value]) });
        reparse();
        const dim = (nd) => false;
        void dim;
        let LA = null;
        sA.onClick((x, y) => { if (!LA) return; const nd = hitNode(LA, sA.X(x), sA.Y(y)); sel = nd && nd.n.kids.length ? nd.n : null; v.invalidate(); });
        sP.onClick(() => {});
        const inSub = (n, root) => root && (n === root || root.kids.some((k) => inSub(n, k)));
        v.render(() => {
          if (f.err) {
            drawParseError(v, strip, f.src, f.err);
            return;
          }
          if (!R || R.error) R = infix(f.src, assoc.value);
          if (R.error) { drawParseError(v, strip, f.src, R); return; }
          const env = { x: xs.value, y: ys.value };
          // text strip with the selected span highlighted
          const txt = f.src;
          let parts = [{ s: txt }];
          if (sel && sel.span) {
            const a = R.toks[sel.span[0]].pos, b = R.toks[sel.span[1] - 1].pos + R.toks[sel.span[1] - 1].len;
            parts = [{ s: txt.slice(0, a) }, { s: txt.slice(a, b), hi: true }, { s: txt.slice(b) }];
          }
          const tw = segWidth(strip, parts, 20);
          drawSegs(v, strip, parts, Math.max(14, (strip.W - tw) / 2), 40, { size: 20 });
          const amb = view.value === 'amb';
          const all = readings(R.toks);
          const convIdx = all.findIndex((a) => astKey(a) === astKey(R.ast));
          const pick = amb ? all[Math.min(ambK, all.length - 1)] : null;
          // parse tree (left)
          if (!amb) {
            sP.setTitle('Parse tree (concrete syntax)');
            const LP = layoutG(R.concrete);
            const selRef = sel && sel.ref;
            drawTreePx(v, sP, LP, {
              fill: (nd) => (inSub(nd.n, selRef) ? 'gold' : nd.n.kind === 'nt' ? 'accent' : nd.n.kind === 'paren' ? 'orange' : null),
              labelColor: (nd) => (nd.n.kind === 'paren' ? 'orange' : null),
            });
          } else {
            sP.setTitle(`Reading ${Math.min(ambK, all.length - 1) + 1} of ${all.length} (ambiguous grammar)`);
            const LR = layoutG(pick);
            drawTreePx(v, sP, LR, { fill: (nd) => (nd.kids.length ? 'purple' : null) });
          }
          sA.setTitle(amb ? 'The convention’s abstract tree' : 'Abstract syntax tree');
          LA = layoutG(R.ast);
          drawTreePx(v, sA, LA, { fill: (nd) => (nd.n === sel ? 'gold' : nd.n.kids.length ? 'green' : null), ring: (nd) => (amb && pick && astKey(pick) === astKey(R.ast) && nd.d === 0 ? 'green' : null) });
          const nParse = amb ? 0 : layoutG(R.concrete).nodes.length;
          const nAst = LA.nodes.length;
          let val = '';
          const vars = new Set(); const walk = (a) => { if (!a.kids.length && /^[A-Za-z_]/.test(a.label)) vars.add(a.label); a.kids.forEach(walk); }; walk(R.ast);
          const known = [...vars].every((q) => q in env);
          val = known ? ` · value at $x={${env.x}},\\ y={${env.y}}$: **${astEval(R.ast, env)}**` : ` · (variables other than x, y have no value here)`;
          if (!amb) {
            ro = (`${R.toks.length} tokens · parse tree **${nParse}** nodes · abstract tree **${nAst}** nodes · **${R.dropped}** pair${R.dropped === 1 ? '' : 's'} of parentheses and every $E,T,F$ node disappear${val}`);
          } else {
            const same = astKey(pick) === astKey(R.ast);
            const vp = known ? astEval(pick, env) : null, vc = known ? astEval(R.ast, env) : null;
            ro = (`The ambiguous grammar gives **${all.length}${all.length >= 40 ? '+' : ''}** abstract trees for these ${R.toks.length} tokens; the ${assoc.value === 'left' ? 'left' : 'right'}-associative convention picks reading **${convIdx + 1}**. Shown: reading ${Math.min(ambK, all.length - 1) + 1} — ${same ? '**the convention’s pick**' : 'a different tree'}${known ? `, value ${vp}${vp === vc ? ' (same as the convention)' : ` versus ${vc} for the convention — the meaning depends on the tree`}` : ''}`);
          }
          stepper.el.hidden = !amb;
        });
        v.legend([['accent', 'non-terminal', { dot: true }], ['orange', 'parenthesis (vanishes)', { dot: true }], ['green', 'AST operator', { dot: true }], ['gold', 'selected subtree', { dot: true }]]);
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2', kind: 'Method', name: 'Structural induction on terms',
      statement: String.raw`Let $P$ be a property of terms of an inductively defined language (here $t ::= \mathtt{true}\mid\mathtt{false}\mid 0\mid\mathtt{succ}\,t\mid\mathtt{pred}\,t\mid\mathtt{iszero}\,t\mid\mathtt{if}\,t\,\mathtt{then}\,t\,\mathtt{else}\,t$). If $P$ holds for every constant, and $P(t)$ follows from $P$ of the immediate subterms of $t$ for each constructor, then $P(t)$ holds for every term $t$. Equivalently, if $P$ holds of all terms of size less than $n$ it holds of all terms of size $n$ (induction on size), or on depth.`,
      idea: String.raw`Every term is finite and built from constants by finitely many constructor applications, so a minimal counterexample would be a term whose proper subterms all satisfy $P$ — and the step case forbids that. In practice one proves one equation or inequality per constructor, using the induction hypothesis for the children only. The classic first example (Lemma 3.3.3 in Pierce) is that a term contains no more distinct constants than it has nodes.`,
      caption: String.raw`Type a term, pick a property and step through the proof: nodes are visited children-first, each case uses only its children’s induction hypotheses (green = already proved). The two true properties go through; the two false ones show *where* an induction breaks — a failing step case or a failing base case — and the exhaustive check at the bottom finds the smallest counterexample.`,
      deps: ['pl-1.1'], refs: ['Pierce §3.3', 'Pierce §2.4'], tags: ['induction', 'proof'],
      credit: 'Burstall, 1969 (named structural induction)',
      viz(v) {
        let ro = ""; v.readout(() => ro);
        const sT = pxStage(v, { height: 330, minWidth: 320, title: 'The term and the induction' });
        const sR = pxStage(v, { height: 330, minWidth: 300, title: 'The case being proved' });
        const prop = v.select('Property', Object.entries(PROPS).map(([value, p]) => ({ value, label: p.name })), 'consts', { onChange: () => S.reset({ at: 'start' }) });
        const f = field(v, 'term', 'if iszero 0 then succ 0 else pred 0', (s) => { const r = parseNB(s); return r.ast && size(r.ast) > 24 ? { error: 'use at most 24 nodes here so the tree stays readable', pos: 0, len: s.length } : r; }, { width: 300, onChange: () => S.reset({ at: 'start' }) });
        let LT = null;
        const frames = () => {
          const t = f.ast, P = PROPS[prop.value], order = postorder(t);
          const done = new Set(), ok = new Map(), fr = [{ t, node: null, done: new Set(), ok: new Map(), kind: 'start', note: String.raw`**Claim.** $${P.tex}$ for every term $t$. We prove it by structural induction: each node is handled once all its children are.` }];
          for (const n of order) {
            const h = holdsP(P, n), ks = kids(n), ihs = ks.every((k) => ok.get(k) !== false && done.has(k));
            ok.set(n, h && ihs); done.add(n);
            const lhs = P.lhs(n), rhs = P.rhs(n);
            let note;
            if (!ks.length) note = h ? `**${caseName(n.op)}.** $P$ holds directly: ${P.text.replace('t', NB_LABEL[n.op])} reads ${lhs} ${P.cmp} ${rhs}. ✓` : `**${caseName(n.op)}.** Here $P$ must hold outright, but ${lhs} ${P.cmp} ${rhs} is **false**. The base case fails, so no induction can prove this property.`;
            else if (!ihs) note = `**${caseName(n.op)}.** The induction hypothesis is not available for every child, so this node cannot be proved.`;
            else note = h ? `**${caseName(n.op)}.** Assume $P$ for ${ks.length === 1 ? 'the child' : 'all three children'} (green). Then for this node ${lhs} ${P.cmp} ${rhs}. ✓` : `**${caseName(n.op)}.** The hypothesis holds for the children, yet for this node ${lhs} ${P.cmp} ${rhs} is **false**: the inductive step fails, so the proof breaks here.`;
            fr.push({ t, node: n, done: new Set(done), ok: new Map(ok), kind: ks.length ? 'step' : 'base', h, note, lhs, rhs });
          }
          const allok = ok.get(t);
          fr.push({ t, node: null, done: new Set(done), ok: new Map(ok), kind: 'end', note: allok ? String.raw`**Q.E.D.** Every node was proved from its children, so $${P.tex}$ for this term — and, the same argument working for any term, for all terms.` : `**The induction does not go through.** At least one case fails, so this attempt proves nothing${prop.value === 'depth' || prop.value === 'strict' ? ' — and indeed $P$ is false in general' : ''}.` });
          return fr;
        };
        const S = v.steps({ frames, start: 5, still: 5, speed: 1.1 });
        void LT;
        v.render(() => {
          if (f.err) { drawParseError(v, sT, f.src, f.err); drawParseError(v, sR, f.src, f.err); return; }
          const P = PROPS[prop.value], fr = S.frame, t = f.ast;
          if (!fr.t) return;
          LT = layoutG(nbTree(fr.t));
          const nodeOf = (nd) => nd.n.term;
          drawTreePx(v, sT, LT, {
            fill: (nd) => { const n = nodeOf(nd); return fr.node === n ? 'gold' : fr.done.has(n) ? (fr.ok.get(n) ? 'green' : 'red') : null; },
            dim: (nd) => !fr.done.has(nodeOf(nd)) && fr.node !== nodeOf(nd),
            note: (nd) => { const n = nodeOf(nd); return fr.done.has(n) ? `${P.lhs(n)}${P.cmp}${P.rhs(n)}` : ''; },
            noteColor: (nd) => (fr.ok.get(nodeOf(nd)) ? 'green' : 'red'),
          });
          // right: the induction principle's case rule, instantiated
          sR.textPx('Induction principle: one case per constructor', 12, 22, { size: 12.5, weight: 700, color: 'muted', halo: false });
          const op = fr.node ? fr.node.op : null;
          const lines = ['true', 'false', 'zero', 'succ', 'pred', 'iszero', 'if'];
          lines.forEach((o, i) => {
            const y = 54 + i * 22, act = o === op;
            sR.textPx(`${o === op ? '▶ ' : '   '}${CASE_RULE[o].pre.length ? CASE_RULE[o].pre.join('  ') + '  ⟹  ' : ''}${CASE_RULE[o].concl}`, 14, y, { size: 12.5, weight: act ? 700 : 500, color: act ? 'accent' : 'muted', halo: false });
          });
          if (fr.node) {
            const y0 = 54 + 7 * 22 + 22;
            sR.textPx('This case, for the highlighted node:', 14, y0, { size: 12.5, weight: 700, color: 'ink', halo: false });
            const ks = kids(fr.node);
            const pre = ks.map((k, i) => `P(${str(k)})`);
            const inst = `P(${str(fr.node)})`;
            const all = (pre.length ? pre.join('  ,  ') + '  ⟹  ' : '') + inst;
            wrapText(sR, all, sR.W - 28, 12.5).forEach((ln, i) => sR.textPx(ln, 14, y0 + 22 + i * 17, { size: 12.5, color: fr.h ? 'green' : 'red', weight: 600, halo: false }));
            sR.textPx(fr.h ? `${fr.lhs} ${P.cmp} ${fr.rhs}   ✓` : `${fr.lhs} ${P.cmp} ${fr.rhs}   ✗`, 14, sR.H - 22, { size: 15, weight: 700, color: fr.h ? 'green' : 'red', halo: false });
          }
          const ce = counterexample(P, 7), total = [1, 2, 3, 4, 5, 6, 7].reduce((a, n) => a + countTerms(n), 0);
          ro = (`Exhaustive sanity check: ${ce ? `$P$ fails — smallest counterexample **${str(ce)}** (size ${size(ce)})` : `$P$ holds for all **${total.toLocaleString('en-US')}** terms of size ≤ 7`}. A finite check is evidence; the induction above is the proof.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3', kind: 'Definition', name: 'Inference rules and derivation trees',
      statement: String.raw`An **inference rule** has premises (judgments) above a line and a conclusion below. A set of rules **inductively defines** a relation or predicate: the judgment $J$ holds exactly when it has a **derivation**, a finite tree whose root is $J$, whose every node is the conclusion of a rule instance, and whose children are the premises of that instance (axioms have none). The set is the *least* one closed under the rules; the height of a derivation is a measure for induction on derivations.`,
      idea: String.raw`Reading rules top-down builds up the set (stage by stage: all conclusions whose premises were already derived); reading them bottom-up is proof search, as here: to derive $J$, choose a rule whose conclusion has the right *shape*, and recursively derive its premises. A rule applied to a judgment of the wrong shape, or whose premises have no derivation, yields no tree at all.`,
      caption: String.raw`Pick a judgment kind, type its terms, choose a rule in the palette and **click an open goal (orange, dashed)** to apply it: its premises appear above the line. A rule of the wrong shape is refused with the reason. “Solve” runs proof search; a false goal such as “succ true nv” for a non-numeral has no derivation. For $nv$ the height of the tree is the stage at which the term enters the inductive set.`,
      deps: ['pl-1.1'], refs: ['Pierce §3.5'], tags: ['inference rules', 'derivations', 'induction'],
      viz(v) {
        let ro = ""; v.readout(() => ro);
        const sD = pxStage(v, { height: 320, full: true, title: 'Derivation tree (root at the bottom; premises stack above the line)' });
        const kindSel = v.select('Judgment', [{ value: 'nv', label: 't nv' }, { value: 'val', label: 't value' }, { value: 'step', label: 't → t′' }, { value: 'big', label: 't ⇓ v' }], 'step', { onChange: () => { rebuildRules(); f.set(DEF[kindSel.value]); } });
        const DEF = { nv: 'succ succ 0', val: 'succ 0', step: 'if iszero 0 then pred 2 else 0 -> if true then pred 2 else 0', big: 'pred (if true then 2 else 0)' };
        const parseGoal = (s) => {
          const k = kindSel.value;
          if (k === 'nv' || k === 'val') { const r = parseNB(s); return r.ast ? { ast: J[k](r.ast) } : r; }
          const m = s.split(/->|→|=>|⇓/);
          if (m.length !== 2) return { error: 'write the judgment as “term -> term”', pos: 0, len: Math.max(1, s.length) };
          const a = parseNB(m[0]), b = parseNB(m[1]);
          if (!a.ast) return a;
          if (!b.ast) return { ...b, pos: b.pos + m[0].length + (s.slice(m[0].length).match(/->|→|=>|⇓/)[0].length) };
          return { ast: J[k](a.ast, b.ast) };
        };
        let root = null, hist = [], msg = '', msgBad = false, info = null;
        const f = field(v, 'goal', DEF.step, (s) => parseGoal(s), { width: 440, onChange: () => resetGoal() });
        const rulePick = v.select('Rule', RULESETS.step.map((r) => ({ value: r, label: r.replace('-', '\u2011') })), 'E-IfTrue', {});
        function rebuildRules() {
          // the select is rebuilt by hiding: we keep one segmented control per judgment kind
          for (const [k, c] of Object.entries(pickers)) c.el.hidden = k !== kindSel.value;
        }
        const pickers = {};
        const mkPicker = (k, def) => { pickers[k] = k === 'step' ? rulePick : v.select('Rule', RULESETS[k].map((r) => ({ value: r, label: r.replace('-', '\u2011') })), def, {}); };
        mkPicker('step'); mkPicker('nv', 'NV-Zero'); mkPicker('val', 'V-Num'); mkPicker('big', 'B-Value');
        function resetGoal() {
          const k = kindSel.value;
          if (f.src === DEF.nv || f.src === DEF.val || f.src === DEF.step || f.src === DEF.big) { /* keep user text unless it is a stock example of another kind */ }
          const g = f.ast; root = g && g.k === k ? newNode(g) : null; hist = []; msg = ''; info = null;
          if (root && FIRST[k]) { const a = applyRule(FIRST[k], root.g); if (!a.error) { root.rule = FIRST[k]; root.open = false; root.kids = a.pre.map(newNode); } }
        }
        const startKind = () => { const k = kindSel.value; f.set(DEF[k]); };
        v.button('Example for this judgment', () => { startKind(); });
        v.button('Undo', () => { if (hist.length) { root = hist.pop(); msg = ''; } });
        v.button('Solve', () => { if (!root) return; hist.push(cloneD(root)); autoSolve(root); msg = ''; });
        v.button('Reset', () => { resetGoal(); });
        rebuildRules(); resetGoal();
        sD.onClick((x, y) => {
          if (!root || !info) return;
          const n = hitDeriv(info, sD.X(x), sD.Y(y));
          if (!n || !n.open) return;
          const rule = pickers[kindSel.value].value, a = applyRule(rule, n.g);
          if (a.error) { msg = `✗ ${rule} cannot be applied to “${n.c}”: ${a.error}.`; msgBad = true; return; }
          hist.push(cloneD(root));
          n.rule = rule; n.open = false; n.kids = a.pre.map(newNode); msg = `✓ ${rule} applied; ${a.pre.length ? `${a.pre.length} premise${a.pre.length > 1 ? 's' : ''} to derive.` : 'an axiom — no premises.'}`; msgBad = false;
        });
        v.render(() => {
          if (f.err) { drawParseError(v, sD, f.src, f.err); ro = ('Fix the goal to continue.'); return; }
          if (!root || root.g.k !== kindSel.value || jStr(root.g) !== jStr(f.ast)) { if (f.ast.k === kindSel.value) resetGoal(); }
          if (!root) { sD.textPx('This text is not a judgment of the selected kind — press “Example for this judgment”.', sD.W / 2, sD.H / 2, { align: 'center', size: 14, color: 'muted' }); return; }
          const opens = openNodes(root);
          info = drawDeriv(v, sD, root, { size: 14, region: [0, 8, sD.W, sD.H - (msg ? 34 : 6)], color: (n) => (n.open ? 'orange' : 'ink'), ring: (n) => (n === root && !opens.length ? 'green' : null) });
          if (msg) wrapText(sD, msg, sD.W - 24, 13).slice(0, 2).forEach((ln, i) => sD.textPx(ln, 14, sD.H - 24 + i * 16, { size: 13, weight: 600, color: msgBad ? 'red' : 'green', halo: false }));
          const g = root.g, ok = derivable(g);
          const done = !opens.length;
          const stage = g.k === 'nv' && ok ? ` · $t$ enters the inductive set at **stage ${numOf(g.t) + 1}** ($\\mathrm{NV}_{${numOf(g.t) + 1}}$), equal to the height of its derivation` : '';
          ro = ((done ? `Derivation complete: **${dCount(root)}** rule applications, height **${dHeight(root)}** — so the judgment is **true**${stage}.` : `${opens.length} open goal${opens.length > 1 ? 's' : ''}.${ok ? '' : ' **This judgment has no derivation at all** (it is false): every rule you try will fail somewhere.'} Selected rule: **${pickers[kindSel.value].value}**.`));
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4', kind: 'Definition', name: 'Small-step operational semantics',
      statement: String.raw`A **small-step (structural operational) semantics** for the language of booleans and numbers $\mathrm{NB}$ is a binary relation $t\to t'$ on terms ("$t$ takes one step to $t'$"), defined inductively by the rules E-IfTrue, E-IfFalse, E-PredZero, E-PredSucc, E-IszeroZero, E-IszeroSucc (the **computation rules**: they rewrite a **redex**) and the **congruence rules** E-If, E-Succ, E-Pred, E-Iszero, which allow a step inside the evaluated position. An **evaluation** of $t$ is a sequence $t\to t_1\to t_2\to\cdots$.`,
      idea: String.raw`Computation rules say what the basic operations do; congruence rules fix the *evaluation order* — here the condition of an if and the argument of a prefix operator are evaluated first, and the branches never. Because each step is derived by a tree of rules, the redex of a step is the place where the derivation bottoms out in a computation rule. The relation is Plotkin's structural operational semantics: meaning defined by induction on syntax, one rewrite at a time.`,
      caption: String.raw`Type a term (or pick one) and step through its evaluation. On the left the term, with the redex highlighted in the colour of the rule that fires (congruence rules in blue, computation rules by kind), and its abstract tree with the redex subtree in gold; on the right the derivation of this very step — congruence rules stack above the computation rule that does the work.`,
      deps: ['pl-1.3'], refs: ['Pierce §3.5'], tags: ['small-step', 'reduction'],
      credit: 'Plotkin, 1981 (structural operational semantics)',
      viz(v) {
        let ro = ""; v.readout(() => ro);
        const sT = pxStage(v, { height: 340, minWidth: 320, title: 'Term and abstract tree' });
        const sD = pxStage(v, { height: 340, minWidth: 320, title: 'Derivation of this step' });
        const sTr = pxStage(v, { height: 100, full: true, title: 'Evaluation so far' });
        const f = field(v, 'term', PRESETS_NB.ex1, parseNB, { width: 360, onChange: () => S.reset({ at: 'start' }) });
        const pre = v.select('Try', [{ value: 'ex1', label: 'a mixture' }, { value: 'deep', label: 'nested prefix' }, { value: 'stuck', label: 'stuck term' }], 'ex1', { onChange: () => f.set(PRESETS_NB[pre.value]) });
        const frames = () => {
          const run = runSmall(f.ast, BASE_RULES, 60), fr = [];
          run.terms.forEach((t, i) => fr.push({ t, step: run.steps[i] || null, i, terms: run.terms, steps: run.steps, status: run.status, last: i === run.terms.length - 1 }));
          return fr;
        };
        const S = v.steps({ frames, still: 2, speed: 1, note: false });
        v.render(() => {
          if (f.err) { drawParseError(v, sT, f.src, f.err); return; }
          const fr = S.frame; if (!fr.t) return;
          const col = fr.step ? RULE_COLOR[fr.step.axiom] : 'muted';
          const parts = segs(fr.t, fr.step ? fr.step.redex : null);
          const w = segWidth(sT, parts, 17);
          const sz = w > sT.W - 24 ? 17 * (sT.W - 24) / w : 17;
          drawSegs(v, sT, parts, Math.max(12, (sT.W - Math.min(w, sT.W - 24)) / 2), 30, { size: sz, hiColor: col });
          const L = layoutG(nbTree(fr.t));
          const inR = (nd) => { if (!fr.step) return false; for (let q = nd; q; q = q.parent) if (q.n.term === fr.step.redex) return true; return false; };
          drawTreePx(v, sT, L, { region: [0, 50, sT.W, sT.H], fill: (nd) => (inR(nd) ? 'gold' : null), ring: (nd) => (fr.step && nd.n.term === fr.step.redex ? col : null) });
          if (fr.step) {
            const di = drawDeriv(v, sD, fr.step.deriv, { size: 14, anchor: 'top', region: [0, 8, sD.W, sD.H - 110], color: (n) => RULE_COLOR[n.rule] || 'ink' });
            sD.textPx('The computation rule that does the work:', 14, Math.max(di.bottom + 34, 130), { size: 12, weight: 700, color: 'muted', halo: false });
            drawRuleSchema(v, sD, fr.step.axiom, RULES, sD.W / 2, Math.max(di.bottom + 58, 154), { color: RULE_COLOR[fr.step.axiom], size: 13 });
          } else {
            sD.textPx(fr.status === 'value' ? 'No rule applies: this term is a value.' : fr.status === 'stuck' ? 'No rule applies, yet it is not a value: the term is stuck.' : 'Step limit reached.', sD.W / 2, sD.H / 2, { align: 'center', size: 15, weight: 700, color: fr.status === 'stuck' ? 'red' : 'green' });
          }
          // trace strip
          const from = Math.max(0, fr.i - 2);
          let x = 14;
          for (let i = from; i <= fr.i; i++) {
            if (i > from) { sTr.textPx(`→`, x, 40, { size: 15, color: 'muted', halo: false }); x += 22; }
            const ps = segs(fr.terms[i]); const pw = segWidth(sTr, ps, 14);
            drawSegs(v, sTr, ps.map((p) => ({ ...p, hi: false })), x, 40, { size: 14, color: i === fr.i ? 'ink' : 'muted' });
            if (i < fr.terms.length - 1) sTr.textPx(fr.steps[i].axiom, x + pw / 2, 68, { size: 10.5, color: RULE_COLOR[fr.steps[i].axiom], align: 'center', weight: 700, halo: false });
            x += pw + 14;
          }
          if (from > 0) sTr.textPx(`… ${from} earlier step${from > 1 ? 's' : ''}`, 14, 84, { size: 11, color: 'muted', halo: false });
          ro = ((fr.step ? `Step ${fr.i + 1}: **${fr.step.axiom}** fires${fr.step.rule !== fr.step.axiom ? ` under the congruence rule${fr.step.deriv.kids.length ? 's' : ''} ${(() => { const cs = []; let d = fr.step.deriv; while (d.kids.length) { cs.push(d.rule); d = d.kids[0]; } return cs.join(', '); })()}` : ''}. Result: **${str(fr.step.to)}**` : `After ${fr.i} step${fr.i === 1 ? '' : 's'}: **${str(fr.t)}** — ${fr.status === 'value' ? 'a value' : fr.status === 'stuck' ? 'a stuck normal form' : 'still running'}.`));
        });
        v.legend([['green', 'if-rules'], ['orange', 'pred'], ['purple', 'iszero'], ['accent', 'congruence'], ['gold', 'redex subtree', { dot: true }]]);
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5', kind: 'Theorem', name: 'Determinacy of one-step evaluation',
      statement: String.raw`If $t\to t'$ and $t\to t''$ then $t'=t''$: every term has at most one successor, so evaluation is a function (partial: it is undefined on normal forms).`,
      idea: String.raw`By induction on the derivation of $t\to t'$. Look at the last rule used. If it is a computation rule, the *shape* of $t$ ( if true …, pred 0, pred (succ nv), …) already pins down which rule applies to the root, and no congruence rule can apply there because its premise would be a step of a *value* (a value is a normal form, an easy lemma). If it is a congruence rule, the other derivation must end in the same rule, and the induction hypothesis on the premise finishes. The proof is a check that the left-hand sides of the rules are pairwise disjoint.`,
      caption: String.raw`Type a term: every subterm where some rule can fire gets a ring, one colour per successor, and the successors are listed. Then add one of our two **extra rules** (illustrative, in the spirit of Pierce's exercises) and watch two different successors appear. The matrix shows, over all terms up to size 6, which pairs of rules ever compete — empty off the diagonal exactly when evaluation is deterministic.`,
      deps: ['pl-1.4', 'pl-1.2'], refs: ['Pierce §3.5'], tags: ['determinacy', 'small-step'],
      viz(v) {
        let ro = ""; v.readout(() => ro);
        const sT = pxStage(v, { height: 330, minWidth: 320, title: 'Where can a rule fire?' });
        const sM = pxStage(v, { height: 330, minWidth: 320, title: 'Rule pairs that compete (all terms of size ≤ 6)' });
        const extra = v.select('Extra rules', [{ value: 'none', label: 'none (Pierce)' }, { value: 'f1', label: '+ E-Funny1' }, { value: 'f2', label: '+ E-Funny2' }, { value: 'both', label: 'both' }], 'none', {});
        const f = field(v, 'term', 'if true then (if true then 0 else 1) else pred 2', parseNB, { width: 360 });
        v.button('Load smallest conflict', () => { const R = [...BASE_RULES, ...EXTRA[extra.value]]; const c = conflicts(R, 6); if (c.first) f.set(str(c.first)); });
        const PAL = ['gold', 'purple', 'teal', 'pink', 'orange'];
        let T = null;
        v.render(() => {
          const R = [...BASE_RULES, ...EXTRA[extra.value]];
          if (f.err) drawParseError(v, sT, f.src, f.err);
          else {
            const t = f.ast, all = stepsOf(t, R);
            const L = layoutG(nbTree(t));
            const bySucc = (nd) => all.map((s, i) => [s, i]).filter(([s]) => s.redex === nd.n.term);
            drawTreePx(v, sT, L, { region: [0, 8, sT.W, sT.H - 6], ring: (nd) => { const b = bySucc(nd); return b.length ? PAL[b[0][1] % PAL.length] : null; }, fill: (nd) => { const b = bySucc(nd); return b.length ? PAL[b[0][1] % PAL.length] : null; },
              note: (nd) => bySucc(nd).map(([, i]) => `#${i + 1}`).join(' ') });
            const distinct = new Set(all.map((s) => str(s.to))).size;
            ro = (`${all.length === 0 ? `**No rule applies**: ${isVal(t) ? 'a value' : 'a stuck term'}.` : `**${all.length}** rule derivation${all.length > 1 ? 's' : ''} apply — ${distinct === 1 ? 'one successor' : `**${distinct} different successors**: determinacy fails`}:`}\n${all.map((s, i) => `${i + 1}. ${s.axiom}${s.rule !== s.axiom ? ' (under ' + s.rule + ')' : ''} → ${str(s.to)}`).join('\n')}`);
          }
          // conflict matrix
          const c = conflicts(R, 6);
          const names = R;
          const n = names.length, X0 = 128, Y0 = 44, cell = Math.floor(Math.min((sM.W - X0 - 10) / n, (sM.H - Y0 - 34) / n, 30));
          const ctx = sM.ctx;
          names.forEach((a, i) => {
            sM.textPx(`${i + 1} ${a}`, X0 - 6, Y0 + i * cell + cell / 2, { align: 'right', size: 10.5, color: RULE_COLOR[a], weight: 600, halo: false });
            sM.textPx(String(i + 1), X0 + i * cell + cell / 2, Y0 - 12, { align: 'center', size: 10.5, color: RULE_COLOR[a], weight: 700, halo: false });
          });
          names.forEach((a, i) => names.forEach((b, j) => {
            const key = [a, b].sort().join('|'), cnt = c.pairs.get(key) || 0, isDiag = i === j;
            ctx.save(); ctx.fillStyle = cnt && !isDiag ? v.color('red', 0.55) : v.color('faint', isDiag ? 0.35 : 0.12); ctx.fillRect(X0 + j * cell + 1, Y0 + i * cell + 1, cell - 2, cell - 2); ctx.restore();
            if (cnt && !isDiag) sM.textPx(cnt > 99 ? '99+' : String(cnt), X0 + j * cell + cell / 2, Y0 + i * cell + cell / 2, { align: 'center', size: 9.5, weight: 700, color: 'ink', halo: false });
          }));
          sM.textPx(c.multi ? `${c.multi.toLocaleString('en-US')} of ${c.total.toLocaleString('en-US')} terms have two different successors` : `0 of ${c.total.toLocaleString('en-US')} terms have two successors`, 12, sM.H - 12, { size: 12.5, weight: 700, color: c.multi ? 'red' : 'green', halo: false });
          void T;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6', kind: 'Definition', name: 'Values, normal forms and stuck terms',
      statement: String.raw`A term is a **value** if it is $\mathtt{true}$, $\mathtt{false}$ or a numeric value $nv ::= 0\mid\mathtt{succ}\,nv$ — the possible final answers. A term is a **normal form** if no evaluation rule applies to it, i.e. there is no $t'$ with $t\to t'$. Every value is a normal form; a normal form that is not a value is a **stuck term**: evaluation has halted without producing an answer, as in $\mathtt{succ}\ \mathtt{true}$ or $\mathtt{if}\ 0\ \mathtt{then}\ 1\ \mathtt{else}\ 2$.`,
      idea: String.raw`Values are defined by shape, normal forms by the absence of steps, and the gap between them is exactly what a type system will later rule out. Being stuck is a *meaningful* error: the semantics describes the state a real implementation would crash or misbehave in, so safety can be stated as "well-typed terms never get stuck". A stuck term always has a culprit: an operator applied to an operand of the wrong kind.`,
      caption: String.raw`Edit a term: the badge says value / can step / stuck, and for a stuck term the offending operator is ringed red. The bar chart sorts *all* terms of each size into the three classes (exhaustive enumeration — pick the largest size to see about 10⁵ terms); use “Try” for examples. Note that values are rare and that most normal forms among larger terms are stuck.`,
      deps: ['pl-1.4'], refs: ['Pierce §3.5'], tags: ['values', 'normal forms', 'stuck'],
      viz(v) {
        let ro = ""; v.readout(() => ro);
        const sT = pxStage(v, { height: 320, minWidth: 320, title: 'Classify a term' });
        const sB = v.stage({ x: [0.4, 8.6], y: [0, 1], height: 320, minWidth: 320, axes: 'box', gutter: true, xlabel: 'term size (nodes)', ylabel: 'share of all terms', title: 'All terms of each size', xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const f = field(v, 'term', PRESETS_NB.stuck, parseNB, { width: 340 });
        const pre = v.select('Try', [{ value: 'stuck', label: 'succ true' }, { value: 'bad', label: 'inner stuck' }, { value: 'ex1', label: 'steps' }, { value: 'val', label: 'a value' }], 'stuck', { onChange: () => f.set(pre.value === 'val' ? 'succ succ succ 0' : PRESETS_NB[pre.value] === undefined ? 'succ true' : PRESETS_NB[pre.value]) });
        const N = v.slider('largest size shown', 3, 8, 6, { step: 1, int: true });
        v.render(() => {
          if (f.err) drawParseError(v, sT, f.src, f.err);
          else {
            const t = f.ast, c = classify(t), bl = blameOf(t);
            const [col, word] = CLS[c];
            const L = layoutG(nbTree(t));
            drawTreePx(v, sT, L, { region: [0, 52, sT.W, sT.H], fill: (nd) => (nd.n.term === bl ? 'red' : isVal(nd.n.term) ? 'green' : null), ring: (nd) => (nd.n.term === bl ? 'red' : nd.d === 0 && !bl ? col : null) });
            sT.textPx(`${str(t).length > 46 ? str(t).slice(0, 44) + '…' : str(t)}`, 12, 20, { size: 14, weight: 600, halo: false });
            sT.textPx(word.toUpperCase(), sT.W - 12, 20, { size: 14, weight: 800, color: col, align: 'right', halo: false });
            sT.textPx(`value? ${isVal(t) ? 'yes' : 'no'}    can step? ${step1(t) ? 'yes' : 'no'}`, 12, 38, { size: 12, color: 'muted', halo: false });
            ro = (`**${str(t)}** is ${c === 'value' ? 'a **value** (and so a normal form).' : c === 'steps' ? `not a value and **can step** (to ${str(step1(t))}); it is not a normal form.` : `a **stuck term**: a normal form that is not a value${bl ? ` — culprit: **${str(bl)}**, where ${bl.op === 'if' ? 'the condition is not a boolean' : `${bl.op} is applied to a non-number`}` : ''}.`}`);
          }
          const rows = classCounts(N.value);
          sB.setView([0.4, N.value + 0.6], [0, 1]);
          sB.setTicks(Array.from({ length: N.value }, (_, i) => i + 1), null);
          rows.forEach((r) => {
            const tot = r.value + r.stuck + r.steps; let y0 = 0;
            for (const k of ['value', 'stuck', 'steps']) {
              const h = r[k] / tot;
              if (h > 0) sB.rect(r.n - 0.36, y0, r.n + 0.36, y0 + h, { fill: CLS[k][0], fillAlpha: 0.55, color: CLS[k][0], width: 1.2 });
              y0 += h;
            }
            sB.text(tot.toLocaleString('en-US'), r.n, 1.045, { size: 10, align: 'center', color: 'muted' });
            // example chips only for the largest size shown: row of three small buttons
          });
          { const last = rows[rows.length - 1], tot = last.value + last.stuck + last.steps; ro = (f.err ? '' : ro + '\n') + `Among all **${tot.toLocaleString('en-US')}** terms of size ${last.n}: **${last.value}** values, **${last.stuck.toLocaleString('en-US')}** stuck, **${last.steps.toLocaleString('en-US')}** can step.`; }
        });
        v.legend([['green', 'value'], ['red', 'stuck (normal, not a value)'], ['accent', 'can step']]);
      },
    },
  ],
};
