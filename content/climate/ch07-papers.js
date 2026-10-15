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
      idea: String.raw`Before Keeling, published CO₂ measurements scattered over a wide range (from below 300 to above 400 ppm), mostly because samples were taken near cities, forests or the ground, and whether CO₂ was accumulating from fossil fuel was an open question. Revelle and Suess (1957, climate-7.15) had argued that the ocean takes up CO₂ more slowly than assumed and that humanity was conducting a large geophysical experiment, so a precise baseline was needed for the International Geophysical Year. Keeling's insight was to sample air far from local sources (Mauna Loa, at 3,400 m in the mid-Pacific; Antarctica) with an instrument stable enough to see changes of 0.1 ppm. Within two years the paper had both signatures that the record still shows: the "breathing" of the northern biosphere and the rise from burning carbon (whose isotopic fingerprint, climate-7.11, later confirmed its fossil origin). It became the founding observation of the carbon cycle (climate-7.1) as a measurable, changing system.`,
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
  ],
};
