// Medical Imaging — Chapter 2 shared helpers (plain named exports): a compact photon-interaction model
// (photoelectric + Klein–Nishina Compton) for tissues, metals and contrast agents, a Kramers-type X-ray tube spectrum,
// filtration and transmission of a spectrum through layers, and small image / Poisson helpers.
//
// The attenuation data are a MODEL, not a table: Compton is the exact Klein–Nishina cross-section times the electron
// density; photoelectric is a power law in 1/E with the Z-dependence fitted to a few remembered NIST XCOM values
// (water, cortical bone, aluminium, iodine, lead), with a K-edge jump for heavy elements. Coherent scatter, L edges and
// pair production are left out; accuracy is a few tens of percent between 15 and 150 keV, which is what the pictures need.

export const TAU = 2 * Math.PI;
export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const fx = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d).replace('-', '−') : '—');
export const pct = (x, d = 1) => `${fx(100 * x, d)}\\%`;
export const mean = (a) => { let s = 0; for (const x of a) s += x; return s / a.length; };
export const sd = (a) => { const m = mean(a); let s = 0; for (const x of a) s += (x - m) ** 2; return Math.sqrt(s / Math.max(1, a.length - 1)); };
export const sci = (x, d = 2) => {
  if (!Number.isFinite(x) || x === 0) return fx(x, d);
  const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
  return e === 0 ? fx(m, d) : `${fx(m, d)}\\times10^{${e}}`;
};

// ---------------------------------------------------------------- Klein–Nishina and elements
const NA = 6.02214076e23, SIGMA_T = 0.6652458732e-24; // cm², Thomson
/** Klein–Nishina total cross-section per free electron (cm²) at photon energy E (keV). */
export function sigmaKN(E) {
  const k = E / 510.999;
  if (k < 1e-3) return SIGMA_T * (1 - 2 * k + 5.2 * k * k);
  const l = Math.log(1 + 2 * k);
  return 0.75 * SIGMA_T * (((1 + k) / (k * k)) * ((2 * (1 + k)) / (1 + 2 * k) - l / k) + l / (2 * k) - (1 + 3 * k) / ((1 + 2 * k) ** 2));
}
const LIGHT = { H: [1, 1.008], C: [6, 12.011], N: [7, 14.007], O: [8, 15.999], Na: [11, 22.99], Mg: [12, 24.305], Al: [13, 26.982], Si: [14, 28.086], P: [15, 30.974], S: [16, 32.06], Cl: [17, 35.45], K: [19, 39.098], Ca: [20, 40.078] };
// heavy elements: Z, A, K-edge (keV), mass attenuation just above the edge (cm²/g; scaled from remembered NIST values)
const HEAVY = {
  Cu: [29, 63.546, 8.979, 230], Mo: [42, 95.95, 20.0, 72], Rh: [45, 102.91, 23.22, 59], I: [53, 126.9, 33.169, 34], Ba: [56, 137.33, 37.441, 28],
  Gd: [64, 157.25, 50.239, 19], W: [74, 183.84, 69.525, 12], Pb: [82, 207.2, 88.005, 8.9],
};
const JUMP = 5.5, NH = 2.7;
/** Photoelectric terms for an element: [w-independent] {P, n, Ek, J} with tau/rho = P E^-n (E<Ek) or J*P E^-n (E>=Ek). */
function elementTerm(sym) {
  if (LIGHT[sym]) { const [Z, A] = LIGHT[sym]; return { Z, A, P: (10.2 * Z ** 4.34) / A, n: 3, Ek: 0, J: 1 }; }
  const [Z, A, Ek, muk] = HEAVY[sym];
  return { Z, A, P: (muk * Ek ** NH) / JUMP, n: NH, Ek, J: JUMP };
}
/** A material: mass fractions, density (g/cm³). */
export function material(name, frac, rho) {
  let ne = 0; const terms = [];
  for (const [sym, w] of Object.entries(frac)) { const t = elementTerm(sym); ne += (w * t.Z * NA) / t.A; terms.push({ w, ...t }); }
  return { name, rho, ne, terms };
}
export const MATS = {
  water: material('water', { H: 0.1119, O: 0.8881 }, 1.0),
  tissue: material('soft tissue', { H: 0.102, C: 0.143, N: 0.034, O: 0.708, Na: 0.002, P: 0.003, S: 0.003, Cl: 0.002, K: 0.003 }, 1.06),
  bone: material('cortical bone', { H: 0.034, C: 0.155, N: 0.042, O: 0.435, Na: 0.001, Mg: 0.002, P: 0.103, S: 0.003, Ca: 0.225 }, 1.92),
  aluminium: material('aluminium', { Al: 1 }, 2.699),
  lead: material('lead', { Pb: 1 }, 11.35),
  copper: material('copper', { Cu: 1 }, 8.96),
  paper: material('paper', { H: 0.062, C: 0.444, O: 0.494 }, 0.8),
  wood: material('wood', { H: 0.062, C: 0.444, O: 0.494 }, 0.55),
  glass: material('glass', { O: 0.47, Na: 0.10, Si: 0.34, Ca: 0.07, Mg: 0.02 }, 2.5),
  leadglass: material('lead glass', { O: 0.2, Si: 0.12, K: 0.03, Pb: 0.65 }, 4.6),
  iodine: material('iodine', { I: 1 }, 4.93),
  barium: material('barium', { Ba: 1 }, 3.51),
  gadolinium: material('gadolinium', { Gd: 1 }, 7.9),
  tungsten: material('tungsten', { W: 1 }, 19.3),
  molybdenum: material('molybdenum', { Mo: 1 }, 10.2),
  rhodium: material('rhodium', { Rh: 1 }, 12.4),
};
/** Mass attenuation coefficients (cm²/g): {pe, co, tot} at photon energy E (keV). */
export function massAtt(m, E) {
  let pe = 0;
  for (const t of m.terms) pe += t.w * t.P * (t.Ek && E >= t.Ek ? t.J : 1) * E ** -t.n;
  const co = m.ne * sigmaKN(E);
  return { pe, co, tot: pe + co };
}
/** Linear attenuation coefficient (cm⁻¹). */
export function mu(m, E) { return m.rho * massAtt(m, E).tot; }
/** K-edge energy of a pure heavy element (keV). */
export const kEdge = (sym) => HEAVY[sym][2];

// ---------------------------------------------------------------- X-ray tube spectra
export const ANODES = {
  W: { name: 'tungsten', Z: 74, mat: 'tungsten', Ek: 69.525, lines: [[57.98, 0.29], [59.32, 0.51], [67.24, 0.15], [69.1, 0.05]], lineName: ['Kα₂', 'Kα₁', 'Kβ₁', ''] },
  Mo: { name: 'molybdenum', Z: 42, mat: 'molybdenum', Ek: 20.0, lines: [[17.37, 0.28], [17.48, 0.52], [19.61, 0.2]], lineName: ['', 'Kα', 'Kβ'] },
  Rh: { name: 'rhodium', Z: 45, mat: 'rhodium', Ek: 23.22, lines: [[20.07, 0.27], [20.22, 0.51], [22.72, 0.22]], lineName: ['', 'Kα', 'Kβ'] },
};
export const E_GRID = (() => { const a = []; for (let e = 5; e <= 150.001; e += 0.25) a.push(e); return Float64Array.from(a); })();
/**
 * Kramers-type spectrum of photons per keV (relative units) for tube voltage kVp, anode ('W','Mo','Rh'), total filtration in mm Al
 * (plus optional mm Cu and mm Be-free extra {cu}). Returns {E, N (filtered, with lines), N0 (unfiltered continuum, no lines), lines}.
 * Continuum N0 = Z (kVp − E)/E (Kramers), reduced by self-absorption in the anode (a few µm), then by the filter.
 */
export function tubeSpectrum(kVp, anode = 'W', alMm = 2.5, o = {}) {
  const A = ANODES[anode], E = E_GRID, n = E.length, N0 = new Float64Array(n), N = new Float64Array(n);
  const mA = MATS[A.mat], Al = MATS.aluminium, Cu = MATS.copper, cuMm = o.cuMm || 0, x = o.anodeUm ?? 4;
  const filt = (e) => Math.exp(-mu(Al, e) * alMm * 0.1 - mu(Cu, e) * cuMm * 0.1);
  const self = (e) => Math.exp(-mu(mA, e) * x * 1e-4 * 1.0);
  for (let i = 0; i < n; i++) {
    const e = E[i]; if (e >= kVp) continue;
    N0[i] = (A.Z * (kVp - e)) / e;
    N[i] = N0[i] * self(e) * filt(e);
  }
  const lines = [];
  if (kVp > A.Ek) {
    const U = kVp / A.Ek, tot = 0.22 * A.Z * A.Ek * (U - 1) ** 1.67;
    for (const [e0, w] of A.lines) {
      const area = tot * w * self(e0) * filt(e0); lines.push([e0, area]);
      const s = 0.3, c = area / (s * Math.sqrt(TAU));
      for (let i = 0; i < n; i++) { const d = (E[i] - e0) / s; if (Math.abs(d) < 5) N[i] += c * Math.exp(-0.5 * d * d); }
    }
  }
  return { E, N, N0, lines, kVp, anode };
}
/** Transmit a spectrum through layers [[material, cm], …]; returns a new N array. */
export function transmit(N, E, layers) {
  const out = new Float64Array(N.length);
  for (let i = 0; i < N.length; i++) { let a = 0; for (const [m, t] of layers) a += mu(m, E[i]) * t; out[i] = N[i] * Math.exp(-a); }
  return out;
}
export const total = (N) => { let s = 0; for (let i = 0; i < N.length; i++) s += N[i]; return s; };
export const meanEnergy = (N, E) => { let s = 0, w = 0; for (let i = 0; i < N.length; i++) { s += N[i] * E[i]; w += N[i]; } return w > 0 ? s / w : 0; };
/** Detector signal for an energy-integrating detector: Σ N E (energy fluence). */
export const energyFluence = (N, E) => { let s = 0; for (let i = 0; i < N.length; i++) s += N[i] * E[i]; return s; };
/** Half-value layer (cm) of the energy fluence of spectrum N in material m, by bisection. */
export function hvlOf(N, E, m) {
  const I0 = energyFluence(N, E); if (!(I0 > 0)) return NaN;
  const f = (t) => energyFluence(transmit(N, E, [[m, t]]), E) / I0 - 0.5;
  let a = 0, b = 1; while (f(b) > 0 && b < 1e3) b *= 2;
  for (let k = 0; k < 40; k++) { const c = 0.5 * (a + b); if (f(c) > 0) a = c; else b = c; }
  return 0.5 * (a + b);
}

// ---------------------------------------------------------------- images and counting statistics
const ids = new WeakMap(); let nextId = 1;
const idOf = (a) => { if (!ids.has(a)) ids.set(a, nextId++); return ids.get(a); };
/** Draw a W×H image (Float64Array, row 0 at the top) in grey (or via `colorFn(t) → [r,g,b]`) on a stage with window [0,W]×[0,H]. */
export function showImage(s, data, W, H, o = {}) {
  const lo = o.lo ?? 0, hi = o.hi ?? 1, cf = o.colorFn;
  s.raster((x, y) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return null;
    const t = clamp((data[(H - 1 - Math.floor(y)) * W + Math.floor(x)] - lo) / (hi - lo), 0, 1);
    if (cf) return cf(t);
    const c = Math.round(255 * t); return [c, c, c];
  }, { res: 1, id: o.id || 'img', key: `${idOf(data)}|${lo}|${hi}|${o.extra || ''}` });
}
export function frame(s, W, H) { s.rect(0, 0, W, H, { color: 'muted', width: 1, alpha: 0.7 }); }
/** Poisson sample with mean lam from two uniforms/normal: exact (Knuth) below 30, normal approximation above. */
export function poisson(lam, r) {
  if (lam <= 0) return 0;
  if (lam > 30) return Math.max(0, Math.round(lam + Math.sqrt(lam) * r.normal()));
  const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1;
}
