// Music Theory & Acoustics — Chapter 1: Sound as a wave (part b: intensity, decibels, hearing, interference, diffraction)

// ---------- shared helpers ----------
const AIR = { gamma: 1.4, M: 0.028965 };
/** Laplace's adiabatic speed of sound in air, √(γRT/M), in m/s (C = v.M.CONST, tC in °C). */
const cAir = (C, tC = 20) => Math.sqrt((AIR.gamma * C.R * (tC + C.T0)) / AIR.M);
/** Density of air pM/(RT) in kg/m³. */
const rhoAir = (C, tC = 20, p = C.atm) => (p * AIR.M) / (C.R * (tC + C.T0));
const I0 = 1e-12; // reference intensity, W/m²
const P0 = 20e-6; // reference pressure, Pa
const dB = (I) => 10 * Math.log10(I / I0);
/** A playhead that follows a sound for `dur` seconds, redrawing about 25 times a second; ph.t is the elapsed time, or null. */
function playhead(v) {
  let t0 = 0, dur = 0, id = 0;
  const stop = () => { if (id) clearInterval(id); id = 0; dur = 0; v.invalidate(); };
  if (v.onCleanup) v.onCleanup(() => { if (id) clearInterval(id); id = 0; });
  return {
    start(d) {
      if (id) clearInterval(id);
      t0 = performance.now(); dur = d;
      id = setInterval(() => { if (performance.now() - t0 > dur * 1000 + 80) stop(); else v.invalidate(); }, 40);
      v.invalidate();
    },
    stop,
    get t() { return dur ? (performance.now() - t0) / 1000 : null; },
  };
}
/** Short linear fade in and out (in place). */
function fade(buf, sr, t = 0.02) {
  const n = Math.min(Math.floor(t * sr), buf.length >> 1);
  for (let i = 0; i < n; i++) { const g = i / n; buf[i] *= g; buf[buf.length - 1 - i] *= g; }
  return buf;
}
/** Signed colour ramp for pressure fields: panel colour at 0, red for compression, blue for rarefaction (u in [−1, 1]). */
function signedRamp(v) {
  const pos = v.rgb('red'), neg = v.rgb('blue'), bg = v.rgb('panel');
  return (u) => { const a = Math.min(1, Math.abs(u)), c = u >= 0 ? pos : neg; return [bg[0] + (c[0] - bg[0]) * a, bg[1] + (c[1] - bg[1]) * a, bg[2] + (c[2] - bg[2]) * a]; };
}
/** Piecewise-linear interpolation in log frequency over a table (clamped at the ends). */
function logInterp(fs, ys, f) {
  if (f <= fs[0]) return ys[0];
  if (f >= fs[fs.length - 1]) return ys[ys.length - 1];
  let i = 0; while (fs[i + 1] < f) i++;
  const w = Math.log(f / fs[i]) / Math.log(fs[i + 1] / fs[i]);
  return ys[i] + w * (ys[i + 1] - ys[i]);
}
// ISO 226:2003 equal-loudness contours: frequencies, exponent α_f, magnitude L_U and hearing threshold T_f
const ISO226 = {
  f: [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500],
  af: [0.532, 0.506, 0.48, 0.455, 0.432, 0.409, 0.387, 0.367, 0.349, 0.33, 0.315, 0.301, 0.288, 0.276, 0.267, 0.259, 0.253, 0.25, 0.246, 0.244, 0.243, 0.243, 0.243, 0.242, 0.242, 0.245, 0.254, 0.271, 0.301],
  Lu: [-31.6, -27.2, -23, -19.1, -15.9, -13, -10.3, -8.1, -6.2, -4.5, -3.1, -2, -1.1, -0.4, 0, 0.3, 0.5, 0, -2.7, -4.1, -1, 1.7, 2.5, 1.2, -2.1, -7.1, -11.2, -10.7, -3.1],
  Tf: [78.5, 68.7, 59.5, 51.1, 44, 37.5, 31.5, 26.5, 22.1, 17.9, 14.4, 11.4, 8.6, 6.2, 4.4, 3, 2.2, 2.4, 3.5, 1.7, -1.3, -4.2, -6, -5.4, -1.5, 6, 12.6, 13.9, 12.3],
};
/** SPL (dB) of a pure tone of frequency f with loudness level `phon`, by the ISO 226:2003 formula. */
function phonToSpl(f, phon) {
  const af = logInterp(ISO226.f, ISO226.af, f), Lu = logInterp(ISO226.f, ISO226.Lu, f), Tf = logInterp(ISO226.f, ISO226.Tf, f);
  const Af = 4.47e-3 * (Math.pow(10, 0.025 * phon) - 1.15) + Math.pow(0.4 * Math.pow(10, (Tf + Lu) / 10 - 9), af);
  return (10 / af) * Math.log10(Af) - Lu + 94;
}
/** Inverse of phonToSpl in the phon argument (bisection; the formula is increasing in phon). */
function splToPhon(f, L) {
  let lo = 0, hi = 130;
  if (L <= phonToSpl(f, lo)) return 0;
  for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (phonToSpl(f, m) < L) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
/** Loudness in sones of a loudness level in phons: doubling per 10 phon above 40 phon, (P/40)^2.642 below. */
const sonesOf = (P) => (P >= 40 ? Math.pow(2, (P - 40) / 10) : Math.pow(Math.max(0, P) / 40, 2.642));

export default {
  collection: 'music',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Law',
      name: 'Intensity and the inverse-square law',
      statement: String.raw`The **intensity** $I$ of a sound is the power it carries per unit area through a surface facing the direction of travel, in W/m²; for a plane wave $I=p_{\rm rms}^2/\rho c$. A small source that radiates acoustic power $P$ equally in all directions into free space spreads that power over spheres of area $4\pi r^2$, so at distance $r$
$$I(r)=\frac{P}{4\pi r^2}.$$
Doubling the distance quarters the intensity (a drop of 6.02 dB) and halves the pressure amplitude, which falls as $1/r$. Near reflecting surfaces the listener also receives sound from *image sources* behind them, the level no longer follows the law, and a reflection that arrives late enough (several tens of milliseconds after the direct sound) is heard as a separate **echo**.`,
      idea: String.raw`Energy is conserved and, in steady state, cannot pile up anywhere, so the same power $P$ crosses every sphere centred on the source; this is why a spherical wave's amplitude falls as $1/r$ (waves-1.12). The sphere's area grows as $r^2$, so the power per square metre falls as $1/r^2$. Equivalently, a detector of fixed area $A$ subtends the solid angle $A/r^2$ and catches the fraction $A/4\pi r^2$ of the power. A flat wall acts like a mirror: the reflected sound seems to come from an image of the source behind the wall, along a longer path $r_2$, so it arrives later by $(r_2-r_1)/c$ and weaker by $(r_1/r_2)^2$ times the wall's reflection factor.`,
      caption: String.raw`Drag the listener (gold). The floor plan is coloured by the level in dB; the two rays through a 2 m patch show the same beam covering twice the width, and so four times the area, at twice the distance. Right: intensity against distance on log–log axes, a straight line of slope −2. *Walk away* plays the tone at $r$, $2r$ and $4r$. Switch on the **wall**: an image source appears, the level near the wall climbs above the free-field line, and *Clap* lets you hear the echo arrive after the delay shown.`,
      deps: ['music-1.1', 'waves-1.12'],
      refs: ['Loy I ch. 4', 'Rossing ch. 6'],
      tags: ['intensity', 'inverse square'],
      scope: String.raw`Holds in a free field (no reflecting surfaces), at distances large compared with the size of the source, for a source radiating equally in all directions, and over distances short enough that absorption by the air is negligible (it matters at high frequencies over hundreds of metres).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Inverse-square_law' },
      viz(v) {
        const M = v.M, C = M.CONST, c = cAir(C), P = 0.1, WX = 24, RMIN = 0.5;
        const fp = v.stage({ x: [-6, 54], y: [-20, 20], equal: true, height: 360, axes: false, weight: 1.3, title: 'floor plan, 60 m × 40 m: level in dB' });
        const gr = v.stage({ x: [RMIN, 60], y: [1e-6, 0.1], xlog: true, ylog: true, height: 360, axes: 'box', grid: true, xlabel: 'r (m)', ylabel: 'I (W/m²)', weight: 1, title: 'intensity along the line to the listener' });
        const wall = v.toggle('reflecting wall', false);
        const Rw = v.slider('wall reflects', 0, 1, 0.8, { step: 0.01, fmt: (x) => Math.round(100 * x) + '% of the energy' });
        const lis = fp.handle(9, 4, { color: 'gold', label: 'listener', constrain: (x, y) => { let X = M.clamp(x, -5.5, wall.value ? WX - 0.8 : 53); let Y = M.clamp(y, -19, 19); const r = Math.hypot(X, Y); if (r < 1) { X = X / (r || 1); Y = Y / (r || 1); } return [X, Y]; } });
        const Ifree = (r) => P / (4 * Math.PI * Math.max(RMIN, r) ** 2);
        const Iat = (x, y) => { const r1 = Math.hypot(x, y); let I = Ifree(r1); if (wall.value) I += Rw.value * Ifree(Math.hypot(x - 2 * WX, y)); return I; };
        const ph = playhead(v);
        const geo = () => {
          const r1 = Math.hypot(lis.x, lis.y), r2 = Math.hypot(lis.x - 2 * WX, lis.y);
          return { r1, r2, I: Iat(lis.x, lis.y), delay: (r2 - r1) / c };
        };
        const Iref = Ifree(1.5), gainOf = (I) => Math.min(0.35, 0.35 * Math.sqrt(I / Iref));
        const voice = { harmonics: 6, rolloff: 1.3, duration: 0.55, release: 0.12 };
        v.soundButton('Listen here', (snd) => snd.tone(300, { ...voice, duration: 1.2, gain: gainOf(geo().I) }));
        v.soundButton('Walk away: $r$, $2r$, $4r$', (snd) => {
          const r = geo().r1;
          [1, 2, 4].forEach((m, i) => snd.tone(300, { ...voice, gain: gainOf(Ifree(m * r)), delay: 0.75 * i }));
          ph.start(2.25);
        });
        v.soundButton('Clap', (snd) => {
          const g = geo(), g1 = Math.min(0.6, (0.6 * 3) / g.r1);
          snd.noise({ duration: 0.012, attack: 0.001, release: 0.08, gain: g1 });
          if (wall.value && Rw.value > 0) snd.noise({ duration: 0.012, attack: 0.001, release: 0.08, gain: g1 * Math.sqrt(Rw.value) * (g.r1 / g.r2), delay: g.delay });
        });
        v.animate((t) => {
          Rw.el.hidden = !wall.value;
          if (wall.value && lis.x > WX - 0.8) lis.x = WX - 0.8;
          const theme = v.color('panel');
          fp.heat((x, y) => (wall.value && x > WX ? NaN : dB(Iat(x, y))), { range: [55, 105], cmap: 'viridis', res: 3, key: `${wall.value}|${Rw.value}|${theme}` });
          fp.colorbar([55, 105], 'viridis', { pos: 'bottom', label: 'dB', length: 0.42 });
          // expanding shells (slowed: 5 m per 0.9 s on screen)
          const D = 5, fr = (t / 0.9) % 1;
          for (let n = 0; n < 12; n++) {
            const r = D * (n + fr); if (r < 0.6) continue;
            const a = Math.min(0.75, 3.5 / r);
            const th0 = wall.value && r > WX ? Math.acos(WX / r) : 0;
            fp.curve((u) => [r * Math.cos(u), r * Math.sin(u)], th0, 2 * Math.PI - th0, { color: 'panel', width: 1.4, alpha: a, n: 160 });
            if (wall.value && r > WX) { const t1 = Math.acos(-WX / r); fp.curve((u) => [2 * WX + r * Math.cos(u), r * Math.sin(u)], t1, 2 * Math.PI - t1, { color: 'panel', width: 1.2, alpha: a * Rw.value, dash: [4, 4], n: 120 }); }
          }
          if (wall.value) {
            fp.rect(WX, -25, 60, 25, { fill: 'gray', fillAlpha: 0.35, stroke: false });
            fp.line(WX, -25, WX, 25, { color: 'ink', width: 4 });
            fp.dot(2 * WX, 0, { r: 6, hollow: true, color: 'red', label: 'image', labelPos: 's', math: false });
            const g = geo();
            fp.line(2 * WX, 0, lis.x, lis.y, { color: 'red', width: 1, dash: [3, 4], alpha: 0.8 });
            const yw = (lis.y * (2 * WX - WX)) / (2 * WX - lis.x); // where the reflected ray meets the wall
            fp.path([[0, 0], [WX, yw], [lis.x, lis.y]], { color: 'red', width: 1.8 });
            fp.text(`echo +${Math.round(g.delay * 1000)} ms`, WX - 1, yw + (yw > 0 ? 1.8 : -1.8), { align: 'right', color: 'red', size: 12, weight: 600 });
          }
          // the beam through a 2 m patch at r and its 4 m image at 2r
          const r1 = Math.hypot(lis.x, lis.y), ux = lis.x / r1, uy = lis.y / r1, nx = -uy, ny = ux;
          const far = 2 * r1, okFar = !wall.value || far * ux < WX;
          fp.line(0, 0, far * ux + 2 * nx, far * uy + 2 * ny, { color: 'ink', width: 1, alpha: 0.6 });
          fp.line(0, 0, far * ux - 2 * nx, far * uy - 2 * ny, { color: 'ink', width: 1, alpha: 0.6 });
          fp.line(lis.x + nx, lis.y + ny, lis.x - nx, lis.y - ny, { color: 'gold', width: 4 });
          if (okFar) {
            fp.line(far * ux + 2 * nx, far * uy + 2 * ny, far * ux - 2 * nx, far * uy - 2 * ny, { color: 'orange', width: 4 });
            fp.dot(far * ux, far * uy, { r: 5, hollow: true, color: 'orange', label: '2r: ¼ of the intensity', labelPos: ux > 0.3 ? 's' : 'e', math: false });
          }
          fp.dot(0, 0, { r: 7, color: 'accent', label: 'source', labelPos: 'sw', math: false });
          // ---- log–log graph
          for (let k = 0; k <= 5; k++) gr.text(`${60 + 10 * k} dB`, 57, Math.pow(10, k - 6), { align: 'right', baseline: 'bottom', color: 'muted', size: 10.5, dy: -2 });
          gr.fn(Ifree, { color: 'accent', width: 2.4 });
          gr.text('free field: slope −2', 1.2, Ifree(1.2) * 1.5, { align: 'left', baseline: 'bottom', color: 'accent', size: 12, weight: 600 });
          if (wall.value) {
            const rw = ux > 0 ? WX / ux : Infinity;
            gr.fn((r) => (r < rw ? Iat(r * ux, r * uy) : NaN), { color: 'green', width: 2.2 });
            if (rw < 60) gr.vline(rw, { color: 'ink', width: 2, alpha: 0.6 });
          }
          const pt = ph.t != null ? Math.min(2, Math.floor(ph.t / 0.75)) : -1;
          [1, 2, 4].forEach((m, i) => {
            const r = m * r1; if (r > 60) return;
            gr.dot(r, Ifree(r), { r: i === pt ? 8 : 5, hollow: i > 0 && i !== pt, color: i === pt ? 'red' : i ? 'orange' : 'gold', label: i ? `${m}r` : null, labelPos: 'ne', math: true });
          });
          gr.dot(r1, Iat(lis.x, lis.y), { r: 6, color: 'gold', label: 'listener', labelPos: 'sw', math: false });
        }, { still: 0.4 });
        v.legend([['accent', 'free field $P/4\\pi r^2$'], ['green', 'with the wall (direct + reflected)'], ['gold', 'listener', { dot: true }], ['orange', 'at $2r$ and $4r$', { dot: true }]]);
        v.readout(() => {
          const g = geo(), A = 4 * Math.PI * g.r1 ** 2, If = Ifree(g.r1);
          let s = `$r$ = ${v.fix(g.r1, 1)} m: the power $P$ = ${P} W is spread over $4\\pi r^2$ = ${v.fmt(A, 4)} m², so $I = P/4\\pi r^2 = ${v.sci(If, 3)}$ W/m² (${v.fix(dB(If), 1)} dB) · at $2r$: $I/4$, ${v.fix(dB(If / 4) - dB(If), 2)} dB · pressure amplitude $\\propto 1/r$`;
          if (wall.value) s += ` · wall: reflected path ${v.fix(g.r2, 1)} m adds ${v.fix(dB(g.I) - dB(If), 2)} dB above the free-field value, and its echo arrives ${Math.round(g.delay * 1000)} ms after the direct sound${g.delay > 0.05 ? ' (late enough to be heard as a separate echo)' : ' (too soon to be heard as a separate echo)'}`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Definition',
      name: 'Sound pressure level and the decibel',
      statement: String.raw`Audible intensities span about twelve orders of magnitude, so they are measured on a logarithmic scale. The **intensity level** of a sound of intensity $I$ and the **sound pressure level** of a sound of rms pressure $p$ are
$$L_I=10\log_{10}\frac{I}{I_0}\ \text{dB},\quad I_0=10^{-12}\ \text{W/m}^2;\qquad L_p=20\log_{10}\frac{p}{p_0}\ \text{dB},\quad p_0=20\ \mu\text{Pa}.$$
Since $I=p^2/\rho c$ the two agree to within about 0.1 dB in air. A factor of 10 in intensity adds 10 dB and a factor 2 adds $10\log_{10}2\approx3.01$ dB; doubling the pressure adds 6.02 dB. **Combining sources:** independent (incoherent) sources add intensities, so $N$ equal sources are $10\log_{10}N$ dB above one (two give +3 dB, ten +10 dB), whereas identical in-phase (coherent) sources add pressures and give $20\log_{10}N$ dB.`,
      idea: String.raw`The logarithm turns ratios into differences (pma-8.6), so multiplying the intensity by 10 always moves the meter by the same 10 dB, wherever it starts. Intensity is the mean of $p^2/\rho c$ (1.7), and for two signals $\langle(p_1+p_2)^2\rangle=\langle p_1^2\rangle+\langle p_2^2\rangle+2\langle p_1p_2\rangle$. For independent signals the cross term averages to zero, the intensities add, and $N$ equal sources give $N$ times the intensity. For identical in-phase signals the cross term is as large as the others, the sum is $N^2$ times one source, and the level rises twice as fast; in antiphase it cancels.`,
      caption: String.raw`Slide the intensity of one source across twelve orders of magnitude: the meter moves a steady 10 dB per factor of ten. Choose how many sources play and how they are related. The right panel adds their actual signals sample by sample and measures the rms pressure: the level climbs by $10\log_{10}N$ for independent noise but by $20\log_{10}N$ for in-phase tones, and for tones with random phases it can land anywhere. *Listen* plays one source and then all of them (relative levels are honest; the absolute level is set by your volume).`,
      deps: ['music-1.7', 'pma-8.6'],
      refs: ['Loy I ch. 4', 'Benson ch. 1'],
      tags: ['decibel', 'loudness'],
      credit: 'Bell Telephone Laboratories, 1928 (the bel, after A. G. Bell)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sound_pressure' },
      viz(v) {
        const M = v.M, C = M.CONST, rc = rhoAir(C) * cAir(C), FS = 48000, NB = 4800, NV = 480, F_TONE = 500;
        const IS = v.slider('intensity of one source $I_1$', 1e-12, 1, 1e-6, { log: true, fmt: (x) => { const e = Math.floor(Math.log10(x) + 1e-9); return `${v.fix(x / Math.pow(10, e), 1)}×${M.pow10Text(e)} W/m²`; } });
        const nSel = v.select('sources $N$', [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 10, label: '10' }, { value: 100, label: '100' }], 2);
        const kind = v.select('', [{ value: 'noise', label: 'independent noise' }, { value: 'phase', label: 'same tone, in phase' }, { value: 'random', label: 'same tone, random phases' }], 'noise');
        const lad = v.stage({ x: [0, 1], y: [-6, 146], height: 400, axes: false, weight: 0.85, title: 'level meter' });
        const wav = v.stage({ x: [0, NV / FS * 1000], y: [-1, 1], height: 400, axes: 'box', xlabel: 't (ms)', weight: 1.15, title: 'pressure' });
        const cache = new Map();
        /** Unit-rms source signals summed: {one: source 0, sum: Σ sources} over NB samples. */
        const signals = (N, k) => {
          const key = `${N}|${k}`; if (cache.has(key)) return cache.get(key);
          const R = v.rng(7), one = new Float64Array(NB), sum = new Float64Array(NB);
          for (let s = 0; s < N; s++) {
            const x = new Float64Array(NB);
            if (k === 'noise') { let a = 0, b = 0; for (let i = 0; i < NB; i++) { const w = R.normal(); x[i] = (w + a + b) / 3; b = a; a = w; } }
            else { const phi = k === 'phase' ? 0 : R.uniform(0, 2 * Math.PI); for (let i = 0; i < NB; i++) x[i] = Math.sin((2 * Math.PI * F_TONE * i) / FS + phi); }
            let ss = 0; for (let i = 0; i < NB; i++) ss += x[i] * x[i];
            const g = 1 / Math.sqrt(ss / NB);
            for (let i = 0; i < NB; i++) { x[i] *= g; sum[i] += x[i]; if (s === 0) one[i] = x[i]; }
          }
          let ss = 0; for (let i = 0; i < NB; i++) ss += sum[i] * sum[i];
          const out = { one, sum, rms: Math.sqrt(ss / NB) };
          cache.set(key, out); return out;
        };
        v.soundButton('Listen: one, then all', (snd) => {
          const N = nSel.value, sr = 22050, n = Math.round(0.9 * sr), R = v.rng(99);
          const one = new Float32Array(n), all = new Float32Array(n);
          for (let s = 0; s < N; s++) {
            const phi = kind.value === 'random' ? R.uniform(0, 2 * Math.PI) : 0;
            for (let i = 0; i < n; i++) { const x = kind.value === 'noise' ? R.normal() * 0.5 : Math.sin((2 * Math.PI * F_TONE * i) / sr + phi) * 0.7071; all[i] += x; if (s === 0) one[i] = x; }
          }
          let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(all[i]), Math.abs(one[i]));
          const k = 0.9 / pk, gap = Math.round(0.35 * sr), buf = new Float32Array(2 * n + gap);
          for (let i = 0; i < n; i++) { one[i] *= k; all[i] *= k; }
          buf.set(fade(one, sr), 0); buf.set(fade(all, sr), n + gap);
          snd.samples(buf, sr, { gain: 0.7 });
        });
        const LMARKS = [[0, 'threshold of hearing'], [20, 'rustling leaves'], [30, 'whisper'], [40, 'quiet library'], [60, 'conversation at 1 m'], [80, 'busy street'], [100, 'jackhammer nearby'], [110, 'rock concert'], [120, 'threshold of discomfort'], [130, 'threshold of pain']];
        let st = null;
        v.render(() => {
          const N = nSel.value, S = signals(N, kind.value), I1 = IS.value, p1 = Math.sqrt(I1 * rc), L1 = dB(I1);
          const pN = p1 * S.rms, LN = L1 + 20 * Math.log10(S.rms);
          st = { I1, p1, L1, pN, LN, dL: LN - L1, N };
          // ---- ladder
          const xb0 = 0.05, xb1 = 0.13;
          lad.rect(xb0, 0, xb1, 140, { color: 'muted', width: 1 });
          lad.rect(xb0, 0, xb1, Math.min(140, LN), { fill: 'green', fillAlpha: 0.45, stroke: false });
          lad.rect(xb0 + 0.015, 0, xb1 - 0.015, Math.min(140, L1), { fill: 'accent', fillAlpha: 0.85, stroke: false });
          for (let L = 0; L <= 140; L += 10) {
            lad.line(xb1, L, xb1 + 0.02, L, { color: 'muted', width: 1 });
            lad.text(`${L}`, xb1 + 0.03, L, { align: 'left', color: 'ink', size: 10.5 });
            lad.text(`${M.pow10Text(L / 10 - 12)}`, xb1 + 0.13, L, { align: 'left', color: 'muted', size: 10.5 });
          }
          lad.text('dB', xb1 + 0.03, 144, { align: 'left', color: 'ink', size: 10.5, weight: 600 });
          lad.text('W/m²', xb1 + 0.13, 144, { align: 'left', color: 'muted', size: 10.5, weight: 600 });
          for (const [L, lab] of LMARKS) lad.text(lab, 0.44, L, { align: 'left', color: 'muted', size: 10.5 });
          lad.line(xb0 - 0.03, L1, 1, L1, { color: 'accent', width: 1.4, dash: [4, 3] });
          lad.text('one source', 0.99, L1, { align: 'right', baseline: 'top', dy: 2, color: 'accent', size: 11, weight: 700 });
          if (N > 1) {
            lad.line(xb0 - 0.03, LN, 1, LN, { color: 'green', width: 1.4, dash: [4, 3] });
            lad.text(`all ${N}: ${st.dL >= 0 ? '+' : '−'}${v.fix(Math.abs(st.dL), 2)} dB`, 0.99, LN, { align: 'right', baseline: 'bottom', dy: -2, color: 'green', size: 11, weight: 700 });
          }
          // ---- waveforms, in a unit that suits the level
          const U = pN >= 0.5 ? [1, 'Pa'] : pN >= 5e-4 ? [1e-3, 'mPa'] : [1e-6, 'µPa'];
          let mx = 0; for (let i = 0; i < NV; i++) mx = Math.max(mx, Math.abs(S.sum[i]), Math.abs(S.one[i]));
          const ym = (1.15 * mx * p1) / U[0];
          wav.setView(null, [-ym, ym]);
          wav.setTitle(`pressure of one source and of all ${N}, in ${U[1]}`);
          wav.hband(-pN / U[0], pN / U[0], { color: 'green', alpha: 0.1, edges: true });
          const tms = (i) => (i / FS) * 1000;
          if (N > 1) wav.path(M.range(NV).map((i) => [tms(i), (S.sum[i] * p1) / U[0]]), { color: 'green', width: 1.6 });
          wav.path(M.range(NV).map((i) => [tms(i), (S.one[i] * p1) / U[0]]), { color: 'accent', width: N > 1 ? 1.2 : 1.8, alpha: N > 1 ? 0.85 : 1 });
          wav.hline(p1 / U[0], { color: 'accent', dash: [5, 4], width: 1.2 }); wav.hline(-p1 / U[0], { color: 'accent', dash: [5, 4], width: 1.2 });
          wav.corner(`rms: one ${M.si(p1, 'Pa')}, all ${M.si(pN, 'Pa')}`, 'tr', { color: 'ink', weight: 600 });
        });
        v.legend([['accent', 'one source (dashed: its rms)'], ['green', 'sum of all $N$ (band: its rms)']]);
        v.readout(() => {
          if (!st) return '';
          const { I1, p1, L1, N, dL, LN } = st, Lp1 = 20 * Math.log10(p1 / P0);
          const pred = kind.value === 'phase' ? `$20\\log_{10}N$ = ${v.fix(20 * Math.log10(N), 2)} dB` : kind.value === 'noise' ? `$10\\log_{10}N$ = ${v.fix(10 * Math.log10(N), 2)} dB` : `on average $10\\log_{10}N$ = ${v.fix(10 * Math.log10(N), 2)} dB, but one draw of phases can land anywhere below ${v.fix(20 * Math.log10(N), 1)} dB`;
          return `one source: $I_1 = ${v.sci(I1, 3)}$ W/m² → $L_I = 10\\log_{10}(I_1/I_0)$ = ${v.fix(L1, 1)} dB; its rms pressure $p=\\sqrt{I_1\\rho c}$ = ${M.si(p1, 'Pa')} → $L_p = 20\\log_{10}(p/p_0)$ = ${v.fix(Lp1, 2)} dB (the ${v.fix(Lp1 - L1, 2)} dB difference is because $\\rho c$ = ${v.fix(rc, 0)}, not 400) · ${N} source${N > 1 ? 's' : ''}: measured total ${v.fix(LN, 2)} dB, ${dL >= 0 ? '+' : '−'}${v.fix(Math.abs(dL), 2)} dB (rule: ${pred})`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Phenomenon',
      name: 'Equal-loudness contours (phons and sones)',
      statement: String.raw`The ear is not equally sensitive at all frequencies, so sounds of equal sound pressure level do not sound equally loud. The **loudness level** of a pure tone, in **phons**, is the level in dB SPL of a 1 kHz tone that a typical listener judges equally loud. Joining the frequency–level points of equal loudness level gives the **equal-loudness contours** (standardised in ISO 226:2003 for young adults with normal hearing, frontal free-field listening, 20 Hz–12.5 kHz). They are lowest near 3–4 kHz, where hearing is most sensitive, rise steeply toward low frequencies (a 50 Hz tone needs about 26 dB more than a 1 kHz tone to reach 60 phon), and flatten at high levels. The **sone** scale measures loudness itself: 1 sone is a 1 kHz tone at 40 dB, and above about 40 phon each increase of 10 phon roughly **doubles** the loudness, $N\approx2^{(L_N-40)/10}$ sones.`,
      idea: String.raw`The contours are measured, not derived: listeners adjust a tone until it matches a 1 kHz reference, and ISO 226 fits the averaged data with a formula. The low-frequency rise reflects the transmission of the outer and middle ear and internal noise; the dip around 3–4 kHz is the resonance of the ear canal. Because level is logarithmic (1.8) and loudness grows roughly as a power of intensity, about $I^{0.3}$, a factor 10 in intensity (+10 dB) multiplies loudness by about $10^{0.3}\approx2$.`,
      caption: String.raw`Drag the test tone (gold). In **contour** mode it stays on the chosen contour: drag it into the bass and watch its dB reading climb while its loudness, in phons and sones, stays fixed. In **free** mode put it anywhere and read off its loudness level. *Test, then 1 kHz* plays it against the equally loud reference; the two sweeps step through octaves at constant dB and along the contour, which should sound more even (headphones help; the absolute level is set by your volume and your speakers colour the result).`,
      deps: ['music-1.8'],
      refs: ['Loy I ch. 6', 'Benson ch. 1'],
      tags: ['loudness', 'perception'],
      credit: 'Fletcher & Munson, 1933; ISO 226:2003',
      scope: String.raw`Median judgements of otologically normal listeners aged 18–25, pure tones, frontal free field; ISO 226 validates 20–90 phon over 20 Hz–12.5 kHz. Individual listeners differ by several dB, and loudness of complex sounds needs a loudness model.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equal-loudness_contour' },
      viz(v) {
        const M = v.M, SWEEP = [63, 125, 250, 500, 1000, 2000, 4000, 8000], STEP = 0.45;
        const mode = v.select('test tone', [{ value: 'contour', label: 'stays on a contour' }, { value: 'free', label: 'free' }], 'contour');
        const phS = v.slider('contour', 20, 90, 60, { step: 1, fmt: (x) => `${Math.round(x)} phon` });
        const s = v.stage({ x: [20, 12500], y: [-10, 130], xlog: true, height: 390, axes: 'box', grid: true, xlabel: 'f (Hz)', ylabel: 'SPL (dB)', weight: 1.55, title: 'equal-loudness contours (ISO 226:2003)' });
        const so = v.stage({ x: [0, 100], y: [0.02, 80], ylog: true, height: 390, axes: 'box', grid: true, xlabel: 'phon', ylabel: 'sones', weight: 0.7, title: 'loudness in sones' });
        const h = s.handle(100, phonToSpl(100, 60), { color: 'gold', constrain: (x, y) => { const f = M.clamp(x, 20, 12500); return mode.value === 'contour' ? [f, phonToSpl(f, phS.value)] : [f, M.clamp(y, -5, 125)]; } });
        const ph = playhead(v);
        let sweep = null;
        const play = (snd, pts) => {
          const Lmax = Math.max(...pts.map((p) => p[1]));
          pts.forEach(([f, L], i) => snd.tone(f, { duration: STEP * 0.85, gain: 0.3 * Math.pow(10, (L - Lmax) / 20), delay: i * STEP, release: 0.08 }));
          ph.start(pts.length * STEP);
        };
        v.soundButton('Test, then 1 kHz', (snd) => {
          const P = splToPhon(h.x, h.y), Lm = Math.max(h.y, P);
          snd.tone(h.x, { duration: 0.9, gain: 0.3 * Math.pow(10, (h.y - Lm) / 20) });
          snd.tone(1000, { duration: 0.9, gain: 0.3 * Math.pow(10, (P - Lm) / 20), delay: 1.1 });
          sweep = null; ph.start(2);
        });
        v.soundButton('Sweep at constant dB', (snd) => {
          const P = phS.value, Lmax = Math.max(...SWEEP.map((f) => phonToSpl(f, P)));
          sweep = SWEEP.map((f) => [f, P]);
          SWEEP.forEach((f, i) => snd.tone(f, { duration: STEP * 0.85, gain: 0.3 * Math.pow(10, (P - Lmax) / 20), delay: i * STEP, release: 0.08 }));
          ph.start(SWEEP.length * STEP);
        });
        v.soundButton('Sweep along the contour', (snd) => { sweep = SWEEP.map((f) => [f, phonToSpl(f, phS.value)]); play(snd, sweep); });
        v.render(() => {
          phS.el.hidden = mode.value !== 'contour';
          if (mode.value === 'contour') h.y = phonToSpl(h.x, phS.value);
          const P = mode.value === 'contour' ? phS.value : splToPhon(h.x, h.y);
          // threshold and contours
          s.path(ISO226.f.map((f, i) => [f, ISO226.Tf[i]]), { color: 'muted', width: 1.6, dash: [6, 4] });
          s.text('threshold of hearing', 3150, -6, { align: 'center', baseline: 'top', color: 'muted', size: 11, dy: 4 });
          for (let L = 10; L <= 90; L += 10) {
            const on = mode.value === 'contour' && L === Math.round(phS.value);
            s.fn((f) => phonToSpl(f, L), { color: on ? 'accent' : 'ink', width: on ? 3 : 1.1, alpha: on ? 1 : L === 10 ? 0.35 : 0.55, dash: L === 10 ? [3, 3] : null, n: 260 });
            s.text(`${L}`, 12500, phonToSpl(11000, L), { align: 'right', baseline: 'bottom', color: on ? 'accent' : 'muted', size: 10.5, dx: -4, dy: -1 });
          }
          if (mode.value === 'contour' && !Number.isInteger(phS.value / 10)) s.fn((f) => phonToSpl(f, phS.value), { color: 'accent', width: 3, n: 260 });
          // test tone against the 1 kHz reference
          s.line(1000, P, h.x, P, { color: 'green', width: 1.2, dash: [2, 3] });
          if (Math.abs(h.y - P) > 3) s.measure(h.x, P, h.x, h.y, `${h.y > P ? '+' : '−'}${v.fix(Math.abs(h.y - P), 1)} dB`, { color: 'ink', math: false, size: 12, offset: h.x > 2000 ? 30 : -30 });
          s.dot(1000, P, { r: 6, color: 'green', label: '1 kHz reference', labelPos: P > 100 ? 's' : 'n', math: false });
          if (sweep && ph.t != null) { const k = Math.floor(ph.t / STEP); sweep.forEach(([f, L], i) => s.dot(f, L, { r: i === k ? 7 : 4, color: i === k ? 'red' : 'orange', hollow: i !== k })); }
          // sones panel
          so.fn(sonesOf, { domain: [1, 100], color: 'accent', width: 2.2 });
          for (let L = 40; L <= 90; L += 10) { so.dot(L, sonesOf(L), { r: 3.5, color: 'muted' }); so.text(`${v.fmt(sonesOf(L), 2)}`, L, sonesOf(L), { align: 'right', baseline: 'bottom', dx: -5, dy: -3, color: 'muted', size: 10.5 }); }
          so.vline(P, { color: 'gold', dash: [4, 3] }); so.hline(sonesOf(P), { color: 'gold', dash: [4, 3] });
          so.dot(P, sonesOf(P), { r: 6, color: 'gold' });
        });
        v.legend([['accent', 'chosen contour (phon)'], ['muted', 'hearing threshold', { dash: true }], ['gold', 'test tone', { dot: true }], ['green', '1 kHz tone of equal loudness', { dot: true }]]);
        v.readout(() => {
          const P = mode.value === 'contour' ? phS.value : splToPhon(h.x, h.y), N = sonesOf(P), d = h.y - P;
          const thr = logInterp(ISO226.f, ISO226.Tf, h.x);
          const warn = h.y < thr ? ' — below the threshold of hearing: inaudible' : P < 20 || P > 90 ? ' (outside the 20–90 phon range ISO 226 validates)' : '';
          return `test tone ${v.fmt(h.x, 3)} Hz at ${v.fix(h.y, 1)} dB SPL → loudness level ${v.fix(P, 1)} phon, as loud as a 1 kHz tone at ${v.fix(P, 1)} dB → ${v.fmt(N, 3)} sone${N === 1 ? '' : 's'}${warn} · it needs ${d >= 0 ? v.fix(d, 1) + ' dB more' : v.fix(-d, 1) + ' dB less'} than the reference (×${v.fmt(Math.pow(10, Math.abs(d) / 20), 3)} in pressure) · every +10 phon doubles the sones: 50 → 2, 60 → 4, 70 → 8`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Phenomenon',
      name: 'The range of hearing',
      statement: String.raw`Young adults with normal hearing perceive pure tones from roughly **20 Hz to 20 kHz**, between the **threshold of hearing**, which is lowest (slightly below 0 dB SPL) around 3–4 kHz and rises steeply at both ends, and the threshold of discomfort and pain at roughly 120–130 dB. Below 20 Hz (*infrasound*) tones are felt more than heard; above the upper limit (*ultrasound*) nothing is heard at any safe level. The upper limit falls with age (*presbycusis*): thresholds at high frequencies rise roughly as the square of the years past 18, so few adults over 50 hear much above 12–15 kHz. The piano's range, 27.5 Hz to 4.2 kHz, sits well inside the audible region; the upper octaves matter for timbre rather than pitch.`,
      idea: String.raw`The threshold comes from the mechanics of the ear: the middle ear transmits low frequencies poorly, the ear canal resonates near 3–4 kHz, and the cochlea's hair cells that respond to the highest frequencies sit at its base, where wear accumulates first, which is why age and noise erode the top of the range. The picture uses Terhardt's fit to the threshold in quiet, $T(f)=3.64\,f^{-0.8}-6.5\,e^{-0.6(f-3.3)^2}+10^{-3}f^4$ dB ($f$ in kHz), and adds the median age shift $\alpha(f)\,(Y-18)^2$ dB of ISO 7029. The loudness contours of 1.9 are drawn on the same plane, but their lowest member is exactly this threshold.`,
      caption: String.raw`The shaded region is what a listener of the chosen age can hear (median model). Slide the age and watch the upper edge sink. Press *Sweep up* to hear a tone glide from 4 kHz to 20 kHz over 12 s, and press *I can't hear it* the moment it vanishes for you: your cut-off is marked (it also depends on your headphones or speakers). Drag the test tone (gold) to see how far above or below threshold it is.`,
      deps: ['music-1.9'],
      refs: ['Benson ch. 1', 'Loy I ch. 6'],
      tags: ['hearing', 'perception'],
      scope: String.raw`Median values for otologically normal listeners; individuals differ by 10 dB or more. The age shift follows ISO 7029, which tabulates 125 Hz–8 kHz; above 8 kHz it is extrapolated here (growing with log frequency), so the age dependence of the upper limit is a model, not a measurement.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hearing_range' },
      viz(v) {
        const M = v.M, F0 = 4000, F1 = 20000, TS = 12;
        const ISO7029 = { f: [125, 250, 500, 1000, 1500, 2000, 3000, 4000, 6000, 8000], male: [0.003, 0.003, 0.0035, 0.004, 0.0055, 0.007, 0.0115, 0.016, 0.018, 0.022], female: [0.003, 0.003, 0.0035, 0.004, 0.005, 0.006, 0.0075, 0.009, 0.012, 0.015] };
        const terhardt = (f) => { const k = f / 1000; return 3.64 * Math.pow(k, -0.8) - 6.5 * Math.exp(-0.6 * (k - 3.3) ** 2) + 1e-3 * k ** 4; };
        const ageS = v.slider('age', 10, 80, 20, { step: 1, fmt: (x) => `${Math.round(x)} years` });
        const sex = v.select('', [{ value: 'female', label: 'female' }, { value: 'male', label: 'male' }], 'female');
        const alpha = (f) => { const t = ISO7029[sex.value]; return f <= 8000 ? logInterp(ISO7029.f, t, f) : t[9] * (1 + 2 * Math.log2(f / 8000)); };
        const thr = (f, age = ageS.value) => terhardt(f) + (age > 18 ? alpha(f) * (age - 18) ** 2 : 0);
        const upper = (age) => { let lo = 1000, hi = 30000; if (thr(hi, age) < 120) return hi; for (let k = 0; k < 40; k++) { const m = Math.sqrt(lo * hi); if (thr(m, age) < 120) lo = m; else hi = m; } return lo; };
        const s = v.stage({ x: [14, 24000], y: [-20, 145], xlog: true, height: 390, axes: 'box', grid: true, xlabel: 'f (Hz)', ylabel: 'SPL (dB)', full: true, title: 'the audible region' });
        const h = s.handle(1000, 30, { color: 'gold', constrain: (x, y) => [M.clamp(x, 15, 23000), M.clamp(y, -15, 140)] });
        const ph = playhead(v);
        let you = null, sweeping = false;
        const fAt = (t) => F0 * Math.pow(F1 / F0, Math.min(1, t / TS));
        v.soundButton('Play the test tone', (snd) => { sweeping = false; snd.tone(h.x, { duration: 1.2, gain: h.x > 6000 ? 0.1 : 0.2 }); });
        v.soundButton('Sweep up 4 → 20 kHz', (snd) => {
          const sr = 44100, n = TS * sr, buf = new Float32Array(n), K = Math.log(F1 / F0);
          for (let i = 0; i < n; i++) { const t = i / sr; buf[i] = 0.5 * Math.sin(((2 * Math.PI * F0 * TS) / K) * (Math.exp((K * t) / TS) - 1)); }
          fade(buf, sr, 0.15);
          snd.samples(buf, sr, { gain: 0.35 }); sweeping = true; you = null; ph.start(TS);
        });
        v.button('I can’t hear it now', () => { if (sweeping && ph.t != null) { you = fAt(ph.t); sweeping = false; v.sound().stop(); ph.stop(); } });
        v.render(() => {
          const age = ageS.value, fu = upper(age);
          s.vband(14, 20, { color: 'gray', alpha: 0.18 });
          s.vband(20000, 24000, { color: 'gray', alpha: 0.18 });
          s.text('infrasound', 16.8, 75, { align: 'center', color: 'muted', size: 10.5 });
          s.text('ultra-', 21900, 80, { align: 'center', color: 'muted', size: 10.5 });
          s.text('sound', 21900, 72, { align: 'center', color: 'muted', size: 10.5 });
          s.between((f) => 130, (f) => Math.min(130, thr(f)), 14, 24000, { fill: 'accent', fillAlpha: 0.16, n: 500 });
          if (age > 18) { s.fn((f) => thr(f, 18), { color: 'muted', width: 1.2, dash: [4, 4], n: 400 }); s.text('age 18', 9000, thr(9000, 18), { align: 'center', baseline: 'top', dy: 4, color: 'muted', size: 10.5 }); }
          s.fn((f) => thr(f), { color: 'accent', width: 2.6, n: 500 });
          s.hline(130, { color: 'red', width: 2 }); s.text('threshold of pain', 30, 130, { align: 'left', baseline: 'bottom', dy: -2, color: 'red', size: 11.5, weight: 600 });
          s.hline(120, { color: 'orange', width: 1.4, dash: [5, 4] }); s.text('threshold of discomfort', 30, 120, { align: 'left', baseline: 'bottom', dy: -2, color: 'orange', size: 11 });
          s.text('threshold of hearing', 250, thr(250) - 3, { align: 'left', baseline: 'top', color: 'accent', size: 11.5, weight: 600 });
          s.vline(fu, { color: 'purple', width: 1.6, dash: [6, 3] });
          s.text(`upper limit ≈ ${v.fmt(fu / 1000, 3)} kHz`, fu, 100, { align: 'right', dx: -5, color: 'purple', size: 12, weight: 700 });
          // piano range
          s.rect(27.5, -16, 4186, -11, { fill: 'ink', fillAlpha: 0.65, stroke: false });
          s.text('piano: 27.5 Hz – 4.19 kHz', 340, -9, { align: 'center', baseline: 'bottom', color: 'ink', size: 10.5 });
          if (ph.t != null && sweeping) { const f = fAt(ph.t); s.vline(f, { color: 'red', width: 2.4 }); s.text(`${v.fmt(f / 1000, 3)} kHz`, f, 60, { align: 'right', dx: -5, color: 'red', size: 12.5, weight: 700 }); }
          if (you) { s.vline(you, { color: 'red', width: 2, dash: [3, 3] }); s.text(`you: ${v.fmt(you / 1000, 3)} kHz`, you, 40, { align: 'right', dx: -5, color: 'red', size: 12.5, weight: 700 }); }
          const SL = h.y - thr(h.x);
          s.text(SL >= 0 ? `audible (+${v.fix(SL, 0)} dB)` : `inaudible (${v.fix(SL, 0)} dB)`, h.x, h.y, { align: h.x > 3000 ? 'right' : 'left', dx: h.x > 3000 ? -12 : 12, dy: -12, color: SL >= 0 ? 'green' : 'red', size: 11.5, weight: 600 });
        });
        v.legend([['accent', 'threshold of hearing at this age (median)'], ['muted', 'at age 18', { dash: true }], ['accent', 'audible region', { area: true }], ['purple', 'upper limit (threshold reaches 120 dB)', { dash: true }]]);
        v.readout(() => {
          const age = ageS.value, fu = upper(age), T = thr(h.x), SL = h.y - T;
          return `age ${Math.round(age)} (${sex.value}, median): threshold ${v.fix(thr(1000), 1)} dB at 1 kHz, ${v.fix(thr(4000), 1)} dB at 4 kHz, ${v.fix(thr(8000), 1)} dB at 8 kHz; upper limit ≈ ${v.fmt(fu / 1000, 3)} kHz${age > 18 ? ` (${v.fmt(upper(18) / 1000, 3)} kHz at 18)` : ''} · test tone ${v.fmt(h.x, 3)} Hz at ${v.fix(h.y, 0)} dB: threshold there ${v.fix(T, 1)} dB, so ${SL >= 0 ? `${v.fix(SL, 1)} dB above it (audible)` : `${v.fix(-SL, 1)} dB below it (inaudible)`}${you ? ` · your sweep stopped at ${v.fmt(you / 1000, 3)} kHz` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Principle',
      name: 'Superposition and interference',
      statement: String.raw`Sound waves of ordinary loudness obey a **linear** wave equation, so when several sources play at once the pressure at every point is the **sum** of the pressures each would produce alone. For two sources of the same frequency the sum depends on their phase difference at the listener, $\Delta\phi=\varphi-k(r_2-r_1)$ (with $\varphi$ the phase between the sources and $r_1,r_2$ the path lengths): where the waves arrive in phase ($\Delta\phi$ a multiple of $2\pi$, e.g. path difference a whole number of wavelengths) they reinforce, and where they arrive half a cycle apart they cancel. The loud and quiet zones are fixed in space and lie along hyperbolas with the sources as foci. If the sources' frequencies differ by $\Delta f$, the pattern sweeps across the room and a listener hears the level rise and fall $\Delta f$ times per second (**beats**).`,
      idea: String.raw`The equations of 1.1 are linear in $p$ and $\xi$ as long as the pressure swing is a tiny fraction of atmospheric pressure, so the sum of two solutions is a solution (waves-1.6). Writing each wave as a phasor (1.2), the amplitude at the listener is $|A_1+A_2e^{i\Delta\phi}|=\sqrt{A_1^2+A_2^2+2A_1A_2\cos\Delta\phi}$, between $|A_1-A_2|$ and $A_1+A_2$. Points of fixed $r_2-r_1$ form hyperbolas, so the zones lie along them. Detuning one source makes $\Delta\phi$ grow by $2\pi\Delta f$ per second, so every point cycles through loud and quiet at the beat rate.`,
      caption: String.raw`Drag the two loudspeakers and the listener (gold). In **snapshot** mode you see the pressure field (red compressions, blue rarefactions, slowed down); in **loudness** mode the colour is the level relative to speaker 1 alone, with bright +6 dB zones and dark nulls along hyperbolas. Slide the phase of speaker 2 or press *Null at the listener*, then *Listen* and compare with *Speaker 1 alone*. Detune speaker 2 to make the pattern drift and to hear beats.`,
      deps: ['music-1.1', 'music-1.2', 'waves-1.6'],
      refs: ['Benson ch. 1', 'Loy I ch. 5'],
      tags: ['superposition', 'interference'],
      scope: String.raw`Holds for small-amplitude (linear) acoustics, i.e. pressure swings far below atmospheric pressure, which covers all ordinary sound; very intense sound (near 150 dB and above, shock waves) is nonlinear. The picture treats the speakers as point sources in free space, seen in a horizontal plane.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wave_interference' },
      viz(v) {
        const M = v.M, C = M.CONST, c = cAir(C), TAU = 2 * Math.PI, VIS_F = 0.6;
        const mode = v.select('view', [{ value: 'snap', label: 'snapshot of the pressure' }, { value: 'loud', label: 'loudness map' }], 'snap');
        const fq = v.slider('frequency $f$', 100, 1000, 343, { log: true, fmt: (x) => Math.round(x) + ' Hz' });
        const phS = v.slider('phase of speaker 2 $\\varphi$', 0, 360, 0, { step: 1, fmt: (x) => Math.round(x) + '°' });
        const dS = v.slider('detune speaker 2 $\\Delta f$', 0, 3, 0, { step: 0.05, fmt: (x) => v.fix(x, 2) + ' Hz' });
        const s = v.stage({ x: [-1, 11], y: [-3.6, 3.6], equal: true, height: 330, axes: false, full: true, title: 'floor plan, 12 m × 7 m' });
        const w = v.stage({ x: [0, 1], y: [-2.3, 2.3], height: 150, axes: 'box', yticks: [], xlabel: 't (ms)', full: true, title: 'at the listener: the two pressures and their sum' });
        const box = { x: [-0.9, 4], y: [-3.4, 3.4] };
        const S1 = s.handle(0, 0.9, { color: 'accent', label: '1', labelPos: 'w', constrain: box });
        const S2 = s.handle(0, -0.9, { color: 'orange', label: '2', labelPos: 'w', constrain: box });
        const L = s.handle(6.5, 0.6, { color: 'gold', label: 'listener', labelPos: 'ne' });
        const ramp = signedRamp(v);
        const geo = (t = 0) => {
          const r1 = Math.max(0.1, Math.hypot(L.x - S1.x, L.y - S1.y)), r2 = Math.max(0.1, Math.hypot(L.x - S2.x, L.y - S2.y)), k = (TAU * fq.value) / c;
          const dphi = (phS.value * Math.PI) / 180 + TAU * dS.value * t - k * (r2 - r1);
          const amp = Math.hypot(1 + (r1 / r2) * Math.cos(dphi), (r1 / r2) * Math.sin(dphi));
          return { r1, r2, k, dphi, amp, lam: c / fq.value };
        };
        v.button('Null at the listener', () => { const g = geo(v.t); const want = Math.PI + g.k * (g.r2 - g.r1) - TAU * dS.value * v.t; phS.set(Math.round(M.mod((want * 180) / Math.PI, 360))); });
        v.soundButton('Listen at the listener', (snd) => {
          const g = geo(v.t);
          if (dS.value > 0) snd.tone([[fq.value, 1], [fq.value + dS.value, g.r1 / g.r2]], { normalize: false, gain: 0.15, duration: 4 });
          else snd.tone(fq.value, { gain: 0.15 * g.amp, duration: 2 });
        });
        v.soundButton('Speaker 1 alone', (snd) => snd.tone(fq.value, { gain: 0.15, duration: 2 }));
        let st = null;
        v.animate((t) => {
          const k = (TAU * fq.value) / c, ph = TAU * VIS_F * t, phi = (phS.value * Math.PI) / 180 + TAU * dS.value * t;
          const a1x = S1.x, a1y = S1.y, a2x = S2.x, a2y = S2.y, theme = v.color('panel');
          if (mode.value === 'snap') {
            s.raster((x, y) => {
              const r1 = Math.max(0.12, Math.hypot(x - a1x, y - a1y)), r2 = Math.max(0.12, Math.hypot(x - a2x, y - a2y));
              const p = Math.cos(ph - k * r1) / r1 + Math.cos(ph - k * r2 + phi) / r2;
              return ramp(Math.tanh(1.6 * p));
            }, { res: 3, key: `${t}|${theme}` });
          } else {
            const dq = dS.value > 0 ? M.mod(phi, TAU).toFixed(2) : phi.toFixed(3);
            s.heat((x, y) => {
              const r1 = Math.max(0.12, Math.hypot(x - a1x, y - a1y)), r2 = Math.max(0.12, Math.hypot(x - a2x, y - a2y)), d = phi - k * (r2 - r1);
              return 20 * Math.log10(Math.max(1e-3, Math.hypot(1 + (r1 / r2) * Math.cos(d), (r1 / r2) * Math.sin(d))));
            }, { range: [-20, 6], cmap: 'magma', res: 3, key: `${a1x},${a1y},${a2x},${a2y},${k},${dq}|${theme}` });
            s.colorbar([-20, 6], 'magma', { pos: 'right', label: 'dB vs speaker 1', length: 0.6 });
          }
          s.line(S1.x, S1.y, L.x, L.y, { color: 'ink', width: 1, dash: [4, 4], alpha: 0.7 });
          s.line(S2.x, S2.y, L.x, L.y, { color: 'ink', width: 1, dash: [4, 4], alpha: 0.7 });
          const g = geo(t); st = g;
          // ---- waveforms at the listener (real time, normalised so speaker 1 has amplitude 1)
          const q = g.r1 / g.r2, k2 = g.k;
          if (dS.value > 0) {
            const T = Math.min(2.5, 2 / dS.value);
            w.setView([0, T * 1000], null);
            const env = (tm) => Math.hypot(1 + q * Math.cos(g.dphi - TAU * dS.value * t + TAU * dS.value * (tm / 1000)), q * Math.sin(g.dphi - TAU * dS.value * t + TAU * dS.value * (tm / 1000)));
            w.between((tm) => env(tm), (tm) => -env(tm), 0, T * 1000, { fill: 'green', fillAlpha: 0.25, n: 300 });
            w.fn(env, { color: 'green', width: 2 }); w.fn((tm) => -env(tm), { color: 'green', width: 2 });
            w.corner(`beats: ${v.fix(dS.value, 2)} per second (the carrier is too fast to draw)`, 'tr', { color: 'green', weight: 600 });
          } else {
            const T = 3 / fq.value;
            w.setView([0, T * 1000], null);
            const om = TAU * fq.value, d0 = g.dphi;
            w.hline(0, { color: 'faint', width: 1 });
            w.fn((tm) => Math.cos((om * tm) / 1000), { color: 'accent', width: 1.4, alpha: 0.85 });
            w.fn((tm) => q * Math.cos((om * tm) / 1000 + d0), { color: 'orange', width: 1.4, alpha: 0.85 });
            w.fn((tm) => Math.cos((om * tm) / 1000) + q * Math.cos((om * tm) / 1000 + d0), { color: 'green', width: 2.6 });
          }
          void k2;
        }, { still: 0.5 });
        v.legend([['accent', 'speaker 1'], ['orange', 'speaker 2'], ['green', 'the sum (what the listener hears)']]);
        v.readout(() => {
          if (!st) return '';
          const g = st, dr = g.r2 - g.r1, lvl = 20 * Math.log10(Math.max(1e-6, g.amp)), dph = M.mod((g.dphi * 180) / Math.PI + 180, 360) - 180;
          return `$f$ = ${Math.round(fq.value)} Hz, $\\lambda$ = ${M.si(g.lam, 'm')} · $r_1$ = ${v.fix(g.r1, 2)} m, $r_2$ = ${v.fix(g.r2, 2)} m: path difference ${v.fix(dr, 2)} m = ${v.fix(dr / g.lam, 2)} $\\lambda$ · phase difference at the listener $\\Delta\\phi$ = ${v.fix(dph, 0)}° → amplitude ${v.fix(g.amp, 2)} × speaker 1 alone (${lvl >= 0 ? '+' : '−'}${v.fix(Math.abs(lvl), 1)} dB): ${lvl > 3 ? 'a loud zone' : lvl < -6 ? 'a quiet zone' : 'in between'}${dS.value > 0 ? ` · detuned by ${v.fix(dS.value, 2)} Hz: beats ${v.fix(dS.value, 2)} times a second` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Phenomenon',
      name: 'Reflection and diffraction of sound',
      statement: String.raw`When sound meets an obstacle much larger than its wavelength it is **reflected** like light from a mirror (angle of incidence equals angle of reflection) and casts a **shadow**. When the obstacle or opening is comparable to or smaller than the wavelength, sound **diffracts**: it bends around edges and spreads out from openings. Through a doorway of width $w$ a wave with $\lambda\ll w$ passes as a beam that spreads only by angles of order $\lambda/w$ (the first null at $\sin\theta=\lambda/w$), while a wave with $\lambda\gtrsim w$ fans out in all directions, so the doorway behaves like a new source. Since audible wavelengths run from 17 m to 1.7 cm, everyday objects are "large" for treble and "small" for bass: you hear the bass of music round a corner, but its high frequencies are muffled.`,
      idea: String.raw`By Huygens' principle (waves-4.4) every point of the opening acts as a source of secondary wavelets; in a direction at angle $\theta$ the wavelets from the two edges differ in path by $w\sin\theta$. When that is much less than $\lambda$ for all angles they add in phase everywhere and the opening radiates like a point; when $w\gg\lambda$ they cancel except in a narrow beam of width about $\lambda/w$. A rigid wall forces the air velocity normal to it to vanish, which reflects the wave with the same sign and builds a standing-wave pattern in front of it (superposition, 1.11). The simulation solves the 2D wave equation $p_{tt}=c^2\nabla^2p$ on a 2.5 cm grid.`,
      caption: String.raw`A plane sound wave arrives from the left and meets a wall with a doorway (dashed lines: the edges of the geometric shadow). Lower the frequency and watch the wave flood round the corners; raise it and the doorway emits a beam with a shadow on either side. Drag the listener (gold) into the shadow: the meter shows the measured level relative to the incoming wave, and *Listen* plays the tone at that level, against *Incoming wave*. On the source side the reflected wave forms a standing pattern.`,
      deps: ['music-1.3', 'music-1.11', 'waves-4.4'],
      refs: ['Rossing ch. 3'],
      tags: ['diffraction', 'reflection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Diffraction' },
      viz(v) {
        const M = v.M, C = M.CONST, c = cAir(C), TAU = 2 * Math.PI;
        const DX = 0.025, NX = 240, NY = 112, CN = 0.5, DT = (CN * DX) / c, IW = 72, IS = 6, YC = 1.4, KM = (CN - 1) / (CN + 1);
        const fq = v.slider('frequency $f$', 100, 1600, 400, { log: true, fmt: (x) => Math.round(x) + ' Hz' });
        const wS = v.slider('doorway width $w$', 0.3, 1.2, 0.8, { step: 0.025, fmt: (x) => v.fix(x, 2) + ' m' });
        const s = v.stage({ x: [-0.04, 6.04], y: [-0.04, 2.84], equal: true, height: 380, axes: false, full: true, title: 'ripple tank: the 2D wave equation, solved live (6 m × 2.8 m)' });
        const lis = s.handle(4.2, 0.45, { color: 'gold', label: 'listener', labelPos: 'ne', constrain: (x, y) => [M.clamp(x, (IW + 3) * DX, 5.9), M.clamp(y, 0.1, 2.7)] });
        const N = NX * NY;
        let p = new Float32Array(N), pp = new Float32Array(N), pn = new Float32Array(N);
        const wall = new Uint8Array(N);
        let key = null, n = 0, S = 0, wd = 0, ms = 0, lamv = 0;
        const reset = () => {
          p.fill(0); pp.fill(0); pn.fill(0); n = 0; ms = 0;
          const half = wS.value / 2;
          for (let j = 0; j < NY; j++) { const y = (j + 0.5) * DX, door = Math.abs(y - YC) < half; for (let i = 0; i < NX; i++) wall[j * NX + i] = i >= IW && i < IW + 2 && !door ? 1 : 0; }
          wd = TAU * fq.value * DT;
          const kd = 2 * Math.asin(Math.min(1, Math.sin(wd / 2) / CN)); // discrete dispersion: unit-amplitude plane wave from a line source
          S = 2 * CN * CN * Math.sin(kd);
          lamv = c / fq.value;
        };
        const step = () => {
          const C2 = CN * CN, env = Math.min(1, (n * DT * fq.value) / 2), src = S * env * Math.sin(wd * n);
          for (let j = 0; j < NY; j++) {
            const row = j * NX;
            for (let i = 0; i < NX; i++) {
              const id = row + i;
              if (wall[id]) { pn[id] = 0; continue; }
              const pc = p[id];
              const l = i > 0 && !wall[id - 1] ? p[id - 1] : pc, r = i < NX - 1 && !wall[id + 1] ? p[id + 1] : pc;
              const d = j > 0 && !wall[id - NX] ? p[id - NX] : pc, u = j < NY - 1 && !wall[id + NX] ? p[id + NX] : pc;
              pn[id] = 2 * pc - pp[id] + C2 * (l + r + d + u - 4 * pc);
            }
            if (!wall[row + IS]) pn[row + IS] += src;
            // first-order Mur absorbing edges: left and right
            pn[row] = p[row + 1] + KM * (pn[row + 1] - p[row]);
            pn[row + NX - 1] = p[row + NX - 2] + KM * (pn[row + NX - 2] - p[row + NX - 1]);
          }
          for (let i = IW + 2; i < NX; i++) { // beyond the wall, top and bottom absorb too (the source side is a duct)
            pn[i] = p[i + NX] + KM * (pn[i + NX] - p[i]);
            const t = (NY - 1) * NX + i; pn[t] = p[t - NX] + KM * (pn[t - NX] - p[t]);
          }
          const tmp = pp; pp = p; p = pn; pn = tmp; n++;
          const li = Math.min(NX - 1, Math.floor(lis.x / DX)), lj = Math.min(NY - 1, Math.floor(lis.y / DX)), pv = p[lj * NX + li];
          const tau = Math.max(4 / fq.value, 0.01) / DT;
          ms += (pv * pv - ms) / tau;
        };
        const ramp = signedRamp(v);
        let lastLis = '';
        v.soundButton('Listen at the listener', (snd) => snd.tone(fq.value, { duration: 1.6, gain: 0.25 * Math.min(1.6, Math.sqrt(2 * ms)) }));
        v.soundButton('Incoming wave', (snd) => snd.tone(fq.value, { duration: 1.6, gain: 0.25 }));
        v.animate(() => {
          const kk = `${fq.value}|${wS.value}`;
          if (kk !== key) { key = kk; reset(); for (let q = 0; q < 760; q++) step(); }
          const lk = `${lis.x},${lis.y}`;
          if (lk !== lastLis) { lastLis = lk; ms = 0.5; } // restart the meter when the listener moves (it settles in a few periods)
          const T = 1 / fq.value, spf = M.clamp(Math.round(T / (12 * DT)), 1, 10);
          for (let q = 0; q < spf; q++) step();
          const ink = v.rgb('ink');
          s.raster((x, y) => {
            const i = Math.floor(x / DX), j = Math.floor(y / DX);
            if (i < 0 || j < 0 || i >= NX || j >= NY) return null;
            const id = j * NX + i;
            return wall[id] ? ink : ramp(Math.tanh(0.9 * p[id]));
          }, { res: 2, key: `${n}|${v.color('panel')}` });
          const half = wS.value / 2, xw0 = IW * DX, xw1 = (IW + 2) * DX;
          s.rect(xw0, 0, xw1, YC - half, { fill: 'ink', fillAlpha: 1, stroke: false });
          s.rect(xw0, YC + half, xw1, NY * DX, { fill: 'ink', fillAlpha: 1, stroke: false });
          s.line(xw1, YC + half, NX * DX, YC + half, { color: 'ink', width: 1.2, dash: [6, 4], alpha: 0.75 });
          s.line(xw1, YC - half, NX * DX, YC - half, { color: 'ink', width: 1.2, dash: [6, 4], alpha: 0.75 });
          s.text('geometric shadow', 5.9, 0.12, { align: 'right', color: 'ink', size: 11.5 });
          s.text('geometric shadow', 5.9, 2.68, { align: 'right', color: 'ink', size: 11.5 });
          s.text('plane wave →', 0.12, 2.68, { align: 'left', color: 'ink', size: 12, weight: 600 });
          s.rect(0, 0, NX * DX, NY * DX, { color: 'muted', width: 1 });
          if (lamv < 3) s.measure(0.25, 0.25, 0.25 + lamv, 0.25, `λ = ${M.si(lamv, 'm')}`, { color: 'ink', math: false, size: 12, offset: -11 });
          const lvl = 10 * Math.log10(Math.max(1e-9, 2 * ms));
          s.text(`${lvl >= 0 ? '+' : '−'}${v.fix(Math.abs(lvl), 1)} dB`, lis.x, lis.y, { align: lis.x > 5 ? 'right' : 'left', dx: lis.x > 5 ? -12 : 12, dy: 14, color: 'ink', size: 12.5, weight: 700 });
        }, { still: 0.5 });
        v.legend([['red', 'compression', { area: true }], ['blue', 'rarefaction', { area: true }], ['ink', 'rigid wall'], ['gold', 'listener', { dot: true }]]);
        v.readout(() => {
          const lam = c / fq.value, wv = wS.value, lvl = 10 * Math.log10(Math.max(1e-9, 2 * ms)), inShadow = Math.abs(lis.y - YC) > wv / 2;
          const beam = lam < wv ? `the beam's first null at $\\theta=\\arcsin(\\lambda/w)$ = ${v.fix((Math.asin(lam / wv) * 180) / Math.PI, 0)}°` : 'λ > w: the doorway radiates like a new source and the sound floods round the corners';
          return `$f$ = ${Math.round(fq.value)} Hz, $\\lambda = c/f$ = ${M.si(lam, 'm')}, doorway $w$ = ${v.fix(wv, 2)} m, $\\lambda/w$ = ${v.fix(lam / wv, 2)}: ${beam} · listener ${inShadow ? 'in the geometric shadow' : 'in the direct beam'}: measured level ${lvl >= 0 ? '+' : '−'}${v.fix(Math.abs(lvl), 1)} dB relative to the incoming wave`;
        });
      },
    },
  ],
};
