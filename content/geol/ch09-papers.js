// Geology & Earth Science — Chapter 9, landmark paper: Richter (1935).
//
// Data (verified):
// - Richter (1935), BSSA 25: 1–32, scan with text layer at ncedc.org/ftp/outgoing/peggy/ML/Richter_1935.pdf.
//   Table I (−log A₀ at 25, 30, …, 600 km, 116 values) parsed from the text layer and checked against the page image
//   (monotone, 5-km steps). Tables III (epicentral distances) and IV (maximum trace amplitudes, mm; Pasadena N readings
//   in parentheses are doubled, as the paper instructs) for seven of Gutenberg's 21 shocks with complete readings, and
//   the worked example of 15 February 1932 (39, 100, 107, 255, 260, 345 km; 6, 3, 1.2, 0.3, 0.3, 0.2 mm → magnitudes
//   3.20, 3.48, 3.13, 3.29, 3.31, 3.54). Recomputing the magnitudes from Tables I, III and IV reproduces the paper's
//   Table V values to ±0.02 (interpolating linearly in Table I).
// - Modern distance correction: Hutton & Boore (1987), BSSA 77: 2074–2094, −log A₀ = 1.110 log(r/100) + 0.00189(r − 100)
//   + 3.0 (r in km), the basis of the IASPEI standard local magnitude.

const LOGA0 = [1.65, 2.10, 2.32, 2.43, 2.54, 2.63, 2.70, 2.77, 2.79, 2.83, 2.87, 2.90, 2.94, 2.96, 2.98, 3.00, 3.03, 3.08, 3.10, 3.12, 3.15, 3.19, 3.21, 3.23, 3.28, 3.29, 3.30, 3.32, 3.35, 3.38, 3.40, 3.43, 3.45, 3.47, 3.50, 3.53, 3.56, 3.59, 3.62, 3.65, 3.68, 3.70, 3.72, 3.74, 3.77, 3.79, 3.81, 3.83, 3.85, 3.88, 3.92, 3.94, 3.97, 3.98, 4.00, 4.02, 4.05, 4.08, 4.10, 4.12, 4.15, 4.17, 4.20, 4.22, 4.24, 4.26, 4.28, 4.30, 4.32, 4.34, 4.36, 4.38, 4.40, 4.42, 4.44, 4.46, 4.48, 4.50, 4.51, 4.52, 4.54, 4.56, 4.57, 4.59, 4.61, 4.62, 4.63, 4.64, 4.66, 4.68, 4.69, 4.70, 4.71, 4.72, 4.73, 4.74, 4.75, 4.76, 4.77, 4.78, 4.79, 4.80, 4.81, 4.82, 4.83, 4.84, 4.85, 4.86, 4.87, 4.88, 4.89, 4.90, 4.91, 4.92, 4.93, 4.94]; // 25, 30, …, 600 km
const ST = ['Pasadena', 'Mount Wilson', 'Riverside', 'Santa Barbara', 'La Jolla', 'Tinemaha', 'Haiwee'];
// shocks: label, date, place, distances (km) P MW R SB LJ T H, N amplitudes, E amplitudes (mm, null = no reading), Richter's mean M
const SHOCKS = [
  { id: 'ex', name: '15 Feb 1932 (worked example)', d: [39, 100, 107, 255, 260, 345], st: ['station 1', 'station 2', 'station 3', 'station 4', 'station 5', 'station 6'], N: [6, 3, 1.2, 0.3, 0.3, 0.2], E: null, mean: null, printed: [3.20, 3.48, 3.13, 3.29, 3.31, 3.54] },
  { id: 'A', name: 'A · 17 Aug 1930, Mojave Desert', d: [173, 160, 146, 278, 263, 235, 140], N: [1.0, 2.3, 1.9, 0.9, 1.1, 1.1, 2.6], E: [0.8, 1.9, 2.8, 1.1, 1.2, 1.1, 2.2], mean: 3.69 },
  { id: 'C', name: 'C · 28 May 1930, Garlock fault', d: [176, 163, 170, 257, 292, 194, 95], N: [2.8, 4.4, 2.3, 4.2, 2.5, 4.5, null], E: [2.5, 3.9, 3.1, 3.8, 2.3, 3.9, 6.7], mean: 4.06 },
  { id: 'D', name: 'D · 20 Apr 1930, NE of Victorville', d: [117, 103, 75, 245, 197, 295, 181], N: [1.8, 2.9, 1.8, 1.4, 1.9, 0.6, 0.8], E: [1.4, 2.9, 1.9, 0.8, 2.3, 0.7, null], mean: 3.54 },
  { id: 'a', name: 'a · 31 Oct 1929, San Pedro Channel', d: [54, 63, 86, 165, 123, 378, 274], N: [1.5, 3.4, 12.1, 2.0, 5.7, 0.4, 0.3], E: [1.9, 6.3, 4.8, 2.1, 4.5, 0.6, 0.6], mean: 3.61 },
  { id: 'e', name: 'e · 12 May 1930, Elsinore fault', d: [178, 175, 108, 308, 57, 454, 345], N: [3.6, 2.9, 9.0, 2.1, 20.2, 1.2, 1.3], E: [3.8, 5.0, 11.1, 1.6, 15.6, 2.0, 1.6], mean: 4.22 },
  { id: 'g', name: 'g · 18 Aug 1930, off Point Concepcion', d: [188, 199, 267, 45, 324, 343, 279], N: [1.0, 1.4, 0.4, 22.7, 0.4, 0.7, 0.9], E: [1.4, 1.7, 0.3, 22.1, 0.5, 1.0, 0.7], mean: 3.76 },
  { id: 'k', name: 'k · 21 Apr 1931, Bakersfield district', d: [145, 144, 204, 124, null, 205, 120], N: [1.7, 4.3, 0.3, 2.9, null, 2.6, 1.0], E: [1.7, 2.3, 0.3, 3.1, null, 3.0, null], mean: 3.54 },
];
/** Richter's −log A₀ (positive number) at distance Δ km, linear interpolation in Table I (25–600 km). */
function richter(D) { const x = Math.min(Math.max((D - 25) / 5, 0), LOGA0.length - 1), i = Math.min(Math.floor(x), LOGA0.length - 2), f = x - i; return LOGA0[i] * (1 - f) + LOGA0[i + 1] * f; }
const hb87 = (r) => 1.110 * Math.log10(r / 100) + 0.00189 * (r - 100) + 3.0;
function readings(S) {
  const out = [];
  S.d.forEach((d, i) => { if (d == null) return; const nm = S.st ? S.st[i] : ST[i]; if (S.N && S.N[i] != null) out.push({ d, A: S.N[i], st: nm, comp: S.E ? 'N' : '' }); if (S.E && S.E[i] != null) out.push({ d, A: S.E[i], st: nm, comp: 'E' }); });
  return out;
}

export default {
  collection: 'geol',
  chapter: 9,
  items: [
    {
      num: '9.12',
      kind: 'Paper',
      name: 'An instrumental earthquake magnitude scale',
      paper: { authors: 'Charles F. Richter', year: 1935, title: 'An instrumental earthquake magnitude scale', venue: 'Bulletin of the Seismological Society of America 25 (1): 1–32', doi: '10.1785/BSSA0250010001' },
      introduces: [],
      statement: String.raw`Richter defined the size of a Southern California earthquake from the maximum trace amplitude $A$ (mm) that it writes on a standard Wood–Anderson torsion seismometer ($T_0 = 0.8$ s, magnification 2,800, damping 0.8):
$$M = \log_{10} A - \log_{10} A_0(\Delta),$$
where $-\log A_0(\Delta)$ is an empirical attenuation curve (his Table I, 25–600 km), fixed so that a shock writing 1 μm at 100 km has magnitude 0, i.e. **1 mm at 100 km is magnitude 3**. Because the attenuation curves of different shocks are nearly parallel, every station gives almost the same number: individual estimates agree within about half a unit.

This is the local magnitude $M_L$. It is defined only for that instrument and that region's attenuation (later recalibrated, e.g. Hutton & Boore 1987); a logarithmic amplitude measure, it saturates for large earthquakes (above $M \approx 6.5$), where the moment magnitude $M_w$ is used instead.`,
      idea: String.raw`In the early 1930s the Caltech network of Wood–Anderson instruments recorded hundreds of local shocks a year, and only felt intensities (geol-9.2) were available to rank them. Following a suggestion of Wadati, Richter plotted log amplitude against distance for the shocks of January 1932, found the curves roughly parallel and combined them into one curve, so that the vertical offset of any shock from it measures its size. Gutenberg suggested the logarithm and the name was borrowed from the astronomers' stellar magnitude (astro-4.3), also a logarithmic and arbitrary-zero scale. The paper tested the scale on Gutenberg's 21 well-located shocks: across 44–530 km the station magnitudes scatter by only a few tenths. The scale gave seismology its first instrumental size measure, the basis for the Gutenberg–Richter frequency law (geol-9.13) and for energy–magnitude relations.`,
      caption: String.raw`Pick a shock: dots are its maximum trace amplitudes (log mm, both horizontal components) at the Caltech stations, from Richter's Tables III and IV. The curve is his attenuation $\log A_0(\Delta) + M$ from Table I: drag **M** (or press **Fit**) to slide it onto the points; each station's own magnitude is $\log A - \log A_0(\Delta)$, shown as a tick in the strip below, and they cluster around one number. Switch the **distance correction** to Hutton & Boore (1987), the modern Southern California calibration, and compare.`,
      deps: ['astro-4.3', 'geol-9.2'],
      refs: [],
      tags: ['seismology', 'magnitude', 'history'],
      credit: 'Charles F. Richter, 1935',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Richter_scale' },
      viz(v) {
        const M = v.M;
        const which = v.select('shock', SHOCKS.map((S) => ({ value: S.id, label: S.id === 'ex' ? 'example' : S.id })), 'A', { onChange: () => fit() });
        const corr = v.select('distance correction', [{ value: 'r35', label: 'Richter 1935' }, { value: 'hb', label: 'Hutton & Boore 1987' }], 'r35', { onChange: () => fit() });
        const mS = v.slider('$M$', 1.5, 6, 3.6, { step: 0.01 });
        const shock = () => SHOCKS.find((S) => S.id === which.value);
        const negA0 = (d) => (corr.value === 'hb' ? hb87(d) : richter(d));
        const mags = () => readings(shock()).map((r) => ({ ...r, m: Math.log10(r.A) - -negA0(r.d) }));
        function fit() { const ms = mags().map((r) => r.m); mS.set(M.mean(ms)); }
        v.button('Fit', () => fit());
        const s = v.stage({ x: [0, 620], y: [-1.6, 1.8], axes: 'box', gutter: true, height: 340, full: true, hover: true, xlabel: 'epicentral distance Δ (km)', ylabel: 'log₁₀ maximum trace amplitude (mm)', title: 'amplitude against distance' });
        const g = v.stage({ x: [0, 620], y: [2.4, 5.0], axes: 'box', gutter: true, height: 170, full: true, xlabel: 'epicentral distance Δ (km)', ylabel: 'station magnitude', title: 'each station’s magnitude log A − log A₀(Δ)' });
        let st = null;
        v.render(() => {
          const S = shock(), R = mags(), m = mS.value;
          // Richter's curve and the other correction for reference
          s.fn((d) => m - negA0(d), { color: 'accent', width: 2.6, domain: [25, 600] });
          s.fn((d) => m - (corr.value === 'hb' ? richter(d) : hb87(d)), { color: 'muted', width: 1.3, dash: [6, 4], domain: [25, 600] });
          s.hline(0, { color: 'faint', width: 1 });
          s.vline(100, { color: 'faint', width: 1, dash: [3, 4] });
          s.text('1 mm', 600, 0, { dy: -8, align: 'right', size: 11, color: 'muted' });
          for (const r of R) s.dot(r.d, Math.log10(r.A), { r: 5, color: r.comp === 'E' ? 'orange' : 'blue', hollow: r.comp === 'E' });
          const P = s.pointer;
          if (P.inside) {
            let best = null, bd = 1e9;
            for (const r of R) { const dd = Math.hypot(s.X(r.d) - s.X(P.x), s.Y(Math.log10(r.A)) - s.Y(P.y)); if (dd < bd) { bd = dd; best = r; } }
            if (best && bd < 16) s.text(`${best.st}${best.comp ? ' ' + best.comp : ''}: ${best.A} mm at ${best.d} km → M = ${v.fix(best.m, 2)}`, best.d, Math.log10(best.A), { dx: best.d > 380 ? -10 : 10, dy: -14, align: best.d > 380 ? 'right' : 'left', size: 12, weight: 600, plate: true });
          }
          s.corner(`at 100 km the curve reads ${v.fix(10 ** (m - negA0(100)), 3)} mm`, 'tr', { size: 11.5, color: 'accent', weight: 600 });
          // station magnitudes
          const ms = R.map((r) => r.m), mean = M.mean(ms), sd = Math.sqrt(M.mean(ms.map((x) => (x - mean) ** 2)));
          g.hband(mean - sd, mean + sd, { color: 'green', alpha: 0.12 });
          g.hline(mean, { color: 'green', width: 2 });
          g.hline(m, { color: 'accent', width: 1.4, dash: [5, 4] });
          for (const r of R) g.dot(r.d, r.m, { r: 4.5, color: r.comp === 'E' ? 'orange' : 'blue', hollow: r.comp === 'E' });
          st = { S, ms, mean, sd, R };
        });
        v.legend([['blue', 'N–S component (or single reading)', { dot: true }], ['orange', 'E–W component', { dot: true }], ['accent', 'attenuation curve, shifted by M'], ['muted', 'the other calibration', { dash: true }], ['green', 'mean ± 1 s.d. of station magnitudes']]);
        v.readout(() => {
          if (!st) return '';
          const { S, ms, mean, sd, R } = st;
          const range = Math.max(...ms) - Math.min(...ms);
          let cmp = '';
          if (corr.value === 'r35') cmp = S.printed ? ` — Richter: ${S.printed.map((x) => x.toFixed(2)).join(', ')} (range 0.41); computed ${ms.map((x) => v.fix(x, 2)).join(', ')}` : ` — Richter’s Table V mean: **${S.mean}**`;
          else cmp = ` (Richter’s own correction gives ${v.fix(M.mean(R.map((r) => Math.log10(r.A) + richter(r.d))), 2)})`;
          return `${S.name}: ${R.length} readings from ${Math.min(...R.map((r) => r.d))} to ${Math.max(...R.map((r) => r.d))} km give **M = ${v.fix(mean, 2)} ± ${v.fix(sd, 2)}** (range ${v.fix(range, 2)})${cmp}. Each unit of M is a factor 10 in amplitude (about 32 in radiated energy); “1 mm at 100 km” is M = 3 by definition.`;
        });
        fit();
      },
    },
  ],
};
