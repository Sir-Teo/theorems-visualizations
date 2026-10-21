// Chemical Kinetics — Chapter 3: helpers shared by the items of ch03.js
// Re-exports the surface and trajectory helpers of chapter 2, and adds a Langevin double well (reduced units: m = kT = 1),
// the Eyring prefactor, and a few thermochemical helpers.
export * from './ch02.shared.js';

export const KB = 1.380649e-23, HP = 6.62607015e-34, NA = 6.02214076e23;     // SI (exact since 2019)
export const RJ = 8.314462618;                                               // J/(mol K)
export const kTh = (T) => KB * T / HP;                                       // k_B T / h, s^-1
export const HC_K = 1.438776877;                                             // hc/k_B, cm K
/** Eyring rate constant (s^-1) from activation enthalpy (kJ/mol) and entropy (J/mol/K), transmission kappa */
export const eyring = (T, dH, dS, kappa = 1) => kappa * kTh(T) * Math.exp(dS / RJ - dH * 1000 / (RJ * T));

// ---------------------------------------------------------------- seeded RNG independent of v (for long loops)
export function mkRng(seed) {
  let a = seed >>> 0 || 1;
  const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let spare = null;
  u.normal = () => { if (spare !== null) { const s = spare; spare = null; return s; } let x, y, r; do { x = 2 * u() - 1; y = 2 * u() - 1; r = x * x + y * y; } while (r >= 1 || r === 0); const f = Math.sqrt(-2 * Math.log(r) / r); spare = y * f; return x * f; };
  return u;
}

// ---------------------------------------------------------------- symmetric double well V = dV (x^2 - 1)^2, minima at x = -1, +1, barrier top at x = 0
export function dwell(dV) {
  const V = (x) => dV * (x * x - 1) ** 2, F = (x) => -4 * dV * x * (x * x - 1);
  const w0 = Math.sqrt(8 * dV), wb = Math.sqrt(4 * dV);
  // classical TST rate left -> right through x = xd: <v+> rho(xd) / P_left  (reduced units, kT = m = 1)
  let Zl = 0; const h = 0.002; for (let x = -4; x < 0; x += h) Zl += Math.exp(-V(x)) * h;
  const kTST = (xd = 0) => Math.exp(-V(xd)) / Math.sqrt(2 * Math.PI) / Zl;
  // action of the closed orbit at the barrier energy (separatrix of the left well): I = 2 int p dx between the turning points
  let I = 0; { const E = dV, x0 = -Math.sqrt(2); const n = 4000; for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * (-x0) / n; I += Math.sqrt(Math.max(0, 2 * (E - V(x)))) * (-x0) / n; } I *= 2; }
  const kKramers = (g) => (w0 / (2 * Math.PI)) * (Math.sqrt(g * g / 4 + wb * wb) - g / 2) / wb * Math.exp(-dV);   // spatial diffusion, any friction in the high-damping branch
  const kLow = (g) => g * I * (w0 / (2 * Math.PI)) * Math.exp(-dV);                                              // energy-diffusion limit
  return { dV, V, F, w0, wb, kTST, kKramers, kLow, I, Zl };
}

/** BAOAB Langevin step for arrays x, p (kT = m = 1, friction g). */
export function langevinStep(W, x, p, g, dt, rnd) {
  const c1 = Math.exp(-g * dt), c2 = Math.sqrt(1 - c1 * c1);
  for (let i = 0; i < x.length; i++) {
    p[i] += 0.5 * dt * W.F(x[i]); x[i] += 0.5 * dt * p[i];
    p[i] = c1 * p[i] + c2 * rnd.normal();
    x[i] += 0.5 * dt * p[i]; p[i] += 0.5 * dt * W.F(x[i]);
  }
}

/** mean first-passage time from the left minimum (thermal momentum) to the right minimum x = +1, from n independent runs. */
export function mfpt(W, g, n, seed, { dt = 0.02, tmax = 20000 } = {}) {
  const rnd = mkRng(seed), c1 = Math.exp(-g * dt), c2 = Math.sqrt(1 - c1 * c1);
  let sum = 0, done = 0; const ts = [];
  for (let k = 0; k < n; k++) {
    let x = -1, p = rnd.normal(), t = 0, hit = false;
    while (t < tmax) {
      p += 0.5 * dt * W.F(x); x += 0.5 * dt * p; p = c1 * p + c2 * rnd.normal(); x += 0.5 * dt * p; p += 0.5 * dt * W.F(x); t += dt;
      if (x >= 1) { hit = true; break; }
    }
    sum += t; if (hit) done++; ts.push(t);
  }
  const mean = sum / n, sd = Math.sqrt(ts.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  return { tau: mean, err: sd / Math.sqrt(n), done, n };
}

// ---------------------------------------------------------------- linear algebra for small kinetic schemes
/** exp(M t) for a small matrix by scaling and squaring of a Taylor series */
export function expmSmall(M, t) {
  const n = M.length; let s = 0, nrm = 0; for (const r of M) for (const x of r) nrm = Math.max(nrm, Math.abs(x * t));
  while (nrm > 0.5) { nrm /= 2; s++; }
  const A = M.map((r) => r.map((x) => x * t / 2 ** s));
  let E = A.map((r, i) => r.map((_, j) => (i === j ? 1 : 0))), term = E.map((r) => r.slice());
  for (let k = 1; k < 24; k++) {
    const T2 = term.map((r) => r.map(() => 0));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let a = 0; for (let m = 0; m < n; m++) a += term[i][m] * A[m][j]; T2[i][j] = a / k; }
    term = T2; E = E.map((r, i) => r.map((x, j) => x + term[i][j]));
  }
  for (let q = 0; q < s; q++) { const E2 = E.map((r) => r.map(() => 0)); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let a = 0; for (let m = 0; m < n; m++) a += E[i][m] * E[m][j]; E2[i][j] = a; } E = E2; }
  return E;
}
/** Boltzmann-averaged parabolic-barrier (Kemble) tunnelling factor kappa(T) = int_0^inf P(E) e^{-E/kT} dE/kT / e^{-V0/kT}; energies in kJ/mol, hv in kJ/mol. */
export function kappaTunnel(V0, hv, T) {
  const kT = RJ * T / 1000, top = V0 + 40 * kT, N = 800, h = top / N; let s = 0;
  for (let i = 0; i <= N; i++) { const E = i * h, a = 2 * Math.PI * (V0 - E) / hv, lp = a > 30 ? a : Math.log(1 + Math.exp(a)); s += (i === 0 || i === N ? 0.5 : 1) * Math.exp((V0 - E) / kT - lp); }
  return s * h / kT;
}
