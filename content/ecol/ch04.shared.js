// Ecology — Chapter 4: helpers for the competition items (plain functions, no data files).
export * from './ch03.shared.js';

/**
 * Chemostat competition of n species for k essential resources (Liebig's law, Monod uptake):
 *   mu_i(R) = min_j  r R_j / (K_ij + R_j),   dN_i/dt = N_i (mu_i - m),
 *   dR_j/dt = D (S_j - R_j) - sum_i Q_ij mu_i N_i.
 * P = { K: n×k, Q: n×k, S: k, D, m, r }.  State { N, R, t }.
 */
export function hwMu(P, i, R) {
  let g = Infinity;
  for (let j = 0; j < R.length; j++) g = Math.min(g, (P.r * R[j]) / (P.K[i][j] + R[j]));
  return g;
}
function hwF(P, N, R, dN, dR) {
  const n = N.length, k = R.length;
  for (let j = 0; j < k; j++) dR[j] = P.D * (P.S[j] - R[j]);
  for (let i = 0; i < n; i++) {
    const mu = hwMu(P, i, R);
    dN[i] = N[i] * (mu - P.m);
    for (let j = 0; j < k; j++) dR[j] -= P.Q[i][j] * mu * N[i];
  }
}
/** One RK4 step of size dt, mutating st.N, st.R, st.t. */
export function hwStep(P, st, dt) {
  const n = st.N.length, k = st.R.length;
  const aN = new Float64Array(n), aR = new Float64Array(k), bN = new Float64Array(n), bR = new Float64Array(k);
  const cN = new Float64Array(n), cR = new Float64Array(k), dN = new Float64Array(n), dR = new Float64Array(k);
  const tN = new Float64Array(n), tR = new Float64Array(k);
  const at = (h, xN, xR) => { for (let i = 0; i < n; i++) tN[i] = Math.max(0, st.N[i] + h * xN[i]); for (let j = 0; j < k; j++) tR[j] = st.R[j] + h * xR[j]; };
  hwF(P, st.N, st.R, aN, aR);
  at(dt / 2, aN, aR); hwF(P, tN, tR, bN, bR);
  at(dt / 2, bN, bR); hwF(P, tN, tR, cN, cR);
  at(dt, cN, cR); hwF(P, tN, tR, dN, dR);
  for (let i = 0; i < n; i++) st.N[i] = Math.max(0, st.N[i] + (dt / 6) * (aN[i] + 2 * bN[i] + 2 * cN[i] + dN[i]));
  for (let j = 0; j < k; j++) st.R[j] += (dt / 6) * (aR[j] + 2 * bR[j] + 2 * cR[j] + dR[j]);
  st.t += dt;
}

/** Half-saturation constant K that makes the break-even resource level (R*) equal to rs, given growth r and loss m. */
export const monodK = (rs, r, m) => (rs * (r - m)) / m;

/**
 * Graphical (invasion) analysis for two species on two essential resources.
 * sp = { z: [R1*, R2*], c: [c1, c2] } (ZNGI corner and consumption vector), S = [S1, S2].
 * Returns { eq: [R1, R2] | null, lim } — the resource level of the species alone, or null when S is below its corner.
 */
export function monoEq(sp, S) {
  const [z1, z2] = sp.z, [c1, c2] = sp.c;
  if (S[0] <= z1 || S[1] <= z2) return null;
  // vertical arm R1 = z1 (limited by resource 1):  t = (S1 - z1)/c1
  const t1 = (S[0] - z1) / c1, R2 = S[1] - t1 * c2;
  if (R2 >= z2) return { eq: [z1, R2], lim: 1 };
  const t2 = (S[1] - z2) / c2, R1 = S[0] - t2 * c1;
  return { eq: [R1, z2], lim: 2 };
}
/** Outcome by mutual-invasibility: 'A', 'B', 'coexist', 'either' (priority effect), or 'none'. */
export function invasionOutcome(A, B, S) {
  const ea = monoEq(A, S), eb = monoEq(B, S);
  if (!ea && !eb) return 'none';
  if (!ea) return 'B';
  if (!eb) return 'A';
  const bInv = ea.eq[0] > B.z[0] && ea.eq[1] > B.z[1];
  const aInv = eb.eq[0] > A.z[0] && eb.eq[1] > A.z[1];
  return aInv && bInv ? 'coexist' : aInv ? 'A' : bInv ? 'B' : 'either';
}
/** Intersection of the two L-shaped ZNGIs, or null if they do not cross. */
export function zngiCross(A, B) {
  const [a1, a2] = A.z, [b1, b2] = B.z;
  if (a1 > b1 && a2 < b2) return [a1, b2];
  if (b1 > a1 && b2 < a2) return [b1, a2];
  return null;
}
/** Draw an L-shaped zero-net-growth isocline on stage s from corner z to the window edge. */
export function drawZngi(s, z, o) {
  s.path([[z[0], 100], [z[0], z[1]], [100, z[1]]], o);
}

/** Positive part and the generic species-colour cycle used by the community pictures. */
export const SPCOL = ['accent', 'orange', 'green', 'red', 'purple', 'teal', 'pink', 'gold'];
export const spcol = (i) => SPCOL[i % SPCOL.length];

/** Solve a small dense linear system A x = b by Gaussian elimination with partial pivoting (returns null if singular). */
export function solveDense(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let q = c; q <= n; q++) M[r][q] -= f * M[c][q]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let q = r + 1; q < n; q++) s -= M[r][q] * x[q]; x[r] = s / M[r][r]; }
  return x;
}

/** Species spec for the two-resource pictures: ZNGI corner z and consumption direction at angle th (degrees from the R1 axis). */
export const rcSpec = (z, th) => ({ z, c: [Math.cos((th * Math.PI) / 180), Math.sin((th * Math.PI) / 180)] });

/**
 * Chemostat run (D = m = 0.25, r = 1) of two species on two essential resources.
 * Returns time, abundances and the resource trajectory, recorded every `every` steps.
 */
export function rcRun(A, B, S, N0, T, dt = 0.05, every = 4) {
  const r = 1, m = 0.25;
  const P = { K: [A, B].map((s) => s.z.map((z) => monoK(z, r, m))), Q: [A.c, B.c], S, D: 0.25, m, r };
  const st = { N: [N0[0], N0[1]], R: [S[0], S[1]], t: 0 };
  const out = { t: [0], NA: [N0[0]], NB: [N0[1]], R: [[S[0], S[1]]] };
  const steps = Math.round(T / dt);
  for (let s = 1; s <= steps; s++) {
    hwStep(P, st, dt);
    if (s % every === 0) { out.t.push(st.t); out.NA.push(st.N[0]); out.NB.push(st.N[1]); out.R.push([st.R[0], st.R[1]]); }
  }
  return out;
}
const monoK = monodK;

/** Lotka–Volterra competition dN_i/dt = r_i N_i (1 - (N_i + a_ij N_j)/K_i), RK4. Returns { t, x, y }. */
export function lvComp(p, x0, y0, T, n = 400) {
  const f = (x, y) => [p.r1 * x * (1 - (x + p.a12 * y) / p.K1), p.r2 * y * (1 - (y + p.a21 * x) / p.K2)];
  const h = T / n, t = [0], X = [x0], Y = [y0];
  let x = x0, y = y0;
  for (let i = 0; i < n; i++) {
    const k1 = f(x, y), k2 = f(x + (h / 2) * k1[0], y + (h / 2) * k1[1]), k3 = f(x + (h / 2) * k2[0], y + (h / 2) * k2[1]), k4 = f(x + h * k3[0], y + h * k3[1]);
    x = Math.max(0, x + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]));
    y = Math.max(0, y + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]));
    t.push((i + 1) * h); X.push(x); Y.push(y);
  }
  return { t, x: X, y: Y };
}

/**
 * Janzen–Connell forest on an L×L torus: one tree per cell, S species. Each generation a fraction `mort` of trees dies; each
 * vacated cell is refilled by a seedling whose species is drawn with weight  seed_s · exp(-gamma · cons_s),
 * where seed_s = Σ exp(-d/lam) over adults of species s within Chebyshev radius R (seed rain) and
 * cons_s = Σ exp(-(d/rc)²) over the same adults (conspecific crowding; the enemy effect). gamma = 0 is the neutral forest.
 */
export function jcInit(L, S, rng) {
  const g = new Int16Array(L * L);
  for (let i = 0; i < g.length; i++) g[i] = Math.floor(rng() * S);
  return { L, S, g, rng, gen: 0 };
}
export function jcRichness(st) { const seen = new Uint8Array(st.S); let n = 0; for (const s of st.g) if (!seen[s]) { seen[s] = 1; n++; } return n; }
export function jcStep(st, o) {
  const { L, S, g, rng } = st, R = o.R || 7, lam = o.lam || 2, rc = o.rc || 2.5, gamma = o.gamma, mort = o.mort || 0.1;
  const dead = [];
  for (let i = 0; i < g.length; i++) if (rng() < mort) { dead.push(i); g[i] = -1; }
  const seed = new Float64Array(S), cons = new Float64Array(S);
  for (const i of dead) {
    const x = i % L, y = (i - x) / L;
    seed.fill(0); cons.fill(0);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const s = g[((y + dy + L) % L) * L + ((x + dx + L) % L)];
      if (s < 0) continue;
      const d = Math.hypot(dx, dy);
      if (d === 0) continue;
      seed[s] += Math.exp(-d / lam);
      cons[s] += Math.exp(-((d / rc) ** 2));
    }
    let tot = 0;
    for (let s = 0; s < S; s++) { seed[s] *= Math.exp(-gamma * cons[s]); tot += seed[s]; }
    let pick;
    if (tot <= 0) { pick = Math.floor(rng() * S); } else { let u = rng() * tot; pick = 0; while (pick < S - 1 && u > seed[pick]) { u -= seed[pick]; pick++; } }
    g[i] = pick;
  }
  st.gen++;
}
