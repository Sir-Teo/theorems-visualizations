// Medical Imaging — Chapter 4 shared helpers (plain named exports). Re-exports the chapter-3 helpers (which re-export chapters 1-2) and adds:
//   * 360-degree parallel scans, an attenuated emission projector (SPECT) and Chang's first-order attenuation correction;
//   * a Poisson sampler, the MLEM / OSEM update and the Poisson log-likelihood on the ray-sum system of ch03.shared.js;
//   * a model of an Anger camera (19 photomultiplier tubes on a hexagonal lattice, centroid positioning);
//   * a two-tissue compartment model with a model plasma input function (FDG-like), and a least-squares line fit for the Patlak plot.
// All numbers produced by these models are illustrative reconstructions, not measured data.

export * from './ch03.shared.js';
import { gauss } from './ch03.shared.js';

const PI = Math.PI;

// ---------------------------------------------------------------- scans over 2π and attenuated emission projection
/** Parallel scan with nA views over [0, 2π) (the two opposite views differ once attenuation acts); usable with filterSino / backproject. */
export function makeScan360(nA, nd, half = 1.45) {
  const tau = (2 * half) / nd, th = new Float64Array(nA), cs = new Float64Array(nA), sn = new Float64Array(nA);
  for (let k = 0; k < nA; k++) { th[k] = (2 * k * PI) / nA; cs[k] = Math.cos(th[k]); sn[k] = Math.sin(th[k]); }
  return { nA, nd, tau, half, th, cs, sn, s0: -half + tau / 2, sOf: (j) => -half + (j + 0.5) * tau };
}
/** Distance from (x, y) to the boundary of ellipse E = [A, a, b, x0, y0, φ°] along the unit direction (dx, dy) (point inside). */
export function exitLen(E, x, y, dx, dy) {
  const [, a, b, x0, y0, ph] = E, t = (ph * PI) / 180, ux = Math.cos(t), uy = Math.sin(t);
  const X = (x - x0) * ux + (y - y0) * uy, Y = -(x - x0) * uy + (y - y0) * ux, DX = dx * ux + dy * uy, DY = -dx * uy + dy * ux;
  const A = (DX / a) ** 2 + (DY / b) ** 2, B = 2 * ((X * DX) / (a * a) + (Y * DY) / (b * b)), C = (X / a) ** 2 + (Y / b) ** 2 - 1;
  const disc = B * B - 4 * A * C;
  return disc < 0 ? 0 : Math.max(0, (-B + Math.sqrt(disc)) / (2 * A));
}
/**
 * SPECT projection data: act and mu are W×W images on [-1,1]² (row 0 top); muBox converts the mu image to inverse box units.
 * The detector sits at +t along each ray (direction (−sinθ, cosθ)); an emission at t is seen with weight exp(−∫_t^T mu).
 */
export function spectSino(act, mu, W, sc, muBox) {
  const out = new Float64Array(sc.nA * sc.nd), tmax = Math.SQRT2, ns = 2 * W, h = (2 * tmax) / ns;
  for (let k = 0; k < sc.nA; k++) {
    const c = sc.cs[k], sn = sc.sn[k];
    for (let j = 0; j < sc.nd; j++) {
      const s = sc.sOf(j); let att = 1, acc = 0;
      for (let i = ns - 1; i >= 0; i--) {
        const t = -tmax + (i + 0.5) * h, x = s * c - t * sn, y = s * sn + t * c;
        const px = Math.floor(((x + 1) * W) / 2), py = Math.floor(((1 - y) * W) / 2);
        if (px < 0 || px >= W || py < 0 || py >= W) continue;
        const id = py * W + px; acc += act[id] * att * h; att *= Math.exp(-muBox * mu[id] * h);
      }
      out[k * sc.nd + j] = acc;
    }
  }
  return out;
}
/** Chang's first-order correction factor image 1 / mean_k exp(−muBox · l_k(x,y)), l_k = path length to the body outline E towards view k. */
export function changFactor(E, W, nA, muBox) {
  const out = new Float64Array(W * W);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const x = -1 + ((i + 0.5) * 2) / W, y = 1 - ((j + 0.5) * 2) / W; let s = 0;
    for (let k = 0; k < nA; k++) { const th = (2 * k * PI) / nA; s += Math.exp(-muBox * exitLen(E, x, y, -Math.sin(th), Math.cos(th))); }
    out[j * W + i] = s > 0 ? nA / s : 1;
  }
  return out;
}

// ---------------------------------------------------------------- Poisson sampling and MLEM / OSEM
/** Poisson(lam) from a uniform generator r32 (Knuth below 30, normal approximation above). */
export function poissonK(lam, r32) {
  if (lam <= 0) return 0;
  if (lam > 30) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss(r32)));
  const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= r32(); } while (p > L); return k - 1;
}
/** Sensitivity images A_sᵀ1 for S ordered subsets (view k belongs to subset k mod S). */
export function subsetSens(sys, S) {
  const out = Array.from({ length: S }, () => new Float64Array(sys.N));
  for (const r of sys.rows) { const o = out[r.view % S]; for (let m = 0; m < r.idx.length; m++) o[r.idx[m]] += r.val[m]; }
  return out;
}
/** One OSEM sub-iteration (S=1 is MLEM), using the exact transpose of the same sparse forward matrix.
 * Requires nonnegative data/response and positive predictions for every positive observed count.
 * A zero-count bin contributes ratio 0, including 0/0; unobserved columns are unchanged. Modifies x. */
export function osemSub(sys, y, x, sub, S, sens) {
  const upd = new Float64Array(sys.N);
  sys.rows.forEach((r, i) => {
    if (r.view % S !== sub) return;
    let d = 0; for (let m = 0; m < r.idx.length; m++) d += r.val[m] * x[r.idx[m]];
    if (y[i] === 0) return; // Includes an empty ray: its 0/0 term contributes zero.
    if (!(d > 0)) throw new RangeError('Positive emission count has zero model prediction; initialize its support positively.');
    const f = y[i] / d;
    for (let m = 0; m < r.idx.length; m++) upd[r.idx[m]] += r.val[m] * f;
  });
  const sn = sens[sub];
  for (let q = 0; q < sys.N; q++) if (sn[q] > 0) x[q] *= upd[q] / sn[q];
}
/** Poisson log-likelihood Σ (y ln ȳ − ȳ) (the constant −Σ ln y! is dropped). */
export function logLik(sys, y, x) {
  let L = 0;
  sys.rows.forEach((r, i) => {
    let d = 0; for (let m = 0; m < r.idx.length; m++) d += r.val[m] * x[r.idx[m]];
    if (!(d >= 0)) throw new RangeError('Poisson means must be nonnegative.');
    L += y[i] === 0 ? -d : d > 0 ? y[i] * Math.log(d) - d : -Infinity;
  });
  return L;
}

// ---------------------------------------------------------------- Anger camera model
/** 19 photomultiplier tubes on a hexagonal lattice of pitch 1 (two rings around the centre). */
export const TUBES = (() => {
  const t = [];
  for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) if (Math.abs(q + r) <= 2) t.push([q + r / 2, (r * Math.sqrt(3)) / 2]);
  return t;
})();
const LW = 0.62, lightF = (r2) => Math.pow(1 + r2 / (LW * LW), -1.5);
const F0 = TUBES.reduce((s, [x, y]) => s + lightF(x * x + y * y), 0);
/** Mean photoelectron counts in every tube for a scintillation at (x, y) producing N0 photoelectrons at the crystal centre. */
export function tubeMeans(x, y, N0) { return TUBES.map(([tx, ty]) => (N0 * lightF((x - tx) ** 2 + (y - ty) ** 2)) / F0); }
/** Centroid position estimate and total signal from tube signals. */
export function centroid(sig) {
  let s = 0, sx = 0, sy = 0;
  sig.forEach((q, i) => { s += q; sx += q * TUBES[i][0]; sy += q * TUBES[i][1]; });
  return { x: s > 0 ? sx / s : 0, y: s > 0 ? sy / s : 0, z: s };
}

// ---------------------------------------------------------------- two-tissue compartment model, model input function, Patlak line fit
/** Model plasma input function (kBq/mL, t in minutes): fast bolus peak, bi-exponential fall, long slow tail. A reconstruction, not patient data. */
export const plasma = (t) => (t <= 0 ? 0 : (1 - Math.exp(-t / 0.2)) * (55 * Math.exp(-0.9 * t) + 7 * Math.exp(-0.1 * t) + 4.5 * Math.exp(-0.0045 * t)));
/** Time grid and the tissue curve C_T = (C1 + C2) + Vb·Cp for the two-tissue model (K1, k2, k3, k4, Vb) by direct convolution. */
export function twoTissue(K1, k2, k3, k4, Vb, tEnd = 90, dt = 0.1) {
  const n = Math.round(tEnd / dt) + 1, t = new Float64Array(n), cp = new Float64Array(n), ct = new Float64Array(n);
  const sum = k2 + k3 + k4, disc = Math.sqrt(Math.max(0, sum * sum - 4 * k2 * k4)), a1 = (sum - disc) / 2, a2 = (sum + disc) / 2;
  const imp = (u) => (a2 - a1 < 1e-9 ? K1 * Math.exp(-a2 * u) * (1 + k3 * u) : (K1 / (a2 - a1)) * ((k3 + k4 - a1) * Math.exp(-a1 * u) + (a2 - k3 - k4) * Math.exp(-a2 * u)));
  for (let i = 0; i < n; i++) { t[i] = i * dt; cp[i] = plasma(t[i]); }
  const h = new Float64Array(n); for (let i = 0; i < n; i++) h[i] = imp(i * dt);
  for (let i = 0; i < n; i++) {
    let s = 0; for (let j = 0; j <= i; j++) { const w = j === 0 || j === i ? 0.5 : 1; s += w * cp[j] * h[i - j]; }
    ct[i] = s * dt + Vb * cp[i];
  }
  return { t, cp, ct, n, dt };
}
/** Ordinary least squares y = a + b x. */
export function fitLine(xs, ys) {
  const n = xs.length; let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; }
  const d = n * sxx - sx * sx, b = Math.abs(d) < 1e-12 ? 0 : (n * sxy - sx * sy) / d;
  return { slope: b, intercept: (sy - b * sx) / n };
}
