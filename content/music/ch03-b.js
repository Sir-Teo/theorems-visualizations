// Music Theory & Acoustics — Chapter 3 (part b): membranes, plates, bars and bells
import { TAU, SR, C_AIR, RHO_AIR, noteOf, centsTxt, playhead, finish, synth, join, signedRamp, keyboard } from './ch03.shared.js';

// ---------------------------------------------------------------- Bessel functions
/** J_m(x) = (1/2π)∫₀^{2π} cos(mτ − x sin τ) dτ by the trapezoid rule, which is exponentially accurate for this periodic integrand. */
function besselJ(m, x) {
  const N = Math.max(32, Math.ceil(Math.abs(x) + Math.abs(m)) + 40); let s = 0;
  for (let k = 0; k < N; k++) { const t = (TAU * k) / N; s += Math.cos(m * t - x * Math.sin(t)); }
  return s / N;
}
const besselJp = (m, x) => 0.5 * (besselJ(m - 1, x) - besselJ(m + 1, x));
const ZEROS = new Map();
/** n-th positive zero j_{m,n} of J_m: scan in steps of 0.05, then bisect to machine precision. */
function besselZero(m, n) {
  const key = m + ',' + n; if (ZEROS.has(key)) return ZEROS.get(key);
  let x = 0.3, prev = besselJ(m, x), k = 0, z = NaN;
  while (x < 80) {
    const y = besselJ(m, x + 0.05);
    if (prev * y < 0) { k++; if (k === n) { let a = x, b = x + 0.05, fa = prev; for (let i = 0; i < 60; i++) { const c = 0.5 * (a + b), fc = besselJ(m, c); if (fa * fc <= 0) b = c; else { a = c; fa = fc; } } z = 0.5 * (a + b); break; } }
    prev = y; x += 0.05;
  }
  ZEROS.set(key, z); return z;
}
/** Tabulated zeros j_{m,n}, m = 0…5, n = 1…4, to 4 decimals (Abramowitz & Stegun Table 9.5, as reproduced by MathWorld). */
const BESSEL_TABLE = [
  [2.4048, 5.5201, 8.6537, 11.7915], [3.8317, 7.0156, 10.1735, 13.3237], [5.1356, 8.4172, 11.6198, 14.796],
  [6.3802, 9.761, 13.0152, 16.2235], [7.5883, 11.0647, 14.3725, 17.616], [8.7715, 12.3386, 15.7002, 18.9801],
];
/** Radial profile r ↦ J_m(j r) on [0, 1] as a lookup table (for fast drawing). */
function radialTable(m, j, n = 400) {
  const T = new Float64Array(n + 1); for (let i = 0; i <= n; i++) T[i] = besselJ(m, (j * i) / n);
  return (r) => { if (r >= 1) return 0; const u = r * n, i = Math.floor(u), f = u - i; return T[i] + (T[i + 1] - T[i]) * f; };
}


// ---------------------------------------------------------------- air loading of a circular membrane (3.8)
/**
 * For the mode J_m(j r) cos mθ of a unit disk set in a rigid baffle: the squared Hankel transform
 * F(κ)² = (j J_m'(j) J_m(κ)/(κ² − j²))², tabulated on [0, 40], and the mode's norm ∫₀¹ J_m(jr)² r dr = J_m'(j)²/2.
 * load(k0) (k0 = ωa/c) returns the added mass per unit area per side, in units of ρa, and the radiation resistance,
 * in units of ρωa: m = ∫₀^∞ F(√(k0² + u²))² du / N, r = ∫₀^{k0} F(√(k0² − u²))² du / N (the κ > k0 part of the field is
 * evanescent and only adds mass; the κ < k0 part radiates).
 */
function airMode(m, n) {
  const j = besselZero(m, n), jp = besselJp(m, j), N = (jp * jp) / 2, h = 0.01, K = 40, G = new Float64Array(Math.round(K / h) + 2);
  for (let i = 0; i < G.length; i++) { const x = i * h, d = x * x - j * j, f = Math.abs(x - j) < 1e-7 ? (jp * jp) / 2 : (j * jp * besselJ(m, x)) / d; G[i] = f * f; }
  const F2 = (x) => { const u = x / h, i = Math.floor(u); return i >= G.length - 1 ? 0 : G[i] + (G[i + 1] - G[i]) * (u - i); };
  const load = (k0) => {
    let mI = 0; const du = 0.02; for (let u = du / 2; u < K; u += du) mI += F2(Math.sqrt(k0 * k0 + u * u)) * du;
    mI += 1 / (4 * Math.PI * K ** 4) / N; // tail, from the asymptotic J_m(κ)² ≈ 1/(πκ) on average
    let rI = 0; if (k0 > 0) { const n2 = 120, d2 = k0 / n2; for (let i = 0; i < n2; i++) { const u = (i + 0.5) * d2; rI += F2(Math.sqrt(k0 * k0 - u * u)) * d2; } }
    return { m: mI / N, r: rI / N };
  };
  return { m, n, j, jp, load, inner: load(0) };
}

/** Theme-aware [r, g, b] for a signed value u ∈ [−1, 1] (blue … panel … red), via signedRamp. */
const colOf = (sr, u) => sr.col(Math.max(-1, Math.min(1, u)));

export default {
  collection: 'music',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Membrane modes are Laplacian eigenfunctions',
      statement: String.raw`A membrane with tension $T$ per unit length and mass $\sigma$ per unit area, stretched over a region $\Omega$ and fixed along its edge, moves (for small displacements $u$) by the two-dimensional wave equation $u_{tt}=c^2\Delta u$, $c=\sqrt{T/\sigma}$, with $u=0$ on $\partial\Omega$. Its normal modes are $u=\varphi(x,y)\cos\omega t$ where $\varphi$ is a **Dirichlet eigenfunction of the Laplacian**,
$$-\Delta\varphi=\lambda\varphi\ \text{in }\Omega,\qquad\varphi=0\text{ on }\partial\Omega,\qquad\omega=c\sqrt\lambda .$$
For a bounded region the eigenvalues form a sequence $0<\lambda_1<\lambda_2\le\lambda_3\le\cdots\to\infty$, the eigenfunctions can be chosen orthonormal and complete, and every motion is a sum of modes. For the rectangle $[0,a]\times[0,b]$:
$$\varphi_{mn}=\sin\frac{m\pi x}a\,\sin\frac{n\pi y}b,\qquad f_{mn}=\frac c2\sqrt{\frac{m^2}{a^2}+\frac{n^2}{b^2}},\qquad m,n\ge1,$$
with $m-1$ and $n-1$ straight nodal lines. The frequencies are not integer multiples of $f_{11}$. Two modes share a frequency (are **degenerate**) when $m^2/a^2+n^2/b^2=m'^2/a^2+n'^2/b^2$, as $(m,n)$ and $(n,m)$ do on a square; then every combination of them is again a mode, with curved nodal lines.`,
      idea: String.raw`Substituting $u=\varphi(x,y)\cos\omega t$ into the wave equation splits off the time and leaves $c^2\Delta\varphi=-\omega^2\varphi$: a mode is a shape that the Laplacian (the net tension force, which measures how much $u$ differs from its local average, 11.3 of RCA) maps to a multiple of itself, so that every point is pulled back in proportion to its own displacement and all points swing in step. On a rectangle, separating variables reduces this to two strings (2.4), one in each direction. The general facts come from functional analysis: $(-\Delta)^{-1}$ with Dirichlet conditions is a compact, positive, self-adjoint operator, so the spectral theorem gives a discrete spectrum with an orthonormal basis of eigenfunctions. A combination of two modes with different frequencies is not a mode: its shape changes in time.`,
      caption: String.raw`Click a curve in the right-hand panel to choose a mode $(m,n)$; it plots the frequencies of the first modes against the **aspect ratio** of a drum of fixed area, so crossings are degeneracies. Left: the membrane in 3D (drag to rotate); middle: from above, with the nodal lines in black. Set the aspect ratio to 1 (a square) and **mix** $(m,n)$ with $(n,m)$: the nodal lines bend into diagonals and curves, and stay put. Move off the square and the same mixture's nodal lines start to wander, because the two parts now oscillate at different rates. The readout tests the eigenvalue equation numerically.`,
      deps: ['music-2.2', 'rca-11.3', 'fa-4.25'],
      see: ['waves-2.6', 'pde-5.6', 'pde-7.1', 'pde-7.8', 'music-11.7'],
      refs: ['Benson ch. 3'],
      tags: ['membrane', 'eigenvalues'],
      credit: 'Euler, 1766 (rectangular membrane); Poisson, 1829',
      scope: String.raw`Small transverse displacements of a perfectly flexible membrane under uniform tension, with no stiffness, no air loading (see 3.8) and no damping.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vibrations_of_a_circular_membrane' },
      viz(v) {
        const M = v.M, F = 196, NMX = 4;
        let m = 2, n = 1;
        const arS = v.slider('aspect ratio $b/a$', 0.5, 2, 1, { step: 0.005, fmt: (x) => v.fix(x, 3) });
        const mixS = v.slider('mix with mode $(n,m)$', 0, 90, 30, { step: 1, fmt: (x) => x + '°' });
        const s3 = v.stage3d({ range: 0.78, height: 280, yaw: -0.6, pitch: 0.55, axes: false, weight: 1.05, minWidth: 250 });
        const hm = v.stage({ x: [-0.78, 0.78], y: [-0.78, 0.78], equal: true, height: 280, axes: false, weight: 0.9, minWidth: 230 });
        const sp = v.stage({ x: [0.42, 2.06], y: [0.75, 2.85], height: 280, axes: 'box', xlabel: 'aspect ratio b/a', xticks: [0.5, 1, 1.5, 2], yticks: [1, 1.5, 2, 2.5], weight: 1.15, minWidth: 260, title: 'frequency / f₁₁ of the square, area fixed' });
        const fOf = (mm, nn, r) => Math.sqrt((mm * mm * r + (nn * nn) / r) / 2); // area 1: a = 1/√r, b = √r
        const modes = []; for (let i = 1; i <= NMX; i++) for (let j = 1; j <= NMX; j++) modes.push([i, j]);
        sp.onClick((x, y) => {
          const r = M.clamp(x, 0.5, 2); let best = null, bd = Infinity;
          for (const [i, j] of modes) { const d = Math.abs(fOf(i, j, r) - y); if (d < bd) { bd = d; best = [i, j]; } }
          if (best && bd < 0.25) { [m, n] = best; arS.set(r); v.invalidate(); }
        });
        const ph = playhead(v);
        v.soundButton('Listen to the mode', (snd) => { const r = arS.value, th = (mixS.value * Math.PI) / 180, a1 = m === n ? 1 : Math.cos(th), a2 = m === n ? 0 : Math.sin(th), p = [[F * fOf(m, n, r), Math.abs(a1)]]; if (a2) p.push([F * fOf(n, m, r), Math.abs(a2)]); snd.tone(p, { duration: 2.5, gain: 0.25 }); ph.start(2.5); });
        v.soundButton('first eight modes', (snd) => { const r = arS.value, list = modes.map(([i, j]) => fOf(i, j, r)).sort((p, q) => p - q).slice(0, 8); list.forEach((f, k) => snd.tone(F * f, { duration: 0.42, gain: 0.22, delay: 0.5 * k, release: 0.1 })); });
        let info = null;
        v.animate((t) => {
          const r = arS.value, A = 1 / Math.sqrt(r), B = Math.sqrt(r), th = (mixS.value * Math.PI) / 180, deg = m !== n;
          const c1 = deg ? Math.cos(th) : 1, c2 = deg ? Math.sin(th) : 0, f1 = fOf(m, n, r), f2 = fOf(n, m, r), tt = 0.55 * t;
          const p1 = Math.cos(TAU * tt * f1), p2 = Math.cos(TAU * tt * f2);
          // shape on [−A/2, A/2] × [−B/2, B/2]
          const phi = (i, j, x, y) => Math.sin((i * Math.PI * (x + A / 2)) / A) * Math.sin((j * Math.PI * (y + B / 2)) / B);
          const U = (x, y) => c1 * phi(m, n, x, y) * p1 + c2 * phi(n, m, x, y) * p2;
          const sr = signedRamp(v);
          // colours show the instantaneous shape rescaled to its own maximum, so the pattern stays visible as it passes through zero
          let mx = 1e-3; for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24; j++) mx = Math.max(mx, Math.abs(U(A * (i / 24 - 0.5), B * (j / 24 - 0.5))));
          // ---- 3D
          s3.surface((uu, vv) => [uu * A, vv * B, 0.3 * U(uu * A, vv * B)], [-0.5, 0.5], [-0.5, 0.5], { nu: 26, nv: 26, colorFn: (uu, vv, p) => colOf(sr, p[2] / 0.3 / mx), alpha: 0.95 });
          s3.path([[-A / 2, -B / 2, 0], [A / 2, -B / 2, 0], [A / 2, B / 2, 0], [-A / 2, B / 2, 0], [-A / 2, -B / 2, 0]], { color: 'ink', width: 2.2 });
          // ---- top view
          hm.heat((x, y) => (Math.abs(x) <= A / 2 && Math.abs(y) <= B / 2 ? U(x, y) / mx : NaN), { range: [-1.1, 1.1], cmap: 'theme-diverging', res: 3 });
          hm.clip(() => hm.contour(U, 0, { color: 'ink', width: 2, res: 90 }), [-A / 2, A / 2], [-B / 2, B / 2]);
          hm.rect(-A / 2, -B / 2, A / 2, B / 2, { color: 'ink', width: 2 });
          hm.corner(deg && c2 > 1e-6 && c1 > 1e-6 ? `(${m},${n}) mixed with (${n},${m})` : `mode (${m},${n})`, 'tl', { color: 'ink', weight: 600 });
          if (deg && c1 > 1e-6 && c2 > 1e-6) hm.corner(Math.abs(f1 - f2) < 1e-9 ? 'degenerate: a standing mode' : 'not a mode: nodal lines move', 'bl', { color: Math.abs(f1 - f2) < 1e-9 ? 'green' : 'red', weight: 600, size: 11 });
          // ---- spectrum against aspect ratio
          sp.vline(1, { color: 'faint', width: 1, dash: [3, 3] });
          for (const [i, j] of modes) {
            const sel = (i === m && j === n) || (deg && c2 > 1e-6 && i === n && j === m);
            sp.fn((x) => fOf(i, j, x), { domain: [0.5, 2], color: sel ? (i === m && j === n ? 'gold' : 'orange') : 'accent', width: sel ? 3 : 1.4, alpha: sel ? 1 : 0.55 });
          }
          sp.vline(r, { color: 'ink', width: 1.2, dash: [4, 3] });
          for (const [i, j] of modes) { const y = fOf(i, j, r); if (y < 2.85) sp.dot(r, y, { r: 3.2, color: 'accent' }); }
          sp.dot(r, f1, { r: 6, color: 'gold' }); if (deg && c2 > 1e-6) sp.dot(r, f2, { r: 5, color: 'orange' });
          for (const [i, j] of modes) { const y = fOf(i, j, 2); if (y < 2.8 && y > 0.75) sp.text(`${i},${j}`, 2.05, y, { align: 'right', color: 'muted', size: 9.5 }); }
          if (ph.t != null) s3.text('♪', [A / 2, B / 2, 0.6], { color: 'gold', size: 18 });
          info = { r, A, B, th, deg, c1, c2, f1, f2 };
        }, { still: 0.4 });
        v.legend([['gold', 'chosen mode (m, n)'], ['orange', 'its partner (n, m)'], ['ink', 'nodal lines']]);
        v.readout(() => {
          if (!info) return '';
          const { A, B, deg, c1, c2, f1, f2, r } = info, lam = Math.PI * Math.PI * ((m * m) / (A * A) + (n * n) / (B * B));
          // test −Δφ = λφ on a grid with the five-point Laplacian, for the shape at t = 0
          const phi = (x, y) => c1 * Math.sin((m * Math.PI * x) / A) * Math.sin((n * Math.PI * y) / B) + c2 * Math.sin((n * Math.PI * x) / A) * Math.sin((m * Math.PI * y) / B);
          const h = 1e-3, qs = []; let num = 0, den = 0;
          for (let i = 1; i < 24; i++) for (let j = 1; j < 24; j++) {
            const x = (A * i) / 24, y = (B * j) / 24, p0 = phi(x, y);
            const lap = (phi(x + h, y) + phi(x - h, y) + phi(x, y + h) + phi(x, y - h) - 4 * p0) / (h * h);
            if (Math.abs(p0) > 0.2) qs.push(-lap / p0);
            num += -lap * p0; den += p0 * p0;
          }
          const lo = Math.min(...qs), hi = Math.max(...qs);
          const same = modes.filter(([i, j]) => !(i === m && j === n) && Math.abs(fOf(i, j, r) - f1) < 1e-3 * f1).map(([i, j]) => `(${i},${j})`);
          const head = `drum of area 1, $a$ = ${v.fix(A, 3)}, $b$ = ${v.fix(B, 3)}: mode (${m},${n}) at $f_{${m}${n}}$ = ${v.fix(f1, 4)} $f_{11}^{\\square}$ (${v.fix(F * f1, 1)} Hz if the square drum's fundamental is ${F} Hz) · exact $\\lambda=\\pi^2(m^2/a^2+n^2/b^2)$ = ${v.fix(lam, 3)}`;
          const test = hi - lo < 1e-3 * lam ? `numerically $-\\Delta\\varphi/\\varphi$ = ${v.fix((lo + hi) / 2, 3)} at every sampled point (spread $${v.sci(hi - lo, 1)}$): an eigenfunction` : `numerically $-\\Delta\\varphi/\\varphi$ ranges from ${v.fix(lo, 2)} to ${v.fix(hi, 2)}: **not** an eigenfunction (Rayleigh quotient ${v.fix(num / den, 2)})`;
          return `${head} · ${test}${same.length ? ` · degenerate with ${same.join(', ')}` : ''}${deg && c1 > 1e-6 && c2 > 1e-6 && Math.abs(f1 - f2) > 1e-9 ? ` · the partner (${n},${m}) vibrates at ${v.fix(f2, 4)}, so the mixture drifts with beat period ${v.fix(1 / Math.abs(F * (f1 - f2)), 2)} s at ${F} Hz` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'The circular drum and Bessel zeros',
      statement: String.raw`For a circular membrane of radius $a$ fixed at its rim, separating variables in polar coordinates gives the Dirichlet eigenfunctions (3.6)
$$\varphi_{mn}(r,\theta)=J_m\!\Big(j_{mn}\frac ra\Big)\cos m\theta\quad(\text{and }\sin m\theta),\qquad f_{mn}=\frac{j_{mn}}{2\pi a}\sqrt{\frac T\sigma},\qquad m\ge0,\ n\ge1,$$
where $J_m$ is the Bessel function of order $m$ and $j_{mn}$ its $n$-th positive zero. Mode $(m,n)$ has $m$ nodal diameters and $n-1$ nodal circles inside the rim, at radii $j_{mk}a/j_{mn}$, $k<n$. Relative to the fundamental $(0,1)$ the frequencies are
$$1,\ 1.593,\ 2.136,\ 2.295,\ 2.653,\ 2.917,\ 3.155,\ 3.500,\ 3.598,\ 3.647,\ \dots$$
for $(0,1),(1,1),(2,1),(0,2),(3,1),(1,2),(4,1),(2,2),(0,3),(5,1)$: an inharmonic set. A blow excites many of them at once, so an ideal drum has no definite pitch.`,
      idea: String.raw`In polar coordinates $-\Delta\varphi=\lambda\varphi$ separates as $\varphi=R(r)\cos m\theta$, where $m$ must be a whole number for $\varphi$ to be single-valued, and $R$ satisfies Bessel's equation $r^2R''+rR'+(\lambda r^2-m^2)R=0$. The solution that stays finite at the centre is $J_m(\sqrt\lambda\,r)$, and the fixed rim forces $J_m(\sqrt\lambda\,a)=0$, so $\sqrt\lambda\,a$ must be a zero of $J_m$. Bessel functions oscillate like damped cosines, $J_m(x)\approx\sqrt{2/\pi x}\cos(x-m\pi/2-\pi/4)$, so their zeros become evenly spaced only far out, and the zeros of different orders interleave with no common spacing: nothing forces whole-number ratios, unlike the string's $\sin(n\pi x/L)$.`,
      caption: String.raw`Choose the number of nodal diameters $m$ and the circle count $n$. Left: the drumhead in 3D (drag to rotate); middle: from above, with its nodal diameters and circles and a gold **strike point** you can drag. Bottom left: $J_m(x)$ with its zeros, computed here by numerical integration and root-finding; the thick part, from 0 to $j_{mn}$, is the mode's radial profile, squeezed to fit the drum. Bottom right: the modes' frequencies against the harmonic grid (dashed), with bar heights showing how strongly a blow at the strike point excites each. *Strike* plays that blow; a blow at the centre excites only $m=0$.`,
      deps: ['music-3.6'],
      see: ['waves-2.7', 'pde-7.1', 'ode-4.4', 'pde-7.12'],
      refs: ['Benson ch. 3', 'Benson ch. 2'],
      tags: ['drum', 'bessel'],
      credit: 'Euler, 1766; Poisson, 1829; Bessel functions: Bessel, 1824',
      scope: String.raw`An ideal membrane in a vacuum: no air loading, no stiffness, no damping. Real drums are loaded by the air on both sides, which lowers and re-spaces the modes (3.8).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vibrations_of_a_circular_membrane' },
      viz(v) {
        const M = v.M, F01 = 150, LIST = [];
        for (let mm = 0; mm <= 6; mm++) for (let nn = 1; nn <= 4; nn++) LIST.push([mm, nn, besselZero(mm, nn)]);
        LIST.sort((p, q) => p[2] - q[2]);
        const j01 = besselZero(0, 1);
        const mS = v.slider('nodal diameters $m$', 0, 5, 1, { int: true });
        const nS = v.slider('circles $n$', 1, 3, 1, { int: true });
        const s3 = v.stage3d({ range: 0.95, height: 280, yaw: -0.5, pitch: 0.5, axes: false, weight: 1, minWidth: 380 });
        const hm = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 280, axes: false, weight: 1, minWidth: 380 });
        const bf = v.stage({ x: [0, 16.4], y: [-0.5, 1.05], height: 240, axes: true, xticks: [], yticks: [-0.4, 0.5, 1], weight: 1, minWidth: 380, title: 'Bessel function and its zeros' });
        const sp = v.stage({ x: [0, 4.3], y: [-0.08, 1.25], height: 240, axes: 'box', xticks: [1, 2, 3, 4], yticks: [], weight: 1, minWidth: 380, title: 'modes at f / f₀₁; height: how strongly the blow excites each' });
        const hS = hm.handle(0.62, 0.28, { color: 'gold', r: 8, label: 'strike', labelPos: 'e', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 0.95 ? [(x * 0.95) / r, (y * 0.95) / r] : [x, y]; } });
        const tables = new Map();
        const tab = (mm, nn) => { const k = mm + ',' + nn; if (!tables.has(k)) tables.set(k, radialTable(mm, besselZero(mm, nn))); return tables.get(k); };
        // a blow at (r0, θ0) gives mode (m, n) an amplitude ∝ φ̂_mn(r0, θ0), the value of the L²-normalized mode there (∫J_m(jr)² r dr = J_{m+1}(j)²/2)
        const excite = () => {
          const r0 = Math.hypot(hS.x, hS.y), t0 = Math.atan2(hS.y, hS.x);
          return LIST.filter((e) => e[2] / j01 < 4.2).map(([mm, nn, j]) => {
            const R = tab(mm, nn)(r0), nrm = besselJ(mm + 1, j) ** 2 * (mm === 0 ? 2 : 1);
            return { m: mm, n: nn, j, a: R / Math.sqrt(nrm), ang: mm ? Math.cos(mm * t0) : 1 };
          });
        };
        const strikeSound = (dur = 2.2) => {
          const ex = excite(), mx = Math.max(...ex.map((e) => Math.abs(e.a))) || 1;
          return synth(ex.map((e) => { const f = (F01 * e.j) / j01; return { f, a: Math.abs(e.a) / mx / Math.sqrt(e.j / j01), d: 1.2 + 0.006 * f }; }), dur);
        };
        v.soundButton('Strike', (snd) => snd.samples(finish(strikeSound(), 0.8), SR, { gain: 0.6 }));
        v.soundButton('this mode alone', (snd) => snd.tone((F01 * besselZero(mS.value, nS.value)) / j01, { duration: 1.6, gain: 0.25 }));
        v.soundButton('a harmonic tone, for contrast', (snd) => snd.tone([[F01, 1], [2 * F01, 0.5], [3 * F01, 0.33], [4 * F01, 0.25]], { duration: 1.6, gain: 0.25 }));
        v.animate((t) => {
          const m = mS.value, n = nS.value, j = besselZero(m, n), R = tab(m, n), sr = signedRamp(v);
          let Rmax = 0; for (let i = 0; i <= 100; i++) Rmax = Math.max(Rmax, Math.abs(R(i / 100)));
          const ph = Math.cos(TAU * 0.5 * t * Math.sqrt(j / j01)), U = (r, th) => (R(r) * Math.cos(m * th)) / Rmax;
          // ---- 3D
          s3.surface((r, th) => [r * Math.cos(th), r * Math.sin(th), 0.42 * U(r, th) * ph], [0, 1], [0, TAU], { nu: 16, nv: 48, colorFn: (r, th) => colOf(sr, U(r, th) * (ph < 0 ? -1 : 1)), alpha: 0.95 });
          s3.curve((th) => [Math.cos(th), Math.sin(th), 0], 0, TAU, { color: 'ink', width: 2.2, n: 72 });
          // ---- top view: amplitude pattern, nodal diameters and circles, strike point
          hm.heat((x, y) => { const r = Math.hypot(x, y); return r <= 1 ? U(r, Math.atan2(y, x)) : NaN; }, { range: [-1.05, 1.05], cmap: 'theme-diverging', res: 3, key: `${m}|${n}` });
          for (let k = 0; k < m; k++) { const a = ((k + 0.5) * Math.PI) / m; hm.line(-Math.cos(a), -Math.sin(a), Math.cos(a), Math.sin(a), { color: 'ink', width: 1.8 }); }
          for (let k = 1; k < n; k++) hm.circle(0, 0, besselZero(m, k) / j, { color: 'ink', width: 1.8 });
          hm.circle(0, 0, 1, { color: 'ink', width: 2.6 });
          hm.corner(`(${m},${n}): ${m} diameter${m === 1 ? '' : 's'}, ${n - 1} circle${n === 2 ? '' : 's'}`, 'tl', { color: 'ink', weight: 600, size: 11.5 });
          // ---- Bessel function and its zeros
          bf.fn((x) => besselJ(m, x), { domain: [0, 16], n: 320, color: 'accent', width: 1.6, alpha: 0.75 });
          bf.fn((x) => besselJ(m, x), { domain: [0, j], n: 160, color: 'gold', width: 3.4 });
          for (let k = 1; besselZero(m, k) < 16.2; k++) { const z = besselZero(m, k), up = besselJ(m, z - 0.4) < 0; bf.dot(z, 0, { r: k === n ? 6 : 4, color: k === n ? 'gold' : 'accent' }); bf.text(`j${m},${k} = ${v.fix(z, 3)}`, z, up ? 0.13 : -0.13, { align: 'center', color: k === n ? 'gold' : 'muted', size: 10.5, weight: k === n ? 700 : 500 }); }
          bf.setTitle(`Bessel function J${m}(x) and its zeros; thick: the profile of mode (${m},${n})`);
          // ---- spectrum
          for (let q = 1; q <= 4; q++) sp.vline(q, { color: 'green', width: 1.2, dash: [5, 4], alpha: 0.6 });
          const ex = excite(), mx = Math.max(...ex.map((e) => Math.abs(e.a * e.ang))) || 1;
          let lastX = -1e9, lastY = 0;
          for (const e of ex) { // (ex is sorted by frequency)
            const x = e.j / j01, on = e.m === m && e.n === n, hgt = Math.max(0.03, Math.abs(e.a * e.ang) / mx);
            sp.line(x, 0, x, hgt, { color: on ? 'gold' : e.m === 0 ? 'red' : 'accent', width: on ? 3.4 : 2.4 });
            let ly = hgt + 0.07; if (sp.X(x) - lastX < 26 && Math.abs(ly - lastY) < 0.08) ly = lastY + 0.09;
            sp.text(`${e.m},${e.n}`, x, ly, { align: 'center', color: on ? 'gold' : 'muted', size: 9.5, weight: on ? 700 : 500 }); lastX = sp.X(x); lastY = ly;
          }
        }, { still: 0.5 });
        v.legend([['gold', 'chosen mode'], ['accent', 'modes with nodal diameters'], ['red', 'symmetric modes (m = 0)'], ['green', 'harmonic grid', { dash: true }]]);
        v.readout(() => {
          const m = mS.value, n = nS.value, j = besselZero(m, n), tabv = BESSEL_TABLE[m]?.[n - 1], ratio = j / j01, near = Math.max(1, Math.round(ratio));
          let worst = 0; for (let a = 0; a <= 5; a++) for (let b = 1; b <= 4; b++) worst = Math.max(worst, Math.abs(besselZero(a, b) - BESSEL_TABLE[a][b - 1]));
          const r0 = Math.hypot(hS.x, hS.y);
          return `$j_{${m}${n}}$ = ${v.fix(j, 6)} computed (table: ${tabv != null ? v.fix(tabv, 4) : '—'}; all 24 tabulated zeros $m\\le5$, $n\\le4$ agree to $${v.sci(worst, 1)}$) · $f_{${m}${n}}/f_{01}$ = ${v.fix(ratio, 4)}, ${centsTxt(1200 * Math.log2(ratio / near), 0)} from harmonic ${near} · on a drum with $f_{01}$ = ${F01} Hz: ${v.fix(F01 * ratio, 1)} Hz · strike at $r$ = ${v.fix(r0, 2)} $a$${r0 < 0.06 ? ': at the centre every mode with $m\\ge1$ has a node, so only the symmetric modes sound' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Timpani: pitch from air loading',
      statement: String.raw`A kettledrum (timpano) sounds a definite pitch although a membrane's modes are inharmonic (3.7). The reason is the air. The modes that dominate its sound, $(1,1),(2,1),(3,1),(4,1),(5,1)$ (one to five nodal diameters, no nodal circle inside), are measured at about
$$1 : 1.50 : 1.98 : 2.44 : 2.94\quad(\text{Rossing}),$$
close to $2:3:4:5:6$, the harmonics 2 to 6 of a pitch an octave below the $(1,1)$ mode, against $1 : 1.34 : 1.67 : 1.98 : 2.29$ for the same membrane in a vacuum. The air on both sides of the head moves with it and adds mass, most for the modes with the fewest nodal lines, so it lowers the low modes more than the high ones and spreads the ratios toward harmonic. The kettle's enclosed air stiffens the symmetric modes $(0,n)$, which radiate strongly and die away fast; striking the head about a quarter of the way in from the rim, as timpanists do, keeps them weak. The pitch heard is that of the principal $(1,1)$ mode.`,
      idea: String.raw`A mode $J_m(j r)\cos m\theta$ pushes the air above and below it; for the drum's low modes the air's wavelength is longer than the head's nodal spacing, so the air near the head mostly sloshes sideways between neighbouring up- and down-moving regions instead of radiating, and it adds an effective mass $\rho\,\langle1/\kappa\rangle$ per side, where $\kappa$ ranges over the wavenumbers present in the mode (a Hankel transform). Modes with fewer nodal diameters have more long-wavelength content, more air to carry along, and are lowered more: $\omega^2=T\,j_{mn}^2/a^2\,/\,(\sigma+\text{added mass})$. With a head of 0.26 kg/m² and air of 1.2 kg/m³, the added mass is comparable to the head's own, so the effect is large. The part of the field with $\kappa<\omega/c$ radiates and damps the mode; the monopole-like $(0,1)$ radiates best and dies within tenths of a second.`,
      caption: String.raw`The model computes the air's added mass and radiation for each mode of a 66 cm drumhead in a baffle (incompressible air inside the kettle, compressible and radiating air outside) and solves for the frequencies. Drag the **air density** from vacuum to real air (1×) and beyond: the $(m,1)$ modes, blue, slide toward the green harmonic targets $1.5, 2, 2.5, 3$ (bottom panel); triangles are Rossing's measurements. Toggle the **kettle** to see its air spring push the symmetric modes (red) up. Drag the gold mallet along the head: struck at the centre, only the symmetric modes sound. *Strike* to hear it; *vacuum, then air* compares the bare membrane with the loaded one.`,
      deps: ['music-3.7'],
      see: ['waves-1.11', 'music-11.1'],
      refs: ['Benson ch. 3'],
      tags: ['drum', 'timpani'],
      credit: 'Lord Rayleigh, 1877; Rossing, 1976–1982; Christian, Davis, Tubis, Anderson, Mills & Rossing, 1984',
      scope: String.raw`A uniform, perfectly flexible head in an infinite rigid baffle; the kettle's interior is treated as an incompressible half-space (adding mass) plus a uniform air spring for the symmetric modes, of volume 0.14 m³. This simple model moves the ratios most of the way, to about $1.47, 1.91, 2.35, 2.78$; the full calculation of Christian et al. (1984), with the finite kettle and the head's stiffness, gives $1.52, 2.00, 2.48, 2.94$. Measured values from Fletcher and Rossing, as tabulated by Tronchin (J. Acoust. Soc. Am. 117, 2005). The decay rates include an illustrative internal damping.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Timpani#Sound_production' },
      viz(v) {
        const M = v.M, A = 0.328, SIG = 0.262, VOL = 0.14, F11 = 147;
        const MODES = [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [0, 1], [0, 2], [1, 2], [2, 2], [0, 3], [6, 1], [3, 2]].map(([m, n]) => airMode(m, n));
        const MEAS = { '0,1': 0.81, '2,1': 1.5, '0,2': 1.65, '3,1': 1.97, '1,2': 2.0, '4,1': 2.44, '2,2': 2.86, '5,1': 2.91, '0,3': 2.71 };
        const solve = (T, rhoF, kettle, list = MODES) => list.map((md) => {
          const rho = RHO_AIR * rhoF; let w = (md.j / A) * Math.sqrt(T / SIG), Lo = null;
          for (let it = 0; it < 12; it++) {
            Lo = rho > 0 ? md.load((w * A) / C_AIR) : { m: 0, r: 0 };
            const mass = SIG + rho * A * (Lo.m + md.inner.m), K = T * (md.j / A) ** 2 + (kettle && md.m === 0 ? (rho > 0 ? RHO_AIR * rhoF : 0) * C_AIR * C_AIR * ((4 * Math.PI * A * A) / (md.j * md.j * VOL)) : 0);
            w = Math.sqrt(K / mass);
          }
          const mass = SIG + rho * A * (Lo.m + md.inner.m), f = w / TAU;
          return { m: md.m, n: md.n, j: md.j, f, drad: (rho * w * A * Lo.r) / (2 * mass), dint: 0.6 + 0.0025 * f };
        });
        // tension that puts (1,1) at F11 in real air with the kettle
        let T = 3000; for (let i = 0; i < 25; i++) { const r = solve(T, 1, true, [MODES[0]]); T *= (F11 / r[0].f) ** 2; }
        const rhoS = v.slider('air density', 0, 2.5, 1, { step: 0.01, fmt: (x) => (x === 0 ? 'vacuum' : `${v.fix(x, 2)} × 1.2 kg/m³`) });
        const ket = v.toggle('kettle', true);
        const hd = v.stage({ x: [-1.25, 1.25], y: [-1.3, 0.75], equal: true, height: 250, axes: false, weight: 0.8, minWidth: 260, title: 'the drum from the side (head motion slowed)' });
        const sp = v.stage({ x: [0.35, 3.5], y: [-0.1, 1.3], height: 250, axes: 'box', xticks: [0.5, 1, 1.5, 2, 2.5, 3, 3.5], yticks: [], weight: 1.4, minWidth: 320, title: 'modes at f / f₁₁; height: excitation by the mallet' });
        const cv = v.stage({ x: [0, 2.5], y: [1.2, 3.15], height: 230, axes: 'box', xlabel: 'air density (× real air)', xticks: [0, 0.5, 1, 1.5, 2, 2.5], yticks: [1.34, 1.5, 2, 2.5, 3], full: true, title: 'frequency ratios f(m,1) / f(1,1) as the air gets denser' });
        const mallet = hd.handle(0.72, 0.42, { color: 'gold', r: 8, label: 'mallet', labelPos: 'e', constrain: (x) => [M.clamp(x, -0.97, 0.97), 0.42] });
        // the ratio curves (computed once)
        const RHOS = M.range(26).map((i) => i * 0.1), CURVES = [1, 2, 3, 4].map(() => []);
        for (const rf of RHOS) { const r = solve(T, rf, true, MODES.slice(0, 5)); for (let q = 1; q <= 4; q++) CURVES[q - 1].push([rf, r[q].f / r[0].f]); }
        let key = '', S = null;
        const state = () => { const k = [rhoS.value, ket.value].join(); if (k !== key) { key = k; S = solve(T, rhoS.value, ket.value); } return S; };
        const amps = (r0) => MODES.map((md) => { const nrm = Math.sqrt((md.jp * md.jp) / 2 * (md.m === 0 ? 2 : 1)); return besselJ(md.m, md.j * Math.min(1, Math.abs(r0))) / nrm; });
        const sound = (sol, r0, dur = 3) => { const a = amps(r0), mx = Math.max(...a.map(Math.abs)) || 1; return synth(sol.map((e, i) => ({ f: e.f, a: Math.abs(a[i]) / mx, d: e.drad + e.dint })), dur); };
        v.soundButton('Strike', (snd) => snd.samples(finish(sound(state(), mallet.x), 0.8), SR, { gain: 0.6 }));
        v.soundButton('vacuum, then air', (snd) => snd.samples(join([finish(sound(solve(T, 0, false), mallet.x, 2.4), 0.8), finish(sound(solve(T, 1, true), mallet.x, 2.6), 0.8)], 0.35), SR, { gain: 0.6 }));
        v.soundButton('struck at the centre', (snd) => snd.samples(finish(sound(state(), 0.02), 0.8), SR, { gain: 0.6 }));
        v.animate((t) => {
          const sol = state(), f11 = sol[0].f, a = amps(mallet.x), mx = Math.max(...a.map(Math.abs)) || 1, sr = signedRamp(v);
          // ---- side view: kettle, air, and the head ringing in slow motion (sum of the modes along a diameter)
          const bowl = M.range(41).map((i) => { const u = Math.PI * (i / 40); return [Math.cos(u), -0.98 * Math.sin(u) - 0.05]; });
          if (ket.value) { hd.poly([[1, 0], ...bowl, [-1, 0]], { fill: 'accent', fillAlpha: rhoS.value > 0 ? 0.06 + 0.05 * Math.min(1, rhoS.value) : 0, color: 'muted', width: 2.4 }); hd.text('kettle air', 0, -0.55, { align: 'center', color: 'muted', size: 11 }); }
          const tt = 0.002 * (t % 6), disp = (x) => { const r = Math.abs(x), th = x < 0 ? Math.PI : 0; let y = 0; sol.forEach((e, i) => { y += (a[i] / mx) * besselJ(e.m, e.j * Math.min(1, r)) * Math.cos(e.m * th) * Math.cos(TAU * e.f * tt) * Math.exp(-(e.drad + e.dint) * tt * 120); }); return y; };
          const pts = M.range(81).map((i) => { const x = -1 + i / 40; return [x, 0.18 * disp(x)]; });
          hd.path(pts, { color: 'ink', width: 3 });
          hd.line(mallet.x, 0.42, mallet.x + 0.25, 0.72, { color: 'gold', width: 3 });
          hd.text('struck ' + v.fix(1 - Math.abs(mallet.x), 2) + ' a from the rim', -1.2, 0.62, { align: 'left', color: 'muted', size: 11 });
          // ---- spectrum of ratios
          for (const q of [1.5, 2, 2.5, 3]) sp.vline(q, { color: 'green', width: 1.3, dash: [5, 4], alpha: 0.7 });
          sol.forEach((e, i) => {
            const x = e.f / f11, ideal = e.j / MODES[0].j, hgt = Math.max(0.03, Math.abs(a[i]) / mx), col = e.n === 1 && e.m > 0 ? 'accent' : e.m === 0 ? 'red' : 'purple';
            if (x > 3.5) return;
            sp.line(ideal, -0.1, ideal, -0.02, { color: 'muted', width: 2 });
            sp.line(x, 0, x, hgt, { color: col, width: 3 });
            sp.text(`${e.m},${e.n}`, x, hgt + 0.07, { align: 'center', color: col, size: 9.5, weight: 600 });
            const ms = MEAS[`${e.m},${e.n}`]; if (ms) sp.poly([[ms, 1.23], [ms - 0.03, 1.29], [ms + 0.03, 1.29]], { fill: col, fillAlpha: 0.9, stroke: false });
          });
          sp.corner('▼ measured (Rossing)   ▮ vacuum (bottom ticks)', 'tr', { color: 'muted', size: 10.5 });
          // ---- ratio curves against air density
          for (const q of [1.5, 2, 2.5, 3]) cv.hline(q, { color: 'green', width: 1.2, dash: [5, 4], alpha: 0.6 });
          CURVES.forEach((c, i) => { cv.path(c, { color: 'accent', width: 2 }); cv.text(`(${i + 2},1)`, 2.47, c[c.length - 1][1] + 0.07, { align: 'right', color: 'accent', size: 10.5 }); });
          [1.5, 1.97, 2.44, 2.91].forEach((ms) => cv.poly([[1, ms], [0.97, ms + 0.06], [1.03, ms + 0.06]], { fill: 'ink', fillAlpha: 0.85, stroke: false }));
          cv.vline(rhoS.value, { color: 'gold', width: 1.6, dash: [4, 3] });
          sol.slice(1, 5).forEach((e) => cv.dot(rhoS.value, e.f / f11, { r: 5, color: 'gold' }));
        }, { still: 1.0 });
        v.legend([['accent', 'modes (m, 1): the singing modes'], ['red', 'symmetric modes (0, n)'], ['purple', 'other modes'], ['green', 'harmonic targets 3/2, 2, 5/2, 3', { dash: true }]]);
        v.readout(() => {
          const sol = state(), f11 = sol[0].f, r = (q) => sol[q].f / f11, vac = [2, 3, 4, 5].map((m) => besselZero(m, 1) / MODES[0].j);
          const cents = [1.5, 2, 2.5, 3].map((h, i) => 1200 * Math.log2(r(i + 1) / h)), tau = (e) => 1 / (e.drad + e.dint);
          return `(1,1) at ${v.fix(f11, 1)} Hz (${noteOf(M, f11)}), tension ${v.fix(T, 0)} N/m · ratios (2,1) … (5,1): ${[1, 2, 3, 4].map((q) => v.fix(r(q), 3)).join(', ')} (vacuum ${vac.map((x) => v.fix(x, 2)).join(', ')}; measured 1.50, 1.97, 2.44, 2.91) · distance from 3/2, 2, 5/2, 3: ${cents.map((c) => centsTxt(c, 0)).join(', ')} · amplitude decay times: (0,1) ${v.fix(tau(sol[5]), 2)} s, (1,1) ${v.fix(tau(sol[0]), 2)} s, (2,1) ${v.fix(tau(sol[1]), 2)} s`;
        });
      },
    },
  ],
};
