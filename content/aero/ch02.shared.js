// Aerospace Engineering — Chapter 2 (Airfoils): helpers shared by ch02.js.
// Everything of chapter 1 (standard atmosphere, NACA 4-digit geometry, Hess–Smith panel method, NACA 0012 data of Critzos et al. 1955) is re-exported.
export * from './ch01.shared.js';
import { naca4, nacaCamber, panelModel, panelSolve, panelForces } from './ch01.shared.js';

const DEGR = Math.PI / 180;

// ── Thin-airfoil integrals for an arbitrary camber slope dyc/dx(x) (Glauert's A_n) ────────────────────────────────────
/** Zero-lift angle (rad) and c_m,c/4 of a thin cambered section with slope function dydx(x), x in [0, 1]. */
export function thinAirfoil(dydx, n = 600) {
  let a0 = 0, A1 = 0, A2 = 0;
  for (let k = 0; k < n; k++) {
    const th = (k + 0.5) / n * Math.PI, x = (1 - Math.cos(th)) / 2, d = dydx(x), w = Math.PI / n;
    a0 += d * (Math.cos(th) - 1) * w; A1 += d * Math.cos(th) * w; A2 += d * Math.cos(2 * th) * w;
  }
  const alphaL0 = -a0 / Math.PI; A1 *= 2 / Math.PI; A2 *= 2 / Math.PI;
  return { alphaL0, cm: Math.PI / 4 * (A2 - A1), A1, A2 };
}
export const nacaSlope = (m, p) => (x) => nacaCamber(x, m, p)[1];

// ── Kirchhoff trailing-edge-separation model of the lift curve ─────────────────────────────────────────────────────────
/** Separation point f (fraction of the chord from the leading edge to the separation point) at effective angle ae (deg, from zero lift). */
export function kirchF(ae, P) {
  const f = ae <= P.A1 ? 1 - 0.3 * Math.exp((ae - P.A1) / P.S1) : 0.04 + 0.66 * Math.exp((P.A1 - ae) / P.S2);
  return Math.min(1, Math.max(0, f));
}
/** Lift coefficient c_l = a (alpha - alpha_L0) ((1 + sqrt f)/2)^2 with linear slope a per radian; returns { cl, f }. */
export function kirchCl(alpha, P) {
  const ae = alpha - P.aL0, f = kirchF(ae, P);
  return { cl: P.a * ae * DEGR * ((1 + Math.sqrt(f)) / 2) ** 2, f, ae };
}
// parameters fitted by eye to NACA 0012 (Critzos et al. 1955, R = 1.8e6 and 0.5e6; see ch02.js header)
export const KIRCH = { r18: { a: 5.9, aL0: 0, A1: 14.4, S1: 1.8, S2: 1.4 }, r05: { a: 5.9, aL0: 0, A1: 12.3, S1: 2.7, S2: 1.0 } };

// ── Kármán–Trefftz airfoil (Joukowski for n = 2) with the exact potential-flow solution ───────────────────────────────────
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cpow = (a, p) => { const r = Math.hypot(a[0], a[1]), t = Math.atan2(a[1], a[0]); return [Math.pow(r, p) * Math.cos(p * t), Math.pow(r, p) * Math.sin(p * t)]; };
/**
 * Kármán–Trefftz section z = n c (1 + W)/(1 - W), W = ((zeta - c)/(zeta + c))^n, from the circle through zeta = c centred at (-eps c, mu c) (c = 1);
 * n = 2 is the Joukowski section (cusped trailing edge), n < 2 gives a trailing-edge angle of pi (2 - n). eps is thickness, mu camber.
 * Points run clockwise from the trailing edge (lower surface first), N panels spaced in arclength and clustered at the leading edge, scaled to unit chord with
 * the leading edge at x = 0. exact(alpha) gives the exact circulation and surface speed (alpha measured from the real axis of the z-plane).
 */
export function karmanTrefftz(eps, mu, n, N) {
  const c = 1, z0 = [-eps * c, mu * c], a = Math.hypot(c - z0[0], z0[1]), beta = Math.asin(mu * c / a), thTE = Math.atan2(-z0[1], c - z0[0]);
  const zeta = (th) => [z0[0] + a * Math.cos(th), z0[1] + a * Math.sin(th)];
  const Wof = (z) => cpow(cdiv([z[0] - c, z[1]], [z[0] + c, z[1]]), n);
  const map = (z) => { const W = Wof(z); return cmul([n * c, 0], cdiv([1 + W[0], W[1]], [1 - W[0], -W[1]])); };
  const M = 6000, fine = []; for (let k = 0; k <= M; k++) { const th = thTE - 2 * Math.PI * k / M; fine.push({ th, p: k === M ? null : map(zeta(th)) }); }
  fine[M].p = fine[0].p.slice();
  let iLE = 0; fine.forEach((q, i) => { if (q.p[0] < fine[iLE].p[0]) iLE = i; });
  const cum = [0]; for (let i = 1; i <= M; i++) cum.push(cum[i - 1] + Math.hypot(fine[i].p[0] - fine[i - 1].p[0], fine[i].p[1] - fine[i - 1].p[1]));
  const warp = (u) => 0.6 * (1 - Math.cos(Math.PI * u)) / 2 + 0.4 * u;
  const at = (sArc) => { let lo = 0, hi = M; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] < sArc) lo = mid; else hi = mid; } const t = (sArc - cum[lo]) / (cum[hi] - cum[lo] || 1); return { th: fine[lo].th + (fine[hi].th - fine[lo].th) * t, p: [fine[lo].p[0] + (fine[hi].p[0] - fine[lo].p[0]) * t, fine[lo].p[1] + (fine[hi].p[1] - fine[lo].p[1]) * t] }; };
  const nl = Math.round(N / 2), nu = N - nl, raw = [];
  for (let k = 0; k < nl; k++) raw.push(at(cum[iLE] * (1 - warp(1 - k / nl))).p); // lower: TE -> LE
  for (let k = 0; k <= nu; k++) raw.push(at(cum[iLE] + (cum[M] - cum[iLE]) * warp(k / nu)).p); // upper: LE -> TE
  raw[N] = raw[0].slice();
  let xmin = Infinity, xmax = -Infinity; for (const { p: [x] } of fine) { xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); }
  const chord = xmax - xmin, norm = ([x, y]) => [(x - xmin) / chord, y / chord];
  const pts = raw.map(norm);
  const exact = (alpha) => {
    const Gam = 4 * Math.PI * a * Math.sin(alpha + beta);
    const speedAt = (th) => {
      const zp = [a * Math.cos(th), a * Math.sin(th)], zt = zeta(th), r2 = zp[0] ** 2 + zp[1] ** 2;
      const inv = [zp[0] / r2, -zp[1] / r2], inv2 = cmul(inv, inv);
      const re = Math.cos(alpha) - a * a * (Math.cos(alpha) * inv2[0] - Math.sin(alpha) * inv2[1]) - Gam / (2 * Math.PI) * inv[1];
      const im = -Math.sin(alpha) - a * a * (Math.sin(alpha) * inv2[0] + Math.cos(alpha) * inv2[1]) + Gam / (2 * Math.PI) * inv[0];
      const W = Wof(zt), w = cdiv([zt[0] - c, zt[1]], [zt[0] + c, zt[1]]), wn1 = cpow(w, n - 1);
      const den = cmul(cmul([zt[0] + c, zt[1]], [zt[0] + c, zt[1]]), cmul([1 - W[0], -W[1]], [1 - W[0], -W[1]]));
      const dz = cdiv(cmul([4 * n * n * c * c, 0], wn1), den);
      return Math.hypot(re, im) / Math.hypot(dz[0], dz[1]);
    };
    return { Gam, cl: 2 * Gam / chord, speedAt, alpha };
  };
  const surface = (m = 600) => { const out = []; for (let k = 0; k <= m; k++) { const th = thTE - 2 * Math.PI * k / m; out.push({ th, p: norm(k === m ? fine[0].p : map(zeta(th))) }); } return out; };
  return { pts, chord, exact, surface, a, beta };
}

// ── Integral boundary layer on the panel-method edge velocity (Thwaites laminar, Head turbulent, Squire–Young drag) ──────
const XEND = 0.95; // Squire–Young is evaluated at x/c = 0.95: the inviscid trailing-edge speed is ~0, which would make the formula blow up
const thwL = (l) => (l >= 0 ? 0.22 + 1.57 * l - 1.8 * l * l : 0.22 + 1.402 * l + 0.018 * l / (l + 0.107));
const thwH = (l) => (l >= 0 ? 2.61 - 3.75 * l + 5.24 * l * l : 2.088 + 0.0731 / (l + 0.14));
const H1ofH = (H) => (H <= 1.6 ? 3.3 + 0.8234 * Math.pow(Math.max(H - 1.1, 1e-3), -1.287) : 3.3 + 1.5501 * Math.pow(H - 0.6778, -3.064));
const HofH1 = (H1) => (H1 >= 5.309 ? 1.1 + Math.pow((H1 - 3.3) / 0.8234, -1 / 1.287) : 0.6778 + Math.pow(Math.max(H1 - 3.3, 1e-3) / 1.5501, -1 / 3.064));
/**
 * March the boundary layer along the two surfaces of a panel model. Vt = signed surface speed per panel (free stream 1),
 * Re chord Reynolds number, xtr = forced transition x/c (null: Michel's criterion, Re_theta = 1.174 (1 + 22400/Re_x) Re_x^0.46).
 * Returns per-panel state (0 laminar, 1 turbulent, 2 separated), tau/q_inf (signed along the traversal), transition and separation x/c per side,
 * and the Squire–Young total drag split into friction (integral of shear) and pressure (the remainder).
 */
export function boundaryLayer(model, Vt, Re, xtr, alpha = 0) {
  const { N, L, cx } = model, state = new Uint8Array(N), tau = new Float64Array(N), delta = new Float64Array(N);
  let is = 0; while (is < N && Vt[is] < 0) is++;
  const sides = [], out = { sides: [] };
  const order = [[...Array(is).keys()].reverse(), [...Array(N - is).keys()].map((k) => k + is)];
  let cdTot = 0;
  order.forEach((idx, side) => {
    const sgn = side === 0 ? -1 : 1, n = idx.length;
    if (!n) return;
    const s = new Float64Array(n), ue = new Float64Array(n);
    let acc = 0; for (let k = 0; k < n; k++) { const i = idx[k]; acc += L[i] / 2 + (k ? L[idx[k - 1]] / 2 : 0); s[k] = acc; ue[k] = Math.max(Math.abs(Vt[i]), 1e-6); }
    const due = new Float64Array(n);
    for (let k = 0; k < n; k++) { const a = Math.max(0, k - 1), b = Math.min(n - 1, k + 1); due[k] = (ue[b] - ue[a]) / (s[b] - s[a]); }
    const nu = 1 / Re;
    const thk = new Float64Array(n), Hk = new Float64Array(n); let I = 0, th = 0, H = 2.6, mode = 0, xT = null, xS = null, H1 = 0, Th1 = 0, prevI = 0;
    for (let k = 0; k < n; k++) {
      const i = idx[k], ds = k ? s[k] - s[k - 1] : s[k], x = cx[i];
      if (mode === 0) {
        I += ue[k] ** 5 * ds; th = Math.sqrt(0.45 * nu * I / ue[k] ** 6);
        const lam = th * th * due[k] / nu, Reth = ue[k] * th * Re, Rex = Math.max(Re * ue[k] * s[k], 1);
        H = thwH(Math.max(lam, -0.09)); const cf = 2 * thwL(Math.max(lam, -0.09)) / Math.max(Reth, 1e-9);
        tau[i] = sgn * cf * ue[k] ** 2; state[i] = 0; delta[i] = H * th; thk[k] = th; Hk[k] = H;
        const trip = xtr !== null && xtr !== undefined ? x >= xtr : Reth > 1.174 * (1 + 22400 / Rex) * Math.pow(Rex, 0.46);
        if ((trip && k > 2) || lam <= -0.09) { mode = 1; xT = x; H = 1.4; H1 = H1ofH(H); Th1 = ue[k] * th * H1; }
      } else if (mode >= 1) {
        const Reth = Math.max(ue[k] * th * Re, 1);
        const cf = 0.246 * Math.pow(10, -0.678 * H) * Math.pow(Reth, -0.268);
        const dth = mode === 2 ? -(H + 2) * th / ue[k] * due[k] : cf / 2 - (H + 2) * th / ue[k] * due[k];
        const dTh1 = mode === 2 ? 0 : ue[k] * 0.0306 * Math.pow(Math.max(H1 - 3, 0.05), -0.6169);
        th = Math.max(th + dth * ds, 1e-7);
        if (mode === 1) { Th1 = Th1 + (dTh1 - 0) * ds; Th1 = Math.max(Th1, ue[k] * th * 3.05); H1 = Th1 / (ue[k] * th); H = HofH1(H1); if (H > 2.4) { mode = 2; H = 2.4; xS = x; } }
        const cfk = mode === 2 ? 0 : 0.246 * Math.pow(10, -0.678 * H) * Math.pow(Reth, -0.268);
        tau[i] = sgn * cfk * ue[k] ** 2; state[i] = mode === 2 && x <= XEND ? 2 : 1; delta[i] = H * th; thk[k] = th; Hk[k] = H;
      }
    }
    let kT = n - 1; while (kT > 0 && cx[idx[kT]] > XEND) kT--;
    const cdSide = 2 * thk[kT] * Math.pow(ue[kT], (Hk[kT] + 5) / 2);
    cdTot += cdSide;
    out.sides.push({ xT, xS: xS !== null && xS <= XEND ? xS : null, thTE: thk[kT], HTE: Hk[kT], cd: cdSide, mode });
  });
  const F = panelForces(model, new Float64Array(N), tau, alpha);
  return { state, tau, delta, cd: cdTot, cdf: F.cdf, cdp: cdTot - F.cdf, sides: out.sides, stag: is };
}

export { naca4, panelModel, panelSolve, panelForces };
