// Astrophysics & Celestial Mechanics — Chapter 2: The three-body problem, resonance and chaos (2.1–2.6; 2.7–2.12 in ch02-b.js)

import { TAU, DEG, clamp, memo, sci, wrap360, omega2, jacobi, lagrange, cr3bp, toInertial, helio, fromElements, helioToRotating, kepE } from './ch02.shared.js';

// ── helpers local to this part ────────────────────────────────────────────────
/** Elliptic (or circular, e = 0) restricted problem integrated in the inertial barycentric frame, planar.
 *  Primaries on Kepler ellipses (a = 1, n = 1) starting at periapsis. s0 = [X, Y, VX, VY]. Returns records with E, h, C. */
function ertbpInertial(mu, ep, s0, T, o = {}) {
  const eta = o.eta ?? 0.01, maxN = o.maxSteps ?? 60000, R1 = o.r1min ?? 0, R2 = o.r2min ?? 0;
  const prim = (t) => { const E = kepE(t, ep), x = Math.cos(E) - ep, y = Math.sqrt(1 - ep * ep) * Math.sin(E); return [x, y]; };
  const acc = (X, Y, t, A) => {
    const [px, py] = prim(t), x1 = -mu * px, y1 = -mu * py, x2 = (1 - mu) * px, y2 = (1 - mu) * py;
    const d1x = X - x1, d1y = Y - y1, d2x = X - x2, d2y = Y - y2, r1 = Math.hypot(d1x, d1y), r2 = Math.hypot(d2x, d2y);
    A[0] = -(1 - mu) * d1x / r1 ** 3 - mu * d2x / r2 ** 3; A[1] = -(1 - mu) * d1y / r1 ** 3 - mu * d2y / r2 ** 3; A[2] = r1; A[3] = r2;
    return A;
  };
  const rec = (t, X, Y, U, W) => {
    const [px, py] = prim(t), r1 = Math.hypot(X + mu * px, Y + mu * py), r2 = Math.hypot(X - (1 - mu) * px, Y - (1 - mu) * py);
    const E = 0.5 * (U * U + W * W) - (1 - mu) / r1 - mu / r2, h = X * W - Y * U, f = Math.atan2(py, px);
    const c = Math.cos(f), s = Math.sin(f);
    return { t, X, Y, x: c * X + s * Y, y: -s * X + c * Y, E, h, C: -2 * (E - h), f, sep: Math.hypot(px, py) };
  };
  let [X, Y, U, W] = s0, t = 0, stop = 'time';
  const out = [rec(0, X, Y, U, W)], A = [0, 0, 0, 0], B = [0, 0, 0, 0], Cc = [0, 0, 0, 0], D = [0, 0, 0, 0];
  for (let n = 0; n < maxN; n++) {
    acc(X, Y, t, A);
    const r1 = A[2], r2 = A[3];
    if (r1 < R1 || r2 < R2) { stop = 'collision'; break; }
    let h = eta * Math.min(1, Math.sqrt(r1 ** 3 / (1 - mu)), Math.sqrt(r2 ** 3 / mu));
    if (t + h > T) h = T - t;
    if (h <= 1e-12) break;
    acc(X + 0.5 * h * U, Y + 0.5 * h * W, t + 0.5 * h, B);
    const U2 = U + 0.5 * h * A[0], W2 = W + 0.5 * h * A[1];
    acc(X + 0.5 * h * U2, Y + 0.5 * h * W2, t + 0.5 * h, Cc);
    const U3 = U + 0.5 * h * B[0], W3 = W + 0.5 * h * B[1];
    acc(X + h * U3, Y + h * W3, t + h, D);
    const U4 = U + h * Cc[0], W4 = W + h * Cc[1];
    X += (h / 6) * (U + 2 * U2 + 2 * U3 + U4); Y += (h / 6) * (W + 2 * W2 + 2 * W3 + W4);
    U += (h / 6) * (A[0] + 2 * B[0] + 2 * Cc[0] + D[0]); W += (h / 6) * (A[1] + 2 * B[1] + 2 * Cc[1] + D[1]);
    t += h;
    out.push(rec(t, X, Y, U, W));
  }
  out.stop = stop;
  return out;
}
/** Primary (gold disc) and secondary markers in a rotating-frame panel. */
function primaries(s, mu, o = {}) {
  s.dot(-mu, 0, { r: o.r1 ?? 8, color: o.c1 || 'blue' });
  s.dot(1 - mu, 0, { r: o.r2 ?? 4.5, color: o.c2 || 'muted' });
  if (o.labels) { s.text(o.labels[0], -mu, 0, { color: o.c1 || 'blue', size: 10.5, dy: 16, align: 'center' }); s.text(o.labels[1], 1 - mu, 0, { color: o.c2 || 'muted', size: 10.5, dy: 13, align: 'center' }); }
}
/** Mark the Lagrange points with small crosses and labels. */
function markL(s, L, o = {}) {
  for (const k of ['L1', 'L2', 'L3', 'L4', 'L5']) {
    const [x, y] = L[k];
    s.line(x - 0.025, y, x + 0.025, y, { color: o.color || 'ink', width: 1.4 }); s.line(x, y - 0.025, x, y + 0.025, { color: o.color || 'ink', width: 1.4 });
    if (o.labels !== false) s.text(k, x, y, { color: o.color || 'ink', size: 10.5, dx: 5, dy: k === 'L5' ? 10 : -9, align: 'left' });
  }
}
/** Co-orbital guiding-centre potential S(φ) = 1/(2|sin(φ/2)|) − cos φ and its derivative. */
const Sco = (p) => 0.5 / Math.abs(Math.sin(p / 2)) - Math.cos(p);
const Sco1 = (p) => -0.25 * Math.cos(p / 2) * Math.sign(Math.sin(p / 2)) / Math.sin(p / 2) ** 2 + Math.sin(p);
/** Integrate the scaled guiding-centre equations dφ/dτ = −(3/2)x̃, dx̃/dτ = 2S′(φ) for one full libration; returns {pts: [[φ, x̃]], T}. */
function coorbital(phi0, x0, maxTau = 400) {
  let p = phi0, x = x0, t = 0, turns = 0, t1 = 0, h = 0.002;
  const pts = [[p, x]], f = (pp, xx) => [-1.5 * xx, 2 * Sco1(pp)];
  while (t < maxTau && turns < 3) {
    const k1 = f(p, x), k2 = f(p + 0.5 * h * k1[0], x + 0.5 * h * k1[1]), k3 = f(p + 0.5 * h * k2[0], x + 0.5 * h * k2[1]), k4 = f(p + h * k3[0], x + h * k3[1]);
    const pn = p + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), xn = x + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    if (x !== 0 && Math.sign(xn) !== Math.sign(x)) { turns++; if (turns === 1) t1 = t; if (turns === 3) { pts.push([pn, xn]); t += h; break; } }
    p = pn; x = xn; t += h;
    if (pts.length < 6000 && (pts.length < 2 || Math.abs(pts[pts.length - 1][0] - p) + Math.abs(pts[pts.length - 1][1] - x) > 0.01)) pts.push([p, x]);
    if (p <= 0.002 || p >= TAU - 0.002) break;
  }
  return { pts, T: turns >= 3 ? t - t1 : NaN };
}

// ── real systems (mass ratios μ = m/(M + m)) ─────────────────────────────────
const MU_SJ = 9.5388e-4, MU_EM = 0.012150, MU_PC = 0.1086;

export default {
  collection: 'astro',
  chapter: 2,
  title: 'The three-body problem, resonance and chaos',
  summary: String.raw`With a third body, Kepler’s neat ellipses give way to rich dynamics. Building on the restricted problem and its Lagrange points from mechanics, the Jacobi integral bounds where a small body can go, and two of the Lagrange points are stable when the masses are lopsided enough — home to the Trojan asteroids and to the horseshoe dance of Janus and Epimetheus. The Hill sphere sets the reach of a planet’s gravity, and Tisserand’s parameter survives even a close encounter with Jupiter. Slow secular exchanges of eccentricity, mean-motion resonances that empty the Kirkwood gaps or lock Jupiter’s moons together, Kozai oscillations and outright chaos complete the picture of a solar system that is stable only on average.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Theorem',
      name: 'Jacobi integral',
      statement: String.raw`In the circular restricted three-body problem — a massless particle moving under two masses $1-\mu$ and $\mu$ that circle their barycentre with angular velocity $n = 1$ (unit separation, $G(m_1+m_2) = 1$) — the quantity
$$C_J = 2\Omega(x,y,z) - (\dot x^2 + \dot y^2 + \dot z^2),\qquad \Omega = \tfrac12(x^2+y^2) + \frac{1-\mu}{r_1} + \frac{\mu}{r_2},$$
computed in the frame rotating with the primaries, is conserved. Equivalently, in the inertial frame neither the particle’s energy $E$ nor its angular momentum $h$ (per unit mass) is conserved, but the combination $E - n h = -C_J/2$ is. It is the only known integral of the problem, and it requires the primaries’ orbit to be circular.`,
      idea: String.raw`In the rotating frame the equations of motion are $\ddot{\mathbf r} + 2\,\hat{\mathbf z}\times\dot{\mathbf r} = \nabla\Omega$ (mech 9.6), with the centrifugal force absorbed into $\Omega$ (mech 9.12) and no explicit time dependence. Dotting with $\dot{\mathbf r}$ kills the Coriolis term, which does no work, leaving $\frac{d}{dt}\big(\tfrac12|\dot{\mathbf r}|^2 - \Omega\big) = 0$. In the inertial frame the potential is time-dependent, so $E$ changes; but it depends on time only through rotation at rate $n$, so $dE/dt = n\,dh/dt$. If the primaries move on ellipses the rotating-frame potential pulsates in time and the argument fails.`,
      caption: String.raw`Earth–Moon system ($\mu = 0.01215$). Drag the **start** point and the tip of the **velocity** arrow (rotating frame, left) to launch a particle; it is integrated for 40 time units (6.4 months) and also shown in the inertial frame (right). Below: the changes in its inertial energy $\Delta E$ and angular momentum $\Delta h$ jump at every lunar fly-by, but they jump *together*, so $\Delta C_J$ (green) stays flat to integrator precision. Give the primaries an eccentric orbit and the Jacobi “constant” starts to wander.`,
      deps: ['mech-9.12', 'mech-9.6'],
      see: ['mech-8.20'],
      refs: ['Murray–Dermott §3.3'],
      tags: ['three-body', 'integrals', 'rotating frame'],
      credit: 'Jacobi, 1836',
      viz(v) {
        const mu = MU_EM, K = 0.5; // velocity drawn K length units per unit speed
        const ep = v.slider('eccentricity of the primaries’ orbit $e\'$', 0, 0.1, 0, { step: 0.005 });
        const s = v.stage({ x: [-1.45, 1.45], y: [-1.3, 1.3], equal: true, axes: false, height: 330, weight: 1.1, title: 'rotating frame (Earth left, Moon right)' });
        const si = v.stage({ x: [-1.45, 1.45], y: [-1.3, 1.3], equal: true, axes: false, height: 330, weight: 1, title: 'the same orbit, inertial frame' });
        const g = v.stage({ x: [0, 40], y: [-1, 1], axes: 'box', height: 210, full: true, xlabel: 'time (units of 1/n; 2π = one lunar month)', ylabel: 'change since t = 0', title: 'energy and angular momentum change, their combination does not' });
        let vel = [0, 0.5];
        const P = s.handle(0.8, 0, { color: 'accent', label: 'start', labelPos: 'sw' });
        const Vt = s.handle(0.8 + K * vel[0], K * vel[1], { color: 'orange', label: 'v', labelPos: 'ne' });
        P.onDrag = () => { Vt.x = P.x + K * vel[0]; Vt.y = P.y + K * vel[1]; };
        Vt.onDrag = () => { vel = [(Vt.x - P.x) / K, (Vt.y - P.y) / K]; };
        const cache = memo();
        const run = () => cache(`${P.x.toFixed(5)}|${P.y.toFixed(5)}|${vel[0].toFixed(5)}|${vel[1].toFixed(5)}|${ep.value}`, () => {
          const x = P.x, y = P.y, s0 = [x, y, vel[0] - y, vel[1] + x];
          const R = ertbpInertial(mu, ep.value, s0, 40, { eta: 0.008, r1min: 0.0166, r2min: 0.0045, maxSteps: 80000 });
          const E0 = R[0].E, h0 = R[0].h, C0 = R[0].C;
          let dE = 0, dh = 0, dC = 0;
          for (const q of R) { dE = Math.max(dE, Math.abs(q.E - E0)); dh = Math.max(dh, Math.abs(q.h - h0)); dC = Math.max(dC, Math.abs(q.C - C0)); }
          return { R, E0, h0, C0, dE, dh, dC };
        });
        let cur = null;
        v.render(() => {
          const D = run(), L = lagrange(mu);
          let ext = 1.25; for (const q of D.R) ext = Math.max(ext, Math.min(3, 1.06 * Math.max(Math.abs(q.x), Math.abs(q.y), Math.abs(q.X), Math.abs(q.Y))));
          s.setView([-ext * 1.1, ext * 1.1], [-ext, ext]); si.setView([-ext * 1.1, ext * 1.1], [-ext, ext]);
          // trajectory (rotating frame of the primaries' line)
          s.path(D.R.map((q) => [q.x, q.y]), { color: 'accent', width: 1.3, alpha: 0.85 });
          markL(s, L, { color: 'faint', labels: false });
          primaries(s, mu, { labels: ['Earth', 'Moon'] });
          const last = D.R[D.R.length - 1];
          s.dot(last.x, last.y, { r: 4, color: 'accent' });
          // inertial frame
          si.circle(0, 0, 1 - mu, { color: 'faint', width: 1, dash: [3, 4] });
          si.path(D.R.map((q) => [q.X, q.Y]), { color: 'accent', width: 1.2, alpha: 0.85 });
          si.dot(0, 0, { r: 7, color: 'blue' });
          const fl = last.f, sl = last.sep;
          si.dot((1 - mu) * sl * Math.cos(fl), (1 - mu) * sl * Math.sin(fl), { r: 4.5, color: 'muted' });
          si.dot(last.X, last.Y, { r: 4, color: 'accent' });
          si.text('Moon’s orbit', 0, -(1 - mu), { color: 'faint', size: 10.5, dy: 12, align: 'center' });
          s.arrow(P.x, P.y, Vt.x, Vt.y, { color: 'orange', width: 2.2 });
          if (D.R.stop === 'collision') s.corner('collided — move the start', 'tl', { color: 'red', weight: 600 });
          else s.corner(`$C_J = ${v.fix(D.C0, 4)}$`, 'tl', { color: 'green', weight: 600 });
          // time series
          const span = Math.max(0.05, D.dE, D.dh) * 1.15;
          g.setView([0, 40], [-span, span]);
          g.hline(0, { color: 'faint', width: 1 });
          g.path(D.R.map((q) => [q.t, q.E - D.E0]), { color: 'red', width: 2 });
          g.path(D.R.map((q) => [q.t, q.h - D.h0]), { color: 'blue', width: 1.6, dash: [6, 4] });
          g.path(D.R.map((q) => [q.t, q.C - D.C0]), { color: 'green', width: 2.6 });
          cur = D;
        });
        v.legend([['red', 'energy change $\\Delta E$ (inertial)'], ['blue', 'angular momentum change $\\Delta h$', { dash: true }], ['green', 'Jacobi constant change $\\Delta C_J = -2(\\Delta E - \\Delta h)$']]);
        v.readout(() => {
          if (!cur) return '';
          const D = cur;
          let out = String.raw`$C_J = ${v.fix(D.C0, 6)}$ (necks: $C_{L1} = 3.1883$, $C_{L2} = 3.1722$, $C_{L3} = 3.0121$) · over the run $\max|\Delta E| = ${v.fix(D.dE, 4)}$, $\max|\Delta h| = ${v.fix(D.dh, 4)}$, but $\max|\Delta C_J| = ${sci(v, D.dC)}$`;
          if (ep.value > 0) out += String.raw` — with $e' = ${ep.value}$ the potential pulsates once per orbit, energy is no longer tied to angular momentum, and $C_J$ is not conserved`;
          else out += ' — conserved to the accuracy of the integrator';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Zero-velocity curves and Hill regions',
      statement: String.raw`For a given value of the Jacobi constant $C_J$, the particle can only be where $2\Omega(x, y, z) \ge C_J$, since $v^2 = 2\Omega - C_J \ge 0$. The boundary $2\Omega = C_J$ is the **zero-velocity curve** (surface in 3D); the allowed sets are the **Hill regions**. In decreasing order of $C_J$, with $C_{L1} > C_{L2} > C_{L3} > C_{L4} = C_{L5}$:
- $C_J > C_{L1}$: three disjoint regions — around the primary, around the secondary, and far outside; a particle near one mass is trapped there forever;
- $C_{L2} < C_J < C_{L1}$: a neck opens at $L_1$ and the two inner regions merge;
- $C_{L3} < C_J < C_{L2}$: a second neck opens at $L_2$, so escape to infinity becomes possible past the secondary;
- $C_{L4} < C_J < C_{L3}$: the neck at $L_3$ opens and the forbidden zones shrink to two tadpoles around $L_4$, $L_5$;
- $C_J < C_{L4}$: no planar region is forbidden.`,
      idea: String.raw`It follows from the Jacobi integral (2.1) alone: $2\Omega - C_J$ is a squared speed. The Lagrange points are the critical points of $\Omega$ (mech 9.12) — $L_1, L_2, L_3$ are saddles and $L_4, L_5$ maxima — and by Morse theory the topology of the sub-level sets of $-2\Omega$ changes exactly as $C_J$ passes their values, which is why the necks open there and in that order. The curves bound where the particle may go, not how it moves; they are exact, but give a sufficient condition for confinement only.`,
      caption: String.raw`Shaded: the forbidden region $2\Omega < C_J$, outlined by the zero-velocity curve, for the system you choose. Lower $C_J$ with the slider and watch the necks open at $L_1$, then $L_2$, then $L_3$. Drag the **launch** point and the direction handle: the particle starts with exactly the speed $\sqrt{2\Omega - C_J}$ the constant allows and is integrated in the rotating frame — it bounces off the curves but never crosses them. Right: $2\Omega$ along the $x$-axis; the line $C_J$ cuts it where the curves cross the axis, and the necks open when it drops below the minima at $L_1$, $L_2$, $L_3$.`,
      deps: ['astro-2.1'],
      see: ['mech-9.12'],
      refs: ['Murray–Dermott §3.10'],
      tags: ['three-body', 'Hill regions', 'Lagrange points'],
      credit: 'Hill, 1878',
      viz(v) {
        const SYS = { em: { mu: MU_EM, l: ['Earth', 'Moon'] }, pc: { mu: MU_PC, l: ['Pluto', 'Charon'] }, sj: { mu: MU_SJ, l: ['Sun', 'Jupiter'] } };
        const sys = v.select('system', [{ value: 'em', label: 'Earth–Moon (μ = 0.012)' }, { value: 'pc', label: 'Pluto–Charon (μ = 0.11)' }, { value: 'sj', label: 'Sun–Jupiter (μ = 0.00095)' }], 'em');
        const range = () => { const L = lagrange(SYS[sys.value].mu); return [L.C.L4 - 0.04, L.C.L1 + 0.12, L]; };
        const Cof = (u) => { const [lo, hi] = range(); return lo + u * (hi - lo); };
        const uS = v.slider('Jacobi constant $C_J$', 0, 1, 0.64, { step: 0.001, fmt: (u) => v.fix(Cof(u), 4) });
        const s = v.stage({ x: [-1.6, 1.6], y: [-1.3, 1.3], equal: true, axes: false, height: 380, weight: 1.35, title: 'forbidden region (shaded) and an orbit with this C' });
        const p = v.stage({ x: [-1.6, 1.6], y: [2.9, 3.6], axes: 'box', height: 380, weight: 1, xlabel: 'x (y = 0)', ylabel: '2Ω', title: 'profile along the x-axis' });
        let ang = (2 * Math.PI) / 3;
        const H = s.handle(0.7, 0.0, { color: 'accent', label: 'launch', labelPos: 'sw' });
        const Dh = s.handle(0.7 + 0.25 * Math.cos(ang), 0.25 * Math.sin(ang), { color: 'orange', r: 6 });
        H.onDrag = () => { Dh.x = H.x + 0.25 * Math.cos(ang); Dh.y = H.y + 0.25 * Math.sin(ang); };
        Dh.onDrag = () => { ang = Math.atan2(Dh.y - H.y, Dh.x - H.x); Dh.x = H.x + 0.25 * Math.cos(ang); Dh.y = H.y + 0.25 * Math.sin(ang); };
        const cache = memo();
        let cur = null;
        v.render(() => {
          const mu = SYS[sys.value].mu, C = Cof(uS.value), L = range()[2];
          const ink = v.rgb('ink');
          s.raster((x, y) => (omega2(mu, x, y) < C ? [ink[0], ink[1], ink[2], 46] : null), { key: `${mu}|${C}`, res: 2 });
          s.contour((x, y) => omega2(mu, x, y), [C], { color: 'ink', width: 1.6, res: 220 });
          markL(s, L, { color: 'red' });
          // orbit launched with the allowed speed
          const v2 = omega2(mu, H.x, H.y) - C;
          let R = null, worst = NaN;
          if (v2 > 0) {
            R = cache(`${mu}|${C}|${H.x.toFixed(4)}|${H.y.toFixed(4)}|${ang.toFixed(4)}`, () => {
              const sp = Math.sqrt(v2), s0 = [H.x, H.y, 0, sp * Math.cos(ang), sp * Math.sin(ang), 0];
              const r = cr3bp(mu, s0, { T: 30, eta: 0.01, hmax: 0.03, every: 0.01, stop: (q) => Math.hypot(q[0] + mu, q[1]) < 0.01 || Math.hypot(q[0] - 1 + mu, q[1]) < 0.003 || Math.hypot(q[0], q[1]) > 4, maxSteps: 120000 });
              let w = -Infinity; for (const q of r.s) w = Math.max(w, C - omega2(mu, q[0], q[1]));
              r.worst = w; return r;
            });
            worst = R.worst;
            s.path(R.s.map((q) => [q[0], q[1]]), { color: 'accent', width: 1.3, alpha: 0.9 });
          }
          primaries(s, mu, { labels: SYS[sys.value].l, r2: mu > 0.05 ? 6 : 4.5 });
          s.arrow(H.x, H.y, Dh.x, Dh.y, { color: 'orange', width: 2 });
          if (!(v2 > 0)) s.corner('launch point is in the forbidden region', 'tl', { color: 'red', weight: 600 });
          // profile along the x-axis
          const lo = L.C.L4 - 0.15, hi = L.C.L1 + 0.45;
          p.setView([-1.6, 1.6], [lo, hi]);
          p.fn((x) => omega2(mu, x, 0), { color: 'blue', width: 2, n: 800 });
          p.between((x) => Math.min(Math.max(omega2(mu, x, 0), lo), C), () => C, -1.6, 1.6, { fill: 'ink', fillAlpha: 0.12 });
          p.hline(C, { color: 'green', width: 1.8 });
          for (const k of ['L1', 'L2', 'L3']) { const x = L[k][0]; p.dot(x, L.C[k], { r: 4, color: 'red' }); p.text(k, x, L.C[k], { color: 'red', size: 10.5, dy: 12, align: 'center' }); }
          p.hline(L.C.L4, { color: 'red', width: 1, dash: [3, 3], alpha: 0.6 });
          p.text('C at L4, L5', 1.55, L.C.L4, { color: 'red', size: 10, dy: -8, align: 'right' });
          p.tex('C_J', 0.25, C, { color: 'green', size: 13, dy: -11, align: 'left' });
          cur = { mu, C, L, worst, R, v2 };
        });
        v.legend([['ink', 'forbidden: $2\\Omega < C_J$', { area: true }], ['red', 'Lagrange points'], ['accent', 'orbit with this $C_J$'], ['green', '$C_J$ level (right)']]);
        v.readout(() => {
          if (!cur) return '';
          const { C, L, worst, R, v2 } = cur, Cs = L.C;
          const phase = C > Cs.L1 ? 'all necks closed: three separate regions — a particle near one body is trapped there' : C > Cs.L2 ? 'neck at L1 open: the two inner regions merge, but nothing can escape' : C > Cs.L3 ? 'L2 neck open too: escape to infinity past the secondary is allowed' : C > Cs.L4 ? 'L3 open as well: only tadpole-shaped zones around L4 and L5 remain forbidden' : 'below C at L4/L5: nothing in the plane is forbidden';
          let out = String.raw`$C_J = ${v.fix(C, 4)}$ ($C_{L1} = ${v.fix(Cs.L1, 4)}$, $C_{L2} = ${v.fix(Cs.L2, 4)}$, $C_{L3} = ${v.fix(Cs.L3, 4)}$, $C_{L4,5} = ${v.fix(Cs.L4, 4)}$): ${phase}`;
          if (R && v2 > 0) out += String.raw` · along the orbit the smallest $v^2 = 2\Omega - C_J$ is ${v.fix(-worst, 4)} ≥ 0: it never enters the shading${R.stop === 'stop' ? ' (stopped at a collision or escape)' : ''}`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Stability of L4 and L5 (Routh’s criterion)',
      statement: String.raw`The triangular Lagrange points $L_4$, $L_5$ of the circular restricted problem are linearly stable if and only if
$$27\,\mu(1-\mu) < 1,\qquad\text{i.e.}\qquad \mu < \mu_R = \tfrac12\Big(1 - \sqrt{23/27}\Big) \approx 0.03852 .$$
Linearising about $L_4$ gives the characteristic equation $\lambda^4 + \lambda^2 + \tfrac{27}{4}\mu(1-\mu) = 0$ (frequencies in units of the orbital rate $n$). Below $\mu_R$ all four roots are imaginary, $\lambda = \pm i\omega_{1,2}$, and a small displacement librates as a sum of a short-period epicycle ($\omega_1 \approx 1$) and a long-period drift around $L_4$ ($\omega_2 \approx \sqrt{27\mu/4}$); above $\mu_R$ two roots have positive real part and displacements grow exponentially. The Sun–Jupiter ($\mu \approx 0.001$) and Earth–Moon ($\mu \approx 0.012$) points are stable; Pluto–Charon ($\mu \approx 0.11$) is not.`,
      idea: String.raw`At $L_4$ the effective potential $\Omega$ is a maximum (mech 9.12), so without rotation it would be unstable. In the rotating frame the Coriolis force turns a particle sliding off the hill into a circling motion (mech 11.14 discusses this gyroscopic stabilisation of a potential maximum): the linear system is $\ddot{\boldsymbol\xi} + 2\hat{\mathbf z}\times\dot{\boldsymbol\xi} = \mathsf H\boldsymbol\xi$ with $\mathsf H$ the Hessian of $\Omega$ at $L_4$, and its characteristic polynomial is the quartic above. Its roots $\lambda^2 = \tfrac12\big(-1\pm\sqrt{1-27\mu(1-\mu)}\big)$ are real and negative exactly when the discriminant is positive; at $\mu_R$ the two frequencies collide and split off the imaginary axis.`,
      caption: String.raw`Drag μ along the bottom strip (real systems marked; red past Routh’s value). Left: the four roots of the characteristic equation; they stay on the imaginary axis until μ reaches 0.0385, collide, and leave it — two into the right half-plane (instability). Middle: drag the gold point to nudge a particle off $L_4$ (rotating frame, zoomed): below $\mu_R$ it librates on a small epicyclic loop that drifts round $L_4$; above it spirals away. Right: the size of the displacement on a log scale against the predicted growth $e^{\mathrm{Re}\,\lambda\, t}$.`,
      deps: ['mech-9.12', 'mech-11.14'],
      refs: ['Murray–Dermott §3.7', 'Murray–Dermott §3.8'],
      tags: ['three-body', 'stability', 'Lagrange points'],
      credit: 'Gascheau, 1843; Routh, 1875',
      viz(v) {
        const MUR = 0.5 * (1 - Math.sqrt(23 / 27));
        const ev = v.stage({ x: [-0.45, 0.45], y: [-1.15, 1.15], axes: true, height: 300, weight: 0.75, title: 'roots λ (units of n)', xlabel: 'Re λ', ylabel: 'Im λ' });
        const z = v.stage({ x: [-0.1, 0.1], y: [-0.1, 0.1], equal: true, axes: false, height: 300, weight: 1, title: 'near L4 (rotating frame)' });
        const gr = v.stage({ x: [0, 25], y: [-4, 1], axes: 'box', height: 300, weight: 1, xlabel: 'time (orbits)', ylabel: 'log₁₀ |displacement|', title: 'growth or libration' });
        const m = v.stage({ x: [1e-4, 0.5], y: [0, 1], xlog: true, axes: false, height: 92, full: true, title: 'mass ratio μ = m₂/(m₁ + m₂) — drag the handle' });
        const MH = m.handle(MU_EM, 0.45, { color: 'accent', constrain: 'x', r: 8 });
        let off = [0.006, 0.004];
        const L4of = () => [0.5 - MH.x, Math.sqrt(3) / 2];
        const Pn = z.handle(0.5 - MU_EM + 0.006, Math.sqrt(3) / 2 + 0.004, { color: 'gold', label: 'nudge', labelPos: 'ne',
          constrain: (x, y) => { const L4 = L4of(); off = [clamp(x - L4[0], -0.02, 0.02), clamp(y - L4[1], -0.02, 0.02)]; return [L4[0] + off[0], L4[1] + off[1]]; } });
        const roots = (mu) => {
          const d = 1 - 27 * mu * (1 - mu);
          if (d >= 0) { const a = Math.sqrt((1 + Math.sqrt(d)) / 2), b = Math.sqrt((1 - Math.sqrt(d)) / 2); return [[0, a], [0, -a], [0, b], [0, -b]]; }
          // λ² = (−1 ± i√|d|)/2 → λ = ±√ of a complex number
          const re = -0.5, im = Math.sqrt(-d) / 2, r = Math.hypot(re, im), th = Math.atan2(im, re), sr = Math.sqrt(r);
          const w1 = [sr * Math.cos(th / 2), sr * Math.sin(th / 2)], w2 = [sr * Math.cos(-th / 2), sr * Math.sin(-th / 2)];
          return [w1, [-w1[0], -w1[1]], w2, [-w2[0], -w2[1]]];
        };
        const locus = []; for (let k = 0; k <= 400; k++) { const mu = 1e-4 * Math.pow(5000, k / 400); locus.push(roots(mu)); }
        const cache = memo();
        let cur = null;
        v.render(() => {
          const mu = MH.x, rts = roots(mu), stable = 27 * mu * (1 - mu) < 1, L4 = [0.5 - mu, Math.sqrt(3) / 2];
          // eigenvalue plane
          for (let j = 0; j < 4; j++) ev.dots(locus.map((r) => r[j]), { r: 1.1, color: 'faint' });
          ev.vband(0, 0.45, { color: 'red', alpha: 0.06 });
          rts.forEach((r) => ev.dot(r[0], r[1], { r: 5.5, color: r[0] > 1e-9 ? 'red' : 'green' }));
          ev.text('unstable', 0.43, -1.05, { color: 'red', size: 10.5, align: 'right' });
          // integration
          if (!Pn.dragging) { Pn.x = L4[0] + off[0]; Pn.y = L4[1] + off[1]; }
          const D = cache(`${mu}|${off[0].toFixed(4)}|${off[1].toFixed(4)}`, () => {
            const s0 = [L4[0] + off[0], L4[1] + off[1], 0, 0, 0, 0], T = 25 * TAU;
            const R = cr3bp(mu, s0, { T, eta: 0.02, hmax: 0.05, every: 0.05, stop: (q) => Math.hypot(q[0] - L4[0], q[1] - L4[1]) > 1.2 || Math.hypot(q[0] + mu, q[1]) < 0.02 || Math.hypot(q[0] - 1 + mu, q[1]) < 0.02 });
            const lg = R.s.map((q, k) => [R.t[k] / TAU, Math.log10(Math.max(1e-12, Math.hypot(q[0] - L4[0], q[1] - L4[1])))]);
            return { R, lg };
          });
          // zoomed rotating view (auto-expanding)
          let ext = 0.06; for (const q of D.R.s) ext = Math.max(ext, Math.min(1.1, 1.1 * Math.max(Math.abs(q[0] - L4[0]), Math.abs(q[1] - L4[1]))));
          z.setView([L4[0] - ext, L4[0] + ext], [L4[1] - ext, L4[1] + ext]);
          z.clip(() => { z.path(D.R.s.map((q) => [q[0], q[1]]), { color: stable ? 'accent' : 'red', width: 1.2, alpha: 0.9 }); primaries(z, mu); });
          const cr = ext * 0.05;
          z.line(L4[0] - cr, L4[1], L4[0] + cr, L4[1], { color: 'ink', width: 1.5 }); z.line(L4[0], L4[1] - cr, L4[0], L4[1] + cr, { color: 'ink', width: 1.5 });
          z.text('L4', L4[0], L4[1], { color: 'ink', size: 11, dx: -6, dy: 10, align: 'right' });
          z.corner(`window ±${v.fix(ext, 3)} (separation = 1)`, 'bl', { color: 'faint', size: 10.5 });
          // growth panel
          const reL = Math.max(...rts.map((r) => r[0])), lg0 = D.lg[0][1];
          gr.setView([0, 25], [Math.min(-3, lg0 - 1), 1]);
          gr.path(D.lg, { color: stable ? 'accent' : 'red', width: 1.6 });
          if (reL > 1e-9) gr.fn((t) => lg0 + (reL * TAU * t) / Math.LN10, { color: 'ink', width: 1.2, dash: [5, 4] });
          // μ strip
          const SYSM = [[2.4e-4, 'Saturn–Titan'], [MU_SJ, 'Sun–Jupiter'], [MU_EM, 'Earth–Moon'], [MU_PC, 'Pluto–Charon'], [0.5, 'equal masses']];
          m.rect(MUR, 0.15, 0.5, 0.75, { fill: 'red', fillAlpha: 0.1, stroke: false });
          m.line(1e-4, 0.45, 0.5, 0.45, { color: 'muted', width: 1.2 });
          m.line(MUR, 0.15, MUR, 0.8, { color: 'red', width: 1.5 });
          m.text('Routh 0.0385', MUR, 0.88, { color: 'red', size: 10.5, align: 'center' });
          for (const [x, lab] of SYSM) { m.line(x, 0.35, x, 0.55, { color: 'ink', width: 1.2 }); m.text(lab, x, 0.15, { color: 'muted', size: 10, align: x > 0.3 ? 'right' : 'center' }); }
          cur = { mu, rts, stable, reL, D };
        });
        v.legend([['green', 'stable roots (imaginary)', { dot: true }], ['red', 'unstable roots / orbit', { dot: true }], ['accent', 'librating orbit'], ['ink', 'predicted growth $e^{\\mathrm{Re}\\,\\lambda\\,t}$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { mu, rts, stable, reL } = cur, im = rts.map((r) => Math.abs(r[1])).sort((a, b) => b - a);
          let out = String.raw`$\mu = ${v.fix(mu, mu < 0.01 ? 5 : 4)}$: $27\mu(1-\mu) = ${v.fix(27 * mu * (1 - mu), 4)}$ ${stable ? '< 1' : '> 1'}`;
          if (stable) out += String.raw` — stable: $\omega_1 = ${v.fix(im[0], 4)}$, $\omega_2 = ${v.fix(im[2], 4)}$ (long libration period ${v.fix(1 / im[2], 1)} orbits; $\sqrt{27\mu/4} = ${v.fix(Math.sqrt(6.75 * mu), 4)}$)`;
          else out += String.raw` — unstable: $\mathrm{Re}\,\lambda = ${v.fix(reL, 4)}\,n$, displacements grow ×10 every ${v.fix(Math.LN10 / (reL * TAU), 2)} orbits`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Phenomenon',
      name: 'Trojans, tadpole and horseshoe orbits',
      statement: String.raw`A small body sharing a planet’s orbit ($a \approx a_p$, $\mu = m_p/M \ll 1$) does not stay put relative to the planet. Averaged over its short epicycles, its longitude relative to the planet, $\phi = \lambda - \lambda_p$, and its fractional semi-major-axis offset $x = \delta a/a$ obey
$$\dot\phi = -\tfrac32 n x,\qquad \tfrac34 x^2 + 2\mu S(\phi) = \text{const},\qquad S(\phi) = \frac{1}{2|\sin(\phi/2)|} - \cos\phi .$$
$S$ has minima at $\phi = \pm 60^\circ$ ($L_4$, $L_5$) and a maximum at $180^\circ$ ($L_3$). Orbits with $\tfrac12 < \tfrac38 x^2/\mu + S < \tfrac32$ librate around one triangular point (**tadpoles**, like Jupiter’s Trojan asteroids, libration period $\approx 2\pi/\sqrt{27\mu/4}$ orbits — about 150 years); those above $\tfrac32$ enclose $L_3$, $L_4$ and $L_5$ (**horseshoes**), approaching the planet from alternate sides. Saturn’s moons Janus and Epimetheus, whose orbits differ by about 50 km, swap places on a horseshoe every four years.`,
      idea: String.raw`Seen from the rotating frame (Jacobi integral 2.1), a co-orbital drifts slowly because its period differs slightly from the planet’s ($\dot\phi \propto -x$ by Kepler’s third law), while the planet’s gravity — strongest at closest approach — changes $x$. Expanding the Jacobi constant to second order in $x$ and first order in $\mu$, with the particle on a near-circular orbit, gives the conserved quantity above; it is a pendulum-like phase portrait with two stable centres at the stable triangular points (2.3) and a separatrix through $L_3$. The zero-velocity curves of 2.2 are the boundaries of the same regions in configuration space.`,
      caption: String.raw`Right: the averaged phase portrait — longitude from the planet against $\delta a$ in units of $a\sqrt\mu$, which makes it the same for every planet; the bold curve is the separatrix through $L_3$. Drag the gold start point: inside the separatrix you get a tadpole, outside a horseshoe. Left: the orbit in the frame co-rotating with the planet, radially stretched (factor shown) so a band a few thousandths wide becomes visible. For Jupiter and the Earth the dots are full restricted-three-body integrations, the dashed curve the averaged theory; for Janus and Epimetheus ($\mu = 4.3\times10^{-9}$, 4200 orbits per cycle) only the averaged model is drawn, started where the observed four-year swaps put it.`,
      deps: ['astro-2.3', 'astro-2.2'],
      see: ['mech-9.12'],
      refs: ['Murray–Dermott §3.9', 'Murray–Dermott §3.12'],
      tags: ['co-orbital', 'Trojans', 'horseshoe'],
      viz(v) {
        // planet period P (days); Janus–Epimetheus: masses 1.898e18 + 5.266e17 kg, Saturn 5.683e26 kg, a = 151 460 km, P = 0.6945 d
        const PRE = {
          jup: { mu: MU_SJ, P: 11.862 * 365.25, name: 'Jupiter', unitA: 5.2026, unit: 'AU', full: true, start: [85, 0] },
          earth: { mu: 3.003e-6, P: 365.256, name: 'Earth', unitA: 1, unit: 'AU', full: true, start: [180, 1.5] },
          je: { mu: (1.898e18 + 5.266e17) / 5.683e26, P: 0.6945, name: 'Janus', unitA: 151460, unit: 'km', full: false, start: [180, 4.79] },
        };
        const pre = v.select('co-orbitals of', [{ value: 'jup', label: 'Jupiter (Trojans)' }, { value: 'earth', label: 'the Earth' }, { value: 'je', label: 'Janus & Epimetheus' }], 'jup', { onChange: (k) => { H.x = PRE[k].start[0]; H.y = PRE[k].start[1]; } });
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 360, weight: 1, title: 'frame rotating with the planet' });
        const R = v.stage({ x: [0, 360], y: [-4, 4], axes: 'box', height: 360, weight: 1.25, xlabel: 'longitude from the planet φ (°)', ylabel: 'δa / (a√μ)', title: 'averaged co-orbital phase portrait', xticks: [0, 60, 120, 180, 240, 300, 360] });
        const ylim = () => (pre.value === 'je' ? 6 : 4);
        const H = R.handle(85, 0, { color: 'gold', r: 7, label: 'start', labelPos: 'ne', constrain: (x, y) => [clamp(x, 8, 352), clamp(y, -ylim() + 0.1, ylim() - 0.1)] });
        const cacheA = memo(), cacheF = memo();
        let cur = null;
        v.render(() => {
          const P = PRE[pre.value], mu = P.mu, smu = Math.sqrt(mu), phi0 = H.x * DEG, x0 = H.y, K = 0.375 * x0 * x0 + Sco(phi0);
          // averaged model
          const A = cacheA(`${phi0}|${x0}`, () => coorbital(phi0, x0));
          // phase portrait
          R.setView([0, 360], [-ylim(), ylim()]);
          const lev = pre.value === 'je' ? [0.55, 0.8, 1.1, 1.75, 2.5, 4, 6, 9, 13] : [0.55, 0.65, 0.8, 1.0, 1.25, 1.75, 2.2, 3, 4.5];
          R.contour((x, y) => 0.375 * y * y + Sco(x * DEG), lev, { color: 'faint', width: 1, res: 160 });
          R.contour((x, y) => 0.375 * y * y + Sco(x * DEG), [1.5], { color: 'ink', width: 2, res: 240 });
          R.vband(0, 8, { color: 'red', alpha: 0.08 }); R.vband(352, 360, { color: 'red', alpha: 0.08 });
          for (const [x, lab] of [[60, 'L4'], [180, 'L3'], [300, 'L5']]) { R.dot(x, 0, { r: 3.5, color: 'red' }); R.text(lab, x, 0, { color: 'red', size: 10.5, dy: 12, align: 'center' }); }
          R.text('planet', 4, -ylim() * 0.9, { color: 'red', size: 10, align: 'left' });
          // full integration (not for Janus–Epimetheus); skip while dragging
          let F = null;
          if (P.full && !H.dragging) {
            F = cacheF(`${pre.value}|${phi0}|${x0}`, () => {
              const a = 1 + x0 * smu, vc = Math.sqrt((1 - mu) / a);
              const Hs = [a * Math.cos(phi0), a * Math.sin(phi0), 0, -vc * Math.sin(phi0), vc * Math.cos(phi0), 0];
              const s0 = helioToRotating(mu, Hs, 0);
              const Ttheory = isFinite(A.T) ? A.T / smu : 2000;
              const T = Math.min(1.08 * Ttheory, mu < 1e-5 ? 4200 : 1400);
              const r = cr3bp(mu, s0, { T, eta: 0.025, hmax: 0.06, every: T / 1500, maxSteps: 400000, stop: (q) => Math.hypot(q[0] - 1 + mu, q[1]) < 0.02 * Math.cbrt(mu / 3) * 10 });
              const pts = r.s.map((q, k) => { const el = helio(mu, q, 0); let ph = Math.atan2(q[1], q[0] + mu); ph = wrap360(ph / DEG); return [ph, (el.a - 1) / smu, q]; });
              // measured period: sign changes of δa with hysteresis (the osculating δa wiggles on the synodic period)
              let xm = 0; for (const q of pts) xm = Math.max(xm, Math.abs(q[1]));
              const th = 0.3 * xm, turns = []; let side = 0;
              for (let k = 0; k < pts.length; k++) { const y = pts[k][1]; if (y > th && side !== 1) { if (side) turns.push(r.t[k]); side = 1; } else if (y < -th && side !== -1) { if (side) turns.push(r.t[k]); side = -1; } }
              const Tm = turns.length >= 3 ? turns[2] - turns[0] : turns.length === 2 ? 2 * (turns[1] - turns[0]) : NaN; // the two halves take equal times (time-reversal symmetry)
              return { r, pts, Tm };
            });
            R.dots(F.pts.map((q) => [q[0], q[1]]), { r: 1.6, color: 'accent', alpha: 0.6 });
          }
          R.path(A.pts.map((q) => [wrap360(q[0] / DEG), q[1]]).filter((q, k, arr) => k === 0 || Math.abs(q[0] - arr[k - 1][0]) < 180), { color: 'gold', width: 1.6, dash: [5, 3] });
          // rotating-frame view with radial stretch
          let dmax = 1e-9;
          for (const q of A.pts) dmax = Math.max(dmax, Math.abs(q[1]) * smu);
          const stretch = clamp(0.32 / dmax, 1, 1e7);
          L.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          const toXY = (ph, dr) => { const r = 1 + stretch * dr; return [r * Math.cos(ph), r * Math.sin(ph)]; };
          if (F) L.path(F.pts.map((q) => { const s = q[2], r = Math.hypot(s[0] + mu, s[1]); return toXY(Math.atan2(s[1], s[0] + mu), r - 1); }), { color: 'accent', width: 1.1, alpha: 0.85 });
          L.path(A.pts.map((q) => toXY(q[0], q[1] * smu)), { color: 'gold', width: 1.6, dash: F ? [5, 3] : null });
          for (const [deg, lab] of [[60, 'L4'], [180, 'L3'], [300, 'L5']]) { const p = toXY(deg * DEG, 0); L.dot(p[0], p[1], { r: 3, color: 'red' }); L.text(lab, p[0], p[1], { color: 'red', size: 10.5, dx: deg === 180 ? -8 : 6, align: deg === 180 ? 'right' : 'left' }); }
          L.dot(0, 0, { r: 7, color: 'gold' }); L.dot(1, 0, { r: 5, color: 'orange' });
          L.text(P.name, 1, 0, { color: 'orange', size: 10.5, dx: 8, align: 'left' });
          L.corner(`radial offsets stretched ×${stretch >= 100 ? v.fix(stretch, 0) : v.fix(stretch, 1)}`, 'bl', { color: 'faint', size: 10.5 });
          cur = { P, K, A, F, smu, mu, x0, phi0 };
        });
        v.legend([['gold', 'averaged (guiding-centre) model', { dash: true }], ['accent', 'full restricted three-body integration', { dot: true }], ['ink', 'separatrix through L3']]);
        v.readout(() => {
          if (!cur) return '';
          const { P, K, A, F, smu, x0, phi0 } = cur, yrs = (tau) => (tau / smu / TAU) * P.P / 365.25;
          const type = K < 1.5 ? 'tadpole (librates about ' + (phi0 < Math.PI ? 'L4' : 'L5') + ')' : 'horseshoe (encloses L3, L4 and L5)';
          let out = String.raw`level $\tfrac38\tilde x^2 + S(\phi) = ${v.fix(K, 3)}$ ⇒ ${type}`;
          if (isFinite(A.T)) out += String.raw` · averaged-model period ${v.fix(yrs(A.T), 2)} yr`;
          if (F && isFinite(F.Tm)) out += String.raw`, full integration ${v.fix((F.Tm / TAU) * P.P / 365.25, 2)} yr`;
          if (pre.value === 'jup') out += String.raw` · small tadpoles: $2\pi/\sqrt{27\mu/4}$ = ${v.fix(11.862 / Math.sqrt(6.75 * MU_SJ), 0)} yr`;
          if (pre.value === 'je') out += String.raw` · start at φ = 180° with $\delta a = ${v.fix(x0 * smu * 151460, 1)}$ km between the two orbits: they swap every ${isFinite(A.T) ? v.fix(yrs(A.T) / 2, 2) : '—'} yr (observed: 2006, 2010, 2014, 2018, 2022)`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Definition',
      name: 'Hill sphere',
      statement: String.raw`The **Hill sphere** of a planet of mass $m$ on a near-circular orbit of radius $a$ about a star of mass $M\gg m$ is the region of radius
$$r_H = a\Big(\frac{m}{3M}\Big)^{1/3}$$
around the planet — the distance of the Lagrange points $L_1$ and $L_2$ to leading order in $(m/M)^{1/3}$. Inside it the planet’s gravity dominates the tidal pull of the star, and the zero-velocity curve through $L_1$ encloses a lobe about the planet of roughly this size. Satellites must orbit well inside: numerically, circular prograde orbits survive out to about $0.5\,r_H$, retrograde ones considerably farther. Earth: $r_H = 1.5\times10^6$ km (the Moon is at $0.26\,r_H$); Jupiter: $0.35$ AU.`,
      idea: String.raw`Near the planet, the restricted problem reduces to Hill’s problem: the planet’s pull $Gm/r^2$ against the tidal-plus-centrifugal acceleration $3GMr/a^3$ of the frame rotating with the planet (mech 9.12). They balance at $r^3 = ma^3/3M$, which is where $L_1$, $L_2$ sit; inside the Jacobi lobe through $L_1$ (2.2) a particle cannot leave. Lengths scale as $r_H$ and times as the orbital period, so in units of $r_H$ the picture is the same for every planet. Retrograde satellites are more robust because the Coriolis force on them points inward.`,
      caption: String.raw`Left: the neighbourhood of the planet in units of $r_H$, in the frame rotating with it (the star is far to the left). Ten test moons start on circular orbits at 0.3–1.2 $r_H$ and are followed for ten planetary orbits: green if they stay bound, red if they escape. The purple lobe is the zero-velocity curve through $L_1$; the dashed circle is $r_H$. Drag the gold moon to launch your own. Right: how long moons survive against starting distance, for prograde and retrograde orbits — the result hardly depends on the planet, as Hill’s scaling predicts. Retrograde moons survive even outside the zero-velocity lobe: the Jacobi criterion guarantees confinement but is not needed for it.`,
      deps: ['mech-9.12', 'astro-2.2'],
      refs: ['Murray–Dermott §3.13'],
      tags: ['three-body', 'satellites', 'stability'],
      credit: 'Hill, 1878',
      viz(v) {
        const PL = { earth: { mu: 3.003e-6, a: 1, name: 'Earth', km: 1.496e8 }, jup: { mu: MU_SJ, a: 5.2026, name: 'Jupiter', km: 1.496e8 }, nep: { mu: 5.15e-5, a: 30.07, name: 'Neptune', km: 1.496e8 } };
        const pl = v.select('planet', [{ value: 'earth', label: 'Earth' }, { value: 'jup', label: 'Jupiter' }, { value: 'nep', label: 'Neptune' }], 'earth');
        const retro = v.toggle('retrograde moons', false);
        const s = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], equal: true, axes: false, height: 360, weight: 1, title: 'around the planet (units of $r_H$)' });
        const g = v.stage({ x: [0.1, 1.35], y: [-1.4, 10.8], axes: 'box', height: 360, weight: 1, xlabel: 'starting distance ($r_H$)', ylabel: 'time bound (planet orbits, max 10)', title: 'survival of circular moons' });
        const Hm = s.handle(0.42, 0, { color: 'gold', r: 7, label: 'your moon', labelPos: 'n', constrain: (x, y) => [clamp(x, 0.12, 1.5), 0] });
        const NOR = 10, Tend = NOR * TAU;
        const moon = (mu, d, sgn, rec) => {
          const rH = Math.cbrt(mu / 3), r = d * rH, xp = 1 - mu, vc = Math.sqrt(mu / r);
          const s0 = [xp + r, 0, 0, 0, sgn * vc - r, 0];
          let tEsc = Infinity;
          const R = cr3bp(mu, s0, { T: Tend, eta: 0.03, hmax: 0.05, every: rec ? 0.01 : 1e9, maxSteps: 200000, stop: (q, t) => { if (Math.hypot(q[0] - xp, q[1], q[2]) > 2.5 * rH) { tEsc = t; return true; } return false; } });
          return { R, tEsc, rH };
        };
        const cacheS = memo(), cacheT = memo(), cacheU = memo();
        let cur = null;
        v.render(() => {
          const P = PL[pl.value], mu = P.mu, rH = Math.cbrt(mu / 3), sg = retro.value ? -1 : 1, xp = 1 - mu;
          // survival curves (both senses)
          const surv = cacheS(pl.value, () => {
            const out = { pro: [], ret: [] };
            for (let d = 0.15; d <= 1.3001; d += 0.05) for (const [k, sgn] of [['pro', 1], ['ret', -1]]) { const m = moon(mu, d, sgn, false); out[k].push([d, isFinite(m.tEsc) ? m.tEsc / TAU : NOR]); }
            const edge = (arr) => { for (const [d, t] of arr) if (t < NOR) return d; return NaN; };
            out.ePro = edge(out.pro); out.eRet = edge(out.ret);
            return out;
          });
          // trajectories of ten moons
          const tr = cacheT(`${pl.value}|${sg}`, () => { const out = []; for (let d = 0.3; d <= 1.2001; d += 0.1) out.push({ d, ...moon(mu, d, sg, true) }); return out; });
          const mine = cacheU(`${pl.value}|${sg}|${Hm.x.toFixed(3)}`, () => moon(mu, Hm.x, sg, true));
          // left panel: positions relative to the planet in units of r_H
          const rel = (q) => [(q[0] - xp) / rH, q[1] / rH];
          s.contour((x, y) => omega2(mu, xp + x * rH, y * rH), [lagrange(mu).C.L1], { color: 'purple', width: 1.8, res: 160 });
          s.circle(0, 0, 1, { color: 'muted', width: 1, dash: [2, 4] });
          s.clip(() => {
            for (const T of tr) s.path(T.R.s.map(rel), { color: isFinite(T.tEsc) ? 'red' : 'green', width: 1, alpha: 0.75 });
            s.path(mine.R.s.map(rel), { color: 'gold', width: 1.4, alpha: 0.95 });
          });
          const L = lagrange(mu);
          for (const k of ['L1', 'L2']) { const x = (L[k][0] - xp) / rH; s.dot(x, 0, { r: 3.5, color: 'red' }); s.text(k, x, 0, { color: 'red', size: 10.5, dy: 12, align: 'center' }); }
          s.dot(0, 0, { r: 6, color: 'blue' });
          s.arrow(-1.25, 1.3, -1.6, 1.3, { color: 'gold', width: 1.6, head: 7 }); s.text('to the star', -1.22, 1.3, { color: 'gold', size: 10.5, align: 'left' });
          s.tex('r_H', 0.71, 0.71, { color: 'muted', size: 12, dx: 6, align: 'left' });
          // right panel
          g.vline(1, { color: 'muted', width: 1, dash: [2, 4] });
          g.path(surv.pro, { color: 'blue', width: 2.2 }); g.dots(surv.pro, { r: 3, color: 'blue' });
          g.path(surv.ret, { color: 'orange', width: 2.2 }); g.dots(surv.ret, { r: 3, color: 'orange' });
          if (pl.value === 'earth') { g.vline(384400 / (rH * 1.496e8), { color: 'teal', width: 1.4, dash: [4, 3] }); g.text('Moon', 384400 / (rH * 1.496e8), 8.8, { color: 'teal', size: 10.5, dx: 4, align: 'left' }); }
          g.dot(Hm.x, isFinite(mine.tEsc) ? mine.tEsc / TAU : NOR, { r: 6, color: 'gold' });
          cur = { P, rH, surv, mine };
        });
        v.legend([['green', 'stays bound'], ['red', 'escapes'], ['blue', 'prograde (right)'], ['orange', 'retrograde (right)'], ['purple', 'zero-velocity curve through L1']]);
        v.readout(() => {
          if (!cur) return '';
          const { P, rH, surv, mine } = cur;
          const km = rH * P.a * P.km;
          let out = String.raw`${P.name}: $r_H = a(\mu/3)^{1/3} = ${v.fix(rH * P.a, 4)}$ AU $= ${v.sci(km, 3)}$ km; $L_1$ and $L_2$ at ${v.fix((1 - P.mu - lagrange(P.mu).L1[0]) / rH, 3)} and ${v.fix((lagrange(P.mu).L2[0] - 1 + P.mu) / rH, 3)} $r_H$`;
          out += String.raw` · circular moons first escape (within 10 orbits) from ${v.fix(surv.ePro, 2)} $r_H$ (prograde) and ${v.fix(surv.eRet, 2)} $r_H$ (retrograde)`;
          out += ` · your moon at ${v.fix(Hm.x, 2)} $r_H$ ${isFinite(mine.tEsc) ? `escapes after ${v.fix(mine.tEsc / TAU, 2)} orbits` : 'stays bound'}`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Tisserand’s criterion',
      statement: String.raw`For a small body (say a comet) whose heliocentric osculating elements are $a, e, i$, the **Tisserand parameter** with respect to a planet on a circular orbit of radius $a_p$,
$$T_p = \frac{a_p}{a} + 2\cos i\,\sqrt{\frac{a}{a_p}(1 - e^2)},$$
is approximately conserved through any encounter with that planet, even one that changes $a$, $e$ and $i$ drastically: $T_p$ equals the Jacobi constant up to terms of order $\mu = m_p/M_\odot$ and of the particle’s distance from the planet. So two comets seen before and after a close approach to Jupiter can be the same body only if their $T_J$ agree. Jupiter-family comets have $2 < T_J < 3$.`,
      idea: String.raw`Write the Jacobi constant (2.1) far from the planet, where the planet’s potential term is negligible: $C_J \approx 2(1-\mu)/r - v^2 + 2h_z$ in inertial variables. The vis-viva equation (1.2) turns $2/r - v^2$ into $1/a$, and $h_z = \sqrt{a(1-e^2)}\cos i$; so $C_J \approx 1/a + 2\sqrt{a(1-e^2)}\cos i$ in units of $a_p$. The encounter itself is where the approximation fails, but $C_J$ is exactly conserved throughout, so the Tisserand parameter after the encounter returns to its old value.`,
      caption: String.raw`A comet on an orbit crossing Jupiter’s is integrated in the restricted problem (Sun–Jupiter, inclined orbits allowed); the encounter offset slider changes how close it passes. Left: its path in the inertial frame (blue before, orange after the encounter) with Jupiter’s orbit. Right: its osculating $a/a_J$, $e$ and $i$ jump at the encounter, while $T_J$ (green) dips during the encounter — where the osculating elements lose their meaning — and then returns to its old value.`,
      deps: ['astro-2.1'],
      see: ['astro-1.2', 'mech-8.15'],
      refs: ['Murray–Dermott §3.4'],
      tags: ['comets', 'three-body', 'invariants'],
      credit: 'Tisserand, 1889',
      viz(v) {
        const mu = MU_SJ, AJ = 5.2026;
        const aS = v.slider('initial $a$ (AU)', 2.8, 4.8, 3.5, { step: 0.01 });
        const eS = v.slider('initial $e$', 0.3, 0.8, 0.6, { step: 0.01 });
        const iS = v.slider('initial $i$', 0, 30, 5, { step: 0.5, fmt: (x) => `${x}°` });
        const dS = v.slider('encounter offset (Jupiter’s lead, °)', -4, 4, -1, { step: 0.05 });
        const s = v.stage({ x: [-8, 8], y: [-8, 8], equal: true, axes: false, height: 360, weight: 1, title: 'inertial frame (AU)' });
        const g = v.stage({ x: [0, 40], y: [-0.25, 3.4], axes: 'box', height: 360, weight: 1.2, xlabel: 'time (years)', ylabel: 'osculating elements', title: '$a, e, i$ change; $T_J$ does not' });
        const Tis = (el) => 1 / el.a + 2 * Math.sqrt(Math.max(0, el.a * (1 - el.e * el.e))) * Math.cos(el.i);
        const cache = memo();
        const run = () => cache([aS.value, eS.value, iS.value, dS.value].join('|'), () => {
          const a = aS.value / AJ, e = eS.value, p = a * (1 - e * e), cnu = (p - 1) / e;
          if (Math.abs(cnu) > 1) return { none: true, q: a * (1 - e) * AJ, Q: a * (1 + e) * AJ };
          const nuc = Math.acos(cnu), Ec = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nuc / 2), Math.sqrt(1 + e) * Math.cos(nuc / 2)), tc = (Ec - e * Math.sin(Ec)) / Math.sqrt((1 - mu) / a ** 3);
          // phase Jupiter so that the encounter happens on the comet's second outbound crossing (one undisturbed orbit first)
          const tc2 = tc + TAU * Math.sqrt(a ** 3 / (1 - mu));
          const Hs = fromElements(1 - mu, a, e, iS.value * DEG, tc2 + dS.value * DEG, -nuc, 0);
          const s0 = helioToRotating(mu, Hs, 0);
          const T = tc2 + 40;
          const R = cr3bp(mu, s0, { T, eta: 0.01, hmax: 0.05, every: 0.04, maxSteps: 300000, stop: (q) => Math.hypot(q[0] + mu, q[1], q[2]) < 0.01 || Math.hypot(q[0], q[1], q[2]) > 30 });
          const rec = R.s.map((q, k) => { const t = R.t[k], el = helio(mu, q, t), I = toInertial(q, t); return { t, el, T: Tis(el), X: (I[0] + mu * Math.cos(t)) * AJ, Y: (I[1] + mu * Math.sin(t)) * AJ, d: Math.hypot(q[0] - 1 + mu, q[1], q[2]) }; });
          let kmin = 0; rec.forEach((r, k) => { if (r.d < rec[kmin].d) kmin = k; });
          const C0 = jacobi(mu, R.s[0]), C1 = jacobi(mu, R.s[R.s.length - 1]);
          return { rec, kmin, tc: tc2, C0, C1, stop: R.stop };
        });
        let cur = null;
        v.render(() => {
          const D = run(), yr = 11.862 / TAU;
          s.circle(0, 0, AJ, { color: 'muted', width: 1, dash: [4, 4], alpha: 0.8 });
          s.dot(0, 0, { r: 6, color: 'gold' });
          if (D.none) { s.corner(`no crossing: q = ${v.fix(D.q, 2)}, Q = ${v.fix(D.Q, 2)} AU`, 'tl', { color: 'red', weight: 600 }); g.text('the orbit does not cross Jupiter’s', 20, 1.7, { color: 'red', align: 'center' }); cur = D; return; }
          const k0 = D.kmin;
          let lim = 7; for (const r of D.rec) lim = Math.max(lim, Math.min(30, Math.max(Math.abs(r.X), Math.abs(r.Y)) * 1.05));
          s.setView([-lim, lim], [-lim, lim]);
          s.clip(() => {
            s.path(D.rec.slice(0, k0 + 1).map((r) => [r.X, r.Y]), { color: 'blue', width: 1.6 });
            s.path(D.rec.slice(k0).map((r) => [r.X, r.Y]), { color: 'orange', width: 1.6 });
          });
          const tE = D.rec[k0].t, jx = AJ * Math.cos(tE), jy = AJ * Math.sin(tE);
          s.dot(jx, jy, { r: 5, color: 'red', label: 'Jupiter at encounter', labelPos: jx > 0 ? (jy > 0 ? 'ne' : 'se') : jy > 0 ? 'nw' : 'sw' });
          s.dot(D.rec[k0].X, D.rec[k0].Y, { r: 3, color: 'ink' });
          // time series
          const tmax = D.rec[D.rec.length - 1].t * yr;
          g.setView([0, tmax], [-0.25, 3.4]);
          g.vline(tE * yr, { color: 'red', width: 1, dash: [3, 3], alpha: 0.7 });
          const ser = (f, c, w, dash) => g.path(D.rec.map((r) => [r.t * yr, f(r)]).filter((q) => isFinite(q[1]) && q[1] > -1 && q[1] < 4), { color: c, width: w, dash });
          ser((r) => (r.el.a > 0 ? r.el.a : NaN), 'blue', 1.8);
          ser((r) => r.el.e, 'orange', 1.8);
          ser((r) => r.el.i / (30 * DEG), 'purple', 1.8);
          ser((r) => r.T, 'green', 2.6);
          const lastR = D.rec[D.rec.length - 1];
          g.tex('T_J', tmax, lastR.T, { color: 'green', size: 13, dx: -4, dy: -11, align: 'right' });
          g.tex('a/a_J', tmax, lastR.el.a, { color: 'blue', size: 12, dx: -4, dy: -10, align: 'right' });
          g.text('e', tmax, lastR.el.e, { color: 'orange', size: 10.5, dx: -4, dy: -8, align: 'right' });
          g.text('i/30°', tmax, lastR.el.i / (30 * DEG), { color: 'purple', size: 10.5, dx: -4, dy: -9, align: 'right' });
          cur = D;
        });
        v.legend([['blue', 'before / $a/a_J$'], ['orange', 'after / $e$'], ['purple', '$i$ (in units of 30°)'], ['green', 'Tisserand parameter $T_J$']]);
        v.readout(() => {
          const D = cur; if (!D) return '';
          if (D.none) return 'choose a and e so that perihelion < 5.2 AU < aphelion';
          const b = D.rec[0], a = D.rec[D.rec.length - 1], rH = Math.cbrt(mu / 3);
          const f = (r) => String.raw`$a = ${r.el.a > 0 ? v.fix(r.el.a * AJ, 2) + '\\text{ AU}' : '\\text{(hyperbolic)}'}$, $e = ${v.fix(r.el.e, 3)}$, $i = ${v.fix(r.el.i / DEG, 1)}^\circ$`;
          return String.raw`closest approach ${v.fix(D.rec[D.kmin].d * AJ, 3)} AU (${v.fix(D.rec[D.kmin].d / rH, 2)} Hill radii) · before: ${f(b)}, $T_J = ${v.fix(b.T, 4)}$ · after: ${f(a)}, $T_J = ${v.fix(a.T, 4)}$ (change ${v.fix(Math.abs(a.T - b.T), 4)}, of order μ = 0.001) · Jacobi constant $C_J$ drift $${sci(v, Math.abs(D.C1 - D.C0))}$`;
        });
      },
    },
  ],
};
