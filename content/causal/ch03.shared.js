// Causal Inference — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
//
// Graph helpers work on index graphs: n nodes 0..n-1 and `edges` = [[from, to], …] (a directed graph, normally acyclic).
// Linear-Gaussian structural models give exact covariances, so d-separation can be checked against exact partial correlations.
export * from './ch02.shared.js';
import { rng, solveSmall } from './ch02.shared.js';

export const LETTERS = 'ABCDEFGHIJ';

export function parentsOf(n, edges) { const p = Array.from({ length: n }, () => []); for (const [a, b] of edges) p[b].push(a); return p; }
export function childrenOf(n, edges) { const c = Array.from({ length: n }, () => []); for (const [a, b] of edges) c[a].push(b); return c; }
export function adjacent(edges, a, b) { return edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a)); }
/** Kahn's algorithm: a topological order, or null if there is a directed cycle. */
export function topoOrder(n, edges) {
  const indeg = new Array(n).fill(0), ch = childrenOf(n, edges); for (const [, b] of edges) indeg[b]++;
  const q = [], out = []; for (let i = 0; i < n; i++) if (!indeg[i]) q.push(i);
  while (q.length) { const u = q.shift(); out.push(u); for (const w of ch[u]) if (--indeg[w] === 0) q.push(w); }
  return out.length === n ? out : null;
}
export const hasCycle = (n, edges) => topoOrder(n, edges) === null;
/** Set of nodes reachable by directed paths from `start` (a node or iterable), including the start nodes. */
export function descendants(n, edges, start) {
  const ch = childrenOf(n, edges), seen = new Set(typeof start === 'number' ? [start] : start), st = [...seen];
  while (st.length) { const u = st.pop(); for (const w of ch[u]) if (!seen.has(w)) { seen.add(w); st.push(w); } }
  return seen;
}
/** Ancestors including the start nodes. */
export function ancestors(n, edges, start) { return descendants(n, edges.map(([a, b]) => [b, a]), start); }

/** d-separation of x and y given the set Z, by moralizing the ancestral graph (Lauritzen et al.). */
export function dSep(n, edges, x, y, Z) {
  const keep = ancestors(n, edges, [x, y, ...Z]), adj = Array.from({ length: n }, () => new Set());
  const pa = parentsOf(n, edges);
  for (const v of keep) {
    const ps = pa[v].filter((p) => keep.has(p));
    for (const p of ps) { adj[p].add(v); adj[v].add(p); }
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) { adj[ps[i]].add(ps[j]); adj[ps[j]].add(ps[i]); }
  }
  const seen = new Set([x]), st = [x];
  while (st.length) { const u = st.pop(); if (u === y) return false; for (const w of adj[u]) if (!Z.has(w) && !seen.has(w)) { seen.add(w); st.push(w); } }
  return true;
}

/** All simple paths between x and y in the skeleton (at most `cap`). */
export function allPaths(n, edges, x, y, cap = 40) {
  const nb = Array.from({ length: n }, () => new Set()); for (const [a, b] of edges) { nb[a].add(b); nb[b].add(a); }
  const out = [], path = [x], on = new Set([x]);
  (function go(u) {
    if (out.length >= cap) return;
    if (u === y) { out.push(path.slice()); return; }
    for (const w of nb[u]) if (!on.has(w)) { on.add(w); path.push(w); go(w); path.pop(); on.delete(w); }
  })(x);
  return out;
}
/** Status of one path given Z: each interior node is a chain/fork/collider and is blocked or not. */
export function pathReport(n, edges, path, Z) {
  const has = (a, b) => edges.some(([p, q]) => p === a && q === b);
  const stepsOut = []; let open = true;
  for (let i = 1; i < path.length - 1; i++) {
    const a = path[i - 1], m = path[i], b = path[i + 1], inA = has(a, m), inB = has(b, m);
    const type = inA && inB ? 'collider' : (!inA && !inB) ? 'fork' : 'chain';
    let blocked;
    if (type === 'collider') { const d = descendants(n, edges, m); blocked = ![...d].some((q) => Z.has(q)); }
    else blocked = Z.has(m);
    if (blocked) open = false;
    stepsOut.push({ node: m, type, blocked });
  }
  return { open, steps: stepsOut };
}
export function pathText(edges, path, name = (i) => LETTERS[i]) {
  let s = name(path[0]);
  for (let i = 1; i < path.length; i++) s += (edges.some(([a, b]) => a === path[i - 1] && b === path[i]) ? ' → ' : ' ← ') + name(path[i]);
  return s;
}

/** v-structures a → c ← b with a, b non-adjacent, as sorted strings. */
export function vStructs(n, edges) {
  const pa = parentsOf(n, edges), out = [];
  for (let c = 0; c < n; c++) for (let i = 0; i < pa[c].length; i++) for (let j = i + 1; j < pa[c].length; j++) {
    const a = Math.min(pa[c][i], pa[c][j]), b = Math.max(pa[c][i], pa[c][j]); if (!adjacent(edges, a, b)) out.push(`${a}>${c}<${b}`);
  }
  return out.sort();
}
export const skeletonKey = (edges) => edges.map(([a, b]) => (a < b ? `${a}-${b}` : `${b}-${a}`)).sort().join(',');
/** Every DAG with the same skeleton and v-structures (enumerated over orientations; fine for ≤ ~10 edges). */
export function equivalenceClass(n, edges) {
  const sk = edges.map(([a, b]) => (a < b ? [a, b] : [b, a])), vs = vStructs(n, edges).join('|'), m = sk.length, out = [];
  for (let mask = 0; mask < (1 << m); mask++) {
    const e = sk.map(([a, b], i) => ((mask >> i) & 1 ? [b, a] : [a, b]));
    if (!hasCycle(n, e) && vStructs(n, e).join('|') === vs) out.push(e);
  }
  return out;
}
/** Completed partially directed graph: for each skeleton edge, 'fwd' (a→b), 'bwd', or 'und' (reversible in the class). */
export function cpdag(n, edges) {
  const cls = equivalenceClass(n, edges), sk = edges.map(([a, b]) => (a < b ? [a, b] : [b, a]));
  return sk.map(([a, b]) => {
    let f = 0, r = 0; for (const e of cls) { if (e.some(([p, q]) => p === a && q === b)) f++; else r++; }
    return { a, b, dir: f && r ? 'und' : f ? 'fwd' : 'bwd' };
  });
}
/** All conditional-independence statements implied by d-separation: keys "i,j|mask" (i < j). */
export function impliedIndependences(n, edges) {
  const out = new Set();
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const others = []; for (let k = 0; k < n; k++) if (k !== i && k !== j) others.push(k);
    for (let m = 0; m < (1 << others.length); m++) {
      const Z = new Set(others.filter((_, t) => (m >> t) & 1));
      if (dSep(n, edges, i, j, Z)) out.add(`${i},${j}|${[...Z].sort().join('')}`);
    }
  }
  return out;
}

/** Linear Gaussian SEM  X = B X + e,  e ~ N(0, diag(s2)):  B[i][j] = coefficient of j in the equation of i. Returns the covariance matrix. */
export function semCov(n, B, s2) {
  // X = (I − B)^{-1} e, so Σ = T D Tᵀ with T = (I − B)^{-1}
  const IB = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0) - B[i][j]));
  const T = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let c = 0; c < n; c++) { const e = new Array(n).fill(0); e[c] = 1; const x = solveSmall(IB, e); for (let r = 0; r < n; r++) T[r][c] = x[r]; }
  const S = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0; for (let k = 0; k < n; k++) s += T[i][k] * s2[k] * T[j][k]; S[i][j] = s; }
  return S;
}
export function coefMatrix(n, edges, coef) { const B = Array.from({ length: n }, () => new Array(n).fill(0)); for (const [a, b] of edges) B[b][a] = typeof coef === 'function' ? coef(a, b) : coef; return B; }
/** Partial correlation of i and j given the list Z, from a covariance matrix. */
export function pcorrCov(S, i, j, Z) {
  const idx = [i, j, ...Z], k = idx.length, M = idx.map((a) => idx.map((b) => S[a][b]));
  const P = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let c = 0; c < k; c++) { const e = new Array(k).fill(0); e[c] = 1; const x = solveSmall(M, e); for (let r = 0; r < k; r++) P[r][c] = x[r]; }
  return -P[0][1] / Math.sqrt(P[0][0] * P[1][1]);
}
/** Draw N samples of the linear SEM in topological order, with a seeded stream; returns n arrays of length N. */
export function sampleSEM(n, edges, B, s2, N, seed) {
  const ord = topoOrder(n, edges), r = rng(seed * 2654435761 + 17), X = Array.from({ length: n }, () => new Float64Array(N));
  for (let t = 0; t < N; t++) for (const i of ord) { let v = Math.sqrt(s2[i]) * r.normal(); for (let j = 0; j < n; j++) if (B[i][j]) v += B[i][j] * X[j][t]; X[i][t] = v; }
  return X;
}
export function sampleCov(X) {
  const n = X.length, N = X[0].length, m = X.map((a) => { let s = 0; for (let t = 0; t < N; t++) s += a[t]; return s / N; });
  const S = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { let s = 0; for (let t = 0; t < N; t++) s += (X[i][t] - m[i]) * (X[j][t] - m[j]); S[i][j] = S[j][i] = s / (N - 1); }
  return S;
}
export const corrOf = (a, b) => { const S = sampleCov([a, b]); return S[0][1] / Math.sqrt(S[0][0] * S[1][1]); };
/** Fisher z half-width of a 95% band for a partial correlation with k conditioning variables from N samples. */
export const zBand = (N, k) => Math.tanh(1.96 / Math.sqrt(Math.max(1, N - k - 3)));

// ---- graph-kit glue -------------------------------------------------------------------------------------------------
/** A directed, optionally editable v.graph on stage `sg` with letter-named nodes at data positions `pos`. */
export function makeDag(v, sg, { names, pos, edges, editable = false, draggable = true, onChange, onClick, r = 15, labelPos }) {
  const spec = {
    nodes: names.map((c, i) => ({ id: i, label: c, x: pos[i][0], y: pos[i][1] })),
    edges: edges.map(([a, b]) => ({ from: a, to: b })), directed: true, layout: 'none', r, fontSize: 13.5, draggable,
  };
  if (labelPos) spec.labelPos = labelPos;
  if (editable) spec.editable = { addNode: false, deleteNode: false, editWeight: false, addEdge: true, deleteEdge: true, moveNode: true };
  if (onChange) spec.onChange = onChange;
  if (onClick) spec.onClick = onClick;
  return v.graph(sg, spec);
}
export const edgesOf = (G) => G.edges.map((e) => [e.from, e.to]);
