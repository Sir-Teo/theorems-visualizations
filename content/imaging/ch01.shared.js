// Medical Imaging — Chapter 1 shared helpers (plain named exports): images as Float64Array(W*H) with row 0 at the top,
// point spread functions, FFT and direct convolution, Shepp–Logan and other test objects, Poisson sampling, Airy pattern,
// and a raster helper that draws an image on a stage whose data window is [0,W]×[0,H].

let MM = null;
/** Bind the runtime math library (v.M): call `bindM(v.M)` at the top of every viz. */
export function bindM(M) { MM = M; }
const fft2 = (a, b) => MM.fft2(a, b), ifft2 = (a, b) => MM.ifft2(a, b);

export const TAU = 2 * Math.PI;
export const FWHM_K = 2 * Math.sqrt(2 * Math.LN2); // FWHM = 2.3548 σ for a Gaussian

// ---------------------------------------------------------------- small utilities
export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const fx = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d).replace('-', '−') : '—');
export const pct = (x, d = 1) => `${fx(100 * x, d)}\\%`;
const nextPow2 = (n) => { let p = 1; while (p < n) p *= 2; return p; };
export const mean = (a) => { let s = 0; for (const x of a) s += x; return s / a.length; };
export const sd = (a) => { const m = mean(a); let s = 0; for (const x of a) s += (x - m) ** 2; return Math.sqrt(s / Math.max(1, a.length - 1)); };

// ---------------------------------------------------------------- showing an image on a stage
const ids = new WeakMap(); let nextId = 1;
const idOf = (a) => { if (!ids.has(a)) ids.set(a, nextId++); return ids.get(a); };
/**
 * Draw an image (Float64Array, W×H, row 0 on top) in grey levels between lo and hi on a stage with window [0,W]×[0,H].
 * o: {lo, hi, smooth (bilinear), id (layer id), rect, gamma, extra (cache-key suffix)}. Cached while `data` is the same array.
 */
export function showImage(s, data, W, H, o = {}) {
  const lo = o.lo ?? 0, hi = o.hi ?? 1, sm = o.smooth, g = o.gamma ?? 1;
  const at = (i, j) => data[clamp(j, 0, H - 1) * W + clamp(i, 0, W - 1)];
  s.raster((x, y) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return null;
    let val;
    if (sm) {
      const u = x - 0.5, w = H - y - 0.5, i = Math.floor(u), j = Math.floor(w), a = u - i, b = w - j;
      val = (1 - b) * ((1 - a) * at(i, j) + a * at(i + 1, j)) + b * ((1 - a) * at(i, j + 1) + a * at(i + 1, j + 1));
    } else val = data[(H - 1 - Math.floor(y)) * W + Math.floor(x)];
    let t = clamp((val - lo) / (hi - lo), 0, 1);
    if (g !== 1) t = Math.pow(t, g);
    const c = Math.round(255 * t);
    return [c, c, c];
  }, { res: 1, id: o.id || 'img', key: `${idOf(data)}|${lo}|${hi}|${sm ? 1 : 0}|${g}|${o.extra || ''}`, rect: o.rect });
}
/** Frame around an image drawn in the muted colour. */
export function frame(s, W, H) { s.rect(0, 0, W, H, { color: 'muted', width: 1, fill: false, stroke: true, alpha: 0.7 }); }

// ---------------------------------------------------------------- point spread functions (odd square kernels, sum 1)
/**
 * type: 'gauss' (w = FWHM in pixels), 'disc' (w = diameter), 'motion' (w = length, ang in degrees), 'box' (w = side),
 * 'delta' (no blur). Returns {K, a, c} with a Float64Array(K*K), c = centre index.
 */
export function psfKernel(type, w, ang = 0) {
  const sig = w / FWHM_K;
  const ext = type === 'gauss' ? 3.3 * sig + 1 : type === 'delta' ? 0 : w / 2 + 1.5;
  const K = clamp(2 * Math.ceil(ext) + 1, 3, 45), c = (K - 1) / 2, a = new Float64Array(K * K);
  const S = 5, th = (ang * Math.PI) / 180, cs = Math.cos(th), sn = Math.sin(th);
  for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) {
    let v = 0;
    if (type === 'delta') v = i === c && j === c ? 1 : 0;
    else if (type === 'gauss') v = Math.exp(-((i - c) ** 2 + (j - c) ** 2) / (2 * Math.max(sig, 0.25) ** 2));
    else {
      let cnt = 0;
      for (let q = 0; q < S; q++) for (let p = 0; p < S; p++) {
        const x = i - c + (p + 0.5) / S - 0.5, y = j - c + (q + 0.5) / S - 0.5;
        if (type === 'disc') cnt += x * x + y * y <= (w / 2) ** 2 ? 1 : 0;
        else if (type === 'box') cnt += Math.abs(x) <= w / 2 && Math.abs(y) <= w / 2 ? 1 : 0;
        else { const u = x * cs - y * sn, t = x * sn + y * cs; cnt += Math.abs(u) <= w / 2 && Math.abs(t) <= 0.5 ? 1 : 0; }
      }
      v = cnt / (S * S);
    }
    a[j * K + i] = v;
  }
  let s = 0; for (const x of a) s += x;
  if (s <= 0) a[c * K + c] = s = 1;
  for (let i = 0; i < a.length; i++) a[i] /= s;
  return { K, a, c };
}

// ---------------------------------------------------------------- convolution
/** Real image → complex 2-D DFT as rows (re, im), size W×H (any size). */
export function dft2(img, W, H) {
  const re = [], im = [];
  for (let j = 0; j < H; j++) { re.push(Array.from(img.subarray(j * W, (j + 1) * W))); im.push(new Array(W).fill(0)); }
  fft2(re, im);
  return { re, im };
}
/**
 * Convolution by the FFT. circ = false: linear convolution, zero-padded and cropped to W×H (image zero outside);
 * circ = true: periodic. The kernel is centred on its middle sample.
 */
export function convFFT(img, W, H, ker, circ = false) {
  const { K, a, c } = ker;
  const PW = circ ? W : nextPow2(W + K - 1), PH = circ ? H : nextPow2(H + K - 1);
  const mk = () => Array.from({ length: PH }, () => new Float64Array(PW));
  const ar = mk(), ai = mk(), br = mk(), bi = mk();
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) ar[j][i] = img[j * W + i];
  for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) br[(j - c + PH) % PH][(i - c + PW) % PW] += a[j * K + i];
  fft2(ar, ai); fft2(br, bi);
  for (let j = 0; j < PH; j++) for (let i = 0; i < PW; i++) {
    const r = ar[j][i] * br[j][i] - ai[j][i] * bi[j][i], m = ar[j][i] * bi[j][i] + ai[j][i] * br[j][i];
    ar[j][i] = r; ai[j][i] = m;
  }
  ifft2(ar, ai);
  const out = new Float64Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) out[j * W + i] = ar[j][i];
  return out;
}
/** Direct (definition) convolution value at pixel (x, y): Σ img(x−u, y−v)·k(u, v). */
export function convAt(img, W, H, ker, x, y, circ = false) {
  const { K, a, c } = ker; let s = 0;
  for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) {
    let xx = x - (i - c), yy = y - (j - c);
    if (circ) { xx = ((xx % W) + W) % W; yy = ((yy % H) + H) % H; } else if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
    s += img[yy * W + xx] * a[j * K + i];
  }
  return s;
}
/** Largest |FFT − direct| over a set of pixels (default: 500 pseudo-random ones plus the four corners). */
export function convCheck(img, W, H, ker, out, circ = false, n = 500) {
  let m = 0, st = 12345;
  const rnd = () => { st = (Math.imul(st, 1103515245) + 12345) >>> 0; return st / 4294967296; };
  const pts = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]];
  for (let k = 0; k < n; k++) pts.push([Math.floor(rnd() * W), Math.floor(rnd() * H)]);
  for (const [x, y] of pts) m = Math.max(m, Math.abs(convAt(img, W, H, ker, x, y, circ) - out[y * W + x]));
  return m;
}
/** MTF of a kernel along the x-axis at spatial frequency f (cycles per pixel): |Σ k e^{−2πi f x}| (kernel sums to 1). */
export function mtfX(ker, f) {
  const { K, a, c } = ker; let re = 0, im = 0;
  for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) { const p = -TAU * f * (i - c), w = a[j * K + i]; re += w * Math.cos(p); im += w * Math.sin(p); }
  return Math.hypot(re, im);
}
/** |H(fx, fy)| of a kernel, cycles per pixel. */
export function mtf2(ker, fxx, fyy) {
  const { K, a, c } = ker; let re = 0, im = 0;
  for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) { const p = -TAU * (fxx * (i - c) + fyy * (j - c)), w = a[j * K + i]; re += w * Math.cos(p); im += w * Math.sin(p); }
  return Math.hypot(re, im);
}

// ---------------------------------------------------------------- test objects
// Modified Shepp–Logan phantom (Toft's contrast-enhanced version of the Shepp–Logan head phantom): rows are
// [additive intensity, semi-axis a (x), semi-axis b (y), centre x0, centre y0, rotation φ in degrees], in a box [−1,1]².
export const SHEPP_LOGAN = [
  [1, 0.69, 0.92, 0, 0, 0], [-0.8, 0.6624, 0.874, 0, -0.0184, 0], [-0.2, 0.11, 0.31, 0.22, 0, -18],
  [-0.2, 0.16, 0.41, -0.22, 0, 18], [0.1, 0.21, 0.25, 0, 0.35, 0], [0.1, 0.046, 0.046, 0, 0.1, 0],
  [0.1, 0.046, 0.046, 0, -0.1, 0], [0.1, 0.046, 0.023, -0.08, -0.605, 0], [0.1, 0.023, 0.023, 0, -0.606, 0],
  [0.1, 0.023, 0.046, 0.06, -0.605, 0],
];
/** Value of the phantom at (x, y) in [−1,1]² (y up). */
export function slAt(x, y) {
  let v = 0;
  for (const [A, a, b, x0, y0, ph] of SHEPP_LOGAN) {
    const t = (ph * Math.PI) / 180, dx = x - x0, dy = y - y0, u = dx * Math.cos(t) + dy * Math.sin(t), w = -dx * Math.sin(t) + dy * Math.cos(t);
    if ((u / a) ** 2 + (w / b) ** 2 <= 1) v += A;
  }
  return v;
}
/** Render f(x, y) (window [−L,L]², y up) on a W×H grid with ss×ss supersampling (pixel-area average). */
export function render(f, W, H, L = 1, ss = 3) {
  const out = new Float64Array(W * H), hx = (2 * L) / W, hy = (2 * L) / H;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    let s = 0;
    for (let q = 0; q < ss; q++) for (let p = 0; p < ss; p++) s += f(-L + (i + (p + 0.5) / ss) * hx, L - (j + (q + 0.5) / ss) * hy);
    out[j * W + i] = s / (ss * ss);
  }
  return out;
}
/** Shepp–Logan phantom occupying a fraction `fill` of the field of view. */
export function sheppLogan(W, H, fill = 0.82, ss = 3) { return render((x, y) => slAt(x / fill, y / fill), W, H, 1, ss); }
/** Siemens star with n spokes (binary, radius r0) on a mid-grey surround; (x, y) in the unit window. */
export function starAt(x, y, n, r0 = 0.97) {
  const r = Math.hypot(x, y); if (r > r0) return 0.5;
  const th = Math.atan2(y, x), k = Math.floor((n * th) / Math.PI);
  return (k & 1) === 0 ? 1 : 0;
}
/** Resolution bar target on a W×H image: three-bar groups of width w px, top row vertical bars, bottom row horizontal bars. */
export function barTarget(W, H, widths = [6, 5, 4, 3, 2, 1]) {
  const out = new Float64Array(W * H);
  const total = widths.reduce((s, w) => s + 5 * w, 0) + 4 * (widths.length - 1), x0 = Math.round((W - total) / 2), hh = Math.round(H * 0.22);
  const row1 = Math.round(H * 0.2), row2 = Math.round(H * 0.58);
  let x = x0;
  for (const w of widths) {
    const span = 5 * w;
    for (let b = 0; b < 3; b++) for (let i = 0; i < w; i++) {
      for (let j = 0; j < hh; j++) out[(row1 + j) * W + x + 2 * b * w + i] = 1;      // vertical bars
      const yy = row2 + 2 * b * w + i;
      for (let k = 0; k < span; k++) out[yy * W + x + k] = 1;                         // horizontal bars
    }
    x += span + 4;
  }
  return out;
}

// ---------------------------------------------------------------- counting statistics
/** Poisson(λ) value from a fixed uniform u and its normal score z = Φ⁻¹(u): exact inversion below 40 counts, normal approximation above. */
export function poissonFrom(lam, u, z) {
  if (lam <= 0) return 0;
  if (lam >= 40) return Math.max(0, Math.round(lam + Math.sqrt(lam) * z));
  let p = Math.exp(-lam), c = p, k = 0;
  while (u > c && k < 400) { k++; p *= lam / k; c += p; }
  return k;
}
/** Fixed noise fields for reproducible noise that changes smoothly with its parameters: uniforms u and normal scores z. */
export function noiseField(M, r, n) {
  const nd = M.dist.normal(0, 1), u = new Float64Array(n), z = new Float64Array(n);
  for (let i = 0; i < n; i++) { u[i] = Math.min(1 - 1e-9, Math.max(1e-9, r())); z[i] = nd.quantile(u[i]); }
  return { u, z };
}

// ---------------------------------------------------------------- Airy pattern (circular aperture, incoherent point source)
/** Bessel J1(x) by the (spectrally accurate) midpoint rule on (1/π)∫₀^π cos(τ − x sin τ) dτ. */
export function besselJ1(x) { const n = 96; let s = 0; for (let i = 0; i < n; i++) { const t = ((i + 0.5) * Math.PI) / n; s += Math.cos(t - x * Math.sin(t)); } return s / n; }
/** Airy intensity [2J1(πρ)/(πρ)]² with ρ = r/(λN) (N = f-number); peak 1, first zero at ρ = 1.22. */
export function airy(rho) { const x = Math.PI * Math.abs(rho); if (x < 1e-6) return 1; const j = (2 * besselJ1(x)) / x; return j * j; }
