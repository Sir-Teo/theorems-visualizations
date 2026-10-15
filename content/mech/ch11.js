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
        const sT = v.stage({ x: [0, TT], y: [-1.12, 1.12], height: 230, axes: 'box', xlabel: 't (units of $\\sqrt{m_1/k_1}$)', weight: 1.6, yticks: [] });
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
          const off = [0.56, -0.56];
          for (let c = 0; c < 2; c++) {
            sT.hline(off[c], { color: 'faint', width: 1 });
            series(sT, B.R.t, B.rec.map((q) => off[c] + q.q[0] * A[0][c]), B.rec.length, { color: 'blue', width: 1.1, alpha: 0.7 });
            series(sT, B.R.t, B.rec.map((q) => off[c] + q.q[1] * A[1][c]), B.rec.length, { color: 'orange', width: 1.1, alpha: 0.7 });
            series(sT, B.R.t, B.rec.map((q) => off[c] + q.x[c]), i, { color: c ? 'teal' : 'purple', width: 2.2 });
            sT.tex(c ? 'x_2' : 'x_1', 1.2, off[c] + 0.4, { color: c ? 'teal' : 'purple', size: 14 });
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
          s += String.raw` · cart 1’s share swings between ${v.fix(100 * B.rE1[0], 0)}% and ${v.fix(100 * B.rE1[1], 0)}%, while each mode energy stays constant to ${sci(v, B.drift)} of the total (Verlet integration error)`;
          return s;
        });
      },
    },
  ],
};
