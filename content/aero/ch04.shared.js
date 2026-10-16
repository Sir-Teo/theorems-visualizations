// Aerospace Engineering — Chapter 4 (Compressibility and high-speed flight): helpers shared by ch04.js.
// Everything of chapters 1-3 (atmosphere, NACA sections, panel method, lifting-line and vortex-lattice helpers) is re-exported.
//
// What is standard and recomputed here (checked in the readouts): isentropic relations for a perfect gas with gamma = 1.4; the theta-beta-M relation
// tan(theta) = 2 cot(beta) (M^2 sin^2 beta - 1) / (M^2 (gamma + cos 2 beta) + 2); the Prandtl-Meyer function nu(M); Ackeret's linear theory Cp = 2 theta / sqrt(M^2 - 1);
// the slender-body (von Karman / Sears-Haack) wave drag of an axisymmetric body, D/q = -(1/2 pi) Int Int S''(x1) S''(x2) ln|x1 - x2| dx1 dx2, written in Fourier form
// below (coefficient checked against the closed-form Sears-Haack drag 128 V^2 / (pi l^4) by ch04.shared.js sears() and a direct double integral in the test run).
// The Korn relation for the drag-divergence Mach number and Lock's fourth-power wave-drag rise are engineering correlations (Mason, Configuration Aerodynamics; see ch04.js header).
export * from './ch03.shared.js';
import { GAMMA } from './ch03.shared.js';

export const G = GAMMA, GM1 = GAMMA - 1, GP1 = GAMMA + 1;
const RAD = Math.PI / 180;

// ── Isentropic relations ──────────────────────────────────────────────────────────────────────────────────────────────
/** Pressure coefficient at which the local flow is exactly sonic, for an isentropic expansion from free-stream Mach M (the "critical" Cp*). */
export function cpCrit(M) {
  if (M <= 0) return -Infinity;
  return 2 / (G * M * M) * (Math.pow((1 + 0.5 * GM1 * M * M) / (0.5 * GP1), G / GM1) - 1);
}
/** Local Mach number from the pressure coefficient (isentropic, free-stream Mach M). */
export function machFromCp(cp, M) {
  const pr = 1 + 0.5 * G * M * M * cp; // p / p_inf
  if (pr <= 0) return Infinity;
  const t0 = 1 + 0.5 * GM1 * M * M;
  return Math.sqrt(Math.max(0, 2 / GM1 * (t0 * Math.pow(pr, -GM1 / G) - 1)));
}
/** Compressibility corrections of the incompressible pressure coefficient cp0. */
export const pgCorr = (cp0, M) => cp0 / Math.sqrt(1 - M * M);
export function ktCorr(cp0, M) { const b = Math.sqrt(1 - M * M); return cp0 / (b + (M * M / (1 + b)) * cp0 / 2); }
export function laitoneCorr(cp0, M) { const b = Math.sqrt(1 - M * M); return cp0 / (b + (M * M * (1 + 0.5 * GM1 * M * M) / (2 * b)) * cp0); }
/** Mach number at which a correction law reaches the critical Cp* for a given incompressible suction peak cp0 < 0 (null if never below M = 0.995). */
export function machCritical(cp0, law = pgCorr) {
  const f = (M) => { const c = law(cp0, M); return (c > 0 || !Number.isFinite(c) ? -1e9 : c) - cpCrit(M); };
  let lo = 0.3, hi = 0.995; if (f(lo) < 0) return lo; if (f(hi) > 0) return null;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

// ── Oblique shock and Prandtl-Meyer expansion (perfect gas, gamma = 1.4) ───────────────────────────────────────────────────
/** Flow deflection theta (rad) for a shock of angle beta (rad) at upstream Mach M. */
export function thetaOf(beta, M) {
  const s = Math.sin(beta);
  return Math.atan(2 / Math.tan(beta) * (M * M * s * s - 1) / (M * M * (G + Math.cos(2 * beta)) + 2));
}
/** Maximum deflection and the shock angle at which it occurs, by golden-section search. */
export function thetaMax(M) {
  const mu = Math.asin(1 / M); let a = mu, b = Math.PI / 2;
  for (let i = 0; i < 80; i++) { const c = a + 0.382 * (b - a), d = a + 0.618 * (b - a); if (thetaOf(c, M) > thetaOf(d, M)) b = d; else a = c; }
  const be = (a + b) / 2; return { theta: thetaOf(be, M), beta: be };
}
/** Weak- and strong-shock angles (rad) for deflection theta (rad); null if the shock is detached (theta > theta_max). */
export function shockAngles(theta, M) {
  if (theta <= 0) return { weak: Math.asin(1 / M), strong: Math.PI / 2 };
  const tm = thetaMax(M); if (theta > tm.theta) return null;
  const solve = (lo, hi, sgn) => { for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2; if ((thetaOf(m, M) - theta) * sgn < 0) lo = m; else hi = m; } return (lo + hi) / 2; };
  return { weak: solve(Math.asin(1 / M), tm.beta, 1), strong: solve(tm.beta, Math.PI / 2, -1) };
}
/** Jump across an oblique shock of angle beta: pressure, density, temperature ratios, downstream Mach, stagnation-pressure ratio. */
export function obliqueJump(M, beta) {
  const mn = M * Math.sin(beta), mn2 = mn * mn;
  const p = 1 + 2 * G / GP1 * (mn2 - 1), rho = GP1 * mn2 / (GM1 * mn2 + 2), T = p / rho;
  const mn2d = (1 + 0.5 * GM1 * mn2) / (G * mn2 - 0.5 * GM1), th = thetaOf(beta, M);
  const M2 = Math.sqrt(mn2d) / Math.sin(beta - th);
  const p0 = Math.pow(rho, G / GM1) * Math.pow(1 / p, 1 / GM1) * 1; // p02/p01 = (rho)^(g/(g-1)) p^(-1/(g-1))
  return { p, rho, T, M2, p0, theta: th };
}
/** Prandtl-Meyer function nu(M) in rad (M >= 1) and its inverse by bisection. */
export function nuPM(M) {
  if (M <= 1) return 0; const k = Math.sqrt(GP1 / GM1), q = Math.sqrt(M * M - 1);
  return k * Math.atan(q / k) - Math.atan(q);
}
export const NU_MAX = (Math.sqrt(GP1 / GM1) - 1) * Math.PI / 2;
export function machFromNu(nu) {
  if (nu <= 0) return 1; if (nu >= NU_MAX) return Infinity;
  let lo = 1, hi = 1e4; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (nuPM(m) < nu) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
/** Static pressure ratio for an isentropic change of Mach number from M1 to M2. */
export const isenP = (M1, M2) => Math.pow((1 + 0.5 * GM1 * M1 * M1) / (1 + 0.5 * GM1 * M2 * M2), G / GM1);

// ── Shock-expansion forces on a flat plate or a symmetric diamond at supersonic speed ───────────────────────────────────
/**
 * Pressure on one face that turns the stream by `turn` (rad, positive = into the flow, compression) from a state of Mach M1 and pressure ratio p1 (relative to free stream).
 * Returns { p, M } (p relative to free-stream pressure); a detached shock returns null.
 */
export function turnFace(M1, p1, turn) {
  if (Math.abs(turn) < 1e-12) return { p: p1, M: M1 };
  if (turn > 0) { const b = shockAngles(turn, M1); if (!b) return null; const j = obliqueJump(M1, b.weak); return { p: p1 * j.p, M: j.M2 }; }
  const nu2 = nuPM(M1) - turn; if (nu2 >= NU_MAX) return { p: 0, M: Infinity };
  const M2 = machFromNu(nu2); return { p: p1 * isenP(M1, M2), M: M2 };
}
/**
 * Lift and drag coefficient of a symmetric diamond airfoil (face slope eps = half-angle, rad) at angle of attack alpha, by shock-expansion theory
 * (first half of each surface faces the wedge angle, second half is expanded by 2 eps). eps = 0 is the flat plate. Returns cl, cd, and the four face pressures as Cp.
 */
export function shockExpansionDiamond(M, alpha, eps) {
  const q = 0.5 * G * M * M, cp = (p) => (p - 1) / q;
  const up1 = turnFace(M, 1, eps - alpha), lo1 = turnFace(M, 1, eps + alpha);
  if (!up1 || !lo1) return null;
  const up2 = turnFace(up1.M, up1.p, -2 * eps), lo2 = turnFace(lo1.M, lo1.p, -2 * eps);
  // face normals: upper front face slope (eps - alpha) relative to the flow: each half-chord 1/2; forces from p dA
  const faces = [
    { p: up1.p, ang: -(alpha - eps) /* surface angle to the flow, positive = nose up */, up: true }, { p: up2.p, ang: -(alpha + eps), up: true },
    { p: lo1.p, ang: -(alpha + eps), up: false }, { p: lo2.p, ang: -(alpha - eps), up: false },
  ];
  // upper surface: front face rises at slope +eps (body axes), rear falls at -eps; flow at angle alpha. Work in wind axes via body-axis normal forces.
  let N = 0, A = 0; // body-axis normal (up) and axial (aft) force per unit chord, in units of q: use Cp
  const seg = [[up1, +eps, true], [up2, -eps, true], [lo1, -eps, false], [lo2, +eps, false]];
  for (const [f, slope, upper] of seg) {
    const c = cp(f.p), dxs = 0.5, ang = slope, n = upper ? [-Math.sin(ang), Math.cos(ang)] : [Math.sin(ang), -Math.cos(ang)];
    // pressure pushes against the surface, i.e. opposite to the outward normal n: force = -p n dA (use Cp, dA = dx / cos(ang))
    const dA = dxs / Math.cos(ang);
    N += -c * n[1] * dA; A += -c * n[0] * dA;
  }
  const ca = Math.cos(alpha), sa = Math.sin(alpha);
  return { cl: N * ca - A * sa, cd: A * ca + N * sa, up1: cp(up1.p), up2: cp(up2.p), lo1: cp(lo1.p), lo2: cp(lo2.p) };
}
/** Ackeret (linear) theory for the same diamond: cl = 4 alpha / beta, cd = 4 (alpha^2 + eps^2) / beta, beta = sqrt(M^2 - 1). */
export function ackeretDiamond(M, alpha, eps) {
  const b = Math.sqrt(M * M - 1);
  return { cl: 4 * alpha / b, cd: 4 * (alpha * alpha + eps * eps) / b, up1: 2 * (eps - alpha) / b, up2: -2 * (eps + alpha) / b, lo1: 2 * (eps + alpha) / b, lo2: -2 * (eps - alpha) / b };
}

// ── Slender-body wave drag (area rule) ──────────────────────────────────────────────────────────────────────────────────
/**
 * Wave drag D/q of a slender body of length l with cross-section area S(x) (S(0) = S(l) = 0), via the Fourier series S(theta) = sum A_n sin(n theta), x = (l/2)(1 - cos theta):
 * D/q = (6 pi / l^2) sum n A_n^2 (coefficient fixed by the Sears-Haack body and confirmed against the double integral); returns { dq, A (coefficients), Sfun }. S given as samples S(x) on n+1 equispaced points over [0, l].
 */
export function waveDrag(Sfun, l = 1, nth = 400, nmax = 40) {
  const A = [];
  for (let n = 1; n <= nmax; n++) {
    let s = 0;
    for (let k = 0; k < nth; k++) { const th = (k + 0.5) / nth * Math.PI, x = 0.5 * l * (1 - Math.cos(th)); s += Sfun(x) * Math.sin(n * th); }
    A.push(2 / nth * s);
  }
  let sum = 0; A.forEach((a, i) => { sum += (i + 1) * a * a; });
  return { dq: 6 * Math.PI / (l * l) * sum, A, sum };
}
/** Closed-form minimum wave drag D/q = 128 V^2 / (pi l^4) of a body of volume V and length l (Sears-Haack), and its area distribution S(x). */
export function sears(V, l = 1) {
  const S0 = 16 * V / (3 * Math.PI * l);
  return { dq: 128 * V * V / (Math.PI * l ** 4), S: (x) => S0 * Math.pow(4 * x * (l - x) / (l * l), 1.5) };
}

// ── A wing-body area distribution (items 4.4 and 4.8) ──────────────────────────────────────────────────────────────────────
export const LBODY = 1;
/** Ideal fuselage area (Sears-Haack-like, peak Af at mid-length) in terms of x/l. */
export const fusIdeal = (x, Af) => { const c = 1 - 2 * x / LBODY, s2 = Math.max(0, 1 - c * c); return Af * Math.pow(s2, 1.5); };
/** Smooth hump of wing cross-section area: sin^2 over [xw, xw + ww]. */
export const wingHump = (x, Aw, xw, ww) => (x <= xw || x >= xw + ww ? 0 : Aw * Math.sin(Math.PI * (x - xw) / ww) ** 2);
const _cache = new Map();
/** Fourier coefficients of the ideal fuselage and of the wing hump (the area-rule drag is quadratic in the sum A_f + (1 - k) A_w). */
export function areaCoeffs(Af, Aw, xw, ww) {
  const key = `${Af}|${Aw}|${xw}|${ww}`; let o = _cache.get(key); if (o) return o;
  const f = waveDrag((x) => fusIdeal(x, Af), LBODY, 300, 30).A, w = waveDrag((x) => wingHump(x, Aw, xw, ww), LBODY, 300, 30).A;
  o = { f, w }; _cache.set(key, o); if (_cache.size > 40) _cache.delete(_cache.keys().next().value); return o;
}
/** Wave drag D/q (area units) of the body whose area is fusIdeal + (1 - k) wingHump (k = 1: fuselage indented by exactly the wing area). */
export function dragOfK(co, k) { let s = 0; for (let i = 0; i < co.f.length; i++) { const a = co.f[i] + (1 - k) * co.w[i]; s += (i + 1) * a * a; } return 6 * Math.PI / (LBODY * LBODY) * s; }
