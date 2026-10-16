// Vector Calculus — Chapter 3: Vector fields, divergence and curl
// Part 1 (3.1–3.6): vector fields, flow lines, gradient fields, divergence, curl, divergence as flux density.
import {
  tn, tf, tup, FIELDS, div2, curl2, rk4, flowLine, shoelace, arrowGrid, bumpSum, GL8, DEG, TAU,
} from './ch03.shared.js';

const W = [-1.3, 1.3];
const fieldOptions = (keys) => keys.map((k) => ({ value: k, label: FIELDS[k].label }));

export default {
  collection: 'vcalc',
  chapter: 3,
  title: 'Vector fields, divergence and curl',
  summary: String.raw`A vector field assigns an arrow to every point: a velocity, a force, a gradient. Its flow lines are the paths of particles carried along. Divergence measures the net outflow per unit volume and curl the circulation per unit area about an axis; both are local densities, and two short identities — the curl of a gradient and the divergence of a curl vanish — organise everything that follows.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Vector fields',
      statement: String.raw`A **vector field** on a set $U\subseteq\R^n$ is a function $\mathbf F:U\to\R^n$, $\mathbf F=(F_1,\dots,F_n)$: it attaches to every point $p\in U$ a vector $\mathbf F(p)$, thought of as an arrow *based at* $p$. It is **continuous**, **$C^k$** or **smooth** when its components $F_i$ are. In the plane we write $\mathbf F=(u,v)$ with $u,v:U\to\R$.`,
      idea: String.raw`A vector field is nothing but $n$ scalar fields bundled together (the components of 2.1), but the bundle is read geometrically: the value at $p$ is an arrow starting at $p$, not another point of the space. The same formula can be a velocity of a fluid, a force on a test charge or the gradient $\nabla f$ of a function (3.3); the first thing to know about a field is the length and direction of its arrows at every point.`,
      caption: String.raw`Choose a field, or select *your own* and type the two components (variables $x,y$). The arrows show $\mathbf F$ on a grid over a colour map of $|\mathbf F|$; drag the gold point to read the arrow at it. The right panel pulls the field apart into its two component functions: colour is $u$, orange curves are level curves of $v$.`,
      deps: ['vcalc-1.1'],
      refs: ['Marsden–Tromba §4.3', 'Schey ch. I'],
      tags: ['vector fields', 'definition'],
      viz(v) {
        const KEYS = ['mix', 'rot', 'source', 'saddle', 'shear', 'vortex', 'waves', 'eddies', 'grad'];
        const pick = v.select('field', [...fieldOptions(KEYS), { value: 'custom', label: 'your own' }], 'mix');
        const fu = v.input('$u(x,y)=$', 'sin(2y) + x/2', { vars: ['x', 'y'], width: 220 });
        const fv = v.input('$v(x,y)=$', 'cos(2x) - y/2', { vars: ['x', 'y'], width: 220 });
        const unit = v.toggle('same length for all arrows (direction only)', false);
        const S = v.stage({ x: W, y: W, equal: true, axes: 'box', gutter: true, height: 440, weight: 1.35, xlabel: 'x', ylabel: 'y', title: 'the field as arrows' });
        const Q = v.stage({ x: W, y: W, equal: true, axes: 'box', gutter: true, height: 440, weight: 1, xlabel: 'x', ylabel: 'y', title: 'its two components' });
        const P = S.handle(0.45, -0.35, { color: 'gold', label: 'p', constrain: { x: [-1.25, 1.25], y: [-1.25, 1.25] } });
        const F = (x, y) => {
          if (pick.value === 'custom') { const a = fu.fn ? fu.fn(x, y) : 0, b = fv.fn ? fv.fn(x, y) : 0; return [isFinite(a) ? a : 0, isFinite(b) ? b : 0]; }
          return FIELDS[pick.value].F(x, y);
        };
        const info = {};
        const scan = (key) => {
          if (info.key === key) return;
          const m = [], us = [], vs = [];
          for (let i = 0; i < 25; i++) for (let j = 0; j < 25; j++) { const f = F(-1.3 + 0.1083 * i, -1.3 + 0.1083 * j); m.push(Math.hypot(f[0], f[1])); us.push(f[0]); vs.push(f[1]); }
          m.sort((a, b) => a - b);
          const m90 = Math.max(m[Math.floor(0.9 * (m.length - 1))], 1e-6), hi = Math.max(1.6 * m90, 1e-6);
          const ur = Math.max(...us.map(Math.abs), 1e-6), vr = Math.max(...vs.map(Math.abs), 1e-6);
          Object.assign(info, { key, m90, hi, ur, vr });
        };
        v.render(() => {
          const custom = pick.value === 'custom';
          fu.el.hidden = fv.el.hidden = !custom;
          const key = pick.value + (custom ? `|${fu.value}|${fv.value}` : '');
          scan(key);
          const k = 0.17 / info.m90, cap = 0.25;
          S.heat((x, y) => { const f = F(x, y); return Math.hypot(f[0], f[1]); }, { range: [0, info.hi], cmap: 'theme', color: 'accent', res: 3, key: 'm' + key });
          arrowGrid(S, F, W, W, 13, 13, { cap, scale: k, unit: unit.value, color: 'ink', alpha: 0.85 });
          const f0 = F(P.x, P.y), L = Math.hypot(f0[0], f0[1]);
          if (L > 1e-9) {
            const len = Math.min(0.9, k * 2.2 * L);
            S.arrow(P.x, P.y, P.x + (f0[0] / L) * len, P.y + (f0[1] / L) * len, { color: 'gold', width: 3.2, head: 9 });
          }
          Q.heat((x, y) => F(x, y)[0], { range: [-info.ur, info.ur], cmap: 'theme-diverging', res: 3, key: 'u' + key });
          Q.contour((x, y) => F(x, y)[0], Array.from({ length: 9 }, (_, i) => -info.ur + ((i + 1) * 2 * info.ur) / 10), { color: 'ink', alpha: 0.28, width: 1 });
          Q.contour((x, y) => F(x, y)[1], Array.from({ length: 9 }, (_, i) => -info.vr + ((i + 1) * 2 * info.vr) / 10), { color: 'orange', width: 1.6, alpha: 0.9 });
          Q.dot(P.x, P.y, { r: 6, color: 'gold' });
          info.f0 = f0;
        });
        v.legend([['gold', 'the arrow $\\mathbf F(p)$ at the movable point'], ['orange', 'level curves of $v$ (right)'], ['ink', 'level curves of $u$, coloured by $u$ (right)']]);
        v.readout(() => {
          const f = info.f0 || [0, 0], L = Math.hypot(f[0], f[1]);
          const nm = pick.value === 'custom' ? 'your field' : `$\\mathbf F=${FIELDS[pick.value].tex}$`;
          return `${nm}.\n$p=(${tf(P.x, 2)},\\,${tf(P.y, 2)})$,  $\\mathbf F(p)=(${tf(f[0], 3)},\\,${tf(f[1], 3)})$,  $|\\mathbf F(p)|=${tf(L, 3)}$,  direction $${tf(Math.atan2(f[1], f[0]) / DEG, 1)}^\\circ$ from the $x$-axis.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Flow lines of a vector field',
      statement: String.raw`A **flow line** (integral curve, streamline) of a vector field $\mathbf F$ on $U\subseteq\R^n$ is a differentiable curve $\mathbf c:I\to U$ whose velocity is the field at every point it visits:
$$\mathbf c'(t)=\mathbf F(\mathbf c(t))\qquad(t\in I).$$
So $\mathbf c$ is tangent to the arrow of $\mathbf F$ at each of its points. If $\mathbf F$ is $C^1$ (more generally, Lipschitz), then through each $p\in U$ there passes exactly one maximal flow line with $\mathbf c(0)=p$, and two flow lines either coincide as sets or never meet; at a zero of $\mathbf F$ the flow line is a constant curve.`,
      idea: String.raw`Finding a flow line is solving a system of ordinary differential equations: from $p$ step in direction $\mathbf F(p)$ for a short time, re-read the field, repeat — the Runge–Kutta step used here does this with four field readings per step. Uniqueness is the Picard–Lindelöf theorem for $C^1$ right-hand sides, and is why flow lines never cross; the pictures of dye in a stream are exactly such families of curves.`,
      caption: String.raw`Click the map to drop a dye particle (shift-click removes the nearest one). Each particle is carried along its flow line by a Runge–Kutta integration; the faint curve is the whole flow line through its start point, forwards and backwards in time. Underneath, the thin arrows show the field's direction. Switch the field to see closed orbits (rotation, eddies), flows into a saddle and out of a source.`,
      scope: String.raw`Existence and uniqueness of flow lines are guaranteed for $C^1$ (or locally Lipschitz) fields; the picture integrates numerically with a fixed step and only follows a curve while it stays in $|x|,|y|\le 3$ (flow lines of a source run off to infinity). The point vortex is singular at the origin, where no flow line is defined.`,
      deps: ['vcalc-3.1'],
      refs: ['Marsden–Tromba §4.3'],
      tags: ['flow lines', 'ODE', 'streamlines'],
      viz(v) {
        const KEYS = ['eddies', 'rot', 'saddle', 'source', 'vortex', 'waves', 'mix', 'grad', 'shear'];
        const pick = v.select('field', fieldOptions(KEYS), 'eddies');
        const rev = v.toggle('run time backwards', false);
        const S = v.stage({ x: W, y: W, equal: true, axes: 'box', gutter: true, height: 460, weight: 1, xlabel: 'x', ylabel: 'y', title: 'click to drop dye' });
        const start = [[-1.05, 0.85], [-1.05, 0.3], [-1.0, -0.4], [0.35, 1.0], [0.2, -0.3], [0.9, -0.9], [-0.3, 0.1]];
        let seeds = start.map((p) => p.slice()), built = '', paths = [], stats = { err: 0, n: 0 };
        v.button('reset dye', () => { seeds = start.map((p) => p.slice()); });
        v.button('a line of dye', () => { seeds = Array.from({ length: 11 }, (_, i) => [-1.2, -1 + 0.2 * i]); });
        v.button('clear', () => { seeds = []; });
        S.onClick((x, y, mod) => {
          if (mod.shift) { let b = -1, d = 0.12; seeds.forEach((s, i) => { const e = Math.hypot(s[0] - x, s[1] - y); if (e < d) { d = e; b = i; } }); if (b >= 0) seeds.splice(b, 1); }
          else if (seeds.length < 40) seeds.push([x, y]);
          v.invalidate();
        });
        const DT = 0.02, STEPS = 400;
        const build = () => {
          const F = FIELDS[pick.value].F, sgnT = rev.value ? -1 : 1;
          paths = seeds.map((s) => {
            const run = flowLine(F, s, sgnT * DT, STEPS, 3);
            const fw = flowLine(F, s, sgnT * 0.03, 300, 3), bw = flowLine(F, s, -sgnT * 0.03, 300, 3);
            return { run, line: [...bw.slice(1).reverse(), ...fw] };
          });
          let worst = 0, n = 0;
          for (const { run } of paths) for (let i = 1; i < run.length - 1; i++) {
            const c = [run[i + 1][0] - run[i - 1][0], run[i + 1][1] - run[i - 1][1]], f = F(run[i][0], run[i][1]);
            const fl = Math.hypot(f[0], f[1]), cl = Math.hypot(c[0], c[1]);
            if (fl < 1e-6 || cl < 1e-9) continue;
            worst = Math.max(worst, Math.atan2(Math.abs(c[0] * f[1] - c[1] * f[0]), c[0] * f[0] + c[1] * f[1]));
            n++;
          }
          stats = { err: worst / DEG, n: paths.length };
        };
        let tNow = 0, vNow = 0;
        v.animate((t) => {
          const key = `${pick.value}|${rev.value}|${JSON.stringify(seeds)}`;
          if (key !== built) { built = key; build(); }
          const F = FIELDS[pick.value].F;
          arrowGrid(S, F, W, W, 13, 13, { unit: true, cap: 0.13, color: 'muted', alpha: 0.4, center: true, head: 4 });
          const idx = Math.floor((t % 8) / DT);
          for (const { run, line } of paths) {
            S.path(line, { color: 'accent', width: 1.4, alpha: 0.4 });
            const i = Math.min(idx, run.length - 1);
            S.dot(run[0][0], run[0][1], { r: 3.5, hollow: true, color: 'orange' });
            S.path(run.slice(Math.max(0, i - 30), i + 1), { color: 'gold', width: 2.6 });
            S.dot(run[i][0], run[i][1], { r: 5, color: 'gold' });
          }
          tNow = t % 8; vNow = paths.length ? (() => { const r = paths[0].run, i = Math.min(idx, r.length - 1), f = F(r[i][0], r[i][1]); return Math.hypot(f[0], f[1]); })() : 0;
        }, { period: 8, still: 3.4 });
        v.legend([['accent', 'flow line through the dye\'s starting point'], ['gold', 'dye particle with its recent track'], ['orange', 'where the dye was released', { dot: true }]]);
        v.readout(() => `$\\mathbf F=${FIELDS[pick.value].tex}$,  ${stats.n} dye particle${stats.n === 1 ? '' : 's'},  time $t=${tf(tNow, 1)}$ ${rev.value ? '(running backwards)' : ''}.\nLargest angle, over all computed points, between the particle's direction of motion and the arrow of the field there: $${tf(stats.err, 4)}^\\circ$ — the flow lines are tangent to the field.${paths.length ? `\nThe first particle is moving at speed $|\\mathbf F|=${tf(vNow, 3)}$.` : ''}`);
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Gradient fields',
      statement: String.raw`For a differentiable scalar field $\varphi:U\to\R$ the **gradient** $\nabla\varphi=(\partial_1\varphi,\dots,\partial_n\varphi)$ is a vector field on $U$. A vector field $\mathbf F$ is a **gradient field** (or *conservative*) if $\mathbf F=\nabla\varphi$ for some $C^1$ function $\varphi$, called a **potential** of $\mathbf F$ (potentials differ by constants on a connected domain). By 2.7–2.8 the arrows of a gradient field point in the direction of steepest increase of $\varphi$ and are perpendicular to its level sets, with length $|\nabla\varphi|$ the steepness.`,
      idea: String.raw`A potential packs a vector field, which has $n$ numbers at each point, into a single scalar function; contour lines of $\varphi$ then show where the arrows are long (contours crowded) and which way they point (across the contours, uphill). Because of this a gradient field cannot circulate: going once around a closed loop you return to the same height, so the work $\oint\nabla\varphi\cdot d\mathbf r$ is $0$. The next items quantify this with the curl, and show that rotating a gradient field by $90^\circ$ destroys the property.`,
      caption: String.raw`Click the map to add a hill (shift-click adds a well); the field is the gradient of the sum of the bumps, drawn over its contours and always crossing them at right angles. Drag the gold point and the orange circle around it: the readout adds up $\mathbf F\cdot d\mathbf r$ around the circle. For $\nabla\varphi$ it vanishes to rounding error; tick the toggle to rotate every arrow by $90^\circ$ and it no longer does.`,
      deps: ['vcalc-3.1', 'vcalc-2.7'],
      refs: ['Marsden–Tromba §4.3'],
      tags: ['gradient', 'potential', 'conservative'],
      viz(v) {
        const base = () => [{ a: 0.9, x: 0.45, y: 0.3, w: 0.35 }, { a: 0.65, x: -0.6, y: -0.4, w: 0.3 }, { a: -0.4, x: -0.2, y: 0.75, w: 0.25 }];
        let B = base();
        const tool = v.slider('width of a new bump', 0.08, 0.6, 0.3, { step: 0.01 });
        const amp = v.slider('height of a new bump', 0.2, 1.2, 0.7, { step: 0.01 });
        const rho = v.slider('circle radius', 0.05, 0.6, 0.25, { step: 0.01 });
        const rot = v.toggle('rotate every arrow by 90° (not a gradient any more)', false);
        v.button('reset', () => { B = base(); });
        v.button('clear', () => { B = []; });
        const S = v.stage({ x: W, y: W, equal: true, axes: 'box', gutter: true, height: 460, weight: 1, xlabel: 'x', ylabel: 'y', title: 'click: hill, shift-click: well' });
        S.onClick((x, y, mod) => { if (B.length < 12) B.push({ a: (mod.shift ? -1 : 1) * amp.value, x, y, w: tool.value }); v.invalidate(); });
        const P = S.handle(-0.2, 0.15, { color: 'gold', label: 'p', constrain: { x: [-1.2, 1.2], y: [-1.2, 1.2] } });
        let st = {};
        v.render(() => {
          const { f, g } = bumpSum(B), F = rot.value ? (x, y) => { const q = g(x, y); return [-q[1], q[0]]; } : g;
          S.heat(f, { range: [-1.2, 1.2], cmap: 'theme-diverging', res: 3, key: JSON.stringify(B) });
          S.contour(f, Array.from({ length: 23 }, (_, i) => -1.1 + 0.1 * i), { color: 'ink', alpha: 0.35, width: 1 });
          arrowGrid(S, F, W, W, 13, 13, { cap: 0.17, scale: 0.12, color: rot.value ? 'red' : 'accent', alpha: 0.9 });
          const r = rho.value, n = 120;
          let circ = 0;
          for (let i = 0; i < n; i++) {
            const th = (TAU * i) / n, q = F(P.x + r * Math.cos(th), P.y + r * Math.sin(th));
            circ += (q[0] * -Math.sin(th) + q[1] * Math.cos(th)) * r * (TAU / n);
          }
          S.circle(P.x, P.y, r, { color: 'orange', width: 2.4 });
          const q0 = F(P.x, P.y), L = Math.hypot(q0[0], q0[1]);
          if (L > 1e-9) S.arrow(P.x, P.y, P.x + (q0[0] / L) * Math.min(0.3, 0.3 * L), P.y + (q0[1] / L) * Math.min(0.3, 0.3 * L), { color: 'gold', width: 3, head: 8 });
          const gg = g(P.x, P.y);
          st = { circ, L: Math.hypot(gg[0], gg[1]), val: f(P.x, P.y), n: B.length };
        });
        v.legend([['accent', 'arrows of $\\nabla\\varphi$'], ['red', 'arrows rotated by $90^\\circ$ (when ticked)'], ['orange', 'closed loop for the circulation']]);
        v.readout(() => `${st.n} bump${st.n === 1 ? '' : 's'} in $\\varphi$.  At $p$: $\\varphi(p)=${tf(st.val, 3)}$, $|\\nabla\\varphi(p)|=${tf(st.L, 3)}$.\nAround the orange circle: $\\oint \\mathbf F\\cdot d\\mathbf r=${Math.abs(st.circ) < 5e-12 ? '0\\ (<10^{-11})' : tf(st.circ, 4)}$${rot.value ? ' — nonzero: the rotated field is not the gradient of anything' : ' — a gradient field does not circulate'}.`);
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Definition',
      name: 'Divergence',
      statement: String.raw`The **divergence** of a differentiable vector field $\mathbf F=(F_1,\dots,F_n)$ on $U\subseteq\R^n$ is the scalar field
$$\operatorname{div}\mathbf F=\nabla\!\cdot\!\mathbf F=\frac{\partial F_1}{\partial x_1}+\cdots+\frac{\partial F_n}{\partial x_n}.$$
In the plane $\operatorname{div}(u,v)=u_x+v_y$. It is positive where the field spreads out (a source), negative where it gathers (a sink); a field with $\operatorname{div}\mathbf F=0$ is called *solenoidal* or incompressible.`,
      idea: String.raw`The formula is a trace: it adds the stretching rates of the field along the coordinate axes (the diagonal of the derivative matrix $D\mathbf F$ of pma-9.11 and pma-9.17). Its meaning is that of 3.6: if each point of a small blob of dye moves with the velocity $\mathbf F$, the blob's area (volume) changes at the rate $\operatorname{div}\mathbf F$ per unit area. A shear or a rotation moves points a lot without changing areas, which is why a rotation has divergence zero.`,
      caption: String.raw`The map is coloured by $\operatorname{div}\mathbf F$ (red positive, blue negative). A circular cloud of dye is released at the gold handle (drag it to move the release point; the field is scaled by $\tfrac12$ so the cloud stays in view) and carried by the flow. On the right, the rate $dA/dt$ at which its area changes, measured from the actual polygon, is plotted against the integral of the divergence over the cloud: the curves lie on top of each other.`,
      deps: ['vcalc-3.1', 'pma-10.42'],
      refs: ['Marsden–Tromba §4.4', 'Schey ch. II'],
      tags: ['divergence', 'area change'],
      viz(v) {
        const KEYS = ['source', 'sink', 'rot', 'saddle', 'shear', 'waves', 'mix'];
        const GAIN = 0.5, T = 3;
        let sim = null;
        const pick = v.select('field', fieldOptions(KEYS), 'source', { onChange: () => sim && sim.reset() });
        const S = v.stage({ x: W, y: W, equal: true, axes: 'box', gutter: true, height: 420, weight: 1.15, xlabel: 'x', ylabel: 'y', title: 'cloud of dye in the flow' });
        const R = v.stage({ x: [0, T], y: [-1, 3], axes: 'box', gutter: true, height: 420, weight: 1, xlabel: 't', title: 'rate of area change' });
        const H = S.handle(-0.1, 0, { color: 'gold', label: 'release', constrain: { x: [-1.1, 1.1], y: [-1.1, 1.1] } });
        H.onDrag = () => sim && sim.reset();
        const G = (x, y) => { const f = FIELDS[pick.value].F(x, y); return [GAIN * f[0], GAIN * f[1]]; };
        const N = 120, R0 = 0.25;
        const area = (P) => Math.abs(shoelace(P));
        const record = (P, t) => {
          const A = area(P), d = 0.01;
          const Pf = P.map((p) => rk4(G, p, d)), Pb = P.map((p) => rk4(G, p, -d));
          const dA = (shoelace(Pf) - shoelace(Pb)) / (2 * d) * Math.sign(shoelace(P) || 1);
          let xs = [1e9, -1e9], ys = [1e9, -1e9];
          for (const p of P) { xs = [Math.min(xs[0], p[0]), Math.max(xs[1], p[0])]; ys = [Math.min(ys[0], p[1]), Math.max(ys[1], p[1])]; }
          const n = 44, hx = (xs[1] - xs[0]) / n, hy = (ys[1] - ys[0]) / n;
          let I = 0;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const x = xs[0] + (i + 0.5) * hx, y = ys[0] + (j + 0.5) * hy;
            if (v.M.pointInPoly([x, y], P)) I += div2(G, x, y, 0.01) * hx * hy;
          }
          return { t, A, dA, I };
        };
        sim = v.sim(
          () => ({ P: Array.from({ length: N }, (_, i) => [H.x + R0 * Math.cos((TAU * i) / N), H.y + R0 * Math.sin((TAU * i) / N)]), k: 0, hist: [], A0: Math.PI * R0 * R0 }),
          (s, dt, t) => {
            if (s.k % 4 === 0) s.hist.push(record(s.P, t));
            s.P = s.P.map((p) => rk4(G, p, dt)); s.k++;
          },
          { dt: 1 / 120 },
        );
        let cur = null;
        v.animate((t) => {
          const s = sim.advance(Math.min(t, T - 1e-3));
          const last = s.hist[s.hist.length - 1] || record(s.P, t);
          cur = { ...record(s.P, t), A0: s.A0 };
          S.heat((x, y) => div2(G, x, y, 0.01), { range: [-2, 2], cmap: 'theme-diverging', res: 3, key: 'd' + pick.value });
          arrowGrid(S, G, W, W, 11, 11, { cap: 0.16, scale: 0.12, color: 'ink', alpha: 0.45, head: 4 });
          S.circle(H.x, H.y, R0, { color: 'muted', width: 1.2, alpha: 0.9 });
          S.poly(s.P, { fill: 'accent', fillAlpha: 0.28, color: 'accent', width: 2.4 });
          // history plot
          const hs = s.hist.concat([cur]);
          const vals = hs.flatMap((h) => [h.dA, h.I]);
          const lo = Math.min(-0.2, ...vals), hi = Math.max(0.2, ...vals), pad = 0.15 * (hi - lo);
          R.setView([0, T], [lo - pad, hi + pad]);
          R.hline(0, { color: 'muted', alpha: 0.5, width: 1 });
          R.path(hs.map((h) => [h.t, h.I]), { color: 'accent', width: 4, alpha: 0.5 });
          R.path(hs.map((h) => [h.t, h.dA]), { color: 'orange', width: 1.8 });
          R.dot(cur.t, cur.dA, { r: 5, color: 'orange' });
        }, { period: T, still: 2.2 });
        v.legend([['accent', 'cloud boundary and $\\iint\\operatorname{div}\\mathbf F\\,dA$ over it'], ['orange', '$dA/dt$ measured from the polygon']]);
        v.readout(() => cur ? `${FIELDS[pick.value].label}: $\\mathbf F=\\tfrac12${FIELDS[pick.value].tex}$.  At the release point $\\operatorname{div}\\mathbf F=${tf(div2(G, H.x, H.y), 3)}$.\nCloud at $t=${tf(cur.t, 2)}$: area $A=${tf(cur.A, 4)}$ (started at $${tf(cur.A0, 4)}$); $dA/dt=${tf(cur.dA, 4)}$ and $\\iint_{\\text{cloud}}\\operatorname{div}\\mathbf F\\,dA=${tf(cur.I, 4)}$ — they agree to the accuracy of the grid sum.` : '');
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Definition',
      name: 'Curl',
      statement: String.raw`The **curl** of a differentiable vector field $\mathbf F=(F_1,F_2,F_3)$ on $U\subseteq\R^3$ is the vector field
$$\operatorname{curl}\mathbf F=\nabla\times\mathbf F=\Bigl(\frac{\partial F_3}{\partial y}-\frac{\partial F_2}{\partial z},\ \frac{\partial F_1}{\partial z}-\frac{\partial F_3}{\partial x},\ \frac{\partial F_2}{\partial x}-\frac{\partial F_1}{\partial y}\Bigr)=\det\begin{pmatrix}\mathbf i&\mathbf j&\mathbf k\\ \partial_x&\partial_y&\partial_z\\ F_1&F_2&F_3\end{pmatrix}.$$
A planar field $(u,v)$ is the case $F_3=0$ with nothing depending on $z$; its curl points along $\mathbf k$ with the scalar value $v_x-u_y$.`,
      idea: String.raw`The curl collects the antisymmetric part of the derivative matrix $D\mathbf F$ (the off-diagonal differences $\partial_iF_j-\partial_jF_i$, the combinations that the divergence ignores). It is twice the local angular velocity of a fluid with velocity $\mathbf F$: the part of the motion that rotates rather than stretches. Item 3.7 shows the same number as circulation per unit area; here a tiny paddle wheel makes it visible.`,
      caption: String.raw`Drag the paddle wheel; it feels the flow at the rim (green and red arrows: the part of the field along the rim) and turns at the average speed of the rim divided by the radius. In a shear flow it spins although every streamline is straight; in a rotation it spins at the angular velocity; in the point vortex it does not spin away from the origin although the fluid circles around it. The map shows $\operatorname{curl}\mathbf F=v_x-u_y$.`,
      scope: String.raw`The wheel's rate equals $\tfrac12\operatorname{curl}$ in the limit of a small wheel; a large wheel averages the field over its disc. The point vortex has curl $0$ away from the origin but a concentrated circulation at the origin, which a wheel enclosing it detects.`,
      deps: ['vcalc-3.1', 'pma-10.42'],
      refs: ['Marsden–Tromba §4.4', 'Schey ch. III'],
      tags: ['curl', 'rotation', 'paddle wheel'],
      viz(v) {
        const KEYS = ['shear', 'rot', 'vortex', 'saddle', 'eddies', 'mix'];
        const pick = v.select('field', fieldOptions(KEYS), 'shear');
        const rad = v.slider('wheel radius', 0.03, 0.45, 0.18, { step: 0.01 });
        const speed = v.slider('time-lapse', 1, 6, 3, { step: 0.5 });
        const S = v.stage({ x: W, y: W, equal: true, axes: 'box', gutter: true, height: 460, weight: 1, xlabel: 'x', ylabel: 'y', title: 'drag the paddle wheel' });
        const P = S.handle(-0.3, 0.35, { color: 'gold', label: '', constrain: { x: [-1.15, 1.15], y: [-1.15, 1.15] } });
        let ang = 0, last = 0, st = {};
        v.animate((t) => {
          const dt = t >= last && t - last < 0.2 ? t - last : 0; last = t;
          const F = FIELDS[pick.value].F, r = rad.value;
          S.heat((x, y) => curl2(F, x, y, 0.01), { range: [-2, 2], cmap: 'theme-diverging', res: 3, key: 'c' + pick.value });
          arrowGrid(S, F, W, W, 13, 13, { cap: 0.17, scale: 0.12, color: 'ink', alpha: 0.55, head: 4 });
          // rim average of F·t / r
          const n = 72;
          let tot = 0;
          const rim = [];
          for (let i = 0; i < n; i++) {
            const th = (TAU * i) / n, q = F(P.x + r * Math.cos(th), P.y + r * Math.sin(th)), ft = -q[0] * Math.sin(th) + q[1] * Math.cos(th);
            tot += ft; if (i % 6 === 0) rim.push([th, ft]);
          }
          const omega = tot / n / r, curl = curl2(F, P.x, P.y, 0.01);
          ang += omega * speed.value * dt;
          const mx = Math.max(1e-9, ...rim.map((q) => Math.abs(q[1])));
          S.circle(P.x, P.y, r, { color: 'ink', width: 2.2, fill: 'panel', fillAlpha: 0.5 });
          for (const [th, ft] of rim) {
            const px = P.x + r * Math.cos(th), py = P.y + r * Math.sin(th), len = (0.9 * r * Math.abs(ft)) / mx, s = Math.sign(ft);
            if (Math.abs(ft) > 1e-6) S.arrow(px, py, px - s * len * Math.sin(th), py + s * len * Math.cos(th), { color: ft > 0 ? 'green' : 'red', width: 2, head: 5 });
          }
          for (let k = 0; k < 4; k++) {
            const a = ang + (k * Math.PI) / 2;
            S.line(P.x - r * 0.92 * Math.cos(a), P.y - r * 0.92 * Math.sin(a), P.x + r * 0.92 * Math.cos(a), P.y + r * 0.92 * Math.sin(a), { color: 'orange', width: 3.4 });
          }
          S.dot(P.x, P.y, { r: 3, color: 'ink' });
          const q = FIELDS[pick.value].F(P.x, P.y);
          st = { omega, curl, enclosed: pick.value === 'vortex' && Math.hypot(P.x, P.y) < r, speed: Math.hypot(q[0], q[1]) };
        }, { period: 20, still: 1 });
        v.legend([['green', 'field along the rim, counter-clockwise'], ['red', 'field along the rim, clockwise'], ['orange', 'blades of the wheel']]);
        v.readout(() => `$\\mathbf F=${FIELDS[pick.value].tex}$.  The wheel turns at $\\omega=${tf(st.omega, 3)}$ rad per unit time (${Math.abs(st.omega) < 5e-4 ? 'not turning' : st.omega > 0 ? 'counter-clockwise' : 'clockwise'}; animation ${tf(speed.value, 1)}× faster).\nCurl at the centre: $\\tfrac12\\operatorname{curl}\\mathbf F=\\tfrac12(v_x-u_y)=${tf(st.curl / 2, 3)}$.${st.enclosed ? ' The wheel encloses the singular point, so it feels the whole circulation $2\\pi$ of the vortex: $\\omega=1/r^2$.' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Divergence as flux density',
      statement: String.raw`Let $\mathbf F$ be a $C^1$ vector field on an open set of $\R^n$ and $p$ a point. For the cube $Q_h(p)$ of side $2h$ centred at $p$, with outward unit normal $\mathbf n$ on its boundary,
$$\operatorname{div}\mathbf F(p)=\lim_{h\to0}\frac{1}{|Q_h|}\int_{\partial Q_h}\mathbf F\cdot\mathbf n\,dS,\qquad |Q_h|=(2h)^n.$$
(In the plane the boundary integral is over the four sides of a square, $|Q_h|=4h^2$.) The same limit holds for balls or any family of shrinking regions of controlled shape. Thus the divergence is the **net outflow per unit volume**, a coordinate-free quantity.`,
      idea: String.raw`On the right and left faces of the square, $u$ is evaluated at $x\pm h$; their contribution is $\int_{-h}^{h}\bigl(u(x+h,y+s)-u(x-h,y+s)\bigr)ds\approx 2h\cdot 2h\,u_x$ by the mean value theorem (pma-5.10) and continuity of $u_x$. The top and bottom give $4h^2v_y$ in the same way. Dividing by $4h^2$ leaves $u_x+v_y$ with an error that tends to $0$ with $h$ because the partials are continuous.`,
      caption: String.raw`Drag the gold point and shrink the box $h$ (log scale). The left panel is the box at its true place; the right panel magnifies it to constant size and shows the normal component $\mathbf F\cdot\mathbf n$ on each side (red out, blue in). The curve below plots flux/area against $h$: the raw flux tends to $0$, but the ratio settles on $\operatorname{div}\mathbf F(p)$ (dashed line), computed independently from the partial derivatives.`,
      deps: ['vcalc-3.4', 'pma-5.10'],
      refs: ['Schey ch. II'],
      tags: ['divergence', 'flux', 'limit'],
      viz(v) {
        const KEYS = ['waves', 'mix', 'source', 'sink', 'rot', 'eddies', 'saddle'];
        const pick = v.select('field', fieldOptions(KEYS), 'mix');
        const hh = v.slider('half-width $h$', 0.004, 0.6, 0.4, { log: true, sig: 2 });
        const S = v.stage({ x: W, y: W, equal: true, axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'x', ylabel: 'y', title: 'the box at its place' });
        const Z = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 380, weight: 1, title: 'the box magnified: $\\mathbf F\\cdot\\mathbf n$ on each side' });
        const C = v.stage({ x: [0.004, 0.6], y: [-1, 1], xlog: true, axes: 'box', gutter: true, height: 300, full: true, xlabel: 'half-width h', title: 'flux / area against $h$' });
        const P = S.handle(0.15, 0.1, { color: 'gold', label: 'p', constrain: { x: [-1, 1], y: [-1, 1] } });
        const fluxOf = (F, px, py, h) => {
          let tot = 0;
          for (let i = 0; i < 8; i++) {
            const s = h * GL8.x[i], w = h * GL8.w[i];
            tot += w * (F(px + h, py + s)[0] - F(px - h, py + s)[0] + F(px + s, py + h)[1] - F(px + s, py - h)[1]);
          }
          return tot;
        };
        let st = {};
        v.render(() => {
          const F = FIELDS[pick.value].F, h = hh.value;
          arrowGrid(S, F, W, W, 13, 13, { cap: 0.17, scale: 0.12, color: 'ink', alpha: 0.4, head: 4 });
          S.rect(P.x - h, P.y - h, P.x + h, P.y + h, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2.2 });
          const flux = fluxOf(F, P.x, P.y, h), A = 4 * h * h, dv = div2(F, P.x, P.y, 0.01);
          // magnified box: normal components at five points of each side
          Z.rect(-1, -1, 1, 1, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 2.6 });
          const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]], pts = [];
          let mx = 1e-9;
          for (const [nx, ny] of sides) for (let k = 0; k < 5; k++) {
            const s = -0.8 + 0.4 * k, qx = nx ? nx : s, qy = ny ? ny : s, f = F(P.x + h * qx, P.y + h * qy), fn = f[0] * nx + f[1] * ny;
            pts.push([qx, qy, nx, ny, fn]); mx = Math.max(mx, Math.abs(fn));
          }
          for (const [qx, qy, nx, ny, fn] of pts) {
            const len = (0.85 * fn) / mx;
            Z.arrow(qx, qy, qx + nx * len, qy + ny * len, { color: fn > 0 ? 'red' : 'blue', width: 2.2, head: 6 });
          }
          Z.tex(String.raw`\text{net out: }\ ${tf(flux, 5)}`, 0, 0.12, { size: 14 });
          Z.tex(String.raw`\text{area } 4h^2=${tf(A, 5)}`, 0, -0.14, { size: 14 });
          // ratio curve
          const hs = Array.from({ length: 70 }, (_, i) => 0.004 * Math.pow(150, i / 69));
          const ys = hs.map((q) => fluxOf(F, P.x, P.y, q) / (4 * q * q));
          const lo = Math.min(dv, ...ys), hi = Math.max(dv, ...ys), pad = Math.max(0.3, 0.2 * (hi - lo));
          C.setView([0.004, 0.6], [lo - pad, hi + pad]);
          C.hline(dv, { color: 'green', dash: true, width: 2 });
          C.path(hs.map((q, i) => [q, ys[i]]), { color: 'accent', width: 2.4 });
          C.dot(h, flux / A, { r: 6, color: 'gold' });
          st = { flux, A, ratio: flux / A, dv };
        });
        v.legend([['red', 'flux out of the box'], ['blue', 'flux into the box'], ['green', '$\\operatorname{div}\\mathbf F(p)$ from the partials', { dash: true }], ['accent', 'flux / area']]);
        v.readout(() => `$\\mathbf F=${FIELDS[pick.value].tex}$, $h=${v.sci(hh.value, 2)}$:  net flux $\\oint\\mathbf F\\cdot\\mathbf n\\,ds=${v.sci(st.flux, 3)}$, area $4h^2=${v.sci(st.A, 3)}$, ratio $=${tf(st.ratio, 6)}$.\n$\\operatorname{div}\\mathbf F(p)=u_x+v_y=${tf(st.dv, 6)}$; difference $${v.sci(Math.abs(st.ratio - st.dv), 2)}$ (flux integrated by 8-point Gauss–Legendre on each side).`);
      },
    },
  ],
};
