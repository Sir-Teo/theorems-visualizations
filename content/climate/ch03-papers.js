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
      idea: String.raw`Fourier, Tyndall and others had shown that the atmosphere traps heat and that water vapour and CO₂ absorb infrared radiation (climate-2.3, climate-2.15). Arrhenius, a physical chemist, wanted to know whether changes in CO₂ could explain the ice ages. He took Langley's measurements of infrared radiation from the Moon at different elevations (so through different amounts of air), separated the absorption by water vapour and by CO₂, and fed them into an energy balance for the surface and a single absorbing atmospheric layer (climate-1.6), for every latitude band and season, with the observed temperature and humidity, after a year of hand calculation. The result was the first quantitative estimate of climate sensitivity (climate-3.7), and in passing he noted that burning coal could raise CO₂, which he regarded as a slow and welcome warming. His sensitivity was too high because his absorption data and one-layer atmosphere were crude; the structure of his answer has survived.`,
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
  ],
};
