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
 * visco-thermal wall loss k = ω/c − iα, α = (ω/2)^{1/2}... ≈ 2.96·10⁻⁵ √f / r (1/m, r in m); a baffled-piston load at the open end.
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
  ],
};
