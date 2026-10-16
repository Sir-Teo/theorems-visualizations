// Graph Theory (Diestel) — Chapter 4, part Z (§§4.3–4.6): helpers shared by ch04-z.js and ch04-z2.js.
// Re-exports the chapter 1–3 toolbox and adds a small planarity toolkit:
//  1. plane drawings: face walks of a straight-line drawing, crossings, signed areas                     (§4.3)
//  2. DMP (Demoucron–Malgrange–Pertuiset) planarity test with embedding for 2-connected graphs, planarity of
//     arbitrary small graphs by blocks, Kuratowski subdivisions by edge-minimal deletion               (§4.4)
//  3. Tutte (barycentric) straight-line drawing of an embedded 2-connected graph via stellated faces
//  4. dual multigraphs from face walks, cycle / bond tests on edge masks                                 (§4.6)
//  5. plane triangulations, canonical ordering, Schnyder woods and the three linear orders               (§4.5)
export * from './ch03.shared.js';
import { ix, blocks, amask, allCycles, allBonds, comps } from './ch03.shared.js';

export const TAU = 2 * Math.PI;
export const ekey2 = (a, b) => (a < b ? a + ',' + b : b + ',' + a);

// ================================================================ 1. plane drawings
/** Do two segments (strictly) cross? Shared endpoints do not count. */
export function segCross(p, q, r, s) {
  const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return cr(p, q, r) * cr(p, q, s) < 0 && cr(r, s, p) * cr(r, s, q) < 0;
}
/** Crossing pairs [i, j] of edges for a straight-line drawing pos[v] = [x, y]. Also counts overlaps of collinear edges at a shared end. */
export function crossings(H, pos) {
  const out = [];
  for (let i = 0; i < H.m; i++) for (let j = i + 1; j < H.m; j++) {
    const [a, b] = H.E[i], [c, d] = H.E[j];
    if (a === c || a === d || b === c || b === d) continue;
    if (segCross(pos[a], pos[b], pos[c], pos[d])) out.push([i, j]);
  }
  return out;
}
/**
 * Faces of a crossing-free straight-line drawing of a CONNECTED graph (walks of directed edges with the face on the left).
 * Returns [{walk: [vertex idx], edges: [edge idx], area (signed, > 0 inner, < 0 outer), key}] — key identifies the set of edges.
 */
export function faceWalks(H, pos) {
  const rot = Array.from({ length: H.n }, (_, v) => H.adj[v].map(([w, k]) => [w, k, Math.atan2(pos[w][1] - pos[v][1], pos[w][0] - pos[v][0])]).sort((p, q) => p[2] - q[2]));
  const idx = (v, w) => rot[v].findIndex((t) => t[0] === w);
  const seen = new Set(), out = [];
  for (let u = 0; u < H.n; u++) for (const [v0] of rot[u]) {
    if (seen.has(u + '>' + v0)) continue;
    const walk = [], edges = []; let a = u, b = v0, guard = 0;
    while (!seen.has(a + '>' + b) && guard++ < 4 * H.m + 4) {
      seen.add(a + '>' + b); walk.push(a);
      const k = rot[a][idx(a, b)][1]; edges.push(k);
      // at b, turn to the neighbour just before a in counter-clockwise order (= next clockwise)
      const i = idx(b, a), nb = rot[b][(i - 1 + rot[b].length) % rot[b].length];
      a = b; b = nb[0];
    }
    let A = 0; for (let i = 0; i < walk.length; i++) { const p = pos[walk[i]], q = pos[walk[(i + 1) % walk.length]]; A += p[0] * q[1] - q[0] * p[1]; }
    out.push({ walk, edges, area: A / 2, key: edges.slice().sort((x, y) => x - y).join('.') });
  }
  return out;
}
/** Canonical string of a face (as an unordered edge set) — comparing drawings of one graph. */
export const faceKeys = (F) => F.map((f) => f.key).sort();

// ================================================================ 2. planarity
/**
 * DMP planarity test and embedding for a 2-connected graph on vertices 0..n-1 with edge list E ([a, b] pairs).
 * Returns null if non-planar, else the faces as cyclic vertex lists (both orientations consistent: every edge is
 * traversed once in each direction over all faces).
 */
export function dmp(n, E, rng) {
  const adj = Array.from({ length: n }, () => []); E.forEach(([a, b], k) => { adj[a].push([b, k]); adj[b].push([a, k]); });
  // find a cycle by DFS
  const par = new Int32Array(n).fill(-2), dep = new Int32Array(n); let cyc = null;
  const dfs = (u) => { for (const [w] of adj[u]) { if (cyc) return; if (par[w] === -2) { par[w] = u; dep[w] = dep[u] + 1; dfs(w); } else if (w !== par[u] && dep[w] < dep[u]) { cyc = []; for (let x = u; x !== w; x = par[x]) cyc.push(x); cyc.push(w); return; } } };
  let start = 0; while (start < n && !adj[start].length) start++;
  if (start === n) return [];
  par[start] = -1; dfs(start);
  if (!cyc) return null;
  const inH = new Uint8Array(n), edgeIn = new Uint8Array(E.length);
  cyc.forEach((v, i) => { inH[v] = 1; const w = cyc[(i + 1) % cyc.length]; E.forEach(([a, b], k) => { if ((a === v && b === w) || (a === w && b === v)) edgeIn[k] = 1; }); });
  let faces = [cyc.slice(), cyc.slice().reverse()];
  let inCount = cyc.length;
  const totalV = (() => { let c = 0; for (let v = 0; v < n; v++) if (adj[v].length) c++; return c; })();
  for (let guard = 0; guard < 4 * E.length + 10; guard++) {
    // fragments
    const frags = [];
    E.forEach(([a, b], k) => { if (!edgeIn[k] && inH[a] && inH[b]) frags.push({ att: [a, b], edge: k, comp: null }); });
    const seen = new Uint8Array(n);
    for (let s = 0; s < n; s++) {
      if (inH[s] || seen[s] || !adj[s].length) continue;
      const comp = [s], att = new Set(); seen[s] = 1;
      for (let i = 0; i < comp.length; i++) for (const [w] of adj[comp[i]]) { if (inH[w]) att.add(w); else if (!seen[w]) { seen[w] = 1; comp.push(w); } }
      frags.push({ att: [...att], comp, edge: -1 });
    }
    if (!frags.length) break;
    let best = null;
    for (const f of frags) {
      f.adm = faces.map((F, i) => (f.att.every((x) => F.includes(x)) ? i : -1)).filter((i) => i >= 0);
      if (!f.adm.length) return null;
      if (!best || f.adm.length < best.adm.length) best = f;
    }
    if (rng && best.adm.length > 1) { const cands = frags.filter((g) => g.adm.length === best.adm.length); best = cands[Math.floor(rng() * cands.length)]; }
    const f = best, fi = rng ? f.adm[Math.floor(rng() * f.adm.length)] : f.adm[0], F = faces[fi];
    // path inside the fragment between two distinct attachments
    let path;
    if (f.edge >= 0) path = [f.att[0], f.att[1]];
    else {
      const inC = new Set(f.comp), a = f.att[0]; let found = null;
      // BFS from a through the component to some other attachment
      const prev = new Map([[a, -1]]), q = [a];
      for (let i = 0; i < q.length && !found; i++) {
        const u = q[i];
        for (const [w] of adj[u]) {
          if (prev.has(w)) continue;
          if (u === a && !inC.has(w)) continue; // first step must enter the component
          if (inC.has(w)) { prev.set(w, u); q.push(w); } else if (inH[w] && w !== a && u !== a) { prev.set(w, u); found = w; break; }
        }
      }
      if (found == null) return null;
      path = []; for (let x = found; x !== -1; x = prev.get(x)) path.push(x); path.reverse();
    }
    const A = path[0], B = path[path.length - 1];
    const ia = F.indexOf(A); const R = F.slice(ia).concat(F.slice(0, ia)); const j = R.indexOf(B);
    const mid = path.slice(1, -1);
    const f1 = R.slice(0, j + 1).concat(mid.slice().reverse()), f2 = R.slice(j).concat([R[0]], mid);
    faces.splice(fi, 1, f1, f2);
    for (const v of path) if (!inH[v]) { inH[v] = 1; inCount++; }
    for (let i = 0; i + 1 < path.length; i++) E.forEach(([a, b], k) => { if ((a === path[i] && b === path[i + 1]) || (a === path[i + 1] && b === path[i])) edgeIn[k] = 1; });
    if (inCount === totalV && E.every(([a, b], k) => edgeIn[k] || !(inH[a] && inH[b]))) break;
  }
  return faces;
}
/** Is H (index structure, simple) planar? Planar iff every block is; K2 blocks and small blocks are trivial. */
export function isPlanar(H) {
  if (H.n >= 3 && H.m > 3 * H.n - 6) return false;
  const BL = blocks(H);
  for (const B of BL.blocks) {
    if (B.V.length < 5 || B.E.length < 9) { if (B.V.length < 5) continue; }
    if (B.V.length < 3) continue;
    const loc = new Map(B.V.map((v, i) => [v, i])), E = B.E.map((k) => [loc.get(H.E[k][0]), loc.get(H.E[k][1])]);
    if (!dmp(B.V.length, E)) return false;
  }
  return true;
}
/** Planarity of a plain edge list on n vertices. */
export function planarEdges(n, E) {
  return isPlanar(ix({ nodes: Array.from({ length: n }, (_, i) => ({ id: i })), edges: E }));
}
/**
 * Edge-minimal non-planar subgraph (a subdivision of K^5 or K_{3,3}) by greedy deletion, or null if H is planar.
 * Returns {edges: [edge idx], branch: [vertex idx], type: 'K5' | 'K33', paths: [[u, v, [vertex path]]]}.
 */
export function kuratowski(H) {
  if (isPlanar(H)) return null;
  const keep = new Uint8Array(H.m).fill(1), n = H.n;
  // first drop everything outside a minimal set quickly: try deleting each edge once
  for (let k = 0; k < H.m; k++) {
    keep[k] = 0;
    const E = []; for (let j = 0; j < H.m; j++) if (keep[j]) E.push([H.E[j][0], H.E[j][1]]);
    if (planarEdges(n, E)) keep[k] = 1;
  }
  const edges = []; for (let k = 0; k < H.m; k++) if (keep[k]) edges.push(k);
  const deg = new Int32Array(n); for (const k of edges) { deg[H.E[k][0]]++; deg[H.E[k][1]]++; }
  const branch = []; for (let v = 0; v < n; v++) if (deg[v] >= 3) branch.push(v);
  const type = branch.length === 5 ? 'K5' : 'K33';
  const nb = Array.from({ length: n }, () => []); for (const k of edges) { const [a, b] = H.E[k]; nb[a].push([b, k]); nb[b].push([a, k]); }
  const isB = new Uint8Array(n); branch.forEach((v) => (isB[v] = 1));
  const paths = [], used = new Set();
  for (const u of branch) for (const [w0, k0] of nb[u]) {
    if (used.has(k0)) continue;
    const vs = [u], ks = [k0]; let prev = u, cur = w0; used.add(k0);
    while (!isB[cur]) { vs.push(cur); const [nx, kk] = nb[cur].find(([x, kk]) => !used.has(kk)); used.add(kk); ks.push(kk); prev = cur; cur = nx; }
    vs.push(cur); paths.push({ a: u, b: cur, vs, ks });
  }
  return { edges, branch, type, paths };
}

// ================================================================ 3. Tutte drawing
/** Solve a dense linear system (Gaussian elimination with pivoting); A is modified. */
function gauss(A, b) {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    const d = A[i][i] || 1e-12;
    for (let r = i + 1; r < n; r++) { const f = A[r][i] / d; if (f) { for (let c = i; c < n; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; } }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c]; x[i] = s / (A[i][i] || 1e-12); }
  return x;
}
/**
 * Straight-line crossing-free drawing of a 2-connected planar graph from an embedding (faces as cyclic vertex lists):
 * the outer face is fixed as a regular polygon, every other face gets an extra vertex joined to its boundary (so the
 * graph becomes 3-connected) and Tutte's barycentric equations are solved. Returns pos[v] = [x, y] with |coordinates| ≤ 1.
 */
export function tutte(n, E, faces, outer = 0, wf = 4) {
  const outerF = faces[outer], N = n + faces.length - 1, nbr = Array.from({ length: N }, () => new Set());
  E.forEach(([a, b]) => { nbr[a].add(b); nbr[b].add(a); });
  let id = n; const fid = new Map();
  faces.forEach((F, i) => { if (i === outer) return; fid.set(i, id); for (const v of F) { nbr[id].add(v); nbr[v].add(id); } id++; });
  const fixedPos = new Map(); outerF.forEach((v, i) => fixedPos.set(v, [Math.cos(Math.PI / 2 - (TAU * i) / outerF.length), Math.sin(Math.PI / 2 - (TAU * i) / outerF.length)]));
  const free = []; for (let v = 0; v < N; v++) if (!fixedPos.has(v) && nbr[v].size) free.push(v);
  const idx = new Map(free.map((v, i) => [v, i])), A = free.map(() => new Array(free.length).fill(0)), bx = free.map(() => 0), by = free.map(() => 0);
  free.forEach((v, i) => {
    const wt = (w) => ((v >= n) !== (w >= n) ? wf : 1);
    for (const w of nbr[v]) { const c = wt(w); A[i][i] += c; if (fixedPos.has(w)) { bx[i] += c * fixedPos.get(w)[0]; by[i] += c * fixedPos.get(w)[1]; } else A[i][idx.get(w)] -= c; }
  });
  const X = gauss(A.map((r) => r.slice()), bx), Y = gauss(A.map((r) => r.slice()), by);
  const pos = [];
  for (let v = 0; v < n; v++) pos.push(fixedPos.has(v) ? fixedPos.get(v) : free.includes(v) ? [X[idx.get(v)], Y[idx.get(v)]] : [0, 0]);
  return pos;
}
/** Embed and draw: planar 2-connected H → {faces, pos} or null. Chooses the longest face as the outer one. */
export function embedDraw(H) {
  const faces = dmp(H.n, H.E.map(([a, b]) => [a, b]));
  if (!faces) return null;
  let o = 0; faces.forEach((f, i) => { if (f.length > faces[o].length) o = i; });
  return { faces, outer: o, pos: tutte(H.n, H.E.map(([a, b]) => [a, b]), faces, o) };
}

// ================================================================ 4. duals, cycles and bonds
/**
 * Dual multigraph of a connected plane graph from its face walks (any list of vertex walks traversing every directed edge once):
 * returns {nf, edges: [{a, b, e}]} — dual vertex per face, dual edge for each primal edge e between its two faces
 * (a loop when e is a bridge). faces: walks of vertex indices.
 */
export function dualOf(H, faces) {
  const side = new Map();
  faces.forEach((w, fi) => { for (let i = 0; i < w.length; i++) { const u = w[i], x = w[(i + 1) % w.length]; side.set(u + '>' + x, fi); } });
  const edges = H.E.map(([a, b], k) => ({ a: side.get(a + '>' + b), b: side.get(b + '>' + a), e: k }));
  return { nf: faces.length, edges };
}
/** Is the edge mask F (Uint8Array over H.E) a cycle? */
export function isCycleMask(H, F) {
  const deg = new Int32Array(H.n); let cnt = 0, s = -1;
  F.forEach((x, k) => { if (x) { cnt++; deg[H.E[k][0]]++; deg[H.E[k][1]]++; s = H.E[k][0]; } });
  if (cnt < 3) return false;
  for (let v = 0; v < H.n; v++) if (deg[v] !== 0 && deg[v] !== 2) return false;
  const seen = new Set([s]), q = [s];
  for (let i = 0; i < q.length; i++) for (const [w, k] of H.adj[q[i]]) if (F[k] && !seen.has(w)) { seen.add(w); q.push(w); }
  let vc = 0; for (let v = 0; v < H.n; v++) if (deg[v]) vc++;
  return seen.size === vc;
}
/** Is the edge mask F a bond (minimal non-empty cut) of the multigraph with ends ends[k] = [a, b] on n vertices? */
export function isBondMask(n, ends, F) {
  const par = Array.from({ length: n }, (_, i) => i), find = (x) => (par[x] === x ? x : (par[x] = find(par[x])));
  let c0 = 0;
  const uf = (skip) => { for (let i = 0; i < n; i++) par[i] = i; ends.forEach(([a, b], k) => { if (!skip(k)) par[find(a)] = find(b); }); const s = new Set(); for (let i = 0; i < n; i++) s.add(find(i)); return s.size; };
  c0 = uf(() => false);
  let cnt = 0; F.forEach((x) => { if (x) cnt++; });
  if (!cnt) return false;
  if (uf((k) => F[k]) !== c0 + 1) return false;
  // minimal: restoring any single edge of F reconnects
  for (let k = 0; k < ends.length; k++) if (F[k]) { if (uf((j) => F[j] && j !== k) !== c0) return false; }
  return true;
}
/** Does the bijection (edge k of H ↔ edge pi[k] of the multigraph D = {n, ends}) map every cycle of H to a bond of D? */
export function cyclesToBonds(H, D, pi, cycles = allCycles(H)) {
  for (const c of cycles) {
    const F = new Uint8Array(D.ends.length); c.E.forEach((x, k) => { if (x) F[pi[k]] = 1; });
    if (!isBondMask(D.n, D.ends, F)) return c;
  }
  return null;
}
export { allCycles, allBonds, comps, amask };

// ================================================================ 5. triangulations and Schnyder woods
/**
 * Random plane triangulation on n ≥ 4 vertices: start with the triangle 0,1,2 (outer face) and insert each new vertex
 * into a random inner face (stacked), then perform random edge flips for variety. Returns {n, E, faces (inner triangles, ccw),
 * outer: [0, 1, 2]} with straight-line positions from a Tutte drawing.
 */
export function randomTriangulation(n, rng, flips = 12) {
  const tri = [[0, 1, 2]]; // inner triangles, counter-clockwise when 0,1,2 is ccw
  const edges = new Set(['0,1', '1,2', '0,2']);
  for (let v = 3; v < n; v++) {
    const i = Math.floor(rng() * tri.length), [a, b, c] = tri[i];
    tri.splice(i, 1, [a, b, v], [b, c, v], [c, a, v]);
    edges.add(ekey2(a, v)); edges.add(ekey2(b, v)); edges.add(ekey2(c, v));
  }
  const has = (a, b) => edges.has(ekey2(a, b));
  for (let t = 0; t < flips * 4 && flips; t++) {
    // flip: two inner triangles sharing an edge (a,b) with third vertices c,d; new edge (c,d) must not exist
    const i = Math.floor(rng() * tri.length), T = tri[i], r = Math.floor(rng() * 3), a = T[r], b = T[(r + 1) % 3], c = T[(r + 2) % 3];
    if ((a < 3 && b < 3)) continue;
    const j = tri.findIndex((U, jj) => jj !== i && U.includes(a) && U.includes(b)); if (j < 0) continue;
    const U = tri[j], d = U.find((x) => x !== a && x !== b);
    if (has(c, d) || c === d) continue;
    // orientation: T = (a, b, c) ccw; U must contain (b, a, d)
    const ua = U.indexOf(b); if (U[(ua + 1) % 3] !== a) continue;
    // degrees stay >= 3
    const degv = (x) => { let k = 0; for (const e of edges) { const [p, q] = e.split(',').map(Number); if (p === x || q === x) k++; } return k; };
    if (degv(a) <= 3 || degv(b) <= 3) continue;
    const lo = i < j ? i : j, hi = i < j ? j : i;
    tri.splice(hi, 1); tri.splice(lo, 1);
    tri.push([a, d, c], [d, b, c]); edges.delete(ekey2(a, b)); edges.add(ekey2(c, d));
    if (--flips <= 0) break;
  }
  const E = [...edges].map((s) => s.split(',').map(Number));
  return { n, E, tri };
}
/** Tutte drawing of a random triangulation with a1 = 0 (bottom left), a2 = 1 (bottom right), a3 = 2 (top). Returns {n, E, pos}. */
export function triDraw(T) {
  const faces = T.tri.map((t) => t.slice()); faces.push([2, 1, 0]);
  const pos = tutte(T.n, T.E, faces, faces.length - 1);
  return { ...T, pos };
}
/**
 * Schnyder wood of a plane triangulation (outer vertices a1 = 0, a2 = 1, a3 = 2, counter-clockwise in the drawing pos) via a
 * canonical ordering: peel a3, then repeatedly a vertex of the outer cycle without a chord. Returns {full (canonical order),
 * rank, out: [[v, w, colour]] per vertex v (edge v → w in tree T_colour, rooted at a_colour)}.
 */
export function schnyder(n, E, pos) {
  const H = ix({ nodes: Array.from({ length: n }, (_, i) => ({ id: i })), edges: E });
  const rot = Array.from({ length: n }, (_, v) => H.adj[v].map(([w]) => w).sort((p, q) => Math.atan2(pos[p][1] - pos[v][1], pos[p][0] - pos[v][0]) - Math.atan2(pos[q][1] - pos[v][1], pos[q][0] - pos[v][0])));
  const alive = new Uint8Array(n).fill(1), peeled = [];
  const outerCycle = () => {
    const sub = ix({ nodes: [...Array(n).keys()].filter((v) => alive[v]).map((id) => ({ id })), edges: E.filter(([a, b]) => alive[a] && alive[b]) });
    const P = sub.ids.map((v) => pos[v]), F = faceWalks(sub, P);
    const o = F.reduce((x, y) => (y.area < x.area ? y : x));
    return o.walk.map((i) => sub.ids[i]);
  };
  for (let step = 0; step < n - 2; step++) {
    let pick = -1;
    if (step === 0) pick = 2;
    else {
      const cyc = outerCycle(), at = new Map(cyc.map((v, i) => [v, i])), L = cyc.length;
      for (const v of cyc) {
        if (v < 2) continue;
        const chord = rot[v].some((w) => alive[w] && at.has(w) && ((at.get(w) - at.get(v) + L) % L) > 1 && ((at.get(v) - at.get(w) + L) % L) > 1);
        if (!chord) { pick = v; break; }
      }
    }
    if (pick < 0) return null;
    alive[pick] = 0; peeled.push(pick);
  }
  const full = [0, 1, ...peeled.slice().reverse()], rank = new Int32Array(n); full.forEach((v, i) => (rank[v] = i));
  const out = Array.from({ length: n }, () => []);
  out[1].push([1, 0, 1]); out[0].push([0, 1, 2], [0, 2, 3]); out[1].push([1, 2, 3]);
  for (let i = 2; i < n; i++) {
    const v = full[i], R = rot[v], L = R.length, low = R.map((w) => rank[w] < i);
    let s = -1;
    for (let t = 0; t < L; t++) if (low[t] && !low[(t - 1 + L) % L]) { s = t; break; }
    if (s < 0) s = R.indexOf(0);
    const lr = []; for (let t = 0; t < L; t++) { const w = R[(s + t) % L]; if (rank[w] < i) lr.push(w); else break; }
    if (i === n - 1) { const s0 = R.indexOf(0); lr.length = 0; for (let t = 0; t < L; t++) { const w = R[(s0 + t) % L]; lr.push(w); if (w === 1) break; } }
    out[v].push([v, lr[0], 1], [v, lr[lr.length - 1], 2]);
    for (let t = 1; t < lr.length - 1; t++) out[lr[t]].push([lr[t], v, 3]);
  }
  return { full, rank, out, rot };
}

// ================================================================ 6. more planarity tools
/** Canonical key of an embedding given as faces (cyclic vertex lists): the set of facial edge sets, as a string. */
export const faceSetKey = (faces) => faces.map((f) => f.map((v, i) => ekey2(v, f[(i + 1) % f.length])).sort().join('|')).sort().join('#');
/** Deterministic edge key of one face cycle. */
export const faceKey = (f) => f.map((v, i) => ekey2(v, f[(i + 1) % f.length])).sort().join('|');
/** Greedily add edges (in the order of `rng` if given) while keeping H planar; returns the list of added pairs [a, b]. */
export function maximalize(H, rng, stopAfter = Infinity) {
  const pairs = []; const have = new Set(H.E.map(([a, b]) => ekey2(a, b)));
  for (let i = 0; i < H.n; i++) for (let j = i + 1; j < H.n; j++) if (!have.has(ekey2(i, j))) pairs.push([i, j]);
  if (rng) for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
  const E = H.E.map(([a, b]) => [a, b]), added = [];
  for (const [a, b] of pairs) {
    if (added.length >= stopAfter) break;
    E.push([a, b]);
    if (planarEdges(H.n, E)) added.push([a, b]); else E.pop();
  }
  return added;
}
/** Straight-line crossing-free positions of a planar graph (relative coordinates in [-1, 1]), via a maximal planar supergraph; null if non-planar. */
export function planarPos(H) {
  if (!isPlanar(H)) return null;
  if (H.n < 3) return Array.from({ length: H.n }, (_, i) => [i, 0]);
  const add = maximalize(H), E = H.E.map(([a, b]) => [a, b]).concat(add);
  const faces = dmp(H.n, E); if (!faces) return null;
  let o = 0; faces.forEach((f, i) => { if (f.length > faces[o].length) o = i; });
  return spread(H.n, E, tutte(H.n, E, faces, o), 40);
}
/** Index structure from n and an edge list. */
export const ixE = (n, E) => ix({ nodes: Array.from({ length: n }, (_, i) => ({ id: i })), edges: E });
/**
 * Search for a basis of the cycle space in which every edge lies in at most two basis cycles (a "simple" basis, MacLane).
 * Needs m ≤ 30. Returns {dim, basis: [cycle {vs, E}] | null, nCycles, exhausted, tooBig}.
 */
export function simpleBasis(H, budget = 6e5) {
  const C = comps(H).k, dim = H.m - H.n + C;
  if (H.m > 30) return { dim, basis: null, tooBig: true, nCycles: 0, exhausted: false };
  if (dim === 0) return { dim, basis: [], nCycles: 0, exhausted: true };
  const cyc = allCycles(H, 3000).map((c) => ({ ...c, mask: c.E.reduce((a, x, k) => a | (x << k), 0) })).sort((p, q) => p.vs.length - q.vs.length);
  const load = new Int32Array(H.m), chosen = []; let nodes = 0, found = null, best = [];
  const go = (from, basis) => {
    if (found || nodes > budget) return;
    if (chosen.length > best.length) best = chosen.slice();
    if (chosen.length === dim) { found = chosen.slice(); return; }
    if (cyc.length - from < dim - chosen.length) return;
    for (let i = from; i < cyc.length; i++) {
      nodes++; if (nodes > budget) return;
      const c = cyc[i]; let ok = true;
      for (let k = 0; k < H.m; k++) if (c.E[k] && load[k] >= 2) { ok = false; break; }
      if (!ok) continue;
      let x = c.mask; for (const b of basis) x = Math.min(x, x ^ b);
      if (!x) continue;
      for (let k = 0; k < H.m; k++) if (c.E[k]) load[k]++;
      chosen.push(i); go(i + 1, basis.concat([x])); chosen.pop();
      for (let k = 0; k < H.m; k++) if (c.E[k]) load[k]--;
      if (found) return;
    }
  };
  go(0, []);
  return { dim, basis: found ? found.map((i) => cyc[i]) : null, best: best.map((i) => cyc[i]), nCycles: cyc.length, exhausted: !found && nodes <= budget, nodes };
}
/**
 * Schnyder regions: for an inner vertex v return counts of inner triangular faces in R1, R2, R3 and the face lists.
 * tri: inner triangles (vertex triples); out: the wood (per vertex lists [v, w, colour]).
 */
export function schnyderRegions(n, tri, out, v) {
  const path = (c) => { const ks = []; let u = v, g = 0; for (;;) { const e = out[u].find(([a, b, k]) => k === c && !(u < 3 && b < 3 && c === 3 - 0 && false)); if (!e || g++ > n) break; if (u < 3 && u === c - 1) break; ks.push(ekey2(u, e[1])); u = e[1]; if (u === c - 1) break; } return ks; };
  const bar = new Set([...path(1), ...path(2), ...path(3)]);
  const fk = tri.map((t) => [ekey2(t[0], t[1]), ekey2(t[1], t[2]), ekey2(t[2], t[0])]);
  const lab = new Int32Array(tri.length).fill(-1); let nl = 0;
  const byEdge = new Map(); fk.forEach((es, i) => es.forEach((e) => { if (!byEdge.has(e)) byEdge.set(e, []); byEdge.get(e).push(i); }));
  for (let i = 0; i < tri.length; i++) {
    if (lab[i] >= 0) continue; lab[i] = nl; const q = [i];
    for (let h = 0; h < q.length; h++) for (const e of fk[q[h]]) { if (bar.has(e)) continue; for (const j of byEdge.get(e)) if (lab[j] < 0) { lab[j] = nl; q.push(j); } }
    nl++;
  }
  // region R_i is the one that contains the face on the outer edge a_{i+1} a_{i-1}
  const regOf = [0, 1, 2].map((i) => { const a = (i + 1) % 3, b = (i + 2) % 3, e = ekey2(a, b), fi = byEdge.get(e); return fi ? lab[fi[0]] : -1; });
  const counts = [0, 0, 0]; const reg = new Int32Array(tri.length).fill(-1);
  tri.forEach((_, i) => { const r = regOf.indexOf(lab[i]); reg[i] = r; if (r >= 0) counts[r]++; });
  return { counts, reg, nl, bar };
}
/** Put relative positions pos[i] on the nodes of a kit graph G (vertex i = H.ids[i]) and fit them into the view. */
export function fitPos(G, H, pos) { H.ids.forEach((id, i) => { const nd = G.node(id); nd.x = pos[i][0]; nd.y = pos[i][1]; }); G.layout('fit'); }
/** Current drawing positions of the vertices of H (data coordinates). */
export const posOf = (G, H) => H.ids.map((id) => [G.node(id).x, G.node(id).y]);
/** Replace the contents of kit graph G by nodes and edges (arrays of pairs) with positions 'fit'. */
export function loadSpec(G, spec) { G.set({ nodes: spec.nodes.map((n) => ({ ...n })), edges: spec.edges.map((e) => (Array.isArray(e) ? [e[0], e[1]] : [e.from, e.to])) }); G.layout(spec.layout || 'none'); }
/** Intersection point of two segments, or null. */
export function segPoint(p, q, r, s) {
  const d = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]); if (!d) return null;
  const t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / d; return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])];
}
/** Spec of a graph given by relative positions P = [[x, y], …] and edge pairs. */
export const specOf = (P, E, lab = (i) => String(i + 1)) => ({ nodes: P.map(([x, y], i) => ({ id: i, x, y, label: lab(i) })), edges: E.map(([a, b]) => [a, b]), layout: 'fit' });

/** Normalised preset: {n, E (index pairs), pos (relative coordinates)} from a kit graph spec. */
export function norm(spec) { const H = ix(spec); return { n: H.n, E: H.E.map(([a, b]) => [a, b]), pos: H.nodes.map((q) => [q.x ?? 0, q.y ?? 0]) }; }
/** Contract the edge [a, b] of a simple graph given as {groups, E}: groups are lists of base vertices. Returns the new graph. */
export function contractG(g, a, b) {
  const map = new Int32Array(g.groups.length); let c = 0; const groups = [];
  for (let i = 0; i < g.groups.length; i++) { if (i === b) continue; map[i] = c++; groups.push(i === a ? g.groups[a].concat(g.groups[b]) : g.groups[i].slice()); }
  map[b] = map[a]; const seen = new Set(), E = [];
  for (const [x, y] of g.E) { const p = map[x], q = map[y]; if (p === q) continue; const k = ekey2(p, q); if (seen.has(k)) continue; seen.add(k); E.push([Math.min(p, q), Math.max(p, q)]); }
  return { groups, E };
}
/**
 * Spread out a crossing-free straight-line drawing of a connected plane graph (relative coordinates): vertices repel each
 * other and keep a weak pull towards the barycentre of their neighbours; a move is accepted only if no edge crosses
 * another and the set of faces stays the same, so the embedding never changes.
 */
export function spread(n, E, pos, iters = 80) {
  const H = ixE(n, E), P = pos.map((p) => [p[0], p[1]]), key = (Q) => faceWalks(H, Q).map((f) => f.key).sort().join('#'), k0 = key(P);
  const okMove = (v, np) => {
    const old = P[v]; P[v] = np;
    for (const [, k] of H.adj[v]) { const [a, b] = H.E[k]; for (let j = 0; j < H.m; j++) { if (j === k) continue; const [c, d] = H.E[j]; if (a === c || a === d || b === c || b === d) continue; if (segCross(P[a], P[b], P[c], P[d])) { P[v] = old; return false; } } }
    if (key(P) !== k0) { P[v] = old; return false; }
    return true;
  };
  for (let it = 0; it < iters; it++) for (let v = 0; v < n; v++) {
    let fx = 0, fy = 0;
    for (let w = 0; w < n; w++) { if (w === v) continue; const dx = P[v][0] - P[w][0], dy = P[v][1] - P[w][1], d2 = dx * dx + dy * dy + 0.01; fx += (0.05 * dx) / d2; fy += (0.05 * dy) / d2; }
    const nb = H.adj[v]; if (nb.length) { let mx = 0, my = 0; for (const [w] of nb) { mx += P[w][0]; my += P[w][1]; } mx /= nb.length; my /= nb.length; fx += 0.1 * (mx - P[v][0]); fy += 0.1 * (my - P[v][1]); }
    let s = 1; for (let t = 0; t < 5; t++, s /= 2) if (okMove(v, [P[v][0] + s * fx, P[v][1] + s * fy])) break;
  }
  return P;
}
