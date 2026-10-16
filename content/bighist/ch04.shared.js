// Big History & Quantitative History — Chapter 4 shared helpers (imported by ch04.js and ch04-b.js). Re-exports the chapter-3 helpers.
export * from './ch03.shared.js';

/** Standard Gumbel(0, 1) draw from a uniform generator r() in (0, 1). */
export const gumbel01 = (r) => -Math.log(-Math.log(Math.min(1 - 1e-12, Math.max(1e-12, r()))));
export const EULER_GAMMA = 0.5772156649015329;

/** Haploid chromosome painting: two-state Markov ancestry along a chromosome of `L` Morgans, junctions at rate T per Morgan
 *  (T generations of recombination), stationary fraction f of the foreign state. Returns the foreign segments [start, end] in Morgans. */
export function paintSegments(r, L, T, f) {
  const out = []; if (f <= 0) return out;
  const rateOut = [T * f, T * (1 - f)]; // [leave the native state, leave the foreign state], per Morgan
  let state = r() < f ? 1 : 0, x = 0;
  while (x < L) {
    const len = -Math.log(Math.max(1e-12, 1 - r())) / Math.max(1e-9, rateOut[state]);
    const e = Math.min(L, x + len);
    if (state === 1) out.push([x, e]);
    x = e; state = 1 - state;
  }
  return out;
}
