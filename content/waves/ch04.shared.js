// Waves & Optics — Chapter 4 shared helpers (Fresnel coefficients with complex angles, water dispersion).
// Re-exports the chapter 3 helpers (which re-export chapter 2's); imported by ch04.js and ch04-b.js.
export * from './ch03.shared.js';

const DEG = Math.PI / 180;
export const deg = (r) => r / DEG;
export const rad = (d) => d * DEG;

// tiny complex helpers on [re, im]
export const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
export const cabs2 = (a) => a[0] * a[0] + a[1] * a[1];
export const carg = (a) => Math.atan2(a[1], a[0]);

/**
 * Fresnel coefficients for a plane wave going from index n1 to index n2 at incidence angle th (radians).
 * cosT is complex beyond the critical angle (then |r| = 1 and the "transmitted" wave is evanescent; the branch
 * cosT = +i q makes it decay, i.e. the time convention is exp(i(kx - wt))).
 * Sign convention: the amplitude coefficients are those of Hecht (r_p > 0 at normal incidence for n2 > n1,
 * r_s < 0), so r_p and r_s have opposite signs at normal incidence only because of the choice of axes.
 * R = |r|^2; T is the power fraction across the interface (zero when cosT is imaginary), so R + T = 1.
 */
export function fresnel(n1, n2, th) {
  const si = Math.sin(th), ci = Math.cos(th);
  const s2 = ((n1 / n2) * si) ** 2;
  const tir = s2 > 1;
  const cosT = tir ? [0, Math.sqrt(s2 - 1)] : [Math.sqrt(1 - s2), 0];
  const a = [n1 * ci, 0], b = [n2 * cosT[0], n2 * cosT[1]];
  const rs = cdiv([a[0] - b[0], -b[1]], [a[0] + b[0], b[1]]);
  const ts = cdiv([2 * a[0], 0], [a[0] + b[0], b[1]]);
  const c = [n2 * ci, 0], d = [n1 * cosT[0], n1 * cosT[1]];
  const rp = cdiv([c[0] - d[0], -d[1]], [c[0] + d[0], d[1]]);
  const tp = cdiv([2 * a[0], 0], [c[0] + d[0], d[1]]);
  const Rs = cabs2(rs), Rp = cabs2(rp);
  const k = ci > 1e-12 ? (n2 * cosT[0]) / (n1 * ci) : 0;
  const Ts = tir ? 0 : k * cabs2(ts), Tp = tir ? 0 : k * cabs2(tp);
  return { rs, rp, ts, tp, Rs, Rp, Ts, Tp, tir, cosT, sinT: (n1 / n2) * si };
}

/** Refractive index of water as a function of vacuum wavelength (nm): Cauchy fit n = A + B/lambda^2 to n(656 nm) = 1.3311 and n(486 nm) = 1.3371 (approximate textbook values). */
export const nWater = (nm) => 1.3238 + 0.003141 / ((nm / 1000) * (nm / 1000));
/** Approximate Cauchy-type index of a dense flint-like glass: n = 1.6 + 0.012/lambda^2 (lambda in micrometres); a model, not a catalogue glass. */
export const nFlint = (nm) => 1.6 + 0.012 / ((nm / 1000) * (nm / 1000));

/** Deviation (radians) of a ray hitting a spherical drop with relative impact parameter b = sin(i), after k internal reflections. */
export function dropDeviation(b, n, k) {
  const i = Math.asin(Math.min(1, Math.max(-1, b))), r = Math.asin(b / n);
  return k * Math.PI + 2 * i - 2 * (k + 1) * r;
}

/** Vector helpers for ray tracing. */
export const vdot = (a, b) => a[0] * b[0] + a[1] * b[1];
/** Refract unit direction d at a surface with unit normal nrm pointing toward the incident side; eta = n1/n2. Returns null for total internal reflection. */
export function refractVec(d, nrm, eta) {
  const c = -vdot(d, nrm), k = 1 - eta * eta * (1 - c * c);
  if (k < 0) return null;
  const f = eta * c - Math.sqrt(k);
  return [eta * d[0] + f * nrm[0], eta * d[1] + f * nrm[1]];
}
/** Mirror reflection of d at a surface with unit normal nrm. */
export function reflectVec(d, nrm) { const c = vdot(d, nrm); return [d[0] - 2 * c * nrm[0], d[1] - 2 * c * nrm[1]]; }
