// Computational Geometry — Chapter 3 (segment intersection and polygons): helpers shared by ch03*.js.
// Points are [x, y]; polygons are vertex lists (counter-clockwise unless stated); segments are [x1, y1, x2, y2].
export * from './ch02.shared.js';
import { cross, hull2 } from './ch02.shared.js';

// ------------------------------------------------------------------ small geometry
/** Proper crossing of open segments ab and cd: returns [x, y, t, u] or null (touching/collinear → null). */
export function segCross(a, b, c, d, eps = 1e-10) {
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-14) return null;
  const qx = c[0] - a[0], qy = c[1] - a[1];
  const t = (qx * s[1] - qy * s[0]) / den, u = (qx * r[1] - qy * r[0]) / den;
  if (t <= eps || t >= 1 - eps || u <= eps || u >= 1 - eps) return null;
  return [a[0] + t * r[0], a[1] + t * r[1], t, u];
}
/** Point in polygon (even–odd rule); boundary points may go either way. */
export function pip(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
export const area2 = (poly) => { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; } return a; };
/** Polygon with counter-clockwise orientation (a reversed copy if needed). */
export const ccwPoly = (poly) => (area2(poly) < 0 ? poly.slice().reverse() : poly.slice());
/** Is the closed vertex list a simple polygon (no two non-adjacent edges meet)? */
export function isSimplePoly(poly) {
  const n = poly.length;
  if (n < 3) return false;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const adj = j === i + 1 || (i === 0 && j === n - 1);
    const a = poly[i], b = poly[(i + 1) % n], c = poly[j], d = poly[(j + 1) % n];
    if (adj) {
      const [p, q, r] = j === i + 1 ? [a, b, d] : [b, a, c];
      if (Math.abs(cross(q, p, r)) < 1e-12 && (p[0] - q[0]) * (r[0] - q[0]) + (p[1] - q[1]) * (r[1] - q[1]) > 0) return false;
      continue;
    }
    if (segCross(a, b, c, d, 1e-12)) return false;
    for (const [P, X, Y] of [[a, c, d], [b, c, d], [c, a, b], [d, a, b]]) {
      if (Math.abs(cross(X, Y, P)) < 1e-12) {
        const t = ((P[0] - X[0]) * (Y[0] - X[0]) + (P[1] - X[1]) * (Y[1] - X[1])) / (((Y[0] - X[0]) ** 2 + (Y[1] - X[1]) ** 2) || 1);
        if (t > -1e-9 && t < 1 + 1e-9) return false;
      }
    }
  }
  return true;
}
/** Clip convex polygon `poly` to the half-plane a·x + b·y ≤ c. */
export function clipHalf(poly, a, b, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], fp = a * p[0] + b * p[1] - c, fq = a * q[0] + b * q[1] - c;
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
  }
  return out;
}
/** Intersection of two convex polygons by successive half-plane clipping (both counter-clockwise). */
export function clipConvex(P, Q) {
  let out = P;
  for (let i = 0; i < Q.length && out.length; i++) {
    const a = Q[i], b = Q[(i + 1) % Q.length], dx = b[0] - a[0], dy = b[1] - a[1];
    out = clipHalf(out, dy, -dx, dy * a[0] - dx * a[1]);
  }
  return out;
}
/** Voronoi cells of the sites inside the box [x0,y0,x1,y1] (list of CCW polygons). */
export function voronoiCells(sites, box) {
  const [x0, y0, x1, y1] = box;
  return sites.map((p, i) => {
    let cell = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    sites.forEach((q, j) => { if (j !== i) cell = clipHalf(cell, q[0] - p[0], q[1] - p[1], (q[0] * q[0] + q[1] * q[1] - p[0] * p[0] - p[1] * p[1]) / 2); });
    return cell;
  });
}
/** Minkowski sum of two convex polygons: the hull of all pairwise sums (CCW point list). */
export function minkowski(A, B) {
  const pts = [];
  for (const a of A) for (const b of B) pts.push([a[0] + b[0], a[1] + b[1]]);
  return hull2(pts).map((i) => pts[i]);
}
/** Do two convex polygons overlap in a set of positive area (separating-axis test; touching counts as disjoint)? */
export function convexOverlap(A, B, eps = 1e-9) {
  for (const P of [A, B]) for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], nx = b[1] - a[1], ny = a[0] - b[0];
    let m1 = Infinity, M1 = -Infinity, m2 = Infinity, M2 = -Infinity;
    for (const p of A) { const t = nx * p[0] + ny * p[1]; m1 = Math.min(m1, t); M1 = Math.max(M1, t); }
    for (const p of B) { const t = nx * p[0] + ny * p[1]; m2 = Math.min(m2, t); M2 = Math.max(M2, t); }
    if (M1 <= m2 + eps || M2 <= m1 + eps) return false;
  }
  return true;
}

// ------------------------------------------------------------------ plane sweep (Bentley–Ottmann)
/**
 * Plane sweep over segments [x1,y1,x2,y2] in general position (no vertical segments, no three through a point).
 * `cross: false` makes the sweep ignore crossings (only endpoints are events): the status can then go stale.
 * Returns {found: [{x,y,i,j}], frames, cmp, tests, events}. Each frame:
 * {kind: 'start'|'insert'|'delete'|'cross'|'end', x, y, seg, pair, status (bottom→top), queue [{x,y,type,seg,pair}], found, tested [i,j][], cmp, tests, stale}
 */
export function sweepRun(segs, { frames: want = true, cross: doCross = true } = {}) {
  const S = segs.map((s) => { let [a, b, c, d] = s; if (a > c || (a === c && b > d)) [a, b, c, d] = [c, d, a, b]; return { a: [a, b], b: [c, d] }; });
  const yAt = (i, x) => { const s = S[i], dx = s.b[0] - s.a[0]; return Math.abs(dx) < 1e-12 ? s.a[1] : s.a[1] + ((s.b[1] - s.a[1]) * (x - s.a[0])) / dx; };
  const slope = (i) => { const s = S[i], dx = s.b[0] - s.a[0]; return Math.abs(dx) < 1e-12 ? 1e9 : (s.b[1] - s.a[1]) / dx; };
  const rank = { L: 0, X: 1, R: 2 };
  const evLess = (e, f) => e.x < f.x - 1e-12 || (Math.abs(e.x - f.x) <= 1e-12 && (e.y < f.y - 1e-12 || (Math.abs(e.y - f.y) <= 1e-12 && rank[e.type] < rank[f.type])));
  const Q = [];
  const push = (e) => { let lo = 0, hi = Q.length; while (lo < hi) { const m = (lo + hi) >> 1; if (evLess(Q[m], e)) lo = m + 1; else hi = m; } Q.splice(lo, 0, e); };
  S.forEach((s, i) => { push({ x: s.a[0], y: s.a[1], type: 'L', seg: i }); push({ x: s.b[0], y: s.b[1], type: 'R', seg: i }); });
  const T = [], found = [], seen = new Set(), out = [];
  let cmp = 0, tests = 0, events = 0, tested = [];
  const lg = (n) => Math.max(1, Math.ceil(Math.log2(n + 1)));
  const snap = (o) => {
    if (!want) return;
    let stale = false;
    if (T.length > 1) { const xs = o.x + 1e-7; for (let k = 0; k + 1 < T.length; k++) if (yAt(T[k], xs) > yAt(T[k + 1], xs) + 1e-9) stale = true; }
    out.push({ ...o, status: T.slice(), queue: Q.map((e) => ({ x: e.x, y: e.y, type: e.type, seg: e.seg, pair: e.pair })), found: found.slice(), tested: tested.slice(), cmp, tests, stale });
  };
  const test = (i, j, cur) => {
    if (i == null || j == null) return;
    tests++; tested.push([i, j]);
    if (!doCross) return;
    const X = segCross(S[i].a, S[i].b, S[j].a, S[j].b); if (!X) return;
    const key = Math.min(i, j) + ',' + Math.max(i, j); if (seen.has(key)) return;
    if (X[0] < cur.x - 1e-12 || (Math.abs(X[0] - cur.x) <= 1e-12 && X[1] <= cur.y)) return;
    seen.add(key); push({ x: X[0], y: X[1], type: 'X', pair: [i, j] });
  };
  snap({ kind: 'start', x: Q.length ? Q[0].x - 0.01 : 0, y: 0 });
  while (Q.length) {
    const e = Q.shift(); events++; tested = [];
    if (e.type === 'L') {
      let lo = 0, hi = T.length;
      while (lo < hi) { const m = (lo + hi) >> 1; cmp++; const yy = yAt(T[m], e.x); if (yy < e.y - 1e-12 || (Math.abs(yy - e.y) <= 1e-12 && slope(T[m]) < slope(e.seg))) lo = m + 1; else hi = m; }
      T.splice(lo, 0, e.seg);
      test(T[lo - 1], e.seg, e); test(e.seg, T[lo + 1], e);
      snap({ kind: 'insert', x: e.x, y: e.y, seg: e.seg });
    } else if (e.type === 'R') {
      const k = T.indexOf(e.seg); cmp += lg(T.length);
      if (k >= 0) { T.splice(k, 1); test(T[k - 1], T[k], e); }
      snap({ kind: 'delete', x: e.x, y: e.y, seg: e.seg });
    } else {
      const [i, j] = e.pair, a = T.indexOf(i), b = T.indexOf(j); cmp += 2;
      found.push({ x: e.x, y: e.y, i, j });
      if (a >= 0 && b >= 0 && Math.abs(a - b) === 1) {
        const lo = Math.min(a, b); [T[lo], T[lo + 1]] = [T[lo + 1], T[lo]];
        test(T[lo - 1], T[lo], e); test(T[lo + 1], T[lo + 2], e);
      }
      snap({ kind: 'cross', x: e.x, y: e.y, pair: e.pair });
    }
  }
  snap({ kind: 'end', x: out.length ? out[out.length - 1].x + 0.01 : 0, y: 0 });
  return { found, frames: out, cmp, tests, events };
}
/** All proper crossings of a segment set by brute force (the answer a sweep must reproduce). */
export function bruteCross(segs) {
  const res = [];
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const s = segs[i], t = segs[j], X = segCross([s[0], s[1]], [s[2], s[3]], [t[0], t[1]], [t[2], t[3]]);
    if (X) res.push({ x: X[0], y: X[1], i, j });
  }
  return res;
}

// ------------------------------------------------------------------ doubly connected edge list
/**
 * Build a DCEL from vertices V ([x,y]) and undirected edges E ([a,b]) of a connected plane graph.
 * Half-edge 2e runs a→b, 2e+1 runs b→a (twin = h^1). Returns {H: [{origin, dest, twin, next, prev, face}], faces: [{edges, verts, area, outer}], out}.
 * Faces lie to the LEFT of their half-edges; the unbounded face has negative signed area.
 */
export function buildDCEL(V, E) {
  const H = [];
  E.forEach(([a, b]) => { H.push({ origin: a, dest: b }); H.push({ origin: b, dest: a }); });
  H.forEach((h, i) => { h.twin = i ^ 1; h.id = i; });
  const out = V.map(() => []);
  H.forEach((h, i) => out[h.origin].push(i));
  const ang = (v, h) => Math.atan2(V[H[h].dest][1] - V[v][1], V[H[h].dest][0] - V[v][0]);
  out.forEach((list, v) => list.sort((p, q) => ang(v, p) - ang(v, q)));
  H.forEach((h) => { const t = h.twin, lst = out[H[t].origin], k = lst.indexOf(t); h.next = lst[(k - 1 + lst.length) % lst.length]; });
  H.forEach((h, i) => { H[h.next].prev = i; });
  const faces = [];
  H.forEach((h, i) => {
    if (h.face != null) return;
    const f = faces.length, edges = []; let c = i;
    do { H[c].face = f; edges.push(c); c = H[c].next; } while (c !== i && edges.length <= H.length);
    const verts = edges.map((e) => H[e].origin), pts = verts.map((v) => V[v]);
    const ar = area2(pts) / 2;
    faces.push({ edges, verts, area: ar, outer: ar < 0 });
  });
  return { H, faces, out };
}

// ------------------------------------------------------------------ visibility inside a simple polygon
/** Does the segment pq lie inside the (closed) simple polygon: it crosses no edge properly and its pieces between touch points are inside. */
export function segInside(p, q, poly) {
  const ts = [0, 1], L = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 || 1;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if (segCross(p, q, a, b, 1e-9)) return false;
    for (const P of [a, b]) {
      const t = ((P[0] - p[0]) * (q[0] - p[0]) + (P[1] - p[1]) * (q[1] - p[1])) / L;
      if (t > 1e-9 && t < 1 - 1e-9 && Math.abs(cross(p, q, P)) < 1e-9 * Math.sqrt(L)) ts.push(t);
    }
  }
  ts.sort((x, y) => x - y);
  for (let k = 0; k + 1 < ts.length; k++) {
    if (ts[k + 1] - ts[k] < 1e-9) continue;
    const m = (ts[k] + ts[k + 1]) / 2;
    if (!pip([p[0] + m * (q[0] - p[0]), p[1] + m * (q[1] - p[1])], poly)) return false;
  }
  return true;
}
/** Visibility polygon of g (a vertex `vi` of the simple CCW polygon, or any interior point with vi = −1): angular sweep over the vertex directions. */
export function visPoly(g, poly, vi = -1) {
  const n = poly.length;
  const base = vi >= 0 ? Math.atan2(poly[(vi + 1) % n][1] - g[1], poly[(vi + 1) % n][0] - g[0]) : -Math.PI;
  const rel = (t) => { let r = t - base; while (r < -1e-12) r += 2 * Math.PI; while (r >= 2 * Math.PI - 1e-12) r -= 2 * Math.PI; return Math.max(0, r); };
  const dirs = [];
  for (const P of poly) { if (Math.hypot(P[0] - g[0], P[1] - g[1]) > 1e-9) { const t = Math.atan2(P[1] - g[1], P[0] - g[0]); for (const d of [-1e-7, 0, 1e-7]) dirs.push(t + d); } }
  if (vi >= 0) { dirs.push(base); dirs.push(Math.atan2(poly[(vi + n - 1) % n][1] - g[1], poly[(vi + n - 1) % n][0] - g[0])); }
  const ang = dirs.map((t) => ({ t, r: rel(t) })).sort((a, b) => a.r - b.r);
  const pts = [];
  for (const { t } of ang) {
    const dx = Math.cos(t), dy = Math.sin(t);
    if (!pip([g[0] + 1e-6 * dx, g[1] + 1e-6 * dy], poly)) continue;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-14) continue;
      const qx = a[0] - g[0], qy = a[1] - g[1], s = (qx * ey - qy * ex) / den, u = (qx * dy - qy * dx) / den;
      if (s > 1e-7 && u >= -1e-9 && u <= 1 + 1e-9 && s < best) best = s;
    }
    if (isFinite(best)) pts.push([g[0] + best * dx, g[1] + best * dy]);
  }
  const res = [];
  for (const p of pts) { const q = res[res.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6) res.push(p); }
  return res;
}

// ------------------------------------------------------------------ ear clipping
/** Is vertex k of the CCW list (restricted to the index list `ids`) an ear: convex, and its triangle holds no other vertex? */
export function isEar(poly, ids, k) {
  const m = ids.length, a = poly[ids[(k + m - 1) % m]], b = poly[ids[k]], c = poly[ids[(k + 1) % m]];
  if (cross(a, b, c) <= 1e-12) return false;
  for (let t = 0; t < m; t++) {
    if (t === k || t === (k + 1) % m || t === (k + m - 1) % m) continue;
    const p = poly[ids[t]];
    if (cross(a, b, p) >= -1e-12 && cross(b, c, p) >= -1e-12 && cross(c, a, p) >= -1e-12) return false;
  }
  return true;
}
/** Ear clipping of a CCW polygon. Frames: remaining vertex ids, all current ears, two non-overlapping ears, the clipped triangles. */
export function earTrace(poly) {
  const ids = poly.map((_, i) => i), tris = [], diags = [], frames = [];
  const push = (o) => frames.push({ ids: ids.slice(), tris: tris.slice(), diags: diags.slice(), ...o });
  let stuck = false;
  while (ids.length > 3) {
    const ears = ids.map((_, k) => k).filter((k) => isEar(poly, ids, k));
    if (!ears.length) { stuck = true; push({ ears: [], stuck: true }); break; }
    const k = ears[0], m = ids.length, tri = (e) => [poly[ids[(e + m - 1) % m]], poly[ids[e]], poly[ids[(e + 1) % m]]];
    const two = ears.find((e) => e !== k && !convexOverlap(tri(k), tri(e)));
    const a = ids[(k + m - 1) % m], b = ids[k], c = ids[(k + 1) % m];
    push({ ears: ears.map((e) => ids[e]), ear: b, tri: [a, b, c], twoEars: two == null ? [b] : [b, ids[two]] });
    tris.push([a, b, c]); diags.push([a, c]); ids.splice(k, 1);
  }
  if (!stuck) { tris.push(ids.slice()); push({ ears: [], done: true }); }
  return { frames, tris, stuck, n: poly.length };
}
/** Triangulation of a CCW simple polygon as triangles of vertex indices, or null when no ear exists (the polygon is not simple). */
export function triangulate(poly) { const T = earTrace(poly); return T.stuck ? null : T.tris; }

// ------------------------------------------------------------------ y-monotone partition (de Berg et al., Alg. 3.1) and stack triangulation
const above = (P, i, j) => P[i][1] > P[j][1] || (P[i][1] === P[j][1] && P[i][0] < P[j][0]); // i is above j
/** Vertex type of every vertex of a CCW polygon: 'start' | 'end' | 'split' | 'merge' | 'regular'. */
export function vertexTypes(P) {
  const n = P.length;
  return P.map((_, i) => {
    const p = (i + n - 1) % n, q = (i + 1) % n, convex = cross(P[p], P[i], P[q]) > 0;
    const pa = above(P, p, i), qa = above(P, q, i);
    if (!pa && !qa) return convex ? 'start' : 'split';
    if (pa && qa) return convex ? 'end' : 'merge';
    return 'regular';
  });
}
/** Sweep from the top: {types, order, frames, diags}. Each frame records the status (left edges with their helpers) and the diagonals so far. */
export function makeMonotone(P) {
  const n = P.length, types = vertexTypes(P);
  const order = P.map((_, i) => i).sort((i, j) => (above(P, i, j) ? -1 : 1));
  const helper = new Array(n).fill(null);
  let Tst = []; const diags = [], frames = [];
  const edgeX = (e, y) => { const a = P[e], b = P[(e + 1) % n]; return Math.abs(b[1] - a[1]) < 1e-12 ? Math.min(a[0], b[0]) : a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]); };
  const leftOf = (v) => { let best = null, bx = -Infinity; for (const e of Tst) { const x = edgeX(e, P[v][1]); if (x < P[v][0] && x > bx) { bx = x; best = e; } } return best; };
  const addDiag = (a, b) => { if (a !== b && !diags.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) diags.push([a, b]); };
  const snap = (v, note, dg) => frames.push({ v, type: types[v], y: P[v][1], status: Tst.map((e) => ({ e, h: helper[e] })), diags: diags.slice(), newDiag: dg || null, note });
  frames.push({ v: null, type: null, y: Infinity, status: [], diags: [], newDiag: null, note: 'The sweep line starts above the polygon; its status holds the edges with the interior to their right.' });
  for (const v of order) {
    const prev = (v + n - 1) % n, t = types[v]; let note = '', dg = null;
    const fixPrev = () => { if (helper[prev] != null && types[helper[prev]] === 'merge') { addDiag(v, helper[prev]); dg = [v, helper[prev]]; note += `The helper of the edge above is merge vertex ${helper[prev]}, so the diagonal ${v}–${helper[prev]} is added. `; } Tst = Tst.filter((e) => e !== prev); };
    const fixLeft = () => { const e = leftOf(v); if (e != null) { if (types[helper[e]] === 'merge') { addDiag(v, helper[e]); dg = [v, helper[e]]; note += `The helper of the edge on the left is merge vertex ${helper[e]}: diagonal ${v}–${helper[e]}. `; } helper[e] = v; } };
    if (t === 'start') { Tst.push(v); helper[v] = v; note = 'Start vertex: its edge enters the status, with itself as helper.'; }
    else if (t === 'end') { fixPrev(); note = 'End vertex. ' + note + 'The edge above leaves the status.'; }
    else if (t === 'split') {
      const e = leftOf(v);
      if (e != null) { addDiag(v, helper[e]); dg = [v, helper[e]]; note = `Split vertex: the diagonal ${v}–${helper[e]} joins it to the helper of the edge on its left; it becomes that helper.`; helper[e] = v; }
      Tst.push(v); helper[v] = v;
    } else if (t === 'merge') { fixPrev(); fixLeft(); note = 'Merge vertex. ' + note + 'It becomes the helper of the edge on its left.'; }
    else if (above(P, prev, v)) { fixPrev(); Tst.push(v); helper[v] = v; note = 'Regular vertex on the left chain. ' + note + 'The lower edge replaces the upper one.'; }
    else { fixLeft(); note = 'Regular vertex on the right chain. ' + note + 'It becomes the helper of the edge on its left.'; }
    snap(v, note, dg);
  }
  return { types, order, frames, diags };
}
/** Split a polygon by non-crossing diagonals into its bounded faces (CCW lists of vertex indices). */
export function splitByDiagonals(P, diags) {
  const n = P.length, E = [];
  for (let i = 0; i < n; i++) E.push([i, (i + 1) % n]);
  diags.forEach((d) => E.push(d));
  return buildDCEL(P, E).faces.filter((f) => !f.outer).map((f) => f.verts);
}
/** Stack triangulation of a y-monotone polygon given as CCW vertex ids into P: {diags, frames, chain, sorted, tris}. */
export function monotoneTriangulate(P, ids) {
  const n = ids.length;
  const sorted = ids.slice().sort((a, b) => (above(P, a, b) ? -1 : 1));
  const top = sorted[0], bot = sorted[n - 1], chain = { [top]: 'T', [bot]: 'B' };
  let k = ids.indexOf(top);
  for (;;) { k = (k + 1) % n; if (ids[k] === bot) break; chain[ids[k]] = 'L'; }
  ids.forEach((v) => { if (!chain[v]) chain[v] = 'R'; });
  const diags = [], frames = [], stack = [sorted[0], sorted[1]];
  const rec = (j, note) => frames.push({ stack: stack.slice(), j: j == null ? null : sorted[j], diags: diags.slice(), note });
  rec(1, 'Push the two highest vertices.');
  for (let j = 2; j < n - 1; j++) {
    const u = sorted[j], tp = stack[stack.length - 1];
    if (chain[u] !== chain[tp]) {
      const popped = stack.slice(); stack.length = 0;
      popped.slice(1).forEach((w) => diags.push([u, w]));
      stack.push(popped[popped.length - 1], u);
      rec(j, 'The vertex is on the opposite chain of the stack top: it sees every stacked vertex, so connect it to all of them.');
    } else {
      let last = stack.pop(), added = 0;
      while (stack.length) {
        const a = stack[stack.length - 1], cr = cross(P[a], P[last], P[u]);
        if (!(chain[u] === 'L' ? cr > 1e-12 : cr < -1e-12)) break;
        diags.push([u, a]); added++; last = stack.pop();
      }
      stack.push(last, u);
      rec(j, added ? `Same chain: popped ${added} vertex${added > 1 ? 'es' : ''} while the diagonal to the new vertex stays inside.` : 'Same chain, but the diagonal would leave the polygon: nothing to cut.');
    }
  }
  const un = sorted[n - 1];
  stack.slice(1, -1).forEach((w) => diags.push([un, w]));
  stack.length = 0; stack.push(...[]);
  rec(n - 1, 'The lowest vertex is joined to all remaining stacked vertices except the first and last.');
  const V = ids.map((v) => P[v]), E = ids.map((_, i) => [i, (i + 1) % n]);
  diags.forEach(([a, b]) => E.push([ids.indexOf(a), ids.indexOf(b)]));
  const tris = buildDCEL(V, E).faces.filter((f) => !f.outer).map((f) => f.verts.map((i) => ids[i]));
  return { diags, frames, chain, sorted, tris };
}

// ------------------------------------------------------------------ shortest paths in a small dense graph
/** Dijkstra on n nodes with adjacency lists adj[i] = [[j, w], …]; frames record settled nodes, tentative distances and the node being relaxed. */
export function dijkstraTrace(n, adj, s) {
  const dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false), frames = [];
  dist[s] = 0;
  const snap = (o) => frames.push({ dist: dist.slice(), prev: prev.slice(), done: done.slice(), ...o });
  snap({ kind: 'init', cur: s });
  for (;;) {
    let u = -1; for (let i = 0; i < n; i++) if (!done[i] && isFinite(dist[i]) && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0) break;
    done[u] = true; snap({ kind: 'extract', cur: u });
    for (const [w, c] of adj[u]) if (!done[w] && dist[u] + c < dist[w] - 1e-12) { dist[w] = dist[u] + c; prev[w] = u; snap({ kind: 'relax', cur: u, to: w }); }
  }
  snap({ kind: 'done', cur: -1 });
  return { dist, prev, frames };
}
