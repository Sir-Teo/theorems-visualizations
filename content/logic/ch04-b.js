// Logic & Foundations — Chapter 4: Proofs, soundness and completeness (items 4.7–4.12)
import {
  parseFO, toStr, toTex, preorder, isQ, freeVars, qrank, holds, langOf, structures, range, foField, graphStruct, tableStruct, structText,
  drawStruct, dpll, skolemize, herbrandStage, nnfFO, neg, imp, prenexSteps, degreeOne, godelInstances, godelSat, subNum, mk, P1, circlePos,
} from './ch04.shared.js';

// ---------- helpers ----------
const SIGM = { rels: { P: 1, Q: 1, R: 2 }, funcs: {}, consts: [], name: 'the language with P, Q, R' };
const noEq = (ast) => (preorder(ast).some((n) => n.op === 'rel' && (n.r === '=' || n.r === '≠')) ? 'equality is not part of this fragment: write the sentence without = or ≠' : preorder(ast).some((n) => n.t === 'fn') ? 'function symbols are not allowed here' : null);
const clip = (s, k) => (s.length > k ? `${s.slice(0, k - 1)}…` : s);
const chip = (S, x, y, w, h, label, { fill = null, color = 'ink', size = 10.5, ring = null } = {}) => {
  S.rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2, { fill: fill || 'faint', fillAlpha: fill ? 0.3 : 0.1, color: ring || fill || 'faint', width: ring ? 2 : 1.2, radius: 4 });
  S.text(label, x, y, { align: 'center', baseline: 'middle', size, color });
};
/** Does a ground NNF/boolean formula hold under the atom assignment `val` (Map key → bool, default true)? */
function evalGround(g, val) {
  switch (g.op) {
    case 'rel': { const k = toStr(g); return val.has(k) ? val.get(k) : true; }
    case 'not': return !evalGround(g.a, val);
    case 'and': return evalGround(g.a, val) && evalGround(g.b, val);
    case 'or': return evalGround(g.a, val) || evalGround(g.b, val);
    case 'imp': return !evalGround(g.a, val) || evalGround(g.b, val);
    case 'iff': return evalGround(g.a, val) === evalGround(g.b, val);
    case 'const': return g.val;
    default: return true;
  }
}

// ---------- 4.7: three families of sentences ----------
const FAM = {
  dist: { label: 'the constants are pairwise distinct', sat: true },
  block: { label: 'a chain P(c₀), P(cᵢ)→P(cᵢ₊₁), and a blocker ¬P(cₘ)', sat: false },
  free: { label: 'the same chain without the blocker', sat: true },
};
function famSentence(fam, k, m) { // k = 0-based position in the list
  if (fam === 'dist') return { label: `σ${subNum(k + 1)}`, text: `c${subNum(k + 1)} differs from c${subNum(0)},…,c${subNum(k)}`, cl: null };
  if (fam === 'block') {
    if (k === 0) return { label: `¬P(c${subNum(m)})`, text: `¬P(c${subNum(m)})`, cl: [-(m + 1)] };
    if (k === 1) return { label: 'P(c₀)', text: 'P(c₀)', cl: [1] };
    const i = k - 2; return { label: `P${subNum(i)}→P${subNum(i + 1)}`, text: `P(c${subNum(i)}) → P(c${subNum(i + 1)})`, cl: [-(i + 1), i + 2] };
  }
  if (k === 0) return { label: 'P(c₀)', text: 'P(c₀)', cl: [1] };
  const i = k - 1; return { label: `P${subNum(i)}→P${subNum(i + 1)}`, text: `P(c${subNum(i)}) → P(c${subNum(i + 1)})`, cl: [-(i + 1), i + 2] };
}

// ---------- 4.9: finding finite models ----------
const SIG9 = { rels: { R: 2, P: 1 }, funcs: { f: 1 }, consts: [], name: 'the language with R, P and f' };
const RSTRUCT = {
  empty: () => 0, full: () => 1, lt: (a, b) => (a < b ? 1 : 0), le: (a, b) => (a <= b ? 1 : 0), cycle: (a, b, n) => (b === (a + 1) % n ? 1 : 0), id: (a, b) => (a === b ? 1 : 0),
};
const FSTRUCT = { shift: (a, n) => (a + 1) % n, id: (a) => a, zero: () => 0, pred: (a) => Math.max(0, a - 1), up: (a, n) => Math.min(n - 1, a + 1) };
function findModel(phi, n, seed = 5) {
  const lang = langOf(phi), hasR = lang.rels.has('R'), hasP = lang.rels.has('P'), hasF = lang.funcs.has('f');
  const mkM = (rf, ff, pf, rnd) => {
    const tables = {};
    if (hasR) { const b = new Uint8Array(n * n); for (let a = 0; a < n; a++) for (let c = 0; c < n; c++) b[a + n * c] = rnd ? (rnd() < 0.5 ? 1 : 0) : rf(a, c, n); tables.R = { arity: 2, bits: b }; }
    if (hasP) { const b = new Uint8Array(n); for (let a = 0; a < n; a++) b[a] = rnd ? (rnd() < 0.5 ? 1 : 0) : pf; tables.P = { arity: 1, bits: b }; }
    const funcs = {};
    if (hasF) { const t = new Int32Array(n); for (let a = 0; a < n; a++) t[a] = rnd ? Math.floor(rnd() * n) : ff(a, n); funcs.f = { arity: 1, tab: t }; }
    return tableStruct(n, tables, funcs, {});
  };
  for (const rk of hasR ? Object.keys(RSTRUCT) : [null]) for (const fk of hasF ? Object.keys(FSTRUCT) : [null]) for (const pf of hasP ? [0, 1] : [0]) {
    const M = mkM(RSTRUCT[rk], FSTRUCT[fk], pf, null);
    if (holds(phi, M)) return { M, how: `${rk ? `R = ${rk}` : ''}${rk && fk ? ', ' : ''}${fk ? `f = ${fk}` : ''}` || 'any structure', lang };
  }
  let s = seed; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let t = 0; t < 400; t++) { const M = mkM(null, null, null, rnd); if (holds(phi, M)) return { M, how: 'random search', lang }; }
  return null;
}
const PRESET9 = [
  { id: 'inj', text: '∀x ∀y (f(x) = f(y) → x = y) → ∀y ∃x f(x) = y', note: 'an injective map is onto' },
  { id: 'max', text: '(∀x ¬R(x,x) ∧ ∀x ∀y ∀z (R(x,y) ∧ R(y,z) → R(x,z)) ∧ ∀x ∀y (R(x,y) ∨ R(y,x) ∨ x = y)) → ∃x ∀y ¬R(x,y)', note: 'a strict linear order has a last element' },
  { id: 'one', text: '∀x ∀y x = y', note: 'at most one element' },
];

// ---------- 4.10: the cycle comparison ----------
const PRESET10 = [
  { id: 'deg', text: '∀x ∃y ∃z (¬ y = z ∧ E(x,y) ∧ E(x,z))', label: 'every vertex has two neighbours' },
  { id: 'two', text: '∃x ∃y (¬ x = y ∧ ∃z (E(x,z) ∧ E(z,y)))', label: 'two vertices have a common neighbour' },
  { id: 'diam3', text: '∀x ∀y (x = y ∨ E(x,y) ∨ ∃z (E(x,z) ∧ E(z,y)) ∨ ∃z ∃w (E(x,z) ∧ E(z,w) ∧ E(w,y)))', label: 'any two vertices are within distance 3' },
  { id: 'tri', text: '∃x ∃y ∃z (E(x,y) ∧ E(y,z) ∧ E(z,x))', label: 'there is a triangle' },
  { id: 'dist4', text: '∃x ∃y (¬ x = y ∧ ¬ E(x,y) ∧ ∀z (E(x,z) → ¬ E(z,y)) ∧ ∀z ∀w (E(x,z) ∧ E(z,w) → ¬ E(w,y)))', label: 'some two vertices are at distance ≥ 4' },
];

export default {
  collection: 'logic',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'Compactness theorem',
      statement: String.raw`A set $\Sigma$ of first-order sentences has a model if and only if every finite subset of $\Sigma$ has a model. Equivalently: if $\Sigma\models\varphi$, then some finite $\Sigma_0\subseteq\Sigma$ already satisfies $\Sigma_0\models\varphi$.`,
      idea: String.raw`If $\Sigma$ has no model it is inconsistent by the completeness theorem (logic-4.6). A deduction of a contradiction is a finite object and cites only finitely many members $\Sigma_0$ of $\Sigma$, so $\Sigma_0$ is inconsistent, and by soundness (logic-4.4) it has no model either. This is the whole proof: completeness turns the semantic property “no model anywhere” into a finite syntactic certificate. Note that the proof does not construct the model of $\Sigma$ from the finite ones; it comes from the Henkin construction of logic-4.5.`,
      caption: String.raw`Choose a family of sentences and a stage $N$: the first $N$ sentences are lit, and a finite model is shown for them (found by a SAT solver for the chain families). In the two satisfiable families every stage has a model, and the right panel shows the compactness argument: no contradiction can be derived, so a model of the whole infinite set exists, even though no finite stage shows it. In the blocked chain the first failing stage is exactly where the minimal inconsistent subset (red chips) has been collected; drag the blocker’s position $m$ to move it.`,
      credit: 'Gödel, 1930 (as a corollary of completeness); for arbitrary cardinalities, Maltsev, 1936',
      deps: ['logic-4.6'],
      refs: ['Enderton §2.5'],
      tags: ['compactness'],
      viz(v) {
        const fam = v.select('family', Object.entries(FAM).map(([k, f]) => ({ value: k, label: f.label })), 'dist', { onChange: () => { mS.el.hidden = fam.value !== 'block'; v.invalidate(); } });
        const NS = v.slider('stage $N$', 1, 14, 4, { int: true });
        const mS = v.slider('blocker position $m$', 2, 9, 5, { int: true });
        mS.el.hidden = true;
        const A = v.stage({ x: [0, 100], y: [0, 34], axes: false, height: 105, full: true });
        const B = v.stage({ x: [-0.7, 14.7], y: [-2.2, 2.4], axes: false, height: 200, weight: 1.3, minWidth: 330 });
        const C = v.stage({ x: [0, 100], y: [0, 100], axes: false, height: 200, weight: 1, minWidth: 260 });
        let info = null;
        const analyse = () => {
          const f = fam.value, m = mS.value, N = NS.value, K = 16;
          const sents = range(K).map((k) => famSentence(f, k, m));
          let sat, core = null, model = null;
          if (f === 'dist') sat = true;
          else {
            const cls = sents.slice(0, N).map((s) => s.cl), nv = 16;
            const r = dpll(cls, nv); sat = r.sat; model = r.model;
            if (!sat) { // minimal inconsistent subset by deletion
              let keep = range(N);
              for (const i of [...keep]) { const t = keep.filter((j) => j !== i); if (!dpll(t.map((j) => sents[j].cl), nv).sat) keep = t; }
              core = keep;
            }
          }
          let first = null;
          if (f === 'block') first = m + 2; // stage at which all of ¬P(cₘ), P(c₀) and the first m implications are present
          info = { f, m, N, sents, sat, core, model, first };
        };
        v.render(() => {
          analyse();
          const { f, N, sents, sat, core, model } = info;
          const w = 6.1, x0 = 4;
          sents.forEach((s, k) => {
            const lit = k < N, inCore = core && core.includes(k);
            chip(A, x0 + k * w, 19, w - 0.5, 14, s.label, { fill: inCore ? 'red' : lit ? (sat ? 'green' : 'orange') : null, color: lit ? 'ink' : 'faint', size: 8.6 });
          });
          A.text('σ₁, σ₂, … the sentences of Σ in order; the first N are in use', 1, 33, { align: 'left', baseline: 'top', size: 11, color: 'muted', weight: 700 });
          A.text('…', 99, 19, { align: 'right', baseline: 'middle', size: 16, color: 'muted' });
          // model panel
          if (sat) {
            const K = f === 'dist' ? N + 1 : Math.min(N + 1, 15);
            for (let i = 0; i < Math.min(K, 15); i++) {
              const on = f === 'dist' ? false : model ? model[i + 1] : true;
              B.dot(i, 0, { r: 12, color: on ? 'accent' : 'ink', fill: on ? 'accent' : null, hollow: !on, width: 2 });
              B.text(`c${subNum(i)}`, i, 0, { align: 'center', baseline: 'top', dy: 18, size: 11.5, math: true, color: 'ink' });
              if (f !== 'dist') B.text(on ? 'P' : '¬P', i, 0, { align: 'center', baseline: 'bottom', dy: -17, size: 10.5, color: on ? 'accent' : 'muted', weight: 700 });
            }
            if (f === 'dist') B.text(`stage ${N}: ${N + 1} different elements (σₙ: cₙ differs from c₀,…,cₙ₋₁)`, 7, 1.7, { align: 'center', size: 11.5, color: 'muted' });
            else B.text(`a model of the first ${N} sentences (found by the SAT solver)`, 7, 1.7, { align: 'center', size: 11.5, color: 'muted' });
          } else {
            B.text('no model', 7, 0.5, { align: 'center', size: 20, weight: 700, color: 'red' });
            B.text('these sentences contradict each other: a derivation of ⊥ cites exactly the red ones', 7, -0.7, { align: 'center', size: 12, color: 'ink' });
          }
          // argument boxes
          const first = info.first, stagesOk = sat;
          const boxes = [
            ['every finite subset has a model', stagesOk ? (f === 'block' ? 'ok' : 'ok') : 'no', stagesOk ? `checked up to N = ${N}` : `fails at stage ${first}`],
            ['no deduction of ⊥ from Σ', f === 'block' && N >= first ? 'no' : 'ok', 'a deduction is finite and cites finitely many σᵢ'],
            ['Σ has a model', f === 'block' ? 'no' : 'ok', f === 'block' ? 'it is inconsistent' : 'by completeness: Henkin’s term model'],
          ];
          boxes.forEach(([t, st, sub], k) => {
            const y = 82 - k * 32, col = st === 'ok' ? 'green' : 'red';
            C.rect(2, y - 12, 98, y + 12, { fill: col, fillAlpha: 0.12, color: col, width: 1.6, radius: 6 });
            C.text(t, 6, y + 4, { align: 'left', baseline: 'middle', size: 12.5, weight: 700, color: 'ink' });
            C.text(sub, 6, y - 6, { align: 'left', baseline: 'middle', size: 10.5, color: 'muted' });
            if (k < 2) C.arrow(50, y - 12, 50, y - 20, { color: 'muted', width: 1.5, head: 6 });
          });
        });
        v.readout(() => {
          const { f, N, sat, core, first, m } = info;
          if (f === 'dist') return `$\\Sigma = \\{\\sigma_n\\}$, where $\\sigma_n$ says $c_n\\ne c_0,\\dots,c_{n-1}$. Stage ${N} has a model with ${N + 1} elements, and every stage does, so $\\Sigma$ has a model by compactness: any such model is infinite (a model of all of $\\Sigma$ has at least as many elements as there are constants, namely infinitely many).`;
          if (f === 'free') return `Stage ${N}: satisfiable (found by DPLL). Every stage is satisfiable, and so is $\\Sigma$: make $P$ true everywhere. No contradiction can be derived from the chain.`;
          if (!sat) return `Stage ${N} contains the minimal inconsistent subset $\\{\\neg P(c_{${m}}), P(c_0), P(c_0)\\to P(c_1),\\dots,P(c_{${m - 1}})\\to P(c_{${m}})\\}$ of ${core.length} sentences (found by deleting sentences while staying unsatisfiable). Every smaller stage (up to ${first - 1}) has a model, and deleting any of these ${core.length} sentences makes the rest satisfiable: this finite set *is* the certificate that compactness promises for the infinite inconsistent set.`;
          return `Stage ${N} is satisfiable; the whole set is not, and the first failure is at stage ${first} (the minimal inconsistent subset has $m+2 = ${first}$ sentences). Move the stage slider to ${first} to see it.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'The validities are effectively enumerable',
      statement: String.raw`There is an algorithm that prints, one after another, exactly the logically valid sentences of a given (effectively presented) first-order language: every valid sentence is eventually printed and nothing else is. For an invalid sentence the algorithm just keeps running: validity is **semi-decidable**. (First-order validity in general is not decidable; decidable restricted languages exist.)`,
      idea: String.raw`By completeness (logic-4.6) a sentence is valid iff it has a deduction, and soundness (logic-4.4) makes the converse. Deductions are finite strings that can be checked mechanically (logic-4.1), so list all strings in order of length, test each, and print the conclusion of those that are deductions. A practical machine does the same thing through Herbrand's theorem: negate the sentence, replace $\exists$ by Skolem functions, and instantiate the universal quantifiers with ever larger sets of terms; the sentence is valid iff, at some stage, the resulting propositional clauses are unsatisfiable. The bounded demonstration below runs stages of that search for several sentences at once (dovetailing) so that a sentence that never closes cannot block the others.`,
      caption: String.raw`The machine is working on six sentences, the first of which you can edit (equality-free sentences in $P,Q,R$). Drag **time $T$**: units of work are handed out in turn to the sentences, each unit computing the next Herbrand level of the negation. A cell is grey while the instances so far are still satisfiable and turns green (⊥) when they first become propositionally unsatisfiable: the sentence is *valid* and is printed in the list at the top. Invalid sentences stay grey for ever. The last sentence has no finite countermodel at all, only infinite ones, which is why no finite search can ever tell that it is invalid.`,
      scope: String.raw`Herbrand levels are computed up to level5 with at most400 terms,2500 ground instances and4000000 SAT-search steps. Exceeding a resource limit is shown as capped and is inconclusive. The correctness of "unsatisfiable at some level ⇔ valid" is Herbrand's theorem for equality-free sentences.`,
      credit: 'First-order logic',
      deps: ['logic-4.6'],
      refs: ['Buss, On Herbrand’s Theorem, §2, Theorems1–2', 'Enderton §2.5', 'Open Logic Project, §§22.7, 23.9, 32.8; Weiss–D’Mello, Fundamentals of Model Theory, chs.2–3'],
      tags: ['decidability', 'proof search'],
      viz(v) {
        const PRE = [
          { text: '∃x ∀y (P(x) → P(y))', tag: 'valid (a drinker-type sentence)' },
          { text: '∀x (P(x) → Q(x)) → (∀x P(x) → ∀x Q(x))', tag: 'valid' },
          { text: '∃y ∀x R(x,y) → ∀x ∃y R(x,y)', tag: 'valid' },
          { text: '∀x ∃y R(x,y) → ∃y ∀x R(x,y)', tag: 'invalid: finite countermodel' },
          { text: '(∀x ∃y R(x,y) ∧ ∀x ¬R(x,x) ∧ ∀x ∀y ∀z (R(x,y) ∧ R(y,z) → R(x,z))) → ∃x (P(x) ∧ ¬P(x))', tag: 'invalid, but only infinite countermodels' },
        ];
        const fld = foField(v, 'sentence 1', '∀x P(x) → ∃x P(x)', { sig: SIGM, width: 360, check: (a) => (freeVars(a).length ? 'it must be a sentence (no free variables)' : noEq(a)), onChange: () => { memo.clear(); v.invalidate(); } });
        const T = v.slider('time $T$ (units of work)', 0, 40, 14, { int: true });
        const A = v.stage({ x: [0, 100], y: [0, 100], axes: false, height: 330, full: true });
        const memo = new Map();
        const LEV = 6;
        const levels = (ast) => {
          const key = toStr(ast); let r = memo.get(key); if (r) return r;
          const sk = skolemize(neg(ast)); r = [];
          for (let l = 0; l < LEV; l++) { const h = herbrandStage(sk, l); r.push(h); if (h.sat === false || h.capped) break; }
          memo.set(key, r); return r;
        };
        const queue = () => [{ ast: fld.ok ? fld.ast : P1('∀x P(x) → ∃x P(x)', SIGM), tag: 'yours' }, ...PRE.map((p) => ({ ast: P1(p.text, SIGM), tag: p.tag, text: p.text }))];
        const status = (Q, t) => {
          const k = Q.length;
          return Q.map((q, i) => {
            const lv = levels(q.ast), units = t > i ? Math.floor((t - i - 1) / k) + 1 : 0;
            const closeAt = lv.findIndex((h) => h.sat === false);
            const done = closeAt >= 0 && units > closeAt;
            const printedUnit = done ? closeAt * k + i : null; // unit index at which level `closeAt` was computed
            return { lv, units, closeAt, done, printedAt: done ? printedUnit + 1 : null };
          });
        };
        v.render(() => {
          const Q = queue(), St = status(Q, T.value);
          const printed = Q.map((q, i) => ({ q, i, s: St[i] })).filter((o) => o.s.done).sort((a, b) => a.s.printedAt - b.s.printedAt);
          A.text('printed so far (valid sentences, in the order found):', 1, 99, { align: 'left', baseline: 'top', size: 11.5, color: 'muted', weight: 700 });
          const line = printed.map((o) => `#${o.i + 1}@${o.s.printedAt}`).join('   ') || '—';
          A.text(line, 1, 92, { align: 'left', baseline: 'top', size: 13, color: 'green', weight: 700 });
          Q.forEach((q, i) => {
            const y = 78 - i * 12.2, s = St[i];
            A.text(`${i + 1}`, 1.5, y, { align: 'left', baseline: 'middle', size: 12, color: 'muted', weight: 700 });
            A.text(clip(toStr(q.ast), 62), 5, y + 2.3, { align: 'left', baseline: 'middle', size: 11.5, color: 'ink' });
            A.text(q.tag, 5, y - 3.4, { align: 'left', baseline: 'middle', size: 9.8, color: 'muted' });
            for (let l = 0; l < LEV; l++) {
              const x = 72 + l * 4.6, h = s.lv[l];
              const computed = l < s.units && h, closes = computed && h.sat === false, cap = computed && h.capped;
              const col = closes ? 'green' : cap ? 'orange' : computed ? 'muted' : 'faint';
              A.rect(x - 2, y - 4, x + 2, y + 4, { fill: col, fillAlpha: closes ? 0.55 : computed ? 0.3 : 0.1, color: col, width: 1.2, radius: 2 });
              if (computed) A.text(closes ? '⊥' : cap ? '…' : String(h.instances), x, y, { align: 'center', baseline: 'middle', size: 8.4, color: 'ink' });
            }
            A.text(s.done ? 'valid ✓' : s.units ? 'running…' : 'waiting', 99.5, y, { align: 'right', baseline: 'middle', size: 11, color: s.done ? 'green' : 'muted', weight: 700 });
          });
          A.text('Herbrand level of ¬σ:', 70, 6, { align: 'right', baseline: 'middle', size: 9.8, color: 'muted' });
          for (let l = 0; l < LEV; l++) A.text(String(l), 72 + l * 4.6, 6, { align: 'center', baseline: 'middle', size: 9.8, color: 'muted' });
        });
        v.readout(() => {
          const Q = queue(), St = status(Q, T.value), my = St[0], q0 = Q[0];
          const found = St.filter((s) => s.done).length;
          let mine;
          if (!fld.ok && fld.src.trim()) mine = `Sentence 1 cannot be read: ${fld.error}.`;
          else if (my.closeAt >= 0) mine = `Sentence 1 is **valid**: the instances of its negation become propositionally unsatisfiable at Herbrand level ${my.closeAt} (${levels(q0.ast)[my.closeAt].instances} ground instances), which the machine reaches at unit ${my.closeAt * Q.length + 1}${my.done ? ' and prints' : ' (move $T$ further)'}.`;
          else {
            let cm = null;
            for (const { n, M } of structures(langOf(q0.ast), { minN: 1, maxN: 3, cap: 1500 })) if (!holds(q0.ast, M)) { cm = n; break; }
            mine = `Sentence 1: no Herbrand level up to ${LEV - 1} closes${levels(q0.ast).some((h) => h.capped) ? ' (the search was capped)' : ''}. ${cm ? `It really is invalid: a structure with ${cm} elements falsifies it, but that is a separate search, not something the printing machine can ever conclude.` : 'No countermodel with at most 3 elements was found either; the machine would simply keep going.'}`;
          }
          return `${found} of ${Q.length} sentences printed at $T=${T.value}$. ${mine}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Proposition',
      name: 'Finiteness is not first-order expressible',
      statement: String.raw`There is no first-order sentence $\varphi$ (and no set of sentences) whose models are exactly the finite structures. More precisely, if a set $\Sigma$ of sentences has arbitrarily large finite models, then it has an infinite model. Writing $\lambda_n$ for “there are at least $n$ elements”, $\exists x_1\cdots\exists x_n \bigwedge_{i<j}x_i\neq x_j$, the set $\Sigma\cup\{\lambda_n : n\ge 1\}$ is the one to which compactness is applied.`,
      idea: String.raw`Let $\Sigma$ have models of every finite size. A finite subset of $\Sigma\cup\{\lambda_n\}$ mentions only $\lambda_n$ for $n\le N$, and is satisfied by a model of $\Sigma$ with at least $N$ elements. By compactness (logic-4.7) the whole set has a model; it satisfies every $\lambda_n$, so it is infinite. A sentence $\varphi$ meant to say “finite” would hold in the finite models of every size, so it also holds in an infinite one, a contradiction.`,
      caption: String.raw`Pick a sentence that is meant to express “finite”, or type your own in the language of a binary relation $R$, a unary relation $P$ and a unary function $f$ (with =). The program searches for models of $\varphi$ of each size $1,\dots,8$ (structured candidates such as $R$ = “less than”, $f$ = “add 1 mod $n$”, then 400 random ones) and draws a model of $\Gamma_N=\{\varphi,\lambda_1,\dots,\lambda_N\}$ with exactly $N$ elements. If models of every size turn up, compactness gives an infinite one; the sentence “at most one element” shows what happens when they do not.`,
      scope: String.raw`The search is not exhaustive, so "no model found" is evidence, not proof; a found model is verified exactly. The infinite models promised by compactness are not constructed here.`,
      deps: ['logic-4.7'],
      refs: ['Enderton §2.6'],
      tags: ['compactness', 'expressiveness'],
      viz(v) {
        const pre = v.select('sentence', PRESET9.map((p) => ({ value: p.id, label: p.note })), 'inj', { onChange: (id) => fld.set(PRESET9.find((p) => p.id === id).text) });
        const fld = foField(v, 'or type a sentence', PRESET9[0].text, { sig: SIG9, width: 420, check: (a) => (freeVars(a).length ? 'it must be a sentence' : null), onChange: () => v.invalidate() });
        const NS = v.slider('stage $N$ (model size)', 1, 8, 5, { int: true });
        const A = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.6], equal: true, axes: false, height: 320, weight: 1, minWidth: 280 });
        const B = v.stage({ x: [0, 100], y: [0, 100], axes: false, height: 320, weight: 1, minWidth: 280 });
        const memo = new Map();
        const models = (ast) => { const k = toStr(ast); let r = memo.get(k); if (!r) { r = range(8).map((i) => findModel(ast, i + 1)); memo.set(k, r); } return r; };
        v.render(() => {
          if (!fld.ok) { A.text(fld.src.trim() ? 'cannot read the sentence' : 'type a sentence', 0, 0, { align: 'center', size: 13, color: 'red' }); return; }
          const R = models(fld.ast), N = NS.value, hit = R[N - 1];
          if (hit) {
            drawStruct(A, hit.M, hit.lang, { radius: N === 1 ? 0 : 1.0, r: N > 6 ? 12 : 15 });
            const fs = [...hit.lang.funcs.keys()];
            if (fs.length) A.corner(range(N).map((a) => `f(${a})=${hit.M.fn('f', [a])}`).join('  '), 'bl', { size: 10, color: 'muted' });
            A.corner(`a model of φ with ${N} elements (${hit.how})`, 'tl', { size: 11.5, color: 'green', weight: 700 });
          } else A.text(`no model of size ${N} found`, 0, 0, { align: 'center', size: 14, color: 'red', weight: 700 });
          B.text('sizes 1…8: does φ have a model?', 2, 97, { align: 'left', baseline: 'top', size: 12, color: 'muted', weight: 700 });
          R.forEach((h, i) => {
            const x = 6 + i * 11.5, ok = !!h;
            B.rect(x - 4.5, 62, x + 4.5, 82, { fill: ok ? 'green' : 'red', fillAlpha: ok ? 0.3 : 0.15, color: ok ? 'green' : 'red', width: i + 1 === N ? 3 : 1.2, radius: 3 });
            B.text(String(i + 1), x, 72, { align: 'center', baseline: 'middle', size: 13, weight: 700, color: 'ink' });
            B.text(ok ? '✓' : '✗', x, 55, { align: 'center', baseline: 'middle', size: 13, weight: 700, color: ok ? 'green' : 'red' });
          });
          // the chain Γ_N
          B.text('Γ_N = {φ, λ₁, …, λ_N}: the sentences in use are lit', 2, 40, { align: 'left', baseline: 'middle', size: 12.5, weight: 700, color: 'ink' });
          for (let k = 0; k <= 8; k++) {
            const x = 5.5 + k * 10.6, on = k <= N;
            B.rect(x - 4.6, 20, x + 4.6, 32, { fill: on ? (hit ? 'green' : 'red') : null, fillAlpha: 0.3, color: 'faint', width: 1, radius: 3 });
            B.text(k === 0 ? 'φ' : `λ${subNum(k)}`, x, 26, { align: 'center', baseline: 'middle', size: 11.5, color: on ? 'ink' : 'faint' });
          }
        });
        v.readout(() => {
          if (!fld.ok) return fld.src.trim() ? `Cannot read the sentence: ${fld.error}.` : 'Type a sentence.';
          const R = models(fld.ast), found = R.map((h, i) => (h ? i + 1 : null)).filter(Boolean), N = NS.value;
          const all = found.length === 8;
          const verdict = all ? 'models of every size from 1 to 8 turned up. By compactness $\\{\\varphi,\\lambda_1,\\lambda_2,\\dots\\}$ then has a model, which must be infinite — so $\\varphi$ does not mean “finite”.' : found.length ? `models were found only for sizes ${found.join(', ')}; ${Math.max(...found) < 8 ? 'beyond that the search found none, so this sentence does not force-fit the compactness argument (it may have only small models).' : 'there are gaps, so the search may have missed some.'}` : 'no model of any size 1–8 was found, so this sentence is (as far as the search shows) unsatisfiable or only has larger models.';
          return `$\\Gamma_{${N}}$ ${R[N - 1] ? 'has a model with exactly ' + N + ' elements, so it is satisfiable ✓' : 'has no model found with ' + N + ' elements'}. Over all sizes ${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Proposition',
      name: 'Connectedness is not first-order axiomatizable',
      statement: String.raw`There is no set $T$ of first-order sentences in the language of graphs ($E$ for adjacency) whose models are exactly the connected graphs. In fact no theory true in all connected graphs can exclude every disconnected graph: with two new constants $a,b$, the set $T\cup\{\delta_n : n\ge 1\}$, where $\delta_n$ says “no path of length at most $n$ joins $a$ and $b$”, is satisfiable.`,
      idea: String.raw`Suppose $T$ axiomatized connectedness. Every finite subset of $T\cup\{\delta_n\}$ uses only $\delta_n$ for $n\le N$, and is satisfied by a long path graph with $a,b$ at its two ends (connected, so a model of $T$, and with $a,b$ at distance larger than $N$). By compactness (logic-4.7) there is a model of all of it: a model of $T$ in which no finite path joins $a$ and $b$, i.e. a disconnected graph satisfying $T$, contradicting the choice of $T$. The second panel tests individual sentences on a connected cycle and two shorter cycles; these finite examples illustrate local tests, rather than establishing the compactness argument.`,
      caption: String.raw`Top: the path graph with endpoints $a,b$ satisfies $\delta_1,\dots,\delta_N$ at stage $N$ (drag $N$); no stage can capture connectedness. Bottom: choose a sentence of your own or an example and compare the connected graph $C_{2m}$ with the disconnected graph $C_m\sqcup C_m$ for $m=3,\dots,10$ (green dot: the sentence has the same truth value in both, red: it tells them apart). Small cycles can be told apart by short-range properties. The displayed checks concern only your chosen sentence and these finite sizes; no pair agrees on all first-order sentences.`,
      scope: String.raw`The cycle comparison is a finite experiment (exact evaluation for each $m$ shown); that agreement persists for all larger $m$ is the Ehrenfeucht–Fraïssé argument and is not proved here.`,
      deps: ['logic-4.7'],
      refs: ['Enderton §2.6', 'Open Logic Project, §§22.7, 23.9, 32.8; Weiss–D’Mello, Fundamentals of Model Theory, chs.2–3'],
      tags: ['compactness', 'graphs'],
      viz(v) {
        const N = v.slider('stage $N$', 1, 10, 4, { int: true });
        const pre = v.select('sentence', PRESET10.map((p) => ({ value: p.id, label: p.label })), 'diam3', { onChange: (id) => fld.set(PRESET10.find((p) => p.id === id).text) });
        const fld = foField(v, 'or type a sentence in E', PRESET10[2].text, { sig: { rels: { E: 2 }, funcs: {}, consts: [], name: 'graphs' }, width: 420, check: (a) => (freeVars(a).length ? 'it must be a sentence' : null), onChange: () => v.invalidate() });
        const mS = v.slider('cycle half-length $m$', 3, 10, 6, { int: true });
        const A = v.stage({ x: [-0.8, 12.8], y: [-1.5, 1.7], axes: false, height: 150, full: true });
        const B = v.stage({ x: [-3.6, 3.6], y: [-1.7, 1.7], equal: true, axes: false, height: 250, weight: 1.4, minWidth: 340 });
        const C = v.stage({ x: [0, 100], y: [0, 100], axes: false, height: 250, weight: 0.9, minWidth: 260 });
        const cyc = (parts) => { const n = parts.reduce((s, k) => s + k, 0), adj = range(n).map(() => new Array(n).fill(0)); let o = 0; for (const k of parts) { for (let i = 0; i < k; i++) { const a = o + i, b = o + (i + 1) % k; adj[a][b] = adj[b][a] = 1; } o += k; } return graphStruct(n, adj); };
        const cache = new Map();
        const verdict = (ast, m) => { const key = `${toStr(ast)}|${m}`; let r = cache.get(key); if (!r) { const a = holds(ast, cyc([2 * m])), b = holds(ast, cyc([m, m])); r = { a, b }; cache.set(key, r); } return r; };
        v.render(() => {
          const n = N.value;
          for (let i = 0; i <= n + 1; i++) {
            if (i <= n) A.line(i, 0, i + 1, 0, { color: 'muted', width: 2 });
            A.dot(i, 0, { r: i === 0 || i === n + 1 ? 9 : 6, color: i === 0 ? 'orange' : i === n + 1 ? 'purple' : 'accent', fill: i === 0 ? 'orange' : i === n + 1 ? 'purple' : 'accent' });
          }
          A.text('a', 0, 0, { align: 'center', baseline: 'bottom', dy: -14, size: 14, math: true, color: 'orange', weight: 700 });
          A.text('b', n + 1, 0, { align: 'center', baseline: 'bottom', dy: -14, size: 14, math: true, color: 'purple', weight: 700 });
          A.text(`distance(a, b) = ${n + 1}: satisfies δ₁ … δ${subNum(n)}, but not δ${subNum(n + 1)}`, 6.2, -1.1, { align: 'center', size: 12.5, color: 'ink' });
          A.corner('P_{N+2}: a connected graph (a model of anything true in all connected graphs)'.replace('P_{N+2}', `path with ${n + 2} vertices`), 'tl', { size: 11, color: 'muted' });
          const m = mS.value;
          const ring = (cx, cy, k, R, rr) => {
            const pts = range(k).map((i) => circlePos(i, k, R, cx, cy, 90));
            pts.forEach((p, i) => { const q = pts[(i + 1) % k]; B.line(p[0], p[1], q[0], q[1], { color: 'muted', width: 1.6 }); });
            pts.forEach((p) => B.dot(p[0], p[1], { r: rr, color: 'accent', fill: 'accent' }));
          };
          ring(-1.9, 0, 2 * m, 1.35, m > 6 ? 3.6 : 5);
          ring(1.1, 0.0, m, 0.62, 3.6); ring(2.6, 0, m, 0.62, 3.6);
          B.text(`C${subNum(2 * m)} (connected)`, -1.9, -1.55, { align: 'center', size: 11.5, color: 'ink' });
          B.text(`C${subNum(m)} ⊔ C${subNum(m)}`, 1.85, -1.55, { align: 'center', size: 11.5, color: 'ink' });
          // verdict strip
          C.text('same truth value in C₂ₘ and Cₘ⊔Cₘ?', 2, 97, { align: 'left', baseline: 'top', size: 11.5, color: 'muted', weight: 700 });
          if (fld.ok) {
            const maxM = qrank(fld.ast) >= 4 ? 8 : 10;
            for (let k = 3; k <= 10; k++) {
              const x = 16 + (k - 3) * 11, big = k > maxM, r = big ? null : verdict(fld.ast, k), same = r && r.a === r.b;
              C.dot(x, 70, { r: k === m ? 10 : 7, color: big ? 'faint' : same ? 'green' : 'red', fill: big ? null : same ? 'green' : 'red', hollow: big, width: k === m ? 3 : 1.5 });
              C.text(String(k), x, 55, { align: 'center', size: 11, color: k === m ? 'ink' : 'muted' });
            }
            C.text('m →', 2, 55, { align: 'left', size: 11, color: 'muted' });
            const rr = verdict(fld.ast, m);
            C.text(`C₂ₘ: ${rr.a ? 'true' : 'false'}`, 6, 35, { align: 'left', size: 12.5, color: rr.a ? 'green' : 'red', weight: 700 });
            C.text(`Cₘ⊔Cₘ: ${rr.b ? 'true' : 'false'}`, 6, 22, { align: 'left', size: 12.5, color: rr.b ? 'green' : 'red', weight: 700 });
            C.text(`quantifier rank ${qrank(fld.ast)}`, 98, 6, { align: 'right', size: 11, color: 'muted' });
          }
        });
        v.readout(() => {
          if (!fld.ok) return fld.src.trim() ? `Cannot read the sentence: ${fld.error}.` : 'Type a sentence in $E$.';
          const maxM = qrank(fld.ast) >= 4 ? 8 : 10, ms = range(maxM - 2).map((i) => i + 3);
          const diff = ms.filter((k) => { const r = verdict(fld.ast, k); return r.a !== r.b; });
          const lastDiff = diff.length ? Math.max(...diff) : null;
          return `At stage $N=${N.value}$ the path satisfies $\\delta_1,\\dots,\\delta_{${N.value}}$; for every $N$ some finite connected graph does, so by compactness a model of all $\\delta_n$ exists which no first-order theory of connected graphs can rule out. The sentence $${toTex(fld.ast)}$ (rank ${qrank(fld.ast)}) separates $C_{2m}$ from $C_m\\sqcup C_m$ for ${diff.length ? `$m\\in\\{${diff.join(',')}\\}$ and not for the other $m$ up to ${maxM}` : `none of the $m$ from 3 to ${maxM}`}${lastDiff && lastDiff < maxM ? `, and it has stopped separating after $m=${lastDiff}$` : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Theorem',
      name: 'Second-order logic: categorical but not complete',
      statement: String.raw`In second-order logic with **full semantics** (set variables range over all subsets of the domain), the axioms for $0$ and the successor function $S$ — $S$ injective, $0$ not a successor, and the **induction axiom** $\forall X\,\big(X0\wedge\forall x\,(Xx\to XSx)\to\forall x\,Xx\big)$ — are *categorical*: any two models are isomorphic to $(\mathbb N,0,S)$ (Dedekind). But this logic is not compact, and consequently it has **no sound and complete proof system** with finite deductions: there is no effective calculus that proves exactly the second-order validities.`,
      idea: String.raw`Categoricity: in a model, the set $X$ of elements reachable from $0$ by $S$ contains $0$ and is closed under $S$, so by the induction axiom it is everything; hence the model is a copy of $\mathbb N$. Non-compactness: add a constant $c$ and the sentences $\sigma_k$: “$c\ne S^k0$”. Every finite subset is satisfied in $(\mathbb N,\ c:=N)$ for large $N$, but the whole set is not, since a model of the axioms is $\mathbb N$ and $c$ would be some $S^k0$. Now suppose a sound proof system with finite deductions were complete. Then the set (which has no model) would be inconsistent, a finite part of it would be inconsistent, hence would have no model by soundness (logic-4.4), which is false. The first-order version of the induction axiom (a schema, one sentence per formula) is compact (logic-4.7) and has non-standard models.`,
      caption: String.raw`Choose the sentences ($\sigma_0,\dots,\sigma_{N-1}$ with the slider, or all of them) and the form of induction. With the first $N$ sentences, $(\mathbb N, c = N)$ is a model: every $\sigma_k$ with $k<N$ is ticked. With **all** of them, no number can serve as $c$. Under first-order induction a non-standard model exists, with $c$ in a second chain (a copy of $\mathbb Z$) that no numeral reaches; the standard part (gold) contains $0$, is closed under $S$, yet is not everything, so under **second-order** induction, which applies to every subset, the axiom fails and this model is thrown out.`,
      credit: 'Dedekind, 1888 (categoricity of the number axioms, in second-order form)',
      deps: ['logic-4.7'],
      refs: ['Enderton §4.1'],
      tags: ['second-order', 'compactness'],
      viz(v) {
        const mode = v.select('sentences', [{ value: 'first', label: 'the first N' }, { value: 'all', label: 'all of them' }], 'first', { onChange: () => v.invalidate() });
        const ind = v.select('induction', [{ value: 'so', label: 'second-order axiom' }, { value: 'fo', label: 'first-order schema' }], 'so', { onChange: () => v.invalidate() });
        const NS = v.slider('$N$', 1, 10, 4, { int: true });
        const A = v.stage({ x: [-1, 14], y: [-3.2, 4.4], axes: false, height: 340, full: true });
        v.render(() => {
          const all = mode.value === 'all', N = NS.value, so = ind.value === 'so';
          const K = 12;
          const natRow = (y, gold) => {
            for (let i = 0; i <= K; i++) {
              if (i < K) A.arrow(i + 0.28, y, i + 0.72, y, { color: 'muted', width: 1.3, head: 5 });
              A.circle(i, y, 0.27, { color: gold ? 'gold' : 'ink', fill: gold ? 'gold' : 'panel', fillAlpha: gold ? 0.35 : 1, width: gold ? 2.2 : 1.6 });
              A.text(String(i), i, y, { align: 'center', baseline: 'middle', size: 12, color: 'ink', weight: 600 });
            }
            A.text('…', K + 0.9, y, { align: 'center', baseline: 'middle', size: 18, color: 'muted' });
          };
          if (!all) {
            natRow(1.9, false);
            A.text('S', 0.5, 2.35, { align: 'center', size: 11, color: 'muted' });
            const cx = Math.min(N, K);
            A.arrow(cx, 3.3, cx, 2.3, { color: 'orange', width: 2, head: 7 });
            A.text('c', cx, 3.45, { align: 'center', baseline: 'bottom', size: 15, math: true, color: 'orange', weight: 700 });
            for (let k = 0; k < Math.min(N, K); k++) A.text('✓', k, 1.9, { align: 'center', baseline: 'middle', dy: -26, size: 13, color: 'green', weight: 700 });
            A.text(`σ₀ … σ${subNum(N - 1)}: c ≠ 0, …, c ≠ ${N - 1}  — all true with c = ${N}`, 6.5, -0.2, { align: 'center', size: 13, color: 'ink' });
            A.text('(ℕ, c = N) is a model of the axioms and of the first N sentences', 6.5, -1.0, { align: 'center', size: 11.5, color: 'muted' });
          } else if (so) {
            natRow(1.9, false);
            A.text('every model of the second-order axioms is a copy of ℕ, so c would be some k', 6.5, 0.45, { align: 'center', size: 12.5, color: 'ink' });
            for (let k = 0; k <= K; k++) A.text('✗', k, 1.9, { align: 'center', baseline: 'middle', dy: -26, size: 13, color: 'red', weight: 700 });
            A.text('c ≠ k is demanded for every k — there is nowhere for c to go', 6.5, -0.4, { align: 'center', size: 13, weight: 700, color: 'red' });
            A.text('each finite part is satisfiable, the whole is not: compactness fails', 6.5, -1.5, { align: 'center', size: 12, color: 'muted' });
          } else {
            natRow(2.2, true);
            // the Z-chain
            for (let j = -2; j <= 5; j++) {
              const x = 4 + j * 1.1, y = -0.2;
              if (j < 5) A.arrow(x + 0.28, y, x + 0.82, y, { color: 'muted', width: 1.3, head: 5 });
              A.circle(x, y, 0.27, { color: j === 0 ? 'orange' : 'ink', fill: j === 0 ? 'orange' : 'panel', fillAlpha: j === 0 ? 0.3 : 1, width: 1.7 });
              A.text(j === 0 ? 'c' : j > 0 ? `c+${j}` : `c−${-j}`, x, y, { align: 'center', baseline: 'middle', size: 10.5, color: 'ink', math: true });
            }
            A.text('…', 1.0, -0.2, { align: 'center', baseline: 'middle', size: 18, color: 'muted' });
            A.text('…', 10.1, -0.2, { align: 'center', baseline: 'middle', size: 18, color: 'muted' });
            A.text('the standard part X (gold): contains 0, closed under S', 6.5, 3.35, { align: 'center', size: 12, color: 'gold', weight: 700 });
            A.text('a non-standard model: c sits in a second chain, beyond every numeral', 6.5, -1.3, { align: 'center', size: 12, color: 'ink' });
            if (so) A.text('✗ the induction axiom for the set X fails: 0 ∈ X, X closed under S, but X ≠ everything', 6.5, -2.4, { align: 'center', size: 12.5, weight: 700, color: 'red' });
            else A.text('✓ no first-order formula defines X, so the induction schema never applies to it', 6.5, -2.4, { align: 'center', size: 12.5, weight: 700, color: 'green' });
          }
        });
        v.readout(() => {
          const all = mode.value === 'all', N = NS.value, so = ind.value === 'so';
          if (!all) return `With $\\sigma_0,\\dots,\\sigma_{${N - 1}}$ the structure $(\\mathbb N, 0, S, c=${N})$ satisfies the axioms (including full second-order induction) and all ${N} sentences ✓. This works for every finite stage, so every finite subset of the full set has a model.`;
          return so ? `With full second-order induction the set $\\{\\sigma_k : k\\ge 0\\}$ together with the axioms has **no model**, yet every finite subset does: second-order logic is not compact. If a sound, finitary proof system were also complete, the set would be refutable by a finite deduction using finitely many $\\sigma_k$, and soundness would make that finite subset unsatisfiable. It is satisfiable, so there is no such system.` : `With induction only as a first-order schema the whole set has a model (compactness holds): a non-standard model with $c$ in a ${'$'}\\mathbb Z${'$'}-chain. The set $X$ of standard numbers is closed under $S$ but cannot be defined by a formula, so the schema is silent about it; the second-order axiom speaks about every subset and refuses this model.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Paper',
      name: 'Vollständigkeit der Axiome des logischen Funktionenkalküls',
      paper: { authors: 'Kurt Gödel', year: 1930, title: 'Die Vollständigkeit der Axiome des logischen Funktionenkalküls', venue: 'Monatshefte für Mathematik und Physik 37: 349–360', doi: '10.1007/BF01696781' },
      introduces: ['logic-4.6', 'logic-4.7'],
      statement: String.raw`Gödel showed that in the restricted functional calculus (first-order logic without equality), every valid formula is provable from the axioms of Hilbert and Ackermann. He proved that every formula is either refutable or satisfiable in a denumerable domain (TheoremsI–VI). He then extended the result to equality using equivalence classes (VII–VIII, with a finite or denumerable model), and proved compactness for countable sets of formulas (IX–X).`,
      idea: String.raw`Gödel's method, as outlined here, reduces the refutable-or-satisfiable question for a formula to the shape $\forall x_1\cdots\forall x_k\,\exists y_1\cdots\exists y_m\,\psi$, with $\psi$ quantifier-free, using prenex form (logic-3.12) and a lemma adapted from Skolem that lowers the number of alternations. He then forms finite conjunctions and their propositional replacements (called $D_n$ in this reconstruction) that say: the instances of $\psi$ at the first $n$ $k$-tuples of numbers, with fresh numbers for the $y$'s, hold together. If some $D_n$ is propositionally refutable, the formula is refutable in the calculus. Otherwise every $D_n$ has a truth assignment, and a selection argument of König type extracts one assignment that works for all $n$ at once; read as a relation on the natural numbers it is a model. The theorem is thus a dichotomy: refutable or satisfiable.`,
      caption: String.raw`A $\forall\exists$-sentence without equality is on the left; its instances $B_1,B_2,\dots$ (universals at the $n$-th pair of numbers, existentials at fresh numbers) are listed with the propositional sentence $D_N=B_1\wedge\dots\wedge B_N$ they form. The middle panel is the tree of truth values for the first few atoms: a node is green if some assignment extending it satisfies $D_N$ and red if none does, and the gold path is the one chosen by always taking the first branch that stays extendable. The right panel reads that choice as a graph on $\{1,2,\dots\}$. Slide $N$ to watch a satisfiable sentence stay satisfiable, or try the refutable one and see $D_n$ collapse at a definite stage, with the offending instances in red.`,
      scope: String.raw`This is a reconstruction of the method, not of the paper's own tables or notation: the instances and assignments are computed live for the sentences offered, with a finite look-ahead $N$ in place of Gödel's infinitary selection; prenex sentences of "degree" one only (the degree-reduction lemma is not run).`,
      credit: 'Kurt Gödel, 1930 (Monatshefte für Mathematik und Physik37,349–360)',
      deps: ['logic-4.1', 'logic-4.4', 'logic-3.12', 'logic-2.11'],
      refs: ['Gödel1930a, complete Stefan Bauer-Mengelberg translation in van Heijenoort, From Frege to Gödel (1967), pp583–591; TheoremsIII–VI pp585–589, VII–X pp589–591'],
      tags: ['completeness', 'history'],
      viz(v) {
        const PRE = [
          { id: 'ser', text: '∀x ∃y R(x,y)', label: 'serial: every x has an R-successor' },
          { id: 'asym', text: '∀x ∃y (R(x,y) ∧ ¬R(y,x))', label: 'every x has a one-way successor' },
          { id: 'mix', text: '∀x ∃y (P(x) → (R(x,y) ∧ P(y)))', label: 'P is passed on along R' },
          { id: 'ref', text: '∀x ∀y ∃z (R(z,z) ∧ ¬R(x,y))', label: 'refutable (needs a stage-5 instance)' },
          { id: 'ref1', text: '∀x ∃y (P(y) ∧ ¬P(y))', label: 'refutable at once' },
        ];
        const pre = v.select('sentence', PRE.map((p) => ({ value: p.id, label: p.label })), 'asym', { onChange: (id) => fld.set(PRE.find((p) => p.id === id).text) });
        const fld = foField(v, 'or type one', PRE[1].text, { sig: { rels: { P: 1, R: 2 }, funcs: {}, consts: [], name: 'P and R' }, width: 380, check: (a) => (freeVars(a).length ? 'it must be a sentence' : noEq(a)), onChange: () => v.invalidate() });
        const NS = v.slider('stage $N$', 1, 12, 5, { int: true });
        const A = v.stage({ x: [0, 100], y: [0, 100], axes: false, height: 340, weight: 1.1, minWidth: 320 });
        const B = v.stage({ x: [0, 100], y: [0, 100], axes: false, height: 340, weight: 1.2, minWidth: 330 });
        const C = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.6], equal: true, axes: false, height: 340, weight: 0.9, minWidth: 260 });
        let S = null, key = '';
        const compute = () => {
          if (!fld.ok) { S = null; return; }
          const k = `${toStr(fld.ast)}|${NS.value}`; if (k === key) return; key = k;
          const steps = prenexSteps(fld.ast, 'correct'), pre0 = steps[steps.length - 1].ast, d = degreeOne(pre0);
          if (!d) { S = { error: 'the prenex form is not of the shape ∀…∀∃…∃ (degree one); Gödel’s lemma would first reduce it' }; return; }
          const N = NS.value, inst = godelInstances(d, N), r = godelSat(inst);
          let firstUnsat = null;
          for (let n = 1; n <= 12; n++) { if (godelSat(godelInstances(d, n)).sat === false) { firstUnsat = n; break; } }
          S = { d, pre: pre0, inst, sat: r.sat, atoms: r.atoms.map((a) => a[0]), cnf: r.cnf, firstUnsat };
          if (r.sat === false) { // minimal core by deletion
            let keep = range(N); for (const i of [...keep].reverse()) { const t = keep.filter((j) => j !== i); if (godelSat(t.map((j) => inst[j])).sat === false) keep = t; }
            S.core = keep;
          } else if (r.sat) {
            // greedy path through the tree of atom values
            const fixed = [], val = new Map();
            for (const a of S.atoms) { const t = godelSat(inst, [...fixed, [a, true]]).sat; const b = t === true; fixed.push([a, b]); val.set(a, b); }
            S.val = val; S.tree = { top: S.atoms.slice(0, 4) };
            S.ok = inst.every((b) => evalGround(b.g, val));
          }
        };
        v.render(() => {
          compute();
          if (!S) { A.text(fld.src.trim() ? 'cannot read the sentence' : 'type a sentence', 50, 50, { align: 'center', size: 13, color: 'red' }); return; }
          if (S.error) { A.text(S.error, 50, 50, { align: 'center', size: 12, color: 'red' }); return; }
          const N = NS.value;
          A.text(`φ (prenex): ${clip(toStr(S.pre), 44)}`, 2, 98, { align: 'left', baseline: 'top', size: 11.5, color: 'ink', weight: 700 });
          const rowH = Math.min(7.4, 84 / Math.max(N, 6));
          S.inst.forEach((b, i) => {
            const y = 88 - i * rowH, inCore = S.core && S.core.includes(i);
            if (inCore) A.rect(0, y - rowH / 2, 100, y + rowH / 2, { fill: 'red', fillAlpha: 0.18, stroke: false });
            A.text(`B${subNum(b.n)}`, 2, y, { align: 'left', baseline: 'middle', size: 11, color: 'muted', weight: 700 });
            A.text(b.tuple.length ? `(${b.tuple.join(',')})` : '', 14, y, { align: 'left', baseline: 'middle', size: 10.5, color: 'muted' });
            A.text(clip(toStr(b.g), 40), 30, y, { align: 'left', baseline: 'middle', size: 10.8, color: inCore ? 'red' : 'ink' });
          });
          A.corner(S.sat === false ? `D${subNum(N)} is refutable` : S.sat ? `D${subNum(N)} is satisfiable` : '', 'bl', { size: 12.5, color: S.sat === false ? 'red' : 'green', weight: 700 });
          // tree
          if (S.sat === false) {
            B.text('D_N has no satisfying assignment', 50, 60, { align: 'center', size: 15, weight: 700, color: 'red' });
            B.text(`the instances ${S.core.map((i) => `B${subNum(i + 1)}`).join(', ')} already contradict each other`, 50, 48, { align: 'center', size: 12, color: 'ink' });
            B.text('so φ is refutable: ¬φ is provable', 50, 36, { align: 'center', size: 12.5, color: 'muted' });
          } else if (S.sat) {
            const H = Math.min(4, S.atoms.length);
            B.text('values of the first atoms (True ↑, False ↓): the tree of partial assignments', 2, 98, { align: 'left', baseline: 'top', size: 11, color: 'muted', weight: 700 });
            const nodes = [{ pre: [], x: 8, y: 46 }];
            let level = nodes;
            const colw = 84 / (H + 1);
            for (let h = 0; h < H; h++) {
              const next = [];
              for (const nd of level) for (const b of [true, false]) {
                const pre = [...nd.pre, [S.atoms[h], b]], span = 21 / 2 ** h;
                const nn = { pre, x: 8 + (h + 1) * colw, y: nd.y + (b ? span : -span), parent: nd };
                next.push(nn);
              }
              for (const nn of next) {
                const ok = godelSat(S.inst, nn.pre).sat === true, onPath = nn.pre.every(([a, b]) => S.val.get(a) === b);
                B.line(nn.parent.x, nn.parent.y, nn.x, nn.y, { color: onPath ? 'gold' : 'faint', width: onPath ? 3 : 1.2 });
                nn.ok = ok; nn.onPath = onPath;
              }
              for (const nn of next) B.dot(nn.x, nn.y, { r: nn.onPath ? 6 : 4, color: nn.ok ? 'green' : 'red', fill: nn.ok ? 'green' : 'red', width: 1 });
              B.text(S.atoms[h], 8 + (h + 1) * colw, 88, { align: 'center', baseline: 'top', size: 9.5, color: 'muted' });
              level = next;
            }
            B.dot(8, 46, { r: 5, color: 'ink', fill: 'ink' });
            B.corner(`the whole assignment has ${S.atoms.length} atoms; gold path extended to all of them`, 'bl', { size: 11, color: 'muted' });
          }
          if (S.sat === false) { C.text('no model', 0, 0.2, { align: 'center', size: 18, weight: 700, color: 'red' }); C.text('a refutable formula has none', 0, -0.2, { align: 'center', size: 12, color: 'muted' }); }
          // model
          if (S.sat && S.val) {
            const K = Math.min(7, Math.max(2, ...S.atoms.flatMap((a) => (a.match(/\d+/g) || []).map(Number))));
            const get = (r, args) => S.val.get(`${r}(${args.map((a) => a + 1).join(', ')})`) === true;
            const M = { n: K, dom: range(K), rel: (r, a) => get(r, a), konst: () => 0, fn: () => 0 };
            drawStruct(C, M, { rels: new Map([['P', 1], ['R', 2]].filter(([r]) => preorder(S.pre).some((n) => n.op === 'rel' && n.r === r))), consts: new Set(), funcs: new Map() }, { radius: 1.0, r: 13, label: (a) => String(a + 1) });
            C.corner(`finite assignment: elements 1…${K}; atoms outside D_N are drawn false; not a model of the full sentence`, 'tl', { size: 10.5, color: 'muted' });
          }
        });
        v.readout(() => {
          if (!fld.ok) return fld.src.trim() ? `Cannot read the sentence: ${fld.error}.` : 'Type a ∀∃-sentence.';
          if (!S || S.error) return S ? `${S.error}.` : '';
          const N = NS.value;
          if (S.sat === false) return `$D_{${N}}$ is unsatisfiable: the instances ${S.core.map((i) => `$B_{${i + 1}}$`).join(', ')} (${S.core.length} of ${N}) are propositionally contradictory. The first stage where this happens is $n=${S.firstUnsat}$, so $\\varphi$ is refutable, and a refutation of the finite propositional sentence is a derivation of $\\neg\\varphi$ in the calculus.`;
          if (S.sat) return `$D_{${N}}$ is satisfiable. ${S.firstUnsat === null ? 'No contradiction was found up to stage12.' : `The same search finds a contradiction at stage${S.firstUnsat}, so this finite assignment cannot extend indefinitely.`} The path of gold nodes fixes all ${S.atoms.length} atoms at once; the resulting relation satisfies every $B_n$ for $n\\le ${N}$ ${S.ok ? '✓ (checked)' : '✗'}. Letting $N\\to\\infty$ and always keeping a branch with infinitely many extensions is Gödel's argument: the limit assignment is a model on the numbers $1,2,3,\\dots$ — so a formula is always refutable or satisfiable, never neither.`;
          return `The SAT solver gave up at stage ${N}.`;
        });
      },
    },
  ],
};
