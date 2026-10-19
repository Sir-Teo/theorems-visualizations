// Probability: Theory and Examples (Durrett) — Chapter 4, part M3: §4.4 orthogonality and conditional variance, §4.5 the increasing process A_n
import { clampN, fr, sciT, pts, meanOf, seOf, walkPath } from './ch04-m.shared.js';

/**
 * A martingale X_n = sum_{m<=n} xi_m sigma_m with fair signs xi_m and PREDICTABLE step sizes sigma_m (a function of the past),
 * so E((X_m - X_{m-1})^2 | F_{m-1}) = sigma_m^2 and A_n = sum sigma_m^2. kind: const | poly (n^-g) | adapt (1/(1+|X|)) | coin (coin revealed in F_0: 1/n or n^-0.4) | band (1/n inside |X|<1, else n^-0.4).
 */
export function martPath(r, N, kind, g = 0.75) {
  const X = new Float64Array(N + 1), A = new Float64Array(N + 1), coin = r() < 0.5;
  for (let n = 1; n <= N; n++) {
    let s;
    if (kind === 'const') s = 1;
    else if (kind === 'poly') s = n ** -g;
    else if (kind === 'adapt') s = 1 / (1 + Math.abs(X[n - 1]));
    else if (kind === 'coin') s = coin ? 1 / n : n ** -0.4;
    else s = Math.abs(X[n - 1]) < 1 ? 1 / n : n ** -0.4;
    X[n] = X[n - 1] + (r() < 0.5 ? s : -s);
    A[n] = A[n - 1] + s * s;
  }
  return { X, A, coin };
}
const SCHED_OPTS = [{ value: 'const', label: '$\\sigma_n=1$' }, { value: 'poly', label: '$\\sigma_n=n^{-3/4}$' }, { value: 'adapt', label: '$\\sigma_n=\\frac1{1+|X_{n-1}|}$' }, { value: 'coin', label: 'initial coin: $1/n$ or $n^{-0.4}$' }];

export default {
  collection: 'prob',
  chapter: 4,
  items: [
    // ======================================================================== 4.4.7
    {
      num: '4.4.7',
      kind: 'Theorem',
      name: 'Orthogonality of martingale increments',
      statement: String.raw`Let $X_n$ be a square-integrable martingale and $m\le n\le p\le q$. Then the increments over disjoint time windows are orthogonal in $L^2$:
$$E\big[(X_n-X_m)(X_q-X_p)\big]=0,$$
and hence $\operatorname{Var}(X_q-X_m)=\sum_j\operatorname{Var}(\text{increment}_j)$ for any partition of $(m,q]$ into windows. They are uncorrelated, but in general not independent.`,
      idea: String.raw`Condition on $\mathcal F_p$: the factor $X_n-X_m$ is $\mathcal F_p$-measurable, so taking it out (4.1.14) gives $E[(X_n-X_m)(X_q-X_p)\mid\mathcal F_p]=(X_n-X_m)\,E[X_q-X_p\mid\mathcal F_p]=0$ because $X$ is a martingale. Taking expectations gives the claim. Expanding the square of a sum of increments then kills all cross terms, so the variances add. This makes $X_n=X_0+\sum(X_k-X_{k-1})$ an orthogonal series in $L^2$, the picture behind 4.4.6 for $p=2$.`,
      caption: String.raw`Two consecutive windows of length $h$: $A=X_{s+h}-X_s$ and $B=X_{s+2h}-X_{s+h}$ with $s=5$; each of 4000 seeded paths is one point. Choose the martingale: simple random walk (increments independent) or an "ARCH" martingale whose step is $\xi_n\sqrt{0.3+0.7D_{n-1}^2}$, with $\xi_n$ standard normal and $D_{n-1}$ the previous step (volatility clustering). In both cases the empirical correlation of $A$ and $B$ is $0$ up to noise of size $1/\sqrt{4000}\approx0.016$ and $\operatorname{Var}A+\operatorname{Var}B\approx\operatorname{Var}(A+B)$ (bars). For the ARCH martingale with $h=1$ the cloud is a funnel: uncorrelated but visibly dependent (the correlation of $|A|$ and $|B|$ is large).`,
      deps: ['prob-4.1.14'],
      tags: ['martingales', 'hilbert space'],
      viz(v) {
        const proc = v.select('martingale', [{ value: 'rw', label: 'random walk' }, { value: 'arch', label: 'ARCH martingale' }], 'arch');
        const hS = v.slider('window length $h$', 1, 20, 1, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NP = 4000, S0 = 5;
        const P = v.stage({ x: [-6, 6], y: [-6, 6], equal: true, axes: true, height: 340, xlabel: '$A$', ylabel: '$B$', title: 'increments $A$ (first window) and $B$ (second)', weight: 1.15 });
        const Bs = v.stage({ x: [0, 5], y: [0, 10], axes: 'box', gutter: true, height: 340, xticks: [], title: 'variances ($V_A=\\mathrm{Var}A$, …)', weight: 0.9 });
        let cache = null, st = null;
        v.render(() => {
          const h = hS.value, key = `${proc.value}|${h}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 101 + 13), a = new Float64Array(NP), b = new Float64Array(NP), T = S0 + 2 * h;
            for (let i = 0; i < NP; i++) {
              let x = 0, d = 1; const X = [0];
              for (let n = 1; n <= T; n++) {
                d = proc.value === 'rw' ? (r() < 0.5 ? 1 : -1) : r.normal() * Math.sqrt(0.3 + 0.7 * d * d);
                x += d; X.push(x);
              }
              a[i] = X[S0 + h] - X[S0]; b[i] = X[S0 + 2 * h] - X[S0 + h];
            }
            cache = { key, a, b };
          }
          const { a, b } = cache, ma = meanOf(a), mb = meanOf(b);
          let va = 0, vb = 0, cab = 0, ca = 0, cb = 0, cabs = 0, ma2 = 0, mb2 = 0;
          for (let i = 0; i < NP; i++) { va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; cab += (a[i] - ma) * (b[i] - mb); ma2 += Math.abs(a[i]); mb2 += Math.abs(b[i]); }
          ma2 /= NP; mb2 /= NP;
          let c1 = 0, v1 = 0, v2 = 0; for (let i = 0; i < NP; i++) { c1 += (Math.abs(a[i]) - ma2) * (Math.abs(b[i]) - mb2); v1 += (Math.abs(a[i]) - ma2) ** 2; v2 += (Math.abs(b[i]) - mb2) ** 2; }
          va /= NP - 1; vb /= NP - 1; cab /= NP - 1; void ca; void cb; void cabs;
          const corr = cab / Math.sqrt(va * vb), corrAbs = c1 / Math.sqrt(v1 * v2);
          const sum = Float64Array.from(a, (x, i) => x + b[i]), vs = v.M.variance(Array.from(sum));
          const lim = Math.max(3, Math.sqrt(vs) * 2.4); P.setView([-lim, lim], [-lim, lim]);
          P.dots(Array.from(a, (x, i) => [x, b[i]]).filter(([x, y]) => Math.abs(x) < lim && Math.abs(y) < lim), { r: 2, color: 'accent', alpha: 0.28 });
          const vals = [va, vb, va + vb, vs], top = Math.max(...vals) * 1.25;
          Bs.setView([0, 5], [0, top]);
          vals.forEach((val, i) => { Bs.bars([val], { x0: i + 1, color: ['accent', 'orange', 'green', 'purple'][i] }); Bs.tex(['V_A', 'V_B', 'V_A{+}V_B', 'V_{A+B}'][i], i + 1, val, { dy: -14, align: 'center', size: 14 }); });
          st = { corr, corrAbs, va, vb, vs, se: 1 / Math.sqrt(NP) };
        });
        v.readout(() => st && `Empirical correlation of $A,B$: $${fr(st.corr, 3)}$ (noise level $\\pm${fr(2 * st.se, 3)}$). Correlation of $|A|,|B|$: $${fr(st.corrAbs, 3)}$.\n$\\mathrm{Var}A+\\mathrm{Var}B=${fr(st.va + st.vb, 3)}$ against $\\mathrm{Var}(A+B)=${fr(st.vs, 3)}$.`);
      },
    },
    // ======================================================================== 4.4.8
    {
      num: '4.4.8',
      kind: 'Theorem',
      name: 'Conditional variance formula',
      statement: String.raw`Let $X_n$ be a square-integrable martingale and $m\le n$. Then
$$E\big[(X_n-X_m)^2\mid\mathcal F_m\big]=E\big[X_n^2\mid\mathcal F_m\big]-X_m^2 .$$
The conditional variance of the future increment is the conditional growth of the second moment; summing one-step conditional variances gives it, $=\sum_{k=m+1}^nE\big[(X_k-X_{k-1})^2\mid\mathcal F_m\big]$.`,
      idea: String.raw`Expand $(X_n-X_m)^2=X_n^2-2X_nX_m+X_m^2$ and take $E(\cdot\mid\mathcal F_m)$. Since $X_m$ is $\mathcal F_m$-measurable, taking it out (4.1.14) gives $E(X_nX_m\mid\mathcal F_m)=X_mE(X_n\mid\mathcal F_m)=X_m^2$ by the martingale property, leaving $E(X_n^2\mid\mathcal F_m)-X_m^2$. The sum form is the orthogonality of increments (4.4.7) applied conditionally.`,
      caption: String.raw`A martingale whose step is $\pm h(X_{n-1})$: either $h\equiv1$ (random walk) or $h(x)=\min(4,1+\lfloor|x|/4\rfloor)$ (steps grow with distance from $0$, so the conditional variance depends on where the path stands). The blue path is drawn up to time $m$ (slider) and then 60 of 2000 simulated continuations to time $n=m+L$ are drawn in gray from the point $X_m$. Right: three numbers for the same $X_m$: the average of $(X_n-X_m)^2$ over the continuations, the average of $X_n^2$ minus $X_m^2$, and the exact conditional variance computed by dynamic programming on the integer lattice. They agree up to sampling noise (about $\pm2\%$ for 2000 samples).`,
      deps: ['prob-4.4.7'],
      tags: ['martingales', 'variance'],
      viz(v) {
        const mod = v.select('step size', [{ value: 'const', label: '$h\\equiv1$' }, { value: 'grow', label: '$h$ grows with $|x|$' }], 'grow');
        const mS = v.slider('time $m$', 0, 40, 20, { int: true });
        const LS = v.slider('horizon $L=n-m$', 1, 30, 15, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NC = 2000;
        const hf = (kind, x) => (kind === 'const' ? 1 : Math.min(4, 1 + Math.floor(Math.abs(x) / 4)));
        const P = v.stage({ x: [0, 60], y: [-30, 30], axes: 'box', gutter: true, height: 340, xlabel: 'time', title: 'path to time $m$ and continuations', weight: 1.35 });
        const Bs = v.stage({ x: [0, 4], y: [0, 100], axes: 'box', gutter: true, height: 340, xticks: [], title: 'conditional variance at $X_m$', weight: 0.9 });
        function exact(kind, x0, L) {
          let dist = new Map([[x0, 1]]), tot = 0;
          for (let k = 0; k < L; k++) {
            const next = new Map();
            for (const [x, p] of dist) { const h = hf(kind, x); tot += p * h * h; next.set(x + h, (next.get(x + h) || 0) + p / 2); next.set(x - h, (next.get(x - h) || 0) + p / 2); }
            dist = next;
          }
          return tot;
        }
        let st = null;
        v.render(() => {
          const m = mS.value, L = LS.value, kind = mod.value, r = v.rng(seed * 61 + 3);
          const X = [0]; for (let n = 1; n <= m; n++) { const h = hf(kind, X[n - 1]); X.push(X[n - 1] + (r() < 0.5 ? h : -h)); }
          const xm = X[m], conts = [];
          let s1 = 0, s2 = 0, mean = 0;
          for (let i = 0; i < NC; i++) {
            let x = xm; const path = i < 60 ? [[m, x]] : null;
            for (let k = 1; k <= L; k++) { const h = hf(kind, x); x += r() < 0.5 ? h : -h; if (path) path.push([m + k, x]); }
            if (path) conts.push(path);
            s1 += (x - xm) ** 2 / NC; s2 += x * x / NC; mean += x / NC;
          }
          const ex = exact(kind, xm, L);
          const ext = Math.max(10, ...X.map(Math.abs), ...conts.map((p) => Math.max(...p.map((q) => Math.abs(q[1]))))) * 1.1;
          P.setView([0, m + L + 1], [-ext, ext]);
          conts.forEach((p) => P.path(p, { color: 'muted', width: 1, alpha: 0.4 }));
          P.path(X.map((x, n) => [n, x]), { color: 'accent', width: 2.2 });
          P.dot(m, xm, { r: 6, color: 'gold', label: '$X_m$', labelPos: 'nw' });
          P.vline(m + L, { color: 'faint', dash: [4, 4] });
          const vals = [s1, s2 - xm * xm, ex], top = Math.max(1, ...vals) * 1.3;
          Bs.setView([0, 4], [0, top]);
          vals.forEach((val, i) => { Bs.bars([val], { x0: i + 1, color: ['accent', 'orange', 'green'][i] }); Bs.tex(['\\overline{(X_n-X_m)^2}', '\\overline{X_n^2}-X_m^2', '\\text{exact}'][i], i + 1, val, { dy: -14, align: 'center', size: 12 }); });
          st = { xm, s1, s2: s2 - xm * xm, ex, mean, m, L };
        });
        v.legend([['accent', 'path up to $m$'], ['muted', 'continuations']]);
        v.readout(() => st && `$X_m=${st.xm}$. Averages over 2000 continuations of $L=${st.L}$ steps: $(X_n-X_m)^2\\to${fr(st.s1, 2)}$, $X_n^2-X_m^2\\to${fr(st.s2, 2)}$; exact conditional variance $${fr(st.ex, 2)}$.\nConditional mean of $X_n$: $${fr(st.mean, 2)}$ (the martingale property says $X_m=${st.xm}$).`);
      },
    },
    // ======================================================================== 4.5.1a
    {
      num: '4.5.1a',
      kind: 'Definition',
      name: 'Increasing process of a square-integrable martingale',
      statement: String.raw`Let $X_n$ be a martingale with $EX_n^2<\infty$. Then $X_n^2$ is a submartingale, and Doob's decomposition (4.3.2) writes it uniquely as $X_n^2=M_n+A_n$ with $M_n$ a martingale and $A_n$ a predictable increasing process, $A_0=0$. This $A_n$ is the **increasing process** of $X$ (often written $\langle X\rangle_n$):
$$A_n=\sum_{m=1}^nE\big[(X_m-X_{m-1})^2\mid\mathcal F_{m-1}\big],\qquad A_\infty=\lim_nA_n\in[0,\infty].$$
It records the total conditional variance of the steps; $E X_n^2=EX_0^2+EA_n$.`,
      idea: String.raw`Since $X$ is a martingale, $E(X_m^2-X_{m-1}^2\mid\mathcal F_{m-1})=E((X_m-X_{m-1})^2\mid\mathcal F_{m-1})$ (the cross term vanishes as in 4.4.8), so the compensator of $X^2$ from 4.3.2 is the sum of the conditional step variances. It is predictable because each term is $\mathcal F_{m-1}$-measurable. It measures accumulated conditional variance; no Brownian representation is asserted for an arbitrary discrete martingale.`,
      caption: String.raw`Choose the step-size rule (the sign of each step is fair, its size $\sigma_n$ is allowed to depend on the past). For the coin schedule, the coin is revealed initially and is included in $\mathcal F_0$, so the sizes are predictable. Left: one path with the band $\pm\sqrt{A_n}$ ($A_n$ being the quantity that sets how far the path typically wanders). Middle: its increasing process $A_n$ (orange curve; for adaptive sizes it is random but known one step ahead) and the average of $A_n$ over 600 paths (dashed). Right: $X_n^2-A_n$ for the same path, with the average over 600 paths (dashed) which estimates $0$ with sampling error: the compensated square is a martingale. The readout compares $EX_n^2$ with $EA_n$.`,
      deps: ['prob-4.3.2'],
      tags: ['martingales', 'quadratic variation'],
      refs: ['Durrett, fifth edition, unnumbered definition at the start of §4.5, p. 240; the displayed identity also permits nonzero square-integrable X₀.'],
      links: { source: 'https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=248' },
      viz(v) {
        const sch = v.select('step sizes', SCHED_OPTS, 'adapt');
        const nS = v.slider('$n$', 20, 400, 200, { int: true });
        let seed = 1; v.button('New path', () => { seed++; });
        const NP = 600;
        const X = v.stage({ x: [0, 400], y: [-10, 10], axes: 'box', gutter: true, height: 300, xlabel: '$n$', title: '$X_n$ and $\\pm\\sqrt{A_n}$' });
        const Aa = v.stage({ x: [0, 400], y: [0, 10], axes: 'box', gutter: true, height: 300, xlabel: '$n$', title: '$A_n$' });
        const Ms = v.stage({ x: [0, 400], y: [-10, 10], axes: 'box', gutter: true, height: 300, xlabel: '$n$', title: '$X_n^2-A_n$' });
        let cache = null, st = null;
        v.render(() => {
          const n = nS.value, key = `${sch.value}|${n}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(777 + sch.value.length), mA = new Float64Array(n + 1), mM = new Float64Array(n + 1), mX2 = new Float64Array(n + 1), sdM = new Float64Array(n + 1), acc = [];
            for (let i = 0; i < NP; i++) {
              const { X: x, A: a } = martPath(r, n, sch.value);
              for (let k = 0; k <= n; k++) { const m = x[k] * x[k] - a[k]; mA[k] += a[k] / NP; mM[k] += m / NP; mX2[k] += x[k] * x[k] / NP; if (k === n) acc.push(m); }
            }
            cache = { key, mA, mM, mX2, seM: seOf(Float64Array.from(acc)) };
          }
          const { X: x, A: a } = martPath(v.rng(seed * 13 + 5), n, sch.value);
          const xs = Array.from(x), env = Array.from(a, (q) => Math.sqrt(q)), ext = Math.max(2, ...xs.map(Math.abs),...env) * 1.15;
          X.setView([0, n], [-ext, ext]); X.hline(0, { color: 'grid' });
          X.path(env.map((e, k) => [k, e]), { color: 'orange', width: 1.2, dash: [5, 4] }); X.path(env.map((e, k) => [k, -e]), { color: 'orange', width: 1.2, dash: [5, 4] });
          X.path(pts(x), { color: 'accent', width: 1.8 });
          Aa.setView([0, n], [0, Math.max(1, ...a, ...cache.mA) * 1.15]);
          Aa.path(pts(a), { color: 'orange', width: 2 }); Aa.path(pts(cache.mA), { color: 'muted', width: 1.4, dash: [5, 4] });
          const mm = Array.from(x, (q, k) => q * q - a[k]), mx = Math.max(2, ...mm.map(Math.abs),...cache.mM.map(Math.abs)) * 1.15;
          Ms.setView([0, n], [-mx, mx]); Ms.hline(0, { color: 'grid' });
          Ms.path(pts(mm), { color: 'green', width: 1.6 }); Ms.path(pts(cache.mM), { color: 'muted', width: 1.6, dash: [5, 4] });
          st = { n, ex2: cache.mX2[n], ea: cache.mA[n], emn: cache.mM[n], se: cache.seM, an: a[n] };
        });
        v.legend([['accent', 'path'], ['orange', '$A_n$, $\\pm\\sqrt{A_n}$'], ['muted', 'average of 600 paths', { dash: [5, 4] }]]);
        v.readout(() => st && `$n=${st.n}$: $A_n=${fr(st.an, 2)}$ for this path. Over 600 paths $EX_n^2\\approx${fr(st.ex2, 2)}$ and $EA_n\\approx${fr(st.ea, 2)}$, so $E(X_n^2-A_n)\\approx${fr(st.emn, 3)}\\pm${fr(2 * st.se, 3)}$ (should be $0$).`);
      },
    },
    // ======================================================================== 4.5.1
    {
      num: '4.5.1',
      kind: 'Theorem',
      name: 'E sup|Xₘ|² ≤ 4EA∞',
      statement: String.raw`Let $X_n$ be a square-integrable martingale with $X_0=0$ and increasing process $A_n$. Then
$$E\Big(\sup_{m\ge0}X_m^2\Big)\le4\,EA_\infty .$$
(So $\sup_m|X_m|$ is in $L^2$ whenever $EA_\infty<\infty$.)`,
      idea: String.raw`Apply Doob's $L^p$ maximal inequality (4.4.4 with $p=2$, constant $(2/1)^2=4$) to the nonnegative submartingale $|X_m|$: $E\max_{m\le n}X_m^2\le4EX_n^2$. By the definition of the increasing process (4.5.1a), $EX_n^2=EA_n$. Let $n\to\infty$ and use monotone convergence on both sides.`,
      caption: String.raw`Left: for the chosen step-size rule, Monte Carlo estimates (4000 paths) of $E\max_{m\le n}X_m^2$ (blue) and $4EA_n$ (orange) as functions of the horizon $n$, with $EX_n^2=EA_n$ (green) underneath; the blue curve is squeezed between the green and orange. Right: the ratio $E\max X_m^2/EA_n$ at the horizon $n$ you choose, for all four schedules, between the lines $1$ (green) and $4$ (orange, Doob's constant). Every schedule stays well under $4$ at these horizons.`,
      deps: ['prob-4.4.4', 'prob-4.5.1a'],
      tags: ['martingales', 'maximal inequalities'],
      viz(v) {
        const sch = v.select('step sizes', SCHED_OPTS, 'const');
        const nS = v.slider('horizon $n$', 20, 400, 200, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NP = 4000;
        const L = v.stage({ x: [0, 400], y: [0, 10], axes: 'box', gutter: true, height: 320, xlabel: 'horizon $n$', title: 'moments against the horizon', weight: 1.25 });
        const Bs = v.stage({ x: [0, 13], y: [0, 10], axes: 'box', gutter: true, height: 320, xticks: [], title: '$E\\max X_m^2\\,/\\,EA_n$ for the four schedules', weight: 1.1 });
        const KINDS = ['const', 'poly', 'adapt', 'coin'];
        let cache = null, st = null;
        v.render(() => {
          const key = `${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 29 + 1), N = 400, out = {};
            for (const kind of KINDS) {
              const sup = new Float64Array(N + 1), ea = new Float64Array(N + 1), ex2 = new Float64Array(N + 1);
              for (let i = 0; i < NP; i++) {
                const { X, A } = martPath(r, N, kind); let mx = 0;
                for (let k = 0; k <= N; k++) { mx = Math.max(mx, X[k] * X[k]); sup[k] += mx / NP; ea[k] += A[k] / NP; ex2[k] += X[k] * X[k] / NP; }
              }
              out[kind] = { sup, ea, ex2 };
            }
            cache = { key, out };
          }
          const n = nS.value, o = cache.out[sch.value];
          L.setView([0, n], [0, Math.max(0.5, 4 * o.ea[n]) * 1.1]);
          L.path(pts(o.ea.subarray(0, n + 1).map((x) => 4 * x), 2), { color: 'orange', width: 2.2 });
          L.path(pts(o.sup.subarray(0, n + 1), 2), { color: 'accent', width: 2.4 });
          L.path(pts(o.ex2.subarray(0, n + 1), 2), { color: 'green', width: 1.8 });
          Bs.setView([0, 13], [0, 4.6]);
          Bs.hline(4, { color: 'orange', width: 2, dash: [6, 4] }); Bs.hline(1, { color: 'green', width: 1.6, dash: [6, 4] });
          KINDS.forEach((k, j) => {
            const c = cache.out[k], rr = c.sup[n] / c.ea[n], x0 = 1 + 3 * j;
            Bs.bars([rr], { x0: x0 + 0.5, color: 'accent' });
            Bs.tex(['\\sigma{=}1', 'n^{-3/4}', '\\tfrac1{1+|X|}', '\\text{coin}'][j], x0 + 0.5, 0, { dy: 14, align: 'center', size: 12 });
          });
          st = { n, sup: o.sup[n], ea: o.ea[n], ex2: o.ex2[n] };
        });
        v.legend([['accent', '$E\\max_{m\\le n}X_m^2$'], ['orange', '$4EA_n$'], ['green', '$EX_n^2=EA_n$']]);
        v.readout(() => st && `$n=${st.n}$: $E\\max X_m^2=${fr(st.sup, 2)}$, $EX_n^2=${fr(st.ex2, 2)}$, $EA_n=${fr(st.ea, 2)}$, $4EA_n=${fr(4 * st.ea, 2)}$. The ratio $E\\max X_m^2\\,/\\,EA_n$ is $${fr(st.sup / st.ea, 2)}\\le4$.`);
      },
    },
    // ======================================================================== 4.5.2
    {
      num: '4.5.2',
      kind: 'Theorem',
      name: 'Martingales converge where A∞ < ∞',
      statement: String.raw`Let $X_n$ be a square-integrable martingale with increasing process $A_n$. Then almost surely on the event $\{A_\infty<\infty\}$ the limit $\lim_nX_n$ exists and is finite. (On $\{A_\infty=\infty\}$ the theorem says nothing: the path may or may not converge.)`,
      idea: String.raw`The process $A$ is predictable, so for each constant $c$ the time $\tau_c=\inf\{n:A_{n+1}>c\}$ is a stopping time. The stopped process $X_{n\wedge\tau_c}$ is again a martingale (4.2.9) with increasing process $A_{n\wedge\tau_c}\le c$, so by 4.5.1 it is bounded in $L^2$ and converges a.s. (4.2.11). On $\{A_\infty\le c\}$ we have $\tau_c=\infty$, so $X$ itself converges there. Take a union over integers $c$.`,
      caption: String.raw`Each path is a fair $\pm$ walk with step size $\sigma_n$ chosen from the past. Rules: $\sigma_n=1$ (so $A_n=n\to\infty$); "coin" (a coin tossed at time $0$ picks $\sigma_n=1/n$, whose $A_\infty<\infty$, or $\sigma_n=n^{-0.4}$, whose $A_\infty=\infty$); "band" (small steps $1/n$ while $|X|<1$, large steps $n^{-0.4}$ otherwise: the path freezes when it falls into the band). Paths are green when $A$ has stopped growing (its increase over the second half of $5000$ steps is $<0.1$) and red when it is still growing. Right: for 300 paths, the increase of $A$ in the second half against the range $R$ of $X$ over that half. Every path with a (nearly) finished $A$ has $R\approx0$: it has converged.`,
      deps: ['prob-4.5.1', 'prob-4.2.9'],
      tags: ['martingales', 'convergence'],
      viz(v) {
        const sch = v.select('step sizes', [{ value: 'const', label: '$\\sigma_n=1$' }, { value: 'coin', label: 'initial coin: $1/n$ or $n^{-0.4}$' }, { value: 'band', label: 'band: freeze near $0$' }], 'band');
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 5000, NP = 300, H = N >> 1;
        const P = v.stage({ x: [0, N], y: [-12, 12], axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: 'paths $X_n$', weight: 1.3 });
        const Q = v.stage({ x: [0, 12], y: [0, 14], axes: 'box', gutter: true, height: 320, xlabel: 'increase of $A$ over $n\\ge2500$', ylabel: 'range $R$ of $X$ over $n\\ge2500$', title: 'finite $A$ means convergence' });
        let cache = null, st = null;
        v.render(() => {
          const key = `${sch.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 83 + sch.value.length * 5), paths = [], dA = [], R = [];
            for (let i = 0; i < NP; i++) {
              const { X, A } = martPath(r, N, sch.value); let lo = Infinity, hi = -Infinity;
              for (let n = H; n <= N; n++) { lo = Math.min(lo, X[n]); hi = Math.max(hi, X[n]); }
              dA.push(A[N] - A[H]); R.push(hi - lo); if (i < 30) paths.push({ X, fin: A[N] - A[H] < 0.1 });
            }
            cache = { key, paths, dA, R };
          }
          const { paths, dA, R } = cache, ext = Math.max(4, ...paths.map((p) => Math.max(...p.X.map(Math.abs)))) * 1.1;
          P.setView([0, N], [-ext, ext]); P.vline(H, { color: 'faint', dash: [4, 4] });
          paths.forEach((p) => P.path(pts(p.X, 10), { color: p.fin ? 'green' : 'red', width: 1.1, alpha: 0.65 }));
          const xm = Math.max(1, ...dA.map((d) => Math.min(d, 12))), ym = Math.max(2, ...R) * 1.1; Q.setView([0, 12], [0, Math.min(ym, 40)]);
          Q.vline(0.1, { color: 'green', dash: [4, 4] });
          Q.dots(dA.map((d, i) => [Math.min(d, 11.8), R[i]]), { r: 3, color: 'accent', alpha: 0.5 }); void xm;
          const fin = dA.map((d, i) => [d, R[i]]).filter(([d]) => d < 0.1), inf = dA.filter((d) => d >= 0.1).length;
          st = { nf: fin.length, ni: inf, maxR: fin.length ? Math.max(...fin.map((q) => q[1])) : NaN, medR: inf ? v.M.median(dA.map((d, i) => [d, R[i]]).filter(([d]) => d >= 0.1).map((q) => q[1])) : NaN };
        });
        v.legend([['green', '$A$ finished'], ['red', '$A$ still growing']]);
        v.readout(() => st && `Of 300 paths, **${st.nf}** have an (essentially) finite $A_\\infty$; the largest range $R$ among them is $${isNaN(st.maxR) ? '—' : fr(st.maxR, 3)}$ (they have converged).\n**${st.ni}** still have a growing $A$; their median range is $${isNaN(st.medR) ? '—' : fr(st.medR, 2)}$ (they are still moving).`);
      },
    },
    // ======================================================================== 4.5.3
    {
      num: '4.5.3',
      kind: 'Theorem',
      name: 'Strong law for martingales: Xₙ/f(Aₙ) → 0',
      statement: String.raw`Let $X_n$ be a square-integrable martingale with increasing process $A_n$, and let $f:[0,\infty)\to[1,\infty)$ be increasing with $\int_0^\infty f(t)^{-2}\,dt<\infty$. Then
$$\frac{X_n}{f(A_n)}\to0\quad\text{almost surely on }\{A_\infty=\infty\}.$$
For instance $f(t)=\sqrt{1+t}\,\big(\log(e+t)\big)^{(1+\varepsilon)/2}$ for any $\varepsilon>0$.`,
      idea: String.raw`Consider $Y_n=\sum_{m\le n}(X_m-X_{m-1})/f(A_m)$. Since $f(A_m)$ is predictable, $Y$ is a martingale (4.2.8), and its increasing process is $\sum_m(A_m-A_{m-1})/f(A_m)^2\le\int_0^{A_\infty}f^{-2}<\infty$. So $Y$ converges a.s. by 4.5.2. Kronecker's lemma (2.5.9) with the increasing sequence $f(A_n)\uparrow\infty$ converts the convergent series $\sum(\Delta X_m)/f(A_m)$ into $X_n/f(A_n)\to0$.`,
      caption: String.raw`The martingale has fair signs and step sizes $\sigma_n=n^{-\gamma}$, so $A_n\to\infty$ for $\gamma<\tfrac12$ (or $\sigma_n=1/(1+|X_{n-1}|)$). 25 paths up to $n=200000$ on a log time axis. Left: $X_n/f(A_n)$ with $f(t)=\sqrt{1+t}\,\log(e+t)^{(1+\varepsilon)/2}$: it tends to $0$ (slowly: by a power of $\log$). Right: the same paths divided only by $\sqrt{A_n}$, the natural scale; this ratio keeps fluctuating at order $1$ and does not tend to $0$, which is why a logarithmic correction in $f$ is needed. Drag $\varepsilon$ to see the rate change; the readout reports the largest $|{\cdot}|$ over the last decade.`,
      deps: ['prob-4.2.8', 'prob-4.5.2', 'prob-2.5.9'],
      tags: ['martingales', 'law of large numbers'],
      viz(v) {
        const sch = v.select('step sizes', [{ value: 'poly', label: '$\\sigma_n=n^{-\\gamma}$' }, { value: 'adapt', label: '$\\frac1{1+|X_{n-1}|}$' }], 'poly');
        const gS = v.slider('$\\gamma$', 0.05, 0.45, 0.25, { step: 0.01 });
        const eS = v.slider('$\\varepsilon$', 0.1, 2, 1, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 200000, NPA = 25;
        const CK = Array.from({ length: 121 }, (_, i) => Math.max(1, Math.round(Math.exp((Math.log(N) * i) / 120)))).filter((x, i, a) => i === 0 || x !== a[i - 1]);
        const L = v.stage({ x: [10, N], y: [-1, 1], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$X_n/f(A_n)$' });
        const R = v.stage({ x: [10, N], y: [-3, 3], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$X_n/\\sqrt{A_n}$' });
        let cache = null, st = null;
        v.render(() => {
          const g = gS.value, key = `${sch.value}|${g}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 47 + 11), P = [];
            for (let i = 0; i < NPA; i++) {
              let x = 0, a = 0; const xs = [], as = []; let j = 0;
              for (let n = 1; n <= N; n++) {
                const s = sch.value === 'poly' ? n ** -g : 1 / (1 + Math.abs(x));
                x += r() < 0.5 ? s : -s; a += s * s;
                if (n === CK[j]) { xs.push(x); as.push(a); j++; }
              }
              P.push({ xs, as });
            }
            cache = { key, P };
          }
          const eps = eS.value, f = (t) => Math.sqrt(1 + t) * Math.log(Math.E + t) ** ((1 + eps) / 2);
          let m1 = 0, m2 = 0, mA = 0;
          const keep = CK.map((c) => c >= 10);
          cache.P.forEach((p) => {
            const a = CK.map((c, j) => [c, p.xs[j] / f(p.as[j])]).filter((_, j) => keep[j]), b = CK.map((c, j) => [c, p.xs[j] / Math.sqrt(p.as[j])]).filter((_, j) => keep[j]);
            L.path(a, { color: 'accent', width: 1.1, alpha: 0.55 }); R.path(b, { color: 'orange', width: 1.1, alpha: 0.55 });
            CK.forEach((c, j) => { if (c >= N / 10) { m1 = Math.max(m1, Math.abs(p.xs[j] / f(p.as[j]))); m2 = Math.max(m2, Math.abs(p.xs[j] / Math.sqrt(p.as[j]))); } });
            mA += p.as[p.as.length - 1] / NPA;
          });
          L.hline(0, { color: 'grid' }); R.hline(0, { color: 'grid' });
          L.setView([10, N], [-Math.max(0.3, m1) * 1.4, Math.max(0.3, m1) * 1.4]); R.setView([10, N], [-Math.max(1.5, m2) * 1.2, Math.max(1.5, m2) * 1.2]);
          st = { m1, m2, mA };
        });
        v.readout(() => st && `Mean $A_{200000}=${fr(st.mA, 1)}$. On the last decade ($n\\ge20000$): $\\max|X_n/f(A_n)|=${fr(st.m1, 3)}$, while $\\max|X_n/\\sqrt{A_n}|=${fr(st.m2, 2)}$.`);
      },
    },
    // ======================================================================== 4.5.5
    {
      num: '4.5.5',
      kind: 'Theorem',
      name: 'Conditional Borel–Cantelli with rates',
      statement: String.raw`Let $B_n\in\mathcal F_n$, $N_n=\sum_{m\le n}1_{B_m}$ and $S_n=\sum_{m\le n}P(B_m\mid\mathcal F_{m-1})$. Then almost surely on $\{S_\infty=\infty\}$
$$\frac{N_n}{S_n}\to1,\qquad\text{indeed}\quad\frac{N_n-S_n}{f(S_n)}\to0$$
for every increasing $f\ge1$ with $\int_0^\infty f^{-2}<\infty$.`,
      idea: String.raw`$M_n=N_n-S_n$ is a martingale (4.3.4) whose increasing process is $A_n=\sum_mP(B_m\mid\mathcal F_{m-1})(1-P(B_m\mid\mathcal F_{m-1}))\le S_n$. On $\{A_\infty=\infty\}$, 4.5.3 gives $M_n/f(A_n)\to0$ and $f(A_n)\le f(S_n)$ since $f$ increases. On $\{A_\infty<\infty\}$, $M_n$ converges (4.5.2) while $f(S_n)\to\infty$. Either way $(N_n-S_n)/f(S_n)\to0$; taking $f(t)=\sqrt t\,\log^{1+\varepsilon}\!t$ gives $N_n/S_n\to1$.`,
      caption: String.raw`Events with conditional probability $q_n=\min(0.9,(n+1)^{-\alpha}(1+N_{n-1}))$ ("self-exciting": each past occurrence raises the chance of the next) or $q_n=(n+1)^{-\alpha}$ (independent), set by $\alpha$. Left: the ratio $N_n/S_n$ for 40 paths on a log time axis; where $S_\infty=\infty$ ($\alpha<1$ for independent events) every path is pulled to $1$. Right: histogram of $N_n/S_n$ at $n=20000$ over 200 paths. Raise $\alpha$ above $1$: $S_\infty<\infty$, the ratio no longer settles near $1$ (no conclusion is claimed there) and the spread widens.`,
      deps: ['prob-4.5.2', 'prob-4.5.3'],
      tags: ['borel-cantelli', 'martingales'],
      viz(v) {
        const mode = v.select('events', [{ value: 'ind', label: 'independent' }, { value: 'exc', label: 'self-exciting' }], 'exc');
        const aS = v.slider('exponent $\\alpha$', 0.3, 1.6, 0.8, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const T = 20000, NP = 200;
        const CK = Array.from({ length: 101 }, (_, i) => Math.max(1, Math.round(Math.exp((Math.log(T) * i) / 100)))).filter((x, i, a) => i === 0 || x !== a[i - 1]);
        const L = v.stage({ x: [1, T], y: [0, 3], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$N_n/S_n$', weight: 1.3 });
        const R = v.stage({ x: [0, 3], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: '$N_n/S_n$ at $n=20000$', ylabel: 'fraction of paths', title: 'spread at the horizon' });
        let cache = null, st = null;
        v.render(() => {
          const al = aS.value, key = `${mode.value}|${al}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 59 + 1), paths = [], fin = [], Sfin = [];
            for (let i = 0; i < NP; i++) {
              let N = 0, S = 0, j = 0; const pr = [];
              for (let n = 1; n <= T; n++) {
                const base = (n + 1) ** -al, q = mode.value === 'ind' ? base : Math.min(0.9, base * (1 + N));
                if (r() < q) N++; S += q;
                if (n === CK[j]) { if (i < 40) pr.push([n, N / S]); j++; }
              }
              if (i < 40) paths.push(pr); fin.push(N / S); Sfin.push(S);
            }
            cache = { key, paths, fin, Sfin };
          }
          L.hline(1, { color: 'green', dash: [5, 4] });
          cache.paths.forEach((p) => L.path(p, { color: 'accent', width: 1, alpha: 0.5 }));
          const h = v.M.histogram(cache.fin.filter((x) => x < 3), { bins: 30, range: [0, 3] });
          R.setView([0, 3], [0, Math.max(0.1, ...h.counts.map((c) => c / NP)) * 1.2]);
          R.hist({ edges: h.edges, counts: h.counts.map((c) => c / NP) }, { color: 'accent', fillAlpha: 0.35 }); R.vline(1, { color: 'green', dash: [5, 4] });
          const near = cache.fin.filter((x) => Math.abs(x - 1) < 0.1).length / NP;
          st = { near, medS: v.M.median(cache.Sfin), spread: Math.sqrt(v.M.variance(cache.fin)) };
        });
        v.legend([['accent', '$N_n/S_n$ paths'], ['green', 'limit $1$', { dash: [5, 4] }]]);
        v.readout(() => st && `Median $S_n$ at the horizon: $${fr(st.medS, 1)}$. A share of **${fr(100 * st.near, 0)}%** of the paths has $|N_n/S_n-1|<0.1$; standard deviation of the ratio $${fr(st.spread, 3)}$.`);
      },
    },
    // ======================================================================== 4.5.7
    {
      num: '4.5.7',
      kind: 'Theorem',
      name: 'E sup|Xₙ| ≤ 3E A∞^{1/2}',
      statement: String.raw`Let $X_n$ be a square-integrable martingale with $X_0=0$ and increasing process $A_n$. Then
$$E\Big(\sup_n|X_n|\Big)\le3\,E\big(A_\infty^{1/2}\big).$$
Only the first moment of $\sqrt{A_\infty}$ is needed, so this holds even when $EA_\infty=\infty$ and $E\sup X_n^2=\infty$ (4.5.1 says nothing there).`,
      idea: String.raw`For $c>0$ let $\tau=\inf\{n:A_{n+1}>c^2\}$. Then $\{\sup|X_n|\ge c\}\subseteq\{A_\infty>c^2\}\cup\{\sup_n|X_{n\wedge\tau}|\ge c\}$, and Doob's maximal inequality 4.4.2 for the submartingale $X_{n\wedge\tau}^2$ gives $P(\sup|X_{n\wedge\tau}|\ge c)\le E(A_\infty\wedge c^2)/c^2$. Integrate over $c$ using the tail formula (2.2.13): $\int_0^\infty P(A_\infty^{1/2}>c)\,dc=E\sqrt{A_\infty}$ and $\int_0^\infty E(A_\infty\wedge c^2)c^{-2}\,dc=2E\sqrt{A_\infty}$. Total $3E\sqrt{A_\infty}$.`,
      caption: String.raw`The step sizes are $\sigma_n=Y\,n^{-3/4}$ with a random scale $Y$ known at time $0$: a Pareto variable $P(Y>y)=y^{-\alpha}$, $y\ge1$. Then $A_{500}\approx2.5\,Y^2$ and $E\sqrt A\propto EY<\infty$ for $\alpha>1$ but $EA\propto EY^2=\infty$ for $\alpha\le2$. Left, log scale: running averages over 6000 paths of $\sup_{m\le500}|X_m|$ (blue), $3\sqrt{A_{500}}$ (orange) and $4A_{500}$ (red; the bound of 4.5.1 would be $E\sup X^2\le4EA$). For $\alpha\le2$ the red curve never settles, while blue stays below orange. Right: $\sup|X_m|$ against $\sqrt{A_{500}}$ for 400 paths (log-log) with the line of slope 1 times $3$.`,
      deps: ['prob-4.5.2', 'prob-4.4.2', 'prob-2.2.13'],
      tags: ['martingales', 'maximal inequalities'],
      scope: String.raw`Monte Carlo running averages of heavy-tailed variables are noisy and (for $\alpha$ near $1$) converge very slowly; the inequality is about expectations, not about the individual running averages.`,
      viz(v) {
        const aS = v.slider('tail index $\\alpha$', 1.2, 4, 1.7, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 500, NP = 6000;
        const CK = Array.from({ length: 61 }, (_, i) => Math.max(10, Math.round(Math.exp(Math.log(10) + (Math.log(NP / 10) * i) / 60)))).filter((x, i, a) => i === 0 || x !== a[i - 1]);
        const L = v.stage({ x: [10, NP], y: [0.5, 1e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'number of simulated paths', title: 'running averages', weight: 1.3 });
        const R = v.stage({ x: [1, 1e3], y: [1, 1e3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$\\sqrt{A_{500}}$', ylabel: '$\\sup|X_m|$', title: '400 paths' });
        let cache = null, st = null;
        v.render(() => {
          const al = aS.value, key = `${al}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 71 + 9), sup = new Float64Array(NP), sqA = new Float64Array(NP), aa = new Float64Array(NP);
            let base = 0; for (let n = 1; n <= N; n++) base += n ** -1.5;
            for (let i = 0; i < NP; i++) {
              const Y = (1 - r()) ** (-1 / al); let x = 0, mx = 0;
              for (let n = 1; n <= N; n++) { x += (r() < 0.5 ? 1 : -1) * Y * n ** -0.75; mx = Math.max(mx, Math.abs(x)); }
              sup[i] = mx; aa[i] = Y * Y * base; sqA[i] = Math.sqrt(aa[i]);
            }
            const run = (arr, mult) => { const out = []; let s = 0, j = 0; for (let i = 0; i < NP; i++) { s += arr[i]; if (i + 1 === CK[j]) { out.push([CK[j], (mult * s) / (i + 1)]); j++; } } return out; };
            cache = { key, a: run(sup, 1), b: run(sqA, 3), c: run(aa, 4), sup, sqA };
          }
          const { a, b, c } = cache;
          const hi = Math.max(10, ...a.map((q) => q[1]), ...b.map((q) => q[1])) * 30;
          L.setView([10, NP], [0.5, Math.min(1e6, Math.max(hi, ...c.map((q) => q[1])) * 1.5)]);
          L.path(c, { color: 'red', width: 2 }); L.path(b, { color: 'orange', width: 2.4 }); L.path(a, { color: 'accent', width: 2.4 });
          const pts2 = []; for (let i = 0; i < 400; i++) pts2.push([Math.max(1, cache.sqA[i]), Math.max(1, cache.sup[i])]);
          R.dots(pts2, { r: 2.6, color: 'accent', alpha: 0.4 }); R.line(1, 3, 1e3, 3e3, { color: 'orange', dash: [5, 4] });
          st = { sup: a[a.length - 1][1], bd: b[b.length - 1][1], ea: c[c.length - 1][1], al };
        });
        v.legend([['accent', '$\\overline{\\sup|X|}$'], ['orange', '$3\\,\\overline{\\sqrt A}$'], ['red', '$4\\,\\overline A$']]);
        v.readout(() => st && `After 6000 paths: $\\overline{\\sup|X|}=${fr(st.sup, 2)}\\ \\le\\ 3\\overline{\\sqrt A}=${fr(st.bd, 2)}$, while $4\\overline A=${sciT(st.ea, 2)}$. ${st.al <= 2 ? 'Here $EA=\\infty$: the red average is dominated by its largest few terms and keeps jumping upward.' : 'Here $EA<\\infty$ and the red average settles.'}`);
      },
    },
  ],
};
