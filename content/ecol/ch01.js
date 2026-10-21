// Ecology — Chapter 1: Organisms, energy and scaling (items 1.1–1.7; 1.8–1.14 are in ch01-b.js)
import { KB, mammals, bmrW, scatterGroups, groupLegend, hoverPick, find, logFit, fixedSlope, fx, massTxt } from './ch01.shared.js';

// ── helpers for this file ─────────────────────────────────────────────────────────────────────────────────
/** Deutsch-style thermal performance curve: Gaussian rise to the optimum, quadratic fall to the critical maximum. */
const tpc = (T, p) => (T < p.opt ? Math.exp(-(((T - p.opt) / (2 * p.sd)) ** 2)) : Math.max(0, 1 - ((T - p.opt) / (p.ct - p.opt)) ** 2));
/** Interval of temperatures where tpc ≥ thr (exact inverse of both branches). */
const tpcRange = (p, thr) => (thr <= 0 ? [-Infinity, p.ct] : thr >= 1 ? [p.opt, p.opt] : [p.opt - 2 * p.sd * Math.sqrt(-Math.log(thr)), p.opt + (p.ct - p.opt) * Math.sqrt(1 - thr)]);
/** Edges of a unit cube [−1, 1]³ (or a box [a, b]) as point pairs. */
function boxEdges(a, b) {
  const c = (i, j, k) => [i ? b[0] : a[0], j ? b[1] : a[1], k ? b[2] : a[2]], E = [];
  for (const [i, j, k] of [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]]) {
    if (!i) E.push([c(i, j, k), c(1, j, k)]); if (!j) E.push([c(i, j, k), c(i, 1, k)]); if (!k) E.push([c(i, j, k), c(i, j, 1)]);
  }
  return E;
}
/** The six faces of a box [a, b] as quadrilaterals. */
function boxFaces(a, b) {
  const P = (i, j, k) => [i ? b[0] : a[0], j ? b[1] : a[1], k ? b[2] : a[2]];
  return [[P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)], [P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)], [P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)],
    [P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)], [P(0, 0, 0), P(0, 1, 0), P(0, 1, 1), P(0, 0, 1)], [P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)]];
}
const pct = (x) => `${Math.round(100 * x)} %`;

export default {
  collection: 'ecol',
  chapter: 1,
  title: 'Organisms, energy and scaling',
  summary: String.raw`Every organism lives within limits of temperature, water and resources; together these limits make up its niche, a region in a space with one axis per environmental factor, and growth is often held back by whichever resource is scarcest. Across the living world metabolic rate scales roughly as the three-quarter power of body mass and rises exponentially with temperature, and the metabolic theory of ecology derives lifespans, heart rates and population densities from these two facts. The chapter tests them against real data on hundreds of mammal species, from Kleiber's 1932 table to the PanTHERIA database, and closes with the classic ecogeographic rules about body size and shape (Bergmann's, Allen's and the island rule), checked against thousands of birds.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'The niche as an n-dimensional hypervolume (Hutchinson)',
      credit: 'G. Evelyn Hutchinson, 1957',
      statement: String.raw`Choose $n$ environmental variables that matter to a species — temperature, moisture, soil pH, food size, salinity, … — and treat each as an axis of an $n$-dimensional **niche space**. The species' **fundamental niche** is the set of points (states of the environment) at which a population of the species can persist indefinitely: its birth rate at least matches its death rate. It is a region, a *hypervolume*, in niche space. When the variables act independently, the hypervolume is a box $[a_1,b_1]\times\cdots\times[a_n,b_n]$ built from the tolerance limits on each axis; in general it is any shape.

A place is suitable only if its environment lies inside the hypervolume on **every** axis at once, so adding an axis can only shrink the set of suitable places. Real sites are points in niche space, and the places where the species is actually recorded are the sites that fall inside its niche (and that it has reached and not lost to competitors — the *realized* niche, ecol-4.1).`,
      idea: String.raw`The construction turns a vague idea ("the role or place of a species") into geometry. A population persists where its per-capita growth rate is non-negative, and that growth rate is a function of the environmental state, so the niche is a superlevel set of a function on niche space. Its projections onto single axes are the familiar tolerance ranges (1.3), but the converse fails: a site can be within range on each axis taken separately and still be outside the hypervolume, because the conditions must hold *jointly*. Mapping sites from geographic space (the biotope) into niche space and back is how species-distribution models predict where a species can live.`,
      caption: String.raw`Left: 420 sites (a synthetic landscape) plotted by temperature and moisture; drag the two corner handles to set the species' tolerance box. Right: the same sites in three dimensions, with soil pH as the third axis, and the niche as a box whose pH limits you set with the sliders (drag the background to rotate). Green sites lie inside all three limits — the field records; red sites are inside the temperature–moisture rectangle but outside the pH limits, so the third axis rules them out. The readout counts how the suitable fraction shrinks as axes are added, and compares it with what multiplying the one-axis fractions would give; the two differ because hot sites here also tend to be dry.`,
      deps: [],
      see: ['ecol-4.1', 'ecol-1.14'],
      refs: ['Begon ch. 2', 'Begon ch. 3'],
      tags: ['niche', 'tolerance'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ecological_niche' },
      viz(v) {
        const M = v.M, rng = v.rng(11), N = 420, sites = [];
        for (let i = 0; i < N; i++) {
          const T = rng.uniform(-4, 34);
          const W = 100 / (1 + Math.exp(-(0.75 - 0.075 * (T - 15) + 0.85 * rng.normal())));
          const pH = M.clamp(7.7 - 0.028 * W + 0.7 * rng.normal(), 3.8, 9);
          sites.push({ T, W, pH });
        }
        const A = v.stage({ x: [-5, 35], y: [0, 100], height: 350, axes: 'box', title: 'two axes: temperature (°C, across) × moisture (%, up)' });
        const B = v.stage({ x: [-1.75, 1.75], y: [-1.6, 1.6], equal: true, axes: false, height: 350, title: 'three axes: soil pH added' });
        const sc = v.scene3(B, { yaw: -0.72, pitch: 0.36, axes: false });
        const h1 = A.handle(11, 30, { color: 'accent' }), h2 = A.handle(27, 78, { color: 'accent' });
        const p1 = v.slider('pH lower limit', 3.8, 9, 5.4, { step: 0.05 }), p2 = v.slider('pH upper limit', 3.8, 9, 7.3, { step: 0.05 });
        const mx = (T) => ((T + 5) / 40) * 2 - 1, my = (W) => (W / 100) * 2 - 1, mz = (p) => ((p - 3.8) / 5.2) * 2 - 1;
        let st = null;
        v.render(() => {
          const T1 = Math.min(h1.x, h2.x), T2 = Math.max(h1.x, h2.x), W1 = Math.min(h1.y, h2.y), W2 = Math.max(h1.y, h2.y);
          const q1 = Math.min(p1.value, p2.value), q2 = Math.max(p1.value, p2.value);
          const inT = (s) => s.T >= T1 && s.T <= T2, inW = (s) => s.W >= W1 && s.W <= W2, inP = (s) => s.pH >= q1 && s.pH <= q2;
          const g = [], r = [], f = [];
          for (const s of sites) (inT(s) && inW(s) ? (inP(s) ? g : r) : f).push(s);
          // 2-D panel
          A.rect(T1, W1, T2, W2, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.6 });
          A.dots(f.map((s) => [s.T, s.W]), { r: 2, color: 'faint' });
          A.dots(r.map((s) => [s.T, s.W]), { r: 3, color: 'red', alpha: 0.85 });
          A.dots(g.map((s) => [s.T, s.W]), { r: 3.2, color: 'green' });
          A.text('niche (2 axes)', T1, W2, { color: 'accent', dy: -9, size: 11.5, weight: 600 });
          // 3-D panel
          sc.begin();
          for (const [a, b] of boxEdges([-1, -1, -1], [1, 1, 1])) sc.line(a, b, { color: 'grid', width: 1 }, 1);
          const lo = [mx(T1), my(W1), mz(q1)], hi = [mx(T2), my(W2), mz(q2)];
          for (const F of boxFaces(lo, hi)) sc.poly(F, { fill: 'accent', fillAlpha: 0.07, edge: false });
          for (const [a, b] of boxEdges(lo, hi)) sc.line(a, b, { color: 'accent', width: 1.6 }, 1);
          sc.dots(f.map((s) => [mx(s.T), my(s.W), mz(s.pH)]), { r: 1.6, color: 'faint' });
          sc.dots(r.map((s) => [mx(s.T), my(s.W), mz(s.pH)]), { r: 2.6, color: 'red', alpha: 0.85 });
          sc.dots(g.map((s) => [mx(s.T), my(s.W), mz(s.pH)]), { r: 2.9, color: 'green' });
          sc.flush();
          const lab = (t, p) => { const P = sc.P(p); B.text(t, P[0], P[1], { color: 'muted', size: 11.5, align: 'center' }); };
          lab('temperature →', [0, -1.22, -1.12]); lab('moisture →', [1.25, 0, -1.12]); lab('pH ↑', [-1.12, -1.12, 1.18]);
          const fT = sites.filter(inT).length / N, fW = sites.filter(inW).length / N, fP = sites.filter(inP).length / N;
          st = { fT, fTW: (g.length + r.length) / N, fAll: g.length / N, prod: fT * fW * fP, fTWprod: fT * fW, nr: r.length, ng: g.length };
        });
        v.legend([['green', 'inside all three limits (records)', { dot: true }], ['red', 'inside on two axes, ruled out by pH', { dot: true }], ['faint', 'outside', { dot: true }]]);
        v.readout(() => st && String.raw`suitable fraction of sites — temperature alone: **${pct(st.fT)}** · temperature and moisture: **${pct(st.fTW)}** · all three axes: **${pct(st.fAll)}** (${st.ng} sites) · the pH axis removes ${st.nr} sites that the 2-axis niche accepted · multiplying the one-axis fractions would predict ${pct(st.fTWprod)} and ${pct(st.prod)}: the axes are correlated, so the hypervolume is not a product of separate tolerances.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Principle',
      name: 'Liebig’s law of the minimum',
      credit: 'Carl Sprengel, 1828–1840; popularized by Justus von Liebig',
      statement: String.raw`If a plant (or a population) needs several resources in roughly fixed proportions and none can stand in for another, its growth is set by the resource in **shortest supply relative to need**:
$$G = G_{\max}\,\min_i\ f_i(S_i),$$
where $S_i$ is the supply of resource $i$ and $f_i \le 1$ the growth that resource alone would allow. Adding more of a non-limiting resource does nothing; adding the limiting one raises growth until another resource becomes limiting.`,
      scope: String.raw`Holds best for essential, non-substitutable resources (nitrogen and phosphorus for algae, a single limiting nutrient in a fertilizer trial) near steady state. Many systems are **co-limited**: physiology can trade one resource for another (light for nitrogen in photosynthesis), and communities of species limited by different resources respond to several at once, so growth often responds to more than one addition — the multiplicative model shown here.`,
      idea: String.raw`Each resource sets its own ceiling on growth; with no substitution the actual growth is the lowest ceiling, so the response surface is a minimum of single-factor responses. That is why fertilizer trials show "broken-stick" responses: yield climbs linearly with the limiting nutrient and then flattens abruptly at the level set by the next-scarcest one. Ecological stoichiometry and Tilman's resource-ratio theory (ecol-4.3) build on the same minimum; the image of a barrel whose shortest stave sets the water level was added later (it is credited to Dobenecks, early twentieth century).`,
      caption: String.raw`Drag the tops of the staves to set the supply of each resource as a fraction of the plant's need. The water — growth — can rise only to the shortest stave (red), so lengthening any other stave changes nothing. On the right, choose one resource and follow growth as its supply varies with the others held fixed: Liebig's curve rises and then stops dead at the level of the next-scarcest resource. Switch to **multiplicative co-limitation** to break the law: growth becomes the product of the separate ceilings, the barrel fills below its shortest stave, and adding *any* scarce resource helps (compare the gains in the readout).`,
      deps: ['ecol-1.1'],
      see: ['ecol-4.3'],
      refs: ['Begon ch. 3'],
      tags: ['resources', 'limitation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Liebig%27s_law_of_the_minimum' },
      viz(v) {
        const M = v.M, NAMES = ['N', 'P', 'K', 'light', 'water'], FULL = ['nitrogen', 'phosphorus', 'potassium', 'light', 'water'];
        const mode = v.select('', [{ value: 'min', label: 'Liebig: growth = minimum' }, { value: 'mult', label: 'multiplicative co-limitation' }], 'min');
        const vary = v.select('vary', NAMES.map((n, i) => ({ value: i, label: n })), 1);
        const A = v.stage({ x: [-0.75, 4.75], y: [-0.2, 1.42], axes: false, height: 340, weight: 1, title: 'the barrel: supply ÷ need' });
        const B = v.stage({ x: [0, 1.6], y: [0, 1.08], axes: 'box', height: 340, weight: 1, xlabel: 'supply of the chosen resource (÷ need)', ylabel: 'growth (÷ maximum)' });
        const S0 = [0.85, 0.45, 1.1, 0.7, 0.95];
        const H = S0.map((s, i) => A.handle(i, s, { color: 'gold', constrain: (x, y) => [i, M.clamp(y, 0.05, 1.35)] }));
        const liebig = (S) => Math.min(1, ...S);
        const mult = (S) => S.reduce((p, s) => p * Math.min(1, s), 1);
        const growth = (S) => (mode.value === 'min' ? liebig(S) : mult(S));
        let info = null;
        v.render(() => {
          const S = H.map((h) => h.y), G = growth(S), lim = M.argmin(S);
          // barrel
          S.forEach((s, i) => A.rect(i - 0.42, 0, i + 0.42, s, { fill: i === lim ? 'red' : 'orange', fillAlpha: i === lim ? 0.22 : 0.16, color: i === lim ? 'red' : 'orange', width: 1.4 }));
          const wl = Math.min(G, Math.min(...S));
          A.rect(-0.47, 0, 4.47, wl, { fill: 'accent', fillAlpha: 0.3, stroke: false });
          A.line(-0.47, wl, 4.47, wl, { color: 'accent', width: 2 });
          A.hline(1, { color: 'muted', dash: [4, 4], width: 1 });
          A.text('need met', 4.5, 1, { color: 'muted', size: 10.5, align: 'right', dy: -8 });
          for (const y of [0.18, 0.62]) A.line(-0.47, y, 4.47, y, { color: 'ink', width: 1.6, alpha: 0.55 });
          A.line(-0.47, 0, 4.47, 0, { color: 'ink', width: 2 });
          NAMES.forEach((n, i) => A.text(n, i, -0.1, { align: 'center', color: i === lim ? 'red' : 'ink', weight: 600, size: 12.5 }));
          const tall = M.argmax(S);
          A.text(`growth ${Math.round(100 * G)} %`, tall, Math.max(0.07, Math.min(wl, 1) / 2), { align: 'center', color: 'accent', weight: 700, size: 13 });
          // response to one resource
          const j = +vary.value, others = S.filter((_, i) => i !== j);
          const fL = (x) => liebig([x, ...others]), fM = (x) => mult([x, ...others]);
          B.fn(fM, { color: 'orange', width: mode.value === 'mult' ? 2.8 : 1.6, dash: mode.value === 'mult' ? null : [5, 4] });
          B.fn(fL, { color: 'accent', width: mode.value === 'min' ? 2.8 : 1.6, dash: mode.value === 'min' ? null : [5, 4] });
          B.line(S[j], 0, S[j], growth(S), { color: 'gold', dash: [3, 4], width: 1.2 });
          B.dot(S[j], growth(S), { color: 'gold', r: 5 });
          const ceil = Math.min(1, ...others);
          B.text(`ceiling from ${FULL[S.indexOf(ceil)] || 'need'}: ${Math.round(100 * ceil)} %`, 1.58, ceil, { align: 'right', dy: -9, color: 'accent', size: 11 });
          // marginal gains
          const gains = S.map((_, i) => { const T = S.slice(); T[i] += 0.1; return growth(T) - G; });
          info = { G, lim, gains, S };
        });
        v.legend([['accent', 'Liebig: minimum of the ceilings'], ['orange', 'multiplicative: product of the ceilings'], ['gold', 'current supply', { dot: true }]]);
        v.readout(() => info && `limiting resource: **${FULL[info.lim]}** (${Math.round(100 * info.S[info.lim])} % of need) · growth ${Math.round(100 * info.G)} % of maximum · gain in growth from +10 % of need: ` + info.gains.map((g, i) => `${NAMES[i]} ${g > 5e-4 ? '+' + (100 * g).toFixed(1) : '0'}`).join(', ') + (mode.value === 'min' ? ' — only the limiting resource pays.' : ' — every scarce resource helps, so the law of the minimum fails.'));
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Principle',
      name: 'Tolerance curves and Shelford’s law of tolerance',
      credit: 'Victor E. Shelford, 1911',
      statement: String.raw`For each environmental factor an organism has a **range of tolerance** bounded by a minimum *and* a maximum: performance (survival, growth, reproduction) is highest near an optimum, falls through zones of physiological stress and drops to zero beyond the critical limits. Too much is as limiting as too little. Different processes have different ranges, nested in a typical order — survival tolerates the widest range, growth a narrower one and reproduction the narrowest — so the conditions that allow a population to persist are those that allow it to *reproduce*, and the geographical range is predicted by where reproduction is possible, not merely survival.`,
      scope: String.raw`A rule about single factors, each measured with the others near their optima; factors interact (heat is worse when dry), and acclimation can shift the curves. Individuals can survive outside the breeding range, which is why range edges often hold "sink" populations maintained by immigration (ecol-3.6).`,
      idea: String.raw`Shelford extended Liebig's minimum (1.2) to both ends of each gradient. A thermal performance curve rises slowly with warming (enzyme kinetics, 1.7) and collapses quickly above the optimum (protein denaturation, oxygen limitation), so it is skewed. Reproduction is the most demanding process — it needs a surplus of energy above maintenance and growth — so its curve is the narrowest. Along a temperature gradient the latitudes where all three processes clear the required level form the breeding range; it is the projection of the niche (1.1) onto geography, and it slides poleward as the climate warms.`,
      caption: String.raw`Left: survival, growth and reproduction across temperature (illustrative curves of the standard skewed shape). Drag the gold handle to set the level of performance a population needs; the coloured bars beneath show each process's tolerance range, and reproduction's is the narrowest. Right: summer temperature along a latitude gradient; the line is coloured by the most demanding process that still succeeds there, and the green band is the predicted breeding range. Warm the climate with the slider and watch both edges of the range move poleward, while a forecast based on survival alone would be far too wide.`,
      deps: ['ecol-1.1'],
      see: ['ecol-1.7'],
      refs: ['Begon ch. 2'],
      tags: ['tolerance', 'temperature'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shelford%27s_law_of_tolerance' },
      viz(v) {
        const PROC = [
          { name: 'survival', color: 'teal', opt: 24, sd: 7.5, ct: 41 },
          { name: 'growth', color: 'orange', opt: 26, sd: 4.6, ct: 35.5 },
          { name: 'reproduction', color: 'purple', opt: 24.5, sd: 2.8, ct: 30.5 },
        ];
        const A = v.stage({ x: [-6, 45], y: [-0.33, 1.1], axes: 'box', height: 340, yticks: [0, 0.25, 0.5, 0.75, 1], title: 'performance against temperature (°C)' });
        const B = v.stage({ x: [0, 70], y: [-6, 36], axes: 'box', height: 340, title: 'summer temperature (°C) against latitude (°)' });
        const thr = A.handle(42, 0.5, { color: 'gold', constrain: (x, y) => [42, v.M.clamp(y, 0.05, 0.95)] });
        const dT = v.slider('warming (°C)', 0, 4, 0, { step: 0.1 });
        const Tlat = (phi, w) => 31 - 0.42 * phi + w;
        const latOf = (T, w) => (31 + w - T) / 0.42;
        let info = null;
        v.render(() => {
          const t = thr.y, R = PROC.map((p) => tpcRange(p, t));
          A.hline(t, { color: 'gold', dash: [5, 4], width: 1.4 });
          A.text(`needed: ${t.toFixed(2)}`, 41, t, { color: 'gold', align: 'right', dy: 11, size: 11, weight: 600 });
          PROC.forEach((p, k) => {
            A.fn((T) => tpc(T, p), { color: p.color, width: 2.4, fill: p.color, fillAlpha: 0.06, base: 0 });
            const y = -0.08 - 0.08 * k, [a, b] = R[k];
            A.line(Math.max(a, -6), y, b, y, { color: p.color, width: 6, cap: 'butt' });
            A.text(p.name, Math.max(a, -6) - 0.6, y, { color: p.color, size: 11, weight: 600, align: 'right' });
          });
          A.vband(R[2][0], R[2][1], { color: 'green', alpha: 0.08 });
          // latitude gradient
          const w = dT.value;
          if (w > 0) B.fn((x) => Tlat(x, 0), { color: 'muted', dash: [4, 4], width: 1.2 });
          const levelAt = (T) => { let k = -1; PROC.forEach((p, i) => { if (T >= R[i][0] && T <= R[i][1]) k = i; }); return k; };
          const cols = ['red', 'teal', 'orange', 'purple'];
          for (let x = 0; x < 70; x += 0.5) { const T0 = Tlat(x, w), T1 = Tlat(x + 0.5, w), k = levelAt((T0 + T1) / 2); B.line(x, T0, x + 0.5, T1, { color: cols[k + 1], width: k < 0 ? 1.6 : 4.5, cap: 'butt' }); }
          const lat = (T) => v.M.clamp(latOf(T, w), 0, 70);
          const breed = [lat(R[2][1]), lat(R[2][0])], surv = [lat(R[0][1]), lat(R[0][0])];
          if (surv[1] > breed[1] + 4) B.text('adults survive, cannot breed', (breed[1] + surv[1]) / 2, Tlat((breed[1] + surv[1]) / 2, w), { color: 'teal', size: 10.5, dx: 6, dy: -12, align: 'left' });
          if (breed[1] > breed[0]) {
            B.vband(breed[0], breed[1], { color: 'green', alpha: 0.12 });
            B.text('breeding range', (breed[0] + breed[1]) / 2, 33.5, { align: 'center', color: 'green', weight: 600, size: 11.5 });
          }
          info = { breed, surv, R, w };
        });
        v.legend([['teal', 'survival'], ['orange', 'growth'], ['purple', 'reproduction'], ['green', 'breeding range', { area: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { breed, surv, R, w } = info, f = (x) => x.toFixed(1);
          const width = R.map(([a, b]) => b - a);
          return `tolerance ranges at this level: survival ${f(R[0][0])}–${f(R[0][1])} °C, growth ${f(R[1][0])}–${f(R[1][1])} °C, reproduction ${f(R[2][0])}–${f(R[2][1])} °C (widths ${width.map((x) => x.toFixed(1)).join(' > ')}) · predicted breeding range **${f(breed[0])}°–${f(breed[1])}° latitude**; survival alone would allow ${f(surv[0])}°–${f(surv[1])}°` + (w > 0 ? ` · after ${w.toFixed(1)} °C of warming both edges have moved ${f(w / 0.42)}° poleward` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Concept',
      name: 'Allometry and log–log scaling',
      credit: 'Otto Snell, 1892; Julian Huxley, 1932',
      statement: String.raw`A biological trait $Y$ that varies with body mass $M$ is often described by an **allometric** power law
$$\begin{gathered}Y = a\,M^{b}\\\Longleftrightarrow\\\log Y = \log a + b\log M .\end{gathered}$$
On log–log axes the power law is a straight line whose slope is the **scaling exponent** $b$ and whose height at $M = 1$ is the normalization $a$. Exponent $b = 1$ is *isometry* (the trait is a fixed fraction of body mass); $b < 1$ means the trait grows more slowly than mass, so per gram it declines; $b < 0$ means it falls with size. Exponents are estimated by least-squares regression of $\log Y$ on $\log M$, across species whose masses span many orders of magnitude.`,
      idea: String.raw`Logarithms turn multiplication into addition: a power law, which on linear axes is a curve crowded into a corner, becomes a line, and the slope is a dimensionless number that can be compared across traits and taxa. Geometric similarity predicts exponents in thirds (areas $\propto M^{2/3}$, lengths $\propto M^{1/3}$; arch-7.1); many biological rates and times instead show exponents near multiples of $1/4$, which is the puzzle the metabolic theory (1.5–1.9) tries to explain. Because the data scatter, the slope is an estimate with an uncertainty (stat-12.2), and what counts as "the" exponent depends on the range of sizes fitted.

For positive mass and trait values, the inverse-exponential identities of pma 8.6 give $\log(aM^b)=\log a+b\log M$. Fitting the resulting coordinates uses the line case of opt 1.6: the design rows are $(1,\log M_i)$, and the normal equations make the residual orthogonal to both columns. Distinct log masses give full column rank and a unique fitted intercept and slope. This is least squares in log trait, not least squares in the original trait; neither the normal equations nor the log identity proves that an empirical biological exponent is universal.`,
      caption: String.raw`Real data: every point is a mammal species from the PanTHERIA database (Jones et al. 2009), coloured by order. Pick a trait: the least-squares line (blue) gives its exponent with a 95 % confidence interval, and the dashed line shows the slope predicted by quarter-power scaling (or isometry for home range). Hover over a point to identify the species. Switch to **linear axes** and the same data collapse into an L hugging the axes, with the shrews and mice indistinguishable from zero: the log–log view is what makes scaling visible.`,
      deps: ['pma-8.6','opt-1.6'],
      see: ['stat-12.2', 'arch-7.1'],
      refs: ['Brown et al. 2004'],
      tags: ['allometry', 'scaling', 'data'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Allometry' },
      viz(v) {
        const M = v.M, R = mammals();
        const T = {
          bmr: { lab: 'basal metabolic rate (W)', get: (r) => (r.b ? [r.bm / 1000, bmrW(r)] : null), ref: 0.75, refTxt: '3/4' },
          life: { lab: 'maximum recorded lifespan (years)', get: (r) => (r.L ? [r.m / 1000, r.L / 12] : null), ref: 0.25, refTxt: '1/4' },
          gest: { lab: 'gestation length (days)', get: (r) => (r.G ? [r.m / 1000, r.G] : null), ref: 0.25, refTxt: '1/4' },
          mat: { lab: 'age at sexual maturity (years)', get: (r) => (r.S ? [r.m / 1000, r.S / 365.25] : null), ref: 0.25, refTxt: '1/4' },
          home: { lab: 'home range (km²)', get: (r) => (r.H ? [r.m / 1000, r.H / 100] : null), ref: 1, refTxt: '1 (isometry)' },
          dens: { lab: 'population density (per km²)', get: (r) => (r.D ? [r.m / 1000, r.D] : null), ref: -0.75, refTxt: '−3/4' },
        };
        const trait = v.select('trait', [{ value: 'bmr', label: 'metabolic rate' }, { value: 'life', label: 'lifespan' }, { value: 'gest', label: 'gestation' }, { value: 'mat', label: 'maturity' }, { value: 'home', label: 'home range' }, { value: 'dens', label: 'density' }], 'bmr');
        const lin = v.toggle('linear axes', false);
        const s = v.stage({ x: [1e-3, 3e5], y: [1e-2, 1e3], xlog: true, ylog: true, height: 390, full: true, axes: 'box', hover: true, xlabel: 'body mass (kg)' });
        const SHOW = [['Sorex araneus', 'common shrew', 'se'], ['Mus musculus', 'house mouse', 'ne'], ['Homo sapiens', 'human', 'se'], ['Elephas maximus', 'Asian elephant', 'nw'], ['Balaenoptera musculus', 'blue whale', 'nw'], ['Canis lupus', 'wolf', 'se']];
        let info = null, lastKey = '';
        v.render(() => {
          const t = T[trait.value], recs = R.filter((r) => t.get(r)), P = recs.map((r) => t.get(r));
          const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
          const ylo = Math.min(...ys), yhi = Math.max(...ys), xhi = Math.max(...xs);
          const key = trait.value + lin.value;
          if (key !== lastKey) {
            lastKey = key;
            if (lin.value) s.setScale({ xlog: false, ylog: false, x: [0, xhi * 1.04], y: [0, yhi * 1.06] });
            else s.setScale({ xlog: true, ylog: true, x: [Math.min(...xs) / 2, xhi * 2.5], y: [ylo / 2.5, yhi * 2.5] });
            s.setLabels('body mass (kg)', t.lab);
          }
          const hits = scatterGroups(s, recs, (r) => t.get(r)[0], (r) => t.get(r)[1], { r: lin.value ? 2.2 : 2.6 });
          const F = logFit(M, xs, ys), x0 = Math.min(...xs), x1 = xhi;
          const gx = 10 ** M.mean(xs.map(Math.log10)), gy = 10 ** M.mean(ys.map(Math.log10));
          s.clip(() => {
            s.fn((x) => gy * (x / gx) ** t.ref, { color: 'ink', dash: [6, 5], width: 1.5, alpha: 0.7, domain: [x0, x1] });
            s.fn(F.f, { color: 'accent', width: 3, domain: [x0, x1] });
          });
          if (!lin.value) {
            for (const [nm, lab, pos] of SHOW) {
              const r = find(recs, nm); if (!r) continue; const [x, y] = t.get(r);
              s.dot(x, y, { r: 3.6, color: 'ink', hollow: true, label: lab, labelPos: pos, labelColor: 'ink', math: false, labelSize: 11 });
            }
            s.text(`slope ${F.slope.toFixed(3)}`, x1, F.f(x1), { color: 'accent', align: 'right', dy: t.ref < 0 ? 14 : -12, weight: 700, size: 12 });
          }
          const hv = hoverPick(s, hits);
          if (hv) { s.dot(hv.x, hv.y, { r: 6, hollow: true, color: 'ink', width: 2 }); s.textPx(`${hv.r.name} · ${massTxt(hv.r.m)}`, Math.min(hv.X + 10, s.W - 8), hv.Y - 12, { align: hv.X > s.W - 190 ? 'right' : 'left', size: 12, weight: 600 }); }
          let smallFrac = 0;
          if (lin.value) smallFrac = xs.filter((x) => x < xhi * 0.01).length / xs.length;
          info = { F, n: P.length, t, hv, lin: lin.value, smallFrac, yv: hv ? hv.y : null };
        });
        v.legend(groupLegend(mammals()).concat([['accent', 'least-squares fit'], ['ink', 'reference slope', { dash: true }]]));
        v.readout(() => {
          if (!info) return '';
          const { F, n, t, hv } = info;
          let s1 = String.raw`${n} species · fitted exponent $b = ${F.slope.toFixed(3)}$ (95 % CI ${fx(F.lo, 3)} to ${fx(F.hi, 3)}), $r^2 = ${F.r2.toFixed(2)}$ · normalization $a = ${v.fmt(F.a, 3)}$ at 1 kg · reference slope ${t.refTxt}`;
          if (info.lin) s1 += ` · on linear axes ${pct(info.smallFrac)} of the species sit in the leftmost 1 % of the mass axis`;
          if (hv) s1 += ` · **${hv.r.name}**: ${massTxt(hv.r.m)}, ${v.fmt(info.yv, 3)} ${t.lab.match(/\(([^)]*)\)/)[1]}`;
          return s1;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Law',
      name: 'Kleiber’s law: metabolic rate ∝ M^{3/4}',
      credit: 'Max Kleiber, 1932',
      statement: String.raw`Across species, the resting (basal) metabolic rate $B$ of an animal — its energy use when post-absorptive, at rest and in a thermoneutral environment — scales approximately as the three-quarter power of its body mass,
$$B \approx B_0\,M^{3/4},$$
so a mammal 10 000 times heavier uses about 1 000 times more energy, and each gram of a large animal burns far less than a gram of a small one ($B/M\propto M^{-1/4}$). Kleiber's standard for mammals was 70 kcal per day at 1 kg, i.e. $B\approx 3.4\,M^{3/4}$ W with $M$ in kg; the 572 species of the PanTHERIA compilation give 2.9 W at 1 kg and an exponent of 0.72. The rival "surface law" predicts the exponent $2/3$, from heat loss through a surface that grows as $M^{2/3}$.`,
      scope: String.raw`An empirical regularity across species of one broad group (mammals, birds, fish, …), each with its own $B_0$; within a species or over narrow size ranges the exponent varies widely. For mammals the fitted exponent depends on the data and the method: compilations give values between about 0.67 (White & Seymour 2003, 619 species) and 0.75, and the log–log relation is slightly curved, steeper for large mammals than for small ones.`,
      idea: String.raw`Kleiber (1932, ecol-1.13) found that $B/W^{3/4}$ was more nearly constant across animals from rats to steers than $B$ per unit body surface; Brody and others extended the "mouse-to-elephant curve". The 2/3 surface law assumes heat loss sets the rate, but metabolic rates measured in thermoneutral conditions are not set by heat loss; the 3/4 exponent was later explained (contentiously) by the geometry of resource-distribution networks (1.6). On this data set the overall exponent lies between the two candidates, and fitting small and large mammals separately gives different answers — evidence of curvature that a single power law hides.`,
      caption: String.raw`Real data: basal metabolic rate of 572 mammal species from PanTHERIA (oxygen consumption converted at 20.1 J per mL O₂; one record that is evidently 1000× too high is left out), plotted against the mass of the animals measured. Drag the two handles on the bottom edge to choose which masses are fitted: the blue line is the least-squares fit inside the window, and the dashed lines are the best lines with the slope forced to 2/3 (orange) and 3/4 (green). Fit only shrews and mice and the exponent drops near 2/3; fit only the large mammals and it climbs past 3/4. The right panel makes this systematic: the exponent fitted in a sliding window 1.5 decades wide, with its 95 % band. Toggle **per kilogram** to see the same law as a falling mass-specific rate.`,
      deps: ['ecol-1.4'],
      see: ['physio-9.13', 'ecol-1.13'],
      refs: ['Brown et al. 2004'],
      tags: ['metabolism', 'scaling', 'data'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kleiber%27s_law' },
      viz(v) {
        const M = v.M, R = mammals().filter((r) => r.b && r.bm);
        const X = R.map((r) => r.bm / 1000), Y = R.map(bmrW);
        const perkg = v.toggle('per kilogram', false);
        const A = v.stage({ x: [1.5e-3, 2e3], y: [0.03, 3000], xlog: true, ylog: true, height: 360, weight: 1.35, axes: 'box', hover: true, xlabel: 'body mass (kg)', ylabel: 'basal metabolic rate (W)' });
        const B = v.stage({ x: [5e-3, 300], y: [0.35, 1.15], xlog: true, height: 360, weight: 1, axes: 'box', xlabel: 'centre of a 1.5-decade window (kg)', ylabel: 'local exponent', title: 'exponent fitted in a sliding window' });
        const yb = () => (perkg.value ? 0.36 : 0.045);
        const hL = A.handle(0.0035, 0.045, { color: 'gold', constrain: (x) => [M.clamp(x, 2e-3, 1e3), yb()] });
        const hR = A.handle(420, 0.045, { color: 'gold', constrain: (x) => [M.clamp(x, 2e-3, 1e3), yb()] });
        // sliding-window exponents (computed once)
        const LX = X.map(Math.log10), LY = Y.map(Math.log10), slide = [];
        for (let c = -2.2; c <= 2.45; c += 0.05) {
          const idx = LX.map((x, i) => (Math.abs(x - c) <= 0.75 ? i : -1)).filter((i) => i >= 0);
          if (idx.length < 25) continue;
          const F = logFit(M, idx.map((i) => X[i]), idx.map((i) => Y[i]));
          slide.push([10 ** c, F.slope, F.lo, F.hi, idx.length]);
        }
        let info = null, lastPk = null;
        v.render(() => {
          const pk = perkg.value;
          if (pk !== lastPk) { lastPk = pk; A.setView(null, pk ? [0.3, 300] : [0.03, 3000]); A.setLabels(undefined, pk ? 'metabolic rate per kg (W/kg)' : 'basal metabolic rate (W)'); hL.set(hL.x, yb()); hR.set(hR.x, yb()); }
          const yv = (i) => (pk ? Y[i] / X[i] : Y[i]);
          const a = Math.min(hL.x, hR.x), b = Math.max(hL.x, hR.x);
          A.vband(A.xr[0], a, { color: 'grid', alpha: 0.5 }); A.vband(b, A.xr[1], { color: 'grid', alpha: 0.5 });
          const inW = X.map((x, i) => (x >= a && x <= b ? i : -1)).filter((i) => i >= 0);
          const hits = scatterGroups(A, R, (r) => r.bm / 1000, (r) => (pk ? bmrW(r) / (r.bm / 1000) : bmrW(r)), { r: 2.4, alpha: 0.6 });
          let F = null, f23 = null, f34 = null;
          if (inW.length >= 5) {
            const xs = inW.map((i) => X[i]), ys = inW.map((i) => Y[i]);
            F = logFit(M, xs, ys); f23 = fixedSlope(xs, ys, 2 / 3); f34 = fixedSlope(xs, ys, 3 / 4);
            const lo = Math.min(...xs), hi = Math.max(...xs), conv = (f) => (pk ? (x) => f(x) / x : f);
            A.clip(() => {
              A.fn(conv(f23.f), { color: 'orange', dash: [6, 5], width: 1.8, domain: [lo, hi] });
              A.fn(conv(f34.f), { color: 'green', dash: [6, 5], width: 1.8, domain: [lo, hi] });
              A.fn(conv(F.f), { color: 'accent', width: 3, domain: [lo, hi] });
            });
            if (pk) A.text(`per kg: slope ${fx(F.slope - 1, 3)}`, lo, conv(F.f)(lo), { align: 'left', dx: 8, dy: -16, color: 'accent', weight: 700 });
            else A.text(`b = ${F.slope.toFixed(3)}`, hi, F.f(hi), { align: 'right', dy: -14, color: 'accent', weight: 700 });
          }
          const hv = hoverPick(A, hits);
          if (hv) { A.dot(hv.x, hv.y, { r: 6, hollow: true, color: 'ink', width: 2 }); A.textPx(`${hv.r.name} · ${massTxt(hv.r.bm)} · ${v.fmt(bmrW(hv.r), 3)} W`, Math.min(hv.X + 10, A.W - 8), hv.Y - 12, { align: hv.X > A.W * 0.55 ? 'right' : 'left', size: 12, weight: 600 }); }
          // sliding window panel
          B.poly(slide.map((s) => [s[0], s[3]]).concat(slide.map((s) => [s[0], s[2]]).reverse()), { fill: 'accent', fillAlpha: 0.13, stroke: false });
          B.path(slide.map((s) => [s[0], s[1]]), { color: 'accent', width: 2.6 });
          B.hline(2 / 3, { color: 'orange', dash: [6, 5], width: 1.5 }); B.hline(3 / 4, { color: 'green', dash: [6, 5], width: 1.5 });
          B.text('2/3', 5.5e-3, 2 / 3, { color: 'orange', dy: 10, size: 11.5, weight: 600 });
          B.text('3/4', 5.5e-3, 3 / 4, { color: 'green', dy: -10, size: 11.5, weight: 600 });
          if (F) B.dot(Math.sqrt(a * b), F.slope, { color: 'gold', r: 5.5, label: 'your window', labelPos: 'se', labelColor: 'muted', math: false, labelSize: 10.5 });
          info = { F, f23, f34, n: inW.length, a, b, hv };
        });
        v.legend([['accent', 'least-squares fit in the window'], ['orange', 'best line of slope 2/3', { dash: true }], ['green', 'best line of slope 3/4', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { F, f23, f34, n, a, b } = info;
          if (!F) return 'widen the window: fewer than five species inside it';
          const pref = f23.ssr < f34.ssr ? '2/3' : '3/4';
          return String.raw`window ${massTxt(a * 1000)} – ${massTxt(b * 1000)}: ${n} species, exponent $b = ${F.slope.toFixed(3)}$ (95 % CI ${F.lo.toFixed(3)}–${F.hi.toFixed(3)}; per kilogram ${fx(F.slope - 1, 3)}) · residual sum of squares with the slope fixed: 2/3 → ${f23.ssr.toFixed(2)}, 3/4 → ${f34.ssr.toFixed(2)}, so this window prefers **${pref}** · at 1 kg the fitted rate is ${v.fmt(F.f(1), 3)} W`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Model',
      name: 'West–Brown–Enquist network model of quarter-power scaling',
      credit: 'Geoffrey West, James Brown and Brian Enquist, 1997',
      statement: String.raw`Model an organism's circulatory system as a hierarchical branching network of $N$ levels, each vessel splitting into $n$ daughters, with three assumptions: (i) the network is **space-filling**, serving every part of the body, so lengths shrink by $\gamma = l_{k+1}/l_k = n^{-1/3}$; (ii) the terminal units (capillaries) are the same size in every organism; (iii) the energy spent pumping blood is minimized, which for large pulsatile vessels makes the network **area-preserving**, $\beta = r_{k+1}/r_k = n^{-1/2}$. Then the number of capillaries $N_c = n^N$, which sets the metabolic rate $B$, and the blood volume $V_b$, which is proportional to body mass $M$, satisfy
$$\begin{gathered}N_c \propto V_b^{\,a},\\a = \frac{\ln n}{-\ln(\beta^2\gamma)}\\\;\longrightarrow\; \frac{\ln n}{\tfrac43\ln n} = \frac34\\(N\to\infty),\end{gathered}$$
so $B \propto M^{3/4}$. With Poiseuille flow throughout (Murray's cube law, $\beta = n^{-1/3}$) the same calculation gives $a \to 1$.`,
      scope: String.raw`A model, not a derivation from first principles: real networks mix area-preserving arteries with Murray-like small vessels, finite networks do not give exactly 3/4 (the pure model approaches it from below, a model with small Murray-like vessels from above), and the assumptions (minimal energy, invariant capillaries, $V_b\propto M$) have been disputed. Plants and single cells need analogous but different networks.`,
      idea: String.raw`Count from the capillaries up. Each level up multiplies the number of vessels by $1/n$, the volume of one vessel by $(\beta^2\gamma)^{-1}$, so the volume carried by a whole level changes by the factor $q^{-1}$ with $q = n\beta^2\gamma$. For the WBE ratios $q = n^{-1/3} < 1$, the big vessels dominate and $V_b \approx \text{const}\cdot N_c\,n^{N/3} = \text{const}\cdot N_c^{4/3}$: blood volume grows faster than the capillary count, so metabolism, set by the capillaries, grows as the 3/4 power of the volume. Blood volume really is proportional to body mass across mammals (Stahl 1967 found $65.6\,M^{1.02}$ mL), so $B\propto M^{3/4}$. If $q = 1$ (Murray's law, or no space-filling with $\gamma = 1$) every level holds the same volume, $V_b\propto N_c\,N$, and the exponent tends to 1.

The finite-sum identity in the proof of pma 3.26 supplies the network volume. With terminal volume fixed, it is proportional to $N_c\sum_{j=0}^N q^{-j}$, where $q=n\beta^2\gamma$. For $0<q<1$, reverse the sum to obtain $N_c q^{-N}(1-q^{N+1})/(1-q)$. With the chosen WBE ratios, $q=n^{-1/3}$ and $N_c=n^N$, its leading growth is $N_c^{4/3}$. At $q=1$ the exact sum is $N+1$, not a convergent infinite geometric series. The three-quarter exponent concerns the stated large-network limit and the separate blood-volume/body-mass assumption.`,
      caption: String.raw`Left: the network grown to the number of levels set by the slider, vessel widths drawn to scale (red: area-preserving levels, purple: Murray levels, green dots: capillaries). Right: capillary count against blood volume (in capillary volumes) for networks of every size up to 30 levels, on log–log axes, with the network on the left ringed. The readout gives the local exponent between neighbouring sizes. In the pure area-preserving network it climbs toward 3/4 from below as the network grows; add three Murray-law levels next to the capillaries, as in real circulations, and it falls toward 3/4 from above instead — the opposite of the trend in the mammal data of 1.5, where small species have the smaller exponent. Switch to Murray's cube law throughout, or switch off space-filling, and the exponent heads to 1.`,
      deps: ['ecol-1.5','mathbio-10.11','pma-3.26'],
      refs: ['Brown et al. 2004'],
      tags: ['metabolism', 'networks', 'scaling'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Metabolic_theory_of_ecology' },
      viz(v) {
        const M = v.M;
        const rule = v.select('vessels', [{ value: 'area', label: 'area-preserving' }, { value: 'mix', label: 'area-preserving + 3 Murray levels' }, { value: 'murray', label: 'Murray cube law' }], 'area');
        const nSel = v.select('branching n', [{ value: 2, label: '2' }, { value: 3, label: '3' }], 2);
        const sf = v.toggle('space-filling lengths (γ = n^−1/3)', true);
        const L = v.slider('levels N', 1, 9, 6, { int: true });
        const A = v.stage({ x: [-1.25, 1.25], y: [-1.05, 1.15], equal: true, axes: false, height: 360, weight: 1, title: 'the network' });
        const B = v.stage({ x: [1, 1e18], y: [1, 1e12], xlog: true, ylog: true, axes: 'box', height: 360, weight: 1.1, xlabel: 'blood volume Vb (capillary volumes)', ylabel: 'capillaries Nc' });
        /** Radii and lengths from the capillaries (level N: r = l = 1) upward; returns {V, r[], l[], murray[]} for levels 0..N. */
        const net = (N, n) => {
          const bA = n ** -0.5, bM = n ** (-1 / 3), g = sf.value ? n ** (-1 / 3) : 1, r = [], l = [], mur = [];
          r[N] = 1; l[N] = 1; mur[N] = rule.value !== 'area';
          for (let k = N - 1; k >= 0; k--) {
            const isM = rule.value === 'murray' || (rule.value === 'mix' && N - 1 - k < 3);
            r[k] = r[k + 1] / (isM ? bM : bA); l[k] = l[k + 1] / g; mur[k] = isM;
          }
          let V = 0; for (let k = 0; k <= N; k++) V += n ** k * r[k] ** 2 * l[k];
          return { V, r, l, mur };
        };
        let info = null;
        v.render(() => {
          const n = +nSel.value, Nmax = n === 2 ? 9 : 5, N = Math.min(L.value, Nmax), T = net(N, n);
          // drawing: scale lengths so the tree fits
          const tot = T.l.reduce((s, x) => s + x, 0), sc = 1.95 / tot, wmax = 11 / T.r[0];
          const spread = n === 2 ? [-1, 1] : [-1, 0, 1], ang0 = n === 2 ? 0.62 : 0.58;
          const tips = [];
          const draw = (k, x, y, th) => {
            const len = T.l[k] * sc * (k === 0 ? 0.8 : 1), x2 = x + len * Math.sin(th), y2 = y + len * Math.cos(th);
            A.line(x, y, x2, y2, { color: T.mur[k] ? 'purple' : 'red', width: Math.max(0.7, wmax * T.r[k]), alpha: 0.9 });
            if (k === N) { tips.push([x2, y2]); return; }
            const a = ang0 * 0.8 ** k;
            for (const s of spread) draw(k + 1, x2, y2, th + s * a);
          };
          draw(0, 0, -1, 0);
          A.dots(tips, { r: tips.length > 130 ? 1.4 : 2.4, color: 'green' });
          // scaling panel
          const pts = [];
          for (let k = 1; k <= 30; k++) pts.push([net(k, n).V, n ** k, k]);
          B.setView([1, pts[29][0] * 3], [1, pts[29][1] * 3]);
          const v0 = pts[0];
          B.fn((x) => v0[1] * (x / v0[0]) ** 0.75, { color: 'green', dash: [6, 5], width: 1.4 });
          B.fn((x) => v0[1] * (x / v0[0]), { color: 'muted', dash: [2, 4], width: 1.4 });
          B.path(pts.map((p) => [p[0], p[1]]), { color: 'accent', width: 1.8 });
          for (const p of pts) B.dot(p[0], p[1], { r: p[2] === N ? 6 : 2.6, color: p[2] === N ? 'gold' : 'accent', ring: p[2] === N });
          const cur = pts[N - 1];
          B.text(`N = ${N}`, cur[0], cur[1], { dx: 10, dy: 10, color: 'gold', weight: 700 });
          const loc = (k) => Math.log(pts[k][1] / pts[k - 1][1]) / Math.log(pts[k][0] / pts[k - 1][0]);
          const qq = (rule.value === 'murray' ? n * n ** (-2 / 3) : n * n ** -1) * (sf.value ? n ** (-1 / 3) : 1);
          const asym = qq < 1 - 1e-9 ? Math.log(n) / (Math.log(n) - Math.log(qq)) : 1;
          info = { N, n, Nc: n ** N, V: T.V, local: loc(N), loc30: loc(29), asym, slope1: true };
        });
        v.legend([['red', 'area-preserving vessel'], ['purple', 'Murray (cube-law) vessel'], ['green', 'capillary / slope 3/4', { dot: true }], ['muted', 'slope 1', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { N, n, Nc, V, local, loc30, asym } = info;
          return String.raw`$N = ${N}$ levels of $n = ${n}$: $N_c = ${Nc}$ capillaries, blood volume $V_b = ${v.fmt(V, 4)}$ capillary volumes · local exponent $d\ln N_c/d\ln V_b = ${local.toFixed(3)}$ here, ${loc30.toFixed(3)} at 30 levels · limit as $N\to\infty$: **${asym === 1 ? '1 (approached only logarithmically)' : asym.toFixed(3)}**`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Model',
      name: 'Boltzmann–Arrhenius temperature dependence of metabolism',
      credit: 'Gillooly, Brown, West, Savage and Charnov, 2001 (after Arrhenius, 1889)',
      statement: String.raw`The metabolic theory of ecology combines the mass scaling of metabolism (1.5) with the temperature dependence of biochemical reaction rates:
$$B = b_0\,M^{3/4}\,e^{-E/kT},$$
with $T$ the body temperature in kelvin, $k = 8.617\times10^{-5}$ eV/K Boltzmann's constant and $E$ an average **activation energy** of metabolism. Plotting the mass-corrected rate $\ln(B\,M^{-3/4})$ against $1/kT$ gives a straight line of slope $-E$. Across unicells, plants, invertebrates, fish, amphibians, reptiles and (hibernating) endotherms, Gillooly et al. (2001) found a common slope near $E\approx 0.6$–$0.7$ eV (0.69 eV, 95 % CI 0.66–0.73, in the analysis reproduced by Brown et al. 2004). With $E = 0.65$ eV, warming from 20 to 30 °C multiplies metabolic rate by about 2.3 ($Q_{10}\approx 2.3$).`,
      scope: String.raw`Holds over the range of normal activity, roughly 0–40 °C; above the optimum rates collapse (1.3). Activation energies of individual traits and species vary widely (Dell et al. 2011 found a right-skewed distribution with median 0.55 eV across 1 072 thermal responses), so 0.65 eV is a central tendency, not a constant of nature.`,
      idea: String.raw`In the Arrhenius law (kin-2.1) a rate is proportional to the fraction of molecular encounters with energy above a barrier, $e^{-E/kT}$. Metabolism is a network of enzyme-catalysed reactions with a rate-limiting step whose barrier is a fraction of an electronvolt, so whole-organism rates inherit the Boltzmann factor. The model separates the two effects: dividing by $M^{3/4}$ removes body size, after which temperature alone explains most of the remaining variation. Because development, growth, mortality and population growth all run on metabolism, the same factor sets the "pace of life" of ectotherms in warm and cold places.`,
      caption: String.raw`A **synthetic** data set generated from the published model ($E = 0.65$ eV, masses from 0.1 g to 10 kg, realistic scatter), not real measurements. Left: the Arrhenius plot; the slope of the least-squares line estimates $E$. Switch off **mass correction** and the same points scatter over many units because big and small animals are mixed, and the estimate of $E$ becomes far less precise. Narrow the temperature range with the sliders and the estimate becomes uncertain. Right: the predicted speed-up of metabolism relative to 20 °C; drag the gold point along the curve to read the $Q_{10}$ at any temperature, and compare activation energies with the slider.`,
      deps: ['ecol-1.5', 'kin-2.1'],
      see: ['ecol-1.3'],
      refs: ['Brown et al. 2004'],
      tags: ['metabolism', 'temperature'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Metabolic_theory_of_ecology' },
      viz(v) {
        const M = v.M, E0 = 0.65, Tk = (c) => c + 273.15, ikT = (c) => 1 / (KB * Tk(c));
        const corr = v.toggle('mass correction (divide by M^3/4)', true);
        const t1 = v.slider('lowest temperature (°C)', 0, 38, 2, { step: 0.5 }), t2 = v.slider('highest temperature (°C)', 2, 40, 38, { step: 0.5 });
        const Es = v.slider(String.raw`activation energy $E$ for the right panel (eV)`, 0.2, 1.2, 0.65, { step: 0.01 });
        let seed = 7;
        v.button('new sample', () => { seed++; });
        const A = v.stage({ x: [36.9, 42.6], y: [-10, 4], axes: 'box', height: 350, weight: 1.15, xlabel: '1/kT (1/eV), colder to the right', title: String.raw`Arrhenius plot of $\ln(B/M^{3/4})$` });
        const Bs = v.stage({ x: [0, 40], y: [0, 3.6], axes: 'box', height: 350, weight: 1, xlabel: 'temperature (°C)', title: 'metabolic rate ÷ rate at 20 °C' });
        const hq = Bs.handle(30, 1, { color: 'gold', constrain: (x) => { const c = M.clamp(x, 0.5, 39.5); return [c, Math.exp(Es.value * (ikT(20) - ikT(c)))]; } });
        let info = null;
        v.render(() => {
          const lo = Math.min(t1.value, t2.value), hi = Math.max(t1.value, t2.value), rng = v.rng(seed), n = 140;
          const b0 = 0.3 * Math.exp(E0 * ikT(20)); // 0.3 W for a 1 kg ectotherm at 20 °C
          const pts = [];
          for (let i = 0; i < n; i++) {
            const m = 10 ** rng.uniform(-4, 1), c = rng.uniform(lo, hi), B = b0 * m ** 0.75 * Math.exp(-E0 * ikT(c) + 0.35 * rng.normal());
            pts.push({ m, c, B, x: ikT(c) });
          }
          const yc = pts.map((p) => Math.log(p.B / p.m ** 0.75)), yr = pts.map((p) => Math.log(p.B));
          const Rc = M.linreg(pts.map((p) => p.x), yc), Rr = M.linreg(pts.map((p) => p.x), yr);
          const ys = corr.value ? yc : yr, Rg = corr.value ? Rc : Rr;
          A.setView(null, corr.value ? [-4.6, 2] : [-11.5, 4.5]);
          A.setTitle(corr.value ? String.raw`Arrhenius plot of $\ln(B/M^{3/4})$` : String.raw`Arrhenius plot of $\ln B$ (no mass correction)`);
          for (const c of [0, 10, 20, 30, 40]) { A.vline(ikT(c), { color: 'grid', width: 1 }); A.text(`${c} °C`, ikT(c), A.yr[1], { align: 'center', baseline: 'top', dy: 4, size: 10.5, color: 'muted' }); }
          A.vband(A.xr[0], ikT(hi), { color: 'grid', alpha: 0.5 }); A.vband(ikT(lo), A.xr[1], { color: 'grid', alpha: 0.5 });
          const big = pts.map((p, i) => [p.x, ys[i], Math.log10(p.m)]);
          for (const [x, y, lm] of big) A.dot(x, y, { r: 2.2 + 0.55 * (lm + 4), color: 'teal', alpha: 0.55, ring: false });
          A.fn((x) => Rg.intercept + Rg.slope * x, { color: 'accent', width: 2.8, domain: [ikT(hi), ikT(lo)] });
          const nT = M.dist.studentT(n - 2).quantile(0.975);
          info = { E: -Rc.slope, ciE: nT * Rc.seSlope, Er: -Rr.slope, ciR: nT * Rr.seSlope, lo, hi };
          // right panel
          const E = Es.value, rel = (c, e) => Math.exp(e * (ikT(20) - ikT(c)));
          Bs.fn((c) => rel(c, 0.3), { color: 'faint', dash: [4, 4], width: 1.2 });
          Bs.fn((c) => rel(c, 1.0), { color: 'faint', dash: [4, 4], width: 1.2 });
          Bs.text('E = 0.3', 40, rel(40, 0.3), { align: 'right', dy: 10, size: 10.5, color: 'muted' });
          const c1 = 1 / (KB * (ikT(20) - Math.log(3.2))) - 273.15;
          Bs.text('E = 1.0', c1, 3.2, { align: 'right', dx: -6, size: 10.5, color: 'muted' });
          Bs.fn((c) => rel(c, E), { color: 'green', width: 2.8 });
          Bs.hline(1, { color: 'grid' }); Bs.vline(20, { color: 'grid' });
          hq.set(hq.x, rel(hq.x, E));
          const q10 = rel(hq.x + 5, E) / rel(hq.x - 5, E), per = (rel(hq.x + 1, E) / rel(hq.x, E) - 1) * 100;
          Bs.text(`Q10 = ${q10.toFixed(2)}`, hq.x, hq.y, { dx: -10, dy: -14, align: 'right', color: 'gold', weight: 700 });
          info.q10 = q10; info.per = per; info.Tq = hq.x; info.Ev = E; info.dev = rel(10, E) / rel(20, E);
        });
        v.legend([['teal', 'synthetic measurements (dot size ∝ log mass)', { dot: true }], ['accent', 'least-squares line'], ['green', 'rate relative to 20 °C']]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return String.raw`fitted activation energy with mass correction **$E = ${i.E.toFixed(2)} \pm ${i.ciE.toFixed(2)}$ eV** (true value 0.65; published 0.6–0.7) · without mass correction $E = ${i.Er.toFixed(2)} \pm ${i.ciR.toFixed(2)}$ eV · temperatures ${i.lo}–${i.hi} °C · right: at ${i.Tq.toFixed(1)} °C with $E = ${i.Ev.toFixed(2)}$ eV, $Q_{10} = ${i.q10.toFixed(2)}$ and each extra degree adds ${i.per.toFixed(1)} % · an egg that develops in 10 days at 20 °C needs ${(10 / i.dev).toFixed(1)} days at 10 °C`;
        });
      },
    },
  ],
};
