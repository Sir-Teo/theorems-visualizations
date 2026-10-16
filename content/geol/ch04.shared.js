// Geology & Geophysics — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports).
// Re-exports the Chapter 3 helpers (which re-export chapter 2's: decay constants, age formatting).
// Contents: SI constants and half-space cooling formulas for the oceanic lithosphere, the plate-model series solution, and a small
// 2-D Boussinesq convection solver (infinite Prandtl number, free-slip box) used by 4.7–4.9.
export * from './ch03.shared.js';

export const YR = 3.15576e7;       // s per year
export const MYR = YR * 1e6;       // s per Myr
export const KAPPA = 1e-6;         // m²/s, thermal diffusivity of rock
export const erfH = (x) => { // erf with a series/continued-fraction-free approximation good to ~1e-7 (Abramowitz & Stegun 7.1.26 refined by one Newton step is overkill here)
  const s = x < 0 ? -1 : 1, a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
};

// ── half-space cooling ──────────────────────────────────────────────────────────────────────────────────────────────
/** Temperature (°C) at depth z (m) in a half-space that started at Tm and is held at T0 at the surface, age t (Myr). */
export function halfSpaceT(z, tMyr, { Tm = 1300, T0 = 0, kappa = KAPPA } = {}) {
  if (tMyr <= 0) return z <= 0 ? T0 : Tm;
  const eta = z / (2 * Math.sqrt(kappa * tMyr * MYR));
  return T0 + (Tm - T0) * erfH(eta);
}
/** Surface heat flow (W/m²) of the half-space: k (Tm−T0)/√(π κ t). */
export const halfSpaceQ = (tMyr, { Tm = 1300, T0 = 0, k = 3.138, kappa = KAPPA } = {}) => (tMyr <= 0 ? Infinity : (k * (Tm - T0)) / Math.sqrt(Math.PI * kappa * tMyr * MYR));
/** Subsidence (m) below the ridge-crest level: 2 ρm α (Tm−T0)/(ρm−ρw) √(κ t/π). */
export const halfSpaceSubs = (tMyr, { Tm = 1300, T0 = 0, alpha = 3e-5, rhoM = 3300, rhoW = 1000, kappa = KAPPA } = {}) =>
  ((2 * rhoM * alpha * (Tm - T0)) / (rhoM - rhoW)) * Math.sqrt((kappa * Math.max(tMyr, 0) * MYR) / Math.PI);

// ── plate model (McKenzie 1967; Parsons & Sclater 1977) ─────────────────────────────────────────────────────────────
/** Plate-model temperature (°C): T = T0 + (Tm−T0)[ z/a + Σ 2/(nπ) sin(nπz/a) exp(−n²π²κt/a²) ], a = plate thickness (m). */
export function plateT(z, tMyr, a, { Tm = 1300, T0 = 0, kappa = KAPPA, N = 60 } = {}) {
  if (z >= a) return Tm;
  let s = z / a; const tau = (Math.PI * Math.PI * kappa * tMyr * MYR) / (a * a);
  for (let n = 1; n <= N; n++) { const e = Math.exp(-n * n * tau); if (e < 1e-14) break; s += ((2 / (n * Math.PI)) * Math.sin((n * Math.PI * z) / a) * e); }
  return T0 + (Tm - T0) * s;
}
/** Plate-model surface heat flow (W/m²): k(Tm−T0)/a [1 + 2 Σ exp(−n²π²κt/a²)]. */
export function plateQ(tMyr, a, { Tm = 1300, T0 = 0, k = 3.138, kappa = KAPPA } = {}) {
  const tau = (Math.PI * Math.PI * kappa * tMyr * MYR) / (a * a); let s = 1;
  for (let n = 1; n <= 200; n++) { const e = Math.exp(-n * n * tau); if (e < 1e-16) break; s += 2 * e; }
  return ((k * (Tm - T0)) / a) * s;
}
/** Plate-model subsidence (m): (ρm α (Tm−T0) a /(ρm−ρw)) [1/2 − 4/π² Σ_{odd n} exp(−n²π²κt/a²)/n²]. */
export function plateSubs(tMyr, a, { Tm = 1300, T0 = 0, alpha = 3e-5, rhoM = 3300, rhoW = 1000, kappa = KAPPA } = {}) {
  const tau = (Math.PI * Math.PI * kappa * tMyr * MYR) / (a * a); let s = 0;
  for (let n = 1; n <= 399; n += 2) { const e = Math.exp(-n * n * tau) / (n * n); if (e < 1e-16) break; s += e; }
  return ((rhoM * alpha * (Tm - T0) * a) / (rhoM - rhoW)) * (0.5 - (4 / (Math.PI * Math.PI)) * s);
}

// ── Rayleigh–Bénard convection: infinite Prandtl number, free-slip box, T = 1 below and 0 above ─────────────────────────
// Nondimensional: depth h = 1, time h²/κ, T in units of ΔT. ∇⁴ψ = Ra ∂T/∂x, u = ∂ψ/∂z, w = −∂ψ/∂x, T_t + u·∇T = ∇²T.
// ψ is found exactly in a sine basis (free-slip walls: ψ = ∇²ψ = 0), T is advanced with RK2 and third-order upwind advection.
export const CONV_L = 2 * Math.SQRT2; // width: two rolls at the critical wavelength 2√2 h
export function makeConvection({ nx = 80, nz = 28, Ra = 1e4, seed = 3, amp = 0.05 } = {}) {
  const L = CONV_L, dx = L / nx, dz = 1 / nz;
  const Mx = Math.max(8, nx >> 1), Nz = Math.max(6, nz >> 1);
  const Sx = [], Sz = [], k2 = [];
  for (let m = 0; m < Mx; m++) { const r = new Float64Array(nx); for (let i = 0; i < nx; i++) r[i] = Math.sin(((m + 1) * Math.PI * (i + 0.5) * dx) / L); Sx.push(r); }
  for (let n = 0; n < Nz; n++) { const r = new Float64Array(nz); for (let j = 0; j < nz; j++) r[j] = Math.sin((n + 1) * Math.PI * (j + 0.5) * dz); Sz.push(r); }
  for (let n = 0; n < Nz; n++) { const r = new Float64Array(Mx); for (let m = 0; m < Mx; m++) { const k = ((m + 1) * Math.PI) / L, q = (n + 1) * Math.PI; r[m] = (k * k + q * q) ** 2; } k2.push(r); }
  const T = new Float64Array(nx * nz), T1 = new Float64Array(nx * nz), K1 = new Float64Array(nx * nz);
  const U = new Float64Array(nx * nz), W = new Float64Array(nx * nz), P = new Float64Array(nx * nz), Tx = new Float64Array(nx * nz);
  const A = new Float64Array(nz * Mx), C = new Float64Array(nz * Mx), B = new Float64Array(Nz * Mx);
  // simple seeded noise
  let sd = seed >>> 0 || 1; const rnd = () => ((sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296) - 0.5;
  const S = { nx, nz, L, dx, dz, Ra, T, U, W, P, time: 0, steps: 0 };
  S.reset = () => {
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const z = (j + 0.5) * dz, x = (i + 0.5) * dx;
      T[j * nx + i] = 1 - z + amp * Math.sin(Math.PI * z) * (Math.cos((2 * Math.PI * x) / L) + 0.3 * rnd());
    }
    S.time = 0; S.steps = 0;
  };
  /** Solve for the flow from the current T. */
  function flow() {
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = T[j * nx + (i > 0 ? i - 1 : 0)], b = T[j * nx + (i < nx - 1 ? i + 1 : nx - 1)];
      Tx[j * nx + i] = (b - a) / (2 * dx);
    }
    // A[j][m] = Σ_i Tx[j][i] Sx[m][i]
    for (let j = 0; j < nz; j++) for (let m = 0; m < Mx; m++) { let s = 0; const sm = Sx[m], o = j * nx; for (let i = 0; i < nx; i++) s += Tx[o + i] * sm[i]; A[j * Mx + m] = s; }
    // C[n][m] = Σ_j A[j][m] Sz[n][j]
    const nrm = 4 / (nx * nz);
    for (let n = 0; n < Nz; n++) for (let m = 0; m < Mx; m++) { let s = 0; const sn = Sz[n]; for (let j = 0; j < nz; j++) s += A[j * Mx + m] * sn[j]; B[n * Mx + m] = (Ra * nrm * s) / k2[n][m]; }
    // back: C[j][m] = Σ_n B[n][m] Sz[n][j]; P[j][i] = Σ_m C[j][m] Sx[m][i]
    for (let j = 0; j < nz; j++) for (let m = 0; m < Mx; m++) { let s = 0; for (let n = 0; n < Nz; n++) s += B[n * Mx + m] * Sz[n][j]; C[j * Mx + m] = s; }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let s = 0; for (let m = 0; m < Mx; m++) s += C[j * Mx + m] * Sx[m][i]; P[j * nx + i] = s; }
    let umax = 1e-9;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const o = j * nx + i;
      const pu = j < nz - 1 ? P[o + nx] : -P[o], pd = j > 0 ? P[o - nx] : -P[o];
      const pr = i < nx - 1 ? P[o + 1] : -P[o], pl = i > 0 ? P[o - 1] : -P[o];
      U[o] = (pu - pd) / (2 * dz); W[o] = -(pr - pl) / (2 * dx);
      const a = Math.abs(U[o]) / dx + Math.abs(W[o]) / dz; if (a > umax) umax = a;
    }
    return umax;
  }
  // d/dt of field F (with boundary values 1 below, 0 above, mirror at sides) into out
  function rhs(F, out) {
    const at = (i, j) => { // ghost-aware read
      if (i < 0) i = 0; else if (i >= nx) i = nx - 1;
      if (j < 0) return 2 - F[i]; if (j >= nz) return -F[(nz - 1) * nx + i];
      return F[j * nx + i];
    };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const o = j * nx + i, c = F[o], e = at(i + 1, j), w = at(i - 1, j), n = at(i, j + 1), s = at(i, j - 1);
      const lap = (e + w - 2 * c) / (dx * dx) + (n + s - 2 * c) / (dz * dz);
      const u = U[o], v = W[o];
      let tx, tz;
      if (u >= 0) tx = (2 * e + 3 * c - 6 * w + at(i - 2, j)) / (6 * dx); else tx = -(2 * w + 3 * c - 6 * e + at(i + 2, j)) / (6 * dx);
      if (v >= 0) tz = (2 * n + 3 * c - 6 * s + at(i, j - 2)) / (6 * dz); else tz = -(2 * s + 3 * c - 6 * n + at(i, j + 2)) / (6 * dz);
      out[o] = lap - u * tx - v * tz;
    }
  }
  /** One RK2 step of at most dtMax; returns the dt used. */
  S.step = (dtMax = 1) => {
    const umax = flow();
    const dt = Math.min(dtMax, 0.4 / umax, 0.2 * Math.min(dx * dx, dz * dz));
    rhs(T, K1);
    for (let o = 0; o < T.length; o++) T1[o] = T[o] + dt * K1[o];
    // second stage with the same velocity
    const K2 = new Float64Array(T.length); rhs(T1, K2);
    for (let o = 0; o < T.length; o++) T[o] += 0.5 * dt * (K1[o] + K2[o]);
    S.time += dt; S.steps++;
    return dt;
  };
  /** Run until model time `t` or until `ms` milliseconds have passed; returns true when t is reached. */
  S.advance = (t, ms = 1e9) => {
    const t0 = performance.now();
    while (S.time < t - 1e-12) { S.step(t - S.time); if (performance.now() - t0 > ms) break; }
    return S.time >= t - 1e-12;
  };
  /** Temperature at (x, z) by bilinear interpolation; x ∈ [0, L], z ∈ [0, 1]. */
  S.at = (x, z) => {
    const fi = Math.min(Math.max(x / dx - 0.5, 0), nx - 1.001), fj = z / dz - 0.5;
    const i = Math.floor(fi), a = fi - i;
    let j = Math.floor(fj), b = fj - j;
    const col = (jj) => (jj < 0 ? 2 - (T[i] * (1 - a) + T[i + 1] * a) : jj >= nz ? -(T[(nz - 1) * nx + i] * (1 - a) + T[(nz - 1) * nx + i + 1] * a) : T[jj * nx + i] * (1 - a) + T[jj * nx + i + 1] * a);
    return col(j) * (1 - b) + col(j + 1) * b;
  };
  /** Nusselt number: mean of the conductive flux at the bottom and top walls (equal when steady). */
  S.nu = () => {
    let top = 0, bot = 0;
    for (let i = 0; i < nx; i++) { top += T[(nz - 1) * nx + i] / (dz / 2); bot += (1 - T[i]) / (dz / 2); }
    return { top: top / nx, bottom: bot / nx, mean: (top + bot) / (2 * nx) };
  };
  S.wrms = () => { flow(); let s = 0; for (let o = 0; o < W.length; o++) s += W[o] * W[o]; return Math.sqrt(s / W.length); };
  S.reset();
  return S;
}
