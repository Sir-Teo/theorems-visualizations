// Social Science — Chapter 4: landmark paper written early as a flagship item (4.18, Watts & Strogatz 1998).
//
// Verified against the paper (Nature 393: 440–442): rewiring procedure of Fig. 1; Fig. 2 uses n = 1,000 vertices,
// k = 10, averages over 20 random realizations, normalized by L(0), C(0), on a logarithmic p axis; for n ≫ k ≫ ln n ≫ 1,
// L ~ n/2k and C ~ 3/4 as p → 0, L ≈ L_random ~ ln n/ln k and C ≈ C_random ~ k/n as p → 1. Table 1 (L_actual, L_random,
// C_actual, C_random): film actors 3.65, 2.99, 0.79, 0.00027 (n = 225,226, k = 61); power grid 18.7, 12.4, 0.080, 0.005
// (n = 4,941, k = 2.67); C. elegans 2.65, 2.25, 0.28, 0.05 (n = 282, k = 14). Later analytic result used for comparison:
// C′(p) ≈ C(0)(1 − p)³ (Barrat & Weigt 2000, Eur. Phys. J. B 13: 547; as reviewed by Newman, SIAM Rev. 2003).

/** Mulberry32: seeded uniform [0, 1). */
function rng32(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** Watts–Strogatz: ring of n vertices joined to their k nearest neighbours; lap by lap, each clockwise edge (i, i+j) is
 *  rewired with probability p to (i, m), m uniform, avoiding self-loops and duplicate edges. Returns {edges, adj (CSR)}. */
function wattsStrogatz(n, k, p, R) {
  const key = (a, b) => (a < b ? a * n + b : b * n + a), E = new Set(), edges = [];
  for (let i = 0; i < n; i++) for (let j = 1; j <= k / 2; j++) { const b = (i + j) % n; E.add(key(i, b)); edges.push([i, b, false]); }
  for (let j = 1; j <= k / 2; j++) for (let i = 0; i < n; i++) {
    if (R() >= p) continue;
    const e = edges[i * (k / 2) + (j - 1)];
    let m = -1;
    for (let g = 0; g < 64; g++) { const c = Math.floor(R() * n); if (c !== i && !E.has(key(i, c))) { m = c; break; } }
    if (m < 0) continue;
    E.delete(key(e[0], e[1])); E.add(key(i, m)); e[1] = m; e[2] = true;
  }
  const deg = new Int32Array(n + 1); for (const [a, b] of edges) { deg[a + 1]++; deg[b + 1]++; }
  for (let i = 0; i < n; i++) deg[i + 1] += deg[i];
  const nbr = new Int32Array(deg[n]), fill = deg.slice(0, n);
  for (const [a, b] of edges) { nbr[fill[a]++] = b; nbr[fill[b]++] = a; }
  return { n, edges, off: deg, nbr };
}
/** Exact characteristic path length (all-pairs BFS, over connected pairs) and clustering coefficient (mean of C_v). */
function lc(G) {
  const { n, off, nbr } = G, dist = new Int32Array(n), q = new Int32Array(n), mark = new Uint8Array(n);
  let tot = 0, pairs = 0;
  for (let s = 0; s < n; s++) {
    dist.fill(-1); dist[s] = 0; let h = 0, t = 0; q[t++] = s;
    while (h < t) { const u = q[h++], du = dist[u] + 1; for (let x = off[u]; x < off[u + 1]; x++) { const w = nbr[x]; if (dist[w] < 0) { dist[w] = du; q[t++] = w; tot += du; pairs++; } } }
  }
  let C = 0;
  for (let v = 0; v < n; v++) {
    const kv = off[v + 1] - off[v]; if (kv < 2) continue;
    for (let x = off[v]; x < off[v + 1]; x++) mark[nbr[x]] = 1;
    let e = 0; for (let x = off[v]; x < off[v + 1]; x++) { const w = nbr[x]; for (let y = off[w]; y < off[w + 1]; y++) if (mark[nbr[y]]) e++; }
    for (let x = off[v]; x < off[v + 1]; x++) mark[nbr[x]] = 0;
    C += e / 2 / (kv * (kv - 1) / 2);
  }
  return { L: tot / pairs, C: C / n };
}
const PGRID = [1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1];
const pf = (x, d = 2) => x.toFixed(d);

// ═══════════ Travers & Milgram (1969), Barabási & Albert (1999) ═══════════
// Travers & Milgram, Sociometry 32: 425–443 (PDF via snap.stanford.edu): 296 starters (196 Nebraska: 100 stockholders,
// 96 random; 100 Boston random); 217 sent the folder on; 64 reached the target (29% of 217); Table 2, completed chains
// by number of intermediaries 0–11 for each group; mean 5.2, median 5; Table 1, chains reaching, completions and dropouts
// at each remove 0–14; footnote 4 (H. White): random dropout ≈ 25% per step, the next holder knowing the target rising
// to about 1/3 by six removes; with no dropouts the median of completed chains "rises from 5 to 7". Today: Backstrom et
// al. (2012, WebSci): average distance 4.74 among 721 million Facebook users; Facebook (2016): 3.57 degrees, 1.59 billion.
// Barabási & Albert, Science 286: 509 (arXiv cond-mat/9910332): m₀ = m = 5, t = 150,000, γ_model = 2.9 ± 0.1; actors
// γ = 2.3 ± 0.1 (N = 212,250), WWW 2.1 ± 0.1 (N = 325,729), power grid ≈ 4 (N = 4,941); model A (uniform attachment):
// exponential; model B (no growth): not stationary; k_i(t) = m(t/t_i)^0.5 (Fig. 2C, t₁ = 5, t₂ = 95); P(k) ≈ 2m²k⁻³.
// Exact large-t law 2m(m+1)/[k(k+1)(k+2)] (Dorogovtsev, Mendes & Samukhin; Krapivsky, Redner & Leyvraz, 2000).
// Broido & Clauset (2019, Nat. Commun. 10: 1017): of 927 networks only about 4% strongly scale-free.
const TM_T2 = [[0, 0, 0, 1, 4, 3, 6, 2, 0, 1, 1, 0], [0, 0, 0, 3, 6, 4, 6, 2, 1, 1, 1, 0], [0, 2, 3, 4, 4, 1, 4, 2, 1, 0, 1, 0]]; // Nebraska random, Nebraska stockholders, Boston random
const TM_T1 = [[296, 0, 79], [217, 0, 59], [158, 2, 34], [122, 3, 24], [95, 8, 11], [76, 14, 12], [50, 8, 4], [38, 16, 5], [17, 6, 1], [10, 2, 2], [6, 2, 0], [4, 3, 0], [1, 0, 0], [1, 0, 0], [1, 0, 1]]; // remove: [chains reaching, completions, dropouts]
/** Hazard that the r-th intermediary knows the target, from Table 1 (pooled from the sixth on, where counts are small). */
function tmHazards() {
  const q = [0];
  for (let r = 1; r <= 5; r++) q.push(TM_T1[r + 1][1] / (TM_T1[r][0] - TM_T1[r][1]));
  let c = 0, h = 0; for (let r = 6; r <= 11; r++) { c += TM_T1[r + 1][1]; h += TM_T1[r][0] - TM_T1[r][1]; }
  for (let r = 6; r <= 30; r++) q.push(c / h);
  return q;
}
/** Expected completed chains with k intermediaries out of `n0` starters, constant dropout d per holder. */
function tmModel(d, n0 = 296, K = 30) { const q = tmHazards(), out = [0]; let alive = n0 * (1 - d); for (let k = 1; k <= K; k++) { out.push(alive * q[k]); alive *= (1 - q[k]) * (1 - d); } return out; }
const medianOf = (counts) => { const tot = counts.reduce((a, b) => a + b, 0); let c = 0; for (let k = 0; k < counts.length; k++) { c += counts[k]; if (c >= tot / 2) return k; } return counts.length - 1; };

/** Growing network with m links per newcomer (preferential or uniform), or Barabási–Albert model B (fixed N). */
function baGrow(N, m, model, seed, track = []) {
  const R = rng32(seed), deg = new Int32Array(N), ends = new Int32Array(2 * N * Math.max(m, 1) * 6 + 16), rec = track.map(() => []); let ne = 0;
  if (model === 'B') { // N vertices, no growth: a random vertex links to j with probability ∝ k_j + 1
    const T = 3 * N;
    for (let s = 0; s < T; s++) { const i = Math.floor(R() * N); const u = R() * (ne + N); const j = u < ne ? ends[Math.floor(u)] : Math.floor(u - ne); if (j === i) continue; deg[i]++; deg[j]++; ends[ne++] = i; ends[ne++] = j; }
    return { deg, rec, steps: T };
  }
  for (let t = m; t < N; t++) {
    const ch = []; let guard = 0;
    while (ch.length < m && guard++ < 1000) { const j = model === 'A' || ne === 0 ? Math.floor(R() * t) : ends[Math.floor(R() * ne)]; if (!ch.includes(j)) ch.push(j); }
    for (const j of ch) { deg[t]++; deg[j]++; ends[ne++] = t; ends[ne++] = j; }
    if (t >= 8 && ((t & (t - 1)) === 0 || t % 2000 === 0)) track.forEach((v0, i) => { if (v0 < t) rec[i].push([t, deg[v0]]); });
  }
  return { deg, rec };
}
/** Log-binned degree density (ratio 1.35) and the least-squares slope over k ≥ kfit with ≥ 10 counts per bin. */
function degDist(deg, kfit) {
  const N = deg.length; let kmax = 0; for (const k of deg) if (k > kmax) kmax = k;
  const edges = []; for (let e = 1; e <= kmax + 1; e *= 1.35) { const r = Math.round(e); if (!edges.length || r > edges[edges.length - 1]) edges.push(r); } edges.push(kmax + 1);
  const cnt = new Array(edges.length - 1).fill(0);
  for (const k of deg) { if (k < 1) continue; let lo = 0, hi = edges.length - 2; while (lo < hi) { const md = (lo + hi + 1) >> 1; if (edges[md] <= k) lo = md; else hi = md - 1; } cnt[lo]++; }
  const pts = []; for (let i = 0; i < cnt.length; i++) if (cnt[i] > 0) pts.push([Math.sqrt(edges[i] * (edges[i + 1] - 1)), cnt[i] / N / (edges[i + 1] - edges[i]), cnt[i]]);
  const use = pts.filter((p) => p[0] >= kfit && p[2] >= 10), xs = use.map((p) => Math.log(p[0])), ys = use.map((p) => Math.log(p[1]));
  let slope = NaN; if (use.length >= 3) { const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length; let sxy = 0, sxx = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; }); slope = sxy / sxx; }
  return { pts, slope, kmax };
}

export default {

  collection: 'soc',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.18
    {
      num: '4.18',
      kind: 'Paper',
      name: 'Collective Dynamics of ‘Small-World’ Networks',
      paper: { authors: 'Duncan J. Watts and Steven H. Strogatz', year: 1998, title: 'Collective dynamics of ‘small-world’ networks', venue: 'Nature 393 (6684): 440–442', doi: '10.1038/30918' },
      introduces: ['soc-4.5'],
      statement: String.raw`Start from a ring lattice of $n$ vertices, each joined to its $k$ nearest neighbours, and rewire each edge to a uniformly random vertex with probability $p$. Watts and Strogatz showed that the characteristic path length $L(p)$ (mean shortest-path distance) and the clustering coefficient $C(p)$ (the average, over vertices, of the fraction of a vertex's neighbour pairs that are themselves linked) respond on completely different scales of $p$: a handful of rewired edges collapses $L$ from the lattice value $\approx n/2k$ to nearly the random-graph value $\approx \ln n/\ln k$, while $C$ stays close to the lattice value $\approx 3/4$ until $p$ is large. In between lies a broad range of **small-world networks**: highly clustered like a lattice, yet with path lengths like a random graph.

They found the same signature, $L \gtrsim L_{\rm random}$ but $C \gg C_{\rm random}$, in three real networks (film actors, the western US power grid, the neural network of *C. elegans*), and showed that dynamics on such graphs (disease spreading, cooperation, synchronization) behave like those on random graphs. The claims are for sparse connected graphs, $n\gg k\gg \ln n\gg1$.`,
      idea: String.raw`Milgram's letter-passing experiment (soc-4.17) had suggested "six degrees of separation", and random graphs (soc-4.1) explained short paths, but random graphs have almost no triangles, whereas friends of friends are usually friends (triadic closure, soc-2.5). Network models were either completely regular or completely random. Watts and Strogatz interpolated between the two with one parameter and measured both a global quantity, $L$, and a local one, $C$. The surprise is the mismatch of scales: each long-range shortcut shrinks distances between whole neighbourhoods, so $L$ responds to the first few, while a shortcut removes only a few triangles, so $C$ barely notices; the transition to a small world is "almost undetectable at the local level". The paper introduced the Watts–Strogatz model (soc-4.5) and, with Barabási and Albert's paper a year later, started modern network science.`,
      caption: String.raw`Left: a small ring you can rewire (lattice edges grey, rewired shortcuts orange); click a vertex to colour every vertex by its distance from it. Right: the paper's Figure 2, recomputed here exactly for $n=1000$, $k=10$ (all-pairs breadth-first search), adding one random realization at each $p$ per step until all 20 are in: filled dots $L(p)/L(0)$, open squares $C(p)/C(0)$, dashed the later formula $(1-p)^3$ for clustering. Slide **p** and watch the small ring's path length fall long before its triangles disappear.`,
      deps: ['soc-2.5', 'soc-4.1', 'soc-4.17'],
      refs: [],
      tags: ['networks', 'small world'],
      credit: 'Watts & Strogatz, 1998',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Watts%E2%80%93Strogatz_model' },
      viz(v) {
        const M = v.M;
        const pS = v.slider('rewiring probability $p$', 0.0001, 1, 0.05, { log: true, sig: 2 });
        const nS = v.slider('small ring: $n$', 12, 80, 40, { int: true });
        const kS = v.select('$k$', [{ value: 2, label: '2' }, { value: 4, label: '4' }, { value: 6, label: '6' }], 4);
        let seed = 1;
        v.button('Rewire again', () => { seed++; });
        const A = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 360, weight: 0.9, title: 'a ring you can rewire' });
        const B = v.stage({ x: [6e-5, 1.7], y: [-0.07, 1.1], xlog: true, yticks: [0, 0.2, 0.4, 0.6, 0.8, 1], axes: 'box', height: 360, weight: 1.1, title: 'Figure 2 recomputed: n = 1000, k = 10, log p' });
        // ---- progressive computation of Figure 2 (exact L and C, 20 realizations per p)
        const N = 1000, K = 10, REAL = 20, base = lc(wattsStrogatz(N, K, 0, rng32(1)));
        const acc = PGRID.map(() => ({ L: [], C: [] }));
        let done = 0;
        const step = () => { const r = Math.floor(done / PGRID.length), i = done % PGRID.length; const s = lc(wattsStrogatz(N, K, PGRID[i], rng32(1000 * r + i + 7))); acc[i].L.push(s.L / base.L); acc[i].C.push(s.C / base.C); done++; };
        // ---- the small ring (rebuilt only when its inputs change)
        let ring = null, ringKey = '', src = -1, ringDist = null;
        const buildRing = () => {
          const key = `${nS.value}|${kS.value}|${pS.value}|${seed}`; if (key === ringKey) return; ringKey = key;
          const n = nS.value, k = +kS.value, G = wattsStrogatz(n, k, pS.value, rng32(seed * 7919 + 13)), G0 = wattsStrogatz(n, k, 0, rng32(1));
          ring = { n, k, G, s: lc(G), s0: lc(G0) }; src = Math.min(src, n - 1); ringDist = null;
        };
        const pos = (i, n) => { const a = Math.PI / 2 - (2 * Math.PI * i) / n; return [Math.cos(a), Math.sin(a)]; };
        A.onClick((x, y) => { if (!ring) return; let best = -1, bd = 0.02; for (let i = 0; i < ring.n; i++) { const [px, py] = pos(i, ring.n), d = (px - x) ** 2 + (py - y) ** 2; if (d < bd) { bd = d; best = i; } } src = best === src ? -1 : best; ringDist = null; });
        const bfs = (G, s) => { const d = new Int32Array(G.n).fill(-1), q = [s]; d[s] = 0; for (let h = 0; h < q.length; h++) { const u = q[h]; for (let x = G.off[u]; x < G.off[u + 1]; x++) { const w = G.nbr[x]; if (d[w] < 0) { d[w] = d[u] + 1; q.push(w); } } } return d; };
        const PAL = ['green', 'teal', 'blue', 'purple', 'pink', 'red', 'orange', 'gold'];
        v.legend([['ink', 'L(p) / L(0), n = 1000', { dot: true }], ['accent', 'C(p) / C(0), n = 1000', { dot: true }], ['accent', 'Barrat–Weigt (1 − p)³', { dash: true }], ['orange', 'rewired shortcut']]);
        let st = null;
        v.animate((t) => {
          // add realizations at about 28 graphs per second of animation time (all 260 by t ≈ 9.3 s)
          const target = Math.min(REAL * PGRID.length, Math.floor(t * 28) + PGRID.length);
          const t0 = performance.now();
          const budget = v.playing ? 40 : 6000; // paused or still: catch up with the clock (bounded by t)
          while (done < target && performance.now() - t0 < budget) step();
          buildRing();
          // ---- left: the ring
          const { n, G } = ring;
          if (src >= 0 && !ringDist) ringDist = bfs(G, src);
          for (const [a, b, rw] of G.edges) {
            const [x1, y1] = pos(a, n), [x2, y2] = pos(b, n);
            A.line(x1, y1, x2, y2, { color: rw ? 'orange' : 'muted', width: rw ? 2.2 : 1.3, alpha: rw ? 0.95 : 0.6 });
          }
          const r = n > 50 ? 4 : 5.5;
          for (let i = 0; i < n; i++) {
            const [x, y] = pos(i, n), d = ringDist ? ringDist[i] : -1;
            A.dot(x, y, { r: i === src ? r + 2.5 : r, color: i === src ? 'gold' : d > 0 ? PAL[Math.min(PAL.length - 1, d - 1)] : 'ink' });
            if (ringDist && n <= 50 && d > 0) A.text(String(d), x * 1.12, y * 1.12, { align: 'center', size: 11, weight: 600, color: PAL[Math.min(PAL.length - 1, d - 1)] });
          }
          if (src < 0) A.corner('click a vertex', 'br', { size: 11.5 });
          // ---- right: Figure 2
          const p = pS.value;
          B.fn((x) => (1 - x) ** 3, { color: 'accent', width: 1.6, dash: [6, 4] });
          B.vline(p, { color: 'gold', width: 2 });
          PGRID.forEach((q, i) => {
            const a = acc[i]; if (!a.L.length) return;
            const mL = M.mean(a.L), mC = M.mean(a.C);
            B.dot(q, mL, { r: 5, color: 'ink' });
            const X = B.X(q), Y = B.Y(mC), h = 5; const c = B.ctx; c.save(); c.strokeStyle = v.color('accent'); c.lineWidth = 2; c.fillStyle = v.color('panel'); c.beginPath(); c.rect(X - h, Y - h, 2 * h, 2 * h); c.fill(); c.stroke(); c.restore();
          });
          B.text('C(p) / C(0)', 2e-3, 0.88, { color: 'accent', weight: 700, size: 12.5 });
          B.text('L(p) / L(0)', 2.5e-4, 0.2, { color: 'ink', weight: 700, size: 12.5 });
          const real = Math.min(REAL, Math.floor(done / PGRID.length));
          B.corner(`${real} of ${REAL} realizations per point`, 'tr', { size: 11.5 });
          // interpolate the n = 1000 curves at the slider's p (log-linear between grid points)
          const lp = Math.log10(p); let j = 0; while (j < PGRID.length - 2 && Math.log10(PGRID[j + 1]) < lp) j++;
          const f = M.clamp((lp - Math.log10(PGRID[j])) / (Math.log10(PGRID[j + 1]) - Math.log10(PGRID[j])), 0, 1);
          const at = (key) => { const a = acc[j][key], b = acc[j + 1][key]; return a.length && b.length ? M.mean(a) * (1 - f) + M.mean(b) * f : NaN; };
          st = { p, Lr: at('L'), Cr: at('C'), real, ring };
        }, { period: 9.5, once: true, still: 2.6 });
        v.readout(() => {
          if (!st) return '';
          const { p, Lr, Cr, ring } = st, sr = ring.s, s0 = ring.s0;
          const lrand = Math.log(N) / Math.log(K) / base.L, crand = K / N / base.C;
          return `$p$ = ${v.fmt(p, 2)}: on the 1000-vertex ring $L/L(0)$ ≈ **${isFinite(Lr) ? pf(Lr) : '…'}**, $C/C(0)$ ≈ **${isFinite(Cr) ? pf(Cr) : '…'}** (lattice: $L(0)$ = ${pf(base.L, 1)} ≈ $n/2k$ = 50, $C(0)$ = ${pf(base.C, 3)}; random limits $\\ln n/\\ln k$ → ${pf(lrand, 3)}, $k/n$ → ${pf(crand, 3)} of those) · small ring ($n$ = ${ring.n}, $k$ = ${ring.k}, ${ring.G.edges.filter((e) => e[2]).length} shortcuts): $L$ = ${pf(sr.L)} vs ${pf(s0.L)} unrewired, $C$ = ${pf(sr.C)} vs ${pf(s0.C)} · the paper's Table 1, actual vs random: film actors $L$ 3.65 vs 2.99, $C$ 0.79 vs 0.00027; western US power grid 18.7 vs 12.4, 0.080 vs 0.005; *C. elegans* 2.65 vs 2.25, 0.28 vs 0.05 — path lengths near random, clustering tens to thousands of times higher · today: the clustering curve follows $C(0)(1-p)^3$ (Barrat & Weigt 2000, dashed)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.17
    {
      num: '4.17',
      kind: 'Paper',
      name: 'An Experimental Study of the Small World Problem',
      paper: { authors: 'Jeffrey Travers and Stanley Milgram', year: 1969, title: 'An Experimental Study of the Small World Problem', venue: 'Sociometry 32 (4): 425–443', doi: '10.2307/2786545' },
      introduces: ['soc-4.3'],
      statement: String.raw`Travers and Milgram asked 296 volunteers, 196 in Nebraska and 100 in the Boston area, to move a folder toward a target person, a Boston stockbroker, by mailing it only to someone they knew on a first-name basis who seemed more likely to know him; each recipient was asked to do the same. 217 starters sent the folder on, and **64 chains reached the target**. The completed chains needed between 1 and 10 intermediaries, with **mean 5.2 and median 5**; chains from Boston were shorter (4.4) than those from Nebraska random starters (5.7), and many converged on the target through a few of his acquaintances.

About a quarter of the holders at each step let the chain die, so the observed lengths are biased toward short chains; correcting for random dropout (H. White's method, in the paper) raises the median of completed chains from about 5 to about 7. The experiment estimates the length of chains people can actually *find* using local knowledge, an upper bound on the shortest path, in one country and through volunteers. It is the "small-world" experiment behind "six degrees of separation" (soc-4.3).`,
      idea: String.raw`Pool and Kochen had asked mathematically how many intermediaries separate two random people, and Milgram's 1967 article in Psychology Today reported a first run; this paper is the careful account. The method is a breadth-first search (soc-2.2) performed by people who see only their own neighbours, so it measures navigability as well as distance, a distinction Kleinberg (2000) would formalise. Its lessons are the small mean path length in a society of 200 million, the funnelling of chains through a few "sociometric stars", and the importance of geography and occupation as dimensions along which people route. The phenomenon was given its network-theoretic explanation by Watts and Strogatz (soc-4.18); large-scale replications (e-mail in 2003, Facebook in 2011 and 2016) found similar or shorter separations.`,
      caption: String.raw`**Left**: the 64 completed chains by number of intermediaries, from the paper's Table 2 (stacked by starting group: Nebraska random, Nebraska stockholders, Boston), with the median (5). **Right**: what happened to the folders, remove by remove (Table 1): chains still alive, those completed at that remove and those that died there. Gold, both panels: a model in which each holder knows the target with the probability estimated from Table 1 and drops the folder with the probability you set; at 25% per step (White's estimate) it reproduces the data, and at **0%** (dashed, rescaled to 64 chains) the median of completed chains rises to 7.`,
      deps: ['soc-2.2'],
      refs: [],
      tags: ['small world', 'social networks', 'history'],
      credit: 'Jeffrey Travers & Stanley Milgram, 1969',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Small-world_experiment' },
      viz(v) {
        const dS = v.slider('dropout per holder', 0, 0.5, 0.25, { step: 0.01, fmt: (x) => `${Math.round(100 * x)}%` });
        const grp = v.toggle('split by starting group', true);
        const L = v.stage({ x: [-0.6, 14.6], y: [0, 19], axes: 'box', height: 330, weight: 1, xlabel: 'intermediaries', ylabel: 'completed chains', xticks: [0, 2, 4, 6, 8, 10, 12, 14], title: 'lengths of the 64 completed chains' });
        const F = v.stage({ x: [-0.6, 14.6], y: [0, 310], axes: 'box', height: 330, weight: 1, xlabel: 'remove from the start', ylabel: 'chains', xticks: [0, 2, 4, 6, 8, 10, 12, 14], title: 'what happened to the 296 folders' });
        const GC = ['purple', 'orange', 'teal'], all = TM_T2[0].map((_, k) => TM_T2[0][k] + TM_T2[1][k] + TM_T2[2][k]);
        const meanOf = (row) => row.reduce((s, c, k) => s + c * k, 0) / row.reduce((a, b) => a + b, 0);
        let st = null;
        v.render(() => {
          const d = dS.value, mod = tmModel(d), mod0 = tmModel(0), tot0 = mod0.reduce((a, b) => a + b, 0), sc0 = 64 / tot0;
          // ---- histogram
          for (let k = 0; k < 12; k++) {
            let y = 0;
            if (grp.value) TM_T2.forEach((row, g) => { if (row[k]) { L.rect(k - 0.38, y, k + 0.38, y + row[k], { fill: GC[g], fillAlpha: 0.75, stroke: false }); y += row[k]; } });
            else if (all[k]) L.rect(k - 0.38, 0, k + 0.38, all[k], { fill: 'accent', fillAlpha: 0.7, stroke: false });
          }
          L.vline(5, { color: 'ink', width: 1.6, dash: [5, 4] }); L.text('median 5, mean 5.2', 5, 17.6, { dx: 6, size: 11.5, weight: 700, align: 'left' });
          L.path(mod.slice(0, 15).map((c, k) => [k, c]), { color: 'gold', width: 2.6 }); L.dots(mod.slice(1, 15).map((c, k) => [k + 1, c]), { r: 3.5, color: 'gold' });
          L.path(mod0.slice(0, 15).map((c, k) => [k, c * sc0]), { color: 'gold', width: 1.8, dash: [6, 4] });
          const m0 = medianOf(mod0), md = medianOf(mod);
          L.line(m0, 0, m0, 3, { color: 'gold', width: 2 }); L.text(`no dropout: median ${m0}`, m0, 3, { dy: -8, size: 11, weight: 700, color: 'gold', align: 'left', dx: 4 });
          // ---- funnel (Table 1) and the model's chains alive at each remove
          TM_T1.forEach(([n, c, dr], r) => {
            F.rect(r - 0.38, 0, r + 0.38, n - c - dr, { fill: 'blue', fillAlpha: 0.45, stroke: false });
            F.rect(r - 0.38, n - c - dr, r + 0.38, n - c, { fill: 'red', fillAlpha: 0.6, stroke: false });
            F.rect(r - 0.38, n - c, r + 0.38, n, { fill: 'green', fillAlpha: 0.85, stroke: false });
          });
          // chains reaching remove r: holders at r − 1 who forward, plus those who deliver to the target at r
          const q = tmHazards(), reach = [296]; let hold = 296;
          for (let r = 1; r <= 14; r++) { const qq = q[r - 1] || 0; reach.push(hold * (1 - qq) * (1 - d) + hold * qq); hold *= (1 - qq) * (1 - d); }
          F.path(reach.map((n, r) => [r, n]), { color: 'gold', width: 2.6 }); F.dots(reach.map((n, r) => [r, n]), { r: 3.2, color: 'gold' });
          F.text('217 sent on', 1, 217, { dx: 8, dy: -4, size: 11, weight: 600, align: 'left' });
          st = { d, mod, md, m0, tot: mod.reduce((a, b) => a + b, 0) };
        });
        v.legend([['purple', 'Nebraska random', { area: true }], ['orange', 'Nebraska stockholders', { area: true }], ['teal', 'Boston random', { area: true }], ['blue', 'passed on', { area: true }], ['red', 'dropped here', { area: true }], ['green', 'reached the target', { area: true }], ['gold', 'model with your dropout (dashed: none)']]);
        v.readout(() => {
          if (!st) return '';
          const { d, md, m0, tot } = st;
          return `paper: 296 starters, 217 sent the folder on, **64 completed** (29% of 217); mean **${v.fix(330 / 64, 2)}** intermediaries (330 / 64; printed 5.2), median **5**; Boston random ${v.fix(meanOf(TM_T2[2]), 1)}, Nebraska random ${v.fix(meanOf(TM_T2[0]), 1)}, stockholders ${v.fix(meanOf(TM_T2[1]), 1)} (printed 4.4, 5.7, 5.4) · model with ${Math.round(100 * d)}% dropout per holder: ${v.fix(tot, 0)} completed chains expected, median ${md}; with none, median **${m0}** (White, in the paper: from 5 to 7) · today: average distance 4.74 among 721 million Facebook users in 2011 (3.74 intermediaries), 3.57 “degrees” across 1.59 billion in 2016 — and those are shortest paths, not paths people can find`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.19
    {
      num: '4.19',
      kind: 'Paper',
      name: 'Emergence of Scaling in Random Networks',
      paper: { authors: 'Albert-László Barabási and Réka Albert', year: 1999, title: 'Emergence of Scaling in Random Networks', venue: 'Science 286 (5439): 509–512', doi: '10.1126/science.286.5439.509' },
      introduces: ['soc-4.9', 'soc-4.10'],
      statement: String.raw`Barabási and Albert reported that the degree distributions of several large networks have power-law tails, $P(k)\sim k^{-\gamma}$, with $\gamma\approx2.3$ for film actors, $2.1$ for links into web pages and about $4$ for the western US power grid, unlike the Poisson tails of random graphs (soc-4.1). They proposed that two ingredients explain it:
(a) **growth**: a new vertex arrives at each step with $m$ edges;
(b) **preferential attachment**: it links to an existing vertex $i$ with probability $\Pi(k_i)=k_i/\sum_jk_j$.
The resulting network becomes stationary with $\gamma=2.9\pm0.1$ in simulation ($m_0=m=5$, $t=150{,}000$), and a continuum argument gives $k_i(t)=m\,(t/t_i)^{1/2}$ and
$$P(k)\approx\frac{2m^2}{k^{3}},\qquad\gamma=3 ,$$
independent of $m$. Without preferential attachment (their model A) $P(k)$ is exponential; without growth (model B) it is not stationary. The precise large-$t$ law, found in 2000, is $P(k)=\frac{2m(m+1)}{k(k+1)(k+2)}$.

The model explains a "scale-free" (soc-4.9, soc-4.10) tail with exponent 3 only; other exponents need variations (directed links, fitness, ageing), and how common true power laws are in real networks is debated.`,
      idea: String.raw`Random-graph models of Erdős and Rényi and the small-world model of Watts and Strogatz (soc-4.18) keep the number of vertices fixed and connect them uniformly, so very connected "hubs" are exponentially rare. Data on the web, citations and collaborations, newly available in the late 1990s, showed hubs everywhere (heavy-tailed distributions, soc-4.7). The paper's point was mechanism: a rich-get-richer rule in a growing network, essentially Price's 1976 model of citations and Simon's 1955 process, produces a power law on its own. It created the field of "scale-free networks", with consequences for robustness (resilient to random failure, fragile to attacks on hubs) and epidemics (no threshold on networks with $\gamma\le3$). Later work refined the claims: Broido and Clauset (2019) found strong evidence for power-law degree distributions in only about 4% of 927 networks, most being as well described by log-normals.`,
      caption: String.raw`**Top**: a network grows live, each newcomer (gold) attaching $m$ links to existing vertices in proportion to their degree; vertex size shows degree, and hubs appear among the oldest vertices. **Bottom left**: the degree distribution of a 150,000-vertex network built with the same rule (the paper's size), on log–log axes with logarithmic bins: the points follow a straight line of slope close to $-3$ (dashed) and the exact law (green). Switch to **model A** (growth without preference) and the tail bends down exponentially; **model B** (preference without growth, 150,000 fixed vertices) gives no power law. **Bottom right**: the paper's Fig. 2C, the degree of the vertices added at $t=5$ and $t=95$ as the network grows, against the predicted slope $1/2$.`,
      deps: ['soc-4.7', 'soc-4.1'],
      refs: [],
      tags: ['networks', 'power laws', 'preferential attachment'],
      credit: 'Albert-László Barabási & Réka Albert, 1999',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Barab%C3%A1si%E2%80%93Albert_model' },
      viz(v) {
        const model = v.select('model', [{ value: 'BA', label: 'growth + preference' }, { value: 'A', label: 'model A: no preference' }, { value: 'B', label: 'model B: no growth' }], 'BA', { onChange: () => v.restart() });
        const mS = v.slider('links per newcomer m', 1, 5, 2, { int: true, step: 1, onChange: () => v.restart() });
        const G = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 330, full: true, title: 'a network growing' });
        const P = v.stage({ x: [1, 3000], y: [1e-9, 1], xlog: true, ylog: true, axes: 'box', height: 320, weight: 1.1, xlabel: 'degree k', ylabel: 'P(k)', title: 'degree distribution, 150,000 vertices' });
        const K = v.stage({ x: [5, 150000], y: [1, 3000], xlog: true, ylog: true, axes: 'box', height: 320, weight: 0.9, minWidth: 250, xlabel: 'time t (vertices added)', ylabel: 'degree kᵢ(t)', title: 'rich get richer (Fig. 2C)' });
        const cache = {};
        const big = (mo, m) => { const key = mo + m; if (!cache[key]) { const g = baGrow(150000, m, mo, 1999, [5, 95]); cache[key] = { ...g, D: degDist(g.deg, 3 * m) }; } return cache[key]; };
        // small network for the drawing
        let net = null;
        const NMAX = 260;
        const resetNet = () => {
          const m = mS.value, mo = model.value, R = rng32(7 + m), n0 = mo === 'B' ? 120 : m;
          net = { R, m, mo, n: n0, x: [], y: [], deg: new Array(NMAX).fill(0), edges: [], ends: [], steps: 0, last: -1 };
          for (let i = 0; i < n0; i++) { const a = (2 * Math.PI * i) / n0; net.x.push(0.6 * Math.cos(a) * (mo === 'B' ? 1.2 : 0.3)); net.y.push(0.6 * Math.sin(a) * (mo === 'B' ? 1.2 : 0.3)); }
        };
        const addOne = () => {
          const { R, m, mo } = net;
          if (mo === 'B') { const i = Math.floor(R() * net.n), u = R() * (net.ends.length + net.n), j = u < net.ends.length ? net.ends[Math.floor(u)] : Math.floor(u - net.ends.length); if (i !== j) { net.edges.push([i, j]); net.deg[i]++; net.deg[j]++; net.ends.push(i, j); net.last = i; } net.steps++; return; }
          if (net.n >= NMAX) return;
          const t = net.n, ch = []; let guard = 0;
          while (ch.length < Math.min(m, t) && guard++ < 500) { const j = mo === 'A' || !net.ends.length ? Math.floor(R() * t) : net.ends[Math.floor(R() * net.ends.length)]; if (!ch.includes(j)) ch.push(j); }
          const j0 = ch[0] ?? 0, ang = R() * 2 * Math.PI;
          net.x.push(net.x[j0] + 0.12 * Math.cos(ang)); net.y.push(net.y[j0] + 0.12 * Math.sin(ang));
          for (const j of ch) { net.edges.push([t, j]); net.deg[t]++; net.deg[j]++; net.ends.push(t, j); }
          net.n++; net.last = t;
        };
        const relax = (it) => { // a few force-layout iterations
          const n = net.n, X = net.x, Y = net.y, fx = new Float64Array(n), fy = new Float64Array(n), k2 = 0.9 / n;
          for (let s = 0; s < it; s++) {
            fx.fill(0); fy.fill(0);
            for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { let dx = X[i] - X[j], dy = Y[i] - Y[j]; const d2 = dx * dx + dy * dy + 1e-4, f = k2 / d2; fx[i] += dx * f; fy[i] += dy * f; fx[j] -= dx * f; fy[j] -= dy * f; }
            for (const [a, b] of net.edges) { const dx = X[a] - X[b], dy = Y[a] - Y[b], d = Math.hypot(dx, dy) + 1e-6, f = (d - 0.07) * 0.25; fx[a] -= (dx / d) * f; fy[a] -= (dy / d) * f; fx[b] += (dx / d) * f; fy[b] += (dy / d) * f; }
            for (let i = 0; i < n; i++) { fx[i] -= X[i] * 0.02; fy[i] -= Y[i] * 0.02; const L = Math.hypot(fx[i], fy[i]), c = L > 0.03 ? 0.03 / L : 1; X[i] += fx[i] * c; Y[i] += fy[i] * c; }
          }
        };
        let st = null, lastT = 0;
        v.animate((t) => {
          if (!net || net.m !== mS.value || net.mo !== model.value || t < lastT - 1e-6) resetNet();
          lastT = t;
          const target = model.value === 'B' ? Math.floor(t * 40) : Math.min(NMAX, Math.floor(mS.value + t * 22));
          let guard = 0;
          while ((model.value === 'B' ? net.steps < target : net.n < target) && guard++ < 2000) { addOne(); if (guard % 8 === 0) relax(1); }
          relax(2);
          // fit the drawing into view
          let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (let i = 0; i < net.n; i++) { x0 = Math.min(x0, net.x[i]); x1 = Math.max(x1, net.x[i]); y0 = Math.min(y0, net.y[i]); y1 = Math.max(y1, net.y[i]); }
          const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, half = Math.max(0.3, (x1 - x0) / 2, (y1 - y0) / 2) * 1.12;
          const asp = G.width / G.height; G.setView([cx - half * asp, cx + half * asp], [cy - half, cy + half]);
          for (const [a, b] of net.edges) G.line(net.x[a], net.y[a], net.x[b], net.y[b], { color: 'muted', width: 0.8, alpha: 0.5 });
          let kmx = 1; for (let i = 0; i < net.n; i++) kmx = Math.max(kmx, net.deg[i]);
          for (let i = 0; i < net.n; i++) G.dot(net.x[i], net.y[i], { r: 2 + 9 * Math.sqrt(net.deg[i] / kmx), color: i === net.last ? 'gold' : i < 10 ? 'red' : 'accent', alpha: 0.9 });
          G.corner(`${net.n} vertices, ${net.edges.length} edges · largest degree ${kmx}`, 'tl', { size: 12, color: 'ink', weight: 600 });
          // ---- distribution
          const m = mS.value, B = big(model.value, m), D = B.D;
          P.fn((k) => 2 * m * m / k ** 3, { color: 'ink', width: 1.4, dash: [6, 4], domain: [m, 3000] });
          if (model.value === 'BA') P.fn((k) => (2 * m * (m + 1)) / (k * (k + 1) * (k + 2)), { color: 'green', width: 2, domain: [m, 3000] });
          P.dots(D.pts.map((p) => [p[0], p[1]]), { r: 4.5, color: model.value === 'BA' ? 'accent' : model.value === 'A' ? 'orange' : 'purple' });
          P.text('slope −3', 300, 2 * m * m / 300 ** 3, { dy: -12, size: 11.5, weight: 700, color: 'ink', align: 'left' });
          // ---- Fig. 2C
          if (model.value !== 'B') {
            B.rec.forEach((r, i) => { P; K.path(r, { color: i ? 'teal' : 'red', width: 2.4 }); });
            K.fn((t2) => m * Math.sqrt(t2 / 5), { color: 'red', width: 1, dash: [5, 4] }); K.fn((t2) => m * Math.sqrt(t2 / 95), { color: 'teal', width: 1, dash: [5, 4] });
            K.text('added at t = 5', 150000, B.rec[0].length ? B.rec[0][B.rec[0].length - 1][1] : 1, { align: 'right', dy: -11, size: 11, weight: 700, color: 'red' });
            K.text('added at t = 95', 150000, B.rec[1].length ? B.rec[1][B.rec[1].length - 1][1] : 1, { align: 'right', dy: 13, size: 11, weight: 700, color: 'teal' });
          } else K.text('no growth: no arrival times', 900, 30, { align: 'center', size: 12, weight: 700, color: 'muted' });
          st = { m, D, B };
        }, { still: 10, period: 1e9 });
        v.legend([['gold', 'newest vertex', { dot: true }], ['red', 'the first ten vertices', { dot: true }], ['ink', 'continuum theory 2m²/k³', { dash: true }], ['green', 'exact 2m(m+1)/k(k+1)(k+2)']]);
        v.readout(() => {
          if (!st) return '';
          const { m, D, B } = st, mo = model.value;
          const k5 = B.rec[0] && B.rec[0].length ? B.rec[0][B.rec[0].length - 1] : null;
          const g = isFinite(D.slope) ? v.fix(-D.slope, 2) : '—';
          const fig = mo !== 'B' && k5 ? ` · vertex 5 has degree ${k5[1]} at t = ${k5[0].toLocaleString('en-US')} (theory $m\\sqrt{t/5}$ = ${Math.round(m * Math.sqrt(k5[0] / 5))})` : '';
          return `${mo === 'BA' ? 'growth with preferential attachment' : mo === 'A' ? 'model A, growth with uniform attachment' : 'model B, preferential attachment without growth (k + 1 weighting, 3 links per vertex on average)'}, $m = ${m}$: slope of the log-binned tail ${mo === 'BA' ? `**−${g}**, i.e. $\\gamma \\approx ${g}$ (paper: 2.9 ± 0.1; theory 3)` : `${g === '—' ? 'undefined' : '−' + g}, but the points bend: no power law`}; largest degree ${D.kmax.toLocaleString('en-US')}${fig} · real networks in the paper: actors γ = 2.3, web 2.1, power grid ≈ 4 · today: of 927 networks tested by Broido & Clauset (2019) only about 4% are strongly scale-free`;
        });
      },
    },
  ],
};
