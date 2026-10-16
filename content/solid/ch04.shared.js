// Solid Mechanics & Structures — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports).
//
//   re-exports the chapter-3 helpers (which re-export chapters 2 and 1) and adds yield functions (Tresca, von Mises),
//   the principal-stress-plane yield loci, and the illustrative S–N model used by the three fatigue items.

export * from './ch03.shared.js';

/** Plane-stress (sigma3 = 0) equivalent stresses from the in-plane principal values. */
export const vm2 = (a, b) => Math.sqrt(a * a - a * b + b * b);
export const tresca2 = (a, b) => Math.max(Math.abs(a - b), Math.abs(a), Math.abs(b));
/** Three-dimensional versions from principal stresses. */
export const vm3 = (a, b, c) => Math.sqrt(0.5 * ((a - b) ** 2 + (b - c) ** 2 + (c - a) ** 2));
export const tresca3 = (a, b, c) => Math.max(a, b, c) - Math.min(a, b, c);

/** Tresca hexagon in the (sigma1, sigma2) plane for uniaxial yield stress Y (closed polygon). */
export const hexagon = (Y) => [[Y, 0], [Y, Y], [0, Y], [-Y, 0], [-Y, -Y], [0, -Y]];
/** von Mises ellipse s1^2 - s1 s2 + s2^2 = Y^2 as a point list. */
export function ellipse(Y, n = 120) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = (2 * Math.PI * i) / n, u = Math.SQRT2 * Y * Math.cos(t), w = Math.sqrt(2 / 3) * Y * Math.sin(t);
    out.push([(u + w) / Math.SQRT2, (u - w) / Math.SQRT2]);
  }
  return out;
}

/** Scale factor along the ray (cos a, sin a) in the (s1, s2) plane to reach each yield surface (uniaxial yield stress Y = 1). */
export const rayVM = (a) => 1 / vm2(Math.cos(a), Math.sin(a));
export const rayTresca = (a) => 1 / tresca2(Math.cos(a), Math.sin(a));

// ── illustrative S–N model (textbook idealisation, not test data) ───────────────────────────────────────────────────
/**
 * Stress amplitude S (MPa) at N cycles: a straight line on log S – log N from (1e3, 0.9 Su) to (Nk, Se); for steel the curve is flat
 * for N > Nk = 1e6 (endurance limit), for aluminium the line simply continues (no limit; Se is the strength at Nk = 5e8).
 * The numbers Se = 0.5 Su (steel) and Se = 0.3 Su at 5e8 (aluminium) are assumptions of this model.
 */
export const SN = {
  steel: { id: 'steel', name: 'steel (S355-like)', Su: 490, Sy: 355, Se: 245, Nk: 1e6, limit: true, color: 'accent' },
  al: { id: 'al', name: 'aluminium (6061-T6-like)', Su: 310, Sy: 276, Se: 93, Nk: 5e8, limit: false, color: 'orange' },
};
export function snSlope(m) { return Math.log10(m.Se / (0.9 * m.Su)) / (Math.log10(m.Nk) - 3); } // negative
export function snStress(m, N) {
  const b = snSlope(m);
  if (N <= 1e3) return 0.9 * m.Su;
  if (m.limit && N >= m.Nk) return m.Se;
  return 0.9 * m.Su * 10 ** (b * (Math.log10(N) - 3));
}
/** Cycles to failure at amplitude S (Infinity at or below the endurance limit of a material that has one). */
export function snLife(m, S) {
  if (S >= 0.9 * m.Su) return 1e3 * (0.9 * m.Su / S) ** 4; // beyond the low-cycle end: steep extrapolation, schematic
  if (m.limit && S <= m.Se) return Infinity;
  const b = snSlope(m);
  return 10 ** (3 + Math.log10(S / (0.9 * m.Su)) / b);
}
/** Text for a cycle count like 1.2 x 10^5 (TeX). */
export function cyc(N) {
  if (!isFinite(N)) return String.raw`\infty`;
  if (N < 1000) return String(Math.round(N));
  const e = Math.floor(Math.log10(N)), m = N / 10 ** e;
  return `${m.toFixed(1)}\\times10^{${e}}`;
}
