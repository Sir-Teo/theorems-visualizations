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

// The five-resistor bridge used by 2.1, 2.2 and 2.6: V1 drives T; R1 T→1; R2 T→2; R3 1→0; R4 2→0; R5 1→2 (the "bridge").
// leak: null | 'T' | '1' | '2' puts one extra resistor RL from that node to ground (drawn at the right-hand side).
export const BR = { V1: 10, R1: 1000, R2: 2000, R3: 2000, R4: 1000, R5: 1000 };
export function bridgeParts(vals = BR, leak = null, rl = 500) {
  const P = [
    { type: 'V', id: 'V1', name: 'V1', value: vals.V1, at: [0, 3, 0, 0] },
    { type: 'W', at: [0, 3, 2, 3] }, { type: 'W', at: [2, 3, 5, 3] }, { type: 'W', at: [0, 0, 5, 0] },
    { type: 'R', id: 'R1', name: 'R1', value: vals.R1, at: [2, 3, 2, 1.5] }, { type: 'R', id: 'R3', name: 'R3', value: vals.R3, at: [2, 1.5, 2, 0] },
    { type: 'R', id: 'R2', name: 'R2', value: vals.R2, at: [5, 3, 5, 1.5] }, { type: 'R', id: 'R4', name: 'R4', value: vals.R4, at: [5, 1.5, 5, 0] },
    { type: 'R', id: 'R5', name: 'R5', value: vals.R5, at: [2, 1.5, 5, 1.5], labelSide: -1 }, { type: 'GND', at: [2.5, 0] },
    { type: 'label', at: [1, 3], text: '$v_T$', dy: -9 }, { type: 'label', at: [2, 1.5], text: '$v_1$', dx: 30, dy: -6 }, { type: 'label', at: [5, 1.5], text: '$v_2$', dx: -30, dy: -6 },
  ];
  if (leak) {
    const y = leak === 'T' ? 3 : 1.5;
    P.push({ type: 'W', at: [0, 0, 6.3, 0] }, { type: 'W', at: [5, y, 6.3, y] }, { type: 'R', id: 'RL', name: 'leak', value: rl, at: [6.3, y, 6.3, 0], labelSide: 1 });
  }
  return P;
}
/** Net name of each labelled bridge node: T, 1, 2 and ground '0'. */
export function bridgeNodes(C) { const t = C.net.termNode; return { T: t.get('R1').a, 1: t.get('R1').b, 2: t.get('R2').b, 0: t.get('R3').b }; }
