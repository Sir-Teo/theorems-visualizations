// Atmosphere & Ocean Dynamics — Chapter 4 shared helpers. Re-exports the chapter-3 helpers (which re-export chapters 1-2).
export * from './ch03.shared.js';
import { OMEGA, RAD } from './ch03.shared.js';

export const RHO_W = 1025; // kg/m^3, typical sea water (rounded)

/** Coriolis parameter, signed (hemisphere sign), floor at a tiny value. */
export const fOf = (latDeg) => 2 * OMEGA * Math.sin(latDeg * RAD);

/**
 * Steady Ekman layer with arbitrary eddy viscosity A(z) (m^2/s), z in [-H, 0] (z up).
 * Solves  (A psi')' = i f psi,  psi = u + i v,  A psi'(0) = 1 (a unit kinematic stress tau/rho = 1 m^2/s^2 along +x),
 * psi(-H) = 0 (no flow at the bottom of the computed layer: a rigid bottom, or "deep enough").
 * Finite differences on N cells, complex Thomas algorithm.  Returns {z[], re[], im[], T:[Tre,Tim], surf:[re,im]}
 * where T is the depth integral (transport per unit width, m^2/s) by the trapezoid rule.
 */
export function ekmanSolve(Afn, f, H, N = 400) {
  const h = H / N, z = new Array(N + 1);
  for (let j = 0; j <= N; j++) z[j] = -H + j * h;
  // interior unknowns psi_1..psi_N ; psi_0 = 0
  const lo = new Array(N + 1).fill(0), di = new Array(N + 1).fill(0), up = new Array(N + 1).fill(0), rhs = new Array(N + 1).fill(0);
  // rows hold real coefficients lo/up and a complex diagonal (dre + i f-part): diag = d - i f  with d real
  const dre = new Array(N + 1).fill(0);
  for (let j = 1; j < N; j++) {
    const Am = Afn(z[j] - h / 2), Ap = Afn(z[j] + h / 2);
    lo[j] = Am / (h * h); up[j] = Ap / (h * h); dre[j] = -(Am + Ap) / (h * h);
  }
  {
    const Am = Afn(z[N] - h / 2);
    lo[N] = 2 * Am / (h * h); dre[N] = -2 * Am / (h * h); rhs[N] = -2 / h;
  }
  // diagonal_j = dre[j] - i f ; solve lo psi_{j-1} + diag psi_j + up psi_{j+1} = rhs (real rhs)
  const cr = new Array(N + 1).fill(0), ci = new Array(N + 1).fill(0), dr = new Array(N + 1).fill(0), di2 = new Array(N + 1).fill(0);
  // forward elimination for rows 1..N
  let pr = 0, pi = 0; // modified diagonal of previous row (complex), start none
  const xr = new Array(N + 1).fill(0), xi = new Array(N + 1).fill(0);
  const wr = new Array(N + 1).fill(0), wi = new Array(N + 1).fill(0); // working rhs
  const ur = new Array(N + 1).fill(0), ui = new Array(N + 1).fill(0); // modified diag
  for (let j = 1; j <= N; j++) {
    let br = dre[j], bi = -f, gr = rhs[j], gi = 0;
    if (j > 1) {
      // factor = lo[j] / u_{j-1}
      const d = ur[j - 1] * ur[j - 1] + ui[j - 1] * ui[j - 1];
      const fr = lo[j] * ur[j - 1] / d, fi = -lo[j] * ui[j - 1] / d;
      // b -= factor * up[j-1]
      br -= fr * up[j - 1]; bi -= fi * up[j - 1];
      // g -= factor * w_{j-1}
      gr -= fr * wr[j - 1] - fi * wi[j - 1]; gi -= fr * wi[j - 1] + fi * wr[j - 1];
    }
    ur[j] = br; ui[j] = bi; wr[j] = gr; wi[j] = gi;
  }
  // back substitution
  for (let j = N; j >= 1; j--) {
    let gr = wr[j], gi = wi[j];
    if (j < N) { gr -= up[j] * xr[j + 1]; gi -= up[j] * xi[j + 1]; }
    const d = ur[j] * ur[j] + ui[j] * ui[j];
    xr[j] = (gr * ur[j] + gi * ui[j]) / d; xi[j] = (gi * ur[j] - gr * ui[j]) / d;
  }
  let Tr = 0, Ti = 0;
  for (let j = 0; j < N; j++) { Tr += 0.5 * h * (xr[j] + xr[j + 1]); Ti += 0.5 * h * (xi[j] + xi[j + 1]); }
  return { z, re: xr, im: xi, h, T: [Tr, Ti], surf: [xr[N], xi[N]] };
}

/** analytic deep-water Ekman spiral for constant viscosity A: psi(z) = psi0 exp((1 + i sgn f) z / d) , unit stress along +x. */
export function ekmanSpiral(A, f) {
  const s = f >= 0 ? 1 : -1, d = Math.sqrt(2 * A / Math.abs(f));
  // psi0 = 1 / (A * (1 + i s)/d) = d (1 - i s) / (2 A)
  const p0 = [d / (2 * A), -s * d / (2 * A)];
  return {
    d, s, p0,
    at(z) {
      const m = Math.exp(z / d), ph = s * z / d;
      const er = m * Math.cos(ph), ei = m * Math.sin(ph);
      return [p0[0] * er - p0[1] * ei, p0[0] * ei + p0[1] * er];
    },
  };
}
