// Probability: Theory and Examples (Durrett) — Chapter 4, part M2: §4.3 branching processes, §4.4 optional stopping, maximal inequalities, L^p convergence
import { clampN, fr, sciT, walkPath, pts, lawFromPmf, offspringLaw, LAW_OPTS, extinctionProb, survivalSeq, gwPath, totalChildren, meanOf, seOf } from './ch04-m.shared.js';

/** log-factorial table for exact binomial moments. */
const LF = [0];
const lfac = (k) => { while (LF.length <= k) LF.push(LF[LF.length - 1] + Math.log(LF.length)); return LF[k]; };

export default {
  collection: 'prob',
  chapter: 4,
  items: [
    // ======================================================================== 4.3.9
    {
      num: '4.3.9',
      kind: 'Lemma',
      name: 'Zₙ/µⁿ is a martingale',
      statement: String.raw`Let $Z_n$ be a Galton–Watson process with $Z_0=1$ and offspring mean $\mu=\sum kp_k\in(0,\infty)$, and let $\mathcal F_n=\sigma(Z_0,\dots,Z_n)$. Then $W_n=Z_n/\mu^n$ is a nonnegative martingale with $EW_n=1$ for all $n$.`,
      idea: String.raw`Given $\mathcal F_n$, the next generation is a sum of $Z_n$ independent copies of the offspring number, independent of the past, so $E(Z_{n+1}\mid\mathcal F_n)=\mu Z_n$ (Wald's identity; it is the conditional-expectation rules 4.1.9 and 4.1.14 at work). Dividing by $\mu^{n+1}$ gives $E(W_{n+1}\mid\mathcal F_n)=W_n$. Being nonnegative, $W_n$ converges a.s. (4.2.12).`,
      caption: String.raw`Left: $W_n=Z_n/\mu^n$ for 40 of 600 seeded families (thin blue); the thick line is the average over all 600, within a band of two standard errors, and stays at $1$ even though individual paths flatten out or hit $0$. Right: the one-step law behind it. For generation $n$ (slider), each family is a point $(Z_n,Z_{n+1})$ (faint), the gold dots are the means of $Z_{n+1}$ over equal-count bins of $Z_n$, and they sit on the line $z\mapsto\mu z$ (green): the conditional mean is proportional to the present size. For $\mu<1$ the average of $W_n$ is carried by rare large paths, so the band widens.`,
      deps: ['prob-4.3.8a', 'prob-4.2.1a'],
      tags: ['branching', 'martingales'],
      scope: String.raw`Generation sizes above 400 are drawn from a rounded normal with the exact mean and variance of the sum, not from the exact law of the sum.`,
      viz(v) {
        const law = v.select('offspring law', LAW_OPTS, 'poisson');
        const mS = v.slider('mean $\\mu$', 0.5, 2, 1.4, { step: 0.05 });
        const nS = v.slider('generation $n$', 1, 10, 4, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const G = 12, NP = 600;
        const L = v.stage({ x: [0, G], y: [0, 4], axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$W_n=Z_n/\\mu^n$', weight: 1.25 });
        const R = v.stage({ x: [0, 20], y: [0, 30], axes: 'box', gutter: true, height: 320, xlabel: '$Z_n$', ylabel: '$Z_{n+1}$', title: 'one step: $Z_n\\to Z_{n+1}$' });
        let cache = null, st = null;
        v.render(() => {
          const m = law.value === 'binary' ? Math.min(2, mS.value) : mS.value, key = `${law.value}|${m}|${seed}`;
          if (!cache || cache.key !== key) {
            const Lw = offspringLaw(law.value, m), r = v.rng(seed * 71 + 3), paths = [];
            for (let i = 0; i < NP; i++) paths.push(gwPath(r, Lw, 1, G));
            cache = { key, paths, mu: Lw.mean };
          }
          const mu = cache.mu, paths = cache.paths, n = nS.value;
          L.hline(1, { color: 'muted', dash: [5, 4] });
          for (let i = 0; i < 40; i++) L.path(Array.from(paths[i], (z, k) => [k, z / mu ** k]), { color: 'accent', width: 1, alpha: 0.35 });
          const mean = [], hi = [], lo = [];
          for (let k = 0; k <= G; k++) {
            const w = Float64Array.from(paths, (p) => p[k] / mu ** k), mm = meanOf(w), se = seOf(w);
            mean.push([k, mm]); hi.push([k, mm + 2 * se]); lo.push([k, mm - 2 * se]);
          }
          L.path(hi, { color: 'orange', width: 1, dash: [3, 3] }); L.path(lo, { color: 'orange', width: 1, dash: [3, 3] });
          L.path(mean, { color: 'orange', width: 3 });
          // one step
          const xs = paths.map((p) => p[n]), ys = paths.map((p) => p[n + 1]), q = Array.from(xs).sort((a, b) => a - b);
          const xmax = Math.max(4, q[Math.floor(0.97 * q.length)] + 1), ymax = Math.max(4, mu * xmax * 1.6);
          R.setView([0, xmax], [0, ymax]);
          R.dots(xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => x <= xmax && y <= ymax), { r: 2.6, color: 'accent', alpha: 0.25 });
          const idx = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]), bins = [], B = 8;
          for (let b = 0; b < B; b++) {
            const part = idx.slice(Math.floor((b * idx.length) / B), Math.floor(((b + 1) * idx.length) / B));
            if (!part.length) continue;
            const mx = meanOf(Float64Array.from(part, (i) => xs[i])), my = meanOf(Float64Array.from(part, (i) => ys[i]));
            if (mx > 0) bins.push([mx, my]);
          }
          R.line(0, 0, xmax, mu * xmax, { color: 'green', width: 2 });
          R.dots(bins.filter(([x, y]) => x <= xmax && y <= ymax), { r: 5, color: 'gold' });
          const w = Float64Array.from(paths, (p) => p[n] / mu ** n);
          st = { n, mean: meanOf(w), se: seOf(w), mu, ratio: bins.length ? meanOf(Float64Array.from(bins, ([x, y]) => y / x)) : NaN };
        });
        v.legend([['accent', 'one family'], ['orange', 'average of $W_n$ $\\pm2$ s.e.'], ['gold', 'bin means of $Z_{n+1}$', { dot: true }], ['green', '$z\\mapsto\\mu z$']]);
        v.readout(() => st && `$\\mu=${fr(st.mu, 2)}$. At $n=${st.n}$: average $W_n=${fr(st.mean, 3)}\\pm${fr(2 * st.se, 3)}$ (a martingale started at $1$ keeps mean $1$).\nBinned ratios $E(Z_{n+1}\\mid Z_n)/Z_n$ average $${fr(st.ratio, 3)}$, against $\\mu=${fr(st.mu, 3)}$.`);
      },
    },
    // ======================================================================== 4.3.10
    {
      num: '4.3.10',
      kind: 'Theorem',
      name: 'Subcritical branching processes die out',
      statement: String.raw`If the mean offspring number satisfies $\mu<1$, then $Z_n=0$ for all large $n$ almost surely, and quantitatively
$$P(Z_n>0)\le E Z_n=\mu^n.$$
So extinction is certain and its probability tail decays at least geometrically.`,
      idea: String.raw`$Z_n$ is integer valued, so $P(Z_n>0)=P(Z_n\ge1)\le EZ_n=\mu^n$ by Markov's inequality (1.6.4), where $EZ_n=\mu^n$ is the mean of the martingale $Z_n/\mu^n$ of 4.3.9. These bounds are summable, so by Borel–Cantelli the event $\{Z_n>0\}$ occurs finitely often, and since $0$ is absorbing, $Z_n=0$ eventually.`,
      caption: String.raw`Log scale. Green: the exact survival probability $P(Z_n>0)=1-\varphi^{\circ n}(0)$ (iterating the generating function). Orange: the bound $\mu^n$. Gold dots: the fraction of 6000 simulated families still alive. The bound is never crossed, and for these laws the green curve is parallel to it: the true decay is $\mu^n$ times a constant. Right: histogram of the extinction times of the simulated families against the exact law (green). Push $\mu$ toward $1$ and the die-out takes longer and longer.`,
      deps: ['prob-4.3.9', 'prob-1.6.4'],
      tags: ['branching'],
      viz(v) {
        const law = v.select('offspring law', LAW_OPTS, 'poisson');
        const mS = v.slider('mean $\\mu$', 0.3, 0.98, 0.8, { step: 0.01 });
        const nS = v.slider('read at $n$', 1, 30, 10, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const G = 30, NP = 6000;
        const L = v.stage({ x: [0, G], y: [1e-10, 2], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$P(Z_n>0)$ against $\\mu^n$', weight: 1.3 });
        const R = v.stage({ x: [0, G], y: [0, 0.3], axes: 'box', gutter: true, height: 320, xlabel: 'extinction time', title: 'extinction times' });
        let cache = null, st = null;
        v.render(() => {
          const m = law.value === 'binary' ? Math.min(0.98, mS.value) : mS.value, key = `${law.value}|${m}|${seed}`;
          if (!cache || cache.key !== key) {
            const Lw = offspringLaw(law.value, m), r = v.rng(seed * 17 + 1), alive = new Float64Array(G + 1), T0 = new Float64Array(G + 2);
            for (let i = 0; i < NP; i++) {
              let z = 1, k = 0; alive[0]++;
              while (z > 0 && k < G) { z = totalChildren(r, Lw, z); k++; if (z > 0) alive[k]++; }
              if (z === 0) T0[k]++; else T0[G + 1]++;
            }
            cache = { key, Lw, s: survivalSeq(Lw, G), alive, T0 };
          }
          const { Lw, s, alive, T0 } = cache, mu = Lw.mean;
          L.path(s.map((y, k) => [k, Math.max(y, 1e-12)]), { color: 'green', width: 2.4 });
          L.path(s.map((_, k) => [k, mu ** k]), { color: 'orange', width: 2, dash: [6, 4] });
          L.dots(Array.from(alive, (c, k) => [k, c / NP]).filter(([, y]) => y > 0), { r: 3.5, color: 'gold' });
          R.setView([0, G], [0, Math.max(0.05, ...Array.from(T0.slice(1, G + 1), (c) => c / NP)) * 1.2]);
          R.hist({ edges: Array.from({ length: G + 1 }, (_, k) => k + 0.5), counts: Array.from(T0.slice(1, G + 1), (c) => c / NP) }, { color: 'accent', fillAlpha: 0.35 });
          R.path(s.slice(0, G).map((y, k) => [k + 1, y - s[k + 1]]), { color: 'green', width: 2 });
          const n = nS.value;
          st = { n, exact: s[n], bound: mu ** n, sim: alive[n] / NP, mu, still: T0[G + 1] };
        });
        v.legend([['green', 'exact $P(Z_n>0)$'], ['orange', 'bound $\\mu^n$', { dash: [6, 4] }], ['gold', 'simulation', { dot: true }]]);
        v.readout(() => st && `$\\mu=${fr(st.mu, 3)}$, $n=${st.n}$: exact $P(Z_n>0)=${sciT(st.exact, 3)}$, bound $\\mu^n=${sciT(st.bound, 3)}$, simulated $${sciT(st.sim, 3)}$. The ratio exact / bound is $${fr(st.exact / st.bound, 3)}\\le1$.${st.still ? `\n${st.still} of 6000 families were still alive at generation 30.` : ''}`);
      },
    },
    // ======================================================================== 4.3.11
    {
      num: '4.3.11',
      kind: 'Theorem',
      name: 'Critical branching processes die out',
      statement: String.raw`For a Galton–Watson process starting from one ancestor, $Z_0=1$, if $\mu=1$ and $P(\xi=1)<1$ (the offspring number is not identically $1$), then $Z_n=0$ for all large $n$ almost surely, although $EZ_n=1$ for every $n$. If the offspring variance $\sigma^2$ is finite, the survival probability decays like $P(Z_n>0)\sim 2/(\sigma^2n)$ (the generating-function refinement explained below).`,
      idea: String.raw`The critical process is a nonnegative martingale, so it converges almost surely. Integer-valued convergence makes it eventually constant, but no positive state can remain unchanged forever when the offspring law is not concentrated at $1$. Thus the eventual value is $0$. For the additional finite-variance asymptotic shown in the picture, let $s_n=P(Z_n>0)$ and $f$ be the offspring generating function. Then $s_{n+1}=1-f(1-s_n)=s_n-\tfrac12\sigma^2s_n^2+o(s_n^2)$. Since $s_n\to0$, $1/s_{n+1}-1/s_n\to\sigma^2/2$, and averaging gives $n s_n\to2/\sigma^2$.`,
      caption: String.raw`Left: 40 seeded families of a critical process (mean offspring $1$). Almost all drop to $0$ (and stay there); a few survive for a long time and wander at larger sizes. Right, on log-log axes: the exact survival probability $s_n=P(Z_n>0)$ (green), the asymptote $2/(\sigma^2n)$ (orange dashed) and Monte Carlo estimates from 20000 families (gold). Choose the law: the variance $\sigma^2$ is $1$ for Poisson and for "0 or 2", and $2$ for the geometric law. The readout shows that $n\,s_n\to2/\sigma^2$ and that survivors average about $\sigma^2n/2$, which is how the mean stays at $1$.`,
      deps: ['prob-4.3.9', 'prob-4.2.12'],
      tags: ['branching'],
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 4.3.11 and proof, p. 231; pgf iteration in §4.3.4 (derived finite-variance survival asymptotic)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const law = v.select('offspring law (mean 1)', LAW_OPTS, 'poisson');
        const nS = v.slider('generation $n$', 1, 100, 40, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const G = 100, NP = 20000, CK = [1, 2, 3, 5, 8, 12, 20, 30, 50, 80, 100];
        const L = v.stage({ x: [0, G], y: [0, 12], axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$Z_n$ for 40 families', weight: 1.2 });
        const R = v.stage({ x: [1, 300], y: [1e-3, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$P(Z_n>0)$' });
        let cache = null, st = null;
        v.render(() => {
          const key = `${law.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const Lw = offspringLaw(law.value, 1), r = v.rng(seed * 29 + 5), shown = [], alive = CK.map(() => 0), sumZ = new Float64Array(G + 1), nAlive = new Float64Array(G + 1);
            for (let i = 0; i < NP; i++) {
              const Z = gwPath(r, Lw, 1, G);
              if (i < 40) shown.push(Z);
              CK.forEach((c, j) => { if (Z[c] > 0) alive[j]++; });
              for (let k = 0; k <= G; k++) if (Z[k] > 0) { sumZ[k] += Z[k]; nAlive[k]++; }
            }
            cache = { key, Lw, shown, alive, sumZ, nAlive, s: survivalSeq(Lw, 300) };
          }
          const { Lw, shown, alive, s } = cache, s2 = Lw.var;
          const top = Math.max(6, ...shown.map((Z) => Math.max(...Z))) * 1.1;
          L.setView([0, G], [0, Math.min(top, 40)]);
          for (const Z of shown) L.path(Array.from(Z, (z, k) => [k, z]), { color: 'accent', width: 1, alpha: 0.5 });
          L.hline(1, { color: 'muted', dash: [4, 4] });
          L.vline(nS.value, { color: 'gold', dash: [4, 4] });
          const ns = Array.from({ length: 300 }, (_, i) => i + 1);
          R.path(ns.map((n) => [n, s[n]]), { color: 'green', width: 2.4 });
          R.path(ns.map((n) => [n, Math.min(1, 2 / (s2 * n))]), { color: 'orange', width: 1.8, dash: [6, 4] });
          R.dots(CK.map((c, j) => [c, alive[j] / NP]).filter(([, y]) => y > 0), { r: 4, color: 'gold' });
          const n = nS.value;
          st = { n, s: s[n], asym: 2 / (s2 * n), sigma2: s2, surv: cache.nAlive[n] ? cache.sumZ[n] / cache.nAlive[n] : NaN, all: cache.sumZ[n] / NP, ns: n * s[n] };
        });
        v.legend([['green', 'exact $P(Z_n>0)$'], ['orange', '$2/(\\sigma^2n)$', { dash: [6, 4] }], ['gold', 'simulation', { dot: true }]]);
        v.readout(() => st && `$\\sigma^2=${fr(st.sigma2, 2)}$, $n=${st.n}$: $P(Z_n>0)=${fr(st.s, 4)}$, $n\\,P(Z_n>0)=${fr(st.ns, 3)}$ (limit $2/\\sigma^2=${fr(2 / st.sigma2, 3)}$).\nSimulated: $EZ_n\\approx${fr(st.all, 2)}$ over all families, $E(Z_n\\mid Z_n>0)\\approx${fr(st.surv, 1)}$ over survivors (theory: $1/P(Z_n>0)=${fr(1 / st.s, 1)}$).`);
      },
    },
    // ======================================================================== 4.3.12
    {
      num: '4.3.12',
      kind: 'Theorem',
      name: 'Extinction probability solves φ(ρ) = ρ',
      statement: String.raw`Let $\varphi(s)=\sum_kp_ks^k$ be the offspring generating function and $\rho=P(Z_n=0\text{ for some }n)$ the extinction probability of the process started from one individual. Then $\rho$ is the **smallest** fixed point of $\varphi$ in $[0,1]$: $\varphi(\rho)=\rho$. Moreover $\rho<1$ if and only if $\mu=\varphi'(1)>1$ (assuming $p_1<1$), and $\rho=\lim_n\varphi^{\circ n}(0)=\lim_nP(Z_n=0)$.`,
      idea: String.raw`$P(Z_n=0)=\varphi^{\circ n}(0)$ increases to $\rho$ and, by continuity of $\varphi$, the limit is a fixed point. It is the smallest one because $\varphi$ is increasing: if $s^*$ is any fixed point then $0\le s^*$ gives $\varphi^{\circ n}(0)\le s^*$ for all $n$. Convexity of $\varphi$ with $\varphi(1)=1$ means the curve $y=\varphi(s)$ meets the diagonal in at most one point below $1$, and it does so exactly when the slope $\varphi'(1)=\mu$ exceeds $1$. This is the same dichotomy as in 4.3.10 and 4.3.11, and for $\mu>1$ the martingale $Z_n/\mu^n$ of 4.3.9 shows that the surviving lines grow.`,
      caption: String.raw`The staircase starts at $0$ and alternates between the curve $y=\varphi(s)$ and the diagonal: its corners are $\varphi^{\circ n}(0)$, climbing to the smallest fixed point $\rho$ (green). Raise the number of steps $n$ and move the mean $\mu$: at $\mu\le1$ the only fixed point is $1$ and the staircase creeps there; beyond it a second fixed point $\rho<1$ appears and the staircase stops at it. Right: $P(Z_n=0)=\varphi^{\circ n}(0)$ against $n$ (blue) with simulated frequencies from 3000 families (gold); the green line is $\rho$.`,
      deps: ['prob-4.3.8a', 'prob-4.2.12'],
      see: ['stoch-3.10'],
      tags: ['branching'],
      scope: String.raw`The simulation counts a family as surviving once it exceeds 2000 individuals, where extinction has probability below $10^{-100}$ unless $\rho$ is extremely close to $1$.`,
      viz(v) {
        const law = v.select('offspring law', LAW_OPTS, 'poisson');
        const mS = v.slider('mean $\\mu$', 0.3, 2, 1.5, { step: 0.01 });
        const nS = v.slider('steps $n$', 0, 40, 6, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const G = 40, NP = 3000;
        const P = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 340, xlabel: '$s$', ylabel: '$\\varphi(s)$', title: 'generating function and iteration', weight: 1 });
        const Q = v.stage({ x: [0, G], y: [0, 1.05], axes: 'box', gutter: true, height: 340, xlabel: 'generation $n$', title: '$P(Z_n=0)$', weight: 1.1 });
        let cache = null, st = null;
        v.render(() => {
          const m = law.value === 'binary' ? Math.min(2, mS.value) : mS.value, key = `${law.value}|${m}|${seed}`;
          if (!cache || cache.key !== key) {
            const Lw = offspringLaw(law.value, m), r = v.rng(seed * 19 + 2), dead = new Float64Array(G + 1); let ext = 0;
            for (let i = 0; i < NP; i++) {
              let z = 1, k = 0, t0 = Infinity;
              while (k < G) { if (z === 0) { t0 = k; break; } if (z > 2000) break; z = totalChildren(r, Lw, z); k++; }
              if (z === 0 && t0 === Infinity) t0 = k;
              if (t0 < Infinity) { for (let j = t0; j <= G; j++) dead[j]++; ext++; }
            }
            const seq = [0]; for (let k = 1; k <= G; k++) seq.push(Lw.pgf(seq[k - 1]));
            cache = { key, Lw, dead, seq, rho: extinctionProb(Lw), ext };
          }
          const { Lw, dead, seq, rho } = cache, n = nS.value;
          P.fn((s) => Lw.pgf(s), { color: 'accent', width: 2.4, domain: [0, 1], n: 200 });
          P.line(0, 0, 1, 1, { color: 'muted', dash: [5, 4] });
          const stair = [[0, 0]]; for (let k = 0; k < n; k++) { const y = seq[k + 1]; stair.push([seq[k], y], [y, y]); }
          P.path(stair, { color: 'orange', width: 1.6 });
          P.dot(seq[n], seq[n], { r: 5, color: 'gold' });
          P.dot(rho, rho, { r: 6, color: 'green', label: '$\\rho$', labelPos: 'se' });
          Q.hline(rho, { color: 'green', width: 1.6 });
          Q.path(seq.map((y, k) => [k, y]), { color: 'accent', width: 2.2 });
          Q.dots(Array.from(dead, (c, k) => [k, c / NP]), { r: 3, color: 'gold' });
          Q.vline(n, { color: 'gold', dash: [4, 4] });
          st = { mu: Lw.mean, rho, seq: seq[n], n, sim: cache.ext / NP, fp: Lw.pgf(rho) };
        });
        v.legend([['accent', '$\\varphi$ and $P(Z_n=0)$'], ['orange', 'iteration $\\varphi^{\\circ n}(0)$'], ['green', 'smallest fixed point $\\rho$'], ['gold', 'simulation', { dot: true }]]);
        v.readout(() => st && `$\\mu=\\varphi'(1)=${fr(st.mu, 3)}$. Smallest fixed point $\\rho=${fr(st.rho, 5)}$ (check $\\varphi(\\rho)=${fr(st.fp, 5)}$). After $n=${st.n}$ steps the iterate is $${fr(st.seq, 5)}$.\nSimulated extinction frequency (3000 families, 40 generations): $${fr(st.sim, 3)}$.`);
      },
    },
    // ======================================================================== 4.3.13
    {
      num: '4.3.13',
      kind: 'Theorem',
      name: 'Kesten–Stigum theorem',
      statement: String.raw`Let $Z_n$ be a supercritical Galton–Watson process, $1<\mu<\infty$, $Z_0=1$, and $W=\lim Z_n/\mu^n$ (it exists by 4.3.9 and 4.2.12). Then
$$EW=1\ \text{ and }\ P(W>0)=1-\rho\iff \sum_kp_k\,k\log k<\infty,$$
and if $\sum_kp_k\,k\log k=\infty$ then $W=0$ a.s., although the process survives with probability $1-\rho>0$. (Durrett states it for the single-type process.)`,
      idea: String.raw`If $E\xi\log^+\xi<\infty$, the martingale $W_n$ is uniformly integrable (this is the hard half: one truncates the offspring at $\mu^n$ and uses an $L^2$ argument on the truncated process), so $EW=1$ and $W>0$ exactly on survival. Conversely if the $\xi\log\xi$ moment is infinite, $W_n$ is not uniformly integrable; the fixed-point equation for the Laplace transform of $W$ then forces $W=0$. The pictures show what the condition measures: whether the mean $\mu$ is carried by moderately large families or by a thin tail of huge ones, which the process meets too rarely to feel.`,
      caption: String.raw`Offspring law $p_k\propto k^{-2}(\log k)^{-s}$ for $2\le k\le K$, rescaled to mean exactly $1.5$. Left: the pmf on log-log axes. Middle: for the **untruncated** law (the same shape with mean $1.5$) the partial sums of $\sum kp_k$ (blue) converge for $s>1$ while those of $\sum k\log k\,p_k$ (red) keep growing for $s\le2$ and settle only for $s>2$. Right: histogram of $W_n=Z_n/1.5^n$ over the surviving families of 3000 simulated ones. A finite simulation always uses a finite $K$, so $W>0$ always; what the theorem predicts shows up as $K$ grows: for $s\le2$ the survivors' $W_n$ pile up near $0$ (the median falls, and fewer families survive), for $s>2$ they move much less (for $n=8$, $s=1.6$: median $1.8\to1.05$ as $K$ goes from $10$ to $3000$; $s=3$: $1.5\to1.3$). The effect is logarithmically slow.`,
      deps: ['prob-4.3.9', 'prob-4.2.12'],
      see: ['stoch-12.11'],
      tags: ['branching'],
      credit: 'H. Kesten & B. P. Stigum, 1966 (Ann. Math. Statist. 37, 1211–1223; multitype)',
      scope: String.raw`Simulations use the truncated law (cutoff $K\le3000$) and the tail beyond $K$ is not sampled; families that exceed $2\cdot10^4$ individuals in one generation are discarded and counted in the readout. The middle panel is exact (sums up to $10^6$, then a tail integral estimate is not added).`,
      viz(v) {
        const sS = v.slider('tail exponent $s$', 1.2, 3.2, 1.6, { step: 0.05 });
        const kS = v.slider('cutoff $K$', 10, 3000, 300, { log: true, int: true });
        const nS = v.slider('generation $n$', 3, 9, 7, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NP = 3000, TARGET = 1.5;
        const A = v.stage({ x: [2, 3000], y: [1e-8, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, xlabel: '$k$', title: 'offspring pmf $p_k$' });
        const B = v.stage({ x: [2, 1e6], y: [0, 6], xlog: true, axes: 'box', gutter: true, height: 300, xlabel: '$K$', title: 'partial sums (untruncated law)' });
        const C = v.stage({ x: [0, 4], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: '$W_n$', title: '$W_n$ on survival' });
        const terms = (s, K, f) => { let a = 0; for (let k = 2; k <= K; k++) a += f(k) / (k * Math.log(k) ** s); return a; };
        const cacheTerms = new Map(); let cache = null, st = null;
        function infLaw(s) { // partial sums of the untruncated law with mean TARGET (mean is the sum to 1e6 plus the integral tail)
          if (cacheTerms.has(s)) return cacheTerms.get(s);
          const KM = 1e6, tail = Math.log(KM) ** (1 - s) / (s - 1), tot = terms(s, KM, () => 1) + tail, c = TARGET / tot;
          const grid = Array.from({ length: 80 }, (_, i) => Math.round(2 * (KM / 2) ** (i / 79)));
          const m1 = [], m2 = []; let a1 = 0, a2 = 0, k0 = 2;
          for (const K of grid) { for (let k = k0; k <= K; k++) { const t = c / (k * Math.log(k) ** s); a1 += t; a2 += t * Math.log(k); } k0 = K + 1; m1.push([K, a1]); m2.push([K, a2]); }
          const res = { m1, m2 }; cacheTerms.set(s, res); return res;
        }
        v.render(() => {
          const s = sS.value, K = Math.round(kS.value), n = nS.value, key = `${s}|${K}|${n}|${seed}`;
          if (!cache || cache.key !== key) {
            const p = [0, 0]; let tot = 0;
            for (let k = 2; k <= K; k++) { p.push(1 / (k * k * Math.log(k) ** s)); }
            let mean0 = 0; for (let k = 2; k <= K; k++) mean0 += k * p[k];
            const c = TARGET / mean0; for (let k = 2; k <= K; k++) { p[k] *= c; tot += p[k]; }
            p[0] = 1 - tot; const Lw = lawFromPmf(p), r = v.rng(seed * 13 + 4), Ws = []; let huge = 0, dead = 0;
            for (let i = 0; i < NP; i++) {
              let z = 1, ok = true;
              for (let g = 0; g < n && z > 0; g++) { if (z > 2e4) { ok = false; break; } let sum = 0; for (let j = 0; j < z; j++) sum += Lw.sample(r); z = sum; }
              if (!ok) { huge++; continue; }
              if (z === 0) dead++; else Ws.push(z / TARGET ** n);
            }
            let ell = 0; for (let k = 2; k <= K; k++) ell += p[k] * k * Math.log(k);
            cache = { key, Lw, Ws, huge, dead, ell, c, rho: extinctionProb(Lw) };
          }
          const { Lw, Ws, huge, dead, ell } = cache;
          A.path(Array.from(Lw.p).map((q, k) => [k, q]).slice(2).filter(([, q]) => q > 0), { color: 'accent', width: 1.6 });
          A.path([[2, 0.2 * Lw.p[2]], [K, 0.2 * Lw.p[2] * (2 / K) ** 2]], { color: 'muted', dash: [4, 4], width: 1 });
          A.vline(K, { color: 'gold', dash: [4, 4] });
          const { m1, m2 } = infLaw(s);
          B.hline(TARGET, { color: 'muted', dash: [4, 4] });
          B.path(m1, { color: 'accent', width: 2.2 }); B.path(m2, { color: 'red', width: 2.2 });
          B.vline(K, { color: 'gold', dash: [4, 4] });
          const hi = 4, h = v.M.histogram(Ws.filter((w) => w < hi), { bins: 32, range: [0, hi] }), tot = Math.max(1, Ws.length);
          C.setView([0, hi], [0, Math.max(0.05, ...h.counts.map((x) => x / tot)) * 1.2]);
          C.hist({ edges: h.edges, counts: h.counts.map((x) => x / tot) }, { color: 'accent', fillAlpha: 0.35 });
          const sorted = Ws.slice().sort((a, b) => a - b);
          st = { s, K, n, ell, med: sorted.length ? sorted[sorted.length >> 1] : NaN, small: Ws.filter((w) => w < 0.1).length / tot, surv: Ws.length / (NP - huge), huge, rho: cache.rho, dead, mu: Lw.mean };
        });
        v.legend([['red', '$\\sum k\\log k\\,p_k$'], ['accent', '$\\sum kp_k$ / pmf / histogram'], ['gold', 'cutoff $K$', { dash: [4, 4] }]]);
        v.readout(() => st && `$s=${fr(st.s, 2)}$ (${st.s > 2 ? '$\\sum k\\log k\\,p_k<\\infty$ for the infinite law' : '$\\sum k\\log k\\,p_k=\\infty$ for the infinite law'}), cutoff $K=${st.K}$: $\\sum kp_k=${fr(st.mu, 2)}$, $\\sum k\\log k\\,p_k=${fr(st.ell, 2)}$.\nAt generation $${st.n}$: ${fr(100 * st.surv, 0)}% of families alive (extinction probability $\\rho=${fr(st.rho, 3)}$). Among them the median of $W_n$ is $${fr(st.med, 3)}$ and ${fr(100 * st.small, 0)}% have $W_n<0.1$.${st.huge ? ` ${st.huge} families were discarded as too large.` : ''}`);
      },
    },
    // ======================================================================== 4.4.1
    {
      num: '4.4.1',
      kind: 'Theorem',
      name: 'Optional stopping for bounded stopping times',
      statement: String.raw`Let $X_n$ be a submartingale and $N$ a stopping time with $N\le k$ for a constant $k$. Then
$$EX_0\le EX_N\le EX_k.$$
For a martingale all three are equal; for a supermartingale the inequalities reverse.`,
      idea: String.raw`The stopped process $X_{N\wedge n}$ is again a submartingale (4.2.9), so $EX_0=EX_{N\wedge0}\le EX_{N\wedge k}=EX_N$. For the second inequality, $X_{N\wedge n}$ is the transform of $X$ by the predictable $1_{\{N\ge n\}}$, so the process $X_n-X_{N\wedge n}$, which accumulates the increments after $N$ with the bounded predictable weight $1_{\{N<n\}}$, is also a submartingale starting from $0$ (4.2.8). Its mean at time $k$ is $EX_k-EX_N\ge0$. Without the stopping-time property (looking ahead) the argument breaks, as the last option below shows.`,
      caption: String.raw`Left: one path with its stopping time marked (gold). Right: Monte Carlo means of $X_0$, $X_N$ and $X_k$ over 6000 seeded paths with $\pm2$ standard errors. Choose the process (martingale, submartingale $|S_n|$, supermartingale $-|S_n|$) and a rule: "first time at level $a$" and "first drawdown of size $a$" are stopping times, and the ordering $EX_0\le EX_N\le EX_k$ appears for the submartingale. The last rule, "stop at the maximum over $[0,k]$", needs the future, so it is not a stopping time, and then $EX_N$ exceeds $EX_k$.`,
      deps: ['prob-4.2.9', 'prob-4.2.8a'],
      tags: ['optional stopping'],
      viz(v) {
        const proc = v.select('process', [{ value: 'mart', label: 'martingale $S_n$' }, { value: 'sub', label: 'submartingale $|S_n|$' }, { value: 'sup', label: 'supermartingale $-|S_n|$' }], 'sub');
        const rule = v.select('rule', [{ value: 'hit', label: 'first time $X\\ge a$' }, { value: 'dd', label: 'first drawdown $a$' }, { value: 'peek', label: 'time of the maximum (not a stopping time)' }], 'hit');
        const kS = v.slider('horizon $k$', 10, 200, 60, { int: true });
        const aS = v.slider('level $a$', 1, 15, 5, { int: true });
        let seed = 1; v.button('New path', () => { seed++; });
        const NP = 6000;
        const P = v.stage({ x: [0, 60], y: [-10, 10], axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: 'one path and its stopping time', weight: 1.3 });
        const Bs = v.stage({ x: [0, 4], y: [-1, 1], axes: 'box', gutter: true, height: 320, xticks: [], title: 'means (±2 s.e.)' });
        const f = (kind, s) => (kind === 'mart' ? s : kind === 'sub' ? Math.abs(s) : -Math.abs(s));
        function stopTime(X, k, kind, a) {
          if (kind === 'peek') { let b = 0; for (let n = 1; n <= k; n++) if (X[n] > X[b]) b = n; return b; }
          let mx = X[0];
          for (let n = 0; n <= k; n++) {
            if (kind === 'hit' && X[n] >= a) return n;
            mx = Math.max(mx, X[n]);
            if (kind === 'dd' && mx - X[n] >= a) return n;
          }
          return k;
        }
        let cache = null, st = null;
        v.render(() => {
          const k = kS.value, a = aS.value, key = `${proc.value}|${rule.value}|${k}|${a}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(321), x0 = new Float64Array(NP), xN = new Float64Array(NP), xk = new Float64Array(NP), Ns = new Float64Array(NP);
            for (let i = 0; i < NP; i++) {
              const S = walkPath(r, k), X = Float64Array.from(S, (s) => f(proc.value, s)), N = stopTime(X, k, rule.value, a);
              x0[i] = X[0]; xN[i] = X[N]; xk[i] = X[k]; Ns[i] = N;
            }
            cache = { key, m: [meanOf(x0), meanOf(xN), meanOf(xk)], se: [seOf(x0), seOf(xN), seOf(xk)], meanN: meanOf(Ns) };
          }
          const S = walkPath(v.rng(seed * 7 + 1), k), X = Float64Array.from(S, (s) => f(proc.value, s)), N = stopTime(X, k, rule.value, a);
          const lo = Math.min(...X, -1), hi = Math.max(...X, 1);
          P.setView([0, k], [lo - 1, hi + 1]);
          if (rule.value === 'hit') P.hline(a, { color: 'orange', dash: [5, 4] });
          P.path(pts(X), { color: 'accent', width: 1.8 });
          P.vline(N, { color: 'gold', dash: [4, 4], width: 1.5 });
          P.dot(N, X[N], { r: 6, color: 'gold', label: '$N$', labelPos: 'nw' });
          const { m, se } = cache, ext = Math.max(...m.map((x, i) => Math.abs(x) + 2 * se[i]), 0.5) * 1.2;
          Bs.setView([0, 4], [Math.min(0, ...m.map((x, i) => x - 2 * se[i])) * 1.2 - 0.1, Math.max(0.2, ...m.map((x, i) => x + 2 * se[i])) * 1.2]);
          Bs.hline(0, { color: 'grid' });
          m.forEach((val, i) => { Bs.bars([val], { x0: i + 1, color: ['muted', 'gold', 'accent'][i] }); Bs.line(i + 1, val - 2 * se[i], i + 1, val + 2 * se[i], { color: 'ink', width: 2 }); Bs.tex(['EX_0', 'EX_N', 'EX_k'][i], i + 1, Math.max(val, 0) + 2 * se[i], { dy: -14, align: 'center', size: 15 }); });
          st = { m, se, N, meanN: cache.meanN, ext };
        });
        v.legend([['gold', 'stopping time'], ['orange', 'level $a$', { dash: [5, 4] }]]);
        v.readout(() => st && `$EX_0=${fr(st.m[0], 3)}$, $EX_N=${fr(st.m[1], 3)}\\pm${fr(2 * st.se[1], 3)}$, $EX_k=${fr(st.m[2], 3)}\\pm${fr(2 * st.se[2], 3)}$; mean $N=${fr(st.meanN, 1)}$.\n${rule.value === 'peek' ? 'The rule looks ahead (it is not a stopping time), so the theorem does not apply: $EX_N\\ge EX_k$ can fail to be $\\le$.' : (st.m[0] <= st.m[1] + 2 * st.se[1] && st.m[1] <= st.m[2] + 2 * st.se[2] + 1e-9) ? 'Order $EX_0\\le EX_N\\le EX_k$ holds (within error).' : 'For this process the inequalities run the other way (supermartingale) or are equalities (martingale).'}`);
      },
    },
    // ======================================================================== 4.4.2
    {
      num: '4.4.2',
      kind: 'Theorem',
      name: 'Doob’s maximal inequality',
      statement: String.raw`Let $X_m$ be a submartingale, $\bar X_n=\max_{0\le m\le n}X_m$ and $\lambda>0$. Then
$$\lambda\,P(\bar X_n\ge\lambda)\le E\big(X_n;\ \bar X_n\ge\lambda\big)\le EX_n^+ .$$
For a nonnegative submartingale this strengthens Markov's inequality for $X_n$ to a bound on the whole running maximum.`,
      idea: String.raw`Let $N=\min\{m:X_m\ge\lambda\}\wedge n$, a bounded stopping time. On $A=\{\bar X_n\ge\lambda\}$ we have $X_N\ge\lambda$, and off $A$, $N=n$. By optional stopping (4.4.1) for the submartingale $X$, $EX_n\ge EX_N=E(X_N;A)+E(X_n;A^c)\ge\lambda P(A)+E(X_n;A^c)$. Cancel $E(X_n;A^c)$ to get $\lambda P(A)\le E(X_n;A)$.`,
      caption: String.raw`Left: 50 seeded paths of the chosen nonnegative submartingale up to time $n$, with the level $\lambda$ (set in units of the process' scale); paths whose running maximum reaches $\lambda$ are red. Right: as $\lambda$ varies, $\lambda P(\bar X_n\ge\lambda)$ (blue) always lies below $E(X_n;\bar X_n\ge\lambda)$ (green), which lies below $EX_n$; the dashed grey curve is Markov's bound for $X_n$ alone, $\lambda P(X_n\ge\lambda)$, which is much smaller than the maximal probability. Estimates use 5000 paths.`,
      deps: ['prob-4.4.1'],
      see: ['stoch-12.8'],
      tags: ['maximal inequalities', 'martingales'],
      credit: 'J. L. Doob',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 4.4.2 and proof, p. 235'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const proc = v.select('submartingale', [{ value: 'abs', label: '$|S_n|$' }, { value: 'sq', label: '$S_n^2$' }, { value: 'exp', label: '$e^{0.15S_n}/\\cosh^n0.15$' }], 'abs');
        const nS = v.slider('time $n$', 20, 200, 100, { int: true });
        const lS = v.slider('level $\\lambda$ / scale', 0.3, 4, 1.5, { step: 0.05 });
        let seed = 1; v.button('Resample paths', () => { seed++; });
        const NP = 5000;
        const P = v.stage({ x: [0, 100], y: [0, 40], axes: 'box', gutter: true, height: 320, xlabel: '$m$', title: '$X_m$ and the level $\\lambda$', weight: 1.3 });
        const Q = v.stage({ x: [0, 4], y: [0, 3], axes: 'box', gutter: true, height: 320, xlabel: '$\\lambda$ / scale', title: 'the three quantities as $\\lambda$ varies' });
        const th = 0.15, g = (kind, s, m) => (kind === 'abs' ? Math.abs(s) : kind === 'sq' ? s * s : Math.exp(th * s) / Math.cosh(th) ** m);
        let cache = null, st = null;
        v.render(() => {
          const n = nS.value, key = `${proc.value}|${n}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(555 + proc.value.length), mx = new Float64Array(NP), xn = new Float64Array(NP);
            for (let i = 0; i < NP; i++) { const S = walkPath(r, n); let b = 0; for (let m = 0; m <= n; m++) b = Math.max(b, g(proc.value, S[m], m)); mx[i] = b; xn[i] = g(proc.value, S[n], n); }
            cache = { key, mx, xn, EX: meanOf(xn) };
          }
          const sc = proc.value === 'abs' ? Math.sqrt(n) : proc.value === 'sq' ? n : 1, lam = lS.value * sc, { mx, xn, EX } = cache;
          const r2 = v.rng(seed * 3 + 1), paths = [];
          let top = 0;
          for (let i = 0; i < 50; i++) { const S = walkPath(r2, n), X = Float64Array.from(S, (s, m) => g(proc.value, s, m)); paths.push(X); top = Math.max(top, ...X); }
          P.setView([0, n], [0, Math.max(top, lam) * 1.1]);
          paths.forEach((X) => { const hit = Math.max(...X) >= lam; P.path(pts(X, 2), { color: hit ? 'red' : 'accent', width: 1, alpha: hit ? 0.7 : 0.4 }); });
          P.hline(lam, { color: 'orange', width: 2 });
          const curve = (fn) => Array.from({ length: 81 }, (_, i) => { const l = ((0.3 + (3.7 * i) / 80)) * sc; return [0.3 + (3.7 * i) / 80, fn(l)]; });
          const A = (l) => { let c = 0; for (let i = 0; i < NP; i++) if (mx[i] >= l) c++; return (l * c) / NP; };
          const Bn = (l) => { let c = 0; for (let i = 0; i < NP; i++) if (mx[i] >= l) c += xn[i]; return c / NP; };
          const M = (l) => { let c = 0; for (let i = 0; i < NP; i++) if (xn[i] >= l) c++; return (l * c) / NP; };
          const ys = [A, Bn, M].map((fn) => curve(fn));
          Q.setView([0, 4], [0, EX * 1.25]);
          Q.hline(EX, { color: 'muted', dash: [6, 4] });
          Q.path(ys[2], { color: 'muted', width: 1.6, dash: [4, 4] });
          Q.path(ys[1], { color: 'green', width: 2.4 });
          Q.path(ys[0], { color: 'accent', width: 2.4 });
          Q.vline(lS.value, { color: 'orange' });
          st = { a: A(lam), b: Bn(lam), EX, mk: M(lam), pmax: mx.filter((x) => x >= lam).length / NP };
        });
        v.legend([['accent', '$\\lambda P(\\bar X_n\\ge\\lambda)$'], ['green', '$E(X_n;\\bar X_n\\ge\\lambda)$'], ['muted', '$EX_n$ (flat) and $\\lambda P(X_n\\ge\\lambda)$', { dash: [4, 4] }]]);
        v.readout(() => st && `At the chosen $\\lambda$: $\\lambda P(\\bar X_n\\ge\\lambda)=${fr(st.a, 3)}\\ \\le\\ E(X_n;\\bar X_n\\ge\\lambda)=${fr(st.b, 3)}\\ \\le\\ EX_n=${fr(st.EX, 3)}$.\n$P(\\bar X_n\\ge\\lambda)=${fr(st.pmax, 3)}$; Markov on $X_n$ alone only gives $\\lambda P(X_n\\ge\\lambda)=${fr(st.mk, 3)}$.`);
      },
    },
    // ======================================================================== 4.4.4
    {
      num: '4.4.4',
      kind: 'Theorem',
      name: 'Doob’s Lᵖ maximal inequality',
      statement: String.raw`Let $X_m$ be a submartingale and $\bar X_n=\max_{m\le n}X_m^+$. For $1<p<\infty$,
$$E\bar X_n^{\,p}\le\Big(\frac p{p-1}\Big)^pE(X_n^+)^p .$$
The constant $(p/(p-1))^p$ tends to $\infty$ as $p\downarrow1$ (and decreases to $e$ as $p\to\infty$).`,
      idea: String.raw`Apply the tail-integral formula to $\bar X_n\wedge M$, so every intermediate moment is finite. Doob's inequality and Fubini give $E(\bar X_n\wedge M)^p\le qE[X_n^+(\bar X_n\wedge M)^{p-1}]$, where $q=p/(p-1)$. Hölder bounds the right side by $q\|X_n^+\|_p\|\bar X_n\wedge M\|_p^{p-1}$. If $E(X_n^+)^p=\infty$ the claim is automatic; otherwise divide by the finite truncated norm and then let $M\to\infty$ by monotone convergence. Finite time alone does not ensure finite $p$th moments.`,
      caption: String.raw`Left, on a log scale and as functions of $p$: $EX_n^p$ (lower, exact), the simulated $E\bar X_n^p$ (middle, 5000 paths) and the bound $(p/(p-1))^pEX_n^p$ (upper). The true expected maximum lies between the other two; the Monte Carlo curve can leave this interval because rare large maxima make its error substantial, especially at large $p$. Right: the constant $(p/(p-1))^p$ (orange) against the observed ratio $E\bar X_n^p/EX_n^p$ (blue). As $p\downarrow1$ the constant blows up but the observed ratio stays moderate: the inequality is far from sharp for this process, though the sharp constant for the class of all submartingales really does diverge as $p\to1$. The exponential martingale has heavy tails in $p$, so large $p$ is at the edge of Monte Carlo accuracy.`,
      deps: ['prob-4.4.2', 'prob-2.2.13', 'prob-1.6.3'],
      tags: ['maximal inequalities', 'lp'],
      credit: 'J. L. Doob',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 4.4.4 and truncated-moment proof, pp. 236–237'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      viz(v) {
        const proc = v.select('submartingale', [{ value: 'abs', label: '$|S_n|$' }, { value: 'exp', label: '$e^{0.1S_n}/\\cosh^n0.1$' }], 'abs');
        const nS = v.slider('time $n$', 10, 100, 50, { int: true });
        const pS = v.slider('exponent $p$', 1.05, 5, 2, { step: 0.01 });
        const NP = 5000, th = 0.1;
        const P = v.stage({ x: [1, 5], y: [1, 1e3], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$p$', title: '$p$-th moments (log scale)', weight: 1.3 });
        const Q = v.stage({ x: [1, 5], y: [0, 30], axes: 'box', gutter: true, height: 320, xlabel: '$p$', title: 'constant and observed ratio' });
        const EXp = (kind, n, p) => {
          if (kind === 'exp') return (Math.cosh(p * th) / Math.cosh(th) ** p) ** n;
          let s = 0; for (let k = 0; k <= n; k++) s += Math.exp(lfac(n) - lfac(k) - lfac(n - k) - n * Math.LN2 + p * Math.log(Math.max(Math.abs(2 * k - n), 1e-300))); return s;
        };
        let cache = null, st = null;
        v.render(() => {
          const n = nS.value, key = `${proc.value}|${n}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(808 + proc.value.length), mx = new Float64Array(NP);
            for (let i = 0; i < NP; i++) { const S = walkPath(r, n); let b = 0; for (let m = 0; m <= n; m++) b = Math.max(b, proc.value === 'abs' ? Math.abs(S[m]) : Math.exp(th * S[m]) / Math.cosh(th) ** m); mx[i] = b; }
            cache = { key, mx };
          }
          const ps = Array.from({ length: 81 }, (_, i) => 1.05 + (3.95 * i) / 80), q = (p) => p / (p - 1);
          const lhs = (p) => { let s = 0; for (const x of cache.mx) s += x ** p; return s / NP; };
          const A = ps.map((p) => EXp(proc.value, n, p)), B = ps.map(lhs), C = ps.map((p, i) => q(p) ** p * A[i]);
          const lo = Math.max(1e-3, Math.min(...A) / 2), hi = Math.min(1e30, Math.max(...C) * 2);
          P.setView([1, 5], [lo, hi]);
          P.path(ps.map((p, i) => [p, C[i]]), { color: 'orange', width: 2.2 });
          P.path(ps.map((p, i) => [p, B[i]]), { color: 'accent', width: 2.4 });
          P.path(ps.map((p, i) => [p, A[i]]), { color: 'green', width: 2.2 });
          P.vline(pS.value, { color: 'gold', dash: [4, 4] });
          Q.setView([1, 5], [0, 30]);
          Q.path(ps.map((p) => [p, Math.min(30, q(p) ** p)]), { color: 'orange', width: 2.2 });
          Q.path(ps.map((p, i) => [p, Math.min(30, B[i] / A[i])]), { color: 'accent', width: 2.2 });
          Q.vline(pS.value, { color: 'gold', dash: [4, 4] });
          const p = pS.value, a = EXp(proc.value, n, p), b = lhs(p);
          st = { p, a, b, c: q(p) ** p * a, k: q(p) ** p };
        });
        v.legend([['green', '$EX_n^p$'], ['accent', '$E\\bar X_n^p$ (simulated)'], ['orange', '$(p/(p-1))^pEX_n^p$']]);
        v.readout(() => st && `$p=${fr(st.p, 2)}$: $EX_n^p=${sciT(st.a, 3)}$, $E\\bar X_n^p\\approx${sciT(st.b, 3)}$, bound $${sciT(st.c, 3)}$ with constant $(p/(p-1))^p=${fr(st.k, 2)}$. ${st.b <= st.c ? 'The sample estimate is below the bound.' : 'Monte Carlo error exceeds the margin here.'}`);
      },
    },
    // ======================================================================== 4.4.6
    {
      num: '4.4.6',
      kind: 'Theorem',
      name: 'Lᵖ martingale convergence theorem',
      statement: String.raw`Let $X_n$ be a martingale with $\sup_nE|X_n|^p<\infty$ for some $p>1$. Then $X_n\to X$ almost surely **and** in $L^p$: $E|X_n-X|^p\to0$. (For $p=1$ this fails: $L^1$-bounded martingales converge a.s. but need not converge in $L^1$.)`,
      idea: String.raw`A.s. convergence is the martingale convergence theorem 4.2.11, since $L^p$-bounded implies $L^1$-bounded. For $L^p$ convergence apply Doob's inequality 4.4.4 to get $E\sup_n|X_n|^p\le(p/(p-1))^p\sup_nE|X_n|^p<\infty$. Then $|X_n-X|^p\le(2\sup_m|X_m|)^p$ is dominated by an integrable variable and tends to $0$ a.s., so dominated convergence (1.6.7) gives $E|X_n-X|^p\to0$.`,
      caption: String.raw`The martingale is the random series $X_n=\sum_{k\le n}\xi_ka_k$ with signs $\xi_k=\pm1$ and $a_k=k^{-\gamma}$; it is $L^2$-bounded exactly when $\sum a_k^2<\infty$, i.e. $\gamma>\tfrac12$. Left: 30 paths (log time axis). Right, log-log: the estimated $E|X_n-X_N|^p$ with $X_N$ standing in for the limit ($N=3000$, 800 paths) against $n$; for $p=2$ the dashed curve is the exact value $\sum_{n<k\le N}a_k^2$. For $\gamma>\tfrac12$ the error falls to $0$; drag $\gamma$ below $\tfrac12$ and the paths keep wandering and the error stops decreasing.`,
      deps: ['prob-4.4.4', 'prob-4.2.11', 'prob-1.6.7'],
      tags: ['martingales', 'lp'],
      scope: String.raw`The limit is replaced by $X_{3000}$, so errors below the size of the remaining tail are not meaningful (the plot stops at $n=1000$).`,
      viz(v) {
        const gS = v.slider('decay $\\gamma$ in $a_k=k^{-\\gamma}$', 0.3, 1.5, 0.75, { step: 0.01 });
        const pSel = v.select('norm $p$', [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 4, label: '4' }], 2);
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 3000, NP = 800;
        const A = v.stage({ x: [1, N], y: [-6, 6], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$X_n=\\sum_{k\\le n}\\xi_ka_k$', weight: 1.2 });
        const B = v.stage({ x: [1, 1000], y: [1e-4, 100], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$E|X_n-X_N|^p$' });
        let cache = null, st = null;
        const CK = Array.from({ length: 41 }, (_, i) => Math.round(Math.exp((Math.log(1000) * i) / 40))).filter((x, i, a) => i === 0 || x !== a[i - 1]);
        v.render(() => {
          const g = gS.value, key = `${g}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 43 + 9), a = new Float64Array(N + 1); for (let k = 1; k <= N; k++) a[k] = k ** -g;
            const vals = CK.map(() => new Float64Array(NP)), fin = new Float64Array(NP), shown = [];
            const isCk = new Map(CK.map((c, j) => [c, j])); const rec = [];
            for (let i = 0; i < NP; i++) {
              let x = 0; const pth = [];
              for (let k = 1; k <= N; k++) { x += (r() < 0.5 ? 1 : -1) * a[k]; if (isCk.has(k)) vals[isCk.get(k)][i] = x; if (i < 30 && (k < 30 || k % 15 === 0 || k === N)) pth.push([k, x]); }
              fin[i] = x; if (i < 30) shown.push(pth);
            }
            void rec; cache = { key, vals, fin, shown, a };
          }
          const { vals, fin, shown, a } = cache, p = pSel.value;
          const hi = Math.max(1.5, ...shown.map((pp) => Math.max(...pp.map((q) => Math.abs(q[1]))))) * 1.1;
          A.setView([1, N], [-hi, hi]);
          for (const pp of shown) A.path(pp, { color: 'accent', width: 1, alpha: 0.5 });
          const err = CK.map((c, j) => { let s = 0; for (let i = 0; i < NP; i++) s += Math.abs(vals[j][i] - fin[i]) ** p; return [c, s / NP]; });
          B.path(err.filter(([, y]) => y > 0), { color: 'accent', width: 2.4 });
          B.dots(err.filter(([, y]) => y > 0), { r: 3, color: 'accent' });
          if (p === 2) { const ex = CK.map((c) => { let s = 0; for (let k = c + 1; k <= N; k++) s += a[k] * a[k]; return [c, s]; }); B.path(ex, { color: 'orange', width: 1.8, dash: [6, 4] }); }
          st = { g, p, e10: err.find(([c]) => c >= 10)?.[1], e1000: err[err.length - 1][1], sum2: (() => { let s = 0; for (let k = 1; k <= 1e6; k++) s += k ** (-2 * g); return s; })() };
        });
        v.legend([['accent', 'path / Monte Carlo error'], ['orange', 'exact $\\sum_{n<k\\le N}a_k^2$ ($p=2$)', { dash: [6, 4] }]]);
        v.readout(() => st && `$\\gamma=${fr(st.g, 2)}$: $\\sum a_k^2$ ${st.g > 0.5 ? 'converges' : 'diverges'} (partial sum to $10^6$: $${fr(st.sum2, 2)}$). $E|X_n-X_N|^{${st.p}}$ is $${fr(st.e10, 3)}$ at $n=10$ and $${fr(st.e1000, 4)}$ at $n=1000$.`);
      },
    },
  ],
};
