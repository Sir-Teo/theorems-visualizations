// Certificate-aware helpers for the audited §5.1–5.2 demonstrations.
import { colourWith, greedyClique, nbrs, lineAdj, maxDeg, fiveFrames } from './ch05-a.shared.js';

/** Every upper bound is accompanied by a proper colouring; a timeout never raises the lower bound. */
export function colouringBounds(adj, { budget = 2e6, lower = null } = {}) {
  if (!adj.length) return { lower: 0, upper: 0, k: 0, col: [], exact: true };
  const order = adj.map((_, i) => i).sort((a, b) => adj[b].length - adj[a].length), col = adj.map(() => -1);
  for (const u of order) { const used = new Set(adj[u].map(w => col[w])); let c = 0; while (used.has(c)) c++; col[u] = c; }
  const upper = Math.max(...col) + 1;
  let lo = lower ?? greedyClique(adj);
  for (; lo < upper; lo++) {
    const result = colourWith(adj, lo, budget);
    if (result.status === 'yes') return { lower: lo, upper: lo, k: lo, col: result.col, exact: true };
    if (result.status === 'unknown') return { lower: lo, upper, k: lo, col, exact: false };
  }
  return { lower: upper, upper, k: upper, col, exact: true };
}
export const vertexBounds = (H, options) => colouringBounds(nbrs(H), options);
export function edgeBounds(H, options = {}) { return { ...colouringBounds(lineAdj(H), { ...options, lower: maxDeg(H) }), D: maxDeg(H), H }; }

/** Samples distinguish a completed impossibility search from budget exhaustion. */
export function triangulationCategory(three, four) {
  return three.status === 'yes' ? 0 : three.status === 'no' && four.status === 'yes' ? 1 : 2;
}

/** Fail visibly rather than letting the legacy algorithm's emergency sixth colour masquerade as a five-colouring. */
export function auditedFiveFrames(D, seed) {
  const result = fiveFrames(D, seed), adj = Array.from({ length: D.n }, () => []);
  for (const [a, b] of D.E) { adj[a].push(b); adj[b].push(a); }
  for (const f of result.frames) {
    if (f.col.some(c => c < -1 || c > 4)) throw new Error('Five-colouring certificate uses a colour outside the five-colour palette.');
    if (D.E.some(([a, b]) => f.live[a] && f.live[b] && f.col[a] >= 0 && f.col[a] === f.col[b])) throw new Error('Five-colouring certificate has a conflicting edge.');
    if (/^Remove/.test(f.note) && (f.cur < 0 || adj[f.cur].filter(w => f.live[w]).length > 5)) throw new Error('Invalid low-degree deletion.');
  }
  const end = result.frames.at(-1);
  if (!end.live.every(Boolean) || end.col.some(c => c < 0)) throw new Error('Incomplete five-colouring certificate.');
  return result;
}
