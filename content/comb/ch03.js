// Combinatorics — Chapter 3: Inclusion–exclusion and sieve methods (items 3.1–3.8; 3.9–3.14 are in ch03-b.js)
//
// House style, as in chapters 1–2: every count in a readout comes from listing the objects (cells in a
// Venn diagram, all n! permutations, all k^n functions, all placements of rooks), and is compared with the
// closed form the theorem claims. Colours of sets and of "how many times this object has been counted" are fixed
// across the chapter: green = counted exactly once, orange/red = over-counted, purple = under-counted.
import {
  CAT, pen, binom, fact, range, shuffled, commas, stirling2,
  derange, derangeBig, factBig, fixedPointPmf, poissonPmf, tvToPoisson, fixedPoints,
  surjFormula, surjBrute, permNaive, permRyser, rookNumbers, rookPlacements, avoidBrute, menageU, menageBrute, binomBigInt,
  allPerms, polyTex,
} from './ch03.shared.js';

const E = Math.E;
/** Colour and opacity of a cell that has been counted c times (c = 1 is the goal). */
const countStyle = (c) => (c === 1 ? ['green', 0.8] : c === 0 ? ['faint', 0.28] : c === 2 ? ['orange', 0.8] : c > 2 ? ['red', 0.85] : ['purple', 0.8]);
const sgnStr = (x) => (x < 0 ? '−' : '+');

export default {
  collection: 'comb',
  chapter: 3,
  title: 'Inclusion–exclusion and sieve methods',
  summary: String.raw`When the objects we want are those avoiding a list of bad properties, inclusion–exclusion counts them by alternately adding and subtracting overlaps. Derangements, surjections, permanents and forbidden-position problems all yield to it. A more subtle cousin, the sign-reversing involution, cancels unwanted terms in pairs; through the Lindström–Gessel–Viennot lemma it turns families of non-crossing paths into determinants and counts tilings exactly.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Theorem',
      name: 'Principle of inclusion–exclusion',
      statement: String.raw`Let $A_1,\dots,A_m$ be finite sets. Then
$$\Big|\bigcup_{i=1}^m A_i\Big|=\sum_{\emptyset\ne I\subseteq[m]}(-1)^{|I|-1}\Big|\bigcap_{i\in I}A_i\Big|=S_1-S_2+S_3-\cdots+(-1)^{m-1}S_m,\qquad S_t=\sum_{|I|=t}\Big|\bigcap_{i\in I}A_i\Big|.$$
Equivalently, inside a universe $X$, the number of elements lying in **none** of the sets is $\sum_{I\subseteq[m]}(-1)^{|I|}\,|\bigcap_{i\in I}A_i|$ (with the empty intersection $=X$).`,
      idea: String.raw`Count element by element. An element lying in exactly $r\ge1$ of the sets appears in $\binom r t$ of the $t$-fold intersections, so the right-hand side credits it $\binom r1-\binom r2+\cdots\pm\binom rr=1-(1-1)^r=1$, by the binomial theorem (1.1's counting rules and the binomial identities of chapter 1). Elements in no set are credited $0$. So every element of the union is counted exactly once and nothing else is counted.`,
      caption: String.raw`Drag the circles (the cells of the board are the elements). The slider **terms used** chooses how many alternating terms $S_1,-S_2,\dots$ have been added: each cell is coloured by the number of times it has been counted so far (green = once, orange/red = too often, purple = too few). Only after the last term is every cell green or empty. The bars show the partial sums against $|\bigcup A_i|$.`,
      deps: ['comb-1.1'],
      refs: ['Stanley EC1 §2.1', 'Aigner ch. 5'],
      tags: ['inclusion–exclusion', 'counting'],
      viz(v) {
        const W = 26, H = 16, COL = ['teal', 'pink', 'gold', 'accent'];
        const mS = v.slider('number of sets $m$', 2, 4, 4, { int: true });
        const rS = v.slider('radius', 2.5, 7, 4.6, { step: 0.1 });
        const jS = v.slider('terms used $j$', 0, 4, 1, { int: true });
        const A = v.stage({ x: [0, W], y: [0, H], equal: true, axes: false, height: 340, weight: 1.7, title: 'cells counted $j$ terms in (drag the circles)' });
        const B = v.stage({ x: [-0.6, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'terms used $j$', ylabel: 'partial sum $P_j$', title: 'partial sums vs. the union' });
        const init = [[8.5, 10.5], [14.5, 10.5], [11, 5.5], [17.5, 5]];
        const hs = init.map((p, i) => A.handle(p[0], p[1], { color: COL[i], label: String(i + 1), r: 8 }));
        let P = [0], Sv = [], U = 0, hist = [0, 0, 0, 0, 0];
        v.render(() => {
          const m = mS.value, r = rS.value;
          hs.forEach((h, i) => { h.visible = i < m; });
          jS.set(Math.min(jS.value, m)); const j = jS.value;
          // membership masks of all cells
          const mask = []; hist = [0, 0, 0, 0, 0]; U = 0;
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            let mk = 0, c = 0;
            for (let i = 0; i < m; i++) if (Math.hypot(x + 0.5 - hs[i].x, y + 0.5 - hs[i].y) <= r) { mk |= 1 << i; c++; }
            mask.push([x, y, mk, c]); if (c) U++; hist[c]++;
          }
          // S_t by enumerating subsets I: cells lying in every A_i, i in I
          Sv = Array(m + 1).fill(0);
          for (let I = 1; I < 1 << m; I++) { let sz = 0; for (let i = 0; i < m; i++) if (I >> i & 1) sz++; let cnt = 0; for (const c of mask) if ((c[2] & I) === I) cnt++; Sv[sz] += cnt; }
          P = [0]; for (let t = 1; t <= m; t++) P.push(P[t - 1] + (t % 2 ? 1 : -1) * Sv[t]);
          for (const [x, y, mk, c] of mask) {
            let cnt = 0; for (let t = 1; t <= j; t++) cnt += (t % 2 ? 1 : -1) * binom(c, t);
            const [col, a] = countStyle(cnt);
            if (c === 0 && j === 0) { A.rect(x + 0.06, y + 0.06, x + 0.94, y + 0.94, { fill: 'faint', fillAlpha: 0.12, stroke: false }); continue; }
            A.rect(x + 0.06, y + 0.06, x + 0.94, y + 0.94, { fill: c === 0 ? 'faint' : col, fillAlpha: c === 0 ? 0.12 : a, stroke: false });
          }
          for (let i = 0; i < m; i++) A.circle(hs[i].x, hs[i].y, r, { color: COL[i], width: 2.4 });
          A.corner(`cells counted exactly once: ${mask.filter((c) => c[3] && (() => { let k = 0; for (let t = 1; t <= j; t++) k += (t % 2 ? 1 : -1) * binom(c[3], t); return k === 1; })()).length} of ${U}`, 'tl', { plate: true });
          // right panel
          const lo = Math.min(0, ...P), hi = Math.max(U, ...P) * 1.12 || 1;
          B.setView([-0.6, 4.6], [lo * 1.1, hi]); B.setTicks(range(m + 1), null);
          B.hline(U, { color: 'green', dash: true, width: 2 });
          B.bars(P, { x0: 0, color: (val, i) => (i === j ? 'gold' : i === m ? 'green' : i <= j ? 'accent' : 'faint') });
          B.text('$|\\bigcup A_i|$', 4.55, U, { color: 'green', align: 'right', baseline: 'bottom', size: 12 });
        });
        v.legend([['green', 'counted once', { dot: true }], ['orange', 'twice', { dot: true }], ['red', 'three or more times', { dot: true }], ['purple', 'negative count', { dot: true }]]);
        v.readout(() => {
          const m = mS.value, j = jS.value, full = P[m] === U, rel = P[j] > U ? 'above' : P[j] < U ? 'below' : 'equal to';
          return String.raw`$|A_1\cup\cdots\cup A_${m}|=${U}$ (cells in at least one circle). The terms $S_1,\dots,S_${m}$ are ${Sv.slice(1, m + 1).join(', ')}, so $S_1-S_2+\cdots=${P[m]}$ ${full ? '**= the union**' : '**≠ the union — check**'}. After $j=${j}$ terms the sum is $P_${j}=${P[j]}$${j === m ? '' : ` (${rel} the union by ${Math.abs(P[j] - U)})`}. Cells lying in $0,1,\dots,${m}$ sets: ${hist.slice(0, m + 1).join(', ')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Bonferroni inequalities',
      credit: 'Bonferroni, 1936 (the first inequality is Boole’s)',
      statement: String.raw`With $S_t$ as in 3.1 and $P_k=S_1-S_2+\cdots+(-1)^{k-1}S_k$ the $k$-th partial sum, for every $k\ge 1$
$$P_k\ \ge\ \Big|\bigcup_{i}A_i\Big|\ \text{ for odd }k,\qquad P_k\ \le\ \Big|\bigcup_{i}A_i\Big|\ \text{ for even }k.$$
So truncating the inclusion–exclusion series after an odd number of terms over-estimates the union and after an even number under-estimates it. (For $k=1$ this is the union bound $|\bigcup A_i|\le\sum|A_i|$.)`,
      idea: String.raw`Again count element by element. An element in exactly $r$ sets is credited $c_k(r)=\sum_{t=1}^{k}(-1)^{t-1}\binom rt$ by $P_k$. The identity $\sum_{t=0}^{k}(-1)^t\binom rt=(-1)^k\binom{r-1}{k}$ (a telescoping of Pascal's rule) gives $c_k(r)=1-(-1)^k\binom{r-1}{k}$ for $r\ge1$, which is $\ge1$ when $k$ is odd and $\le1$ when $k$ is even. Summing over all elements gives the inequalities, and the error is exactly $\sum_x\binom{r(x)-1}{k}$.`,
      caption: String.raw`Left: the partial sums $P_k$ of a random family of sets (orange = upper bounds, blue = lower bounds), zigzagging around the green line $|\bigcup A_i|$. Right: the per-element credit $c_k(r)$ for an element lying in $r$ sets — it is $\ge1$ for odd $k$ and $\le1$ for even $k$, which is the whole proof. Increase *clustering* to make elements fall in many sets at once and watch the early bounds become useless (even negative) before the series settles.`,
      scope: String.raw`Finite sets (or any finite measure/probability space: replace cardinalities by probabilities). The family here is random — a model, resampled with the button.`,
      deps: ['comb-3.1'],
      refs: ['Aigner ch. 5'],
      tags: ['inclusion–exclusion', 'bounds'],
      viz(v) {
        const N = 400;
        let seed = 5, U01 = [], R = [];
        const gen = () => { const r = v.rng(seed); U01 = Array.from({ length: N }, () => r()); R = Array.from({ length: N }, () => Array.from({ length: 12 }, () => r())); };
        gen();
        const nS = v.slider('number of sets $n$', 3, 10, 8, { int: true });
        const pS = v.slider('density $p$', 0.05, 0.6, 0.3, { step: 0.01 });
        const cS = v.slider('clustering', 0, 1, 0.5, { step: 0.01 });
        const kS = v.slider('truncate at $k$', 1, 10, 2, { int: true });
        v.button('Resample', () => { seed++; gen(); });
        const A = v.stage({ x: [-0.4, 10.6], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.3, xlabel: 'number of terms $k$', ylabel: 'partial sum $P_k$', title: 'partial sums of the inclusion–exclusion series' });
        const B = v.stage({ x: [0.4, 10.6], y: [-3, 5], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: '$r$ = number of sets containing the element', ylabel: 'credit $c_k(r)$', title: 'what $P_k$ credits an element' });
        let n = 8, S = [], mult = [], U = 0, P = [];
        v.render(() => {
          n = nS.value; const k = Math.min(kS.value, n); kS.set(k);
          const p = pS.value, c = cS.value;
          mult = Array(n + 1).fill(0);
          for (let x = 0; x < N; x++) { const px = (1 - c) * p + c * (U01[x] < p ? 1 : 0); let m = 0; for (let i = 0; i < n; i++) if (R[x][i] < px) m++; mult[m]++; }
          U = N - mult[0];
          S = [0]; for (let t = 1; t <= n; t++) { let s = 0; for (let r = t; r <= n; r++) s += mult[r] * binom(r, t); S.push(s); }
          P = [0]; for (let t = 1; t <= n; t++) P.push(P[t - 1] + (t % 2 ? 1 : -1) * S[t]);
          const hi = Math.max(U, ...P.slice(0, k + 2)) * 1.1, lo = Math.min(0, ...P.slice(0, n + 1));
          A.setView([-0.4, n + 0.6], [Math.max(lo, -U) * 1.1 - 1, Math.max(hi, U * 1.3)]); A.setTicks(range(n + 1), null);
          A.hline(U, { color: 'green', width: 2, dash: true });
          A.hline(0, { color: 'faint', width: 1 });
          A.path(P.map((y, t) => [t, y]), { color: 'muted', width: 1.4, alpha: 0.7 });
          P.forEach((y, t) => { if (t) A.dot(t, y, { r: t === k ? 8 : 5, color: t % 2 ? 'orange' : 'blue', label: t === k ? `P${k}` : undefined, labelPos: 'ne' }); });
          A.text('$|\\bigcup A_i|$', n + 0.55, U, { color: 'green', align: 'right', baseline: 'bottom', size: 12 });
          const cr = (r) => { let s = 0; for (let t = 1; t <= k; t++) s += (t % 2 ? 1 : -1) * binom(r, t); return s; };
          const ys = range(n + 1).map(cr); const ymax = Math.max(2, ...ys) * 1.15, ymin = Math.min(-0.5, ...ys) * 1.15;
          B.setView([0.4, n + 0.6], [ymin, ymax]); B.setTicks(range(n + 1).slice(1), null);
          B.hline(1, { color: 'green', dash: true, width: 2 });
          B.bars(ys.slice(1), { x0: 1, color: k % 2 ? 'orange' : 'blue' });
        });
        v.legend([['orange', 'upper bound ($k$ odd)', { dot: true }], ['blue', 'lower bound ($k$ even)', { dot: true }], ['green', 'true union / credit 1', { dash: true }]]);
        v.readout(() => {
          const k = kS.value, ok = k % 2 ? P[k] >= U : P[k] <= U;
          const err = (() => { let e = 0; for (let r = 1; r <= n; r++) e += mult[r] * binom(r - 1, k); return e; })();
          return String.raw`$n=${n}$ sets cover $|\bigcup A_i|=${U}$ of $${N}$ elements; $S_1,\dots,S_{${Math.min(n, 5)}}=${S.slice(1, 6).join(', ')}$. $P_{${k}}=${P[k]}$ is ${k % 2 ? 'an upper' : 'a lower'} bound: $P_{${k}}${k % 2 ? '\\ge' : '\\le'}${U}$ ${ok ? '**holds**' : '**FAILS**'}; the error $|P_{${k}}-\bigcup|=${Math.abs(P[k] - U)}$ equals $\sum_x\binom{r(x)-1}{${k}}=${err}$ ${Math.abs(P[k] - U) === err ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Derangements and the 1/e limit',
      credit: 'Montmort, 1708–1713 (the hat-check problem); N. Bernoulli independently',
      statement: String.raw`A **derangement** is a permutation of $[n]$ with no fixed point. Their number is
$$D_n=n!\sum_{i=0}^{n}\frac{(-1)^i}{i!}\ \ (=\,\text{the nearest integer to } n!/e\text{ for }n\ge1),$$
so $D_n/n!\to e^{-1}$: the probability that a uniformly random permutation has no fixed point tends to $1/e\approx0.3679$, and the convergence is very fast ($|D_n/n!-1/e|<1/(n+1)!$). Also $D_n=nD_{n-1}+(-1)^n$.`,
      idea: String.raw`Let $A_i$ be the permutations fixing $i$. Any $t$ prescribed fixed points leave $(n-t)!$ permutations, so $S_t=\binom nt(n-t)!=n!/t!$ and inclusion–exclusion (3.1) gives $D_n=\sum_t(-1)^t n!/t!$. The sum is a partial sum of the series for $e^{-1}$ (3.30 in Rudin's PMA), whose tail is an alternating series with decreasing terms, hence at most the first omitted term $1/(n+1)!$.`,
      caption: String.raw`Hand back $n$ hats at random (left: the latest hand-back, a fixed point is a green ring), over and over (buttons). Middle: the running fraction of hand-backs with nobody getting their own hat (log time axis) settles on $e^{-1}$ and on the exact $D_n/n!$. Right: the exact $D_n/n!$ for $n=1,\dots,12$ is already within $10^{-8}$ of $1/e$ at $n=12$.`,
      deps: ['comb-3.1', 'pma-3.30'],
      refs: ['Stanley EC1 §2.2'],
      tags: ['derangements', 'e'],
      viz(v) {
        let seed = 11, w = [], trials = [], cum = [], good = 0;
        const nS = v.slider('hats $n$', 2, 10, 8, { int: true, onChange: () => reset() });
        const rng = () => v.rng(seed);
        let R = null;
        const one = () => { w = R.shuffle(range(nS.value)); const ok = fixedPoints(w) === 0; if (ok) good++; trials.push(ok); cum.push(good / trials.length); };
        function reset() { seed += 17; R = rng(); trials = []; cum = []; good = 0; for (let t = 0; t < 1500; t++) one(); }
        reset();
        v.button('+1 hand-back', () => one());
        v.button('+100', () => { for (let t = 0; t < 100; t++) one(); });
        v.button('+1000', () => { for (let t = 0; t < 1000; t++) one(); });
        v.button('Restart', () => reset());
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, title: 'latest hand-back' });
        const B = v.stage({ x: [1, 30000], y: [0, 0.8], xlog: true, axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'hand-backs so far', ylabel: 'fraction with no match', title: 'running fraction' });
        const C = v.stage({ x: [0.3, 12.7], y: [0.2, 0.6], axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: '$n$', ylabel: '$D_n/n!$', title: 'exact $D_n/n!$' });
        const exact = (n) => derange(n) / fact(n);
        v.render(() => {
          const n = nS.value, P = pen(v, A), W = P.W, H = P.H, cw = Math.min(46, (W - 24) / n), x0 = (W - n * cw) / 2, yT = 56, yB = H - 70, bh = Math.min(30, cw * 0.8);
          P.text('people', 10, 20, { size: 12, color: 'muted', halo: false, align: 'left' });
          P.text('hats received', 10, H - 22, { size: 12, color: 'muted', halo: false, align: 'left' });
          for (let i = 0; i < n; i++) {
            const fix = w[i] === i, col = fix ? 'green' : CAT[w[i] % CAT.length];
            P.line(x0 + (i + 0.5) * cw, yT + bh, x0 + (w[i] + 0.5) * cw, yB, { color: col, width: fix ? 3 : 1.8, alpha: fix ? 1 : 0.7 });
          }
          for (let i = 0; i < n; i++) {
            P.rect(x0 + i * cw + 2, yT, cw - 4, bh, { fill: 'panel', color: CAT[i % CAT.length], width: 1.8, r: 4 });
            P.text(String(i + 1), x0 + (i + 0.5) * cw, yT + bh / 2, { align: 'center', size: 13, weight: 600, halo: false });
            const own = w.indexOf(i) === i;
            P.rect(x0 + i * cw + 2, yB, cw - 4, bh, { fill: CAT[i % CAT.length], fillAlpha: 0.85, color: own ? 'green' : CAT[i % CAT.length], width: own ? 3.2 : 1, r: 4 });
            P.text(String(i + 1), x0 + (i + 0.5) * cw, yB + bh / 2, { align: 'center', size: 13, weight: 600, color: 'panel', halo: false });
          }
          const fp = fixedPoints(w);
          P.text(fp ? `${fp} fixed point${fp > 1 ? 's' : ''}` : 'derangement: nobody gets their own hat', W / 2, H / 2 + 4, { align: 'center', size: 14, weight: 700, color: fp ? 'red' : 'green' });
          // running fraction
          const T = trials.length, step = Math.max(1, Math.floor(T / 400)), pts = [];
          for (let t = 1; t <= T; t += step) pts.push([t, cum[t - 1]]); pts.push([T, cum[T - 1]]);
          B.hline(1 / E, { color: 'muted', dash: true, width: 1.6 }); B.hline(exact(n), { color: 'green', width: 2 });
          B.path(pts, { color: 'accent', width: 1.8 });
          B.text('$1/e$', 25000, 1 / E, { color: 'muted', align: 'right', baseline: 'top', size: 12 });
          // exact convergence
          C.hline(1 / E, { color: 'muted', dash: true, width: 1.6 });
          C.path(range(12).map((i) => [i + 1, exact(i + 1)]), { color: 'muted', width: 1, alpha: 0.6 });
          range(12).forEach((i) => C.dot(i + 1, exact(i + 1), { r: i + 1 === n ? 8 : 4.5, color: i + 1 === n ? 'gold' : 'green' }));
        });
        v.legend([['accent', 'running fraction'], ['green', 'exact $D_n/n!$'], ['muted', '$1/e$', { dash: true }]]);
        v.readout(() => {
          const n = nS.value, T = trials.length;
          let brute = '';
          if (n <= 8) { let c = 0; allPerms(n).forEach((p) => { if (fixedPoints(p) === 0) c++; }); brute = `; listing all $${n}!=${commas(fact(n))}$ permutations finds $${commas(c)}$ derangements ${c === derange(n) ? '✓' : '✗'}`; }
          return String.raw`After $${commas(T)}$ hand-backs: ${good} derangements, fraction $${(good / T).toFixed(4)}$. Exact: $D_{${n}}=${commas(derangeBig(n))}$ (by $n!\sum(-1)^i/i!$ and by $D_n=nD_{n-1}+(-1)^n$), $D_{${n}}/${n}!=${(exact(n)).toFixed(6)}$, versus $1/e=${(1 / E).toFixed(6)}$ — the difference is $${(Math.abs(exact(n) - 1 / E)).toExponential(2)}<1/(n+1)!=${(1 / fact(n + 1)).toExponential(2)}$${brute}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Fixed points of a random permutation are nearly Poisson',
      statement: String.raw`Let $F_n$ be the number of fixed points of a uniformly random permutation of $[n]$. Then for $0\le k\le n$
$$\Pr(F_n=k)=\frac{1}{k!}\sum_{i=0}^{n-k}\frac{(-1)^i}{i!}=\binom nk\frac{D_{n-k}}{n!},$$
which is within $1/(k!\,(n-k+1)!)$ of the Poisson probability $e^{-1}/k!$. Hence $F_n\to\mathrm{Poisson}(1)$ in distribution, and the total-variation distance between the two laws tends to $0$ faster than any exponential in $n$.`,
      idea: String.raw`Choose which $k$ points are fixed ($\binom nk$ ways) and let the remaining $n-k$ points form a derangement ($D_{n-k}$ ways, from 3.3). Dividing by $n!$ and using $D_m/m!=\sum_{i\le m}(-1)^i/i!$ gives the formula; it is the series of $e^{-1}/k!$ stopped after $n-k+1$ terms, so the error is at most the first omitted term. Summing the errors over $k$ gives the total-variation bound.`,
      caption: String.raw`Left: a histogram of the number of fixed points over thousands of random permutations (blue bars), the exact law $\binom nk D_{n-k}/n!$ (orange rings, computed from the formula) and Poisson(1) (green dots). Even for $n=6$ you cannot tell the three apart. Right: the exact total-variation distance (log scale) for $n=1,\dots,16$ — it drops by more than a factor of 10 at each step, and below $10^{-16}$ double precision cannot follow it.`,
      deps: ['comb-3.3'],
      refs: ['Stanley EC1 §2.2'],
      tags: ['derangements', 'poisson'],
      viz(v) {
        let seed = 21;
        const nS = v.slider('$n$', 1, 16, 6, { int: true });
        const mS = v.slider('permutations sampled', 200, 100000, 20000, { log: true, int: true });
        v.button('Resample', () => { seed++; cache = null; });
        const A = v.stage({ x: [-0.7, 7.7], y: [0, 0.45], axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: 'number of fixed points $k$', ylabel: 'probability', title: 'fixed points of a random permutation' });
        const B = v.stage({ x: [0, 17], y: [1e-16, 1], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: '$n$', ylabel: 'total variation distance', title: 'distance to Poisson(1), exact' });
        let cache = null;
        const sample = (n, m) => {
          if (cache && cache.n === n && cache.m === m) return cache;
          const r = v.rng(seed * 100 + n), cnt = Array(n + 1).fill(0), a = range(n);
          for (let t = 0; t < m; t++) { for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } cnt[fixedPoints(a)]++; }
          return (cache = { n, m, cnt });
        };
        const tv = range(16).map((i) => tvToPoisson(i + 1));
        v.render(() => {
          const n = nS.value, m = mS.value, { cnt } = sample(n, m), pm = fixedPointPmf(n), K = 8;
          A.setTicks(range(K + 1), null);
          for (let k = 0; k <= Math.min(K, n); k++) A.rect(k - 0.36, 0, k + 0.36, cnt[k] / m, { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1 });
          for (let k = 0; k <= K; k++) { A.dot(k, poissonPmf(1, k), { r: 4, color: 'green' }); if (k <= n) A.dot(k, pm[k], { r: 8, hollow: true, color: 'orange' }); }
          B.path(tv.map((y, i) => [i + 1, Math.max(y, 1e-17)]), { color: 'muted', width: 1, alpha: 0.6 });
          tv.forEach((y, i) => B.dot(i + 1, Math.max(y, 1e-17), { r: i + 1 === n ? 8 : 4, color: i + 1 === n ? 'gold' : 'accent' }));
          B.hline(1 / Math.sqrt(m), { color: 'red', dash: true, width: 1.5 });
          B.text('sampling noise ≈ $1/\\sqrt{N}$', 16.8, 1 / Math.sqrt(m), { color: 'red', align: 'right', baseline: 'bottom', size: 11 });
        });
        v.legend([['accent', 'sampled frequency', { dot: true }], ['orange', 'exact law', { dot: true }], ['green', 'Poisson(1)', { dot: true }]]);
        v.readout(() => {
          const n = nS.value, m = mS.value, { cnt } = sample(n, m), pm = fixedPointPmf(n);
          let emp = 0, mass = 0; for (let k = 0; k <= n; k++) { const q = poissonPmf(1, k); emp += Math.abs(cnt[k] / m - q); mass += q; } emp = 0.5 * (emp + (1 - mass));
          const k0 = Math.min(2, n);
          return String.raw`$n=${n}$: $\Pr(F_n=${k0})=\binom{${n}}{${k0}}D_{${n - k0}}/${n}!=${pm[k0].toFixed(6)}$ versus Poisson $e^{-1}/${k0}!=${poissonPmf(1, k0).toFixed(6)}$. Exact total variation $=${tv[n - 1] < 1e-16 ? '<10^{-16}' : tv[n - 1].toExponential(2)}$; the sampled frequencies are ${v.fix(emp, 4)} away from Poisson(1) — that is sampling noise (about $1/\sqrt{N}=${v.fix(1 / Math.sqrt(m), 4)}$), not a real gap, once $n\ge5$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Counting surjections',
      statement: String.raw`The number of surjective maps from an $n$-set onto a $k$-set is
$$\operatorname{Surj}(n,k)=\sum_{j=0}^{k}(-1)^j\binom kj (k-j)^n = k!\,S(n,k),$$
where $S(n,k)$ is the Stirling number of the second kind (1.13). In particular it vanishes for $n<k$ and equals $k!$ for $n=k$.`,
      idea: String.raw`Let $A_i$ be the set of all $k^n$ functions that miss the value $i$. Functions missing a prescribed set of $j$ values are functions into the other $k-j$ values, so $|\bigcap_{i\in I}A_i|=(k-j)^n$ and 3.1 gives the alternating sum for the functions missing nothing. On the other hand a surjection is the same as a partition of $[n]$ into $k$ non-empty blocks (the fibres, counted by $S(n,k)$) together with an assignment of the $k$ values to the blocks ($k!$ ways).`,
      caption: String.raw`Choose $n$ balls and $k$ boxes. Left: a random throw (empty boxes are outlined in red); the buttons keep a tally. Right: the signed terms $(-1)^j\binom kj(k-j)^n$ of inclusion–exclusion (orange = added, blue = subtracted) and their sum (green) — the number of throws that fill every box. The readout checks it against a listing of all $k^n$ throws and against $k!\,S(n,k)$.`,
      deps: ['comb-3.1', 'comb-1.13'],
      refs: ['Stanley EC1 §2.2'],
      tags: ['surjections', 'Stirling numbers'],
      viz(v) {
        let seed = 31, ball = [], tried = 0, hit = 0;
        const nS = v.slider('balls $n$', 1, 9, 6, { int: true, onChange: () => resetTally() });
        const kS = v.slider('boxes $k$', 1, 5, 3, { int: true, onChange: () => resetTally() });
        let R = v.rng(seed);
        const throwOne = () => { const n = nS.value, k = kS.value; ball = range(n).map(() => Math.floor(R() * k)); tried++; if (new Set(ball).size === k) hit++; };
        function resetTally() { tried = 0; hit = 0; R = v.rng(++seed); throwOne(); }
        v.button('Throw', () => throwOne());
        v.button('Throw 1000', () => { for (let t = 0; t < 1000; t++) throwOne(); });
        resetTally();
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1, title: 'one random throw' });
        const B = v.stage({ x: [-0.6, 6.6], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: 'term $j$ (last bar: the sum)', ylabel: 'signed term', title: 'inclusion–exclusion over the missed boxes' });
        const S2 = stirling2(9), bruteCache = new Map();
        const brute = (n, k) => { const key = n + ',' + k; if (!bruteCache.has(key)) bruteCache.set(key, surjBrute(n, k)); return bruteCache.get(key); };
        v.render(() => {
          const n = nS.value, k = kS.value, P = pen(v, A), W = P.W, H = P.H, bw = Math.min(110, (W - 20) / k), x0 = (W - k * bw) / 2, by = H * 0.42, bh = H * 0.5;
          const cnt = Array(k).fill(0); ball.forEach((b) => cnt[b]++);
          for (let b = 0; b < k; b++) {
            const x = x0 + b * bw, empty = cnt[b] === 0;
            P.path([[x + 4, by], [x + 8, by + bh], [x + bw - 8, by + bh], [x + bw - 4, by]], { color: empty ? 'red' : CAT[b % 8], width: empty ? 3 : 2.2 });
            P.text(String(b + 1), x + bw / 2, by + bh + 14, { align: 'center', size: 12, color: 'muted', halo: false });
            let q = 0; const per = Math.max(1, Math.floor((bw - 16) / 18));
            ball.forEach((bb, i) => { if (bb !== b) return; const r = Math.floor(q / per), c = q % per; P.dot(x + 12 + c * 18 + 6, by + bh - 12 - r * 18, 7, { fill: CAT[i % 8] }); P.text(String(i + 1), x + 18 + c * 18, by + bh - 12 - r * 18, { align: 'center', size: 9, color: 'panel', weight: 700, halo: false }); q++; });
          }
          P.text(new Set(ball).size === k ? 'every box is filled: a surjection' : `${k - new Set(ball).size} empty box${k - new Set(ball).size > 1 ? 'es' : ''}`, W / 2, 28, { align: 'center', size: 14, weight: 700, color: new Set(ball).size === k ? 'green' : 'red' });
          const terms = range(k + 1).map((j) => (j % 2 ? -1 : 1) * binom(k, j) * (k - j) ** n);
          const total = terms.reduce((a, b) => a + b, 0);
          const mx = Math.max(k ** n, 1), mn = Math.min(0, ...terms);
          B.setView([-0.6, k + 1.6], [mn * 1.12, mx * 1.12]); B.setTicks(range(k + 1), null);
          B.bars(terms, { x0: 0, color: (val, i) => (val < 0 ? 'blue' : 'orange') });
          B.rect(k + 1 - 0.4, 0, k + 1 + 0.4, total, { fill: 'green', fillAlpha: 0.7, color: 'green' });
          B.text(String(total), k + 1, total, { align: 'center', baseline: 'bottom', color: 'green', weight: 700, size: 13 });
        });
        v.legend([['orange', 'added', { dot: true }], ['blue', 'subtracted', { dot: true }], ['green', 'surjections', { dot: true }]]);
        v.readout(() => {
          const n = nS.value, k = kS.value, f = Number(surjFormula(n, k)), sk = fact(k) * S2[n][k], tot = k ** n;
          return String.raw`$\sum_j(-1)^j\binom kj(k-j)^n=${commas(f)}$ for $n=${n},k=${k}$ out of $k^n=${commas(tot)}$ functions. Listing all $${commas(tot)}$ functions finds ${commas(brute(n, k))} onto ones ${brute(n, k) === f ? '✓' : '✗'}; $k!\,S(n,k)=${k}!\cdot${S2[n][k]}=${commas(sk)}$ ${sk === f ? '✓' : '✗'}. Random throws: ${hit} of ${commas(tried)} filled every box ($${(hit / tried).toFixed(3)}$ vs. exact $${(f / tot).toFixed(3)}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Ryser’s formula for the permanent',
      credit: 'Ryser, 1963',
      statement: String.raw`The permanent of an $n\times n$ matrix $A=(a_{ij})$ is $\operatorname{per}A=\sum_{\sigma\in S_n}\prod_{i}a_{i\sigma(i)}$. Ryser's formula expresses it as
$$\operatorname{per}A=(-1)^n\sum_{S\subseteq[n]}(-1)^{|S|}\prod_{i=1}^n\sum_{j\in S}a_{ij}\;=\;\sum_{\emptyset\ne S\subseteq[n]}(-1)^{n-|S|}\prod_{i=1}^{n}\sum_{j\in S}a_{ij},$$
a sum of only $2^n-1$ terms, each costing $O(n^2)$ operations (and $O(n)$ with a Gray-code order of the subsets), instead of the $n!$ terms of the definition. For a $0/1$ matrix $\operatorname{per}A$ counts the permutations using only entries equal to $1$ (perfect matchings of a bipartite graph).`,
      idea: String.raw`For a $0/1$ matrix let $A_j$ be the set of functions $f:[n]\to[n]$ with $a_{i f(i)}=1$ for all $i$ that never take the value $j$. Inclusion–exclusion (3.1) over the missed columns counts the functions that are onto — and an onto function $[n]\to[n]$ is a permutation. The number of functions with all $a_{if(i)}=1$ and values inside $S$ is exactly $\prod_i\sum_{j\in S}a_{ij}$; the same sign pattern works for arbitrary entries by multilinearity.`,
      caption: String.raw`Click squares to toggle entries between $0$ and $1$. The permanent is computed twice — by summing over all $n!$ permutations and by Ryser's $2^n-1$ terms (middle bars: each subset $S$ with its signed term; they sum to the permanent) — with the number of arithmetic operations each used. Right: operation counts for $n=1,\dots,8$ (log scale) for the all-ones matrix.`,
      deps: ['comb-3.1'],
      refs: ['Stanley EC1 ch. 2'],
      tags: ['permanent', 'algorithms'],
      viz(v) {
        let seed = 41, M = [[1, 1, 0, 1, 0], [1, 0, 1, 1, 1], [0, 1, 1, 0, 1], [1, 1, 0, 1, 1], [0, 1, 1, 1, 1]];
        const nS = v.slider('size $n$', 2, 8, 5, { int: true, onChange: () => fit() });
        const fit = () => { const n = nS.value; while (M.length < n) M.push(Array(M.length).fill(0)); M.forEach((r) => { while (r.length < Math.max(n, M.length)) r.push(0); }); };
        fit();
        const sub = () => { const n = nS.value; return M.slice(0, n).map((r) => r.slice(0, n)); };
        v.button('Random', () => { const R = v.rng(++seed), n = nS.value; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) M[i][j] = R() < 0.6 ? 1 : 0; });
        v.button('All ones', () => { for (const r of M) r.fill(1); });
        v.button('Identity', () => { for (let i = 0; i < M.length; i++) for (let j = 0; j < M.length; j++) M[i][j] = i === j ? 1 : 0; });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.8, title: 'the 0/1 matrix (click to toggle)' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1.2, xlabel: 'subset $S$ (as a binary number)', ylabel: 'term', title: 'Ryser terms $(-1)^{n-|S|}\\prod_i\\sum_{j\\in S}a_{ij}$' });
        const C = v.stage({ x: [0.5, 8.5], y: [1, 1e7], ylog: true, axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: '$n$', ylabel: 'operations', title: 'cost of the two methods' });
        const geom = () => { const n = nS.value, s = Math.min(54, (A.width - 24) / n, (A.height - 24) / n); return { n, s, x0: (A.width - n * s) / 2, y0: (A.height - n * s) / 2 }; };
        A.onClick((x, y) => {
          const { n, s, x0, y0 } = geom(), px = A.X(x), py = A.Y(y), j = Math.floor((px - x0) / s), i = Math.floor((py - y0) / s);
          if (i >= 0 && i < n && j >= 0 && j < n) M[i][j] = 1 - M[i][j];
        });
        const costs = range(8).map((i) => { const n = i + 1, J = Array.from({ length: n }, () => Array(n).fill(1)); return [permNaive(J).ops, permRyser(J).ops]; });
        let res = null;
        v.render(() => {
          const { n, s, x0, y0 } = geom(), P = pen(v, A), Ms = sub();
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            P.rect(x0 + j * s + 1.5, y0 + i * s + 1.5, s - 3, s - 3, { fill: Ms[i][j] ? 'accent' : 'panel', fillAlpha: Ms[i][j] ? 0.85 : 1, color: Ms[i][j] ? 'accent' : 'faint', width: 1.4, r: 5 });
            P.text(String(Ms[i][j]), x0 + (j + 0.5) * s, y0 + (i + 0.5) * s, { align: 'center', size: Math.min(18, s * 0.45), color: Ms[i][j] ? 'panel' : 'muted', weight: 700, halo: false });
          }
          const nv = permNaive(Ms), ry = permRyser(Ms); res = { nv, ry };
          const T = ry.terms, mx = Math.max(1, ...T.map((t) => Math.abs(t.t)));
          B.setView([0, T.length + 1], [-mx * 1.1, mx * 1.1]); B.setTicks([[1, '1'], [T.length, String(T.length)]], null);
          B.hline(0, { color: 'faint' });
          T.forEach((t, i) => B.rect(i + 0.55, 0, i + 1.45, t.t, { fill: t.t < 0 ? 'blue' : 'orange', fillAlpha: 0.75, stroke: false }));
          C.path(costs.map((c, i) => [i + 1, c[0]]), { color: 'red', width: 2 }); C.path(costs.map((c, i) => [i + 1, c[1]]), { color: 'green', width: 2 });
          costs.forEach((c, i) => { C.dot(i + 1, c[0], { r: i + 1 === n ? 7 : 3.5, color: 'red' }); C.dot(i + 1, c[1], { r: i + 1 === n ? 7 : 3.5, color: 'green' }); });
        });
        v.legend([['red', 'over all $n!$ permutations', { dot: true }], ['green', 'Ryser, $2^n-1$ terms', { dot: true }]]);
        v.readout(() => {
          const n = nS.value, { nv, ry } = res;
          return String.raw`$\operatorname{per}A=${nv.value}$ by the definition ($${n}!=${commas(fact(n))}$ terms, ${commas(nv.ops)} operations) and $${ry.value}$ by Ryser ($${commas(2 ** n - 1)}$ terms, ${commas(ry.ops)} operations) ${nv.value === ry.value ? '✓' : '✗'}. ${nv.ops > ry.ops ? `Ryser used ${v.fix(nv.ops / ry.ops, 1)}× fewer operations.` : `At this small size the definition is no more expensive; the gap opens quickly with $n$.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Definition',
      name: 'Rook polynomials and forbidden positions',
      credit: 'Kaplansky and Riordan, 1946 (“The problem of the rooks and its applications”)',
      statement: String.raw`For a set $B$ of squares of an $n\times n$ board (the *forbidden* squares), let $r_k(B)$ be the number of ways to place $k$ non-attacking rooks on squares of $B$ (no two in a row or column), and $R_B(x)=\sum_k r_k(B)x^k$ its **rook polynomial**. The number of permutations $w$ of $[n]$ with $(i,w(i))\notin B$ for every $i$ — the placements of $n$ non-attacking rooks that avoid $B$ completely — is
$$\sum_{k=0}^{n}(-1)^k\,r_k(B)\,(n-k)!.$$`,
      idea: String.raw`Let $A_\beta$, for a forbidden square $\beta$, be the permutations passing through $\beta$. A set of $k$ forbidden squares lies on a common permutation exactly when the squares are non-attacking, and then $(n-k)!$ permutations pass through all of them; the number of such sets is $r_k$. So $S_k=r_k(n-k)!$ in 3.1's notation, and the permutations in no $A_\beta$ number $\sum(-1)^kS_k$. For $B$ the diagonal this recovers the derangements of 3.3.`,
      caption: String.raw`Click squares to forbid them (red). The slider $k$ and the **next placement** button show $k$ non-attacking rooks on forbidden squares, among all $r_k$ of them. Right: the terms $(-1)^kr_k(n-k)!$ and their running total; the last total is the number of permutations that avoid every red square, confirmed by listing all $n!$ permutations. Presets include the diagonal (derangements) and the two-diagonal board of 3.8.`,
      deps: ['comb-3.1'],
      refs: ['Stanley EC1 §2.3'],
      tags: ['rook polynomial', 'permutations'],
      viz(v) {
        let B = Array.from({ length: 7 }, (_, i) => Array.from({ length: 7 }, (_, j) => i === j)), pi = 0;
        const nS = v.slider('board size $n$', 3, 7, 5, { int: true, onChange: () => { pi = 0; } });
        const kS = v.slider('rooks shown $k$', 0, 7, 2, { int: true, onChange: () => { pi = 0; } });
        const preset = (f) => () => { for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) B[i][j] = f(i, j, nS.value); pi = 0; };
        v.button('Diagonal', preset((i, j) => i === j));
        v.button('Two diagonals (ménage)', preset((i, j, n) => j === i || j === (i + 1) % n));
        v.button('Staircase', preset((i, j) => j <= i));
        v.button('Clear', preset(() => false));
        v.button('Next placement', () => { pi++; });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 0.9, title: 'forbidden squares and $k$ rooks on them' });
        const C = v.stage({ x: [-0.6, 7.6], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: '$k$', ylabel: 'term and running total', title: 'inclusion–exclusion over rook numbers' });
        const geom = () => { const n = nS.value, s = Math.min((A.width - 20) / n, (A.height - 40) / n); return { n, s, x0: (A.width - n * s) / 2, y0: 14 }; };
        A.onClick((x, y) => { const { n, s, x0, y0 } = geom(), j = Math.floor((A.X(x) - x0) / s), i = Math.floor((A.Y(y) - y0) / s); if (i >= 0 && i < n && j >= 0 && j < n) { B[i][j] = !B[i][j]; pi = 0; } });
        let st = null;
        v.render(() => {
          const { n, s, x0, y0 } = geom(), P = pen(v, A), Bs = B.slice(0, n).map((r) => r.slice(0, n)), k = Math.min(kS.value, n); kS.set(k);
          const r = rookNumbers(Bs), pl = rookPlacements(Bs, k, 3000), cur = pl.length ? pl[pi % pl.length] : null;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) P.rect(x0 + j * s + 1, y0 + i * s + 1, s - 2, s - 2, { fill: Bs[i][j] ? 'red' : (i + j) % 2 ? 'faint' : 'panel', fillAlpha: Bs[i][j] ? 0.35 : (i + j) % 2 ? 0.25 : 1, color: Bs[i][j] ? 'red' : 'faint', width: 1, r: 3 });
          if (cur) cur.forEach(([i, j]) => { P.dot(x0 + (j + 0.5) * s, y0 + (i + 0.5) * s, s * 0.3, { fill: 'ink' }); P.text('♜', x0 + (j + 0.5) * s, y0 + (i + 0.5) * s + 1, { align: 'center', size: s * 0.42, color: 'panel', halo: false }); });
          P.text(cur ? `placement ${pi % pl.length + 1} of ${r[k]}` : (k === 0 ? 'the empty placement (1 way)' : 'no placement of that many rooks'), A.width / 2, y0 + n * s + 18, { align: 'center', size: 13, color: 'muted', halo: false });
          const terms = range(n + 1).map((q) => (q % 2 ? -1 : 1) * r[q] * fact(n - q)); let run = 0; const tot = terms.map((t) => (run += t));
          const mx = Math.max(...terms.map(Math.abs), ...tot.map(Math.abs), 1);
          C.setView([-0.6, n + 0.6], [-mx * 0.15 - Math.min(0, ...terms, ...tot) * 0.0, mx * 1.15]); C.setTicks(range(n + 1), null);
          C.hline(0, { color: 'faint' });
          C.bars(terms, { x0: 0, color: (val) => (val < 0 ? 'blue' : 'orange') });
          C.path(tot.map((y, q) => [q, y]), { color: 'green', width: 2.2 }); tot.forEach((y, q) => C.dot(q, y, { r: q === n ? 8 : 4, color: 'green' }));
          st = { n, r, total: tot[n], brute: avoidBrute(Bs) };
        });
        v.legend([['orange', '$+r_k(n-k)!$', { dot: true }], ['blue', '$-r_k(n-k)!$', { dot: true }], ['green', 'running total', { dot: true }]]);
        v.readout(() => {
          const { n, r, total, brute } = st;
          return String.raw`$R_B(x)=${polyTex(r, { max: 9 })}$. Permutations of $[${n}]$ avoiding every red square: $\sum_k(-1)^kr_k(n-k)!=${total}$; listing all $${commas(fact(n))}$ permutations finds ${brute} ${brute === total ? '✓' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'The ménage problem',
      credit: 'Posed by Lucas, 1891 (earlier by Tait, in connection with knot theory); formula by Touchard, 1934',
      statement: String.raw`In how many ways can $n$ married couples be seated at a round table with $2n$ numbered seats, men and women alternating, so that no one sits next to their spouse? The number is
$$M_n=2\cdot n!\cdot U_n,\qquad U_n=\sum_{k=0}^{n}(-1)^k\,\frac{2n}{2n-k}\binom{2n-k}{k}(n-k)!\qquad(n\ge3),$$
with $U_n=1,2,13,80,579,4738,\dots$ for $n=3,4,5,\dots$. The probability that a random alternating seating has no adjacent couple tends to $e^{-2}\approx0.135$.`,
      idea: String.raw`Seat the women first ($2\cdot n!$ ways: choose which parity of seats, then an order). The husbands must then be placed in the $n$ remaining seats, and husband $i$ may not take either of the two seats beside his wife: a permutation problem on a board with two forbidden diagonals. By 3.7 the answer is $\sum(-1)^kr_k(n-k)!$, where $r_k$ — the number of ways to choose $k$ non-attacking squares on the cyclic two-diagonal board — equals $\frac{2n}{2n-k}\binom{2n-k}{k}$ (choose $k$ non-adjacent edges of a $2n$-cycle). Since $r_k\sim(2n)^k/k!$ for fixed $k$, the sum is asymptotically $n!\sum(-2)^k/k!\to n!e^{-2}$.`,
      caption: String.raw`Left: a seating at a table of $2n$ seats (women $\bullet$ on even seats, men $\blacksquare$ on odd seats, one colour per couple); spouses sitting next to each other are joined by a red bar. *Random seating* draws a uniformly random alternating arrangement (about 1 in 7 is good for large $n$); *Random good seating* keeps drawing until it finds one. Right: the exact probability $U_n/n!$ for $n=3,\dots,30$ against $e^{-2}$, with brute-force counts for $n\le9$ marked by rings.`,
      deps: ['comb-3.7'],
      refs: ['Stanley EC1 §2.3'],
      tags: ['ménage', 'rook polynomial'],
      viz(v) {
        let seed = 61, R = v.rng(seed), wom = [], men = [];
        const nS = v.slider('couples $n$', 3, 12, 7, { int: true, onChange: () => draw() });
        const bad = () => { const n = nS.value; let b = 0; for (let i = 0; i < n; i++) { const wm = wom.indexOf(i); /* woman of couple i at seat 2*wm */ const m = men.indexOf(i); if (m === wm || m === (wm - 1 + n) % n) b++; } return b; };
        function draw() { const n = nS.value; wom = R.shuffle(range(n)); men = R.shuffle(range(n)); }
        draw();
        v.button('Random seating', () => draw());
        v.button('Random good seating', () => { for (let t = 0; t < 5000; t++) { draw(); if (bad() === 0) break; } });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1, title: 'a seating (women ● on even seats, men ■ on odd seats)' });
        const Bst = v.stage({ x: [2, 31], y: [0, 0.3], axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'couples $n$', ylabel: 'probability of a good seating', title: '$U_n/n!\\ \\to\\ e^{-2}$' });
        const pr = range(30).map((i) => { const n = i + 1; return n < 3 ? null : Number((menageU(n) * 10n ** 18n) / factBig(n)) / 1e18; });
        v.render(() => {
          const n = nS.value, P = pen(v, A), W = P.W, H = P.H, cx = W / 2, cy = H / 2 + 6, R0 = Math.min(W, H) * 0.36;
          const pos = (s) => { const a = -Math.PI / 2 + (2 * Math.PI * s) / (2 * n); return [cx + R0 * Math.cos(a), cy + R0 * Math.sin(a)]; };
          P.circle(cx, cy, R0 * 0.82, { color: 'faint', width: 3 });
          const seatOf = Array(2 * n).fill(null); wom.forEach((c, i) => { seatOf[2 * i] = { c, w: true }; }); men.forEach((c, j) => { seatOf[2 * j + 1] = { c, w: false }; });
          // bad adjacencies
          for (let s = 0; s < 2 * n; s++) { const t = (s + 1) % (2 * n); if (seatOf[s].c === seatOf[t].c) { const [x1, y1] = pos(s), [x2, y2] = pos(t); P.line(x1, y1, x2, y2, { color: 'red', width: 6, alpha: 0.9 }); } }
          const r = Math.max(9, Math.min(16, 140 / n));
          for (let s = 0; s < 2 * n; s++) {
            const [x, y] = pos(s), { c, w } = seatOf[s], col = CAT[c % 8];
            if (w) P.dot(x, y, r, { fill: col }); else P.rect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8, { fill: col, color: col, r: 3 });
            P.text(String(c + 1), x, y, { align: 'center', size: Math.max(9, r * 0.85), color: 'panel', weight: 700, halo: false });
            const a = -Math.PI / 2 + (2 * Math.PI * s) / (2 * n); P.text(String(s + 1), cx + (R0 + r + 11) * Math.cos(a), cy + (R0 + r + 11) * Math.sin(a), { align: 'center', size: 10, color: 'muted', halo: false });
          }
          const b = bad(); P.text(b ? `${b} couple${b > 1 ? 's' : ''} sitting together` : 'nobody sits next to their spouse', cx, cy, { align: 'center', size: 14, weight: 700, color: b ? 'red' : 'green' });
          Bst.setView([2, Math.max(31, n + 1)], [0, 0.3]);
          Bst.hline(Math.exp(-2), { color: 'green', dash: true, width: 2 }); Bst.text('$e^{-2}$', 30.8, Math.exp(-2), { color: 'green', align: 'right', baseline: 'bottom', size: 12 });
          pr.forEach((y, i) => { if (y != null) Bst.dot(i + 1, y, { r: i + 1 === n ? 8 : 4, color: i + 1 === n ? 'gold' : 'accent' }); });
          for (let m = 3; m <= 9; m++) Bst.dot(m, pr[m - 1], { r: 8, hollow: true, color: 'orange' });
        });
        v.legend([['accent', 'exact $U_n/n!$', { dot: true }], ['orange', 'brute-force count ($n\\le9$)', { dot: true }], ['green', '$e^{-2}$', { dash: true }]]);
        v.readout(() => {
          const n = nS.value, U = menageU(n), M = 2n * factBig(n) * U;
          const br = n <= 9 ? menageBrute(n) : null;
          return String.raw`$n=${n}$: $U_${n}=${commas(U)}$, $M_${n}=2\cdot${n}!\cdot U_${n}=${commas(M)}$${br != null ? `; running through all $${n}!$ placements of the husbands finds $${commas(br)}$ good ones ${BigInt(br) === U ? '✓' : '✗'}` : ''}. Probability $U_n/n!=${(pr[n - 1]).toFixed(5)}$ vs. $e^{-2}=${Math.exp(-2).toFixed(5)}$.`;
        });
      },
    },
  ],
};
