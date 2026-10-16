// Probability: Theory and Examples (Durrett) — Chapter 4, part Z4: ballot theorem and arcsine laws for simple random walk (§4.9.2-4.9.6)
import { clampN, cornerIn, u2n, logChoose, srw, fr } from './ch04-z.shared.js';

const COLS = ['accent', 'orange', 'purple', 'teal', 'pink', 'blue', 'gold', 'green'];
const FLOOR = 1e-9;
const lg = (y) => Math.max(FLOOR, y);
/** Exact law of the last zero of the walk up to time 2n: P(L = 2k) = u_{2k} u_{2n-2k}, k = 0..n. */
const lastZeroLaw = (n) => Array.from({ length: n + 1 }, (_, k) => u2n(k) * u2n(n - k));
/** P(S_1 != 0, ..., S_{2n} != 0) by dynamic programming (exact up to rounding). */
function noReturn(maxn) {
  const out = [1];
  let dist = new Float64Array(2 * maxn + 3), off = maxn + 1; dist[off + 1] = 0.5; dist[off - 1] = 0.5;
  for (let t = 2; t <= 2 * maxn; t++) { const nx = new Float64Array(dist.length); for (let i = 1; i < dist.length - 1; i++) { const m = dist[i]; if (!m) continue; if (i + 1 !== off) nx[i + 1] += m / 2; if (i - 1 !== off) nx[i - 1] += m / 2; } dist = nx; if (t % 2 === 0) out.push(dist.reduce((a, b) => a + b, 0)); }
  return out;
}

export default {
  collection: 'prob',
  chapter: 4,
  items: [
    {
      num: '4.9.2',
      kind: 'Theorem',
      name: 'Ballot theorem',
      statement: String.raw`In an election candidate $A$ receives $\alpha$ votes and $B$ receives $\beta<\alpha$ votes. If the ballots are counted in uniformly random order, the probability that $A$ is *strictly* ahead of $B$ throughout the count is
$$\frac{\alpha-\beta}{\alpha+\beta}.$$
Equivalently, among all $\binom{\alpha+\beta}{\alpha}$ paths from $0$ to $\alpha-\beta$ with steps $\pm1$, exactly $\frac{\alpha-\beta}{\alpha+\beta}\binom{\alpha+\beta}{\alpha}$ stay positive after time $0$.`,
      idea: String.raw`Count the paths that start with an $A$-vote (they begin at $1$) and stay positive: all paths from $1$ to $\alpha-\beta$ in $\alpha+\beta-1$ steps, minus those that touch $0$. By the reflection principle (4.9.1) the touching ones are in bijection with all paths from $-1$ to $\alpha-\beta$, i.e. there are $\binom{\alpha+\beta-1}{\alpha-1}-\binom{\alpha+\beta-1}{\alpha}$ good paths. Dividing by $\binom{\alpha+\beta}{\alpha}$ simplifies to $(\alpha-\beta)/(\alpha+\beta)$.`,
      caption: String.raw`Sliders set $\alpha$ and $\beta$. Left: thirty seeded random orderings drawn as the lead $A-B$ against the number of ballots counted (green: $A$ ahead throughout; red: the lead touched $0$ or went negative). Right: the running fraction of green over 4000 random orderings (accent) tends to $(\alpha-\beta)/(\alpha+\beta)$ (red line). The readout also gives the exact count of good orderings from the reflection argument.`,
      credit: 'W. A. Whitworth, 1878; J. Bertrand and D. André, 1887',
      deps: ['prob-4.9.1'],
      see: ['comb-5.6'],
      tags: ['random walk', 'combinatorics'],
      viz(v) {
        const aS = v.slider('votes for $A$: $\\alpha$', 2, 40, 12, { int: true });
        const bS = v.slider('votes for $B$: $\\beta$', 0, 39, 8, { int: true });
        let seed = 1; v.button('Reshuffle', () => { seed++; });
        const L = v.stage({ x: [0, 52], y: [-12, 40], height: 320, weight: 1.15, axes: 'box', gutter: true, xlabel: 'ballots counted', title: 'lead of $A$ over $B$' });
        const R = v.stage({ x: [1, 4000], xlog: true, y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: 'number of orderings', title: 'fraction with $A$ always ahead' });
        let st = null;
        v.render(() => {
          const a = aS.value; let b = bS.value; if (b >= a) { b = a - 1; bS.set(b); }
          const n = a + b, r = v.rng(seed * 4423 + a * 97 + b), arr = new Int8Array(n); for (let i = 0; i < a; i++) arr[i] = 1; for (let i = a; i < n; i++) arr[i] = -1;
          const one = () => { for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } let s = 0, ok = true; const pts = [[0, 0]]; for (let i = 0; i < n; i++) { s += arr[i]; pts.push([i + 1, s]); if (s <= 0) ok = false; } return { ok, pts }; };
          L.setView([0, n], [Math.min(-3, -b - 1), a - b + Math.max(4, Math.round(a * 0.6))]); L.hline(0, { color: 'ink', width: 1.4 });
          for (let j = 0; j < 30; j++) { const t = one(); L.path(t.pts, { color: t.ok ? 'green' : 'red', width: 1.2, alpha: 0.65 }); }
          const pts = []; let good = 0, next = 1; for (let j = 1; j <= 4000; j++) { if (one().ok) good++; if (j >= next || j === 4000) { pts.push([j, good / j]); next = Math.max(next + 1, Math.ceil(next * 1.1)); } }
          const p = (a - b) / (a + b); R.hline(p, { color: 'red', width: 2.2 }); R.path(pts, { color: 'accent', width: 2.4 });
          const tot = Math.exp(logChoose(n, a));
          const goodExact = Math.exp(logChoose(n - 1, a - 1)) - Math.exp(logChoose(n - 1, a));
          st = { a, b, p, last: good / 4000, goodExact: Math.round(goodExact), tot: Math.round(tot) };
        });
        v.legend([['green', 'always ahead'], ['red', 'not always ahead'], ['red', '$(\\alpha-\\beta)/(\\alpha+\\beta)$']]);
        v.readout(() => st && `$\\alpha=${st.a}$, $\\beta=${st.b}$: formula $\\frac{${st.a - st.b}}{${st.a + st.b}}=${v.fix(st.p, 4)}$; simulated $${v.fix(st.last, 4)}$. Counting paths: $\\binom{${st.a + st.b - 1}}{${st.a - 1}}-\\binom{${st.a + st.b - 1}}{${st.a}}=${st.goodExact}$ good orderings out of $${st.tot}$.`);
      },
    },
    {
      num: '4.9.3',
      kind: 'Lemma',
      name: 'No return to 0 by 2n has probability P(S₂ₙ = 0)',
      statement: String.raw`For the symmetric simple random walk,
$$P(S_1\ne0,\,S_2\ne0,\dots,S_{2n}\ne0)=P(S_{2n}=0)=u_{2n}:=\binom{2n}{n}2^{-2n}.$$`,
      idea: String.raw`By symmetry the left side is $2P(S_1>0,\dots,S_{2n}>0)$. Decomposing by the value $S_{2n}=2k>0$ and using the ballot theorem (4.9.2) (or reflection, 4.9.1) the number of such paths is $\sum_k\frac{2k}{2n}\binom{2n}{n+k}$; the sum telescopes (since $\frac{2k}{2n}\binom{2n}{n+k}=\binom{2n-1}{n+k-1}-\binom{2n-1}{n+k}$) to $\binom{2n-1}{n}=\frac12\binom{2n}{n}$. Doubling gives $\binom{2n}{n}$ paths out of $2^{2n}$.`,
      caption: String.raw`Left (log–log): the probability of no return to $0$ by time $2n$, computed exactly by dynamic programming over all $4^n$ paths (accent) and the probability $P(S_{2n}=0)=\binom{2n}n4^{-n}$ (red, dashed): they coincide to rounding, and both decay like $1/\sqrt{\pi n}$ (grey). Dots: simulation with 20 000 seeded walks at the $n$ you choose. Right: ten sample walks of length $2n$; red ones returned to $0$, green ones never did.`,
      deps: ['prob-4.9.2'],
      tags: ['random walk', 'combinatorics'],
      viz(v) {
        const nS = v.slider('$n$', 1, 150, 20, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NM = 300, ex = noReturn(NM);
        const L = v.stage({ x: [1, NM], xlog: true, y: [0.02, 1], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'no return by $2n$' });
        const R = v.stage({ x: [0, 300], y: [-30, 30], height: 320, axes: 'box', gutter: true, xlabel: 'time $k$', title: 'walks of length $2n$' });
        let st = null;
        v.render(() => {
          const n = nS.value, r = v.rng(seed * 3331 + n);
          L.path(ex.slice(1).map((p, i) => [i + 1, p]), { color: 'accent', width: 3 });
          L.path(Array.from({ length: NM }, (_, i) => [i + 1, u2n(i + 1)]), { color: 'red', width: 1.8, dash: [7, 5] });
          L.fn((x) => 1 / Math.sqrt(Math.PI * x), { color: 'muted', width: 1, dash: [2, 4] });
          let none = 0; const K = 20000;
          for (let j = 0; j < K; j++) { let s = 0, ok = true; for (let i = 0; i < 2 * n; i++) { s += r() < 0.5 ? 1 : -1; if (s === 0) { ok = false; break; } } if (ok) none++; }
          L.dot(n, none / K, { color: 'gold', r: 6 }); L.vline(n, { color: 'gold', dash: true, width: 1 });
          R.setView([0, 2 * n], [-Math.max(6, Math.round(1.6 * Math.sqrt(2 * n) * 1.6)), Math.max(6, Math.round(1.6 * Math.sqrt(2 * n) * 1.6))]); R.hline(0, { color: 'ink', width: 1.4 });
          const r2 = v.rng(seed * 17 + n * 3);
          for (let j = 0; j < 10; j++) { const S = srw(r2, 2 * n); let ret = false; for (let i = 1; i <= 2 * n; i++) if (S[i] === 0) { ret = true; break; } R.path(Array.from(S, (s, i) => [i, s]), { color: ret ? 'red' : 'green', width: 1.3, alpha: 0.8 }); }
          st = { n, e: ex[n], u: u2n(n), sim: none / K };
        });
        v.legend([['accent', 'exact $P(\\text{no return by }2n)$'], ['red', '$u_{2n}=P(S_{2n}=0)$', { dash: true }], ['muted', '$1/\\sqrt{\\pi n}$', { dash: true }], ['gold', 'simulation']]);
        v.readout(() => st && `$n=${st.n}$: no-return probability $${v.fix(st.e, 5)}$ (DP) $=u_{2n}=${v.fix(st.u, 5)}$; simulated $${v.fix(st.sim, 4)}$.` + (st.n <= 10 ? ` Path count: $\\binom{${2 * st.n}}{${st.n}}=${Math.round(Math.exp(logChoose(2 * st.n, st.n)))}$ of $${4 ** st.n}$.` : ''));
      },
    },
    {
      num: '4.9.4',
      kind: 'Lemma',
      name: 'Distribution of the last zero: u₂ₖu₂ₙ₋₂ₖ',
      statement: String.raw`Let $L_{2n}=\max\{m\le2n: S_m=0\}$ be the last visit to $0$ by time $2n$ of the symmetric simple random walk. Then for $k=0,1,\dots,n$
$$P(L_{2n}=2k)=u_{2k}\,u_{2n-2k},\qquad u_{2j}=\binom{2j}{j}2^{-2j}.$$
The law is symmetric about $n$ and U-shaped: its largest values are at the two ends.`,
      idea: String.raw`$L_{2n}=2k$ means $S_{2k}=0$ and, after time $2k$, the walk makes $2n-2k$ steps without returning to $0$. The first event has probability $u_{2k}$; by the Markov property and the lemma 4.9.3 the second has probability $u_{2n-2k}$, and the two are independent. $u_{2j}\sim1/\sqrt{\pi j}$ is largest for $j$ near $0$, so the product is large at both ends.`,
      caption: String.raw`Left: five seeded walks of length $2n$ with the last zero marked by a gold dot (many are very early or very late, not in the middle). Right: the histogram of $L_{2n}/2$ over the number of simulated walks you pick, against the exact bars $u_{2k}u_{2n-2k}$ (red outlines): U-shaped and symmetric. Try $n=5$ and $n=100$: the U gets steeper as the walk gets longer.`,
      deps: ['prob-4.9.3'],
      tags: ['random walk', 'combinatorics'],
      viz(v) {
        const nS = v.slider('$n$ (walk length $2n$)', 3, 120, 25, { int: true });
        const kS = v.slider('simulated walks', 500, 40000, 8000, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0, 100], y: [-14, 14], height: 320, axes: 'box', gutter: true, xlabel: 'time $k$', title: 'five walks and their last zeros' });
        const B = v.stage({ x: [-0.5, 25.5], y: [0, 0.2], height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$k$ (last zero at $2k$)', title: 'law of the last zero' });
        let st = null;
        v.render(() => {
          const n = nS.value, K = kS.value, r = v.rng(seed * 2711 + n);
          A.setView([0, 2 * n], [-Math.max(5, Math.round(2.4 * Math.sqrt(2 * n))), Math.max(5, Math.round(2.4 * Math.sqrt(2 * n)))]); A.hline(0, { color: 'ink', width: 1.2 });
          for (let j = 0; j < 5; j++) { const S = srw(r, 2 * n); let last = 0; for (let i = 0; i <= 2 * n; i++) if (S[i] === 0) last = i; A.path(Array.from(S, (s, i) => [i, s]), { color: COLS[j], width: 1.4 }); A.dot(last, 0, { color: 'gold', r: 5 }); }
          const cnt = new Float64Array(n + 1), r2 = v.rng(seed * 91 + n);
          for (let j = 0; j < K; j++) { let s = 0, last = 0; for (let i = 1; i <= 2 * n; i++) { s += r2() < 0.5 ? 1 : -1; if (s === 0) last = i; } cnt[last / 2]++; }
          const law = lastZeroLaw(n), top = Math.max(...law) * 1.25;
          B.setView([-0.5, n + 0.5], [0, top]);
          let err = 0; for (let k = 0; k <= n; k++) { B.rect(k - 0.45, 0, k + 0.45, cnt[k] / K, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1 }); B.rect(k - 0.45, 0, k + 0.45, law[k], { fill: false, color: 'red', width: 1.6, stroke: true }); err = Math.max(err, Math.abs(cnt[k] / K - law[k])); }
          st = { n, err, ends: law[0] + law[n], mid: law[Math.floor(n / 2)] };
        });
        v.legend([['accent', 'simulation', { area: true }], ['red', '$u_{2k}u_{2n-2k}$'], ['gold', 'last zero']]);
        v.readout(() => st && `$n=${st.n}$: $P(L=0)=P(L=2n)=${v.fix(st.ends / 2, 4)}$ each, while the middle value is $${v.fix(st.mid, 4)}$. Largest gap between histogram and formula: $${v.fix(st.err, 4)}$.`);
      },
    },
    {
      num: '4.9.5',
      kind: 'Theorem',
      name: 'Arcsine law for the last visit to 0',
      statement: String.raw`For the symmetric simple random walk, the last visit to $0$ before time $2n$ satisfies, for every $0<a<b<1$,
$$P\Big(a\le\frac{L_{2n}}{2n}\le b\Big)\ \longrightarrow\ \int_a^b\frac{dx}{\pi\sqrt{x(1-x)}}=\frac2\pi\big(\arcsin\sqrt b-\arcsin\sqrt a\big).$$
The limit density $1/(\pi\sqrt{x(1-x)})$ is unbounded at both $0$ and $1$.`,
      idea: String.raw`By 4.9.4, $P(L_{2n}=2k)=u_{2k}u_{2n-2k}$, and the local limit for the simple walk (3.1.2, Stirling) gives $u_{2j}\sim1/\sqrt{\pi j}$. For $k=xn$ the product is $\sim\frac1{\pi n\sqrt{x(1-x)}}$, a Riemann sum for $\int dx/(\pi\sqrt{x(1-x)})$ with mesh $1/n$. The result is counter-intuitive: the walk is most likely to have last visited $0$ very early or very late, and the chance of $L_{2n}/2n$ lying in $(0.45,0.55)$ is only about $6\%$.`,
      caption: String.raw`Seeded simulation of the last zero of walks of length $2n$ ($n$ on the slider, 6000 walks). Left: the histogram of $L_{2n}/2n$ against the arcsine density (red); the dashed grey line is the uniform density a naive guess would suggest. Middle: the empirical distribution function (accent), the exact discrete one (gold) and $\frac2\pi\arcsin\sqrt x$ (red). Right: the exact Kolmogorov distance between the discrete law and the arcsine law for every $n$ up to 1000 (log–log), computed from $u_{2k}u_{2n-2k}$; the marker is your $n$. (It decays only like $n^{-1/2}$: the discrete law has an atom of size $P(L_{2n}=0)=u_{2n}\approx1/\sqrt{\pi n}$ at each end, and the arcsine law has none.)`,
      credit: 'P. Lévy, 1939 (Brownian motion); for random walks: P. Erdős & M. Kac, 1947; K. L. Chung & W. Feller, 1949',
      verify: true,
      deps: ['prob-4.9.4', 'prob-3.1.2'],
      see: ['stoch-2.12'],
      tags: ['random walk', 'arcsine law'],
      viz(v) {
        const nS = v.slider('$n$', 5, 1000, 100, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0, 1], y: [0, 3.5], height: 310, axes: 'box', gutter: true, xlabel: '$L_{2n}/2n$', title: 'density' });
        const B = v.stage({ x: [0, 1], y: [0, 1], height: 310, axes: 'box', gutter: true, xlabel: '$x$', title: 'distribution function' });
        const C = v.stage({ x: [5, 1000], xlog: true, y: [1e-4, 0.5], ylog: true, height: 310, axes: 'box', gutter: true, xlabel: '$n$', title: 'exact Kolmogorov distance' });
        const asin = (x) => (2 / Math.PI) * Math.asin(Math.sqrt(clampN(x, 0, 1)));
        const kd = (n) => { const law = lastZeroLaw(n); let c = 0, d = 0; for (let k = 0; k <= n; k++) { const x = k / n; d = Math.max(d, Math.abs(c - asin(x)), Math.abs(c + law[k] - asin(x))); c += law[k]; } return d; };
        let curve = null, st = null;
        v.render(() => {
          const n = nS.value, K = 6000, r = v.rng(seed * 7001 + n);
          const cnt = new Float64Array(n + 1);
          for (let j = 0; j < K; j++) { let s = 0, last = 0; for (let i = 1; i <= 2 * n; i++) { s += r() < 0.5 ? 1 : -1; if (s === 0) last = i; } cnt[last / 2]++; }
          const bins = 30, E = Array.from({ length: bins + 1 }, (_, i) => i / bins), h = new Float64Array(bins);
          for (let k = 0; k <= n; k++) h[Math.min(bins - 1, Math.floor((k / n) * bins))] += cnt[k];
          const dens = Array.from(h, (c) => (c / K) * bins);
          A.hist({ edges: E, counts: Array.from(h), density: dens }, { density: true, color: 'accent', fillAlpha: 0.3 });
          A.fn((x) => 1 / (Math.PI * Math.sqrt(x * (1 - x))), { color: 'red', width: 2.4, domain: [0.004, 0.996] });
          A.hline(1, { color: 'muted', dash: [4, 4], width: 1 });
          const law = lastZeroLaw(n), emp = [], exact = []; let ce = 0, cx = 0;
          for (let k = 0; k <= n; k++) { ce += cnt[k] / K; cx += law[k]; emp.push([k / n, ce]); exact.push([k / n, cx]); }
          B.fn(asin, { color: 'red', width: 2.6, domain: [0, 1] }); B.path(exact, { color: 'gold', width: 2 }); B.path(emp, { color: 'accent', width: 1.6 });
          if (!curve) { const ns = []; for (let m = 5; m <= 1000; m = Math.max(m + 1, Math.round(m * 1.12))) ns.push(m); curve = ns.map((m) => [m, kd(m)]); }
          C.path(curve, { color: 'accent', width: 2.4 }); C.dot(n, kd(n), { color: 'gold', r: 6 }); C.vline(n, { color: 'gold', dash: true, width: 1 });
          let mid = 0; for (let k = 0; k <= n; k++) if (k / n >= 0.45 && k / n <= 0.55) mid += law[k];
          let ends = 0; for (let k = 0; k <= n; k++) if (k / n < 0.1 || k / n > 0.9) ends += law[k];
          st = { n, d: kd(n), mid, ends, midA: asin(0.55) - asin(0.45), endsA: 2 * asin(0.1) };
        });
        v.legend([['accent', 'simulation'], ['gold', 'exact discrete law'], ['red', 'arcsine law'], ['muted', 'uniform', { dash: true }]]);
        v.readout(() => st && `$n=${st.n}$: Kolmogorov distance (exact law vs arcsine) $${v.fix(st.d, 4)}$. $P(0.45\\le L/2n\\le0.55)=${v.fix(st.mid, 3)}$ (arcsine: ${v.fix(st.midA, 3)}); $P(L/2n<0.1\\text{ or }>0.9)=${v.fix(st.ends, 3)}$ (arcsine: ${v.fix(st.endsA, 3)}).`);
      },
    },
    {
      num: '4.9.6',
      kind: 'Theorem',
      name: 'Arcsine law for time spent above 0',
      statement: String.raw`Let $\Pi_{2n}$ be the number of steps $k\le2n$ for which the walk lies above the axis, i.e. $\max(S_{k-1},S_k)>0$, for the symmetric simple random walk. Then $\Pi_{2n}$ is even and $P(\Pi_{2n}=2k)=u_{2k}u_{2n-2k}$, the same law as $L_{2n}$. Hence $\Pi_{2n}/2n$ converges in law to the arcsine law: $P(\Pi_{2n}/2n\le x)\to\frac2\pi\arcsin\sqrt x$.`,
      idea: String.raw`The identity in law is proved by induction on $n$ (or by a bijection of paths): condition on the first return to $0$ at time $2j$; the walk until then is above or below the axis with probability $\frac12$ each, and what follows is a fresh walk of length $2n-2j$, which gives the recursion $P(\Pi_{2n}=2k)=\frac12\sum_{j\le n}f_{2j}\big[P(\Pi_{2n-2j}=2k-2j)+P(\Pi_{2n-2j}=2k)\big]+\frac12u_{2n}\big(\mathbf 1_{k=0}+\mathbf 1_{k=n}\big)$ with $f_{2j}$ the first-return law (the last term: no return by $2n$); $u_{2k}u_{2n-2k}$ satisfies the same recursion by 4.9.4 and the convolution identity for the $u$'s. The limit then follows from 4.9.5.`,
      caption: String.raw`Left: eight seeded walks of length $2n$ with the stretches above the axis painted green and those below red; the fraction above is printed on each. Right: the histogram over 6000 walks of the fraction of time above $0$ (accent), the exact bars $u_{2k}u_{2n-2k}$ (red outlines) and the arcsine density (red curve). The walk spends most of its time on one side: a fraction near $\frac12$ is the *least* likely outcome, near $0$ or $1$ the most likely.`,
      credit: 'P. Lévy, 1939 (Brownian motion); P. Erdős & M. Kac, 1947 and K. L. Chung & W. Feller, 1949 (random walks)',
      verify: true,
      deps: ['prob-4.9.4', 'prob-4.9.5'],
      tags: ['random walk', 'arcsine law'],
      viz(v) {
        const nS = v.slider('$n$', 5, 400, 100, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0, 200], y: [-30, 30], height: 330, axes: 'box', gutter: true, xlabel: 'time $k$', title: 'time above (green) and below (red)' });
        const B = v.stage({ x: [0, 1], y: [0, 3.5], height: 330, axes: 'box', gutter: true, xlabel: '$\\Pi_{2n}/2n$', title: 'fraction of time above $0$' });
        let st = null;
        v.render(() => {
          const n = nS.value, K = 6000, r = v.rng(seed * 6007 + n), cap = Math.max(6, Math.round(2.2 * Math.sqrt(2 * n)));
          A.setView([0, 2 * n], [-cap, cap]); A.hline(0, { color: 'ink', width: 1.4 });
          const frac = [];
          for (let j = 0; j < 8; j++) {
            const S = srw(r, 2 * n); let above = 0;
            for (let i = 1; i <= 2 * n; i++) { const up = Math.max(S[i - 1], S[i]) > 0; if (up) above++; A.line(i - 1, S[i - 1], i, S[i], { color: up ? 'green' : 'red', width: 1.2, alpha: 0.7 }); }
            frac.push(above / (2 * n));
          }
          A.text(frac.map((f) => v.fix(f, 2)).join('  '), n, cap * 0.92, { size: 11, color: 'muted', align: 'center' });
          const r2 = v.rng(seed * 33 + n), cnt = new Float64Array(n + 1);
          for (let j = 0; j < K; j++) { let s = 0, above = 0; for (let i = 1; i <= 2 * n; i++) { const p = s; s += r2() < 0.5 ? 1 : -1; if (Math.max(p, s) > 0) above++; } cnt[above / 2]++; }
          const law = lastZeroLaw(n), bins = 30, E = Array.from({ length: bins + 1 }, (_, i) => i / bins), h = new Float64Array(bins), hx = new Float64Array(bins);
          for (let k = 0; k <= n; k++) { const q = Math.min(bins - 1, Math.floor((k / n) * bins)); h[q] += cnt[k]; hx[q] += law[k]; }
          B.hist({ edges: E, counts: Array.from(h), density: Array.from(h, (c) => (c / K) * bins) }, { density: true, color: 'accent', fillAlpha: 0.3 });
          for (let q = 0; q < bins; q++) B.rect(q / bins, 0, (q + 1) / bins, hx[q] * bins, { fill: false, color: 'red', width: 1.3, stroke: true });
          B.fn((x) => 1 / (Math.PI * Math.sqrt(x * (1 - x))), { color: 'red', width: 2, domain: [0.004, 0.996], alpha: 0.7 });
          let mid = 0, ends = 0, simMid = 0, simEnds = 0;
          for (let k = 0; k <= n; k++) { const x = k / n; if (x >= 0.4 && x <= 0.6) { mid += law[k]; simMid += cnt[k] / K; } if (x < 0.1 || x > 0.9) { ends += law[k]; simEnds += cnt[k] / K; } }
          st = { n, mid, ends, simMid, simEnds };
        });
        v.legend([['accent', 'simulation', { area: true }], ['red', 'exact $u_{2k}u_{2n-2k}$ (binned) and arcsine density'], ['green', 'above'], ['red', 'below']]);
        v.readout(() => st && `$n=${st.n}$: $P(0.4\\le\\Pi/2n\\le0.6)=${v.fix(st.mid, 3)}$ (simulated $${v.fix(st.simMid, 3)}$) but $P(\\Pi/2n<0.1\\text{ or }>0.9)=${v.fix(st.ends, 3)}$ (simulated $${v.fix(st.simEnds, 3)}$).`);
      },
    },
  ],
};
