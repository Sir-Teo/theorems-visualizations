// Classical Mechanics — Chapter 9: Non-inertial frames (part a: 9.1–9.7)

import { TAU, DEG, OMEGA, memo, rk4, rk4rec, idxAt, span, sci, num, rot, zcross, turntable, spinArrow, farrow, series } from './ch09.shared.js';

// ── 3D rotations (9.4) ────────────────────────────────────────────────────────
/** Rotation matrix about the vector w by the angle |w| (Rodrigues). */
function rodrigues(w) {
  const th = Math.hypot(w[0], w[1], w[2]);
  if (th < 1e-300) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const x = w[0] / th, y = w[1] / th, z = w[2] / th, c = Math.cos(th), s = Math.sin(th), C = 1 - c;
  return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
}
const mat3 = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
const vec3 = (A, p) => A.map((r) => r[0] * p[0] + r[1] * p[1] + r[2] * p[2]);
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const fro = (A, B) => { let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += (A[i][j] - B[i][j]) ** 2; return Math.sqrt(s); };
const scale3 = (p, k) => p.map((c) => c * k);
const add3 = (p, q) => p.map((c, i) => c + q[i]);

export default {
  collection: 'mech',
  chapter: 9,
  title: 'Non-inertial frames',
  summary: String.raw`Newton’s laws keep working in an accelerating or rotating frame once fictitious forces are added, each proportional to the mass. A uniformly accelerating frame is indistinguishable from uniform gravity (the equivalence principle), and only the non-uniform part of gravity across a freely falling Earth survives to raise the tides. In a rotating frame the centrifugal and Coriolis forces shape a spinning bucket of water, push falling bodies east, turn the swing plane of the Foucault pendulum, steer winds along the isobars and hold the Trojan asteroids at the Lagrange points; Larmor’s theorem trades a weak magnetic field for a rotation. Most pictures here show one motion twice, from an inertial frame and from the moving one, side by side.`,
  items: [
    // ───────────────────────────────────────────────────────────── 9.1
    {
      num: '9.1',
      kind: 'Definition',
      name: 'Accelerating frames and inertial forces',
      statement: String.raw`Let a frame $S'$ move relative to an inertial frame $S$ without rotating, its origin having acceleration $\mathbf A(t)$. Positions are related by $\mathbf r = \mathbf R(t) + \mathbf r'$, so $\ddot{\mathbf r}' = \ddot{\mathbf r} - \mathbf A$, and Newton’s second law in $S$, $m\ddot{\mathbf r} = \mathbf F$, reads in $S'$
$$m\ddot{\mathbf r}' = \mathbf F - m\mathbf A .$$
The extra term $\mathbf F_{\rm in} = -m\mathbf A$ is an **inertial (fictitious) force**. It acts on every body in proportion to its mass, has no source body and no third-law partner, and vanishes exactly when $S'$ is itself inertial. With it included, Newton’s laws can be used in the accelerating frame as if it were inertial. In uniform gravity $\mathbf g$ the two mass-proportional forces combine into an **effective gravity** $\mathbf g_{\rm eff} = \mathbf g - \mathbf A$. For example, a plumb line in a car accelerating horizontally at $A$ hangs at $\arctan(A/g)$ from the vertical, and a pendulum of length $\ell$ swings about that direction with small-amplitude period $2\pi\sqrt{\ell/g_{\rm eff}}$, where $g_{\rm eff} = \sqrt{g^2 + A^2}$.`,
      idea: String.raw`Differentiate $\mathbf r = \mathbf R + \mathbf r'$ twice. The two frames agree on forces (springs measure them) and on time, but their accelerations differ by $\mathbf A$; moving $m\mathbf A$ to the force side of the second law (1.6) gives the fictitious force. Inertial frames (1.4) are exactly the frames that need no such force. The bob in the car shows both bookkeepings. From the road, tension plus weight must supply the bob’s forward acceleration, so the string tilts back. From the car the bob hangs at rest because tension, weight and $-m\mathbf A$ balance, and the pendulum (4.4) simply feels a stronger, tilted gravity.`,
      caption: String.raw`One run seen from two frames. Left: from the road, an inertial frame. The view pans with the car, but the road markings and lamp posts are fixed to the road. The only forces on the bob are the tension (blue) and its weight (ink), plus a little air drag, and their sum (green) is mass times the bob’s acceleration measured from the road. Right: from the car. Add the inertial force $-m\mathbf A$ (orange) and the sum (green) is the bob’s acceleration relative to the car, which dies away as it settles. Change the acceleration, or set the damping to zero to keep it swinging about the tilted vertical.`,
      deps: ['mech-1.4', 'mech-1.6', 'mech-4.4'],
      see: ['rel-3.5', 'rel-6.3'],
      refs: ['Taylor §9.1'],
      tags: ['fictitious force', 'reference frames', 'pendulum'],
      viz(v) {
        const g = 9.81, L = 1, T = 12, DT = 0.002, EV = 5, KF = 0.072;
        const aS = v.slider('car’s acceleration $A$ (m/s²)', 0, 9.81, 4, { step: 0.01 });
        const gS = v.slider('damping $\\gamma$ (1/s)', 0, 1.2, 0.3, { step: 0.01 });
        const WX = [-3.1, 3.1], WY = [-0.42, 2.72];
        const sR = v.stage({ x: WX, y: WY, equal: true, axes: false, height: 270, title: 'seen from the road: an inertial frame' });
        const sC = v.stage({ x: WX, y: WY, equal: true, axes: false, height: 270, title: 'seen from the car: add $-m\\mathbf A$' });
        const sP = v.stage({ x: [0, T], y: [-50, 5], axes: 'box', height: 165, full: true, xlabel: 't (s)', title: 'angle of the string from the vertical (degrees)' });
        const PV = [0, 1.98];
        const cache = memo(); let cur = null;
        const run = () => cache(aS.value + '|' + gS.value, () => {
          const A = aS.value, gam = gS.value;
          const R = rk4rec((t, Y) => [Y[1], -(g * Math.sin(Y[0]) + A * Math.cos(Y[0])) / L - gam * Y[1]], [0, 0], T, Math.round(T / DT), EV);
          const mins = []; // minima of φ: φ' changes from − to +
          for (let i = 1; i < R.y.length; i++) { const a = R.y[i - 1][1], b = R.y[i][1]; if (a < 0 && b >= 0) mins.push(R.t[i - 1] + (R.dt * a) / (a - b)); }
          let per = NaN, mean = NaN;
          if (mins.length >= 2) {
            per = mins[mins.length - 1] - mins[mins.length - 2];
            const i0 = idxAt(R, mins[mins.length - 2]), i1 = idxAt(R, mins[mins.length - 1]); let s = 0; for (let i = i0; i < i1; i++) s += R.y[i][0]; mean = s / Math.max(1, i1 - i0);
          }
          const ge = Math.hypot(g, A), w2 = ge / L - (gam * gam) / 4;
          let lo = 0; for (const y of R.y) lo = Math.min(lo, y[0]);
          return { R, A, gam, per, mean, eq: -Math.atan2(A, g), pred: w2 > 0 ? TAU / Math.sqrt(w2) : NaN, ge, lo };
        });
        const road = (s, shift, xc) => {
          s.rect(xc - shift - 4, -0.5, xc - shift + 4, 0, { fill: 'faint', fillAlpha: 0.2, stroke: false });
          s.line(xc - shift - 4, 0, xc - shift + 4, 0, { color: 'muted', width: 1.6 });
          for (let k = Math.floor((xc - 4) / 1.6); k * 1.6 < xc + 4; k++) s.line(k * 1.6 - shift, -0.24, k * 1.6 + 0.8 - shift, -0.24, { color: 'panel', width: 3.5 });
          for (let k = Math.floor((xc - 4) / 7) - 1; k * 7 < xc + 4; k++) {
            const x = k * 7 + 3.5 - shift;
            s.line(x, 0, x, 2.4, { color: 'muted', width: 2.2 }); s.line(x, 2.4, x + 0.4, 2.5, { color: 'muted', width: 2.2 }); s.dot(x + 0.44, 2.46, { r: 3.5, color: 'gold' });
          }
        };
        const car = (s, x0, wheel) => {
          s.rect(x0 - 1.6, 0.44, x0 + 1.6, 2.16, { radius: 14, fill: 'panel', fillAlpha: 1, stroke: false });
          s.rect(x0 - 1.6, 0.44, x0 + 1.6, 2.16, { radius: 14, fill: 'accent', fillAlpha: 0.07, color: 'muted', width: 1.8 });
          s.line(x0 - 0.5, PV[1], x0 + 0.5, PV[1], { color: 'muted', width: 3 });
          for (const wx of [-1.02, 1.02]) {
            s.circle(x0 + wx, 0.3, 0.29, { fill: 'ink', fillAlpha: 0.8, color: 'ink', width: 1 });
            for (let k = 0; k < 3; k++) { const a = wheel + (k * TAU) / 3; s.line(x0 + wx, 0.3, x0 + wx + 0.23 * Math.cos(a), 0.3 + 0.23 * Math.sin(a), { color: 'panel', width: 1.8 }); }
          }
        };
        v.animate((t) => {
          const B = run(), R = B.R, A = B.A, gam = B.gam, i = idxAt(R, Math.min(t, T)), tt = R.t[i], [ph, om] = R.y[i];
          const xc = 0.5 * A * tt * tt, wheel = -xc / 0.29;
          const er = [Math.sin(ph), -Math.cos(ph)], ef = [Math.cos(ph), Math.sin(ph)];
          const Tm = L * om * om + g * Math.cos(ph) - A * Math.sin(ph);
          const Ten = [-Tm * er[0], -Tm * er[1]], Wt = [0, -g], Dr = [-gam * L * om * ef[0], -gam * L * om * ef[1]];
          const net = [Ten[0] + Wt[0] + Dr[0], Ten[1] + Wt[1] + Dr[1]], rel = [net[0] - A, net[1]];
          // measured road-frame acceleration of the bob (central differences of its recorded positions)
          const pos = (k) => { const q = R.y[k][0], tk = R.t[k]; return [PV[0] + L * Math.sin(q) + 0.5 * A * tk * tk, PV[1] - L * Math.cos(q)]; };
          let err = NaN;
          if (i > 0 && i < R.y.length - 1) { const p0 = pos(i - 1), p1 = pos(i), p2 = pos(i + 1), h2 = R.dt * R.dt; err = Math.hypot((p2[0] - 2 * p1[0] + p0[0]) / h2 - net[0], (p2[1] - 2 * p1[1] + p0[1]) / h2 - net[1]); }
          const bob = [PV[0] + L * er[0], PV[1] + L * er[1]];
          for (const [s, off] of [[sR, xc], [sC, 0]]) {
            if (s === sR) s.setView([xc + WX[0], xc + WX[1]], WY);
            road(s, s === sR ? 0 : xc, xc);
            car(s, off, wheel);
            const trail = []; for (let k = Math.max(0, i - 70); k <= i; k++) { const q = R.y[k][0], tk = R.t[k]; trail.push([PV[0] + L * Math.sin(q) + (s === sR ? 0.5 * A * tk * tk : 0), PV[1] - L * Math.cos(q)]); }
            s.path(trail, { color: 'gold', width: 2, alpha: 0.55 });
            const bx = bob[0] + off, by = bob[1];
            s.line(PV[0] + off, PV[1], bx, by, { color: 'ink', width: 1.4 });
            s.dot(PV[0] + off, PV[1], { r: 3, color: 'ink' });
            if (s === sC) { s.line(PV[0], PV[1], PV[0] + 1.15 * Math.sin(B.eq), PV[1] - 1.15 * Math.cos(B.eq), { color: 'green', width: 1.2, dash: [4, 4] }); s.line(PV[0], PV[1], PV[0], PV[1] - 1.15, { color: 'faint', width: 1, dash: [2, 4] }); }
            s.dot(bx, by, { r: 6.5, color: 'gold' });
            farrow(s, bx, by, Wt[0], Wt[1], KF, 'ink', 'm\\mathbf g', { ldx: 14 });
            farrow(s, bx, by, Ten[0], Ten[1], KF, 'blue', '\\mathbf T', { ldx: 12, ldy: 8 });
            if (s === sC) farrow(s, bx, by, -A, 0, KF, 'orange', '-m\\mathbf A', { ldy: -10 });
            const nt = s === sR ? net : rel;
            farrow(s, bx, by, nt[0], nt[1], KF, 'green', s === sR ? 'm\\ddot{\\mathbf r}' : "m\\ddot{\\mathbf r}'", { width: 3, ldy: 12 });
          }
          sR.corner(`t = ${v.fix(tt, 1)} s · car at ${v.fix(A * tt * 3.6, 0)} km/h`, 'tl');
          sC.corner(`string at ${v.fix(-ph / DEG, 1)}° behind the vertical`, 'tl');
          // angle against time
          const lo = Math.min(-5, (B.lo / DEG) * 1.12);
          sP.setView([0, T], [lo, 4]);
          sP.hline(0, { color: 'faint', width: 1 });
          sP.hline(B.eq / DEG, { color: 'green', dash: [6, 4], width: 1.6 });
          sP.text('−arctan(A/g)', T, B.eq / DEG, { color: 'green', size: 11, align: 'right', dy: 10 });
          series(sP, R.t, R.y.map((y) => y[0] / DEG), i, { color: 'blue', width: 2.2 });
          sP.dot(tt, ph / DEG, { r: 4.5, color: 'gold' });
          cur = { B, rel, err };
        }, { period: T + 1.5, still: 7 });
        v.legend([['blue', 'tension $\\mathbf T$'], ['ink', 'weight $m\\mathbf g$'], ['orange', 'inertial force $-m\\mathbf A$ (car frame only)'], ['green', 'sum = mass × acceleration in that frame'], ['gold', 'bob and its recent path']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, rel, err } = cur, d = (x) => v.fix(x / DEG, 2);
          if (B.A === 0) return String.raw`$A = 0$: the car is an inertial frame, there is no inertial force, and the string hangs straight down`;
          const settle = isFinite(B.mean) ? String.raw`centre of the swing (mean over the last swing) $${d(-B.mean)}°$ behind the vertical; predicted $\arctan(A/g) = ${d(-B.eq)}°$` : String.raw`predicted tilt $\arctan(A/g) = ${d(-B.eq)}°$`;
          const per = isFinite(B.per) ? String.raw` · period ${v.fix(B.per, 3)} s; predicted $2\pi/\sqrt{g_{\rm eff}/\ell - \gamma^2/4} = ${v.fix(B.pred, 3)}$ s with $g_{\rm eff} = \sqrt{g^2 + A^2} = ${v.fix(B.ge, 2)}$ m/s²` : '';
          const chk = isFinite(err) ? String.raw` · road frame: (forces)/$m$ minus the measured acceleration $= ${sci(v, err)}$ m/s² (finite-difference error)` : '';
          return settle + per + chk + String.raw` · car frame: bob’s acceleration ${v.fix(Math.hypot(rel[0], rel[1]), 3)} m/s²`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 9.2
    {
      num: '9.2',
      kind: 'Principle',
      name: 'Equivalence principle',
      statement: String.raw`**Weak form.** The motion of a freely falling test body depends only on where it starts and how fast it moves, not on its mass or composition: gravitational mass is proportional to inertial mass. **Einstein’s form.** In a laboratory small enough, and over a time short enough, that the variation of gravity across it can be ignored, no experiment can tell
- a laboratory at rest in a uniform gravitational field $\mathbf g$ from one accelerating at $-\mathbf g$ in empty space, or
- a laboratory falling freely in a gravitational field from one floating in empty space.

Gravity can thus be removed locally by going to a freely falling frame (9.1), but not globally. In a laboratory of size $H$ near a body of radius $R$ the residual differences are **tidal**, of relative size $H/R$, and they grow with the size of the laboratory. The weak principle is tested by the Eötvös ratio $\eta = 2|a_1 - a_2|/(a_1 + a_2)$ for bodies of different composition. Eötvös and colleagues (1922) found it to be below a few parts in $10^9$, and the MICROSCOPE satellite (2022) below about $10^{-15}$.`,
      idea: String.raw`In Newton’s law of gravitation (1.17) the mass in $\mathbf F = -GMm\,\hat{\mathbf r}/r^2$ cancels the mass in $\mathbf F = m\ddot{\mathbf r}$, so every body has the same acceleration at the same place. That is exactly what an inertial force does: $-m\mathbf A$ is proportional to the mass. A uniform $\mathbf g$ and a uniform frame acceleration are therefore locally interchangeable. A real field is never uniform, however. Two balls a distance $H$ apart in a field that converges on a centre at distance $R$ experience slightly different pulls, and no single frame acceleration removes both. Einstein (1907) made the local equivalence a postulate, and it became the starting point of general relativity.`,
      caption: String.raw`Two cabins with the same balls released at the same moment. The hollow rings in each cabin show where the matching balls are in the other cabin. **Held up:** a cabin standing on a planet versus a rocket accelerating at $g$. **In free fall:** a cabin dropped toward the planet versus one floating in empty space. With a small cabin the two are indistinguishable. Make the cabin a sizeable fraction of the planet: on the ground the falling balls converge toward the planet’s centre (the arrows beside the cabin tilt inward), and in free fall the tidal field (orange arrows) stretches the vertical pair apart and squeezes the horizontal pair together. Give the gold ball an Eötvös parameter $\eta \neq 0$ to break the weak principle itself: it then falls differently in the field, but not in the rocket.`,
      deps: ['mech-9.1', 'mech-1.17'],
      see: ['rel-6.3', 'rel-6.2', 'rel-6.4', 'rel-6.5'],
      refs: ['Taylor §9.1'],
      tags: ['equivalence principle', 'gravity', 'free fall'],
      credit: 'Galileo; Newton, 1687; Eötvös, 1890–1922; Einstein, 1907',
      scope: String.raw`Holds locally: in a region small compared with the distance over which the gravitational field changes, and for test bodies whose own gravity, spin and charge can be neglected.`,
      viz(v) {
        const mode = v.select('cabin', [{ value: 'stand', label: 'held up' }, { value: 'free', label: 'in free fall' }], 'stand');
        const eS = v.slider('cabin height $H/R$', 0.001, 0.25, 0.002, { log: true });
        const nS = v.slider('Eötvös parameter $\\eta$ of the gold ball', 0, 0.08, 0, { step: 0.001 });
        const VX = [-0.8, 0.8], VY = [-0.17, 1.13];
        const sG = v.stage({ x: VX, y: VY, equal: true, axes: false, height: 300, title: ' ' });
        const sA = v.stage({ x: VX, y: VY, equal: true, axes: false, height: 300, title: ' ' });
        const BALLS = {
          stand: [[-0.42, 0.92, 0, 0], [-0.14, 0.92, 0, 0], [0.14, 0.92, 0, 0], [0.42, 0.92, 0, 0], [-0.5, 0.45, 0.72, 0.62]],
          free: [[-0.4, 0.5, 0, 0], [0.4, 0.5, 0, 0], [0, 0.86, 0, 0], [0, 0.14, 0, 0], [-0.42, 0.16, 0.2, 0.1]],
        };
        const COL = ['blue', 'teal', 'purple', 'gold', 'pink'], PT = 3, RB = 0.035, HW = 0.62;
        const cache = memo(); let cur = null;
        const run = () => cache([mode.value, eS.value, nS.value].join('|'), () => {
          const m = mode.value, eps = eS.value, eta = nS.value, Rp = 1 / eps, GM = Rp * Rp, list = BALLS[m];
          const T = m === 'stand' ? 1.6 : 2.3, h = 0.002, every = 5, n = Math.round(T / h);
          const Yf0 = m === 'stand' ? Rp : Rp + 3; // the floor’s distance from the planet’s centre at t = 0
          const F = (k) => (tt, S) => { const r2 = S[0] * S[0] + S[1] * S[1], f = (-k * GM) / (r2 * Math.sqrt(r2)); return [S[2], S[3], f * S[0], f * S[1]]; };
          const fC = F(1), fB = list.map((_, i) => F(i === PT ? 1 + eta : 1)), done = list.map(() => false), tLand = list.map(() => NaN);
          let st = list.map(([x, y, vx, vy]) => [x, Yf0 + y, vx, vy]), cab = [0, Yf0 + 0.5, 0, 0];
          const ts = [0], G = list.map(([x, y]) => [[x, y]]), Ac = list.map(([x, y]) => [[x, y]]);
          const rel = (S) => (m === 'stand' ? [S[0], S[1] - Rp] : [S[0], S[1] - (cab[1] - 0.5)]);
          for (let k = 1; k <= n; k++) {
            if (m === 'free') cab = rk4(fC, 0, cab, h);
            for (let i = 0; i < list.length; i++) if (!done[i]) {
              const prev = st[i]; st[i] = rk4(fB[i], 0, st[i], h);
              if (m === 'stand' && st[i][1] - Rp <= RB) { const u = (prev[1] - Rp - RB) / (prev[1] - st[i][1]); tLand[i] = (k - 1 + u) * h; st[i] = [prev[0] + u * (st[i][0] - prev[0]), Rp + RB, 0, 0]; done[i] = true; }
            }
            if (k % every === 0) {
              const tt = k * h; ts.push(tt);
              for (let i = 0; i < list.length; i++) {
                G[i].push(rel(st[i]));
                const [x0, y0, vx, vy] = list[i]; let ta = tt, ya = y0 + vy * tt - (m === 'stand' ? 0.5 * tt * tt : 0);
                if (m === 'stand' && ya < RB) { ta = vy + Math.sqrt(vy * vy + 2 * (y0 - RB)); ya = RB; }
                Ac[i].push([x0 + vx * ta, ya]);
              }
            }
          }
          let gap = 0; const gapAt = ts.map((_, k) => { let g = 0; for (let i = 0; i < list.length; i++) g = Math.max(g, Math.hypot(G[i][k][0] - Ac[i][k][0], G[i][k][1] - Ac[i][k][1])); gap = Math.max(gap, g); return g; });
          // the same run without the gold ball’s η, to separate tidal from composition effects
          const Yc0 = Yf0 + 0.5, k2 = GM / Yc0 ** 3, last = ts.length - 1;
          const free = m === 'free' ? {
            vert: Math.hypot(G[2][last][0] - G[3][last][0], G[2][last][1] - G[3][last][1]) / 0.72, vPred: Math.cosh(Math.sqrt(2 * k2) * T),
            horz: Math.hypot(G[0][last][0] - G[1][last][0], G[0][last][1] - G[1][last][1]) / 0.8, hPred: Math.cos(Math.sqrt(k2) * T),
          } : null;
          const tA = list.map(([, y0, , vy]) => vy + Math.sqrt(vy * vy + 2 * (y0 - RB)));
          return { m, eps, eta, Rp, GM, ts, G, Ac, gap, gapAt, free, tLand, tA, Yc0, T };
        });
        const cabin = (s) => s.rect(-HW, 0, HW, 1.02, { radius: 9, color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.04 });
        const STARS = [[-0.72, 1.05], [0.7, 0.95], [-0.7, 0.25], [0.74, 0.12], [0.68, 0.55], [-0.75, 0.62], [0.05, -0.1], [-0.4, -0.12], [0.45, -0.08]];
        v.animate((t) => {
          const B = run(), m = B.m, k = Math.min(B.ts.length - 1, Math.round(Math.min(t, B.T) / 0.01));
          sG.setTitle(m === 'stand' ? 'standing on a planet of radius $R$' : 'falling freely toward the planet');
          sA.setTitle(m === 'stand' ? 'a rocket in empty space, accelerating at $g$' : 'floating in empty space');
          // left cabin: surroundings
          if (m === 'stand') {
            const surf = []; for (let j = 0; j <= 80; j++) { const x = VX[0] - 0.1 + (j / 80) * (VX[1] - VX[0] + 0.2); surf.push([x, -(x * x) / (B.Rp + Math.sqrt(Math.max(B.Rp * B.Rp - x * x, 0)))]); }
            sG.poly([...surf, [VX[1] + 0.1, -0.6], [VX[0] - 0.1, -0.6]], { fill: 'green', fillAlpha: 0.14, color: 'green', width: 1.5 });
            for (const sx of [-1, 1]) for (const y of [0.18, 0.52, 0.86]) {
              const x = sx * 0.71, Y = B.Rp + y, r = Math.hypot(x, Y), gx = (-B.GM * x) / r ** 3, gy = (-B.GM * Y) / r ** 3, gm = Math.hypot(gx, gy);
              sG.arrow(x, y + 0.06, x + (0.13 * gx) / gm, y + 0.06 + (0.13 * gy) / gm, { color: 'muted', width: 1.4, head: 6 });
              sA.arrow(x, y + 0.06, x, y - 0.07, { color: 'muted', width: 1.4, head: 6 });
            }
            sA.poly([[-0.22, 0], [0.22, 0], [0.12, -0.05], [-0.12, -0.05]], { fill: 'muted', fillAlpha: 0.5, color: 'muted', width: 1 });
            const fl = 0.09 + 0.02 * Math.sin(t * 31);
            sA.poly([[-0.1, -0.05], [0.1, -0.05], [0, -0.05 - fl]], { fill: 'orange', fillAlpha: 0.7, color: 'orange', width: 1 });
          } else {
            for (const p of STARS) { sA.dot(p[0], p[1], { r: 1.6, color: 'muted', ring: false }); sG.dot(p[0], p[1], { r: 1.6, color: 'muted', ring: false }); }
            sG.text('planet ↓', 0, -0.1, { color: 'green', size: 11, align: 'center' });
          }
          cabin(sG); cabin(sA);
          if (m === 'free') { // tidal field inside the falling cabin: g(r) − g(centre)
            const pts = []; let big = 0;
            const Yc = B.Yc0 - 0.5 * (B.GM / B.Yc0 ** 2) * B.ts[k] ** 2; // approximate position, only for the arrow pattern
            for (const x of [-0.45, -0.15, 0.15, 0.45]) for (const y of [0.16, 0.38, 0.62, 0.84]) {
              const g = (X, Y) => { const r = Math.hypot(X, Y); return [(-B.GM * X) / r ** 3, (-B.GM * Y) / r ** 3]; };
              const a = g(x, Yc + y - 0.5), c = g(0, Yc), d = [a[0] - c[0], a[1] - c[1]]; pts.push([x, y, d]); big = Math.max(big, Math.hypot(d[0], d[1]));
            }
            for (const [x, y, d] of pts) sG.arrow(x, y, x + (0.1 * d[0]) / big, y + (0.1 * d[1]) / big, { color: 'orange', width: 1.5, head: 6, alpha: 0.75 });
            sG.corner(`tidal arrows ×${v.fmt(0.1 / big, 2)}`, 'br', { color: 'orange', size: 11 });
          }
          // balls, trails and the other cabin’s balls as rings
          const ball = (s, P, Q, i) => {
            const pts = P[i].slice(0, k + 1); s.path(pts, { color: COL[i], width: 1.2, alpha: 0.5 });
            const p = P[i][k], q = Q[i][k];
            s.circle(q[0], q[1], RB * 1.25, { color: 'ink', width: 1.1, alpha: 0.7 });
            s.circle(p[0], p[1], RB, { fill: COL[i], fillAlpha: 0.95, color: COL[i], width: 1 });
          };
          for (let i = 0; i < 5; i++) { ball(sG, B.G, B.Ac, i); ball(sA, B.Ac, B.G, i); }
          if (B.eta > 0) { const p = B.G[PT][k]; sG.text('η', p[0] + 0.06, p[1] + 0.05, { color: 'gold', size: 13, math: true }); }
          const g = B.gapAt[k], same = g < 0.004;
          sG.corner(same ? 'same as the other cabin' : `off by ${v.fix(g, 3)} H`, 'tl', { color: same ? 'green' : 'red', weight: 600 });
          sA.corner(`t = ${v.fix(B.ts[k], 2)} √(H/g)`, 'tl');
          cur = { B, k };
        }, { period: 3.4, still: 3.2 });
        v.legend([['ink', 'where the matching ball is in the other cabin', { dot: true }], ['gold', 'gold ball (Eötvös parameter $\\eta$)', { dot: true }], ['muted', 'gravity (left) / apparent gravity (right)'], ['orange', 'tidal field in the falling cabin']]);
        v.readout(() => {
          if (!cur) return '';
          const { B } = cur, Hkm = B.eps * 6371;
          let out = String.raw`$H/R = ${num(v, B.eps, 4)}$ (on Earth: a cabin ${v.fmt(Hkm, 3)} km tall) · largest gap between matching balls ${num(v, B.gap, 5)} $H$ $= ${v.fix(B.gap / B.eps, 3)}\,(H/R)\,H$`;
          if (B.m === 'stand') out += String.raw` — proportional to $H/R$, so it vanishes for a small cabin: the difference is tidal`;
          else out += String.raw` · vertical pair stretched by ${v.fix(B.free.vert, 4)} (linear tidal theory $\cosh(\sqrt{2GM/r^3}\,t) = ${v.fix(B.free.vPred, 4)}$), horizontal pair squeezed to ${v.fix(B.free.horz, 4)} ($\cos(\sqrt{GM/r^3}\,t) = ${v.fix(B.free.hPred, 4)}$)`;
          if (B.eta > 0) {
            out += B.m === 'stand'
              ? String.raw` · the gold ball lands after ${v.fix(B.tLand[PT], 4)} instead of ${v.fix(B.tLand[2], 4)}: in the field its composition shows, while in the rocket it lands at ${v.fix(B.tA[PT], 4)} like the rest`
              : String.raw` · in the falling cabin the gold ball drifts away from the others by about $\tfrac12\eta g t^2$; floating in space it stays put`;
            out += String.raw` · real limits: $\eta < 10^{-8}$ (Eötvös, 1922), $\eta \lesssim 10^{-15}$ (MICROSCOPE, 2022)`;
          }
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 9.3
    {
      num: '9.3',
      kind: 'Phenomenon',
      name: 'Tides',
      statement: String.raw`The Earth falls freely toward the Moon (and the Sun), so in the Earth’s non-rotating centre-of-mass frame each body’s pull is felt only through its **tidal acceleration**: the pull at a point $\mathbf r$ minus the pull at the centre (9.1),
$$\mathbf a_{\rm t}(\mathbf r) = -\frac{GM(\mathbf r - \mathbf d)}{|\mathbf r - \mathbf d|^3} - \frac{GM\,\mathbf d}{d^3} \approx \frac{GM}{d^3}\bigl(3(\mathbf r\cdot\hat{\mathbf d})\hat{\mathbf d} - \mathbf r\bigr)\qquad (r \ll d),$$
where $\mathbf d$ is the body’s position. It stretches the Earth along the line to the body, with outward pulls of about $2GMR/d^3$ on the near and far sides, and squeezes it by half as much around the rim. An ocean in equilibrium with it bulges on both sides, with a crest-to-trough range $\tfrac32(M/M_\oplus)(R/d)^3R$, which is about $0.54$ m for the Moon and $0.25$ m for the Sun. A rotating Earth therefore has two high tides a day. The solar and lunar tides add at new and full moon (**spring tides**) and partly cancel at the quarter moons (**neap tides**), giving a spring-to-neap range ratio of about $(0.54 + 0.25)/(0.54 - 0.25) \approx 2.7$.`,
      idea: String.raw`The uniform part of the Moon’s field accelerates the whole Earth equally, and in the freely falling frame it is cancelled by the inertial force $-M_\oplus\mathbf A$; this is the equivalence principle (9.2). What is left is the difference between the pull here and the pull at the centre. Expanding $1/|\mathbf r - \mathbf d|^2$ to first order in $r/d$ gives the quadrupole field, which falls off as $1/d^3$ rather than $1/d^2$. This is why the Sun, whose pull on the Earth is 180 times the Moon’s, raises a tide only $0.46$ times as large. The equilibrium ocean surface is an equipotential of gravity plus the tidal potential (3.4); the real oceans respond dynamically, with resonances and amphidromic points, but the forcing is this.`,
      caption: String.raw`Drag the Moon (blue) and the Sun (gold) around the Earth. The selector chooses what the arrows show: the bodies’ full pull, its value at the Earth’s centre (the same everywhere), or their difference, the tidal field, which points outward toward and away from the Moon and inward around the rim. The blue ocean is the equilibrium tide, hugely exaggerated. Right: its height in metres around the equator. Bottom: the range (high minus low) against the Moon–Sun angle, which is largest at new and full moon and smallest at the quarters. Bring the Moon much closer to see the near-side bulge outgrow the far-side bulge as the quadrupole approximation fails.`,
      deps: ['mech-9.1', 'mech-1.17'],
      see: ['astro-3.1', 'geo-6.6', 'rel-6.5', 'astro-3.5'],
      refs: ['Taylor §9.2'],
      tags: ['tides', 'gravity', 'Moon'],
      credit: 'Newton, 1687',
      scope: String.raw`Equilibrium tide: a static ocean covering the whole Earth, which responds instantly. Real tides are set by the ocean’s dynamic response to this forcing (basin resonances, amphidromic systems), and differ in size and timing from place to place.`,
      viz(v) {
        const show = v.select('arrows show', [{ value: 'pull', label: 'pull' }, { value: 'centre', label: 'pull at the centre' }, { value: 'tidal', label: 'tidal = difference' }], 'tidal');
        const sunT = v.toggle('include the Sun', true);
        const dS = v.slider('Moon’s distance $d$ (Earth radii)', 3, 60.3, 60.3, { log: true });
        const S = v.stage({ x: [-2.45, 2.45], y: [-2.45, 2.45], equal: true, axes: false, height: 340, weight: 1.05 });
        const P = v.stage({ x: [0, 360], y: [-0.4, 0.4], axes: 'box', height: 340, xlabel: 'longitude around the equator (°)', title: 'equilibrium tide height (m)', xticks: [0, 90, 180, 270, 360] });
        const N = v.stage({ x: [0, 360], y: [0, 1], axes: 'box', height: 165, full: true, xlabel: 'Moon–Sun angle ψ (°)', title: 'tidal range (high − low, m) against the angle between the Moon and the Sun', xticks: [0, 90, 180, 270, 360] });
        const MU_M = 0.0123000371, MU_S = 332946.0487, D_S = 23481, RE = 6.371e6, gE = 9.82, RM = 1.85, RS = 2.22;
        const onCircle = (rr) => (x, y) => { const r = Math.hypot(x, y) || 1; return [(rr * x) / r, (rr * y) / r]; };
        const Mh = S.handle(RM * Math.cos(0.45), RM * Math.sin(0.45), { color: 'blue', r: 8, constrain: onCircle(RM) });
        const Sh = S.handle(RS * Math.cos(-0.75), RS * Math.sin(-0.75), { color: 'gold', r: 9, constrain: onCircle(RS) });
        // units: GM⊕ = R⊕ = 1, so surface gravity g = 1
        const bodies = () => { const a = Math.atan2(Mh.y, Mh.x), L = [{ mu: MU_M, d: dS.value, a, c: 'blue' }]; if (sunT.value) L.push({ mu: MU_S, d: D_S, a: Math.atan2(Sh.y, Sh.x), c: 'gold' }); return L; };
        const pull = (x, y, b) => { const dx = b.d * Math.cos(b.a) - x, dy = b.d * Math.sin(b.a) - y, r2 = dx * dx + dy * dy, k = b.mu / (r2 * Math.sqrt(r2)); return [k * dx, k * dy]; };
        const phiT = (th, b) => { const x = Math.cos(th), y = Math.sin(th), r = Math.hypot(b.d * Math.cos(b.a) - x, b.d * Math.sin(b.a) - y); return -b.mu / r + (b.mu * (x * Math.cos(b.a) + y * Math.sin(b.a))) / (b.d * b.d); };
        /** Equilibrium tide h(θ) (Earth radii) of one body on n points round the equator, mean removed. */
        const tide = (b, n = 360) => { const ph = []; let m = 0; for (let j = 0; j < n; j++) { const p = phiT((TAU * j) / n, b); ph.push(p); m += p; } m /= n; return ph.map((p) => -(p - m)); };
        const rangeTab = memo();
        const ranges = (d) => rangeTab(d, () => {
          const n = 180, hm = tide({ mu: MU_M, d, a: 0 }, n), out = [];
          for (let k = 0; k <= 120; k++) {
            const psi = (TAU * k) / 120, hs = tide({ mu: MU_S, d: D_S, a: -psi }, n);
            let lo = Infinity, hi = -Infinity; for (let j = 0; j < n; j++) { const h = hm[j] + hs[j]; lo = Math.min(lo, h); hi = Math.max(hi, h); }
            out.push([(psi * 180) / Math.PI, (hi - lo) * RE]);
          }
          return out;
        });
        let cur = null;
        v.render(() => {
          const L = bodies(), mode = show.value, hs = L.map((b) => tide(b)), tot = hs[0].map((h, j) => h + (hs[1] ? hs[1][j] : 0));
          // ocean, exaggerated
          let big = 0; for (const h of tot) big = Math.max(big, Math.abs(h));
          const K = 0.17 / big, ocean = tot.map((h, j) => { const th = (TAU * j) / 360, r = 1 + K * h; return [r * Math.cos(th), r * Math.sin(th)]; });
          S.poly(ocean, { fill: 'blue', fillAlpha: 0.28, color: 'blue', width: 2 });
          S.circle(0, 0, 0.9, { fill: 'green', fillAlpha: 0.25, color: 'green', width: 1.2 });
          S.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          for (const b of L) { const h = b.c === 'blue' ? Mh : Sh; S.line(0, 0, h.x, h.y, { color: b.c, width: 1, dash: [3, 5], alpha: 0.6 }); }
          // arrows
          const F = (x, y) => { let fx = 0, fy = 0; for (const b of L) { const p = mode === 'centre' ? pull(0, 0, b) : pull(x, y, b), c = mode === 'tidal' ? pull(0, 0, b) : [0, 0]; fx += p[0] - c[0]; fy += p[1] - c[1]; } return [fx, fy]; };
          const pts = []; let fmax = 0;
          for (const [rr, nn, off] of [[1.3, 16, 0], [1.62, 16, 0.5]]) for (let j = 0; j < nn; j++) { const th = (TAU * (j + off)) / nn, x = rr * Math.cos(th), y = rr * Math.sin(th), f = F(x, y); pts.push([x, y, f]); fmax = Math.max(fmax, Math.hypot(f[0], f[1])); }
          let pmax = 0; for (const [x, y] of pts) { let fx = 0, fy = 0; for (const b of L) { const p = pull(x, y, b); fx += p[0]; fy += p[1]; } pmax = Math.max(pmax, Math.hypot(fx, fy)); }
          const col = mode === 'tidal' ? 'purple' : mode === 'centre' ? 'orange' : 'muted';
          for (const [x, y, f] of pts) { const m = Math.hypot(f[0], f[1]); if (m > 1e-30) { const len = (0.3 * m) / fmax; S.arrow(x, y, x + (len * f[0]) / m, y + (len * f[1]) / m, { color: col, width: 1.8, head: 7 }); } }
          S.corner(mode === 'tidal' ? `tidal arrows drawn ×${v.fmt(pmax / fmax, 3)} longer than the pull` : mode === 'pull' ? 'pull of ' + (L.length > 1 ? 'Moon + Sun' : 'the Moon') : 'uniform: accelerates the whole Earth', 'tl', { size: 11.5 });
          S.corner(`ocean heights ×${v.fmt(K / 1e6, 2)} million`, 'bl', { size: 11, color: 'blue' });
          S.text('Moon', Mh.x, Mh.y, { color: 'blue', size: 11.5, align: 'center', dy: Mh.y > 0 ? -17 : 17 });
          if (sunT.value) S.text('Sun', Sh.x, Sh.y, { color: 'gold', size: 11.5, align: 'center', dy: Sh.y > 0 ? -17 : 17 });
          // profile in metres
          const toM = (arr) => arr.map((h, j) => [j, h * RE]);
          let pm = 0; for (const h of tot) pm = Math.max(pm, Math.abs(h * RE)); for (const a of hs) for (const h of a) pm = Math.max(pm, Math.abs(h * RE));
          P.setView([0, 360], [-1.25 * pm, 1.25 * pm]);
          P.hline(0, { color: 'faint', width: 1 });
          const deg = (a) => ((((a * 180) / Math.PI) % 360) + 360) % 360;
          for (const b of L) P.vline(deg(b.a), { color: b.c, width: 1, dash: [3, 4] });
          P.path(toM(hs[0]), { color: 'blue', width: 1.6, dash: [5, 4] });
          if (hs[1]) P.path(toM(hs[1]), { color: 'gold', width: 1.6, dash: [5, 4] });
          P.path(toM(tot), { color: 'ink', width: 2.6 });
          // spring–neap curve
          const RG = ranges(dS.value), rmax = Math.max(...RG.map((q) => q[1]));
          N.setView([0, 360], [0, 1.18 * rmax]);
          const psi = deg(L[0].a - (L[1] ? L[1].a : L[0].a));
          N.path(RG, { color: 'ink', width: 2.2 });
          for (const [x, lab] of [[0, 'spring'], [90, 'neap'], [180, 'spring'], [270, 'neap'], [360, 'spring']]) N.text(lab, x, 1.1 * rmax, { color: 'muted', size: 10.5, align: x === 0 ? 'left' : x === 360 ? 'right' : 'center' });
          let lo = Infinity, hi = -Infinity; for (const h of tot) { lo = Math.min(lo, h); hi = Math.max(hi, h); }
          const range = (hi - lo) * RE;
          if (L[1]) N.dot(psi, range, { r: 5, color: 'gold' }); else N.text('turn the Sun on to see the cycle', 180, 0.5 * rmax, { color: 'muted', size: 11, align: 'center' });
          cur = { L, hs, range, RG };
        });
        v.legend([['blue', 'Moon’s tide', { dash: true }], ['gold', 'Sun’s tide', { dash: true }], ['ink', 'total tide / range'], ['purple', 'tidal field']]);
        v.readout(() => {
          if (!cur) return '';
          const { L, hs, range, RG } = cur, d = L[0].d, mu = MU_M;
          const near = mu / (d - 1) ** 2 - mu / d ** 2, far = mu / d ** 2 - mu / (d + 1) ** 2, quad = (2 * mu) / d ** 3;
          const rr = (a) => (Math.max(...a) - Math.min(...a)) * RE;
          let out = String.raw`Moon’s tidal pull (m/s²): near side $${sci(v, near * gE, 3)}$, far side $${sci(v, far * gE, 3)}$, quadrupole $2GMR/d^3 = ${sci(v, quad * gE, 3)}$ (near/far $= ${v.fix(near / far, 3)}$) · Moon’s range ${v.fix(rr(hs[0]), 3)} m`;
          if (L[1]) {
            const sr = rr(hs[1]), mr = rr(hs[0]), smax = Math.max(...RG.map((q) => q[1])), smin = Math.min(...RG.map((q) => q[1]));
            out += String.raw`, Sun’s ${v.fix(sr, 3)} m (ratio ${v.fix(sr / mr, 3)}) · now ${v.fix(range, 3)} m; spring ${v.fix(smax, 3)} m, neap ${v.fix(smin, 3)} m, ratio ${v.fix(smax / smin, 2)}`;
          }
          if (d < 10) out += String.raw` · at $d = ${v.fix(d, 1)}R_\oplus$ the two bulges differ visibly: the $1/d^3$ formula is only the first term`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 9.4
    {
      num: '9.4',
      kind: 'Definition',
      name: 'Angular velocity vector',
      statement: String.raw`A rigid body turning about a fixed point $O$ has, at each instant, an **angular velocity vector** $\boldsymbol\omega$: the velocity of every point of the body is
$$\mathbf v = \boldsymbol\omega\times\mathbf r ,$$
where $\mathbf r$ is the point’s position relative to $O$. The direction of $\boldsymbol\omega$ is the instantaneous axis, the line of points momentarily at rest, oriented by the right-hand rule, and its length is the rate of turning in rad/s. If the orientation is the rotation matrix $\mathsf R(t)$, then $\dot{\mathsf R}\mathsf R^{\mathsf T}$ is antisymmetric and $\boldsymbol\omega$ is the vector it represents. Angular velocities **add as vectors**: a body turning at $\boldsymbol\omega_2$ relative to a frame that itself turns at $\boldsymbol\omega_1$ has angular velocity $\boldsymbol\omega_1 + \boldsymbol\omega_2$. Finite rotations do not add this way: they do not even commute, and $\mathsf R(\boldsymbol\omega_2\Delta t)\mathsf R(\boldsymbol\omega_1\Delta t)$ agrees with $\mathsf R((\boldsymbol\omega_1 + \boldsymbol\omega_2)\Delta t)$ only up to terms of order $\Delta t^2$.`,
      idea: String.raw`Differentiating $\mathsf R\mathsf R^{\mathsf T} = \mathsf I$ shows that $\dot{\mathsf R}\mathsf R^{\mathsf T}$ is antisymmetric, and a $3\times3$ antisymmetric matrix acts on vectors as $\boldsymbol\omega\times$; this extends uniform circular motion (1.3), where $v = \omega r$. For small angles $\mathsf R(\boldsymbol\theta) = \mathsf I + [\boldsymbol\theta]_\times + O(\theta^2)$, so composing two small rotations adds their generators to first order: $\mathsf R(\boldsymbol\omega_2\Delta t)\mathsf R(\boldsymbol\omega_1\Delta t) = \mathsf I + [(\boldsymbol\omega_1+\boldsymbol\omega_2)\Delta t]_\times + O(\Delta t^2)$. The error is half the commutator, of size $\Delta t^2|\boldsymbol\omega_1\times\boldsymbol\omega_2|/\sqrt2$ in the Frobenius norm, so it disappears from the rate as $\Delta t\to0$. That is why rates of rotation form a vector even though rotations do not.`,
      caption: String.raw`Drag the tips of $\boldsymbol\omega_1$ (blue) and $\boldsymbol\omega_2$ (orange); drag the background to rotate the view. The box is turned by alternating small rotations: $\boldsymbol\omega_1\Delta t$, then $\boldsymbol\omega_2\Delta t$, over and over. The green arrows on its corners are $\boldsymbol\omega\times\mathbf r$ with $\boldsymbol\omega = \boldsymbol\omega_1+\boldsymbol\omega_2$, and the dashed green line is the instantaneous axis. The gold corner leaves a trail. For small steps it follows the faint circle about $\boldsymbol\omega$, which is the exact rotation; make the step large and the trail tilts off it. Right: for a single step, how far $\mathsf R_2\mathsf R_1$ is from $\mathsf R((\boldsymbol\omega_1+\boldsymbol\omega_2)\Delta t)$ (green) and from $\mathsf R_1\mathsf R_2$ (red): both shrink like $\Delta t^2$, faster than the step itself (grey).`,
      deps: ['mech-1.3'],
      see: ['mech-10.1', 'mech-10.20'],
      refs: ['Taylor §9.3', 'Goldstein §4.8'],
      tags: ['angular velocity', 'rotation', 'rigid body'],
      viz(v) {
        const dtS = v.slider('step $\\Delta t$ of each small turn (s)', 0.002, 0.5, 0.01, { log: true });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 350, title: 'turn by $\\boldsymbol\\omega_1\\Delta t$, then $\\boldsymbol\\omega_2\\Delta t$, repeatedly (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.3, axis: 1.45, lim: 1.5, hint: false });
        const Gs = v.stage({ x: [1e-3, 1], y: [1e-8, 3], xlog: true, ylog: true, axes: 'box', height: 350, xlabel: 'Δt (s)', title: 'one step: distance between rotation matrices' });
        const w1 = sc.handle([0, 0, 1.15], { color: 'accent', label: '$\\omega_1$' });
        const w2 = sc.handle([0.85, 0.25, 0.1], { color: 'orange', label: '$\\omega_2$' });
        const HB = [0.72, 0.46, 0.28], corners = [];
        for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) corners.push([a * HB[0], b * HB[1], c * HB[2]]);
        const FACES = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]], MARK = 7;
        let cur = null;
        v.animate((t) => {
          const W1 = w1.p, W2 = w2.p, W = add3(W1, W2), wn = Math.hypot(...W), dt = dtS.value;
          const R1 = rodrigues(scale3(W1, dt)), R2 = rodrigues(scale3(W2, dt)), step = mat3(R2, R1);
          const n = Math.floor(t / dt), every = Math.max(1, Math.ceil(n / 300));
          let Q = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; const trail = [corners[MARK]];
          for (let k = 1; k <= n; k++) { Q = mat3(step, Q); if (k % every === 0 || k === n) trail.push(vec3(Q, corners[MARK])); }
          const Qex = rodrigues(scale3(W, t));
          sc.begin();
          // exact circle of the marked corner about ω
          if (wn > 1e-6) { const circ = []; for (let j = 0; j <= 72; j++) circ.push(vec3(rodrigues(scale3(W, (TAU * j) / 72 / wn)), corners[MARK])); sc.path(circ, { color: 'green', width: 1, alpha: 0.45 }); }
          if (wn > 1e-6) sc.line(scale3(W, -1.75 / wn), scale3(W, 1.75 / wn), { color: 'green', width: 1.3, dash: [6, 5], alpha: 0.8 });
          const C = corners.map((p) => vec3(Q, p));
          for (const f of FACES) sc.poly(f.map((j) => C[j]), { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.2, alpha: 0.7 });
          sc.path(trail, { color: 'gold', width: 1.8 });
          for (const p of C) sc.arrow(p, add3(p, scale3(cross3(W, p), 0.28)), { color: 'green', width: 1.7, head: 7 });
          sc.arrow([0, 0, 0], W1, { color: 'accent', width: 2.6 }); sc.arrow([0, 0, 0], W2, { color: 'orange', width: 2.6 });
          sc.line(W1, W, { color: 'orange', width: 1, dash: [3, 4] }); sc.line(W2, W, { color: 'accent', width: 1, dash: [3, 4] });
          sc.arrow([0, 0, 0], W, { color: 'green', width: 3.2 });
          sc.tex('\\boldsymbol\\omega', W, { color: 'green', dx: 12, dy: -8 });
          sc.dot(C[MARK], { r: 5.5, color: 'gold' });
          sc.flush();
          // one-step errors against Δt
          const xs = [], e0 = [], e1 = [], e2 = [];
          for (let j = 0; j <= 60; j++) {
            const d = 10 ** (-3 + (3 * j) / 60), A1 = rodrigues(scale3(W1, d)), A2 = rodrigues(scale3(W2, d)), P21 = mat3(A2, A1), P12 = mat3(A1, A2);
            xs.push(d); e0.push(fro(P21, [[1, 0, 0], [0, 1, 0], [0, 0, 1]])); e1.push(fro(P21, rodrigues(scale3(W, d)))); e2.push(fro(P21, P12));
          }
          const cr = Math.hypot(...cross3(W1, W2)), pts = (ys) => xs.map((x, j) => [x, ys[j] > 1e-15 ? ys[j] : NaN]);
          const lo = Math.min(...e1.filter((e) => e > 1e-15), ...e2.filter((e) => e > 1e-15), 1e-6);
          Gs.setView([1e-3, 1], [Math.max(1e-14, lo / 3), 3]);
          Gs.path(pts(e0), { color: 'muted', width: 2 });
          Gs.path(pts(e2), { color: 'red', width: 2.2 });
          Gs.path(pts(e1), { color: 'green', width: 2.6 });
          if (cr > 1e-9) Gs.path(xs.map((x) => [x, (x * x * cr) / Math.SQRT2]), { color: 'ink', width: 1.2, dash: [5, 4] });
          Gs.vline(dt, { color: 'gold', width: 1.5 });
          const e1n = fro(step, rodrigues(scale3(W, dt))), e2n = fro(step, mat3(R1, R2)), e0n = fro(step, [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
          if (e1n > 1e-15) Gs.dot(dt, e1n, { r: 4.5, color: 'green' });
          if (e2n > 1e-15) Gs.dot(dt, e2n, { r: 4.5, color: 'red' });
          Gs.dot(dt, e0n, { r: 4.5, color: 'muted' });
          // velocity check on the exact motion: finite difference of a corner vs ω × r
          const p0 = vec3(rodrigues(scale3(W, t - 1e-5)), corners[MARK]), p1 = vec3(rodrigues(scale3(W, t + 1e-5)), corners[MARK]), pe = vec3(Qex, corners[MARK]);
          const vfd = scale3(add3(p1, scale3(p0, -1)), 1 / 2e-5), vth = cross3(W, pe);
          cur = { dt, wn, cr, e0n, e1n, e2n, off: Math.hypot(...add3(C[MARK], scale3(pe, -1))), vErr: Math.hypot(...add3(vfd, scale3(vth, -1))), t };
        }, { period: 14, still: 6 });
        v.legend([['accent', '$\\boldsymbol\\omega_1$'], ['orange', '$\\boldsymbol\\omega_2$'], ['green', '$\\boldsymbol\\omega = \\boldsymbol\\omega_1+\\boldsymbol\\omega_2$, $\\boldsymbol\\omega\\times\\mathbf r$ / $\\|\\mathsf R_2\\mathsf R_1 - \\mathsf R(\\boldsymbol\\omega\\Delta t)\\|$'], ['red', '$\\|\\mathsf R_2\\mathsf R_1 - \\mathsf R_1\\mathsf R_2\\|$'], ['muted', '$\\|\\mathsf R_2\\mathsf R_1 - \\mathsf I\\|$ (size of a step)'], ['ink', '$\\Delta t^2|\\boldsymbol\\omega_1\\times\\boldsymbol\\omega_2|/\\sqrt2$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { dt, wn, cr, e0n, e1n, e2n, off, vErr, t } = cur;
          return String.raw`$|\boldsymbol\omega| = ${v.fix(wn, 3)}$ rad/s · one step turns the box by ${v.fix(wn * dt, 4)} rad: $\|\mathsf R_2\mathsf R_1 - \mathsf I\| = ${num(v, e0n)}$ (first order), $\|\mathsf R_2\mathsf R_1 - \mathsf R(\boldsymbol\omega\Delta t)\| = ${sci(v, e1n, 3)}$ vs $\Delta t^2|\boldsymbol\omega_1\times\boldsymbol\omega_2|/\sqrt2 = ${sci(v, (dt * dt * cr) / Math.SQRT2, 3)}$, $\|\mathsf R_2\mathsf R_1 - \mathsf R_1\mathsf R_2\| = ${sci(v, e2n, 3)}$ · after ${v.fix(t, 1)} s the stepped corner is ${num(v, off, 3)} from the exact rotation about $\boldsymbol\omega$ (shrinks like $\Delta t$) · exact motion: $|\dot{\mathbf r} - \boldsymbol\omega\times\mathbf r| = ${sci(v, vErr)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 9.5
    {
      num: '9.5',
      kind: 'Theorem',
      name: 'Time derivatives in a rotating frame',
      statement: String.raw`Let a frame $S'$ rotate relative to an inertial frame $S$ with angular velocity $\boldsymbol\omega(t)$ about a common origin. For any vector quantity $\mathbf Q(t)$, the rates of change seen in the two frames are related by
$$\left(\frac{d\mathbf Q}{dt}\right)_{S} = \left(\frac{d\mathbf Q}{dt}\right)_{S'} + \boldsymbol\omega\times\mathbf Q .$$
In particular, a vector fixed in the rotating frame changes in the inertial frame at the rate $\boldsymbol\omega\times\mathbf Q$, and $\boldsymbol\omega$ itself has the same rate of change in both frames. Applied to a position, the formula gives $\mathbf v_S = \mathbf v_{S'} + \boldsymbol\omega\times\mathbf r$.`,
      idea: String.raw`Write $\mathbf Q = \sum_i Q_i\,\mathbf e_i$ in the rotating frame’s basis. An observer in $S'$ sees the basis as fixed and records $\sum_i\dot Q_i\mathbf e_i$. In $S$ the basis vectors are themselves turning, as points of a rigid body, so $\dot{\mathbf e}_i = \boldsymbol\omega\times\mathbf e_i$ by the definition of angular velocity (9.4), and these terms add $\boldsymbol\omega\times\mathbf Q$. Lengths agree in the two frames; only the bookkeeping of directions differs. Setting $\mathbf Q = \boldsymbol\omega$ kills the extra term, since $\boldsymbol\omega\times\boldsymbol\omega = \mathbf 0$.`,
      caption: String.raw`A vector $\mathbf Q$ (blue) is drawn from the centre of a turntable. In the rotating frame (right) its tip slides along a straight line painted on the turntable, from the start handle to the end handle; drag them, or put them together to fix $\mathbf Q$ to the turntable. Left: the same motion seen from above in the inertial frame, where the tip traces a spiral. At the tip, the rate seen in the rotating frame (blue) plus $\boldsymbol\omega\times\mathbf Q$ (orange) adds up to the inertial rate (green), which is measured by differencing the spiral. On the right, the green dashed arrow is that same inertial rate expressed in the rotating axes, which is not the rotating frame’s rate. The arrows show one second’s worth of change.`,
      deps: ['mech-9.4'],
      refs: ['Taylor §9.4', 'Goldstein §4.9'],
      tags: ['rotating frame', 'derivative', 'kinematics'],
      viz(v) {
        const wS = v.slider('turntable rate $\\omega$ (rad/s)', -1.5, 1.5, 0.7, { step: 0.01 });
        const T = 4, RT = 2.15, KA = 1.1;
        const sI = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, axes: false, height: 330, title: 'inertial frame: the turntable turns' });
        const sR = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, axes: false, height: 330, title: 'rotating frame: the turntable is at rest' });
        const inDisc = (x, y) => { const r = Math.hypot(x, y); return r > 2 ? [(2 * x) / r, (2 * y) / r] : [x, y]; };
        const H0 = sR.handle(1.9, 0.6, { color: 'accent', constrain: inDisc });
        const H1 = sR.handle(0.15, 0.4, { color: 'teal', constrain: inDisc });
        let cur = null;
        v.animate((tA) => {
          const w = wS.value, t = Math.min((tA * T) / 5, T), u = [(H1.x - H0.x) / T, (H1.y - H0.y) / T];
          const Qr = (s) => [H0.x + u[0] * s, H0.y + u[1] * s], Qi = (s) => { const q = Qr(s); return rot(q[0], q[1], w * s); };
          const q = Qr(t), qi = Qi(t), ang = w * t, h = 1e-4;
          const fd = [(Qi(t + h)[0] - Qi(t - h)[0]) / (2 * h), (Qi(t + h)[1] - Qi(t - h)[1]) / (2 * h)];
          const uI = rot(u[0], u[1], ang), wxQ = zcross(w, qi[0], qi[1]), pred = [uI[0] + wxQ[0], uI[1] + wxQ[1]];
          // inertial panel
          turntable(sI, RT, ang);
          spinArrow(sI, 0, 0, RT + 0.17, Math.PI / 2 + ang, Math.sign(w) * Math.min(1.2, Math.abs(w) * 1.2 + 0.25), { color: 'orange' });
          const p0 = rot(H0.x, H0.y, ang), p1 = rot(H1.x, H1.y, ang);
          sI.line(p0[0], p0[1], p1[0], p1[1], { color: 'teal', width: 1.4, dash: [5, 4], alpha: 0.8 });
          const spiral = []; for (let j = 0; j <= 200; j++) spiral.push(Qi((T * j) / 200));
          sI.path(spiral, { color: 'accent', width: 1.2, alpha: 0.35 });
          const done = []; for (let j = 0; j <= 200 && (T * j) / 200 <= t; j++) done.push(Qi((T * j) / 200)); done.push(qi);
          sI.path(done, { color: 'accent', width: 2, alpha: 0.7 });
          sI.arrow(0, 0, qi[0], qi[1], { color: 'blue', width: 3 });
          farrow(sI, qi[0], qi[1], uI[0], uI[1], KA, 'blue', null, { width: 2.4 });
          farrow(sI, qi[0] + KA * uI[0], qi[1] + KA * uI[1], wxQ[0], wxQ[1], KA, 'orange', null, { width: 2.4 });
          farrow(sI, qi[0], qi[1], fd[0], fd[1], KA, 'green', null, { width: 3 });
          { // labels at the midpoints of the triangle’s sides, pushed away from its centroid
            const A = qi, Bv = [qi[0] + KA * uI[0], qi[1] + KA * uI[1]], Cv = [Bv[0] + KA * wxQ[0], Bv[1] + KA * wxQ[1]];
            const G = [(A[0] + Bv[0] + Cv[0]) / 3, (A[1] + Bv[1] + Cv[1]) / 3];
            const lab = (P, Q, tex, color) => {
              const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], ex = sI.X(Q[0]) - sI.X(P[0]), ey = sI.Y(Q[1]) - sI.Y(P[1]), el = Math.hypot(ex, ey);
              if (el < 12) return;
              let dx = sI.X(M[0]) - sI.X(G[0]), dy = sI.Y(M[1]) - sI.Y(G[1]), L = Math.hypot(dx, dy);
              if (L < 4) { dx = -ey; dy = ex; L = el; }
              sI.texPx(tex, sI.X(M[0]) + (20 * dx) / L, sI.Y(M[1]) + (20 * dy) / L, { color, size: 13 });
            };
            lab(A, Bv, "(\\dot{\\mathbf Q})_{S'}", 'blue'); lab(Bv, Cv, '\\boldsymbol\\omega\\times\\mathbf Q', 'orange'); lab(A, Cv, '(\\dot{\\mathbf Q})_S', 'green');
          }
          sI.dot(0, 0, { r: 3, color: 'ink' });
          sI.corner(`turntable turned ${v.fix(ang / DEG, 0)}°`, 'tl');
          // rotating panel
          turntable(sR, RT, 0);
          sR.line(H0.x, H0.y, H1.x, H1.y, { color: 'teal', width: 1.6, dash: [5, 4] });
          sR.arrow(0, 0, q[0], q[1], { color: 'blue', width: 3 });
          const wxQr = zcross(w, q[0], q[1]);
          farrow(sR, q[0], q[1], u[0], u[1], KA, 'blue', null, { width: 2.4 });
          farrow(sR, q[0] + KA * u[0], q[1] + KA * u[1], wxQr[0], wxQr[1], KA, 'orange', null, { width: 2.4 });
          farrow(sR, q[0], q[1], u[0] + wxQr[0], u[1] + wxQr[1], KA, 'green', null, { width: 2, dash: [5, 4] });
          sR.dot(0, 0, { r: 3, color: 'ink' });
          sR.text('start', H0.x, H0.y, { color: 'accent', size: 11, dy: 16, align: 'center' });
          sR.text('end', H1.x, H1.y, { color: 'teal', size: 11, dy: -16, align: 'center' });
          sR.corner(`t = ${v.fix(t, 2)} s`, 'tl');
          cur = { w, q, qi, fd, pred, u, ws: Math.hypot(...wxQ) };
        }, { period: 6.5, still: 2.2 });
        v.legend([['blue', '$\\mathbf Q$ and its rate in the rotating frame'], ['orange', '$\\boldsymbol\\omega\\times\\mathbf Q$'], ['green', 'rate in the inertial frame (measured)'], ['teal', 'line painted on the turntable', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { w, q, qi, fd, pred, u, ws } = cur, err = Math.hypot(fd[0] - pred[0], fd[1] - pred[1]);
          const fixed = Math.hypot(u[0], u[1]) < 1e-9;
          return String.raw`$|\mathbf Q| = ${v.fix(Math.hypot(q[0], q[1]), 4)}$ in both frames · measured $(\dot{\mathbf Q})_S = (${v.fix(fd[0], 4)}, ${v.fix(fd[1], 4)})$, $(\dot{\mathbf Q})_{S'} + \boldsymbol\omega\times\mathbf Q = (${v.fix(pred[0], 4)}, ${v.fix(pred[1], 4)})$, difference $${sci(v, err)}$ · $|\boldsymbol\omega\times\mathbf Q| = |\omega|\,|\mathbf Q| = ${v.fix(ws, 4)}$` + (fixed ? ' · $\\mathbf Q$ is fixed to the turntable: its inertial rate is $\\boldsymbol\\omega\\times\\mathbf Q$ alone and the tip moves on a circle' : '') + (w === 0 ? ' · $\\omega = 0$: the two frames agree' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 9.6
    {
      num: '9.6',
      kind: 'Theorem',
      name: 'Newton’s second law in a rotating frame',
      statement: String.raw`In a frame rotating with angular velocity $\boldsymbol\omega(t)$ about an origin fixed in an inertial frame, a particle of mass $m$ acted on by the force $\mathbf F$ moves according to
$$m\ddot{\mathbf r} = \mathbf F \;\underbrace{-\,2m\,\boldsymbol\omega\times\dot{\mathbf r}}_{\text{Coriolis}}\;\underbrace{-\,m\,\boldsymbol\omega\times(\boldsymbol\omega\times\mathbf r)}_{\text{centrifugal}}\;\underbrace{-\,m\,\dot{\boldsymbol\omega}\times\mathbf r}_{\text{Euler}},$$
where $\mathbf r$, $\dot{\mathbf r}$ and $\ddot{\mathbf r}$ are measured in the rotating frame. The centrifugal force $m\omega^2\boldsymbol\rho$ points away from the axis, with $\boldsymbol\rho$ the distance vector from it. The Coriolis force is perpendicular to the velocity and to $\boldsymbol\omega$, so it does no work. The Euler force appears only while the rotation rate changes. If the origin also accelerates, add $-m\mathbf A$ (9.1).`,
      idea: String.raw`Apply the derivative rule (9.5) twice. First $\mathbf v_S = \dot{\mathbf r} + \boldsymbol\omega\times\mathbf r$; differentiating again in $S$ and using the rule on $\mathbf v_S$ gives $\mathbf a_S = \ddot{\mathbf r} + 2\boldsymbol\omega\times\dot{\mathbf r} + \boldsymbol\omega\times(\boldsymbol\omega\times\mathbf r) + \dot{\boldsymbol\omega}\times\mathbf r$. Newton’s second law (1.6) holds for $\mathbf a_S$, and moving the extra terms to the force side makes them fictitious forces. One factor of the Coriolis term comes from the turning of the velocity vector, and the other from the particle moving to places where the frame moves at a different speed.`,
      caption: String.raw`A frictionless puck slides across a turntable. Left, seen from above in the inertial frame: drag its start (gold) and launch velocity (blue tip); it goes straight, and the faint purple curve is the mark it scratches on the turning table. Right, in the rotating frame: the same motion curls, and the arrows at the puck are the centrifugal (orange), Coriolis (purple) and Euler (teal) forces per unit mass, with their sum in green. The dots are an independent integration of the rotating-frame equation using only those forces, and they land on the curve. Give the turntable an angular acceleration to switch on the Euler force; reverse $\omega$ and the curl reverses.`,
      deps: ['mech-9.5', 'mech-1.6'],
      refs: ['Taylor §9.5', 'Arnold §27'],
      tags: ['Coriolis force', 'centrifugal force', 'rotating frame'],
      viz(v) {
        const wS = v.slider('rotation rate $\\omega_0$ (rad/s)', -3, 3, 1.8, { step: 0.05 });
        const aS = v.slider('angular acceleration $\\dot\\omega$ (rad/s²)', -1.5, 1.5, 0, { step: 0.05 });
        const sI = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 330, title: 'inertial frame (from above)' });
        const sR = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 330, title: 'frame of the turntable' });
        const KV = 0.45, KF = 0.085, TMAX = 5;
        const P0 = sI.handle(-0.62, -0.55, { color: 'gold', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 0.95 ? [(0.95 * x) / r, (0.95 * y) / r] : [x, y]; } });
        const VH = sI.handle(-0.62 + KV * 0.75, -0.55 + KV * 1.05, { color: 'accent' });
        let lastP = [P0.x, P0.y];
        P0.onDrag = () => { VH.set(VH.x + P0.x - lastP[0], VH.y + P0.y - lastP[1]); lastP = [P0.x, P0.y]; };
        const cache = memo(); let cur = null;
        const run = () => cache([P0.x, P0.y, VH.x, VH.y, wS.value, aS.value].join('|'), () => {
          lastP = [P0.x, P0.y];
          const w0 = wS.value, al = aS.value, r0 = [P0.x, P0.y], v0 = [(VH.x - P0.x) / KV, (VH.y - P0.y) / KV], sp = Math.hypot(...v0);
          // exit time from the unit disc along the straight line
          const b = r0[0] * v0[0] + r0[1] * v0[1], c = r0[0] ** 2 + r0[1] ** 2 - 1;
          const tEx = sp > 1e-9 ? Math.min(TMAX, (-b + Math.sqrt(b * b - sp * sp * c)) / (sp * sp)) : TMAX;
          const th = (t) => w0 * t + 0.5 * al * t * t, wt = (t) => w0 + al * t;
          const lab = (t) => [r0[0] + v0[0] * t, r0[1] + v0[1] * t], rotp = (t) => { const p = lab(t); return rot(p[0], p[1], -th(t)); };
          // independent integration in the rotating frame with the fictitious forces only
          const f = (t, S) => { const w = wt(t), cor = zcross(-2 * w, S[2], S[3]), eu = zcross(-al, S[0], S[1]); return [S[2], S[3], w * w * S[0] + cor[0] + eu[0], w * w * S[1] + cor[1] + eu[1]]; };
          const vr0 = [v0[0] + w0 * r0[1], v0[1] - w0 * r0[0]];
          const n = Math.max(20, Math.round(tEx / 0.002)), REC = Math.max(1, Math.round(n / 400));
          const Rr = rk4rec(f, [r0[0], r0[1], vr0[0], vr0[1]], tEx, n, REC);
          let dev = 0; for (let k = 0; k < Rr.t.length; k++) { const p = rotp(Rr.t[k]); dev = Math.max(dev, Math.hypot(p[0] - Rr.y[k][0], p[1] - Rr.y[k][1])); }
          return { w0, al, r0, v0, tEx, th, wt, lab, rotp, Rr, dev };
        });
        v.animate((tA) => {
          const B = run(), t = Math.min(tA * 0.5, B.tEx), ang = B.th(t), w = B.wt(t);
          // inertial
          turntable(sI, 1, ang);
          spinArrow(sI, 0, 0, 1.09, Math.PI / 2 + ang, Math.sign(w) * Math.min(1.1, Math.abs(w) * 0.5 + 0.2), { color: 'orange' });
          const scratch = []; for (let j = 0; j <= 160; j++) { const s = (t * j) / 160, p = B.rotp(s); scratch.push(rot(p[0], p[1], ang)); }
          sI.path(scratch, { color: 'purple', width: 1.4, alpha: 0.5 });
          const pL = B.lab(t), pE = B.lab(B.tEx);
          sI.line(B.r0[0], B.r0[1], pE[0], pE[1], { color: 'accent', width: 1, alpha: 0.3, dash: [4, 4] });
          sI.line(B.r0[0], B.r0[1], pL[0], pL[1], { color: 'accent', width: 2.2 });
          sI.arrow(P0.x, P0.y, VH.x, VH.y, { color: 'accent', width: 1.6, head: 7 });
          sI.dot(pL[0], pL[1], { r: 7, color: 'gold' });
          sI.corner(`t = ${v.fix(t, 2)} s`, 'tl');
          // rotating
          turntable(sR, 1, 0);
          const path = []; for (let j = 0; j <= 240; j++) path.push(B.rotp((B.tEx * j) / 240));
          sR.path(path, { color: 'purple', width: 1.2, alpha: 0.35 });
          const done = []; for (let j = 0; j <= 240 && (B.tEx * j) / 240 <= t; j++) done.push(B.rotp((B.tEx * j) / 240)); done.push(B.rotp(t));
          sR.path(done, { color: 'purple', width: 2.4 });
          sR.dots(B.Rr.y.filter((_, k) => k % 14 === 0).map((y) => [y[0], y[1]]), { r: 2.2, color: 'ink' });
          const p = B.rotp(t), h = 1e-4, pa = B.rotp(Math.max(0, t - h)), pb = B.rotp(t + h), vr = [(pb[0] - pa[0]) / (t + h - Math.max(0, t - h)), (pb[1] - pa[1]) / (t + h - Math.max(0, t - h))];
          const cf = [w * w * p[0], w * w * p[1]], co = zcross(-2 * w, vr[0], vr[1]), eu = zcross(-B.al, p[0], p[1]), sum = [cf[0] + co[0] + eu[0], cf[1] + co[1] + eu[1]];
          sR.dot(p[0], p[1], { r: 5.5, color: 'gold' });
          farrow(sR, p[0], p[1], sum[0], sum[1], KF, 'green', null, { width: 3.2 });
          farrow(sR, p[0], p[1], cf[0], cf[1], KF, 'orange', null);
          farrow(sR, p[0], p[1], co[0], co[1], KF, 'purple', null);
          farrow(sR, p[0], p[1], eu[0], eu[1], KF, 'teal', null);
          // measured acceleration of the rotating-frame path (central second difference)
          const hh = 2e-3, tm = Math.max(hh, Math.min(t, B.tEx - hh)), q0 = B.rotp(tm - hh), q1 = B.rotp(tm), q2 = B.rotp(tm + hh);
          const am = [(q2[0] - 2 * q1[0] + q0[0]) / hh ** 2, (q2[1] - 2 * q1[1] + q0[1]) / hh ** 2];
          const wm = B.wt(tm), vm = [(q2[0] - q0[0]) / (2 * hh), (q2[1] - q0[1]) / (2 * hh)], com = zcross(-2 * wm, vm[0], vm[1]), eum = zcross(-B.al, q1[0], q1[1]);
          const sm = [wm * wm * q1[0] + com[0] + eum[0], wm * wm * q1[1] + com[1] + eum[1]];
          sR.corner(`ω = ${v.fix(w, 2)} rad/s`, 'tl');
          cur = { B, cf, co, eu, am, sm, t };
        }, { period: 11, still: 1.75 });
        v.legend([['orange', 'centrifugal $m\\omega^2\\boldsymbol\\rho$'], ['purple', 'Coriolis $-2m\\boldsymbol\\omega\\times\\dot{\\mathbf r}$ / path on the table'], ['teal', 'Euler $-m\\dot{\\boldsymbol\\omega}\\times\\mathbf r$'], ['green', 'sum'], ['ink', 'integrated with the fictitious forces', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { B, cf, co, eu, am, sm } = cur, m = (a) => v.fix(Math.hypot(a[0], a[1]), 3);
          return String.raw`per unit mass (m/s²): centrifugal ${m(cf)}, Coriolis ${m(co)}, Euler ${m(eu)} · measured curvature of the path $|\ddot{\mathbf r}| = ${m(am)}$, sum of the fictitious forces ${m(sm)}, difference $${sci(v, Math.hypot(am[0] - sm[0], am[1] - sm[1]))}$ (finite differences) · rotating-frame integration vs the transformed straight line: largest gap $${sci(v, B.dev)}$ m over ${v.fix(B.tEx, 2)} s`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 9.7
    {
      num: '9.7',
      kind: 'Phenomenon',
      name: 'Newton’s bucket and the centrifugal potential',
      statement: String.raw`In a frame rotating at constant $\boldsymbol\omega$ the centrifugal force is conservative, with potential energy $U_{\rm cf} = -\tfrac12m\omega^2\rho^2$, where $\rho$ is the distance from the axis. Water turning rigidly with a bucket is at rest in the bucket’s frame, so its free surface is an equipotential of gravity plus the centrifugal potential:
$$gz - \tfrac12\omega^2\rho^2 = \text{const},\qquad z(\rho) = z_0 + \frac{\omega^2\rho^2}{2g},$$
a paraboloid that rises by $\omega^2R^2/2g$ from the centre to a wall of radius $R$, with $z_0$ fixed by the volume of water. The surface is everywhere perpendicular to the effective gravity $\mathbf g_{\rm eff} = \mathbf g + \omega^2\boldsymbol\rho$. The shape depends on the water’s rotation, not on its rotation relative to the bucket. **Newton’s bucket argument** (1687): just after the bucket starts spinning the surface is flat, and when the bucket is stopped the still-spinning water stays curved, although the relative rotation is the same in both cases. On the rotating Earth the same effect tilts a plumb line from the direction of the Earth’s centre by up to $0.1°$ at $45°$ latitude.`,
      idea: String.raw`A force with a potential (3.4) has an equilibrium surface wherever the potential is constant; otherwise the water would flow along the surface. In the rotating frame the Coriolis force vanishes on water at rest, and the centrifugal force $m\omega^2\boldsymbol\rho = -\nabla(-\tfrac12m\omega^2\rho^2)$ joins gravity (9.6). Setting the total potential constant gives the paraboloid; the slope $dz/d\rho = \omega^2\rho/g$ equals the ratio of the centrifugal to the gravitational force, so the effective gravity is normal to the surface. For the Earth, $\Omega^2R_\oplus/g \approx 1/290$ and the tilt is largest halfway between the equator and the pole.`,
      caption: String.raw`Choose the spin rate and the stage of Newton’s experiment. Left: the bucket in 3D (drag to rotate), with corks marking how the water moves and ticks on the wall marking how the bucket moves (the animation is slowed down). Right: a vertical section with the equipotentials of $gz - \tfrac12\omega_{\rm w}^2\rho^2$ for the water’s rotation rate $\omega_{\rm w}$. The surface is the equipotential that holds the water’s volume, and the green effective-gravity arrows stand perpendicular to it. Spin fast enough and the centre runs dry. Bottom: the same physics on the Earth, as the angle between a plumb line and the direction to the Earth’s centre.`,
      deps: ['mech-9.6', 'mech-3.4'],
      see: ['geo-2.5', 'astro-3.8', 'geog-1.6'],
      refs: ['Taylor §9.6'],
      tags: ['centrifugal force', 'equipotential', 'Newton'],
      credit: 'Newton, 1687 (Principia, Scholium to the definitions)',
      viz(v) {
        const stage = v.select('Newton’s experiment', [{ value: 'b', label: 'bucket spun, water still' }, { value: 'both', label: 'water turning with it' }, { value: 'w', label: 'bucket stopped, water turning' }], 'both');
        const fS = v.slider('spin rate (rev/s)', 0, 2.5, 1.6, { step: 0.01 });
        const latS = v.slider('latitude for the plumb line', 0, 90, 45, { step: 0.5 });
        const S = v.stage({ x: [-1.75, 1.75], y: [-1.6, 1.9], equal: true, axes: false, height: 340, title: 'the bucket (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.4, pitch: 0.42, axis: 1.3, lim: 1.5, hint: false, axes: false });
        const X = v.stage({ x: [-0.19, 0.19], y: [-0.02, 0.33], equal: true, axes: false, height: 340, title: 'section through the axis (metres)' });
        const E = v.stage({ x: [0, 90], y: [0, 7.2], axes: 'box', height: 150, full: true, title: 'on the Earth: angle between a plumb line and the direction to the centre (arc minutes) against latitude (°)', xticks: [0, 15, 30, 45, 60, 75, 90] });
        const g = 9.81, RB = 0.15, HB = 0.3, H0 = 0.1, SC = 1 / RB; // bucket radius, height, water depth (m); scene units per metre
        const surfC = memo();
        const surface = (w) => surfC(w, () => {
          if (w < 1e-9) return { c: g * H0, rd: 0, z: () => H0 };
          const V = (c) => { const n = 400; let s = 0; for (let i = 0; i < n; i++) { const r = ((i + 0.5) * RB) / n; s += Math.max(0, (c + 0.5 * w * w * r * r) / g) * r; } return (TAU * s * RB) / n; };
          const target = Math.PI * RB * RB * H0; let lo = -0.5 * w * w * RB * RB, hi = g * H0 + 1;
          for (let k = 0; k < 70; k++) { const mid = (lo + hi) / 2; if (V(mid) < target) lo = mid; else hi = mid; }
          const c = (lo + hi) / 2;
          return { c, rd: c < 0 ? Math.sqrt(-2 * c) / w : 0, z: (r) => Math.max(0, (c + 0.5 * w * w * r * r) / g), vol: V(c) / target };
        });
        const P3 = (r, a, z) => [SC * r * Math.cos(a), SC * r * Math.sin(a), SC * z - 1];
        let cur = null;
        v.animate((t) => {
          const w = TAU * fS.value, wW = stage.value === 'b' ? 0 : w, wB = stage.value === 'w' ? 0 : w, sf = surface(wW), slow = 0.12;
          const aW = slow * wW * t, aB = slow * wB * t;
          sc.begin();
          // bucket: bottom, rim and wall ticks turning with the bucket
          const circ = (z, n = 64) => Array.from({ length: n + 1 }, (_, k) => P3(RB, (TAU * k) / n, z));
          sc.path(circ(0), { color: 'muted', width: 1.6 }); sc.path(circ(HB), { color: 'muted', width: 1.6 });
          for (let k = 0; k < 12; k++) { const a = aB + (TAU * k) / 12; sc.line(P3(RB, a, 0), P3(RB, a, HB), { color: k === 0 ? 'orange' : 'faint', width: k === 0 ? 2.2 : 1, alpha: 0.8 }, 4); }
          // water surface (rings × sectors) and side wall
          const NR = 9, NS = 36, zs = (r) => sf.z(r);
          for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) {
            const r0 = (RB * i) / NR, r1 = (RB * (i + 1)) / NR, a0 = (TAU * j) / NS, a1 = (TAU * (j + 1)) / NS;
            if (zs(r1) <= 0) continue;
            sc.poly([P3(r0, a0, zs(r0)), P3(r1, a0, zs(r1)), P3(r1, a1, zs(r1)), P3(r0, a1, zs(r0))], { fill: 'blue', fillAlpha: 0.3, edge: false });
          }
          for (let i = 1; i <= NR; i += 2) { const r = (RB * i) / NR; if (zs(r) > 0) sc.path(Array.from({ length: 49 }, (_, k) => P3(r, (TAU * k) / 48, zs(r))), { color: 'blue', width: 1, alpha: 0.55 }); }
          for (let j = 0; j < NS; j++) { const a0 = (TAU * j) / NS, a1 = (TAU * (j + 1)) / NS; sc.poly([P3(RB, a0, 0), P3(RB, a1, 0), P3(RB, a1, zs(RB)), P3(RB, a0, zs(RB))], { fill: 'blue', fillAlpha: 0.1, edge: false }); }
          sc.path(Array.from({ length: 65 }, (_, k) => P3(RB, (TAU * k) / 64, zs(RB))), { color: 'blue', width: 2 });
          for (const [r, a] of [[0.035, 0.3], [0.07, 2.4], [0.1, 4.4], [0.125, 1.2], [0.055, 5.3], [0.115, 3.3]]) if (zs(r) > 0) sc.dot(P3(r, a + aW, zs(r)), { r: 4.5, color: 'gold' });
          sc.flush();
          // section
          const lv = []; for (let k = -10; k <= 10; k++) lv.push(sf.c + g * 0.03 * k);
          X.clip(() => X.contour((x, z) => g * z - 0.5 * wW * wW * x * x, lv, { color: 'faint', width: 1, dash: [4, 4], res: 90 }), [-RB, RB], [0, HB]);
          const wat = []; for (let j = 0; j <= 120; j++) { const x = -RB + (2 * RB * j) / 120; wat.push([x, zs(Math.abs(x))]); }
          X.poly([[-RB, 0], ...wat, [RB, 0]], { fill: 'blue', fillAlpha: 0.22, stroke: false });
          X.path(wat, { color: 'blue', width: 2.6 });
          X.path([[-RB, HB], [-RB, 0], [RB, 0], [RB, HB]], { color: 'ink', width: 3 });
          X.line(0, -0.01, 0, HB + 0.015, { color: 'muted', width: 1, dash: [6, 4] });
          for (const x of [-0.11, -0.065, -0.025, 0.025, 0.065, 0.11]) {
            const z = zs(Math.abs(x)); if (z <= 0.004) continue;
            const ge = [wW * wW * x, -g], k = 0.0034;
            X.arrow(x, z, x + k * ge[0], z + k * ge[1], { color: 'green', width: 2, head: 7 });
          }
          const rise = zs(RB) - zs(sf.rd), pred = (wW * wW * (RB * RB - sf.rd * sf.rd)) / (2 * g);
          if (wW > 0 && zs(RB) - zs(sf.rd) > 0.004) { X.measure(RB + 0.014, zs(sf.rd), RB + 0.014, zs(RB), null, { color: 'red' }); X.text('Δz', RB + 0.02, (zs(sf.rd) + zs(RB)) / 2, { color: 'red', size: 12, align: 'left', math: true }); }
          X.corner(stage.value === 'b' ? 'water not turning: flat' : `water turns at ${v.fix(wW, 2)} rad/s`, 'tl');
          // Earth: plumb-line deviation for a point-mass Earth plus the centrifugal force
          const GM = 3.986004e14, Re = 6.371e6, g0 = GM / Re ** 2, c2 = OMEGA * OMEGA * Re;
          const dev = (lat) => Math.atan2(c2 * Math.sin(lat) * Math.cos(lat), g0 - c2 * Math.cos(lat) ** 2);
          E.fn((x) => (dev(x * DEG) * 180 * 60) / Math.PI, { color: 'accent', width: 2.4, domain: [0, 90] });
          const lat = latS.value, dl = (dev(lat * DEG) * 180 * 60) / Math.PI;
          E.dot(lat, dl, { r: 5, color: 'gold' });
          cur = { w, wW, wB, sf, rise, pred, dl, lat, g0, c2 };
        }, { period: 60, still: 4 });
        v.legend([['blue', 'water surface'], ['faint', 'equipotentials of $gz - \\tfrac12\\omega_{\\rm w}^2\\rho^2$', { dash: true }], ['green', 'effective gravity $\\mathbf g + \\omega_{\\rm w}^2\\boldsymbol\\rho$'], ['gold', 'corks on the water', { dot: true }], ['orange', 'mark on the bucket wall']]);
        v.readout(() => {
          if (!cur) return '';
          const { wW, wB, sf, rise, pred, dl, lat, g0, c2 } = cur;
          let out;
          if (wW === 0) out = String.raw`the water is not turning, so its surface is flat at depth ${v.fix(H0 * 100, 1)} cm` + (wB > 0 ? ', although the bucket spins at ' + v.fix(wB, 2) + ' rad/s relative to it' : '');
          else {
            out = sf.rd > 0
              ? String.raw`the centre is dry out to $\rho = ${v.fix(sf.rd * 100, 2)}$ cm; rise from there to the wall ${v.fix(rise * 100, 3)} cm, $\omega^2(R^2-\rho_0^2)/2g = ${v.fix(pred * 100, 3)}$ cm`
              : String.raw`rise from the centre to the wall ${v.fix(rise * 100, 3)} cm, $\omega^2R^2/2g = ${v.fix(pred * 100, 3)}$ cm (the level is fixed by keeping the volume of water unchanged)`;
            out += String.raw` · slope $dz/d\rho = \omega^2\rho/g$, so $\mathbf g_{\rm eff}$ is normal to the surface`;
            if (wB === 0) out += ' · the bucket is at rest, yet the water is curved: the shape measures rotation relative to the inertial frames, not relative to the bucket';
          }
          return out + String.raw` · Earth at ${v.fix(lat, 1)}°: plumb line ${v.fix(dl, 2)}′ off the centre direction (point-mass Earth, $\Omega^2R/g = 1/${v.fix(g0 / c2, 0)}$; the real Earth’s flattening adds about as much again)`;
        });
      },
    },
  ],
};
