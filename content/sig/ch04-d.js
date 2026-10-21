// Signals & Systems — Chapter 4: Fourier series (items 4.13–4.14)
import { TAU, PI, WAVES, coefsOf, waveMenu, partial, zip, grid, powerOf, PI_TICKS } from './ch04.shared.js';

import { harmonic, divergenceBound, divergenceBlockPeak, divergenceAssemblyPeak } from './sig-source-audit.shared.js';

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
      idea: String.raw`Here is a construction using Fejér-weighted blocks. Put $a_{n,k}=1-k/(n+1)$ and
$$P_{m,n}(t)=\sum_{k=1}^n\frac{a_{n,k}}k\big(\cos((m-k)t)-\cos((m+k)t)\big)=2\sin(mt)\sum_{k=1}^n\frac{a_{n,k}\sin kt}{k}.$$
The sine sum is a Fejér mean of the bounded sawtooth $(\pi-t)/2$ on $(0,2\pi)$: positivity and unit mass of the Fejér kernel give $|P_{m,n}|\le\pi$. Also $P_{m,n}(0)=0$, but $S_mP_{m,n}(0)=H_n-n/(n+1)$. Take $n_j=2^{j^3}$, $m_j=2n_j$, and $x=\sum_{j\ge1}j^{-2}P_{m_j,n_j}$. The blocks have disjoint frequency intervals $[n_j,3n_j]$. Their uniform summable bound makes $x$ continuous with $\|x\|_\infty\le\pi^3/6$, while earlier blocks contribute zero at the origin and later blocks contribute no frequencies to $S_{m_j}$. Thus $S_{m_j}x(0)=(H_{n_j}-n_j/(n_j+1))/j^2\sim j\ln2$, which is unbounded. The abstract existence proof applies Banach–Steinhaus to the unbounded norms $L_N$.`,
      caption: String.raw`**Left:** choose $n$ for one Fejér-weighted block $P_{2n,n}$. Grey is the complete block, bounded by $\pi$ (red dashed lines); blue keeps only its frequencies at most $2n$. At the origin the complete block is zero, while the gold partial-sum value is $H_n-n/(n+1)$. **Right:** the assembled continuous function is bounded by $\pi^3/6\approx5.168$ (red line), but its partial sums at the selected degrees grow without bound. Bars use the exact harmonic sum for $j=1,2$ and its stated asymptotic for larger $j$; they are evaluations of the identity, not a sampled rendering of those enormous-frequency blocks.`,
      deps: ['sig-4.3', 'rca-5.11'],
      refs: ['S. New, Lebesgue Integration and Fourier Analysis, §§5.30–5.41 (operator-norm proof and Fejér kernels)'],
      tags: ['divergence', 'Lebesgue constant'],
      credit: 'Continuous divergence: du Bois-Reymond; the displayed construction uses Fejér-weighted blocks',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convergence_of_Fourier_series' },
      verify: false,
      viz(v) {
        const nsl = v.slider('block size $n$', 2, 600, 40, { log: true, int: true });
        const A = v.stage({ x: [-0.5, 0.5], y: [-4.5, 7.5], axes: 'box', gutter: true, xlabel: 't', height: 320, title: 'one block $P_{2n,n}$ and its partial sum $S_{2n}$' });
        const B = v.stage({ x: [0.3, 14.7], y: [0, 11], axes: 'box', gutter: true, xlabel: 'block number j', ylabel: 'value', height: 320, title: 'assembled function: $S_{m_j}(x)(0)$ against the bound on $x$' });
        let info = null;
        v.render(() => {
          const n = nsl.value, m = 2 * n, w = Math.min(0.5, 8 / n), N = 1800;
          A.setView([-w, w], null);
          const ts = grid(-w, w, N), P = [], S = [];
          let top = PI, bottom = -PI;
          for (const t of ts) {
            let a = 0, c = 0;
            for (let k = 1; k <= n; k++) { const weight = 1 - k / (n + 1); a += weight * Math.sin(k * t) / k; c += weight * Math.cos((m - k) * t) / k; }
            const block = 2 * Math.sin(m * t) * a;
            P.push(block); S.push(c); top = Math.max(top, c, block); bottom = Math.min(bottom, c, block);
          }
          A.setView(null, [bottom - 0.3, top + 0.3]);
          A.hline(PI, { color: 'red', dash: true, alpha: 0.7 }); A.hline(-PI, { color: 'red', dash: true, alpha: 0.7 }); A.hline(0, { color: 'faint', width: 1 });
          A.path(zip(ts, P), { color: 'faint', width: 1.2 });
          A.path(zip(ts, S), { color: 'accent', width: 1.4 });
          const Hn = harmonic(n), peak = divergenceBlockPeak(n);
          A.dot(0, peak, { r: 6, color: 'gold' }); A.dot(0, 0, { r: 4, hollow: true, color: 'ink' });
          // assembled example
          const J = 14, bars = [];
          for (let j = 1; j <= J; j++) bars.push(divergenceAssemblyPeak(j));
          B.bars(bars, { x0: 1, color: (val, i) => (val > divergenceBound ? 'red' : 'accent'), barWidth: 0.7 });
          B.hline(divergenceBound, { color: 'red', width: 1.8 });
          B.text('bound on $\\|x\\|_\\infty$', 1, divergenceBound + 0.4, { size: 12, color: 'red', align: 'left' });
          info = { n, Hn, peak, top, bars };
        });
        v.legend([['faint', 'block $P_{2n,n}$'], ['accent', 'partial sum $S_{2n}P$'], ['gold', '$S_{2n}P(0)=H_n-n/(n+1)$', { dot: true }]]);
        v.readout(() => `$n=${info.n}$: $H_n=${v.fix(info.Hn, 3)}$, $S_{2n}P(0)=H_n-n/(n+1)=${v.fix(info.peak, 3)}$, while $|P_{2n,n}|\\le\\pi$.\nAssembled function: $\\|x\\|_\\infty\\le\\pi^3/6=${v.fix(divergenceBound, 3)}$, but $S_{m_j}x(0)=${info.bars.slice(0, 3).map((b) => v.fix(b, 2)).join(',\\ ')},\\ \\dots,\\ ${v.fix(info.bars.at(-1), 2)}$ for $j=1,2,3,\\dots,${info.bars.length}$; it exceeds the bound from $j=${info.bars.findIndex((b) => b > divergenceBound) + 1}$ on and grows like $j\\ln2$.`);
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
