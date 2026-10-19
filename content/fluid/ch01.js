// Fluid Dynamics — Chapter 1: Kinematics and conservation of mass

// ---------- shared helpers ----------
const TAU = 2 * Math.PI;

/** One RK4 step of (x, y)' = f(t, x, y). */
function rk4(f, t, x, y, h) {
  const [a1, b1] = f(t, x, y);
  const [a2, b2] = f(t + h / 2, x + (h / 2) * a1, y + (h / 2) * b1);
  const [a3, b3] = f(t + h / 2, x + (h / 2) * a2, y + (h / 2) * b2);
  const [a4, b4] = f(t + h, x + h * a3, y + h * b3);
  return [x + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4), y + (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4)];
}
/** Gauss–Legendre nodes and weights on [a, b]. */
function gauss(n, a = -1, b = 1) {
  const xs = [], ws = [];
  for (let i = 0; i < n; i++) {
    let z = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5)), pp = 1;
    for (let it = 0; it < 100; it++) {
      let p1 = 1, p2 = 0;
      for (let j = 0; j < n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j + 1) * z * p2 - j * p3) / (j + 1); }
      pp = (n * (z * p1 - p2)) / (z * z - 1);
      const dz = p1 / pp; z -= dz;
      if (Math.abs(dz) < 1e-15) break;
    }
    xs.push(((b - a) / 2) * z + (a + b) / 2); ws.push(((b - a) / (1 - z * z) / (pp * pp)));
  }
  return { xs, ws };
}
/** Distance from (px, py) to a polyline (array of [x, y], nulls ignored). */
function distToPoly(px, py, pts) {
  let best = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) {
    const p = pts[i], q = pts[i + 1];
    if (!p || !q) continue;
    const dx = q[0] - p[0], dy = q[1] - p[1], L2 = dx * dx + dy * dy;
    const t = L2 > 0 ? Math.max(0, Math.min(1, ((px - p[0]) * dx + (py - p[1]) * dy) / L2)) : 0;
    best = Math.min(best, Math.hypot(px - p[0] - t * dx, py - p[1] - t * dy));
  }
  return best;
}
/** Shoelace area of a closed polygon given as flat arrays. */
function shoelace(X, Y, n) {
  let a = 0;
  for (let i = 0; i < n; i++) { const j = i + 1 === n ? 0 : i + 1; a += X[i] * Y[j] - X[j] * Y[i]; }
  return a / 2;
}

export default {
  collection: 'fluid',
  chapter: 1,
  title: 'Kinematics and conservation of mass',
  summary: String.raw`A fluid is treated as a continuum whose velocity field can be followed either at fixed points (Eulerian) or along particles (Lagrangian), and the material derivative converts between the two views. Conservation of mass becomes the continuity equation; for incompressible flow it says the velocity field is divergence-free and, in two dimensions, can be derived from a stream function. Local rotation is measured by vorticity, the velocity gradient splits into strain and spin, and the circulation round a loop equals the flux of vorticity through it.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'Continuum hypothesis',
      statement: String.raw`Fluid mechanics treats a fluid as a continuous medium: at every point there are well-defined density, velocity and pressure, obtained by averaging over a small volume that is **large** compared with the spacing and mean free path $\lambda$ of the molecules, yet **small** compared with the length $\ell_{\rm macro}$ over which the averaged quantities change. The hypothesis is sound when such a window exists, i.e. when the Knudsen number $\mathrm{Kn}=\lambda/\ell_{\rm macro}$ is small (roughly $\mathrm{Kn}<0.01$ for ordinary continuum equations).`,
      idea: String.raw`A window containing $n$ molecules estimates the density with a relative statistical error of about $1/\sqrt n$, so it must be big enough that $n\gg1$; a window much larger than the scale of variation instead blurs the field itself. If the two requirements can be met at once there is a plateau of window sizes in which the density reads the same, and "density at a point" means that plateau value. Rarefied gases and nanoscale channels are exactly the cases where there is no plateau.`,
      caption: String.raw`The gas has a smooth large-scale density profile. Drag the sampling window and change its size $\ell$: the measured density (blue, lower panel) is spiky at molecular scales, settles on a plateau that tracks the true local density (green), then drifts away as the window starts to average the profile (orange). Lower the number of molecules and the plateau shrinks and disappears.`,
      deps: [],
      refs: ['Kundu §1.4', 'Acheson ch. 1'],
      tags: ['continuum', 'Knudsen number'],
      viz(v) {
        const NMAX = 50000, D = 0.0035, AMP = 0.4;
        const prof = (x) => 1 + AMP * Math.cos(TAU * x);
        const r = v.rng(11);
        const X = new Float64Array(NMAX), Y = new Float64Array(NMAX);
        for (let i = 0; i < NMAX;) { const x = r(), y = r(); if (r() * (1 + AMP) <= prof(x)) { X[i] = x; Y[i] = y; i++; } }
        const Nsl = v.slider('molecules $N$', 500, NMAX, 40000, { log: true, int: true, sig: 2 });
        const Lsl = v.slider('window size $\\ell$', 0.003, 1, 0.15, { log: true });
        const box = v.stage({ x: [-0.04, 1.04], y: [-0.04, 1.04], equal: true, axes: false, height: 330, title: 'gas in a box (a thin slice)' });
        const plot = v.stage({ x: [0.003, 1], y: [0, 2.4], xlog: true, axes: 'box', gutter: true, height: 330, xlabel: 'window size ℓ', ylabel: 'density ρ(ℓ) / ρ̄', title: 'density measured in the window' });
        const win = box.handle(0.3, 0.5, { color: 'accent', label: 'window' });
        const LS = [];
        for (let i = 0; i <= 100; i++) LS.push(0.003 * Math.pow(1 / 0.003, i / 100));
        function measure(N, x0, y0, L) {
          const xa = Math.max(0, x0 - L / 2), xb = Math.min(1, x0 + L / 2), ya = Math.max(0, y0 - L / 2), yb = Math.min(1, y0 + L / 2);
          let c = 0;
          for (let i = 0; i < N; i++) { const x = X[i], y = Y[i]; if (x >= xa && x <= xb && y >= ya && y <= yb) c++; }
          const area = (xb - xa) * (yb - ya);
          const mean = 1 + (AMP * (Math.sin(TAU * xb) - Math.sin(TAU * xa))) / (TAU * (xb - xa));
          return { c, rho: c / (N * area), mean };
        }
        let last = {};
        v.render(() => {
          const N = Nsl.value, L = Lsl.value, x0 = win.x, y0 = win.y;
          const ctx = box.ctx, xa = x0 - L / 2, xb = x0 + L / 2, ya = y0 - L / 2, yb = y0 + L / 2;
          ctx.save();
          const sz = N > 20000 ? 1.6 : 2.2;
          ctx.fillStyle = v.color('muted', 0.75);
          for (let i = 0; i < N; i++) { const x = X[i], y = Y[i]; if (!(x >= xa && x <= xb && y >= ya && y <= yb)) ctx.fillRect(box.X(x) - sz / 2, box.Y(y) - sz / 2, sz, sz); }
          ctx.fillStyle = v.color('accent', 1);
          for (let i = 0; i < N; i++) { const x = X[i], y = Y[i]; if (x >= xa && x <= xb && y >= ya && y <= yb) ctx.fillRect(box.X(x) - sz, box.Y(y) - sz, 2 * sz, 2 * sz); }
          ctx.restore();
          box.rect(0, 0, 1, 1, { color: 'ink', width: 1.4 });
          box.rect(xa, ya, xb, yb, { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.08 });
          const lam = 1 / (Math.SQRT2 * N * D);
          const m = measure(N, x0, y0, L);
          const pts = [], mean = [];
          for (const l of LS) { const q = measure(N, x0, y0, l); pts.push([l, Math.min(q.rho, 5)]); mean.push([l, q.mean]); }
          plot.hline(prof(x0), { color: 'green', dash: true, width: 1.6 });
          plot.path(mean, { color: 'orange', width: 2, dash: true });
          plot.path(pts, { color: 'accent', width: 1.6 });
          plot.vline(lam, { color: 'purple', dash: true, width: 1.4 });
          plot.text('λ', lam * 1.08, 2.25, { size: 12, color: 'purple', align: 'left' });
          plot.vline(L, { color: 'gold', width: 1.8 });
          plot.dot(L, Math.min(m.rho, 2.35), { r: 5, color: 'gold' });
          last = { lam, m, N, L, x0, true: prof(x0) };
        });
        v.legend([['accent', 'measured $\\rho_\\ell/\\bar\\rho$'], ['green', 'true local density', { dash: true }], ['orange', 'true average over the window', { dash: true }], ['purple', 'mean free path $\\lambda$', { dash: true }]]);
        v.readout(() => {
          const { lam, m, N, L, true: tr } = last;
          const noise = 1 / Math.sqrt(Math.max(1, m.c)), bias = Math.abs(m.mean - tr) / tr;
          const ok = lam / L < 0.1 && noise < 0.06 && bias < 0.05;
          return `$N=${N}$, $\\lambda\\approx${v.fix(lam, 4)}$, window $\\ell=${v.fix(L, 3)}$ holds $n=${m.c}$ molecules\n$\\mathrm{Kn}=\\lambda/\\ell=${v.fix(lam / L, 2)}$ · noise $1/\\sqrt n=${v.fix(100 * noise, 1)}\\%$ · blurring of the profile $=${v.fix(100 * bias, 1)}\\%$ · measured $${v.fix(m.rho, 3)}$ vs true $${v.fix(tr, 3)}$ → **${ok ? 'a good continuum window' : 'not a continuum window'}**`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Eulerian and Lagrangian descriptions',
      statement: String.raw`A flow can be described in two ways. In the **Eulerian** description the unknowns are fields at fixed points of space, $\mathbf u(\mathbf x,t)$. In the **Lagrangian** description one follows labelled fluid particles, $\mathbf x=\mathbf X(\mathbf a,t)$ with $\mathbf X(\mathbf a,0)=\mathbf a$, so that $\partial_t\mathbf X=\mathbf u(\mathbf X,t)$. The velocity seen by a particle is the Eulerian velocity evaluated along its path, $\mathbf u(\mathbf X(\mathbf a,t),t)$, which in general is not the Eulerian record at the point where the particle started.`,
      idea: String.raw`The two records coincide only if the particle never meets a different velocity than the fixed sensor does: the flow must be steady (so that time does not change the field) and uniform (so that moving does not either). Otherwise the particle record mixes the time dependence of the field with the spatial variation it sweeps through, and that mixture is what the material derivative (1.3) packages. Given $\mathbf u$ the Lagrangian description follows by solving an ODE; given $\mathbf X$ the Eulerian one follows by differentiating.`,
      caption: String.raw`A travelling wave $u=U+A\sin(kx-\omega t)$ rides on a mean stream. A fixed sensor (blue) and a particle released at the same spot (orange) record the velocity they feel. Drag the release point; set $A=0$ (uniform) or $\omega=0$ with $A=0$ and the traces merge; with $A>0$ even a steady wave ($\omega=0$) makes them differ, because the particle moves.`,
      deps: ['fluid-1.1', 'ode-1.1'],
      refs: ['Kundu §3.2'],
      tags: ['kinematics', 'Euler', 'Lagrange'],
      viz(v) {
        const K = 1.2, T = 12;
        const U = v.slider('mean flow $U$', 0, 2, 1, { step: 0.05 });
        const A = v.slider('wave amplitude $A$', 0, 1.5, 0.8, { step: 0.05 });
        const W = v.slider('frequency $\\omega$ (0 = steady)', 0, 3, 1.5, { step: 0.05 });
        const s = v.stage({ x: [-1, 15], y: [-2.4, 2.4], equal: true, axes: false, height: 230, title: 'flow at time $t$ and the released particle' });
        const ts = v.stage({ x: [0, T], y: [-1, 3.5], axes: 'box', gutter: true, height: 230, xlabel: 't', ylabel: 'u felt', title: 'velocity records' });
        const h = s.handle(2, 0, { color: 'accent', label: 'sensor / release', labelPos: 'n' });
        const flow = (t, x) => [U.value + A.value * Math.sin(K * x - W.value * t), 0.5 * A.value * Math.cos(K * x - W.value * t)];
        let cache = { key: '', path: [] };
        const pathFor = () => {
          const key = [U.value, A.value, W.value, h.x, h.y].join('|');
          if (cache.key === key) return cache.path;
          const out = []; let x = h.x, y = h.y; const dt = 0.02;
          for (let i = 0; i <= T / dt; i++) { out.push([i * dt, x, y]); [x, y] = rk4((t, xx) => flow(t, xx), i * dt, x, y, dt); }
          cache = { key, path: out }; return out;
        };
        let info = {};
        v.animate((t) => {
          h.set(Math.max(0, Math.min(13, h.x)), 0);
          const P = pathFor(), idx = Math.min(P.length - 1, Math.round(t / 0.02));
          for (let x = 0; x <= 14; x += 1) for (const y of [-1.5, 0, 1.5]) {
            const [u, w] = flow(t, x); s.arrow(x, y, x + 0.42 * u, y + 0.42 * w, { color: 'faint', width: 1.4, head: 5 });
          }
          s.path(P.slice(0, idx + 1).map((p) => [p[1], p[2]]), { color: 'orange', width: 2.2 });
          s.dot(h.x, h.y, { r: 9, hollow: true, color: 'blue' });
          s.dot(P[idx][1], P[idx][2], { r: 6, color: 'orange' });
          const Eu = [], Lu = [];
          for (let i = 0; i < P.length; i += 3) { Eu.push([P[i][0], flow(P[i][0], h.x)[0]]); Lu.push([P[i][0], flow(P[i][0], P[i][1])[0]]); }
          const lo = Math.min(...Eu.map((p) => p[1]), ...Lu.map((p) => p[1])), hi = Math.max(...Eu.map((p) => p[1]), ...Lu.map((p) => p[1]));
          ts.setView([0, T], [lo - 0.25, hi + 0.25]);
          ts.path(Eu, { color: 'blue', width: 2 });
          ts.path(Lu, { color: 'orange', width: 2 });
          ts.vline(t, { color: 'gold', width: 1.6 });
          let ss = 0; for (let i = 0; i < Eu.length; i++) ss += (Eu[i][1] - Lu[i][1]) ** 2;
          info = { t, ue: flow(t, h.x)[0], ul: flow(t, P[idx][1])[0], rms: Math.sqrt(ss / Eu.length), travelled: P[idx][1] - h.x };
        }, { period: T, still: 7 });
        v.legend([['blue', 'fixed sensor $\\mathbf u(\\mathbf x_0,t)$'], ['orange', 'particle $\\mathbf u(\\mathbf X(t),t)$'], ['gold', 'now']]);
        v.readout(() => `$t=${v.fix(info.t, 1)}$: sensor $u=${v.fix(info.ue, 2)}$, particle $u=${v.fix(info.ul, 2)}$ (particle has moved $${v.fix(info.travelled, 2)}$) · rms difference of the two records over $[0,${T}]$: $${v.fix(info.rms, 3)}$${info.rms < 1e-9 ? ' — identical: the flow is steady and uniform' : ''}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Material derivative',
      statement: String.raw`For a field $F(\mathbf x,t)$ carried by a flow $\mathbf u$, the **material derivative** is the rate of change seen by a fluid particle,
$$\frac{DF}{Dt}=\frac{\partial F}{\partial t}+\mathbf u\cdot\nabla F .$$
The first term is the local rate of change at a fixed point; the second, advection, is the change due to the particle moving into a region where $F$ differs. Applied to the velocity it gives the acceleration of a fluid particle, $D\mathbf u/Dt=\partial_t\mathbf u+(\mathbf u\cdot\nabla)\mathbf u$.`,
      idea: String.raw`Along the path $\mathbf X(t)$ of a particle, $F(\mathbf X(t),t)$ is a function of one variable and the multivariable chain rule gives $\tfrac d{dt}F=\partial_tF+\dot{\mathbf X}\cdot\nabla F$, with $\dot{\mathbf X}=\mathbf u$ (1.2). Nothing is assumed about the flow beyond its velocity field. A quantity that is merely carried along ($DF/Dt=0$) can still change at every fixed point.`,
      caption: String.raw`A temperature pattern is carried and sheared by the flow, while a uniform source heats the fluid at rate $q$. Drag the thermometer's starting point: the drifting thermometer (orange) reads a constant value when $q=0$ even though the fixed one (blue) sees the pattern go by. The bars show $\partial_tT$ and $\mathbf u\cdot\nabla T$ at the drifting thermometer and their sum $DT/Dt$.`,
      deps: ['fluid-1.2', 'pma-9.15'],
      refs: ['Kundu §3.3', 'Acheson ch. 1'],
      tags: ['material derivative', 'advection'],
      viz(v) {
        const T = 8;
        const U = v.slider('stream $U$', 0, 1.5, 0.8, { step: 0.05 });
        const Sh = v.slider('shear $s$', -1, 1, 0.4, { step: 0.05 });
        const Q = v.slider('heating rate $q$', -1.5, 1.5, 0, { step: 0.05 });
        const s = v.stage({ x: [-3, 8], y: [-2, 2], equal: true, axes: false, height: 250, full: true, title: 'temperature carried by a sheared stream $u=U+sy$' });
        const bars = v.stage({ x: [0.3, 3.7], y: [-12, 12], axes: 'box', gutter: true, height: 230, xticks: [[1, '∂T/∂t'], [2, 'u·∇T'], [3, 'DT/Dt']], title: 'at the drifting thermometer' });
        const ser = v.stage({ x: [0, T], y: [0, 22], axes: 'box', gutter: true, height: 230, xlabel: 't', ylabel: 'T', title: 'readings' });
        const h = s.handle(-0.4, 0.4, { color: 'accent', label: 'thermometer', labelPos: 'n' });
        const T0 = (xi, y) => 10 + 9 * Math.exp(-(xi * xi / 0.5 + ((y - 0.4) ** 2) / 0.6)) - 5 * Math.exp(-(((xi + 2.4) ** 2) / 0.6 + ((y + 0.7) ** 2) / 0.5));
        const Tf = (x, y, t) => T0(x - (U.value + Sh.value * y) * t, y) + Q.value * t;
        const ux = (y) => U.value + Sh.value * y;
        let info = {};
        v.animate((t) => {
          s.heat((x, y) => Tf(x, y, t), { cmap: 'theme-diverging', neg: 'blue', pos: 'red', range: [-2, 22], res: 4 });
          for (let x = -2.5; x <= 7.5; x += 1.25) for (const y of [-1.5, -0.5, 0.5, 1.5]) s.arrow(x, y, x + 0.35 * ux(y), y, { color: 'ink', alpha: 0.45, width: 1.2, head: 4 });
          h.set(Math.max(-2.8, Math.min(2, h.x)), Math.max(-1.8, Math.min(1.8, h.y)));
          const y0 = h.y, vx = ux(y0), xd = h.x + vx * t;
          s.dot(h.x, y0, { r: 8, hollow: true, color: 'blue' });
          s.path([[h.x, y0], [xd, y0]], { color: 'orange', width: 1.6, dash: true });
          s.dot(xd, y0, { r: 7, color: 'orange' });
          const e = 1e-4;
          const Tt = (Tf(xd, y0, t + e) - Tf(xd, y0, t - e)) / (2 * e);
          const Tx = (Tf(xd + e, y0, t) - Tf(xd - e, y0, t)) / (2 * e), Ty = (Tf(xd, y0 + e, t) - Tf(xd, y0 - e, t)) / (2 * e);
          const adv = vx * Tx; void Ty;
          const fd = (Tf(h.x + vx * (t + e), y0, t + e) - Tf(h.x + vx * (t - e), y0, t - e)) / (2 * e);
          bars.hline(0, { color: 'faint' });
          bars.bars([Tt, adv, Tt + adv], { color: (_, i) => ['blue', 'orange', 'green'][i] });
          [Tt, adv, Tt + adv].forEach((val, i) => bars.text(v.fix(val, 2), i + 1, val >= 0 ? val + 1.2 : val - 1.2, { size: 12, color: 'ink', align: 'center' }));
          const Ef = [], Df = [];
          for (let i = 0; i <= 80; i++) { const tt = (T * i) / 80; Ef.push([tt, Tf(h.x, y0, tt)]); Df.push([tt, Tf(h.x + vx * tt, y0, tt)]); }
          ser.path(Ef, { color: 'blue', width: 2 }); ser.path(Df, { color: 'orange', width: 2 });
          ser.vline(t, { color: 'gold', width: 1.6 });
          info = { t, Tt, adv, D: Tt + adv, fd, fixed: Tf(h.x, y0, t), drift: Tf(xd, y0, t) };
        }, { period: T, still: 3 });
        v.legend([['blue', 'fixed thermometer'], ['orange', 'drifting thermometer (moves with the fluid)']]);
        v.readout(() => `$t=${v.fix(info.t, 1)}$: fixed reads $${v.fix(info.fixed, 2)}$, drifting reads $${v.fix(info.drift, 2)}$\n$\\partial_tT=${v.fix(info.Tt, 3)}$, $\\mathbf u\\cdot\\nabla T=${v.fix(info.adv, 3)}$, sum $=${v.fix(info.D, 3)}$ · finite-difference slope of the drifting record $=${v.fix(info.fd, 3)}$ · heating rate $q=${v.fix(Q.value, 2)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Streamlines, pathlines and streaklines',
      statement: String.raw`Three curves visualise a flow $\mathbf u(\mathbf x,t)$. A **streamline** at time $t_0$ is tangent to $\mathbf u(\cdot,t_0)$ everywhere: $d\mathbf x/ds\parallel\mathbf u(\mathbf x,t_0)$ (a snapshot). A **pathline** is the trajectory $\mathbf X(t)$ of one particle. A **streakline** at time $t$ is the locus of all particles that have passed through a given point (an injector) earlier. In a steady flow the three coincide; in an unsteady flow they generally differ.`,
      idea: String.raw`In a steady flow a particle passing the injector follows the unique solution curve of $d\mathbf x/dt=\mathbf u(\mathbf x)$, which is tangent to $\mathbf u$ and is therefore a streamline; every later particle traces the same curve, so the dye line is that curve too. If $\mathbf u$ depends on time, the streamline freezes the field at one instant while a pathline feels each instant in turn, and the streakline is a snapshot of many pathlines started at different times.`,
      caption: String.raw`A cylinder in a stream whose direction swings by $\pm\alpha_0$. Dye is injected at the handle from release time $t_0$ on. Streamline (blue) is the instantaneous picture, pathline (orange) follows the first particle, streakline (pink) is the dye. Set the swing to $0^\circ$ and all three lie on one curve; the readout gives the separations.`,
      deps: ['fluid-1.2'],
      refs: ['Kundu §3.3', 'Acheson ch. 1'],
      tags: ['flow visualisation', 'streamline'],
      viz(v) {
        const Aw = v.slider('stream swing $\\alpha_0$ (degrees)', 0, 60, 30, { step: 1 });
        const OM = 1.5, S = 9;
        const t0s = v.slider('release time $t_0$', 0, 6, 0, { step: 0.1 });
        const s = v.stage({ x: [-4.5, 5.5], y: [-2.6, 2.6], equal: true, axes: false, height: 330, full: true, title: 'potential flow past a cylinder in an oscillating stream' });
        const seed = s.handle(-3.6, 0.45, { color: 'accent', label: 'injector', labelPos: 'n', constrain: { x: [-4.2, -1.8], y: [-2, 2] } });
        const flow = (t, x, y) => {
          const al = (Aw.value * Math.PI / 180) * Math.sin(OM * t), r2 = x * x + y * y, r4 = r2 * r2;
          const a = 1 - (x * x - y * y) / r4, b = (2 * x * y) / r4;
          return [a * Math.cos(al) + b * Math.sin(al), a * Math.sin(al) - b * Math.cos(al)];
        };
        const inside = (x, y) => x * x + y * y < 0.97;
        function streamline(t, x0, y0) {
          const out = [];
          for (const dir of [1, -1]) {
            let x = x0, y = y0; const pts = [];
            for (let i = 0; i < 420; i++) {
              const f = (_, xx, yy) => { const u = flow(t, xx, yy), L = Math.hypot(u[0], u[1]) || 1; return [dir * u[0] / L, dir * u[1] / L]; };
              [x, y] = rk4(f, 0, x, y, 0.04);
              if (inside(x, y) || Math.abs(x) > 5 || Math.abs(y) > 3) break;
              pts.push([x, y]);
            }
            if (dir === 1) out.push(...pts); else out.unshift(...pts.reverse());
            if (dir === 1) out.unshift([x0, y0]);
          }
          return out;
        }
        function trace(tr, x, y, t) {
          const pts = [[x, y]]; let tt = tr; const n = Math.max(1, Math.ceil((t - tr) / 0.06)), h = (t - tr) / n;
          for (let i = 0; i < n; i++) {
            [x, y] = rk4(flow, tt, x, y, h); tt += h;
            if (inside(x, y) || x > 5.2 || Math.abs(y) > 3) return { pts, dead: true };
            pts.push([x, y]);
          }
          return { pts, dead: false };
        }
        let info = {};
        v.animate((sTime) => {
          const t0 = t0s.value, t = t0 + sTime;
          s.circle(0, 0, 1, { fill: 'muted', fillAlpha: 0.3, color: 'muted', width: 1.6 });
          const sl = streamline(t, seed.x, seed.y);
          s.path(sl, { color: 'blue', width: 2.4 });
          const pl = trace(t0, seed.x, seed.y, t);
          s.path(pl.pts, { color: 'orange', width: 2.4 });
          if (!pl.dead) s.dot(pl.pts[pl.pts.length - 1][0], pl.pts[pl.pts.length - 1][1], { r: 6, color: 'gold' });
          const streak = [];
          for (let tau = t0; tau <= t + 1e-9; tau += 0.1) { const q = trace(tau, seed.x, seed.y, t); streak.push(q.dead ? null : q.pts[q.pts.length - 1]); }
          s.path(streak, { color: 'pink', width: 2.4 });
          s.dot(seed.x, seed.y, { r: 4, color: 'ink' });
          const al = Aw.value * Math.sin(OM * t);
          s.arrow(-4.2, 2.2, -4.2 + 0.9 * Math.cos(al * Math.PI / 180), 2.2 + 0.9 * Math.sin(al * Math.PI / 180), { color: 'ink', width: 2.2, head: 8 });
          s.text('stream', -4.2, 1.8, { size: 11, color: 'muted', align: 'left' });
          const sp = streak.filter(Boolean);
          const dS = Math.max(0, ...sp.map((p) => distToPoly(p[0], p[1], sl))), dP = Math.max(0, ...pl.pts.map((p) => distToPoly(p[0], p[1], sl)));
          info = { t, al, dS, dP };
        }, { period: S, still: 7 });
        v.legend([['blue', 'streamline (snapshot at $t$)'], ['orange', 'pathline of the first particle'], ['pink', 'streakline (dye injected since $t_0$)']]);
        v.readout(() => `$t=${v.fix(info.t, 1)}$, stream angle $${v.fix(info.al, 1)}^\\circ$ · largest distance from the streamline: pathline $${v.fix(info.dP, 3)}$, streakline $${v.fix(info.dS, 3)}$${Aw.value === 0 ? ' — steady flow, the three curves coincide (up to the accuracy of the integration)' : ''}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Continuity equation',
      statement: String.raw`Let $\rho(\mathbf x,t)$ and $\mathbf u(\mathbf x,t)$ be the density and velocity of a fluid, continuously differentiable, with no sources or sinks of mass. Then mass conservation is expressed by
$$\frac{\partial\rho}{\partial t}+\nabla\!\cdot(\rho\mathbf u)=0\qquad\Longleftrightarrow\qquad \frac{D\rho}{Dt}=-\rho\,\nabla\!\cdot\mathbf u .$$
Equivalently, for every fixed control volume $V$: $\dfrac d{dt}\displaystyle\int_V\rho\,dV=-\oint_{\partial V}\rho\,\mathbf u\cdot\mathbf n\,dS$.`,
      idea: String.raw`The mass in a fixed box can change only by flux through its faces, which is the integral form. Apply the divergence theorem (pma-10.51) to the boundary integral to get $\int_V(\partial_t\rho+\nabla\cdot(\rho\mathbf u))\,dV=0$ for every $V$, and since $V$ is arbitrary and the integrand continuous the integrand vanishes. Expanding the product and using the material derivative (1.3) gives the second form.`,
      caption: String.raw`A smooth two-dimensional compressible flow (a standing density wave built from an exact particle map, so $\rho$ and $\mathbf u$ are consistent). Drag the two corners of the control box and watch the face fluxes (green out, red in) balance $d M/dt$. Switch on "wrong velocity" and the balance breaks.`,
      deps: ['fluid-1.3', 'pma-10.51'],
      refs: ['Kundu §4.2', 'Acheson ch. 1'],
      tags: ['continuity', 'mass conservation'],
      viz(v) {
        const W = 1;
        const eps = v.slider('wave strength $\\varepsilon$', 0.05, 0.6, 0.4, { step: 0.01 });
        const bad = v.toggle('wrong velocity ($1.3\\,\\mathbf u$ — violates continuity)', false);
        const s = v.stage({ x: [-3.4, 3.4], y: [-2.5, 2.5], equal: true, axes: false, height: 360, full: true, title: 'density (blue: rarefied, orange: compressed) and velocity' });
        const p1 = s.handle(-1.6, -1.2, { color: 'accent' }), p2 = s.handle(1.4, 1.0, { color: 'accent' });
        const GL = gauss(16);
        // exact particle map  x = X − e (sin X cos Y, cos X sin Y),  e = ε sin(ωt)
        function inv(x, y, e) {
          let X = x, Y = y;
          for (let i = 0; i < 25; i++) {
            const sX = Math.sin(X), cX = Math.cos(X), sY = Math.sin(Y), cY = Math.cos(Y);
            const fx = X - e * sX * cY - x, fy = Y - e * cX * sY - y;
            const a = 1 - e * cX * cY, b = e * sX * sY, det = a * a - b * b;
            const dX = (a * fx - b * fy) / det, dY = (-b * fx + a * fy) / det;
            X -= dX; Y -= dY;
            if (Math.abs(dX) + Math.abs(dY) < 1e-13) break;
          }
          return [X, Y];
        }
        const E = (t) => eps.value * Math.sin(W * t);
        function state(x, y, t) {
          const e = E(t), [X, Y] = inv(x, y, e), cX = Math.cos(X), cY = Math.cos(Y), sX = Math.sin(X), sY = Math.sin(Y);
          const J = (1 - e * cX * cY) ** 2 - (e * sX * sY) ** 2, k = eps.value * W * Math.cos(W * t) * (bad.value ? 1.3 : 1);
          return { rho: 1 / J, u: -k * sX * cY, v: -k * cX * sY };
        }
        const mass = (x0, x1, y0, y1, t) => {
          let m = 0;
          for (let i = 0; i < GL.xs.length; i++) for (let j = 0; j < GL.xs.length; j++) {
            m += GL.ws[i] * GL.ws[j] * state(((x1 - x0) / 2) * GL.xs[i] + (x0 + x1) / 2, ((y1 - y0) / 2) * GL.xs[j] + (y0 + y1) / 2, t).rho;
          }
          return m * ((x1 - x0) / 2) * ((y1 - y0) / 2);
        };
        const face = (fx, a0, a1, horizontal, t) => { // ∫ ρ (velocity component normal to face) along the face
          let f = 0;
          for (let i = 0; i < GL.xs.length; i++) {
            const a = ((a1 - a0) / 2) * GL.xs[i] + (a0 + a1) / 2, q = horizontal ? state(a, fx, t) : state(fx, a, t);
            f += GL.ws[i] * q.rho * (horizontal ? q.v : q.u);
          }
          return (f * (a1 - a0)) / 2;
        };
        let info = {};
        v.animate((t) => {
          const hh = 1e-4;
          s.heat((x, y) => Math.log(state(x, y, t).rho), { cmap: 'theme-diverging', neg: 'blue', pos: 'orange', range: [-1.5, 1.5], res: 6 });
          for (let x = -3; x <= 3; x += 1) for (let y = -2; y <= 2; y += 1) { const q = state(x, y, t); s.arrow(x, y, x + 2.2 * q.u, y + 2.2 * q.v, { color: 'ink', alpha: 0.6, width: 1.3, head: 5 }); }
          const x0 = Math.min(p1.x, p2.x), x1 = Math.max(p1.x, p2.x), y0 = Math.min(p1.y, p2.y), y1 = Math.max(p1.y, p2.y);
          s.rect(x0, y0, x1, y1, { color: 'ink', width: 2.4 });
          const dM = (mass(x0, x1, y0, y1, t + hh) - mass(x0, x1, y0, y1, t - hh)) / (2 * hh);
          const fR = face(x1, y0, y1, false, t), fL = -face(x0, y0, y1, false, t), fT = face(y1, x0, x1, true, t), fB = -face(y0, x0, x1, true, t);
          const outflow = fR + fL + fT + fB;
          const arr = (fl, xm, ym, nx, ny) => {
            const len = Math.max(0.15, Math.min(1.0, Math.abs(fl) * 0.5)) * Math.sign(fl || 1);
            s.arrow(xm, ym, xm + nx * len, ym + ny * len, { color: fl >= 0 ? 'green' : 'red', width: 3.2, head: 9 });
            s.text(v.fix(fl, 2), xm + nx * (len + (len > 0 ? 0.25 : -0.28)) , ym + ny * (len + (len > 0 ? 0.2 : -0.22)), { size: 12, color: fl >= 0 ? 'green' : 'red', align: 'center', baseline: 'middle', plate: true });
          };
          arr(fR, x1, (y0 + y1) / 2, 1, 0); arr(fL, x0, (y0 + y1) / 2, -1, 0); arr(fT, (x0 + x1) / 2, y1, 0, 1); arr(fB, (x0 + x1) / 2, y0, 0, -1);
          info = { M: mass(x0, x1, y0, y1, t), dM, outflow, t };
        }, { period: TAU / W, still: 1.2 });
        v.readout(() => `**Mass in the box** $M=\\int\\rho\\,dA=${v.fix(info.M, 4)}$ · $dM/dt=${v.fix(info.dM, 6)}$ · net outflow $\\oint\\rho\\mathbf u\\cdot\\mathbf n\\,ds=${v.fix(info.outflow, 6)}$ · $dM/dt+\\text{outflow}=${v.sci(info.dM + info.outflow, 2)}$${bad.value ? ' (velocity does not match the density: continuity fails)' : ''}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Incompressible flow',
      statement: String.raw`A flow is **incompressible** if the density of every fluid particle stays constant, $D\rho/Dt=0$. By the continuity equation (1.5) this holds exactly when $\nabla\!\cdot\mathbf u=0$ (and, if the fluid is also homogeneous, $\rho$ is constant everywhere). Then the volume of every material region is conserved: a blob of fluid may be stretched and folded without limit, but its area (in 2D) or volume (in 3D) never changes.`,
      idea: String.raw`Continuity says $D\rho/Dt=-\rho\nabla\!\cdot\mathbf u$, so a particle's density is constant iff the divergence vanishes. The same divergence is the fractional rate of change of a material volume, $\tfrac1V\tfrac{dV}{dt}=\nabla\!\cdot\mathbf u$ (this is the content of 1.8 and of vcalc-8.7), so zero divergence also means constant volume. Incompressibility is a property of the flow, not of the fluid: liquids and low-speed gases (Mach number $\ll1$) behave this way.`,
      caption: String.raw`A dye blob is carried by a time-periodic double-gyre flow (exactly divergence-free) and is stretched into long filaments, yet its area (computed from the boundary, with points inserted as it lengthens) stays at 1. Switch to the compressible variant, which adds a uniform expansion to the same flow, and the area runs away.`,
      deps: ['fluid-1.5', 'vcalc-8.7'],
      refs: ['Kundu §4.2'],
      tags: ['incompressible', 'divergence'],
      viz(v) {
        const A0 = 0.2, EPS = 0.25, OMG = TAU / 10, BETA = 0.05;
        const mode = v.select('', [{ value: 'inc', label: 'incompressible' }, { value: 'comp', label: 'compressible (expansion added)' }], 'inc', { onChange: () => S.reset() });
        const s = v.stage({ x: [0, 2], y: [0, 1], equal: true, axes: false, height: 300, full: true, title: 'dye blob in a double-gyre flow' });
        const hs = v.stage({ x: [0, 40], y: [0, 2], axes: 'box', gutter: true, height: 170, full: true, xlabel: 't', ylabel: 'A(t)/A(0)', title: 'area of the blob' });
        const flow = (t, x, y) => {
          const a = EPS * Math.sin(OMG * t), f = a * x * x + (1 - 2 * a) * x, fx = 2 * a * x + 1 - 2 * a;
          let u = -Math.PI * A0 * Math.sin(Math.PI * f) * Math.cos(Math.PI * y), w = Math.PI * A0 * Math.cos(Math.PI * f) * Math.sin(Math.PI * y) * fx;
          if (mode.value === 'comp') { u += BETA * (x - 1); w += BETA * (y - 0.5); }
          return [u, w];
        };
        const N0 = 3000, CAP = 24000;
        const init = () => {
          const X = new Float64Array(CAP), Y = new Float64Array(CAP);
          for (let i = 0; i < N0; i++) { X[i] = 0.5 + 0.2 * Math.cos((TAU * i) / N0); Y[i] = 0.5 + 0.2 * Math.sin((TAU * i) / N0); }
          return { X, Y, n: N0, a0: shoelace(X, Y, N0), hist: [[0, 1]], k: 0 };
        };
        const S = v.sim(init, (st, dt, t) => {
          for (let i = 0; i < st.n; i++) [st.X[i], st.Y[i]] = rk4(flow, t, st.X[i], st.Y[i], dt);
          st.k++;
          if (st.k % 8 === 0) { // insert midpoints into long edges (a chord's midpoint adds no area, but then follows the flow)
            const nx = [], ny = [];
            for (let i = 0; i < st.n; i++) {
              const j = i + 1 === st.n ? 0 : i + 1; nx.push(st.X[i]); ny.push(st.Y[i]);
              if (Math.hypot(st.X[j] - st.X[i], st.Y[j] - st.Y[i]) > 0.012 && nx.length + st.n < CAP) { nx.push((st.X[i] + st.X[j]) / 2); ny.push((st.Y[i] + st.Y[j]) / 2); }
            }
            st.n = nx.length; st.X.set(nx); st.Y.set(ny);
            st.hist.push([t + dt, shoelace(st.X, st.Y, st.n) / st.a0]);
          }
        }, { dt: 0.025 });
        let info = {};
        v.animate((t) => {
          const st = S.advance(t);
          s.circle(0.5, 0.5, 0.2, { color: 'muted', width: 1.2, dash: true });
          const pts = []; for (let i = 0; i < st.n; i++) pts.push([st.X[i], st.Y[i]]);
          s.poly(pts, { fill: 'accent', fillAlpha: 0.65, color: 'accent', width: 0.8 });
          hs.setView([0, 40], [0, Math.max(2, 1.1 * Math.max(...st.hist.map((q) => q[1])))]);
          hs.hline(1, { color: 'green', dash: true });
          hs.path(st.hist, { color: 'accent', width: 2.2 });
          const ratio = shoelace(st.X, st.Y, st.n) / st.a0;
          info = { ratio, n: st.n, t, area: shoelace(st.X, st.Y, st.n) };
        }, { period: 40, still: 22 });
        v.readout(() => `$t=${v.fix(info.t, 1)}$ · boundary of the blob: ${info.n} points · area $=${v.fix(info.area, 4)}$ (initially $\\pi(0.2)^2=${v.fix(Math.PI * 0.04, 4)}$) · $A/A_0=${v.fix(info.ratio, 4)}$${mode.value === 'inc' ? ' — conserved: $\\nabla\\cdot\\mathbf u=0$' : ' — not conserved: $\\nabla\\cdot\\mathbf u=0.1$'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Definition',
      name: 'Stream function',
      statement: String.raw`For a two-dimensional incompressible flow $\mathbf u=(u,v)$ on a simply connected region there is a **stream function** $\psi(x,y)$, unique up to an additive constant, with
$$u=\frac{\partial\psi}{\partial y},\qquad v=-\frac{\partial\psi}{\partial x}.$$
Conversely every such $\psi$ gives a divergence-free field. Then $\mathbf u\cdot\nabla\psi=0$, so streamlines (of a steady flow) are the level curves of $\psi$, the speed is $|\nabla\psi|$, and the volume flux per unit depth across any curve from $A$ to $B$ equals $\psi(B)-\psi(A)$.`,
      idea: String.raw`The equation $\partial_xu+\partial_yv=0$ says that the 1-form $u\,dy-v\,dx$ is closed; on a simply connected region a closed form is exact (pma-10.39), $=d\psi$. Then $u\,dy-v\,dx=d\psi$ is exactly the flux through a line element, so the flux across a curve is the change of $\psi$ along it, and along a level curve of $\psi$ no fluid crosses: the velocity is tangent.`,
      caption: String.raw`Paint the stream function with the mouse (choose $+$ or $-$ and a brush size): the velocity arrows come out tangent to the contours, closely spaced contours mean fast flow. Move the two handles $A$ and $B$: the flux through the segment $AB$, integrated from the velocity, equals $\psi(B)-\psi(A)$.`,
      deps: ['fluid-1.6', 'pma-10.39'],
      refs: ['Kundu §4.3', 'Acheson ch. 1'],
      tags: ['stream function', 'incompressible'],
      viz(v) {
        const GX = 132, GY = 80, X0 = -3.3, X1 = 3.3, Y0 = -2, Y1 = 2, dx = (X1 - X0) / GX, dy = (Y1 - Y0) / GY;
        let psi = new Float32Array((GX + 1) * (GY + 1));
        const bump = (cx, cy, amp, sg) => {
          const R = 3 * sg, i0 = Math.max(0, Math.floor((cx - R - X0) / dx)), i1 = Math.min(GX, Math.ceil((cx + R - X0) / dx));
          const j0 = Math.max(0, Math.floor((cy - R - Y0) / dy)), j1 = Math.min(GY, Math.ceil((cy + R - Y0) / dy));
          for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
            const x = X0 + i * dx - cx, y = Y0 + j * dy - cy;
            psi[j * (GX + 1) + i] += amp * Math.exp(-(x * x + y * y) / (2 * sg * sg));
          }
        };
        const PS = (x, y) => {
          const fx = Math.max(0, Math.min(GX - 1e-9, (x - X0) / dx)), fy = Math.max(0, Math.min(GY - 1e-9, (y - Y0) / dy));
          const i = Math.floor(fx), j = Math.floor(fy), a = fx - i, b = fy - j, k = j * (GX + 1) + i;
          return psi[k] * (1 - a) * (1 - b) + psi[k + 1] * a * (1 - b) + psi[k + GX + 1] * (1 - a) * b + psi[k + GX + 2] * a * b;
        };
        const VEL = (x, y) => [(PS(x, y + dy) - PS(x, y - dy)) / (2 * dy), -(PS(x + dx, y) - PS(x - dx, y)) / (2 * dx)];
        const preset = (name) => {
          psi = new Float32Array((GX + 1) * (GY + 1));
          if (name === 'gyres') { bump(-1.5, 0, 0.9, 0.8); bump(1.5, 0, -0.9, 0.8); }
          if (name === 'jet') { for (let x = -3; x <= 3; x += 0.25) { bump(x, 0.5, -0.12, 0.7); bump(x, -0.5, 0.12, 0.7); } }
          if (name === 'obstacle') { for (let y = -2; y <= 2; y += 0.2) bump(-3, y, 0.1, 0.5); bump(0, 0, -1.2, 0.7); }
        };
        preset('gyres');
        const sign = v.select('brush', [{ value: '1', label: '+ψ' }, { value: '-1', label: '−ψ' }], '1');
        const size = v.slider('brush size', 0.15, 0.9, 0.4, { step: 0.05 });
        v.button('Two gyres', () => preset('gyres')); v.button('Jet', () => preset('jet')); v.button('Blank', () => preset('none'));
        const s = v.stage({ x: [X0, X1], y: [Y0, Y1], equal: true, axes: false, height: 380, full: true, title: 'paint $\\psi$ here: orange $\\psi>0$, blue $\\psi<0$' });
        const hA = s.handle(-2.3, -1.2, { color: 'green', label: 'A', labelPos: 'nw' }), hB = s.handle(2.3, 1.2, { color: 'purple', label: 'B', labelPos: 'ne' });
        let last = null;
        s.onDrag((x, y, phase) => {
          if (phase === 'start') last = null;
          if (phase === 'end') { last = null; return; }
          if (last && Math.hypot(x - last[0], y - last[1]) < size.value * 0.35) return;
          last = [x, y]; bump(x, y, 0.1 * Number(sign.value), size.value); v.invalidate();
        });
        let info = {};
        v.render(() => {
          let lo = Infinity, hi = -Infinity; for (let i = 0; i < psi.length; i++) { lo = Math.min(lo, psi[i]); hi = Math.max(hi, psi[i]); }
          const step = Math.max(0.05, Math.max(hi, -lo) / 9), pos = [], neg = [];
          for (let k = 1; k * step <= hi; k++) pos.push(k * step); for (let k = 1; -k * step >= lo; k++) neg.push(-k * step);
          s.heat((x, y) => PS(x, y), { cmap: 'theme-diverging', neg: 'blue', pos: 'orange', range: [-Math.max(0.3, hi, -lo), Math.max(0.3, hi, -lo)], res: 5, alpha: 0.5 });
          s.contour(PS, pos, { color: 'orange', width: 1.6, res: 110 }); s.contour(PS, neg, { color: 'blue', width: 1.6, res: 110 }); s.contour(PS, [0], { color: 'muted', width: 1, alpha: 0.7, res: 110 });
          s.field(VEL, { spacing: 40, color: 'ink', alpha: 0.7, width: 1.3 });
          s.segment([hA.x, hA.y], [hB.x, hB.y], { color: 'ink', width: 2.2, dash: [6, 4] });
          // flux of the velocity across AB (to the left of travel A→B counts positive): ∫ (u dy − v dx) = ψ(B)−ψ(A)
          let F = 0; const n = 200, ex = hB.x - hA.x, ey = hB.y - hA.y;
          for (let i = 0; i < n; i++) { const w = (i + 0.5) / n, q = VEL(hA.x + w * ex, hA.y + w * ey); F += (q[0] * ey - q[1] * ex) / n; }
          info = { F, d: PS(hB.x, hB.y) - PS(hA.x, hA.y), pa: PS(hA.x, hA.y), pb: PS(hB.x, hB.y) };
        });
        v.readout(() => `$\\psi(A)=${v.fix(info.pa, 3)}$, $\\psi(B)=${v.fix(info.pb, 3)}$, $\\psi(B)-\\psi(A)=${v.fix(info.d, 4)}$ · flux through $AB$ computed from $\\mathbf u$: $\\int(u\\,dy-v\\,dx)=${v.fix(info.F, 4)}$ · the arrows are tangent to the contours by construction: $\\mathbf u\\cdot\\nabla\\psi=0$`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Theorem',
      name: 'Reynolds transport theorem',
      statement: String.raw`Let $V(t)$ be a material region (bounded by the same fluid particles at all times) in a flow $\mathbf u$ and let $F(\mathbf x,t)$ be continuously differentiable. Then
$$\frac d{dt}\int_{V(t)}F\,dV=\int_{V(t)}\frac{\partial F}{\partial t}\,dV+\oint_{\partial V(t)}F\,\mathbf u\cdot\mathbf n\,dS=\int_{V(t)}\Big(\frac{DF}{Dt}+F\,\nabla\!\cdot\mathbf u\Big)dV .$$
The same holds for any region whose boundary moves with velocity $\mathbf w$ when $\mathbf u$ is replaced by $\mathbf w$ in the surface term.`,
      idea: String.raw`Transform to the labels $\mathbf a$ of the particles: $V(t)$ is the image of a fixed region under the flow map with Jacobian $J$, so $\int_{V(t)}F\,dV=\int_{V_0}F(\mathbf X,t)\,J\,dV_0$ and the derivative can be taken inside. It gives $DF/Dt\,J+F\,\dot J$, and $\dot J=J\,\nabla\!\cdot\mathbf u$ (the volume rate of change). The divergence theorem converts $\int\nabla\cdot(F\mathbf u)$ to the surface flux, which is the second form.`,
      caption: String.raw`A disc of fluid is carried by a linear flow (strain, rotation and dilation sliders), becoming an ellipse. The three bars compare the direct rate of change $dI/dt$ (finite difference of the integral over the moving region) with the two terms of the theorem. Choose $F=1$ to see Reynolds' theorem reduce to $dV/dt=\int\nabla\cdot\mathbf u$.`,
      deps: ['fluid-1.5', 'pma-9.42'],
      refs: ['Kundu §3.6'],
      tags: ['control volume', 'transport theorem'],
      viz(v) {
        const D = v.slider('dilation $\\nabla\\cdot\\mathbf u$', -0.4, 0.4, 0.15, { step: 0.01 });
        const Eb = v.slider('strain rate', -0.4, 0.4, 0.25, { step: 0.01 });
        const Om = v.slider('vorticity $\\omega$', -1.2, 1.2, 0.7, { step: 0.01 });
        const Fsel = v.select('$F$', [{ value: 'one', label: '$F=1$' }, { value: 'wave', label: 'travelling wave' }, { value: 'blob', label: 'moving blob' }], 'blob');
        const s = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, axes: false, height: 340, title: 'material region (green) and $F$' });
        const bs = v.stage({ x: [0.3, 3.7], y: [-3, 3], axes: 'box', gutter: true, height: 340, xticks: [[1, 'dI/dt'], [2, '∫∂F/∂t'], [3, '∮F u·n']], title: 'Reynolds transport theorem' });
        const F = (x, y, t) => {
          if (Fsel.value === 'one') return 1;
          if (Fsel.value === 'wave') return 1 + 0.6 * Math.sin(1.3 * x - 2 * t) * Math.cos(0.8 * y);
          return 0.2 + Math.exp(-((x - 1.4 * Math.cos(1.2 * t)) ** 2 + (y - 1.4 * Math.sin(1.2 * t)) ** 2) / 1.2);
        };
        const GLr = gauss(16, 0, 1), NT = 96;
        const Mx = () => [[D.value / 2 + Eb.value, -Om.value / 2], [Om.value / 2, D.value / 2 - Eb.value]];
        const R0 = 1.1;
        const integral = (E, det, t) => {
          let I = 0;
          for (let i = 0; i < GLr.xs.length; i++) {
            const r = R0 * GLr.xs[i]; let ring = 0;
            for (let k = 0; k < NT; k++) { const th = (TAU * k) / NT, xi = r * Math.cos(th), yi = r * Math.sin(th); ring += F(E[0][0] * xi + E[0][1] * yi, E[1][0] * xi + E[1][1] * yi, t); }
            I += GLr.ws[i] * R0 * r * ring * (TAU / NT);
          }
          return I * det;
        };
        let info = {};
        v.animate((t) => {
          const M = Mx(), E = v.M.expm(M.map((r) => r.map((e) => e * t))), det = E[0][0] * E[1][1] - E[0][1] * E[1][0];
          const h = 1e-4;
          const Ep = v.M.expm(M.map((r) => r.map((e) => e * (t + h)))), Em = v.M.expm(M.map((r) => r.map((e) => e * (t - h))));
          const dp = Ep[0][0] * Ep[1][1] - Ep[0][1] * Ep[1][0], dm = Em[0][0] * Em[1][1] - Em[0][1] * Em[1][0];
          const direct = (integral(Ep, dp, t + h) - integral(Em, dm, t - h)) / (2 * h);
          // ∫ ∂F/∂t dV
          let vol = 0;
          for (let i = 0; i < GLr.xs.length; i++) {
            const r = R0 * GLr.xs[i]; let ring = 0;
            for (let k = 0; k < NT; k++) { const th = (TAU * k) / NT, xi = r * Math.cos(th), yi = r * Math.sin(th), x = E[0][0] * xi + E[0][1] * yi, y = E[1][0] * xi + E[1][1] * yi; ring += (F(x, y, t + h) - F(x, y, t - h)) / (2 * h); }
            vol += GLr.ws[i] * R0 * r * ring * (TAU / NT);
          }
          vol *= det;
          // ∮ F u·n dS, with n dS = (y', −x') dθ
          let flux = 0; const bd = [];
          for (let k = 0; k < 4 * NT; k++) {
            const th = (TAU * k) / (4 * NT), xi = R0 * Math.cos(th), yi = R0 * Math.sin(th), dxi = -R0 * Math.sin(th), dyi = R0 * Math.cos(th);
            const x = E[0][0] * xi + E[0][1] * yi, y = E[1][0] * xi + E[1][1] * yi, tx = E[0][0] * dxi + E[0][1] * dyi, ty = E[1][0] * dxi + E[1][1] * dyi;
            const u = M[0][0] * x + M[0][1] * y, w = M[1][0] * x + M[1][1] * y;
            flux += F(x, y, t) * (u * ty - w * tx) * (TAU / (4 * NT)); bd.push([x, y]);
          }
          s.heat((x, y) => F(x, y, t), { cmap: 'theme', color: 'purple', range: Fsel.value === 'one' ? [0, 2] : [0, 1.7], res: 5 });
          for (let x = -3.5; x <= 3.5; x += 1.4) for (let y = -2.5; y <= 2.5; y += 1.25) s.arrow(x, y, x + 0.5 * (M[0][0] * x + M[0][1] * y), y + 0.5 * (M[1][0] * x + M[1][1] * y), { color: 'ink', alpha: 0.45, width: 1.2, head: 4 });
          s.poly(bd, { fill: 'green', fillAlpha: 0.18, color: 'green', width: 2.6 });
          bs.hline(0, { color: 'faint' });
          const sc = Math.max(0.05, Math.abs(direct), Math.abs(vol), Math.abs(flux));
          bs.setView([0.3, 3.7], [-1.25 * sc, 1.25 * sc]);
          bs.bars([direct, vol, flux], { color: (_, i) => ['accent', 'blue', 'orange'][i] });
          [direct, vol, flux].forEach((val, i) => bs.text(v.fix(val, 3), i + 1, val + (val >= 0 ? 1 : -1) * 0.12 * sc, { size: 12, color: 'ink', align: 'center' }));
          info = { direct, vol, flux, t, I: integral(E, det, t), area: det * Math.PI * R0 * R0 };
        }, { period: 3, still: 1.5 });
        v.readout(() => `$t=${v.fix(info.t, 2)}$: $I(t)=\\int_{V(t)}F\\,dA=${v.fix(info.I, 4)}$, area $${v.fix(info.area, 3)}$ · $dI/dt=${v.fix(info.direct, 5)}$ · $\\int\\partial_tF\\,dA+\\oint F\\mathbf u\\cdot\\mathbf n\\,ds=${v.fix(info.vol, 5)}+${v.fix(info.flux, 5)}=${v.fix(info.vol + info.flux, 5)}$ · difference $${v.sci(info.direct - info.vol - info.flux, 2)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Definition',
      name: 'Vorticity',
      statement: String.raw`The **vorticity** of a flow is the curl of its velocity, $\boldsymbol\omega=\nabla\times\mathbf u$; in a plane flow it is the scalar $\omega=\partial_xv-\partial_yu$ (pointing out of the plane). It is twice the angular velocity with which a small fluid element rotates as a whole, as measured by the average rotation of the fluid on a small circle about it. A flow with $\boldsymbol\omega=\mathbf 0$ is **irrotational**. Fluid can move in circles round a point with no vorticity away from it.`,
      idea: String.raw`Write $\mathbf u(\mathbf x_0+\mathbf r)\approx\mathbf u_0+A\mathbf r$ with $A=\nabla\mathbf u$. The antisymmetric part of $A$ is a rigid rotation at rate $\tfrac12\boldsymbol\omega$ (1.10); the circulation around a small circle of radius $\rho$ is $\pi\rho^2\,\omega$ (curl as circulation density, vcalc-3.7), and the mean angular velocity of the ring is circulation$/(2\pi\rho^2)=\tfrac12\omega$. A shear is full of vorticity although its streamlines are straight; the potential vortex $u_\theta\propto1/r$ has none although they are circles.`,
      caption: String.raw`Three paddle wheels in a chosen flow; each spins at the average angular velocity of the fluid on a ring around it (computed numerically). In shear and solid rotation they spin at $\omega/2$; in the potential vortex they do not spin although the fluid circles the centre; in the Rankine vortex they spin inside the core only. Drag the wheels around. Colour: vorticity.`,
      deps: ['fluid-1.3', 'pma-10.42', 'vcalc-3.5', 'vcalc-3.7'],
      refs: ['Kundu §3.4', 'Acheson ch. 1'],
      tags: ['vorticity', 'rotation'],
      viz(v) {
        const a = 1.4, G = TAU * 0.5 * a * a;
        const FL = {
          shear: { u: (x, y) => [y, 0] },
          solid: { u: (x, y) => [-0.5 * y, 0.5 * x] },
          vortex: { u: (x, y) => { const k = G / (TAU * (x * x + y * y + 1e-9)); return [-k * y, k * x]; } },
          rankine: { u: (x, y) => { const r2 = x * x + y * y; if (r2 < a * a) return [-0.5 * y, 0.5 * x]; const k = G / (TAU * r2); return [-k * y, k * x]; } },
        };
        const sel = v.select('flow', [{ value: 'shear', label: 'shear $u=y$' }, { value: 'solid', label: 'solid rotation' }, { value: 'vortex', label: 'potential vortex' }, { value: 'rankine', label: 'Rankine vortex' }], 'shear');
        const s = v.stage({ x: [-3.6, 3.6], y: [-2.6, 2.6], equal: true, axes: false, height: 380, full: true, title: 'paddle wheels (red blade marks the rotation); colour = vorticity' });
        const hs = [s.handle(1.8, 0.7, { color: 'accent' }), s.handle(-1.9, -0.9, { color: 'accent' }), s.handle(0.4, 1.9, { color: 'accent' })];
        const ang = [0.3, 0.9, 0.0];
        const E = 1e-4, rw = 0.2;
        const vort = (U, x, y) => (U(x + E, y)[1] - U(x - E, y)[1]) / (2 * E) - (U(x, y + E)[0] - U(x, y - E)[0]) / (2 * E);
        const spin = (U, x, y) => { let c = 0; const n = 64; for (let k = 0; k < n; k++) { const th = (TAU * k) / n, q = U(x + rw * Math.cos(th), y + rw * Math.sin(th)); c += -q[0] * Math.sin(th) + q[1] * Math.cos(th); } return c / n / rw; };
        let lastT = null, info = [];
        v.animate((t) => {
          const U = FL[sel.value].u, dt = lastT == null || t < lastT || t - lastT > 0.3 ? 0 : t - lastT; lastT = t;
          s.heat((x, y) => vort(U, x, y), { cmap: 'theme-diverging', neg: 'blue', pos: 'red', range: [-1.6, 1.6], res: 5 });
          s.field(U, { spacing: 36, color: 'ink', alpha: 0.5, width: 1.2 });
          if (sel.value === 'vortex' || sel.value === 'rankine') s.circle(0, 0, 0.0001, { color: 'ink' });
          info = hs.map((h, i) => {
            const W = spin(U, h.x, h.y); ang[i] += W * dt;
            for (let b = 0; b < 4; b++) {
              const th = ang[i] + (b * Math.PI) / 2;
              s.line(h.x, h.y, h.x + 0.38 * Math.cos(th), h.y + 0.38 * Math.sin(th), { color: b === 0 ? 'red' : 'ink', width: 4 });
            }
            s.circle(h.x, h.y, 0.38, { color: 'ink', width: 1, alpha: 0.5 });
            return { W, half: vort(U, h.x, h.y) / 2, r: Math.hypot(h.x, h.y) };
          });
        }, { period: 20, still: 2.4 });
        v.readout(() => info.map((q, i) => `wheel ${i + 1}: spin $\\Omega=${v.fix(q.W, 3)}$ rad/s, $\\omega/2=${v.fix(q.half, 3)}$`).join(' · ') + `\n${sel.value === 'vortex' ? 'Away from the centre the fluid circles, $|\\mathbf u|=\\Gamma/2\\pi r$, but the vorticity is zero: a wheel dropped in would be carried round the centre without turning.' : sel.value === 'rankine' ? 'Inside the core $r<1.4$ the vorticity is $1$ and the wheels spin; outside it is $0$.' : 'Uniform vorticity: every wheel spins at half of it, wherever it is.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Theorem',
      name: 'Strain rate and rotation: splitting the velocity gradient',
      statement: String.raw`Near a point $\mathbf x_0$ the velocity is $\mathbf u(\mathbf x_0+\mathbf r)=\mathbf u_0+S\mathbf r+\tfrac12\boldsymbol\omega\times\mathbf r+o(|\mathbf r|)$, where the velocity gradient $A=\nabla\mathbf u$ ($A_{ij}=\partial_ju_i$) is the sum of its symmetric part, the **rate-of-strain tensor** $S=\tfrac12(A+A^{\mathsf T})$, and its antisymmetric part $W=\tfrac12(A-A^{\mathsf T})$, which acts as $W\mathbf r=\tfrac12\boldsymbol\omega\times\mathbf r$. So a small fluid element translates, rotates rigidly with angular velocity $\tfrac12\boldsymbol\omega$, and deforms along the orthogonal principal axes of $S$, whose eigenvalues are stretching rates; $\operatorname{tr}S=\nabla\cdot\mathbf u$ is the rate of volume change.`,
      idea: String.raw`Taylor expansion gives $\mathbf u\approx\mathbf u_0+A\mathbf r$; any square matrix is uniquely the sum of a symmetric and an antisymmetric matrix. A real symmetric matrix has an orthonormal eigenbasis (ladr-7.29), so $S$ is a pure stretch along three perpendicular axes, and a $3\times3$ antisymmetric matrix is exactly a cross product with the vector $\tfrac12\boldsymbol\omega$. Neither part can be seen in the other: rotation changes no lengths, strain changes lengths but has no rotation of its principal axes.`,
      caption: String.raw`Set the four entries of $\nabla\mathbf u$ (or take a preset). Left: the unit square under the true flow map $e^{\tau A}$, with the velocity arrow of each corner split into its spin part (orange) and strain part (blue). Middle: only the spin $W$ — a rigid rotation. Right: only the strain $S$, with its principal axes (green).`,
      deps: ['fluid-1.9', 'ladr-7.29'],
      refs: ['Kundu §3.4', 'Kundu §2.11'],
      tags: ['strain rate', 'deformation'],
      viz(v) {
        const P = { shear: [0, 1, 0, 0], rot: [0, -0.7, 0.7, 0], strain: [0.6, 0, 0, -0.6], expand: [0.4, 0, 0, 0.4], gen: [0.3, 0.9, -0.3, -0.1] };
        const sl = {};
        const sel = v.select('preset', [{ value: 'shear', label: 'shear' }, { value: 'rot', label: 'rotation' }, { value: 'strain', label: 'pure strain' }, { value: 'expand', label: 'expansion' }, { value: 'gen', label: 'general' }], 'gen', {
          onChange: (k) => { P[k].forEach((x, i) => sl['abcd'[i]].set(x)); },
        });
        sl.a = v.slider('$\\partial_xu$', -1, 1, P.gen[0], { step: 0.01 }); sl.b = v.slider('$\\partial_yu$', -1, 1, P.gen[1], { step: 0.01 });
        sl.c = v.slider('$\\partial_xv$', -1, 1, P.gen[2], { step: 0.01 }); sl.d = v.slider('$\\partial_yv$', -1, 1, P.gen[3], { step: 0.01 });
        const tau = v.slider('time $\\tau$', 0.05, 0.8, 0.4, { step: 0.01 });
        const mk = (title) => v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: true, height: 270, title, minWidth: 250 });
        const s1 = mk('flow map of the square, $e^{\\tau A}$'), s2 = mk('spin part $W$ only'), s3 = mk('strain part $S$ only');
        void sel;
        const sq = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        const ap = (M, p) => [M[0][0] * p[0] + M[0][1] * p[1], M[1][0] * p[0] + M[1][1] * p[1]];
        const circ = (M, r) => { const o = []; for (let k = 0; k <= 72; k++) o.push(ap(M, [r * Math.cos((TAU * k) / 72), r * Math.sin((TAU * k) / 72)])); return o; };
        const sc = (M, f) => M.map((r) => r.map((x) => x * f));
        let info = {};
        v.render(() => {
          const A = [[sl.a.value, sl.b.value], [sl.c.value, sl.d.value]];
          const S = [[A[0][0], (A[0][1] + A[1][0]) / 2], [(A[0][1] + A[1][0]) / 2, A[1][1]]], Wm = [[0, (A[0][1] - A[1][0]) / 2], [(A[1][0] - A[0][1]) / 2, 0]];
          const t = tau.value, EA = v.M.expm(sc(A, t)), ES = v.M.expm(sc(S, t)), EW = v.M.expm(sc(Wm, t));
          const draw = (st, M, col) => {
            st.path([...sq, sq[0]], { color: 'muted', width: 1.4, dash: true });
            st.poly(sq.map((p) => ap(M, p)), { fill: col, fillAlpha: 0.2, color: col, width: 2.4 });
            st.path(circ(M, 1), { color: col, width: 1.2, alpha: 0.7 });
          };
          draw(s1, EA, 'accent'); draw(s2, EW, 'orange'); draw(s3, ES, 'blue');
          for (const p of [...sq, [0, -1], [1, 0], [0, 1], [-1, 0]]) {
            const w = ap(Wm, p), q = ap(S, p), f = 0.8 / Math.max(0.35, Math.max(...[...sq, [0, -1], [1, 0], [0, 1], [-1, 0]].map((z) => Math.hypot(...ap(A, z)))));
            s1.arrow(p[0], p[1], p[0] + f * w[0], p[1] + f * w[1], { color: 'orange', width: 2.2, head: 6 });
            s1.arrow(p[0] + f * w[0], p[1] + f * w[1], p[0] + f * (w[0] + q[0]), p[1] + f * (w[1] + q[1]), { color: 'blue', width: 2.2, head: 6 });
          }
          const es = v.M.eigSym(S);
          es.vecs.forEach((e, i) => {
            const lam = es.values[i], L = 1.7;
            s3.line(-L * e[0], -L * e[1], L * e[0], L * e[1], { color: 'green', width: 1.6, dash: [6, 4] });
            s3.text(`λ=${v.fix(lam, 2)}`, 1.25 * e[0] * 1.2, 1.25 * e[1] * 1.2, { size: 12, color: 'green', align: 'center', plate: true });
          });
          s2.text(`rotates by ${v.fix((Wm[1][0] * t * 180) / Math.PI, 1)}°`, 0, -1.7, { size: 12, color: 'orange', align: 'center' });
          const rec = [[A[0][0] - S[0][0] - Wm[0][0], A[0][1] - S[0][1] - Wm[0][1]], [A[1][0] - S[1][0] - Wm[1][0], A[1][1] - S[1][1] - Wm[1][1]]];
          info = { om: A[1][0] - A[0][1], div: A[0][0] + A[1][1], l: es.values, err: Math.max(...rec.flat().map(Math.abs)), area: EA[0][0] * EA[1][1] - EA[0][1] * EA[1][0] };
        });
        v.legend([['orange', 'spin velocity $W\\mathbf r$'], ['blue', 'strain velocity $S\\mathbf r$'], ['green', 'principal axes of $S$', { dash: true }]]);
        v.readout(() => `$\\omega=\\partial_xv-\\partial_yu=${v.fix(info.om, 3)}$ (spin rate $\\omega/2=${v.fix(info.om / 2, 3)}$) · strain eigenvalues $${v.fix(info.l[0], 3)},\\ ${v.fix(info.l[1], 3)}$, trace $${v.fix(info.l[0] + info.l[1], 3)}=\\nabla\\cdot\\mathbf u=${v.fix(info.div, 3)}$ · $|A-S-W|=${v.sci(info.err, 1)}$ · area of the square multiplied by $${v.fix(info.area, 3)}=e^{\\tau\\nabla\\cdot\\mathbf u}$`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Definition',
      name: 'Circulation',
      statement: String.raw`The **circulation** of a flow round a closed curve $C$ is the line integral of the velocity along it, $\Gamma_C=\oint_C\mathbf u\cdot d\mathbf l$ (counterclockwise for a plane curve). If $\mathbf u$ is continuously differentiable on a surface $\Sigma$ bounded by $C$, Stokes' theorem gives $\Gamma_C=\iint_\Sigma\boldsymbol\omega\cdot\mathbf n\,dS$: the circulation equals the flux of vorticity through any surface spanning the loop. In particular an irrotational region contributes nothing, and a loop's circulation depends only on the vorticity it encloses.`,
      idea: String.raw`Cut the surface into small loops. For each small loop the circulation is $\omega\,dS$ (1.9, curl as circulation density); the circulations of neighbouring cells cancel along shared edges, leaving the integral over the outer boundary. This is Stokes' theorem (pma-10.50, vcalc-3.7). It is why a vortex tube cannot end in the fluid, and it makes circulation the natural measure of the strength of a vortex.`,
      caption: String.raw`A background solid-body rotation plus two Gaussian vortices (drag their centres). Drag the six vertices of the loop. The circulation, computed by integrating the velocity round the polygon, equals the integral of the vorticity (colour) over its interior. A loop that encloses no vorticity has zero circulation even though the fluid circles inside it.`,
      deps: ['fluid-1.9', 'pma-10.50', 'vcalc-3.7'],
      refs: ['Kundu §5.2', 'Acheson ch. 1'],
      tags: ['circulation', 'Stokes'],
      viz(v) {
        const G1 = v.slider('vortex 1 strength $\\Gamma_1$', -5, 5, 3, { step: 0.1 });
        const G2 = v.slider('vortex 2 strength $\\Gamma_2$', -5, 5, -2, { step: 0.1 });
        const CORE = v.slider('core radius $a$', 0.1, 1, 0.35, { step: 0.01 });
        const W0 = v.slider('background rotation $\\omega_0$', -1, 1, 0.2, { step: 0.01 });
        const s = v.stage({ x: [-4, 4], y: [-2.7, 2.7], equal: true, axes: false, height: 400, full: true, title: 'vorticity (red $+$, blue $-$) and the loop' });
        const c1 = s.handle(-1.2, 0.2, { color: 'purple', label: '1', labelPos: 'ne' }), c2 = s.handle(2.0, -0.4, { color: 'teal', label: '2', labelPos: 'ne' });
        const V = [];
        for (let k = 0; k < 6; k++) V.push(s.handle(-1.2 + 1.5 * Math.cos((TAU * k) / 6 + 0.3), 0.2 + 1.2 * Math.sin((TAU * k) / 6 + 0.3), { color: 'green', r: 6 }));
        const om = (x, y) => {
          const a2 = CORE.value ** 2; let w = W0.value;
          w += (G1.value / (Math.PI * a2)) * Math.exp(-((x - c1.x) ** 2 + (y - c1.y) ** 2) / a2);
          w += (G2.value / (Math.PI * a2)) * Math.exp(-((x - c2.x) ** 2 + (y - c2.y) ** 2) / a2);
          return w;
        };
        const u = (x, y) => {
          let ux = -0.5 * W0.value * y, uy = 0.5 * W0.value * x;
          for (const [c, G] of [[c1, G1.value], [c2, G2.value]]) {
            const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy + 1e-12, k = (G / (TAU * r2)) * (1 - Math.exp(-r2 / CORE.value ** 2));
            ux += -k * dy; uy += k * dx;
          }
          return [ux, uy];
        };
        let info = {};
        v.render(() => {
          const P = V.map((h) => [h.x, h.y]);
          s.heat(om, { cmap: 'theme-diverging', neg: 'blue', pos: 'red', range: [-3, 3], res: 5, alpha: 0.9 });
          s.field(u, { spacing: 38, color: 'ink', alpha: 0.5, width: 1.2 });
          s.poly(P, { fill: 'green', fillAlpha: 0.12, color: 'green', width: 2.6 });
          // circulation: Simpson along each edge
          let circ = 0;
          for (let i = 0; i < P.length; i++) {
            const p = P[i], q = P[(i + 1) % P.length], n = 40, ex = q[0] - p[0], ey = q[1] - p[1];
            let acc = 0;
            for (let k = 0; k <= n; k++) { const w = k / n, f = u(p[0] + w * ex, p[1] + w * ey), g = f[0] * ex + f[1] * ey; acc += g * (k === 0 || k === n ? 1 : k % 2 ? 4 : 2); }
            circ += acc / (3 * n);
          }
          let area2 = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; area2 += p[0] * q[1] - q[0] * p[1]; }
          const sg = Math.sign(area2) || 1;
          // flux of vorticity: scan lines, exact crossings, Simpson along x
          let ymin = Infinity, ymax = -Infinity; for (const p of P) { ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); }
          const NR = 300, hy = (ymax - ymin) / NR; let flux = 0;
          for (let r = 0; r < NR; r++) {
            const y = ymin + (r + 0.5) * hy, xs = [];
            for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; if ((p[1] <= y) !== (q[1] <= y)) xs.push(p[0] + ((y - p[1]) / (q[1] - p[1])) * (q[0] - p[0])); }
            xs.sort((a, b) => a - b);
            for (let k = 0; k + 1 < xs.length; k += 2) {
              const n = 60, h = (xs[k + 1] - xs[k]) / n; let acc = 0;
              for (let m = 0; m <= n; m++) acc += om(xs[k] + m * h, y) * (m === 0 || m === n ? 1 : m % 2 ? 4 : 2);
              flux += (acc * h) / 3 * hy;
            }
          }
          info = { circ: sg * circ, flux, area: Math.abs(area2) / 2, mean: flux / (Math.abs(area2) / 2), sg };
        });
        v.readout(() => `Loop ${info.sg > 0 ? 'counterclockwise' : 'clockwise (reversed to counterclockwise)'}, area $${v.fix(info.area, 3)}$ · circulation $\\oint\\mathbf u\\cdot d\\mathbf l=${v.fix(info.circ, 4)}$ · vorticity flux $\\iint\\omega\\,dA=${v.fix(info.flux, 4)}$ · difference $${v.sci(info.circ - info.flux, 1)}$ · mean vorticity inside $${v.fix(info.mean, 3)}$`);
      },
    },
  ],
};
