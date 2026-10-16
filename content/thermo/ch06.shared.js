// Thermodynamics & Statistical Mechanics — Chapter 6: helpers shared by ch06.js and ch06-b.js
// (the helpers of chapters 1–5 are re-exported; the additions are canonical-ensemble utilities, with k = 1)
export * from './ch05.shared.js';

/** Canonical sums for a level list [{E, g}] at inverse temperature β (k = 1): Z, probabilities per level, ⟨E⟩, Var E, C/k, S/k, F. */
export function canon(levels, beta) {
  const E0 = Math.min(...levels.map((l) => l.E));
  const w = levels.map((l) => (l.g ?? 1) * Math.exp(-beta * (l.E - E0)));
  const Zs = w.reduce((a, b) => a + b, 0);
  const p = w.map((x) => x / Zs);
  const U = levels.reduce((s, l, i) => s + p[i] * l.E, 0);
  const E2 = levels.reduce((s, l, i) => s + p[i] * l.E * l.E, 0);
  const varE = Math.max(0, E2 - U * U);
  const lnZ = Math.log(Zs) - beta * E0;
  return { Z: Zs * Math.exp(-beta * E0), lnZ, p, w, U, varE, C: beta * beta * varE, S: lnZ + beta * U, F: -lnZ / beta };
}
/** Geometric (Bose) occupation of one oscillator, P(n) = (1−x)xⁿ, drawn from a uniform u. */
export const geomDraw = (u, x) => Math.floor(Math.log(1 - u) / Math.log(x));
/** Einstein heat capacity per oscillator in units of k, with y = ħω/kT. */
export const cEin = (y) => (y < 1e-6 ? 1 : y > 700 ? 0 : (y * y * Math.exp(y)) / (Math.exp(y) - 1) ** 2);
/** Standard normal density. */
export const gauss = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
/** Brillouin function B_J(x). */
export function brillouin(J, x) {
  if (Math.abs(x) < 1e-6) return ((J + 1) / (3 * J)) * x;
  const a = (2 * J + 1) / (2 * J), b = 1 / (2 * J);
  return a / Math.tanh(a * x) - b / Math.tanh(b * x);
}
/** Langevin function L(x) = coth x − 1/x. */
export const langevin = (x) => (Math.abs(x) < 1e-4 ? x / 3 : 1 / Math.tanh(x) - 1 / x);

// event-driven hard-sphere gas and its drawing and clock helpers (from chapter 1)
export { hsGas, drawGas, runBudget, simClock } from './ch01.shared.js';
