// Behavioural Economics — Chapter 5: helpers shared by ch05.js and ch05-b.js.
// Re-exports the chapter 4 helpers (and through them chapters 2 and 3) and adds discount functions and a few small numerics.
export * from './ch04.shared.js';

/** Discount functions of a delay t (any consistent time unit). */
export const dExp = (r, t) => Math.pow(1 + r, -t);          // exponential with rate r per unit
export const dHyp = (k, t) => 1 / (1 + k * t);              // hyperbolic 1/(1 + k t)
export const dQH = (beta, delta, t) => (t <= 0 ? 1 : beta * Math.pow(delta, t)); // quasi-hyperbolic (beta-delta)

export const logistic = (x) => 1 / (1 + Math.exp(-x));
export const logit = (p) => Math.log(p / (1 - p));

/** Plain rounding to a number of decimals, as a string with a real minus sign. */
export const fx = (x, d = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d);
