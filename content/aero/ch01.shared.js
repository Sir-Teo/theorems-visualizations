// Aerospace Engineering — Chapter 1: helpers shared by ch01.js (plain named exports; copied, not imported, from other collections).
//
// Sources (checked online, 2026-10):
//  - International Standard Atmosphere = U.S. Standard Atmosphere 1976 (NOAA/NASA/USAF, NOAA-S/T 76-1562), layer table as
//    reproduced at https://en.wikipedia.org/wiki/International_Standard_Atmosphere : geopotential base heights 0, 11, 20, 32,
//    47, 51, 71 km; lapse rates -6.5, 0, +1.0, +2.8, 0, -2.8, -2.0 K/km; base temperatures 288.15, 216.65, 216.65, 228.65,
//    270.65, 270.65, 214.65 K; base pressures 101325, 22632.1, 5474.89, 868.019, 110.906, 66.9389, 3.95642 Pa;
//    sea-level density 1.225 kg/m3; the table's published densities (0.3639 at 11 km, 0.0880 at 20 km) are used as a check.
//    g0 = 9.80665 m/s2, R* = 8.31432 J/(mol K), M0 = 28.9644 g/mol, geopotential radius 6356.766 km, gamma = 1.4,
//    Sutherland viscosity mu = 1.458e-6 T^1.5/(T + 110.4) (the 1976 atmosphere's constants; quoted from memory).
//  - NACA 0012 section data: C. C. Critzos, H. H. Heyson, R. W. Boswinkle Jr., "Aerodynamic characteristics of NACA 0012
//    airfoil section at angles of attack from 0 deg to 180 deg", NACA TN 3361 (Jan 1955), Langley low-turbulence pressure
//    tunnel, chord 6 in, R = 1.8e6 and 0.5e6, M <= 0.15, smooth surface. The report states c_l,max = 1.33 near 14 deg (R = 1.8e6),
//    minimum c_d about 0.007, c_d = 2.08 at 90 deg. The table below (CRITZOS_18, CRITZOS_05) was read off its Figure 3(b)
//    by eye: expect +-0.03 in c_l and +-0.02 in c_d.
//  - Aircraft numbers: Cessna 172S: wing area 174 ft2 = 16.2 m2, span 36 ft 1 in, max takeoff weight 2,550 lb, 124 kt at 75 %
//    power (AOPA fact sheet / Plane & Pilot; altitude about 8,000 ft); Airbus A320: wing area about 122.6 m2 (Airbus; from
//    memory), cruise Mach 0.78 at FL350 (typical, SKYbrary lists 0.78-0.79), MTOW 73.5-78 t; Lockheed SR-71A: length 107 ft 5 in
//    (32.74 m), span 55 ft 7 in (16.94 m), wing area about 1,800 ft2 (170 m2), design cruise Mach 3.2 above 85,000 ft (Wikipedia).

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const DEG = Math.PI / 180;
export const FT = 0.3048, KT = 0.514444;

// ── Standard atmosphere ────────────────────────────────────────────────────────────────────────────────────────────
export const G0 = 9.80665, GAMMA = 1.4, R_STD = 8.31432 / 0.0289644, R_EARTH_STD = 6356.766e3;
export const P0 = 101325, T0 = 288.15, RHO0 = 1.225, A0 = Math.sqrt(GAMMA * R_STD * T0);
export const LAYERS = [ // [H_base (m), T_base (K), lapse (K/m), p_base (Pa) published, name]
  [0, 288.15, -0.0065, 101325, 'troposphere'],
  [11000, 216.65, 0, 22632.1, 'tropopause'],
  [20000, 216.65, 0.001, 5474.89, 'stratosphere'],
  [32000, 228.65, 0.0028, 868.019, 'stratosphere'],
  [47000, 270.65, 0, 110.906, 'stratopause'],
  [51000, 270.65, -0.0028, 66.9389, 'mesosphere'],
  [71000, 214.65, -0.002, 3.95642, 'mesosphere'],
];
export const H_TOP = 84852; // geopotential metres (86 km geometric)
export const geopot = (z) => R_EARTH_STD * z / (R_EARTH_STD + z);
export const geom = (H) => R_EARTH_STD * H / (R_EARTH_STD - H);
export function layerOf(H) { let k = 0; for (let i = 0; i < LAYERS.length; i++) if (H >= LAYERS[i][0]) k = i; return k; }
export function tempH(H) { const [h0, T, L] = LAYERS[layerOf(H)]; return T + L * (H - h0); }
/** Closed-form pressure (the textbook formulae, layer by layer, chained from sea level, not from the published base values). */
export function pressH(H) {
  let p = P0;
  for (let i = 0; i < LAYERS.length; i++) {
    const [h0, T, L] = LAYERS[i], h1 = i + 1 < LAYERS.length ? LAYERS[i + 1][0] : H_TOP, hh = Math.min(H, h1);
    if (hh <= h0) break;
    p *= L === 0 ? Math.exp(-G0 * (hh - h0) / (R_STD * T)) : (1 + L * (hh - h0) / T) ** (-G0 / (R_STD * L));
    if (H <= h1) break;
  }
  return p;
}
/** Pressure by NUMERICAL integration of the hydrostatic equation d ln p / dH = -g0/(R T(H)) (composite Simpson). */
export function pressNum(H, Tfun = tempH, step = 100) {
  const n = Math.max(2, 2 * Math.ceil(H / step / 2)), h = H / n;
  let s = 1 / Tfun(0) + 1 / Tfun(H);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) / Tfun(i * h);
  return P0 * Math.exp(-G0 / R_STD * s * h / 3);
}
export const sutherland = (T) => 1.458e-6 * T ** 1.5 / (T + 110.4);
/** Everything at geometric altitude z (m): T, p, rho, a, mu, nu, sigma = rho/rho0. */
export function atmo(z) {
  const H = geopot(clamp(z, 0, geom(H_TOP))), T = tempH(H), p = pressH(H), rho = p / (R_STD * T);
  const mu = sutherland(T);
  return { z, H, T, p, rho, a: Math.sqrt(GAMMA * R_STD * T), mu, nu: mu / rho, sigma: rho / RHO0, layer: LAYERS[layerOf(H)][4] };
}
/** Gas state from stagnation-free static T, p (any gas modelled as air). */
export function gasState(T, p) { const rho = p / (R_STD * T), mu = sutherland(T); return { T, p, rho, a: Math.sqrt(GAMMA * R_STD * T), mu }; }

// ── Pitot-static relations ─────────────────────────────────────────────────────────────────────────────────────────
/** Impact pressure q_c = p_t - p for flight Mach M (subsonic isentropic stagnation; Rayleigh pitot formula above M = 1). */
export function impactPressure(M, p) {
  if (M <= 1) return p * ((1 + 0.2 * M * M) ** 3.5 - 1);
  return p * ((166.921 * M ** 7) / (7 * M * M - 1) ** 2.5 - 1);
}
/** Calibrated airspeed: the speed that gives the same q_c at standard sea level (subsonic formula, inverted exactly). */
export function casFromQc(qc) {
  if (qc <= 0) return 0;
  const sub = A0 * Math.sqrt(5 * ((qc / P0 + 1) ** (2 / 7) - 1));
  if (sub <= A0) return sub;
  // supersonic: invert q_c/p0 = 166.921 M^7 / (7M^2-1)^2.5 - 1 by bisection
  let lo = 1, hi = 6;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (impactPressure(m, P0) < qc) lo = m; else hi = m; }
  return A0 * (lo + hi) / 2;
}

// ── Aircraft (cited cruise values; see header) ────────────────────────────────────────────────────────────────────
export const AIRCRAFT = [
  { id: 'c172', name: 'Cessna 172S', S: 16.2, chord: 1.47, span: 11.0, alt: 2590, tas: 124 * KT, note: '124 kt at about 8,500 ft (75 % power)' },
  { id: 'a320', name: 'Airbus A320', S: 122.6, chord: 4.29, span: 35.8, alt: 35000 * FT, tas: null, mach: 0.78, note: 'M 0.78 at FL350' },
  { id: 'sr71', name: 'Lockheed SR-71A', S: 170, chord: 9.5, span: 16.94, alt: 85000 * FT, tas: null, mach: 3.2, note: 'M 3.2 at 85,000 ft' },
];
// mean aerodynamic chord: C172 1.47 m (Cessna data, from memory); A320 about S/b with b = 35.8 m gives 3.4 m, MAC about 4.3 m (approx.);
// SR-71 delta: about 2/3 of the 32.7 m root chord is not used; 9.5 m is an illustrative mean chord of the main delta wing.

// ── NACA 0012 section data (read off Critzos et al. 1955, Fig. 3(b), smooth model) ────────────────────────────────────
// [alpha deg, c_l, c_d, c_m,c/4]   R = 1.8e6, increasing angle of attack
export const CRITZOS_18 = [
  [0, 0, 0.0075, 0], [2.5, 0.23, 0.0075, 0.0], [6, 0.64, 0.008, 0.0], [10.5, 1.03, 0.010, 0.0], [12.5, 1.27, 0.014, 0.0],
  [14.2, 1.33, 0.03, 0.0], [14.7, 1.0, 0.09, -0.07], [16.5, 0.91, 0.125, -0.075], [18.5, 0.83, 0.165, -0.085], [20.5, 0.69, 0.23, -0.095],
  [22.5, 0.70, 0.27, -0.105], [24, 0.74, 0.33, -0.115], [26, 0.85, 0.46, -0.135], [28, 0.91, 0.53, -0.155], [32, 0.99, 0.67, -0.19],
];
// R = 0.5e6
export const CRITZOS_05 = [
  [0, 0, 0.0075, 0], [2.5, 0.21, 0.0075, 0.0], [6, 0.69, 0.008, 0.0], [10.5, 0.95, 0.012, 0.0], [12.5, 1.0, 0.04, 0.0],
  [14.5, 0.66, 0.155, -0.075], [16.5, 0.62, 0.20, -0.08], [20.5, 0.65, 0.23, -0.095], [22.5, 0.68, 0.27, -0.105],
  [26, 0.84, 0.38, -0.135], [28, 0.90, 0.48, -0.155], [32, 0.98, 0.67, -0.185],
];
export function tab(T, a, col) {
  const s = Math.sign(a) || 1, x = Math.abs(a);
  if (x >= T[T.length - 1][0]) return (col === 1 ? s : 1) * T[T.length - 1][col];
  let i = 0; while (T[i + 1][0] < x) i++;
  const [x0, x1] = [T[i][0], T[i + 1][0]], t = (x - x0) / (x1 - x0);
  const y = T[i][col] + (T[i + 1][col] - T[i][col]) * t;
  return col === 1 || col === 3 ? s * y : y; // odd functions for c_l and c_m of a symmetric section
}
export const clTab = (T, a) => tab(T, a, 1);
export const cdTab = (T, a) => tab(T, a, 2);
export const cmTab = (T, a) => tab(T, a, 3);

// ── NACA 4-digit airfoils and a Hess–Smith panel method ───────────────────────────────────────────────────────────────
/** Thickness half-profile of the NACA 4-digit family (closed trailing edge: last coefficient 0.1036). */
export const nacaT = (x, t) => 5 * t * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
/** Mean camber line height and slope for maximum camber m at position p (chord fractions). */
export function nacaCamber(x, m, p) {
  if (m === 0 || p === 0) return [0, 0];
  return x < p ? [m / (p * p) * (2 * p * x - x * x), 2 * m / (p * p) * (p - x)]
    : [m / ((1 - p) ** 2) * ((1 - 2 * p) + 2 * p * x - x * x), 2 * m / ((1 - p) ** 2) * (p - x)];
}
/** Surface points clockwise from the trailing edge along the lower surface to the leading edge and back along the upper surface (2n+1 points, first = last). */
export function naca4(m, p, t, n = 70) {
  const lower = [], upper = [];
  for (let k = 0; k <= n; k++) {
    const x = 0.5 * (1 + Math.cos(Math.PI * k / n)), yt = nacaT(x, t), [yc, dy] = nacaCamber(x, m, p), th = Math.atan(dy);
    lower.push([x + yt * Math.sin(th), yc - yt * Math.cos(th)]);
  }
  for (let k = 1; k <= n; k++) {
    const x = 0.5 * (1 - Math.cos(Math.PI * k / n)), yt = nacaT(x, t), [yc, dy] = nacaCamber(x, m, p), th = Math.atan(dy);
    upper.push([x - yt * Math.sin(th), yc + yt * Math.cos(th)]);
  }
  const pts = lower.concat(upper);
  pts[pts.length - 1] = pts[0].slice(); // exactly closed
  return pts;
}
export function camberLine(m, p, n = 60) { const out = []; for (let k = 0; k <= n; k++) { const x = k / n; out.push([x, nacaCamber(x, m, p)[0]]); } return out; }

/**
 * Hess–Smith panel method: constant-strength source on every panel plus one constant vortex density gamma shared by all
 * panels, with the Kutta condition (equal speed on the two trailing-edge panels). The velocity field is linear in the
 * free stream, so two solves (V = (1,0) and (0,1)) give every angle of attack.
 */
export function panelModel(pts) {
  const N = pts.length - 1;
  const px = new Float64Array(N), py = new Float64Array(N), L = new Float64Array(N), tx = new Float64Array(N), ty = new Float64Array(N),
    nx = new Float64Array(N), ny = new Float64Array(N), cx = new Float64Array(N), cy = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    L[i] = Math.hypot(x2 - x1, y2 - y1); tx[i] = (x2 - x1) / L[i]; ty[i] = (y2 - y1) / L[i];
    nx[i] = -ty[i]; ny[i] = tx[i]; cx[i] = (x1 + x2) / 2; cy[i] = (y1 + y2) / 2; px[i] = x1; py[i] = y1;
  }
  // velocity at panel i's control point from unit source (S) and unit CCW vortex (V) on panel j: global components
  const infl = (i, j) => {
    const dx = cx[i] - px[j], dy = cy[i] - py[j];
    const x = dx * tx[j] + dy * ty[j], z = -dx * ty[j] + dy * tx[j] + (i === j ? 1e-10 : 0); // z along e_z = (-ty, tx), the outward normal (points are traversed clockwise)
    const r1 = Math.hypot(x, z), r2 = Math.hypot(x - L[j], z), th1 = Math.atan2(z, x), th2 = Math.atan2(z, x - L[j]);
    const us = Math.log(r1 / r2) / (2 * Math.PI), ws = (th2 - th1) / (2 * Math.PI);
    const uv = -ws, wv = us; // CCW vortex = source field rotated by +90 degrees
    // local axes: e_x = t, e_z = (-ty, tx) (outward normal)
    const gx = (u, w) => u * tx[j] - w * ty[j], gy = (u, w) => u * ty[j] + w * tx[j];
    return [gx(us, ws), gy(us, ws), gx(uv, wv), gy(uv, wv)];
  };
  const A = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(0));
  const Tq = Array.from({ length: N }, () => new Float64Array(N)), Tg = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let gsum = 0;
    for (let j = 0; j < N; j++) {
      const [sx, sy, vx, vy] = infl(i, j);
      A[i][j] = sx * nx[i] + sy * ny[i];
      Tq[i][j] = sx * tx[i] + sy * ty[i];
      gsum += vx * nx[i] + vy * ny[i];
      Tg[i] += vx * tx[i] + vy * ty[i];
    }
    A[i][N] = gsum;
  }
  for (let j = 0; j < N; j++) A[N][j] = Tq[0][j] + Tq[N - 1][j];
  A[N][N] = Tg[0] + Tg[N - 1];
  return { pts, N, L, tx, ty, nx, ny, cx, cy, A, Tq, Tg, solved: null };
}
function luSolveDense(A, bs) { // Gaussian elimination with partial pivoting on a copy, multiple right-hand sides
  const n = A.length, M = A.map((r, i) => r.concat(bs.map((b) => b[i])));
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; if (!f) continue; for (let k = c; k < n + bs.length; k++) M[r][k] -= f * M[c][k]; }
  }
  return bs.map((_, b) => { const x = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let a = M[i][n + b]; for (let k = i + 1; k < n; k++) a -= M[i][k] * x[k]; x[i] = a / M[i][i]; } return x; });
}
/** Surface speed and pressure at angle of attack alpha (rad), free stream 1: returns Vt (along the traversal), cp, forces. */
export function panelSolve(model, alpha) {
  const { N, tx, ty, nx, ny, cx, cy, L } = model;
  if (!model.solved) {
    const rhs = [[1, 0], [0, 1]].map(([vx, vy]) => { const b = []; for (let i = 0; i < N; i++) b.push(-(vx * nx[i] + vy * ny[i])); b.push(-(vx * (tx[0] + tx[N - 1]) + vy * (ty[0] + ty[N - 1]))); return b; });
    const sol = luSolveDense(model.A, rhs);
    model.solved = sol.map((s, k) => {
      const vx = k === 0 ? 1 : 0, vy = k === 0 ? 0 : 1, Vt = new Float64Array(N), g = s[N];
      for (let i = 0; i < N; i++) { let v = vx * tx[i] + vy * ty[i]; for (let j = 0; j < N; j++) v += model.Tq[i][j] * s[j]; Vt[i] = v + g * model.Tg[i]; }
      return { Vt, gamma: g };
    });
  }
  const [s1, s2] = model.solved, ca = Math.cos(alpha), sa = Math.sin(alpha);
  const Vt = new Float64Array(N), cp = new Float64Array(N);
  for (let i = 0; i < N; i++) { Vt[i] = ca * s1.Vt[i] + sa * s2.Vt[i]; cp[i] = 1 - Vt[i] * Vt[i]; }
  const gamma = ca * s1.gamma + sa * s2.gamma;
  return { Vt, cp, gamma, alpha, ...panelForces(model, cp, null, alpha) , kj: -2 * gamma * L.reduce((a, b) => a + b, 0) };
}
/** Integrate pressure (and optional skin friction cf per panel with direction sign) into c_l, c_d, c_m about the quarter chord. */
export function panelForces(model, cp, cfs, alpha) {
  const { N, L, tx, ty, nx, ny, cx, cy } = model;
  let Fx = 0, Fy = 0, M = 0, Fxp = 0, Fyp = 0, Fxf = 0, Fyf = 0;
  for (let i = 0; i < N; i++) {
    const px = -cp[i] * nx[i] * L[i], py = -cp[i] * ny[i] * L[i];
    let fx = 0, fy = 0;
    if (cfs) { fx = cfs[i] * tx[i] * L[i]; fy = cfs[i] * ty[i] * L[i]; } // cfs signed along the traversal tangent
    Fxp += px; Fyp += py; Fxf += fx; Fyf += fy;
    Fx += px + fx; Fy += py + fy;
    M += (cx[i] - 0.25) * (py + fy) - cy[i] * (px + fx);
  }
  const ca = Math.cos(alpha), sa = Math.sin(alpha);
  return {
    cl: Fy * ca - Fx * sa, cd: Fx * ca + Fy * sa, cm: -M, /* nose-up positive */ Fx, Fy,
    clp: Fyp * ca - Fxp * sa, cdp: Fxp * ca + Fyp * sa, cdf: Fxf * ca + Fyf * sa, clf: Fyf * ca - Fxf * sa,
  };
}
/**
 * Skin friction from a flat-plate (local-similarity) boundary layer driven by the panel-method edge speed:
 * laminar c_f = 0.664 / sqrt(Re_s), turbulent c_f = 0.0592 Re_s^(-1/5) (Schlichting), Re_s = Re * ue * s from the stagnation point;
 * transition at chord fraction xtr on each surface. Returns signed (flow direction) tau / q_inf per panel.
 */
export function skinFriction(model, Vt, Re, xtr) {
  const { N, L, cx } = model, cf = new Float64Array(N);
  let is = 0; while (is < N && Vt[is] < 0) is++; // first panel with flow along +t = upper surface; stagnation lies just before it
  let s = 0;
  for (let i = is - 1; i >= 0; i--) { s += L[i]; const ue = Math.abs(Vt[i]), Res = Math.max(Re * ue * (s - L[i] / 2), 1), turb = cx[i] >= xtr;
    cf[i] = -(ue * ue) * (turb ? 0.0592 * Res ** -0.2 : 0.664 / Math.sqrt(Res)); }
  s = 0;
  for (let i = is; i < N; i++) { s += L[i]; const ue = Math.abs(Vt[i]), Res = Math.max(Re * ue * (s - L[i] / 2), 1), turb = cx[i] >= xtr;
    cf[i] = (ue * ue) * (turb ? 0.0592 * Res ** -0.2 : 0.664 / Math.sqrt(Res)); }
  return { cf, stag: is };
}

// ── Dimensional analysis: Buckingham pi by the null space of the dimension matrix ───────────────────────────────────────
/** Exponents of [M, L, T] for each named variable. */
export const DIMS = {
  L: { name: 'L', unit: 'force', e: [1, 1, -2] }, D: { name: 'D', unit: 'force', e: [1, 1, -2] },
  rho: { name: '\\rho', unit: 'density', e: [1, -3, 0] }, V: { name: 'V', unit: 'speed', e: [0, 1, -1] },
  S: { name: 'S', unit: 'area', e: [0, 2, 0] }, c: { name: 'c', unit: 'length', e: [0, 1, 0] },
  mu: { name: '\\mu', unit: 'viscosity', e: [1, -1, -1] }, a: { name: 'a', unit: 'speed', e: [0, 1, -1] },
  Mom: { name: 'M_{\\rm ac}', unit: 'moment', e: [1, 2, -2] },
};
/** Smallest-integer exponent vectors spanning the null space of the dimension matrix (rows M, L, T). */
export function piGroups(names, M) {
  const A = [0, 1, 2].map((r) => names.map((n) => DIMS[n].e[r]));
  const ns = M.nullspace(A);
  return ns.map((vec) => {
    const mx = Math.max(...vec.map(Math.abs)); let w = vec.map((x) => x / mx);
    for (let k = 1; k <= 12; k++) { const t = w.map((x) => x * k); if (t.every((x) => Math.abs(x - Math.round(x)) < 1e-6)) { w = t.map(Math.round); break; } }
    const lead = w.find((x) => x !== 0); if (names[0] && w[0] < 0 && lead < 0) w = w.map((x) => -x);
    return w;
  });
}
