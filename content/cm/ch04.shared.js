// Condensed Matter Physics — Chapter 4: helpers shared by ch04.js and ch04-b.js.
// Re-exports the chapter-3 helpers and adds a small semiconductor model: Varshni gaps, effective densities of states,
// the exact Fermi–Dirac integral, and charge neutrality with partially ionized donors (all in cm⁻³, eV, K).
export * from './ch03.shared.js';

export const KB = 8.617333262e-5; // eV/K
export const Q = 1.602176634e-19; // C
export const EPS0 = 8.8541878128e-14; // F/cm
/** Material parameters (textbook-level; density-of-states masses in units of m0, Varshni parameters Eg(T) = Eg0 − αT²/(T+β)).
 *  Values quoted from memory of standard tables (Sze; Ioffe archive) — good to a few percent; the module shows 300 K checks. */
export const MAT = {
  Si: { name: 'Si', Eg0: 1.17, alpha: 4.73e-4, beta: 636, me: 1.08, mh: 0.81, eps: 11.7, a: 5.431, ni300: 1.0e10, indirect: true, Ed: 0.045, mcond: 0.26 },
  Ge: { name: 'Ge', Eg0: 0.7437, alpha: 4.774e-4, beta: 235, me: 0.55, mh: 0.37, eps: 16.0, a: 5.658, ni300: 2.0e13, indirect: true, Ed: 0.0127, mcond: 0.12 },
  GaAs: { name: 'GaAs', Eg0: 1.519, alpha: 5.405e-4, beta: 204, me: 0.067, mh: 0.53, eps: 12.9, a: 5.653, ni300: 2.1e6, indirect: false, Ed: 0.0058, mcond: 0.067 },
};
export const eg = (m, T) => m.Eg0 - (m.alpha * T * T) / (T + m.beta);
export const Nc = (m, T) => 2.5094e19 * m.me ** 1.5 * (T / 300) ** 1.5;
export const Nv = (m, T) => 2.5094e19 * m.mh ** 1.5 * (T / 300) ** 1.5;
/** Boltzmann (non-degenerate) intrinsic density sqrt(Nc Nv) exp(−Eg/2kT). */
export const niB = (m, T) => Math.sqrt(Nc(m, T) * Nv(m, T)) * Math.exp(-eg(m, T) / (2 * KB * T));

// Normalised Fermi–Dirac integral F(η) = (2/√π) ∫0^∞ √x /(1+e^{x−η}) dx  (→ e^η for η → −∞), tabulated on ln F.
let FT = null;
const F_LO = -40, F_HI = 40, F_H = 0.05;
function fdExact(eta) {
  const umax = Math.sqrt(Math.max(eta, 0) + 45), n = 400, h = umax / n; let s = 0;
  const f = (u) => { const t = u * u - eta; return (2 * u * u) / (1 + Math.exp(Math.max(-700, Math.min(700, t)))); };
  s = f(0) + f(umax); for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 ? 4 : 2);
  return ((s * h) / 3) * (2 / Math.sqrt(Math.PI)); // ∫0^∞ √x(...)dx = ∫ 2u²(...)du, then × 2/√π
}
export function fdHalf(eta) {
  if (eta < F_LO) return Math.exp(eta);
  if (!FT) { FT = []; for (let e = F_LO; e <= F_HI + 1e-9; e += F_H) FT.push(Math.log(fdExact(e))); }
  if (eta >= F_HI) return fdExact(eta);
  const p = (eta - F_LO) / F_H, i = Math.floor(p), t = p - i;
  return Math.exp(FT[i] * (1 - t) + FT[i + 1] * t);
}
/** Equilibrium electron and hole densities for a chemical potential μ measured from the valence-band top. */
export function np(m, T, mu) {
  const kT = KB * T, E = eg(m, T);
  return { n: Nc(m, T) * fdHalf((mu - E) / kT), p: Nv(m, T) * fdHalf((0 - mu) / kT) };
}
/** Solve charge neutrality n + Na⁻ = p + Nd⁺ for μ (eV above Ev). Donors sit Ed below the band edge with degeneracy 2;
 *  acceptors are taken as fully ionized. */
export function solveMu(m, T, Nd, Na, Ed = m.Ed) {
  const kT = KB * T, E = eg(m, T);
  const g = (mu) => { const c = np(m, T, mu); const ndp = Nd / (1 + 2 * Math.exp(Math.max(-60, Math.min(60, (mu - (E - Ed)) / kT)))); return c.n + Na - c.p - ndp; };
  let lo = -0.6, hi = E + 0.6;
  for (let it = 0; it < 70; it++) { const mid = (lo + hi) / 2; if (g(mid) > 0) hi = mid; else lo = mid; }
  const mu = (lo + hi) / 2, c = np(m, T, mu), ndp = Nd / (1 + 2 * Math.exp(Math.max(-60, Math.min(60, (mu - (E - Ed)) / kT))));
  return { mu, n: c.n, p: c.p, ndp };
}
/** Tridiagonal (Thomas) solver: a sub-, b main-, c super-diagonal. */
export function thomas(a, b, c, d) {
  const n = b.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
  cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
  x[n - 1] = dp[n - 1]; for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}
