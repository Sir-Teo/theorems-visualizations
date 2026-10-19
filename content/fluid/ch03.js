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
      caption: String.raw`Three Lamb–Oseen vortices (blue: counter-clockwise, red: clockwise) move under each other's induction, and a loop of fluid particles (orange) is released round the first one. Press play: the loop is drawn out into a long tongue towards the other vortices, yet the circulation measured on it (right, computed by summing $\mathbf u\cdot d\mathbf l$ over the loop points, which are refined as it stretches) stays on the dashed line. Now raise the viscosity $\nu$: the vortex cores spread, vorticity leaks out through the loop, and the number decays. The viscous run is a model (vortices keep their Lamb–Oseen shape while spreading), not a solution of the Navier–Stokes equations.`,
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
      deps: ['fluid-3.1', 'fluid-1.11'],
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
            const L = 0.26, c = Math.cos(q[2]), sn = Math.sin(q[2]);
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
      deps: ['fluid-1.9', 'fluid-2.8', 'vcalc-3.10'],
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
      caption: String.raw`A thin vortex tube, a closed ring of fluid particles, is carried through the steady ABC flow (a flow with $\nabla\times\mathbf u=\mathbf u$; here only the ring's transport is used, the ring being too weak to modify the background). The tube is drawn thinner where it is stretched. At six stations a tiny square of fluid particles surrounds the line and two more particles mark its length; the right panel follows the selected station: the vorticity (stretch of the line, orange) rises where the line is stretched and falls where it is compressed, the cross-section (blue) changes by the inverse factor, and their product, the tube strength, stays at 1 (green; the tube is coloured from blue, unstretched, to red, stretched many times). Drag to rotate the 3D view. No part of the tube ever ends in the fluid.`,
      deps: ['fluid-3.1', 'fluid-3.3'],
      refs: ['Kundu §5.2', 'Acheson ch. 5'],
      credit: 'Hermann von Helmholtz, “Über Integrale der hydrodynamischen Gleichungen, welche den Wirbelbewegungen entsprechen”, J. reine angew. Math. 55, 25–55, 1858',
      tags: ['vortex tube', 'Helmholtz', 'Kelvin'],
      scope: String.raw`Inviscid, barotropic, conservative forces. In this picture the ring is treated as a passive thin tube in a prescribed volume-preserving flow, which is what the theorems say about the transport of vorticity; the measured strength is accurate to the size of the tracer square (a few per cent at worst, usually far better).`,
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
      deps: ['fluid-1.9', 'fluid-1.7', 'pde-1.5'],
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
          const arrows = [];
          for (let a = -4.8; a <= 4.81; a += 0.4) for (let b = -2.2; b <= 2.21; b += 0.4) {
            const w = U(a, b), m = Math.hypot(w[0], w[2]);
            if (Math.hypot(a - (kind.value === 'line' ? 0 : R), b) < 0.16 || (kind.value === 'ring' && Math.hypot(a + R, b) < 0.16) || (kind.value === 'line' && Math.hypot(a, b) < 0.16)) continue;
            arrows.push([a, b, w[0], w[2], m]);
          }
          const mm = arrows.map((q) => q[4]).sort((p, q) => p - q), mx = mm[Math.floor(0.92 * mm.length)] || 1;
          for (const [a, b, ux, uz, m] of arrows) {
            const L = 0.36 * Math.min(1, Math.pow(m / (mx + 1e-12), 0.6));
            if (m > 1e-9) s.arrow(a, b, a + (L * ux) / m, b + (L * uz) / m, { color: 'accent', width: 1.6, head: 6, alpha: 0.4 + 0.6 * Math.min(1, m / mx) });
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
      idea: String.raw`Any $u_\theta(r)$ is a steady solution of Euler's equation (2.8) provided the pressure supplies the centripetal force, so the Rankine vortex is the simplest swirl with a finite vorticity core. The inside is a rigidly rotating cylinder of fluid; the outside is the field of a line vortex (the Biot–Savart result of 3.5). The two pieces match in velocity at $r=a$ but not in vorticity, which jumps from $\Gamma/\pi a^2$ to zero. Hydrostatic vertical balance and radial Euler balance give $g\,d\eta/dr=u_\theta^2/r$ on the atmospheric free surface; integrate from infinity. Across the rotating core one cannot assume a common Bernoulli constant on different streamlines.`,
      caption: String.raw`Left: top view of a vortex in water. Fluid particles (gold) go round faster the nearer they are to the axis in the outer region, but at a constant angular rate inside the core, shown in slow motion. The paddle wheel (red spoke) follows a circular streamline: it spins with the core and stays pointing in one direction outside, even though the water circles the centre. Middle: the velocity profile; drag the handle to change the core radius. Right: the dimple of a free surface above the vortex (water 0.35 m deep). Make $\Gamma$ large or $a$ small and the dimple reaches the floor: an air core forms and the model, which assumes a single connected surface, no longer applies.`,
      deps: ['fluid-1.9', 'fluid-2.9', 'fluid-3.5'],
      refs: ['OpenFAST OLAF Theory, complete §4.4.6.8.3.1 (Rankine core); pressure and surface height by radial Euler/hydrostatic balance'],
      tags: ['vortex', 'Rankine', 'free surface'],
      scope: String.raw`Steady, inviscid, axisymmetric and two-dimensional; The sharp core boundary is an idealization; this does not model radial drainage, viscous diffusion or vortex breakdown. The Rankine profile is documented in OpenFAST’s regularization discussion. The numbers here (water at 1000 kg/m³, $g=9.81$ m/s²) are chosen for illustration.`,
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
      idea: String.raw`Each vortex is a point source of the line-vortex velocity $\Gamma/2\pi r$ (3.5 in two dimensions), and by Kelvin's theorem (3.1) and Helmholtz's theorems (3.4) the vorticity stays on the same fluid particles, so the vortices are simply advected by the field of the others (not by their own: that is singular and has zero mean effect). Writing out the equations shows that $\Gamma_j\dot x_j=\partial H/\partial y_j$ and $\Gamma_j\dot y_j=-\partial H/\partial x_j$, which is Hamilton's form (mechanics 12.3). Noether's theorem gives the translations and rotation, and with three vortices there are enough independent invariants in involution to integrate; for four there are not.`,
      caption: String.raw`Choose a preset or click in the left panel to add a vortex (shift-click: opposite sign); the system restarts from $t=0$ each time. Circulations are in units of $2\pi$ (so a unit vortex has speed $1/r$). Watch the trails: two like vortices circle each other, a dipole travels in a straight line, and two dipoles leapfrog. The four identical vortices of the last preset are not integrable: for this arrangement a displacement of $10^{-7}$ in one vortex grows to order one by $t\approx16$ (checked numerically), so the separations never settle into a regular pattern. The right panel plots the distances between vortices, and the readout lists the three invariants as errors of the numerical integration (4th-order Runge–Kutta, step 0.004); they stay tiny except in very close encounters.`,
      deps: ['fluid-3.5', 'fluid-3.4', 'mech-12.3'],
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
          four: { name: 'four identical vortices', g: [1, 1, 1, 1], x: [0.2, -1.12, 0.18, 1.08], y: [0.56, -0.1, -0.22, -0.73], T: 16 },
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
        }, { period: 16, still: 12 });
        v.readout(() => `${info.n} vortices, $t=${v.fix(info.t, 1)}$ · invariants (errors since $t=0$): Hamiltonian $${v.sci(info.dH + 1e-16, 1)}$, linear impulse $\\sum\\Gamma\\mathbf x$: $${v.sci(info.dP + 1e-16, 1)}$, angular impulse $\\sum\\Gamma|\\mathbf x|^2$: $${v.sci(info.dI + 1e-16, 1)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Vortex rings and leapfrogging',
      statement: String.raw`A thin-cored vortex ring of circulation $\Gamma$ and radius $R$ in an ideal fluid translates along its axis at about
$$U\approx\frac{\Gamma}{4\pi R}\Big(\ln\frac{8R}{a}-\frac14\Big)$$
for a core of radius $a\ll R$ with uniform vorticity (Kelvin's formula). Two coaxial rings of the same sense interact: each one's velocity field carries the other, and the rear ring, drawn into the flow through the front one's hole, shrinks and speeds up, slips through the front ring (which widens and slows), and the roles reverse. The passing repeats, an idealised motion called leapfrogging. Because $R$ and the speed change, the picture needs the full axisymmetric Biot–Savart interaction, not the single-ring formula.`,
      idea: String.raw`By Helmholtz's theorems (3.4) each ring keeps its circulation and, since the core is a fluid volume, its core area changes as $a^2\propto1/R$. The velocity one ring induces on the other follows from the Stokes stream function of a ring, built from the elliptic integrals $K$ and $E$ (the Biot–Savart integral, 3.5, done over the circle). The motion of the pair then conserves the total impulse $\pi\sum\Gamma_jR_j^2$ (a conservation law of the Euler equations), which links shrinking to speeding up: if one ring contracts, the other must widen. The system has two degrees of freedom and this model gives a regular, periodic exchange when the rings are not too far apart.`,
      caption: String.raw`The meridian plane of two rings with their common axis horizontal; the rings appear as two pairs of dots (core circles drawn at the true core radius), and faint curves are the streamlines of the pair in the frame moving with their mean speed. Press play: the rear ring (left) contracts and runs through the front one, again and again, and the plot shows the two radii and the gap ($z_2-z_1$; it changes sign at each pass). The impulse in the readout stays constant. Move the rings farther apart or make the circulations unequal and the passes slow down or stop. If the cores touch the model no longer applies (real rings merge or break up); real rings also suffer viscous decay and instabilities not included here.`,
      deps: ['fluid-3.4', 'fluid-3.5'],
      refs: ['Kundu §5.6', 'Acheson ch. 5'],
      credit: 'Leapfrogging motion conjectured by H. von Helmholtz, 1858; self-induced speed of a thin ring with a uniform-vorticity core (constant 1/4): Lord Kelvin',
      tags: ['vortex rings', 'leapfrogging', 'impulse'],
      scope: String.raw`Axisymmetric, inviscid, thin cores ($a\ll R$, separations well above $a$), uniform core vorticity at all times. Interactions that break the axial symmetry (the Widnall-type instabilities seen in real rings) and viscous spreading are not modelled.`,
      viz(v) {
        const ds = v.slider('initial gap $d$', 0.5, 2.5, 1, { step: 0.05, onChange: () => { S.reset(); } });
        const as = v.slider('core radius $a/R_0$', 0.04, 0.25, 0.1, { step: 0.01, onChange: () => { S.reset(); } });
        const gr = v.slider('circulation ratio $\\Gamma_2/\\Gamma_1$', 0.3, 1.5, 1, { step: 0.05, onChange: () => { S.reset(); } });
        const s = v.stage({ x: [-4, 4], y: [-2.2, 2.2], equal: true, axes: 'box', gutter: true, height: 380, weight: 1.4, xlabel: 'axial position $z$ (frame following the rings)', ylabel: 'radius', title: 'two coaxial vortex rings, edge-on' });
        const h = v.stage({ x: [0, 40], y: [-2, 2], axes: 'box', gutter: true, height: 380, weight: 0.9, xlabel: 'time $t$', title: 'radii and gap' });
        const hh = 1e-5;
        const rates = (r, z, G, a0) => {
          const dr = [0, 0], dz = [0, 0];
          for (let i = 0; i < 2; i++) {
            const j = 1 - i;
            const psiz = (ringPsi(r[i], z[i] + hh, r[j], z[j], G[j]) - ringPsi(r[i], z[i] - hh, r[j], z[j], G[j])) / (2 * hh);
            const psir = (ringPsi(r[i] + hh, z[i], r[j], z[j], G[j]) - ringPsi(r[i] - hh, z[i], r[j], z[j], G[j])) / (2 * hh);
            const a = a0 / Math.sqrt(r[i]);
            dr[i] = -psiz / r[i]; dz[i] = psir / r[i] + (G[i] / (4 * Math.PI * r[i])) * (Math.log((8 * r[i]) / a) - 0.25);
          }
          return [dr, dz];
        };
        const S = v.sim(() => ({ r: [1, 1], z: [0, ds.value], t: 0, k: 0, tr: [[[0, 1]], [[ds.value, 1]]], h: [[0, 1, 1, ds.value]], passes: 0, P0: 1 + gr.value, sg: 1 }), (st, dt) => {
          const G = [1, gr.value], a0 = as.value, ad = (r, z, k, c) => [r.map((x, i) => x + c * k[0][i]), z.map((x, i) => x + c * k[1][i])];
          const k1 = rates(st.r, st.z, G, a0), [r2, z2] = ad(st.r, st.z, k1, dt / 2), k2 = rates(r2, z2, G, a0), [r3, z3] = ad(st.r, st.z, k2, dt / 2), k3 = rates(r3, z3, G, a0), [r4, z4] = ad(st.r, st.z, k3, dt), k4 = rates(r4, z4, G, a0);
          for (let i = 0; i < 2; i++) { st.r[i] += (dt / 6) * (k1[0][i] + 2 * k2[0][i] + 2 * k3[0][i] + k4[0][i]); st.z[i] += (dt / 6) * (k1[1][i] + 2 * k2[1][i] + 2 * k3[1][i] + k4[1][i]); }
          st.t += dt; st.k++;
          const sg = Math.sign(st.z[1] - st.z[0]); if (sg !== st.sg && sg !== 0) { st.passes++; st.sg = sg; }
          if (st.k % 5 === 0) { st.h.push([st.t, st.r[0], st.r[1], st.z[1] - st.z[0]]); st.tr[0].push([st.z[0], st.r[0]]); st.tr[1].push([st.z[1], st.r[1]]); }
        }, { dt: 0.01, maxSteps: 5000 });
        let info = {};
        v.animate((t) => {
          const st = S.advance(t), G = [1, gr.value], a0 = as.value;
          const zc = (st.z[0] + st.z[1]) / 2, dzs = rates(st.r, st.z, G, a0)[1], Vc = (dzs[0] + dzs[1]) / 2;
          s.setView([zc - 4, zc + 4], [-2.2, 2.2]);
          const psi = (x, y) => ringPsi(Math.abs(y) + 1e-9, x, st.r[0], st.z[0], G[0]) + ringPsi(Math.abs(y) + 1e-9, x, st.r[1], st.z[1], G[1]) - 0.5 * Vc * y * y;
          let lo = Infinity, hi = -Infinity;
          for (let i = 0; i <= 24; i++) for (let j = 0; j <= 12; j++) { const q = psi(zc - 4 + (8 * i) / 24, (2.2 * j) / 12); if (isFinite(q)) { lo = Math.min(lo, q); hi = Math.max(hi, q); } }
          const lv = []; for (let i = 1; i < 18; i++) lv.push(lo + ((hi - lo) * i) / 18);
          s.clip(() => s.contour(psi, lv, { color: 'faint', width: 1, res: 90 }));
          const cols = ['accent', 'orange'];
          for (let i = 0; i < 2; i++) {
            s.path(st.tr[i], { color: cols[i], width: 1.2, alpha: 0.5 }); s.path(st.tr[i].map((q) => [q[0], -q[1]]), { color: cols[i], width: 1.2, alpha: 0.5 });
            const a = a0 / Math.sqrt(st.r[i]);
            s.circle(st.z[i], st.r[i], a, { fill: cols[i], fillAlpha: 0.5, color: cols[i], width: 1.5 }); s.circle(st.z[i], -st.r[i], a, { fill: cols[i], fillAlpha: 0.5, color: cols[i], width: 1.5 });
          }
          s.hline(0, { color: 'muted', dash: true, width: 1 });
          s.text('ring 1', st.z[0], st.r[0] + 0.35, { color: 'accent', size: 14, align: 'center' }); s.text('ring 2', st.z[1], st.r[1] + 0.35, { color: 'orange', size: 14, align: 'center' });
          h.setView([0, 40], [-1.2, 2.2]);
          h.hline(0, { color: 'muted', dash: true });
          h.path(st.h.map((q) => [q[0], q[1]]), { color: 'accent', width: 2 }); h.path(st.h.map((q) => [q[0], q[2]]), { color: 'orange', width: 2 }); h.path(st.h.map((q) => [q[0], q[3]]), { color: 'green', width: 2, dash: true });
          const P = st.r[0] ** 2 * G[0] + st.r[1] ** 2 * G[1], dmin = Math.hypot(st.r[0] - st.r[1], st.z[0] - st.z[1]);
          info = { t: st.t, passes: st.passes, P: P / st.P0, r: st.r.slice(), gap: st.z[1] - st.z[0], close: dmin < 3 * a0 / Math.sqrt(Math.min(...st.r)) };
        }, { period: 40, still: 24 });
        v.legend([['accent', '$R_1$ (rear ring)'], ['orange', '$R_2$ (front ring)'], ['green', 'gap $z_2-z_1$', { dash: true }]]);
        v.readout(() => `$t=${v.fix(info.t, 1)}$ · rings have passed through each other ${info.passes} time${info.passes === 1 ? '' : 's'} · $R_1=${v.fix(info.r[0], 3)}$, $R_2=${v.fix(info.r[1], 3)}$, gap $${v.fix(info.gap, 3)}$\nimpulse $\\pi\\sum\\Gamma R^2$ relative to its initial value: $${v.fix(info.P, 6)}$ (conserved)${info.close ? ' — **the cores overlap here: the thin-core model has failed**' : ''}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Definition',
      name: 'Vortex sheets',
      statement: String.raw`A vortex sheet is a surface across which the tangential velocity jumps, $\mathbf u_+-\mathbf u_-=\Delta\mathbf U$; it carries vorticity concentrated on the surface, $\boldsymbol\omega=\boldsymbol\gamma\,\delta(n)$, with sheet strength (circulation per unit length) $\boldsymbol\gamma=\mathbf n\times(\mathbf u_+-\mathbf u_-)$, so $|\gamma|=\Delta U$. A flat sheet at $y=0$ in a flow with $u=-\tfrac12\Delta U$ above and $+\tfrac12\Delta U$ below is the idealisation of a thin shear layer. Approximated by a row of point vortices of strength $\Delta U\,h$ at spacing $h$, the periodic row gives $u=-\tfrac12\Delta U\,\sinh(2\pi y/h)/\big(\cosh(2\pi y/h)-\cos(2\pi x/h)\big)$, which tends to the sheet's step profile with a ripple that dies off like $e^{-2\pi|y|/h}$.`,
      idea: String.raw`The Biot–Savart law (3.5) turns a vorticity distribution into a velocity field, and a line of delta-function vorticity gives a velocity jump across the line by Stokes' theorem applied to a thin loop straddling it. For the row of point vortices the sum of the images can be done in closed form; expanding the kernel in Fourier modes in $x$ shows that only the mean (the step) survives far from the row, while the $k$-th harmonic is damped by $e^{-2\pi k|y|/h}$. In the second mode the same row is perturbed and followed in time with Krasny's regularisation: every point vortex is given a small smoothing length $\delta$, which tames the Kelvin–Helmholtz instability of the sheet and lets it roll up into a spiral.`,
      caption: String.raw`Mode 'row of vortices': a row of $N$ point vortices per unit length (dots), the velocity field $u(x,y)$ drawn as arrows, and on the right the velocity along a vertical line through the middle of a gap (blue) against the ideal sheet (dashed). Raise $N$ and the profile converges to the step; drag the probe in $y$ to read the ripple, which is close to $\tfrac12\Delta U(1-\tanh(\pi|y|N))$. Mode 'roll-up' (shown first): 120 point vortices on a sheet with a tiny sine wave (amplitude 0.01); press play and the wave grows and curls up. Change the smoothing $\delta$ and replay: a smaller $\delta$ lets the sheet curl tighter, and the result depends on $\delta$, which is the ill-posedness of the unregularised sheet.`,
      deps: ['fluid-3.5'],
      refs: ['Kundu §5.7'],
      credit: 'Roll-up computation: R. Krasny, “Desingularization of periodic vortex sheet roll-up”, J. Comput. Phys. 65, 292–313, 1986',
      tags: ['vortex sheet', 'Kelvin–Helmholtz', 'roll-up'],
      scope: String.raw`Two-dimensional inviscid flow. The unregularised sheet is a model that fails (its curvature becomes infinite) at a finite time for analytic perturbations; the second mode uses a smoothed kernel and is a numerical model, whose spiral depends on the smoothing parameter. The regularisation follows the idea of Krasny's point-vortex computation, but the number of vortices, time units and smoothing values here are my own choices, not a reproduction of his figures.`,
      viz(v) {
        const md = v.select('mode', [{ value: 'row', label: 'row of vortices' }, { value: 'roll', label: 'roll-up' }], 'roll', { onChange: () => { S.reset(); } });
        const ns = v.slider('vortices per unit length $N$', 3, 40, 8, { step: 1, int: true });
        const dl = v.slider('smoothing $\\delta$', 0.05, 0.3, 0.1, { step: 0.01, onChange: () => { S.reset(); } });
        const sa = v.stage({ x: [-0.1, 2.1], y: [-0.5, 0.5], equal: true, axes: false, height: 340, weight: 1.5, title: 'the sheet' });
        const sb = v.stage({ x: [-0.8, 0.8], y: [-0.5, 0.5], axes: 'box', gutter: true, height: 340, weight: 0.7, xlabel: 'velocity $u/\\Delta U$', ylabel: '$y$', title: 'profile through a gap' });
        let uRow = (y) => 0;
        const hp = sb.handle(-0.5, 0.18, { color: 'gold', r: 8, label: 'probe', labelPos: 'ne', constrain: (x, y) => [uRow(clamp(y, -0.45, 0.45)), clamp(y, -0.45, 0.45)] });
        const NR = 120, TR = 2.6;
        const kern = (dx, dy, d2) => { const c = Math.cosh(TAU * dy) - Math.cos(TAU * dx) + d2; return [-0.5 * Math.sinh(TAU * dy) / c, 0.5 * Math.sin(TAU * dx) / c]; };
        const S = v.sim(() => { const X = new Float64Array(NR), Y = new Float64Array(NR); for (let i = 0; i < NR; i++) { X[i] = i / NR; Y[i] = -0.01 * Math.sin(TAU * X[i]); } return { X, Y, t: 0 }; }, (st, dt) => {
          const d2 = dl.value ** 2, f = (X, Y) => { const U = new Float64Array(NR), W = new Float64Array(NR); for (let i = 0; i < NR; i++) { let u = 0, w = 0; for (let j = 0; j < NR; j++) { const q = kern(X[i] - X[j], Y[i] - Y[j], d2); u += q[0]; w += q[1]; } U[i] = u / NR; W[i] = w / NR; } return [U, W]; };
          const ax = (c, k, h) => c.map((x, i) => x + h * k[i]);
          const [u1, w1] = f(st.X, st.Y), [u2, w2] = f(ax(st.X, u1, dt / 2), ax(st.Y, w1, dt / 2)), [u3, w3] = f(ax(st.X, u2, dt / 2), ax(st.Y, w2, dt / 2)), [u4, w4] = f(ax(st.X, u3, dt), ax(st.Y, w3, dt));
          for (let i = 0; i < NR; i++) { st.X[i] += (dt / 6) * (u1[i] + 2 * u2[i] + 2 * u3[i] + u4[i]); st.Y[i] += (dt / 6) * (w1[i] + 2 * w2[i] + 2 * w3[i] + w4[i]); }
          st.t += dt;
        }, { dt: 0.01, maxSteps: 400 });
        let info = {};
        v.animate((t) => {
          const roll = md.value === 'roll';
          ns.el.hidden = roll; dl.el.hidden = !roll; hp.visible = !roll;
          if (!roll) {
            const N = ns.value, hh = 1 / N, uu = (x, y) => (Math.abs(y) < 1e-9 ? 0 : -0.5 * Math.sinh((TAU * y) / hh) / (Math.cosh((TAU * y) / hh) - Math.cos((TAU * x) / hh)));
            uRow = (y) => uu(hh / 2, y);
            sa.setView([-0.1, 2.1], [-0.5, 0.5]);
            sa.heat((x, y) => uu(x, y), { cmap: 'theme-diverging', range: [-0.55, 0.55], res: 3, key: `row${N}` });
            for (let x = 0.05; x < 2.0; x += 0.2) for (const y of [-0.4, -0.26, -0.13, 0.13, 0.26, 0.4]) { const w = uu(x, y); sa.arrow(x - 0.05 * Math.sign(w), y, x + 0.05 * Math.sign(w), y, { color: 'ink', width: 1.4, head: 6, alpha: 0.75 }); }
            sa.line(0, 0, 2, 0, { color: 'orange', width: 1.4, alpha: 0.7 });
            for (let k = 0; k < 2 * N; k++) sa.dot((k + 0.5) / N - 0.5 / N + 0, 0, { r: N > 24 ? 2.2 : 4, color: 'orange' });
            sa.text('$u=-\\Delta U/2$', 1.0, 0.47, { size: 14, color: 'ink', align: 'center', plate: true }); sa.text('$u=+\\Delta U/2$', 1.0, -0.47, { size: 14, color: 'ink', align: 'center', plate: true });
            sb.setView([-0.8, 0.8], [-0.5, 0.5]);
            sb.path([[0.5, -0.5], [0.5, 0], [-0.5, 0], [-0.5, 0.5]], { color: 'green', dash: true, width: 2 });
            const pts = []; for (let i = -450; i <= 450; i++) { const y = i / 1000; pts.push(Math.abs(y) < 1e-9 ? null : [uu(hh / 2, y), y]); } sb.path(pts, { color: 'accent', width: 2.4 });
            const y0 = hp.y, ex = -0.5 * Math.tanh((Math.PI * y0) / hh);
            hp.set(uu(hh / 2, y0), y0);
            info = { row: true, N, y0, u: uu(hh / 2, y0), ideal: -0.5 * Math.sign(y0), ex, rip: 0.5 - Math.abs(uu(hh / 2, y0)) };
          } else {
            const st = S.advance((t * TR) / 8);
            sa.setView([-0.1, 2.1], [-0.5, 0.5]);
            const pts = [], n = NR;
            for (const off of [-1, 0, 1, 2]) { for (let i = 0; i < n; i++) pts.push([st.X[i] + off, st.Y[i]]); pts.push([st.X[0] + off + 1, st.Y[0]], null); }
            const seg = []; for (const off of [-1, 0, 1, 2]) { const q = []; for (let i = 0; i <= n; i++) { const j = i % n; q.push([st.X[j] + off + (i === n ? 1 : 0), st.Y[j]]); } seg.push(q); }
            sa.clip(() => { for (const q of seg) sa.path(q, { color: 'orange', width: 1.8 }); for (const off of [0, 1]) for (let i = 0; i < n; i += 1) sa.dot(st.X[i] + off, st.Y[i], { r: 1.8, color: 'accent', ring: false }); });
            sb.setView([-0.8, 0.8], [-0.5, 0.5]);
            let L = 0; for (let i = 0; i < n; i++) { const j = (i + 1) % n; L += Math.hypot(st.X[j] - st.X[i] + (j === 0 ? 1 : 0), st.Y[j] - st.Y[i]); }
            let ym = 0; for (let i = 0; i < n; i++) ym += st.Y[i] / n;
            const prof = []; for (let i = 0; i < 90; i++) { const y = -0.45 + i * 0.01; let u = 0; for (let j = 0; j < n; j++) u += kern(0.25 - st.X[j], y - st.Y[j], dl.value ** 2)[0] / n; prof.push([u, y]); }
            sb.path(prof, { color: 'accent', width: 2.4 });
            sb.path([[0.5, -0.5], [0.5, 0], [-0.5, 0], [-0.5, 0.5]], { color: 'green', dash: true, width: 2 });
            info = { row: false, t: st.t, L, ym };
          }
        }, { period: 8, still: 6.8 });
        v.readout(() => info.row ? `$N=${info.N}$ vortices per unit length, spacing $h=${v.fix(1 / info.N, 3)}$ · at the probe ($y=${v.fix(info.y0, 2)}$, mid-gap) $u/\\Delta U=${v.fix(info.u, 4)}$, ideal sheet $${v.fix(info.ideal, 1)}$; ripple $${v.fix(info.rip, 4)}$ vs the closed form $\\tfrac12(1-\\tanh\\pi|y|N)=${v.fix(0.5 * (1 - Math.tanh(Math.PI * Math.abs(info.y0) * info.N)), 4)}$` : `$t=${v.fix(info.t, 2)}$ (units: $\\Delta U=1$, period 1) · length of the sheet ${v.fix(info.L, 2)} (initially 1) · mean height of the vortices $${v.sci(Math.abs(info.ym) + 1e-12, 1)}$ (conserved at 0)`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Definition',
      name: 'Rossby number and geostrophic balance',
      statement: String.raw`For a flow of speed $U$ and length scale $L$ in a frame rotating at angular velocity $\Omega$ (so $f=2\Omega$, or $2\Omega\sin\varphi$ at latitude $\varphi$), the Rossby number is
$$\mathrm{Ro}=\frac{U}{fL},$$
the ratio of the advective acceleration $U^2/L$ to the Coriolis acceleration $fU$. When $\mathrm{Ro}\ll1$ (and friction and unsteadiness are also small) the horizontal momentum equation reduces to geostrophic balance
$$f\,\hat{\mathbf z}\times\mathbf u=-\frac1\rho\nabla p,\qquad\text{i.e.}\quad \mathbf u_g=\frac1{\rho f}\,\hat{\mathbf z}\times\nabla p,$$
so the flow runs along the isobars, with low pressure on its left in the northern hemisphere ($f>0$), and the pressure divided by $\rho f$ acts as a stream function for the horizontal flow.`,
      idea: String.raw`Write Euler's equation (2.8) in a rotating frame, adding the Coriolis term $2\boldsymbol\Omega\times\mathbf u$ (mechanics 9.8). Scaling each term, the nonlinear acceleration is $\mathrm{Ro}$ times the Coriolis one, so for small $\mathrm{Ro}$ the pressure gradient must balance the Coriolis force alone. Since the geostrophic velocity is perpendicular to $\nabla p$ it has no component across isobars, and for constant $f$ its divergence vanishes, which is why $p/\rho f$ is a stream function. The parcel released from rest does not follow the pressure gradient: it starts that way, is turned by the Coriolis force, and performs inertial oscillations (mechanics 9.11) about the geostrophic state.`,
      caption: String.raw`A low-pressure patch (colours, contours; dimensionless: $\Phi=-e^{-r^2/2}$) in a rotating fluid. Eight fluid parcels are released from rest on a circle and followed under the full equations $\dot{\mathbf u}=-\nabla\Phi-f\hat{\mathbf z}\times\mathbf u$ for 20 time units. Turn up $f$ (and so lower $\mathrm{Ro}$): the parcels stop rushing into the low and instead stay near their isobar, doing small loops (inertial oscillations) while drifting around it. The curve shows how far in toward the centre the parcels get, plotted against $\mathrm{Ro}$, with your setting marked. The readout compares the speed of geostrophic balance with the gradient-wind speed that includes the centrifugal term at $r=1$.`,
      deps: ['fluid-2.8', 'mech-9.8', 'mech-9.11'],
      refs: ['Kundu §13.4', 'Kundu §4.7'],
      tags: ['Rossby number', 'geostrophic', 'rotation'],
      scope: String.raw`Valid for $\mathrm{Ro}\ll1$, small Ekman number (viscous forces weak against Coriolis), flows that evolve slowly compared with $1/f$, and a constant $f$ (the plane); on a sphere $f$ varies with latitude and Rossby waves appear. The Rossby number is named after C.-G. Rossby.`,
      viz(v) {
        const fs = v.slider('Coriolis parameter $f=2\\Omega$', 0.2, 12, 3, { log: true, sig: 2 });
        const s = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: false, height: 420, weight: 1.1, title: 'parcels released from rest into a low' });
        const h = v.stage({ x: [0.01, 20], y: [0, 1.05], xlog: true, axes: 'box', gutter: true, height: 420, weight: 0.9, xlabel: 'Rossby number $\\mathrm{Ro}=U/fL$', ylabel: 'fraction of the way to the centre', title: 'how far the parcels get' });
        const Phi = (x, y) => -Math.exp(-(x * x + y * y) / 2);
        const NP = 8, T = 20, R0 = 1.8;
        const traj = (f, keep) => {
          let best = 0, paths = [];
          for (let k = 0; k < NP; k++) {
            let x = R0 * Math.cos((TAU * k) / NP), y = R0 * Math.sin((TAU * k) / NP), u = 0, w = 0, rmin = R0; const pth = [[x, y]];
            const acc = (x, y, u, w) => { const e = Math.exp(-(x * x + y * y) / 2); return [-x * e + f * w, -y * e - f * u]; };
            const dt = 0.01, n = Math.round(T / dt);
            for (let i = 0; i < n; i++) {
              const a1 = acc(x, y, u, w), a2 = acc(x + (dt / 2) * u, y + (dt / 2) * w, u + (dt / 2) * a1[0], w + (dt / 2) * a1[1]), a3 = acc(x + (dt / 2) * (u + (dt / 2) * a1[0]), y + (dt / 2) * (w + (dt / 2) * a1[1]), u + (dt / 2) * a2[0], w + (dt / 2) * a2[1]);
              const a4 = acc(x + dt * (u + (dt / 2) * a2[0]), y + dt * (w + (dt / 2) * a2[1]), u + dt * a3[0], w + dt * a3[1]);
              x += dt * (u + (dt / 6) * (a1[0] + a2[0] + a3[0])); y += dt * (w + (dt / 6) * (a1[1] + a2[1] + a3[1]));
              u += (dt / 6) * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]); w += (dt / 6) * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
              rmin = Math.min(rmin, Math.hypot(x, y)); if (keep && i % 8 === 0) pth.push([x, y]);
            }
            best += (R0 - rmin) / R0; paths.push(pth);
          }
          return { frac: best / NP, paths };
        };
        const sweep = []; for (let i = 0; i <= 28; i++) { const f = 0.2 * Math.pow(60, i / 28); sweep.push([0.6065 / (f * f), traj(f, false).frac]); }
        let info = {};
        v.render(() => {
          const f = fs.value, { frac, paths } = traj(f, true);
          s.heat((x, y) => -Phi(x, y), { range: [0, 1], cmap: 'theme', res: 4, key: 'phi' });
          s.contour(Phi, [-0.9, -0.75, -0.6, -0.45, -0.3, -0.15, -0.05], { color: 'ink', alpha: 0.35, width: 1, res: 100 });
          for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
            const x = i * 0.6, y = j * 0.6, e = Math.exp(-(x * x + y * y) / 2), ug = (-y * e) / f, vg = (x * e) / f, m = Math.hypot(ug, vg);
            if (m < 1e-6) continue;
            const L = 0.3 * Math.min(1, m / 0.25 + 0.15);
            s.arrow(x, y, x + (L * ug) / m, y + (L * vg) / m, { color: 'ink', width: 1.6, head: 6, alpha: 0.7 });
          }
          paths.forEach((p, k) => { s.path(p, { color: 'orange', width: 1.8 }); s.dot(p[0][0], p[0][1], { r: 4, color: 'gold' }); s.dot(p[p.length - 1][0], p[p.length - 1][1], { r: 3.5, color: 'red' }); });
          s.circle(0, 0, R0, { color: 'muted', dash: true, width: 1 });
          h.path(sweep, { color: 'accent', width: 2.2 });
          const Ro = 0.6065 / (f * f);
          h.vline(Ro, { color: 'gold', width: 2 }); h.dot(Math.min(Ro, 19), frac, { r: 6, color: 'gold' });
          const dphi = Math.exp(-0.5), vgw = (-f + Math.sqrt(f * f + 4 * dphi)) / 2;
          info = { f, Ro, frac, vg: dphi / f, vgw };
        });
        v.legend([['orange', 'parcel paths (gold: start, red: end)'], ['ink', 'geostrophic velocity $\\mathbf u_g$']]);
        v.readout(() => `$f=${v.fix(info.f, 2)}$, $U=u_g(r{=}1)=${v.fix(info.vg, 3)}$, $\\mathrm{Ro}=${v.fix(info.Ro, 3)}$ · parcels reach ${v.fix(100 * info.frac, 0)}% of the way to the centre\nat $r=1$: geostrophic speed $${v.fix(info.vg, 4)}$, gradient-wind speed $${v.fix(info.vgw, 4)}$ (ratio $${v.fix(info.vgw / info.vg, 3)}$; geostrophy is good when Ro is small)`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Taylor–Proudman theorem',
      statement: String.raw`Consider the steady, inviscid motion of a homogeneous incompressible fluid in a frame rotating uniformly with angular velocity $\boldsymbol\Omega=\Omega\hat{\mathbf z}$, slow enough that the nonlinear term is negligible ($\mathrm{Ro}\ll1$): $2\boldsymbol\Omega\times\mathbf u=-\nabla p/\rho$. Then the velocity does not vary along the axis of rotation:
$$\frac{\partial\mathbf u}{\partial z}=\mathbf 0.$$
All three components are independent of $z$. Between a flat floor and a flat lid this forces $w\equiv0$ and the horizontal flow to be the same at every height, so the fluid moves in rigid vertical columns, and a floor obstacle can produce a Taylor column extending over the depth. The pictured stagnant interior is an idealized choice, not a unique consequence of the theorem.`,
      idea: String.raw`Take the curl of the balance: the pressure gradient drops out and, using incompressibility, $2(\boldsymbol\Omega\cdot\nabla)\mathbf u=\mathbf 0$ (the same algebra as the vorticity equation, 3.3, with the stretching term as the only survivor). So the flow cannot be stretched along $\boldsymbol\Omega$. Because $\partial_z w=0$ and $w$ vanishes on the floor, $w=0$ throughout. A short obstacle on the floor must therefore be felt as a full-depth cylinder, and the flow goes round that cylinder in every horizontal plane.`,
      caption: String.raw`A uniform stream $U$ meets a hemispherical obstacle of radius 1 sitting on the floor. Left: horizontal slice at the height $z$ you choose, with integral curves of the horizontal velocity. In the 3D mode these slice curves are not material streamlines, since vertical velocity can be nonzero. Right: the vertical section through the probe (drag the probe in the left panel), coloured by the horizontal speed $|(u,v)|/U$ (blue: slower than the stream, red: faster; the blank interior is the obstacle or the stagnant column). Mode 1 is no rotation, a 3D potential flow (the flow of a sphere, which is exact for the hemisphere on a floor by symmetry): the slice shrinks and the flow relaxes back to uniform as $z$ grows. Mode 2 is the $\mathrm{Ro}\to0$ limit: every slice is the same, the flow circles a cylinder of radius 1 reaching to the top, and the fluid inside is stagnant. Only these two limits are computed; how the picture changes in between (and with the obstacle's height) is not modelled here.`,
      deps: ['fluid-3.10', 'fluid-3.3'],
      refs: ['C. C. Mei, MIT1.63 §7.2, complete2-page derivation, Eqs.(7.2.1)–(7.2.4)'],
      credit: 'Taylor–Proudman theorem: Mei, MIT1.63, §7.2',
      tags: ['rotation', 'Taylor column', 'geostrophic'],
      scope: String.raw`Steady (or slowly varying), inviscid, homogeneous fluid with $\mathrm{Ro}\ll1$ and small Ekman number; strictly the columns extend between rigid horizontal boundaries. The comparison uses representative limiting velocity fields; it does not solve the rotating boundary-layer problem or select a unique trapped-column flow.`,
      viz(v) {
        const md = v.select('rotation', [{ value: 'none', label: 'no rotation (3D flow)' }, { value: 'fast', label: 'fast rotation, Ro → 0' }], 'none');
        const zs = v.slider('slice height $z$', 0, 3, 0.4, { step: 0.05 });
        const s = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, axes: 'box', gutter: true, height: 380, weight: 1.1, xlabel: '$x$ (stream direction)', ylabel: '$y$', title: 'horizontal slice' });
        const t = v.stage({ x: [-3, 3], y: [0, 3], axes: 'box', gutter: true, height: 380, weight: 1.1, xlabel: '$x$', ylabel: '$z$', title: 'vertical section at the probe’s $y$' });
        const pr = s.handle(-1.3, 0.5, { color: 'gold', r: 8, label: 'probe', labelPos: 'ne', constrain: { x: [-2.9, 2.9], y: [-2.3, 2.3] } });
        const vel = (x, y, z) => {
          if (md.value === 'fast') { const r2 = x * x + y * y; if (r2 < 1) return null; const r4 = r2 * r2; return [1 + (y * y - x * x) / r4, (-2 * x * y) / r4, 0]; }
          const r2 = x * x + y * y + z * z, r = Math.sqrt(r2); if (r < 1) return null;
          const r3 = r2 * r, r5 = r3 * r2;
          return [1 + 1 / (2 * r3) - (3 * x * x) / (2 * r5), (-3 * x * y) / (2 * r5), (-3 * x * z) / (2 * r5)];
        };
        v.render(() => {
          const z = zs.value, rot = md.value === 'fast';
          // streamlines of the horizontal field in the slice
          for (let k = 0; k < 17; k++) {
            let x = -3, y = -2.4 + 0.3 * k; const pts = [[x, y]];
            for (let i = 0; i < 400 && x < 3; i++) {
              const f = (a, b) => { const q = vel(a, b, z); return q ? [q[0], q[1]] : null; };
              const k1 = f(x, y); if (!k1) break; const m1 = Math.hypot(k1[0], k1[1]), d = 0.03 / m1;
              const k2 = f(x + (d / 2) * k1[0], y + (d / 2) * k1[1]); if (!k2) break;
              x += d * k2[0]; y += d * k2[1]; pts.push([x, y]); if (Math.abs(y) > 2.6) break;
            }
            s.path(pts, { color: 'accent', width: 1.5, alpha: 0.8 });
          }
          const rs = rot ? 1 : (z < 1 ? Math.sqrt(1 - z * z) : 0);
          if (rs > 0) s.circle(0, 0, rs, { fill: rot ? 'orange' : 'muted', fillAlpha: rot ? 0.28 : 0.4, color: rot ? 'orange' : 'ink', width: 2 });
          if (rot) s.text('stagnant column', 0, 0, { size: 13, color: 'orange', align: 'center' });
          if (rot && z < 1) s.circle(0, 0, Math.sqrt(1 - z * z), { color: 'ink', width: 1, dash: true });
          // vertical section at y = probe.y
          const y0 = pr.y;
          t.raster((x, zz) => { const q = vel(x, y0, zz); if (!q) return null; const sp = Math.hypot(q[0], q[1]); return v.diverge(clamp((sp - 1) / 0.6, -1, 1)); }, { res: 3, key: `${md.value}|${y0.toFixed(2)}` });
          t.hline(z, { color: 'gold', dash: true, width: 1.6 });
          t.vline(pr.x, { color: 'gold', width: 1.6, alpha: 0.7 });
          const hr = rot ? (Math.abs(y0) < 1 ? Math.sqrt(1 - y0 * y0) : 0) : (Math.hypot(y0, 0) < 1 ? 0 : 0);
          if (rot && hr > 0) t.rect(-hr, 0, hr, 3, { fill: 'orange', fillAlpha: 0.28, color: 'orange', width: 1.5 });
          if (!rot && Math.abs(y0) < 1) t.curve((a) => [Math.sqrt(1 - y0 * y0) * Math.cos(a), Math.sqrt(1 - y0 * y0) * Math.sin(a)], 0, Math.PI, { color: 'ink', width: 2 });
          t.axes();
        });
        v.readout(() => {
          const heights = [0, 0.5, 1, 2, 3].map((zz) => { const q = vel(pr.x, pr.y, zz); return q ? Math.hypot(q[0], q[1]) : 0; });
          const spread = Math.max(...heights) - Math.min(...heights);
          return `horizontal speed $|(u,v)|/U$ at the probe $(x,y)=(${v.fix(pr.x, 2)},${v.fix(pr.y, 2)})$, at heights $z=0,\\,0.5,\\,1,\\,2,\\,3$: ${heights.map((q) => v.fix(q, 3)).join(', ')}\nspread over height: $${v.fix(spread, 4)}$ — ${md.value === 'fast' ? 'zero: $\\partial\\mathbf u/\\partial z=0$, the Taylor–Proudman result' : 'not zero: without rotation the flow varies with height'}`;
        });
      },
    },
  ],
};
