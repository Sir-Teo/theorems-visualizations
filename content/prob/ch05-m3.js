// Probability: Theory and Examples (Durrett) — Chapter 5, part M3: §5.5 Stationary measures
import { clampN, fr, CHAINS, chainOpts, muP, piOf, cumRows, step, simPath, excursion, drawChain } from './ch05-m.shared.js';

const SCOL = ['accent', 'orange', 'green', 'purple', 'teal'];
const sumOf = (a) => { let s = 0; for (const x of a) s += x; return s; };
const l1 = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s; };
/** Grid of matrix entries drawn on a stage (row i from the top). */
function matGrid(s, M, { max = 1, color = 'accent' } = {}) {
  const n = M.length;
  s.setView([-0.1, n + 0.1], [-0.1, n + 0.1]);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x0 = j, y0 = n - 1 - i, val = M[i][j];
    s.rect(x0, y0, x0 + 1, y0 + 1, { fill: s.v.ramp(clampN(val / max, 0, 1), color), fillAlpha: 0.9, color: 'panel', width: 1 });
    s.text(val < 0.0005 ? '0' : val.toFixed(2), x0 + 0.5, y0 + 0.5, { size: 11, color: 'ink', align: 'center', baseline: 'middle' });
  }
}
/** Exact mean-visit measure for the chain: π/π(x) for an irreducible chain. */
const muX = (pi, x) => Array.from(pi, (p) => p / pi[x]);
/** A reflecting walk on {0,1,...}: 0 → 1 surely, x → x+1 w.p. p, x → x−1 w.p. 1−p. Return time to x, censored at cap. */
function reflectReturn(r, p, x, cap) {
  let s = x === 0 ? 1 : r() < p ? x + 1 : x - 1, T = 1;
  while (s !== x && T < cap) { s = s === 0 ? 1 : r() < p ? s + 1 : s - 1; T++; }
  return s === x ? T : -T;
}
const piRefl = (p, x) => { const q = 1 - p, p0 = (1 - 2 * p) / (2 * (1 - p)); return x === 0 ? p0 : (p0 / q) * (p / q) ** (x - 1); };

export default {
  collection: 'prob',
  chapter: 5,
  items: [
    // ======================================================================== 5.5.1a
    {
      num: '5.5.1a',
      kind: 'Definition',
      name: 'Stationary measure and stationary distribution',
      statement: String.raw`Let $p$ be the transition probability of a Markov chain on a countable state space $S$. A measure $\mu$ on $S$ (nonnegative numbers $\mu(x)$, not all $0$) is **stationary** if $\mu p=\mu$, that is
$$\sum_x\mu(x)\,p(x,y)=\mu(y)\quad\text{for all }y.$$
If $\mu$ is a probability measure it is a **stationary distribution**: a chain started with law $\mu$ has law $\mu$ at every time.`,
      idea: String.raw`The row vector $\mu p$ is the law at time $1$ of a chain started from $\mu$. A stationary measure is a fixed point of the linear map $\mu\mapsto\mu p$. On a finite state space the all-ones vector is a right eigenvector of $p$ with eigenvalue $1$, so a nonnegative left eigenvector exists; on an infinite space a stationary measure need not be finite (the counting measure for the symmetric walk on $\Z$) and then there is no stationary distribution.`,
      caption: String.raw`Drag the bars of $\mu$ (blue); the orange bars show $\mu p$ and the nodes of the chain are shaded by $\mu$. The mismatch $\|\mu p-\mu\|_1$ vanishes at a stationary measure. Use “Step” to apply $\mu\mapsto\mu p$, “Snap to $\pi$” to jump to a stationary distribution. For the chain with two closed classes there are many stationary distributions.`,
      deps: ['prob-5.1.1a'],
      see: ['stoch-4.1'],
      tags: ['stationary measures'],
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §5.5, pp. 299–300 (stationary measure definition and examples)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const KEYS = ['gen5', 'bd5', 'wea3', 'two'];
        const cS = v.select('chain', chainOpts(KEYS), 'gen5', { onChange: () => reset() });
        const A = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 300, title: 'the chain, shaded by $\\mu$' });
        const B = v.stage({ x: [-0.6, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'state', title: '$\\mu$ and $\\mu p$', xticks: [0, 1, 2, 3, 4] });
        const hs = [0, 1, 2, 3, 4].map((i) => B.handle(i, 0.2, { color: 'accent', constrain: (x, y) => [i, clampN(y, 0, 1)], label: '' }));
        function reset() { const n = CHAINS[cS.value].n; hs.forEach((h, i) => { h.visible = i < n; h.set(i, i < n ? 1 / n : 0); }); }
        reset();
        const cur = () => hs.slice(0, CHAINS[cS.value].n).map((h) => h.y);
        v.button('Step: $\\mu\\leftarrow\\mu p$', () => { const ch = CHAINS[cS.value], q = muP(cur(), ch.P); q.forEach((x, i) => hs[i].set(i, Math.min(1, x))); });
        v.button('Snap to $\\pi$', () => { const ch = CHAINS[cS.value], pi = piOf(ch.P); Array.from(pi).forEach((x, i) => hs[i].set(i, x)); });
        v.button('Random', () => { const n = CHAINS[cS.value].n, r = v.rng(Math.floor(performance.now())); const m = Array.from({ length: n }, () => r()); const t = sumOf(m); m.forEach((x, i) => hs[i].set(i, x / t)); });
        v.render(() => {
          const ch = CHAINS[cS.value], mu = cur(), q = muP(mu, ch.P), mx = Math.max(...mu, 0.05);
          drawChain(v, A, ch, { colors: mu.map((m) => v.ramp(0.35 + 0.65 * clampN(m / Math.max(mx, 0.3), 0, 1), 'accent')), label: (i) => String(i) });
          mu.forEach((m, i) => { A.text(m.toFixed(2), ch.pos[i][0] * 1.32, ch.pos[i][1] * 1.32, { size: 11, color: 'ink', align: 'center', baseline: 'middle' }); });
          q.forEach((x, i) => { B.rect(i + 0.04, 0, i + 0.34, x, { fill: 'orange', fillAlpha: 0.7, color: 'orange' }); });
          mu.forEach((m, i) => { B.rect(i - 0.34, 0, i - 0.04, m, { fill: 'accent', fillAlpha: 0.7, color: 'accent' }); });
          v.res = { d: l1(Array.from(q), mu), m: sumOf(mu) };
        });
        v.legend([['accent', '$\\mu$'], ['orange', '$\\mu p$']]);
        v.readout(() => v.res && `Total mass $\\sum\\mu=${fr(v.res.m, 3)}$, mismatch $\\|\\mu p-\\mu\\|_1=$ **${fr(v.res.d, 4)}** ${v.res.d < 0.004 ? '— stationary' + (Math.abs(v.res.m - 1) < 0.01 ? ' distribution.' : ' measure (rescale it to get a distribution).') : '— not stationary.'}`);
      },
    },
    // ======================================================================== 5.5.2a
    {
      num: '5.5.2a',
      kind: 'Definition',
      name: 'Reversible measure (detailed balance)',
      statement: String.raw`A measure $\mu$ on the state space of a Markov chain with transition probability $p$ is **reversible** if
$$\mu(x)\,p(x,y)=\mu(y)\,p(y,x)\qquad\text{for all }x,y.$$
(“Detailed balance”: in equilibrium the flow from $x$ to $y$ equals the flow from $y$ to $x$.) A reversible measure is stationary; summing over $x$ gives $\mu p=\mu$.`,
      idea: String.raw`Summing detailed balance over $x$ gives $\sum_x\mu(x)p(x,y)=\mu(y)\sum_xp(y,x)=\mu(y)$, so reversible implies stationary. The converse fails: a chain can have a stationary distribution that circulates around a cycle, with flows in the two directions along an edge different.`,
      caption: String.raw`The arrows carry the flows $\pi(x)p(x,y)$, thick for large. Choose a birth–death chain (always reversible) or a four-state ring whose forward probability $a$ you can change (backward probability $0.9-a$, stay $0.1$). Right: the imbalance $\pi(x)p(x,y)-\pi(y)p(y,x)$ on each edge vanishes only at $a=0.45$.`,
      deps: ['prob-5.5.1a'],
      see: ['stoch-4.9'],
      tags: ['stationary measures', 'reversibility'],
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §5.5, p. 300, equation (5.5.1)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const mode = v.select('chain', [{ value: 'bd', label: 'birth–death' }, { value: 'ring', label: 'ring' }], 'ring');
        const aS = v.slider('forward probability $a$ (ring)', 0.1, 0.8, 0.6, { step: 0.01 });
        const A = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 320, title: 'flows $\\pi(x)p(x,y)$' });
        const B = v.stage({ x: [-0.5, 3.5], y: [-0.3, 0.3], axes: 'box', gutter: true, height: 320, xlabel: 'edge', ylabel: 'flow imbalance', title: 'imbalance along each edge' });
        const ringChain = (a) => {
          const P = [0, 1, 2, 3].map((i) => { const row = [0, 0, 0, 0]; row[(i + 1) % 4] += a; row[(i + 3) % 4] += 0.9 - a; row[i] += 0.1; return row; });
          return { n: 4, pos: CHAINS.gen5.pos.slice(0, 4).map((_, i) => [Math.cos(Math.PI / 2 - (Math.PI * i) / 2), Math.sin(Math.PI / 2 - (Math.PI * i) / 2)]), P };
        };
        v.render(() => {
          const ch = mode.value === 'bd' ? CHAINS.bd5 : ringChain(aS.value), pi = piOf(ch.P), n = ch.n;
          const edges = mode.value === 'bd' ? [[0, 1], [1, 2], [2, 3], [3, 4]] : [[0, 1], [1, 2], [2, 3], [3, 0]];
          let mxF = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) mxF = Math.max(mxF, pi[i] * ch.P[i][j]);
          drawChain(v, A, ch, { w: (i, j) => (pi[i] * ch.P[i][j]) / mxF, colors: pi.map((p) => v.ramp(clampN(p * 3, 0, 1), 'accent')) });
          let worst = 0;
          edges.forEach(([i, j], k) => {
            const d = pi[i] * ch.P[i][j] - pi[j] * ch.P[j][i]; worst = Math.max(worst, Math.abs(d));
            B.rect(k - 0.3, 0, k + 0.3, d, { fill: Math.abs(d) < 1e-4 ? 'green' : 'red', fillAlpha: 0.7, color: Math.abs(d) < 1e-4 ? 'green' : 'red' });
            B.text(`${i}→${j}`, k, -0.27, { size: 11, color: 'muted', align: 'center' });
          });
          B.hline(0, { color: 'faint' });
          aS.el.hidden = mode.value === 'bd';
          v.res = { worst };
        });
        v.readout(() => v.res && `Largest imbalance over the edges: **${v.res.worst < 1e-6 ? '0' : fr(v.res.worst, 4)}**. ${v.res.worst < 1e-4 ? '$\\pi$ is reversible: flows balance edge by edge.' : '$\\pi$ is stationary but not reversible: probability circulates around the ring.'}`);
      },
    },
    // ======================================================================== 5.5.5
    {
      num: '5.5.5',
      kind: 'Theorem',
      name: 'Time reversal of a stationary chain',
      statement: String.raw`Let $X_0,X_1,\dots$ be a Markov chain with transition probability $p$ and stationary distribution $\mu$ with $\mu(y)>0$ for all $y$, started from $\mu$. Then for every $n$, the reversed sequence $(X_n,X_{n-1},\dots,X_0)$ is a Markov chain with transition probability
$$\hat p(x,y)=\frac{\mu(y)\,p(y,x)}{\mu(x)} .$$
The chain is reversible exactly when $\hat p=p$.`,
      idea: String.raw`Write the probability of a path $x_0\dots x_n$ as $\mu(x_0)p(x_0,x_1)\cdots p(x_{n-1},x_n)$. Using $\mu(x_{k})p(x_k,x_{k+1})=\mu(x_{k+1})\hat p(x_{k+1},x_k)$ repeatedly, this equals $\mu(x_n)\hat p(x_n,x_{n-1})\cdots\hat p(x_1,x_0)$, the path probability of a chain with kernel $\hat p$ started from $\mu$. Stationarity makes $\hat p$ a stochastic matrix.`,
      caption: String.raw`A stationary run of $N$ steps is read **backwards**. Left: the matrix $p$. Middle: the dual matrix $\hat p(x,y)=\pi(y)p(y,x)/\pi(x)$ computed from $\pi$. Right: the transition frequencies of the reversed run, estimated from the seeded sample. The middle and right pictures agree; for the birth–death chain all three coincide.`,
      deps: ['prob-5.5.1a'],
      see: ['stoch-4.12'],
      tags: ['stationary measures', 'reversibility'],
      viz(v) {
        const cS = v.select('chain', chainOpts(['gen5', 'wea3', 'per4', 'bd5']), 'gen5');
        const nS = v.slider('steps $N$', 1000, 200000, 40000, { log: true, int: true, sig: 2 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const mk = (t) => v.stage({ x: [0, 5], y: [0, 5], equal: true, axes: false, height: 250, minWidth: 210, title: t });
        const S1 = mk('$p$ (forward)'), S2 = mk('$\\hat p$ from $\\pi$'), S3 = mk('reversed run, estimated');
        [S1, S2, S3].forEach((s) => { s.v = v; });
        v.render(() => {
          const ch = CHAINS[cS.value], n = ch.n, P = ch.P, pi = piOf(P), N = nS.value, r = v.rng(seed * 71 + n);
          const cum = cumRows(P), X = simPath(cum, Math.floor(r() * n), N, r), C = Array.from({ length: n }, () => new Float64Array(n));
          for (let t = 0; t < N; t++) C[X[t]][X[t + 1]]++;
          const dual = P.map((_, x) => P.map((__, y) => (pi[y] * P[y][x]) / pi[x]));
          const emp = P.map((_, x) => { let c = 0; for (let z = 0; z < n; z++) c += C[z][x]; return P.map((__, y) => (c ? C[y][x] / c : 0)); });
          matGrid(S1, P); matGrid(S2, dual); matGrid(S3, emp);
          let err = 0, dev = 0; for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) { err = Math.max(err, Math.abs(emp[x][y] - dual[x][y])); dev = Math.max(dev, Math.abs(dual[x][y] - P[x][y])); }
          v.res = { err, dev };
        });
        v.readout(() => v.res && `Largest entry of $|\\text{estimated}-\\hat p|$: **${fr(v.res.err, 3)}** (shrinks like $N^{-1/2}$). Largest entry of $|\\hat p-p|$: ${fr(v.res.dev, 3)} ${v.res.dev < 1e-6 ? '— reversible: filming it backwards gives the same chain.' : '— not reversible: the film run backwards is a different chain.'}`);
      },
    },
    // ======================================================================== 5.5.6
    {
      num: '5.5.6',
      kind: 'Theorem',
      name: 'Kolmogorov’s cycle condition',
      statement: String.raw`An irreducible transition probability $p$ has a nonzero reversible measure if and only if (a) $p(x,y)>0$ implies $p(y,x)>0$, and (b) for every loop $x_0,x_1,\dots,x_k=x_0$ with positive transition probabilities,
$$\prod_{i=0}^{k-1}p(x_i,x_{i+1})=\prod_{i=0}^{k-1}p(x_{i+1},x_i).$$
The conclusion is existence of a reversible measure; for a transient chain it does not assert that every stationary measure is reversible.`,
      idea: String.raw`Detailed balance makes the measure factors cancel around every cycle. Conversely, set $\mu(a)=1$ at one state and define $\mu(x)$ by multiplying $p(x_i,x_{i+1})/p(x_{i+1},x_i)$ along a path from $a$ to $x$. Reversing a second path forms a loop, so the cycle condition makes this definition independent of the path. Comparing a path to $x$ with the same path followed by $x\to y$ gives detailed balance. This constructs a reversible measure without assuming recurrence or a pre-existing stationary measure.`,
      caption: String.raw`A four-state ring: $p(i,i+1)=f_i$, $p(i,i-1)=0.3$, and the rest stays put. Move the sliders $f_0,\dots,f_3$. The left bars compare the product of the forward probabilities around the cycle with the product of the backward ones; the right bars show the detailed-balance defect of the stationary distribution on each edge. The defect is $0$ exactly when the two products agree ("Make reversible" adjusts $f_3$).`,
      deps: ['prob-5.5.2a'],
      see: ['stoch-4.10'],
      tags: ['reversibility'],
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 5.5.6 and proof, p. 302; counterexample from Example 5.5.2, p. 300'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const fS = [0, 1, 2, 3].map((i) => v.slider(`$f_${i}$`, 0.1, 0.65, i === 3 ? 0.45 : 0.3, { step: 0.01 }));
        v.button('Make reversible', () => { const t = 0.3 ** 4 / (fS[0].value * fS[1].value * fS[2].value); fS[3].set(clampN(t, 0.1, 0.65)); });
        const A = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 300, title: 'the ring' });
        const B = v.stage({ x: [-0.6, 5.6], y: [0, 0.01], axes: 'box', gutter: true, height: 300, title: 'cycle products and edge defects', xticks: [] });
        v.render(() => {
          const f = fS.map((s) => s.value), g = 0.3;
          const P = [0, 1, 2, 3].map((i) => { const row = [0, 0, 0, 0]; row[(i + 1) % 4] += f[i]; row[(i + 3) % 4] += g; row[i] += 1 - f[i] - g; return row; });
          const pos = [0, 1, 2, 3].map((i) => [Math.cos(Math.PI / 2 - (Math.PI * i) / 2), Math.sin(Math.PI / 2 - (Math.PI * i) / 2)]);
          const ch = { n: 4, pos, P }, pi = piOf(P);
          drawChain(v, A, ch, { w: (i, j) => P[i][j] });
          const fw = f[0] * f[1] * f[2] * f[3], bw = g ** 4, defects = [[0, 1], [1, 2], [2, 3], [3, 0]].map(([i, j]) => pi[i] * P[i][j] - pi[j] * P[j][i]);
          const top = Math.max(fw, bw, 0.004) * 1.3;
          B.setView([-0.6, 5.6], [-top * 0.5, top]);
          B.rect(-0.3, 0, 0.3, fw, { fill: 'accent', fillAlpha: 0.75, color: 'accent' }); B.text('forward', 0, -top * 0.08, { size: 11, color: 'muted', align: 'center' });
          B.rect(0.7, 0, 1.3, bw, { fill: 'orange', fillAlpha: 0.75, color: 'orange' }); B.text('backward', 1, -top * 0.08, { size: 11, color: 'muted', align: 'center' });
          const sc = top * 0.45 / Math.max(1e-9, ...defects.map(Math.abs));
          defects.forEach((d, k) => { B.rect(2.7 + k * 0.7 - 0.25, 0, 2.7 + k * 0.7 + 0.25, d * sc, { fill: Math.abs(d) < 1e-4 ? 'green' : 'red', fillAlpha: 0.75, color: 'red' }); });
          B.text('edge defects (rescaled)', 3.7, -top * 0.08, { size: 11, color: 'muted', align: 'center' });
          B.hline(0, { color: 'faint' });
          v.res = { fw, bw, d: Math.max(...defects.map(Math.abs)) };
        });
        v.readout(() => v.res && `Forward product $f_0f_1f_2f_3=${v.res.fw.toExponential(2)}$, backward product $0.3^4=${v.res.bw.toExponential(2)}$. Largest defect: **${v.res.d < 1e-5 ? '0' : fr(v.res.d, 4)}** ${Math.abs(v.res.fw - v.res.bw) < 2e-5 ? '— the products agree and the chain is reversible.' : '— the products differ, so there is no reversible measure.'}`);
      },
    },
    // ======================================================================== 5.5.7
    {
      num: '5.5.7',
      kind: 'Theorem',
      name: 'Cycle trick: visits between returns are stationary',
      statement: String.raw`Let $x$ be a recurrent state of a Markov chain and $T_x=\inf\{n\ge1:X_n=x\}$. Define
$$\mu_x(y)=E_x\sum_{n=0}^{T_x-1}\mathbf 1_{\{X_n=y\}}=E_x\bigl(\text{number of visits to }y\text{ during one excursion from }x\bigr).$$
Then $\mu_x$ is a stationary measure: $\mu_xp=\mu_x$, with $\mu_x(x)=1$. It lives on the recurrent class of $x$.`,
      idea: String.raw`Write $\mu_x(y)=\sum_{n\ge0}P_x(X_n=y,\,T_x>n)$. Condition on the position at time $n$ and take one more step: the event $\{T_x>n\}$ is determined by $X_0,\dots,X_n$, so $\sum_z\mu_x(z)p(z,y)=\sum_{n\ge0}P_x(X_{n+1}=y,\,T_x>n)=\sum_{m\ge1}P_x(X_m=y,T_x\ge m)$. This is $\mu_x(y)$ except for the $m=T_x$ term, which contributes $P_x(X_{T_x}=y)=\mathbf 1_{y=x}$ (recurrence makes $T_x<\infty$), and the $m=0$ term, which is $\mathbf 1_{y=x}$ as well. They cancel.`,
      caption: String.raw`Choose a chain, a base state $x$ and the number of excursions $K$. The blue bars are the average number of visits to each state per seeded excursion from $x$; the orange rings are the exact $\pi(y)/\pi(x)$. The green bars are $\hat\mu p$: they sit on top of the blue ones, as stationarity requires. The base state is always exactly $1$.`,
      deps: ['prob-5.5.1a', 'prob-5.2.5', 'prob-5.3.1a'],
      tags: ['stationary measures'],
      viz(v) {
        const cS = v.select('chain', chainOpts(['gen5', 'bd5', 'wea3']), 'gen5');
        const xS = v.slider('base state $x$', 0, 4, 0, { int: true });
        const kS = v.slider('excursions $K$', 100, 20000, 2000, { log: true, int: true, sig: 2 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [-0.6, 4.6], y: [0, 3], axes: 'box', gutter: true, height: 320, xlabel: 'state $y$', title: 'visits per excursion from $x$', xticks: [0, 1, 2, 3, 4] });
        v.render(() => {
          const ch = CHAINS[cS.value], n = ch.n, x = Math.min(xS.value, n - 1), K = kS.value, r = v.rng(seed * 19 + x * 7 + n), cum = cumRows(ch.P), pi = piOf(ch.P);
          const mu = new Float64Array(n);
          for (let k = 0; k < K; k++) { const e = excursion(cum, x, r); for (let y = 0; y < n; y++) mu[y] += e.cnt[y] / K; }
          const q = muP(mu, ch.P), ex = muX(pi, x);
          A.setView([-0.6, n - 0.4], [0, Math.max(...ex, ...mu) * 1.2]);
          for (let y = 0; y < n; y++) {
            A.rect(y - 0.36, 0, y - 0.04, mu[y], { fill: 'accent', fillAlpha: 0.75, color: 'accent' });
            A.rect(y + 0.04, 0, y + 0.36, q[y], { fill: 'green', fillAlpha: 0.7, color: 'green' });
            A.dot(y, ex[y], { r: 6, hollow: true, color: 'orange' });
          }
          v.res = { d: l1(Array.from(q), Array.from(mu)), e: l1(Array.from(mu), ex), tot: sumOf(mu), x, ipi: 1 / pi[x] };
        });
        v.legend([['accent', '$\\hat\\mu_x$'], ['green', '$\\hat\\mu_xp$'], ['orange', 'exact $\\pi/\\pi(x)$']]);
        v.readout(() => v.res && `$\\hat\\mu(x)=1$. Mismatch $\\|\\hat\\mu p-\\hat\\mu\\|_1=$ **${fr(v.res.d, 3)}**; distance to the exact measure ${fr(v.res.e, 3)}. Mean excursion length $\\sum\\hat\\mu=${fr(v.res.tot, 3)}$ (exact $1/\\pi(x)=${fr(v.res.ipi, 3)}$).`);
      },
    },
    // ======================================================================== 5.5.9
    {
      num: '5.5.9',
      kind: 'Theorem',
      name: 'Uniqueness of stationary measures for recurrent chains',
      statement: String.raw`Let $p$ be an irreducible recurrent transition probability. Then its stationary measure is unique up to a constant multiple: if $\mu$ is stationary then $\mu=\mu(x)\,\mu_x$ for every state $x$, with $\mu_x$ the excursion measure of 5.5.7.`,
      idea: String.raw`Given a stationary $\mu$ and a state $x$, iterate $\mu(y)=\mu(x)p(x,y)+\sum_{z\ne x}\mu(z)p(z,y)$ along paths that avoid $x$. This shows $\mu(y)\ge\mu(x)\mu_x(y)$ for every $y$ (an expected number of visits before the first return). The difference $\mu-\mu(x)\mu_x$ is again stationary and vanishes at $x$; by irreducibility (a positive value at $y$ would be carried to $x$ in finitely many steps) it vanishes everywhere.`,
      caption: String.raw`For each recurrent state $x$ a seeded sample of $3000$ excursions gives $\hat\mu_x$, normalised to total mass $1$ and drawn as a bar of its own colour. For an irreducible chain all the colours agree, up to noise. The chain with two closed classes violates irreducibility: the classes $\{2,3\}$ and $\{4\}$ give different stationary measures.`,
      deps: ['prob-5.5.7'],
      see: ['stoch-4.4'],
      tags: ['stationary measures'],
      viz(v) {
        const cS = v.select('chain', chainOpts(['gen5', 'bd5', 'wea3', 'two']), 'gen5');
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [-0.6, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'state $y$', title: 'normalised excursion measures', xticks: [0, 1, 2, 3, 4] });
        v.render(() => {
          const key = cS.value, ch = CHAINS[key], n = ch.n, K = 3000, bases = key === 'two' ? [2, 3, 4] : Array.from({ length: n }, (_, i) => i);
          const cls = key === 'two' ? { 2: 'A', 3: 'A', 4: 'B' } : null, r = v.rng(seed * 29 + n), cum = cumRows(ch.P);
          const M = bases.map((x) => { const mu = new Float64Array(n); for (let k = 0; k < K; k++) { const e = excursion(cum, x, r); for (let y = 0; y < n; y++) mu[y] += e.cnt[y]; } const t = sumOf(mu); return mu.map((m) => m / t); });
          const B = bases.length;
          A.setView([-0.6, n - 0.4], [0, Math.max(0.25, ...M.map((m) => Math.max(...m))) * 1.15]);
          for (let y = 0; y < n; y++) bases.forEach((x, b) => { const x0 = y - 0.4 + (0.8 * b) / B; A.rect(x0, 0, x0 + 0.8 / B, M[b][y], { fill: SCOL[x % 5], fillAlpha: 0.8, color: SCOL[x % 5] }); });
          let worst = 0, cross = 0;
          for (let a = 0; a < B; a++) for (let b = a + 1; b < B; b++) { const d = l1(Array.from(M[a]), Array.from(M[b])); if (!cls || cls[bases[a]] === cls[bases[b]]) worst = Math.max(worst, d); else cross = Math.max(cross, d); }
          v.res = { worst, cross, two: !!cls };
        });
        v.legend([['accent', 'base 0'], ['orange', 'base 1'], ['green', 'base 2'], ['purple', 'base 3'], ['teal', 'base 4']]);
        v.readout(() => v.res && `Largest $\\ell^1$ distance between normalised measures from bases in one class: **${fr(v.res.worst, 3)}** (sampling noise).${v.res.two ? `\nBetween the classes $\\{2,3\\}$ and $\\{4\\}$: ${fr(v.res.cross, 3)} — a different measure, since the chain is not irreducible.` : ''}`);
      },
    },
    // ======================================================================== 5.5.10
    {
      num: '5.5.10',
      kind: 'Theorem',
      name: 'States charged by a stationary distribution are recurrent',
      statement: String.raw`If $\pi$ is a stationary distribution of a Markov chain and $\pi(y)>0$, then $y$ is a recurrent state.`,
      idea: String.raw`Start the chain from $\pi$. By stationarity $E_\pi N_n(y)=n\pi(y)$ grows linearly, where $N_n(y)$ is the number of visits to $y$ up to time $n$. If $y$ were transient, $E_xN_\infty(y)=\rho_{xy}/(1-\rho_{yy})\le1/(1-\rho_{yy})<\infty$ for every starting point $x$ (5.2.6), so $E_\pi N_n(y)=\sum_x\pi(x)E_xN_n(y)$ would stay bounded by $1/(1-\rho_{yy})$. That contradicts linear growth, so $\rho_{yy}=1$.`,
      caption: String.raw`A five-state chain with transient states $0,1$ and closed classes $\{2,3\}$ and $\{4\}$. The slider chooses a stationary distribution $\pi=\alpha\pi_{\{2,3\}}+(1-\alpha)\delta_4$. Left: from $\pi$ the expected visits $E_\pi N_n(y)=n\pi(y)$ grow linearly for $y=2,3,4$ and not at all for the transient states, which $\pi$ does not charge. Right: from the chosen start the expected visits to the transient states $0,1$ saturate.`,
      deps: ['prob-5.3.1', 'prob-5.5.1a'],
      tags: ['stationary measures', 'recurrence'],
      viz(v) {
        const aS = v.slider('weight $\\alpha$ of class $\\{2,3\\}$', 0, 1, 0.6, { step: 0.01 });
        const sS = v.select('start', [{ value: '0', label: 'state 0' }, { value: '1', label: 'state 1' }, { value: '2', label: 'state 2' }, { value: 'pi', label: '$\\pi$' }], '0');
        const NN = 60, P = CHAINS.two.P;
        const L = v.stage({ x: [0, NN], y: [0, NN], axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$E_\\pi N_n(y)=n\\pi(y)$' });
        const R = v.stage({ x: [0, NN], y: [0, 10], axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$E_{\\text{start}}N_n(y)$' });
        v.render(() => {
          const a = aS.value, pA = [0.6 / 1.3, 0.7 / 1.3], pi = [0, 0, a * pA[0], a * pA[1], 1 - a];
          let mu = sS.value === 'pi' ? Float64Array.from(pi) : Float64Array.from({ length: 5 }, (_, i) => (i === +sS.value ? 1 : 0));
          const E = Array.from({ length: 5 }, () => [[0, 0]]);
          let mx = 1;
          for (let n = 1; n <= NN; n++) { mu = muP(mu, P); for (let y = 0; y < 5; y++) { E[y].push([n, E[y][n - 1][1] + mu[y]]); mx = Math.max(mx, E[y][n][1]); } }
          R.setView([0, NN], [0, mx * 1.1]);
          for (let y = 0; y < 5; y++) { L.path([[0, 0], [NN, NN * pi[y]]], { color: SCOL[y], width: 2 }); R.path(E[y], { color: SCOL[y], width: 2 }); }
          L.setView([0, NN], [0, Math.max(1, NN * Math.max(...pi)) * 1.1]);
          v.res = { pi, t: [E[0][NN][1], E[1][NN][1]], mx };
        });
        v.legend([0, 1, 2, 3, 4].map((y) => [SCOL[y], `state ${y}`]));
        v.readout(() => v.res && `$\\pi=(0,\\,0,\\,${v.res.pi.slice(2).map((x) => fr(x, 2)).join(',\\,')})$: only the recurrent states carry mass.\nAt $n=60$ the expected visits to the transient states have saturated at ${fr(v.res.t[0], 2)} and ${fr(v.res.t[1], 2)}; to a state with $\\pi(y)>0$ they keep growing at rate $\\pi(y)$.`);
      },
    },
    // ======================================================================== 5.5.11
    {
      num: '5.5.11',
      kind: 'Theorem',
      name: 'Kac’s formula π(x) = 1/E_xT_x',
      statement: String.raw`Let $p$ be an irreducible, recurrent transition probability with a stationary distribution $\pi$ (that is, positive recurrent). Then for every state $x$
$$\pi(x)=\frac1{E_xT_x},\qquad T_x=\inf\{n\ge1:X_n=x\}.$$`,
      idea: String.raw`The excursion measure $\mu_x$ of 5.5.7 is stationary with $\mu_x(x)=1$ and total mass $\sum_y\mu_x(y)=E_xT_x$ (each step of an excursion is a visit somewhere). By uniqueness (5.5.9) $\pi=\mu_x/E_xT_x$, and 5.5.10 shows the total mass is finite when $\pi$ exists. Evaluating at $x$ gives $\pi(x)=1/E_xT_x$.`,
      caption: String.raw`Choose an irreducible chain and the number $K$ of seeded excursions per state. For each state, blue is the exact $\pi(x)$ and orange the estimate $1/\hat E_xT_x$ from the average length of $K$ simulated excursions. The estimates settle on the exact bars as $K$ grows.`,
      deps: ['prob-5.5.7', 'prob-5.5.9', 'prob-5.5.10'],
      see: ['stoch-4.2'],
      tags: ['stationary measures'],
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 5.5.11 and proof, p. 306'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const cS = v.select('chain', chainOpts(['gen5', 'bd5', 'wea3']), 'gen5');
        const kS = v.slider('excursions $K$ per state', 20, 5000, 500, { log: true, int: true, sig: 2 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const KM = 5000;
        const A = v.stage({ x: [-0.6, 4.6], y: [0, 0.5], axes: 'box', gutter: true, height: 320, xlabel: 'state $x$', title: '$\\pi(x)$ and $1/\\hat E_xT_x$', xticks: [0, 1, 2, 3, 4] });
        let cache = null;
        v.render(() => {
          const key = `${cS.value}|${seed}`, ch = CHAINS[cS.value], n = ch.n;
          if (!cache || cache.key !== key) { const r = v.rng(seed * 37 + n), cum = cumRows(ch.P); cache = { key, T: Array.from({ length: n }, (_, x) => Float64Array.from({ length: KM }, () => excursion(cum, x, r).T)) }; }
          const pi = piOf(ch.P), K = kS.value, est = cache.T.map((t) => { let s = 0; for (let i = 0; i < K; i++) s += t[i]; return s / K; });
          A.setView([-0.6, n - 0.4], [0, Math.max(...pi, ...est.map((e) => 1 / e)) * 1.25]);
          for (let x = 0; x < n; x++) {
            A.rect(x - 0.36, 0, x - 0.04, pi[x], { fill: 'accent', fillAlpha: 0.75, color: 'accent' });
            A.rect(x + 0.04, 0, x + 0.36, 1 / est[x], { fill: 'orange', fillAlpha: 0.75, color: 'orange' });
          }
          v.res = { pi, est };
        });
        v.legend([['accent', 'exact $\\pi(x)$'], ['orange', '$1/\\hat E_xT_x$']]);
        v.readout(() => v.res && `Mean return times: ${v.res.est.map((e, x) => `$\\hat E_${x}T=${fr(e, 2)}$ (exact $${fr(1 / v.res.pi[x], 2)}$)`).join(', ')}.`);
      },
    },
    // ======================================================================== 5.5.11a
    {
      num: '5.5.11a',
      kind: 'Definition',
      name: 'Positive and null recurrence',
      statement: String.raw`A recurrent state $x$ is **positive recurrent** if $E_xT_x<\infty$ and **null recurrent** if $E_xT_x=\infty$, where $T_x=\inf\{n\ge1:X_n=x\}$ is the return time. (A transient state has $P_x(T_x=\infty)>0$ and so $E_xT_x=\infty$ too, but it is not recurrent.)`,
      idea: String.raw`Recurrence says only that the return time is almost surely finite. Positive recurrence asks that it also has a finite mean, which is the condition under which a stationary distribution exists (5.5.11). The simple walk on $\Z$ is null recurrent: it comes back with probability $1$, but $P(T>t)$ decays like $t^{-1/2}$, too slowly to be summable.`,
      caption: String.raw`A walk on $\{0,1,2,\dots\}$ that moves up with probability $p$, down with probability $1-p$ and is pushed from $0$ to $1$. Slide $p$ across $1/2$. Left: the running average of $2000$ return times to $0$ (censored at $5000$ steps), against the exact $E_0T_0=(2-2p)/(1-2p)$. Right: the survival function $P(T_0>t)$ on log–log axes: exponential decay for $p<\tfrac12$, the slope $-1/2$ at $p=\tfrac12$, a positive plateau (non-return) for $p>\tfrac12$.`,
      deps: ['prob-5.3.1a'],
      see: ['stoch-3.7'],
      tags: ['recurrence'],
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §5.5, pp. 306–307 (definitions and Theorem 5.5.12)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const pS = v.slider('$p$ (up)', 0.3, 0.7, 0.4, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const K = 2000, CAP = 5000;
        const L = v.stage({ x: [1, K], y: [1, 1000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'number of excursions', title: 'running mean of $T_0$' });
        const R = v.stage({ x: [1, CAP], y: [1e-3, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$t$', title: '$P(T_0>t)$' });
        let cache = null;
        v.render(() => {
          const p = pS.value, key = `${p}|${seed}`;
          if (!cache || cache.key !== key) { const r = v.rng(seed * 43 + Math.round(p * 100)); cache = { key, T: Array.from({ length: K }, () => reflectReturn(r, p, 0, CAP)) }; }
          const T = cache.T, run = []; let s = 0;
          for (let i = 0; i < K; i++) { s += Math.abs(T[i]); if ((i + 1) % 5 === 0 || i < 20) run.push([i + 1, s / (i + 1)]); }
          const abs = T.map(Math.abs).sort((a, b) => a - b), surv = [];
          for (let e = 0; e <= 70; e++) { const t = 10 ** ((e * Math.log10(CAP)) / 70); let lo = 0, hi = K; while (lo < hi) { const m = (lo + hi) >> 1; if (abs[m] <= t) lo = m + 1; else hi = m; } surv.push([Math.max(1, t), Math.max(1e-4, (K - lo) / K)]); }
          L.path(run, { color: 'accent', width: 2 });
          const ex = p < 0.5 ? (2 - 2 * p) / (1 - 2 * p) : Infinity;
          if (isFinite(ex)) L.hline(ex, { color: 'orange', dash: [5, 4], width: 1.6 });
          R.path(surv, { color: 'accent', width: 2 });
          R.path([[1, 1], [CAP, 1 / Math.sqrt(CAP)]], { color: 'faint', dash: [4, 4] });
          v.res = { ex, mean: s / K, cens: T.filter((t) => t < 0).length / K };
        });
        v.readout(() => v.res && `Average return time (censored at ${CAP}): **${fr(v.res.mean, 2)}**. Fraction not back within ${CAP} steps: ${fr(100 * v.res.cens, 1)}%.\n${v.res.ex < Infinity ? `$p<1/2$: positive recurrent, $E_0T_0=${fr(v.res.ex, 2)}$.` : pS.value === 0.5 ? '$p=1/2$: null recurrent, the average keeps growing (dashed slope $-1/2$ on the right).' : '$p>1/2$: transient, a positive fraction never returns.'}`);
      },
    },
    // ======================================================================== 5.5.12
    {
      num: '5.5.12',
      kind: 'Theorem',
      name: 'Positive recurrence is a class property',
      statement: String.raw`If $x$ is positive recurrent and $x\to y$ (so $y$ is in the same recurrent class), then $y$ is positive recurrent. In an irreducible recurrent chain either every state is positive recurrent, or none is; the first case happens exactly when a stationary distribution exists.`,
      idea: String.raw`If $x$ is positive recurrent, Kac's theorem (5.5.11) with the stationary measure $\mu_x$ of 5.5.7 shows $\mu_x$ has total mass $E_xT_x<\infty$, so normalising gives a stationary distribution $\pi$ with $\pi(y)>0$ on the class (5.5.9). For any $y$ in the class, $E_yT_y=1/\pi(y)<\infty$ by 5.5.11.`,
      caption: String.raw`The reflecting walk of the previous item, $p$ up, $1-p$ down. Bars: the estimated mean return time $\hat E_xT_x$ for $x=0,\dots,4$ (log scale, from $800$ seeded excursions censored at $5000$ steps). Orange dots: the exact $1/\pi(x)$. For $p<\tfrac12$ all five are finite and the product $\pi(x)E_xT_x$ is $1$ for each; as $p$ reaches $\tfrac12$ all five bars shoot up together (they hit the censoring level).`,
      deps: ['prob-5.5.11', 'prob-5.5.11a', 'prob-5.5.7'],
      see: ['stoch-4.5'],
      tags: ['recurrence', 'stationary measures'],
      viz(v) {
        const pS = v.slider('$p$ (up)', 0.2, 0.55, 0.35, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const K = 800, CAP = 5000;
        const A = v.stage({ x: [-0.6, 4.6], y: [1, CAP * 1.2], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'state $x$', title: 'mean return times', xticks: [0, 1, 2, 3, 4] });
        let cache = null;
        v.render(() => {
          const p = pS.value, key = `${p}|${seed}`;
          if (!cache || cache.key !== key) { const r = v.rng(seed * 47 + Math.round(p * 100)); cache = { key, est: [0, 1, 2, 3, 4].map((x) => { let s = 0; for (let k = 0; k < K; k++) s += Math.abs(reflectReturn(r, p, x, CAP)); return s / K; }) }; }
          const est = cache.est;
          for (let x = 0; x < 5; x++) {
            A.rect(x - 0.3, 1, x + 0.3, Math.max(1, est[x]), { fill: 'accent', fillAlpha: 0.7, color: 'accent' });
            if (p < 0.5) A.dot(x, 1 / piRefl(p, x), { r: 6, color: 'orange' });
          }
          v.res = { est, p, prod: est.map((e, x) => (p < 0.5 ? e * piRefl(p, x) : NaN)) };
        });
        v.legend([['accent', 'estimate (censored)'], ['orange', 'exact $1/\\pi(x)$']]);
        v.readout(() => v.res && (v.res.p < 0.5 ? `$\\hat E_xT_x\\cdot\\pi(x)=$ ${v.res.prod.map((q) => fr(q, 2)).join(', ')} for $x=0..4$ (each should be $1$, up to noise).\nAll five states are positive recurrent together.` : `At $p\\ge1/2$ there is no stationary distribution: all five mean return times are infinite (the bars show the censoring level, not a mean).`));
      },
    },
    // ======================================================================== 5.5.15
    {
      num: '5.5.15',
      kind: 'Theorem',
      name: 'A stationary distribution makes stationary measures unique',
      statement: String.raw`Let $p$ be irreducible. If a stationary distribution $\pi$ exists, then $p$ is positive recurrent and every stationary measure is a constant multiple of $\pi$. In particular $\pi$ is the only stationary distribution.`,
      idea: String.raw`Since $\pi(y)>0$ for some $y$, that state is recurrent (5.5.10) and, by irreducibility, so are all states. A recurrent irreducible chain has a unique stationary measure up to scaling (5.5.9), and it is $\pi$ because $\pi$ is one.`,
      caption: String.raw`Three different starting guesses (a point mass at $0$, one at the last state, and a skewed vector) are pushed through $\mu\mapsto\mu p$; the plot shows $\|\mu_t-\pi\|_1$ against $t$ on a log scale. For an aperiodic irreducible chain all three collapse onto the same $\pi$. For the period-2 chain the raw iterates keep oscillating, but their running averages (switch “average the iterates” on) still converge to the same $\pi$.`,
      deps: ['prob-5.5.10', 'prob-5.5.9'],
      tags: ['stationary measures'],
      viz(v) {
        const cS = v.select('chain', chainOpts(['gen5', 'bd5', 'per4']), 'per4');
        const avg = v.toggle('average the iterates', false);
        const T = 60;
        const A = v.stage({ x: [0, T], y: [1e-8, 3], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$t$', title: '$\\|\\mu_t-\\pi\\|_1$' });
        const B = v.stage({ x: [-0.6, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'state', title: '$\\mu_{60}$ from each start', xticks: [0, 1, 2, 3, 4] });
        v.render(() => {
          const ch = CHAINS[cS.value], n = ch.n, pi = piOf(ch.P, 20000), starts = [Array.from({ length: n }, (_, i) => (i === 0 ? 1 : 0)), Array.from({ length: n }, (_, i) => (i === n - 1 ? 1 : 0)), Array.from({ length: n }, (_, i) => (i === 1 ? 5 : 1) / (n + 4))];
          const cols = ['accent', 'orange', 'green'], fin = [];
          starts.forEach((s0, k) => {
            let mu = Float64Array.from(s0), run = Float64Array.from(s0); const pts = [[0, l1(s0, pi)]];
            for (let t = 1; t <= T; t++) { mu = muP(mu, ch.P); for (let i = 0; i < n; i++) run[i] += mu[i]; const cur = avg.value ? Array.from(run, (x) => x / (t + 1)) : Array.from(mu); pts.push([t, Math.max(1e-8, l1(cur, pi))]); if (t === T) fin.push(cur); }
            A.path(pts, { color: cols[k], width: 2 });
          });
          for (let y = 0; y < n; y++) { fin.forEach((f, k) => B.rect(y - 0.36 + 0.24 * k, 0, y - 0.12 + 0.24 * k, f[y], { fill: cols[k], fillAlpha: 0.75, color: cols[k] })); B.dot(y, pi[y], { r: 6, hollow: true, color: 'ink' }); }
          v.res = { d: fin.map((f) => l1(f, pi)) };
        });
        v.legend([['accent', 'start $\\delta_0$'], ['orange', 'start $\\delta_{last}$'], ['green', 'skewed start']]);
        v.readout(() => v.res && `After $60$ steps the distances to $\\pi$ are ${v.res.d.map((x) => `**${x < 1e-7 ? '≈0' : fr(x, 4)}**`).join(', ')}. Rings: $\\pi$.${cS.value === 'per4' && !avg.value ? '\nPeriod $2$: the raw iterates alternate between two laws and do not converge; the stationary law is still the same.' : ''}`);
      },
    },
  ],
};
