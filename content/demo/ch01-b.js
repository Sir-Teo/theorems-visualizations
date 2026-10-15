// Demography — Chapter 1 (part b): identification, standardization, decomposition and forecasts
import { clamp, sum, nums, int, fx, sg, spread, clipHalf, AGE18, WHO18 } from './ch01.shared.js';

// UN World Population Prospects 2024: mid-year population (thousands) and deaths (persons, = abridged life-table mₓ × population)
// in 18 age groups 0–4, 5–9, …, 80–84, 85+.
const AGE = {
  SWE2019: { P: '603.1,621.8,602.4,564.2,592.6,740.5,703,645.4,633.6,662.7,682.8,609.5,566.7,544.7,562,414.6,267.2,262.2',
    D: '303,33,40,135,268,350,350,408,540,792,1379,2144,3415,5416,9223,11798,14162,38478' },
  MEX2019: { P: '10633.9,11285.9,11214.7,11251.6,10813.4,10545.7,9679.9,8825.8,8162.1,7576.3,6609.3,5554.9,4385.1,3314.7,2423.4,1672.6,1053.1,760.4',
    D: '30576,2658,3466,10104,16638,20235,20464,21934,26265,34325,41810,52785,61057,65283,72712,80546,84404,123468' },
  JPN2019: { P: '4778,5308.1,5582.3,5972.4,6038.1,6044.5,6665.2,7459.1,8878.9,9937.2,8453.6,7746.3,7563.2,8720.1,8999.4,7280.9,5357.4,5914.7',
    D: '2469,399,453,1222,2070,2092,3002,4495,7962,14583,19915,28216,42907,78180,128515,170229,225445,710249' },
  JPN1990: { P: '6343,7312.6,8582.3,10263.5,8712,7912.6,7764.4,8935.8,10973.8,8939.4,8179.6,7724,6752.3,5226,3804.1,3015.9,1868.3,1090.1',
    D: '8106,1352,1225,4526,4800,4328,5072,8354,16313,21585,30656,47936,63607,73361,90518,128916,146753,177458' },
  ITA2019: { P: '2319.2,2666.5,2845.6,2883.5,2983.8,3215.4,3300.6,3655.6,4303.1,4778.6,4894.7,4508.2,3882.8,3513,3284.1,2695.7,2214.2,2185.6',
    D: '1365,144,200,546,819,1011,1206,1941,3740,6652,11121,16836,23229,33295,51571,72751,112072,308286' },
  KEN2019: { P: '6933.9,6908.9,6571.2,5667.5,4770,4206.3,3738.3,3054.2,2445.6,1973.9,1554.7,1161.9,809.8,525.4,373.6,229.9,145.8,131.8',
    D: '62786,6676,5589,9283,13028,16436,19952,22122,22933,24033,24786,24169,23394,20725,19949,16773,15624,27994' },
  USA2019: { P: '19729.5,20835,22292.9,22078.5,22237,24101.1,23705.4,23012.5,21068.9,21044.4,21280.7,22531.3,20931.3,17468.9,13899.6,9391.7,6155.6,6025.7',
    D: '25666,2402,3339,10716,20112,27989,34205,41097,47033,65733,100101,163715,221207,256474,303466,327747,356576,845651' },
  USA1950: { P: '17184.4,13555.6,11346.6,10849.5,11770.5,12488.5,11940.9,11388.9,10431.9,9168.4,8322.2,7290.1,6168,4927.1,3420.6,2180.3,1141,628.2',
    D: '131522,8331,6583,11872,17432,20092,23762,32418,46061,62300,86767,113191,142713,163826,175752,172699,135489,129600' },
  CHN1990: { P: '127304,107304,97599,123330,127986,106513,85428,87734.2,63242.4,48117.3,44443.9,40372.5,32547.8,25358.1,17610.6,10935.5,5402.3,2354.3',
    D: '1405758,149735,101960,127743,179982,175026,159492,196553,211344,225917,340427,439273,620871,761932,847381,831273,678931,513233' },
  CHN2023: { P: '58042.5,88623.4,89335.4,81483,79963.5,86906.5,112371,113221,98609.8,98839.7,122745,114074,74712.3,76352.2,58688.5,33702.7,20157.2,14757.7',
    D: '83977,23269,22319,27030,42193,60933,96321,113594,146290,220269,488602,689384,800224,1296830,1621455,1582700,1727701,2740561' },
  SWE1950: { P: '618.9,571.2,445,418.1,463.7,545.3,533,548,536.9,485.9,431.5,376.1,328.2,267.1,207.6,133.2,68.6,38.2',
    D: '3226,343,219,297,557,676,768,1046,1413,2082,2857,3950,5570,7472,9972,10980,9684,9468' },
};

// ---------- parsed data and helpers ----------
const AG = Object.fromEntries(Object.entries(AGE).map(([k, o]) => { const P = nums(o.P), D = nums(o.D); return [k, { P, D, m: D.map((d, i) => d / P[i]), c: P.map((p) => p / sum(P)), crude: sum(D) / sum(P) }]; }));
const NAMES = { SWE2019: 'Sweden 2019', MEX2019: 'Mexico 2019', ITA2019: 'Italy 2019', KEN2019: 'Kenya 2019', JPN1990: 'Japan 1990', JPN2019: 'Japan 2019', CHN1990: 'China 1990', CHN2023: 'China 2023', USA1950: 'USA 1950', USA2019: 'USA 2019', SWE1950: 'Sweden 1950' };
/** Per-1 000 rates in AG are D (persons) / P (thousands). Directly standardized rate with weights w. */
const direct = (m, w) => { const t = sum(w); return sum(m.map((x, i) => (x * w[i]) / t)); };
const AGE_TICKS = AGE18.map((l, i) => [i, i % 3 === 0 ? l : '']);
/** US census counts, millions (US Census Bureau): conterminous United States to 1950, all 50 states from 1960. */
const US_T = [1790, 1800, 1810, 1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890, 1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
const US_P = [3.929214, 5.308483, 7.239881, 9.638453, 12.86602, 17.069453, 23.191876, 31.443321, 38.558371, 50.189209, 62.979766, 75.994575, 91.972266, 105.71062, 122.775046, 131.669275, 150.697361, 179.323175, 203.302031, 226.545805, 248.709873, 281.421906, 308.745538, 331.449281];
/** Pearl & Reed's "Logistic I" (1920; constants as restated by Pearl, Reed & Kish 1940): millions, t in years. */
const pearlReed = (t) => 197.27 / (1 + 67.32 * Math.exp(-0.0313395 * (t - 1780)));
const logistic = (f, t) => f.K / (1 + Math.exp(-f.r * (t - f.t0)));
/** For a fixed ceiling K, log(K/P − 1) is linear in t: closed-form r, t0; returns the squared error in log P. */
function fitGivenK(K, ts, ps) {
  const ys = ps.map((p) => Math.log(K / p - 1)), n = ts.length, mx = sum(ts) / n, my = sum(ys) / n;
  let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (ts[i] - mx) * (ys[i] - my); sxx += (ts[i] - mx) ** 2; }
  const r = -sxy / sxx, t0 = mx + my / r, f = { K, r, t0 };
  let sse = 0; for (let i = 0; i < n; i++) sse += (Math.log(ps[i]) - Math.log(logistic(f, ts[i]))) ** 2;
  return { ...f, sse };
}
/** Least-squares logistic (in log P) through the censuses up to `cut`: grid over log K, then golden-section refinement. */
function fitLogistic(cut) {
  const ts = US_T.filter((t) => t <= cut), ps = US_P.slice(0, ts.length), pm = Math.max(...ps);
  const lo = Math.log(pm * 1.0005), hi = Math.log(pm * 60);
  let best = null, bk = 0;
  for (let k = 0; k <= 400; k++) { const f = fitGivenK(Math.exp(lo + ((hi - lo) * k) / 400), ts, ps); if (!best || f.sse < best.sse) { best = f; bk = k; } }
  let a = lo + ((hi - lo) * Math.max(0, bk - 1)) / 400, b = lo + ((hi - lo) * Math.min(400, bk + 1)) / 400;
  for (let it = 0; it < 60; it++) { const m1 = a + (b - a) * 0.382, m2 = a + (b - a) * 0.618; if (fitGivenK(Math.exp(m1), ts, ps).sse < fitGivenK(Math.exp(m2), ts, ps).sse) b = m2; else a = m1; }
  return fitGivenK(Math.exp((a + b) / 2), ts, ps);
}
/** Three equally spaced censuses (t3 − 2h, t3 − h, t3) determine a logistic exactly (null if they are not concave enough). */
function fitThree(cut) {
  const h = Math.floor((cut - 1790) / 20) * 10; if (h < 10) return null;
  const at = (t) => US_P[US_T.indexOf(t)], t1 = cut - 2 * h, y1 = at(t1), y2 = at(cut - h), y3 = at(cut);
  const den = y1 * y3 - y2 * y2; if (!(den > 0)) return null;
  const K = (2 * y1 * y2 * y3 - y2 * y2 * (y1 + y3)) / den; if (!(K > y3)) return null;
  const r = Math.log((y2 * (K - y1)) / (y1 * (K - y2))) / h, t0 = t1 + Math.log(K / y1 - 1) / r;
  return { K, r, t0, pts: [t1, cut - h, cut] };
}

export default {
  collection: 'demo',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'The age–period–cohort identification problem',
      statement: String.raw`Suppose the log death rate in age group $a$ and period $p$ follows an additive **age–period–cohort** model
$$\log m(a, p) = \mu + \alpha_a + \pi_p + \gamma_c,\qquad c = p - a .$$
Then for every number $\theta$ the effects
$$\alpha'_a = \alpha_a + \theta(a - \bar a),\qquad \pi'_p = \pi_p - \theta(p - \bar p),\qquad \gamma'_c = \gamma_c + \theta(c - \bar c)\quad(\bar c = \bar p - \bar a)$$
reproduce exactly the same rate in every cell, because the added terms sum to $\theta(a - p + c) - \theta(\bar a - \bar p + \bar c) = 0$. So the **linear trends** of the three effects cannot be identified from any table of rates, however large and however precise: only combinations unchanged by the transformation are — the curvature (second differences) of each effect, such as a bump for one generation, and sums like (age slope $+$ period slope). Every published APC decomposition therefore rests on an extra assumption (two adjacent cohorts equal, no period trend, a period effect proportional to some external variable), and different assumptions tell different stories with the same data.`,
      idea: String.raw`With linear terms in $a$, $p$ and $c$, the columns of the design matrix are linearly dependent — the cohort column equals the period column minus the age column — so the least-squares problem has a one-dimensional null space spanned by the tilt $(+\theta, -\theta, +\theta)$ (ladr 3.11; the extreme case of multicollinearity, stat 12.12). Moving along the null space changes the parameters without changing any fitted value. On the Lexis diagram (1.5) the same fact is geometric: a trend along the diagonals can always be rewritten as an age trend minus a period trend. Departures from linearity are orthogonal to this ambiguity, which is why a localized cohort bump is visible in every decomposition.`,
      caption: String.raw`The heat map is a table of death rates by 5-year age group (rows) and period (columns), drawn as a Lexis diagram, generated from the age, period and cohort effects on the right: rates rise with age, fall over time, and the generations born around 1915–1935 carry extra mortality. Slide the **tilt θ**: the age and cohort effects rotate one way, the period effect the other (dashed: the effects as generated) — yet every cell of the table stays exactly the same, as the readout's largest change confirms. The buttons pick three stories that fit the same table. Switch on *tilt only the age effect* to see that any other change does alter the table. The cohort bump survives every tilt. Drag the gold handle to check the arithmetic in one cell.`,
      deps: ['demo-1.5'],
      see: ['epi-1.10', 'stat-12.12', 'ladr-3.11'],
      refs: ['PHG ch. 1'],
      tags: ['cohort', 'identifiability'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Age-period-cohort_analysis' },
      viz(v) {
        const M = v.M, NA = 10, NP = 12, A0 = 40, P0 = 1960;
        // effects on the index scale: a = 0…9 (ages 40–44 … 85–89), p = 0…11 (1960–64 … 2015–19), c = p − a + 9 (born ≈ 1875 + 5c)
        const ALPHA = Array.from({ length: NA }, (_, a) => -6.25 + 0.47 * a);
        const PI = Array.from({ length: NP }, (_, p) => -0.085 * (p - 5.5) + 0.05 * Math.sin(0.9 * p));
        const GAMMA = Array.from({ length: NA + NP - 1 }, (_, c) => 0.4 * Math.exp(-(((c - 9.5) / 2) ** 2)) + 0.015 * (c - 10) - 0.08);
        const abar = (NA - 1) / 2, pbar = (NP - 1) / 2, cbar = pbar - abar + (NA - 1);
        const slope = (arr) => { const n = arr.length, xm = (n - 1) / 2, ym = sum(arr) / n; let a = 0, b = 0; arr.forEach((y, i) => { a += (i - xm) * (y - ym); b += (i - xm) ** 2; }); return a / b; };
        const sP = slope(PI), sC = slope(GAMMA);
        const Hs = v.stage({ x: [1951, 2041], y: [37.5, 91.5], equal: true, height: 450, axes: 'box', weight: 1.2, minWidth: 300, ylabel: 'age', xticks: [1960, 1980, 2000, 2020], yticks: [40, 50, 60, 70, 80, 90], title: 'the table of death rates' });
        const E = v.stage({ x: [0, 1], y: [0, 3], height: 450, axes: false, weight: 1, minWidth: 260, title: 'the three effects (log rate)' });
        const th = v.slider('tilt θ (change in log rate per 5 years)', -0.25, 0.15, 0, { step: 0.005, fmt: (x) => sg(x, 3) });
        const col = v.select('colour the table by', [{ value: 'rel', label: 'rate ÷ its age group’s average' }, { value: 'abs', label: 'death rate' }], 'rel');
        v.button('as generated', () => th.set(0));
        v.button('no period trend', () => th.set(sP));
        v.button('no cohort trend', () => th.set(-sC));
        const brk = v.toggle('tilt only the age effect', false);
        const H = Hs.handle(1992.5, 62.5, { color: 'gold', constrain: (x, y) => [P0 + 5 * clamp(Math.floor((x - P0) / 5), 0, NP - 1) + 2.5, A0 + 5 * clamp(Math.floor((y - A0) / 5), 0, NA - 1) + 2.5] });
        const eff = (t, onlyAge) => ({
          al: ALPHA.map((x, a) => x + t * (a - abar)),
          pi: PI.map((x, p) => (onlyAge ? x : x - t * (p - pbar))),
          ga: GAMMA.map((x, c) => (onlyAge ? x : x + t * (c - cbar))),
        });
        const cell = (e, a, p) => e.al[a] + e.pi[p] + e.ga[p - a + NA - 1];
        const LO = cell(eff(0), 0, NP - 1) - 0.3, HI = cell(eff(0), NA - 1, 0) + 0.3, REL = 0.55;
        const rowMean = (e, a) => { let t = 0; for (let p = 0; p < NP; p++) t += cell(e, a, p); return t / NP; };
        let st = null;
        v.render(() => {
          const t = th.value, e = eff(t, brk.value), e0 = eff(0, false);
          let dmax = 0;
          for (let a = 0; a < NA; a++) for (let p = 0; p < NP; p++) {
            const z = cell(e, a, p), z0 = cell(e0, a, p); dmax = Math.max(dmax, Math.abs(z - z0));
            const x0 = P0 + 5 * p, y0 = A0 + 5 * a;
            const zz = col.value === 'abs' ? (z - LO) / (HI - LO) : 0.5 + (z - rowMean(e, a)) / (2 * REL);
            Hs.rect(x0, y0, x0 + 5, y0 + 5, { fill: M.cmap(clamp(zz, 0, 1), col.value === 'abs' ? 'viridis' : 'diverging'), fillAlpha: 1, stroke: false });
            if (Math.abs(z - z0) > 1e-9) Hs.rect(x0 + 0.25, y0 + 0.25, x0 + 4.75, y0 + 4.75, { color: 'red', width: 1.6 });
          }
          for (let k = -NA + 1; k < NP; k++) { // cohort diagonals
            const xa = P0 + 5 * Math.max(0, k), ya = A0 + 5 * Math.max(0, -k), len = 5 * Math.min(NP - Math.max(0, k), NA - Math.max(0, -k));
            Hs.line(xa, ya, xa + len, ya + len, { color: 'panel', width: 0.8, alpha: 0.45 });
          }
          const ai = Math.floor((H.y - A0) / 5), pi = Math.floor((H.x - P0) / 5), ci = pi - ai + NA - 1;
          Hs.rect(P0 + 5 * pi, A0 + 5 * ai, P0 + 5 * pi + 5, A0 + 5 * ai + 5, { color: 'gold', width: 2.6 });
          if (col.value === 'abs') Hs.colorbar([LO, HI], 'viridis', { pos: 'right', label: 'per 1 000', fmt: (x) => { const r = 1000 * Math.exp(x); return r >= 10 ? fx(r, 0) : fx(r, 1); } });
          else Hs.colorbar([-REL, REL], 'diverging', { pos: 'right', label: '× age avg', fmt: (x) => `×${fx(Math.exp(x), 2)}` });
          // ----- effects panel: three bands, each with a fixed vertical scale covering the slider's range
          const bands = [['age effect α (by age)', e.al, e0.al, 'blue', ['40', '85'], ai], ['period effect π (by period)', e.pi, e0.pi, 'orange', ['1960', '2015'], pi], ['cohort effect γ (by birth year)', e.ga, e0.ga, 'purple', ['1875', '1975'], ci]];
          bands.forEach(([name, cur, gen, cl, ends, hi], k) => {
            const top = 3 - k, base = top - 1, n = cur.length, X = (i) => 0.07 + (0.88 * i) / (n - 1);
            const ext = [];
            ext.push(...cur, ...gen);
            const lo = Math.min(...ext), hiV = Math.max(...ext), Y = (z) => base + 0.16 + (0.62 * (z - lo)) / (hiV - lo || 1);
            E.rect(0.02, base + 0.05, 0.98, top - 0.05, { fill: 'grid', fillAlpha: 0.25, stroke: false, radius: 6 });
            E.text(name, 0.04, top - 0.1, { color: cl, size: 11.5, weight: 700 });
            E.text(ends[0], X(0), base + 0.1, { align: 'center', color: 'muted', size: 10 });
            E.text(ends[1], X(n - 1), base + 0.1, { align: 'center', color: 'muted', size: 10 });
            E.path(gen.map((z, i) => [X(i), Y(z)]), { color: cl, width: 1.4, dash: [4, 4], alpha: 0.55 });
            const sl0 = slope(cur), mz = sum(cur) / n, mi = (n - 1) / 2;
            E.line(X(0), Y(mz - sl0 * mi), X(n - 1), Y(mz + sl0 * mi), { color: cl, width: 1, dash: [2, 3], alpha: 0.8 });
            E.path(cur.map((z, i) => [X(i), Y(z)]), { color: cl, width: 2.4 });
            E.dots(cur.map((z, i) => [X(i), Y(z)]), { r: 2.6, color: cl });
            E.dot(X(hi), Y(cur[hi]), { r: 5, color: 'gold' });
            const sl = slope(cur) / 5;
            E.text(`trend ${sg(sl, 3)} per year`, 0.96, top - 0.1, { align: 'right', color: 'ink', size: 11 });
          });
          st = { e, e0, ai, pi, ci, dmax, t };
        });
        v.legend([['blue', 'age'], ['orange', 'period'], ['purple', 'cohort'], ['muted', 'as generated', { dash: true }], ['red', 'cell changed', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { e, e0, ai, pi, ci, dmax, t } = st, f = (x) => fx(x, 3);
          const z = e.al[ai] + e.pi[pi] + e.ga[ci], z0 = e0.al[ai] + e0.pi[pi] + e0.ga[ci];
          const where = `ages ${A0 + 5 * ai}–${A0 + 5 * ai + 4} in ${P0 + 5 * pi}–${P0 + 5 * pi + 4} (born about ${1875 + 5 * ci})`;
          return `**${where}:** α + π + γ = ${f(e.al[ai])} + (${f(e.pi[pi])}) + (${f(e.ga[ci])}) = **${f(z)}**; as generated ${f(e0.al[ai])} + (${f(e0.pi[pi])}) + (${f(e0.ga[ci])}) = ${f(z0)} → ${fx(1000 * Math.exp(z), 1)} per 1 000 · largest change over all ${NA * NP} cells: **${dmax < 1e-12 ? '0' : fx(dmax, 3)}**${brk.value ? ' — tilting one effect alone changes the table' : ` — the tilt θ = ${sg(t, 3)} is invisible in the data`} · invariants: age trend + period trend = ${sg((slope(e.al) + slope(e.pi)) / 5, 4)} per year, period + cohort = ${sg((slope(e.pi) + slope(e.ga)) / 5, 4)}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Method',
      name: 'Direct and indirect age standardization',
      statement: String.raw`Let a population have age-specific death rates $m_x$ and age distribution $c_x$ (shares of person-years, $\sum c_x = 1$), so that its crude death rate is $\text{CDR} = \sum_x c_x m_x$ (1.3).
- **Direct standardization** fixes a standard age distribution $s_x$ and computes $\text{ASDR} = \sum_x s_x m_x$, the crude rate the population would have with the standard's age structure. Two populations standardized to the same $s$ differ only through their rates; their ratio is a weighted average of the age-specific rate ratios.
- **Indirect standardization** fixes a standard *schedule of rates* $m^S_x$ and computes the deaths expected at those rates, $E = \sum_x N_x m^S_x$ ($N_x$ the population's person-years by age). The **standardized mortality ratio** is $\text{SMR} = D/E$ and the indirectly standardized rate is $\text{SMR} \times \text{CDR}_S$.
Direct standardization needs each population's age-specific rates; indirect needs only its total deaths and age structure, which suits small populations. A standardized rate is an index, not an observed rate: its level depends on the standard chosen, while comparisons usually change little unless the rate ratios vary strongly with age.`,
      idea: String.raw`A crude rate is an average of age-specific rates weighted by the population's own age structure, so the difference between two crude rates mixes a difference in risks with a difference in weights. Using the same weights for both removes the second. The SMR asks the converse question — how many deaths would the standard's rates have produced in *this* age structure? — and any excess over that cannot be due to age. Because each SMR is weighted by its own population's expected deaths, two SMRs are strictly comparable with each other only when rate ratios are similar across ages (epi 1.8).`,
      caption: String.raw`Two populations from UN World Population Prospects 2024 (deaths = abridged life-table $m_x$ × population, 18 age groups). Left: death rates by age on a log scale. Middle: age structures, with the chosen standard outlined. Bottom left: each death rate as a stack of its age contributions (weight × rate), coloured from young (light) to old (dark): the crude rates use each population's own weights, the standardized rates one common set — choose the standard and watch the ranking hold. Bottom right: indirect standardization, each population's observed deaths over the deaths expected at the other's rates. Sweden against Mexico: Mexico's rates are higher at every age, yet Sweden's crude rate is higher. Japan 1990 against 2019 and China 1990 against 2023: crude death rates that rose while mortality fell.`,
      deps: ['demo-1.3'],
      see: ['epi-1.8', 'causal-2.6'],
      refs: ['PHG ch. 2'],
      tags: ['standardization', 'mortality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Age_adjustment' },
      viz(v) {
        const PAIRS = [['SWE2019', 'MEX2019'], ['ITA2019', 'KEN2019'], ['JPN1990', 'JPN2019'], ['CHN1990', 'CHN2023']];
        const R = v.stage({ x: [-0.7, 17.7], y: [0.05, 400], ylog: true, height: 270, axes: 'box', weight: 1, minWidth: 260, xticks: AGE_TICKS, ylabel: 'deaths per 1 000', title: 'death rates by age' });
        const S = v.stage({ x: [-0.7, 17.7], y: [0, 14], height: 270, axes: 'box', weight: 1, minWidth: 260, xticks: AGE_TICKS, ylabel: '% of population', title: 'age structure' });
        const C = v.stage({ x: [0, 5], y: [0, 16], height: 300, axes: 'box', weight: 1.55, minWidth: 300, ylabel: 'per 1 000', xticks: [], title: 'each rate as a sum of weight × rate, by age' });
        const I = v.stage({ x: [0, 3], y: [0, 4], height: 300, axes: 'box', weight: 1, minWidth: 220, ylabel: 'SMR', xticks: [], title: 'indirect: observed ÷ expected deaths' });
        const pr = v.select('compare', PAIRS.map(([a, b], k) => ({ value: k, label: `${NAMES[a]} vs ${NAMES[b]}` })), 0);
        const sd = v.select('standard', [{ value: 'who', label: 'WHO world 2000–25' }, { value: 'a', label: 'first population' }, { value: 'b', label: 'second population' }, { value: 'avg', label: 'average of the two' }], 'who');
        let st = null;
        v.render(() => {
          const [ka, kb] = PAIRS[+pr.value], A = AG[ka], B = AG[kb], na = NAMES[ka], nb = NAMES[kb];
          const w = sd.value === 'who' ? WHO18 : sd.value === 'a' ? A.c : sd.value === 'b' ? B.c : A.c.map((x, i) => (x + B.c[i]) / 2);
          const ws = w.map((x) => x / sum(w));
          // ----- rates by age
          const mx = Math.max(...A.m, ...B.m), mn = Math.min(...A.m, ...B.m);
          R.setView(null, [mn * 0.5, mx * 2.2]);
          for (const [o, col] of [[A, 'blue'], [B, 'orange']]) { const pts = o.m.map((y, i) => [i, y]); R.path(pts, { color: col, width: 2.2 }); R.dots(pts, { r: 3, color: col }); }
          const higher = A.m.filter((x, i) => B.m[i] > x).length;
          R.corner(`${nb} higher in ${higher} of 18 groups`, 'br', { color: 'ink', size: 11.5 });
          // ----- age structure
          const top = Math.max(...A.c, ...B.c, ...ws) * 100;
          S.setView(null, [0, top * 1.15]);
          A.c.forEach((x, i) => { S.rect(i - 0.38, 0, i, 100 * x, { fill: 'blue', fillAlpha: 0.6, stroke: false }); S.rect(i, 0, i + 0.38, 100 * B.c[i], { fill: 'orange', fillAlpha: 0.6, stroke: false }); });
          const stp = []; ws.forEach((x, i) => { stp.push([i - 0.5, 100 * x], [i + 0.5, 100 * x]); });
          S.path(stp, { color: 'ink', width: 1.8 });
          // ----- stacked contributions
          const cols = [['crude', A, A.c, na, 'blue'], ['standardized', A, ws, na, 'blue'], ['crude', B, B.c, nb, 'orange'], ['standardized', B, ws, nb, 'orange']];
          const vals = cols.map(([, o, wt]) => sum(o.m.map((m, i) => m * wt[i])));
          C.setView(null, [0, Math.max(...vals) * 1.22]);
          cols.forEach(([kind, o, wt, name, col], j) => {
            const x = 0.75 + j * (j < 2 ? 1 : 1) + (j >= 2 ? 0.5 : 0);
            let acc = 0;
            o.m.forEach((m, i) => { const h = m * wt[i]; C.rect(x - 0.32, acc, x + 0.32, acc + h, { fill: v.M.cmap(0.12 + 0.8 * (1 - i / 17), 'magma'), fillAlpha: 1, stroke: false }); acc += h; });
            C.rect(x - 0.32, 0, x + 0.32, acc, { color: col, width: 2.2 });
            C.text(fx(acc, 2), x, acc, { dy: -9, align: 'center', color: 'ink', size: 12, weight: 700 });
            C.text(kind, x, 0, { dy: 9, baseline: 'top', align: 'center', color: col, size: 11, weight: 650 });
          });
          C.text(na, 1.25, Math.max(...vals) * 1.13, { align: 'center', color: 'blue', size: 11.5, weight: 700 });
          C.text(nb, 3.75, Math.max(...vals) * 1.13, { align: 'center', color: 'orange', size: 11.5, weight: 700 });
          // ----- indirect standardization: each against the other's rates
          const EB = sum(B.P.map((p, i) => p * A.m[i])), EA = sum(A.P.map((p, i) => p * B.m[i])), DB = sum(B.D) / 1000, DA = sum(A.D) / 1000;
          const smrB = DB / EB, smrA = DA / EA, ytop = Math.max(smrA, smrB, 1) * 1.3;
          I.setView(null, [0, ytop]);
          I.hline(1, { color: 'ink', width: 1.2, dash: [5, 4] });
          [[0.95, smrB, 'orange', `${nb.split(' ')[0]} at ${na.split(' ')[0]}’s rates`, DB, EB], [2.05, smrA, 'blue', `${na.split(' ')[0]} at ${nb.split(' ')[0]}’s rates`, DA, EA]].forEach(([x, s, col, lab, O, Ex]) => {
            I.rect(x - 0.36, 0, x + 0.36, s, { fill: col, fillAlpha: 0.6, color: col, width: 1.6 });
            I.text(fx(s, 2), x, s, { dy: -9, align: 'center', color: 'ink', size: 12, weight: 700 });
            I.text(`${int(O)}k ÷ ${int(Ex)}k`, x, s, { dy: -24, align: 'center', color: 'muted', size: 10.5 });
            I.text(lab, x, 0, { dy: 9, baseline: 'top', align: 'center', color: col, size: 10.5, weight: 650 });
          });
          st = { na, nb, vals, higher, smrA, smrB, DB, EB, A, B };
        });
        v.legend([['blue', 'first population'], ['orange', 'second population'], ['ink', 'standard weights'], ['muted', 'stack colours: young (light) → old (dark)', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { na, nb, vals, higher, smrA, smrB, DB, EB, A, B } = st, rat = B.m.map((x, i) => x / A.m[i]);
          const cr = vals[0] > vals[2] ? `${na} higher` : `${nb} higher`, sr = vals[1] > vals[3] ? `${na} higher` : `${nb} higher`;
          return `Crude death rates: ${na} **${fx(vals[0], 2)}**, ${nb} **${fx(vals[2], 2)}** per 1 000 (${cr}). Directly standardized: ${na} **${fx(vals[1], 2)}**, ${nb} **${fx(vals[3], 2)}** (${sr}; ratio ${fx(vals[3] / vals[1], 2)}). ${nb}'s rates are higher in ${higher} of 18 age groups (rate ratios ${fx(Math.min(...rat), 2)} to ${fx(Math.max(...rat), 2)}). Indirect: ${nb} recorded ${int(DB)} thousand deaths against ${int(EB)} thousand expected at ${na}'s rates → SMR **${fx(smrB, 2)}**; ${na} against ${nb}'s rates → SMR ${fx(smrA, 2)} — not the reciprocal ${fx(1 / smrB, 2)}, because each SMR weights the age groups by its own population.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Paradox',
      name: 'Simpson’s paradox in crude death rates',
      statement: String.raw`A population $B$ can have a higher death rate than population $A$ in **every** age group and nevertheless a **lower** crude death rate, because $\text{CDR} = \sum_x c_x m_x$ weights the rates by each population's own age structure. With two age groups, young and old, rates $m^y < m^o$ and a share $s$ of old people,
$$\text{CDR} = m^y + s\,(m^o - m^y),$$
so if $m^y_B > m^y_A$ and $m^o_B > m^o_A$ the paradox $\text{CDR}_B < \text{CDR}_A$ occurs exactly when $m^y_B + s_B(m^o_B - m^y_B) < m^y_A + s_A(m^o_A - m^y_A)$ — a half-plane of age structures $(s_A, s_B)$ lying below the diagonal $s_A = s_B$, so it needs $B$ to be markedly younger. A real instance (UN WPP 2024): in 2019 Mexico's death rate exceeded Sweden's in every age group, while Mexico's crude death rate was 6.1 per 1 000 and Sweden's 8.7. The crude rate answers "how many deaths per head this year"; the age-specific rates answer "how risky is it to be a given age here" — age confounds the comparison of the two countries.`,
      idea: String.raw`The crude rate is a weighted mean, and a weighted mean sits wherever its weights put it between the group values: each population is a lever whose ends are its young and old death rates and whose balance point is set by the share of old people. $B$'s whole lever can lie above $A$'s while $B$'s balance point sits near its young end and $A$'s near its old end. This is Simpson's paradox (causal 4.4) with age as the lurking variable; giving both populations the same weights — standardization (1.7) — removes it, and on the diagonal $s_A = s_B$ it cannot occur.`,
      caption: String.raw`Each population is a lever: its ends are the death rates of the young (under 65) and the old (65 and over), and its crude rate is the dot that divides it in proportion to the share of old people. Drag the ends to change the rates and the dots to change the age structures (or drag the point in the square). Right: the square of all age structures $(s_A, s_B)$; in the red region the crude ranking contradicts the age-specific one, and the diagonal is "same age structure". Presets: a two-group toy, and Sweden vs Mexico or Italy vs Kenya in 2019 collapsed into two age groups (UN WPP 2024).`,
      deps: ['demo-1.7', 'causal-4.4'],
      see: ['epi-1.8'],
      refs: ['PHG ch. 2'],
      tags: ['paradox', 'standardization'],
      credit: 'G. Udny Yule, 1903; Edward H. Simpson, 1951',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Simpson%27s_paradox' },
      viz(v) {
        const L = v.stage({ x: [0, 3], y: [0, 70], height: 400, axes: 'box', weight: 1.2, minWidth: 290, ylabel: 'deaths per 1 000', xticks: [], title: 'two levers: young and old death rates' });
        const Q = v.stage({ x: [-0.06, 1.06], y: [-0.06, 1.06], equal: true, height: 400, axes: false, weight: 1, minWidth: 260, title: 'all age structures: where is the paradox?' });
        const two = (k) => { const o = AG[k], yd = sum(o.D.slice(0, 13)), yp = sum(o.P.slice(0, 13)), od = sum(o.D.slice(13)), op = sum(o.P.slice(13)); return { y: yd / yp, o: od / op, s: op / (yp + op) }; };
        const PRE = {
          toy: { A: { y: 1.0, o: 50, s: 0.3 }, B: { y: 2.0, o: 60, s: 0.08 }, na: 'Old-land', nb: 'Young-land' },
          swemex: { A: two('SWE2019'), B: two('MEX2019'), na: 'Sweden 2019', nb: 'Mexico 2019' },
          itaken: { A: two('ITA2019'), B: two('KEN2019'), na: 'Italy 2019', nb: 'Kenya 2019' },
        };
        let names = PRE.toy, ymax = 70;
        const XA = 1, XB = 2;
        const lim = (y) => clamp(y, 0.05, ymax * 0.97);
        const hAy = L.handle(XA, 1, { color: 'blue', constrain: (x, y) => [XA, lim(y)] });
        const hAo = L.handle(XA, 50, { color: 'blue', constrain: (x, y) => [XA, lim(y)] });
        const hBy = L.handle(XB, 2, { color: 'orange', constrain: (x, y) => [XB, lim(y)] });
        const hBo = L.handle(XB, 60, { color: 'orange', constrain: (x, y) => [XB, lim(y)] });
        let sA = 0.3, sB = 0.08;
        const between = (h0, h1, y) => { const a = Math.min(h0.y, h1.y), b = Math.max(h0.y, h1.y); return clamp(y, a, b); };
        const shareOf = (hy, ho, y) => (Math.abs(ho.y - hy.y) < 1e-9 ? 0.5 : clamp((y - hy.y) / (ho.y - hy.y), 0, 1));
        const cA = L.handle(XA, 0, { color: 'ink', r: 6, constrain: (x, y) => [XA, between(hAy, hAo, y)], onDrag: (h) => { sA = shareOf(hAy, hAo, h.y); } });
        const cB = L.handle(XB, 0, { color: 'ink', r: 6, constrain: (x, y) => [XB, between(hBy, hBo, y)], onDrag: (h) => { sB = shareOf(hBy, hBo, h.y); } });
        const hq = Q.handle(0.3, 0.08, { color: 'ink', constrain: (x, y) => [clamp(x, 0, 1), clamp(y, 0, 1)], onDrag: (h) => { sA = h.x; sB = h.y; } });
        const load = (k) => {
          const p = PRE[k]; names = p; ymax = Math.max(p.A.o, p.B.o, 10) * 1.3;
          L.setView(null, [0, ymax]);
          hAy.y = p.A.y; hAo.y = p.A.o; hBy.y = p.B.y; hBo.y = p.B.o; sA = p.A.s; sB = p.B.s;
        };
        v.select('preset', [{ value: 'toy', label: 'toy' }, { value: 'swemex', label: 'Sweden vs Mexico 2019' }, { value: 'itaken', label: 'Italy vs Kenya 2019' }], 'toy', { onChange: (k) => load(k) });
        let st = null;
        v.render(() => {
          const A = { y: hAy.y, o: hAo.y, s: sA }, B = { y: hBy.y, o: hBo.y, s: sB };
          const crA = A.y + A.s * (A.o - A.y), crB = B.y + B.s * (B.o - B.y);
          cA.y = crA; cB.y = crB; hq.x = sA; hq.y = sB;
          const domB = B.y >= A.y && B.o >= A.o, domA = A.y >= B.y && A.o >= B.o;
          const para = (domB && crB < crA) || (domA && crA < crB);
          // ----- levers
          for (const [X, o, col, nm] of [[XA, A, 'blue', names.na], [XB, B, 'orange', names.nb]]) {
            L.line(X, o.y, X, o.o, { color: col, width: 9, alpha: 0.35, cap: 'butt' });
            L.text(nm, X, ymax, { dy: 12, align: 'center', color: col, size: 12, weight: 700 });
            L.text(`young ${fx(o.y, 1)}`, X, o.y, { dx: 14, color: col, size: 11 });
            L.text(`old ${fx(o.o, 1)}`, X, o.o, { dx: 14, color: col, size: 11 });
          }
          L.line(XA, crA, XB, crB, { color: para ? 'red' : 'green', width: 1.6, dash: [5, 4] });
          L.text(`crude ${fx(crA, 2)} (${Math.round(100 * sA)}% old)`, XA, crA, { dx: -12, align: 'right', color: 'ink', size: 11.5, weight: 700 });
          L.text(`crude ${fx(crB, 2)} (${Math.round(100 * sB)}% old)`, XB, crB, { dx: 12, dy: 14, align: 'left', color: 'ink', size: 11.5, weight: 700 });
          // ----- the square of age structures
          const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
          const dA = A.o - A.y, dB = B.o - B.y;
          Q.poly(sq, { fill: 'grid', fillAlpha: 0.25, color: 'muted', width: 1 });
          let reg = null;
          if (domB) reg = clipHalf(sq, -dA, dB, A.y - B.y);          // CDR_B < CDR_A
          else if (domA) reg = clipHalf(sq, dA, -dB, B.y - A.y);     // CDR_A < CDR_B
          if (reg && reg.length > 2) Q.poly(reg, { fill: 'red', fillAlpha: 0.22, color: 'red', width: 1.4 });
          Q.line(0, 0, 1, 1, { color: 'ink', width: 1, dash: [4, 4] });
          Q.text('same age structure', 0.62, 0.62, { dx: 6, dy: 4, align: 'left', baseline: 'top', color: 'muted', size: 10.5 });
          Q.text(`share old in ${names.na} →`, 0.5, -0.03, { align: 'center', baseline: 'top', color: 'blue', size: 11, weight: 650 });
          Q.text(`↑ share old in ${names.nb}`, 0.02, 1.03, { align: 'left', baseline: 'bottom', color: 'orange', size: 11, weight: 650 });
          for (const t of [0, 0.25, 0.5, 0.75, 1]) { Q.text(`${t * 100}%`, t, 0, { dy: 14, align: 'center', color: 'muted', size: 9.5 }); if (t > 0) Q.text(`${t * 100}%`, 0, t, { dx: -4, align: 'right', color: 'muted', size: 9.5 }); }
          if (!domA && !domB) Q.text('the rates cross: no age-specific ranking, no paradox', 0.5, 0.5, { align: 'center', color: 'muted', size: 11 });
          else if (reg && reg.length > 2) Q.text('crude ranking reversed', 0.97, 0.06, { align: 'right', color: 'red', size: 11.5, weight: 700 });
          st = { A, B, crA, crB, domA, domB, para };
        });
        v.readout(() => {
          if (!st) return '';
          const { A, B, crA, crB, domA, domB, para } = st, na = names.na, nb = names.nb;
          const dom = domB ? `${nb} has the higher death rate at both ages (${fx(B.y, 2)} vs ${fx(A.y, 2)} young, ${fx(B.o, 1)} vs ${fx(A.o, 1)} old)` : domA ? `${na} has the higher death rate at both ages (${fx(A.y, 2)} vs ${fx(B.y, 2)} young, ${fx(A.o, 1)} vs ${fx(B.o, 1)} old)` : 'the age-specific rates cross, so neither population is riskier at every age';
          return `${dom}. Crude rates: ${na} ${fx(A.y, 2)} + ${fx(A.s, 3)} × (${fx(A.o, 1)} − ${fx(A.y, 2)}) = **${fx(crA, 2)}**, ${nb} ${fx(B.y, 2)} + ${fx(B.s, 3)} × (${fx(B.o, 1)} − ${fx(B.y, 2)}) = **${fx(crB, 2)}** per 1 000. ${para ? '**Paradox:** the crude comparison reverses the age-specific one, because the riskier population is much younger.' : domA || domB ? 'No paradox: the crude comparison agrees with the age-specific one.' : ''} Standardized to a common 15% old: ${na} ${fx(A.y + 0.15 * (A.o - A.y), 2)}, ${nb} ${fx(B.y + 0.15 * (B.o - B.y), 2)}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Method',
      name: 'Kitagawa decomposition of a rate difference',
      credit: 'Evelyn M. Kitagawa, 1955',
      statement: String.raw`For two populations with age-specific rates $m^A_x, m^B_x$ and age distributions $c^A_x, c^B_x$, the difference of crude rates splits exactly into a **rate effect** and a **composition effect**:
$$\text{CDR}_B - \text{CDR}_A = \underbrace{\sum_x \frac{c^A_x + c^B_x}{2}\,(m^B_x - m^A_x)}_{\text{rate effect}} + \underbrace{\sum_x \frac{m^A_x + m^B_x}{2}\,(c^B_x - c^A_x)}_{\text{composition effect}},$$
and each sum can be read age group by age group to see where the difference arises. Holding one factor at $A$'s level while changing the other, then the reverse, gives two other exact splits ("rates first" uses $c^A$ and $m^B$, "composition first" $m^A$ and $c^B$) that disagree by an interaction term; Kitagawa's symmetric version is their average and leaves no residual. The rate effect equals the difference of directly standardized rates with the average composition as standard (1.7). The idea extends to more factors (Das Gupta) and, in economics, to the Oaxaca–Blinder decomposition of wage gaps.`,
      idea: String.raw`It is one line of algebra applied age by age: $ab - a'b' = \tfrac{b + b'}{2}(a - a') + \tfrac{a + a'}{2}(b - b')$, which can be checked by expanding. Summing over ages gives the two effects. Changing rates "at the average composition" and composition "at the average rates" treats the two populations symmetrically, so swapping $A$ and $B$ just flips both signs — the one-sided versions do not have this property.`,
      caption: String.raw`Choose two crude death rates (UN World Population Prospects 2024; 18 age groups). Left: each age group's contribution to the difference, split into a rate effect (blue: the change in that age's death rate) and a composition effect (orange: the change in that age's share of the population). Right: the waterfall from one crude rate to the other. Japan 1990 → 2019: the crude death rate rose by 4.6 per 1 000 although death rates fell at every age — a rate effect of −4.5 overwhelmed by a composition effect of +9.1, almost all of it at ages 70 and over. Switch the method to see the one-sided splits disagree, and scale the second population's death rates to watch the rate effect respond while the composition effect barely moves.`,
      deps: ['demo-1.7'],
      see: ['demo-1.8'],
      refs: ['PHG ch. 2'],
      tags: ['decomposition', 'standardization'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Oaxaca%E2%80%93Blinder_decomposition' },
      viz(v) {
        const PAIRS = [['JPN1990', 'JPN2019'], ['SWE2019', 'MEX2019'], ['SWE1950', 'SWE2019'], ['USA1950', 'USA2019'], ['CHN1990', 'CHN2023']];
        const G = v.stage({ x: [-0.7, 17.7], y: [-2, 4], height: 340, axes: 'box', weight: 1.55, minWidth: 300, xticks: AGE_TICKS, ylabel: 'per 1 000', title: 'contribution of each age group' });
        const W = v.stage({ x: [0, 4], y: [0, 14], height: 340, axes: 'box', weight: 1, minWidth: 240, xticks: [], ylabel: 'per 1 000', title: 'from one crude rate to the other' });
        const pr = v.select('compare', PAIRS.map(([a, b], k) => ({ value: k, label: `${NAMES[a]} → ${NAMES[b]}` })), 0);
        const how = v.select('method', [{ value: 'kit', label: 'Kitagawa (average weights)' }, { value: 'rf', label: 'rates first' }, { value: 'cf', label: 'composition first' }], 'kit');
        const kS = v.slider('second population’s death rates ×', 0.5, 1.5, 1, { step: 0.01, fmt: (x) => `× ${x.toFixed(2)}` });
        const parts = (A, B, k, h) => {
          const mB = B.m.map((x) => x * k), r = [], c = [];
          for (let i = 0; i < 18; i++) {
            const dm = mB[i] - A.m[i], dc = B.c[i] - A.c[i];
            if (h === 'kit') { r.push(((A.c[i] + B.c[i]) / 2) * dm); c.push(((A.m[i] + mB[i]) / 2) * dc); }
            else if (h === 'rf') { r.push(A.c[i] * dm); c.push(mB[i] * dc); }
            else { r.push(B.c[i] * dm); c.push(A.m[i] * dc); }
          }
          return { r, c, R: sum(r), C: sum(c), crA: sum(A.m.map((x, i) => x * A.c[i])), crB: sum(mB.map((x, i) => x * B.c[i])) };
        };
        let st = null;
        v.render(() => {
          const [ka, kb] = PAIRS[+pr.value], A = AG[ka], B = AG[kb], k = kS.value, D = parts(A, B, k, how.value);
          const all = [...D.r, ...D.c], hi = Math.max(0, ...all), lo = Math.min(0, ...all), pad = (hi - lo) * 0.12 || 1;
          G.setView(null, [lo - pad, hi + pad]);
          G.hline(0, { color: 'ink', width: 1 });
          for (let i = 0; i < 18; i++) {
            G.rect(i - 0.4, 0, i - 0.02, D.r[i], { fill: 'blue', fillAlpha: 0.7, stroke: false });
            G.rect(i + 0.02, 0, i + 0.4, D.c[i], { fill: 'orange', fillAlpha: 0.7, stroke: false });
          }
          G.corner(`rate effect ${sg(D.R, 2)} · composition effect ${sg(D.C, 2)}`, 'tl', { color: 'ink', size: 12, weight: 650 });
          // ----- waterfall
          const top = Math.max(D.crA, D.crB, D.crA + D.R, D.crA + Math.max(0, D.R) + Math.max(0, D.C)) * 1.25;
          W.setView(null, [0, top]);
          const bars = [[0.55, 0, D.crA, 'gray', NAMES[ka], fx(D.crA, 2)], [1.5, D.crA, D.crA + D.R, 'blue', 'rate effect', sg(D.R, 2)], [2.45, D.crA + D.R, D.crA + D.R + D.C, 'orange', 'composition', sg(D.C, 2)], [3.4, 0, D.crB, 'gray', NAMES[kb], fx(D.crB, 2)]];
          bars.forEach(([x, a, b, col, lab, val], j) => {
            W.rect(x - 0.3, a, x + 0.3, b, { fill: col, fillAlpha: col === 'gray' ? 0.45 : 0.75, color: col, width: 1.4 });
            W.text(val, x, Math.max(a, b), { dy: -9, align: 'center', color: 'ink', size: 11.5, weight: 700 });
            W.text(lab, x, 0, { dy: 9, baseline: 'top', align: 'center', color: col === 'gray' ? 'ink' : col, size: 10.5, weight: 650 });
            if (j < 3) W.line(x + 0.3, b, bars[j + 1][0] - 0.3, b, { color: 'muted', width: 1, dash: [3, 3] });
          });
          st = { ka, kb, D, A, B, k };
        });
        v.legend([['blue', 'rate effect', { area: true }], ['orange', 'composition effect', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { ka, kb, D, A, B, k } = st, f = (x) => sg(x, 2);
          const K = parts(A, B, k, 'kit'), RF = parts(A, B, k, 'rf'), CF = parts(A, B, k, 'cf');
          const imax = D.c.reduce((b, x, i) => (Math.abs(x) > Math.abs(D.c[b]) ? i : b), 0), old = sum(D.c.slice(14));
          return `**${NAMES[ka]} → ${NAMES[kb]}${k !== 1 ? ` (rates × ${k.toFixed(2)})` : ''}:** crude death rate ${fx(D.crA, 2)} → ${fx(D.crB, 2)}, a change of **${f(D.crB - D.crA)}** per 1 000 = rate effect **${f(D.R)}** + composition effect **${f(D.C)}** (sum ${f(D.R + D.C)}). Kitagawa ${f(K.R)} / ${f(K.C)}; rates first ${f(RF.R)} / ${f(RF.C)}; composition first ${f(CF.R)} / ${f(CF.C)} — all exact, and Kitagawa's is the average of the other two. Largest composition contribution: ages ${AGE18[imax]} (${f(D.c[imax])}); ages 70+ together ${f(old)}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Phenomenon',
      name: 'Logistic forecasts of human population and their failure',
      credit: 'Raymond Pearl & Lowell J. Reed, 1920 (logistic curve after Verhulst, 1838)',
      statement: String.raw`In 1920 Pearl and Reed fitted a logistic curve $P(t) = K/\bigl(1 + e^{-r(t - t_0)}\bigr)$ to the U.S. censuses of 1790–1910 and obtained an upper limit $K = 197.27$ million, a rate $r = 3.13\%$ a year and an inflection point in 1914; they presented the curve as a law of population growth and the limit as the country's eventual ceiling. The fit was excellent for the 1920 and 1930 censuses (errors of 1.6% and 0.3%), and refits through 1950 kept giving ceilings near 200 million. The United States passed 197 million around 1967 and counted 331 million in 2020. Refitting after each later census gives a ceiling only modestly above the latest count, which the next censuses again overtake. The general lesson: the ceiling of a logistic fitted to the rising part of a growth curve is poorly determined, and human population totals are driven by fertility, mortality and migration that respond to social and economic change rather than by a fixed carrying capacity — which is why modern projections use the cohort-component method with explicit assumptions.`,
      scope: String.raw`The logistic describes populations regulated by a fixed resource limit, such as yeast or fruit flies in a closed container (mathbio 1.4). For human populations it is at most a curve-fitting device over limited periods; as a forecasting law it has repeatedly failed (the U.S. after 1950, world population fits in the 1920s–1940s).`,
      idea: String.raw`Before the inflection point a logistic is almost exponential, so data from that stretch pin down $r$ but hardly constrain $K$: very different ceilings fit the early points almost equally well, and a least-squares fit tends to put the ceiling just beyond the last observation. Pearl and Reed's constants are reproduced exactly by the three-point method through the 1790, 1850 and 1910 counts. The curve's apparent success up to 1940 reflected the slowing of growth during the Depression, not a ceiling; the baby boom and renewed immigration then overturned it. The episode is a standard warning about extrapolating a fitted curve (bighist 9.9) and about mistaking a good fit for a mechanism.`,
      caption: String.raw`U.S. census counts (dots; conterminous U.S. to 1950, all 50 states from 1960 — Alaska and Hawaii add about half a percent) and Pearl and Reed's 1920 curve (red) with its ceiling of 197.27 million. Slide the last census available to the forecaster: the blue logistic is refitted to the censuses up to then (filled dots) and extrapolated (dashed) to the censuses it did not see (hollow). Choose least squares or the three-point method, and a log axis to see the early exponential stretch. Right: the fitted ceiling against the last census used — through 1950 the fits seemed to confirm about 200 million; afterwards each ceiling sits just above the latest count.`,
      deps: ['mathbio-1.4', 'demo-1.4'],
      see: ['stat-12.2', 'bighist-9.9', 'bighist-6.4'],
      refs: ['K&C: Projection and Forecasting'],
      tags: ['forecasting', 'logistic'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Logistic_function#In_ecology:_modeling_population_growth' },
      viz(v) {
        const CUTS = US_T.filter((t) => t >= 1850), LS = Object.fromEntries(CUTS.map((c) => [c, fitLogistic(c)])), TP = Object.fromEntries(CUTS.map((c) => [c, fitThree(c)]));
        const Mn = v.stage({ x: [1780, 2062], y: [0, 420], height: 380, axes: 'box', weight: 1.6, minWidth: 320, ylabel: 'millions', xticks: [1800, 1850, 1900, 1950, 2000, 2050], title: 'U.S. population and logistic forecasts' });
        const Kp = v.stage({ x: [1843, 2027], y: [0, 600], height: 380, axes: 'box', weight: 1, minWidth: 240, ylabel: 'ceiling K (millions)', xticks: [1850, 1900, 1950, 2000], title: 'fitted ceiling vs last census used' });
        const cut = v.slider('last census used', 1850, 2020, 1910, { step: 10, int: true });
        const meth = v.select('fit', [{ value: 'ls', label: 'least squares (log scale)' }, { value: 'tp', label: 'three equally spaced censuses' }], 'ls');
        v.select('vertical axis', ['linear', 'log'], 'linear', { onChange: (x) => Mn.setScale(x === 'log' ? { ylog: true, y: [2.5, 900] } : { ylog: false, y: [0, 420] }) });
        Kp.onClick((x) => { cut.set(clamp(Math.round(x / 10) * 10, 1850, 2020)); v.invalidate(); });
        let st = null;
        v.render(() => {
          const c = Math.round(cut.value / 10) * 10, f = meth.value === 'ls' ? LS[c] : TP[c], log = Mn.ly;
          Mn.vband(c, 2062, { color: 'muted', alpha: 0.08 });
          Mn.vline(c, { color: 'gold', width: 1.6 });
          Mn.text('unseen future', Math.min(c + 4, 2050), log ? 700 : 405, { align: 'left', color: 'muted', size: 11 });
          // Pearl & Reed
          Mn.hline(197.27, { color: 'red', width: 1.2, dash: [2, 4] });
          Mn.fn(pearlReed, { domain: [1790, 2062], color: 'red', width: 2, dash: [7, 4] });
          Mn.text('Pearl & Reed 1920: K = 197.27 M', 1785, 197.27, { dy: -10, color: 'red', size: 11, weight: 650 });
          // the refit
          if (f) {
            Mn.fn((t) => logistic(f, t), { domain: [1790, c], color: 'blue', width: 2.6 });
            Mn.fn((t) => logistic(f, t), { domain: [c, 2062], color: 'blue', width: 2.2, dash: [5, 4] });
            if (f.K < (log ? 900 : 420)) { Mn.hline(f.K, { color: 'blue', width: 1.2, dash: [2, 4] }); Mn.text(`refit: K = ${fx(f.K, 1)} M`, 2058, f.K, { dy: Math.abs(f.K - 197.27) < 30 && f.K < 197.27 ? 12 : -10, align: 'right', color: 'blue', size: 11, weight: 650 }); }
            if (f.pts) for (const t of f.pts) Mn.dot(t, US_P[US_T.indexOf(t)], { r: 8, color: 'blue', hollow: true, width: 2 });
          } else Mn.text('these three censuses still curve upward: no finite ceiling', 1800, log ? 400 : 300, { color: 'blue', size: 11.5, weight: 650 });
          US_T.forEach((t, i) => { const seen = t <= c; Mn.dot(t, US_P[i], seen ? { r: 4, color: 'ink' } : { r: 4, color: 'ink', hollow: true, width: 1.8 }); });
          // ----- ceiling vs cutoff
          Kp.path(CUTS.map((t) => [t, US_P[US_T.indexOf(t)]]), { color: 'ink', width: 1.6 });
          Kp.text('population at that census', 1990, 230, { align: 'center', color: 'ink', size: 10.5 });
          Kp.path(CUTS.map((t) => [t, LS[t].K]), { color: 'blue', width: 2.2 });
          Kp.dots(CUTS.map((t) => [t, LS[t].K]), { r: 3, color: 'blue' });
          Kp.dots(CUTS.filter((t) => TP[t]).map((t) => [t, TP[t].K]), { r: 3.2, color: 'purple' });
          Kp.hline(331.449, { color: 'ink', width: 1, dash: [3, 4] });
          Kp.text('2020 census: 331 M', 1846, 331.449, { dy: -9, color: 'muted', size: 10.5 });
          Kp.dot(1910, 197.27, { r: 6, color: 'red' });
          Kp.text('Pearl & Reed', 1910, 197.27, { dx: 9, dy: 10, color: 'red', size: 10.5, weight: 650 });
          Kp.vline(c, { color: 'gold', width: 1.6 });
          if (f) Kp.dot(c, f.K, { r: 6, color: meth.value === 'ls' ? 'blue' : 'purple' });
          st = { c, f };
        });
        v.legend([['ink', 'census counts', { dot: true }], ['red', 'Pearl & Reed 1920', { dash: true }], ['blue', 'refit (least squares)'], ['purple', 'three-point fits', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { c, f } = st, P2020 = US_P[US_P.length - 1];
          if (!f) return `Censuses to ${c}: the three equally spaced counts used by the three-point method still lie on an accelerating curve, so no logistic with a finite ceiling passes through them.`;
          const cross = (K) => { for (let i = 1; i < US_T.length; i++) if (US_P[i] >= K && US_P[i - 1] < K) return US_T[i - 1] + (10 * Math.log(K / US_P[i - 1])) / Math.log(US_P[i] / US_P[i - 1]); return null; };
          const yK = cross(f.K), fc = logistic(f, 2020);
          return `Censuses 1790–${c}, ${meth.value === 'ls' ? 'least squares on log population' : `three-point method through ${f.pts.join(', ')}`}: **K = ${fx(f.K, 1)} million**, r = ${fx(100 * f.r, 2)}% a year, inflection in ${Math.round(f.t0)} (Pearl & Reed: 197.27 M, 3.13%, 1914). ${yK ? `The actual population passed this ceiling in about **${Math.round(yK)}**` : 'The actual population has not yet reached this ceiling'}; the curve's forecast for 2020 is ${fx(fc, 1)} M against the census count of ${fx(P2020, 1)} M (${sg((100 * (fc - P2020)) / P2020, 0)}%). Pearl & Reed's own curve gives ${fx(pearlReed(2020), 1)} M for 2020.`;
        });
      },
    },
  ],
};
