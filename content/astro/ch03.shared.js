// Astrophysics & Celestial Mechanics — Chapter 3: helpers shared by ch03.js
// (re-exports the chapter-2 helpers: constants TAU, DEG, clamp, memo, sci, wrap…, Kepler solver kepE, …)
export * from './ch02.shared.js';
import { TAU, kepE } from './ch02.shared.js';

// ── constants (SI) ───────────────────────────────────────────────────────────
// G: CODATA 2018. GM_sun, L_sun, au: IAU nominal values. Planet/satellite masses, radii, periods: NASA NSSDC fact sheets.
export const G = 6.6743e-11, C_LIGHT = 299792458, AU = 1.495978707e11, GM_SUN = 1.32712440018e20, L_SUN = 3.828e26;
export const K_B = 1.380649e-23, M_H = 1.6735575e-27, AMU = 1.66053907e-27;
export const YEAR = 3.15576e7; // Julian year, s
export const BODY = {
  earth: { name: 'Earth', M: 5.9722e24, R: 6.378137e6, rho: 5513, P: 23.9345 * 3600, f: 0.003353 },
  jupiter: { name: 'Jupiter', M: 1898.13e24, R: 71.492e6, rho: 1326, P: 9.925 * 3600, f: 0.06487 },
  saturn: { name: 'Saturn', M: 568.32e24, R: 60.268e6, rho: 687, P: 10.656 * 3600, f: 0.09796 },
  moon: { name: 'Moon', M: 0.07346e24, R: 1.7374e6, rho: 3344, a: 0.3844e9 },
  io: { name: 'Io', M: 893.2e20, R: 1.8215e6, rho: 3530, a: 421.8e6, P: 1.769138 * 86400, e: 0.004 },
};

/** Linear interpolation helper for tabulated curves. */
export function interp(xs, ys, x) {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
  const t = (x - xs[lo]) / (xs[hi] - xs[lo]);
  return ys[lo] + t * (ys[hi] - ys[lo]);
}

// ── Roche ellipsoid: homogeneous fluid satellite, synchronous rotation, quadrupole tidal field ──────────────────
// Surface condition: (A1 − 3ε) a1² = A2 a2² = (A3 + ε) a3², with a1 a2 a3 = 1 (units of the equal-volume radius r),
// ε = M/(2π ρ d³).  A_i = a1a2a3 ∫0^∞ du /((a_i²+u)Δ), Δ = √((a1²+u)(a2²+u)(a3²+u)).
function indexSymbols(a1, a2, a3) {
  const a = [a1, a2, a3], A = [0, 0, 0], N = 220;
  for (let k = 0; k < N; k++) {
    const t = (k + 0.5) / N, u = t / (1 - t), w = 1 / ((1 - t) * (1 - t));
    const D = Math.sqrt((a1 * a1 + u) * (a2 * a2 + u) * (a3 * a3 + u));
    for (let i = 0; i < 3; i++) A[i] += w / ((a[i] * a[i] + u) * D);
  }
  const p = a1 * a2 * a3;
  return [A[0] * p / N, A[1] * p / N, A[2] * p / N];
}
function rocheResidual(x, eps) {
  const a1 = Math.exp(x[0]), a2 = Math.exp(x[1]), a3 = 1 / (a1 * a2), A = indexSymbols(a1, a2, a3);
  const L1 = (A[0] - 3 * eps) * a1 * a1, L2 = A[1] * a2 * a2, L3 = (A[2] + eps) * a3 * a3;
  return [L1 - L2, L2 - L3];
}
/** Newton solve for the Roche ellipsoid at tidal parameter eps, from a starting guess x = [ln a1, ln a2]. */
function rocheSolve(eps, x0) {
  const x = x0.slice();
  for (let it = 0; it < 40; it++) {
    const r = rocheResidual(x, eps), h = 1e-6, J = [[0, 0], [0, 0]];
    for (let j = 0; j < 2; j++) { const xp = x.slice(); xp[j] += h; const rp = rocheResidual(xp, eps); J[0][j] = (rp[0] - r[0]) / h; J[1][j] = (rp[1] - r[1]) / h; }
    const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
    const d0 = (r[0] * J[1][1] - r[1] * J[0][1]) / det, d1 = (J[0][0] * r[1] - J[1][0] * r[0]) / det;
    x[0] -= d0; x[1] -= d1;
    if (!isFinite(x[0] + x[1])) return { ok: false };
    if (Math.abs(d0) + Math.abs(d1) < 1e-11) break;
  }
  const rr = rocheResidual(x, eps);
  return { ok: Math.abs(rr[0]) + Math.abs(rr[1]) < 1e-8 && x[0] > -0.01, x, a: [Math.exp(x[0]), Math.exp(x[1]), Math.exp(-x[0] - x[1])] };
}
/**
 * Branch of equilibrium shapes as the satellite approaches the planet. Distance is measured in
 * D = d / (R (ρ_p/ρ_m)^{1/3}) so that ε = (2/3) D⁻³. Returns {D: [], a1: [], a2: [], a3: [], Dcrit} sampled from far to near;
 * Dcrit is the last distance with an equilibrium (the fold of the branch).
 */
export function rocheBranch() {
  const D = [], a1 = [], a2 = [], a3 = [];
  let x = [0, 0], last = null;
  for (let Dv = 6; Dv > 2.2; Dv -= 0.02) {
    const eps = 2 / (3 * Dv ** 3), s = rocheSolve(eps, x);
    if (!s.ok) break;
    x = s.x; D.push(Dv); a1.push(s.a[0]); a2.push(s.a[1]); a3.push(s.a[2]); last = Dv;
  }
  // refine the fold by bisection in D
  let lo = last - 0.02, hi = last;
  for (let k = 0; k < 20; k++) {
    const mid = (lo + hi) / 2, s = rocheSolve(2 / (3 * mid ** 3), x);
    if (s.ok) { hi = mid; x = s.x; } else lo = mid;
  }
  return { D, a1, a2, a3, Dcrit: hi };
}

// ── spin–orbit dynamics: θ'' = −(3/2) σ (a/r)³ sin 2(θ − f) (time unit 1/n, ω = θ'/n) ───────────────────────
/** Tables of (a/r)³ and the true anomaly f at 2·Ns half-steps over one orbit of eccentricity e. */
export function orbitTable(e, Ns = 96) {
  const m = 2 * Ns, ar3 = new Float64Array(m + 1), f = new Float64Array(m + 1);
  let prev = 0, off = 0;
  for (let k = 0; k <= m; k++) {
    const M = (TAU * k) / m, E = kepE(M, e);
    let nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    if (k > 0 && nu + off < prev - 1) off += TAU;
    f[k] = nu + off; prev = f[k];
    ar3[k] = Math.pow(1 + e * Math.cos(nu), 3) / Math.pow(1 - e * e, 3);
  }
  f[m] = TAU;
  return { Ns, ar3, f, e };
}
/**
 * Advance the spin one orbit (pericentre to pericentre) by RK4. State s = [θ, ω] (θ in rad, ω in units of n). κ is a tidal (viscous)
 * braking rate, dω/dt = −κ(ω − 1) on top of the gravitational torque; κ = 0 gives the conservative (Hamiltonian) map. Returns the state in place.
 */
export function spinOrbit(tab, sigma, kappa, s) {
  const { Ns, ar3, f } = tab, h = TAU / Ns;
  let th = s[0], w = s[1];
  const acc = (t, k, ww) => -1.5 * sigma * ar3[k] * Math.sin(2 * (t - f[k])) - kappa * (ww - 1);
  for (let j = 0; j < Ns; j++) {
    const k0 = 2 * j;
    const a1 = acc(th, k0, w), t2 = th + 0.5 * h * w, w2 = w + 0.5 * h * a1, a2 = acc(t2, k0 + 1, w2);
    const t3 = th + 0.5 * h * w2, w3 = w + 0.5 * h * a2, a3 = acc(t3, k0 + 1, w3);
    const t4 = th + h * w3, w4 = w + h * a3, a4 = acc(t4, k0 + 2, w4);
    th += (h / 6) * (w + 2 * w2 + 2 * w3 + w4); w += (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
  }
  s[0] = th; s[1] = w;
  return s;
}

// ── Hill's problem: change of a ring particle's guiding centre in one passage of a small moon ────────────────────
// Units: n = 1, length in the moon's Hill radius R_H = a (m/3M)^{1/3}; ẍ = 2ẏ + 3x − 3x/r³, ÿ = −2ẋ − 3y/r³.
// The guiding-centre offset is x_g = 2(ẏ + 2x); kick = change of x_g for a particle that starts on a circular orbit at x_g = Δ > 0
// (outside the moon: it moves backward relative to the moon and the moon approaches from y > 0). The encounter boundaries scale with separation (Y0=100D,200D);
// two-boundary extrapolation suppresses the leading finite-distance error. Returns NaN for trapped (horseshoe-type) orbits that never pass.
export function hillKickRaw(D, Y0, maxStep=.025) {
  let x = D, y = Y0, u = 0, w = -1.5 * D, guard = 0;
  const acc = (X, Y, U, W) => { const r2 = X * X + Y * Y, k = 3 / (r2 * Math.sqrt(r2)); return [2 * W + 3 * X - k * X, -2 * U - k * Y]; };
  const g0 = 2 * (w + 2 * x);
  while (y > -Y0) {
    if (guard++ > 60000) return NaN;
    const r = Math.hypot(x, y), h = Math.min(maxStep, 0.02 * r);
    const k1 = acc(x, y, u, w);
    const x2 = x + 0.5 * h * u, y2 = y + 0.5 * h * w, u2 = u + 0.5 * h * k1[0], w2 = w + 0.5 * h * k1[1], k2 = acc(x2, y2, u2, w2);
    const x3 = x + 0.5 * h * u2, y3 = y + 0.5 * h * w2, u3 = u + 0.5 * h * k2[0], w3 = w + 0.5 * h * k2[1], k3 = acc(x3, y3, u3, w3);
    const x4 = x + h * u3, y4 = y + h * w3, u4 = u + h * k3[0], w4 = w + h * k3[1], k4 = acc(x4, y4, u4, w4);
    x += (h / 6) * (u + 2 * u2 + 2 * u3 + u4); y += (h / 6) * (w + 2 * w2 + 2 * w3 + w4);
    u += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); w += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
  }
  return 2 * (w + 2 * x) - g0;
}
/** Guiding-centre kick (in Hill radii) for offset Δ (either sign, |Δ| ≥ Δmin); table computed once; far-tail Δ^-5 continuation. */
export const HILL_MIN = 2.6;
let hillTab = null;
export function hillKick(Delta) {
  if (!hillTab) {
    const D = [2.6, 2.8, 3.0, 3.25, 3.5, 3.8, 4.2, 4.7, 5.3, 6, 7, 8.5, 10, 12, 16], K = [];
    for (const d of D) K.push(2 * hillKickRaw(d, 200*d) - hillKickRaw(d, 100*d));
    hillTab = { D, lnD: D.map(Math.log), lnK: K.map(Math.log) };
  }
  const a = Math.abs(Delta), sg = Math.sign(Delta);
  if (a < HILL_MIN) return NaN;
  const { D, lnD, lnK } = hillTab, n = D.length;
  let v;
  if (a >= D[n - 1]) v = Math.exp(lnK[n - 1] + (-5) * (Math.log(a) - lnD[n - 1]));
  else { let i = 0; while (D[i + 1] < a) i++; const t = (Math.log(a) - lnD[i]) / (lnD[i + 1] - lnD[i]); v = Math.exp(lnK[i] + t * (lnK[i + 1] - lnK[i])); }
  return sg * v;
}

/** Circular, constant-|torque| locking toy. Q^{-1}=|sin epsilon_2|;
 * static incompressible elastic k2 (Frouard et al.2016 eqs.2,4–6).
 * Near synchronism a physical rheology must replace this discontinuous torque. */
export function tidalLockModel({planet, radius, density, rigidity, Q, periodHours, aRp}) {
  const m=4*Math.PI*density*radius**3/3,a=aRp*planet.R,g=G*m/radius**2;
  const k2=1.5/(1+19*rigidity/(2*density*g*radius)),I=.4*m*radius**2;
  const n=Math.sqrt(G*(planet.M+m)/a**3),w0=TAU/(periodHours*3600);
  const torque=1.5*G*planet.M**2*k2*radius**5/(a**6*Q),rate=torque/I;
  const tl=Math.abs(w0-n)/rate/YEAR;
  return {m,a,g,k2,I,n,w0,torque,rate,tl,p:planet};
}
export function lockingSpin(model, years) {
  const {w0,n,rate}=model,dir=Math.sign(n-w0),w=w0+dir*rate*years*YEAR;
  return dir>0?Math.min(w,n):Math.max(w,n);
}

/** Analytic circular, fixed positive phase-lag Earth–Moon branch, normalized
 * to the chosen present recession0.038m/yr. Stops at contact or synchronism. */
export function moonTideState(tGyr, lagFactor=1) {
  const E=BODY.earth,Mm=BODY.moon.M,a0=BODY.moon.a,C=.3307*E.M*E.R**2,w0=TAU/86164.1;
  const mu=E.M*Mm/(E.M+Mm),Lorb=a=>mu*Math.sqrt(G*(E.M+Mm)*a),Ltot=C*w0+Lorb(a0);
  const A=.038/YEAR*lagFactor*a0**5.5,z=a0**6.5+6.5*A*tGyr*1e9*YEAR;
  const a=z>0?z**(1/6.5):0,w=a>0?(Ltot-Lorb(a))/C:0,n=a>0?Math.sqrt(G*(E.M+Mm)/a**3):0;
  const valid=a>E.R&&w>n;
  return {a,w,n,C,Ltot,Lorb:a>0?Lorb(a):0,A,valid,reason:a<=E.R?'formal contact has already occurred':'positive-lag, faster-spin branch has ended',tContact:-(a0**6.5-E.R**6.5)/(6.5*A)/(1e9*YEAR)};
}

/** Classical isotropic Jeans effusion at a chosen level, with log-domain
 * local one-scale-height drain time; not a whole-atmosphere lifetime. */
export function jeansParameters({M,r,m,T}) {
  const v0=Math.sqrt(2*K_B*T/m),vesc=Math.sqrt(2*G*M/r),lambda=G*M*m/(K_B*T*r);
  const logEffusion=Math.log(v0/(2*Math.sqrt(Math.PI)))+Math.log1p(lambda)-lambda;
  const log10Years=(Math.log(r/lambda)-logEffusion-Math.log(YEAR))/Math.LN10;
  return {v0,vesc,lambda,effusion:Math.exp(logEffusion),logEffusion,log10Years};
}

/** Leading e² synchronous, zero-obliquity, single-k2/Q heating model. */
export function tidalPower({M,R,a,n,e,kq}) { return 10.5*kq*G*M**2*R**5*n*e**2/a**6; }
export function eccentricityDamping({M,m,R,a,n,kq}) { return 2/(21*n*kq)*(m/M)*(a/R)**5/YEAR; }
