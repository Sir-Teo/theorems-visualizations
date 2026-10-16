// Networks & Collective Behavior — Chapter 3: helpers shared by the chapter (plain named exports).
// Re-exports the chapter-2 helpers (real networkx datasets: karate club, Les Misérables, Florentine families, Southern women).
export * from './ch02.shared.js';
import { mkGraph, rng32, shuffle, deg } from './ch02.shared.js';

/** Krackhardt-kite shaped graph: the 10-node edge list of networkx's krackhardt_kite_graph (nodes 0..9 = A..J). */
export const KITE = { n: 10, edges: [[0, 1], [0, 2], [0, 3], [0, 5], [1, 3], [1, 4], [1, 6], [2, 3], [2, 5], [3, 4], [3, 5], [3, 6], [4, 6], [5, 6], [5, 7], [6, 7], [7, 8], [8, 9]] };
export const kite = () => mkGraph(KITE.n, KITE.edges);
export const letter = (i) => String.fromCharCode(65 + (i % 26));

// ---------- centralities ----------
/** Degree, closeness and betweenness (all normalised to [0,1]) of a connected graph. */
export function centralities(g, betw) {
  const n = g.n, d = deg(g), close = new Array(n).fill(0);
  for (let s = 0; s < n; s++) {
    const dist = new Array(n).fill(-1); dist[s] = 0; const q = [s]; let tot = 0, seen = 1;
    for (let h = 0; h < q.length; h++) { const u = q[h]; for (const w of g.adj[u]) if (dist[w] < 0) { dist[w] = dist[u] + 1; tot += dist[w]; seen++; q.push(w); } }
    close[s] = tot > 0 ? (seen - 1) / tot * ((seen - 1) / (n - 1)) : 0;
  }
  const sc = (n - 1) * (n - 2) / 2;
  return { degree: d.map((x) => x / (n - 1)), closeness: close, betweenness: betw.map((x) => x / sc) };
}

/** Leading eigenpair of the adjacency matrix by power iteration on A + I (same eigenvectors, avoids bipartite oscillation). */
export function leadingEigen(g, iters = 600) {
  let x = new Array(g.n).fill(1 / Math.sqrt(g.n));
  let lam = 0;
  for (let t = 0; t < iters; t++) {
    const y = x.map((xi, i) => xi + g.adj[i].reduce((s, j) => s + x[j], 0));
    const nrm = Math.hypot(...y); x = y.map((z) => z / nrm); lam = nrm - 1;
  }
  return { lambda: lam, vec: x };
}
/** Second-largest eigenvalue magnitude of A (via deflated power iteration on the symmetric matrix A - λ1 v1 v1ᵀ shifted). Returns |λ2| ratio estimate. */
export function secondRatio(g, lead) {
  const n = g.n; let x = Array.from({ length: n }, (_, i) => Math.sin(1 + 1.7 * i)); let lam = 0;
  const proj = (z) => { const c = z.reduce((s, zi, i) => s + zi * lead.vec[i], 0); return z.map((zi, i) => zi - c * lead.vec[i]); };
  x = proj(x);
  for (let t = 0; t < 800; t++) {
    let y = x.map((xi, i) => g.adj[i].reduce((s, j) => s + x[j], 0)); y = proj(y);
    const nrm = Math.hypot(...y); if (nrm < 1e-12) return 0; lam = nrm; x = y.map((z) => z / nrm);
  }
  return lam / lead.lambda;
}
/** One step of the eigenvector iteration x ← A x / ‖Ax‖ (plain, no shift) from x. */
export function eigStep(g, x) { const y = x.map((_, i) => g.adj[i].reduce((s, j) => s + x[j], 0)); const nrm = Math.hypot(...y) || 1; return y.map((z) => z / nrm); }
/** Katz scores: x = Σ_{k≥0} α^k A^k 1 (so x = 1 + αAx), by fixed-point iteration; converges for α < 1/λ1. */
export function katz(g, alpha, iters = 400) {
  let x = new Array(g.n).fill(1);
  for (let t = 0; t < iters; t++) x = x.map((_, i) => 1 + alpha * g.adj[i].reduce((s, j) => s + x[j], 0));
  return x;
}
export function pearson(a, b) {
  const n = a.length, ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
  let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; }
  return sab / Math.sqrt(saa * sbb || 1);
}

// ---------- directed web graphs: HITS and PageRank ----------
/** Kleinberg's hub/authority updates (a ← Aᵀh, h ← A a, each normalised to unit length) from all-ones. Returns history [{a,h}] for t = 0..T. */
export function hitsHistory(n, edges, T) {
  let a = new Array(n).fill(1), h = new Array(n).fill(1);
  const nz = (z) => { const m = Math.hypot(...z) || 1; return z.map((x) => x / m); };
  a = nz(a); h = nz(h);
  const hist = [{ a: a.slice(), h: h.slice() }];
  for (let t = 0; t < T; t++) {
    const a2 = new Array(n).fill(0); for (const [p, q] of edges) a2[q] += h[p];
    const h2 = new Array(n).fill(0); for (const [p, q] of edges) h2[p] += a2[q];
    a = nz(a2); h = nz(h2); hist.push({ a: a.slice(), h: h.slice() });
  }
  return hist;
}
/** PageRank with damping d and uniform teleport; dangling pages spread their rank uniformly. */
export function pageRank(n, edges, d = 0.85, iters = 200) {
  const out = new Array(n).fill(0); for (const [p] of edges) out[p]++;
  let r = new Array(n).fill(1 / n);
  for (let t = 0; t < iters; t++) {
    const nx = new Array(n).fill((1 - d) / n); let dang = 0;
    for (let i = 0; i < n; i++) if (!out[i]) dang += r[i];
    for (const [p, q] of edges) nx[q] += d * r[p] / out[p];
    for (let i = 0; i < n; i++) nx[i] += d * dang / n;
    r = nx;
  }
  return r;
}

// ---------- DeGroot learning ----------
/** Row-stochastic trust matrix from an undirected graph: weight `self` on yourself, the rest split equally over neighbours;
 *  `stubborn` (Set) puts weight 1 on oneself. Returns rows as sparse lists [[j, w], …]. */
export function trustRows(g, self, stubborn) {
  return g.adj.map((nb, i) => {
    if ((stubborn && stubborn.has(i)) || !nb.length) return [[i, 1]];
    return [[i, self], ...nb.map((j) => [j, (1 - self) / nb.length])];
  });
}
export function degrootStep(rows, x) { return rows.map((r) => r.reduce((s, [j, w]) => s + w * x[j], 0)); }
/** Influence vector s (left eigenvector of T with eigenvalue 1, Σ s = 1) by power iteration on a lazy chain. */
export function influence(rows, iters = 3000) {
  const n = rows.length; let s = new Array(n).fill(1 / n);
  for (let t = 0; t < iters; t++) {
    const nx = new Array(n).fill(0);
    for (let i = 0; i < n; i++) { for (const [j, w] of rows[i]) nx[j] += 0.5 * s[i] * w; nx[i] += 0.5 * s[i]; }
    s = nx;
  }
  const tot = s.reduce((a, b) => a + b, 0); return s.map((x) => x / tot);
}

/** Societies for the wise-crowds picture: returns trust rows for n agents. */
export function society(kind, n, seed = 5) {
  if (kind === 'complete') return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => [j, 1 / n]));
  if (kind === 'ring') {
    const k = 2; return Array.from({ length: n }, (_, i) => { const nb = []; for (let d = -k; d <= k; d++) nb.push(((i + d) % n + n) % n); return nb.map((j) => [j, 1 / nb.length]); });
  }
  if (kind === 'star') {
    return Array.from({ length: n }, (_, i) => (i === 0 ? Array.from({ length: n }, (_, j) => [j, 1 / n]) : [[0, 0.5], [i, 0.5]]));
  }
  if (kind === 'media') { // a prominent group of 3 that everybody listens to, and that listens to everybody
    const G = Math.min(3, n);
    return Array.from({ length: n }, (_, i) => {
      if (i < G) return Array.from({ length: n }, (_, j) => [j, 1 / n]);
      const own = [[i, 0.25], [(i + 1 - G) % (n - G) + G, 0.25]]; return [...own, ...Array.from({ length: G }, (_, j) => [j, 0.5 / G])];
    });
  }
  if (kind === 'pref') { // preferential attachment (m = 2), everyone weights self and neighbours equally
    const R = rng32(seed), E = [], rep = [];
    for (let i = 0; i < Math.min(n, 3); i++) for (let j = 0; j < i; j++) { E.push([i, j]); rep.push(i, j); }
    for (let v = 3; v < n; v++) { const ch = new Set(); while (ch.size < 2) ch.add(rep[Math.floor(R() * rep.length)]); for (const u of ch) { E.push([v, u]); rep.push(v, u); } }
    const g = mkGraph(n, E); return trustRows(g, 1 / 3).map((r, i) => { const d = g.adj[i].length + 1; return [[i, 1 / d], ...g.adj[i].map((j) => [j, 1 / d])]; });
  }
  return [];
}
/** Σ s_i² (the variance of the consensus when every signal has variance 1) and max influence. */
export function wisdomStats(rows) { const s = influence(rows, 1500); return { s, sumsq: s.reduce((a, x) => a + x * x, 0), max: Math.max(...s) }; }

// ---------- modularity and communities ----------
export function modularity(g, comm) {
  const m = g.edges.length; if (!m) return 0;
  const L = {}, D = {};
  for (const [a, b] of g.edges) { if (comm[a] === comm[b]) L[comm[a]] = (L[comm[a]] || 0) + 1; }
  for (let i = 0; i < g.n; i++) D[comm[i]] = (D[comm[i]] || 0) + g.adj[i].length;
  let q = 0; for (const c in D) q += (L[c] || 0) / m - (D[c] / (2 * m)) ** 2;
  return q;
}
/** Clauset–Newman–Moore style greedy agglomeration; returns the partition after every merge, with its Q (index 0 = singletons). */
export function greedyHistory(g) {
  const n = g.n, m = g.edges.length; let comm = Array.from({ length: n }, (_, i) => i);
  const hist = [{ comm: comm.slice(), q: modularity(g, comm), k: n }];
  for (let step = 0; step < n - 1; step++) {
    const D = {}, Lab = {};
    for (let i = 0; i < n; i++) D[comm[i]] = (D[comm[i]] || 0) + g.adj[i].length;
    for (const [a, b] of g.edges) if (comm[a] !== comm[b]) { const x = Math.min(comm[a], comm[b]), y = Math.max(comm[a], comm[b]); Lab[x + ',' + y] = (Lab[x + ',' + y] || 0) + 1; }
    let best = null, bd = -1e9;
    for (const key of Object.keys(Lab)) { const [x, y] = key.split(',').map(Number); const dq = Lab[key] / m - D[x] * D[y] / (2 * m * m); if (dq > bd + 1e-12) { bd = dq; best = [x, y]; } }
    if (!best) break;
    comm = comm.map((c) => (c === best[1] ? best[0] : c));
    hist.push({ comm: comm.slice(), q: modularity(g, comm), k: new Set(comm).size });
  }
  return hist;
}
/** Louvain method (local moving + aggregation) with a random visiting order; returns comm labels 0..k-1. */
export function louvain(g, R) {
  const n0 = g.n; let nodeComm = Array.from({ length: n0 }, (_, i) => i);
  let adj = g.adj.map((nb, i) => { const mp = new Map(); for (const j of nb) mp.set(j, 1); return mp; });
  const m2 = 2 * g.edges.length;
  for (let level = 0; level < 10; level++) {
    const n = adj.length, k = adj.map((mp) => { let s = 0; for (const [j, w] of mp) s += w; return s; }); // self-loops counted once in mp with weight 2*loops
    const c = Array.from({ length: n }, (_, i) => i), tot = k.slice();
    let moved = true, any = false, guard = 0;
    while (moved && guard++ < 50) {
      moved = false;
      for (const i of shuffle(Array.from({ length: n }, (_, t) => t), R)) {
        const wc = new Map(); for (const [j, w] of adj[i]) if (j !== i) wc.set(c[j], (wc.get(c[j]) || 0) + w);
        const old = c[i]; tot[old] -= k[i];
        let bc = old, bg = (wc.get(old) || 0) - tot[old] * k[i] / m2;
        for (const [cc, w] of wc) { const gain = w - tot[cc] * k[i] / m2; if (gain > bg + 1e-12) { bg = gain; bc = cc; } }
        tot[bc] += k[i]; if (bc !== old) { c[i] = bc; moved = true; any = true; }
      }
    }
    if (!any) break;
    const ids = [...new Set(c)], idx = new Map(ids.map((x, t) => [x, t]));
    nodeComm = nodeComm.map((x) => idx.get(c[x]));
    const na = ids.map(() => new Map());
    for (let i = 0; i < n; i++) for (const [j, w] of adj[i]) { const a = idx.get(c[i]), b = idx.get(c[j]); na[a].set(b, (na[a].get(b) || 0) + w); }
    adj = na;
  }
  const ids = [...new Set(nodeComm)], idx = new Map(ids.map((x, t) => [x, t]));
  return nodeComm.map((x) => idx.get(x));
}
export function bestLouvain(g, tries = 60, seed = 1) {
  const R = rng32(seed); let best = null, bq = -1;
  for (let t = 0; t < tries; t++) { const c = louvain(g, R), q = modularity(g, c); if (q > bq + 1e-12) { bq = q; best = c; } }
  return best;
}
/** Best two-group split by repeated single-node moves from random starts (small graphs). */
export function bestBisection(g, tries = 150, seed = 2) {
  const R = rng32(seed); let best = null, bq = -1;
  for (let t = 0; t < tries; t++) {
    const c = Array.from({ length: g.n }, () => (R() < 0.5 ? 0 : 1)); let cur = modularity(g, c), imp = true, guard = 0;
    while (imp && guard++ < 100) { imp = false; for (let i = 0; i < g.n; i++) { c[i] ^= 1; const q = modularity(g, c); if (q > cur + 1e-12) { cur = q; imp = true; } else c[i] ^= 1; } }
    if (cur > bq + 1e-12) { bq = cur; best = c.slice(); }
  }
  return best;
}

// ---------- exchange networks (1-exchange rule): stable and balanced outcomes ----------
function maximalMatchings(n, edges) {
  const out = [];
  (function rec(i, used, cur) {
    if (i === edges.length) {
      for (const [a, b] of edges) if (!used[a] && !used[b]) return; // not maximal
      out.push(cur.slice()); return;
    }
    const [a, b] = edges[i];
    if (!used[a] && !used[b]) { used[a] = used[b] = true; cur.push(i); rec(i + 1, used, cur); cur.pop(); used[a] = used[b] = false; }
    rec(i + 1, used, cur);
  })(0, new Array(n).fill(false), []);
  return out;
}
/** For every maximal matching, run the outside-option dynamics x_u ← α_u + (1 − α_u − α_v)/2 on each matched edge
 *  (α = best outside option, unmatched nodes hold 0). Returns {outcomes: [{match, x, balanced, stable}], ...}.
 *  Outcomes with `ok` true are stable and balanced (fixed point of the dynamics, no instability). */
export function exchangeOutcomes(n, edges) {
  const res = [];
  for (const M of maximalMatchings(n, edges)) {
    const partner = new Array(n).fill(-1); for (const e of M) { partner[edges[e][0]] = edges[e][1]; partner[edges[e][1]] = edges[e][0]; }
    const nb = Array.from({ length: n }, () => []); for (const [a, b] of edges) { nb[a].push(b); nb[b].push(a); }
    let x = new Array(n).fill(0); for (const e of M) { x[edges[e][0]] = 0.5; x[edges[e][1]] = 0.5; }
    const alpha = (u, v, xs) => { let a = 0; for (const w of nb[u]) if (w !== v) a = Math.max(a, 1 - xs[w]); return a; };
    let feasible = true, conv = false;
    for (let it = 0; it < 400 && feasible; it++) {
      const nx = x.slice();
      for (const e of M) {
        const [u, v] = edges[e], au = alpha(u, v, x), av = alpha(v, u, x);
        if (au + av > 1 + 1e-9) { feasible = false; break; }
        nx[u] = au + (1 - au - av) / 2; nx[v] = av + (1 - au - av) / 2;
      }
      if (!feasible) break;
      let d = 0; for (let i = 0; i < n; i++) d = Math.max(d, Math.abs(nx[i] - x[i])); x = nx;
      if (d < 1e-12) { conv = true; break; }
    }
    let stable = feasible && conv;
    if (stable) for (const [a, b] of edges) if (partner[a] !== b && x[a] + x[b] < 1 - 1e-9) stable = false;
    res.push({ match: M.map((e) => edges[e]), x, partner, ok: stable });
  }
  return res;
}
