// Graph Theory (Diestel) — Chapter 5, part Z (§§5.4–5.6: list colouring, perfect graphs, χ-bounded classes): helpers
// shared by ch05-z.js and ch05-z2.js. Re-exports the chapter 1–4 toolbox. Everything works on small graphs given as
// adjacency bit masks A[v] (n ≤ 24); vertex sets are bit masks; colour lists are bit masks of colour indices.
export * from './ch04-z.shared.js';
import { ix, K, popc, bitsOf, compMasks } from './ch04-z.shared.js';

export const CP = ['blue', 'orange', 'purple', 'teal', 'pink', 'gold', 'green', 'red'];
export const bit = (v) => 1 << v;
export const lowBit = (m) => 31 - Math.clz32(m & -m);
export const full = (n) => (n >= 31 ? -1 : (1 << n) - 1);
/** Adjacency masks of the graph on 0..n-1 with edge list E. */
export function masksOf(n, E) { const A = new Array(n).fill(0); for (const [a, b] of E) if (a !== b) { A[a] |= 1 << b; A[b] |= 1 << a; } return A; }
export const edgesOf = (A) => { const E = []; for (let a = 0; a < A.length; a++) for (let b = a + 1; b < A.length; b++) if (A[a] >> b & 1) E.push([a, b]); return E; };
export const complementA = (A) => A.map((m, v) => ~m & full(A.length) & ~(1 << v));
/** Masks of a kit graph G (vertices in G.nodes order). */
export function masksOfG(G) { const H = ix(G); return { H, n: H.n, A: masksOf(H.n, H.E.map(([a, b]) => [a, b])) }; }

// ---------------------------------------------------------------- cliques, colourings
/** A maximum clique inside the vertex set S (mask). */
export function maxClique(A, S) {
  let best = 0, bs = 0;
  const go = (R, rs, P) => {
    if (rs > bs) { bs = rs; best = R; }
    while (P) { if (rs + popc(P) <= bs) return; const v = lowBit(P); go(R | (1 << v), rs + 1, P & A[v]); P &= ~(1 << v); }
  };
  go(0, 0, S); return best;
}
export const omegaOf = (A, S) => popc(maxClique(A, S));
export const alphaOf = (A, S) => popc(maxClique(complementA(A), S));
/**
 * Proper colouring of the vertices in S from the lists L[v] (masks of allowed colours); null if none (or `timeout: true`
 * if the work cap was hit). Dynamic most-constrained-vertex order.
 */
export function listColour(A, S, L, cap = 3e5) {
  const n = A.length, col = new Int8Array(n).fill(-1); let work = 0, out = false;
  const rec = (left) => {
    if (!left) return true;
    if (++work > cap) { out = true; return false; }
    let best = -1, bm = 0, bc = 99;
    for (let m = left; m; m &= m - 1) {
      const v = lowBit(m); let al = L[v];
      for (let u = A[v] & S & ~left; u; u &= u - 1) al &= ~(1 << col[lowBit(u)]);
      const c = popc(al); if (c < bc) { bc = c; best = v; bm = al; if (!c) return false; }
    }
    for (let m = bm; m; m &= m - 1) { const c = lowBit(m); col[best] = c; if (rec(left & ~(1 << best))) return true; if (out) return false; }
    col[best] = -1; return false;
  };
  const ok = rec(S);
  if (out) return { timeout: true };
  return ok ? col : null;
}
/** Number of list colourings, counted up to `cap` (stops early). */
export function countListColourings(A, S, L, cap = 200) {
  const n = A.length, col = new Int8Array(n).fill(-1); let cnt = 0;
  const rec = (left) => {
    if (cnt >= cap) return;
    if (!left) { cnt++; return; }
    let best = -1, bm = 0, bc = 99;
    for (let m = left; m; m &= m - 1) {
      const v = lowBit(m); let al = L[v];
      for (let u = A[v] & S & ~left; u; u &= u - 1) al &= ~(1 << col[lowBit(u)]);
      const c = popc(al); if (c < bc) { bc = c; best = v; bm = al; if (!c) return; }
    }
    for (let m = bm; m; m &= m - 1) { col[best] = lowBit(m); rec(left & ~(1 << best)); }
    col[best] = -1;
  };
  rec(S); return cnt;
}
const COL_CACHE = new Map();
/** Optimal colouring of the subgraph induced on S: {chi, col}. */
export function chiColour(A, S) {
  if (!S) return { chi: 0, col: new Int8Array(A.length).fill(-1) };
  const key = A.join(',') + '|' + S, hit = COL_CACHE.get(key); if (hit) return hit;
  const lo = Math.max(1, omegaOf(A, S));
  for (let k = lo; k <= popc(S); k++) {
    const col = listColour(A, S, A.map(() => (1 << k) - 1), 1e6);
    if (col && !col.timeout) { const r = { chi: k, col }; if (COL_CACHE.size > 4000) COL_CACHE.clear(); COL_CACHE.set(key, r); return r; }
  }
  return { chi: popc(S), col: new Int8Array(A.length).fill(-1) };
}
export const chiOf = (A, S) => chiColour(A, S).chi;
/** Every induced subgraph: [{S, size, w, chi, a}] for n ≤ 12 (S ranges over all non-empty vertex sets). */
export function scanInduced(A) {
  const n = A.length, rows = [], C = complementA(A);
  for (let S = 1; S < (1 << n); S++) rows.push({ S, size: popc(S), w: omegaOf(A, S), chi: chiOf(A, S), a: omegaOf(C, S) });
  return rows;
}
/** Smallest induced subgraph (fewest vertices) with χ > ω, or null: the graph is perfect when null. */
export function imperfectWitness(rows) { let b = null; for (const r of rows) if (r.chi > r.w && (!b || r.size < b.size)) b = r; return b; }

// ---------------------------------------------------------------- holes, chordality
/** All chordless cycles of length ≥ minLen inside S (each once), as vertex arrays in cyclic order; capped. */
export function holesIn(A, S = full(A.length), minLen = 4, cap = 400) {
  const out = [];
  const go = (path, pm) => {
    if (out.length >= cap) return;
    const last = path[path.length - 1], s = path[0], inner = pm & ~(1 << last) & ~(1 << s);
    for (let c = A[last] & S & ~pm & ~((1 << (s + 1)) - 1); c; c &= c - 1) {
      const w = lowBit(c);
      if (path.length >= 2 && (A[w] & inner)) continue;
      if (path.length === 1) { go([s, w], pm | (1 << w)); continue; }
      if (A[w] & (1 << s)) { if (path.length >= 3 && path[1] < w) out.push([...path, w]); continue; }
      go([...path, w], pm | (1 << w));
    }
  };
  for (let s = 0; s < A.length; s++) if (S >> s & 1) go([s], 1 << s);
  return out.filter((c) => c.length >= minLen);
}
export const oddHoles = (A, S) => holesIn(A, S, 5).filter((c) => c.length % 2);
/** Odd antiholes (odd holes of the complement), length ≥ 5. */
export const oddAntiholes = (A, S) => oddHoles(complementA(A), S);
/** Maximum cardinality search: visiting order; the graph on S is chordal iff each vertex's earlier neighbours form a clique. */
export function mcs(A, S) {
  const order = [], seen = []; let left = S; const w = new Array(A.length).fill(0);
  while (left) {
    let b = -1; for (let m = left; m; m &= m - 1) { const v = lowBit(m); if (b < 0 || w[v] > w[b]) b = v; }
    order.push(b); left &= ~(1 << b); for (let u = A[b] & left; u; u &= u - 1) w[lowBit(u)]++;
  }
  let chordal = true, mask = 0;
  const isClq = (m) => { for (let x = m; x; x &= x - 1) { const v = lowBit(x); if ((m & ~(1 << v)) & ~A[v]) return false; } return true; };
  for (const v of order) { if (!isClq(A[v] & mask)) { chordal = false; } mask |= 1 << v; seen.push(v); }
  return { order, chordal };
}
/** Smallest clique C ⊆ S with S∖C disconnected: {C, parts: [mask ∪ C]}; null if S is complete or has no clique cut. */
export function cliqueSplit(A, S) {
  const comps0 = compMasks(A, S); if (comps0.length > 1) return { C: 0, parts: comps0 };
  let best = null;
  for (let C = S; ; C = (C - 1) & S) {
    if (C) {
      let ok = true; for (let x = C; x && ok; x &= x - 1) { const v = lowBit(x); if ((C & ~(1 << v)) & ~A[v]) ok = false; }
      if (ok) { const cs = compMasks(A, S & ~C); if (cs.length > 1 && (!best || popc(C) < popc(best.C))) best = { C, parts: cs.map((p) => p | C) }; }
    }
    if (!C) break;
  }
  return best;
}
/** Longest induced path (vertex count) starting at v inside S; returns the path. */
export function longestInducedPathFrom(A, S, v) {
  let best = [v];
  const go = (path, pm) => {
    if (path.length > best.length) best = path.slice();
    const last = path[path.length - 1], inner = pm & ~(1 << last);
    for (let c = A[last] & S & ~pm; c; c &= c - 1) { const w = lowBit(c); if (A[w] & inner) continue; path.push(w); go(path, pm | (1 << w)); path.pop(); }
  };
  go([v], 1 << v); return best;
}
/** Is there an induced path on k vertices inside S? returns the vertex mask or 0. */
export function inducedPath(A, S, k) {
  for (let s = 0; s < A.length; s++) if (S >> s & 1) {
    let found = 0;
    const go = (path, pm) => {
      if (found) return;
      if (path.length === k) { found = pm; return; }
      const last = path[path.length - 1], inner = pm & ~(1 << last);
      for (let c = A[last] & S & ~pm; c; c &= c - 1) { const w = lowBit(c); if (A[w] & inner) continue; path.push(w); go(path, pm | (1 << w)); path.pop(); if (found) return; }
    };
    go([s], 1 << s); if (found) return found;
  }
  return 0;
}
/** Induced copy of the small graph T (masks TA on k vertices) inside S: returns the vertex mask or 0. */
export function inducedCopy(A, S, TA) {
  const k = TA.length, img = new Array(k).fill(-1); let found = 0;
  const go = (i, used) => {
    if (found) return;
    if (i === k) { found = used; return; }
    for (let c = S & ~used; c; c &= c - 1) {
      const w = lowBit(c); let ok = true;
      for (let j = 0; j < i && ok; j++) if (((A[w] >> img[j]) & 1) !== ((TA[i] >> j) & 1)) ok = false;
      if (ok) { img[i] = w; go(i + 1, used | (1 << w)); if (found) return; }
    }
  };
  go(0, 0); return found;
}
/** Delete random vertices from the found forbidden copies until `find(S)` returns 0; returns the kept mask S. */
export function repairFree(n, find, rng, S0 = full(n)) {
  let S = S0, m;
  while ((m = find(S))) { const vs = bitsOf(m); S &= ~(1 << vs[Math.floor(rng() * vs.length)]); }
  return S;
}
/** Relabel the subgraph induced on S as 0..k-1: {n, E, ids (new → old)}. */
export function inducedE(A, S) {
  const ids = bitsOf(S), at = new Map(ids.map((v, i) => [v, i])), E = [];
  ids.forEach((a, i) => ids.forEach((b, j) => { if (i < j && (A[a] >> b & 1)) E.push([i, j]); }));
  return { n: ids.length, E, ids, at };
}
/** Random G(n, p) as masks. */
export function randomA(n, p, rng) { const A = new Array(n).fill(0); for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (rng() < p) { A[i] |= 1 << j; A[j] |= 1 << i; } return A; }
/** Mycielski graph: duplicates of every vertex plus an apex. */
export function mycielski(n, E) {
  const E2 = E.map(([a, b]) => [a, b]);
  for (const [a, b] of E) { E2.push([a, n + b], [b, n + a]); }
  for (let i = 0; i < n; i++) E2.push([n + i, 2 * n]);
  return { n: 2 * n + 1, E: E2 };
}

// ---------------------------------------------------------------- kernels (digraphs given by out-masks O[v])
export function isKernel(O, S, K) {
  if (K & ~S) return false;
  for (let x = K; x; x &= x - 1) if (O[lowBit(x)] & K) return false; // an arc inside K
  for (let x = S & ~K; x; x &= x - 1) if (!(O[lowBit(x)] & K)) return false; // every outside vertex sends an arc into K
  return true;
}
/** All kernels of the subdigraph induced on S (S ≤ 14 vertices). */
export function allKernels(O, S) {
  const out = [];
  for (let K = S; ; K = (K - 1) & S) { if (isKernel(O, S, K)) out.push(K); if (!K) break; }
  return out;
}
export const hasKernel = (O, S) => { for (let K = S; ; K = (K - 1) & S) { if (isKernel(O, S, K)) return K; if (!K) break; } return -1; };

// ---------------------------------------------------------------- drawing
/** Small colour chips (a colour list) above a vertex of kit graph G on stage s; `pal` = palette names, `L` = mask. */
export function chips(v, s, G, id, L, o = {}) {
  const nd = G.node(id); if (!nd) return;
  const cols = bitsOf(L), c = s.ctx, r = o.r ?? 4.2, gap = o.gap ?? 11, X0 = s.X(nd.x) - ((cols.length - 1) * gap) / 2, Y0 = s.Y(nd.y) + (o.dy ?? -26);
  c.save();
  cols.forEach((k, i) => {
    c.beginPath(); c.arc(X0 + i * gap, Y0, r, 0, 2 * Math.PI); c.fillStyle = v.color(CP[k % CP.length], o.dim ? 0.35 : 1); c.fill();
    if (o.mark != null && o.mark === k) { c.lineWidth = 2; c.strokeStyle = v.color('ink'); c.stroke(); }
  });
  c.restore();
}
/** Mark a set of vertices (mask over G's index order) with a square outline. */
export function ring(v, s, G, ids, color, half = 17) {
  const c = s.ctx; c.save(); c.strokeStyle = v.color(color); c.lineWidth = 2.4;
  for (const id of ids) { const n = G.node(id); if (!n) continue; c.beginPath(); c.arc(s.X(n.x), s.Y(n.y), half - 1, 0, 2 * Math.PI); c.stroke(); }
  c.restore();
}
/** Kit-graph spec from n relative positions and an edge list (layout 'fit'). */
export const gspec = (P, E) => ({ nodes: P.map(([x, y], i) => ({ id: i, x, y, label: String(i + 1) })), edges: E.map(([a, b]) => [a, b]), layout: 'fit' });
export const ringP = (n, R = 1, a0 = Math.PI / 2, cx = 0, cy = 0) => Array.from({ length: n }, (_, i) => [cx + R * Math.cos(a0 - (2 * Math.PI * i) / n), cy + R * Math.sin(a0 - (2 * Math.PI * i) / n)]);
export const cycE = (n) => Array.from({ length: n }, (_, i) => [i, (i + 1) % n]);

/** A gallery of small named graphs: {P: positions, E: edges, label}. */
export const GAL = {
  c4: () => ({ P: ringP(4), E: cycE(4) }),
  c5: () => ({ P: ringP(5), E: cycE(5) }),
  c6: () => ({ P: ringP(6), E: cycE(6) }),
  c7: () => ({ P: ringP(7), E: cycE(7) }),
  c7c: () => { const g = GAL.c7(); const A = masksOf(7, g.E); return { P: g.P, E: edgesOf(complementA(A)) }; },
  c5c: () => ({ P: ringP(5), E: edgesOf(complementA(masksOf(5, cycE(5)))) }),
  p5: () => ({ P: Array.from({ length: 5 }, (_, i) => [i - 2, 0.2 * (i % 2)]), E: [[0, 1], [1, 2], [2, 3], [3, 4]] }),
  k4: () => ({ P: [...ringP(3, 1.2, Math.PI / 2), [0, 0]], E: edgesOf(complementA(new Array(4).fill(0))) }),
  k33: () => ({ P: [[-1, 1], [0, 1], [1, 1], [-1, -1], [0, -1], [1, -1]], E: [0, 1, 2].flatMap((a) => [3, 4, 5].map((b) => [a, b])) }),
  house: () => ({ P: [[-1, 0], [1, 0], [1, -1.8], [-1, -1.8], [0, 1.1]], E: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4]] }),
  wheel5: () => ({ P: [...ringP(5, 1), [0, 0]], E: [...cycE(5), ...[0, 1, 2, 3, 4].map((i) => [i, 5])] }),
  bull: () => ({ P: [[-1, 0], [1, 0], [0, 1.3], [-1.9, 1.2], [1.9, 1.2]], E: [[0, 1], [0, 2], [1, 2], [0, 3], [1, 4]] }),
  petersen: () => ({ P: [...ringP(5, 1), ...ringP(5, 0.5)], E: [...cycE(5), ...[0, 1, 2, 3, 4].map((i) => [i, i + 5]), ...[0, 1, 2, 3, 4].map((i) => [5 + i, 5 + ((i + 2) % 5)])] }),
  grotzsch: () => { const M = mycielski(5, cycE(5)); return { P: [...ringP(5, 1), ...ringP(5, 0.62), [0, 0]], E: M.E }; },
  sun3: () => ({ P: [[-0.6, 0], [0.6, 0], [0, 1], [-1.6, 1.2], [1.6, 1.2], [0, -1.4]], E: [[0, 1], [0, 2], [1, 2], [0, 3], [2, 3], [1, 4], [2, 4], [0, 5], [1, 5]] }),
  tree: () => ({ P: [[0, 1.6], [-1.4, 0.4], [1.4, 0.4], [-2.2, -1], [-0.7, -1], [1.4, -1], [2.4, -1]], E: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]] }),
  fan: () => ({ P: [[0, 1.5], [-2, 0], [-0.7, 0], [0.7, 0], [2, 0], [0, -1.4]], E: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3], [3, 4], [5, 1], [5, 2], [5, 3], [5, 4]] }),
};

/** Kit-graph spec with positions fitted (aspect kept) into the data rectangle rect = [x0, y0, x1, y1] of a gstage. */
export function placed(P, E, rect = [1.4, 1.5, 8.6, 5.9], lab = (i) => String(i + 1)) {
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const sc = Math.min((rect[2] - rect[0]) / Math.max(x1 - x0, 1e-9), (rect[3] - rect[1]) / Math.max(y1 - y0, 1e-9));
  const cx = (rect[0] + rect[2]) / 2 - (sc * (x0 + x1)) / 2, cy = (rect[1] + rect[3]) / 2 - (sc * (y0 + y1)) / 2;
  return { nodes: P.map(([x, y], i) => ({ id: i, x: cx + sc * x, y: cy + sc * y, label: lab(i) })), edges: E.map(([a, b]) => [a, b]), layout: 'none' };
}
/** Is the point p inside the polygon (ray casting)? */
export function inPoly(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
/** Out-masks of the digraph of a directed kit graph (vertex index = position in G.nodes). */
export function outMasks(G) {
  const at = new Map(G.nodes.map((nd, i) => [K(nd.id), i])), O = new Array(G.nodes.length).fill(0);
  for (const e of G.edges) { const a = at.get(K(e.from)), b = at.get(K(e.to)); if (a != null && b != null && a !== b) O[a] |= 1 << b; }
  return O;
}
/** Deterministic seeded random generator (small, for list assignments that must not depend on the viz clock). */
export const rnd = (seed) => { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
/** Random subset of {0..q-1} with exactly k elements as a mask. */
export function randList(q, k, r) { const a = Array.from({ length: q }, (_, i) => i); for (let i = q - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } let m = 0; for (let i = 0; i < Math.min(k, q); i++) m |= 1 << a[i]; return m; }

// ---------------------------------------------------------------- Galvin's orientation of the line graph of a bipartite graph
/**
 * Bipartite graph on 0..n-1 with edge list E and sides side[v] ∈ {0, 1} (edges go between the sides), and a proper edge
 * colouring ec[k] (0-based). Line graph masks LA, the orientation O (e → e' if e and e' meet at an X-vertex and e' has the
 * smaller colour, or at a Y-vertex and e' has the larger colour), and stable-matching kernels of induced subdigraphs.
 */
export function galvin(n, E, side, ec) {
  const m = E.length, LA = new Array(m).fill(0), O = new Array(m).fill(0), at = [];
  for (let v = 0; v < n; v++) at.push([]);
  E.forEach(([a, b], k) => { at[a].push(k); at[b].push(k); });
  const xOf = E.map(([a, b]) => (side[a] === 0 ? a : b));
  for (let v = 0; v < n; v++) for (const e of at[v]) for (const f of at[v]) if (e !== f) {
    LA[e] |= 1 << f;
    if (side[v] === 0 ? ec[f] < ec[e] : ec[f] > ec[e]) O[e] |= 1 << f;
  }
  /** Stable matching (X proposes, lower colours first; Y prefers higher colours) in the edge set U; returns a mask of edges. */
  function kernelOf(U) {
    const prop = new Map(), ptr = new Map(), hold = new Map(); let free = [];
    for (let k = 0; k < m; k++) if (U >> k & 1) { const x = xOf[k]; if (!prop.has(x)) prop.set(x, []); prop.get(x).push(k); }
    for (const [x, l] of prop) { l.sort((p, q) => ec[p] - ec[q]); ptr.set(x, 0); free.push(x); }
    while (free.length) {
      const x = free.pop(), l = prop.get(x);
      while (ptr.get(x) < l.length) {
        const e = l[ptr.get(x)]; ptr.set(x, ptr.get(x) + 1);
        const y = E[e][0] === x ? E[e][1] : E[e][0], cur = hold.get(y);
        if (cur == null) { hold.set(y, e); break; }
        if (ec[e] > ec[cur]) { hold.set(y, e); free.push(xOf[cur]); break; }
      }
    }
    let M = 0; for (const e of hold.values()) M |= 1 << e; return M;
  }
  return { m, LA, O, kernelOf, xOf };
}
/** Colour-by-colour list colouring of the line graph via kernels (the proof of the list lemma): returns {col, steps} or {stuck}. */
export function kernelColouring(Gv, L0, q) {
  const L = L0.slice(); let alive = full(Gv.m); const col = new Int8Array(Gv.m).fill(-1), steps = [];
  for (let c = 0; c < q && alive; c++) {
    let U = 0; for (let e = 0; e < Gv.m; e++) if ((alive >> e & 1) && (L[e] >> c & 1)) U |= 1 << e;
    if (!U) continue;
    const Kk = Gv.kernelOf(U); if (!Kk) return { stuck: true, col, steps };
    steps.push({ c, U, K: Kk });
    for (let e = 0; e < Gv.m; e++) { if (Kk >> e & 1) col[e] = c; else if (U >> e & 1) L[e] &= ~(1 << c); }
    alive &= ~Kk;
  }
  return alive ? { stuck: true, col, steps } : { col, steps };
}

/** Spread a plane straight-line drawing: repulsion between vertices, springs along edges, pinned vertices fixed; a step is undone if it creates a crossing. */
export function relaxPlane(n, E, P0, pinned = [], iters = 160) {
  const H = ixE(n, E); let P = P0.map((p) => p.slice()), step = 0.02; const pin = new Set(pinned);
  const sc = Math.sqrt(1 / n) * 1.4;
  for (let it = 0; it < iters; it++) {
    const F = P.map(() => [0, 0]);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], d2 = dx * dx + dy * dy + 1e-6, f = (sc * sc) / d2;
      F[i][0] += f * dx; F[i][1] += f * dy; F[j][0] -= f * dx; F[j][1] -= f * dy;
    }
    for (const [a, b] of E) { const dx = P[b][0] - P[a][0], dy = P[b][1] - P[a][1], d = Math.hypot(dx, dy) + 1e-9, f = (d * d) / (sc * 6); F[a][0] += (f * dx) / d; F[a][1] += (f * dy) / d; F[b][0] -= (f * dx) / d; F[b][1] -= (f * dy) / d; }
    let Q = P.map((p, i) => (pin.has(i) ? p : [p[0] + step * F[i][0], p[1] + step * F[i][1]]));
    let tries = 0; while (crossings(H, Q).length && tries++ < 6) { step *= 0.5; Q = P.map((p, i) => (pin.has(i) ? p : [p[0] + step * F[i][0], p[1] + step * F[i][1]])); }
    if (!crossings(H, Q).length) P = Q; step = Math.min(step * 1.1, 0.05);
  }
  return P;
}
