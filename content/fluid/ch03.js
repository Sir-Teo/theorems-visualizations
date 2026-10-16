// Fluid Dynamics — Chapter 3: Vorticity, circulation and rotation
import { G0, clamp, TAU, vortexVel, rk4Vortices, ringPsi, biotSavart, abc, rk4p } from './ch03.shared.js';

export default {
  collection: 'fluid',
  chapter: 3,
  title: 'Vorticity, circulation and rotation',
  summary: String.raw`In an inviscid fluid the circulation round any loop moving with the fluid never changes (Kelvin), so vortex lines are carried along with the flow and a flow started from rest stays irrotational. Vorticity is amplified by stretching, induces velocity at a distance much as an electric current induces a magnetic field, and its concentrated forms (point vortices, rings and sheets) have dynamics of their own. In a rapidly rotating fluid the Coriolis force dominates: flows become geostrophic and columnar.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Theorem',
      name: 'Kelvin’s circulation theorem',
      statement: String.raw`Let $C(t)$ be a closed curve made of the same fluid particles at every instant (a material loop) in the flow of an inviscid fluid whose pressure depends only on density (barotropic) and which is acted on by conservative body forces. Then the circulation
$$\Gamma(t)=\oint_{C(t)}\mathbf u\cdot d\mathbf l$$
does not change with time, $D\Gamma/Dt=0$, however much the loop is stretched, folded or twisted. The statement fails if viscosity, a non-conservative force (such as the Coriolis force seen from a rotating frame) or a density-pressure mismatch (baroclinicity) can create or move vorticity across the loop.`,
      idea: String.raw`Differentiate under the integral, remembering that a material line element obeys $D(d\mathbf l)/Dt=(d\mathbf l\cdot\nabla)\mathbf u$. This gives $\oint \frac{D\mathbf u}{Dt}\cdot d\mathbf l+\oint \mathbf u\cdot d\mathbf u$. The second integral is $\oint d(\tfrac12|\mathbf u|^2)=0$. In the first, Euler's equation (2.8) turns $D\mathbf u/Dt$ into $-\nabla(h+\Phi)$, with $h=\int dp/\rho$ the enthalpy (barotropic) and $\Phi$ the potential of the body force, and the integral of a gradient round a closed loop is zero.`,
      caption: String.raw`Three Lamb–Oseen vortices (blue: counter-clockwise, red: clockwise) move under each other's induction, and a loop of fluid particles (orange) is released round the first one. Press play: the loop is dragged out into tongues and wraps round the other vortices, yet the circulation measured on it (right, computed by summing $\mathbf u\cdot d\mathbf l$ over the loop points, which are refined as it stretches) stays on the dashed line. Now raise the viscosity $\nu$: the vortex cores spread, vorticity leaks out through the loop, and the number decays. The viscous run is a model (vortices keep their Lamb–Oseen shape while spreading), not a solution of the Navier–Stokes equations.`,
      deps: ['fluid-1.11', 'fluid-2.8'],
      refs: ['Kundu §5.2', 'Acheson ch. 5'],
      credit: 'William Thomson (Lord Kelvin), “On vortex motion”, Trans. R. Soc. Edinburgh 25, 217–260, 1869',
      tags: ['circulation', 'vorticity', 'Kelvin'],
      scope: String.raw`Inviscid, barotropic fluid, conservative body forces, smooth flow, material loops. In two dimensions every loop that encloses a given set of vortices keeps the circulation of that set.`,
      viz(v) {
        const A0 = 4e-4, CAP = 2600, DT = 0.02;
        const nus = v.slider('viscosity $\\nu$', 0, 0.02, 0, { step: 0.001, onChange: () => { S.reset(); } });
        const s = v.stage({ x: [-3.4, 3.4], y: [-2.6, 2.6], equal: true, axes: false, height: 400, weight: 1.35, title: 'a material loop in a flow of three vortices' });
        const h = v.stage({ x: [0, 12], y: [0, 2.4], axes: 'box', gutter: true, height: 400, weight: 0.9, xlabel: 'time $t$', ylabel: 'circulation $\\Gamma$', title: 'circulation round the loop' });
        const G = [2, -2, 1.5], x0 = [0, 1.9, -1.6], y0 = [-1.5, -1.2, -0.7];
        const circ = (st, a2) => {
          let g = 0; const n = st.n, U = new Array(n);
          const W = { x: st.vx, y: st.vy, G };
          for (let i = 0; i < n; i++) U[i] = vortexVel(st.X[i], st.Y[i], W, a2);
          for (let i = 0; i < n; i++) { const j = i + 1 === n ? 0 : i + 1; g += 0.5 * ((U[i][0] + U[j][0]) * (st.X[j] - st.X[i]) + (U[i][1] + U[j][1]) * (st.Y[j] - st.Y[i])); }
          return g;
        };
        const S = v.sim(() => {
          const N0 = 140, X = new Float64Array(CAP), Y = new Float64Array(CAP);
          for (let i = 0; i < N0; i++) { X[i] = x0[0] + 0.95 * Math.cos((TAU * i) / N0); Y[i] = y0[0] + 0.95 * Math.sin((TAU * i) / N0); }
          const st = { vx: x0.slice(), vy: y0.slice(), X, Y, n: N0, k: 0, t: 0, hist: [], G0: 0 };
          st.G0 = circ(st, A0); st.hist.push([0, st.G0]); return st;
        }, (st, dt) => {
          const a2 = A0 + 4 * nus.value * st.t;
          const V = { x: st.vx, y: st.vy, G }, P = { X: st.X, Y: st.Y, n: st.n };
          rk4Vortices(V, P, dt, a2); st.t += dt; st.k++;
          if (st.k % 4 === 0) {
            const nx = [], ny = [], n = st.n;
            for (let i = 0; i < n; i++) {
              const j = i + 1 === n ? 0 : i + 1; nx.push(st.X[i]); ny.push(st.Y[i]);
              if (Math.hypot(st.X[j] - st.X[i], st.Y[j] - st.Y[i]) > 0.04 && nx.length + n < CAP) { nx.push((st.X[i] + st.X[j]) / 2); ny.push((st.Y[i] + st.Y[j]) / 2); }
            }
            st.n = nx.length; st.X.set(nx); st.Y.set(ny);
            st.hist.push([st.t, circ(st, a2)]);
          }
        }, { dt: DT });
        let info = {};
        v.animate((t) => {
          const st = S.advance(t), a2 = A0 + 4 * nus.value * st.t;
          const pts = []; for (let i = 0; i < st.n; i++) pts.push([st.X[i], st.Y[i]]);
          s.poly(pts, { fill: 'orange', fillAlpha: 0.28, color: 'orange', width: 1.6 });
          for (let j = 0; j < 3; j++) {
            const c = G[j] > 0 ? 'accent' : 'red', a = Math.sqrt(a2);
            if (a > 0.08) s.circle(st.vx[j], st.vy[j], 1.6 * a, { color: c, width: 1, fill: c, fillAlpha: 0.1 });
            s.dot(st.vx[j], st.vy[j], { r: 6, color: c, label: `Γ=${G[j]}`, labelPos: 'ne' });
          }
          h.hline(st.G0, { color: 'green', dash: true });
          h.path(st.hist, { color: 'orange', width: 2.4 });
          const now = st.hist[st.hist.length - 1][1];
          info = { t: st.t, n: st.n, g0: st.G0, g: now, nu: nus.value };
        }, { period: 12, still: 10 });
        v.legend([['orange', 'material loop / its circulation'], ['green', '$\\Gamma(0)$', { dash: true }]]);
        v.readout(() => `$t=${v.fix(info.t, 1)}$ · loop of ${info.n} fluid points\n$\\Gamma(0)=${v.fix(info.g0, 4)}$, $\\Gamma(t)=${v.fix(info.g, 4)}$ (change $${v.fix(100 * (info.g - info.g0) / info.g0, 2)}\\%$)${info.nu === 0 ? ' — constant: inviscid flow, Kelvin’s theorem' : ' — decaying: viscous diffusion carries vorticity through the loop'}`);
      },
    },
  ],
};
