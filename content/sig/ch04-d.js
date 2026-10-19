// Signals & Systems — Chapter 4: Fourier series (items 4.13–4.14)
import { TAU, PI, WAVES, coefsOf, waveMenu, partial, zip, grid, powerOf, PI_TICKS } from './ch04.shared.js';

const EULER = 0.5772156649015329;
/** Harmonic number H_n (exact sum up to 2e6 terms, asymptotic beyond). */
const harm = (n) => { if (n <= 2e6) { let s = 0; for (let k = n; k >= 1; k--) s += 1 / k; return s; } return Math.log(n) + EULER + 1 / (2 * n); };

export default {
  collection: 'sig',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Paradox',
      name: 'Continuous signals with divergent Fourier series',
      statement: String.raw`Continuity does not make a Fourier series converge. There is a continuous $2\pi$-periodic function $x$ whose partial sums $S_N(x)(0)$ are **unbounded** as $N\to\infty$, so the series diverges at $t=0$. In fact the quantity
$$L_N=\frac1{2\pi}\int_{-\pi}^{\pi}|D_N(u)|\,du\ \ \sim\ \frac4{\pi^2}\ln N$$
(the Lebesgue constant) is the norm of the map $x\mapsto S_N(x)(0)$ on continuous functions, and it tends to infinity. For comparison, Dirichlet's theorem (sig-4.3) gives convergence for piecewise-monotone signals, and the Fourier series of every continuous function does converge in mean square (sig-4.5).`,
      idea: String.raw`Explicit construction in the style of Fejér. For integers $n<m$ put $P_{m,n}(t)=\sum_{k=1}^n\frac{\cos((m-k)t)-\cos((m+k)t)}{k}=2\sin(mt)\sum_{k=1}^n\frac{\sin kt}{k}$. The sums $\sum_{k\le n}\sin(kt)/k$ are bounded by $\operatorname{Si}(\pi)=1.852\ldots$ uniformly in $n$ and $t$, so $|P_{m,n}|\le3.71$ whatever $n$ and $m$ are, and $P_{m,n}(0)=0$. But its partial sum of degree $m$ keeps only the first cosines, $S_mP_{m,n}(0)=\sum_{k\le n}1/k=H_n\approx\ln n$. Now add blocks of rapidly separated frequencies with summable weights $x=\sum_j j^{-2}P_{m_j,n_j}$, $m_j=2n_j$, $n_j=2^{j^3}$: the sum converges uniformly (so $x$ is continuous), yet $S_{m_j}(x)(0)=H_{n_j}/j^2\ge j\ln2\to\infty$. The abstract reason is the Banach–Steinhaus theorem applied to $L_N\to\infty$ (rca-5.11 for this divergence application).`,
      caption: String.raw`**Left, one block.** Choose the size $n$ of a block $P_{2n,n}$. Grey is the block itself (a trigonometric polynomial that never exceeds $3.71$, dashed red), blue is its partial sum of degree $m=2n$; at the origin the block is $0$ while its partial sum reaches $H_n\approx\ln n$, the gold point, and the peak of the blue curve keeps rising (slowly) as $n$ grows. **Right, the assembled function.** With weights $j^{-2}$ and block sizes $n_j=2^{j^3}$ the partial sum of degree $m_j$ at the origin is $H_{n_j}/j^2$ (blue bars, computed exactly for small $j$ and from $H_n=\ln n+\gamma+\frac1{2n}$ beyond), while $x$ itself is bounded by $2\operatorname{Si}(\pi)\sum j^{-2}<6.10$ (red line): the bars rise above any bound. (The blocks are far too large to draw beyond $j=2$; the numbers come from the exact identity above.)`,
      deps: ['sig-4.3', 'rca-5.11'],
      refs: ['Oppenheim–Willsky §3.4'],
      tags: ['divergence', 'Lebesgue constant'],
      credit: 'du Bois-Reymond, 1873 (first example); the block construction is in the style of Fejér, 1910',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convergence_of_Fourier_series' },
      verify: true,
      viz(v) {
        const nsl = v.slider('block size $n$', 2, 600, 40, { log: true, int: true });
        const A = v.stage({ x: [-0.5, 0.5], y: [-4.5, 7.5], axes: 'box', gutter: true, xlabel: 't', height: 320, title: 'one block $P_{2n,n}$ and its partial sum $S_{2n}$' });
        const B = v.stage({ x: [0.3, 14.7], y: [0, 11], axes: 'box', gutter: true, xlabel: 'block number j', ylabel: 'value', height: 320, title: 'assembled function: $S_{m_j}(x)(0)$ against the bound on $x$' });
        let info = null;
        v.render(() => {
          const n = nsl.value, m = 2 * n, w = Math.min(0.5, 8 / n), N = 1800;
          A.setView([-w, w], null);
          const ts = grid(-w, w, N), P = [], S = [];
          let top = 0;
          for (const t of ts) {
            let a = 0, c = 0;
            for (let k = 1; k <= n; k++) { a += Math.sin(k * t) / k; c += Math.cos((m - k) * t) / k; }
            P.push(2 * Math.sin(m * t) * a); S.push(c); top = Math.max(top, c);
          }
          A.hline(3.704, { color: 'red', dash: true, alpha: 0.7 }); A.hline(-3.704, { color: 'red', dash: true, alpha: 0.7 }); A.hline(0, { color: 'faint', width: 1 });
          A.path(zip(ts, P), { color: 'faint', width: 1.2 });
          A.path(zip(ts, S), { color: 'accent', width: 1.4 });
          const Hn = harm(n);
          A.dot(0, Hn, { r: 6, color: 'gold' }); A.dot(0, 0, { r: 4, hollow: true, color: 'ink' });
          // assembled example
          const J = 14, bars = [];
          for (let j = 1; j <= J; j++) bars.push((j <= 2 ? harm(Math.pow(2, j * j * j)) : j * j * j * Math.LN2 + EULER) / (j * j));
          B.bars(bars, { x0: 1, color: (val, i) => (val > 6.10 ? 'red' : 'accent'), barWidth: 0.7 });
          B.hline(6.10, { color: 'red', width: 1.8 });
          B.text('bound on $\\|x\\|_\\infty$', 1, 6.5, { size: 12, color: 'red', align: 'left' });
          info = { n, Hn, top, bars };
        });
        v.legend([['faint', 'block $P_{2n,n}$'], ['accent', 'partial sum $S_{2n}P$'], ['gold', '$S_{2n}P(0)=H_n$', { dot: true }]]);
        v.readout(() => `$n=${info.n}$: $H_n=${v.fix(info.Hn, 3)}$ ($\\ln n+\\gamma=${v.fix(Math.log(info.n) + EULER, 3)}$), highest point of the partial sum on the window $${v.fix(info.top, 3)}$, while the block itself never exceeds $3.704$.\nAssembled function: $S_{m_j}(x)(0)=${info.bars.slice(0, 3).map((b) => v.fix(b, 2)).join(',\\ ')},\\ \\dots,\\ ${v.fix(info.bars[info.bars.length - 1], 2)}$ for $j=1,2,3,\\dots,${info.bars.length}$: it exceeds $6.10$ from $j=${info.bars.findIndex((b) => b > 6.10) + 1}$ on and keeps growing like $j\\ln2$.`);
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Method',
      name: 'Fejér summation removes Gibbs ringing',
      statement: String.raw`Instead of the partial sums $S_N$, take their averages, the **Fejér (Cesàro) means**
$$\sigma_N(t)=\frac1{N+1}\sum_{n=0}^{N}S_n(t)=\sum_{|k|\le N}\Big(1-\frac{|k|}{N+1}\Big)c_ke^{jkt}=\frac1{2\pi}\int x(t-u)F_N(u)\,du,$$
with the Fejér kernel $F_N(u)=\frac1{N+1}\big(\frac{\sin((N+1)u/2)}{\sin(u/2)}\big)^2\ge0$. For integrable periodic $x$:
(a) if $m\le x\le M$ then $m\le\sigma_N\le M$ for every $N$: there is no overshoot at all;
(b) $\sigma_N(t)\to\frac12(x(t^+)+x(t^-))$ wherever the one-sided limits exist, and $\sigma_N\to x$ uniformly if $x$ is continuous, even when $S_N$ diverges (sig-4.13).`,
      idea: String.raw`The Dirichlet kernel changes sign, which is what produces the ripple and the overshoot of sig-4.4; averaging $D_0,\dots,D_N$ gives a kernel $F_N$ that is a square divided by a positive number, hence non-negative, with integral $2\pi$ and mass concentrating at $0$ like an approximate identity. A positive averaging kernel can only produce averages of the values of $x$, so (a) is immediate, and the standard approximate-identity argument gives (b). Uniform convergence for continuous $x$ is also the trigonometric Weierstrass theorem (pma-8.15).`,
      caption: String.raw`Choose a waveform and raise $N$. The top panel shows the partial sum $S_N$ (grey, ringing) beside the Fejér mean $\sigma_N$ (green), the middle panel zooms in on the jump with the two levels of the signal marked: the green curve stays between them while the grey one overshoots by 9%. The bottom panel shows the two kernels, the oscillating Dirichlet kernel $D_N$ and the non-negative Fejér kernel $F_N$. The price: $\sigma_N$ rounds the corner more slowly (a wider transition) than $S_N$.`,
      deps: ['sig-4.4', 'pma-8.15'],
      refs: ['Oppenheim–Willsky §3.4'],
      tags: ['Cesàro summation', 'Gibbs phenomenon'],
      credit: 'Fejér, 1900 (Comptes Rendus 131); full account 1904 (Mathematische Annalen 58)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fej%C3%A9r%27s_theorem' },
      viz(v) {
        const J = { square: { tj: 0, lo: -1, hi: 1 }, saw: { tj: PI, lo: -1, hi: 1 }, pulse: { tj: -PI / 4, lo: 0, hi: 1 } };
        const wsel = v.select('waveform', waveMenu(['square', 'saw', 'pulse']), 'square');
        const nsl = v.slider('degree $N$', 1, 80, 10, { step: 1, int: true });
        const A = v.stage({ x: [-PI, PI], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 't', xticks: PI_TICKS, height: 240, full: true, title: 'partial sum $S_N$ and Fejér mean $\\sigma_N$' });
        const B = v.stage({ x: [-1, 1], y: [-1.4, 1.4], axes: 'box', gutter: true, xlabel: 't − t₀', height: 270, title: 'zoom on the jump' });
        const C = v.stage({ x: [-PI, PI], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'u', xticks: PI_TICKS, height: 270, title: 'kernels: $D_N$ (signed) and $F_N$ (positive)' });
        let info = null;
        v.render(() => {
          const id = wsel.value, N = nsl.value, W = WAVES[id], g = J[id], c = coefsOf(id, 80);
          const ts = grid(-PI, PI, 900), S = partial(c, N, ts), F = partial(c, N, ts, true);
          A.fn(W.f, { domain: [-PI, PI], color: 'faint', width: 1.4 });
          A.path(zip(ts, S), { color: 'muted', width: 1.5 }); A.path(zip(ts, F), { color: 'green', width: 2.2 });
          const half = Math.min(PI, 8 / (N + 1) + 0.3);
          B.setView([-half, half], [g.lo - 0.25 * (g.hi - g.lo), g.hi + 0.25 * (g.hi - g.lo)]);
          const zs = grid(g.tj - half, g.tj + half, 700), zS = partial(c, N, zs), zF = partial(c, N, zs, true);
          B.fn((t) => W.f(g.tj + t), { domain: [-half, half], color: 'faint', width: 1.4 });
          B.hline(g.hi, { color: 'gold', dash: true }); B.hline(g.lo, { color: 'gold', dash: true });
          B.path(zs.map((t, i) => [t - g.tj, zS[i]]), { color: 'muted', width: 1.6 });
          B.path(zs.map((t, i) => [t - g.tj, zF[i]]), { color: 'green', width: 2.4 });
          const us = grid(-PI, PI, 900), M = v.M, scale = 1 / (2 * N + 1);
          C.setView(null, [-0.35, 1.1]);
          C.hline(0, { color: 'faint', width: 1 });
          C.path(us.map((u) => [u, M.dirichlet(N, u) * scale]), { color: 'muted', width: 1.4 });
          C.path(us.map((u) => [u, M.fejer(N, u) / (N + 1)]), { color: 'green', width: 2.2 });
          C.text('both drawn at height 1 at u = 0', 0.1, 1.0, { size: 11, color: 'muted', align: 'left' });
          let mxS = -1e9, mnS = 1e9, mxF = -1e9, mnF = 1e9;
          zS.forEach((y) => { mxS = Math.max(mxS, y); mnS = Math.min(mnS, y); }); zF.forEach((y) => { mxF = Math.max(mxF, y); mnF = Math.min(mnF, y); });
          let neg = 0; us.forEach((u) => { neg = Math.min(neg, M.dirichlet(N, u)); });
          info = { N, mxS, mnS, mxF, mnF, hi: g.hi, lo: g.lo, neg };
        });
        v.legend([['faint', 'signal'], ['muted', '$S_N$ and $D_N$'], ['green', '$\\sigma_N$ and $F_N$'], ['gold', 'range of the signal']]);
        v.readout(() => `$N=${info.N}$ near the jump: $S_N$ ranges over $[${v.fix(info.mnS, 3)},\\,${v.fix(info.mxS, 3)}]$ (overshoot $${v.fix(info.mxS - info.hi, 3)}$), the Fejér mean over $[${v.fix(info.mnF, 3)},\\,${v.fix(info.mxF, 3)}]$, inside the signal's range $[${info.lo},\\,${info.hi}]$. $D_N$ dips as low as $${v.fix(info.neg, 2)}$; $F_N\\ge0$ everywhere.`);
      },
    },
  ],
};
