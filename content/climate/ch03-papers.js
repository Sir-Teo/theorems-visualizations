// Climate Science — Chapter 3, landmark papers: Arrhenius (1896).
//
// Data (verified): Table VII of Arrhenius (1896), Phil. Mag. (5) 41: 237–276, p. 266, "Variation of Temperature caused
// by a given Variation of Carbonic Acid", read from the scanned page (courses.seas.harvard.edu copy): for carbonic acid
// K = 0.67, 1.5, 2.0, 2.5, 3.0 times the present amount, the change in °C for 13 latitude bands from 70°–60° N to
// 50°–60° S (the last band only for Dec–Feb and Mar–May) and four seasons plus the year. The text (pp. 263–267): relative
// humidity held constant; maximum effect near the 40th parallel for K = 0.67, the 50th for 1.5, the 60th for 2 and
// beyond the 70th for higher K; geometric increase of CO₂ gives a nearly arithmetic increase of temperature; 0.62–0.55
// of the present amount for an ice-age cooling of 4–5 °C.
// Today: IPCC AR6 WG1 SPM A.4.4, equilibrium climate sensitivity best estimate 3 °C, likely 2.5–4 °C, very likely 2–5 °C.

const KS = [0.67, 1.5, 2.0, 2.5, 3.0];
const BANDS = ['70–60° N', '60–50° N', '50–40° N', '40–30° N', '30–20° N', '20–10° N', '10–0° N', '0–10° S', '10–20° S', '20–30° S', '30–40° S', '40–50° S', '50–60° S'];
const LATC = [65, 55, 45, 35, 25, 15, 5, -5, -15, -25, -35, -45, -55];
const SEAS = ['Dec–Feb', 'Mar–May', 'Jun–Aug', 'Sep–Nov', 'year'];
// T7[k][band] = [DJF, MAM, JJA, SON, year]; null = not given
const T7 = [
  [[-2.9, -3.0, -3.4, -3.1, -3.1], [-3.0, -3.2, -3.4, -3.3, -3.22], [-3.2, -3.3, -3.3, -3.4, -3.3], [-3.4, -3.4, -3.2, -3.3, -3.32], [-3.3, -3.2, -3.1, -3.1, -3.17], [-3.1, -3.1, -3.0, -3.1, -3.07], [-3.1, -3.0, -3.0, -3.0, -3.02], [-3.0, -3.0, -3.1, -3.0, -3.02], [-3.1, -3.1, -3.2, -3.1, -3.12], [-3.1, -3.2, -3.3, -3.2, -3.2], [-3.3, -3.3, -3.4, -3.4, -3.35], [-3.4, -3.4, -3.3, -3.4, -3.37], [-3.2, -3.3, null, null, null]],
  [[3.3, 3.4, 3.8, 3.6, 3.52], [3.4, 3.7, 3.6, 3.8, 3.62], [3.7, 3.8, 3.4, 3.7, 3.65], [3.7, 3.6, 3.3, 3.5, 3.52], [3.5, 3.3, 3.2, 3.5, 3.47], [3.5, 3.2, 3.1, 3.2, 3.25], [3.2, 3.2, 3.1, 3.1, 3.15], [3.1, 3.1, 3.2, 3.2, 3.15], [3.2, 3.2, 3.2, 3.2, 3.2], [3.2, 3.2, 3.4, 3.3, 3.27], [3.4, 3.5, 3.7, 3.5, 3.52], [3.6, 3.7, 3.8, 3.7, 3.7], [3.8, 3.7, null, null, null]],
  [[6.0, 6.1, 6.0, 6.1, 6.05], [6.1, 6.1, 5.8, 6.1, 6.02], [6.1, 6.1, 5.5, 6.0, 5.92], [6.0, 5.8, 5.4, 5.6, 5.7], [5.6, 5.4, 5.0, 5.2, 5.3], [5.2, 5.0, 4.9, 5.0, 5.02], [5.0, 5.0, 4.9, 4.9, 4.95], [4.9, 4.9, 5.0, 5.0, 4.95], [5.0, 5.0, 5.2, 5.1, 5.07], [5.2, 5.3, 5.5, 5.4, 5.35], [5.5, 5.6, 5.8, 5.6, 5.62], [5.8, 6.0, 6.0, 6.0, 5.95], [6.0, 6.1, null, null, null]],
  [[7.9, 8.0, 7.9, 8.0, 7.95], [8.0, 8.0, 7.6, 7.9, 7.87], [8.0, 7.9, 7.0, 7.9, 7.7], [7.9, 7.6, 6.9, 7.3, 7.42], [7.2, 7.0, 6.6, 6.7, 6.87], [6.7, 6.6, 6.3, 6.6, 6.52], [6.6, 6.4, 6.3, 6.4, 6.42], [6.4, 6.4, 6.6, 6.6, 6.5], [6.6, 6.6, 6.7, 6.7, 6.65], [6.7, 6.8, 7.0, 7.0, 6.87], [7.0, 7.2, 7.7, 7.4, 7.32], [7.7, 7.9, 7.9, 7.9, 7.85], [7.9, 8.0, null, null, null]],
  [[9.1, 9.3, 9.4, 9.4, 9.3], [9.3, 9.5, 8.9, 9.5, 9.3], [9.5, 9.4, 8.6, 9.2, 9.17], [9.3, 9.0, 8.2, 8.8, 8.82], [8.7, 8.3, 7.5, 7.9, 8.1], [7.9, 7.5, 7.2, 7.5, 7.52], [7.4, 7.3, 7.2, 7.3, 7.3], [7.3, 7.3, 7.4, 7.4, 7.35], [7.4, 7.5, 8.0, 7.6, 7.62], [7.9, 8.1, 8.6, 8.3, 8.22], [8.6, 8.7, 9.1, 8.8, 8.8], [9.1, 9.2, 9.4, 9.3, 9.25], [9.4, 9.5, null, null, null]],
];
const KCOL = ['blue', 'teal', 'orange', 'red', 'purple'];
/** Area-weighted mean (weights cos φ of the band centres) of a column over the bands where it is given. */
function areaMean(k, col) {
  let s = 0, w = 0;
  T7[k].forEach((row, b) => { const x = row[col]; if (x == null) return; const c = Math.cos((LATC[b] * Math.PI) / 180); s += c * x; w += c; });
  return s / w;
}

export default {
  collection: 'climate',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Paper',
      name: 'On the influence of carbonic acid upon the temperature',
      paper: { authors: 'Svante Arrhenius', year: 1896, title: 'On the Influence of Carbonic Acid in the Air upon the Temperature of the Ground', venue: 'Philosophical Magazine (5th series) 41 (251): 237–276', doi: '10.1080/14786449608620846' },
      introduces: ['climate-3.7', 'climate-2.8', 'climate-4.2'],
      statement: String.raw`Arrhenius computed, for every ten degrees of latitude and each season, how much the surface temperature would change if the "carbonic acid" (CO₂) in the air were multiplied by $K = 0.67, 1.5, 2, 2.5$ or $3$ (his Table VII). His conclusions:

(a) The effect is nearly the same over the whole Earth, smallest near the equator, with a flat maximum that moves poleward as $K$ grows, and larger in winter than in summer.

(b) Doubling CO₂ warms the Earth by about 5–6 °C (the area-weighted mean of his yearly column is 5.4 °C), and halving the amount to about 0.6 cools it by 4–5 °C, enough for an ice age.

(c) If CO₂ increases in **geometric** progression, the temperature increases nearly in **arithmetic** progression: each doubling adds about the same step (the logarithmic law, climate-2.8).

He held the relative humidity fixed, so his numbers include the **water-vapour feedback** (climate-4.2). Modern models and observations agree with the logarithmic law, the polar and winter amplification and the water-vapour feedback, but put the equilibrium warming for a doubling at about 3 °C (IPCC AR6: likely 2.5–4 °C), roughly half of Arrhenius's value.`,
      idea: String.raw`Fourier, Tyndall and others had shown that the atmosphere traps heat and that water vapour and CO₂ absorb infrared radiation (climate-2.3, climate-2.15). Arrhenius, a physical chemist, wanted to know whether changes in CO₂ could explain the ice ages. He took Langley's measurements of infrared radiation from the Moon at different elevations (so through different amounts of air), separated the absorption by water vapour and by CO₂, and fed them into an energy balance for the surface and a single absorbing atmospheric layer (climate-1.6), for every latitude band and season, with the observed temperature and humidity: "tedious calculations", in his words, done by hand. The result was the first quantitative estimate of climate sensitivity (climate-3.7), and in passing he noted that burning coal could raise CO₂, which he regarded as a slow and welcome warming. His sensitivity was too high because his absorption data and one-layer atmosphere were crude; the structure of his answer has survived.`,
      caption: String.raw`**Table**: Arrhenius's Table VII for the chosen factor $K$ (°C; colour scaled within the table), the paper's own numbers; click a row to follow that latitude band. **Profiles**: the change against latitude for all five factors in the chosen season, which shows his flat maximum moving poleward as $K$ grows. **Below**: the area-weighted global mean of each column against $K$ on a logarithmic axis, which turns his "geometric into arithmetic progression" into a straight line, against today's estimate $\Delta T = S\log_2 K$; drag the **climate sensitivity** $S$ across the IPCC AR6 likely range.`,
      deps: ['climate-2.3', 'climate-1.6', 'climate-2.15'],
      refs: [],
      tags: ['climate sensitivity', 'greenhouse effect', 'history'],
      credit: 'Svante Arrhenius, 1896',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Svante_Arrhenius' },
      viz(v) {
        const M = v.M;
        const kSel = v.select('carbonic acid $K$', KS.map((k, i) => ({ value: String(i), label: `×${k}` })), '2');
        const sSel = v.select('season', SEAS.map((s, i) => ({ value: String(i), label: s })), '4');
        const ecs = v.slider('climate sensitivity $S$ (°C per doubling)', 1.5, 5, 3, { step: 0.1 });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1.15, title: 'Table VII: change of temperature (°C)' });
        const sL = v.stage({ x: [-5.2, 10.5], y: [-62, 80], axes: 'box', height: 400, weight: 0.85, minWidth: 240, xlabel: 'ΔT (°C)', ylabel: 'latitude', yticks: [[-60, '60°S'], [-30, '30°S'], [0, '0°'], [30, '30°N'], [60, '60°N']], title: 'by latitude' });
        const sG = v.stage({ x: [0.55, 3.4], y: [-4.5, 10.5], xlog: true, axes: 'box', height: 250, full: true, xticks: [[0.67, '0.67'], [1, '1'], [1.5, '1.5'], [2, '2'], [2.5, '2.5'], [3, '3']], xlabel: 'CO₂ relative to 1896, K (log scale)', ylabel: 'global ΔT (°C)', title: 'global mean: each doubling adds the same step' });
        const T = v.table(sT, { rows: 13, cols: 5, square: false, cellAspect: 1.55, maxCell: 40, size: 13, rowLabels: BANDS, colLabels: SEAS, labelSize: 11.5, cmap: 'magma' });
        let row = 3;
        sT.onClick((x, y) => { const h = T.hit(x, y); if (h && h.i >= 0) row = h.i; });
        const glob = KS.map((_, k) => areaMean(k, 4));
        const slopeA = M.sum(KS.map((K, k) => glob[k] * Math.log2(K))) / M.sum(KS.map((K) => Math.log2(K) ** 2)); // fit through K = 1
        let st = null;
        v.render(() => {
          const k = +kSel.value, col = +sSel.value, D = T7[k];
          const vals = D.flat().filter((x) => x != null), lo = Math.min(...vals), hi = Math.max(...vals);
          T.draw({ value: (i, j) => (D[i][j] == null ? '—' : D[i][j]), format: (x) => (typeof x === 'number' ? x.toFixed(Math.abs(x * 10 - Math.round(x * 10)) > 1e-6 ? 2 : 1).replace('-', '−') : x),
            heat: (i, j) => (D[i][j] == null ? null : 0.18 + (0.72 * (D[i][j] - lo)) / (hi - lo || 1)), activeRow: row, activeCol: col, highlight: [] });
          // profiles by latitude
          sL.vline(0, { color: 'faint', width: 1 });
          KS.forEach((K, kk) => {
            const pts = T7[kk].map((r, b) => (r[col] == null ? null : [r[col], LATC[b]])).filter(Boolean);
            sL.path(pts, { color: KCOL[kk], width: kk === k ? 3 : 1.3, alpha: kk === k ? 1 : 0.55 });
            for (const p of pts) sL.dot(p[0], p[1], { r: kk === k ? 3.6 : 2, color: KCOL[kk] });
            const top = pts[0]; sL.text(`×${K}`, top[0], top[1], { dy: -12, color: KCOL[kk], size: 11.5, weight: 700, align: 'center' });
          });
          sL.hline(LATC[row], { color: 'gold', width: 1.4, dash: [4, 3] });
          // global mean vs K
          const S = ecs.value;
          sG.hline(0, { color: 'faint', width: 1 });
          sG.between((K) => 4 * Math.log2(K), (K) => 2.5 * Math.log2(K), 0.55, 3.4, { fill: 'green', fillAlpha: 0.14 });
          sG.fn((K) => S * Math.log2(K), { color: 'green', width: 2.4 });
          sG.fn((K) => slopeA * Math.log2(K), { color: 'ink', width: 1.4, dash: [6, 4] });
          KS.forEach((K, kk) => { sG.dot(K, areaMean(kk, col), { r: kk === k ? 6.5 : 4.5, color: KCOL[kk] }); });
          sG.dot(1, 0, { r: 4, color: 'muted', hollow: true });
          sG.text(`today: ${v.fix(S, 1)} °C per doubling`, 3.3, S * Math.log2(3.3), { dy: 26, align: 'right', color: 'green', size: 12, weight: 700 });
          sG.text(`Arrhenius: ${v.fix(slopeA, 1)} °C per doubling`, 2.2, slopeA * Math.log2(2.2), { dy: -14, align: 'right', color: 'ink', size: 12, weight: 700 });
          st = { k, col, S };
        });
        v.legend([...KS.map((K, i) => [KCOL[i], `K = ${K}`, { dot: true }]), ['green', 'today: $S\\log_2 K$, AR6 likely range shaded'], ['ink', 'Arrhenius fitted', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { k, col, S } = st, K = KS[k], gm = areaMean(k, col), now = S * Math.log2(K);
          const r = T7[k][row], band = r[col] == null ? '—' : `${v.fix(r[col], 2)} °C`;
          return `$K$ = ${K}, ${SEAS[col]}: global (area-weighted, bands he covered) **${v.fix(gm, 2)} °C**; ${BANDS[row]}: ${band} · doubling: Arrhenius **${v.fix(areaMean(2, 4), 1)} °C** for the year (his five factors fit ${v.fix(slopeA, 2)} °C per doubling, a straight line in $\\log K$: the logarithmic law) · today, $S$ = ${v.fix(S, 1)} °C per doubling gives ${v.fix(now, 2)} °C for $K$ = ${K}; IPCC AR6: best estimate 3 °C, likely 2.5–4 °C, very likely 2–5 °C — Arrhenius's value is about ${v.fix(areaMean(2, 4) / 3, 1)} times the best estimate`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.12
    // Data (verified, scanned report via geosci.uchicago.edu/~archer): §1 "the most probable global warming for a doubling of
    // CO₂ to be near 3°C with a probable error of ± 1.5°C"; the more realistic models give 2–3.5 °C; §3.1 ΔQ ≈ 4 W m⁻²
    // (±25%), blackbody λ = 4σT³ ≈ 4 W m⁻² K⁻¹ → 1 °C, fixed relative humidity halves λ → 2 °C, radiative–convective
    // λ = 2.0 ± 0.5 (Ramanathan & Coakley 1978), snow–ice albedo lowers λ by 0.1–0.9 (0.3 likely), total λ = 1.7 ± 0.8 →
    // 1.6–4.5 K, 2.4 likely; §3.2 a 1% increase of all clouds cools by 0.4 W m⁻²; Table 1 (M1, M2, M3 of Manabe; H1, H2
    // of Hansen) and §4 p. 15: hemispheric ΔT ≈ 3 °C in M1 and M2, global 2 °C in M3, 3.5 °C in H1, 3.9 °C in H2; p. 16:
    // "2°C as the lower bound from the M series and 3.5°C as the upper bound from H1 ... 0.5°C as an additional margin
    // for error on the low side ... 1°C ... on the high side ... the range 1.5°C to 4.5°C, with the most probable value
    // near 3°C". Later assessments: FAR 1990 1.5–4.5 (best guess 2.5); SAR 1995 unchanged; TAR 2001 1.5–4.5; AR4 2007
    // likely 2–4.5, best ≈ 3; AR5 2013 likely 1.5–4.5, no best estimate; AR6 2021 best 3, likely 2.5–4, very likely 2–5.
    {
      num: '3.12',
      kind: 'Paper',
      name: 'Carbon Dioxide and Climate: A Scientific Assessment',
      paper: { authors: 'J. G. Charney, A. Arakawa, D. J. Baker, et al. (Ad Hoc Study Group on Carbon Dioxide and Climate)', year: 1979, title: 'Carbon Dioxide and Climate: A Scientific Assessment', venue: 'National Academy of Sciences, Washington, DC (report)', doi: '10.17226/12181' },
      introduces: [],
      statement: String.raw`A panel of the US National Academy of Sciences, chaired by Jule Charney, concluded that if the CO₂ content of the atmosphere doubles and the climate reaches equilibrium, the global mean surface warming would most probably be **near 3 °C, with a probable error of ±1.5 °C**, larger at high latitudes.

(a) **Simple models.** Doubling CO₂ adds about $\Delta Q=4$ W m⁻² of heating; with the feedback parameter $\lambda$ the warming is $\Delta T=\Delta Q/\lambda$. A blackbody Earth has $\lambda\approx4$ W m⁻² K⁻¹ (1 °C); holding relative humidity fixed roughly halves $\lambda$ (2 °C); with snow and ice albedo the panel estimated $\lambda=1.7\pm0.8$ W m⁻² K⁻¹, hence 1.6–4.5 °C, 2.4 °C likely.

(b) **General circulation models.** Two of Manabe's models gave about 3 °C (hemispheric) and his global model 2 °C; Hansen's gave 3.5 and 3.9 °C. Judging that the M series underestimated and the H series overestimated the moisture and ice feedbacks, the panel took **2 °C as a lower bound** and **3.5 °C as an upper bound**, then added 0.5 °C below and, because of high clouds, 1 °C above: **1.5–4.5 °C**.

The estimate is an equilibrium sensitivity for a doubling: it says nothing about how fast warming comes, and the panel warned that ocean heat uptake could delay it by decades.`,
      idea: String.raw`By 1979 Keeling's curve (climate-7.16) showed CO₂ rising steadily, and the White House asked the Academy whether the warming predicted by the new general circulation models (climate-9.5) could be trusted. The panel met for five days at Woods Hole and did something new: it compared every model's equilibrium climate sensitivity (climate-3.5) with the physics of each feedback (water vapour, lapse rate, snow and ice, clouds; climate-4.5, climate-2.16), looked hard for any overlooked negative feedback ("we have tried but have been unable to find"), and turned the spread into an explicit uncertainty range. Its "3 ± 1.5 °C" became the canonical range for four decades: the IPCC reports of 1990, 1995, 2001 and 2013 kept 1.5–4.5 °C, and only AR6 (2021), combining process understanding, the historical record and palaeoclimates, narrowed the likely range to 2.5–4 °C around the same 3 °C. The often-repeated story that the range came from Manabe's 2 °C and Hansen's 4 °C plus or minus half a degree is a simplification: the report itself starts from 2 °C and from Hansen's 3.5 °C (H1) and widens them asymmetrically.`,
      caption: String.raw`**Left**: the feedback arithmetic of the report's §3. Warming $\Delta T=\Delta Q/\lambda$ is a hyperbola in the feedback parameter $\lambda$: the blackbody (1 °C) and fixed-humidity (2 °C) cases are marked, and the panel's $\lambda=1.7\pm0.8$ band (blue) maps onto a lopsided range of warmings on the vertical axis, because positive feedbacks stretch the high side. Set the **forcing**, the radiative–convective $\lambda$, and the **snow–ice** and **cloud** feedbacks; the gold point is your sensitivity. **Right**: the five general circulation models of Table 1, the bounds the panel took from them, and its margins (drag the **margin** sliders, 0.5 and 1.0 °C in the report), then every IPCC assessment since, with the gold point carried over from the left.`,
      deps: ['climate-3.5', 'climate-4.5', 'climate-9.5', 'climate-2.16'],
      refs: [],
      tags: ['climate sensitivity', 'feedbacks', 'history'],
      credit: 'Charney et al. (US National Academy of Sciences), 1979',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Charney_Report' },
      viz(v) {
        const dQ = v.slider('ΔQ for 2×CO₂ (W/m²)', 3, 5, 4, { step: 0.05 });
        const lRC = v.slider('λ, fixed humidity', 1.5, 2.5, 2.0, { step: 0.05 });
        const fIce = v.slider('snow–ice feedback', 0, 0.9, 0.3, { step: 0.05 });
        const fCl = v.slider('cloud feedback', -0.6, 0.6, 0, { step: 0.05 });
        const mLo = v.slider('low margin (°C)', 0, 1.5, 0.5, { step: 0.05 });
        const mHi = v.slider('high margin (°C)', 0, 1.5, 1.0, { step: 0.05 });
        const L = v.stage({ x: [0, 4.4], y: [0, 9], axes: 'box', height: 380, weight: 0.9, minWidth: 260, xlabel: 'feedback parameter λ (W m⁻² K⁻¹)', ylabel: 'warming for 2×CO₂ (°C)', title: 'ΔT = ΔQ / λ' });
        const R = v.stage({ x: [0, 6.2], y: [-0.9, 12.6], axes: false, height: 380, weight: 1.1, hover: true, title: 'the models, the verdict, and what came after' });
        const GCM = [['M1', 3, 'Manabe: sector, swamp ocean, no seasons, fixed clouds (hemispheric)', true], ['M2', 3, 'Manabe: as M1 with cloud feedback (hemispheric)', true], ['M3', 2, 'Manabe: global, mixed-layer ocean, seasons', false], ['H1', 3.5, 'Hansen: global, mixed layer, seasons, cloud feedback', false], ['H2', 3.9, 'Hansen: swamp ocean, no seasons, cloud feedback', false]];
        const IPCC = [['FAR 1990', 1.5, 4.5, null, null, 2.5], ['SAR 1995', 1.5, 4.5, null, null, 2.5], ['TAR 2001', 1.5, 4.5, null, null, null], ['AR4 2007', 2, 4.5, null, null, 3], ['AR5 2013', 1.5, 4.5, null, null, null], ['AR6 2021', 2.5, 4, 2, 5, 3]];
        let st = null;
        v.render(() => {
          const lam = lRC.value - fIce.value - fCl.value, dT = lam > 0.05 ? dQ.value / lam : Infinity;
          // ---- left: the hyperbola and the band
          const Q = dQ.value;
          L.vband(0.9, 2.5, { color: 'blue', alpha: 0.1 });
          L.hband(Q / 2.5, Q / 0.9, { color: 'blue', alpha: 0.1 });
          L.fn((x) => Q / x, { domain: [0.3, 4.4], color: 'ink', width: 2.4, n: 300 });
          L.line(1.7, 0, 1.7, Q / 1.7, { color: 'blue', width: 1.4, dash: [4, 3] }); L.line(0, Q / 1.7, 1.7, Q / 1.7, { color: 'blue', width: 1.4, dash: [4, 3] });
          L.text('λ = 1.7 ± 0.8', 1.7, 6.3, { size: 11.5, weight: 700, color: 'blue', align: 'center', plate: true });
          L.text(`${v.fix(Q / 2.5, 1)}–${v.fix(Q / 0.9, 1)} °C`, 0.06, Q / 0.9, { size: 11.5, weight: 700, color: 'blue', align: 'left', dy: -9 });
          for (const [x, lab] of [[4, 'blackbody'], [2, 'fixed humidity']]) { L.dot(x, Q / x, { r: 5, color: 'ink' }); L.text(lab, x, Q / x, x === 4 ? { dy: -14, size: 11.5, weight: 600, align: 'center' } : { dx: 10, dy: 12, size: 11.5, weight: 600, align: 'left' }); }
          if (isFinite(dT) && dT < 9) { L.line(lam, 0, lam, dT, { color: 'gold', width: 1.2, dash: [2, 3] }); L.dot(lam, dT, { r: 8, color: 'gold' }); }
          // ---- right: GCMs, bounds, IPCC
          const xT = (t) => t; // °C axis
          const row = (i) => 12 - i;
          for (let t = 0; t <= 6; t++) { R.line(xT(t), -0.1, xT(t), 12.3, { color: 'grid', width: 1 }); R.text(`${t}`, xT(t), -0.35, { size: 11, color: 'muted', align: 'center' }); }
          R.text('°C for doubled CO₂', 6.15, -0.35, { size: 11, color: 'muted', align: 'right', dy: -16 });
          GCM.forEach(([name, t, , hemi], i) => { R.dot(t, row(i), { r: 6, color: name[0] === 'M' ? 'teal' : 'purple', hollow: hemi }); R.text(name, 0.08, row(i), { size: 12, weight: 700, color: name[0] === 'M' ? 'teal' : 'purple' }); });
          const lo = 2, hi = 3.5, yb = row(5.15);
          R.rect(lo - mLo.value, yb - 0.32, hi + mHi.value, yb + 0.32, { fill: 'green', fillAlpha: 0.22, color: 'green', width: 1.5, radius: 4 });
          R.rect(lo, yb - 0.32, hi, yb + 0.32, { fill: 'green', fillAlpha: 0.35, stroke: false });
          R.line(3, yb - 0.45, 3, yb + 0.45, { color: 'green', width: 3 });
          R.text('Charney 1979', 0.08, yb, { size: 12, weight: 700, color: 'green' });
          R.text(`${v.fix(lo - mLo.value, 1)} – ${v.fix(hi + mHi.value, 1)}`, hi + mHi.value, yb, { dx: 8, size: 11.5, weight: 700, color: 'green' });
          R.hline(row(5.85), { color: 'faint', width: 1 });
          IPCC.forEach(([name, a, b, va, vb, best], i) => {
            const y = row(6.5 + i * 0.95);
            if (va != null) R.line(va, y, vb, y, { color: 'orange', width: 2, alpha: 0.7 });
            R.rect(a, y - 0.22, b, y + 0.22, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.2, radius: 3 });
            if (best != null) R.line(best, y - 0.34, best, y + 0.34, { color: 'orange', width: 3 });
            R.text(name, 0.08, y, { size: 11.5, weight: 600, color: 'ink' });
          });
          if (isFinite(dT) && dT < 6.2) { R.vline(dT, { color: 'gold', width: 1.4, dash: [3, 3] }); R.text('you', dT, 12.35, { size: 11, weight: 700, color: 'gold', align: 'center' }); }
          // hover on a model row shows its configuration
          const P = R.pointer; let hov = null;
          if (P.inside) GCM.forEach((g, i) => { if (Math.abs(P.y - row(i)) < 0.45) hov = g; });
          if (hov) R.text(hov[2], 6.1, row(GCM.indexOf(hov)), { align: 'right', size: 11, color: 'ink', plate: true, dy: -14 });
          st = { lam, dT };
        });
        v.legend([['blue', 'panel’s λ = 1.7 ± 0.8 and the warmings it implies', { area: true }], ['teal', 'Manabe models (hollow: hemispheric)', { dot: true }], ['purple', 'Hansen models', { dot: true }], ['green', 'bounds (dark) and margins (light), best 3 °C', { area: true }], ['orange', 'IPCC likely range (line: very likely)', { area: true }], ['gold', 'your λ and ΔT', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { lam, dT } = st;
          const you = isFinite(dT) && lam > 0.05 ? `your feedbacks: $\\lambda$ = ${v.fix(lRC.value, 2)} − ${v.fix(fIce.value, 2)} (ice) − ${v.fix(fCl.value, 2)} (clouds) = **${v.fix(lam, 2)}** W m⁻² K⁻¹, so $\\Delta T = ${v.fix(dQ.value, 2)}/${v.fix(lam, 2)}$ = **${v.fix(dT, 2)} °C**` : `your feedbacks leave $\\lambda \\le 0$: no equilibrium, a runaway — the case the panel looked for and could not find`;
          return `${you} · report: blackbody 1 °C, fixed humidity 2 °C, with snow and ice $\\lambda = 1.7 \\pm 0.8$ → ${v.fix(4 / 2.5, 1)}–${v.fix(4 / 0.9, 1)} °C (it printed 1.6–4.5), 2.4 °C likely; the same ±0.8 in $\\lambda$ is −0.8 °C and +2.1 °C in warming · models: 2 °C (M3) to 3.9 °C (H2); verdict ${v.fix(2 - mLo.value, 1)}–${v.fix(3.5 + mHi.value, 1)} °C with your margins (report: 1.5–4.5, most probable 3) · AR6 (2021): best estimate **3 °C**, likely 2.5–4 °C, very likely 2–5 °C — the 1979 central value has survived 42 years; the likely range is half as wide`;
        });
      },
    },
  ],
};
