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
  ],
};
