// Climate Science — Chapter 8, landmark paper: Hays, Imbrie & Shackleton (1976).
//
// Data (verified):
// - RC11-120 (43°31′S, 79°52′E, southern Indian Ocean), one of the paper's two cores:
//   planktonic δ¹⁸O (‰ PDB) at 5-cm spacing, 183 levels, with the SPECMAP chronology (orbitally tuned, Imbrie et al.
//   1992), from the NOAA Paleoclimatology file rc11-120-fwc.txt (SPECMAP contributors; references Hays et al. 1976),
//   via paleo.ltrr.arizona.edu/paleocean/sediment_files/complete/; and Hays's summer sea-surface temperature estimates
//   from radiolarian assemblages (Ts, °C), 184 levels by depth, PANGAEA doi:10.1594/PANGAEA.52223 (CC-BY 3.0).
//   Arrays below were generated from those files by script and checked by row count and end values.
// - The paper's second core (E49-18) and its original 1976 time scale are not used: the NOAA E49-18 file is a later
//   (1992) dataset without an age model. Instead the viz offers an untuned chronology built the way the paper's was
//   in spirit: constant accumulation from the core top to Termination II, dated 127,000 years at 440 cm.
// - The paper's result (abstract): spectral peaks at about 23,000, 42,000 and ~100,000 years, matching precession,
//   obliquity and eccentricity; the precession peak splits into ~23 and ~19 kyr as predicted by Berger.
// - Orbital periods today (Berger & Loutre 1991): obliquity 41 kyr; precession 23.7, 22.4, 19.0 kyr; eccentricity
//   ~95, ~125 and 405 kyr.

// depth (cm), SPECMAP age (yr), δ18O (‰)
const D18O = '5,1329,1.87 10,2657,1.96 15,3986,1.97 20,5314,1.96 25,6643,2.16 30,7971,2.38 35,9370,2.32 40,10150,2.6 45,11000,2.74 50,11850,2.98 55,12700,2.95 60,14300,3.37 65,15900,3.28 70,17500,3.53 75,18710,3.34 80,19930,3.36 85,21140,3.43 90,22360,3.34 95,23570,3.31 100,24790,3.29 105,26000,3.32 110,27690,3.22 115,29380,3.07 120,31060,3.04 125,32750,3.07 130,34440,3.19 135,36130,2.96 140,37810,3.11 145,39500,2.98 150,41190,3.05 155,42880,3.01 160,44560,2.94 165,46250,2.98 170,47940,2.95 175,49630,2.89 180,51310,2.9 185,53000,2.66 190,54000,2.86 195,55000,2.87 200,56000,2.82 205,57000,2.82 210,58000,3.03 215,59000,2.76 220,62000,3.08 225,65000,3.15 230,66200,2.84 235,67400,2.98 240,68600,2.85 245,69800,2.82 250,71000,2.71 255,72130,2.59 260,73250,2.54 265,74380,2.55 270,75500,2.59 275,76630,2.44 280,77750,2.43 285,78880,2.42 290,80000,2.37 295,81610,2.4 300,83220,2.71 305,84830,2.61 310,86440,2.68 315,88060,2.58 320,89670,2.68 325,91280,2.54 330,92890,2.6 335,94500,2.4 340,95890,2.54 345,97280,2.48 350,98670,2.42 355,100100,2.4 360,101400,2.48 365,102800,2.45 370,104200,2.48 375,105600,2.46 380,107000,2.62 385,108900,2.5 390,110800,2.61 395,112600,2.42 400,114500,2.33 405,116400,2.14 410,118200,2.23 415,120100,1.83 420,122000,1.89 425,123500,1.79 430,125000,1.91 435,126500,2.35 440,128000,2.72 445,129200,2.82 450,130300,3.18 455,131500,3.2 460,132700,3.44 465,133800,3.31 470,135000,3.54 475,136800,3.18 480,138700,3.37 485,140500,3.42 490,142400,3.1 495,144200,3.14 500,146100,3.38 505,147900,3.25 510,149800,3.19 515,151600,3.27 520,153500,3.21 525,155300,3.22 530,157200,3.24 535,159000,3.27 540,160800,3.21 545,162700,3.15 550,164500,3.32 555,166400,3.15 560,168200,3.21 565,170100,3.13 570,171900,3.06 575,173800,2.9 580,175600,2.91 585,177500,2.87 590,179300,2.81 595,181200,2.81 600,183000,3.02 605,184200,2.85 615,186700,2.61 620,187900,2.59 625,189100,2.55 630,190300,2.43 635,191600,2.32 640,192800,2.18 645,194000,2.17 650,197700,2.14 655,201300,2.41 660,205000,2.52 665,208700,2.49 670,212300,2.45 675,216000,2.13 680,217300,2.31 685,218500,2.24 690,219800,2.2 695,221100,2.47 700,222300,2.7 705,223600,2.55 710,224800,2.62 715,226100,2.62 720,227400,2.86 725,228700,2.85 730,230000,2.72 735,231300,2.74 740,232700,2.78 745,234000,2.46 750,235300,2.46 755,236700,2.45 760,238000,2.57 765,239200,2.38 770,240400,2.39 775,241700,2.62 780,242900,2.71 785,244100,2.67 790,245200,2.86 795,246300,3.03 800,247400,2.92 805,248500,2.99 810,249900,2.94 815,251900,3.05 820,253800,2.97 825,255700,2.88 830,257600,2.84 835,259500,2.91 840,261400,3.04 845,263300,2.94 850,265200,2.85 855,267100,2.95 865,270300,2.43 895,278300,2.91 900,279700,2.79 905,281000,2.8 910,282300,2.58 915,283700,2.56 920,285000,2.57 925,286300,2.43 930,287700,2.43 935,289000,2.5 940,290300,2.67 945,291700,2.67 950,293000,2.69';
// depth (cm), summer SST (°C)
const SST = '0,11.21 2,11.21 10,11.5 20,10.54 30,13.26 39,12.49 50,9.18 60,7.06 70,7.03 76,9.2 80,7.2 83,6.95 90,7.43 100,7.06 105,7.57 110,7.58 115,7.51 120,7.28 125,7.79 130,7.72 135,8.31 140,8 145,8.63 150,8.53 155,8.61 160,8.96 165,9.4 170,8.2 175,7.88 180,7.05 185,7.41 190,6.98 195,8.12 200,8.23 205,8.28 210,9.09 215,8.31 220,6.95 225,6.94 230,6.97 235,8.13 240,7.27 245,7.67 250,8.14 255,8.71 260,7.82 265,8.01 270,8.35 275,8.2 280,8.34 285,8.24 290,9.7 295,8.13 300,7.87 305,7.18 310,7.23 315,8.33 320,7.28 325,7.6 330,7.91 335,7.46 340,7.42 345,8.15 350,8.65 355,8.37 360,9.29 365,10 370,8.89 375,8.37 380,7.32 385,7.17 390,8.53 395,8.94 400,8.93 405,8.82 410,10.29 415,9.19 420,9.27 425,10.19 430,13.56 435,12.4 440,13.55 445,13.64 450,9.25 455,8.97 460,7.4 465,8.31 470,7.59 475,9.17 480,7.19 485,8.04 490,7.55 495,7.86 500,7.29 505,8.67 510,8.24 515,8.43 520,7.72 525,7.92 530,8.23 535,7.41 540,7.51 545,8.84 550,7.66 555,8.82 560,7.75 565,7.66 570,8.21 575,7.79 580,7.74 585,9.36 590,7.8 595,9.96 600,7.78 605,8.36 610,8.02 615,9.22 620,8.38 625,8.7 630,9.64 635,9.49 640,8.95 645,9.75 650,10.28 655,8.97 660,7.62 665,9.3 670,7.81 675,9.62 680,9.83 685,10.81 690,11.51 695,11.56 700,8.87 705,8.19 710,8.14 715,8.87 720,7.86 725,7.64 730,8.64 735,7.93 740,6.82 745,9.74 750,10.86 755,10.62 760,10.68 765,9.82 770,12.08 775,12.43 780,11.9 785,12.14 790,8.61 795,8.04 800,7.2 805,8 810,6.96 815,7.68 820,7.36 825,7.35 830,7.2 835,8.24 840,7.38 845,7.73 850,7.79 855,7.49 860,6.79 865,8.1 870,7.38 875,7.54 880,8.54 885,7.95 890,7.9 895,8.56 900,6.81 905,7.77 910,8.22 915,8.35 920,7.69 925,8.44 930,8.74 935,9.21 940,8.65 945,8.37 950,7.95';
const parse = (s, k) => s.split(' ').map((r) => r.split(',').map(Number)).map((a) => a.slice(0, k));
const ORB = [[100, 'eccentricity ~100', 'orange'], [41, 'obliquity 41', 'purple'], [23, 'precession 23', 'teal'], [19, '19', 'teal']];

/** Uniform resampling, linear detrend, Hann taper; returns the series and its periodogram on a frequency grid (cycles/kyr). */
function spectrum(t, y, dt, freqs) {
  const t0 = Math.max(t[0], 0), t1 = t[t.length - 1], n = Math.floor((t1 - t0) / dt) + 1, g = [], x = [];
  for (let i = 0, j = 0; i < n; i++) { const tt = t0 + i * dt; while (j < t.length - 2 && t[j + 1] < tt) j++; const f = (tt - t[j]) / (t[j + 1] - t[j]); g.push(tt); x.push(y[j] + (y[j + 1] - y[j]) * Math.max(0, Math.min(1, f))); }
  const mt = g.reduce((a, b) => a + b) / n, mx = x.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0; g.forEach((tt, i) => { sxy += (tt - mt) * (x[i] - mx); sxx += (tt - mt) ** 2; });
  const b = sxy / sxx, r = x.map((v, i) => v - mx - b * (g[i] - mt));
  const w = r.map((v, i) => v * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))));
  const P = freqs.map((f) => { let re = 0, im = 0; w.forEach((v, i) => { const a = 2 * Math.PI * f * g[i]; re += v * Math.cos(a); im -= v * Math.sin(a); }); return (re * re + im * im) * dt / n; });
  return { g, r, P };
}
function ar1(r) { let a = 0, b = 0; for (let i = 1; i < r.length; i++) { a += r[i] * r[i - 1]; b += r[i - 1] ** 2; } return a / b; }

export default {
  collection: 'climate',
  chapter: 8,
  items: [
    {
      num: '8.13',
      kind: 'Paper',
      name: 'Variations in the Earth’s Orbit: Pacemaker of the Ice Ages',
      paper: { authors: 'J. D. Hays, John Imbrie and N. J. Shackleton', year: 1976, title: 'Variations in the Earth’s Orbit: Pacemaker of the Ice Ages', venue: 'Science 194 (4270): 1121–1132', doi: '10.1126/science.194.4270.1121' },
      introduces: ['climate-8.5'],
      statement: String.raw`In two deep-sea cores from the southern Indian Ocean, covering about the last 450,000 years, the oxygen-isotope ratio of foraminifera (a measure of global ice volume), the sea-surface temperature estimated from radiolaria and the abundance of one radiolarian species all vary with most of their variance concentrated in spectral peaks near **100,000, 42,000 and 23,000 years**, with the precession peak split into about 23,000 and 19,000 years. These are the periods of the eccentricity of Earth's orbit, the obliquity of its axis and the precession of the equinoxes, and the obliquity and precession components are in phase with the corresponding orbital forcing. Changes in the Earth's orbital geometry are therefore the fundamental cause of the succession of Quaternary ice ages.

In modern terms this confirmed Milankovitch's astronomical theory (climate-8.5) as the **pacemaker** of glacial cycles. Its scope: the orbital forcing sets the timing; the size of the 100-kyr cycle, whose direct insolation forcing is weak, needs amplification inside the climate system (ice sheets, CO₂), which the paper could not explain and which is still debated.`,
      idea: String.raw`Croll and then Milankovitch (1920s–40s) had computed how the orbital elements (climate-8.1) change the seasonal and latitudinal distribution of sunlight (climate-8.4), but there was no long, well-dated climate record to test the theory, and by the 1960s it was widely doubted. Emiliani's oxygen-isotope stratigraphy and the CLIMAP project changed that: Hays (radiolaria), Shackleton (isotopes) and Imbrie (statistics) chose two cores with high accumulation rates, dated them with radiocarbon, the Brunhes–Matuyama reversal and a constant-accumulation assumption that did not use orbital theory, and computed power spectra (climate-8.12). The peaks fell where Berger's orbital calculations put them, including the predicted splitting of precession. The paper made orbital forcing the organising idea of paleoclimatology; later records (SPECMAP, Antarctic ice cores, LR04) confirmed it, and orbitally tuned time scales built on it now date the whole Cenozoic.`,
      caption: String.raw`**Top**: core RC11-120 (one of the paper's two cores), δ¹⁸O of planktonic foraminifera (ice volume, glacial up) or radiolarian summer sea temperature, on one of two **time scales**: SPECMAP (orbitally tuned, so it partly assumes the answer) or an **untuned** constant-accumulation scale through the core top and Termination II (127,000 years at 440 cm), closer to how the paper avoided circularity. **Bottom**: the power spectrum, with the orbital periods marked. Switch to **red noise**: a random AR(1) series with the same variance and memory (**Resample** for another) has no peaks at those periods except by chance; the dashed line is its approximate 95% level.`,
      deps: ['climate-8.1', 'climate-8.4', 'climate-8.12', 'rca-9.1'],
      refs: [],
      tags: ['paleoclimate', 'Milankovitch', 'spectral analysis'],
      credit: 'J. D. Hays, J. Imbrie & N. J. Shackleton, 1976',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Milankovitch_cycles' },
      viz(v) {
        const rec = v.select('record', [{ value: 'd18o', label: 'δ¹⁸O (ice volume)' }, { value: 'sst', label: 'summer SST (radiolaria)' }, { value: 'noise', label: 'red noise' }], 'd18o');
        const chron = v.select('time scale', [{ value: 'tuned', label: 'SPECMAP (tuned)' }, { value: 'flat', label: 'untuned: constant accumulation' }], 'flat');
        let seed = 1;
        const rb = v.button('Resample noise', () => { seed++; });
        const O = parse(D18O, 3), S = parse(SST, 2);
        const tuned = (dep) => { // depth → age (kyr) from the SPECMAP ages of the δ18O levels
          if (dep <= O[0][0]) return (dep / O[0][0]) * O[0][1] / 1000;
          for (let i = 0; i < O.length - 1; i++) if (dep <= O[i + 1][0]) return (O[i][1] + ((dep - O[i][0]) / (O[i + 1][0] - O[i][0])) * (O[i + 1][1] - O[i][1])) / 1000;
          return O[O.length - 1][1] / 1000;
        };
        const flat = (dep) => (dep * 127) / 440;
        const freqs = Array.from({ length: 260 }, (_, i) => 0.003 + i * 0.00025);
        const T = v.stage({ x: [0, 300], y: [1.5, 3.8], axes: 'box', gutter: true, height: 210, full: true, xlabel: 'age (thousand years ago)', ylabel: 'δ¹⁸O (‰)', title: 'core RC11-120' });
        const P = v.stage({ x: [0.003, 0.068], y: [3e-3, 1.6], ylog: true, axes: 'box', gutter: true, height: 300, full: true, xlabel: 'period (thousand years)', ylabel: 'relative power', xticks: [[1 / 150, '150'], [0.01, '100'], [1 / 60, '60'], [1 / 41, '41'], [1 / 30, '30'], [1 / 23, '23'], [1 / 19, '19'], [1 / 16, '16']], title: 'power spectrum' });
        let st = null;
        v.render(() => {
          const age = chron.value === 'tuned' ? tuned : flat;
          let t, y;
          if (rec.value === 'sst') { t = S.map((r) => age(r[0])); y = S.map((r) => r[1]); }
          else { t = O.map((r) => age(r[0])); y = O.map((r) => r[2]); }
          let sp = spectrum(t, y, 2, freqs);
          let rho = ar1(sp.r);
          if (rec.value === 'noise') { // AR(1) surrogate with the same lag-1 autocorrelation and variance as the δ18O series
            const r = v.rng(seed * 37 + 11), sd = Math.sqrt(sp.r.reduce((a, b) => a + b * b, 0) / sp.r.length), e = Math.sqrt(1 - rho * rho);
            const z = [sd * r.normal()]; for (let i = 1; i < sp.g.length; i++) z.push(rho * z[i - 1] + sd * e * r.normal());
            const mean = z.reduce((a, b) => a + b) / z.length; y = z.map((q) => q - mean + 2.7); t = sp.g;
            sp = spectrum(t, y, 2, freqs); rho = ar1(sp.r);
          }
          rb.hidden = rec.value !== 'noise';
          // time series
          const lo = Math.min(...y), hi = Math.max(...y), pad = 0.08 * (hi - lo);
          T.setView([0, Math.max(...t) + 4], [lo - pad, hi + pad]);
          T.setLabels(undefined, rec.value === 'sst' ? 'summer SST (°C)' : 'δ¹⁸O (‰)  glacial ↑');
          T.path(t.map((tt, i) => [tt, y[i]]), { color: rec.value === 'sst' ? 'red' : rec.value === 'noise' ? 'muted' : 'accent', width: 1.8 });
          if (chron.value === 'flat' && rec.value !== 'noise') { T.vline(127, { color: 'faint', width: 1, dash: [3, 3] }); T.text('Termination II, 127 kyr (anchor)', 127, hi + pad, { dx: 4, dy: 12, align: 'left', size: 10.5, color: 'muted' }); }
          // spectrum: normalised, smoothed over 3 frequencies
          const Ps = sp.P.map((p, i) => { let a = 0, c = 0; for (let j = Math.max(0, i - 8); j <= Math.min(sp.P.length - 1, i + 8); j++) { a += sp.P[j]; c++; } return a / c; }); // Daniell smoothing over ±0.002 cycles/kyr
          const mx = Math.max(...Ps);
          const N = sp.r.length, varr = sp.r.reduce((a, b) => a + b * b, 0) / N;
          const red = freqs.map((f) => (1 - rho * rho) / (1 + rho * rho - 2 * rho * Math.cos(2 * Math.PI * f * 2)));
          const scale = Ps.reduce((a, b) => a + b, 0) / red.reduce((a, b) => a + b, 0);
          for (const [per, lab, col] of ORB) {
            const f = 1 / per, w = per === 100 ? [1 / 125, 1 / 90] : [1 / (per + 0.7), 1 / (per - 0.7)];
            P.vband(w[0], w[1], { color: col, alpha: 0.12 });
            P.text(lab, f, 3e-3, { dy: -8, size: 10.5, color: col, weight: 700, align: per === 19 ? 'left' : per === 23 ? 'right' : 'center', dx: per === 19 ? 4 : per === 23 ? -4 : 0, baseline: 'bottom', plate: true });
          }
          P.path(freqs.map((f, i) => [f, (red[i] * scale * 2.8) / mx]), { color: 'muted', width: 1.4, dash: [6, 4] });
          P.path(freqs.map((f, i) => [f, Math.max(Ps[i] / mx, 3.1e-3)]), { color: rec.value === 'sst' ? 'red' : rec.value === 'noise' ? 'ink' : 'accent', width: 2.2 });
          // find the strongest peaks
          const pk = [];
          for (let i = 1; i < Ps.length - 1; i++) if (Ps[i] >= Ps[i - 1] && Ps[i] >= Ps[i + 1] && Ps[i] > 0.02 * mx) pk.push([1 / freqs[i], Ps[i] / mx, Ps[i] / (red[i] * scale)]);
          pk.sort((a, b) => b[1] - a[1]);
          for (const [per, h] of pk.slice(0, 5)) P.dot(1 / per, h, { r: 4.5, color: 'gold' });
          st = { pk: pk.slice(0, 5), rho, varr };
        });
        v.legend([['accent', 'δ¹⁸O spectrum'], ['red', 'SST spectrum'], ['muted', 'red-noise 95% level', { dash: true }], ['gold', 'strongest peaks', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const pks = st.pk.map(([per, h, ratio]) => `**${Math.round(per)}** kyr${ratio > 2.8 ? ' ✓' : ''}`).join(', ');
          const what = rec.value === 'noise' ? 'red noise (AR(1), ρ = ' + v.fix(st.rho, 2) + ' per 2 kyr)' : rec.value === 'sst' ? 'summer SST' : 'δ¹⁸O';
          return `${what}, ${chron.value === 'tuned' ? 'SPECMAP (tuned)' : 'untuned'} time scale: strongest peaks at ${pks} (✓ = above the approximate red-noise 95% level). Hays, Imbrie & Shackleton: peaks near 100, 42 and 23 kyr (and 19 kyr) in both cores; orbital periods today: eccentricity ~95–125 kyr, obliquity 41 kyr, precession 23 and 19 kyr. This single core spans under 300 kyr, so only the precession peak clears the noise level on its own, the 100-kyr peak rests on fewer than three cycles, and on the untuned scale the obliquity peak lands near 35 kyr; the paper's two-core record of about 450 kyr resolved all three.`;
        });
      },
    },
  ],
};
