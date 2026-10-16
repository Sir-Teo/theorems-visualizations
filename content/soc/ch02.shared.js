// Networks & Collective Behavior — Chapter 2: helpers shared by the chapter (plain named exports).
// Data: networkx 3.7 bundled copies of Zachary (1977) karate club, Knuth/Hugo Les Misérables co-appearances, Padgett-Ansell
// Florentine marriages, and Davis-Gardner-Gardner Southern women attendance (checked against that package's own data).
export const KARATE = { n: 34, edges: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 10], [0, 11], [0, 12], [0, 13], [0, 17], [0, 19], [0, 21], [0, 31], [1, 2], [1, 3], [1, 7], [1, 13], [1, 17], [1, 19], [1, 21], [1, 30], [2, 3], [2, 7], [2, 8], [2, 9], [2, 13], [2, 27], [2, 28], [2, 32], [3, 7], [3, 12], [3, 13], [4, 6], [4, 10], [5, 6], [5, 10], [5, 16], [6, 16], [8, 30], [8, 32], [8, 33], [9, 33], [13, 33], [14, 32], [14, 33], [15, 32], [15, 33], [18, 32], [18, 33], [19, 33], [20, 32], [20, 33], [22, 32], [22, 33], [23, 25], [23, 27], [23, 29], [23, 32], [23, 33], [24, 25], [24, 27], [24, 31], [25, 31], [26, 29], [26, 33], [27, 33], [28, 31], [28, 33], [29, 32], [29, 33], [30, 32], [30, 33], [31, 32], [31, 33], [32, 33]], club: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] };
export const LESMIS = { names: ["Napoleon", "Myriel", "MlleBaptistine", "MmeMagloire", "CountessDeLo", "Geborand", "Champtercier", "Cravatte", "Count", "OldMan", "Valjean", "Labarre", "Marguerite", "MmeDeR", "Isabeau", "Gervais", "Listolier", "Tholomyes", "Fameuil", "Blacheville", "Favourite", "Dahlia", "Zephine", "Fantine", "MmeThenardier", "Thenardier", "Cosette", "Javert", "Fauchelevent", "Bamatabois", "Perpetue", "Simplice", "Scaufflaire", "Woman1", "Judge", "Champmathieu", "Brevet", "Chenildieu", "Cochepaille", "Pontmercy", "Boulatruelle", "Eponine", "Anzelma", "Woman2", "MotherInnocent", "Gribier", "MmeBurgon", "Jondrette", "Gavroche", "Gillenormand", "Magnon", "MlleGillenormand", "MmePontmercy", "MlleVaubois", "LtGillenormand", "Marius", "BaronessT", "Mabeuf", "Enjolras", "Combeferre", "Prouvaire", "Feuilly", "Courfeyrac", "Bahorel", "Bossuet", "Joly", "Grantaire", "MotherPlutarch", "Gueulemer", "Babet", "Claquesous", "Montparnasse", "Toussaint", "Child1", "Child2", "Brujon", "MmeHucheloup"], edges: [[0, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], [2, 3], [2, 10], [3, 10], [10, 11], [10, 12], [10, 13], [10, 14], [10, 15], [10, 23], [10, 24], [10, 25], [10, 26], [10, 27], [10, 28], [10, 29], [10, 31], [10, 32], [10, 33], [10, 34], [10, 35], [10, 36], [10, 37], [10, 38], [10, 43], [10, 44], [10, 48], [10, 49], [10, 51], [10, 55], [10, 58], [10, 64], [10, 68], [10, 69], [10, 70], [10, 71], [10, 72], [12, 23], [16, 17], [16, 18], [16, 19], [16, 20], [16, 21], [16, 22], [16, 23], [17, 18], [17, 19], [17, 20], [17, 21], [17, 22], [17, 23], [17, 26], [17, 55], [18, 19], [18, 20], [18, 21], [18, 22], [18, 23], [19, 20], [19, 21], [19, 22], [19, 23], [20, 21], [20, 22], [20, 23], [21, 22], [21, 23], [22, 23], [23, 24], [23, 25], [23, 27], [23, 29], [23, 30], [23, 31], [24, 25], [24, 26], [24, 27], [24, 41], [24, 42], [24, 50], [24, 68], [24, 69], [24, 70], [25, 26], [25, 27], [25, 39], [25, 40], [25, 41], [25, 42], [25, 48], [25, 55], [25, 68], [25, 69], [25, 70], [25, 71], [25, 75], [26, 27], [26, 43], [26, 49], [26, 51], [26, 54], [26, 55], [26, 72], [27, 28], [27, 29], [27, 31], [27, 33], [27, 43], [27, 48], [27, 58], [27, 68], [27, 69], [27, 70], [27, 71], [27, 72], [28, 44], [28, 45], [29, 34], [29, 35], [29, 36], [29, 37], [29, 38], [30, 31], [34, 35], [34, 36], [34, 37], [34, 38], [35, 36], [35, 37], [35, 38], [36, 37], [36, 38], [37, 38], [39, 52], [39, 55], [41, 42], [41, 55], [41, 57], [41, 62], [41, 68], [41, 69], [41, 70], [41, 71], [41, 75], [46, 47], [46, 48], [48, 55], [48, 57], [48, 58], [48, 59], [48, 60], [48, 61], [48, 62], [48, 63], [48, 64], [48, 65], [48, 66], [48, 68], [48, 69], [48, 71], [48, 73], [48, 74], [48, 75], [48, 76], [49, 50], [49, 51], [49, 54], [49, 55], [49, 56], [51, 52], [51, 53], [51, 54], [51, 55], [54, 55], [55, 56], [55, 57], [55, 58], [55, 59], [55, 61], [55, 62], [55, 63], [55, 64], [55, 65], [57, 58], [57, 59], [57, 61], [57, 62], [57, 63], [57, 64], [57, 65], [57, 67], [58, 59], [58, 60], [58, 61], [58, 62], [58, 63], [58, 64], [58, 65], [58, 66], [58, 70], [58, 76], [59, 60], [59, 61], [59, 62], [59, 63], [59, 64], [59, 65], [59, 66], [60, 61], [60, 62], [60, 63], [60, 64], [60, 65], [60, 66], [61, 62], [61, 63], [61, 64], [61, 65], [61, 66], [62, 63], [62, 64], [62, 65], [62, 66], [62, 76], [63, 64], [63, 65], [63, 66], [63, 76], [64, 65], [64, 66], [64, 76], [65, 66], [65, 76], [66, 76], [68, 69], [68, 70], [68, 71], [68, 75], [69, 70], [69, 71], [69, 75], [70, 71], [70, 75], [71, 75], [73, 74]] };
export const FLORENCE = { names: ["Acciaiuoli", "Medici", "Castellani", "Peruzzi", "Strozzi", "Barbadori", "Ridolfi", "Tornabuoni", "Albizzi", "Salviati", "Pazzi", "Bischeri", "Guadagni", "Ginori", "Lamberteschi"], edges: [[0, 1], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [2, 3], [2, 4], [2, 5], [3, 4], [3, 11], [4, 6], [4, 11], [6, 7], [7, 12], [8, 13], [8, 12], [9, 10], [11, 12], [12, 14]] };
export const SOUTHERN = { women: ["Evelyn Jefferson", "Laura Mandeville", "Theresa Anderson", "Brenda Rogers", "Charlotte McDowd", "Frances Anderson", "Eleanor Nye", "Pearl Oglethorpe", "Ruth DeSand", "Verne Sanderson", "Myra Liddel", "Katherina Rogers", "Sylvia Avondale", "Nora Fayette", "Helen Lloyd", "Dorothy Murchison", "Olivia Carleton", "Flora Price"], events: ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12", "E13", "E14"], attend: [[0, 1, 2, 3, 4, 5, 7, 8], [0, 1, 2, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6, 7, 8], [0, 2, 3, 4, 5, 6, 7], [2, 3, 4, 6], [2, 4, 5, 7], [4, 5, 6, 7], [5, 7, 8], [4, 6, 7, 8], [6, 7, 8, 11], [7, 8, 9, 11], [7, 8, 9, 11, 12, 13], [6, 7, 8, 9, 11, 12, 13], [5, 6, 8, 9, 10, 11, 12, 13], [6, 7, 9, 10, 11], [7, 8], [8, 10], [8, 10]] };

// ---------- seeded randomness ----------
export function rng32(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function shuffle(a, R) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

// ---------- simple graphs: {n, edges: [[a,b]], adj: [[nbrs]]} ----------
export function mkGraph(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  const seen = new Set(), E = [];
  for (const [a, b] of edges) {
    if (a === b) continue;
    const k = a < b ? a * n + b : b * n + a;
    if (seen.has(k)) continue;
    seen.add(k); E.push([a, b]); adj[a].push(b); adj[b].push(a);
  }
  return { n, edges: E, adj };
}
export const karate = () => mkGraph(KARATE.n, KARATE.edges);
export const lesmis = () => mkGraph(LESMIS.names.length, LESMIS.edges);
export const florence = () => mkGraph(FLORENCE.names.length, FLORENCE.edges);
export const deg = (g) => g.adj.map((a) => a.length);
export const hasEdge = (g, a, b) => g.adj[a].includes(b);

/** Distances from s (−1 if unreachable); optional set `skip` of removed nodes. */
export function bfs(g, s, skip) {
  const d = new Array(g.n).fill(-1); d[s] = 0; const q = [s];
  for (let h = 0; h < q.length; h++) { const u = q[h]; for (const w of g.adj[u]) if (d[w] < 0 && !(skip && skip.has(w))) { d[w] = d[u] + 1; q.push(w); } }
  return d;
}
/** Connected components as arrays of nodes (largest first); optional `skipNode` set and `skipEdge(a,b)` predicate. */
export function components(g, skipNode, skipEdge) {
  const comp = new Array(g.n).fill(-1), out = [];
  for (let s = 0; s < g.n; s++) {
    if (comp[s] >= 0 || (skipNode && skipNode.has(s))) continue;
    const c = [s]; comp[s] = out.length;
    for (let h = 0; h < c.length; h++) for (const w of g.adj[c[h]]) {
      if (comp[w] >= 0 || (skipNode && skipNode.has(w)) || (skipEdge && skipEdge(c[h], w))) continue;
      comp[w] = out.length; c.push(w);
    }
    out.push(c);
  }
  return out.sort((a, b) => b.length - a.length);
}
/** Triangles through each node, the number of connected triples centred on each, and the totals. */
export function triangleStats(g) {
  const tri = new Array(g.n).fill(0), trip = new Array(g.n).fill(0);
  for (let i = 0; i < g.n; i++) {
    const a = g.adj[i], k = a.length; trip[i] = k * (k - 1) / 2;
    for (let x = 0; x < k; x++) for (let y = x + 1; y < k; y++) if (g.adj[a[x]].includes(a[y])) tri[i]++;
  }
  const T = tri.reduce((s, x) => s + x, 0) / 3, P = trip.reduce((s, x) => s + x, 0);
  return { tri, trip, T, P, transitivity: P ? 3 * T / P : 0 };
}
/** Brandes betweenness (unnormalised, each unordered pair counted once). */
export function betweenness(g, skip) {
  const n = g.n, C = new Array(n).fill(0);
  for (let s = 0; s < n; s++) {
    if (skip && skip.has(s)) continue;
    const S = [], P = Array.from({ length: n }, () => []), sg = new Array(n).fill(0), d = new Array(n).fill(-1);
    sg[s] = 1; d[s] = 0; const q = [s];
    for (let h = 0; h < q.length; h++) {
      const v = q[h]; S.push(v);
      for (const w of g.adj[v]) { if (skip && skip.has(w)) continue; if (d[w] < 0) { d[w] = d[v] + 1; q.push(w); } if (d[w] === d[v] + 1) { sg[w] += sg[v]; P[w].push(v); } }
    }
    const dl = new Array(n).fill(0);
    while (S.length) { const w = S.pop(); for (const v of P[w]) dl[v] += sg[v] / sg[w] * (1 + dl[w]); if (w !== s) C[w] += dl[w]; }
  }
  return C.map((x) => x / 2);
}
/** Burt's constraint with equal tie weights: c_i = Σ_j (p_ij + Σ_q p_iq p_qj)², p_ij = 1/deg(i) for neighbours j. */
export function burtConstraint(g) {
  return g.adj.map((a, i) => {
    if (!a.length) return NaN;
    const p = 1 / a.length; let c = 0;
    for (const j of a) { let x = p; for (const q of a) if (q !== j && g.adj[q].includes(j)) x += p * (1 / g.adj[q].length); c += x * x; }
    return c;
  });
}
/** Newman's assortativity coefficient: Pearson correlation of the degrees at the two ends of an edge. */
export function assortativity(g) {
  const d = deg(g), m = g.edges.length; if (!m) return NaN;
  let s1 = 0, s2 = 0, s3 = 0;
  for (const [a, b] of g.edges) { s1 += d[a] * d[b]; s2 += d[a] + d[b]; s3 += d[a] * d[a] + d[b] * d[b]; }
  const mean = s2 / (2 * m), v = s3 / (2 * m) - mean * mean;
  return v < 1e-12 ? NaN : (s1 / m - mean * mean) / v;
}
export function gnm(n, m, R) {
  const set = new Set(), E = [];
  while (E.length < m) { const a = Math.floor(R() * n), b = Math.floor(R() * n); if (a === b) continue; const k = Math.min(a, b) * n + Math.max(a, b); if (set.has(k)) continue; set.add(k); E.push([a, b]); }
  return mkGraph(n, E);
}
/** Barabási–Albert preferential attachment: each new node attaches to k distinct earlier nodes with probability ∝ degree. */
export function barabasi(n, k, R) {
  const E = [], rep = [];
  for (let i = 0; i <= k; i++) for (let j = 0; j < i; j++) { E.push([i, j]); rep.push(i, j); }
  for (let v = k + 1; v < n; v++) {
    const ch = new Set();
    while (ch.size < k) ch.add(rep[Math.floor(R() * rep.length)]);
    for (const u of ch) { E.push([v, u]); rep.push(v, u); }
  }
  return mkGraph(n, E);
}
export function ringLattice(n, k) { const E = []; for (let i = 0; i < n; i++) for (let j = 1; j <= k / 2; j++) E.push([i, (i + j) % n]); return mkGraph(n, E); }

/** Warm-started spring layout on [-1,1]²; `pos` is an array of [x, y] updated in place. */
export function relax(g, pos, iters = 60, opts = {}) {
  const n = g.n, L = opts.len ?? 0.35;
  for (let it = 0; it < iters; it++) {
    const f = pos.map(() => [0, 0]);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      let dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1], d2 = dx * dx + dy * dy + 1e-4, d = Math.sqrt(d2);
      const r = 0.012 / d2; f[i][0] += dx / d * r; f[i][1] += dy / d * r; f[j][0] -= dx / d * r; f[j][1] -= dy / d * r;
    }
    for (const [a, b] of g.edges) {
      const dx = pos[b][0] - pos[a][0], dy = pos[b][1] - pos[a][1], d = Math.hypot(dx, dy) + 1e-6, k = 0.08 * (d - L * 0.4) / d;
      f[a][0] += dx * k; f[a][1] += dy * k; f[b][0] -= dx * k; f[b][1] -= dy * k;
    }
    for (let i = 0; i < n; i++) { const c = 0.01; f[i][0] -= pos[i][0] * c; f[i][1] -= pos[i][1] * c; const m = Math.hypot(f[i][0], f[i][1]), cap = 0.05; const sc = m > cap ? cap / m : 1; pos[i][0] += f[i][0] * sc; pos[i][1] += f[i][1] * sc; }
  }
  return pos;
}
export function circlePos(n, r = 0.85, start = Math.PI / 2) { return Array.from({ length: n }, (_, i) => [r * Math.cos(start - 2 * Math.PI * i / n), r * Math.sin(start - 2 * Math.PI * i / n)]); }
/** Spring layout from a circle start, deterministic. */
export function layoutOf(g, iters = 250, seed = 3) { const R = rng32(seed); const p = circlePos(g.n, 0.6).map(([x, y]) => [x + (R() - 0.5) * 0.1, y + (R() - 0.5) * 0.1]); return relax(g, p, iters); }
/** Largest absolute coordinate rescaled so layouts fill [-1, 1]. */
export function normLayout(pos) { let m = 1e-9; for (const p of pos) m = Math.max(m, Math.abs(p[0]), Math.abs(p[1])); return pos.map(([x, y]) => [x / m * 0.92, y / m * 0.92]); }

// ---------- named networks with cached layouts ----------
const cache = {};
/** name ∈ karate | lesmis | florence | pref | random | ring; returns {g, pos, labels, title, real}. */
export function getNet(name) {
  if (cache[name]) return cache[name];
  let g, labels = null, title, real = true;
  if (name === 'karate') { g = karate(); labels = Array.from({ length: g.n }, (_, i) => String(i + 1)); title = 'Karate club (34 members, Zachary 1977)'; }
  else if (name === 'lesmis') { g = lesmis(); labels = LESMIS.names; title = 'Les Misérables co-appearances (77 characters)'; }
  else if (name === 'florence') { g = florence(); labels = FLORENCE.names; title = 'Florentine families, marriage ties (15)'; }
  else if (name === 'pref') { g = barabasi(300, 2, rng32(11)); title = 'Preferential attachment (model, 300 nodes)'; real = false; }
  else if (name === 'random') { const b = barabasi(300, 2, rng32(11)); g = gnm(300, b.edges.length, rng32(12)); title = 'Random graph with the same n and m (model)'; real = false; }
  else if (name === 'ring') { g = ringLattice(60, 4); title = 'Regular ring, every degree 4 (model, 60 nodes)'; real = false; }
  const pos = normLayout(name === 'ring' ? circlePos(g.n, 0.9) : layoutOf(g, g.n > 100 ? 220 : 300, 5));
  return (cache[name] = { g, pos, labels, title, real });
}
export const RANK = ['gold', 'green', 'accent', 'purple', 'orange', 'pink', 'red'];
export const CYC = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold'];
/** Shortest path from s to t (list of nodes, [] if none), avoiding the node set `skip`. */
export function shortestPath(g, s, t, skip) {
  const prev = new Array(g.n).fill(-2); prev[s] = -1; const q = [s];
  for (let h = 0; h < q.length; h++) { const u = q[h]; if (u === t) break; for (const w of g.adj[u]) if (prev[w] === -2 && !(skip && skip.has(w))) { prev[w] = u; q.push(w); } }
  if (prev[t] === -2) return [];
  const p = []; for (let x = t; x !== -1; x = prev[x]) p.push(x); return p.reverse();
}
export const nodeSpec = (net) => net.g.adj.map((_, i) => ({ id: i, x: net.pos[i][0], y: net.pos[i][1], label: net.labels && net.g.n < 40 ? (net.labels[i]) : '' }));
