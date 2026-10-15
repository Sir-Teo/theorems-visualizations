// Quantum Mechanics — Chapter 3: Quantum mechanics in one dimension (items 3.11–3.20)
//
// Numerical notes:
// - Bessel functions for the 2D well (3.12) use the polynomial approximations of Abramowitz & Stegun 9.4.1, 9.4.4 (J₀, J₁ for
//   |x| ≤ 3, error < 5·10⁻⁸) and 9.8.1–9.8.8 (I₀, I₁, K₀, K₁, relative error < 2·10⁻⁷).
// - Smooth step R(k) (3.14): exact result for V = V₀/(1 + e^{−x/a}) (Landau & Lifshitz §25, problem 3),
//   R = [sinh πa(k − k′) / sinh πa(k + k′)]²; the tanh step V₀(1 + tanh(x/w))/2 is this with a = w/2.
// - Ammonia inversion splitting (3.17): 0.79 cm⁻¹ ≈ 9.8·10⁻⁵ eV, the 23.79 GHz line of the NH₃ maser.
import { TAU, normSq, probIn, interp, phaseLUT, drawPsi, drawReal, phaseWheel, levelDiagram, numerov, scatter, scatterWave, sliceV, slab, mul2, stackMatrix, clockSim, fz, sub, FAMILY } from './ch03.shared.js';

const GAMMA = 0.5772156649015329;
/** Bessel J₀, J₁ for 0 ≤ x ≤ 3 (A&S 9.4.1, 9.4.4) — enough for the ground state of a disc (z < j₀,₁ ≈ 2.405). */
const J0 = (x) => { const t = (x / 3) ** 2; return 1 + t * (-2.2499997 + t * (1.2656208 + t * (-0.3163866 + t * (0.0444479 + t * (-0.0039444 + t * 0.00021))))); };
const J1 = (x) => { const t = (x / 3) ** 2; return x * (0.5 + t * (-0.56249985 + t * (0.21093573 + t * (-0.03954289 + t * (0.00443319 + t * (-0.00031761 + t * 0.00001109)))))); };
const I0 = (x) => { const t = (x / 3.75) ** 2; return 1 + t * (3.5156229 + t * (3.0899424 + t * (1.2067492 + t * (0.2659732 + t * (0.0360768 + t * 0.0045813))))); };
const I1 = (x) => { const t = (x / 3.75) ** 2; return x * (0.5 + t * (0.87890594 + t * (0.51498869 + t * (0.15084934 + t * (0.02658733 + t * (0.00301532 + t * 0.00032411)))))); };
/** Modified Bessel K₀, K₁ for x > 0 (A&S 9.8.5–9.8.8). */
const K0 = (x) => {
  if (x <= 2) { const t = (x / 2) ** 2; return -Math.log(x / 2) * I0(x) - GAMMA + t * (0.4227842 + t * (0.23069756 + t * (0.0348859 + t * (0.00262698 + t * (0.0001075 + t * 0.0000074))))); }
  const u = 2 / x; return (Math.exp(-x) / Math.sqrt(x)) * (1.25331414 + u * (-0.07832358 + u * (0.02189568 + u * (-0.01062446 + u * (0.00587872 + u * (-0.0025154 + u * 0.00053208))))));
};
const K1 = (x) => {
  if (x <= 2) { const t = (x / 2) ** 2; return (x * Math.log(x / 2) * I1(x) + 1 + t * (0.15443144 + t * (-0.67278579 + t * (-0.18156897 + t * (-0.01919402 + t * (-0.00110404 - t * 0.00004686)))))) / x; }
  const u = 2 / x; return (Math.exp(-x) / Math.sqrt(x)) * (1.25331414 + u * (0.23498619 + u * (-0.0365562 + u * (0.01504268 + u * (-0.00780353 + u * (0.00325614 - u * 0.00068245))))));
};
/** Bisection on a log scale for a root of f with f(lo) > 0 > f(hi). */
function logBisect(f, lo, hi, it = 220) {
  let a = Math.log(lo), b = Math.log(hi);
  for (let i = 0; i < it; i++) { const m = (a + b) / 2; if (f(Math.exp(m)) > 0) a = m; else b = m; }
  return Math.exp((a + b) / 2);
}
/** Ordinary bisection for f(lo) < 0 < f(hi) (or the reverse). */
function bisect(f, lo, hi, it = 80) {
  let a = lo, b = hi, fa = f(a);
  for (let i = 0; i < it; i++) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; }
  return (a + b) / 2;
}
/** Bound states of the finite square well (half-width a, depth V0; ħ = m = 1), as {z, w, even, n} with z = ka, w = κa. */
function wellRoots(z0) {
  const out = [];
  for (let j = 0; (j * Math.PI) / 2 < z0; j++) {
    const even = j % 2 === 0, lo = (j * Math.PI) / 2 + 1e-12, hi = Math.min(((j + 1) * Math.PI) / 2 - 1e-12, z0);
    const f = (z) => (even ? z * Math.tan(z) : -z / Math.tan(z)) - Math.sqrt(Math.max(0, z0 * z0 - z * z));
    if (!(f(lo) < 0 && f(hi) > 0)) continue;
    const z = bisect(f, lo, hi, 70);
    out.push({ z, w: Math.sqrt(Math.max(0, z0 * z0 - z * z)), even, n: j + 1 });
  }
  return out;
}
/** Normalized finite-well eigenfunction (half-width a) of a root r, as a function of x. */
function wellPsi(r, a) {
  const k = r.z / a, kap = r.w / a, c0 = r.even ? Math.cos(r.z) : Math.sin(r.z);
  const N2 = 2 * (a / 2 + (r.even ? 1 : -1) * Math.sin(2 * r.z) / (4 * k) + (c0 * c0) / (2 * kap)), c = 1 / Math.sqrt(N2);
  const f = (X) => (Math.abs(X) <= a ? c * (r.even ? Math.cos(k * X) : Math.sin(k * X)) : c * c0 * (r.even ? 1 : Math.sign(X)) * Math.exp(-kap * (Math.abs(X) - a)));
  f.pOut = (c * c * c0 * c0) / kap; // probability outside the well
  return f;
}
/** Uniform periodic grid for the split-step packet simulations. */
function pgrid(x0, x1, n) { const dx = (x1 - x0) / n; return { x: Float64Array.from({ length: n }, (_, i) => x0 + i * dx), dx, n }; }
/** Gaussian packet on a grid (Float64Arrays), normalized. */
function gpacket(x, dx, x0, s, k0) {
  const n = x.length, re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) { const a = Math.exp(-((x[i] - x0) ** 2) / (4 * s * s)), ph = k0 * (x[i] - x0); re[i] = a * Math.cos(ph); im[i] = a * Math.sin(ph); }
  const N = Math.sqrt(normSq(re, im, dx)); for (let i = 0; i < n; i++) { re[i] /= N; im[i] /= N; }
  return { re, im };
}
/** Average of g(k) over the momentum distribution |φ(k)|² of a Gaussian packet (centre k0, width σ_k). */
function packetAverage(g, k0, sk, n = 240) {
  let s = 0, w = 0;
  for (let i = 0; i <= n; i++) { const k = k0 + sk * (-6 + (12 * i) / n); if (k <= 0) continue; const p = Math.exp(-((k - k0) ** 2) / (2 * sk * sk)); s += p * g(k); w += p; }
  return s / w;
}
/** sinh(A)/sinh(B) for 0 < A ≤ B without overflow. */
const sinhRatio = (A, B) => Math.exp(A - B) * (-Math.expm1(-2 * A)) / (-Math.expm1(-2 * B));
/** Draw a bisection log row: the digits shared by lo and hi in green, the rest muted. */
function digitRow(s, X, Y, str, common, size = 12) {
  const c = s.ctx; c.save(); c.font = `500 ${size}px "JetBrains Mono", ui-monospace, monospace`; c.textBaseline = 'middle';
  c.fillStyle = s.rt ? '' : ''; c.restore();
  const head = str.slice(0, common), tail = str.slice(common);
  c.save(); c.font = `600 ${size}px "JetBrains Mono", ui-monospace, monospace`; c.textBaseline = 'middle';
  const w = c.measureText(head).width; c.restore();
  return { head, tail, w };
}

export default {
  collection: 'qm',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Model',
      name: 'Finite square well',
      statement: String.raw`Let $V=-V_0$ for $|x|<a$ and $V=0$ outside ($V_0>0$). Bound states have $-V_0<E<0$; with
$$k=\frac{\sqrt{2m(E+V_0)}}{\hbar},\quad \kappa=\frac{\sqrt{-2mE}}{\hbar},\quad z=ka,\quad z_0=\frac{a\sqrt{2mV_0}}{\hbar},\quad (ka)^2+(\kappa a)^2=z_0^2,$$
they alternate in parity: even states $\cos kx$ inside satisfy $z\tan z=\sqrt{z_0^2-z^2}$, odd states $\sin kx$ satisfy $-z\cot z=\sqrt{z_0^2-z^2}$, and outside the well both decay as $e^{-\kappa|x|}$ — the particle is found in the classically forbidden region with nonzero probability. There are exactly $\lceil 2z_0/\pi\rceil$ bound states (always at least one); a new one appears, at $E=0$, each time $z_0$ passes a multiple of $\pi/2$. As $z_0\to\infty$ the low levels approach those of the infinite well of width $2a$, $E_n+V_0\to n^2\pi^2\hbar^2/2m(2a)^2$, from below.`,
      scope: String.raw`A model for quantum wells in semiconductor heterostructures, nucleons in a nucleus, and any short-range attraction with a sharp edge.`,
      idea: String.raw`Solve in each region — oscillating inside, exponential outside (only the decaying one is normalizable) — and match $\psi$ and $\psi'$ at $x=\pm a$; dividing the two conditions gives the logarithmic-derivative condition $k\tan ka=\kappa$ (even) or $-k\cot ka=\kappa$ (odd). Multiplying by $a$ turns it into the intersection of the branches $z\tan z$, $-z\cot z$ with the quarter circle of radius $z_0$, because $z^2+(\kappa a)^2=z_0^2$. Each branch rises from $0$ to $+\infty$ across an interval of length $\pi/2$, so the circle meets one branch per interval it reaches: $\lceil 2z_0/\pi\rceil$ crossings. For a deep well, $\kappa a$ is large on low levels, $\tan z\to\infty$, so $z\to(n-\tfrac12)\pi$ or $n\pi$... more precisely $ka\to n\pi/2$, the box condition; the finite depth lets the wave leak a distance $1/\kappa$ and so lowers each level.`,
      caption: String.raw`Set the **depth** and **half-width**. Left: the graphical solution — the quarter circle of radius $z_0$ (green) meets the even branches $z\tan z$ (blue) and odd branches $-z\cot z$ (orange) once per quarter-period it reaches; each gold dot is a bound state. Right: the well with those levels and their wave functions, tails leaking into the shaded forbidden region; dashed red lines are the levels of an infinitely deep box of the same width, which the levels approach from below as the well deepens. Bottom: the levels against $z_0$ — deepen the well and new states enter one at a time at $E=0$.`,
      deps: ['qm-3.3'],
      see: ['qm-3.10', 'qm-3.12', 'cm-4.9'],
      refs: ['Griffiths §2.6'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Finite_potential_well' },
      tags: ['finite square well', 'bound states', 'graphical solution'],
      viz(v) {
        const V0s = v.slider('depth $V_0$', 0.2, 20, 6, { log: true, sig: 3 });
        const as = v.slider('half-width $a$', 0.5, 2, 1, { step: 0.01 });
        const sG = v.stage({ x: [0, 6], y: [0, 6], equal: true, height: 330, axes: 'box', weight: 1, xlabel: 'z', title: '$z\\tan z$ (even), $-z\\cot z$ (odd), circle $\\sqrt{z_0^2-z^2}$' });
        const sD = v.stage({ x: [-3, 3], y: [-1, 0.3], height: 330, axes: 'box', weight: 1, xlabel: 'x', ylabel: 'E', title: 'levels and wave functions (dashed: infinitely deep box)' });
        const sF = v.stage({ x: [0, 13], y: [-1.04, 0.04], height: 170, axes: 'box', full: true, xlabel: 'z₀', ylabel: 'E / V₀', title: 'levels against the strength $z_0=a\\sqrt{2mV_0}/\\hbar$' });
        const ZG = []; for (let i = 1; i <= 650; i++) { const z0 = (13 * i) / 650; ZG.push([z0, wellRoots(z0).map((r) => -(r.w * r.w) / (z0 * z0))]); }
        const NX = 701;
        let st = null;
        v.render(() => {
          const col = phaseLUT(v), V0 = V0s.value, a = as.value, z0 = a * Math.sqrt(2 * V0), R = wellRoots(z0), N = R.length;
          // graphical solution
          const zm = Math.max(2.2, z0 * 1.12); sG.setView([0, zm], [0, zm]);
          for (let j = 0; (j * Math.PI) / 2 < zm; j++) {
            const even = j % 2 === 0, lo = (j * Math.PI) / 2, hi = ((j + 1) * Math.PI) / 2;
            sG.clip(() => sG.fn((z) => (even ? z * Math.tan(z) : -z / Math.tan(z)), { domain: [lo + 1e-3, hi - 1e-3], color: even ? 'accent' : 'orange', width: 2.2 }));
            if (hi < zm) sG.vline(hi, { color: 'faint', dash: [3, 4], width: 1 });
          }
          sG.fn((z) => Math.sqrt(Math.max(0, z0 * z0 - z * z)), { domain: [0, z0], color: 'green', width: 2.6 });
          R.forEach((r) => sG.dot(r.z, r.w, { r: 5.5, color: 'gold', label: String(r.n), labelPos: 'ne' }));
          sG.corner(`z₀ = ${v.fix(z0, 3)}: ${N} crossing${N === 1 ? '' : 's'}`, 'tl', { color: 'green', weight: 600 });
          // level diagram
          const wmin = Math.min(...R.map((r) => r.w)), half = Math.min(4.5 * a, a + (3.2 * a) / Math.max(wmin, 0.35));
          const x = Float64Array.from({ length: NX }, (_, i) => -half + (2 * half * i) / (NX - 1)), Vg = Float64Array.from(x, (X) => (Math.abs(X) < a ? -V0 : 0));
          const E = R.map((r) => -(r.w * r.w) / (2 * a * a)), psi = R.map((r) => { const f = wellPsi(r, a); return Float64Array.from(x, f); });
          let pmax = 0; for (const p of psi) for (const y of p) pmax = Math.max(pmax, Math.abs(y));
          const sp = N > 1 ? (E[N - 1] - E[0]) / (N - 1) : 0.4 * V0, amp = (0.4 * Math.min(sp, 0.4 * V0)) / pmax;
          sD.setView([-half, half], [-1.08 * V0, 0.24 * V0]);
          for (let n = 1; n < 40; n++) { const Eb = (n * n * Math.PI * Math.PI) / (2 * 4 * a * a) - V0; if (Eb > 0.22 * V0) break; sD.line(-a, Eb, a, Eb, { color: 'red', width: 1.2, dash: [5, 4], alpha: 0.7 }); }
          levelDiagram(sD, { x, V: Vg, E, psi, col, amp, label: (i) => `n=${i + 1}  E/V₀ = ${v.fix(E[i] / V0, 3)}` });
          // spectral flow
          for (let n = 0; n < 9; n++) sF.path(ZG.map(([q, Es]) => (Es[n] != null ? [q, Es[n]] : null)), { color: FAMILY[n % FAMILY.length], width: 2 });
          for (let n = 1; n <= 8; n++) sF.vline((n * Math.PI) / 2, { color: 'faint', dash: [3, 4], width: 1 });
          sF.vline(Math.min(z0, 13), { color: 'gold', width: 1.6 });
          R.forEach((r, i) => sF.dot(Math.min(z0, 13), E[i] / V0, { r: 5, color: 'gold' }));
          const f0 = wellPsi(R[0], a), box1 = (Math.PI * Math.PI) / (8 * a * a);
          st = { z0, N, pred: Math.ceil((2 * z0) / Math.PI), E, V0, pOut: f0.pOut, box1, kap: R[0].w / a };
        });
        v.legend([['accent', 'even branch z tan z'], ['orange', 'odd branch −z cot z'], ['green', 'circle of radius z₀'], ['red', 'infinitely deep box', { dash: true }]]);
        v.readout(() => st && `$z_0 = ${v.fix(st.z0, 3)}$: **${st.N}** bound state${st.N === 1 ? '' : 's'}, and $\\lceil 2z_0/\\pi\\rceil = ${st.pred}$ ${st.N === st.pred ? '✓' : '✗'} · $E_n/V_0$ = ${st.E.slice(0, 5).map((e) => v.fix(e / st.V0, 4)).join(', ')}${st.N > 5 ? ', …' : ''} · ground state: $E_1+V_0 = ${v.fix(st.E[0] + st.V0, 4)}$ vs the box's ${v.fix(st.box1, 4)} (always lower) · probability of finding it outside the well: **${v.fix(100 * st.pOut, 2)} %**, decay length $1/\\kappa = ${v.fix(1 / st.kap, 3)}$.`);
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Every attractive 1D well binds',
      statement: String.raw`In one dimension, every potential well binds: if $V\le0$, $V\not\equiv0$ and $V\in L^1(\R)$ — more generally if $\int V\,dx\le0$ with $V\not\equiv0$ — then $\hat H=-\frac{\hbar^2}{2m}\frac{d^2}{dx^2}+V$ has at least one bound state, however shallow or narrow the well. For a weak well $\lambda V$ ($\lambda\to0$) the binding energy vanishes only quadratically,
$$E\approx-\frac{m}{2\hbar^2}\Big(\lambda\int V\,dx\Big)^2,$$
while the bound state spreads over a distance $1/\kappa\propto1/\lambda$. The dimension matters: in two dimensions an attractive well also always binds but only with an exponentially small energy ($E\sim-e^{-c/\lambda}$), and in three dimensions a well binds only if it is strong enough (for a spherical square well, $z_0=a\sqrt{2mV_0}/\hbar>\pi/2$).`,
      idea: String.raw`Variationally: take the trial state $\psi_\beta=\sqrt\beta\,e^{-\beta|x|}$. Its kinetic energy is $\hbar^2\beta^2/2m$ while its potential energy is about $\beta\int V\,dx<0$ for small $\beta$ (the state is so wide that it samples the whole well at height $\psi(0)^2=\beta$). Linear beats quadratic, so $\langle H\rangle<0$ for small $\beta$, and since the continuum starts at $0$, there is a bound state below it; optimizing $\beta$ gives the formula above. For the square well (3.11) the even branch of the graphical solution starts at the origin, so the circle of any radius $z_0$ meets it. In 2D the same trial state costs kinetic energy logarithmically more, and in 3D the $s$-wave equation for $u=r\psi$ is the 1D problem on a half-line with $u(0)=0$, which admits only the *odd* states of 3.11 — and the first odd branch starts at $z=\pi/2$.`,
      caption: String.raw`A square well of depth $V_0$ and radius (half-width) $a$, strength $z_0^2=2mV_0a^2/\hbar^2$. **Weaken it** with the slider. Left: the ground state $\psi(r)/\psi(0)$ against $r/a$ on a log scale — in 1D it never disappears, just spreads out to $1/\kappa$ (dashed). Right: the binding energy against $z_0^2$ on log–log axes for all three dimensions: 1D follows $|E|\approx z_0^4\,\varepsilon$ (slope 2 — the depth squared), 2D drops off exponentially, $4e^{-2\gamma}e^{-4/z_0^2}\varepsilon$, and 3D vanishes altogether below $z_0^2=\pi^2/4$. Switch the **dimension** to see the wave function do the same.`,
      deps: ['qm-3.11'],
      see: ['qm-3.10', 'qm-12.1', 'cm-6.6'],
      refs: ['Griffiths §2.6'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Finite_potential_well' },
      tags: ['bound states', 'weak binding', 'dimension'],
      viz(v) {
        const dim = v.select('dimension', [{ value: 1, label: '1D: a slab' }, { value: 2, label: '2D: a disc' }, { value: 3, label: '3D: a ball' }], 1);
        const zs = v.slider('strength $z_0^2=2mV_0a^2/\\hbar^2$', 0.03, 30, 0.3, { log: true, sig: 3 });
        const sA = v.stage({ x: [0.01, 1e9], y: [-0.06, 1.1], xlog: true, height: 290, axes: 'box', weight: 1, xlabel: 'r / a', title: 'ground state $\\psi(r)/\\psi(0)$ against $r/a$' });
        const sB = v.stage({ x: [0.03, 30], y: [1e-14, 300], xlog: true, ylog: true, height: 290, axes: 'box', weight: 1, xlabel: 'z₀²', ylabel: '|E| / ε', title: 'binding energy, $\\varepsilon=\\hbar^2/2ma^2$' });
        const J01 = 2.404825557695773;
        /** w = κa of the ground state in dimension d (null if unbound). */
        const solve = (d, z0) => {
          if (d === 1) { const lo = z0 > Math.PI / 2 ? Math.sqrt(z0 * z0 - (Math.PI / 2 - 1e-9) ** 2) : 1e-300; return logBisect((w) => { const z = Math.sqrt(z0 * z0 - w * w); return z * Math.tan(z) - w; }, lo, z0 * (1 - 1e-12)); }
          if (d === 2) { const lo = z0 > J01 ? Math.sqrt(z0 * z0 - (J01 - 1e-9) ** 2) : 1e-300; return logBisect((w) => { const z = Math.sqrt(z0 * z0 - w * w); return (z * J1(z)) / J0(z) - (w * K1(w)) / K0(w); }, lo, z0 * (1 - 1e-12)); }
          if (z0 <= Math.PI / 2) return null;
          const lo = z0 > Math.PI ? Math.sqrt(z0 * z0 - (Math.PI - 1e-9) ** 2) : 1e-300;
          return logBisect((w) => { const z = Math.sqrt(z0 * z0 - w * w); return -z / Math.tan(z) - w; }, lo, Math.sqrt(z0 * z0 - (Math.PI / 2) ** 2) * (1 - 1e-12));
        };
        const asym = (d, z2) => (d === 1 ? z2 * z2 : d === 2 ? 4 * Math.exp(-2 * GAMMA) * Math.exp(-4 / z2) : NaN);
        const curves = [1, 2, 3].map((d) => { const pts = []; for (let i = 0; i <= 260; i++) { const z2 = 0.03 * 1000 ** (i / 260), w = solve(d, Math.sqrt(z2)); pts.push([z2, w ? w * w : NaN]); } return pts; });
        const psiOf = (d, z, w) => (r) => {
          if (d === 1) return r < 1 ? Math.cos(z * r) : Math.cos(z) * Math.exp(-w * (r - 1));
          if (d === 2) return r < 1 ? J0(z * r) : (J0(z) * K0(w * r)) / K0(w);
          return r < 1 ? Math.sin(z * r) / (z * r) : ((Math.sin(z) / z) * Math.exp(-w * (r - 1))) / r;
        };
        let st = null;
        v.render(() => {
          const d = +dim.value, z2 = zs.value, z0 = Math.sqrt(z2), w = solve(d, z0);
          // wave function
          sA.vband(0.01, 1, { color: 'muted', alpha: 0.14 }); sA.text('well', 0.1, 1.03, { color: 'muted', size: 11, align: 'center' });
          if (w) {
            const z = Math.sqrt(z2 - w * w), f = psiOf(d, z, w);
            sA.fn(f, { color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.12, n: 900 });
            if (1 / w < 1e9) { sA.vline(1 / w, { color: 'accent', dash: [5, 4], width: 1.4 }); sA.text('1/κ', 1 / w, 0.9, { color: 'accent', size: 11.5, dx: 5 }); }
            else sA.corner(`1/κ = ${v.sci(1 / w, 1).replace(/\\times10\^\{(-?\d+)\}/, '·10^$1')} a — off the scale`, 'tr', { color: 'accent', weight: 600 });
          } else sA.corner('no bound state: the well is too weak in 3D', 'tr', { color: 'red', weight: 600 });
          // binding energies
          const COLS = ['accent', 'purple', 'orange'];
          [0, 1, 2].forEach((k) => sB.path(curves[k], { color: COLS[k], width: k + 1 === d ? 3 : 1.6, alpha: k + 1 === d ? 1 : 0.55 }));
          sB.fn((q) => q * q, { color: 'accent', width: 1, dash: [5, 4], alpha: 0.7 });
          sB.fn((q) => asym(2, q), { color: 'purple', width: 1, dash: [5, 4], alpha: 0.7 });
          sB.vline((Math.PI * Math.PI) / 4, { color: 'orange', width: 1, dash: [3, 3] });
          sB.text('1D', 0.05, 0.05 ** 2 * 3, { color: 'accent', size: 11.5, weight: 600 });
          sB.text('2D', 0.75, asym(2, 0.75) * 0.06, { color: 'purple', size: 11.5, weight: 600 });
          sB.text('3D', 3.2, 2e-3, { color: 'orange', size: 11.5, weight: 600 });
          if (w) sB.dot(z2, Math.max(w * w, 1e-14), { r: 6.5, color: 'gold' });
          sB.vline(z2, { color: 'gold', width: 1.2, dash: [2, 3] });
          st = { d, z2, w, E: w ? w * w : 0, as: asym(d, z2) };
        });
        v.legend([['accent', '1D: |E| → z₀⁴ ε'], ['purple', '2D: |E| → 4e^{−2γ} e^{−4/z₀²} ε'], ['orange', '3D: threshold z₀² = π²/4'], ['gold', 'current well', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const head = `$z_0^2 = ${v.fix(st.z2, 3)}$, ${st.d}D: `;
          if (!st.w) return head + `**no bound state** — in 3D the well must reach $z_0^2 = \\pi^2/4 = ${v.fix(Math.PI * Math.PI / 4, 4)}$ before it binds.`;
          return head + `$E = -$${st.E > 1e-4 ? v.fix(st.E, 5) : `$${v.sci(st.E, 3)}$`}$\\,\\varepsilon$` + (st.d < 3 ? ` vs the weak-well law ${st.as > 1e-4 ? v.fix(st.as, 5) : `$${v.sci(st.as, 3)}$`} (ratio ${v.fix(st.E / st.as, 4)})` : '') + ` · size of the state $1/\\kappa = $${1 / st.w < 1e4 ? v.fix(1 / st.w, 2) : `$${v.sci(1 / st.w, 2)}$`}$\\,a$` + (st.d === 1 ? ' — still bound, however weak.' : st.d === 2 ? ' — bound, but exponentially weakly.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Definition',
      name: 'Reflection and transmission coefficients',
      statement: String.raw`Let $V$ approach constants $V_L$ as $x\to-\infty$ and $V_R$ as $x\to+\infty$, and let $E>V_L,V_R$. A **scattering state** at energy $E$ is a solution of $\hat H\psi=E\psi$ with the asymptotic form
$$\psi\sim e^{ik_Lx}+r\,e^{-ik_Lx}\ (x\to-\infty),\qquad \psi\sim t\,e^{ik_Rx}\ (x\to+\infty),\qquad k_{L,R}=\frac{\sqrt{2m(E-V_{L,R})}}{\hbar}:$$
a wave incident from the left, a reflected wave and a transmitted wave. The **reflection and transmission coefficients** are the ratios of probability currents,
$$R=\frac{|j_{\rm ref}|}{j_{\rm inc}}=|r|^2,\qquad T=\frac{j_{\rm trans}}{j_{\rm inc}}=\frac{k_R}{k_L}\,|t|^2,$$
and $R+T=1$. They are the probabilities that a particle of energy $E$ sent in from the left is reflected or transmitted. Note the velocity factor $k_R/k_L$: when $V_L\neq V_R$, $|t|^2$ alone is not a probability. If $V_R<E<V_L$... (or $E<V_R$) the transmitted wave is evanescent and $R=1$.`,
      idea: String.raw`For a stationary state the density is time independent, so the continuity equation (2.6) forces $\partial_xj=0$: the current is the **same at every $x$**. On the left the cross terms between $e^{ik_Lx}$ and $re^{-ik_Lx}$ cancel in $j=\frac\hbar m\operatorname{Im}\bar\psi\psi'$, leaving $j=\frac{\hbar k_L}m(1-|r|^2)$; on the right $j=\frac{\hbar k_R}m|t|^2$. Equating them gives $R+T=1$. Physically a plane wave is an idealization of a long, nearly monochromatic packet (3.6): the packet splits into a reflected and a transmitted piece whose probabilities are $R$ and $T$ (see 3.14, 3.15).`,
      caption: String.raw`Choose a potential (or type one). Top: the stationary scattering state at the energy set by the **gold handle** on the right panel, its real part animated as $\operatorname{Re}\,\psi e^{-iEt/\hbar}$ with the envelope $|\psi|$: on the left the incident and reflected waves interfere into ripples, on the right a pure transmitted wave of constant $|\psi|$ moves off. Middle left: the current $j(x)$, computed from $\psi$ and $\psi'$ — **flat** across the whole line, equal to $j_{\rm inc}-|j_{\rm ref}|$ on the left and $j_{\rm trans}$ on the right. Right: $R$ and $T$ against energy; their sum is 1 everywhere. For the **step**, compare $T$ with $|t|^2$ in the readout.`,
      deps: ['qm-3.6', 'qm-2.6'],
      see: ['waves-1.9', 'qm-13.16'],
      refs: ['Griffiths §2.5'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Transmission_coefficient' },
      tags: ['scattering', 'reflection', 'transmission'],
      viz(v) {
        const M = v.M, X0 = -6, X1 = 6, NS = 480, NE = 320;
        const PRE = { gauss: ['Gaussian barrier', 'exp(-x^2)'], well: ['square well', '-1.2 / (1 + exp(25 (abs(x) - 1)))'], step: ['step up', '0.6 / (1 + exp(-12 x))'], two: ['two bumps', '1.2 exp(-6 (x - 1.4)^2) + 1.2 exp(-6 (x + 1.4)^2)'] };
        let Vin = null;
        v.select('potential', Object.entries(PRE).map(([value, p]) => ({ value, label: p[0] })), 'gauss', { onChange: (k) => Vin.set(PRE[k][1]) });
        Vin = v.input('$V(x) =$', PRE.gauss[1], { vars: ['x'], width: 230 });
        const sA = v.stage({ x: [-9, 9], y: [-1.5, 3], height: 250, axes: 'box', full: true, xlabel: 'x', ylabel: 'E', title: 'scattering state: $\\operatorname{Re}\\,\\psi e^{-iEt/\\hbar}$ (blue) and $|\\psi|$, drawn at height $E$' });
        const sJ = v.stage({ x: [-9, 9], y: [-1.6, 1.6], height: 220, axes: 'box', weight: 1, xlabel: 'x', title: 'probability current $j(x)$' });
        const sR = v.stage({ x: [0, 3], y: [-0.04, 1.1], height: 220, axes: 'box', weight: 1.15, xlabel: 'E', title: '$R(E)$, $T(E)$ and $R+T$' });
        const hE = sR.handle(0.8, 0.5, { color: 'gold', r: 8, label: 'E', labelPos: 'n', constrain: (X) => { const E = M.clamp(X, S.Emin, S.Emax); return [E, interp(S.Es, S.T, E)]; } });
        let S = null;
        const solve = () => {
          if (S && S.key === Vin.value) return S;
          const f = Vin.fn || ((x) => Math.exp(-x * x)), Vf = (x) => { const y = f(x); return Number.isFinite(y) ? M.clamp(y, -20, 20) : 0; };
          const segs = sliceV(Vf, X0, X1, NS), VL = Vf(X0), VR = Vf(X1), Emin = VL + 0.02, Emax = Math.max(VL, VR) + 3;
          const Es = Float64Array.from({ length: NE }, (_, i) => Emin + ((Emax - Emin) * i) / (NE - 1)), T = new Float64Array(NE), Rr = new Float64Array(NE);
          for (let i = 0; i < NE; i++) { const q = scatter(Es[i], segs, VL, VR); T[i] = q.T; Rr[i] = q.R; }
          let vmin = Infinity, vmax = -Infinity; for (const s of segs) { vmin = Math.min(vmin, s.V); vmax = Math.max(vmax, s.V); }
          S = { key: Vin.value, Vf, segs, VL, VR, Emin, Emax, Es, T, R: Rr, vmin: Math.min(vmin, VL, VR), vmax: Math.max(vmax, VL, VR) };
          const E0 = M.clamp(Math.max(VL, VR) + 0.8 * (Math.max(0.3, vmax - Math.max(VL, VR))), Emin, Emax);
          hE.x = E0; hE.y = interp(Es, T, E0);
          return S;
        };
        const NXD = 900, xs = Float64Array.from({ length: NXD }, (_, i) => -9 + (18 * i) / (NXD - 1));
        let st = null;
        v.animate((t) => {
          const S = solve(), E = M.clamp(hE.x, S.Emin, S.Emax); hE.y = interp(S.Es, S.T, E);
          const W = scatterWave(E, S.segs, X0, xs, S.VL, S.VR);
          let amax = 0; for (let i = 0; i < NXD; i++) amax = Math.max(amax, Math.hypot(W.re[i], W.im[i]));
          const lo = Math.min(S.vmin, 0) - 0.4, hi = Math.max(S.vmax, E) + 1.2, sc = (0.36 * (hi - lo)) / amax;
          sA.setView([-9, 9], [lo, hi]);
          sA.fn((X) => S.Vf(M.clamp(X, X0, X1)), { color: 'muted', width: 2, fill: 'muted', fillAlpha: 0.16, base: lo, n: 600 });
          sA.hline(E, { color: 'gold', width: 1, dash: [4, 3] });
          const c = Math.cos(E * t), sn = Math.sin(E * t);
          sA.path(Array.from(xs, (X, i) => [X, E + sc * (W.re[i] * c + W.im[i] * sn)]), { color: 'accent', width: 2 });
          sA.path(Array.from(xs, (X, i) => [X, E + sc * Math.hypot(W.re[i], W.im[i])]), { color: 'ink', width: 1.2, dash: [3, 3], alpha: 0.7 });
          sA.path(Array.from(xs, (X, i) => [X, E - sc * Math.hypot(W.re[i], W.im[i])]), { color: 'ink', width: 1.2, dash: [3, 3], alpha: 0.7 });
          sA.text('incident + reflected', -8.8, hi - 0.25, { size: 11.5, color: 'muted' });
          sA.text('transmitted', 8.8, hi - 0.25, { size: 11.5, color: 'muted', align: 'right' });
          // current
          const kL = W.kL, j = Array.from(xs, (X, i) => W.re[i] * W.dim[i] - W.im[i] * W.dre[i]);
          sJ.setView([-9, 9], [-1.3 * kL, 1.3 * kL]);
          sJ.hline(0, { color: 'faint' });
          sJ.line(-9, kL, X0, kL, { color: 'accent', width: 1.4, dash: [6, 4] }); sJ.text('j_inc', -8.8, kL, { size: 11, color: 'accent', dy: -9 });
          sJ.line(-9, -kL * W.R, X0, -kL * W.R, { color: 'orange', width: 1.4, dash: [6, 4] }); sJ.text('−|j_ref|', -8.8, -kL * W.R, { size: 11, color: 'orange', dy: 10 });
          sJ.path(Array.from(xs, (X, i) => [X, j[i]]), { color: 'green', width: 3 });
          sJ.text('j_trans', 8.8, W.T * kL, { size: 11, color: 'green', align: 'right', dy: -10 });
          let jmin = Infinity, jmax = -Infinity; for (const q of j) { jmin = Math.min(jmin, q); jmax = Math.max(jmax, q); }
          // R, T
          sR.setView([S.Emin, S.Emax], [-0.04, 1.1]);
          sR.hline(1, { color: 'ink', width: 1, dash: [3, 3], alpha: 0.6 });
          if (S.VR > S.VL) sR.vband(S.Emin, S.VR, { color: 'red', alpha: 0.06 });
          sR.path(Array.from(S.Es, (q, i) => [q, S.R[i]]), { color: 'orange', width: 2.2 });
          sR.path(Array.from(S.Es, (q, i) => [q, S.T[i]]), { color: 'accent', width: 2.4 });
          sR.path(Array.from(S.Es, (q, i) => [q, S.T[i] + S.R[i]]), { color: 'green', width: 1.6, dash: [5, 4] });
          sR.vline(E, { color: 'gold', width: 1, dash: [2, 3] });
          st = { E, R: W.R, T: W.T, t2: W.t[0] ** 2 + W.t[1] ** 2, kL, kR: W.kR, jspread: jmax - jmin, j: (jmin + jmax) / 2, step: Math.abs(S.VR - S.VL) > 1e-3, err: Vin.error };
        }, { period: 60, still: 2 });
        v.legend([['accent', 'T(E), Re ψ'], ['orange', 'R(E), −|j_ref|'], ['green', 'R + T, current j(x)'], ['muted', 'V(x)', { area: true }]]);
        v.readout(() => st && (st.err ? `formula error: ${st.err} · ` : '') + `$E = ${v.fix(st.E, 3)}$: $R = |r|^2 = ${v.fix(st.R, 6)}$, $T = (k_R/k_L)|t|^2 = ${v.fix(st.T, 6)}$, $R+T = ${(st.R + st.T).toFixed(12)}$` + (st.step ? ` · here $k_R/k_L = ${v.fix(st.kR / st.kL, 4)}$, so $|t|^2 = ${v.fix(st.t2, 4)}$ is **not** the transmission probability` : '') + ` · current $j = ${v.fix(st.j, 6)}$ everywhere (spread across the line $${v.sci(Math.max(st.jspread, 1e-16), 1)}$) $= T\\,j_{\\rm inc}$ with $j_{\\rm inc} = \\hbar k_L/m = ${v.fix(st.kL, 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Model',
      name: 'Potential step',
      statement: String.raw`A particle of energy $E$ meets a step $V=0$ for $x<0$, $V=V_0>0$ for $x>0$. With $k=\sqrt{2mE}/\hbar$:
(a) if $E>V_0$, with $k'=\sqrt{2m(E-V_0)}/\hbar$, the amplitudes are $r=\frac{k-k'}{k+k'}$, $t=\frac{2k}{k+k'}$, so
$$R=\Big(\frac{k-k'}{k+k'}\Big)^2,\qquad T=\frac{4kk'}{(k+k')^2}:$$
the particle can be **reflected even though it has enough energy to climb the step** (classically $R=0$), most strongly just above the threshold;
(b) if $E<V_0$, $R=1$: the reflection is total, but $\psi$ penetrates the step as $e^{-\kappa x}$, $\kappa=\sqrt{2m(V_0-E)}/\hbar$, and the reflected wave carries the phase $r=e^{-2i\arctan(\kappa/k)}$, a delay.
The formulas are those of waves on a string at a junction of impedances $\propto k$ and $k'$. If the step is smoothed over a width large compared with the wavelength, the over-barrier reflection becomes exponentially small.`,
      scope: String.raw`Sharp steps model abrupt interfaces (metal surfaces, heterojunctions); the smooth step of width $w$ (here $V_0(1+\tanh x/w)/2$) has the exact $R=\big[\sinh\pi a(k-k')/\sinh\pi a(k+k')\big]^2$ with $a=w/2$.`,
      idea: String.raw`Match $e^{ikx}+re^{-ikx}$ to $te^{ik'x}$ at $x=0$: continuity of $\psi$ gives $1+r=t$, of $\psi'$ gives $k(1-r)=k't$; solve. The reflection comes from the sudden change of wave number — the same mismatch that reflects a wave on a string at a junction of different impedances (waves-1.9) or light at a change of refractive index. When $E<V_0$, $k'=i\kappa$ and $|r|=1$; the evanescent tail carries no current. A packet, built from many $k$, splits into reflected and transmitted packets with probabilities given by $R$ and $T$ averaged over its momentum distribution (3.13). A gradual step changes $k$ adiabatically, and waves follow slow changes without reflecting (the WKB regime).`,
      caption: String.raw`A wave packet (height $|\psi|$, colour phase) is sent at a step of height $V_0$ with mean energy $E$ (split-step Fourier simulation, $\hbar=m=1$). **Slide the energy above $V_0$**: part of the packet bounces back anyway; when the run finishes, the measured probability on the left lands as a gold dot on the right-hand plot of $R(E)$ — on the plane-wave formula (and exactly on its average over the packet's momentum spread, thin gold). **Below $V_0$** everything returns, after briefly entering the step. **Smooth the step** with $w$: once it is wider than a wavelength, the reflection above $V_0$ all but vanishes, following the exact smooth-step formula.`,
      deps: ['qm-3.13', 'waves-1.9'],
      see: ['waves-1.10', 'qm-12.6'],
      refs: ['Griffiths ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Finite_potential_barrier_(QM)' },
      tags: ['potential step', 'reflection', 'wave packet'],
      viz(v) {
        const M = v.M, { x, dx, n: NG } = pgrid(-128, 128, 2048), V0 = 1, SIG = 6, XS = -30, DT = 0.05, PER = 13, SK = 1 / (2 * SIG);
        let sim = null, Vg = null, TEND = 1, k0 = 1, dots = [];
        const eS = v.slider('energy $E/V_0$', 0.3, 3, 1.25, { step: 0.01, onChange: () => rebuild() });
        const wS = v.slider('step width $w$ (0 = sharp)', 0, 3, 0, { step: 0.05, onChange: () => rebuild() });
        v.button('Clear dots', () => { dots = []; });
        const sA = v.stage({ x: [-70, 70], y: [-0.2, 3], height: 240, axes: 'box', full: true, xlabel: 'x', ylabel: 'E', title: 'a packet meets a step (height $|\\psi|$, colour $\\arg\\psi$, drawn at its mean energy)' });
        const sB = v.stage({ x: [0, 3], y: [-0.03, 1.08], height: 230, axes: 'box', full: true, xlabel: 'E / V₀', ylabel: 'R', title: 'reflection probability: plane-wave formula, packet average (thin), simulation (dots)' });
        const Rk = (k, w) => {
          const k2 = k * k - 2 * V0; if (k2 <= 0) return 1;
          const kp = Math.sqrt(k2); if (w <= 0) return ((k - kp) / (k + kp)) ** 2;
          return sinhRatio(Math.PI * (w / 2) * (k - kp), Math.PI * (w / 2) * (k + kp)) ** 2;
        };
        function rebuild() {
          const w = wS.value; k0 = Math.sqrt(2 * eS.value * V0); TEND = 70 / k0;
          Vg = Float64Array.from(x, (X) => (w > 0 ? (V0 * (1 + Math.tanh(X / w))) / 2 : X > 0 ? V0 : X === 0 ? V0 / 2 : 0));
          const step = M.splitStep1D(Vg, dx, DT);
          sim = clockSim(() => { const P = gpacket(x, dx, XS, SIG, k0); return { re: P.re, im: P.im, done: false }; }, (q) => step(q.re, q.im), DT, 100000);
          v.restart();
        }
        rebuild();
        const i0 = Math.round((0 - x[0]) / dx);
        let st = null;
        v.animate((t) => {
          const col = phaseLUT(v), tau = Math.min(TEND, (t / PER) * TEND * 1.12), q = sim.at(tau), E = eS.value * V0, w = wS.value;
          const PL = probIn(q.re, q.im, dx, 0, i0 - 1), PR = probIn(q.re, q.im, dx, i0, NG - 1), done = sim.T >= TEND - DT;
          if (done && !dots.some((d) => Math.abs(d.E - eS.value) < 1e-9 && d.w === w)) dots.push({ E: eS.value, w, R: PL });
          // packet and step
          const top = Math.max(2.2 * V0, 1.6 * E), lo = -0.12 * top;
          sA.setView([-70, 70], [lo, top]);
          sA.fn((X) => interp(x, Vg, X), { color: 'muted', width: 2, fill: 'muted', fillAlpha: 0.18, base: lo, n: 700 });
          sA.hline(E, { color: 'ink', width: 1, dash: [5, 4], alpha: 0.6 }); sA.text('E', -69, E, { size: 11.5, dy: -8 });
          sA.text('V₀', 69, V0, { size: 11.5, align: 'right', dy: -8, color: 'muted' });
          let pk = 0; for (let i = 0; i < NG; i++) pk = Math.max(pk, Math.hypot(q.re[i], q.im[i]));
          drawPsi(sA, x, q.re, q.im, { col, base: E, scale: (0.42 * (top - E)) / Math.max(pk, 0.2) });
          sA.corner(`left of the step ${v.fix(PL, 4)} · right ${v.fix(PR, 4)}${done ? ' (final)' : ''}`, 'tl', { color: done ? 'green' : 'muted', weight: 600 });
          phaseWheel(sA, col, sA.W - 34, 40, 11);
          // R(E)
          sB.setView([0, 3], [-0.03, 1.08]);
          sB.vline(1, { color: 'faint', dash: [3, 3] });
          sB.fn((e) => Rk(Math.sqrt(2 * e * V0), 0), { color: w > 0 ? 'muted' : 'accent', width: w > 0 ? 1.4 : 2.4, dash: w > 0 ? [5, 4] : null, n: 500 });
          if (w > 0) sB.fn((e) => Rk(Math.sqrt(2 * e * V0), w), { color: 'accent', width: 2.4, n: 500 });
          sB.fn((e) => packetAverage((k) => Rk(k, w), Math.sqrt(2 * e * V0), SK, 120), { color: 'gold', width: 1.2, n: 220 });
          sB.vline(eS.value, { color: 'gold', width: 1.2, dash: [2, 3] });
          sB.dots(dots.filter((d) => d.w === w).map((d) => [d.E, d.R]), { r: 6, color: 'gold' });
          if (w > 0) sB.text('sharp step', 2.9, Rk(Math.sqrt(2 * 2.9), 0) + 0.04, { size: 11, color: 'muted', align: 'right' });
          const kp = E > V0 ? Math.sqrt(2 * (E - V0)) : 0, kap = E < V0 ? Math.sqrt(2 * (V0 - E)) : 0;
          st = { E, k: k0, kp, kap, PL, PR, done, tau, Rpw: Rk(k0, w), Rav: packetAverage((k) => Rk(k, w), k0, SK), w };
        }, { period: PER, still: PER - 0.15 });
        v.legend([['accent', 'R for a plane wave'], ['gold', 'R averaged over the packet; simulation (dots)'], ['muted', 'step V(x)', { area: true }]]);
        v.readout(() => st && `$E/V_0 = ${v.fix(st.E, 2)}$, $k = ${v.fix(st.k, 3)}$` + (st.E > 1 ? `, $k' = ${v.fix(st.kp, 3)}$` : `, $\\kappa = ${v.fix(st.kap, 3)}$`) + ` · ${st.done ? 'measured' : `$t = ${v.fix(st.tau, 1)}$, so far`}: reflected **${v.fix(st.PL, 4)}**, transmitted **${v.fix(st.PR, 4)}** · plane-wave $R = ${v.fix(st.Rpw, 4)}$, averaged over the packet's momenta ${v.fix(st.Rav, 4)}` + (st.E < 1 ? ` · total reflection, with phase $-2\\arctan(\\kappa/k) = ${v.fix(-2 * Math.atan(st.kap / st.k), 3)}$ rad and penetration depth $1/\\kappa = ${v.fix(1 / st.kap, 2)}$` : st.w === 0 ? ` · classically $R = 0$` : '') + '.');
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Phenomenon',
      name: 'Quantum tunnelling',
      statement: String.raw`A particle can cross a barrier higher than its energy. For a square barrier of height $V_0$ and width $w$ and energy $0<E<V_0$, with $\kappa=\sqrt{2m(V_0-E)}/\hbar$,
$$T=\Big[1+\frac{V_0^2\sinh^2\kappa w}{4E(V_0-E)}\Big]^{-1}\ \approx\ 16\,\frac{E}{V_0}\Big(1-\frac E{V_0}\Big)e^{-2\kappa w}\qquad(\kappa w\gg1):$$
transmission falls **exponentially** with the width and with $\sqrt{V_0-E}$. For a smooth barrier the WKB approximation gives $T\approx\exp\!\big(-\frac2\hbar\int\sqrt{2m(V-E)}\,dx\big)$ over the classically forbidden region. Tunnelling explains alpha decay, field emission and the scanning tunnelling microscope, and limits how small transistors can be made.`,
      idea: String.raw`Inside the barrier the solutions are $e^{\pm\kappa x}$ instead of oscillations; matching across both edges (or multiplying the two edge matrices of 3.19) gives the exact $T$. For a thick barrier the decaying exponential dominates and the amplitude drops by $e^{-\kappa w}$ across it, so $T\propto e^{-2\kappa w}$, with a prefactor set by the impedance mismatch at the two edges. A slowly varying barrier is a stack of thin slices, each attenuating by $e^{-\kappa(x)\,dx}$, which multiplies into the WKB exponent; it is accurate when $\kappa$ changes little over a decay length, so it is good for smooth barriers and only right in the exponent for the square one. This is the quantum version of frustrated total internal reflection (waves-4.10).`,
      caption: String.raw`A packet of mean energy $E<V_0$ (here $\hbar=m=1$, $V_0=1$) hits a barrier. Top: $\psi$ (height $|\psi|$, colour phase); middle: $|\psi|^2$ on a **log scale**, where the exponential decay inside the barrier and the small transmitted packet become visible. When the run ends, the transmitted probability lands as a red dot on the bottom plot of $\log T$ against **width** or **energy** — on the packet average of the exact $T$ (hollow ring). Compare the exact transmission (blue, transfer matrices) with the WKB estimate (orange, dashed): for the **square** barrier WKB has the right slope but the wrong prefactor (the thick-barrier formula, purple, fixes it), for the **smooth** barrier it is nearly exact.`,
      deps: ['qm-3.13', 'waves-4.10'],
      see: ['qm-12.9', 'qm-12.10', 'qm-12.11'],
      refs: ['Griffiths ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_tunnelling' },
      tags: ['tunnelling', 'barrier', 'wkb'],
      viz(v) {
        const M = v.M, { x, dx, n: NG } = pgrid(-128, 128, 2048), V0 = 1, SIG = 6, XS = -30, DT = 0.04, PER = 14, SK = 1 / (2 * SIG), L4 = 4 * Math.LN2;
        let sim = null, Vg = null, TEND = 1, k0 = 1, meas = null;
        const shape = v.select('barrier', [{ value: 'square', label: 'square' }, { value: 'smooth', label: 'smooth (Gaussian)' }], 'square', { onChange: () => rebuild() });
        const wS = v.slider('width $w$', 0.5, 6, 2.5, { step: 0.05, onChange: () => rebuild() });
        const eS = v.slider('energy $E/V_0$', 0.2, 1.4, 0.5, { step: 0.01, onChange: () => rebuild() });
        const axis = v.select('plot $T$ against', [{ value: 'w', label: 'width' }, { value: 'E', label: 'energy' }], 'w');
        const sA = v.stage({ x: [-60, 60], y: [-0.1, 2], height: 190, axes: 'box', full: true, ylabel: 'E', title: '$\\psi$ (height $|\\psi|$, colour phase) and the barrier' });
        const sL = v.stage({ x: [-60, 60], y: [1e-12, 1], ylog: true, height: 160, axes: 'box', full: true, xlabel: 'x', title: '$|\\psi|^2$ on a log scale' });
        const sB = v.stage({ x: [0, 8], y: [1e-12, 3], ylog: true, height: 240, axes: 'box', full: true, ylabel: 'T', title: 'transmission $T$: exact, WKB, thick-barrier formula; simulation (dot)' });
        const Vof = (sh, w) => (sh === 'square' ? (X) => (Math.abs(X) < w / 2 ? V0 : Math.abs(X) === w / 2 ? V0 / 2 : 0) : (X) => V0 * Math.exp((-L4 * X * X) / (w * w)));
        const segsOf = (sh, w) => (sh === 'square' ? [{ V: V0, d: w }] : sliceV(Vof(sh, w), -2 * w, 2 * w, 260));
        const Tex = (sh, w, E) => scatter(E, segsOf(sh, w)).T;
        const Twkb = (sh, w, E) => {
          if (E >= V0) return NaN;
          if (sh === 'square') return Math.exp(-2 * Math.sqrt(2 * (V0 - E)) * w);
          const xt = w * Math.sqrt(Math.log(V0 / E) / L4); return Math.exp(-2 * M.integrate((X) => Math.sqrt(Math.max(0, 2 * (V0 * Math.exp((-L4 * X * X) / (w * w)) - E))), -xt, xt, 400));
        };
        const Tthick = (w, E) => (E < V0 ? 16 * (E / V0) * (1 - E / V0) * Math.exp(-2 * Math.sqrt(2 * (V0 - E)) * w) : NaN);
        const xEdge = () => (shape.value === 'square' ? wS.value / 2 : 1.6 * wS.value);
        function rebuild() {
          const w = wS.value, sh = shape.value; k0 = Math.sqrt(2 * eS.value * V0); TEND = 70 / k0; meas = null;
          const Vf = Vof(sh, w); Vg = Float64Array.from(x, Vf);
          const step = M.splitStep1D(Vg, dx, DT);
          sim = clockSim(() => { const P = gpacket(x, dx, XS, SIG, k0); return { re: P.re, im: P.im }; }, (q) => step(q.re, q.im), DT, 100000);
          v.restart();
        }
        rebuild();
        let cKey = null, cur = null;
        let st = null;
        v.animate((t) => {
          const col = phaseLUT(v), tau = Math.min(TEND, (t / PER) * TEND * 1.12), q = sim.at(tau), E = eS.value * V0, w = wS.value, sh = shape.value;
          const ie = Math.round((xEdge() - x[0]) / dx), PT = probIn(q.re, q.im, dx, ie, NG - 1), done = sim.T >= TEND - DT;
          if (done) meas = PT;
          // packet
          sA.setView([-60, 60], [-0.14 * 1.8, 1.8]);
          sA.fn((X) => Vof(sh, w)(X), { color: 'muted', width: 2, fill: 'muted', fillAlpha: 0.2, base: -0.25, n: 900 });
          sA.hline(E, { color: 'ink', width: 1, dash: [5, 4], alpha: 0.6 }); sA.text('E', -59, E, { size: 11.5, dy: -8 });
          let pk = 0; for (let i = 0; i < NG; i++) pk = Math.max(pk, Math.hypot(q.re[i], q.im[i]));
          drawPsi(sA, x, q.re, q.im, { col, base: E, scale: (0.42 * (1.8 - E)) / Math.max(pk, 0.2) });
          phaseWheel(sA, col, sA.W - 34, 40, 11);
          // log density
          const bl = sh === 'square' ? w / 2 : 0.8 * w; sL.vband(-bl, bl, { color: 'muted', alpha: 0.2 });
          const pts = []; for (let i = 0; i < NG; i += 1) { if (x[i] < -61 || x[i] > 61) continue; pts.push([x[i], Math.max(1e-13, q.re[i] ** 2 + q.im[i] ** 2)]); }
          sL.path(pts, { color: 'accent', width: 1.6 });
          sL.corner(`beyond the barrier: ${PT < 1e-3 ? v.sci(PT, 2).replace(/\\times10\^\{(-?\d+)\}/, '×10^$1') : v.fix(PT, 5)}${done ? ' (final)' : ''}`, 'tr', { color: done ? 'red' : 'muted', weight: 600 });
          // T curves
          const key = `${sh}|${axis.value}|${axis.value === 'w' ? E : w}`;
          if (key !== cKey) {
            cKey = key; cur = { ex: [], wk: [], th: [] };
            for (let i = 0; i <= 220; i++) {
              const a = axis.value === 'w' ? 8 * i / 220 + 1e-6 : 0.04 + (1.96 * i) / 220, ww = axis.value === 'w' ? a : w, EE = axis.value === 'w' ? E : a;
              cur.ex.push([a, Tex(sh, ww, EE)]); cur.wk.push([a, Twkb(sh, ww, EE)]); if (sh === 'square') cur.th.push([a, Tthick(ww, EE)]);
            }
          }
          if (axis.value === 'w') { sB.setView([0, 8], [1e-12, 3]); sB.setLabels('width w', 'T'); } else { sB.setView([0.04, 2], [1e-12, 3]); sB.setLabels('E / V₀', 'T'); }
          if (axis.value === 'E') sB.vline(1, { color: 'faint', dash: [3, 3] });
          sB.path(cur.ex, { color: 'accent', width: 2.6 });
          sB.path(cur.wk, { color: 'orange', width: 2, dash: [6, 4] });
          if (cur.th.length) sB.path(cur.th, { color: 'purple', width: 1.6, dash: [2, 3] });
          const X = axis.value === 'w' ? w : eS.value, Tpw = Tex(sh, w, E), Tav = packetAverage((k) => Tex(sh, w, k * k / 2), k0, SK, 160);
          sB.vline(X, { color: 'gold', width: 1.2, dash: [2, 3] });
          sB.dot(X, Tpw, { r: 5, color: 'accent' });
          sB.dot(X, Tav, { r: 8, color: 'red', hollow: true, width: 2 });
          if (meas != null) sB.dot(X, Math.max(meas, 1e-12), { r: 5, color: 'red' });
          st = { E, w, tau, PT, done, Tpw, Tav, Tw: Twkb(sh, w, E), Tt: sh === 'square' ? Tthick(w, E) : NaN, sh, kap: E < V0 ? Math.sqrt(2 * (V0 - E)) : 0 };
        }, { period: PER, still: PER - 0.15 });
        v.legend([['accent', 'exact T (transfer matrix)'], ['orange', 'WKB e^{−2∫κ dx}', { dash: true }], ['purple', 'thick-barrier formula (square)', { dash: true }], ['red', 'simulation; ring = packet average', { dot: true }]]);
        const tx = (q) => (q > 1e-3 ? v.fix(q, 5) : `$${v.sci(q, 3)}$`);
        v.readout(() => st && `$E/V_0 = ${v.fix(st.E, 2)}$, $w = ${v.fix(st.w, 2)}$${st.kap ? `, $\\kappa w = ${v.fix(st.kap * st.w, 2)}$` : ''} · ${st.done ? 'measured' : 'so far'} beyond the barrier: **${tx(st.PT)}** · exact $T$ at $E$: ${tx(st.Tpw)}, averaged over the packet's momenta: ${tx(st.Tav)}` + (Number.isFinite(st.Tw) ? ` · WKB ${tx(st.Tw)} (exact/WKB = ${v.fix(st.Tpw / st.Tw, 3)})` : ' · above the barrier: no tunnelling needed, yet $T<1$') + (Number.isFinite(st.Tt) ? ` · thick-barrier ${tx(st.Tt)}` : '') + '.');
      },
    },
    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Phenomenon',
      name: 'Resonant transmission (Ramsauer–Townsend)',
      statement: String.raw`Transmission through a potential is perfect, $T=1$, at special energies. For a square well of depth $V_0$ and width $W$ this happens when a whole number of half-wavelengths fits across it,
$$k'W=n\pi,\qquad E_n=\frac{n^2\pi^2\hbar^2}{2mW^2}-V_0>0,$$
where $k'=\sqrt{2m(E+V_0)}/\hbar$; between these energies part of the wave is reflected. For two barriers (a "quantum Fabry–Pérot"), $T$ reaches 1 near the quasi-bound levels of the well between them even when each barrier alone transmits only a few per cent: **resonant tunnelling**, with resonances that sharpen as the barriers thicken. The effect explains the near-transparency of noble gases (argon, krypton, xenon) to electrons of about 1 eV found by Ramsauer and by Townsend in the early 1920s.`,
      scope: String.raw`The 1D model captures the mechanism; the noble-gas effect is the 3D analogue for the dominant $s$-wave, whose phase shift passes through $\pi$ at low energy. Resonant tunnelling is the working principle of resonant-tunnelling diodes.`,
      idea: String.raw`Reflections from the two edges of the well interfere. Their amplitudes are equal and opposite in sign, and the round trip adds the phase $2k'W$; when $k'W=n\pi$ the two reflected waves cancel exactly, so nothing is reflected and, by $R+T=1$, everything is transmitted — the condition for constructive interference in a Fabry–Pérot cavity (waves-6.10). Between two barriers the multiply reflected waves inside build up at the cavity resonances until the leakage through the second barrier equals the incoming flux; the resonance width is the inverse lifetime of the quasi-bound state.`,
      caption: String.raw`Top: transmission $T(E)$; drag the **gold handle** along it. For the **square well**, the green dashes mark $k'W=n\pi$ — the peaks reach exactly 1 there. For **two barriers**, the dashed grey curve is one barrier alone (a few per cent) and the green dashes the levels of a box the size of the gap: the double barrier becomes transparent next to each of them. Bottom: the scattering state at the chosen energy — at a resonance the ripples on the left (interference of incident and reflected waves) disappear, and inside the well a standing pattern with whole half-wavelengths builds up.`,
      deps: ['qm-3.15', 'waves-6.10'],
      see: ['waves-6.11', 'qm-3.19', 'qm-13.16'],
      refs: ['Griffiths §2.6'],
      credit: 'Ramsauer, 1921; Townsend & Bailey, 1922',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ramsauer%E2%80%93Townsend_effect' },
      tags: ['resonance', 'transmission', 'fabry–pérot'],
      viz(v) {
        const M = v.M, EMAX = 4, NE = 900, B = 0.35;
        const mode = v.select('potential', [{ value: 'well', label: 'square well' }, { value: 'double', label: 'two barriers' }], 'well', { onChange: () => { cKey = null; setE = true; } });
        const hS = v.slider('depth $V_0$ / barrier height', 0.5, 8, 3, { step: 0.05, onChange: () => { cKey = null; setE = true; } });
        const WS = v.slider('width of the well $W$ / gap between the barriers', 1, 6, 3, { step: 0.01, onChange: () => { cKey = null; setE = true; } });
        const sT = v.stage({ x: [0, EMAX], y: [-0.03, 1.08], height: 240, axes: 'box', full: true, xlabel: 'E', ylabel: 'T', title: 'transmission $T(E)$' });
        const sW = v.stage({ x: [-8, 8], y: [-1, 1], height: 230, axes: 'box', full: true, xlabel: 'x', title: 'scattering state at the chosen energy: $|\\psi|$ (ink) and $\\operatorname{Re}\\psi$ (blue)' });
        let cKey = null, C = null, setE = true;
        const hE = sT.handle(1, 0.5, { color: 'gold', r: 8, label: 'E', labelPos: 'n', constrain: (X) => { const E = M.clamp(X, 0.01, EMAX); return [E, interp(C.E, C.T, E)]; } });
        const segsOf = () => { const h = hS.value, W = WS.value; return mode.value === 'well' ? [{ V: -h, d: W }] : [{ V: h, d: B }, { V: 0, d: W }, { V: h, d: B }]; };
        const curve = () => {
          const key = `${mode.value}|${hS.value}|${WS.value}`; if (key === cKey) return C;
          cKey = key; const segs = segsOf(), E = Float64Array.from({ length: NE }, (_, i) => 0.01 + ((EMAX - 0.01) * i) / (NE - 1)), T = E.map((e) => scatter(e, segs).T);
          const T1 = mode.value === 'double' ? E.map((e) => scatter(e, [{ V: hS.value, d: B }]).T) : null;
          const pred = []; const W = WS.value;
          for (let n = 1; n < 60; n++) { const e = (n * n * Math.PI * Math.PI) / (2 * W * W) - (mode.value === 'well' ? hS.value : 0); if (e > EMAX) break; if (e > 0.01) pred.push([n, e]); }
          const peaks = []; for (let i = 1; i < NE - 1; i++) if (T[i] > T[i - 1] && T[i] >= T[i + 1] && T[i] > 0.5) peaks.push([E[i], T[i]]);
          C = { segs, E, T, T1, pred, peaks };
          if (setE) { setE = false; const e0 = peaks.length ? peaks[0][0] : 1; hE.x = e0; hE.y = interp(E, T, e0); }
          return C;
        };
        const NXD = 800, xs = Float64Array.from({ length: NXD }, (_, i) => -8 + (16 * i) / (NXD - 1));
        let st = null;
        v.render(() => {
          const C = curve(), E = M.clamp(hE.x, 0.01, EMAX); hE.y = interp(C.E, C.T, E);
          sT.hline(1, { color: 'ink', width: 1, dash: [3, 3], alpha: 0.5 });
          C.pred.forEach(([n, e]) => { sT.vline(e, { color: 'green', width: 1.2, dash: [4, 4] }); sT.text(`n=${n}`, e, 1.04, { size: 10.5, color: 'green', align: 'center' }); });
          if (C.T1) sT.path(Array.from(C.E, (e, i) => [e, C.T1[i]]), { color: 'muted', width: 1.6, dash: [5, 4] });
          sT.path(Array.from(C.E, (e, i) => [e, C.T[i]]), { color: 'accent', width: 2.4 });
          // scattering state
          const tot = C.segs.reduce((s, q) => s + q.d, 0), x0 = -tot / 2, W = scatterWave(E, C.segs, x0, xs);
          let amax = 0; for (let i = 0; i < NXD; i++) amax = Math.max(amax, Math.hypot(W.re[i], W.im[i]));
          const R = 1.25 * amax; sW.setView([-8, 8], [-R, R]);
          let xb = x0; for (const q of C.segs) { const y = (q.V / hS.value) * 0.55 * R; sW.rect(xb, 0, xb + q.d, y, { fill: q.V < 0 ? 'teal' : 'muted', fillAlpha: 0.22, stroke: false }); xb += q.d; }
          sW.hline(0, { color: 'faint' });
          sW.path(Array.from(xs, (X, i) => [X, W.re[i]]), { color: 'accent', width: 1.8 });
          sW.path(Array.from(xs, (X, i) => [X, Math.hypot(W.re[i], W.im[i])]), { color: 'ink', width: 2.2 });
          let lmin = Infinity, lmax = -Infinity; for (let i = 0; i < NXD; i++) if (xs[i] < x0 - 0.5) { const a = Math.hypot(W.re[i], W.im[i]); lmin = Math.min(lmin, a); lmax = Math.max(lmax, a); }
          sW.text(lmax - lmin < 0.02 ? 'no ripple: nothing reflected' : 'ripples: incident + reflected', -7.8, 1.05 * amax, { size: 11.5, color: lmax - lmin < 0.02 ? 'green' : 'muted', weight: 600 });
          const kin = Math.sqrt(2 * (E + (mode.value === 'well' ? hS.value : 0)));
          st = { E, T: W.T, R: W.R, ratio: (kin * WS.value) / Math.PI, peaks: C.peaks.slice(0, 5), pred: C.pred.slice(0, 5), mode: mode.value, T1: C.T1 ? interp(C.E, C.T1, E) : null };
        });
        v.legend([['accent', 'T(E), Re ψ'], ['green', 'kW = nπ (well) / box levels (gap)', { dash: true }], ['muted', 'one barrier alone', { dash: true }], ['ink', '|ψ|']]);
        v.readout(() => st && `$E = ${v.fix(st.E, 4)}$: $T = ${v.fix(st.T, 6)}$, $R = ${v.fix(st.R, 6)}$` + (st.mode === 'well' ? ` · $k'W/\\pi = ${v.fix(st.ratio, 4)}$${Math.abs(st.ratio - Math.round(st.ratio)) < 0.01 ? ' — a whole number: resonance' : ''} · peaks of $T$ found at E = ${st.peaks.map((p) => v.fix(p[0], 3)).join(', ')}; predicted $k'W = n\\pi$: ${st.pred.map((p) => v.fix(p[1], 3)).join(', ')}` : ` · one barrier alone transmits ${v.fix(st.T1, 4)} here · resonance peaks at E = ${st.peaks.map((p) => `${v.fix(p[0], 3)} (T = ${v.fix(p[1], 4)})`).join(', ')}; box levels of the gap: ${st.pred.map((p) => v.fix(p[1], 3)).join(', ')} (the peaks sit a little lower, because the wave leaks into the barriers)`) + '.');
      },
    },
    // ------------------------------------------------------------------ 3.17
    {
      num: '3.17',
      kind: 'Model',
      name: 'Double well and tunnelling splitting',
      statement: String.raw`Two identical wells separated by a barrier have, instead of two degenerate ground states, an **even** state $\psi_+$ and an **odd** state $\psi_-$ with energies $E_+<E_-$ split by
$$\Delta E=E_--E_+\ \approx\ \frac{\hbar\omega}{\pi}\exp\!\Big(-\frac1\hbar\int_{-b}^{b}\sqrt{2m\big(V(x)-E\big)}\,dx\Big)$$
(WKB, with $\omega$ the frequency at the bottom of a well and $\pm b$ the turning points under the barrier), exponentially small in the barrier's height and width. A particle started in one well, $\psi_L=(\psi_++\psi_-)/\sqrt2$, is not stationary: it **oscillates between the wells**, $P_{\rm left}(t)=\cos^2(\Delta E\,t/2\hbar)$, crossing over in the time $\pi\hbar/\Delta E$. In the ammonia molecule the nitrogen atom tunnels through the plane of the hydrogens; its splitting $\Delta E\approx9.8\times10^{-5}$ eV gives the 23.8 GHz line of the ammonia maser.`,
      idea: String.raw`If the barrier were impenetrable, each well would have its own ground state $\phi_L$, $\phi_R$ at the same energy; the barrier couples them weakly through their overlapping tails. By 3.8 the true states cannot be degenerate, and the symmetry $x\to-x$ makes them even and odd: $\psi_\pm\approx(\phi_L\pm\phi_R)/\sqrt2$, the even one lower because it has no node. The splitting is twice the tunnelling matrix element, governed by how much of $\phi_L$ reaches the far well — $e^{-\int\kappa\,dx}$ (compare the tunnelling exponent of 3.15). The left-localized state is the sum of two stationary states, so its density beats at the Bohr frequency $\Delta E/\hbar$ (3.1).`,
      caption: String.raw`A double well $V=V_b\big((x/a)^2-1\big)^2$; raise or lower the **barrier height $V_b$**. Top left: the levels in pairs, with the even and odd ground states highlighted; top right: the splitting $\Delta E$ against $V_b$ on a log scale — a near straight line, as the WKB exponent predicts (orange, dashed). Middle: the particle started in the left well, $(\psi_++\psi_-)/\sqrt2$, evolving in time (one frame per small fraction of the tunnelling period). Bottom: the probability in the left half, computed from $\Psi(x,t)$, against $\cos^2(\Delta E\,t/2\hbar)$ — the particle sloshes from well to well at the splitting frequency.`,
      deps: ['qm-3.11', 'qm-3.15'],
      see: ['qm-3.8', 'qm-12.12', 'qm-9.9'],
      refs: ['Griffiths ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Double-well_potential' },
      tags: ['double well', 'tunnelling splitting', 'ammonia'],
      viz(v) {
        const M = v.M, A = -5, B = 5, NG = 500, K = 8, AW = 2, PER = 16;
        const Vb = v.slider('barrier height $V_b$', 1, 10, 4, { step: 0.05 });
        const VofB = (b) => (X) => b * ((X / AW) ** 2 - 1) ** 2;
        const sL = v.stage({ x: [-4, 4], y: [0, 6], height: 280, axes: 'box', weight: 1.1, xlabel: 'x', ylabel: 'E', title: 'levels in pairs: $\\psi_+$ (even), $\\psi_-$ (odd)' });
        const sS = v.stage({ x: [1, 10], y: [1e-4, 2], ylog: true, height: 280, axes: 'box', weight: 0.9, xlabel: 'V_b', ylabel: 'ΔE', title: 'splitting $\\Delta E$ against $V_b$' });
        const sP = v.stage({ x: [-4, 4], y: [0, 1], height: 190, axes: 'box', full: true, xlabel: 'x', title: '$\\Psi(x,t)$ started in the left well (height $|\\Psi|$, colour phase)' });
        const sT = v.stage({ x: [0, 2], y: [-0.05, 1.08], height: 150, axes: 'box', full: true, xlabel: 't / T', ylabel: 'P_left', title: 'probability in the left half, with $T=2\\pi\\hbar/\\Delta E$' });
        /** WKB (Landau–Lifshitz) splitting for barrier b at the doublet energy E0. */
        const wkb = (b, E0) => {
          const om = Math.sqrt((8 * b) / (AW * AW)), V = VofB(b); if (E0 >= b) return NaN;
          const xt = AW * Math.sqrt(1 - Math.sqrt(E0 / b));
          return (om / Math.PI) * Math.exp(-M.integrate((X) => Math.sqrt(Math.max(0, 2 * (V(X) - E0))), -xt, xt, 400));
        };
        const flow = []; for (let i = 0; i <= 36; i++) { const b = 1 + (9 * i) / 36, R = M.schrodinger1D(VofB(b), [A, B], { n: NG, k: 2 }); flow.push([b, R.E[1] - R.E[0], wkb(b, (R.E[0] + R.E[1]) / 2)]); }
        let D = null;
        const data = () => {
          if (D && D.b === Vb.value) return D;
          const b = Vb.value, Vf = VofB(b), R = M.schrodinger1D(Vf, [A, B], { n: NG, k: K }), x = R.x, dx = x[1] - x[0];
          const dE = R.E[1] - R.E[0], Tt = TAU / dE, i0 = Math.floor((0 - x[0]) / dx), pl = [];
          for (let k = 0; k <= 480; k++) {
            const tau = (2 * Tt * k) / 480, c0 = Math.cos(-R.E[0] * tau), s0 = Math.sin(-R.E[0] * tau), c1 = Math.cos(-R.E[1] * tau), s1 = Math.sin(-R.E[1] * tau);
            let p = 0; for (let i = 0; i <= i0; i++) { const re = (R.psi[0][i] * c0 + R.psi[1][i] * c1) * Math.SQRT1_2, im = (R.psi[0][i] * s0 + R.psi[1][i] * s1) * Math.SQRT1_2; p += re * re + im * im; }
            pl.push([k / 240, p * dx]);
          }
          return (D = { b, x, dx, E: R.E, psi: R.psi, Vg: Float64Array.from(x, Vf), dE, Tt, pl, wk: wkb(b, (R.E[0] + R.E[1]) / 2) });
        };
        let st = null;
        v.animate((t) => {
          const D = data(), col = phaseLUT(v), f = (t / PER) * 2, tau = f * D.Tt;
          // levels
          const top = Math.min(D.E[5] + 0.6, Math.max(D.E[3], D.b * 1.35)); sL.setView([-4, 4], [0, top]);
          let pmax = 0; for (const p of D.psi) for (const y of p) pmax = Math.max(pmax, Math.abs(y));
          const amp = (0.3 * Math.max(0.4, D.E[2] - D.E[0])) / pmax;
          levelDiagram(sL, { x: D.x, V: D.Vg, E: D.E, psi: D.psi, col, amp, hi: [0, 1], show: [0, 1, 2, 3, 4, 5].filter((i) => D.E[i] < top), label: (i) => (i === 0 ? 'ψ₊' : i === 1 ? 'ψ₋' : `${i + 1}`) });
          sL.text(`ΔE = ${D.dE < 1e-3 ? v.sci(D.dE, 2).replace(/\\times10\^\{(-?\d+)\}/, '×10^$1') : v.fix(D.dE, 4)}`, -3.9, (D.E[0] + D.E[1]) / 2, { size: 11.5, color: 'ink', weight: 600, plate: true });
          // splitting vs barrier
          sS.path(flow.map(([b, d]) => [b, d]), { color: 'accent', width: 2.4 });
          sS.dots(flow.map(([b, d]) => [b, d]), { r: 2.5, color: 'accent' });
          sS.path(flow.map(([b, , w]) => [b, w]), { color: 'orange', width: 1.8, dash: [6, 4] });
          sS.dot(D.b, D.dE, { r: 7, color: 'gold' });
          // Ψ(x, t)
          const N = D.x.length, re = new Float64Array(N), im = new Float64Array(N);
          const c0 = Math.cos(-D.E[0] * tau), s0 = Math.sin(-D.E[0] * tau), c1 = Math.cos(-D.E[1] * tau), s1 = Math.sin(-D.E[1] * tau);
          for (let i = 0; i < N; i++) { re[i] = (D.psi[0][i] * c0 + D.psi[1][i] * c1) * Math.SQRT1_2; im[i] = (D.psi[0][i] * s0 + D.psi[1][i] * s1) * Math.SQRT1_2; }
          let am = 0; for (let i = 0; i < N; i++) am = Math.max(am, Math.abs(D.psi[0][i]) + Math.abs(D.psi[1][i]));
          am *= Math.SQRT1_2 * 1.15; sP.setView([-4, 4], [-0.12 * am, am]);
          sP.fn((X) => Math.min(am, (interp(D.x, D.Vg, X) / (1.4 * D.b)) * am), { color: 'muted', width: 1.4, fill: 'muted', fillAlpha: 0.1, n: 400 });
          drawPsi(sP, D.x, re, im, { col });
          phaseWheel(sP, col, sP.W - 34, 38, 11);
          const PLn = probIn(re, im, D.dx, 0, Math.floor((0 - D.x[0]) / D.dx));
          sP.corner(`left ${v.fix(PLn, 3)} · right ${v.fix(1 - PLn, 3)}`, 'tl', { color: 'ink', weight: 600 });
          // P_left(t)
          sT.fn((u) => Math.cos(Math.PI * u) ** 2, { color: 'green', width: 4, alpha: 0.35 });
          sT.path(D.pl, { color: 'accent', width: 1.8 });
          sT.vline(f, { color: 'gold', width: 1.4 }); sT.dot(f, PLn, { r: 5.5, color: 'gold' });
          let dev = 0; D.pl.forEach(([u, p]) => { dev = Math.max(dev, Math.abs(p - Math.cos(Math.PI * u) ** 2)); });
          st = { b: D.b, dE: D.dE, Tt: D.Tt, wk: D.wk, dev, tau, PLn };
        }, { period: PER, still: 4 });
        v.legend([['accent', 'computed: levels, ΔE, P_left(t)'], ['orange', 'WKB estimate of ΔE', { dash: true }], ['green', 'cos²(ΔE t / 2ħ)', { area: true }]]);
        v.readout(() => st && `$V_b = ${v.fix(st.b, 2)}$: $\\Delta E = E_--E_+ = ${v.sci(st.dE, 3)}$ (WKB estimate $${v.sci(st.wk, 3)}$, ratio ${v.fix(st.dE / st.wk, 3)}) · tunnelling period $2\\pi\\hbar/\\Delta E = ${st.Tt < 1e4 ? v.fix(st.Tt, 1) : `$${v.sci(st.Tt, 2)}$`}$ · computed $P_{\\rm left}(t)$ stays within ${v.sci(Math.max(st.dev, 1e-16), 1)} of $\\cos^2(\\Delta E\\,t/2\\hbar)$ · now $t = ${v.fix(st.tau / st.Tt, 3)}\\,T$, left half ${v.fix(st.PLn, 4)}.`);
      },
    },
    // ------------------------------------------------------------------ 3.18
    {
      num: '3.18',
      kind: 'Method',
      name: 'Shooting method for bound states',
      statement: String.raw`To find the bound states of $-\frac{\hbar^2}{2m}\psi''+V\psi=E\psi$ on $[a,b]$ (or on the line, cut off far out): pick a trial energy $E$, start the solution at the left end with $\psi(a)=0$, $\psi'(a)=1$ (or with the decaying exponential), and integrate across the interval — for instance with Numerov's fourth-order scheme. For a generic $E$ the solution runs off to $+\infty$ or $-\infty$ at the right; the sign of the end value $\psi(b;E)$ flips each time $E$ crosses an eigenvalue, and by Sturm's theorem (3.7) the number of zeros tells which eigenvalue. Bisecting on the sign of $\psi(b;E)$ then pins each eigenvalue down, gaining one binary digit per step, until the solution decays at both ends. A more stable variant shoots from both ends and bisects on the mismatch of the two at a matching point (their Wronskian).`,
      idea: String.raw`Outside the classically allowed region the equation has a growing and a decaying solution. Started from the left, the solution is generically a mixture, and the growing part dominates the far tail; its coefficient is a continuous function of $E$ that vanishes exactly at the eigenvalues, where the solution is pure decay. So the eigenvalue problem becomes root finding for a continuous function of one variable, and bisection converges linearly with ratio $\tfrac12$ — ten steps per three decimal digits. Integrating outward into the forbidden region is ill-conditioned (any error is amplified by the growing exponential), which is why careful codes shoot from both ends and match in the allowed region.`,
      caption: String.raw`Left: a potential (type or pick one) and the solution shot at the trial energy — **drag the gold handle** and watch the tail flip from $+\infty$ to $-\infty$ as you cross a level (faint dashes: the levels from a matrix solver, for reference). Right: where the tail goes, against $E$; its zero crossings are the eigenvalues. Press **Start bisection here** to bracket the nearest eigenvalue, then **Bisect** to halve the bracket: the table below gains a shared digit (green) every three or four steps. Switch to **shoot from both ends** to bisect instead on the Wronskian of the two solutions at the centre.`,
      deps: ['qm-3.7'],
      see: ['num-8.1', 'ode-4.7', 'qm-2.14'],
      refs: ['Griffiths ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shooting_method' },
      tags: ['shooting method', 'bisection', 'numerov'],
      viz(v) {
        const M = v.M, A = -6, B = 6, NG = 1201, K = 6;
        const PRE = { lopsided: ['lopsided well', '0.06 x^4 - 0.5 x + 1'], harmonic: ['harmonic', '0.5 x^2'], double: ['double well', '0.04 (x^2 - 8)^2'], morse: ['Morse-like', '4 (1 - exp(-0.8 (x + 1.5)))^2'] };
        let Vin = null, br = null, log = [];
        v.select('potential', Object.entries(PRE).map(([value, p]) => ({ value, label: p[0] })), 'harmonic', { onChange: (k) => { Vin.set(PRE[k][1]); br = null; log = []; } });
        Vin = v.input('$V(x) =$', PRE.harmonic[1], { vars: ['x'], width: 210, onChange: () => { br = null; log = []; } });
        const meth = v.select('method', [{ value: 'left', label: 'shoot from the left' }, { value: 'both', label: 'shoot from both ends' }], 'left', { onChange: () => { br = null; log = []; } });
        const sA = v.stage({ x: [A, B], y: [0, 1], height: 300, axes: 'box', weight: 1.2, xlabel: 'x', ylabel: 'E', title: 'the solution at the trial energy $E$' });
        const sB = v.stage({ x: [0, 1], y: [-1.2, 1.2], height: 300, axes: 'box', weight: 0.8, xlabel: 'E', yticks: [[-1, '−∞'], [0, '0'], [1, '+∞']], title: 'where it runs off to, against $E$' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 190, axes: false, full: true, title: 'bisection log: the bracket $[E_{\\rm lo},E_{\\rm hi}]$, shared digits in green' });
        const hE = sA.handle(A + 0.4, 1, { color: 'gold', r: 8, label: 'E', labelPos: 'e', constrain: (X, Y) => [hE.x, Y] });
        let S = null;
        const solve = () => {
          if (S && S.key === Vin.value) return S;
          const f = Vin.fn || ((x) => 0.5 * x * x), Vf = (x) => { const y = f(x); return Number.isFinite(y) ? M.clamp(y, -60, 400) : 400; };
          const x = Float64Array.from({ length: NG }, (_, i) => A + ((B - A) * i) / (NG - 1)), h = x[1] - x[0], Vg = Float64Array.from(x, Vf), R = M.schrodinger1D(Vf, [A, B], { n: 700, k: K });
          const Vmin = Math.min(...Vg), Etop = R.E[K - 1] + 0.25 * (R.E[K - 1] - Vmin);
          S = { key: Vin.value, x, h, Vg, Eref: R.E, Vmin, Etop, land: {} };
          hE.y = (R.E[0] * 0.4 + R.E[1] * 0.6);
          return S;
        };
        /** The signed function bisection works on, scaled into (−1, 1), and the solution(s) to draw. */
        const shoot = (S, E, m) => {
          const n = S.x.length, uL = numerov(S.Vg, S.h, E);
          let im = 0, ib = n - 1; while (im < n - 1 && S.Vg[im] > E) im++; while (ib > 0 && S.Vg[ib] > E) ib--;
          let nm = 1e-300; for (let i = 0; i <= Math.min(n - 1, ib + 4); i++) nm = Math.max(nm, Math.abs(uL[i]));
          if (m === 'left') return { uL, nm, val: uL[n - 1] / nm, g: (2 / Math.PI) * Math.atan(uL[n - 1] / nm / 3) };
          const uR = numerov(Float64Array.from(S.Vg).reverse(), S.h, E).reverse(), ic = Math.round((im + ib) / 2) || (n >> 1);
          let nr = 1e-300; for (let i = Math.max(0, im - 4); i < n; i++) nr = Math.max(nr, Math.abs(uR[i]));
          const W = (uL[ic] / nm) * (uR[ic + 1] - uR[ic - 1]) / (2 * S.h * nr) - (uR[ic] / nr) * (uL[ic + 1] - uL[ic - 1]) / (2 * S.h * nm);
          return { uL, uR, nm, nr, ic, val: W, g: (2 / Math.PI) * Math.atan(W) };
        };
        const landscape = (S, m) => { if (S.land[m]) return S.land[m]; const pts = []; for (let k = 0; k <= 500; k++) { const E = S.Vmin + ((S.Etop - S.Vmin) * k) / 500; pts.push([E, shoot(S, E, m).g]); } return (S.land[m] = pts); };
        const startBis = () => {
          const S = solve(), m = meth.value, E = hE.y, s0 = Math.sign(shoot(S, E, m).val), d = (S.Etop - S.Vmin) / 400;
          for (let k = 1; k < 400; k++) for (const sg of [1, -1]) { const e = E + sg * k * d; if (Math.sign(shoot(S, e, m).val) !== s0) { br = sg > 0 ? [E, e] : [e, E]; log = [[0, br[0], br[1]]]; return; } }
        };
        const bisectOnce = () => {
          if (!br) startBis(); if (!br) return; const S = solve(), m = meth.value, mid = (br[0] + br[1]) / 2, fl = Math.sign(shoot(S, br[0], m).val), fm = Math.sign(shoot(S, mid, m).val);
          br = fm === fl ? [mid, br[1]] : [br[0], mid]; log.push([log.length, br[0], br[1]]); hE.y = (br[0] + br[1]) / 2;
        };
        v.button('Start bisection here', () => startBis());
        v.button('Bisect', () => bisectOnce());
        v.button('Bisect ×10', () => { for (let i = 0; i < 10; i++) bisectOnce(); });
        let st = null;
        v.render(() => {
          const S = solve(), m = meth.value, span = S.Eref[K - 1] - S.Vmin;
          let a = 0, b = S.x.length - 1; while (a < b && S.Vg[a] > S.Etop + 0.2 * span) a++; while (b > a && S.Vg[b] > S.Etop + 0.2 * span) b--;
          const xl = S.x[Math.max(0, a - 10)], xr = S.x[Math.min(S.x.length - 1, b + 10)];
          sA.setView([xl, xr], [S.Vmin - 0.06 * span, S.Etop]);
          hE.x = xl + 0.05 * (xr - xl); hE.y = M.clamp(hE.y, S.Vmin + 0.005 * span, S.Etop - 0.01 * span);
          sA.clip(() => { sA.poly([[xl, S.Vmin - span], ...Array.from(S.x, (X, i) => [X, Math.min(S.Vg[i], S.Etop + span)]), [xr, S.Vmin - span]], { fill: 'muted', fillAlpha: 0.14, stroke: false }); sA.path(Array.from(S.x, (X, i) => [X, Math.min(S.Vg[i], S.Etop + span)]), { color: 'muted', width: 2 }); });
          S.Eref.forEach((e) => sA.hline(e, { color: 'muted', width: 0.8, dash: [2, 4], alpha: 0.7 }));
          const E = hE.y, sh = shoot(S, E, m), amp = 0.22 * span;
          sA.hline(E, { color: 'gold', width: 1, dash: [4, 3] });
          const good = Math.abs(sh.g) < 0.02;
          sA.clip(() => {
            sA.path(Array.from(S.x, (X, i) => [X, E + (amp * sh.uL[i]) / sh.nm]), { color: good ? 'green' : 'red', width: 2.4 });
            if (m === 'both') { sA.path(Array.from(S.x, (X, i) => [X, E + (amp * sh.uR[i]) / sh.nr]), { color: 'purple', width: 2, dash: [6, 4] }); sA.vline(S.x[sh.ic], { color: 'purple', width: 1, dash: [2, 3] }); }
          });
          if (m === 'left' && !good) { const up = sh.val > 0; sA.text(up ? 'tail → +∞' : 'tail → −∞', xr, E + (up ? 1 : -1) * 0.15 * span, { align: 'right', dx: -6, size: 12, color: 'red', weight: 700 }); }
          // landscape
          sB.setView([S.Vmin, S.Etop], [-1.2, 1.2]);
          sB.hline(0, { color: 'faint' });
          S.Eref.forEach((e) => sB.vline(e, { color: 'muted', dash: [2, 4], width: 1 }));
          if (br) sB.vband(br[0], br[1], { color: 'gold', alpha: 0.25 });
          sB.path(landscape(S, m), { color: 'accent', width: 2.2 });
          sB.dot(E, sh.g, { r: 6.5, color: 'gold' });
          // bisection table
          const c = sT.ctx, rows = log.slice(-7), FS = 12.5, mono = `500 ${FS}px "JetBrains Mono", ui-monospace, monospace`;
          sT.textPx('step', 14, 16, { size: 11, color: 'muted' }); sT.textPx('E_lo', 90, 16, { size: 11, color: 'muted' }); sT.textPx('E_hi', 300, 16, { size: 11, color: 'muted' }); sT.textPx('bracket width', 510, 16, { size: 11, color: 'muted' });
          if (!rows.length) sT.textPx('press “Start bisection here”, then “Bisect”', 14, 50, { size: 12.5, color: 'muted' });
          rows.forEach(([k, lo, hi], j) => {
            const Y = 42 + j * 20, a1 = lo.toFixed(11), b1 = hi.toFixed(11); let cm = 0; while (cm < a1.length && a1[cm] === b1[cm]) cm++;
            sT.textPx(String(k), 14, Y, { size: FS, color: 'ink' });
            for (const [s0, X0] of [[a1, 90], [b1, 300]]) {
              c.save(); c.font = mono; c.textBaseline = 'middle'; const w0 = c.measureText(s0.slice(0, cm)).width;
              c.fillStyle = v.color('green'); c.fillText(s0.slice(0, cm), X0, Y); c.fillStyle = v.color('muted'); c.fillText(s0.slice(cm), X0 + w0, Y); c.restore();
            }
            sT.textPx(v.sci(hi - lo, 2).replace(/\\times10\^\{(-?\d+)\}/, '×10^$1'), 510, Y, { size: FS, color: 'ink' });
          });
          const near = S.Eref.reduce((p, e) => (Math.abs(e - E) < Math.abs(p - E) ? e : p), S.Eref[0]);
          st = { E, g: sh.g, val: sh.val, br, steps: log.length ? log.length - 1 : 0, near, m };
        });
        v.legend([['red', 'solution: tail diverges'], ['green', 'tail decays: an eigenvalue'], ['purple', 'shot from the right', { dash: true }], ['accent', 'runaway (or Wronskian) against E']]);
        v.readout(() => st && `trial $E = ${st.E.toFixed(9)}$ · ${st.m === 'left' ? `tail value ${st.val > 0 ? '+' : '−'}$${v.sci(Math.abs(st.val), 1)}$ × the size of $\\psi$ in the well` : `Wronskian at the centre $${v.sci(st.val, 2)}$`}` + (st.br ? ` · after ${st.steps} bisection steps the bracket has width $${v.sci(st.br[1] - st.br[0], 2)}$ (= initial / $2^{${st.steps}}$)` : '') + ` · matrix solver (finite differences, 700 points) gives ${v.fix(st.near, 6)} for the nearest level — Numerov on 1201 points is more accurate, so the last digits differ.`);
      },
    },
    // ------------------------------------------------------------------ 3.19
    {
      num: '3.19',
      kind: 'Method',
      name: 'Transfer matrices',
      statement: String.raw`For a piecewise-constant potential, each layer of potential $V_j$ and thickness $d_j$ carries the pair $(\psi,\psi')$ across it by a $2\times2$ **transfer matrix**
$$M_j=\begin{pmatrix}\cos k_jd_j&\sin(k_jd_j)/k_j\\-k_j\sin k_jd_j&\cos k_jd_j\end{pmatrix},\qquad k_j=\frac{\sqrt{2m(E-V_j)}}{\hbar}$$
(cosh and sinh when $E<V_j$), with $\det M_j=1$. The whole structure is the product $M=M_N\cdots M_2M_1$, and $R$, $T$ follow from its four entries; any smooth potential can be treated as a stack of thin layers. For $N$ identical cells, $T(E)$ shows $N-1$ resonances in each energy window where the cell matrix satisfies $|\tfrac12\operatorname{tr}M_{\rm cell}|\le1$, and as $N\to\infty$ these windows become the **allowed bands** of a crystal ($\tfrac12\operatorname{tr}M_{\rm cell}=\cos qd$, Bloch wave number $q$), separated by **gaps** where transmission decays exponentially with $N$.`,
      idea: String.raw`The Schrödinger equation is a linear second-order ODE, so its solution at the far side of a layer depends linearly on $(\psi,\psi')$ at the near side; the matrix is the fundamental solution (ode-3.10), and its determinant is the Wronskian, conserved (so $\det=1$). Composition of layers is matrix multiplication. Matching to plane waves at both ends gives $t=2ik_L/D$ with $D=k_Lk_Rb-c+i(k_Ra+k_Ld)$ for $M=\begin{pmatrix}a&b\\c&d\end{pmatrix}$. For a periodic stack the eigenvalues of $M_{\rm cell}$ are $e^{\pm iqd}$ when $|\tfrac12\operatorname{tr}M|\le1$ — waves that propagate through any number of cells — and real $\lambda^{\pm1}$ otherwise, so one solution grows and the other decays: the band gap. The same algebra describes optical multilayers and dielectric mirrors (waves-6.11).`,
      caption: String.raw`A stack of $N$ identical barriers. Top: the stack and, for the energy set by the **gold handle**, $|\psi|$ of the scattering state. Bottom left: transmission $T(E)$ — with one barrier a smooth curve, with two a sharp resonance, and as you **add barriers** each allowed window fills with $N-1$ peaks while the gaps between go dark: bands forming. Green shading marks where the infinite crystal has bands, computed from one cell's matrix; bottom right shows that criterion, $\tfrac12\operatorname{tr}M_{\rm cell}$ against $E$, inside the strip $[-1,1]$. Switch on **disorder** (random spacings): the clean band structure smears out.`,
      deps: ['qm-3.13'],
      see: ['qm-9.8', 'waves-6.11', 'waves-5.9', 'waves-3.10'],
      refs: ['Griffiths ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Transfer-matrix_method_(optics)' },
      tags: ['transfer matrix', 'bands', 'periodic potential'],
      viz(v) {
        const M = v.M, EMAX = 6, NE = 1400;
        const nS = v.slider('number of barriers $N$', 1, 16, 6, { int: true });
        const hS = v.slider('barrier height $V_b$', 0.5, 6, 3, { step: 0.05 });
        const bS = v.slider('barrier width $b$', 0.1, 1, 0.3, { step: 0.01 });
        const gS = v.slider('spacing $s$ between barriers', 0.5, 3, 1.5, { step: 0.01 });
        const dis = v.toggle('disorder the spacings (±40 %)', false);
        const sP = v.stage({ x: [-1, 1], y: [0, 1], height: 170, axes: 'box', full: true, xlabel: 'x', title: 'the stack and $|\\psi|$ at the chosen energy' });
        const sT = v.stage({ x: [0, EMAX], y: [-0.03, 1.08], height: 260, axes: 'box', weight: 1.25, minWidth: 380, xlabel: 'E', ylabel: 'T', title: '$T(E)$; green: bands of the infinite crystal' });
        const sC = v.stage({ x: [0, EMAX], y: [-3, 3], height: 260, axes: 'box', weight: 0.75, minWidth: 300, xlabel: 'E', title: '$\\tfrac12\\operatorname{tr}M_{\\rm cell}(E)$' });
        let C = null;
        const hE = sT.handle(1, 0.5, { color: 'gold', r: 8, label: 'E', labelPos: 'n', constrain: (X) => { const E = M.clamp(X, 0.02, EMAX); return [E, interp(C.E, C.T, E)]; } });
        const build = () => {
          const key = `${nS.value}|${hS.value}|${bS.value}|${gS.value}|${dis.value}`; if (C && C.key === key) return C;
          const N = nS.value, Vb = hS.value, b = bS.value, s = gS.value, r = v.rng(7), segs = [];
          for (let i = 0; i < N; i++) { segs.push({ V: Vb, d: b }); if (i < N - 1) segs.push({ V: 0, d: dis.value ? s * (1 + 0.8 * (r() - 0.5)) : s }); }
          const E = Float64Array.from({ length: NE }, (_, i) => 0.02 + ((EMAX - 0.02) * i) / (NE - 1)), T = E.map((e) => scatter(e, segs).T);
          const cell = (e) => mul2(slab(2 * e, s), slab(2 * (e - Vb), b)), htr = E.map((e) => { const P = cell(e); return (P[0] + P[3]) / 2; });
          const bands = []; let inB = false, e0 = 0; for (let i = 0; i < NE; i++) { const ok = Math.abs(htr[i]) <= 1; if (ok && !inB) { inB = true; e0 = E[i]; } if ((!ok || i === NE - 1) && inB) { inB = false; bands.push([e0, E[i]]); } }
          C = { key, segs, E, T, htr, bands, cell, N, len: segs.reduce((q, g) => q + g.d, 0) };
          return C;
        };
        const NXD = 900;
        let st = null;
        v.render(() => {
          const C = build(), E = M.clamp(hE.x, 0.02, EMAX); hE.y = interp(C.E, C.T, E);
          // stack and wave
          const L = C.len, pad = Math.max(2, 0.25 * L), xs = Float64Array.from({ length: NXD }, (_, i) => -L / 2 - pad + ((L + 2 * pad) * i) / (NXD - 1));
          const W = scatterWave(E, C.segs, -L / 2, xs);
          let am = 0; for (let i = 0; i < NXD; i++) am = Math.max(am, Math.hypot(W.re[i], W.im[i]));
          sP.setView([-L / 2 - pad, L / 2 + pad], [0, 1.15 * Math.max(am, 1.2)]);
          let xb = -L / 2; for (const q of C.segs) { if (q.V > 0) sP.rect(xb, 0, xb + q.d, 0.55 * Math.max(am, 1.2), { fill: 'muted', fillAlpha: 0.3, stroke: false }); xb += q.d; }
          sP.path(Array.from(xs, (X, i) => [X, Math.hypot(W.re[i], W.im[i])]), { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.1 });
          // T(E) with bands
          C.bands.forEach(([a, b]) => sT.vband(a, b, { color: 'green', alpha: 0.12 }));
          sT.path(Array.from(C.E, (e, i) => [e, C.T[i]]), { color: 'accent', width: 1.8 });
          sT.vline(E, { color: 'gold', width: 1, dash: [2, 3] });
          // half trace
          sC.hband(-1, 1, { color: 'green', alpha: 0.14 });
          sC.hline(1, { color: 'green', width: 1, dash: [4, 3] }); sC.hline(-1, { color: 'green', width: 1, dash: [4, 3] });
          sC.clip(() => sC.path(Array.from(C.E, (e, i) => [e, C.htr[i]]), { color: 'purple', width: 2.2 }));
          const P = C.cell(E), h = (P[0] + P[3]) / 2; sC.vline(E, { color: 'gold', width: 1.2 }); sC.dot(E, M.clamp(h, -3, 3), { r: 6, color: 'gold' });
          // resonances in the first band
          let peaks = 0; const b1 = C.bands[0];
          if (b1) for (let i = 1; i < NE - 1; i++) if (C.E[i] >= b1[0] - 0.05 && C.E[i] <= b1[1] + 0.05 && C.T[i] > C.T[i - 1] && C.T[i] >= C.T[i + 1] && C.T[i] > 0.98) peaks++;
          st = { E, T: W.T, P, h, inBand: Math.abs(h) <= 1, peaks, N: C.N, b1, q: Math.abs(h) <= 1 ? Math.acos(h) : null, dis: dis.value };
        });
        v.legend([['accent', 'T(E), |ψ|'], ['green', 'allowed bands (infinite crystal)', { area: true }], ['purple', '½ tr M_cell']]);
        v.readout(() => st && `$E = ${v.fix(st.E, 3)}$: $M_{\\rm cell} = \\begin{pmatrix}${v.fix(st.P[0], 3)} & ${v.fix(st.P[1], 3)}\\\\ ${v.fix(st.P[2], 3)} & ${v.fix(st.P[3], 3)}\\end{pmatrix}$, $\\det = ${v.fix(st.P[0] * st.P[3] - st.P[1] * st.P[2], 9)}$, $\\tfrac12\\operatorname{tr} = ${v.fix(st.h, 4)}$ — ${st.inBand ? `in a band (Bloch phase $qd = ${v.fix(st.q, 3)}$)` : 'in a gap'} · $T = ${st.T > 1e-3 ? v.fix(st.T, 5) : `$${v.sci(st.T, 2)}$`}$` + (st.b1 && !st.dis ? ` · resonances with $T\\approx1$ in the first band: **${st.peaks}**, and $N-1 = ${st.N - 1}$` : '') + '.');
      },
    },
    // ------------------------------------------------------------------ 3.20
    {
      num: '3.20',
      kind: 'Model',
      name: 'Particle on a ring',
      statement: String.raw`A particle of mass $M$ confined to a circle of radius $R$, with angle $\varphi$, has $\hat H=-\frac{\hbar^2}{2MR^2}\frac{d^2}{d\varphi^2}$ and wave functions that must be single-valued, $\psi(\varphi+2\pi)=\psi(\varphi)$. The stationary states are
$$\psi_m(\varphi)=\frac{e^{im\varphi}}{\sqrt{2\pi}},\qquad E_m=\frac{\hbar^2m^2}{2MR^2},\qquad m\in\Z,$$
eigenstates of the angular momentum $L_z=-i\hbar\,\partial_\varphi$ with value $m\hbar$: a whole number of wavelengths fits around the ring. Every level with $m\neq0$ is **doubly degenerate** ($\pm m$: circulating clockwise and anticlockwise); real combinations $\cos m\varphi$, $\sin m\varphi$ are standing waves with no current. If the ring encloses a magnetic flux $\Phi$ (with no field on the ring itself), the levels become $E_m=\frac{\hbar^2}{2MR^2}\big(m-\Phi/\Phi_0\big)^2$, $\Phi_0=h/e$: the degeneracy is lifted, the spectrum repeats with period $\Phi_0$, and the ground state carries a persistent current — the Aharonov–Bohm effect.`,
      idea: String.raw`On the ring the free solutions are $e^{ik s}$ in arc length $s=R\varphi$, and single-valuedness requires $k\cdot2\pi R\in2\pi\Z$ — periodic boundary conditions quantize the momentum as walls did in the box (3.3), but with travelling instead of standing waves, so $+k$ and $-k$ both survive. Degeneracy is allowed here because the ring is not an interval: the proof of 3.8 needs the solutions to vanish at infinity, and on a circle nothing forces the Wronskian to be zero. A vector potential with flux $\Phi$ through the ring enters as $-i\hbar\partial_\varphi\to-i\hbar\partial_\varphi-e\Phi/2\pi$ (minimal coupling), shifting $m$ to $m-\Phi/\Phi_0$; a whole flux quantum can be removed by the gauge transformation $e^{i\varphi}$, hence the periodicity.`,
      caption: String.raw`Left: the ring with $\operatorname{Re}\psi$ drawn as a ripple around it, coloured by phase, turning in time. Choose the **wave number $m$**: whole numbers close up smoothly; try a non-integer and the wave fails to join (red mark) — not single-valued, so not allowed. **Superpose $\pm m$** for a standing wave with no circulation. Right: the energies $(m-\Phi/\Phi_0)^2$ against $m$, with degenerate pairs joined. Bottom: the spectrum against the **flux $\Phi$** — parabolas that cross at half-integer flux and repeat with period $\Phi_0$; the readout gives the persistent current $I=-\partial E/\partial\Phi$ for an electron on a ring of radius $R$.`,
      deps: ['qm-3.6'],
      see: ['qm-6.7', 'qm-7.4', 'cm-6.3'],
      refs: ['Griffiths ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Particle_in_a_ring' },
      tags: ['particle on a ring', 'degeneracy', 'aharonov–bohm'],
      viz(v) {
        const M = v.M, C = M.CONST, PER = 24;
        const mS = v.slider('wave number $m$ (try non-integers)', -4, 4, 2, { step: 0.05 });
        const sup = v.toggle('superpose $+m$ and $-m$ (standing wave)', false);
        const fS = v.slider('enclosed flux $\\Phi/\\Phi_0$', -1, 1, 0, { step: 0.01 });
        const RS = v.slider('ring radius $R$ (nm)', 0.5, 5, 1, { step: 0.05 });
        const sR = v.stage({ x: [-1.55, 1.55], y: [-1.55, 1.55], equal: true, height: 320, axes: false, weight: 0.9, title: '$\\operatorname{Re}\\,\\psi(\\varphi,t)$ around the ring (colour $\\arg\\psi$)' });
        const sE = v.stage({ x: [-4.6, 4.6], y: [-0.5, 21], height: 320, axes: 'box', weight: 1.1, xlabel: 'm', ylabel: 'E / ε', title: 'levels $E_m=\\varepsilon\\,(m-\\Phi/\\Phi_0)^2$, $\\varepsilon=\\hbar^2/2MR^2$' });
        const sF = v.stage({ x: [-1.5, 1.5], y: [-0.2, 6.5], height: 200, axes: 'box', full: true, xlabel: 'Φ / Φ₀', ylabel: 'E / ε', title: 'the spectrum against the enclosed flux (Aharonov–Bohm)' });
        let st = null;
        v.animate((t) => {
          const col = phaseLUT(v), m = mS.value, F = fS.value, isInt = Math.abs(m - Math.round(m)) < 1e-9, E = (m - F) ** 2, Em = (-m - F) ** 2;
          // ring
          sR.circle(0, 0, 1, { color: 'muted', width: 1.4, alpha: 0.6 });
          sR.circle(0, 0, 0.32, { fill: Math.abs(F) > 0.005 ? 'purple' : 'faint', fillAlpha: 0.15 + 0.5 * Math.min(1, Math.abs(F)), color: 'purple', width: Math.abs(F) > 0.005 ? 1.4 : 0.6 });
          if (Math.abs(F) > 0.005) sR.text(`Φ = ${v.fix(F, 2)} Φ₀`, 0, 0, { align: 'center', size: 11.5, color: 'purple', weight: 600 });
          const NP = 720, ph = (p) => { // ψ(φ, t) up to normalization
            const a = m * p - E * t * 0.5; if (!sup.value) return [Math.cos(a), Math.sin(a)];
            const b = -m * p - Em * t * 0.5; return [(Math.cos(a) + Math.cos(b)) / Math.SQRT2, (Math.sin(a) + Math.sin(b)) / Math.SQRT2];
          };
          let prev = null;
          for (let k = 0; k <= NP; k++) {
            const p = (TAU * k) / NP, [re, im] = ph(p), r = 1 + 0.28 * re, P = [r * Math.cos(p), r * Math.sin(p)];
            if (prev) sR.line(prev[0], prev[1], P[0], P[1], { color: col(Math.atan2(im, re)), width: 3.2 });
            prev = P;
          }
          if (!isInt) { const [r0] = ph(0), [r1] = ph(TAU); sR.line(1 + 0.28 * r0, 0, 1 + 0.28 * r1, 0, { color: 'red', width: 4 }); sR.dot(1 + 0.28 * r1, 0, { r: 5, color: 'red' }); sR.text('does not join', 1.18, -0.16, { size: 11.5, color: 'red', weight: 600, align: 'center' }); }
          const cur = sup.value ? 0 : m - F;
          if (Math.abs(cur) > 0.02) { const dir = Math.sign(cur), a0 = 2.1, a1 = a0 + dir * 0.7; sR.curve((u) => [1.42 * Math.cos(u), 1.42 * Math.sin(u)], a0, a1, { color: 'green', width: 2.4 }); const ex = 1.42 * Math.cos(a1), ey = 1.42 * Math.sin(a1); sR.arrow(ex + 0.12 * dir * Math.sin(a1), ey - 0.12 * dir * Math.cos(a1), ex, ey, { color: 'green', width: 2.4, head: 9 }); sR.text('current', 1.42 * Math.cos(a0 + dir * 0.35) * 1.13, 1.42 * Math.sin(a0 + dir * 0.35) * 1.13, { size: 11, color: 'green', align: 'center' }); }
          phaseWheel(sR, col, sR.W - 30, 36, 11);
          // levels against m
          sE.fn((q) => (q - F) ** 2, { color: 'muted', width: 1.2, dash: [4, 4] });
          for (let k = -4; k <= 4; k++) { const e = (k - F) ** 2; sE.dot(k, e, { r: 5, color: 'accent' }); }
          for (let k = 1; k <= 4; k++) { const e1 = (k - F) ** 2, e2 = (-k - F) ** 2; if (Math.abs(e1 - e2) < 1e-9) sE.line(-k, e1, k, e1, { color: 'accent', width: 1, dash: [3, 3], alpha: 0.6 }); }
          sE.dot(m, E, { r: 8, color: isInt ? 'gold' : 'red', hollow: !isInt, width: 2.4 });
          if (sup.value) sE.dot(-m, Em, { r: 8, color: 'gold', hollow: true, width: 2.4 });
          // spectrum vs flux
          for (let k = -4; k <= 4; k++) sF.fn((p) => (k - p) ** 2, { color: k === Math.round(m) ? 'accent' : 'muted', width: k === Math.round(m) ? 2.4 : 1.2 });
          sF.fn((p) => { let e = Infinity; for (let k = -4; k <= 4; k++) e = Math.min(e, (k - p) ** 2); return e; }, { color: 'green', width: 3, alpha: 0.5 });
          sF.vline(F, { color: 'gold', width: 1.6 }); if (isInt) sF.dot(F, E, { r: 6, color: 'gold' });
          const eps = (C.hbar * C.hbar) / (2 * C.me * (RS.value * 1e-9) ** 2) / C.eV, I = (-2 * (Math.round(m) - F) * -1 * eps * C.eV * C.e) / C.h; // −∂E/∂Φ with ∂/∂Φ = (1/Φ₀)∂/∂(Φ/Φ₀), Φ₀ = h/e
          st = { m, F, isInt, E, eps, deg: !sup.value && isInt && Math.round(m) !== 0 && Math.abs(F) < 1e-9, I, sup: sup.value };
        }, { period: PER, still: 3 });
        v.legend([['accent', 'allowed levels (integer m)'], ['gold', 'chosen state', { dot: true }], ['green', 'ground state / current'], ['purple', 'enclosed flux']]);
        v.readout(() => st && (st.isInt ? `$m = ${Math.round(st.m)}$: $E = ${v.fix(st.E, 3)}\\,\\varepsilon$ with $\\varepsilon = \\hbar^2/2m_eR^2 = ${v.fix(st.eps * 1000, 3)}$ meV for an electron on a ring of radius ${v.fix(RS.value, 2)} nm` + (st.deg ? ` · **doubly degenerate** with $m = ${-Math.round(st.m)}$` : Math.round(st.m) === 0 ? ' · the only nondegenerate level' : st.sup ? ' · a standing wave: equal parts $\\pm m$, no current' : ' · the flux lifts the $\\pm m$ degeneracy') + (st.sup ? '' : ` · current $I = -\\partial E/\\partial\\Phi = ${v.fix(st.I * 1e9, 2)}$ nA`) : `$m = ${v.fix(st.m, 2)}$ is not a whole number: $e^{im\\varphi}$ jumps by the phase $e^{2\\pi im} = e^{${v.fix(TAU * st.m, 2)}i}$ going once round, so it is not single-valued — not an allowed state.`));
      },
    },
  ],
};
