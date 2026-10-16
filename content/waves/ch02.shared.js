// Waves & Optics — Chapter 2 shared helpers (modes, Bessel zeros, sine series, small complex arithmetic).
// Plain named exports, imported by ch02.js and ch02-b.js.

export const TAU = 2 * Math.PI;

/** Bessel function J_m(x) (integer m ≥ 0) from Bessel's integral, (1/π)∫₀^π cos(mτ − x sin τ) dτ, by Simpson's rule. */
export function besselJ(m, x) {
  const n = 2 * Math.max(24, Math.ceil(Math.abs(x) * 1.2) + 12);
  const h = Math.PI / n;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const t = i * h, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    s += w * Math.cos(m * t - x * Math.sin(t));
  }
  return (s * h) / (3 * Math.PI);
}

/** The first `count` positive zeros of J_m, found by scanning for sign changes (every grid point tested) and bisecting. */
export function besselZeros(m, count) {
  const out = [];
  const step = 0.1;
  let a = m === 0 ? 0.5 : m + 0.05, fa = besselJ(m, a);
  while (out.length < count && a < 80) {
    const b = a + step, fb = besselJ(m, b);
    if (fa === 0) out.push(a);
    else if (fa * fb < 0) {
      let lo = a, hi = b, flo = fa;
      for (let i = 0; i < 50; i++) {
        const mid = 0.5 * (lo + hi), fm = besselJ(m, mid);
        if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; }
      }
      out.push(0.5 * (lo + hi));
    }
    a = b; fa = fb;
  }
  return out;
}

/** Cache of Bessel zeros: BZ(m, n) is the n-th zero (n ≥ 1) of J_m. */
const zcache = new Map();
export function BZ(m, n) {
  if (!zcache.has(m)) zcache.set(m, besselZeros(m, 12));
  return zcache.get(m)[n - 1];
}

/** Sine-series coefficients b_n = 2∫₀¹ u(x) sin(nπx) dx, n = 1..N, of samples u[0..K] on a uniform grid of [0, 1]. */
export function sineCoeffs(u, N) {
  const K = u.length - 1, h = 1 / K, b = new Float64Array(N + 1);
  for (let n = 1; n <= N; n++) {
    let s = 0;
    for (let i = 1; i < K; i++) s += u[i] * Math.sin(n * Math.PI * i * h);
    b[n] = 2 * s * h;
  }
  return b;
}

/** Tiny complex arithmetic on [re, im] pairs (for the driven damped string). */
export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
export const csin = (z) => [Math.sin(z[0]) * Math.cosh(z[1]), Math.cos(z[0]) * Math.sinh(z[1])];
export const ccos = (z) => [Math.cos(z[0]) * Math.cosh(z[1]), -Math.sin(z[0]) * Math.sinh(z[1])];
export const csqrt = (z) => { const r = Math.hypot(z[0], z[1]), a = Math.sqrt((r + z[0]) / 2), b = Math.sqrt(Math.max(0, (r - z[0]) / 2)); return [a, z[1] < 0 ? -b : b]; };

/** A theme-aware diverging colour map q ∈ [−1, 1] → [r, g, b] (panel colour → red / blue). Call inside the draw function. */
export function diverging(v) {
  const P = v.rgb('panel'), R = v.rgb('red'), B = v.rgb('blue');
  return (q) => {
    const t = q > 1 ? 1 : q < -1 ? -1 : q || 0, C = t >= 0 ? R : B, a = Math.pow(Math.abs(t), 0.85);
    return [P[0] + (C[0] - P[0]) * a, P[1] + (C[1] - P[1]) * a, P[2] + (C[2] - P[2]) * a];
  };
}

/** A fixed end: a hatched wall at x (data units), from y0 to y1, on the side `side` (+1 right, −1 left). */
export function wall(s, x, y0, y1, side = 1, w = 0.03) {
  s.rect(x, y0, x + side * w, y1, { fill: 'muted', fillAlpha: 0.12, hatch: 'muted', hatchGap: 5, stroke: false });
  s.line(x, y0, x, y1, { color: 'muted', width: 2 });
}
