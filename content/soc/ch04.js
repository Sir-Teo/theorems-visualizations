// Networks & Collective Behavior — Chapter 4a.
// Relevant full originals: Erdős–Rényi1960; Ugander et al.2011 §§degree/path lengths/components;
// Facebook Research2016 full post; Watts–Strogatz1998 pp.440–442; Kleinberg2000 technical paper
// definitions/Theorems2–3/proofs. Precise evidence and model limitations: docs/verification/soc-source-review.md.
import {
  rng32, components, meanDistER, occupancyDistances, triangleStats, poissonPmf, pairUniforms, gnpCoupled, growthCurve, giantTheory,
  wsSkeleton, wsBuild, pathAndClustering, meanDelivery, linkLengthShares, circlePos,
} from './ch04.shared.js';

export default {
  collection: 'soc',
  chapter: 4,
  title: 'Random graphs, small worlds and power laws',
  summary: String.raw`Random graphs are the baseline: a giant component appears suddenly once the average degree passes one, and distances grow only logarithmically. Real social networks are both clustered and small, which the Watts–Strogatz model reproduces, and Milgram’s letters showed that people can find short paths without a map, which Kleinberg’s model explains. Many networks have heavy-tailed degree distributions, which preferential attachment explains — though how often real networks are truly scale-free is disputed. The chapter ends with the same ideas in the wild: cultural markets, city sizes, the long tail of sales and the bow-tie shape of the Web.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Model',
      name: 'Erdős–Rényi random graph',
      statement: String.raw`The random graph $G(n,p)$ has $n$ labelled vertices; each of the $\binom n2$ possible edges is present independently with probability $p$. (Erdős and Rényi's own model $G(n,M)$ instead picks $M$ edges uniformly at random; for large $n$ the two behave alike when $M\approx p\binom n2$.)

With mean degree $c=p(n-1)$ held fixed as $n\to\infty$:
(a) the degree of a vertex is binomial, hence close to **Poisson**: $P(k)\approx e^{-c}c^k/k!$, so very high-degree vertices are exponentially rare;
(b) conditional on a vertex having at least two neighbours, its expected local clustering equals $p=c/(n-1)\to0$: triangles are rare, since two friends of a vertex are linked only with the base probability;
(c) for fixed $c>1$, typical distances between vertices in the giant component grow like $\ln n/\ln c$.`,
      idea: String.raw`Independence does all the work. A vertex's degree is a sum of $n-1$ independent Bernoulli($p$) variables, which is Binomial($n-1,p$) and tends to Poisson($c$) when $p\sim c/n$. Any pair of neighbours of a vertex is joined with probability exactly $p$, whatever else is known, so expected clustering conditional on degree at least two is $p$. If degree-zero and degree-one vertices are assigned clustering zero, the unconditional expectation is $p\,P(D\ge2)$. And because a vertex's neighbours' neighbours are essentially new vertices (no triangles to speak of), the neighbourhood grows like a tree with branching ratio $c$ (the branching process of 4.2). The model is a *null model*: the baseline against which real networks, which are clustered and heavy-tailed, look surprising.`,
      caption: String.raw`**Left**: a 60-vertex sample with the same mean degree $c$ (the largest component is gold). **Right**: the degree histogram of the $n$-vertex graph, with the Poisson($c$) probabilities as dots. Drag $c$: edges are added to the same graph (a coupling, not a fresh draw), so you can watch components merge. Notice that the histogram is a bump, not a tail, and compare finite-sample clustering with its model expectation.`,
      scope: String.raw`Mathematically exact for the model; as a model of real networks it fails on clustering (real networks have far more triangles than $p$) and on the degree tail. $G(n,p)$ was also introduced by Gilbert in 1959; the Erdős–Rényi papers are 1959–1960.`,
      deps: ['soc-2.3', 'prob-3.6.1'],
      refs: ['Newman ch. 11'],
      tags: ['random graphs', 'networks'],
      credit: 'Erdős & Rényi, 1959–1960 (and Gilbert, 1959)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Erd%C5%91s%E2%80%93R%C3%A9nyi_model' },
      viz(v) {
        const N0 = 60;
        let seed = 7, n = 500, U = null, U0 = null;
        const nSel = v.select('vertices $n$', [{ value: 200, label: '200' }, { value: 500, label: '500' }, { value: 1000, label: '1000' }], 500, { onChange: (x) => { n = +x; U = null; } });
        const cS = v.slider('mean degree $c$', 0, 12, 2, { step: 0.1 });
        v.button('Resample', () => { seed += 1; U = null; U0 = null; });
        const SD = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, axes: false, height: 340, title: 'a 60-vertex sample, same mean degree', minWidth: 280 });
        const SH = v.stage({ x: [-0.5, 24.5], y: [0, 0.3], axes: 'box', gutter: true, height: 340, xlabel: 'degree $k$', ylabel: 'share of vertices', title: 'degree distribution', minWidth: 300, weight: 1.2 });
        const pos = circlePos(N0, 0.95).map(([x, y]) => [x, y]);
        const G = v.graph(SD, { nodes: pos.map(([x, y], i) => ({ id: i, x, y })), edges: [], layout: 'none', r: 5, autoRadius: false, draggable: false });
        let st = null;
        v.render(() => {
          n = +nSel.value; U ??= pairUniforms(n, seed); U0 ??= pairUniforms(N0, seed + 1000);
          const c = cS.value, p = c / (n - 1);
          const g0 = gnpCoupled(N0, U0, c / (N0 - 1)), comp0 = components(g0), inGiant = new Set(comp0[0]);
          G.edges = g0.edges.map(([a, b]) => ({ from: a, to: b }));
          G.draw({ nodeColor: () => 'muted', nodeFill: (id) => (comp0[0].length > 2 && inGiant.has(id) ? 'gold' : null), edgeColor: () => 'muted', nodeLabel: () => '' });
          const g = gnpCoupled(n, U, p), cnt = [], K = 24;
          for (const a of g.adj) cnt[a.length] = (cnt[a.length] || 0) + 1;
          const kmax = cnt.length - 1; let peak = 0.05;
          for (let k = 0; k <= K; k++) { const h = (cnt[k] || 0) / n; peak = Math.max(peak, h, poissonPmf(k, c)); if (cnt[k]) SH.rect(k - 0.4, 0, k + 0.4, h, { fill: 'accent', fillAlpha: 0.55, stroke: false }); }
          SH.setView([-0.5, 24.5], [0, peak * 1.15]);
          for (let k = 0; k <= K; k++) SH.dot(k, poissonPmf(k, c), { r: 4, color: 'orange' });
          const tri = triangleStats(g), comp = components(g);
          const mean = 2 * g.edges.length / n, vr = g.adj.reduce((s, a) => s + (a.length - mean) ** 2, 0) / n;
          st = { c, p, mean, vr, kmax, trans: tri.transitivity, giant: comp[0].length / n, theory: giantTheory(c), n, m: g.edges.length };
        });
        v.legend([['accent', 'sampled degree histogram', { area: true }], ['orange', 'Poisson($c$)', { dot: true }], ['gold', 'largest component (left)', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          return String.raw`$n=${st.n}$, $m=${st.m}$ edges, $p=c/(n-1)=${v.fix(st.p, 4)}$ · mean degree **${v.fix(st.mean, 2)}** (target ${v.fix(st.c, 1)}), variance **${v.fix(st.vr, 2)}** (Poisson: variance = mean), largest degree ${st.kmax}
clustering (transitivity) **${v.fix(st.trans, 4)}** versus $p=${v.fix(st.p, 4)}$ · largest component **${v.fix(100 * st.giant, 1)}%** of vertices (theory for $n\to\infty$: ${v.fix(100 * st.theory, 1)}%)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'The giant component appears at mean degree one',
      statement: String.raw`Let $G(n,c/n)$ be the random graph with fixed mean degree $c$ as $n\to\infty$.

(a) If $c<1$, with high probability every component has $O(\log n)$ vertices (all are small trees, essentially).

(b) If $c>1$, there is, with high probability, exactly one component with $\sim S n$ vertices, the **giant component**, where $S\in(0,1)$ is the positive solution of
$$S = 1 - e^{-cS},$$
and every other component has $O(\log n)$ vertices.

(c) At $c=1$ the largest component has size of order $n^{2/3}$.

So the emergence of the giant component is a **phase transition**: the fraction of vertices in the largest component is $0$ for $c\le1$ and grows continuously (like $2(c-1)$ just above 1) afterwards.`,
      idea: String.raw`Explore a component from a vertex, one neighbour at a time. In a sparse random graph the number of unexplored new neighbours of each vertex is nearly Poisson($c$) and independent, so the exploration is a Galton–Watson branching process (stoch-3.9) with mean offspring $c$. The process dies out with probability one if $c\le1$ and survives with positive probability $1-q$ if $c>1$, where $q=e^{-c(1-q)}$ is the extinction probability. A vertex lies in the giant component exactly when its exploration survives (it escapes to "infinity"), so $S=1-q$, which is the equation $S=1-e^{-cS}$. Two giant components cannot coexist because two large sets would have a link between them with overwhelming probability.`,
      caption: String.raw`**Left**: the share of vertices in the largest component against $c$ for one growing random graph of $n=100,\,1000,\,10\,000$ vertices (dots/lines) and the limit curve. **Right**: the fixed-point picture: the non-zero crossing of $y=1-e^{-cS}$ with $y=S$ exists only when the slope $c$ at $S=0$ exceeds 1. Drag $c$ across 1 and watch the finite curves sharpen towards the kink.`,
      scope: String.raw`$G(n,p)$ with $p=c/n$ and $n\to\infty$. The finite curves are one random growth process each, so they fluctuate; near $c=1$ finite-size effects (width $\sim n^{-1/3}$) smear the transition. Real networks with heavy-tailed degrees have a different threshold (see the configuration model, 4.14).`,
      deps: ['soc-4.1', 'stoch-3.9'],
      refs: ['Newman ch. 11'],
      tags: ['random graphs', 'phase transition', 'giant component'],
      credit: 'Erdős & Rényi, 1960',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Giant_component' },
      viz(v) {
        const SIZES = [100, 1000, 10000], COL = ['orange', 'green', 'accent'];
        const cS = v.slider('mean degree $c$', 0, 3, 1.5, { step: 0.01 });
        const A = v.stage({ x: [0, 3], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'mean degree $c$', ylabel: 'largest component / $n$', title: 'the transition', minWidth: 300, weight: 1.2 });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'S', ylabel: 'y', title: '$S=1-e^{-cS}$', minWidth: 260, weight: 1 });
        const runs = SIZES.map((n, i) => growthCurve(n, Math.round(1.5 * n), 11 + i));
        const sim = (i, c) => { const n = SIZES[i], m = Math.min(Math.round(c * n / 2), runs[i].big.length - 1); return { s: runs[i].big[m] / n, sec: runs[i].sec[m] }; };
        let st = null;
        v.render(() => {
          const c = cS.value;
          A.fn((x) => giantTheory(x), { color: 'ink', width: 2.2, n: 400 });
          runs.forEach((r, i) => {
            const n = SIZES[i], pts = []; for (let m = 0; m < r.big.length; m += Math.max(1, Math.floor(r.big.length / 150))) pts.push([2 * m / n, r.big[m] / n]);
            A.path(pts, { color: COL[i], width: 1.7, alpha: 0.9 });
          });
          A.vline(c, { color: 'gold', width: 1.6, dash: true }); A.vline(1, { color: 'muted', width: 1, dash: [3, 4] });
          A.text('critical point c = 1', 1, 0.95, { dx: 6, size: 11, color: 'muted', align: 'left' });
          B.line(0, 0, 1, 1, { color: 'muted', width: 1.4 });
          B.fn((s) => 1 - Math.exp(-c * s), { color: 'purple', width: 2.4 });
          const S = giantTheory(c);
          B.dot(0, 0, { r: 5, color: S > 0 ? 'red' : 'green', hollow: S > 0 });
          if (S > 0) B.dot(S, S, { r: 6, color: 'green', label: `S = ${v.fix(S, 3)}`, labelPos: 'se' });
          st = { c, S, sims: SIZES.map((_, i) => sim(i, c)) };
        });
        v.legend([['ink', 'limit $n\\to\\infty$'], ['orange', '$n=100$'], ['green', '$n=1000$'], ['accent', '$n=10\\,000$'], ['purple', '$y=1-e^{-cS}$']]);
        v.readout(() => {
          if (!st) return '';
          const { c, S, sims } = st;
          const crit = Math.abs(c - 1) < 0.06 ? String.raw` · at $c\approx1$ the largest component of the $10^4$-vertex graph has ${Math.round(sims[2].s * 1e4)} vertices (compare $n^{2/3}=464$)` : '';
          return String.raw`$c=${v.fix(c, 2)}$ · limit $S=${v.fix(S, 3)}$ ${c <= 1 ? '(no giant component: slope at $S=0$ is $c\\le1$)' : `(slope at 0 is $c>1$: a second crossing)`}
largest component / $n$: $n{=}100$: ${v.fix(sims[0].s, 3)} · $n{=}1000$: ${v.fix(sims[1].s, 3)} · $n{=}10^4$: ${v.fix(sims[2].s, 3)}; second largest at $n{=}10^4$: ${sims[2].sec} vertices${crit}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Event',
      name: 'Milgram’s small-world experiment',
      statement: String.raw`In 1967 Stanley Milgram and his collaborators asked volunteers in Nebraska and Boston to forward a folder to a named target, a stockbroker in the Boston area, by handing it only to a first-name acquaintance who seemed more likely to know him; each chain's length was recorded when the folder arrived. In the published 1969 account (Travers and Milgram, soc-4.17), 64 of 296 starting chains arrived, after about five intermediaries on average, and the "six degrees of separation" slogan followed.

The experiment was repeated by e-mail in 2003 (Dodds, Muhamad and Watts): 98,847 people registered and 61,168 took part from 166 countries, trying to reach 18 targets in 13 countries; of 24,163 distinct chains only 384 (1.6%) were completed, with mean length 4.01 for the completed ones. Correcting for attrition, the authors estimate a median chain length of five to seven.

The lesson is twofold: people can find short paths in a network they cannot see, and the **observed** lengths understate the true ones, because long chains are the ones that die.`,
      idea: String.raw`The experiment runs a distributed, greedy search: each holder knows only their own acquaintances and the target's location and occupation, and passes the folder to the one that looks nearest. It works only if the network is both small (soc-4.5) and *searchable*: acquaintances at every geographic scale, which Kleinberg's model (4.6) isolates. Attrition is the statistical trap: if each hand-over loses a fraction $d$ of the folders, a chain of length $L$ survives with probability $(1-d)^L$, so the arrivals are weighted toward short chains; the 2003 study corrects for this using the observed per-step drop-out rates.`,
      caption: String.raw`A model, not the data: 1200 people placed at random in a square know their five nearest neighbours and two long-range acquaintances (probability $\propto1/d^2$). Drag the source and the target; the gold chain follows Milgram's rule (hand the folder to the acquaintance nearest the target), the green dashed path is the true shortest route. The histogram compares the two over 600 random pairs, and the slider adds attrition per hand-over.`,
      scope: String.raw`The simulated population is illustrative (it has no occupations or institutions, and only one kind of tie). The numbers for the 1969 and 2003 experiments are as reported in the papers; the 2003 study's total of participants and chains is quoted from the paper's text.`,
      deps: ['soc-2.2'],
      refs: ['E&K §20.1'],
      tags: ['small world', 'history', 'search'],
      credit: 'Milgram, 1967; Travers & Milgram, 1969; Dodds, Muhamad & Watts, 2003',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Small-world_experiment' },
      viz(v) {
        const N = 1200, R = rng32(41);
        const X = new Float64Array(N), Y = new Float64Array(N);
        for (let i = 0; i < N; i++) { X[i] = R(); Y[i] = R(); }
        const d2 = (a, b) => (X[a] - X[b]) ** 2 + (Y[a] - Y[b]) ** 2;
        const adj = Array.from({ length: N }, () => new Set());
        for (let i = 0; i < N; i++) {
          const ds = []; for (let j = 0; j < N; j++) if (j !== i) ds.push([d2(i, j), j]);
          ds.sort((a, b) => a[0] - b[0]);
          for (let k = 0; k < 5; k++) { adj[i].add(ds[k][1]); adj[ds[k][1]].add(i); }
          const w = ds.map(([d]) => 1 / (d + 1e-6)); let tot = 0; for (const x of w) tot += x;
          for (let t = 0; t < 2; t++) { let r = R() * tot, k = 0; while (k < w.length - 1 && r > w[k]) { r -= w[k]; k++; } adj[i].add(ds[k][1]); adj[ds[k][1]].add(i); }
        }
        const nbr = adj.map((s) => [...s]);
        const nearest = (x, y) => { let b = 0, bd = 9; for (let i = 0; i < N; i++) { const d = (X[i] - x) ** 2 + (Y[i] - y) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
        const greedy = (s, t) => {
          const path = [s]; let u = s;
          while (u !== t && path.length < 200) { let best = -1, bd = d2(u, t); for (const w of nbr[u]) { const d = d2(w, t); if (d < bd) { bd = d; best = w; } } if (best < 0) return { path, ok: false }; u = best; path.push(u); }
          return { path, ok: u === t };
        };
        const bfsPath = (s, t) => { const prev = new Int32Array(N).fill(-2); prev[s] = -1; const q = [s]; for (let h = 0; h < q.length && prev[t] === -2; h++) for (const w of nbr[q[h]]) if (prev[w] === -2) { prev[w] = q[h]; q.push(w); } const p = []; for (let x = t; x !== -1; x = prev[x]) p.push(x); return p.reverse(); };
        // 600 random pairs
        const RP = rng32(5), pairs = []; let gl = new Array(25).fill(0), sl = new Array(25).fill(0), okN = 0;
        for (let i = 0; i < 600; i++) { const a = Math.floor(RP() * N), b = Math.floor(RP() * N); if (a === b) { i--; continue; } const g = greedy(a, b), s = bfsPath(a, b).length - 1; sl[Math.min(24, s)]++; if (g.ok) { gl[Math.min(24, g.path.length - 1)]++; okN++; } pairs.push(1); }
        const dS = v.slider('attrition per hand-over', 0, 0.6, 0.25, { step: 0.01, fmt: (x) => `${Math.round(100 * x)}%` });
        const M = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 360, title: 'a population of 1200 people', minWidth: 300, weight: 1.1 });
        const H = v.stage({ x: [-0.5, 20.5], y: [0, 1], axes: 'box', gutter: true, height: 360, xlabel: 'chain length (hand-overs)', ylabel: 'share of the 600 pairs', title: 'how long are the chains?', minWidth: 280, weight: 1 });
        const src = M.handle(0.12, 0.3, { color: 'green', label: 'Nebraska' }), tgt = M.handle(0.88, 0.68, { color: 'red', label: 'Boston' });
        for (let i = 0; i < N; i++) for (const w of nbr[i]) if (w > i) { /* edges drawn lazily below */ }
        let st = null;
        v.render(() => {
          for (let i = 0; i < N; i++) for (const w of nbr[i]) if (w > i && d2(i, w) > 0.004) M.line(X[i], Y[i], X[w], Y[w], { color: 'faint', width: 0.5, alpha: 0.5 });
          M.dots(Array.from({ length: N }, (_, i) => [X[i], Y[i]]), { r: 1.8, color: 'muted' });
          const s = nearest(src.x, src.y), t = nearest(tgt.x, tgt.y), g = greedy(s, t), sp = bfsPath(s, t);
          M.path(sp.map((i) => [X[i], Y[i]]), { color: 'green', width: 2.6, dash: [6, 4] });
          M.path(g.path.map((i) => [X[i], Y[i]]), { color: 'gold', width: 2.8 });
          M.dots(g.path.map((i) => [X[i], Y[i]]), { r: 3.6, color: 'gold' });
          M.dot(X[s], Y[s], { r: 6, color: 'green' }); M.dot(X[t], Y[t], { r: 6, color: 'red' });
          const d = dS.value, surv = (L) => Math.pow(1 - d, L);
          const mx = Math.max(...sl) / 600;
          H.setView([-0.5, 20.5], [0, mx * 1.35]);
          let comp = 0, cmean = 0, gtot = 0, gmean = 0;
          for (let L = 1; L <= 24; L++) {
            if (L <= 20) {
              if (sl[L]) H.rect(L - 0.45, 0, L - 0.05, sl[L] / 600, { fill: 'green', fillAlpha: 0.55, stroke: false });
              if (gl[L]) H.rect(L + 0.05, 0, L + 0.45, gl[L] / 600, { fill: 'gold', fillAlpha: 0.75, stroke: false });
              if (gl[L]) H.rect(L + 0.05, 0, L + 0.45, gl[L] * surv(L) / 600, { fill: 'orange', fillAlpha: 0.9, stroke: false });
            }
            comp += gl[L] * surv(L); cmean += L * gl[L] * surv(L); gtot += gl[L]; gmean += L * gl[L];
          }
          st = { len: g.path.length - 1, ok: g.ok, sp: sp.length - 1, okN, gmean: gmean / gtot, cmean: cmean / comp, frac: comp / 600, d, Lmean: sl.reduce((a, c, L) => a + c * L, 0) / 600 };
        });
        v.legend([['green', 'shortest route', { area: true }], ['gold', 'greedy chains that arrive', { area: true }], ['orange', 'arrive despite attrition', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { len, ok, sp, okN, gmean, cmean, frac, d, Lmean } = st;
          return `This pair: the greedy chain ${ok ? `arrives after **${len}** hand-overs` : 'gets stuck (no acquaintance is closer to the target)'}; the shortest route has **${sp}**. Over 600 pairs the greedy rule arrives ${Math.round(100 * okN / 600)}% of the time, in ${v.fix(gmean, 1)} hand-overs on average (shortest routes: ${v.fix(Lmean, 1)}); with ${Math.round(100 * d)}% attrition per hand-over only **${v.fix(100 * frac, 1)}%** arrive, with mean ${v.fix(cmean, 1)}.
Reported experiments: Travers–Milgram 64 of 296 chains arrived (22%), Dodds et al. 384 of 24,163 (1.6%), mean length of arrivals 4.01.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Phenomenon',
      name: 'Six degrees in online networks',
      statement: String.raw`When the whole graph is available, distances can be measured directly instead of by letters. Facebook's friendship graph was measured in May 2011 (Ugander et al., 721 million active users, 68.7 billion friendships, mean degree about 190, median 99): the average distance was **4.7 hops** (3.7 intermediaries) and 99.91% of users lay in one connected component. A 2016 measurement by Facebook's data team (Edunov et al., 1.59 billion active users) gave an average distance of **4.57** hops, i.e. 3.57 intermediaries.

So online social networks are "small" in the sense of 4.3, and have become smaller as they grew and densified. A random graph with the same number of vertices and mean degree predicts a distance of $\approx(\ln N-\gamma)/\ln c+\tfrac12$ with $\gamma\approx0.577$ (Euler's constant); for $N=721$ million and $c=190$ this is about 4.3, a little below the measured 4.7: this comparison alone does not identify which structural features explain the difference.`,
      idea: String.raw`Growth of a neighbourhood: starting from one vertex, about $c^d$ vertices are within $d$ steps while that is much less than $N$, so the whole graph is reached when $c^d\approx N$, i.e. at $d\approx\ln N/\ln c$. Distances therefore grow with the *logarithm* of the population: multiplying $N$ by 1000 adds only $\ln1000/\ln c\approx1.3$ steps at $c=190$. Clustering can repeat already reached vertices. Degree heterogeneity can instead increase the mean excess degree and shorten distances in an otherwise random graph; its effect cannot be inferred from the mean degree alone.`,
      caption: String.raw`**Left**: a model: about $c^d$ people lie within $d$ hops, so the neighbourhood fills the population in a few steps; the bars give the share of people at each distance (drag $c$ and $N$). **Right**: the mean distance predicted for a random graph as the population $N$ grows, for the chosen $c$, with the two Facebook measurements marked. Dragging $N$ over six orders of magnitude moves the prediction by only a few hops.`,
      scope: String.raw`The measured averages are approximate algorithmic estimates over connected pairs of Facebook's active users at the stated dates (not the whole world's population) and count hops along friendship links. The random-graph curve is a model; the 2016 post does not report a mean degree, so no prediction is drawn for it. "Degrees of separation" in the 2016 report equals the distance minus one.`,
      deps: ['soc-4.3'],
      refs: ['E&K §20.4'],
      tags: ['small world', 'social networks', 'online'],
      credit: 'Ugander, Karrer, Backstrom & Marlow, 2011; Edunov et al., 2016',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Six_degrees_of_separation', arxiv: 'https://arxiv.org/abs/1111.4503' },
      viz(v) {
        const fmtN = (x) => (x >= 1e9 ? `${(x / 1e9).toPrecision(3)} billion` : x >= 1e6 ? `${(x / 1e6).toPrecision(3)} million` : x >= 1e3 ? `${Math.round(x / 1e3 * 10) / 10} thousand` : `${Math.round(x)}`);
        const cS = v.slider('mean degree $c$', 3, 400, 190, { step: 1, int: true });
        const NS = v.slider('population $N$', 1e3, 1e10, 7.21e8, { log: true, fmt: fmtN });
        const A = v.stage({ x: [-0.5, 9.5], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'distance $d$ (hops)', ylabel: 'share of the population at distance $d$', title: 'model: how a neighbourhood fills the network', minWidth: 280, weight: 1 });
        const B = v.stage({ x: [1e3, 1e10], y: [0, 9], xlog: true, axes: 'box', gutter: true, height: 330, xlabel: 'population $N$', ylabel: 'mean distance', title: 'random-graph prediction vs Facebook', minWidth: 300, weight: 1.2 });
        // occupancy model: within d hops the expected share of the population is 1 − exp(−c^d / N)
        let st = null;
        v.render(() => {
          const c = cS.value, N = NS.value, profile = occupancyDistances(N,c), mean = profile.mean, D = profile.last;
          const P = [0,...profile.probabilities], pk = Math.max(...P);
          P.forEach((x, d) => { if (x > 1e-4) A.rect(d - 0.4, 0, d + 0.4, x, { fill: 'accent', fillAlpha: 0.6, stroke: false }); });
          A.setView([-0.5, D + 0.5], [0, pk * 1.25]);
          A.vline(mean, { color: 'gold', width: 2 });
          A.text(`mean ${v.fix(mean, 2)}`, mean, pk * 1.12, { dx: 6, size: 11.5, color: 'gold', weight: 700, align: 'left' });
          B.fn((x) => meanDistER(x, c), { color: 'accent', width: 2.4, n: 200 });
          B.dot(7.21e8, 4.74, { r: 6, color: 'red' }); B.text('2011: 4.74', 7.21e8, 4.74, { dx: -9, dy: -14, size: 11.5, weight: 700, color: 'red', align: 'right' });
          B.dot(7.21e8, meanDistER(7.21e8, 190), { r: 5, hollow: true, color: 'green' });
          B.dot(1.59e9, 4.57, { r: 6, color: 'purple' }); B.text('2016: 4.57', 1.59e9, 4.57, { dx: -9, dy: 20, size: 11.5, weight: 700, color: 'purple', align: 'right' });
          B.vline(N, { color: 'gold', width: 1.4, dash: true });
          B.dot(N, meanDistER(N, c), { r: 5, color: 'gold' });
          st = { c, N, sm: mean, pred: meanDistER(N, c), p2011: meanDistER(7.21e8, 190) };
        });
        v.legend([['accent', 'random graph with mean degree $c$'], ['red', 'Facebook, May 2011 (measured)', { dot: true }], ['purple', 'Facebook, 2016 (measured)', { dot: true }], ['green', 'random graph, same $N$ and $c$ as 2011', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { c, N, sm, pred, p2011 } = st;
          return String.raw`$c=${c}$, $N=$ ${fmtN(N)}: neighbourhood-growth model mean **${v.fix(sm, 2)}**, formula $(\ln N-\gamma)/\ln c+\tfrac12=$ **${v.fix(pred, 2)}** · within $d$ hops about $c^d$ people (at $c=${c}$: ${[1, 2, 3, 4].map((d) => fmtN(Math.pow(c, d))).join(', ')} for $d=1,\dots,4$) · each factor of 1000 in $N$ adds $\ln1000/\ln c=${v.fix(Math.log(1000) / Math.log(c), 2)}$ hops
2011: measured 4.74 vs random-graph value ${v.fix(p2011, 2)} ($N=721$ million, $c=190$); 2016: measured 4.57 with 1.59 billion users`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Model',
      name: 'Watts–Strogatz small-world model',
      statement: String.raw`Start with $n$ vertices on a ring, each joined to its $k$ nearest neighbours ($k$ even). With probability $p$ rewire each edge: keep one end and move the other to a vertex chosen uniformly at random (no loops or repeated edges). Let $L(p)$ be the mean shortest-path length and $C(p)$ the mean clustering coefficient.

(a) $p=0$ is a **regular lattice**: highly clustered, $C(0)\approx\tfrac34$ for $k\gg1$, but with long distances, $L(0)\approx n/2k$.

(b) $p=1$ gives a randomised graph (not exactly $G(n,p)$, since each vertex retains at least $k/2$ incident edges): $C\approx k/n$ and $L\approx\ln n/\ln k$.

(c) In between, for small $p$ a few random shortcuts cut $L$ drastically while $C$ barely moves: $L(p)/L(0)$ can collapse while $C(p)/C(0)\approx(1-p)^3$ stays near 1. A wide range of $p$ gives a network that is **both clustered and small**, like the real networks measured in the original paper.`,
      idea: String.raw`Clustering is a *local* property: rewiring one edge destroys only the triangles through that edge, so $C$ falls in proportion to $(1-p)^3$ (an original triangle survives only if all three of its edges do). Path length is a *global* property: a single shortcut links two distant parts of the ring and shortens the paths of everyone near both ends, so a handful of shortcuts, $pnk/2\gtrsim1$, changes the scaling of $L$ from linear in $n$ to logarithmic. The two properties therefore respond at very different values of $p$, which opens the window in which both are satisfied.`,
      caption: String.raw`**Left**: a 24-vertex ring; the shortcuts (orange) appear as you raise $p$ (the same random choices are reused; rewired graphs need not nest). **Right**: simulated $L(p)/L(0)$ and $C(p)/C(0)$ on a log-$p$ axis for a 300-vertex ring with $k=6$ (average of 4 runs per point), the formula $(1-p)^3$ (dashed), and the live value for the current $p$. Switch to the illustrative *add shortcuts* variant to keep the lattice intact.`,
      scope: String.raw`Stated for $n\gg k\gg\ln n\gg1$ (the limits in the original paper). The curves use $n=300$, $k=6$, a much smaller ring than the paper's 1000 vertices with $k=10$, so the collapse sits at somewhat larger $p$. The add-shortcuts display is a related illustrative variant, with one shortcut attempt per selected lattice edge.`,
      deps: ['soc-2.5', 'soc-4.1'],
      refs: ['E&K §20.2'],
      tags: ['small world', 'clustering', 'path length'],
      credit: 'Watts & Strogatz, 1998',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Watts%E2%80%93Strogatz_model' },
      viz(v) {
        const mode = v.select('model', [{ value: 'rewire', label: 'rewire edges (Watts–Strogatz)' }, { value: 'add', label: 'add shortcuts (illustrative variant)' }], 'rewire');
        const pS = v.slider('probability $p$', 0.001, 1, 0.05, { log: true, sig: 2 });
        const SD = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 340, title: 'a ring of 24 (k = 4)', minWidth: 280 });
        const SC = v.stage({ x: [1e-3, 1], y: [0, 1.08], xlog: true, axes: 'box', gutter: true, height: 340, xlabel: 'probability $p$', ylabel: 'relative to $p=0$', title: 'n = 300, k = 6', minWidth: 320, weight: 1.3 });
        const sk24 = wsSkeleton(24, 4, 3), sk300 = wsSkeleton(300, 6, 9);
        const ring = circlePos(24, 1, Math.PI / 2);
        const G = v.graph(SD, { nodes: ring.map(([x, y], i) => ({ id: i, x, y })), edges: [], layout: 'none', r: 6, autoRadius: false, draggable: false });
        const PG = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1], curves = {};
        const curveOf = (m) => curves[m] ??= (() => {
          const b = pathAndClustering(wsBuild(sk300, 0, m).g);
          const pts = PG.map((p) => { let Ls = 0, Cs = 0; for (let r = 0; r < 4; r++) { const r2 = pathAndClustering(wsBuild(wsSkeleton(300, 6, 100 + r), p, m).g); Ls += r2.L; Cs += r2.C; } return [p, Ls / 4 / b.L, Cs / 4 / b.C]; });
          return { base: b, pts };
        })();
        let st = null;
        v.render(() => {
          const p = pS.value, m = mode.value, W = wsBuild(sk24, p, m), moved = new Set(W.moved.map(([a, b]) => (a < b ? `${a}-${b}` : `${b}-${a}`)));
          G.edges = W.g.edges.map(([a, b]) => ({ from: a, to: b, mv: moved.has(a < b ? `${a}-${b}` : `${b}-${a}`) }));
          G.draw({ nodeColor: () => 'accent', nodeLabel: () => '', edgeColor: (e) => (e.mv ? 'orange' : 'muted'), edgeWidth: (e) => (e.mv ? 2.4 : 1.4) });
          const cv = curveOf(m);
          SC.fn((x) => Math.pow(1 - x, 3), { color: 'orange', width: 1.5, dash: [6, 4] });
          SC.path(cv.pts.map(([x, l]) => [x, l]), { color: 'accent', width: 2.4 }); SC.dots(cv.pts.map(([x, l]) => [x, l]), { r: 3.5, color: 'accent' });
          SC.path(cv.pts.map(([x, , c]) => [x, c]), { color: 'orange', width: 2.4 }); SC.dots(cv.pts.map(([x, , c]) => [x, c]), { r: 3.5, color: 'orange' });
          const live = pathAndClustering(wsBuild(sk300, p, m).g);
          SC.vline(p, { color: 'gold', width: 1.4, dash: true });
          SC.dot(p, live.L / cv.base.L, { r: 5.5, color: 'gold' }); SC.dot(p, live.C / cv.base.C, { r: 5.5, color: 'gold' });
          st = { p, live, base: cv.base, moved: W.moved.length, m };
        });
        v.legend([['accent', 'path length $L(p)/L(0)$'], ['orange', 'clustering $C(p)/C(0)$'], ['orange', '$(1-p)^3$', { dash: true }], ['gold', 'current $p$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { p, live, base, moved } = st;
          return String.raw`$p=${v.fix(p, 3)}$ · on the ring of 24: ${moved} ${st.m === 'add' ? 'shortcuts added' : 'edges rewired'} of 48 · on $n=300$: $L=${v.fix(live.L, 2)}$ (lattice ${v.fix(base.L, 2)}, $n/2k=25$), $C=${v.fix(live.C, 3)}$ (lattice ${v.fix(base.C, 3)}, $\tfrac34(k-2)/(k-1)=${v.fix(0.75 * 4 / 5, 3)}$) → $L/L(0)=${v.fix(live.L / base.L, 2)}$, $C/C(0)=${v.fix(live.C / base.C, 2)}$, $(1-p)^3=${v.fix(Math.pow(1 - p, 3), 2)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Kleinberg’s navigability theorem',
      statement: String.raw`Take an $n\times n$ lattice of people; each knows its lattice neighbours (up to four at the boundary) and one extra *long-range contact* $w$, chosen with probability proportional to $d(u,w)^{-q}$, where $d$ is lattice distance. A message is sent from a random source to a random target using a **decentralised** rule: every holder knows only its own contacts and the lattice position of the target, and passes the message to the contact closest to the target (greedy routing).

(a) For $q=2$ (the dimension of the lattice) the expected delivery time is $O((\log n)^2)$: polylogarithmic in the side length.

(b) For every other exponent no decentralised rule is polylogarithmic: the expected time is at least a power of $n$: $\Omega(n^{(2-q)/3})$ for $q<2$ and $\Omega(n^{(q-2)/(q-1)})$ for $q>2$.

So short paths may exist without being **findable**: without a map, a message can be routed efficiently only when long links are spread evenly over all distance scales.`,
      idea: String.raw`At $q=2$ the probability that the long link of $u$ has length in $[2^j,2^{j+1})$ is about the same for every $j$: a link falls in each "distance scale" equally often (the number of vertices at that scale grows like $d^2$ and each is chosen with weight $d^{-2}$). The greedy message needs to halve its distance to the target, and in each such phase it has a chance of order $1/\log n$ per step of finding a link that does it, so each phase costs $O(\log n)$ steps and there are $O(\log n)$ phases. For $q<2$ links are too long, so they are rarely close enough to the target to help in the final approach; for $q>2$ links are too short to cross the lattice quickly. In both cases the missing scales cost a polynomial factor.`,
      caption: String.raw`A model run on real routes: **left**, mean greedy delivery time against $q$ for lattices of side 32, 128 and 512 (200 random messages per point); **middle**, delivery time against side length for the chosen $q$ on log–log axes, with the theorem's lower-bound slopes dashed; **right**, the share of long links in each distance scale $[2^j,2^{j+1})$: flat only at $q=2$. Finite lattices are small, so the best $q$ drifts towards 2 only slowly as the side grows.`,
      scope: String.raw`Theorem2 and Theorem3 of Kleinberg’s complete2000 paper, with side length $n$ and one directed long-range contact per vertex. The lower bounds hold even when the algorithm knows the contacts of all previously visited vertices; the upper bound needs only the current contacts and target position. The simulated lattice is a torus with Manhattan distance, for sizes up to 512×512; the optimum at finite size is below 2, and the theorem is asymptotic.`,
      deps: ['soc-4.5'],
      refs: ['E&K §20.3'],
      tags: ['small world', 'navigation', 'decentralised search'],
      credit: 'Jon Kleinberg, 2000',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Small-world_routing' },
      viz(v) {
        const qS = v.slider('exponent $q$', 0, 4, 2, { step: 0.05 });
        const A = v.stage({ x: [0, 4], y: [2, 300], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'exponent $q$', ylabel: 'mean delivery time', title: 'delivery time vs q', minWidth: 260, weight: 1 });
        const B = v.stage({ x: [8, 512], y: [1, 400], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'side length $n$', ylabel: 'mean delivery time', title: 'scaling at the chosen q', minWidth: 260, weight: 1 });
        const C = v.stage({ x: [-0.6, 9.6], y: [0, 0.6], axes: 'box', gutter: true, height: 320, xlabel: 'scale $j$: link length in $[2^j, 2^{j+1})$', ylabel: 'share of long links', title: 'long links by distance scale', minWidth: 260, weight: 1 });
        const SIZES = [32, 128, 512], SC = ['green', 'accent', 'purple'], GRID = [];
        for (let q = 0; q <= 4.001; q += 0.25) GRID.push(+q.toFixed(2));
        let curves = null;
        const mkCurves = () => (curves ??= SIZES.map((L) => GRID.map((q) => meanDelivery(L, q, 200, 5))));
        let st = null;
        v.render(() => {
          const q = qS.value, cv = mkCurves();
          cv.forEach((row, i) => { A.path(GRID.map((g, j) => [g, row[j]]), { color: SC[i], width: 2.2 }); A.dots(GRID.map((g, j) => [g, row[j]]), { r: 2.6, color: SC[i] }); });
          A.vline(q, { color: 'gold', width: 1.5, dash: true }); A.vline(2, { color: 'muted', width: 1, dash: [3, 4] });
          const sides = [8, 16, 32, 64, 128, 256, 512], T = sides.map((L) => meanDelivery(L, q, 200, 5));
          B.path(sides.map((L, i) => [L, T[i]]), { color: 'gold', width: 2.4 }); B.dots(sides.map((L, i) => [L, T[i]]), { r: 3.8, color: 'gold' });
          const e = q < 2 ? (2 - q) / 3 : q > 2 ? (q - 2) / (q - 1) : 0;
          if (q !== 2) B.fn((x) => T[0] * Math.pow(x / 8, e), { color: 'red', width: 1.5, dash: [6, 4], domain: [8, 512] });
          else B.fn((x) => T[0] * (Math.log2(x) / 3) ** 2, { color: 'green', width: 1.5, dash: [6, 4], domain: [8, 512] });
          const sh = linkLengthShares(512, q);
          sh.forEach((s, j) => { C.rect(j - 0.4, 0, j + 0.4, s, { fill: 'accent', fillAlpha: 0.65, stroke: false }); });
          C.setView([-0.6, 9.6], [0, Math.max(0.2, ...sh) * 1.15]);
          const slope = Math.log(T[6] / T[2]) / Math.log(512 / 32);
          st = { q, T, e, slope, best: GRID[cv[2].indexOf(Math.min(...cv[2]))] };
        });
        v.legend([['green', 'side 32'], ['accent', 'side 128'], ['purple', 'side 512'], ['gold', 'chosen $q$', { dot: true }], ['red', 'lower-bound slope (or $\\log^2n$ at $q=2$)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { q, T, e, slope, best } = st;
          return String.raw`$q=${v.fix(q, 2)}$: delivery time ${v.fix(T[0], 1)} (side 8) → ${v.fix(T[6], 1)} (side 512); measured log–log slope between sides 32 and 512: **${v.fix(slope, 2)}**; the theorem's lower-bound exponent: **${v.fix(e, 2)}**${q === 2 ? ' (none: polylogarithmic)' : ''}
best exponent on the 512 × 512 lattice (grid step 0.25): $q=${best}$ — the optimum sits below 2 at these sizes and creeps towards 2 as $n$ grows`;
        });
      },
    },
  ],
};
