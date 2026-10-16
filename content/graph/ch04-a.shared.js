// Graph Theory (Diestel) — Chapter 4, part A (§§4.1–4.2): helpers shared by ch04-a.js and ch04-a2.js.
// Re-exports the chapter 1–3 toolbox and adds a small plane-geometry kernel:
//
//  1. segments: intersections, distance to a segment, crossing / touching detection for straight-line drawings
//  2. planarize: cut a set of polylines at their crossings, so that regions can be counted for ANY drawing
//  3. faceStruct: faces of a plane graph from half-edges (angular order), with nesting of components, point location
//  4. "PG" plane graphs with bent edges (polygonal arcs) and a router that adds an edge through a face
//  5. drawing and editing helpers for the v.graph kit (guard against crossings)
export * from './ch03.shared.js';
import { K } from './ch03.shared.js';

const EPS = 1e-9;
export const FILLS = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
export const VIEW = [0, 10, 0, 6.4];
export const crs = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

// ================================================================ 1. segments
/** Intersection of segments pq and rs (single point): {t, u, x, y} or null (parallel segments give null). */
export function segInter(p, q, r, s) {
  const d1x = q[0] - p[0], d1y = q[1] - p[1], d2x = s[0] - r[0], d2y = s[1] - r[1];
  const den = d1x * d2y - d1y * d2x;
  if (Math.abs(den) < 1e-12) return null;
  const wx = r[0] - p[0], wy = r[1] - p[1];
  const t = (wx * d2y - wy * d2x) / den, u = (wx * d1y - wy * d1x) / den;
  if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
  return { t, u, x: p[0] + t * d1x, y: p[1] + t * d1y };
}
/** Distance from point p to segment ab, and the parameter of the closest point. */
export function distSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
  const t = L < 1e-18 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
  return { d: Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy), t, x: a[0] + t * dx, y: a[1] + t * dy };
}
/**
 * Defects of a straight-line drawing (P points, E index pairs): crossings of edges without common end, vertices closer than
 * tol to a foreign edge, and edges leaving a common vertex in the same direction. [{type, i, j, x, y}]
 */
export function crossPairs(P, E, tol = 1e-6) {
  const out = [];
  for (let i = 0; i < E.length; i++) {
    const [a, b] = E[i];
    for (let j = i + 1; j < E.length; j++) {
      const [c, d] = E[j];
      const sh = a === c ? [a, b, d] : a === d ? [a, b, c] : b === c ? [b, a, d] : b === d ? [b, a, c] : null;
      if (sh) {
        const o = P[sh[0]], u = P[sh[1]], w = P[sh[2]];
        if (Math.abs(crs(o, u, w)) < 1e-9 && (u[0] - o[0]) * (w[0] - o[0]) + (u[1] - o[1]) * (w[1] - o[1]) > 0) out.push({ type: 'overlap', i, j, x: o[0], y: o[1] });
        continue;
      }
      const h = segInter(P[a], P[b], P[c], P[d]);
      if (h) out.push({ type: 'cross', i, j, x: h.x, y: h.y });
    }
    for (let v = 0; v < P.length; v++) {
      if (v === a || v === b) continue;
      const d = distSeg(P[v], P[a], P[b]);
      if (d.d < tol && d.t > -1e-12 && d.t < 1 + 1e-12) out.push({ type: 'touch', i, j: -1, v, x: P[v][0], y: P[v][1] });
    }
  }
  return out;
}

// ================================================================ 2. planarize
/** Cut the edges at all crossings (and at vertices lying on them): a plane graph {P, E, orig (original edge per new edge)}. */
export function planarize(P, E, tol = 1e-6) {
  const Q = P.map((p) => p.slice()), cuts = E.map(() => []), keyOf = new Map();
  const key = (x, y) => Math.round(x * 1e6) + ',' + Math.round(y * 1e6);
  P.forEach((p, i) => { if (!keyOf.has(key(p[0], p[1]))) keyOf.set(key(p[0], p[1]), i); });
  const mk = (x, y) => { const k = key(x, y); if (keyOf.has(k)) return keyOf.get(k); Q.push([x, y]); keyOf.set(k, Q.length - 1); return Q.length - 1; };
  for (let i = 0; i < E.length; i++) {
    for (let j = i + 1; j < E.length; j++) {
      const [a, b] = E[i], [c, d] = E[j];
      if (a === c || a === d || b === c || b === d) continue;
      const h = segInter(P[a], P[b], P[c], P[d]);
      if (h) { const v = mk(h.x, h.y); cuts[i].push([h.t, v]); cuts[j].push([h.u, v]); }
    }
    for (let v = 0; v < P.length; v++) {
      if (v === E[i][0] || v === E[i][1]) continue;
      const d = distSeg(P[v], P[E[i][0]], P[E[i][1]]);
      if (d.d < tol) cuts[i].push([d.t, v]);
    }
  }
  const E2 = [], orig = [], seen = new Set();
  E.forEach(([a, b], k) => {
    const seq = [[0, a], ...cuts[k].sort((x, y) => x[0] - y[0]), [1, b]];
    for (let i = 0; i + 1 < seq.length; i++) {
      const u = seq[i][1], w = seq[i + 1][1];
      if (u === w) continue;
      const kk = u < w ? u + ',' + w : w + ',' + u;
      if (seen.has(kk)) continue; seen.add(kk); E2.push([u, w]); orig.push(k);
    }
  });
  return { P: Q, E: E2, orig };
}

// ================================================================ 3. faces
export function winding(poly, x, y) {
  let w = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    if (a[1] <= y) { if (b[1] > y && crs(a, b, [x, y]) > 0) w++; } else if (b[1] <= y && crs(a, b, [x, y]) < 0) w--;
  }
  return w;
}
export const polyArea = (poly) => { let s = 0; for (let i = 0, n = poly.length; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
/**
 * Faces of a plane graph drawn with straight edges (P points, E index pairs, no crossings). faces[0] is the outer face.
 * Each face: {walks: [{hes, poly, area}], rings, edges:Set, verts:Set, len (edge traversals on its boundary), bounded}.
 * Half-edge h = 2k + d runs along edge k (d = 0: a→b, d = 1: b→a) and has face faceOfHe[h] on its left.
 * Also: comps (number of connected components, isolated vertices included), locate(x, y) → face index.
 */
export function faceStruct(P, E) {
  const n = P.length, m = E.length, out = Array.from({ length: n }, () => []);
  E.forEach(([a, b], k) => { out[a].push(2 * k); out[b].push(2 * k + 1); });
  const org = (h) => E[h >> 1][h & 1], dst = (h) => E[h >> 1][1 - (h & 1)];
  const ang = (h) => { const a = P[org(h)], b = P[dst(h)]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  const pos = new Int32Array(2 * m);
  for (let v = 0; v < n; v++) { out[v].sort((h, g) => ang(h) - ang(g)); out[v].forEach((h, i) => (pos[h] = i)); }
  const next = (h) => { const t = h ^ 1, L = out[org(t)]; return L[(pos[t] - 1 + L.length) % L.length]; };
  const uf = Array.from({ length: n }, (_, i) => i), find = (x) => { while (uf[x] !== x) x = uf[x] = uf[uf[x]]; return x; };
  E.forEach(([a, b]) => { uf[find(a)] = find(b); });
  let comps = 0; for (let v = 0; v < n; v++) if (find(v) === v) comps++;
  const seen = new Uint8Array(2 * m), walks = [];
  for (let h0 = 0; h0 < 2 * m; h0++) {
    if (seen[h0]) continue;
    const hes = []; let h = h0;
    do { seen[h] = 1; hes.push(h); h = next(h); } while (h !== h0 && hes.length <= 2 * m);
    const poly = hes.map((x) => P[org(x)]);
    walks.push({ hes, poly, area: polyArea(poly), comp: find(org(h0)) });
  }
  const faces = [{ walks: [], bounded: false }];
  const pos_ = walks.filter((w) => w.area > 1e-9);
  pos_.forEach((w) => faces.push({ walks: [w], bounded: true, own: w }));
  for (const w of walks) {
    if (w.area > 1e-9) continue;
    const v0 = P[org(w.hes[0])]; let best = 0, ba = Infinity;
    faces.forEach((f, i) => { if (i && f.own.comp !== w.comp && f.own.area < ba && winding(f.own.poly, v0[0], v0[1]) !== 0) { best = i; ba = f.own.area; } });
    faces[best].walks.push(w);
  }
  const faceOfHe = new Int32Array(2 * m);
  faces.forEach((f, i) => {
    f.rings = f.walks.map((w) => w.poly); f.edges = new Set(); f.verts = new Set(); f.len = 0;
    for (const w of f.walks) for (const h of w.hes) { faceOfHe[h] = i; f.edges.add(h >> 1); f.verts.add(org(h)); f.len++; }
  });
  const locate = (x, y) => {
    for (let i = 1; i < faces.length; i++) { let s = 0; for (const w of faces[i].walks) s += winding(w.poly, x, y); if (s !== 0) return i; }
    return 0;
  };
  return { P, E, faces, faceOfHe, comps, locate, n, m, org, dst };
}
/** A point deep inside face i (grid search maximising the distance to the drawing). */
export function innerPoint(F, i, box = VIEW) {
  const f = F.faces[i]; if (f.ip) return f.ip;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const pts = f.rings.flat(); for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  if (i === 0) { x0 = box[0] + 0.2; x1 = box[1] - 0.2; y0 = box[2] + 0.2; y1 = box[3] - 0.2; }
  let best = null, bd = -1; const N = 26;
  for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) {
    const x = x0 + ((x1 - x0) * (a + 0.5)) / (N + 1), y = y0 + ((y1 - y0) * (b + 0.5)) / (N + 1);
    if (F.locate(x, y) !== i) continue;
    let d = Infinity; for (const [p, q] of F.E) d = Math.min(d, distSeg([x, y], F.P[p], F.P[q]).d);
    if (d > bd) { bd = d; best = [x, y]; }
  }
  return (f.ip = best || [(x0 + x1) / 2, (y0 + y1) / 2]);
}
/** Fill the faces of a face structure (colorOf(i) → palette name or null). The outer face gets the whole view minus the drawing. */
export function paintFaces(s, F, o = {}) {
  const box = o.box || VIEW, rect = [[box[0], box[2]], [box[1], box[2]], [box[1], box[3]], [box[0], box[3]]];
  F.faces.forEach((f, i) => {
    const c = o.colorOf ? o.colorOf(i) : i ? FILLS[(i - 1) % FILLS.length] : null;
    if (!c) return;
    s.rings(i ? f.rings : [rect, ...f.rings], { fill: c, fillAlpha: o.alpha ?? 0.22, stroke: false, evenodd: true });
  });
}
/** Mark crossing points (red rings). */
export function markCross(s, list) { for (const c of list) s.dot(c.x, c.y, { r: 7, hollow: true, color: 'red' }); }
/** Plane graph of a v.graph: {ids, idx (key → index), P, E (index pairs), eo (kit edge objects)}. */
export function planeOf(G) {
  const ids = G.nodes.map((n) => n.id), idx = new Map(ids.map((id, i) => [K(id), i])), P = G.nodes.map((n) => [n.x, n.y]), E = [], eo = [];
  for (const e of G.edges) {
    const a = idx.get(K(e.from)), b = idx.get(K(e.to));
    if (a == null || b == null || a === b) continue;
    E.push([a, b]); eo.push(e);
  }
  return { ids, idx, P, E, eo };
}
/** Everything about the current drawing of G: crossings, or the face structure when it is a plane graph. */
export function planeState(G) {
  const pl = planeOf(G), bad = crossPairs(pl.P, pl.E, 0.05);
  return { ...pl, bad, F: bad.length ? null : faceStruct(pl.P, pl.E) };
}
/**
 * Keep a v.graph a plane graph while the reader edits it: edges that would cross are refused, moves that create a crossing are
 * undone (st.msg tells the reader). `after(kind, obj)` runs after every edit.
 */
export function planeGuard(G, st, after) {
  const snap = () => new Map(G.nodes.map((n) => [K(n.id), [n.x, n.y]]));
  let good = snap(); st.msg = '';
  const bad = () => { const { P, E } = planeOf(G); return crossPairs(P, E, 0.05).length > 0; };
  G.onChange = (kind, obj) => {
    if (bad()) {
      if (kind === 'add-edge') { G.removeEdge(obj); st.msg = 'That edge would cross another edge or run through a vertex, so it was refused.'; }
      else if (kind === 'add-node') { G.removeNode(obj.id); st.msg = 'A vertex cannot sit on an edge.'; }
      else if (kind === 'move') { const p = good.get(K(obj.id)); if (p) { obj.x = p[0]; obj.y = p[1]; } st.msg = 'Moved back: the drawing has to stay crossing-free.'; }
    } else st.msg = '';
    good = snap(); if (after) after(kind, obj);
  };
  return { reset() { good = snap(); st.msg = ''; } };
}
export const loadG = (G, spec) => { G.set({ nodes: spec.nodes.map((x) => ({ ...x })), edges: spec.edges.map((e) => (Array.isArray(e) ? [e[0], e[1]] : [e.from, e.to])) }); G.layout('none'); };

// ================================================================ 4. plane graphs with bent edges
/** pg = {P: [[x, y]], E: [[a, b, via?]]}: edge k is the polygonal arc a → via… → b. */
export const pgCopy = (pg) => ({ P: pg.P.map((p) => p.slice()), E: pg.E.map(([a, b, v]) => [a, b, v ? v.map((q) => q.slice()) : []]) });
export function pgFlatten(pg) {
  const P = pg.P.map((p) => p.slice()), E = [], orig = [];
  pg.E.forEach(([a, b, via], k) => {
    let prev = a;
    for (const q of via || []) { P.push(q.slice()); E.push([prev, P.length - 1]); orig.push(k); prev = P.length - 1; }
    E.push([prev, b]); orig.push(k);
  });
  return { P, E, orig, n: pg.P.length };
}
/** Faces of a PG with real-vertex/real-edge bookkeeping: face.rv (real vertices), face.re (real edges), face.rlen (edge traversals). */
export function pgFaces(pg) {
  const fl = pgFlatten(pg), F = faceStruct(fl.P, fl.E);
  F.fl = fl; F.pg = pg;
  F.faces.forEach((f) => {
    f.rv = new Set([...f.verts].filter((v) => v < fl.n)); f.re = new Set([...f.edges].map((e) => fl.orig[e])); f.rlen = 0;
    for (const w of f.walks) for (const h of w.hes) if (F.org(h) < fl.n) f.rlen++;
  });
  F.adj = (a, b) => pg.E.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  return F;
}
const inView = (x, y) => x > 0.35 && x < 9.65 && y > 0.35 && y < 6.05;
/**
 * Add the edge uw to the plane graph pg through a face that has both ends on its boundary. Tries the straight segment, then one
 * bend, then two bends (candidate points on a grid inside the face). Returns the new via-list or null.
 */
export function pgRoute(pg, F, u, w) {
  const faces = F.faces.map((f, i) => [f, i]).filter(([f]) => f.rv.has(u) && f.rv.has(w));
  const ok = (via) => { const g = pgCopy(pg); g.E.push([u, w, via]); const fl = pgFlatten(g); return crossPairs(fl.P, fl.E, 0.04).length === 0; };
  const dd = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  for (const [, fi] of faces.sort((x, y) => x[0].rlen - y[0].rlen)) {
    if (ok([])) return [];
    const pu = pg.P[u], pw = pg.P[w], cands = [], N = 34;
    for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) {
      const x = 0.4 + (9.2 * a) / N, y = 0.4 + (5.6 * b) / N;
      if (inView(x, y) && F.locate(x, y) === fi) cands.push([x, y]);
    }
    const one = cands.slice().sort((p, q) => dd(p, pu) + dd(p, pw) - dd(q, pu) - dd(q, pw));
    for (const c of one.slice(0, 260)) if (ok([c])) return [c];
    const nu = cands.slice().sort((p, q) => dd(p, pu) - dd(q, pu)).slice(0, 30), nw = cands.slice().sort((p, q) => dd(p, pw) - dd(q, pw)).slice(0, 30);
    let best = null, bl = Infinity;
    for (const c1 of nu) for (const c2 of nw) { const L = dd(pu, c1) + dd(c1, c2) + dd(c2, pw); if (L < bl && ok([c1, c2])) { best = [c1, c2]; bl = L; } }
    if (best) return best;
    const vp = visPath(pg, F, fi, u, w, ok) || visPath(pg, F, fi, u, w, ok, 40, 28, 0.05);
    if (vp) return vp;
  }
  return null;
}
/** Shortest polygonal route from u to w through face fi on a grid of candidate points (lazy visibility graph). */
export function visPath(pg, F, fi, u, w, ok, A = 28, B = 19, clr = 0.11) {
  const fl = F.fl, nodes = [pg.P[u], pg.P[w]];
  for (let a = 0; a <= A; a++) for (let b = 0; b <= B; b++) {
    const x = 0.2 + (9.6 * a) / A, y = 0.2 + (6.0 * b) / B;
    if (F.locate(x, y) === fi) nodes.push([x, y]);
  }
  const bv = [...F.faces[fi].verts]; // thin faces: points between boundary vertices
  for (let a = 0; a < bv.length; a++) for (let b = a + 1; b < bv.length; b++) for (const t of [0.2, 0.4, 0.5, 0.6, 0.8]) {
    const x = fl.P[bv[a]][0] * (1 - t) + fl.P[bv[b]][0] * t, y = fl.P[bv[a]][1] * (1 - t) + fl.P[bv[b]][1] * t;
    if (F.locate(x, y) === fi) nodes.push([x, y]);
  }
  const free = (p, q, pu, qu) => {
    for (let k = 0; k < fl.E.length; k++) {
      const [a, b] = fl.E[k];
      if ((pu && (a === u || b === u)) || (qu && (a === w || b === w))) continue;
      if (segInter(p, q, fl.P[a], fl.P[b])) return false;
    }
    for (let v = 0; v < fl.P.length; v++) if (v !== u && v !== w && distSeg(fl.P[v], p, q).d < clr) return false;
    return true;
  };
  const N = nodes.length, dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  dist[0] = 0;
  for (;;) {
    let i = -1, bd = Infinity; for (let k = 0; k < N; k++) if (!done[k] && dist[k] < bd) { bd = dist[k]; i = k; }
    if (i < 0) return null; if (i === 1) break; done[i] = 1;
    for (let k = 0; k < N; k++) {
      if (done[k]) continue;
      const d = bd + Math.hypot(nodes[i][0] - nodes[k][0], nodes[i][1] - nodes[k][1]);
      if (d < dist[k] && free(nodes[i], nodes[k], i === 0, k === 1)) { dist[k] = d; prev[k] = i; }
    }
  }
  let path = []; for (let k = prev[1]; k > 0; k = prev[k]) path.unshift(nodes[k]);
  for (let i = 0; i < path.length;) { // drop bends that are not needed
    const a = i === 0 ? pg.P[u] : path[i - 1], b = i + 1 < path.length ? path[i + 1] : pg.P[w];
    const trial = path.slice(0, i).concat(path.slice(i + 1));
    if (free(a, b, i === 0, i + 1 >= path.length) && ok(trial)) path = trial; else i++;
  }
  return ok(path) ? path : null;
}
/** Pairs (u, w) of non-adjacent vertices that share a face (so an edge uw can be added): [[u, w, faceIndex]]. */
export function pgAddable(pg, F) {
  const out = [], seen = new Set();
  F.faces.forEach((f, i) => {
    const vs = [...f.rv];
    for (let a = 0; a < vs.length; a++) for (let b = a + 1; b < vs.length; b++) {
      const u = Math.min(vs[a], vs[b]), w = Math.max(vs[a], vs[b]), k = u + ',' + w;
      if (!seen.has(k) && !F.adj(u, w)) { seen.add(k); out.push([u, w, i]); }
    }
  });
  return out;
}
/** Add one admissible edge (the first one the router can place, trying shortest pairs first); returns {u, w, via} or null. */
export function pgAddOne(pg, pick = (c) => c) {
  const F = pgFaces(pg), P = pg.P;
  const cs = pick(pgAddable(pg, F).sort((a, b) => Math.hypot(P[a[0]][0] - P[a[1]][0], P[a[0]][1] - P[a[1]][1]) - Math.hypot(P[b[0]][0] - P[b[1]][0], P[b[0]][1] - P[b[1]][1])));
  for (const [u, w] of cs) { const via = pgRoute(pg, F, u, w); if (via) { pg.E.push([u, w, via]); return { u, w, via, k: pg.E.length - 1 }; } }
  return null;
}
/** Draw a PG: edges as polylines (colour per edge via o.edgeColor(k)), vertices as dots with optional labels. */
export function pgDraw(s, pg, o = {}) {
  pg.E.forEach(([a, b, via], k) => {
    const pts = [pg.P[a], ...(via || []), pg.P[b]], c = o.edgeColor ? o.edgeColor(k) : null;
    s.path(pts, { color: c || 'ink', width: c ? 3.2 : 2, dash: o.edgeDash ? o.edgeDash(k) : undefined });
  });
  pg.P.forEach((p, i) => {
    const c = o.vertColor ? o.vertColor(i) : null;
    s.dot(p[0], p[1], { r: 7, color: c || 'ink', label: o.label ? o.label(i) : undefined, labelPos: 'ne' });
  });
}
/** Nearest real vertex of pg to (x, y) within tol, or -1. */
export const pgNearest = (pg, x, y, tol = 0.4) => { let b = -1, bd = tol; pg.P.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; b = i; } }); return b; };

// ================================================================ 5. presets (coordinates in the 10 × 6.4 stage)
const ring = (n, cx, cy, r, a0 = Math.PI / 2) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(a0 - (2 * Math.PI * i) / n), cy + r * Math.sin(a0 - (2 * Math.PI * i) / n)]);
const cyc = (a, n) => Array.from({ length: n }, (_, i) => [a + i, a + ((i + 1) % n)]);
/** Plane-graph presets as PGs. */
export const PGS = {
  ring6: () => ({ P: ring(6, 5, 3.2, 2.4), E: cyc(0, 6).map(([a, b]) => [a, b, []]) }),
  path7: () => ({ P: [[1, 1.2], [2.2, 4.8], [3.5, 2.2], [4.8, 5.4], [6.1, 1.4], [7.4, 4.4], [8.8, 2.6]], E: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]].map(([a, b]) => [a, b, []]) }),
  cube: () => ({ P: [[1.6, 0.8], [8.4, 0.8], [8.4, 5.6], [1.6, 5.6], [3.6, 2.1], [6.4, 2.1], [6.4, 4.3], [3.6, 4.3]], E: [...cyc(0, 4), ...cyc(4, 4), [0, 4], [1, 5], [2, 6], [3, 7]].map(([a, b]) => [a, b, []]) }),
  nested: () => ({ P: [[1.2, 0.8], [8.8, 0.8], [5, 5.7], [3.9, 2.0], [6.1, 2.0], [6.1, 3.6], [3.9, 3.6]], E: [[0, 1], [1, 2], [2, 0], ...cyc(3, 4)].map(([a, b]) => [a, b, []]) }),
  fan: () => ({ P: [[1.2, 1.0], [3.0, 5.2], [5.0, 2.4], [7.0, 5.4], [8.8, 1.2]], E: [[0, 1], [1, 2], [2, 3], [3, 4], [0, 4]].map(([a, b]) => [a, b, []]) }),
  octa: () => ({ P: [[5, 5.9], [1, 0.5], [9, 0.5], [5, 1.4], [6.4, 3.6], [3.6, 3.6]], E: [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [0, 4], [0, 5], [1, 3], [1, 5], [2, 3], [2, 4]].map(([a, b]) => [a, b, []]) }),
};

// ================================================================ 6. small helpers for the items
/** v.graph spec from a PG: vertices get the letters a, b, c, … (layout 'none'). */
export const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
export function pgSpec(pg) {
  return { nodes: pg.P.map(([x, y], i) => ({ id: LETTERS[i], x, y })), edges: pg.E.map(([a, b]) => [LETTERS[a], LETTERS[b]]), layout: 'none' };
}
/** Letters-and-coordinates spec: P = {a: [x, y]}, E = 'ab bc ca'. */
export const planeSpec = (P, E) => ({ nodes: Object.entries(P).map(([id, [x, y]]) => ({ id, x, y })), edges: E.trim().split(/\s+/).map((p) => [p[0], p[1]]), layout: 'none' });
/** Closest point of the polyline pts (optionally closed) to (x, y): {x, y, d, i (segment), t}. */
export function nearOnPoly(pts, x, y, closed = false) {
  let best = null; const n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n], r = distSeg([x, y], a, b);
    if (!best || r.d < best.d) best = { x: r.x, y: r.y, d: r.d, i, t: r.t };
  }
  return best;
}
/** Even-odd test with a horizontal-style ray in direction (cos th, sin th): crossings [{x, y}] of the closed polygon pts. */
export function rayHits(pts, p, th) {
  const c = Math.cos(th), s = Math.sin(th), hits = [];
  for (let i = 0, n = pts.length; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const ax = (a[0] - p[0]) * c + (a[1] - p[1]) * s, ay = -(a[0] - p[0]) * s + (a[1] - p[1]) * c;
    const bx = (b[0] - p[0]) * c + (b[1] - p[1]) * s, by = -(b[0] - p[0]) * s + (b[1] - p[1]) * c;
    if ((ay > 0) === (by > 0)) continue;
    const xi = ax + ((bx - ax) * (0 - ay)) / (by - ay);
    if (xi > 0) hits.push({ x: p[0] + c * xi, y: p[1] + s * xi, d: xi });
  }
  return hits;
}
/** Concatenate polylines {pts, closed} into one drawing: {P, E, part (part index per edge)}. */
export function partsGraph(parts) {
  const P = [], E = [], part = [];
  parts.forEach((q, k) => {
    const o = P.length; q.pts.forEach((p) => P.push(p));
    const n = q.pts.length;
    if (n === 1) return;
    for (let i = 0; i + 1 < n; i++) { E.push([o + i, o + i + 1]); part.push(k); }
    if (q.closed && n > 2) { E.push([o + n - 1, o]); part.push(k); }
  });
  return { P, E, part };
}
/** Regions of the complement of a union of polylines (any drawing): {F, pl (planarized), g}. */
export function regionsOf(parts) {
  const g = partsGraph(parts), pl = planarize(g.P, g.E);
  return { g, pl, F: faceStruct(pl.P, pl.E) };
}
