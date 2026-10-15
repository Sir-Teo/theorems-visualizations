// Classical Mechanics — Chapter 3: Work and energy

// ---------- shared helpers ----------
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const bez3 = (P, t) => { const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t; return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]]; };
const bez2 = (P, t) => { const u = 1 - t; return [u * u * P[0][0] + 2 * u * t * P[1][0] + t * t * P[2][0], u * u * P[0][1] + 2 * u * t * P[1][1] + t * t * P[2][1]]; };
const sampleCurve = (f, n) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
/** Running work W_i = ∫F·dr and arc length S_i along a polyline (midpoint rule per chord, error O(1/n²)); d = per-chord F·Δr. */
function workAlong(F, pts) {
  const W = [0], S = [0], d = [];
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i], dx = q[0] - p[0], dy = q[1] - p[1], f = F((p[0] + q[0]) / 2, (p[1] + q[1]) / 2), dw = f[0] * dx + f[1] * dy;
    d.push(dw); W.push(W[i - 1] + dw); S.push(S[i - 1] + Math.hypot(dx, dy));
  }
  return { W, S, d };
}
/** Polyline whose chords are coloured by the sign of vals[i] (green +, red −). */
function signedPath(s, pts, vals, width = 3.4) {
  let run = [pts[0]], sg = Math.sign(vals[0]) || 1;
  for (let i = 0; i < vals.length; i++) {
    const g = Math.sign(vals[i]) || sg;
    if (g !== sg) { s.path(run, { color: sg > 0 ? 'green' : 'red', width }); run = [pts[i]]; sg = g; }
    run.push(pts[i + 1]);
  }
  s.path(run, { color: sg > 0 ? 'green' : 'red', width });
}
/** Translucent tint of a scalar field: one-signed (alpha ∝ (f−lo)/(hi−lo)) or signed (pos/neg colours). */
function tint(v, s, f, o) {
  const P = v.rgb(o.pos || 'accent'), N = v.rgb(o.neg || 'red'), A = o.alpha ?? 120, lo = o.lo, hi = o.hi;
  s.raster((x, y) => {
    const z = f(x, y); if (!isFinite(z)) return null;
    if (o.signed) { const t = clamp(z / hi, -1, 1), C = t >= 0 ? P : N; return [C[0], C[1], C[2], A * Math.abs(t)]; }
    const t = clamp((z - lo) / (hi - lo), 0, 1); return [P[0], P[1], P[2], A * t];
  }, { res: 3, key: o.key + '|' + P.join() + N.join(), id: o.id || 'tint' });
}
/** Arrow from (x,y) along vector (u,w)·k. */
const vec = (s, x, y, u, w, k, st) => s.arrow(x, y, x + u * k, y + w * k, st);
/** Classical RK4 step for an array state. */
function rk4step(f, t, y, h) {
  const k1 = f(t, y), y2 = y.map((v, i) => v + h / 2 * k1[i]), k2 = f(t + h / 2, y2), y3 = y.map((v, i) => v + h / 2 * k2[i]), k3 = f(t + h / 2, y3), y4 = y.map((v, i) => v + h * k3[i]), k4 = f(t + h, y4);
  return y.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
/** Stacked vertical bar: segments [[value, colour]] from y = 0 at x ∈ [x0, x1]; returns the top. */
function stack(s, x0, x1, segs) {
  let y = 0;
  for (const [h, c] of segs) { if (h > 0) s.rect(x0, y, x1, y + h, { fill: c, fillAlpha: 0.75, color: c, width: 1 }); y += Math.max(0, h); }
  return y;
}

export default {
  collection: 'mech',
  chapter: 3,
  title: 'Work and energy',
  summary: String.raw`Work is the line integral of force along a path, and the work–energy theorem turns Newton’s second law into a statement about kinetic energy. When the work does not depend on the path the force has a potential, the force is minus its gradient, and kinetic plus potential energy is conserved; the curl test decides which forces qualify — on a simply connected region, as the vortex on the punctured plane shows. In one dimension energy conservation solves the motion: the energy diagram shows the allowed region, the turning points and the equilibria, and a single integral gives the time. Escape velocity, the loop-the-loop and mechanical similarity are energy arguments with no differential equation solved.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1', kind: 'Definition', name: 'Work and kinetic energy',
      statement: String.raw`The **kinetic energy** of a particle of mass $m$ moving with velocity $\mathbf v$ is $T = \tfrac12 m|\mathbf v|^2$. The **work** done by a force field $\mathbf F$ on the particle while it moves along an oriented path $C$ from $\mathbf r_1$ to $\mathbf r_2$ is the line integral
$$W = \int_C \mathbf F\cdot d\mathbf r = \int_{t_1}^{t_2}\mathbf F(\mathbf r(t))\cdot\dot{\mathbf r}(t)\,dt .$$
It depends on the oriented curve but not on how it is parametrized; reversing the orientation changes its sign. The integrand $P = \mathbf F\cdot\dot{\mathbf r}$ is the **power** of the force: only the component of $\mathbf F$ along the motion contributes, a force perpendicular to the motion does no work, and moving against the force gives negative work.`,
      idea: String.raw`Work adds up $\mathbf F\cdot\Delta\mathbf r$ over small displacements; in the limit this is the line integral of the 1-form $F_x\,dx + F_y\,dy + F_z\,dz$ along $C$ (pma-10.48), and the change-of-variables formula makes it independent of the parametrization. Kinetic energy is singled out because its rate of change is exactly the power of the net force: $\tfrac{d}{dt}\tfrac12 m|\mathbf v|^2 = m\mathbf v\cdot\dot{\mathbf v} = \mathbf F\cdot\mathbf v$ by Newton’s second law (mech-1.6) — the work–energy theorem 3.2.`,
      caption: String.raw`Drag the endpoints $A$, $B$ and the two orange control points to reshape the path, and pick a force. The path is **green** where it runs with the force ($\mathbf F\cdot d\mathbf r>0$) and **red** where it runs against it; the right panel accumulates $W(s)$ along the arc. Slide the marker to see $\mathbf F$ and the direction of motion at one point.`,
      deps: ['mech-1.6', 'pma-10.48'],
      refs: ['Taylor §4.1'],
      tags: ['work', 'energy', 'line integral'],
      viz(v) {
        const FIELDS = {
          grav: { label: 'gravity $(0,-mg)$', F: () => [0, -1], U: (x, y) => y },
          spring: { label: 'spring $-k\\mathbf r$', F: (x, y) => [-0.6 * x, -0.6 * y], U: (x, y) => 0.3 * (x * x + y * y) },
          swirl: { label: 'swirl $(-y, x)$', F: (x, y) => [-0.6 * y, 0.6 * x], U: null },
        };
        const which = v.select('force', Object.entries(FIELDS).map(([value, f]) => ({ value, label: f.label })), 'grav');
        const tau = v.slider('marker along the path', 0, 1, 0.55, { step: 0.005 });
        const s = v.stage({ x: [-3, 3], y: [-2.1, 2.1], equal: true, height: 330, axes: false, weight: 1.35 });
        const g = v.stage({ x: [0, 6], y: [-3, 3], height: 330, axes: 'box', xlabel: 's', weight: 1, title: 'running work $W(s)$ against arc length $s$' });
        const H = [[-2.4, -1.3], [-1.3, 1.8], [1.0, -1.9], [2.4, 1.1]].map((p, i) => s.handle(p[0], p[1], { color: i % 3 ? 'orange' : 'accent', r: i % 3 ? 6 : 8, label: i === 0 ? 'A' : i === 3 ? 'B' : undefined, labelPos: i === 0 ? 'sw' : 'ne' }));
        let R = null;
        v.render(() => {
          const f = FIELDS[which.value], P = H.map((h) => [h.x, h.y]), pts = sampleCurve((t) => bez3(P, t), 400);
          R = { ...workAlong(f.F, pts), f, pts };
          s.field(f.F, { spacing: 38, color: 'muted', alpha: 0.5 });
          s.path(P, { color: 'faint', dash: [3, 4], width: 1 });
          signedPath(s, pts, R.d);
          const i = Math.round(tau.value * 400), p = pts[i], j = Math.min(399, i), tx = pts[j + 1][0] - pts[j][0], ty = pts[j + 1][1] - pts[j][1], tl = Math.hypot(tx, ty) || 1;
          const F = f.F(p[0], p[1]);
          vec(s, p[0], p[1], F[0], F[1], 0.75, { color: 'purple', width: 2.4 });
          vec(s, p[0], p[1], tx / tl, ty / tl, 0.6, { color: 'ink', width: 1.6, dash: [4, 3] });
          s.dot(p[0], p[1], { color: 'gold', r: 6 });
          if (Math.hypot(...F) > 0.3) s.tex('\\mathbf F', p[0] + F[0] * 0.75, p[1] + F[1] * 0.75, { color: 'purple', dx: 8, dy: -6 });
          // running work
          const S = R.S[400], lo = Math.min(0, ...R.W), hi = Math.max(0, ...R.W), pad = 0.12 * (hi - lo || 1);
          g.setView([0, S * 1.02], [lo - pad, hi + pad]);
          g.hline(0, { color: 'faint', width: 1 });
          const curve = R.S.map((x, k) => [x, R.W[k]]);
          g.path(curve, { color: 'accent', width: 2.4 });
          g.dot(R.S[i], R.W[i], { color: 'gold', r: 5 });
          if (f.U) { const dU = f.U(P[0][0], P[0][1]) - f.U(P[3][0], P[3][1]); g.hline(dU, { color: 'green', dash: [5, 4], width: 1.2 }); g.text('U(A) − U(B)', S * 0.98, dU, { color: 'green', size: 11, align: 'right', dy: -9 }); }
        });
        v.legend([['green', 'with the force: $\\mathbf F\\cdot d\\mathbf r>0$'], ['red', 'against it'], ['purple', 'force $\\mathbf F$'], ['accent', 'running work $W(s)$']]);
        v.readout(() => {
          if (!R) return '';
          const i = Math.round(tau.value * 400), U = R.f.U, P = H.map((h) => [h.x, h.y]);
          const tail = U ? ` · $U(A)-U(B) = ${v.fix(U(P[0][0], P[0][1]) - U(P[3][0], P[3][1]), 4)}$ — the same number for every path (a conservative force)` : ' · reshape the path: the total changes (not conservative, see 3.3)';
          return `$W = \\int_A^B \\mathbf F\\cdot d\\mathbf r = ${v.fix(R.W[400], 4)}$ over length $${v.fix(R.S[400], 3)}$ · up to the marker $${v.fix(R.W[i], 4)}$${tail}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2', kind: 'Theorem', name: 'Work–energy theorem',
      statement: String.raw`Let a particle of mass $m$ move under a net force $\mathbf F_{\text{net}} = \mathbf F_1 + \dots + \mathbf F_k$ (each force may depend on position, velocity and time). Then along the actual motion from time $t_1$ to $t_2$,
$$T(t_2) - T(t_1) = \sum_{j=1}^k \int_{t_1}^{t_2}\mathbf F_j\cdot\mathbf v\,dt = W_{\text{net}} :$$
the change in kinetic energy equals the total work done by all the forces. Constraint forces perpendicular to the velocity (a normal force on a frictionless surface, the magnetic force) do no work.`,
      idea: String.raw`Differentiate: $\tfrac{d}{dt}\big(\tfrac12 m\,\mathbf v\cdot\mathbf v\big) = m\,\dot{\mathbf v}\cdot\mathbf v = \mathbf F_{\text{net}}\cdot\mathbf v$ by Newton’s second law, and integrate from $t_1$ to $t_2$ with the fundamental theorem of calculus (pma-6.21). The left side is the power of the net force, so its integral is the work of the net force (3.1). Nothing is assumed about the forces — they can be time-dependent or dissipative — but it is the *net* work that counts: leaving out one force breaks the balance.`,
      caption: String.raw`A puck is shoved by a time-varying push (orange), held by a spring (purple) and slowed by friction (red). Middle: the change in kinetic energy (gold) and the total work of all three forces (dashed) lie on top of each other at every instant. Right: the individual works at time $t$ — the push alone overshoots. Change the push, the mass or switch friction off.`,
      deps: ['mech-3.1', 'pma-6.21', 'mech-1.6'],
      refs: ['Taylor §4.1'],
      tags: ['work', 'energy'],
      viz(v) {
        const A = v.slider('push strength', 0, 3, 1.6, { step: 0.05 });
        const m = v.slider('mass $m$', 0.5, 3, 1, { step: 0.1 });
        const fr = v.toggle('friction $-\\gamma\\mathbf v$', true);
        const s = v.stage({ x: [-2.6, 2.6], y: [-2.1, 2.1], equal: true, height: 320, axes: false, weight: 1 });
        const g = v.stage({ x: [0, 12], y: [-1, 4], height: 320, axes: 'box', xlabel: 't', weight: 1.1, title: 'change in kinetic energy vs total work' });
        const wb = v.stage({ x: [0, 5], y: [-1, 1], height: 320, axes: false, weight: 0.75, title: 'works at time $t$' });
        const TEND = 12, N = 2400, dt = TEND / N, k = 2.5, gam = 0.35;
        let sim = null, key = '', cur = 0;
        const push = (t, a) => [a * Math.cos(0.9 * t), a * Math.sin(0.55 * t + 1)];
        const solve = () => {
          const a = A.value, M = m.value, gm = fr.value ? gam : 0;
          const f = (t, S) => { const P = push(t, a), Fs = [-k * S[0], -k * S[1]], Ff = [-gm * S[2], -gm * S[3]]; return [S[2], S[3], (P[0] + Fs[0] + Ff[0]) / M, (P[1] + Fs[1] + Ff[1]) / M, P[0] * S[2] + P[1] * S[3], Fs[0] * S[2] + Fs[1] * S[3], Ff[0] * S[2] + Ff[1] * S[3]]; };
          let y = [-1, 0, 0, 1.2, 0, 0, 0]; const out = [y];
          for (let i = 0; i < N; i++) { y = rk4step(f, i * dt, y, dt); out.push(y); }
          const T0 = 0.5 * M * (out[0][2] ** 2 + out[0][3] ** 2), dT = out.map((S) => 0.5 * M * (S[2] * S[2] + S[3] * S[3]) - T0);
          let R = 0.5, lo = 0, hi = 0, wm = 0.1;
          out.forEach((S, j) => { R = Math.max(R, Math.abs(S[0]), Math.abs(S[1])); lo = Math.min(lo, dT[j]); hi = Math.max(hi, dT[j]); wm = Math.max(wm, Math.abs(S[4]), Math.abs(S[5]), Math.abs(S[6]), Math.abs(dT[j])); });
          return { out, dT, M, a, gm, R: R * 1.15, lo, hi, wm };
        };
        v.animate((t) => {
          const kk = `${A.value}|${m.value}|${fr.value}`; if (kk !== key) { key = kk; sim = solve(); }
          const i = Math.min(N, Math.floor(t / dt)); cur = i;
          const { out, dT } = sim, S = out[i], R = sim.R, sc = 0.25 * R;
          s.setView([-R * 1.25, R * 1.25], [-R, R]);
          s.path(out.map((q) => [q[0], q[1]]), { color: 'faint', width: 1 });
          s.path(out.slice(0, i + 1).map((q) => [q[0], q[1]]), { color: 'accent', width: 2 });
          s.line(0, 0, S[0], S[1], { color: 'purple', width: 1.2, dash: [3, 3] }); s.dot(0, 0, { color: 'purple', r: 3 });
          const P = push(t, sim.a), Fs = [-k * S[0], -k * S[1]], fmax = Math.max(sim.a, k * R, 0.5);
          vec(s, S[0], S[1], P[0], P[1], 1.2 * sc / fmax * 2, { color: 'orange', width: 2.4 });
          vec(s, S[0], S[1], Fs[0], Fs[1], 1.2 * sc / fmax * 2, { color: 'purple', width: 2 });
          if (sim.gm) vec(s, S[0], S[1], -sim.gm * S[2], -sim.gm * S[3], 1.2 * sc / fmax * 2, { color: 'red', width: 2 });
          vec(s, S[0], S[1], S[2], S[3], sc * 0.6, { color: 'ink', width: 1.4, dash: [4, 3] });
          s.dot(S[0], S[1], { color: 'gold', r: 6 + 2 * Math.sqrt(sim.M) });
          // ΔT and W_net over time
          const pad = 0.1 * (sim.hi - sim.lo || 1); g.setView([0, TEND], [sim.lo - pad, sim.hi + pad]);
          g.hline(0, { color: 'faint', width: 1 });
          g.path(dT.map((z, j) => [j * dt, z]), { color: 'gold', width: 1, alpha: 0.35 });
          g.path(dT.slice(0, i + 1).map((z, j) => [j * dt, z]), { color: 'gold', width: 6, alpha: 0.8 });
          g.path(out.slice(0, i + 1).map((q, j) => [j * dt, q[4] + q[5] + q[6]]), { color: 'accent', width: 1.8, dash: [6, 4] });
          g.vline(t, { color: 'faint', width: 1 });
          g.dot(t, dT[i], { color: 'gold', r: 4 });
          // bars of the individual works
          const top = sim.wm * 1.15; wb.setView([0, 5], [-top, top]); wb.hline(0, { color: 'muted', width: 1 });
          const bars = [[S[4], 'orange', 'push'], [S[5], 'purple', 'spring'], [S[6], 'red', 'friction'], [S[4] + S[5] + S[6], 'accent', 'sum'], [dT[i], 'gold', 'ΔT']];
          bars.forEach(([val, col, lab], j) => { wb.rect(0.15 + j, 0, 0.85 + j, val, { fill: col, fillAlpha: 0.7, color: col }); wb.text(lab, 0.5 + j, val >= 0 ? -0.06 * top : 0.06 * top, { color: col, size: 11, align: 'center', baseline: val >= 0 ? 'top' : 'bottom' }); });
        }, { period: TEND });
        v.legend([['gold', '$\\Delta T = T(t) - T(0)$'], ['accent', 'total work $W_{\\text{push}} + W_{\\text{spring}} + W_{\\text{fric}}$', { dash: true }], ['orange', 'push'], ['purple', 'spring'], ['red', 'friction'], ['ink', 'velocity', { dash: true }]]);
        v.readout(() => {
          if (!sim) return '';
          const S = sim.out[cur], Wn = S[4] + S[5] + S[6];
          return `$t = ${v.fix(cur * dt, 2)}$ · $\\Delta T = ${v.fix(sim.dT[cur], 5)}$ · $W_{\\text{push}} + W_{\\text{spring}} + W_{\\text{fric}} = ${v.fix(S[4], 3)} + (${v.fix(S[5], 3)}) + (${v.fix(S[6], 3)}) = ${v.fix(Wn, 5)}$ · difference $${v.sci(Math.abs(Wn - sim.dT[cur]) + 1e-16, 1)}$ (RK4) · the push alone would predict $${v.fix(S[4], 3)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3', kind: 'Definition', name: 'Conservative force and potential energy',
      statement: String.raw`A force field $\mathbf F$ on a region $\Omega$ is **conservative** if the work $\int_C\mathbf F\cdot d\mathbf r$ along any path $C$ in $\Omega$ depends only on the endpoints of $C$ — equivalently, if the work around every closed path is zero. Then, fixing a reference point $\mathbf r_0$, the **potential energy**
$$U(\mathbf r) = -\int_{\mathbf r_0}^{\mathbf r}\mathbf F\cdot d\mathbf r$$
is well defined, and the work along any path from $\mathbf r_1$ to $\mathbf r_2$ is $W = U(\mathbf r_1) - U(\mathbf r_2)$. $U$ is determined up to an additive constant. Uniform gravity ($U = mgy$), springs ($U = \tfrac12 k|\mathbf r|^2$) and inverse-square forces are conservative; friction, drag and swirling fields are not.`,
      idea: String.raw`The two definitions agree because a closed loop is a path from $\mathbf r_1$ to $\mathbf r_2$ followed by another path back, and reversing a path negates its work (3.1): equal works along the two paths ⇔ zero work around the loop. Path independence is exactly what makes the integral defining $U$ unambiguous, and splitting a path at $\mathbf r_0$ gives $W = U(\mathbf r_1) - U(\mathbf r_2)$. For a swirling field the loop work is the circulation, which Green’s theorem equates with the integrated curl — the test of 3.5.`,
      caption: String.raw`Two paths join $A$ to $B$; drag the endpoints or the control points. For gravity and the spring the two works agree to every digit; for the swirl and the shear they differ, and the difference is the work around the closed loop (shaded), equal to the curl times the signed area enclosed.`,
      deps: ['mech-3.1'],
      refs: ['Taylor §4.2'],
      tags: ['energy', 'potential', 'conservative force'],
      viz(v) {
        const FIELDS = {
          grav: { label: 'gravity', F: () => [0, -1], U: (x, y) => y, lo: -2, hi: 2, curl: 0 },
          spring: { label: 'spring', F: (x, y) => [-0.6 * x, -0.6 * y], U: (x, y) => 0.3 * (x * x + y * y), lo: 0, hi: 3.2, curl: 0 },
          swirl: { label: 'swirl', F: (x, y) => [-0.6 * y, 0.6 * x], U: null, curl: 1.2 },
          shear: { label: 'shear', F: (x, y) => [0.7 * y, 0], U: null, curl: -0.7 },
        };
        const which = v.select('force', Object.entries(FIELDS).map(([value, f]) => ({ value, label: f.label })), 'grav');
        const s = v.stage({ x: [-3, 3], y: [-2.1, 2.1], equal: true, height: 330, axes: false, weight: 1.5 });
        const b = v.stage({ x: [0, 3], y: [-3, 3], height: 330, axes: false, weight: 0.6, title: 'work along each path' });
        const A = s.handle(-2.2, -0.8, { color: 'ink', label: 'A', labelPos: 'w' }), B = s.handle(1.7, 0.9, { color: 'ink', label: 'B', labelPos: 'e' });
        const Q1 = s.handle(-0.5, 2.0, { color: 'accent', r: 6 }), Q2 = s.handle(0.4, -2.0, { color: 'orange', r: 6 });
        let R = null;
        v.render(() => {
          const f = FIELDS[which.value], a = [A.x, A.y], bb = [B.x, B.y];
          const p1 = sampleCurve((t) => bez2([a, [Q1.x, Q1.y], bb], t), 300), p2 = sampleCurve((t) => bez2([a, [Q2.x, Q2.y], bb], t), 300);
          const w1 = workAlong(f.F, p1).W[300], w2 = workAlong(f.F, p2).W[300];
          const loop = p1.concat(p2.slice().reverse());
          let area = 0; for (let i = 0; i < loop.length; i++) { const p = loop[i], q = loop[(i + 1) % loop.length]; area += (p[0] * q[1] - q[0] * p[1]) / 2; }
          R = { w1, w2, area, f, a, bb };
          if (f.U) tint(v, s, f.U, { lo: f.lo, hi: f.hi, key: which.value, alpha: 95 });
          s.field(f.F, { spacing: 40, color: 'muted', alpha: 0.5 });
          s.poly(loop, { fill: 'gold', fillAlpha: f.U ? 0.06 : 0.16, stroke: false });
          s.path([a, [Q1.x, Q1.y], bb], { color: 'faint', dash: [3, 4], width: 1 }); s.path([a, [Q2.x, Q2.y], bb], { color: 'faint', dash: [3, 4], width: 1 });
          s.path(p1, { color: 'accent', width: 3 }); s.path(p2, { color: 'orange', width: 3 });
          for (const [p, c] of [[p1, 'accent'], [p2, 'orange']]) { const q = p[150], r = p[156]; s.arrow(q[0], q[1], r[0], r[1], { color: c, width: 3, head: 11 }); }
          // bars
          const top = Math.max(0.4, Math.abs(w1), Math.abs(w2)) * 1.25; b.setView([0, 3], [-top, top]);
          b.hline(0, { color: 'muted', width: 1 });
          b.rect(0.35, 0, 1.25, w1, { fill: 'accent', fillAlpha: 0.7, color: 'accent' }); b.rect(1.75, 0, 2.65, w2, { fill: 'orange', fillAlpha: 0.7, color: 'orange' });
          b.tex('W_1', 0.8, w1, { color: 'accent', baseline: w1 >= 0 ? 'bottom' : 'top', align: 'center', dy: w1 >= 0 ? -4 : 4 });
          b.tex('W_2', 2.2, w2, { color: 'orange', baseline: w2 >= 0 ? 'bottom' : 'top', align: 'center', dy: w2 >= 0 ? -4 : 4 });
          if (f.U) { const d = f.U(a[0], a[1]) - f.U(bb[0], bb[1]); b.hline(d, { color: 'green', dash: [5, 4], width: 1.4 }); }
        });
        v.legend([['accent', 'path 1'], ['orange', 'path 2'], ['gold', 'closed loop path 1 − path 2', { area: true }], ['green', '$U(A) - U(B)$', { dash: true }], ['accent', 'potential $U$ (gravity, spring)', { area: true }]]);
        v.readout(() => {
          if (!R) return '';
          const { w1, w2, area, f, a, bb } = R, d = w1 - w2;
          const tail = f.U ? `$U(A) - U(B) = ${v.fix(f.U(a[0], a[1]) - f.U(bb[0], bb[1]), 4)}$ — **path-independent**, a potential exists`
            : `curl $\\times$ signed area $= ${v.fix(f.curl, 2)} \\times ${v.fix(area, 4)} = ${v.fix(f.curl * area, 4)}$ (Green) — **path-dependent**, no potential`;
          return `$W_1 = ${v.fix(w1, 4)}$, $W_2 = ${v.fix(w2, 4)}$ · loop work $W_1 - W_2 = \\oint \\mathbf F\\cdot d\\mathbf r = ${v.fix(Math.abs(d) < 5e-9 ? 0 : d, 4)}$ · ${tail}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4', kind: 'Theorem', name: 'Force is the negative gradient of the potential',
      statement: String.raw`If $\mathbf F$ is conservative on an open set with a continuously differentiable potential energy $U$, then
$$\mathbf F = -\nabla U = -\Big(\frac{\partial U}{\partial x}, \frac{\partial U}{\partial y}, \frac{\partial U}{\partial z}\Big).$$
In particular, the component of the force in any unit direction $\hat{\mathbf s}$ is minus the directional derivative, $\mathbf F\cdot\hat{\mathbf s} = -\,dU/ds$; the force is perpendicular to the equipotential surfaces $U = $ const, points toward lower $U$, and has magnitude $|\nabla U|$, large where the equipotentials crowd together. Conversely, every force of the form $-\nabla U$ is conservative.`,
      idea: String.raw`For a small step $d\mathbf r$, the definition of $U$ (3.3) gives $dU = -\mathbf F\cdot d\mathbf r$. On the other hand $dU = \nabla U\cdot d\mathbf r$ because the differential of $U$ is given by its partial derivatives (pma-9.17). Since this holds for every direction of $d\mathbf r$, $\mathbf F = -\nabla U$. Along an equipotential $dU = 0$, so $\mathbf F\cdot d\mathbf r = 0$: the force is normal to it. For the converse, the work of $-\nabla U$ along a path is $-\int dU = U(\mathbf r_1) - U(\mathbf r_2)$ by the chain rule and the fundamental theorem of calculus.`,
      caption: String.raw`Drag the probe $p$ over the contour map of $U$ and turn the direction handle. The force (computed from the force law, not from $U$) is always perpendicular to the contour through $p$ and longest where contours crowd. Right: the profile of $U$ along the chosen direction — its slope at $p$ is $-\mathbf F\cdot\hat{\mathbf s}$.`,
      deps: ['mech-3.3', 'pma-9.17'],
      refs: ['Taylor §4.3'],
      tags: ['potential', 'gradient'],
      viz(v) {
        const gs = (x, y, G) => { let u = 0, fx = 0, fy = 0; for (const [a, cx, cy, w] of G) { const dx = x - cx, dy = y - cy, e = a * Math.exp(-(dx * dx + dy * dy) / w); u += e; fx += 2 * dx / w * e; fy += 2 * dy / w * e; } return [u, fx, fy]; };
        const HILLS = [[1.4, -1.1, 0.5, 0.9], [1.0, 1.2, -0.5, 0.6], [-1.3, 0.3, -0.9, 1.4], [0.6, 1.9, 1.3, 0.7]];
        const softR = (x, y, cx, cy) => Math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + 0.12);
        const POTS = {
          hills: { label: 'hills and a basin', U: (x, y) => gs(x, y, HILLS)[0], F: (x, y) => { const r = gs(x, y, HILLS); return [r[1], r[2]]; } },
          bowl: { label: 'tilted bowl', U: (x, y) => 0.2 * x * x + 0.7 * y * y + 0.25 * x * y - 0.3 * x, F: (x, y) => [-(0.4 * x + 0.25 * y - 0.3), -(1.4 * y + 0.25 * x)] },
          stars: { label: 'two masses', U: (x, y) => -1 / softR(x, y, 1.1, 0) - 0.6 / softR(x, y, -1.3, 0.4), F: (x, y) => { const r1 = softR(x, y, 1.1, 0), r2 = softR(x, y, -1.3, 0.4); return [-(x - 1.1) / r1 ** 3 - 0.6 * (x + 1.3) / r2 ** 3, -y / r1 ** 3 - 0.6 * (y - 0.4) / r2 ** 3]; } },
        };
        const which = v.select('potential', Object.entries(POTS).map(([value, p]) => ({ value, label: p.label })), 'hills');
        const s = v.stage({ x: [-3, 3], y: [-2.1, 2.1], equal: true, height: 340, axes: false, weight: 1.45 });
        const c = v.stage({ x: [-1.6, 1.6], y: [-1, 1], height: 340, axes: 'box', xlabel: 's', weight: 0.85, title: 'profile $U(p + s\\hat{\\mathbf s})$' });
        const cur = () => POTS[which.value];
        const F = v.fields(s, { F: (x, y) => cur().F(x, y), phi: (x, y) => cur().U(x, y), lines: false, equipotentials: true });
        const p = s.handle(-0.4, -0.7, { color: 'gold', label: 'p', labelPos: 'sw' });
        const d = s.handle(0.4, -0.2, { color: 'orange', r: 5, label: 'ŝ', labelPos: 'e' });
        let last = [p.x, p.y]; p.onDrag = () => { d.x += p.x - last[0]; d.y += p.y - last[1]; last = [p.x, p.y]; };
        const levels = {};
        const levelsFor = (k) => {
          if (levels[k]) return levels[k];
          const U = POTS[k].U, z = []; for (let i = 0; i <= 40; i++) for (let j = 0; j <= 28; j++) z.push(U(-3 + 6 * i / 40, -2.1 + 4.2 * j / 28));
          z.sort((a, b) => a - b); const lo = z[Math.floor(z.length * 0.02)], hi = z[Math.floor(z.length * 0.98)];
          return (levels[k] = { lo, hi, lv: Array.from({ length: 15 }, (_, i) => lo + (hi - lo) * (i + 0.5) / 15) });
        };
        let R = null;
        v.render(() => {
          last = [p.x, p.y];
          const P = cur(), L = levelsFor(which.value);
          tint(v, s, P.U, { lo: L.lo, hi: L.hi, key: which.value, alpha: 110, pos: 'teal' });
          F.draw({ equipotentials: { levels: L.lv, color: 'ink', alpha: 0.45, width: 1 } });
          let ux = d.x - p.x, uy = d.y - p.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
          const f = P.F(p.x, p.y), fm = Math.hypot(...f), k = 0.9 / Math.max(fm, 0.6);
          // tangent of the contour through p, from the numerical gradient of U (independent of the force law)
          const e = 1e-4, gx = (P.U(p.x + e, p.y) - P.U(p.x - e, p.y)) / (2 * e), gy = (P.U(p.x, p.y + e) - P.U(p.x, p.y - e)) / (2 * e), gm = Math.hypot(gx, gy) || 1;
          const tx = -gy / gm, ty = gx / gm;
          s.line(p.x - 0.9 * tx, p.y - 0.9 * ty, p.x + 0.9 * tx, p.y + 0.9 * ty, { color: 'ink', dash: [5, 4], width: 1.3 });
          const nx = -gx / gm, ny = -gy / gm, q = 0.16;
          s.path([[p.x + q * tx, p.y + q * ty], [p.x + q * tx + q * nx, p.y + q * ty + q * ny], [p.x + q * nx, p.y + q * ny]], { color: 'ink', width: 1.2 });
          s.line(p.x - 1.6 * ux, p.y - 1.6 * uy, p.x + 1.6 * ux, p.y + 1.6 * uy, { color: 'orange', width: 1, alpha: 0.6 });
          vec(s, p.x, p.y, f[0], f[1], k, { color: 'green', width: 3 });
          s.tex('\\mathbf F', p.x + f[0] * k, p.y + f[1] * k, { color: 'green', dx: 8, dy: -8 });
          // profile
          const h = 1e-4, Ud = (sg) => P.U(p.x + sg * ux, p.y + sg * uy), U0 = Ud(0), dUds = (Ud(h) - Ud(-h)) / (2 * h), Fs = f[0] * ux + f[1] * uy;
          let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 80; i++) { const z = Ud(-1.6 + 3.2 * i / 80); lo = Math.min(lo, z); hi = Math.max(hi, z); }
          const pad = 0.1 * (hi - lo || 1); c.setView([-1.6, 1.6], [lo - pad, hi + pad]);
          c.fn(Ud, { color: 'teal', width: 2.4 });
          c.fn((sg) => U0 - Fs * sg, { color: 'green', dash: [6, 4], width: 1.5, domain: [-0.7, 0.7] });
          c.dot(0, U0, { color: 'gold', r: 5 });
          R = { f, fm, Fs, dUds, gm, ang: Math.acos(clamp((f[0] * tx + f[1] * ty) / (fm || 1), -1, 1)) };
        });
        v.legend([['teal', 'potential $U$ (darker = higher)', { area: true }], ['ink', 'equipotentials'], ['green', '$\\mathbf F$ and the tangent of slope $-\\mathbf F\\cdot\\hat{\\mathbf s}$'], ['orange', 'direction $\\hat{\\mathbf s}$']]);
        v.readout(() => R ? `$|\\mathbf F| = ${v.fix(R.fm, 4)}$ vs $|\\nabla U| = ${v.fix(R.gm, 4)}$ · angle between $\\mathbf F$ and the contour $= ${v.fix(R.ang * 180 / Math.PI, 2)}^\\circ$ · $\\mathbf F\\cdot\\hat{\\mathbf s} = ${v.fix(R.Fs, 5)}$ vs $-dU/ds = ${v.fix(-R.dUds, 5)}$ (finite difference of $U$)` : '');
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5', kind: 'Theorem', name: 'Curl test for conservative forces',
      statement: String.raw`Let $\mathbf F$ be a continuously differentiable force field on an open set $\Omega\subset\R^3$ (or $\R^2$).
(a) If $\mathbf F$ is conservative, then $\nabla\times\mathbf F = \mathbf 0$ on $\Omega$.
(b) Conversely, if $\nabla\times\mathbf F = \mathbf 0$ and $\Omega$ is **simply connected** (for example convex, or all of space), then $\mathbf F$ is conservative.
The hypothesis in (b) cannot be dropped: on the punctured plane the vortex field $\mathbf F = (-y, x)/(x^2+y^2)$ has zero curl everywhere, yet its work around any loop encircling the origin once counter-clockwise is $2\pi$.`,
      idea: String.raw`(a) If $\mathbf F = -\nabla U$ then $\nabla\times\mathbf F = -\nabla\times\nabla U = 0$ because mixed partials commute (pma-10.43). (b) By Stokes’ (in the plane, Green’s) theorem the work around a loop equals the flux of the curl through a surface spanning it, which is zero; simple connectivity is what guarantees such a surface exists inside $\Omega$ — on a convex set this is the Poincaré lemma (pma-10.39). On the punctured plane a loop around the hole spans no surface in $\Omega$, and the vortex hides all its circulation in the missing point.`,
      caption: String.raw`Drag the loop (centre and rim). **Smooth swirl**: dial the swirl strength $c$; the tint is the curl, and the circulation always equals the curl integrated over the disc (lower panel: both as functions of the radius). **Point vortex**: the curl is $0$ wherever the field is defined, yet a loop around the hole picks up $2\pi$ no matter how small.`,
      deps: ['mech-3.4', 'pma-10.43', 'pma-10.39'],
      refs: ['Taylor §4.4', 'Arnold §6'],
      tags: ['curl', 'conservative force', 'topology'],
      viz(v) {
        const mode = v.select('field', [{ value: 'smooth', label: 'smooth swirl (curl dial)' }, { value: 'vortex', label: 'point vortex on $\\R^2\\setminus\\{0\\}$' }], 'smooth');
        const cS = v.slider('swirl strength $c$', -1.5, 1.5, 1, { step: 0.05 });
        const grad = (x, y) => [0.16 * x + 0.1 * y, 0.1 * x - 0.12 * y]; // ∇φ, φ = .08x² + .1xy − .06y²
        const Fld = (x, y) => {
          const g = grad(x, y), r2 = x * x + y * y;
          if (mode.value === 'vortex') return [g[0] - y / r2, g[1] + x / r2];
          const c = cS.value / (1 + r2); return [g[0] - c * y, g[1] + c * x];
        };
        const curl = (x, y) => (mode.value === 'vortex' ? 0 : 2 * cS.value / (1 + x * x + y * y) ** 2);
        const s = v.stage({ x: [-3, 3], y: [-2.1, 2.1], equal: true, height: 340, axes: false, full: true });
        const g = v.stage({ x: [0, 2.5], y: [-1, 7], height: 190, axes: 'box', xlabel: 'ρ', full: true, title: 'both integrals for circles of radius $\\rho$ about the loop’s centre' });
        const K = v.fields(s, { F: Fld, lines: false, loop: { type: 'circle', x: 0.75, y: 0.35, r: 1.15, handleAngle: 0.6 }, loopArrows: 'tangent' });
        const circ = (a, b, r) => { let sum = 0; const n = mode.value === 'vortex' && Math.abs(Math.hypot(a, b) - r) < 0.2 ? 4096 : 256; for (let k = 0; k < n; k++) { const t = 2 * Math.PI * k / n, c = Math.cos(t), sn = Math.sin(t), f = Fld(a + r * c, b + r * sn); sum += (-f[0] * sn + f[1] * c) * r; } return sum * 2 * Math.PI / n; };
        const curlInt = (a, b, r, nr = 40, nt = 48) => { if (mode.value === 'vortex') return 0; let sum = 0; for (let i = 0; i < nr; i++) { const rr = r * (i + 0.5) / nr; for (let k = 0; k < nt; k++) { const t = 2 * Math.PI * k / nt; sum += curl(a + rr * Math.cos(t), b + rr * Math.sin(t)) * rr; } } return sum * (r / nr) * (2 * Math.PI / nt); };
        let R = null;
        v.render(() => {
          cS.el.hidden = mode.value === 'vortex';
          if (mode.value === 'smooth') tint(v, s, curl, { signed: true, hi: 2.2, key: 'c' + cS.value, alpha: 175, pos: 'accent', neg: 'red' });
          s.field((x, y) => { const f = Fld(x, y), m = Math.hypot(...f); return m > 1.4 ? [f[0] * 1.4 / m, f[1] * 1.4 / m] : f; }, { spacing: 32, color: 'muted', alpha: 0.6 });
          K.draw();
          if (mode.value === 'vortex') { s.dot(0, 0, { color: 'red', r: 6, hollow: true }); s.text('hole: field undefined', 0, -0.3, { color: 'red', size: 11, align: 'center' }); }
          const L = K.loop, a = L.x, b = L.y, r = L.r;
          const rs = Array.from({ length: 60 }, (_, i) => 0.03 + 2.47 * i / 59), G = rs.map((q) => circ(a, b, q)), C = rs.map((q) => curlInt(a, b, q));
          const lo = Math.min(-0.5, ...G, ...C), hi = Math.max(0.5, ...G, ...C); g.setView([0, 2.5], [lo - 0.1 * (hi - lo), hi + 0.15 * (hi - lo)]);
          g.hline(0, { color: 'faint', width: 1 });
          g.path(rs.map((q, i) => [q, C[i]]), { color: 'accent', width: 4, alpha: 0.5 });
          g.path(rs.map((q, i) => [q, G[i]]), { color: 'green', width: 1.8, dash: [6, 3] });
          const dO = Math.hypot(a, b); if (mode.value === 'vortex' && dO < 2.5) g.vline(dO, { color: 'red', dash: [3, 3], width: 1 });
          g.vline(r, { color: 'gold', width: 1.2 });
          R = { circ: K.circulation(), ci: curlInt(a, b, r, 160, 128), inside: Math.hypot(a, b) < r };
        });
        v.legend([['green', 'circulation $\\oint\\mathbf F\\cdot d\\mathbf r$', { dash: true }], ['accent', 'curl integral $\\iint(\\nabla\\times\\mathbf F)\\,dA$'], ['gold', 'current loop radius'], ['red', 'radius reaching the hole', { dash: true }]]);
        v.readout(() => {
          if (!R) return '';
          const z = (x) => (Math.abs(x) < 5e-9 ? 0 : x);
          const base = `$\\oint_C\\mathbf F\\cdot d\\mathbf r = ${v.fix(z(R.circ), 4)}$ · $\\iint_D (\\nabla\\times\\mathbf F)_z\\,dA = ${v.fix(z(R.ci), 4)}$`;
          if (mode.value === 'smooth') return `${base} · ${Math.abs(cS.value) < 1e-9 ? 'curl $\\equiv 0$: every loop gives $0$ — conservative' : 'Green: the two agree; curl $\\ne 0$ — not conservative'}`;
          return `${base} · ${R.inside ? `loop encloses the hole: $2\\pi = ${v.fix(2 * Math.PI, 4)}$ although the curl vanishes on $\\R^2\\setminus\\{0\\}$ — **not conservative**; the curl test needs a simply connected domain` : 'loop misses the hole: it bounds a disc inside the domain, so the work is $0$'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6', kind: 'Theorem', name: 'Conservation of mechanical energy',
      statement: String.raw`If every force that does work on a particle is conservative, with total potential energy $U$, and any other forces (normal forces of fixed frictionless surfaces, tension in an inextensible string fixed at one end) are perpendicular to the velocity, then the **mechanical energy**
$$E = T + U = \tfrac12 m|\mathbf v|^2 + U(\mathbf r)$$
is constant along the motion. If in addition non-conservative forces act, $\Delta E$ equals their work; friction and drag make it negative, and the lost mechanical energy appears as heat.`,
      idea: String.raw`By the work–energy theorem (3.2), $\Delta T$ is the total work. Forces perpendicular to $\mathbf v$ contribute nothing, and a conservative force contributes $U(\mathbf r_1) - U(\mathbf r_2) = -\Delta U$ (3.3). Hence $\Delta T = -\Delta U$, i.e. $\Delta(T + U) = 0$. A dissipative force adds its own (negative) work: $\Delta(T + U) = W_{\text{fric}}$.`,
      caption: String.raw`Shape the track by dragging the five orange knots, and drag the gold bead to its release point. The bars show kinetic, potential and total energy per unit mass: without friction the total stays level while $T$ and $U$ trade. Raise the friction and the total drains into the heat bar, while total + heat stays level.`,
      deps: ['mech-3.2', 'mech-3.3'],
      refs: ['Taylor §4.2', 'Goldstein §1.1'],
      credit: 'Leibniz (vis viva), 1686; Helmholtz, 1847',
      tags: ['energy', 'conservation'],
      viz(v) {
        const gr = 4, XS = [-2.6, -1.3, 0, 1.3, 2.6], Y0 = [1.5, -0.7, 0.4, -1.1, 1.2], sg2 = 2 * 0.85 * 0.85, FLOOR = -2;
        const gam = v.slider('friction $\\gamma$', 0, 1, 0, { step: 0.02 });
        const s = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, height: 320, axes: false, weight: 1.55 });
        const b = v.stage({ x: [0, 5], y: [0, 1], height: 320, axes: false, weight: 0.75, title: 'energy per unit mass' });
        const knots = XS.map((x, i) => s.handle(x, Y0[i], { color: 'orange', r: 6, constrain: (xx, yy) => [x, clamp(yy, -1.7, 1.8)] }));
        let w = [0, 0, 0, 0, 0];
        const fit = () => { const Phi = XS.map((a) => XS.map((c) => Math.exp(-((a - c) ** 2) / sg2))); w = v.M.solve(Phi, knots.map((k) => k.y)); };
        const h = (x) => { let y = 0, d = 0, dd = 0; for (let j = 0; j < 5; j++) { const u = x - XS[j], e = w[j] * Math.exp(-u * u / sg2); y += e; d += -2 * u / sg2 * e; dd += (4 * u * u / (sg2 * sg2) - 2 / sg2) * e; } return [y, d, dd]; };
        fit();
        const bead = s.handle(-2.25, h(-2.25)[0], { color: 'gold', r: 8, label: 'release', labelPos: 'n', constrain: (x) => { const xx = clamp(x, -2.9, 2.9); return [xx, h(xx)[0]]; } });
        let st = null, key = '', simT = 0, E0 = 1, first = true;
        const energy = (q, p) => { const [y, d] = h(q); return [0.5 * (1 + d * d) * p * p, gr * (y - FLOOR)]; };
        const f = (t, S) => { const [, d, dd] = h(S[0]), g2 = gam.value; return [S[1], -(gr * d + d * dd * S[1] * S[1]) / (1 + d * d) - g2 * S[1], g2 * (1 + d * d) * S[1] * S[1]]; };
        v.animate((t) => {
          fit(); bead.y = h(bead.x)[0];
          const kk = knots.map((k) => k.y.toFixed(4)).join() + '|' + bead.x.toFixed(4);
          if (kk !== key || !st || t < simT - 1e-9) { key = kk; st = [bead.x, 0, 0]; simT = first ? 0 : t; first = false; const e = energy(st[0], 0); E0 = e[0] + e[1]; }
          const dt = 1 / 600; let n = 0;
          while (simT < t && n++ < 4000) { st = rk4step(f, simT, st, dt); simT += dt; if (st[0] > 2.95) { st[0] = 5.9 - st[0]; st[1] = -Math.abs(st[1]); } if (st[0] < -2.95) { st[0] = -5.9 - st[0]; st[1] = Math.abs(st[1]); } }
          // track
          s.fn((x) => h(x)[0], { color: 'ink', width: 3, domain: [-2.95, 2.95] });
          s.between((x) => h(x)[0], () => FLOOR, -2.95, 2.95, { fill: 'muted', fillAlpha: 0.12 });
          s.vline(-2.95, { color: 'muted', width: 2 }); s.vline(2.95, { color: 'muted', width: 2 });
          const [T, U] = energy(st[0], st[1]), Q = st[2], y = h(st[0])[0];
          const level = FLOOR + (E0 - Q) / gr; s.hline(level, { color: 'green', dash: [5, 4], width: 1.2 });
          s.text('E/mg', 0, level, { color: 'green', size: 11, align: 'center', dy: -9 });
          s.dot(st[0], y, { color: 'gold', r: 8 });
          // bars
          const top = E0 * 1.18; b.setView([0, 5], [-0.14 * top, top]);
          const bars = [['T', T, 'gold'], ['U', U, 'accent'], ['T+U', T + U, 'green'], ['heat', Q, 'red'], ['total', T + U + Q, 'ink']];
          bars.forEach(([lab, val, col], i) => { b.rect(0.2 + i, 0, 0.8 + i, val, { fill: col, fillAlpha: 0.7, color: col }); b.text(lab, 0.5 + i, -0.07 * top, { color: col, size: 12, align: 'center' }); });
          b.hline(E0, { color: 'ink', dash: [4, 4], width: 1 });
        }, { period: 40 });
        v.legend([['ink', 'track $y = h(x)$'], ['green', 'height of the mechanical energy line', { dash: true }], ['gold', 'bead']]);
        v.readout(() => {
          if (!st) return '';
          const [T, U] = energy(st[0], st[1]), Q = st[2];
          return `$T = ${v.fix(T, 3)}$, $U = ${v.fix(U, 3)}$, $E = T + U = ${v.fix(T + U, 4)}$ (start $${v.fix(E0, 4)}$) · heat $${v.fix(Q, 4)}$ · $E + \\text{heat} = ${v.fix(T + U + Q, 5)}$ · drift $${v.sci(Math.abs(T + U + Q - E0) / E0, 1)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7', kind: 'Theorem', name: 'König’s theorem',
      statement: String.raw`For a system of particles of masses $m_i$, total mass $M$ and centre-of-mass velocity $\mathbf V$, the total kinetic energy splits as
$$T = \sum_i \tfrac12 m_i|\mathbf v_i|^2 = \tfrac12 M|\mathbf V|^2 + \sum_i \tfrac12 m_i|\mathbf v_i - \mathbf V|^2 ,$$
the kinetic energy of the centre of mass plus the kinetic energy of the motion relative to it. The split works only about the centre of mass: about a point moving with velocity $\mathbf u$ there is an extra cross term $M\,\mathbf u\cdot(\mathbf V - \mathbf u)$. For two bodies the internal part is $\tfrac12\mu|\dot{\mathbf r}|^2$ with the reduced mass $\mu = m_1m_2/M$ and relative position $\mathbf r = \mathbf r_2 - \mathbf r_1$.`,
      idea: String.raw`Write $\mathbf v_i = \mathbf V + \mathbf v_i'$ and expand $|\mathbf v_i|^2 = |\mathbf V|^2 + 2\mathbf V\cdot\mathbf v_i' + |\mathbf v_i'|^2$. Summed with weights $m_i$, the cross term is $\mathbf V\cdot\sum m_i\mathbf v_i' = 0$, because momentum relative to the centre of mass vanishes (mech-2.4). About any other point $\sum m_i(\mathbf v_i - \mathbf u) = M(\mathbf V - \mathbf u) \ne 0$ and the cross term survives. With no external force $\mathbf V$ is constant (mech-2.4), so $\tfrac12 M|\mathbf V|^2$ is constant too and only the internal energy can change.`,
      caption: String.raw`Two masses joined by a spring fly through space while spinning and vibrating. The stacked bars split the total kinetic energy; the lower right panel shows $\tfrac12 MV^2$ flat and the internal part trading with the spring. Choose another reference point and a red cross term is needed to balance.`,
      deps: ['mech-3.1', 'mech-2.4'],
      refs: ['Taylor §10.1', 'Goldstein §1.2'],
      credit: 'Johann Samuel König, 1751',
      tags: ['energy', 'centre of mass'],
      viz(v) {
        const m2S = v.slider('mass ratio $m_2/m_1$', 0.3, 3, 2, { step: 0.05 });
        const VS = v.slider('centre-of-mass speed $V$', 0, 0.9, 0.6, { step: 0.02 });
        const ref = v.select('split about', [{ value: 'cm', label: 'centre of mass' }, { value: 'mid', label: 'midpoint' }, { value: 'm1', label: 'mass 1' }], 'cm');
        const s = v.stage({ x: [-4, 6.6], y: [-1.7, 1.7], equal: true, height: 230, axes: false, full: true });
        const bS = v.stage({ x: [0, 2], y: [0, 1], height: 220, axes: false, weight: 0.8, title: 'kinetic energy split' });
        const g = v.stage({ x: [0, 10], y: [0, 1], height: 220, axes: 'box', xlabel: 't', weight: 1.2, title: 'the same split over time' });
        const TEND = 10, N = 4000, dt = TEND / N, k = 9, L0 = 1, th = 0.08;
        let sim = null, key = '', cur = null;
        const solve = () => {
          const m1 = 1, m2 = m2S.value, mu = m1 * m2 / (m1 + m2);
          const f = (t, S) => { const r = Math.hypot(S[0], S[1]), a = -k * (r - L0) / (mu * r); return [S[2], S[3], a * S[0], a * S[1]]; };
          let y = [1.45, 0, 0, 1.6]; const out = [y]; for (let i = 0; i < N; i++) { y = rk4step(f, 0, y, dt); out.push(y); }
          return { out, m1, m2, M: m1 + m2 };
        };
        v.animate((t) => {
          const kk = m2S.value + ''; if (kk !== key) { key = kk; sim = solve(); }
          const i = Math.min(N, Math.floor(t / dt)), { out, m1, m2, M } = sim, V = [VS.value * Math.cos(th), VS.value * Math.sin(th)];
          const state = (j) => { const tt = j * dt, Rc = [-3 + V[0] * tt, -0.4 + V[1] * tt], S = out[j]; return { Rc, r1: [Rc[0] - m2 / M * S[0], Rc[1] - m2 / M * S[1]], r2: [Rc[0] + m1 / M * S[0], Rc[1] + m1 / M * S[1]], v1: [V[0] - m2 / M * S[2], V[1] - m2 / M * S[3]], v2: [V[0] + m1 / M * S[2], V[1] + m1 / M * S[3]] }; };
          const split = (q) => {
            const u = ref.value === 'cm' ? V : ref.value === 'mid' ? [(q.v1[0] + q.v2[0]) / 2, (q.v1[1] + q.v2[1]) / 2] : q.v1;
            const T1 = 0.5 * m1 * (q.v1[0] ** 2 + q.v1[1] ** 2), T2 = 0.5 * m2 * (q.v2[0] ** 2 + q.v2[1] ** 2);
            const Tu = 0.5 * M * (u[0] ** 2 + u[1] ** 2), Ti = 0.5 * m1 * ((q.v1[0] - u[0]) ** 2 + (q.v1[1] - u[1]) ** 2) + 0.5 * m2 * ((q.v2[0] - u[0]) ** 2 + (q.v2[1] - u[1]) ** 2);
            return { T1, T2, Tu, Ti, X: M * (u[0] * (V[0] - u[0]) + u[1] * (V[1] - u[1])) };
          };
          const q = state(i), sp = split(q); cur = sp;
          // scene: trails, spring, masses, CM
          const tr1 = [], tr2 = [], trc = []; for (let j = 0; j <= N; j += 8) { const z = state(j); tr1.push(z.r1); tr2.push(z.r2); trc.push(z.Rc); }
          const ii = Math.floor(i / 8) + 1;
          s.path(tr1, { color: 'accent', width: 1, alpha: 0.15 }); s.path(tr2, { color: 'orange', width: 1, alpha: 0.15 }); s.path(trc, { color: 'green', width: 1.2, dash: [4, 4], alpha: 0.6 });
          s.path(tr1.slice(0, ii), { color: 'accent', width: 1.3, alpha: 0.7 }); s.path(tr2.slice(0, ii), { color: 'orange', width: 1.3, alpha: 0.7 });
          const sx = q.r2[0] - q.r1[0], sy = q.r2[1] - q.r1[1], L = Math.hypot(sx, sy), nx = -sy / L, ny = sx / L, coil = [];
          for (let j = 0; j <= 60; j++) { const a = j / 60, wig = j > 4 && j < 56 ? 0.1 * Math.sin(a * 20 * Math.PI) : 0; coil.push([q.r1[0] + sx * a + nx * wig, q.r1[1] + sy * a + ny * wig]); }
          s.path(coil, { color: 'muted', width: 1.4 });
          s.dot(q.r1[0], q.r1[1], { color: 'accent', r: 7 + 3 * Math.sqrt(m1), label: 'm₁', labelPos: 'nw' }); s.dot(q.r2[0], q.r2[1], { color: 'orange', r: 7 + 3 * Math.sqrt(m2), label: 'm₂', labelPos: 'ne' });
          s.dot(q.Rc[0], q.Rc[1], { color: 'green', r: 4 });
          vec(s, q.Rc[0], q.Rc[1], V[0], V[1], 1.2, { color: 'green', width: 2 });
          // bars
          const Tt = sp.T1 + sp.T2, top = Math.max(0.5, Tt, sp.Tu + sp.Ti, sp.Tu + sp.Ti + Math.max(0, sp.X)) * 1.15;
          bS.setView([0, 2], [-0.12 * top, top]);
          stack(bS, 0.2, 0.8, [[sp.T1, 'accent'], [sp.T2, 'orange']]);
          const y2 = stack(bS, 1.2, 1.8, [[sp.Tu, 'green'], [sp.Ti, 'purple']]);
          if (Math.abs(sp.X) > 1e-6) bS.rect(1.2, y2, 1.8, y2 + sp.X, { fill: 'red', fillAlpha: 0.35, color: 'red', dash: [3, 3] });
          bS.hline(Tt, { color: 'ink', dash: [4, 4], width: 1 });
          bS.text('lab', 0.5, -0.06 * top, { size: 12, align: 'center', color: 'muted' }); bS.text('split', 1.5, -0.06 * top, { size: 12, align: 'center', color: 'muted' });
          // time traces
          const tr = []; for (let j = 0; j <= N; j += 10) tr.push([j * dt, split(state(j))]);
          const gm = Math.max(...tr.map(([, z]) => Math.max(z.T1 + z.T2, z.Tu, z.Ti))) * 1.12; g.setView([0, TEND], [0, gm]);
          g.path(tr.map(([tt, z]) => [tt, z.T1 + z.T2]), { color: 'ink', width: 1.6 });
          g.path(tr.map(([tt, z]) => [tt, z.Tu]), { color: 'green', width: 2.2 });
          g.path(tr.map(([tt, z]) => [tt, z.Ti]), { color: 'purple', width: 2 });
          g.vline(t, { color: 'faint', width: 1 });
        }, { period: TEND });
        v.legend([['accent', '$\\tfrac12 m_1v_1^2$', { area: true }], ['orange', '$\\tfrac12 m_2v_2^2$', { area: true }], ['green', '$\\tfrac12 M|\\mathbf u|^2$ (reference point)', { area: true }], ['purple', 'relative part $\\sum\\tfrac12 m_i|\\mathbf v_i - \\mathbf u|^2$', { area: true }], ['red', 'cross term $M\\mathbf u\\cdot(\\mathbf V - \\mathbf u)$', { area: true }], ['ink', 'total $T$'], ['green', 'centre of mass and $\\mathbf V$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { T1, T2, Tu, Ti, X } = cur;
          return `$T = ${v.fix(T1 + T2, 5)}$ · $\\tfrac12 M|\\mathbf u|^2 + \\sum\\tfrac12 m_i|\\mathbf v_i-\\mathbf u|^2 = ${v.fix(Tu, 4)} + ${v.fix(Ti, 4)} = ${v.fix(Tu + Ti, 5)}$ · cross term $${v.fix(Math.abs(X) < 5e-10 ? 0 : X, 5)}$ ${ref.value === 'cm' ? '(vanishes about the centre of mass: König)' : '(nonzero: the split fails about this point)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8', kind: 'Proposition', name: 'Equal-mass elastic collisions separate at right angles',
      statement: String.raw`If a particle collides elastically with a particle of the **same mass** at rest, and both move off with nonzero velocities, then the two outgoing velocities are perpendicular: $\mathbf v_1'\cdot\mathbf v_2' = 0$. (In a head-on collision the incoming particle stops and the target takes all its velocity.) The conclusion fails if the masses differ or if the collision is inelastic.`,
      idea: String.raw`Momentum conservation (mech-2.6) with equal masses gives $\mathbf v_1 = \mathbf v_1' + \mathbf v_2'$, and kinetic-energy conservation (3.1, elastic) gives $|\mathbf v_1|^2 = |\mathbf v_1'|^2 + |\mathbf v_2'|^2$. Squaring the first and subtracting the second leaves $2\,\mathbf v_1'\cdot\mathbf v_2' = 0$. Geometrically, $\mathbf v_1'$ and $\mathbf v_2'$ form a triangle with hypotenuse $\mathbf v_1$, so by Pythagoras (or Thales) the corner lies on the circle with diameter $\mathbf v_1$.`,
      caption: String.raw`Set the impact parameter, the mass ratio and the restitution. Right: the momentum triangle $m_1\mathbf v_1 = m_1\mathbf v_1' + m_2\mathbf v_2'$; for equal masses and $e = 1$ its corner sits on the dashed Thales circle and the angle is exactly $90^\circ$. Change the mass ratio or lower $e$ and the corner leaves the circle.`,
      deps: ['mech-2.6', 'mech-3.1'],
      refs: ['Goldstein §3.11'],
      tags: ['collisions', 'momentum', 'energy'],
      viz(v) {
        const bS = v.slider('impact parameter $b/(2\\rho)$', 0, 0.95, 0.5, { step: 0.01 });
        const mr = v.slider('mass ratio $m_2/m_1$', 0.25, 4, 1, { log: true, step: 0.01 });
        const eS = v.slider('restitution $e$', 0, 1, 1, { step: 0.01 });
        const s = v.stage({ x: [-3.3, 3.3], y: [-1.9, 1.9], equal: true, height: 300, axes: false, weight: 1.45 });
        const w = v.stage({ x: [-0.2, 1.2], y: [-0.75, 0.75], equal: true, height: 300, axes: false, weight: 0.9, title: 'momentum triangle' });
        const rho = 0.3, D = 2 * rho, tc = 2.6;
        let R = null;
        const solve = () => {
          const b = bS.value * D, xc = -Math.sqrt(D * D - b * b), n = [-xc / D, -b / D], m2 = mr.value, e = eS.value;
          const J = (1 + e) * m2 / (1 + m2) * n[0]; // impulse on 2; u1 = (1, 0)
          const v1 = [1 - J * n[0], -J * n[1]], v2 = [J / m2 * n[0], J / m2 * n[1]];
          const a1 = Math.hypot(...v1), a2 = Math.hypot(...v2), ang = a1 > 1e-9 && a2 > 1e-9 ? Math.acos(clamp((v1[0] * v2[0] + v1[1] * v2[1]) / (a1 * a2), -1, 1)) * 180 / Math.PI : NaN;
          return { b, xc, n, m2, e, v1, v2, ang };
        };
        v.animate((t) => {
          R = solve(); const { b, xc, v1, v2, m2 } = R, r2 = rho * Math.cbrt(m2);
          const after = Math.max(0, t - tc), c1 = t < tc ? [xc - (tc - t) * 1.0, b] : [xc + v1[0] * after, b + v1[1] * after], c2 = [v2[0] * after, v2[1] * after];
          s.line(-3.3, b, xc, b, { color: 'accent', dash: [4, 4], width: 1 });
          if (t >= tc) {
            s.line(xc, b, c1[0], c1[1], { color: 'accent', width: 1.4, alpha: 0.6 }); s.line(0, 0, c2[0], c2[1], { color: 'orange', width: 1.4, alpha: 0.6 });
            s.circle(xc, b, rho, { color: 'accent', dash: [2, 3], width: 1, alpha: 0.6 });
          }
          s.line(xc, b, 0, 0, { color: 'faint', width: 1 });
          { // outgoing directions from the contact point, with the angle between them
            const K = [xc / 2, b / 2], a1 = Math.atan2(v1[1], v1[0]), a2 = Math.atan2(v2[1], v2[0]), L1 = Math.hypot(...v1), L2 = Math.hypot(...v2);
            if (L1 > 1e-6) s.line(K[0], K[1], K[0] + 2.2 * v1[0] / L1, K[1] + 2.2 * v1[1] / L1, { color: 'accent', dash: [5, 4], width: 1.2, alpha: 0.7 });
            if (L2 > 1e-6) s.line(K[0], K[1], K[0] + 2.2 * v2[0] / L2, K[1] + 2.2 * v2[1] / L2, { color: 'orange', dash: [5, 4], width: 1.2, alpha: 0.7 });
            if (L1 > 1e-6 && L2 > 1e-6) {
              let d = a1 - a2; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
              const ok = Math.abs(R.ang - 90) < 0.05, col = ok ? 'green' : 'red';
              s.curve((u) => [K[0] + 1.1 * Math.cos(a2 + d * u), K[1] + 1.1 * Math.sin(a2 + d * u)], 0, 1, { color: col, width: 2 });
              const am = a2 + d / 2; s.text(`${v.fix(R.ang, 1)}°`, K[0] + 1.35 * Math.cos(am), K[1] + 1.35 * Math.sin(am), { color: col, size: 13, align: 'center' });
            }
          }
          s.circle(c2[0], c2[1], r2, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1.5 });
          s.circle(c1[0], c1[1], rho, { fill: 'accent', fillAlpha: 0.55, color: 'accent', width: 1.5 });
          const u = t < tc ? [1, 0] : v1; vec(s, c1[0], c1[1], u[0], u[1], 0.9, { color: 'ink', width: 2 });
          if (t >= tc) vec(s, c2[0], c2[1], v2[0], v2[1], 0.9, { color: 'ink', width: 2 });
          s.corner(t < tc ? 'before the collision' : 'after the collision', 'tl');
          // momentum triangle
          const p1 = v1, p2 = [m2 * v2[0], m2 * v2[1]];
          w.circle(0.5, 0, 0.5, { color: 'green', dash: [5, 4], width: 1.3 });
          w.arrow(0, 0, 1, 0, { color: 'ink', width: 2.2 });
          w.arrow(0, 0, p1[0], p1[1], { color: 'accent', width: 2.6 }); w.arrow(p1[0], p1[1], p1[0] + p2[0], p1[1] + p2[1], { color: 'orange', width: 2.6 });
          w.tex('m_1\\mathbf v_1', 0.5, 0, { color: 'ink', dy: 6, baseline: 'top', align: 'center' });
          w.tex("m_1\\mathbf v_1'", p1[0] / 2, p1[1] / 2, { color: 'accent', dx: -6, dy: p1[1] > 0 ? -4 : 4, align: 'right', baseline: p1[1] > 0 ? 'bottom' : 'top' });
          w.tex("m_2\\mathbf v_2'", p1[0] + p2[0] / 2, p1[1] + p2[1] / 2, { color: 'orange', dx: 6, align: 'left', baseline: p1[1] > 0 ? 'bottom' : 'top' });
          w.dot(p1[0], p1[1], { color: Math.abs(R.ang - 90) < 0.05 ? 'green' : 'red', r: 5 });
          if (Math.abs(R.ang - 90) < 0.05) { const L1 = Math.hypot(...p1), L2 = Math.hypot(...p2), q = 0.07, u1 = [-p1[0] / L1 * q, -p1[1] / L1 * q], u2 = [p2[0] / L2 * q, p2[1] / L2 * q]; w.path([[p1[0] + u1[0], p1[1] + u1[1]], [p1[0] + u1[0] + u2[0], p1[1] + u1[1] + u2[1]], [p1[0] + u2[0], p1[1] + u2[1]]], { color: 'green', width: 1.4 }); }
        }, { period: 6 });
        v.legend([['accent', 'ball 1 (incoming)'], ['orange', 'ball 2 (at rest)'], ['green', 'Thales circle on $m_1\\mathbf v_1$', { dash: true }]]);
        v.readout(() => {
          if (!R) return '';
          const { v1, v2, m2, ang } = R, Ta = 0.5 * (v1[0] ** 2 + v1[1] ** 2) + 0.5 * m2 * (v2[0] ** 2 + v2[1] ** 2), px = v1[0] + m2 * v2[0] - 1, py = v1[1] + m2 * v2[1];
          const a = isFinite(ang) ? `angle between $\\mathbf v_1'$ and $\\mathbf v_2'$: $${v.fix(ang, 3)}^\\circ$` : 'head-on: ball 1 stops dead, ball 2 leaves with all the velocity';
          return `${a} · $T_{\\text{after}}/T_{\\text{before}} = ${v.fix(Ta / 0.5, 4)}$ · momentum error $${Math.hypot(px, py) < 1e-14 ? '0' : v.sci(Math.hypot(px, py), 1)}$${Math.abs(m2 - 1) < 0.005 && eS.value > 0.995 ? ' · equal masses, elastic: right angle' : ''}`;
        });
      },
    },
  ],
};
