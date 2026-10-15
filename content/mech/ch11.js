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
      caption: String.raw`Left, the potential surface with its osculating quadratic bowl (wire mesh); right, the same seen from above, with the true contours (solid) and the quadratic ones (dashed). Drag the gold start point: the true motion (blue) and the linearised one (orange, dashed) are released from rest there. Close to the minimum they are indistinguishable; drag outward and they peel apart. The bottom-right panel measures the deviation over the whole run for a range of amplitudes along the same direction. Its slope is the order of the first neglected term minus one: 1 for the cubic Hénon–Heiles potential, 2 for the even pendulum potential.`,
      deps: ['mech-6.6', 'mech-4.3', 'pma-9.41'],
      refs: ['Goldstein §6.1', 'Arnold §22'],
      tags: ['linearisation', 'small oscillations', 'Hessian'],
      viz(v) {
        const M = v.M, T = 25, DT = 0.01, N = Math.round(T / DT);
        const POT = {
          pend: { R: 1.7, c: 0.45, V: (x, y) => 1 - Math.cos(x) + 1 - Math.cos(y) + 0.45 * (1 - Math.cos(x - y)), g: (x, y) => [Math.sin(x) + 0.45 * Math.sin(x - y), Math.sin(y) - 0.45 * Math.sin(x - y)], start: [0.55, 0.12], zmax: 3.2, levels: [0.05, 0.15, 0.3, 0.5, 0.8, 1.2, 1.7, 2.3] },
          hh: { R: 0.95, V: (x, y) => 0.5 * (x * x + y * y) + x * x * y - (y * y * y) / 3, g: (x, y) => [x + 2 * x * y, y + x * x - y * y], start: [0.3, 0.22], zmax: 0.42, levels: [0.01, 0.03, 0.06, 0.1, 0.1667, 0.25, 0.35] },
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
            const fit = out.filter((p) => isFinite(p[1]) && p[0] < 0.12 && p[1] > 1e-9);
            const slope = fit.length > 2 ? M.linreg(fit.map((p) => Math.log(p[0])), fit.map((p) => Math.log(p[1]))).slope : NaN;
            return { out, slope };
          });
          // 3D: surface and osculating bowl, both clipped at zmax
          const zs = 1.5 / P.zmax, sc = 1.5 / R0, zc = (z) => Math.min(z, P.zmax) * zs - 0.75;
          s3.surface((u, w) => (P.V(u, w) <= P.zmax ? [u * sc, w * sc, zc(P.V(u, w))] : null), [-R0, R0], [-R0, R0], { n: 34, colorFn: (u, w) => v.ramp(0.25 + 0.7 * Math.min(1, P.V(u, w) / P.zmax), 'blue'), alpha: 0.9 });
          s3.surface((u, w) => (Q(u, w) <= P.zmax ? [u * sc, w * sc, zc(Q(u, w)) + 0.005] : null), [-R0, R0], [-R0, R0], { n: 22, color: 'orange', alpha: 0.12, wire: true, wireColor: 'orange', shade: false });
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
            for (const [pw, lab] of [[1, 'slope 1'], [2, 'slope 2']]) { sL.fn((e) => d0 * (e / e0) ** pw, { color: 'faint', dash: [4, 4], width: 1.2 }); sL.text(lab, 0.04, d0 * (0.04 / e0) ** pw, { color: 'muted', size: 11, dx: 4, dy: -9 }); }
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
          return String.raw`Hessian at the minimum (finite differences) $K = \begin{pmatrix}${f(K[0][0])} & ${f(K[0][1])}\\ ${f(K[1][0])} & ${f(K[1][1])}\end{pmatrix}$ ($\partial_x\partial_y V$ and $\partial_y\partial_x V$ agree) · linear frequencies $\omega = ${v.fix(Math.sqrt(G.w2[0]), 4)}, ${v.fix(Math.sqrt(G.w2[1]), 4)}$ · amplitude $\varepsilon = ${v.fix(eps, 3)}$${esc} · fitted small-$\varepsilon$ slope of the deviation ÷ ε: ${v.fix(sw.slope, 2)}`;
        });
      },
    },
  ],
};
