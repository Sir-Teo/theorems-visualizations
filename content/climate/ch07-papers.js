// Climate Science — Chapter 7, landmark papers: Keeling (1960).
//
// Data (verified):
// - Keeling (1960), Tellus 12: 200–203, Table 1 (monthly averages, ppm of dry air, read from the scanned table at
//   tellusjournal.org): Mauna Loa, Little America and South Pole columns. Two Mauna Loa cells (June and October 1958)
//   are blank in print (handwritten entries in the scan are ignored).
// - The paper's statements: maximum concentrations in spring, minimum in the fall; at the South Pole an increase of
//   "about 1.3 p.p.m. per year", nearly the 1.4 ppm expected from fossil-fuel combustion if none were removed.
// - NOAA GML Mauna Loa monthly means, March 1958 – September 2026 (file of 9 Oct 2026; Scripps data before May 1974;
//   missing months interpolated by NOAA; Dec 2022 – Jul 2023 measured at Maunakea after the eruption), and the annual
//   means 315.98 ppm (1959) and 427.35 ppm (2025).

// NOAA GML, co2_mm_mlo.txt, monthly average, from March 1958
const MLO = `
315.71 317.45 317.51 317.27 315.87 314.93 313.21 312.42 313.33 314.67 315.58 316.49 316.65 317.72 318.29 318.15 316.54 314.80 313.84 313.33
314.81 315.58 316.43 316.98 317.58 319.03 320.03 319.58 318.18 315.90 314.17 313.83 315.00 316.19 316.89 317.70 318.54 319.48 320.58 319.77
318.56 316.79 314.99 315.31 316.10 317.01 317.94 318.55 319.68 320.57 321.02 320.62 319.61 317.40 316.24 315.42 316.69 317.70 318.74 319.07
319.86 321.38 322.24 321.49 319.74 317.77 316.21 315.99 317.07 318.35 319.57 320.04 320.75 321.84 322.25 321.89 320.44 318.69 316.71 316.87
317.68 318.71 319.44 320.44 320.89 322.14 322.17 321.87 321.21 318.87 317.82 317.30 318.87 319.42 320.62 321.60 322.39 323.70 324.08 323.75
322.37 320.36 318.64 318.10 319.78 321.02 322.33 322.50 323.03 324.41 325.00 324.09 322.54 320.92 319.25 319.39 320.73 321.96 322.57 323.15
323.89 325.02 325.57 325.36 324.14 322.11 320.33 320.25 321.32 322.89 324.00 324.41 325.63 326.66 327.38 326.71 325.88 323.66 322.38 321.78
322.85 324.11 325.06 325.99 326.93 328.13 328.08 327.67 326.34 324.68 323.10 323.06 324.01 325.13 326.17 326.69 327.18 327.78 328.93 328.57
327.36 325.43 323.36 323.56 324.80 326.01 326.77 327.63 327.75 329.72 330.07 329.09 328.04 326.32 324.84 325.20 326.50 327.55 328.55 329.57
330.30 331.50 332.48 332.07 330.87 329.31 327.52 327.19 328.17 328.65 329.36 330.71 331.49 332.65 333.19 332.20 331.07 329.15 327.33 327.28
328.31 329.58 330.73 331.46 331.94 333.11 333.95 333.42 331.97 329.95 328.49 328.36 329.38 330.77 331.56 332.74 333.36 334.74 334.72 333.97
333.08 330.68 328.96 328.72 330.16 331.62 332.68 333.17 334.96 336.14 336.93 336.17 334.89 332.56 331.29 331.28 332.46 333.60 334.94 335.26
336.66 337.69 338.02 338.01 336.50 334.42 332.36 332.45 333.76 334.91 336.14 336.69 338.27 338.82 339.24 339.26 337.54 335.72 333.97 334.24
335.32 336.81 337.90 338.34 340.07 340.93 341.45 341.36 339.45 337.67 336.25 336.14 337.30 338.29 339.29 340.55 341.63 342.60 343.04 342.54
340.82 338.48 336.95 337.05 338.58 339.91 340.93 341.76 342.78 343.96 344.77 343.88 342.42 340.24 338.37 338.41 339.44 340.78 341.57 342.78
343.37 345.40 346.14 345.76 344.32 342.51 340.46 340.53 341.79 343.20 344.21 344.92 345.68 347.37 347.77 347.16 345.79 343.74 341.59 341.86
343.31 345.00 345.48 346.41 347.91 348.66 349.28 348.65 346.90 345.26 343.47 343.35 344.73 346.12 346.78 347.48 348.25 349.86 350.52 349.98
348.25 346.17 345.48 344.82 346.22 347.48 348.73 348.92 349.81 351.40 352.15 351.58 350.21 348.20 346.66 346.72 348.08 349.28 350.51 351.70
352.50 353.67 354.35 353.88 352.80 350.49 348.97 349.37 350.42 351.62 353.07 353.43 354.08 355.72 355.95 355.44 354.05 351.84 350.09 350.33
351.55 352.91 353.86 355.10 355.75 356.38 357.38 356.39 354.89 353.06 351.38 351.69 353.14 354.41 354.93 355.82 357.33 358.77 359.23 358.23
356.30 353.97 352.34 352.43 353.89 355.21 356.34 357.21 357.97 359.22 359.71 359.44 357.15 354.99 353.01 353.40 354.42 355.68 357.10 357.42
358.59 359.39 360.30 359.64 357.45 355.76 354.14 354.23 355.53 357.03 358.36 359.04 360.11 361.36 361.78 360.94 359.51 357.59 355.86 356.21
357.65 359.10 360.04 361.00 361.98 363.44 363.83 363.33 361.78 359.33 358.32 358.14 359.61 360.82 362.20 363.36 364.28 364.69 365.25 365.06
363.69 361.55 359.69 359.72 361.04 362.39 363.24 364.21 364.65 366.49 366.77 365.73 364.46 362.40 360.44 360.97 362.65 364.51 365.39 366.10
367.36 368.79 369.56 369.13 367.98 366.10 364.16 364.54 365.67 367.30 368.35 369.28 369.84 371.15 371.12 370.46 369.61 367.06 364.95 365.52
366.88 368.26 369.45 369.71 370.75 371.98 371.75 371.87 370.02 368.27 367.15 367.18 368.53 369.83 370.76 371.69 372.63 373.55 374.03 373.40
371.68 369.78 368.34 368.61 369.94 371.42 372.70 373.37 374.30 375.19 375.93 375.69 374.16 372.03 370.92 370.73 372.43 373.98 375.07 375.82
376.64 377.92 378.78 378.46 376.88 374.57 373.34 373.31 374.84 376.17 377.17 378.05 379.06 380.54 380.80 379.87 377.65 376.17 374.43 374.63
376.33 377.68 378.63 379.91 380.95 382.48 382.64 382.40 380.93 378.93 376.89 377.19 378.54 380.31 381.58 382.40 382.86 384.80 385.22 384.24
382.65 380.60 379.04 379.33 380.35 382.02 383.10 384.12 384.81 386.73 386.78 386.33 384.73 382.24 381.20 381.37 382.70 384.19 385.78 386.06
386.28 387.33 388.78 387.99 386.62 384.32 383.41 383.22 384.41 385.79 387.17 387.70 389.04 389.76 390.36 389.70 388.24 386.29 384.95 384.64
386.23 387.63 388.91 390.41 391.37 392.67 393.21 392.38 390.41 388.54 387.03 387.43 388.87 389.99 391.50 392.05 392.80 393.44 394.41 393.95
392.72 390.33 389.28 389.19 390.48 392.06 393.31 394.04 394.59 396.38 396.93 395.91 394.56 392.59 391.32 391.27 393.20 394.57 395.78 397.03
397.66 398.64 400.02 398.81 397.51 395.39 393.72 393.90 395.36 397.03 398.04 398.27 399.91 401.51 401.96 401.43 399.27 397.18 395.54 396.16
397.40 399.08 400.18 400.55 401.74 403.35 404.15 402.97 401.46 399.11 397.82 398.49 400.27 402.06 402.73 404.25 405.06 407.60 407.90 406.99
404.59 402.45 401.23 401.79 403.72 404.64 406.36 406.66 407.54 409.22 409.89 409.08 407.33 405.32 403.57 403.82 405.31 407.00 408.15 408.52
409.59 410.45 411.44 410.99 408.90 407.16 405.71 406.19 408.21 409.27 411.03 411.96 412.18 413.54 414.86 414.15 411.96 410.17 408.76 408.74
410.47 411.97 413.59 414.32 414.72 416.42 417.28 416.58 414.58 412.75 411.50 411.49 413.10 414.23 415.49 416.72 417.61 419.01 419.09 418.93
416.90 414.42 413.26 413.90 414.97 416.67 418.13 419.24 418.76 420.19 420.97 420.94 418.85 417.15 415.91 415.74 417.47 418.99 419.48 420.31
420.99 423.35 424.00 423.68 421.83 419.68 418.50 418.82 420.46 421.86 422.80 424.55 425.38 426.51 426.90 426.91 425.55 422.99 422.03 422.38
423.85 425.40 426.65 427.09 428.15 429.64 430.51 429.61 427.87 425.48 424.37 424.87 426.46 427.49 428.62 429.35 430.15 431.12 432.34 431.43
429.13 427.55 426.07
`.trim().split(/\s+/).map(Number);
const T0 = 1958 + 2.5 / 12; // centre of March 1958
// Keeling 1960, Table 1: [year, month, ppm]
const K_ML = [[1958, 3, 313.4], [1958, 4, 314.4], [1958, 5, 315.1], [1958, 7, 312.9], [1958, 8, 312.3], [1958, 9, 311.6], [1958, 11, 310.6], [1958, 12, 311.6], [1959, 1, 312.5], [1959, 2, 313.5], [1959, 3, 314.0], [1959, 4, 314.7], [1959, 5, 315.3], [1959, 6, 315.2], [1959, 7, 313.5], [1959, 8, 311.9], [1959, 9, 311.1], [1959, 10, 310.5], [1959, 11, 311.8], [1959, 12, 312.5], [1960, 1, 313.4], [1960, 2, 313.7], [1960, 3, 314.4]];
const K_SP = [[1957, 9, 311.1], [1957, 12, 312.0], [1958, 3, 311.9], [1958, 6, 312.5], [1958, 9, 313.3], [1959, 1, 312.8], [1959, 2, 313.4], [1959, 3, 312.7], [1959, 4, 314.3], [1959, 5, 314.3], [1959, 6, 314.4], [1959, 7, 314.2], [1959, 8, 314.2], [1959, 9, 314.0], [1959, 11, 313.9]];
const K_LA = [[1958, 2, 310.8], [1958, 3, 311.0], [1958, 4, 311.4], [1958, 5, 311.7], [1958, 6, 311.9], [1958, 7, 311.8], [1958, 8, 313.0], [1958, 9, 312.9], [1958, 10, 313.0]];
const tOf = (y, m) => y + (m - 0.5) / 12;
const MON = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Least squares: level + trend (+ curvature) + `H` annual harmonics, about the centre tc. Returns the fit and its seasonal cycle. */
function fitCycle(M, pts, tc, H = 2, quad = false) {
  const row = (t) => { const r = [1, t - tc]; if (quad) r.push((t - tc) ** 2); for (let k = 1; k <= H; k++) r.push(Math.cos(2 * Math.PI * k * t), Math.sin(2 * Math.PI * k * t)); return r; };
  const A = pts.map((p) => row(p[0])), b = pts.map((p) => p[1]);
  const x = M.lstsq(A, b), o = quad ? 3 : 2;
  const season = (t) => { let s = 0; for (let k = 1; k <= H; k++) s += x[o + 2 * k - 2] * Math.cos(2 * Math.PI * k * t) + x[o + 2 * k - 1] * Math.sin(2 * Math.PI * k * t); return s; };
  const trend = (t) => x[0] + x[1] * (t - tc) + (quad ? x[2] * (t - tc) ** 2 : 0);
  let mx = -1e9, mn = 1e9, tmax = 0, tmin = 0;
  for (let i = 0; i < 720; i++) { const t = i / 720, s = season(t); if (s > mx) { mx = s; tmax = t; } if (s < mn) { mn = s; tmin = t; } }
  return { x, season, trend, f: (t) => trend(t) + season(t), slope: x[1], pp: mx - mn, tmax, tmin };
}

// ───────── Revelle & Suess (1957): seawater carbonate chemistry ─────────
// Not accessed in the original (the Tellus site would not serve it here); its claims are cited through Weart, The
// Discovery of Global Warming (AIP, history.aip.org/climate/co2.htm): uptake by the surface layer "barely one-tenth the
// amount a naïve calculation would have predicted", surface water exchanging CO₂ with the air within a decade or so, and
// "Human beings are now carrying out a large scale geophysical experiment of a kind that could not have happened in the
// past nor be reproduced in the future". Chemistry (total pH scale): K₀ Weiss (1974); K₁, K₂ Lueker et al. (2000); K_B
// Dickson (1990); K_W Millero (1995); total boron Uppström (1974). Check at 25 °C, S = 35: pK₁ 5.847, pK₂ 8.966,
// pK_B 8.597, pK_W 13.217. Today: global mean Revelle factor ≈ 10.8 in 2000 (Jiang et al. 2019, Sci. Rep. 9: 18624,
// from +3.7 ≈ 34% by 2100 under RCP8.5), about one unit above pre-industrial (Sabine et al. 2004, via NOAA PMEL);
// ocean sink 2.9 ± 0.4 GtC/yr = 26% of emissions, atmosphere 48% (Global Carbon Budget 2024, ESSD 17: 965).
function seaConsts(TC, S) {
  const T = TC + 273.15, lnT = Math.log(T), T100 = T / 100, sS = Math.sqrt(S);
  return {
    K0: Math.exp(-60.2409 + 93.4517 / T100 + 23.3585 * Math.log(T100) + S * (0.023517 - 0.023656 * T100 + 0.0047036 * T100 * T100)),
    K1: 10 ** -(3633.86 / T - 61.2172 + 9.6777 * lnT - 0.011555 * S + 0.0001152 * S * S),
    K2: 10 ** -(471.78 / T + 25.929 - 3.16967 * lnT - 0.01781 * S + 0.0001122 * S * S),
    KB: Math.exp((-8966.9 - 2890.53 * sS - 77.942 * S + 1.728 * S * sS - 0.0996 * S * S) / T + 148.0248 + 137.1942 * sS + 1.62142 * S - (24.4344 + 25.085 * sS + 0.2474 * S) * lnT + 0.053105 * sS * T),
    KW: Math.exp(148.9652 - 13847.26 / T - 23.6521 * lnT + (118.67 / T - 5.977 + 1.0495 * lnT) * sS - 0.01615 * S),
    BT: (0.000416 * S) / 35,
  };
}
/** DIC, TA in mol/kg → [H⁺], species and pCO₂ (µatm). */
function seaSolve(DIC, TA, c) {
  const alk = (H) => { const d = H * H + c.K1 * H + c.K1 * c.K2; return (DIC * (c.K1 * H + 2 * c.K1 * c.K2)) / d + (c.BT * c.KB) / (c.KB + H) + c.KW / H - H - TA; };
  let lo = 1e-11, hi = 1e-5;
  for (let i = 0; i < 90; i++) { const m = Math.sqrt(lo * hi); if (alk(m) > 0) lo = m; else hi = m; }
  const H = Math.sqrt(lo * hi), d = H * H + c.K1 * H + c.K1 * c.K2;
  const co2 = (DIC * H * H) / d, hco3 = (DIC * c.K1 * H) / d, co3 = (DIC * c.K1 * c.K2) / d;
  return { H, pH: -Math.log10(H), co2, hco3, co3, pCO2: (co2 / c.K0) * 1e6 };
}
/** DIC (mol/kg) in equilibrium with pCO₂ (µatm) at alkalinity TA. */
function seaDIC(p, TA, c) { let a = 0.5e-3, b = 3.5e-3; for (let i = 0; i < 70; i++) { const m = (a + b) / 2; if (seaSolve(m, TA, c).pCO2 < p) a = m; else b = m; } return (a + b) / 2; }
const GTC_PER_PPM = 2.124, OCEAN_AREA = 3.61e14, SEAWATER_RHO = 1025;

export default {

  collection: 'climate',
  chapter: 7,
  items: [
    // ───────────────────────────────────────────────────────────── 7.16
    {
      num: '7.16',
      kind: 'Paper',
      name: 'Concentration and isotopic abundances of atmospheric CO₂',
      paper: { authors: 'Charles D. Keeling', year: 1960, title: 'The Concentration and Isotopic Abundances of Carbon Dioxide in the Atmosphere', venue: 'Tellus 12 (2): 200–203', doi: '10.1111/j.2153-3490.1960.tb01300.x' },
      introduces: ['climate-7.10'],
      statement: String.raw`With continuously recording infrared analysers calibrated against manometrically measured reference gases, Keeling found that the CO₂ content of clean air is far less variable than earlier flask measurements had suggested, and that its variations are **systematic**:

(a) In the northern hemisphere the concentration has a clear **seasonal cycle**, highest in spring (around May at Mauna Loa) and lowest in the fall, with a range that grows toward the north; the isotopic composition of the seasonal change points to land plants, which draw CO₂ down during the growing season.

(b) In Antarctica there is almost no seasonal cycle but a small, persistent **increase**: about 1.3 ppm per year at the South Pole, close to the 1.4 ppm per year expected if all the CO₂ from fossil fuel stayed in the air.

Continued at Mauna Loa, the record (climate-7.10) has risen from 316 ppm (annual mean 1959) to 427 ppm (2025), with the seasonal swing riding on an accelerating trend.`,
      idea: String.raw`Before Keeling, published CO₂ measurements scattered widely, mostly because samples were taken near cities, forests or the ground, and whether CO₂ was accumulating from fossil fuel was an open question. Revelle and Suess (1957, climate-7.15) had argued that the ocean takes up CO₂ more slowly than assumed and that humanity was conducting a large geophysical experiment, so a precise baseline was needed for the International Geophysical Year. Keeling's insight was to sample air far from local sources (Mauna Loa, at 3,400 m in the mid-Pacific; Antarctica) with an instrument stable enough to report monthly means to a tenth of a ppm. Within two years the paper had both signatures that the record still shows: the "breathing" of the northern biosphere and the rise from burning carbon (whose isotopic fingerprint, climate-7.11, later confirmed its fossil origin). It became the founding observation of the carbon cycle (climate-7.1) as a measurable, changing system.`,
      caption: String.raw`**Keeling 1960**: the paper's own monthly averages (Table 1): Mauna Loa, the South Pole and Little America (Antarctica), with a fitted trend plus annual cycle; the blue line is NOAA's present Mauna Loa record for the same months, about 3 ppm higher because the calibration scale was revised later. **1958–today**: NOAA's monthly Mauna Loa record. Drag the **window** to measure the growth rate and the seasonal amplitude in any six years; the right panel folds the detrended data in the window onto one year (blue) against Keeling's 1958–60 Mauna Loa cycle (gold).`,
      deps: ['climate-7.1', 'climate-7.11', 'climate-7.15'],
      refs: [],
      tags: ['carbon cycle', 'observations', 'history'],
      credit: 'Charles David Keeling, 1960',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Keeling_Curve' },
      viz(v) {
        const M = v.M;
        const mode = v.select('record', [{ value: 'paper', label: 'Keeling 1960 (Table 1)' }, { value: 'today', label: '1958–today (NOAA)' }], 'paper', { onChange: () => { win.el.hidden = mode.value !== 'today'; } });
        const win = v.slider('window centre (year)', 1961, 2023, 2022, { step: 0.5 });
        const fitT = v.toggle('show fitted trend + annual cycle', true);
        const s = v.stage({ x: [1957.6, 1960.4], y: [305, 320], height: 350, axes: 'box', weight: 1.55, xlabel: 'year', ylabel: 'CO₂ (ppm)', title: 'monthly mean CO₂' });
        const c = v.stage({ x: [0.5, 12.5], y: [-5, 5], height: 350, axes: 'box', weight: 0.8, minWidth: 230, xticks: MON.map((m, i) => [i + 1, m]), ylabel: 'detrended (ppm)', title: 'the seasonal cycle' });
        const mlo = MLO.map((y, i) => [T0 + i / 12, y]);
        const kml = K_ML.map(([y, m, p]) => [tOf(y, m), p]), ksp = K_SP.map(([y, m, p]) => [tOf(y, m), p]), kla = K_LA.map(([y, m, p]) => [tOf(y, m), p]);
        const fK = fitCycle(M, kml, 1959), fSP = fitCycle(M, ksp, 1959, 0), fLA = fitCycle(M, kla, 1958.5, 0);
        let st = null;
        v.render(() => {
          const today = mode.value === 'today';
          if (!today) {
            s.setView([1957.6, 1960.4], [309.3, 320.6]); s.setTicks([1958, 1959, 1960], null);
            s.clip(() => s.path(mlo.filter((p) => p[0] < 1960.5), { color: 'blue', width: 1.4, alpha: 0.75 }));
            if (fitT.value) { s.fn(fK.f, { domain: [1958.1, 1960.3], color: 'gold', width: 1.6, dash: [6, 4] }); s.fn(fSP.trend, { domain: [1957.65, 1960], color: 'teal', width: 1.6, dash: [6, 4] }); }
            s.path(kml, { color: 'gold', width: 1.4, alpha: 0.6 }); for (const p of kml) s.dot(p[0], p[1], { r: 4.2, color: 'gold' });
            for (const p of ksp) s.dot(p[0], p[1], { r: 4.2, color: 'teal' });
            for (const p of kla) s.dot(p[0], p[1], { r: 3.6, color: 'purple', hollow: true });
            s.text('NOAA record today', 1959.9, 318.9, { color: 'blue', size: 11.5, align: 'right', weight: 600 });
            s.text('Mauna Loa', 1958.42, 315.6, { color: 'gold', size: 12, weight: 700, align: 'left', dy: -8 });
            s.text('South Pole', 1959.55, 314.9, { color: 'teal', size: 12, weight: 700, align: 'left' });
            s.text('Little America', 1958.55, 313.75, { color: 'purple', size: 12, weight: 700, align: 'left' });
          } else {
            s.setView([1950, 2028], [296, 440]); s.setTicks(null, null);
            const w0 = win.value - 3, w1 = win.value + 3;
            s.vband(w0, w1, { color: 'orange', alpha: 0.16, edges: true });
            s.path(mlo, { color: 'blue', width: 1.1 });
            for (const p of kml) s.dot(p[0], p[1], { r: 2.6, color: 'gold' });
            const pts = mlo.filter((p) => p[0] >= w0 && p[0] < w1), F = fitCycle(M, pts, win.value, 2, true);
            if (fitT.value) s.fn(F.f, { domain: [w0, w1], color: 'red', width: 1.6 });
            if (win.value > 2005) s.text(`${v.fix(F.slope, 2)} ppm/yr`, w0 - 0.6, F.trend(w0) + 12, { color: 'orange', weight: 700, size: 12.5, align: 'right' });
            else s.text(`${v.fix(F.slope, 2)} ppm/yr`, w1 + 0.6, F.trend(w1) - 12, { color: 'orange', weight: 700, size: 12.5, align: 'left' });
            st = { F, pts };
          }
          // ---- seasonal cycle panel
          c.hline(0, { color: 'faint', width: 1 });
          const fold = (pts, F) => pts.map((p) => [((p[0] % 1) + 1) % 1 * 12 + 0.5, p[1] - F.trend(p[0])]);
          if (fitT.value) c.fn((m) => fK.season((m - 0.5) / 12), { color: 'gold', width: 2.2 });
          for (const q of fold(kml, fK)) c.dot(q[0], q[1], { r: 3.6, color: 'gold' });
          if (today && st) {
            const F = st.F; if (fitT.value) c.fn((m) => F.season((m - 0.5) / 12), { color: 'blue', width: 2.4 });
            for (const q of fold(st.pts, F)) c.dot(q[0], q[1], { r: 2.6, color: 'blue', alpha: 0.7 });
          } else {
            for (const q of fold(ksp, fSP)) c.dot(q[0], q[1], { r: 3.4, color: 'teal' });
            for (const q of fold(kla, fLA)) c.dot(q[0], q[1], { r: 3.2, color: 'purple', hollow: true });
          }
          if (!today) st = null;
        });
        v.legend([['gold', 'Mauna Loa, Keeling 1960', { dot: true }], ['teal', 'South Pole, Keeling 1960', { dot: true }], ['purple', 'Little America, Keeling 1960', { dot: true }], ['blue', 'Mauna Loa, NOAA today'], ['red', 'fit in the window']]);
        v.readout(() => {
          const mon = (t) => MONTH[Math.floor(t * 12) % 12];
          if (mode.value === 'paper') return `Keeling's Mauna Loa months: seasonal swing **${v.fix(fK.pp, 1)} ppm** peak to peak, highest in ${mon(fK.tmax)}, lowest in ${mon(fK.tmin)} (the paper: maximum in spring, minimum in the fall); trend ${v.fix(fK.slope, 2)} ppm/yr over these two years · South Pole: **${v.fix(fSP.slope, 2)} ppm/yr** (the paper: "about 1.3 p.p.m. per year", against 1.4 expected from fossil fuel), no seasonal cycle to speak of · NOAA's record for the same months averages ${v.fix(M.mean(kml.map((p) => MLO[Math.round((p[0] - T0) * 12)] - p[1])), 1)} ppm higher (later recalibration)`;
          if (!st) return '';
          const { F } = st, y0 = win.value - 3, y1 = win.value + 3;
          return `${v.fix(y0, 1)}–${v.fix(y1, 1)}: growth **${v.fix(F.slope, 2)} ppm/yr**, seasonal swing **${v.fix(F.pp, 1)} ppm** peak to peak (maximum in ${mon(F.tmax)}, minimum in ${mon(F.tmin)}) · Keeling 1958–60: ${v.fix(fK.slope, 2)} ppm/yr at Mauna Loa, ${v.fix(fSP.slope, 2)} at the South Pole, swing ${v.fix(fK.pp, 1)} ppm · annual mean 315.98 ppm in 1959 → 427.35 ppm in 2025 (NOAA), +${v.fix((427.35 / 315.98 - 1) * 100, 0)}%`;
        });
        win.el.hidden = true;
      },
    },
    // ───────────────────────────────────────────────────────────── 7.15
    {
      num: '7.15',
      kind: 'Paper',
      name: 'CO₂ exchange between atmosphere and ocean',
      paper: { authors: 'Roger Revelle and Hans E. Suess', year: 1957, title: 'Carbon Dioxide Exchange Between Atmosphere and Ocean and the Question of an Increase of Atmospheric CO₂ during the Past Decades', venue: 'Tellus 9 (1): 18–27', doi: '10.1111/j.2153-3490.1957.tb01849.x' },
      introduces: ['climate-7.4'],
      statement: String.raw`Revelle and Suess estimated, from the carbon-14 content of wood and of marine carbon, that a CO₂ molecule spends only about a decade in the air before it is taken up by the sea, so the ocean, holding some sixty times as much carbon as the atmosphere, might seem able to swallow almost all the CO₂ released by burning fossil fuel. They showed that it cannot, because of the **buffer chemistry of sea water**: dissolved inorganic carbon is mostly bicarbonate and carbonate ion, and added CO₂ reacts as
$$\mathrm{CO_2+CO_3^{2-}+H_2O\rightleftharpoons 2\,HCO_3^-},$$
so at fixed alkalinity the partial pressure of CO₂ in the water rises about ten times faster, in relative terms, than its total carbon:
$$R=\frac{\Delta p\mathrm{CO_2}/p\mathrm{CO_2}}{\Delta\mathrm{DIC}/\mathrm{DIC}}\approx10 .$$
The well-mixed surface layer, which holds about as much carbon as the air, can therefore absorb only about a tenth of what a naive calculation suggests, and the ocean below it is reached only over centuries, so fossil CO₂ accumulates in the atmosphere. Their famous sentence: "human beings are now carrying out a large scale geophysical experiment".

$R$ is today called the Revelle factor (climate-7.4); it depends on temperature and alkalinity (about 9 in warm, 14 in cold water) and grows as the ocean takes up CO₂. On timescales of millennia, dissolution of carbonate sediments restores much of the buffer capacity.`,
      idea: String.raw`Callendar (1938) had argued that fossil CO₂ was accumulating and warming the climate; the standard reply was that the ocean, the far larger reservoir, would absorb it. Suess had just found the dilution of radiocarbon by fossil carbon (the Suess effect), and with Revelle used it to measure the air–sea exchange (climate-7.3): fast. The paper's turn came from the chemistry of the carbonate system (climate-7.11), which Revelle added late, in a paragraph that changed the argument: fast exchange does not mean large uptake, because the buffer makes the surface water's CO₂ pressure catch up with the atmosphere's after only a small addition of carbon. The authors still underestimated the coming rise (they assumed fossil emissions would grow slowly), but the paper persuaded Revelle to place Charles Keeling's measurements on Mauna Loa and at the South Pole in the International Geophysical Year (climate-7.16), whose curve vindicated it. Today the ocean takes up about a quarter of each year's emissions, much less than its size would suggest, exactly as the buffer factor demands.`,
      caption: String.raw`**Left**: the buffer. At fixed alkalinity and temperature, the CO₂ partial pressure of sea water (blue curve) climbs steeply as its dissolved inorganic carbon rises, about ten times faster in relative terms than the dashed "naive" line, along which pCO₂ would grow in proportion to the carbon (Henry's law applied to all of it). The black point is the pre-industrial ocean (280 µatm); gold is the new equilibrium after the **added carbon**. **Right**: the share of the added carbon that stays in the air once atmosphere and the chosen **ocean layer** have equilibrated, for the real chemistry (solid) and for the naive ocean (dashed), for three depths. Change the **temperature** (cold water buffers less) and the **alkalinity**, and watch the Revelle factor in the readout. Chemistry computed with standard seawater constants; Revelle and Suess's text is quoted through Weart's history.`,
      deps: ['climate-7.3', 'climate-7.11'],
      refs: [],
      tags: ['carbon cycle', 'ocean chemistry', 'history'],
      credit: 'Roger Revelle & Hans Suess, 1957',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Revelle_factor' },
      viz(v) {
        const res = v.select('ocean layer', [{ value: '75', label: 'mixed layer 75 m' }, { value: '1000', label: 'upper 1000 m' }, { value: '3700', label: 'whole ocean' }], '75');
        const E = v.slider('added carbon (GtC)', 0, 2000, 500, { step: 10 });
        const Tc = v.slider('temperature (°C)', 0, 30, 18, { step: 0.5 });
        const TA = v.slider('alkalinity (µmol/kg)', 2100, 2500, 2300, { step: 10 });
        const L = v.stage({ x: [1850, 2350], y: [0, 1600], axes: 'box', height: 360, weight: 1, xlabel: 'dissolved inorganic carbon (µmol/kg)', ylabel: 'pCO₂ of sea water (µatm)', title: 'the buffer: pressure climbs faster than carbon' });
        const R = v.stage({ x: [0, 2000], y: [0, 100], axes: 'box', height: 360, weight: 1, xlabel: 'carbon added to the air (GtC)', ylabel: 'share left in the air (%)', title: 'where the added carbon ends up' });
        const DEPTHS = [[75, 'blue'], [1000, 'teal'], [3700, 'purple']];
        let tab = null, tabKey = '';
        const table = () => { // ln pCO₂ → DIC, tabulated once per (T, TA)
          const key = `${Tc.value}|${TA.value}`; if (key === tabKey) return tab;
          const c = seaConsts(Tc.value, 35), ta = TA.value * 1e-6, lp = [], D = [];
          for (let i = 0; i <= 70; i++) { const l = Math.log(150) + (i / 70) * (Math.log(30000) - Math.log(150)); lp.push(l); D.push(seaDIC(Math.exp(l), ta, c)); }
          tabKey = key; return (tab = { c, ta, lp, D, dic: (p) => { const l = Math.log(p), f = ((l - lp[0]) / (lp[70] - lp[0])) * 70, i = Math.max(0, Math.min(69, Math.floor(f))), u = f - i; return D[i] * (1 - u) + D[i + 1] * u; } });
        };
        const massKg = (d) => OCEAN_AREA * d * SEAWATER_RHO;
        const equil = (Tb, d, e, naive) => { // equilibrium pCO₂ after adding e GtC to the air
          const m = massKg(d) * 12e-15, C0 = 280 * GTC_PER_PPM + m * Tb.dic(280);
          if (naive) { const Coc0 = m * Tb.dic(280); return 280 + e / (GTC_PER_PPM + Coc0 / 280); }
          let a = 280, b = 29000; for (let i = 0; i < 60; i++) { const p = (a + b) / 2; if (p * GTC_PER_PPM + m * Tb.dic(p) < C0 + e) a = p; else b = p; } return (a + b) / 2;
        };
        let st = null;
        v.render(() => {
          const Tb = table(), c = Tb.c, ta = Tb.ta, d = +res.value;
          // ---- left: pCO₂ against DIC
          const D0 = Tb.dic(280) * 1e6, p1 = equil(Tb, d, E.value, false), D1 = Tb.dic(p1) * 1e6;
          L.setView([D0 - 140, D0 + 330], [0, Math.max(1000, p1 * 1.25)]);
          L.fn((x) => seaSolve(x * 1e-6, ta, c).pCO2, { color: 'blue', width: 2.8, n: 120 });
          L.fn((x) => (280 * x) / D0, { color: 'muted', width: 1.8, dash: [6, 4] });
          L.hline(280, { color: 'faint', width: 1 }); L.vline(D0, { color: 'faint', width: 1 });
          L.dot(D0, 280, { r: 6, color: 'ink' }); L.text('1850 ocean, 280 µatm', D0, 280, { dx: -10, dy: -14, size: 11.5, weight: 600, align: 'right' });
          if (E.value > 0) {
            L.line(D0, p1, D1, p1, { color: 'gold', width: 1.2, dash: [3, 3] }); L.line(D1, 0, D1, p1, { color: 'gold', width: 1.2, dash: [3, 3] });
            L.dot(D1, p1, { r: 7, color: 'gold' }); L.text(`after +${E.value} GtC: ${Math.round(p1)} µatm`, D1, p1, { dx: 10, dy: 2, size: 11.5, weight: 700, color: 'gold', align: 'left', plate: true });
          }
          L.text('naive: pCO₂ ∝ carbon', D0 + 300, (280 * (D0 + 300)) / D0, { dy: 14, size: 11, color: 'muted', weight: 600, align: 'right' });
          // ---- right: airborne share against added carbon
          for (const [dd, col] of DEPTHS) {
            const sel = dd === d, pts = [], ptsN = [];
            for (let e = 20; e <= 2000; e += 40) { pts.push([e, (100 * (equil(Tb, dd, e, false) - 280) * GTC_PER_PPM) / e]); ptsN.push([e, (100 * (equil(Tb, dd, e, true) - 280) * GTC_PER_PPM) / e]); }
            R.path(pts, { color: col, width: sel ? 3 : 1.6, alpha: sel ? 1 : 0.55 });
            R.path(ptsN, { color: col, width: sel ? 2.2 : 1.2, dash: [6, 4], alpha: sel ? 1 : 0.55 });
            R.text(dd === 75 ? 'mixed layer' : dd === 1000 ? 'upper 1 km' : 'whole ocean', 1980, pts[pts.length - 1][1], { align: 'right', dy: -10, size: 11.5, weight: 700, color: col });
          }
          const fa = E.value > 0 ? (100 * (p1 - 280) * GTC_PER_PPM) / E.value : null;
          if (fa != null) { R.vline(E.value, { color: 'gold', width: 1.2, dash: [3, 3] }); R.dot(E.value, fa, { r: 7, color: 'gold' }); }
          R.hline(48, { color: 'red', width: 1.3, dash: [2, 3] }); R.text('observed 2014–2023: 48% stays in the air', 30, 48, { dy: -10, size: 11, color: 'red', weight: 600 });
          const s0 = seaSolve(D0 * 1e-6, ta, c), s1 = seaSolve(D1 * 1e-6, ta, c);
          const rf = (DIC) => { const a = seaSolve(DIC, ta, c), b = seaSolve(DIC * 1.0005, ta, c); return (b.pCO2 / a.pCO2 - 1) / 0.0005; };
          st = { p1, D0, D1, fa, faN: (100 * (equil(Tb, d, Math.max(E.value, 1), true) - 280) * GTC_PER_PPM) / Math.max(E.value, 1), rf0: rf(D0 * 1e-6), rf1: rf(D1 * 1e-6), s0, s1, inv: massKg(d) * 12e-15 * D0 * 1e-6 };
        });
        v.legend([['blue', 'real sea water (75 m)'], ['teal', '1000 m'], ['purple', 'whole ocean'], ['muted', 'naive ocean (no buffer)', { dash: true }], ['gold', 'your addition', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { p1, D0, D1, fa, faN, rf0, rf1, s0, s1, inv } = st, lay = res.value === '75' ? 'the mixed layer' : res.value === '1000' ? 'the upper 1000 m' : 'the whole ocean';
          const add = fa == null ? '' : ` · adding ${E.value} GtC: the air rises to **${Math.round(p1)} ppm** while ${lay} gains only ${v.fix(D1 - D0, 0)} µmol/kg (${v.fix((100 * (D1 - D0)) / D0, 1)}%) — **${v.fix(fa, 0)}%** of the carbon stays airborne, against ${v.fix(faN, 0)}% for a naive ocean`;
          return `Revelle factor: **${v.fix(rf0, 1)}** at 280 µatm and ${v.fix(rf1, 1)} after the addition (${Tc.value} °C, alkalinity ${TA.value} µmol/kg) · ${lay} holds ${Math.round(inv)} GtC against ${Math.round(280 * GTC_PER_PPM)} GtC in the 1850 air; only ${v.fix((100 * s0.co2) / (D0 * 1e-6), 1)}% of its carbon is dissolved CO₂, and carbonate ion falls from ${Math.round(s0.co3 * 1e6)} to ${Math.round(s1.co3 * 1e6)} µmol/kg as it is used up${add} · Revelle & Suess (via Weart): uptake “barely one-tenth” of the naive amount · today: global mean Revelle factor ≈ 10.8 (2000), about 1 above pre-industrial; the ocean took 26% of emissions in 2014–2023 and the air kept 48% (Global Carbon Budget 2024), because only the upper ocean keeps pace`;
        });
      },
    },
  ],
};
