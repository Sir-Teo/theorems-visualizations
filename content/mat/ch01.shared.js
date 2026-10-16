// Materials Science — Chapter 1: helpers and data shared by the items of ch01.js (plain named exports).
//
// DATA SOURCES (all checked on the web, October 2026; see each item's `refs`/caption for the short form):
//  - Cohesive energies E_coh (eV/atom, experimental, zero-point corrected): J. Park, B. D. Yu, S. Hong,
//    "Van der Waals density-functional theory study for bulk solids with BCC, FCC, and diamond structures" (arXiv:1504.01219, Table 3,
//    "Expt." column, collected from Kittel-type compilations). Ti, Co, Zn: S. Jana, K. Sharma, P. Samal, arXiv:1807.00350 (Table III, Expt.).
//    Ionic and covalent compounds: Y. Mo, G. Tian, J. Tao, arXiv:1610.00775 (Table IV, Expt.: NaCl 3.31, NaF 3.93, LiF 4.40 eV/atom).
//    Noble-gas solids: Ar 0.080 and Kr 0.116 eV (UZH solid-state lecture slides), Ne 0.02 eV (UCL lecture notes); Xe 0.17 eV (about 16 kJ/mol = 0.166 eV, Kittel's table) is
//    not re-verified online; treat it as approximate.
//  - Melting points, Young's moduli, thermal-expansion coefficients (20 °C), electronegativities: Wikipedia element infoboxes
//    (WEL/CRC/Arblaster values), densities: Wikipedia "Densities of the elements (data page)". Young's moduli of non-elements: Wikipedia
//    "Young's modulus" table; engineering ceramics: Japan Fine Ceramics Center property table (alumina 380, Si3N4 300, SiC 430, PSZ 210 GPa).
//  - Standard atomic weights (IUPAC abridged values, rounded to 4-5 significant figures) agree with the IUPAC abridged table as commonly tabulated (compared by hand, Oct 2026).

export const KB = 8.617333262e-5; // Boltzmann constant, eV/K
export const NA = 6.02214076e23;
export const EV_NN = 1.602176634; // 1 eV/Å = 1.602 nN
export const EV_A3_GPA = 160.21766; // 1 eV/Å³ = 160.2 GPa

/** Text width in px. */
export function textW(s, str, size = 12, weight = 500) { const c = s.ctx; c.save(); c.font = `${weight} ${size}px Inter, system-ui, sans-serif`; const w = c.measureText(str).width; c.restore(); return w; }

/**
 * Greedy label placement around points (data coords): tries right, left, diagonals, above, below, then further out with a leader line;
 * stays inside the data area and clear of points and earlier labels.
 */
export function placeLabels(v, s, items, o = {}) {
  const b = s.bounds, X0 = s.X(b.x[0]), X1 = s.X(b.x[1]), Y0 = s.Y(b.y[0]), Y1 = s.Y(b.y[1]);
  const xl = Math.min(X0, X1), xr = Math.max(X0, X1), yt = Math.min(Y0, Y1), yb = Math.max(Y0, Y1);
  const pts = items.map((it) => [s.X(it.x), s.Y(it.y), (it.r ?? 5) + 1.5]).concat(o.points || []);
  const boxes = [...(o.avoid || [])];
  const hit = (bx) => boxes.some((q) => bx[0] < q[2] && bx[2] > q[0] && bx[1] < q[3] && bx[3] > q[1])
    || pts.some(([cx, cy, r]) => { const nx = Math.max(bx[0], Math.min(cx, bx[2])), ny = Math.max(bx[1], Math.min(cy, bx[3])); return Math.hypot(nx - cx, ny - cy) < r; });
  const C = [[1, 0], [-1, 0], [1, -1], [-1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [1, -2], [-1, -2], [1, 2], [-1, 2], [0, -2], [0, 2], [2, -2], [-2, -2], [2, 2], [-2, 2]];
  items.forEach((it, i) => {
    const size = it.size ?? 11, wt = it.weight ?? 500, w = textW(s, it.text, size, wt), h = size + 4, [px, py] = pts[i];
    let pick = null, first = null;
    for (const [cx, cy] of it.prefer ? [it.prefer, ...C] : C) {
      const far = Math.abs(cx) > 1 || Math.abs(cy) > 1, gx = far ? 22 : (it.r ?? 5) + 4, gy = (Math.abs(cy) > 1 ? 1.5 * Math.abs(cy) - 1 : 0.85) * h;
      const x0 = cx > 0 ? px + gx : cx < 0 ? px - gx - w : px - w / 2, yc = py + Math.sign(cy) * gy;
      const bx = [x0 - 2, yc - h / 2, x0 + w + 2, yc + h / 2];
      if (bx[0] < xl + 2 || bx[2] > xr - 2 || bx[1] < yt + 1 || bx[3] > yb - 1) continue;
      first ||= { bx, x0, yc, far };
      if (!hit(bx)) { pick = { bx, x0, yc, far }; break; }
    }
    pick ||= first; if (!pick) return;
    boxes.push(pick.bx);
    if (pick.far) { const nx = Math.max(pick.bx[0], Math.min(px, pick.bx[2])), ny = Math.max(pick.bx[1], Math.min(py, pick.bx[3])); const c = s.ctx; c.save(); c.strokeStyle = v.color(it.color || 'muted', 0.55); c.lineWidth = 1; c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke(); c.restore(); }
    s.textPx(it.text, pick.x0, pick.yc, { size, weight: wt, color: it.color || 'ink', align: 'left' });
  });
}

// ── element data ─────────────────────────────────────────────────────────────────────────────────────────────────────
// sym, name, bonding class, structure, E_coh (eV/atom), T_m (K), E (GPa, polycrystal), density (g/cm³), α (10⁻⁶/K at 20 °C or null), M (g/mol), χ (Pauling)
const E = (sym, name, cls, st, ecoh, tm, mod, rho, alpha, M, chi) => ({ sym, name, cls, st, ecoh, tm, E: mod, rho, alpha, M, chi });
export const ELEMENTS = [
  E('Li', 'lithium', 'metal', 'bcc', 1.663, 453.65, 4.9, 0.534, 46.56, 6.94, 0.98),
  E('Na', 'sodium', 'metal', 'bcc', 1.128, 370.944, 10, 0.968, 69.91, 22.99, 0.93),
  E('K', 'potassium', 'metal', 'bcc', 0.943, 336.7, 3.53, 0.89, 77.37, 39.10, 0.82),
  E('Ca', 'calcium', 'metal', 'fcc', 1.862, 1115, 20, 1.55, 22.27, 40.08, 1.00),
  E('Ba', 'barium', 'metal', 'bcc', 1.911, 1000, 13, 3.51, 20.47, 137.33, 0.89),
  E('Al', 'aluminium', 'metal', 'fcc', 3.431, 933.47, 70, 2.70, 22.87, 26.98, 1.61),
  E('Pb', 'lead', 'metal', 'fcc', 2.040, 600.61, 16, 11.34, 28.73, 207.2, 1.87),
  E('Sn', 'tin', 'metal', 'bct', 3.159, 505.08, 50, 7.265, 21.76, 118.71, 1.96),
  E('Zn', 'zinc', 'metal', 'hcp', 1.38, 692.68, 108, 7.14, 30.08, 65.38, 1.65),
  E('Cu', 'copper', 'metal', 'fcc', 3.523, 1357.77, 120, 8.96, 16.64, 63.55, 1.90),
  E('Ag', 'silver', 'metal', 'fcc', 2.972, 1234.93, 83, 10.49, 18.92, 107.87, 1.93),
  E('Au', 'gold', 'metal', 'fcc', 3.826, 1337.33, 79, 19.3, 14.13, 196.97, 2.54),
  E('Ni', 'nickel', 'metal', 'fcc', 4.484, 1728, 200, 8.908, 12.83, 58.69, 1.91),
  E('Pd', 'palladium', 'metal', 'fcc', 3.917, 1828.05, 121, 12.023, 11.77, 106.42, 2.20),
  E('Pt', 'platinum', 'metal', 'fcc', 5.863, 2041.4, 168, 21.45, 8.93, 195.08, 2.28),
  E('Fe', 'iron', 'metal', 'bcc', 4.326, 1811, 211, 7.86, 12.07, 55.85, 1.83),
  E('Co', 'cobalt', 'metal', 'hcp', 4.47, 1768, 209, 8.90, 12.9, 58.93, 1.88),
  E('Ti', 'titanium', 'metal', 'hcp', 4.88, 1941, 120, 4.506, 9.68, 47.87, 1.54),
  E('V', 'vanadium', 'metal', 'bcc', 5.347, 2183, 128, 6.11, 8.77, 50.94, 1.63),
  E('Cr', 'chromium', 'metal', 'bcc', 4.161, 2180, 279, 7.15, 4.81, 52.00, 1.66),
  E('Nb', 'niobium', 'metal', 'bcc', 7.597, 2750, 105, 8.57, 7.07, 92.91, 1.6),
  E('Mo', 'molybdenum', 'metal', 'bcc', 6.864, 2896, 329, 10.28, 5.10, 95.95, 2.16),
  E('Rh', 'rhodium', 'metal', 'fcc', 5.797, 2237, 380, 12.41, 8.46, 102.91, 2.28),
  E('Ir', 'iridium', 'metal', 'fcc', 6.981, 2719, 528, 22.56, 6.47, 192.22, 2.20),
  E('Ta', 'tantalum', 'metal', 'bcc', 8.123, 3290, 186, 16.69, null, 180.95, 1.5),
  E('W', 'tungsten', 'metal', 'bcc', 8.939, 3695, 411, 19.25, 4.42, 183.84, 2.36),
  E('Si', 'silicon', 'covalent', 'diamond', 4.693, 1687, 150, 2.33, 2.556, 28.09, 1.90),
  E('Ge', 'germanium', 'covalent', 'diamond', 3.881, 1211.4, 103, 5.323, 5.79, 72.63, 2.01),
  E('C', 'diamond', 'covalent', 'diamond', 7.586, null, 1100, 3.51, null, 12.011, 2.55),
];
export const EL = Object.fromEntries(ELEMENTS.map((e) => [e.sym, e]));
/** Compounds and van der Waals solids used on the melting-point chart (E_coh per atom). */
export const OTHERS = [
  { sym: 'NaCl', name: 'sodium chloride', cls: 'ionic', st: 'rock salt', ecoh: 3.31, tm: 1073.85 },
  { sym: 'NaF', name: 'sodium fluoride', cls: 'ionic', st: 'rock salt', ecoh: 3.93, tm: 1266.15 },
  { sym: 'LiF', name: 'lithium fluoride', cls: 'ionic', st: 'rock salt', ecoh: 4.40, tm: 1118.15 },
  { sym: 'Ne', name: 'neon', cls: 'vdw', st: 'fcc', ecoh: 0.02, tm: 24.56 },
  { sym: 'Ar', name: 'argon', cls: 'vdw', st: 'fcc', ecoh: 0.080, tm: 83.81 },
  { sym: 'Kr', name: 'krypton', cls: 'vdw', st: 'fcc', ecoh: 0.116, tm: 115.78 },
  { sym: 'Xe', name: 'xenon', cls: 'vdw', st: 'fcc', ecoh: 0.17, tm: 161.40 },
];
/** All solids with both E_coh and T_m. */
export const MELT = [...ELEMENTS.filter((e) => e.tm), ...OTHERS];

export const CLASSES = {
  vdw: { name: 'van der Waals', color: 'teal' },
  ionic: { name: 'ionic', color: 'red' },
  covalent: { name: 'covalent', color: 'purple' },
  metal: { name: 'metallic', color: 'blue' },
};

/** Nearest-neighbour distance (Å) from density and atomic weight, for a given structure; also coordination number. */
export function bondGeometry(e) {
  const om = e.M / (e.rho * NA) * 1e24; // atomic volume Å³
  const st = e.st;
  if (st === 'fcc' || st === 'hcp') return { omega: om, r0: Math.cbrt(4 * om) / Math.SQRT2, z: 12 };
  if (st === 'bcc') return { omega: om, r0: Math.cbrt(2 * om) * Math.sqrt(3) / 2, z: 8 };
  return { omega: om, r0: Math.cbrt(8 * om) * Math.sqrt(3) / 4, z: 4 };
}

// ── pair potentials in reduced form: U(x)/ε, x = r/r₀ (minimum −1 at x = 1) ───────────────────────────────────────────────
export const POT = {
  lj: (x) => x ** -12 - 2 * x ** -6,
  morse: (x, b = 4) => (1 - Math.exp(-b * (x - 1))) ** 2 - 1,
  ionic: (x, lam = 8.9) => (-lam / x + Math.exp(-lam * (x - 1))) / (lam - 1),
  rose: (x, l = 0.28) => { const a = (x - 1) / l; return -(1 + a) * Math.exp(-a); },
};
/** Shape used for each bonding class in item 1.1 (illustrative widths; the depth comes from data). */
export const CLASS_POT = {
  vdw: { f: POT.lj, label: 'Lennard-Jones 12–6' },
  ionic: { f: (x) => POT.ionic(x, 8.9), label: 'Coulomb + Born–Mayer repulsion' },
  covalent: { f: (x) => POT.morse(x, 6), label: 'Morse, stiff and narrow' },
  metal: { f: (x) => POT.rose(x, 0.28), label: 'Rose (universal binding-energy) curve' },
};

/** Numerical derivative helpers. */
export const d1 = (f, x, h = 1e-4) => (f(x + h) - f(x - h)) / (2 * h);
export const d2 = (f, x, h = 1e-3) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);

/** Least-squares line through (log10 x, log10 y). */
export function logFit(xs, ys) {
  const n = xs.length, lx = xs.map(Math.log10), ly = ys.map(Math.log10);
  const mx = lx.reduce((a, b) => a + b, 0) / n, my = ly.reduce((a, b) => a + b, 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxx += (lx[i] - mx) ** 2; sxy += (lx[i] - mx) * (ly[i] - my); syy += (ly[i] - my) ** 2; }
  const slope = sxy / sxx; return { slope, icpt: my - slope * mx, r: sxy / Math.sqrt(sxx * syy), at: (x) => 10 ** (my + slope * (Math.log10(x) - mx)) };
}

// ── cubic elasticity ───────────────────────────────────────────────────────────────────────────────────────────────────
/** Compliances from stiffnesses (GPa⁻¹). */
export function cubicS(c11, c12, c44) { const d = (c11 - c12) * (c11 + 2 * c12); return { s11: (c11 + c12) / d, s12: -c12 / d, s44: 1 / c44 }; }
/** Young's modulus along a unit direction n in a cubic crystal. */
export function youngDir(S, n) {
  const g = n[0] ** 2 * n[1] ** 2 + n[1] ** 2 * n[2] ** 2 + n[2] ** 2 * n[0] ** 2;
  return 1 / (S.s11 - 2 * (S.s11 - S.s12 - S.s44 / 2) * g);
}
/** Voigt, Reuss and Hill polycrystal averages of a cubic crystal: Young's modulus (GPa). */
export function polyAverage(c11, c12, c44) {
  const B = (c11 + 2 * c12) / 3, Gv = (c11 - c12 + 3 * c44) / 5, Gr = (5 * (c11 - c12) * c44) / (4 * c44 + 3 * (c11 - c12)), Gh = (Gv + Gr) / 2;
  const Ey = (G) => (9 * B * G) / (3 * B + G);
  return { B, Voigt: Ey(Gv), Reuss: Ey(Gr), Hill: Ey(Gh) };
}
/** Single-crystal stiffnesses (GPa): Cu, Al, Fe, Ni from Mechanics & Industry 2023 (Table 3, "eleven cubic materials"); W from ultrasonic
 * interferometry (J. Appl. Phys. 2025); Nb from the Cu–Nb wire paper (arXiv:1612.06301, Table 3); Si after McSkimin (quoted from memory). */
export const CRYSTALS = [
  { sym: 'Cu', name: 'copper', c: [169, 122, 75.3], Epoly: 120, note: 'fcc' },
  { sym: 'Al', name: 'aluminium', c: [108, 62, 28.3], Epoly: 70, note: 'fcc' },
  { sym: 'Ni', name: 'nickel', c: [247, 153, 122], Epoly: 200, note: 'fcc' },
  { sym: 'Fe', name: 'iron', c: [230, 135, 117], Epoly: 211, note: 'bcc' },
  { sym: 'W', name: 'tungsten', c: [523.5, 205.1, 160.8], Epoly: 411, note: 'bcc' },
  { sym: 'Nb', name: 'niobium', c: [245.6, 138.7, 29.3], Epoly: 105, note: 'bcc' },
];

// ── lattice planes ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** Lattice points of a cubic structure in units of a/2: 'sc' all (even), 'bcc', 'fcc'. We use integer coords in units of a/2. */
export function inLattice(kind, x, y, z) {
  if (kind === 'fcc') return (x + y + z) % 2 === 0;
  if (kind === 'bcc') return ((x % 2) + 2) % 2 === ((y % 2) + 2) % 2 && ((y % 2) + 2) % 2 === ((z % 2) + 2) % 2;
  return x % 2 === 0 && y % 2 === 0 && z % 2 === 0; // sc
}
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
/**
 * In-plane 2D lattice of the plane h x + k y + l z = 0 (through the origin) for a cubic structure: two shortest independent
 * lattice vectors (units of a, 3D) and the atomic number per unit area (atoms / a²).
 */
export function planeNet(kind, h, k, l) {
  const R = 8, vecs = [];
  for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) for (let z = -R; z <= R; z++) {
    if ((x || y || z) && h * x + k * y + l * z === 0 && inLattice(kind, x, y, z)) vecs.push([x / 2, y / 2, z / 2]);
  }
  if (!vecs.length) return null;
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  vecs.sort((a, b) => len(a) - len(b));
  const v1 = vecs[0];
  let v2 = null, area = Infinity;
  for (const w of vecs) {
    const c = [v1[1] * w[2] - v1[2] * w[1], v1[2] * w[0] - v1[0] * w[2], v1[0] * w[1] - v1[1] * w[0]];
    const A = len(c);
    if (A > 1e-9 && A < area - 1e-9) { area = A; v2 = w; }
  }
  if (!v2) return null;
  return { v1, v2, area, density: 1 / area };
}
/** Linear density along [uvw] in units 1/a. */
export function dirNet(kind, u, v, w) {
  const g = gcd(gcd(Math.abs(u), Math.abs(v)), Math.abs(w)) || 1;
  const d = [u / g, v / g, w / g];
  // shortest lattice vector along d: integer multiples m*d (in units of a/2 coordinates are m*d*2/2): find the smallest m with m*d (a/2 units *... )
  for (let m = 1; m <= 4; m++) {
    const x = d[0] * m, y = d[1] * m, z = d[2] * m; // in units of a/2 would be 2*m*d/... we test integer coords in a/2 units: coordinates are (d*m) in units a/2 -> length m*|d|*a/2
    if (inLattice(kind, x, y, z)) return { len: (m * Math.hypot(...d)) / 2, density: 2 / (m * Math.hypot(...d)) };
  }
  return null;
}
