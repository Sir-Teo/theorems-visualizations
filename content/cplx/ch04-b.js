// Computational Complexity — Chapter 4 (Boolean circuits), part 2: 4.8–4.14.
// Karp–Lipton by self-reduction against an unreliable SAT circuit, Meyer's theorem on a tableau checked by a universal
// quantifier, shallow circuits (NC and AC), parallel-prefix addition, the circuit value problem, NC¹ ⊆ L ⊆ NL ⊆ NC²,
// and Shannon's 1938 relay-circuit paper.
//
// Honesty notes. The self-reduction runs are real (a DPLL solver plays the honest oracle; errors are injected by a hash),
// prefix networks, circuits and tableaux are computed, and the exact-minimal-formula table of 4.14 is computed by search over
// all 256 functions of three variables. The Meyer picture (4.9) uses a small cellular automaton as a stand-in for an
// exponential-time machine and the tableau itself plays the role of the guessed circuit; it is a model of the argument,
// not of an actual EXP computation.
import {
  clamp, big, dpll, randomCNF, hash32, newC, addIn, addG, foldC, evalC, sizeC, depthC, layoutC, drawC,
  caRun, prefixNet, runPrefix, parseBool, evalAst, truthTable, minFormulas3, mask3, astText, leafCount,
} from './ch04.shared.js';

import {shallowMetrics, satWitness, tableauViolations, formulaWalk, squaredReachability} from './circuit-source-audit.shared.js';

const CA_RULES = [30, 90, 110, 184];

// ---------------------------------------------------------------------------------------------------------------
// Series-parallel relay networks for 4.14. A formula is turned into negation normal form over contacts.
function desugar(a) {
  switch (a.t) {
    case 'var': case 'const': return a;
    case 'not': return { t: 'not', a: desugar(a.a) };
    case 'and': case 'or': return { t: a.t, a: desugar(a.a), b: desugar(a.b) };
    case 'xor': { const x = desugar(a.a), y = desugar(a.b); return { t: 'or', a: { t: 'and', a: x, b: { t: 'not', a: y } }, b: { t: 'and', a: { t: 'not', a: x }, b: y } }; }
    case 'imp': return { t: 'or', a: { t: 'not', a: desugar(a.a) }, b: desugar(a.b) };
    default: { const x = desugar(a.a), y = desugar(a.b); return { t: 'or', a: { t: 'and', a: x, b: y }, b: { t: 'and', a: { t: 'not', a: x }, b: { t: 'not', a: y } } }; }
  }
}
function toNet(a, neg = false) {
  switch (a.t) {
    case 'var': return { k: 'c', v: a.v, neg };
    case 'const': return { k: 'k', closed: !!a.b !== neg };
    case 'not': return toNet(a.a, !neg);
    case 'and': return { k: neg ? 'p' : 's', ch: [toNet(a.a, neg), toNet(a.b, neg)] };
    default: return { k: neg ? 's' : 'p', ch: [toNet(a.a, neg), toNet(a.b, neg)] };
  }
}
const flat = (n) => { if (n.k === 's' || n.k === 'p') { const ch = []; n.ch.forEach((c) => { const f = flat(c); if (f.k === n.k) ch.push(...f.ch); else ch.push(f); }); return { k: n.k, ch }; } return n; };
const dims = (n) => {
  if (n.k === 'c' || n.k === 'k') return [1, 1];
  const d = n.ch.map(dims);
  return n.k === 's' ? [d.reduce((s, x) => s + x[0], 0), Math.max(...d.map((x) => x[1]))] : [Math.max(...d.map((x) => x[0])), d.reduce((s, x) => s + x[1], 0)];
};
const contactsOf = (n) => (n.k === 'c' ? 1 : n.k === 'k' ? 0 : n.ch.reduce((s, c) => s + contactsOf(c), 0));
/** Draw a network in the box [x0, x0+w] x [y0, y0+h] (y down); returns the potential at its right end. */
function drawNet(s, n, x0, y0, w, h, vin, env) {
  const cy = y0 + h / 2;
  if (n.k === 'c' || n.k === 'k') {
    const closed = n.k === 'k' ? n.closed : (env[n.v] ? 1 : 0) !== (n.neg ? 1 : 0);
    const out = vin && closed;
    const hl = Math.min(0.55, w * 0.22), L = x0 + w * 0.5 - hl, R = x0 + w * 0.5 + hl;
    s.line(x0, cy, L, cy, { color: vin ? 'orange' : 'muted', width: vin ? 3 : 1.6 });
    s.line(R, cy, x0 + w, cy, { color: out ? 'orange' : 'muted', width: out ? 3 : 1.6 });
    // the contact blade: closed = flat, open = lifted
    s.line(L, cy, closed ? R : R - (R - L) * 0.1, closed ? cy : cy + 0.28, { color: closed ? 'orange' : 'ink', width: 2.6 });
    s.dot(L, cy, { r: 3, color: 'ink' }); s.dot(R, cy, { r: 3, color: 'ink' });
    if (n.k === 'c') s.text(n.neg ? `${n.v}′` : n.v, x0 + w * 0.5, cy - 0.3, { align: 'center', baseline: 'bottom', size: 13, color: n.neg ? 'red' : 'accent', weight: 700 });
    return out;
  }
  if (n.k === 's') {
    let x = x0, pot = vin;
    n.ch.forEach((c) => { const [cw] = dims(c); const dw = (cw / dims(n)[0]) * w; pot = drawNet(s, c, x, y0, dw, h, pot, env); x += dw; });
    return pot;
  }
  let y = y0, any = false; const [, th] = dims(n);
  const outs = n.ch.map((c) => { const [, ch] = dims(c); const dh = (ch / th) * h; const o = drawNet(s, c, x0 + 0.08 * w * 0 + 0.0, y, w, dh, vin, env); y += dh; return o; });
  any = outs.some(Boolean);
  const firstY = y0 + dims(n.ch[0])[1] / th * h / 2, lastY = y0 + h - dims(n.ch[n.ch.length - 1])[1] / th * h / 2;
  s.line(x0, firstY, x0, lastY, { color: vin ? 'orange' : 'muted', width: vin ? 3 : 1.6 });
  s.line(x0 + w, firstY, x0 + w, lastY, { color: any ? 'orange' : 'muted', width: any ? 3 : 1.6 });
  return any;
}

const SHANNON_PRE = [
  ['x ∧ (y ∨ z) ∨ ¬x ∧ (¬y ∨ ¬z)', 'a two-way switch'],
  ['(x ∧ y) ∨ (y ∧ z) ∨ (x ∧ z)', 'carry of x + y + z'],
  ['x ^ y ^ z', 'sum bit of x + y + z'],
  ['(x ∧ y) ∨ (x ∧ ¬y) ∨ (¬x ∧ y)', 'redundant contacts'],
  ['(x ∨ y) ∧ (x ∨ z) ∧ (y ∨ z)', 'majority again, as a product'],
];

export default {
  collection: 'cplx',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Karp–Lipton theorem',
      statement: String.raw`If $\mathrm{NP}\subseteq\mathrm{P/poly}$ (equivalently, SAT has polynomial-size circuits), then the polynomial hierarchy collapses to its second level: $\mathrm{PH}=\Sigma_2^{\mathsf p}=\Pi_2^{\mathsf p}$. Karp and Lipton obtained a collapse to a low level; the second-level form quoted here is credited to Sipser.`,
      idea: String.raw`Take a $\Pi_2^{\mathsf p}$ sentence $\forall u\,\exists v\;\psi(x,u,v)$ with a polynomial-time predicate. Convert the inner witness test to SAT by the polynomial Cook–Levin reduction. Under the hypothesis, a polynomial-size circuit $W_x$ can return a witness for every $u$: use SAT self-reduction, bundling the circuits for all polynomially many query lengths (or padding queries to one length). A $\Sigma_2$ machine guesses $W$ and checks $\forall u\;\psi(x,u,W(u))=1$. A bad guess cannot manufacture a witness for a false inner statement; a correct circuit supplies witnesses whenever they exist. Thus $\Pi_2\subseteq\Sigma_2$, and the hierarchy collapses. In the finite demo the oracle is a DPLL-based simulation, not an exhibited polynomial-size circuit family.`,
      caption: String.raw`A random 3-CNF on 8 variables stands in for $\varphi_{x,u}$. **Step** through the self-reduction: the oracle $C$ is queried on the formula with $x_1,\dots,x_{i}$ fixed. Choose a perfect $C$, one whose answers are flipped by a deterministic hash at threshold $\rho$ (red rows: its answer differs from the truth), or one that always says SAT. The last step checks the extracted assignment against every clause. Right: 200 random formulas through the same verifier. The bar “UNSAT ✓” (an unsatisfiable formula accepted) is **always 0**: a bad $C$ can reject satisfiable instances, but accepting still requires a valid assignment. The hash threshold is not a certified error fraction over all formulas; these 200 samples illustrate the verifier.`,
      deps: ['cplx-4.4', 'cplx-3.6', 'cplx-3.4'],
      refs: ['Arora–Barak, 2007 draft, Theorem 6.19; Karp–Lipton (1982), §5 and Theorem 6.1'],
      credit: 'Karp & Lipton, 1980 (collapse of PH from NP ⊆ P/poly; the Σ₂ version credited to M. Sipser)',
      links: { doi: 'https://doi.org/10.1145/800141.804678', source: 'https://doi.org/10.5169/seals-52237' },
      tags: ['polynomial hierarchy', 'self-reducibility', 'advice'],
      viz(v) {
        const NV = 8; let seed = 11, model = null; const trial = new Map();
        const mS = v.slider('clauses $m$', 12, 40, 30, { int: true, onChange: () => refresh() });
        const mode = v.select('circuit $C$', [{ value: 'honest', label: 'perfect' }, { value: 'liar', label: 'hash-flipped answers' }, { value: 'yes', label: 'always says SAT' }], 'liar', { onChange: () => refresh() });
        const rho = v.slider('error rate $\\rho$', 0, 0.5, 0.05, { step: 0.05, onChange: () => refresh() });
        v.button('New formula', () => { seed += 1; refresh(); });
        const mk = (sd, cl) => {
          const truth = (c) => dpll(NV, c).model !== null;
          const oracle = (c) => {
            const t = truth(c);
            if (mode.value === 'yes') return { ans: true, truth: t };
            if (mode.value === 'liar' && hash32(JSON.stringify(c) + sd) % 1000 < rho.value * 1000) return { ans: !t, truth: t };
            return { ans: t, truth: t };
          };
          return { ...satWitness(NV, cl, oracle), truth: truth(cl), cl };
        };
        const refresh = () => { trial.clear(); model = mk(seed, randomCNF(v.rng(seed), NV, mS.value, 3)); if (S) S.reset(model.frames, { at: 'start' }); };
        let S = null;
        model = mk(seed, randomCNF(v.rng(seed), NV, mS.value, 3));
        S = v.steps({ frames: () => model.frames, still: 9, speed: 1.2, note: false });
        const A = v.stage({ x: [0, 20], y: [0, 12], axes: false, height: 330, weight: 1.5, minWidth: 330, title: 'self-reduction against the circuit C' });
        const B = v.stage({ x: [0, 4], y: [0, 215], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 250, ylabel: 'formulas (of 200)', xticks: [[0.5, 'SAT ✓'], [1.5, 'SAT ✗'], [2.5, 'UNSAT ✓'], [3.5, 'UNSAT ✗']], title: 'truth, and whether the verifier accepted (✓) or rejected (✗)' });
        const stats = () => {
          const key = `${mode.value}|${rho.value}|${mS.value}|${seed}`;
          if (!trial.has(key)) {
            const r = v.rng(seed * 7 + 1), out = [0, 0, 0, 0];
            for (let q = 0; q < 200; q++) { const m = mk(seed * 1000 + q, randomCNF(r, NV, mS.value, 3)); out[m.truth ? (m.accepted ? 0 : 1) : (m.accepted ? 2 : 3)]++; }
            trial.set(key, out);
          }
          return trial.get(key);
        };
        v.render(() => {
          const shown = model.frames.slice(0, S.i + 1);
          shown.forEach((f, k) => {
            const y = 11 - k * 1.05;
            if (f.kind === 'root') {
              A.text(`ask C: is φ satisfiable?   C says ${f.ans ? 'SAT' : 'UNSAT'}`, 0.3, y, { size: 12, color: f.ans === f.truth ? 'ink' : 'red', baseline: 'middle' });
              A.text(f.ans === f.truth ? '' : `(truth: ${f.truth ? 'SAT' : 'UNSAT'})`, 12.6, y, { size: 12, color: 'red', baseline: 'middle' });
              if (!f.ans) A.text('C says UNSAT: the verifier gives up on this guess', 0.3, y - 1.05, { size: 12, color: 'orange', baseline: 'middle' });
            } else if (f.kind === 'step') {
              A.text(`ask C: φ with x₁…x${f.i - 1} fixed and x${f.i} = 0 ?   → ${f.ans ? 'SAT' : 'UNSAT'}   so set x${f.i} = ${f.bit}`, 0.3, y, { size: 12, color: f.ans === f.truth ? 'ink' : 'red', baseline: 'middle' });
              if (f.ans !== f.truth) A.text(`(truth ${f.truth ? 'SAT' : 'UNSAT'})`, 16.2, y, { size: 11, color: 'red', baseline: 'middle' });
            } else if (f.bad >= 0) {
              const a = [...Array(NV)].map((_, i) => f.asg.get(i + 1) ?? 0).join('');
              A.text(`assignment ${a}: ${mS.value - f.bad} of ${mS.value} clauses satisfied`, 0.3, y, { size: 13, weight: 700, color: f.ok ? 'green' : 'red', baseline: 'middle' });
              A.text(f.ok ? 'verified: φ really is satisfiable, whatever C is' : 'check fails: C is caught lying; the verifier rejects', 0.3, y - 1.05, { size: 12, color: f.ok ? 'green' : 'red', baseline: 'middle' });
            } else A.text('', 0, 0);
          });
          const st = stats(), lab = ['SAT, accepted', 'SAT, rejected (bad C)', 'UNSAT, accepted', 'UNSAT, rejected'], col = ['green', 'orange', 'red', 'muted'];
          st.forEach((c, i) => {
            B.rect(i + 0.12, 0, i + 0.88, c, { fill: col[i], fillAlpha: 0.6, color: col[i], width: 1.4 });
            B.text(String(c), i + 0.5, c + 3, { align: 'center', size: 13, weight: 700 });
          });
        });
        v.readout(() => {
          const st = stats();
          return `This formula is truly ${model.truth ? 'satisfiable' : 'unsatisfiable'}; the verifier ${model.accepted ? '**accepts**' : '**rejects**'}.\nOver 200 formulas: ${st[2]} unsatisfiable formulas accepted (soundness holds for every $C$), ${st[1]} satisfiable ones rejected because $C$ was wrong.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Meyer’s theorem: EXP ⊆ P/poly implies EXP = Σ₂',
      statement: String.raw`If $\mathrm{EXP}\subseteq\mathrm{P/poly}$, then $\mathrm{EXP}=\Sigma_2^{\mathsf p}$ and hence $\mathrm{EXP}=\Pi_2^{\mathsf p}=\mathrm{PH}$. This is a conditional collapse to the second level. It would also imply $\mathrm P\ne\mathrm{NP}$: otherwise PH collapses to P and the displayed equality contradicts the deterministic time hierarchy $\mathrm P\ne\mathrm{EXP}$. No unconditional circuit lower bound for EXP follows from this argument.`,
      idea: String.raw`Choose a deterministic single-tape machine for $L\in\mathrm{EXP}$, with polynomial overhead in its running time, a padded time bound $T=2^{p(n)}$, fixed blank boundary cells, and a designated output cell. Arrange that it halts in a stationary accepting/rejecting configuration and retains its output until time $T$. The language asking for one encoded tableau-symbol bit $\mathrm{Tab}(x,t,j,b)$ is in EXP, so the hypothesis gives polynomial-size circuits in the combined, polynomial-length address. Hard-wire $x$ and guess a circuit $C(t,j,b)$. Universally check the initial row, every valid local transition window, boundary encodings, and acceptance at the designated final output. Invalid addresses are ignored. Each address has polynomial length; each check takes polynomial time. The initial row and deterministic local rule force the unique true tableau. Hence the guess is sound, and a true accepting tableau has a small circuit by hypothesis; $L\in\Sigma_2$. The reverse inclusion $\Sigma_2\subseteq\mathrm{EXP}$ follows by enumerating the polynomial-length quantifiers.`,
      caption: String.raw`A stand-in for an exponential computation: an elementary cellular automaton with periodic boundaries, run for $T$ steps on $2^w$ cells from a single 1 (the “input”). The grid is the **guessed tableau**; the Σ₂ machine's $\forall$ sweeps over every window $(t,j)$ — the sweeping frame is one check, three parents above, one child below. **Click cells to forge the guess**: red cells are windows that break the rule (or a row 0 different from the input). Every altered complete tableau violates at least one initial or transition constraint; a single sampled window need not catch it. Readout: there are $T\cdot2^w$ transition windows plus $2^w$ initial-row constraints — exponential in the address length — while each check is one rule lookup. (Model: a real EXP machine has a Turing tableau and the guess is a *circuit*, not a table.)`,
      deps: ['cplx-4.8', 'cplx-4.5', 'cplx-3.5'],
      refs: ['Karp–Lipton (1982), Theorem 6.6, p. 207; Arora–Barak (2007 draft), Theorem 6.20'],
      credit: 'A. R. Meyer; original proof in Karp–Lipton (1982), Theorem 6.6, p. 207; tableau presentation: Arora–Barak Theorem 6.20',
      links: { source: 'https://doi.org/10.5169/seals-52237' },
      tags: ['non-uniformity', 'EXP', 'hierarchy collapse'],
      viz(v) {
        const rule = v.select('rule', CA_RULES.map((r) => ({ value: r, label: String(r) })), 110, { onChange: () => reset() });
        const wS = v.slider('address bits $w$ (cells $=2^w$)', 3, 6, 5, { int: true, onChange: () => reset() });
        const tS = v.slider('time steps $T$', 6, 32, 16, { int: true, onChange: () => reset() });
        let guess = [], init = [];
        const reset = () => {
          const W = 2 ** wS.value; init = new Array(W).fill(0); init[W >> 1] = 1;
          guess = caRun(init, rule.value, tS.value);
        };
        v.button('Forge a random cell', () => { const t = 1 + Math.floor(Math.random() * tS.value), j = Math.floor(Math.random() * guess[0].length); guess[t][j] ^= 1; });
        v.button('Restore honest tableau', () => reset());
        reset();
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 420, weight: 1, minWidth: 320, full: true, title: 'the guessed tableau (time downward) and the ∀ sweep' });
        let geo = null;
        A.onClick((px, py) => { if (!geo) return; const j = Math.floor((px - geo.x0) / geo.cw), t = Math.floor((geo.y0 - py) / geo.ch); if (t >= 0 && t < guess.length && j >= 0 && j < guess[0].length) guess[t][j] ^= 1; });
        const violations = () => tableauViolations(guess, init, rule.value);
        v.animate((time) => {
          const W = guess[0].length, T = guess.length, cw = 0.98 / W, ch = Math.min(0.98 / T, cw * 1.25), x0 = 0.01, y0 = 0.99;
          geo = { cw, ch, x0, y0 };
          const bad = violations(), badSet = new Set(bad.map(([t, j]) => `${t},${j}`));
          for (let t = 0; t < T; t++) for (let j = 0; j < W; j++) {
            const b = badSet.has(`${t},${j}`);
            A.rect(x0 + j * cw, y0 - (t + 1) * ch, x0 + (j + 1) * cw, y0 - t * ch, { fill: b ? 'red' : guess[t][j] ? 'accent' : 'grid', fillAlpha: b ? 0.75 : guess[t][j] ? 0.75 : 0.18, color: 'panel', width: 0.5 });
          }
          const total = (T - 1) * W, idx = Math.floor(((time % 12) / 12) * total), t = 1 + Math.floor(idx / W), j = idx % W;
          for (const dj of [-1, 0, 1]) A.rect(x0 + (((j + dj) % W + W) % W) * cw, y0 - t * ch, x0 + ((((j + dj) % W + W) % W) + 1) * cw, y0 - (t - 1) * ch, { color: 'orange', width: 2.2, stroke: true });
          A.rect(x0 + j * cw, y0 - (t + 1) * ch, x0 + (j + 1) * cw, y0 - t * ch, { color: 'gold', width: 3, stroke: true });
          A.text(`∀ sweep: checking window (t=${t}, j=${j}) ${badSet.has(`${t},${j}`) ? '✗ violated' : '✓'}`, 0.5, 0.03, { size: 11, color: badSet.has(`${t},${j}`) ? 'red' : 'muted', align: 'center', baseline: 'bottom' });
        }, { period: 12, still: 3 });
        v.readout(() => {
          const bad = violations(), W = guess[0].length, T = guess.length - 1;
          return `Transition windows: $T\\cdot2^w=${T}\\cdot${W}=${T * W}$; initial-row constraints: ${W}; total ${W * (T + 1)}. Each transition is a lookup in rule ${rule.value}. This toy checks consistency, not an accepting EXP computation or a polynomial-size certificate.\n${bad.length ? `**${bad.length} violated window(s)**; first at $(t,j)=(${bad[0][0]},${bad[0][1]})$: this guess is rejected.` : 'No window is violated: the guess is the true tableau, forced row by row from the input.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Definition',
      name: 'NC and AC: shallow circuits',
      statement: String.raw`For $i\ge0$, $\mathrm{NC}^i$ is the class of languages decided by families of circuits of polynomial size and depth $O(\log^i n)$ with gates $\wedge,\vee,\neg$ of fan-in at most 2 (here **log-space uniform**: one transducer on $1^n$ prints $C_n$ using $O(\log n)$ work space); $\mathrm{AC}^i$ is the same with unbounded fan-in $\wedge$ and $\vee$. Then $\mathrm{NC}=\bigcup_i\mathrm{NC}^i=\bigcup_i\mathrm{AC}^i$ and $\mathrm{NC}^i\subseteq\mathrm{AC}^i\subseteq\mathrm{NC}^{i+1}$. Depth is parallel gate delay; size is the total gate count, and one processor per gate gives a parallel simulation. Stronger uniformity conventions can differ at NC¹; this item uses the stated log-space convention.`,
      idea: String.raw`A bounded-fan-in output at depth $d$ can depend on at most $2^d$ inputs. Thus a function depending on every input needs $d\ge\lceil\log_2n\rceil$; NC⁰ still exists, but its outputs have constant support. Replace a fan-in-$k$ AND/OR by a balanced binary tree of $k-1$ gates and depth $\lceil\log_2k\rceil$, giving $\mathrm{AC}^i\subseteq\mathrm{NC}^{i+1}$ while preserving polynomial size and log-space uniformity. Parity has a binary XOR tree; each XOR is expanded here into four AND/OR/NOT gates of depth 3. No fixed-depth polynomial-size family of unbounded-fan-in AND/OR/NOT circuits computes parity: $\mathrm{PARITY}\notin\mathrm{AC}^0$ (10.10).

The support lower bound is a depth induction (alg-2.1). At depth zero an input depends on at most one input variable and a constant depends on none. A NOT gate keeps its child's support, and a binary AND/OR has support contained in the union of its children's supports. Thus every depth-$d$ output has support of size at most $2^d$, even with shared subcircuits; dependence on all $n$ inputs forces $d\ge\lceil\log_2 n\rceil$. In the other direction, recursively splitting $k$ inputs into two nearly equal groups gives a binary AND/OR tree with $k-1$ gates and depth $\lceil\log_2 k\rceil$ for $k\ge1$. This is the local depth estimate used when replacing unbounded gates, not an extra lower bound against unrestricted fan-in.`,
      caption: String.raw`Choose AND, OR or parity and a chain, balanced tree or unbounded-fan-in design. All drawn gates are actual AND/OR/NOT gates. For AND/OR the chain depth is $n-1$, the balanced tree depth $\lceil\log_2n\rceil$, and the flat gate depth 1. For parity, expanding XOR gives depths three times as large. The flat parity DNF is quoted rather than drawn: $2^{n-1}$ terms, two AND/OR layers and a shared input-NOT layer, for total depth 3. Counts include NOT gates and exclude input wires.`,
      deps: ['cplx-4.1', 'alg-2.1'],
      refs: ['Arora–Barak (2007 draft), Definitions 6.24–6.25; Arora–Barak (2006 draft), Theorem 14.1; Cook (1985), §2 and Proposition 4.7'],
      credit: 'Log-space-uniform convention: Arora–Barak Definitions 6.24–6.25; Cook (1985), §§2 and 4, distinguishes stronger uniformity at NC¹; “NC” honors Nick Pippenger',
      links: { doi: 'https://doi.org/10.1016/S0019-9958(85)80041-3' },
      tags: ['NC', 'AC', 'depth', 'parallel computation'],
      viz(v) {
        const fn = v.select('function', [{ value: 'and', label: 'AND' }, { value: 'or', label: 'OR' }, { value: 'xor', label: 'parity' }], 'xor');
        const design = v.select('wiring', [{ value: 'chain', label: 'chain' }, { value: 'tree', label: 'balanced tree' }, { value: 'flat', label: 'unbounded fan-in' }], 'tree');
        const nS = v.slider('inputs $n$', 2, 32, 12, { int: true });
        const A = v.stage({ x: [-0.02, 1.02], y: [-0.02, 1.02], axes: false, height: 380, weight: 1.5, minWidth: 320, title: 'the circuit (inputs on top)' });
        const B = v.stage({ x: [2, 64], y: [0.8, 210], ylog: true, axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 250, xlabel: 'n', ylabel: 'depth', title: 'depth of each wiring' });
        v.legend([['red', 'chain (XOR expanded for parity)'], ['accent', 'balanced tree (XOR expanded for parity)'], ['green', 'flat AND/OR, or parity DNF']]);
        const model = () => shallowMetrics(nS.value, fn.value, design.value);
        v.render(() => {
          const n = nS.value, R = model(), C = R.C;
          const dpDNF = fn.value === 'xor' && design.value === 'flat';
          if (dpDNF) {
            A.text(`parity DNF: 2 AND/OR layers + shared input NOT layer`, 0.5, 0.62, { align: 'center', size: 14 });
            A.text(`a DNF with 2^${n - 1} = ${big(2 ** (n - 1))} terms of ${n} literals each`, 0.5, 0.5, { align: 'center', size: 14, color: 'red', weight: 700 });
            A.text('(a single ⊕ gate of fan-in n is not an AC gate)', 0.5, 0.38, { align: 'center', size: 12, color: 'muted' });
          } else {
            const lay = layoutC(C, { vertical: true });
            drawC(A, C, lay, { r: n > 20 ? 7 : 10 });
            const [ox, oy] = lay.pos[C.outs[0]]; A.text('out', ox, oy, { dx: 26, align: 'center', size: 11, color: 'accent', weight: 700 });
          }
          const pts = (f) => { const a = []; for (let k = 2; k <= 64; k++) a.push([k, f(k)]); return a; };
          const factor = fn.value === 'xor' ? 3 : 1;
          B.path(pts(k => factor * (k - 1)), { color: 'red', width: 2.2 }); B.path(pts(k => factor * Math.ceil(Math.log2(k))), { color: 'accent', width: 2.2 }); B.path(pts(() => fn.value === 'xor' ? 3 : 1), { color: 'green', width: 2.2 });
          const d = R.depth;
          B.dot(n, d, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const n = nS.value, R = model();
          if (!R.C) return `Parity DNF: ${R.terms} terms, ${n} input NOT gates, 1 output OR: **size ${big(R.size)}, total depth 3** (two AND/OR layers). This quoted exponential construction is not drawn.`;
          const cls = design.value === 'flat' ? 'AC⁰' : design.value === 'tree' ? 'NC¹' : 'polynomial depth';
          return `**Size ${R.size}, depth ${R.depth}** over AND/OR/NOT (${cls}). Replacing unbounded gates by binary trees: size ${R.binarySize}, depth ${R.binaryDepth}. ${fn.value === 'xor' ? 'Each XOR is expanded into four gates, depth 3; no XOR primitive is counted.' : 'Input wires are not gates.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Algorithm',
      name: 'Parallel prefix: addition in logarithmic depth',
      statement: String.raw`Two $n$-bit numbers can be added by a circuit of depth $O(\log n)$ and size $O(n\log n)$ (even $O(n)$ with a more careful network). Write $g_i=a_ib_i$ (the position *generates* a carry) and $p_i=a_i\oplus b_i$ (it *propagates* one); a pair $(g,p)$ stands for a block, and two adjacent blocks combine by $(g,p)\circ(g',p')=(g\vee(p\wedge g'),\,p\wedge p')$, with the higher block on the left. The carry into position $i+1$ is the $g$-component of the combined block $[0,i]$. Because $\circ$ is associative, all prefix blocks $[0,i]$ can be computed by a tree-like network of depth $\lceil\log_2n\rceil$; the sum bits are then $s_i=p_i\oplus c_i$. Ripple-carry addition needs depth $\Theta(n)$.`,
      idea: String.raw`The carry appears to move sequentially, but each block defines the affine Boolean map $c\mapsto g\vee(p\wedge c)$. Composing these maps gives the associative pair operation in the statement. In the pictured order, bit 0 is on the left: round $\ell$ of recursive doubling combines position $i$ with the less-significant block ending at $i-2^{\ell-1}$, to its left. Sklansky instead broadcasts the lower half-block to the upper half. These are bounded-fan-in prefix networks with unrestricted fan-out. One combine cell is two AND gates and one OR, with constant Boolean depth; rounds are not individual Boolean gate levels. Initialization and final XORs add constant depth. Ladner–Fischer prove that a more careful prefix circuit achieves linear size and logarithmic depth.

The associativity transferred from alg-1.15 is composition of maps $\{0,1\}\to\{0,1\}$. A valid carry pair has $g\wedge p=0$, giving exactly one of the three distinct maps: constant zero, identity or constant one. Combining adjacent valid pairs stays in this set and represents the composition in the stated high-to-low order. Since this representation is one-to-one on valid pairs, associativity of composition gives associativity of their pair operation, which permits the balanced prefix regrouping.`,
      caption: String.raw`Choose a network and the bit-width, then set $a$ and $b$. Each **row** is one round of combining; a segment ends in the cell that receives the block from its left neighbour (green = block generates a carry). The bottom shows the carries, the $n$ low sum bits and the final carry-out, checked against ordinary addition. Values of $a,b$ are reduced modulo $2^n$ when the width is smaller than 16. **Ripple** is a chain of $n-1$ rounds; **Kogge–Stone** and **Sklansky** take $\lceil\log_2n\rceil$. Right: combine-round depth against $n$. These are modern prefix schematics of the named designs, not reproductions of the original circuit drawings.`,
      deps: ['cplx-4.10', 'alg-1.15'],
      refs: ['Ladner–Fischer (1980), §§2 and 4; Kogge–Stone (1973), Algorithm A; Sklansky (1960)'],
      credit: 'Kogge–Stone (1973), recursive doubling; Sklansky (1960), conditional-sum network; Ladner–Fischer (1980), §2, pp. 832–835, and §4, linear-size logarithmic-depth prefix/addition circuits',
      links: { doi: 'https://doi.org/10.1145/322217.322232' },
      tags: ['parallel prefix', 'addition', 'NC'],
      viz(v) {
        const kind = v.select('network', [{ value: 'rc', label: 'ripple (chain)' }, { value: 'ks', label: 'Kogge–Stone' }, { value: 'sk', label: 'Sklansky' }], 'ks');
        const nS = v.slider('bits $n$', 2, 16, 8, { int: true });
        const aS = v.slider('$a$', 0, 65535, 181, { int: true });
        const bS = v.slider('$b$', 0, 65535, 77, { int: true });
        const A = v.stage({ x: [-1, 17], y: [-1.6, 17], axes: false, height: 400, weight: 1.5, minWidth: 330, title: 'prefix network (rounds downward)' });
        const B = v.stage({ x: [2, 32], y: [1, 40], axes: 'box', gutter: true, height: 400, weight: 1, minWidth: 250, xlabel: 'n', ylabel: 'depth (rounds)', title: 'depth of the three networks' });
        v.legend([['red', 'ripple  n−1'], ['accent', 'Kogge–Stone ⌈log₂n⌉'], ['green', 'Sklansky ⌈log₂n⌉']]);
        const bitsOf = (x, n) => Array.from({ length: n }, (_, i) => (x >> i) & 1);
        v.render(() => {
          const n = nS.value, a = bitsOf(aS.value, n), b = bitsOf(bS.value, n), R = runPrefix(a, b, kind.value), L = R.net.length;
          const Hs = Math.max(L + 1, 4), sy = 15 / Hs, yOf = (l) => 15.5 - l * sy;
          A.setView([-1.2, Math.max(n, 6) + 0.2], [-1.6, 17]);
          for (let i = 0; i < n; i++) {
            A.line(i, yOf(0), i, yOf(L), { color: 'grid', width: 1 });
            A.text(`a${i}b${i}`, i, 16.4, { align: 'center', size: 9, color: 'muted' });
            A.text(`${a[i]}${b[i]}`, i, 15.9, { align: 'center', size: 10, color: 'ink' });
          }
          R.snaps[0].forEach((q, i) => A.dot(i, yOf(0), { r: 4, color: q[0] ? 'green' : 'muted' }));
          R.net.forEach((lvl, l) => {
            lvl.forEach(([i, j]) => {
              const y = yOf(l + 1), val = R.snaps[l + 1][i];
              A.line(j, y, i, y, { color: 'orange', width: 1.6 });
              A.dot(j, y, { r: 2.5, color: 'orange' });
              A.dot(i, y, { r: 5, color: val[0] ? 'green' : 'muted' });
            });
          });
          for (let i = 0; i < n; i++) {
            A.text(`c${i}=${R.carry[i]}`, i, -0.4, { align: 'center', size: 10, color: R.carry[i] ? 'green' : 'muted' });
            A.text(`s${i}=${R.sum[i]}`, i, -1.1, { align: 'center', size: 10, weight: 700, color: R.sum[i] ? 'green' : 'ink' });
          }
          A.text(`carry out c${n}=${R.cout}`, Math.max(n, 6) / 2 - 0.5, 16.8, { align: 'center', size: 11, color: R.cout ? 'green' : 'muted' });
          const pts = (f) => { const q = []; for (let k = 2; k <= 32; k++) q.push([k, f(k)]); return q; };
          B.path(pts((k) => k - 1), { color: 'red', width: 2.2 }); B.path(pts((k) => Math.ceil(Math.log2(k))), { color: 'accent', width: 2.6 }); B.path(pts((k) => Math.ceil(Math.log2(k))), { color: 'green', width: 1.6, dash: true });
          B.dot(n, L, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const n = nS.value, a = aS.value & ((1 << n) - 1), b = bS.value & ((1 << n) - 1), R = runPrefix(bitsOf(a, n), bitsOf(b, n), kind.value);
          const s = R.sum.reduce((t, x, i) => t + x * 2 ** i, 0) + R.cout * 2 ** n;
          return `$a=${a}$, $b=${b}$ (low ${n} bits): network sum $=${s}$ ${s === a + b ? `$=a+b$ ✓` : '≠ a+b ✗'}. Prefix depth ${R.net.length} combine rounds, ${R.nodes} combine cells (3 Boolean gates each before optimization); final carry-out $c_{${n}}=${R.cout}$. Initialization and final sum XORs are additional constant-depth gates.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'Circuit value problem is P-complete',
      statement: String.raw`The **circuit value problem** (CVP) takes a Boolean circuit $C$ and an input $x$ and asks whether $C(x)=1$. CVP is in P (evaluate the gates in topological order) and is **P-complete under log-space reductions**: every $L\in\mathrm P$ reduces to CVP by a function computable in logarithmic space. Consequently CVP $\in$ NC would imply $\mathrm P=\mathrm{NC}$ (and CVP $\in$ L would give $\mathrm P=\mathrm L$).`,
      idea: String.raw`By 4.5, a polynomial-time machine's run on $x$ is a tableau of identical local gadgets, so the circuit $C_x$ with $x$ hard-wired has constant value equal to the machine's answer. What remains is to see that the *map* $x\mapsto(C_x,\,\text{input})$ needs only $O(\log n)$ space: the circuit is so regular that the description of gate number $g$ — its type, its two parents — is a simple function of the counters $(t,j)$ written in binary, and a log-space transducer simply counts through all $(t,j)$ and prints each description. Hence P-complete problems are "inherently sequential" unless P = NC: the layer-after-layer dependency of a tableau is not known to be avoidable.`,
      caption: String.raw`A circuit grown from a sequential computation: $w$ wires by $T$ layers, each gate combining the two wires above it (types and wiring fixed by $(t,j)$ alone; the last wire wraps around to the first). **Step** the evaluation layer by layer: a layer can only be evaluated once the one before it is known, so the number of rounds equals the depth $T$ — the “parallel time” of this instance. **Click a gate** to see how the transducer prints its description from the two counters. Right: for CVP instances the depth grows linearly with the number of gates, while a balanced formula of the same size has depth $\log_2$ of it; whether the first kind can always be re-wired shallowly is the P versus NC question.`,
      deps: ['cplx-4.5', 'toc-14.11'],
      refs: ['Arora–Barak ch. 6'],
      credit: 'Richard E. Ladner, 1975 (“The circuit value problem is log space complete for P”, SIGACT News 7(1): 18–20)',
      links: { doi: 'https://doi.org/10.1145/990518.990519' },
      tags: ['P-completeness', 'circuit value', 'parallelism'],
      viz(v) {
        const wS = v.slider('wires $w$', 3, 8, 6, { int: true, onChange: () => build() });
        const tS = v.slider('layers $T$', 2, 12, 8, { int: true, onChange: () => build() });
        const iS = v.slider('input pattern', 0, 30, 5, { int: true, onChange: () => build() });
        const OPS = ['and', 'or', 'xor', 'nand'], GL = { and: '∧', or: '∨', xor: '⊕', nand: '⊼' };
        const ap = { and: (p, q) => p & q, or: (p, q) => p | q, xor: (p, q) => p ^ q, nand: (p, q) => 1 - (p & q) };
        let val = [], frames = [], S = null, sel = null;
        const op = (t, j) => OPS[hash32(`${t},${j}`) % 4];
        function build() {
          const w = wS.value, T = tS.value, x0 = Array.from({ length: w }, (_, j) => (hash32(`in${iS.value},${j}`) >> 3) & 1);
          val = [x0];
          for (let t = 1; t <= T; t++) val.push(x0.map((_, j) => ap[op(t, j)](val[t - 1][j], val[t - 1][(j + 1) % w])));
          frames = Array.from({ length: T + 1 }, (_, t) => ({ t }));
          if (S) S.reset(frames, { at: 'start' });
        }
        build();
        S = v.steps({ frames: () => frames, still: 5, speed: 1.4, note: false, counter: 'layer' });
        const A = v.stage({ x: [-0.8, 8.8], y: [-0.7, 12.7], axes: false, height: 420, weight: 1.4, minWidth: 320, title: 'evaluation, layer by layer (inputs at the bottom)' });
        const B = v.stage({ x: [4, 4000], y: [1, 400], xlog: true, ylog: true, axes: 'box', gutter: true, height: 420, weight: 1, minWidth: 250, xlabel: 'gates', ylabel: 'rounds needed', title: 'rounds of parallel evaluation' });
        v.legend([['red', 'sequential-computation circuits (rounds = T)'], ['green', 'balanced formula (rounds = log₂ size)']]);
        A.onClick((px, py) => { const t = Math.round(py), j = Math.round(px); if (t >= 1 && t <= tS.value && j >= 0 && j < wS.value && Math.abs(px - j) < 0.4 && Math.abs(py - t) < 0.4) sel = [t, j]; });
        v.render(() => {
          const w = wS.value, T = tS.value, cur = S.frame.t ?? 0;
          A.setView([-0.8, Math.max(w - 1 + 1.8, 5)], [-0.7, T + 0.7]);
          for (let t = 1; t <= T; t++) for (let j = 0; j < w; j++) {
            const done = t <= cur;
            A.line(j, t, j, t - 1, { color: done ? 'muted' : 'grid', width: 1.2 }); A.line(j, t, (j + 1) % w, t - 1, { color: done ? 'muted' : 'grid', width: 1.2 });
          }
          A.dot(0, T, { r: 15, color: 'gold', hollow: true, width: 3.4 });
          if (sel) A.dot(sel[1], sel[0], { r: 16, color: 'red', hollow: true, width: 2.8 });
          for (let t = 0; t <= T; t++) for (let j = 0; j < w; j++) {
            const done = t <= cur, x = val[t][j];
            A.dot(j, t, { r: t === 0 ? 8 : 10, color: done ? (x ? 'green' : 'muted') : 'grid', hollow: !done || !x, width: 2.2 });
            if (t > 0) A.text(GL[op(t, j)], j, t, { align: 'center', baseline: 'middle', size: 12, color: done ? 'ink' : 'muted' });
            else A.text(String(x), j, t, { align: 'center', baseline: 'middle', size: 11, color: 'ink' });
          }
          const g = [], f = []; for (let m = 4; m <= 4000; m *= 1.15) { g.push([m, Math.max(1, m / wS.value)]); f.push([m, Math.max(1, Math.log2(m))]); }
          B.path(g, { color: 'red', width: 2.4 }); B.path(f, { color: 'green', width: 2.4 });
          B.dot(w * T, T, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const w = wS.value, T = tS.value, out = val[T][0];
          const d = sel ? `Gate $(t,j)=(${sel[0]},${sel[1]})$: the transducer prints type ${GL[op(sel[0], sel[1])]} with parents $(${sel[0] - 1},${sel[1]})$ and $(${sel[0] - 1},${(sel[1] + 1) % w})$, computed from the two counters alone in $O(\\log(wT))$ bits.` : 'Click a gate to see its description computed from $(t,j)$.';
          return `${w * T} gates, depth $T=${T}$: output $C(x)=${out}$ after ${T} sequential rounds.\n${d}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Theorem',
      name: 'NC¹ ⊆ L ⊆ NL ⊆ NC²',
      statement: String.raw`$\mathrm{NC}^1\subseteq\mathrm L\subseteq\mathrm{NL}\subseteq\mathrm{NC}^2$ (for log-space uniform circuit families). The first inclusion: a depth-$O(\log n)$ circuit (of fan-in 2) can be evaluated depth-first by a log-space machine using $O(\log n)$ bits for path/status information, temporary addresses and uniformity generation. The middle inclusion is trivial. The last: directed reachability, which is NL-complete (toc-14.12), is computed by $\lceil\log_2n\rceil$ Boolean matrix squarings, each a circuit of depth $O(\log n)$, hence by a circuit of depth $O(\log^2n)$ and polynomial size.`,
      idea: String.raw`For $\mathrm{NC}^1\subseteq\mathrm L$, unfold the circuit into a binary formula of depth $d=O(\log n)$ without storing that formula. Keep one branch bit and at most one saved left-child value per level, plus traversal state and counters. Recover the current gate address by replaying the root path through the log-space uniformity generator; storing an address at every ancestor would incorrectly cost $O(\log^2n)$ space. Temporary address and generator workspace use another $O(\log n)$ bits. For $\mathrm{NL}\subseteq\mathrm{NC}^2$, use the polynomial-size configuration graph of an $O(\log n)$-space machine; its local transition predicates have shallow uniform circuits. Add identity edges. Squaring computes paths of length at most $2^k$. For $N$ configurations, $\lceil\log_2(N-1)\rceil$ squarings suffice: a reachable pair has a simple path of at most $N-1$ edges. Each product uses an AND layer and balanced fan-in-2 OR trees of depth $\lceil\log_2N\rceil$, and size $O(N^3)$. This directly builds a uniform polynomial-size depth-$O(\log^2n)$ circuit for every NL language.

The Boolean squaring invariant follows from the ordinary real matrix product formula (ladr-3.46) without treating Boolean arithmetic as a field. For a zero-one reachability matrix $B$, $(B^2)_{ij}=\sum_r B_{ir}B_{rj}$ is a nonnegative integer, positive exactly when some intermediate vertex joins two represented paths. Threshold that ordinary product at positivity to obtain the Boolean product. Starting with identity and adjacency entries, induction makes the matrix after $k$ squarings represent paths of length at most $2^k$; identity entries permit padding shorter paths.

The finite stopping bound uses pigeonhole (comb-1.2). A path with at least $N$ edges among $N$ vertices repeats a vertex, so deleting the intervening closed walk preserves its endpoints and shortens it. Repeating this deletion leaves a simple path of at most $N-1$ edges whenever the endpoints are reachable. Therefore doubling the represented length until it reaches $N-1$ is sufficient; the $N=1$ case is already handled by the initial identity matrix. This bounds the number of squarings independently of the Boolean gate implementation.`,
      caption: String.raw`Left: step through a depth-$d$ formula. The control record uses a branch path and saved left values, not a stack of gate addresses. The bit count includes traversal state and counters; the readout separately budgets a temporary gate address. The complete node table and colored history are animation data, not the log-space machine’s workspace. XOR is a constant-size abbreviation here. Right: click a matrix cell to toggle the underlying edge; green derived reachability may remain after removing an edge if another path exists. Diagonal identity entries are always included. After $k$ squarings the matrix records paths of length at most $2^k$.`,
      deps: ['cplx-4.10', 'toc-14.12', 'ladr-3.46', 'comb-1.2'],
      refs: ['Borodin (1977), Theorems 2 and 4, Lemma 1; Arora–Barak (2007 draft), Exercises 6.12 and 6.14'],
      credit: 'Allan Borodin (1977), Theorem 2, pp. 734–735, and Lemma 1/Theorem 4, p. 738; the path/status evaluation trick there is credited to S. Cook',
      links: { doi: 'https://doi.org/10.1137/0206054' },
      tags: ['NC', 'log space', 'reachability'],
      viz(v) {
        const dS = v.slider('formula depth $d$', 1, 4, 3, { int: true, onChange: () => rebuild() });
        const kS = v.slider('squarings $k$', 0, 3, 0, { int: true });
        v.button('New leaves', () => { seed++; rebuild(); });
        let seed = 3, ev = [], tree = null, S = null;
        const N = 8, A0 = Array.from({ length: N }, () => new Array(N).fill(0));
        [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [1, 5], [3, 0]].forEach(([i, j]) => { A0[i][j] = 1; });
        const OP = ['and', 'or', 'xor'], GL = { and: '∧', or: '∨', xor: '⊕' }, f2 = { and: (p, q) => p & q, or: (p, q) => p | q, xor: (p, q) => p ^ q };
        function rebuild() {
          const d = dS.value, nodes = {};
          const val = (k) => { if (k >= 2 ** d) return nodes[k] = { leaf: true, v: (hash32(`${seed},${k}`) >> 5) & 1 }.v; const n = { op: OP[hash32(`o${seed},${k}`) % 3] }; n.v = f2[n.op](val(2 * k), val(2 * k + 1)); nodes[k] = n; return n.v; };
          val(1);
          const walk = formulaWalk(nodes, d);
          tree = { d, nodes, walk }; ev = walk.frames;
          if (S) S.reset(ev, { at: 'start' });
        }
        rebuild();
        S = v.steps({ frames: () => ev, still: 9, speed: 3, note: false, counter: 'step' });
        const T = v.stage({ x: [0, 1], y: [-0.1, 1.05], axes: false, height: 380, weight: 1.3, minWidth: 300, title: 'NC¹ ⊆ L: depth-first evaluation with a short stack' });
        const M = v.stage({ x: [-1.4, 8.2], y: [-1.4, 9.1], axes: false, equal: true, height: 380, weight: 1, minWidth: 280, title: 'NL ⊆ NC²: reachability by squaring' });
        M.onClick((px, py) => { const j = Math.floor(px), i = 7 - Math.floor(py); if (i >= 0 && i < N && j >= 0 && j < N && i !== j) A0[i][j] ^= 1; });
        const closure = k => squaredReachability(A0, k);
        const pos = (k) => { const l = Math.floor(Math.log2(k)), i = k - 2 ** l; return [(i + 0.5) / 2 ** l, 1 - l / (tree.d + 0.35) * 0.95]; };
        v.render(() => {
          const d = tree.d, cur = ev[Math.min(S.i, ev.length - 1)], done = new Set(), stack = new Set(cur.stack.map((q) => q[0]));
          for (let q = 0; q <= S.i; q++) if (ev[q].act === 'exit') done.add(ev[q].k);
          for (let k = 2; k < 2 ** (d + 1); k++) { const [x, y] = pos(k), [px, py] = pos(Math.floor(k / 2)); T.line(px, py, x, y, { color: 'grid', width: 1.4 }); }
          for (let k = 1; k < 2 ** (d + 1); k++) {
            const [x, y] = pos(k), n = tree.nodes[k], isDone = done.has(k), vv = typeof n === 'number' ? n : n.v;
            T.dot(x, y, { r: 12, color: k === cur.k ? 'gold' : stack.has(k) ? 'orange' : isDone ? (vv ? 'green' : 'muted') : 'grid', hollow: !(isDone || k === cur.k), width: 2.4 });
            const txt = k >= 2 ** d ? (isDone || k === cur.k ? String(vv) : '?') : GL[n.op];
            T.text(txt, x, y, { align: 'center', baseline: 'middle', size: 12, color: 'ink' });
          }
          T.text(`stack: ${cur.stack.length ? cur.stack.map((q) => `${GL[tree.nodes[q[0]].op]}${q[1] == null ? '·' : q[1]}`).join(' ') : '(empty)'}`, 0.02, -0.06, { size: 11, color: 'muted', baseline: 'middle' });
          // reachability
          const P = closure(kS.value);
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            const on = P[i][j], orig = A0[i][j] && i !== j;
            M.rect(j + 0.04, 7 - i + 0.04, j + 0.96, 7 - i + 0.96, { fill: on ? (orig ? 'accent' : 'green') : 'grid', fillAlpha: on ? 0.7 : 0.15, color: 'panel', width: 0.6 });
          }
          M.rect(7, 7, 8, 8, { color: 'gold', width: 3, stroke: true });
          for (let i = 0; i < N; i++) { M.text(String(i), -0.5, 7 - i + 0.5, { align: 'center', baseline: 'middle', size: 11, color: 'muted' }); M.text(String(i), i + 0.5, 8.45, { align: 'center', baseline: 'middle', size: 11, color: 'muted' }); }
          M.text('from (rows) → to (columns)', 4, -0.8, { align: 'center', size: 11, color: 'muted' });
        });
        v.legend([['accent', 'original edge (identity loops green)'], ['green', 'path of length ≤ 2ᵏ']]);
        v.readout(() => {
          const cur = ev[Math.min(S.i, ev.length - 1)], d = tree.d, P = closure(kS.value);
          const need = Math.ceil(Math.log2(N - 1));
          return `Control record now: ${cur.bits} bits (branch path, saved values, value/phase and counters); plus at most ${d + 1} bits for a recomputed gate address. Across this run: at most ${tree.walk.maxBits + d + 1} bits in this model, before uniformity-generator workspace. Formula: ${2 ** d} leaves, depth ${d}; full animation history is excluded.${S.i === ev.length - 1 ? ` Completed traversal output: **${tree.walk.value}**.` : ''}\nAfter $k=${kS.value}$ squarings the pair $(0,7)$ is ${P[0][7] ? '**joined**' : '**not yet joined**'} by a path of length $\\le${2 ** kS.value}$; ${need} squarings always suffice for $N=8$, each of depth $\\lceil\\log_2 8\\rceil+1$ (one AND layer, a fan-in-2 OR tree with 8 leaves), product depth ${need * 4}, excluding the configuration-graph construction.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Paper',
      name: 'A Symbolic Analysis of Relay and Switching Circuits',
      paper: { authors: 'Claude E. Shannon', year: 1938, title: 'A Symbolic Analysis of Relay and Switching Circuits', venue: 'Transactions of the American Institute of Electrical Engineers 57 (12): 713–723', doi: '10.1109/T-AIEE.1938.5057767' },
      introduces: ['tech-11.13', 'logic-2.8', 'cplx-4.1'],
      statement: String.raw`Shannon showed that networks of relay contacts can be analysed and designed with Boolean algebra. A contact is a variable $X$ (normally open: closed when $X=1$) or its complement $X'$ (normally closed); contacts **in series** conduct as the AND, contacts **in parallel** as the OR, and a network between two terminals conducts exactly when its Boolean function is 1. Hence any circuit specification given by a truth table can be realised by a series–parallel network read off from a Boolean expression, and algebraic simplification (absorption, consensus, De Morgan) removes contacts without changing behaviour. The paper also built adders and other examples from relays.`,
      idea: String.raw`Before 1938, telephone switching circuits were designed by experience and checked by trial; Boole's algebra of logic (1854) was a philosophical curiosity to engineers. Shannon, writing from Bell Telephone Laboratories after his 1937 MIT thesis, noticed that the two states of a relay contact (open, closed) and the two operations on networks (series, parallel) obey the postulates of the algebra of logic. Independent work by Nakashima in Japan (1935–36) had approached switching networks differently. The paper introduced the view that a circuit is a Boolean expression, and size (number of contacts) the cost to be minimised — the root of circuit complexity (4.1) and of logic design.`,
      caption: String.raw`Type any formula in $x,y,z$ (¬ ∧ ∨ ⊕ → ↔, or ~ & | ^ -> <->) or pick a preset. The relay network is drawn from it: **series = ∧, parallel = ∨, a primed letter is a normally-closed contact**. **Toggle $x,y,z$** to energize contacts (orange); the lamp lights when current flows. **Simplify** replaces the formula by a *provably* smallest De Morgan formula for the same function (found by exhaustive search over all 256 functions of three variables) and redraws the network: contacts drop, the truth table does not change. The paper's own figures (e.g. its relay adder) are not reproduced; this recreates the method on small examples.`,
      deps: ['alg-19.15a', 'logic-2.3'],
      refs: [],
      credit: 'Claude E. Shannon, 1938 (MIT master’s thesis 1937)',
      links: { doi: 'https://doi.org/10.1109/T-AIEE.1938.5057767', wikipedia: 'https://en.wikipedia.org/wiki/A_Symbolic_Analysis_of_Relay_and_Switching_Circuits' },
      tags: ['switching circuits', 'Boolean algebra', 'logic design'],
      viz(v) {
        const f = v.input('$f$ =', SHANNON_PRE[1][0], { width: 330, placeholder: 'e.g. x & (y | z)' });
        v.select('preset', SHANNON_PRE.map(([t, n], i) => ({ value: i, label: n })), 1, { onChange: (i) => { f.set(SHANNON_PRE[i][0]); } });
        const tx = v.toggle('$x$ = 1', true), ty = v.toggle('$y$ = 1', false), tz = v.toggle('$z$ = 1', true);
        v.button('Simplify', () => {
          const P = parseBool(f.value); if (!P.ok || P.vars.some((c) => !'xyz'.includes(c))) return;
          const m = mask3(P.ast), e = minFormulas3().expr[m]; if (e) f.set(e);
        });
        const A = v.stage({ x: [-1, 15], y: [0, 9], axes: false, height: 360, weight: 1.6, minWidth: 330, title: 'the relay network between the two terminals' });
        const H = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 0.8, minWidth: 240, title: 'truth table: network = formula' });
        const parse = () => {
          const P = parseBool(f.value);
          if (!P.ok) return { ok: false, error: P.error };
          if (P.vars.some((c) => !'xyz'.includes(c))) return { ok: false, error: 'use only the letters x, y, z' };
          const net = flat(toNet(desugar(P.ast))); return { ok: true, P, net, contacts: contactsOf(net), mask: mask3(P.ast) };
        };
        v.render(() => {
          const info = parse();
          if (!info.ok) { A.text(`cannot read the formula: ${info.error}`, 7, 4.5, { align: 'center', color: 'red', size: 14 }); return; }
          const env = { x: tx.value ? 1 : 0, y: ty.value ? 1 : 0, z: tz.value ? 1 : 0 }, [w, h] = dims(info.net);
          const W = 13, scaleW = Math.min(4.2, W / w), bw = w * scaleW, bh = Math.min(7.4, Math.max(1.6, h * 1.5)), y0 = 4.5 - bh / 2 - 0.6;
          const cyBox = y0 + bh / 2;
          A.line(-0.9, cyBox, 0.3, cyBox, { color: 'orange', width: 3 });
          A.dot(-0.9, cyBox, { r: 5, color: 'ink', label: '+', labelPos: 'w' });
          const out = drawNet(A, info.net, 0.3, y0, bw, bh, true, env);
          A.line(0.3 + bw, cyBox, 14.2, cyBox, { color: out ? 'orange' : 'muted', width: out ? 3 : 1.6 });
          A.dot(14.2, cyBox, { r: 11, color: out ? 'gold' : 'muted', hollow: !out, width: 2.4 });
          A.text(out ? 'lit' : 'dark', 14.2, cyBox - 0.75, { align: 'center', size: 12, color: out ? 'gold' : 'muted', weight: 700 });
          // truth table
          const m = info.mask;
          H.text('x y z', 0.3, 0.95, { align: 'center', size: 13, weight: 700, color: 'accent' }); H.text('f', 0.8, 0.95, { align: 'center', size: 13, weight: 700 });
          for (let r = 0; r < 8; r++) {
            const y = 0.86 - r * 0.105, on = (m >> r) & 1, cur = r === ((env.x << 2) | (env.y << 1) | env.z);
            if (cur) H.rect(0.05, y - 0.045, 0.95, y + 0.045, { fill: 'gold', fillAlpha: 0.3, color: 'gold', width: 1.4, radius: 4 });
            H.text(`${(r >> 2) & 1} ${(r >> 1) & 1} ${r & 1}`, 0.3, y, { align: 'center', baseline: 'middle', size: 13, color: 'ink' });
            H.text(String(on), 0.8, y, { align: 'center', baseline: 'middle', size: 13, weight: 700, color: on ? 'green' : 'muted' });
          }
        });
        v.readout(() => {
          const info = parse(); if (!info.ok) return `Formula error: ${info.error}`;
          const best = minFormulas3(), mn = best.cost[info.mask];
          const sim = info.contacts > mn ? ` Simplify would cut it to **${mn}** contacts: ${best.expr[info.mask]}.` : (info.contacts === mn ? ' This is already a smallest formula.' : '');
          return `The network uses **${info.contacts}** contacts (after expanding ⊕, →, ↔ into ∧ ∨ ¬); the smallest De Morgan formula for this function has ${mn} literals.${sim}`;
        });
      },
    },
  ],
};
