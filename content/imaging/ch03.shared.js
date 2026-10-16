// Medical Imaging — Chapter 3 shared helpers (plain named exports). Re-exports the chapter-2 helpers (photon-interaction model,
// tube spectra, image display) and the chapter-1 phantom / noise helpers that do not clash, and adds:
//   * a self-contained radix-2 FFT (1-D and 2-D, flat arrays) so the numerics can be tested outside the browser;
//   * analytic ellipse phantoms: exact Radon transform (chord lengths) and exact 2-D Fourier transform (Bessel J1);
//   * parallel-beam geometry, sampled sinograms, ramp filters with windows, filtered / simple back-projection;
//   * a sparse ray-sum system (marching) for the algebraic methods ART, SIRT and SART.
// Conventions: images are Float64Array(W*H) with row 0 at the top and pixel centres at x = -1 + (i+½)·2/W, y = 1 - (j+½)·2/H
// (the object lives in the box [-1,1]²); a parallel view at angle θ has detector coordinate s = x cosθ + y sinθ; views cover [0, π).

export * from './ch02.shared.js';
export { bindM, FWHM_K, pt, SHEPP_LOGAN, slAt, render, sheppLogan, besselJ1, noiseField, poissonFrom, psfC } from './ch01.shared.js';
import { SHEPP_LOGAN, besselJ1 } from './ch01.shared.js';

const PI = Math.PI;

// ---------------------------------------------------------------- FFT (radix-2, in place, unnormalised forward)
export function fft1(re, im, inv = false) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inv ? 2 : -2) * PI) / len, wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < h; k++) {
        const a = i + k, b = a + h, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
  if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}
/** 2-D FFT of flat W×H arrays (both powers of two), in place; inv divides by W·H. */
export function fft2d(re, im, W, H, inv = false) {
  const r = new Float64Array(W), q = new Float64Array(W);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) { r[i] = re[j * W + i]; q[i] = im[j * W + i]; }
    fft1(r, q, inv);
    for (let i = 0; i < W; i++) { re[j * W + i] = r[i]; im[j * W + i] = q[i]; }
  }
  const c = new Float64Array(H), d = new Float64Array(H);
  for (let i = 0; i < W; i++) {
    for (let j = 0; j < H; j++) { c[j] = re[j * W + i]; d[j] = im[j * W + i]; }
    fft1(c, d, inv);
    for (let j = 0; j < H; j++) { re[j * W + i] = c[j]; im[j * W + i] = d[j]; }
  }
}
export const pow2ge = (n) => { let p = 1; while (p < n) p *= 2; return p; };

// ---------------------------------------------------------------- statistics helpers
export const rmse = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2; return Math.sqrt(s / a.length); };
export const rms = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i]; return Math.sqrt(s / a.length); };
/** Mulberry32 uniform generator. */
export function rng32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function gauss(r) { let u = 0; while (u < 1e-12) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * r()); }

// ---------------------------------------------------------------- ellipse phantoms
// An ellipse is [A, a, b, x0, y0, φ°] (additive value, semi-axes along / across the rotated axes, centre, rotation).
/** Shepp–Logan (Toft's contrast-enhanced values) shrunk so that it fits inside the disc of radius `fill`·0.92 …; fill = 0.9 keeps it inside the unit box. */
export function slEllipses(fill = 0.9, scale = 1) { return SHEPP_LOGAN.map(([A, a, b, x0, y0, ph]) => [A * scale, a * fill, b * fill, x0 * fill, y0 * fill, ph]); }
/** Value of an ellipse list at (x, y). */
export function ellAt(E, x, y) {
  let v = 0;
  for (const [A, a, b, x0, y0, ph] of E) {
    const t = (ph * PI) / 180, dx = x - x0, dy = y - y0, u = dx * Math.cos(t) + dy * Math.sin(t), w = -dx * Math.sin(t) + dy * Math.cos(t);
    if ((u / a) ** 2 + (w / b) ** 2 <= 1) v += A;
  }
  return v;
}
/** Exact Radon transform of an ellipse list: the line {x cosθ + y sinθ = s}. */
export function ellProj(E, th, s) {
  const c = Math.cos(th), sn = Math.sin(th); let p = 0;
  for (const [A, a, b, x0, y0, ph] of E) {
    const al = th - (ph * PI) / 180, a2 = (a * Math.cos(al)) ** 2 + (b * Math.sin(al)) ** 2, t = s - (x0 * c + y0 * sn);
    if (t * t < a2) p += (A * 2 * a * b * Math.sqrt(a2 - t * t)) / a2;
  }
  return p;
}
/** Exact 2-D Fourier transform F(kx, ky) = ∫ f e^{-2πi k·r} dr of an ellipse list → [re, im]. */
export function ellFT(E, kx, ky) {
  let re = 0, im = 0;
  for (const [A, a, b, x0, y0, ph] of E) {
    const t = (ph * PI) / 180, u = kx * Math.cos(t) + ky * Math.sin(t), w = -kx * Math.sin(t) + ky * Math.cos(t);
    const rho = Math.hypot(a * u, b * w), g = rho < 1e-9 ? PI * a * b : (a * b * besselJ1(2 * PI * rho)) / rho;
    const ph0 = -2 * PI * (kx * x0 + ky * y0);
    re += A * g * Math.cos(ph0); im += A * g * Math.sin(ph0);
  }
  return [re, im];
}
/** Rasterise a function f(x, y) on [-1,1]² (y up) to a W×H image with ss×ss supersampling. */
export function raster(f, W, H, ss = 2) {
  const out = new Float64Array(W * H), hx = 2 / W, hy = 2 / H;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    let s = 0;
    for (let q = 0; q < ss; q++) for (let p = 0; p < ss; p++) s += f(-1 + (i + (p + 0.5) / ss) * hx, 1 - (j + (q + 0.5) / ss) * hy);
    out[j * W + i] = s / (ss * ss);
  }
  return out;
}

// ---------------------------------------------------------------- parallel-beam scans
/** Scan geometry: nA views over [0, π), nd detector samples of spacing tau centred on s = 0. */
export function makeScan(nA, nd, half = 1.45) {
  const tau = (2 * half) / nd, th = new Float64Array(nA), cs = new Float64Array(nA), sn = new Float64Array(nA);
  for (let k = 0; k < nA; k++) { th[k] = (k * PI) / nA; cs[k] = Math.cos(th[k]); sn[k] = Math.sin(th[k]); }
  return { nA, nd, tau, half, th, cs, sn, s0: -half + tau / 2, sOf: (j) => -half + (j + 0.5) * tau };
}
/** Sinogram (nA×nd, view-major) of an ellipse list by the exact formula. */
export function sinoEll(E, sc) {
  const out = new Float64Array(sc.nA * sc.nd);
  for (let k = 0; k < sc.nA; k++) for (let j = 0; j < sc.nd; j++) out[k * sc.nd + j] = ellProj(E, sc.th[k], sc.sOf(j));
  return out;
}
const hCache = new Map();
/** Window function of the normalised frequency ν ∈ [0, 1] (1 = Nyquist) with cutoff c ∈ (0, 1]. */
export function winFn(name, nu, c = 1) {
  if (nu > c) return 0;
  const x = nu / c;
  switch (name) {
    case 'ramp': return 1;
    case 'shepp': return x < 1e-9 ? 1 : Math.sin((PI * x) / 2) / ((PI * x) / 2);
    case 'cosine': return Math.cos((PI * x) / 2);
    case 'hamming': return 0.54 + 0.46 * Math.cos(PI * x);
    case 'hann': return 0.5 + 0.5 * Math.cos(PI * x);
    default: return 1;
  }
}
/** Filter of length P = pow2 ≥ 2·nd for ramp / window / cutoff: frequency response H[k] (real, from the band-limited Ram–Lak kernel) and the spatial kernel. */
export function makeFilter(nd, tau, win = 'ramp', cut = 1) {
  const key = `${nd}|${tau.toFixed(6)}|${win}|${cut.toFixed(4)}`;
  if (hCache.has(key)) return hCache.get(key);
  const P = pow2ge(2 * nd), hr = new Float64Array(P), hi = new Float64Array(P);
  for (let n = -(P / 2 - 1); n <= P / 2 - 1; n++) {
    const v = n === 0 ? 1 / (4 * tau * tau) : n % 2 === 0 ? 0 : -1 / (PI * PI * n * n * tau * tau);
    hr[(n + P) % P] = v;
  }
  fft1(hr, hi);
  const H = new Float64Array(P);
  for (let k = 0; k < P; k++) { const nu = Math.min(k, P - k) / (P / 2); H[k] = hr[k] * winFn(win, nu, cut); }
  // spatial kernel of the (windowed) filter
  const kr = Float64Array.from(H), ki = new Float64Array(P); fft1(kr, ki, true);
  const kernel = (m) => kr[(m + P) % P];
  const F = { P, H, kernel, nd, tau };
  if (hCache.size > 60) hCache.clear();
  hCache.set(key, F);
  return F;
}
/** q = τ·(p * h): filter every view of a sinogram. */
export function filterSino(sino, sc, F) {
  const out = new Float64Array(sino.length), re = new Float64Array(F.P), im = new Float64Array(F.P);
  for (let k = 0; k < sc.nA; k++) {
    re.fill(0); im.fill(0);
    for (let j = 0; j < sc.nd; j++) re[j] = sino[k * sc.nd + j];
    fft1(re, im);
    for (let q = 0; q < F.P; q++) { re[q] *= F.H[q]; im[q] *= F.H[q]; }
    fft1(re, im, true);
    for (let j = 0; j < sc.nd; j++) out[k * sc.nd + j] = re[j] * sc.tau;
  }
  return out;
}
/** Back-project views [k0, k1) of a (filtered or raw) sinogram onto a W×H image of the box [-1,1]²; scaled by π/nA·`weight`. */
export function backproject(q, sc, W, H, k1 = sc.nA, k0 = 0, weight = 1) {
  const out = new Float64Array(W * H), dth = (PI / sc.nA) * weight, nd = sc.nd, inv = 1 / sc.tau;
  for (let j = 0; j < H; j++) {
    const y = 1 - ((j + 0.5) * 2) / H;
    for (let i = 0; i < W; i++) {
      const x = -1 + ((i + 0.5) * 2) / W;
      let acc = 0;
      for (let k = k0; k < k1; k++) {
        const u = (x * sc.cs[k] + y * sc.sn[k] + sc.half) * inv - 0.5, m = Math.floor(u), a = u - m;
        if (m < -1 || m >= nd) continue;
        const v0 = m >= 0 ? q[k * nd + m] : 0, v1 = m + 1 < nd ? q[k * nd + m + 1] : 0;
        acc += v0 * (1 - a) + v1 * a;
      }
      out[j * W + i] = acc * dth;
    }
  }
  return out;
}
/** Filtered back-projection of the analytic or measured sinogram. */
export function fbp(sino, sc, W, H, win = 'ramp', cut = 1, nViews = sc.nA) {
  return backproject(filterSino(sino, sc, makeFilter(sc.nd, sc.tau, win, cut)), sc, W, H, nViews);
}

// ---------------------------------------------------------------- sparse ray-sum system on an n×n grid (for ART, SIRT, SART)
/** Rays at nA angles × nd offsets (spacing = 2·half/nd); each row's weights are path lengths through the pixels (marching, step = pixel/5). */
export function buildSystem(n, nA, nd, half = 1.42) {
  const sc = makeScan(nA, nd, half), pix = 2 / n, dt = pix / 5, rows = [];
  for (let k = 0; k < nA; k++) for (let j = 0; j < nd; j++) {
    const s = sc.sOf(j), c = sc.cs[k], sn = sc.sn[k], acc = new Map();
    const tm = Math.sqrt(Math.max(0, 2 - s * s));
    for (let t = -tm + dt / 2; t < tm; t += dt) {
      const x = s * c - t * sn, y = s * sn + t * c;
      const i = Math.floor((x + 1) / pix), jj = Math.floor((1 - y) / pix);
      if (i < 0 || i >= n || jj < 0 || jj >= n) continue;
      acc.set(jj * n + i, (acc.get(jj * n + i) || 0) + dt);
    }
    const idx = Int32Array.from(acc.keys()), val = Float64Array.from(acc.values());
    rows.push({ idx, val, view: k, ss: val.reduce((p, q) => p + q * q, 0), sum: val.reduce((p, q) => p + q, 0) });
  }
  return { n, nA, nd, sc, rows, N: n * n };
}
export function forward(sys, x) { return Float64Array.from(sys.rows, (r) => { let s = 0; for (let m = 0; m < r.idx.length; m++) s += r.val[m] * x[r.idx[m]]; return s; }); }
/** One Kaczmarz sweep (ART) over all rows in `order`, relaxation lam. Modifies x. */
export function artSweep(sys, b, x, lam = 1, order = null) {
  const R = sys.rows, ord = order || R.map((_, i) => i);
  for (const i of ord) {
    const r = R[i]; if (!(r.ss > 0)) continue;
    let d = 0; for (let m = 0; m < r.idx.length; m++) d += r.val[m] * x[r.idx[m]];
    const f = (lam * (b[i] - d)) / r.ss;
    for (let m = 0; m < r.idx.length; m++) x[r.idx[m]] += f * r.val[m];
  }
}
/** Order of the rays that visits views in a well-spread order (stride coprime to nA) – the usual remedy for ART's slow start. */
export function spreadOrder(sys, stride = 0) {
  const nA = sys.nA; let st = stride || Math.round(nA * 0.382) || 1;
  const gcd = (a, c) => (c ? gcd(c, a % c) : a); while (gcd(st, nA) !== 1) st++;
  const ord = []; for (let q = 0; q < nA; q++) { const k = (q * st) % nA; for (let j = 0; j < sys.nd; j++) ord.push(k * sys.nd + j); }
  return ord;
}
/** One SIRT iteration: x += lam · C Aᵀ R (b − A x). */
export function sirtStep(sys, b, x, lam = 1, cache = {}) {
  if (!cache.col) { cache.col = new Float64Array(sys.N); for (const r of sys.rows) for (let m = 0; m < r.idx.length; m++) cache.col[r.idx[m]] += r.val[m]; }
  const upd = new Float64Array(sys.N);
  sys.rows.forEach((r, i) => {
    if (!(r.sum > 0)) return;
    let d = 0; for (let m = 0; m < r.idx.length; m++) d += r.val[m] * x[r.idx[m]];
    const f = (b[i] - d) / r.sum;
    for (let m = 0; m < r.idx.length; m++) upd[r.idx[m]] += r.val[m] * f;
  });
  for (let q = 0; q < sys.N; q++) if (cache.col[q] > 0) x[q] += (lam * upd[q]) / cache.col[q];
}
/** One SART sweep: views in `order`, each view updates all pixels at once from the average correction of its rays. */
export function sartSweep(sys, b, x, lam = 1, order = null) {
  const ord = order || Array.from({ length: sys.nA }, (_, k) => k), upd = new Float64Array(sys.N), wsum = new Float64Array(sys.N);
  for (const k of ord) {
    upd.fill(0); wsum.fill(0);
    for (let j = 0; j < sys.nd; j++) {
      const i = k * sys.nd + j, r = sys.rows[i]; if (!(r.sum > 0)) continue;
      let d = 0; for (let m = 0; m < r.idx.length; m++) d += r.val[m] * x[r.idx[m]];
      const f = (b[i] - d) / r.sum;
      for (let m = 0; m < r.idx.length; m++) { upd[r.idx[m]] += r.val[m] * f; wsum[r.idx[m]] += r.val[m]; }
    }
    for (let q = 0; q < sys.N; q++) if (wsum[q] > 1e-12) x[q] += (lam * upd[q]) / wsum[q];
  }
}

// ---------------------------------------------------------------- Fourier-space reconstruction (3.5): spokes → Cartesian grid → inverse FFT
/** Spokes of a parallel scan (half-width `half`, nd samples): for each of n views over `range` degrees, P_θ(ω) at ω = m·dw, m < nR, by a direct sum over the sampled projection. */
export function fourierSpokes(sino, sc, n, nR, dw) {
  const sp = [];
  for (let k = 0; k < n; k++) {
    const re = new Float64Array(nR), im = new Float64Array(nR);
    for (let m = 0; m < nR; m++) {
      let a = 0, b = 0; const w = m * dw;
      for (let j = 0; j < sc.nd; j++) { const ph = -2 * PI * w * sc.sOf(j), p = sino[k * sc.nd + j]; a += p * Math.cos(ph) * sc.tau; b += p * Math.sin(ph) * sc.tau; }
      re[m] = a; im[m] = b;
    }
    sp.push({ re, im });
  }
  return sp;
}
/**
 * Grid the spokes (angles k·range/n, range in degrees) on an N×N Cartesian k-grid of spacing dk = 1/2 (field of view 2) by linear interpolation
 * in radius and angle, using F(−k) = conj F(k), and invert by FFT. Returns {out (N×N image, row 0 on top), mag (k-grid |F|, −1 where unmeasured)}.
 */
export function fourierRecon(sp, range, N, nR, dw) {
  const n = sp.length, dth = n > 0 ? (range / n) * (PI / 180) : 1, full = range >= 179.5;
  const re = new Float64Array(N * N), im = new Float64Array(N * N), mag = new Float64Array(N * N).fill(-1);
  for (let b = 0; b < N; b++) for (let a = 0; a < N; a++) {
    const kx = (a - N / 2) * 0.5, ky = (b - N / 2) * 0.5, rho = Math.hypot(kx, ky);
    if (rho >= (nR - 1) * dw) continue;
    let phi = Math.atan2(ky, kx), conj = false;
    if (phi < 0) { phi += PI; conj = true; }
    if (phi >= PI) phi -= PI;
    const pos = phi / dth, k0 = Math.floor(pos), fr = pos - k0, mm = rho / dw, m0 = Math.floor(mm), fm = mm - m0;
    const get = (kk, cj) => { const S = sp[kk]; const r = S.re[m0] * (1 - fm) + S.re[m0 + 1] * fm, i = S.im[m0] * (1 - fm) + S.im[m0 + 1] * fm; return [r, cj ? -i : i]; };
    let val = null;
    if (k0 < n - 1) { const A = get(k0), B = get(k0 + 1); val = [A[0] * (1 - fr) + B[0] * fr, A[1] * (1 - fr) + B[1] * fr]; }
    else if (k0 === n - 1) {
      if (full) { const A = get(k0), B = get(0, true); val = [A[0] * (1 - fr) + B[0] * fr, A[1] * (1 - fr) + B[1] * fr]; }
      else if (fr < 0.5) val = get(k0);
    }
    if (!val) continue;
    if (conj) val = [val[0], -val[1]];
    mag[b * N + a] = Math.hypot(val[0], val[1]);
    const q = (-2 * PI + (2 * PI) / N) * (kx + ky), cr = Math.cos(q), ci = Math.sin(q), idx = b * N + a;
    re[idx] = val[0] * cr - val[1] * ci; im[idx] = val[0] * ci + val[1] * cr;
  }
  fft2d(re, im, N, N, true);
  const out = new Float64Array(N * N), sc = N * N * 0.25;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) out[(N - 1 - j) * N + i] = ((i + j) % 2 ? -1 : 1) * re[j * N + i] * sc;
  return { out, mag };
}

// ---------------------------------------------------------------- equiangular fan beam (3.9)
// Source at angle β+90° on a circle of radius D; ray at fan angle γ from the central ray lies on the line θ = β + γ, s = D sin γ.
export function fanScan(D, nb, ng, margin = 1.05) {
  const gm = Math.asin(Math.min(0.99, (margin) / D)), dg = (2 * gm) / ng;
  return { D, nb, ng, gm, dg, beta: (k) => (2 * PI * k) / nb, gam: (j) => -gm + (j + 0.5) * dg };
}
export function fanSino(E, F) {
  const R = new Float64Array(F.nb * F.ng);
  for (let b = 0; b < F.nb; b++) for (let j = 0; j < F.ng; j++) { const g = F.gam(j); R[b * F.ng + j] = ellProj(E, F.beta(b) + g, F.D * Math.sin(g)); }
  return R;
}
/** Direct weighted filtered back-projection of equiangular fan data over the full circle (Kak–Slaney §3.4.2). */
export function fanFBP(R, F, W, H, nViews = F.nb) {
  const { D, ng, dg, gm } = F, Q = new Float64Array(F.nb * ng);
  const g = new Float64Array(2 * ng);
  for (let n = -ng + 1; n < ng; n++) { const x = n * dg, hv = n === 0 ? 1 / (4 * dg * dg) : n % 2 === 0 ? 0 : -1 / (PI * PI * n * n * dg * dg), f = n === 0 ? 1 : (x / Math.sin(x)) ** 2; g[n + ng] = 0.5 * f * hv; }
  const wt = Float64Array.from({ length: ng }, (_, m) => D * Math.cos(F.gam(m)));
  for (let b = 0; b < nViews; b++) for (let j = 0; j < ng; j++) { let a = 0; for (let m = 0; m < ng; m++) a += R[b * ng + m] * wt[m] * g[j - m + ng]; Q[b * ng + j] = a * dg; }
  const out = new Float64Array(W * H), cb = new Float64Array(nViews), sb = new Float64Array(nViews);
  for (let b = 0; b < nViews; b++) { const ph = F.beta(b) + PI / 2; cb[b] = Math.cos(ph); sb[b] = Math.sin(ph); }
  for (let jj = 0; jj < H; jj++) for (let ii = 0; ii < W; ii++) {
    const x = -1 + ((ii + 0.5) * 2) / W, y = 1 - ((jj + 0.5) * 2) / H; let acc = 0;
    for (let b = 0; b < nViews; b++) {
      const wx = x - D * cb[b], wy = y - D * sb[b], L2 = wx * wx + wy * wy, gp = Math.atan2(-cb[b] * wy + sb[b] * wx, -cb[b] * wx - sb[b] * wy);
      const u = (gp + gm) / dg - 0.5, m = Math.floor(u), a = u - m; if (m < 0 || m >= ng - 1) continue;
      acc += (Q[b * ng + m] * (1 - a) + Q[b * ng + m + 1] * a) / L2;
    }
    out[jj * W + ii] = (acc * 2 * PI) / nViews;
  }
  return out;
}
/** Rebin fan data to a parallel sinogram (nA views over [0, π), nd samples over ±half) by bilinear interpolation in (β, γ). */
export function fanRebin(R, F, sc) {
  const out = new Float64Array(sc.nA * sc.nd);
  for (let k = 0; k < sc.nA; k++) for (let j = 0; j < sc.nd; j++) {
    const s = sc.sOf(j), sg = s / F.D; if (Math.abs(sg) >= 1) continue;
    const g = Math.asin(sg); let bt = sc.th[k] - g; bt = ((bt % (2 * PI)) + 2 * PI) % (2 * PI);
    const u = bt / ((2 * PI) / F.nb), b0 = Math.floor(u), fb = u - b0, v = (g + F.gm) / F.dg - 0.5, g0 = Math.floor(v), fg = v - g0;
    if (g0 < 0 || g0 >= F.ng - 1) continue;
    const at = (b, gg) => R[(b % F.nb) * F.ng + gg];
    out[k * sc.nd + j] = (1 - fb) * ((1 - fg) * at(b0, g0) + fg * at(b0, g0 + 1)) + fb * ((1 - fg) * at(b0 + 1, g0) + fg * at(b0 + 1, g0 + 1));
  }
  return out;
}
/** FBP evaluated at arbitrary points (x, y) from an already filtered sinogram q (for cheap noise / resolution measurements). */
export function fbpAt(q, sc, pts) {
  const out = new Float64Array(pts.length), dth = PI / sc.nA, nd = sc.nd, inv = 1 / sc.tau;
  pts.forEach(([x, y], p) => {
    let acc = 0;
    for (let k = 0; k < sc.nA; k++) {
      const u = (x * sc.cs[k] + y * sc.sn[k] + sc.half) * inv - 0.5, m = Math.floor(u), a = u - m;
      if (m < -1 || m >= nd) continue;
      acc += (m >= 0 ? q[k * nd + m] : 0) * (1 - a) + (m + 1 < nd ? q[k * nd + m + 1] : 0) * a;
    }
    out[p] = acc * dth;
  });
  return out;
}
