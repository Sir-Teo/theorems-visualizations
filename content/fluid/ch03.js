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
    // ───────────────────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Irrotational flow stays irrotational',
      statement: String.raw`In an inviscid, barotropic fluid with conservative body forces, a flow that is irrotational at one instant ($\boldsymbol\omega=\mathbf 0$ everywhere) is irrotational at all later instants, and a flow started from rest is irrotational for all time. The motion is then determined by a velocity potential. Vorticity cannot be created inside such a fluid: it can only enter from outside, through viscous boundary layers, non-conservative forces or density gradients that are not parallel to the pressure gradient.`,
      idea: String.raw`If $\boldsymbol\omega=\mathbf 0$ then the circulation round every loop is zero (Stokes' theorem, 1.11). By Kelvin's theorem (3.1) the circulation round the same material loop stays zero at every later time, so the flux of vorticity through every small material surface stays zero, and therefore $\boldsymbol\omega=\mathbf 0$ there too. The vorticity equation (3.3) gives the same answer pointwise: all its terms are proportional to $\boldsymbol\omega$ when the fluid is barotropic and inviscid, so $\boldsymbol\omega\equiv\mathbf 0$ solves it.`,
      caption: String.raw`A uniform stream is switched on from rest past a fixed circular cylinder, and paddle wheels (a red spoke marks each wheel) are carried along. Each wheel turns at half the local vorticity, which is evaluated here by differencing the velocity field: the right panel shows the angle of every wheel, and all stay at zero although the fluid bends round the cylinder. The slider adds a baroclinic torque, a uniform source $s=D\omega/Dt$ of the kind a horizontal density gradient provides, and the wheels start to spin as $\tfrac14 st^2$. In that case the extra velocity is a solid-body rotation, which is an exact solution of the vorticity equation with a uniform source and respects the no-penetration condition at a cylinder centred on the origin.`,
      deps: ['fluid-3.1'],
      refs: ['Kundu §5.2', 'Acheson ch. 1'],
      tags: ['vorticity', 'irrotational', 'Kelvin'],
      scope: String.raw`Inviscid, barotropic, conservative forces. It fails as soon as viscosity acts at a wall, the fluid is stratified so that $\nabla\rho\times\nabla p\neq\mathbf 0$, or the body force has a curl (for example in a rotating frame viewed from outside it, or with a rotational stirring force).`,
      viz(v) {
        const a = 0.6, U0 = 0.6;
        const ss = v.slider('baroclinic torque $s=D\\omega/Dt$ (1/s²)', 0, 0.12, 0, { step: 0.005, onChange: () => { S.reset(); } });
        const s = v.stage({ x: [-4.6, 5.4], y: [-2.6, 2.6], equal: true, axes: false, height: 380, weight: 1.35, title: 'paddle wheels in a flow started from rest' });
        const h = v.stage({ x: [0, 10], y: [-5, 5], axes: 'box', gutter: true, height: 380, weight: 0.85, xlabel: 'time $t$ (s)', ylabel: 'wheel angle (deg)', title: 'angle turned by each wheel' });
        const field = (x, y, t) => {
          const U = U0 * (1 - Math.exp(-t / 1.5)), r2 = Math.max(x * x + y * y, a * a), r4 = r2 * r2, om = (ss.value * t) / 2;
          return [U * (1 + (a * a * (y * y - x * x)) / r4) - om * y, (-2 * U * a * a * x * y) / r4 + om * x];
        };
        const vort = (x, y, t) => { const e = 1e-4; return (field(x + e, y, t)[1] - field(x - e, y, t)[1] - field(x, y + e, t)[0] + field(x, y - e, t)[0]) / (2 * e); };
        const F = (t, q) => { const f = field(q[0], q[1], t); return [f[0], f[1], 0.5 * vort(q[0], q[1], t)]; };
        const starts = []; for (const x of [-4.2, -3, -1.8]) for (const y of [-1.7, -1.1, -0.5, 0.5, 1.1, 1.7]) starts.push([x, y, 0]);
        const S = v.sim(() => ({ t: 0, q: starts.map((p) => p.slice()), tr: starts.map((p) => [[p[0], p[1]]]), th: starts.map(() => [[0, 0]]), k: 0, wmax: 0 }), (st, dt) => {
          for (let i = 0; i < st.q.length; i++) {
            const q = st.q[i], t = st.t;
            const k1 = F(t, q), k2 = F(t + dt / 2, q.map((c, j) => c + (dt / 2) * k1[j])), k3 = F(t + dt / 2, q.map((c, j) => c + (dt / 2) * k2[j])), k4 = F(t + dt, q.map((c, j) => c + dt * k3[j]));
            for (let j = 0; j < 3; j++) q[j] += (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]);
            st.wmax = Math.max(st.wmax, Math.abs(vort(q[0], q[1], t + dt)));
          }
          st.t += dt; st.k++;
          if (st.k % 5 === 0) for (let i = 0; i < st.q.length; i++) { st.tr[i].push([st.q[i][0], st.q[i][1]]); st.th[i].push([st.t, (st.q[i][2] * 180) / Math.PI]); }
        }, { dt: 0.02 });
        let info = {};
        v.animate((t) => {
          const st = S.advance(t);
          s.circle(0, 0, a, { fill: 'muted', fillAlpha: 0.35, color: 'ink', width: 2 });
          let mth = 0;
          st.q.forEach((q, i) => {
            s.path(st.tr[i], { color: 'faint', width: 1 });
            const L = 0.2, c = Math.cos(q[2]), sn = Math.sin(q[2]);
            s.line(q[0] - L * sn, q[1] + L * c, q[0] + L * sn, q[1] - L * c, { color: 'ink', width: 2 });
            s.line(q[0] - L * c, q[1] - L * sn, q[0], q[1], { color: 'ink', width: 2 });
            s.line(q[0], q[1], q[0] + L * c, q[1] + L * sn, { color: 'red', width: 2.6 });
            s.dot(q[0], q[1], { r: 2.5, color: 'ink' });
            mth = Math.max(mth, Math.abs((q[2] * 180) / Math.PI));
          });
          const m = Math.max(5, 1.1 * mth);
          h.setView([0, 10], [-0.1 * m, m]);
          h.hline(0, { color: 'green', dash: true });
          st.th.forEach((p) => h.path(p, { color: 'accent', width: 1.4, alpha: 0.8 }));
          info = { t: st.t, mth, wmax: st.wmax, U: U0 * (1 - Math.exp(-st.t / 1.5)) };
        }, { period: 10, still: 8 });
        v.readout(() => `$t=${v.fix(info.t, 1)}$ s, stream speed $${v.fix(info.U, 2)}$ m/s · largest $|\\omega|$ met by any wheel: $${info.wmax < 1e-4 ? v.sci(info.wmax + 1e-12, 1) : v.fix(info.wmax, 3)}$ s$^{-1}$ · largest wheel angle $${v.fix(info.mth, info.mth < 0.1 ? 4 : 1)}^\\circ$${ss.value === 0 ? ' — the fluid has no vorticity, so no wheel turns' : ' — the baroclinic torque has created vorticity'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Vorticity equation and vortex stretching',
      statement: String.raw`For an incompressible fluid of constant density and viscosity $\nu$ the vorticity $\boldsymbol\omega=\nabla\times\mathbf u$ obeys
$$\frac{D\boldsymbol\omega}{Dt}=(\boldsymbol\omega\cdot\nabla)\mathbf u+\nu\nabla^2\boldsymbol\omega.$$
Without viscosity the right-hand side is the term $(\boldsymbol\omega\cdot\nabla)\mathbf u$ alone: vorticity is carried by the fluid and in addition lengthened and turned like a material line element. Where the flow stretches a vortex line, $|\boldsymbol\omega|$ grows in proportion to the length, and the tube thins so that its volume, and its circulation $\Gamma=\omega\,\pi R^2$, stay fixed. In two dimensions $\boldsymbol\omega\perp$ the plane and the stretching term vanishes.`,
      idea: String.raw`Take the curl of Euler's equation (2.8): the pressure and conservative body-force terms are gradients and drop out, and the identity $\mathbf u\cdot\nabla\mathbf u=\nabla(\tfrac12|\mathbf u|^2)-\mathbf u\times\boldsymbol\omega$ turns what is left into the equation above. Compare with a material line element $\delta\mathbf l$, which obeys $D(\delta\mathbf l)/Dt=(\delta\mathbf l\cdot\nabla)\mathbf u$: the same equation, so a vortex line is lengthened exactly as a material line is. Incompressibility ties the cross-section to the length, $A\propto1/L$, hence $\omega\propto L$ and $\omega A$ is conserved, as in the skater who pulls in her arms and spins faster.`,
      caption: String.raw`An axisymmetric straining flow $(u_r,u_z)=(-\tfrac12\varepsilon r,\ \varepsilon z)$ stretches a vortex tube with a core spinning like a solid body (left: side view, right: end view; dots are fluid particles, filled when they are on the near side). Press play: the tube lengthens, its radius shrinks as $e^{-\varepsilon t/2}$, and the spin rate climbs. In the plot, $\omega/\omega_0$ (orange), the length ratio $L/L_0$ (dashed) and $(R_0/R)^2$ (dotted) lie on top of each other, while the circulation $\Gamma=\omega\pi R^2$ is the flat green line. Make $\varepsilon$ negative and the tube is squashed and spins down.`,
      deps: ['fluid-1.9', 'fluid-2.8'],
      refs: ['Kundu §5.3', 'Acheson ch. 5'],
      credit: 'Hermann von Helmholtz, 1858 (vortex lines move with the fluid; strength of a tube is fixed)',
      tags: ['vorticity', 'stretching', 'turbulence'],
      scope: String.raw`Incompressible, inviscid (viscous diffusion of vorticity is neglected here). The straining flow is an exact steady Euler flow with uniform vorticity along the axis, so the picture is a solution, not a sketch.`,
      viz(v) {
        const R0 = 0.6, L0 = 1.6, w0 = 2, T = 6;
        const es = v.slider('axial strain rate $\\varepsilon$ (1/s)', -0.3, 0.3, 0.25, { step: 0.01 });
        const s = v.stage({ x: [-6, 6], y: [-1, 1], equal: true, axes: false, height: 260, full: true, title: 'side view: the vortex tube is stretched' });
        const e = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, axes: false, height: 300, weight: 0.8, title: 'end view' });
        const g = v.stage({ x: [0, T], y: [0, 3], axes: 'box', gutter: true, height: 300, weight: 1.2, xlabel: 'time $t$ (s)', title: 'amplification' });
        const rg = v.rng(11), tr = [];
        for (let i = 0; i < 52; i++) tr.push({ z: (rg() - 0.5) * L0, r: R0 * Math.sqrt(rg()), p: TAU * rg() });
        const th = (t, ep) => (Math.abs(ep) < 1e-9 ? (w0 * t) / 2 : (w0 / (2 * ep)) * (Math.exp(ep * t) - 1));
        let info = {};
        v.animate((t) => {
          const ep = es.value, st = Math.exp(ep * t), L = L0 * st, R = R0 / Math.sqrt(st), w = w0 * st, ang = th(t, ep);
          s.rect(-L0 / 2, -R0, L0 / 2, R0, { color: 'muted', width: 1, dash: true });
          s.rect(-L / 2, -R, L / 2, R, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 2 });
          s.arrow(-L / 2 - 0.3, 0, L / 2 + 0.3, 0, { color: 'orange', width: 1.5 });
          s.text('ω', L / 2 + 0.5, 0.25, { color: 'orange', math: true, size: 16 });
          const e0 = tr.map((q) => ({ z: q.z * st, y: q.r * Math.cos(q.p + ang) / Math.sqrt(st), d: Math.sin(q.p + ang), x: q.r * Math.cos(q.p + ang) / Math.sqrt(st), w: q.r * Math.sin(q.p + ang) / Math.sqrt(st) }));
          e0.sort((a, b) => a.d - b.d);
          for (const q of e0) { if (Math.abs(q.z) < 6) s.dot(q.z, q.y, { r: 3, color: 'gold', hollow: q.d < 0 }); }
          e.circle(0, 0, R0, { color: 'muted', width: 1, dash: true });
          e.circle(0, 0, R, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 2 });
          for (const q of e0) e.dot(q.x, q.w, { r: 3, color: 'gold' });
          const ymax = Math.max(1.5, 1.1 * Math.exp(Math.abs(ep) * T));
          g.setView([0, T], [0, Math.max(1.6, Math.min(8, ymax))]);
          g.hline(1, { color: 'green', width: 2.4 });
          g.fn((x) => Math.exp(ep * x), { color: 'orange', width: 4, domain: [0, T] });
          g.fn((x) => Math.exp(ep * x), { color: 'accent', width: 2, dash: true, domain: [0, T] });
          g.fn((x) => Math.exp(ep * x), { color: 'purple', width: 1.5, dash: [2, 3], domain: [0, T] });
          g.vline(t, { color: 'gold' });
          info = { t, L: L / L0, R, w: w / w0, G: (w * R * R) / (w0 * R0 * R0), vol: (R * R * L) / (R0 * R0 * L0) };
        }, { period: T, still: 4.5 });
        v.legend([['orange', '$\\omega/\\omega_0$'], ['accent', '$L/L_0$', { dash: true }], ['purple', '$(R_0/R)^2$', { dash: true }], ['green', '$\\Gamma/\\Gamma_0$']]);
        v.readout(() => `$t=${v.fix(info.t, 1)}$ s: $L/L_0=${v.fix(info.L, 3)}$, $R=${v.fix(info.R, 3)}$ m, $\\omega/\\omega_0=${v.fix(info.w, 3)}$\n tube volume $\\pi R^2L$ unchanged ($${v.fix(info.vol, 4)}$ of the initial) · circulation $\\Gamma/\\Gamma_0=${v.fix(info.G, 4)}$ · $(\\omega/\\omega_0)/(L/L_0)=${v.fix(info.w / info.L, 4)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Helmholtz’s vortex theorems',
      statement: String.raw`In an inviscid, barotropic fluid with conservative body forces: (i) fluid particles that lie on a vortex line at one instant lie on a vortex line at every later instant, so vortex lines move with the fluid; (ii) the strength of a vortex tube, the circulation round it (equal to the flux $\int\boldsymbol\omega\cdot d\mathbf S$ through any cross-section), is the same at every cross-section of the tube and constant in time; (iii) a vortex tube cannot begin or end in the fluid: it forms a closed loop, runs to infinity, or ends on a boundary. Part (iii) is $\nabla\cdot\boldsymbol\omega=0$.`,
      idea: String.raw`Statement (iii) and the constancy along the tube are just $\nabla\cdot(\nabla\times\mathbf u)=0$ and the divergence theorem applied to a piece of tube. For (i) and the constancy in time, note that a loop drawn on the wall of a vortex tube has zero circulation (the vorticity is tangent to the wall, Stokes' theorem), and by Kelvin's theorem (3.1) this stays true for the material loop as it moves, so the wall stays a vortex-tube wall. The strength of the tube is then the circulation round any material loop encircling it, which Kelvin says never changes.`,
      caption: String.raw`A thin vortex tube, a closed ring of fluid particles, is carried through the steady ABC flow (a flow with $\nabla\times\mathbf u=\mathbf u$; here only the ring's transport is used, the ring being too weak to modify the background). The tube is drawn thinner where it is stretched. At six stations a tiny square of fluid particles surrounds the line and two more particles mark its length; the right panel follows the selected station: the vorticity (stretch of the line, orange) grows, the cross-section (blue) shrinks by the same factor, and their product, the tube strength, stays at 1 (green). Drag to rotate the 3D view. No part of the tube ever ends in the fluid.`,
      deps: ['fluid-3.1', 'fluid-3.3'],
      refs: ['Kundu §5.2', 'Acheson ch. 5'],
      credit: 'Hermann von Helmholtz, “Über Integrale der hydrodynamischen Gleichungen, welche den Wirbelbewegungen entsprechen”, J. reine angew. Math. 55, 25–55, 1858',
      tags: ['vortex tube', 'Helmholtz', 'Kelvin'],
      scope: String.raw`Inviscid, barotropic, conservative forces. In this picture the ring is treated as a passive thin tube in a prescribed volume-preserving flow, which is what the theorems say about the transport of vorticity; the measured strength is accurate to the size of the tracer square (about 1–3%).`,
      viz(v) {
        const EPS = 0.01, CAP = 1800, N0 = 120, R = 1.2, DT = 0.025, fl = (p) => abc(p).map((x) => 0.45 * x);
        const sh = v.select('ring', [{ value: 'flat', label: 'flat' }, { value: 'tilt', label: 'tilted' }], 'flat', { onChange: () => { S.reset(); } });
        const ks = v.select('station', ['1', '2', '3', '4', '5', '6'], '1');
        const s3 = v.stage3d({ range: 3.2, height: 420, yaw: -0.7, pitch: 0.45, axes: false, weight: 1.3, title: 'a vortex tube carried by the flow' });
        const hp = v.stage({ x: [0, 10], y: [0.05, 20], ylog: true, axes: 'box', gutter: true, height: 420, weight: 0.85, xlabel: 'time $t$', title: 'selected station (log scale)' });
        const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const dotp = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = (a) => Math.hypot(a[0], a[1], a[2]);
        const rotp = (p, tilt) => (tilt ? [p[0], p[1] * Math.cos(0.9) - p[2] * Math.sin(0.9), p[1] * Math.sin(0.9) + p[2] * Math.cos(0.9)] : p);
        const init = () => {
          const tilt = sh.value === 'tilt', pts = [], sp = [], tang = [];
          const c0 = tilt ? [0.6, -0.3, 0.2] : [0, 0, 0];
          const pos = (u) => { const p = rotp([R * Math.cos(u), R * Math.sin(u), 0], tilt); return [p[0] + c0[0], p[1] + c0[1], p[2] + c0[2]]; };
          for (let i = 0; i < N0; i++) { pts.push(pos((TAU * i) / N0)); sp.push((R * TAU * i) / N0); }
          const stations = [];
          for (let k = 0; k < 6; k++) {
            const u = (TAU * k) / 6 + 0.3, c = pos(u), cp = pos(u + 1e-4), cm = pos(u - 1e-4);
            const t = sub(cp, cm), tl = nrm(t), T = t.map((x) => x / tl);
            const ref = Math.abs(T[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
            let n1 = cross(ref, T); n1 = n1.map((x) => x / nrm(n1)); const n2 = cross(T, n1);
            const add = (a, b, f) => [a[0] + f * b[0], a[1] + f * b[1], a[2] + f * b[2]];
            stations.push({ p: [add(c, T, -EPS), add(c, T, EPS), add(c, n1, -EPS), add(c, n1, EPS), add(c, n2, -EPS), add(c, n2, EPS)], hist: [] });
          }
          return { pts, sp, stations, t: 0, k: 0, L0: R * TAU, ms: 1 };
        };
        const measure = (stn) => {
          const P = stn.p, wv = sub(P[1], P[0]).map((x) => x / (2 * EPS));
          const Av = cross(sub(P[3], P[2]), sub(P[5], P[4])).map((x) => 0.5 * x);
          return [nrm(wv), nrm(Av) / (2 * EPS * EPS), dotp(wv, Av) / (2 * EPS * EPS)];
        };
        const S = v.sim(init, (st, dt) => {
          for (let i = 0; i < st.pts.length; i++) st.pts[i] = rk4p(fl, st.pts[i], dt);
          for (const stn of st.stations) for (let j = 0; j < 6; j++) stn.p[j] = rk4p(fl, stn.p[j], dt);
          st.t += dt; st.k++;
          if (st.k % 4 === 0) {
            const np = [], ns = [], n = st.pts.length;
            for (let i = 0; i < n; i++) {
              const j = (i + 1) % n; np.push(st.pts[i]); ns.push(st.sp[i]);
              if (nrm(sub(st.pts[j], st.pts[i])) > 0.1 && np.length + n < CAP) {
                np.push(st.pts[i].map((c, q) => (c + st.pts[j][q]) / 2)); ns.push((st.sp[i] + (j === 0 ? st.L0 : st.sp[j])) / 2);
              }
            }
            st.pts = np; st.sp = ns;
            for (const stn of st.stations) stn.hist.push([st.t, ...measure(stn)]);
          }
        }, { dt: DT });
        let info = {};
        const cols = ['accent', 'teal', 'green', 'gold', 'orange', 'red'];
        v.animate((t) => {
          const st = S.advance(t), n = st.pts.length;
          let tot = 0, ms = 1;
          const cen = st.pts.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n, a[2] + p[2] / n], [0, 0, 0]), mv = (p) => [p[0] - cen[0], p[1] - cen[1], p[2] - cen[2]];
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n, ds = (i + 1 === n ? st.L0 : st.sp[j]) - st.sp[i], len = nrm(sub(st.pts[j], st.pts[i]));
            const stretch = len / ds; tot += len; ms = Math.max(ms, stretch);
            const bin = clamp(Math.floor(Math.log2(stretch) + 1.5), 0, 5);
            s3.line(mv(st.pts[i]), mv(st.pts[j]), { color: cols[bin], width: clamp(3.4 / Math.sqrt(stretch), 0.9, 3.4) });
          }
          const sel = Number(ks.value) - 1;
          st.stations.forEach((stn, k) => {
            const m = measure(stn);
            const cx = stn.p.slice(2).reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4, a[2] + p[2] / 4], [0, 0, 0]);
            s3.dot(mv(cx), { r: k === sel ? 6 : 4, color: k === sel ? 'ink' : 'muted', label: String(k + 1) });
            stn._m = m;
          });
          const H = st.stations[sel].hist;
          hp.hline(1, { color: 'green', width: 2.4 });
          hp.path(H.map((q) => [q[0], q[1]]), { color: 'orange', width: 2.4 });
          hp.path(H.map((q) => [q[0], q[2]]), { color: 'accent', width: 2.4 });
          hp.path(H.map((q) => [q[0], q[3]]), { color: 'green', width: 2.4, dash: true });
          const fl = st.stations.map((q) => q._m[2]);
          info = { t: st.t, len: tot / st.L0, ms, fl, w: st.stations[sel]._m[0], a: st.stations[sel]._m[1] };
        }, { period: 10, still: 8 });
        v.legend([['orange', 'vorticity $|\\boldsymbol\\omega|/\\omega_0$'], ['accent', 'cross-section $A/A_0$'], ['green', 'strength $\\omega A$', { dash: true }]]);
        v.readout(() => `$t=${v.fix(info.t, 1)}$ · tube length ${v.fix(info.len, 2)}× initial, strongest stretch ${v.fix(info.ms, 1)}×\nstrength $\\omega A/\\omega_0A_0$ at the six stations: ${info.fl.map((x) => v.fix(x, 3)).join(', ')} — all 1 within the tracer-square error\nstation ${ks.value}: $|\\omega|/\\omega_0=${v.fix(info.w, 2)}$, $A/A_0=${v.fix(info.a, 3)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Law',
      name: 'Biot–Savart law for vorticity',
      statement: String.raw`In an incompressible fluid that is at rest at infinity and has no interior boundaries, the velocity is fixed by the vorticity distribution:
$$\mathbf u(\mathbf x)=\frac1{4\pi}\int\frac{\boldsymbol\omega(\mathbf x')\times(\mathbf x-\mathbf x')}{|\mathbf x-\mathbf x'|^3}\,dV'.$$
For a thin vortex filament $C$ of circulation $\Gamma$ this becomes $\mathbf u(\mathbf x)=\dfrac{\Gamma}{4\pi}\oint_C\dfrac{d\mathbf l'\times(\mathbf x-\mathbf x')}{|\mathbf x-\mathbf x'|^3}$. It is the same formula that gives the magnetic field of a current, with $\boldsymbol\omega$ playing the role of the current density and $\mathbf u$ that of $\mathbf B$; a straight infinite filament gives a swirl of speed $\Gamma/(2\pi r)$, and a circular ring of radius $R$ gives $\Gamma R^2/\big(2(R^2+z^2)^{3/2}\big)$ along its axis.`,
      idea: String.raw`Incompressibility lets one write $\mathbf u=\nabla\times\mathbf A$ with $\nabla\cdot\mathbf A=0$, and then $\boldsymbol\omega=\nabla\times\nabla\times\mathbf A=-\nabla^2\mathbf A$. Each component of $\mathbf A$ solves a Poisson equation whose solution is the convolution of $\boldsymbol\omega$ with the free-space Green's function $1/(4\pi|\mathbf x|)$ (Laplace's equation, 4.2, is the homogeneous case). Taking the curl of the result differentiates $1/|\mathbf x-\mathbf x'|$ and produces the cross-product kernel. So the velocity at a point is a weighted sum over all the vorticity in the flow, falling off as the inverse square of distance.`,
      caption: String.raw`A vortex filament (top view of its section by the plane $y=0$: $\odot$ points toward you, $\otimes$ away) induces the arrows drawn in that plane. Choose a straight line, a ring or a helix, and move the probe: the velocity there is found by adding up the exact contributions of 200 to 600 straight segments of the filament. For the straight line the result is compared with $\Gamma/2\pi r$; for the ring, the on-axis value is compared with the closed formula. Change $\Gamma$, the radius or the pitch and watch the arrows change linearly with $\Gamma$ and fall off with distance. The helix is a finite coil of 24 turns, so only its middle is a good picture of an infinitely long one.`,
      deps: ['fluid-1.9', 'fluid-1.7'],
      refs: ['Kundu §5.4'],
      tags: ['vorticity', 'Biot–Savart', 'induced velocity'],
      scope: String.raw`Unbounded incompressible flow with vorticity of finite extent. Near a real filament of finite core size the formula diverges logarithmically, so the picture stays outside a distance of a few core radii; inside walls the velocity also needs an irrotational correction.`,
      viz(v) {
        const kind = v.select('filament', [{ value: 'line', label: 'straight line' }, { value: 'ring', label: 'ring' }, { value: 'helix', label: 'helix' }], 'ring');
        const gs = v.slider('circulation $\\Gamma$', 0.2, 3, 1, { step: 0.05 });
        const rs = v.slider('radius $R$', 0.5, 1.6, 1, { step: 0.05 });
        const ps = v.slider('helix pitch', 0.1, 1.5, 0.4, { step: 0.05 });
        const s = v.stage({ x: [-3.2, 3.2], y: [-2.3, 2.3], equal: true, axes: 'box', gutter: true, height: 420, full: true, xlabel: '$x$', ylabel: '$z$', title: 'induced velocity in the plane y = 0' });
        const pr = s.handle(1.9, 0.9, { color: 'gold', r: 8, label: 'probe', labelPos: 'ne' });
        let fil = null, info = {};
        const build = () => {
          const R = rs.value, pts = [];
          if (kind.value === 'line') pts.push([0, -400, 0], [0, 400, 0]);
          else if (kind.value === 'ring') for (let i = 0; i < 200; i++) pts.push([R * Math.cos((TAU * i) / 200), R * Math.sin((TAU * i) / 200), 0]);
          else for (let i = 0; i <= 600; i++) { const f = -24 * Math.PI + (48 * Math.PI * i) / 600; pts.push([R * Math.cos(f), (ps.value * f) / TAU, R * Math.sin(f)]); }
          return pts;
        };
        v.render(() => {
          const closed = kind.value === 'ring', G = gs.value, R = rs.value;
          ps.el.hidden = kind.value !== 'helix'; rs.el.hidden = kind.value === 'line';
          fil = build();
          const U = (a, b) => biotSavart(fil, closed, G, [a, 0, b]);
          let mx = 0; const arrows = [];
          for (let a = -4.8; a <= 4.81; a += 0.4) for (let b = -2.2; b <= 2.21; b += 0.4) {
            const w = U(a, b), m = Math.hypot(w[0], w[2]);
            if (Math.hypot(a - (kind.value === 'line' ? 0 : R), b) < 0.16 || (kind.value === 'ring' && Math.hypot(a + R, b) < 0.16) || (kind.value === 'line' && Math.hypot(a, b) < 0.16)) continue;
            arrows.push([a, b, w[0], w[2], m]); mx = Math.max(mx, m);
          }
          for (const [a, b, ux, uz, m] of arrows) {
            const L = 0.34 * Math.pow(m / (mx + 1e-12), 0.45);
            if (m > 1e-9) s.arrow(a, b, a + (L * ux) / m, b + (L * uz) / m, { color: 'accent', width: 1.6, head: 6, alpha: 0.35 + 0.65 * Math.min(1, m / (0.4 * mx)) });
          }
          if (kind.value === 'line') s.text('⊙', 0, 0, { size: 24, color: 'orange' });
          else if (kind.value === 'ring') { s.text('⊙', R, 0, { size: 24, color: 'orange' }); s.text('⊗', -R, 0, { size: 24, color: 'orange' }); }
          else s.text('⊙', R, 0, { size: 24, color: 'orange' });
          const w = U(pr.x, pr.y), m = Math.hypot(w[0], w[2]);
          s.arrow(pr.x, pr.y, pr.x + (0.8 * w[0]) / (m + 1e-12) * Math.min(1, m * 1.2), pr.y + (0.8 * w[2]) / (m + 1e-12) * Math.min(1, m * 1.2), { color: 'gold', width: 3, head: 10 });
          const r = Math.hypot(pr.x, pr.y), ax = U(0, pr.y);
          info = { m, wx: w[0], wz: w[2], r, line: G / (TAU * r), ring: (G * R * R) / (2 * Math.pow(R * R + pr.y * pr.y, 1.5)), ax: Math.hypot(ax[0], ax[1], ax[2]), z: pr.y, G };
        });
        v.readout(() => {
          const k = kind.value;
          let l2 = '';
          if (k === 'line') l2 = `\nstraight filament: $\\Gamma/2\\pi r=${v.fix(info.line, 4)}$ — relative difference $${v.sci(Math.abs(info.m - info.line) / info.line + 1e-12, 2)}$ (the filament is cut at $\\pm400$)`;
          else if (k === 'ring') l2 = `\non the axis at height $z=${v.fix(info.z, 2)}$: integral $${v.fix(info.ax, 5)}$ vs $\\Gamma R^2/2(R^2+z^2)^{3/2}=${v.fix(info.ring, 5)}$ (probe is at $x=${v.fix(pr.x, 2)}$, off the axis)`;
          else l2 = '\nthe coil swirls round its axis and carries fluid along it: the velocity here has both components';
          return `probe at $(${v.fix(pr.x, 2)}, ${v.fix(pr.y, 2)})$: $\\mathbf u=(${v.fix(info.wx, 4)},\\,${v.fix(info.wz, 4)})$, $|\\mathbf u|=${v.fix(info.m, 4)}$ (proportional to $\\Gamma=${v.fix(info.G, 2)}$)${l2}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Model',
      name: 'Rankine vortex',
      statement: String.raw`The Rankine vortex is a steady, axisymmetric swirl with total circulation $\Gamma$ and a core of radius $a$:
$$u_\theta=\begin{cases}\dfrac{\Gamma r}{2\pi a^2},&r\le a\ \text{(solid-body rotation, } \omega_z=\Gamma/\pi a^2\text{)},\\[2mm]\dfrac{\Gamma}{2\pi r},&r\ge a\ \text{(irrotational)}.\end{cases}$$
The pressure follows from the radial balance $\partial p/\partial r=\rho u_\theta^2/r$: with $p\to p_\infty$ far away, $p-p_\infty=-\rho\Gamma^2/(8\pi^2r^2)$ outside and $-\rho\big(\Gamma^2/4\pi^2a^2\big)\big(1-r^2/2a^2\big)$ inside, so the pressure is lowest at the axis, lower by $\rho\Gamma^2/(4\pi^2a^2)$. A free surface above the vortex dips by $\Gamma^2/(4\pi^2a^2g)$ at the centre.`,
      idea: String.raw`Any $u_\theta(r)$ is a steady solution of Euler's equation (2.8) provided the pressure supplies the centripetal force, so the Rankine vortex is the simplest swirl with a finite vorticity core. The inside is a rigidly rotating cylinder of fluid; the outside is the field of a line vortex (the Biot–Savart result of 3.5). The two pieces match in velocity at $r=a$ but not in vorticity, which jumps from $\Gamma/\pi a^2$ to zero. Bernoulli's theorem (2.9), applied on the free surface where $p$ is atmospheric, converts the pressure deficit into the depth of the dimple.`,
      caption: String.raw`Left: top view of a vortex in water. Fluid particles (gold) go round faster the nearer they are to the axis in the outer region, but at a constant angular rate inside the core, shown in slow motion. The paddle wheel (red spoke) follows a circular streamline: it spins with the core and stays pointing in one direction outside, even though the water circles the centre. Middle: the velocity profile; drag the handle to change the core radius. Right: the dimple of a free surface above the vortex (water 0.35 m deep). Make $\Gamma$ large or $a$ small and the dimple reaches the floor: an air core forms and the model, which assumes a single connected surface, no longer applies.`,
      deps: ['fluid-1.9', 'fluid-2.9'],
      refs: ['Kundu §3.5', 'Acheson ch. 5'],
      tags: ['vortex', 'Rankine', 'free surface'],
      verify: true,
      scope: String.raw`Steady, inviscid, axisymmetric and two-dimensional; real vortices (a bathtub vortex, a tornado) have smooth cores, which a Lamb–Oseen vortex describes better. The model is named after W. J. M. Rankine; I did not trace the original passage in his work, so no date is given. The numbers here (water at 1000 kg/m³, $g=9.81$ m/s²) are chosen for illustration.`,
      viz(v) {
        const g = G0, H = 0.35, RM = 0.3;
        const Gs = v.slider('circulation $\\Gamma$ (m²/s)', 0.05, 1, 0.4, { step: 0.01 });
        const as = v.slider('core radius $a$ (m)', 0.02, 0.15, 0.06, { step: 0.005 });
        const ws = v.slider('paddle-wheel radius $r_w$ (m)', 0.01, 0.28, 0.03, { step: 0.005 });
        const sa = v.stage({ x: [-RM, RM], y: [-RM, RM], equal: true, axes: false, height: 340, weight: 1, title: 'top view' });
        const sb = v.stage({ x: [0, RM], y: [0, 4], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'radius $r$ (m)', ylabel: '$u_\\theta$ (m/s)', title: 'velocity profile' });
        const sc = v.stage({ x: [-RM, RM], y: [-0.45, 0.06], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'distance from the axis (m)', ylabel: 'surface height (m)', title: 'free surface above the vortex' });
        const uth = (r) => { const G = Gs.value, a = as.value; return r <= a ? (G * r) / (TAU * a * a) : G / (TAU * r); };
        const eta = (r) => { const G = Gs.value, a = as.value, k = (G * G) / (4 * Math.PI * Math.PI * g); return r <= a ? -(k / (a * a)) * (1 - (r * r) / (2 * a * a)) : -(k / 2) / (r * r); };
        const hd = sb.handle(0.06, 2, { color: 'orange', r: 8, label: 'a', labelPos: 'ne', constrain: (x) => [clamp(x, 0.02, 0.15), 2] });
        hd.onDrag = () => { as.set(hd.x); };
        const radii = [0.025, 0.05, 0.08, 0.11, 0.15, 0.19, 0.24, 0.29];
        let info = {};
        v.animate((t) => {
          const G = Gs.value, a = as.value, tt = t / 12, om = G / (Math.PI * a * a);
          const umax = G / (TAU * a);
          hd.set(a, umax);
          sb.setView([0, RM], [0, Math.max(1, 1.25 * umax)]);
          sa.circle(0, 0, a, { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 1.6 });
          for (const r of radii) {
            sa.circle(0, 0, r, { color: 'faint', width: 1 });
            for (let k = 0; k < 4; k++) { const th = (k * Math.PI) / 2 + (uth(r) / r) * tt; sa.dot(r * Math.cos(th), r * Math.sin(th), { r: 3.4, color: 'gold' }); }
          }
          const rw = ws.value, thw = (uth(rw) / rw) * tt, spin = rw <= a ? (om / 2) * tt : 0;
          const wx = rw * Math.cos(thw), wy = rw * Math.sin(thw), L = 0.035;
          sa.line(wx - L * Math.sin(spin), wy + L * Math.cos(spin), wx + L * Math.sin(spin), wy - L * Math.cos(spin), { color: 'ink', width: 2.4 });
          sa.line(wx - L * Math.cos(spin), wy - L * Math.sin(spin), wx, wy, { color: 'ink', width: 2.4 });
          sa.line(wx, wy, wx + L * Math.cos(spin), wy + L * Math.sin(spin), { color: 'red', width: 3.4 });
          sa.dot(wx, wy, { r: 3, color: 'ink' });
          sa.text('core', 0, a + 0.012, { size: 13, color: 'orange', align: 'center' });
          sb.fn(uth, { color: 'accent', width: 2.6, domain: [0, RM] });
          sb.vline(rw, { color: 'red', dash: true, alpha: 0.6 });
          sb.fn((r) => G / (TAU * r), { color: 'muted', dash: true, domain: [a, RM], width: 1.4 });
          const e0 = eta(0), air = -e0 > H;
          sc.rect(-RM, -H, RM, 0.06, { fill: 'panel', color: 'ink', width: 0 });
          sc.between((x) => Math.max(eta(Math.abs(x)), -H), () => -H, -RM, RM, { fill: 'accent', fillAlpha: 0.3 });
          sc.fn((x) => Math.max(eta(Math.abs(x)), -H), { color: 'accent', width: 2.6, domain: [-RM, RM], n: 400 });
          sc.hline(-H, { color: 'ink', width: 2 });
          sc.vline(a, { color: 'orange', dash: true, alpha: 0.6 }); sc.vline(-a, { color: 'orange', dash: true, alpha: 0.6 });
          if (air) sc.text('air core: the dimple reaches the floor', 0, -0.05, { size: 14, color: 'red', align: 'center' });
          info = { umax, om, dp: (1000 * G * G) / (4 * Math.PI * Math.PI * a * a), e0, air, uw: uth(rw), wspin: rw <= a ? om / 2 : 0, rw, a };
        }, { period: 24, still: 3 });
        v.legend([['accent', '$u_\\theta(r)$'], ['muted', '$\\Gamma/2\\pi r$ continued inward', { dash: true }], ['orange', 'core, $\\omega\\ne0$']]);
        v.readout(() => `peak speed $\\Gamma/2\\pi a=${v.fix(info.umax, 2)}$ m/s at $r=a$ · core vorticity $\\Gamma/\\pi a^2=${v.fix(info.om, 1)}$ s$^{-1}$ · pressure at the axis lower by $${v.fix(info.dp / 1000, 2)}$ kPa\nsurface dip at the axis $\\Gamma^2/4\\pi^2a^2g=${v.fix(-info.e0, 3)}$ m${info.air ? ' (**deeper than the water: air core**)' : ''} · wheel at $r=${v.fix(info.rw, 3)}$ m ${info.rw <= info.a ? 'inside' : 'outside'} the core: speed $${v.fix(info.uw, 2)}$ m/s, spin rate $\\omega/2=${v.fix(info.wspin, 2)}$ s$^{-1}$`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Model',
      name: 'Point-vortex dynamics',
      statement: String.raw`In two-dimensional incompressible Euler flow whose vorticity is concentrated in $N$ points $(x_j,y_j)$ carrying circulations $\Gamma_j$, each vortex is carried by the velocity the others induce:
$$\dot x_j-i\dot y_j\ \ \text{(complex form)}\ \ =\ \frac1{2\pi i}\sum_{k\neq j}\frac{\Gamma_k}{z_j-z_k}.$$
The system is Hamiltonian, with $H=-\frac1{4\pi}\sum_{j\neq k}\Gamma_j\Gamma_k\ln|z_j-z_k|$, and $x_j,\,y_j$ conjugate up to the factor $\Gamma_j$. It conserves $H$, the linear impulse $\sum\Gamma_jz_j$ and the angular impulse $\sum\Gamma_j|z_j|^2$. Two vortices circle their centre of vorticity, or translate together if their circulations are equal and opposite; three vortices are integrable; four or more can move chaotically.`,
      idea: String.raw`Each vortex is a point source of the line-vortex velocity $\Gamma/2\pi r$ (3.5 in two dimensions), and by Kelvin's theorem (3.1) and Helmholtz's theorems (3.4) the vorticity stays on the same fluid particles, so the vortices are simply advected by the field of the others (not by their own: that is singular and has zero mean effect). Writing out the equations shows that $\Gamma_j\dot x_j=\partial H/\partial y_j$ and $\Gamma_j\dot y_j=-\partial H/\partial x_j$, which is Hamilton's form (12.3 of mechanics). Noether's theorem gives the translations and rotation, and with three vortices there are enough independent invariants in involution to integrate; for four there are not.`,
      caption: String.raw`Choose a preset or click in the left panel to add a vortex (shift-click: opposite sign); the system restarts from $t=0$ each time. Circulations are in units of $2\pi$ (so a unit vortex has speed $1/r$). Watch the trails: two like vortices circle each other, a dipole travels in a straight line, and two dipoles leapfrog. Four identical vortices in a square-ish arrangement wander irregularly. The right panel plots the distances between vortices, and the readout lists the three invariants as errors of the numerical integration (4th-order Runge–Kutta, step 0.004); they stay tiny except in very close encounters.`,
      deps: ['fluid-3.5', 'mech-12.3'],
      refs: ['Kundu §5.6', 'Acheson ch. 5'],
      credit: 'Equations of motion: H. von Helmholtz, 1858; Hamiltonian form: G. Kirchhoff, Vorlesungen über mathematische Physik, 1876; integrability of three vortices: W. Gröbli, 1877',
      tags: ['point vortices', 'Hamiltonian', 'chaos'],
      scope: String.raw`Two-dimensional, inviscid, unbounded flow with point singularities (real vortices have cores; the model is good while the separations are much larger than the core radius). The syllabus line speaks of chaos for three or more vortices; the identical-vortex result is that three are integrable and four are not (Aref and Pomphrey, 1982), which this item follows.`,
      viz(v) {
        const P = {
          pair: { name: 'two like vortices', g: [1, 1], x: [-0.5, 0.5], y: [0, 0], T: 6 },
          dip: { name: 'a dipole', g: [1, -1], x: [0, 0], y: [-0.5, 0.5], T: 6, ymid: 1 },
          leap: { name: 'leapfrogging dipoles', g: [1, -1, 1, -1], x: [-0.8, -0.8, 0.8, 0.8], y: [0.5, -0.5, 0.5, -0.5], T: 8 },
          three: { name: 'three vortices', g: [1, 1, -0.8], x: [-1, 0.9, 0.1], y: [0, 0.2, 1.1], T: 12 },
          four: { name: 'four identical vortices', g: [1, 1, 1, 1], x: [1, 0.15, -0.8, 0.1], y: [0.05, 0.95, -0.1, -1], T: 14 },
        };
        const ps = v.select('preset', Object.keys(P).map((k) => ({ value: k, label: P[k].name })), 'leap', { onChange: () => { extra.length = 0; S.reset(); } });
        v.button('remove added vortices', () => { extra.length = 0; S.reset(); });
        const s = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 420, weight: 1.3, title: 'click to add a vortex (shift-click: opposite sign)' });
        const h = v.stage({ x: [0, 14], y: [0, 4], axes: 'box', gutter: true, height: 420, weight: 0.8, xlabel: 'time $t$', ylabel: 'distance $r_{jk}$', title: 'separations' });
        const extra = [];
        const fol = v.toggle('follow the vortices', true);
        let ctr = [0, 0], ctr0 = [0, 0];
        const cfg = () => { const q = P[ps.value]; return { g: q.g.concat(extra.map((e) => e[2])), x: q.x.concat(extra.map((e) => e[0])), y: q.y.concat(extra.map((e) => e[1])) }; };
        const inv = (st) => {
          let H = 0, px = 0, py = 0, I = 0;
          for (let i = 0; i < st.G.length; i++) { px += st.G[i] * st.x[i]; py += st.G[i] * st.y[i]; I += st.G[i] * (st.x[i] ** 2 + st.y[i] ** 2); for (let j = i + 1; j < st.G.length; j++) H -= st.G[i] * st.G[j] * Math.log(Math.hypot(st.x[i] - st.x[j], st.y[i] - st.y[j])); }
          return { H, px, py, I };
        };
        const S = v.sim(() => { const c = cfg(), st = { x: Float64Array.from(c.x), y: Float64Array.from(c.y), G: c.g.map((q) => q * TAU), tr: c.g.map((q, i) => [[c.x[i], c.y[i]]]), sep: [], k: 0, t: 0 }; st.i0 = inv(st); st.sep.push([0, ...pairs(st)]); return st; }, (st, dt) => {
          rk4Vortices({ x: st.x, y: st.y, G: st.G }, null, dt, 0); st.t += dt; st.k++;
          if (st.k % 6 === 0) { st.tr.forEach((q, i) => q.push([st.x[i], st.y[i]])); st.sep.push([st.t, ...pairs(st)]); }
        }, { dt: 0.004, maxSteps: 6000 });
        function pairs(st) { const o = []; for (let i = 0; i < st.G.length; i++) for (let j = i + 1; j < st.G.length; j++) o.push(Math.hypot(st.x[i] - st.x[j], st.y[i] - st.y[j])); return o; }
        s.onClick((x, y, mod) => { extra.push([x - (ctr[0] - ctr0[0]), y - (ctr[1] - ctr0[1]), mod.shift ? -1 : 1]); S.reset(); });
        const cl = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
        let info = {};
        v.animate((t) => {
          const st = S.advance(t), n = st.G.length;
          const mx = st.x.reduce((a, b) => a + b, 0) / n, my = st.y.reduce((a, b) => a + b, 0) / n;
          { const c0 = cfg(); ctr0 = [c0.x.reduce((a, b) => a + b, 0) / n, c0.y.reduce((a, b) => a + b, 0) / n]; }
          ctr = fol.value ? [mx, my] : ctr0; s.setView([ctr[0] - 4, ctr[0] + 4], [ctr[1] - 3, ctr[1] + 3]);
          st.tr.forEach((q, i) => s.path(q, { color: st.G[i] > 0 ? 'accent' : 'red', width: 1.3, alpha: 0.55 }));
          for (let i = 0; i < n; i++) s.dot(st.x[i], st.y[i], { r: 6 + 2 * Math.abs(st.G[i] / TAU), color: st.G[i] > 0 ? 'accent' : 'red' });
          const cx = st.G.reduce((a, g, i) => a + g * st.x[i], 0), cy = st.G.reduce((a, g, i) => a + g * st.y[i], 0), gs = st.G.reduce((a, g) => a + g, 0);
          if (Math.abs(gs) > 1e-9) s.dot(cx / gs, cy / gs, { r: 4, color: 'ink', hollow: true, label: 'centre of vorticity', labelPos: 'se' });
          const tmax = Math.max(14, st.t);
          h.setView([0, Math.max(P[ps.value].T, st.t)], [0, Math.max(3, ...st.sep.map((q) => Math.max(...q.slice(1))))]);
          const m = st.sep[0].length - 1;
          for (let k = 0; k < m; k++) h.path(st.sep.map((q) => [q[0], q[k + 1]]), { color: cl[k % cl.length], width: 1.6 });
          const I = inv(st), I0 = st.i0;
          info = { t: st.t, n, dH: Math.abs(I.H - I0.H), dP: Math.hypot(I.px - I0.px, I.py - I0.py), dI: Math.abs(I.I - I0.I), H: I.H / TAU, tmax };
        }, { period: 14, still: 10 });
        v.readout(() => `${info.n} vortices, $t=${v.fix(info.t, 1)}$ · invariants (errors since $t=0$): Hamiltonian $${v.sci(info.dH + 1e-16, 1)}$, linear impulse $\\sum\\Gamma\\mathbf x$: $${v.sci(info.dP + 1e-16, 1)}$, angular impulse $\\sum\\Gamma|\\mathbf x|^2$: $${v.sci(info.dI + 1e-16, 1)}$`);
      },
    },
  ],
};
