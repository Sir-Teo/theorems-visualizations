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


// ---------------------------------------------------------------- free square plate by Rayleigh–Ritz (3.10)
const BEAM_ROOTS = [4.730040745, 7.853204624, 10.99560784, 14.13716549, 17.27875966, 20.42035225, 23.5619449, 26.70353756];
/** Free–free beam functions on [0, 1], orthonormal: 1, √3(2x − 1), then the elastic modes (written stably, no cosh − sinh cancellation). */
function beamFn(i) {
  if (i === 0) return { f: () => 1, d1: () => 0, d2: () => 0 };
  if (i === 1) { const q = Math.sqrt(3); return { f: (x) => q * (2 * x - 1), d1: () => 2 * q, d2: () => 0 }; }
  const b = BEAM_ROOTS[i - 2], oms = (-Math.exp(-b) - Math.sin(b) + Math.cos(b)) / (Math.sinh(b) - Math.sin(b)), ops = 2 - oms, sg = 1 - oms; // 1 − σ, 1 + σ, σ
  const hyp = (x) => 0.5 * (oms * Math.exp(b * x) + ops * Math.exp(-b * x)), hyd = (x) => 0.5 * (oms * Math.exp(b * x) - ops * Math.exp(-b * x));
  return { f: (x) => hyp(x) + Math.cos(b * x) - sg * Math.sin(b * x), d1: (x) => b * (hyd(x) - Math.sin(b * x) - sg * Math.cos(b * x)), d2: (x) => b * b * (hyp(x) - Math.cos(b * x) + sg * Math.sin(b * x)) };
}
/**
 * Modes of a free square plate (side 1, Poisson ratio nu) by Rayleigh–Ritz in the basis φ_i(x)φ_j(y), i, j < N, of beam functions.
 * Bending energy ∫∫ w_xx² + w_yy² + 2ν w_xx w_yy + 2(1 − ν) w_xy²; the mass matrix is the identity. Returns modes sorted by
 * frequency parameter Ω = ωa²√(ρh/D), rigid-body modes removed: [{Om, c (N×N coefficients)}].
 */
function plateModes(M, N, nu) {
  const fns = M.range(N).map(beamFn), G = 600, xs = M.range(G + 1).map((k) => k / G), wq = xs.map((_, k) => (k === 0 || k === G ? 1 : k % 2 ? 4 : 2) / (3 * G));
  const V0 = fns.map((F) => xs.map(F.f)), V1 = fns.map((F) => xs.map(F.d1)), V2 = fns.map((F) => xs.map(F.d2));
  const I = (a, b) => a.reduce((s, ai, k) => s + ai * b[k] * wq[k], 0), mat = (P, Q) => fns.map((_, i) => fns.map((_, k) => I(P[i], Q[k])));
  const Mo = mat(V0, V0), A = mat(V2, V2), B = mat(V0, V2), C = mat(V1, V1), n = N * N, K = M.zeros(n, n);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) for (let l = 0; l < N; l++)
    K[i * N + j][k * N + l] = A[i][k] * Mo[j][l] + Mo[i][k] * A[j][l] + nu * (B[k][i] * B[j][l] + B[i][k] * B[l][j]) + 2 * (1 - nu) * C[i][k] * C[j][l];
  const e = M.eigSym(K);
  return e.values.map((val, q) => ({ Om: Math.sqrt(Math.max(0, val)), c: e.vectors.map((r) => r[q]) })).sort((p, q) => p.Om - q.Om).filter((md) => md.Om > 1);
}

// ---------------------------------------------------------------- free–free bar of variable thickness (3.11)
/**
 * Euler–Bernoulli bar on [0, 1] with uniform width and thickness h(x) (h = 1 for the uncut bar): (h³ w'')'' = λ h w, λ = β⁴.
 * Shooting: integrate y = [w, w', M = h³w'', V = M'] by RK4 from the free end x = 0 (M = V = 0) for the two starts w = 1 and w' = 1;
 * β is an eigenvalue when the 2×2 determinant of [M, V] at x = 1 vanishes (free end there too).
 */
function barShoot(h, lam, n = 80, keep = false) {
  const H = 1 / n, out = [];
  const F = (x, y) => { const q = h(x); return [y[1], y[2] / (q * q * q), y[3], lam * q * y[0]]; };
  for (const y0 of [[1, 0, 0, 0], [0, 1, 0, 0]]) {
    let y = y0.slice(); const path = keep ? [y[0]] : null;
    for (let i = 0; i < n; i++) {
      const x = i * H, k1 = F(x, y), k2 = F(x + H / 2, y.map((u, j) => u + (H / 2) * k1[j])), k3 = F(x + H / 2, y.map((u, j) => u + (H / 2) * k2[j])), k4 = F(x + H, y.map((u, j) => u + H * k3[j]));
      y = y.map((u, j) => u + (H / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      if (keep) path.push(y[0]);
    }
    out.push(keep ? { end: y, path } : y);
  }
  if (keep) return out;
  return out[0][2] * out[1][3] - out[0][3] * out[1][2];
}
/** The lowest k values of β (ω ∝ β²) for thickness profile h: scan β upward from 0.6, then bisect each sign change. */
function barModes(h, k = 4) {
  const D = (b) => barShoot(h, b ** 4), out = []; let a = 0.6, da = D(a);
  for (let b = a + 0.1; out.length < k && b < 30; b += 0.1) {
    const db = D(b);
    if (da * db < 0) { let lo = b - 0.1, hi = b, dl = da; for (let i = 0; i < 34; i++) { const m = 0.5 * (lo + hi), dm = D(m); if (dl * dm <= 0) hi = m; else { lo = m; dl = dm; } } out.push(0.5 * (lo + hi)); }
    da = db;
  }
  return out;
}
/** Mode shape at β, sampled on n + 1 points and scaled to max |w| = 1. */
function barShape(h, beta, n = 120) {
  const [A, B] = barShoot(h, beta ** 4, n, true), cA = B.end[2], cB = -A.end[2]; // the combination with M(1) = 0
  const w = A.path.map((u, i) => cA * u + cB * B.path[i]); const mx = Math.max(...w.map(Math.abs)) || 1;
  return w.map((u) => u / mx);
}
/** Arch-shaped undercut: thickness 1 − d(1 − |s|³) over |s| < 1, s = (x − ½)/(w/2). */
const archProfile = (d, w) => (x) => { const s = Math.abs(x - 0.5) / (w / 2); return s < 1 ? 1 - d * (1 - s * s * s) : 1; };

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
        const sp = v.stage({ x: [0.2, 3.5], y: [-0.04, 1.42], height: 250, axes: 'box', xticks: [0.5, 1, 1.5, 2, 2.5, 3, 3.5], yticks: [], weight: 1.4, minWidth: 320, title: 'modes at f / f₁₁; height: how strongly the mallet excites each' });
        const cv = v.stage({ x: [0, 2.5], y: [1.2, 3.25], height: 230, axes: 'box', xlabel: 'air density (× real air)', xticks: [0, 0.5, 1, 1.5, 2, 2.5], yticks: [1.34, 1.5, 2, 2.5, 3], full: true, title: 'frequency ratios f(m,1) / f(1,1) as the air gets denser' });
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
            sp.line(ideal, 1.16, ideal, 1.24, { color: 'muted', width: 2.2 });
            sp.line(x, 0, x, hgt, { color: col, width: 3 });
            sp.text(`${e.m},${e.n}`, x, hgt + 0.07, { align: 'center', color: col, size: 9.5, weight: 600 });
            const ms = MEAS[`${e.m},${e.n}`]; if (ms) sp.poly([[ms, 1.29], [ms - 0.03, 1.37], [ms + 0.03, 1.37]], { fill: col, fillAlpha: 0.9, stroke: false });
          });
          sp.text('measured', 0.23, 1.33, { align: 'left', color: 'muted', size: 10 }); sp.text('vacuum', 0.23, 1.2, { align: 'left', color: 'muted', size: 10 });
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
          return `(1,1) at ${v.fix(f11, 1)} Hz (${noteOf(M, f11)}), tension ${v.fix(T, 0)} N/m · ratios (2,1) … (5,1): ${[1, 2, 3, 4].map((q) => v.fix(r(q), 3)).join(', ')} (vacuum ${vac.map((x) => v.fix(x, 2)).join(', ')}; measured 1.50, 1.97, 2.44, 2.91) · distance from 3/2, 2, 5/2, 3: ${cents.map((c) => centsTxt(c, 0)).join(', ')} · amplitude decay times in the model (radiation from the baffled head plus illustrative internal losses): (0,1) ${v.fix(tau(sol[5]), 2)} s, (1,1) ${v.fix(tau(sol[0]), 2)} s, (2,1) ${v.fix(tau(sol[1]), 2)} s`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Phenomenon',
      name: 'Chladni figures',
      statement: String.raw`Sand sprinkled on a horizontal plate driven at one of its resonant frequencies is thrown off the vibrating regions and collects along the **nodal lines**, the curves where the plate stays still, drawing a figure characteristic of the mode. The modes of a thin plate solve the biharmonic eigenvalue problem
$$D\,\Delta^2w=\rho h\,\omega^2w\qquad\Big(D=\frac{Eh^3}{12(1-\nu^2)}\Big)$$
with the boundary conditions of its edges (for free edges: no bending moment and no shear force), so $\omega\propto h\sqrt{E/\rho}/a^2$ and the frequencies are far from harmonic. On a free square plate most figures are not grids: symmetry pairs modes of nearly or exactly equal frequency, and the observed figures are their combinations, such as the diagonal cross and the ring-like curves. Between resonances the plate barely moves and the sand stays where it is; a mode with a node at the driving point cannot be excited at all.`,
      idea: String.raw`A grain bounces whenever the plate's acceleration exceeds gravity, and each bounce scatters it a little; only where the vibration amplitude is below that threshold can it rest, so sand random-walks until it reaches a nodal line and stays. The plate equation has the Laplacian squared because bending stiffness resists curvature; a membrane (3.6) resists slope. Driven at frequency $f$ at a point $p$, the plate's response is the sum of its modes, each weighted by $w_k(p)/(f_k^2-f^2+i f f_k/Q)$: near a resonance one mode, or a degenerate pair (mixed in proportions set by $p$), dominates and its nodal lines appear. Chladni held his plates at the centre and bowed the edge, which picks out modes with an antinode at the bow and a node at the clamp.`,
      caption: String.raw`A 24 cm aluminium plate, 1.5 mm thick, with free edges, driven by a shaker at the gold point. Its modes are computed by the Rayleigh–Ritz method (64 products of free-beam functions). Slide the **frequency**, or switch on **sweep**, and watch the sand: it sits still between resonances and runs to the nodal lines (dashed) at each peak of the response curve below. The arrow buttons jump to the next resonance. Drag the **drive point**: from the centre, only a few modes (gold ticks) can be excited; from a corner, many more. *Hold the note* plays the driving tone, louder at resonances.`,
      deps: ['music-3.6'],
      see: ['pde-7.4', 'pde-7.5', 'music-3.12'],
      refs: ['Benson ch. 3', 'Loy I ch. 8'],
      tags: ['plates', 'modes'],
      credit: 'Ernst Chladni, 1787; Sophie Germain, 1816 (plate equation); Kirchhoff, 1850; Ritz, 1909',
      scope: String.raw`Kirchhoff–Love thin-plate theory (thickness much less than the side and the bending wavelength, small amplitudes) with free edges, a point drive and a uniform loss factor ($Q=40$). The Ritz frequencies are upper bounds, within about 1% of the converged values for these modes; higher modes need a larger basis. The sand is a random walk with step size proportional to the local amplitude, not a simulation of bouncing grains.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ernst_Chladni#Chladni_figures' },
      viz(v) {
        const M = v.M, NB = 8, NU = 0.33, NG = 61, Q = 40, NS = 2400, FMIN = 60, FMAX = 1500;
        const E = 69e9, RHO = 2700, H = 1.5e-3, SIDE = 0.24, D = (E * H ** 3) / (12 * (1 - NU * NU)), FS = Math.sqrt(D / (RHO * H)) / (TAU * SIDE * SIDE);
        const all = plateModes(M, NB, NU), modes = all.filter((md) => md.Om * FS < FMAX * 1.15), K = modes.length;
        const coarse = plateModes(M, 6, NU).slice(0, 8);
        const fns = M.range(NB).map(beamFn), gx = M.range(NG).map((g) => g / (NG - 1)), PT = fns.map((F) => gx.map(F.f));
        const grids = modes.map((md) => { // mode shape on the NG × NG grid
          const tmp = M.range(NB).map((i) => gx.map((_, g) => { let s2 = 0; for (let j = 0; j < NB; j++) s2 += md.c[i * NB + j] * PT[j][g]; return s2; }));
          const W = new Float64Array(NG * NG); for (let a = 0; a < NG; a++) for (let b = 0; b < NG; b++) { let s2 = 0; for (let i = 0; i < NB; i++) s2 += PT[i][a] * tmp[i][b]; W[a * NG + b] = s2; }
          return W;
        });
        const at = (md, x, y) => { let s2 = 0; for (let i = 0; i < NB; i++) { const fx = fns[i].f(x); for (let j = 0; j < NB; j++) s2 += md.c[i * NB + j] * fx * fns[j].f(y); } return s2; };
        const lerp2 = (G, x, y) => { const u = M.clamp(x, 0, 1) * (NG - 1), w = M.clamp(y, 0, 1) * (NG - 1), i = Math.min(NG - 2, Math.floor(u)), j = Math.min(NG - 2, Math.floor(w)), fu = u - i, fw = w - j; return (G[i * NG + j] * (1 - fu) + G[(i + 1) * NG + j] * fu) * (1 - fw) + (G[i * NG + j + 1] * (1 - fu) + G[(i + 1) * NG + j + 1] * fu) * fw; };
        let voice = null;
        const fS = v.slider('frequency', FMIN, FMAX, modes[7].Om * FS, { log: true, fmt: (x) => v.fix(x, 0) + ' Hz', onChange: () => sync() });
        const sweep = v.toggle('sweep', false);
        const showA = v.toggle('show the amplitude', false);
        const hold = v.toggle('hold the note', false, { onChange: (on) => { if (on) { voice = v.sound().tone(fS.value, { sustain: true, gain: 0.22, attack: 0.05 }); sync(); } else if (voice) { voice.stop(); voice = null; } } });
        const jump = (dir) => { const f = fS.value, list = modes.map((md) => md.Om * FS).filter((x) => x >= FMIN && x <= FMAX); const nx = dir > 0 ? list.find((x) => x > f * 1.003) : list.slice().reverse().find((x) => x < f / 1.003); if (nx) { fS.set(nx); sync(); } };
        v.button('◀ resonance', () => jump(-1));
        v.button('resonance ▶', () => jump(1));
        v.button('scatter the sand', () => { const r = v.rng(Math.floor(performance.now())); for (let k = 0; k < NS; k++) { SX[k] = r(); SY[k] = r(); } });
        const pl = v.stage({ x: [-0.04, 1.04], y: [-0.04, 1.04], equal: true, height: 330, axes: false, weight: 1, minWidth: 300 });
        const rc = v.stage({ x: [FMIN, FMAX], y: [-46, 6], xlog: true, height: 330, axes: 'box', xlabel: 'driving frequency (Hz)', yticks: [[0, '0 dB'], [-20, '−20'], [-40, '−40']], weight: 1.1, minWidth: 300, title: 'response of the plate (rms amplitude)' });
        const drv = pl.handle(0.5, 0.5, { color: 'gold', r: 8, label: 'drive', labelPos: 'ne', constrain: (x, y) => [M.clamp(x, 0, 1), M.clamp(y, 0, 1)] });
        // driven response: complex modal amplitudes and the field on the grid
        const ampl = (f, p) => modes.map((md, k) => { const Om = f / FS, w2 = md.Om * md.Om - Om * Om, g = (Om * md.Om) / Q, d = w2 * w2 + g * g, ph = p[k]; return [(ph * w2) / d, (-ph * g) / d]; });
        let dKey = '', PHI = null, curve = null, ref = 1;
        const driveData = () => {
          const k = drv.x.toFixed(3) + ',' + drv.y.toFixed(3); if (k === dKey) return; dKey = k;
          PHI = modes.map((md) => at(md, drv.x, drv.y));
          curve = []; let mx = 1e-30;
          for (let i = 0; i <= 500; i++) { const f = FMIN * (FMAX / FMIN) ** (i / 500), A = ampl(f, PHI); const rms = Math.sqrt(A.reduce((s2, [a, b]) => s2 + a * a + b * b, 0)); curve.push([f, rms]); mx = Math.max(mx, rms); }
          ref = mx; curve = curve.map(([f, r2]) => [f, 20 * Math.log10(r2 / mx)]);
        };
        let fKey = '', WR = null, WI = null, AG = null, rmsNow = 0;
        const field = () => {
          driveData(); const k = dKey + '|' + fS.value; if (k === fKey) return; fKey = k;
          const A = ampl(fS.value, PHI); WR = new Float64Array(NG * NG); WI = new Float64Array(NG * NG); AG = new Float64Array(NG * NG);
          A.forEach(([a, b], q) => { const G = grids[q]; for (let i = 0; i < NG * NG; i++) { WR[i] += a * G[i]; WI[i] += b * G[i]; } });
          for (let i = 0; i < NG * NG; i++) AG[i] = Math.hypot(WR[i], WI[i]) / ref;
          rmsNow = Math.sqrt(A.reduce((s2, [a, b]) => s2 + a * a + b * b, 0)) / ref;
        };
        function sync() { if (voice && voice.playing) { voice.setFreq(fS.value); field(); voice.setGain(Math.min(1, 0.08 + 1.4 * rmsNow)); } }
        // sand: a random walk whose step is proportional to the local amplitude (grains only rest where the plate hardly moves)
        const SX = new Float64Array(NS), SY = new Float64Array(NS), rr = v.rng(7);
        for (let k = 0; k < NS; k++) { SX[k] = rr(); SY[k] = rr(); }
        const stepSand = (n) => { for (let it = 0; it < n; it++) for (let k = 0; k < NS; k++) { const s2 = 0.05 * Math.min(1.2, 1.6 * lerp2(AG, SX[k], SY[k])); if (s2 < 1e-4) continue; let x = SX[k] + s2 * rr.normal(), y = SY[k] + s2 * rr.normal(); if (x < 0) x = -x; if (x > 1) x = 2 - x; if (y < 0) y = -y; if (y > 1) y = 2 - y; SX[k] = M.clamp(x, 0, 1); SY[k] = M.clamp(y, 0, 1); } };
        field(); stepSand(160);
        let lastT = 0;
        v.animate((t) => {
          if (sweep.value) { let f = fS.value * Math.exp(0.07 * Math.max(0, Math.min(0.1, t - lastT))); if (f > FMAX) f = FMIN; fS.set(f); sync(); }
          lastT = t;
          field(); stepSand(2);
          // ---- plate, amplitude, nodal lines, sand
          pl.rect(0, 0, 1, 1, { fill: 'muted', fillAlpha: 0.16, stroke: false });
          if (showA.value) pl.heat((x, y) => (x >= 0 && x <= 1 && y >= 0 && y <= 1 ? lerp2(AG, x, y) : NaN), { range: [0, Math.max(1e-6, Math.max(...AG))], cmap: 'theme', color: 'accent', res: 3, alpha: 0.7, key: fKey });
          let sxx = 0, sxy = 0; for (let i = 0; i < NG * NG; i++) { sxx += WR[i] * WR[i] - WI[i] * WI[i]; sxy += 2 * WR[i] * WI[i]; }
          const psi = 0.5 * Math.atan2(sxy, sxx), cp = Math.cos(psi), sp2 = Math.sin(psi);
          const RE = new Float64Array(NG * NG); for (let i = 0; i < NG * NG; i++) RE[i] = WR[i] * cp + WI[i] * sp2;
          if (rmsNow > 0.02) pl.clip(() => pl.contour((x, y) => lerp2(RE, x, y), 0, { color: 'accent', width: 1.3, dash: [4, 3], res: 90 }), [0, 1], [0, 1]);
          const pts = []; for (let k = 0; k < NS; k++) pts.push([SX[k], SY[k]]);
          pl.dots(pts, { r: 1.25, color: 'ink', alpha: 0.85 });
          pl.rect(0, 0, 1, 1, { color: 'ink', width: 2 });
          // ---- response curve and mode ticks
          rc.path(curve.map(([f, d]) => [f, Math.max(-46, d)]), { color: 'accent', width: 2 });
          const pm = Math.max(...PHI.map(Math.abs));
          modes.forEach((md, k) => { const f = md.Om * FS; if (f < FMIN || f > FMAX) return; const on = Math.abs(PHI[k]) > 0.2 * pm; rc.line(f, -46, f, -41, { color: on ? 'gold' : 'faint', width: on ? 2.6 : 1.6 }); });
          const fl = 20 * Math.log10(Math.max(1e-9, rmsNow));
          rc.vline(fS.value, { color: 'ink', width: 1.2, dash: [4, 3] });
          rc.dot(fS.value, Math.max(-45, fl), { r: 6, color: 'gold' });
        }, { still: 0.1 });
        v.legend([['ink', 'sand', { dot: true }], ['accent', 'nodal lines (computed); response curve', { dash: true }], ['gold', 'modes excitable from the drive point']]);
        v.readout(() => {
          field(); const f = fS.value; let kk = 0; modes.forEach((md, k) => { if (Math.abs(Math.log(md.Om * FS / f)) < Math.abs(Math.log(modes[kk].Om * FS / f))) kk = k; });
          const md = modes[kk], fk = md.Om * FS, pm = Math.max(...PHI.map(Math.abs)), ex = Math.abs(PHI[kk]) / pm, conv = Math.max(...coarse.map((c, i) => c.Om / all[i].Om - 1));
          const level = 20 * Math.log10(Math.max(1e-9, rmsNow));
          return `driving at ${v.fix(f, 1)} Hz, response ${v.fix(level, 1)} dB re the strongest resonance · nearest mode: no. ${kk + 1} at ${v.fix(fk, 1)} Hz ($\\Omega=\\omega a^2\\sqrt{\\rho h/D}$ = ${v.fix(md.Om, 2)}), ${Math.abs(1200 * Math.log2(f / fk)) < 8 ? 'on resonance' : `${centsTxt(1200 * Math.log2(f / fk), 0)} away`}; its shape at the drive point is ${v.fix(100 * ex, 0)}% of the largest${ex < 0.05 ? ': it has a node there and cannot be excited' : ''} · first modes $\\Omega$ = ${modes.slice(0, 5).map((q) => v.fix(q.Om, 2)).join(', ')} (Ritz upper bounds; the 6×6 basis gives values at most ${v.fix(100 * conv, 2)}% higher) · plate: 24 cm, 1.5 mm aluminium, $f=\\Omega\\cdot$${v.fix(FS, 3)} Hz`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Model',
      name: 'Bars: xylophone and marimba tuning',
      statement: String.raw`A uniform bar of length $L$ and thickness $t$, free at both ends, vibrates in bending (Euler–Bernoulli, $EI\,w^{(4)}=\rho A\,\omega^2w$) at
$$f_n=\frac{(\beta_nL)^2}{2\pi L^2}\,t\sqrt{\frac{E}{12\rho}},\qquad \beta_nL=4.730,\ 7.853,\ 10.996,\ 14.137,\ \dots$$
the roots of $\cos\beta L\cosh\beta L=1$, so its partials stand in the ratios $1 : 2.756 : 5.404 : 8.933$: far from harmonic, which is why an uncut bar sounds clangy. Makers of marimbas, vibraphones and xylophones carve an **arch** under the middle of each bar. Thinning the middle lowers the fundamental, whose bending is concentrated there, much more than the upper modes, so the depth and the length of the arch can be chosen to put the overtones where the maker wants them: in a marimba or vibraphone the first two overtones at **4** and **10** times the fundamental (two octaves, and three octaves and a major third), in a xylophone the first overtone at **3** times (a twelfth).`,
      idea: String.raw`For a bar of variable thickness $t(x)$ the bending stiffness goes as $t^3$ and the mass as $t$: $(Et^3w'')''=12\rho t\,\omega^2 w$. By the Rayleigh quotient, $\omega^2$ is the ratio of the bending energy $\int Et^3w''^2$ to the kinetic energy $\int12\rho t\,w^2$, so removing material where a mode bends most lowers that mode's frequency. The fundamental bends most in the middle; the second mode bends most about a quarter of the way in, the third in three places. An arch cut in the middle therefore lowers $f_1$ a lot, $f_2$ less and $f_3$ less still: the ratios $f_2/f_1$ and $f_3/f_1$ rise, and with two shape parameters (depth and length of the arch) both can be set at once. The ear then hears a nearly harmonic tone with a strong fundamental, the stiff-string inharmonicity of 2.11 tamed by design.`,
      caption: String.raw`The bar is drawn side-on with its thickness exaggerated. Drag the two orange handles to set the **depth** and the **length** of the arch; the modes are recomputed by integrating the bar equation (shooting method) as you drag. Lower left: the first three mode shapes, with their nodes (the cords that hold a marimba bar run through the nodes of the fundamental). Lower right: the partials of a bar tuned to A3 on a keyboard, against the marimba targets $4f_1$, $10f_1$ (green) and the xylophone's $3f_1$ (teal); grey marks show the uncut bar. *Tune the arch* finds the cut for the chosen target by Newton's method. Drag the gold mallet and *strike*: at the centre the second mode, which has a node there, falls silent.`,
      deps: ['music-2.11'],
      see: ['music-6.7', 'pde-7.6', 'mech-11.9'],
      refs: ['Benson ch. 3', 'Sethares ch. 6'],
      tags: ['bars', 'percussion'],
      credit: 'Euler & Daniel Bernoulli, 1735–1744 (the free bar); arch-cut tuning of marimba bars: 20th century (Deagan)',
      scope: String.raw`One-dimensional Euler–Bernoulli bending of a slender bar of uniform width, with an arch of the form $1-d(1-|s|^3)$; torsional and lateral modes, rotary inertia and shear (which lower the upper partials of thick bars), the resonator tubes and the cords are left out. Measured marimba bars are usually tuned to $1:4$ exactly, with the third partial between about 9.2 and 10.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Marimba#Bars' },
      viz(v) {
        const M = v.M, TH = 0.2, F1 = 220, U = barModes(() => 1, 4);
        let d = 0.45, w = 0.6, key = '', S = null;
        const target = v.select('target', [{ value: 'marimba', label: 'marimba 1 : 4 : 10' }, { value: 'xylo', label: 'xylophone 1 : 3' }], 'marimba');
        const bar = v.stage({ x: [-0.04, 1.04], y: [-0.34, 0.21], height: 190, axes: false, full: true });
        const ms = v.stage({ x: [-0.02, 1.02], y: [0.45, 3.65], height: 250, axes: false, weight: 1, minWidth: 280, title: 'mode shapes and their nodes' });
        const ks = v.stage({ x: [150, 3600], y: [-0.4, 1.32], xlog: true, height: 250, axes: 'box', yticks: [], xlabel: 'frequency (Hz)', weight: 1.25, minWidth: 300, title: 'partials of the bar, fundamental tuned to A3' });
        const hD = bar.handle(0.5, -TH * (1 - d), { color: 'orange', r: 8, constrain: (x, y) => [0.5, M.clamp(y, -TH, -TH * 0.12)], onDrag: (h) => { d = 1 + h.y / TH; } });
        const hW = bar.handle(0.5 + w / 2, -TH, { color: 'orange', r: 8, constrain: (x) => [M.clamp(x, 0.6, 0.99), -TH], onDrag: (h) => { w = 2 * (h.x - 0.5); } });
        const hS = bar.handle(0.3, 0.07, { color: 'gold', r: 8, label: 'mallet', labelPos: 'e', constrain: (x) => [M.clamp(x, 0.02, 0.98), 0.07] });
        const run = () => {
          const k = d.toFixed(4) + ',' + w.toFixed(4); if (k === key) return S; key = k;
          const h = archProfile(d, w), B = barModes(h, 4), shapes = B.slice(0, 3).map((b) => barShape(h, b));
          const nodes = shapes.map((sh) => { const z = []; for (let i = 1; i < sh.length; i++) if (sh[i - 1] * sh[i] < 0) z.push((i - 1 + sh[i - 1] / (sh[i - 1] - sh[i])) / (sh.length - 1)); return z; });
          S = { h, B, shapes, nodes, r: B.map((b) => (b * b) / (B[0] * B[0])), drop: (B[0] * B[0]) / (U[0] * U[0]) };
          return S;
        };
        const ratiosAt = (dd, ww) => { const B = barModes(archProfile(dd, ww), 3); return [(B[1] / B[0]) ** 2, (B[2] / B[0]) ** 2]; };
        v.button('Tune the arch', () => {
          let dd = d, ww = w;
          if (target.value === 'marimba') {
            if (dd < 0.3) { dd = 0.65; ww = 0.68; }
            for (let it = 0; it < 14; it++) {
              const r0 = ratiosAt(dd, ww), e = 1e-4, rd = ratiosAt(dd + e, ww), rw = ratiosAt(dd, ww + e);
              const J = [[(rd[0] - r0[0]) / e, (rw[0] - r0[0]) / e], [(rd[1] - r0[1]) / e, (rw[1] - r0[1]) / e]], F = [r0[0] - 4, r0[1] - 10], det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
              const sd = (J[1][1] * F[0] - J[0][1] * F[1]) / det, sw = (-J[1][0] * F[0] + J[0][0] * F[1]) / det, sc = Math.min(1, 0.08 / Math.max(Math.abs(sd), Math.abs(sw), 1e-12));
              dd = M.clamp(dd - sc * sd, 0.05, 0.88); ww = M.clamp(ww - sc * sw, 0.2, 0.98); if (Math.abs(F[0]) + Math.abs(F[1]) < 2e-6) break;
            }
          } else { // depth only, so that f2/f1 = 3 (secant method)
            let a = 0.05, b = Math.max(0.2, Math.min(0.6, dd)), fa = ratiosAt(a, ww)[0] - 3, fb = ratiosAt(b, ww)[0] - 3;
            for (let it = 0; it < 14 && Math.abs(fb) > 1e-6; it++) { const c = M.clamp(b - (fb * (b - a)) / (fb - fa), 0.02, 0.88); a = b; fa = fb; b = c; fb = ratiosAt(b, ww)[0] - 3; }
            dd = b;
          }
          d = dd; w = ww; hD.set(0.5, -TH * (1 - d)); hW.set(0.5 + w / 2, -TH);
        });
        v.button('uncut bar', () => { d = 0; hD.set(0.5, -TH); });
        const partsOf = (R, xs) => R.r.map((q, i) => ({ f: F1 * q, a: i < 3 ? Math.abs(R.shapes[i][Math.round(xs * 120)]) : 0.15, d: 1.2 + 0.004 * F1 * q }));
        v.soundButton('Strike', (snd) => snd.samples(finish(synth(partsOf(run(), hS.x), 2.2), 0.8), SR, { gain: 0.6 }));
        v.soundButton('uncut bar, then this bar', (snd) => {
          const u = { r: U.map((b) => (b / U[0]) ** 2), shapes: [0, 1, 2].map((i) => barShape(() => 1, U[i])) };
          snd.samples(join([finish(synth(partsOf(u, hS.x), 1.8), 0.8), finish(synth(partsOf(run(), hS.x), 2), 0.8)], 0.3), SR, { gain: 0.6 });
        });
        v.render(() => {
          const R = run(), h = R.h;
          if (!hD.dragging) hD.set(0.5, -TH * (1 - d)); if (!hW.dragging) hW.set(0.5 + w / 2, -TH);
          // ---- the bar, the wood removed, the cords
          const prof = M.range(201).map((i) => [i / 200, -TH * h(i / 200)]);
          if (d > 0.005) bar.poly([...prof.filter(([x]) => Math.abs(x - 0.5) <= w / 2), [0.5 + w / 2, -TH], [0.5 - w / 2, -TH]], { fill: 'red', fillAlpha: 0.06, stroke: false, hatch: 'red', hatchAlpha: 0.35, hatchGap: 7 });
          bar.poly([[0, 0], [1, 0], ...prof.slice().reverse()], { fill: 'orange', fillAlpha: 0.32, color: 'orange', width: 1.6 });
          R.nodes[0].forEach((x) => { bar.circle(x, -TH - 0.035, 0.012, { fill: 'ink', fillAlpha: 0.9, stroke: false }); bar.line(x, -TH - 0.05, x, -0.34, { color: 'muted', width: 1, dash: [2, 3] }); });
          bar.text('cords at the nodes of the fundamental', R.nodes[0][0] - 0.015, -0.31, { align: 'right', color: 'muted', size: 10.5 });
          bar.text(`arch: depth ${v.fix(100 * d, 0)}% of the thickness, length ${v.fix(100 * w, 0)}% of the bar`, 0.98, 0.17, { align: 'right', color: 'orange', size: 11.5, weight: 600 });
          bar.corner('thickness exaggerated', 'br', { color: 'muted', size: 10.5 });
          // ---- mode shapes
          R.shapes.forEach((sh, k) => {
            const y0 = 3 - k * 1.05, col = ['accent', 'purple', 'teal'][k];
            ms.hline(y0, { color: 'faint', width: 1 });
            ms.path(sh.map((u, i) => [i / 120, y0 + 0.36 * u]), { color: col, width: 2.4 });
            R.nodes[k].forEach((x) => ms.dot(x, y0, { r: 3.5, color: 'ink' }));
            ms.text(`mode ${k + 1}: ${k ? v.fix(R.r[k], 2) + ' f₁' : 'f₁'}`, 0.0, y0 + 0.47, { align: 'left', color: col, size: 11, weight: 600 });
          });
          ms.vline(hS.x, { color: 'gold', width: 1.3, dash: [4, 3] });
          // ---- partials on the keyboard
          const marks = new Map(); R.r.slice(0, 4).forEach((q, i) => marks.set(Math.round(M.freqToMidi(F1 * q)), ['accent', 'purple', 'teal', 'muted'][i]));
          keyboard(ks, M, 150, 3600, -0.38, -0.08, marks);
          for (const [q, col] of [[4, 'green'], [10, 'green'], [3, 'teal']]) { ks.line(F1 * q, 0, F1 * q, 1.12, { color: col, width: 1.4, dash: [5, 4] }); ks.text(String(q), F1 * q, 1.22, { align: 'center', color: col, size: 10.5, weight: 600 }); }
          U.slice(1, 4).forEach((b) => { const x = F1 * (b / U[0]) ** 2; if (x < 3600) ks.line(x, 0, x, 0.5, { color: 'muted', width: 2, alpha: 0.5 }); });
          R.r.forEach((q, i) => { const x = F1 * q; if (x > 3600) return; const hh = 0.95 - 0.17 * i; ks.line(x, 0, x, hh, { color: ['accent', 'purple', 'teal', 'muted'][i], width: 3 }); ks.text(v.fix(q, 2), x, hh + 0.07, { align: 'center', color: 'ink', size: 10.5 }); });
        });
        v.legend([['orange', 'the bar; arch handles'], ['red', 'wood removed', { area: true }], ['green', 'marimba targets 4, 10', { dash: true }], ['teal', 'xylophone target 3', { dash: true }]]);
        v.readout(() => {
          const R = run(), c2 = 1200 * Math.log2(R.r[1] / 4), c3 = 1200 * Math.log2(R.r[2] / 10), cx = 1200 * Math.log2(R.r[1] / 3);
          return `partials $f_n/f_1$ = ${R.r.map((q) => v.fix(q, 3)).join(' : ')} (uncut: ${U.map((b) => v.fix((b / U[0]) ** 2, 3)).join(' : ')} from the computed $\\beta L$ = ${U.map((b) => v.fix(b, 3)).join(', ')}) · ${target.value === 'marimba' ? `distance from 4 and 10: ${centsTxt(c2, 0)}, ${centsTxt(c3, 0)}` : `distance from 3: ${centsTxt(cx, 0)}`} · the arch lowers the fundamental to ${v.fix(R.drop, 3)} of the uncut bar's (${v.fix(-12 * Math.log2(R.drop), 1)} semitones) · nodes of the fundamental at ${R.nodes[0].map((x) => v.fix(x, 3)).join(' and ')} of the length (uncut: 0.224 and 0.776)`;
        });
      },
    },
  ],
};
