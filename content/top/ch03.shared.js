// Topology — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
//
//  1. Re-exports of the earlier chapters' helpers (finite topologies, exact subsets of ℝ, PL maps, gluing).
//  2. Pixel-grid connectivity: components of a drawn region, shortest path inside it (used as a numerical
//     stand-in for "connected / path-connected" on regions drawn in the plane).
//  3. Plane sets built from discs and segments, with exact tests for "does a line meet it" and
//     "which pieces touch" (so separations are decided exactly, not by pixels).
//  4. The topologist's sine curve, the comb, and the Cantor set (exact interval data).
export * from './ch02.shared.js';
export * from './ch01.shared.js';

// ------------------------------------------------------------------ 2. pixel grids
/** Sample inFn on an N×M grid over [x0,x1]×[y0,y1]; returns {N, M, a: Uint8Array, cx(i), cy(j), ij(x,y)}. */
export function sampleGrid(inFn, [x0, x1], [y0, y1], N, M) {
  const a = new Uint8Array(N * M), dx = (x1 - x0) / N, dy = (y1 - y0) / M;
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) a[j * N + i] = inFn(x0 + (i + 0.5) * dx, y0 + (j + 0.5) * dy) ? 1 : 0;
  return {
    N, M, a, dx, dy,
    cx: (i) => x0 + (i + 0.5) * dx, cy: (j) => y0 + (j + 0.5) * dy,
    ij: (x, y) => [Math.min(N - 1, Math.max(0, Math.floor((x - x0) / dx))), Math.min(M - 1, Math.max(0, Math.floor((y - y0) / dy)))],
  };
}
/** Label 8-connected components of the cells with a = 1 (labels 1…k, 0 = outside). Returns {lab: Int32Array, k, sizes}. */
export function labelGrid(G) {
  const { N, M, a } = G, lab = new Int32Array(N * M), sizes = [0];
  let k = 0;
  for (let s = 0; s < N * M; s++) {
    if (!a[s] || lab[s]) continue;
    k++; let n = 0; const st = [s]; lab[s] = k;
    while (st.length) {
      const c = st.pop(); n++; const ci = c % N, cj = (c - ci) / N;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= M) continue;
        const t = j * N + i; if (a[t] && !lab[t]) { lab[t] = k; st.push(t); }
      }
    }
    sizes.push(n);
  }
  return { lab, k, sizes };
}
/** Breadth-first shortest 8-connected path between two cells of the region (null if none); returns data-coordinate points. */
export function gridPath(G, p, q) {
  const { N, M, a } = G, [pi, pj] = G.ij(p[0], p[1]), [qi, qj] = G.ij(q[0], q[1]);
  const s = pj * N + pi, t = qj * N + qi;
  if (!a[s] || !a[t]) return null;
  const prev = new Int32Array(N * M).fill(-2); prev[s] = -1; const Q = [s]; let h = 0;
  while (h < Q.length && prev[t] === -2) {
    const c = Q[h++], ci = c % N, cj = (c - ci) / N;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= M) continue;
      const u = j * N + i; if (a[u] && prev[u] === -2) { prev[u] = c; Q.push(u); }
    }
  }
  if (prev[t] === -2) return null;
  const out = []; for (let c = t; c !== -1; c = prev[c]) out.push([G.cx(c % N), G.cy((c - (c % N)) / N)]);
  out.reverse(); out[0] = [p[0], p[1]]; out[out.length - 1] = [q[0], q[1]];
  return out;
}
/** Remove corners from a pixel path: greedy straight-segment shortcuts that stay in the region (sampled). */
export function shortcut(pts, inFn) {
  if (pts.length < 3) return pts;
  const ok = (a, b) => { const n = 24; for (let k = 0; k <= n; k++) if (!inFn(a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n)) return false; return true; };
  const out = [pts[0]]; let i = 0;
  while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !ok(pts[i], pts[j])) j--; out.push(pts[j]); i = j; }
  return out;
}

// ------------------------------------------------------------------ 3. plane sets from discs and segments
// shape: {t:'disc', c:[x,y], r, open} or {t:'seg', p:[x,y], q:[x,y]}   (a closed segment)
const EPS = 1e-9;
const hyp = Math.hypot;
export function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
  const t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0;
  return hyp(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
export function inShape(S, x, y) {
  if (S.t === 'disc') { const d = hyp(x - S.c[0], y - S.c[1]); return S.open ? d < S.r - EPS : d <= S.r + EPS; }
  return segDist([x, y], S.p, S.q) < 1.6e-2;
}
export const inShapes = (L, x, y) => L.some((S) => inShape(S, x, y));
/** Do the closed segments pq and rs meet? */
export function segSeg(p, q, r, s) {
  const o = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const on = (a, b, c) => Math.min(a[0], b[0]) - EPS <= c[0] && c[0] <= Math.max(a[0], b[0]) + EPS && Math.min(a[1], b[1]) - EPS <= c[1] && c[1] <= Math.max(a[1], b[1]) + EPS;
  const d1 = o(p, q, r), d2 = o(p, q, s), d3 = o(r, s, p), d4 = o(r, s, q);
  if (((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) && ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS))) return true;
  return (Math.abs(d1) <= EPS && on(p, q, r)) || (Math.abs(d2) <= EPS && on(p, q, s)) || (Math.abs(d3) <= EPS && on(r, s, p)) || (Math.abs(d4) <= EPS && on(r, s, q));
}
/** Do two shapes share a point (closed/open handled exactly for tangent discs)? */
export function touches(A, B) {
  if (A.t === 'seg' && B.t === 'seg') return segSeg(A.p, A.q, B.p, B.q);
  if (A.t === 'seg') [A, B] = [B, A];
  if (B.t === 'disc') { const d = hyp(A.c[0] - B.c[0], A.c[1] - B.c[1]), s = A.r + B.r; return A.open || B.open ? d < s - EPS : d <= s + EPS; }
  const d = segDist(A.c, B.p, B.q);
  return A.open ? d < A.r - EPS : d <= A.r + EPS;
}
/** Connected components of a union of shapes: {comp: [index per shape], k}. */
export function shapeComponents(L) {
  const par = L.map((_, i) => i), find = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (touches(L[i], L[j])) par[find(i)] = find(j);
  const ids = new Map(); const comp = L.map((_, i) => { const r = find(i); if (!ids.has(r)) ids.set(r, ids.size); return ids.get(r); });
  return { comp, k: ids.size };
}
/** Which shapes does the line n·z = c meet?  (n unit normal.) */
export function lineMeets(S, n, c) {
  if (S.t === 'disc') { const d = Math.abs(n[0] * S.c[0] + n[1] * S.c[1] - c); return S.open ? d < S.r - EPS : d <= S.r + EPS; }
  const a = n[0] * S.p[0] + n[1] * S.p[1] - c, b = n[0] * S.q[0] + n[1] * S.q[1] - c;
  return a * b <= EPS * EPS || Math.abs(a) < EPS || Math.abs(b) < EPS;
}
/** Is any point of the shape strictly on the positive (sign=+1) or negative side of the line n·z = c? */
export function onSide(S, n, c, sign) {
  if (S.t === 'disc') { const d = sign * (n[0] * S.c[0] + n[1] * S.c[1] - c); return d + S.r > EPS; }
  return sign * (n[0] * S.p[0] + n[1] * S.p[1] - c) > EPS || sign * (n[0] * S.q[0] + n[1] * S.q[1] - c) > EPS;
}

// ------------------------------------------------------------------ 4. classical examples
/** Points of the topologist's sine curve y = sin(1/x), x ∈ [x0, x1], sampled finely near 0 (adaptive in the phase 1/x). */
export function sineArc(x0, x1, perTurn = 28) {
  const pts = [], ph0 = 1 / x1, ph1 = 1 / x0, n = Math.max(2, Math.ceil(((ph1 - ph0) / (2 * Math.PI)) * perTurn));
  for (let k = n; k >= 0; k--) { const ph = ph0 + ((ph1 - ph0) * k) / n; pts.push([1 / ph, Math.sin(ph)]); }
  return pts;
}
/** Arc length of y = sin(1/x) on [x, 1] (Simpson in the phase u = 1/x: ds = sqrt(u⁻⁴ + cos²u) du). */
export function sineLength(x) {
  const u1 = 1 / x, n = Math.ceil(u1 * 40) + 200; let s = 0;
  const f = (u) => Math.sqrt(1 / (u * u * u * u) + Math.cos(u) * Math.cos(u)); // dx = du/u², dy = cos u du
  const h = (u1 - 1) / n; for (let k = 0; k < n; k++) { const a = 1 + k * h; s += (h / 6) * (f(a) + 4 * f(a + h / 2) + f(a + h)); }
  return s;
}
/** Teeth of the comb: x = 0 and x = 1/n, n = 1…nMax, each [0,1]; plus the base [0,1]×{0}. */
export const combTeeth = (nMax = 60) => [0, ...Array.from({ length: nMax }, (_, i) => 1 / (i + 1))];
/** Cantor set: intervals remaining after `level` steps. */
export function cantorLevel(level) {
  let I = [[0, 1]];
  for (let k = 0; k < level; k++) I = I.flatMap(([a, b]) => { const t = (b - a) / 3; return [[a, a + t], [b - t, b]]; });
  return I;
}
/** Snap x ∈ [0,1] to the nearest endpoint of the level-L Cantor intervals (an actual point of the Cantor set). */
export function snapCantor(x, L = 7) {
  let best = 0, bd = 9;
  for (const [a, b] of cantorLevel(L)) for (const e of [a, b]) { const d = Math.abs(e - x); if (d < bd) { bd = d; best = e; } }
  return best;
}
/** First level at which the Cantor points a < b are separated, with the removed middle gap (g0, g1) between them. */
export function cantorSplit(a, b) {
  let lo = 0, hi = 1;
  for (let k = 0; k < 40; k++) {
    const t = (hi - lo) / 3, g0 = lo + t, g1 = hi - t;
    if (a <= g0 + 1e-12 && b >= g1 - 1e-12) return { level: k + 1, g0, g1 };
    if (b <= g0 + 1e-12) hi = g0; else lo = g1;
  }
  return null;
}
