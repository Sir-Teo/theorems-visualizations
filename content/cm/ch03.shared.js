// Condensed Matter Physics — Chapter 3: helpers shared by ch03.js and ch03-b.js.
// Re-exports the chapter-2 helpers (Bloch–Grüneisen integral, Fermi function, …) and adds lattice sums, a phonon dynamical-matrix model,
// Debye-model amplitudes and Feynman's variational polaron.
export * from './ch02.shared.js';

export const PI = Math.PI;
/** Bose–Einstein occupation for x = ħω/kT. */
export const bose = (x) => (x < 1e-9 ? 1e9 : 1 / Math.expm1(Math.min(x, 700)));

// ------------------------------------------------------------------ 3.1: Madelung sums for rock salt
// Ion at the origin, charges (−1)^{j+k+l} at integer sites (spacing = 1 = nearest-neighbour distance), sum of ±1/r.
// Returns, for cutoff N = 1..NMAX, the partial sum over |j|,|k|,|l| ≤ N ("sharp cube"), the same cube with Evjen weights
// (½ on faces, ¼ on edges, ⅛ on corners of the boundary cube), and the sum over all sites with r ≤ N ("sphere").
let MAD = null;
export function madelung(NMAX = 30) {
  if (MAD && MAD.NMAX >= NMAX) return MAD;
  const cube = new Float64Array(NMAX + 1), evjen = new Float64Array(NMAX + 1), sphere = new Float64Array(NMAX + 1), net = new Float64Array(NMAX + 1);
  const shell = new Float64Array(NMAX + 1), faceW = new Float64Array(NMAX + 1);
  const sph = []; // [r, term] for the sphere sum
  for (let j = -NMAX; j <= NMAX; j++) for (let k = -NMAX; k <= NMAX; k++) for (let l = -NMAX; l <= NMAX; l++) {
    if (!j && !k && !l) continue;
    const m = Math.max(Math.abs(j), Math.abs(k), Math.abs(l)), s = (j + k + l) & 1 ? -1 : 1, r = Math.hypot(j, k, l), t = s / r;
    shell[m] += t;
    const nb = (Math.abs(j) === m) + (Math.abs(k) === m) + (Math.abs(l) === m); // number of coordinates on the boundary: face 1, edge 2, corner 3
    faceW[m] += t * (1 / (1 << nb)); // weight ½, ¼, ⅛ when this site is on the boundary of cube m
    net[m] += s;
    if (r <= NMAX) sph.push([r, t]);
  }
  sph.sort((a, b) => a[0] - b[0]);
  let c = 0, ev = 0, q = 0, ip = 0, sp = 0;
  for (let n = 1; n <= NMAX; n++) {
    // Evjen sum for cutoff n: full weight inside cube n−1, boundary weights on cube n
    evjen[n] = c + faceW[n]; c += shell[n]; cube[n] = c; q += net[n]; net[n] = q;
    while (ip < sph.length && sph[ip][0] <= n + 1e-9) sp += sph[ip++][1];
    sphere[n] = sp;
  }
  return (MAD = { NMAX, cube, evjen, sphere, net, exact: 1.747565 });
}

// ------------------------------------------------------------------ 3.2: Lennard-Jones lattice sums
// S_n = Σ_{j≠0} (d/r_j)^n over a lattice with nearest-neighbour distance d = 1, cutoff Rc. Cached.
const LJS = {};
export function ljSums(struct, Rc = 11) {
  if (LJS[struct]) return LJS[struct];
  let basis, a1, a2, a3, vol, d;
  if (struct === 'fcc') { // conventional cubic cell with 4 atoms, edge a = √2
    const a = Math.SQRT2; basis = [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]].map((p) => p.map((x) => x * a)); a1 = [a, 0, 0]; a2 = [0, a, 0]; a3 = [0, 0, a]; vol = a ** 3 / 4;
  } else if (struct === 'bcc') { // nearest neighbour a√3/2 = 1
    const a = 2 / Math.sqrt(3); basis = [[0, 0, 0], [0.5, 0.5, 0.5]].map((p) => p.map((x) => x * a)); a1 = [a, 0, 0]; a2 = [0, a, 0]; a3 = [0, 0, a]; vol = a ** 3 / 2;
  } else { // ideal hcp: a = 1, c = √(8/3)
    const c = Math.sqrt(8 / 3); basis = [[0, 0, 0], [0.5, Math.sqrt(3) / 6, c / 2]]; a1 = [1, 0, 0]; a2 = [0.5, Math.sqrt(3) / 2, 0]; a3 = [0, 0, c]; vol = (Math.sqrt(3) / 2) * c / 2;
  }
  d = 1; let s6 = 0, s12 = 0, nn = 0; const shellMap = new Map(); const M = Math.ceil(Rc * 1.2) + 1;
  for (let i = -M; i <= M; i++) for (let j = -M; j <= M; j++) for (let k = -M; k <= M; k++) {
    const R = [0, 1, 2].map((q) => i * a1[q] + j * a2[q] + k * a3[q]);
    for (let b = 0; b < basis.length; b++) {
      const dx = R[0] + basis[b][0] - basis[0][0], dy = R[1] + basis[b][1] - basis[0][1], dz = R[2] + basis[b][2] - basis[0][2], r2 = dx * dx + dy * dy + dz * dz;
      if (r2 < 1e-9 || r2 > Rc * Rc) continue;
      const r6 = r2 ** 3; s6 += 1 / r6; s12 += 1 / (r6 * r6); if (r2 < 1.0001) nn++; const key = r2.toFixed(4); shellMap.set(key, (shellMap.get(key) || 0) + 1);
    }
  }
  // continuum tail for the r^-6 sum beyond Rc (density 1/vol): ∫ 4πr² r^-6 dr / vol
  s6 += (4 * PI) / (3 * vol * Rc ** 3);
  const shells = [...shellMap.entries()].map(([k, c]) => ({ r2: +k, n: c })).sort((a, b) => a.r2 - b.r2).filter((q) => q.r2 < (Rc - 1) ** 2);
  return (LJS[struct] = { s6, s12, nn, vol, d, shells });
}
/** Energy per atom in units of ε as a function of the nearest-neighbour distance r (in units of σ). */
export const ljEnergy = (S, r) => 2 * (S.s12 / r ** 12 - S.s6 / r ** 6);

// ------------------------------------------------------------------ 3.4: phonons of a generic 3D crystal with p atoms per cubic cell
// Atoms i = 0..p−1 sit at fractional positions along the cube diagonal-ish chain; every pair within the cutoff is joined by a bond with
// force-constant tensor Φ = w(d)[K_L ê ê + K_T (1 − ê ê)], w = e^{−3(d−d_min)}; the acoustic sum rule fixes the on-site term.
export function basisPositions(p) {
  const P = [];
  for (let i = 0; i < p; i++) P.push([i / p + 0.05 * (i % 2), ((i * 0.37) % 1) * 0.5 + 0.1 * (i % 3), ((i * 0.61) % 1) * 0.5 + 0.07 * i * (i % 2)].map((x) => x));
  P[0] = [0, 0, 0];
  return P;
}
const BONDS = {};
function bondList(p, rc) {
  const key = p + ':' + rc; if (BONDS[key]) return BONDS[key];
  const pos = basisPositions(p), out = [];
  for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
    if (i === j && !a && !b && !c) continue;
    const dv = [pos[j][0] + a - pos[i][0], pos[j][1] + b - pos[i][1], pos[j][2] + c - pos[i][2]], d = Math.hypot(...dv);
    if (d < rc) out.push({ i, j, R: [a, b, c], dv, d });
  }
  return (BONDS[key] = out);
}
/** Eigenfrequencies (ascending, 3p numbers) at wave vector k = [kx, ky, kz] (units of 2π/a). `eigSym` is v.M.eigSym; `onsite` adds a pinning term at every atom
 *  (destroys translation invariance). Masses alternate 1, 1.8, 0.7, … */
export function phononFreqs(eigSym, p, k, { onsite = 0, KL = 1, KT = 0.4 } = {}) {
  const n = 3 * p, rc = p === 1 ? 1.05 : 0.9 + 0.18 * p, bonds = bondList(p, Math.min(rc, 1.5));
  const dmin = bonds.reduce((m, b) => Math.min(m, b.d), 9);
  const mass = (i) => [1, 1.8, 0.7, 1.4, 0.9][i % 5];
  const Re = Array.from({ length: n }, () => new Array(n).fill(0)), Im = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const bd of bonds) {
    const w = Math.exp(-3 * (bd.d - dmin)), e = bd.dv.map((x) => x / bd.d), ph = TAU2 * (k[0] * bd.R[0] + k[1] * bd.R[1] + k[2] * bd.R[2]), cs = Math.cos(ph), sn = Math.sin(ph);
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      const phi = w * (KT * (a === b ? 1 : 0) + (KL - KT) * e[a] * e[b]);
      Re[3 * bd.i + a][3 * bd.i + b] += phi; // on-site block: sum of the bond tensors (acoustic sum rule)
      Re[3 * bd.i + a][3 * bd.j + b] -= phi * cs; Im[3 * bd.i + a][3 * bd.j + b] -= phi * sn;
    }
  }
  for (let i = 0; i < p; i++) for (let a = 0; a < 3; a++) Re[3 * i + a][3 * i + a] += onsite;
  // mass scaling and Hermitian embedding [[A, −B],[B, A]]
  const N2 = 2 * n, H = Array.from({ length: N2 }, () => new Array(N2).fill(0));
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const s = 1 / Math.sqrt(mass(Math.floor(r / 3)) * mass(Math.floor(c / 3))), A = 0.5 * (Re[r][c] + Re[c][r]) * s, B = 0.5 * (Im[r][c] - Im[c][r]) * s;
    H[r][c] = A; H[r + n][c + n] = A; H[r][c + n] = -B; H[r + n][c] = B;
  }
  const ev = eigSym(H).values.slice().sort((x, y) => x - y), out = [];
  for (let i = 0; i < N2; i += 2) out.push(Math.sqrt(Math.max(0, ev[i])));
  return out;
}
const TAU2 = 2 * PI;

// ------------------------------------------------------------------ 3.11: Debye-model mean-square displacement
/** ∫0^X x/(e^x − 1) dx (Simpson). */
export function debyeI1(X) {
  if (X < 1e-9) return 0; X = Math.min(X, 40); const n = 200, h = X / n, f = (x) => (x < 1e-8 ? 1 : x / Math.expm1(x)); let s = f(0) + f(X);
  for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 ? 4 : 2); return (s * h) / 3;
}
/** Total ⟨u²⟩ (3D, one atom) in the Debye model: (9ħ²/(m k_B Θ)) [¼ + (T/Θ)² ∫0^{Θ/T} x/(eˣ−1) dx], SI units; mass in kg. */
export function debyeU2(T, theta, mass, hbar, kB) {
  const t = Math.max(T, 1e-3) / theta; return ((9 * hbar * hbar) / (mass * kB * theta)) * (0.25 + t * t * debyeI1(1 / t));
}

// ------------------------------------------------------------------ 3.14: Feynman's variational polaron (ħ = m = ω_LO = 1)
// E(v, w) = (3/(4v))(v − w)² − (α/√π)(v/w) ∫0^∞ e^{−τ} dτ /√(τ D(τ)),   D(τ) = 1 + (v/w²)(1 − w²/v²)... see below;
// D(τ) = 1 + v (1 − w²/v²)(1 − e^{−vτ}) / (τ w²). Model mass of the variational system: m_F = (v/w)² (electron plus the fictitious particle).
export function feynmanTrialEnergy(v, w, alpha) {
  if (v <= w) return 1e9;
  // substitute τ = s² / (1 − ...) not needed: use Gauss–Laguerre-like composite Simpson on τ ∈ [0, 40] after τ = u²
  const n = 400, U = Math.sqrt(40), h = U / n; let s = 0;
  const g = (u) => { const t = u * u; if (t < 1e-12) return 2 * w / v; const D = 1 + (v * (1 - (w * w) / (v * v)) * (1 - Math.exp(-v * t))) / (t * w * w); return (2 * u * Math.exp(-t)) / Math.sqrt(t * D); };
  s = g(0) + g(U); for (let i = 1; i < n; i++) s += g(i * h) * (i % 2 ? 4 : 2); s = (s * h) / 3;
  return (3 / (4 * v)) * (v - w) * (v - w) - ((alpha / Math.sqrt(PI)) * (v / w)) * s;
}
const FEY = {};
export function feynman(alpha) {
  const key = alpha.toFixed(4); if (FEY[key]) return FEY[key];
  // minimise over (log w, log(v/w)) by coarse grid then pattern search
  let best = { E: 1e9, w: 3, v: 3.5 };
  for (let lw = 0; lw <= 3.2; lw += 0.2) for (let lr = -3; lr <= 4; lr += 0.25) { const w = Math.exp(lw * 0.8), v = w * (1 + Math.exp(lr)), E = feynmanTrialEnergy(v, w, alpha); if (E < best.E) best = { E, w, v }; }
  let step = 0.3, lw = Math.log(best.w), lr = Math.log(best.v / best.w - 1);
  const ev = (a, b) => { const w = Math.exp(a), v = w * (1 + Math.exp(b)); return feynmanTrialEnergy(v, w, alpha); };
  let cur = ev(lw, lr);
  for (let it = 0; it < 120 && step > 1e-6; it++) {
    let moved = false;
    for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const e = ev(lw + da * step, lr + db * step); if (e < cur - 1e-14) { cur = e; lw += da * step; lr += db * step; moved = true; break; } }
    if (!moved) step /= 2;
  }
  const w = Math.exp(lw), v = w * (1 + Math.exp(lr));
  return (FEY[key] = { E: cur, v, w, mass: (v / w) ** 2 });
}
