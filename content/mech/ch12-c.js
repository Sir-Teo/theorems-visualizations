// Classical Mechanics — Chapter 12: Hamiltonian mechanics (part c: 12.18–12.25)

import { TAU, DEG, clamp, memo, sci, num, rk4, rk4rec, idxAt, wrap, upCrossings, pendInfo, piTicks, rightAngle, series, drawPendulum } from './ch12.shared.js';

/** Midpoint rule on [0, π] in the variable χ, for integrands written with r = m − h cos χ. */
const chiInt = (f, n = 400) => { let s = 0; for (let k = 0; k < n; k++) s += f((Math.PI * (k + 0.5)) / n); return (s * Math.PI) / n; };

export default {
  collection: 'mech',
  chapter: 12,
  items: [
    // ───────────────────────────────────────────────────────────── 12.18
    {
      num: '12.18',
      kind: 'Theorem',
      name: 'Liouville–Arnold theorem: invariant tori',
      statement: String.raw`Suppose a Hamiltonian system with $n$ degrees of freedom has $n$ conserved quantities $F_1 = H, F_2, \dots, F_n$ in involution, $\{F_i, F_j\} = 0$, with linearly independent differentials on the level set $M_f = \{F_i = f_i\}$. Then $M_f$ is a smooth $n$-dimensional manifold invariant under the flow. If it is compact and connected, it is diffeomorphic to the torus $\mathbb T^n$, and near it there are action–angle variables $(J, \theta)$ (12.17) in which $H = H(J)$ and the motion is linear on the torus: $\theta_i(t) = \theta_i(0) + \omega_i t$ with $\omega_i = \partial H/\partial J_i$. If the frequencies are rationally dependent the orbits close (resonant torus); if they are rationally independent each orbit fills its torus densely (quasi-periodic motion). Adding a perturbation that destroys the extra integrals breaks the tori, partly or completely (KAM, 13.7).`,
      idea: String.raw`The $n$ commuting flows of $F_1, \dots, F_n$ all preserve every $F_j$, since $\{F_i, F_j\} = 0$, and they commute with each other by the Jacobi identity (12.8). Together they define an action of $\R^n$ on the level set. The independence of the differentials makes the action locally free, so the level set is a quotient $\R^n/\Lambda$ by a lattice of periods, and a compact such quotient is a torus. The actions are the integrals $\frac1{2\pi}\oint p\cdot dq$ over the $n$ basic cycles, and the motion of $H$ is a straight line in the angle coordinates. Whether that line closes is a question about the ratio of frequencies, as for a line of irrational slope on the square with opposite sides glued.`,
      caption: String.raw`Two oscillators with frequencies $\omega_1 = 1$ and $\omega_2$. The pair of angles $(\theta_1, \theta_2)$ places the state on a torus (left; the tube radius is the amplitude of oscillator 1). Middle: the same orbit on the square $[0, 2\pi)^2$ with opposite sides glued, a family of straight lines. Right: the Poincaré section, the values of $(q_1, p_1)$ each time oscillator 2 passes through $q_2 = 0$ upward. For a rational ratio $p/q$ the orbit closes and the section is $q$ points. For an irrational ratio the orbit never closes, and it fills the torus and the circle. Switch on a coupling that destroys the second integral and the orbit leaves the torus: the section scatters.`,
      deps: ['mech-12.17', 'mech-12.8'],
      refs: ['Arnold §49', 'Tong §4.5'],
      tags: ['integrable system', 'invariant torus', 'quasi-periodic motion'],
      credit: 'Liouville, 1855; Arnold, 1963; Jost, 1968',
      viz(v) {
        const rS = v.slider('frequency ratio $\\omega_2/\\omega_1$', 0.3, 2.5, (Math.sqrt(5) - 1) / 2 + 1, { step: 0.0001 });
        v.select('preset', [{ value: '0.5', label: '1/2' }, { value: '0.6666666667', label: '2/3' }, { value: '1.5', label: '3/2' }, { value: '1.6180339887', label: 'golden' }, { value: '1.4142135624', label: '$\\sqrt2$' }], '1.6180339887', { onChange: (x) => { rS.set(+x); v.restart(); } });
        const cS = v.select('coupling', [{ value: '0', label: 'none (integrable)' }, { value: '0.25', label: 'weak' }, { value: '0.7', label: 'strong (break it)' }], '0', { onChange: () => v.restart() });
        const S3 = v.stage({ x: [-1.75, 1.75], y: [-1.3, 1.3], equal: true, axes: false, height: 290, weight: 1.15, title: 'the torus (drag to rotate)' });
        const sc = v.scene3(S3, { yaw: -0.4, pitch: 0.75, axes: false, hint: false });
        const sQ = v.stage({ x: [0, TAU], y: [0, TAU], equal: true, axes: 'box', gutter: true, height: 290, weight: 1, xlabel: 'θ₁', ylabel: 'θ₂', xticks: piTicks(0, TAU, 1), yticks: piTicks(0, TAU, 1) });
        const sP = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, axes: 'box', gutter: true, height: 290, weight: 1, xlabel: 'q₁', ylabel: 'p₁', title: 'section at $q_2 = 0$' });
        const TT = 600, DT = 0.02;
        const cache = memo(); let cur = null;
        const run = () => cache(rS.value + '|' + cS.value, () => {
          const w2 = rS.value, eps = +cS.value;
          const f = (t, y) => [y[2], y[3], -y[0] - eps * 2 * y[0] * y[1], -w2 * w2 * y[1] - eps * (y[0] * y[0] - y[1] * y[1])];
          const R = rk4rec(f, [0, 0.4 / w2, 1, 0.55], TT, Math.round(TT / DT), 2);
          const rho0 = 1, sec = [], cells = new Set();
          for (let i = 1; i < R.y.length; i++) { const a = R.y[i - 1], b = R.y[i]; if (a[1] < 0 && b[1] >= 0 && b[3] > 0) { const u = -a[1] / (b[1] - a[1]); sec.push([a[0] + u * (b[0] - a[0]), a[2] + u * (b[2] - a[2])]); } }
          const ang = R.y.map((y) => { const t1 = Math.atan2(y[0], y[2]), t2 = Math.atan2(w2 * y[1], y[3]); return [(t1 + TAU) % TAU, (t2 + TAU) % TAU, Math.hypot(y[0], y[2])]; });
          for (const a of ang) cells.add(Math.floor((a[0] / TAU) * 40) * 40 + Math.floor((a[1] / TAU) * 40));
          const distinct = new Set(sec.map((z) => Math.round(z[0] * 300) + ',' + Math.round(z[1] * 300))).size;
          let rlo = Infinity, rhi = -Infinity; for (const a of ang) { rlo = Math.min(rlo, a[2]); rhi = Math.max(rhi, a[2]); }
          return { R, ang, sec, cover: cells.size / 1600, distinct, rlo, rhi, rho0, eps };
        });
        const torusPt = (t1, t2, a) => { const R0 = 1.15, rr = R0 + a * Math.cos(t1); return [rr * Math.cos(t2), rr * Math.sin(t2), a * Math.sin(t1)]; };
        v.animate((tt) => {
          const B = run(), tau = Math.min(TT, 25 * tt), i = idxAt(B.R, tau), A0 = 0.42;
          sc.begin();
          for (let k = 0; k < 24; k++) { const t2 = (TAU * k) / 24; sc.path(Array.from({ length: 33 }, (_, j) => torusPt((TAU * j) / 32, t2, A0)), { color: 'faint', width: 0.8, alpha: 0.5 }); }
          for (let k = 0; k < 8; k++) { const t1 = (TAU * k) / 8; sc.path(Array.from({ length: 65 }, (_, j) => torusPt(t1, (TAU * j) / 64, A0)), { color: 'faint', width: 0.8, alpha: 0.5 }); }
          const pts = []; for (let j = Math.max(0, i - 2500); j <= i; j += 2) { const a = B.ang[j]; pts.push(torusPt(a[0], a[1], A0 * a[2] / B.rho0)); }
          sc.path(pts, { color: 'accent', width: 1.3, alpha: 0.85 });
          const a = B.ang[i]; sc.dot(torusPt(a[0], a[1], A0 * a[2] / B.rho0), { r: 5, color: 'gold' });
          sc.flush();
          // unfolded torus
          const sq = []; for (let j = 0; j <= i; j += 2) sq.push([B.ang[j][0], B.ang[j][1]]);
          sQ.dots(sq, { r: 0.9, color: 'accent', alpha: 0.6 });
          sQ.dot(a[0], a[1], { r: 5, color: 'gold' });
          // section
          sP.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          const ns = B.sec.filter((_, k) => k * (TT / B.sec.length) <= tau + 1e-9);
          sP.dots(ns, { r: 2.4, color: B.eps ? 'red' : 'purple' });
          cur = { B, ns };
        }, { period: TT / 25 + 1, still: 20 });
        v.legend([['accent', 'orbit'], ['purple', 'section points (integrable)', { dot: true }], ['red', 'section points (coupled)', { dot: true }], ['faint', 'the invariant torus of the uncoupled system']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, ns } = cur, r = rS.value, cf = v.M.convergents ? v.M.convergents(r).slice(0, 6).map((c) => `${c[0]}/${c[1]}`).join(', ') : '';
          const shell = B.eps ? String.raw` · amplitude of oscillator 1 wanders between ${v.fix(B.rlo, 3)} and ${v.fix(B.rhi, 3)}: no torus` : String.raw` · amplitude of oscillator 1 constant (${v.fix(B.rlo, 4)}–${v.fix(B.rhi, 4)})`;
          return String.raw`$\omega_2/\omega_1 = ${v.fix(r, 4)}$` + (cf ? ` (continued-fraction convergents ${cf})` : '') + ` · section: ${ns.length} crossings at ${B.distinct} distinct points · the full run visits ${v.fix(100 * B.cover, 1)}% of the cells of the square` + shell;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.19
    {
      num: '12.19',
      kind: 'Theorem',
      name: 'Adiabatic invariance of the action',
      statement: String.raw`Let $H(q, p; \lambda)$ have closed orbits for each fixed value of a parameter $\lambda$, with frequency $\omega(\lambda)$ bounded away from zero. If $\lambda = \lambda(\varepsilon t)$ changes slowly, then the action $J = \frac1{2\pi}\oint p\,dq$ of the frozen system is an **adiabatic invariant**: over the time $1/\varepsilon$ in which $\lambda$ changes by $O(1)$, $J$ changes only by $O(\varepsilon)$. If $\lambda(\tau)$ is smooth and constant outside a finite interval, the net change between the initial and final constant states is smaller than any power of $\varepsilon$. Energy is not conserved, but for an oscillator $J = E/\omega$, so the energy follows the frequency: $E \propto \omega$. A pendulum whose string is slowly shortened from $l_0$ to $l$ gains energy as $E \propto l^{-1/2}$, and its amplitude grows as $l^{-3/4}$.`,
      idea: String.raw`In action–angle variables of the frozen system (12.17), the time dependence adds a term of order $\dot\lambda$ to $\dot J$ that oscillates with the angle and has zero average over a cycle. Over many cycles these contributions largely cancel, so the net drift is $O(\dot\lambda)$ times a bounded amount. When $\lambda$ is switched on and off smoothly, the remainder is a Fourier coefficient of a smooth function at the high frequency $\omega/\varepsilon$, and so it is beyond all orders. Geometrically, the orbit of the frozen system deforms slowly while the phase point keeps going around it, so the area it encloses, $2\pi J$, cannot change.`,
      caption: String.raw`A pendulum hangs from a string pulled through a ring, so its length changes from $l_0$ to $l$ over a ramp time $T$ (in units of the initial period). Middle: energy, frequency and the action, each relative to its starting value. The action is computed exactly for the frozen pendulum at each instant. Energy and frequency change a lot, while $J$ stays put when the ramp is slow. Right: the final change of $J$ against the ramp time, on log–log axes, for a ramp with corners (error $\propto 1/T$) and an infinitely smooth one (error falling faster than any power). The current run is the large dot. Make the ramp fast and the invariance breaks.`,
      deps: ['mech-12.17'],
      refs: ['Goldstein §12.5', 'Tong §4.6'],
      tags: ['adiabatic invariant', 'action', 'slowly varying'],
      credit: 'Einstein and Lorentz, 1911 (Solvay); Burgers, 1917',
      viz(v) {
        const lS = v.slider('final length $l/l_0$', 0.25, 3, 0.35, { step: 0.01 });
        const TS = v.slider('ramp time $T$ (initial periods)', 0.25, 40, 6, { log: true });
        const aS = v.slider('starting amplitude (°)', 2, 60, 20, { step: 1 });
        const shape = v.select('ramp', [{ value: 'smooth', label: 'infinitely smooth' }, { value: 'lin', label: 'linear (corners)' }], 'smooth');
        const sR = v.stage({ x: [-1.1, 1.1], y: [-1.45, 0.25], equal: true, axes: false, height: 300, weight: 0.85, title: 'the pendulum' });
        const sT = v.stage({ x: [0, 1], y: [0, 2.2], axes: 'box', gutter: true, height: 300, weight: 1.3, xlabel: 't (initial periods)', title: 'relative to the start: $E$, $\\omega$ and $J$' });
        const sW = v.stage({ x: [0.25, 40], y: [1e-9, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, weight: 1.1, xlabel: 'ramp time T', title: 'final $|\\Delta J/J|$' });
        const psi = (x) => (x > 0 ? Math.exp(-1 / x) : 0);
        const ramp = (s, sh) => (s <= 0 ? 0 : s >= 1 ? 1 : sh === 'lin' ? s : psi(s) / (psi(s) + psi(1 - s)));
        const Jof = (l, th, om) => l ** 1.5 * pendInfo(0.5 * l * om * om - Math.cos(th)).J;
        const simulate = (l1, Tr, amp, sh, every = 4, dt = 0.01) => {
          const P0 = TAU, Tw = Tr * P0, Ttot = Tw + 2.5 * P0 * Math.max(1, l1 ** 0.5);
          const L = (t) => 1 + (l1 - 1) * ramp(t / Tw, sh), Ld = (t) => (L(t + 1e-5) - L(t - 1e-5)) / 2e-5;
          const f = (t, y) => { const l = L(t); return [y[1], -Math.sin(y[0]) / l - (2 * Ld(t) / l) * y[1]]; };
          const R = rk4rec(f, [amp, 0], Ttot, Math.round(Ttot / dt), every);
          const J0 = Jof(1, amp, 0), rec = R.y.map((y, k) => { const t = R.t[k], l = L(t); return { l, th: y[0], E: 0.5 * l * l * y[1] * y[1] + l * (1 - Math.cos(y[0])), w: Math.sqrt(1 / l), J: Jof(l, y[0], y[1]) }; });
          const after = rec.filter((_, k) => R.t[k] > Tw); const Jf = after.reduce((s, r) => s + r.J, 0) / after.length;
          return { R, rec, Tw, Ttot, J0, Jf, dJ: Math.abs(Jf / J0 - 1), E0: rec[0].E };
        };
        const cache = memo(), cacheS = memo(); let cur = null;
        const run = () => cache([lS.value, TS.value, aS.value, shape.value].join('|'), () => simulate(lS.value, TS.value, aS.value * DEG, shape.value, 4, 0.01));
        const sweep = () => cacheS([lS.value, aS.value].join('|'), () => {
          const Ts = []; for (let k = 0; k <= 13; k++) Ts.push(0.25 * Math.pow(160, k / 13));
          return ['smooth', 'lin'].map((sh) => Ts.map((T) => [T, Math.max(1e-9, simulate(lS.value, T, aS.value * DEG, sh, 50, 0.02).dJ)]));
        });
        v.animate((tt) => {
          const B = run(), tau = Math.min(B.Ttot, (tt / 10) * B.Ttot), i = idxAt(B.R, tau), r = B.rec[i];
          // pendulum on a reeled string
          sR.line(-1, 0.06, 1, 0.06, { color: 'muted', width: 2 });
          sR.circle(0, 0, 0.04, { color: 'ink', width: 1.5 });
          sR.line(0, 0, 0, 0.2, { color: 'ink', width: 1.4, dash: [3, 2] });
          sR.arrow(0.12, 0.18, 0.12, B.rec[Math.min(B.rec.length - 1, i + 5)].l < r.l ? 0.24 : 0.12, { color: 'orange', width: 1.4, head: 6 });
          sR.line(0, 0, 0, -1.4, { color: 'faint', dash: [2, 4], width: 1 });
          drawPendulum(sR, r.th, r.l * 0.95 / Math.max(1, lS.value), { color: 'gold', r: 0.07 });
          sR.corner(`l = ${v.fix(r.l, 2)} l₀`, 'tl', { color: 'ink' });
          // time series
          const P0 = TAU; sT.setView([0, B.Ttot / P0], [0, Math.max(2.2, 1.15 * Math.max(...B.rec.map((z) => Math.max(z.E / B.E0, z.w))))]);
          sT.vband(0, B.Tw / P0, { color: 'orange', alpha: 0.07 });
          sT.hline(1, { color: 'faint', width: 1 });
          const ts = B.R.t.map((t) => t / P0);
          series(sT, ts, B.rec.map((z) => z.E / B.E0), i, { color: 'red', width: 1.2, alpha: 0.85 });
          series(sT, ts, B.rec.map((z) => z.w), i, { color: 'blue', width: 2 });
          series(sT, ts, B.rec.map((z) => z.J / B.J0), i, { color: 'green', width: 2.8 });
          sT.vline(tau / P0, { color: 'gold' });
          // sweep
          const S = sweep();
          sW.path(S[0], { color: 'green', width: 2.2 }); sW.dots(S[0], { r: 3, color: 'green' });
          sW.path(S[1], { color: 'purple', width: 2.2 }); sW.dots(S[1], { r: 3, color: 'purple' });
          sW.fn((T) => S[1][4][1] * S[1][4][0] / T, { color: 'purple', width: 1, dash: [4, 4], alpha: 0.7 });
          sW.dot(TS.value, Math.max(1e-9, B.dJ), { r: 7, color: shape.value === 'lin' ? 'purple' : 'green', hollow: true });
          cur = { B, r };
        }, { period: 11, still: 10.5 });
        v.legend([['red', '$E/E_0$ (oscillates within each swing)'], ['blue', '$\\omega/\\omega_0$'], ['green', '$J/J_0$ / smooth ramp'], ['purple', 'ramp with corners'], ['purple', '$\\propto 1/T$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { B } = cur, l = lS.value, last = B.rec[B.rec.length - 1];
          return String.raw`after the ramp: $\omega/\omega_0 = ${v.fix(1 / Math.sqrt(l), 4)}$, mean $E/E_0 = ${v.fix(B.rec.slice(-200).reduce((s, z) => s + z.E, 0) / 200 / B.E0, 3)}$ · action $J/J_0 = ${v.fix(B.Jf / B.J0, 6)}$ (change $${sci(v, B.dJ)}$) · small-amplitude prediction $E \propto \omega$ gives $E/E_0 = ${v.fix(1 / Math.sqrt(l), 4)}$ and amplitude $\propto l^{-3/4}$: ${v.fix(aS.value * l ** -0.75, 1)}°`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.20
    {
      num: '12.20',
      kind: 'Phenomenon',
      name: 'Magnetic mirror',
      statement: String.raw`A charged particle in a strong, slowly varying magnetic field gyrates about a field line. The action of the gyration is proportional to the **magnetic moment** $\mu = mv_\perp^2/2B$, which is therefore an adiabatic invariant (12.19) as long as the field changes little over one gyroradius and one gyration. The field does no work, so the speed $v$ is constant, and as the particle moves into a stronger field $v_\perp^2 = 2\mu B/m$ grows at the expense of $v_\parallel$. It is reflected where $B = B_0/\sin^2\alpha_0$, with $\alpha_0$ its pitch angle where the field is $B_0$. In a **magnetic bottle** with minimum field $B_0$ and maximum $B_{\max}$, particles are trapped unless their pitch angle lies in the **loss cone** $\sin^2\alpha_0 < B_0/B_{\max} = 1/R_m$. The Van Allen belts are such a bottle, made by the Earth’s dipole field.`,
      scope: String.raw`Holds when the gyroradius is small compared with the length over which $B$ changes. For larger gyroradii, $\mu$ is no longer conserved, the pitch angle jumps at each bounce, and particles can escape from outside the loss cone. Collisions, which scatter pitch angles, slowly feed particles into the loss cone.`,
      idea: String.raw`In the frame moving with the guiding centre, the gyration is a harmonic oscillator of frequency $\omega_c = qB/m$, whose action is $J = E_\perp/\omega_c = mv_\perp^2/2\omega_c \propto \mu$. Along its path the particle sees $B$ change slowly, so $J$ is an adiabatic invariant. Energy conservation, $v_\parallel^2 + v_\perp^2 = v^2$, then gives $v_\parallel^2 = v^2(1 - B\sin^2\alpha_0/B_0)$, which vanishes at the mirror point. In force language, $-\mu\,\partial B/\partial z$ is the axial component of $q\mathbf v\times\mathbf B$ for a ring current in a converging field (1.18).`,
      caption: String.raw`A proton-like particle ($q/m = 1$) in a magnetic bottle: a curl- and divergence-free field, strongest at the coils (left; the trajectory is integrated with the Boris pusher, which conserves speed exactly). Middle: its velocity on the circle $v_\parallel^2 + v_\perp^2 = v^2$; drag the handle to choose the pitch angle. The red wedges are the loss cone: start inside and the particle escapes through a coil; start outside and it bounces where the readout predicts. Right: $z(t)$ with the predicted mirror points, and $\mu(t)/\mu_0$. Raise the speed so that the gyroradius grows and $\mu$ stops being conserved.`,
      deps: ['mech-12.19', 'mech-1.18'],
      refs: ['Tong §4.6'],
      tags: ['magnetic mirror', 'adiabatic invariant', 'plasma'],
      credit: 'Fermi, 1949 (cosmic-ray mirrors); Budker and Post, 1950s',
      viz(v) {
        const RmS = v.slider('mirror ratio $R_m = B_{\\max}/B_0$', 1.5, 8, 4, { step: 0.1, onChange: () => v.restart() });
        const vS = v.slider('speed (sets the gyroradius)', 0.05, 1.2, 0.18, { step: 0.01, onChange: () => v.restart() });
        const Z = 3;
        const S3 = v.stage({ x: [-1.8, 1.8], y: [-1.1, 1.1], equal: true, axes: false, height: 290, weight: 1.35, title: 'trajectory in the bottle (drag to rotate)' });
        const sc = v.scene3(S3, { yaw: -0.25, pitch: 0.3, axes: false, hint: false });
        const sV = v.stage({ x: [-1.15, 1.15], y: [-0.1, 1.15], equal: true, axes: 'box', gutter: true, height: 290, weight: 1, xlabel: 'v∥ / v', ylabel: 'v⊥ / v', title: 'velocity space' });
        const sZ = v.stage({ x: [0, 1], y: [-3.2, 3.2], axes: 'box', gutter: true, height: 180, full: true, xlabel: 't (gyroperiods at the centre)', title: '$z(t)$ (blue) with predicted mirror points, and $\\mu/\\mu_0$ (green, right scale: 0.8 to 1.2)' });
        const ha = sV.handle(Math.cos(55 * DEG), Math.sin(55 * DEG), { color: 'gold', r: 7, constrain: (x, y) => { const a = clamp(Math.atan2(Math.max(0.02, y), x), 0.02, Math.PI - 0.02); return [Math.cos(a), Math.sin(a)]; } });
        ha.onDrag = () => v.restart();
        const field = (L, x, y, z) => [-x * z / (L * L), -y * z / (L * L), 1 + (z * z - 0.5 * (x * x + y * y)) / (L * L)];
        const cache = memo(); let cur = null;
        const run = () => cache([RmS.value, vS.value, ha.x, ha.y].join('|'), () => {
          const Rm = RmS.value, L = Z / Math.sqrt(Rm - 1), sp = vS.value, al = Math.atan2(ha.y, ha.x), vpar = sp * Math.cos(al), vper = sp * Math.sin(al);
          let x = [vper, 0, 0], u = [0, -vper, vpar]; const dt = 0.04, out = { t: [0], x: [x.slice()], u: [u.slice()] };
          const Bm = (p) => Math.hypot(...field(L, ...p));
          let escaped = false;
          for (let k = 1; k <= 15000; k++) {
            const B = field(L, ...x), tv = B.map((b) => 0.5 * dt * b), t2 = tv[0] ** 2 + tv[1] ** 2 + tv[2] ** 2, sv = tv.map((c) => (2 * c) / (1 + t2));
            const up = [u[0] + (u[1] * tv[2] - u[2] * tv[1]), u[1] + (u[2] * tv[0] - u[0] * tv[2]), u[2] + (u[0] * tv[1] - u[1] * tv[0])];
            u = [u[0] + (up[1] * sv[2] - up[2] * sv[1]), u[1] + (up[2] * sv[0] - up[0] * sv[2]), u[2] + (up[0] * sv[1] - up[1] * sv[0])];
            x = [x[0] + dt * u[0], x[1] + dt * u[1], x[2] + dt * u[2]];
            if (k % 3 === 0) { out.t.push(k * dt); out.x.push(x.slice()); out.u.push(u.slice()); }
            if (Math.abs(x[2]) > Z) { escaped = true; out.t.push(k * dt); out.x.push(x.slice()); out.u.push(u.slice()); break; }
          }
          const mu = out.x.map((p, k) => { const B = field(L, ...p), b = Math.hypot(...B), w = out.u[k], par = (w[0] * B[0] + w[1] * B[1] + w[2] * B[2]) / b, per2 = w[0] ** 2 + w[1] ** 2 + w[2] ** 2 - par * par; return { mu: per2 / (2 * b), par: par / sp, per: Math.sqrt(Math.max(0, per2)) / sp }; });
          const zs = out.x.map((p) => p[2]);
          let zmax = 0; for (const z of zs) zmax = Math.max(zmax, Math.abs(z));
          let mlo = Infinity, mhi = -Infinity; for (const m of mu) { mlo = Math.min(mlo, m.mu / mu[0].mu); mhi = Math.max(mhi, m.mu / mu[0].mu); }
          const sa = Math.sin(al), zm = sa * sa * Rm > 1 ? L * Math.abs(Math.cos(al)) / sa : NaN;
          const ac = Math.asin(1 / Math.sqrt(Rm));
          return { out, mu, zs, zmax, mlo, mhi, zm, escaped, ac, al, L, Rm, rho: vper, sp, T: out.t[out.t.length - 1] };
        });
        const lines = memo();
        v.animate((tt) => {
          const B = run(), S = 0.5, P = (p) => [p[2] * S, p[0] * S, p[1] * S];
          const tau = Math.min(B.T, 60 * tt), i = Math.min(B.out.t.length - 1, Math.round((tau / Math.max(1e-9, B.T)) * (B.out.t.length - 1)));
          const FL = lines(B.L, () => { const out = []; for (const r0 of [0.35, 0.7]) for (let k = 0; k < 6; k++) { const a = (TAU * k) / 6; let p = [r0 * Math.cos(a), r0 * Math.sin(a), 0]; const fw = [p.slice()], bw = [p.slice()]; for (const [arr, dir] of [[fw, 1], [bw, -1]]) { let q = p.slice(); for (let j = 0; j < 160; j++) { const f = field(B.L, ...q), n = Math.hypot(...f); q = q.map((c, m) => c + (dir * 0.02 * f[m]) / n); arr.push(q.slice()); if (Math.abs(q[2]) > Z) break; } } out.push(bw.reverse().concat(fw)); } return out; });
          sc.begin();
          for (const l of FL) sc.path(l.map(P), { color: 'teal', width: 1, alpha: 0.45 });
          for (const zc of [-Z, Z]) sc.path(Array.from({ length: 49 }, (_, k) => P([1.05 * Math.cos((TAU * k) / 48), 1.05 * Math.sin((TAU * k) / 48), zc])), { color: 'orange', width: 3, alpha: 0.85 });
          sc.path(B.out.x.slice(Math.max(0, i - 3000), i + 1).map(P), { color: 'accent', width: 1.1, alpha: 0.85 });
          sc.dot(P(B.out.x[i]), { r: 5, color: 'gold' });
          sc.flush();
          // velocity space
          const c = Math.cos(B.ac), s = Math.sin(B.ac);
          sV.poly([[0, 0], [1.12 * c, 1.12 * s], [1.12, 0]], { fill: 'red', fillAlpha: 0.15, stroke: false });
          sV.poly([[0, 0], [-1.12 * c, 1.12 * s], [-1.12, 0]], { fill: 'red', fillAlpha: 0.15, stroke: false });
          sV.line(0, 0, 1.12 * c, 1.12 * s, { color: 'red', width: 1.2 }); sV.line(0, 0, -1.12 * c, 1.12 * s, { color: 'red', width: 1.2 });
          sV.curve((a) => [Math.cos(a), Math.sin(a)], 0, Math.PI, { color: 'muted', width: 1.2, dash: [4, 4] });
          sV.text('loss cone', 0.98, 0.12, { color: 'red', size: 11, align: 'right' });
          series(sV, B.mu.map((m) => m.par), B.mu.map((m) => m.per), i, { color: 'accent', width: 1.6, alpha: 0.7 });
          sV.dot(B.mu[i].par, B.mu[i].per, { r: 4.5, color: 'accent' });
          // z(t) and mu
          const Tg = TAU; sZ.setView([0, B.T / Tg], [-3.2, 3.2]);
          for (const zc of [-Z, Z]) sZ.hline(zc, { color: 'orange', width: 1.4 });
          if (isFinite(B.zm)) for (const zz of [-B.zm, B.zm]) sZ.hline(zz, { color: 'blue', width: 1, dash: [5, 4], alpha: 0.8 });
          series(sZ, B.out.t.map((t) => t / Tg), B.zs, i, { color: 'blue', width: 1.8 });
          series(sZ, B.out.t.map((t) => t / Tg), B.mu.map((m) => ((m.mu / B.mu[0].mu - 1) / 0.2) * 3.2), i, { color: 'green', width: 1.4 });
          sZ.vline(tau / Tg, { color: 'gold' });
          cur = B;
        }, { period: 16, still: 12 });
        v.legend([['accent', 'trajectory / velocity'], ['teal', 'field lines'], ['orange', 'coils (field $B_{\\max}$)'], ['red', 'loss cone', { area: true }], ['blue', 'predicted mirror points', { dash: true }], ['green', '$\\mu/\\mu_0$']]);
        v.readout(() => {
          if (!cur) return '';
          const B = cur, d = (x) => v.fix(x / DEG, 1);
          const fate = B.escaped ? `**escaped** through a coil after ${v.fix(B.T / TAU, 1)} gyroperiods` : `trapped: bounced up to $|z| = ${v.fix(B.zmax, 3)}$` + (isFinite(B.zm) ? String.raw`, predicted mirror point $L\cot\alpha_0 = ${v.fix(B.zm, 3)}$` : '');
          return String.raw`pitch angle $\alpha_0 = ${d(B.al)}°$, loss-cone half-angle $\arcsin(1/\sqrt{R_m}) = ${d(B.ac)}°$ · ` + fate + String.raw` · $\mu/\mu_0$ stayed within ${v.fix(B.mlo, 4)}–${v.fix(B.mhi, 4)} · gyroradius/field length $= ${v.fix(B.rho / B.L, 3)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.21
    {
      num: '12.21',
      kind: 'Method',
      name: 'Canonical perturbation theory',
      statement: String.raw`Let $H = H_0(J) + \varepsilon H_1(\theta, J)$, with $H_0$ written in the action–angle variables of an integrable system (12.17). To first order in $\varepsilon$, a canonical transformation removes the angle dependence and the new Hamiltonian is the **average** of the perturbation over the unperturbed torus,
$$K(J) = H_0(J) + \varepsilon\,\langle H_1\rangle(J) + O(\varepsilon^2), \qquad \langle H_1\rangle = \frac1{2\pi}\oint H_1\,d\theta ,$$
so the frequencies shift by $\omega(J) = \omega_0(J) + \varepsilon\,\partial\langle H_1\rangle/\partial J$. Higher orders follow by repeating the procedure (Lie series, Birkhoff normal form). For the quartic oscillator $H = \tfrac12(p^2 + q^2) + \tfrac14\varepsilon q^4$,
$$K = J + \tfrac38\varepsilon J^2 - \tfrac{17}{64}\varepsilon^2J^3 + O(\varepsilon^3),\qquad \omega = 1 + \tfrac34\varepsilon J - \tfrac{51}{64}\varepsilon^2J^2 + \dots$$
The series is asymptotic at best. It fails near separatrices and resonances, where small denominators $k\cdot\omega$ appear.`,
      idea: String.raw`Look for a generating function $F_2 = \theta J' + \varepsilon S_1(\theta, J')$ (12.11) that makes the new Hamiltonian independent of the angle. To first order this requires $\omega_0\,\partial S_1/\partial\theta = \langle H_1\rangle - H_1$, which can be solved for a periodic $S_1$ exactly because the right side has zero average; the remaining part, $\langle H_1\rangle$, is the first-order energy. For the quartic term, $q = \sqrt{2J}\sin\theta$ gives $\langle q^4\rangle = 4J^2\cdot\tfrac38$. The second-order term comes from $\tfrac12\langle\{H_1, S_1\}\rangle$, here $-\tfrac{17}{64}J^3$. In more degrees of freedom, solving for $S_1$ divides by $k\cdot\omega_0$, which is where resonances destroy the method.`,
      caption: String.raw`Left: the orbit of action $J$ of the perturbed oscillator (blue) and the unperturbed circle with the same action (dashed). Middle: the frequency against the strength $\varepsilon$ at fixed $J$, exact (by quadrature, blue), simulated (dots, from integrating the motion) and the first- and second-order predictions. Right: the errors of the two approximations on log–log axes. Their slopes, 2 and 3, show the orders. For negative $\varepsilon$ the potential has a maximum, and as $\varepsilon J$ approaches the separatrix the exact frequency plunges to zero while the series has no idea.`,
      deps: ['mech-12.17'],
      refs: ['Goldstein §12.4'],
      tags: ['perturbation theory', 'frequency shift', 'anharmonic oscillator'],
      credit: 'Delaunay, 1860s; Poincaré, 1892; Birkhoff, 1927',
      viz(v) {
        const eS = v.slider('perturbation $\\varepsilon$', -0.45, 1.5, 0.5, { step: 0.005 });
        const jS = v.slider('action $J$', 0.1, 1.2, 0.5, { step: 0.01 });
        const sP = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: 'box', gutter: true, height: 300, weight: 0.95, xlabel: 'q', ylabel: 'p', title: 'orbit of action $J$' });
        const sW = v.stage({ x: [-0.45, 1.5], y: [0, 1.6], axes: 'box', gutter: true, height: 300, weight: 1.15, xlabel: 'ε', title: 'frequency $\\omega$ at fixed $J$' });
        const sL = v.stage({ x: [1e-3, 1.5], y: [1e-9, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'ε', title: 'error of each order' });
        // exact ω(ε, J): amplitude A from J by bisection on the action quadrature, then the period quadrature
        const actA = (eps, A) => (2 / Math.PI) * chiInt((c) => { const s = Math.sin(c / 2); const q = A * s; const dV = ((A * A - q * q) / 2) * (1 + (eps * (A * A + q * q)) / 2); return Math.sqrt(Math.max(0, 2 * dV)) * A * Math.cos(c / 2) * 0.5; }, 200);
        const Amax = (eps) => (eps < 0 ? Math.sqrt(-1 / eps) : 50);
        const exact = (eps, J) => {
          const am = Amax(eps); if (actA(eps, am * 0.99999) < J) return { w: NaN, A: NaN };
          let lo = 0, hi = am * 0.99999; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (actA(eps, m) < J) lo = m; else hi = m; }
          const A = (lo + hi) / 2, T = 4 * chiInt((c) => 0.5 / Math.sqrt(Math.max(1e-300, 1 + (eps * A * A * (1 + Math.sin(c / 2) ** 2)) / 2)), 300);
          return { w: TAU / T, A };
        };
        const w1 = (e, J) => 1 + 0.75 * e * J, w2 = (e, J) => 1 + 0.75 * e * J - (51 / 64) * e * e * J * J;
        const simW = (eps, A) => { let q = A, p = 0; const h = 0.005, ts = [], qs = []; for (let k = 0; k < 40000; k++) { p -= 0.5 * h * (q + eps * q ** 3); q += h * p; p -= 0.5 * h * (q + eps * q ** 3); if (k % 2 === 0) { ts.push(k * h); qs.push(q); } } const c = upCrossings(ts, qs); return c.length > 2 ? TAU / ((c[c.length - 1] - c[0]) / (c.length - 1)) : NaN; };
        const cache = memo(), cacheL = memo(); let cur = null;
        const curve = () => cache(jS.value, () => {
          const J = jS.value, pts = [], sims = [];
          for (let k = 0; k <= 160; k++) { const e = -0.45 + (1.95 * k) / 160, r = exact(e, J); pts.push([e, r.w]); }
          for (let k = 0; k <= 8; k++) { const e = -0.4 + (1.85 * k) / 8, r = exact(e, J); if (isFinite(r.A)) sims.push([e, simW(e, r.A)]); }
          return { pts, sims };
        });
        const errs = () => cacheL(jS.value, () => {
          const J = jS.value, a = [], b = [];
          for (let k = 0; k <= 30; k++) { const e = 1e-3 * Math.pow(1500, k / 30), w = exact(e, J).w; a.push([e, Math.abs(w - w1(e, J))]); b.push([e, Math.max(1e-16, Math.abs(w - w2(e, J)))]); }
          const slope = (arr) => { const p = arr.slice(2, 10).filter((z) => z[1] > 1e-14); const r = v.M.linreg(p.map((z) => Math.log(z[0])), p.map((z) => Math.log(z[1]))); return r.slope; };
          return { a, b, s1: slope(a), s2: slope(b) };
        });
        v.render(() => {
          const e = eS.value, J = jS.value, X = exact(e, J), C = curve(), Er = errs();
          // orbit
          const E = (q, p) => 0.5 * (p * p + q * q) + 0.25 * e * q ** 4;
          sP.circle(0, 0, Math.sqrt(2 * J), { color: 'muted', width: 1.4, dash: [5, 4] });
          if (e < 0) { const qs = Math.sqrt(-1 / e); sP.contour(E, [-1 / (4 * e)], { color: 'red', width: 1.2, alpha: 0.7, res: 140 }); sP.dot(qs, 0, { r: 4, color: 'red', hollow: true }); sP.dot(-qs, 0, { r: 4, color: 'red', hollow: true }); }
          if (isFinite(X.A)) sP.contour(E, [E(X.A, 0)], { color: 'blue', width: 2.6, res: 160 });
          // ω against ε
          let lo = Infinity, hi = -Infinity; for (const z of C.pts) if (isFinite(z[1])) { lo = Math.min(lo, z[1]); hi = Math.max(hi, z[1]); }
          sW.setView([-0.45, 1.5], [Math.max(0, Math.min(lo, w2(1.5, J), w1(-0.45, J)) - 0.1), Math.max(hi, w1(1.5, J)) + 0.1]);
          sW.fn((x) => w1(x, J), { color: 'orange', width: 1.6, dash: [6, 4] });
          sW.fn((x) => w2(x, J), { color: 'purple', width: 1.6, dash: [3, 3] });
          sW.path(C.pts.map((z) => (isFinite(z[1]) ? z : null)), { color: 'blue', width: 2.6 });
          sW.dots(C.sims, { r: 4, color: 'gold' });
          sW.vline(e, { color: 'gold', width: 1 });
          if (isFinite(X.w)) sW.dot(e, X.w, { r: 6, color: 'blue' });
          // errors
          sL.path(Er.a, { color: 'orange', width: 2.2 }); sL.path(Er.b, { color: 'purple', width: 2.2 });
          if (e > 1e-3) sL.vline(e, { color: 'gold', width: 1 });
          cur = { e, J, X, Er };
        });
        v.legend([['blue', 'exact'], ['gold', 'simulated', { dot: true }], ['orange', 'first order $1 + \\tfrac34\\varepsilon J$', { dash: true }], ['purple', 'second order $-\\tfrac{51}{64}\\varepsilon^2J^2$', { dash: true }], ['muted', 'unperturbed circle', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { e, J, X, Er } = cur;
          const head = isFinite(X.w) ? String.raw`$\omega$: exact ${v.fix(X.w, 5)}, first order ${v.fix(w1(e, J), 5)}, second order ${v.fix(w2(e, J), 5)}` : String.raw`**no bounded orbit** with this action: $J$ exceeds the area inside the separatrix (the series still predicts ${v.fix(w2(e, J), 3)})`;
          return head + String.raw` · fitted error slopes at small $\varepsilon$: ${v.fix(Er.s1, 2)} and ${v.fix(Er.s2, 2)} (orders 2 and 3)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.22
    {
      num: '12.22',
      kind: 'Method',
      name: 'Routh’s procedure: the Routhian',
      statement: String.raw`Let $L(q, \dot q, \dot\varphi)$ have a cyclic coordinate $\varphi$, so that $p_\varphi = \partial L/\partial\dot\varphi$ is conserved (7.1). The **Routhian** is the Legendre transform in $\dot\varphi$ alone,
$$R(q, \dot q; p_\varphi) = L - p_\varphi\dot\varphi\Big|_{\dot\varphi = \dot\varphi(q, \dot q, p_\varphi)} .$$
It is a Hamiltonian for $\varphi$ (with $\dot\varphi = -\partial R/\partial p_\varphi$) and a Lagrangian for the remaining coordinates: with $p_\varphi$ fixed at its value, $q(t)$ satisfies $\frac{d}{dt}\partial R/\partial\dot q = \partial R/\partial q$. For $L = \tfrac12a(q)\dot q^2 + \tfrac12b(q)\dot\varphi^2 - U(q)$ it gives $R = \tfrac12a\dot q^2 - U_{\rm eff}$ with $U_{\rm eff} = U + p_\varphi^2/2b(q)$. Steady motions ($q$ constant, $\varphi$ turning uniformly) sit at the critical points of $U_{\rm eff}$; they are stable at minima, with small-oscillation frequency $\sqrt{U_{\rm eff}''/a}$, and unstable at maxima.`,
      idea: String.raw`Differentiate $R = L - p_\varphi\dot\varphi$ with $\dot\varphi$ treated as a function of $(q, \dot q, p_\varphi)$. The terms in $\partial\dot\varphi$ cancel, because $\partial L/\partial\dot\varphi = p_\varphi$, which is the same cancellation as in deriving Hamilton’s equations (12.3), done for one coordinate only. So $\partial R/\partial q = \partial L/\partial q$ and $\partial R/\partial\dot q = \partial L/\partial\dot q$ at fixed $p_\varphi$, and Lagrange’s equations for $q$ carry over unchanged. Note the sign: the centrifugal term enters $R$ as $-p_\varphi^2/2b$, so it acts as a potential barrier. Naively substituting $\dot\varphi$ into $L$ would give it the wrong sign (compare 7.12).`,
      caption: String.raw`Choose a spherical pendulum or a bead sliding in a Gaussian dimple, and its conserved angular momentum $p_\varphi$. Middle: the effective potential from the Routhian; its minimum (green) and, for the dimple, its maximum (red) are the steady circular motions. Pick one and give it a small radial kick. Left: the full two-degree-of-freedom motion, integrated from the complete Lagrangian. Right: the coordinate $q(t)$ from that full simulation (solid) and from the one-degree-of-freedom Routhian alone (dashed). They agree, and the readout compares the small-oscillation frequency predicted by $U_{\rm eff}''$ with the measured one. Around the maximum the kick grows instead.`,
      deps: ['mech-12.2', 'mech-7.12'],
      refs: ['Goldstein §8.3'],
      tags: ['Routhian', 'cyclic coordinate', 'stability'],
      credit: 'Routh, 1877',
      viz(v) {
        const SYS = {
          sph: { lab: 'spherical pendulum', a: () => 1, da: () => 0, b: (q) => Math.sin(q) ** 2, db: (q) => 2 * Math.sin(q) * Math.cos(q), U: (q) => -Math.cos(q), dU: (q) => Math.sin(q), range: [0.05, Math.PI - 0.05], qlab: 'θ', pr: [0.15, 1.5], p0: 0.6 },
          dim: { lab: 'Gaussian dimple', a: (r) => 1 + (2 * r * Math.exp(-r * r)) ** 2, da: (r) => { const h = 2 * r * Math.exp(-r * r), dh = 2 * Math.exp(-r * r) * (1 - 2 * r * r); return 2 * h * dh; }, b: (r) => r * r, db: (r) => 2 * r, U: (r) => -Math.exp(-r * r), dU: (r) => 2 * r * Math.exp(-r * r), range: [0.08, 3.6], qlab: 'r', pr: [0.2, 1.0], p0: 0.7 },
        };
        const sysS = v.select('system', [{ value: 'sph', label: 'spherical pendulum' }, { value: 'dim', label: 'bead in a Gaussian dimple' }], 'dim', { onChange: (k) => { pS.set(SYS[k].p0); } });
        const pS = v.slider('angular momentum $p_\\varphi$', 0.15, 1.5, 0.7, { step: 0.005 });
        const which = v.select('start on', [{ value: 'min', label: 'stable circle (minimum)' }, { value: 'max', label: 'unstable circle (maximum)' }], 'min');
        const kS = v.slider('radial kick $\\dot q(0)$', 0, 0.3, 0.05, { step: 0.005 });
        const S3 = v.stage({ x: [-1.6, 1.6], y: [-1.25, 1.25], equal: true, axes: false, height: 300, weight: 1, title: 'full motion (drag to rotate)' });
        const sc = v.scene3(S3, { yaw: -0.6, pitch: 0.45, axes: false, hint: false });
        const sU = v.stage({ x: [0, 3.6], y: [-1, 1], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'q', title: '$U_{\\rm eff}(q) = U + p_\\varphi^2/2b(q)$' });
        const sT = v.stage({ x: [0, 40], y: [0, 3], axes: 'box', gutter: true, height: 300, weight: 1.1, xlabel: 't', title: '$q(t)$: full (solid) and Routhian (dashed)' });
        const cache = memo(); let cur = null;
        const run = () => cache([sysS.value, pS.value, which.value, kS.value].join('|'), () => {
          const S = SYS[sysS.value], p = pS.value, Ue = (q) => S.U(q) + (p * p) / (2 * S.b(q)), dUe = (q) => S.dU(q) - (p * p * S.db(q)) / (2 * S.b(q) ** 2);
          // critical points of U_eff on a grid, refined by bisection
          const crit = []; const n = 800; let prev = dUe(S.range[0]);
          for (let k = 1; k <= n; k++) { const q = S.range[0] + ((S.range[1] - S.range[0]) * k) / n, d = dUe(q); if ((d > 0) !== (prev > 0)) { let lo = q - (S.range[1] - S.range[0]) / n, hi = q; for (let j = 0; j < 60; j++) { const m = (lo + hi) / 2; if ((dUe(m) > 0) === (dUe(lo) > 0)) lo = m; else hi = m; } const qc = (lo + hi) / 2; crit.push({ q: qc, kind: prev < 0 ? 'min' : 'max' }); } prev = d; }
          const start = crit.find((c) => c.kind === which.value) || crit.find((c) => c.kind === 'min');
          const q0 = start ? start.q : 1, qd0 = kS.value;
          const TT = 40, dt = 0.005;
          // full Lagrangian in (q, φ): a q̈ + ½ a' q̇² − ½ b' φ̇² + U' = 0,  d/dt(b φ̇) = 0 written as φ̈ = −b' q̇ φ̇ / b
          const ff = (t, y) => { const [q, qd, , fd] = y; return [qd, (-0.5 * S.da(q) * qd * qd + 0.5 * S.db(q) * fd * fd - S.dU(q)) / S.a(q), fd, (-S.db(q) * qd * fd) / S.b(q)]; };
          const stop = (t, y) => y[0] < S.range[0] || y[0] > S.range[1];
          const F = rk4rec(ff, [q0, qd0, 0, p / S.b(q0)], TT, Math.round(TT / dt), 8, stop);
          // Routhian: a q̈ = −½ a' q̇² − U_eff'
          const fr = (t, y) => [y[1], (-0.5 * S.da(y[0]) * y[1] * y[1] - dUe(y[0])) / S.a(y[0])];
          const Rr = rk4rec(fr, [q0, qd0], TT, Math.round(TT / dt), 8, stop);
          const h = 1e-4, Upp = start ? (Ue(start.q + h) - 2 * Ue(start.q) + Ue(start.q - h)) / (h * h) : NaN, wpred = Upp > 0 ? Math.sqrt(Upp / S.a(q0)) : NaN;
          const c = upCrossings(F.t, F.y.map((y) => y[0] - q0)); const wmeas = c.length > 1 ? TAU / ((c[c.length - 1] - c[0]) / (c.length - 1)) : NaN;
          let dp = 0, dq = 0; F.y.forEach((y, k) => { dp = Math.max(dp, Math.abs(S.b(y[0]) * y[3] - p)); if (Rr.y[k]) dq = Math.max(dq, Math.abs(Rr.y[k][0] - y[0])); });
          const E0 = 0.5 * S.a(q0) * qd0 * qd0 + Ue(q0);
          return { S, p, Ue, crit, start, F, Rr, wpred, wmeas, dp, dq, E0, Upp };
        });
        v.animate((tt) => {
          const B = run(), S = B.S, tau = Math.min(B.F.t[B.F.t.length - 1], 2 * tt), i = idxAt(B.F, tau), dim = sysS.value === 'dim';
          const P3 = dim ? (q, f) => [0.45 * q * Math.cos(f), 0.45 * q * Math.sin(f), 0.9 * -Math.exp(-q * q) + 0.35] : (q, f) => [Math.sin(q) * Math.cos(f), Math.sin(q) * Math.sin(f), -Math.cos(q)];
          sc.begin();
          if (dim) { for (let k = 1; k <= 7; k++) { const r = (3.4 * k) / 7; sc.path(Array.from({ length: 49 }, (_, j) => P3(r, (TAU * j) / 48)), { color: 'faint', width: 0.8, alpha: 0.6 }); } for (let k = 0; k < 12; k++) sc.path(Array.from({ length: 30 }, (_, j) => P3((3.4 * j) / 29, (TAU * k) / 12)), { color: 'faint', width: 0.8, alpha: 0.6 }); }
          else { for (let k = 1; k < 8; k++) sc.path(Array.from({ length: 49 }, (_, j) => P3((Math.PI * k) / 8, (TAU * j) / 48)), { color: 'faint', width: 0.8, alpha: 0.5 }); for (let k = 0; k < 12; k++) sc.path(Array.from({ length: 30 }, (_, j) => P3((Math.PI * j) / 29, (TAU * k) / 12)), { color: 'faint', width: 0.8, alpha: 0.5 }); sc.dot([0, 0, 0], { r: 3, color: 'ink' }); }
          sc.path(B.F.y.slice(0, i + 1).map((y) => P3(y[0], y[2])), { color: 'accent', width: 1.5 });
          const y = B.F.y[i];
          if (!dim) sc.line([0, 0, 0], P3(y[0], y[2]), { color: 'ink', width: 1.6 });
          sc.dot(P3(y[0], y[2]), { r: 6, color: 'gold' });
          sc.flush();
          // effective potential
          const [q0, q1] = dim ? [0.15, 3.6] : [0.1, Math.PI - 0.1];
          let lo = Infinity; for (let k = 0; k <= 200; k++) lo = Math.min(lo, B.Ue(q0 + ((q1 - q0) * k) / 200));
          const top = Math.max(B.E0, ...B.crit.map((c) => B.Ue(c.q))) + 0.35;
          sU.setView([q0, q1], [lo - 0.12, top]); sU.setLabels(S.qlab, undefined);
          sU.fn(B.Ue, { color: 'accent', width: 2.4 });
          sU.hline(B.E0, { color: 'gold', width: 1.4, dash: [6, 4] });
          for (const c of B.crit) sU.dot(c.q, B.Ue(c.q), { r: 6, color: c.kind === 'min' ? 'green' : 'red', hollow: c.kind === 'max' });
          sU.dot(y[0], B.Ue(y[0]), { r: 5, color: 'gold' });
          // q(t)
          const all = B.F.y.map((z) => z[0]); let a = Math.min(...all), b = Math.max(...all); const pad = Math.max(0.05, 0.15 * (b - a));
          sT.setView([0, 40], [a - pad, b + pad]); sT.setLabels(undefined, null);
          series(sT, B.F.t, all, i, { color: 'accent', width: 2.4 });
          series(sT, B.Rr.t, B.Rr.y.map((z) => z[0]), Math.min(i, B.Rr.y.length - 1), { color: 'orange', width: 1.6, dash: [5, 4] });
          if (B.start) sT.hline(B.start.q, { color: B.start.kind === 'min' ? 'green' : 'red', width: 1, alpha: 0.6 });
          sT.vline(tau, { color: 'gold' });
          cur = B;
        }, { period: 21, still: 16 });
        v.legend([['accent', 'full simulation'], ['orange', 'Routhian alone', { dash: true }], ['green', 'stable steady circle', { dot: true }], ['red', 'unstable steady circle', { dot: true }], ['gold', 'energy', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const B = cur, k = B.start ? B.start.kind : null;
          const steady = k ? (k === 'min' ? String.raw`stable circle at $q_0 = ${v.fix(B.start.q, 4)}$: predicted $\sqrt{U''_{\rm eff}/a} = ${v.fix(B.wpred, 4)}$, measured ${isFinite(B.wmeas) ? v.fix(B.wmeas, 4) : '—'}` : String.raw`unstable circle at $q_0 = ${v.fix(B.start.q, 4)}$ ($U''_{\rm eff} = ${v.fix(B.Upp, 3)} < 0$): the kick grows`) : 'no steady circle for this $p_\\varphi$';
          const mx = which.value === 'max' && !B.crit.some((c) => c.kind === 'max') ? ' (no maximum here, so the minimum is used)' : '';
          return steady + mx + String.raw` · $p_\varphi$ in the full simulation constant to $${sci(v, B.dp)}$ · largest gap between full and Routhian $q(t)$: $${sci(v, B.dq)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.23
    {
      num: '12.23',
      kind: 'Theorem',
      name: 'Liouville’s equation for phase-space densities',
      statement: String.raw`A density $\rho(q, p, t)$ of systems in phase space, each moving by Hamilton’s equations, evolves by **Liouville’s equation**
$$\frac{\partial\rho}{\partial t} = \{H, \rho\} = -\sum_i\Big(\frac{\partial\rho}{\partial q_i}\frac{\partial H}{\partial p_i} - \frac{\partial\rho}{\partial p_i}\frac{\partial H}{\partial q_i}\Big),$$
equivalently $d\rho/dt = 0$ along trajectories: the density is carried unchanged by the flow, like an incompressible fluid. Its solution is $\rho(x, t) = \rho_0(\varphi_{-t}(x))$. Every function of conserved quantities, in particular any $\rho = f(H)$ such as the canonical ensemble $e^{-H/kT}$, is a stationary solution. Integrals $\int G(\rho)\,dq\,dp$ (the total probability, the Gibbs entropy $-\int\rho\ln\rho$) are exactly conserved, even though the density develops ever finer filaments.`,
      idea: String.raw`Probability is conserved, so $\rho$ obeys the continuity equation $\partial_t\rho + \nabla\cdot(\rho X_H) = 0$. Since $\nabla\cdot X_H = 0$ (12.13), this becomes $\partial_t\rho + X_H\cdot\nabla\rho = 0$, and $X_H\cdot\nabla\rho = \{\rho, H\}$ (12.7). A function $f(H)$ has $\{H, f(H)\} = f'(H)\{H, H\} = 0$. Numerically, splitting $\{H, \cdot\}$ into its kinetic and potential parts gives two exact shifts, $\rho(q - p\,\delta t, p)$ and $\rho(q, p + U'(q)\,\delta t)$. That is a grid solver of Liouville’s equation, the same splitting as the leapfrog integrator (12.15).`,
      caption: String.raw`Left: a density of pendulum states evolved on a $128\times128$ grid by Liouville’s equation (split-step shifts with cubic interpolation). Right: 4,000 sample states drawn from the initial density and pushed by leapfrog, each coloured by the density it started with, which it keeps forever. The six gold markers ride along the flow, and the readout compares the grid density under them with the value they carry. The total probability is conserved, while $\int\rho^2$ on the grid slowly decays as the filaments get thinner than a grid cell (numerical coarse-graining); the exact equation conserves it. Choose a density that depends on $H$ alone and nothing moves at all.`,
      deps: ['mech-12.13', 'mech-12.7'],
      refs: ['Tong §4.2', 'Goldstein §9.9'],
      tags: ['Liouville equation', 'statistical mechanics', 'phase-space density'],
      credit: 'Gibbs, 1902',
      viz(v) {
        const init = v.select('initial density', [{ value: 'blob', label: 'off-centre blob' }, { value: 'two', label: 'two blobs' }, { value: 'th', label: 'thermal $e^{-H/\\tau}$' }], 'blob', { onChange: () => v.restart() });
        const N = 128, PM = 3.2, dq = TAU / N, dpg = (2 * PM) / N, DT = 0.05, TT = 30, NP = 4000;
        const sG = v.stage({ x: [-Math.PI, Math.PI], y: [-PM, PM], axes: 'box', gutter: true, height: 330, xlabel: 'q', ylabel: 'p', xticks: piTicks(-Math.PI, Math.PI), title: 'grid solution of $\\partial_t\\rho = \\{H, \\rho\\}$' });
        const sS = v.stage({ x: [-Math.PI, Math.PI], y: [-PM, PM], axes: 'box', gutter: true, height: 330, xlabel: 'q', ylabel: 'p', xticks: piTicks(-Math.PI, Math.PI), title: 'sample states, coloured by their carried density' });
        const rho0f = (k) => (q, p) => {
          const g = (q0, p0, s) => { const dqq = wrap(q - q0); return Math.exp(-(dqq * dqq + (p - p0) ** 2) / (2 * s * s)); };
          if (k === 'blob') return g(-1.3, 1.1, 0.42);
          if (k === 'two') return g(-1.6, 0.5, 0.35) + 0.8 * g(1.3, -1.1, 0.3);
          return Math.exp(-(0.5 * p * p - Math.cos(q) + 1) / 0.6);
        };
        const cub = (f, i, t, n, periodic) => { // cubic Lagrange interpolation of f at index i + t (0 ≤ t < 1)
          const at = (j) => (periodic ? f[((j % n) + n) % n] : j < 0 || j >= n ? 0 : f[j]);
          const a = at(i - 1), b = at(i), c = at(i + 1), d = at(i + 2);
          return b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
        };
        const shiftQ = (R, h) => { const row = new Float64Array(N); for (let j = 0; j < N; j++) { const p = -PM + (j + 0.5) * dpg, s = (p * h) / dq; for (let i = 0; i < N; i++) row[i] = R[j * N + i]; for (let i = 0; i < N; i++) { const x = i - s, k = Math.floor(x); R[j * N + i] = cub(row, k, x - k, N, true); } } };
        const shiftP = (R, h) => { const col = new Float64Array(N); for (let i = 0; i < N; i++) { const q = -Math.PI + (i + 0.5) * dq, s = (-Math.sin(q) * h) / dpg; for (let j = 0; j < N; j++) col[j] = R[j * N + i]; for (let j = 0; j < N; j++) { const x = j - s, k = Math.floor(x); R[j * N + i] = Math.max(0, cub(col, k, x - k, N, false)); } } };
        const sample = (R, q, p) => { const x = (wrap(q) + Math.PI) / dq - 0.5, y = (p + PM) / dpg - 0.5, i = Math.floor(x), j = Math.floor(y), u = x - i, w = y - j; const at = (a, b) => (b < 0 || b >= N ? 0 : R[b * N + (((a % N) + N) % N)]); return (1 - u) * (1 - w) * at(i, j) + u * (1 - w) * at(i + 1, j) + (1 - u) * w * at(i, j + 1) + u * w * at(i + 1, j + 1); };
        const sim = v.sim(() => {
          const f = rho0f(init.value), R = new Float64Array(N * N);
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) R[j * N + i] = f(-Math.PI + (i + 0.5) * dq, -PM + (j + 0.5) * dpg);
          let mx = 0; for (const x of R) mx = Math.max(mx, x);
          const r = v.rng(5), q = new Float64Array(NP), p = new Float64Array(NP), c = new Float64Array(NP);
          for (let k = 0; k < NP;) { const qq = r.uniform(-Math.PI, Math.PI), pp = r.uniform(-PM, PM), val = f(qq, pp); if (r() * mx < val) { q[k] = qq; p[k] = pp; c[k] = val / mx; k++; } }
          const mass = (A) => A.reduce((s, x) => s + x, 0) * dq * dpg, sq = (A) => A.reduce((s, x) => s + x * x, 0) * dq * dpg;
          return { R, R0: R.slice(), q, p, c, mx, m0: mass(R), s0: sq(R), mass, sq, n: 0 };
        }, (st, dt) => {
          shiftQ(st.R, dt / 2); shiftP(st.R, dt); shiftQ(st.R, dt / 2);
          for (let k = 0; k < NP; k++) { st.q[k] += 0.5 * dt * st.p[k]; st.p[k] -= dt * Math.sin(st.q[k]); st.q[k] += 0.5 * dt * st.p[k]; }
          st.n++;
        }, { dt: DT });
        let cur = null;
        v.animate((tt) => {
          const st = sim.advance(Math.min(TT, 2.5 * tt)), t = st.n * DT;
          sG.raster((q, p) => v.ramp(Math.min(1, sample(st.R, q, p) / st.mx) ** 0.8, 'purple'), { res: 3 });
          sG.contour((q, p) => 0.5 * p * p - Math.cos(q), [1], { color: 'red', width: 1, alpha: 0.5, res: 120 });
          // samples by colour bands
          const bands = [[0, 0.25, 'teal'], [0.25, 0.5, 'blue'], [0.5, 0.75, 'purple'], [0.75, 1.01, 'pink']];
          for (const [a, b, col] of bands) { const pts = []; for (let k = 0; k < NP; k++) if (st.c[k] >= a && st.c[k] < b) pts.push([wrap(st.q[k]), st.p[k]]); sS.dots(pts, { r: 1.5, color: col, alpha: 0.8 }); }
          sS.contour((q, p) => 0.5 * p * p - Math.cos(q), [1], { color: 'red', width: 1, alpha: 0.5, res: 120 });
          // tracked markers: the first six samples with carried density above one half
          const tr = []; for (let k = 0; k < NP && tr.length < 6; k++) if (st.c[k] > 0.5) tr.push(k);
          const cmp = tr.map((k) => { sG.dot(wrap(st.q[k]), st.p[k], { r: 4.5, color: 'gold' }); sS.dot(wrap(st.q[k]), st.p[k], { r: 4.5, color: 'gold' }); return [st.c[k], sample(st.R, st.q[k], st.p[k]) / st.mx]; });
          sG.corner(`t = ${v.fix(t, 1)}`, 'tr', { color: 'ink', plate: true });
          let dev = 0; if (init.value === 'th') for (let k = 0; k < N * N; k++) dev = Math.max(dev, Math.abs(st.R[k] - st.R0[k]) / st.mx);
          cur = { st, cmp, dev, t };
        }, { period: TT / 2.5 + 1, still: 8 });
        v.legend([['purple', 'grid density', { area: true }], ['pink', 'samples with high carried density', { dot: true }], ['teal', 'low carried density', { dot: true }], ['gold', 'tracked samples', { dot: true }], ['red', 'separatrix']]);
        v.readout(() => {
          if (!cur) return '';
          const { st, cmp, dev } = cur, m = st.mass(st.R) / st.m0, s2 = st.sq(st.R) / st.s0;
          const c = cmp.slice(0, 3).map(([a, b]) => `${v.fix(a, 3)} vs ${v.fix(b, 3)}`).join(', ');
          return String.raw`carried density vs grid density under three tracked samples: ${c} · total probability ×${v.fix(m, 6)} · grid $\int\rho^2$ ×${v.fix(s2, 4)} (exactly 1 for the true solution)` + (init.value === 'th' ? String.raw` · $\rho = f(H)$: largest change on the grid $${sci(v, dev)}$ of the peak` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.24
    {
      num: '12.24',
      kind: 'Method',
      name: 'Separation of variables in the Hamilton–Jacobi equation',
      statement: String.raw`If in some coordinates the time-independent Hamilton–Jacobi equation $H(q, \partial W/\partial q) = E$ splits so that each coordinate appears with its own momentum in a separate equation, then $W = \sum_i W_i(q_i; \alpha)$, each $W_i$ is found by a single quadrature, and the actions $J_i = \frac1{2\pi}\oint p_i\,dq_i$ are computed one coordinate at a time. For the Kepler problem in spherical coordinates,
$$\frac1{2m}\Big[W_r'^2 + \frac1{r^2}\Big(W_\theta'^2 + \frac{W_\varphi'^2}{\sin^2\theta}\Big)\Big] - \frac kr = E$$
separates with constants $W_\varphi' = L_z$ and $W_\theta'^2 + L_z^2/\sin^2\theta = L^2$. The actions are $J_\varphi = L_z$, $J_\theta = L - |L_z|$ and $J_r = k\sqrt{m/2|E|} - L$, so
$$E = -\frac{mk^2}{2(J_r + J_\theta + J_\varphi)^2}.$$
All three frequencies $\partial E/\partial J_i$ are equal: the problem is maximally degenerate, and every bound orbit closes. For any other central potential, $E$ depends on $J_r$ and $L$ separately, $\omega_r \ne \omega_\varphi$, and orbits precess into rosettes.`,
      idea: String.raw`Each separated equation expresses one momentum $p_i = W_i'(q_i)$ as a function of its own coordinate and the separation constants. So on an invariant torus every $(q_i, p_i)$ traces a closed curve of its own, and its area gives $J_i$ (12.17). For the radial Kepler integral, $\frac1\pi\int_{r_1}^{r_2}\sqrt{2m(E + k/r) - L^2/r^2}\,dr = k\sqrt{m/2|E|} - L$ by a contour integral; the dependence on $J_r + L$ alone is what makes the frequencies equal (the Runge–Lenz symmetry of 12.9, seen through actions). The level sets of $W = W_r(r) + L\varphi$ are spirals, and the orbits cross them at right angles because $m\dot{\mathbf r} = \nabla W$ (12.16).`,
      caption: String.raw`Left: for fixed energy and angular momentum, the level sets of the separated characteristic function $W = W_r(r) + L\varphi$ on the outgoing sheet ($p_r > 0$) are spirals filling the annulus between the turning points. The family of orbits with these constants (purple, the outgoing halves bold) crosses them at right angles. Gold: one orbit integrated for several revolutions. Right: the action plane $(J_\varphi, J_r)$ with curves of constant energy, computed by quadrature; the arrow at the current orbit is $\nabla_J E = (\omega_\varphi, \omega_r)$. For Kepler the curves are parallel straight lines and the arrow is diagonal: equal frequencies, closed orbits. Soften the potential and the lines bend, the frequencies split, and the orbit becomes a rosette.`,
      deps: ['mech-12.16', 'mech-12.17', 'mech-8.7'],
      refs: ['Goldstein §10.5', 'Tong §4.7'],
      tags: ['Hamilton–Jacobi equation', 'separation of variables', 'Kepler problem'],
      credit: 'Jacobi, 1837; Delaunay, 1860; Sommerfeld, 1916',
      viz(v) {
        const eS = v.slider('eccentricity (turning points $1 \\mp e$)', 0.05, 0.8, 0.45, { step: 0.01 });
        const aS = v.slider('softening $a$ in $U = -k/\\sqrt{r^2 + a^2}$', 0, 0.8, 0, { step: 0.01 });
        const sO = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 360, title: 'wavefronts of $W_r(r) + L\\varphi$ and orbits' });
        const sJ = v.stage({ x: [0, 1.6], y: [0, 1.2], axes: 'box', gutter: true, height: 360, xlabel: 'J_φ = L', ylabel: 'J_r', title: 'action plane: curves of constant $E$' });
        const U = (r, a) => -1 / Math.sqrt(r * r + a * a);
        const turning = (E, L, a) => {
          const Ue = (r) => U(r, a) + (L * L) / (2 * r * r);
          let rm = 0.01, um = Infinity; for (let r = 0.01; r < 8; r += 0.004) { const u = Ue(r); if (u < um) { um = u; rm = r; } }
          if (um >= E) return null;
          const bis = (lo, hi) => { for (let k = 0; k < 70; k++) { const m = (lo + hi) / 2; if ((Ue(m) > E) === (Ue(lo) > E)) lo = m; else hi = m; } return (lo + hi) / 2; };
          let hi = rm; while (Ue(hi) < E && hi < 60) hi *= 1.5; if (Ue(hi) < E) return null;
          return [bis(1e-4, rm), bis(rm, hi)];
        };
        const radial = (E, L, a) => {
          const tp = turning(E, L, a); if (!tp) return null;
          const [r1, r2] = tp, m = (r1 + r2) / 2, h = (r2 - r1) / 2, pr = (r) => Math.sqrt(Math.max(0, 2 * (E - U(r, a)) - (L * L) / (r * r)));
          const Jr = chiInt((c) => pr(m - h * Math.cos(c)) * h * Math.sin(c)) / Math.PI;
          const Tr = 2 * chiInt((c) => { const r = m - h * Math.cos(c), p = pr(r); return p > 1e-12 ? (h * Math.sin(c)) / p : 0; });
          const Df = 2 * chiInt((c) => { const r = m - h * Math.cos(c), p = pr(r); return p > 1e-12 ? ((L / (r * r)) * h * Math.sin(c)) / p : 0; });
          return { r1, r2, Jr, Tr, Df, pr };
        };
        const cache = memo(), cacheC = memo(); let cur = null;
        const state = () => cache(eS.value + '|' + aS.value, () => {
          const e = eS.value, a = aS.value, r1 = 1 - e, r2 = 1 + e;
          const L = Math.sqrt((2 * (U(r2, a) - U(r1, a))) / (1 / (r1 * r1) - 1 / (r2 * r2))), E = U(r1, a) + (L * L) / (2 * r1 * r1);
          const R = radial(E, L, a);
          // W_r on the outgoing sheet by cumulative trapezoid
          const n = 300, rs = [], Ws = [0]; for (let k = 0; k <= n; k++) rs.push(R.r1 + ((R.r2 - R.r1) * (1 - Math.cos((Math.PI * k) / n))) / 2);
          for (let k = 1; k <= n; k++) Ws.push(Ws[k - 1] + 0.5 * (R.pr(rs[k]) + R.pr(rs[k - 1])) * (rs[k] - rs[k - 1]));
          // one orbit from pericentre, many revolutions (RK4)
          const f = (t, y) => { const r = Math.hypot(y[0], y[1]), k = -1 / Math.pow(r * r + a * a, 1.5); return [y[2], y[3], k * y[0], k * y[1]]; };
          const O = rk4rec(f, [R.r1, 0, 0, L / R.r1], 8 * R.Tr, 8000, 2);
          const half = rk4rec(f, [R.r1, 0, 0, L / R.r1], R.Tr, 600, 1);
          // frequencies by finite differences of E(J): ω_r = 2π/T_r, ω_φ = ω_r Δφ/2π
          return { e, a, L, E, R, rs, Ws, O, half, wr: TAU / R.Tr, wf: R.Df / R.Tr };
        });
        const contours = () => cacheC(aS.value, () => {
          const a = aS.value, out = [];
          for (const S of [0.5, 0.7, 0.85, 1, 1.15, 1.3, 1.5]) {
            const E = -1 / (2 * S * S) * (a ? 1 / (1 + 0.6 * a) : 1); if (E <= U(0, a) + 1e-6) continue;
            const pts = []; for (let L = 0.02; L < 1.8; L += 0.02) { const R = radial(E, L, a); if (!R) break; pts.push([L, R.Jr]); }
            out.push({ E, pts });
          }
          return out;
        });
        v.animate((tt) => {
          const D = state(), L = D.L, R = D.R;
          // spirals: φ(r) = (c − W_r(r))/L, rotated copies
          for (let k = 0; k < 16; k++) { const c = (k * TAU * L) / 16; sO.path(D.rs.map((r, j) => { const ph = (c - D.Ws[j]) / L; return [r * Math.cos(ph), r * Math.sin(ph)]; }), { color: 'teal', width: 1.4, alpha: 0.75 }); }
          sO.circle(0, 0, R.r1, { color: 'faint', width: 1, dash: [3, 4] }); sO.circle(0, 0, R.r2, { color: 'faint', width: 1, dash: [3, 4] });
          // family of orbits: outgoing half (pericentre → apocentre) bold
          const H = D.half.y, hm = Math.floor(H.length / 2);
          for (let k = 0; k < 8; k++) { const g = (TAU * k) / 8, cg = Math.cos(g), sg = Math.sin(g), rot = (y) => [cg * y[0] - sg * y[1], sg * y[0] + cg * y[1]]; sO.path(H.slice(0, hm + 1).map(rot), { color: 'purple', width: 2, alpha: 0.8 }); sO.path(H.slice(hm).map(rot), { color: 'purple', width: 1, alpha: 0.3 }); }
          // orthogonality check at the middle radius on orbit 0
          const j = Math.floor(hm / 2), y = H[j], r = Math.hypot(y[0], y[1]), ph = Math.atan2(y[1], y[0]);
          const prr = R.pr(r), dphdr = -prr / L, tan = [Math.cos(ph) - r * Math.sin(ph) * dphdr, Math.sin(ph) + r * Math.cos(ph) * dphdr];
          const vel = [y[2], y[3]], ang = Math.acos(clamp(Math.abs(tan[0] * vel[0] + tan[1] * vel[1]) / (Math.hypot(...tan) * Math.hypot(...vel)), 0, 1)) / DEG;
          rightAngle(sO, y[0], y[1], vel, tan, 9, { color: 'ink' }); sO.dot(y[0], y[1], { r: 3.5, color: 'ink' });
          const n = Math.min(D.O.y.length - 1, Math.floor((tt / 14) * D.O.y.length));
          sO.path(D.O.y.slice(0, n + 1).map((z) => [z[0], z[1]]), { color: 'gold', width: 1.6 });
          sO.dot(D.O.y[n][0], D.O.y[n][1], { r: 5, color: 'gold' });
          sO.dot(0, 0, { r: 5, color: 'orange' });
          // action plane
          for (const C of contours()) sJ.path(C.pts, { color: 'muted', width: 1.3, alpha: 0.7 });
          if (D.a === 0) sJ.fn((x) => 1 - x, { color: 'green', width: 1, dash: [4, 4], alpha: 0.8 });
          const dir = [D.wf, D.wr], nn = Math.hypot(...dir);
          sJ.arrow(L, R.Jr, L + (0.3 * dir[0]) / nn, R.Jr + (0.3 * dir[1]) / nn, { color: 'orange', width: 2.4, head: 9 });
          sJ.dot(L, R.Jr, { r: 6, color: 'gold' });
          cur = { D, ang };
        }, { period: 15, still: 13 });
        v.legend([['teal', 'wavefronts $W = $ const (outgoing sheet)'], ['purple', 'orbits with the same $E$, $L$'], ['gold', 'one orbit, many turns'], ['muted', 'curves of constant $E$'], ['orange', '$\\nabla_J E = (\\omega_\\varphi, \\omega_r)$']]);
        v.readout(() => {
          if (!cur) return '';
          const { D, ang } = cur, kep = D.a === 0;
          return String.raw`$E = ${v.fix(D.E, 4)}$, $L = ${v.fix(D.L, 4)}$ · $J_r$ by quadrature ${v.fix(D.R.Jr, 5)}` + (kep ? String.raw`, Kepler formula $1/\sqrt{2|E|} - L = ${v.fix(1 / Math.sqrt(-2 * D.E) - D.L, 5)}$` : '') + String.raw` · $\omega_\varphi/\omega_r = ${v.fix(D.wf / D.wr, 5)}$ (apsidal angle ${v.fix(D.R.Df / 2 / DEG, 2)}°)` + (kep ? ' — degenerate: the orbit closes' : ' — the orbit precesses') + ` · orbit vs wavefront at the marked point: ${v.fix(ang, 3)}°`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.25
    {
      num: '12.25',
      kind: 'Phenomenon',
      name: 'Hannay’s angle: a classical geometric phase',
      statement: String.raw`Let an integrable system depend on parameters that are carried slowly around a closed loop. The actions are adiabatic invariants (12.19), so after the circuit the system returns to the same torus. Its angle, however, has advanced by the dynamical amount $\int\omega(J)\,dt$ plus an extra **Hannay angle** that depends only on the geometry of the loop in parameter space, not on how fast it was traversed. For a bead sliding without friction on a planar wire hoop of length $L$ enclosing area $A$, slowly turned once around an axis perpendicular to its plane, the Hannay angle is
$$\Delta\theta_H = -\frac{8\pi^2A}{L^2} ,$$
which is $-2\pi$ for a circle (the bead simply stays put in space) and smaller in magnitude for every other shape, by the isoperimetric inequality. The Foucault pendulum is another example: carried around a latitude circle in one day, its swing plane comes back turned by $2\pi\sin\lambda$ relative to the Earth.`,
      idea: String.raw`In the hoop’s frame, with arc length $s$, the Lagrangian $\tfrac12m|\dot s\,\hat{\mathbf t} + \Omega\,\hat{\mathbf z}\times\mathbf r|^2$ contains the term $m\Omega\,\dot s\,a(s)$ with $a = \hat{\mathbf z}\cdot(\mathbf r\times\hat{\mathbf t})$, which acts like a vector potential. To leading order the bead sees its average, so its speed relative to the hoop is lowered by $\Omega\langle a\rangle$ while the action is unchanged. Integrating over the circuit, $\int\Omega\,dt = 2\pi$, gives the shift $\Delta s = -2\pi\langle a\rangle$ with $\langle a\rangle = \frac1L\oint\hat{\mathbf z}\cdot(\mathbf r\times d\mathbf r) = 2A/L$, independent of where the axis is. In angle units, $\Delta\theta = 2\pi\Delta s/L = -8\pi^2A/L^2$. The shift depends on the rotation only through $\int\Omega\,dt$, so it does not depend on the speed of the circuit.`,
      caption: String.raw`A frictionless bead (gold) runs around a wire hoop while the hoop is slowly turned once in its own plane, speeding up and slowing down smoothly. The hollow marker shows where the bead would be if the hoop had not turned. Middle: the accumulated angle difference against the fraction of the turn, measured from the integrated motion (wiggly) and the geometric prediction $-4\pi A\,\alpha/L^2$. Right: the final shift against the duration of the turn: as the turn gets slower it settles on the Hannay angle $-8\pi^2A/L^2$, whatever the duration. Change the shape: a circle gives exactly $-2\pi$, an elongated hoop much less.`,
      deps: ['mech-12.19', 'mech-12.17', 'mech-9.10'],
      refs: ['Tong §4.6'],
      tags: ['geometric phase', 'Hannay angle', 'adiabatic invariant'],
      credit: 'Hannay, 1985; Berry, 1985',
      viz(v) {
        const shS = v.select('hoop', [{ value: 'circle', label: 'circle' }, { value: 'ell', label: 'ellipse' }, { value: 'lobe', label: 'three lobes' }, { value: 'stad', label: 'stadium' }], 'ell');
        const asS = v.slider('elongation (ellipse, stadium)', 1, 4, 2.2, { step: 0.01 });
        const TS = v.slider('duration of the turn (bead laps)', 2, 80, 25, { log: true });
        const sH = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 320, weight: 1, title: 'the turning hoop' });
        const sD = v.stage({ x: [0, 1], y: [-7, 0.5], axes: 'box', gutter: true, height: 320, weight: 1.15, xlabel: 'fraction of the turn α/2π', title: 'angle shift $\\Delta\\theta$ (rad)' });
        const sF = v.stage({ x: [2, 80], y: [-7, 0.3], xlog: true, axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'duration (bead laps)', title: 'final shift against duration' });
        const shape = () => {
          const k = shS.value, e = asS.value, M = 2048, pts = [];
          for (let i = 0; i < M; i++) {
            const t = (TAU * i) / M;
            if (k === 'circle') pts.push([Math.cos(t), Math.sin(t)]);
            else if (k === 'ell') pts.push([Math.sqrt(e) * Math.cos(t), Math.sin(t) / Math.sqrt(e)]);
            else if (k === 'lobe') { const r = 1 + 0.3 * Math.cos(3 * t); pts.push([r * Math.cos(t), r * Math.sin(t)]); }
            else { const w = 0.6 * (e - 1) + 0.0001, per = 2 * w * 2 + TAU * 0.7, u = (t / TAU) * per, R = 0.7; let x, y; if (u < 2 * w) { x = -w + u; y = -R; } else if (u < 2 * w + Math.PI * R) { const a = (u - 2 * w) / R - Math.PI / 2; x = w + R * Math.cos(a); y = R * Math.sin(a); } else if (u < 4 * w + Math.PI * R) { x = w - (u - 2 * w - Math.PI * R); y = R; } else { const a = (u - 4 * w - Math.PI * R) / R + Math.PI / 2; x = -w + R * Math.cos(a); y = R * Math.sin(a); } pts.push([x, y]); }
          }
          const cum = [0]; for (let i = 1; i <= M; i++) cum.push(cum[i - 1] + Math.hypot(pts[i % M][0] - pts[i - 1][0], pts[i % M][1] - pts[i - 1][1]));
          const L = cum[M]; let A = 0; for (let i = 0; i < M; i++) { const a = pts[i], b = pts[(i + 1) % M]; A += a[0] * b[1] - b[0] * a[1]; } A /= 2;
          // tables on a uniform arc-length grid: position, r·t̂ and a = ẑ·(r × t̂)
          const NT = 2048, tab = [];
          let j = 0;
          for (let i = 0; i < NT; i++) {
            const s = (L * i) / NT; while (cum[j + 1] < s) j++;
            const f = (s - cum[j]) / (cum[j + 1] - cum[j]), P0 = pts[j], P1 = pts[(j + 1) % M], x = P0[0] + f * (P1[0] - P0[0]), y = P0[1] + f * (P1[1] - P0[1]);
            const dl = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]), tx = (P1[0] - P0[0]) / dl, ty = (P1[1] - P0[1]) / dl;
            tab.push([x, y, x * tx + y * ty, x * ty - y * tx]);
          }
          const look = (s) => { const u = ((((s / L) % 1) + 1) % 1) * NT, i = Math.floor(u), f = u - i, a = tab[i], b = tab[(i + 1) % NT]; return a.map((c, m) => c + f * (b[m] - c)); };
          return { pts, L, A, look };
        };
        const runOne = (H, laps, rec) => {
          const v0 = 1, T = laps * H.L / v0, Om = (t) => (TAU / T) * (1 - Math.cos((TAU * t) / T)), Omd = (t) => (TAU / T) * (TAU / T) * Math.sin((TAU * t) / T);
          const f = (t, y) => { const g = H.look(y[0]), O = Om(t); return [y[1], O * O * g[2] - Omd(t) * g[3]]; };
          const n = Math.round(laps * 300), dt = T / n; let y = [0, v0]; const out = rec ? { t: [0], s: [0], al: [0] } : null; let al = 0;
          for (let k = 1; k <= n; k++) {
            const t0 = (k - 1) * dt; y = rk4(f, t0, y, dt); al += 0.5 * dt * (Om(t0) + Om(t0 + dt));
            if (rec && k % 3 === 0) { out.t.push(k * dt); out.s.push(y[0]); out.al.push(al); }
          }
          return { T, dth: (TAU * (y[0] - v0 * T)) / H.L, vend: y[1], out };
        };
        const cache = memo(), cacheS = memo(); let cur = null;
        const run = () => cache([shS.value, asS.value, TS.value].join('|'), () => { const H = shape(); return { H, R: runOne(H, TS.value, true) }; });
        const sweep = () => cacheS([shS.value, asS.value].join('|'), () => { const H = shape(); const out = []; for (let k = 0; k <= 9; k++) { const laps = 2 * Math.pow(40, k / 9); out.push([laps, runOne(H, laps, false).dth]); } return out; });
        v.animate((tt) => {
          const B = run(), H = B.H, R = B.R.out, pred = (-8 * Math.PI * Math.PI * H.A) / (H.L * H.L);
          const n = R.t.length - 1, i = Math.min(n, Math.floor((tt / 12) * n)), al = R.al[i], ca = Math.cos(al), sa = Math.sin(al), rot = (p) => [ca * p[0] - sa * p[1], sa * p[0] + ca * p[1]];
          // hoop
          sH.poly(H.pts.filter((_, k) => k % 8 === 0).map(rot), { fill: 'accent', fillAlpha: 0.06, color: 'accent', width: 3 });
          sH.dot(0, 0, { r: 3, color: 'ink' });
          const mark = rot(H.look(0)); sH.line(0, 0, mark[0], mark[1], { color: 'faint', width: 1, dash: [3, 3] });
          sH.circle(0, 0, 2.05, { color: 'faint', width: 1 });
          sH.arrow(2.05 * Math.cos(al - 0.25), 2.05 * Math.sin(al - 0.25), 2.05 * Math.cos(al), 2.05 * Math.sin(al), { color: 'orange', width: 2, head: 8 });
          const ref = rot(H.look(R.t[i])), bead = rot(H.look(R.s[i]));
          sH.dot(ref[0], ref[1], { r: 6, color: 'muted', hollow: true });
          sH.dot(bead[0], bead[1], { r: 7, color: 'gold' });
          sH.corner(`turned ${v.fix((al / TAU) * 360, 0)}°`, 'tr', { color: 'ink', plate: true });
          // shift against the fraction of the turn
          const lo = Math.min(pred, -0.5) * 1.15; sD.setView([0, 1], [lo, 0.5]);
          sD.hline(pred, { color: 'green', width: 1, dash: [4, 4] });
          sD.text('Hannay angle', 0.02, pred, { color: 'green', dy: -9, size: 11 });
          sD.line(0, 0, 1, pred, { color: 'orange', width: 1.6, dash: [6, 4] });
          series(sD, R.al.map((a) => a / TAU), R.s.map((s, k) => (TAU * (s - R.t[k])) / H.L), i, { color: 'blue', width: 2.2 });
          // final shift against duration
          const S = sweep();
          sF.setView([2, 80], [lo, 0.3]);
          sF.hline(pred, { color: 'green', width: 1.4, dash: [5, 4] });
          sF.path(S, { color: 'blue', width: 2 }); sF.dots(S, { r: 3.5, color: 'blue' });
          sF.dot(TS.value, B.R.dth, { r: 7, color: 'gold', hollow: true });
          cur = { B, pred, S };
        }, { period: 13, still: 12.5 });
        v.legend([['gold', 'bead'], ['muted', 'where it would be without the turn', { dot: true }], ['blue', 'measured $\\Delta\\theta$'], ['orange', 'geometric prediction $-4\\pi A\\alpha/L^2$', { dash: true }], ['green', 'Hannay angle $-8\\pi^2A/L^2$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { B, pred, S } = cur, H = B.H;
          return String.raw`hoop: $L = ${v.fix(H.L, 4)}$, $A = ${v.fix(H.A, 4)}$, so $-8\pi^2A/L^2 = ${v.fix(pred, 4)}$ rad (circle: $-2\pi = ${v.fix(-TAU, 4)}$) · measured after the turn: ${v.fix(B.R.dth, 4)} rad · slowest run in the sweep: ${v.fix(S[S.length - 1][1], 4)} · bead speed after the turn ${v.fix(B.R.vend, 5)} (started at 1: the action came back)`;
        });
      },
    },
  ],
};
