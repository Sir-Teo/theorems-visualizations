// Exact zero-state unit-step formulas for the underdamped, unit-DC-gain model.
export function secondOrderValue(z, wn, t) {
  if (t <= 0) return 0;
  const q = Math.sqrt(1 - z * z), u = wn * t;
  return 1 - Math.exp(-z * u) * (Math.cos(q * u) + z / q * Math.sin(q * u));
}

export function secondOrderMetrics(z, wn, tol = 0.02) {
  if (!(z > 0 && z < 1 && wn > 0)) return null;
  const wd = wn * Math.sqrt(1 - z * z), sigma = z * wn;
  const root = (fn, lo, hi) => {
    for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2; if (fn(m) > 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  };
  const crossing = (level) => {
    let hi = 1 / wn;
    while (secondOrderValue(z, wn, hi) < level) hi *= 1.5;
    // The first rise is monotone up to pi/wd. Keep the bracket on that rise.
    hi = Math.min(hi, Math.PI / wd);
    return root(t => secondOrderValue(z, wn, t) - level, 0, hi);
  };
  const t10 = crossing(0.1), t90 = crossing(0.9);
  // Extrema occur at k*pi/wd and have error magnitude exp(-sigma*k*pi/wd).
  // The last extremum outside the band brackets the final entrance with its successor.
  const k = Math.max(0, Math.floor(wd * Math.log(1 / tol) / (sigma * Math.PI)));
  const ts = root(t => tol - Math.abs(1 - secondOrderValue(z, wn, t)), k * Math.PI / wd, (k + 1) * Math.PI / wd);
  return { t10, t90, tr: t90 - t10, ts, Mp: Math.exp(-sigma * Math.PI / wd), tp: Math.PI / wd,
    envelope: Math.log(1 / (tol * Math.sqrt(1 - z * z))) / sigma };
}

export function laggedSecondOrderValue(z, wn, p, t) {
  const sigma = z * wn, wd = wn * Math.sqrt(1 - z * z);
  const B = -wn * wn / (p * p - 2 * sigma * p + wn * wn), C = -1 - B;
  return 1 + B * Math.exp(-p * t) + Math.exp(-sigma * t) * (C * Math.cos(wd * t) + (p * B + sigma * C) / wd * Math.sin(wd * t));
}

// A causal first-order lag averages y2(t-u). Lipschitz continuity gives |y3-y2| <= sup|y2'|/p.
export function lagErrorBound(z, wn, p) {
  return wn * Math.exp(-z * Math.acos(z) / Math.sqrt(1 - z * z)) / p;
}
