// Materials Science — Chapter 4: helpers shared by ch04.js, ch04-b.js and ch04-c.js (plain named exports).
// Re-exports the chapter-3 helpers (which re-export chapter 1's), and adds a one-dimensional "tensile bar" model:
// an elastic–Hollomon material (Ramberg–Osgood form) pulled in a bar whose cross-section is very slightly uneven, solved
// under equal force in every slice, so necking appears by itself when the bar passes the Considère point.
export * from './ch03.shared.js';

/** Illustrative parameter sets (orders of magnitude of textbook values, rounded; NOT a certified data table).
 *  E in GPa, s0 = 0.2 % offset yield strength in MPa, n = strain-hardening exponent. */
export const TENSILE_PRESETS = [
  { id: 'steel', label: 'low-carbon steel', E: 200, s0: 250, n: 0.22 },
  { id: 'al', label: 'aluminium alloy', E: 70, s0: 280, n: 0.1 },
  { id: 'cu', label: 'annealed copper', E: 120, s0: 70, n: 0.4 },
  { id: 'ss', label: 'austenitic stainless', E: 195, s0: 250, n: 0.45 },
];

/** Total true strain at true stress sig (MPa): elastic part plus plastic part eps_p = 0.002 (sig/s0)^(1/n). Strictly increasing in sig. */
export const epsOfSigma = (m, sig) => sig / (m.E * 1000) + 0.002 * Math.pow(sig / m.s0, 1 / m.n);
/** Inverse: true stress at total true strain eps (bisection). */
export function sigmaOfEps(m, eps) {
  let lo = 0, hi = m.s0 * 40;
  for (let i = 0; i < 70; i++) { const mid = (lo + hi) / 2; if (epsOfSigma(m, mid) < eps) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
/** Considère point: the true stress where d(sigma)/d(eps) = sigma (solves sigma * d eps/d sigma = 1). */
export function considereSigma(m) {
  const f = (s) => s / (m.E * 1000) + (0.002 / m.n) * Math.pow(s / m.s0, 1 / m.n);
  let lo = 1e-6, hi = m.s0 * 100;
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (f(mid) < 1) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

/**
 * Pull a bar of N slices to a fracture strain `epsF` (true strain in the weakest slice). Slice i has initial area 1 + imp*(1 - bump_i),
 * smallest at the middle. Equal force in every slice: sigma_i * exp(-eps_i) * A_i = F (volume conserved, so the area is A_i exp(-eps_i)).
 * Slice strains below the peak force are found on the hardening branch; the weakest slice is the driver and may pass the peak.
 * Returns {steps: [{e, s, ew, sw, eps: Float64Array}], su (true stress at max force), eu (true strain there), N, A}.
 * After the force maximum the other slices unload elastically (plastic strain frozen), so the neck is one slice wide: sharper than a real one.
 */
export function pullBar(m, { N = 41, imp = 0.01, epsF = 1.0, K = 400 } = {}) {
  const A = new Float64Array(N), mid = (N - 1) >> 1, E = m.E * 1000;
  for (let i = 0; i < N; i++) { const x = (i - mid) / (N * 0.14); A[i] = 1 + imp * (1 - Math.exp(-x * x)); }
  const su = considereSigma(m), eu = epsOfSigma(m, su);
  const h = (sg) => sg * Math.exp(-epsOfSigma(m, sg));
  const Fmax = h(su);
  const steps = [];
  const Abar = A.reduce((a, b) => a + b, 0) / N;
  let epsP = null, sigPk = null, kpk = -1;
  for (let k = 0; k <= K; k++) {
    const ew = epsF * Math.pow(k / K, 2.2) + 1e-6;
    const sw = sigmaOfEps(m, ew);
    if (kpk < 0 && sw >= su) kpk = k;
    const F = Math.min(h(sw), Fmax) * A[mid] * (kpk >= 0 && k > kpk ? 1 : 1);
    const Fw = h(sw) * A[mid];
    const eps = new Float64Array(N), sg = new Float64Array(N);
    let sumL = 0;
    for (let i = 0; i < N; i++) {
      const target = Fw / A[i];
      if (i === mid) { eps[i] = ew; sg[i] = sw; }
      else if (kpk < 0 || k <= kpk) {
        if (target >= Fmax) { sg[i] = su; eps[i] = eu; }
        else { let lo = 0, hi = su; for (let it = 0; it < 50; it++) { const md = (lo + hi) / 2; if (h(md) < target) lo = md; else hi = md; } sg[i] = (lo + hi) / 2; eps[i] = epsOfSigma(m, sg[i]); }
      } else {
        // after the force maximum the other slices unload elastically from their frozen plastic strain
        let lo = 0, hi = sigPk[i];
        const ep = epsP[i];
        for (let it = 0; it < 50; it++) { const md = (lo + hi) / 2; if (md * Math.exp(-(ep + md / E)) < target) lo = md; else hi = md; }
        sg[i] = (lo + hi) / 2; eps[i] = ep + sg[i] / E;
      }
      sumL += Math.exp(eps[i]);
    }
    if (k === kpk) { epsP = Array.from(eps, (e, i) => e - sg[i] / E); sigPk = Array.from(sg); }
    steps.push({ e: sumL / N - 1, s: Fw / Abar, ew, sw, eps });
  }
  return { steps, su, eu, N, A, Fmax };
}
/** Index of the step with the largest engineering stress. */
export const peakStep = (bar) => { let b = 0; bar.steps.forEach((p, i) => { if (p.s > bar.steps[b].s) b = i; }); return b; };
/** The step whose engineering strain is nearest e. */
export function stepAtStrain(bar, e) {
  let lo = 0, hi = bar.steps.length - 1;
  while (hi - lo > 1) { const md = (lo + hi) >> 1; if (bar.steps[md].e < e) lo = md; else hi = md; }
  return Math.abs(bar.steps[lo].e - e) < Math.abs(bar.steps[hi].e - e) ? lo : hi;
}
/** Outline of the bar at one step: slice centres x_i (cumulative length, total 1 = original length) and half-widths w_i (area ~ width^2, round bar). */
export function barProfile(bar, st, L0 = 1) {
  const N = bar.N, xs = [], ws = [];
  let x = 0;
  const tot = st.eps.reduce((a, e) => a + Math.exp(e), 0);
  for (let i = 0; i < N; i++) { const l = (Math.exp(st.eps[i]) / N) * L0; xs.push(x + l / 2); x += l; ws.push(Math.sqrt(bar.A[i] * Math.exp(-st.eps[i]))); }
  return { xs, ws, len: x, tot };
}

/** Round to a given number of significant figures for readouts. */
export const sig = (x, n = 3) => (x === 0 ? '0' : Number(x.toPrecision(n)).toString());
