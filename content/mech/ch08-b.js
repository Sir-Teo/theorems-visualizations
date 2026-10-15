// Classical Mechanics — Chapter 8: Central forces and orbits (part b: 8.9–8.15)

import { TAU, clamp, memo, rk4, centralOrbit, stateAt, kepEl, conicPts, span, sci, sun, BODIES } from './ch08.shared.js';

/** Unwound polar angle along an orbit record (same length as R.s). */
function unwound(R) {
  const out = [Math.atan2(R.s[0][1], R.s[0][0])];
  for (let i = 1; i < R.s.length; i++) {
    let d = Math.atan2(R.s[i][1], R.s[i][0]) - Math.atan2(R.s[i - 1][1], R.s[i - 1][0]);
    if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
    out.push(out[i - 1] + d);
  }
  return out;
}
/** Apsides of an orbit record: where r·v changes sign (skipping the first steps). Returns [{peri, t, phi, r}] with interpolated values. */
function apsides(R, phi) {
  const out = [];
  for (let i = 3; i < R.s.length; i++) {
    const A = R.s[i - 1], B = R.s[i], a0 = A[0] * A[2] + A[1] * A[3], a1 = B[0] * B[2] + B[1] * B[3];
    if ((a0 < 0 && a1 >= 0) || (a0 > 0 && a1 <= 0)) {
      const u = a0 / (a0 - a1);
      out.push({ peri: a0 < 0, t: R.t[i - 1] + u * (R.t[i] - R.t[i - 1]), phi: phi[i - 1] + u * (phi[i] - phi[i - 1]), r: Math.hypot(A[0], A[1]) + u * (Math.hypot(B[0], B[1]) - Math.hypot(A[0], A[1])) });
    }
  }
  return out;
}
/** Arc of radius rad about (cx, cy) from angle a0 to a1. */
function arc(s, cx, cy, rad, a0, a1, st) { s.curve((u) => [cx + rad * Math.cos(a0 + u * (a1 - a0)), cy + rad * Math.sin(a0 + u * (a1 - a0))], 0, 1, { n: 60, ...st }); }

// ring of mass m (G = 1), radius R, in its own plane: potential via the complete elliptic integral K (AGM)
const agm = (a, b) => { for (let i = 0; i < 40 && Math.abs(a - b) > 1e-15 * a; i++) { const a1 = (a + b) / 2; b = Math.sqrt(a * b); a = a1; } return a; };
const ellK = (k) => Math.PI / (2 * agm(1, Math.sqrt(1 - k * k)));
const ringU = (r, R, m) => (-(2 * m) / Math.PI) * ellK((2 * Math.sqrt(R * r)) / (R + r)) / (R + r);
const ringAcc = (r, R, m) => { const h = 1e-6 * r; return -(ringU(r + h, R, m) - ringU(r - h, R, m)) / (2 * h); };
/** First-order apsidal advance per orbit for a perturbing potential dU(r) (per unit mass), GM = 1, at semi-major axis a and
 *  eccentricity e: δφ = ∂/∂h[(2/h)∫₀^π r² δU dφ] at fixed energy, along the unperturbed ellipse (Landau & Lifshitz §15). */
function landauAdvance(dU, a, e, GM = 1) {
  const I = (h) => { const p = (h * h) / GM, ee = Math.sqrt(Math.max(0, 1 - p / a)), n = 1200; let s = 0; for (let i = 0; i < n; i++) { const ph = ((i + 0.5) * Math.PI) / n, r = p / (1 + ee * Math.cos(ph)); s += r * r * dU(r); } return ((2 / h) * s * Math.PI) / n; };
  const h0 = Math.sqrt(GM * a * (1 - e * e)), dh = h0 * 1e-6;
  return (I(h0 + dh) - I(h0 - dh)) / (2 * dh);
}
/** Simulated advance of the perihelion in one radial period (start at perihelion of the Newtonian ellipse, GM = a = 1). */
function simAdvance(acc, e, eta = 0.002) {
  const rp = 1 - e, f = (S) => { const r = Math.hypot(S[0], S[1]), q = acc(r) / r; return [S[2], S[3], q * S[0], q * S[1]]; };
  let S = [rp, 0, 0, Math.sqrt((1 + e) / (1 - e))], th = 0, prev = 0, rvPrev = 0;
  for (let n = 0; n < 400000; n++) {
    const r = Math.hypot(S[0], S[1]), v = Math.hypot(S[2], S[3]), h = eta * Math.min(r / v, Math.sqrt(r / Math.abs(acc(r))));
    const S2 = rk4(f, S, h), rv = S2[0] * S2[2] + S2[1] * S2[3];
    let d = Math.atan2(S2[1], S2[0]) - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
    if (n > 10 && rvPrev < 0 && rv >= 0) { // next perihelion inside this step: bisect for r·v = 0
      let lo = 0, hi = h; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2, Sm = rk4(f, S, m); if (Sm[0] * Sm[2] + Sm[1] * Sm[3] < 0) lo = m; else hi = m; }
      const Sf = rk4(f, S, (lo + hi) / 2); let dd = Math.atan2(Sf[1], Sf[0]) - prev; if (dd > Math.PI) dd -= TAU; if (dd < -Math.PI) dd += TAU;
      return th + dd - TAU;
    }
    th += d; prev = Math.atan2(S2[1], S2[0]); rvPrev = rv; S = S2;
  }
  return NaN;
}

export default {
  collection: 'mech',
  chapter: 8,
  items: [
    // ───────────────────────────────────────────────────────────── 8.9
    {
      num: '8.9',
      kind: 'Model',
      name: 'Kepler’s equation: position in time',
      statement: String.raw`For a body on a Kepler ellipse of semi-major axis $a$, eccentricity $0\le e<1$ and period $T$, passing perihelion at time $\tau$, define the **mean anomaly** $M = 2\pi(t-\tau)/T$, which grows uniformly, and the **eccentric anomaly** $E$ by projecting the body perpendicular to the major axis onto the auxiliary circle of radius $a$. Then
$$M = E - e\sin E\qquad\text{(Kepler’s equation)},$$
and the position follows from $r = a(1 - e\cos E)$ and the true anomaly $\nu$ with $\tan\tfrac\nu2 = \sqrt{\tfrac{1+e}{1-e}}\,\tan\tfrac E2$. For every $M$ the equation has exactly one solution, and the iteration $E_{k+1} = M + e\sin E_k$ converges to it from any start, with error shrinking at least by the factor $e$ per step; Newton’s method converges quadratically. There is no closed form for $E(M)$: this transcendental step is the whole difficulty of predicting where a planet is.`,
      idea: String.raw`By the area law (8.5) the area swept from perihelion is the fraction $M/2\pi$ of the whole ellipse. Squashing the auxiliary circle by $b/a$ turns it into the ellipse, so the swept focal sector equals $b/a$ times a circular sector of angle $E$ minus a triangle with base $ae$: area $=\tfrac12 ab\,(E - e\sin E)$, and equating with $\tfrac12 ab\,M$ gives Kepler’s equation. The map $g(E) = M + e\sin E$ has $|g'(E)| = e|\cos E|\le e<1$, so it is a contraction of $\mathbb R$ and the Banach fixed-point theorem (pma-9.23) gives existence, uniqueness and geometric convergence. As $e\to1$ the contraction constant approaches 1 and the iteration crawls.`,
      caption: String.raw`Press play: the orange “mean planet” goes round the auxiliary circle at constant speed (angle $M$); the real planet (gold) is found by solving Kepler’s equation for $E$ (purple) and projecting down onto the ellipse; the hollow ring is the planet from a direct numerical integration — they coincide. The shaded focal sector is the area swept since perihelion, always the fraction $M/2\pi$ of the ellipse. Right: the fixed-point iteration as a cobweb converging onto the green point. Push $e$ toward 1 and count how many more steps it takes.`,
      deps: ['mech-8.8', 'pma-9.23'],
      refs: ['Goldstein §3.8'],
      tags: ['Kepler', 'fixed point', 'anomaly'],
      credit: 'Kepler, 1609',
      scope: String.raw`Exact for the two-body Kepler problem with $e<1$ (hyperbolic orbits use the analogous $M = e\sinh H - H$); real planets drift slowly from it under perturbations.`,
      viz(v) {
        const ecc = v.slider('eccentricity $e$', 0, 0.99, 0.6, { step: 0.01 });
        const s = v.stage({ x: [-2.15, 1.25], y: [-1.15, 1.15], equal: true, axes: false, height: 330, weight: 1.25 });
        const c = v.stage({ x: [0, TAU], y: [0, TAU], axes: 'box', height: 330, xlabel: 'E (rad)', title: 'cobweb: $E_{k+1} = M + e\\sin E_k$ (zoomed on the root)' });
        const cache = memo(); let cur = null;
        const ode = () => cache(ecc.value, () => { const e = ecc.value; return centralOrbit((r) => -1 / (r * r), [1 - e, 0, 0, Math.sqrt((1 + e) / (1 - e))], { T: TAU, eta: 0.002, maxSteps: 200000 }); });
        v.animate((t) => {
          const e = ecc.value, a = 1, b = Math.sqrt(1 - e * e), cx = -a * e, M = ((TAU * t) / 12) % TAU;
          // fixed-point iteration and Newton
          const it = [M]; let E = M;
          for (let k = 0; k < 20000; k++) { const En = M + e * Math.sin(E); it.push(En); if (Math.abs(En - E) < 1e-12) { E = En; break; } E = En; }
          let En = e < 0.8 ? M : Math.PI, kN = 0; for (; kN < 60; kN++) { const d = (En - e * Math.sin(En) - M) / (1 - e * Math.cos(En)); En -= d; if (Math.abs(d) < 1e-14) { kN++; break; } }
          const px = cx + a * Math.cos(E), py = b * Math.sin(E), nu = Math.atan2(py, px);
          // ellipse, auxiliary circle, sector swept since perihelion
          s.circle(cx, 0, a, { color: 'faint', width: 1, dash: [4, 4] });
          const sec = [[0, 0]]; for (let k = 0; k <= 80; k++) { const Ek = (E * k) / 80; sec.push([cx + a * Math.cos(Ek), b * Math.sin(Ek)]); }
          s.poly(sec, { fill: 'accent', fillAlpha: 0.16, stroke: false });
          s.curve((u) => [cx + a * Math.cos(u), b * Math.sin(u)], 0, TAU, { color: 'ink', width: 1.8 });
          s.line(cx - a - 0.05, 0, cx + a + 0.05, 0, { color: 'faint', width: 1 });
          // anomalies
          const qx = cx + a * Math.cos(E), qy = a * Math.sin(E);
          s.line(cx, 0, cx + a * Math.cos(M), a * Math.sin(M), { color: 'orange', width: 1.4, alpha: 0.8 });
          s.line(cx, 0, qx, qy, { color: 'purple', width: 1.4 });
          s.line(qx, qy, px, py, { color: 'purple', width: 1, dash: [3, 3] });
          s.line(0, 0, px, py, { color: 'gold', width: 1.6 });
          arc(s, cx, 0, 0.22, 0, M, { color: 'orange', width: 2 });
          arc(s, cx, 0, 0.3, 0, E, { color: 'purple', width: 2 });
          arc(s, 0, 0, 0.16, 0, nu < 0 ? nu + TAU : nu, { color: 'gold', width: 2 });
          s.dot(cx, 0, { r: 2.5, color: 'muted' });
          sun(s, 0, 0, { r: 0.045 });
          s.dot(cx + a * Math.cos(M), a * Math.sin(M), { r: 5, color: 'orange', label: 'M', labelPos: M > Math.PI ? 'se' : 'ne' });
          s.dot(qx, qy, { r: 4, color: 'purple', label: 'E', labelPos: E > Math.PI ? 'sw' : 'nw' });
          const S = stateAt(ode(), M);
          s.dot(S[0], S[1], { r: 8, hollow: true, color: 'ink', width: 1.4 });
          s.dot(px, py, { r: 5.5, color: 'gold', label: 'ν', labelPos: 'e' });
          // cobweb
          let lo = Math.min(M, E), hi = Math.max(M, E); for (const q of it.slice(0, 60)) { lo = Math.min(lo, q); hi = Math.max(hi, q); }
          const mid = (lo + hi) / 2, half = Math.max(0.6, 0.62 * (hi - lo));
          c.setView([mid - half, mid + half], [mid - half, mid + half]);
          c.fn((x) => x, { color: 'muted', width: 1.2 });
          c.fn((x) => M + e * Math.sin(x), { color: 'blue', width: 2.2 });
          const web = [[it[0], it[0]]]; for (let k = 0; k < Math.min(it.length - 1, 60); k++) { web.push([it[k], it[k + 1]], [it[k + 1], it[k + 1]]); }
          c.path(web, { color: 'orange', width: 1.3 });
          c.dot(it[0], it[0], { r: 3.5, color: 'orange', label: 'E₀ = M', labelPos: 'se' });
          c.dot(E, E, { r: 5.5, color: 'green' });
          const err = Math.hypot(S[0] - px, S[1] - py);
          cur = { e, M, E, nu, nfp: it.length - 1, kN, err, r: Math.hypot(px, py), area: 0.5 * a * b * (E - e * Math.sin(E)) };
        }, { period: 12, still: 1.9 });
        v.legend([['orange', 'mean anomaly $M$'], ['purple', 'eccentric anomaly $E$'], ['gold', 'true anomaly $\\nu$'], ['ink', 'direct integration', { dot: true }], ['blue', '$M + e\\sin E$']]);
        v.readout(() => {
          if (!cur) return '';
          const { e, M, E, nu, nfp, kN, err, r, area } = cur, bound = e > 0 ? Math.ceil(Math.log(1e-12) / Math.log(e)) : 1;
          return String.raw`$M = ${v.fix(M, 4)}$, solved $E = ${v.fix(E, 6)}$ (check $E - e\sin E = ${v.fix(E - e * Math.sin(E), 6)}$), $\nu = ${v.fix(nu < 0 ? nu + TAU : nu, 4)}$, $r = a(1 - e\cos E) = ${v.fix(r, 4)}$ · swept area $\tfrac12 ab(E - e\sin E) = ${v.fix(area, 5)} = \tfrac M{2\pi}\,\pi ab$ · gap to the integrated orbit $${sci(v, err)}$ · iterations to $10^{-12}$: fixed point ${nfp} (contraction bound $\log 10^{-12}/\log e \approx ${bound}$), Newton ${kN}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.10
    {
      num: '8.10',
      kind: 'Definition',
      name: 'Laplace–Runge–Lenz vector',
      statement: String.raw`For a particle of mass $\mu$ in the inverse-square field $F = -k/r^2$, with momentum $\mathbf p$ and angular momentum $\mathbf L = \mathbf r\times\mathbf p$, the **Laplace–Runge–Lenz vector** is
$$\mathbf A = \mathbf p\times\mathbf L - \mu k\,\hat{\mathbf r}.$$
It is a constant of the motion. It lies in the orbital plane, points from the force centre to the perihelion, and has length $|\mathbf A| = \mu k\,e$; dotting it with $\mathbf r$ gives the orbit $r = (\ell^2/\mu k)/(1 + e\cos\phi)$ directly, with $\phi$ measured from $\mathbf A$. Its conservation is special to the exact inverse-square law: under any perturbation $\delta F(r)$ it turns, and its rate of turning is the precession of the perihelion.`,
      idea: String.raw`Differentiate: $\dot{\mathbf p} = -k\hat{\mathbf r}/r^2$ and $\dot{\mathbf L} = 0$ (2.8, 2.10), so $\tfrac{d}{dt}(\mathbf p\times\mathbf L) = -\tfrac{k}{r^2}\hat{\mathbf r}\times(\mu r^2\,\hat{\mathbf r}\times\dot{\hat{\mathbf r}}) = \mu k\,\dot{\hat{\mathbf r}}$, which is exactly the derivative of $\mu k\hat{\mathbf r}$: the two terms change in lockstep. At perihelion both terms point outward along $\hat{\mathbf r}$, which fixes the direction; the conic of 8.7 drops out of $\mathbf A\cdot\mathbf r = \ell^2 - \mu k r$. With an extra force $-\varepsilon/r^3$ the first derivative no longer matches the second, and $\mathbf A$ rotates.`,
      caption: String.raw`Press play. At the planet the blue arrow is $\mathbf p\times\mathbf L$ and the orange arrow is $-\mu k\hat{\mathbf r}$, laid head to tail; their sum (green) is copied to the Sun, where it always points at perihelion — both parts swing wildly around the orbit, but the sum does not move. Right: the directions of the three vectors against time — the blue and orange parts each turn through a full circle every orbit, the green sum stays put. Add the $1/r^3$ perturbation: the green arrow now creeps round, mostly near perihelion, and its turning per orbit matches the exact prediction.`,
      deps: ['mech-8.7', 'mech-2.8'],
      refs: ['Goldstein §3.9', 'Tong §4.3'],
      tags: ['conserved quantity', 'Kepler', 'symmetry'],
      credit: 'Hermann and Johann Bernoulli, 1710; Laplace, 1799; Runge 1919 and Lenz 1924',
      viz(v) {
        const ecc = v.slider('eccentricity $e$', 0.1, 0.8, 0.55, { step: 0.01 });
        const eps = v.slider('perturbation $\\varepsilon$ in $F = -k/r^2 - \\varepsilon/r^3$', 0, 0.12, 0, { step: 0.002 });
        const s = v.stage({ x: [-2.4, 1.2], y: [-1.5, 1.5], equal: true, axes: false, height: 330, weight: 1.25 });
        const g = v.stage({ x: [0, 6], y: [-180, 180], axes: 'box', height: 330, xlabel: 't / T', yticks: [-180, -90, 0, 90, 180], title: 'directions (degrees): the parts turn, the sum does not' });
        const NORB = 6, cache = memo(); let cur = null;
        const run = () => cache([ecc.value, eps.value].join('|'), () => {
          const e = ecc.value, ep = eps.value, T0 = TAU;
          const R = centralOrbit((r) => -1 / (r * r) - ep / r ** 3, [1 - e, 0, 0, Math.sqrt((1 + e) / (1 - e))], { T: NORB * T0 * 1.1, eta: 0.003, maxSteps: 200000 });
          const A = R.s.map((S) => { const r = Math.hypot(S[0], S[1]), h = S[0] * S[3] - S[1] * S[2]; return [S[3] * h - S[0] / r, -S[2] * h - S[1] / r]; });
          const dirPL = R.s.map((S) => { const h = S[0] * S[3] - S[1] * S[2]; return (Math.atan2(-S[2] * h, S[3] * h) * 180) / Math.PI; });
          const dirR = R.s.map((S) => (Math.atan2(-S[1], -S[0]) * 180) / Math.PI);
          const ang = []; let prev = 0; A.forEach((q, i) => { let a = Math.atan2(q[1], q[0]); if (i) { while (a - prev > Math.PI) a -= TAU; while (a - prev < -Math.PI) a += TAU; } ang.push(a); prev = a; });
          const ph = unwound(R), aps = apsides(R, ph).filter((q) => q.peri);
          const h = Math.sqrt((1 + e) * (1 - e)), gam = Math.sqrt(1 - ep / (h * h)), pred = TAU * (1 / gam - 1);
          const meas = aps.length >= 2 ? (aps[aps.length - 1].phi - 0) / aps.length - TAU : NaN;
          let dAng = 0; for (const a of ang) dAng = Math.max(dAng, Math.abs(a - ang[0]));
          let mag0 = Math.hypot(...A[0]), dMag = 0; for (const q of A) dMag = Math.max(dMag, Math.abs(Math.hypot(...q) - mag0));
          return { R, A, ang, aps, pred, meas, dAng, dMag, mag0, e, ep, T0, dirPL, dirR };
        });
        v.animate((t) => {
          const D = run(), simT = ((t / 4) * D.T0) % (NORB * D.T0), S = stateAt(D.R, simT);
          const r = Math.hypot(S[0], S[1]), h = S[0] * S[3] - S[1] * S[2], pL = [S[3] * h, -S[2] * h], rh = [-S[0] / r, -S[1] / r], A = [pL[0] + rh[0], pL[1] + rh[1]];
          s.path(D.R.s.filter((_, i) => D.R.t[i] <= simT).map((Q) => [Q[0], Q[1]]), { color: 'ink', width: 1.4, alpha: 0.7 });
          s.path(D.R.s.map((Q) => [Q[0], Q[1]]), { color: 'ink', width: 1, alpha: 0.15 });
          sun(s, 0, 0, { r: 0.05 });
          // history of the tip of A at the Sun
          const tips = []; for (let i = 0; i < D.A.length && D.R.t[i] <= simT; i += 6) tips.push(D.A[i]);
          s.dots(tips, { r: 1.6, color: 'green', alpha: 0.5 });
          const sc = 0.55;
          s.arrow(S[0], S[1], S[0] + sc * pL[0], S[1] + sc * pL[1], { color: 'blue', width: 2.2 });
          s.arrow(S[0] + sc * pL[0], S[1] + sc * pL[1], S[0] + sc * A[0], S[1] + sc * A[1], { color: 'orange', width: 2.2 });
          s.arrow(S[0], S[1], S[0] + sc * A[0], S[1] + sc * A[1], { color: 'green', width: 1.6, dash: [4, 3] });
          s.arrow(0, 0, A[0], A[1], { color: 'green', width: 3.2 });
          s.tex('\\mathbf A', A[0], A[1], { color: 'green', dx: 12, dy: -8, size: 15 });
          s.dot(S[0], S[1], { r: 5.5, color: 'gold' });
          // direction plot (angles wrapped to (−180°, 180°], with breaks at the wrap)
          const tt = D.R.t.map((x) => x / D.T0), wrap = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
          const series = (arr, upto) => { const pts = []; let prev = null; for (let i = 0; i < arr.length && D.R.t[i] <= upto; i++) { const y = wrap(arr[i]); if (prev != null && Math.abs(y - prev) > 180) pts.push(null); pts.push([tt[i], y]); prev = y; } return pts; };
          for (const q of D.aps) g.vline(q.t / D.T0, { color: 'grid', width: 1 });
          g.path(series(D.dirPL, simT), { color: 'blue', width: 1.4, alpha: 0.7 });
          g.path(series(D.dirR, simT), { color: 'orange', width: 1.4, alpha: 0.7 });
          if (D.ep > 0) { const pr = []; let prev = null; for (let k = 0; k <= 200; k++) { const x = (NORB * k) / 200, y = wrap((x * D.pred * 180) / Math.PI); if (prev != null && Math.abs(y - prev) > 180) pr.push(null); pr.push([x, y]); prev = y; } g.path(pr, { color: 'purple', width: 1.4, dash: [5, 4] }); }
          g.path(series(D.ang.map((a) => (a * 180) / Math.PI), Infinity), { color: 'green', width: 1.2, alpha: 0.25 });
          g.path(series(D.ang.map((a) => (a * 180) / Math.PI), simT), { color: 'green', width: 3 });
          cur = { D, Anow: Math.hypot(...A) };
        }, { period: 4 * NORB, still: 3.1 });
        v.legend([['blue', '$\\mathbf p\\times\\mathbf L$'], ['orange', '$-\\mu k\\hat{\\mathbf r}$'], ['green', '$\\mathbf A$ (at the Sun) and its past tips'], ['purple', 'predicted turning, $2\\pi(1/\\gamma - 1)$ per orbit', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { D, Anow } = cur;
          if (D.ep === 0) return String.raw`$|\mathbf A| = ${v.fix(Anow, 6)}$, $\mu k e = ${v.fix(D.e, 6)}$ ($\mu = k = a = 1$) · over ${NORB} orbits the direction of $\mathbf A$ moved by at most $${sci(v, (D.dAng * 180) / Math.PI)}°$ and its length by $${sci(v, D.dMag)}$ — conserved, while $\mathbf p\times\mathbf L$ and $\mu k\hat{\mathbf r}$ each turn through $360°$ every orbit`;
          return String.raw`with $\varepsilon = ${v.fix(D.ep, 3)}$ Binet’s equation becomes $u'' + \gamma^2 u = k\mu/\ell^2$, $\gamma = \sqrt{1 - \mu\varepsilon/\ell^2} = ${v.fix(Math.sqrt(1 - D.ep / (1 - D.e * D.e)), 5)}$, so the perihelion turns by $2\pi(1/\gamma - 1) = ${v.fix((D.pred * 180) / Math.PI, 3)}°$ per orbit · measured from the simulated perihelia: $${v.fix((D.meas * 180) / Math.PI, 3)}°$ per orbit · $|\mathbf A|$ now $${v.fix(Anow, 4)}$, no longer constant`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.11
    {
      num: '8.11',
      kind: 'Proposition',
      name: 'Stability of circular orbits; apsidal angle',
      statement: String.raw`In a central force $F(r)$ (attractive, $F<0$) a circular orbit of radius $r_0$ exists for the angular momentum $\ell^2 = -\mu r_0^3F(r_0)$. It is stable against small perturbations if and only if
$$\frac{d\ln|F|}{d\ln r}\Big|_{r_0} > -3,$$
i.e. for a power law $F = -kr^n$, if and only if $n > -3$. A slightly perturbed stable orbit oscillates radially with angular frequency $\beta\,\dot\phi$, $\beta = \sqrt{3 + d\ln|F|/d\ln r}$, so the angle swept between successive apsides (pericentre to apocentre) is
$$\Psi = \frac{\pi}{\sqrt{n + 3}}\quad\text{for } F = -kr^n:$$
$\Psi = \pi$ for gravity ($n = -2$), $\Psi = \pi/2$ for the spring ($n = 1$). For $n < -3$ the effective potential has a maximum at $r_0$ and the perturbed orbit spirals away; $n = -3$ is marginal.`,
      idea: String.raw`A circular orbit sits at a critical point of $U_{\rm eff}(r) = U(r) + \ell^2/2\mu r^2$ (8.3); it is stable when that point is a minimum. Expanding about $r_0$, small radial oscillations are harmonic (4.3) with $\mu\omega_r^2 = U_{\rm eff}''(r_0) = -F'(r_0) - 3F(r_0)/r_0$, while the angular rate is $\dot\phi^2 = -F(r_0)/\mu r_0$. Their ratio is $\beta^2 = 3 + r_0F'(r_0)/F(r_0)$, positive exactly when the condition holds; half a radial oscillation sweeps the angle $\Psi = \pi/\beta$. Newton found this result (Principia I, Prop. 45) and used the observed slow motion of the Moon’s apsides to test the inverse-square law.`,
      caption: String.raw`A particle on the circular orbit $r = 1$ (dashed) of $F = -kr^n$ gets a radial kick. Left: the orbit with its pericentres (red) and apocentres (blue) joined to the centre. Right: $r$ against the unwound angle, with the linear prediction dashed; the spacing of the apsides is the apsidal angle $\Psi$. Slide $n$ (it snaps to whole numbers): $\Psi$ follows $\pi/\sqrt{n+3}$, the orbit closes at $n = -2$ and $n = 1$, and below $n = -3$ the kick sends the particle spiralling in or out.`,
      deps: ['mech-8.3', 'mech-4.3'],
      refs: ['Goldstein §3.6', 'Arnold §8'],
      tags: ['stability', 'apsidal angle', 'effective potential'],
      credit: 'Newton, 1687',
      viz(v) {
        const nS = v.slider('force exponent $n$ in $F = -kr^n$', -4.5, 3, -1.25, { step: 0.05, onChange: (x) => { const k = Math.round(x); if (Math.abs(x - k) < 0.04 && x !== k) nS.set(k); } });
        const kick = v.slider('radial kick $\\dot r_0 / v_{\\rm circ}$', -0.25, 0.25, 0.1, { step: 0.005 });
        const s = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 330 });
        const g = v.stage({ x: [0, 6 * Math.PI], y: [0.6, 1.4], axes: 'box', height: 330, xlabel: 'angle φ (unwound)', title: '$r(\\phi)$ and the apsides', weight: 1.3 });
        const cache = memo(); let cur = null;
        const run = () => cache([nS.value, kick.value].join('|'), () => {
          const n = nS.value, d = kick.value;
          const R = centralOrbit((r) => -(r ** n), [1, 0, d, 1], { T: 400, eta: 0.002, revs: 3, rmax: 4, rmin: 0.08, maxSteps: 120000 });
          const ph = unwound(R), aps = apsides(R, ph);
          let psi = NaN; if (aps.length >= 2) psi = (aps[aps.length - 1].phi - aps[0].phi) / (aps.length - 1);
          return { R, ph, aps, psi, n, d };
        });
        v.render(() => {
          const D = run(), n = D.n, beta2 = n + 3, psi0 = beta2 > 0 ? Math.PI / Math.sqrt(beta2) : NaN;
          let rmax = 1.2; for (const S of D.R.s) rmax = Math.max(rmax, Math.hypot(S[0], S[1]));
          const lim = Math.min(4.2, 1.15 * rmax); s.setView([-lim, lim], [-lim, lim]);
          s.circle(0, 0, 1, { color: 'muted', width: 1.2, dash: [5, 4] });
          for (const q of D.aps) { const x = q.r * Math.cos(q.phi), y = q.r * Math.sin(q.phi); s.line(0, 0, x, y, { color: q.peri ? 'red' : 'blue', width: 1, alpha: 0.55 }); }
          s.path(D.R.s.map((S) => [S[0], S[1]]), { color: 'accent', width: 2 });
          for (const q of D.aps) s.dot(q.r * Math.cos(q.phi), q.r * Math.sin(q.phi), { r: 3.5, color: q.peri ? 'red' : 'blue' });
          sun(s, 0, 0, { r: 0.05 * lim, color: 'ink' });
          s.dot(1, 0, { r: 4, color: 'gold' });
          const st = D.R.stop === 'centre' ? 'spirals into the centre' : D.R.stop === 'escape' ? 'spirals outward' : n < -3 ? 'unstable' : 'stable: bounded wobble';
          s.corner(st, 'tl', { color: n > -3 && D.R.stop === 'revs' ? 'green' : 'red', weight: 600 });
          // r(φ)
          const phMax = Math.max(Math.PI, Math.min(6 * Math.PI, D.ph[D.ph.length - 1]));
          const rs = D.R.s.map((S) => Math.hypot(S[0], S[1]));
          g.setView([0, phMax], span([rs.filter((_, i) => D.ph[i] <= phMax)], 0.12, 0.2));
          const tk = []; for (let k = 1; k * Math.PI <= phMax + 1e-9; k++) { g.vline(k * Math.PI, { color: 'grid', width: 1 }); tk.push([k * Math.PI, k === 1 ? 'π' : k + 'π']); }
          g.setTicks(tk, null);
          g.hline(1, { color: 'muted', dash: [5, 4], width: 1 });
          // linear prediction: r = 1 + (δ/β) sin βφ (β² > 0) or (δ/κ) sinh κφ (β² < 0)
          if (beta2 > 0) g.fn((p) => 1 + (D.d / Math.sqrt(beta2)) * Math.sin(Math.sqrt(beta2) * p), { color: 'purple', width: 1.4, dash: [5, 4] });
          else if (beta2 < 0) g.fn((p) => 1 + (D.d / Math.sqrt(-beta2)) * Math.sinh(Math.sqrt(-beta2) * p), { color: 'purple', width: 1.4, dash: [5, 4] });
          else g.fn((p) => 1 + D.d * p, { color: 'purple', width: 1.4, dash: [5, 4] });
          g.path(rs.map((r, i) => [D.ph[i], r]), { color: 'accent', width: 2.4 });
          for (const q of D.aps) g.dot(q.phi, q.r, { r: 4, color: q.peri ? 'red' : 'blue' });
          if (D.aps.length >= 2 && beta2 > 0) g.measure(D.aps[0].phi, D.aps[0].r, D.aps[1].phi, D.aps[0].r, 'Ψ', { color: 'ink', offset: 12 });
          cur = { D, psi0 };
        });
        v.legend([['accent', 'perturbed orbit'], ['red', 'pericentre', { dot: true }], ['blue', 'apocentre', { dot: true }], ['purple', 'linearised prediction', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { D, psi0 } = cur, n = D.n;
          if (n <= -3) return String.raw`$n = ${v.fix(n, 2)} \le -3$: $\beta^2 = n + 3 = ${v.fix(n + 3, 2)}$, so $U_{\rm eff}$ has a maximum, not a minimum, at $r_0 = 1$ — the circular orbit is unstable and the kick grows ${n === -3 ? 'linearly' : 'exponentially'} with angle`;
          const close = (() => { const x = D.psi / Math.PI; for (let q = 1; q <= 6; q++) { const p = Math.round(x * q); if (p > 0 && Math.abs(x - p / q) < 2e-3) return { p, q }; } return null; })();
          return String.raw`measured apsidal angle $\Psi = ${v.fix(D.psi / Math.PI, 4)}\pi$ (mean over ${D.aps.length - 1} half-oscillations) vs small-oscillation theory $\pi/\sqrt{n+3} = ${v.fix(psi0 / Math.PI, 4)}\pi$` + (close ? String.raw` · $\Psi \approx ${close.p}\pi/${close.q}$: the orbit (nearly) closes after ${close.q % 2 ? 2 * close.q : close.q} apsides` : ' · not close to a simple fraction of $\\pi$: the rosette does not close') + (Math.abs(D.d) > 0.15 ? ' · large kick: nonlinear corrections visible' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.12
    {
      num: '8.12',
      kind: 'Theorem',
      name: 'Bertrand’s theorem',
      statement: String.raw`Among central force laws $F(r)$ that admit stable circular orbits, the only ones for which **every** bounded orbit is closed are the inverse-square attraction $F = -k/r^2$ and the linear restoring force $F = -kr$ (the isotropic harmonic oscillator). For any other law, bounded non-circular orbits generically never close: they fill an annulus as rosettes. In particular for a power law $F = -kr^n$ ($n > -3$) the apsidal angle depends on the size of the orbit unless $n = -2$ (always $\Psi = \pi$) or $n = 1$ (always $\Psi = \pi/2$).`,
      idea: String.raw`A bounded orbit closes exactly when the apsidal angle $\Psi$ is a rational multiple of $\pi$. If every bounded orbit is to close, $\Psi$ must be the same rational number for all orbits, since it varies continuously with the orbit and the rationals have no intervals. Near-circular orbits give $\Psi = \pi/\beta$ with $\beta^2 = 3 + d\ln|F|/d\ln r$ (8.11), which must then be constant: $F\propto -r^{\beta^2-3}$. Evaluating $\Psi$ in the opposite limit of very eccentric orbits, via Binet’s equation (8.6), gives a second value, and requiring the two to agree leaves only $\beta^2 = 1$ ($n = -2$) and $\beta^2 = 4$ ($n = 1$). The hidden reason is the extra conserved quantities: the Runge–Lenz vector and the oscillator’s tensor $x_ix_j$-integral.`,
      caption: String.raw`Slide the force exponent $n$ (it snaps at $-2$, $1$ and $-0.75$). Top: four orbits launched from apocentre $r = 1$ at $95\%$, $80\%$, $60\%$ and $40\%$ of the circular speed, each run for eight turns. Bottom: the apsidal angle $\Psi/\pi$ against the launch speed, computed by quadrature, with the four simulated orbits as dots. Only at $n = -2$ and $n = 1$ is the curve flat on a rational value and do all four rosettes collapse to single ellipses. At $n = -0.75$ nearly circular orbits close ($\Psi \to 2\pi/3$), but the eccentric ones do not — closing for some orbits is not enough.`,
      deps: ['mech-8.11', 'mech-8.6'],
      refs: ['Goldstein §3.6', 'Arnold §8'],
      tags: ['closed orbits', 'apsidal angle', 'Kepler'],
      credit: 'Joseph Bertrand, 1873',
      viz(v) {
        const SN = [-2, 1, -0.75];
        const nS = v.slider('force exponent $n$ in $F = -kr^n$', -2.9, 3, -1, { step: 0.01, onChange: (x) => { for (const q of SN) if (Math.abs(x - q) < 0.04 && x !== q) { nS.set(q); return; } } });
        const FS = [0.95, 0.8, 0.6, 0.4], COL = ['blue', 'green', 'orange', 'purple'];
        const mini = FS.map((f, i) => v.stage({ x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, axes: false, height: 190, minWidth: 170, title: `${Math.round(100 * f)}% of circular speed` }));
        const g = v.stage({ x: [0, 1], y: [0, 2], axes: 'box', height: 230, full: true, xlabel: 'launch speed at apocentre / circular speed', title: 'apsidal angle $\\Psi/\\pi$ against the size of the orbit' });
        const U = (n, r) => (Math.abs(n + 1) < 1e-9 ? Math.log(r) : r ** (n + 1) / (n + 1));
        /** Apsidal angle by quadrature for the orbit leaving r = 1 tangentially at speed f (k = μ = 1). */
        const psiQ = (n, f) => {
          const l = f, E = 0.5 * f * f + U(n, 1), G = (r) => E - U(n, r) - (l * l) / (2 * r * r);
          let lo = 1e-6, hi = 1 - 1e-12; if (G(lo) >= 0) return NaN;
          for (let k = 0; k < 80; k++) { const m = Math.sqrt(lo * hi); if (G(m) < 0) lo = m; else hi = m; }
          const r1 = hi, r2 = 1, N = 240; let s = 0;
          for (let i = 0; i < N; i++) { const u = ((i + 0.5) * Math.PI) / N, r = r1 + ((r2 - r1) * (1 - Math.cos(u))) / 2, dr = ((r2 - r1) / 2) * Math.sin(u), gg = G(r); if (gg > 0) s += (l * dr) / (r * r * Math.sqrt(2 * gg)); }
          return (s * Math.PI) / N;
        };
        const cache = memo(); let cur = null;
        const run = () => cache(nS.value, () => {
          const n = nS.value;
          const orbits = FS.map((f) => {
            const R = centralOrbit((r) => -(r ** n), [1, 0, 0, f], { T: 1e4, eta: 0.003, revs: 8, rmax: 3, rmin: 1e-3, maxSteps: 150000 });
            const ph = unwound(R), aps = apsides(R, ph), p1 = aps.find((q) => q.peri);
            return { R, psi: p1 ? p1.phi : NaN };
          });
          const curve = []; for (let i = 1; i <= 80; i++) { const f = 0.02 + (0.978 * i) / 80; curve.push([f, psiQ(n, f) / Math.PI]); }
          const vals = curve.map((q) => q[1]).filter(isFinite);
          return { n, orbits, curve, lo: Math.min(...vals), hi: Math.max(...vals) };
        });
        v.render(() => {
          const D = run(), n = D.n, psi0 = 1 / Math.sqrt(n + 3);
          D.orbits.forEach((o, i) => {
            const s = mini[i];
            s.circle(0, 0, 1, { color: 'faint', width: 0.8, dash: [3, 4] });
            s.path(o.R.s.map((S) => [S[0], S[1]]), { color: COL[i], width: 1.3 });
            sun(s, 0, 0, { r: 0.045, color: 'ink' });
            s.corner(`Ψ = ${v.fix(o.psi / Math.PI, 3)}π`, 'bl', { color: COL[i], size: 11.5, weight: 600 });
          });
          const yr = [Math.min(D.lo, psi0, 0.45) - 0.08, Math.max(D.hi, psi0, 1.05) + 0.1];
          g.setView([0, 1.02], yr);
          for (const [q, lab] of [[1, 'π (gravity)'], [0.5, 'π/2 (spring)'], [2 / 3, '2π/3']]) if (q > yr[0] && q < yr[1]) { g.hline(q, { color: 'faint', dash: [4, 4], width: 1 }); g.text(lab, 0.5, q, { color: 'muted', size: 10.5, dy: -8, align: 'center' }); }
          g.dot(1, psi0, { r: 4, hollow: true, color: 'ink', label: '1/√(n+3)', labelPos: 'nw' });
          const flat = D.hi - D.lo < 1e-4;
          g.path(D.curve, { color: flat ? 'green' : 'red', width: 2.6 });
          D.orbits.forEach((o, i) => g.dot(FS[i], o.psi / Math.PI, { r: 5, color: COL[i] }));
          cur = { D, flat, psi0 };
        });
        v.readout(() => {
          if (!cur) return '';
          const { D, flat, psi0 } = cur;
          const head = String.raw`$n = ${v.fix(D.n, 2)}$: near-circular limit $\Psi = \pi/\sqrt{n+3} = ${v.fix(psi0, 4)}\pi$; over all launch speeds $\Psi/\pi$ ranges from ${v.fix(D.lo, 4)} to ${v.fix(D.hi, 4)}`;
          if (flat) return head + String.raw` — **constant and rational**: every bounded orbit closes (${Math.abs(D.n + 2) < 1e-9 ? 'Kepler ellipses' : 'oscillator ellipses'}); simulated $\Psi$ for the four orbits: ${D.orbits.map((o) => v.fix(o.psi / Math.PI, 5)).join(', ')} (in units of $\pi$)`;
          return head + ` — it changes with the orbit, so most bounded orbits never close (rosettes), as Bertrand’s theorem says for every $n \\ne -2, 1$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.13
    {
      num: '8.13',
      kind: 'Phenomenon',
      name: 'Precession of the perihelion',
      statement: String.raw`When a small perturbation $\delta U(r)$ is added to the Kepler potential, bound orbits remain nearly elliptical but the perihelion advances by a small angle $\delta\varpi$ every revolution. To first order in the perturbation,
$$\delta\varpi = \frac{\partial}{\partial\ell}\Big(\frac{2\mu}{\ell}\int_0^\pi r^2\,\delta U\,d\phi\Big)\Big|_E,$$
the integral taken along the unperturbed ellipse. A term $\delta U = -\gamma/r^3$ (the form general relativity adds, with $\gamma = GM\ell^2/\mu c^2$) gives $\delta\varpi = 6\pi\gamma\mu^2/\ell^4 = 6\pi GM/c^2a(1-e^2)$; an exterior ring of matter (a smeared-out outer planet) also gives a prograde advance. For Mercury the observed advance, after removing the precession of the equinoxes, is about $574''$ per century: about $531''$ from the other planets in full Newtonian perturbation theory and $43''$ from general relativity.`,
      idea: String.raw`Without perturbation the Runge–Lenz vector (8.10) is fixed and the apsidal angle is exactly $\pi$; any change in the force law makes the apsidal angle differ from $\pi$ (8.11), so the ellipse turns a little each orbit. The formula above comes from writing the angle swept between apsides as $\partial/\partial\ell$ of the radial action and expanding to first order (Landau and Lifshitz §15). Le Verrier found in 1859 that Newtonian perturbations left a residue of about $40''$ per century in Mercury’s advance; Einstein’s 1915 calculation of the relativistic $1/r^3$ term explained it with no adjustable parameter — the first success of general relativity.`,
      caption: String.raw`Pick a perturbation and set its strength (log slider; $GM = a = 1$, Mercury’s eccentricity by default). Left: eight orbits with each perihelion direction drawn — visible only for large strengths. Right: the advance per orbit on log–log axes: dots are full simulations (perihelion to perihelion), the line is the first-order formula; they agree over six decades and part only where the perturbation stops being small. The labelled points are Mercury’s real values. Bottom: Mercury’s budget in arcseconds per century, computed here from the planets’ masses and orbits (each smeared into a ring) and from $G$, $M_\odot$ and $c$.`,
      deps: ['mech-8.10', 'mech-8.11'],
      refs: ['Goldstein §12.3'],
      tags: ['precession', 'perturbation', 'general relativity'],
      credit: 'Le Verrier, 1859; Einstein, 1915',
      viz(v) {
        const C = v.M.CONST, ARC = 206264.806;
        const mode = v.select('perturbation', [{ value: 'gr', label: 'relativistic $-\\gamma/r^3$' }, { value: 'ring', label: 'outer ring (Venus-like)' }], 'gr');
        const lg = v.slider('strength (log₁₀)', -8, -1, -2.5, { step: 0.05, fmt: (x) => `10^${v.fix(x, 2)}` });
        const ecc = v.slider('eccentricity $e$', 0, 0.6, 0.2056, { step: 0.0001, decimals: 4 });
        const s = v.stage({ x: [-2, 1.2], y: [-1.4, 1.4], equal: true, axes: false, height: 320 });
        const g = v.stage({ x: [1e-8, 0.1], y: [1e-8, 3], xlog: true, ylog: true, axes: 'box', height: 320, xlabel: 'strength', ylabel: 'advance per orbit (rad)', weight: 1.2, title: 'perihelion advance per orbit' });
        const bud = v.stage({ x: [-20, 650], y: [-0.5, 2.6], axes: false, height: 150, full: true, title: 'Mercury’s perihelion advance, arcseconds per century' });
        const RR = 0.723332 / 0.387098; // Venus/Mercury radius ratio for the scaled ring
        // Mercury budget from real data (ring model + GR)
        const MASS = { Venus: 4.8675e24, Earth: C.Mearth, Mars: 6.4171e23, Jupiter: 1.89819e27, Saturn: 5.6834e26, Uranus: 8.6813e25, Neptune: 1.02413e26 };
        const Me = BODIES.find((b) => b.n === 'Mercury'), aM = Me.a * C.au, GMs = C.G * C.Msun, TM = TAU * Math.sqrt(aM ** 3 / GMs), perCy = (100 * C.yr) / TM;
        const budget = Object.entries(MASS).map(([nm, m]) => {
          const R = BODIES.find((b) => b.n === nm).a * C.au;
          return { nm, val: landauAdvance((r) => ringU(r, R, C.G * m), aM, Me.e, GMs) * perCy * ARC };
        });
        const grV = ((6 * Math.PI * GMs) / (C.c ** 2 * aM * (1 - Me.e ** 2))) * perCy * ARC;
        const mercGR = (GMs / (C.c ** 2 * aM)) * (1 - Me.e ** 2), mercRing = MASS.Venus / C.Msun; // scaled strengths
        const model = (md, eps) => (md === 'gr' ? { acc: (r) => -1 / (r * r) - (3 * eps) / r ** 4, dU: (r) => -eps / r ** 3 } : { acc: (r) => -1 / (r * r) + ringAcc(r, RR, eps), dU: (r) => ringU(r, RR, eps) });
        const famC = memo(), curC = memo(); let cur = null;
        const family = () => famC([mode.value, ecc.value].join('|'), () => {
          const pts = []; for (let k = -7; k <= -1; k += 0.5) { const eps = 10 ** k, M = model(mode.value, eps), a = simAdvance(M.acc, ecc.value); if (isFinite(a)) pts.push([eps, a]); }
          const lin = landauAdvance(model(mode.value, 1).dU, 1, ecc.value); // first order: linear in the strength
          return { pts, lin };
        });
        const current = () => curC([mode.value, ecc.value, lg.value].join('|'), () => {
          const eps = 10 ** lg.value, M = model(mode.value, eps), e = ecc.value;
          const R = centralOrbit(M.acc, [1 - e, 0, 0, Math.sqrt((1 + e) / (1 - e))], { T: 9 * TAU, eta: 0.004, revs: 8, rmin: 0.02, maxSteps: 120000 });
          return { eps, R, adv: simAdvance(M.acc, e), e };
        });
        v.render(() => {
          const F = family(), D = current(), e = D.e, rp = 1 - e;
          // orbits and perihelion directions
          s.setView([-(1 + e) - 0.35, rp + 0.35 + 0.2], [-1.25, 1.25]);
          s.path(D.R.s.map((S) => [S[0], S[1]]), { color: isFinite(D.adv) ? 'accent' : 'red', width: 1.2, alpha: 0.85 });
          if (isFinite(D.adv)) for (let k = 0; k <= 8; k++) { const a = k * D.adv; s.line(0, 0, (rp + 0.25) * Math.cos(a), (rp + 0.25) * Math.sin(a), { color: k ? 'red' : 'ink', width: k ? 1.2 : 1.6, alpha: k ? 0.7 : 1 }); }
          if (mode.value === 'ring') s.circle(0, 0, RR, { color: 'orange', width: 2, dash: [6, 4] });
          sun(s, 0, 0, { r: 0.05 });
          s.corner(isFinite(D.adv) ? `advance ${v.fix((D.adv * 180) / Math.PI, Math.abs(D.adv) > 0.01 ? 2 : 6)}° per orbit` : 'no centrifugal barrier: plunges into the centre', 'tl', { color: 'red', weight: 600 });
          // log–log
          g.fn((x) => F.lin * x, { color: 'green', width: 1.8, dash: [6, 4] });
          g.dots(F.pts, { r: 4, color: 'accent' });
          const mk = mode.value === 'gr' ? mercGR : mercRing;
          g.dot(mk, F.lin * mk, { r: 5, hollow: true, color: 'ink', width: 1.6, label: mode.value === 'gr' ? 'Mercury (GR)' : 'Mercury (Venus)', labelPos: 'se' });
          g.vline(D.eps, { color: 'gold', width: 1.2, dash: [3, 3] });
          if (isFinite(D.adv)) g.dot(D.eps, Math.abs(D.adv), { r: 6.5, color: 'gold' });
          // budget bar
          const cols = ['gold', 'blue', 'red', 'orange', 'teal', 'purple', 'pink'];
          let x = 0; const yb = 1.25;
          budget.forEach((b, i) => { bud.rect(x, yb - 0.45, x + b.val, yb + 0.45, { fill: cols[i], fillAlpha: 0.7, stroke: false }); if (b.val > 20) bud.text(b.nm, x + b.val / 2, yb, { color: 'ink', size: 10.5, align: 'center' }); x += b.val; });
          const tot = x; bud.rect(x, yb - 0.45, x + grV, yb + 0.45, { fill: 'green', fillAlpha: 0.85, stroke: false }); bud.text('GR', x + grV / 2, yb, { color: 'ink', size: 10.5, align: 'center', weight: 700 }); x += grV;
          bud.line(574, yb - 0.75, 574, yb + 0.85, { color: 'ink', width: 2.2 }); bud.text('observed 574″', 578, yb + 0.95, { color: 'ink', size: 10.5, align: 'left', weight: 600 });
          bud.line(tot, yb + 0.5, tot, yb + 0.85, { color: 'muted', width: 1.4 }); bud.text(`planets as rings ${v.fix(tot, 0)}″`, tot - 4, yb + 0.95, { color: 'muted', size: 10, align: 'right' });
          bud.line(531, yb - 0.5, 531, yb - 0.85, { color: 'muted', width: 1.4 }); bud.text('full planetary theory 531″ (+ GR 43″ = 574″)', 527, yb - 0.95, { color: 'muted', size: 10, align: 'right' });
          for (let k = 0; k <= 600; k += 100) bud.text(String(k), k, -0.35, { color: 'faint', size: 9.5, align: 'center' });
          cur = { F, D, tot, grV };
        });
        v.legend([['accent', 'simulated advance', { dot: true }], ['green', 'first-order formula', { dash: true }], ['gold', 'current strength', { dot: true }], ['red', 'successive perihelia']]);
        v.readout(() => {
          if (!cur) return '';
          const { F, D, tot, grV } = cur, th = F.lin * D.eps;
          const head = !isFinite(D.adv) ? String.raw`strength $${v.sci(D.eps, 2)}$: the $1/r^3$ attraction beats the centrifugal barrier and the orbit plunges (compare the innermost stable orbit of a black hole)` : String.raw`strength $${v.sci(D.eps, 2)}$: simulated advance $${v.sci(D.adv, 4)}$ rad per orbit, first-order formula${mode.value === 'gr' ? String.raw` $6\pi\gamma/(1-e^2)^2$` : ''} $${v.sci(th, 4)}$ (ratio $${v.fix(D.adv / th, 4)}$${Math.abs(D.adv / th - 1) > 0.01 ? ' — no longer a small perturbation' : ''})`;
          return head + String.raw` · Mercury: GR $6\pi GM_\odot/c^2a(1-e^2) = ${v.fix(grV, 2)}''$/century; the planets as rings ${v.fix(tot, 0)}″ (full theory 531″, the rings ignore their eccentricities); total ${v.fix(tot + grV, 0)}″ vs observed 574″`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.14
    {
      num: '8.14',
      kind: 'Phenomenon',
      name: 'Hohmann transfer orbits',
      statement: String.raw`To move a spacecraft between coplanar circular orbits of radii $r_1 < r_2$ about a body with $GM = \mu_g$, the **Hohmann transfer** fires a tangential burn at $r_1$ that puts the craft on the ellipse with perihelion $r_1$ and aphelion $r_2$, coasts half an orbit, and circularizes with a second tangential burn at $r_2$:
$$\Delta v_1 = \sqrt{\frac{\mu_g}{r_1}}\Big(\sqrt{\frac{2r_2}{r_1+r_2}} - 1\Big),\qquad \Delta v_2 = \sqrt{\frac{\mu_g}{r_2}}\Big(1 - \sqrt{\frac{2r_1}{r_1+r_2}}\Big),\qquad t = \pi\sqrt{\frac{(r_1+r_2)^3}{8\mu_g}}.$$
Among two-impulse transfers it needs the least total $\Delta v$, at the price of the longest flight; faster transfers cost more. For $r_2/r_1 > 11.94$ a three-burn bi-elliptic transfer can be cheaper. Phasing is counterintuitive: to catch a target ahead in the same orbit, one burns *backward*, dropping into a lower, faster orbit.`,
      idea: String.raw`A tangential burn at perihelion is the most efficient way to raise the aphelion, because the energy gained per unit $\Delta v$ is $v\,\Delta v$ and $v$ is largest there. The vis-viva relation $v^2 = \mu_g(2/r - 1/a)$ (8.21), with $a = (r_1+r_2)/2$ for the transfer ellipse (8.7), gives the speeds at both ends; the flight time is half the Kepler period (8.8). Burning harder makes the craft cross $r_2$ sooner but at an angle, and the second burn then has to cancel a radial velocity too. In the phasing problem a lower orbit has a shorter period (8.8), so slowing down makes you gain on the target.`,
      caption: String.raw`Pick a scenario. The craft (gold) is simulated through its burns; the target (green) starts at the lead angle a Hohmann transfer needs. With the first-burn slider at 1 the craft meets the target; burn harder to arrive sooner and watch the right panel: total $\Delta v$ against flight time for the whole family, with the Hohmann point at the minimum. In the custom scenario push the radius ratio past 15.6, where even the bi-elliptic route through infinity is cheaper. In the phasing scenario the target is ahead in the same orbit: find the burn that catches it after one lap.`,
      deps: ['mech-8.7', 'mech-8.4'],
      refs: ['Taylor §8.8'],
      tags: ['spaceflight', 'orbits', 'energy'],
      credit: 'Walter Hohmann, 1925',
      scope: String.raw`Impulsive burns, coplanar circular orbits, two-body gravity; real missions also handle the departure and arrival planets’ gravity (patched conics) and launch windows.`,
      viz(v) {
        const C = v.M.CONST;
        const SC = {
          mars: { label: 'Earth → Mars', mu: C.G * C.Msun, r1: C.au, r2: 1.523679 * C.au, L: C.au, Ln: 'AU', tu: 86400, tn: 'days', tgt: 'Mars' },
          geo: { label: 'LEO → GEO', mu: C.G * C.Mearth, r1: C.Rearth + 300e3, r2: 42164e3, L: 1e7, Ln: '10 000 km', tu: 3600, tn: 'h', tgt: 'GEO satellite', R: C.Rearth },
          custom: { label: 'custom ratio', mu: C.G * C.Mearth, r1: 7000e3, L: 7000e3, Ln: 'r₁', tu: 3600, tn: 'h', tgt: 'target' },
          phase: { label: 'phasing in LEO', mu: C.G * C.Mearth, r1: C.Rearth + 400e3, L: 1e6, Ln: '1000 km', tu: 60, tn: 'min', R: C.Rearth },
        };
        const sc = v.select('scenario', Object.entries(SC).map(([value, q]) => ({ value, label: q.label })), 'mars', { onChange: () => vis() });
        const fS = v.slider('first burn $\\Delta v_1 / \\Delta v_{1,\\rm Hohmann}$', 1, 1.6, 1, { step: 0.005 });
        const ratio = v.slider('radius ratio $r_2/r_1$', 1.5, 25, 6, { step: 0.1 });
        const lead = v.slider('target ahead by (°)', 2, 60, 20, { step: 0.5 });
        const dvS = v.slider('tangential burn $\\Delta v$ (m/s)', -250, 250, 60, { step: 1 });
        const vis = () => { const ph = sc.value === 'phase'; fS.el.hidden = ph; ratio.el.hidden = sc.value !== 'custom'; lead.el.hidden = !ph; dvS.el.hidden = !ph; };
        vis();
        const s = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: false, height: 330 });
        const g = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', height: 330, weight: 1.1, title: 'total $\\Delta v$ against flight time' });
        /** Two-burn transfer from r1 with a tangential burn to speed v; analytic crossing of r2 (Δv2, time of flight), or null. */
        const conicXfer = (mu, r1, r2, v) => {
          const h = r1 * v, E = v * v / 2 - mu / r1, p = (h * h) / mu, e = Math.sqrt(Math.max(0, 1 + (2 * E * h * h) / (mu * mu)));
          if (p / (1 + e) > r2 + 1e-9 || (e < 1 && p / (1 - e) < r2 * (1 - 1e-12))) return null;
          const cosn = clamp((p / r2 - 1) / e, -1, 1), nu = Math.acos(cosn), vr = (mu / h) * e * Math.sin(nu), vt = h / r2, vc2 = Math.sqrt(mu / r2);
          let t;
          if (e < 1 - 1e-9) { const a = p / (1 - e * e), Ea = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(nu / 2)); t = (Ea - e * Math.sin(Ea)) * Math.sqrt(a ** 3 / mu); }
          else if (e > 1 + 1e-9) { const a = p / (e * e - 1), H = 2 * Math.atanh(Math.sqrt((e - 1) / (e + 1)) * Math.tan(nu / 2)); t = (e * Math.sinh(H) - H) * Math.sqrt(a ** 3 / mu); }
          else { const D = Math.tan(nu / 2); t = 0.5 * Math.sqrt(p ** 3 / mu) * (D + D ** 3 / 3); }
          return { dv2: Math.hypot(vr, vt - vc2), t, nu, e };
        };
        const cache = memo(); let cur = null;
        const run = () => cache([sc.value, fS.value, ratio.value, lead.value, dvS.value].join('|'), () => {
          const Q = SC[sc.value], mu = Q.mu, r1 = Q.r1, vc1 = Math.sqrt(mu / r1);
          if (sc.value === 'phase') {
            const lam = (lead.value * Math.PI) / 180, Tt = TAU * Math.sqrt(r1 ** 3 / mu), vb = vc1 + dvS.value;
            const R = centralOrbit((r) => -mu / (r * r), [r1, 0, 0, vb], { T: 1e6, eta: 0.004, revs: 1, rmax: 5 * r1, rmin: 0.5 * r1, maxSteps: 60000 });
            const el = kepEl(mu, r1, 0, 0, vb), Tc = el.T;
            const gapAng = (dv) => { const e2 = kepEl(mu, r1, 0, 0, vc1 + dv); return isFinite(e2.T) ? ((lam + TAU * (e2.T / Tt - 1)) * 180) / Math.PI : NaN; };
            const need = Math.sqrt(mu * (2 / r1 - 1 / (r1 * (1 - lam / TAU) ** (2 / 3)))) - vc1;
            const crash = el.p / (1 + el.e) < Q.R;
            return { ph: true, Q, mu, r1, lam, Tt, Tc, R, gapAng, need, gap: gapAng(dvS.value), crash, el };
          }
          const r2 = sc.value === 'custom' ? r1 * ratio.value : Q.r2, vc2 = Math.sqrt(mu / r2), vh = vc1 * Math.sqrt((2 * r2) / (r1 + r2));
          const dv1H = vh - vc1, dv2H = vc2 * (1 - Math.sqrt((2 * r1) / (r1 + r2))), tH = Math.PI * Math.sqrt((r1 + r2) ** 3 / (8 * mu));
          const v1 = vc1 + fS.value * dv1H;
          // simulate the coast until the craft reaches r2, then circularize
          const R = centralOrbit((r) => -mu / (r * r), [r1, 0, 0, v1], { T: 1.05 * tH, eta: 0.002, rmax: r2 * (1 - 1e-7), maxSteps: 60000 });
          const L = R.s[R.s.length - 1], rr = Math.hypot(L[0], L[1]), tx = R.t[R.t.length - 1];
          const ux = L[0] / rr, uy = L[1] / rr, dv2 = Math.hypot(L[2] - -uy * vc2, L[3] - ux * vc2);
          const an = conicXfer(mu, r1, r2, v1);
          const fam = []; for (let k = 0; k <= 60; k++) { const f = 1 + 0.6 * (k / 60) ** 2, c2 = conicXfer(mu, r1, r2, vc1 + f * dv1H); if (c2) fam.push([c2.t / Q.tu, (f * dv1H + c2.dv2) / 1000]); }
          const Rr = r2 / r1;
          const bi = (Math.SQRT2 - 1) * (vc1 + vc2); // bi-elliptic via r_b → ∞
          const thArr = Math.atan2(L[1], L[0]);
          const nT = TAU / (TAU * Math.sqrt(r2 ** 3 / mu)), lead0 = Math.PI - nT * tH; // Hohmann lead angle
          return { ph: false, Q, mu, r1, r2, vc1, vc2, dv1H, dv2H, tH, v1, R, tx, dv2, an, fam, Rr, bi, nT, lead0, reached: rr >= r2 * (1 - 1e-6), thArr };
        });
        v.animate((t) => {
          const D = run(), Q = D.Q, L = Q.L;
          if (D.ph) {
            const r1 = D.r1 / L, lim = 1.35 * Math.max(r1, D.el.a * (1 + D.el.e) / L); s.setView([-lim, lim], [-lim, lim]);
            s.circle(0, 0, Q.R / L, { fill: 'blue', fillAlpha: 0.18, color: 'blue', width: 1 });
            s.circle(0, 0, r1, { color: 'faint', width: 1.2, dash: [5, 4] });
            const simT = (t / 8) * D.Tc, frac = Math.min(1, simT / D.Tc);
            s.path(D.R.s.map((S) => [S[0] / L, S[1] / L]), { color: 'gold', width: 1.4, alpha: 0.6 });
            const S = stateAt(D.R, Math.min(simT, D.R.t[D.R.t.length - 1]));
            const at = D.lam + (TAU * Math.min(simT, D.Tc)) / D.Tt;
            s.dot(r1 * Math.cos(at), r1 * Math.sin(at), { r: 6, color: 'green', label: 'target', labelPos: 'ne' });
            s.dot(S[0] / L, S[1] / L, { r: 6, color: 'gold', label: 'chaser', labelPos: 'sw' });
            s.dot(r1, 0, { r: 3, color: 'ink' });
            s.corner(D.crash ? 'perigee below the surface!' : frac >= 1 ? (Math.abs(D.gap) < 0.5 ? 'rendezvous after one lap' : `missed by ${v.fix(Math.abs(D.gap), 1)}° after one lap`) : 'one phasing lap…', 'bl', { color: D.crash || (frac >= 1 && Math.abs(D.gap) >= 0.5) ? 'red' : 'green', weight: 600 });
            g.setTitle('gap to the target after one lap (°) against the burn $\\Delta v$ (m/s; negative = backward)');
            const xs = [], ys = []; for (let dv = -250; dv <= 250; dv += 5) { const y = D.gapAng(dv); if (isFinite(y)) { xs.push(dv); ys.push(y); } }
            g.setView([-250, 250], span([ys, [0]], 0.08, 10));
            g.setTicks(null, null);
            g.hline(0, { color: 'muted', width: 1 }); g.vline(0, { color: 'faint', width: 1 });
            g.path(xs.map((x, i) => [x, ys[i]]), { color: 'accent', width: 2.2 });
            g.dot(D.need, 0, { r: 5, color: 'green', label: `${v.fix(D.need, 1)} m/s`, labelPos: 'n' });
            g.dot(dvS.value, D.gap, { r: 6, color: 'gold' });
            cur = { D };
            return;
          }
          const r1 = D.r1 / L, r2 = D.r2 / L, lim = 1.18 * r2; s.setView([-lim, lim], [-lim, lim]);
          if (Q.R) s.circle(0, 0, Q.R / L, { fill: 'blue', fillAlpha: 0.18, color: 'blue', width: 1 });
          s.circle(0, 0, r1, { color: 'blue', width: 1.2, dash: [5, 4] });
          s.circle(0, 0, r2, { color: 'green', width: 1.2, dash: [5, 4] });
          // Hohmann reference ellipse
          const aH = (r1 + r2) / 2, eH = (r2 - r1) / (r2 + r1); s.path(conicPts(aH * (1 - eH * eH), eH, 0, 2 * r2), { color: 'faint', width: 1, dash: [3, 4] });
          const span1 = 1.25 * D.tH, simT = Math.min((t / 7) * span1, span1);
          const k = D.R.t.findIndex((x) => x > simT), upto = k < 0 ? D.R.s.length : k;
          s.path(D.R.s.slice(0, upto).map((S) => [S[0] / L, S[1] / L]), { color: 'gold', width: 2.4 });
          let craft;
          if (simT <= D.tx || !D.reached) craft = stateAt(D.R, Math.min(simT, D.tx));
          else { const a = D.thArr + D.nT * (simT - D.tx); craft = [D.r2 * Math.cos(a), D.r2 * Math.sin(a)]; s.curve((u) => [r2 * Math.cos(D.thArr + u * D.nT * (simT - D.tx)), r2 * Math.sin(D.thArr + u * D.nT * (simT - D.tx))], 0, 1, { color: 'gold', width: 2.4 }); }
          const ta = D.lead0 + D.nT * simT; // target, started at the Hohmann lead angle
          s.dot(r2 * Math.cos(ta), r2 * Math.sin(ta), { r: 6, color: 'green', label: Q.tgt, labelPos: 'ne' });
          sun(s, 0, 0, { r: 0.04 * lim, color: Q.R ? 'blue' : 'gold' });
          s.dot(craft[0] / L, craft[1] / L, { r: 5.5, color: 'gold' });
          s.dot(r1, 0, { r: 3, color: 'ink' });
          if (D.reached) { const ax = D.r2 * Math.cos(D.thArr) / L, ay = D.r2 * Math.sin(D.thArr) / L; s.dot(ax, ay, { r: 3, color: 'ink' }); }
          const miss = D.reached ? Math.abs(((D.thArr - (D.lead0 + D.nT * D.tx) + Math.PI) % TAU + TAU) % TAU - Math.PI) : NaN;
          s.corner(!D.reached ? 'never reaches the outer orbit' : miss < 0.01 ? 'arrives with the target' : `arrives ${v.fix((miss * 180) / Math.PI, 1)}° away from the target`, 'bl', { color: D.reached && miss < 0.01 ? 'green' : 'red', weight: 600 });
          s.corner(`unit: ${Q.Ln}`, 'br', { color: 'muted', size: 11 });
          // Δv vs time
          g.setTitle('total $\\Delta v$ (km/s) against flight time (' + Q.tn + ')');
          const xs = D.fam.map((q) => q[0]), ys = D.fam.map((q) => q[1]);
          g.setView([Math.min(...xs) * 0.9, Math.max(...xs) * 1.05], span([ys], 0.12, 0.2));
          g.setTicks(null, null);
          g.path(D.fam, { color: 'accent', width: 2.2 });
          g.dot(D.tH / Q.tu, (D.dv1H + D.dv2H) / 1000, { r: 5, color: 'green', label: 'Hohmann', labelPos: 'nw' });
          if (D.reached) g.dot(D.tx / Q.tu, ((D.v1 - D.vc1) + D.dv2) / 1000, { r: 6.5, color: 'gold' });
          if (sc.value === 'custom') g.hline(D.bi / 1000, { color: 'purple', dash: [5, 4], width: 1.5 });
          cur = { D, miss };
        }, { period: 9, still: 6.3 });
        v.legend([['gold', 'spacecraft (simulated)'], ['green', 'target'], ['accent', 'two-burn family'], ['purple', 'bi-elliptic via ∞ (custom)', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { D } = cur, Q = D.Q;
          if (D.ph) return String.raw`target $${v.fix(lead.value, 1)}°$ ahead; burn $${v.fix(dvS.value, 0)}$ m/s: phasing orbit period ${v.fix(D.Tc / 60, 2)} min vs target ${v.fix(D.Tt / 60, 2)} min, gap after one lap ${v.fix(D.gap, 2)}° · rendezvous needs $\Delta v = ${v.fix(D.need, 1)}$ m/s — **backward**: slowing drops you into a lower, faster orbit (8.8), while burning forward raises your orbit and you fall further behind`;
          const tot = (D.v1 - D.vc1 + D.dv2) / 1000, totH = (D.dv1H + D.dv2H) / 1000;
          let out = String.raw`Hohmann: $\Delta v_1 = ${v.fix(D.dv1H / 1000, 3)}$, $\Delta v_2 = ${v.fix(D.dv2H / 1000, 3)}$ km/s, total ${v.fix(totH, 3)} km/s, ${v.fix(D.tH / Q.tu, 1)} ${Q.tn}, target lead $${v.fix((D.lead0 * 180) / Math.PI, 1)}°$`;
          if (D.reached && fS.value > 1.0001) out += String.raw` · this transfer (simulated): ${v.fix(D.tx / Q.tu, 1)} ${Q.tn}, total ${v.fix(tot, 3)} km/s (conic formula ${v.fix((D.v1 - D.vc1 + D.an.dv2) / 1000, 3)}), ${v.fix(100 * (tot / totH - 1), 1)}% more fuel-equivalent`;
          else if (D.reached) out += String.raw` · simulated: arrival after ${v.fix(D.tx / Q.tu, 2)} ${Q.tn}, $\Delta v_2 = ${v.fix(D.dv2 / 1000, 4)}$ km/s`;
          if (sc.value === 'custom') out += String.raw` · ratio ${v.fix(D.Rr, 1)}: bi-elliptic via $r_b\to\infty$ needs ${v.fix(D.bi / 1000, 3)} km/s ${D.bi < D.dv1H + D.dv2H ? '— **cheaper than Hohmann**' : '(more than Hohmann below ratio 15.58)'}`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 8.15
    {
      num: '8.15',
      kind: 'Phenomenon',
      name: 'Gravity assist',
      statement: String.raw`A spacecraft flying past a planet that moves with velocity $\mathbf V$ around the Sun follows, in the planet’s frame, a hyperbola: it leaves with the same speed $v_\infty$ it arrived with, its velocity turned through the angle $\delta = 2\arcsin(1/e)$, $e = \sqrt{1 + b^2v_\infty^4/G^2M_p^2}$ for impact parameter $b$. In the Sun’s frame the velocities are $\mathbf V + \mathbf v_{\rm in}$ and $\mathbf V + \mathbf v_{\rm out}$, of different lengths: the craft can gain (or lose) heliocentric speed up to $2v_\infty\sin(\delta/2)$, paid for by an imperceptible change in the planet’s orbit. Passing behind the planet (relative to its motion) speeds the craft up; passing in front slows it down.`,
      idea: String.raw`In the planet’s frame the encounter is a two-body hyperbola (8.4) in a conservative field, so the speed far away is the same before and after. Galilean relativity (1.8) then says the heliocentric velocity is the vector sum with $\mathbf V$: rotating $\mathbf v_\infty$ on the circle of radius $v_\infty$ about the tip of $\mathbf V$ changes the length of $\mathbf V + \mathbf v_\infty$. Energy is conserved overall — the craft’s heliocentric kinetic energy changes by the work done by the moving planet, and the planet’s orbital energy changes by the opposite amount, negligible because of its huge mass.`,
      caption: String.raw`Jupiter, real numbers ($GM_J$, radius, orbital speed $13.07$ km/s). Left: the flyby simulated in Jupiter’s frame; drag the white handle to change the aiming offset $b$ — the in and out speeds are equal. Right: the velocity diagram: Jupiter’s velocity (green), the circle of all possible relative velocities, and the heliocentric velocities before (blue) and after (orange); drag the blue tip to change the approach. Bottom: the same flyby seen from the Sun, Jupiter moving to the right. Pass behind Jupiter to gain speed, in front to lose it.`,
      deps: ['mech-8.4', 'mech-1.8'],
      refs: ['Taylor §8.7'],
      tags: ['spaceflight', 'reference frames', 'hyperbola'],
      credit: 'Michael Minovitch, 1961; first flown by Mariner 10, 1974',
      scope: String.raw`Patched-conic picture: during the encounter (hours to days) the Sun’s pull is treated as uniform and only the planet’s gravity bends the path; the planet’s recoil is negligible.`,
      viz(v) {
        const GMJ = 1.26686534e17, RJ = 71492e3, VJ = 13.07e3, L = RJ, B0 = 15; // SI; B0 = default aiming offset (R_J)
        const s = v.stage({ x: [-40, 40], y: [-26, 26], equal: true, axes: false, height: 300, title: 'Jupiter’s frame (units $R_J$)' });
        const vd = v.stage({ x: [-8, 26], y: [-17, 17], equal: true, axes: false, height: 300, title: 'velocities (km/s)' });
        const sf = v.stage({ x: [-60, 60], y: [-20, 20], equal: true, axes: false, height: 230, full: true, title: 'the Sun’s frame: Jupiter moves to the right (units $R_J$)' });
        let Vin = null, bR = B0;
        const dir = () => { const rx = Vin.x - 13.07, ry = Vin.y, m = Math.hypot(rx, ry) || 1; return [rx / m, ry / m]; };
        const aimAt = () => { const [ux, uy] = dir(); return [-21 * ux - bR * uy, -21 * uy + bR * ux]; };
        Vin = vd.handle(8, 5, { color: 'blue', label: '$\\mathbf v_{\\rm in}$', labelPos: 'nw', constrain: (x, y) => { const dx = x - 13.07, dy = y; const m = Math.hypot(dx, dy); if (m < 3) return [13.07 + (3 * dx) / (m || 1), (3 * dy) / (m || 1)]; if (m > 16) return [13.07 + (16 * dx) / m, (16 * dy) / m]; return [x, y]; } });
        const B = s.handle(0, 0, { color: 'ink', r: 6, label: 'aim b', labelPos: 'e', constrain: (x, y) => { const [ux, uy] = dir(); bR = clamp(-x * uy + y * ux, -22, 22); return aimAt(); } });
        { const p = aimAt(); B.x = p[0]; B.y = p[1]; }
        const cache = memo(); let cur = null;
        const run = () => cache([bR, Vin.x, Vin.y].join('|'), () => {
          const rel = [(Vin.x - 13.07) * 1e3, Vin.y * 1e3], vinf = Math.hypot(...rel), ux = rel[0] / vinf, uy = rel[1] / vinf, nx = -uy, ny = ux;
          // start 300 R_J out on the incoming branch of the hyperbola whose asymptote is the aiming line (offset b along n, direction u)
          const b = Math.abs(bR) < 0.01 ? 0.01 * L : bR * L, D0 = 300 * L, aH = GMJ / (vinf * vinf), eH = Math.sqrt(1 + (b / aH) ** 2), pH = aH * (eH * eH - 1), hz = -b * vinf;
          const nu0 = -Math.acos(clamp((pH / D0 - 1) / eH, -1, 1)), r0 = pH / (1 + eH * Math.cos(nu0)), kk = GMJ / Math.abs(hz), my = hz < 0 ? -1 : 1;
          const P = [r0 * Math.cos(nu0), my * r0 * Math.sin(nu0)], Vv = [-kk * Math.sin(nu0), my * kk * (eH + Math.cos(nu0))];
          const dIn = [Math.sqrt(1 - 1 / (eH * eH)), my * (eH - 1 / eH)], rot = Math.atan2(uy, ux) - Math.atan2(dIn[1], dIn[0]), cr = Math.cos(rot), sr = Math.sin(rot);
          const s0 = [cr * P[0] - sr * P[1], sr * P[0] + cr * P[1], cr * Vv[0] - sr * Vv[1], sr * Vv[0] + cr * Vv[1]];
          const R = centralOrbit((r) => -GMJ / (r * r), s0, { T: (2.2 * D0) / vinf, eta: 0.002, rmin: 0.2 * RJ, maxSteps: 80000 });
          const Lst = R.s[R.s.length - 1];
          let rmin = Infinity; for (const S of R.s) rmin = Math.min(rmin, Math.hypot(S[0], S[1]));
          // outgoing asymptote of the simulated end state (its osculating hyperbola): v∞ and direction
          const el = kepEl(GMJ, ...Lst), sg = Math.sign(el.h) || 1, ex = el.ex / el.e, ey = el.ey / el.e, qx = -sg * ey, qy = sg * ex;
          const vinfOut = Math.sqrt(Math.max(0, 2 * el.E)), sn = Math.sqrt(Math.max(0, 1 - 1 / (el.e * el.e))), k1 = GMJ / Math.abs(el.h);
          const voutA = [k1 * (-sn * ex + (el.e - 1 / el.e) * qx), k1 * (-sn * ey + (el.e - 1 / el.e) * qy)];
          const turn = Math.atan2(rel[0] * voutA[1] - rel[1] * voutA[0], rel[0] * voutA[0] + rel[1] * voutA[1]);
          const e = Math.sqrt(1 + (b * b * vinf ** 4) / GMJ ** 2), dTheory = 2 * Math.asin(1 / e);
          const hin = [VJ + rel[0], rel[1]], hout = [VJ + voutA[0], voutA[1]];
          return { R, rel, vinf, vinfOut, turn, dTheory, hin, hout, rmin, crash: R.stop === 'centre' || rmin < RJ, b, e, eSim: el.e, T: R.t[R.t.length - 1] };
        });
        v.animate((t) => {
          { const p = aimAt(); if (!B.dragging && (Math.abs(p[0] - B.x) > 1e-9 || Math.abs(p[1] - B.y) > 1e-9)) { B.x = p[0]; B.y = p[1]; } }
          const D = run();
          // the encounter window: while Jupiter moves ±45 R_J around closest approach
          const ic = D.R.s.reduce((bi, Q, i, A) => (Math.hypot(Q[0], Q[1]) < Math.hypot(A[bi][0], A[bi][1]) ? i : bi), 0), tc = D.R.t[ic], tau = (45 * L) / VJ;
          const t0 = Math.max(0, tc - tau), t1 = Math.min(D.T, tc + tau), simT = t0 + ((t % 6) / 6) * (t1 - t0), S = stateAt(D.R, simT);
          // planet frame
          s.circle(0, 0, 1, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1 });
          for (const y of [-0.45, 0, 0.45]) s.line(-Math.sqrt(1 - y * y), y, Math.sqrt(1 - y * y), y, { color: 'orange', width: 1, alpha: 0.6 });
          s.path(D.R.s.map((Q) => [Q[0] / L, Q[1] / L]), { color: D.crash ? 'red' : 'accent', width: 2.2 });
          s.dot(S[0] / L, S[1] / L, { r: 5, color: 'gold' });
          const inV = D.R.s.findIndex((Q) => Math.hypot(Q[0], Q[1]) < 30 * L), outV = D.R.s.length - 1 - [...D.R.s].reverse().findIndex((Q) => Math.hypot(Q[0], Q[1]) < 30 * L), k = 7 / (D.vinf || 1);
          if (inV >= 0) { const a0 = D.R.s[inV]; s.arrow(a0[0] / L, a0[1] / L, a0[0] / L + k * a0[2], a0[1] / L + k * a0[3], { color: 'blue', width: 2.4 }); }
          if (!D.crash && outV < D.R.s.length) { const aN = D.R.s[outV]; s.arrow(aN[0] / L, aN[1] / L, aN[0] / L + k * aN[2], aN[1] / L + k * aN[3], { color: 'orange', width: 2.4 }); }
          s.arrow(-34, 22, -22, 22, { color: 'green', width: 2 }); s.text('Jupiter’s motion (Sun frame)', -34, 22, { color: 'green', size: 10, dy: -10, align: 'left' });
          if (D.crash) s.corner('hits Jupiter', 'tl', { color: 'red', weight: 600 });
          // velocity diagram (km/s)
          const kv = 1e-3;
          vd.circle(13.07, 0, D.vinf * kv, { color: 'faint', width: 1.2, dash: [4, 4] });
          vd.arrow(0, 0, 13.07, 0, { color: 'green', width: 2.6 });
          vd.tex('\\mathbf V_J', 6.5, 0, { color: 'green', size: 14, dy: 13 });
          vd.arrow(0, 0, D.hin[0] * kv, D.hin[1] * kv, { color: 'blue', width: 2.4 });
          if (!D.crash) {
            vd.arrow(0, 0, D.hout[0] * kv, D.hout[1] * kv, { color: 'orange', width: 2.4 });
            vd.line(13.07, 0, D.hin[0] * kv, D.hin[1] * kv, { color: 'blue', width: 1, dash: [3, 3] });
            vd.line(13.07, 0, D.hout[0] * kv, D.hout[1] * kv, { color: 'orange', width: 1, dash: [3, 3] });
            vd.dot(D.hout[0] * kv, D.hout[1] * kv, { r: 4, color: 'orange', label: '$\\mathbf v_{\\rm out}$', labelPos: 'se' });
          }
          vd.dot(0, 0, { r: 3, color: 'ink' });
          // Sun frame: position = relative position + V (t − t_closest), shown over the encounter window
          const pts = []; D.R.s.forEach((Q, i) => { if (D.R.t[i] >= t0 && D.R.t[i] <= t1) pts.push([(Q[0] + VJ * (D.R.t[i] - tc)) / L, Q[1] / L]); });
          let ylo = -6, yhi = 6; for (const p of pts) { ylo = Math.min(ylo, p[1]); yhi = Math.max(yhi, p[1]); }
          sf.setView([-52, 52], [Math.min(-14, ylo - 4), Math.max(14, yhi + 4)]);
          sf.path(pts, { color: D.crash ? 'red' : 'accent', width: 2.2 });
          const jx = (VJ * (simT - tc)) / L;
          sf.line(-80, 0, 80, 0, { color: 'faint', width: 1, dash: [3, 5] });
          sf.circle(jx, 0, 1, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1 });
          sf.dot((S[0] + VJ * (simT - tc)) / L, S[1] / L, { r: 5, color: 'gold' });
          const p0 = pts[0] || [0, 0], pN = pts[pts.length - 1] || [0, 0], kk = 7 / 15e3;
          sf.arrow(p0[0], p0[1], p0[0] + kk * D.hin[0], p0[1] + kk * D.hin[1], { color: 'blue', width: 2.2 });
          if (!D.crash) sf.arrow(pN[0], pN[1], pN[0] + kk * D.hout[0], pN[1] + kk * D.hout[1], { color: 'orange', width: 2.2 });
          cur = D;
        }, { period: 7, still: 4.2 });
        v.legend([['blue', 'incoming velocity'], ['orange', 'outgoing velocity'], ['green', 'Jupiter’s orbital velocity'], ['accent', 'craft path']]);
        v.readout(() => {
          if (!cur) return '';
          const D = cur;
          if (D.crash) return String.raw`closest approach ${v.fix(D.rmin / RJ, 2)} $R_J$ — inside Jupiter: aim farther out`;
          const gin = Math.hypot(...D.hin) / 1e3, gout = Math.hypot(...D.hout) / 1e3;
          return String.raw`Jupiter’s frame: $v_\infty$ in ${v.fix(D.vinf / 1e3, 4)} km/s, out ${v.fix(D.vinfOut / 1e3, 4)} km/s (equal), turned by ${v.fix((Math.abs(D.turn) * 180) / Math.PI, 2)}° (predicted from $b$: $e = ${v.fix(D.e, 4)}$, $2\arcsin(1/e) = ${v.fix((D.dTheory * 180) / Math.PI, 2)}°$), closest approach ${v.fix(D.rmin / RJ, 2)} $R_J$ · Sun’s frame: ${v.fix(gin, 2)} → ${v.fix(gout, 2)} km/s, **${gout >= gin ? 'gain' : 'loss'} of ${v.fix(Math.abs(gout - gin), 2)} km/s** (the velocity vector changes by $2v_\infty\sin(\delta/2) = ${v.fix((2 * D.vinf * Math.sin(D.dTheory / 2)) / 1e3, 2)}$ km/s; the speed gains its component along the motion), i.e. ${v.fix((gout ** 2 - gin ** 2) / 2, 1)} MJ per kg taken from Jupiter’s orbit`;
        });
      },
    },
  ],
};
