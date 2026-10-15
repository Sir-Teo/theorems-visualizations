// Classical Mechanics — Chapter 1: Kinematics and Newton’s laws

// ---------- shared helpers ----------
const G0 = 9.81; // m/s², standard gravity used throughout the chapter
const vlen = (a) => Math.hypot(a[0], a[1]);
/** Draw the vector d from the point p, scaled by k (skipped when it would be invisible). */
function vec(s, p, d, k, st) {
  if (vlen(d) * k < 1e-3) return;
  s.arrow(p[0], p[1], p[0] + k * d[0], p[1] + k * d[1], { width: 2.4, head: 9, ...st });
}
/** Central finite differences of a planar motion pos(t) → [x, y]: velocity and acceleration. */
function diff2(pos, t, h = 1e-3) {
  const a = pos(t - h), b = pos(t), c = pos(t + h);
  return { p: b, v: [(c[0] - a[0]) / (2 * h), (c[1] - a[1]) / (2 * h)], a: [(c[0] - 2 * b[0] + a[0]) / (h * h), (c[1] - 2 * b[1] + a[1]) / (h * h)] };
}
/** Linear interpolation in sampled arrays ts (increasing) / ys (numbers or arrays). */
function sampleAt(ts, ys, t) {
  const n = ts.length; if (t <= ts[0]) return ys[0]; if (t >= ts[n - 1]) return ys[n - 1];
  let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= t) lo = m; else hi = m; }
  const w = (t - ts[lo]) / (ts[hi] - ts[lo]), A = ys[lo], B = ys[hi];
  return Array.isArray(A) ? A.map((x, i) => x + w * (B[i] - x)) : A + w * (B - A);
}
/** Zigzag spring between two points (n coils, amplitude w in data units). */
function spring(s, p, q, n, w, st) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, pts = [p];
  const a = 0.12, b = 0.88;
  pts.push([p[0] + a * dx, p[1] + a * dy]);
  for (let i = 1; i < 2 * n; i++) { const f = a + (b - a) * i / (2 * n), sg = i % 2 ? 1 : -1; pts.push([p[0] + f * dx - sg * w * uy, p[1] + f * dy + sg * w * ux]); }
  pts.push([p[0] + b * dx, p[1] + b * dy], q);
  s.path(pts, st);
}

export default {
  collection: 'mech',
  chapter: 1,
  title: 'Kinematics and Newton’s laws',
  summary: String.raw`Motion is described by position, velocity and acceleration, in Cartesian or in polar coordinates with their moving unit vectors. Newton’s three laws hold only in inertial frames; Galilean relativity says that no inertial frame is preferred, and the existence-and-uniqueness theory of ODEs turns the second law into a deterministic machine — with a famous loophole when the force is not Lipschitz. The chapter closes with the workhorse forces and models: uniform gravity, linear and quadratic drag, normal forces and tension, Coulomb friction, universal gravitation and the magnetic force.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Position, velocity and acceleration',
      statement: String.raw`Choose an origin and Cartesian axes. The **position** of a particle is a vector-valued function of time, $\mathbf r(t)=(x(t),y(t),z(t))$. Its **velocity** and **acceleration** are the first and second derivatives, taken component by component:
$$\mathbf v(t)=\dot{\mathbf r}(t)=\lim_{h\to0}\frac{\mathbf r(t+h)-\mathbf r(t)}{h},\qquad \mathbf a(t)=\dot{\mathbf v}(t)=\ddot{\mathbf r}(t).$$
The **speed** is $|\mathbf v|$. Whenever $\mathbf v\neq0$ the velocity points along the unit tangent $\hat T$ of the path, and the acceleration splits into a tangential and a normal part,
$$\mathbf a=\frac{d|\mathbf v|}{dt}\,\hat T+\frac{|\mathbf v|^2}{\rho}\,\hat N,$$
where $\rho$ is the radius of curvature of the path and $\hat N$ the unit normal pointing toward its centre of curvature.`,
      idea: String.raw`Vector-valued functions are differentiated componentwise, so $\mathbf v$ is the limit of the chords $\Delta\mathbf r/\Delta t$, and chords of a smooth path become tangent to it. Writing $\mathbf v=|\mathbf v|\,\hat T$ and using the product rule gives $\frac{d|\mathbf v|}{dt}\hat T+|\mathbf v|\frac{d\hat T}{dt}$. Since $\hat T$ has constant length, its derivative is perpendicular to it, and it turns at the rate $|\mathbf v|/\rho$; this produces the normal term $|\mathbf v|^2/\rho$. Changing speed costs tangential acceleration, changing direction costs normal acceleration.`,
      caption: String.raw`Press play or drag the gold particle around the track, and pick a speed schedule. The acceleration (pink) is computed by finite differences of the motion and split into its tangential (orange) and normal (purple) parts; the dashed circle is the osculating circle of radius $\rho$. With *constant speed* the tangential part vanishes. On the right, the slope of the speed graph is exactly the tangential part.`,
      deps: ['pma-5.16'],
      refs: ['Taylor §1.2'],
      tags: ['kinematics', 'vectors'],
      viz(v) {
        const M = v.M, TAU = 2 * Math.PI;
        const gam = (u) => [1.9 * Math.cos(u), 1.1 * Math.sin(u) + 0.15 * Math.sin(2 * u)];
        const dg = (u) => [-1.9 * Math.sin(u), 1.1 * Math.cos(u) + 0.3 * Math.cos(2 * u)];
        const ddg = (u) => [-1.9 * Math.cos(u), -1.1 * Math.sin(u) - 0.6 * Math.sin(2 * u)];
        const kappa = (u) => { const a = dg(u), b = ddg(u); return Math.abs(a[0] * b[1] - a[1] * b[0]) / Math.pow(vlen(a), 3); };
        const LAWS = {
          const: { label: 'constant speed', sp: () => 1.2 },
          vary: { label: 'speed up / slow down', sp: (u) => 1.2 + 0.65 * Math.sin(u) },
          bends: { label: 'brake in the bends', sp: (u) => 1.9 / Math.sqrt(1 + 1.4 * kappa(u)) },
        };
        const law = v.select('speed schedule', Object.entries(LAWS).map(([value, L]) => ({ value, label: L.label })), 'vary');
        const s = v.stage({ x: [-2.5, 2.5], y: [-1.7, 1.7], equal: true, height: 330, axes: false, weight: 1.35 });
        const g = v.stage({ x: [0, 8], y: [0, 2.2], height: 330, axes: 'box', xlabel: 't (s)', ylabel: '|v| (m/s)', title: 'speed along one lap', weight: 0.9 });
        const dudt = (u) => LAWS[law.value].sp(u) / vlen(dg(u));
        const adv = (u, dt, n = 4) => { const h = dt / n; for (let i = 0; i < n; i++) { const k1 = dudt(u), k2 = dudt(u + h / 2 * k1), k3 = dudt(u + h / 2 * k2), k4 = dudt(u + h * k3); u += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); } return u; };
        const nearest = (x, y) => {
          let best = 0, bd = Infinity;
          for (let i = 0; i < 720; i++) { const u = i / 720 * TAU, p = gam(u), d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < bd) { bd = d; best = u; } }
          let lo = best - TAU / 720, hi = best + TAU / 720;
          for (let k = 0; k < 30; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3, d1 = vlen(M.vsub(gam(m1), [x, y])), d2 = vlen(M.vsub(gam(m2), [x, y])); if (d1 < d2) hi = m2; else lo = m1; }
          return M.mod((lo + hi) / 2, TAU);
        };
        let uCur = 2.3, lastT = null, lap = null, lapKey = null;
        const h = s.handle(...gam(uCur), { color: 'gold', r: 8, constrain: (x, y) => { uCur = nearest(x, y); return gam(uCur); } });
        const lapTable = () => {
          if (lapKey === law.value) return lap;
          const ts = [0], us = [0], sp = [LAWS[law.value].sp(0)]; let u = 0, t = 0; const dt = 0.01;
          while (u < TAU) { u = adv(u, dt, 1); t += dt; ts.push(t); us.push(u); sp.push(LAWS[law.value].sp(u)); }
          const n = ts.length, T = ts[n - 2] + (TAU - us[n - 2]) / (us[n - 1] - us[n - 2]) * dt;
          lapKey = law.value; lap = { ts, us, sp, T, vmax: Math.max(...sp) };
          return lap;
        };
        let st = null;
        v.animate((t) => {
          if (v.playing && !h.dragging && lastT != null) { const dt = t - lastT; if (dt > 0 && dt < 0.25) uCur = M.mod(adv(uCur, dt), TAU); }
          lastT = t;
          const P = gam(uCur); h.x = P[0]; h.y = P[1];
          // honest kinematics: positions at t ± hh obtained by integrating du/dt = v(u)/|γ'(u)|
          const hh = 0.01, um = adv(uCur, -hh, 2), up = adv(uCur, hh, 2);
          const A = gam(um), C = gam(up);
          const vel = [(C[0] - A[0]) / (2 * hh), (C[1] - A[1]) / (2 * hh)];
          const acc = [(C[0] - 2 * P[0] + A[0]) / (hh * hh), (C[1] - 2 * P[1] + A[1]) / (hh * hh)];
          const sp = vlen(vel), T = [vel[0] / sp, vel[1] / sp];
          const aT = acc[0] * T[0] + acc[1] * T[1], aNv = [acc[0] - aT * T[0], acc[1] - aT * T[1]], aN = vlen(aNv);
          // geometry only: osculating circle through three nearby points of the track
          const d = 0.004, Q1 = gam(uCur - d), Q2 = gam(uCur + d);
          const ax = Q1[0], ay = Q1[1], bx = P[0], by = P[1], cx = Q2[0], cy = Q2[1];
          const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
          const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
          const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
          const rho = Math.hypot(ux - bx, uy - by);
          const dspdt = (LAWS[law.value].sp(up) - LAWS[law.value].sp(um)) / (2 * hh);
          st = { sp, aT, aN, rho, dspdt };
          // track and osculating circle
          s.curve(gam, 0, TAU, { color: 'faint', width: 9, alpha: 0.35, n: 400 });
          s.curve(gam, 0, TAU, { color: 'muted', width: 1.2, n: 400 });
          if (rho < 6) { s.circle(ux, uy, rho, { color: 'purple', dash: [4, 4], width: 1.1, alpha: 0.55 }); s.dot(ux, uy, { r: 2.5, color: 'purple' }); }
          // vectors
          const kv = 0.75, ka = 0.6;
          if (Math.abs(aT) * ka > 0.02 && aN * ka > 0.02) {
            s.path([[P[0] + ka * aT * T[0], P[1] + ka * aT * T[1]], [P[0] + ka * acc[0], P[1] + ka * acc[1]], [P[0] + ka * aNv[0], P[1] + ka * aNv[1]]], { color: 'muted', dash: [3, 3], width: 1 });
          }
          vec(s, P, [aT * T[0], aT * T[1]], ka, { color: 'orange' });
          vec(s, P, aNv, ka, { color: 'purple' });
          vec(s, P, acc, ka, { color: 'pink', width: 3 });
          vec(s, P, vel, kv, { color: 'accent', width: 3 });
          s.tex('\\mathbf v', P[0] + kv * vel[0], P[1] + kv * vel[1], { color: 'accent', dx: 8, dy: -8 });
          if (vlen(acc) * ka > 0.15) s.tex('\\mathbf a', P[0] + ka * acc[0], P[1] + ka * acc[1], { color: 'pink', dx: 8, dy: 8 });
          // speed graph
          const L = lapTable();
          g.setView([0, L.T], [0, Math.max(2, L.vmax * 1.25)]);
          g.path(L.ts.map((tt, i) => [tt, L.sp[i]]), { color: 'accent', width: 2 });
          const tc = sampleAt(L.us, L.ts, uCur);
          const w = L.T * 0.09;
          g.line(tc - w, sp - dspdt * w, tc + w, sp + dspdt * w, { color: 'orange', width: 2.4 });
          g.dot(tc, sp, { r: 5, color: 'gold' });
          g.text(`slope = ${v.fix(dspdt, 2)} m/s²`, tc, sp, { color: 'orange', dy: -16, align: tc > L.T * 0.7 ? 'right' : 'left', size: 12 });
        }, { still: 0 });
        v.legend([['accent', 'velocity $\\mathbf v$'], ['pink', 'acceleration $\\mathbf a$'], ['orange', 'tangential $\\tfrac{d|\\mathbf v|}{dt}\\hat T$'], ['purple', 'normal $\\tfrac{|\\mathbf v|^2}{\\rho}\\hat N$']]);
        v.readout(() => st && `$|\\mathbf v| = ${v.fix(st.sp, 3)}$ m/s · tangential $\\mathbf a\\cdot\\hat T = ${v.fix(st.aT, 3)}$ vs $\\tfrac{d|\\mathbf v|}{dt} = ${v.fix(st.dspdt, 3)}$ m/s² · normal $${v.fix(st.aN, 3)}$ vs $|\\mathbf v|^2/\\rho = ${v.fix(st.sp * st.sp / st.rho, 3)}$ m/s² ($\\rho = ${v.fix(st.rho, 3)}$ m)`);
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Plane polar coordinates and moving unit vectors',
      statement: String.raw`A point of the plane other than the origin has **polar coordinates** $(r,\theta)$ with $x=r\cos\theta$, $y=r\sin\theta$. At that point the **unit vectors**
$$\hat{\mathbf r}=(\cos\theta,\sin\theta),\qquad \hat{\boldsymbol\theta}=(-\sin\theta,\cos\theta)$$
point in the directions of increasing $r$ and increasing $\theta$. They depend on the particle's position, and along a motion $\dot{\hat{\mathbf r}}=\dot\theta\,\hat{\boldsymbol\theta}$, $\dot{\hat{\boldsymbol\theta}}=-\dot\theta\,\hat{\mathbf r}$. Consequently, for $\mathbf r=r\,\hat{\mathbf r}$,
$$\dot{\mathbf r}=\dot r\,\hat{\mathbf r}+r\dot\theta\,\hat{\boldsymbol\theta},\qquad \ddot{\mathbf r}=(\ddot r-r\dot\theta^2)\,\hat{\mathbf r}+(r\ddot\theta+2\dot r\dot\theta)\,\hat{\boldsymbol\theta}.$$`,
      idea: String.raw`Differentiate $\hat{\mathbf r}=(\cos\theta,\sin\theta)$ with the chain rule: $\dot{\hat{\mathbf r}}=\dot\theta(-\sin\theta,\cos\theta)=\dot\theta\,\hat{\boldsymbol\theta}$, and likewise $\dot{\hat{\boldsymbol\theta}}=-\dot\theta\,\hat{\mathbf r}$ — unit vectors can only rotate, so their derivatives are perpendicular to them. Applying the product rule twice to $r\hat{\mathbf r}$ (1.1) produces four terms: the radial acceleration $\ddot r$, the centripetal term $-r\dot\theta^2$, the angular acceleration term $r\ddot\theta$ and the Coriolis-type term $2\dot r\dot\theta$.`,
      caption: String.raw`Watch the particle and its moving frame $\hat{\mathbf r},\hat{\boldsymbol\theta}$. The four acceleration terms are drawn tip to tail; their sum lands exactly on the true acceleration (green), computed independently from $x(t),y(t)$. For the *bead on a spinning rod* the two radial terms cancel — no radial force — and only the rod's push along $\hat{\boldsymbol\theta}$ remains. The right panel shows the unit vectors turning, with $\dot{\hat{\mathbf r}}=\dot\theta\hat{\boldsymbol\theta}$.`,
      deps: ['mech-1.1'],
      refs: ['Taylor §1.7'],
      tags: ['kinematics', 'polar coordinates'],
      viz(v) {
        const PRE = {
          spiral: { label: 'spiral', r: (t) => 0.3 + 0.21 * t, th: (t) => 1.1 * t, T: 8 },
          rosette: { label: 'rosette', r: (t) => 1.3 + 0.55 * Math.sin(1.6 * t), th: (t) => 0.7 * t + 0.4 * Math.sin(0.9 * t), T: 4 * Math.PI },
          rod: { label: 'bead on a spinning rod', r: (t) => 0.18 * Math.cosh(0.55 * t), th: (t) => 0.55 * t, T: 5.5 },
        };
        const pre = v.select('motion', Object.entries(PRE).map(([value, P]) => ({ value, label: P.label })), 'rosette');
        const s = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 360, axes: false, weight: 1.4 });
        const u = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, height: 360, axes: false, title: 'moving unit vectors', weight: 0.8 });
        let st = null;
        v.animate((t) => {
          const P = PRE[pre.value], tau = t % P.T + 0.05;
          const pos = (q) => { const r = P.r(q), th = P.th(q); return [r * Math.cos(th), r * Math.sin(th)]; };
          const h = 1e-3;
          const r = P.r(tau), th = P.th(tau);
          const rd = (P.r(tau + h) - P.r(tau - h)) / (2 * h), rdd = (P.r(tau + h) - 2 * r + P.r(tau - h)) / (h * h);
          const thd = (P.th(tau + h) - P.th(tau - h)) / (2 * h), thdd = (P.th(tau + h) - 2 * th + P.th(tau - h)) / (h * h);
          const er = [Math.cos(th), Math.sin(th)], et = [-Math.sin(th), Math.cos(th)];
          const terms = [
            { c: rdd, e: er, color: 'blue' }, { c: -r * thd * thd, e: er, color: 'orange' },
            { c: r * thdd, e: et, color: 'purple' }, { c: 2 * rd * thd, e: et, color: 'teal' },
          ];
          const true_a = diff2(pos, tau, 1e-3).a, p = pos(tau);
          const sum = terms.reduce((acc, T) => [acc[0] + T.c * T.e[0], acc[1] + T.c * T.e[1]], [0, 0]);
          st = { terms, err: vlen([sum[0] - true_a[0], sum[1] - true_a[1]]), a: vlen(true_a), thd };
          s.polarGrid({ rings: [0.5, 1, 1.5, 2], spokes: 12, rmax: 2.2, angles: false });
          s.curve(pos, 0, P.T, { color: 'faint', width: 1.2, dash: [4, 4], n: 500 });
          s.curve(pos, Math.max(0, tau - P.T), tau, { color: 'accent', width: 2.2, n: 400 });
          s.line(0, 0, p[0], p[1], { color: 'muted', width: 1, dash: [2, 3] });
          // tip-to-tail chain of the four terms
          const k = 0.36; let q = p;
          for (const T of terms) { const d = [T.c * T.e[0], T.c * T.e[1]]; vec(s, q, d, k, { color: T.color, width: 2.6, head: 8 }); q = [q[0] + k * d[0], q[1] + k * d[1]]; }
          vec(s, p, true_a, k, { color: 'green', width: 1.6, dash: [5, 3], head: 11 });
          // moving frame at the particle
          vec(s, p, er, 0.42, { color: 'ink', width: 1.6, head: 7 }); vec(s, p, et, 0.42, { color: 'ink', width: 1.6, head: 7 });
          s.tex('\\hat{\\mathbf r}', p[0] + 0.5 * er[0], p[1] + 0.5 * er[1], { color: 'ink', size: 13 });
          s.tex('\\hat{\\boldsymbol\\theta}', p[0] + 0.5 * et[0], p[1] + 0.5 * et[1], { color: 'ink', size: 13 });
          s.dot(p[0], p[1], { r: 6, color: 'gold' });
          // right panel: the moving unit vectors themselves
          u.polarGrid({ rings: [1], spokes: 8, rmax: 1, angles: false });
          u.curve((q2) => [Math.cos(P.th(q2)), Math.sin(P.th(q2))], Math.max(0, tau - 2.5), tau, { color: 'gold', width: 3, alpha: 0.5 });
          vec(u, [0, 0], er, 1, { color: 'ink', width: 2.4 }); vec(u, [0, 0], et, 1, { color: 'muted', width: 2.4 });
          vec(u, er, et, 0.5 * thd, { color: 'pink', width: 2.2 }); vec(u, et, er, -0.5 * thd, { color: 'pink', width: 2.2 });
          u.tex('\\hat{\\mathbf r}', er[0] * 0.55, er[1] * 0.55, { color: 'ink', dx: -14, dy: -2 });
          u.tex('\\hat{\\boldsymbol\\theta}', et[0] * 0.55, et[1] * 0.55, { color: 'muted', dx: -14, dy: -2 });
          u.tex('\\dot\\theta\\,\\hat{\\boldsymbol\\theta}', er[0] + 0.5 * thd * et[0], er[1] + 0.5 * thd * et[1], { color: 'pink', size: 13, dx: 6, dy: -6 });
          u.tex('-\\dot\\theta\\,\\hat{\\mathbf r}', et[0] - 0.5 * thd * er[0], et[1] - 0.5 * thd * er[1], { color: 'pink', size: 13, dx: 6, dy: -6 });
        }, { still: 3.2 });
        v.legend([['blue', '$\\ddot r\\,\\hat{\\mathbf r}$'], ['orange', '$-r\\dot\\theta^2\\,\\hat{\\mathbf r}$'], ['purple', '$r\\ddot\\theta\\,\\hat{\\boldsymbol\\theta}$'], ['teal', '$2\\dot r\\dot\\theta\\,\\hat{\\boldsymbol\\theta}$'], ['green', 'true $\\ddot{\\mathbf r}$ from $x(t),y(t)$', { dash: true }]]);
        v.readout(() => st && `$\\ddot r = ${v.fix(st.terms[0].c, 3)}$, $\\;-r\\dot\\theta^2 = ${v.fix(st.terms[1].c, 3)}$, $\\;r\\ddot\\theta = ${v.fix(st.terms[2].c, 3)}$, $\\;2\\dot r\\dot\\theta = ${v.fix(st.terms[3].c, 3)}$ (m/s²) · $|\\ddot{\\mathbf r}| = ${v.fix(st.a, 3)}$ m/s², mismatch of the four-term sum: $${v.sci(st.err, 1)}$ m/s²`);
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Uniform circular motion and centripetal acceleration',
      statement: String.raw`A particle is in **uniform circular motion** when it moves on a circle of radius $r$ at constant speed $v$, i.e. $r$ is fixed and $\dot\theta=\omega=v/r$ is constant. Its acceleration is then purely **centripetal**: directed toward the centre, of magnitude
$$a=\frac{v^2}{r}=\omega^2 r=\omega v,$$
and the motion repeats with period $T=2\pi r/v$. Keeping a mass $m$ on the circle therefore requires a net inward force of magnitude $mv^2/r$.`,
      idea: String.raw`Set $\dot r=\ddot r=\ddot\theta=0$ in the polar formula (1.2): only $-r\dot\theta^2\,\hat{\mathbf r}$ survives. Geometrically, the velocity vector has constant length $v$ and turns at rate $\omega$, so its tip runs around a circle of radius $v$ (the **hodograph**) at speed $\omega v=v^2/r$; over a short time $\Delta t$ the change $\Delta\mathbf v$ is a short chord of that circle, perpendicular to $\mathbf v$, i.e. pointing to the centre.`,
      caption: String.raw`Set the speed, the radius and the time step $\Delta t$. The left panel shows $\mathbf v(t)$, $\mathbf v(t+\Delta t)$ and the average acceleration $\Delta\mathbf v/\Delta t$ (green), which points to the centre; the right panel is the hodograph, where $\Delta\mathbf v$ is a chord. Shrink $\Delta t$ and $|\Delta\mathbf v|/\Delta t\to v^2/r$. **Cut the string**: with no force the ball leaves along the tangent and $\Delta\mathbf v=0$.`,
      deps: ['mech-1.2'],
      refs: ['Taylor §1.7'],
      tags: ['kinematics', 'circular motion'],
      viz(v) {
        const vs = v.slider('speed $v$ (m/s)', 0.5, 3, 1.6, { step: 0.05 });
        const rs = v.slider('radius $r$ (m)', 0.6, 2, 1.4, { step: 0.05 });
        const dts = v.slider('$\\Delta t$ (s)', 0.02, 1.2, 0.5, { step: 0.01 });
        let cut = null;
        const s = v.stage({ x: [-2.8, 2.8], y: [-2.4, 2.4], equal: true, height: 340, axes: false, weight: 1.2 });
        const hgr = v.stage({ x: [-3.4, 3.4], y: [-3.4, 3.4], equal: true, height: 340, axes: true, title: 'hodograph (velocity space, m/s)', weight: 1 });
        v.button('✂ Cut the string', () => { cut = { t: v.t }; });
        v.button('Reattach', () => { cut = null; });
        let st = null;
        v.animate((t) => {
          const V = vs.value, R = rs.value, w = V / R, dT = dts.value;
          const posC = (q) => [R * Math.cos(w * q), R * Math.sin(w * q)];
          const velC = (q) => [-V * Math.sin(w * q), V * Math.cos(w * q)];
          if (cut && t - cut.t > 2.6) cut = null;
          const tc = cut ? cut.t : null;
          const pos = (q) => (tc != null && q > tc ? M2(posC(tc), velC(tc), q - tc) : posC(q));
          const vel = (q) => (tc != null && q > tc ? velC(tc) : velC(q));
          function M2(p, u, d) { return [p[0] + u[0] * d, p[1] + u[1] * d]; }
          const p1 = pos(t), p2 = pos(t + dT), v1 = vel(t), v2 = vel(t + dT), dv = [v2[0] - v1[0], v2[1] - v1[1]];
          const pm = pos(t + dT / 2), aavg = [dv[0] / dT, dv[1] / dT];
          // angle between Δv and the inward direction at mid-time
          const inward = [-pm[0], -pm[1]], ang = vlen(dv) > 1e-9 ? Math.acos(Math.max(-1, Math.min(1, (dv[0] * inward[0] + dv[1] * inward[1]) / (vlen(dv) * vlen(inward))))) : 0;
          st = { a: vlen(aavg), pred: V * V / R, ang, T: 2 * Math.PI * R / V, cut: tc != null && t > tc };
          // scene
          s.circle(0, 0, R, { color: 'faint', width: 1.4, dash: [5, 4] });
          s.dot(0, 0, { r: 4, color: 'ink' });
          if (!st.cut) s.line(0, 0, p1[0], p1[1], { color: 'ink', width: 1.6 });
          else { const pc = posC(tc); s.line(0, 0, 0.35 * pc[0], 0.35 * pc[1], { color: 'ink', width: 1.6 }); s.line(p1[0], p1[1], p1[0] - 0.25 * (p1[0] - pc[0]) / (vlen([p1[0] - pc[0], p1[1] - pc[1]]) || 1), p1[1] - 0.25 * (p1[1] - pc[1]) / (vlen([p1[0] - pc[0], p1[1] - pc[1]]) || 1), { color: 'ink', width: 1.6 }); }
          const kv = 0.55;
          s.dot(p2[0], p2[1], { r: 6, hollow: true, color: 'muted' });
          vec(s, p2, v2, kv, { color: 'accent', alpha: 0.45 });
          vec(s, p1, v1, kv, { color: 'accent', width: 3 });
          vec(s, pm, aavg, 0.3, { color: 'green', width: 2.6 });
          s.dot(p1[0], p1[1], { r: 8, color: 'gold' });
          s.tex('\\mathbf v(t)', p1[0] + kv * v1[0], p1[1] + kv * v1[1], { color: 'accent', dx: 6, dy: -6, size: 13 });
          if (vlen(aavg) > 0.05) s.tex('\\Delta\\mathbf v/\\Delta t', pm[0] + 0.3 * aavg[0], pm[1] + 0.3 * aavg[1], { color: 'green', size: 13, align: 'center', dy: 14 });
          if (st.cut) s.corner('string cut: no force, straight line at constant velocity', 'tl', { color: 'red', weight: 600 });
          // hodograph
          hgr.circle(0, 0, V, { color: 'faint', width: 1.4, dash: [5, 4] });
          vec(hgr, [0, 0], v1, 1, { color: 'accent', width: 2.8 });
          vec(hgr, [0, 0], v2, 1, { color: 'accent', alpha: 0.45 });
          if (vlen(dv) > 1e-6) vec(hgr, v1, dv, 1, { color: 'green', width: 2.6, head: 8 });
          hgr.dot(v1[0], v1[1], { r: 5, color: 'gold' });
          hgr.tex('\\Delta\\mathbf v', v1[0] + dv[0] / 2, v1[1] + dv[1] / 2, { color: 'green', dx: 10, size: 13 });
        }, { still: 0.9 });
        v.legend([['accent', 'velocity at $t$ and $t+\\Delta t$'], ['green', '$\\Delta\\mathbf v$ and $\\Delta\\mathbf v/\\Delta t$'], ['gold', 'ball', { dot: true }]]);
        v.readout(() => st && (st.cut
          ? `String cut: $|\\Delta\\mathbf v|/\\Delta t = ${v.fix(st.a, 3)}$ m/s² — no force, no acceleration (first law).`
          : `$|\\Delta\\mathbf v|/\\Delta t = ${v.fix(st.a, 3)}$ m/s² vs $v^2/r = ${v.fix(st.pred, 3)}$ m/s² (ratio ${v.fix(st.a / st.pred, 4)}, → 1 as $\\Delta t\\to0$) · angle between $\\Delta\\mathbf v$ and the inward direction: ${v.fix(st.ang * 180 / Math.PI, 2)}° · period $T = 2\\pi r/v = ${v.fix(st.T, 2)}$ s`));
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Inertial reference frame',
      statement: String.raw`A **reference frame** is a choice of origin, axes fixed to some body, and a clock. A frame is **inertial** if in it every free particle — one so far from all other bodies that no force acts on it — moves in a straight line at constant velocity. It is a postulate of Newtonian mechanics that inertial frames exist. Any frame moving at constant velocity, without rotation, relative to an inertial frame is again inertial; a frame that accelerates or rotates relative to one is not.`,
      idea: String.raw`If $\mathbf r'=\mathbf r-\mathbf R(t)$ and the axes do not rotate, then $\ddot{\mathbf r}'=\ddot{\mathbf r}-\ddot{\mathbf R}$; free motion stays unaccelerated exactly when $\ddot{\mathbf R}=0$. In an accelerating frame every free particle shares the same spurious acceleration $-\ddot{\mathbf R}$; in a rotating frame free particles appear to feel centrifugal and Coriolis accelerations. The surface of the Earth is inertial only approximately.`,
      caption: String.raw`Drag the arrow to set the free puck's velocity. On the left (frame A) the puck goes straight; on the right the same motion is seen from frame B, which either accelerates or rotates. In B the puck's path bends although no force acts — the measured acceleration (red) is the signature of a non-inertial frame. Set $a_B=0$ or $\Omega=0$ and both frames agree.`,
      deps: [],
      refs: ['Taylor §1.4', 'Arnold §1'],
      tags: ['frames', 'newton'],
      viz(v) {
        const mode = v.select('frame B', [{ value: 'lin', label: 'accelerates' }, { value: 'rot', label: 'rotates' }], 'lin');
        const aB = v.slider('$a_B$ (m/s²)', 0, 1.5, 0.6, { step: 0.05 });
        const Om = v.slider('$\\Omega$ (rad/s)', 0, 1, 0.45, { step: 0.01 });
        const A = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, height: 320, axes: false, title: 'seen from frame A' });
        const B = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, height: 320, axes: false, title: 'seen from frame B' });
        const p0 = [-2.2, -1.2];
        const hu = A.handle(p0[0] + 1.1, p0[1] + 0.65, { color: 'accent', label: 'u', labelPos: 'e', constrain: { x: [-2.95, 1], y: [-2.1, 0.8] } });
        const Tp = 4.5;
        let st = null;
        v.animate((t) => {
          aB.el.hidden = mode.value !== 'lin'; Om.el.hidden = mode.value !== 'rot';
          const tau = (t % Tp);
          const u = [hu.x - p0[0], hu.y - p0[1]];
          const pA = (q) => [p0[0] + u[0] * q, p0[1] + u[1] * q];
          const lin = mode.value === 'lin', a = aB.value, W = Om.value;
          const toB = (p, q) => (lin ? [p[0] - 0.5 * a * q * q, p[1]] : [Math.cos(W * q) * p[0] + Math.sin(W * q) * p[1], -Math.sin(W * q) * p[0] + Math.cos(W * q) * p[1]]);
          const pB = (q) => toB(pA(q), q);
          const dA = diff2(pA, tau), dB = diff2(pB, tau);
          // prediction in B: −a_B (linear) or centrifugal + Coriolis (rotating, Ω along +z)
          const pred = lin ? [-a, 0] : [W * W * dB.p[0] + 2 * W * dB.v[1], W * W * dB.p[1] - 2 * W * dB.v[0]];
          st = { aA: vlen(dA.a), aB: vlen(dB.a), pred: vlen(pred), err: vlen([dB.a[0] - pred[0], dB.a[1] - pred[1]]) };
          // frame B's body drawn in A, frame A's grid drawn in B
          const drawFrame = (S, map, col) => {
            for (let k = -5; k <= 5; k++) {
              const L1 = [map([k, -5]), map([k, 5])], L2 = [map([-5, k]), map([5, k])];
              S.line(L1[0][0], L1[0][1], L1[1][0], L1[1][1], { color: col, width: k === 0 ? 1.8 : 0.8, alpha: k === 0 ? 0.85 : 0.3 });
              S.line(L2[0][0], L2[0][1], L2[1][0], L2[1][1], { color: col, width: k === 0 ? 1.8 : 0.8, alpha: k === 0 ? 0.85 : 0.3 });
            }
          };
          const BinA = (p) => (lin ? [p[0] + 0.5 * a * tau * tau, p[1]] : [Math.cos(W * tau) * p[0] - Math.sin(W * tau) * p[1], Math.sin(W * tau) * p[0] + Math.cos(W * tau) * p[1]]);
          drawFrame(A, (p) => p, 'grid');
          drawFrame(A, BinA, 'orange');
          drawFrame(B, (p) => toB(p, tau), 'grid');
          drawFrame(B, (p) => p, 'orange');
          for (const [S, f, d, isA] of [[A, pA, dA, true], [B, pB, dB, false]]) {
            S.curve(f, 0, Tp, { color: 'faint', width: 1, dash: [3, 4] });
            S.curve(f, 0, tau, { color: 'accent', width: 2.4 });
            for (let q = 0; q <= tau; q += 0.5) { const p = f(q); S.dot(p[0], p[1], { r: 2.6, color: 'accent' }); }
            S.dot(d.p[0], d.p[1], { r: 7, color: 'gold' });
            if (!isA) vec(S, d.p, d.a, 0.8, { color: 'red', width: 2.6 });
          }
          A.line(p0[0], p0[1], hu.x, hu.y, { color: 'accent', width: 1.2, dash: [2, 2] });
          A.corner('frame B drawn in orange', 'bl', { color: 'orange', size: 11 });
          B.corner('frame A drawn in grey', 'bl', { color: 'muted', size: 11 });
          A.corner(`|a| = ${v.fix(st.aA, 3)} m/s² — inertial`, 'tr', { color: 'green', weight: 600 });
          B.corner(st.aB > 1e-3 ? `|a| = ${v.fix(st.aB, 3)} m/s² with no force` : `|a| = ${v.fix(st.aB, 3)} m/s²`, 'tr', { color: st.aB > 1e-3 ? 'red' : 'green', weight: 600 });
        }, { still: 3.6 });
        v.legend([['accent', 'free puck (no force)'], ['red', 'its acceleration measured in B'], ['orange', 'frame B'], ['grid', 'frame A']]);
        v.readout(() => st && `Measured acceleration of the free puck: frame A $${v.fix(st.aA, 4)}$ m/s², frame B $${v.fix(st.aB, 4)}$ m/s². Predicted in B: ${mode.value === 'lin' ? '$-a_B$' : 'centrifugal $\\Omega^2 r$ + Coriolis $-2\\boldsymbol\\Omega\\times\\mathbf v$'} $= ${v.fix(st.pred, 4)}$ m/s² (difference $${v.sci(st.err, 1)}$).`);
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Law',
      name: 'Newton’s first law',
      credit: 'Galileo, 1638; Newton, 1687',
      statement: String.raw`In an inertial frame, a body on which no net force acts stays at rest or keeps moving in a straight line at constant speed: $\sum\mathbf F=0\Rightarrow\mathbf v=$ constant.`,
      scope: String.raw`Holds in inertial frames only (indeed it is what singles them out), for speeds small compared with the speed of light. Everyday motions that “run down” do so because of forces such as friction and drag.`,
      idea: String.raw`Aristotle took rest to be natural; Galileo's experiments with ever smoother inclined planes suggested instead that motion persists unless something stops it. A puck slowing under kinetic friction $\mu mg$ stops after $d=v_0^2/(2\mu g)$, which grows without bound as $\mu\to0$: the limit of vanishing force is uniform motion forever. Relative to the second law (1.6) the first adds the claim that inertial frames (1.4) exist.`,
      caption: String.raw`Lower the friction coefficient $\mu$ and watch the strobe images of the puck (every 0.5 s) spread out; the track rescales to fit. The lower right panel plots the stopping distance against $\mu$ on log–log axes: the simulated points follow $v_0^2/(2\mu g)$, a line of slope $-1$ that runs off to infinity as $\mu\to0$. At $\mu=0$ the speed never changes.`,
      deps: ['mech-1.4'],
      refs: ['Taylor §1.4'],
      tags: ['newton', 'inertia'],
      viz(v) {
        const mu = v.slider('friction $\\mu$', 0, 0.3, 0.08, { step: 0.002 });
        const v0s = v.slider('$v_0$ (m/s)', 1, 5, 3, { step: 0.1 });
        const tr = v.stage({ x: [-0.5, 12], y: [-0.6, 0.8], height: 130, axes: false, full: true });
        const vt = v.stage({ x: [0, 8], y: [0, 5.5], height: 220, axes: 'box', xlabel: 't (s)', ylabel: 'v (m/s)', title: 'speed vs time' });
        const dm = v.stage({ x: [0.001, 1], y: [0.01, 1e4], xlog: true, ylog: true, height: 220, axes: 'box', xlabel: 'μ', ylabel: 'stopping distance (m)', title: 'stopping distance vs friction' });
        const TS = 8;
        // explicit time-stepping of m dv/dt = −μ m g (kinetic friction until the puck stops)
        const slide = (m, v0, tmax, dt) => {
          const ts = [0], xs = [0], vsp = [v0]; let x = 0, vv = v0, t = 0;
          while (t < tmax) { const vn = Math.max(0, vv - m * G0 * dt); x += 0.5 * (vv + vn) * dt; vv = vn; t += dt; ts.push(t); xs.push(x); vsp.push(vv); if (vv === 0 && t > TS) break; }
          return { ts, xs, vsp, stop: vv === 0 ? x : Infinity };
        };
        const stopDist = (m, v0) => { if (m === 0) return Infinity; const T = v0 / (m * G0); return slide(m, v0, T * 1.01, T / 4000).stop; };
        let cache = null, key = null, st = null;
        v.animate((t) => {
          const m = mu.value, v0 = v0s.value;
          if (key !== m + ':' + v0) {
            key = m + ':' + v0;
            const sim = slide(m, v0, TS + 0.01, 0.002);
            const pts = [0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1].map((q) => [q, stopDist(q, v0)]);
            cache = { sim, d: stopDist(m, v0), pts };
          }
          const { sim, d, pts } = cache, tau = Math.min(t % (TS + 1), TS);
          const xNow = sampleAt(sim.ts, sim.xs, tau), vNow = sampleAt(sim.ts, sim.vsp, tau);
          const L = isFinite(d) ? Math.max(12, d * 1.12) : Math.max(12, v0 * TS * 1.08);
          tr.setView([-L * 0.04, L], [-0.6, 0.8]);
          st = { d, pred: m > 0 ? v0 * v0 / (2 * m * G0) : Infinity, x: xNow, v: vNow };
          // track
          tr.rect(-L * 0.04, -0.12, L, 0, { fill: 'faint', fillAlpha: 0.5, stroke: false });
          const step = Math.pow(10, Math.floor(Math.log10(L / 4)));
          for (let x = 0; x <= L; x += step) { tr.line(x, -0.12, x, -0.22, { color: 'muted', width: 1 }); tr.text(`${v.fmt(x, 3)} m`, x, -0.42, { size: 10, color: 'muted', align: 'center' }); }
          for (let q = 0; q <= tau + 1e-9; q += 0.5) tr.dot(sampleAt(sim.ts, sim.xs, q), 0.18, { r: 3.5, color: 'gold', alpha: 0.7 });
          if (isFinite(d)) { tr.vline(d, { color: 'green', dash: [4, 3], width: 1.5 }); tr.text('stops here', d, 0.62, { color: 'green', size: 11, align: 'center' }); }
          tr.rect(xNow - L * 0.012, 0.0, xNow + L * 0.012, 0.36, { fill: 'accent', fillAlpha: 0.9, color: 'accent' });
          vec(tr, [xNow + L * 0.015, 0.18], [vNow, 0], L * 0.025, { color: 'accent', width: 2 });
          // v(t)
          vt.setView([0, TS], [0, Math.max(5.5, v0 * 1.1)]);
          vt.path(sim.ts.map((q, i) => [q, sim.vsp[i]]), { color: 'accent', width: 2 });
          vt.dot(tau, vNow, { r: 5, color: 'gold' });
          // d(μ)
          dm.fn((q) => v0 * v0 / (2 * q * G0), { color: 'orange', width: 2 });
          dm.dots(pts.filter((p) => isFinite(p[1])), { r: 3.5, color: 'ink' });
          if (m > 0) dm.dot(Math.max(m, 0.001), Math.min(d, 1e4), { r: 6, color: 'accent' });
          else dm.corner('μ = 0: never stops', 'tr', { color: 'accent', weight: 600 });
        }, { still: 5 });
        v.legend([['orange', 'prediction $v_0^2/(2\\mu g)$'], ['ink', 'simulated', { dot: true }], ['gold', 'strobe images (0.5 s)', { dot: true }]]);
        v.readout(() => st && (isFinite(st.d)
          ? `Simulated stopping distance $${v.fix(st.d, 3)}$ m vs $v_0^2/(2\\mu g) = ${v.fix(st.pred, 3)}$ m · stopping time $v_0/(\\mu g) = ${v.fix(v0s.value / (mu.value * G0), 2)}$ s · now $v = ${v.fix(st.v, 2)}$ m/s`
          : `$\\mu = 0$: no net force, so $v = ${v.fix(st.v, 3)}$ m/s forever — the puck has travelled $${v.fix(st.x, 2)}$ m and is still going.`));
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Law',
      name: 'Newton’s second law',
      credit: 'Newton, 1687',
      statement: String.raw`In an inertial frame, a particle of (inertial) mass $m>0$ acted on by forces $\mathbf F_1,\dots,\mathbf F_k$ accelerates according to
$$m\,\ddot{\mathbf r}=\mathbf F_{\rm net}=\sum_i\mathbf F_i(\mathbf r,\dot{\mathbf r},t),$$
equivalently $\dot{\mathbf p}=\mathbf F_{\rm net}$ with momentum $\mathbf p=m\mathbf v$. Given the force law, this is a second-order ODE whose solution, from a position and a velocity, is the motion.`,
      scope: String.raw`Holds in inertial frames, for speeds much smaller than $c$ (otherwise special relativity) and for bodies large enough that quantum effects are negligible. Forces add as vectors.`,
      idea: String.raw`The law both defines force (by its effect) and makes it predictive: once a force law is known — springs, gravity, friction — $\ddot{\mathbf r}=\mathbf F/m$ fixes the acceleration at every instant, and integrating twice gives the trajectory (uniqueness is 1.9). Mass measures resistance to acceleration: the same force produces half the acceleration on twice the mass.`,
      caption: String.raw`Drag the orange handle to set the force (a constant push, or the anchor of a spring) and choose the mass. The path is integrated live with velocity Verlet; the faint dashed path is the same experiment with mass $2m$. The pink arrow is the acceleration measured from the simulated positions — it is always $\mathbf F/m$.`,
      deps: ['mech-1.4', 'mech-1.1'],
      refs: ['Taylor §1.4', 'Goldstein §1.1'],
      tags: ['newton', 'force'],
      viz(v) {
        const M = v.M;
        const law = v.select('force', [{ value: 'push', label: 'constant push' }, { value: 'spring', label: 'spring to an anchor' }], 'push');
        const ms = v.slider('mass $m$ (kg)', 0.5, 4, 1.5, { step: 0.05 });
        const s = v.stage({ x: [-3.2, 3.2], y: [-2.1, 2.1], equal: true, height: 360, axes: false });
        const dial = [-2.3, 1.25], kF = 1.2, kS = 1.5, RD = 0.85;
        const hF = s.handle(dial[0] + 0.35, dial[1] - 0.5, { color: 'orange', label: 'F', constrain: (x, y) => { const d = [x - dial[0], y - dial[1]], L = vlen(d), m = RD; return L > m ? [dial[0] + d[0] * m / L, dial[1] + d[1] * m / L] : [x, y]; } });
        const hA = s.handle(0.4, 0.2, { color: 'orange', label: 'anchor', constrain: { x: [-2.5, 2.5], y: [-1.6, 1.6] } });
        const S0 = [-2.6, 0], V0 = [1.6, 0];
        let cache = null, key = '', st = null;
        const simulate = (m, push) => {
          const T = push ? 3 : 9, dt = 0.004, n = Math.round(T / dt);
          const F = push ? () => [(hF.x - dial[0]) / kF, (hF.y - dial[1]) / kF] : (x) => [-kS * (x[0] - hA.x), -kS * (x[1] - hA.y)];
          const r = M.verlet((x) => { const f = F(x); return [f[0] / m, f[1] / m]; }, S0, V0, dt, n);
          return { ...r, F, dt, T };
        };
        v.animate((t) => {
          const push = law.value === 'push', m = ms.value;
          hF.visible = push; hA.visible = !push;
          const k = [law.value, m, hF.x, hF.y, hA.x, hA.y].join();
          if (k !== key) { key = k; cache = { a: simulate(m, push), b: simulate(2 * m, push) }; }
          const { a, b } = cache, n = a.t.length, i = Math.min(n - 2, Math.max(1, Math.round((t % a.T) / a.dt)));
          const p = a.x[i], F = a.F(p);
          const acc = [(a.x[i + 1][0] - 2 * p[0] + a.x[i - 1][0]) / (a.dt * a.dt), (a.x[i + 1][1] - 2 * p[1] + a.x[i - 1][1]) / (a.dt * a.dt)];
          // the spring's period, measured from the simulated x-coordinate (zero crossings of x − anchor)
          let per = null;
          if (!push) { const zs = []; for (let j = 1; j < n; j++) { const u0 = a.x[j - 1][0] - hA.x, u1 = a.x[j][0] - hA.x; if (u0 * u1 < 0) zs.push(a.t[j - 1] + a.dt * u0 / (u0 - u1)); } if (zs.length >= 3) per = 2 * (zs[zs.length - 1] - zs[0]) / (zs.length - 1); }
          st = { acc: vlen(acc), pred: vlen(F) / m, F: vlen(F), per, push, m, devA: push ? vlen(M.vsub(a.x[n - 1], M.vadd(S0, M.vscale(V0, a.T)))) : 0, devB: push ? vlen(M.vsub(b.x[b.t.length - 1], M.vadd(S0, M.vscale(V0, b.T)))) : 0 };
          if (push) {
            s.circle(dial[0], dial[1], RD, { color: 'faint', dash: [3, 3], width: 1 });
            vec(s, dial, [hF.x - dial[0], hF.y - dial[1]], 1, { color: 'orange', width: 3 });
            s.text('force dial', dial[0], dial[1] + RD + 0.12, { color: 'muted', size: 11, align: 'center' });
            s.line(S0[0], S0[1], S0[0] + V0[0] * a.T, S0[1] + V0[1] * a.T, { color: 'faint', dash: [2, 4], width: 1 });
          } else {
            spring(s, [hA.x, hA.y], p, 9, 0.08, { color: 'muted', width: 1.3 });
          }
          s.path(b.x, { color: 'muted', width: 1.4, dash: [5, 4] });
          s.path(a.x, { color: 'accent', width: 2.2 });
          s.dot(S0[0], S0[1], { r: 3, color: 'ink' });
          vec(s, p, F, kF, { color: 'orange', width: 7, alpha: 0.45, head: 14 });
          vec(s, p, acc, kF, { color: 'pink', width: 2.4 });
          s.tex('\\mathbf F', p[0] + kF * F[0], p[1] + kF * F[1], { color: 'orange', dx: 10, dy: 4, size: 13 });
          if (vlen(acc) * kF > 0.15) s.tex('\\ddot{\\mathbf r}', p[0] + kF * acc[0], p[1] + kF * acc[1], { color: 'pink', dx: -16, size: 13 });
          s.dot(p[0], p[1], { r: 6 + 2.5 * Math.cbrt(m), color: 'gold' });
        }, { still: 1.6 });
        v.legend([['accent', 'path, mass $m$'], ['muted', 'path, mass $2m$', { dash: true }], ['orange', 'force $\\mathbf F$'], ['pink', 'measured $\\ddot{\\mathbf r}$ (same scale as $\\mathbf F$ at 1 kg)']]);
        v.readout(() => st && (`Measured $|\\ddot{\\mathbf r}| = ${v.fix(st.acc, 4)}$ m/s², $|\\mathbf F|/m = ${v.fix(st.pred, 4)}$ m/s² ($|\\mathbf F| = ${v.fix(st.F, 3)}$ N, $m = ${v.fix(st.m, 2)}$ kg). ` + (st.push
          ? `Deflection from the straight line after 3 s: $${v.fix(st.devA, 3)}$ m for $m$, $${v.fix(st.devB, 3)}$ m for $2m$ (ratio ${v.fix(st.devA / Math.max(st.devB, 1e-12), 3)}).`
          : `Period measured ${st.per ? v.fix(st.per, 3) : '—'} s vs $2\\pi\\sqrt{m/k} = ${v.fix(2 * Math.PI * Math.sqrt(st.m / 1.5), 3)}$ s ($k = 1.5$ N/m).`)));
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Law',
      name: 'Newton’s third law',
      credit: 'Newton, 1687',
      statement: String.raw`If body 1 exerts a force $\mathbf F_{21}$ on body 2, then body 2 exerts on body 1 a force $\mathbf F_{12}=-\mathbf F_{21}$, at every instant (weak form). For central forces such as springs, gravity and electrostatics the two forces moreover act along the line joining the bodies (strong form).`,
      scope: String.raw`Holds for contact forces and for central forces acting instantaneously at a distance. It fails for velocity-dependent electromagnetic forces between moving charges: there the field itself carries momentum, and only the conservation of total (matter + field) momentum survives.`,
      idea: String.raw`The third law is what makes internal forces cancel in pairs, so the total momentum of an isolated system is conserved (2.2). For two skaters joined by a spring, the spring pulls on both ends with the same tension at every instant, so the forces are mirror images in time and the centre of mass never moves. For two charges moving at right angles, the magnetic force that each exerts on the other (Biot–Savart at low speed) is *not* the negative of the other.`,
      caption: String.raw`**Skaters**: choose the masses; the spring's forces on the two skaters (arrows, and the time plot below) are equal and opposite at every instant, though the light skater moves more. **Moving charges**: drag the charges; the magnetic forces generally do not cancel — the force polygon below fails to close. Choose *parallel velocities* and it closes again.`,
      deps: ['mech-1.6'],
      refs: ['Taylor §1.5'],
      tags: ['newton', 'force'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'spring', label: 'skaters + spring' }, { value: 'mag', label: 'moving charges' }], 'spring');
        const m1s = v.slider('$m_1$ (kg)', 20, 100, 45, { step: 1 });
        const m2s = v.slider('$m_2$ (kg)', 20, 100, 80, { step: 1 });
        const par = v.toggle('parallel velocities', false);
        const s = v.stage({ x: [-3.4, 3.4], y: [-1.5, 1.5], equal: true, height: 250, axes: false, full: true });
        const b = v.stage({ x: [0, 8], y: [-300, 300], height: 190, axes: true, full: true });
        const q1 = s.handle(-1.4, -0.15, { color: 'red', label: 'q₁', constrain: { x: [-3.2, 3.2], y: [-1.3, 1.3] } });
        const q2 = s.handle(0.8, 0.55, { color: 'red', label: 'q₂', constrain: { x: [-3.2, 3.2], y: [-1.3, 1.3] } });
        const K = 120, L0 = 2.4, d0 = 1.2, TT = 8;
        let sim = null, key = '', st = null;
        const run = (m1, m2) => {
          const x1 = -d0 * m2 / (m1 + m2), x2 = d0 * m1 / (m1 + m2), dt = 0.002;
          const r = M.verlet((x) => { const f = K * ((x[1] - x[0]) - L0); return [f / m1, -f / m2]; }, [x1, x2], [0, 0], dt, Math.round(TT / dt));
          r.F1 = r.x.map((x) => K * ((x[1] - x[0]) - L0)); r.dt = dt;
          r.P = r.v.map((u) => m1 * u[0] + m2 * u[1]); r.cm = r.x.map((x) => (m1 * x[0] + m2 * x[1]) / (m1 + m2));
          return r;
        };
        v.animate((t) => {
          const spr = mode.value === 'spring';
          m1s.el.hidden = m2s.el.hidden = !spr; par.el.hidden = spr; q1.visible = q2.visible = !spr;
          if (spr) {
            const m1 = m1s.value, m2 = m2s.value, k = m1 + ':' + m2;
            if (k !== key) { key = k; sim = run(m1, m2); }
            const i = Math.min(sim.t.length - 1, Math.round((t % TT) / sim.dt)), x = sim.x[i], F = sim.F1[i];
            const R1 = 0.2 * Math.cbrt(m1 / 50), R2 = 0.2 * Math.cbrt(m2 / 50);
            s.hline(-0.66, { color: 'faint', width: 6, alpha: 0.4 });
            spring(s, [x[0] + R1, 0], [x[1] - R2, 0], 10, 0.1, { color: 'muted', width: 1.4 });
            s.circle(x[0], 0, R1, { fill: 'blue', fillAlpha: 0.85, color: 'blue' });
            s.circle(x[1], 0, R2, { fill: 'purple', fillAlpha: 0.85, color: 'purple' });
            s.tex('m_1', x[0], -R1 - 0.05, { color: 'blue', align: 'center', baseline: 'top', size: 13 }); s.tex('m_2', x[1], -R2 - 0.05, { color: 'purple', align: 'center', baseline: 'top', size: 13 });
            const kf = 0.011;
            vec(s, [x[0], 0.45], [F, 0], kf, { color: 'orange', width: 3 }); vec(s, [x[1], 0.45], [-F, 0], kf, { color: 'orange', width: 3 });
            s.tex('\\mathbf F_{12}', x[0], 0.62, { color: 'orange', align: 'center', baseline: 'bottom', size: 13 });
            s.tex('\\mathbf F_{21}', x[1], 0.62, { color: 'orange', align: 'center', baseline: 'bottom', size: 13 });
            s.vline(sim.cm[i], { color: 'green', dash: [4, 4], width: 1.2 });
            s.text('centre of mass', sim.cm[i], -1.25, { color: 'green', size: 11, align: 'center' });
            const Fm = Math.max(...sim.F1.map(Math.abs)) * 1.2;
            b.setView([0, TT], [-Fm, Fm]); b.setTicks(null, null); b.setTitle('forces on 1 and on 2 (N) vs time (s)');
            b.path(sim.t.map((q, j) => [q, sim.F1[j]]), { color: 'blue', width: 2 });
            b.path(sim.t.map((q, j) => [q, -sim.F1[j]]), { color: 'purple', width: 2 });
            b.path(sim.t.map((q) => [q, 0]), { color: 'green', width: 2.5, dash: [6, 4] });
            b.vline(sim.t[i], { color: 'gold', width: 1.5 });
            const pmax = Math.max(...sim.P.map(Math.abs)), cmd = Math.max(...sim.cm.map(Math.abs));
            st = { spr, F, x, pmax, cmd, dv: [sim.v[i][0], sim.v[i][1]] };
          } else {
            // low-speed Biot–Savart forces between two point charges (units μ0 q1 q2 / 4π = 1)
            const r1 = [q1.x, q1.y], r2 = [q2.x, q2.y], v1 = [1, 0], v2 = par.value ? [1, 0] : [0, 1];
            const Bz = (vs, rs, at) => { const d = [at[0] - rs[0], at[1] - rs[1]], L = vlen(d); return (vs[0] * d[1] - vs[1] * d[0]) / (L * L * L); };
            const B1 = Bz(v1, r1, r2), B2 = Bz(v2, r2, r1);
            const F21 = [v2[1] * B1, -v2[0] * B1], F12 = [v1[1] * B2, -v1[0] * B2];
            const sum = M.vadd(F12, F21), big = Math.max(vlen(F12), vlen(F21), 1e-9), kf = 0.8 / big;
            s.line(r1[0], r1[1], r2[0], r2[1], { color: 'faint', dash: [3, 3] });
            vec(s, r1, v1, 0.7, { color: 'accent', width: 2 }); vec(s, r2, v2, 0.7, { color: 'accent', width: 2 });
            s.tex('\\mathbf v_1', r1[0] + 0.7 * v1[0], r1[1] + 0.7 * v1[1], { color: 'accent', dx: 6, dy: -6, size: 13 });
            s.tex('\\mathbf v_2', r2[0] + 0.7 * v2[0], r2[1] + 0.7 * v2[1], { color: 'accent', dx: 6, dy: -6, size: 13 });
            vec(s, r1, F12, kf, { color: 'orange', width: 3 }); vec(s, r2, F21, kf, { color: 'orange', width: 3 });
            s.tex('\\mathbf F_{12}', r1[0] + kf * F12[0], r1[1] + kf * F12[1], { color: 'orange', dx: 6, dy: 10, size: 13 });
            s.tex('\\mathbf F_{21}', r2[0] + kf * F21[0], r2[1] + kf * F21[1], { color: 'orange', dx: 6, dy: 10, size: 13 });
            s.corner('magnetic part of the force only (the Coulomb parts do cancel)', 'bl', { color: 'muted', size: 11 });
            const asp = b.width / b.height, hb = 1.1;
            b.setView([-hb * asp, hb * asp], [-hb, hb]); b.setTicks([], []); b.setTitle('force polygon: $\\mathbf F_{12}$ then $\\mathbf F_{21}$, tip to tail');
            const e1 = M.vscale(F12, kf), e2 = M.vadd(e1, M.vscale(F21, kf)), o = [-(Math.min(0, e1[0], e2[0]) + Math.max(0, e1[0], e2[0])) / 2, -(Math.min(0, e1[1], e2[1]) + Math.max(0, e1[1], e2[1])) / 2];
            vec(b, o, F12, kf, { color: 'orange', width: 2.6 }); vec(b, M.vadd(o, M.vscale(F12, kf)), F21, kf, { color: 'orange', width: 2.6 });
            if (vlen(sum) / big > 1e-6) vec(b, o, sum, kf, { color: 'red', width: 2.6, dash: [5, 3] });
            b.dot(o[0], o[1], { r: 3, color: 'ink' });
            st = { spr, rel: vlen(sum) / big, F12: vlen(F12), F21: vlen(F21) };
          }
        }, { still: 1.3 });
        v.legend([['blue', 'force on skater 1'], ['purple', 'force on skater 2'], ['green', 'their sum', { dash: true }], ['red', 'non-cancelling sum (charges)', { dash: true }]]);
        v.readout(() => st && (st.spr
          ? `Now $F_{12} = ${v.fix(st.F, 1)}$ N, $F_{21} = ${v.fix(-st.F, 1)}$ N, sum $0$ at every instant. Velocities ${v.fix(st.dv[0], 3)} and ${v.fix(st.dv[1], 3)} m/s (ratio $= -m_2/m_1$). Total momentum stays within $${v.sci(st.pmax + 1e-16, 1)}$ kg·m/s of 0; the centre of mass moves at most $${v.sci(st.cmd + 1e-16, 1)}$ m.`
          : `$|\\mathbf F_{12}| = ${v.fix(st.F12, 3)}$, $|\\mathbf F_{21}| = ${v.fix(st.F21, 3)}$ (units $\\mu_0q_1q_2v^2/4\\pi$ per m²) · $|\\mathbf F_{12}+\\mathbf F_{21}|/\\max|\\mathbf F| = ${v.fix(st.rel, 3)}$ — ${st.rel > 1e-6 ? '**the third law fails**; the electromagnetic field carries the missing momentum' : 'equal and opposite for parallel velocities'}.`));
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Principle',
      name: 'Galilean relativity',
      credit: 'Galileo, 1632',
      statement: String.raw`The laws of mechanics take the same form in every inertial frame. Two inertial frames are related by a **Galilean transformation** $\mathbf r'=R\mathbf r-\mathbf u t+\mathbf b$, $t'=t+s$ (rotation $R$, constant velocity $\mathbf u$, shifts $\mathbf b, s$); under a boost $\mathbf r'=\mathbf r-\mathbf u t$ velocities shift, $\mathbf v'=\mathbf v-\mathbf u$, but accelerations, masses and forces are unchanged, so $m\ddot{\mathbf r}=\mathbf F$ holds in both frames. No mechanical experiment can detect uniform motion of the laboratory.`,
      scope: String.raw`Holds for speeds much smaller than $c$; at relativistic speeds Galilean transformations are replaced by Lorentz transformations. It fails for frames that accelerate or rotate.`,
      idea: String.raw`Differentiate $\mathbf r'=\mathbf r-\mathbf u t$ twice: $\ddot{\mathbf r}'=\ddot{\mathbf r}$. Forces in mechanics depend on relative positions and relative velocities, which are unchanged by a boost, so Newton's second law (1.6) — and with it every prediction — is the same in the moving frame. Galileo's ship: a stone dropped from the mast lands at its foot whether or not the ship sails smoothly. If the frame accelerates, $\ddot{\mathbf r}'=\ddot{\mathbf r}-\ddot{\mathbf R}$ and an extra, fictitious force appears.`,
      caption: String.raw`A passenger tosses a ball straight up. Left: the train frame (a vertical line); right: the ground frame (a parabola). Change the train's speed: velocities (blue) differ between the panels but the measured accelerations (pink) are identical, and the ball comes back to the hand. Give the train an acceleration and the principle breaks: in the train frame the ball drifts and lands away from the hand.`,
      deps: ['mech-1.4', 'mech-1.6'],
      refs: ['Arnold §2', 'Taylor §1.4'],
      tags: ['frames', 'relativity'],
      viz(v) {
        const M = v.M;
        const us = v.slider('train speed $u$ (m/s)', 0, 8, 5, { step: 0.1 });
        const as = v.slider('train acceleration (m/s²)', -3, 3, 0, { step: 0.1 });
        const ws = v.slider('toss speed (m/s)', 2, 6, 4.5, { step: 0.1 });
        const L = v.stage({ x: [-2.6, 2.6], y: [-0.4, 3.05], height: 300, axes: 'box', title: 'train frame', xlabel: "x' (m)", ylabel: 'y (m)', weight: 0.75 });
        const R = v.stage({ x: [-1, 11.5], y: [-0.4, 3.05], height: 300, axes: 'box', title: 'ground frame', xlabel: 'x (m)', weight: 1.35 });
        let st = null, key = '', sim = null;
        v.animate((t) => {
          const u = us.value, a = as.value, w = ws.value, T = 2 * w / G0, y0 = 1;
          const k = [u, a, w].join();
          if (k !== key) { key = k; const n = 400; sim = M.verlet(() => [0, -G0], [0, y0], [u, w], T / n, n); sim.dt = T / n; }
          const tau = Math.min(t % (T + 0.8), T), i = Math.max(1, Math.min(sim.t.length - 2, Math.round(tau / sim.dt)));
          const X = (q) => u * q + 0.5 * a * q * q;
          const g = (j) => sim.x[j], tr = (j) => [sim.x[j][0] - X(sim.t[j]), sim.x[j][1]];
          const accOf = (f) => { const dt = sim.dt; return [(f(i + 1)[0] - 2 * f(i)[0] + f(i - 1)[0]) / (dt * dt), (f(i + 1)[1] - 2 * f(i)[1] + f(i - 1)[1]) / (dt * dt)]; };
          const velOf = (f) => { const dt = sim.dt; return [(f(i + 1)[0] - f(i - 1)[0]) / (2 * dt), (f(i + 1)[1] - f(i - 1)[1]) / (2 * dt)]; };
          const aG = accOf(g), aT = accOf(tr), vG = velOf(g), vT = velOf(tr);
          const land = tr(sim.t.length - 1)[0];
          st = { aG, aT, land, vG, vT };
          const car = (S, x0) => {
            S.rect(x0 - 2.2, -0.2, x0 + 2.2, 0, { fill: 'muted', fillAlpha: 0.5, stroke: false });
            S.path([[x0 - 2.2, 0], [x0 - 2.2, 2.9]], { color: 'muted', width: 2 }); S.path([[x0 + 2.2, 0], [x0 + 2.2, 2.9]], { color: 'muted', width: 2 });
            S.dot(x0 + 1.2, -0.2, { r: 5, color: 'ink' }); S.dot(x0 - 1.2, -0.2, { r: 5, color: 'ink' });
            S.path([[x0, 0], [x0, 0.75], [x0 + 0.02, y0]], { color: 'ink', width: 3 });
          };
          car(L, 0); car(R, X(tau));
          for (const [S, f, acc, vel] of [[L, tr, aT, vT], [R, g, aG, vG]]) {
            const pts = []; for (let j = 0; j <= i; j++) pts.push(f(j));
            S.path(pts, { color: 'accent', width: 2 });
            for (let j = 0; j <= i; j += 20) S.dot(f(j)[0], f(j)[1], { r: 2.5, color: 'accent' });
            const p = f(i);
            vec(S, p, vel, 0.12, { color: 'accent', width: 2.4 });
            vec(S, p, acc, 0.07, { color: 'pink', width: 2.4 });
            S.dot(p[0], p[1], { r: 6, color: 'gold' });
          }
          if (Math.abs(a) > 1e-9 && tau >= T - 1e-9) L.dot(land, y0, { r: 6, color: 'red', hollow: true, label: 'lands here', labelPos: 'n' });
        }, { still: 0.62 });
        v.legend([['accent', 'velocity (differs between frames)'], ['pink', 'measured acceleration'], ['gold', 'ball', { dot: true }]]);
        v.readout(() => st && `Measured acceleration — train frame: $(${v.fix(st.aT[0], 3)},\\,${v.fix(st.aT[1], 3)})$, ground frame: $(${v.fix(st.aG[0], 3)},\\,${v.fix(st.aG[1], 3)})$ m/s². Horizontal velocity: ${v.fix(st.vT[0], 2)} vs ${v.fix(st.vG[0], 2)} m/s. ` + (Math.abs(as.value) < 1e-9 ? 'Same acceleration, same law: the ball returns to the hand.' : `**Train accelerating**: the accelerations differ by ${v.fix(-as.value, 2)} m/s² and the ball lands $${v.fix(st.land, 2)}$ m from the hand (prediction $-\\tfrac12 a_{\\rm train}T^2 = ${v.fix(-0.5 * as.value * (2 * ws.value / G0) ** 2, 2)}$ m).`));
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Theorem',
      name: 'Determinism: existence and uniqueness of motion',
      statement: String.raw`Let the force $\mathbf F(\mathbf r,\dot{\mathbf r},t)$ on a particle of mass $m$ be continuous and locally Lipschitz in $(\mathbf r,\dot{\mathbf r})$. Then for every initial position $\mathbf r_0$ and velocity $\mathbf v_0$ at time $t_0$ there is an interval $|t-t_0|<\tau$ on which Newton's equation $m\ddot{\mathbf r}=\mathbf F$ has exactly one solution with $\mathbf r(t_0)=\mathbf r_0$, $\dot{\mathbf r}(t_0)=\mathbf v_0$. If $\mathbf F$ is globally Lipschitz the solution exists for all time. Thus the present state (positions and velocities) determines the past and future motion.`,
      idea: String.raw`Write the motion as a first-order system for $y=(\mathbf r,\mathbf v)$, $\dot y=f(y,t)$ with $f=(\mathbf v,\mathbf F/m)$, and integrate: $y(t)=y_0+\int_{t_0}^t f(y(s),s)\,ds$. The right-hand side defines the **Picard map**; with Lipschitz constant $L$ its $k$-th iterate contracts distances by $(L\tau)^k/k!$, so the Banach fixed-point theorem gives one and only one solution (Picard–Lindelöf). Without the Lipschitz condition uniqueness can fail — see Norton's dome (1.10) — and without global bounds the solution can escape to infinity in finite time.`,
      caption: String.raw`Step through the Picard iterates. For the pendulum ($L=1$) they lock onto the true trajectory (green) one sweep at a time, on any window; the lower panel shows the sup-distance between successive iterates falling under the bound $d_0(LT)^k/k!$. Switch to $\dot x=x^2$: the solution $1/(1-t)$ escapes to infinity at $t=1$, and beyond that time the iterates diverge — existence is only local.`,
      deps: ['mech-1.6', 'pma-9.23', 'ode-2.4'],
      refs: ['Arnold §1'],
      tags: ['determinism', 'ode'],
      viz(v) {
        const SYS = {
          pend: { label: 'pendulum $\\ddot\\theta=-\\sin\\theta$', f: (y) => [y[1], -Math.sin(y[0])], y0: [2.2, 0], L: 1, yr: [-3, 3] },
          blow: { label: '$\\dot x = x^2$, $x(0)=1$', f: (y) => [y[0] * y[0]], y0: [1], L: null, yr: [0, 9] },
        };
        const K = 12, N = 1200;
        const sys = v.select('', Object.entries(SYS).map(([value, S]) => ({ value, label: S.label })), 'pend', { onChange: () => S.reset({ at: 'keep' }) });
        const Tp = v.slider('window $T$', 0.5, 8, 4.5, { step: 0.05, onChange: () => S.reset({ at: 'keep' }) });
        const Tb = v.slider('window $T$', 0.3, 1.6, 1.3, { step: 0.01, onChange: () => S.reset({ at: 'keep' }) });
        const top = v.stage({ x: [0, 4.5], y: [-3, 3], height: 300, axes: 'box', xlabel: 't', full: true });
        const bot = v.stage({ x: [-0.5, K + 0.5], y: [1e-12, 1e3], ylog: true, height: 200, axes: 'box', xlabel: 'k', title: 'sup-distance between successive iterates', full: true });
        let run = null;
        const build = () => {
          const Sy = SYS[sys.value], T = sys.value === 'pend' ? Tp.value : Tb.value, h = T / N, ts = Array.from({ length: N + 1 }, (_, i) => i * h);
          let Y = ts.map(() => Sy.y0.slice()); const its = [Y], ds = [];
          for (let k = 0; k < K; k++) {
            const F = Y.map(Sy.f), Z = [Sy.y0.slice()];
            for (let i = 1; i <= N; i++) Z.push(Z[i - 1].map((z, j) => z + 0.5 * h * (F[i - 1][j] + F[i][j])));
            let d = 0; for (let i = 0; i <= N; i++) for (let j = 0; j < Z[i].length; j++) d = Math.max(d, Math.abs(Z[i][j] - Y[i][j]));
            ds.push(isFinite(d) ? d : Infinity); its.push(Z); Y = Z;
          }
          const exact = sys.value === 'pend' ? M.rk4((t, y) => Sy.f(y), 0, Sy.y0, T, N).map(([t, y]) => [t, y[0]]) : ts.filter((t) => t < 0.985).map((t) => [t, 1 / (1 - t)]);
          run = { ts, its, ds, T, exact, Sy };
          return Array.from({ length: K + 1 }, (_, k) => ({ k, note: k === 0 ? 'Start from the constant guess $y_0(t)\\equiv y(0)$.' : `Iterate ${k}: $y_{${k}}(t)=y_0+\\int_0^t f(y_{${k - 1}}(s))\\,ds$.` }));
        };
        const M = v.M;
        const S = v.steps({ frames: build, speed: 1.2, start: 4, still: 6 });
        v.render(() => {
          const f = S.frame, k = f.k ?? 0, R = run, Sy = R.Sy;
          Tp.el.hidden = sys.value !== 'pend'; Tb.el.hidden = sys.value === 'pend';
          top.setView([0, R.T], Sy.yr);
          top.setTitle(sys.value === 'pend' ? 'angle $\\theta(t)$: Picard iterates and the true motion' : '$x(t)$: Picard iterates and the true solution');
          if (sys.value === 'blow') top.vline(1, { color: 'red', dash: [5, 4], width: 1.4 });
          top.path(R.exact, { color: 'green', width: 5, alpha: 0.45 });
          for (let j = 0; j <= k; j++) {
            const pts = R.ts.map((t, i) => { const y = R.its[j][i][0]; return Math.abs(y) < 1e3 ? [t, y] : null; });
            top.path(pts, { color: j === k ? 'accent' : 'purple', width: j === k ? 2.6 : 1.1, alpha: j === k ? 1 : 0.25 + 0.5 * j / Math.max(1, k) });
          }
          // lower panel
          for (let j = 0; j < R.ds.length; j++) {
            const d = R.ds[j]; if (!(d > 0)) continue;
            bot.dot(j, Math.min(Math.max(d, 1.2e-12), 9e2), { r: j === k ? 6 : 4, color: j < k ? 'accent' : 'faint', hollow: j >= k });
          }
          if (Sy.L) bot.path(Array.from({ length: K }, (_, j) => [j, R.ds[0] * Math.pow(Sy.L * R.T, j) / M.factorial(j)]), { color: 'orange', dash: [5, 4], width: 1.6 });
          bot.hline(Sy.L ? 1e-12 : 1e-12, { color: 'faint' });
        });
        v.legend([['green', 'true solution'], ['accent', 'current iterate'], ['purple', 'earlier iterates'], ['orange', 'bound $d_0(LT)^k/k!$', { dash: true }]]);
        v.readout(() => {
          const R = run, k = S.frame.k ?? 0, Sy = R.Sy;
          const lim = sys.value === 'pend' ? R.ts.length : R.ts.findIndex((t) => t >= Math.min(R.T, 0.95));
          let err = 0; const ex = sys.value === 'pend' ? R.exact.map((p) => p[1]) : R.ts.map((t) => 1 / (1 - t));
          for (let i = 0; i < (lim < 0 ? R.ts.length : lim); i++) err = Math.max(err, Math.abs(R.its[k][i][0] - ex[i]));
          const dk = k > 0 ? R.ds[k - 1] : null;
          return `Iterate $k=${k}$: sup-distance to the previous iterate ${dk == null ? '—' : `$${v.sci(dk, 2)}$`}; to the true solution on ${sys.value === 'pend' ? `$[0,${v.fix(R.T, 2)}]$` : `$[0,${v.fix(Math.min(R.T, 0.95), 2)}]$`}: $${v.sci(err, 2)}$. ` +
            (sys.value === 'pend' ? `Globally Lipschitz ($L=1$): the iterates converge on every window.` : (R.T > 1 ? `**The window passes the blow-up time $t=1$**: the iterates' sup-distances grow — no solution exists on $[0,${v.fix(R.T, 2)}]$.` : `No global Lipschitz constant; Picard–Lindelöf guarantees only $t\\le 1/4$ (with $|x-1|\\le1$), the solution actually lives on $[0,1)$.`));
        });
      },
    },
  ],
};
