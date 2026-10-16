// Probability: Theory and Examples (Durrett) — Chapter 5, part M1: §5.4 Recurrence of random walks
import { clampN, fr, srwU, renewalF, LATTICE, LATTICE_OPTS } from './ch05-m.shared.js';

const SQ2 = Math.SQRT2;
const cacheF = new Map();
const renewalCached = (d, N) => { const k = `${d}|${N}`; if (!cacheF.has(k)) cacheF.set(k, renewalF(srwU(d, N))); return cacheF.get(k); };
const pickW = (w, r) => { const u = r(); let c = 0; for (const e of w) { c += e[3]; if (u <= c) return e; } return w[w.length - 1]; };
/** Thinned points [n, a[n]] of a typed array. */
const ptsOf = (a, stride = 1) => { const o = []; for (let i = 0; i < a.length; i += stride) o.push([i, a[i]]); return o; };

export default {
  collection: 'prob',
  chapter: 5,
  items: [
    // ======================================================================== 5.4.1
    {
      num: '5.4.1',
      kind: 'Theorem',
      name: 'Recurrent values of a random walk form a closed subgroup',
      statement: String.raw`Let $S_n=X_1+\dots+X_n$ be a random walk in $\R^d$. Call $x$ a **possible value** if for every $\eps>0$ the walk enters $\{\|y-x\|<\eps\}$ with positive probability, and a **recurrent value** if $P(\|S_n-x\|<\eps\ \text{i.o.})=1$ for every $\eps>0$. Let $U$ be the set of possible and $V$ the set of recurrent values. Then $V$ is either empty or a closed subgroup of $\R^d$, and in the second case $V=U$.`,
      idea: String.raw`A recurrent value is certainly possible, so $V\subset U$. Closedness is a $2\eps$-argument. For the group property take $y\in V$ and $x\in U$: the walk gets near $x$ with positive probability, and since the later steps are independent of that event, a recurrent $y$ forces a return near $y-x$ again and again; with $x\in V$ too this gives $y-x\in V$. Taking $x=y$ gives $0\in V$, and then every possible value is recurrent.`,
      caption: String.raw`Sixty seeded walks of $10\,000$ steps each; the curve counts the visits of the **second half** of the walks (added up) to the window $(x-\eps,x+\eps)$. Step set $\{\pm1,\pm\sqrt2\}$: every $x$ is visited ($V=\R$). $\{\pm2,\pm3\}$: visits only at integers ($V=\Z$). $\{\pm2,\pm4\}$: only at even integers. With a drift nothing near the origin is ever revisited: $V=\emptyset$.`,
      deps: ['prob-5.3.1a'],
      tags: ['random walk', 'recurrence'],
      scope: String.raw`Finitely many steps and walks prove nothing: the picture shows the window counts of one seeded sample, which approximate the dichotomy $V=\R,\ \Z,\ 2\Z$ or $\emptyset$.`,
      viz(v) {
        const mode = v.select('step set', [{ value: 'R', label: '$\\pm1,\\pm\\sqrt2$' }, { value: 'Z', label: '$\\pm2,\\pm3$' }, { value: '2Z', label: '$\\pm2,\\pm4$' }, { value: 'drift', label: 'drift' }], 'R');
        const eS = v.slider('window $\\varepsilon$', 0.1, 0.5, 0.25, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 10000, M = 60, X = 5, BW = 0.02, LO = -X - 1, NB = Math.round((2 * (X + 1)) / BW);
        const A = v.stage({ x: [-X, X], y: [0, 30], axes: 'box', gutter: true, height: 320, xlabel: '$x$', ylabel: 'visits in $n>N/2$', title: 'visits of 60 walks (second half) to $(x-\\varepsilon,x+\\varepsilon)$' });
        let cache = null, st = null;
        v.render(() => {
          const key = `${mode.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 31 + mode.value.length * 7 + 3), h = new Float64Array(NB + 1);
            const steps = { R: [1, -1, SQ2, -SQ2], Z: [2, -2, 3, -3], '2Z': [2, -2, 4, -4] }[mode.value];
            for (let w = 0; w < M; w++) {
              let S = 0;
              for (let n = 1; n <= N; n++) {
                S += mode.value === 'drift' ? (r() < 0.6 ? 1 : -1) : steps[Math.floor(r() * 4)];
                if (n > N / 2) { const b = Math.floor((S - LO) / BW); if (b >= 0 && b < NB) h[b + 1]++; }
              }
            }
            for (let i = 1; i <= NB; i++) h[i] += h[i - 1];
            cache = { key, h };
          }
          const e = eS.value, pre = (x) => cache.h[clampN(Math.round((x - LO) / BW), 0, NB)];
          const cnt = (x) => pre(x + e) - pre(x - e);
          let mx = 1, vis = 0, tot = 0;
          for (let x = -X; x <= X; x += 0.02) { const c = cnt(x); mx = Math.max(mx, c); tot++; if (c > 0) vis++; }
          A.setView([-X, X], [0, mx * 1.15]);
          A.fn(cnt, { n: 700, color: 'accent', fill: true, fillAlpha: 0.25, width: 1.4 });
          for (let k = -X; k <= X; k++) A.vline(k, { color: 'faint', dash: [2, 4], alpha: 0.5 });
          st = { share: vis / tot };
        });
        v.readout(() => st && `Share of $x\\in[-5,5]$ whose window is visited: **${v.fix(100 * st.share, 0)}%**.\n${{ R: 'About 100%: the set of recurrent values is all of $\\R$ (the group $\\Z+\\sqrt2\\,\\Z$ is dense).', Z: `About $2\\varepsilon=${v.fix(200 * eS.value, 0)}\\%$: only the windows around integers are ever visited, $V=\\Z$.`, '2Z': `About $\\varepsilon=${v.fix(100 * eS.value, 0)}\\%$: only even integers, $V=2\\Z$.`, drift: 'The walk has run off to $+\\infty$: no window near the origin is visited in the second half, $V=\\emptyset$.' }[mode.value]}`);
      },
    },
    // ======================================================================== 5.4.3
    {
      num: '5.4.3',
      kind: 'Theorem',
      name: 'Recurrence of random walks: three equivalent conditions',
      statement: String.raw`Let $S_n$ be a random walk on $\Z^d$ started at $0$ and $\rho=P(S_n=0\text{ for some }n\ge1)$. The following are equivalent:
(i) $\rho=1$;
(ii) $P(S_n=0\text{ for infinitely many }n)=1$;
(iii) $\sum_{n\ge0}P(S_n=0)=\infty$.
Otherwise $\rho<1$ and the expected number of returns is $\rho/(1-\rho)<\infty$; the walk is **transient**.`,
      idea: String.raw`The number of visits to $0$ is $\sum_n\mathbf 1_{\{S_n=0\}}$, whose expectation is the series in (iii). By the strong Markov property at the successive return times, the probability of at least $k$ returns is $\rho^k$, so the number of returns is geometric when $\rho<1$ (finite mean $\rho/(1-\rho)$) and infinite a.s. when $\rho=1$. This ties (i), (ii) and (iii) together (5.2.6).`,
      caption: String.raw`Choose $d$. Left: the series $\sum_{m\le n}P(S_m=0)$ (exact, from the renewal recursion) together with the **mean number of returns** by time $n$ over 500 seeded walks: the two coincide. Right: the exact probability $P(T_0\le n)$ of having returned by time $n$ and the simulated fraction. They approach $1$ together with the divergence of the series ($d=1,2$) and stall below $1$ ($d=3$).`,
      deps: ['prob-5.3.1', 'prob-5.2.6'],
      tags: ['random walk', 'recurrence'],
      scope: String.raw`Simple symmetric walks, $n\le1500$ steps and 500 walks; the divergence for $d=1,2$ is slow (like $\sqrt n$ and $\log n$) and is only visible as an unbounded trend.`,
      viz(v) {
        const dS = v.select('dimension', [{ value: '1', label: '$d=1$' }, { value: '2', label: '$d=2$' }, { value: '3', label: '$d=3$' }], '2');
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 1500, M = 500;
        const A = v.stage({ x: [0, N], y: [0, 10], axes: 'box', gutter: true, height: 300, xlabel: '$n$', title: '$\\sum_{m\\le n}P(S_m=0)$ and mean returns' });
        const B = v.stage({ x: [0, N], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: '$n$', title: '$P(T_0\\le n)$' });
        let cache = null, st = null;
        v.render(() => {
          const d = +dS.value, key = `${d}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 101 + d), ev = new Float64Array(N + 1), fe = new Float64Array(N + 1);
            for (let w = 0; w < M; w++) {
              const x = [0, 0, 0]; let first = true;
              for (let n = 1; n <= N; n++) {
                x[Math.floor(r() * d)] += r() < 0.5 ? 1 : -1;
                if (!x[0] && !x[1] && !x[2]) { ev[n]++; if (first) { fe[n]++; first = false; } }
              }
            }
            for (let n = 1; n <= N; n++) { ev[n] += ev[n - 1]; fe[n] += fe[n - 1]; }
            for (let n = 0; n <= N; n++) { ev[n] /= M; fe[n] /= M; }
            const u = srwU(d, N), f = renewalCached(d, N), cu = new Float64Array(N + 1), cf = new Float64Array(N + 1);
            for (let n = 1; n <= N; n++) { cu[n] = cu[n - 1] + u[n]; cf[n] = cf[n - 1] + f[n]; }
            cache = { key, ev, fe, cu, cf };
          }
          const { ev, fe, cu, cf } = cache;
          A.setView([0, N], [0, Math.max(cu[N], ev[N]) * 1.12]);
          A.path(ptsOf(cu, 5), { color: 'accent', width: 2 });
          A.path(ptsOf(ev, 5), { color: 'gold', width: 1.4 });
          B.path(ptsOf(cf, 5), { color: 'accent', width: 2 });
          B.path(ptsOf(fe, 5), { color: 'gold', width: 1.4 });
          B.hline(1, { color: 'faint', dash: [4, 4] });
          st = { d, s: cu[N], m: ev[N], p: cf[N], ps: fe[N] };
        });
        v.legend([['accent', 'exact'], ['gold', 'simulation']]);
        v.readout(() => st && `At $n=${N}$: $\\sum P(S_m=0)=${fr(st.s, 2)}$, simulated mean returns $${fr(st.m, 2)}$.\n$P(T_0\\le n)=${fr(st.p, 3)}$ exactly, $${fr(st.ps, 3)}$ simulated. ${st.d === 3 ? 'The series converges (to about $1.5$, so $\\rho\\approx0.34$): transient.' : 'The series keeps growing and the return probability creeps toward $1$: recurrent.'}`);
      },
    },
    // ======================================================================== 5.4.4
    {
      num: '5.4.4',
      kind: 'Theorem',
      name: 'Pólya’s recurrence theorem',
      statement: String.raw`Simple symmetric random walk on $\Z^d$ is recurrent for $d=1$ and $d=2$ and transient for $d\ge3$.`,
      idea: String.raw`By 5.4.3, recurrence is equivalent to $\sum_nP(S_n=0)=\infty$. The walk can return only at even times, and a local limit theorem (3.1.2 for $d=1$; the same computation in higher dimensions) gives $P(S_{2n}=0)\sim2\,(d/4\pi n)^{d/2}$, of order $n^{-d/2}$. This series diverges exactly when $d/2\le1$.`,
      caption: String.raw`Left: one seeded walk of $N$ steps (for $d=1$ the graph of $S_n$, otherwise the projection to the $xy$-plane); gold dots mark returns to the origin. Right: $P(S_{2n}=0)$ against $n$ on log–log axes with Pólya's asymptote $2(d/4\pi n)^{d/2}$ dashed, whose slope $-d/2$ decides whether the series diverges.`,
      deps: ['prob-5.4.3', 'prob-3.1.2'],
      see: ['stoch-3.5', 'stoch-8.6', 'stoch-8.7'],
      tags: ['random walk', 'recurrence'],
      credit: 'G. Pólya, 1921',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Random_walk' },
      viz(v) {
        const dS = v.select('dimension', [{ value: '1', label: '$d=1$' }, { value: '2', label: '$d=2$' }, { value: '3', label: '$d=3$' }], '2');
        const nS = v.slider('steps $N$', 1000, 200000, 20000, { log: true, int: true, sig: 2 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [-10, 10], y: [-10, 10], axes: 'box', gutter: true, height: 320, equal: false, title: 'a walk' });
        const B = v.stage({ x: [1, 1000], y: [1e-6, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', ylabel: '$P(S_{2n}=0)$', title: 'return probability' });
        let cache = null, st = null;
        v.render(() => {
          const d = +dS.value, N = nS.value, key = `${d}|${N}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 59 + d), xs = new Float64Array(N + 1), ys = new Float64Array(N + 1), pos = [0, 0, 0], ret = [];
            for (let n = 1; n <= N; n++) {
              pos[Math.floor(r() * d)] += r() < 0.5 ? 1 : -1;
              xs[n] = pos[0]; ys[n] = d === 1 ? 0 : pos[1];
              if (!pos[0] && !pos[1] && !pos[2]) ret.push(n);
            }
            cache = { key, xs, ys, ret };
          }
          const { xs, ys, ret } = cache, stride = Math.max(1, Math.ceil(N / 3000)), P = [];
          if (d === 1) { for (let n = 0; n <= N; n += stride) P.push([n, xs[n]]); } else for (let n = 0; n <= N; n += stride) P.push([xs[n], ys[n]]);
          let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
          for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
          const pad = (a, b) => Math.max(2, (b - a) * 0.06);
          if (d === 1) { const m = Math.max(3, -y0, y1) * 1.1; A.setView([0, N], [-m, m]); A.hline(0, { color: 'faint' }); A.setLabels('$n$', '$S_n$'); A.setTitle('$S_n$'); }
          else { const m = Math.max(x1 - x0, y1 - y0) / 2 + 2, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; A.setView([cx - m, cx + m], [cy - m, cy + m]); A.setLabels('$x$', '$y$'); A.setTitle(d === 2 ? 'the walk in the plane' : 'the walk, projected to the $xy$-plane'); }
          A.path(P, { color: 'accent', width: 1, alpha: 0.75 });
          if (d > 1) A.dot(0, 0, { r: 5, color: 'red' });
          for (const n of ret.slice(0, 400)) A.dot(d === 1 ? n : 0, 0, { r: 3, color: 'gold' });
          const u = srwU(d, 2000), pts = [], asy = [];
          for (let n = 1; n <= 1000; n += 1) { pts.push([n, u[2 * n]]); asy.push([n, 2 * (d / (4 * Math.PI * n)) ** (d / 2)]); }
          B.path(asy, { color: 'orange', width: 1.5, dash: [5, 4] });
          B.path(pts, { color: 'accent', width: 2 });
          B.dot(1000, u[2000], { r: 3, color: 'accent' });
          let ex = 0; for (let k = 1; k <= Math.min(1000, N / 2); k++) ex += u[2 * k];
          for (let k = 1001; k <= N / 2; k++) ex += 2 * (d / (4 * Math.PI * k)) ** (d / 2);
          st = { d, R: ret.length, ex, slope: -d / 2 };
        });
        v.legend([['accent', 'exact'], ['orange', 'asymptote', { dash: true }]]);
        v.readout(() => st && `The walk returned to the origin **${st.R}** times in ${nS.value.toLocaleString('en')} steps; the expected number is $\\sum_{m\\le N}P(S_m=0)\\approx${fr(st.ex, 1)}$.\nThe terms decay like $n^{${st.slope === -1 ? '-1' : '-' + (-st.slope)}}$: ${st.d <= 2 ? '$\\sum n^{-d/2}=\\infty$, recurrent' : '$\\sum n^{-3/2}<\\infty$, transient'}.`);
      },
    },
    // ======================================================================== 5.4.5
    {
      num: '5.4.5',
      kind: 'Lemma',
      name: 'Σ P(‖Sₙ‖ < ε) decides recurrence near 0',
      statement: String.raw`Let $S_n$ be a random walk in $\R^d$, $\|\cdot\|$ the sup norm, and $\eps>0$. (a) If $\sum_nP(\|S_n\|<\eps)<\infty$, then $P(\|S_n\|<\eps\text{ i.o.})=0$. (b) If $\sum_nP(\|S_n\|<\eps)=\infty$, then $P(\|S_n\|<2\eps\text{ i.o.})=1$.`,
      idea: String.raw`Part (a) is the first Borel–Cantelli lemma (2.3.1). For (b), let $N$ count visits to the $\eps$-ball and look at the first time $T$ the walk enters it: the strong Markov property restarts the walk at $S_T$, and later visits to the $\eps$-ball are visits to the $2\eps$-ball of the restarted walk. So the expected number of visits to the $2\eps$-ball after reaching $\eps$ is at least the full sum; if it is infinite, then an infinite number of visits to the $2\eps$-ball cannot be avoided.`,
      caption: String.raw`Planar Gaussian steps (zero mean, or with a drift $(0.04,0)$). Left: one path in the window $[-10,10]^2$ with the $\eps$-square (green) and $2\eps$-square (orange); gold dots are visits to the $\eps$-square. Right: the partial sums $\sum_{m\le n}\hat P(\|S_m\|<\eps)$ (blue) and for $2\eps$ (orange), estimated from 300 seeded walks: unbounded without drift, levelling off with drift.`,
      deps: ['prob-2.3.1'],
      tags: ['random walk', 'recurrence'],
      verify: true,
      scope: String.raw`The lemma is for walks started at $0$ with i.i.d. steps; the sup norm is used so that the balls are squares. Constants (the factor $2$ in (b)) follow the textbook form as best I recall and are flagged for verification.`,
      viz(v) {
        const mode = v.select('walk', [{ value: 'zero', label: 'no drift' }, { value: 'drift', label: 'drift' }], 'zero');
        const eS = v.slider('$\\varepsilon$', 0.5, 3, 1.5, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 4000, M = 300, W = 10;
        const A = v.stage({ x: [-W, W], y: [-W, W], equal: true, axes: 'box', gutter: true, height: 320, title: 'one path near the origin' });
        const B = v.stage({ x: [0, N], y: [0, 10], axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$\\sum_{m\\le n}\\hat P(\\|S_m\\|<\\varepsilon)$' });
        let cache = null, st = null;
        v.render(() => {
          const key = `${mode.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 17 + mode.value.length), nr = new Float32Array(M * (N + 1)), px = new Float64Array(N + 1), py = new Float64Array(N + 1), dr = mode.value === 'drift' ? 0.04 : 0;
            for (let w = 0; w < M; w++) {
              let x = 0, y = 0;
              for (let n = 1; n <= N; n++) { x += r.normal() + dr; y += r.normal(); nr[w * (N + 1) + n] = Math.max(Math.abs(x), Math.abs(y)); if (w === 0) { px[n] = x; py[n] = y; } }
            }
            cache = { key, nr, px, py };
          }
          const { nr, px, py } = cache, e = eS.value, h1 = new Float64Array(N + 1), h2 = new Float64Array(N + 1);
          for (let w = 0; w < M; w++) for (let n = 1; n <= N; n++) { const q = nr[w * (N + 1) + n]; if (q < e) h1[n]++; if (q < 2 * e) h2[n]++; }
          for (let n = 1; n <= N; n++) { h1[n] = h1[n - 1] + h1[n] / M; h2[n] = h2[n - 1] + h2[n] / M; }
          A.rect(-2 * e, -2 * e, 2 * e, 2 * e, { fill: 'orange', fillAlpha: 0.1, color: 'orange', width: 1.2 });
          A.rect(-e, -e, e, e, { fill: 'green', fillAlpha: 0.18, color: 'green', width: 1.2 });
          const P = []; let vis = 0, vis2 = 0;
          for (let n = 0; n <= N; n++) { P.push([px[n], py[n]]); const q = Math.max(Math.abs(px[n]), Math.abs(py[n])); if (n && q < e) { vis++; A.dot(px[n], py[n], { r: 2.5, color: 'gold' }); } if (n && q < 2 * e) vis2++; }
          A.clip(() => A.path(P, { color: 'accent', width: 1, alpha: 0.6 }));
          A.dot(0, 0, { r: 4, color: 'ink' });
          B.setView([0, N], [0, Math.max(1, h2[N]) * 1.12]);
          B.path(ptsOf(h2, 10), { color: 'orange', width: 1.6 });
          B.path(ptsOf(h1, 10), { color: 'accent', width: 2 });
          st = { vis, vis2, s1: h1[N], s2: h2[N], half: h1[N >> 1] };
        });
        v.legend([['accent', '$\\varepsilon$'], ['orange', '$2\\varepsilon$']]);
        v.readout(() => st && `The shown path visits the $\\varepsilon$-square **${st.vis}** times and the $2\\varepsilon$-square ${st.vis2} times in $4000$ steps.\nPartial sums at $n=2000$ and $4000$ ($\\varepsilon$): $${fr(st.half, 2)}$ and $${fr(st.s1, 2)}$. ${mode.value === 'zero' ? 'They are still growing (like $\\log n$): the sum diverges.' : 'They level off: the sum converges and the walk visits the square only finitely often.'}`);
      },
    },
    // ======================================================================== 5.4.6
    {
      num: '5.4.6',
      kind: 'Lemma',
      name: 'Covering bound for visits to larger balls',
      statement: String.raw`Let $S_n$ be a random walk in $\R^d$, $\eps>0$, and $m\ge1$ an integer. With the sup norm,
$$\sum_{n\ge0}P(\|S_n\|<m\eps)\ \le\ (2m)^d\sum_{n\ge0}P(\|S_n\|<\eps).$$`,
      idea: String.raw`Cut the ball $\{\|x\|<m\eps\}$ into $(2m)^d$ cubes of side $\eps$. Two points of one cube are within $\eps$ of each other in the sup norm. Let $T$ be the first time the walk enters a given cube. After $T$ the walk, restarted at $S_T$ by the strong Markov property (5.2.5), is in the same cube only when it is within $\eps$ of its restart point, so the expected number of visits to the cube is at most the expected number of visits of the walk to the $\eps$-ball around $0$. Add up over the cubes.`,
      caption: String.raw`Planar Gaussian walk, 500 seeded runs of $1500$ steps. The window $[-m\eps,m\eps)^2$ is cut into $(2m)^2$ cells of side $\eps$; each cell shows its mean number of visits. The central $\eps$-ball is the square $[-\eps,\eps]^2$ (heavy outline). Every cell stays below it, and the total stays below $(2m)^2$ times it.`,
      deps: ['prob-5.4.5'],
      tags: ['random walk', 'estimates'],
      viz(v) {
        const eS = v.slider('cell side $\\varepsilon$', 0.4, 1.5, 1, { step: 0.05 });
        const mS = v.slider('$m$', 1, 4, 3, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 1500, M = 500;
        const A = v.stage({ x: [-6, 6], y: [-6, 6], equal: true, axes: false, height: 380, title: 'mean visits per cell' });
        let cache = null, st = null;
        v.render(() => {
          if (!cache || cache.seed !== seed) {
            const r = v.rng(seed * 23 + 5), X = new Float32Array(M * (N + 1)), Y = new Float32Array(M * (N + 1));
            for (let w = 0; w < M; w++) { let x = 0, y = 0; for (let n = 1; n <= N; n++) { x += r.normal(); y += r.normal(); X[w * (N + 1) + n] = x; Y[w * (N + 1) + n] = y; } }
            cache = { seed, X, Y };
          }
          const { X, Y } = cache, e = eS.value, m = mS.value, K = 2 * m, cells = new Float64Array(K * K);
          let center = 0;
          for (let i = 0; i < M * (N + 1); i++) {
            const x = X[i], y = Y[i];
            if (Math.abs(x) < e && Math.abs(y) < e) center++;
            const a = Math.floor((x + m * e) / e), b = Math.floor((y + m * e) / e);
            if (a >= 0 && a < K && b >= 0 && b < K) cells[a * K + b]++;
          }
          center /= M; let tot = 0, mx = 0;
          for (let i = 0; i < K * K; i++) { cells[i] /= M; tot += cells[i]; mx = Math.max(mx, cells[i]); }
          A.setView([-m * e - 0.2, m * e + 0.2], [-m * e - 0.2, m * e + 0.2]);
          for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) {
            const c = cells[a * K + b], x0 = -m * e + a * e, y0 = -m * e + b * e;
            A.rect(x0, y0, x0 + e, y0 + e, { fill: v.ramp(clampN(c / (mx * 1.05), 0, 1), 'accent'), fillAlpha: 0.9, color: 'panel', width: 0.8 });
            if (e * 40 > 26) A.text(c.toFixed(1), x0 + e / 2, y0 + e / 2, { size: 10, color: 'ink', align: 'center', baseline: 'middle' });
          }
          A.rect(-e, -e, e, e, { fill: false, color: 'red', width: 2.5 });
          st = { center, mx, tot, bound: K * K * center };
        });
        v.readout(() => st && `Mean visits to the central $\\varepsilon$-ball: **${fr(st.center, 2)}**. Largest cell: ${fr(st.mx, 2)} (never above it).\nTotal in the big ball: **${fr(st.tot, 1)}** $\\le(2m)^2\\cdot${fr(st.center, 2)}=${fr(st.bound, 1)}$.`);
      },
    },
    // ======================================================================== 5.4.7
    {
      num: '5.4.7',
      kind: 'Theorem',
      name: 'One radius decides transience or recurrence',
      statement: String.raw`Let $S_n$ be a random walk in $\R^d$. Then $S_n$ is recurrent ($P(\|S_n\|<\eps\text{ i.o.})=1$ for all $\eps>0$) if and only if $\sum_nP(\|S_n\|<\eps)=\infty$ for **some** $\eps>0$, and this holds iff it holds for **every** $\eps>0$. Otherwise the walk is transient: $\|S_n\|\to\infty$.`,
      idea: String.raw`If the series diverges for one $\eps$, the covering bound 5.4.6 makes it diverge for every radius $m\eps$, hence for all radii; then 5.4.5(b) gives $P(\|S_n\|<2\delta\text{ i.o.})=1$ for every $\delta$, which is recurrence. If it converges for some $\eps$, 5.4.5(a) shows the walk leaves that ball for good.`,
      caption: String.raw`Pick a walk. Each curve is the estimated partial sum $\sum_{m\le n}P(\|S_m\|<\eps)$ for $\eps=0.5,1,2$ (300 seeded walks with Gaussian steps of variance $1$ per coordinate, log $n$ axis). For the recurrent walks the three curves grow forever, a constant factor apart; for the transient ones all three level off.`,
      deps: ['prob-5.4.5', 'prob-5.4.6'],
      tags: ['random walk', 'recurrence'],
      viz(v) {
        const wS = v.select('walk', [{ value: '1', label: '$d=1$' }, { value: '2', label: '$d=2$' }, { value: '2d', label: '$d=2$, drift' }, { value: '3', label: '$d=3$' }], '2');
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 3000, M = 300, EPS = [0.5, 1, 2], COL = ['accent', 'orange', 'purple'];
        const A = v.stage({ x: [1, N], y: [0, 10], xlog: true, axes: 'box', gutter: true, height: 330, xlabel: '$n$', ylabel: '$\\sum_{m\\le n}\\hat P(\\|S_m\\|<\\varepsilon)$', title: 'the three partial sums' });
        let cache = null, st = null;
        v.render(() => {
          const key = `${wS.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const d = wS.value === '2d' ? 2 : +wS.value, r = v.rng(seed * 13 + d), H = EPS.map(() => new Float64Array(N + 1)), dr = wS.value === '2d' ? 0.05 : 0;
            for (let w = 0; w < M; w++) {
              let x = 0, y = 0, z = 0;
              for (let n = 1; n <= N; n++) {
                x += r.normal() + dr; if (d > 1) y += r.normal(); if (d > 2) z += r.normal();
                const q = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
                for (let k = 0; k < 3; k++) if (q < EPS[k]) H[k][n]++;
              }
            }
            for (const h of H) for (let n = 1; n <= N; n++) h[n] = h[n - 1] + h[n] / M;
            cache = { key, H };
          }
          const { H } = cache;
          A.setView([1, N], [0, Math.max(1, H[2][N]) * 1.1]);
          for (let k = 2; k >= 0; k--) A.path(ptsOf(H[k], 6).slice(1), { color: COL[k], width: 2 });
          st = { a: H[0][N], b: H[1][N], c: H[2][N], a2: H[0][N >> 1], c2: H[2][N >> 1] };
        });
        v.legend([['accent', '$\\varepsilon=0.5$'], ['orange', '$\\varepsilon=1$'], ['purple', '$\\varepsilon=2$']]);
        v.readout(() => st && `At $n=3000$: **${fr(st.a, 2)}**, **${fr(st.b, 2)}**, **${fr(st.c, 2)}** (for $\\varepsilon=0.5,1,2$).\nFrom $n=1500$ to $3000$ the $\\varepsilon=2$ sum grew by ${fr(st.c - st.c2, 2)} ($\\varepsilon=0.5$: ${fr(st.a - st.a2, 2)}): ${wS.value === '1' || wS.value === '2' ? 'all three keep growing together.' : 'all three have levelled off.'}`);
      },
    },
    // ======================================================================== 5.4.8
    {
      num: '5.4.8',
      kind: 'Theorem',
      name: 'Chung–Fuchs theorem',
      statement: String.raw`Let $S_n$ be a random walk on $\R$. If $S_n/n\to0$ in probability, then $S_n$ is recurrent. In particular a walk whose steps are integrable with mean $0$ is recurrent (weak law of large numbers).`,
      idea: String.raw`Fix $A>0$ and let $m$ be large. By the covering bound 5.4.6, $\sum_nP(|S_n|<1)\ge\frac1{2m}\sum_nP(|S_n|<m)\ge\frac1{2m}\sum_{n\le Am}P(|S_n|<n/A)$, because $|S_n|<n/A\le m$ there. Since $S_n/n\to0$ in probability, each term is close to $1$ when $n$ is large, so the last sum is about $Am$. The series is therefore at least about $A/2$ for every $A$, hence infinite, and 5.4.7 gives recurrence.`,
      caption: String.raw`Choose the step law (symmetric, except for the drifted one). Left: five paths drawn on a signed-log scale $\operatorname{arsinh}S_n$. Right: the median of $|S_n/n|$ over 300 seeded walks, log–log. When it falls to $0$ the theorem applies. The symmetric Cauchy law does **not** satisfy the hypothesis ($S_n/n$ is again Cauchy), yet it still returns, as 5.4.10 shows; the Pareto law with index $0.7$ does not return often.`,
      deps: ['prob-5.4.6', 'prob-5.4.7', 'prob-2.2.1a'],
      tags: ['random walk', 'recurrence'],
      credit: 'K. L. Chung & W. H. J. Fuchs, 1951',
      scope: String.raw`The theorem is a sufficient condition (one-dimensional): the converse fails, since the Cauchy walk is recurrent although $S_n/n$ does not tend to $0$. Counts of returns here use the window $|S_n|<1$ for $20\,000$ steps.`,
      viz(v) {
        const lS = v.select('step law', [
          { value: 'g', label: 'Gaussian' }, { value: 'p15', label: 'Pareto $\\alpha=1.5$' }, { value: 'c', label: 'Cauchy' }, { value: 'p07', label: 'Pareto $\\alpha=0.7$' }, { value: 'dr', label: 'Gaussian + drift' },
        ], 'p15');
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 20000, M = 300, CK = 70;
        const checks = Array.from({ length: CK }, (_, i) => Math.round(10 ** (1 + (i * (Math.log10(N) - 1)) / (CK - 1))));
        const A = v.stage({ x: [0, N], y: [-13, 13], axes: 'box', gutter: true, height: 320, xlabel: '$n$', ylabel: 'arsinh $S_n$', title: 'five paths (signed-log scale)' });
        const B = v.stage({ x: [10, N], y: [1e-3, 100], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: 'median $|S_n/n|$' });
        let cache = null, st = null;
        v.render(() => {
          const key = `${lS.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 41 + lS.value.length * 5), lw = lS.value;
            const draw = () => (lw === 'g' ? r.normal() : lw === 'dr' ? r.normal() + 0.05 : lw === 'c' ? Math.tan(Math.PI * (r() - 0.5)) : (r() < 0.5 ? -1 : 1) * r() ** (-1 / (lw === 'p15' ? 1.5 : 0.7)));
            const vals = checks.map(() => new Float64Array(M)), paths = [], rets = [];
            for (let w = 0; w < M; w++) {
              let S = 0, ci = 0, ret = 0; const P = [];
              for (let n = 1; n <= N; n++) {
                S += draw(); if (Math.abs(S) < 1) ret++;
                if (n === checks[ci]) { vals[ci][w] = Math.abs(S / n); ci++; }
                if (w < 5 && n % 20 === 0) P.push([n, Math.asinh(S)]);
              }
              if (w < 5) paths.push(P); rets.push(ret);
            }
            const med = vals.map((a) => { const b = Array.from(a).sort((x, y) => x - y); return b[M >> 1]; });
            rets.sort((x, y) => x - y);
            cache = { key, paths, med, retMean: rets.reduce((a, b) => a + b, 0) / M, retMed: rets[M >> 1] };
          }
          const cols = ['accent', 'orange', 'green', 'purple', 'teal'];
          cache.paths.forEach((P, i) => A.path(P, { color: cols[i], width: 1.1, alpha: 0.8 }));
          A.hline(0, { color: 'faint' });
          B.path(checks.map((n, i) => [n, Math.max(1e-3, cache.med[i])]), { color: 'accent', width: 2 });
          B.path([[10, 1], [N, 1]], { color: 'faint', dash: [4, 4] });
          st = { last: cache.med[CK - 1], retMean: cache.retMean, retMed: cache.retMed };
        });
        v.readout(() => st && `Median $|S_n/n|$ at $n=20\\,000$: **${st.last < 0.01 ? st.last.toExponential(1) : fr(st.last, 3)}**. Visits to $|S_n|<1$ in $20\\,000$ steps: median **${st.retMed}**, mean ${fr(st.retMean, 1)}.\n${{ g: '$S_n/n\\to0$: Chung–Fuchs applies.', p15: 'Mean exists and is $0$, so $S_n/n\\to0$ (slowly): recurrent.', c: '$S_n/n$ is standard Cauchy for every $n$: the hypothesis fails, but the walk is still recurrent.', p07: 'No mean and $|S_n|/n\\to\\infty$: the walk is transient (few returns).', dr: '$S_n/n\\to0.05$: not recurrent.' }[lS.value]}`);
      },
    },
  ],
};
