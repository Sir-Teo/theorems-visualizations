// Computational Complexity — Chapter 3 (coNP and the polynomial hierarchy), part 2: 3.7–3.12.
// Σₖ-SAT as a game tree, alternating Turing machines, ATIME(poly) = PSPACE, ALOGSPACE = P as a pointer game on a circuit,
// PH ⊆ PSPACE measured by an evaluator, and the alternation-trading time–space lower bound for SAT.
//
// Honesty notes. QBF values, strategies, evaluation traces, the circuit game and the checkpoint simulation are all computed
// on screen. The alternating-machine pictures use abstract computation trees (schematic configurations), and the 3.12 picture
// follows the alternation-trading argument with exponents; it does not run SAT algorithms (none with those resources is known).
import {
  clamp, cnfSat, dnfSat, randomCNF, randomDNF, qLevelsFn, qStrategy, qTrace,
} from './ch03.shared.js';

const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n) => String(n).split('').map((d) => SUBS[+d]).join('');
const nodeXY = (d, i, W, y0, dy) => [(W * (i + 0.5)) / (1 << d), y0 - d * dy];

export default {
  collection: 'cplx',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'Σₖ-SAT is complete for level k',
      statement: String.raw`For $k\ge1$ let $\Sigma_k\mathrm{SAT}$ be the set of true sentences $\exists u_1\forall u_2\exists u_3\cdots Q_ku_k\ \varphi(u_1,\dots,u_k)$, where each $u_i$ is a block of Boolean variables and $\varphi$ is a Boolean formula (a 3-CNF if $Q_k=\exists$, a 3-DNF if $Q_k=\forall$ suffices). Then $\Sigma_k\mathrm{SAT}$ is $\Sigma_k^{\mathsf p}$-complete under polynomial-time many-one reductions, and the same sentences beginning with $\forall$ give $\Pi_k^{\mathsf p}$-complete problems. For $k=1$ this is the Cook–Levin theorem.`,
      idea: String.raw`Membership is the definition. For hardness let $L\in\Sigma_k$ be given by a polynomial-time verifier $V(x,u_1,\dots,u_k)$. Run the Cook–Levin construction (toc-13.4) on $V$: it produces a formula $\psi_x(u_1,\dots,u_k,t)$, where $t$ are the tableau cells, which is satisfiable for given $u$'s in exactly one way (the tableau is forced) and says "$V$ accepts". If the last quantifier is $\exists$, put $t$ into the last block and keep $\psi$ as a 3-CNF; if it is $\forall$, use the dual: $V$ accepts iff for all tableaux that are valid, the tableau accepts, which is a 3-DNF in $t$ and $t$ joins the last $\forall$ block. The earlier blocks are untouched, so $x\in L\iff$ the quantified formula is true. The game-tree picture is the semantics: $\exists$ chooses a child at its levels, $\forall$ must be defended against at both children.`,
      caption: String.raw`A quantified Boolean formula with $k$ alternating blocks over $n$ variables is drawn as its full game tree (round nodes: $\exists$ picks a branch; square nodes: $\forall$ picks a branch). Leaves show whether the matrix $\varphi$ (random 3-CNF, or 3-DNF when the last block is $\forall$) is satisfied; green nodes are true, red false, and each internal node is the OR or AND of its children. Switch on the **winning strategy**: the thick subtree is a proof that the sentence is true (if $\exists$ wins: one child at each $\exists$ node, both at each $\forall$ node) or false (if $\forall$ wins). Change $k$, $n$ and the first quantifier, or draw a new formula. The lower strip shows where the Cook–Levin tableau cells $t$ join the blocks (schematic).`,
      deps: ["cplx-3.5","toc-13.4","logic-2.5"],
      refs: ['Arora–Barak ch. 5'],
      credit: 'Stockmeyer, 1976; Wrathall, 1976',
      links: { doi: 'https://doi.org/10.1016/0304-3975(76)90062-1' },
      tags: ['Σₖ-SAT', 'QBF', 'completeness'],
      viz(v) {
        const first = v.select('first block', [{ value: 'E', label: '∃ (Σ)' }, { value: 'A', label: '∀ (Π)' }], 'E');
        const kS = v.slider('alternating blocks $k$', 1, 4, 3, { int: true });
        const nS = v.slider('variables $n$', 2, 7, 5, { int: true });
        const showS = v.toggle('show winning strategy', true);
        let seed = 4;
        v.button('New formula', () => { seed++; });
        const s = v.stage({ x: [-2.6, 20], y: [0.1, 8.2], axes: false, height: 430, full: true });
        const s2 = v.stage({ x: [0, 12], y: [0, 2.4], axes: false, height: 150, full: true, title: 'blocks of the sentence, and where the tableau cells t join (schematic)' });
        let model = null;
        const build = () => {
          const n = nS.value, k = Math.min(kS.value, n), ex = first.value === 'E';
          const key = `${seed}:${n}:${k}:${ex}`;
          if (model && model.key === key) return model;
          const blockOf = (i) => Math.floor(((i - 1) * k) / n);
          const quant = [null]; for (let i = 1; i <= n; i++) quant.push((blockOf(i) % 2 === 0) === ex ? 'E' : 'A');
          const lastQ = quant[n], r = v.rng(seed * 131 + n * 7 + k);
          const cnf = lastQ === 'E', mat = cnf ? randomCNF(r, n, Math.round(2.6 * n), 3) : randomDNF(r, n, Math.round(1.5 * n) + 1, 3);
          const levels = qLevelsFn(n, quant, (a) => (cnf ? cnfSat(mat, a) : dnfSat(mat, a)));
          const strat = qStrategy(n, quant, levels), tr = qTrace(n, quant, levels);
          return (model = { key, n, k, quant, lastQ, cnf, mat, levels, strat, tr, blockOf });
        };
        v.render(() => {
          const M = build(), { n, quant, levels, strat } = M, W = 19, y0 = 7.3, dy = 6.4 / n;
          for (let d = 1; d <= n; d++) s.text(`${quant[d] === 'E' ? '∃' : '∀'}x${sub(d)}`, -2.5, y0 - (d - 0.5) * dy, { size: 12, color: quant[d] === 'E' ? 'accent' : 'orange', weight: 700, baseline: 'middle' });
          s.text(`φ`, -2.5, y0 - n * dy, { size: 13, color: 'muted', baseline: 'middle', weight: 700 });
          for (let d = 0; d < n; d++) for (let i = 0; i < (1 << d); i++) for (const c of [2 * i, 2 * i + 1]) {
            const [x1, y1] = nodeXY(d, i, W, y0, dy), [x2, y2] = nodeXY(d + 1, c, W, y0, dy), on = showS.value && strat.keep.has(`${d + 1}:${c}`) && strat.keep.has(`${d}:${i}`);
            s.line(x1, y1, x2, y2, { color: on ? (strat.win ? 'green' : 'red') : 'faint', width: on ? 2.8 : 1, alpha: on ? 1 : 0.55 });
          }
          for (let d = 0; d <= n; d++) for (let i = 0; i < (1 << d); i++) {
            const [x, y] = nodeXY(d, i, W, y0, dy), val = levels[d][i], on = showS.value && strat.keep.has(`${d}:${i}`), col = val ? 'green' : 'red';
            const r = d === n ? clamp(60 / (1 << n) * 1.3, 2.5, 6) : clamp(13 - 2 * d, 4, 12);
            if (d === n) { s.rect(x - 0.4 * (W / (1 << n)), y - 0.12, x + 0.4 * (W / (1 << n)), y + 0.12, { fill: col, fillAlpha: on || !showS.value ? 0.9 : 0.35, color: col, width: on ? 2 : 0.8 }); continue; }
            const isE = quant[d + 1] === 'E', big = r >= 8;
            if (isE) s.dot(x, y, { r, color: col, hollow: !(on || !showS.value) });
            else s.rect(x - r / 38, y - r / 45, x + r / 38, y + r / 45, { fill: col, fillAlpha: on || !showS.value ? 0.85 : 0.2, color: col, width: 1.5 });
            if (big) s.text(isE ? '∃' : '∀', x, y, { align: 'center', baseline: 'middle', size: 11, weight: 800, color: on || !showS.value ? 'panel' : 'ink', halo: false });
          }
          s.corner(`root is ${levels[0][0] ? 'TRUE' : 'FALSE'} — ${strat.win ? '∃' : '∀'} wins`, 'tr', { color: levels[0][0] ? 'green' : 'red', weight: 700, plate: true });
          // strip: blocks and the tableau block
          const k = M.k, wBlock = 9 / (k + 1.6);
          for (let b = 0; b < k; b++) {
            const e = (b % 2 === 0) === (first.value === 'E'), x0 = 0.4 + b * (wBlock + 0.12);
            s2.rect(x0, 0.9, x0 + wBlock, 1.9, { fill: e ? 'accent' : 'orange', fillAlpha: 0.35, color: e ? 'accent' : 'orange', width: 2, radius: 6 });
            s2.text(`${e ? '∃' : '∀'} u${sub(b + 1)}`, x0 + wBlock / 2, 1.4, { align: 'center', baseline: 'middle', size: 14, weight: 700, color: 'ink' });
          }
          const xt = 0.4 + k * (wBlock + 0.12), lastE = M.lastQ === 'E';
          s2.rect(xt, 0.9, xt + wBlock * 1.4, 1.9, { fill: lastE ? 'accent' : 'orange', fillAlpha: 0.2, color: lastE ? 'accent' : 'orange', width: 2, radius: 6, hatch: true });
          s2.text(`${lastE ? '∃' : '∀'} t  (tableau cells)`, xt + wBlock * 0.7, 1.4, { align: 'center', baseline: 'middle', size: 13, weight: 700, color: 'ink' });
          s2.text(lastE ? 'last block is ∃: t joins it and the matrix is a 3-CNF' : 'last block is ∀: V accepts ⇔ every valid tableau accepts, a 3-DNF in t, so t joins the ∀ block', 0.4, 0.35, { size: 12, color: 'muted' });
          s2.text('x (the input) is fixed; only u₁…u_k and t are quantified', 11.8, 2.15, { size: 11, color: 'muted', align: 'right' });
        });
        v.legend([['green', 'true node / satisfied leaf', { dot: true }], ['red', 'false node / falsified leaf', { dot: true }], ['accent', '∃ (round)', { dot: true }], ['orange', '∀ (square) in the strip', { dot: true }]]);
        v.readout(() => {
          const M = build(), { n, quant, levels, strat, tr, k } = M;
          const groups = []; for (let i = 1; i <= n; i++) { const b = M.blockOf(i); (groups[b] = groups[b] || []).push(i); }
          const pref = groups.map((g, b) => `${quant[g[0]] === 'E' ? '\\exists' : '\\forall'} ${g.map((i) => `x_{${i}}`).join('')}`).join('\\,');
          let leaves = 0; strat.keep.forEach((kk) => { if (kk.startsWith(`${n}:`)) leaves++; });
          const cls = `\\${first.value === 'E' ? 'Sigma' : 'Pi'}_{${k}}`;
          return `$${pref}\\ \\varphi$ — a $${cls}$-sentence, matrix: random 3-${M.cnf ? 'CNF' : 'DNF'} with ${M.mat.length} ${M.cnf ? 'clauses' : 'terms'} · value **${levels[0][0] ? 'true' : 'false'}** (${strat.win ? '$\\exists$' : '$\\forall$'} has a winning strategy)\n`
            + `Winning strategy touches **${leaves}** of the $2^{${n}}=${1 << n}$ leaves · a depth-first evaluator with short-circuiting visits ${tr.visited} of ${(1 << (n + 1)) - 1} nodes and agrees with the bottom-up values: **${levels[0][0] === (tr.ev[tr.ev.length - 1].val) ? 'yes' : 'NO'}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Definition',
      name: 'Alternating Turing machines',
      statement: String.raw`An **alternating Turing machine** is a nondeterministic Turing machine whose non-halting states are partitioned into *existential* and *universal* states. A configuration is *accepting* if it is in an accepting state, or if it is existential and **some** successor configuration is accepting, or if it is universal and **all** successors are accepting (least fixed point, so infinite branches do not accept). The machine accepts $x$ if the start configuration is accepting. $\mathrm{ATIME}(t(n))$ and $\mathrm{ASPACE}(s(n))$ are the languages decided within the bounds on every branch. A machine with only existential states is an ordinary NTM; one with only universal states accepts exactly the complements of NTM languages.`,
      idea: String.raw`The computation tree is evaluated like a game tree: an existential node is an OR over its children, a universal node an AND, and halting leaves are the constants accept/reject (this is the NTM of toc-7.6 with the "some branch" rule applied only at $\exists$ states). The accepting computation is therefore not a path but a **subtree**: one child at each $\exists$ node and all children at each $\forall$ node. With all states existential the subtree is a single path (a certificate, NP); with all universal there is no choice and the machine accepts when every branch does (coNP); alternating the two kinds gives $\Sigma_k$ and $\Pi_k$ by running $k$ blocks of existential/universal states (3.5) — and, as 3.9 and 3.10 show, unbounded alternation reaches PSPACE and P.`,
      caption: String.raw`A schematic computation tree of depth 4 (each node a configuration). Round nodes are existential ($\lor$), square nodes universal ($\land$); leaves are halting configurations. **Click a leaf** to flip accept/reject, **click an internal node** to switch its kind between $\exists$ and $\forall$, or pick a machine type. Values flow bottom-up; the thick subtree is the *accepting subtree* (or, if the machine rejects, its dual, the refuting subtree). With all nodes existential the machine is an NTM: it accepts iff some leaf does; with all universal, iff every leaf does.`,
      deps: ['toc-7.6', 'toc-14.6'],
      refs: ['Arora–Barak ch. 5'],
      credit: 'Chandra, Kozen & Stockmeyer, 1981 (J. ACM 28(1):114–133)',
      links: { doi: 'https://doi.org/10.1145/322234.322243' },
      tags: ['alternation', 'Turing machines'],
      viz(v) {
        const D = 4;
        const types = [], leaf = [];
        const setPreset = (k) => {
          for (let d = 0; d < D; d++) { types[d] = []; for (let i = 0; i < (1 << d); i++) types[d][i] = k === 'ntm' ? 'E' : k === 'conm' ? 'A' : k === 'sig2' ? (d < 2 ? 'E' : 'A') : k === 'pi2' ? (d < 2 ? 'A' : 'E') : (d % 2 === 0 ? 'E' : 'A'); }
          const pat = k === 'ntm' ? [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] : k === 'conm' ? [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1] : [1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1];
          for (let i = 0; i < 16; i++) leaf[i] = pat[i];
        };
        setPreset('alt');
        v.select('machine', [{ value: 'ntm', label: 'NTM (all ∃)' }, { value: 'conm', label: 'all ∀' }, { value: 'sig2', label: '∃∃∀∀' }, { value: 'pi2', label: '∀∀∃∃' }, { value: 'alt', label: 'alternating ∃∀∃∀' }], 'alt', { onChange: setPreset });
        const s = v.stage({ x: [-0.6, 16.6], y: [-0.7, 6.4], axes: false, height: 400, full: true });
        const W = 16, y0 = 5.6, dy = 1.25;
        s.onClick((x, y) => {
          let best = null, bd = 0.75;
          for (let d = 0; d <= D; d++) for (let i = 0; i < (1 << d); i++) { const [nx, ny] = nodeXY(d, i, W, y0, dy), dd = Math.hypot((x - nx) * 0.85, (y - ny) * 1.1); if (dd < bd) { bd = dd; best = [d, i]; } }
          if (!best) return; const [d, i] = best;
          if (d === D) leaf[i] ^= 1; else types[d][i] = types[d][i] === 'E' ? 'A' : 'E';
        });
        let res = null;
        const evaluate = () => {
          const val = [], cost = [];
          val[D] = leaf.slice(); cost[D] = leaf.map(() => 1);
          for (let d = D - 1; d >= 0; d--) { val[d] = []; cost[d] = []; for (let i = 0; i < (1 << d); i++) { const a = val[d + 1][2 * i], b = val[d + 1][2 * i + 1]; val[d][i] = types[d][i] === 'E' ? a | b : a & b; } }
          // minimal accepting subtree (if root accepts) or refuting subtree: the player who wins keeps one child at own nodes, both at the other's
          const win = val[0][0], keep = new Set(), mine = win ? 'E' : 'A';
          const bestCost = (d, i) => { if (d === D) return 1; const c = [2 * i, 2 * i + 1].map((k) => bestCost(d + 1, k)); const ok = [2 * i, 2 * i + 1].map((k) => val[d + 1][k] === win); return types[d][i] === mine ? Math.min(...c.map((x, j) => (ok[j] ? x : 1e9))) : c[0] + c[1]; };
          const walk = (d, i) => { keep.add(`${d}:${i}`); if (d === D) return; if (types[d][i] === mine) { const c = [2 * i, 2 * i + 1].filter((k) => val[d + 1][k] === win).sort((a, b) => bestCost(d + 1, a) - bestCost(d + 1, b))[0]; walk(d + 1, c); } else { walk(d + 1, 2 * i); walk(d + 1, 2 * i + 1); } };
          walk(0, 0);
          const sz = bestCost(0, 0);
          res = { val, keep, win, sz, accLeaves: leaf.reduce((a, b) => a + b, 0), allE: types.every((r) => r.every((t) => t === 'E')), allA: types.every((r) => r.every((t) => t === 'A')) };
        };
        v.render(() => {
          evaluate();
          const { val, keep, win } = res;
          for (let d = 0; d < D; d++) for (let i = 0; i < (1 << d); i++) for (const c of [2 * i, 2 * i + 1]) {
            const [x1, y1] = nodeXY(d, i, W, y0, dy), [x2, y2] = nodeXY(d + 1, c, W, y0, dy), on = keep.has(`${d}:${i}`) && keep.has(`${d + 1}:${c}`);
            s.line(x1, y1, x2, y2, { color: on ? (win ? 'green' : 'red') : 'faint', width: on ? 3 : 1.2, alpha: on ? 1 : 0.6 });
          }
          for (let d = 0; d <= D; d++) for (let i = 0; i < (1 << d); i++) {
            const [x, y] = nodeXY(d, i, W, y0, dy), vv = val[d][i], col = vv ? 'green' : 'red', on = keep.has(`${d}:${i}`);
            if (d === D) { s.rect(x - 0.32, y - 0.24, x + 0.32, y + 0.24, { fill: col, fillAlpha: on ? 0.9 : 0.4, color: col, width: on ? 2.5 : 1 }); s.text(vv ? 'acc' : 'rej', x, y - 0.5, { align: 'center', size: 11, color: col, weight: 700 }); continue; }
            const E = types[d][i] === 'E';
            if (E) s.dot(x, y, { r: 15, color: col, hollow: !on }); else s.rect(x - 0.34, y - 0.27, x + 0.34, y + 0.27, { fill: col, fillAlpha: on ? 0.9 : 0.2, color: col, width: 2.2 });
            s.text(E ? '∃' : '∀', x, y, { align: 'center', baseline: 'middle', size: 15, weight: 800, color: on ? 'panel' : 'ink', halo: false });
          }
          s.corner(`start configuration is ${win ? 'ACCEPTING' : 'REJECTING'}`, 'tr', { color: win ? 'green' : 'red', weight: 700, plate: true });
          s.text('depth 0: start', -0.5, y0, { size: 10.5, color: 'muted' });
        });
        v.legend([['green', 'accepting configuration', { dot: true }], ['red', 'rejecting configuration', { dot: true }]]);
        v.readout(() => {
          const R = res;
          const l1 = `accepting leaves: **${R.accLeaves}** of 16 · the start configuration is **${R.win ? 'accepting' : 'rejecting'}** · ${R.win ? 'smallest accepting subtree' : 'smallest refuting subtree'} has **${R.sz}** leaves (a certificate of that size)`;
          const l2 = R.allE ? `All states existential: acts as an NTM — accepts iff some leaf accepts (${R.accLeaves > 0 ? 'true' : 'false'}): **${(R.accLeaves > 0) === (R.win === 1) ? '✓ agrees' : 'NO'}**.` : R.allA ? `All states universal: accepts iff every leaf accepts (${R.accLeaves === 16 ? 'true' : 'false'}): **${(R.accLeaves === 16) === (R.win === 1) ? '✓ agrees' : 'NO'}**.` : 'Mixed: no leaf count decides it — the tree shape matters.';
          return `${l1}\n${l2}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: 'Alternating polynomial time equals PSPACE',
      statement: String.raw`$\mathrm{AP}=\bigcup_c\mathrm{ATIME}(n^c)=\mathrm{PSPACE}$. More generally $\mathrm{ATIME}(t(n))\subseteq\mathrm{SPACE}(t(n))\subseteq\mathrm{ATIME}(t(n)^2)$ for time-constructible $t(n)\ge n$.`,
      idea: String.raw`($\supseteq$) TQBF is PSPACE-complete (toc-14.7), and an alternating machine decides it in **linear** time: on $Q_1x_1\cdots Q_nx_n\,\varphi$ it spends one step per variable, branching existentially or universally on the next bit according to $Q_i$, then evaluates $\varphi$ deterministically; the alternating acceptance rule is the semantics of the quantifiers. ($\subseteq$) Evaluate the computation tree of an alternating polynomial-time machine **depth first**: the recursion stack holds one configuration per level, so the space is (depth) $\times$ (configuration size) $=$ polynomial, even though the tree has exponentially many nodes; $\exists$ nodes return the OR, $\forall$ nodes the AND of their children's values, reusing the same space for each child. The quadratic version simulates a space-$s$ computation by alternating over midpoint configurations (as in Savitch), 3.12 uses the same trick.`,
      caption: String.raw`A random quantified formula with alternating quantifiers $\exists x_1\forall x_2\exists x_3\cdots$ is evaluated by the depth-first procedure of the proof: **step through** it. The tree shows the node being entered (gold, on the current stack), finished nodes (green true, red false) and nodes the short-circuit rule never visits (grey, crossed). The right plot is the **stack height** against the step: it never exceeds $n+1$ even though the tree has $2^{n+1}-1$ nodes — time is exponential, space is linear. The alternating machine itself would use only $n$ branching steps plus the evaluation of $\varphi$.`,
      deps: ['cplx-3.8', 'toc-14.7'],
      refs: ['Arora–Barak ch. 5'],
      credit: 'Chandra, Kozen & Stockmeyer, 1981',
      links: { doi: 'https://doi.org/10.1145/322234.322243' },
      tags: ['alternation', 'PSPACE', 'TQBF'],
      viz(v) {
        const nS = v.slider('variables $n$', 3, 6, 5, { int: true, onChange: () => { build(); S.reset(undefined, { at: 'start' }); } });
        let seed = 6; v.button('New formula', () => { seed++; build(); S.reset(undefined, { at: 'start' }); });
        let M = null;
        const build = () => {
          const n = nS.value, r = v.rng(seed * 17 + n), cl = randomCNF(r, n, Math.round(2.4 * n), 3), quant = [null];
          for (let i = 1; i <= n; i++) quant.push(i % 2 === 1 ? 'E' : 'A');
          const levels = qLevelsFn(n, quant, (a) => cnfSat(cl, a)), tr = qTrace(n, quant, levels), seen = new Set(tr.ev.filter((e) => e.kind === 'enter').map((e) => `${e.d}:${e.i}`));
          const depthSeq = tr.ev.map((e) => (e.kind === 'enter' ? e.stack.length : e.stack.length - 1));
          return (M = { n, cl, quant, levels, tr, seen, depthSeq });
        };
        build();
        const frames = () => {
          const out = [];
          M.tr.ev.forEach((e, idx) => {
            const q = M.quant[e.d + 1];
            const line = e.d === M.n ? 2 : q === 'E' ? 3 : 4;
            const note = e.kind === 'enter'
              ? (e.d === M.n ? `Reached a leaf (all ${M.n} variables set): evaluate $\\varphi$ directly.` : `Enter a node at depth ${e.d}: ${q === 'E' ? '∃' : '∀'}$x_{${e.d + 1}}$ — try the branch $x_{${e.d + 1}}=${e.i % 2}$ first or next.`)
              : `Return **${e.val ? 'true' : 'false'}** from depth ${e.d}${e.d < M.n ? (q === 'E' ? (e.val ? ' (∃ found a true child: stop)' : ' (both children false)') : (e.val ? ' (both children true)' : ' (∀ found a false child: stop)')) : ''}.`;
            out.push({ idx, line, note, hold: e.kind === 'exit' && e.d === 0 ? 3 : 1, vars: { stack: e.kind === 'enter' ? e.stack.length : e.stack.length - 1 } });
          });
          return out;
        };
        const S = v.steps({ frames, still: 70, speed: 6, codePos: 'below', codeTitle: 'Depth-first evaluation of Q₁x₁…Qₙxₙ φ', note: true, counter: 'step', code: ['eval(node at depth d):', '  if d = n: return φ(x₁…xₙ)  // leaf', '  if Q_{d+1} = ∃: return eval(x_{d+1}=0) ∨ eval(x_{d+1}=1)   // stop at the first true', '  if Q_{d+1} = ∀: return eval(x_{d+1}=0) ∧ eval(x_{d+1}=1)   // stop at the first false'] });
        const s = v.stage({ x: [-2, 22], y: [-1.2, 8.4], axes: false, height: 380, weight: 1.4, minWidth: 340, title: 'the computation tree (alternating quantifiers)' });
        const s2 = v.stage({ x: [0, 100], y: [0, 8], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xlabel: 'step of the evaluation', ylabel: 'stack height', title: 'space used' });
        v.render(() => {
          const { n, tr, quant } = M, W = 20, y0 = 7.6, dy = 6.8 / n, i = Math.min(S.i, tr.ev.length - 1), cur = tr.ev[i];
          const done = new Map(); for (let j = 0; j <= i; j++) if (tr.ev[j].kind === 'exit') done.set(`${tr.ev[j].d}:${tr.ev[j].i}`, tr.ev[j].val);
          const onStack = new Set(cur.stack.map(([d, ii]) => `${d}:${ii}`));
          for (let d = 1; d <= n; d++) s.text(`${quant[d] === 'E' ? '∃' : '∀'}x${sub(d)}`, -1.9, y0 - (d - 0.5) * dy, { size: 11.5, color: quant[d] === 'E' ? 'accent' : 'orange', weight: 700, baseline: 'middle' });
          for (let d = 0; d < n; d++) for (let ii = 0; ii < (1 << d); ii++) for (const c of [2 * ii, 2 * ii + 1]) {
            const [x1, y1] = nodeXY(d, ii, W, y0, dy), [x2, y2] = nodeXY(d + 1, c, W, y0, dy), vis = M.seen.has(`${d + 1}:${c}`);
            s.line(x1, y1, x2, y2, { color: onStack.has(`${d + 1}:${c}`) && onStack.has(`${d}:${ii}`) ? 'gold' : 'faint', width: onStack.has(`${d + 1}:${c}`) ? 3 : 1, alpha: vis ? 0.9 : 0.35, dash: !vis });
          }
          for (let d = 0; d <= n; d++) for (let ii = 0; ii < (1 << d); ii++) {
            const key = `${d}:${ii}`, [x, y] = nodeXY(d, ii, W, y0, dy), vis = M.seen.has(key), st = onStack.has(key), dv = done.get(key);
            const r = d === n ? 3.2 : clamp(11 - 1.6 * d, 3.5, 10);
            if (!vis) { s.dot(x, y, { r: r * 0.7, color: 'faint', hollow: true }); continue; }
            if (st) s.dot(x, y, { r: r + 2, color: 'gold' });
            else if (dv !== undefined) s.dot(x, y, { r, color: dv ? 'green' : 'red' });
            else s.dot(x, y, { r: r * 0.7, color: 'muted', hollow: true });
          }
          const total = (1 << (n + 1)) - 1, vis = tr.visited;
          s.corner(`visited ${vis} of ${total} nodes (short-circuit skips the rest)`, 'bl', { color: 'muted', plate: true });
          // stack plot
          const E = tr.ev.length;
          s2.setView([0, E], [0, n + 2]);
          s2.hline(n + 1, { color: 'muted', dash: true, width: 1.2 });
          s2.text(`n+1 = ${n + 1}`, E, n + 1.15, { align: 'right', size: 11, color: 'muted' });
          s2.path(M.depthSeq.map((d, j) => [j, d]), { color: 'faint', width: 1.5 });
          s2.path(M.depthSeq.slice(0, i + 1).map((d, j) => [j, d]), { color: 'accent', width: 2.4 });
          s2.dot(i, M.depthSeq[i], { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const { n, tr, levels } = M, i = Math.min(S.i, tr.ev.length - 1), cur = tr.ev[i], h = M.depthSeq[i];
          const fin = i === tr.ev.length - 1;
          return `step ${i + 1} of ${tr.ev.length} · current stack height **${h}** (max over the whole run: **${tr.maxStack}** = $n+1$) · the tree has $2^{n+1}-1=${(1 << (n + 1)) - 1}$ nodes, the run touches ${tr.visited}\n`
            + `${fin ? `Result: the sentence is **${tr.ev[tr.ev.length - 1].val ? 'true' : 'false'}** (bottom-up table agrees: **${levels[0][0] === tr.ev[tr.ev.length - 1].val ? 'yes' : 'NO'}**). ` : ''}Alternating machine: $n=${n}$ branching steps + one evaluation of $\\varphi$ ($${M.cl.length}$ clauses) = **linear** time; deterministic simulation: **linear** space, exponential time.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Alternating logarithmic space equals P',
      statement: String.raw`$\mathrm{AL}=\mathrm{ASPACE}(O(\log n))=\mathrm P$. More generally $\mathrm{ASPACE}(s(n))=\mathrm{DTIME}(2^{O(s(n))})$ for $s(n)\ge\log n$.`,
      idea: String.raw`($\mathrm{AL}\subseteq\mathrm P$) An alternating machine with $O(\log n)$ space has only polynomially many configurations (log space as in toc-14.10); build the configuration graph and compute which ones are accepting by repeated passes (the least fixed point, a monotone circuit evaluation), in polynomial time. ($\mathrm P\subseteq\mathrm{AL}$) The values of a polynomial-size circuit — the standard P-complete problem CIRCUIT VALUE — are decided by a log-space alternating machine that plays a game: an existential player asserts that a gate has value 1; at an OR gate it names a child it claims is 1, at an AND gate the universal player picks the child to challenge; at an input it checks the bit. The only thing the machine ever stores is the *current gate* ($\log$ bits), which is why a polynomially large circuit needs only logarithmic space.`,
      caption: String.raw`A random monotone circuit (bottom: inputs, top: output) with $\land$ and $\lor$ gates. **Click an input** to flip its bit. The existential player claims “the output is 1”; the pointer (gold) walks down: at an $\lor$ gate $\exists$ names a child it claims is 1, at an $\land$ gate $\forall$ names a child to challenge, and at an input the bit decides. Both players play optimally by default (press **Play**); turn on **I play ∀** to make the challenges yourself by clicking a child. The readout compares the game's winner with the ordinary bottom-up circuit value and shows the entire memory the machine needs: one gate number.`,
      deps: ['cplx-3.8', 'toc-14.10'],
      refs: ['Arora–Barak ch. 5'],
      credit: 'Chandra, Kozen & Stockmeyer, 1981',
      links: { doi: 'https://doi.org/10.1145/322234.322243' },
      tags: ['alternation', 'log space', 'circuit value'],
      viz(v) {
        let seed = 5, G = null, path = [], human = false;
        const humanT = v.toggle('I play ∀', false, { onChange: (x) => { human = x; reset(); } });
        const sizes = [6, 4, 3, 2, 1], y0 = 0.5, dyL = 1.7;
        const build = () => {
          const r = v.rng(seed * 101 + 7), layer = [], nodes = [];
          sizes.forEach((m, l) => { layer[l] = []; for (let i = 0; i < m; i++) { const id = nodes.length; layer[l].push(id); nodes.push({ id, l, i, type: l === 0 ? 'in' : (r() < 0.5 ? 'and' : 'or'), kids: [], x: (10 * (i + 0.5)) / m, y: y0 + l * dyL, val: l === 0 ? (r() < 0.55 ? 1 : 0) : 0 }); } });
          for (let l = 1; l < sizes.length; l++) for (const id of layer[l]) { const below = layer[l - 1]; const a = Math.floor(r() * below.length); let b = Math.floor(r() * below.length); if (b === a) b = (b + 1) % below.length; nodes[id].kids = l === sizes.length - 1 ? [below[0], below[1]].slice(0, 2) : [below[a], below[b]]; }
          // the top gate: make its children the two top-layer gates
          nodes[nodes.length - 1].kids = layer[sizes.length - 2].slice(0, 2);
          G = { nodes, layer, root: nodes.length - 1, bits: Math.ceil(Math.log2(nodes.length)) };
          G.nodes.forEach((n) => { n.val = n.type === 'in' ? n.val : 0; });
        };
        const evalAll = () => { for (const n of G.nodes) if (n.type !== 'in') { const a = G.nodes[n.kids[0]].val, b = G.nodes[n.kids[1]].val; n.val = n.type === 'and' ? a & b : a | b; } };
        const choose = (g) => { const [a, b] = g.kids.map((k) => G.nodes[k]); if (g.type === 'or') return (a.val || !b.val ? a : b).id; return (!a.val || b.val ? a : b).id; };
        const stepOnce = () => { const g = G.nodes[path[path.length - 1]]; if (g.type === 'in') return false; if (g.type === 'and' && human) return false; path.push(choose(g)); return true; };
        const reset = () => { path = [G.root]; evalAll(); while (stepOnce()); v.invalidate(); };
        build(); evalAll(); reset();
        v.button('Play', () => { while (stepOnce()); });
        v.button('Step', () => { stepOnce(); });
        v.button('Restart at output', () => { path = [G.root]; });
        v.button('New circuit', () => { seed++; build(); reset(); });
        const s = v.stage({ x: [-0.8, 10.8], y: [-0.5, 7.9], axes: false, height: 430, full: true });
        s.onClick((x, y) => {
          let best = null, bd = 0.55;
          for (const n of G.nodes) { const d = Math.hypot((x - n.x) * 1.0, (y - n.y) * 1.0); if (d < bd) { bd = d; best = n; } }
          if (!best) return;
          const cur = G.nodes[path[path.length - 1]];
          if (best.type === 'in' && !(cur.type === 'and' && human && cur.kids.includes(best.id))) { best.val ^= 1; evalAll(); path = [G.root]; while (stepOnce()); return; }
          if (human && cur.type === 'and' && cur.kids.includes(best.id)) { path.push(best.id); while (stepOnce()); }
        });
        const minimax = (id, memo = new Map()) => { if (memo.has(id)) return memo.get(id); const n = G.nodes[id]; let r; if (n.type === 'in') r = n.val; else { const a = minimax(n.kids[0], memo), b = minimax(n.kids[1], memo); r = n.type === 'or' ? (a | b) : (a & b); } memo.set(id, r); return r; };
        v.render(() => {
          evalAll();
          const cur = G.nodes[path[path.length - 1]], onPath = new Set(path);
          s.dot(cur.x, cur.y, { r: 24, color: 'gold', hollow: true });
          for (const n of G.nodes) n.kids.forEach((k) => { const c = G.nodes[k], on = onPath.has(n.id) && onPath.has(k) && path.indexOf(k) === path.indexOf(n.id) + 1; s.line(n.x, n.y, c.x, c.y, { color: on ? 'gold' : 'faint', width: on ? 4 : 1.3, alpha: on ? 1 : 0.7 }); });
          for (const n of G.nodes) {
            const col = n.val ? 'green' : 'red', isCur = n === cur;
            if (n.type === 'in') { s.rect(n.x - 0.28, n.y - 0.24, n.x + 0.28, n.y + 0.24, { fill: col, fillAlpha: 0.75, color: col, width: isCur ? 3 : 1 }); s.text(String(n.val), n.x, n.y, { align: 'center', baseline: 'middle', size: 14, weight: 800, color: 'panel', halo: false }); s.text(`x${sub(n.i + 1)}`, n.x, n.y - 0.55, { align: 'center', size: 11, color: 'muted' }); }
            else { s.dot(n.x, n.y, { r: 17, color: col, hollow: !isCur && !onPath.has(n.id) }); s.text(n.type === 'and' ? '∧' : '∨', n.x, n.y, { align: 'center', baseline: 'middle', size: 18, weight: 800, color: (isCur || onPath.has(n.id)) ? 'panel' : 'ink', halo: false }); }
            s.text(String(n.id), n.x + 0.34, n.y + 0.34, { size: 9.5, color: 'muted', halo: false });
          }
          const root = G.nodes[G.root]; s.text(`claim: output = 1 (it is ${root.val})`, 10.7, 7.55, { align: 'right', size: 13, weight: 700, color: root.val ? 'green' : 'red' });
          if (human && cur.type === 'and') { cur.kids.forEach((k) => { const c = G.nodes[k]; s.circle(c.x, c.y, 0.5, { color: 'orange', width: 3, fill: false }); }); s.text('your move as ∀: click a child to challenge', -0.6, 7.55, { size: 12, color: 'orange', weight: 700 }); }
        });
        v.legend([['gold', 'pointer (the machine’s whole memory)', { dot: true }], ['green', 'gate or input = 1', { dot: true }], ['red', 'gate or input = 0', { dot: true }]]);
        v.readout(() => {
          const cur = G.nodes[path[path.length - 1]], atInput = cur.type === 'in', root = G.nodes[G.root];
          const winE = atInput ? (cur.val === 1) : null, game = minimax(G.root);
          const bin = cur.id.toString(2).padStart(G.bits, '0');
          const l1 = `pointer at gate **${cur.id}** (binary ${bin}) · memory: **${G.bits} bits** for a circuit of ${G.nodes.length} gates · path length ${path.length - 1}${atInput ? ` · input $x_{${cur.i + 1}}=${cur.val}$: **${winE ? '∃ wins this play' : '∀ wins this play'}**` : (human && cur.type === 'and' ? ' · waiting for your challenge' : '')}`;
          const l2 = `With optimal play the winner is **${game ? '∃' : '∀'}**; the circuit's value is **${root.val}**: ${game === root.val ? '**they agree** (∃ wins iff the output is 1)' : '**MISMATCH**'}. Configurations of the machine = gates, so there are only ${G.nodes.length}, polynomially many.`;
          return `${l1}\n${l2}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'PH ⊆ PSPACE',
      statement: String.raw`$\Sigma_k^{\mathsf p}\cup\Pi_k^{\mathsf p}\subseteq\mathrm{PSPACE}$ for every $k$, hence $\mathrm{PH}\subseteq\mathrm{PSPACE}$. In fact $\Sigma_k\mathrm{SAT}\in\mathrm{SPACE}(n)$ for each fixed $k$ (indeed TQBF with any number of alternations is in linear space), and if PH $=$ PSPACE then PH collapses to a finite level (a PSPACE-complete problem such as TQBF would lie in some $\Sigma_k$, and every PSPACE problem reduces to it).`,
      idea: String.raw`A $\Sigma_k$ language is $\exists u_1\forall u_2\cdots Q_ku_k\,V$ with polynomial-length blocks. Enumerate $u_1$ in lexicographic order, reusing the same tape cells for each candidate, and for each recursively decide the remaining $\Pi_{k-1}$ statement; accept if some candidate works. The recursion has depth $k$ (a constant) and each level keeps one block and the loop counter, so the space is $O(k\cdot p(n))$ plus the space of $V$; time is exponential, space polynomial. This is the depth-first evaluator that decides TQBF (toc-14.7, 3.9), run with a bounded number of alternations.`,
      caption: String.raw`The evaluator of 3.9 run on random quantified formulas with $k$ alternating blocks of $b$ variables each, for $k=1,2,3,\dots$. The **solid green line is space** (the deepest recursion level, which equals the number of variables $n=kb$ plus one frame); the **red line is time** (nodes of the game tree actually visited, with short-circuiting), and the dashed red line is the worst case $2^{n+1}-1$. On the log axis space is a slowly rising line while time races away: *time grows exponentially in $k$, space only linearly*. Move the highlight to read the exact values and change $b$ or draw a new formula; the formulas are random, so time varies from instance to instance but never exceeds the dashed curve.`,
      deps: ['cplx-3.5', 'toc-14.7'],
      refs: ['Arora–Barak ch. 5'],
      credit: 'Stockmeyer, 1976',
      tags: ['PSPACE', 'polynomial hierarchy', 'space'],
      viz(v) {
        const bS = v.select('variables per block $b$', [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }], 1);
        const kS = v.slider('highlight level $k$', 1, 14, 5, { int: true });
        let seed = 9; v.button('New formulas', () => { seed++; });
        const s = v.stage({ x: [0, 15], y: [0.8, 3e5], ylog: true, axes: 'box', gutter: true, height: 430, full: true, xlabel: 'number of alternating blocks k  (n = k·b variables)', ylabel: 'steps / cells' });
        const cache = new Map();
        const run = (k, b) => {
          const key = `${seed}:${k}:${b}`; if (cache.has(key)) return cache.get(key);
          const n = k * b, r = v.rng(seed * 997 + n), cl = randomCNF(r, n, Math.round(2.6 * n), 3), a = Array(n + 1).fill(0);
          let nodes = 0, maxD = 0;
          const quant = (d) => (Math.floor((d - 1) / b) % 2 === 0 ? 'E' : 'A');
          const rec = (d) => {
            nodes++; maxD = Math.max(maxD, d);
            if (d === n) return cnfSat(cl, a) ? 1 : 0;
            const q = quant(d + 1); a[d + 1] = 0; const x = rec(d + 1);
            if (q === 'E' ? x : !x) return x; a[d + 1] = 1; return rec(d + 1);
          };
          const val = rec(0);
          const out = { n, nodes, space: maxD + 1, val, worst: 2 ** (n + 1) - 1 };
          cache.set(key, out); return out;
        };
        let rows = [];
        v.render(() => {
          const b = +bS.value, K = Math.floor(14 / b); rows = [];
          for (let k = 1; k <= K; k++) rows.push({ k, ...run(k, b) });
          s.setView([0, K + 1], [0.8, 3e5]);
          s.path(rows.map((x) => [x.k, x.worst]), { color: 'red', width: 1.6, dash: true });
          s.path(rows.map((x) => [x.k, x.nodes]), { color: 'red', width: 2.6 });
          s.path(rows.map((x) => [x.k, x.space]), { color: 'green', width: 2.6 });
          s.dots(rows.map((x) => [x.k, x.nodes]), { color: 'red', r: 4 }); s.dots(rows.map((x) => [x.k, x.space]), { color: 'green', r: 4 });
          const h = rows[Math.min(kS.value, K) - 1];
          s.dot(h.k, h.nodes, { r: 9, color: 'gold', hollow: true }); s.dot(h.k, h.space, { r: 9, color: 'gold', hollow: true });
          s.text('time: nodes visited', K * 0.6, rows[Math.max(0, Math.round(K * 0.6) - 1)].nodes * 0.5, { color: 'red', size: 12, align: 'right', weight: 700 });
          s.text('space: n + 1 cells', K + 0.9, 4, { color: 'green', size: 12, align: 'right', weight: 700, baseline: 'bottom' });
          s.text('worst case 2ⁿ⁺¹ − 1', K * 0.45, rows[Math.max(0, Math.round(K * 0.45) - 1)].worst * 3, { color: 'red', size: 11, align: 'right', alpha: 0.8 });
        });
        v.legend([['red', 'time (nodes visited)'], ['red', 'worst-case time', { dash: true }], ['green', 'space (stack frames)']]);
        v.readout(() => {
          const b = +bS.value, K = Math.floor(14 / b), h = rows[Math.min(kS.value, K) - 1];
          return `$k=${h.k}$ blocks, $n=${h.n}$ variables, a $\\Sigma_{${h.k}}$ instance (random, value **${h.val ? 'true' : 'false'}**) · space **${h.space}** cells · time **${h.nodes.toLocaleString('en-US')}** nodes (worst case ${h.worst.toLocaleString('en-US')})\n`
            + `Growth: from $k=1$ to $k=${K}$ the space goes ${rows[0].space} → ${rows[K - 1].space} (linear) while the time goes ${rows[0].nodes.toLocaleString('en-US')} → ${rows[K - 1].nodes.toLocaleString('en-US')}; the evaluator needs ${'space $O(n)$'} for **every** $k$ — that is why all of PH lies in PSPACE. (Range limited to $n\\le14$ so the page stays fast.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Time–space lower bounds for SAT',
      statement: String.raw`**Lipton–Viglas.** SAT has no deterministic algorithm that runs in time $n^{c}$ and space $n^{o(1)}$ for any constant $c<\sqrt2$ (on random-access machines). Later alternation-trading proofs push the exponent: to the golden ratio $\varphi\approx1.618$ (Fortnow–van Melkebeek), and to $2\cos(\pi/7)\approx1.801$ (Williams), which is the best known and is the limit of this proof technique. The theorem says nothing against fast algorithms that use much space (SAT is in time $2^{O(n)}$, say), nor against linear-space algorithms.`,
      idea: String.raw`Suppose SAT $\in\mathrm{DTISP}(n^c,n^{o(1)})$. Then by the quasi-linear Cook–Levin reduction (toc-13.4) $\mathrm{NTIME}(n^a)\subseteq\mathrm{DTISP}(n^{ac},n^{o(1)})$ for every $a\ge1$. **Speed-up by alternation:** a small-space deterministic computation of length $T$ can be checked in $\Sigma_2$ time $\approx\sqrt T$ — $\exists$ guess $k$ intermediate configurations (each of $s=n^{o(1)}$ bits), $\forall$ pick one of the $k$ segments, then rerun just that segment of $T/k$ steps; with $k=\sqrt T$ the cost is $\approx\sqrt T$. So $\mathrm{NTIME}(n^a)\subseteq\Sigma_2\mathrm{TIME}(n^{ac/2})$. The $\forall$ part is a $\mathrm{coNTIME}(n^{ac/2})$ question, which the assumption turns back into deterministic time $n^{(ac/2)c}$: altogether $\mathrm{NTIME}(n^a)\subseteq\mathrm{NTIME}(n^{ac^2/2})$. For $c<\sqrt2$ this exponent is below $a$, contradicting the nondeterministic time hierarchy theorem (1.5). Williams' and Fortnow–van Melkebeek's bounds repeat such speed-ups in cleverer orders.`,
      caption: String.raw`**Left:** the three-step argument for a hypothetical algorithm with time exponent $c$ (drag it) starting from $\mathrm{NTIME}(n^a)$; bars show the exponents, and when the final bar falls below the first (red) the nondeterministic time hierarchy is contradicted. **Middle:** the final exponent $ac^2/2$ against $c$: it dips below $a$ exactly when $c<\sqrt2$; the later records are marked on the $c$ axis (they use longer chains of the same trick, not drawn here). **Bottom:** the engine, live. A fixed 10-bit machine runs $T$ steps; the $\exists$ player claims $k+1$ checkpoint states, the $\forall$ player's $k$ segment checks each cost $T/k$ steps, total $ks+T/k$ (minimum at $k\approx\sqrt{T/s}$). Switch on **cheating prover** to corrupt one checkpoint and see which segment checks fail.`,
      deps: ['cplx-3.8', 'cplx-1.5'],
      refs: ['Arora–Barak ch. 5'],
      credit: 'Lipton & Viglas, 1999 (√2); Fortnow & van Melkebeek, 2000 (golden ratio); Williams, 2008 (2cos(π/7))',
      links: { doi: 'https://doi.org/10.1109/sffcs.1999.814618' },
      scope: String.raw`Machine model: random-access machines; "space $n^{o(1)}$" means sublinear-polynomial; the bounds are for deterministic algorithms and say nothing when the space is allowed to be polynomial.`,
      tags: ['lower bounds', 'SAT', 'alternation'],
      viz(v) {
        const cS = v.slider('time exponent $c$ of the assumed algorithm', 1.05, 2, 1.3, { step: 0.005 });
        const aS = v.slider('start class $\\mathrm{NTIME}(n^a)$, $a=$', 1.2, 4, 2, { step: 0.05 });
        const kS = v.slider('checkpoints $k$', 2, 500, 64, { int: true, log: true });
        const cheat = v.toggle('cheating prover (corrupt a checkpoint)', false);
        const T = 4096, SB = 10, mask = (1 << SB) - 1;
        const step = (x) => ((x * 5 + 3) & mask) ^ (x >> 2);
        const traj = [0b1010011101]; for (let t = 0; t < T; t++) traj.push(step(traj[t]));
        const s1 = v.stage({ x: [-0.5, 4.5], y: [-0.9, 6.2], axes: false, height: 300, weight: 1.15, minWidth: 330, title: 'the chain of inclusions (bars = exponents)' });
        const s2 = v.stage({ x: [1, 2], y: [0.4, 2.2], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 300, xlabel: 'assumed time exponent c', ylabel: 'final exponent a·c²/2  (a = 1)', title: 'where the chain contradicts the hierarchy' });
        const s3 = v.stage({ x: [0, 1], y: [0, 3.2], axes: false, height: 230, full: true, title: `a deterministic ${SB}-bit machine, T = ${T} steps, cut into k segments` });
        const s4 = v.stage({ x: [1, 500], y: [300, 5000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 230, full: true, xlabel: 'checkpoints k', ylabel: 'cost  k·s + T/k', title: 'the cost of the ∃∀ simulation' });
        const h = s2.handle(1.3, 1, { color: 'gold', r: 8, constrain: (x) => [clamp(x, 1.05, 2), 1] });
        h.onDrag = () => { cS.set(Math.round(h.x * 1000) / 1000); };
        let info = null;
        const marks = [[Math.SQRT2, '√2', 'Lipton–Viglas 1999'], [(1 + Math.sqrt(5)) / 2, 'φ', 'Fortnow–van Melkebeek 2000'], [2 * Math.cos(Math.PI / 7), '2cos(π/7)', 'Williams 2008']];
        v.render(() => {
          const c = cS.value, a = aS.value;
          // chain
          const e = [a, a * c, (a * c) / 2, (a * c * c) / 2], names = ['NTIME(nᵃ)', 'DTISP(nᵃᶜ, small)', 'Σ₂TIME(nᵃᶜ/²)', 'NTIME(nᵃᶜ²/²)'], ok = e[3] >= a - 1e-9, valid = e[2] >= 1;
          s1.setView([-0.5, 4.5], [-0.9, Math.max(6.2, e[1] * 1.15)]);
          e.forEach((x, i) => {
            const col = i === 3 ? (ok ? 'green' : 'red') : i === 0 ? 'accent' : 'muted';
            s1.rect(i + 0.12, 0, i + 0.88, x, { fill: col, fillAlpha: 0.4, color: col, width: 2 });
            s1.text(x.toFixed(3), i + 0.5, x, { align: 'center', baseline: 'bottom', size: 12, weight: 700, color: col, dy: -3 });
            s1.text(names[i], i + 0.5, -0.45, { align: 'center', baseline: 'middle', size: 9.5, color: 'muted' });
          });
          s1.hline(a, { color: 'accent', dash: true, width: 1.4 });
          s1.corner(ok ? 'no contradiction: ac²/2 ≥ a' : 'ac²/2 < a: contradicts the NTIME hierarchy (1.5)', 'tr', { color: ok ? 'muted' : 'red', weight: 700, plate: true });
          // middle
          const f = (x) => (x * x) / 2;
          s2.fn(f, { domain: [1, 2], color: 'accent', width: 2.6 });
          s2.hline(1, { color: 'red', dash: true, width: 1.4 });
          s2.vband(1, Math.SQRT2, { color: 'red', alpha: 0.1 });
          marks.forEach(([x, l, who], i) => { s2.vline(x, { color: i === 0 ? 'red' : 'muted', dash: true, width: 1.2, alpha: 0.8 }); s2.text(l, x, 2.12 - 0.12 * (i % 2) - (i === 2 ? 0 : 0), { align: 'center', size: 11, color: i === 0 ? 'red' : 'muted', weight: 700 }); });
          s2.text('contradiction (c < √2)', 1.04, 0.55, { size: 11, color: 'red' });
          h.set(c, 1);
          s2.dot(c, f(c), { r: 6, color: 'gold' });
          // segments
          const k = kS.value, seg = T / k, q = Math.floor(v.rng(3)() * (k - 1)) + 1; // corrupted checkpoint index in 1..k-1
          const cp = []; for (let i = 0; i <= k; i++) cp.push(traj[Math.round((i * T) / k)]);
          const claimed = cp.slice(); if (cheat.value) claimed[q] ^= 1 << 3;
          const bad = []; for (let i = 0; i < k; i++) { let x = claimed[i]; const a0 = Math.round((i * T) / k), a1 = Math.round(((i + 1) * T) / k); for (let t = a0; t < a1; t++) x = step(x); bad.push(x !== claimed[i + 1]); }
          const nbad = bad.filter(Boolean).length;
          for (let i = 0; i < k; i++) {
            const x0 = i / k, x1 = (i + 1) / k;
            s3.rect(x0, 1.4, x1, 2.4, { fill: bad[i] ? 'red' : 'green', fillAlpha: bad[i] ? 0.75 : 0.28, color: bad[i] ? 'red' : 'muted', width: k > 100 ? 0.3 : 1 });
          }
          for (let i = 0; i <= k; i += Math.max(1, Math.round(k / 64))) s3.line(i / k, 2.4, i / k, 2.55, { color: cheat.value && i === q ? 'red' : 'accent', width: cheat.value && i === q ? 3 : 1 });
          s3.text('time 0', 0, 2.8, { size: 11, color: 'muted' }); s3.text(`time T = ${T}`, 1, 2.8, { size: 11, color: 'muted', align: 'right' });
          s3.text(`∃ writes k+1 = ${k + 1} checkpoints of ${SB} bits = ${(k + 1) * SB} bits;  ∀ picks a segment; the check reruns T/k = ${seg.toFixed(1)} steps`, 0, 0.75, { size: 12.5, color: 'ink' });
          s3.text(nbad ? `${nbad} segment check${nbad > 1 ? 's' : ''} FAIL (red): the cheating prover is caught by the ∀ player` : 'every segment check passes (green): the claim is consistent with the real run', 0, 0.25, { size: 12.5, color: nbad ? 'red' : 'green', weight: 700 });
          // cost
          const cost = (kk) => kk * SB + T / kk, kmin = Math.sqrt(T / SB);
          s4.fn(cost, { domain: [1, 500], color: 'accent', width: 2.4, n: 200 });
          s4.hline(T, { color: 'muted', dash: true, width: 1.2 }); s4.text('T = 4096 steps (no speed-up)', 480, T * 1.08, { size: 11, color: 'muted', align: 'right' });
          s4.vline(kmin, { color: 'green', dash: true, width: 1.2 }); s4.text(`k ≈ √(T/s) = ${kmin.toFixed(1)}`, kmin * 1.06, 330, { size: 11, color: 'green' });
          s4.dot(k, cost(k), { r: 7, color: 'gold' });
          info = { e, ok, valid, c, a, nbad, cost: cost(k), kmin, minCost: cost(Math.round(kmin)), k };
        });
        v.legend([['accent', 'assumed / start class'], ['green', 'consequence consistent'], ['red', 'contradiction']]);
        v.readout(() => {
          const I = info;
          return `$c=${v.fix(I.c, 3)}$, $a=${v.fix(I.a, 2)}$: $\\mathrm{NTIME}(n^{${v.fix(I.a, 2)}})\\subseteq\\mathrm{NTIME}(n^{${v.fix(I.e[3], 3)}})$ — ${I.ok ? 'no contradiction' : '**contradiction** with the nondeterministic time hierarchy'}${I.valid ? '' : ' (the middle step needs $ac/2\\ge1$: increase $a$)'} · threshold $\\sqrt2=${v.fix(Math.SQRT2, 4)}$ (computed from $c^2/2=1$)\n`
            + `Simulation: $k=${I.k}$ checkpoints cost $ks+T/k=${Math.round(I.cost)}$ steps against $T=${T}$ (best $k\\approx${v.fix(I.kmin, 1)}$ gives about ${Math.round(I.minCost)}, i.e. about $2\\sqrt{Ts}$) · segment checks failing: **${I.nbad}**.\n`
            + `Known records (exponent $c$ below which "time $n^c$ and space $n^{o(1)}$" is impossible): $\\sqrt2\\approx1.414$ → $\\varphi\\approx${v.fix((1 + Math.sqrt(5)) / 2, 3)}$ → $2\\cos(\\pi/7)\\approx${v.fix(2 * Math.cos(Math.PI / 7), 4)}$; the 2cos(π/7) value is the limit of alternation-trading proofs.`;
        });
      },
    },
  ],
};
