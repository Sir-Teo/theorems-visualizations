// Music Theory & Acoustics — Chapter 3: Pipes, drums, bars and bells (part a: air columns)
import { TAU, SR, C_AIR, noteOf, centsTxt, playhead, finish, join, steadyTone, signedRamp, keyboard, spectrumDB, levelAt } from './ch03.shared.js';

/** Unflanged and flanged static end corrections (Levine & Schwinger 1948; Rayleigh / Norris & Sheng), as multiples of the radius. */
const END_UNFL = 0.6133, END_FL = 0.8216;

/** Tube walls from x0 to x1 (data units) at half-heights r0 → r1, with optional caps; y is the axis. */
function drawTube(s, x0, x1, r0, r1, o = {}) {
  const col = o.color || 'ink', w = o.width ?? 2.4;
  s.poly([[x0, r0], [x1, r1], [x1, -r1], [x0, -r0]], { fill: o.fill || 'accent', fillAlpha: o.fillAlpha ?? 0.06, stroke: false });
  s.line(x0, r0, x1, r1, { color: col, width: w });
  s.line(x0, -r0, x1, -r1, { color: col, width: w });
  const cap = (x, r, side) => {
    const t = o.capW ?? 0.012 * (s.xr[1] - s.xr[0]), a = side < 0 ? x - t : x, b = side < 0 ? x : x + t;
    // (fill + hatch and the outline are separate calls: a hatched shape that is also stroked strokes the hatch lines everywhere)
    s.rect(a, -r * 1.12, b, r * 1.12, { fill: 'muted', fillAlpha: 0.85, stroke: false, hatch: 'panel', hatchGap: 5, hatchAlpha: 0.7 });
    s.rect(a, -r * 1.12, b, r * 1.12, { color: col, width: 1.2 });
  };
  if (o.closedLeft) cap(x0, r0, -1);
  if (o.closedRight) cap(x1, r1, 1);
}

/** Fractional delay line (linear interpolation) for waveguide models. */
function delayLine(maxLen) {
  const n = maxLen + 4, buf = new Float64Array(n); let w = 0;
  return {
    len: 10,
    out() { const r = w - this.len, i = Math.floor(r), f = r - i, a = buf[((i % n) + n) % n], b = buf[(((i + 1) % n) + n) % n]; return a + (b - a) * f; },
    push(x) { buf[w % n] = x; w++; },
  };
}
/** Seeded uniform noise in [−1, 1]. */
const noiseGen = (seed = 7) => () => { seed = (seed * 16807) % 2147483647; return (seed / 2147483647) * 2 - 1; };

/**
 * Passive tube as a digital waveguide (d'Alembert's solution, sampled): a pulse runs to the far end and back in T = 2L/c and is
 * reflected with sign −1 at an open end (with a little low-pass loss) and +1 at a closed end. src: 'tap' (an impulse) or 'breath'
 * (steady noise). fRound = 1/T is the round-trip rate in Hz. Output: pressure at the open end.
 */
function tubeSim(fRound, closed, dur, src) {
  const n = Math.round(dur * SR), out = new Float32Array(n), T = SR / fRound, d = delayLine(Math.ceil(T) + 8), rnd = noiseGen(11);
  d.len = T - 0.5; // the two-point average adds half a sample of delay
  const g = src === 'breath' ? 0.992 : 0.985, s = closed ? -1 : 1; let prev = 0;
  for (let k = 0; k < n; k++) {
    const x = src === 'breath' ? 0.04 * rnd() * Math.min(1, k / 2000) : k < 3 ? [0.5, 1, 0.5][k] : 0;
    const y0 = d.out(), lp = 0.5 * (y0 + prev); prev = y0;
    const y = x + s * g * lp; d.push(y); out[k] = y;
  }
  return out;
}
/**
 * Clarinet: a reed valve on a closed–open cylinder (the reed-table waveguide model of Smith and of Cook's STK). The bore's round trip
 * is half a period (the open end inverts), so it sounds at f = c/4L. Returns the pressure in the mouthpiece.
 */
function clarinetSim(f, dur, breath = 0.75) {
  const n = Math.round(dur * SR), out = new Float32Array(n), d = delayLine(Math.ceil(SR / f) + 8), rnd = noiseGen(5);
  d.len = (SR / f) * 0.5 - 0.5; let prev = 0; const att = 0.02 * SR;
  for (let k = 0; k < n; k++) {
    const env = Math.min(1, k / att), P = breath * env * (1 + 0.004 * rnd());
    const b = d.out(), lp = 0.5 * (b + prev); prev = b;
    const pd = -0.95 * lp - P, r = Math.max(-1, Math.min(1, 0.7 - 0.3 * pd));
    d.push(P + pd * r); out[k] = b;
  }
  return out;
}

// ---- bore acoustics by transfer matrices (used by 3.5)
const RHO = 1.2;
function J0x(x) { const N = Math.max(32, Math.ceil(x) + 40); let s = 0; for (let k = 0; k < N; k++) s += Math.cos(x * Math.sin((TAU * k) / N)); return s / N; }
function J1x(x) { const N = Math.max(32, Math.ceil(x) + 40); let s = 0; for (let k = 0; k < N; k++) { const t = (TAU * k) / N; s += Math.cos(t - x * Math.sin(t)); } return s / N; }
/** Struve H₁ by the Aarts–Janssen approximation (2003). */
const struveH1 = (z) => (z < 1e-6 ? (2 * z * z) / (3 * Math.PI) : 2 / Math.PI - J0x(z) + ((16 / Math.PI - 5) * Math.sin(z)) / z + ((12 - 36 / Math.PI) * (1 - Math.cos(z))) / (z * z));
/** Radiation impedance of a baffled piston of radius a, divided by ρc/S: 1 − J₁(2ka)/ka + i H₁(2ka)/ka (Rayleigh). */
function pistonZ(ka) { const z = 2 * ka; return ka < 1e-6 ? [0, 0] : [1 - (2 * J1x(z)) / z, (2 * struveH1(z)) / z]; }
/**
 * |Z_in| at the narrow end of a bore given by radii rs at positions xs (m), as a staircase of short cylinders. Plane waves with
 * visco-thermal wall loss k = ω/c − iα with α = (1/rc)·√(ωη/2ρ)·(1 + (γ−1)/√Pr) ≈ 2.96·10⁻⁵ √f / r (1/m, r in m); a baffled-piston load at the open end.
 * Returns {F, A} for nf frequencies between f0 and f1 (Hz).
 */
function boreSweep(xs, rs, f0, f1, nf) {
  const n = xs.length - 1, F = new Float64Array(nf), A = new Float64Array(nf);
  const seg = []; for (let i = 0; i < n; i++) { const r = 0.5 * (rs[i] + rs[i + 1]); seg.push([xs[i + 1] - xs[i], r, (RHO * C_AIR) / (Math.PI * r * r)]); }
  const rb = rs[n], Zb = (RHO * C_AIR) / (Math.PI * rb * rb);
  for (let j = 0; j < nf; j++) {
    const f = f0 + ((f1 - f0) * j) / (nf - 1), k0 = (TAU * f) / C_AIR, sq = Math.sqrt(f), rr = pistonZ(k0 * rb);
    let zr = rr[0] * Zb, zi = rr[1] * Zb;
    for (let i = n - 1; i >= 0; i--) {
      const [L, r, Zi] = seg[i], a = (2.96e-5 * sq) / r, kr = k0 * L, ki = -a * L;
      const ch = Math.cosh(ki), sh = Math.sinh(ki), cr = Math.cos(kr), sr = Math.sin(kr);
      const c0 = cr * ch, c1 = -sr * sh, s0 = sr * ch, s1 = cr * sh; // cos(kL), sin(kL) for complex kL
      // Z ← Zi (Z cos + i Zi sin) / (Zi cos + i Z sin)
      const nr = zr * c0 - zi * c1 - Zi * s1, ni = zr * c1 + zi * c0 + Zi * s0;
      const dr = Zi * c0 - (zr * s1 + zi * s0), di = Zi * c1 + (zr * s0 - zi * s1);
      const dd = dr * dr + di * di; zr = (Zi * (nr * dr + ni * di)) / dd; zi = (Zi * (ni * dr - nr * di)) / dd;
    }
    F[j] = f; A[j] = Math.hypot(zr, zi);
  }
  return { F, A };
}
/** Local maxima of A (parabolic refinement in log A). */
function peaksOf(F, A, minRel = 1.15) {
  const out = [];
  for (let j = 1; j < A.length - 1; j++) if (A[j] > A[j - 1] && A[j] >= A[j + 1]) {
    let lo = A[j]; for (let k = j - 1; k >= 0 && A[k] <= A[k + 1]; k--) lo = Math.min(lo, A[k]);
    if (A[j] / lo < minRel) continue;
    const a = Math.log(A[j - 1]), b = Math.log(A[j]), c = Math.log(A[j + 1]), d = (0.5 * (a - c)) / (a - 2 * b + c || 1);
    out.push({ f: F[j] + d * (F[1] - F[0]), a: A[j] });
  }
  return out;
}

export default {
  collection: 'music',
  chapter: 3,
  title: 'Pipes, drums, bars and bells',
  summary: String.raw`Air columns, membranes, bars and shells vibrate in modes too, but only a uniform tube's modes come out harmonic of their own accord. Closing one end of a pipe leaves only the odd harmonics; tapering the bore into a cone restores the full series; a brass player's mouthpiece and flaring bell drag the resonances of a closed tube into a nearly harmonic ladder. A drumhead's modes are eigenfunctions of the Laplacian, with frequencies set by zeros of Bessel functions on a round drum, far from harmonic until the surrounding air pulls a kettledrum's modes into line. Plates show their modes as Chladni's sand figures, and bars and bells must be carved and thickened by their makers to tame naturally inharmonic partials: the marimba's 1 : 4 : 10 and the church bell's minor-third tierce are the results.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Model',
      name: 'Standing waves in an air column',
      statement: String.raw`In a tube much narrower than the wavelength, sound travels as plane waves along the axis. Let $\xi(x,t)$ be the displacement of the air that rests at $x$, and $p(x,t)$ the acoustic (excess) pressure. Compressing a thin slab adiabatically (1.4) gives $p=-\rho c^2\,\partial\xi/\partial x$, and Newton's law for the slab gives $\rho\,\partial^2\xi/\partial t^2=-\partial p/\partial x$; so $\xi$ and $p$ both obey the wave equation with speed $c=\sqrt{\gamma p_0/\rho}\approx343$ m/s. The ends set the boundary conditions:
- at a **closed** end the air cannot move: $\xi=0$, a displacement node and a pressure antinode;
- at an **open** end the pressure stays at atmospheric: $p\approx0$, a pressure node and a displacement antinode.

The standing waves that fit are $\xi=A\,X(x)\cos\omega t$, $p=-\rho c^2A\,X'(x)\cos\omega t$, so the pressure pattern is the displacement pattern shifted by a quarter wavelength: **every displacement node is a pressure antinode and vice versa**. A tube of length $L$ open at both ends, or closed at both, resonates at $f_n=nc/2L$; closed at one end and open at the other, at $f_n=(2n-1)\,c/4L$.`,
      idea: String.raw`The pressure measures squeezing, not motion: it is greatest where neighbouring parcels converge from both sides, which is exactly where the parcel in the middle is pinned (a displacement node), and it vanishes where all parcels nearby move together (a displacement antinode). That is the relation $p\propto-\partial\xi/\partial x$, and differentiating a standing wave $\cos kx$ turns it into $\sin kx$, a quarter wavelength over. The rest is the counting of 2.3–2.4 with new boundary conditions: two like ends (both nodes of $p$, or both nodes of $\xi$) hold a whole number of half wavelengths; unlike ends hold an odd number of quarter wavelengths. Pressure and displacement peak at the same instants; the velocity $\partial\xi/\partial t$ peaks a quarter period later.`,
      caption: String.raw`The top panel shows parcels of air inside a 60 cm tube in slow motion, with their displacement greatly exaggerated; the background colour is the pressure (red compressed, blue rarefied). Below are the displacement $\xi$ (blue) and the pressure $p$ (red) along the tube, with their envelopes. Choose the **ends** and the **mode**, and drag the gold **probe** along the tube: where the parcels stand still (a blue node), the pressure swings hardest. *Listen* plays the mode; *resonances in turn* plays the first five.`,
      deps: ['music-2.3', 'music-1.4'],
      see: ['waves-1.11', 'music-11.3', 'ling-1.8'],
      refs: ['Benson ch. 3', 'Loy I ch. 8'],
      tags: ['pipes', 'standing waves'],
      credit: 'Daniel Bernoulli, 1762; Euler, 1759',
      scope: String.raw`A plane-wave model: it holds while the tube's diameter is well below the wavelength (below about $1.84c/\pi d$, where the first cross-mode appears) and the amplitude is small. It ignores the end correction (the pressure node of an open end lies about $0.6$ radius outside the tube, 3.2) and the losses at the walls.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Acoustic_resonance#Resonance_of_a_tube_of_air' },
      viz(v) {
        const M = v.M, L = 0.6, NC = 46, NR = 7, dxc = L / NC;
        const ends = v.select('ends', [{ value: 'oo', label: 'open – open' }, { value: 'co', label: 'closed – open' }, { value: 'cc', label: 'closed – closed' }], 'co');
        const nS = v.slider('mode $n$', 1, 5, 2, { int: true });
        const show = v.select('graph', [{ value: 'both', label: 'both' }, { value: 'disp', label: 'displacement $\\xi$' }, { value: 'pres', label: 'pressure $p$' }], 'both');
        const s = v.stage({ x: [-0.045, L + 0.045], y: [-1.34, 1.34], height: 205, axes: false, full: true });
        const g = v.stage({ x: [-0.045, L + 0.045], y: [-1.42, 1.3], height: 235, axes: 'box', xlabel: 'position along the tube (cm)', xticks: [0, 10, 20, 30, 40, 50, 60].map((c) => [c / 100, String(c)]), yticks: [[0, '0']], full: true, title: 'displacement ξ and pressure p along the tube (each scaled to its largest value)' });
        const probe = g.handle(0.135, -1.22, { color: 'gold', r: 8, label: 'probe', labelPos: 'e', constrain: (x) => [M.clamp(x, 0, L), -1.22] });
        const rng = v.rng(4), parcels = [];
        for (let j = 0; j < NC; j++) for (let i = 0; i < NR; i++) parcels.push([(j + 0.5) * dxc + (rng() - 0.5) * 0.35 * dxc, -0.74 + (1.48 * (i + 0.5)) / NR + (rng() - 0.5) * 0.12]);
        const mode = () => {
          const e = ends.value, n = nS.value, k = e === 'co' ? ((2 * n - 1) * Math.PI) / (2 * L) : (n * Math.PI) / L;
          const X = e === 'oo' ? (x) => Math.cos(k * x) : (x) => Math.sin(k * x);
          const P = e === 'oo' ? (x) => Math.sin(k * x) : (x) => -Math.cos(k * x);
          const zeros = (h) => { const z = []; for (let q = 0; q <= 2 * n + 1; q++) { const x = (q * Math.PI + h) / k; if (x > -1e-9 && x < L + 1e-9) z.push(Math.max(0, Math.min(L, x))); } return z; };
          const dn = e === 'oo' ? zeros(Math.PI / 2) : zeros(0), pn = e === 'oo' ? zeros(0) : zeros(Math.PI / 2);
          return { e, n, k, X, P, f: (k * C_AIR) / TAU, dn, pn };
        };
        const ph = playhead(v);
        v.soundButton('Listen', (snd) => { const m = mode(); snd.tone(m.f, { duration: 1.5, gain: 0.25 }); ph.start(1.5); });
        v.soundButton('resonances in turn', (snd) => { const e = ends.value; M.range(5, 1).forEach((n, i) => { const k = e === 'co' ? ((2 * n - 1) * Math.PI) / (2 * L) : (n * Math.PI) / L; snd.tone((k * C_AIR) / TAU, { duration: 0.55, gain: 0.22, delay: 0.62 * i, release: 0.1 }); }); ph.start(3.2); });
        let st = null;
        v.animate((t) => {
          const m = mode(), fref = C_AIR / (2 * L), ph0 = Math.cos(TAU * 0.55 * (m.f / fref) * t), sr = signedRamp(v);
          const amp = 0.6 * dxc;
          // ---- the tube: pressure bands, parcels, walls
          const NB = 96;
          for (let b = 0; b < NB; b++) { const x0 = (b * L) / NB, u = m.P(x0 + L / NB / 2) * ph0; s.rect(x0, -0.95, x0 + L / NB + 1e-4, 0.95, { fill: sr.col(u), fillAlpha: 1, stroke: false }); }
          s.dots(parcels.map(([x, y]) => [x + amp * m.X(x) * ph0, y]), { r: 2.6, color: 'ink', alpha: 0.7 });
          drawTube(s, 0, L, 0.95, 0.95, { closedLeft: m.e !== 'oo', closedRight: m.e === 'cc', fillAlpha: 0 });
          s.vline(probe.x, { color: 'gold', width: 1.6, dash: [4, 3] });
          s.text(m.e === 'oo' ? 'open end' : 'closed end', 0, -1.2, { align: 'left', color: 'muted', size: 11 });
          s.text(m.e === 'cc' ? 'closed end' : 'open end', L, -1.2, { align: 'right', color: 'muted', size: 11 });
          s.corner(`mode ${m.n}: ${v.fix(m.f, 1)} Hz, slowed down ×${Math.round(m.f / (0.55 * (m.f / fref)))}`, 'tl', { color: 'muted' });
          if (ph.t != null) s.corner('♪ playing', 'tr', { color: 'gold', weight: 600 });
          // ---- graphs
          const sd = show.value !== 'pres', sp = show.value !== 'disp';
          g.hline(0, { color: 'faint', width: 1 });
          if (sd) { g.between((x) => Math.abs(m.X(x)), (x) => -Math.abs(m.X(x)), 0, L, { fill: 'blue', fillAlpha: 0.08, n: 300 }); g.fn((x) => m.X(x) * ph0, { domain: [0, L], n: 300, color: 'blue', width: 2.6 }); }
          if (sp) { g.between((x) => Math.abs(m.P(x)), (x) => -Math.abs(m.P(x)), 0, L, { fill: 'red', fillAlpha: 0.07, n: 300 }); g.fn((x) => m.P(x) * ph0, { domain: [0, L], n: 300, color: 'red', width: 2.6 }); }
          if (sd) m.dn.forEach((x) => g.dot(x, 0, { r: 5.5, color: 'blue' }));
          if (sp) m.pn.forEach((x) => g.dot(x, 0, { r: 5.5, color: 'red', hollow: true, width: 2.2 }));
          g.vline(probe.x, { color: 'gold', width: 1.6, dash: [4, 3] });
          const ax = Math.abs(m.X(probe.x)), ap = Math.abs(m.P(probe.x));
          g.text(`|ξ| ${v.fix(ax, 2)}   |p| ${v.fix(ap, 2)}`, probe.x + (probe.x > 0.42 ? -0.008 : 0.008), 1.17, { align: probe.x > 0.42 ? 'right' : 'left', color: 'gold', size: 11.5, weight: 600 });
          st = { m, ax, ap };
        }, { still: 1.1 });
        v.legend([['blue', 'displacement ξ; filled dots: its nodes'], ['red', 'pressure p; hollow dots: its nodes'], ['gold', 'probe', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { m, ax, ap } = st, cm = (x) => v.fix(x * 100, 1), nm = { oo: 'open at both ends', co: 'closed at the left, open at the right', cc: 'closed at both ends' }[m.e];
          const lam = TAU / m.k, form = m.e === 'co' ? `$f=(2n-1)c/4L$` : `$f=nc/2L$`;
          const worst = Math.min(...m.dn.map((x) => Math.abs(m.P(x))));
          return `tube ${nm}, $L$ = 60 cm, mode $n$ = ${m.n}: $\\lambda$ = ${cm(lam)} cm, ${form} = ${v.fix(m.f, 1)} Hz (${noteOf(M, m.f)}) with $c$ = ${C_AIR} m/s · displacement nodes at ${m.dn.map(cm).join(', ')} cm, pressure nodes at ${m.pn.map(cm).join(', ')} cm · at every displacement node the pressure amplitude is ${v.fix(worst, 3)} of its maximum · probe at ${cm(probe.x)} cm: displacement amplitude ${v.fix(ax, 2)}, pressure amplitude ${v.fix(ap, 2)}, and $\\xi^2+p^2$ = ${v.fix(ax * ax + ap * ap, 3)} everywhere`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'The open pipe: all harmonics',
      statement: String.raw`A cylindrical pipe of length $L$ and radius $a\ll\lambda$, open at both ends, has pressure nodes just outside each end, so its resonances are
$$f_n=\frac{n\,c}{2L_{\text{eff}}},\qquad L_{\text{eff}}=L+2\delta,\qquad n=1,2,3,\dots,$$
a **complete harmonic series**. The **end correction** $\delta$ is the distance beyond the rim at which the standing wave's pressure node sits: $\delta\approx0.6133\,a$ for a thin-walled unflanged end (Levine and Schwinger) and $\delta\approx0.8216\,a$ for an end set in a large flange. The fundamental is set by the length (an open organ pipe of nominal length 8 feet sounds C2, about 65 Hz; a concert flute's 60 cm of open tube sounds C4), and halving the length raises every resonance an octave. To first order in $ka$ the end correction is the same for every mode, so the series stays harmonic; at larger $ka$ it shrinks a little and the upper resonances creep sharp.`,
      idea: String.raw`At an open end the pressure must fall to atmospheric, which by 3.1 makes it a pressure node; with both ends alike the pipe holds a whole number of half wavelengths, $L_{\text{eff}}=n\lambda/2$, exactly as a string fixed at both ends does (2.4). The node is not at the rim because the air just outside the mouth moves with the air inside: it has inertia, and that extra mass of air lengthens the column by a fraction of the radius. Solving the radiation problem for a semi-infinite tube (by the Wiener–Hopf method) gives $0.6133a$ at low frequency; a flange confines the outside flow and adds more. Because $\delta$ is the same for every low mode, the ratios $1:2:3:\cdots$ survive, which is why flutes, recorders and open flue pipes sound with every harmonic and overblow at the octave.`,
      caption: String.raw`Drag the gold handle at the end of the pipe, or the length slider, and *hold the note* to hear the pitch follow; the top panel shows the pressure standing wave of the chosen mode, continued (dashed) beyond each end to its virtual node. Lower left: the open end at true scale, with the pressure along the axis reaching zero a distance $\delta$ outside the rim; change the **radius** and the **ends** to move it. Lower right: the resonances on a keyboard; grey dashes mark where they would be without the end correction. *Overblow* plays modes 1 to 6 in turn: octave, twelfth, two octaves, …`,
      deps: ['music-3.1', 'music-2.6'],
      see: ['music-11.13', 'waves-2.1', 'music-2.4'],
      refs: ['Benson ch. 3', 'Rossing ch. 12'],
      tags: ['pipes', 'harmonics'],
      credit: 'Daniel Bernoulli, 1762; end correction: Rayleigh, 1871; Levine & Schwinger, 1948',
      scope: String.raw`Plane waves only ($ka\lesssim1$, i.e. diameters well below the wavelength), small amplitudes, no wall losses and no mean flow. The constant end correction is the low-frequency limit; Davies, Bento Coelho and Bhattacharya (1980) fitted $\delta/a\approx0.6133-0.1168(ka)^2$ for $ka<0.5$. Real flutes add the embouchure hole, tone holes and a tapered head joint.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/End_correction' },
      viz(v) {
        const M = v.M, NM = 16;
        const Ls = v.slider('length $L$', 0.1, 5, 0.644, { log: true, fmt: (x) => (x < 1 ? v.fix(x * 100, 1) + ' cm' : v.fix(x, 3) + ' m'), onChange: () => sync() });
        const as = v.slider('radius $a$', 0.002, 0.06, 0.0095, { log: true, fmt: (x) => v.fix(x * 1000, 1) + ' mm', onChange: () => sync() });
        const endS = v.select('ends', [{ value: 'unfl', label: 'unflanged' }, { value: 'fl', label: 'flanged' }, { value: 'none', label: 'no end correction' }], 'unfl', { onChange: () => sync() });
        const nS = v.slider('mode shown $n$', 1, 8, 2, { int: true });
        const HARM = [[1, 1], [2, 0.5], [3, 0.28], [4, 0.14], [5, 0.08], [6, 0.05], [7, 0.03]];
        let voice = null;
        const hold = v.toggle('hold the note', false, { onChange: (on) => { if (on) voice = v.sound().tone(HARM.map(([h, a]) => [h * f1(), a]), { sustain: true, gain: 0.2, attack: 0.05 }); else if (voice) { voice.stop(); voice = null; } } });
        const dOf = () => (endS.value === 'none' ? 0 : (endS.value === 'fl' ? END_FL : END_UNFL) * as.value);
        const Leff = () => Ls.value + 2 * dOf();
        const f1 = () => C_AIR / (2 * Leff());
        function sync() { if (voice && voice.playing) voice.setFreq(f1()); }
        v.soundButton('Overblow: modes 1 → 6', (snd) => { M.range(6, 1).forEach((n, i) => snd.tone(HARM.map(([h, a]) => [h * n * f1(), a]), { duration: 0.5, gain: 0.2, delay: 0.58 * i, release: 0.1 })); });
        const top = v.stage({ x: [-0.1, 1.1], y: [-1.45, 1.45], height: 200, axes: false, full: true });
        const zm = v.stage({ x: [-4.5, 3.2], y: [-2.3, 2.3], equal: true, height: 240, axes: false, weight: 0.85, minWidth: 260, title: 'the open end at true scale' });
        const sp = v.stage({ x: [40, 8000], y: [-0.42, 1.3], xlog: true, height: 240, axes: 'box', yticks: [], xlabel: 'frequency (Hz)', weight: 1.4, title: 'resonances on the keyboard' });
        let Rv = 0.8;
        const hEnd = top.handle(0.644, Rv, { color: 'gold', r: 8, constrain: (x) => [x, Rv], onDrag: (h) => { Ls.set(M.clamp(h.x, 0.1, 5)); sync(); } });
        v.animate((t) => {
          const L = Ls.value, a = as.value, d = dOf(), Le = L + 2 * d, n = nS.value, f = f1();
          const R = 0.62 + 0.45 * Math.sqrt(a / 0.06); Rv = R;
          if (!hEnd.dragging) hEnd.set(L, R);
          // ---- whole pipe (vertical scale exaggerated)
          top.setView([-0.1 * L, 1.1 * L], [-1.45, 1.45]);
          const W = 0.8 * R, k = (n * Math.PI) / Le, p = (x) => Math.sin(k * (x + d)), ph = Math.cos(TAU * 0.5 * t * Math.sqrt(n));
          drawTube(top, 0, L, R, R);
          top.between((x) => W * Math.abs(p(x)), (x) => -W * Math.abs(p(x)), 0, L, { fill: 'red', fillAlpha: 0.1, n: 300 });
          top.fn((x) => W * p(x) * ph, { domain: [0, L], n: 300, color: 'red', width: 2.6 });
          if (d > 0) for (const [x0, x1] of [[-d, 0], [L, L + d]]) top.fn((x) => W * p(x) * ph, { domain: [x0, x1], n: 30, color: 'red', width: 1.6, dash: [4, 3] });
          for (const x of [-d, L + d]) top.dot(x, 0, { r: 5, color: 'red', hollow: true, width: 2 });
          for (let q = 1; q < n; q++) top.dot((q * Le) / n - d, 0, { r: 4, color: 'red', hollow: true, width: 1.6 });
          top.text(`L = ${L < 1 ? v.fix(L * 100, 1) + ' cm' : v.fix(L, 3) + ' m'}`, L / 2, -R - 0.28, { align: 'center', color: 'ink', size: 12, weight: 600 });
          top.corner(`mode ${n}: ${v.fix(n * f, 1)} Hz, ${noteOf(M, n * f)} (slow motion)`, 'tl', { color: 'red', weight: 600 });
          if (voice && voice.playing) top.corner(`♪ ${v.fix(f, 1)} Hz`, 'tr', { color: 'gold', weight: 600 });
          // ---- the open end, true scale (units of the radius)
          const da = d / a;
          zm.hline(0, { color: 'faint', width: 1 });
          zm.rect(-4.5, 1, 0, 1.18, { fill: 'muted', fillAlpha: 0.5, stroke: false }); zm.rect(-4.5, -1.18, 0, -1, { fill: 'muted', fillAlpha: 0.5, stroke: false });
          if (endS.value === 'fl') { zm.rect(0, 1, 0.18, 2.3, { fill: 'muted', fillAlpha: 0.5, stroke: false }); zm.rect(0, -2.3, 0.18, -1, { fill: 'muted', fillAlpha: 0.5, stroke: false }); }
          for (const r0 of [0.9, 1.6, 2.3]) zm.curve((u) => [0.05 + r0 * Math.cos(u), r0 * Math.sin(u)], -1.25, 1.25, { color: 'accent', width: 1, alpha: 0.35, dash: [3, 4], n: 60 });
          // pressure amplitude along the axis near the end: sin(k(L + δ − x)) ≈ k(δ − u a): a straight line through zero at u = δ/a
          const slope = 0.17, pz = (u) => slope * (da - u);
          zm.fn(pz, { domain: [-4.5, 0], color: 'red', width: 2.6 });
          if (da > 0) zm.fn(pz, { domain: [0, da], color: 'red', width: 1.8, dash: [4, 3] });
          zm.dot(da, 0, { r: 6, color: 'red', hollow: true, width: 2.2 });
          if (da > 0) zm.measure(0, -1.55, da, -1.55, `δ = ${v.fix(da, 3)} a`, { color: 'red', math: false, size: 11.5, offset: -11 });
          zm.measure(-3.9, -1, -3.9, 0.98, '2a', { color: 'muted', size: 12, offset: 14 });
          zm.text('pressure amplitude on the axis', -3.3, 1.55, { align: 'left', color: 'red', size: 11 });
          zm.text(endS.value === 'none' ? 'idealized: node at the rim' : 'virtual node', da + 0.15, 0.35, { align: 'left', color: 'red', size: 11 });
          // ---- resonances on the keyboard
          const fs = M.range(NM, 1).map((q) => q * f), f0i = C_AIR / (2 * L), marks = new Map();
          fs.slice(0, 8).forEach((x, i) => marks.set(Math.round(M.freqToMidi(x)), i + 1 === n ? 'gold' : 'accent'));
          keyboard(sp, M, 40, 8000, -0.4, -0.08, marks);
          M.range(NM, 1).forEach((q) => { const x = q * f0i; if (x < 8000 && d > 0) sp.line(x, 0, x, 0.95, { color: 'muted', width: 1.2, dash: [3, 3], alpha: 0.6 }); });
          fs.forEach((x, i) => {
            if (x > 8000) return; const on = i + 1 === n, hgt = 0.35 + 0.6 / Math.sqrt(i + 1);
            sp.line(x, 0, x, hgt, { color: on ? 'gold' : 'accent', width: on ? 3.2 : 2.2 });
            if (i < 8 || (i + 1) % 2 === 0) sp.text(String(i + 1), x, hgt + 0.1, { align: 'center', color: on ? 'gold' : 'ink', size: 11, weight: on ? 700 : 500 });
          });
        }, { still: 0.6 });
        v.legend([['red', 'pressure standing wave; hollow dots: pressure nodes'], ['accent', 'resonances $nc/2L_{\\text{eff}}$'], ['muted', 'without end correction, $nc/2L$', { dash: true }]]);
        v.readout(() => {
          const L = Ls.value, a = as.value, d = dOf(), Le = Leff(), f = f1(), n = nS.value;
          const ideal = C_AIR / (2 * L), shift = 1200 * Math.log2(f / ideal);
          let ref = '';
          if (endS.value === 'unfl') {
            // Davies et al.'s frequency-dependent correction, solved self-consistently for mode n
            let fn = n * f; for (let it = 0; it < 30; it++) { const ka = (TAU * fn * a) / C_AIR; fn = (n * C_AIR) / (2 * (L + 2 * a * (END_UNFL - 0.1168 * ka * ka))); }
            let f1d = f; for (let it = 0; it < 30; it++) { const ka = (TAU * f1d * a) / C_AIR; f1d = C_AIR / (2 * (L + 2 * a * (END_UNFL - 0.1168 * ka * ka))); }
            const kan = (TAU * fn * a) / C_AIR;
            ref = kan < 0.5 ? ` · with the frequency-dependent correction $\\delta/a=0.6133-0.1168(ka)^2$, mode ${n} ($ka$ = ${v.fix(kan, 2)}) lies ${centsTxt(1200 * Math.log2(fn / (n * f1d)), 1)} from ${n} × the fundamental` : ` · mode ${n} has $ka$ = ${v.fix(kan, 2)} > 0.5, beyond the range of the refined formula: such a wide pipe is no longer a clean plane-wave resonator up there`;
          }
          return `$\\delta$ = ${v.fix(d * 1000, 2)} mm at each end, $L_{\\text{eff}}=L+2\\delta$ = ${v.fix(Le * 100, 2)} cm · $f_1=c/2L_{\\text{eff}}$ = ${v.fix(f, 2)} Hz (${noteOf(M, f)}), ${centsTxt(shift, 1)} from the bare $c/2L$ · resonances $f_n/f_1$ = ${M.range(6, 1).join(' : ')} … exactly, in the constant-$\\delta$ model${ref}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'The closed pipe: odd harmonics only',
      statement: String.raw`A cylinder of length $L$ closed at one end and open at the other has a pressure antinode at the closed end and a pressure node just beyond the open end, so it holds an odd number of quarter wavelengths:
$$f_n=\frac{(2n-1)\,c}{4L_{\text{eff}}},\qquad L_{\text{eff}}=L+\delta,\qquad n=1,2,3,\dots$$
Its resonances are the **odd harmonics** $1:3:5:7:\cdots$ of a fundamental $c/4L_{\text{eff}}$, about an octave below the open pipe of the same length (3.2). A steady tone that such a tube supports therefore has strong odd and weak even harmonics. This is the **clarinet**: a nearly cylindrical bore closed at the mouthpiece by the reed. It sounds about an octave lower than a flute of similar length, its low register has a hollow, square-wave-like timbre with the even harmonics far weaker than the odd ones, and it overblows not at the octave but at the **twelfth** (the third harmonic).`,
      idea: String.raw`The closed end reflects a pressure pulse unchanged and the open end reflects it inverted (3.1), so a pulse comes back upright after one round trip ($2L/c$) in an open pipe but upside down in a capped one, and needs a second round trip to repeat: the period doubles to $4L/c$. A signal that inverts every half period, $x(t+T/2)=-x(t)$, has Fourier coefficients $c_n(1-(-1)^n)/2$: the even harmonics cancel exactly (the same parity argument as the plucked string's missing harmonics, 2.8). With only one end open, $\delta$ is added once. A reed acts as a pressure-controlled valve, so it must sit at a pressure antinode: the reed end is effectively closed.`,
      caption: String.raw`Click the tube (or the switch) to **cap** its left end and pick a **sound source**: a tap on the end, breath noise, or a clarinet reed (which caps the tube itself). Everything below is computed from a waveguide simulation of the tube, a sampled version of d'Alembert's travelling waves (2.2). Middle: the pressure at the open end; after a tap you see the pulse return each round trip, inverted every second time when capped. Bottom: its spectrum, by FFT, on a grid of multiples of $c/4L_{\text{eff}}$: an open tube rings at the even lines, a capped one at the odd lines only. *Listen*, or compare open and capped directly.`,
      deps: ['music-3.1'],
      see: ['ling-1.8', 'music-7.17', 'music-11.12', 'music-2.8'],
      refs: ['Benson ch. 3', 'Rossing ch. 12'],
      tags: ['pipes', 'harmonics'],
      credit: 'Daniel Bernoulli, 1762; reed waveguide model: McIntyre, Schumacher & Woodhouse, 1983; J. O. Smith, 1986',
      scope: String.raw`An idealized cylinder: plane waves, a frequency-independent end correction and simple lumped losses. A real clarinet's even harmonics are weak but not absent (its bore is not perfectly cylindrical, it has tone holes and a flaring bell, and the reed is nonlinear), and above about 1.5 kHz the open tone holes let the even harmonics back in. The simulated reed is the reed-table model of physical-modelling synthesis, not a measured reed.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Clarinet#Acoustics' },
      viz(v) {
        const M = v.M, A = 0.0075, D = END_UNFL * A, NH = 13, NFFT = 8192;
        const Ls = v.slider('length $L$', 0.3, 1.0, 0.6, { step: 0.005, fmt: (x) => v.fix(x * 100, 1) + ' cm' });
        const capT = v.toggle('cap the left end', true);
        const src = v.select('sound source', [{ value: 'tap', label: 'tap the end' }, { value: 'breath', label: 'breath noise' }, { value: 'reed', label: 'reed (clarinet)' }], 'reed');
        const tb = v.stage({ x: [-0.07, 1.07], y: [-1.5, 1.5], height: 150, axes: false, full: true });
        const wf = v.stage({ x: [0, 1], y: [-1.25, 1.25], height: 150, axes: 'box', yticks: [], xlabel: 'time (ms)', full: true, title: 'pressure at the open end (simulated)' });
        const sp = v.stage({ x: [0, NH + 0.6], y: [-72, 8], height: 250, axes: 'box', xlabel: 'frequency in units of $c/4L_{\\text{eff}}$', xticks: M.range(NH, 1), yticks: [[0, '0 dB'], [-20, '−20'], [-40, '−40'], [-60, '−60']], full: true, title: 'spectrum of the simulated sound (FFT)' });
        tb.onClick(() => { if (src.value !== 'reed') capT.el.querySelector('input')?.click(); });
        const capped = () => src.value === 'reed' || capT.value;
        const fq = () => C_AIR / (4 * (Ls.value + D)), fo = () => C_AIR / (2 * (Ls.value + 2 * D));
        const sim = (closed, kind, dur) => (kind === 'reed' ? clarinetSim(fq(), dur) : closed ? tubeSim(2 * fq(), true, dur, kind) : tubeSim(fo(), false, dur, kind));
        let key = '', S = null;
        const run = () => {
          const k = [Ls.value, capped(), src.value].join(); if (k === key) return S; key = k;
          const closed = capped(), buf = sim(closed, src.value, src.value === 'tap' ? NFFT / SR + 0.01 : 0.45);
          const seg = src.value === 'tap' ? buf.subarray(0, NFFT) : buf.subarray(buf.length - NFFT);
          const spec = spectrumDB(M, seg, NFFT);
          // fundamental: the lowest spectral peak within 20 dB of the strongest
          let f0 = 0; const df = spec.df;
          for (let i = 3; i < spec.db.length / 4; i++) if (spec.db[i] > -20 && spec.db[i] >= spec.db[i - 1] && spec.db[i] >= spec.db[i + 1]) { const a = spec.db[i - 1], b = spec.db[i], c = spec.db[i + 1]; f0 = (i + (0.5 * (a - c)) / (a - 2 * b + c || 1)) * df; break; }
          const odd = [1, 3, 5].map((h) => levelAt(spec, h * f0)), even = [2, 4, 6].map((h) => levelAt(spec, h * f0));
          S = { closed, buf, seg, spec, f0, odd, even };
          return S;
        };
        const listen = (snd, closed, kind) => snd.samples(finish(sim(closed, kind, kind === 'tap' ? 1.2 : 1.6), 0.8, SR, 0.002, 0.08), SR, { gain: 0.55 });
        v.soundButton('Listen', (snd) => listen(snd, capped(), src.value));
        v.soundButton('open, then capped', (snd) => { const kind = src.value === 'reed' ? 'breath' : src.value, a = finish(sim(false, kind, 1.2), 0.8), b = finish(src.value === 'reed' ? sim(true, 'reed', 1.4) : sim(true, kind, 1.2), 0.8); snd.samples(join([a, b], 0.3), SR, { gain: 0.55 }); });
        v.render(() => {
          const R0 = run(), closed = R0.closed, reed = src.value === 'reed', L = Ls.value;
          capT.el.hidden = reed;
          // ---- the tube with its two lowest pressure modes
          const R = 0.8;
          drawTube(tb, 0, 1, R, R, { closedLeft: closed && !reed });
          if (reed) { // mouthpiece and reed: they close the tube
            tb.poly([[0, R], [-0.055, 0.45], [-0.055, -0.45], [0, -R]], { fill: 'muted', fillAlpha: 0.6, color: 'ink', width: 1.4 });
            tb.line(-0.05, -0.42, 0.0, -0.1, { color: 'gold', width: 3.5 });
            tb.text('reed', -0.06, -1.12, { align: 'left', color: 'gold', size: 11, weight: 600 });
          }
          for (const [q, col] of [[1, 'red'], [2, 'orange']]) {
            const k = closed ? ((2 * q - 1) * Math.PI) / 2 : q * Math.PI, P = (x) => (closed ? Math.cos(k * x) : Math.sin(k * x));
            tb.fn((x) => 0.62 * P(x), { domain: [0, 1], n: 120, color: col, width: 1.8, alpha: 0.85 });
          }
          tb.text(closed ? 'closed end: pressure antinode' : 'open end', 0.01, R + 0.38, { align: 'left', color: 'muted', size: 11 });
          tb.text('open end: pressure node', 0.99, R + 0.38, { align: 'right', color: 'muted', size: 11 });
          tb.corner(reed ? 'the reed closes the tube' : 'click the tube to cap or uncap it', 'br', { color: 'muted', size: 11 });
          // ---- waveform: four periods of the capped tube
          const Tq = 1 / fq(), win = 4 * Tq * 1000;
          wf.setView([0, win], [-1.25, 1.25]);
          const b = R0.buf, n0 = src.value === 'tap' ? 0 : b.length - Math.round((win / 1000) * SR) - 1, nW = Math.round((win / 1000) * SR);
          let mx = 1e-9; for (let i = 0; i < nW; i++) mx = Math.max(mx, Math.abs(b[n0 + i]));
          const pts = []; for (let i = 0; i < nW; i += 2) pts.push([(i / SR) * 1000, b[n0 + i] / mx]);
          wf.hline(0, { color: 'faint', width: 1 });
          wf.path(pts, { color: closed ? 'accent' : 'teal', width: 1.6 });
          const Tp = (closed ? Tq : 1 / fo()) * 1000;
          for (let q = 1; q * Tp < win; q++) wf.vline(q * Tp, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.6 });
          wf.setTitle(`pressure at the open end (simulated); dashed lines: one period, ${v.fix(Tp, 2)} ms = ${closed ? '4L/c' : '2L/c'}`);
          // ---- spectrum on the c/4L grid
          const S2 = R0.spec, fu = fq();
          for (let h = 1; h <= NH; h++) sp.line(h, -70, h, 6, { color: h % 2 ? 'green' : 'red', width: 1, dash: [3, 4], alpha: 0.45 });
          const curve = []; for (let i = 1; i < S2.db.length; i++) { const x = S2.freq[i] / fu; if (x > NH + 0.6) break; curve.push([x, Math.max(-71, S2.db[i])]); }
          sp.path(curve, { color: closed ? 'accent' : 'teal', width: 1.5 });
          for (let h = 1; h <= NH; h++) sp.text(h % 2 ? 'odd' : 'even', h, 3.5, { align: 'center', color: h % 2 ? 'green' : 'red', size: 9.5 });
          sp.setTitle(`spectrum of the simulated sound (FFT): ${closed ? 'capped, peaks on the odd lines only' : 'open, peaks on the even lines'}`);
        });
        v.legend([['accent', 'capped tube'], ['teal', 'open tube'], ['red', 'lowest pressure mode'], ['orange', 'second mode']]);
        v.readout(() => {
          const R0 = run(), closed = R0.closed, L = Ls.value, th = closed ? fq() : fo();
          const dEven = R0.even.reduce((a, b) => a + b, 0) / 3 - R0.odd.reduce((a, b) => a + b, 0) / 3;
          const name = src.value === 'reed' ? 'clarinet reed' : src.value === 'tap' ? 'tap' : 'breath noise';
          return `${closed ? 'capped' : 'open'} tube, $L$ = ${v.fix(L * 100, 1)} cm, radius 7.5 mm, ${name} · predicted fundamental ${closed ? `$c/4(L+\\delta)$` : `$c/2(L+2\\delta)$`} = ${v.fix(th, 1)} Hz (${noteOf(M, th)}); simulated ${v.fix(R0.f0, 1)} Hz (FFT resolution ${v.fix(R0.spec.df, 1)} Hz) · harmonics 2, 4, 6 of the sounding note lie on average ${v.fix(Math.abs(dEven), 1)} dB ${dEven < 0 ? 'below' : 'above'} harmonics 1, 3, 5${closed ? ': the even harmonics are missing' : ': all harmonics present'} · the capped tube's fundamental is ${v.fix(1200 * Math.log2(fo() / fq()), 0)} ¢ (about an octave) below the open tube's, and its next resonance is a twelfth (×3) above it`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Conical bores overblow at the octave',
      statement: String.raw`In a conical tube sound travels as spherical waves centred on the apex, $p(r,t)=\dfrac{\sin k(r_2-r)}{r}\cos\omega t$ for a cone open at distance $r_2$ from the apex. A **complete cone** of length $L$, closed (and pointed) at its apex and open at its wide end, therefore resonates at
$$f_n=\frac{n\,c}{2L},\qquad n=1,2,3,\dots,$$
the **full harmonic series**, like an open cylinder of the same length and an octave above a closed cylinder (3.3), even though its narrow end is closed. A **truncated** cone closed at its narrow end, a distance $x_1$ from the (missing) apex, resonates where
$$\tan kL=-k\,x_1 ,$$
which moves continuously from the odd series $kL=(2n-1)\pi/2$ of a cylinder ($x_1\to\infty$) to the full series $kL=n\pi$ of the complete cone ($x_1\to0$). So reed instruments with conical bores (oboe, bassoon, saxophone) overblow at the **octave**, while the cylindrical clarinet overblows at the **twelfth**.`,
      idea: String.raw`In a cone the wave equation for $rp$ is the one-dimensional wave equation, so $rp=A\sin k(r_2-r)$ vanishes at the open end as required. The closed end needs zero velocity, i.e. $\partial p/\partial r=0$ there; for the complete cone this holds automatically at $r=0$ (where $\sin(kr_2-kr)/r$ stays finite only if $\sin kr_2=0$), giving $kL=n\pi$. For a truncated cone, $\partial p/\partial r=0$ at $r=x_1$ gives $-kx_1\cos kL=\sin kL$, the equation above. The $1/r$ spreading is what changes the end condition: near the apex the pressure is almost uniform, so a closed tip behaves for the wave like an open end of a cylinder. Real conical instruments are truncated, but the reed and mouthpiece supply a cavity of about the volume of the missing tip, which restores the low resonances almost to the complete cone's (Benade's equivalent-volume rule).`,
      caption: String.raw`Drag the **taper** from a cylinder to a complete cone. Top: the bore, closed at its narrow left end, with dashed lines running back to the virtual apex; its interior is coloured by the pressure of the chosen mode (red above, blue below atmospheric), and the strip underneath plots that pressure along the axis, $\sin k(r_2-r)/r$. Bottom left: the first five resonances, in units of $c/4L$, as the taper changes; they slide from the odd numbers $1,3,5,\dots$ to the even numbers $2,4,6,\dots$, i.e. from odd harmonics to all harmonics of a fundamental an octave higher. Bottom right: the overblowing interval $f_2/f_1$ drops from a twelfth to an octave. *Low note, then overblown* plays $f_1$ and $f_2$.`,
      deps: ['music-3.3', 'music-3.2'],
      see: ['music-11.4', 'pde-6.1'],
      refs: ['Benson ch. 3'],
      tags: ['pipes', 'woodwinds'],
      credit: 'Daniel Bernoulli, 1762; Hermann von Helmholtz, 1863; Arthur Benade, 1959',
      scope: String.raw`Spherical waves in a rigid cone with an ideal open end (no end correction or radiation loss), small amplitudes and no wall losses. Real oboes, bassoons and saxophones are truncated cones with tone holes, flares and a reed cavity; the cavity makes their resonances nearly harmonic in the low register, as the complete-cone limit here suggests.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Acoustic_resonance#Cones' },
      viz(v) {
        const M = v.M, L = 0.6, NR = 5, NT = 161;
        const tS = v.slider('taper', 0, 1, 0.82, { step: 0.002, fmt: (x) => (x <= 0 ? 'cylinder' : x >= 1 ? 'complete cone' : `r₁/r₂ = ${v.fix(1 - x, 3)}`) });
        const nS = v.slider('mode shown $n$', 1, 4, 2, { int: true });
        const bore = v.stage({ x: [-0.3, 0.64], y: [-1.3, 1.4], height: 250, axes: false, full: true });
        const rc = v.stage({ x: [-0.09, 1.05], y: [0, 11.3], height: 260, axes: 'box', xticks: [[0, 'cylinder'], [0.5, 'taper 0.5'], [1, 'cone']], yticks: M.range(10, 1), weight: 1.25, title: 'resonances as the bore tapers, in units of c/4L' });
        const ob = v.stage({ x: [-0.09, 1.05], y: [1080, 2040], height: 260, axes: 'box', xticks: [[0, 'cylinder'], [1, 'cone']], yticks: [[1200, 'octave'], [1500, '1500 ¢'], [1702, 'minor 7th'], [1902, 'twelfth']], weight: 1, title: 'overblowing interval f₂/f₁ (cents)' });
        // n-th root of (1 − ρ) sin u + ρ u cos u = 0 in ((n − ½)π, nπ], ρ = r₁/r₂ (tan kL = −k x₁ with x₁ = Lρ/(1 − ρ))
        const root = (rho, n) => {
          const G = (u) => (1 - rho) * Math.sin(u) + rho * u * Math.cos(u);
          let a = (n - 0.5) * Math.PI, b = n * Math.PI; if (rho <= 0) return b; if (rho >= 1) return a;
          let ga = G(a); for (let i = 0; i < 60; i++) { const m = 0.5 * (a + b), gm = G(m); if (ga * gm <= 0) b = m; else { a = m; ga = gm; } }
          return 0.5 * (a + b);
        };
        const curves = M.range(NR, 1).map((n) => M.range(NT).map((i) => { const t = i / (NT - 1); return [t, (2 * root(1 - t, n)) / Math.PI]; }));
        const obc = M.range(NT).map((i) => { const t = i / (NT - 1); return [t, 1200 * Math.log2(root(1 - t, 2) / root(1 - t, 1))]; });
        const freqs = () => { const rho = 1 - tS.value; return M.range(NR, 1).map((n) => (root(rho, n) * C_AIR) / (TAU * L)); };
        const tone = (f) => [[f, 1], [2 * f, 0.45], [3 * f, 0.3], [4 * f, 0.18], [5 * f, 0.12]];
        v.soundButton('Low note, then overblown', (snd) => { const f = freqs(); snd.tone(tone(f[0]), { duration: 0.75, gain: 0.22, release: 0.1 }); snd.tone(tone(f[1]), { duration: 0.9, gain: 0.22, delay: 0.85 }); });
        v.soundButton('resonances 1 → 5', (snd) => { freqs().forEach((f, i) => snd.tone(f, { duration: 0.45, gain: 0.25, delay: 0.52 * i, release: 0.1 })); });
        v.animate((t) => {
          const tp = tS.value, rho = 1 - tp, x1 = rho >= 1 ? 1e9 : (L * rho) / (1 - rho), n = nS.value;
          const Y0 = 0.68, H2 = 0.58, rad = (x) => (rho >= 1 ? H2 : (H2 * (x1 + x)) / (x1 + L));
          // ---- bore (interior coloured by the pressure of the mode) and virtual apex
          const u = root(rho, n), k = u / L, pr = (x) => Math.sin(k * (L - x)) / (x1 + x + 1e-9);
          let pm = 0; for (let i = 0; i <= 200; i++) pm = Math.max(pm, Math.abs(pr((i / 200) * L)));
          const ph = Math.cos(TAU * 0.45 * t * Math.sqrt(u / Math.PI)), P = (x) => pr(x) / pm, sr = signedRamp(v), NB = 90;
          for (let b = 0; b < NB; b++) { const xa = (b * L) / NB, xb = ((b + 1) * L) / NB; bore.poly([[xa, Y0 + rad(xa)], [xb + 1e-4, Y0 + rad(xb)], [xb + 1e-4, Y0 - rad(xb)], [xa, Y0 - rad(xa)]], { fill: sr.col(P((xa + xb) / 2) * ph), fillAlpha: 1, stroke: false }); }
          if (x1 < 0.3) {
            bore.line(-x1, Y0, 0, Y0 + rad(0), { color: 'muted', width: 1.2, dash: [4, 4] }); bore.line(-x1, Y0, 0, Y0 - rad(0), { color: 'muted', width: 1.2, dash: [4, 4] });
            bore.dot(-x1, Y0, { r: 4, color: 'muted' });
            bore.text('apex', -x1, Y0 - 0.2, { align: 'center', color: 'muted', size: 11 });
          } else bore.text(rho >= 1 ? 'cylinder: no apex' : `apex ${v.fix(x1 * 100, 0)} cm to the left`, -0.02, Y0, { align: 'right', color: 'muted', size: 11 });
          bore.line(0, Y0 + rad(0), L, Y0 + H2, { color: 'ink', width: 2.2 }); bore.line(0, Y0 - rad(0), L, Y0 - H2, { color: 'ink', width: 2.2 });
          bore.rect(-0.012, Y0 - rad(0) - 0.03, 0, Y0 + rad(0) + 0.03, { fill: 'muted', fillAlpha: 0.9, stroke: false });
          bore.text('closed', -0.004, Y0 + Math.max(rad(0), 0.12) + 0.14, { align: 'right', color: 'muted', size: 11 });
          bore.text('open', L + 0.006, Y0, { align: 'left', color: 'muted', size: 11 });
          // ---- pressure on the axis, aligned below
          const G0 = -0.72, GA = 0.48;
          bore.hline(G0, { color: 'faint', width: 1 });
          bore.between((x) => G0 + GA * Math.abs(P(x)), (x) => G0 - GA * Math.abs(P(x)), 0, L, { fill: 'red', fillAlpha: 0.1, n: 240 });
          bore.fn((x) => G0 + GA * P(x) * ph, { domain: [0, L], n: 240, color: 'red', width: 2.4 });
          bore.text('pressure on the axis, sin k(r₂ − r)/r', 0.005, G0 + GA + 0.1, { align: 'left', color: 'red', size: 11 });
          bore.corner(`mode ${n}: kL = ${v.fix(u, 4)} (${v.fix(u / Math.PI, 3)} π)`, 'tl', { color: 'red', weight: 600 });
          // ---- resonance curves
          for (let q = 1; q <= 10; q++) rc.hline(q, { color: q % 2 ? 'green' : 'teal', width: 1, alpha: 0.25 });
          curves.forEach((c, i) => rc.path(c, { color: i + 1 === n ? 'red' : 'accent', width: i + 1 === n ? 2.6 : 1.8 }));
          rc.vline(tp, { color: 'gold', width: 1.4, dash: [4, 3] });
          M.range(NR, 1).forEach((q) => rc.dot(tp, (2 * root(rho, q)) / Math.PI, { r: 4.5, color: q === n ? 'red' : 'accent' }));
          rc.text('odd: 1, 3, 5, …', 0.04, 10.75, { align: 'left', color: 'green', size: 11, weight: 600 });
          rc.text('even: 2, 4, 6, …', 0.96, 10.75, { align: 'right', color: 'teal', size: 11, weight: 600 });
          // ---- overblowing interval
          ob.hline(1200, { color: 'teal', width: 1, dash: [4, 3] }); ob.hline(1902, { color: 'green', width: 1, dash: [4, 3] });
          ob.path(obc, { color: 'accent', width: 2.2 });
          const iv = 1200 * Math.log2(root(rho, 2) / root(rho, 1));
          ob.dot(tp, iv, { r: 6, color: 'gold' });
          ob.text('clarinet', 0.2, 1960, { align: 'left', color: 'green', size: 11 });
          ob.text('oboe, saxophone', 0.97, 1145, { align: 'right', color: 'teal', size: 11 });
        }, { still: 0.6 });
        v.legend([['red', 'pressure of the chosen mode'], ['accent', 'resonances (roots of tan kL = −k x₁)'], ['gold', 'this bore', { dot: true }]]);
        v.readout(() => {
          const tp = tS.value, rho = 1 - tp, x1 = rho >= 1 ? Infinity : (L * rho) / (1 - rho), f = freqs(), iv = 1200 * Math.log2(f[1] / f[0]);
          const name = Math.abs(iv - 1902) < 15 ? 'a twelfth, like the clarinet' : Math.abs(iv - 1200) < 15 ? 'an octave, like the oboe and saxophone' : `between a twelfth (1902 ¢) and an octave (1200 ¢)`;
          return `$L$ = 60 cm, $r_1/r_2$ = ${v.fix(rho, 3)}, apex distance $x_1$ = ${isFinite(x1) ? v.fix(x1 * 100, 1) + ' cm' : '∞'} · resonances ${f.map((x) => v.fix(x, 1)).join(', ')} Hz, ratios $f_n/f_1$ = ${f.map((x) => v.fix(x / f[0], 3)).join(' : ')} · overblows by ${v.fix(iv, 0)} ¢: ${name} · lowest note ${noteOf(M, f[0])}, ${centsTxt(1200 * Math.log2(f[0] / (C_AIR / (4 * L))), 0)} from the closed cylinder's $c/4L$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Model',
      name: 'Brass instruments: flaring bell and mouthpiece',
      statement: String.raw`A brass instrument is a long, mostly cylindrical tube closed at one end by the player's lips (a pressure-controlled valve, so a pressure antinode, as for a reed) and ending in a flaring **bell**, with a **mouthpiece** (a cup, a narrow throat and a conical backbore) at the lips. A plain closed cylinder of the same length would resonate at the odd series $1:3:5:7:\cdots$ (3.3). The bell and the mouthpiece move these resonances, which are the maxima of the input impedance $|Z_{\text{in}}(f)|$ at the lips, into an almost complete harmonic series $2f_0, 3f_0, 4f_0, \dots$ of a fundamental $f_0$ that is not itself a resonance: the lowest resonance lies far below $f_0$ and plays no part. The player selects a resonance with lip tension and buzzes at its frequency, so a valveless bugle or natural trumpet plays the notes $2f_0,3f_0,\dots,8f_0$ (bugle calls use $3f_0$ to $6f_0$). The **pedal note** $f_0$ can still be played, held up by the harmonics $2f_0,3f_0,\dots$ that fall on resonances.`,
      idea: String.raw`A flare reflects a wave where its curvature becomes comparable to the wavelength: low frequencies turn back early, deep inside the bell, high frequencies travel almost to the rim. So the bell shortens the acoustic length most for the lowest resonances and raises them most, compressing the odd ladder from below (Webster's horn equation, solved here as a chain of short tubes). The mouthpiece adds a small volume of air (a compliance) behind a narrow throat (an inertance): a Helmholtz resonator, tuned near 700–900 Hz in a trumpet, that adds effective length to resonances near and below its own frequency, lowering the upper resonances into line. Together they turn $1:3:5:7:9$ into roughly $0.7:2:3:4:5:6:7:8$. Above the bell's cut-off (where the bell radius is about $c/2\pi f$) waves escape and the peaks fade: the trumpet's top register is held up by the player more than by the bore.`,
      caption: String.raw`Grow the **bell** and the **mouthpiece** from a plain closed cylinder (both at 0) to a trumpet-like bore (both at 100 %). Top: the bore, straightened, with its radius magnified. Middle: the input impedance at the lips, computed by transfer matrices for 300 short tube segments with wall losses and a radiating bell; numbered peaks are the resonances, the grey dashed lines the plain cylinder's, and the green dashes the best harmonic series $nf_0$ through resonances 2–8. Bottom: how far each resonance lies from $nf_0$, in cents. Play the resonances, or the opening of *Taps* on resonances 3–6: it only sounds right once the resonances are harmonic.`,
      deps: ['music-3.3', 'music-3.4', 'music-2.6'],
      see: ['music-11.12', 'music-11.4', 'waves-1.10', 'music-11.3'],
      refs: ['Benson ch. 3'],
      tags: ['brass', 'pipes'],
      credit: 'Henri Bouasse, 1929; Arthur Benade, 1973; impedance measurements: Backus, 1976',
      scope: String.raw`A one-dimensional plane-wave model (the bell's mouth flares too fast for it to be exact), with visco-thermal wall losses $\alpha\approx2.96\times10^{-5}\sqrt f/r$ m⁻¹ and a baffled-piston load at the bell. The dimensions are typical of a B♭ trumpet (1.34 m of tubing, 11.6 mm bore, 12.4 cm bell, a Bessel-horn flare $r\propto(x_0-x)^{-1/2}$ over the last 55 cm) but this is not a measured instrument; valves, bends and the lips' own mechanics are left out.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Brass_instrument_acoustics' },
      viz(v) {
        const M = v.M, LT = 1.34, RC = 0.0058, RB = 0.062, LB = 0.55, GAM = 0.5, LMP = 0.088, LLP = 0.25, NSEG = 300, FA = 20, FB = 1400, NF = 560;
        const pct = (x) => Math.round(x * 100) + ' %';
        const bS = v.slider('flaring bell', 0, 1, 1, { step: 0.01, fmt: pct });
        const mS = v.slider('mouthpiece and leadpipe', 0, 1, 1, { step: 0.01, fmt: pct });
        v.button('closed cylinder', () => { bS.set(0); mS.set(0); });
        v.button('trumpet-like bore', () => { bS.set(1); mS.set(1); });
        const s0 = LB / (Math.pow(RB / RC, 1 / GAM) - 1);
        const radius = (x, bell, mp) => {
          let r = RC; const sb = x - (LT - LB);
          if (sb > 0) r = RC + bell * (RC * Math.pow((s0 + LB) / (s0 + LB - sb), GAM) - RC);
          if (x < LMP + LLP) {
            let rm;
            if (x < 0.008) rm = 0.0082; else if (x < 0.013) rm = 0.0082 + ((0.00185 - 0.0082) * (x - 0.008)) / 0.005; else if (x < 0.018) rm = 0.00185;
            else if (x < LMP) rm = 0.00185 + ((0.0045 - 0.00185) * (x - 0.018)) / (LMP - 0.018); else rm = 0.0045 + ((RC - 0.0045) * (x - LMP)) / LLP;
            r += mp * (rm - r);
          }
          return r;
        };
        const cache = new Map();
        const analyse = (bell, mp) => {
          const k = bell.toFixed(3) + '|' + mp.toFixed(3); if (cache.has(k)) return cache.get(k);
          const xs = [], rs = [];
          for (let i = 0; i <= NSEG; i++) { const t = i / NSEG, x = LT * (t < 0.12 ? t * t / 0.24 : t - 0.06) / 0.94; xs.push(x); rs.push(radius(x, bell, mp)); } // finer near the mouthpiece
          const { F, A } = boreSweep(xs, rs, FA, FB, NF), P = peaksOf(F, A).slice(0, 10);
          const fs = P.map((p) => p.f); let num = 0, den = 0; for (let q = 2; q <= Math.min(8, fs.length); q++) { num += fs[q - 1] * q; den += q * q; }
          const f0 = den ? num / den : fs[0];
          const out = { xs, rs, F, A, P, fs, f0, dev: fs.map((f, i) => 1200 * Math.log2(f / ((i + 1) * f0))) };
          if (cache.size > 60) cache.clear(); cache.set(k, out); return out;
        };
        const base = analyse(0, 0);
        const pr = v.stage({ x: [-0.03, 1.39], y: [-72, 72], height: 185, axes: 'box', xlabel: 'distance from the lips (m)', ylabel: 'radius (mm)', yticks: [-50, 0, 50], full: true, title: 'the bore, straightened (radius magnified)' });
        const zp = v.stage({ x: [0, FB], y: [-25, 50], height: 250, axes: 'box', xlabel: 'frequency (Hz)', ylabel: '$|Z_{\\text{in}}|$ (dB re $\\rho c/S$)', yticks: [-20, 0, 20, 40], full: true, title: 'input impedance at the lips: its peaks are the notes the lips can lock onto' });
        const dv = v.stage({ x: [0.4, 10.6], y: [-130, 130], height: 210, axes: 'box', xlabel: 'resonance number n', ylabel: 'cents from $n f_0$', xticks: M.range(10, 1), yticks: [-100, -50, 0, 50, 100], full: true });
        const BRASS = (f) => M.range(10, 1).map((h) => [h * f, Math.pow(h, -0.75)]);
        const ph = playhead(v); let playIdx = null;
        v.soundButton('resonances 1 → 8', (snd) => { const R = analyse(bS.value, mS.value); R.fs.slice(0, 8).forEach((f, i) => snd.tone(BRASS(f), { duration: 0.42, gain: 0.2, delay: 0.5 * i, attack: 0.03, release: 0.08 })); playIdx = 'all'; ph.start(4, 'seq'); });
        const TAPS = [[3, 0.45], [3, 0.15], [4, 1.0], [3, 0.45], [4, 0.15], [5, 1.0], [3, 0.45], [4, 0.15], [5, 0.65], [3, 0.45], [4, 0.15], [5, 0.65], [3, 0.45], [4, 0.15], [5, 1.2]];
        v.soundButton('Taps on resonances 3–6', (snd) => {
          const R = analyse(bS.value, mS.value); let t0 = 0;
          for (const [q, d] of TAPS) { const f = R.fs[q - 1]; if (f) snd.tone(BRASS(f), { duration: d * 0.92, gain: 0.2, delay: t0, attack: 0.035, release: 0.06 }); t0 += d; }
          playIdx = null; ph.start(t0, 'taps');
        });
        v.render(() => {
          const R = analyse(bS.value, mS.value);
          // ---- the bore
          const top = R.xs.map((x, i) => [x, R.rs[i] * 1000]);
          pr.poly([...top, ...top.slice().reverse().map(([x, y]) => [x, -y])], { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 1.6 });
          pr.path(base.xs.map((x, i) => [x, base.rs[i] * 1000]), { color: 'muted', width: 1, dash: [4, 4] });
          pr.rect(-0.012, -9, 0, 9, { fill: 'muted', fillAlpha: 0.9, stroke: false });
          pr.text('lips', -0.004, 15, { align: 'left', color: 'muted', size: 11 });
          if (mS.value > 0.15) pr.text('mouthpiece', 0.012, -20, { align: 'left', color: 'muted', size: 11 });
          pr.text('cylindrical tubing', 0.6, 18, { align: 'center', color: 'muted', size: 11 });
          if (bS.value > 0.15) pr.text('bell', 1.33, 52, { align: 'right', color: 'muted', size: 11 });
          // ---- impedance curve
          const Zc = (RHO * C_AIR) / (Math.PI * RC * RC), dB = (a) => 20 * Math.log10(a / Zc);
          base.fs.forEach((f) => zp.line(f, -25, f, 50, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.55 }));
          for (let q = 1; q * R.f0 <= FB; q++) zp.line(q * R.f0, -25, q * R.f0, 50, { color: 'green', width: 1.2, dash: [6, 4], alpha: 0.6 });
          zp.path(Array.from(R.F, (f, j) => [f, M.clamp(dB(R.A[j]), -25, 50)]), { color: 'accent', width: 2 });
          R.P.forEach((p, i) => { const y = Math.min(46, dB(p.a) + 3.5); zp.dot(p.f, dB(p.a), { r: 3.5, color: i === 0 && R.dev[0] < -60 ? 'red' : 'accent' }); zp.text(String(i + 1), p.f, y, { align: 'center', baseline: 'bottom', color: 'ink', size: 11, weight: 600 }); });
          zp.corner(`f₀ = ${v.fix(R.f0, 1)} Hz (${noteOf(M, R.f0, true)})`, 'tr', { color: 'green', weight: 600 });
          // ---- deviation from the harmonic series
          dv.hband(-25, 25, { color: 'green', alpha: 0.1 });
          dv.hline(0, { color: 'faint', width: 1 });
          R.dev.forEach((d, i) => {
            const n = i + 1, col = Math.abs(d) < 25 ? 'green' : Math.abs(d) < 60 ? 'orange' : 'red', y = M.clamp(d, -125, 125);
            dv.rect(n - 0.3, 0, n + 0.3, y, { fill: col, fillAlpha: 0.7, stroke: false });
            if (Math.abs(d) > 125) dv.text(`${d > 0 ? '+' : '−'}${Math.round(Math.abs(d))} ¢`, n, d > 0 ? 112 : -112, { align: 'center', color: 'red', size: 10.5, weight: 600, plate: true });
          });
          dv.corner('green band: within ±25 ¢', 'tr', { color: 'green', size: 11 });
        });
        v.legend([['accent', 'impedance peaks: resonances'], ['muted', 'plain closed cylinder', { dash: true }], ['green', 'harmonic series $n f_0$', { dash: true }], ['orange', 'the bore']]);
        v.readout(() => {
          const R = analyse(bS.value, mS.value), fs = R.fs, up = fs.slice(1, 8), rms = Math.sqrt(R.dev.slice(1, 8).reduce((a, d) => a + d * d, 0) / Math.max(1, up.length));
          const cyl = base.fs.slice(0, 5).map((f) => v.fix(f / base.fs[0], 2)).join(' : ');
          return `resonances ${fs.slice(0, 8).map((f) => v.fix(f, 0)).join(', ')} Hz · ratios to $f_0$ = ${v.fix(R.f0, 1)} Hz: ${fs.slice(0, 8).map((f) => v.fix(f / R.f0, 2)).join(' : ')} · resonances 2–8 lie within ${v.fix(Math.max(...R.dev.slice(1, 8).map(Math.abs)), 0)} ¢ of $nf_0$ (rms ${v.fix(rms, 0)} ¢) · the lowest resonance sits at ${v.fix(fs[0] / R.f0, 2)} $f_0$${Math.abs(R.dev[0]) > 60 ? ', off the series: the pedal note $f_0$ is held up by resonances 2, 3, 4 … instead' : ''} · the plain closed cylinder: ${cyl} (odd)`;
        });
      },
    },
  ],
};
