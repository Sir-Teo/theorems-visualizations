// Computational Complexity — Chapter 4: Boolean circuits
// Part 1 (this file, with the chapter title and summary): 4.1–4.7 — circuits and their size, Shannon's counting argument,
// Lupanov's O(2^n/n) upper bound, P/poly and advice, P ⊆ P/poly by unrolling a machine, undecidable languages in P/poly,
// CIRCUIT-SAT. Part 2 is ch04-b.js (4.8–4.14).
//
// Honesty notes. Circuit values, sizes, depths, truth tables, the Lupanov-style block-sharing gate counts (built and
// verified against the truth table), tableaux of real Turing-machine runs and the halting data for 3-state machines are all
// computed on screen. The counting bound in 4.2 is the standard upper bound on the number of circuits, not an exact count.
import {synthesisDNF, synthesisMux, sizeC as auditedSize} from './circuit-source-audit.shared.js';
import {
  clamp, big, sup, newC, addIn, addG, evalC, levelsC, sizeC, depthC, layoutC, drawC, adderC, majC, xorC, factorC, GATE_NAME,
  log2Circuits, shannonThreshold, lupanov, lupanovBest, randomTable, tableauTM, MACHINES, padBits,
  smallTM, runSmallTM,
} from './ch04.shared.js';

const bits = (m, w) => m.toString(2).padStart(w, '0');
const CYCLE = ['and', 'or', 'xor', 'nand', 'nor'];

export default {
  collection: 'cplx',
  chapter: 4,
  title: 'Boolean circuits',
  summary: String.raw`Circuits are a non-uniform model: a separate wiring for each input length. Counting shows that almost every Boolean function needs exponentially large circuits, yet no explicit function in NP is known to need more than a linear number of gates. Polynomial-size circuits capture P with advice; the Karp–Lipton theorem says NP is unlikely to have them. Shallow circuits model parallel computation, and the circuit value problem marks the edge of what parallelism can speed up.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Boolean circuits and circuit size',
      statement: String.raw`A **Boolean circuit** with $n$ inputs is a directed acyclic graph whose sources are the input variables $x_1,\dots,x_n$ (or the constants $0,1$) and whose other nodes are **gates** labelled $\wedge$, $\vee$ or $\neg$ (fan-in $2,2,1$); some gates are designated outputs. Each gate computes the Boolean function of its inputs, so the circuit computes a function $f:\{0,1\}^n\to\{0,1\}^m$. Its **size** is the number of gates and its **depth** is the length of the longest path from an input to an output. A circuit handles one input length only: a language $L\subseteq\{0,1\}^*$ is decided by a *family* $(C_n)_{n\ge1}$, with $C_n$ deciding $L\cap\{0,1\}^n$, and the size of the family is the function $n\mapsto|C_n|$.`,
      idea: String.raw`A circuit is a straight-line program with no loops and with sharing: a gate's value can feed many later gates, which is exactly what separates a circuit from a formula (a circuit whose gates all have fan-out one). Two resources are measured: size, roughly sequential time, and depth, roughly parallel time. Every function on $n$ bits has some circuit, because it can be written as a disjunction of minterms, so the question is never *whether* but *how large*; that is what the next results (4.2, 4.3) settle for the typical function.

Existence of a circuit for every truth table is the canonical DNF construction (logic-2.5): form one minterm for each true row and OR the minterms. Each minterm is true at exactly its own row, so the resulting circuit computes precisely the prescribed function. Constants handle an empty set of true rows; this construction proves existence without a small-size guarantee.`,
      caption: String.raw`**Click an input** (blue circle) to flip it, or **click a cell** of the grid on the right (rows and columns are the first and last inputs) to set the inputs directly. **Click a two-input gate** to cycle its type through AND, OR, XOR, NAND, NOR: the wiring stays, the function changes, and the grid redraws. Green wires carry 1. Try the ripple-carry adder with 1 to 4 bits and watch size grow like $5n-3$ and depth like $2n-1$.`,
      deps: ['toc-1.9', 'logic-2.5'],
      refs: ['Arora–Barak ch. 6'],
      credit: 'Shannon, 1938 (switching circuits as Boolean expressions); circuit size as a complexity measure: Shannon, 1949',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Boolean_circuit' },
      tags: ['circuits', 'size', 'depth'],
      viz(v) {
        let C, lay, hits = [], x = [];
        const build = () => {
          C = v_preset.value === 'add' ? adderC(nb.value) : v_preset.value === 'maj' ? majC() : xorC();
          lay = layoutC(C); x = new Array(C.inputs.length).fill(0);
          outBit.el.hidden = C.outs.length < 2;
        };
        const v_preset = v.select('circuit', [{ value: 'add', label: 'ripple-carry adder' }, { value: 'maj', label: 'majority of 3' }, { value: 'xor', label: 'XOR from ∧ ∨ ¬' }], 'add', { onChange: () => { build(); } });
        const nb = v.slider('adder bits n', 1, 4, 2, { int: true, onChange: () => build() });
        const outBit = v.slider('output bit shown in grid', 0, 4, 0, { int: true });
        v.button('Reset gates', () => build());
        const s = v.stage({ x: [-0.03, 1.05], y: [-0.02, 1.02], axes: false, height: 380, weight: 1.7, minWidth: 340, title: 'the circuit (click inputs and gates)' });
        const g = v.stage({ x: [0, 1], y: [0, 1], axes: false, equal: true, height: 380, weight: 0.9, minWidth: 250, title: 'truth table of one output bit' });
        build();
        let gridInfo = null;
        s.onClick((px, py) => {
          let best = null, bd = 1e9;
          for (const h of hits) { const d = Math.hypot(s.X(h.x) - s.X(px), s.Y(h.y) - s.Y(py)); if (d < bd) { bd = d; best = h; } }
          if (!best || bd > 20) return;
          const G = C.g[best.id];
          if (G.t === 'in') { const k = C.inputs.indexOf(best.id); x[k] ^= 1; }
          else if (G.ins.length === 2 && G.t !== 'not') G.t = CYCLE[(CYCLE.indexOf(G.t) + 1) % CYCLE.length];
        });
        g.onClick((px, py) => {
          if (!gridInfo) return;
          const { R, Cc, n, cell, x0, y0 } = gridInfo;
          const c = Math.floor((px - x0) / cell), r = Math.floor((y0 - py) / cell);
          if (r < 0 || r >= R || c < 0 || c >= Cc) return;
          const hiN = Math.ceil(n / 2), loN = n - hiN;
          for (let i = 0; i < hiN; i++) x[i] = (r >> (hiN - 1 - i)) & 1;
          for (let i = 0; i < loN; i++) x[hiN + i] = (c >> (loN - 1 - i)) & 1;
        });
        v.render(() => {
          const vals = evalC(C, x);
          hits = drawC(s, C, lay, { vals, r: 11 });
          C.outs.forEach((o, k) => { const [px, py] = lay.pos[o]; s.text(C.outs.length > 1 ? `o${k}` : 'out', px, py, { dx: 0, dy: -20, align: 'center', size: 11, color: 'accent', weight: 700 }); });
          // truth table grid for the chosen output bit
          const n = C.inputs.length, hiN = Math.ceil(n / 2), loN = n - hiN, R = 1 << hiN, Cc = 1 << loN, ob = Math.min(outBit.value, C.outs.length - 1);
          const cell = Math.min(0.98 / R, 0.98 / Cc), x0 = 0.5 - cell * Cc / 2, y0 = 0.5 + cell * R / 2;
          gridInfo = { R, Cc, n, cell, x0, y0 };
          for (let r = 0; r < R; r++) for (let c = 0; c < Cc; c++) {
            const inp = []; for (let i = 0; i < hiN; i++) inp.push((r >> (hiN - 1 - i)) & 1); for (let i = 0; i < loN; i++) inp.push((c >> (loN - 1 - i)) & 1);
            const y = evalC(C, inp)[C.outs[ob]];
            g.rect(x0 + c * cell, y0 - (r + 1) * cell, x0 + (c + 1) * cell, y0 - r * cell, { fill: y ? 'green' : 'grid', fillAlpha: y ? 0.55 : 0.25, color: 'panel', width: 1 });
          }
          let cr = 0, cc = 0; for (let i = 0; i < hiN; i++) cr = cr * 2 + x[i]; for (let i = 0; i < loN; i++) cc = cc * 2 + x[hiN + i];
          g.rect(x0 + cc * cell, y0 - (cr + 1) * cell, x0 + (cc + 1) * cell, y0 - cr * cell, { color: 'ink', width: 2.6, stroke: true });
          g.text(`rows: ${C.g[C.inputs[0]].name}…${C.g[C.inputs[hiN - 1]].name}`, x0 + cell * Cc / 2, y0 + 0.03, { align: 'center', size: 10, color: 'muted' });
          g.text(loN ? `columns: ${C.g[C.inputs[hiN]].name}…${C.g[C.inputs[n - 1]].name}` : '', x0 + cell * Cc / 2, y0 - cell * R - 0.03, { align: 'center', size: 10, color: 'muted' });
        });
        v.readout(() => {
          const vals = evalC(C, x), L = levelsC(C), outs = C.outs.map((o) => vals[o]);
          let line = `size $=${sizeC(C)}$ gates, depth $=${depthC(C)}$, ${C.inputs.length} inputs`;
          if (v_preset.value === 'add') {
            const n = nb.value, a = parseInt(x.slice(0, n).reverse().join('') || '0', 2), b = parseInt(x.slice(n).reverse().join('') || '0', 2), o = parseInt(outs.slice().reverse().join(''), 2);
            line += `\n$a=${a}$, $b=${b}$, circuit output $=${o}$ ${o === a + b ? '$= a+b$ ✓' : '$\\ne a+b$ (a gate was changed)'}`;
          } else line += `\noutput $=${outs.join('')}$ on input $${x.join('')}$`;
          return line;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Most functions need circuits of size about 2ⁿ/n (Shannon)',
      statement: String.raw`There are $2^{2^n}$ Boolean functions $\{0,1\}^n\to\{0,1\}$, but only $2^{O(s\log s)}$ circuits of size $s$ (for $s\ge n$). Hence for every $\varepsilon>0$ and large $n$, all but a vanishing fraction of the functions on $n$ bits need circuits of size at least $c\,2^n/n$ for a constant $c>0$: precisely, the number of functions computable with at most $s$ gates over $\{\wedge,\vee,\neg\}$ is below $\big(3(s+n)^2\big)^s$, and this is smaller than $2^{2^n}$ as soon as $s\le c\,2^n/n$ for a suitable constant $c>0$. In particular there are functions of $n$ inputs whose circuits need $\Omega(2^n/n)$ gates; the proof is non-constructive.`,
      idea: String.raw`It is a pigeonhole argument (comb-1.2): a circuit of size $s$ is described by choosing, for each of its $s$ gates, a type and two earlier wires among at most $s+n$ — so at most $(3(s+n)^2)^s$ descriptions, i.e. $\approx 2s\log_2 s$ bits. A function on $n$ bits has $2^n$ bits of truth table, and the descriptions cannot be injective onto all of them while $2s\log_2 s<2^n$, which means $s\approx 2^n/(2n)$. Counting gives existence, not an example; no explicit function in NP is known to need even $5n$ gates.

The description bound uses the product rule (comb-1.1) before pigeonhole applies. At each gate there are at most three types and $(s+n)^2$ ordered input choices; multiply these bounds over $s$ gates. Topological validity only removes descriptions, and duplicate descriptions of the same function do not weaken an upper bound on how many functions can be represented.`,
      caption: String.raw`Left: the number of **bits** needed to name a circuit with $s$ gates (rising curve, $\log_2$ of the bound) against the $2^n$ bits of a truth table (flat line). Drag **$n$** and the **size multiplier** $c$ (circuit size $s=c\,2^n/n$): the circuit curve crosses the line near $c\approx0.7$ at $n=12$ (and drifts towards $\tfrac12$ as $n\to\infty$). Right: the crossing size $s^*$, measured in units of $2^n/n$, settles down as $n$ grows — the exponential scale is $2^n/n$ even though the constant is not exactly 1.`,
      deps: ['cplx-4.1', 'comb-1.2', 'comb-1.1'],
      refs: ['Arora–Barak ch. 6'],
      credit: 'Claude E. Shannon, 1949 (“The synthesis of two-terminal switching circuits”; counting argument); stated for Boolean circuits in the form above in later textbooks',
      links: { doi: 'https://doi.org/10.1002/j.1538-7305.1949.tb03624.x' },
      scope: String.raw`Gate basis $\{\wedge,\vee,\neg\}$ with fan-in 2; other finite bases change only constants. The plotted curve is the standard upper bound on the number of circuits, not an exact count.`,
      tags: ['counting', 'lower bounds', 'circuits'],
      viz(v) {
        const nS = v.slider('inputs $n$', 3, 24, 12, { int: true });
        const cS = v.slider('size multiplier $c$ in $s=c\\,2^n/n$', 0.05, 3, 0.4, { log: true, sig: 2 });
        const A = v.stage({ x: [1, 1e7], y: [1, 1e9], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.3, minWidth: 280, xlabel: 'circuit size s', ylabel: 'bits', title: 'naming circuits vs naming functions' });
        const B = v.stage({ x: [3, 40], y: [0, 1.3], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'n', ylabel: 's* / (2ⁿ/n)', title: 'the crossing size, in units of 2ⁿ/n' });
        v.legend([['accent', 'log₂ #circuits of size s (bound)'], ['red', 'log₂ #functions = 2ⁿ'], ['green', 'crossing s*']]);
        v.render(() => {
          const n = nS.value, tgt = 2 ** n, sStar = shannonThreshold(n), sc = cS.value * 2 ** n / n;
          A.fn((s) => log2Circuits(s, n), { color: 'accent', width: 2.4, domain: [1, 1e7] });
          A.hline(tgt, { color: 'red', width: 2 });
          A.vline(sStar, { color: 'green', width: 1.6, dash: true });
          A.vline(Math.max(1, sc), { color: 'gold', width: 1.6 });
          A.text('s*', sStar, 4, { color: 'green', size: 12, dx: 6, dy: -4 });
          A.text('chosen s', Math.max(1, sc), 40, { color: 'gold', size: 11, dx: 6 });
          B.hline(1, { color: 'grid', dash: true });
          B.hline(0.5, { color: 'grid', dash: true });
          const pts = []; for (let k = 3; k <= 40; k++) pts.push([k, shannonThreshold(k) * k / 2 ** k]);
          B.path(pts, { color: 'green', width: 2.2 });
          B.dot(n, shannonThreshold(n) * n / tgt, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const n = nS.value, tgt = 2 ** n, sc = cS.value * 2 ** n / n, lb = log2Circuits(sc, n), sStar = shannonThreshold(n);
          const frac = lb < tgt ? `a fraction at most $2^{-${big(tgt - lb)}}$ of all functions` : 'no restriction from counting (this size could name every function)';
          return `$n=${n}$: $2^n=${big(tgt)}$ truth-table bits, crossing size $s^*=${big(sStar)}\\approx${v.fix(sStar * n / tgt, 2)}\\cdot2^n/n$.\nWith $s=${big(Math.round(sc))}$ gates: at most $2^{${big(Math.round(lb))}}$ circuits, so ${frac} has a circuit this small.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Every function has circuits of size O(2ⁿ/n) (Lupanov)',
      statement: String.raw`Every Boolean function $f:\{0,1\}^n\to\{0,1\}$ can be computed by a circuit over $\{\wedge,\vee,\neg\}$ of size $(1+o(1))\,2^n/n$ (Lupanov, 1958); the block argument below proves $O(2^n/n)$. Together with 4.2 this shows $2^n/n$ is the right order of magnitude for the *hardest* function on $n$ bits, whereas a worst-case naive DNF uses $O(n\,2^n)$ gates. The construction below — cut the truth table into blocks, share one sub-function per block pattern — is the standard route to $O(2^n/n)$.`,
      idea: String.raw`Arrange the truth table as a matrix with $2^k$ rows (the first $k$ variables $x$) and $2^{n-k}$ columns (the rest, $y$). Group rows into blocks of $s$. Inside a block, each column $y$ carries an $s$-bit pattern; for each pattern $p$ build once the function "$y$ has pattern $p$" (an OR of $y$-minterms; every column is used in exactly one pattern, so the total over a block is only $2^{n-k}$ gates). Row $r$ of the block is then an OR of the pattern functions with bit $r$ set, and $f=\bigvee_r [x=r]\wedge f_r$. All $m$-variable minterms can be shared in $O(2^m)$ gates. The three costs are $O(2^{n-k}+2^k)$ for decoders, $O((2^k/s)2^{n-k})$ for column groups, and $O(2^k2^s)$ for row combinations. For example $k=\lceil2\log_2 n\rceil$ and $s=\lfloor n-3\log_2 n\rfloor$ give $O(2^n/n)$ for sufficiently large $n$. This proves the stated order; obtaining leading constant 1 takes the sharper original construction.`,
      caption: String.raw`The matrix is the truth table of a random function (black = 1) with the **blocks** cut by lines. Choose $n$, press **Resample**, and let the construction pick its best $(k,s)$ — or switch to manual and move $k$ and $s$. The build is real: gates are hash-consed, the resulting circuit is checked against the table (✓) and its gates are counted. Right: sizes for $n=3,\dots,11$ of the naive DNF, a multiplexer tree that shares equal sub-functions, the block construction, and the reference curve $2^n/n$ (log scale). These are constructed gate counts, including shared input NOT gates; constants and input wires are free. The sampled finite ratios need not decrease with $n$, and the automatic choice searches a finite parameter grid.`,
      deps: ['cplx-4.1', 'cplx-4.2'],
      refs: ['Lupanov (1958), Theorem 4, pp. 129–135; block decomposition §1'],
      credit: 'O. B. Lupanov, 1958, “On a method of circuit synthesis”, Izv. VUZ Radiofizika 1(1), pp. 120–140',
      links: { source: 'https://web.vu.lt/mif/s.jukna/boolean/Russians/lupanov1958.djvu' },
      tags: ['upper bounds', 'circuit synthesis'],
      viz(v) {
        let seed = 7; const sweep = new Map();
        const nS = v.slider('inputs $n$', 4, 11, 9, { int: true });
        const auto = v.toggle('automatic $(k,s)$', true);
        const kS = v.slider('row variables $k$', 1, 10, 3, { int: true });
        const sS = v.slider('block height $s$', 1, 12, 4, { int: true });
        v.button('Resample function', () => { seed = Math.floor(Math.random() * 1e6); sweep.clear(); });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1, minWidth: 260, title: 'truth table (rows: x, columns: y) cut into blocks' });
        const P = v.stage({ x: [2.5, 11.5], y: [1, 1e5], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 280, xlabel: 'n', ylabel: 'gates', title: 'gate counts for a random function' });
        v.legend([['red', 'DNF (shared input NOT gates)'], ['orange', 'mux tree with shared sub-functions'], ['accent', 'block construction (best k, s)'], ['ink', '2ⁿ / n', { dash: true }]]);
        const tab = (n) => randomTable(seed * 31 + n, n);
        const row = (n) => {
          const key = `${seed}:${n}`; if (sweep.has(key)) return sweep.get(key);
          const f = tab(n), best = lupanovBest(f, n);
          const r = { dnf: auditedSize(synthesisDNF(f, n)), mux: auditedSize(synthesisMux(f, n)), best }; sweep.set(key, r); return r;
        };
        let cur = null;
        v.render(() => {
          const n = nS.value, f = tab(n), best = row(n).best;
          kS.input.max = String(n - 1);
          if (auto.value) { kS.value = clamp(best.k, 1, n - 1); sS.value = best.s; }
          else kS.value = clamp(kS.value, 1, n - 1);
          kS.el.hidden = auto.value; sS.el.hidden = auto.value;
          const k = clamp(kS.value, 1, n - 1);
          sS.input.max = String(Math.min(12, 2 ** k)); sS.value = clamp(sS.value, 1, Math.min(12, 2 ** k));
          const sz = sS.value, res = lupanov(f, n, k, sz);
          cur = res;
          const R = 1 << k, Cn = 1 << (n - k);
          T.setView([0, Cn], [0, R]); const ink = v.rgb('ink');
          T.raster((x, y) => { const c = Math.floor(x), r = R - 1 - Math.floor(y); return f[r * Cn + c] ? ink : null; }, { res: 2, key: `${seed}:${n}:${k}` });
          for (let r0 = 0; r0 <= R; r0 += sz) T.hline(R - r0, { color: 'orange', width: 1.4 });
          T.rect(0, 0, Cn, R, { color: 'muted', width: 1.2, stroke: true });
          const ns = [], d = [], m = [], b = [], ref = [];
          for (let q = 3; q <= 11; q++) { const rr = row(q); ns.push(q); d.push([q, Math.max(1, rr.dnf)]); m.push([q, Math.max(1, rr.mux)]); b.push([q, Math.max(1, rr.best.size)]); ref.push([q, 2 ** q / q]); }
          P.path(d, { color: 'red', width: 2 }); P.path(m, { color: 'orange', width: 2 }); P.path(b, { color: 'accent', width: 2.4 }); P.path(ref, { color: 'ink', width: 1.5, dash: true });
          P.dots(b, { r: 3.5, color: 'accent' });
          P.dot(n, Math.max(1, res.size), { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const n = nS.value, rr = row(n), ref = 2 ** n / n;
          return `$n=${n}$, $(k,s)=(${clamp(kS.value, 1, n - 1)},${sS.value})$: block construction **${cur.size}** gates ${cur.ok ? '✓ verified' : '✗ MISMATCH'}, best found ${rr.best.size}; mux tree ${rr.mux}; naive DNF ${rr.dnf}.\n$2^n/n=${v.fix(ref, 1)}$, so the block circuit is ${v.fix(cur.size / ref, 2)} times that; finite sampled ratios need not be monotone. Zero-gate constants are plotted at 1 on this logarithmic axis.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'P/poly and advice',
      statement: String.raw`$\mathrm{P/poly}$ is the class of languages $L\subseteq\{0,1\}^*$ for which there are a polynomial-time Turing machine $M$, a polynomial $\ell$ and **advice strings** $a_n\in\{0,1\}^{\ell(n)}$ such that for every $n$ and every $x\in\{0,1\}^n$: $x\in L\iff M(x,a_n)=1$. Equivalently, $L$ is decided by a family of circuits $(C_n)$ of polynomial size. The advice depends on the length $n$ only, and need not be computable or even describable.`,
      idea: String.raw`Advice and circuits are two views of the same non-uniformity: given a circuit family, let $a_n$ be the description of $C_n$ and let $M$ evaluate it; given advice, 4.5 turns $M(\cdot,a_n)$ into a circuit with $a_n$ hard-wired. The class is *not* a realistic model of computation (it contains undecidable languages, 4.6) but it captures "efficient computation with a lookup table per input length". Its use in complexity is as an upper bound on what uniform classes can do: BPP is inside it (5.12), and NP inside it would collapse PH (4.8).`,
      caption: String.raw`Fix a length $n\le4$ and a verifier $M$. **Click the advice bits** (top row) and watch the set of accepted $n$-bit strings change in the grid. With the *inner-product* machine, $n$ advice bits can select only $2^n$ of the $2^{2^n}$ languages on $\{0,1\}^n$; with the *lookup* machine the advice is the whole truth table (length $2^n$) and every language is reachable — which is why advice length must be polynomial. Right: the number of choices for advice against the number of languages, in bits.`,
      deps: ['cplx-4.1'],
      refs: ['Arora–Barak ch. 6'],
      credit: 'Karp & Lipton, 1980 (advice-taking machines and P/poly); the circuit characterisation: Pippenger, 1979',
      links: { doi: 'https://doi.org/10.1145/800141.804678' },
      tags: ['advice', 'non-uniformity', 'P/poly'],
      viz(v) {
        let adv = [1, 0, 1, 1];
        const nS = v.select('length $n$', [1, 2, 3, 4].map((k) => ({ value: k, label: String(k) })), 3, { onChange: () => { fit(); } });
        const mode = v.select('verifier $M$', [{ value: 'ip', label: 'inner product ⟨x,a⟩ mod 2 (ℓ = n)' }, { value: 'lk', label: 'lookup a[x] (ℓ = 2ⁿ)' }], 'ip', { onChange: () => fit() });
        const A = v.stage({ x: [0, 17], y: [0, 3], axes: false, height: 150, weight: 1, minWidth: 320, full: true, title: 'advice a_n (click to flip)' });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: false, equal: true, height: 330, weight: 1, minWidth: 260, title: 'accepted strings of length n (green)' });
        const H = v.stage({ x: [1, 8], y: [0, 260], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'n', ylabel: 'bits', title: 'advice vs all languages' });
        function len() { return mode.value === 'ip' ? nS.value : 2 ** nS.value; }
        function fit() { const l = len(); adv = Array.from({ length: l }, (_, i) => adv[i % adv.length] ?? 0); }
        const accept = (xv) => {
          const n = nS.value;
          if (mode.value === 'lk') return adv[xv] ?? 0;
          let p = 0; for (let i = 0; i < n; i++) p ^= ((xv >> (n - 1 - i)) & 1) & (adv[i] ?? 0); return p;
        };
        A.onClick((px, py) => {
          const l = len(), w = 16 / l, i = Math.floor((px - 0.5) / w); if (i >= 0 && i < l && py > 0.4 && py < 2.6) adv[i] ^= 1;
        });
        G.onClick((px, py) => {
          if (mode.value !== 'lk') return;
          const n = nS.value, R = 2 ** Math.ceil(n / 2), Cc = 2 ** Math.floor(n / 2), cell = Math.min(0.9 / R, 0.9 / Cc), x0 = 0.5 - cell * Cc / 2, y0 = 0.5 + cell * R / 2;
          const c = Math.floor((px - x0) / cell), r = Math.floor((y0 - py) / cell);
          if (r >= 0 && r < R && c >= 0 && c < Cc) adv[r * Cc + c] ^= 1;
        });
        v.render(() => {
          fit();
          const n = nS.value, l = len(), w = 16 / l;
          for (let i = 0; i < l; i++) {
            A.rect(0.5 + i * w + 0.05 * w, 0.5, 0.5 + (i + 1) * w - 0.05 * w, 2.5, { fill: adv[i] ? 'accent' : 'grid', fillAlpha: adv[i] ? 0.7 : 0.25, color: 'accent', width: 1.4, radius: 5 });
            A.text(String(adv[i]), 0.5 + (i + 0.5) * w, 1.5, { align: 'center', baseline: 'middle', size: l > 8 ? 12 : 16, color: 'ink' });
          }
          const R = 2 ** Math.ceil(n / 2), Cc = 2 ** Math.floor(n / 2), cell = Math.min(0.9 / R, 0.9 / Cc), x0 = 0.5 - cell * Cc / 2, y0 = 0.5 + cell * R / 2;
          for (let r = 0; r < R; r++) for (let c = 0; c < Cc; c++) {
            const xv = r * Cc + c, a = accept(xv);
            G.rect(x0 + c * cell + 0.004, y0 - (r + 1) * cell + 0.004, x0 + (c + 1) * cell - 0.004, y0 - r * cell - 0.004, { fill: a ? 'green' : 'grid', fillAlpha: a ? 0.6 : 0.2, color: a ? 'green' : 'muted', width: 1, radius: 5 });
            G.text(bits(xv, n), x0 + (c + 0.5) * cell, y0 - (r + 0.5) * cell, { align: 'center', baseline: 'middle', size: clamp(cell * 100, 9, 15), color: 'ink' });
          }
          const ip = [], lk = [], all = [];
          for (let m = 1; m <= 8; m++) { ip.push([m, m]); lk.push([m, 2 ** m]); all.push([m, 2 ** m]); }
          H.path(all, { color: 'red', width: 2.4 }); H.path(ip, { color: 'accent', width: 2.4 });
          H.text('2ⁿ bits: all languages', 4.2, 230, { color: 'red', size: 12 }); H.text('n bits: inner-product advice', 4.6, 20, { color: 'accent', size: 12 });
          H.dot(n, 2 ** n, { r: 6, color: 'red' }); H.dot(n, n, { r: 6, color: 'accent' });
        });
        v.readout(() => {
          const n = nS.value, l = len(); let c = 0; for (let xv = 0; xv < 2 ** n; xv++) c += accept(xv);
          return `Advice length $\\ell=${l}$: this machine reaches at most $2^{${l}}$ of the $2^{2^{${n}}}=2^{${2 ** n}}$ languages on $\\{0,1\\}^{${n}}$.\nAccepts ${c} of ${2 ** n} strings. ${mode.value === 'lk' ? 'Lookup with exponential advice reaches every language — hence the polynomial bound on $\\ell$.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'P ⊆ P/poly',
      statement: String.raw`If a language is decided by a deterministic Turing machine in time $t(n)\ge n$, then for each $n$ it is decided on $\{0,1\}^n$ by a circuit of size $O(t(n)^2)$ (in fact $O(t(n)\log t(n))$ for an oblivious two-tape machine). Consequently $\mathrm P\subseteq\mathrm{P/poly}$. The circuits here are even *uniform*: they can be written down in time polynomial in $n$ (indeed in logarithmic space), so the same construction gives CIRCUIT-SAT hardness for NP (4.7).`,
      idea: String.raw`Write the whole computation as a $t\times t$ **tableau**: row $i$ is the configuration after $i$ steps, one cell per tape square, with the head's state marked on its cell. Each cell of row $i+1$ depends only on the three cells above it (the head moves at most one square), so it is computed by a copy of one fixed constant-size gadget determined by the transition table. Stacking $t$ rows of $t$ gadgets, with the input fed into row 0 and the accept cell read off the last row, gives a circuit of size $O(t^2)$. No search for the right circuit is needed: it is the machine's own history, drawn as hardware.`,
      caption: String.raw`Choose a machine and an input; the grid is its **real run** (rows: time, columns: tape squares; the head cell shows its state). **Click any cell** to see its three parents in the row above: the cell is a fixed function of those three. Right: the number of gadgets (rows × squares used) against $t(n)^2$ for inputs of length $1,\dots,24$ on the log–log plot; the gadgets stay below the square of the running time, as the theorem claims.`,
      deps: ['cplx-4.4', 'toc-13.4'],
      refs: ['Arora–Barak ch. 6'],
      credit: 'Savage, 1972; Pippenger & Fischer, 1979 (oblivious simulation, size O(t log t))',
      links: { doi: 'https://doi.org/10.1145/321724.321731' },
      tags: ['tableau', 'simulation', 'P/poly'],
      viz(v) {
        const pick = MACHINES.filter((m) => ['parity', 'palin', 'ends1', 'sorted'].includes(m.id));
        const mach = v.select('machine', pick.map((m) => ({ value: m.id, label: m.name })), 'parity');
        const nS = v.slider('input length $n$', 2, 12, 7, { int: true });
        const seedS = v.slider('input pattern', 0, 20, 3, { int: true });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1.35, minWidth: 320, title: 'tableau of the run (time runs downward)' });
        const B = v.stage({ x: [2, 24], y: [3, 5000], xlog: false, ylog: true, axes: 'box', gutter: true, height: 400, weight: 1, minWidth: 260, xlabel: 'input length n', ylabel: 'gadgets', title: 'size of the circuit' });
        v.legend([['accent', 'gadgets = rows × squares'], ['red', 't(n)²', { dash: true }]]);
        let sel = null, geo = null;
        const M = () => pick.find((m) => m.id === mach.value);
        const inputOf = (n) => padBits(seedS.value + 1, n);
        const run = (n) => { const m = M(), x = inputOf(n), r0 = tableauTM(m, x, 4000, n + 3); const t = Math.max(1, r0.steps); return { x, t, tab: tableauTM(m, x, t, n + 3) }; };
        A.onClick((px, py) => {
          if (!geo) return; const c = Math.floor((px - geo.x0) / geo.cw), r = Math.floor((geo.y0 - py) / geo.ch);
          if (r >= 0 && r < geo.rows && c >= 0 && c < geo.cols) sel = [r, c];
        });
        v.render(() => {
          const n = nS.value, { x, t, tab } = run(n), rows = tab.rows.length, cols = n + 3;
          const maxRows = 60, step = Math.max(1, Math.ceil(rows / maxRows));
          const showRows = Math.ceil(rows / step), cw = 0.96 / cols, ch = Math.min(0.96 / showRows, cw * 1.1), x0 = 0.02, y0 = 0.98;
          geo = { cw, ch, x0, y0, rows: showRows, cols, step };
          for (let r = 0; r < showRows; r++) for (let c = 0; c < cols; c++) {
            const cell = tab.rows[Math.min(rows - 1, r * step)][c];
            const fillc = cell.head ? 'gold' : cell.sym === '1' ? 'accent' : cell.sym === '0' ? 'blue' : cell.sym === '_' ? 'grid' : 'purple';
            A.rect(x0 + c * cw, y0 - (r + 1) * ch, x0 + (c + 1) * cw, y0 - r * ch, { fill: fillc, fillAlpha: cell.head ? 0.8 : cell.sym === '_' ? 0.12 : 0.4, color: 'panel', width: 0.8 });
            if (cw > 0.04 && ch > 0.02) A.text(cell.sym === '_' ? '' : cell.sym, x0 + (c + 0.5) * cw, y0 - (r + 0.5) * ch, { align: 'center', baseline: 'middle', size: 10, color: 'ink' });
          }
          if (sel && sel[0] < showRows) {
            const [r, c] = sel;
            for (const dc of [-1, 0, 1]) if (r > 0 && c + dc >= 0 && c + dc < cols) A.rect(x0 + (c + dc) * cw, y0 - r * ch, x0 + (c + dc + 1) * cw, y0 - (r - 1) * ch, { color: 'orange', width: 2.4, stroke: true });
            A.rect(x0 + c * cw, y0 - (r + 1) * ch, x0 + (c + 1) * cw, y0 - r * ch, { color: 'red', width: 2.6, stroke: true });
          }
          // size plot
          const g = [], t2 = [];
          for (let m = 2; m <= 24; m++) { const q = run(m); g.push([m, (q.t + 1) * (m + 3)]); t2.push([m, q.t * q.t]); }
          B.setView([2, 24], [3, Math.max(5000, ...t2.map((p) => p[1]))]);
          B.path(t2, { color: 'red', width: 2, dash: true }); B.path(g, { color: 'accent', width: 2.4 });
          B.dot(n, (t + 1) * cols, { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const n = nS.value, { t, tab } = run(n);
          return `Run on a length-${n} input: $t=${t}$ steps (${tab.status === 'acc' ? 'accepts' : tab.status === 'rej' ? 'rejects' : tab.status}), tableau $=${t + 1}\\times${n + 3}$ cells, $t^2=${t * t}$.\n${sel ? 'The red cell is a fixed function of the three orange cells above it (the head moves at most one square).' : 'Click a cell to see which three cells determine it.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'P/poly contains undecidable languages',
      statement: String.raw`Let $\mathrm{HALT}_1$ be the unary language consisting of $1^n$ exactly when the $n$-th Turing machine halts on the empty input. It is undecidable, yet $\mathrm{HALT}_1\in\mathrm{P/poly}$: the advice for length $n$ is the single bit $a_n=1$ iff $1^n\in\mathrm{HALT}_1$, and the machine first rejects strings containing 0, then outputs $a_n$ on $1^n$. More generally every unary language lies in P/poly (the advice is again one bit per length), so P/poly is uncountable and contains languages outside every class of decidable languages.`,
      idea: String.raw`A circuit family is just a sequence of finite objects with no requirement that the sequence be generated by an algorithm. For the unary halting language each $C_n(x)$ is $a_n\wedge\bigwedge_{i=1}^n x_i$: constant 0 when $a_n=0$, the all-ones test when $a_n=1$ — it exists for every $n$, but *which* one is exactly the halting problem (toc-9.7). So non-uniform classes can contain undecidable sets, and one has to add a uniformity condition (for example log-space computable circuit families) to recover P.

The uncountability assertion uses Cantor’s diagonal theorem (logic-1.2). Subsets $S\subseteq\N$ correspond to unary languages $\{1^n:n\in S\}$, all in P/poly, whereas machines have only countably many finite descriptions. More explicitly, any proposed list of unary languages misses the language that reverses the $n$th listed language on $1^n$; advice is allowed to encode this uncomputable sequence.`,
      caption: String.raw`Each square is one of the first 256 machines of a fixed list of 3-state, 2-symbol Turing machines on the empty tape (the list is scrambled from the index, so the visualization makes no distributional claim about larger machines). Move **step bound $B$**: green squares are seen to halt within $B$ steps; pink ones have not halted by then (pink means unknown at the displayed bound, with no claim of nonhalting; the sample is a finite set of 3-state machines, not the unrestricted enumeration in the theorem). The readout shows 64 bounded-simulation bits “1 iff the sampled machine halts within 20 000 steps”, with sample index 0 mapped to display position 1 — these are not the uncomputable advice bits; for the full enumeration of all machines no algorithm can produce the true halting-advice sequence, although each single bit is a legal advice string.`,
      deps: ['cplx-4.4', 'toc-9.7', 'logic-1.2'],
      refs: ['Arora–Barak (2007 draft), Example 6.17 and Theorem 6.15; Karp–Lipton (1982), §2 fact (3)'],
      credit: 'Unary-advice construction: Arora–Barak Example 6.17; nonrecursive advice languages: Karp–Lipton, 1982, §2 fact (3)',
      links: { source: 'https://doi.org/10.5169/seals-52237' },
      tags: ['advice', 'halting problem', 'non-uniformity'],
      viz(v) {
        const NM = 256, CAP = 20000;
        if (!viz4_6.cache) viz4_6.cache = Array.from({ length: NM }, (_, i) => runSmallTM(smallTM(i), CAP));
        const info = viz4_6.cache;
        const B = v.slider('step bound $B$', 1, CAP, 20, { log: true, int: true, sig: 2 });
        const A = v.stage({ x: [0, 16], y: [0, 16], axes: false, equal: true, height: 360, weight: 1.1, minWidth: 300, title: 'machines 0 … 255 (green: halts within B; gold: halts later; pink: not seen to halt)' });
        const H = v.stage({ x: [0, 4.5], y: [0, 260], axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 260, xlabel: 'log₁₀ of the step bound', ylabel: 'machines known to halt', title: 'what waiting reveals' });
        let sel = 0;
        A.onClick((px, py) => { const c = Math.floor(px), r = 15 - Math.floor(py); if (c >= 0 && c < 16 && r >= 0 && r < 16) sel = r * 16 + c; });
        v.render(() => {
          const b = B.value;
          for (let i = 0; i < NM; i++) {
            const c = i % 16, r = 15 - Math.floor(i / 16), q = info[i];
            const known = q.halted && q.steps <= b;
            A.rect(c + 0.06, r + 0.06, c + 0.94, r + 0.94, { fill: known ? 'green' : q.halted ? 'gold' : 'red', fillAlpha: known ? 0.7 : q.halted ? 0.9 : 0.25, color: i === sel ? 'ink' : 'panel', width: i === sel ? 2.6 : 0.8, radius: 3 });
          }
          const pts = []; for (let e = 0; e <= 4.3; e += 0.05) { const bb = 10 ** e; pts.push([e, info.filter((q) => q.halted && q.steps <= bb).length]); }
          H.path(pts, { color: 'green', width: 2.4 });
          H.vline(Math.log10(b), { color: 'gold', width: 1.6 });
          H.hline(info.filter((q) => q.halted).length, { color: 'grid', dash: true });
        });
        v.readout(() => {
          const b = B.value, haltedNow = info.filter((q) => q.halted && q.steps <= b).length, tot = info.filter((q) => q.halted).length;
          const adv = info.slice(0, 64).map((q) => (q.halted ? 1 : 0)).join('');
          const q = info[sel], last = Math.max(...info.filter((z) => z.halted).map((z) => z.steps));
          return `Within $B=${big(b)}$ steps, ${haltedNow} of 256 machines are seen to halt; ${tot} halt within ${CAP.toLocaleString('en-US')} (the slowest takes ${last} steps; the unrestricted halting times have no computable bound by machine index). Machine ${sel}: ${q.halted ? `halts after ${q.steps} steps` : `no halt in ${CAP.toLocaleString('en-US')} steps`}.\nBounded sample bits $b_1\\dots b_{64}$ (not true halting advice) = ${adv}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'CIRCUIT-SAT is NP-complete',
      statement: String.raw`**CIRCUIT-SAT** is the set of Boolean circuits $C$ for which some input makes $C$ output 1. It lies in NP (the satisfying input is the certificate, checked by evaluating $C$) and is NP-hard: for every $L\in\mathrm{NP}$ there is a polynomial-time map $x\mapsto C_x$ such that $x\in L\iff C_x$ is satisfiable. Hence CIRCUIT-SAT is NP-complete, and so is SAT (the Cook–Levin theorem) by converting circuits to CNF with one fresh variable per gate.`,
      idea: String.raw`Let $V(x,w)$ be a polynomial-time verifier for $L$ with certificates of length $p(|x|)$. By 4.5 there is a circuit computing $V$ on inputs of the lengths $|x|$ and $p(|x|)$; hard-wire the bits of $x$ and leave the certificate bits $w$ as *free* inputs. The result $C_x(w)=V(x,w)$ is satisfiable exactly when a certificate exists. This reduction is the whole proof; the work was done by the tableau of 4.5 and the definition of NP (toc-12.11).

The final circuit-to-CNF step uses the local truth-assignment semantics of logic-2.3, not an exponential truth-table expansion of the whole circuit. Introduce one fresh variable $z$ for each gate output. For an AND gate with inputs $a,b$, the three clauses $(\neg z\lor a)$, $(\neg z\lor b)$ and $(z\lor\neg a\lor\neg b)$ hold together exactly when $z=a\land b$; the OR and NOT tables give analogous constant-size clauses. Add the unit clause asserting the final output. In topological order every input assignment has a unique extension satisfying all gate clauses, and that extension satisfies the output clause exactly when the circuit accepts. Consequently existentially quantifying the fresh variables preserves satisfiability with only linearly many clauses. This supplies the claimed SAT reduction after the separate tableau construction has supplied the circuit.`,
      caption: String.raw`The verifier for "$N$ is composite" multiplies two 4-bit numbers $a,b$ with an array of full adders and checks $ab=N$, $a\ge2$, $b\ge2$. $N$ is hard-wired; $a$ and $b$ are the free inputs — the certificate. Move **$a$** and **$b$** (or click a square of the $16\times16$ grid of all $2^8$ certificates) and watch the circuit light up; the output turns green only for a factorisation. Choose a prime $N$ to see an unsatisfiable circuit: every one of the 256 inputs fails.`,
      deps: ['cplx-4.5', 'toc-12.11', 'logic-2.3'],
      refs: ['Arora–Barak ch. 6'],
      credit: 'Cook, 1971 and Levin, 1973 (NP-completeness); circuit form: standard (see Ladner, 1975 for the circuit value problem)',
      links: { doi: 'https://doi.org/10.1145/800157.805047' },
      tags: ['NP-completeness', 'reductions', 'circuits'],
      viz(v) {
        const NS = [15, 35, 77, 143, 13, 97, 221, 225];
        const nSel = v.select('hard-wired $N$', NS.map((m) => ({ value: m, label: String(m) })), 35, { onChange: () => build() });
        const aS = v.slider('certificate part $a$', 0, 15, 5, { int: true });
        const bS = v.slider('certificate part $b$', 0, 15, 7, { int: true });
        let C, lay, sols = [];
        const build = () => {
          C = factorC(4, nSel.value); lay = layoutC(C, { spread: 1.0, vertical: true });
          sols = []; for (let m = 0; m < 256; m++) { const a = m >> 4, b = m & 15; if (evalC(C, inp(a, b))[C.outs[0]]) sols.push([a, b]); }
        };
        const inp = (a, b) => { const x = []; for (let i = 0; i < 4; i++) x.push((a >> i) & 1); for (let i = 0; i < 4; i++) x.push((b >> i) & 1); return x; };
        v.button('Search (first solution)', () => { build(); if (sols.length) { aS.set(sols[0][0]); bS.set(sols[0][1]); } });
        const S = v.stage({ x: [-0.03, 1.05], y: [-0.02, 1.02], axes: false, height: 540, full: true, title: 'verifier circuit with free certificate inputs a, b (inputs at the top)' });
        const Gd = v.stage({ x: [0, 16], y: [0, 16], axes: false, equal: true, height: 340, weight: 1, minWidth: 250, title: 'all 256 certificates (a across, b up)' });
        build();
        Gd.onClick((px, py) => { const a = Math.floor(px), b = Math.floor(py); if (a >= 0 && a < 16 && b >= 0 && b < 16) { aS.set(a); bS.set(b); } });
        v.render(() => {
          const vals = evalC(C, inp(aS.value, bS.value));
          drawC(S, C, lay, { vals, r: 8 });
          const [ox, oy] = lay.pos[C.outs[0]];
          S.text(vals[C.outs[0]] ? 'ACCEPT' : 'reject', ox, oy, { dx: 40, align: 'center', size: 13, weight: 700, color: vals[C.outs[0]] ? 'green' : 'red' });
          for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) {
            const ok = sols.some((s) => s[0] === a && s[1] === b);
            Gd.rect(a + 0.05, b + 0.05, a + 0.95, b + 0.95, { fill: ok ? 'green' : 'grid', fillAlpha: ok ? 0.8 : 0.2, color: 'panel', width: 0.6 });
          }
          Gd.rect(aS.value, bS.value, aS.value + 1, bS.value + 1, { color: 'ink', width: 2.6, stroke: true });
        });
        v.readout(() => {
          const a = aS.value, b = bS.value, N = nSel.value, ok = evalC(C, inp(a, b))[C.outs[0]];
          return `$a\\cdot b=${a * b}$ vs $N=${N}$: circuit outputs **${ok}**. Size ${sizeC(C)} gates, depth ${depthC(C)}.\n${sols.length} of 256 certificates satisfy the circuit${sols.length ? ` (e.g. ${sols.slice(0, 3).map(([p, q]) => `${p}·${q}`).join(', ')})` : ' — the circuit is unsatisfiable'}.`;
        });
      },
    },
  ],
};
const viz4_6 = { cache: null };
