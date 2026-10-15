// Molecule kit — ball-and-stick 3D molecules (auto-bonding by covalent radii, a small library), energy-level / MO diagrams
// with electrons filled by Aufbau + Hund, and hydrogen-like orbital slices (real ψ_nlm for n ≤ 4 from associated Laguerre
// and Legendre polynomials) drawn as signed heat maps with nodal lines. Reference: docs/kits-science.md.
//
//   const Mo = v.mol();                                   // namespace (or one-off: v.mol('draw3d', s3, 'H2O'))
//   v.render(() => Mo.draw3d(s3, 'C6H6', { labels: 'heavy' }));
//   v.render(() => Mo.levels(s, { columns: ['H 1s', 'H₂', 'H 1s'], levels: [...], links: [[0, 1], …] }));
//   v.render(() => Mo.orbitalSlice(s, '3d_{z^2}', { plane: 'xz' }));
//
// Units: Å for molecular coordinates, Bohr radii a₀ for orbitals, eV for hydrogen energies. Element colours follow CPK
// (H light, C dark, N blue, O red, F/Cl green, S gold, P orange, …) using palette names so they adapt to the theme.
// DOM-free helpers (LIBRARY, getMolecule, autoBond, formula, hydrogen, radial, laguerre, legendre, aufbau) are exported.
import { gridOf, isolines } from './fields.js';

const TAU = 2 * Math.PI;
const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };

// ------------------------------------------------------------------ elements
export const ELEMENTS = {
  H: { r: 0.31, vdw: 1.2, m: 1.008, col: 'light' }, He: { r: 0.28, vdw: 1.4, m: 4.003, col: 'teal' },
  Li: { r: 1.28, vdw: 1.82, m: 6.94, col: 'purple' }, Be: { r: 0.96, vdw: 1.53, m: 9.012, col: 'green' }, B: { r: 0.84, vdw: 1.92, m: 10.81, col: 'pink' },
  C: { r: 0.76, vdw: 1.7, m: 12.011, col: 'dark' }, N: { r: 0.71, vdw: 1.55, m: 14.007, col: 'blue' }, O: { r: 0.66, vdw: 1.52, m: 15.999, col: 'red' },
  F: { r: 0.57, vdw: 1.47, m: 18.998, col: 'green' }, Ne: { r: 0.58, vdw: 1.54, m: 20.18, col: 'teal' }, Na: { r: 1.66, vdw: 2.27, m: 22.99, col: 'purple' },
  Mg: { r: 1.41, vdw: 1.73, m: 24.305, col: 'green' }, Al: { r: 1.21, vdw: 1.84, m: 26.98, col: 'pink' }, Si: { r: 1.11, vdw: 2.1, m: 28.085, col: 'gold' },
  P: { r: 1.07, vdw: 1.8, m: 30.974, col: 'orange' }, S: { r: 1.05, vdw: 1.8, m: 32.06, col: 'gold' }, Cl: { r: 1.02, vdw: 1.75, m: 35.45, col: 'green' },
  Ar: { r: 1.06, vdw: 1.88, m: 39.95, col: 'teal' }, K: { r: 2.03, vdw: 2.75, m: 39.098, col: 'purple' }, Ca: { r: 1.76, vdw: 2.31, m: 40.078, col: 'green' },
  Fe: { r: 1.32, vdw: 2.0, m: 55.845, col: 'orange' }, Cu: { r: 1.32, vdw: 1.4, m: 63.546, col: 'orange' }, Zn: { r: 1.22, vdw: 1.39, m: 65.38, col: 'gray' },
  Br: { r: 1.2, vdw: 1.85, m: 79.904, col: 'rca' }, I: { r: 1.39, vdw: 1.98, m: 126.904, col: 'purple' },
};
const el = (s) => ELEMENTS[s] || { r: 0.8, vdw: 1.8, m: 0, col: 'pink' };

// ------------------------------------------------------------------ library (Å; experimental gas-phase geometries)
const tet = 1.087 / Math.sqrt(3);
const nh3 = (() => { const b = 1.012, a = 106.7 * Math.PI / 180, hh = 2 * b * Math.sin(a / 2), r = hh / Math.sqrt(3), h = Math.sqrt(b * b - r * r); return [['N', [0, 0, h]], ...[0, 1, 2].map((k) => ['H', [r * Math.cos(TAU * k / 3), r * Math.sin(TAU * k / 3), 0]])]; })();
const water = (() => { const b = 0.9572, a = 104.52 * Math.PI / 180; return [['O', [0, 0, 0]], ['H', [b * Math.sin(a / 2), 0, -b * Math.cos(a / 2)]], ['H', [-b * Math.sin(a / 2), 0, -b * Math.cos(a / 2)]]]; })();
const ethene = (() => { const cc = 1.339 / 2, ch = 1.087, a = (180 - 121.3) * Math.PI / 180; return [['C', [cc, 0, 0]], ['C', [-cc, 0, 0]], ['H', [cc + ch * Math.cos(a), ch * Math.sin(a), 0]], ['H', [cc + ch * Math.cos(a), -ch * Math.sin(a), 0]], ['H', [-cc - ch * Math.cos(a), ch * Math.sin(a), 0]], ['H', [-cc - ch * Math.cos(a), -ch * Math.sin(a), 0]]]; })();
const benzene = [...[0, 1, 2, 3, 4, 5].map((k) => ['C', [1.397 * Math.cos(TAU * k / 6), 1.397 * Math.sin(TAU * k / 6), 0]]), ...[0, 1, 2, 3, 4, 5].map((k) => ['H', [2.481 * Math.cos(TAU * k / 6), 2.481 * Math.sin(TAU * k / 6), 0]])];
export const LIBRARY = {
  H2: { name: 'hydrogen', atoms: [['H', [0.37, 0, 0]], ['H', [-0.37, 0, 0]]], bonds: [[0, 1, 1]] },
  H2O: { name: 'water', atoms: water, bonds: [[0, 1, 1], [0, 2, 1]] },
  CO2: { name: 'carbon dioxide', atoms: [['C', [0, 0, 0]], ['O', [1.16, 0, 0]], ['O', [-1.16, 0, 0]]], bonds: [[0, 1, 2], [0, 2, 2]] },
  CH4: { name: 'methane', atoms: [['C', [0, 0, 0]], ['H', [tet, tet, tet]], ['H', [tet, -tet, -tet]], ['H', [-tet, tet, -tet]], ['H', [-tet, -tet, tet]]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  NH3: { name: 'ammonia', atoms: nh3, bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
  C2H4: { name: 'ethylene', atoms: ethene, bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]] },
  C6H6: { name: 'benzene', atoms: benzene, bonds: [...[0, 1, 2, 3, 4, 5].map((k) => [k, (k + 1) % 6, 1.5]), ...[0, 1, 2, 3, 4, 5].map((k) => [k, k + 6, 1])] },
  SF6: { name: 'sulfur hexafluoride', atoms: [['S', [0, 0, 0]], ['F', [1.561, 0, 0]], ['F', [-1.561, 0, 0]], ['F', [0, 1.561, 0]], ['F', [0, -1.561, 0]], ['F', [0, 0, 1.561]], ['F', [0, 0, -1.561]]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1]] },
  C2H5OH: { name: 'ethanol', atoms: [['C', [1.1879, -0.3829, 0]], ['C', [0, 0.5526, 0]], ['O', [-1.1867, -0.2472, 0]], ['H', [-1.9237, 0.385, 0]], ['H', [2.1234, 0.1834, 0]], ['H', [1.1564, -1.0258, 0.8851]], ['H', [1.1564, -1.0258, -0.8851]], ['H', [0.0353, 1.2035, 0.8751]], ['H', [0.0353, 1.2035, -0.8751]]],
    bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1]] },
};
const ALIAS = { hydrogen: 'H2', water: 'H2O', 'carbon dioxide': 'CO2', methane: 'CH4', ammonia: 'NH3', ethylene: 'C2H4', ethene: 'C2H4', benzene: 'C6H6', ethanol: 'C2H5OH', C2H6O: 'C2H5OH' };
/** A molecule from the library by formula or name, or normalise a user molecule: {atoms: [{el, pos}], bonds: [[i, j, order]], name}. */
export function getMolecule(m) {
  if (typeof m === 'string') { const k = LIBRARY[m] ? m : ALIAS[m] || ALIAS[m.toLowerCase()]; if (!k) throw new Error(`mol: unknown molecule '${m}' (library: ${Object.keys(LIBRARY).join(', ')})`); m = { ...LIBRARY[k], formula: k }; }
  const atoms = m.atoms.map((a) => (Array.isArray(a) ? { el: a[0], pos: a[1] } : { el: a.el, pos: a.pos }));
  const bonds = m.bonds ? m.bonds.map((b) => [b[0], b[1], b[2] ?? 1]) : autoBond(atoms);
  return { name: m.name, formula: m.formula || formula({ atoms }), atoms, bonds };
}
/** Bonds by covalent radii: i–j bonded if d < r_i + r_j + tol (Å, default 0.4 as in Jmol); order guessed from the contraction d/(r_i + r_j) (≤ .81 triple, ≤ .9 double, C–C ≤ .95 aromatic). */
export function autoBond(atoms, tol = 0.4, orders = true) {
  const out = [];
  for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
    const a = atoms[i], b = atoms[j], d = Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b.pos[2]), s = el(a.el).r + el(b.el).r;
    if (d < s + tol && d > 0.4) { const q = d / s; out.push([i, j, !orders || a.el === 'H' || b.el === 'H' ? 1 : q <= 0.81 ? 3 : q <= 0.9 ? 2 : a.el === 'C' && b.el === 'C' && q <= 0.95 ? 1.5 : 1]); }
  }
  return out;
}
/** Hill-order formula string (C first, then H, then alphabetical), e.g. 'C2H6O'. */
export function formula(m) {
  const n = {}; for (const a of m.atoms) { const e = Array.isArray(a) ? a[0] : a.el; n[e] = (n[e] || 0) + 1; }
  const keys = Object.keys(n).sort(); const ord = n.C ? ['C', ...(n.H ? ['H'] : []), ...keys.filter((k) => k !== 'C' && k !== 'H')] : keys;
  return ord.map((k) => k + (n[k] > 1 ? n[k] : '')).join('');
}
/** Formula as TeX, e.g. '\\mathrm{C_2H_6O}'. */
export const formulaTeX = (m) => `\\mathrm{${(typeof m === 'string' && LIBRARY[m] ? m : formula(getMolecule(m))).replace(/(\d+)/g, '_{$1}')}}`;
export const molarMass = (m) => getMolecule(m).atoms.reduce((s, a) => s + el(a.el).m, 0);
export const distance = (m, i, j) => { const { atoms } = getMolecule(m), a = atoms[i].pos, b = atoms[j].pos; return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };
/** Angle i–j–k at atom j in degrees. */
export function angle(m, i, j, k) {
  const { atoms } = getMolecule(m), a = atoms[i].pos, b = atoms[j].pos, c = atoms[k].pos, u = [0, 1, 2].map((t) => a[t] - b[t]), v = [0, 1, 2].map((t) => c[t] - b[t]);
  return Math.acos((u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v))) * 180 / Math.PI;
}

// ------------------------------------------------------------------ hydrogen-like orbitals (atomic units, a₀ = 1)
/** Associated Laguerre polynomial L_k^(α)(x) (modern convention, L_1^(α) = 1 + α − x). */
export function laguerre(k, alpha, x) { if (k === 0) return 1; let a = 1, b = 1 + alpha - x; for (let i = 1; i < k; i++) { const c = ((2 * i + 1 + alpha - x) * b - (i + alpha) * a) / (i + 1); a = b; b = c; } return b; }
/** Associated Legendre P_l^m(x), m ≥ 0, without the Condon–Shortley phase. */
export function legendre(l, m, x) {
  let pmm = 1; const s = Math.sqrt(Math.max(0, 1 - x * x)); for (let i = 1; i <= m; i++) pmm *= (2 * i - 1) * s;
  if (l === m) return pmm; let p1 = x * (2 * m + 1) * pmm; if (l === m + 1) return p1;
  for (let ll = m + 2; ll <= l; ll++) { const p2 = ((2 * ll - 1) * x * p1 - (ll + m - 1) * pmm) / (ll - m); pmm = p1; p1 = p2; }
  return p1;
}
/** Radial function R_nl(r) for nuclear charge Z (∫ R² r² dr = 1). */
export function radial(n, l, r, Z = 1) {
  const rho = 2 * Z * r / n, N = Math.sqrt((2 * Z / n) ** 3 * fact(n - l - 1) / (2 * n * fact(n + l)));
  return N * Math.exp(-rho / 2) * rho ** l * laguerre(n - l - 1, 2 * l + 1, rho);
}
/** Real spherical harmonic (m > 0: cos mφ, m < 0: sin |m|φ), orthonormal on the sphere. */
export function realY(l, m, theta, phi) {
  const am = Math.abs(m), N = Math.sqrt((2 * l + 1) / (4 * Math.PI) * fact(l - am) / fact(l + am)), P = legendre(l, am, Math.cos(theta));
  return m === 0 ? N * P : Math.SQRT2 * N * P * (m > 0 ? Math.cos(am * phi) : Math.sin(am * phi));
}
const NAMES = { 0: { 0: 's' }, 1: { 0: 'p_z', 1: 'p_x', '-1': 'p_y' }, 2: { 0: 'd_{z^2}', 1: 'd_{xz}', '-1': 'd_{yz}', 2: 'd_{x^2-y^2}', '-2': 'd_{xy}' },
  3: { 0: 'f_{z^3}', 1: 'f_{xz^2}', '-1': 'f_{yz^2}', 2: 'f_{z(x^2-y^2)}', '-2': 'f_{xyz}', 3: 'f_{x(x^2-3y^2)}', '-3': 'f_{y(3x^2-y^2)}' } };
const LET = 'spdf';
/** Parse '2p_z', '3dz2', '3d_{x^2-y^2}', '4f_xyz' or {n, l, m} → {n, l, m, name (TeX)}. */
export function orbitalSpec(o) {
  if (typeof o !== 'string') { const { n, l = 0, m = 0 } = o; return { n, l, m, name: `${n}${NAMES[l]?.[m] ?? LET[l]}` }; }
  const mt = o.trim().match(/^(\d)\s*([spdf])(.*)$/i); if (!mt) throw new Error(`mol.orbital: cannot parse '${o}'`);
  const n = +mt[1], l = LET.indexOf(mt[2].toLowerCase()), want = mt[3].replace(/[_{}^\s]/g, '');
  if (l >= n) throw new Error(`mol.orbital: ${o} needs l < n`);
  for (const [m, nm] of Object.entries(NAMES[l])) if (nm.replace(/^[spdf]/, '').replace(/[_{}^\s]/g, '') === want) return { n, l, m: +m, name: `${n}${nm}` };
  if (!want) return { n, l, m: 0, name: `${n}${NAMES[l][0]}` };
  throw new Error(`mol.orbital: unknown ${LET[l]} orbital '${o}'`);
}
/** ψ_nlm(x, y, z) of a hydrogen-like atom (real orbitals), lengths in a₀. Accepts (n, l, m, Z) or a spec string/object as first argument. */
export function hydrogen(n, l, m, Z = 1) {
  if (typeof n === 'string' || typeof n === 'object') { const sp = orbitalSpec(n); Z = l ?? 1; ({ n, l, m } = sp); }
  if (!(n >= 1 && n <= 4 && l >= 0 && l < n && Math.abs(m) <= l)) throw new Error('mol.hydrogen: need 1 ≤ n ≤ 4, 0 ≤ l < n, |m| ≤ l');
  return (x, y, z) => { const r = Math.hypot(x, y, z); if (r === 0) return l === 0 ? radial(n, 0, 0, Z) * realY(0, 0, 0, 0) : 0; return radial(n, l, r, Z) * realY(l, m, Math.acos(z / r), Math.atan2(y, x)); };
}
/** Hydrogen-like energy level E_n = −13.6057 Z²/n² eV. */
export const energyH = (n, Z = 1) => -13.605693 * Z * Z / (n * n);
/** A comfortable half-width (a₀) for viewing orbitals with principal number n. */
export const orbitalExtent = (n, Z = 1) => (2.2 * n * n + 4) / Z;

// ------------------------------------------------------------------ Aufbau + Hund
/**
 * Fill `electrons` into levels [{E, deg}] in increasing energy: each level takes up to 2·deg; within a degenerate set,
 * spins go one per orbital before pairing (Hund). Returns per-level {occ, up, down} (orbital-by-orbital arrays).
 */
export function aufbau(levels, electrons) {
  const order = levels.map((L, i) => [L.E, i]).sort((a, b) => a[0] - b[0]).map(([, i]) => i), occ = levels.map(() => 0); let left = electrons;
  for (const i of order) { const cap = 2 * (levels[i].deg ?? 1), k = Math.min(cap, Math.max(0, left)); occ[i] = k; left -= k; }
  return levels.map((L, i) => spins(L.deg ?? 1, occ[i]));
}
/** Hund distribution of k electrons over g degenerate orbitals: {occ, up: [bool], down: [bool]}. */
export function spins(g, k) { const up = Math.min(k, g), dn = Math.max(0, k - g); return { occ: k, up: Array.from({ length: g }, (_, j) => j < up), down: Array.from({ length: g }, (_, j) => j < dn) }; }

// ================================================================== drawing
const FONT = (size, w = 600) => `${w} ${size}px Inter, system-ui, sans-serif`;
const bare = (t) => String(t).replace(/^\$+|\$+$/g, ''); // labels may be given with or without $…$
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
function tones(api) {
  const ink = api.rgb('ink'), pan = api.rgb('panel'), light = lum(ink) > lum(pan) ? 'ink' : 'panel', dark = light === 'ink' ? 'panel' : 'ink';
  return { light, dark, isDark: light === 'ink' };
}
function atomColor(api, e, T) {
  const c = el(e).col;
  if (c === 'light') return api.mix(T.light, 'gray', 0.12);
  if (c === 'dark') return T.isDark ? api.mix('gray', T.dark, 0.25) : api.mix(T.dark, 'gray', 0.35);
  return api.color(c);
}
const push = (s3, d, f) => (typeof s3._push === 'function' ? s3._push(d, f) : s3.q.push({ d, f }));

/**
 * Ball-and-stick (or 'spacefill' / 'stick') molecule on a Stage3D. mol: library name or {atoms, bonds?}.
 * opts {style, scale, labels: true | 'heavy', highlight: [i], center (true), bondWidth, colors: {el: palette}}. → normalised molecule.
 */
function draw3d(api, s3, mol, o = {}) {
  if (!s3 || typeof s3.project !== 'function') throw new Error('mol.draw3d(stage3d, mol): the first argument must be a 3D stage');
  const M = getMolecule(mol), T = tones(api), style = o.style || 'ballstick', k = o.scale ?? 1;
  let cx = 0, cy = 0, cz = 0; if (o.center !== false) { for (const a of M.atoms) { cx += a.pos[0]; cy += a.pos[1]; cz += a.pos[2]; } const n = M.atoms.length; cx /= n; cy /= n; cz /= n; }
  const P = M.atoms.map((a) => [a.pos[0] - cx, a.pos[1] - cy, a.pos[2] - cz]);
  const U = [Math.cos(s3.yaw), -Math.sin(s3.yaw), 0];
  const rad = (e) => k * (style === 'spacefill' ? el(e).vdw : style === 'stick' ? 0.12 : 0.18 + 0.27 * el(e).r);
  const scr = P.map((p) => s3.project(p));
  const pxR = M.atoms.map((a, i) => { const q = s3.project([P[i][0] + U[0] * rad(a.el), P[i][1] + U[1] * rad(a.el), P[i][2]]); return Math.hypot(q[0] - scr[i][0], q[1] - scr[i][1]); });
  const cols = M.atoms.map((a) => (o.colors?.[a.el] ? api.color(o.colors[a.el]) : atomColor(api, a.el, T)));
  const outline = api.color(T.isDark ? 'bg' : 'ink', T.isDark ? 0.9 : 0.55);
  let sx = 0, sy = 0; for (const q of scr) { sx += q[0]; sy += q[1]; } sx /= scr.length || 1; sy /= scr.length || 1; // screen centroid (aromatic dashes point inward)
  // bonds: two halves, each coloured like its atom; multiple bonds offset perpendicular on screen
  if (style !== 'spacefill') for (const [i, j, ord] of M.bonds) {
    const A = scr[i], B = scr[j], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const scale = (pxR[i] + pxR[j]) / (rad(M.atoms[i].el) + rad(M.atoms[j].el)) / 40;
    const w = (o.bondWidth ?? (style === 'stick' ? 7 : 5.2)) * Math.max(0.6, Math.min(1.6, scale * 1.2 || 1));
    const n = ord >= 3 ? 3 : ord >= 2 ? 2 : ord > 1 ? 2 : 1, gap = n > 1 ? w * 1.15 : 0, ww = n > 1 ? w * 0.62 : w;
    const arom = ord > 1 && ord < 2, inward = ((sx - (A[0] + B[0]) / 2) * nx + (sy - (A[1] + B[1]) / 2) * ny) >= 0 ? 1 : -1;
    const offs = n === 3 ? [-gap, 0, gap] : arom ? [0, inward * gap * 1.1] : n === 2 ? [-gap / 2, gap / 2] : [0];
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], mdz = (A[2] + B[2]) / 2;
    [[A, i], [B, j]].forEach(([E, a]) => {
      push(s3, (E[2] + mdz) / 2, (c) => {
        c.save(); c.lineCap = 'butt';
        offs.forEach((off, t) => {
          const dashed = arom && t === 1, sh = dashed ? 0.22 : 0; // aromatic dash: shortened, thinner, inside the ring
          const x0 = E[0] + nx * off + (mid[0] - E[0]) * sh * 2, y0 = E[1] + ny * off + (mid[1] - E[1]) * sh * 2, x1 = mid[0] + nx * off, y1 = mid[1] + ny * off;
          c.setLineDash(dashed ? [3.5, 3] : []);
          c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1);
          if (dashed) { c.strokeStyle = api.color('muted'); c.lineWidth = Math.max(1.6, ww * 0.55); c.stroke(); return; }
          c.strokeStyle = outline; c.lineWidth = ww + 2; c.stroke();
          c.strokeStyle = cols[a]; c.lineWidth = ww; c.stroke();
        });
        c.restore();
      });
    });
  }
  // atoms: shaded spheres
  const hl = new Set(o.highlight || []);
  M.atoms.forEach((a, i) => {
    const [X, Y, d] = scr[i], R = pxR[i];
    push(s3, d, (c) => {
      const g = c.createRadialGradient(X - R * 0.38, Y - R * 0.42, R * 0.08, X, Y, R);
      g.addColorStop(0, api.mix(cols[i], T.light, T.isDark ? 0.55 : 0.75)); g.addColorStop(0.55, cols[i]); g.addColorStop(1, api.mix(cols[i], T.isDark ? 'bg' : 'ink', 0.35));
      c.beginPath(); c.arc(X, Y, R, 0, TAU); c.fillStyle = g; c.fill(); c.lineWidth = 1; c.strokeStyle = outline; c.stroke();
      if (hl.has(i)) { c.beginPath(); c.arc(X, Y, R + 4, 0, TAU); c.lineWidth = 2.2; c.strokeStyle = api.color('gold'); c.stroke(); }
    });
    // element symbols in a last pass so bonds never hide them
    if (o.labels && (o.labels !== 'heavy' || a.el !== 'H') && R > 6) push(s3, -1e9 + d * 1e-6, (c) => {
      c.font = FONT(Math.max(10, Math.min(15, R * 0.8))); c.textAlign = 'center'; c.textBaseline = 'middle';
      const light = lum(api.rgb(cols[i])) > 140; c.lineWidth = 3; c.strokeStyle = api.color(light ? (T.isDark ? 'ink' : 'panel') : (T.isDark ? 'bg' : 'ink'), 0.55); c.fillStyle = api.color(light ? (T.isDark ? 'bg' : 'ink') : (T.isDark ? 'ink' : 'panel'));
      c.strokeText(a.el, X - R * 0.1, Y - R * 0.12); c.fillText(a.el, X - R * 0.1, Y - R * 0.12);
    });
  });
  return M;
}

/**
 * Energy-level / MO diagram on a 2D stage (axes: false).
 * spec {levels: [{E, label (TeX), deg, occ, col, type: 'bonding'|'antibonding'|'nonbonding', color}], columns: ['TeX', …],
 *       electrons: n | {col: n} (Aufbau + Hund when occ is omitted), links: [[i, j], …], unit, energies (print E), homo (mark HOMO/LUMO), range}.
 * → {homo, lumo, bondOrder, unpaired, energy, occ}
 */
function levels(api, s, spec) {
  const cx = s.ctx, W = s.W, H = s.H, Ls = spec.levels, ncol = spec.columns?.length || Math.max(1, ...Ls.map((L) => (L.col ?? 0) + 1));
  // occupancies
  const occ = Ls.map((L) => (L.occ != null ? spins(L.deg ?? 1, L.occ) : null));
  if (spec.electrons != null) {
    const per = typeof spec.electrons === 'number' ? { all: spec.electrons } : spec.electrons;
    for (const [key, n] of Object.entries(per)) {
      const idx = Ls.map((L, i) => i).filter((i) => occ[i] == null && (key === 'all' || String(Ls[i].col ?? 0) === key));
      aufbau(idx.map((i) => Ls[i]), n).forEach((r, t) => { occ[idx[t]] = r; });
    }
  }
  Ls.forEach((L, i) => { if (!occ[i]) occ[i] = spins(L.deg ?? 1, 0); });
  // geometry
  const left = spec.axis === false ? 16 : 46, right = 16, top = spec.columns ? 34 : 14, bottom = 16;
  const Es = Ls.map((L) => L.E), [e0, e1] = spec.range || [Math.min(...Es), Math.max(...Es)], pad = (e1 - e0 || 1) * 0.1;
  const Y = (E) => top + (H - top - bottom) * (1 - (E - (e0 - pad)) / ((e1 + pad) - (e0 - pad)));
  const colW = (W - left - right) / ncol, CX = (k) => left + colW * (k + 0.5), bw = Math.min(46, colW * 0.34), gapB = 8;
  const geo = Ls.map((L, i) => { const g = L.deg ?? 1, tot = g * bw + (g - 1) * gapB, x0 = CX(L.col ?? 0) - tot / 2 + (L.dx ?? 0); return { x0, x1: x0 + tot, y: Y(L.E), g }; });
  const muted = api.color('muted');
  cx.save();
  if (spec.axis !== false) {
    cx.strokeStyle = muted; cx.fillStyle = muted; cx.lineWidth = 1.4; const ax = left - 22;
    cx.beginPath(); cx.moveTo(ax, H - bottom); cx.lineTo(ax, top + 6); cx.stroke(); cx.beginPath(); cx.moveTo(ax, top); cx.lineTo(ax - 5, top + 9); cx.lineTo(ax + 5, top + 9); cx.closePath(); cx.fill();
    cx.font = 'italic 15px Newsreader, "Times New Roman", serif'; cx.textAlign = 'left'; cx.textBaseline = 'top'; cx.fillText('E', ax + 7, top - 2);
    if (spec.unit) { cx.font = FONT(10.5, 500); cx.fillText(`(${spec.unit})`, ax + 18, top + 1); }
  }
  if (spec.columns) spec.columns.forEach((t, k) => s.texPx(bare(t), CX(k), 14, { align: 'center', color: 'ink', size: 14 }));
  // correlation lines
  for (const [a, b] of spec.links || []) {
    const A = geo[a], B = geo[b]; if (!A || !B) continue; const ab = A.x1 < B.x0, xa = ab ? A.x1 : A.x0, xb = ab ? B.x0 : B.x1;
    cx.setLineDash([4, 4]); cx.strokeStyle = api.color('faint'); cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(xa + (ab ? 3 : -3), A.y); cx.lineTo(xb + (ab ? -3 : 3), B.y); cx.stroke(); cx.setLineDash([]);
  }
  // HOMO / LUMO and the statistics refer to the molecule: spec.mo (column index), else the typed levels, else all
  const inMol = (i) => (spec.mo != null ? (Ls[i].col ?? 0) === spec.mo : Ls.some((L) => L.type) ? !!Ls[i].type : true);
  const filled = Ls.map((L, i) => i).filter((i) => inMol(i) && occ[i].occ > 0), empty = Ls.map((L, i) => i).filter((i) => inMol(i) && occ[i].occ < 2 * (Ls[i].deg ?? 1));
  const homo = filled.length ? filled.reduce((a, b) => (Ls[b].E > Ls[a].E ? b : a)) : null, lumo = empty.length ? empty.reduce((a, b) => (Ls[b].E < Ls[a].E ? b : a)) : null;
  const TYPE = { bonding: 'green', antibonding: 'red', nonbonding: 'ink' };
  Ls.forEach((L, i) => {
    const G = geo[i], col = api.color(L.color || TYPE[L.type] || 'ink');
    for (let j = 0; j < G.g; j++) {
      const xa = G.x0 + j * (bw + gapB), xb = xa + bw; cx.strokeStyle = col; cx.lineWidth = 2.6; cx.lineCap = 'round';
      cx.beginPath(); cx.moveTo(xa, G.y); cx.lineTo(xb, G.y); cx.stroke();
      const o2 = occ[i], arrow = (x, up) => { const y0 = G.y + (up ? 7 : -9), y1 = G.y + (up ? -10 : 8); cx.strokeStyle = cx.fillStyle = api.color(spec.electronColor || 'accent'); cx.lineWidth = 1.8; cx.beginPath(); cx.moveTo(x, y0); cx.lineTo(x, y1 + (up ? 4 : -4)); cx.stroke(); cx.beginPath(); cx.moveTo(x, y1); cx.lineTo(x - 4, y1 + (up ? 6 : -6)); cx.lineTo(x + 4, y1 + (up ? 6 : -6)); cx.closePath(); cx.fill(); };
      if (o2.up[j]) arrow((xa + xb) / 2 - (o2.down[j] ? 5 : 0), true);
      if (o2.down[j]) arrow((xa + xb) / 2 + 5, false);
    }
    const side = L.labelSide || ((L.col ?? 0) === 0 && ncol > 1 ? 'left' : 'right');
    if (L.label) s.texPx(bare(L.label), side === 'left' ? G.x0 - 8 : G.x1 + 8, spec.energies ? G.y - 2 : G.y, { align: side === 'left' ? 'right' : 'left', baseline: spec.energies ? 'bottom' : 'middle', color: L.color || TYPE[L.type] || 'ink', size: 13.5 });
    if (spec.energies) { cx.font = FONT(10, 500); cx.fillStyle = muted; cx.textAlign = side === 'left' ? 'right' : 'left'; cx.textBaseline = 'top'; cx.fillText(L.E.toFixed(1).replace('-', '−'), side === 'left' ? G.x0 - 8 : G.x1 + 8, G.y + 9); }
    if (spec.homo && (i === homo || i === lumo)) { cx.font = FONT(9.5, 600); cx.fillStyle = api.color('gold'); cx.textAlign = 'center'; cx.textBaseline = 'bottom'; cx.fillText(i === homo ? 'HOMO' : 'LUMO', (G.x0 + G.x1) / 2, G.y - 13); }
  });
  cx.restore();
  let b = 0, a = 0, unpaired = 0, energy = 0;
  Ls.forEach((L, i) => { if (!inMol(i)) return; const o2 = occ[i]; if (L.type === 'bonding') b += o2.occ; if (L.type === 'antibonding') a += o2.occ; unpaired += o2.up.filter((u, j) => u && !o2.down[j]).length; energy += o2.occ * L.E; });
  return { homo, lumo, bondOrder: (b - a) / 2, unpaired, energy, occ: occ.map((o2) => o2.occ) };
}

const SLICE = new Map();
/**
 * Signed heat map of a wavefunction slice with dashed nodal lines on a 2D stage (data units = a₀).
 * psi: (x, y) → value on the stage plane, or an orbital ('3d_{z^2}', {n, l, m}). opts {plane: 'xz' | 'xy' | 'yz', offset, Z,
 * mode: 'psi' | 'density', gamma (0.6), contours (true), nodes (true), pos/neg colours, res}. → {max, name, n, l, m, E, radialNodes, angularNodes}
 */
function orbitalSlice(api, s, psi, o = {}) {
  let info = {}, f = psi;
  if (typeof psi !== 'function') {
    const sp = orbitalSpec(psi), Z = o.Z ?? 1, g = hydrogen(sp.n, sp.l, sp.m, Z), off = o.offset ?? 0, pl = o.plane || 'xz';
    f = pl === 'xy' ? (x, y) => g(x, y, off) : pl === 'yz' ? (x, y) => g(off, x, y) : (x, y) => g(x, off, y);
    info = { ...sp, E: energyH(sp.n, Z), radialNodes: sp.n - sp.l - 1, angularNodes: sp.l, plane: pl };
  }
  const mode = o.mode || 'psi', b = s.bounds, key = JSON.stringify([typeof psi === 'function' ? o.key ?? 'fn' : psi, o.plane, o.offset, o.Z, b]);
  let ent = SLICE.get(s); if (!ent || ent.key !== key) { const G = gridOf(f, b, Math.max(60, Math.round(s.W / 3)), Math.max(45, Math.round(s.H / 3))); let mx = 0; for (const v of G.z) if (isFinite(v)) mx = Math.max(mx, Math.abs(v)); ent = { key, G, mx: mx || 1 }; SLICE.set(s, ent); }
  const P = api.rgb('panel'), A = api.rgb(o.pos || 'red'), B = api.rgb(o.neg || 'blue'), gam = o.gamma ?? (mode === 'density' ? 0.5 : 0.6), mx = ent.mx;
  s.raster((x, y) => {
    const v = f(x, y); if (!isFinite(v)) return null;
    const t = mode === 'density' ? Math.pow(v * v / (mx * mx), gam) : Math.pow(Math.abs(v) / mx, gam), C = mode === 'density' ? A : v >= 0 ? A : B, k = 0.88 * Math.min(1, t);
    return [P[0] + (C[0] - P[0]) * k, P[1] + (C[1] - P[1]) * k, P[2] + (C[2] - P[2]) * k];
  }, { res: o.res ?? 2, key: key + mode + gam + P.join() + A.join() + B.join(), id: 'orbital' });
  if (o.contours !== false) for (const frac of [0.08, 0.3, 0.65]) for (const sg of mode === 'density' ? [1] : [1, -1]) {
    const lv = mode === 'density' ? frac * frac * mx * mx : sg * frac * mx, G = mode === 'density' ? null : ent.G;
    const lines = G ? isolines(G, lv) : isolines(gridOf((x, y) => f(x, y) ** 2, b, 90, 70), lv);
    for (const l of lines) s.path(l, { color: mode === 'density' ? (o.pos || 'red') : sg > 0 ? o.pos || 'red' : o.neg || 'blue', width: 1, alpha: 0.65 });
  }
  const nodal = o.nodes === false || mode === 'density' ? [] : isolines(ent.G, 0, { fn: f });
  for (const l of nodal) s.path(l, { color: 'ink', width: 1.4, dash: [5, 4], alpha: 0.8 });
  if (s.o.axes) s.axes();
  return { ...info, max: mx, nodal };
}

// ================================================================== namespace
/** v.mol() → namespace; v.mol('draw3d', …) → call one helper directly. */
export default function mol(api, rt, name, ...args) {
  const ns = {
    draw3d: (s3, m, o) => draw3d(api, s3, m, o),
    levels: (s, spec) => levels(api, s, spec),
    orbitalSlice: (s, psi, o) => orbitalSlice(api, s, psi, o),
    get: getMolecule, library: Object.keys(LIBRARY), formula, formulaTeX, molarMass, distance, angle, autoBond,
    hydrogen, radial, realY, laguerre, legendre, orbitalSpec, energyH, orbitalExtent, aufbau, spins, ELEMENTS,
    color: (e) => atomColor(api, e, tones(api)),
  };
  if (name == null) return ns;
  if (!(name in ns)) throw new Error(`v.mol('${name}'): unknown helper (have ${Object.keys(ns).join(', ')})`);
  return typeof ns[name] === 'function' ? ns[name](...args) : ns[name];
}
