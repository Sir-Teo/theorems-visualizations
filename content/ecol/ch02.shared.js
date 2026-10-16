// Ecology — Chapter 2: helpers shared by ch02.js and ch02-b.js (plain functions, no data files).

/** Poisson(lam) draw with a seeded generator r = v.rng(seed): Knuth's product for small lam, normal approximation for lam ≥ 40. */
export function poisson(r, lam) {
  if (!(lam > 0)) return 0;
  if (lam < 40) {
    const L = Math.exp(-lam);
    let k = 0, p = 1;
    do { k++; p *= r(); } while (p > L);
    return k - 1;
  }
  return Math.max(0, Math.round(lam + Math.sqrt(lam) * r.normal()));
}

/** Gamma(shape k, scale th) draw (Marsaglia–Tsang; shape < 1 by the boosting trick). */
export function gammaDraw(r, k, th) {
  if (k < 1) return gammaDraw(r, k + 1, th) * Math.pow(Math.max(r(), 1e-300), 1 / k);
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, vv;
    do { x = r.normal(); vv = 1 + c * x; } while (vv <= 0);
    vv = vv * vv * vv;
    const u = r();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - vv + Math.log(vv))) return d * vv * th;
  }
}

/** Wilson 95 % interval for k successes in n trials. */
export function wilson(k, n) {
  if (!n) return [0, 1];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

/** Ordinary least squares y = a + b x with standard error of the slope. */
export function ols(xs, ys) {
  const n = xs.length;
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; }
  mx /= n; my /= n;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; }
  const b = sxy / sxx, a = my - b * mx;
  let sse = 0;
  for (let i = 0; i < n; i++) sse += (ys[i] - a - b * xs[i]) ** 2;
  return { a, b, n, r: sxy / Math.sqrt(sxx * syy), r2: (sxy * sxy) / (sxx * syy), se: n > 2 ? Math.sqrt(sse / (n - 2) / sxx) : NaN };
}
