// Solid Mechanics & Structures — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain named exports).
//
// Material data (MPa, mm, kN units used throughout; see the source notes at the head of ch01.js):
//   MATS holds E, ν, strengths and thermal expansion; makeCurve() turns the headline numbers into a full engineering
//   stress–strain curve (elastic, yield, hardening, necking, fracture); stripFE() is a small plane-stress Q4 solver
//   used for Saint-Venant's principle.

export const kN = (x, d = 3) => `${x.toLocaleString('en-US', { maximumSignificantDigits: d })} kN`;
export const sgn = (x) => (x < 0 ? '−' : '');

/** Text width in px. */
export function textW(s, str, size = 12, weight = 500) { const c = s.ctx; c.save(); c.font = `${weight} ${size}px Inter, system-ui, sans-serif`; const w = c.measureText(str).width; c.restore(); return w; }

/** Greedy label placement around points (data coords), clear of points and earlier labels. */
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

/** Hatched wall in data coordinates: a vertical wall at x with hatching on the side `side` (+1 right, −1 left) between y0 and y1. */
export function wallV(v, s, x, y0, y1, side = 1, w = 9) {
  const c = s.ctx, X = s.X(x), A = s.Y(y0), B = s.Y(y1);
  c.save(); c.strokeStyle = v.color('ink'); c.lineWidth = 2; c.beginPath(); c.moveTo(X, A); c.lineTo(X, B); c.stroke();
  c.strokeStyle = v.color('muted', 0.7); c.lineWidth = 1;
  const lo = Math.min(A, B), hi = Math.max(A, B);
  for (let y = lo; y < hi; y += 6) { c.beginPath(); c.moveTo(X, y + 6); c.lineTo(X + side * w, y); c.stroke(); }
  c.restore();
}
/** Hatched ceiling at height y spanning x0..x1. */
export function ceilingH(v, s, y, x0, x1, h = 9) {
  const c = s.ctx, Y = s.Y(y), A = s.X(x0), B = s.X(x1);
  c.save(); c.strokeStyle = v.color('ink'); c.lineWidth = 2; c.beginPath(); c.moveTo(A, Y); c.lineTo(B, Y); c.stroke();
  c.strokeStyle = v.color('muted', 0.7); c.lineWidth = 1;
  for (let x = Math.min(A, B); x < Math.max(A, B); x += 6) { c.beginPath(); c.moveTo(x, Y); c.lineTo(x + 6, Y - h); c.stroke(); }
  c.restore();
}

/** Colour for a stress ratio t = σ/σref ∈ [0, ~1.3]: a cool-to-hot ramp built from theme colours (so it reads in dark mode too). */
export function heatColor(v, t) {
  const a = Math.max(0, Math.min(1.25, t));
  return a < 1 ? v.ramp(a, 'orange', 'accent') : v.ramp(Math.min(1, (a - 1) * 4), 'red', 'orange');
}

// ── materials ───────────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * E, sy, su in MPa; nu Poisson's ratio; alpha thermal expansion (1/K).
 * Curve parameters (eu: strain at maximum load, ef: strain at fracture, eL: Lüders-plateau length, fr: fracture stress / su,
 * Z: reduction of area, k: knee sharpness) are illustrative shapes tuned to the published headline numbers.
 */
export const MATS = {
  steel: { id: 'steel', name: 'structural steel S355', short: 'steel S355', E: 210000, nu: 0.30, sy: 355, su: 490, alpha: 12e-6, rho: 7850, color: 'accent',
    src: 'EN 1993-1-1 §3.2.6 and Table 3.1 (t ≤ 40 mm), EN 10025-2', eu: 0.15, ef: 0.26, eL: 0.018, fr: 0.78, Z: 0.55, k: 40, ductile: true },
  al: { id: 'al', name: 'aluminium 6061-T6', short: 'Al 6061-T6', E: 68900, nu: 0.33, sy: 276, su: 310, alpha: 23.6e-6, rho: 2700, color: 'orange',
    src: 'ASM / MatWeb typical values for 6061-T6 (typical 276/310 MPa yield/ultimate; ASTM B209/B221 specification minimums are lower, about 240 MPa yield and 260–290 MPa ultimate)', eu: 0.085, ef: 0.12, eL: 0, fr: 0.80, Z: 0.45, k: 9, ductile: true },
  cu: { id: 'cu', name: 'copper C11000 (annealed)', short: 'copper', E: 117000, nu: 0.34, sy: 69, su: 220, alpha: 17e-6, rho: 8940, color: 'teal',
    src: 'Copper Development Association; MakeItFrom / MatWeb (annealed OS050)', eu: 0.32, ef: 0.50, eL: 0, fr: 0.62, Z: 0.70, k: 4, ductile: true },
  cast: { id: 'cast', name: 'grey cast iron (ASTM A48 class 30)', short: 'grey cast iron', E: 100000, nu: 0.26, sy: 207, su: 207, alpha: 11e-6, rho: 7100, color: 'purple',
    src: 'ASTM A48 class 30 (207 MPa minimum tensile strength); ASM Handbook range for E and ν', ductile: false, ef: 0.005 },
  conc: { id: 'conc', name: 'concrete C30/37', short: 'concrete C30/37', E: 33000, nu: 0.20, sy: 30, su: 30, alpha: 10e-6, rho: 2400, color: 'gray',
    src: 'EN 1992-1-1 Table 3.1 (Ecm 33 GPa, fck 30 MPa, fctm 2.9 MPa), §3.1.3 (ν = 0.2), §3.1.3(5) (α = 10·10⁻⁶ /K)', fct: 2.9, ductile: false },
  timber: { id: 'timber', name: 'timber C24', short: 'timber C24', E: 11000, nu: 0.37, sy: 14.5, su: 14.5, alpha: 5e-6, rho: 420, color: 'gold',
    src: 'EN 338 Table 1 (E0,mean 11 GPa, f t,0,k 14.5 MPa, f c,0,k 21 MPa, ρmean 420 kg/m³, checked against a transcription of Table 1 of EN 338:2016; ν ≈ 0.37 and α ≈ 5·10⁻⁶ /K are typical softwood values, not EN 338 data)', fc: 21, ductile: false },
};
export const G_of = (m) => m.E / (2 * (1 + m.nu));

/**
 * Engineering stress–strain curve of a ductile metal: soft-min of the elastic line and a hardening law with a Lüders plateau
 * (steel), the maximum at (eu, su), then a post-necking drop to the fracture stress (illustrative shape). The base stress s0 is
 * calibrated by bisection so that the 0.2 % offset line (or the plateau for steel) gives exactly the published yield strength.
 */
export function makeCurve(m) {
  const { E, sy, su, eu, ef, eL, fr, k } = m;
  const sf = fr * su;
  const make = (s0) => {
    const e0 = s0 / E + eL;
    return (e) => {
      if (e <= 0) return 0;
      let s = Math.min(1, Math.max(0, (e - e0) / (eu - e0)));
      const pl = e < e0 ? s0 : s0 + (su - s0) * (1 - (1 - s) ** 2);
      const el = E * e;
      let sg = (el ** -k + pl ** -k) ** (-1 / k);
      if (e > eu) { const w = Math.min(1, (e - eu) / (ef - eu)); sg = su - (su - sf) * w * w; }
      return sg;
    };
  };
  let s0 = sy;
  if (!eL) {
    let lo = sy * 0.8, hi = Math.min(sy * 1.5, su * 0.99);
    for (let it = 0; it < 50; it++) {
      s0 = (lo + hi) / 2; const f = make(s0);
      // offset intersection: smallest e with f(e) <= E (e − 0.002)
      let e = 0.002, step = 1e-4; while (f(e) > E * (e - 0.002) && e < eu) e += step;
      const sOff = f(e); if (sOff < sy) lo = s0; else hi = s0;
    }
  }
  const f = make(s0);
  const c = { sig: f, E, sy, su, eu, ef, sf, s0, Z: m.Z };
  // proportional limit: first strain where the curve falls 0.5 % below the elastic line
  let e = 1e-6; while (e < eu && f(e) > 0.995 * E * e) e *= 1.01; c.ePL = e; c.sPL = f(e);
  // offset yield point (0.2 % proof stress)
  e = 0.002; while (f(e) > E * (e - 0.002) && e < eu) e += 1e-5; c.eOff = e; c.sOff = f(e);
  // area under the curve up to strain e: toughness density in MJ/m³ (= MPa)
  c.work = (x, n = 600) => { let a = 0; for (let i = 0; i < n; i++) { const e1 = (x * i) / n, e2 = (x * (i + 1)) / n; a += 0.5 * (f(e1) + f(e2)) * (e2 - e1); } return a; };
  // the strain beyond eu where the neck forms is localised: neck area ratio (illustrative) for drawing
  c.neck = (x) => (x <= eu ? 0 : m.Z * Math.min(1, (x - eu) / (ef - eu)) ** 0.7);
  return c;
}
const CURVES = {};
export const curveOf = (id) => (CURVES[id] ||= makeCurve(MATS[id]));

/** Natural rubber, neo-Hookean engineering stress (MPa) at engineering strain e; G ≈ 0.4 MPa is a typical illustrative value. */
export const RUBBER = { G: 0.4, nu: 0.5, lamFail: 7 };
export const rubberSig = (e) => { const l = 1 + e; return RUBBER.G * (l - 1 / (l * l)); };

// ── plane-stress strip, bilinear quadrilaterals, banded Cholesky (Saint-Venant) ─────────────────────────────────────
/**
 * Strip of width W = 1 (y ∈ [−½, ½]) and length L (x ∈ [0, L]); E = 1, plane stress. The far end x = L is held against axial
 * motion; the end x = 0 carries a total pull of 1 per unit thickness applied as `kind`: 'point' (centre), 'two' (at y = ±¼),
 * 'edge' (at y = −½) or 'uniform'. Returns nodal σxx, σyy, τxy averaged from the adjacent elements (average stress = 1).
 */
export function stripFE(kind, { nx = 72, ny = 16, L = 4.5, nu = 0.3 } = {}) {
  const W = 1, dx = L / nx, dy = W / ny, nn = (nx + 1) * (ny + 1), nd = 2 * nn, id = (i, j) => i * (ny + 1) + j;
  const c0 = 1 / (1 - nu * nu), D = [[c0, c0 * nu, 0], [c0 * nu, c0, 0], [0, 0, (c0 * (1 - nu)) / 2]];
  const gp = [-1 / Math.sqrt(3), 1 / Math.sqrt(3)];
  const Bat = (xi, et) => {
    const dNx = [-(1 - et) / 4, (1 - et) / 4, (1 + et) / 4, -(1 + et) / 4].map((q) => q * 2 / dx);
    const dNy = [-(1 - xi) / 4, -(1 + xi) / 4, (1 + xi) / 4, (1 - xi) / 4].map((q) => q * 2 / dy);
    const B = [new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0)];
    for (let a = 0; a < 4; a++) { B[0][2 * a] = dNx[a]; B[1][2 * a + 1] = dNy[a]; B[2][2 * a] = dNy[a]; B[2][2 * a + 1] = dNx[a]; }
    return B;
  };
  const Ke = Array.from({ length: 8 }, () => new Array(8).fill(0)), detJ = (dx * dy) / 4;
  for (const xi of gp) for (const et of gp) {
    const B = Bat(xi, et), DB = D.map((row) => B[0].map((_, q) => row[0] * B[0][q] + row[1] * B[1][q] + row[2] * B[2][q]));
    for (let p = 0; p < 8; p++) for (let q = 0; q < 8; q++) Ke[p][q] += (B[0][p] * DB[0][q] + B[1][p] * DB[1][q] + B[2][p] * DB[2][q]) * detJ;
  }
  // banded storage: K[r][r + b] for b = 0..hb (node numbering runs along x so the band is about 2(ny+1)+3)
  const hb = 2 * (ny + 1) + 3, K = Array.from({ length: nd }, () => new Float64Array(hb + 1)), F = new Float64Array(nd);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const nodes = [id(i, j), id(i + 1, j), id(i + 1, j + 1), id(i, j + 1)], dofs = nodes.flatMap((n) => [2 * n, 2 * n + 1]);
    for (let p = 0; p < 8; p++) for (let q = 0; q < 8; q++) { const r = dofs[p], cc = dofs[q]; if (cc >= r) K[r][cc - r] += Ke[p][q]; }
  }
  // loads on the end x = 0 (force in −x direction: the bar is pulled)
  const addF = (j, f) => { F[2 * id(0, j)] -= f; };
  if (kind === 'uniform') { for (let j = 0; j <= ny; j++) addF(j, (j === 0 || j === ny ? 0.5 : 1) / ny); }
  else if (kind === 'point') addF(ny / 2, 1);
  else if (kind === 'two') { addF(ny / 4, 0.5); addF((3 * ny) / 4, 0.5); }
  else if (kind === 'edge') addF(0, 1);
  // supports (penalty): ux = 0 on the far end, uy = 0 at its middle node
  let kmax = 0; for (let r = 0; r < nd; r++) kmax = Math.max(kmax, K[r][0]);
  const pen = kmax * 1e8;
  for (let j = 0; j <= ny; j++) K[2 * id(nx, j)][0] += pen;
  K[2 * id(nx, ny / 2) + 1][0] += pen;
  // banded Cholesky K = L Lᵀ (in place, upper storage)
  for (let r = 0; r < nd; r++) {
    for (let cc = r; cc <= Math.min(nd - 1, r + hb); cc++) {
      let s = K[r][cc - r];
      for (let q = Math.max(0, cc - hb); q < r; q++) s -= K[q][r - q] * K[q][cc - q];
      if (cc === r) K[r][0] = Math.sqrt(s); else K[r][cc - r] = s / K[r][0];
    }
  }
  const y = new Float64Array(nd);
  for (let r = 0; r < nd; r++) { let s = F[r]; for (let q = Math.max(0, r - hb); q < r; q++) s -= K[q][r - q] * y[q]; y[r] = s / K[r][0]; }
  const u = new Float64Array(nd);
  for (let r = nd - 1; r >= 0; r--) { let s = y[r]; for (let q = r + 1; q <= Math.min(nd - 1, r + hb); q++) s -= K[r][q - r] * u[q]; u[r] = s / K[r][0]; }
  // element-centre stresses averaged to nodes
  const sx = new Float64Array(nn), sy = new Float64Array(nn), tx = new Float64Array(nn), cnt = new Float64Array(nn);
  const Bc = Bat(0, 0);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const nodes = [id(i, j), id(i + 1, j), id(i + 1, j + 1), id(i, j + 1)], dofs = nodes.flatMap((n) => [2 * n, 2 * n + 1]);
    const eps = Bc.map((row) => row.reduce((acc, b, q) => acc + b * u[dofs[q]], 0));
    const s1 = D[0][0] * eps[0] + D[0][1] * eps[1], s2 = D[1][0] * eps[0] + D[1][1] * eps[1], s3 = D[2][2] * eps[2];
    for (const n of nodes) { sx[n] += s1; sy[n] += s2; tx[n] += s3; cnt[n]++; }
  }
  for (let n = 0; n < nn; n++) { sx[n] /= cnt[n]; sy[n] /= cnt[n]; tx[n] /= cnt[n]; }
  const at = (arr, x, yy) => {
    const fi = Math.min(nx - 1e-9, Math.max(0, x / dx)), fj = Math.min(ny - 1e-9, Math.max(0, (yy + 0.5) / dy)), i = Math.floor(fi), j = Math.floor(fj), a = fi - i, b = fj - j;
    return arr[id(i, j)] * (1 - a) * (1 - b) + arr[id(i + 1, j)] * a * (1 - b) + arr[id(i + 1, j + 1)] * a * b + arr[id(i, j + 1)] * (1 - a) * b;
  };
  return { L, W, sxx: (x, yy) => at(sx, x, yy), syy: (x, yy) => at(sy, x, yy), txy: (x, yy) => at(tx, x, yy), nx, ny };
}
