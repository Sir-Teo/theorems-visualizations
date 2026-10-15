// Astronomy & Astrophysics — Chapter 10, landmark papers: Friedmann (1922), Hubble (1929), Penzias & Wilson (1965), Riess et al. (1998), Perlmutter et al. (1999).
//
// Data (verified):
// - Table 1 of Hubble (1929), PNAS 15: 168–173, read from the scanned paper: distance r (10⁶ pc) and measured
//   velocity v (km/s) of 24 nebulae, plus his solution K = +465 ± 50 (24 objects) and +513 ± 60 (9 groups) km/s per
//   10⁶ pc, apex A = 286°, D = +40°, V₀ = 306 km/s, and the cross at 745 km/s for 1.4 × 10⁶ pc (22 further nebulae).
// - Positions (J2000) and modern heliocentric velocities: SIMBAD (CDS), queried 2026-10.
// - Modern distances: Cosmicflows-3 (Tully, Courtois & Sorce 2016, AJ 152, 50) as listed in SIMBAD, except M51
//   (TRGB, 8.58 Mpc, McQuinn et al. 2016, ApJ 826, 21), NGC 4151 (Cepheids, 15.8 Mpc, Yuan et al. 2020, ApJ 902, 26)
//   and NGC 1068 (Tully–Fisher, 10.1 Mpc, Tully et al. 2008, ApJ 676, 184).
// - H₀ today: Planck 2018 VI (A&A 641, A6): 67.4 ± 0.5, age 13.797 ± 0.023 Gyr; SH0ES (Riess et al. 2022, ApJL 934,
//   L7): 73.04 ± 1.04; HST Key Project (Freedman et al. 2001, ApJ 553, 47): 72 ± 8. Baade's revision (h ≈ 2) and
//   Sandage 1958 (H ≈ 75): MacCallum (2015), arXiv:1504.03606.

const D2R = Math.PI / 180;
// name, r (Mpc, Hubble), v (km/s, Hubble), RA, Dec (deg J2000), group (0 stars involved/Cepheids, 1 brightest stars, 2 Virgo),
// modern distance (Mpc), modern heliocentric velocity (km/s), common name
const NEB = [
  ['SMC', 0.032, 170, 13.158, -72.800, 0, 0.06, 146, 'Small Magellanic Cloud'],
  ['LMC', 0.034, 290, 80.894, -69.756, 0, 0.05, 262, 'Large Magellanic Cloud'],
  ['NGC 6822', 0.214, -130, 296.234, -14.798, 0, 0.48, -57, 'Barnard’s Galaxy'],
  ['NGC 598', 0.263, -70, 23.462, 30.660, 0, 0.91, -179, 'M33'],
  ['NGC 221', 0.275, -185, 10.674, 40.865, 0, 0.78, -199, 'M32'],
  ['NGC 224', 0.275, -220, 10.685, 41.269, 0, 0.77, -300, 'M31, Andromeda'],
  ['NGC 5457', 0.45, 200, 210.802, 54.349, 0, 6.95, 243, 'M101'],
  ['NGC 4736', 0.5, 290, 192.721, 41.120, 1, 4.59, 287, 'M94'],
  ['NGC 5194', 0.5, 270, 202.470, 47.195, 1, 8.58, 523, 'M51'],
  ['NGC 4449', 0.63, 200, 187.046, 44.094, 1, 4.27, 204, ''],
  ['NGC 4214', 0.8, 300, 183.913, 36.327, 1, 2.94, 294, ''],
  ['NGC 3031', 0.9, -30, 148.888, 69.065, 1, 3.61, -47, 'M81'],
  ['NGC 3627', 0.9, 650, 170.063, 12.992, 1, 8.99, 724, 'M66'],
  ['NGC 4826', 0.9, 150, 194.182, 21.683, 1, 5.30, 438, 'M64'],
  ['NGC 5236', 0.9, 500, 204.254, -29.866, 1, 4.66, 519, 'M83'],
  ['NGC 1068', 1.0, 920, 40.670, -0.013, 1, 10.1, 1043, 'M77'],
  ['NGC 5055', 1.1, 450, 198.955, 42.029, 1, 8.99, 500, 'M63'],
  ['NGC 7331', 1.1, 500, 339.267, 34.416, 1, 14.06, 832, ''],
  ['NGC 4258', 1.4, 500, 184.740, 47.304, 1, 7.31, 507, 'M106'],
  ['NGC 4151', 1.7, 960, 182.636, 39.406, 1, 15.8, 944, ''],
  ['NGC 4382', 2.0, 500, 186.350, 18.191, 2, 15.85, 769, 'M85'],
  ['NGC 4472', 2.0, 850, 187.445, 8.000, 2, 16.07, 949, 'M49'],
  ['NGC 4486', 2.0, 800, 187.706, 12.391, 2, 16.52, 1256, 'M87'],
  ['NGC 4649', 2.0, 1090, 190.917, 11.553, 2, 17.38, 1015, 'M60'],
];
const GCOL = ['blue', 'orange', 'purple'];
const HT = 977.8; // 1/H in Gyr for H in km/s/Mpc
// H₀ through the years (verified values; Baade and Sandage from MacCallum 2015)
const HIST = [
  { y: 1929, H: 500, lo: 465, hi: 513, who: 'Hubble', pos: [8, 0, 'left'] },
  { y: 1952, H: 200, lo: 180, hi: 250, who: 'Baade', approx: true, pos: [8, 0, 'left'] },
  { y: 1958, H: 75, lo: 50, hi: 100, who: 'Sandage', pos: [-6, -12, 'right'] },
  { y: 2001, H: 72, lo: 64, hi: 80, who: 'HST Key Project', pos: [-6, -12, 'right'] },
  { y: 2018, H: 67.4, lo: 66.9, hi: 67.9, who: 'Planck', pos: [-4, 13, 'right'], color: 'teal' },
  { y: 2022, H: 73.04, lo: 72.0, hi: 74.08, who: 'SH0ES', pos: [0, -13, 'right'], color: 'red' },
];

/** Least squares v = rK (+ X cosα cosδ + Y sinα cosδ + Z sinδ) with the standard error of K. */
function hubbleFit(M, rows, solar) {
  const A = rows.map((q) => (solar ? [q.r, Math.cos(q.a) * Math.cos(q.d), Math.sin(q.a) * Math.cos(q.d), Math.sin(q.d)] : [q.r]));
  const b = rows.map((q) => q.v);
  const p = A[0].length, n = A.length;
  const N = M.matMul(M.transpose(A), A), x = M.solve(N, M.matVec(M.transpose(A), b));
  const res = b.map((y, i) => y - M.dot(A[i], x)), rss = res.reduce((s, e) => s + e * e, 0);
  const Ni = M.inverse(N), se = Math.sqrt((rss / (n - p)) * Ni[0][0]);
  const sun = (q) => (solar ? x[1] * Math.cos(q.a) * Math.cos(q.d) + x[2] * Math.sin(q.a) * Math.cos(q.d) + x[3] * Math.sin(q.d) : 0);
  let apex = null;
  if (solar) { const V = Math.hypot(x[1], x[2], x[3]); apex = { V, A: ((Math.atan2(-x[2], -x[1]) / D2R) + 360) % 360, D: Math.asin(-x[3] / V) / D2R }; }
  return { K: x[0], se, sun, apex, meanRes: res.reduce((s, e) => s + Math.abs(e), 0) / n };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// Friedmann (1922), Penzias & Wilson (1965), Riess et al. (1998), Perlmutter et al. (1999).
//
// Data (verified):
// - Friedmann (1922), Z. Phys. 10: 377–386, read in the Russian reprint (Usp. Fiz. Nauk 93: 280–287, 1967, ufn.ru): dust,
//   closed space of radius R(t); A − x + (λ/3c²)x³ = 0 and its family of cubics (his only figure), maximum at
//   x = 3A/2, λ/3c² = 4/27A²; λ > 4c²/9A²: "monotonic world of the first kind" (R grows from 0); 0 < λ < 4c²/9A² and
//   R₀ > x₀′: "monotonic world of the second kind" (R grows from x₀′); λ < 4c²/9A² and R₀ < x₀: the "periodic world",
//   0 ≤ R ≤ x₀, period t_π ≈ πA/c for small λ; κ = 1.87·10⁻²⁷ CGS; "Setting λ = 0 and M = 5·10²¹ suns, we obtain for
//   the world period a value of the order of 10 billion years"; dated Petrograd, 29 May 1922. A = κM/6π² (M = 2π²R³ρ).
//   Belenkiy (2013, arXiv:1302.1498 §3) recomputes πA/c ≈ 1 billion years and "cannot repeat this result".
// - Penzias & Wilson (1965), ApJ 142: 419–421 (ADS scan): total zenith antenna temperature 6.7 K (±0.3 K), atmosphere
//   2.3 ± 0.3 K by the secant law, ohmic losses 0.8 ± 0.4 K, back lobe < 0.1 K, remainder 3.5 ± 1.0 K at 4080 Mc/s,
//   isotropic, unpolarized, no seasonal change July 1964 – April 1965; note in proof: 16 K minimum at 404 Mc/s
//   (Pauliny-Toth & Shakeshaft 1962). COBE FIRAS monopole: Fixsen et al. (1996) ApJ 473, 576, Table 4, via NASA LAMBDA
//   (firas_monopole_spec_v1.txt: 43 frequencies, 2.725 K blackbody + residual, 1σ); today T₀ = 2.72548 ± 0.00057 K
//   (Fixsen 2009, ApJ 707, 916).
// - Riess et al. (1998), AJ 116: 1009, arXiv:astro-ph/9805201 source tables: Table 5 (MLCS) and 6 (template) for 10
//   high-z SNe, Table 7 (6 snapshot SNe incl. 1997ap, 1997I), Table 10 (27 nearby, both methods), Table 9 (7 nearby
//   snapshots); redshifts from SN features (Table 1: 1995ap, 1996I, 1996K, 1997ce) get 2500 km/s added; σ_v = 200 km/s;
//   §4 eq. 2–4; H₀ = 65.2 ± 1.3 (MLCS), 63.8 ± 1.3 (template); Fig. 4: mean residual from (0.2, 0) of 0.25 mag; flat
//   Ω_M = 0.28 ± 0.10 (MLCS+snap), 0.24 with 97ck; P(Ω_Λ ≥ 0) 99.7% (3.0σ) MLCS, >99.9% (4.0σ) template.
// - Perlmutter et al. (1999), ApJ 517: 565, arXiv:astro-ph/9812133 source: Table 1 (42 SCP SNe: z, m_B^eff, σ, fits
//   excluded) and Table 2 (18 Calán/Tololo SNe); Table 3 Fit C (54 SNe): Ω_M^flat = 0.28 (+0.09 −0.08), best fit
//   (0.73, 1.32), P(Ω_Λ > 0) = 0.9979; Fit A (60): 0.29, (0.83, 1.42), 0.9984; abstract: 0.8Ω_M − 0.6Ω_Λ ≈ −0.2 ± 0.1.
//   Recomputed here with 𝓜 fitted analytically: Fit C flat 0.283 (+0.090 −0.078), P = 0.998, valley −0.21.
// - Today: Planck 2018 VI (A&A 641, A6) Ω_m = 0.315 ± 0.007, Ω_Λ = 0.685 ± 0.007, age 13.797 Gyr; Pantheon+ (Brout et
//   al. 2022, ApJ 938, 110) flat Ω_M = 0.334 ± 0.018.

const MSUN_G = 1.989e33, C_CM = 2.998e10, YR_S = 3.156e7, LY_CM = 9.461e17;
const A_FRIED = (1.87e-27 * 5e21 * MSUN_G) / (6 * Math.PI ** 2); // cm: A = κM/6π² for Friedmann's M = 5·10²¹ suns
const GYR_PER_A = A_FRIED / C_CM / YR_S / 1e9; // Gyr per unit A/c (A for M = 5·10²¹ suns)
const GLY_PER_A = A_FRIED / LY_CM / 1e9; // Gly per unit A

/** Friedmann's dust world, units A = 1, c = 1: Ṙ² = A/R − k + yR² (y = λ/3c²), integrated as R̈ = −A/2R² + yR from R₀
 *  (expanding now) forwards and backwards; returns the curve and the times of R = 0 (creation, end) if reached. */
function friedmannWorld(k, A, y, R0, tSpan = 40, Rcap = 7) {
  const f0 = A / R0 - k + y * R0 * R0;
  if (f0 < -1e-9) return null;
  const acc = (R) => -A / (2 * R * R) + y * R;
  const run = (dir) => {
    let t = 0, R = R0, V = Math.sqrt(Math.max(0, f0)), hit = null, turn = null;
    const pts = [[0, R0]];
    for (let i = 0; i < 30000; i++) {
      const h = dir * Math.min(0.02, 0.01 * Math.pow(Math.max(R, 1e-6), 1.5) / Math.sqrt(A) + 1e-4);
      const k1R = V, k1V = acc(R), k2R = V + 0.5 * h * k1V, k2V = acc(R + 0.5 * h * k1R);
      const k3R = V + 0.5 * h * k2V, k3V = acc(R + 0.5 * h * k2R), k4R = V + h * k3V, k4V = acc(R + h * k3R);
      const Rn = R + (h / 6) * (k1R + 2 * k2R + 2 * k3R + k4R), Vn = V + (h / 6) * (k1V + 2 * k2V + 2 * k3V + k4V);
      if (!(Rn > 2e-3 * A) || !isFinite(Vn)) { hit = t + h * Math.max(0, R / Math.max(R - Rn, 1e-12)) * 0.5; pts.push([hit, 0]); break; }
      if (turn == null && Math.sign(Vn) !== Math.sign(V) && V !== 0) turn = [t + h, Rn];
      t += h; R = Rn; V = Vn; pts.push([t, R]);
      if (Math.abs(t) > tSpan || R > Rcap * A) break;
    }
    return { pts, hit, turn };
  };
  const fw = run(1), bw = run(-1);
  return { pts: bw.pts.reverse().concat(fw.pts.slice(1)), tBegin: bw.hit, tEnd: fw.hit, turnPast: bw.turn, turnFuture: fw.turn };
}
/** Positive roots x₀ ≤ 3A/2 ≤ x₀′ of A − x + yx³ = 0 (closed space). */
function friedmannRoots(A, y) {
  const g = (x) => A - x + y * x ** 3, bis = (a, b) => { for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (Math.sign(g(m)) === Math.sign(g(a))) a = m; else b = m; } return (a + b) / 2; };
  const xm = 1.5 * A, out = [];
  if (g(xm) > 0) return out; // λ above Einstein's value: no positive root
  out.push(bis(0, xm));
  if (y > 0) { let b = 2 * xm; while (g(b) < 0 && b < 1e6) b *= 2; out.push(bis(xm, b)); }
  return out;
}

const C_KMS = 299792.458;
/** Luminosity distance in units c/H₀ for (Ω_M, Ω_Λ), tabulated on a z grid by Simpson steps (NaN if E² < 0 on the way). */
function lumDist(om, ol, zmax, dz = 0.005) {
  const n = Math.ceil(zmax / dz) + 1, I = new Float64Array(n + 1);
  const E = (x) => { const q = (1 + x) ** 2 * (1 + om * x) - x * (2 + x) * ol; return q > 0 ? 1 / Math.sqrt(q) : NaN; };
  let prev = E(0);
  for (let i = 1; i <= n; i++) { const b = i * dz, e = E(b); I[i] = I[i - 1] + (dz / 6) * (prev + 4 * E(b - dz / 2) + e); prev = e; }
  const ok = 1 - om - ol, sk = Math.sqrt(Math.abs(ok));
  return (z) => {
    const f = z / dz, i = Math.min(n - 1, Math.floor(f)), u = f - i, Iz = I[i] * (1 - u) + I[i + 1] * u;
    if (!isFinite(Iz)) return NaN;
    const r = sk < 1e-6 ? Iz : ok > 0 ? Math.sinh(sk * Iz) / sk : Math.sin(sk * Iz) / sk;
    return r > 0 ? (1 + z) * r : NaN;
  };
}
/** No big bang (a bounce in the past): E²(a) = Ω_M/a³ + Ω_k/a² + Ω_Λ reaches zero for some 0 < a ≤ 1. */
const noBigBang = (om, ol) => { for (let k = 1; k <= 300; k++) { const a = k / 300; if (om / a ** 3 + (1 - om - ol) / a ** 2 + ol <= 0) return true; } return false; };
/** H₀t₀ by quadrature over a (needs a big bang). */
function ageH0(om, ol) { let s = 0; const n = 400; for (let i = 0; i < n; i++) { const a = (i + 0.5) / n, q = om / a + (1 - om - ol) + ol * a * a; if (q <= 0) return NaN; s += 1 / Math.sqrt(q) / n; } return s; }

// Riess et al. 1998. nearby: name, log cz, μ MLCS, σ, μ template, σ (Table 10; the 7 snapshots of Table 9 last)
const RIESS_NEAR = [['1992bo', 3.734, 34.72, 0.16, 34.88, 0.21], ['1992bc', 3.779, 34.87, 0.11, 34.77, 0.15], ['1992aq', 4.481, 38.41, 0.15, 38.33, 0.23], ['1992ae', 4.350, 37.80, 0.17, 37.77, 0.19], ['1992P', 3.896, 35.76, 0.13, 35.59, 0.16], ['1990af', 4.178, 36.53, 0.15, 36.67, 0.25], ['1994M', 3.859, 35.39, 0.18, 35.49, 0.20], ['1994S', 3.685, 34.27, 0.12, 34.34, 0.14], ['1994T', 4.030, 36.19, 0.21, 36.50, 0.20], ['1995D', 3.398, 33.01, 0.13, 32.79, 0.16], ['1995E', 3.547, 33.60, 0.17, 33.73, 0.17], ['1995ac', 4.166, 36.85, 0.13, 36.60, 0.16], ['1995ak', 3.820, 35.15, 0.16, 35.43, 0.18], ['1995bd', 3.679, 34.15, 0.19, 34.00, 0.18], ['1996C', 3.924, 35.98, 0.20, 35.82, 0.20], ['1996ab', 4.572, 39.01, 0.13, 39.10, 0.17], ['1992ag', 3.891, 35.37, 0.23, 35.53, 0.20], ['1992al', 3.625, 33.92, 0.11, 34.13, 0.14], ['1992bg', 4.024, 36.26, 0.21, 36.49, 0.21], ['1992bh', 4.130, 36.91, 0.17, 36.87, 0.17], ['1992bl', 4.111, 36.26, 0.15, 36.53, 0.20], ['1992bp', 4.379, 37.65, 0.13, 37.96, 0.15], ['1992br', 4.418, 38.21, 0.19, 38.09, 0.36], ['1992bs', 4.283, 37.61, 0.14, 37.63, 0.18], ['1993H', 3.871, 35.20, 0.26, 35.23, 0.25], ['1993O', 4.189, 37.03, 0.12, 37.31, 0.14], ['1993ag', 4.177, 36.80, 0.17, 37.11, 0.19], ['1994U', 3.111, 31.72, 0.10, 31.72, 0.10], ['1997bp', 3.363, 32.81, 0.10, 32.81, 0.10], ['1996V', 3.870, 35.35, 0.17, 35.35, 0.17], ['1994C', 4.189, 36.72, 0.15, 36.72, 0.15], ['1995M', 4.202, 37.12, 0.15, 37.12, 0.15], ['1995ae', 4.308, 37.58, 0.21, 37.58, 0.21], ['1994B', 4.431, 38.51, 0.10, 38.51, 0.10]];
// high z: name, z, μ MLCS, σ, μ template, σ (Tables 5–6; the 6 snapshots of Table 7 last, same μ in both)
const RIESS_HI = [['1996E', 0.43, 41.74, 0.28, 42.03, 0.22], ['1996H', 0.62, 42.98, 0.17, 43.01, 0.15], ['1996I', 0.57, 42.76, 0.19, 42.83, 0.21], ['1996J', 0.30, 41.38, 0.24, 40.99, 0.25], ['1996K', 0.38, 41.63, 0.20, 42.21, 0.18], ['1996U', 0.43, 42.55, 0.25, 42.34, 0.17], ['1997ce', 0.44, 41.95, 0.17, 42.26, 0.16], ['1997cj', 0.50, 42.40, 0.17, 42.70, 0.16], ['1997ck', 0.97, 44.39, 0.30, 44.30, 0.19], ['1995K', 0.48, 42.45, 0.17, 42.49, 0.17], ['1995ao', 0.30, 40.74, 0.60, 40.74, 0.60], ['1995ap', 0.23, 40.33, 0.46, 40.33, 0.46], ['1996R', 0.16, 39.08, 0.40, 39.08, 0.40], ['1996T', 0.24, 40.68, 0.43, 40.68, 0.43], ['1997I', 0.17, 39.95, 0.24, 39.95, 0.24], ['1997ap', 0.83, 43.67, 0.35, 43.67, 0.35]];
const RIESS_SNFEAT = new Set(['1995ap', '1996I', '1996K', '1997ce']); // redshift from broad SN features: +2500 km/s

// Perlmutter et al. 1999, Tables 1–2: name, z, m_B^eff, σ, fits that exclude it ('' = none)
const SCP42 = [['1992bi', 0.458, 23.11, 0.46, 'E-H'], ['1994F', 0.354, 22.38, 0.33, 'E-H'], ['1994G', 0.425, 22.13, 0.49, ''], ['1994H', 0.374, 21.72, 0.22, 'B-L'], ['1994al', 0.420, 22.55, 0.25, 'E-H'], ['1994am', 0.372, 22.26, 0.20, 'E-H'], ['1994an', 0.378, 22.58, 0.37, 'E-H'], ['1995aq', 0.453, 23.17, 0.25, ''], ['1995ar', 0.465, 23.33, 0.30, 'H'], ['1995as', 0.498, 23.71, 0.25, 'H'], ['1995at', 0.655, 23.27, 0.21, 'H'], ['1995aw', 0.400, 22.36, 0.19, ''], ['1995ax', 0.615, 23.19, 0.25, ''], ['1995ay', 0.480, 22.96, 0.24, ''], ['1995az', 0.450, 22.51, 0.23, ''], ['1995ba', 0.388, 22.65, 0.20, ''], ['1996cf', 0.570, 23.27, 0.22, ''], ['1996cg', 0.490, 23.10, 0.20, 'C,D,G-L'], ['1996ci', 0.495, 22.83, 0.19, ''], ['1996ck', 0.656, 23.57, 0.28, ''], ['1996cl', 0.828, 24.65, 0.54, ''], ['1996cm', 0.450, 23.17, 0.23, ''], ['1996cn', 0.430, 23.13, 0.22, 'C,D,G-L'], ['1997F', 0.580, 23.46, 0.23, 'H'], ['1997G', 0.763, 24.47, 0.53, ''], ['1997H', 0.526, 23.15, 0.20, 'H'], ['1997I', 0.172, 20.17, 0.18, ''], ['1997J', 0.619, 23.80, 0.28, ''], ['1997K', 0.592, 24.42, 0.37, 'H'], ['1997L', 0.550, 23.51, 0.25, ''], ['1997N', 0.180, 20.43, 0.17, 'H'], ['1997O', 0.374, 23.52, 0.24, 'B-L'], ['1997P', 0.472, 23.11, 0.19, ''], ['1997Q', 0.430, 22.57, 0.18, ''], ['1997R', 0.657, 23.83, 0.23, ''], ['1997S', 0.612, 23.69, 0.21, ''], ['1997ac', 0.320, 21.86, 0.18, ''], ['1997af', 0.579, 23.48, 0.22, ''], ['1997ai', 0.450, 22.83, 0.30, 'H'], ['1997aj', 0.581, 23.09, 0.22, ''], ['1997am', 0.416, 22.57, 0.20, ''], ['1997ap', 0.830, 24.32, 0.22, 'H']];
const CALAN18 = [['1990O', 0.030, 16.26, 0.20, ''], ['1990af', 0.050, 17.63, 0.18, ''], ['1992P', 0.026, 16.08, 0.24, ''], ['1992ae', 0.075, 18.43, 0.20, ''], ['1992ag', 0.026, 16.28, 0.20, ''], ['1992al', 0.014, 14.47, 0.23, ''], ['1992aq', 0.101, 19.16, 0.23, ''], ['1992bc', 0.020, 15.18, 0.20, ''], ['1992bg', 0.036, 16.66, 0.21, ''], ['1992bh', 0.045, 17.61, 0.19, ''], ['1992bl', 0.043, 17.19, 0.18, ''], ['1992bo', 0.018, 15.61, 0.21, 'B-L'], ['1992bp', 0.079, 18.27, 0.18, ''], ['1992br', 0.088, 19.28, 0.18, 'B-L'], ['1992bs', 0.063, 18.24, 0.18, ''], ['1993B', 0.071, 18.33, 0.20, ''], ['1993O', 0.052, 17.54, 0.18, ''], ['1993ag', 0.050, 17.69, 0.20, '']];
const inPerlFit = (ex, f) => !ex || ex.split(',').every((p) => (p.includes('-') ? !(f >= p[0] && f <= p[2]) : p !== f));

// COBE FIRAS monopole (Fixsen et al. 1996, Table 4, via LAMBDA): frequency (cm⁻¹), intensity (MJy/sr), 1σ (kJy/sr)
const FIRAS = [2.27, 200.723, 14, 2.72, 249.508, 19, 3.18, 293.024, 25, 3.63, 327.770, 23, 4.08, 354.081, 22, 4.54, 372.079, 21, 4.99, 381.493, 18, 5.45, 383.478, 18, 5.90, 378.901, 16, 6.35, 368.833, 14, 6.81, 354.063, 13, 7.26, 336.278, 12, 7.71, 316.076, 11, 8.17, 293.924, 10, 8.62, 271.432, 11, 9.08, 248.239, 12, 9.53, 225.940, 14, 9.98, 204.327, 16, 10.44, 183.262, 18, 10.89, 163.830, 22, 11.34, 145.750, 22, 11.80, 128.835, 23, 12.25, 113.568, 23, 12.71, 99.451, 23, 13.16, 87.036, 22, 13.61, 75.876, 21, 14.07, 65.766, 20, 14.52, 57.008, 19, 14.97, 49.223, 19, 15.43, 42.267, 19, 15.88, 36.352, 21, 16.34, 31.062, 23, 16.79, 26.580, 26, 17.24, 22.644, 28, 17.70, 19.255, 30, 18.15, 16.391, 32, 18.61, 13.811, 33, 19.06, 11.716, 35, 19.51, 9.921, 41, 19.97, 8.364, 55, 20.42, 7.087, 88, 20.87, 5.801, 155, 21.33, 4.523, 282];
const H_PL = 6.62607015e-34, K_B = 1.380649e-23, C_MS = 2.99792458e8;
/** Planck intensity in MJy/sr at ν GHz, temperature T K. */
const planckI = (nu, T) => (2 * H_PL * (nu * 1e9) ** 3 / C_MS ** 2) / Math.expm1((H_PL * nu * 1e9) / (K_B * T)) * 1e20;
/** Rayleigh–Jeans brightness temperature (K) of intensity I (MJy/sr) at ν GHz — the antenna temperature scale. */
const rjTemp = (I, nu) => (I * 1e-20 * C_MS ** 2) / (2 * K_B * (nu * 1e9) ** 2);

export default {
  collection: 'astro',
  chapter: 10,
  items: [
    // ───────────────────────────────────────────────────────────── 10.19
    {
      num: '10.19',
      kind: 'Paper',
      name: 'Relation between distance and radial velocity of nebulae',
      paper: { authors: 'Edwin Hubble', year: 1929, title: 'A Relation between Distance and Radial Velocity among Extra-Galactic Nebulae', venue: 'Proceedings of the National Academy of Sciences 15 (3): 168–173', doi: '10.1073/pnas.15.3.168' },
      introduces: ['astro-10.2'],
      statement: String.raw`Using the 24 galaxies whose distances he could estimate (Cepheids and other resolved stars for the nearest, the brightest stars for thirteen more, the mean brightness of the Virgo cluster for the last four), Hubble showed that their radial velocities grow **linearly with distance**,
$$v = K\,r ,$$
when the Sun's own motion is solved for at the same time: $K = 465 \pm 50$ km/s per megaparsec from the 24 nebulae and $513 \pm 60$ from nine groups, "round numbers" $K \approx 500$. Twenty-two more nebulae with velocities but no individual distances fell on the same line.

In modern terms this is the Hubble–Lemaître law $v = H_0 d$ (astro-10.2), the signature of a uniformly expanding universe. It holds for redshifts $z \ll 1$ and distances large enough that the expansion dominates the galaxies' peculiar motions of a few hundred km/s. Hubble's sample sits right at that edge (his largest velocity is 1,090 km/s), and his distances were too short by a factor of about seven, so his $K$ was about seven times today's $H_0 \approx 67$–$73$ km/s/Mpc.`,
      idea: String.raw`By 1929 Slipher had measured the Doppler shifts (waves-1.14) of dozens of spiral nebulae and found most of them receding, and Hubble's own Cepheids in M31, M33 and NGC 6822 (via Leavitt's period–luminosity law, astro-7.13, astro-7.15) had shown in 1925 that the nebulae are galaxies far outside our own. Lemaître (1927) had already derived a linear velocity–distance relation from an expanding relativistic universe and estimated its slope, in a Belgian journal that few read. Hubble's paper supplied what was missing: distances, estimated rung by rung from distance moduli (astro-4.3) of Cepheids, then of brightest stars, then of whole galaxies, and a fit that puts the distances into the solar-motion equations as coefficients of the old "$K$ term". The relation became the observational foundation of cosmology. Its slope did not survive: Baade (1952) found that the Cepheid zero point was wrong (two stellar populations), roughly doubling all distances, and Sandage (1958) found that many of Hubble's "brightest stars" were glowing gas clouds, bringing $H_0$ down to about 75. The IAU has recommended calling it the Hubble–Lemaître law since 2018.`,
      caption: String.raw`**Left**: Hubble's own 24 nebulae (his Table 1; colours: distance from resolved stars and Cepheids, from brightest stars, Virgo cluster), velocities corrected for the solar motion fitted at the same time, as in his Figure 1; the cross is his mean for 22 further nebulae. **Hover** a point for its name. Drag the **Cepheid zero point** (Baade 1952) and the **brightest-star** correction (Sandage 1958) to stretch the distance ladder and watch $K$ fall; the presets set them. **Today** replaces every distance and velocity by a modern value (Cosmicflows-3, TRGB and Cepheid distances; SIMBAD velocities): the same 24 galaxies then give $H_0 \approx 68$. Switch off the **solar-motion** term to fit a bare line through the origin. **Right**: $H_0$ through the century on a log scale, with your current fit in gold and the Hubble time $1/H_0$.`,
      deps: ['astro-7.13', 'astro-4.3', 'waves-1.14', 'astro-7.15'],
      refs: [],
      tags: ['cosmology', 'history', 'Hubble'],
      credit: 'Edwin Hubble, 1929',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hubble%27s_law' },
      viz(v) {
        const M = v.M;
        const mode = v.select('distances', [{ value: 'hubble', label: 'Hubble 1929' }, { value: 'baade', label: 'Baade 1952' }, { value: 'sandage', label: 'Sandage 1958' }, { value: 'today', label: 'today' }], 'hubble', {
          onChange: (m) => { if (m === 'hubble') { f1.set(1); f2.set(1); } else if (m === 'baade') { f1.set(2); f2.set(1); } else if (m === 'sandage') { f1.set(2); f2.set(sandageF2()); } syncCtl(); },
        });
        const f1 = v.slider('Cepheid zero point: all ×', 1, 3, 1, { step: 0.01 });
        const f2 = v.slider('brightest “stars” → H II regions ×', 1, 5, 1, { step: 0.01 });
        const solar = v.toggle('fit the solar motion (as Hubble did)', true);
        const syncCtl = () => { const t = mode.value === 'today'; f1.el.hidden = t; f2.el.hidden = t; };
        const s = v.stage({ x: [0, 2.3], y: [-450, 1300], height: 360, axes: 'box', weight: 1.45, hover: true, xlabel: 'distance (Mpc)', ylabel: 'velocity (km/s)', title: 'velocity against distance' });
        const g = v.stage({ x: [1908, 2032], y: [40, 900], ylog: true, height: 360, axes: 'box', weight: 0.85, minWidth: 240, xlabel: 'year', ylabel: 'H₀ (km/s/Mpc)', yticks: [50, 70, 100, 200, 500], xticks: [1930, 1960, 1990, 2020], title: 'the fall of H₀' });
        const rowsFor = (m, a, b) => NEB.map((q) => {
          const today = m === 'today';
          return { name: q[0], alias: q[8], g: q[5], a: q[3] * D2R, d: q[4] * D2R, r: today ? q[6] : q[1] * a * (q[5] > 0 ? b : 1), v: today ? q[7] : q[2] };
        });
        function sandageF2() { // brightest-star factor that, with Baade's ×2, gives Sandage's H ≈ 75
          let lo = 1, hi = 6; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (hubbleFit(M, rowsFor('x', 2, m), solar.value).K > 75) lo = m; else hi = m; } return (lo + hi) / 2;
        }
        let st = null;
        v.render(() => {
          const m = mode.value, today = m === 'today', rows = rowsFor(m, f1.value, f2.value), F = hubbleFit(M, rows, solar.value);
          const xmax = Math.max(...rows.map((q) => q.r)) * 1.12;
          s.setView([0, xmax], [-450, today ? 1500 : 1300]);
          s.hline(0, { color: 'faint', width: 1 });
          // reference slopes: Hubble's K = 500, Planck and SH0ES
          if (!today && (f1.value !== 1 || f2.value !== 1)) { s.fn((r) => 500 * r, { color: 'muted', width: 1.2, dash: [3, 4] }); s.text('Hubble’s K = 500', 1180 / 500, 1180, { color: 'muted', size: 11, weight: 600, align: 'left', dx: 6 }); }
          s.fn((r) => 67.4 * r, { color: 'teal', width: 1.4, dash: [7, 5] });
          s.fn((r) => 73.04 * r, { color: 'red', width: 1.4, dash: [7, 5] });
          s.fn((r) => F.K * r, { color: 'green', width: 2.8 });
          if (!today) { const rc = 1.4 * f1.value * f2.value, vc = 745; s.line(rc - 0.03 * xmax, vc, rc + 0.03 * xmax, vc, { color: 'ink', width: 2 }); s.line(rc, vc - 60, rc, vc + 60, { color: 'ink', width: 2 }); }
          for (const q of rows) s.dot(q.r, q.v - F.sun(q), { r: 5, color: GCOL[q.g] });
          // labels on the reference lines, at the right edge
          const lab = (k, txt, col, dy, fx = 0.97) => { const x = Math.min(xmax * fx, 1400 / k); s.text(txt, x, k * x, { color: col, size: 11.5, weight: 700, align: 'right', dy, dx: -4 }); };
          s.corner(`fit: K = ${Math.round(F.K)} km/s/Mpc`, 'tl', { color: 'green', weight: 700, size: 12.5, dx: 72, dy: 26 });
          if (today) { lab(67.4, 'Planck 67.4', 'teal', 14); lab(73.04, 'SH0ES 73.0', 'red', -12); }
          else lab(67.4, 'Planck, SH0ES', 'muted', 14);
          // hover: name of the nearest galaxy
          const P = s.pointer;
          if (P.inside) {
            let best = null, bd = 1e9;
            for (const q of rows) { const dx = (s.X(q.r) - s.X(P.x)), dy = (s.Y(q.v - F.sun(q)) - s.Y(P.y)), dd = Math.hypot(dx, dy); if (dd < bd) { bd = dd; best = q; } }
            if (best && bd < 22) { const y = best.v - F.sun(best); s.dot(best.r, y, { r: 8, hollow: true, color: 'ink', width: 2 }); s.text(`${best.name}${best.alias ? ` (${best.alias})` : ''}: ${v.fix(best.r, best.r < 1 ? 3 : 2)} Mpc, ${Math.round(best.v)} km/s`, best.r, y, { dx: best.r > 0.55 * xmax ? -12 : 12, dy: -14, align: best.r > 0.55 * xmax ? 'right' : 'left', size: 12, weight: 600 }); }
          }
          // ---- history panel
          g.hband(66.9, 74.08, { color: 'green', alpha: 0.08 });
          for (const h of HIST) {
            g.line(h.y, h.lo, h.y, h.hi, { color: 'ink', width: 1.6, alpha: 0.7 });
            g.dot(h.y, h.H, { r: 5, color: h.color || 'ink', hollow: !!h.approx });
            g.text(h.who, h.y, h.H, { dx: h.pos[0], dy: h.pos[1], align: h.pos[2], size: 11.5, color: h.color || 'muted', weight: 600 });
          }
          g.hline(F.K, { color: 'gold', width: 2.2 });
          g.corner(`your fit ${Math.round(F.K)} → 1/H₀ = ${v.fix(HT / F.K, 1)} Gyr`, 'tr', { color: 'gold', size: 11.5, weight: 700 });
          st = { F, rows, m, today };
        });
        v.legend([['blue', 'Cepheids / resolved stars', { dot: true }], ['orange', 'brightest stars', { dot: true }], ['purple', 'Virgo cluster', { dot: true }], ['green', 'least-squares fit through the origin'], ['teal', 'Planck 2018', { dash: true }], ['red', 'SH0ES 2022', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { F, today } = st, K = F.K;
          const ap = F.apex ? ` · solar motion ${Math.round(F.apex.V)} km/s toward RA ${Math.round(F.apex.A)}°, Dec ${F.apex.D >= 0 ? '+' : '−'}${Math.abs(Math.round(F.apex.D))}°` : ' · no solar-motion term';
          const head = `$K = ${Math.round(K)} \\pm ${Math.round(F.se)}$ km/s/Mpc from 24 galaxies${ap}, mean residual ${Math.round(F.meanRes)} km/s`;
          const hub = mode.value === 'hubble' && solar.value ? ' (Hubble: 465 ± 50, apex 286°, +40°, 306 km/s; residuals about 150 km/s)' : '';
          const age = ` · Hubble time $1/K$ = **${v.fix(HT / K, 2)} Gyr**`;
          const cmp = today
            ? ` — Planck 2018: 67.4 ± 0.5 (1/H₀ = 14.5 Gyr; ΛCDM age 13.80 ± 0.02 Gyr), SH0ES 2022: 73.04 ± 1.04 (13.4 Gyr): 24 nearby galaxies, whose peculiar motions are a large part of their velocities, already land within their own scatter (±${Math.round(F.se)}) of both values, and the 6 km/s/Mpc “Hubble tension” between them is far below what such a sample can resolve`
            : K > 150 ? ` — younger than the 4.5-billion-year-old Earth, an embarrassment for decades · today: Planck 67.4 ± 0.5, SH0ES 73.04 ± 1.04 km/s/Mpc, ${v.fix(K / 70, 1)}× smaller than this fit` : ` — today: Planck 67.4 ± 0.5 (13.8 Gyr), SH0ES 73.04 ± 1.04 km/s/Mpc`;
          return head + hub + age + cmp;
        });
        syncCtl();
      },
    },
    // ───────────────────────────────────────────────────────────── 10.18
    {
      num: '10.18',
      kind: 'Paper',
      name: 'Über die Krümmung des Raumes',
      paper: { authors: 'A. Friedman', year: 1922, title: 'Über die Krümmung des Raumes', venue: 'Zeitschrift für Physik 10: 377–386', doi: '10.1007/BF01332580' },
      introduces: ['astro-10.7'],
      statement: String.raw`Friedmann showed that Einstein's field equations with the cosmological term, for a universe uniformly filled with pressureless matter, admit a whole family of **non-static** solutions in which space has constant positive curvature but a radius $R(t)$ that changes with time. In his notation the radius obeys
$$\Big(\frac{dR}{dt}\Big)^2=c^2\,\frac{A-R+\frac{\lambda}{3c^2}R^3}{R},\qquad A=\frac{\kappa M}{6\pi^2},$$
where $M$ is the total mass of the closed space. Which world results depends on $\lambda$ compared with $\lambda_E=4c^2/9A^2$:
(a) $\lambda>\lambda_E$: the **monotonic world of the first kind**, growing from $R=0$ for ever;
(b) $0<\lambda<\lambda_E$ and $R$ above the larger root $x_0'$: the **monotonic world of the second kind**, growing from $R=x_0'$;
(c) $\lambda<\lambda_E$ (zero or negative included) and $R$ below the smaller root $x_0$: the **periodic world**, which grows from a point and shrinks back, with period close to $\pi A/c$ for small $\lambda$;
and Einstein's static world ($\lambda=\lambda_E$, $R=3A/2$) is the single balanced point between them.

This is the Friedmann equation (astro-10.7) for closed space; the negatively curved case followed in 1924. The paper assumes homogeneity, dust, and time orthogonal to space, and Friedmann himself stressed that the data could not say which world is ours.`,
      idea: String.raw`Einstein (1917) had added the cosmological constant to obtain a static, closed universe; de Sitter found an empty alternative. Both were assumed to be the only possibilities. Friedmann, a meteorologist and mathematician in Petrograd, simply let the radius depend on time in the metric of a 3-sphere (astro-10.3) and solved the field equations (rel-8.4, rel-8.7, rel-8.12): the time-time and space-space components give two equations whose first integral is the energy-like equation above, an elliptic integral in $R$. His one figure, the family of cubics $A-x+\frac{\lambda}{3c^2}x^3=0$, sorts every case by where the line of constant $\lambda$ cuts the curve. Einstein first replied that the solution was wrong, then in 1923 withdrew: his objection "was based on an error in my calculations". The work introduced the expanding (and recollapsing) universe (astro-10.7) years before Lemaître and Hubble; Friedmann died in 1925 and it was little read until Robertson and Walker rebuilt it in the 1930s. His closing illustration, a world period "of the order of 10 billion years" for $\lambda=0$ and a mass of $5\cdot10^{21}$ suns, does not follow from his own formula, which gives about 1 billion.`,
      caption: String.raw`**Left**: Friedmann's figure, redrawn for one mass: the curve $A-x+\frac{\lambda}{3c^2}x^3=0$ with $x=R/A$ across and $\lambda/\lambda_E$ up. Below it (red) no world can pass; the horizontal line through your point cuts it at his $x_0$ and $x_0'$. **Drag the gold point** to choose the radius now and $\lambda$; the presets jump to his three kinds of world and to Einstein's static one, the top of the curve. **Right**: the world $R(t)$ through that point, integrated from Friedmann's equation in real units (radius in billions of light years, time in billions of years) for the chosen **world mass**; the dashed line is the same world without $\lambda$, the dotted line Einstein's static radius. Switch to **flat** or **open** space (the 1924 sequel) and the cubic changes: only a negative $\lambda$ can then stop the expansion.`,
      deps: ['rel-8.4', 'rel-8.7', 'astro-10.3', 'rel-8.12'],
      refs: [],
      tags: ['cosmology', 'general relativity', 'history'],
      credit: 'Alexander Friedmann, 1922',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Friedmann_equations' },
      viz(v) {
        const kSel = v.select('space', [{ value: '1', label: 'closed (1922)' }, { value: '0', label: 'flat' }, { value: '-1', label: 'open (1924)' }], '1', { onChange: () => snap() });
        const preset = v.select('preset', [{ value: 'per', label: 'periodic' }, { value: 'm1', label: 'monotonic I' }, { value: 'm2', label: 'monotonic II' }, { value: 'E', label: 'Einstein static' }], 'per', {
          onChange: (p) => { kSel.set('1'); const P = { per: [0.75, 0], m1: [0.9, 1.6], m2: [3.7, 0.55], E: [1.5, 1] }[p]; H.set(P[0], P[1]); snap(); },
        });
        const mass = v.slider('world mass M (10²¹ suns)', 1, 50, 5, { log: true, sig: 2 });
        const YE = 4 / 27; // λ_E/3c² for A = 1
        const kk = () => +kSel.value;
        const Yb = (x, k = kk()) => (k * x - 1) / x ** 3 / YE; // boundary curve, in units of λ_E
        const L = v.stage({ x: [0, 4.2], y: [-1.6, 2.6], axes: 'box', height: 360, weight: 0.9, minWidth: 260, xlabel: 'R / A', ylabel: 'λ ÷ Einstein’s λ', title: 'Friedmann’s figure: where a world can be' });
        const Rt = v.stage({ x: [-2, 4], y: [0, 2], axes: 'box', height: 360, weight: 1.1, xlabel: 'time from now (Gyr)', ylabel: 'R (billion light years)', title: 'R(t): the radius of the world' });
        const H = L.handle(0.75, 0, { color: 'gold', r: 8, label: 'now', labelPos: 'ne', constrain: (x, y) => { const X = Math.min(4.1, Math.max(0.12, x)), Y = Math.min(2.5, Math.max(-1.5, y)); return [X, Math.max(Y, Yb(X) + 1e-6)]; } });
        const snap = () => { const X = H.x, Y = Math.max(H.y, Yb(X) + 1e-6); if (Y !== H.y) H.set(X, Y); };
        let st = null;
        v.render(() => {
          const k = kk(), A = mass.value / 5, x0 = H.x, Y = H.y, y = Y * YE;
          // ---- left: the cubic and the regions
          L.clip(() => L.between((x) => Math.max(-1.7, Yb(x)), () => -1.7, 0.02, 4.2, { fill: 'red', fillAlpha: 0.13, n: 300 }));
          L.fn((x) => Yb(x), { domain: [0.05, 4.2], color: 'red', width: 2.4, n: 400 });
          L.hline(0, { color: 'faint', width: 1 });
          if (k === 1) {
            L.hline(1, { color: 'ink', width: 1.1, dash: [5, 4] });
            L.dot(1.5, 1, { r: 5, color: 'ink' });
            L.text('Einstein 1917', 1.5, 1, { dy: -13, dx: -8, size: 11.5, weight: 600, color: 'ink', align: 'right' });
            L.text('periodic', 0.22, 0.64, { size: 12, weight: 700, color: 'blue' });
            L.text('monotonic, 1st kind', 2.45, 2.15, { size: 12, weight: 700, color: 'green' });
            L.text('2nd kind', 2.35, 0.86, { size: 12, weight: 700, color: 'teal' });
          } else {
            L.text('expands for ever', 2.4, 1.4, { size: 12, weight: 700, color: 'green' });
            L.text('recollapses', 0.75, -0.55, { size: 12, weight: 700, color: 'blue' });
          }
          L.text('no world', 2.9, k === 1 ? -0.9 : -1.25, { size: 12, weight: 700, color: 'red' });
          L.hline(Y, { color: 'gold', width: 1.2, alpha: 0.8 });
          const roots = k === 1 ? friedmannRoots(1, y) : [];
          roots.forEach((r, i) => { if (r < 4.2) { L.line(r, Y - 0.12, r, Y + 0.12, { color: 'ink', width: 2 }); L.tex(i ? "x_0'" : 'x_0', r, Y, { dy: 18, size: 14, color: 'ink', align: 'center' }); } });
          // ---- right: R(t) in real units
          const W = friedmannWorld(k, 1, y, x0), W0 = friedmannWorld(k, 1, 0, x0);
          const toT = (t) => t * A * GYR_PER_A, toR = (R) => R * A * GLY_PER_A;
          let type = '', col = 'accent';
          if (k === 1) {
            if (Math.abs(Y - 1) < 0.004 && Math.abs(x0 - 1.5) < 0.02) { type = 'Einstein’s static world (unstable: a nudge sends it off)'; col = 'ink'; }
            else if (Y > 1) { type = 'monotonic world of the first kind'; col = 'green'; }
            else if (roots.length === 2 && x0 >= roots[1] - 1e-6) { type = 'monotonic world of the second kind'; col = 'teal'; }
            else { type = 'periodic world'; col = 'blue'; }
          } else type = y >= 0 ? `${k === 0 ? 'flat' : 'open'} world expanding for ever` : `${k === 0 ? 'flat' : 'open'} world that recollapses (λ < 0)`;
          if (W) {
            const ts = W.pts.map((p) => toT(p[0])), Rs = W.pts.map((p) => toR(p[1]));
            const t0 = Math.min(...ts), t1 = Math.max(...ts), pad = 0.05 * (t1 - t0 || 1);
            const RE = toR(1.5);
            const rmax = Math.max(...Rs, k === 1 ? RE : 0, toR(x0)) * 1.16;
            Rt.setView([t0 - pad, t1 + pad], [0, rmax]);
            if (k === 1) { Rt.hline(RE, { color: 'ink', width: 1.2, dash: [2, 4] }); Rt.text('Einstein’s radius 3A/2', t1 + pad, RE, { align: 'right', dy: -9, dx: -4, size: 11, color: 'muted', weight: 600 }); }
            if (W0 && Math.abs(y) > 1e-6) Rt.path(W0.pts.map((p) => [toT(p[0]), toR(p[1])]), { color: 'muted', width: 1.6, dash: [6, 4] });
            Rt.path(W.pts.map((p, i) => [ts[i], Rs[i]]), { color: col, width: 3 });
            Rt.vline(0, { color: 'faint', width: 1 });
            Rt.dot(0, toR(x0), { r: 6, color: 'gold' });
            if (W.tBegin != null) { Rt.dot(toT(W.tBegin), 0, { r: 5, color: col, hollow: true }); Rt.text('R = 0', toT(W.tBegin), 0, { dy: -20, dx: 6, size: 11, align: 'left', color: col, weight: 600, plate: true }); }
            if (W.tEnd != null) Rt.dot(toT(W.tEnd), 0, { r: 5, color: col, hollow: true });
            if (W.turnPast && W.tBegin == null && k === 1) Rt.text('grows from x₀′', toT(W.turnPast[0]), toR(W.turnPast[1]), { dy: 14, size: 11, color: col, weight: 600, align: 'center' });
          }
          st = { k, A, W, type, roots, x0, Y, toT, toR };
        });
        v.legend([['red', 'boundary  A − x + λx³/3c² = 0'], ['gold', 'now (drag)', { dot: true }], ['accent', 'R(t) of this world'], ['muted', 'same world with λ = 0', { dash: true }], ['ink', 'Einstein’s static radius', { dash: [2, 4] }]]);
        v.readout(() => {
          if (!st || !st.W) return '';
          const { W, type, toT, toR, A, x0, Y } = st;
          const age = W.tBegin != null ? ` · time since R = 0 (Friedmann’s “time since the creation of the world”): **${v.fix(-toT(W.tBegin), 2)} Gyr**` : '';
          const per = W.tBegin != null && W.tEnd != null ? ` · whole life (his “world period”): **${v.fix(toT(W.tEnd - W.tBegin), 2)} Gyr**` : W.tEnd == null ? ' · no end' : '';
          const piA = Math.PI * A * GYR_PER_A;
          return `**${type}** · radius now ${v.fix(toR(x0), 2)} billion light years, $\\lambda/\\lambda_E = ${v.fix(Y, 2)}$, $A = \\kappa M/6\\pi^2$ = ${v.fix(toR(1), 3)} billion light years${age}${per} · for $\\lambda = 0$ the period is $\\pi A/c$ = **${v.fix(piA, 2)} Gyr** for this mass; for Friedmann’s $M = 5\\cdot10^{21}$ suns that is ${v.fix(Math.PI * GYR_PER_A, 2)} Gyr, while he wrote “of the order of 10 billion years” (Belenkiy 2013 could not reproduce it either) · today (Planck 2018): space is flat and $\\Omega_\\Lambda = 0.685$ exceeds the value that would stop expansion, so ours is the flat cousin of his monotonic world of the first kind, aged 13.80 Gyr`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.20
    {
      num: '10.20',
      kind: 'Paper',
      name: 'A Measurement of Excess Antenna Temperature at 4080 Mc/s',
      paper: { authors: 'A. A. Penzias and R. W. Wilson', year: 1965, title: 'A Measurement of Excess Antenna Temperature at 4080 Mc/s', venue: 'The Astrophysical Journal 142: 419–421', doi: '10.1086/148307' },
      introduces: ['thermo-9.8'],
      statement: String.raw`With a 20-foot horn-reflector antenna and a maser receiver at Crawford Hill, New Jersey, Penzias and Wilson measured the noise power arriving from the zenith at 4080 Mc/s (wavelength 7.35 cm) against a liquid-helium reference. The antenna temperature was $6.7$ K. After subtracting everything they could account for, the atmosphere ($2.3\pm0.3$ K, from the change with elevation and the secant law), ohmic losses in the antenna ($0.8\pm0.4$ K) and the back lobe ($<0.1$ K), there remained
$$T_{\rm excess}=3.5\pm1.0\ \text{K},$$
the same in every direction, unpolarized, and unchanged from July 1964 to April 1965. A note added in proof compared it with the 16 K minimum sky temperature at 404 Mc/s and concluded that no known kind of radio source could produce so flat a spectrum.

They offered no interpretation of their own and pointed to the companion letter of Dicke, Peebles, Roll and Wilkinson, which identified the excess as thermal radiation left from a hot, dense early universe: the **cosmic microwave background** (thermo-9.8), with a blackbody spectrum (thermo-9.4) now known to be at $2.725$ K. One frequency fixes a temperature only if the spectrum is assumed to be thermal; the blackbody shape was established much later (COBE, 1990).`,
      idea: String.raw`Gamow, Alpher and Herman had predicted in the late 1940s that a hot big bang would leave a few-kelvin radiation bath, but no one looked for it, and in 1965 the steady-state theory was still a serious rival. Penzias and Wilson were calibrating an antenna built for satellite communication and radio astronomy, and found an irreducible extra noise they could not remove: they cleaned the horn (including the "white dielectric material" left by pigeons), taped every seam, and the excess stayed. Meanwhile at Princeton, a few miles away, Dicke's group was building a radiometer to search for exactly such radiation; a phone call brought the two teams together and the two letters appeared side by side. The measurement turned the big bang into the standard model of cosmology, since a steady-state universe has no natural way to fill space with isotropic blackbody radiation; it earned the 1978 Nobel Prize. COBE's FIRAS instrument later measured the spectrum to be a blackbody to parts in $10^5$.`,
      caption: String.raw`**Left**: the noise budget at 4080 Mc/s as the paper adds it up. The antenna temperature grows with the air mass the beam looks through (secant law, $\sec z$); drag the **elevation** slider to tilt the horn and watch only the atmospheric wedge change, while the extrapolation to no atmosphere leaves losses (orange) and the unexplained **3.5 ± 1.0 K** (green). The straight line is drawn from the published numbers; the paper does not print its elevation scan. **Right**: the sky's spectrum, with the one point of 1965 (green, its error bar from the paper), the 404 Mc/s ceiling of 16 K from the note in proof, and the 43 COBE FIRAS measurements (orange, Fixsen et al. 1996; their error bars are smaller than the dots). Slide the **blackbody temperature** and the curve; switch the axis to **brightness temperature**, the scale on which an antenna measures, where the 1965 point is directly 3.5 K.`,
      deps: ['thermo-9.4'],
      refs: [],
      tags: ['cosmology', 'radio astronomy', 'history'],
      credit: 'Arno Penzias & Robert Wilson, 1965',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cosmic_microwave_background' },
      viz(v) {
        const view = v.select('right panel', [{ value: 'I', label: 'intensity $I_\\nu$' }, { value: 'T', label: 'brightness temperature' }], 'I');
        const Ts = v.slider('blackbody temperature (K)', 1.5, 5, 2.725, { step: 0.001, decimals: 3 });
        const el = v.slider('elevation of the horn', 15, 90, 90, { step: 1, fmt: (d) => `${Math.round(d)}°` });
        const B = v.stage({ x: [0, 4.2], y: [0, 15], axes: 'box', height: 340, weight: 0.85, minWidth: 250, xlabel: 'air masses  sec z', ylabel: 'antenna temperature (K)', title: 'the budget at 4080 Mc/s' });
        const S = v.stage({ x: [0.3, 1000], y: [0.03, 1000], xlog: true, ylog: true, axes: 'box', height: 340, weight: 1.15, xlabel: 'frequency (GHz)', ylabel: 'intensity Iν (MJy/sr)', title: 'the spectrum of the sky' });
        const NU_PW = 4.08, TPW = 3.5, EPW = 1.0, ATM = 2.3, LOSS = 0.9; // GHz, K
        const nuF = []; for (let i = 0; i < FIRAS.length; i += 3) nuF.push([FIRAS[i] * 29.9792458, FIRAS[i + 1], FIRAS[i + 2] / 1000]);
        const chiF = (T) => nuF.reduce((s, [nu, I, sg]) => s + ((I - planckI(nu, T)) / sg) ** 2, 0);
        let Tbest = 2.725; { let a = 2.70, b = 2.75; for (let i = 0; i < 60; i++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (chiF(m1) < chiF(m2)) b = m2; else a = m1; } Tbest = (a + b) / 2; }
        const chiBest = chiF(Tbest);
        let st = null;
        v.render(() => {
          // ---- left: secant law
          const X = 1 / Math.sin((el.value * Math.PI) / 180);
          B.rect(0, 0, 4.2, TPW, { fill: 'green', fillAlpha: 0.2, stroke: false });
          B.rect(0, TPW - EPW, 4.2, TPW + EPW, { fill: 'green', fillAlpha: 0.0, hatch: 'green', hatchAlpha: 0.25, stroke: false });
          B.rect(0, TPW, 4.2, TPW + LOSS, { fill: 'orange', fillAlpha: 0.35, stroke: false });
          B.poly([[0, TPW + LOSS], [4.2, TPW + LOSS + ATM * 4.2], [4.2, TPW + LOSS]], { fill: 'blue', fillAlpha: 0.16, stroke: false });
          B.fn((x) => TPW + LOSS + ATM * x, { color: 'ink', width: 2.4, domain: [1, 4.2] });
          B.fn((x) => TPW + LOSS + ATM * x, { color: 'ink', width: 1.6, dash: [5, 4], domain: [0, 1] });
          B.text('atmosphere 2.3 K × sec z', 2.15, TPW + LOSS + ATM * 1.75, { size: 11.5, weight: 700, color: 'blue', align: 'left' });
          B.text('losses 0.8 + back lobe < 0.1', 2.2, TPW + LOSS / 2, { size: 11, weight: 700, color: 'orange', align: 'left', plate: true });
          B.text('unexplained 3.5 ± 1.0 K', 2.2, TPW / 2, { size: 12, weight: 700, color: 'green', align: 'left', plate: true });
          B.line(1, 6.7 - 0.3, 1, 6.7 + 0.3, { color: 'ink', width: 2 });
          B.dot(1, 6.7, { r: 5, color: 'ink' });
          B.text('zenith: 6.7 K measured', 1, 6.7, { dx: 10, dy: 20, size: 11.5, weight: 600, align: 'left', plate: true });
          B.vline(X, { color: 'gold', width: 1.4, dash: [3, 3] });
          B.dot(X, TPW + LOSS + ATM * X, { r: 7, color: 'gold' });
          B.dot(0, TPW + LOSS, { r: 4, color: 'ink', hollow: true });
          // ---- right: spectrum
          const T = Ts.value, tmode = view.value === 'T';
          if (tmode) { S.setScale({ ylog: false, y: [0, 6.2] }); S.setLabels(undefined, 'brightness temperature (K)'); }
          else { S.setScale({ ylog: true, y: [0.03, 1000] }); S.setLabels(undefined, 'intensity Iν (MJy/sr)'); }
          const yOf = (I, nu) => (tmode ? rjTemp(I, nu) : I);
          S.fn((nu) => yOf(planckI(nu, Tbest), nu), { color: 'faint', width: 5, n: 300 });
          S.fn((nu) => yOf(planckI(nu, T), nu), { color: 'accent', width: 2.4, n: 300 });
          S.dots(nuF.map(([nu, I]) => [nu, yOf(I, nu)]), { r: 3.4, color: 'orange' });
          // Penzias & Wilson: antenna temperature is a Rayleigh–Jeans brightness temperature
          const Ipw = (t) => (2 * K_B * t * (NU_PW * 1e9) ** 2) / C_MS ** 2 * 1e20;
          const y0 = tmode ? TPW : Ipw(TPW), ylo = tmode ? TPW - EPW : Ipw(TPW - EPW), yhi = tmode ? TPW + EPW : Ipw(TPW + EPW);
          S.line(NU_PW, ylo, NU_PW, yhi, { color: 'green', width: 2.6 });
          S.dot(NU_PW, y0, { r: 7, color: 'green' });
          S.text('Penzias & Wilson 1965', NU_PW, y0, { dx: 12, dy: tmode ? -2 : -4, size: 12, weight: 700, color: 'green', align: 'left', plate: true });
          // 404 Mc/s: no more than 16 K (upper limit)
          if (tmode) { S.text('404 Mc/s: ≤ 16 K (off scale)', 0.36, 5.0, { size: 11, color: 'muted', weight: 600, align: 'left' }); }
          else { const I16 = (2 * K_B * 16 * 0.404e9 ** 2) / C_MS ** 2 * 1e20; S.poly([[0.404, I16 * 0.62], [0.404 * 0.86, I16], [0.404 / 0.86, I16]], { fill: 'muted', fillAlpha: 1, color: 'muted' }); S.text('404 Mc/s ≤ 16 K', 0.404, I16, { dy: -4, size: 11, color: 'muted', weight: 600, align: 'left', dx: 12 }); }
          if (tmode) S.text('COBE FIRAS', 90, rjTemp(planckI(90, 2.725), 90), { dx: -12, dy: -12, size: 12, weight: 700, color: 'orange', align: 'right' });
          else S.text('COBE FIRAS', 55, planckI(55, 2.725), { dx: -10, dy: -10, size: 12, weight: 700, color: 'orange', align: 'right' });
          st = { X, T, chi: chiF(T), tpred: rjTemp(planckI(NU_PW, T), NU_PW) };
        });
        v.legend([['green', 'unexplained excess, 3.5 ± 1.0 K', { area: true }], ['orange', 'ohmic losses + back lobe', { area: true }], ['blue', 'atmosphere (secant law)', { area: true }], ['accent', 'blackbody at your T'], ['faint', 'best fit to FIRAS'], ['orange', 'COBE FIRAS 1996', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { X, T, chi, tpred } = st, Tant = TPW + LOSS + ATM * X;
          const quad = Math.hypot(0.3, 0.3, 0.4);
          return `Horn at ${Math.round(el.value)}°: ${v.fix(X, 2)} air masses, antenna temperature ${v.fix(Tant, 2)} K = 3.5 (excess) + 0.9 (losses) + ${v.fix(ATM * X, 2)} (air) · paper: 6.7 − 2.3 − 0.8 − (< 0.1) = **3.5 ± 1.0 K**; the three quoted errors (0.3, 0.3, 0.4 K) add in quadrature to only ${v.fix(quad, 2)} K, so their ±1.0 K is conservative · at 4.08 GHz a ${v.fix(T, 3)} K blackbody gives an antenna (Rayleigh–Jeans) temperature of **${v.fix(tpred, 2)} K**, ${v.fix(Math.abs(TPW - tpred) / EPW, 1)}σ from the 1965 point · FIRAS: χ² = ${chi < 1e5 ? v.fix(chi, 0) : v.fmt(chi, 3)} for 43 frequencies at your T; best fit **${v.fix(Tbest, 4)} K** (χ² ${v.fix(chiBest, 1)}); today’s value 2.72548 ± 0.00057 K (Fixsen 2009): the 1965 point agrees with it within its error bar, measured at a single frequency far down the Rayleigh–Jeans side of a spectrum that peaks near 160 GHz`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.21
    {
      num: '10.21',
      kind: 'Paper',
      name: 'Supernova evidence for an accelerating universe',
      paper: { authors: 'Adam G. Riess, Alexei V. Filippenko, Peter Challis, et al.', year: 1998, title: 'Observational Evidence from Supernovae for an Accelerating Universe and a Cosmological Constant', venue: 'The Astronomical Journal 116 (3): 1009–1038', doi: '10.1086/300499' },
      introduces: ['astro-10.11'],
      statement: String.raw`The High-$z$ Supernova Search Team measured luminosity distances to 16 type Ia supernovae at redshifts $0.16\le z\le0.97$ and compared them with 34 nearby ones, standardizing each by its light-curve shape (two methods: MLCS and the $\Delta m_{15}$ template). On a Hubble diagram of distance modulus $\mu=5\log_{10}(D_L/\text{Mpc})+25$ against redshift, with
$$D_L=\frac{c}{H_0}(1+z)\,|\Omega_k|^{-1/2}\,\mathrm{sinn}\Big\{|\Omega_k|^{1/2}\!\int_0^z\!\frac{dz'}{\sqrt{(1+z')^2(1+\Omega_Mz')-z'(2+z')\Omega_\Lambda}}\Big\},$$
the distant supernovae are **10–15% farther** (about 0.25 mag fainter) than expected in a universe of low matter density ($\Omega_M=0.2$) without a cosmological constant, and fainter still compared with $\Omega_M=1$. Fitting $H_0$, $\Omega_M$ and $\Omega_\Lambda$ together, the spectroscopically confirmed supernovae favour $\Omega_\Lambda>0$ at 3.0$\sigma$ (MLCS) and 4.0$\sigma$ (template), a negative deceleration parameter $q_0=\Omega_M/2-\Omega_\Lambda$, i.e. an **accelerating expansion**, and for a flat universe $\Omega_M\approx0.28$, $\Omega_\Lambda\approx0.72$.

The inference assumes that supernovae at $z\sim0.5$ are the same standard candles as nearby ones after the light-curve correction (no evolution, no grey dust), which the paper tested but could not exclude.`,
      idea: String.raw`By the mid-1990s inflation predicted a flat universe while galaxy clusters showed too little matter for it; the expansion was expected to be decelerating, and the teams set out to measure by how much. Type Ia supernovae became usable standard candles once Phillips (1993) and Riess, Press & Kirshner (1995) showed that their peak brightness correlates with how fast they fade (astro-8.11). Comparing the distance–redshift relation at $z\approx0.5$ with Hubble's law nearby (astro-10.19) measures the change in expansion rate over billions of years (astro-10.8, astro-10.10). The answer, found simultaneously by Perlmutter's Supernova Cosmology Project (astro-10.22), was the opposite of the expectation: the expansion is accelerating, driven by a vacuum energy with negative pressure, the cosmological constant that Einstein had discarded and Friedmann (astro-10.18) had kept as a free parameter. The paper introduced dark energy (astro-10.11) as an observational fact. Together with the microwave background it fixed the "concordance" model, and Perlmutter, Schmidt and Riess shared the 2011 Nobel Prize.`,
      caption: String.raw`**Top**: the paper's Hubble diagram, distance modulus against redshift (log scale) for the 34 nearby (blue) and 16 distant supernovae (red; orange: sparsely observed "snapshot" supernovae; the hollow point is SN 1997ck, which has no spectrum), from its Tables 5–7, 9 and 10. **Hover** a point for its name. **Bottom**: the same points as differences from a universe with $\Omega_M=0.2$ and no $\Lambda$, as in the paper's Fig. 4: points above zero are farther (fainter) than that universe allows. Curves: $\Omega_M=0.2$ (dotted) and $\Omega_M=1$ (dashed) without $\Lambda$, the paper's best flat fit $(0.24, 0.76)$ (green), and your model (gold), which starts as an empty universe ($\Omega_M=\Omega_\Lambda=0$): even that is too close, as the paper notes. Set $\Omega_M$ and $\Omega_\Lambda$ with the sliders and watch $\chi^2$. Switch between the two **distance methods**, or drop SN 1997ck.`,
      deps: ['astro-8.11', 'astro-10.8', 'astro-10.10', 'astro-10.19', 'astro-10.18'],
      refs: [],
      tags: ['cosmology', 'dark energy', 'supernovae'],
      credit: 'Riess, Filippenko, Challis et al. (High-z Supernova Search Team), 1998',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Accelerating_expansion_of_the_universe' },
      viz(v) {
        const meth = v.select('distances', [{ value: 'm', label: 'MLCS' }, { value: 't', label: 'template Δm₁₅' }], 'm');
        const ck = v.toggle('include SN 1997ck (no spectrum)', true);
        const omS = v.slider('$\\Omega_M$', 0, 2, 0, { step: 0.01 });
        const olS = v.slider('$\\Omega_\\Lambda$', -1, 2.5, 0, { step: 0.01 });
        const Hs = v.stage({ x: [0.008, 1.25], xlog: true, y: [30.5, 45.5], axes: 'box', height: 300, full: true, hover: true, ylabel: 'distance modulus μ (mag)', title: 'the Hubble diagram' });
        const Rs = v.stage({ x: [0.008, 1.25], xlog: true, y: [-0.85, 1.05], axes: 'box', height: 230, full: true, xlabel: 'redshift z', ylabel: 'Δμ from (0.2, 0) (mag)', title: 'distances relative to a low-density universe without Λ' });
        const rowsFor = (m, withCk) => {
          const j = m === 'm' ? 2 : 4;
          const near = RIESS_NEAR.map((r, i) => ({ n: r[0], z: 10 ** r[1] / C_KMS, mu: r[j], s: r[j + 1], g: 0, snap: i >= 27 }));
          const hi = RIESS_HI.filter((r) => withCk || r[0] !== '1997ck').map((r, i) => ({ n: r[0], z: r[1], mu: r[j], s: r[j + 1], g: 1, snap: RIESS_HI.indexOf(r) >= 10, ck: r[0] === '1997ck' }));
          for (const q of [...near, ...hi]) q.sv = (5 / Math.LN10) * Math.hypot(200, RIESS_SNFEAT.has(q.n) ? 2500 : 0) / (C_KMS * q.z);
          return [...near, ...hi];
        };
        const fitOff = (rows, om, ol) => { // best offset −5 log H₀ and χ²
          const d = lumDist(om, ol, 1.0); let sw = 0, swx = 0; const xs = [];
          for (const q of rows) { const D = d(q.z); if (!(D > 0)) return { chi: Infinity }; const w = 1 / (q.s ** 2 + q.sv ** 2), x = q.mu - 5 * Math.log10(D * C_KMS) - 25; xs.push([x, w]); sw += w; swx += w * x; }
          const off = swx / sw; let chi = 0; for (const [x, w] of xs) chi += w * (x - off) ** 2;
          return { chi, off, H0: 10 ** (-off / 5) };
        };
        const cache = {};
        const gridFor = (m, withCk) => { // grid likelihood over Ω_M ≥ 0, excluding bouncing universes (paper §4)
          const key = m + withCk; if (cache[key]) return cache[key];
          const rows = rowsFor(m, withCk); let best = { chi: Infinity }, pp = 0, pt = 0; const cells = [];
          for (let om = 0; om <= 2.5001; om += 0.05) for (let ol = -1; ol <= 3.0001; ol += 0.05) { if (noBigBang(om, ol)) continue; const f = fitOff(rows, om, ol); if (!isFinite(f.chi)) continue; cells.push([ol, f.chi]); if (f.chi < best.chi) best = { ...f, om, ol }; }
          for (const [ol, c] of cells) { const p = Math.exp(-(c - best.chi) / 2); pt += p; if (ol > 0) pp += p; }
          let flat = { chi: Infinity }; for (let om = 0; om <= 1.0001; om += 0.005) { const f = fitOff(rows, om, 1 - om); if (f.chi < flat.chi) flat = { ...f, om }; }
          return (cache[key] = { best, P: pp / pt, flat });
        };
        let st = null;
        v.render(() => {
          const rows = rowsFor(meth.value, ck.value), om = omS.value, ol = olS.value;
          const near = rows.filter((q) => !q.g), H0fit = fitOff(near, 0.2, 0).H0, H0 = meth.value === 'm' ? 65.2 : 63.8; // curves on the paper's H₀; our nearby fit as a check
          const muOf = (om_, ol_) => { const d = lumDist(om_, ol_, 1.3); return (z) => 5 * Math.log10((d(z) * C_KMS) / H0) + 25; };
          const mRef = muOf(0.2, 0), models = [[0.2, 0, 'muted', [2, 3]], [1, 0, 'red', [7, 5]], [0.24, 0.76, 'green', null], [om, ol, 'gold', null]];
          const bounce = noBigBang(om, ol);
          for (const [a, b, col, dash] of models) {
            if (col === 'gold' && bounce) continue;
            const mu = muOf(a, b), w = col === 'gold' ? 2.8 : 2;
            Hs.fn((z) => mu(z), { color: col, width: w, dash, domain: [0.008, 1.25], n: 160 });
            Rs.fn((z) => mu(z) - mRef(z), { color: col, width: w, dash, domain: [0.008, 1.25], n: 160 });
          }
          Rs.hline(0, { color: 'faint', width: 1 });
          for (const q of rows) {
            const col = q.g ? (q.snap ? 'orange' : 'red') : 'blue', e = Math.hypot(q.s, q.sv), r = q.mu - mRef(q.z);
            Hs.line(q.z, q.mu - q.s, q.z, q.mu + q.s, { color: col, width: 1.2, alpha: 0.6 });
            Hs.dot(q.z, q.mu, { r: 4, color: col, hollow: !!q.ck });
            Rs.line(q.z, r - e, q.z, r + e, { color: col, width: 1.2, alpha: 0.55 });
            Rs.dot(q.z, r, { r: 4, color: col, hollow: !!q.ck });
          }
          // hover
          const P = Hs.pointer;
          if (P.inside) {
            let best = null, bd = 1e9; for (const q of rows) { const dd = Math.hypot(Hs.X(q.z) - Hs.X(P.x), Hs.Y(q.mu) - Hs.Y(P.y)); if (dd < bd) { bd = dd; best = q; } }
            if (best && bd < 20) { const right = best.z > 0.25; Hs.dot(best.z, best.mu, { r: 8, hollow: true, color: 'ink', width: 2 }); Hs.text(`SN ${best.n}: z = ${v.fix(best.z, 3)}, μ = ${v.fix(best.mu, 2)} ± ${v.fix(best.s, 2)}`, best.z, best.mu, { dx: right ? -12 : 12, dy: -14, align: right ? 'right' : 'left', size: 12, weight: 600, plate: true }); }
          }
          Hs.corner(`curves for H₀ = ${v.fix(H0, 1)} km/s/Mpc (paper)`, 'br', { size: 11.5, color: 'muted', dy: -18 });
          const conf = rows.filter((q) => q.g && !q.ck), well = conf.filter((q) => !q.snap), avg = (L) => L.reduce((s, q) => s + q.mu - mRef(q.z), 0) / L.length;
          st = { rows, H0, H0fit, mres: avg(well), mall: avg(conf), nconf: conf.length, nwell: well.length, fit: bounce ? null : fitOff(rows, om, ol), G: gridFor(meth.value, ck.value), bounce };
        });
        v.legend([['blue', 'nearby (34)', { dot: true }], ['red', 'high z', { dot: true }], ['orange', 'high-z snapshots', { dot: true }], ['muted', '$\\Omega_M = 0.2,\\ \\Omega_\\Lambda = 0$', { dash: [2, 3] }], ['red', '$\\Omega_M = 1,\\ \\Omega_\\Lambda = 0$', { dash: true }], ['green', 'flat 0.24 / 0.76 (paper)'], ['gold', 'your model']]);
        v.readout(() => {
          if (!st) return '';
          const { H0, H0fit, mres, mall, nconf, nwell, fit, G, bounce } = st, om = omS.value, ol = olS.value, m = meth.value === 'm';
          const far = (10 ** (mres / 5) - 1) * 100;
          const you = bounce ? `your $(\\Omega_M, \\Omega_\\Lambda)$ = (${v.fix(om, 2)}, ${v.fix(ol, 2)}) has **no big bang** (it bounced), the region the paper excludes` : `your $(\\Omega_M, \\Omega_\\Lambda)$ = (${v.fix(om, 2)}, ${v.fix(ol, 2)}): $\\chi^2$ = **${v.fix(fit.chi, 1)}** for ${st.rows.length} SNe, $q_0 = ${v.fix(om / 2 - ol, 2)}$ (${om / 2 - ol < -0.005 ? 'accelerating' : om / 2 - ol > 0.005 ? 'decelerating' : 'coasting'})`;
          return `the ${nwell} well-observed distant SNe lie on average **${v.fix(mres, 2)} mag** above the (0.2, 0) universe, i.e. **${v.fix(far, 0)}% farther** (paper, Fig. ${m ? '4: 0.25' : '5: 0.28'} mag; abstract: 10–15%); with the ${nconf - nwell} snapshots, all ${nconf} confirmed SNe: ${v.fix(mall, 2)} mag · residuals use the paper’s $H_0$ = ${v.fix(H0, 1)}; our fit to the nearby SNe alone gives ${v.fix(H0fit, 1)} km/s/Mpc, which would lower every residual by ${v.fix(5 * Math.log10(H0 / H0fit), 2)} mag · ${you} · best fits on this data: flat $\\Omega_M = ${v.fix(G.flat.om, 2)}$ ($\\chi^2$ ${v.fix(G.flat.chi, 1)}; paper ${m ? (ck.value ? '0.24' : '0.28') : (ck.value ? '0.21' : '0.17')}), unconstrained (${v.fix(G.best.om, 2)}, ${v.fix(G.best.ol, 2)}); probability that $\\Omega_\\Lambda > 0$: **${v.fix(100 * G.P, 2)}%** (paper ${m ? '99.7% (3.0σ)' : '>99.9% (4.0σ)'} without 97ck) · today: Planck 2018 $\\Omega_m = 0.315 \\pm 0.007$, $\\Omega_\\Lambda = 0.685 \\pm 0.007$; Pantheon+ (1,550 SNe) flat $\\Omega_M = 0.334 \\pm 0.018$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.22
    {
      num: '10.22',
      kind: 'Paper',
      name: 'Measurements of Ω and Λ from 42 High-Redshift Supernovae',
      paper: { authors: 'S. Perlmutter, G. Aldering, G. Goldhaber, et al.', year: 1999, title: 'Measurements of Ω and Λ from 42 High-Redshift Supernovae', venue: 'The Astrophysical Journal 517 (2): 565–586', doi: '10.1086/307221' },
      introduces: ['astro-10.11'],
      statement: String.raw`The Supernova Cosmology Project measured 42 type Ia supernovae at $0.18\le z\le0.83$ and fitted their stretch-corrected peak magnitudes $m_B^{\rm eff}$, together with 18 nearby supernovae of the Calán/Tololo survey, to
$$m_B^{\rm eff}(z)=\mathcal M_B+5\log_{10}\mathcal D_L(z;\Omega_M,\Omega_\Lambda),$$
where $\mathcal D_L=H_0D_L/c$ and $\mathcal M_B$ absorbs both the absolute magnitude and $H_0$. The joint likelihood in the $(\Omega_M,\Omega_\Lambda)$ plane is a long diagonal band, approximately
$$0.8\,\Omega_M-0.6\,\Omega_\Lambda\approx-0.2\pm0.1\qquad(\Omega_M\lesssim1.5),$$
which excludes $\Lambda=0$: the probability that $\Omega_\Lambda>0$ is 99.8% for the primary fit (54 supernovae), 99% including identified systematic errors. For a flat universe $\Omega_M=0.28^{+0.09}_{-0.08}$ (statistical) $^{+0.05}_{-0.04}$ (systematic), so $\Omega_\Lambda\approx0.72$ and the expansion accelerates; a flat universe without $\Lambda$ ($\Omega_M=1$) is strongly ruled out.

Supernovae alone constrain only a combination of $\Omega_M$ and $\Omega_\Lambda$; separating them needed the microwave background, which measures $\Omega_M+\Omega_\Lambda$. The result assumes no evolution of the supernovae and no grey dust, which the paper examined among its systematics.`,
      idea: String.raw`Perlmutter's team had pioneered finding high-redshift supernovae on schedule: wide-field images of the same patches of sky taken three weeks apart, at new moon, so that supernovae caught on the rise could be followed with the Hubble Space Telescope and large telescopes. They expected to measure the deceleration of a matter-dominated universe. Their first seven supernovae (1997) pointed to $\Omega_M\approx1$; the 42 of this paper said the opposite. Because supernovae at $z\sim0.5$ probe $D_L(z)$, which depends on $\Omega_M$ and $\Omega_\Lambda$ (astro-10.8, astro-10.10) in nearly the combination $0.8\Omega_M-0.6\Omega_\Lambda$, the result is a band, not a point, in the plane of Friedmann's parameters (astro-10.18); its tilt is what makes $\Lambda=0$ impossible unless $\Omega_M<0$. With the High-z team's paper (astro-10.21) it established the accelerating universe and dark energy (astro-10.11), and the crossing of this band with the CMB's flatness line became the concordance model, $\Omega_M\approx0.3$, $\Omega_\Lambda\approx0.7$.`,
      caption: String.raw`**Left**: the $(\Omega_M,\Omega_\Lambda)$ plane, as in the paper's Fig. 7: confidence regions (68, 90, 95, 99%) recomputed here from its Tables 1–2, with $\mathcal M_B$ fitted at each point. Lines: flat universes, $\Lambda=0$, the boundary between accelerating and decelerating expansion, and between eternal expansion and recollapse; hatched, the corner with no big bang. **Drag the gold point** to any universe and watch $\Delta\chi^2$ climb; the teal point is today's Planck value. **Right**: the 60 supernovae as magnitude residuals from your universe (red: SCP; blue: Calán/Tololo; hollow: excluded from the chosen fit), with the empty, Einstein–de Sitter and best flat models for comparison. Switch between the paper's **primary fit** (54 supernovae) and **all 60**.`,
      see: ['astro-10.21'],
      deps: ['astro-8.11', 'astro-10.8', 'astro-10.10', 'astro-10.19', 'astro-10.18'],
      refs: [],
      tags: ['cosmology', 'dark energy', 'supernovae'],
      credit: 'Perlmutter, Aldering, Goldhaber et al. (Supernova Cosmology Project), 1999',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Supernova_Cosmology_Project' },
      viz(v) {
        const fitSel = v.select('supernovae', [{ value: 'C', label: 'primary fit C (54)' }, { value: 'A', label: 'fit A (all 60)' }], 'C');
        const P = v.stage({ x: [0, 3], y: [-1.5, 3], axes: 'box', height: 400, weight: 1.1, xlabel: 'Ωₘ (matter)', ylabel: 'ΩΛ (vacuum energy)', title: 'where the 42 supernovae allow the universe to be' });
        const R = v.stage({ x: [0, 0.9], y: [-1.4, 1.4], axes: 'box', height: 400, weight: 0.9, minWidth: 260, xlabel: 'redshift z', ylabel: 'magnitude − model (mag)', title: 'residuals from your universe' });
        const h = P.handle(1, 0, { color: 'gold', r: 8, constrain: { x: [0, 3], y: [-1.5, 3] } });
        const ALL = [...SCP42.map((r) => ({ n: r[0], z: r[1], m: r[2], s: r[3], ex: r[4], scp: true })), ...CALAN18.map((r) => ({ n: r[0], z: r[1], m: r[2], s: r[3], ex: r[4], scp: false }))];
        const chiOf = (rows, om, ol) => {
          const d = lumDist(om, ol, 0.84); let sw = 0, swx = 0; const xs = [];
          for (const q of rows) { const D = d(q.z); if (!(D > 0)) return { chi: Infinity }; const w = 1 / q.s ** 2, x = q.m - 5 * Math.log10(D); xs.push([x, w]); sw += w; swx += w * x; }
          const Mb = swx / sw; let chi = 0; for (const [x, w] of xs) chi += w * (x - Mb) ** 2; return { chi, Mb };
        };
        const NX = 101, NY = 151, DX = 3 / (NX - 1), DY = 4.5 / (NY - 1), cache = {};
        const gridFor = (f) => {
          if (cache[f]) return cache[f];
          const rows = ALL.filter((q) => inPerlFit(q.ex, f)), G = new Float64Array(NX * NY); let best = { chi: Infinity }, pp = 0, pt = 0;
          for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) { const om = i * DX, ol = -1.5 + j * DY; const c = noBigBang(om, ol) ? NaN : chiOf(rows, om, ol).chi; G[i * NY + j] = isFinite(c) ? c : NaN; if (c < best.chi) best = { chi: c, om, ol }; }
          for (let k = 0; k < G.length; k++) if (isFinite(G[k])) { const p = Math.exp(-(G[k] - best.chi) / 2); pt += p; if (-1.5 + (k % NY) * DY > 0) pp += p; }
          let flat = { chi: Infinity }; const fl = [];
          for (let om = 0; om <= 1.0001; om += 0.0025) { const c = chiOf(rows, om, 1 - om).chi; fl.push([om, c]); if (c < flat.chi) flat = { chi: c, om }; }
          const in1 = fl.filter(([, c]) => c <= flat.chi + 1).map(([o]) => o);
          // valley: for Ω_M = 0 … 1.5 the best Ω_Λ, fitted to a line
          const vx = [], vy = []; for (let i = 0; i <= 50; i++) { let bj = -1, bc = Infinity; for (let j = 0; j < NY; j++) { const c = G[i * NY + j]; if (c < bc) { bc = c; bj = j; } } vx.push(i * DX); vy.push(-1.5 + bj * DY); }
          const lr = v.M.linreg(vx, vy), vmean = vx.reduce((s, x, i) => s + 0.8 * x - 0.6 * vy[i], 0) / vx.length;
          return (cache[f] = { G, best, P: pp / pt, flat, lo: in1[0], hi: in1[in1.length - 1], rows, slope: lr.slope, icpt: lr.intercept, vmean });
        };
        const dchi = (Gd, x, y) => { const fi = x / DX, fj = (y + 1.5) / DY, i = Math.min(NX - 2, Math.max(0, Math.floor(fi))), j = Math.min(NY - 2, Math.max(0, Math.floor(fj))), u = fi - i, w = fj - j; const g = Gd.G, a = g[i * NY + j], b = g[(i + 1) * NY + j], c = g[i * NY + j + 1], d = g[(i + 1) * NY + j + 1]; return (a * (1 - u) * (1 - w) + b * u * (1 - w) + c * (1 - u) * w + d * u * w) - Gd.best.chi; };
        // no-big-bang boundary and the recollapse boundary
        const nbb = []; for (let om = 0; om <= 3.0001; om += 0.05) { let lo = 0, hi = 4.2; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (noBigBang(om, m)) hi = m; else lo = m; } nbb.push([om, hi]); }
        const recoll = (om) => (om <= 1 ? 0 : 4 * om * Math.cos(Math.acos((1 - om) / om) / 3 + (4 * Math.PI) / 3) ** 3);
        const LEV = [[2.30, 0.42], [4.61, 0.28], [5.99, 0.2], [9.21, 0.12]];
        const acc = v.rgb('accent');
        let st = null;
        v.render(() => {
          const Gd = gridFor(fitSel.value);
          P.raster((x, y) => { const d = dchi(Gd, x, y); if (!isFinite(d)) return null; for (const [L, a] of LEV) if (d <= L) return [acc[0], acc[1], acc[2], Math.round(255 * a)]; return null; }, { res: 2, key: 'perl' + fitSel.value });
          for (const [L] of LEV) P.contour((x, y) => dchi(Gd, x, y), L, { color: 'accent', width: L === 2.30 ? 2 : 1.2, res: 110 });
          P.poly([...nbb, [3, 3], [0, 3]], { fill: 'muted', fillAlpha: 0.08, hatch: 'muted', hatchAlpha: 0.35, stroke: false });
          P.path(nbb, { color: 'muted', width: 1.4 });
          P.text('no big bang', 0.1, 2.25, { size: 12, weight: 700, color: 'muted', align: 'left', plate: true });
          P.fn((x) => 1 - x, { color: 'ink', width: 1.4, domain: [0, 2.5] });
          P.text('flat', 2.0, -1.0, { size: 11.5, weight: 700, color: 'ink', align: 'left', dx: 8 });
          P.hline(0, { color: 'ink', width: 1, dash: [5, 4] });
          P.text('Λ = 0', 1.2, 0, { size: 11.5, weight: 600, align: 'left', dy: 11, color: 'ink' });
          P.fn((x) => x / 2, { color: 'orange', width: 1.4, dash: [3, 3] });
          P.text('accelerating', 2.95, 1.475, { size: 11.5, weight: 700, color: 'orange', align: 'right', dy: -10 });
          P.text('decelerating', 2.95, 1.475, { size: 11.5, weight: 700, color: 'orange', align: 'right', dy: 11 });
          P.fn(recoll, { color: 'red', width: 1.3, dash: [7, 4], domain: [0, 3] });
          P.text('recollapses', 2.95, -0.3, { size: 11, weight: 600, color: 'red', align: 'right', dy: 10 });
          P.dot(0.315, 0.685, { r: 6, color: 'teal' });
          P.text('Planck 2018', 0.315, 0.685, { dx: 10, dy: 12, size: 11.5, weight: 700, color: 'teal', align: 'left', plate: true });
          P.dot(Gd.best.om, Gd.best.ol, { r: 4, color: 'ink' });
          P.text('best fit', Gd.best.om, Gd.best.ol, { dx: 8, dy: -8, size: 11, weight: 600, color: 'ink', align: 'left' });
          // ---- residuals from the dragged universe
          const om = h.x, ol = h.y, bb = noBigBang(om, ol), me = bb ? null : chiOf(Gd.rows, om, ol);
          R.hline(0, { color: 'faint', width: 1.2 });
          if (me && isFinite(me.chi)) {
            const dU = lumDist(om, ol, 0.95), mU = (z) => me.Mb + 5 * Math.log10(dU(z));
            for (const [a, b, col, dash] of [[0, 0, 'muted', [2, 3]], [1, 0, 'red', [7, 5]], [0.28, 0.72, 'green', null]]) {
              const f = chiOf(Gd.rows, a, b), dM = lumDist(a, b, 0.95);
              if (isFinite(f.chi)) R.fn((z) => f.Mb + 5 * Math.log10(dM(z)) - mU(z), { color: col, width: 2, dash, domain: [0.005, 0.9] });
            }
            for (const q of ALL) {
              const r = q.m - mU(q.z), inFit = inPerlFit(q.ex, fitSel.value), col = q.scp ? 'red' : 'blue';
              R.line(q.z, r - q.s, q.z, r + q.s, { color: col, width: 1.1, alpha: 0.5 });
              R.dot(q.z, r, { r: 4, color: col, hollow: !inFit });
            }
          } else R.text('no big bang: no distances', 0.45, 0, { align: 'center', size: 13, weight: 700, color: 'muted' });
          st = { Gd, om, ol, bb, me };
        });
        v.legend([['accent', '68 / 90 / 95 / 99% regions', { area: true }], ['ink', 'flat'], ['orange', 'q₀ = 0', { dash: [3, 3] }], ['red', 'recollapse boundary', { dash: true }], ['red', 'SCP supernovae', { dot: true }], ['blue', 'Calán/Tololo', { dot: true }], ['muted', 'empty universe', { dash: [2, 3] }], ['green', 'flat 0.28 / 0.72']]);
        v.readout(() => {
          if (!st) return '';
          const { Gd, om, ol, bb, me } = st, C = fitSel.value === 'C';
          const d = bb ? NaN : me.chi - Gd.best.chi, conf = bb ? '' : d <= 2.3 ? 'inside the 68% region' : d <= 4.61 ? 'inside 90%' : d <= 5.99 ? 'inside 95%' : d <= 9.21 ? 'inside 99%' : `excluded at more than 99% (≈${v.fix(Math.sqrt(Math.max(0, d)), 1)}σ in one parameter)`;
          const age = ageH0(om, ol), you = bb ? `your universe (${v.fix(om, 2)}, ${v.fix(ol, 2)}) has no big bang` : `your universe (${v.fix(om, 2)}, ${v.fix(ol, 2)}): $\\Delta\\chi^2 = ${v.fix(d, 1)}$, ${conf}; $q_0 = ${v.fix(om / 2 - ol, 2)}$; age $= ${v.fix(age, 3)}/H_0$ = ${v.fix((age * 977.8) / 67.4, 1)} Gyr for $H_0 = 67.4$`;
          const pl = dchi(Gd, 0.315, 0.685);
          return `${you} · recomputed from the tables: best fit (${v.fix(Gd.best.om, 2)}, ${v.fix(Gd.best.ol, 2)}) with $\\chi^2 = ${v.fix(Gd.best.chi, 1)}$ for ${Gd.rows.length} SNe (paper ${C ? '(0.73, 1.32), χ² 56' : '(0.83, 1.42), χ² 98'}); flat $\\Omega_M = ${v.fix(Gd.flat.om, 2)}^{+${v.fix(Gd.hi - Gd.flat.om, 2)}}_{-${v.fix(Gd.flat.om - Gd.lo, 2)}}$ (paper ${C ? '0.28 +0.09 −0.08' : '0.29 +0.09 −0.08'}); $P(\\Omega_\\Lambda > 0)$ = **${v.fix(Gd.P, 4)}** (paper ${C ? '0.9979' : '0.9984'}); the valley $\\Omega_\\Lambda \\approx ${v.fix(Gd.slope, 2)}\\,\\Omega_M + ${v.fix(Gd.icpt, 2)}$, along which $0.8\\Omega_M - 0.6\\Omega_\\Lambda$ averages ${v.fix(Gd.vmean, 2)} for $\\Omega_M \\le 1.5$ (paper −0.2 ± 0.1) · today’s Planck 2018 values (0.315, 0.685) sit at $\\Delta\\chi^2 = ${v.fix(pl, 1)}$, ${pl <= 2.3 ? 'inside the 68% region of 1999' : pl <= 5.99 ? 'inside its 95% region' : 'outside its 95% region'}`;
        });
      },
    },
  ],
};
