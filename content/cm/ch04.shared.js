// Condensed Matter Physics — Chapter 4: helpers shared by ch04.js and ch04-b.js.
// Re-exports the chapter-3 helpers and adds a small semiconductor model: Varshni gaps, effective densities of states,
// the exact Fermi–Dirac integral, and charge neutrality with partially ionized donors (all in cm⁻³, eV, K).
export * from './ch03.shared.js';

export const KB = 8.617333262e-5; // eV/K
export const Q = 1.602176634e-19; // C
export const EPS0 = 8.8541878128e-14; // F/cm
/** Material parameters (textbook-level; density-of-states masses in units of m0, Varshni parameters Eg(T) = Eg0 − αT²/(T+β)).
 *  Values quoted from memory of standard tables (Sze; Ioffe archive) — good to a few percent; the module shows 300 K checks. */
export const MAT = {
  Si: { name: 'Si', Eg0: 1.17, alpha: 4.73e-4, beta: 636, me: 1.08, mh: 0.81, eps: 11.7, a: 5.431, ni300: 1.0e10, indirect: true, Ed: 0.045, mcond: 0.26 },
  Ge: { name: 'Ge', Eg0: 0.7437, alpha: 4.774e-4, beta: 235, me: 0.55, mh: 0.37, eps: 16.0, a: 5.658, ni300: 2.0e13, indirect: true, Ed: 0.0127, mcond: 0.12 },
  GaAs: { name: 'GaAs', Eg0: 1.519, alpha: 5.405e-4, beta: 204, me: 0.067, mh: 0.53, eps: 12.9, a: 5.653, ni300: 2.1e6, indirect: false, Ed: 0.0058, mcond: 0.067 },
};
export const eg = (m, T) => m.Eg0 - (m.alpha * T * T) / (T + m.beta);
export const Nc = (m, T) => 2.5094e19 * m.me ** 1.5 * (T / 300) ** 1.5;
export const Nv = (m, T) => 2.5094e19 * m.mh ** 1.5 * (T / 300) ** 1.5;
/** Boltzmann (non-degenerate) intrinsic density sqrt(Nc Nv) exp(−Eg/2kT). */
export const niB = (m, T) => Math.sqrt(Nc(m, T) * Nv(m, T)) * Math.exp(-eg(m, T) / (2 * KB * T));

// Normalised Fermi–Dirac integral F(η) = (2/√π) ∫0^∞ √x /(1+e^{x−η}) dx  (→ e^η for η → −∞), tabulated on ln F.
let FT = null;
const F_LO = -40, F_HI = 40, F_H = 0.05;
function fdExact(eta) {
  const umax = Math.sqrt(Math.max(eta, 0) + 45), n = 400, h = umax / n; let s = 0;
  const f = (u) => { const t = u * u - eta; return (2 * u * u) / (1 + Math.exp(Math.max(-700, Math.min(700, t)))); };
  s = f(0) + f(umax); for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 ? 4 : 2);
  return ((s * h) / 3) * (2 / Math.sqrt(Math.PI)); // ∫0^∞ √x(...)dx = ∫ 2u²(...)du, then × 2/√π
}
export function fdHalf(eta) {
  if (eta < F_LO) return Math.exp(eta);
  if (!FT) { FT = []; for (let e = F_LO; e <= F_HI + 1e-9; e += F_H) FT.push(Math.log(fdExact(e))); }
  if (eta >= F_HI) return fdExact(eta);
  const p = (eta - F_LO) / F_H, i = Math.floor(p), t = p - i;
  return Math.exp(FT[i] * (1 - t) + FT[i + 1] * t);
}
/** Equilibrium electron and hole densities for a chemical potential μ measured from the valence-band top. */
export function np(m, T, mu) {
  const kT = KB * T, E = eg(m, T);
  return { n: Nc(m, T) * fdHalf((mu - E) / kT), p: Nv(m, T) * fdHalf((0 - mu) / kT) };
}
/** Solve charge neutrality n + Na⁻ = p + Nd⁺ for μ (eV above Ev). Donors sit Ed below the band edge with degeneracy 2;
 *  acceptors are taken as fully ionized. */
export function solveMu(m, T, Nd, Na, Ed = m.Ed) {
  const kT = KB * T, E = eg(m, T);
  const g = (mu) => { const c = np(m, T, mu); const ndp = Nd / (1 + 2 * Math.exp(Math.max(-60, Math.min(60, (mu - (E - Ed)) / kT)))); return c.n + Na - c.p - ndp; };
  let lo = -0.6, hi = E + 0.6;
  for (let it = 0; it < 70; it++) { const mid = (lo + hi) / 2; if (g(mid) > 0) hi = mid; else lo = mid; }
  const mu = (lo + hi) / 2, c = np(m, T, mu), ndp = Nd / (1 + 2 * Math.exp(Math.max(-60, Math.min(60, (mu - (E - Ed)) / kT))));
  return { mu, n: c.n, p: c.p, ndp };
}
/** Tridiagonal (Thomas) solver: a sub-, b main-, c super-diagonal. */
export function thomas(a, b, c, d) {
  const n = b.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
  cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
  x[n - 1] = dp[n - 1]; for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}

// ------------------------------------------------------------------ 4.7: p–n junction at equilibrium (Poisson–Boltzmann, no depletion approximation)
/** Solve ψ'' = (2 sinh ψ − C(x)/n_i)/λ² for a step junction (p for x < 0 with N_a, n for x > 0 with N_d) on a grid refined near x = 0.
 *  ψ = (E_F − E_i)/kT, so n = n_i e^{ψ}, p = n_i e^{−ψ}. Lengths in µm. Returns arrays and the depletion-approximation numbers. */
export function pnEquilibrium(m, T, Na, Nd, N = 700) {
  const kT = KB * T, ni = niB(m, T), eps = m.eps * EPS0, lam = Math.sqrt((eps * kT) / (Q * ni)) * 1e4; // µm
  const Vbi = kT * Math.log((Na * Nd) / (ni * ni));
  const W = Math.sqrt((2 * eps * Vbi * (1 / Na + 1 / Nd)) / Q) * 1e4; // µm
  const xn = (W * Na) / (Na + Nd), xp = (W * Nd) / (Na + Nd);
  const Lh = 3.2 * Math.max(xn, xp), beta = 5;
  const x = new Float64Array(N), C = new Float64Array(N), psi = new Float64Array(N);
  for (let i = 0; i < N; i++) { const t = -1 + (2 * i) / (N - 1); x[i] = (Lh * Math.sinh(beta * t)) / Math.sinh(beta); C[i] = x[i] >= 0 ? Nd / ni : -Na / ni; psi[i] = Math.asinh(C[i] / 2); }
  const a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N), d = new Float64Array(N);
  for (let it = 0; it < 120; it++) {
    let maxd = 0;
    b[0] = 1; c[0] = 0; a[0] = 0; d[0] = 0; b[N - 1] = 1; a[N - 1] = 0; c[N - 1] = 0; d[N - 1] = 0;
    for (let i = 1; i < N - 1; i++) {
      const hm = x[i] - x[i - 1], hp = x[i + 1] - x[i], s = hm + hp;
      const sub = 2 / (hm * s), sup = 2 / (hp * s), l2 = lam * lam;
      const F = sub * psi[i - 1] + sup * psi[i + 1] - (sub + sup) * psi[i] - (2 * Math.sinh(psi[i]) - C[i]) / l2;
      a[i] = sub; c[i] = sup; b[i] = -(sub + sup) - (2 * Math.cosh(psi[i])) / l2; d[i] = -F;
    }
    const dx = thomas(a, b, c, d);
    for (let i = 0; i < N; i++) { const st = Math.max(-1.5, Math.min(1.5, dx[i])); psi[i] += st; maxd = Math.max(maxd, Math.abs(st)); }
    if (maxd < 1e-9) break;
  }
  return { x, psi, C, ni, kT, eps, lam, Vbi, W, xn, xp, Lh };
}

// ------------------------------------------------------------------ 4.10: MOS capacitor and long-channel MOSFET (charge-sheet model, p-type Si)
export function mosModel(Na, toxNm, Vfb = 0, T = 300) {
  const m = MAT.Si, kT = KB * T, Vt = kT, ni = niB(m, T), eps = m.eps * EPS0, epsox = 3.9 * EPS0, Cox = epsox / (toxNm * 1e-7);
  const K = 2 * Q * eps * Na * Vt, r = (ni * ni) / (Na * Na), phiF = Vt * Math.log(Na / ni);
  const A = (u) => Math.exp(-u) + u - 1;
  // charge sheet: F² = (e^{-u}+u-1) + (n0/p0)(e^{-vc}(e^{u}-1) - u)
  const F2 = (u, vc) => Math.max(0, A(u) + r * (Math.exp(-vc) * (Math.exp(Math.min(500, u)) - 1) - u));
  const Qs = (psi, vc = 0) => (psi >= 0 ? 1 : -1) * Math.sqrt(K * F2(psi / Vt, vc / Vt));
  const gate = (psi, vc) => psi + Math.abs(Qs(psi, vc)) / Cox * (psi >= 0 ? 1 : -1);
  const psiOf = (Vg, vc = 0) => {
    const target = Vg - Vfb; let lo = -1.0, hi = 2.2;
    for (let it = 0; it < 70; it++) { const mid = (lo + hi) / 2; if (gate(mid, vc) > target) hi = mid; else lo = mid; }
    return (lo + hi) / 2;
  };
  const Qinv = (psi, vc = 0) => { const u = psi / Vt, a = A(u), b = r * (Math.exp(-vc / Vt) * (Math.exp(Math.min(500, u)) - 1) - u); return Math.sqrt(K) * (Math.sqrt(Math.max(0, a + b)) - Math.sqrt(Math.max(0, a))); };
  const Qdep = (psi) => Math.sqrt(2 * Q * eps * Na * Math.max(psi, 0));
  const VT = Vfb + 2 * phiF + Math.sqrt(4 * eps * Q * Na * phiF) / Cox;
  const Wm = Math.sqrt((4 * eps * phiF) / (Q * Na)); // maximum depletion width, cm
  /** Drain current (A) for W/L = wl and mobility mu (cm²/Vs). */
  const Id = (Vg, Vd, mu = 400, wl = 10) => {
    if (Vg <= Vfb) return 0;
    // I = μ (W/L) ∫0^Vd Q_inv(V_c) dV_c with V_c the electron quasi-Fermi potential (it already contains the diffusion current);
    // the substitution V_c = V_d s² puts more points near the source, where Q_inv varies on the scale k_BT/e.
    const n = 40, h = 1 / n; let s = 0;
    for (let i = 0; i <= n; i++) { const t = i * h, vc = Vd * t * t; s += Qinv(psiOf(Vg, vc), vc) * 2 * Vd * t * (i === 0 || i === n ? 1 : i % 2 ? 4 : 2); }
    return Math.max(0, mu * wl * ((s * h) / 3));
  };
  /** Band bending ψ(z) from the surface into the bulk (z in nm), by integrating dψ/dz = −E_s(ψ). */
  const profile = (psis) => {
    const out = [[0, psis]]; let z = 0, psi = psis; const LD = Math.sqrt((eps * Vt) / (Q * Na));
    for (let it = 0; it < 2500 && psi > 0.03 * Vt; it++) {
      const Es = (u) => Math.sqrt(2) * (Vt / LD) * Math.sqrt(F2(u, 0));
      const e1 = Es(psi / Vt); const dz = Math.max(0.03e-7, Math.min(3e-7, (0.04 * Vt) / e1));
      const mid = psi - 0.5 * dz * e1, e2 = Es(Math.max(mid, 1e-6) / Vt); psi = psi - dz * e2; z += dz; out.push([z * 1e7, Math.max(psi, 0)]);
    }
    return out;
  };
  return { Vt, ni, Cox, phiF, VT, Wm, K, psiOf, Qs, Qinv, Qdep, Id, profile, eps };
}

// ------------------------------------------------------------------ 4.11: finite quantum well with position-dependent mass (BenDaniel–Duke)
const HB2M = 0.0380998; // ħ²/2m0 in eV nm²
/** Bound-state energies (eV above the band edge of the well) of a well of width L (nm), depth V (eV), masses mw, mb (units of m0). */
export function wellLevels(L, V, mw, mb, bdd = true) {
  if (V <= 0) return [];
  const mbc = bdd ? mb : mw;
  const hE = (E) => { const k = Math.sqrt((mw * E) / HB2M), q = Math.sqrt((mbc * (V - E)) / HB2M); return (k / mw) * Math.sin((k * L) / 2) - (q / mbc) * Math.cos((k * L) / 2); };
  const hO = (E) => { const k = Math.sqrt((mw * E) / HB2M), q = Math.sqrt((mbc * (V - E)) / HB2M); return (k / mw) * Math.cos((k * L) / 2) + (q / mbc) * Math.sin((k * L) / 2); };
  const out = [], n = 2400;
  for (const [f, par] of [[hE, 0], [hO, 1]]) {
    let prev = f(1e-9), Ep = 1e-9;
    for (let i = 1; i <= n; i++) {
      const E = (V * i) / (n + 1); const cur = f(E);
      if (prev * cur < 0) { let lo = Ep, hi = E; for (let it = 0; it < 60; it++) { const mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; } out.push({ E: (lo + hi) / 2, par }); }
      prev = cur; Ep = E;
    }
  }
  out.sort((a, b) => a.E - b.E);
  return out.map((q, i) => ({ ...q, n: i + 1 }));
}
/** Wave function of a level on x ∈ [−X, X] (nm), normalised to ∫|ψ|² = 1. */
export function wellPsi(L, V, mw, mb, lev, X, n = 400, bdd = true) {
  const E = lev.E, mbc = bdd ? mb : mw, k = Math.sqrt((mw * E) / HB2M), q = Math.sqrt((mbc * (V - E)) / HB2M), xs = [], ps = [];
  const inside = (x) => (lev.par === 0 ? Math.cos(k * x) : Math.sin(k * x)), edge = inside(L / 2);
  for (let i = 0; i <= n; i++) { const x = -X + (2 * X * i) / n; const a = Math.abs(x); let p = a <= L / 2 ? inside(x) : edge * Math.exp(-q * (a - L / 2)) * (lev.par === 1 && x < 0 ? -1 : 1); xs.push(x); ps.push(p); }
  let s = 0; for (let i = 0; i <= n; i++) s += ps[i] * ps[i]; s *= (2 * X) / n; const nr = Math.sqrt(s);
  return { xs, ps: ps.map((p) => p / nr) };
}
