// Exact point-ray / piecewise-constant pixel model for the algebraic examples.
// Grid-crossing integration is independent of the shared marching approximation.
import { makeScan } from './ch03.shared.js';

export function exactPixelSystemAudit(n, nA, nd, half = 1.42) {
  const sc = makeScan(nA, nd, half), rows = [], h = 2 / n;
  for (let k = 0; k < nA; k++) for (let j = 0; j < nd; j++) {
    const s = sc.sOf(j), p = [s * sc.cs[k], s * sc.sn[k]], d = [-sc.sn[k], sc.cs[k]];
    let lo = -Infinity, hi = Infinity;
    for (let a = 0; a < 2; a++) {
      if (Math.abs(d[a]) < 1e-14) { if (p[a] < -1 || p[a] > 1) { lo = 1; hi = 0; } }
      else { const t0 = (-1 - p[a]) / d[a], t1 = (1 - p[a]) / d[a]; lo = Math.max(lo, Math.min(t0, t1)); hi = Math.min(hi, Math.max(t0, t1)); }
    }
    const cuts = [lo, hi], acc = new Map();
    if (hi > lo) {
      for (let a = 0; a < 2; a++) if (Math.abs(d[a]) >= 1e-14) for (let q = 1; q < n; q++) {
        const t = (-1 + q * h - p[a]) / d[a]; if (t > lo && t < hi) cuts.push(t);
      }
      cuts.sort((a, b) => a - b);
      for (let q = 1; q < cuts.length; q++) {
        const w = cuts[q] - cuts[q - 1]; if (w <= 1e-14) continue;
        const t = (cuts[q] + cuts[q - 1]) / 2;
        const ix = Math.min(n - 1, Math.max(0, Math.floor((p[0] + t * d[0] + 1) / h)));
        const iy = Math.min(n - 1, Math.max(0, Math.floor((1 - p[1] - t * d[1]) / h)));
        const z = iy * n + ix; acc.set(z, (acc.get(z) || 0) + w);
      }
    }
    const idx = Int32Array.from(acc.keys()), val = Float64Array.from(acc.values());
    rows.push({ idx, val, view: k, ss: val.reduce((a, b) => a + b * b, 0), sum: val.reduce((a, b) => a + b, 0) });
  }
  return { n, nA, nd, sc, rows, N: n * n };
}

export function kaczmarzPathAudit(normals, b, start, count, relaxation) {
  let x = [...start]; const path = [x];
  for (let k = 0; k < count; k++) {
    const i = k % normals.length, a = normals[i], ss = a[0] ** 2 + a[1] ** 2;
    if (ss > 0) { const t = relaxation * (b[i] - a[0] * x[0] - a[1] * x[1]) / ss; x = [x[0] + t * a[0], x[1] + t * a[1]]; }
    path.push(x);
  }
  return path;
}

export function squareExtentAudit(points) {
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const r = Math.max(2.6, (Math.max(...xs) - Math.min(...xs)) * .58, (Math.max(...ys) - Math.min(...ys)) * .58);
  return { x: [cx - r, cx + r], y: [cy - r, cy + r] };
}

// Clip the infinite equation a.x=b to the displayed square, rather than drawing
// a fixed length which can truncate or leave the view after overrelaxed steps.
export function equationSegmentAudit(a, b, bounds) {
  const ss = a[0] ** 2 + a[1] ** 2; if (!(ss > 0)) return null;
  const p = a.map(x => x * b / ss), d = [-a[1], a[0]];
  let lo = -Infinity, hi = Infinity;
  for (let k = 0; k < 2; k++) {
    const limits = k ? bounds.y : bounds.x;
    if (Math.abs(d[k]) < 1e-14) { if (p[k] < limits[0] || p[k] > limits[1]) return null; }
    else { const u = (limits[0] - p[k]) / d[k], w = (limits[1] - p[k]) / d[k]; lo = Math.max(lo, Math.min(u, w)); hi = Math.min(hi, Math.max(u, w)); }
  }
  return hi >= lo ? [p.map((q, k) => q + lo * d[k]), p.map((q, k) => q + hi * d[k])] : null;
}
