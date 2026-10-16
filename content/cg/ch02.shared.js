// Computational Geometry — Chapter 2 (convex hulls): helpers shared by ch02.js and ch02-b.js.
// Points are [x, y] (or [x, y, z]) arrays; hulls are returned as index lists into the input.

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
/** (b−o)×(c−o): positive for a left (counter-clockwise) turn o→b→c. */
export const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
export const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

/** Convex hull (Andrew's monotone chain): indices of the strict vertices, counter-clockwise from the leftmost. */
export function hull2(P) {
  const idx = P.map((_, i) => i).sort((i, j) => P[i][0] - P[j][0] || P[i][1] - P[j][1]);
  if (idx.length < 3) return idx;
  const lo = [], up = [];
  for (const i of idx) { while (lo.length >= 2 && cross(P[lo[lo.length - 2]], P[lo[lo.length - 1]], P[i]) <= 0) lo.pop(); lo.push(i); }
  for (let k = idx.length - 1; k >= 0; k--) { const i = idx[k]; while (up.length >= 2 && cross(P[up[up.length - 2]], P[up[up.length - 1]], P[i]) <= 0) up.pop(); up.push(i); }
  lo.pop(); up.pop();
  return lo.concat(up);
}

/** Is q inside (or on) the convex polygon given by CCW vertices H (coordinates)? */
export function inConvex(H, q, eps = 1e-12) {
  if (H.length === 0) return false;
  if (H.length === 1) return Math.hypot(q[0] - H[0][0], q[1] - H[0][1]) < 1e-9;
  if (H.length === 2) {
    const [a, b] = H; const c = cross(a, b, q), L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const t = ((q[0] - a[0]) * (b[0] - a[0]) + (q[1] - a[1]) * (b[1] - a[1])) / (L * L);
    return Math.abs(c) / L < 1e-9 && t > -1e-9 && t < 1 + 1e-9;
  }
  for (let i = 0; i < H.length; i++) if (cross(H[i], H[(i + 1) % H.length], q) < -eps) return false;
  return true;
}
export function polyArea(H) { let a = 0; for (let i = 0; i < H.length; i++) { const p = H[i], q = H[(i + 1) % H.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }

// ------------------------------------------------------------------ point generators (r = v.rng(seed))
export function genPts(r, kind, n, cx = 0, cy = 0, R = 1) {
  const P = [];
  while (P.length < n) {
    if (kind === 'disc') { const x = r.uniform(-1, 1), y = r.uniform(-1, 1); if (x * x + y * y <= 1) P.push([cx + R * x, cy + R * y]); }
    else if (kind === 'square') P.push([cx + R * r.uniform(-1, 1), cy + R * r.uniform(-1, 1)]);
    else if (kind === 'triangle') { let a = r(), b = r(); if (a + b > 1) { a = 1 - a; b = 1 - b; } P.push([cx + R * (-1 + 2 * a + b * 1), cy + R * (-0.8 + 1.8 * b)]); }
    else if (kind === 'circle') { const k = P.length, th = (2 * Math.PI * k) / n + r.uniform(-0.2, 0.2) * ((2 * Math.PI) / n); P.push([cx + R * Math.cos(th), cy + R * Math.sin(th)]); }
    else if (kind === 'gauss') P.push([cx + 0.5 * R * r.normal(), cy + 0.5 * R * r.normal()]);
  }
  return P;
}

// ------------------------------------------------------------------ gift wrapping (Jarvis march)
/** Returns {hull, steps:[{cur, scan:[[r, candidateAfter]…], next}], tests}. Every scan compares one more point with the candidate. */
export function jarvis(P) {
  const n = P.length; let s = 0;
  for (let i = 1; i < n; i++) if (P[i][0] < P[s][0] || (P[i][0] === P[s][0] && P[i][1] < P[s][1])) s = i;
  const hull = [s], steps = []; let cur = s, tests = 0;
  do {
    let cand = cur === 0 ? 1 : 0; const scan = [];
    for (let r = 0; r < n; r++) {
      if (r === cur || r === cand) continue;
      tests++;
      const c = cross(P[cur], P[cand], P[r]);
      if (c < 0 || (c === 0 && d2(P[cur], P[r]) > d2(P[cur], P[cand]))) cand = r;
      scan.push([r, cand]);
    }
    steps.push({ cur, scan, next: cand }); cur = cand;
    if (cur !== s) hull.push(cur);
  } while (cur !== s && hull.length <= n);
  return { hull, steps, tests };
}

// ------------------------------------------------------------------ Graham scan trace
/** Frames of Graham's scan: order = points sorted by angle about the pivot; each frame has the stack and what is being tested. */
export function grahamTrace(P) {
  const n = P.length; let p0 = 0;
  for (let i = 1; i < n; i++) if (P[i][1] < P[p0][1] || (P[i][1] === P[p0][1] && P[i][0] < P[p0][0])) p0 = i;
  const rest = P.map((_, i) => i).filter((i) => i !== p0);
  rest.sort((i, j) => { const c = cross(P[p0], P[i], P[j]); return c > 0 ? -1 : c < 0 ? 1 : d2(P[p0], P[i]) - d2(P[p0], P[j]); });
  const order = [p0, ...rest], rank = new Map(order.map((p, k) => [p, k]));
  const stack = [order[0], order[1]], frames = []; let pushes = 2, pops = 0;
  const gone = new Set();
  const snap = (o) => frames.push({ stack: stack.slice(), gone: [...gone], pushes, pops, ...o });
  snap({ kind: 'sorted', k: 1 });
  for (let k = 2; k < n; k++) {
    const p = order[k];
    for (;;) {
      if (stack.length < 2) break;
      const a = stack[stack.length - 2], b = stack[stack.length - 1], c = cross(P[a], P[b], P[p]);
      snap({ kind: 'test', k, cand: p, tri: [a, b, p], turn: c > 0 ? 1 : -1 });
      if (c > 0) break;
      stack.pop(); gone.add(b); pops++;
      snap({ kind: 'pop', k, cand: p, popped: b });
    }
    stack.push(p); pushes++;
    snap({ kind: 'push', k, cand: p });
  }
  snap({ kind: 'done', k: n });
  return { order, rank, frames, pushes, pops, hull: stack.slice() };
}

// ------------------------------------------------------------------ 3D: orientation and incremental hull
export const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const cross3 = (u, w) => [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
export const dot3 = (u, w) => u[0] * w[0] + u[1] * w[1] + u[2] * w[2];
/** > 0 when d lies on the outer side of the plane through a, b, c (normal (b−a)×(c−a)). */
export const orient3 = (a, b, c, d) => dot3(cross3(sub3(b, a), sub3(c, a)), sub3(d, a));

export function gen3(r, kind, n) {
  const P = [];
  while (P.length < n) {
    if (kind === 'ball') { const p = [r.uniform(-1, 1), r.uniform(-1, 1), r.uniform(-1, 1)]; if (dot3(p, p) <= 1) P.push(p); }
    else if (kind === 'sphere') { const p = [r.normal(), r.normal(), r.normal()], L = Math.hypot(...p); P.push([p[0] / L, p[1] / L, p[2] / L]); }
    else if (kind === 'cube') P.push([r.uniform(-1, 1), r.uniform(-1, 1), r.uniform(-1, 1)]);
    else if (kind === 'gauss') P.push([0.6 * r.normal(), 0.6 * r.normal(), 0.6 * r.normal()]);
  }
  return P;
}

/**
 * Randomized incremental 3D hull with a conflict graph. `order` lists point indices in insertion order
 * (the first four must not be coplanar). Returns {facets (outward triangles [a,b,c]), frames, work, inserted}.
 * Each frame: {p, tag: 'start'|'locate'|'cone'|'inside', facets: [{v, t}], horizon, pending, hullV, work}.
 */
export function incHull3(P, order, { frames: wantFrames = true } = {}) {
  const F = []; // {v:[a,b,c], conf:[], alive}
  const conf = new Map(); // point -> Set of alive facet ids it sees
  const [i0, i1, i2, i3] = order, base = [i0, i1, i2, i3];
  const addFacet = (a, b, c) => { const f = { v: [a, b, c], conf: [], alive: true, id: F.length }; F.push(f); return f; };
  const quad = [[0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 3, 1], [1, 2, 3, 0]];
  for (const [a, b, c, d] of quad) {
    let t = [base[a], base[b], base[c]];
    if (orient3(P[t[0]], P[t[1]], P[t[2]], P[base[d]]) > 0) t = [t[0], t[2], t[1]];
    addFacet(...t);
  }
  let work = 0;
  for (let k = 4; k < order.length; k++) {
    const q = order[k], s = new Set();
    for (const f of F) if (orient3(P[f.v[0]], P[f.v[1]], P[f.v[2]], P[q]) > 0) { f.conf.push(q); s.add(f.id); work++; }
    conf.set(q, s);
  }
  const snapFacets = (tagOf) => F.filter((f) => f.alive).map((f) => ({ v: f.v, t: tagOf(f) }));
  const frames = [];
  const inserted = base.slice();
  const pend = (k) => order.slice(k).filter((q) => !inserted.includes(q));
  const rec = (o) => { if (wantFrames) frames.push({ work, ...o }); };
  const hullV = () => { const S = new Set(); for (const f of F) if (f.alive) f.v.forEach((x) => S.add(x)); return S.size; };
  rec({ p: null, tag: 'start', facets: snapFacets(() => 'old'), horizon: [], pending: pend(4), hullV: 4, k: 3 });
  for (let k = 4; k < order.length; k++) {
    const q = order[k], vis = [...conf.get(q)].map((id) => F[id]).filter((f) => f.alive);
    inserted.push(q);
    if (!vis.length) { rec({ p: q, tag: 'inside', facets: snapFacets(() => 'old'), horizon: [], pending: pend(k + 1), hullV: hullV(), k }); continue; }
    const visSet = new Set(vis.map((f) => f.id)), edgeOwner = new Map();
    for (const f of F) if (f.alive) for (let e = 0; e < 3; e++) edgeOwner.set(f.v[e] + ',' + f.v[(e + 1) % 3], f);
    const horizon = [];
    for (const f of vis) for (let e = 0; e < 3; e++) {
      const u = f.v[e], w = f.v[(e + 1) % 3], twin = edgeOwner.get(w + ',' + u);
      if (!visSet.has(twin.id)) horizon.push({ u, w, f, twin });
    }
    rec({ p: q, tag: 'locate', facets: snapFacets((f) => (visSet.has(f.id) ? 'visible' : 'old')), horizon: horizon.map((h) => [h.u, h.w]), pending: pend(k + 1), hullV: hullV(), k });
    for (const f of vis) f.alive = false;
    const news = [];
    for (const h of horizon) {
      const nf = addFacet(h.u, h.w, q); news.push(nf);
      const cand = new Set([...h.f.conf, ...h.twin.conf]); cand.delete(q);
      for (const c of cand) { if (inserted.includes(c)) continue; work++; if (orient3(P[nf.v[0]], P[nf.v[1]], P[nf.v[2]], P[c]) > 0) { nf.conf.push(c); conf.get(c).add(nf.id); } }
    }
    const newIds = new Set(news.map((f) => f.id));
    rec({ p: q, tag: 'cone', facets: snapFacets((f) => (newIds.has(f.id) ? 'new' : 'old')), horizon: horizon.map((h) => [h.u, h.w]), pending: pend(k + 1), hullV: hullV(), k });
  }
  const facets = F.filter((f) => f.alive).map((f) => f.v);
  return { facets, frames, work, inserted };
}

/** V, E, F of a triangulated closed surface given by its facet list (edges counted as distinct unordered pairs). */
export function surfaceCounts(facets) {
  const V = new Set(), E = new Set();
  for (const f of facets) for (let e = 0; e < 3; e++) { const a = f[e], b = f[(e + 1) % 3]; V.add(a); E.add(a < b ? a + ',' + b : b + ',' + a); }
  return { V: V.size, E: E.size, F: facets.length };
}
