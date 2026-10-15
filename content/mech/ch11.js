// Classical Mechanics — Chapter 11: Small oscillations and normal modes (part a: 11.1–11.9)

import { TAU, DEG, clamp, memo, rk4, rk4rec, verletLin, idxAt, span, sci, num, upCrossings, meanGap, mv, qf, genEig, toModes, fromModes, chainMK, MODE_COLS, spring, hatch, cart, series, ellipsePts } from './ch11.shared.js';

/** Wall-to-wall track of two carts at rest positions 1 and 2 (walls at 0 and 3), drawn at height y with displacements x. */
function twoCarts(v, s, y, x, k, st = {}) {
  const CW = 0.34, CH = 0.3, a = st.alpha ?? 1, p1 = 1 + x[0], p2 = 2 + x[1], yb = y - CH / 2;
  hatch(v, s, 0, yb - 0.04, 0, y + 0.24, -1, 6, 6); hatch(v, s, 3, yb - 0.04, 3, y + 0.24, 1, 6, 6);
  s.line(0, yb - 0.04, 3, yb - 0.04, { color: 'faint', width: 1.2 });
  const sy = y + 0.03, col = (e) => (e > 0.004 ? 'red' : e < -0.004 ? 'blue' : 'muted');
  spring(s, 0, sy, p1 - CW / 2, sy, { n: 7, w: 0.055, color: st.springs === false ? 'muted' : col(x[0]), alpha: a, width: 1.4 * (k[0] ** 0.25) });
  spring(s, p1 + CW / 2, sy, p2 - CW / 2, sy, { n: 6, w: 0.055, color: st.springs === false ? 'muted' : col(x[1] - x[0]), alpha: a, width: 1.4 * (k[1] ** 0.25) });
  spring(s, p2 + CW / 2, sy, 3, sy, { n: 7, w: 0.055, color: st.springs === false ? 'muted' : col(-x[1]), alpha: a, width: 1.4 * (k[2] ** 0.25) });
  cart(s, p1, y, CW * (st.w1 ?? 1), CH, st.c1 || 'purple', st.l1 ?? null, { alpha: a });
  cart(s, p2, y, CW * (st.w2 ?? 1), CH, st.c2 || 'teal', st.l2 ?? null, { alpha: a });
}

export default {
  collection: 'mech',
  chapter: 11,
  title: 'Small oscillations and normal modes',
  summary: String.raw`Near a stable equilibrium every mechanical system with many degrees of freedom behaves like a set of coupled springs: its kinetic and potential energies are quadratic forms. Diagonalising the two forms at once gives the normal modes, independent oscillators whose superpositions produce beats, energy exchange and avoided crossings. Chains of masses lead to dispersion and, in the continuum limit, to waves on a string. Rayleigh’s principle and interlacing explain how frequencies respond when a system is stiffened, loaded or constrained, a negative eigenvalue signals instability, and the Lagrange–Dirichlet theorem guarantees stability at any strict minimum of the potential. Taking the continuum limit inside the action gives Lagrangian field theory, where Noether’s theorem produces local densities and fluxes.`,
  items: [
    // ───────────────────────────────────────────────────────────── 11.1
    {
      num: '11.1',
      kind: 'Model',
      name: 'Two masses and three springs',
      statement: String.raw`Two carts of masses $m_1, m_2$ slide without friction between two walls, joined to the walls and to each other by springs of stiffness $k_1, k_2, k_3$ that are at their natural lengths at equilibrium. With displacements $x_1, x_2$ from equilibrium,
$$T = \tfrac12 m_1\dot x_1^2 + \tfrac12 m_2\dot x_2^2,\qquad V = \tfrac12 k_1x_1^2 + \tfrac12 k_2(x_2-x_1)^2 + \tfrac12 k_3x_2^2 ,$$
and Lagrange’s equations read $M\ddot{\mathbf x} = -K\mathbf x$ with
$$M = \begin{pmatrix} m_1 & 0\\ 0 & m_2\end{pmatrix},\qquad K = \begin{pmatrix} k_1+k_2 & -k_2\\ -k_2 & k_2+k_3\end{pmatrix}.$$
A trial motion $\mathbf x = \mathbf a\cos(\omega t-\varphi)$ works exactly when $(K-\omega^2M)\mathbf a = 0$, which needs $\det(K-\omega^2M) = 0$: a quadratic in $\omega^2$ with two positive roots $\omega_1 < \omega_2$. Each root comes with a **normal mode** $\mathbf a_k$ in which both carts oscillate at the single frequency $\omega_k$, and every motion is a superposition
$$\mathbf x(t) = A_1\mathbf a_1\cos(\omega_1t-\varphi_1) + A_2\mathbf a_2\cos(\omega_2t-\varphi_2).$$
For equal masses $m$ and equal outer springs $k$ the modes are the in-phase motion $\mathbf a_1 \propto (1,1)$, with $\omega_1 = \sqrt{k/m}$ (the middle spring is never stretched), and the out-of-phase motion $\mathbf a_2 \propto (1,-1)$, with $\omega_2 = \sqrt{(k+2k_2)/m}$.`,
      scope: String.raw`Holds for frictionless carts and springs that obey Hooke’s law over the whole motion. Friction adds a decay to each mode; large stretches or nonlinear springs couple the modes, and energy then leaks between them.`,
      idea: String.raw`The equations are linear with constant coefficients, so, as for one oscillator (4.2), a trial cosine turns the differential equations into linear algebra. For equal masses the symmetry $x_1\leftrightarrow x_2$ does all the work: the sum $x_1+x_2$ and the difference $x_1-x_2$ each obey a single-oscillator equation, so they are the modes. In general the modes still decouple the system (11.4). The energy of each mode, $\tfrac12(\dot q_k^2+\omega_k^2q_k^2)$ in the normal coordinates $q_k$ of 11.5, is conserved on its own, while the energy of each cart is not: the carts trade energy through the middle spring.`,
      caption: String.raw`Drag the hollow outlines to choose where the carts start; they are released from rest. The top row is the motion integrated from Newton’s equations. The two rows below are its projections onto the two normal modes, which add up to the top row at every instant (springs are red when stretched, blue when compressed). The bars on the right share out the energy: the carts trade it back and forth, while the modes never exchange any. Try the presets, then make the masses or the outer springs unequal and watch the mode shapes change.`,
      deps: ['mech-4.2', 'mech-6.6'],
      refs: ['Taylor §11.1', 'Taylor §11.2'],
      tags: ['normal modes', 'coupled oscillators'],
      viz(v) {
        const M = v.M, TT = 60, SP = 3, DT = 0.01, EV = 4, YR = [2.5, 1.4, 0.3], AM = 0.45;
        const m2S = v.slider('mass ratio $m_2/m_1$', 0.25, 4, 1, { log: true });
        const kcS = v.slider('middle spring $k_2/k_1$', 0.05, 3, 0.35, { log: true });
        const k3S = v.slider('right spring $k_3/k_1$', 0.25, 4, 1, { log: true });
        const sA = v.stage({ x: [-0.12, 3.12], y: [-0.08, 3.02], height: 290, axes: false, full: true });
        const WIN = 25, sT = v.stage({ x: [0, WIN], y: [-1.12, 1.12], height: 230, axes: 'box', xlabel: 't', weight: 1.6, yticks: [] });
        const sE = v.stage({ x: [0, 4.6], y: [0, 1.12], height: 230, axes: 'box', weight: 1, xticks: [[0.7, 'cart 1'], [1.6, 'cart 2'], [3.0, 'mode 1'], [3.9, 'mode 2']], yticks: [0, 0.25, 0.5, 0.75, 1], title: 'share of the energy' });
        const h1 = sA.handle(1.4, YR[0], { color: 'purple', constrain: (x) => [clamp(x, 1 - AM, 1 + AM), YR[0]] });
        const h2 = sA.handle(2, YR[0], { color: 'teal', constrain: (x) => [clamp(x, 2 - AM, 2 + AM), YR[0]] });
        h1.onDrag = h2.onDrag = () => v.restart();
        const sys = () => {
          const m2 = m2S.value, k2 = kcS.value, k3 = k3S.value, Mm = [[1, 0], [0, m2]], K = [[1 + k2, -k2], [-k2, k2 + k3]];
          return { m2, k2, k3, Mm, K, G: genEig(Mm, K, M) };
        };
        const preset = (x) => { h1.set(1 + x[0], YR[0]); h2.set(2 + x[1], YR[0]); v.restart(); };
        const modeStart = (k) => { const a = sys().G.A[k], s = 0.4 / Math.max(Math.abs(a[0]), Math.abs(a[1])); preset([a[0] * s, a[1] * s]); };
        v.button('Mode 1 only', () => modeStart(0));
        v.button('Mode 2 only', () => modeStart(1));
        v.button('Cart 1 only', () => preset([0.4, 0]));
        const cache = memo(); let cur = null;
        const run = () => cache([m2S.value, kcS.value, k3S.value, h1.x, h2.x].join('|'), () => {
          const S = sys(), x0 = [h1.x - 1, h2.x - 2];
          const R = verletLin([[1, 0], [0, 1 / S.m2]], S.K, x0, [0, 0], DT, Math.round(TT / DT), EV);
          const rec = R.x.map((x, i) => {
            const u = R.v[i], q = toModes(S.G, S.Mm, x), qd = toModes(S.G, S.Mm, u), sp = 0.25 * S.k2 * (x[1] - x[0]) ** 2;
            return { x, q, E1: 0.5 * u[0] ** 2 + 0.5 * x[0] ** 2 + sp, E2: 0.5 * S.m2 * u[1] ** 2 + 0.5 * S.k3 * x[1] ** 2 + sp, Em: q.map((qq, k) => 0.5 * (qd[k] ** 2 + S.G.w2[k] * qq * qq)) };
          });
          const E = rec[0].E1 + rec[0].E2 || 1e-300;
          const rng = (f) => { let lo = Infinity, hi = -Infinity; for (const r of rec) { const y = f(r) / E; lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
          let drift = 0; for (const r of rec) for (let k = 0; k < 2; k++) drift = Math.max(drift, Math.abs(r.Em[k] - rec[0].Em[k]) / E);
          const wMeas = [0, 1].map((k) => { const qs = rec.map((r) => r.q[k]); return Math.abs(qs[0]) > 1e-3 * Math.sqrt(2 * E) ? TAU / meanGap(upCrossings(R.t, qs)) : NaN; });
          return { S, R, rec, E, rE1: rng((r) => r.E1), rE2: rng((r) => r.E2), drift, wMeas, w: S.G.w2.map(Math.sqrt) };
        });
        v.animate((t) => {
          const B = run(), S = B.S, tau = Math.min(SP * t, TT), i = idxAt(B.R, tau), r = B.rec[i], A = S.G.A;
          const ks = [1, S.k2, S.k3], part = (k) => [r.q[k] * A[k][0], r.q[k] * A[k][1]];
          // ghost outlines of the start, then the three rows
          for (const [h, c] of [[h1, 'purple'], [h2, 'teal']]) cart(sA, h.x, YR[0], 0.34, 0.3, c, null, { fillAlpha: 0, dash: [4, 3], alpha: 0.55, wheels: false });
          twoCarts(v, sA, YR[0], r.x, ks, { w2: Math.sqrt(S.m2) ** 0.5, l1: 'm_1', l2: 'm_2' });
          twoCarts(v, sA, YR[1], part(0), ks, { c1: 'blue', c2: 'blue', w2: Math.sqrt(S.m2) ** 0.5, alpha: 0.75 });
          twoCarts(v, sA, YR[2], part(1), ks, { c1: 'orange', c2: 'orange', w2: Math.sqrt(S.m2) ** 0.5, alpha: 0.75 });
          sA.text('the motion, integrated from Newton’s equations', 0.06, YR[0] + 0.42, { color: 'ink', size: 12 });
          sA.text(`= mode 1: q₁(t)·a₁, at ω₁ = ${v.fix(B.w[0], 3)}`, 0.06, YR[1] + 0.42, { color: 'blue', size: 12 });
          sA.text(`+ mode 2: q₂(t)·a₂, at ω₂ = ${v.fix(B.w[1], 3)}`, 0.06, YR[2] + 0.42, { color: 'orange', size: 12 });
          sA.corner(`t = ${v.fix(tau, 1)}`, 'tr');
          // displacements against time: carts (thick) and their mode parts (thin)
          const off = [0.56, -0.56], t0 = Math.max(0, tau - WIN + 2), i0 = idxAt(B.R, t0), i1 = idxAt(B.R, t0 + WIN);
          sT.setView([t0, t0 + WIN], [-1.12, 1.12]);
          const seg = (f, st, upto) => { const pts = []; for (let j = i0; j <= Math.min(upto, i1); j++) pts.push([B.R.t[j], f(B.rec[j])]); sT.path(pts, st); };
          for (let c = 0; c < 2; c++) {
            sT.hline(off[c], { color: 'faint', width: 1 });
            seg((q) => off[c] + q.q[0] * A[0][c], { color: 'blue', width: 1.2, alpha: 0.75 }, i);
            seg((q) => off[c] + q.q[1] * A[1][c], { color: 'orange', width: 1.2, alpha: 0.75 }, i);
            seg((q) => off[c] + q.x[c], { color: c ? 'teal' : 'purple', width: 2.4 }, i);
            sT.tex(c ? 'x_2' : 'x_1', t0 + 0.8, off[c] + 0.42, { color: c ? 'teal' : 'purple', size: 14 });
          }
          sT.vline(tau, { color: 'gold', width: 1.4 });
          // energy shares
          const bar = (x, val, rr, col) => {
            if (rr) sE.rect(x - 0.36, rr[0], x + 0.36, rr[1], { fill: col, fillAlpha: 0.1, stroke: false });
            sE.rect(x - 0.3, 0, x + 0.3, val, { fill: col, fillAlpha: 0.55, color: col, width: 1.4 });
            sE.text(v.fix(100 * val, 0) + '%', x, val, { color: col, size: 11, align: 'center', dy: -9 });
          };
          bar(0.7, r.E1 / B.E, B.rE1, 'purple'); bar(1.6, r.E2 / B.E, B.rE2, 'teal');
          bar(3.0, r.Em[0] / B.E, null, 'blue'); bar(3.9, r.Em[1] / B.E, null, 'orange');
          sE.line(2.3, 0.02, 2.3, 1.08, { color: 'faint', width: 1, dash: [3, 4] });
          cur = B;
        }, { period: TT / SP + 1, still: 6 });
        v.legend([['purple', 'cart 1'], ['teal', 'cart 2'], ['blue', 'mode 1 part'], ['orange', 'mode 2 part'], ['faint', 'range swept by a cart’s share', { area: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const B = cur, S = B.S, eq = Math.abs(S.m2 - 1) < 1e-9 && Math.abs(S.k3 - 1) < 1e-9;
          const meas = (k) => (isFinite(B.wMeas[k]) ? ` (measured from the zero crossings of $q_${k + 1}$: ${v.fix(B.wMeas[k], 4)})` : ` (mode ${k + 1} not excited)`);
          let s = String.raw`Roots of $\det(K-\omega^2M)=0$: $\omega_1 = ${v.fix(B.w[0], 4)}$${meas(0)}, $\omega_2 = ${v.fix(B.w[1], 4)}$${meas(1)}`;
          if (eq) s += String.raw` · equal masses and outer springs: $\sqrt{k/m} = 1$, $\sqrt{(k+2k_2)/m} = ${v.fix(Math.sqrt(1 + 2 * S.k2), 4)}$`;
          s += String.raw` · mode shapes $\mathbf a_1 \propto (1, ${v.fix(S.G.A[0][1] / S.G.A[0][0], 3)})$, $\mathbf a_2 \propto (1, ${v.fix(S.G.A[1][1] / S.G.A[1][0], 3)})$`;
          s += String.raw` · cart 1’s share swings between ${v.fix(100 * B.rE1[0], 0)}% and ${v.fix(100 * B.rE1[1], 0)}%, while each mode energy stays constant to $${sci(v, B.drift)}$ of the total (Verlet integration error)`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.2
    {
      num: '11.2',
      kind: 'Phenomenon',
      name: 'Beats and energy exchange',
      statement: String.raw`Take two identical oscillators of frequency $\omega_0$ joined by a weak coupling, so that the normal-mode frequencies $\omega_1 < \omega_2$ are close. Start oscillator 1 with amplitude $A$ and oscillator 2 at rest. Both modes are excited equally, and
$$x_1 = A\cos\tfrac{\Delta\omega\,t}{2}\,\cos\bar\omega t,\qquad x_2 = A\sin\tfrac{\Delta\omega\,t}{2}\,\sin\bar\omega t,\qquad \bar\omega = \tfrac{\omega_1+\omega_2}{2},\ \Delta\omega = \omega_2-\omega_1 .$$
Each oscillator swings at the mean frequency inside a slowly varying envelope: these are **beats**. The energy moves completely from oscillator 1 to oscillator 2 in the time $\pi/\Delta\omega$ and comes back after $2\pi/\Delta\omega$, with $E_1 \approx E\cos^2(\Delta\omega\,t/2)$ and $E_2 \approx E\sin^2(\Delta\omega\,t/2)$. For two pendulums of frequency $\omega_0$ coupled by a spring of relative strength $\kappa$, $\omega_1 = \omega_0$ and $\omega_2 = \omega_0\sqrt{1+2\kappa}$, so the exchange time grows like $\pi/(\kappa\omega_0)$ as the coupling weakens. If the oscillators are detuned, the transfer is incomplete: at most a fraction $\sin^2 2\theta$ of the energy crosses over, where $\tan 2\theta = 2\kappa\omega_0^2/(\omega_a^2-\omega_b^2)$.`,
      scope: String.raw`The formulas assume small amplitudes (linear oscillators), no friction and weak coupling ($\Delta\omega \ll \bar\omega$, so that energy can be assigned to each oscillator). At large amplitude the pendulum frequency drops, which detunes the pair as energy moves.`,
      idea: String.raw`Starting one oscillator alone means starting the in-phase and out-of-phase modes (11.1) with equal amplitudes. The two modes run at slightly different frequencies, so they drift out of step. After a time $\pi/\Delta\omega$ the out-of-phase mode has fallen half a cycle behind: the two modes now cancel on oscillator 1 and add on oscillator 2. The sum-to-product identity $\cos a+\cos b = 2\cos\frac{a-b}2\cos\frac{a+b}2$ turns this into the beat formula. With detuning, the modes are no longer the symmetric and antisymmetric combinations, and oscillator 1 alone is no longer an equal mixture of them, so the cancellation is only partial.`,
      caption: String.raw`Pendulum 1 starts alone; the bob shading shows each pendulum’s share of the energy. The right panel plots the measured shares (solid) against the weak-coupling prediction (dashed), and the strip below shows the two swing angles beating. Weaken the coupling and the exchange slows down. Detune pendulum 2 and the transfer becomes incomplete, exactly as $\sin^2 2\theta$ predicts. Raise the starting angle and the pendulums’ own nonlinearity begins to detune them.`,
      deps: ['mech-11.1'],
      see: ['waves-3.1', 'mech-4.4'],
      refs: ['Taylor §11.3'],
      tags: ['beats', 'coupled oscillators', 'energy exchange'],
      viz(v) {
        const M = v.M;
        const cS = v.slider('coupling $\\kappa$', 0.02, 0.4, 0.08, { log: true });
        const dS = v.slider('detuning $\\omega_b/\\omega_a - 1$', -0.2, 0.2, 0, { step: 0.001 });
        const aS = v.slider('starting angle of pendulum 1 (°)', 2, 45, 12, { step: 0.5 });
        const sP = v.stage({ x: [-1.32, 1.32], y: [-1.28, 0.16], equal: true, axes: false, height: 290, weight: 0.85 });
        const sE = v.stage({ x: [0, 100], y: [0, 1.1], axes: 'box', height: 290, weight: 1.2, title: 'energy of each pendulum ÷ total, against t (units of $1/\\omega_a$)' });
        const sW = v.stage({ x: [0, 100], y: [-50, 50], axes: 'box', height: 150, full: true, ylabel: 'angle (°)' });
        const cache = memo(); let cur = null;
        const run = () => cache([cS.value, dS.value, aS.value].join('|'), () => {
          const c = cS.value, wb = 1 + dS.value, th0 = aS.value * DEG;
          const K = [[1 + c, -c], [-c, wb * wb + c]], E = M.eigSym(K), w = [Math.sqrt(E.values[1]), Math.sqrt(E.values[0])], dw = w[1] - w[0];
          const s2 = (2 * c) ** 2 / ((1 - wb * wb) ** 2 + (2 * c) ** 2);
          const Tw = Math.min(2.2 * TAU / dw, 900), dt = 0.02, n = Math.round(Tw / dt);
          const F = (t, y) => { const s1 = Math.sin(y[0]), s2_ = Math.sin(y[1]), d = s1 - s2_; return [y[2], y[3], -s1 - c * d * Math.cos(y[0]), -wb * wb * s2_ + c * d * Math.cos(y[1])]; };
          const R = rk4rec(F, [th0, 0, 0, 0], Tw, n, 2);
          const en = R.y.map((y) => { const e1 = 0.5 * y[2] ** 2 + (1 - Math.cos(y[0])), e2 = 0.5 * y[3] ** 2 + wb * wb * (1 - Math.cos(y[1])), es = 0.5 * c * (Math.sin(y[0]) - Math.sin(y[1])) ** 2; return [e1, e2, e1 + e2 + es]; });
          const Et = en[0][2];
          let iMax = 0; const lim = Math.min(R.t.length - 1, idxAt(R, 1.4 * Math.PI / dw));
          for (let i = 0; i <= lim; i++) if (en[i][1] > en[iMax][1]) iMax = i;
          let drift = 0; for (const e of en) drift = Math.max(drift, Math.abs(e[2] - Et) / Et);
          return { c, wb, th0, w, dw, s2, Tw, R, en, Et, tMax: R.t[iMax], fMax: en[iMax][1] / Et, drift };
        });
        v.animate((t) => {
          const B = run(), rate = Math.min(B.Tw / 24, 30), tau = Math.min(rate * t, B.Tw), i = idxAt(B.R, tau), y = B.R.y[i], e = B.en[i];
          // the pendulums
          hatch(v, sP, -1.2, 0, 1.2, 0, -1);
          const piv = [-0.55, 0.55], d = 0.5;
          const ends = [0, 1].map((k) => [piv[k] + Math.sin(y[k]), -Math.cos(y[k])]);
          const sp = [0, 1].map((k) => [piv[k] + d * Math.sin(y[k]), -d * Math.cos(y[k])]);
          spring(sP, sp[0][0], sp[0][1], sp[1][0], sp[1][1], { n: 9, w: 0.035, lead: 0.08, color: 'muted', width: 1.4 });
          for (let k = 0; k < 2; k++) {
            const col = k ? 'teal' : 'purple';
            sP.line(piv[k], 0, piv[k], -1.05, { color: 'faint', width: 1, dash: [2, 4] });
            sP.line(piv[k], 0, ends[k][0], ends[k][1], { color: 'ink', width: 1.6 });
            sP.dot(piv[k], 0, { r: 3, color: 'ink' });
            sP.circle(ends[k][0], ends[k][1], 0.1, { fill: col, fillAlpha: 0.08 + 0.85 * clamp(e[k] / B.Et, 0, 1), color: col, width: 2 });
            sP.text(`${v.fix(100 * e[k] / B.Et, 0)}%`, piv[k], -1.22, { color: col, size: 12, align: 'center', weight: 600 });
          }
          sP.corner(`t = ${v.fix(tau, 0)}`, 'tl');
          // energy shares
          sE.setView([0, B.Tw], [0, 1.1]);
          for (let m = 1; m * Math.PI / B.dw < B.Tw; m += 2) { const tm = m * Math.PI / B.dw; sE.vline(tm, { color: 'green', width: 1, dash: [3, 4] }); }
          sE.text('predicted full transfer, t = π/Δω', Math.PI / B.dw, 1.055, { color: 'green', size: 11, align: 'left', dx: 4 });
          const ph = (tt) => Math.sin((B.dw * tt) / 2) ** 2;
          sE.fn((tt) => 1 - B.s2 * ph(tt), { color: 'purple', dash: [5, 4], width: 1.3, alpha: 0.8 });
          sE.fn((tt) => B.s2 * ph(tt), { color: 'teal', dash: [5, 4], width: 1.3, alpha: 0.8 });
          series(sE, B.R.t, B.en.map((q) => q[0] / B.Et), i, { color: 'purple', width: 2.2 });
          series(sE, B.R.t, B.en.map((q) => q[1] / B.Et), i, { color: 'teal', width: 2.2 });
          sE.vline(tau, { color: 'gold', width: 1.3 });
          // beating swing angles
          const am = Math.max(3, B.th0 / DEG) * 1.15;
          sW.setView([0, B.Tw], [-am, am]);
          series(sW, B.R.t, B.R.y.map((q) => q[0] / DEG), i, { color: 'purple', width: 1.1 });
          series(sW, B.R.t, B.R.y.map((q) => q[1] / DEG), i, { color: 'teal', width: 1.1, alpha: 0.85 });
          sW.vline(tau, { color: 'gold', width: 1.3 });
          cur = B;
        }, { period: 25.5, still: 5.45 });
        v.legend([['purple', 'pendulum 1 (started alone)'], ['teal', 'pendulum 2'], ['muted', 'weak-coupling prediction', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const B = cur;
          return String.raw`Mode frequencies $\omega_1 = ${v.fix(B.w[0], 4)}$, $\omega_2 = ${v.fix(B.w[1], 4)}$ (units of $\omega_a$), so $\Delta\omega = ${v.fix(B.dw, 4)}$ · predicted exchange time $\pi/\Delta\omega = ${v.fix(Math.PI / B.dw, 1)}$; measured first maximum of $E_2$ at $t = ${v.fix(B.tMax, 1)}$ · largest share reaching pendulum 2: measured ${v.fix(100 * B.fMax, 1)}%, predicted $\sin^2 2\theta = ${v.fix(100 * B.s2, 1)}$% · total energy conserved to $${sci(v, B.drift)}$ (RK4 on the full nonlinear equations)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.3
    {
      num: '11.3',
      kind: 'Theorem',
      name: 'Linearisation near equilibrium: quadratic T and V',
      statement: String.raw`Let a system with $n$ degrees of freedom have Lagrangian $L = \tfrac12\dot{\mathbf q}^{\mathsf T}M(\mathbf q)\dot{\mathbf q} - V(\mathbf q)$, with $M(\mathbf q)$ symmetric positive definite and $V$ of class $C^3$, and let $\mathbf q_0$ be an equilibrium, $\nabla V(\mathbf q_0) = 0$. Write $\mathbf q = \mathbf q_0 + \boldsymbol\eta$. Keeping terms of second order in $(\boldsymbol\eta,\dot{\boldsymbol\eta})$ gives
$$T \approx \tfrac12\dot{\boldsymbol\eta}^{\mathsf T}M\dot{\boldsymbol\eta},\qquad V \approx V(\mathbf q_0) + \tfrac12\boldsymbol\eta^{\mathsf T}K\boldsymbol\eta,\qquad M = M(\mathbf q_0),\quad K_{ij} = \frac{\partial^2V}{\partial q_i\,\partial q_j}(\mathbf q_0),$$
two **constant** symmetric matrices ($K$ is symmetric because mixed partial derivatives commute). The resulting Lagrange equations are linear:
$$M\ddot{\boldsymbol\eta} + K\boldsymbol\eta = 0 .$$
The neglected terms are of third order, so solutions of the true and linearised equations that start at the same small displacement of size $\varepsilon$ stay within $O(\varepsilon^2)$ of each other over any fixed time interval. If the first nonzero correction to $V$ is quartic (as for a symmetric potential), the agreement improves to $O(\varepsilon^3)$.`,
      idea: String.raw`Taylor’s theorem does all the work. The first-order term of $V$ vanishes because $\mathbf q_0$ is an equilibrium, so $V$ starts at second order with the Hessian $K$, symmetric by the equality of mixed partials (pma-9.41). $T$ is already quadratic in $\dot{\boldsymbol\eta}$, so replacing $M(\mathbf q)$ by $M(\mathbf q_0)$ only changes it at third order. Lagrange’s equations (6.6) then turn quadratic forms into linear forces. Over a fixed time, Gronwall’s inequality turns an $O(\varepsilon^2)$ error in the force into an $O(\varepsilon^2)$ error in the motion. This is the many-dimensional version of 4.3.`,
      caption: String.raw`Left, the potential surface with its osculating quadratic bowl (wire mesh); right, the same seen from above, with the true contours (solid) and the quadratic ones (dashed). Drag the gold start point: the true motion (blue) and the linearised one (orange, dashed) are released from rest there. Close to the minimum they are indistinguishable; drag outward and they peel apart. The bottom-right panel measures the deviation over the whole run for a range of amplitudes along the same direction. At small amplitude its slope is the order of the first neglected term minus one: 2 for the even pendulum potential, 1 for the cubic Hénon–Heiles potential (there the curve bends upward as the second-order frequency shift accumulates over the long run).`,
      deps: ['mech-6.6', 'mech-4.3', 'pma-9.41'],
      refs: ['Goldstein §6.1', 'Arnold §22'],
      tags: ['linearisation', 'small oscillations', 'Hessian'],
      viz(v) {
        const M = v.M, T = 25, DT = 0.01, N = Math.round(T / DT);
        const POT = {
          pend: { R: 1.7, RD: 1.7, c: 0.45, V: (x, y) => 1 - Math.cos(x) + 1 - Math.cos(y) + 0.45 * (1 - Math.cos(x - y)), g: (x, y) => [Math.sin(x) + 0.45 * Math.sin(x - y), Math.sin(y) - 0.45 * Math.sin(x - y)], start: [0.55, 0.12], zmax: 3.2, levels: [0.05, 0.15, 0.3, 0.5, 0.8, 1.2, 1.7, 2.3] },
          hh: { R: 0.95, RD: 0.98, V: (x, y) => 0.5 * (x * x + y * y) + x * x * y - (y * y * y) / 3, g: (x, y) => [x + 2 * x * y, y + x * x - y * y], start: [0.3, 0.22], zmax: 0.8, levels: [0.01, 0.03, 0.06, 0.1, 0.1667, 0.25, 0.35] },
        };
        const pick = v.select('potential', [{ value: 'pend', label: 'two coupled pendulums' }, { value: 'hh', label: 'Hénon–Heiles' }], 'pend', { onChange: (k) => { const P = POT[k]; hd.set(P.start[0], P.start[1]); } });
        const s3 = v.stage3d({ range: 1.55, height: 300, yaw: -0.7, pitch: 0.5, labels: ['q₁', 'q₂', 'V'], axes: false });
        const sC = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, height: 300, axes: true, xlabel: '$\\eta_1$', ylabel: '$\\eta_2$' });
        const sX = v.stage({ x: [0, T], y: [-1, 1], axes: 'box', height: 210, weight: 1.2, minWidth: 380, xlabel: 't', title: '$\\eta_1(t)$: true (blue) and linearised (orange)' });
        const sL = v.stage({ x: [0.01, 2], y: [1e-6, 10], xlog: true, ylog: true, axes: 'box', height: 210, weight: 1, minWidth: 380, xlabel: 'amplitude ε', title: 'max deviation over the run ÷ ε' });
        const hd = sC.handle(0.55, 0.12, { color: 'gold', label: 'start', constrain: (x, y) => { const R = POT[pick.value].R * 0.98; return [clamp(x, -R, R), clamp(y, -R, R)]; } });
        const hess = (P) => { const h = 1e-4, V = P.V; return [[(V(h, 0) - 2 * V(0, 0) + V(-h, 0)) / (h * h), (V(h, h) - V(h, -h) - V(-h, h) + V(-h, -h)) / (4 * h * h)], [(V(h, h) - V(-h, h) - V(h, -h) + V(-h, -h)) / (4 * h * h), (V(0, h) - 2 * V(0, 0) + V(0, -h)) / (h * h)]]; };
        const sim = (P, G, x0) => {
          const F = (t, y) => { const g = P.g(y[0], y[1]); return [y[2], y[3], -g[0], -g[1]]; };
          const R = rk4rec(F, [x0[0], x0[1], 0, 0], T, N, 4, (t, y) => Math.abs(y[0]) > 4 || Math.abs(y[1]) > 4);
          const q0 = toModes(G, [[1, 0], [0, 1]], x0), w = G.w2.map(Math.sqrt);
          const lin = R.t.map((t) => fromModes(G, q0.map((q, k) => q * Math.cos(w[k] * t))));
          let dev = 0; for (let i = 0; i < R.t.length; i++) dev = Math.max(dev, Math.hypot(R.y[i][0] - lin[i][0], R.y[i][1] - lin[i][1]));
          if (R.stopped) dev = Infinity;
          return { R, lin, dev };
        };
        const cache = memo(), sweepC = memo();
        let cur = null;
        v.render(() => {
          const P = POT[pick.value], R0 = P.R, K = hess(P), G = genEig([[1, 0], [0, 1]], K, M);
          sC.setView([-R0, R0], [-R0, R0]);
          const x0 = [hd.x, hd.y], eps = Math.hypot(x0[0], x0[1]) || 1e-9, Q = (x, y) => 0.5 * (K[0][0] * x * x + 2 * K[0][1] * x * y + K[1][1] * y * y);
          const S = cache(`${pick.value}|${x0}`, () => sim(P, G, x0));
          const dir = [x0[0] / eps, x0[1] / eps];
          const sw = sweepC(`${pick.value}|${dir}`, () => {
            const out = []; for (let j = 0; j <= 14; j++) { const e = 0.012 * 1.42 ** j; if (e > 0.98 * R0 * Math.SQRT2) break; const r = sim(P, G, [dir[0] * e, dir[1] * e]); out.push([e, r.dev / e]); }
            const fit = out.filter((p) => isFinite(p[1]) && p[0] < 0.03 && p[1] > 1e-12);
            const slope = fit.length > 2 ? M.linreg(fit.map((p) => Math.log(p[0])), fit.map((p) => Math.log(p[1]))).slope : NaN;
            return { out, slope };
          });
          // 3D: surface and osculating bowl, both clipped at zmax
          const zs = 1.5 / P.zmax, sc = 1.5 / R0, zc = (z) => Math.min(z, P.zmax) * zs - 0.75;
          const pol = (f, dz) => (r, a) => { const x = r * Math.cos(a), y = r * Math.sin(a); return [x * sc, y * sc, zc(f(x, y)) + dz]; };
          s3.surface(pol(P.V, 0), [0, P.RD], [0, TAU], { nu: 16, nv: 48, colorFn: (r, a) => v.ramp(0.25 + 0.7 * Math.min(1, P.V(r * Math.cos(a), r * Math.sin(a)) / P.zmax), 'blue'), alpha: 0.9 });
          s3.surface(pol(Q, 0.005), [0, P.RD], [0, TAU], { nu: 10, nv: 36, color: 'orange', alpha: 0.12, wire: true, wireColor: 'orange', shade: false });
          const lift = (pts, f) => pts.map((p) => [p[0] * sc, p[1] * sc, zc(f(p[0], p[1])) + 0.02]);
          s3.path(lift(S.R.y, P.V), { color: 'blue', width: 2.2 });
          s3.path(lift(S.lin, Q), { color: 'orange', width: 1.8, dash: [5, 4] });
          s3.dot([x0[0] * sc, x0[1] * sc, zc(P.V(x0[0], x0[1])) + 0.02], { r: 5, color: 'gold' });
          // top view
          sC.contour(P.V, P.levels, { color: 'muted', width: 1 });
          sC.contour(Q, P.levels, { color: 'orange', width: 1, dash: [4, 4] });
          sC.path(S.R.y.map((y) => [y[0], y[1]]), { color: 'blue', width: 1.8 });
          sC.path(S.lin, { color: 'orange', width: 1.6, dash: [5, 4] });
          for (let k = 0; k < 2; k++) { const a = G.A[k], L = R0 * 0.9 / Math.hypot(a[0], a[1]); sC.line(-a[0] * L, -a[1] * L, a[0] * L, a[1] * L, { color: MODE_COLS[k], width: 1, alpha: 0.45, dash: [2, 5] }); }
          sC.dot(0, 0, { r: 3.5, color: 'ink' });
          // time series of η1
          const am = Math.max(0.05, ...S.R.y.map((y) => Math.abs(y[0])), ...S.lin.map((p) => Math.abs(p[0]))) * 1.15;
          sX.setView([0, T], [-am, am]);
          sX.path(S.R.t.map((t, i) => [t, S.R.y[i][0]]), { color: 'blue', width: 2 });
          sX.path(S.R.t.map((t, i) => [t, S.lin[i][0]]), { color: 'orange', width: 1.6, dash: [5, 4] });
          // deviation against amplitude
          const pts = sw.out.filter((p) => isFinite(p[1]) && p[1] > 0);
          if (pts.length) {
            const [e0, d0] = pts[0];
            for (const [pw, lab] of [[1, 'slope 1'], [2, 'slope 2']]) { sL.fn((e) => d0 * (e / e0) ** pw, { color: 'faint', dash: [4, 4], width: 1.2 }); const el = Math.min(1.8, e0 * (2 / d0) ** (1 / pw)); sL.text(lab, el, d0 * (el / e0) ** pw, { color: 'muted', size: 11, align: 'right', dx: -6, dy: pw === 1 ? 12 : -12 }); }
            sL.path(pts, { color: 'blue', width: 2 }); sL.dots(pts, { r: 3, color: 'blue' });
          }
          if (isFinite(S.dev) && S.dev > 0) sL.dot(eps, S.dev / eps, { r: 6, color: 'gold' });
          cur = { P, K, G, S, eps, sw };
        });
        v.legend([['blue', 'true motion'], ['orange', 'linearised motion (and quadratic bowl)', { dash: true }], ['gold', 'start, released from rest']]);
        v.readout(() => {
          if (!cur) return '';
          const { K, G, S, eps, sw } = cur, f = (x) => v.fix(x, 4);
          const esc = !isFinite(S.dev) ? ' · **the true motion escapes over a saddle**: no linear approximation can follow it' : String.raw` · max deviation $${num(v, S.dev, 4)}$, i.e. ${v.fix((100 * S.dev) / eps, 2)}% of $\varepsilon$`;
          return String.raw`Hessian at the minimum (finite differences) $K = \begin{pmatrix}${f(K[0][0])} & ${f(K[0][1])}\\ ${f(K[1][0])} & ${f(K[1][1])}\end{pmatrix}$ ($\partial_x\partial_y V$ and $\partial_y\partial_x V$ agree) · linear frequencies $\omega = ${v.fix(Math.sqrt(G.w2[0]), 4)}, ${v.fix(Math.sqrt(G.w2[1]), 4)}$ · amplitude $\varepsilon = ${v.fix(eps, 3)}$${esc} · slope of the deviation ÷ ε for $\varepsilon < 0.03$: ${v.fix(sw.slope, 2)}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.4
    {
      num: '11.4',
      kind: 'Theorem',
      name: 'Normal modes: the generalized eigenvalue problem',
      statement: String.raw`Let $M$ and $K$ be real symmetric $n\times n$ matrices with $M$ positive definite, and consider $M\ddot{\boldsymbol\eta} + K\boldsymbol\eta = 0$ (11.3). Then:
(a) The trial solution $\boldsymbol\eta = \mathbf a\cos(\omega t-\varphi)$ works exactly when $K\mathbf a = \omega^2M\mathbf a$: the **generalized eigenvalue problem**. Its eigenvalues $\lambda = \omega^2$ are the $n$ roots of $\det(K-\lambda M) = 0$, and they are all real.
(b) There is a basis of eigenvectors $\mathbf a_1,\dots,\mathbf a_n$ (the **normal modes**) that is orthonormal for $M$ and orthogonal for $K$:
$$\mathbf a_i^{\mathsf T}M\mathbf a_j = \delta_{ij},\qquad \mathbf a_i^{\mathsf T}K\mathbf a_j = \lambda_i\,\delta_{ij}.$$
Geometrically, the ellipsoids $\boldsymbol\eta^{\mathsf T}M\boldsymbol\eta = 1$ and $\boldsymbol\eta^{\mathsf T}K\boldsymbol\eta = 1$ are diagonalised simultaneously: the mode directions are conjugate diameters of both.
(c) If $K$ is positive definite (a strict minimum of $V$), every $\lambda_i > 0$, and every solution is a superposition $\boldsymbol\eta(t) = \sum_i A_i\mathbf a_i\cos(\omega_it-\varphi_i)$ with $\omega_i = \sqrt{\lambda_i}$.
The modes are generally **not** orthogonal in the ordinary sense, and the $\omega_i^2$ are not the eigenvalues of $K$, unless $M$ is a multiple of the identity.`,
      idea: String.raw`Change coordinates so that the kinetic energy becomes the plain sum of squares. With the Cholesky factorization $M = LL^{\mathsf T}$ (ladr-7.63) put $\boldsymbol\xi = L^{\mathsf T}\boldsymbol\eta$: the $M$-ellipse becomes the unit circle, and the problem becomes the ordinary symmetric eigenproblem for $C = L^{-1}KL^{-\mathsf T}$. The real spectral theorem (ladr-7.29) gives real eigenvalues and an orthonormal eigenbasis $\mathbf u_i$ of $C$; a rotation to that basis makes the $K$-ellipse axis-aligned without disturbing the circle. Pulling back, $\mathbf a_i = L^{-\mathsf T}\mathbf u_i$ are $M$-orthonormal and $K$-orthogonal. The eigenvalues are the roots of $\det(C-\lambda I) = \det(K-\lambda M)/\det M$, and $\det M\neq 0$ (pma-9.36), so the two characteristic polynomials have the same roots. Positivity of $K$ makes each $\lambda_i = \mathbf a_i^{\mathsf T}K\mathbf a_i$ positive.`,
      caption: String.raw`Left: configuration space of a two-degree-of-freedom system. The orange curve is the kinetic ellipse $\boldsymbol\eta^{\mathsf T}M\boldsymbol\eta = 1$; the blue and red curves are the potential ellipses at the levels $\omega_1^2$ and $\omega_2^2$. Each touches the orange ellipse exactly at the mode vectors $\pm\mathbf a_k$, and the dots oscillate along the modes at their own frequencies. Slide the coordinate change: first $\boldsymbol\xi = L^{\mathsf T}\boldsymbol\eta$ makes the kinetic ellipse a circle, then a rotation lines the modes up with the axes (normal coordinates). Right: the roots of $\det(K-\lambda M)$ are the $\omega_k^2$; the faint curve $\det(K-\lambda I)$ has different roots unless the mass matrix is a multiple of the identity.`,
      deps: ['mech-11.3', 'fa-12.30', 'pma-9.36', 'ladr-7.29', 'ladr-7.63'],
      see: ['ladr-7.96', 'nla-5.10'],
      refs: ['Goldstein §6.2', 'Taylor §11.5'],
      tags: ['normal modes', 'generalized eigenvalues', 'quadratic forms'],
      viz(v) {
        const Mlib = v.M;
        const m2S = v.slider('mass $m_2/m_1$', 0.25, 4, 2, { log: true });
        const muS = v.slider('inertial coupling $M_{12}/\\sqrt{M_{11}M_{22}}$', -0.7, 0.7, 0.35, { step: 0.01 });
        const k2S = v.slider('coupling spring $k_2/k_1$', 0.1, 3, 0.6, { log: true });
        const k3S = v.slider('right spring $k_3/k_1$', 0.25, 4, 1.5, { log: true });
        const sS = v.slider('coordinate change', 0, 2, 0, { step: 0.01, fmt: (x) => (x < 0.02 ? 'η' : x < 0.99 ? 'η → ξ' : x < 1.01 ? 'ξ = Lᵀη' : x < 1.98 ? 'ξ → q' : 'q (normal)') });
        const sA = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 380, axes: true, weight: 1.15, title: 'original coordinates $\\boldsymbol\\eta$' });
        const sD = v.stage({ x: [0, 3], y: [-1, 1], height: 380, axes: true, weight: 1, xlabel: '$\\lambda$', title: 'characteristic polynomials' });
        let cur = null;
        const sys = () => {
          const m2 = m2S.value, m12 = muS.value * Math.sqrt(m2), k2 = k2S.value, k3 = k3S.value;
          const Mm = [[1, m12], [m12, m2]], K = [[1 + k2, -k2], [-k2, k2 + k3]], G = genEig(Mm, K, Mlib);
          let U = [G.U[0].slice(), G.U[1].slice()], A = [G.A[0].slice(), G.A[1].slice()];
          if (U[0][0] * U[1][1] - U[0][1] * U[1][0] < 0) { U[1] = U[1].map((x) => -x); A[1] = A[1].map((x) => -x); }
          const Lt = [[G.L[0][0], G.L[1][0]], [0, G.L[1][1]]], phi = Math.atan2(-U[0][1], U[0][0]); // Uᵀ is the rotation by −angle(u1)
          return { Mm, K, G, U, A, Lt, phi };
        };
        const mapAt = (S, s) => {
          if (s <= 1) return [[1 - s + s * S.Lt[0][0], s * S.Lt[0][1]], [0, 1 - s + s * S.Lt[1][1]]];
          const a = S.phi * (s - 1), c = Math.cos(a), si = Math.sin(a), L = S.Lt;
          return [[c * L[0][0] - si * L[1][0], c * L[0][1] - si * L[1][1]], [si * L[0][0] + c * L[1][0], si * L[0][1] + c * L[1][1]]];
        };
        const ap = (T, p) => [T[0][0] * p[0] + T[0][1] * p[1], T[1][0] * p[0] + T[1][1] * p[1]];
        v.animate((t) => {
          const S = sys(), s = sS.value, T = mapAt(S, s), w2 = S.G.w2, w = w2.map(Math.sqrt);
          const eT = ellipsePts(S.Mm, 1, T), eV = [0, 1].map((k) => ellipsePts(S.K, w2[k], T));
          let R = 0.5; for (const P of [eT, ...eV]) for (const p of P) R = Math.max(R, Math.abs(p[0]), Math.abs(p[1]));
          R *= 1.18; sA.setView([-R, R], [-R, R]);
          sA.setTitle(s < 0.02 ? 'original coordinates $\\boldsymbol\\eta$' : s < 0.99 ? 'moving to $\\boldsymbol\\xi = L^{\\mathsf T}\\boldsymbol\\eta$' : s < 1.01 ? '$\\boldsymbol\\xi = L^{\\mathsf T}\\boldsymbol\\eta$: kinetic ellipse is a circle' : s < 1.98 ? 'rotating to the eigenbasis of $C$' : 'normal coordinates $\\mathbf q$: both forms diagonal');
          sA.poly(eT, { color: 'orange', width: 2.2, fill: 'orange', fillAlpha: 0.07 });
          for (let k = 0; k < 2; k++) sA.path(eV[k], { color: k ? 'red' : 'blue', width: 1.8 });
          for (let k = 0; k < 2; k++) {
            const col = MODE_COLS[k] === 'blue' ? 'blue' : 'red', a = ap(T, S.A[k]), o = ap(T, S.A[1 - k]), n = Math.hypot(o[0], o[1]) || 1;
            sA.line(-a[0] * 1.6, -a[1] * 1.6, a[0] * 1.6, a[1] * 1.6, { color: col, width: 1, dash: [3, 4], alpha: 0.6 });
            sA.arrow(0, 0, a[0], a[1], { color: col, width: 2.4 });
            const tl = 0.32 * R; // tangent of both ellipses at the tip of a_k: parallel to the other mode
            sA.line(a[0] - (o[0] / n) * tl, a[1] - (o[1] / n) * tl, a[0] + (o[0] / n) * tl, a[1] + (o[1] / n) * tl, { color: 'green', width: 1.6, alpha: 0.85 });
            sA.tex(k ? '\\mathbf a_2' : '\\mathbf a_1', a[0], a[1], { color: col, dx: a[0] >= 0 ? 16 : -16, dy: a[1] >= 0 ? -12 : 12, size: 15 });
            const p = ap(T, S.A[k].map((x) => x * Math.cos(w[k] * 1.6 * t)));
            sA.dot(p[0], p[1], { r: 6, color: col });
          }
          sA.dot(0, 0, { r: 3, color: 'ink' });
          // characteristic polynomials
          const dM = S.Mm[0][0] * S.Mm[1][1] - S.Mm[0][1] ** 2, f = (l) => (S.K[0][0] - l * S.Mm[0][0]) * (S.K[1][1] - l * S.Mm[1][1]) - (S.K[0][1] - l * S.Mm[0][1]) ** 2;
          const g = (l) => (S.K[0][0] - l) * (S.K[1][1] - l) - S.K[0][1] ** 2, eK = Mlib.eigSym(S.K).values.slice().reverse();
          const X1 = 1.25 * Math.max(w2[1], eK[1]), lo = Math.min(f((w2[0] + w2[1]) / 2), g((eK[0] + eK[1]) / 2)), hi = Math.max(f(0), f(X1), 0.2);
          sD.setView([0, X1], [lo - 0.15 * (hi - lo), hi + 0.08 * (hi - lo)]);
          sD.fn(g, { color: 'muted', width: 1.4, dash: [5, 4], alpha: 0.7 });
          sD.fn(f, { color: 'ink', width: 2.4 });
          for (let k = 0; k < 2; k++) { sD.dot(eK[k], 0, { r: 4, hollow: true, color: 'muted' }); }
          for (let k = 0; k < 2; k++) {
            const col = k ? 'red' : 'blue';
            sD.vline(w2[k], { color: col, width: 1, dash: [3, 4], alpha: 0.6 });
            sD.dot(w2[k], 0, { r: 6, color: col });
            sD.tex(k ? '\\omega_2^2' : '\\omega_1^2', w2[k], 0, { color: col, dy: k ? -16 : 16, dx: 18, size: 15 });
          }
          sD.text('det(K − λM)', X1, f(X1), { color: 'ink', size: 12, align: 'right', dy: -10, dx: -4 });
          sD.text('det(K − λI)', X1, g(X1), { color: 'muted', size: 12, align: 'right', dy: -12, dx: -14 });
          cur = { S, dM, eK };
        }, { period: 1e9, still: 1.2 });
        v.legend([['orange', 'kinetic ellipse $\\boldsymbol\\eta^{\\mathsf T}M\\boldsymbol\\eta = 1$'], ['blue', '$\\boldsymbol\\eta^{\\mathsf T}K\\boldsymbol\\eta = \\omega_1^2$, mode 1'], ['red', '$\\boldsymbol\\eta^{\\mathsf T}K\\boldsymbol\\eta = \\omega_2^2$, mode 2'], ['green', 'common tangent: parallel to the other mode']]);
        v.readout(() => {
          if (!cur) return '';
          const { S, eK } = cur, a = S.A, M_ = S.Mm, K = S.K, cosE = (a[0][0] * a[1][0] + a[0][1] * a[1][1]) / (Math.hypot(...a[0]) * Math.hypot(...a[1]));
          return String.raw`Roots of $\det(K-\lambda M)$: $\omega_1^2 = ${v.fix(S.G.w2[0], 4)}$, $\omega_2^2 = ${v.fix(S.G.w2[1], 4)}$ (eigenvalues of $K$ alone: ${v.fix(eK[0], 4)}, ${v.fix(eK[1], 4)}) · $\mathbf a_1^{\mathsf T}M\mathbf a_2 = ${sci(v, qf(M_, a[0], a[1]))}$, $\mathbf a_1^{\mathsf T}K\mathbf a_2 = ${sci(v, qf(K, a[0], a[1]))}$, $\mathbf a_k^{\mathsf T}M\mathbf a_k = ${v.fix(qf(M_, a[0]), 6)}, ${v.fix(qf(M_, a[1]), 6)}$ · but the ordinary angle between the modes is ${v.fix(Math.acos(clamp(cosE, -1, 1)) / DEG, 1)}°, not 90°`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.5
    {
      num: '11.5',
      kind: 'Definition',
      name: 'Normal coordinates',
      statement: String.raw`Let $\mathbf a_1,\dots,\mathbf a_n$ be the normal modes of $M\ddot{\boldsymbol\eta} + K\boldsymbol\eta = 0$, normalised so that $\mathbf a_i^{\mathsf T}M\mathbf a_j = \delta_{ij}$ (11.4), and let $A$ be the matrix with columns $\mathbf a_i$. The **normal coordinates** $q_1,\dots,q_n$ of a configuration $\boldsymbol\eta$ are its components in this basis:
$$\boldsymbol\eta = \sum_k q_k\mathbf a_k = A\mathbf q,\qquad q_k = \mathbf a_k^{\mathsf T}M\boldsymbol\eta .$$
In them the quadratic Lagrangian separates into $n$ independent oscillators,
$$L = \tfrac12\dot{\boldsymbol\eta}^{\mathsf T}M\dot{\boldsymbol\eta} - \tfrac12\boldsymbol\eta^{\mathsf T}K\boldsymbol\eta = \sum_{k=1}^n\Big(\tfrac12\dot q_k^2 - \tfrac12\omega_k^2q_k^2\Big),\qquad \ddot q_k = -\omega_k^2q_k ,$$
so each $q_k(t) = q_k(0)\cos\omega_kt + \dot q_k(0)\sin(\omega_kt)/\omega_k$ evolves on its own and carries its own conserved energy $\tfrac12(\dot q_k^2+\omega_k^2q_k^2)$.`,
      idea: String.raw`Substitute $\boldsymbol\eta = A\mathbf q$: then $T = \tfrac12\dot{\mathbf q}^{\mathsf T}(A^{\mathsf T}MA)\dot{\mathbf q}$ and $V = \tfrac12\mathbf q^{\mathsf T}(A^{\mathsf T}KA)\mathbf q$, and the two orthogonality relations of 11.4 say $A^{\mathsf T}MA = I$ and $A^{\mathsf T}KA = \mathrm{diag}(\omega_k^2)$. No cross terms survive, so Lagrange’s equations (6.6) decouple. The formula $q_k = \mathbf a_k^{\mathsf T}M\boldsymbol\eta$ is the $M$-inner product with the $k$-th basis vector, as for any orthonormal basis. Normal coordinates are what is later quantised to give phonons.`,
      caption: String.raw`Drag the gold point to choose where the two carts start (released from rest). Left: the configuration point $(x_1, x_2)$ traces a tilted Lissajous figure that fills a parallelogram whose sides are parallel to the mode vectors. Right: the same motion in normal coordinates $q_k = \mathbf a_k^{\mathsf T}M\mathbf x$ fills an axis-aligned rectangle, because each $q_k$ oscillates alone. Bottom: the carts beat irregularly, while each normal coordinate is a pure cosine (the dashed curves are $q_k(0)\cos\omega_kt$).`,
      deps: ['mech-11.4'],
      see: ['qm-4.11', 'mech-4.6'],
      refs: ['Taylor §11.7', 'Goldstein §6.3'],
      tags: ['normal coordinates', 'decoupling'],
      viz(v) {
        const Mlib = v.M, TR = 160, RATE = 4, DT = 0.01, EV = 5;
        const m2S = v.slider('mass $m_2/m_1$', 0.3, 3, 1.6, { log: true });
        const k2S = v.slider('middle spring $k_2/k_1$', 0.1, 2, 0.5, { log: true });
        const sX = v.stage({ x: [-0.8, 0.8], y: [-0.8, 0.8], equal: true, height: 320, axes: true, xlabel: '$x_1$', ylabel: '$x_2$', title: 'cart displacements $(x_1, x_2)$' });
        const sQ = v.stage({ x: [-0.8, 0.8], y: [-0.8, 0.8], equal: true, height: 320, axes: true, xlabel: '$q_1$', ylabel: '$q_2$', title: 'normal coordinates $(q_1, q_2)$' });
        const sTx = v.stage({ x: [0, 40], y: [-1.1, 1.1], axes: 'box', height: 170, minWidth: 380, xlabel: 't', yticks: [], title: '$x_1(t)$, $x_2(t)$: coupled' });
        const sTq = v.stage({ x: [0, 40], y: [-1.1, 1.1], axes: 'box', height: 170, minWidth: 380, xlabel: 't', yticks: [], title: '$q_1(t)$, $q_2(t)$: each a pure cosine' });
        const hd = sX.handle(0.5, 0.12, { color: 'gold', constrain: (x, y) => [clamp(x, -0.7, 0.7), clamp(y, -0.7, 0.7)] });
        hd.onDrag = () => v.restart();
        const cache = memo(); let cur = null;
        const run = () => cache([m2S.value, k2S.value, hd.x, hd.y].join('|'), () => {
          const m2 = m2S.value, k2 = k2S.value, Mm = [[1, 0], [0, m2]], K = [[1 + k2, -k2], [-k2, 1 + k2]], G = genEig(Mm, K, Mlib);
          const R = verletLin([[1, 0], [0, 1 / m2]], K, [hd.x, hd.y], [0, 0], DT, Math.round(TR / DT), EV);
          const q = R.x.map((x) => toModes(G, Mm, x)), qd = R.v.map((u) => toModes(G, Mm, u)), w = G.w2.map(Math.sqrt), q0 = q[0];
          let err = 0; for (let i = 0; i < q.length; i++) for (let k = 0; k < 2; k++) err = Math.max(err, Math.abs(q[i][k] - q0[k] * Math.cos(w[k] * R.t[i])));
          return { m2, k2, Mm, K, G, R, q, qd, w, q0, err };
        });
        v.animate((t) => {
          const B = run(), tau = Math.min(RATE * t, TR), i = idxAt(B.R, tau), A = B.G.A, x = B.R.x[i], q = B.q[i];
          // configuration space
          for (let k = 0; k < 2; k++) { const a = A[k]; sX.line(-a[0] * 3, -a[1] * 3, a[0] * 3, a[1] * 3, { color: MODE_COLS[k], width: 1, dash: [3, 4], alpha: 0.7 }); sX.tex(k ? '\\mathbf a_2' : '\\mathbf a_1', a[0] * 0.62, a[1] * 0.62, { color: MODE_COLS[k], dx: 12, dy: -10, size: 14 }); }
          const Q = B.q0.map(Math.abs), corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([s1, s2]) => fromModes(B.G, [s1 * Q[0], s2 * Q[1]]));
          sX.poly(corners, { color: 'green', width: 1.4, dash: [5, 4], fill: 'green', fillAlpha: 0.05 });
          series(sX, B.R.x.map((p) => p[0]), B.R.x.map((p) => p[1]), i, { color: 'purple', width: 1.3, alpha: 0.8 });
          sX.dot(x[0], x[1], { r: 5.5, color: 'purple' });
          // normal coordinates
          const RQ = 1.3 * Math.max(0.25, Q[0], Q[1]); sQ.setView([-RQ, RQ], [-RQ, RQ]);
          sQ.rect(-Q[0], -Q[1], Q[0], Q[1], { color: 'green', width: 1.4, dash: [5, 4], fill: 'green', fillAlpha: 0.05 });
          sQ.line(-RQ, 0, RQ, 0, { color: 'blue', width: 1, dash: [3, 4], alpha: 0.7 }); sQ.line(0, -RQ, 0, RQ, { color: 'orange', width: 1, dash: [3, 4], alpha: 0.7 });
          series(sQ, B.q.map((p) => p[0]), B.q.map((p) => p[1]), i, { color: 'purple', width: 1.3, alpha: 0.8 });
          sQ.dot(q[0], q[1], { r: 5.5, color: 'purple' });
          // time series (scrolling window)
          const W = 40, t0 = Math.max(0, tau - W + 4), i0 = idxAt(B.R, t0);
          const seg = (s, f, st) => { const pts = []; for (let j = i0; j <= i; j++) pts.push([B.R.t[j], f(j)]); s.path(pts, st); };
          for (const s of [sTx, sTq]) s.setView([t0, t0 + W], [-1.1, 1.1]);
          const sc = 0.42 / Math.max(0.05, Math.abs(hd.x), Math.abs(hd.y)), sq = 0.42 / Math.max(0.05, Q[0], Q[1]);
          for (let c = 0; c < 2; c++) {
            const off = c ? -0.55 : 0.55;
            sTx.hline(off, { color: 'faint', width: 1 }); sTq.hline(off, { color: 'faint', width: 1 });
            seg(sTx, (j) => off + sc * B.R.x[j][c], { color: c ? 'teal' : 'purple', width: 1.8 });
            sTq.fn((tt) => off + sq * B.q0[c] * Math.cos(B.w[c] * tt), { color: MODE_COLS[c], width: 1, dash: [4, 4], alpha: 0.7 });
            seg(sTq, (j) => off + sq * B.q[j][c], { color: MODE_COLS[c], width: 1.8 });
            sTx.tex(c ? 'x_2' : 'x_1', t0 + 1, off + 0.4, { color: c ? 'teal' : 'purple', size: 14 });
            sTq.tex(c ? 'q_2' : 'q_1', t0 + 1, off + 0.4, { color: MODE_COLS[c], size: 14 });
          }
          cur = { B, i };
        }, { period: TR / RATE + 1, still: 20 });
        v.legend([['purple', 'trajectory'], ['green', 'box $|q_k| \\le |q_k(0)|$', { dash: true }], ['blue', 'mode 1 direction', { dash: true }], ['orange', 'mode 2 direction', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, x = B.R.x[i], u = B.R.v[i], q = B.q[i], qd = B.qd[i];
          const T = 0.5 * qf(B.Mm, u), V = 0.5 * qf(B.K, x), Tq = 0.5 * (qd[0] ** 2 + qd[1] ** 2), Vq = 0.5 * (B.G.w2[0] * q[0] ** 2 + B.G.w2[1] * q[1] ** 2);
          return String.raw`$\omega_1 = ${v.fix(B.w[0], 4)}$, $\omega_2 = ${v.fix(B.w[1], 4)}$ · at this instant $T - \tfrac12\sum\dot q_k^2 = ${sci(v, T - Tq)}$ and $V - \tfrac12\sum\omega_k^2q_k^2 = ${sci(v, V - Vq)}$ (round-off: the forms are diagonal) · largest gap between $q_k(t)$ and $q_k(0)\cos\omega_kt$ over the run: $${sci(v, B.err)}$ (integration error of the coupled equations)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.6
    {
      num: '11.6',
      kind: 'Model',
      name: 'Double pendulum: small oscillations',
      statement: String.raw`A double pendulum (masses $m_1, m_2$ on massless rods $\ell_1, \ell_2$, angles $\theta_1, \theta_2$ from the vertical, gravity $g$) has, to second order in the angles,
$$T = \tfrac12(m_1+m_2)\ell_1^2\dot\theta_1^2 + m_2\ell_1\ell_2\dot\theta_1\dot\theta_2 + \tfrac12m_2\ell_2^2\dot\theta_2^2,\qquad V = \tfrac12(m_1+m_2)g\ell_1\theta_1^2 + \tfrac12m_2g\ell_2\theta_2^2 ,$$
so the mass matrix $M = \begin{pmatrix}(m_1+m_2)\ell_1^2 & m_2\ell_1\ell_2\\ m_2\ell_1\ell_2 & m_2\ell_2^2\end{pmatrix}$ has an off-diagonal (inertial) coupling, while $K = \mathrm{diag}\big((m_1+m_2)g\ell_1,\ m_2g\ell_2\big)$ is diagonal. For equal masses and lengths $\ell$, $\det(K-\omega^2M) = 0$ gives
$$\omega^2 = (2\mp\sqrt2)\,\frac g\ell,\qquad \omega_1 \approx 0.765\sqrt{g/\ell},\quad \omega_2 \approx 1.848\sqrt{g/\ell},$$
with mode shapes $\theta_2/\theta_1 = +\sqrt2$ (slow, both rods swinging the same way) and $\theta_2/\theta_1 = -\sqrt2$ (fast, the lower rod swinging against the upper one).`,
      scope: String.raw`The normal modes describe the motion only while the angles stay small (a few degrees to a few tens of degrees, depending on how pure the result must be). At larger amplitudes the neglected terms couple the modes, energy leaks from one into the other, and beyond roughly 1 rad the motion can become chaotic.`,
      idea: String.raw`Expand $\cos(\theta_1-\theta_2)\approx 1$ in the kinetic energy and $1-\cos\theta\approx\theta^2/2$ in the potential (11.3). The coupling sits in $M$, not in $K$: the lower bob feels the upper one through the moving pivot. Then solve the $2\times2$ generalized eigenproblem (11.4). The slow mode keeps the rods nearly aligned, so it behaves like a single pendulum somewhat longer than $\ell$. In the fast mode the lower bob whips against the upper one, raising the effective stiffness.`,
      caption: String.raw`The pendulum is integrated from the full nonlinear equations, released from rest in the chosen mode. Right: the configuration $(\theta_1,\theta_2)$ in degrees, with the two mode lines. At small amplitude a pure mode stays on its line, and the strip below shows all the energy staying in that mode. Raise the amplitude: the trajectory leaves the line, energy leaks into the other mode, and the measured frequency drifts below the linear prediction.`,
      deps: ['mech-11.4'],
      see: ['mech-4.4'],
      refs: ['Taylor §11.4', 'Tong §2.6'],
      tags: ['double pendulum', 'normal modes', 'nonlinearity'],
      viz(v) {
        const Mlib = v.M, g = 9.81, TR = 20, DT = 0.002, EV = 5;
        const modeS = v.select('start in', [{ value: 0, label: 'slow mode' }, { value: 1, label: 'fast mode' }, { value: 2, label: 'upper rod only' }], 0);
        const aS = v.slider('amplitude (largest angle, °)', 1, 100, 10, { step: 0.5 });
        const mS = v.slider('mass ratio $m_2/m_1$', 0.2, 3, 1, { log: true });
        const lS = v.slider('length ratio $\\ell_2/\\ell_1$', 0.4, 2, 1, { log: true });
        const sP = v.stage({ x: [-2.1, 2.1], y: [-2.15, 0.25], equal: true, axes: false, height: 320, title: 'the double pendulum ($\\ell_1$ = 1 m)' });
        const sC = v.stage({ x: [-15, 15], y: [-15, 15], equal: true, axes: true, height: 320, xlabel: '$\\theta_1$ (°)', ylabel: '$\\theta_2$ (°)', title: 'configuration space' });
        const sE = v.stage({ x: [0, TR], y: [-0.06, 1.12], axes: 'box', height: 150, full: true, xlabel: 't (s)', yticks: [0, 0.5, 1], title: 'share of the (linearised) energy in each mode' });
        const cache = memo(); let cur = null;
        const run = () => cache([modeS.value, aS.value, mS.value, lS.value].join('|'), () => {
          const m1 = 1, m2 = mS.value, l1 = 1, l2 = lS.value;
          const Mm = [[(m1 + m2) * l1 * l1, m2 * l1 * l2], [m2 * l1 * l2, m2 * l2 * l2]], K = [[(m1 + m2) * g * l1, 0], [0, m2 * g * l2]], G = genEig(Mm, K, Mlib);
          const amp = aS.value * DEG, md = +modeS.value;
          const dir = md === 2 ? [1, 0] : G.A[md], sc = amp / Math.max(Math.abs(dir[0]), Math.abs(dir[1]));
          const F = (t, y) => {
            const [a1, a2, w1, w2] = y, d = a1 - a2, den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
            const dd1 = (-g * (2 * m1 + m2) * Math.sin(a1) - m2 * g * Math.sin(a1 - 2 * a2) - 2 * Math.sin(d) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(d))) / (l1 * den);
            const dd2 = (2 * Math.sin(d) * (w1 * w1 * l1 * (m1 + m2) + g * (m1 + m2) * Math.cos(a1) + w2 * w2 * l2 * m2 * Math.cos(d))) / (l2 * den);
            return [w1, w2, dd1, dd2];
          };
          const R = rk4rec(F, [dir[0] * sc, dir[1] * sc, 0, 0], TR, Math.round(TR / DT), EV);
          const En = (y) => 0.5 * (m1 + m2) * l1 * l1 * y[2] ** 2 + 0.5 * m2 * l2 * l2 * y[3] ** 2 + m2 * l1 * l2 * y[2] * y[3] * Math.cos(y[0] - y[1]) - (m1 + m2) * g * l1 * Math.cos(y[0]) - m2 * g * l2 * Math.cos(y[1]);
          const E0 = En(R.y[0]); let drift = 0;
          const shares = R.y.map((y) => {
            drift = Math.max(drift, Math.abs(En(y) - E0));
            const q = toModes(G, Mm, [y[0], y[1]]), qd = toModes(G, Mm, [y[2], y[3]]), e = q.map((qq, k) => 0.5 * (qd[k] ** 2 + G.w2[k] * qq * qq)), s = e[0] + e[1] || 1;
            return [e[0] / s, e[1] / s, q];
          });
          const w = G.w2.map(Math.sqrt), main = md === 2 ? null : md;
          let purity = NaN, wMeas = NaN;
          if (main != null) { purity = Math.min(...shares.map((s) => s[main])); wMeas = TAU / meanGap(upCrossings(R.t, shares.map((s) => s[2][main]))); }
          let am = 0; for (const y of R.y) am = Math.max(am, Math.abs(y[0]), Math.abs(y[1]));
          return { m2, l2, Mm, K, G, R, shares, w, main, purity, wMeas, drift: drift / Math.abs((m1 + m2) * g * l1 + m2 * g * l2), am, eq: Math.abs(m2 - 1) < 1e-9 && Math.abs(l2 - 1) < 1e-9 };
        });
        v.animate((t) => {
          const B = run(), tau = Math.min(t, TR), i = idxAt(B.R, tau), y = B.R.y[i], l2 = B.l2, L = 1 + l2;
          sP.setView([-1.05 * L, 1.05 * L], [-1.08 * L, 0.18 * L]);
          hatch(v, sP, -0.4, 0, 0.4, 0, -1);
          const p1 = [Math.sin(y[0]), -Math.cos(y[0])], p2 = [p1[0] + l2 * Math.sin(y[1]), p1[1] - l2 * Math.cos(y[1])];
          const tr = []; for (let j = Math.max(0, i - 160); j <= i; j++) { const q = B.R.y[j]; tr.push([Math.sin(q[0]) + l2 * Math.sin(q[1]), -Math.cos(q[0]) - l2 * Math.cos(q[1])]); }
          sP.line(0, 0, 0, -L, { color: 'faint', width: 1, dash: [2, 4] });
          sP.path(tr, { color: 'gold', width: 1.6, alpha: 0.6 });
          sP.line(0, 0, p1[0], p1[1], { color: 'ink', width: 2 }); sP.line(p1[0], p1[1], p2[0], p2[1], { color: 'ink', width: 2 });
          sP.dot(0, 0, { r: 3, color: 'ink' });
          sP.dot(p1[0], p1[1], { r: 9, color: 'purple' }); sP.dot(p2[0], p2[1], { r: 9 * Math.cbrt(B.m2), color: 'teal' });
          sP.corner(`t = ${v.fix(tau, 1)} s`, 'tl');
          // configuration space
          const R = Math.max(3, (B.am / DEG) * 1.25); sC.setView([-R, R], [-R, R]);
          for (let k = 0; k < 2; k++) {
            const a = B.G.A[k], s = (2 * R) / Math.hypot(a[0], a[1]);
            sC.line(-a[0] * s, -a[1] * s, a[0] * s, a[1] * s, { color: MODE_COLS[k], width: 1.6, alpha: 0.75, dash: [6, 4] });
            const u = 0.78 * R / Math.max(Math.abs(a[0]), Math.abs(a[1]));
            sC.text(k ? 'fast mode' : 'slow mode', a[0] * u, a[1] * u, { color: MODE_COLS[k], size: 11.5, align: 'center', dy: k ? 12 : -12, weight: 600 });
          }
          series(sC, B.R.y.map((q) => q[0] / DEG), B.R.y.map((q) => q[1] / DEG), i, { color: 'purple', width: 1.4, alpha: 0.85 });
          sC.dot(y[0] / DEG, y[1] / DEG, { r: 5, color: 'gold' });
          // mode shares
          sE.hline(1, { color: 'faint', width: 1 });
          series(sE, B.R.t, B.shares.map((s) => s[0]), i, { color: 'blue', width: 2 });
          series(sE, B.R.t, B.shares.map((s) => s[1]), i, { color: 'orange', width: 2 });
          sE.vline(tau, { color: 'gold', width: 1.2 });
          cur = B;
        }, { period: TR + 1, still: 8 });
        v.legend([['blue', 'slow mode'], ['orange', 'fast mode'], ['purple', 'trajectory $(\\theta_1, \\theta_2)$'], ['gold', 'path of the lower bob']]);
        v.readout(() => {
          if (!cur) return '';
          const B = cur, sq = Math.sqrt(g);
          let s = String.raw`Linear theory: $\omega_1 = ${v.fix(B.w[0], 3)}$ rad/s, $\omega_2 = ${v.fix(B.w[1], 3)}$ rad/s`;
          if (B.eq) s += String.raw` (equal masses and lengths: $\sqrt{2\mp\sqrt2}\,\sqrt{g/\ell} = ${v.fix(Math.sqrt(2 - Math.SQRT2) * sq, 3)}, ${v.fix(Math.sqrt(2 + Math.SQRT2) * sq, 3)}$)`;
          s += String.raw` · mode shapes $\theta_2/\theta_1 = ${v.fix(B.G.A[0][1] / B.G.A[0][0], 3)}$ and $${v.fix(B.G.A[1][1] / B.G.A[1][0], 3)}$`;
          if (B.main != null) s += String.raw` · measured frequency of the excited mode ${v.fix(B.wMeas, 3)} rad/s (${v.fix(100 * (B.wMeas / B.w[B.main] - 1), 2)}% from linear) · it keeps at least ${v.fix(100 * B.purity, 2)}% of the energy`;
          return s + String.raw` · energy drift $${sci(v, B.drift)}$ of $mg\ell$ (RK4)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.7
    {
      num: '11.7',
      kind: 'Model',
      name: 'Linear triatomic molecule',
      statement: String.raw`Model a linear symmetric molecule such as CO₂ as an end mass $m$, a central mass $M$ and another end mass $m$ on a line, joined by two bond springs of stiffness $k$. For motion along the axis,
$$\mathrm{diag}(m, M, m)\,\ddot{\mathbf x} = -k\begin{pmatrix}1&-1&0\\-1&2&-1\\0&-1&1\end{pmatrix}\mathbf x ,$$
and the normal modes are:
(a) a **translation** with $\omega = 0$ (no restoring force: momentum conservation, 7.4);
(b) the **symmetric stretch**, in which the centre stays still and the ends move oppositely, $\omega_1 = \sqrt{k/m}$;
(c) the **antisymmetric stretch**, in which both ends move one way and the centre the other, $\omega_3 = \sqrt{k/m}\,\sqrt{1+2m/M}$.

Thus $\omega_3/\omega_1 = \sqrt{1+2m/M}$ depends only on the masses. Bending perpendicular to the axis adds a doubly degenerate mode $\omega_2$ (a molecule of $N = 3$ atoms on a line has $3N-5 = 4$ vibrations). A mode absorbs infrared light only if it changes the dipole moment: the symmetric stretch of CO₂ is **IR-inactive** (it is seen in Raman scattering), while the antisymmetric stretch and the bend are IR-active. Measured CO₂ fundamentals: bend 667 cm⁻¹, antisymmetric stretch 2349 cm⁻¹, symmetric stretch ≈ 1333 cm⁻¹ (in Fermi resonance with the bend overtone, which splits it into Raman lines at 1285 and 1388 cm⁻¹). The nearest-neighbour model predicts $\nu_3/\nu_1 = \sqrt{1+2\cdot16/12} = 1.915$, against the observed $2349/1333 = 1.762$.`,
      scope: String.raw`Harmonic, nearest-neighbour springs. Real molecules have an interaction between the two bonds (a cross term $k'\,s_1s_2$ in $V$) that raises $\nu_1$ and lowers $\nu_3$; anharmonicity and Fermi resonance shift the observed bands by further percent-level amounts.`,
      idea: String.raw`The $3\times3$ generalized eigenproblem (11.4) is solved by symmetry. Swapping the two end atoms leaves the molecule unchanged, so every mode is either symmetric or antisymmetric under the swap. The symmetric stretch cannot move the centre (that would shift the centre of mass), so only the bond stiffness and the end mass enter, and $\omega_1^2 = k/m$. The two antisymmetric motions are fixed by keeping the centre of mass at rest, $2mx_{\rm end} + Mx_{\rm C} = 0$, leaving one stretch whose reduced mass is smaller, hence $\omega_3^2 = (k/m)(1+2m/M)$. With partial charges $-\delta, +2\delta, -\delta$ the dipole moment changes as $\sum q_ix_i$, which vanishes for the symmetric stretch and not for the others.`,
      caption: String.raw`Pick a mode: the molecule vibrates in that mode (amplitudes exaggerated) with its partial charges and its instantaneous dipole moment (purple arrow), traced on the right over time. The symmetric stretch never changes the dipole, so it is invisible to infrared light. The spectrum compares the model’s lines with the measured CO₂ bands (red = IR-active, blue = Raman only). Change the masses, or try the ¹³C isotope: only the antisymmetric stretch and the bend move, because the centre is at rest in the symmetric stretch. The cross-term slider and the fit button show how a small bond–bond interaction repairs the ratio $\nu_3/\nu_1$.`,
      deps: ['mech-11.4', 'mech-7.4'],
      see: ['qchem-8.10', 'qchem-8.11', 'qchem-9.7'],
      refs: ['Goldstein §6.4', 'Tong §2.6'],
      tags: ['molecular vibrations', 'normal modes', 'infrared'],
      viz(v) {
        const Mlib = v.M, U = 1.66053906660e-27, CC = 2.99792458e10, OBS = { n1: 1333, n2: 667, n3: 2349 };
        const nu = (w2) => Math.sqrt(Math.max(0, w2)) / (TAU * CC);
        const omegaOf = (nub) => TAU * CC * nub;
        const KB = (omegaOf(OBS.n2) ** 2 * 15.995 * U) / (2 * (1 + (2 * 15.995) / 12)); // bending constant fitted once to ν₂ of ¹²C¹⁶O₂
        const modeS = v.select('mode', [{ value: 'trans', label: 'translation' }, { value: 'sym', label: 'symmetric stretch' }, { value: 'anti', label: 'antisymmetric stretch' }, { value: 'bend', label: 'bend' }], 'anti');
        const mS = v.slider('end atoms $m$ (u)', 1, 40, 15.995, { step: 0.001, decimals: 3 });
        const MS = v.slider('central atom $M$ (u)', 1, 40, 12, { step: 0.001, decimals: 3 });
        const kS = v.slider('bond stiffness $k$ (N/m)', 400, 3000, 1676, { step: 1 });
        const xS = v.slider("bond–bond cross term $k'/k$", -0.2, 0.2, 0, { step: 0.0005, decimals: 4 });
        const k1333 = () => (omegaOf(OBS.n1) ** 2 * mS.value * U) / (1 + xS.value);
        v.button('¹²C¹⁶O₂', () => { mS.set(15.995); MS.set(12); xS.set(0); kS.set(Math.round(k1333())); });
        v.button('¹³C¹⁶O₂', () => { mS.set(15.995); MS.set(13.003); });
        v.button("fit k, k′ to CO₂", () => {
          mS.set(15.995); MS.set(12);
          const rho = (OBS.n3 / OBS.n1) ** 2 / (1 + (2 * 15.995) / 12), x = (1 - rho) / (1 + rho);
          xS.set(x); kS.set((omegaOf(OBS.n1) ** 2 * 15.995 * U) / (1 + x));
        });
        const sM = v.stage({ x: [-3.1, 3.1], y: [-1.15, 1.2], equal: true, axes: false, height: 220, full: true });
        const sS = v.stage({ x: [0, 2700], y: [0, 2.15], axes: 'box', height: 230, weight: 1.3, yticks: [], title: 'wavenumber (cm⁻¹): model (top), measured CO₂ (bottom)' });
        const sD = v.stage({ x: [0, 3], y: [-1.2, 1.2], axes: 'box', height: 230, weight: 1, yticks: [[0, '0']], title: 'dipole moment over three periods of the mode' });
        let cur = null;
        const solve = () => {
          const m = mS.value * U, Mc = MS.value * U, k = kS.value, kx = xS.value * k;
          const Mm = [[m, 0, 0], [0, Mc, 0], [0, 0, m]];
          const b1 = [-1, 1, 0], b2 = [0, -1, 1], K = b1.map((_, i) => b1.map((__, j) => k * (b1[i] * b1[j] + b2[i] * b2[j]) + kx * (b1[i] * b2[j] + b2[i] * b1[j])));
          const g = [1, -2, 1], Ky = g.map((gi) => g.map((gj) => KB * gi * gj));
          const scl = 1e-26, Gs = genEig(Mm.map((r) => r.map((x) => x / scl)), K, Mlib), Gb = genEig(Mm.map((r) => r.map((x) => x / scl)), Ky, Mlib);
          const w2s = Gs.w2.map((x) => x / scl), w2b = Gb.w2.map((x) => x / scl);
          const iS = Math.abs(Gs.A[1][1]) < Math.abs(Gs.A[2][1]) ? 1 : 2, iA = 3 - iS;
          const q = [-1, 2, -1], dip = (a) => Math.abs(q[0] * a[0] + q[1] * a[1] + q[2] * a[2]) / Math.hypot(...a);
          const modes = {
            trans: { a: Gs.A[0], w2: 0, dir: 'x', ir: false },
            sym: { a: Gs.A[iS], w2: w2s[iS], dir: 'x', ir: dip(Gs.A[iS]) > 1e-6 },
            anti: { a: Gs.A[iA], w2: w2s[iA], dir: 'x', ir: dip(Gs.A[iA]) > 1e-6 },
            bend: { a: Gb.A[2], w2: w2b[2], dir: 'y', ir: dip(Gb.A[2]) > 1e-6 },
          };
          return { m: mS.value, Mc: MS.value, k, x: xS.value, modes, n1: nu(modes.sym.w2), n3: nu(modes.anti.w2), n2: nu(modes.bend.w2) };
        };
        v.animate((t) => {
          const S = solve(), md = S.modes[modeS.value], X0 = [-1.55, 0, 1.55], q = [-1, 2, -1];
          const a = md.a, am = 0.32 / Math.max(...a.map(Math.abs)), fdisp = md.w2 > 0 ? 0.55 * nu(md.w2) / OBS.n1 : 0;
          let c = Math.cos(TAU * fdisp * t), dx = a.map((x) => x * am * c), dy = [0, 0, 0];
          if (modeS.value === 'trans') { const s = (((0.25 * t) % 2) + 2) % 2 - 1; dx = [s, s, s].map((u) => u * 0.9); c = NaN; }
          if (md.dir === 'y') { dy = dx; dx = [0, 0, 0]; }
          const P = X0.map((x0, i) => [x0 + dx[i], dy[i]]);
          for (let i = 0; i < 3; i++) sM.line(X0[i], -0.62, X0[i], 0.62, { color: 'faint', width: 1, dash: [2, 4] });
          for (const [i, j] of [[0, 1], [1, 2]]) {
            const L = Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1]), e = L - 1.55, ux = (P[j][0] - P[i][0]) / L, uy = (P[j][1] - P[i][1]) / L, r0 = 0.3, r1 = 0.3;
            spring(sM, P[i][0] + ux * r0, P[i][1] + uy * r0, P[j][0] - ux * r1, P[j][1] - uy * r1, { n: 6, w: 0.07, color: e > 0.01 ? 'red' : e < -0.01 ? 'blue' : 'muted', width: 1.8 });
          }
          const rad = (mm) => 0.13 * Math.cbrt(mm);
          for (let i = 0; i < 3; i++) {
            const col = i === 1 ? 'muted' : 'red', mm = i === 1 ? S.Mc : S.m;
            sM.circle(P[i][0], P[i][1], rad(mm), { fill: col, fillAlpha: 0.35, color: col, width: 2 });
            sM.text(i === 1 ? '2δ+' : 'δ−', P[i][0], P[i][1] + rad(mm) + 0.16, { color: col, size: 12, align: 'center', weight: 600 });
          }
          sM.text(`m = ${v.fix(S.m, 2)} u`, X0[0], -0.95, { color: 'red', size: 11.5, align: 'center' });
          sM.text(`M = ${v.fix(S.Mc, 2)} u`, X0[1], -0.95, { color: 'muted', size: 11.5, align: 'center' });
          sM.text(`m = ${v.fix(S.m, 2)} u`, X0[2], -0.95, { color: 'red', size: 11.5, align: 'center' });
          const mu = [q.reduce((s, qq, i) => s + qq * dx[i], 0), q.reduce((s, qq, i) => s + qq * dy[i], 0)];
          if (modeS.value !== 'trans' && Math.hypot(mu[0], mu[1]) > 0.004) sM.arrow(2.35, -0.25, 2.35 + mu[0] * 0.7, -0.25 + mu[1] * 0.7, { color: 'purple', width: 3 });
          sM.text('dipole', 2.35, -0.62, { color: 'purple', size: 11.5, align: 'center' });
          sM.corner(md.w2 > 0 ? `${modeS.value === 'bend' ? 'bend $\\nu_2$' : modeS.value === 'sym' ? 'symmetric stretch $\\nu_1$' : 'antisymmetric stretch $\\nu_3$'} = ${v.fix(nu(md.w2), 0)} cm⁻¹ · ${md.ir ? 'IR-active' : 'IR-inactive (Raman)'}` : 'translation: ω = 0, no restoring force', 'tl', { color: md.ir ? 'red' : 'blue', weight: 600 });
          // spectrum
          const sticks = [['sym', '\\nu_1'], ['bend', '\\nu_2'], ['anti', '\\nu_3']];
          sS.hline(1.1, { color: 'faint', width: 1 });
          sS.text('model', 40, 2.02, { color: 'ink', size: 11.5, weight: 600 }); sS.text('measured ¹²C¹⁶O₂', 40, 0.94, { color: 'ink', size: 11.5, weight: 600 });
          for (const [key, lab] of sticks) {
            const M_ = S.modes[key], n = nu(M_.w2), col = M_.ir ? 'red' : 'blue', on = modeS.value === key;
            if (n > 0 && n < 2700) { sS.line(n, 1.2, n, 1.8, { color: col, width: on ? 4 : 2.4 }); sS.tex(`${lab}\\ ${v.fix(n, 0)}`, n, 1.93, { color: col, size: 12.5 }); }
          }
          for (const [n, lab, col, h, al] of [[667, '\\nu_2\\ 667', 'red', 0.62, 'center'], [1285, '1285', 'blue', 0.42, 'right'], [1388, '1388', 'blue', 0.5, 'left'], [2349, '\\nu_3\\ 2349', 'red', 0.62, 'center']]) {
            sS.line(n, 0.05, n, 0.05 + h, { color: col, width: 2.4 }); sS.tex(lab, n, 0.16 + h, { color: col, size: 12, align: al, dx: al === 'right' ? 3 : al === 'left' ? -3 : 0 });
          }
          sS.line(1333, 0.05, 1333, 0.62, { color: 'blue', width: 1.2, dash: [3, 3] }); sS.tex('\\nu_1 \\approx 1333\\ \\text{(Fermi dyad)}', 1333, 0.86, { color: 'blue', size: 11.5 });
          if (Math.abs(S.Mc - 13.003) < 0.01) { sS.line(2283, 0.05, 2283, 0.5, { color: 'gold', width: 2.4 }); sS.text('¹³CO₂ ν₃ 2283', 2283, 0.56, { color: 'gold', size: 10.5, align: 'right', dx: -4 }); }
          // dipole trace over three display periods
          if (modeS.value === 'trans') sD.text('a uniform drift: nothing oscillates', 1.5, 0.5, { color: 'muted', size: 12, align: 'center' });
          else {
            const amp = q.reduce((s, qq, i) => s + qq * a[i] * am, 0) * (md.dir === 'y' ? 1 : 1), A = Math.abs(amp) > 1e-9 ? 1 : 0, sgn = Math.sign(amp) || 1;
            sD.fn((u) => Math.cos(TAU * u), { color: 'faint', width: 1.2, dash: [4, 4] });
            sD.fn((u) => A * sgn * Math.cos(TAU * u), { color: 'purple', width: 2.4 });
            const u0 = fdisp > 0 ? (fdisp * t) % 3 : 0; sD.vline(u0, { color: 'gold', width: 1.2 });
            if (!A) sD.text('dipole stays exactly zero: IR-inactive', 1.5, 0.35, { color: 'blue', size: 12, align: 'center', weight: 600 });
          }
          cur = S;
        }, { period: 1e9, still: 0.4 });
        v.legend([['red', 'IR-active (changes the dipole)'], ['blue', 'IR-inactive, Raman-active'], ['purple', 'dipole moment $\\sum q_i\\mathbf r_i$'], ['faint', 'mode coordinate', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const S = cur, f = Math.sqrt(1 + (2 * S.m) / S.Mc);
          let s = String.raw`Model: $\nu_1 = ${v.fix(S.n1, 0)}$, $\nu_2 = ${v.fix(S.n2, 0)}$, $\nu_3 = ${v.fix(S.n3, 0)}$ cm⁻¹ · computed $\nu_3/\nu_1 = ${v.fix(S.n3 / S.n1, 4)}$`;
          s += Math.abs(S.x) < 1e-9 ? String.raw` $= \sqrt{1+2m/M} = ${v.fix(f, 4)}$` : String.raw`; with the cross term, $\sqrt{\tfrac{k-k'}{k+k'}(1+2m/M)} = ${v.fix(f * Math.sqrt((1 - S.x) / (1 + S.x)), 4)}$`;
          s += String.raw` · measured CO₂: $2349/1333 = ${v.fix(OBS.n3 / OBS.n1, 4)}$`;
          const f12 = Math.sqrt(1 + (2 * 15.995) / 12), f13 = Math.sqrt(1 + (2 * 15.995) / 13.003);
          s += String.raw` · isotope test: the model predicts $\nu_3(^{13}\mathrm{C})/\nu_3(^{12}\mathrm{C}) = ${v.fix(f13 / f12, 5)}$, i.e. $2349 \to ${v.fix((2349 * f13) / f12, 0)}$ cm⁻¹; measured ≈ 2283 cm⁻¹`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.8
    {
      num: '11.8',
      kind: 'Model',
      name: 'Chain of masses: dispersion relation',
      statement: String.raw`Equal masses $m$ a distance $a$ apart, joined by springs of stiffness $K$, obey $m\ddot y_j = K(y_{j+1} - 2y_j + y_{j-1})$. Travelling waves $y_j = \cos(kja - \omega t)$ solve these equations exactly when
$$\omega(k) = 2\sqrt{K/m}\,\Big|\sin\frac{ka}{2}\Big| ,$$
the **dispersion relation** of the chain. It is periodic in $k$ with period $2\pi/a$, so all distinct waves have $|k| \le \pi/a$ (the first Brillouin zone), and no wave oscillates faster than $\omega_{\max} = 2\sqrt{K/m}$. Crests move at the phase velocity $v_p = \omega/k$; a wave packet built around $k_0$ moves at the **group velocity** $v_g = d\omega/dk = a\sqrt{K/m}\cos(k_0a/2)$, which vanishes at the zone edge. For a chain of $N$ masses between fixed walls the modes are $y_j \propto \sin(k_nja)$ with $k_n = n\pi/((N+1)a)$, $n = 1,\dots,N$, at the frequencies $\omega(k_n)$. For $ka \ll 1$, $\omega \approx ck$ with $c = a\sqrt{K/m}$: long waves do not disperse, and the chain behaves like a continuous string.`,
      scope: String.raw`Linear springs, nearest-neighbour coupling, identical masses. Alternating masses split the curve into acoustic and optical branches with a gap, and longer-range springs change its shape.`,
      idea: String.raw`The equations are invariant under shifting every index by one, so the modes are discrete waves $e^{i(kja-\omega t)}$: substituting gives $-m\omega^2 = K(e^{ika} - 2 + e^{-ika}) = -4K\sin^2(ka/2)$. The masses sample the wave only at the points $ja$, and $k$ and $k + 2\pi/a$ give the same samples (aliasing), which explains the zone. Fixed ends select the standing waves that vanish at $j = 0$ and $j = N+1$; they are the eigenvectors of the tridiagonal matrix of 11.4. A packet is a superposition of nearby $k$; its envelope moves where the phases of its components agree, at $d\omega/dk$.`,
      caption: String.raw`Top: a long ring of beads (displacements drawn sideways) carrying a wave packet, simulated directly from Newton’s equations. Green marks where the group velocity says the envelope should be, gold the measured centre of its energy, and red follows one crest at the phase velocity. Drag the handle along the dispersion curve: near $k = 0$ crests and envelope move together; toward the zone edge the envelope slows to a halt while crests keep moving. Right: the standing modes of a short chain between walls, whose frequencies are the purple dots on the curve. Past the middle of the zone the beads also fit a shorter wave (red dashed), the alias that carries no new information.`,
      deps: ['mech-11.4'],
      see: ['waves-1.1', 'waves-3.4', 'waves-3.5', 'cm-3.3'],
      refs: ['Goldstein §13.1', 'Tong §2.6'],
      tags: ['dispersion', 'group velocity', 'lattice waves'],
      viz(v) {
        const NR = 240, J0 = 60, SIG = 13, TR = 150, DT = 0.05, EVR = 10;
        const NS = v.slider('beads in the short chain $N$', 2, 30, 12, { int: true });
        const nS = v.slider('mode number $n$', 1, 30, 3, { int: true });
        const sW = v.stage({ x: [0, NR], y: [-1.35, 1.45], axes: false, height: 190, full: true });
        const sD = v.stage({ x: [-Math.PI, Math.PI], y: [0, 2.3], axes: 'box', height: 270, ylabel: '$\\omega$', xticks: [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], title: 'dispersion $\\omega(k)$, $k$ in units of $1/a$ ($K = m = a = 1$)' });
        const sM = v.stage({ x: [0, 13], y: [-1.5, 1.5], axes: 'box', height: 270, yticks: [], title: 'standing mode of the short chain (position in units of $a$)' });
        const om = (k) => 2 * Math.abs(Math.sin(k / 2));
        const hk = sD.handle(1.2, om(1.2), { color: 'gold', constrain: (x) => { const k = clamp(x, 0.08, Math.PI - 0.02); return [k, om(k)]; } });
        hk.onDrag = () => v.restart();
        const cache = memo(); let cur = null;
        const run = () => cache(hk.x.toFixed(4), () => {
          const k0 = hk.x, w0 = om(k0), y = new Float64Array(NR), u = new Float64Array(NR), acc = new Float64Array(NR);
          for (let j = 0; j < NR; j++) { let d = j - J0; d -= NR * Math.round(d / NR); const env = Math.exp(-(d * d) / (2 * SIG * SIG)); y[j] = env * Math.cos(k0 * d); u[j] = env * w0 * Math.sin(k0 * d); }
          const force = () => { for (let j = 0; j < NR; j++) acc[j] = y[(j + 1) % NR] - 2 * y[j] + y[(j + NR - 1) % NR]; };
          const centre = () => { let sx = 0, sy = 0; for (let j = 0; j < NR; j++) { const dy = y[(j + 1) % NR] - y[j], e = 0.5 * u[j] * u[j] + 0.5 * dy * dy, th = (TAU * j) / NR; sx += e * Math.cos(th); sy += e * Math.sin(th); } return (Math.atan2(sy, sx) / TAU) * NR; };
          const frames = [], ts = [], cs = []; let prevC = centre(), unw = prevC; force();
          const n = Math.round(TR / DT);
          for (let s = 0; s <= n; s++) {
            if (s % EVR === 0) { frames.push(Float64Array.from(y)); ts.push(s * DT); let c = centre(), d = c - prevC; d -= NR * Math.round(d / NR); unw += d; prevC = c; cs.push(unw); }
            for (let j = 0; j < NR; j++) { u[j] += 0.5 * DT * acc[j]; y[j] += DT * u[j]; }
            force(); for (let j = 0; j < NR; j++) u[j] += 0.5 * DT * acc[j];
          }
          const half = Math.floor(ts.length * 0.15), fit = v.M.linreg(ts.slice(half), cs.slice(half));
          return { k0, w0, frames, ts, cs, dt: DT * EVR, vMeas: fit.slope, vg: Math.cos(k0 / 2), vp: w0 / k0 };
        });
        v.animate((t) => {
          const B = run(), tau = Math.min(12 * t, TR), i = Math.min(B.frames.length - 1, Math.round(tau / B.dt)), Y = B.frames[i], tt = B.ts[i];
          const wrap = (x) => ((x % NR) + NR) % NR;
          // the ring
          sW.hline(0, { color: 'faint', width: 1 });
          const pts = []; for (let j = 0; j < NR; j++) pts.push([j, Y[j]]);
          sW.path(pts, { color: 'blue', width: 1.2, alpha: 0.6 }); sW.dots(pts, { r: 1.8, color: 'blue' });
          const xg = wrap(J0 + B.vg * tt), xc = wrap(B.cs[i]), xp = wrap(J0 + B.vp * tt);
          sW.vline(xc, { color: 'gold', width: 2 });
          sW.poly([[xg, 1.12], [xg - 3, 1.36], [xg + 3, 1.36]], { fill: 'green', fillAlpha: 0.9, color: 'green' });
          sW.dot(xp, -1.18, { r: 5, color: 'red' });
          sW.tex('envelope at $x_0 + v_g t$', xg, 1.3, { rich: true, color: 'green', size: 12, align: xg > NR - 50 ? 'right' : 'left', dx: xg > NR - 50 ? -8 : 8 });
          sW.tex('one crest at $x_0 + v_p t$', xp, -1.18, { rich: true, color: 'red', size: 12, align: xp > NR - 50 ? 'right' : 'left', dx: xp > NR - 50 ? -9 : 9 });
          sW.corner(`t = ${v.fix(tt, 0)} (ring of ${NR} beads, periodic)`, 'tr');
          // dispersion
          const N = NS.value, n = Math.min(nS.value, N), k0 = B.k0;
          sD.vband(-Math.PI, Math.PI, { color: 'accent', alpha: 0.04 });
          sD.fn((k) => Math.abs(k), { color: 'faint', width: 1.3, dash: [5, 4] });
          sD.text('ω = ck', 2.05, 2.05, { color: 'muted', size: 11, align: 'left', dx: 6 });
          sD.fn(om, { color: 'ink', width: 2.4 });
          for (let m = 1; m <= N; m++) { const k = (m * Math.PI) / (N + 1); sD.dot(k, om(k), { r: m === n ? 6 : 3.5, color: 'purple' }); }
          sD.line(k0 - 1, B.w0 - B.vg, k0 + 1, B.w0 + B.vg, { color: 'green', width: 2 });
          sD.line(0, 0, k0, B.w0, { color: 'red', width: 1.6, dash: [5, 3] });
          sD.tex('\\text{slope } v_g', k0 + 0.7, B.w0 + 0.7 * B.vg, { color: 'green', size: 13, dx: 6, dy: 10, align: 'left' });
          sD.tex('\\text{slope } v_p', k0 / 2, B.w0 / 2, { color: 'red', size: 13, align: 'right', dx: -10, dy: -6 });
          sD.text('zone edge', Math.PI, 0.15, { color: 'muted', size: 10.5, align: 'right', dx: -4 });
          // standing mode of the short chain
          const kn = (n * Math.PI) / (N + 1);
          sM.setView([-0.5, N + 1.5], [-1.5, 1.5]);
          hatch(v, sM, 0, -1.2, 0, 1.2, -1, 7, 6); hatch(v, sM, N + 1, -1.2, N + 1, 1.2, 1, 7, 6);
          if (n > (N + 1) / 2) sM.fn((x) => Math.sin((2 * Math.PI - kn) * x) * -1, { color: 'red', width: 1.2, dash: [4, 3], domain: [0, N + 1] });
          sM.fn((x) => Math.sin(kn * x), { color: 'purple', width: 1.2, alpha: 0.5, domain: [0, N + 1] });
          const bp = [[0, 0]]; for (let j = 1; j <= N; j++) bp.push([j, Math.sin(kn * j)]); bp.push([N + 1, 0]);
          sM.path(bp, { color: 'ink', width: 1.4 });
          for (let j = 1; j <= N; j++) sM.dot(j, Math.sin(kn * j), { r: 6, color: 'purple' });
          sM.corner(`n = ${n}: ω = ${v.fix(om(kn), 4)}, string value c·k = ${v.fix(kn, 4)}`, 'tl', { color: 'purple' });
          cur = { B, N, n, kn };
        }, { period: TR / 12 + 1, still: 7 });
        v.legend([['blue', 'beads'], ['green', 'group-velocity prediction'], ['gold', 'measured energy centre'], ['red', 'phase velocity'], ['purple', 'modes of the short chain']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, N, n, kn } = cur;
          return String.raw`$k_0a = ${v.fix(B.k0, 3)}$, $\omega(k_0) = ${v.fix(B.w0, 4)}$ · predicted $v_g = \cos(k_0a/2) = ${v.fix(B.vg, 4)}$; measured speed of the packet’s energy centre ${v.fix(B.vMeas, 4)} · phase velocity $v_p = \omega/k = ${v.fix(B.vp, 4)}$ · short chain, $N = ${N}$, mode $n = ${n}$: $\omega_n = 2\sin\frac{n\pi}{2(N+1)} = ${v.fix(2 * Math.sin(kn / 2), 4)}$ vs the string’s $ck_n = ${v.fix(kn, 4)}$ (${v.fix(100 * (1 - (2 * Math.sin(kn / 2)) / kn), 2)}% lower)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 11.9
    {
      num: '11.9',
      kind: 'Model',
      name: 'Vibrating string: standing waves',
      statement: String.raw`A string of length $L$, tension $\tau$ and mass per length $\mu$, fixed at both ends, obeys the wave equation $\mu y_{tt} = \tau y_{xx}$ (the continuum limit of the bead chain, 11.8, with $c = \sqrt{\tau/\mu}$). Its normal modes are the standing waves
$$y_n(x,t) = \sin\frac{n\pi x}{L}\,\cos(\omega_nt - \varphi_n),\qquad \omega_n = \frac{n\pi c}{L},\quad n = 1,2,\dots,$$
whose frequencies are integer multiples of the fundamental. Every motion is a superposition $y = \sum_n \sin(n\pi x/L)\,\big(b_n\cos\omega_nt + \tfrac{\dot b_n}{\omega_n}\sin\omega_nt\big)$, where $b_n$ and $\dot b_n$ are the Fourier sine coefficients of the initial shape and velocity. The energy splits into independent mode energies, $E = \sum_n \tfrac{\mu L}{4}\big(\omega_n^2b_n^2 + \dot b_n^2\big)$. A string plucked to height $h$ at $x = p$ has
$$b_n = \frac{2hL^2}{n^2\pi^2\,p(L-p)}\,\sin\frac{n\pi p}{L},$$
so every harmonic with a node at the plucking point is missing.`,
      scope: String.raw`Small transverse displacements of a perfectly flexible, uniform string with ideal fixed ends and no damping. Real strings are slightly stiff, which raises the upper partials above exact multiples (inharmonicity).`,
      idea: String.raw`The modes of the $N$-bead chain, $\sin(k_nja)$ with $k_n = n\pi/((N+1)a)$, converge to $\sin(n\pi x/L)$ as $N\to\infty$ with $(N+1)a = L$. Their frequencies $2\sqrt{K/m}\sin(k_na/2)$ converge to $ck_n$, because the low end of the dispersion curve is straight. The modes are orthogonal on $[0, L]$, so the coefficients are Fourier sine coefficients, and Fourier series of the (Lipschitz) initial shape converge to it (pma-8.14). Orthogonality also kills every cross term in the energy integral $\int(\tfrac12\mu y_t^2 + \tfrac12\tau y_x^2)\,dx$. A pluck at a node of mode $n$ cannot excite that mode, since $\sin(n\pi p/L) = 0$.`,
      caption: String.raw`Drag the gold handle to pluck the string at any point and height. The top panel shows the string vibrating (sum of 80 modes); the middle one shows the first six modes separately, each oscillating at its own frequency (drawn on a compressed scale; the true amplitudes are printed beside them). The bars give the share of energy in each harmonic on a log scale (computed by numerical projection of the initial shape; dots are the closed-form values). Pluck at $L/3$ and the 3rd, 6th, 9th … harmonics vanish. Switch to a hammer strike and the energy spreads far higher up the series.`,
      deps: ['mech-11.8', 'pma-8.14'],
      see: ['music-2.3', 'music-2.7', 'music-2.8', 'waves-1.2'],
      refs: ['Taylor §16.1', 'Goldstein §13.1'],
      tags: ['standing waves', 'Fourier series', 'string'],
      viz(v) {
        const NM = 80, NE = 2000, NG = 512;
        const kind = v.select('excitation', [{ value: 'pluck', label: 'pluck (shape)' }, { value: 'strike', label: 'hammer strike (velocity)' }], 'pluck');
        const sY = v.stage({ x: [-0.1, 1.3], y: [-0.36, 0.36], axes: false, height: 200, full: true });
        const sN = v.stage({ x: [-0.1, 1.3], y: [-6.4, 0.6], axes: false, height: 200, full: true });
        const sB = v.stage({ x: [0.3, 16.7], y: [1e-5, 1], ylog: true, axes: 'box', height: 210, full: true, xticks: Array.from({ length: 16 }, (_, k) => [k + 1, String(k + 1)]), title: 'share of the energy in each harmonic $n$ (log scale)' });
        const hp = sY.handle(0.3, 0.22, { color: 'gold', constrain: (x, y) => [clamp(x, 0.03, 0.97), clamp(y, 0.04, 0.3)] });
        hp.onDrag = () => v.restart();
        v.button('pluck at L/2', () => { hp.set(0.5, hp.y); v.restart(); });
        v.button('pluck at L/3', () => { hp.set(1 / 3, hp.y); v.restart(); });
        v.button('pluck at L/5', () => { hp.set(0.2, hp.y); v.restart(); });
        v.soundButton('Hear it', (snd) => { const B = run(), parts = []; for (let n = 1; n <= 24; n++) { const a = n * Math.sqrt(B.E[n - 1]); if (a > 1e-4) parts.push([196 * n, a]); } snd.tone(parts, { duration: 2.5, gain: 0.25, release: 1.6 }); });
        const cache = memo(); let cur = null;
        const run = () => cache([kind.value, hp.x, hp.y].join('|'), () => {
          const p = hp.x, h = hp.y, W = 0.035, strike = kind.value === 'strike';
          const f0 = (x) => (strike ? 0 : x < p ? (h * x) / p : (h * (1 - x)) / (1 - p));
          const v0 = (x) => (strike ? Math.max(0, 1 - ((x - p) / W) ** 2) * h * 6 : 0);
          // numerical sine coefficients (trapezoid on NG intervals; the integrand vanishes at the ends)
          const proj = (f, n) => { let s = 0; for (let j = 1; j < NG; j++) { const x = j / NG; s += f(x) * Math.sin(n * Math.PI * x); } return (2 * s) / NG; };
          const b = [], bd = [], E = [];
          for (let n = 1; n <= NE; n++) {
            const w = n * Math.PI;
            if (n <= 64) { b.push(proj(f0, n)); bd.push(proj(v0, n)); }
            else if (!strike) { b.push((2 * h / (n * n * Math.PI * Math.PI * p * (1 - p))) * Math.sin(n * Math.PI * p)); bd.push(0); }
            else { const c = (2 * h * 6 * W) * 4 * (Math.sin(w * W) / (w * W) ** 3 - Math.cos(w * W) / (w * W) ** 2) * Math.sin(w * p); b.push(0); bd.push(c); }
            E.push(0.25 * (w * w * b[n - 1] ** 2 + bd[n - 1] ** 2));
          }
          const Et = E.reduce((s, e) => s + e, 0);
          // direct energy of the initial state: ∫ ½ y_x² + ½ y_t² dx (μ = τ = 1, L = 1)
          const ED = strike ? v.M.integrate((x) => 0.5 * v0(x) ** 2, p - W, p + W, 400) : 0.5 * ((h / p) ** 2 * p + (h / (1 - p)) ** 2 * (1 - p));
          const closed = strike ? null : Array.from({ length: 16 }, (_, k) => { const n = k + 1, bn = (2 * h / (n * n * Math.PI * Math.PI * p * (1 - p))) * Math.sin(n * Math.PI * p); return (0.25 * (n * Math.PI) ** 2 * bn * bn) / Et; });
          const missing = []; for (let n = 1; n <= 16; n++) if (E[n - 1] / Et < 1e-6) missing.push(n);
          return { p, h, strike, b, bd, E: E.map((e) => e / Et), Et, ED, closed, missing, f0 };
        });
        v.animate((t) => {
          const B = run(), tt = 0.18 * t; // time in units of L/c: the fundamental period is 2
          const y = (x) => { let s = 0; for (let n = 1; n <= NM; n++) { const w = n * Math.PI; s += Math.sin(w * x) * (B.b[n - 1] * Math.cos(w * tt) + (B.bd[n - 1] / w) * Math.sin(w * tt)); } return s; };
          sY.line(0, 0, 1, 0, { color: 'faint', width: 1, dash: [3, 4] });
          if (!B.strike) sY.fn(B.f0, { color: 'faint', width: 1.2, domain: [0, 1] });
          else sY.rect(B.p - 0.035, 0.27, B.p + 0.035, 0.33, { fill: 'muted', fillAlpha: 0.5, color: 'muted', width: 1 });
          sY.fn(y, { color: 'blue', width: 2.6, domain: [0, 1], n: 400 });
          for (const x of [0, 1]) { sY.line(x, -0.08, x, 0.08, { color: 'muted', width: 3 }); }
          for (let n = 2; n <= 9; n++) if (B.missing.includes(n)) for (let j = 1; j < n; j++) { const xn = j / n; if (Math.abs(xn - B.p) < 1e-3) sY.text(`node of harmonic ${n}`, xn, -0.3, { color: 'red', size: 11, align: 'center' }); }
          sY.vline(B.p, { color: 'gold', width: 1, dash: [2, 4], alpha: 0.7 });
          sY.corner(B.strike ? 'hammer strike: starts flat, with velocity near the gold mark' : 'plucked shape (grey) released from rest', 'br');
          // first six modes, each with its own phase
          for (let n = 1; n <= 6; n++) {
            const w = n * Math.PI, A = B.b[n - 1] * Math.cos(w * tt) + (B.bd[n - 1] / w) * Math.sin(w * tt), amp = Math.hypot(B.b[n - 1], B.bd[n - 1] / w), y0 = -(n - 1) * 1.15, rel = amp / Math.hypot(B.b[0], B.bd[0] / Math.PI), s = amp > 1e-12 ? (0.45 * Math.pow(rel, 0.4)) / amp : 0;
            sN.line(0, y0, 1, y0, { color: 'faint', width: 1 });
            const col = MODE_COLS[(n - 1) % MODE_COLS.length];
            if (amp / Math.hypot(B.b[0], B.bd[0] / Math.PI) > 1e-4) sN.fn((x) => y0 + s * A * Math.sin(w * x), { color: col, width: 1.8, domain: [0, 1] });
            sN.text(`n = ${n}`, -0.015, y0, { color: col, size: 11, align: 'right' });
            sN.text(amp / Math.hypot(B.b[0], B.bd[0] / Math.PI) > 1e-4 ? `amplitude ${v.fix(amp / Math.hypot(B.b[0], B.bd[0] / Math.PI), 3)} × mode 1` : 'missing', 1.015, y0, { color: col, size: 10.5, align: 'left' });
          }
          // energy bars
          sB.bars(B.E.slice(0, 16).map((e) => Math.max(e, 1.1e-5)), { x0: 1, dx: 1, color: (e, i) => (B.E[i] < 1e-6 ? 'red' : MODE_COLS[i % MODE_COLS.length]) });
          if (B.closed) sB.dots(B.closed.map((e, i) => [i + 1, e]).filter((p) => p[1] > 1e-5), { r: 3.2, color: 'ink' });
          for (const n of B.missing) sB.text('×', n, 6e-5, { color: 'red', size: 16, align: 'center', weight: 700 });
          cur = B;
        }, { period: 1e9, still: 1.5 });
        v.legend([['blue', 'string $y(x,t)$'], ['faint', 'initial shape'], ['ink', 'closed-form share (pluck)', { dot: true }], ['red', 'missing harmonic (node at the plucking point)']]);
        v.readout(() => {
          if (!cur) return '';
          const B = cur;
          const miss = B.missing.length ? `missing harmonics among the first 16: ${B.missing.join(', ')}` : 'no harmonic below 17 is missing';
          return String.raw`Plucking point $p/L = ${v.fix(B.p, 3)}$ · fundamental share ${v.fix(100 * B.E[0], 2)}% · ${miss} · energy check (Parseval): $\sum_{n\le ${NE}} E_n = ${v.fix(B.Et, 5)}$ vs direct $\int\big(\tfrac12\tau y_x^2+\tfrac12\mu y_t^2\big)dx = ${v.fix(B.ED, 5)}$ (units $\tau = \mu = L = 1$)`;
        });
      },
    },
  ],
};
