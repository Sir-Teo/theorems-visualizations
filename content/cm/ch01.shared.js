// Condensed Matter Physics — Chapter 1: helpers shared by ch01.js and ch01-b.js.
//
// Units used by the 1D crystal models (a = lattice constant, ħ = m = 1 inside the solvers):
//   wave vectors k in units of π/a  (the zone edge is k = 1, reciprocal-lattice vectors are G = 2n),
//   energies in units of E₁ = ħ²π²/(2 m a²), the free-electron energy at the zone edge, so that a free electron has e(k) = k².
// With V(x) = Σ_n U_n e^{2πi n x/a}, the plane-wave Hamiltonian at crystal momentum k is
//   H_{mm'} = (k + 2m)² δ_{mm'} + U_{m−m'},   m, m' = −N … N.

export const TAU = 2 * Math.PI;
/** One colour per band (palette names). */
export const BAND_COL = ['accent', 'orange', 'green', 'purple', 'teal', 'pink'];
export const bandColor = (i) => BAND_COL[i % BAND_COL.length];

// ------------------------------------------------------------------ nearly free electrons (plane-wave basis)

/** Eigen-decomposition of the plane-wave Hamiltonian at k. U = [U₁, U₂, …] are the (real, even) Fourier amplitudes at G = 2, 4, …
 *  → {E (ascending), C (C[j][m+N] = coefficient of the plane wave e^{i(k+2m)x} in state j)}. */
export function nfeSolve(M, U, k, N = 6) {
  const n = 2 * N + 1, H = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    H[i][i] = (k + 2 * (i - N)) ** 2;
    for (let j = 0; j < n; j++) { const d = Math.abs(i - j); if (d > 0 && d <= U.length) H[i][j] = U[d - 1]; }
  }
  const e = M.eigSym(H), idx = e.values.map((_, i) => i).reverse();
  return { E: idx.map((i) => e.values[i]), C: idx.map((i) => e.vecs[i]), N };
}
/** Lowest nb bands of the nearly-free-electron model on the k-list ks → [band][k] energies. */
export function nfeBands(M, U, ks, nb = 4, N = 6) {
  const out = Array.from({ length: nb }, () => new Float64Array(ks.length));
  ks.forEach((k, i) => { const r = nfeSolve(M, U, k, N); for (let b = 0; b < nb; b++) out[b][i] = r.E[b]; });
  return out;
}
/** Potential energy V(x) (E₁ units, x in units of a) for Fourier amplitudes U. */
export const nfePotential = (U, x) => { let s = 0; U.forEach((u, i) => { s += 2 * u * Math.cos(TAU * (i + 1) * x); }); return s; };
/** Bloch function Σ_m c_m e^{i(k+2m)πx} (k, x in units π/a, a) → {re, im}. */
export function blochAt(C, N, k, x) {
  let re = 0, im = 0;
  for (let i = 0; i < C.length; i++) { const ph = Math.PI * (k + 2 * (i - N)) * x; re += C[i] * Math.cos(ph); im += C[i] * Math.sin(ph); }
  return { re, im };
}
/** Extended-zone wave vector of band n (1-based) at reduced k ∈ [0,1]: zone n covers |k| ∈ [n−1, n]. */
export const extK = (n, k) => (n % 2 === 1 ? n - 1 + k : n - k);
/** Reciprocal-lattice shift 2·round(k/2) that folds an extended k into the first zone. */
export const foldShift = (kext) => 2 * Math.round(kext / 2);

// ------------------------------------------------------------------ Kronig–Penney (exact, transfer matrix)
// Unit cell of length 1 (= a): barrier of height V0 (E₁ units) and width b centred on x = 0, free elsewhere.
// Transfer matrix of (ψ, ψ') over a slab of constant V and length d: [[cos κd, sin κd/κ], [−κ sin κd, cos κd]], κ² = π²(e − V)
// (cosh/sinh when e < V). cos(πk) = ½ tr(M) — the Bloch condition for k in units of π/a.
function slab2(k2, d) {
  if (k2 > 1e-12) { const k = Math.sqrt(k2), c = Math.cos(k * d), s = Math.sin(k * d); return [c, s / k, -k * s, c]; }
  if (k2 < -1e-12) { const q = Math.sqrt(-k2), c = Math.cosh(q * d), s = Math.sinh(q * d); return [c, s / q, q * s, c]; }
  return [1, d, k2 * d, 1];
}
const mm = (A, B) => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];
/** D(e) = ½ tr M(e): allowed energies are |D| ≤ 1. */
export function kpD(e, V0, b) {
  const w = 1 - b, P = mm(slab2(Math.PI ** 2 * (e - V0), b), slab2(Math.PI ** 2 * e, w));
  return 0.5 * (P[0] + P[3]);
}
/** Allowed bands [[lo, hi], …] of the Kronig–Penney model below e = emax (scan + bisection on |D| = 1). */
export function kpEdges(V0, b, emax, nbMax = 8) {
  const step = 0.004, bands = [], g = (e) => Math.abs(kpD(e, V0, b)) - 1;
  const refine = (a, c) => { let lo = a, hi = c; const ga = g(a) <= 0; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if ((g(m) <= 0) === ga) lo = m; else hi = m; } return (lo + hi) / 2; };
  let e0 = 1e-4, inside = g(e0) <= 0, start = inside ? e0 : null;
  for (let e = e0 + step; e < emax && bands.length < nbMax; e += step) {
    const now = g(e) <= 0;
    if (now && !inside) start = refine(e - step, e);
    if (!now && inside) bands.push([start, refine(e - step, e)]);
    inside = now;
  }
  return bands;
}
/** Energy of Kronig–Penney band n (0-based) at k ∈ [0,1] (units π/a), given its edges from kpEdges. */
export function kpEnergy(V0, b, edge, n, k) {
  let [lo, hi] = edge[n]; const c = Math.cos(Math.PI * k), s = kpD(lo, V0, b) - c; // D − cos(πk) monotone inside a band
  for (let i = 0; i < 48; i++) { const m = (lo + hi) / 2, f = kpD(m, V0, b) - c; if ((f > 0) === (s > 0)) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
/** Kronig–Penney bands on a k-list → [band][k]. */
export function kpBands(V0, b, ks, nb = 4) {
  const edge = kpEdges(V0, b, (nb + 1.2) ** 2 + V0 * 0.5 + 2, nb + 2), n = Math.min(nb, edge.length);
  const out = Array.from({ length: nb }, () => new Float64Array(ks.length).fill(NaN));
  for (let b2 = 0; b2 < n; b2++) ks.forEach((k, i) => { out[b2][i] = kpEnergy(V0, b, edge, b2, k); });
  return { bands: out, edge };
}

// ------------------------------------------------------------------ real-space ring (Bloch's theorem checked by brute force)
/** A ring of nc cells with ppc grid points per cell, 4th-order finite differences for −(1/π²)ψ'' + V(x)ψ (E₁ units, a = 1).
 *  Diagonalised completely; the crystal momentum of each state is read off from the cell-translation operator T (T ψ = e^{iπk}ψ):
 *  within a degenerate pair ±k only the trace of T is basis independent, tr T = 2 cos πk.
 *  → [{E, k (0…1), pair (true for a ±k pair)}], ascending. */
export function ringStates(M, V, nc, ppc) {
  const n = nc * ppc, h = 1 / ppc, c = 1 / (Math.PI ** 2 * 12 * h * h), H = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let j = 0; j < n; j++) {
    H[j][j] += 30 * c + V((j + 0.5) * h);
    for (const [d, w] of [[1, -16], [2, 1]]) { const a = (j + d) % n, b = (j - d + n) % n; H[j][a] += w * c; H[j][b] += w * c; }
  }
  const e = M.eigSym(H), E = e.values.slice().reverse(), vec = e.vecs.slice().reverse();
  const Tm = (u) => { let s = 0; for (let j = 0; j < n; j++) s += u[(j + ppc) % n] * u[j]; return s; };
  const out = [];
  for (let i = 0; i < n && out.length < 6 * nc;) {
    let j = i + 1; while (j < n && Math.abs(E[j] - E[i]) < 1e-7 * (1 + Math.abs(E[i]))) j++;
    const size = j - i;
    if (size === 1) out.push({ E: E[i], k: Tm(vec[i]) > 0 ? 0 : 1, pair: false });
    else if (size === 2) {
      const tr = Tm(vec[i]) + Tm(vec[i + 1]);
      if (Math.abs(tr) > 2 - 1e-5) { const k = tr > 0 ? 0 : 1; out.push({ E: E[i], k, pair: false }, { E: E[i + 1], k, pair: false }); }
      else out.push({ E: E[i], k: Math.acos(Math.max(-1, Math.min(1, tr / 2))) / Math.PI, pair: true });
    }
    i = j;
  }
  return out;
}

// ------------------------------------------------------------------ misc
/** Fermi–Dirac-free helpers: linearly spaced list. */
export const lin = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
/** Nearest index of the sorted-or-not list vals to x. */
export const nearest = (vals, x) => { let b = 0; for (let i = 1; i < vals.length; i++) if (Math.abs(vals[i] - x) < Math.abs(vals[b] - x)) b = i; return b; };
