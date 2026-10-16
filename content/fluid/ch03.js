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
        const s = v.stage({ x: [-6, 6], y: [-1.5, 1.5], equal: true, axes: false, height: 250, weight: 1.6, title: 'side view: the vortex tube is stretched' });
        const e = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, axes: false, height: 250, weight: 0.7, title: 'end view' });
        const g = v.stage({ x: [0, T], y: [0, 3], axes: 'box', gutter: true, height: 250, weight: 1, xlabel: 'time $t$ (s)', title: 'amplification' });
        const rg = v.rng(11), tr = [];
        for (let i = 0; i < 52; i++) tr.push({ z: (rg() - 0.5) * L0, r: R0 * Math.sqrt(rg()), p: TAU * rg() });
        const th = (t, ep) => (Math.abs(ep) < 1e-9 ? (w0 * t) / 2 : (w0 / (2 * ep)) * (Math.exp(ep * t) - 1));
        let info = {};
        v.animate((t) => {
          const ep = es.value, st = Math.exp(ep * t), L = L0 * st, R = R0 / Math.sqrt(st), w = w0 * st, ang = th(t, ep);
          s.rect(-L0 / 2, -R0, L0 / 2, R0, { color: 'muted', width: 1, dash: true });
          s.rect(-L / 2, -R, L / 2, R, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 2 });
          s.arrow(-L / 2 - 0.3, 0, L / 2 + 0.3, 0, { color: 'orange', width: 1.5 });
          s.text('ω', L / 2 + 0.45, 0.2, { color: 'orange', math: true, size: 16 });
          const e0 = tr.map((q) => ({ z: q.z * st, y: q.r * Math.cos(q.p + ang) / Math.sqrt(st), d: Math.sin(q.p + ang), x: q.r * Math.cos(q.p + ang) / Math.sqrt(st), w: q.r * Math.sin(q.p + ang) / Math.sqrt(st) }));
          e0.sort((a, b) => a.d - b.d);
          for (const q of e0) { if (Math.abs(q.z) < 6) s.dot(q.z, q.y, { r: 3.3, color: 'gold', hollow: q.d < 0 }); }
          e.circle(0, 0, R0, { color: 'muted', width: 1, dash: true });
          e.circle(0, 0, R, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 2 });
          for (const q of e0) e.dot(q.x, q.w, { r: 3.3, color: 'gold' });
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
        v.readout(() => `$t=${v.fix(info.t, 1)}$ s: $L/L_0=${v.fix(info.L, 3)}$, $R=${v.fix(info.R, 3)}$ m, $\\omega/\\omega_0=${v.fix(info.w, 3)}$\n tube volume $\\pi R^2L$ unchanged ($${v.fix(info.vol, 4)}$ of the initial) · circulation $\\Gamma/\\Gamma_0=${v.fix(info.G, 4)}$ · $\\omega/\\omega_0\;/\;(L/L_0)=${v.fix(info.w / info.L, 4)}$`);
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
        const EPS = 0.02, CAP = 1800, N0 = 120, R = 1.2, DT = 0.025;
        const sh = v.select('ring', [{ value: 'flat', label: 'flat' }, { value: 'tilt', label: 'tilted' }], 'flat', { onChange: () => { S.reset(); } });
        const ks = v.select('station', ['1', '2', '3', '4', '5', '6'], '1');
        const s3 = v.stage3d({ range: 4.4, height: 420, yaw: -0.7, pitch: 0.45, axes: false, weight: 1.3, title: 'a vortex tube carried by the flow' });
        const hp = v.stage({ x: [0, 10], y: [0.02, 50], ylog: true, axes: 'box', gutter: true, height: 420, weight: 0.85, xlabel: 'time $t$', title: 'selected station (log scale)' });
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
          for (let i = 0; i < st.pts.length; i++) st.pts[i] = rk4p(abc, st.pts[i], dt);
          for (const stn of st.stations) for (let j = 0; j < 6; j++) stn.p[j] = rk4p(abc, stn.p[j], dt);
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
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n, ds = (i + 1 === n ? st.L0 : st.sp[j]) - st.sp[i], len = nrm(sub(st.pts[j], st.pts[i]));
            const stretch = len / ds; tot += len; ms = Math.max(ms, stretch);
            const bin = clamp(Math.floor(Math.log2(stretch) + 1.5), 0, 5);
            s3.line(st.pts[i], st.pts[j], { color: cols[bin], width: clamp(3.4 / Math.sqrt(stretch), 0.9, 3.4) });
          }
          const sel = Number(ks.value) - 1;
          st.stations.forEach((stn, k) => {
            const m = measure(stn);
            const cx = stn.p.slice(2).reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4, a[2] + p[2] / 4], [0, 0, 0]);
            s3.dot(cx, { r: k === sel ? 6 : 4, color: k === sel ? 'ink' : 'muted', label: String(k + 1) });
            stn._m = m;
          });
          const H = st.stations[sel].hist;
          hp.hline(1, { color: 'green', width: 2.4 });
          hp.path(H.map((q) => [q[0], q[1]]), { color: 'orange', width: 2.4 });
          hp.path(H.map((q) => [q[0], q[2]]), { color: 'accent', width: 2.4 });
          hp.path(H.map((q) => [q[0], q[3]]), { color: 'green', width: 2.4, dash: true });
          const fl = st.stations.map((q) => q._m[2]);
          info = { t: st.t, len: tot / st.L0, ms, fl, w: st.stations[sel]._m[0], a: st.stations[sel]._m[1] };
        }, { period: 10, still: 7 });
        v.legend([['orange', 'vorticity $|\\boldsymbol\\omega|/\\omega_0$'], ['accent', 'cross-section $A/A_0$'], ['green', 'strength $\\omega A$', { dash: true }]]);
        v.readout(() => `$t=${v.fix(info.t, 1)}$ · tube length ${v.fix(info.len, 2)}× initial, strongest stretch ${v.fix(info.ms, 1)}×\nstrength $\\omega A/\\omega_0A_0$ at the six stations: ${info.fl.map((x) => v.fix(x, 3)).join(', ')} — all 1 within the tracer-square error\nstation ${ks.value}: $|\\omega|/\\omega_0=${v.fix(info.w, 2)}$, $A/A_0=${v.fix(info.a, 3)}$`);
      },
    },
  ],
};
