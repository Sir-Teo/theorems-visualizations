// Population Genetics & Evolution — Chapter 4 (Natural selection): shared helpers (plain named exports).
// Re-exports the chapter-3 helpers (which re-export chapter 2's).
export * from './ch03.shared.js';

/** One generation of constant viability selection at one diploid locus, random mating.
 *  p = frequency of A; w = [wAA, wAa, waa] relative fitnesses. Returns the new frequency of A. */
export function selStep(p, w) {
  const q = 1 - p, wA = p * w[0] + q * w[1], wa = p * w[1] + q * w[2], wb = p * wA + q * wa;
  return wb > 0 ? (p * wA) / wb : p;
}
/** Mean fitness w̄(p) = p²wAA + 2pq wAa + q² waa. */
export const wbarD = (p, w) => p * p * w[0] + 2 * p * (1 - p) * w[1] + (1 - p) * (1 - p) * w[2];
/** Slope dw̄/dp = 2[p(wAA − wAa) + q(wAa − waa)]. */
export const dwbarD = (p, w) => 2 * (p * (w[0] - w[1]) + (1 - p) * (w[1] - w[2]));
/** Change per generation Δp. */
export const dpSel = (p, w) => selStep(p, w) - p;
/** Interior equilibrium (wAa − waa)/(2wAa − wAA − waa), or null when it is not in (0,1) or does not exist. */
export function intEq(w) {
  const d = 2 * w[1] - w[0] - w[2];
  if (Math.abs(d) < 1e-12) return null;
  const x = (w[1] - w[2]) / d;
  return x > 0 && x < 1 ? x : null;
}
/** Iterate selStep from p0 for T generations. */
export function selPath(p0, w, T) {
  const out = new Float64Array(T + 1); out[0] = p0;
  for (let t = 1; t <= T; t++) out[t] = selStep(out[t - 1], w);
  return out;
}
/** Haploid selection: allele A with relative fitness 1+s against 1. */
export const hapStep = (p, s) => (p * (1 + s)) / (1 + p * s);
export const logit = (p) => Math.log(p / (1 - p));
export const expit = (x) => 1 / (1 + Math.exp(-x));

/** Presets of (wAA, wAa, waa) used by several items. */
export const SEL_PRESETS = [
  { value: 'dir', label: 'additive advantage', w: [1.1, 1.05, 1.0] },
  { value: 'dom', label: 'A dominant', w: [1.1, 1.1, 1.0] },
  { value: 'rec', label: 'A recessive', w: [1.1, 1.0, 1.0] },
  { value: 'over', label: 'heterozygote advantage', w: [0.9, 1.0, 0.8] },
  { value: 'under', label: 'heterozygote disadvantage', w: [1.0, 0.85, 0.95] },
];
