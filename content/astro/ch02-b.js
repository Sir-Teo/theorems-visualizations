// Astrophysics & Celestial Mechanics — Chapter 2 (part b: 2.7–2.12)

import { TAU, DEG, clamp, memo, sci, wrap180, cr3bp, helio, fromElements, helioToRotating, keplerDrift, elements, kepE, ertbpSteps, pEl } from './ch02.shared.js';

// ── data ──────────────────────────────────────────────────────────────────────
// Numbered asteroids (895 910 objects; JPL Small-Body Database query API, sb-kind=a, sb-ns=n, fetched Oct 2026):
// counts of osculating semi-major axes in 370 bins of 0.01 AU from 1.70 to 5.40 AU.
const KW = '41,31,47,37,43,44,39,50,72,108,113,201,267,372,514,729,893,1154,1333,1626,1662,1814,1762,1574,1243,1237,1106,826,649,424,250,139,86,47,30,21,27,27,41,70,124,214,376,633,985,1554,2094,2650,3275,3947,4414,5010,5528,5834,6344,6460,7227,7887,8464,8915,9416,9884,10032,10227,10773,10828,11091,10890,11243,10748,9730,9728,8608,7562,6785,5781,4555,3485,2138,396,158,2561,5869,8308,10051,11042,11679,12762,12436,12344,12526,12746,12671,12286,12705,11275,11387,11298,11179,10921,9083,10076,10277,10191,10376,10402,11269,10713,9947,8431,7143,3872,388,2244,2966,3818,5284,3827,3048,2943,3201,3206,3187,2969,2715,1582,4475,5941,6517,7030,7271,7315,6883,7862,9250,9817,10510,10107,11071,11825,11748,11972,12058,11796,11694,11555,12576,11395,8933,7567,6241,4903,3700,2618,1772,834,261,77,66,61,78,97,116,136,152,185,241,251,217,240,251,224,277,270,220,182,151,97,82,90,91,33,41,42,59,117,99,27,1,7,7,4,4,5,5,8,3,8,5,3,5,2,4,0,0,1,1,2,2,1,3,1,4,6,5,7,2,7,7,3,28,85,189,300,502,630,623,589,512,292,135,98,22,4,0,1,1,2,0,1,0,1,0,0,1,1,0,0,0,1,1,1,0,1,1,1,3,4,4,3,1,2,0,0,0,4,1,0,0,0,2,0,2,2,0,0,0,2,0,0,2,1,0,0,1,3,0,0,1,3,0,2,1,0,0,0,0,2,0,0,0,1,0,1,0,0,0,1,2,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1,0,0,0,1,21,22,28,62,80,154,233,304,369,429,542,617,684,669,745,759,704,660,629,575,490,435,363,343,228,187,96,70,56,32,20,15,11,4,0';
// J2000 planar elements of Jupiter and Saturn (JPL): a (AU), e, longitude of perihelion ϖ (°), mean longitude λ (°); masses in M☉
const JS = [{ m: 9.5479e-4, a: 5.2026, e: 0.04849, w: 14.75, L: 34.40 }, { m: 2.8588e-4, a: 9.5549, e: 0.05551, w: 92.43, L: 49.94 }];
const GSUN = 4 * Math.PI * Math.PI, AS = 206264.806; // AU³/yr², arcsec per radian
const MU_SJ = 9.5388e-4, AJ = 5.2026, PJ = 11.862;

/** Laplace coefficient b_s^(j)(α) by direct quadrature. */
function laplace(s, j, al, N = 1200) { let sum = 0; for (let k = 0; k < N; k++) { const p = (TAU * (k + 0.5)) / N; sum += Math.cos(j * p) / Math.pow(1 - 2 * al * Math.cos(p) + al * al, s); } return (2 * sum) / N; }
/** Jupiter–Saturn N-body run (democratic-heliocentric Wisdom–Holman map, planar). Records [t, hJ, kJ, aJ, hS, kS, aS] every `every` years. */
function jsNbody(years, dt, mfac, every = 100) {
  const m = [JS[0].m, JS[1].m * mfac], Q = new Float64Array(8), vh = [];
  JS.forEach((p, i) => { const H = fromElements(GSUN * (1 + m[i]), p.a, p.e, 0, 0, p.w * DEG, (p.L - p.w) * DEG); Q[4 * i] = H[0]; Q[4 * i + 1] = H[1]; vh.push([H[3], H[4]]); });
  const Mt = 1 + m[0] + m[1], vs = [-(m[0] * vh[0][0] + m[1] * vh[1][0]) / Mt, -(m[0] * vh[0][1] + m[1] * vh[1][1]) / Mt];
  for (let i = 0; i < 2; i++) { Q[4 * i + 2] = vh[i][0] + vs[0]; Q[4 * i + 3] = vh[i][1] + vs[1]; }
  const kick = (h) => { const dx = Q[4] - Q[0], dy = Q[5] - Q[1], r3 = Math.pow(dx * dx + dy * dy, 1.5); Q[2] += (h * GSUN * m[1] * dx) / r3; Q[3] += (h * GSUN * m[1] * dy) / r3; Q[6] -= (h * GSUN * m[0] * dx) / r3; Q[7] -= (h * GSUN * m[0] * dy) / r3; };
  const jump = (h) => { const px = m[0] * Q[2] + m[1] * Q[6], py = m[0] * Q[3] + m[1] * Q[7]; for (let i = 0; i < 2; i++) { Q[4 * i] += h * px; Q[4 * i + 1] += h * py; } };
  const out = []; let t = 0;
  const rec = () => { const px = m[0] * Q[2] + m[1] * Q[6], py = m[0] * Q[3] + m[1] * Q[7], r = [t]; for (let i = 0; i < 2; i++) { const el = elements(GSUN * (1 + m[i]), [Q[4 * i], Q[4 * i + 1], 0], [Q[4 * i + 2] + px, Q[4 * i + 3] + py, 0]); r.push(el.e * Math.sin(el.varpi), el.e * Math.cos(el.varpi), el.a); } out.push(r); };
  rec();
  const N = Math.round(years / dt), ev = Math.round(every / dt);
  for (let k = 1; k <= N; k++) { kick(dt / 2); jump(dt / 2); keplerDrift(GSUN, Q, 0, dt); keplerDrift(GSUN, Q, 4, dt); jump(dt / 2); kick(dt / 2); t += dt; if (k % ev === 0) rec(); }
  return { out, m };
}
/** Mean precession rate (rad/yr) of the vector (k, h) in a record series (columns ih, ik). */
function meanRate(out, ih, ik) {
  let prev = Math.atan2(out[0][ih], out[0][ik]), off = 0, first = prev;
  for (const r of out) { let w = Math.atan2(r[ih], r[ik]); while (w + off - prev > Math.PI) off -= TAU; while (w + off - prev < -Math.PI) off += TAU; prev = w + off; }
  return (prev - first) / (out[out.length - 1][0] - out[0][0]);
}

export default {
  collection: 'astro',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Model',
      name: 'Secular perturbations: Laplace–Lagrange theory',
      statement: String.raw`Averaging the planets’ mutual attractions over their orbital periods and keeping terms linear in the eccentricities and inclinations, the eccentricity vectors $(k_j, h_j) = e_j(\cos\varpi_j, \sin\varpi_j)$ of $N$ planets obey the linear system
$$\dot h_j = \sum_{l} A_{jl}\,k_l,\qquad \dot k_j = -\sum_l A_{jl}\,h_l,$$
with $A_{jj} = \frac{n_j}{4}\sum_{l\ne j}\frac{m_l}{M_\odot}\,\alpha_{jl}\bar\alpha_{jl}\,b^{(1)}_{3/2}(\alpha_{jl})$ and $A_{jl} = -\frac{n_j}{4}\frac{m_l}{M_\odot}\,\alpha_{jl}\bar\alpha_{jl}\,b^{(2)}_{3/2}(\alpha_{jl})$ (Laplace coefficients $b$ of the semi-major-axis ratios $\alpha$). The solution is a superposition of $N$ **secular modes**, $h_j = \sum_i e_{ji}\sin(g_it + \beta_i)$, $k_j = \sum_i e_{ji}\cos(g_it+\beta_i)$, with the eigenfrequencies $g_i$ of $A$: eccentricities oscillate and are exchanged between planets on timescales of $10^4$–$10^6$ years while semi-major axes stay fixed, and the total angular-momentum deficit $\sum_j m_j\sqrt{a_j}\,(1 - \sqrt{1-e_j^2})$ is conserved. The theory holds for small $e$, $i$ and away from mean-motion resonances.`,
      idea: String.raw`Averaging over the fast mean longitudes removes all terms that depend on them, so by Lagrange’s planetary equations the semi-major axes become constant (Laplace’s stability theorem) and only the slow angles $\varpi_j$, $\Omega_j$ remain. Expanding the averaged disturbing function to second order in $e$ gives a quadratic form in $(h, k)$ — a set of coupled harmonic oscillators, which canonical perturbation theory (mech 12.21) diagonalises into normal modes, the orbital elements of 1.1 rotating at constant rates. Jupiter and Saturn are near the 5:2 commensurability (the “great inequality”, period about 900 years), and its second-order effect shifts their secular frequencies by about 25% — the main failure of the linear theory for this pair.`,
      caption: String.raw`Jupiter and Saturn alone, from their J2000 orbits. Right: their eccentricities over 100 000 years from a direct N-body integration (solid; a symplectic Wisdom–Holman map with 0.5-year steps) and from Laplace–Lagrange theory (dashed): the two planets trade eccentricity back and forth. Left: the eccentricity vectors $(e\cos\varpi, e\sin\varpi)$ — each traces a rosette made of two circular motions, one per secular mode. With the classical frequencies the theory slowly drifts out of phase; switch to the frequencies measured from the N-body run and amplitudes and phases match. Change Saturn’s mass and the exchange speeds up or slows down. Drag the time cursor on the right.`,
      deps: ['astro-1.1', 'mech-12.21'],
      refs: ['Murray–Dermott §7.2', 'Murray–Dermott §7.3'],
      tags: ['secular', 'perturbation theory', 'solar system'],
      credit: 'Lagrange, 1776–1782; Laplace, 1784',
      viz(v) {
        const mS = v.slider('Saturn’s mass (× actual)', 0.25, 4, 1, { log: true, sig: 2 });
        const fq = v.select('theory frequencies', [{ value: 'll', label: 'Laplace–Lagrange' }, { value: 'nb', label: 'measured from the N-body run' }], 'll');
        const kh = v.stage({ x: [-0.1, 0.1], y: [-0.1, 0.1], equal: true, axes: true, height: 340, weight: 0.85, title: 'eccentricity vectors', xlabel: 'e cos ϖ', ylabel: 'e sin ϖ' });
        const et = v.stage({ x: [0, 100], y: [0, 0.1], axes: 'box', height: 340, weight: 1.35, xlabel: 'time (thousand years)', ylabel: 'eccentricity', title: 'e(t): N-body (solid) and secular theory (dashed)' });
        const Tc = et.handle(30, 0.002, { color: 'gold', r: 6.5, constrain: 'x' });
        const cache = memo();
        const run = () => cache(mS.value, () => {
          const R = jsNbody(100000, 0.5, mS.value, 100), m = R.m;
          const a1 = JS[0].a, a2 = JS[1].a, al = a1 / a2, n1 = TAU / Math.sqrt(a1 ** 3 / (1 + m[0])), n2 = TAU / Math.sqrt(a2 ** 3 / (1 + m[1]));
          const b1 = laplace(1.5, 1, al), b2 = laplace(1.5, 2, al);
          const A = [[n1 * 0.25 * (m[1] / (1 + m[0])) * al * al * b1, -n1 * 0.25 * (m[1] / (1 + m[0])) * al * al * b2], [-n2 * 0.25 * (m[0] / (1 + m[1])) * al * b2, n2 * 0.25 * (m[0] / (1 + m[1])) * al * b1]];
          const tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0], dis = Math.sqrt(tr * tr / 4 - det), g = [tr / 2 - dis, tr / 2 + dis];
          const X = g.map((gi) => { const vx = A[0][1], vy = gi - A[0][0], nn = Math.hypot(vx, vy); return [vx / nn, vy / nn]; }); // eigenvector columns
          const r0 = R.out[0], h = [r0[1], r0[4]], k = [r0[2], r0[5]];
          const Xm = [[X[0][0], X[1][0]], [X[0][1], X[1][1]]], dX = Xm[0][0] * Xm[1][1] - Xm[0][1] * Xm[1][0];
          const inv = (b) => [(Xm[1][1] * b[0] - Xm[0][1] * b[1]) / dX, (-Xm[1][0] * b[0] + Xm[0][0] * b[1]) / dX];
          const u = inv(h), w = inv(k); // S_i sin β_i, S_i cos β_i
          const gm = [meanRate(R.out, 1, 2), meanRate(R.out, 4, 5)];
          // angular-momentum deficit (≈ ½ Σ m √a e²) of the elements averaged over 1900 yr, which removes the 900-yr great-inequality wiggles
          const amd = [], Wn = 19;
          for (let k = 0; k + Wn <= R.out.length; k += 3) { const s = [0, 0, 0, 0, 0, 0, 0]; for (let j = k; j < k + Wn; j++) for (let c = 1; c < 7; c++) s[c] += R.out[j][c] / Wn; amd.push(m[0] * Math.sqrt(s[3]) * (1 - Math.sqrt(1 - s[1] ** 2 - s[2] ** 2)) + m[1] * Math.sqrt(s[6]) * (1 - Math.sqrt(1 - s[4] ** 2 - s[5] ** 2))); }
          return { R, A, g, Xm, u, w, gm, amd, m };
        });
        const theory = (D, gg, t) => {
          const out = [[0, 0], [0, 0]]; // [planet][h, k]
          for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const c = Math.cos(gg[i] * t), sn = Math.sin(gg[i] * t); out[j][0] += D.Xm[j][i] * (D.u[i] * c + D.w[i] * sn); out[j][1] += D.Xm[j][i] * (D.w[i] * c - D.u[i] * sn); }
          return out;
        };
        let cur = null;
        v.render(() => {
          const D = run(), gg = fq.value === 'nb' ? D.gm : D.g, out = D.R.out;
          const tk = Tc.x, idx = clamp(Math.round(tk * 10), 0, out.length - 1);
          // e(t)
          let emax = 0.07; for (const r of out) emax = Math.max(emax, Math.hypot(r[1], r[2]), Math.hypot(r[4], r[5]));
          et.setView([0, 100], [0, emax * 1.15]);
          Tc.y = emax * 1.1;
          et.path(out.map((r) => [r[0] / 1000, Math.hypot(r[1], r[2])]), { color: 'orange', width: 1.8 });
          et.path(out.map((r) => [r[0] / 1000, Math.hypot(r[4], r[5])]), { color: 'blue', width: 1.6 });
          const thJ = [], thS = [];
          for (let t = 0; t <= 100000; t += 250) { const T = theory(D, gg, t); thJ.push([t / 1000, Math.hypot(T[0][0], T[0][1])]); thS.push([t / 1000, Math.hypot(T[1][0], T[1][1])]); }
          et.path(thJ, { color: 'red', width: 1.4, dash: [5, 4] });
          et.path(thS, { color: 'purple', width: 1.4, dash: [5, 4] });
          et.vline(tk, { color: 'gold', width: 1, alpha: 0.6 });
          const lr = out[out.length - 1];
          et.text('Jupiter', 99, Math.hypot(lr[1], lr[2]), { color: 'orange', size: 10.5, dy: -10, align: 'right' });
          et.text('Saturn', 99, Math.hypot(lr[4], lr[5]), { color: 'blue', size: 10.5, dy: 12, align: 'right' });
          // (k, h) plane
          const L = emax * 1.15;
          kh.setView([-L, L], [-L, L]);
          kh.dots(out.map((r) => [r[2], r[1]]), { r: 1.3, color: 'orange', alpha: 0.5 });
          kh.dots(out.map((r) => [r[5], r[4]]), { r: 1.3, color: 'blue', alpha: 0.45 });
          const pJ = [], pS = []; for (let t = 0; t <= 100000; t += 200) { const T = theory(D, gg, t); pJ.push([T[0][1], T[0][0]]); pS.push([T[1][1], T[1][0]]); }
          kh.path(pJ, { color: 'red', width: 1, dash: [4, 3], alpha: 0.8 }); kh.path(pS, { color: 'purple', width: 1, dash: [4, 3], alpha: 0.8 });
          const r = out[idx], T = theory(D, gg, r[0]);
          kh.arrow(0, 0, r[2], r[1], { color: 'orange', width: 2.2 }); kh.arrow(0, 0, r[5], r[4], { color: 'blue', width: 2.2 });
          kh.dot(T[0][1], T[0][0], { r: 4, hollow: true, color: 'red' }); kh.dot(T[1][1], T[1][0], { r: 4, hollow: true, color: 'purple' });
          kh.corner(`t = ${v.fix(r[0] / 1000, 1)} kyr`, 'tl', { color: 'gold' });
          cur = { D, gg, idx };
        });
        v.legend([['orange', 'Jupiter, N-body'], ['blue', 'Saturn, N-body'], ['red', 'Jupiter, theory', { dash: true }], ['purple', 'Saturn, theory', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { D } = cur, f = (x) => v.fix(x * AS, 2), amdR = (Math.max(...D.amd) - Math.min(...D.amd)) / D.amd[0];
          const eJ = D.R.out.map((r) => Math.hypot(r[1], r[2])), eS = D.R.out.map((r) => Math.hypot(r[4], r[5]));
          return String.raw`Laplace–Lagrange eigenfrequencies $g_1 = ${f(D.g[0])}$, $g_2 = ${f(D.g[1])}$ ″/yr (exchange period $2\pi/(g_2 - g_1) = ${v.fix(TAU / (D.g[1] - D.g[0]) / 1000, 1)}$ kyr); N-body precession rates ${f(D.gm[0])} and ${f(D.gm[1])} ″/yr (${v.fix(TAU / (D.gm[1] - D.gm[0]) / 1000, 1)} kyr) — the difference is the 5:2 near-resonance · N-body: $e_J$ ${v.fix(Math.min(...eJ), 3)}–${v.fix(Math.max(...eJ), 3)}, $e_S$ ${v.fix(Math.min(...eS), 3)}–${v.fix(Math.max(...eS), 3)}; angular-momentum deficit (averaged over the great-inequality wiggles) constant to ${v.fix(amdR * 100, 1)}% while $e_J^2$ and $e_S^2$ each change by a factor of several`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Phenomenon',
      name: 'Mean-motion resonances and the pendulum model',
      statement: String.raw`When an asteroid’s mean motion $n$ and Jupiter’s $n_J$ are nearly in a ratio of small integers — for a first-order resonance $(j+1)n_J - jn \approx 0$ — the **resonant angle** $\varphi = (j+1)\lambda_J - j\lambda - \varpi$ (for the 2:1 resonance $\varphi = 2\lambda_J - \lambda - \varpi$) changes slowly, and the corresponding term of the disturbing function no longer averages out. To lowest order it makes $\varphi$ obey a pendulum equation,
$$\ddot\varphi = -\omega_0^2\sin(\varphi - \varphi_0),\qquad \omega_0^2 \propto \mu\,e\,n^2,$$
so the phase portrait in $(\varphi, a)$ has a separatrix: inside it $\varphi$ **librates** and the semi-major axis oscillates about the exact resonance, outside it circulates. The libration width in $a$ grows like $\sqrt{\mu e}$ and the libration period like $1/\sqrt{\mu e}$. The model fails at small $e$, where the precession of the pericentre $\dot\varpi$ (neglected here) dominates.`,
      idea: String.raw`Write the disturbing function of Jupiter (orbital elements, 1.1) as a Fourier series in the angles; near the commensurability one combination varies slowly while all others average to zero over a synodic period. Lagrange’s equation $\dot n = (3/a^2)\,\partial\bar R/\partial\varphi$ together with $\dot\varphi = 2n_J - n$ gives $\ddot\varphi = -(3/a^2)\,d\bar R/d\varphi$: a particle in the potential $(3/a^2)\bar R(\varphi)$, i.e. the pendulum of mech 4.15 with its separatrix. Here $\bar R(\varphi)$ is computed by averaging the full disturbing function numerically at fixed $\varphi$, rather than from a truncated series.`,
      caption: String.raw`Left: the pendulum model’s phase portrait for an asteroid near Jupiter’s 2:1 resonance (3.28 AU), built from the numerically averaged disturbing function for the eccentricity you choose; the bold curve is the separatrix. Drag the gold point to choose a starting resonant angle and semi-major axis: the dots are the asteroid’s osculating $(\varphi, a)$ from a full restricted-three-body integration of several libration periods. Inside the separatrix it librates, outside it circulates. Right: the same orbit in the frame rotating with Jupiter — a resonant orbit traces a closed pattern. Lower the eccentricity and the model’s separatrix shrinks faster than the true resonance zone.`,
      deps: ['astro-1.1', 'mech-4.15'],
      see: ['astro-2.4'],
      refs: ['Murray–Dermott §8.6', 'Murray–Dermott §8.7'],
      tags: ['resonance', 'pendulum', 'asteroids'],
      viz(v) {
        const mu = MU_SJ, ares = Math.pow(0.5, 2 / 3) * Math.cbrt(1 - mu); // exact 2:1 commensurability (units of a_J)
        const eS = v.slider('asteroid eccentricity $e$', 0.03, 0.3, 0.15, { step: 0.005 });
        const ph = v.stage({ x: [-180, 180], y: [3.08, 3.48], axes: 'box', height: 360, weight: 1.3, xlabel: 'resonant angle $\\varphi = 2\\lambda_J - \\lambda - \\varpi$ (°)', ylabel: 'semi-major axis (AU)', title: 'pendulum model and the true motion', xticks: [-180, -90, 0, 90, 180] });
        const rot = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, axes: false, height: 360, weight: 1, title: 'frame rotating with Jupiter' });
        const H = ph.handle(0, 3.33, { color: 'gold', r: 7, label: 'start', labelPos: 'ne' });
        const cacheR = memo(), cacheI = memo();
        // averaged disturbing function per unit μ, at fixed φ, over 2 synodic cycles (λ from 0 to 4π)
        const Rbar = (phi, a, e) => { const N = 480; let s = 0; for (let k = 0; k < N; k++) { const lam = (2 * TAU * (k + 0.5)) / N, E = kepE(lam, e), x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E), lp = (phi + lam) / 2, X = Math.cos(lp), Y = Math.sin(lp); s += 1 / Math.hypot(x - X, y - Y) - (x * X + y * Y); } return (mu * s) / N; };
        let cur = null;
        v.render(() => {
          const e = eS.value;
          const M = cacheR(e, () => {
            const grid = []; for (let k = 0; k <= 72; k++) { const p = -Math.PI + (TAU * k) / 72; grid.push([p, (3 / ares ** 2) * Rbar(p, ares, e)]); }
            let lo = Infinity, hi = -Infinity, plo = 0; for (const [p, V] of grid) { if (V < lo) { lo = V; plo = p; } if (V > hi) hi = V; }
            const Vf = (p) => { let u = ((p + Math.PI) / TAU) * 72; u = ((u % 72) + 72) % 72; const i = Math.floor(u), f = u - i; return grid[i][1] * (1 - f) + grid[i + 1][1] * f; };
            const dp = TAU / 72, i0 = grid.findIndex((g) => g[0] === plo), w0 = Math.sqrt(Math.max(1e-12, (grid[(i0 + 1) % 72][1] + grid[(i0 + 71) % 72][1] - 2 * lo) / (dp * dp)));
            const pdmax = Math.sqrt(2 * (hi - lo)), nTo = (n) => Math.pow(n / Math.sqrt(1 - mu), -2 / 3);
            return { Vf, lo, hi, plo, w0, width: (nTo(2 - pdmax) - nTo(2 + pdmax)) / 2 };
          });
          const En = (pdeg, aAU) => { const a = aAU / AJ, n = Math.sqrt((1 - mu) / a ** 3), pd = 2 - n; return 0.5 * pd * pd + M.Vf(pdeg * DEG); };
          const Es = M.hi;
          ph.contour(En, [M.lo + 0.15 * (Es - M.lo), M.lo + 0.4 * (Es - M.lo), M.lo + 0.7 * (Es - M.lo), Es + 0.5 * (Es - M.lo), Es + 1.6 * (Es - M.lo), Es + 3.5 * (Es - M.lo)], { color: 'faint', width: 1, res: 150 });
          ph.contour(En, [Es], { color: 'ink', width: 2, res: 240 });
          ph.hline(ares * AJ, { color: 'faint', width: 1, dash: [3, 4] });
          ph.text('exact 2:1', 178, ares * AJ, { color: 'muted', size: 10, dy: -8, align: 'right' });
          // full integration from the handle (skip while dragging)
          let F = null;
          if (!H.dragging) {
            F = cacheI(`${e}|${H.x.toFixed(2)}|${H.y.toFixed(4)}`, () => {
              const phi0 = H.x * DEG, a0 = H.y / AJ, w = -phi0 / 2;
              const Hs = fromElements(1 - mu, a0, e, 0, 0, w, 0), s0 = helioToRotating(mu, Hs, 0);
              const Tlib = TAU / M.w0, T = Math.min(Math.max(2.2 * Tlib, 300), 900);
              const r = cr3bp(mu, s0, { T, eta: 0.03, hmax: 0.05, every: 0.6, maxSteps: 200000 });
              const pts = r.s.map((q, k) => { const t = r.t[k], el = helio(mu, q, t); return [wrap180((2 * t - el.lambda - el.varpi) / DEG), el.a * AJ, el.e, q]; });
              let amin = Infinity, amax = -Infinity, pmin = Infinity, pmax = -Infinity, emin = Infinity, emax = -Infinity;
              for (const p of pts) { amin = Math.min(amin, p[1]); amax = Math.max(amax, p[1]); pmin = Math.min(pmin, p[0]); pmax = Math.max(pmax, p[0]); emin = Math.min(emin, p[2]); emax = Math.max(emax, p[2]); }
              return { pts, amin, amax, pmin, pmax, emin, emax, T, lib: pmax - pmin < 300 };
            });
            ph.dots(F.pts.map((p) => [p[0], p[1]]), { r: 1.7, color: F.lib ? 'accent' : 'red', alpha: 0.7 });
            rot.path(F.pts.map((p) => [p[3][0], p[3][1]]), { color: F.lib ? 'accent' : 'red', width: 0.8, alpha: 0.55 });
          }
          rot.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          rot.dot(-mu, 0, { r: 6, color: 'gold' }); rot.dot(1 - mu, 0, { r: 5, color: 'orange' });
          rot.text('Jupiter', 1 - mu, 0, { color: 'orange', size: 10.5, dy: 13, align: 'center' });
          rot.corner('units of Jupiter’s orbit', 'bl', { color: 'faint', size: 10.5 });
          cur = { M, F, e };
        });
        v.legend([['ink', 'separatrix of the pendulum model'], ['accent', 'librating orbit (full integration)', { dot: true }], ['red', 'circulating orbit', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { M, F, e } = cur;
          let out = String.raw`pendulum model at $e = ${v.fix(e, 3)}$: centre $\varphi_0 = ${v.fix(M.plo / DEG, 0)}^\circ$, half-width of the resonance $\Delta a = ${v.fix(M.width * AJ, 4)}$ AU, small-libration period $2\pi/\omega_0 = ${v.fix(TAU / M.w0 / TAU * PJ, 0)}$ yr`;
          if (!F) return out + ' · release the handle to integrate';
          if (F.lib) out += String.raw` · integration: librates, $\varphi$ within ${v.fix(F.pmin, 0)}°…${v.fix(F.pmax, 0)}°, $a$ = ${v.fix(F.amin, 3)}–${v.fix(F.amax, 3)} AU, $e$ = ${v.fix(F.emin, 3)}–${v.fix(F.emax, 3)}`;
          else out += ' · integration: φ circulates — the orbit is outside the resonance';
          if (e < 0.06) out += ' · at this small e the neglected pericentre precession matters: the true resonance zone no longer matches the pendulum';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Phenomenon',
      name: 'Kirkwood gaps',
      statement: String.raw`The distribution of asteroid semi-major axes in the main belt has sharp gaps where an asteroid’s period would be a simple fraction of Jupiter’s: at the 3:1 (2.50 AU), 5:2 (2.82 AU), 7:3 (2.96 AU) and 2:1 (3.28 AU) mean-motion resonances, at $a_J(q/p)^{2/3}$ for the resonance $p{:}q$. Inside these resonances Jupiter’s periodic forcing, combined with its slight eccentricity, drives chaotic growth of the asteroids’ eccentricities until their orbits cross those of Mars or the Earth and they are removed by encounters or collisions. Not every resonance is a gap: the 3:2 resonance (3.97 AU) holds the Hilda group, and the 1:1 resonance holds the Trojans.`,
      idea: String.raw`A mean-motion resonance (2.8) makes Jupiter’s tugs add up instead of cancelling. For the 3:1 and 2:1 resonances with Jupiter on its eccentric orbit, the resonant and secular terms overlap and the motion becomes chaotic (Wisdom 1982–83), producing sudden excursions to $e \gtrsim 0.3$ — enough to reach Mars-crossing perihelia below 1.5 AU — on timescales of $10^5$–$10^6$ years. Resonances further from Jupiter or of higher order are weaker, so their gaps are narrower; some resonant configurations protect bodies from close approaches instead (Hildas, Trojans, 2.4).`,
      caption: String.raw`Top: real data — the semi-major axes of all 895 910 numbered asteroids (JPL Small-Body Database, Oct 2026) in 0.01-AU bins, with Jupiter’s main resonances marked. Hover to read a bin; toggle the log scale to see the sparse outer belt, the Hildas at 3:2 and the Trojans at 1:1. Bottom: a numerical experiment — 240 test asteroids ($e_0 = 0.05$) integrated with Jupiter in the planar elliptic restricted problem; each dot is the largest eccentricity reached so far, and red dots have become Mars-crossing and are removed. To compress hundreds of thousands of years into 3000, Jupiter’s mass is multiplied by ten (switch it off to see how slow the real effect is). Make Jupiter’s orbit circular and the 3:1 asteroids stop being removed.`,
      deps: ['astro-2.8'],
      refs: ['Murray–Dermott §9.8'],
      tags: ['asteroids', 'resonance', 'data'],
      credit: 'Kirkwood, 1866',
      viz(v) {
        const counts = KW.split(',').map(Number), edges = counts.map((_, k) => 1.70 + 0.01 * k).concat([5.40]);
        const RES = [[4, 1], [3, 1], [5, 2], [7, 3], [2, 1], [3, 2], [1, 1]].map(([p, q]) => ({ p, q, a: AJ * Math.pow(q / p, 2 / 3) * Math.cbrt(1 / (1 + 9.5479e-4)) }));
        const logS = v.toggle('log scale', false);
        const boost = v.toggle('Jupiter ×10 (compress time)', true);
        const eccJ = v.toggle('Jupiter’s orbit eccentric (e = 0.048)', true);
        const h = v.stage({ x: [1.7, 5.4], y: [0, 14000], axes: 'box', height: 290, full: true, hover: true, xlabel: 'semi-major axis (AU)', ylabel: 'asteroids per 0.01 AU', title: 'real asteroids: semi-major axes of the numbered asteroids' });
        const sim = v.stage({ x: [1.95, 3.65], y: [0, 0.6], axes: 'box', height: 250, full: true, xlabel: 'initial semi-major axis (AU)', ylabel: 'largest e so far', title: 'numerical experiment: eccentricity pumping by Jupiter' });
        const N = 240, gm = GSUN, mp0 = 9.5479e-4, DT = 0.25, YEARS = 3000, STEPS = Math.round(YEARS / DT);
        let S = null;
        const init = (key) => {
          const r = v.rng(11), P = new Float64Array(4 * N), a0 = [];
          for (let i = 0; i < N; i++) { const a = 2.0 + (1.6 * (i + 0.5)) / N; a0.push(a); const H = fromElements(gm, a, 0.05, 0, 0, r() * TAU, r() * TAU); P[4 * i] = H[0]; P[4 * i + 1] = H[1]; P[4 * i + 2] = H[3]; P[4 * i + 3] = H[4]; }
          S = { key, P, dead: new Uint8Array(N), emax: new Float64Array(N).fill(0.05), a0, t: 0, steps: 0 };
        };
        const advance = (n) => {
          const mp = mp0 * (boost.value ? 10 : 1), ep = eccJ.value ? 0.0489 : 0;
          while (n > 0 && S.steps < STEPS) {
            const k = Math.min(n, 40, STEPS - S.steps);
            S.t = ertbpSteps(S.P, S.dead, gm, mp, AJ, ep, S.t, DT, k);
            S.steps += k; n -= k;
            for (let i = 0; i < N; i++) { if (S.dead[i]) continue; const el = pEl(S.P, i, gm); if (el.e > S.emax[i]) S.emax[i] = el.e; if (!(el.a > 0) || el.a * (1 - el.e) < 1.52 || el.a * (1 + el.e) > 4.6) { S.dead[i] = 1; S.emax[i] = Math.max(S.emax[i], Math.min(el.e, 0.58)); } }
          }
        };
        let lastT = 0, cur = null;
        v.animate((t) => {
          // real histogram
          const lg = logS.value;
          h.setScale({ ylog: lg, y: lg ? [5, 30000] : [0, 14000] });
          h.hist({ edges, counts: counts.map((c) => (lg ? Math.max(c, 0.001) : c)) }, { color: 'accent', fillAlpha: 0.45, gap: 0 });
          for (const R of RES) {
            const protect = (R.p === 3 && R.q === 2) || R.p === 1;
            h.vline(R.a, { color: protect ? 'green' : 'red', width: 1, dash: [3, 3], alpha: 0.8 });
            h.text(`${R.p}:${R.q}`, R.a, lg ? 22000 : 13300, { color: protect ? 'green' : 'red', size: 10.5, align: 'center' });
          }
          h.text('Hildas', AJ * Math.pow(2 / 3, 2 / 3), lg ? 9000 : 2500, { color: 'green', size: 10, dy: -4, align: 'center' });
          h.text('Trojans', 5.2, lg ? 2000 : 2500, { color: 'green', size: 10, align: 'center' });
          if (h.pointer.inside) {
            const k = Math.floor((h.pointer.x - 1.7) / 0.01);
            if (k >= 0 && k < counts.length) { h.vline(1.705 + 0.01 * k, { color: 'ink', width: 1, alpha: 0.4 }); h.corner(`${v.fix(1.7 + 0.01 * k, 2)}–${v.fix(1.71 + 0.01 * k, 2)} AU: ${counts[k].toLocaleString('en-US')} asteroids`, 'tr', { color: 'ink', size: 11.5 }); }
          }
          // numerical experiment, advanced incrementally
          const key = `${boost.value}|${eccJ.value}`;
          if (!S || S.key !== key || t < lastT - 1e-9) init(key);
          lastT = t;
          const target = Math.min(STEPS, Math.floor((t / 8) * STEPS));
          if (target > S.steps) advance(v.playing ? Math.min(target - S.steps, 160) : target - S.steps);
          for (const R of RES.slice(0, 5)) sim.vline(R.a, { color: 'red', width: 1, dash: [3, 3], alpha: 0.6 });
          sim.hline(0.05, { color: 'faint', width: 1 });
          const live = [], dead = [];
          for (let i = 0; i < N; i++) (S.dead[i] ? dead : live).push([S.a0[i], S.emax[i]]);
          sim.dots(live, { r: 2.6, color: 'accent' });
          sim.dots(dead, { r: 3.2, color: 'red' });
          sim.corner(`${v.fix(S.t, 0)} yr of ${YEARS}${boost.value ? ' (Jupiter ×10)' : ''} · removed: ${dead.length}`, 'tl', { color: 'muted', size: 11.5 });
          for (const R of RES.slice(0, 5)) sim.text(`${R.p}:${R.q}`, R.a, 0.57, { color: 'red', size: 10, align: 'center' });
          cur = { dead: dead.length, t: S.t };
        }, { period: 1e9, still: 9 });
        v.legend([['accent', 'asteroids (top) / test particles (bottom)', { area: true }], ['red', 'gap-forming resonances; removed particles'], ['green', 'resonances that host groups']]);
        v.readout(() => {
          const at = (a) => counts[Math.round((a - 1.7) / 0.01)], near = (a) => Math.round((at(a - 0.06) + at(a + 0.06)) / 2);
          const R31 = RES[1].a, R52 = RES[2].a, R21 = RES[4].a;
          let out = String.raw`real belt: at the 3:1 (${v.fix(R31, 3)} AU) ${at(R31)} asteroids per bin vs about ${near(R31).toLocaleString('en-US')} on either side; 5:2 (${v.fix(R52, 3)} AU) ${at(R52)}; 2:1 (${v.fix(R21, 3)} AU) ${at(R21)}`;
          if (cur) out += ` · experiment: ${cur.dead} of 240 test asteroids removed after ${v.fix(cur.t, 0)} years${!eccJ.value ? ' — with Jupiter on a circular orbit the 3:1 asteroids only librate and survive' : ''}${!boost.value ? ' — with Jupiter’s real mass the removal takes 10⁵–10⁶ years, far longer than shown' : ''}`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Phenomenon',
      name: 'Laplace resonance of Io, Europa and Ganymede',
      statement: String.raw`The mean motions of Jupiter’s inner three Galilean moons satisfy, to the precision of the best ephemerides,
$$n_I - 3n_E + 2n_G = 0,$$
and their mean longitudes are locked so that the **Laplace angle** $\Phi_L = \lambda_I - 3\lambda_E + 2\lambda_G$ librates about $180^\circ$ with an amplitude of only a few hundredths of a degree (period about 2000 days). Their periods are close to 1 : 2 : 4, but not exactly: $n_I - 2n_E$ and $n_E - 2n_G$ are both equal to about $0.7395^\circ$/day, the common regression rate of the pericentres. A consequence is that **triple conjunctions never occur**: whenever Io and Europa line up, Ganymede is $90^\circ$ away, and when Europa and Ganymede line up, Io is on the far side of Jupiter.`,
      idea: String.raw`Io–Europa and Europa–Ganymede are each in a 2:1 mean-motion resonance (2.8), with resonant angles $\lambda_I - 2\lambda_E + \varpi$ and $\lambda_E - 2\lambda_G + \varpi'$; the pericentres involved precess together, so subtracting the two angles eliminates them and leaves the three-body angle $\Phi_L$. Tidal friction (which pushes Io outward) is thought to have driven the moons into this chain and keeps their eccentricities forced. At a triple conjunction all three mean longitudes would be equal, giving $\Phi_L = 0$, which the libration about $180^\circ$ excludes.`,
      caption: String.raw`The three moons orbiting Jupiter with their real mean motions (Sampson’s theory, as tabulated by the Bureau des Longitudes: $203.488992^\circ$, $101.374762^\circ$, $50.317646^\circ$ per day) and the observed $\Phi_L = 180^\circ$; radii to scale. Coloured lines flash at conjunctions (green Io–Europa, pink Europa–Ganymede). Right: the Laplace angle over ten years, and the smallest arc that ever contains all three moons. Perturb Ganymede’s mean motion: the angle starts to drift and, within a few years, all three moons line up.`,
      deps: ['astro-2.8'],
      see: ['astro-1.3'],
      refs: ['Murray–Dermott §8.17'],
      tags: ['resonance', 'satellites', 'Jupiter'],
      credit: 'Laplace, 1788',
      viz(v) {
        const N0 = [203.488992435, 101.374761672, 50.317646290], RAD = [421700 / 71492, 671034 / 71492, 1070412 / 71492];
        const NAMES = ['Io', 'Europa', 'Ganymede'], COL = ['gold', 'teal', 'purple'];
        const dn = v.slider('perturb Ganymede’s mean motion by δn (°/day)', -0.01, 0.01, 0, { step: 0.0002, decimals: 4 });
        const sp = v.slider('speed (days per second)', 0.5, 8, 2, { step: 0.5 });
        const s = v.stage({ x: [-17, 17], y: [-17, 17], equal: true, axes: false, height: 360, weight: 1, title: 'seen from above Jupiter’s pole' });
        const g = v.stage({ x: [0, 3650], y: [0, 360], axes: 'box', height: 360, weight: 1.2, xlabel: 'time (days)', ylabel: 'angle (°)', title: 'Laplace angle and the tightest grouping', yticks: [0, 90, 180, 270, 360] });
        // epoch longitudes: Io and Ganymede arbitrary, Europa set by Φ_L = 180°
        const L0 = [100, (100 + 2 * 30 - 180) / 3, 30];
        const spread = (a) => { const s3 = a.map((x) => ((x % 360) + 360) % 360).sort((p, q) => p - q); const gaps = [s3[1] - s3[0], s3[2] - s3[1], 360 - s3[2] + s3[0]]; return 360 - Math.max(...gaps); };
        const cache = memo();
        const hist = () => cache(dn.value, () => {
          const n = [N0[0], N0[1], N0[2] + dn.value], out = [], minS = [];
          let mn = 360, tmin = 0;
          for (let t = 0; t <= 3650; t += 0.05) {
            const lam = L0.map((l, k) => l + n[k] * t), sp3 = spread(lam);
            if (sp3 < mn) { mn = sp3; tmin = t; }
            if (Math.abs((t * 20) % 100) < 1e-6) { out.push([t, ((lam[0] - 3 * lam[1] + 2 * lam[2]) % 360 + 360) % 360]); minS.push([t, mn]); }
          }
          return { out, minS, mn, tmin, n };
        });
        let cur = null;
        v.animate((tt) => {
          const H = hist(), day = tt * sp.value, n = H.n, lam = L0.map((l, k) => (l + n[k] * day) * DEG);
          for (let k = 0; k < 3; k++) s.circle(0, 0, RAD[k], { color: COL[k], width: 1, alpha: 0.4 });
          s.dot(0, 0, { r: 9, color: 'orange' });
          const P = lam.map((l, k) => [RAD[k] * Math.cos(l), RAD[k] * Math.sin(l)]);
          const conj = (i, j, c) => { const d = Math.abs(wrap180((lam[i] - lam[j]) / DEG)); if (d < 4) { s.line(0, 0, 16.5 * Math.cos(lam[j]), 16.5 * Math.sin(lam[j]), { color: c, width: 2.4, alpha: 1 - d / 4 }); } };
          conj(0, 1, 'green'); conj(1, 2, 'pink');
          for (let k = 0; k < 3; k++) { s.dot(P[k][0], P[k][1], { r: 6, color: COL[k] }); s.text(NAMES[k], P[k][0], P[k][1], { color: COL[k], size: 10.5, dy: -11, align: 'center' }); }
          const PhL = ((lam[0] - 3 * lam[1] + 2 * lam[2]) / DEG % 360 + 360) % 360;
          s.corner(`day ${v.fix(day % 3650, 1)} · $\\Phi_L = ${v.fix(PhL, 2)}^\\circ$`, 'tl', { color: 'muted', size: 12 });
          // time panel
          g.hline(180, { color: 'faint', width: 1, dash: [4, 4] });
          g.path(H.out.filter((q, k, a) => k === 0 || Math.abs(q[1] - a[k - 1][1]) < 180), { color: 'accent', width: 2 });
          g.path(H.minS, { color: 'red', width: 1.8 });
          g.vline(day % 3650, { color: 'gold', width: 1.2 });
          g.tex('\\Phi_L', 60, H.out[0][1], { color: 'accent', size: 14, dy: -12, align: 'left' });
          g.text('smallest arc holding all three so far', 3600, H.minS[H.minS.length - 1][1], { color: 'red', size: 10.5, dy: -9, align: 'right' });
          cur = { H, PhL };
        }, { period: 1e9, still: 7.3 });
        v.legend([['accent', 'Laplace angle $\\Phi_L$'], ['red', 'tightest grouping of the three moons'], ['green', 'Io–Europa conjunction'], ['pink', 'Europa–Ganymede conjunction']]);
        v.readout(() => {
          if (!cur) return '';
          const { H } = cur, n = H.n;
          return String.raw`$n_I - 3n_E + 2n_G = ${v.fix(n[0] - 3 * n[1] + 2 * n[2], 9)}$ °/day, while $n_I - 2n_E = ${v.fix(n[0] - 2 * n[1], 5)}$ and $n_E - 2n_G = ${v.fix(n[1] - 2 * n[2], 5)}$ °/day (pericentre regression) · in ten years the three moons are never within ${v.fix(H.mn, 2)}° of each other${dn.value === 0 ? ' — exactly 60° is the closest a Φ_L = 180° configuration allows (Io and Ganymede together, Europa 60° away)' : H.mn < 5 ? ` — with the perturbation they all line up (day ${v.fix(H.tmin, 0)}): a triple conjunction` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Phenomenon',
      name: 'Kozai–Lidov oscillations',
      statement: String.raw`Consider an inner orbit (eccentricity $e$, inclination $i$ relative to the plane of a distant outer perturber) in a hierarchical triple. To quadrupole order in $a/a_{\rm out}$ and averaged over both orbits, $a$ is constant and the component of the inner orbit’s angular momentum along the outer orbit’s axis is conserved:
$$\Theta = \sqrt{1-e^2}\,\cos i = \text{const}.$$
If $39.2^\circ < i_0 < 140.8^\circ$ (i.e. $\cos^2 i_0 < 3/5$), the circular orbit is unstable: $e$ and $i$ oscillate in antiphase — the orbit trades inclination for eccentricity — on the Kozai–Lidov timescale $t_{KL} \sim \frac{M_{\rm in}}{m_{\rm out}}\big(\frac{a_{\rm out}}{a}\big)^3(1-e_{\rm out}^2)^{3/2}\,\frac{1}{n}$, reaching $e_{\max} = \sqrt{1 - \tfrac53\cos^2 i_0}$ from $e_0 \approx 0$, while $\omega$ librates about $90^\circ$ or $270^\circ$. Extra apsidal precession (general relativity, tides, oblateness) faster than $1/t_{KL}$ suppresses the oscillations.`,
      idea: String.raw`Averaging (as in secular theory, 2.7, via canonical perturbation theory, mech 12.21) the perturber’s tidal potential over both orbits leaves a function of $e$, $i$ and $\omega$ only. It is axisymmetric about the outer orbit’s axis, so the conjugate momentum of the node — $\sqrt{a(1-e^2)}\cos i$ — is conserved, and with the averaged energy this makes the problem integrable: the trajectories in the $(\omega, e)$ plane are level curves of $(2+3e^2)(3\cos^2 i - 1) + 15e^2\sin^2 i\cos 2\omega$ with $\cos i$ eliminated through $\Theta$. Below $39.2^\circ$ the level curves near $e = 0$ are closed circles; above it the origin becomes a saddle and the curves sweep out to large $e$.`,
      caption: String.raw`The vector secular equations (test-particle quadrupole limit) are integrated in units of $t_{KL}$. Left and middle: $e(t)$ and $i(t)$ swing in antiphase above $39.2^\circ$; below it nothing happens. Right: the trajectory in the $(\omega, e)$ plane on the level curves of the averaged energy for the current $\Theta$; drag the gold point to choose $\omega_0$ and $e_0$. The readout checks that $\sqrt{1-e^2}\cos i$ stays constant and compares the largest $e$ with $\sqrt{1 - \tfrac53\cos^2 i_0}$. Add extra apsidal precession (for instance from general relativity) and the oscillations are quenched.`,
      deps: ['astro-1.1', 'mech-12.21'],
      see: ['astro-2.7'],
      refs: ['Murray–Dermott §7.11'],
      tags: ['secular', 'hierarchical triples', 'resonance'],
      credit: 'Lidov, 1961; Kozai, 1962',
      viz(v) {
        const iS = v.slider('initial inclination $i_0$', 0, 90, 65, { step: 0.5, fmt: (x) => `${v.fix(x, 1)}°` });
        const gS = v.slider('extra apsidal precession (units of $1/t_{KL}$)', 0, 3, 0, { step: 0.05 });
        const E = v.stage({ x: [0, 20], y: [0, 1], axes: 'box', height: 290, weight: 1, xlabel: 'time ($t_{KL}$)', ylabel: 'eccentricity e', title: 'eccentricity' });
        const I = v.stage({ x: [0, 20], y: [0, 90], axes: 'box', height: 290, weight: 1, xlabel: 'time ($t_{KL}$)', ylabel: 'inclination i (°)', title: 'inclination', yticks: [0, 30, 39.2, 60, 90] });
        const W = v.stage({ x: [0, 360], y: [0, 1], axes: 'box', height: 290, weight: 1.15, xlabel: 'argument of pericentre ω (°)', ylabel: 'e', title: 'phase portrait at fixed Θ', xticks: [0, 90, 180, 270, 360] });
        const Hh = W.handle(90, 0.05, { color: 'gold', r: 7, constrain: (x, y) => [clamp(x, 0, 360), clamp(y, 0.002, 0.95)] });
        const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const cache = memo();
        const run = () => cache(`${iS.value}|${gS.value}|${Hh.x.toFixed(2)}|${Hh.y.toFixed(4)}`, () => {
          const i0 = iS.value * DEG, e0 = Hh.y, w0 = Hh.x * DEG, eps = gS.value;
          let e = [e0 * Math.cos(w0), e0 * Math.sin(w0) * Math.cos(i0), e0 * Math.sin(w0) * Math.sin(i0)];
          let j = [0, -Math.sqrt(1 - e0 * e0) * Math.sin(i0), Math.sqrt(1 - e0 * e0) * Math.cos(i0)];
          const f = (ev, jv) => {
            const nz = [0, 0, 1], jn = jv[2], en = ev[2], exn = cross(ev, nz), jxn = cross(jv, nz), jxe = cross(jv, ev);
            const e2 = ev[0] ** 2 + ev[1] ** 2 + ev[2] ** 2, jl = Math.sqrt(jv[0] ** 2 + jv[1] ** 2 + jv[2] ** 2), wgr = eps / Math.max(1e-6, 1 - e2);
            const de = [0, 1, 2].map((k) => 0.75 * (jn * exn[k] + 2 * jxe[k] - 5 * en * jxn[k]) + (wgr * jxe[k]) / jl);
            const dj = [0, 1, 2].map((k) => 0.75 * (jn * jxn[k] - 5 * en * exn[k]));
            return [de, dj];
          };
          const out = []; let t = 0;
          const rec = () => { const en = Math.hypot(...e), jl = Math.hypot(...j), inc = Math.acos(clamp(j[2] / jl, -1, 1)); const node = [-j[1], j[0], 0], nn = Math.hypot(node[0], node[1]) || 1; let w = Math.acos(clamp((node[0] * e[0] + node[1] * e[1]) / (nn * (en || 1)), -1, 1)); if (e[2] < 0) w = TAU - w; out.push([t, en, inc, w, Math.sqrt(Math.max(0, 1 - en * en)) * Math.cos(inc)]); };
          rec();
          let lastRec = 0;
          while (t < 20) {
            const en = Math.hypot(...e), h = Math.min(0.01, 0.004 + 0.02 * (1 - en)), hh = Math.min(h, 20 - t);
            const [a1, b1] = f(e, j), e2 = e.map((c, k) => c + 0.5 * hh * a1[k]), j2 = j.map((c, k) => c + 0.5 * hh * b1[k]);
            const [a2, b2] = f(e2, j2), e3 = e.map((c, k) => c + 0.5 * hh * a2[k]), j3 = j.map((c, k) => c + 0.5 * hh * b2[k]);
            const [a3, b3] = f(e3, j3), e4 = e.map((c, k) => c + hh * a3[k]), j4 = j.map((c, k) => c + hh * b3[k]);
            const [a4, b4] = f(e4, j4);
            e = e.map((c, k) => c + (hh / 6) * (a1[k] + 2 * a2[k] + 2 * a3[k] + a4[k])); j = j.map((c, k) => c + (hh / 6) * (b1[k] + 2 * b2[k] + 2 * b3[k] + b4[k]));
            t += hh;
            if (t - lastRec >= 0.02 || t >= 20) { rec(); lastRec = t; }
          }
          return { out, Th: out[0][4] };
        });
        let cur = null;
        v.render(() => {
          const D = run(), Th = D.Th, out = D.out;
          const crit = Math.acos(Math.sqrt(0.6)) / DEG;
          E.path(out.map((r) => [r[0], r[1]]), { color: 'accent', width: 2 });
          I.hline(crit, { color: 'red', width: 1, dash: [4, 4] });
          I.text('39.2°', 19.8, crit, { color: 'red', size: 10.5, dy: -9, align: 'right' });
          I.path(out.map((r) => [r[0], r[2] / DEG]), { color: 'purple', width: 2 });
          const i0 = iS.value * DEG, emx = Math.cos(i0) ** 2 < 0.6 ? Math.sqrt(1 - (5 / 3) * Math.cos(i0) ** 2) : NaN;
          if (isFinite(emx)) { E.hline(emx, { color: 'green', width: 1.2, dash: [5, 4] }); E.text('√(1 − 5/3 cos² i₀)', 19.8, emx, { color: 'green', size: 10.5, dy: -9, align: 'right' }); }
          // phase portrait: F(e, ω) at fixed Θ, only where cos² i = Θ²/(1 − e²) ≤ 1
          const Fq = (wd, e) => { const c2 = (Th * Th) / (1 - e * e); if (c2 > 1) return NaN; return (2 + 3 * e * e) * (3 * c2 - 1) + 15 * e * e * (1 - c2) * Math.cos(2 * wd * DEG); };
          const elim = Math.sqrt(Math.max(0, 1 - Th * Th));
          W.rect(0, elim, 360, 1, { fill: 'ink', fillAlpha: 0.08, stroke: false });
          const F0 = Fq(Hh.x, Hh.y), lv = []; for (let k = -6; k <= 6; k++) lv.push(F0 + k * 0.35);
          W.contour(Fq, lv, { color: 'faint', width: 1, res: 140 });
          W.contour(Fq, [F0], { color: 'ink', width: 1.6, res: 200 });
          W.dots(out.map((r) => [r[3] / DEG, r[1]]), { r: 1.4, color: 'accent', alpha: 0.8 });
          W.text('forbidden: cos i would exceed 1', 180, Math.min(0.97, elim + 0.04), { color: 'muted', size: 10, align: 'center' });
          cur = { D, emx };
        });
        v.legend([['accent', 'eccentricity'], ['purple', 'inclination'], ['green', 'predicted $e_{\\max}$', { dash: true }], ['ink', 'level curve through the start (right)']]);
        v.readout(() => {
          if (!cur) return '';
          const { D, emx } = cur, out = D.out;
          let emaxM = 0, thDev = 0; for (const r of out) { emaxM = Math.max(emaxM, r[1]); thDev = Math.max(thDev, Math.abs(r[4] - D.Th)); }
          const iMin = Math.min(...out.map((r) => r[2])) / DEG;
          let s = String.raw`$\Theta = \sqrt{1-e^2}\cos i = ${v.fix(D.Th, 5)}$, constant to $${sci(v, thDev)}$ · largest $e$ = ${v.fix(emaxM, 4)}`;
          if (isFinite(emx) && gS.value === 0) s += String.raw` (prediction from $e_0 \to 0$: $\sqrt{1 - \tfrac53\cos^2 i_0} = ${v.fix(emx, 4)}$), inclination drops to ${v.fix(iMin, 1)}° (where $\cos^2 i = 3/5$ at $e_{\max}$ is ${v.fix(Math.acos(Math.sqrt(0.6)) / DEG, 1)}°)`;
          else if (!isFinite(emx)) s += ' — below 39.2°: the circular orbit is stable and e stays small';
          if (gS.value > 0) s += ' · extra precession detunes the resonance between ω and the tidal torque: oscillations shrink';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Phenomenon',
      name: 'Chaos and the long-term stability of the solar system',
      statement: String.raw`Orbits in the solar system can be **chaotic**: nearby trajectories separate exponentially, $\delta(t)\approx\delta_0 e^{t/T_L}$, with Lyapunov time $T_L$. Asteroids in or near overlapping resonances with Jupiter have $T_L$ of thousands of years or less. For the planets themselves, numerical integrations of the averaged equations (Laskar 1989) and of the full equations (Sussman & Wisdom 1992) give $T_L \approx 5$ Myr for the inner planets, so an error of 15 m in the Earth’s position today grows to about 1 AU after roughly 100 Myr: the precise configuration of the solar system cannot be predicted beyond that horizon. Chaos does not mean imminent instability — the planets’ semi-major axes stay nearly fixed — but in about 1% of possible futures Mercury’s eccentricity grows enough within 5 Gyr to cause collisions (Laskar & Gastineau 2009).`,
      idea: String.raw`Where resonances (2.8) are close enough that their separatrices overlap, a trajectory can wander between them; the separatrix regions become chaotic layers and the motion acquires a positive Lyapunov exponent (mech 13.4). The rate of divergence is measured by following two nearby orbits and repeatedly renormalising their separation (Benettin’s method). In the inner solar system the overlap involves secular resonances among the precession frequencies of Earth and Mars and of Mercury, Venus and Jupiter, so the chaos is slow, and secular theory (2.7) on its own would miss it.`,
      caption: String.raw`Left: drag the gold point to choose an asteroid’s initial semi-major axis and eccentricity (Jupiter’s main resonances marked). Middle: the separation of two copies of that asteroid, started $10^{-9}$ AU apart and integrated for 20 000 years with Jupiter on its real eccentric orbit, on a log scale (grey: a regular reference orbit at 2.75 AU, whose separation grows only linearly). A straight line means exponential divergence; its slope gives the Lyapunov time. Right: what $T_L = 5$ Myr means for the Earth — the growth of an initial position error; set the starting error and read off the prediction horizon.`,
      deps: ['astro-2.8', 'mech-13.4'],
      see: ['astro-2.9', 'astro-2.7'],
      refs: ['Murray–Dermott §9.2', 'Murray–Dermott §9.10'],
      tags: ['chaos', 'Lyapunov', 'solar system'],
      credit: 'Laskar, 1989; Sussman & Wisdom, 1992',
      viz(v) {
        const d0S = v.slider('initial error in the Earth’s position', -2, 4, Math.log10(15), { step: 0.05, fmt: (x) => { const m = 10 ** x; return m < 1 ? `${v.fix(m * 100, 0)} cm` : m < 1000 ? `${v.fix(m, m < 10 ? 1 : 0)} m` : `${v.fix(m / 1000, 1)} km`; } });
        const A = v.stage({ x: [2.2, 4.3], y: [0, 0.35], axes: 'box', height: 300, weight: 0.9, xlabel: 'a (AU)', ylabel: 'e', title: 'choose an asteroid' });
        const L = v.stage({ x: [0, 20], y: [-9, 3], axes: 'box', height: 300, weight: 1.1, xlabel: 'time (thousand years)', ylabel: 'log₁₀ separation (AU)', title: 'divergence of two nearby orbits' });
        const Ss = v.stage({ x: [0, 200], y: [-2, 13], axes: 'box', height: 300, weight: 1, xlabel: 'time from now (Myr)', ylabel: 'log₁₀ error (m)', title: 'the inner solar system, T_L ≈ 5 Myr' });
        const Hp = A.handle(3.85, 0.15, { color: 'gold', r: 7, constrain: (x, y) => [clamp(x, 2.2, 4.25), clamp(y, 0, 0.34)] });
        const gm = GSUN, mp = 9.5479e-4, ep = 0.0489, YEARS = 20000, DT = 0.2;
        const lyap = (a, e) => {
          const P = new Float64Array(8), dead = new Uint8Array(2), H = fromElements(gm, a, e, 0, 0, 1.0, 0.5), d0 = 1e-9;
          P[0] = H[0]; P[1] = H[1]; P[2] = H[3]; P[3] = H[4]; P[4] = H[0] + d0; P[5] = H[1]; P[6] = H[3]; P[7] = H[4];
          let t = 0, sum = 0; const out = [[0, -9]]; let fate = 'ok';
          const n = Math.round(YEARS / DT);
          for (let k = 0; k < n; k += 50) {
            t = ertbpSteps(P, dead, gm, mp, AJ, ep, t, DT, 50);
            if (dead[0] || dead[1]) { fate = 'escaped'; break; }
            const dx = P[4] - P[0], dy = P[5] - P[1], du = (P[6] - P[2]) * 0.1, dv = (P[7] - P[3]) * 0.1, dd = Math.hypot(dx, dy, du, dv);
            out.push([t / 1000, (sum + Math.log(dd)) / Math.LN10]);
            if (dd > 1e-6) { const f = d0 / dd; sum += Math.log(dd / d0); P[4] = P[0] + dx * f; P[5] = P[1] + dy * f; P[6] = P[2] + (du / 0.1) * f; P[7] = P[3] + (dv / 0.1) * f; }
            const el = pEl(P, 0, gm); if (!(el.a > 0) || el.a * (1 + el.e) > 4.9 || el.a * (1 - el.e) < 1.0) { fate = 'close approach to Jupiter or Mars-crossing'; break; }
          }
          // Lyapunov time from the slope over the second half of the run
          const half = out.filter((q) => q[0] >= out[out.length - 1][0] / 2);
          const fit = half.length > 3 ? v.M.linreg(half.map((q) => q[0]), half.map((q) => q[1])) : null;
          return { out, fate, TL: fit && fit.slope > 0 ? (1000 / (fit.slope * Math.LN10)) : Infinity, fit };
        };
        const cacheR = memo(), cacheC = memo();
        let cur = null;
        v.render(() => {
          // (a, e) chooser with resonances and Jupiter-/Mars-crossing limits
          for (const [p, q] of [[3, 1], [5, 2], [7, 3], [2, 1], [3, 2]]) { const a = AJ * Math.pow(q / p, 2 / 3); A.vline(a, { color: 'red', width: 1, dash: [3, 3], alpha: 0.7 }); A.text(`${p}:${q}`, a, 0.335, { color: 'red', size: 10, align: 'center' }); }
          A.fn((a) => 1 - 1.52 / a, { color: 'muted', width: 1.2, dash: [5, 4] });
          A.text('Mars-crossing', 2.3, 1 - 1.52 / 2.3, { color: 'muted', size: 10, dy: -8, align: 'left' });
          A.fn((a) => 4.9 / a - 1, { color: 'orange', width: 1.2, dash: [5, 4], domain: [3.8, 4.3] });
          A.dot(2.75, 0.05, { r: 4, color: 'muted' });
          const ref = cacheR(1, () => lyap(2.75, 0.05));
          let C = null;
          if (!Hp.dragging) C = cacheC(`${Hp.x.toFixed(3)}|${Hp.y.toFixed(3)}`, () => lyap(Hp.x, Hp.y));
          // divergence plot
          L.hline(-9, { color: 'faint', width: 1 });
          L.path(ref.out, { color: 'muted', width: 1.6 });
          if (C) {
            const chaotic = isFinite(C.TL) && C.TL < 4000;
            L.path(C.out, { color: chaotic ? 'red' : 'accent', width: 2 });
            if (C.fit && chaotic) L.fn((t) => C.fit.predict(t), { color: 'ink', width: 1, dash: [5, 4], domain: [C.out[C.out.length - 1][0] / 2, C.out[C.out.length - 1][0]] });
            const top = Math.max(3, Math.ceil(Math.max(...C.out.map((q) => q[1]))) + 1);
            L.setView([0, 20], [-9.5, top]);
          }
          L.text('regular orbit, 2.75 AU', 19.5, ref.out[ref.out.length - 1][1], { color: 'muted', size: 10.5, dy: 11, align: 'right' });
          // the solar system extrapolation (T_L = 5 Myr)
          const TL = 5, lg0 = d0S.value, AUm = Math.log10(1.496e11);
          Ss.hline(AUm, { color: 'red', width: 1.4, dash: [5, 4] });
          Ss.text('1 AU: Earth’s position unknown', 4, AUm, { color: 'red', size: 10.5, dy: -9, align: 'left' });
          Ss.hline(Math.log10(6.371e6), { color: 'faint', width: 1, dash: [3, 4] });
          Ss.text('Earth radius', 4, Math.log10(6.371e6), { color: 'muted', size: 10, dy: -8, align: 'left' });
          Ss.fn((t) => lg0 + t / (TL * Math.LN10), { color: 'accent', width: 2.2 });
          const hz = TL * Math.LN10 * (AUm - lg0);
          Ss.vline(hz, { color: 'green', width: 1.2, dash: [3, 3] });
          Ss.text(`${v.fix(hz, 0)} Myr`, hz, -1.5, { color: 'green', size: 11, dx: 5, align: 'left' });
          cur = { C, ref, hz };
        });
        v.legend([['red', 'chaotic orbit'], ['accent', 'regular orbit / error growth'], ['muted', 'regular reference']]);
        v.readout(() => {
          if (!cur) return '';
          const { C, ref, hz } = cur;
          let s = '';
          if (!C) s = 'release the handle to integrate';
          else if (C.fate !== 'ok') s = String.raw`$a = ${v.fix(Hp.x, 2)}$ AU, $e = ${v.fix(Hp.y, 2)}$: ${C.fate} after ${v.fix(C.out[C.out.length - 1][0] * 1000, 0)} yr${isFinite(C.TL) ? `; Lyapunov time before that ≈ ${v.fix(C.TL, 0)} yr` : ''}`;
          else if (isFinite(C.TL) && C.TL < 4000) s = String.raw`$a = ${v.fix(Hp.x, 2)}$ AU, $e = ${v.fix(Hp.y, 2)}$: separation grows by $10^{${v.fix(C.out[C.out.length - 1][1] + 9, 1)}}$ in 20 000 yr — chaotic, Lyapunov time $T_L \approx ${v.fix(C.TL, 0)}$ yr (${v.fix(C.TL / PJ, 0)} Jupiter orbits)`;
          else s = String.raw`$a = ${v.fix(Hp.x, 2)}$ AU, $e = ${v.fix(Hp.y, 2)}$: separation grows only by $10^{${v.fix(C.out[C.out.length - 1][1] + 9, 1)}}$ — like the regular reference ($10^{${v.fix(ref.out[ref.out.length - 1][1] + 9, 1)}}$), roughly linear in time: no measurable chaos in 20 000 yr`;
          return s + String.raw` · Earth: an error of $10^{${v.fix(d0S.value, 2)}}$ m reaches 1 AU after $T_L\ln(1\,\text{AU}/\delta_0) \approx ${v.fix(hz, 0)}$ Myr`;
        });
      },
    },
  ],
};
