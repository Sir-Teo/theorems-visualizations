// Logic & Foundations — Chapter 4: Proofs, soundness and completeness (items 4.7–4.12)
import {
  parseFO, toStr, toTex, preorder, isQ, freeVars, qrank, holds, langOf, structures, range, foField, graphStruct, tableStruct, structText,
  drawStruct, dpll, skolemize, nnfFO, neg, imp, prenexSteps, degreeOne, godelInstances, subNum, mk, P1, circlePos,
} from './ch04.shared.js';

import { herbrandStage, godelSat, groundWitness, boundedHolds, freshenBound } from './source-audit.shared.js';

import godelAudit from './source-audit-godel.js';

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
      statement: String.raw`There is an algorithm that prints, one after another, exactly the logically valid sentences of a given (effectively presented) first-order language: every valid sentence is eventually printed and nothing else is. For an invalid sentence the algorithm just keeps running: validity is **semi-decidable**. (General first-order validity is undecidable, as established by Church and Turing; this does not say that validity is undecidable in every restricted language.)`,
      idea: String.raw`By completeness (logic-4.6) a sentence is valid iff it has a deduction, and soundness (logic-4.4) makes the converse. Deductions are finite strings that can be checked mechanically (logic-4.1), so list all strings in order of length, test each, and print the conclusion of those that are deductions. A practical machine does the same thing through Herbrand's theorem: negate the sentence, replace $\exists$ by Skolem functions, and instantiate the universal quantifiers with ever larger sets of terms; the sentence is valid iff, at some stage, the resulting propositional clauses are unsatisfiable. The machine below runs that search for several sentences at once (dovetailing) so that a sentence that never closes cannot block the others.`,
      caption: String.raw`The machine is working on six sentences, the first of which you can edit (equality-free sentences in $P,Q,R$). Drag **time $T$**: units of work are handed out in turn to the sentences, each unit advancing one Herbrand level of a negation (levels have different computational costs). A cell is grey while the instances so far are still satisfiable and turns green (⊥) when they first become propositionally unsatisfiable: the sentence is *valid* and is printed in the list at the top. An unbounded search never prints an invalid sentence; capped cells only report unresolved work. The last sentence has no finite countermodel at all, only infinite ones, which is why no finite search can ever tell that it is invalid.`,
      scope: String.raw`Herbrand levels are computed up to level 5 with at most 2 500 ground instances and a 400-term generation budget; SAT work also has a finite cap; beyond that a cell is shown as capped. The correctness of "unsatisfiable at some level ⇔ valid" is Herbrand's theorem for equality-free sentences.`,
      credit: 'Enumerability and Herbrand expansion proofs: Enderton §§2.5 and 4.2',
      deps: ['logic-4.6'],
      refs: ['Enderton, 2nd ed. (2001), §2.5, Enumerability Theorem, pp. 142–145', 'Enderton §4.2, Herbrand expansions and proof, pp. 291–294'],
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
        const queue = () => [{ ast: fld.ok ? fld.ast : null, tag: 'yours' }, ...PRE.map((p) => ({ ast: P1(p.text, SIGM), tag: p.tag, text: p.text }))];
        const status = (Q, t) => {
          const k = Q.length;
          return Q.map((q, i) => {
            const lv = q.ast ? levels(q.ast) : [], units = t > i ? Math.floor((t - i - 1) / k) + 1 : 0;
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
            A.text(q.ast ? clip(toStr(q.ast), 62) : '(invalid input: no proof search)', 5, y + 2.3, { align: 'left', baseline: 'middle', size: 11.5, color: 'ink' });
            A.text(q.tag, 5, y - 3.4, { align: 'left', baseline: 'middle', size: 9.8, color: 'muted' });
            for (let l = 0; l < LEV; l++) {
              const x = 72 + l * 4.6, h = s.lv[l];
              const computed = l < s.units && h, closes = computed && h.sat === false, cap = computed && h.capped;
              const col = closes ? 'green' : cap ? 'orange' : computed ? 'muted' : 'faint';
              A.rect(x - 2, y - 4, x + 2, y + 4, { fill: col, fillAlpha: closes ? 0.55 : computed ? 0.3 : 0.1, color: col, width: 1.2, radius: 2 });
              if (computed) A.text(closes ? '⊥' : cap ? '…' : String(h.instances), x, y, { align: 'center', baseline: 'middle', size: 8.4, color: 'ink' });
            }
            A.text(!q.ast ? 'invalid input' : s.done ? 'valid ✓' : s.units ? 'running…' : 'waiting', 99.5, y, { align: 'right', baseline: 'middle', size: 11, color: s.done ? 'green' : 'muted', weight: 700 });
          });
          A.text('Herbrand level of ¬σ:', 70, 6, { align: 'right', baseline: 'middle', size: 9.8, color: 'muted' });
          for (let l = 0; l < LEV; l++) A.text(String(l), 72 + l * 4.6, 6, { align: 'center', baseline: 'middle', size: 9.8, color: 'muted' });
        });
        v.readout(() => {
          const Q = queue(), St = status(Q, T.value), my = St[0], q0 = Q[0];
          const found = St.filter((s) => s.done).length;
          let mine;
          if (!fld.ok) mine = fld.src.trim() ? `Sentence 1 cannot be read: ${fld.error}.` : 'Type a sentence; sentence 1 has no search while the input is empty.';
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
      idea: String.raw`Let $\Sigma$ have models of arbitrarily large finite sizes. A finite subset of $\Sigma\cup\{\lambda_n\}$ mentions only $\lambda_n$ for $n\le N$, and is satisfied by a model of $\Sigma$ with at least $N$ elements. By compactness (logic-4.7) the whole set has a model; it satisfies every $\lambda_n$, so it is infinite. A sentence $\varphi$ meant to say “finite” would hold in the finite models of every size, so it also holds in an infinite one, a contradiction.`,
      caption: String.raw`Pick a sentence that is meant to express “finite”, or type your own in the language of a binary relation $R$, a unary relation $P$ and a unary function $f$ (with =). The program searches for models of $\varphi$ of each size $1,\dots,8$ (structured candidates such as $R$ = “less than”, $f$ = “add 1 mod $n$”, then 400 random ones) and draws a model of $\Gamma_N=\{\varphi,\lambda_1,\dots,\lambda_N\}$ with exactly $N$ elements. Finding models at all eight displayed sizes supplies finite evidence only. Compactness gives an infinite model only if models exist at arbitrarily large finite sizes. The sentence “at most one element” illustrates a genuine finite bound.`,
      scope: String.raw`The search is not exhaustive, so "no model found" is inconclusive; a found model is verified exactly. Finding models at sizes 1–8 does not establish unbounded finite sizes or an infinite model. The infinite models promised by compactness are not constructed here.`,
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
          const verdict = all ? 'models were found at all eight displayed sizes. This finite evidence does not establish models at arbitrarily large finite sizes, so compactness supplies no infinite-model conclusion from this search alone.' : found.length ? `models were found only for sizes ${found.join(', ')}; ${Math.max(...found) < 8 ? 'at the other displayed sizes the search found none; this is inconclusive and does not prove a finite upper bound.' : 'there are gaps, so the search may have missed some.'}` : 'no model at sizes 1–8 was found; this bounded, incomplete search proves neither unsatisfiability nor a finite size bound.';
          return `$\\Gamma_{${N}}$ ${R[N - 1] ? 'has a model with exactly ' + N + ' elements, so it is satisfiable ✓' : 'has no model found with ' + N + ' elements'}. Over all sizes ${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Proposition',
      name: 'Connectedness is not first-order axiomatizable',
      statement: String.raw`There is no set $T$ of first-order sentences in the language of graphs ($E$ for adjacency) whose models are exactly the connected graphs. Working relative to the axioms for simple undirected graphs, no theory true in all connected graphs can exclude every disconnected graph: with two new constants $a,b$, the set $T\cup\{\delta_n : n\ge 1\}$, where $\delta_n$ includes $a\ne b$ and says that no $E$-walk of lengths $1,\dots,n$ joins $a$ and $b$, is satisfiable.`,
      idea: String.raw`Suppose $T$ axiomatized connectedness. Every finite subset of $T\cup\{\delta_n\}$ uses only $\delta_n$ for $n\le N$, and is satisfied by a long path graph with $a,b$ at its two ends (connected, so a model of $T$, and with $a,b$ at distance larger than $N$). By compactness (logic-4.7) there is a model of all of it: a model of $T$ in which no finite path joins $a$ and $b$, i.e. a disconnected graph satisfying $T$, contradicting the choice of $T$. The cycle panel supplies finite comparisons for particular sentences; these experiments are separate from the compactness proof and establish no general indistinguishability theorem.`,
      caption: String.raw`Top: the path graph with endpoints $a,b$ satisfies $\delta_1,\dots,\delta_N$ at stage $N$ (drag $N$); no stage can capture connectedness. Bottom: choose a sentence of your own or an example and compare the connected graph $C_{2m}$ with the disconnected graph $C_m\sqcup C_m$ for $m=3,\dots,10$ (green dot: the sentence has the same truth value in both, red: it tells them apart). Small cycles may be told apart by short-range properties. Agreement at the displayed sizes is only a finite observation for the chosen sentence; it does not establish agreement at all larger sizes.`,
      scope: String.raw`Each evaluated finite structure has a budget of 250 000 recursive evaluation steps. An orange/unknown result means the budget was exceeded; it is not counted as agreement. The compactness proof concerns all graphs, including infinite ones, and does not assert that connectedness is undefinable relative to finite graphs alone.`,
      deps: ['logic-4.7'],
      refs: ['Enderton, 2nd ed. (2001), §2.5, Compactness Theorem p. 142 and Exercise 8 p. 146'],
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
        const verdict = (ast, m) => { const key = `${toStr(ast)}|${m}`; let r = cache.get(key); if (!r) { const a = boundedHolds(ast, cyc([2 * m])), b = boundedHolds(ast, cyc([m, m])); r = { a, b }; cache.set(key, r); } return r; };
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
              const x = 16 + (k - 3) * 11, big = k > maxM, r = big ? null : verdict(fld.ast, k), unknown = r && (r.a === null || r.b === null), same = r && !unknown && r.a === r.b;
              C.dot(x, 70, { r: k === m ? 10 : 7, color: big ? 'faint' : unknown ? 'orange' : same ? 'green' : 'red', fill: big ? null : unknown ? 'orange' : same ? 'green' : 'red', hollow: big, width: k === m ? 3 : 1.5 });
              C.text(String(k), x, 55, { align: 'center', size: 11, color: k === m ? 'ink' : 'muted' });
            }
            C.text('m →', 2, 55, { align: 'left', size: 11, color: 'muted' });
            const rr = verdict(fld.ast, m);
            C.text(`C₂ₘ: ${rr.a === null ? 'unknown (budget)' : rr.a ? 'true' : 'false'}`, 6, 35, { align: 'left', size: 12.5, color: rr.a === null ? 'orange' : rr.a ? 'green' : 'red', weight: 700 });
            C.text(`Cₘ⊔Cₘ: ${rr.b === null ? 'unknown (budget)' : rr.b ? 'true' : 'false'}`, 6, 22, { align: 'left', size: 12.5, color: rr.b === null ? 'orange' : rr.b ? 'green' : 'red', weight: 700 });
            C.text(`quantifier rank ${qrank(fld.ast)}`, 98, 6, { align: 'right', size: 11, color: 'muted' });
          }
        });
        v.readout(() => {
          if (!fld.ok) return fld.src.trim() ? `Cannot read the sentence: ${fld.error}.` : 'Type a sentence in $E$.';
          const maxM = qrank(fld.ast) >= 4 ? 8 : 10, ms = range(maxM - 2).map((i) => i + 3);
          const diff = ms.filter((k) => { const r = verdict(fld.ast, k); return r.a !== null && r.b !== null && r.a !== r.b; });
          const unknown = ms.filter(k => { const r = verdict(fld.ast, k); return r.a === null || r.b === null; });
          return `At stage $N=${N.value}$ the path satisfies $\\delta_1,\\dots,\\delta_{${N.value}}$; for every $N$ some finite connected graph does, so by compactness a model of all $\\delta_n$ exists which no first-order theory of connected graphs can rule out. The sentence $${toTex(fld.ast)}$ (rank ${qrank(fld.ast)}) separates $C_{2m}$ from $C_m\\sqcup C_m$ for ${diff.length ? `$m\\in\\{${diff.join(',')}\\}$ among evaluated $m$ up to ${maxM}` : `none of the $m$ from 3 to ${maxM}`}${unknown.length ? `; budget unresolved at $m\\in\\{${unknown.join(',')}\\}$` : ''}. No conclusion about larger cycle lengths follows from this finite strip.`;
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
    godelAudit,
  ],
};
