// Condensed Matter Physics — Chapter 2: helpers shared by ch02.js and ch02-b.js.
// Units: a = ħ = e = 1, hopping t = 1 unless stated. Square-lattice band
//   E(k) = −2(cos kx + cos ky) − 4 t′ cos kx cos ky   (one spin-degenerate band, 2 states per site).

export const TAU = 2 * Math.PI;

/** Square-lattice band energy, gradient and Hessian. */
export const sqE = (kx, ky, tp = 0) => -2 * (Math.cos(kx) + Math.cos(ky)) - 4 * tp * Math.cos(kx) * Math.cos(ky);
export const sqGrad = (kx, ky, tp = 0) => [2 * Math.sin(kx) + 4 * tp * Math.sin(kx) * Math.cos(ky), 2 * Math.sin(ky) + 4 * tp * Math.cos(kx) * Math.sin(ky)];
export const sqHess = (kx, ky, tp = 0) => [
  2 * Math.cos(kx) + 4 * tp * Math.cos(kx) * Math.cos(ky),
  4 * tp * Math.sin(kx) * Math.sin(ky),
  2 * Math.cos(ky) + 4 * tp * Math.cos(kx) * Math.cos(ky),
]; // [Exx, Exy, Eyy]

/** Fermi function and its negative derivative (kT in units of t). */
export const fermi = (e, mu, kT) => 1 / (1 + Math.exp(Math.max(-60, Math.min(60, (e - mu) / kT))));
export const mfp = (e, mu, kT) => { const x = Math.max(-40, Math.min(40, (e - mu) / (2 * kT))); return 1 / (4 * kT * Math.cosh(x) ** 2); };

/** Uniform N×N grid of the zone: energies, velocities and Hessians (cached by tp, N). */
const GRID = {};
export function zoneGrid(tp, N = 96) {
  const key = tp.toFixed(4) + ':' + N; if (GRID[key]) return GRID[key];
  const n = N * N, E = new Float64Array(n), vx = new Float64Array(n), vy = new Float64Array(n), xx = new Float64Array(n), xy = new Float64Array(n), yy = new Float64Array(n);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const kx = -Math.PI + (TAU * (i + 0.5)) / N, ky = -Math.PI + (TAU * (j + 0.5)) / N, p = i * N + j, g = sqGrad(kx, ky, tp), h = sqHess(kx, ky, tp);
    E[p] = sqE(kx, ky, tp); vx[p] = g[0]; vy[p] = g[1]; xx[p] = h[0]; xy[p] = h[1]; yy[p] = h[2];
  }
  const sorted = Float64Array.from(E).sort();
  return (GRID[key] = { N, n, E, vx, vy, xx, xy, yy, sorted });
}
/** Chemical potential for n electrons per site (0 < n < 2, both spins) at temperature kT. */
export function muOfFilling(tp, n, kT, N = 96) {
  const G = zoneGrid(tp, N); let lo = -4.5 - 4 * Math.abs(tp) - 12 * kT, hi = 4.5 + 4 * Math.abs(tp) + 12 * kT;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2; let s = 0; for (let p = 0; p < G.n; p++) s += fermi(G.E[p], mid, kT);
    if ((2 * s) / G.n < n) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
/** Boltzmann transport on the square-lattice band at filling n (electrons/site), constant τ = 1:
 *  σxx and the Hall coefficient R_H = −σ_yx/(σ_xx² B) (e = 1). Free electrons at low filling give R_H = −1/n. */
export function hallTransport(tp, n, kT = 0.05, N = 96) {
  const G = zoneGrid(tp, N), mu = muOfFilling(tp, n, kT, N); let sxx = 0, syx = 0;
  for (let p = 0; p < G.n; p++) {
    const W = mfp(G.E[p], mu, kT); if (W < 1e-9) continue;
    sxx += W * G.vx[p] * G.vx[p]; syx += W * G.vy[p] * (G.vy[p] * G.xx[p] - G.vx[p] * G.xy[p]);
  }
  const c = 2 / G.n; // 2 spins × (1/(2π)²) × zone area (2π)² / number of cells
  sxx *= c; syx *= c;
  return { mu, sxx, syx, RH: sxx > 1e-12 ? -syx / (sxx * sxx) : NaN };
}

/** Bose-like Bloch–Grüneisen integral J5(x) = ∫0^x t^5 /((e^t − 1)(1 − e^{−t})) dt. */
export function bgJ5(x) {
  const n = 160; let s = 0; const f = (t) => (t < 1e-6 ? t ** 3 : (t ** 5) / ((Math.exp(t) - 1) * (1 - Math.exp(-t))));
  const h = x / n; s = f(0) + f(x); for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}
/** Phonon resistivity of the Bloch–Grüneisen form, normalised to its value at T = Θ (so ρ_ph(Θ) = 1). */
export const bgRho = (T, theta) => { const x = theta / Math.max(T, 1e-6); return (Math.pow(T / theta, 5) * bgJ5(x)) / bgJ5(1); };

/** Table lookups (A&M Table 2.1, free-electron densities in 10²² cm⁻³; Li…Al valence-electron densities). */
export const NDENS = { Li: 4.70, Na: 2.65, K: 1.40, Rb: 1.15, Cs: 0.91, Cu: 8.47, Ag: 5.86, Au: 5.90, Be: 24.7, Mg: 8.61, Zn: 13.2, Cd: 9.27, Al: 18.1, In: 11.5 };

/** Tridiagonal solve (a sub, b diag, c super, d rhs). */
export function thomas(a, b, c, d) {
  const n = b.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
  cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
  x[n - 1] = dp[n - 1]; for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}

// ------------------------------------------------------------------ integer quantum Hall model (2.13, 2.14)
// Disorder-broadened Landau levels E_j = (j+½)ħω_c with Gaussian width Γ = G0·√B; only states within ±w of a level centre are extended.
// n in 10¹¹ cm⁻², B in T, energies in meV, conductivities in e²/h. Illustrative model: the shapes, not the numbers, are physical.
const erf = (x) => { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return s * (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)); };
export const QHE_D = 0.2418; // eB/h per tesla, in 10¹¹ cm⁻²
export function qheAt(n, B, p) {
  const hw = p.hw * B, G = Math.max(1e-6, p.G0 * Math.sqrt(B)), kT = 0.08617 * p.T, w = 0.05 * G + 0.3 * kT + 1e-4, NJ = 48, D = QHE_D * B;
  const cnt = (mu) => { let s = 0; for (let j = 0; j < NJ; j++) s += p.g * D * 0.5 * (1 + erf((mu - (j + 0.5) * hw) / (G * Math.SQRT2))); return s; };
  let lo = -6 * G, hi = (NJ + 1) * hw;
  for (let it = 0; it < 50; it++) { const m = (lo + hi) / 2; if (cnt(m) < n) lo = m; else hi = m; }
  const mu = (lo + hi) / 2; let sxy = 0, sxx = 0;
  for (let j = 0; j < NJ; j++) { const x = (mu - (j + 0.5) * hw) / w; if (x > 40) { sxy += p.g; continue; } if (x < -40) continue; sxy += (p.g * 0.5) * (1 + Math.tanh(x)); const c = Math.cosh(x); sxx += p.g * p.sp / (c * c); }
  const d = sxx * sxx + sxy * sxy;
  return { mu, G, w, sxy, sxx, rxy: sxy / d, rxx: sxx / d, nu: n / D };
}
