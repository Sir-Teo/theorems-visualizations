// Computational Complexity — Chapter 2 (The web of NP-complete problems): helpers shared by ch02.js and ch02-b.js.
// Real solvers used by the pictures: DPLL for CNF, dancing-links style exact cover (with optional secondary items),
// subset-sum DP, brute-force graph optima, and a 3-colouring enumerator. Nothing here is faked: every number a picture
// prints is computed by these functions.

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const sup = (n) => String(n).split('').map((d) => (d === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d])).join('');
export function big(x) {
  if (!isFinite(x)) return '∞';
  if (Math.abs(x) >= 1e7) { const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / 10 ** e).toFixed(2)} × 10${sup(e)}`; }
  return Math.round(x).toLocaleString('en-US');
}

// ---------------------------------------------------------------------------------------------------------------
// CNF. A literal is a nonzero integer: +i = variable i true, -i = variable i false (variables 1..n).
export const litTrue = (l, a) => (l > 0 ? a[l] === 1 : a[-l] === 0);
export const clauseSat = (c, a) => c.some((l) => litTrue(l, a));
export const cnfSat = (cl, a) => cl.every((c) => clauseSat(c, a));
export const litStr = (l) => (l > 0 ? `x_{${l}}` : `\\bar x_{${-l}}`);
export const clauseTex = (c) => (c.length ? c.map(litStr).join('\\lor ') : '\\bot');
export const cnfTex = (cl) => cl.map((c) => `(${clauseTex(c)})`).join('\\,');

/** All satisfying assignments (arrays indexed 1..n of 0/1) by brute force, n small. */
export function allModels(n, cl, cap = 1 << 20) {
  const out = [];
  for (let m = 0; m < (1 << n) && out.length < cap; m++) {
    const a = [null]; for (let i = 0; i < n; i++) a.push((m >> i) & 1);
    if (cnfSat(cl, a)) out.push(a);
  }
  return out;
}
/** DPLL with unit propagation. Returns {model|null, nodes}. */
export function dpll(n, cl) {
  let nodes = 0;
  const a = Array(n + 1).fill(-1);
  function rec(clauses) {
    nodes++;
    // unit propagation
    let cs = clauses, changed = true; const trail = [];
    while (changed) {
      changed = false;
      const nx = [];
      for (const c of cs) {
        let sat = false; const rest = [];
        for (const l of c) { const v = a[Math.abs(l)]; if (v === -1) rest.push(l); else if ((l > 0) === (v === 1)) { sat = true; break; } }
        if (sat) continue;
        if (!rest.length) { trail.forEach((i) => { a[i] = -1; }); return false; }
        if (rest.length === 1) { const l = rest[0]; a[Math.abs(l)] = l > 0 ? 1 : 0; trail.push(Math.abs(l)); changed = true; }
        nx.push(rest);
      }
      cs = nx;
    }
    if (!cs.length) return true;
    const x = Math.abs(cs[0][0]);
    for (const val of [1, 0]) { a[x] = val; if (rec(cs)) return true; }
    a[x] = -1; trail.forEach((i) => { a[i] = -1; });
    return false;
  }
  const ok = rec(cl.map((c) => c.slice()));
  return { model: ok ? a.map((x) => (x === -1 ? 0 : x)) : null, nodes };
}
/** Random k-CNF with distinct variables per clause. */
export function randomCNF(r, n, m, k = 3) {
  const cl = [];
  for (let j = 0; j < m; j++) {
    const vs = []; while (vs.length < Math.min(k, n)) { const x = 1 + Math.floor(r() * n); if (!vs.includes(x)) vs.push(x); }
    cl.push(vs.map((x) => (r() < 0.5 ? x : -x)));
  }
  return cl;
}

// ---------------------------------------------------------------------------------------------------------------
// Exact cover by Knuth's Algorithm X with dancing links. rows: arrays of column indices; columns 0..nPrim-1 must be
// covered exactly once, columns nPrim..nPrim+nSec-1 at most once. Returns {solutions: [[row indices]], nodes, capped}.
export function dlx(rows, nPrim, nSec = 0, o = {}) {
  const maxSol = o.maxSol ?? 1, maxNodes = o.maxNodes ?? 2e6;
  const N = nPrim + nSec, nodesCnt = rows.reduce((s, r) => s + r.length, 0) + N + 1;
  const L = new Int32Array(nodesCnt), R = new Int32Array(nodesCnt), U = new Int32Array(nodesCnt), D = new Int32Array(nodesCnt);
  const C = new Int32Array(nodesCnt), RW = new Int32Array(nodesCnt), S = new Int32Array(N + 1);
  const head = N; // header columns 0..N-1, root = N
  for (let i = 0; i <= N; i++) { U[i] = i; D[i] = i; C[i] = i; L[i] = i; R[i] = i; }
  for (let i = 0; i < nPrim; i++) { L[i] = i === 0 ? head : i - 1; R[i] = i === nPrim - 1 ? head : i + 1; }
  if (nPrim) { L[head] = nPrim - 1; R[head] = 0; }
  let p = N + 1;
  rows.forEach((r, ri) => {
    let first = -1;
    for (const c of r) {
      const x = p++; C[x] = c; RW[x] = ri; S[c]++;
      U[x] = U[c]; D[x] = c; D[U[c]] = x; U[c] = x;
      if (first < 0) { first = x; L[x] = x; R[x] = x; } else { L[x] = L[first]; R[x] = first; R[L[first]] = x; L[first] = x; }
    }
  });
  const cover = (c) => { R[L[c]] = R[c]; L[R[c]] = L[c]; for (let i = D[c]; i !== c; i = D[i]) for (let j = R[i]; j !== i; j = R[j]) { D[U[j]] = D[j]; U[D[j]] = U[j]; S[C[j]]--; } };
  const uncover = (c) => { for (let i = U[c]; i !== c; i = U[i]) for (let j = L[i]; j !== i; j = L[j]) { S[C[j]]++; D[U[j]] = j; U[D[j]] = j; } R[L[c]] = c; L[R[c]] = c; };
  const sols = [], cur = []; let nodes = 0, capped = false;
  const solFirstNodes = [];
  (function search() {
    if (capped) return;
    nodes++; if (nodes > maxNodes) { capped = true; return; }
    if (R[head] === head) { sols.push(cur.slice()); solFirstNodes.push(nodes); if (sols.length >= maxSol) capped = capped || false; return; }
    let c = R[head], best = S[c];
    for (let j = R[c]; j !== head; j = R[j]) if (S[j] < best) { best = S[j]; c = j; }
    if (best === 0) return;
    cover(c);
    for (let r = D[c]; r !== c; r = D[r]) {
      cur.push(RW[r]);
      for (let j = R[r]; j !== r; j = R[j]) cover(C[j]);
      search();
      for (let j = L[r]; j !== r; j = L[j]) uncover(C[j]);
      cur.pop();
      if (capped || sols.length >= maxSol) break;
    }
    uncover(c);
  })();
  return { solutions: sols, nodes, capped: capped && sols.length < maxSol, nodesAt: solFirstNodes };
}

// ---------------------------------------------------------------------------------------------------------------
// Numbers: subset sum.
/** Reachable sums of a list (Set-free boolean array up to cap). */
export function subsetSumTable(a, cap) {
  const T = new Uint8Array(cap + 1); T[0] = 1;
  for (const x of a) for (let s = cap; s >= x; s--) if (T[s - x]) T[s] = 1;
  return T;
}
/** A subset (indices) of `a` summing to t, or null. Uses DP with layers for reconstruction. */
export function subsetSumFind(a, t) {
  if (t < 0) return null;
  const n = a.length, layers = [new Uint8Array(t + 1)]; layers[0][0] = 1;
  for (let i = 0; i < n; i++) { const prev = layers[i], nx = prev.slice(); for (let s = a[i]; s <= t; s++) if (prev[s - a[i]]) nx[s] = 1; layers.push(nx); }
  if (!layers[n][t]) return null;
  const pick = []; let s = t;
  for (let i = n - 1; i >= 0; i--) { if (layers[i][s]) continue; pick.push(i); s -= a[i]; }
  return pick.reverse();
}

// ---------------------------------------------------------------------------------------------------------------
// Graphs on vertices 0..n-1 given as edge lists [u, v].
export function adjMask(n, edges) { const m = Array(n).fill(0); for (const [u, v] of edges) { m[u] |= 1 << v; m[v] |= 1 << u; } return m; }
export const popc = (x) => { let c = 0; while (x) { x &= x - 1; c++; } return c; };
/** Minimum vertex cover size and one cover (bitmask), n <= 20. */
export function minVertexCover(n, edges) {
  let best = n + 1, bm = 0;
  for (let m = 0; m < (1 << n); m++) {
    const c = popc(m); if (c >= best) continue;
    if (edges.every(([u, v]) => ((m >> u) & 1) || ((m >> v) & 1))) { best = c; bm = m; }
  }
  return { size: best, mask: bm };
}
/** Maximum clique (bitmask) by simple branching. */
export function maxClique(n, edges) {
  const adj = adjMask(n, edges); let best = 0, bm = 0;
  (function rec(R, P, size) {
    if (size + popc(P) <= best) return;
    if (!P) { if (size > best) { best = size; bm = R; } return; }
    while (P) {
      if (size + popc(P) <= best) return;
      const v = 31 - Math.clz32(P & -P); P &= ~(1 << v);
      rec(R | (1 << v), P & adj[v], size + 1);
    }
    if (size > best) { best = size; bm = R; }
  })(0, (1 << n) - 1, 0);
  return { size: best, mask: bm };
}
/** Number of 3-colourings via backtracking; also returns first colouring. */
export function threeColour(n, edges, o = {}) {
  const adj = Array.from({ length: n }, () => []); edges.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
  const col = Array(n).fill(-1); let count = 0, first = null;
  const limit = o.limit ?? 1e9;
  (function rec(k) {
    if (count >= limit) return;
    if (k === n) { count++; if (!first) first = col.slice(); return; }
    for (let c = 0; c < 3; c++) { if (adj[k].some((w) => w < k && col[w] === c)) continue; col[k] = c; rec(k + 1); }
    col[k] = -1;
  })(0);
  return { count, first };
}
