// Music Theory & Acoustics — Chapter 1 (paper): Fletcher & Munson 1933, equal-loudness contours

// ── Fletcher & Munson 1933, Fig. 4 ("Loudness level contours", intensity level re 10⁻¹⁶ W/cm², free field, listener
//    facing the source), digitised from the archive.org scan of the Bell System Technical Journal reprint
//    (BSTJ 12 (4): 377–430, page 394) by tracing each contour; reading accuracy about ±1 dB. The paper: eleven observers,
//    each point the median of 297 observations, tones heard through telephone receivers calibrated against a free wave. ──
const FM_F = [25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500];
const FM = {
  0: [68.3, 63.1, 57.7, 53.0, 47.9, 42.8, 37.9, 33.2, 28.0, 23.4, 18.9, 14.4, 9.9, 6.0, 2.3, 0.2, 0.0, -0.1, -1.7, -4.0, -6.3, -7.8, -7.7, -5.0, 2.5, 6.9, 8.1, 10.0],
  10: [72.9, 68.0, 63.1, 58.7, 53.8, 49.0, 44.5, 40.1, 35.4, 31.2, 27.1, 23.0, 19.1, 15.9, 13.3, 11.3, 10.1, 9.3, 7.9, 5.9, 4.0, 3.0, 3.2, 6.4, 13.8, 17.9, 19.1, 20.5],
  20: [77.0, 72.6, 68.2, 64.3, 60.1, 55.9, 51.9, 48.1, 43.8, 39.9, 36.2, 32.3, 28.3, 25.1, 22.6, 20.9, 20.4, 20.2, 18.8, 17.0, 15.6, 14.7, 14.9, 18.0, 25.0, 29.1, 30.0, 30.7],
  30: [80.2, 76.3, 72.3, 68.8, 64.9, 61.1, 57.4, 53.8, 49.9, 46.5, 43.2, 40.0, 36.4, 33.9, 32.0, 30.6, 30.2, 30.0, 29.7, 28.1, 26.5, 25.5, 26.1, 29.0, 36.5, 40.4, 41.1, 41.6],
  40: [82.6, 79.1, 75.6, 72.4, 68.8, 65.4, 62.3, 59.3, 55.9, 53.0, 50.2, 47.5, 44.8, 42.4, 40.6, 40.3, 40.4, 40.7, 40.5, 39.3, 37.7, 36.9, 37.3, 40.0, 47.5, 51.3, 52.1, 52.5],
  50: [84.5, 81.5, 78.5, 75.9, 72.9, 70.1, 67.4, 64.9, 62.1, 59.7, 57.4, 55.3, 53.3, 51.4, 50.1, 49.9, 50.2, 50.6, 50.7, 50.3, 48.8, 47.3, 47.5, 50.4, 58.5, 62.4, 62.8, 63.1],
  60: [86.4, 83.6, 81.0, 78.7, 76.3, 74.0, 71.9, 70.0, 67.9, 66.1, 64.6, 63.3, 61.9, 60.9, 60.3, 60.1, 60.3, 60.5, 60.7, 60.4, 59.2, 58.0, 57.9, 60.5, 68.7, 72.2, 72.6, 73.0],
  70: [88.6, 86.3, 84.2, 82.5, 80.7, 79.1, 77.8, 76.5, 75.1, 73.9, 72.8, 71.7, 70.7, 70.2, 70.0, 70.0, 70.2, 70.3, 70.3, 70.1, 68.8, 67.1, 66.8, 69.3, 77.6, 81.5, 82.4, 82.8],
  80: [91.0, 89.1, 87.3, 86.1, 84.9, 84.0, 83.2, 82.6, 82.0, 81.6, 81.2, 80.9, 80.7, 80.5, 80.5, 80.4, 80.5, 80.4, 80.1, 79.2, 77.8, 76.0, 75.4, 77.8, 86.4, 90.3, 91.0, 91.7],
  90: [94.4, 93.7, 92.9, 92.3, 91.7, 91.2, 90.6, 90.4, 90.1, 89.8, 89.7, 89.7, 89.8, 90.0, 90.3, 90.4, 90.4, 90.2, 89.6, 88.4, 87.0, 84.8, 84.2, 86.7, 94.7, 98.5, 99.2, 99.6],
  100: [100.7, 100.7, 100.5, 100.4, 100.2, 100.2, 100.1, 100.2, 100.2, 100.2, 100.4, 100.5, 100.9, 101.2, 101.1, 100.8, 100.4, 99.8, 98.5, 97.2, 95.2, 93.1, 92.4, 95.0, 102.6, 106.4, 106.7, 106.7],
  110: [112.7, 112.3, 111.9, 111.7, 111.5, 111.5, 111.5, 111.5, 111.8, 112.1, 112.3, 112.3, 112.3, 112.2, 111.9, 111.4, 110.6, 109.8, 108.2, 106.6, 104.7, 102.6, 101.9, 103.4, 109.7, 113.8, 114.5, 114.2],
  120: [null, 127.6, 126.7, 126.0, 125.2, 124.6, 124.1, 123.7, 123.4, 123.3, 123.3, 123.0, 122.7, 122.4, 121.8, 121.1, 120.2, 119.3, 117.7, 115.9, 114.0, 111.6, 110.6, 112.1, 116.9, 120.2, 120.9, 121.3],
};
// ISO 226:2003 parameters (Table 1 of the standard): frequency, exponent α_f, magnitude L_U, threshold T_f
const ISO = {
  f: [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500],
  af: [0.532, 0.506, 0.48, 0.455, 0.432, 0.409, 0.387, 0.367, 0.349, 0.33, 0.315, 0.301, 0.288, 0.276, 0.267, 0.259, 0.253, 0.25, 0.246, 0.244, 0.243, 0.243, 0.243, 0.242, 0.242, 0.245, 0.254, 0.271, 0.301],
  Lu: [-31.6, -27.2, -23, -19.1, -15.9, -13, -10.3, -8.1, -6.2, -4.5, -3.1, -2, -1.1, -0.4, 0, 0.3, 0.5, 0, -2.7, -4.1, -1, 1.7, 2.5, 1.2, -2.1, -7.1, -11.2, -10.7, -3.1],
  Tf: [78.5, 68.7, 59.5, 51.1, 44, 37.5, 31.5, 26.5, 22.1, 17.9, 14.4, 11.4, 8.6, 6.2, 4.4, 3, 2.2, 2.4, 3.5, 1.7, -1.3, -4.2, -6, -5.4, -1.5, 6, 12.6, 13.9, 12.3],
};
/** Piecewise-linear interpolation in log frequency (null outside the table or across a missing value). */
function logInterp(fs, ys, f, clamp = true) {
  if (f <= fs[0]) return clamp ? ys[0] : null;
  if (f >= fs[fs.length - 1]) return clamp ? ys[ys.length - 1] : null;
  let i = 0; while (fs[i + 1] < f) i++;
  if (ys[i] == null || ys[i + 1] == null) return null;
  const w = Math.log(f / fs[i]) / Math.log(fs[i + 1] / fs[i]);
  return ys[i] + w * (ys[i + 1] - ys[i]);
}
/** SPL (dB) of a pure tone of loudness level `phon` by the ISO 226:2003 formula. */
function isoSpl(f, phon) {
  const af = logInterp(ISO.f, ISO.af, f), Lu = logInterp(ISO.f, ISO.Lu, f), Tf = logInterp(ISO.f, ISO.Tf, f);
  const Af = 4.47e-3 * (Math.pow(10, 0.025 * phon) - 1.15) + Math.pow(0.4 * Math.pow(10, (Tf + Lu) / 10 - 9), af);
  return (10 / af) * Math.log10(Af) - Lu + 94;
}
const fmSpl = (f, phon) => logInterp(FM_F, FM[phon], f, false);
/** A playhead that redraws while a sound plays (cleared on destroy). */
function playhead(v) {
  let t0 = 0, dur = 0, id = 0;
  const stop = () => { if (id) clearInterval(id); id = 0; dur = 0; v.invalidate(); };
  v.onCleanup(() => { if (id) clearInterval(id); id = 0; });
  return {
    start(d) { if (id) clearInterval(id); t0 = performance.now(); dur = d; id = setInterval(() => { if (performance.now() - t0 > dur * 1000 + 80) stop(); else v.invalidate(); }, 40); v.invalidate(); },
    get t() { return dur ? (performance.now() - t0) / 1000 : null; },
  };
}
const TEST_F = [63, 125, 250, 500, 2000, 4000, 8000];
const SWEEP = [63, 125, 250, 500, 1000, 2000, 4000, 8000];

export default {
  collection: 'music',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.14
    {
      num: '1.14',
      kind: 'Paper',
      name: 'Loudness, Its Definition, Measurement and Calculation',
      paper: { authors: 'Harvey Fletcher and W. A. Munson', year: 1933, title: 'Loudness, Its Definition, Measurement and Calculation', venue: 'Journal of the Acoustical Society of America 5 (2): 82–108', doi: '10.1121/1.1915637' },
      introduces: ['music-1.9'],
      credit: 'Harvey Fletcher and W. A. Munson, Bell Telephone Laboratories, 1933',
      statement: String.raw`Fletcher and Munson defined the **loudness level** of any sound as the intensity level (dB re $10^{-16}$ W/cm²) of a 1000-cycle tone, heard as a plane wave facing the listener, that is judged equally loud — the unit later named the *phon* — and measured it for pure tones from about 25 Hz to 16 kHz and from threshold to 120 dB. Joining equal loudness levels gives the **equal-loudness contours** (their Fig. 4, music-1.9): the ear is most sensitive near 3–4 kHz, the threshold rises by some 60 dB toward 30 Hz, the contours flatten at high levels (at 100 phon they are within a few dB of flat from 30 Hz to 2 kHz), and around 120 dB tones become felt rather than heard. They also introduced **loudness** itself as a number $N = G(f,\beta)$, distinct from loudness level, chosen so that loudness adds for components that excite separate parts of the ear — two equally loud tones far apart in frequency, or one tone in each ear, sound twice as loud as one — and used it to calculate the loudness level of complex tones from their components. Scope: median judgements of a small group (eleven observers) through earphones calibrated against a free field; individual ears differ by several dB, and the contours were revised by Robinson and Dadson (1956) and, internationally, in ISO 226 (2003).`,
      idea: String.raw`Telephone engineering needed a measure of how loud speech and noise *sound*, not just how much power they carry, and the decibel scale of intensity alone did not capture it: a 50-cycle hum and a 1000-cycle tone of equal intensity differ enormously in loudness. Following B. A. Kingsbury's 1927 balancing experiments, Fletcher and Munson had listeners alternate between a reference tone at 1000 cycles and a test tone and adjust one until both seemed equally loud — a loudness balance, the same matching task you can try below — then converted the earphone voltages to free-field intensities with a separate calibration on a sound stage. They smoothed the curves, attributing the bumps above 1000 cycles to diffraction around the listener's head. The contours shaped audio engineering for decades: the 40-phon curve became the A-weighting of sound-level meters, and "loudness" controls on amplifiers boost the bass at low volume to compensate for the bending of the contours. The modern contours of ISO 226:2003 agree with theirs within a few decibels above about 100 Hz; below that, at low and moderate levels, today's contours lie higher, by roughly 5 dB at 50 Hz and 10 dB at 25 Hz on the 40-phon curve (lower panel).`,
      caption: String.raw`Solid curves: Fletcher and Munson's contours from 0 to 120 phon, digitised from their Fig. 4; dashed: the ISO 226:2003 standard (drawn where it is defined, 20–90 phon). **Pick a contour** to highlight it; the lower panel shows the difference between 1933 and today along it. **Match by ear**: choose a test frequency, set the test-tone level with the slider and play the 1 kHz reference followed by the test tone; when they sound equally loud, record the point — your own contour appears in gold (use headphones; your volume knob sets the absolute level, so only the shape is meaningful). The sweeps play octaves at constant level and along the contour.`,
      deps: ['music-1.8'],
      refs: [],
      tags: ['loudness', 'hearing', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fletcher%E2%80%93Munson_curves', bstj: 'https://archive.org/details/bstj12-4-377' },
      viz(v) {
        const M = v.M, STEP = 0.45;
        const ph = v.select('contour', [20, 40, 60, 80, 100].map((p) => ({ value: p, label: `${p} phon` })), 40);
        const showIso = v.toggle('show ISO 226:2003', true);
        const tf = v.select('test frequency', TEST_F.map((f) => ({ value: f, label: f >= 1000 ? `${f / 1000} kHz` : `${f} Hz` })), 125);
        const lvl = v.slider('test-tone level', 0, 110, 60, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} dB` });
        const mine = {}; // user's matches: phon → {f: level}
        const head = playhead(v);
        let sweep = null;
        const gainOf = (L, Lmax) => 0.3 * Math.pow(10, (L - Lmax) / 20);
        v.soundButton('Reference (1 kHz), then test', (snd) => {
          const P = +ph.value, L = lvl.value, Lm = Math.max(P, L);
          snd.tone(1000, { duration: 0.8, gain: gainOf(P, Lm) });
          snd.tone(+tf.value, { duration: 0.8, gain: gainOf(L, Lm), delay: 1.0 });
          sweep = null; head.start(1.9);
        });
        v.button('Record: equally loud', () => { (mine[ph.value] ||= {})[tf.value] = lvl.value; });
        v.button('Clear my points', () => { for (const k of Object.keys(mine)) delete mine[k]; });
        v.soundButton('Sweep at constant dB', (snd) => {
          const P = +ph.value; sweep = SWEEP.map((f) => [f, P]);
          SWEEP.forEach((f, i) => snd.tone(f, { duration: STEP * 0.85, gain: 0.25, delay: i * STEP, release: 0.08 }));
          head.start(SWEEP.length * STEP);
        });
        v.soundButton('Sweep along the 1933 contour', (snd) => {
          const P = +ph.value; sweep = SWEEP.map((f) => [f, fmSpl(f, P)]);
          const Lmax = Math.max(...sweep.map((p) => p[1]));
          sweep.forEach(([f, L], i) => snd.tone(f, { duration: STEP * 0.85, gain: gainOf(L, Lmax), delay: i * STEP, release: 0.08 }));
          head.start(SWEEP.length * STEP);
        });
        const S = v.stage({ x: [20, 16000], y: [-12, 132], xlog: true, axes: 'box', grid: true, height: 400, full: true, xlabel: 'frequency (Hz)', title: 'equal-loudness contours, intensity level in dB (re 10⁻¹⁶ W/cm² ≈ dB SPL): Fletcher & Munson 1933 (solid), ISO 226:2003 (dashed)' });
        const D = v.stage({ x: [20, 16000], y: [-16, 16], xlog: true, axes: 'box', grid: true, height: 190, full: true, xlabel: 'frequency (Hz)', title: '1933 minus ISO 226:2003 along the chosen contour (dB)' });
        let st = {};
        v.render(() => {
          const P = +ph.value;
          // ISO contours (dashed), where the standard is defined
          if (showIso.value) for (let L = 20; L <= 90; L += 10) S.fn((f) => isoSpl(f, L), { domain: [20, 12500], color: L === P ? 'orange' : 'orange', width: L === P ? 2.4 : 1, alpha: L === P ? 1 : 0.5, dash: [6, 4], n: 220 });
          // Fletcher–Munson contours
          for (let L = 0; L <= 120; L += 10) {
            const on = L === P, pts = FM_F.map((f, i) => (FM[L][i] == null ? null : [f, FM[L][i]]));
            S.path(pts, { color: on ? 'accent' : 'ink', width: on ? 3 : 1.2, alpha: on ? 1 : 0.55 });
            const last = FM[L][FM_F.length - 1];
            S.text(`${L}`, 12500, last, { dx: 6, size: 10.5, color: on ? 'accent' : 'muted' });
          }
          S.text('feeling', 300, 126, { size: 11, color: 'red' });
          S.text('0 phon: threshold of hearing', 45, 28, { size: 11, color: 'muted', align: 'left' });
          // the test tone and the user's points
          S.dot(1000, P, { r: 6, color: 'green', label: '1 kHz reference', labelPos: 'n', math: false });
          S.dot(+tf.value, lvl.value, { r: 6, color: 'gold', hollow: true });
          const my = mine[P] || {}, myPts = Object.entries(my).map(([f, L]) => [+f, L]).sort((a, b) => a[0] - b[0]);
          if (myPts.length) { const withRef = [...myPts, [1000, P]].sort((a, b) => a[0] - b[0]); S.path(withRef, { color: 'gold', width: 2.2 }); S.dots(myPts, { r: 5, color: 'gold' }); }
          if (sweep && head.t != null) { const k = Math.floor(head.t / STEP); sweep.forEach(([f, L], i) => S.dot(f, L, { r: i === k ? 7 : 4, color: i === k ? 'red' : 'orange', hollow: i !== k })); }
          // difference panel
          let lo = 0, hi = 0;
          for (let k = 0; k <= 120; k++) { const f = 25 * Math.pow(500, k / 120), a = fmSpl(f, P); if (a != null) { const d = a - isoSpl(f, P); lo = Math.min(lo, d); hi = Math.max(hi, d); } }
          D.setView([20, 16000], [Math.min(-16, lo - 3), Math.max(16, hi + 3)]);
          D.hline(0, { color: 'muted', width: 1.2 });
          const valid = P >= 20 && P <= 90;
          D.fn((f) => { const a = fmSpl(f, P); return a == null ? NaN : a - isoSpl(f, P); }, { domain: [25, 12500], color: valid ? 'accent' : 'muted', width: 2.4, n: 300, dash: valid ? null : [4, 4] });
          D.hband(-2, 2, { color: 'green', alpha: 0.1 });
          D.text(valid ? '±2 dB: about the reading accuracy of the digitised curves' : 'ISO 226 is defined only from 20 to 90 phon (dashed: extrapolated)', 25, Math.max(16, hi + 3) - 2.5, { size: 10.5, color: valid ? 'green' : 'muted' });
          st = { P };
        });
        v.legend([['accent', 'Fletcher & Munson 1933 (chosen contour)'], ['ink', 'other 1933 contours'], ['orange', 'ISO 226:2003', { dash: true }], ['gold', 'your loudness matches', { dot: true }]]);
        v.readout(() => {
          const { P } = st; if (P == null) return '';
          const f = +tf.value, a = fmSpl(f, P), b = isoSpl(f, P), my = (mine[P] || {})[f];
          const fs = [50, 100, 4000].map((x) => `${x} Hz: ${v.fix(fmSpl(x, P), 1)} vs ${v.fix(isoSpl(x, P), 1)} dB`).join('; ');
          return `${P}-phon contour at ${f >= 1000 ? f / 1000 + ' kHz' : f + ' Hz'}: Fletcher & Munson ${v.fix(a, 1)} dB, ISO 226:2003 ${v.fix(b, 1)} dB (difference ${v.fix(a - b, 1)} dB${P < 20 || P > 90 ? '; ISO outside its validated range' : ''}) · your test tone is at ${v.fix(lvl.value, 1)} dB, ${v.fix(lvl.value - a, 1)} dB from the 1933 contour${my != null ? `; you recorded ${v.fix(my, 1)} dB` : ''} · along the ${P}-phon contour (1933 vs 2003) — ${fs} · the 1933 data: 11 observers, every point the median of 297 judgements, probable error 1–2 dB`;
        });
      },
    },
  ],
};
