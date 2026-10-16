// Circuits — Chapter 2: helpers shared by ch02.js, ch02-b.js and ch02-c.js
export * from './ch01.shared.js';

/** Gaussian elimination with partial pivoting; returns x with A x = b, or null if A is singular. */
export function gauss(A, b) {
  const n = A.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-13) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}

/** Determinant by elimination (0 for a singular matrix). */
export function det(A) {
  const n = A.length, M = A.map((r) => [...r]); let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-13) return 0;
    if (p !== c) { [M[c], M[p]] = [M[p], M[c]]; d = -d; }
    d *= M[c][c];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; if (f) for (let k = c; k < n; k++) M[r][k] -= f * M[c][k]; }
  }
  return d;
}

/** Weighted graph Laplacian; edges are {a, b, g} (conductance g), self-loops ignored. */
export function laplacian(n, edges) {
  const L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const e of edges) if (e.a !== e.b) { L[e.a][e.a] += e.g; L[e.b][e.b] += e.g; L[e.a][e.b] -= e.g; L[e.b][e.a] -= e.g; }
  return L;
}

/** Remove row and column `ref`. */
export const reduce = (L, ref) => L.filter((_, i) => i !== ref).map((r) => r.filter((_, j) => j !== ref));

/** Node potentials (reference node ref at 0) when the currents inj[i] (summing to zero) are injected; null if singular. */
export function solveNet(n, edges, inj, ref = 0) {
  const A = reduce(laplacian(n, edges), ref), b = inj.filter((_, i) => i !== ref), x = gauss(A, b);
  if (!x) return null;
  const phi = new Array(n).fill(0); let k = 0; for (let i = 0; i < n; i++) if (i !== ref) phi[i] = x[k++];
  return phi;
}

/** Effective resistance between nodes a and b (unit current in, unit out). Infinity if they are not connected. */
export function reff(n, edges, a, b) {
  const inj = new Array(n).fill(0); inj[a] = 1; inj[b] = -1;
  const phi = solveNet(n, edges, inj, b);
  return phi ? phi[a] - phi[b] : Infinity;
}

/** Connected components: returns comp[i] = representative label. */
export function components(n, edges) {
  const p = [...Array(n).keys()], f = (x) => (p[x] === x ? x : (p[x] = f(p[x])));
  for (const e of edges) p[f(e.a)] = f(e.b);
  return p.map((_, i) => f(i));
}

/** All acyclic subsets of k edges (indices), each with its union-find labelling. */
export function forests(n, edges, k) {
  const out = [];
  const rec = (start, chosen, lab) => {
    if (chosen.length === k) { out.push({ idx: [...chosen], lab }); return; }
    if (edges.length - start < k - chosen.length) return;
    for (let i = start; i < edges.length; i++) {
      const e = edges[i], la = lab[e.a], lb = lab[e.b];
      if (la === lb) continue;
      chosen.push(i); rec(i + 1, chosen, lab.map((x) => (x === lb ? la : x))); chosen.pop();
    }
  };
  rec(0, [], [...Array(n).keys()]);
  return out;
}

/** Simple cycles of a multigraph as {nodes: [v0, v1, …], edges: [e0, e1, …]} (edge k joins nodes k and k+1 cyclically), each once. */
export function simpleCycles(n, edges, limit = 400) {
  const out = [], adj = Array.from({ length: n }, () => []);
  edges.forEach((e, k) => { if (e.a !== e.b) { adj[e.a].push([e.b, k]); adj[e.b].push([e.a, k]); } });
  for (let s = 0; s < n && out.length < limit; s++) {
    const nodes = [s], es = [], seen = new Set([s]);
    const dfs = (u) => {
      for (const [w, k] of adj[u]) {
        if (out.length >= limit) return;
        if (es.length && k === es[es.length - 1]) continue;
        if (w === s) { if (es.length >= 1 && es[0] < k) out.push({ nodes: [...nodes], edges: [...es, k] }); continue; }
        if (w > s && !seen.has(w)) { seen.add(w); nodes.push(w); es.push(k); dfs(w); es.pop(); nodes.pop(); seen.delete(w); }
      }
    };
    dfs(s);
  }
  return out;
}

/** Small named networks; pos in the unit square (y up). */
export const NETS = {
  bridge: { label: 'bridge', names: ['A', 'B', 'C', 'D'], pos: [[0, 0.5], [0.5, 1], [0.5, 0], [1, 0.5]], edges: [[0, 1], [0, 2], [1, 3], [2, 3], [1, 2]] },
  k4: { label: '$K_4$', names: ['A', 'B', 'C', 'D'], pos: [[0, 0], [1, 0], [1, 1], [0, 1]], edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]] },
  k23: { label: '$K_{2,3}$', names: ['A', 'B', 'C', 'D', 'E'], pos: [[0, 0.5], [1, 0.5], [0.5, 1], [0.5, 0.5], [0.5, 0]], edges: [[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4]] },
  ladder: { label: 'ladder', names: ['A', 'B', 'C', 'D', 'E', 'F'], pos: [[0, 1], [1, 1], [2, 1], [0, 0], [1, 0], [2, 0]], edges: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5]] },
};
NETS.grid3 = {
  label: '3×3 grid', names: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
  pos: Array.from({ length: 9 }, (_, i) => [i % 3, 2 - Math.floor(i / 3)]),
  edges: [[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [5, 8]],
};
