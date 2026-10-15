// Music Theory & Acoustics — Chapter 2 (part b): plucking point, flageolets, bowing, stiffness, hammers, Mersenne
import { TAU, SR, noteOf, playhead, finish, synth, decayOf, triCoeffs, bridgeParts, centroid, posts, stiff, bowSim, hammerSim } from './ch02.shared.js';

const F1 = 196;
/** Simple fractions k/q (q ≤ qmax, in lowest terms) of the unit interval, for snapping a handle onto them. */
function fractions(M, qmax) {
  const out = [];
  for (let q = 2; q <= qmax; q++) for (let k = 1; k < q; k++) if (M.gcd(k, q) === 1) out.push([k / q, k, q]);
  return out;
}
const snapTo = (fr, x, tol) => { for (const [f] of fr) if (Math.abs(x - f) < tol) return f; return x; };
const fracOf = (fr, x, tol = 1e-9) => fr.find(([f]) => Math.abs(x - f) < tol) || null;
/** Concatenate buffers with gaps of `gap` seconds. */
function join(bufs, gap = 0.15) {
  const g = Math.round(gap * SR), out = new Float32Array(bufs.reduce((a, b) => a + b.length, 0) + g * (bufs.length - 1));
  let o = 0; bufs.forEach((b) => { out.set(b, o); o += b.length + g; });
  return out;
}
const INTERVAL = { 1: 'the open string', 2: 'an octave up', 3: 'an octave and a fifth up (a twelfth)', 4: 'two octaves up', 5: 'two octaves and a major third up', 6: 'two octaves and a fifth up', 7: 'two octaves and a (flat) minor seventh up', 8: 'three octaves up' };

export default {
  collection: 'music',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Plucking point and missing harmonics (Young)',
      statement: String.raw`A string of length $L$ plucked at distance $p$ from one end (pulled aside to height $h$ at that point and released from rest) has mode amplitudes
$$b_n=\frac{2h}{\pi^2}\,\frac{L^2}{p\,(L-p)}\,\frac{\sin(n\pi p/L)}{n^2}.$$
Hence **every harmonic with a node at the plucking point is absent**: if $p/L=k/q$ in lowest terms, the harmonics $q,2q,3q,\dots$ are missing and no others. Plucked at the middle the string sounds only odd harmonics; plucked at a third, harmonics $3,6,9,\dots$ are missing. Near an end ($p\ll L$) the first $L/p$ or so harmonics have nearly the $1/n^2$ amplitudes of the bound, so the tone is bright; the force on the bridge has amplitudes $\propto\sin(n\pi p/L)/n$.`,
      idea: String.raw`The pluck is a triangle with a single corner at $p$, so the corner formula of 2.7 gives $b_n$ as the slope jump $h/p+h/(L-p)$ times $2\sin(n\pi p/L)/(n\pi/L)^2/L$. A mode that has a node at $p$ cannot be excited by a shape whose only corner is there: its overlap integral with the triangle vanishes. Equivalently, the initial shape is symmetric about $p$ in the way that mode is antisymmetric. The factor $\sin(n\pi p/L)$ is a comb sampling the harmonics, with teeth every $L/p$ harmonics; moving the pluck towards the end spreads the teeth out and lets more upper harmonics through.`,
      caption: String.raw`Drag the gold plucking point along the string; it clicks onto simple fractions. The bars are the levels of the harmonics (of the bridge force, or of the displacement), the orange curve is the comb $|\sin(n\pi p/L)|$ times the $1/n$ or $1/n^2$ bound (grey dashes), and red crosses mark the harmonics that vanish. The red dashed curve shows the lowest missing mode: it has a node exactly at the plucking point. *Listen*, and compare *near the bridge, then the middle*: bright, then hollow.`,
      deps: ['music-2.7'],
      see: ['music-2.13'],
      refs: ['Benson ch. 3', 'Loy I ch. 8'],
      tags: ['timbre', 'string'],
      credit: 'Thomas Young, 1800',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/String_vibration' },
      viz(v) {
        const M = v.M, NH = 24, H = 0.78, FR = fractions(M, 10);
        const view = v.select('spectrum of', [{ value: 'force', label: 'bridge force $n\\,b_n$' }, { value: 'disp', label: 'displacement $b_n$' }], 'force');
        const s = v.stage({ x: [-0.04, 1.04], y: [-0.82, 1.12], height: 225, axes: false, full: true });
        const sp = v.stage({ x: [-1.1, NH + 0.7], y: [-72, 7], height: 250, axes: 'box', xlabel: 'harmonic n', xticks: [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24], yticks: [[0, '0 dB'], [-20, '−20'], [-40, '−40'], [-60, '−60']], full: true });
        const h = s.handle(0.2, H, { color: 'gold', label: 'pluck', labelPos: 'n', constrain: (x) => [snapTo(FR, M.clamp(x, 0.02, 0.98), 0.006), H] });
        const pluck = (p, dur = 1.6) => finish(synth(bridgeParts(triCoeffs(p, 1, 40), F1), dur), 0.8);
        v.soundButton('Listen', (snd) => snd.samples(pluck(h.x), SR, { gain: 0.55 }));
        v.soundButton('at 1/2, 1/3, 1/4, 1/5', (snd) => snd.samples(join([2, 3, 4, 5].map((q) => pluck(1 / q, 0.9)), 0.12), SR, { gain: 0.55 }));
        v.soundButton('near the bridge, then the middle', (snd) => snd.samples(join([pluck(0.04, 1.2), pluck(0.5, 1.2)], 0.2), SR, { gain: 0.55 }));
        const missing = (p) => M.range(NH, 1).filter((n) => Math.abs(Math.sin(n * Math.PI * p)) < 1e-9);
        v.render(() => {
          const p = h.x, fr = fracOf(FR, p), miss = missing(p);
          // ---- string
          s.hline(0, { color: 'faint', width: 1, dash: [3, 4] });
          for (const [f, k, q] of FR) if (q <= 5) {
            s.line(f, -0.05, f, 0.05, { color: 'muted', width: 1 });
            s.text(`${k}/${q}`, f, -0.13, { align: 'center', color: fr && fr[0] === f ? 'gold' : 'muted', size: 10.5, weight: fr && fr[0] === f ? 700 : 500 });
          }
          s.path([[0, 0], [p, H], [1, 0]], { color: 'accent', width: 3.2 });
          s.line(p, 0, p, H, { color: 'gold', width: 1, dash: [3, 3] });
          posts(s, 1, 0, 0.16);
          if (miss.length) {
            const n = miss[0], y0 = -0.55;
            s.hline(y0, { color: 'faint', width: 1 });
            s.fn((x) => y0 + 0.2 * Math.sin(n * Math.PI * x), { domain: [0, 1], n: 300, color: 'red', width: 1.8, dash: [6, 4] });
            s.dot(p, y0, { r: 5, color: 'red' });
            s.text(`harmonic ${n} has a node at the pluck: it is not excited`, 0.99, -0.27, { align: 'right', color: 'red', size: 11.5 });
          } else s.text('no harmonic up to 24 has a node at this point', 0.99, -0.62, { align: 'right', color: 'muted', size: 11.5 });
          s.corner(`p = ${v.fix(p, 3)} L${fr ? ` = ${fr[1]}/${fr[2]} L` : ''}`, 'tl', { color: 'gold', weight: 700 });
          // ---- spectrum
          const force = view.value === 'force', b = triCoeffs(p, H, NH), a = b.map((bn, i) => (force ? (i + 1) * bn : bn));
          const amax = Math.max(...Array.from(a, Math.abs)), bound = (n) => (force ? 1 / n : 1 / (n * n));
          const kb = (2 * H) / (Math.PI * Math.PI * p * (1 - p)); // |a_n| = kb·|sin|·bound(n)
          const dB = (x) => 20 * Math.log10(Math.max(1e-12, x / amax));
          sp.hline(-61, { color: 'muted', width: 1 });
          sp.fn((n) => dB(kb * bound(n)), { domain: [1, NH], color: 'muted', width: 1.4, dash: [6, 4] });
          sp.clip(() => sp.fn((n) => dB(kb * bound(n) * Math.abs(Math.sin(n * Math.PI * p))), { domain: [0.5, NH + 0.5], n: 1200, color: 'orange', width: 1.4 }), [0, NH + 0.7], [-61, 7]);
          for (let n = 1; n <= NH; n++) {
            const L = dB(Math.abs(a[n - 1]));
            if (miss.includes(n)) { sp.text('×', n, -57, { align: 'center', color: 'red', size: 18, weight: 700 }); continue; }
            if (L > -61) sp.rect(n - 0.3, -61, n + 0.3, L, { fill: 'accent', fillAlpha: 0.65, stroke: false });
          }
          sp.corner(force ? 'bridge force: bound 1/n' : 'displacement: bound 1/n²', 'tr', { color: 'muted' });
        });
        v.legend([['accent', 'harmonic levels'], ['orange', 'comb: bound × |sin(nπp/L)|'], ['muted', 'bound (pluck at the very end)', { dash: true }], ['red', 'missing harmonics', { dot: true }]]);
        v.readout(() => {
          const p = h.x, fr = fracOf(FR, p), miss = missing(p), parts = bridgeParts(triCoeffs(p, 1, 40), F1), c = centroid(parts);
          const lv = (n) => 20 * Math.log10(Math.abs(parts[n - 1].a / parts[0].a) + 1e-12);
          const missTxt = miss.length ? `missing harmonics: ${miss.join(', ')}${fr ? ` (every multiple of ${fr[2]})` : ''}` : 'every harmonic up to 24 is present';
          return `pluck at $p$ = ${v.fix(p, 3)} $L$${fr ? ` = ${fr[1]}/${fr[2]} $L$` : ''} · ${missTxt} · bridge force on the G string: harmonic 2 at ${miss.includes(2) ? '−∞' : v.fix(lv(2), 1)} dB, harmonic 5 at ${miss.includes(5) ? '−∞' : v.fix(lv(5), 1)} dB relative to the fundamental · brightness (spectral centroid) ${v.fix(c, 0)} Hz = ${v.fix(c / F1, 2)} $f_1$`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Phenomenon',
      name: 'Touching a node: flageolet harmonics',
      statement: String.raw`If a finger rests **lightly** on a sounding string at a point $x_f$, every mode that moves at $x_f$ loses its energy within a few hundredths of a second, while the modes with a node at $x_f$ are hardly disturbed. When $x_f/L=k/q$ in lowest terms the survivors are exactly the harmonics $q,2q,3q,\dots$, a complete harmonic series on the fundamental $qf_1$: the string sounds a **flageolet (natural harmonic)** $q$ times higher than the open string, an octave at $L/2$, an octave and a fifth (a twelfth) at $L/3$ or $2L/3$, two octaves at $L/4$. Touching a point that is not a simple fraction leaves no low harmonic alive and gives only a muffled thud. Pressing the string down to the fingerboard instead shortens it (Mersenne's first law, 2.5).`,
      idea: String.raw`A light touch adds damping at one point: it hardly holds the string in place but absorbs energy at a rate proportional to the square of the string's velocity there. Mode $n$ moves at $x_f$ with relative amplitude $\sin(n\pi x_f/L)$, so its extra decay rate is roughly proportional to $\sin^2(n\pi x_f/L)$ (each mode is treated separately, as in 2.3). Modes whose node falls under the finger (2.3) pass by untouched, and the survivors $q,2q,\dots$ have frequencies $qf_1,2qf_1,\dots$: the harmonic series of a string a $q$-th as long, which is what the ear hears.`,
      caption: String.raw`The string is plucked near the end; drag the orange finger along it (it clicks onto simple fractions). After the pluck the finger lands, and the panel below plots the level of each harmonic over time: the rows without a node under the finger fade within a fraction of a second, the others ring on (deeper colour = louder, from −60 dB to 0 dB). *Pluck, then touch* lets you hear the open string turn into the harmonic; switch the finger off for comparison. In the top panel the motion is slowed down, not to scale.`,
      deps: ['music-2.3', 'music-2.7'],
      refs: ['Loy I ch. 8'],
      tags: ['harmonics', 'string'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/String_harmonic' },
      viz(v) {
        const M = v.M, NM = 32, P0 = 0.137, TT = 0.3, DUR = 1.6, KAP = 120, NS = 16, FR = fractions(M, 8);
        const on = v.toggle('finger on the string', true);
        const s = v.stage({ x: [-0.04, 1.04], y: [-0.95, 1.2], height: 230, axes: false, full: true });
        const sg = v.stage({ x: [-0.13, DUR + 0.09], y: [-1.2, NS + 1.9], height: 250, axes: 'box', xlabel: 'time after the pluck (s)', ylabel: 'harmonic n', yticks: [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16], full: true, title: 'level of each harmonic of the bridge force over time (dB)' });
        const fh = s.handle(1 / 3, 1.0, { color: 'orange', label: 'finger', labelPos: 'e', constrain: (x) => [snapTo(FR, M.clamp(x, 0.03, 0.97), 0.005), 1.0] });
        const b = triCoeffs(P0, 1, NM), a = b.map((bn, i) => (i + 1) * bn), amax = Math.max(...Array.from(a, Math.abs));
        const extra = () => M.range(NM, 1).map((n) => (on.value ? KAP * Math.sin(n * Math.PI * fh.x) ** 2 : 0));
        const env = (n, t, ex) => Math.exp(-decayOf(n * F1) * t - ex[n - 1] * Math.max(0, t - TT));
        const ph = playhead(v);
        const parts = () => M.range(NM, 1).map((n) => ({ f: n * F1, a: a[n - 1], d: decayOf(n * F1) }));
        v.soundButton('Pluck, then touch', (snd) => { snd.samples(finish(synth(parts(), DUR, { touchAt: TT, extra: extra() }), 0.8), SR, { gain: 0.6 }); ph.start(DUR); });
        v.soundButton('open string', (snd) => { snd.samples(finish(synth(parts(), DUR), 0.8), SR, { gain: 0.6 }); ph.start(DUR); });
        const survivors = (ex) => M.range(NS, 1).filter((n) => ex[n - 1] < 3);
        v.animate((t) => {
          const ex = extra(), tr = ph.t != null ? Math.min(DUR, ph.t) : M.mod(0.22 * t, DUR), xf = fh.x;
          // displacement: every mode keeps its own (real) decay; the oscillation itself is slowed down
          const yAt = (x) => { let y = 0; for (let n = 1; n <= NM; n++) y += b[n - 1] * env(n, tr, ex) * Math.sin(n * Math.PI * x) * Math.cos(TAU * 0.7 * n * t); return y; };
          const sc = 0.8;
          s.hline(0, { color: 'faint', width: 1, dash: [3, 4] });
          s.fn((x) => sc * yAt(x), { domain: [0, 1], n: 300, color: 'accent', width: 2.8 });
          posts(s, 1, 0, 0.15);
          for (const [f, k, q] of FR) if (q <= 5) { s.line(f, -0.05, f, 0.05, { color: 'muted', width: 1 }); s.text(`${k}/${q}`, f, -0.14, { align: 'center', color: 'muted', size: 10.5 }); }
          const touching = on.value && tr >= TT, ys = sc * yAt(xf);
          const tipY = touching ? ys + 0.09 : 0.5;
          s.line(xf, 1.0, xf, tipY + 0.06, { color: 'orange', width: 12, alpha: 0.35 });
          s.dot(xf, tipY, { r: 9, color: 'orange', alpha: touching ? 0.95 : 0.5 });
          if (!touching && on.value) s.line(xf, tipY - 0.05, xf, ys, { color: 'orange', width: 1, dash: [2, 3] });
          s.text('pluck', P0, -0.3, { align: 'center', color: 'muted', size: 10.5 });
          s.line(P0, -0.24, P0, -0.06, { color: 'muted', width: 1 });
          s.corner(`t = ${v.fix(tr, 2)} s${tr < TT ? ' (open string)' : on.value ? ' (finger down)' : ''}`, 'tl', { color: 'ink', weight: 600 });
          const fr = fracOf(FR, xf);
          s.corner(`finger at ${v.fix(xf, 3)} L${fr ? ` = ${fr[1]}/${fr[2]} L` : ''}`, 'tr', { color: 'orange', weight: 700 });
          // ---- spectrogram (quiet = panel colour, loud = accent: readable in both themes)
          const lo = v.rgb('panel'), hi = v.rgb('accent');
          sg.raster((x, y) => {
            const n = Math.round(y); if (n < 1 || n > NS || x < 0 || x > DUR) return null;
            const L = 20 * Math.log10(Math.abs(a[n - 1]) / amax * env(n, x, ex) + 1e-9);
            const u = Math.pow(M.clamp((L + 60) / 60, 0, 1), 0.8);
            return [0, 1, 2].map((i) => lo[i] + (hi[i] - lo[i]) * u);
          }, { key: `${xf}|${on.value}|${lo.join()}`, res: 2 });
          sg.axes();
          if (on.value) { sg.line(TT, 0.5, TT, NS + 0.5, { color: 'orange', width: 1.6, dash: [5, 4] }); sg.text('finger lands', TT, NS + 1.15, { align: 'center', color: 'orange', size: 11, weight: 600 }); }
          sg.line(tr, 0.5, tr, NS + 0.5, { color: 'gold', width: 2.4 });
          survivors(ex).forEach((n) => sg.text('◂', DUR + 0.01, n, { align: 'left', color: 'green', size: 13 }));
        }, { still: 0.9 / 0.22 });
        v.legend([['accent', 'the string (slow motion)'], ['orange', 'the finger'], ['green', 'harmonics with a node under the finger', { dot: true }]]);
        v.readout(() => {
          const ex = extra(), xf = fh.x, fr = fracOf(FR, xf), sv = survivors(ex);
          if (!on.value) return `finger lifted: every mode rings on and decays slowly, the higher ones faster (open string, ${F1} Hz, ${noteOf(v.M, F1)})`;
          if (!sv.length) return `finger at ${v.fix(xf, 3)} $L$: no harmonic up to ${NS} has a node there, so every one is damped (extra decay rates ${v.fix(Math.min(...ex.slice(0, NS)), 0)}–${v.fix(Math.max(...ex.slice(0, NS)), 0)} per second): a muffled thud`;
          const q = sv[0], f = q * F1;
          return `finger at ${v.fix(xf, 3)} $L$${fr ? ` = ${fr[1]}/${fr[2]} $L$` : ''}: harmonics ${sv.join(', ')} survive (no node, no damping), all others die within ${v.fix(1000 * Math.log(1000) / Math.max(1, Math.min(...ex.filter((e) => e >= 3))), 0)} ms · you hear ${q} × ${F1} Hz = ${v.fix(f, 0)} Hz (${noteOf(v.M, f)}), ${INTERVAL[q] || `${q} times the open string`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Model',
      name: 'The bowed string: Helmholtz motion',
      statement: String.raw`A bow drawn steadily across a string makes it vibrate in **Helmholtz motion**: the string consists at every instant of two straight segments joined at a single corner, which travels round the string at the wave speed $c$, once per period $2L/c$, along the two parabolic arcs $y=\pm\frac{v_b}{\beta Lc}\,x(L-x)$ (about the midline of its swing, which the bow pushes aside). Here $v_b$ is the bow speed and $\beta L$ the distance from bow to bridge. While the corner is on the far side the string **sticks** to the bow and moves with it at $v_b$, for a fraction $1-\beta$ of each period; when the corner passes the bow it **slips** back quickly, for the remaining fraction $\beta$. The force on the bridge is a sawtooth, so all harmonics are present with amplitudes $\propto1/n$.

Helmholtz motion needs the bow force $F_N$ to lie in a window that narrows as the bow moves away from the bridge (Schelleng): too much force and the string cannot release cleanly (raucous, scratchy sound), too little and it slips more than once per period (a "surface" or whistling sound).`,
      idea: String.raw`Any motion of an ideal string is a pair of travelling waves (2.2), so a single corner circulating at speed $c$ is an allowed free motion; it is the one whose displacement at the bow point rises at the constant speed $v_b$ and then falls back. Friction is high when the string is stuck and lower once it slides, so the bow can hold the string during the slow part and let it go when the corner arrives to trigger release, and the corner's return triggers the recapture. Schelleng's bounds follow from requiring the static friction to hold against the corner's tug, $F_N\lesssim\frac{2Zv_b}{\beta(\mu_s-\mu_d)}$, and the losses at the bridge not to trigger extra slips, $F_N\gtrsim\frac{Z^2v_b}{2R\beta^2(\mu_s-\mu_d)}$, where $Z=\sqrt{T\mu}$ is the string's impedance and $R$ the bridge's resistance.`,
      caption: String.raw`This is a simulation, not an animation of the formula: a digital-waveguide string (2.2) on a violin's open G (196 Hz), held by a bow through a stick–slip friction law. Top: one period in slow motion: the simulated string (blue), the corner (gold), the envelope it sweeps (shaded) and Helmholtz's predicted parabolas (green dashes). Middle: the string's velocity at the bow (stick = flat at the bow speed, shaded green) and the force on the bridge. Bottom right: Schelleng's diagram (his two bounds, with the bridge resistance taken from the simulated bridge's losses); drag the point to change bow force and bow position and leave the Helmholtz window, and watch the readout classify what the simulated string does. *Listen* plays 1.4 s of the simulated bridge force.`,
      deps: ['music-2.2'],
      see: ['music-2.7', 'music-2.6'],
      refs: ['Benson ch. 3'],
      tags: ['bowing', 'string'],
      credit: 'Hermann von Helmholtz, 1863; Raman, 1918; Schelleng, 1973; McIntyre, Schumacher & Woodhouse, 1983',
      scope: String.raw`The ideal Helmholtz motion assumes a perfectly flexible string, a point bow and a rigid bridge. Real strings round the corner (losses and stiffness) and show small ripples; the bow has width and the bow hair is elastic; the bounds on bow force are estimates, and the simulated window is narrower at the bottom than Schelleng's formula.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bowed_string_instrument' },
      viz(v) {
        const M = v.M, L = 0.325, MU = 2.7e-3, C = 2 * L * F1, Z = MU * C, G = 0.99, LP = 0.6, DMU = 0.5;
        // Schelleng's R: the simulated bridge's loss near the 10th harmonic, where the secondary waves that cause extra slips live
        const w10 = (TAU * 10 * F1) / SR, H10 = (1 - LP) / Math.hypot(1 - LP * Math.cos(w10), LP * Math.sin(w10)), R = (2 * Z) / (1 - G * H10);
        const vbS = v.slider('bow speed $v_b$', 0.05, 0.5, 0.1, { log: true, fmt: (x) => v.fix(x * 100, 1) + ' cm/s' });
        const s = v.stage({ x: [-0.03, 1.03], y: [-1.2, 1.2], height: 235, axes: false, full: true });
        const tr = v.stage({ x: [0, 2], y: [-1.95, 2.2], height: 250, axes: 'box', xlabel: 'time (periods)', yticks: [], weight: 1.15, title: 'at the bow, and at the bridge' });
        const sch = v.stage({ x: [0.025, 0.3], y: [0.004, 12], xlog: true, ylog: true, height: 250, axes: 'box', xlabel: 'β = bow–bridge distance / L', ylabel: 'bow force (N)', weight: 1, title: 'Schelleng diagram (drag the point)' });
        const hd = sch.handle(0.1, 0.5, { color: 'gold', r: 8, constrain: (x, y) => [M.clamp(x, 0.03, 0.28), M.clamp(y, 0.005, 10)] });
        const Fmax = (b, vb) => (2 * Z * vb) / (b * DMU), Fmin = (b, vb) => (Z * Z * vb) / (2 * R * b * b * DMU);
        let key = '', S = null;
        const classify = (Rr) => {
          const P = 2 * Rr.N, n = Rr.vbow.length, per = 20, s0 = n - per * P;
          let slips = 0, st = 0;
          for (let k = s0 + 1; k < n; k++) { if (Rr.stick[k - 1] && !Rr.stick[k]) slips++; st += Rr.stick[k]; }
          let best = Infinity;
          for (let lag = P - 4; lag <= P + 4; lag++) { let d = 0, e = 0; for (let k = n - P; k < n; k++) { const x = Rr.vbow[k], y = Rr.vbow[k - lag]; d += (x - y) ** 2; e += x * x; } best = Math.min(best, Math.sqrt(d / (e || 1))); }
          const sp = slips / per, sf = st / (per * P);
          let kind, col;
          if (sf < 0.01) { kind = 'no sticking: the bow just slides over the string (a faint, breathy sound)'; col = 'orange'; }
          else if (best > 0.25) { kind = 'raucous: the stick–slip is irregular, a scratchy sound'; col = 'red'; }
          else if (Math.round(sp) === 1) { kind = 'Helmholtz motion: one stick and one slip per period'; col = 'green'; }
          else { kind = `${Math.round(sp)} slips per period: a "surface" sound, the pitch jumps up or the tone whistles`; col = 'orange'; }
          return { sp, sf, aper: best, kind, col };
        };
        const run = () => {
          const k = [hd.x, hd.y, vbS.value].join(); if (k === key) return S; key = k;
          const Rr = bowSim({ f1: F1, beta: hd.x, FN: hd.y, vb: vbS.value, Z, dur: 0.4, rec: 2, g: G, lp: LP });
          const cl = classify(Rr), N = Rr.N, snaps = Rr.snaps, mean = new Float64Array(N + 1), lo = new Float64Array(N + 1).fill(Infinity), hi = new Float64Array(N + 1).fill(-Infinity);
          for (const y of snaps) for (let i = 0; i <= N; i++) { mean[i] += y[i] / snaps.length; lo[i] = Math.min(lo[i], y[i]); hi[i] = Math.max(hi[i], y[i]); }
          let ymax = 1e-9; for (let i = 0; i <= N; i++) ymax = Math.max(ymax, Math.abs(lo[i]), Math.abs(hi[i]));
          const Kp = (vbS.value * L) / (hd.x * C); // Helmholtz half-width coefficient in metres for x̂(1 − x̂)
          ymax = Math.max(ymax, ...Array.from(mean, (m, i) => Math.abs((hi[i] + lo[i]) / 2) + Kp * (i / N) * (1 - i / N)));
          const P = 2 * N, n = Rr.vbow.length, seg = (arr) => Array.from(arr.subarray(n - 2 * P, n));
          S = { Rr, cl, N, mean, lo, hi, ymax, Kp, vb: seg(Rr.vbow), st: seg(Rr.stick), fb: seg(Rr.out) };
          return S;
        };
        v.soundButton('Listen', (snd) => {
          const Rr = bowSim({ f1: F1, beta: hd.x, FN: hd.y, vb: vbS.value, Z, dur: 1.4, g: G, lp: LP });
          snd.samples(finish(Rr.out, 0.8, SR, 0.01, 0.08), SR, { gain: 0.5 });
        });
        v.animate((t) => {
          const R0 = run(), { N, mean, lo, hi, ymax, Kp, cl } = R0, vb = vbS.value, sc = 1 / (1.12 * ymax), P = 2 * N;
          // ---- Schelleng diagram
          const top = 12, bot = 0.004;
          sch.between((b) => top, (b) => Math.min(top, Fmax(b, vb)), 0.025, 0.3, { fill: 'red', fillAlpha: 0.13 });
          sch.between((b) => Math.max(bot, Fmin(b, vb)), (b) => bot, 0.025, 0.3, { fill: 'orange', fillAlpha: 0.15 });
          sch.between((b) => Math.min(top, Fmax(b, vb)), (b) => Math.max(bot, Fmin(b, vb)), 0.025, 0.3, { fill: 'green', fillAlpha: 0.1 });
          sch.fn((b) => Fmax(b, vb), { domain: [0.025, 0.3], color: 'red', width: 1.6 });
          sch.fn((b) => Fmin(b, vb), { domain: [0.025, 0.3], color: 'orange', width: 1.6 });
          sch.text('raucous', 0.2, 6, { align: 'center', color: 'red', size: 12, weight: 600 });
          sch.text('Helmholtz', 0.16, Math.sqrt(Fmax(0.16, vb) * Fmin(0.16, vb)), { align: 'center', color: 'green', size: 12, weight: 600 });
          sch.text('multiple slips', 0.06, 0.012, { align: 'center', color: 'orange', size: 12, weight: 600 });
          sch.dot(hd.x, hd.y, { r: 13, color: cl.col, alpha: 0.35 });
          // ---- the string over one period, in slow motion
          const fr = Math.floor(M.mod(t * (P / 2.4), P)), y = R0.Rr.snaps[fr], X = (i) => i / N;
          s.hline(0, { color: 'faint', width: 1, dash: [3, 4] });
          s.poly([...M.range(N + 1).map((i) => [X(i), hi[i] * sc]), ...M.range(N + 1).map((i) => [X(N - i), lo[N - i] * sc])], { fill: 'accent', fillAlpha: 0.1, stroke: false });
          for (const sg of [1, -1]) s.fn((x) => ((hi[Math.round(x * N)] + lo[Math.round(x * N)]) / 2 + sg * Kp * x * (1 - x)) * sc, { domain: [0, 1], n: N, color: 'green', width: 1.6, dash: [6, 4] });
          s.path(M.range(N + 1).map((i) => [X(i), y[i] * sc]), { color: 'accent', width: 2.8 });
          let ic = 1, cm = 0; for (let i = 3; i < N - 2; i++) { if (Math.abs(i - R0.Rr.ib) <= 3) continue; const c2 = Math.abs(y[i + 1] - 2 * y[i] + y[i - 1]); if (c2 > cm) { cm = c2; ic = i; } } // the moving corner (the bow point's own kink is excluded)
          s.dot(X(ic), y[ic] * sc, { r: 6, color: 'gold' });
          const xb = R0.Rr.ib / N, yb = y[R0.Rr.ib] * sc;
          s.rect(xb - 0.008, -1.15, xb + 0.008, 1.15, { fill: 'orange', fillAlpha: 0.25, stroke: false });
          s.arrow(xb + 0.035, -0.55, xb + 0.035, -0.15, { color: 'orange', width: 2, head: 7 });
          s.text('bow', xb + 0.05, -0.75, { align: 'left', color: 'orange', size: 11.5, weight: 600 });
          s.dot(xb, yb, { r: 4, color: R0.st[fr % R0.st.length] ? 'green' : 'red' });
          s.text('nut', 0, -1.05, { align: 'center', color: 'muted', size: 11 }); s.text('bridge', 1, -1.05, { align: 'center', color: 'muted', size: 11 });
          s.line(0, -0.06, 0, 0.06, { color: 'muted', width: 4 }); s.line(1, -0.06, 1, 0.06, { color: 'muted', width: 4 });
          s.corner(`displacement magnified: full height ${v.fix(ymax * 1e3, 2)} mm · slowed ×${Math.round(F1 * 2.4)}`, 'tl', { color: 'muted' });
          s.corner(cl.kind.split(':')[0], 'tr', { color: cl.col, weight: 700 });
          // ---- traces over two periods
          const vbs = R0.vb, fb = R0.fb, nT = vbs.length;
          let vmin = Infinity, vmax = -Infinity, fm = 1e-12; for (let k = 0; k < nT; k++) { vmin = Math.min(vmin, vbs[k]); vmax = Math.max(vmax, vbs[k]); fm = Math.max(fm, Math.abs(fb[k])); }
          const vs = (x) => 0.6 + (1.4 * (x - vmin)) / (vmax - vmin || 1);
          for (let k = 0; k < nT; k++) if (R0.st[k]) tr.rect(k / P, 0.5, (k + 1) / P, 2.1, { fill: 'green', fillAlpha: 0.12, stroke: false });
          tr.line(0, vs(vb), 2, vs(vb), { color: 'green', width: 1.2, dash: [5, 4] });
          tr.path(vbs.map((x, k) => [k / P, vs(x)]), { color: 'accent', width: 2 });
          tr.path(Array.from(fb, (x, k) => [k / P, -0.75 + (0.8 * x) / fm]), { color: 'orange', width: 2 });
          tr.text('velocity at the bow', 0.02, 2.05, { align: 'left', color: 'accent', size: 11.5, weight: 600 });
          tr.text('bow speed', 1.98, vs(vb) + 0.12, { align: 'right', color: 'green', size: 10.5 });
          tr.text('force on the bridge', 0.02, 0.32, { align: 'left', color: 'orange', size: 11.5, weight: 600 });
          tr.vline((fr % P) / P, { color: 'gold', width: 1.5 });
          tr.vline((fr % P) / P + 1, { color: 'gold', width: 1.5, alpha: 0.4 });
        }, { still: 0.7 });
        v.legend([['accent', 'simulated string'], ['gold', 'the corner', { dot: true }], ['green', 'Helmholtz’s parabolas; sticking', { dash: true }], ['orange', 'bow; force on the bridge']]);
        v.readout(() => {
          const R0 = run(), { cl } = R0, b = hd.x, F = hd.y, vb = vbS.value;
          const hw = (R0.hi[R0.N >> 1] - R0.lo[R0.N >> 1]) / 2 * 1e3, hp = (R0.Kp / 4) * 1e3;
          return `bow at β = ${v.fix(b, 3)} (${v.fix(b * L * 100, 1)} cm from the bridge), force ${v.fmt(F, 3)} N, speed ${v.fix(vb * 100, 1)} cm/s · envelope half-width at mid-string: simulated ${v.fix(hw, 3)} mm, Helmholtz $\\frac{v_bL}{4\\beta c}$ = ${v.fix(hp, 3)} mm · Schelleng's window here: ${v.fmt(Fmin(b, vb), 2)}–${v.fmt(Fmax(b, vb), 3)} N · simulated: ${cl.kind}; ${v.fix(cl.sp, 2)} slips per period, stuck ${v.fix(100 * cl.sf, 1)}% of the time (Helmholtz predicts $1-\\beta$ = ${v.fix(100 * (1 - b), 1)}%) · string: $L$ = 32.5 cm, $\\mu$ = 2.7 g/m, $Z=\\sqrt{T\\mu}$ = ${v.fix(Z, 3)} kg/s`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Phenomenon',
      name: 'Inharmonicity of stiff strings',
      statement: String.raw`A real string resists bending as well as stretching. For a uniform wire of Young's modulus $E$ and diameter $d$, pinned at both ends, the modes are still $\sin(n\pi x/L)$ but their frequencies are
$$f_n=n\,f_0\sqrt{1+Bn^2},\qquad B=\frac{\pi^3Ed^4}{64\,TL^2},$$
where $f_0=\frac1{2L}\sqrt{T/\mu}$ is the frequency of the same string without stiffness. The partials are **sharp of the harmonic series**, by about $866\,B\,n^2$ cents for small $Bn^2$ (relative to $nf_0$), increasingly so up the series. $B$ is largest for short, thick, slack strings: about $10^{-4}$ in a piano's bass and tenor, $4\times10^{-4}$ near middle C, a few times $10^{-3}$ around C7 and up to about $10^{-2}$ at the top. Stiff strings are therefore not periodic oscillators, and two partials that should coincide beat.`,
      idea: String.raw`Bending stiffness adds a restoring force $-EI\,\partial^4y/\partial x^4$, with $I=\pi d^4/64$, to the string's $T\,\partial^2y/\partial x^2$ (2.1). For a sine of wavenumber $k$ the restoring force per unit length becomes $(Tk^2+EIk^4)y$, so $\omega^2=(T/\mu)k^2(1+EIk^2/T)$. With $k=n\pi/L$ (2.4) this is the formula above: short wavelengths feel the stiffness most, so waves on a stiff string are **dispersive** (high partials travel faster) and the mode frequencies spread apart. With clamped rather than pinned ends the partials are raised a little more, but the $n^2$ law is the same.`,
      caption: String.raw`Choose a piano string or set $B$ directly. Top: the partials (blue) drifting right of the harmonic grid (grey), positions relative to the first partial. Left: their deviation in cents, against the harmonic series built on the first partial. Right: one stretch of the tone's waveform for an ideal and a stiff string: the stiff one changes shape from cycle to cycle, because its partials are not whole multiples. *Both together* plays the stiff tone against a perfectly harmonic one with the same fundamental, so that the mismatched partials beat.`,
      deps: ['music-2.4'],
      see: ['pde-2.9', 'music-2.12'],
      refs: ['Rossing ch. 14', 'Sethares ch. 6'],
      tags: ['inharmonicity', 'piano'],
      credit: 'Shankland & Coltman, 1939; Harvey Fletcher, 1964',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Inharmonicity' },
      viz(v) {
        const M = v.M, NP = 16, E = 2.0e11;
        const Bof = (d, L, T) => (Math.PI ** 3 * E * (d * 1e-3) ** 4) / (64 * T * L * L);
        const PRE = {
          ideal: { label: 'ideal', f: 261.63, d: 0 },
          bass: { label: 'bass A0', f: 27.5, d: 1.6, L: 1.6, T: 1300, note: 'wound: the wrap adds mass, not stiffness' },
          mid: { label: 'middle C', f: 261.63, d: 1.0, L: 0.62, T: 650 },
          treb: { label: 'treble C7', f: 2093, d: 0.8, L: 0.11, T: 840 },
        };
        let B = Bof(1.0, 0.62, 650);
        const pre = v.select('string', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'mid', { onChange: (k) => { if (PRE[k].d) { B = Bof(PRE[k].d, PRE[k].L, PRE[k].T); bS.set(B); } } });
        const bS = v.slider('inharmonicity $B$', 1e-5, 0.03, B, { log: true, fmt: (x) => v.sci(x, 2).replace('\\times', '×').replace(/10\^\{(-?\d+)\}/, (m0, e) => '10' + e.split('').map((ch) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(ch)] || (ch === '-' ? '⁻' : ch)).join('')), onChange: (x) => { B = x; } });
        const Bnow = () => (pre.value === 'ideal' ? 0 : bS.value);
        const f1 = () => PRE[pre.value].f;
        const rel = (n) => (n * Math.sqrt(1 + Bnow() * n * n)) / Math.sqrt(1 + Bnow()); // f_n / f_1
        const cents = (n) => 1200 * Math.log2(rel(n) / n);
        const nP = () => Math.min(60, Math.floor(9000 / f1()));
        const tone = (stiffOn, dur = 2.2) => {
          const parts = M.range(nP(), 1).map((n) => { const f = f1() * (stiffOn ? rel(n) : n); return { f, a: Math.pow(n, -1.1), d: decayOf(f) }; });
          return synth(parts, dur);
        };
        v.soundButton('stiff string', (snd) => snd.samples(finish(tone(true), 0.8), SR, { gain: 0.55 }));
        v.soundButton('ideal string', (snd) => snd.samples(finish(tone(false), 0.8), SR, { gain: 0.55 }));
        v.soundButton('both together', (snd) => { const a = tone(true, 3.5), b = tone(false, 3.5); for (let i = 0; i < a.length; i++) a[i] += b[i]; snd.samples(finish(a, 0.85), SR, { gain: 0.55 }); });
        const top = v.stage({ x: [0.4, NP + 1.6], y: [-0.25, 1.25], height: 185, axes: 'box', yticks: [], xticks: M.range(NP, 1), xlabel: 'frequency / first partial', full: true, title: 'partials against the harmonic grid' });
        const cp = v.stage({ x: [0.5, NP + 0.5], y: [-5, 120], height: 235, axes: 'box', xlabel: 'partial n', ylabel: '¢ sharp', xticks: [1, 2, 4, 6, 8, 10, 12, 14, 16], weight: 1, title: 'deviation from n × first partial' });
        const wf = v.stage({ x: [0, 6], y: [-2.6, 2.6], height: 235, axes: 'box', xlabel: 'time (periods of the first partial)', yticks: [], weight: 1, title: 'waveforms' });
        v.render(() => {
          const Bv = Bnow(), F = f1();
          bS.el.hidden = pre.value === 'ideal';
          // ---- partials against the grid
          for (let n = 1; n <= NP; n++) top.line(n, -0.2, n, 1.1, { color: 'faint', width: 1, dash: [3, 3] });
          for (let n = 1; n <= NP; n++) {
            const x = rel(n), audible = F * x < 20000, hgt = 0.35 + 0.6 / Math.sqrt(n);
            if (x > NP + 1.55) continue;
            top.line(x, 0, x, hgt, { color: audible ? 'accent' : 'faint', width: 2.6 });
            top.text(String(n), x, hgt + 0.09, { align: 'center', color: audible ? 'ink' : 'faint', size: 11 });
            if (x - n > 0.06) top.arrow(n, 0.12, x, 0.12, { color: 'orange', width: 1.4, head: 5 });
          }
          if (F * rel(NP) > 20000) top.corner('pale partials lie above 20 kHz', 'tr', { color: 'muted' });
          // ---- cents
          const cmax = Math.max(20, cents(NP) * 1.15);
          cp.setView(null, [-0.05 * cmax, cmax]);
          cp.hband(-5, 5, { color: 'green', alpha: 0.12 });
          cp.text('±5 ¢', 10, 6 + 0.06 * cmax, { align: 'center', color: 'green', size: 10.5 });
          cp.fn((n) => 1200 * Math.log2(Math.sqrt(1 + Bv * n * n) / Math.sqrt(1 + Bv)), { domain: [1, NP], color: 'accent', width: 1.6, alpha: 0.6 });
          for (let n = 1; n <= NP; n++) cp.dot(n, cents(n), { r: 4.5, color: 'accent' });
          // ---- waveforms
          const w = (stiffOn) => (t) => { let y = 0; for (let n = 1; n <= NP; n++) y += Math.cos(TAU * t * (stiffOn ? rel(n) : n)) / Math.pow(n, 1.1); return y; };
          let norm = 0; for (let n = 1; n <= NP; n++) norm += Math.pow(n, -1.1);
          const wi = w(false), ws = w(true);
          wf.fn((t) => 1.3 + (0.95 * wi(t)) / norm, { domain: [0, 6], n: 900, color: 'muted', width: 1.4 });
          wf.fn((t) => -1.3 + (0.95 * ws(t)) / norm, { domain: [0, 6], n: 900, color: 'accent', width: 1.6 });
          for (let k = 0; k <= 6; k++) wf.vline(k, { color: 'faint', width: 1, dash: [2, 4] });
          wf.text('ideal: repeats every period', 0.05, 2.45, { align: 'left', color: 'muted', size: 11 });
          wf.text('stiff: the shape drifts', 0.05, -0.25, { align: 'left', color: 'accent', size: 11 });
        });
        v.legend([['accent', 'stiff-string partials'], ['faint', 'harmonic grid', { dash: true }], ['orange', 'shift from the grid']]);
        v.readout(() => {
          const Bv = Bnow(), F = f1(), P = PRE[pre.value];
          const phys = P.d && Math.abs(Bv / Bof(P.d, P.L, P.T) - 1) < 1e-6 ? ` from $B=\\pi^3Ed^4/64TL^2$ with $d$ = ${P.d} mm, $L$ = ${P.L} m, $T$ = ${P.T} N, $E$ = 200 GPa${P.note ? ` (${P.note})` : ''}` : '';
          if (!Bv) return `ideal string: partials exactly at $n f_1$, deviation 0 ¢ for every $n$, and the waveform repeats exactly · ${F} Hz`;
          const beat = (n) => v.fix(F * (rel(n) - n), 2);
          return `$B$ = $${v.sci(Bv, 2)}$${phys} · partial 2 is ${v.fix(cents(2), 2)} ¢ sharp of the octave, partial 4 ${v.fix(cents(4), 1)} ¢, partial 8 ${v.fix(cents(8), 1)} ¢, partial 16 ${v.fix(cents(16), 0)} ¢ · against a harmonic tone on the same ${v.fix(F, 2)} Hz fundamental, partials 2, 4 and 8 are off by ${beat(2)}, ${beat(4)} and ${beat(8)} Hz (heard as beats when slow, as roughness when fast)`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Phenomenon',
      name: 'Stretched tuning and the Railsback curve',
      statement: String.raw`Because piano strings are inharmonic (2.11), the second partial of every note is a few cents sharp of twice its fundamental. A tuner who makes each octave beatless, matching the upper note to a partial of the lower one, therefore tunes octaves slightly **wider than 2:1**, and the stretch accumulates from the middle of the keyboard outwards. Plotted against key number, the deviation of a well-tuned piano from equal temperament traces the **Railsback curve**: a gentle S, flat in the middle, falling to roughly 10–30 cents flat in the low bass and rising to some 20–40 cents sharp at the top. The size of the stretch depends on the instrument's inharmonicity (short pianos stretch more) and on which partials the tuner matches (2:1, 4:2, 6:3 octaves).`,
      idea: String.raw`If the lower note has first partial $f$ and inharmonicity $B$, its second partial is $2f\sqrt{(1+4B)/(1+B)}\approx2f(1+\tfrac32B)$, about $2600B$ cents above $2f$ (1.6). Making the octave beat-free puts the upper fundamental there, so each octave is stretched by that amount; tuning 4:2 octaves uses $\sqrt{(1+16B)/(1+4B)}$ instead and stretches more. In the treble $B$ grows quickly, so the stretch per octave grows and the curve bends up; in the bass, where the fundamentals are weak, tuners match higher partials of the low note, which pulls the bass flat. Without stretch the octaves beat audibly, at the rate given by the mismatch.`,
      caption: String.raw`A model piano whose inharmonicity rises from about $10^{-4}$ in the tenor to $3\times10^{-4}$ at A0, $3.5\times10^{-4}$ at middle C and $10^{-2}$ at C8 (typical measured sizes, as in 2.11). The middle octave is set first (A4 = 440 Hz, A3 an octave below it by the same rule, equal steps between) and every other note is tuned octave by octave from it, making the chosen partials coincide. Top: the resulting deviation from equal temperament (faint curves: the other octave types). Click a key to select an octave; the bottom panel shows how its partials line up and the readout gives the beat rates; *Hear this octave* plays it. Set **no stretch** or the inharmonicity to 0 to break the effect.`,
      deps: ['music-2.11', 'music-1.6'],
      refs: ['Rossing ch. 14', 'Sethares ch. 6'],
      tags: ['piano', 'tuning'],
      credit: 'O. L. Railsback, 1938',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stretched_tuning' },
      viz(v) {
        const M = v.M, PAIRS = { '21': [2, 1], '42': [4, 2], '63': [6, 3] };
        // octave types: which partials of the lower note (a) and the upper note (b) are made to coincide, above and below the middle octave
        const SCH = { mix: { up: [2, 1], dn: [6, 3], name: 'mixed octaves (6:3 in the bass, 2:1 in the treble)' }, '21': { up: [2, 1], dn: [2, 1], name: '2:1 octaves' }, '42': { up: [4, 2], dn: [4, 2], name: '4:2 octaves' }, '63': { up: [6, 3], dn: [6, 3], name: '6:3 octaves' } };
        const type = v.select('octaves tuned', [{ value: 'mix', label: 'mixed' }, { value: '21', label: '2:1' }, { value: '42', label: '4:2' }, { value: '63', label: '6:3' }, { value: 'none', label: 'no stretch' }], 'mix');
        const kS = v.slider('inharmonicity ×', 0, 3, 1, { step: 0.05, fmt: (x) => '×' + v.fix(x, 2) });
        const Bm = (m) => kS.value * (3e-4 * Math.pow(10, -(m - 21) / 22) + 1.4e-4 * Math.pow(10, (m - 48) / 32));
        const Pj = (f1, B, j) => ((j * f1) / Math.sqrt(1 + B)) * Math.sqrt(1 + B * j * j);
        const et = (m) => 440 * Math.pow(2, (m - 69) / 12);
        const tune = (ty) => {
          const f = new Map();
          for (let m = 21; m <= 108; m++) f.set(m, et(m));
          if (ty === 'none') return f;
          const { up: [a, b], dn: [c, d] } = SCH[ty];
          // temperament octave: A4 = 440 Hz, A3 tuned from it by the octave rule, the eleven notes between in equal steps
          { const B = Bm(57), X = Pj(440, Bm(69), d), f57 = (X * Math.sqrt(1 + B)) / (c * Math.sqrt(1 + B * c * c));
            for (let m = 57; m <= 69; m++) f.set(m, f57 * Math.pow(440 / f57, (m - 57) / 12)); }
          for (let m = 70; m <= 108; m++) { const lo = m - 12, X = Pj(f.get(lo), Bm(lo), a), B = Bm(m); f.set(m, (X * Math.sqrt(1 + B)) / (b * Math.sqrt(1 + B * b * b))); }
          for (let m = 56; m >= 21; m--) { const up = m + 12, X = Pj(f.get(up), Bm(up), d), B = Bm(m); f.set(m, (X * Math.sqrt(1 + B)) / (c * Math.sqrt(1 + B * c * c))); }
          return f;
        };
        let cKey = '', T = null;
        const all = () => {
          const k = kS.value; if (cKey === String(k)) return T; cKey = String(k);
          T = Object.fromEntries(['mix', '21', '42', '63', 'none'].map((ty) => [ty, tune(ty)]));
          return T;
        };
        const dev = (ty, m) => 1200 * Math.log2(all()[ty].get(m) / et(m));
        let sel = 93; // A6
        const note = (m, dur) => {
          const f = all()[type.value].get(m), B = Bm(m), NPn = Math.min(16, Math.floor(9000 / f));
          return synth(M.range(NPn, 1).map((j) => { const fj = Pj(f, B, j); return { f: fj, a: Math.pow(j, -1.2), d: decayOf(fj) }; }), dur);
        };
        const ph = playhead(v);
        v.soundButton('Hear this octave', (snd) => {
          const a = note(sel - 12, 1.1), b = note(sel, 1.1), both = note(sel - 12, 3.2), u = note(sel, 3.2);
          for (let i = 0; i < both.length; i++) both[i] += u[i];
          [a, b].forEach((x) => finish(x, 0.6)); finish(both, 0.8);
          snd.samples(join([a, b, both], 0.15), SR, { gain: 0.55 }); ph.start(5.6);
        });
        const KEYNAME = (k) => M.noteName(k + 20);
        const rc = v.stage({ x: [0.5, 88.5], y: [-45, 45], height: 270, axes: 'box', grid: true, ylabel: 'cents from equal temperament', xticks: [1, 13, 25, 37, 49, 61, 73, 85, 88].map((k) => [k, KEYNAME(k)]), yticks: [-40, -20, 0, 20, 40], full: true, title: 'deviation of the tuned first partials from equal temperament' });
        const kb = v.stage({ x: [0.5, 88.5], y: [0, 1], height: 62, axes: false, full: true });
        const al = v.stage({ x: [-19.5, 16.5], y: [0.15, 3.75], height: 160, axes: 'box', xlabel: 'mismatch (¢): upper note’s partial against the lower note’s', yticks: [[3, '2:1'], [2, '4:2'], [1, '6:3']], xticks: [-15, -10, -5, 0, 5, 10, 15], full: true });
        const pick = (x) => { const k = M.clamp(Math.round(x), 13, 88); sel = k + 20; };
        kb.onClick((x) => pick(x)); rc.onClick((x) => pick(x));
        v.render(() => {
          const ty = type.value;
          rc.hline(0, { color: 'muted', width: 1.2 });
          for (const t2 of ['mix', '21', '42', '63']) if (t2 !== ty) rc.path(M.range(88, 1).map((k) => [k, dev(t2, k + 20)]), { color: 'muted', width: 1.2, alpha: 0.5, dash: [4, 3] });
          const pts = M.range(88, 1).map((k) => [k, dev(ty, k + 20)]);
          rc.path(pts, { color: 'accent', width: 2.4 });
          rc.dots(pts, { r: 2.3, color: 'accent' });
          rc.vband(37 - 0.5, 49 + 0.5, { color: 'green', alpha: 0.08 });
          rc.text('temperament octave', 43, -38, { align: 'center', color: 'green', size: 10.5 });
          const ks = sel - 20;
          rc.vband(ks - 12.5, ks - 11.5, { color: 'gold', alpha: 0.25 }); rc.vband(ks - 0.5, ks + 0.5, { color: 'gold', alpha: 0.35 });
          rc.dot(ks, dev(ty, sel), { r: 5.5, color: 'gold' });
          const dA = dev(ty, 21), dC = dev(ty, 108), sgn = (x) => (x > 0.05 ? '+' : '');
          rc.text(`A0: ${sgn(dA)}${v.fix(dA, 1)} ¢`, 2, dA - 6, { align: 'left', color: 'accent', size: 11, weight: 600 });
          rc.text(`C8: ${sgn(dC)}${v.fix(dC, 1)} ¢`, 87, Math.min(40, dC + 6), { align: 'right', color: 'accent', size: 11, weight: 600 });
          // ---- keyboard
          for (let k = 1; k <= 88; k++) {
            const m = k + 20, black = [1, 3, 6, 8, 10].includes(M.mod(m, 12)), on = m === sel || m === sel - 12;
            kb.rect(k - 0.5, 0, k + 0.5, 1, { fill: on ? 'gold' : black ? 'ink' : 'panel', fillAlpha: on ? 0.9 : black ? 0.75 : 1, color: 'faint', width: 0.6 });
          }
          // ---- partial alignment for the selected octave
          const f = all()[ty], lo = sel - 12;
          al.vline(0, { color: 'green', width: 1.5 });
          for (const [key, [a, b]] of Object.entries(PAIRS)) {
            const y = { '21': 3, '42': 2, '63': 1 }[key], pu = Pj(f.get(sel), Bm(sel), b), pl = Pj(f.get(lo), Bm(lo), a);
            const c = 1200 * Math.log2(pu / pl), beat = Math.abs(pu - pl);
            al.line(-16, y, 16, y, { color: 'faint', width: 1 });
            const used = ty !== 'none' && ((sel > 69 && SCH[ty].up[0] === a) || (sel < 69 && SCH[ty].dn[0] === a));
            if (used) al.text('tuned to coincide', -15.8, y - 0.3, { align: 'left', color: 'green', size: 10.5, weight: 600 });
            al.dot(M.clamp(c, -15.5, 15.5), y, { r: 6, color: Math.abs(c) < 0.5 ? 'green' : 'red' });
            al.text(`${v.fix(c, 1)} ¢ · ${v.fix(beat, 2)} beats/s`, M.clamp(c, -15.5, 15.5) + (c > 8 ? -0.8 : 0.8), y + 0.28, { align: c > 8 ? 'right' : 'left', color: 'ink', size: 11 });
          }
          al.corner(`octave ${M.noteName(lo)}–${M.noteName(sel)}`, 'tl', { color: 'gold', weight: 700 });
        });
        v.legend([['accent', 'this tuning'], ['muted', 'the other octave types', { dash: true }], ['gold', 'selected octave']]);
        v.readout(() => {
          const ty = type.value, f = all()[ty], lo = sel - 12;
          const beat21 = Math.abs(Pj(f.get(sel), Bm(sel), 1) - Pj(f.get(lo), Bm(lo), 2));
          return `${ty === 'none' ? 'no stretch' : SCH[ty].name}, inharmonicity ×${v.fix(kS.value, 2)} ($B$ = $${v.sci(Bm(lo), 2)}$ at ${M.noteName(lo)}, $${v.sci(Bm(sel), 2)}$ at ${M.noteName(sel)}) · A0 ${v.fix(dev(ty, 21), 1)} ¢, C8 ${v.fix(dev(ty, 108), 1)} ¢ from equal temperament · ${M.noteName(sel)} is tuned to ${v.fix(f.get(sel), 2)} Hz (${v.fix(dev(ty, sel), 1)} ¢); its octave with ${M.noteName(lo)} has the lower note's 2nd partial ${beat21 < 0.01 ? 'beat-free' : `beating at ${v.fix(beat21, 2)} per second`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Invention',
      name: 'The piano hammer: strike point and brightness',
      statement: String.raw`A piano string is set going by a felt-covered hammer thrown against it by the key action and immediately bouncing off. Two design choices shape the tone. (a) The **strike point**, usually about $1/7$ to $1/9$ of the speaking length from the end in the middle register: as with plucking (2.8), harmonics with a node near the strike point are weakly excited. (b) The **felt**, which stiffens as it is compressed (force roughly $\propto u^p$ with $p\approx2$–$3$ for compression $u$): a faster hammer compresses it further, meets a stiffer spring, and stays in contact for a shorter time, so the force pulse is shorter and its spectrum reaches higher. A loud note is therefore **brighter**, not just louder, and harder or softer felt (the voicing) changes the tone colour of every dynamic level.`,
      idea: String.raw`During the contact (a few milliseconds) the hammer pushes on the string with a force pulse $F(t)$. Each mode, being an oscillator driven at the strike point $x_h$, picks up an amplitude proportional to $\sin(n\pi x_h/L)$ times the pulse's spectrum $|\hat F(f_n)|$ at its own frequency (impulse response of a mode, 1.2), so the force on the bridge has partials $\propto\sin(n\pi x_h/L)\,|\hat F(f_n)|$: a strike-point comb (2.8) under a low-pass envelope whose cut-off is roughly the inverse of the contact time. Because the felt's spring is nonlinear, the contact time falls as the speed rises, and the envelope opens up. The string's waves, reflected from the near end, also push back on the hammer and help to throw it off.`,
      caption: String.raw`A simulation of a model middle C string (inharmonicity as in 2.11) struck by a 7 g hammer with felt force $K u^{2.5}$. Top: the first milliseconds after the strike, slowed down: the hammer (orange felt) pushes the string up and two pulses run off along it. Drag the hammer to move the strike point. Bottom left: the contact force, each curve scaled to its peak, for this strike and for *pp* (0.5 m/s) and *ff* (5 m/s). Bottom right: the levels of the partials of the bridge force, with the pulse's spectrum (orange) as their envelope. Change the key velocity and listen; *pp, then ff* plays both at the same loudness, so only the brightness differs.`,
      deps: ['music-2.8', 'music-2.11'],
      refs: ['Benson ch. 1', 'Rossing ch. 14'],
      tags: ['piano', 'timbre'],
      credit: 'Bartolomeo Cristofori, c. 1700 (hammer action); felt hammers, Jean-Henri Pape, 1826',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Piano_acoustics' },
      viz(v) {
        const M = v.M, FC = 261.63, BC = 3.9e-4, LS = 0.62, MUS = 6.17e-3, NM = 48, MH = 0.007, P = 2.5, NX = 161;
        const FELT = { soft: { label: 'soft', K: 1e9 }, med: { label: 'medium', K: 4e9 }, hard: { label: 'hard', K: 1.6e10 } };
        const vS = v.slider('hammer speed', 0.3, 6, 1.5, { log: true, fmt: (x) => v.fix(x, 2) + ' m/s' });
        const felt = v.select('felt', Object.entries(FELT).map(([value, o]) => ({ value, label: o.label })), 'med');
        const s = v.stage({ x: [-0.03, 1.03], y: [-1.35, 1.25], height: 220, axes: false, full: true });
        const fp = v.stage({ x: [0, 6], y: [-0.05, 1.18], height: 230, axes: 'box', xlabel: 't (ms)', yticks: [], weight: 1, title: 'contact force, scaled to its peak' });
        const sp = v.stage({ x: [-1.6, 40.7], y: [-72, 6], height: 230, axes: 'box', xlabel: 'partial n', xticks: [1, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40], yticks: [[0, '0 dB'], [-20, '−20'], [-40, '−40'], [-60, '−60']], weight: 1.25, title: 'force on the bridge: partial levels' });
        const hh = s.handle(0.12, -0.95, { color: 'orange', r: 8, constrain: (x) => [M.clamp(x, 0.03, 0.5), -0.95] });
        const SIN = M.range(NM).map((n) => Float64Array.from(M.range(NX), (i) => Math.sin(((n + 1) * Math.PI * i) / (NX - 1))));
        const cache = new Map();
        const simAt = (V, beta, K) => {
          const k = [V, beta, K].join(); if (cache.has(k)) return cache.get(k);
          const R = hammerSim({ f1: FC, B: BC, L: LS, mu: MUS, beta, mh: MH, K, p: P, V, NM, decay: decayOf, tEnd: 0.0065 });
          const A = M.range(NM).map((n) => Math.hypot(R.q[n], R.qd[n] / R.w[n]));
          const parts = M.range(NM).map((n) => ({ f: R.w[n] / TAU, a: (n + 1) * A[n], d: decayOf(R.w[n] / TAU), ph: Math.atan2(-R.qd[n] / R.w[n], R.q[n]) }));
          // spectrum of the contact force at frequency f (direct Fourier sum of the recorded pulse)
          const Fhat = (f) => { let re = 0, im = 0; R.F.forEach((x, i) => { const ph = TAU * f * i * R.dtRec; re += x * Math.cos(ph); im -= x * Math.sin(ph); }); return Math.hypot(re, im) * R.dtRec; };
          let ymax = 1e-12; for (const q of R.snaps) for (let i = 0; i < NX; i += 4) { let y = 0; for (let n = 0; n < NM; n++) y += q[n] * SIN[n][i]; ymax = Math.max(ymax, Math.abs(y)); }
          const out = { R, A, parts, Fhat, ymax };
          if (cache.size > 40) cache.clear();
          cache.set(k, out); return out;
        };
        const cur = () => simAt(vS.value, hh.x, FELT[felt.value].K);
        const strike = (S, dur = 1.8) => synth(S.parts, dur);
        v.soundButton('Strike', (snd) => {
          const S = cur(), ref = simAt(6, hh.x, FELT.med.K), buf = strike(S);
          const k = S.parts.reduce((a, p) => a + Math.abs(p.a), 0) / ref.parts.reduce((a, p) => a + Math.abs(p.a), 0);
          snd.samples(finish(buf, Math.min(0.95, 0.9 * Math.sqrt(k) + 0.05)), SR, { gain: 0.6 });
        });
        v.soundButton('pp, then ff (same loudness)', (snd) => {
          const bufs = [0.5, 5].map((V) => { const b = strike(simAt(V, hh.x, FELT[felt.value].K), 1.4); let e = 0; for (const x of b) e += x * x; const r = Math.sqrt(e / b.length) || 1; for (let i = 0; i < b.length; i++) b[i] *= 0.16 / r; return finish(b, Math.min(0.9, Math.max(...b.map(Math.abs))), SR, 0.002, 0.08); });
          snd.samples(join(bufs, 0.25), SR, { gain: 0.6, normalize: false });
        });
        v.animate((t) => {
          const S = cur(), { R } = S, beta = hh.x;
          // ---- string and hammer in slow motion (first 6 ms in 3 s)
          const tr = M.mod(t, 3.6) / 3.6 * 6e-3, k = Math.min(R.snaps.length - 1, Math.floor(tr / R.dtSnap)), q = R.snaps[k], sc = 0.9 / S.ymax;
          const pts = M.range(NX).map((i) => { let y = 0; for (let n = 0; n < NM; n++) y += q[n] * SIN[n][i]; return [i / (NX - 1), y * sc]; });
          s.hline(0, { color: 'faint', width: 1, dash: [3, 4] });
          s.path(pts, { color: 'accent', width: 2.6 });
          posts(s, 1, 0, 0.18);
          let yh = 0; for (let n = 0; n < NM; n++) yh += q[n] * Math.sin((n + 1) * Math.PI * beta);
          const uTop = Math.min(R.uh[k], yh + 1e-12) * sc; // felt surface (compressed where in contact)
          const contact = R.uh[k] > yh;
          s.rect(beta - 0.022, uTop - 0.22, beta + 0.022, uTop, { fill: 'orange', fillAlpha: contact ? 0.95 : 0.7, color: 'orange', width: 1, radius: 4 });
          s.rect(beta - 0.01, -0.95, beta + 0.01, uTop - 0.22, { fill: 'muted', fillAlpha: 0.75, stroke: false });
          s.text('hammer (drag)', beta + 0.03, -0.95, { align: 'left', color: 'orange', size: 11.5, weight: 600 });
          hh.y = -0.95;
          s.corner(`t = ${v.fix(tr * 1e3, 2)} ms after impact${contact ? ' · in contact' : ''}`, 'tl', { color: contact ? 'orange' : 'ink', weight: 600 });
          s.corner(`strike point ${v.fix(beta, 3)} L ≈ 1/${v.fix(1 / beta, 1)} · displacement magnified, peak ${v.fix(S.ymax * 1e3, 2)} mm`, 'tr', { color: 'muted' });
          // ---- contact force pulses
          const curve = (SS, col, w, dash) => { const m = Math.max(...SS.R.F); fp.path(SS.R.F.map((x, i) => [i * SS.R.dtRec * 1e3, x / m]), { color: col, width: w, dash }); };
          curve(simAt(0.5, beta, FELT[felt.value].K), 'muted', 1.4, [4, 3]);
          curve(simAt(5, beta, FELT[felt.value].K), 'red', 1.4, [4, 3]);
          curve(S, 'accent', 2.6);
          fp.vline(tr * 1e3, { color: 'gold', width: 1.5 });
          // ---- spectrum
          const amps = S.parts.map((p) => Math.abs(p.a)), amax = Math.max(...amps);
          const env = (n) => S.Fhat(stiff(FC, BC, n)) * Math.sqrt(1 + BC * n * n) / Math.sqrt(1 + BC) ;
          let em = 0; for (let n = 1; n <= 40; n++) em = Math.max(em, env(n) * Math.abs(Math.sin(n * Math.PI * beta)));
          const kk = amax / em;
          sp.clip(() => sp.fn((n) => 20 * Math.log10(Math.max(1e-12, (kk * env(n)) / amax)), { domain: [1, 40], n: 160, color: 'orange', width: 1.6, dash: [6, 4] }), [0, 40.7], [-61, 6]);
          sp.hline(-61, { color: 'muted', width: 1 });
          for (let n = 1; n <= 40; n++) { const L = 20 * Math.log10(Math.max(1e-12, amps[n - 1] / amax)); if (L > -61) sp.rect(n - 0.3, -61, n + 0.3, L, { fill: 'accent', fillAlpha: 0.65, stroke: false }); }
          sp.vline(1 / beta, { color: 'red', width: 1, dash: [3, 3] });
          sp.text(`n = 1/β`, 1 / beta + 0.4, 2, { align: 'left', color: 'red', size: 10.5 });
        }, { still: 0.95 });
        v.legend([['accent', 'this strike'], ['muted', 'pp (0.5 m/s)', { dash: true }], ['red', 'ff (5 m/s)', { dash: true }], ['orange', 'hammer; spectrum of its force pulse']]);
        v.readout(() => {
          const S = cur(), pp = simAt(0.5, hh.x, FELT[felt.value].K), ff = simAt(5, hh.x, FELT[felt.value].K);
          const c = centroid(S.parts), cpp = centroid(pp.parts), cff = centroid(ff.parts);
          let f20 = null; const F0 = S.Fhat(0); for (let f = 50; f < 20000; f += 25) if (S.Fhat(f) < 0.1 * F0) { f20 = f; break; }
          return `hammer at ${v.fix(vS.value, 2)} m/s on ${v.fix(hh.x, 3)} $L$: contact ${v.fix(S.R.tc * 1e3, 2)} ms, peak force ${v.fix(S.R.Fmax, 1)} N, rebound ${v.fix(S.R.vOut, 2)} m/s · the pulse spectrum is down 20 dB by ${f20 ? v.fix(f20 / 1000, 2) + ' kHz' : 'above 20 kHz'} · brightness (centroid of the bridge force): ${v.fix(c, 0)} Hz; at pp ${v.fix(cpp, 0)} Hz (contact ${v.fix(pp.R.tc * 1e3, 2)} ms), at ff ${v.fix(cff, 0)} Hz (contact ${v.fix(ff.R.tc * 1e3, 2)} ms)`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Paper',
      name: 'Harmonie universelle',
      paper: { authors: 'Marin Mersenne', year: 1636, title: 'Harmonie universelle, contenant la théorie et la pratique de la musique',
               venue: 'Paris, 1636–1637', url: 'https://archive.org/details/bub_gal_ark_12148_bpt6k5471093v' },
      introduces: ['music-2.5'],
      statement: String.raw`Mersenne's encyclopaedic treatise on music states and tests, with numbers, the laws of vibrating strings: the number of vibrations (*retours*) a string makes in a given time is inversely proportional to its length and proportional to the square root of the stretching weight ("en raison sous-doublée des poids": to go twice as fast a string must be stretched four times as hard), and thicker strings vibrate more slowly; in modern form $f=\frac1{2L}\sqrt{T/\mu}$ (2.5).

He then uses these laws for the **first estimate of the absolute frequency of a musical note** (book III of the treatise on motion and sound, proposition V, pp. 169–171). A gut string 17½ feet long, as thick as a racquet string (twelve sheep's guts), returns only **2 times a second** when stretched by half a pound, 4 times with 2 pounds and 8 times with 8 pounds, slow enough to count by eye. A 5-inch piece of it under half a pound, or 20 inches under 8 pounds, sounds in unison with the *ton de chapelle*, the G (*G re sol*) of an open 4-foot organ pipe; so that note makes **84 returns, or 168 passages through the rest position, per second**. He adds that a string must strike the air at least 20 times a second to be heard, and that the eye sees a string's motion up to 42 strokes a second but can count it only up to 10.`,
      idea: String.raw`Before Mersenne, music theory described intervals by ratios of string lengths, the Pythagorean tradition of the monochord. Vincenzo Galilei had noticed (1589) that tensions must be squared rather than lengths halved, and Beeckman, Galileo and Descartes had argued that pitch is the frequency of the vibrations; but no one could count vibrations hundreds of times a second. Mersenne turned the problem round: make a string so long and slack that its swings can be counted, then use the laws of length and tension, which he had tested, to scale up to an audible pitch. The book thereby introduced Mersenne's laws (2.5) and the idea of an absolute frequency scale. Its numbers were rough: he admits that elsewhere in the book he put the same pipe at 48 vibrations, an octave out, and his own figures for the 10-inch string do not fit his law. Sauveur (around 1700) measured frequencies far better with beats.`,
      caption: String.raw`Top: Mersenne's long gut string in real time (French feet and pounds, *pieds du roi* and *livres*). Choose a weight and drag the length from 17½ feet down to 5 inches: the swings are easy to count at first and soon too fast to see, as he says. Bottom: returns per second against length on logarithmic axes. The coloured lines are the laws of length and tension calibrated on his first measurement; the dots are his own data from p. 169, and the red one is the misprint or slip (10 inches under 4 pounds should give 119, not 84). Drag the gold point along a line. *Hold the note* sounds the string (it falls silent below 20 Hz); compare Mersenne's G at 84 Hz with what a 4-foot open pipe gives today.`,
      deps: ['music-6.1', 'music-1.3'],
      refs: [],
      tags: ['history', 'string', 'pitch'],
      credit: 'Marin Mersenne, 1636',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Harmonie_universelle' },
      viz(v) {
        const M = v.M, PIED = 0.3248, LIVRE = 0.4895, GRAV = 9.81, FT_MIN = 5 / 12, FT_MAX = 17.5;
        const Tn = (lb) => lb * LIVRE * GRAV;
        const MU = Tn(0.5) / (2 * FT_MAX * PIED * 2) ** 2; // calibrated on "17½ feet, half a pound: 2 returns a second"
        const fOf = (ft, lb) => Math.sqrt(Tn(lb) / MU) / (2 * ft * PIED);
        const DATA = [
          { ft: 17.5, lb: 0.5, f: 2, txt: '½ lb: 2' }, { ft: 17.5, lb: 2, f: 4, txt: '2 lb: 4' }, { ft: 17.5, lb: 8, f: 8, txt: '8 lb: 8' },
          { ft: 10 / 12, lb: 4, f: 84, txt: '10 in, 4 lb' }, { ft: 20 / 12, lb: 8, f: 84, txt: '20 in, 8 lb' }, { ft: 5 / 12, lb: 0.5, f: 84, txt: '5 in, ½ lb' },
        ];
        const WCOL = { 0.5: 'accent', 2: 'teal', 4: 'purple', 8: 'orange' };
        const lbTxt = (w) => (w === 0.5 ? '½ livre' : `${w} livres`);
        const ftTxt = (ft) => (ft >= 1 ? `${v.fix(ft, ft < 10 ? 2 : 1)} ft` : `${v.fix(ft * 12, 1)} in`);
        const wS = v.select('weight', [0.5, 2, 4, 8].map((w) => ({ value: w, label: lbTxt(w) })), 0.5, { onChange: () => { sync(); v.t = 0; } });
        const lS = v.slider('length', FT_MIN, FT_MAX, FT_MAX, { log: true, fmt: (ft) => `${ftTxt(ft)} (${v.fix(ft * PIED, 2)} m)`, onChange: () => { sync(); v.t = 0; } });
        let voice = null;
        const f = () => fOf(lS.value, wS.value);
        function sync() { if (voice && voice.playing) { const ff = f(); voice.setFreq(Math.max(20, ff)); voice.setGain(ff >= 20 ? 1 : 0); } }
        const hold = v.toggle('hold the note', false, { onChange: (on) => { if (on) { const ff = f(); voice = v.sound().tone(Math.max(20, ff), { sustain: true, harmonics: 8, rolloff: 1.1, gain: 0.2, attack: 0.03 }); voice.setGain(ff >= 20 ? 1 : 0); } else if (voice) { voice.stop(); voice = null; } } });
        void hold;
        v.button('Mersenne’s G: 84 Hz', () => v.sound().tone(84, { harmonics: 6, rolloff: 1.3, duration: 1.6, gain: 0.25 }));
        v.button('a 4-foot open pipe today: ≈125 Hz', () => v.sound().tone(125, { harmonics: 6, rolloff: 1.3, duration: 1.6, gain: 0.25 }));
        const s = v.stage({ x: [-0.7, 18.6], y: [-1.25, 1.15], height: 215, axes: false, full: true });
        const lg = v.stage({ x: [0.3, 25], y: [0.8, 400], xlog: true, ylog: true, height: 290, axes: 'box', grid: true, xlabel: 'length of the string (French feet)', ylabel: 'returns per second', full: true });
        const hd = lg.handle(FT_MAX, 2, { color: 'gold', r: 8, constrain: (x) => { const ft = M.clamp(x, FT_MIN, FT_MAX); return [ft, fOf(ft, wS.value)]; }, onDrag: (h) => { lS.set(h.x); sync(); v.t = 0; } });
        v.animate((t) => {
          const ft = lS.value, w = wS.value, ff = f();
          if (!hd.dragging) { hd.x = ft; hd.y = ff; }
          // ---- the string in real time
          const A = 0.62;
          for (let k = 0; k <= 18; k++) { s.line(k, -1.0, k, k % 5 ? -0.94 : -0.9, { color: 'muted', width: 1 }); if (k % 5 === 0) s.text(`${k} ft`, k, -1.12, { align: 'center', color: 'muted', size: 10.5 }); }
          s.line(0, -0.97, 18, -0.97, { color: 'muted', width: 1 });
          s.line(0, -0.25, 0, 0.25, { color: 'muted', width: 4 });
          s.line(ft, -0.25, ft, 0.25, { color: 'muted', width: 4 });
          s.line(ft, 0, ft + 0.35, 0, { color: 'ink', width: 1.4 });
          s.circle(ft + 0.42, -0.06, 0.07, { color: 'muted', width: 1.5 });
          s.line(ft + 0.49, -0.06, ft + 0.49, -0.5, { color: 'ink', width: 1.2 });
          const side = 0.16 + 0.06 * Math.cbrt(w);
          s.rect(ft + 0.49 - side, -0.5 - side * 1.4, ft + 0.49 + side, -0.5, { fill: WCOL[w], fillAlpha: 0.7, color: 'ink', width: 1 });
          s.text(lbTxt(w), ft + 0.49, -0.62 - side * 1.4, { align: ft > 16 ? 'right' : 'center', color: WCOL[w], size: 11.5, weight: 600, dx: ft > 16 ? 14 : 0 });
          const countable = ff <= 10, visible = ff <= 21;
          if (countable) s.fn((x) => A * Math.sin((Math.PI * x) / ft) * Math.cos(TAU * ff * t), { domain: [0, ft], n: 200, color: 'accent', width: 2.6 });
          else {
            s.between((x) => A * Math.sin((Math.PI * x) / ft), (x) => -A * Math.sin((Math.PI * x) / ft), 0, ft, { fill: 'accent', fillAlpha: visible ? 0.28 : 0.16, n: 120 });
            s.line(0, 0, ft, 0, { color: 'accent', width: 1.4, alpha: 0.6 });
          }
          const n = Math.floor(ff * t);
          s.corner(countable ? `count: ${n} return${n === 1 ? '' : 's'} in ${v.fix(t, 1)} s` : visible ? 'a blur: the motion is visible but too fast to count' : 'too fast to see: only the ear can follow it now', 'tl', { color: countable ? 'ink' : 'muted', weight: 600 });
          s.corner(`${v.fix(ff, ff < 10 ? 2 : 1)} returns per second${ff >= 20 ? ` · ${noteOf(M, ff)}` : ''}`, 'tr', { color: 'accent', weight: 700 });
          // ---- the log–log chart
          lg.hband(0.8, 10, { color: 'green', alpha: 0.06 });
          lg.text('countable by eye (≤ 10 a second, Mersenne)', 0.33, 6.3, { align: 'left', color: 'green', size: 10.5 });
          lg.hline(84, { color: 'green', width: 1.2, dash: [6, 4] });
          lg.text('unison with the 4-ft open pipe: 84', 24, 84 * 0.86, { align: 'right', color: 'green', size: 10.5, weight: 600 });
          lg.hline(125, { color: 'red', width: 1.2, dash: [2, 4] });
          lg.text('a 4-ft open pipe today: ≈ 125 Hz', 24, 125 * 1.17, { align: 'right', color: 'red', size: 10.5 });
          for (const lb of [0.5, 2, 4, 8]) {
            lg.fn((x) => fOf(x, lb), { domain: [FT_MIN, FT_MAX], color: WCOL[lb], width: lb === w ? 2.6 : 1.3, alpha: lb === w ? 1 : 0.55 });
            lg.text(lbTxt(lb), 6, fOf(6, lb) * 1.13, { align: 'center', color: WCOL[lb], size: 10.5, weight: lb === w ? 700 : 500 });
          }
          lg.text('17½ ft', FT_MAX, 13.5, { align: 'center', color: 'green', size: 10.5, weight: 600 });
          DATA.forEach((d) => {
            const pred = fOf(d.ft, d.lb), ok = Math.abs(Math.log(d.f / pred)) < 0.05;
            lg.dot(d.ft, d.f, { r: 6, color: ok ? 'green' : 'red', hollow: !ok, width: 2.4 });
            if (d.ft < 2) lg.text(d.txt, d.ft * 1.09, d.f * (d.lb === 4 ? 0.8 : d.lb === 8 ? 1.25 : 1.0), { align: 'left', color: ok ? 'green' : 'red', size: 10.5 });
            else lg.text(d.txt, d.ft * 1.08, d.f, { align: 'left', color: 'green', size: 10.5 });
            if (!ok) { lg.line(d.ft, d.f, d.ft, pred, { color: 'red', width: 1, dash: [2, 3] }); lg.dot(d.ft, pred, { r: 3, color: 'red' }); lg.text(`law: ${v.fix(pred, 0)}`, d.ft * 0.93, pred * 0.97, { align: 'right', color: 'red', size: 10.5 }); }
          });
        }, { still: 1.3 });
        v.legend([['green', 'Mersenne’s measurements (p. 169)', { dot: true }], ['red', 'the one that misses his law', { dot: true }], ['accent', 'law for ½ livre (other colours: 2, 4, 8 livres)']]);
        v.readout(() => {
          const ft = lS.value, w = wS.value, ff = f(), d = Math.sqrt((4 * MU) / (Math.PI * 1300)) * 1e3;
          const pipe = 343 / (2 * 4 * PIED);
          return `${ftTxt(ft)} under ${lbTxt(w)} ($T$ = ${v.fix(Tn(w), 2)} N): ${v.fix(ff, ff < 10 ? 2 : 1)} returns per second, i.e. ${v.fix(2 * ff, 1)} strokes of the air in Mersenne's counting${ff >= 20 ? ` · ${noteOf(M, ff)}` : ' · inaudible'} · his chain: 17½ ft → 5 in is ×42, so 2 → 84 Hz · today: his "2 returns a second" means $\\mu=T/(2Lf)^2$ = ${v.fix(MU * 1e3, 2)} g/m, a gut string ${v.fix(d, 1)} mm thick, plausible for a racquet string · a 4-foot open pipe sounds near $c/2L$ = ${v.fix(pipe, 0)} Hz (343 m/s), a little lower with end corrections: Mersenne's 84 is about two thirds of that, roughly a fifth too low`;
        });
      },
    },
  ],
};
