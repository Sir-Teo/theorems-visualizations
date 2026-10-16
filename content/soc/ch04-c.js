// Networks & Collective Behavior — Chapter 4, part c: heavy tails in the wild (items 4.12–4.16)
//
// Sources checked (Oct 2026): Salganik, Dodds & Watts, Science 311: 854–856 (2006), doi 10.1126/science.1121066 — 14,341
// participants, 48 songs, eight "social influence" worlds plus an independent condition, inequality by the Gini coefficient and
// unpredictability u_i = average difference in market share of song i between pairs of worlds (text of the paper and its SOM);
// Gabaix, QJE 114 (3): 739–767 (1999) — Zipf's law for cities from proportional (Gibrat) growth with a lower reflecting barrier;
// US populations are the 2020 census counts of the 30 largest cities as listed on Wikipedia (List of United States cities by
// population, Oct 2026); Brynjolfsson, Hu & Smith, Management Science 49 (11): 1580–1596 (2003) — niche books about 39% of
// Amazon's 2000 sales on their extrapolated fit (as reported in their 2010 follow-up; not checked in the 2003 paper itself);
// Broder et al. (WWW9, 2000), AltaVista crawl of May 1999: 203,549,046 nodes: SCC 56,463,993; IN 43,343,168; OUT 43,166,185;
// TENDRILS 43,797,944; DISCONNECTED 16,777,756 (text of the paper at archives.iw3c2.org/www9/w9cdrom/160/160.html).
// Simulations (market, city growth, configuration model, directed random graph) are models and are labelled as such.
import {
  rng32, mkGraph, components, giantTheory, gaussDraw, degreeSequence, configModel, digraphGnp, bowTie, lsq,
} from './ch04.shared.js';

const US = [['New York', 8804190], ['Los Angeles', 3898747], ['Chicago', 2746388], ['Houston', 2304580], ['Phoenix', 1608139], ['Philadelphia', 1603797], ['San Antonio', 1434625], ['San Diego', 1386932], ['Dallas', 1304379], ['Fort Worth', 918915], ['Jacksonville', 949611], ['Austin', 961855], ['San Jose', 1013240], ['Charlotte', 874579], ['Columbus', 905748], ['Indianapolis', 887642], ['San Francisco', 873965], ['Seattle', 737015], ['Denver', 715522], ['Nashville', 689447], ['Oklahoma City', 681054], ['Washington', 689545], ['El Paso', 678815], ['Las Vegas', 641903], ['Boston', 675647], ['Detroit', 639111], ['Louisville', 633045], ['Portland', 652503], ['Memphis', 633104], ['Baltimore', 585708]].sort((a, b) => b[1] - a[1]);

export default {
  collection: 'soc',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Phenomenon',
      name: 'Unpredictable success in cultural markets (MusicLab)',
      statement: String.raw`In the MusicLab experiment, 14,341 participants at a music website were offered 48 unknown songs and could listen and download. They were split into an **independent** condition, in which they saw only song names, and eight parallel **social-influence worlds**, in which they also saw how many times each song had been downloaded so far in their own world. Everything else was identical.

(a) **Inequality**: the distribution of downloads was more unequal (higher Gini coefficient) in every social-influence world than in the independent condition, and more so when the download counts were displayed more prominently.

(b) **Unpredictability**: the same songs, with the same pool of people, finished with very different market shares and ranks in different worlds; the average difference in a song's share between two worlds was larger with social influence.

(c) **Quality matters, only partly**: the best songs rarely did poorly and the worst rarely did well, but any other result was possible for songs in between.

Success in such markets is therefore partly a property of the history: a cumulative advantage that early random luck can tip either way.`,
      idea: String.raw`If each listener chooses with a probability that grows with a song's current popularity, early downloads are self-reinforcing: a song that gets a few extra early downloads in one world looks more attractive to the next listeners, which is exactly preferential attachment (4.9) on a market of 48 items. The eight worlds are eight independent runs of the same random process with the same ingredients, so differences between worlds are pure *path dependence*. This is why prediction from quality alone fails even with perfect knowledge of the songs, and why hits cannot be reliably identified in advance.`,
      caption: String.raw`A simple model, not the experimental data: each song has a fixed quality; a listener picks song $i$ with probability proportional to $(0.25+q_i)\,(1+d_i)^{\beta}$, where $d_i$ is the song's current download count in that world and $\beta$ is the strength of social influence. **Left**: market share against quality in 8 social worlds (dots); **right**: the same with $\beta=0$ in 8 independent groups of equal size. Drag $\beta$: the independent cloud hugs the dashed expectation, the social one scatters and becomes more unequal.`,
      scope: String.raw`The experiment's results are as reported in the paper (the 2006 *Science* report and its supporting online material). The simulation is a stylised stand-in with one download per listener and a power-law feedback of strength $\beta$; it is not fitted to the experimental data, so its numbers should not be compared with the paper's Gini coefficients.`,
      deps: ['soc-4.9'],
      refs: ['E&K §18.4'],
      tags: ['cumulative advantage', 'cultural markets', 'experiment'],
      credit: 'Salganik, Dodds & Watts, 2006',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Experimental_Study_of_Inequality_and_Unpredictability_in_an_Artificial_Cultural_Market', doi: 'https://doi.org/10.1126/science.1121066' },
      verify: true,
      viz(v) {
        const NS = 48, a = Array.from({ length: NS }, (_, i) => 0.25 + (i + 0.5) / NS), q = a.map((x) => x - 0.25), asum = a.reduce((x, y) => x + y, 0);
        const bS = v.slider('social influence $\\beta$', 0, 2, 0.8, { step: 0.05 });
        const nS = v.slider('listeners per world', 200, 4000, 1750, { step: 50, int: true });
        let seed = 1; v.button('New worlds', () => { seed++; });
        const L = v.stage({ x: [0.1, 0.9], y: [0, 0.2], axes: 'box', gutter: true, height: 340, xlabel: 'song quality $q$', ylabel: 'market share', title: 'with social influence (8 worlds)', minWidth: 280, weight: 1 });
        const Rr = v.stage({ x: [0.1, 0.9], y: [0, 0.2], axes: 'box', gutter: true, height: 340, xlabel: 'song quality $q$', ylabel: 'market share', title: 'independent choices (8 groups)', minWidth: 280, weight: 1 });
        const W = 8;
        const run = (beta, n, sd) => {
          const R = rng32(sd * 977 + 13), out = [];
          for (let w = 0; w < W; w++) {
            const d = new Float64Array(NS);
            for (let t = 0; t < n; t++) {
              let tot = 0; const wt = new Float64Array(NS);
              for (let i = 0; i < NS; i++) { wt[i] = a[i] * Math.pow(1 + d[i], beta); tot += wt[i]; }
              let r = R() * tot, k = 0; while (k < NS - 1 && r > wt[k]) { r -= wt[k]; k++; } d[k]++;
            }
            out.push(Array.from(d, (x) => x / n));
          }
          return out;
        };
        const gini = (s) => { const x = [...s].sort((p, r) => p - r), n = x.length, tot = x.reduce((p, r) => p + r, 0); let acc = 0; x.forEach((y, i) => { acc += (i + 1) * y; }); return 2 * acc / (n * tot) - (n + 1) / n; };
        const unpred = (worlds) => { let s = 0, c = 0; for (let i = 0; i < NS; i++) for (let p = 0; p < W; p++) for (let r = p + 1; r < W; r++) { s += Math.abs(worlds[p][i] - worlds[r][i]); c++; } return s / c; };
        const cache = {}; const sim = (beta, n) => { const k = `${beta.toFixed(2)}|${n}|${seed}`; return (cache[k] ??= run(beta, n, seed)); };
        let st = null;
        v.render(() => {
          const beta = bS.value, n = nS.value, soc = sim(beta, n), ind = sim(0, n);
          const mx = Math.max(0.1, ...soc.flat(), ...ind.flat()) * 1.1;
          for (const [S, wl] of [[L, soc], [Rr, ind]]) {
            S.setView([0.1, 0.9], [0, mx]);
            S.path(q.map((x, i) => [x, a[i] / asum]).map(([x, y]) => [x + 0.25 - 0.25, y]), { color: 'ink', width: 1.6, dash: [6, 4] });
          }
          const COL = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
          soc.forEach((w, k) => L.dots(w.map((s, i) => [q[i], s]), { r: 2.8, color: COL[k], alpha: 0.85 }));
          ind.forEach((w, k) => Rr.dots(w.map((s, i) => [q[i], s]), { r: 2.8, color: COL[k], alpha: 0.85 }));
          const rank = (w) => { const o = w.map((s, i) => [s, i]).sort((x, y) => y[0] - x[0]); const r = new Array(NS); o.forEach(([, i], k) => (r[i] = k + 1)); return r; };
          const rb = soc.map((w) => rank(w)[NS - 1]), rw = soc.map((w) => rank(w)[0]);
          st = { gs: soc.map(gini), gi: ind.map(gini), us: unpred(soc), ui: unpred(ind), rb, rw, beta };
        });
        v.legend([['ink', 'expected share if choices are independent', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const m = (x) => x.reduce((p, r) => p + r, 0) / x.length;
          return String.raw`Gini coefficient of the 48 market shares: social worlds **${v.fix(m(st.gs), 2)}** (range ${v.fix(Math.min(...st.gs), 2)}–${v.fix(Math.max(...st.gs), 2)}), independent groups **${v.fix(m(st.gi), 2)}** · unpredictability (mean difference in a song's share between two worlds): social **${v.fix(100 * st.us, 2)}** vs independent **${v.fix(100 * st.ui, 2)}** percentage points
The best song's rank across the 8 social worlds: ${Math.min(...st.rb)} to ${Math.max(...st.rb)}; the worst song's: ${Math.min(...st.rw)} to ${Math.max(...st.rw)} (out of 48)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Phenomenon',
      name: 'Gibrat’s proportional growth and city-size laws',
      statement: String.raw`**Gibrat's law of proportional effect**: if the growth rate of each entity (firm, city) is independent of its size, then $\ln(\text{size})$ performs a random walk and the distribution of sizes becomes **lognormal**, with a spread that grows with time and no stationary limit.

**Zipf's law for cities**: ranked by population, the $r$th largest city has size roughly $S_r\approx S_1/r$: the rank–size plot is a line of slope $-1$ on log–log axes, equivalently the tail $P(S>s)\propto s^{-\zeta}$ with $\zeta\approx1$.

**Gabaix (1999)** showed that the two are linked: if cities grow proportionally *and* have a **lower reflecting barrier** (very small cities cannot shrink without bound), the stationary size distribution is a power law with $\zeta=1$ when cities' mean relative growth is the same (zero in relative terms). Zipf's law is thus a property of the *process* (random multiplicative growth with a floor), not of any particular city.`,
      idea: String.raw`Write $x=\ln S$. Proportional growth gives a random walk with variance $\sigma^2$ per step and drift $\mu-\sigma^2/2$ for mean relative growth $\mu$. A walk with negative drift confined above a barrier settles to an exponential law $P(x>y)\propto e^{-\zeta y}$ with $\zeta=2\,|\text{drift}|/\sigma^2$; in the variable $S=e^x$ this is the power law $P(S>s)\propto s^{-\zeta}$. If the mean *relative* growth of every city is zero (they all grow with the economy), the drift is $-\sigma^2/2$, so $\zeta=1$. Without the barrier the walk spreads without limit, giving the lognormal. The Pareto/Zipf form is the same one that preferential attachment (4.9) produces by another route.`,
      caption: String.raw`**Left**: a model: 2000 cities of equal size grow by random factors for $T$ steps (each step multiplies by $e^{\sigma z-\sigma^2/2}$, mean 1); with the barrier on, none may fall below its starting size. The rank–size curve straightens towards slope $-1$ (dashed line); with the barrier off it keeps bending (lognormal). **Right**: the 30 largest US cities (2020 census): size against rank on the same axes.`,
      scope: String.raw`Real city-size distributions fit Zipf's law only approximately (the exponent depends on how a "city" is defined and on the country; the largest cities are often off the line) and the barrier is a modelling assumption that critics find artificial (cities can disappear, and the mean growth need not be equal across sizes). The simulation is a model; the US figures are census counts for the 30 largest cities by the 2025 estimate.`,
      deps: ['soc-4.7', 'geog-9.9'],
      refs: ['Newman ch. 10'],
      tags: ['Zipf', 'city sizes', 'proportional growth'],
      credit: 'Gibrat, 1931; Zipf, 1949; Gabaix, 1999',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Zipf%27s_law#City_sizes', doi: 'https://doi.org/10.1162/003355399556133' },
      verify: true,
      viz(v) {
        const barrier = v.toggle('reflecting lower barrier', true);
        const tS = v.slider('time steps $T$', 10, 1500, 800, { log: true, int: true, sig: 2 });
        const sS = v.slider('volatility $\\sigma$ per step', 0.05, 0.3, 0.12, { step: 0.01 });
        const N = 2000;
        const A = v.stage({ x: [1, N], y: [0.5, 1e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'rank $r$', ylabel: 'size (in units of the floor)', title: 'model: 2000 cities', minWidth: 300, weight: 1.1 });
        const B = v.stage({ x: [1, 40], y: [1e5, 2e7], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'rank $r$', ylabel: 'population', title: 'the 30 largest US cities, 2020', minWidth: 280, weight: 1 });
        const cache = {};
        const run = (T, s, b) => { const k = `${T}|${s}|${b}`; if (cache[k]) return cache[k]; if (Object.keys(cache).length > 30) for (const x in cache) delete cache[x]; const R = rng32(11), x = new Float64Array(N).fill(1); for (let t = 0; t < T; t++) for (let i = 0; i < N; i++) { x[i] *= Math.exp(s * gaussDraw(R) - s * s / 2); if (b && x[i] < 1) x[i] = 1; } return (cache[k] = Float64Array.from(x).sort().reverse()); };
        const slopeTop = (arr, m) => { const xs = [], ys = []; for (let r = 1; r <= m; r++) { xs.push(Math.log(arr[r - 1])); ys.push(Math.log(r)); } return lsq(xs, ys).slope; };
        const usSizes = US.map((c) => c[1]);
        let st = null;
        v.render(() => {
          const T = Math.round(tS.value), s = sS.value, b = barrier.value, arr = run(T, s, b);
          const top = arr[0];
          A.setView([1, N], [0.5, Math.max(30, top * 2)]);
          const pts = []; for (let r = 1; r <= N; r += (r < 20 ? 1 : Math.ceil(r * 0.03))) pts.push([r, arr[r - 1]]);
          A.path(pts, { color: 'accent', width: 2.4 });
          A.fn((r) => top / r, { color: 'ink', width: 1.5, dash: [6, 4], domain: [1, N] });
          B.fn((r) => usSizes[0] / r, { color: 'ink', width: 1.5, dash: [6, 4], domain: [1, 40] });
          B.dots(usSizes.map((p, i) => [i + 1, p]), { r: 4, color: 'accent' });
          [0, 1, 2, 9].forEach((i) => B.text(US[i][0], i + 1, usSizes[i], { dx: 8, dy: -8, size: 10.5, color: 'muted', align: 'left' }));
          st = { top, T, b, sl: slopeTop(arr, 200), slAll: slopeTop(arr, 1000), us: lsq(usSizes.map((x) => Math.log(x)), usSizes.map((_, i) => Math.log(i + 1))).slope, med: arr[N >> 1] };
        });
        v.legend([['accent', 'sizes by rank'], ['ink', 'Zipf: size ∝ 1/rank', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          return String.raw`After $T=${st.T}$ steps ${st.b ? 'with' : 'without'} the barrier: fitted slope of log-rank on log-size for the top 200 cities **${v.fix(st.sl, 2)}** (Zipf: −1), top 1000: ${v.fix(st.slAll, 2)} · largest city ${Math.round(st.top).toLocaleString('en-US')}× the floor · median city ${v.fix(st.med, 1)}× the floor
US cities: fitted slope for the top 30 is **${v.fix(st.us, 2)}**; New York ÷ 10 = ${Math.round(US[0][1] / 10).toLocaleString('en-US')} against the tenth-largest ${US[9][1].toLocaleString('en-US')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Model',
      name: 'The configuration model',
      statement: String.raw`Given a degree sequence $(k_1,\dots,k_n)$ with even sum, the **configuration model** gives vertex $i$ a number $k_i$ of half-edges ("stubs") and pairs all stubs uniformly at random; it is a uniformly random multigraph with that degree sequence (conditioning on "simple" gives a uniform simple graph). It keeps the degrees and randomises everything else, so it is the null model for "what follows from the degrees alone?".

With degree distribution $p_k$ and mean $\langle k\rangle$:

(a) The degree of a vertex reached by following a random edge is **size-biased**: it equals $k+1$ with probability $q_k=(k+1)p_{k+1}/\langle k\rangle$, so the **mean excess degree** (the number of *other* neighbours) is $\langle k^2\rangle/\langle k\rangle-1$.

(b) Since friends have degree $\langle k^2\rangle/\langle k\rangle$ on average, which exceeds $\langle k\rangle$ whenever the degrees vary (Cauchy–Schwarz), this explains the **friendship paradox** (soc-2.4) in closed form.

(c) **Molloy–Reed criterion**: a giant component exists iff $\langle k^2\rangle-2\langle k\rangle>0$, i.e. when the mean excess degree exceeds 1 (the analogue of $c>1$ in 4.2); its size follows from $u=\sum_k q_k u^{k}$ and $S=1-\sum_kp_ku^k$.`,
      idea: String.raw`Pick an edge at random and then an end of it: you land on a vertex of degree $k$ with probability proportional to $k\,p_k$, because a vertex with $k$ stubs has $k$ chances of being chosen. That single observation, normalised, is $q_k$. Exploring a component then behaves like a branching process whose offspring distribution is $q_k$ (not $p_k$) after the first step, so the process survives exactly when its mean $\langle k^2\rangle/\langle k\rangle-1$ exceeds one, and the extinction probability $u$ is the fixed point of its generating function $G_1(u)=\sum_k q_ku^k$. For Poisson degrees $q=p$ and the criterion is $c>1$ (4.2); for heavy-tailed $p_k$, $\langle k^2\rangle$ is huge and a giant component exists however sparse the network.`,
      caption: String.raw`A model: 3000 vertices with a degree sequence from the chosen family, wired by random stub matching (loops and repeated pairs dropped). **Left**: the degree distribution $p_k$ (bars) and the excess-degree distribution measured at random edge ends (dots) against $(k+1)p_{k+1}/\langle k\rangle$ (line). **Right**: mean degree of a vertex's neighbours against its own degree: flat at $\langle k^2\rangle/\langle k\rangle$, above the diagonal for most vertices (the friendship paradox). Compare the giant component with the prediction.`,
      scope: String.raw`Exact for the multigraph model as $n\to\infty$ with bounded moments; with $n=3000$, loops and multiple edges are dropped, which matters for the high-degree tail of the power-law family (capped at degree 800). The power-law family has exponent about 2.5 and minimum degree set by the slider.`,
      deps: ['soc-4.1', 'soc-2.4'],
      refs: ['Newman ch. 12'],
      tags: ['configuration model', 'degree', 'friendship paradox'],
      credit: 'Bender & Canfield, 1978; Bollobás, 1980; Molloy & Reed, 1995; Newman, Strogatz & Watts, 2001',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Configuration_model' },
      verify: true,
      viz(v) {
        const fam = v.select('degree distribution', [{ value: 'poisson', label: 'Poisson' }, { value: 'geometric', label: 'geometric' }, { value: 'power', label: 'power law' }, { value: 'bimodal', label: 'leaves and hubs' }, { value: 'regular', label: 'regular' }], 'geometric');
        const cS = v.slider('mean degree (about)', 1, 8, 3, { step: 0.25 });
        let seed = 2; v.button('Resample', () => { seed++; });
        const n = 3000, KM = 20;
        const A = v.stage({ x: [-0.5, KM + 0.5], y: [0, 0.5], axes: 'box', gutter: true, height: 340, xlabel: 'degree $k$', ylabel: 'probability', title: 'degrees and excess degrees', minWidth: 300, weight: 1.1 });
        const B = v.stage({ x: [0, KM], y: [0, 20], axes: 'box', gutter: true, height: 340, xlabel: 'own degree $k$', ylabel: 'mean degree of neighbours', title: 'friendship paradox', minWidth: 280, weight: 1 });
        const cache = {};
        const build = () => { const key = `${fam.value}|${cS.value}|${seed}`; if (cache[key]) return cache[key]; const R = rng32(seed * 91 + 5), seq = degreeSequence(fam.value, n, cS.value, R), { g, dropped } = configModel(seq, R); return (cache[key] = { g, dropped }); };
        let st = null;
        v.render(() => {
          const { g, dropped } = build(), deg = g.adj.map((a) => a.length), m2 = g.edges.length;
          const p = new Float64Array(2000); for (const d of deg) p[d] += 1 / n;
          let mean = 0, k2 = 0; deg.forEach((d) => { mean += d / n; k2 += d * d / n; });
          const qm = new Float64Array(2000); for (const [a, b] of g.edges) { qm[deg[a] - 1] += 1 / (2 * m2); qm[deg[b] - 1] += 1 / (2 * m2); }
          let peak = 0.1; for (let k = 0; k <= KM; k++) { peak = Math.max(peak, p[k], qm[k]); if (p[k]) A.rect(k - 0.4, 0, k, p[k], { fill: 'accent', fillAlpha: 0.6, stroke: false }); }
          A.setView([-0.5, KM + 0.5], [0, peak * 1.2]);
          const qt = (k) => ((k + 1) * p[k + 1]) / mean;
          A.path(Array.from({ length: KM + 1 }, (_, k) => [k, qt(k)]), { color: 'ink', width: 1.8 });
          A.dots(Array.from({ length: KM + 1 }, (_, k) => [k, qm[k]]), { r: 4, color: 'orange' });
          // neighbour degrees
          const nd = deg.map((d, i) => (d ? g.adj[i].reduce((s, j) => s + deg[j], 0) / d : NaN)), sum = new Float64Array(KM + 1), cnt = new Float64Array(KM + 1);
          let higher = 0, nz = 0; deg.forEach((d, i) => { if (d > 0) { nz++; if (nd[i] > d) higher++; if (d <= KM) { sum[d] += nd[i]; cnt[d]++; } } });
          const kap = k2 / mean, pts = []; for (let k = 1; k <= KM; k++) if (cnt[k] >= 3) pts.push([k, sum[k] / cnt[k]]);
          B.setView([0, KM], [0, Math.max(10, kap * 1.5, ...pts.map((x) => x[1])) * 1.1]);
          B.line(0, 0, KM, KM, { color: 'muted', width: 1.2, dash: [5, 4] });
          B.hline(kap, { color: 'green', width: 2 });
          B.dots(pts, { r: 3.6, color: 'accent' });
          // generating functions
          let u = 0; for (let i = 0; i < 400; i++) { let s = 0; for (let k = 1; k < 2000; k++) s += k * p[k] * Math.pow(u, k - 1) / mean; u = s; }
          let G0 = 0; for (let k = 0; k < 2000; k++) G0 += p[k] * Math.pow(u, k);
          const comp = components(g);
          st = { mean, k2, kap, higher: higher / nz, S: 1 - G0, Sm: comp[0].length / n, mr: k2 - 2 * mean, dropped, maxd: Math.max(...deg) };
        });
        v.legend([['accent', 'degree distribution $p_k$', { area: true }], ['orange', 'measured excess degree at random edge ends', { dot: true }], ['ink', '$(k+1)p_{k+1}/\\langle k\\rangle$'], ['green', '$\\langle k^2\\rangle/\\langle k\\rangle$']]);
        v.readout(() => {
          if (!st) return '';
          const { mean, k2, kap, higher, S, Sm, mr, dropped, maxd } = st;
          return String.raw`$\langle k\rangle=${v.fix(mean, 2)}$, $\langle k^2\rangle=${v.fix(k2, 1)}$ (largest degree ${maxd}) → friends have **${v.fix(kap, 2)}** friends on average, and **${v.fix(100 * higher, 0)}%** of vertices have friends with a higher mean degree than their own · mean excess degree ${v.fix(kap - 1, 2)}
Molloy–Reed: $\langle k^2\rangle-2\langle k\rangle=${v.fix(mr, 1)}$ ${mr > 0 ? '> 0: giant component' : '≤ 0: none'} · predicted giant component **${v.fix(100 * S, 1)}%**, measured **${v.fix(100 * Sm, 1)}%** (${dropped} loops/repeats dropped)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15',
      kind: 'Phenomenon',
      name: 'The long tail',
      statement: String.raw`Sales of books, songs or films are very unequal: ranked by sales, the $r$th best-selling item sells roughly $r^{-\alpha}$ (a Zipf-like law with $\alpha$ near 1). A shop with limited shelf space stocks only the top $S$ items; an online store can stock $N\gg S$. The share of total demand that lies **beyond the shelf** is
$$\frac{\sum_{r=S+1}^{N}r^{-\alpha}}{\sum_{r=1}^{N}r^{-\alpha}},$$
which is large when the exponent $\alpha$ is near 1 or below: for $\alpha\le1$ the sum diverges with $N$, so each additional decade of titles adds a comparable or growing amount of demand, whereas for $\alpha>1$ the hits dominate.

Chris Anderson's *The Long Tail* (Wired, 2004, book 2006) argued that digital distribution makes the tail a large market. Brynjolfsson, Hu and Smith (2003), fitting a power law to Amazon's book sales, estimated that books not typically stocked by physical stores accounted for roughly 39% of Amazon's 2000 sales, and valued the added variety at \$731 million to \$1.03 billion a year. The claim that tail markets will rival hits is **contested**: studies of music-streaming data (Elberse, 2008) found the tail real but thin, with the top 1% of titles taking about a third of plays.`,
      idea: String.raw`The demand beyond shelf position $S$ is the area under a power-law curve to the right of $S$: $\int_S^N r^{-\alpha}\,dr=\frac{S^{1-\alpha}-N^{1-\alpha}}{\alpha-1}$. When $\alpha<1$ this grows without bound as the catalogue is extended; when $\alpha>1$ it converges to a fixed amount, so the shares of the head and of the tail are set by $\alpha$ and by the ratio $N/S$. The economics follow: online stores change the *number of titles that can be stocked* (cheap storage and search), which raises $N$ and $S$ in the formula, not the shape of demand itself, and the effect on welfare depends on how much demand lives in the extension.`,
      caption: String.raw`A model of demand $\propto r^{-\alpha}$. **Left**: sales per title against rank on log–log axes with the shelf limit $S$ and catalogue size $N$; the shaded region is demand that a shop with shelf $S$ cannot serve. **Right**: the cumulative share of demand against catalogue size. Drag $\alpha$ (about 0.8 to 1.2 for books and music) and the shelf size to see how strongly the tail share depends on the exponent.`,
      scope: String.raw`Zipf-like demand is an idealisation; fitted exponents depend on the data set and the range of ranks, and the extrapolation of a power law far beyond observed ranks (as in the 39% estimate) is the contested step. The 39% and the welfare figures are as reported secondhand (from the authors' 2010 follow-up and abstract); the plot itself is a model, not Amazon's data.`,
      deps: ['soc-4.7'],
      refs: ['E&K §18.5'],
      tags: ['long tail', 'Zipf', 'markets'],
      credit: 'Anderson, 2004; Brynjolfsson, Hu & Smith, 2003; Elberse, 2008',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Long_tail' },
      verify: true,
      viz(v) {
        const aS = v.slider('Zipf exponent $\\alpha$', 0.5, 1.6, 0.9, { step: 0.01 });
        const sS = v.slider('shelf size $S$ (titles)', 100, 1e6, 1e5, { log: true, sig: 2 });
        const nS = v.slider('catalogue size $N$', 1e3, 1e8, 3e6, { log: true, sig: 2 });
        const harm = (r, a) => { const K = Math.min(r, 1000); let s = 0; for (let i = 1; i <= K; i++) s += Math.pow(i, -a); if (r > K) s += (Math.abs(a - 1) < 1e-9 ? Math.log(r / K) : (Math.pow(r, 1 - a) - Math.pow(K, 1 - a)) / (1 - a)) + 0.5 * (Math.pow(r, -a) - Math.pow(K, -a)); return s; };
        const A = v.stage({ x: [1, 1e8], y: [1e-10, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'rank $r$', ylabel: 'sales of the $r$th title', title: 'sales by rank (relative)', minWidth: 300, weight: 1.1 });
        const B = v.stage({ x: [1, 1e8], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 340, xlabel: 'titles stocked $r$', ylabel: 'share of demand served', title: 'cumulative demand', minWidth: 280, weight: 1 });
        let st = null;
        v.render(() => {
          const a = aS.value, N = Math.max(nS.value, 2 * sS.value), S = Math.min(sS.value, N / 2), tot = harm(N, a);
          const f = (r) => Math.pow(r, -a) / tot, hS = harm(S, a);
          A.between(() => 1e-10, f, S, N, { fill: 'orange' });
          A.fn(f, { color: 'accent', width: 2.4, domain: [1, N] });
          A.vline(S, { color: 'gold', width: 1.6, dash: true }); A.vline(N, { color: 'muted', width: 1.2, dash: [4, 4] });
          A.text('shelf', S, 3e-10, { dx: -6, size: 11, color: 'gold', align: 'right', weight: 700 }); A.text('catalogue', N, 3e-10, { dx: -6, size: 11, color: 'muted', align: 'right' });
          B.fn((r) => harm(Math.max(1, Math.round(r)), a) / tot, { color: 'accent', width: 2.4, domain: [1, N], n: 160 });
          B.vline(S, { color: 'gold', width: 1.6, dash: true }); B.vline(N, { color: 'muted', width: 1.2, dash: [4, 4] });
          const head = hS / tot; B.dot(S, head, { r: 5, color: 'gold' });
          B.hline(1, { color: 'faint', width: 1 });
          st = { a, S, N, tail: 1 - head, head, top1: harm(Math.max(1, Math.round(0.01 * N)), a) / tot };
        });
        v.legend([['accent', 'sales $\\propto r^{-\\alpha}$'], ['orange', 'beyond the shelf', { area: true }], ['gold', 'shelf limit $S$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { a, S, N, tail, head, top1 } = st;
          const fm = (x) => (x >= 1e6 ? `${(x / 1e6).toPrecision(2)} million` : x >= 1e3 ? `${(x / 1e3).toPrecision(2)} thousand` : String(Math.round(x)));
          return String.raw`$\alpha=${v.fix(a, 2)}$, shelf ${fm(S)} of ${fm(N)} titles → the shelf serves **${v.fix(100 * head, 1)}%** of demand and **${v.fix(100 * tail, 1)}%** lies in the tail · the top 1% of titles take ${v.fix(100 * top1, 0)}% of demand
Reported: niche books ≈ 39% of Amazon's 2000 sales (extrapolated power-law fit, Brynjolfsson et al.); Rhapsody streams: top 1% ≈ 32% of plays (Elberse)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16',
      kind: 'Concept',
      name: 'The bow-tie structure of the Web',
      statement: String.raw`In a directed graph such as the Web (pages are vertices, hyperlinks are directed edges), the vertices fall into regions determined by reachability. Broder and colleagues (2000) analysed two AltaVista crawls of 1999 (about 200 million pages and 1.5 billion links) and found a **bow-tie**:

(a) a giant **strongly connected core (SCC)**, in which every page can reach every other by following links (56.5 million pages, 27.7% of the May 1999 crawl);
(b) **IN**, pages that can reach the core but cannot be reached from it (43.3 million, 21.3%);
(c) **OUT**, pages reachable from the core with no path back (43.2 million, 21.2%);
(d) **tendrils** (43.8 million, 21.5%): pages attached only to IN or OUT, including "tubes" that link IN directly to OUT;
(e) **disconnected** pieces (16.8 million, 8.2%).

The core is a single strongly connected component because directed random graphs have exactly this structure above the giant-component threshold; the proportions of the regions, however, are properties of the crawl and the date and have changed since.`,
      idea: String.raw`In a directed random graph with mean out-degree $c>1$, a vertex reaches a giant set with probability $S$ (the branching-process survival probability of 4.2, $S=1-e^{-cS}$) and is reached from a giant set with the same probability. The core is the intersection, of relative size $S^2$; IN and OUT are the vertices that only reach, or are only reached by, the giant set (each $S(1-S)$); the rest, $(1-S)^2$, are the tendrils, tubes and disconnected parts. The Web's four big regions of similar size are what a not-too-sparse directed graph with heavy-tailed degrees tends to produce; a bow-tie shape does *not* mean the Web is a random graph.`,
      caption: String.raw`A model, not a crawl: 400 pages with random directed links, mean out-degree $c$. The page classes (core, IN, OUT, tendrils and tubes, disconnected) are computed by actual reachability searches and laid out as a bow-tie. **Right**: the shares of the six classes in this graph against the shares in the 1999 AltaVista crawl and the large-$n$ prediction for directed random graphs ($S^2$ for the core, $S(1-S)$ for IN and OUT). Drag $c$ across 1 to see the core appear.`,
      scope: String.raw`The percentages for AltaVista are the figures in the original paper (May 1999 crawl, 203,549,046 pages; the paper lists tendrils as one class, here labelled as such, and calls the tubes a sub-class). The simulated graph is a plain directed Erdős–Rényi graph with only 400 vertices, so its classes fluctuate from draw to draw and the tubes are rare.`,
      deps: ['soc-2.2'],
      refs: ['E&K §13.4'],
      tags: ['web', 'directed graphs', 'connectivity'],
      credit: 'Broder, Kumar, Maghoul, Raghavan, Rajagopalan, Stata, Tomkins & Wiener, 2000',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bow-tie_structure' },
      verify: true,
      viz(v) {
        const cS = v.slider('mean out-degree $c$', 0.3, 4, 1.6, { step: 0.05 });
        let seed = 4; v.button('New graph', () => { seed++; });
        const n = 400;
        const A = v.stage({ x: [-1.3, 1.3], y: [-1, 1], equal: false, axes: false, height: 360, title: 'a 400-page web (model)', minWidth: 320, weight: 1.3 });
        const B = v.stage({ x: [0, 6], y: [0, 0.6], axes: 'box', gutter: true, height: 360, xticks: [[0.5, 'core'], [1.5, 'IN'], [2.5, 'OUT'], [3.5, 'tendr.'], [4.5, 'disc.']], xlabel: 'region of the bow-tie', ylabel: 'share of pages', title: 'shares of the regions', minWidth: 280, weight: 1 });
        const cache = {};
        const make = (c) => { const k = `${c.toFixed(2)}|${seed}`; if (cache[k]) return cache[k]; const R = rng32(seed * 53 + Math.round(c * 100)); const G = digraphGnp(n, c, R), bt = bowTie(G); const pos = [], P = rng32(seed + 99); const box = { scc: [-0.3, 0.3, -0.35, 0.35], in: [-1.15, -0.45, -0.4, 0.4], out: [0.45, 1.15, -0.4, 0.4], tendril: [-1.0, 1.0, 0.55, 0.95], tube: [-0.35, 0.35, 0.5, 0.75], disc: [-1.2, 1.2, -0.95, -0.6] };
          for (let i = 0; i < n; i++) { let b = box[bt.type[i]]; if (bt.type[i] === 'tendril' && P() < 0.5) b = [-1.0, 1.0, -0.95, -0.55]; if (bt.type[i] === 'disc') b = [-1.2, 1.2, -0.95, -0.6]; pos.push([b[0] + (b[1] - b[0]) * P(), b[2] + (b[3] - b[2]) * P()]); }
          return (cache[k] = { G, bt, pos }); };
        const COL = { scc: 'gold', in: 'accent', out: 'green', tendril: 'orange', tube: 'purple', disc: 'muted' };
        let st = null;
        v.render(() => {
          const c = cS.value, { G, bt, pos } = make(c);
          for (let i = 0; i < n; i++) for (const j of G.out[i]) A.line(pos[i][0], pos[i][1], pos[j][0], pos[j][1], { color: 'faint', width: 0.6, alpha: 0.55 });
          for (let i = 0; i < n; i++) A.dot(pos[i][0], pos[i][1], { r: 3, color: COL[bt.type[i]] });
          A.text('IN', -0.8, 0.5, { size: 12, weight: 700, color: 'accent' }); A.text('OUT', 0.8, 0.5, { size: 12, weight: 700, color: 'green' }); A.text('core', 0, 0.42, { size: 12, weight: 700, color: 'gold' });
          const cn = bt.counts, S = giantTheory(c);
          const mine = [cn.scc, cn.in, cn.out, cn.tendril + cn.tube, cn.disc].map((x) => x / n);
          const paper = [56463993, 43343168, 43166185, 43797944, 16777756].map((x) => x / 203549046);
          const theory = [S * S, S * (1 - S), S * (1 - S)];
          B.setView([0, 6], [0, 0.6]);
          mine.forEach((x, i) => { B.rect(i + 0.08, 0, i + 0.38, x, { fill: 'accent', fillAlpha: 0.7, stroke: false }); B.rect(i + 0.42, 0, i + 0.72, paper[i], { fill: 'orange', fillAlpha: 0.7, stroke: false }); });
          theory.forEach((x, i) => B.dot(i + 0.23, x, { r: 4.5, color: 'ink', hollow: true }));
          st = { c, cn, S, mine, paper, theory };
        });
        v.legend([['gold', 'core (SCC)', { dot: true }], ['accent', 'IN', { dot: true }], ['green', 'OUT', { dot: true }], ['orange', 'tendrils', { dot: true }], ['purple', 'tubes', { dot: true }], ['muted', 'disconnected', { dot: true }], ['ink', 'large-$n$ theory', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { c, cn, S, mine, paper, theory } = st, p = (x) => `${v.fix(100 * x, 1)}%`;
          return String.raw`$c=${v.fix(c, 2)}$: this graph — core ${p(mine[0])}, IN ${p(mine[1])}, OUT ${p(mine[2])}, tendrils ${p(mine[3])} (of which ${cn.tube} tube pages), disconnected ${p(mine[4])} · large-$n$ theory $S=${v.fix(S, 3)}$: core $S^2=${p(theory[0])}$, IN and OUT $S(1-S)=${p(theory[1])}$ each
AltaVista, May 1999 (bars in orange): core ${p(paper[0])}, IN ${p(paper[1])}, OUT ${p(paper[2])}, tendrils ${p(paper[3])}, disconnected ${p(paper[4])}`;
        });
      },
    },
  ],
};
