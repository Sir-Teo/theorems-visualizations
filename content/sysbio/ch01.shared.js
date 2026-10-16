// Systems Biology — Chapter 1 shared helpers (Hill functions, production–degradation, E. coli network subset, motif counting).

export const LN2 = Math.LN2;

/** Activating Hill function x^n / (K^n + x^n). */
export const hillAct = (x, K, n) => { const u = Math.pow(Math.max(x, 0) / K, n); return u / (1 + u); };
/** Repressing Hill function K^n / (K^n + x^n). */
export const hillRep = (x, K, n) => 1 / (1 + Math.pow(Math.max(x, 0) / K, n));

/** Exact solution of p' = beta − alpha p after time t from p0 (beta constant). */
export const relax = (p0, beta, alpha, t) => beta / alpha + (p0 - beta / alpha) * Math.exp(-alpha * t);

/** Piecewise-constant production: betaOf(t) evaluated at the start of each step of length dt; exact exponential update.
 *  Returns [[t, p], …] up to tEnd. */
export function trajectory(betaOf, alpha, p0, tEnd, dt) {
  const out = [[0, p0]]; let p = p0;
  const n = Math.round(tEnd / dt);
  for (let i = 0; i < n; i++) { p = relax(p, betaOf((i + 0.5) * dt), alpha, dt); out.push([(i + 1) * dt, p]); }
  return out;
}

/** Fixed-step RK4 for a vector ODE y' = F(t, y). Returns an array of states sampled each `every` steps: [[t, ...y]]. */
export function rk4Path(F, y0, t1, n, every = 1) {
  const h = t1 / n, out = [[0, ...y0]]; let y = y0.slice(), t = 0;
  const add = (a, b, c) => a.map((x, i) => x + c * b[i]);
  for (let k = 1; k <= n; k++) {
    const k1 = F(t, y), k2 = F(t + h / 2, add(y, k1, h / 2)), k3 = F(t + h / 2, add(y, k2, h / 2)), k4 = F(t + h, add(y, k3, h));
    y = y.map((x, i) => x + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); t += h;
    if (k % every === 0) out.push([t, ...y]);
  }
  return out;
}

/** First time the sampled path [[t, p]] crosses `level` (linear interpolation) going up or down; NaN if never. */
export function crossing(path, level, col = 1) {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1][col], b = path[i][col];
    if ((a - level) * (b - level) <= 0 && a !== b) return path[i - 1][0] + ((level - a) / (b - a)) * (path[i][0] - path[i - 1][0]);
  }
  return NaN;
}

/** Seeded Gillespie run of the birth–death process ∅ → X (rate beta(t) piecewise via betaOf at the event time), X → ∅ (alpha X).
 *  Time-dependent production is handled exactly for a square-wave by thinning is overkill here: we simply restart the SSA at every
 *  switching time (memoryless). `switches`: sorted times where beta changes; betas: value on each interval. Returns [[t, x]] step path. */
export function birthDeath(r, betas, switches, alpha, x0, tEnd) {
  const bounds = [0, ...switches.filter((s) => s > 0 && s < tEnd), tEnd];
  let x = x0, out = [[0, x0]];
  for (let k = 0; k + 1 < bounds.length; k++) {
    const beta = betas[Math.min(k, betas.length - 1)] ?? betas[betas.length - 1];
    let t = bounds[k]; const t1 = bounds[k + 1];
    for (let guard = 0; guard < 200000; guard++) {
      const a1 = beta, a2 = alpha * x, a0 = a1 + a2;
      if (a0 <= 0) break;
      t += -Math.log(1 - r()) / a0;
      if (t >= t1) break;
      x += r() * a0 < a1 ? 1 : -1;
      out.push([t, x]);
    }
    out.push([t1, x]);
  }
  return out;
}
/** Value of a step path [[t, x]] at time t. */
export function stepAt(path, t) {
  let lo = 0, hi = path.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (path[m][0] <= t) lo = m; else hi = m; }
  return path[lo][1];
}

/** Monotone cubic (Fritsch–Carlson) interpolant through (xs, ys), xs increasing; constant outside. */
export function pchip(xs, ys) {
  const n = xs.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (ys[i + 1] - ys[i - 1]) / (xs[i + 1] - xs[i - 1]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

/** Bisection for the x in [a, b] where f(x) = level, f monotone (either direction). */
export function invert(f, level, a, b) {
  const up = f(b) > f(a);
  for (let i = 0; i < 70; i++) { const m = (a + b) / 2; if ((f(m) < level) === up) a = m; else b = m; }
  return (a + b) / 2;
}

// ---------------------------------------------------------------- E. coli regulatory network (curated subset)
// A hand-written subset of direct interactions (textbook systems: lac, ara, mal, gal, SOS, arginine, tryptophan, anaerobic
// respiration, flagella). Written from memory of the literature: illustrative, NOT the 577-interaction RegulonDB data set.
export const TFS = ['CRP', 'LacI', 'AraC', 'MalT', 'GalR', 'GalS', 'LexA', 'ArgR', 'TrpR', 'FNR', 'NarL', 'FlhDC', 'FliA'];
export const ECOLI_EDGES = [
  ['CRP', 'CRP', -1], ['CRP', 'lacZYA', 1], ['CRP', 'araBAD', 1], ['CRP', 'AraC', 1], ['CRP', 'MalT', 1], ['CRP', 'malEFG', 1], ['CRP', 'galETK', 1], ['CRP', 'FlhDC', 1],
  ['LacI', 'LacI', -1], ['LacI', 'lacZYA', -1],
  ['AraC', 'AraC', -1], ['AraC', 'araBAD', 1],
  ['MalT', 'malEFG', 1],
  ['GalR', 'galETK', -1], ['GalS', 'galETK', -1], ['GalS', 'GalS', -1],
  ['LexA', 'LexA', -1], ['LexA', 'recA', -1], ['LexA', 'uvrA', -1], ['LexA', 'uvrB', -1], ['LexA', 'sulA', -1], ['LexA', 'umuDC', -1], ['LexA', 'ruvAB', -1], ['LexA', 'dinB', -1],
  ['ArgR', 'ArgR', -1], ['ArgR', 'argA', -1], ['ArgR', 'argCBH', -1], ['ArgR', 'argD', -1], ['ArgR', 'argE', -1], ['ArgR', 'argF', -1], ['ArgR', 'carAB', -1],
  ['TrpR', 'TrpR', -1], ['TrpR', 'trpLEDCBA', -1], ['TrpR', 'aroH', -1], ['TrpR', 'mtr', -1],
  ['FNR', 'FNR', -1], ['FNR', 'NarL', 1], ['FNR', 'narGHJI', 1], ['NarL', 'narGHJI', 1], ['FNR', 'fdnGHI', 1], ['NarL', 'fdnGHI', 1], ['FNR', 'frdABCD', 1], ['NarL', 'frdABCD', -1],
  ['FlhDC', 'FliA', 1], ['FlhDC', 'flgAMN', 1], ['FlhDC', 'fliLMNOPQR', 1], ['FliA', 'fliC', 1], ['FliA', 'motAB', 1], ['FliA', 'tar', 1],
];

// ---------------------------------------------------------------- motif counting on signed digraphs
/** edges: [[a, b, sign]] over node indices; returns adjacency sets (no self loops considered for motif counts). */
export function adjacency(n, edges) {
  const out = Array.from({ length: n }, () => new Set()), inn = Array.from({ length: n }, () => new Set());
  for (const [a, b] of edges) if (a !== b) { out[a].add(b); inn[b].add(a); }
  return { out, inn };
}
/** Count patterns: ffl, cycle3, cascade (a→b→c without a→c, a≠c), fanout (Σ C(outdeg,2)), bifan (pairs a<b sharing k targets: C(k,2)). */
export function countMotifs(n, edges) {
  const { out, inn } = adjacency(n, edges);
  let ffl = 0, cycle3 = 0, cascade = 0, fanout = 0, bifan = 0;
  for (let a = 0; a < n; a++) {
    const k = out[a].size; fanout += (k * (k - 1)) / 2;
    for (const b of out[a]) for (const c of out[b]) {
      if (c === a) continue;
      if (out[a].has(c)) ffl++; else cascade++;
      if (out[c].has(a)) cycle3++;
    }
  }
  cycle3 /= 3;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    let k = 0; const s = out[a].size < out[b].size ? out[a] : out[b], o = s === out[a] ? out[b] : out[a];
    for (const c of s) if (o.has(c)) k++;
    bifan += (k * (k - 1)) / 2;
  }
  return { ffl, cycle3, cascade, fanout, bifan };
}
/** Instances of feed-forward loops: [[x, y, z]] with x→y, y→z, x→z. */
export function findFFLs(n, edges) {
  const { out } = adjacency(n, edges), res = [];
  for (let a = 0; a < n; a++) for (const b of out[a]) for (const c of out[b]) if (c !== a && out[a].has(c)) res.push([a, b, c]);
  return res;
}
/** Degree-preserving randomisation by edge switching (a→b, c→d ⇒ a→d, c→b), rejecting self loops and multi-edges.
 *  Self-regulation edges are left alone. r is a seeded RNG. Returns a new edge list. */
export function randomize(n, edges, r, sweeps = 10) {
  const fixed = edges.filter((e) => e[0] === e[1]), E = edges.filter((e) => e[0] !== e[1]).map((e) => e.slice());
  const has = new Set(E.map((e) => e[0] * n + e[1]));
  for (const e of fixed) has.add(e[0] * n + e[1]);
  const m = E.length;
  for (let s = 0; s < sweeps * m; s++) {
    const i = Math.floor(r() * m), j = Math.floor(r() * m);
    if (i === j) continue;
    const [a, b] = E[i], [c, d] = E[j];
    if (a === d || c === b || a === c || b === d) continue;
    if (has.has(a * n + d) || has.has(c * n + b)) continue;
    has.delete(a * n + b); has.delete(c * n + d); has.add(a * n + d); has.add(c * n + b);
    E[i][1] = d; E[j][1] = b;
  }
  return [...E, ...fixed.map((e) => e.slice())];
}

/** A synthetic transcription network with a tunable excess of feed-forward loops (illustrative, not data).
 *  nGen general regulators, nSpec specific ones, nTar target operons. bias in [0,1]: chance that X→Y is completed to a loop X→Z for each Y→Z. */
export function makeNetwork(r, { nGen = 4, nSpec = 14, nTar = 90, bias = 0.8, coherent = 0.85 } = {}) {
  const n = nGen + nSpec + nTar, edges = [], has = new Set();
  const add = (a, b) => { if (a === b || has.has(a * n + b)) return false; has.add(a * n + b); edges.push([a, b, r() < coherent ? 1 : -1]); return true; };
  const gen = Array.from({ length: nGen }, (_, i) => i), spec = Array.from({ length: nSpec }, (_, i) => nGen + i);
  const tar = Array.from({ length: nTar }, (_, i) => nGen + nSpec + i);
  const wS = spec.map((_, i) => 1 / Math.pow(i + 1, 0.9)), sw = wS.reduce((a, b) => a + b, 0);
  const pickS = () => { let u = r() * sw, i = 0; while (u > wS[i] && i < nSpec - 1) { u -= wS[i]; i++; } return spec[i]; };
  const master = new Map();
  for (const y of spec) { const x = gen[Math.floor(r() * nGen)]; master.set(y, x); add(x, y); }
  for (let k = 0; k < Math.round(nSpec * 0.7); k++) add(pickS(), spec[Math.floor(r() * nSpec)]); // some specific→specific cascades
  for (const z of tar) {
    const k = r() < 0.55 ? 1 : r() < 0.7 ? 2 : 3;
    for (let j = 0; j < k; j++) {
      const y = r() < 0.12 ? gen[Math.floor(r() * nGen)] : pickS();
      add(y, z);
      if (master.has(y) && r() < bias) add(master.get(y), z);
    }
  }
  for (const g of [...gen, ...spec]) if (r() < 0.5) edges.push([g, g, -1]);
  const names = [...gen.map((i) => 'G' + (i + 1)), ...spec.map((i) => 'S' + (i - nGen + 1)), ...tar.map((i) => 'o' + (i - nGen - nSpec + 1))];
  return { n, edges, names, nGen, nSpec, nTar };
}
