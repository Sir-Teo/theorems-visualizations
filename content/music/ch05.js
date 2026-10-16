// Music Theory & Acoustics — Chapter 5: Hearing (part a: items 5.1–5.8)
import { TAU, SR, noteOf, dB, playhead, finish, toRms, join, partials, loopVoice, periodicLoop, BM_LEN, cfAt, placeOf, greenwood, erb, erbNumber, erbNumberInv, bark, barkInv, cbw, roex, thresholdQuiet, phonToSpl, splToPhon, travellingWave, fTicks, tones } from './ch05.shared.js';

const Z_AIR = 1.2 * 343; // characteristic impedance of air, Pa·s/m (rayl)
const Z_WATER = 1000 * 1482; // of water (cochlear fluid is close to it)
const Z_COCH = 2.0e10 * 3.2e-6; // human cochlear input impedance of the order of 2·10¹⁰ Pa·s/m³ (Aibara et al. 2001, Hear. Res. 152: 100–109; the exact value was not re-checked against the paper), over a 3.2 mm² footplate

/** Fraction of incident power transmitted across a boundary between specific impedances z1 → z2 (normal incidence). */
const transmit = (z1, z2) => (4 * z1 * z2) / (z1 + z2) ** 2;

/** Complex response (re, im) of a 4th-order gammatone filter at fc to a sinusoid at f (unit gain at fc). */
function gtResp(f, fc) {
  const b = 1.019 * erb(fc), u = (f - fc) / b; // (1 + iu)^-4
  const r2 = 1 + u * u, ang = -4 * Math.atan(u), m = 1 / (r2 * r2);
  return [m * Math.cos(ang), m * Math.sin(ang)];
}

/** Draw a coiled cochlea (2.6 turns) on an equal-aspect stage, coloured by an excitation function of place (mm from base, 0–1). */
function coil(s, exc, col = 'accent') {
  const turns = 2.6, N = 220, pt = (x) => { const u = x / BM_LEN, th = TAU * turns * u, r = 1.0 * Math.exp(-1.05 * u * turns * 0.62); return [r * Math.cos(th + 2.6), r * Math.sin(th + 2.6)]; };
  const P = []; for (let i = 0; i <= N; i++) P.push(pt((BM_LEN * i) / N));
  s.path(P, { color: 'faint', width: 13, alpha: 0.5 });
  for (let i = 0; i < N; i++) {
    const e = exc((BM_LEN * (i + 0.5)) / N);
    if (e > 0.02) s.line(P[i][0], P[i][1], P[i + 1][0], P[i + 1][1], { color: col, width: 11, alpha: Math.min(1, e) });
  }
  return pt;
}

export default {
  collection: 'music',
  chapter: 5,
  title: 'Hearing',
  summary: String.raw`The inner ear performs a running frequency analysis: each place along the basilar membrane answers to a narrow band of frequencies, laid out on Greenwood's logarithmic map. That one fact explains why the ear is nearly deaf to the phases of steady partials, why tones closer than a critical band mask and roughen each other, how beats turn into roughness, and where combination tones come from. The chapter then turns to how finely pitch is resolved, to the circular dimension of pitch that the Shepard illusion exploits, to localization by time and level differences between the ears, to the grouping of sounds into streams, and to the two rival accounts of pitch itself, place and timing.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1',
      kind: 'Model',
      name: 'The middle ear as an impedance transformer',
      statement: String.raw`Sound arrives in air, of specific acoustic impedance $z_{\text{air}}=\rho c\approx 412$ Pa·s/m, but must set the fluid of the cochlea moving, whose impedance is thousands of times larger. When a plane wave meets a boundary between impedances $z_1$ and $z_2$, the fraction of its power transmitted is
$$T=\frac{4z_1z_2}{(z_1+z_2)^2}\approx\frac{4z_1}{z_2}\quad(z_2\gg z_1).$$
For air on water ($z_2\approx1.48\times10^6$ Pa·s/m) this is about $0.11\%$, a loss of about 30 dB.

The middle ear is a mechanical **transformer**. The eardrum collects force over an effective area about $A\approx17$ times that of the stapes footplate in the oval window, and the ossicles act as a lever of ratio $\ell\approx1.3$. The pressure at the oval window is multiplied by $A\ell\approx22$ (about 27 dB), the velocity divided by $\ell$, so the load $z_c$ behind the oval window appears at the eardrum as
$$z_c' = \frac{z_c}{A\ell^2}.$$
Power is conserved by the transformer, so the transmitted fraction becomes $T=4z_{\text{air}}z_c'/(z_{\text{air}}+z_c')^2$, which is largest (100%) when $A\ell^2=z_c/z_{\text{air}}$.`,
      idea: String.raw`A force multiplied by the lever and concentrated from a large area onto a small one raises pressure, while the velocity drops by the lever ratio; the product, power, is unchanged (1.7). What changes is the ratio of pressure to velocity that the incoming wave sees, and matching that ratio is what lets the energy in instead of reflecting it. Against a half-space of water the textbook transformer ($A\ell^2\approx29$) recovers a factor of about 28, from 0.1% to about 3%. But the cochlea is not an open half-space: its measured input impedance is about $2\times10^{10}$ Pa·s/m³ over the 3.2 mm² footplate, about 25 times smaller than water's per unit area. Against that load the same transformer passes about half of the incident power, close to a match. The real middle ear does best between about 0.5 and 4 kHz; at low frequencies the stiffness of the eardrum and ligaments, and at high frequencies the mass of the ossicles, spoil the match.`,
      caption: String.raw`Left: incident sound (gold) arrives at the eardrum; the lever and the small footplate pass a share (green) into the cochlear fluid and the rest is reflected (red); arrow widths are proportional to power. Right: the transmitted fraction against the transformer ratio $A\ell^2$, with your setting marked. Slide the area ratio and the lever, switch the middle ear off to hit the oval window directly, and choose the load: the water half-space of the textbook argument, or the measured cochlear input impedance. *Listen* plays the same tone at the power each case lets through.`,
      deps: ['music-1.7'],
      see: ['music-1.8', 'music-1.10', 'mech-4.1'],
      refs: ['Benson ch. 1', 'Loy I ch. 6'],
      tags: ['ear', 'impedance'],
      credit: 'Helmholtz, 1868 (ossicular lever); Wever & Lawrence, 1954 (area and lever ratios)',
      scope: String.raw`An ideal, lossless, frequency-independent transformer between two resistive loads at normal incidence. Real middle ears have stiffness, mass and losses, and the eardrum does not move as a rigid piston, so the transfer is band-pass and less than ideal. Areas and lever ratio are classical averages (Wever & Lawrence); the cochlear load is the value measured in human temporal bones (Aibara et al., 2001), roughly resistive over 0.1–5 kHz.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Middle_ear' },
      viz(v) {
        const M = v.M;
        const aS = v.slider('area ratio $A$ (eardrum : footplate)', 1, 40, 17, { step: 0.5 });
        const lS = v.slider('lever ratio $\\ell$', 1, 3, 1.3, { step: 0.05 });
        const load = v.select('cochlear load', [{ value: 'coch', label: 'measured cochlea' }, { value: 'water', label: 'water half-space' }], 'coch');
        const on = v.toggle('middle ear', true);
        const sc = v.stage({ x: [0, 10], y: [-3.2, 3.2], height: 290, axes: false, weight: 1.2, title: 'outer ear → middle ear → cochlea' });
        const pl = v.stage({ x: [1, 1e4], y: [0, 1.05], xlog: true, height: 290, axes: 'box', gutter: true, xlabel: 'transformer ratio $A\\ell^2$', ylabel: 'power transmitted', yticks: [[0, '0'], [0.25, '25%'], [0.5, '50%'], [0.75, '75%'], [1, '100%']], weight: 1, title: 'how much gets in' });
        const zc = () => (load.value === 'coch' ? Z_COCH : Z_WATER);
        const N = () => (on.value ? aS.value * lS.value ** 2 : 1);
        const T = (n, z = zc()) => transmit(Z_AIR, z / n);
        const tone = (gainPow) => { const b = partials([1, 2, 3, 4, 5, 6].map((k) => ({ f: 220 * k, a: 1 / k })), 1.1, { att: 0.03, rel: 0.2 }); finish(b, 0.85); for (let i = 0; i < b.length; i++) b[i] *= Math.sqrt(gainPow); return b; };
        v.soundButton('Listen: no middle ear, then yours', (snd) => snd.samples(join([tone(T(1)), tone(T(N()))], 0.4), SR, { gain: 0.9, normalize: false }));
        v.soundButton('perfect match', (snd) => snd.samples(tone(1), SR, { gain: 0.9, normalize: false }));
        v.render(() => {
          const A = on.value ? aS.value : 1, L = on.value ? lS.value : 1, t = T(N());
          // ---- schematic
          sc.rect(0, -3.2, 2.6, 3.2, { fill: 'faint', fillAlpha: 0.08, stroke: false });
          sc.rect(7.2, -3.2, 10, 3.2, { fill: 'blue', fillAlpha: 0.13, stroke: false });
          sc.text('air', 0.25, 2.85, { align: 'left', color: 'muted', size: 12 });
          sc.text('cochlear fluid', 9.8, 2.85, { align: 'right', color: 'blue', size: 12 });
          const hd = Math.min(2.7, 0.62 * Math.sqrt(A)), hf = 0.62; // half-heights: drum and footplate (√area)
          sc.rect(2.6, -hd, 2.85, hd, { fill: 'ink', fillAlpha: 0.7, stroke: false });
          sc.text('eardrum', 2.72, Math.min(2.85, hd + 0.3), { align: 'center', color: 'ink', size: 11.5 });
          if (on.value) {
            // lever: pivot near the footplate end; arm lengths in ratio ℓ
            const px = 5.1, a1 = 1.25 * L / Math.max(1, L) + 0.8, a2 = a1 / L;
            sc.line(2.85, 0, px - a1 * 0.0, 0, { color: 'muted', width: 2 });
            sc.line(px - a1, 0.9, px + a2, 0.9, { color: 'orange', width: 4 });
            sc.poly([[px, 0.9], [px - 0.22, 0.45], [px + 0.22, 0.45]], { fill: 'orange', fillAlpha: 0.5, color: 'orange' });
            sc.line(px - a1, 0.9, px - a1, 0, { color: 'orange', width: 2 });
            sc.line(px + a2, 0.9, px + a2, 0, { color: 'orange', width: 2 });
            sc.line(px + a2, 0, 7.05, 0, { color: 'muted', width: 2 });
            sc.text(`lever ${v.fix(L, 2)} : 1`, px, 1.35, { align: 'center', color: 'orange', size: 11.5 });
            sc.text('ossicles', px, -0.45, { align: 'center', color: 'muted', size: 11 });
          } else {
            sc.text('no ossicles: sound strikes', 4.9, 0.5, { align: 'center', color: 'red', size: 11.5 });
            sc.text('the oval window directly', 4.9, 0.05, { align: 'center', color: 'red', size: 11.5 });
          }
          sc.rect(7.05, -hf, 7.2, hf, { fill: 'ink', fillAlpha: 0.7, stroke: false });
          sc.text('oval window', 7.12, -hf - 0.3, { align: 'center', color: 'ink', size: 11.5 });
          // power arrows (width ∝ power, min visible)
          const W = (p) => Math.max(1, 22 * p);
          sc.arrow(0.3, -2.2, 2.4, -2.2, { color: 'gold', width: W(1), head: 12 });
          sc.text('incident 100%', 1.35, -2.75, { align: 'center', color: 'gold', size: 11 });
          sc.arrow(2.4, 1.9, 0.4, 1.9, { color: 'red', width: W(1 - t), head: 12 });
          sc.text(`reflected ${v.fix(100 * (1 - t), 1)}%`, 1.35, 2.35, { align: 'center', color: 'red', size: 11 });
          sc.arrow(7.4, -2.2, 9.7, -2.2, { color: 'green', width: W(t), head: 12 });
          sc.text(`transmitted ${t < 0.01 ? v.fix(100 * t, 2) : v.fix(100 * t, 1)}%`, 8.55, -2.75, { align: 'center', color: 'green', size: 11, weight: 600 });
          sc.corner(`pressure gain ×${v.fix(A * L, 1)} (${v.fix(dB(A * L), 1)} dB)`, 'tl', { color: 'ink', weight: 600, plate: true });
          // ---- transmission curves
          const zs = [[Z_COCH, 'green', 'measured cochlea'], [Z_WATER, 'blue', 'water half-space']];
          for (const [z, col] of zs) {
            const sel = z === zc();
            pl.fn((n) => T(n, z), { color: col, width: sel ? 2.6 : 1.4, alpha: sel ? 1 : 0.45, n: 300 });
            pl.vline(z / Z_AIR, { color: col, width: 1, dash: [4, 4], alpha: sel ? 0.8 : 0.35 });
          }
          pl.text('match', zc() / Z_AIR, 1.0, { color: load.value === 'coch' ? 'green' : 'blue', size: 11, align: 'center', dy: -2 });
          pl.vline(28.7, { color: 'muted', width: 1, dash: [2, 3] });
          pl.text('textbook 17×1.3²', 28.7, 0.08, { color: 'muted', size: 10.5, align: 'left', dx: 4 });
          pl.dot(N(), t, { r: 6, color: 'gold', label: on.value ? 'your middle ear' : 'no middle ear', labelPos: N() > 300 ? 'w' : 'e' });
          pl.dot(1, T(1), { r: 4, color: 'red', hollow: true });
        });
        v.legend([['green', 'load: measured cochlear input impedance'], ['blue', 'load: water half-space'], ['gold', 'your transformer']]);
        v.readout(() => {
          const n = N(), t = T(n), t0 = T(1), nopt = zc() / Z_AIR;
          return `transformer ratio $A\\ell^2 = ${v.fix(n, 1)}$ · load seen at the eardrum $z_c/(A\\ell^2) = ${v.fix(zc() / n, 0)}$ Pa·s/m against $z_{\\text{air}} = ${v.fix(Z_AIR, 0)}$ · transmitted ${v.fix(100 * t, t < 0.01 ? 2 : 1)}% (${v.fix(10 * Math.log10(t), 1)} dB) · without a middle ear ${v.fix(100 * t0, 2)}% (${v.fix(10 * Math.log10(t0), 1)} dB) · gain ${v.fix(10 * Math.log10(t / t0), 1)} dB · a perfect match needs $A\\ell^2 = ${v.fix(nopt, 0)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2',
      kind: 'Model',
      name: 'The cochlea as a frequency analyzer',
      statement: String.raw`The cochlea is a fluid-filled tube about 35 mm long, coiled 2½ times and divided along its length by the **basilar membrane**, which is narrow and stiff at the base (near the oval window) and wide and floppy at the apex. Its stiffness falls by a factor of about 10⁴ from end to end, so each place has its own resonance. A pure tone of frequency $f$ launches a **travelling wave** that moves from base toward apex, growing and slowing until it reaches the place tuned to $f$, where it peaks and then dies away abruptly. Each frequency is thus mapped to a place, the **characteristic place**, by Greenwood's function
$$f(x)=165.4\,\big(10^{2.1x}-0.88\big)\ \text{Hz},$$
where $x$ is the fractional distance from the apex. It spans 20 Hz to 20.7 kHz and is close to logarithmic above about 500 Hz: each octave occupies roughly the same 3.5–5 mm. Hair cells along the membrane report the motion at each place, so the cochlea works as a bank of overlapping band-pass filters.`,
      idea: String.raw`The stiffness gradient is what does the work. Basal to the characteristic place, where the membrane is stiff for this frequency, the wave propagates and its wavelength shortens as the stiffness falls; at resonance the impedance becomes resistive and the energy is absorbed; beyond it the membrane is mass-controlled and the wave is evanescent. Because the resonance frequency depends exponentially on position, the map from place to frequency is logarithmic, which is why musical intervals, frequency ratios (1.5), correspond to fixed distances along the membrane. Von Békésy saw the travelling wave in cadavers in the 1940s; in living ears the outer hair cells amplify the peak by 40 dB or more and sharpen it, which this passive model leaves out. Two tones far apart excite separate places; tones close together excite overlapping regions, the starting point for critical bands (5.4), masking (5.5) and roughness (5.7).`,
      caption: String.raw`Right: the uncoiled basilar membrane, base (stapes) on the left, with the instantaneous displacement of the travelling wave (blue, slowed down enormously) inside its envelope; the dashed line is Greenwood's place for $f$ and the top row gives the characteristic frequency of each place. Left: the same excitation on the coiled cochlea. Drag the frequency and watch the peak move: each octave shifts it by a few millimetres. Switch on the second tone to see two separate peaks, or one merged bump when the tones are close. Hold the tone(s) to hear them while you drag.`,
      deps: ['music-4.5'],
      see: ['music-1.5', 'music-5.4', 'music-5.14', 'music-4.11'],
      refs: ['Benson ch. 1', 'Loy I ch. 6'],
      tags: ['cochlea', 'place theory'],
      credit: 'Helmholtz, 1863 (resonance theory); Georg von Békésy, 1928–1960 (travelling wave; Nobel Prize 1961); Donald Greenwood, 1961 and 1990 (place map)',
      scope: String.raw`The map is Greenwood's (1990) fit for the human cochlea. The wave is a passive long-wave (WKB) model whose local resonance follows Greenwood's map (damping $\delta=0.12$): it shows the shape (slow build-up, sharp apical cutoff) correctly but not the 40–60 dB of active amplification and the much sharper tuning of a living cochlea at low levels; its passive peak sits a millimetre or so basal of the characteristic place.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Greenwood_function' },
      viz(v) {
        const M = v.M;
        const f1S = v.slider('tone 1 $f_1$', 40, 16000, 1000, { log: true, fmt: (x) => `${v.fix(x, 0)} Hz (${noteOf(M, x)})`, onChange: () => { if (vo1) vo1.setFreq(f1S.value); } });
        const two = v.toggle('second tone', false, { onChange: () => syncSnd() });
        const f2S = v.slider('tone 2 $f_2$', 40, 16000, 1500, { log: true, fmt: (x) => `${v.fix(x, 0)} Hz (${noteOf(M, x)})`, onChange: () => { if (vo2) vo2.setFreq(f2S.value); } });
        let vo1 = null, vo2 = null;
        const hold = v.toggle('hold the tone(s)', false, { onChange: () => syncSnd() });
        function syncSnd() {
          if (vo1) { vo1.stop(); vo1 = null; } if (vo2) { vo2.stop(); vo2 = null; }
          if (!hold.value) return; const snd = v.sound();
          vo1 = snd.tone(f1S.value, { sustain: true, gain: 0.18, attack: 0.05 });
          if (two.value) vo2 = snd.tone(f2S.value, { sustain: true, gain: 0.18, attack: 0.05 });
        }
        const sp = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 300, axes: false, weight: 0.75, minWidth: 240, title: 'the coiled cochlea' });
        const bm = v.stage({ x: [0, BM_LEN], y: [-1.25, 1.55], height: 300, axes: 'box', gutter: true, xlabel: 'distance from the stapes (mm)', xticks: [0, 5, 10, 15, 20, 25, 30, 35], yticks: [], weight: 1.6, title: 'the uncoiled basilar membrane' });
        const cache = new Map();
        const wave = (f) => { const k = Math.round(f * 10); if (!cache.has(k)) { if (cache.size > 60) cache.clear(); cache.set(k, travellingWave(f, 420)); } return cache.get(k); };
        const sample = (W, x) => { const u = (x / BM_LEN) * W.n, i = Math.min(W.n - 1, Math.floor(u)), w = u - i; return [W.env[i] * (1 - w) + W.env[i + 1] * w, i, w]; };
        const peaks = (E) => { const pk = []; for (let i = 1; i < E.length - 1; i++) if (E[i] > E[i - 1] && E[i] >= E[i + 1] && E[i] > 0.2) pk.push(i); return pk; };
        const excitation = () => {
          const W1 = wave(f1S.value), W2 = two.value ? wave(f2S.value) : null, E = new Float64Array(W1.n + 1);
          for (let i = 0; i <= W1.n; i++) E[i] = Math.sqrt(W1.env[i] ** 2 + (W2 ? W2.env[i] ** 2 : 0));
          return { W1, W2, E };
        };
        v.animate((t) => {
          const { W1, W2, E } = excitation(), f1 = f1S.value, f2 = f2S.value;
          const r1 = 0.55, r2 = W2 ? M.clamp(0.55 * f2 / f1, 0.3, 1.6) : 0, p1 = TAU * r1 * t, p2 = TAU * r2 * t;
          const Emax = Math.max(...E) || 1;
          // ---- membrane
          for (const f of [16000, 8000, 4000, 2000, 1000, 500, 250, 125]) {
            const x = placeOf(f); bm.vline(x, { color: 'grid', width: 1 });
            bm.text(f >= 1000 ? `${f / 1000}k` : String(f), x, 1.42, { align: 'center', color: 'muted', size: 10.5 });
          }
          bm.text('Hz', 34.6, 1.42, { align: 'right', color: 'muted', size: 10.5 });
          bm.hline(0, { color: 'faint', width: 1 });
          const env = (W, col) => {
            const up = [], dn = []; for (let i = 0; i <= W.n; i++) { up.push([W.x[i], W.env[i]]); dn.push([W.x[i], -W.env[i]]); }
            bm.poly(up.concat(dn.reverse()), { fill: col, fillAlpha: 0.1, stroke: false });
            bm.path(up, { color: col, width: 1.2, alpha: 0.7, dash: [4, 3] });
          };
          env(W1, 'accent'); if (W2) env(W2, 'orange');
          const inst = []; const k = W2 ? 0.75 : 1;
          for (let i = 0; i <= W1.n; i++) {
            let y = W1.re[i] * Math.cos(p1) - W1.im[i] * Math.sin(p1);
            if (W2) y += W2.re[i] * Math.cos(p2) - W2.im[i] * Math.sin(p2);
            inst.push([W1.x[i], k * y]);
          }
          bm.path(inst, { color: W2 ? 'ink' : 'accent', width: 2.2 });
          bm.vline(placeOf(f1), { color: 'accent', width: 1.6, dash: [6, 4] });
          bm.text(`$f_1$`, placeOf(f1), -1.12, { color: 'accent', size: 12, align: 'center' });
          if (W2) { bm.vline(placeOf(f2), { color: 'orange', width: 1.6, dash: [6, 4] }); bm.text('$f_2$', placeOf(f2), -1.12, { color: 'orange', size: 12, align: 'center' }); }
          bm.text('base', 0.4, -1.12, { align: 'left', color: 'muted', size: 11 });
          bm.text('apex', 34.6, -1.12, { align: 'right', color: 'muted', size: 11 });
          // ---- coil
          const pt = coil(sp, (x) => sample({ env: E, n: W1.n }, x)[0] / Emax, W2 ? 'purple' : 'accent');
          const b = pt(0), a = pt(BM_LEN);
          sp.text('base (20 kHz)', b[0], b[1] - 0.17, { align: 'center', color: 'muted', size: 10.5 });
          sp.dot(a[0], a[1], { r: 3, color: 'muted' });
          sp.text('apex', a[0], a[1] + 0.16, { align: 'center', color: 'muted', size: 10.5 });
          for (const f of [1000, 4000, 250]) { const q = pt(placeOf(f)); sp.dot(q[0], q[1], { r: 2.5, color: 'ink' }); sp.text(f >= 1000 ? `${f / 1000}k` : String(f), q[0] * 1.2, q[1] * 1.2, { align: 'center', color: 'ink', size: 10.5 }); }
        }, { still: 0.9 });
        v.legend([['accent', 'tone 1: wave and envelope'], ['orange', 'tone 2'], ['ink', 'membrane displacement (sum)']]);
        v.readout(() => {
          const { W1, W2, E } = excitation(), f1 = f1S.value, f2 = f2S.value;
          let m = 0, xp = 0; for (let i = 0; i <= W1.n; i++) if (W1.env[i] > m) { m = W1.env[i]; xp = W1.x[i]; }
          let s = `$f_1 = ${v.fix(f1, 0)}$ Hz: Greenwood place ${v.fix(placeOf(f1), 1)} mm from the stapes (${v.fix(100 * (1 - placeOf(f1) / BM_LEN), 0)}% of the way from apex to base); model peak at ${v.fix(xp, 1)} mm · one octave higher would sit ${v.fix(placeOf(f1) - placeOf(Math.min(2 * f1, 20000)), 1)} mm nearer the base`;
          if (W2) {
            const d = Math.abs(placeOf(f1) - placeOf(f2)), np = peaks(E).length, dE = Math.abs(erbNumber(f2) - erbNumber(f1));
            s += `\n$f_2 = ${v.fix(f2, 0)}$ Hz: the two places are ${v.fix(d, 2)} mm apart (${v.fix(dE, 1)} ERB) → ${np >= 2 ? '**two separate peaks**: the tones are resolved' : '**one merged bump**: the cochlea cannot separate them'}`;
          }
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 5.3
    {
      num: '5.3',
      kind: 'Law',
      name: 'Ohm’s acoustic law: the ear hears partials, not phases',
      statement: String.raw`**Ohm's acoustic law** (1843), sharpened by Helmholtz: the ear analyses a steady complex tone into its sinusoidal partials, and the sensation depends on the amplitudes of the partials but, to a first approximation, not on their relative **phases**. Two tones
$$p(t)=\sum_n A_n\cos(2\pi nf_0t+\varphi_n),\qquad \tilde p(t)=\sum_n A_n\cos(2\pi nf_0t+\tilde\varphi_n)$$
with the same amplitudes have the same power spectrum and sound nearly alike, although their waveforms may look completely different.

The law holds for partials that are **resolved**, each falling in its own auditory filter. It fails for partials close enough together to share a filter (typically above the 6th–10th harmonic): the phases then shape the envelope of that filter's output, which the ear does hear as a change in timbre or buzziness.`,
      idea: String.raw`The cochlea is a filter bank (5.2). A filter containing a single partial outputs a sinusoid of constant amplitude whatever its phase, so the phase of a resolved partial leaves no trace in the excitation, and the hair cells report the same thing. Parseval's identity (4.4) says the power, harmonic by harmonic, does not depend on the phases either. When several partials fall in one filter, though, its output is their sum, and the shape of that sum's envelope depends on how the phases line up: in cosine phase they peak together once per period, a sharp buzz; with Schroeder's phases ($\varphi_n=\pi n^2/N$) the envelope is nearly flat. Because auditory filters are wider in hertz at high frequencies (5.4), high harmonics of a low note are the ones that share filters.`,
      caption: String.raw`Choose a phase recipe for ten equal-amplitude harmonics and compare. Top left: two periods of the waveform. Top right: the amplitude spectrum, which never changes. Bottom: the envelopes at the outputs of model auditory (gammatone) filters spread across the band, one trace per filter, each scaled to its mean. With **resolved** harmonics (1–10 of 200 Hz) most traces stay flat whatever the phases. With **unresolved** ones (21–30 of 100 Hz) every filter holds several harmonics, and the traces pulse in cosine phase but flatten with Schroeder phases. *Listen* plays cosine phase, then your choice, twice over.`,
      deps: ['music-5.2', 'music-4.4'],
      see: ['music-4.2', 'music-5.4', 'music-5.14', 'music-4.1'],
      refs: ['Loy I ch. 6'],
      tags: ['phase', 'perception'],
      credit: 'Georg Simon Ohm, 1843; Hermann von Helmholtz, 1863; phase effects: Plomp & Steeneken, 1969; Schroeder, 1970',
      scope: String.raw`Steady tones of moderate level. Phase is audible for unresolved partials, at onsets, and for very low fundamentals (below about 100 Hz), where the ear can follow the waveform period by period; at high levels the ear's own distortion can also make phase audible. The filters are 4th-order gammatone filters with ERB bandwidths (Glasberg & Moore, 1990).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ohm%27s_acoustic_law' },
      viz(v) {
        const M = v.M, NH = 10, NCH = 14;
        const reg = v.select('harmonics', [{ value: 'low', label: 'resolved: 1–10 of 200 Hz' }, { value: 'high', label: 'unresolved: 21–30 of 100 Hz' }], 'low', { onChange: () => sync() });
        const recipe = v.select('phases', [{ value: 'cos', label: 'cosine' }, { value: 'schroeder', label: 'Schroeder' }, { value: 'alt', label: 'alternating' }, { value: 'rand', label: 'random' }], 'rand', { onChange: () => sync() });
        let seed = 3;
        v.button('new random phases', () => { seed++; recipe.set('rand'); sync(); });
        const setup = () => (reg.value === 'low' ? { f0: 200, n0: 1 } : { f0: 100, n0: 21 });
        const phases = (rc = recipe.value) => {
          const r = v.rng(seed), out = [];
          for (let k = 0; k < NH; k++) out.push(rc === 'cos' ? 0 : rc === 'schroeder' ? (Math.PI * (k + 1) * (k + 1)) / NH : rc === 'alt' ? (k % 2 ? Math.PI / 2 : 0) : r.uniform(0, TAU));
          return out;
        };
        const harm = (rc) => { const { n0 } = setup(), ph = phases(rc); return ph.map((p, k) => [n0 + k, 1, p]); };
        const lv = loopVoice(v);
        const loopBuf = () => { const { f0 } = setup(); return toRms(periodicLoop(harm(), f0).buf, 0.13); };
        function sync() { lv.update(loopBuf, 0.8); v.invalidate(); }
        v.toggle('hold the tone', false, { onChange: (x) => { if (x) lv.start(loopBuf(), 0.8); else lv.stop(); } });
        v.soundButton('Listen: cosine / yours ×2', (snd) => {
          const { f0, n0 } = setup(), seg = (rc) => toRms(partials(phases(rc).map((p, k) => ({ f: (n0 + k) * f0, a: 1, ph: p })), 0.8, { att: 0.03, rel: 0.05 }), 0.13);
          snd.samples(join([seg('cos'), seg(recipe.value), seg('cos'), seg(recipe.value)], 0.25), SR, { gain: 0.9 });
        });
        const wv = v.stage({ x: [0, 2], y: [-1.15, 1.15], height: 200, axes: false, weight: 1.2, title: 'waveform (two periods)' });
        const sp = v.stage({ x: [0, 3400], y: [0, 1.25], height: 200, axes: 'box', gutter: true, xlabel: 'frequency (Hz)', yticks: [], weight: 1, title: 'amplitude spectrum (unchanged)' });
        const fb = v.stage({ x: [0, 2], y: [-0.6, NCH + 0.3], height: 310, axes: false, full: true, title: 'envelopes at the outputs of auditory filters (each trace scaled to its mean)' });
        const chans = () => { const { f0, n0 } = setup(), lo = erbNumber(f0 * (n0 - 0.3)), hi = erbNumber(f0 * (n0 + NH - 0.7)); return M.range(NCH).map((i) => erbNumberInv(lo + ((hi - lo) * i) / (NCH - 1))); };
        const envOf = (fc, rc, NT = 240) => {
          const { f0, n0 } = setup(), ph = phases(rc), G = ph.map((p, k) => gtResp((n0 + k) * f0, fc)), out = new Float64Array(NT);
          for (let j = 0; j < NT; j++) {
            const u = (2 * j) / (NT - 1); let re = 0, im = 0;
            for (let k = 0; k < NH; k++) { const th = TAU * (n0 + k) * u + ph[k], c = Math.cos(th), s = Math.sin(th); re += G[k][0] * c - G[k][1] * s; im += G[k][0] * s + G[k][1] * c; }
            out[j] = Math.hypot(re, im);
          }
          return out;
        };
        const depth = (E) => { let mx = 0, mn = Infinity, s = 0; for (const e of E) { mx = Math.max(mx, e); mn = Math.min(mn, e); s += e; } return { mx, mn, mean: s / E.length }; };
        const wave = (rc) => { const { n0 } = setup(), ph = phases(rc); return (u) => { let y = 0; for (let k = 0; k < NH; k++) y += Math.cos(TAU * (n0 + k) * u + ph[k]); return y; }; };
        v.render(() => {
          const { f0, n0 } = setup(), w = wave(), w0 = wave('cos');
          // waveform
          let pk = 0; for (let i = 0; i < 400; i++) pk = Math.max(pk, Math.abs(w0(i / 400)));
          wv.hline(0, { color: 'faint', width: 1 }); wv.vline(1, { color: 'faint', width: 1, dash: [3, 4] });
          if (recipe.value !== 'cos') wv.fn((u) => w0(u) / pk, { domain: [0, 2], n: 900, color: 'muted', width: 1, alpha: 0.45 });
          wv.fn((u) => w(u) / pk, { domain: [0, 2], n: 900, color: 'accent', width: 2 });
          wv.corner(recipe.value === 'cos' ? 'cosine phase' : 'yours (blue) over cosine phase (grey)', 'tl', { color: 'muted', size: 11, plate: true });
          // spectrum
          sp.setView([Math.max(0, f0 * (n0 - 1.5)), f0 * (n0 + NH + 0.5)], [0, 1.25]);
          for (let k = 0; k < NH; k++) { const f = (n0 + k) * f0; sp.line(f, 0, f, 1, { color: 'accent', width: 3 }); sp.dot(f, 1, { r: 3, color: 'accent' }); }
          const cs = chans();
          for (const fc of [cs[2], cs[Math.floor(NCH / 2)], cs[NCH - 3]]) sp.fn((f) => 1.12 * Math.hypot(...gtResp(f, fc)), { color: 'orange', width: 1.2, alpha: 0.75, n: 300 });
          sp.corner('orange: three of the filters', 'tr', { color: 'orange', size: 11, plate: true });
          // filter bank
          cs.forEach((fc, i) => {
            const E = envOf(fc), d = depth(E), y0 = i + 0.2, k = 0.42 / d.mean;
            fb.line(0, y0, 2, y0, { color: 'faint', width: 0.8 });
            const pts = []; for (let j = 0; j < E.length; j++) pts.push([(2 * j) / (E.length - 1), y0 + (E[j] - d.mean) * k]);
            fb.path(pts, { color: 'accent', width: 1.6, alpha: 0.9 });
            fb.text(`${v.fix(fc, 0)} Hz`, 0, y0 + 0.36, { align: 'left', color: 'muted', size: 10, dx: 2, plate: true });
            const sw = (D) => Math.min(40, dB(D.mx / Math.max(D.mn, 1e-6))), md = sw(d), mc = sw(depth(envOf(fc, 'cos', 120))), ch = Math.abs(md - mc) > 3;
            fb.text(recipe.value === 'cos' ? `swing ${v.fix(md, 1)} dB` : `swing ${v.fix(md, 1)} dB (cosine ${v.fix(mc, 1)})`, 2, y0 + 0.36, { align: 'right', color: recipe.value === 'cos' ? 'muted' : ch ? 'red' : 'green', size: 10, dx: -2, plate: true });
          });
        });
        v.legend([['accent', 'waveform / filter envelopes'], ['orange', 'auditory filter shapes'], ['green', 'envelope swing as in cosine phase (±3 dB)'], ['red', 'swing changed by the phases']]);
        v.readout(() => {
          const w = wave(), w0 = wave('cos'); let pk = 0, pk0 = 0; for (let i = 0; i < 800; i++) { pk = Math.max(pk, Math.abs(w(i / 800))); pk0 = Math.max(pk0, Math.abs(w0(i / 800))); }
          const rms = Math.sqrt(NH / 2), cs = chans(), sw = (fc, rc) => { const d = depth(envOf(fc, rc, 120)); return Math.min(40, dB(d.mx / Math.max(d.mn, 1e-6))); };
          const diffs = cs.map((fc) => Math.abs(sw(fc, recipe.value) - sw(fc, 'cos'))), nCh = diffs.filter((d) => d > 3).length;
          return `spectrum: identical (every partial at the same amplitude, change 0.0 dB) · crest factor of the waveform ${v.fix(pk / rms, 2)} (cosine phase ${v.fix(pk0 / rms, 2)}) · envelope swing changed by more than 3 dB in ${nCh} of ${NCH} filters (mean change ${v.fix(M.mean(diffs), 1)} dB) → ${recipe.value === 'cos' ? 'choose another phase recipe to compare' : nCh <= 3 ? 'the filter outputs hardly notice the phases: they are close to inaudible' : 'the filter envelopes depend on the phases, and so does the sound'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.4
    {
      num: '5.4',
      kind: 'Concept',
      name: 'Critical bands',
      statement: String.raw`The **critical band** is the bandwidth of the ear's frequency analysis: the range of frequencies around a given frequency that act together, as if passing through one **auditory filter**. Fletcher (1940) found it by masking a tone with noise centred on it: widening the noise band raises the tone's threshold until the band reaches a critical width, and widening it further (adding noise outside the filter) changes nothing. Two standard scales measure it:
(a) **critical bandwidth** (Zwicker): $\mathrm{CB}(f)\approx25+75\,[1+1.4(f/\text{kHz})^2]^{0.69}$ Hz, about 100 Hz below 500 Hz and about 20% of $f$ above; stacking them gives the **Bark** scale, 24 bands across the range of hearing;
(b) **equivalent rectangular bandwidth** (Glasberg & Moore, from notched-noise data): $\mathrm{ERB}(f)=24.7\,(4.37f/\text{kHz}+1)$ Hz, narrower at low frequencies (about 133 Hz at 1 kHz).

The critical band is the frequency scale of masking (5.5), roughness (5.7), loudness summation and consonance (6.3).`,
      idea: String.raw`In the **power-spectrum model** the listener attends to the single filter centred on the tone, and the tone is detected when its power reaches a fixed fraction $K$ of the noise power passing that filter: $P_T=K\,N_0\!\int_{\text{band}}|H(f)|^2\,df$, with $N_0$ the noise spectrum level. While the band is narrower than the filter, the integral grows in proportion to the bandwidth (3 dB per doubling); once the band covers the filter it stops at $N_0\cdot\mathrm{ERB}$. The knee of the threshold curve is therefore at about one ERB, which is how the bandwidth is measured. Physically, each filter is a stretch of basilar membrane about 0.9 mm long (5.2): with Greenwood's map that converts into a bandwidth that is roughly constant at low frequencies and proportional to $f$ at high ones.`,
      caption: String.raw`Top: a tone (blue line) in a band of noise (gold) of width $W$; the orange curve is the rounded-exponential auditory filter centred on the tone. Right: the predicted masked threshold against $W$, rising 3 dB per doubling and then flattening at the knee, one ERB (green). Drag the bandwidth across the knee and *Listen*: the tone is pulsed three times in the noise, at the level set by the last slider relative to the model's threshold (assumed $K=-4$ dB), so near 0 dB it should be just audible. Bottom: the 24 Bark bands and, for comparison, bands one ERB wide, along the same frequency axis.`,
      deps: ['music-5.2'],
      see: ['music-5.5', 'music-5.7', 'music-6.3', 'music-6.14'],
      refs: ['Benson ch. 4', 'Sethares ch. 3'],
      tags: ['critical band', 'perception'],
      credit: 'Harvey Fletcher, 1940; Eberhard Zwicker, 1957–1961 (Bark scale); Glasberg & Moore, 1990 (ERB)',
      scope: String.raw`The power-spectrum model with a symmetric roex(p) filter (Patterson, 1976) at moderate levels; real filters are asymmetric and broaden at high levels, and listeners can listen off-frequency. The efficiency $K$ is an assumed $-4$ dB (signal-to-noise ratio at threshold in one ERB, consistent with critical ratios of about 17–18 dB at 1 kHz); it sets only the absolute level, not the shape of the curve. The knee and widths follow the published formulas.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Critical_band' },
      viz(v) {
        const M = v.M, Kdb = -4;
        const fcS = v.select('tone', [250, 500, 1000, 2000, 4000].map((f) => ({ value: f, label: f >= 1000 ? `${f / 1000} kHz` : `${f} Hz` })), 1000);
        const wS = v.slider('noise bandwidth $W$', 10, 4000, 60, { log: true, fmt: (x) => `${v.fix(x, 0)} Hz` });
        const rel = v.slider('tone level re threshold', -15, 15, 0, { step: 1, fmt: (x) => `${x > 0 ? '+' : ''}${x} dB` });
        const band = (fc, W) => [Math.max(20, fc - W / 2), fc + W / 2];
        const thr = (fc, W) => { const [a, b] = band(fc, W); return 10 * Math.log10(M.integrate((f) => roex(f, fc), a, b, 400)) + Kdb; }; // dB re N0 (per Hz)
        const sp = v.stage({ x: [0, 2000], y: [-0.05, 1.3], height: 230, axes: 'box', gutter: true, yticks: [], xlabel: 'frequency (Hz)', weight: 1.1, title: 'tone, noise band and auditory filter' });
        const th = v.stage({ x: [10, 4000], y: [-12, 34], xlog: true, height: 230, axes: 'box', gutter: true, xticks: fTicks(10, 4000, [10, 20, 50, 100, 200, 500, 1000, 2000]), xlabel: 'noise bandwidth $W$ (Hz)', ylabel: 'threshold (dB re $N_0$)', weight: 1, title: 'masked threshold against bandwidth' });
        const st = v.stage({ x: [50, 16000], y: [0, 2], xlog: true, height: 120, axes: 'box', gutter: { l: 70, b: 28 }, xticks: fTicks(50, 16000), yticks: [[1.5, 'Bark'], [0.5, 'ERB']], full: true, title: 'the critical-band scales: 24 Bark bands, and bands one ERB wide' });
        // pulsed tone in band-limited noise, by inverse FFT (seeded phases), relative levels exact
        const synth = () => {
          const fc = fcS.value, [a, b] = band(fc, wS.value), N = 65536, df = SR / N, re = new Float64Array(N), im = new Float64Array(N), r = v.rng(11);
          for (let k = Math.ceil(a / df); k <= Math.floor(b / df) && k < N / 2; k++) { const p = r.uniform(0, TAU), A = Math.sqrt(2 * df); re[k] = A * Math.cos(p); im[k] = A * Math.sin(p); re[N - k] = re[k]; im[N - k] = -im[k]; }
          M.ifft(re, im); const out = new Float32Array(N); for (let i = 0; i < N; i++) out[i] = re[i] * N / 2; // amplitude per bin A: x = Σ A cos
          const At = Math.sqrt(2 * 10 ** ((thr(fc, wS.value) + rel.value) / 10));
          for (let i = 0; i < N; i++) { const t = i / SR, ph = (t - 0.15) % 0.45, on = t > 0.15 && t < 0.15 + 3 * 0.45 && ph < 0.3; if (on) { const g = Math.min(1, ph / 0.02, (0.3 - ph) / 0.02); out[i] += At * g * Math.sin(TAU * fc * t); } }
          let pk = 0; const g = 0.18 / Math.sqrt(4000); // fixed scale: the widest band (4 kHz) would have rms 0.18
          for (let i = 0; i < N; i++) { out[i] *= g; pk = Math.max(pk, Math.abs(out[i])); }
          if (pk > 0.95) for (let i = 0; i < N; i++) out[i] *= 0.95 / pk;
          const F = Math.round(0.05 * SR); for (let i = 0; i < F; i++) { out[i] *= i / F; out[N - 1 - i] *= i / F; }
          return out;
        };
        v.soundButton('Listen', (snd) => snd.samples(synth(), SR, { gain: 0.9, normalize: false }));
        v.render(() => {
          const fc = fcS.value, W = wS.value, [a, b] = band(fc, W), E = erb(fc), T = thr(fc, W), plateau = 10 * Math.log10(E) + Kdb;
          // spectrum panel (linear, zoomed to the band or the filter)
          const R = Math.max(0.62 * W, 2.4 * E); sp.setView([Math.max(0, fc - R), fc + R], [-0.05, 1.3]);
          sp.rect(a, 0, b, 0.6, { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 1 });
          sp.fn((f) => roex(f, fc), { color: 'orange', width: 2, n: 500 });
          sp.vband(fc - E / 2, fc + E / 2, { color: 'green', alpha: 0.08 });
          sp.line(fc, 0, fc, 1.12, { color: 'accent', width: 3 });
          sp.text(`tone ${fc} Hz`, fc, 1.18, { color: 'accent', size: 11.5, align: 'center' });
          sp.text(`noise, W = ${v.fix(W, 0)} Hz`, b, 0.66, { color: 'gold', size: 11, align: b > fc + 0.6 * R ? 'right' : 'left', dx: b > fc + 0.6 * R ? -4 : 4 });
          sp.corner(`1 ERB = ${v.fix(E, 0)} Hz (green)`, 'tl', { color: 'green', size: 11, plate: true });
          // threshold curve
          th.fn((w) => thr(fc, w), { color: 'accent', width: 2.4, n: 200 });
          th.fn((w) => 10 * Math.log10(w) + Kdb, { color: 'muted', width: 1, dash: [4, 4], domain: [10, E * 2.5] });
          th.hline(plateau, { color: 'muted', width: 1, dash: [4, 4] });
          th.vline(E, { color: 'green', width: 1.6, dash: [6, 4] });
          th.text(`ERB ${v.fix(E, 0)} Hz`, E, -10.5, { color: 'green', size: 11, align: 'left', dx: 4 });
          th.vline(cbw(fc), { color: 'purple', width: 1.2, dash: [2, 3] });
          th.text(`CB ${v.fix(cbw(fc), 0)}`, cbw(fc), 31, { color: 'purple', size: 10.5, align: 'left', dx: 4 });
          th.text('+3 dB per doubling', 14, 10 * Math.log10(14) + Kdb - 5, { color: 'muted', size: 10.5, align: 'left' });
          th.dot(W, T, { r: 6, color: 'gold' });
          th.dot(W, T + rel.value, { r: 4, color: 'accent', hollow: true });
          // scales strip
          for (let z = 0; z < 25; z++) {
            const f0 = barkInv(z), f1 = barkInv(z + 1); if (f1 < 50 || f0 > 16000) continue;
            st.rect(Math.max(50, f0), 1.1, Math.min(16000, f1), 1.9, { fill: z % 2 ? 'accent' : 'purple', fillAlpha: 0.22, color: 'panel', width: 1 });
            if (f1 - f0 > 0 && Math.log10(Math.min(16000, f1) / Math.max(50, f0)) > 0.05) st.text(String(z + 1), Math.sqrt(Math.max(50, f0) * Math.min(16000, f1)), 1.5, { align: 'center', color: 'ink', size: 10 });
          }
          for (let e = 1; e < 41; e++) {
            const f0 = erbNumberInv(e), f1 = erbNumberInv(e + 1); if (f1 < 50 || f0 > 16000) continue;
            st.rect(Math.max(50, f0), 0.1, Math.min(16000, f1), 0.9, { fill: e % 2 ? 'green' : 'teal', fillAlpha: 0.22, color: 'panel', width: 1 });
          }
          st.vline(fc, { color: 'accent', width: 2, alpha: 0.55 });
        });
        v.legend([['accent', 'tone / threshold curve'], ['gold', 'noise band'], ['orange', 'auditory filter (roex)'], ['green', '1 ERB'], ['purple', 'Zwicker critical band', { dash: true }]]);
        v.readout(() => {
          const fc = fcS.value, W = wS.value, E = erb(fc), T = thr(fc, W), plateau = 10 * Math.log10(E) + Kdb;
          return `tone ${fc} Hz · ERB ${v.fix(E, 1)} Hz, Zwicker critical band ${v.fix(cbw(fc), 0)} Hz, Bark ${v.fix(bark(fc), 2)} · noise band ${v.fix(W, 0)} Hz → threshold ${v.fix(T, 1)} dB re $N_0$, ${v.fix(plateau - T, 1)} dB below the plateau · ${W < E ? 'band narrower than the filter: widening it still raises the threshold' : 'band wider than the filter: the extra noise is filtered out, the threshold barely moves'} · tone played at ${rel.value > 0 ? '+' : ''}${rel.value} dB re threshold`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5',
      kind: 'Phenomenon',
      name: 'Masking',
      statement: String.raw`A sound that is audible on its own can be made inaudible by another sound, the **masker**. The **masked threshold** is the level a probe tone needs to be heard in the masker's presence; together with the threshold in quiet it bounds what is audible. For a tonal or narrow-band masker:
(a) masking is strongest at the masker's frequency and falls off on either side, measured on the critical-band (Bark) scale;
(b) it is **asymmetric**: the threshold falls steeply below the masker (about 27 dB per Bark) and more gently above it;
(c) the upward spread **grows with level**: the slope above the masker flattens as the masker gets louder, so a loud low tone masks a wide range of higher ones, while a high tone masks low ones hardly at all.

Masking also extends in time (a few milliseconds before a masker and up to about 200 ms after it), and perceptual audio coders such as MP3 and AAC quantise each band just finely enough to keep the error under the masked threshold.`,
      idea: String.raw`A probe is masked when the masker's excitation already dominates the stretch of basilar membrane that would signal it. The travelling wave of a tone (5.2) builds slowly from the base and stops sharply at the apical side of its peak; so a masker excites places tuned *above* its frequency (which lie basal) much more than places tuned below. Hence the gentle upper slope. At high levels the active amplification saturates near the peak but not in the tail, so the tail grows faster than the peak, and the upward spread grows. On the Bark scale the masking pattern of a tone has roughly the same triangular shape at every frequency, which is why critical bands (5.4) are the natural unit. Level is measured in decibels (1.8), and the threshold in quiet below which nothing is heard is the ISO 226 threshold (1.9).`,
      caption: String.raw`Drag the masker (orange) to set its frequency and level; its masking pattern (shaded red) spreads further toward high frequencies as you raise it. Drag the probe (blue): the readout says whether it is above the combined threshold (masking pattern or threshold in quiet, whichever is higher). *Masker + probe* plays the masker with the probe pulsed three times; *probe alone* gives a reference. Faint lines are ISO 226 equal-loudness contours (20–80 phon), for orientation. Relative levels are reproduced exactly; your playback level is unknown, so absolute thresholds will differ.`,
      deps: ['music-5.4', 'music-1.8'],
      see: ['music-1.9', 'music-1.10', 'music-5.2', 'sig-6.1'],
      refs: ['Loy I ch. 6', 'Benson ch. 1'],
      tags: ['masking', 'perception'],
      credit: 'Wegel & Lane, 1924; Fletcher, 1940; Zwicker, 1960s; spreading slopes: Terhardt, 1979',
      scope: String.raw`A two-slope spreading function on the Bark scale: lower slope 27 dB/Bark, upper slope $24+230/f_m-0.2L_m$ dB/Bark (Terhardt, 1979, after Maiwald), clamped at 5 dB/Bark at least. The peak of the pattern is drawn 10 dB below the masker level, an *illustrative* offset; measured offsets depend on the masker type and the task. The threshold in quiet is ISO 226:2003 $T_f$ (20 Hz–12.5 kHz).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Auditory_masking' },
      viz(v) {
        const M = v.M, OFF = 10;
        const s = v.stage({ x: [30, 12500], y: [-10, 100], xlog: true, height: 380, axes: 'box', gutter: true, grid: true, xticks: fTicks(30, 12500, [50, 100, 200, 500, 1000, 2000, 5000, 10000]), xlabel: 'frequency (Hz)', ylabel: 'level (dB SPL)', full: true, title: 'masking pattern of a tone' });
        const mk = s.handle(500, 70, { color: 'orange', label: 'masker', constrain: (x, y) => [M.clamp(x, 60, 8000), M.clamp(y, 20, 95)] });
        const pr = s.handle(1500, 35, { color: 'accent', label: 'probe', constrain: (x, y) => [M.clamp(x, 40, 12000), M.clamp(y, -5, 95)] });
        const showC = v.toggle('equal-loudness contours', true);
        const upper = (fm, Lm) => Math.max(5, 24 + 230 / fm - 0.2 * Lm);
        const pattern = (f, fm = mk.x, Lm = mk.y) => { const dz = bark(f) - bark(fm); return Lm - OFF - (dz < 0 ? 27 * -dz : upper(fm, Lm) * dz); };
        const total = (f) => 10 * Math.log10(10 ** (pattern(f) / 10) + 10 ** (thresholdQuiet(f) / 10));
        const make = (withMasker, withProbe) => {
          const dur = 2.2, n = Math.round(dur * SR), out = new Float32Array(n), am = 0.5, ap = am * 10 ** ((pr.y - mk.y) / 20);
          for (let i = 0; i < n; i++) {
            const t = i / SR; let y = 0;
            if (withMasker) y += am * Math.sin(TAU * mk.x * t) * Math.min(1, t / 0.03, (dur - t) / 0.05);
            if (withProbe) { const ph = (t - 0.3) % 0.6; if (t > 0.3 && t < 0.3 + 3 * 0.6 && ph < 0.35) y += ap * Math.sin(TAU * pr.x * t) * Math.min(1, ph / 0.02, (0.35 - ph) / 0.02); }
            out[i] = y;
          }
          return out;
        };
        v.soundButton('Masker + probe', (snd) => snd.samples(make(true, true), SR, { gain: 0.8, normalize: false }));
        v.soundButton('probe alone', (snd) => snd.samples(make(false, true), SR, { gain: 0.8, normalize: false }));
        v.soundButton('masker alone', (snd) => snd.samples(make(true, false), SR, { gain: 0.8, normalize: false }));
        v.render(() => {
          if (showC.value) for (const P of [20, 40, 60, 80]) { s.fn((f) => phonToSpl(f, P), { color: 'muted', width: 1, alpha: 0.35, n: 200 }); s.text(`${P} phon`, 40, phonToSpl(40, P), { color: 'muted', size: 10, align: 'left', dy: -6 }); }
          s.fn(thresholdQuiet, { color: 'ink', width: 1.6, dash: [6, 4], n: 300 });
          s.text('threshold in quiet (ISO 226)', 3000, thresholdQuiet(3000) + 9, { color: 'ink', size: 10.5, align: 'center' });
          s.between(total, () => -10, 30, 12500, { fill: 'red', fillAlpha: 0.13, n: 400 });
          s.fn(total, { color: 'red', width: 2.4, n: 400 });
          s.line(mk.x, -10, mk.x, mk.y, { color: 'orange', width: 3 });
          const T = total(pr.x), ok = pr.y > T;
          s.line(pr.x, -10, pr.x, pr.y, { color: ok ? 'accent' : 'muted', width: 2.4, dash: ok ? false : [4, 3] });
          s.line(pr.x, T, pr.x, pr.y, { color: ok ? 'green' : 'red', width: 1.4, alpha: 0.8 });
          s.corner(`upper slope ${v.fix(upper(mk.x, mk.y), 1)} dB/Bark · lower slope 27 dB/Bark`, 'tr', { color: 'red', size: 11.5, plate: true });
        });
        v.legend([['orange', 'masker'], ['accent', 'probe'], ['red', 'masked threshold'], ['ink', 'threshold in quiet', { dash: true }]]);
        v.readout(() => {
          const T = total(pr.x), m = pr.y - T, P = splToPhon(pr.x, pr.y);
          return `masker ${v.fix(mk.x, 0)} Hz at ${v.fix(mk.y, 0)} dB (Bark ${v.fix(bark(mk.x), 1)}) · probe ${v.fix(pr.x, 0)} Hz at ${v.fix(pr.y, 0)} dB, ${v.fix(bark(pr.x) - bark(mk.x), 1)} Bark ${pr.x > mk.x ? 'above' : 'below'} the masker · threshold there ${v.fix(T, 1)} dB (${pattern(pr.x) > thresholdQuiet(pr.x) ? 'set by the masker' : 'set by the threshold in quiet'}) → probe ${m > 0 ? `**audible**, ${v.fix(m, 1)} dB above threshold` : `**masked**, ${v.fix(-m, 1)} dB below threshold`} · alone it would have a loudness level of ${v.fix(P, 0)} phon`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.6
    {
      num: '5.6',
      kind: 'Phenomenon',
      name: 'Beats',
      statement: String.raw`Two pure tones of nearly equal frequencies $f$ and $f+\Delta$ sound as a single tone whose loudness swells and fades $\Delta$ times per second: **beats**. For equal amplitudes,
$$\cos 2\pi ft+\cos 2\pi(f+\Delta)t = 2\cos(\pi\Delta t)\,\cos\!\big(2\pi(f+\tfrac{\Delta}{2})t\big),$$
a tone at the mean frequency inside the slowly varying envelope $2|\cos\pi\Delta t|$, which repeats $\Delta$ times per second. With amplitudes $1$ and $a$ the envelope is $\sqrt{1+a^2+2a\cos 2\pi\Delta t}$, swinging between $1+a$ and $|1-a|$. Beats are clearly heard for $\Delta$ up to about 10–15 Hz; musicians tune unisons and octaves by slowing them to zero.`,
      idea: String.raw`It is superposition (1.11) and the sum-to-product identity (rca-0.1). In the phasor picture each tone is a rotating arrow; seen from a frame turning with the first, the second arrow turns slowly at $\Delta$ revolutions per second, alternately adding to and cancelling the first. The resultant's length is the envelope. The ear hears beats rather than two tones because both frequencies fall in one auditory filter (5.4), whose output is just this slowly modulated sinusoid; the beating is real in the air, not an illusion.`,
      caption: String.raw`Left: two phasors, drawn in a frame rotating with the first tone, so the second (orange) turns at exactly $\Delta$ revolutions per second in real time; the resultant (green) is the envelope. Right: a 20 ms close-up of the actual waveform around the moving playhead. Bottom: two seconds of the envelope, with the playhead. Slide $\Delta$ and count beats as you hear them; set the second amplitude below 1 and the fades no longer reach silence.`,
      deps: ['music-1.11', 'rca-0.1'],
      see: ['music-5.7', 'music-2.12', 'music-3.12', 'sig-2.3'],
      refs: ['Benson ch. 1', 'Sethares ch. 3'],
      tags: ['beats', 'interference'],
      credit: 'Joseph Sauveur, 1700 (beats used to measure frequency); Giuseppe Tartini, 1754',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Beat_(acoustics)' },
      viz(v) {
        const M = v.M;
        const fS = v.slider('$f$', 110, 1000, 440, { log: true, fmt: (x) => `${v.fix(x, 1)} Hz (${noteOf(M, x)})`, onChange: () => sync() });
        const dS = v.slider('$\\Delta$', 0, 20, 3, { step: 0.25, fmt: (x) => `${v.fix(x, 2)} Hz`, onChange: () => sync() });
        const aS = v.slider('second amplitude $a$', 0, 1, 1, { step: 0.05, onChange: () => sync() });
        const lv = loopVoice(v);
        const loopBuf = () => { const f = Math.round(fS.value * 4) / 4, d = dS.value; return partials([{ f, a: 0.35 }, { f: f + d, a: 0.35 * aS.value }], 4); }; // 4 s loop: f, Δ multiples of ¼ Hz → seamless
        function sync() { lv.update(loopBuf, 0.8); v.invalidate(); }
        v.toggle('hold the two tones', false, { onChange: (x) => { if (x) lv.start(loopBuf(), 0.8); else lv.stop(); } });
        v.soundButton('tone 1, tone 2, together', (snd) => { const f = fS.value, d = dS.value, a = aS.value; snd.samples(join([partials([{ f, a: 0.35 }], 1.2, { att: 0.03, rel: 0.1 }), partials([{ f: f + d, a: 0.35 * a }], 1.2, { att: 0.03, rel: 0.1 }), partials([{ f, a: 0.35 }, { f: f + d, a: 0.35 * a }], 4, { att: 0.03, rel: 0.2 })], 0.3), SR, { gain: 0.9, normalize: false }); });
        const ps = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 260, axes: false, weight: 0.8, minWidth: 220, title: 'phasors (frame rotating with tone 1)' });
        const zm = v.stage({ x: [-10, 10], y: [-2.2, 2.2], height: 260, axes: 'box', gutter: true, xlabel: 'time around the playhead (ms)', yticks: [], weight: 1.2, title: '20 ms of the waveform' });
        const ev = v.stage({ x: [0, 2], y: [-2.2, 2.2], height: 190, axes: 'box', gutter: true, xlabel: 'time (s)', yticks: [], full: true, title: 'two seconds: the envelope' });
        const env = (t) => Math.sqrt(1 + aS.value ** 2 + 2 * aS.value * Math.cos(TAU * dS.value * t));
        v.animate((t) => {
          const f = fS.value, d = dS.value, a = aS.value, tt = M.mod(t, 2), th = TAU * d * t;
          // phasors
          ps.circle(0, 0, 1 + a, { color: 'faint', width: 1, dash: [3, 4] });
          if (a < 1) ps.circle(0, 0, 1 - a, { color: 'faint', width: 1, dash: [3, 4] });
          ps.circle(1, 0, a, { color: 'orange', width: 1, alpha: 0.35 });
          ps.arrow(0, 0, 1, 0, { color: 'accent', width: 2.4 });
          const qx = 1 + a * Math.cos(th), qy = a * Math.sin(th);
          ps.arrow(1, 0, qx, qy, { color: 'orange', width: 2.4 });
          ps.arrow(0, 0, qx, qy, { color: 'green', width: 3 });
          ps.corner(`|sum| = ${v.fix(Math.hypot(qx, qy), 2)}`, 'tl', { color: 'green', weight: 600, plate: true });
          // zoom
          const w = (ms) => { const u = tt + ms / 1000; return Math.cos(TAU * f * u) + a * Math.cos(TAU * (f + d) * u); };
          zm.fn((ms) => env(tt + ms / 1000), { color: 'green', width: 1.4, dash: [5, 3] });
          zm.fn((ms) => -env(tt + ms / 1000), { color: 'green', width: 1.4, dash: [5, 3] });
          zm.fn(w, { color: 'accent', width: 1.8, n: 800 });
          zm.vline(0, { color: 'gold', width: 1.2, alpha: 0.7 });
          // envelope
          ev.between((x) => env(x), (x) => -env(x), 0, 2, { fill: 'accent', fillAlpha: 0.18, n: 500 });
          ev.fn(env, { color: 'green', width: 2, n: 500 }); ev.fn((x) => -env(x), { color: 'green', width: 2, n: 500 });
          ev.vline(tt, { color: 'gold', width: 2 });
          ev.dot(tt, env(tt), { r: 5, color: 'gold' });
          ev.corner(`${v.fix(2 * d, 1)} beats in these 2 s`, 'tr', { color: 'ink', weight: 600, plate: true });
        }, { period: 1e9, still: 0.4 });
        v.legend([['accent', 'tone 1 / the waveform'], ['orange', 'tone 2, relative to tone 1'], ['green', 'resultant = envelope'], ['gold', 'playhead']]);
        v.readout(() => {
          const f = fS.value, d = dS.value, a = aS.value, mx = 1 + a, mn = Math.abs(1 - a);
          return `beat rate $\\Delta = ${v.fix(d, 2)}$ Hz${d > 0 ? ` (one beat every ${v.fix(1000 / d, 0)} ms)` : ' (no beats: a steady tone)'} · heard pitch ≈ the mean ${v.fix(f + (a === 1 ? d / 2 : (a * a * d) / (1 + a * a)), 2)} Hz · envelope from ${v.fix(mn, 2)} to ${v.fix(mx, 2)}: ${mn > 0.001 ? `a swing of ${v.fix(dB(mx / mn), 1)} dB` : 'down to silence'} · ${d > 15 ? 'above about 15 Hz the beats blur into roughness (5.7)' : d > 0 ? 'slow enough to count' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7',
      kind: 'Phenomenon',
      name: 'From beats to roughness',
      statement: String.raw`As two pure tones move apart from unison, the sensation passes through three regimes:
(a) **beats**: below about 10–15 Hz difference, a single tone at the mean pitch with an audible slow loudness fluctuation (5.6);
(b) **roughness**: from about 15–20 Hz up to a large part of a critical band, the fluctuation becomes too fast to follow and is heard as a harsh, rattling quality; it is strongest near **a quarter of a critical band** (about 25 Hz apart near 440 Hz, about a semitone);
(c) **two smooth tones**: once the separation exceeds about one critical band, the roughness fades and the two pitches are heard separately and smoothly.

Plomp and Levelt (1965) measured the dissonance of two pure tones as a function of their separation and found a single curve when the separation is measured in critical bandwidths. Sethares's parametrization of it,
$$d(\Delta)=e^{-b_1 s\Delta}-e^{-b_2 s\Delta},\quad s=\frac{0.24}{0.0207\,f_{\min}+18.96},\ b_1=3.51,\ b_2=5.75,$$
peaks at $s\Delta=\ln(b_2/b_1)/(b_2-b_1)\approx0.22$.`,
      idea: String.raw`Everything follows from where the two tones fall on the basilar membrane (5.2). Within one auditory filter they produce a single excitation whose envelope fluctuates at the difference frequency $\Delta$ (5.6). The auditory system follows slow fluctuations as loudness changes, but above about 20 Hz it no longer can, and the fluctuation becomes a quality, roughness. As $\Delta$ grows further the two excitation peaks separate; once each lies in its own filter (5.4) nothing fluctuates and the roughness disappears. Because critical bands are wider (in semitones) at low frequencies, the same interval is rougher low down: a major third is smooth at 440 Hz but rough two octaves lower (6.9).`,
      caption: String.raw`Slide the second tone up from unison. Top: the Plomp–Levelt roughness (Sethares's fit) against the interval in cents for four base frequencies, yours in bold, with the regimes shaded; the gold point is your interval. Middle: a quarter of a second of the waveform and its envelope. Bottom: the two excitation patterns on the basilar membrane (the travelling-wave model of 5.2) around the place of $f_1$, overlapping or separating. Hold the tones while you drag, or play the **sweep**, a slow glide from unison to a fifth with the point riding the curve.`,
      deps: ['music-5.6', 'music-5.4'],
      see: ['music-6.3', 'music-6.9', 'music-6.14', 'music-4.16'],
      refs: ['Sethares ch. 3', 'Benson ch. 4'],
      tags: ['roughness', 'beats'],
      credit: 'Helmholtz, 1863; Plomp & Levelt, 1965; Terhardt, 1974; parametrization: Sethares, 1993',
      scope: String.raw`Two pure tones of equal amplitude at moderate level. The regime boundaries (15–20 Hz, about one critical band) are approximate and vary between listeners; the roughness curve is Sethares's smooth fit to Plomp and Levelt's averaged ratings, normalised to peak 1. The excitation patterns use the passive travelling-wave model of 5.2.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Consonance_and_dissonance' },
      viz(v) {
        const M = v.M, CMAX = 700, BASES = [110, 220, 440, 880];
        const fS = v.select('$f_1$', BASES.map((f) => ({ value: f, label: `${f} Hz` })), 440, { onChange: () => sync() });
        const cS = v.slider('interval', 0, CMAX, 60, { step: 1, fmt: (x) => `${x} ¢ (Δ = ${v.fix(fS.value * (2 ** (x / 1200) - 1), 1)} Hz)`, onChange: () => sync() });
        const f2 = (c = cS.value) => fS.value * 2 ** (c / 1200);
        const lv = loopVoice(v), ph = playhead(v);
        const loopBuf = () => { const a = Math.round(fS.value * 2) / 2, b = Math.round(f2() * 2) / 2; return partials([{ f: a, a: 0.3 }, { f: b, a: 0.3 }], 2); };
        function sync() { lv.update(loopBuf, 0.8); v.invalidate(); }
        v.toggle('hold the two tones', false, { onChange: (x) => { if (x) lv.start(loopBuf(), 0.8); else lv.stop(); } });
        const SW = 12;
        v.soundButton('sweep: unison → fifth (12 s)', (snd) => {
          const f1 = fS.value, n = Math.round(SW * SR), out = new Float32Array(n); let p2 = 0;
          for (let i = 0; i < n; i++) { const t = i / SR, c = (CMAX * t) / SW; p2 += (TAU * f1 * 2 ** (c / 1200)) / SR; out[i] = 0.3 * (Math.sin(TAU * f1 * t) + Math.sin(p2)); }
          snd.samples(finish(out, 0.6, SR, 0.05, 0.2), SR, { gain: 0.9 }); ph.start(SW, 'sweep');
        });
        const pl = v.stage({ x: [0, CMAX], y: [0, 1.2], height: 260, axes: 'box', gutter: true, xticks: [[0, '0'], [100, '100 m2'], [200, '200 M2'], [300, '300 m3'], [400, '400 M3'], [500, '500 P4'], [600, '600'], [700, 'P5']], yticks: [[0, '0'], [0.5, '0.5'], [1, '1']], xlabel: 'interval between the tones (cents)', ylabel: 'roughness', full: true, title: 'Plomp–Levelt roughness of two pure tones' });
        const wv = v.stage({ x: [0, 0.25], y: [-2.3, 2.3], height: 170, axes: 'box', gutter: true, xlabel: 'time (s)', yticks: [], weight: 1, title: 'the waveform' });
        const ex = v.stage({ x: [-6, 6], y: [0, 1.15], height: 170, axes: 'box', gutter: true, xlabel: 'place relative to $f_1$ (mm, toward apex →)', yticks: [], weight: 1, title: 'excitation on the basilar membrane' });
        const cents = () => (ph.tag === 'sweep' && ph.t != null ? Math.min(CMAX, (CMAX * ph.t) / SW) : cS.value);
        const rough = (f1, c) => M.plompLevelt(f1, f1 * 2 ** (c / 1200), 1, 1);
        const cache = new Map(); const wave = (f) => { const k = Math.round(f * 4); if (!cache.has(k)) { if (cache.size > 80) cache.clear(); cache.set(k, travellingWave(f, 700)); } return cache.get(k); };
        v.render(() => {
          const f1 = fS.value, c = cents(), b = f1 * 2 ** (c / 1200), d = b - f1;
          // regimes (in cents for this f1)
          const cAt = (hz) => 1200 * Math.log2(1 + hz / f1), cb = cbw(f1 * 2 ** (CMAX / 2400));
          const cBeat = cAt(15), cCB = Math.min(CMAX, 1200 * Math.log2((f1 + cbw(f1)) / f1));
          pl.vband(0, cBeat, { color: 'teal', alpha: 0.12 }); pl.vband(cBeat, cCB, { color: 'red', alpha: 0.08 }); pl.vband(cCB, CMAX, { color: 'green', alpha: 0.06 });
          pl.text('beats', cBeat / 2, 1.14, { align: 'center', color: 'teal', size: 11 });
          pl.text('roughness', (cBeat + cCB) / 2, 1.14, { align: 'center', color: 'red', size: 11 });
          if (cCB < CMAX - 60) pl.text('two smooth tones', (cCB + CMAX) / 2, 1.14, { align: 'center', color: 'green', size: 11 });
          for (const fb of BASES) { const sel = fb === f1; pl.fn((x) => rough(fb, x), { color: sel ? 'accent' : 'muted', width: sel ? 2.6 : 1.2, alpha: sel ? 1 : 0.5, n: 400 }); if (!sel) { let xm = 0, ym = 0; for (let x = 1; x < CMAX; x += 2) { const y = rough(fb, x); if (y > ym) { ym = y; xm = x; } } pl.text(`${fb}`, xm, ym, { color: 'muted', size: 10, align: 'center', dy: -8 }); } }
          pl.dot(c, rough(f1, c), { r: 6, color: 'gold' });
          pl.vline(c, { color: 'gold', width: 1, alpha: 0.6 });
          // waveform
          wv.fn((t) => Math.sin(TAU * f1 * t) + Math.sin(TAU * b * t), { color: 'accent', width: 1, n: 1600 });
          wv.fn((t) => 2 * Math.abs(Math.cos(Math.PI * d * t)), { color: 'green', width: 1.6, n: 400 });
          wv.corner(`envelope repeats ${v.fix(d, 1)} times per second`, 'tr', { color: 'green', size: 11, plate: true });
          // excitation
          const x0 = placeOf(f1), W1 = wave(f1), W2 = wave(b);
          const curve = (W) => { const P = []; for (let i = 0; i <= W.n; i++) { const x = W.x[i] - x0; if (x >= -6.2 && x <= 6.2) P.push([x, W.env[i]]); } return P; };
          const P1 = curve(W1), P2 = curve(W2);
          ex.poly([[P1[0][0], 0], ...P1, [P1[P1.length - 1][0], 0]], { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 1.8 });
          ex.poly([[P2[0][0], 0], ...P2, [P2[P2.length - 1][0], 0]], { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1.8 });
          ex.vline(0, { color: 'accent', width: 1, dash: [3, 3] }); ex.vline(placeOf(b) - x0, { color: 'orange', width: 1, dash: [3, 3] });
          if (ph.t != null) pl.corner('♪ sweeping', 'tr', { color: 'gold', weight: 600, plate: true });
        });
        v.legend([['accent', 'your $f_1$ / tone 1'], ['muted', 'other base frequencies'], ['orange', 'tone 2'], ['gold', 'your interval']]);
        v.readout(() => {
          const f1 = fS.value, c = cents(), b = f1 * 2 ** (c / 1200), d = b - f1, CB = cbw((f1 + b) / 2), r = rough(f1, c);
          const zone = d < 15 ? 'beats you can count' : d < CB ? 'roughness' : 'two smooth, separate tones';
          let cm = 0, rm = 0; for (let x = 0; x < CMAX; x += 0.5) { const y = rough(f1, x); if (y > rm) { rm = y; cm = x; } }
          return `$f_1 = ${f1}$ Hz, $f_2 = ${v.fix(b, 1)}$ Hz: Δ = ${v.fix(d, 1)} Hz = ${v.fix(d / CB, 2)} critical bandwidths (CB ${v.fix(CB, 0)} Hz) · roughness ${v.fix(r, 2)} → **${zone}** · the curve peaks at ${v.fix(cm, 0)} ¢ (Δ = ${v.fix(f1 * (2 ** (cm / 1200) - 1), 1)} Hz, ${v.fix((f1 * (2 ** (cm / 1200) - 1)) / cbw(f1), 2)} CB)`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.8
    {
      num: '5.8',
      kind: 'Phenomenon',
      name: 'Combination tones',
      statement: String.raw`Two loud pure tones $f_1<f_2$ presented together can produce faint additional pitches that are not in the sound: **combination tones**. The most prominent are
(a) the **cubic difference tone** $2f_1-f_2$, audible even at moderate levels when $f_2/f_1$ is small (strongest for ratios below about 1.2–1.3, often only 15–20 dB below the primaries), and moving *down* as $f_2$ moves up;
(b) the **quadratic difference tone** $f_2-f_1$ (Tartini's "third tone"), which needs high levels.

They are generated inside the cochlea by its nonlinear response, and can be recorded as sound coming back out of the ear canal (distortion-product otoacoustic emissions, used to screen newborn hearing).`,
      idea: String.raw`Pass $x=A\cos\omega_1t+A\cos\omega_2t$ through a weak nonlinearity $y=x+a_2x^2+a_3x^3$. Expanding the square produces $\omega_2-\omega_1$, $2\omega_1$, $2\omega_2$ and $\omega_1+\omega_2$ with amplitude $a_2A^2$. Expanding the cube produces $2\omega_1-\omega_2$ and $2\omega_2-\omega_1$ with amplitude $\tfrac34a_3A^3$, plus harmonics. Of these only components below the primaries can be heard, since those above are masked (5.5); $2f_1-f_2$ lies close below $f_1$, where the cochlea's active amplifier (5.2) is compressive, and so is especially strong. Being generated in the cochlea, the distortion product travels to its own characteristic place and is heard exactly as if it had been in the sound. A memoryless polynomial is the simplest model: it predicts the frequencies exactly but not the real dependence of level on the ratio $f_2/f_1$.`,
      caption: String.raw`Top: the spectrum of the two tones after the model nonlinearity, computed by FFT, with every distortion product labelled. Right: the frequencies of all components against $f_2/f_1$; as you slide the ratio up, $2f_1-f_2$ (red) falls while $f_2-f_1$ (purple) rises. Listen to the primaries alone, loud, and listen for a faint low pitch; *reference* plays a quiet pure tone at $2f_1-f_2$ to tell you where. *Glide* raises $f_2$ slowly with $f_1$ fixed: the cubic difference tone descends. *Through the model ear* plays the exaggerated distorted signal.`,
      deps: ['music-5.2'],
      see: ['music-5.5', 'music-4.12', 'sig-5.1', 'music-5.14'],
      refs: ['Benson ch. 4'],
      tags: ['nonlinearity', 'perception'],
      credit: 'Georg Andreas Sorge, 1745, and Giuseppe Tartini, 1754 (difference tones); Helmholtz, 1856; Goldstein, 1967 (cubic difference tone); Kemp, 1979 (otoacoustic emissions)',
      scope: String.raw`The spectrum uses a memoryless polynomial with illustrative coefficients, far stronger than a real ear's. It predicts the frequencies of all distortion products exactly, but in the real cochlea the level of $2f_1-f_2$ depends strongly on $f_2/f_1$ and only weakly on level, which no memoryless polynomial reproduces. The shaded region marks where $2f_1-f_2$ is typically audible (ratios up to about 1.3, Goldstein 1967).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Combination_tone' },
      viz(v) {
        const M = v.M, NF = 8192, FS = 8192 * 2; // FFT analysis at 16384 Hz sample rate: bins of 2 Hz
        const f1S = v.slider('$f_1$', 400, 1500, 1000, { step: 2, fmt: (x) => `${x} Hz` });
        const rS = v.slider('$f_2/f_1$', 1.02, 1.9, 1.2, { step: 0.002, fmt: (x) => `${v.fix(x, 3)} (f₂ = ${v.fix(f1S.value * x, 0)} Hz)` });
        const a2S = v.slider('quadratic term $a_2$', 0, 0.3, 0.06, { step: 0.01 });
        const a3S = v.slider('cubic term $a_3$', 0, 0.3, 0.1, { step: 0.01 });
        const prim = () => { const f1 = f1S.value, f2 = Math.round((f1 * rS.value) / 2) * 2; return [f1, f2]; };
        const spec = () => {
          const [f1, f2] = prim(), a2 = a2S.value, a3 = a3S.value, x = new Float64Array(NF);
          for (let i = 0; i < NF; i++) { const t = i / FS, s = 0.5 * Math.cos(TAU * f1 * t) + 0.5 * Math.cos(TAU * f2 * t); x[i] = s + a2 * s * s + a3 * s * s * s; }
          return M.spectrum(Array.from(x), FS);
        };
        const comps = () => { const [f1, f2] = prim(); return [[f1, 'f₁', 'accent'], [f2, 'f₂', 'accent'], [f2 - f1, 'f₂−f₁', 'purple'], [2 * f1 - f2, '2f₁−f₂', 'red'], [2 * f2 - f1, '2f₂−f₁', 'orange'], [2 * f1, '2f₁', 'muted'], [f1 + f2, 'f₁+f₂', 'muted'], [2 * f2, '2f₂', 'muted']]; };
        const levelAt = (S, f) => { const k = Math.round(f / (FS / NF)); let m = 0; for (let j = k - 1; j <= k + 1; j++) if (S.amp[j] > m) m = S.amp[j]; return m; };
        const make = (kind) => {
          const [f1, f2] = prim(), dur = kind === 'glide' ? 7 : 2.5, n = Math.round(dur * SR), out = new Float32Array(n), a2 = a2S.value, a3 = a3S.value; let p2 = 0;
          for (let i = 0; i < n; i++) {
            const t = i / SR, r = kind === 'glide' ? 1.1 + (0.4 * t) / dur : f2 / f1; p2 += (TAU * f1 * r) / SR;
            const s = 0.5 * Math.sin(TAU * f1 * t) + 0.5 * Math.sin(p2);
            out[i] = kind === 'ref' ? 0.06 * Math.sin(TAU * (2 * f1 - f2) * t) : kind === 'model' ? s + 3 * a2 * s * s + 3 * a3 * s * s * s : s;
          }
          if (kind === 'model') { let m = 0; for (let i = 0; i < n; i++) m += out[i]; m /= n; for (let i = 0; i < n; i++) out[i] -= m; }
          return finish(out, kind === 'ref' ? 0.08 : 0.9, SR, 0.05, 0.15);
        };
        v.soundButton('primaries (loud)', (snd) => snd.samples(make('prim'), SR, { gain: 0.9 }));
        v.soundButton('reference at 2f₁−f₂', (snd) => snd.samples(make('ref'), SR, { gain: 0.9, normalize: false }));
        v.soundButton('glide f₂ up', (snd) => snd.samples(make('glide'), SR, { gain: 0.9 }));
        v.soundButton('through the model ear', (snd) => snd.samples(make('model'), SR, { gain: 0.9 }));
        const sp = v.stage({ x: [0, 4000], y: [-80, 5], height: 260, axes: 'box', gutter: true, xlabel: 'frequency (Hz)', ylabel: 'level (dB re a primary)', weight: 1.4, title: 'spectrum after the model nonlinearity' });
        const fd = v.stage({ x: [1, 1.9], y: [0, 3800], height: 260, axes: 'box', gutter: true, xlabel: '$f_2/f_1$', ylabel: 'frequency (Hz)', weight: 1, title: 'where the components go' });
        v.render(() => {
          const S = spec(), [f1, f2] = prim(), ref = levelAt(S, f1), xmax = Math.min(4000, 2 * f2 + 300);
          sp.setView([0, xmax], [-80, 5]);
          const P = []; for (let k = 0; k < S.freq.length && S.freq[k] <= xmax; k++) P.push([S.freq[k], Math.max(-85, dB(S.amp[k] / ref))]);
          sp.path(P, { color: 'faint', width: 1 });
          const placed = [];
          for (const [f, nm, col] of comps()) {
            if (f <= 0 || f > xmax) continue; const L = dB(levelAt(S, f) / ref); if (L < -78) continue;
            sp.line(f, -80, f, L, { color: col, width: 3 }); sp.dot(f, L, { r: 3.5, color: col });
            let y = L + 5; while (placed.some((q) => Math.abs(q[0] - f) < xmax * 0.06 && Math.abs(q[1] - y) < 6)) y += 7;
            placed.push([f, y]); sp.text(nm, f, Math.min(y, 2), { align: 'center', color: col, size: 11, weight: col === 'red' ? 700 : 500 });
          }
          // frequency diagram
          fd.vband(1, 1.3, { color: 'red', alpha: 0.07 });
          fd.text('2f₁−f₂ audible', 1.01, 3600, { align: 'left', color: 'red', size: 10.5 });
          const lines = [[(r) => f1, 'accent', 'f₁', 1.45], [(r) => f1 * r, 'accent', 'f₂', 1.88], [(r) => f1 * (r - 1), 'purple', 'f₂−f₁', 1.65], [(r) => f1 * (2 - r), 'red', '2f₁−f₂', 1.8], [(r) => f1 * (2 * r - 1), 'orange', '2f₂−f₁', 1.88]];
          for (const [g, col, nm, xl] of lines) { fd.fn(g, { color: col, width: col === 'red' ? 2.6 : 1.8, domain: [1, 1.9] }); const yy = g(xl); if (yy < 3700) fd.text(nm, xl, yy, { align: 'right', color: col, size: 10.5, dy: -9, plate: true }); }
          fd.vline(f2 / f1, { color: 'gold', width: 1.6 });
          for (const [g, col] of lines) fd.dot(f2 / f1, g(f2 / f1), { r: 4, color: col });
        });
        v.legend([['accent', 'primaries'], ['red', 'cubic difference tone $2f_1-f_2$'], ['purple', 'quadratic difference tone $f_2-f_1$'], ['orange', '$2f_2-f_1$'], ['muted', 'harmonics and sum tone']]);
        v.readout(() => {
          const S = spec(), [f1, f2] = prim(), ref = levelAt(S, f1), Lc = dB(levelAt(S, 2 * f1 - f2) / ref), Lq = dB(levelAt(S, f2 - f1) / ref);
          const A = 0.5, thC = dB((0.75 * a3S.value * A ** 3) / A), thQ = dB((a2S.value * A * A) / A);
          return `$f_1 = ${f1}$ Hz, $f_2 = ${f2}$ Hz · cubic difference tone $2f_1-f_2 = ${2 * f1 - f2}$ Hz (${noteOf(M, 2 * f1 - f2)}), FFT level ${a3S.value ? v.fix(Lc, 1) : '−∞'} dB (theory $\\tfrac34a_3A^2$: ${a3S.value ? v.fix(thC, 1) : '−∞'} dB) · quadratic difference tone $f_2-f_1 = ${f2 - f1}$ Hz, FFT ${a2S.value ? v.fix(Lq, 1) : '−∞'} dB (theory $a_2A$: ${a2S.value ? v.fix(thQ, 1) : '−∞'} dB) · ${f2 / f1 <= 1.3 ? 'ratio in the range where the cubic difference tone is easiest to hear' : 'ratio above about 1.3: in a real ear the cubic difference tone becomes hard to hear'}`;
        });
      },
    },
  ],
};
