// Algorithms — Chapter 11 (network flow, matching, linear programming): helpers shared by ch11.js, ch11-b.js, ch11-c.js, ch11-d.js.
// Re-exports the chapter-10 helpers (and through them chapter 9) and adds: capacitated networks (residual arcs, augmenting-path
// rules, Ford–Fulkerson traces, exhaustive cut enumeration), bipartite matching with brute-force checks, Gale–Shapley with all
// stable matchings, a small dense two-phase simplex (pivot rules, duals), vertex enumeration, and polygon clipping.
// Every algorithm has an independent exhaustive check next to it (all cuts, all matchings, all stable matchings, all vertices).
import { nodesFrom, rngOf } from './ch10.shared.js';
export * from './ch10.shared.js';

const EPS = 1e-9;
export const sgn0 = (x) => (Math.abs(x) < EPS ? 0 : x);
export const num = (x, d = 3) => String(Math.round(x * 10 ** d) / 10 ** d).replace('-', '−');

// ------------------------------------------------------------------ networks
/** Node positions (data units on a 10 x 6 stage) and arcs [from, to, capacity] of the standard small networks. */
export const NETS = {
  A: {
    name: 'six vertices', pos: { s: [0.8, 3], a: [3.2, 5.1], b: [3.2, 0.9], c: [6.2, 5.1], d: [6.2, 0.9], t: [9, 3] },
    arcs: [['s', 'a', 10], ['s', 'b', 10], ['a', 'b', 2], ['a', 'c', 4], ['a', 'd', 8], ['b', 'd', 9], ['d', 'c', 6], ['c', 't', 10], ['d', 't', 10]],
  },
  B: {
    name: 'bottleneck in the middle', pos: { s: [0.8, 3], a: [3, 5.1], b: [3, 0.9], c: [6.4, 5.1], d: [6.4, 0.9], t: [9, 3] },
    arcs: [['s', 'a', 7], ['s', 'b', 6], ['a', 'c', 5], ['a', 'd', 3], ['b', 'd', 4], ['b', 'a', 2], ['c', 'd', 2], ['c', 't', 6], ['d', 't', 5]],
  },
  C: {
    name: 'a detour through a back arc', pos: { s: [0.8, 3], a: [3.4, 5.2], b: [3.4, 0.8], c: [6.2, 5.2], d: [6.2, 0.8], t: [9, 3] },
    arcs: [['s', 'a', 8], ['s', 'b', 5], ['a', 'c', 6], ['b', 'a', 3], ['b', 'd', 6], ['a', 'd', 3], ['c', 'd', 2], ['c', 't', 7], ['d', 't', 9]],
  },
};
export const netNodes = (net, extra = {}) => nodesFrom(net.pos, { s: { notePos: 'w' }, t: { notePos: 'e' }, ...extra });
export const arcsOf = (G) => G.edges.map((e) => [String(e.from), String(e.to), e.w ?? e.cap ?? 1]);
export const zeros = (n) => Array.from({ length: n }, () => 0);
export const nameOf = (G) => (id) => G.lab(id);

/** Residual arcs of flow f on arcs: forward slack and backward "undo" arcs. */
export function resArcs(arcs, f) {
  const out = [];
  arcs.forEach(([u, v, c], i) => {
    if (f[i] < c - EPS) out.push({ from: u, to: v, w: c - f[i], fwd: true, i });
    if (f[i] > EPS) out.push({ from: v, to: u, w: f[i], fwd: false, i });
  });
  return out;
}
export function reachSet(res, s) {
  const seen = new Set([s]), q = [s];
  while (q.length) { const u = q.pop(); for (const r of res) if (r.from === u && !seen.has(r.to)) { seen.add(r.to); q.push(r.to); } }
  return seen;
}
/** BFS distance (in residual arcs) from s; unreachable vertices are Infinity. */
export function resDist(res, s, ids) {
  const d = {}; for (const x of ids) d[x] = Infinity; d[s] = 0; const q = [s];
  for (let h = 0; h < q.length; h++) for (const r of res) if (r.from === q[h] && d[r.to] === Infinity) { d[r.to] = d[q[h]] + 1; q.push(r.to); }
  return d;
}
/** An s-t path of residual arcs by rule: 'bfs' fewest arcs, 'dfs' first found in arc order, 'fat' largest bottleneck, 'rand' random DFS (rng). */
export function findPath(res, s, t, rule = 'bfs', rng = null) {
  if (s === t) return null;
  if (rule === 'bfs') {
    const prev = new Map([[s, null]]), q = [s];
    for (let h = 0; h < q.length && !prev.has(t); h++) for (const r of res) if (r.from === q[h] && !prev.has(r.to)) { prev.set(r.to, r); q.push(r.to); }
    if (!prev.has(t)) return null;
    const p = []; for (let x = t; x !== s; x = prev.get(x).from) p.unshift(prev.get(x)); return p;
  }
  if (rule === 'fat') {
    const best = new Map([[s, Infinity]]), prev = new Map(), done = new Set();
    for (;;) {
      let u = null; for (const [x, b] of best) if (!done.has(x) && (u === null || b > best.get(u))) u = x;
      if (u === null) break; done.add(u); if (u === t) break;
      for (const r of res) if (r.from === u) { const b = Math.min(best.get(u), r.w); if (!done.has(r.to) && b > (best.get(r.to) ?? 0)) { best.set(r.to, b); prev.set(r.to, r); } }
    }
    if (!prev.has(t)) return null;
    const p = []; for (let x = t; x !== s; x = prev.get(x).from) p.unshift(prev.get(x)); return p;
  }
  const seen = new Set([s]);
  const go = (u) => {
    if (u === t) return [];
    let out = res.filter((r) => r.from === u);
    if (rule === 'rand' && rng) out = out.map((r) => [rng(), r]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    for (const r of out) if (!seen.has(r.to)) { seen.add(r.to); const rest = go(r.to); if (rest) return [r, ...rest]; }
    return null;
  };
  return go(s);
}
export const pathBottleneck = (p) => Math.min(...p.map((r) => r.w));
export function pushPath(f, p, amt) { const g = f.slice(); for (const r of p) g[r.i] += r.fwd ? amt : -amt; return g; }
export const flowValue = (arcs, f, s) => arcs.reduce((t, [u, v], i) => t + (u === s ? f[i] : 0) - (v === s ? f[i] : 0), 0);
export function excess(arcs, f, x) { return arcs.reduce((t, [u, v], i) => t + (v === x ? f[i] : 0) - (u === x ? f[i] : 0), 0); }
export const isFeasible = (arcs, f, ids, s, t) => arcs.every(([, , c], i) => f[i] >= -EPS && f[i] <= c + EPS) && ids.every((x) => x === s || x === t || Math.abs(excess(arcs, f, x)) < 1e-7);
export const cutCap = (arcs, S) => arcs.reduce((t, [u, v, c]) => t + (S.has(u) && !S.has(v) ? c : 0), 0);
export const cutNet = (arcs, f, S) => arcs.reduce((t, [u, v], i) => t + (S.has(u) && !S.has(v) ? f[i] : 0) - (!S.has(u) && S.has(v) ? f[i] : 0), 0);
/** Every s-t cut (source side S contains s, not t): [{S, cap, mask}]. Exponential: for the small teaching networks only. */
export function allCuts(ids, arcs, s, t) {
  const mid = ids.filter((x) => x !== s && x !== t), out = [];
  for (let m = 0; m < 1 << mid.length; m++) { const S = new Set([s]); mid.forEach((x, k) => { if (m >> k & 1) S.add(x); }); out.push({ S, cap: cutCap(arcs, S), mask: m }); }
  return out;
}
export const minCutBrute = (ids, arcs, s, t) => { const cs = allCuts(ids, arcs, s, t), m = Math.min(...cs.map((c) => c.cap)); return { cap: m, cuts: cs.filter((c) => c.cap === m) }; };
/** Augmenting-path method as a list of frames. rule: bfs | dfs | fat | rand. Each augmentation gives a 'path' frame then a 'push' frame. */
export function fordFulkerson(ids, arcs, s, t, rule = 'bfs', o = {}) {
  const rng = o.seed != null ? rngOf(o.seed) : null, maxIt = o.maxIt ?? 2000;
  let f = o.f0 ? o.f0.slice() : zeros(arcs.length);
  const frames = [], steps = [];
  const mk = (type, extra) => frames.push({ type, f: f.slice(), value: flowValue(arcs, f, s), res: resArcs(arcs, f), ...extra });
  mk('init', { line: 1, note: 'Start from the zero flow, which is always feasible.' });
  for (let k = 0; k < maxIt; k++) {
    const res = resArcs(arcs, f), p = findPath(res, s, t, rule, rng);
    if (!p) break;
    const b = pathBottleneck(p);
    mk('path', { line: 3, path: p, bottleneck: b, k: k + 1, dist: resDist(res, s, ids) });
    f = pushPath(f, p, b); steps.push({ path: p, b, dist: resDist(res, s, ids) });
    mk('push', { line: 4, path: p, bottleneck: b, k: k + 1 });
  }
  const res = resArcs(arcs, f), S = reachSet(res, s);
  mk('done', { line: 5, S, cap: cutCap(arcs, S) });
  return { frames, f, value: flowValue(arcs, f, s), S, cap: cutCap(arcs, S), steps };
}
export const FF_CODE = ['f ← 0 on every arc', 'while the residual graph G_f has an s–t path P:', '    b ← smallest residual capacity on P', '    push b units along P (forward arcs +b, backward arcs −b)', 'return f   ▷ reachable set of G_f is a minimum cut'];
/** A random feasible flow: a few augmentations of random size along random paths. */
export function randomFlow(ids, arcs, s, t, seed, rounds = 4) {
  const rng = rngOf(seed); let f = zeros(arcs.length);
  for (let k = 0; k < rounds; k++) {
    const p = findPath(resArcs(arcs, f), s, t, 'rand', rng); if (!p) break;
    const b = pathBottleneck(p), amt = Math.max(1, Math.floor(rng() * b) + (rng() < 0.4 ? 1 : 0));
    f = pushPath(f, p, Math.min(b, amt));
  }
  return f;
}
/** Decompose an integral s-t flow into paths (greedy walk along flow-carrying arcs; cycles are ignored). */
export function decompose(arcs, f, s, t) {
  const g = f.slice(), paths = [];
  for (let guard = 0; guard < 200; guard++) {
    const seen = new Set([s]), walk = [];
    const go = (u) => { if (u === t) return true; for (let i = 0; i < arcs.length; i++) if (arcs[i][0] === u && g[i] > 0.5 && !seen.has(arcs[i][1])) { seen.add(arcs[i][1]); walk.push(i); if (go(arcs[i][1])) return true; walk.pop(); } return false; };
    if (!go(s)) break;
    const amt = Math.min(...walk.map((i) => g[i])); for (const i of walk) g[i] -= amt; paths.push({ arcs: walk.slice(), amt });
  }
  return paths;
}

// ------------------------------------------------------------------ bipartite matching
/** Unit network of a bipartite graph: ids ['s', L…, R…, 't'] and arcs; E = [[l, r]] with l in 0..nL-1, r in 0..nR-1. */
export function bipNet(nL, nR, E) {
  const L = Array.from({ length: nL }, (_, i) => `l${i}`), Rr = Array.from({ length: nR }, (_, i) => `r${i}`);
  const arcs = [...L.map((x) => ['s', x, 1]), ...E.map(([l, r]) => [`l${l}`, `r${r}`, 1]), ...Rr.map((x) => [x, 't', 1])];
  return { ids: ['s', ...L, ...Rr, 't'], arcs, L, R: Rr, nE: E.length };
}
/** Maximum matching size by exhaustive search over the left vertices. */
export function matchBrute(nL, nR, E) {
  const adj = Array.from({ length: nL }, () => []); for (const [l, r] of E) adj[l].push(r);
  let best = 0; const go = (i, used, c) => { if (c + (nL - i) <= best) return; if (i === nL) { best = Math.max(best, c); return; } for (const r of adj[i]) if (!(used >> r & 1)) go(i + 1, used | 1 << r, c + 1); go(i + 1, used, c); };
  go(0, 0, 0); return best;
}
/** Matching (as [l, r] pairs) read off an integral flow on bipNet(E). */
export const matchingOf = (net, E, f) => E.filter((_, k) => f[net.L.length + k] > 0.5);
/** Smallest-neighbourhood subset: the Hall violator S ⊆ L maximising |S| − |N(S)| (null if Hall's condition holds). */
export function hallBrute(nL, E) {
  const nb = Array.from({ length: nL }, () => 0); for (const [l, r] of E) nb[l] |= 1 << r;
  const pc = (m) => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
  let best = null, worst = 0;
  for (let m = 1; m < 1 << nL; m++) { let N = 0; for (let l = 0; l < nL; l++) if (m >> l & 1) N |= nb[l]; const def = pc(m) - pc(N); if (def > worst) { worst = def; best = { S: m, N, def }; } }
  return { violator: best, deficiency: worst };
}
/** Minimum vertex cover size of a bipartite graph by exhaustive search over subsets of L ∪ R. */
export function coverBrute(nL, nR, E) {
  let best = nL + nR; const n = nL + nR;
  for (let m = 0; m < 1 << n; m++) { let c = 0, mm = m; while (mm) { mm &= mm - 1; c++; } if (c < best && E.every(([l, r]) => (m >> l & 1) || (m >> (nL + r) & 1))) best = c; }
  return best;
}

// ------------------------------------------------------------------ stable matching
/** Gale–Shapley, proposers propose in list order. prefP[p] = receivers best first; prefR[r] = proposers best first. Frames for the step player. */
export function galeShapley(prefP, prefR) {
  const n = prefP.length, next = zeros(n), engaged = Array(n).fill(null), partner = Array(n).fill(null);
  const rank = prefR.map((l) => { const r = {}; l.forEach((p, k) => { r[p] = k; }); return r; });
  const frames = [], free = Array.from({ length: n }, (_, i) => i), props = [];
  const snap = (extra) => frames.push({ partner: partner.slice(), engaged: engaged.slice(), next: next.slice(), free: free.slice(), nProps: props.length, ...extra });
  snap({ line: 1, note: 'Everybody is free.' });
  while (free.length) {
    const p = free[0], r = prefP[p][next[p]++]; props.push([p, r]);
    snap({ line: 3, p, r, kind: 'propose', note: `Proposer ${p + 1} proposes to the best receiver not yet tried: receiver ${r + 1}.` });
    if (engaged[r] === null) { engaged[r] = p; partner[p] = r; free.shift(); snap({ line: 5, p, r, kind: 'accept', note: `Receiver ${r + 1} is free and accepts.` }); }
    else if (rank[r][p] < rank[r][engaged[r]]) { const q = engaged[r]; engaged[r] = p; partner[p] = r; partner[q] = null; free.shift(); free.push(q); snap({ line: 6, p, r, q, kind: 'swap', note: `Receiver ${r + 1} prefers proposer ${p + 1} to ${q + 1}: ${q + 1} is released and becomes free.` }); }
    else { snap({ line: 7, p, r, kind: 'reject', note: `Receiver ${r + 1} prefers the proposer ${engaged[r] + 1} she holds: ${p + 1} is rejected.` }); }
  }
  snap({ line: 8, kind: 'done', note: 'No proposer is free: the matching is final.' });
  return { frames, match: partner.slice(), proposals: props.length };
}
export const GS_CODE = ['everybody is free', 'while some proposer p is free:', '    r ← best receiver on p’s list not yet tried', '    p proposes to r', '    if r is free:  r accepts', '    else if r prefers p to her partner q:  r takes p, q is free', '    else:  r rejects p', 'return the engagements'];
export function blockingPairs(prefP, prefR, match) {
  const n = prefP.length, pr = Array(n).fill(null); match.forEach((r, p) => { if (r != null) pr[r] = p; });
  const rkP = prefP.map((l) => { const r = {}; l.forEach((x, k) => { r[x] = k; }); return r; }), rkR = prefR.map((l) => { const r = {}; l.forEach((x, k) => { r[x] = k; }); return r; });
  const out = [];
  for (let p = 0; p < n; p++) for (let r = 0; r < n; r++) if (match[p] !== r && rkP[p][r] < rkP[p][match[p]] && rkR[r][p] < rkR[r][pr[r]]) out.push([p, r]);
  return out;
}
export function allPerms(n) { const out = [], a = Array.from({ length: n }, (_, i) => i); const go = (k) => { if (k === n) { out.push(a.slice()); return; } for (let i = k; i < n; i++) { [a[k], a[i]] = [a[i], a[k]]; go(k + 1); [a[k], a[i]] = [a[i], a[k]]; } }; go(0); return out; }
export const stableBrute = (prefP, prefR) => allPerms(prefP.length).filter((m) => blockingPairs(prefP, prefR, m).length === 0);

// ------------------------------------------------------------------ linear algebra and polyhedra
export function solveLin(A, b) {
  const n = A.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-10) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const k = M[r][c] / M[c][c]; if (k) for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
export function detOf(A) {
  const n = A.length, M = A.map((r) => r.slice()); let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return 0;
    if (p !== c) { [M[c], M[p]] = [M[p], M[c]]; d = -d; }
    d *= M[c][c]; for (let r = c + 1; r < n; r++) { const k = M[r][c] / M[c][c]; for (let j = c; j < n; j++) M[r][j] -= k * M[c][j]; }
  }
  return d;
}
export function* combos(n, k, start = 0, cur = []) { if (cur.length === k) { yield cur.slice(); return; } for (let i = start; i < n; i++) { cur.push(i); yield* combos(n, k, i + 1, cur); cur.pop(); } }
/** Vertices of {x : G x ≤ h} in dimension d (exhaustive over d-subsets of tight constraints). Returns [{x, tight: [row indices]}]. */
export function vertices(G, h, d) {
  const out = [];
  for (const S of combos(G.length, d)) {
    const x = solveLin(S.map((i) => G[i]), S.map((i) => h[i])); if (!x) continue;
    if (G.every((r, i) => r.reduce((t, a, j) => t + a * x[j], 0) <= h[i] + 1e-7)) {
      const tight = G.map((r, i) => i).filter((i) => Math.abs(G[i].reduce((t, a, j) => t + a * x[j], 0) - h[i]) < 1e-7);
      if (!out.some((o) => o.x.every((c, j) => Math.abs(c - x[j]) < 1e-7))) out.push({ x: x.map(sgn0), tight });
    }
  }
  return out;
}
/** Sutherland–Hodgman: keep the part of convex polygon poly with a·p ≤ b. */
export function clipHalf(poly, a, b) {
  const out = [], n = poly.length, val = (p) => a[0] * p[0] + a[1] * p[1] - b;
  for (let i = 0; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % n], vp = val(p), vq = val(q);
    if (vp <= 1e-12) out.push(p);
    if ((vp < -1e-12 && vq > 1e-12) || (vp > 1e-12 && vq < -1e-12)) { const t = vp / (vp - vq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
  }
  return out;
}
/** Feasible polygon of constraints [{a: [a1, a2], b}] (a·x ≤ b) inside the box [0, B]^2 (x, y ≥ 0 built in). */
export function lpPolygon(cons, B = 1000) {
  let P = [[0, 0], [B, 0], [B, B], [0, B]];
  for (const c of cons) { P = clipHalf(P, c.a, c.b); if (!P.length) break; }
  return P;
}

// ------------------------------------------------------------------ simplex
/**
 * max c·x subject to rows [{a, op: '<=' | '>=' | '=', b}] and x ≥ 0, by the dense two-phase tableau method.
 * rule: 'dantzig' (largest coefficient), 'bland' (smallest index), 'greatest' (largest objective increase).
 * Returns {status: 'optimal' | 'unbounded' | 'infeasible', x, value, y (dual values of the rows), pivots: [{enter, leave, x, value}]}.
 */
export function simplex(c, rows, o = {}) {
  const n = c.length, m = rows.length, rule = o.rule || 'dantzig', maxIt = o.maxIt ?? 4000;
  const sign = rows.map((r) => (r.b < 0 ? -1 : 1));
  const op = rows.map((r, i) => (sign[i] < 0 ? { '<=': '>=', '>=': '<=', '=': '=' }[r.op] : r.op));
  let cols = n; const slack = Array(m).fill(-1), art = Array(m).fill(-1);
  rows.forEach((_, i) => { if (op[i] !== '=') slack[i] = cols++; });
  rows.forEach((_, i) => { if (op[i] !== '<=') art[i] = cols++; });
  const T = rows.map((r, i) => { const t = Array(cols + 1).fill(0); r.a.forEach((v, j) => { t[j] = sign[i] * v; }); if (slack[i] >= 0) t[slack[i]] = op[i] === '<=' ? 1 : -1; if (art[i] >= 0) t[art[i]] = 1; t[cols] = sign[i] * r.b; return t; });
  const basis = rows.map((_, i) => (art[i] >= 0 ? art[i] : slack[i]));
  const pivots = [], isArt = (j) => art.includes(j);
  const xNow = () => { const x = Array(n).fill(0); basis.forEach((j, i) => { if (j < n) x[j] = T[i][cols]; }); return x; };
  const run = (cost, allowed) => {
    for (let it = 0; it < maxIt; it++) {
      const d = Array(cols).fill(0); for (let j = 0; j < cols; j++) { let s = cost[j]; for (let i = 0; i < m; i++) s -= cost[basis[i]] * T[i][j]; d[j] = s; }
      let e = -1;
      const ratio = (j) => { let bi = -1, br = Infinity; for (let i = 0; i < m; i++) if (T[i][j] > EPS) { const q = T[i][cols] / T[i][j]; if (q < br - 1e-12 || (Math.abs(q - br) <= 1e-12 && basis[i] < basis[bi])) { br = q; bi = i; } } return [bi, br]; };
      if (rule === 'bland') { for (let j = 0; j < cols; j++) if (allowed(j) && d[j] > 1e-9) { e = j; break; } }
      else if (rule === 'greatest') { let bestG = 1e-12; for (let j = 0; j < cols; j++) if (allowed(j) && d[j] > 1e-9) { const [bi, br] = ratio(j); const g = bi < 0 ? Infinity : d[j] * br; if (g > bestG) { bestG = g; e = j; } } }
      else { let bd = 1e-9; for (let j = 0; j < cols; j++) if (allowed(j) && d[j] > bd) { bd = d[j]; e = j; } }
      if (e < 0) return 'optimal';
      const [r] = ratio(e); if (r < 0) return 'unbounded';
      const pv = T[r][e]; for (let j = 0; j <= cols; j++) T[r][j] /= pv;
      for (let i = 0; i < m; i++) if (i !== r && Math.abs(T[i][e]) > 0) { const k = T[i][e]; for (let j = 0; j <= cols; j++) T[i][j] -= k * T[r][j]; }
      const leave = basis[r]; basis[r] = e; pivots.push({ enter: e, leave, x: xNow(), value: c.reduce((s, cj, j) => s + cj * xNow()[j], 0) });
    }
    return 'iterations';
  };
  if (art.some((a) => a >= 0)) {
    const c1 = Array(cols).fill(0); art.forEach((a) => { if (a >= 0) c1[a] = -1; });
    run(c1, () => true);
    if (basis.some((j, i) => isArt(j) && T[i][cols] > 1e-7)) return { status: 'infeasible', x: null, value: NaN, y: null, pivots };
    // drive degenerate artificials out of the basis where possible
    basis.forEach((j, r) => { if (isArt(j)) { const e = T[r].slice(0, cols).findIndex((v, jj) => !isArt(jj) && Math.abs(v) > 1e-9); if (e >= 0) { const pv = T[r][e]; for (let k = 0; k <= cols; k++) T[r][k] /= pv; for (let i = 0; i < m; i++) if (i !== r) { const q = T[i][e]; for (let k = 0; k <= cols; k++) T[i][k] -= q * T[r][k]; } basis[r] = e; } } });
    pivots.length = 0;
  }
  const c2 = Array(cols).fill(0); c.forEach((v, j) => { c2[j] = v; });
  const st = run(c2, (j) => !isArt(j));
  const x = xNow(), value = c.reduce((s, cj, j) => s + cj * x[j], 0);
  const y = rows.map((_, i) => { const j = art[i] >= 0 ? art[i] : slack[i]; let d = 0 - c2[j]; for (let r = 0; r < m; r++) d -= c2[basis[r]] * T[r][j]; return sign[i] * -d; });
  return { status: st === 'iterations' ? 'unbounded' : st, x, value, y, pivots };
}

// ------------------------------------------------------------------ drawing helpers (need the runtime object v)
export const netStage = (v, o = {}) => v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 320, ...o });
/** A directed, weighted graph of one of the standard networks (capacities are the edge weights). */
export function mkNet(v, s, key = 'A', extra = {}) {
  const N = getNet(key);
  return v.graph(s, { directed: true, weights: true, layout: 'none', nodes: netNodes(N), edges: N.arcs.map((a) => a.slice()), ...extra });
}
export function loadNet(G, key) { const N = getNet(key); G.set({ nodes: netNodes(N), edges: N.arcs.map((a) => a.slice()) }); }
export const netIds = (G) => G.nodes.map((n) => String(n.id));
/** Draw network G with flow f (an array parallel to G.edges). make(fl) may return extra draw options; fl(e) is the flow on e. */
export function drawFlow(G, f, make) {
  const idx = new Map(G.edges.map((e, i) => [e, i])), fl = (e) => f[idx.get(e)] ?? 0;
  const base = {
    edgeLabel: (e) => `${num(fl(e), 2)}/${num(e.w, 2)}`,
    edgeWidth: (e) => 1.5 + 0.45 * Math.min(Math.max(fl(e), 0), 14),
    edgeColor: (e) => (fl(e) > e.w + 1e-9 || fl(e) < -1e-9 ? 'red' : fl(e) > 1e-9 ? 'accent' : 'faint'),
  };
  G.draw({ ...base, ...(make ? make(fl, idx) : {}) });
}
/** Colour of a flow-network vertex by side of a cut. */
export const sideCol = (S) => (id) => (S.has(String(id)) ? 'blue' : 'orange');
export const rkey = (r) => `${r.i}${r.fwd ? 'f' : 'b'}`;
/** Draw a Ford–Fulkerson frame: network G (flow labels, current path in orange, the final cut in red) and, if given, residual graph R. */
export function ffDraw(G, R, fr, o = {}) {
  const inPath = new Set((fr.path || []).map((r) => r.i)), pk = new Set((fr.path || []).map(rkey)), S = fr.S;
  drawFlow(G, fr.f, (fl, idx) => ({
    edgeColor: (e) => { const i = idx.get(e); if (fr.type !== 'done' && inPath.has(i)) return 'orange'; if (S && S.has(String(e.from)) && !S.has(String(e.to))) return 'red'; return fl(e) > 1e-9 ? 'accent' : 'faint'; },
    edgeWidth: (e) => { const i = idx.get(e); return fr.type !== 'done' && inPath.has(i) ? 3 + 0.4 * Math.min(fl(e), 12) : 1.5 + 0.45 * Math.min(fl(e), 14); },
    nodeColor: S ? (id) => (S.has(String(id)) ? 'teal' : null) : null,
    ...(o.net || {}),
  }));
  if (R) {
    R.edges = fr.res;
    R.draw({ edgeColor: (e) => (pk.has(rkey(e)) && fr.type !== 'done' ? 'orange' : e.fwd ? 'muted' : 'purple'), edgeDash: (e) => !e.fwd, edgeLabel: (e) => num(e.w, 2), edgeWidth: (e) => (pk.has(rkey(e)) && fr.type !== 'done' ? 3.4 : null), nodeColor: S ? (id) => (S.has(String(id)) ? 'teal' : null) : null, nodeFill: S ? (id) => (S.has(String(id)) ? 'teal' : null) : null, ...(o.res || {}) });
  }
}

/** A random layered network on 7 vertices (s, two middle columns of 2-3 vertices, t); key 'R<seed>' in getNet. */
export function randNet(seed) {
  const r = rngOf(seed * 131 + 7), pos = { s: [0.8, 3] }, mid = [];
  const cols = [[3.3, 3], [6.2, 2]];
  cols.forEach(([x, k], c) => { for (let i = 0; i < k; i++) { const id = String.fromCharCode(97 + mid.length); pos[id] = [x, k === 1 ? 3 : 5.2 - i * (4.4 / (k - 1))]; mid.push([id, c]); } });
  pos.t = [9, 3];
  const A = mid.filter((m) => m[1] === 0).map((m) => m[0]), B = mid.filter((m) => m[1] === 1).map((m) => m[0]), arcs = [];
  const cap = () => 2 + Math.floor(r() * 9);
  A.forEach((a) => arcs.push(['s', a, cap()]));
  A.forEach((a) => B.forEach((b) => { if (r() < 0.65) arcs.push([a, b, cap()]); }));
  for (let i = 0; i + 1 < A.length; i++) if (r() < 0.5) arcs.push([A[i], A[i + 1], 1 + Math.floor(r() * 4)]);
  B.forEach((b) => arcs.push([b, 't', cap()]));
  A.forEach((a) => { if (!arcs.some((x) => x[0] === a && x[1] !== 's' && A.indexOf(x[1]) < 0)) arcs.push([a, B[Math.floor(r() * B.length)], cap()]); });
  return { name: `random ${seed}`, pos, arcs };
}
export function getNet(key) { return NETS[key] || (String(key).startsWith('R') ? randNet(+String(key).slice(1)) : NETS.A); }

// ------------------------------------------------------------------ bipartite pictures
export const LET = (j) => String.fromCharCode(65 + j);
/** Node specs of a bipartite drawing: left vertices l0…, right vertices r0…, optionally s and t at the sides. */
export function bipNodes(nL, nR, withST = false) {
  const lx = withST ? 3.3 : 2.6, rx = withST ? 6.7 : 7.4, y = (i, n) => (n === 1 ? 3 : 5.3 - i * (4.6 / (n - 1)));
  const out = [];
  if (withST) out.push({ id: 's', x: 0.7, y: 3, notePos: 'w' });
  for (let i = 0; i < nL; i++) out.push({ id: `l${i}`, label: String(i + 1), x: lx, y: y(i, nL) });
  for (let j = 0; j < nR; j++) out.push({ id: `r${j}`, label: LET(j), x: rx, y: y(j, nR) });
  if (withST) out.push({ id: 't', x: 9.3, y: 3, notePos: 'e' });
  return out;
}
/** A seeded random bipartite edge list with edge probability p (every pair [l, r]). */
export function bipRandom(nL, nR, p, seed) { const r = rngOf(seed * 977 + 5), E = []; for (let l = 0; l < nL; l++) for (let j = 0; j < nR; j++) if (r() < p) E.push([l, j]); return E; }
