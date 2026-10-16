// Quantum Chemistry — Chapter 3: helpers shared by ch03.js and ch03-b.js (re-exports the chapter-2 helpers).
// Element data: first ionization energies and ground configurations from the NIST Atomic Spectra Database (ionization-energy
// tables, Z = 1–86); electron affinities from the Wikipedia data page (Hotop & Lineberger and later measurements; negative
// entries are estimates, flagged); Pauling electronegativities from the Wikipedia data page; empirical atomic radii of Slater
// (J. Chem. Phys. 41, 3199, 1964) as tabulated on the Wikipedia data page. Configurations beyond Z = 86 follow the
// list of Madelung-rule exceptions on Wikipedia (secondary source).
export * from './ch02.shared.js';

export const SYM = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr'.split(' ');

/** First ionization energy (eV), NIST ASD, Z = 1–86 (index Z−1). */
export const IE = [13.5984, 24.5874, 5.3917, 9.3227, 8.2980, 11.2603, 14.5341, 13.6181, 17.4228, 21.5645, 5.1391, 7.6462, 5.9858, 8.1517, 10.4867, 10.3600, 12.9676, 15.7596,
  4.3407, 6.1132, 6.5615, 6.8281, 6.7462, 6.7665, 7.4340, 7.9025, 7.8810, 7.6399, 7.7264, 9.3942, 5.9993, 7.8994, 9.7886, 9.7524, 11.8138, 13.9996,
  4.1771, 5.6949, 6.2173, 6.6341, 6.7589, 7.0924, 7.1194, 7.3605, 7.4589, 8.3368, 7.5762, 8.9938, 5.7864, 7.3439, 8.6084, 9.0098, 10.4512, 12.1298,
  3.8939, 5.2117, 5.5769, 5.5386, 5.4702, 5.5248, 5.5819, 5.6437, 5.6704, 6.1498, 5.8638, 5.9391, 6.0215, 6.1077, 6.1844, 6.2542, 5.4259, 6.8251, 7.5496, 7.8640, 7.8335, 8.4382, 8.9670, 8.9588, 9.2256, 10.4375,
  6.1083, 7.4167, 7.2855, 8.4181, 9.3175, 10.7485];

/** Electron affinity (eV), Z = 1–54; `EA_EST[Z-1]` marks the negative / estimated entries (anion unbound or not measured). */
export const EA = [0.754195, -0.5, 0.618049, -0.5, 0.279723, 1.2621226, -0.07, 1.46111297, 3.4011898, -1.2, 0.547926, -0.4, 0.43283, 1.3895212, 0.746609, 2.0771042, 3.612725, -1.0,
  0.501459, 0.02455, 0.17938, 0.07554, 0.52766, 0.675928, -0.5, 0.153236, 0.662255, 1.15716, 1.23578, -0.6, 0.301166, 1.2326764, 0.804486, 2.020667, 3.363588, -1.0,
  0.485916, 0.05206, 0.31129, 0.43328, 0.9174, 0.74723, 0.55, 1.04627, 1.14289, 0.56214, 1.30447, -0.7, 0.38392, 1.11207, 1.047401, 1.970875, 3.0590465, -0.8];
export const EA_EST = EA.map((x, i) => x < 0 || i + 1 === 43);

/** Pauling electronegativity, Z = 1–54 (null for He, Ne, Ar). */
export const PAULING = [2.20, null, 0.98, 1.57, 2.04, 2.55, 3.04, 3.44, 3.98, null, 0.93, 1.31, 1.61, 1.90, 2.19, 2.58, 3.16, null,
  0.82, 1.00, 1.36, 1.54, 1.63, 1.66, 1.55, 1.83, 1.88, 1.91, 1.90, 1.65, 1.81, 2.01, 2.18, 2.55, 2.96, 3.00,
  0.82, 0.95, 1.22, 1.33, 1.6, 2.16, 1.9, 2.2, 2.28, 2.20, 1.93, 1.69, 1.78, 1.96, 2.05, 2.1, 2.66, 2.60];

/** Slater's empirical atomic radius (pm), Z = 1–86 (null where the data page gives none). */
export const RADIUS = [25, null, 145, 105, 85, 70, 65, 60, 50, null, 180, 150, 125, 110, 100, 100, 100, null,
  220, 180, 160, 140, 135, 140, 140, 140, 135, 135, 135, 135, 130, 125, 115, 115, 115, null,
  235, 200, 180, 155, 145, 145, 135, 130, 135, 140, 160, 155, 155, 145, 145, 140, 140, null,
  260, 215, 195, 185, 185, 185, 185, 185, 185, 180, 175, 175, 175, 175, 175, 175, 175, 155, 145, 135, 135, 130, 135, 135, 135, 150, 190, null, 160, 190, null, null];

// ---- configurations ---------------------------------------------------------------------------------------------------
export const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
export const subN = (s) => +s[0];
export const subL = (s) => 'spdf'.indexOf(s[1]);
export const cap = (s) => 2 * (2 * subL(s) + 1);
/** Madelung (n+l, then n) filling for Z electrons: {subshell: occupancy}. */
export function madelung(Z) {
  const occ = {}; let left = Z;
  for (const s of ORDER) { const k = Math.min(left, cap(s)); if (k > 0) occ[s] = k; left -= k; if (left <= 0) break; }
  return occ;
}
/** Experimental ground configurations that break the Madelung rule (Z ≤ 103), as overrides of the Madelung occupancy. */
export const EXCEPTIONS = {
  24: { '4s': 1, '3d': 5 }, 29: { '4s': 1, '3d': 10 }, 41: { '5s': 1, '4d': 4 }, 42: { '5s': 1, '4d': 5 }, 44: { '5s': 1, '4d': 7 },
  45: { '5s': 1, '4d': 8 }, 46: { '5s': 0, '4d': 10 }, 47: { '5s': 1, '4d': 10 }, 57: { '4f': 0, '5d': 1 }, 58: { '4f': 1, '5d': 1 },
  64: { '4f': 7, '5d': 1 }, 78: { '6s': 1, '5d': 9 }, 79: { '6s': 1, '5d': 10 }, 89: { '5f': 0, '6d': 1 }, 90: { '5f': 0, '6d': 2 },
  91: { '5f': 2, '6d': 1 }, 92: { '5f': 3, '6d': 1 }, 93: { '5f': 4, '6d': 1 }, 96: { '5f': 7, '6d': 1 }, 103: { '6d': 0, '7p': 1 },
};
/** Ground-state configuration {subshell: occupancy} (experimental: Madelung with the exceptions applied). */
export function groundConfig(Z) {
  const occ = madelung(Z), ex = EXCEPTIONS[Z];
  if (ex) for (const k in ex) { if (ex[k] === 0) delete occ[k]; else occ[k] = ex[k]; }
  return occ;
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sup = (k) => String(k).split('').map((d) => SUP[+d]).join('');
const NOBLE = [[2, 'He'], [10, 'Ne'], [18, 'Ar'], [36, 'Kr'], [54, 'Xe'], [86, 'Rn']];
/** Configuration as a string with noble-gas core, subshells in the Madelung display order (n, then l): "[Ar] 3d⁵ 4s¹". */
export function configText(Z, occ = groundConfig(Z)) {
  let core = null; for (const [z, s] of NOBLE) if (Z > z) core = [z, s];
  const coreOcc = core ? madelung(core[0]) : {};
  const keys = Object.keys(occ).filter((k) => (occ[k] || 0) - (coreOcc[k] || 0) > 0).sort((a, b) => subN(a) - subN(b) || subL(a) - subL(b));
  return (core ? `[${core[1]}] ` : '') + keys.map((k) => k + sup(occ[k] - (coreOcc[k] || 0))).join(' ');
}
/** Block letter of the element = type of the last subshell filled by the Madelung rule. */
export function blockOf(Z) { const o = madelung(Z); const ks = Object.keys(o); return ks[ks.length - 1][1]; }

/** Position (col 0–17, row 0–9) of element Z in a long-form table with the f-block rows La–Lu and Ac–Lr below (Z ≤ 103). */
export function tablePos(Z) {
  if (Z === 1) return [0, 0]; if (Z === 2) return [17, 0];
  if (Z <= 4) return [Z - 3, 1]; if (Z <= 10) return [Z + 7, 1];
  if (Z <= 12) return [Z - 11, 2]; if (Z <= 18) return [Z - 1, 2];
  if (Z <= 36) return [Z - 19, 3]; if (Z <= 54) return [Z - 37, 4];
  if (Z <= 56) return [Z - 55, 5]; if (Z <= 71) return [Z - 55, 8];
  if (Z <= 86) return [Z - 69, 5];
  if (Z <= 88) return [Z - 87, 6]; return [Z - 87, 9];
}

// ---- Slater's rules (Phys. Rev. 36, 57, 1930) --------------------------------------------------------------------------
/** Slater groups of a configuration, in order: [{label, n, l, N, sub: [subshells]}] ((ns, np) share a group). */
export function slaterGroups(occ) {
  const gs = [];
  for (const s of Object.keys(occ).sort((a, b) => subN(a) - subN(b) || subL(a) - subL(b))) {
    const n = subN(s), l = subL(s), sp = l <= 1;
    const last = gs[gs.length - 1];
    if (sp && last && last.sp && last.n === n) { last.N += occ[s]; last.sub.push(s); } else gs.push({ n, l: sp ? 0 : l, sp, N: occ[s], sub: [s] });
  }
  return gs;
}
/** Shielding constant s of group index g (Slater's rules). */
export function slaterShield(gs, g) {
  const G = gs[g]; let s = G.n === 1 ? 0.30 * (G.N - 1) : 0.35 * (G.N - 1);
  for (let i = 0; i < g; i++) { const H = gs[i]; s += G.sp ? (H.n === G.n - 1 ? 0.85 : 1.0) * H.N : 1.0 * H.N; }
  return s;
}
/** Slater effective nuclear charge Z − s of group g of the ground configuration of element Z (outermost group by default). */
export function slaterZeff(Z, g, occ = groundConfig(Z)) {
  const gs = slaterGroups(occ); if (g === undefined) g = gs.length - 1;
  return Z - slaterShield(gs, g);
}
export const NSTAR = { 1: 1, 2: 2, 3: 3, 4: 3.7, 5: 4.0, 6: 4.2 };

/** Number of electrons of Z that count as "valence" for periodic trends: occupancy of the outermost Madelung-class subshell (for the trend notes). */
export function outermost(Z) {
  const o = groundConfig(Z); const nmax = Math.max(...Object.keys(o).map(subN));
  const ks = Object.keys(o).filter((k) => subN(k) === nmax).sort((a, b) => subL(a) - subL(b));
  return { n: nmax, ks, occ: o };
}
