// Logic & Foundations — Chapter 2: Propositional logic (items 2.1–2.6; 2.7–2.12 in ch02-b.js)
import {
  tokenize, parse, parseStrict, lettersOf, toTex, toStr, evaluate, rowVal, rowEnv, table, postorder, equalAst,
  layoutTree, drawTree, canonical, dnfAst, cnfAst, distributeCNF, tseitin, toInt, resolve, clauseStr, normClause,
  nnf, SYM, LETTERS, mk,
} from './ch02.shared.js';

// ---------- helpers ----------
/** A formula text field: keeps the last formula that parsed (with at most maxLetters letters) and the current error. */
function formulaField(v, label, def, { width = 250, maxLetters = 4, onChange } = {}) {
  let ast = parse(def).ast, error = null;
  const update = (src) => {
    const r = parse(src);
    if (!r.ast) { error = `${r.error}${r.pos != null ? ` (character ${r.pos + 1})` : ''}`; return; }
    const n = lettersOf(r.ast).length;
    if (n > maxLetters) { error = `use at most ${maxLetters} letters here`; return; }
    ast = r.ast; error = null;
  };
  const ctl = v.input(label, def, { width, onChange: (src) => { update(src); if (onChange) onChange(); } });
  return { ctl, get ast() { return ast; }, get error() { return error; }, set(src) { ctl.set(src); update(src); if (onChange) onChange(); } };
}
/** Fit a laid-out tree into a stage. */
function fitTree(s, L, pad = 0.6) {
  const w = Math.max(L.width, 3), c = (L.width - 1) / 2;
  s.setView([c - w / 2 - 0.2, c + w / 2 + 0.2 - 0.0], [-L.depth - pad, pad]);
}
const TF = (b) => (b ? 'T' : 'F');
const bits = (col) => Array.from(col, (b) => (b ? '1' : '0')).join('');

// ---------- 2.1: counting readings of a token string ----------
/** All readings (capped) and their exact count, for the paren-free grammar F → x | ¬F | F □ F. */
function readingsErased(toks, cap = 40) {
  const m = toks.length, memo = new Map();
  const go = (i, j) => {
    const key = i * 1000 + j; if (memo.has(key)) return memo.get(key);
    let list = [], count = 0;
    if (j === i + 1 && (toks[i].t === 'var' || toks[i].t === 'const')) { list.push(toks[i].t === 'var' ? mk.V(toks[i].v) : mk.C(toks[i].v)); count = 1; }
    if (j > i + 1) {
      if (toks[i].t === 'op' && toks[i].v === 'not') { const r = go(i + 1, j); count += r.count; for (const a of r.list) if (list.length < cap) list.push(mk.N(a)); }
      for (let k = i + 1; k < j - 1; k++) {
        if (toks[k].t !== 'op' || toks[k].v === 'not') continue;
        const L = go(i, k), R = go(k + 1, j);
        if (!L.count || !R.count) continue;
        count += L.count * R.count;
        for (const a of L.list) for (const b of R.list) if (list.length < cap) list.push(mk.B(toks[k].v, a, b));
      }
    }
    const r = { list, count }; memo.set(key, r); return r;
  };
  return m ? go(0, m) : { list: [], count: 0 };
}
/** Exact number of readings under Enderton's grammar x | ¬F | (¬F) | (F □ F). */
function countStrict(toks) {
  const m = toks.length, memo = new Map();
  const go = (i, j) => {
    if (j <= i) return 0;
    const key = i * 1000 + j; if (memo.has(key)) return memo.get(key);
    let c = 0;
    if (j === i + 1 && (toks[i].t === 'var' || toks[i].t === 'const')) c = 1;
    if (toks[i].t === 'op' && toks[i].v === 'not') c += go(i + 1, j);
    if (toks[i].t === '(' && toks[j - 1].t === ')') {
      if (toks[i + 1] && toks[i + 1].t === 'op' && toks[i + 1].v === 'not') c += go(i + 2, j - 1);
      for (let k = i + 2; k < j - 2; k++) if (toks[k].t === 'op' && toks[k].v !== 'not') c += go(i + 1, k) * go(k + 1, j - 1);
    }
    memo.set(key, c); return c;
  };
  return go(0, m);
}
const tokStr = (t) => (t.t === 'op' ? SYM[t.v] : t.t === 'const' ? (t.v ? '⊤' : '⊥') : t.v);

// ---------- 2.2: the official string with the span of every subformula ----------
function officialSpans(ast) {
  const toks = [], span = new Map();
  const go = (e) => {
    const a = toks.length;
    if (e.op === 'var' || e.op === 'const') toks.push(e.op === 'var' ? e.name : e.val ? '⊤' : '⊥');
    else if (e.op === 'not') { toks.push('(', '¬'); go(e.a); toks.push(')'); }
    else { toks.push('('); go(e.a); toks.push(SYM[e.op]); go(e.b); toks.push(')'); }
    span.set(e, [a, toks.length]);
  };
  go(ast);
  return { toks, span };
}

// ---------- 2.6: circuits ----------
const BASES = {
  nand: { name: 'NAND', sym: '↑', f: (a, b, M) => ~(a & b) & M },
  nor: { name: 'NOR', sym: '↓', f: (a, b, M) => ~(a | b) & M },
  mono: { name: '∧ ∨', ops: [['∧', (a, b) => a & b], ['∨', (a, b) => a | b]] },
};
/** Projections of n letters as truth-table masks over 2ⁿ rows (row convention of the shared rowVal). */
function projMasks(n) {
  const R = 1 << n, out = [];
  for (let j = 0; j < n; j++) { let m = 0; for (let i = 0; i < R; i++) if (rowVal(i, j, n)) m |= 1 << i; out.push(m); }
  return out;
}
/** Hash-consed circuit builder. gates: [{op, a, b}] with signals 0..n−1 = inputs, n+k = gate k. */
function circuitBuilder(n, evalOp) {
  const gates = [], key = new Map();
  return {
    gates,
    gate(op, a, b) { if (a > b) [a, b] = [b, a]; const k = `${op}|${a}|${b}`; if (key.has(k)) return key.get(k); gates.push({ op, a, b }); const id = n + gates.length - 1; key.set(k, id); return id; },
  };
}
/** Normal-form construction from the canonical DNF in the chosen basis. Returns {gates, out} or {impossible}. */
function constructCircuit(col, n, basis) {
  const C = circuitBuilder(n);
  const trueRows = []; for (let i = 0; i < col.length; i++) if (col[i]) trueRows.push(i);
  if (basis === 'mono') {
    // monotone functions: OR of ANDs over the minimal true rows, positive literals only
    for (let i = 0; i < col.length; i++) for (let k = 0; k < col.length; k++) {
      const below = [...Array(n).keys()].every((j) => !rowVal(k, j, n) || rowVal(i, j, n));
      if (below && col[k] && !col[i]) return { impossible: true };
    }
    const minimal = trueRows.filter((i) => !trueRows.some((k) => k !== i && [...Array(n).keys()].every((j) => !rowVal(k, j, n) || rowVal(i, j, n))));
    if (!trueRows.length) return { impossible: true };
    const terms = minimal.map((i) => { const ls = [...Array(n).keys()].filter((j) => rowVal(i, j, n)); if (!ls.length) return null; return ls.reduce((a, b) => C.gate('∧', a, b)); });
    if (terms.includes(null)) return { impossible: true };
    return { gates: C.gates, out: terms.reduce((a, b) => C.gate('∨', a, b)) };
  }
  const g = basis === 'nand' ? '↑' : '↓';
  const NOT = (a) => { const G = C.gates[a - n]; if (G && G.op === g && G.a === G.b) return G.a; return C.gate(g, a, a); };
  if (basis === 'nand') {
    const AND = (a, b) => NOT(C.gate(g, a, b));
    const OR = (a, b) => C.gate(g, NOT(a), NOT(b));
    if (!trueRows.length) { const x = 0; return { gates: C.gates, out: AND(x, NOT(x)) }; }
    const terms = trueRows.map((i) => [...Array(n).keys()].map((j) => (rowVal(i, j, n) ? j : NOT(j))).reduce(AND));
    return { gates: C.gates, out: terms.reduce(OR) };
  }
  const OR = (a, b) => NOT(C.gate(g, a, b));
  const AND = (a, b) => C.gate(g, NOT(a), NOT(b));
  if (!trueRows.length) { const x = 0; return { gates: C.gates, out: AND(x, NOT(x)) }; }
  const terms = trueRows.map((i) => [...Array(n).keys()].map((j) => (rowVal(i, j, n) ? j : NOT(j))).reduce(AND));
  return { gates: C.gates, out: terms.reduce(OR) };
}
/** Exhaustive search for a smallest circuit (≤ maxG gates) computing target mask; null if none. */
function smallestCircuit(target, n, basis, maxG) {
  const R = 1 << n, M = R >= 32 ? 0xffffffff : (1 << R) - 1, P = projMasks(n);
  const ops = basis === 'mono' ? [['∧', (a, b) => a & b], ['∨', (a, b) => a | b]] : [[BASES[basis].sym, (a, b) => BASES[basis].f(a, b, M)]];
  const idx = P.indexOf(target); if (idx >= 0) return { gates: [], out: idx };
  const sig = P.slice(), gates = [];
  let found = null;
  const dfs = (G) => {
    if (found) return;
    const S = sig.length;
    for (let a = 0; a < S && !found; a++) for (let b = a; b < S && !found; b++) for (const [name, f] of ops) {
      const m = f(sig[a], sig[b]);
      if (gates.length + 1 === G) { if (m === target) { found = { gates: [...gates, { op: name, a, b }], out: S }; return; } continue; }
      if (sig.includes(m)) continue;
      sig.push(m); gates.push({ op: name, a, b });
      dfs(G); sig.pop(); gates.pop();
      if (found) return;
    }
  };
  for (let G = 1; G <= maxG && !found; G++) dfs(G);
  return found;
}
/** Evaluate a circuit on one input row: values of all signals. */
function runCircuit(c, n, inputs, basis) {
  const val = inputs.slice();
  for (const g of c.gates) {
    const a = val[g.a], b = val[g.b];
    val.push(g.op === '↑' ? !(a && b) : g.op === '↓' ? !(a || b) : g.op === '∧' ? a && b : a || b);
  }
  return val;
}
/** Remove gates that do not feed the output (after hash-consing some may be dead). */
function pruneCircuit(c, n) {
  const live = new Set([c.out]);
  for (let k = c.gates.length - 1; k >= 0; k--) if (live.has(n + k)) { live.add(c.gates[k].a); live.add(c.gates[k].b); }
  const map = new Map(); for (let j = 0; j < n; j++) map.set(j, j);
  const gates = [];
  c.gates.forEach((g, k) => { if (live.has(n + k)) { gates.push({ op: g.op, a: map.get(g.a), b: map.get(g.b) }); map.set(n + k, n + gates.length - 1); } });
  return { gates, out: map.get(c.out) };
}

export default {
  collection: 'logic',
  chapter: 2,
  title: 'Propositional logic',
  summary: String.raw`Formulas are built from sentence letters with connectives, and each formula can be read in exactly one way, so its truth value can be computed by recursion on its structure. Truth tables decide tautology and consequence. Normal forms show that a few connectives express every Boolean function, and switching circuits are the same algebra built in hardware. Deciding a formula is always possible but can cost $2^n$ rows; resolution and DPLL do better on typical inputs, and random 3-SAT shows where they struggle. Compactness says that an infinite set of formulas is satisfiable as soon as each finite part is. It is the first theorem of the subject with real content.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Propositional formulas and unique readability',
      statement: String.raw`Fix sentence letters $p_1, p_2, \dots$ and the symbols $($, $)$, $\neg$, $\land$, $\lor$, $\to$, $\leftrightarrow$. The **formulas** (well-formed formulas, wffs) are the strings obtained from the letters by finitely many applications of the formation rules
$$\alpha\ \mapsto\ (\neg\alpha), \qquad \alpha,\beta\ \mapsto\ (\alpha\land\beta),\ (\alpha\lor\beta),\ (\alpha\to\beta),\ (\alpha\leftrightarrow\beta).$$
Equivalently, they form the smallest set of strings that contains the letters and is closed under these rules.

**Unique readability.** Every formula is exactly one of: a sentence letter; $(\neg\alpha)$ for a unique formula $\alpha$; or $(\alpha \mathbin{\square} \beta)$ for a unique binary connective $\square$ and unique formulas $\alpha, \beta$. So each formula has exactly one parse tree.`,
      idea: String.raw`The key lemma is about parentheses. Every formula has as many left as right parentheses, and every proper initial segment of a compound formula has strictly more left than right ones. Both facts follow by induction on formulas (logic-2.2). Suppose $(\alpha\mathbin{\square}\beta) = (\gamma\mathbin{\square'}\delta)$ with $\alpha \ne \gamma$. Then one of $\alpha$, $\gamma$ is a proper initial segment of the other. It would have more $($ than $)$, but it is itself a formula and so is balanced. Hence $\alpha=\gamma$, and then $\square=\square'$ and $\beta=\delta$. Without parentheses the lemma has nothing to work with, and a string such as $p\land q\to r$ can be read in more than one way.`,
      caption: String.raw`Type a formula in Enderton's fully parenthesised syntax (ASCII also works: ~ & | -> <->). Left: its parse tree. Right: the parenthesis depth after each symbol. On every proper initial segment it stays $\ge 1$, and the main connective (gold) is the only binary connective at depth 1. Delete a parenthesis and the parser reports where the string stops being a formula. Switch to **parentheses erased**: the same symbols now have several readings, counted exactly by dynamic programming. Two of them are drawn side by side, and the readout gives an assignment on which they disagree. Press **another reading** to see the next one.`,
      deps: [],
      refs: ['Enderton §1.1', 'Enderton §1.3'],
      tags: ['syntax', 'parsing'],
      viz(v) {
        const inp = v.input('formula', '((p ∧ ¬q) → (r ∨ (¬p)))', { width: 260 });
        const mode = v.select('', [{ value: 'typed', label: 'as typed' }, { value: 'erased', label: 'parentheses erased' }], 'typed');
        let pick = 0;
        const btn = v.button('another reading', () => { pick++; });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'parse tree' });
        const P = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'parenthesis depth after each symbol' });
        let memo = { src: null };
        const analyse = () => {
          if (memo.src === inp.value) return memo;
          const src = inp.value, out = { src };
          try { out.toks = tokenize(src); } catch (e) { out.toks = []; out.tokErr = e.msg; }
          const st = parseStrict(src); out.strict = st;
          let d = 0; out.prof = out.toks.map((t) => (d += t.t === '(' ? 1 : t.t === ')' ? -1 : 0));
          out.nStrict = out.toks.length ? countStrict(out.toks) : 0;
          out.erased = out.toks.filter((t) => t.t !== '(' && t.t !== ')');
          out.read = readingsErased(out.erased);
          // main connective index (Enderton syntax): the binary connective at depth 1
          out.main = -1;
          if (st.ast && st.ast.a && st.ast.op !== 'not') out.main = out.toks.findIndex((t, i) => t.t === 'op' && t.v !== 'not' && out.prof[i] === 1);
          memo = out; return out;
        };
        v.render(() => {
          const R = analyse(), erased = mode.value === 'erased';
          btn.hidden = !erased;
          if (!erased) {
            A.setTitle('parse tree'); P.setTitle('parenthesis depth after each symbol');
            if (R.strict.ast) {
              const L = layoutTree(R.strict.ast); fitTree(A, L);
              drawTree(A, L, { ring: (nd) => (nd.id === 0 && nd.e.op !== 'var' ? 'gold' : null) });
            } else {
              A.setView([0, 1], [0, 1]);
              A.text('not a formula', 0.5, 0.58, { align: 'center', size: 16, weight: 600, color: 'red' });
              A.text(R.tokErr || R.strict.error, 0.5, 0.45, { align: 'center', size: 12.5, color: 'red' });
            }
            // depth profile
            const m = R.toks.length, D = Math.max(2, ...R.prof);
            P.setView([-1.9, Math.max(m, 6) - 0.1], [-1.2, D + 1.9]);
            P.line(-0.6, 0, m - 0.4, 0, { color: 'faint', width: 1 });
            for (let k = 1; k <= D; k++) P.text(String(k), -0.8, k, { align: 'right', size: 10.5, color: 'muted' });
            R.toks.forEach((t, i) => {
              const bad = (R.prof[i] <= 0 && i < m - 1 && m > 1 && t.t !== 'var') || R.prof[i] < 0 || (R.strict.error && R.strict.at === i);
              const col = bad ? 'red' : i === R.main ? 'gold' : t.t === '(' || t.t === ')' ? 'accent' : 'muted';
              if (R.prof[i] > 0) P.rect(i - 0.36, 0, i + 0.36, R.prof[i], { fill: col, fillAlpha: i === R.main ? 0.75 : 0.35, color: col, width: 1 });
              else if (R.prof[i] < 0) P.rect(i - 0.36, R.prof[i], i + 0.36, 0, { fill: 'red', fillAlpha: 0.5, color: 'red', width: 1 });
              P.text(tokStr(t), i, D + 1.15, { align: 'center', size: 15, math: t.t === 'var', weight: i === R.main ? 700 : 500, color: bad ? 'red' : i === R.main ? 'gold' : 'ink' });
            });
            if (R.strict.error && R.strict.at >= m) P.text('⟵ ends too early', m - 0.4, D + 1.15, { align: 'left', size: 11, color: 'red' });
            P.text('depth', -0.8, D + 0.45, { align: 'right', size: 10.5, color: 'muted' });
          } else {
            A.setTitle('reading 1 (the one you typed)'); P.setTitle('another reading of the same symbols');
            const list = R.read.list;
            if (!list.length) { A.setView([0, 1], [0, 1]); P.setView([0, 1], [0, 1]); A.text('no reading at all', 0.5, 0.5, { align: 'center', size: 15, color: 'red' }); return; }
            const typed = R.strict.ast || parse(inp.value).ast;
            const i0 = Math.max(0, typed ? list.findIndex((t) => equalAst(t, typed)) : 0);
            const others = list.map((_, i) => i).filter((i) => i !== i0);
            const j = others.length ? others[pick % others.length] : i0;
            [[A, list[i0]], [P, list[j]]].forEach(([s, ast]) => { const L = layoutTree(ast); fitTree(s, L); drawTree(s, L, { ring: (nd) => (nd.id === 0 && nd.e.op !== 'var' ? 'gold' : null) }); });
            if (!others.length) P.corner('this string has only one reading', 'bl', { color: 'green' });
          }
        });
        v.readout(() => {
          const R = analyse();
          if (mode.value === 'typed') {
            if (!R.strict.ast) return `**Not a formula:** ${R.tokErr || R.strict.error}. Readings under the formation rules: **${R.nStrict}**.`;
            const n = R.toks.length, proper = R.prof.slice(0, -1);
            const minP = proper.length ? Math.min(...proper) : 0;
            const tail = R.main >= 0 ? `; the main connective is symbol ${R.main + 1} of ${n}, **${tokStr(R.toks[R.main])}**, the only binary connective at depth 1` : '';
            return `Readings under the formation rules: **${R.nStrict}** ✓. Parentheses balance (final depth ${R.prof[n - 1]}); the smallest depth on a proper initial segment is **${minP}**${tail}.`;
          }
          const list = R.read.list;
          if (!list.length) return 'This string of symbols has no reading as a formula.';
          const typed = R.strict.ast || parse(inp.value).ast;
          const i0 = Math.max(0, typed ? list.findIndex((t) => equalAst(t, typed)) : 0);
          const others = list.map((_, i) => i).filter((i) => i !== i0);
          if (!others.length) return `Erased string: ${R.erased.map(tokStr).join(' ')}. Exactly **1** reading, so nothing is lost here.`;
          const j = others[pick % others.length], a = list[i0], b = list[j];
          const vars = lettersOf(a), ta = table(a, vars), tb = table(b, vars);
          const row = ta.findIndex((x, i) => x !== tb[i]);
          const cnt = R.read.count;
          const diff = row >= 0 ? `Under ${vars.map((x, k) => `$${x}=${TF(rowVal(row, k, vars.length))}$`).join(', ')} reading 1 is **${TF(ta[row])}** and this one is **${TF(tb[row])}**.` : 'These two readings happen to be logically equivalent, but they are different formulas.';
          return `Erased string: ${R.erased.map(tokStr).join(' ')}. It has **${cnt}** readings (right panel: reading ${others.indexOf(j) + 2} of ${cnt > list.length ? `${list.length} listed` : cnt}). ${diff}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Induction and recursion on formulas',
      statement: String.raw`**Induction.** Let $S$ be a set of formulas that contains every sentence letter and is closed under the formation rules: if $\alpha,\beta \in S$ then $(\neg\alpha)\in S$ and $(\alpha\mathbin{\square}\beta)\in S$ for each binary connective $\square$. Then $S$ contains every formula.

**Recursion.** Given a value $h(p)$ for each sentence letter and operations $F_\neg$ and $F_\square$ (one for each binary $\square$) on a set $V$, there is exactly one function $\bar h$ from formulas to $V$ with $\bar h(p)=h(p)$, $\bar h((\neg\alpha)) = F_\neg(\bar h(\alpha))$ and $\bar h((\alpha\mathbin{\square}\beta)) = F_\square(\bar h(\alpha),\bar h(\beta))$.`,
      idea: String.raw`Induction holds because the formulas are the smallest set containing the letters and closed under the rules (logic-2.1). Any such $S$ contains that smallest set. Recursion needs more: to define $\bar h$ on $(\alpha\land\beta)$ we must know that $\alpha$ and $\beta$ are determined by the string. That is unique readability. Without it, two parse trees could give two different values, and $\bar h$ would not be well defined. Length, depth, the number of parentheses and truth values (logic-2.3) are all defined this way, and facts about them are proved by induction.`,
      caption: String.raw`Step through the parse tree in post-order: each node computes its value from its children's values by the recursion clause shown in the note. The inductive claim is then checked at that node (green = holds, red = fails). The top strip is the official string, with the current subformula highlighted. Choose the quantity. **Break it**: a wrong recursion clause (or, for length, a bound that is too strong) makes the induction step fail at the first node that uses it.`,
      deps: ['logic-2.1'],
      refs: ['Enderton §1.4'],
      tags: ['induction', 'recursion'],
      viz(v) {
        const F = formulaField(v, 'formula', '(p ∧ ¬q) → (r ∨ ¬(p ↔ s))', { width: 240, maxLetters: 6, onChange: () => S.reset() });
        const qty = v.select('', [{ value: 'par', label: 'parentheses' }, { value: 'let', label: 'letters vs binary' }, { value: 'len', label: 'length vs depth' }], 'par', { onChange: () => S.reset() });
        const broken = v.toggle('break it', false, { onChange: () => S.reset() });
        const strip = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 64, full: true });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true });
        // value of a node from its children's values; returns {val, txt (TeX of the clause), ok}
        const clause = (e, kids) => {
          const q = qty.value, br = broken.value;
          if (q === 'par') {
            if (e.op === 'var' || e.op === 'const') return { val: [0, 0], txt: String.raw`L=R=0` };
            if (e.op === 'not') { const [l, r] = kids[0]; return { val: [l + 1, r + 1], txt: String.raw`L = L(\alpha)+1 = ${l + 1},\; R = R(\alpha)+1 = ${r + 1}` }; }
            const [[l1, r1], [l2, r2]] = kids, R = r1 + r2 + (br ? 0 : 1);
            return { val: [l1 + l2 + 1, R], txt: String.raw`L = ${l1}+${l2}+1 = ${l1 + l2 + 1},\; R = ${r1}+${r2}${br ? '' : '+1'} = ${R}` };
          }
          if (q === 'let') {
            if (e.op === 'var' || e.op === 'const') return { val: [1, 0], txt: String.raw`\ell = 1,\; b = 0` };
            if (e.op === 'not') { const [l, b] = kids[0]; const nb = b + (br ? 1 : 0); return { val: [l, nb], txt: String.raw`\ell = \ell(\alpha) = ${l},\; b = b(\alpha)${br ? '+1' : ''} = ${nb}` }; }
            const [[l1, b1], [l2, b2]] = kids;
            return { val: [l1 + l2, b1 + b2 + 1], txt: String.raw`\ell = ${l1}+${l2} = ${l1 + l2},\; b = ${b1}+${b2}+1 = ${b1 + b2 + 1}` };
          }
          if (e.op === 'var' || e.op === 'const') return { val: [1, 0], txt: String.raw`\mathrm{len} = 1,\; d = 0` };
          if (e.op === 'not') { const [n, d] = kids[0]; return { val: [n + 3, d + 1], txt: String.raw`\mathrm{len} = ${n}+3 = ${n + 3},\; d = ${d}+1 = ${d + 1}` }; }
          const [[n1, d1], [n2, d2]] = kids;
          return { val: [n1 + n2 + 3, Math.max(d1, d2) + 1], txt: String.raw`\mathrm{len} = ${n1}+${n2}+3 = ${n1 + n2 + 3},\; d = \max(${d1},${d2})+1 = ${Math.max(d1, d2) + 1}` };
        };
        const claimOk = (val) => {
          const q = qty.value;
          if (q === 'par') return val[0] === val[1];
          if (q === 'let') return val[0] === val[1] + 1;
          const bound = broken.value ? 3 * 2 ** val[1] - 2 : 5 * 2 ** val[1] - 4;
          return val[0] <= bound;
        };
        const claimTex = () => (qty.value === 'par' ? String.raw`L(\varphi) = R(\varphi)` : qty.value === 'let' ? String.raw`\ell(\varphi) = b(\varphi) + 1` : broken.value ? String.raw`\mathrm{len}(\varphi) \le 3\cdot 2^{d(\varphi)} - 2` : String.raw`\mathrm{len}(\varphi) \le 5\cdot 2^{d(\varphi)} - 4`);
        const noteVal = (val) => (qty.value === 'par' ? `${val[0]}|${val[1]}` : qty.value === 'let' ? `${val[0]}|${val[1]}` : `${val[0]}|${val[1]}`);
        let L = null, order = [], vals = new Map(), oks = new Map(), info = new Map();
        const build = () => {
          L = layoutTree(F.ast); order = postorder(F.ast); vals = new Map(); oks = new Map(); info = new Map();
          const frames = [];
          for (const e of order) {
            const kids = e.op === 'not' ? [vals.get(e.a)] : e.a ? [vals.get(e.a), vals.get(e.b)] : [];
            const c = clause(e, kids); vals.set(e, c.val); const ok = claimOk(c.val); oks.set(e, ok); info.set(e, c);
            frames.push({ k: frames.length, e, note: String.raw`$${c.txt}$ — claim ${ok ? 'holds ✓' : '**fails ✗**'} at $${toTex(e)}$` });
          }
          return frames;
        };
        const S = v.steps({ frames: build, start: 'end', speed: 2.5, still: 'end' });
        let offAst = F.ast, offData = officialSpans(F.ast);
        v.render(() => {
          if (offAst !== F.ast) { offAst = F.ast; offData = officialSpans(F.ast); }
          const k = S.frame.k ?? order.length - 1, cur = S.frame.e;
          const done = new Set(order.slice(0, k + 1));
          fitTree(T, L, 0.75);
          drawTree(T, L, {
            fill: (nd) => (done.has(nd.e) ? (oks.get(nd.e) ? 'green' : 'red') : null),
            ring: (nd) => (nd.e === cur ? 'gold' : null),
            note: (nd) => (done.has(nd.e) ? noteVal(vals.get(nd.e)) : ''),
            noteColor: (nd) => (oks.get(nd.e) ? 'ink' : 'red'),
          });
          const lab = qty.value === 'par' ? 'notes: L|R  (left | right parentheses)' : qty.value === 'let' ? 'notes: ℓ|b  (letters | binary connectives)' : 'notes: len|d  (length | depth)';
          T.corner(lab, 'bl', { size: 11 });
          if (F.error) T.corner(F.error, 'tl', { color: 'red' });
          // official string strip
          const toks = offData.toks, n = toks.length, sp = cur ? offData.span.get(cur) : null;
          strip.setView([-1, Math.max(n, 20) + 2.6], [0, 1]);
          if (sp) strip.rect(sp[0] - 0.5, 0.18, sp[1] - 0.5, 0.82, { fill: 'gold', fillAlpha: 0.22, color: 'gold', width: 1.2, radius: 5 });
          toks.forEach((t, i) => strip.text(t, i, 0.5, { align: 'center', size: n > 34 ? 12 : 14.5, math: /^[a-z]/.test(t), color: sp && i >= sp[0] && i < sp[1] ? 'ink' : 'muted' }));
          strip.text(`${n} symbols`, Math.max(n, 20) + 2.4, 0.5, { align: 'right', size: 10.5, color: 'muted' });
        });
        v.readout(() => {
          const fails = order.filter((e) => !oks.get(e));
          const first = fails[0];
          const root = vals.get(F.ast);
          const what = qty.value === 'len' ? `length ${root[0]}, depth ${root[1]}` : qty.value === 'par' ? `${root[0]} left and ${root[1]} right parentheses` : `${root[0]} letter occurrences, ${root[1]} binary connectives`;
          return `Claim: $${claimTex()}$ for every formula. Whole formula: ${what}. ${fails.length ? `**Induction step fails** first at $${toTex(first)}$ (${fails.length} of ${order.length} nodes).` : `Holds at all **${order.length}** nodes ✓ (base case at the ${order.filter((e) => !e.a).length} leaves, induction step at the rest).`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Truth assignments and truth tables',
      statement: String.raw`A **truth assignment** for a set $S$ of sentence letters is a function $v : S \to \{T, F\}$. By recursion on formulas (logic-2.2) it extends uniquely to $\bar v$ on all formulas built from $S$:
$$\bar v(\neg\alpha)=T \iff \bar v(\alpha)=F,\qquad \bar v(\alpha\land\beta)=T \iff \bar v(\alpha)=\bar v(\beta)=T,$$
$$\bar v(\alpha\lor\beta)=F \iff \bar v(\alpha)=\bar v(\beta)=F,\qquad \bar v(\alpha\to\beta)=F \iff \bar v(\alpha)=T,\ \bar v(\beta)=F,$$
and $\bar v(\alpha\leftrightarrow\beta)=T \iff \bar v(\alpha)=\bar v(\beta)$. The value of $\varphi$ depends only on the letters occurring in $\varphi$. A formula with $n$ letters therefore has $2^n$ relevant assignments, and listing them with the values of every subformula gives its **truth table**.`,
      idea: String.raw`Unique readability makes the recursion well defined (logic-2.1, logic-2.2): each node of the parse tree computes its value from its children's values. Changing a letter that does not occur in $\varphi$ changes no node of $\varphi$'s tree, which is why only $2^n$ rows matter.`,
      caption: String.raw`Left: the parse tree under the current assignment (green = T, red = F). Click a leaf to flip that letter. Every node above it is recomputed, and the nodes that changed get a gold ring. Right: the truth table, one column per subformula, filled row by row by the player. Click a row to load that assignment into the tree.`,
      deps: ['logic-2.2'],
      refs: ['Enderton §1.2'],
      tags: ['semantics', 'truth tables'],
      viz(v) {
        const F = formulaField(v, 'formula', '(p → q) ∧ (¬q ∨ r)', { width: 230, maxLetters: 4, onChange: () => { S.reset(null, { at: 'end' }); } });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.85, title: 'parse tree under the current row' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.15, title: 'truth table' });
        const TT = v.table(B, { rows: 4, cols: 3, square: false, maxCell: 26, cellAspect: 3, size: 13, labelSize: 11.5 });
        let row = 0, prevRow = -1;
        const S = v.steps({ frames: () => { const n = lettersOf(F.ast).length; return Array.from({ length: (1 << n) + 1 }, (_, k) => ({ k, note: k ? `row ${k} filled` : 'empty table' })); }, start: 'end', speed: 3, still: 'end', note: false, onChange: (f) => { if (f.k > 0) { prevRow = row; row = f.k - 1; } } });
        let Lc = null, Last = null;
        const cols = () => {
          const vars = lettersOf(F.ast), subs = [], seen = new Set();
          for (const e of postorder(F.ast)) { if (e.op === 'var' || e.op === 'const') continue; const k = toStr(e); if (!seen.has(k)) { seen.add(k); subs.push(e); } }
          return { vars, subs: subs.length > 5 ? subs.slice(-5) : subs };
        };
        A.onClick((x, y) => {
          if (!Lc) return;
          const vars = lettersOf(F.ast), n = vars.length;
          for (const nd of Lc.nodes) if (nd.e.op === 'var' && Math.abs(A.X(nd.x) - A.X(x)) < 16 && Math.abs(A.Y(nd.y) - A.Y(y)) < 16) {
            const j = vars.indexOf(nd.e.name); prevRow = row; row ^= 1 << (n - 1 - j);
          }
        });
        B.onClick((x, y) => { const c = TT.hit(x, y); if (c && c.i >= 0) { prevRow = row; row = c.i; } });
        v.render(() => {
          if (Last !== F.ast) { Last = F.ast; Lc = layoutTree(F.ast); row = Math.min(row, (1 << lettersOf(F.ast).length) - 1); prevRow = -1; }
          const { vars, subs } = cols(), n = vars.length, env = rowEnv(row, vars), penv = prevRow >= 0 ? rowEnv(prevRow, vars) : null;
          fitTree(A, Lc, 0.7);
          drawTree(A, Lc, {
            fill: (nd) => (evaluate(nd.e, env) ? 'green' : 'red'),
            ring: (nd) => (penv && evaluate(nd.e, env) !== evaluate(nd.e, penv) ? 'gold' : null),
            note: (nd) => TF(evaluate(nd.e, env)), noteColor: (nd) => (evaluate(nd.e, env) ? 'green' : 'red'),
          });
          if (F.error) A.corner(F.error, 'bl', { color: 'red', size: 11 });
          else A.corner('click a letter to flip it', 'bl', { size: 11 });
          const filled = S.frame.k ?? (1 << n);
          const cw = [...vars.map(() => 0.55), ...subs.map((e) => Math.min(4, 0.6 + toStr(e).length * 0.16))];
          TT.draw({
            rows: 1 << n, cols: n + subs.length, colWeights: cw, cellAspect: 12,
            colLabels: [...vars.map((x) => `$${x}$`), ...subs.map((e) => `$${toTex(e)}$`)],
            value: (i, j) => (i >= filled ? null : j < n ? rowVal(i, j, n) : evaluate(subs[j - n], rowEnv(i, vars))),
            textColor: (i, j) => (j < n ? 'ink' : evaluate(subs[j - n], rowEnv(i, vars)) ? 'green' : 'red'),
            weight: (i, j) => (j === n + subs.length - 1 ? 700 : 500),
            fill: (i, j) => (j === n + subs.length - 1 && i < filled ? [evaluate(subs[j - n], rowEnv(i, vars)) ? 'green' : 'red', 0.16] : j < n ? ['faint', 0.12] : null),
            activeRow: row, activeColor: 'gold',
          });
          TT.box(row, 0, row, n + subs.length - 1, { color: 'gold', width: 2.5 });
        });
        v.readout(() => {
          const vars = lettersOf(F.ast), col = table(F.ast, vars), t = col.reduce((a, b) => a + b, 0);
          return `Row ${row + 1}: ${vars.map((x, j) => `$${x}=${TF(rowVal(row, j, vars.length))}$`).join(', ')} gives $\\bar v(\\varphi) = $ **${TF(col[row])}**. The formula is true in **${t}** of the $2^{${vars.length}} = ${col.length}$ rows.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Tautology, satisfiability and logical consequence',
      statement: String.raw`A truth assignment $v$ **satisfies** $\varphi$ if $\bar v(\varphi)=T$. A set $\Sigma$ of formulas **tautologically implies** $\tau$, written $\Sigma \vDash \tau$, if every truth assignment (for the letters involved) that satisfies every member of $\Sigma$ also satisfies $\tau$. In particular:
- $\tau$ is a **tautology** ($\vDash\tau$) if every assignment satisfies it;
- $\varphi$ is **satisfiable** if some assignment satisfies it, and **unsatisfiable** otherwise;
- $\Sigma \vDash \tau$ if and only if $\Sigma \cup \{\neg\tau\}$ is unsatisfiable.

For finite $\Sigma$ all of these can be decided with a truth table. An assignment that satisfies $\Sigma$ but not $\tau$ is a **countermodel**.`,
      idea: String.raw`Everything reduces to scanning the $2^n$ rows of a truth table (logic-2.3). A countermodel is a short certificate that $\Sigma\not\vDash\tau$. When $\Sigma\vDash\tau$ there is a syntactic certificate too. Write $\Sigma\cup\{\neg\tau\}$ in clause form and **resolve**: from $C\lor p$ and $D\lor\neg p$ infer $C\lor D$, until the empty clause $\square$ appears. Each resolvent is implied by its parents (soundness: a satisfiable set never yields $\square$). Conversely, an unsatisfiable finite clause set always yields $\square$ (completeness, by induction on the number of letters).`,
      caption: String.raw`Edit the premises (comma-separated) and the conclusion, or pick an example. Left: the truth table. Rows where all premises hold are tinted green, and rows where in addition the conclusion fails are countermodels (red). Right: a resolution proof search on the clauses of the premises and of $\neg$conclusion. If the consequence holds, step through the refutation down to $\square$. Every resolvent is checked to follow from its parents. Otherwise the search runs out of new clauses and no $\square$ appears. Try **affirming the consequent** to see a countermodel.`,
      deps: ['logic-2.3'],
      refs: ['Enderton §1.2'],
      tags: ['semantics', 'consequence', 'resolution'],
      viz(v) {
        const EX = {
          syl: ['p → q, q → r', 'p → r'], mp: ['p, p → q', 'q'], ac: ['p → q, q', 'p'], dil: ['p ∨ q, p → r, q → r', 'r'],
          lem: ['', 'p ∨ ¬p'], exp: ['p, ¬p', 'q'], dm: ['¬(p ∧ q)', '¬p ∨ ¬q'],
        };
        const ex = v.select('example', [{ value: 'syl', label: 'syllogism' }, { value: 'mp', label: 'modus ponens' }, { value: 'ac', label: 'affirming the consequent' }, { value: 'dil', label: 'dilemma' }, { value: 'lem', label: 'excluded middle' }, { value: 'exp', label: 'explosion' }], 'syl', {
          onChange: (k) => { prem.set(EX[k][0]); conc.set(EX[k][1]); recompute(); S.reset(null, { at: 'end' }); },
        });
        const prem = v.input('premises Σ', EX.syl[0], { width: 210, onChange: () => { recompute(); S.reset(null, { at: 'end' }); } });
        const conc = v.input('conclusion τ', EX.syl[1], { width: 120, onChange: () => { recompute(); S.reset(null, { at: 'end' }); } });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1, title: 'truth table' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1, title: 'resolution on Σ ∪ {¬τ}' });
        const TT = v.table(A, { rows: 4, cols: 3, square: false, maxCell: 30, cellAspect: 2, size: 13, labelSize: 12 });
        const G = v.graph(B, { nodes: [], edges: [], directed: true, shape: 'box', layout: 'none', draggable: false, fontSize: 12 });
        let st = null;
        function recompute() {
          const ps = prem.value.split(',').map((x) => x.trim()).filter(Boolean).map(parse);
          const c = parse(conc.value.trim() || '⊤');
          const err = [...ps, c].find((r) => !r.ast);
          if (err) { st = { ...(st || {}), error: err.error }; return; }
          const P = ps.map((r) => r.ast), C = c.ast;
          const vars = lettersOf(P.reduce((a, b) => mk.B('and', a, b), C));
          if (vars.length > 5) { st = { ...(st || {}), error: 'use at most 5 letters here' }; return; }
          const n = vars.length, R = 1 << n;
          const pc = P.map((f) => table(f, vars)), cc = table(C, vars);
          const allP = Array.from({ length: R }, (_, i) => pc.every((col) => col[i]));
          const counter = allP.map((x, i) => x && !cc[i]);
          // clauses of Σ ∪ {¬τ}
          let clauses = [];
          for (const f of [...P, mk.N(C)]) clauses = clauses.concat(distributeCNF(f, 300));
          const { names, cls } = toInt(clauses, vars);
          const res = resolve(cls, { maxClauses: 300 });
          st = { error: null, P, C, vars, n, pc, cc, allP, counter, names, cls, res };
        }
        recompute();
        const frames = () => {
          if (!st || !st.res) return [{}];
          const { res, names } = st;
          if (!res.refuted) return [{ k: 0, note: `No $\\square$: the search stops after ${res.clauses.length} clauses with nothing new to add${res.capped ? ' (capped)' : ''}.` }];
          const leaves = res.proof.filter((i) => !res.clauses[i].parents), inner = res.proof.filter((i) => res.clauses[i].parents);
          const out = [{ k: 0, note: `Start: the ${leaves.length} input clauses used by the proof.` }];
          inner.forEach((i, t) => {
            const d = res.clauses[i], [a, b] = d.parents;
            out.push({ k: t + 1, cur: i, note: `Resolve $${texC(res.clauses[a].c, names)}$ and $${texC(res.clauses[b].c, names)}$ on $${names[d.pivot - 1]}$: $${texC(d.c, names)}$` });
          });
          return out;
        };
        const texC = (c, names) => (c.length ? c.map((l) => (l < 0 ? '\\neg ' : '') + names[Math.abs(l) - 1]).join(' \\lor ') : '\\square');
        const S = v.steps({ frames, start: 'end', still: 'end', speed: 1.2 });
        let gKey = null;
        v.render(() => {
          if (!st || !st.vars) return;
          const { vars, n, P, C, pc, cc, allP, counter, res, names } = st;
          const nc = n + P.length + 1;
          TT.draw({
            rows: 1 << n, cols: nc,
            colWeights: [...vars.map(() => 0.6), ...P.map((f) => Math.min(2.6, 0.7 + toStr(f).length * 0.12)), Math.min(2.6, 0.8 + toStr(C).length * 0.12)],
            cellAspect: 2.2,
            colLabels: [...vars.map((x) => `$${x}$`), ...P.map((f) => `$${toTex(f)}$`), `$${toTex(C)}$`],
            value: (i, j) => (j < n ? rowVal(i, j, n) : j < n + P.length ? !!pc[j - n][i] : !!cc[i]),
            textColor: (i, j) => (j < n ? 'ink' : (j < n + P.length ? pc[j - n][i] : cc[i]) ? 'ink' : 'muted'),
            weight: (i, j) => (j === nc - 1 ? 700 : 500),
            fill: (i) => (counter[i] ? ['red', 0.3] : allP[i] ? ['green', 0.22] : null),
            colLabelColor: (j) => (j === nc - 1 ? 'accent' : j >= n ? 'ink' : 'muted'),
          });
          // resolution graph
          const key = JSON.stringify([st.cls, res.proof]);
          if (key !== gKey) {
            gKey = key;
            if (res.refuted) {
              const nodes = res.proof.map((i) => ({ id: i, label: clauseStr(res.clauses[i].c, names) }));
              const edges = []; res.proof.forEach((i) => { const p = res.clauses[i].parents; if (p) { edges.push([p[0], i]); edges.push([p[1], i]); } });
              G.set({ nodes, edges }); G.layout('layered', { rankdir: 'down', gap: 46 });
            } else {
              const nodes = st.cls.map((c, i) => ({ id: 'in' + i, label: clauseStr(normClause(c) || c, names) }));
              G.set({ nodes, edges: [] }); G.layout('grid', { cols: Math.min(3, nodes.length) });
            }
          }
          const f = S.frame, k = f.k ?? 1e9;
          if (res.refuted) {
            const inner = res.proof.filter((i) => res.clauses[i].parents);
            const shown = new Set([...res.proof.filter((i) => !res.clauses[i].parents), ...inner.slice(0, k)]);
            const curP = f.cur != null ? res.clauses[f.cur].parents : [];
            G.draw({
              dim: G.nodes.filter((nd) => !shown.has(nd.id)).map((nd) => nd.id),
              nodeFill: (id) => (id === res.empty && shown.has(id) ? 'green' : id === f.cur ? 'gold' : null),
              nodeColor: (id) => (curP.includes(id) ? 'orange' : res.clauses[id].parents ? 'accent' : 'muted'),
              edgeColor: (e) => (e.to === f.cur ? 'orange' : null),
            });
          } else {
            G.draw({ nodeColor: () => 'muted' });
            B.corner('saturated: no □ can be derived', 'bl', { color: 'red', size: 12 });
          }
          if (st.error) A.corner(st.error, 'bl', { color: 'red' });
        });
        v.readout(() => {
          if (!st || !st.vars) return st && st.error ? `**Error:** ${st.error}` : '';
          const { vars, n, counter, allP, cc, res } = st;
          const ce = counter.findIndex(Boolean);
          const taut = cc.every(Boolean), sat = cc.some(Boolean);
          const kind = `τ is ${taut ? '**a tautology**' : sat ? '**satisfiable** but not a tautology' : '**unsatisfiable**'}`;
          const premSat = allP.some(Boolean);
          let verdict;
          if (ce >= 0) verdict = `**Σ ⊭ τ**: countermodel ${vars.map((x, j) => `$${x}=${TF(rowVal(ce, j, n))}$`).join(', ')} (${counter.filter(Boolean).length} red row${counter.filter(Boolean).length > 1 ? 's' : ''}).`;
          else verdict = `**Σ ⊨ τ** ✓: ${premSat ? `all ${allP.filter(Boolean).length} rows satisfying Σ satisfy τ` : 'no row satisfies Σ, so Σ implies everything'}.`;
          const proof = res.refuted ? `Resolution reaches $\\square$ in ${res.proof.filter((i) => res.clauses[i].parents).length} steps, and every resolvent follows from its parents ✓: the syntactic and semantic verdicts agree.` : `Resolution saturates without $\\square$, and the semantic verdict agrees.`;
          return `${verdict} ${proof} Alone, ${kind}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Disjunctive and conjunctive normal forms',
      statement: String.raw`Every Boolean function $G : \{T,F\}^n \to \{T,F\}$ with $n\ge1$ is realised by a formula in **disjunctive normal form** (a disjunction of conjunctions of literals $p_i$, $\neg p_i$) and by one in **conjunctive normal form** (a conjunction of disjunctions of literals). Consequently every formula is equivalent to a DNF formula and to a CNF formula.

The canonical forms can be exponentially large. For example, every DNF for $p_1\oplus\cdots\oplus p_n$ has $2^{n-1}$ terms, and distributing $(x_1\land y_1)\lor\cdots\lor(x_n\land y_n)$ into CNF yields $2^n$ clauses. Allowing new letters (the Tseitin encoding) gives an equisatisfiable CNF of linear size instead.`,
      idea: String.raw`For each true row $(a_1,\dots,a_n)$ form the conjunction $\gamma$ of the literals $p_i$ (if $a_i=T$) or $\neg p_i$ (if $a_i=F$). Then $\gamma$ is true in exactly that row, and the disjunction of these $\gamma$'s is true exactly in the true rows. Dually, each false row gives a clause false only there, and the conjunction of those clauses is the CNF. Correctness is checked by evaluating both formulas (logic-2.4). For parity, any term with fewer than $n$ literals is true on two rows of different parity, so every term must name all $n$ letters, and $2^{n-1}$ true rows need $2^{n-1}$ terms.`,
      caption: String.raw`Click cells of the $G$ column to define any function, or choose a preset. The DNF (one term per true row) and the CNF (one clause per false row) appear in the readout. The DNF and CNF columns are computed by actually evaluating those formulas, and they match $G$ on every row. Right: sizes on a log scale, computed by running the converters. Distributing $\bigvee_i (x_i\land y_i)$ gives $2^n$ clauses, against the linear Tseitin encoding. Parity needs $2^{n-1}$ DNF terms. The gold dots are your function.`,
      deps: ['logic-2.4'],
      refs: ['Enderton §1.5'],
      tags: ['normal forms', 'boolean functions'],
      viz(v) {
        const nSel = v.select('letters', [2, 3, 4], 3, { onChange: () => setPreset(preset.value) });
        const preset = v.select('preset', [{ value: 'maj', label: 'majority' }, { value: 'par', label: 'parity' }, { value: 'imp', label: 'p → (q ∧ r)' }, { value: 'rnd', label: 'random' }], 'maj', { onChange: (k) => setPreset(k) });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1, title: 'click the G column' });
        const P = v.stage({ x: [1, 10], y: [1, 2000], ylog: true, axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'n', ylabel: 'size', title: 'normal-form size' });
        const TT = v.table(A, { rows: 8, cols: 6, square: false, maxCell: 30, cellAspect: 1.6, size: 13, labelSize: 12.5 });
        let col = new Uint8Array(8), seed = 1;
        function setPreset(k) {
          const n = nSel.value, R = 1 << n; col = new Uint8Array(R);
          const r = (() => { let a = seed++ * 2654435761 >>> 0; return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296); })();
          for (let i = 0; i < R; i++) {
            const t = [...Array(n).keys()].filter((j) => rowVal(i, j, n)).length;
            col[i] = k === 'maj' ? +(2 * t > n || (2 * t === n && rowVal(i, 0, n))) : k === 'par' ? t % 2 : k === 'imp' ? +(!rowVal(i, 0, n) || (rowVal(i, 1, n) && (n < 3 || rowVal(i, 2, n)))) : +(r() < 0.5);
          }
        }
        setPreset('maj');
        A.onClick((x, y) => { const c = TT.hit(x, y); if (c && c.i >= 0 && c.j === nSel.value) { col[c.i] ^= 1; } });
        // blow-up data (computed once)
        const NS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const dist = NS.map((n) => { const f = parse(Array.from({ length: n }, (_, i) => `(x${i + 1} ∧ y${i + 1})`).join(' ∨ ')).ast; return distributeCNF(f).length; });
        const tse = NS.map((n) => { const f = parse(Array.from({ length: n }, (_, i) => `(x${i + 1} ∧ y${i + 1})`).join(' ∨ ')).ast; return tseitin(f).length; });
        const par = NS.map((n) => { let c = 0; for (let i = 0; i < 1 << n; i++) { let t = 0; for (let j = 0; j < n; j++) t += (i >> j) & 1; c += t & 1; } return c; });
        v.render(() => {
          const n = nSel.value, R = 1 << n, vars = LETTERS.slice(0, n);
          const { dnf, cnf } = canonical(col, vars);
          const D = dnfAst(dnf), C = cnfAst(cnf), dc = table(D, vars), cc = table(C, vars);
          TT.draw({
            rows: R, cols: n + 3,
            colLabels: [...vars.map((x) => `$${x}$`), '$G$', 'DNF', 'CNF'],
            value: (i, j) => (j < n ? rowVal(i, j, n) : j === n ? !!col[i] : j === n + 1 ? !!dc[i] : !!cc[i]),
            fill: (i, j) => (j === n ? [col[i] ? 'green' : 'red', 0.25] : j > n ? [(j === n + 1 ? dc[i] : cc[i]) === col[i] ? 'green' : 'red', 0.08] : ['faint', 0.1]),
            textColor: (i, j) => (j > n && (j === n + 1 ? dc[i] : cc[i]) !== col[i] ? 'red' : 'ink'),
            weight: (i, j) => (j === n ? 700 : 500),
            colLabelColor: (j) => (j === n ? 'accent' : 'ink'),
          });
          // plot
          P.path(NS.map((x) => [x, 2 ** x]), { color: 'faint', width: 1.2, dash: [4, 4] });
          P.text('2ⁿ', 10, 2 ** 10, { dx: -4, dy: -9, align: 'right', size: 11, color: 'muted' });
          P.path(NS.map((x, i) => [x, dist[i]]), { color: 'red', width: 2.2 }); P.dots(NS.map((x, i) => [x, dist[i]]), { color: 'red', r: 3 });
          P.path(NS.map((x, i) => [x, tse[i]]), { color: 'accent', width: 2.2 }); P.dots(NS.map((x, i) => [x, tse[i]]), { color: 'accent', r: 3 });
          P.path(NS.map((x, i) => [x, par[i]]), { color: 'purple', width: 2.2 }); P.dots(NS.map((x, i) => [x, par[i]]), { color: 'purple', r: 3 });
          P.dot(n, Math.max(1, cnf.length), { r: 8, color: 'gold', hollow: true, width: 2.4 }); P.dot(n, Math.max(1, dnf.length), { r: 4.5, color: 'gold' });
        });
        v.legend([['red', 'CNF of ⋁(xᵢ∧yᵢ) by distribution'], ['accent', 'Tseitin CNF of the same'], ['purple', 'DNF terms of parity'], ['gold', 'your G: DNF terms (●), CNF clauses (○)', { dot: true }]]);
        v.readout(() => {
          const n = nSel.value, vars = LETTERS.slice(0, n), { dnf, cnf } = canonical(col, vars);
          const D = dnfAst(dnf), C = cnfAst(cnf), ok = bits(table(D, vars)) === bits(col) && bits(table(C, vars)) === bits(col);
          const term = (t) => t.map((l) => (l.neg ? '\\neg ' : '') + l.v).join('');
          const cl = (t) => `(${t.map((l) => (l.neg ? '\\neg ' : '') + l.v).join('\\lor ')})`;
          const dTex = dnf.length ? (dnf.length > 8 ? dnf.slice(0, 8).map(term).join(' \\lor ') + '\\lor\\cdots' : dnf.map(term).join(' \\lor ')) : '\\bot';
          const cTex = cnf.length ? (cnf.length > 6 ? cnf.slice(0, 6).map(cl).join('') + '\\cdots' : cnf.map(cl).join('')) : '\\top';
          return `DNF (${dnf.length} terms, juxtaposition = $\\land$): $${dTex}$\nCNF (${cnf.length} clauses): $${cTex}$\nBoth re-evaluated on all ${1 << n} rows: ${ok ? '**match G** ✓' : '**mismatch**'}. Terms + clauses = $${dnf.length}+${cnf.length} = 2^{${n}}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Functional completeness; NAND suffices',
      statement: String.raw`The set $\{\neg,\land,\lor\}$ is **functionally complete**: every Boolean function of $n\ge1$ arguments is realised by a formula using only these connectives. So are $\{\neg,\land\}$, $\{\neg,\lor\}$ and $\{\neg,\to\}$, and so is the single connective **NAND** $p\uparrow q := \neg(p\land q)$ (Sheffer stroke), and likewise NOR $p\downarrow q := \neg(p\lor q)$. By contrast, $\{\land,\lor\}$ is not complete: it realises only monotone functions.`,
      idea: String.raw`DNF already uses only $\neg,\land,\lor$ (logic-2.5). De Morgan removes $\lor$ via $\alpha\lor\beta \equiv \neg(\neg\alpha\land\neg\beta)$. NAND then gives everything: $\neg\alpha \equiv \alpha\uparrow\alpha$ and $\alpha\land\beta \equiv (\alpha\uparrow\beta)\uparrow(\alpha\uparrow\beta)$. Translating a DNF gate by gate is easy but wasteful. The smallest NAND circuit for XOR has 4 gates, while the translated DNF has many more. A circuit of $\land$ and $\lor$ gates is monotone, by induction on the circuit, so it can never compute $\neg p$.`,
      caption: String.raw`Type a target formula (up to 3 letters) and flip the inputs. Each gate is filled green when it outputs 1, and the wires carrying 1 are green. Left: the circuit obtained by translating the canonical DNF gate by gate (shared sub-circuits merged). Right: a smallest circuit, found by exhaustive search over all circuits with up to 5–6 gates. Its truth table is computed and compared with the target. Switch the basis to NOR, or **break it** with $\{\land,\lor\}$: then non-monotone targets become impossible.`,
      deps: ['logic-2.5'],
      refs: ['Enderton §1.5'],
      credit: 'Charles S. Peirce (c. 1880, unpublished); Henry M. Sheffer, 1913',
      tags: ['functional completeness', 'circuits'],
      viz(v) {
        const F = formulaField(v, 'target', 'p ⊕ q', { width: 170, maxLetters: 3 });
        const basis = v.select('basis', [{ value: 'nand', label: 'NAND ↑' }, { value: 'nor', label: 'NOR ↓' }, { value: 'mono', label: '∧, ∨ (break it)' }], 'nand');
        const ins = ['p', 'q', 'r'].map((x, j) => v.toggle(x, j === 0));
        const A = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 330, weight: 1.15, title: 'normal-form construction' });
        const B = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 330, weight: 0.85, title: 'smallest circuit (exhaustive search)' });
        const GA = v.graph(A, { nodes: [], edges: [], directed: true, shape: 'box', layout: 'none', draggable: false, fontSize: 12.5 });
        const GB = v.graph(B, { nodes: [], edges: [], directed: true, shape: 'box', layout: 'none', draggable: false, fontSize: 12.5 });
        let key = null, cA = null, cB = null, info = {};
        const toGraph = (G, c, vars) => {
          const n = vars.length, nodes = vars.map((x, j) => ({ id: j, label: x, layer: 0 })), edges = [];
          c.gates.forEach((g, k) => { nodes.push({ id: n + k, label: g.op === '↑' ? 'NAND' : g.op === '↓' ? 'NOR' : g.op === '∧' ? 'AND' : 'OR' }); edges.push([g.a, n + k]); if (g.b !== g.a) edges.push([g.b, n + k]); });
          nodes.push({ id: 'out', label: 'out' }); edges.push([c.out, 'out']);
          G.set({ nodes, edges }); G.layout('layered', { rankdir: 'right', gap: 40 });
        };
        const build = () => {
          const vars = lettersOf(F.ast), n = Math.max(1, vars.length), V = vars.length ? vars : ['p'];
          const col = table(F.ast, V), M = projMasks(n);
          let target = 0; col.forEach((b, i) => { if (b) target |= 1 << i; });
          const raw = constructCircuit(col, n, basis.value);
          cA = raw.impossible ? null : pruneCircuit(raw, n);
          const maxG = n <= 2 ? 6 : 5;
          cB = smallestCircuit(target, n, basis.value, maxG);
          info = { vars: V, n, col, target, maxG, M };
          if (cA) toGraph(GA, cA, V); else GA.set({ nodes: [], edges: [] });
          if (cB) toGraph(GB, cB, V); else GB.set({ nodes: [], edges: [] });
        };
        const tableOf = (c) => { const { n } = info, out = new Uint8Array(1 << n); for (let i = 0; i < 1 << n; i++) { const val = runCircuit(c, n, [...Array(n).keys()].map((j) => rowVal(i, j, n))); out[i] = val[c.out] ? 1 : 0; } return out; };
        const draw = (G, s, c) => {
          if (!c) return;
          const { n } = info, val = runCircuit(c, n, ins.slice(0, n).map((t) => t.value));
          const on = (id) => (id === 'out' ? val[c.out] : val[id]);
          G.draw({
            nodeFill: (id) => (on(id) ? 'green' : null),
            nodeColor: (id) => (id === 'out' ? 'accent' : typeof id === 'number' && id < n ? 'ink' : 'muted'),
            edgeColor: (e) => (on(e.from) ? 'green' : 'faint'),
            edgeWidth: (e) => (on(e.from) ? 2.6 : 1.5),
          });
        };
        v.render(() => {
          const k = JSON.stringify([toStr(F.ast), basis.value]);
          if (k !== key) { key = k; build(); }
          ins.forEach((t, j) => { t.el.hidden = j >= info.n; });
          draw(GA, A, cA); draw(GB, B, cB);
          if (!cA) A.text(basis.value === 'mono' ? 'impossible: the target is not monotone' : 'impossible', 5, 3, { align: 'center', size: 14, color: 'red', weight: 600 });
          if (!cB) B.text(cA ? `no circuit with ≤ ${info.maxG} gates` : 'impossible', 5, 3, { align: 'center', size: 14, color: cA ? 'orange' : 'red', weight: 600 });
          if (F.error) A.corner(F.error, 'bl', { color: 'red', size: 11 });
        });
        v.readout(() => {
          const t = bits(info.col);
          const sA = cA ? `${cA.gates.length} gates, table ${bits(tableOf(cA))} ${bits(tableOf(cA)) === t ? '✓' : '✗'}` : basis.value === 'mono' ? '**none**: a circuit of ∧, ∨ gates is monotone' : 'none';
          const sB = cB ? `**${cB.gates.length}** gates, table ${bits(tableOf(cB))} ${bits(tableOf(cB)) === t ? '✓' : '✗'}; no smaller circuit exists` : cA ? `more than ${info.maxG} gates needed` : 'none exists';
          return `Target $${toTex(F.ast)}$, truth table (rows TT…T first) **${t}**. Construction: ${sA}. Smallest: ${sB}.`;
        });
      },
    },
  ],
};
