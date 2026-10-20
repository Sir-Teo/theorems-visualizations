import {catalogueModel,SHELF_PERCENT} from './source-audit-catalogue.js';
import {webSeedValid,webModel,WEB_REGIONS,WEB_LABELS,WEB_PUBLISHED,WEB_TOTAL} from './source-audit-bowtie.js';
import {marketSeedValid,MARKET_APPEAL,marketModel} from './source-audit-musiclab.js';
// Networks & Collective Behavior — Chapter 4, part c: heavy tails in the wild (items 4.12–4.16)
//
// Sources checked (Oct 2026): Salganik, Dodds & Watts, Science 311: 854–856 (2006), doi 10.1126/science.1121066 — 14,341
// participants, 48 songs, eight "social influence" worlds plus an independent condition, inequality by the Gini coefficient and
// unpredictability u_i = average difference in market share of song i between pairs of worlds (text of the paper and its SOM);
// Gabaix, QJE 114 (3): 739–767 (1999) — Zipf's law for cities from proportional (Gibrat) growth with a lower reflecting barrier;
// US populations are the 2020 census counts of the 30 largest cities as listed on Wikipedia (List of United States cities by
// population, Oct 2026); Brynjolfsson, Hu & Smith, Management Science 49 (11): 1580–1596 (2003), original §4.2/Table4:
// fitted2001 rank data and2.3-million catalogue imply39.2% of Amazon unit sales beyond rank100,000;
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
      num:'4.12',kind:'Phenomenon',name:'Unpredictable success in cultural markets (MusicLab)',
      statement:String.raw`Salganik, Dodds and Watts report two web experiments involving 14,341 participants and 48 previously unknown songs. Within each experiment, participants were randomly assigned to an independent condition or one of eight social-influence worlds. Influence participants saw their own world's previous download counts; the independent condition did not.

In both experiments all eight influence worlds had more unequal download shares than the independent condition. Song shares also varied more across influence worlds than across random splits of independent participants. Independent-condition popularity supplied a population-specific measure of “quality,” which only partly predicted influence-world success.

The presentation differed between experiments: experiment 1 used a randomly ordered grid; experiment 2 displayed influence songs in popularity order in a single column. Increased inequality and unpredictability in experiment 2 accompanied this stronger presentation of social information. Recruitment demographics also changed between experiments; these are experimental findings with declared design limits, not universal laws about every market.`,
      idea:String.raw`Parallel worlds allow comparison of several histories with the same songs and initially zero downloads. A fixed predisposition toward an item and feedback from earlier choices can jointly affect outcomes. The reported empirical results do not establish that a particular reinforcement formula generated participants' behavior, or that every stronger feedback value raises inequality in every finite realization.`,
      caption:String.raw`An authored feedback model, with 48 fixed appeal coordinates $q_i=(i+1/2)/48$, $i=0,\ldots,47$. Each listener makes exactly one choice with probability proportional to $(0.25+q_i)(1+d_i)^\beta$. Left: all 48 shares in each of eight seeded feedback worlds. Right: eight same-size no-feedback worlds, paired by seed. The dashed curve is the exact no-feedback expected share. Change feedback, size or seed; at $\beta=0$ the paired panels agree exactly.`,
      scope:String.raw`The empirical summary is checked against the original report and its supporting experimental design. The simulation is not experimental data, a fit, or a replay of the listening/rating/optional-download process. Its eight no-feedback worlds differ from the paper's one independent world and random-split comparison. “Appeal” is an authored positive weight, not measured quality. Deterministic pseudorandom streams are reused across parameter settings; finite scatter and metric changes are observations of this model only.`,
      deps:['soc-4.9'],refs:['Salganik, Dodds & Watts, Science 311:854–856 (2006), Figs.1–3; supporting design and participant Tables S1–S2'],tags:['cumulative advantage','cultural markets','experiment'],credit:'Experimental findings: Salganik, Dodds & Watts, 2006; feedback simulation authored here.',links:{source:'https://www.princeton.edu/~mjs3/salganik_dodds_watts06_full.pdf',doi:'https://doi.org/10.1126/science.1121066'},verify:false,
      viz(v){
        let seed=1,cache=new Map(),st;v.shareState('feedback market seed',{get:()=>seed,validate:marketSeedValid,set:x=>{seed=x;cache.clear();}});
        const beta=v.slider('feedback exponent beta',0,2,.8,{step:'any',fmt:x=>x.toPrecision(6)}),size=v.select('listeners per world',[200,1000,4000].map(value=>({value,label:String(value)})),1000);v.button('New worlds',()=>{seed=(seed+1)>>>0;cache.clear();});
        const L=v.stage({x:[-.04,1.04],y:[-.01,.2],axes:'box',gutter:true,height:340,xlabel:'authored appeal coordinate q',ylabel:'share of choices',title:'eight feedback worlds',minWidth:260}),R=v.stage({x:[-.04,1.04],y:[-.01,.2],axes:'box',gutter:true,height:340,xlabel:'authored appeal coordinate q',ylabel:'share of choices',title:'eight no-feedback worlds',minWidth:260});
        const sim=b=>{const key=`${b}|${size.value}|${seed}`;if(!cache.has(key)){if(cache.size>=8)cache.delete(cache.keys().next().value);cache.set(key,marketModel(b,size.value,seed));}return cache.get(key);};
        v.render(()=>{const social=sim(beta.value),independent=sim(0),top=Math.max(.05,...social.shares.flat(),...independent.shares.flat()),expected=MARKET_APPEAL.map(q=>(.25+q)/36),colors=['accent','orange','green','purple','teal','pink','gold','red'];for(const[S,m]of[[L,social],[R,independent]]){S.setView([-.04,1.04],[-.04*top,1.1*top]);S.path(MARKET_APPEAL.map((q,i)=>[q,expected[i]]),{color:'ink',width:1.5,dash:[5,4]});m.shares.forEach((w,j)=>S.dots(w.map((x,i)=>[MARKET_APPEAL[i],x]),{r:2.8,ring:false,color:colors[j],alpha:.8}));}st={social,independent};});
        v.legend([['ink','exact no-feedback expected share',{dash:true}],['accent','each color identifies one paired world',{dot:true}]]);
        v.readout(()=>{const a=st.social,b=st.independent;return `Seed ${seed}; ${a.n} listeners per world; beta ${a.beta.toPrecision(12)}. Mean Gini: feedback ${v.fix(a.meanGini,4)} (range ${v.fix(Math.min(...a.ginis),4)}–${v.fix(Math.max(...a.ginis),4)}), no feedback ${v.fix(b.meanGini,4)}. Mean absolute difference in one song's share across all 28 pairs of worlds: feedback ${v.fix(100*a.unpredictability,4)}, no feedback ${v.fix(100*b.unpredictability,4)} percentage points, averaged over all 48 songs. All 384 observations in each panel are included, including zeros. These finite model metrics are not the paper's experimental estimates.`;});
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
      caption: String.raw`**Left**: a model: 2000 cities of equal size grow by random factors for $T$ steps (each step multiplies by $e^{\sigma z-\sigma^2/2}$, mean 1); with the barrier on, none may fall below its starting size. The rank–size curve straightens towards slope $-1$ (dashed line, drawn through the 10th city); with the barrier off it keeps bending (lognormal). **Right**: the 30 largest US cities (2020 census): size against rank on the same axes.`,
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
          A.fn((r) => (arr[9] * 10) / r, { color: 'ink', width: 1.5, dash: [6, 4], domain: [1, N] });
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
      scope: String.raw`Exact for the multigraph model as $n\to\infty$ with bounded moments; with $n=3000$, loops and multiple edges are dropped, which matters for the high-degree tail of the power-law family (capped at degree 800). The power-law family has exponent about 2.5 (its mean degree follows the slider only roughly, because of the heavy tail).`,
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
        const build = () => { const key = `${fam.value}|${cS.value}|${seed}`; if (cache[key]) return cache[key]; const R = rng32(seed * 91 + 5), seq = degreeSequence(fam.value, n, fam.value === 'power' ? cS.value / 3 : cS.value, R), { g, dropped } = configModel(seq, R); return (cache[key] = { g, dropped }); };
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
          const kap = k2 / mean, pts = []; for (let k = 1; k <= KM; k++) if (cnt[k] >= 10) pts.push([k, sum[k] / cnt[k]]);
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
      num:'4.15',kind:'Model',name:'The long tail',
      statement:String.raw`A finite rank-demand model assigns relative weight $r^{-\alpha}$ to title $r=1,\ldots,N$, with $\alpha>0$. A shelf containing the first $S$ titles serves the head; the remaining model share is
$$T=\frac{\sum_{r=S+1}^N r^{-\alpha}}{\sum_{r=1}^N r^{-\alpha}}.$$
An empty shelf has $T=1$ and a complete shelf has $T=0$. At fixed $N$ and interior $S$, a larger exponent concentrates weight toward the head and reduces the tail share. A larger catalogue at fixed $S$ adds positive tail weight; neither claim fixes how real consumers respond to selection, prices or search.

Brynjolfsson, Hu and Smith's 2003 study fits a sales-rank relationship using a publisher's 2001 data. Its Table 4 estimates 39.2% of Amazon unit sales above rank 100,000 when the available catalogue is taken as 2.3 million titles. This is a model-based estimate, not a direct count of every Amazon transaction or a universal share for online markets.`,
      idea:String.raw`Normalize the finite positive weights by their sum. Moving a title from tail to shelf transfers exactly its normalized weight. For two ranks, one in the head and one in the tail, increasing $\alpha$ favors the smaller head rank, explaining the monotonicity at fixed $N,S$.

For an infinite, unnormalized sequence the series converges when $\alpha>1$ and diverges when $\alpha\le1$. At $\alpha=1$, large rank decades add approximately equal unnormalized weight. Those asymptotic facts do not make a finite normalized tail share a welfare estimate. The cited study uses an integral approximation and additional economic assumptions; this widget directly sums a smaller authored discrete catalogue.`,
      caption:String.raw`Choose catalogue size, shelf percentage and a continuous exponent. All offered sizes are multiples of 100, so the selected shelf percentage gives an exact integer $S$. Left: every title's finite normalized weight, orange beyond the shelf. Right: cumulative shares at every integer rank, joined for readability. A gold guide marks a nonempty shelf. Both plots show positive ranks only; the empty shelf is reported as zero served in the readout.`,
      scope:String.raw`This is a fixed rank-weight assumption with catalogue sizes 100, 1000 or 10000, not Amazon data or the source's 2.3-million-title fit. All normalization and cumulative sums include every offered title and use ordinary binary64 arithmetic, without an Euler–Maclaurin tail approximation. Expanding selection need not leave real demand's shape unchanged. Costs, search, substitution, pricing and consumer valuation are absent; no welfare gain, current market forecast, universal exponent range or unsupported streaming statistic is derived.`,
      deps:['soc-4.7'],refs:['Brynjolfsson, Hu & Smith, Management Science49:1580–1596 (2003), §4.2, Eq.13 and Tables2–4'],tags:['long tail','Zipf','markets'],credit:'Empirical context: Brynjolfsson, Hu & Smith, 2003; finite discrete rank model authored here.',links:{source:'https://oz.stern.nyu.edu/cite05/readings/brynjolfsson4.pdf',doi:'https://doi.org/10.1287/mnsc.49.11.1580.20580'},verify:true,
      viz(v){
        const alpha=v.slider('rank-weight exponent alpha',.5,1.6,.9,{step:'any',fmt:x=>x.toPrecision(6)}),size=v.select('catalogue titles',[100,1000,10000].map(value=>({value,label:String(value)})),1000),shelf=v.select('shelf share of titles',SHELF_PERCENT.map(value=>({value,label:`${value}%`})),10);let cache=null,info;
        const A=v.stage({x:[.7,1400],y:[.00001,.1],xlog:true,ylog:true,axes:'box',gutter:true,height:340,minWidth:260,title:'every finite title weight',xlabel:'title rank r',ylabel:'normalized demand weight'}),B=v.stage({x:[.7,1400],y:[-.06,1.08],xlog:true,axes:'box',gutter:true,height:340,minWidth:260,title:'complete finite cumulative shares',xlabel:'positive title rank r',ylabel:'cumulative share'});
        v.render(()=>{const key=`${alpha.value}|${size.value}|${shelf.value}`;if(!cache||cache.key!==key)cache={key,data:catalogueModel(alpha.value,size.value,shelf.value)};const p=cache.data,l=Math.log(p.n),y0=Math.log(p.weights.at(-1)),y1=Math.log(p.weights[0]),dy=Math.max(1,y1-y0),x=[Math.exp(-.08*l),Math.exp(1.08*l)];A.setView(x,[Math.exp(y0-.08*dy),Math.exp(y1+.08*dy)]);B.setView(x,[-.06,1.08]);A.dots(p.weights.slice(0,p.shelf).map((y,i)=>[i+1,y]),{r:1.3,ring:false,color:'accent'});A.dots(p.weights.slice(p.shelf).map((y,i)=>[p.shelf+i+1,y]),{r:1.3,ring:false,color:'orange'});B.path(p.cumulative,{color:'accent',width:1.8});if(p.shelf){A.line(p.shelf,p.weights.at(-1),p.shelf,p.weights[0],{color:'gold',width:1,dash:[4,4]});B.line(p.shelf,0,p.shelf,p.head,{color:'gold',width:1,dash:[4,4]});B.dot(p.shelf,p.head,{color:'gold',r:4,ring:false});}info=p;});
        v.legend([['accent','shelf weights / cumulative share',{dot:true}],['orange','weights beyond shelf',{dot:true}],['gold','selected nonempty shelf',{dash:true}]]);
        v.readout(()=>{const p=info;return `Finite authored catalogue: ${p.n} titles; shelf ${p.shelf} (${p.percent}% of titles); alpha ${p.alpha.toPrecision(12)}. Served head ${v.fix(100*p.head,6)}%; beyond-shelf tail ${v.fix(100*p.tail,6)}%; top 1% of titles ${v.fix(100*p.topOnePercent,6)}% of model demand. All ${p.n} title weights and cumulative ranks are included. The published 39.2% estimate belongs to its own fitted 2.3-million-title model, not this calculation. No consumer-surplus value is computed.`;});
      },
    },
    // ------------------------------------------------------------------ 4.16
    {
      num:'4.16',kind:'Concept',name:'The bow-tie structure of the Web',
      statement:String.raw`Broder and colleagues' May 1999 AltaVista crawl contained 203,549,046 pages. Their published decomposition reports 56,463,993 in the giant strongly connected core, 43,343,168 in IN, 43,166,185 in OUT, 43,797,944 in TENDRILS (including tubes), and 16,777,756 outside the giant weak component.

Core pages mutually reach one another by directed links. IN pages can reach the core but cannot be reached from it; OUT pages can be reached from the core but cannot return. The remaining pages in that weak component are grouped as tendrils; tubes provide passages from IN to OUT that avoid the core. These measured proportions describe this crawl, not a universal law for all directed or heavy-tailed graphs.`,
      idea:String.raw`For this finite model, compute **every** strongly connected component with Tarjan's algorithm and choose the largest; ties choose the component with the smallest vertex index. Forward and reverse searches from a core vertex determine OUT and IN. Ignoring direction determines the weak component containing that core. Residual vertices in that weak component are split into tubes (reachable from IN and able to reach OUT without visiting the core) and other residual tendrils.

This is an exact classification of the displayed graph. A largest component may be one vertex and need not be a “giant.” Its weak component need not be the graph's largest weak component. The reported “outside weak” fraction uses that explicitly selected core component. In the actual crawl the published core lies in the giant weak component.`,
      caption:String.raw`An authored directed random graph, not Web data. Each ordered pair of distinct pages receives a link with probability $c/(n-1)$, so its expected out-degree is $c$. Every vertex is drawn; optional arrows show every link. Colors identify the six finite classes. Right: finite graph shares versus the original crawl's five reported groups, with tubes included in tendrils. Change size, expected degree or seed; every classification is recomputed from the actual graph.`,
      scope:String.raw`The source's original region table, definitions, Figure 9 legend and derivation of the counts are checked; its complete raw crawl is not reproduced. Source counts combine strong/weak component computation and BFS reach-set inference. The finite illustration uses independent-edge sampling conventions and a full SCC decomposition, without a large-network phase-transition, branching-process or heavy-tail prediction. Node positions are authored and arrows indicate direction only; distances on the drawing have no metric meaning.`,
      deps:['soc-2.2'],refs:['Broder et al., Graph structure in the web (WWW9, 2000), §§1.1, 2.2 and 3, Figure9 and region table'],tags:['web','directed graphs','connectivity'],credit:'Broder, Kumar, Maghoul, Raghavan, Rajagopalan, Stata, Tomkins and Wiener, 2000; exact finite graph illustration authored here.',links:{source:'https://archives.iw3c2.org/www9/w9cdrom/160/160.html'},verify:true,
      viz(v){
        let seed=4,cache=null,info;v.shareState('directed web seed',{get:()=>seed,validate:webSeedValid,set:x=>{seed=x;cache=null;}});
        const size=v.select('pages',[80,200,400].map(value=>({value,label:String(value)})),200),c=v.slider('expected out-degree c',.3,4,1.6,{step:'any',fmt:x=>x.toPrecision(6)}),links=v.toggle('show every directed link',false);v.button('New graph',()=>{seed=(seed+1)>>>0;cache=null;});
        const A=v.stage({x:[-1.4,1.4],y:[-1.12,1.12],axes:false,height:360,minWidth:260,title:'every modeled page; optional link arrows'}),B=v.stage({x:[-67,137],y:[-1,10.5],axes:false,full:true,height:390,minWidth:260,title:'finite graph and reported crawl shares'}),colors={scc:'gold',in:'accent',out:'green',tendril:'orange',tube:'purple',disc:'muted'};
        v.render(()=>{const key=`${size.value}|${c.value}|${seed}`;if(!cache||cache.key!==key)cache={key,data:webModel(size.value,c.value,seed)};const p=cache.data;if(links.value)for(const[i,j]of p.edges)A.arrow(...p.pos[i],...p.pos[j],{color:'faint',width:.6,head:4,alpha:.5});p.pos.forEach(([x,y],i)=>A.dot(x,y,{r:2.5,ring:false,color:colors[p.classes.types[i]]}));A.text('IN',-.8,.44,{align:'center',size:11,color:'accent'});A.text('core',0,.39,{align:'center',size:11,color:'gold'});A.text('OUT',.8,.44,{align:'center',size:11,color:'green'});B.text('share of pages (%)',30,9.9,{align:'center',baseline:'middle',size:11,color:'muted'});B.line(0,-.35,0,9.35,{color:'faint',width:1});WEB_REGIONS.forEach((t,j)=>{const y=9-2*j,a=100*p.shares[j],b=100*WEB_PUBLISHED[j]/WEB_TOTAL;B.text(WEB_LABELS[j],-4,y-.1,{align:'right',baseline:'middle',size:10,color:'ink'});B.rect(0,y+.02,a,y+.36,{fill:'accent',fillAlpha:.7,stroke:false});B.rect(0,y-.42,b,y-.08,{fill:'orange',fillAlpha:.7,stroke:false});B.text(`${v.fix(a,1)}%`,a+3,y+.19,{baseline:'middle',size:10,color:'accent'});B.text(`${v.fix(b,1)}%`,b+3,y-.25,{baseline:'middle',size:10,color:'orange'});});info=p;});
        v.legend([['gold','core',{dot:true}],['accent','IN',{dot:true}],['green','OUT',{dot:true}],['orange','other tendrils',{dot:true}],['purple','tube subset',{dot:true}],['muted','outside core weak component',{dot:true}]]);
        v.readout(()=>{const p=info,k=p.classes.counts;return `Seed ${seed}; ${p.n} pages, ${p.edges.length} directed links; realized mean out-degree ${v.fix(p.edges.length/p.n,4)} versus expected ${p.c.toPrecision(12)}. Exact core ${k.scc}; IN ${k.in}; OUT ${k.out}; other residual tendrils ${k.tendril}; tubes ${k.tube}; outside core weak component ${k.disc}. Counts sum to ${p.n}. The selected core's weak component contains ${p.classes.weakSize} vertices. Bars: blue finite model; orange published May 1999 crawl. Tubes are combined with tendrils in both five-group comparisons. A largest finite SCC is not automatically a giant component.`;});
      },
    },
  ],
};
