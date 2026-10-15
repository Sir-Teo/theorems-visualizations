// Ordinary Differential Equations & Dynamical Systems — Chapter 1 (part b): first-order equations and flows on the line

// ---------- shared helpers (duplicated from ch01.js: content modules cannot import each other) ----------
function rk4s(f, t, x, h) {
  const k1 = f(t, x), k2 = f(t + h / 2, x + (h / 2) * k1), k3 = f(t + h / 2, x + (h / 2) * k2), k4 = f(t + h, x + h * k3);
  return x + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}
/** RK4 for x' = f(t, x) from (t0, x0) toward t1, steps ≤ h and ≤ a few per cent of |x|; stops when |x| > cap (out.escape). */
function trace(f, t0, x0, t1, o = {}) {
  const h = o.h ?? 0.01, cap = o.cap ?? 1e3, dir = t1 >= t0 ? 1 : -1, out = [[t0, x0]];
  let t = t0, x = x0;
  for (let i = 0; i < (o.max ?? 40000); i++) {
    const rem = (t1 - t) * dir; if (rem <= 1e-12) break;
    const sp = Math.abs(f(t, x));
    const dt = Math.min(h, rem, ((o.rel ?? 0.04) * Math.abs(x) + (o.abs ?? 0.02)) / (sp || 1e-300));
    const xn = rk4s(f, t, x, dir * dt);
    if (!isFinite(xn) || Math.abs(xn) > cap) { out.escape = t + dir * dt; break; }
    t += dir * dt; x = xn; out.push([t, x]);
    if (o.stop && o.stop(t, x)) break;
  }
  return out;
}
/** Fixed-step RK4 for a planar system Y' = F(t, Y), Y = [x, y]. → [[t, x, y], …] (stops if |Y| > cap). */
function trace2(F, t0, Y0, t1, h = 0.01, cap = 1e3) {
  const n = Math.max(1, Math.ceil(Math.abs(t1 - t0) / h)), dt = (t1 - t0) / n, out = [[t0, Y0[0], Y0[1]]];
  let t = t0, [x, y] = Y0;
  for (let i = 0; i < n; i++) {
    const k1 = F(t, x, y), k2 = F(t + dt / 2, x + (dt / 2) * k1[0], y + (dt / 2) * k1[1]), k3 = F(t + dt / 2, x + (dt / 2) * k2[0], y + (dt / 2) * k2[1]), k4 = F(t + dt, x + dt * k3[0], y + dt * k3[1]);
    x += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); t = t0 + (i + 1) * dt;
    if (!isFinite(x) || !isFinite(y) || Math.hypot(x, y) > cap) break;
    out.push([t, x, y]);
  }
  return out;
}
function at(pts, t) {
  const n = pts.length; if (!n) return NaN;
  const inc = pts[n - 1][0] >= pts[0][0], lo = inc ? pts[0][0] : pts[n - 1][0], hi = inc ? pts[n - 1][0] : pts[0][0];
  if (t < lo - 1e-12 || t > hi + 1e-12) return NaN;
  if (n === 1) return pts[0][1];
  let a = 0, b = n - 1;
  while (b - a > 1) { const m = (a + b) >> 1; if ((pts[m][0] - t) * (inc ? 1 : -1) <= 0) a = m; else b = m; }
  const [ta, xa] = pts[a], [tb, xb] = pts[b];
  return tb === ta ? xa : xa + ((xb - xa) * (t - ta)) / (tb - ta);
}
function zerosOf(f, a, b, n = 600) {
  const zs = []; let xp = a, fp = f(a);
  if (fp === 0) zs.push(a);
  for (let i = 1; i <= n; i++) {
    const x = a + ((b - a) * i) / n, fx = f(x);
    if (fx === 0) zs.push(x);
    else if (fp * fx < 0) {
      let lo = xp, hi = x, flo = fp;
      for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, fm = f(m); if (fm === 0) { lo = hi = m; break; } if (fm * flo < 0) hi = m; else { lo = m; flo = fm; } }
      zs.push((lo + hi) / 2);
    }
    xp = x; fp = fx;
  }
  return zs;
}
function classify(f, z, d = 1e-3) {
  const l = f(z - d), r = f(z + d);
  if (l > 0 && r < 0) return { type: 'stable', dir: 0 };
  if (l < 0 && r > 0) return { type: 'unstable', dir: 0 };
  return { type: 'half', dir: l + r > 0 ? 1 : -1 };
}
function fpGlyph(v, s, x, y, type, fill = Math.PI, r = 6) {
  if (type === 'stable') { s.dot(x, y, { r, color: 'green' }); return; }
  if (type === 'unstable') { s.dot(x, y, { r, color: 'red', hollow: true, width: 2.2 }); return; }
  s.dot(x, y, { r, color: 'orange', hollow: true, width: 2.2 });
  const c = s.ctx, X = s.X(x), Y = s.Y(y);
  c.save(); c.beginPath(); c.moveTo(X, Y); c.arc(X, Y, r - 0.6, fill - Math.PI / 2, fill + Math.PI / 2); c.closePath(); c.fillStyle = v.color('orange'); c.fill(); c.restore();
}
function phaseArrows(s, f, zs, a, b, at0, st = {}) {
  const cuts = [a, ...zs.filter((z) => z > a && z < b).sort((p, q) => p - q), b];
  const vert = !!st.vertical, scale = vert ? Math.abs(s.Y(1) - s.Y(0)) : Math.abs(s.X(1) - s.X(0));
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i], hi = cuts[i + 1], px = (hi - lo) * scale; if (px < 22) continue;
    const m = (lo + hi) / 2, sg = Math.sign(f(m)); if (!sg) continue;
    const L = Math.min(px * 0.42, st.len ?? 34) / scale;
    if (vert) s.arrow(at0, m - (sg * L) / 2, at0, m + (sg * L) / 2, { color: st.color ?? 'ink', width: st.width ?? 2.2 });
    else s.arrow(m - (sg * L) / 2, at0, m + (sg * L) / 2, at0, { color: st.color ?? 'ink', width: st.width ?? 2.2 });
  }
}
function spline(xs, ys) {
  const n = xs.length - 1, h = [], al = [], l = [1], mu = [0], z = [0], c = new Array(n + 1).fill(0), b = [], d = [];
  for (let i = 0; i < n; i++) h[i] = xs[i + 1] - xs[i];
  for (let i = 1; i < n; i++) al[i] = (3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1]);
  for (let i = 1; i < n; i++) { l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1]; mu[i] = h[i] / l[i]; z[i] = (al[i] - h[i - 1] * z[i - 1]) / l[i]; }
  for (let j = n - 1; j >= 0; j--) { c[j] = z[j] - mu[j] * c[j + 1]; b[j] = (ys[j + 1] - ys[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3; d[j] = (c[j + 1] - c[j]) / (3 * h[j]); }
  return (x) => {
    let j = n - 1; for (let i = 0; i < n; i++) if (x < xs[i + 1]) { j = i; break; }
    const u = x - xs[j]; return ys[j] + u * (b[j] + u * (c[j] + u * d[j]));
  };
}
function simpson(g, a, b, n = 400) {
  if (a === b) return 0;
  const hh = (b - a) / n; let s = g(a) + g(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * g(a + i * hh);
  return (s * hh) / 3;
}

export default {
  collection: 'ode',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Theorem',
      name: 'Impossibility of oscillations on the line',
      statement: String.raw`Let $f:\R\to\R$ be continuously differentiable. Every solution of the autonomous scalar equation $\dot x = f(x)$ is monotone: either $f(x(t_0)) = 0$ for some $t_0$ and then $x$ is constant, or $\dot x$ never vanishes and keeps one sign for all time. In particular the equation has no non-constant periodic solutions, and no solution ever turns around. Both hypotheses matter: a time-dependent equation $\dot x = f(x) + g(t)$, or an autonomous system in the plane, can oscillate.`,
      idea: String.raw`Suppose a solution turned around at time $t_1$, so $\dot x(t_1) = 0$. Then $f(x(t_1)) = 0$: the point $x^* = x(t_1)$ is a fixed point, and the constant function $x^*$ solves the same initial value problem. Uniqueness (chapter 2) forces $x\equiv x^*$. So on a non-constant solution $\dot x = f(x(t))$ never vanishes, and being continuous it has one sign. Geometrically: the velocity is a *function of position*, so a particle cannot pass the same point once moving right and once moving left. With a second variable or with explicit time dependence, the velocity at a given $x$ is no longer unique and the argument collapses.`,
      caption: String.raw`Edit $f$ with the blue handles and drag the starting value $x_0$ (right panel). Left: the graph of $f$ and the path traced by $(x(t),\dot x(t))$ in gold. On the line the gold path is stuck *on* the graph of $f$ and can only slide toward a zero — try any shape you like. Switch to *time-dependent* or *in the plane* and the gold path leaves the graph, loops, and $x(t)$ oscillates; red dots mark the turnarounds.`,
      deps: ['ode-1.7'],
      refs: ['Strogatz §2.6'],
      see: ['ode-2.15'],
      tags: ['phase line', 'monotonicity'],
      viz(v) {
        const mode = v.select('', [{ value: 'line', label: 'on the line: $\\dot x = f(x)$' }, { value: 'forced', label: 'time-dependent: $\\dot x = f(x) + A\\cos t$' }, { value: 'plane', label: 'in the plane: $\\dot x = f(x)+y,\\ \\dot y = -x$' }], 'line');
        const amp = v.slider('$A$', 0, 2, 1, { step: 0.01 });
        const TM = 25;
        const sf = v.stage({ x: [-2.7, 2.7], y: [-2.8, 2.8], height: 320, weight: 1, minWidth: 270, xlabel: 'x', ylabel: 'ẋ', title: 'velocity against position' });
        const sx = v.stage({ x: [-0.8, TM], y: [-2.7, 2.7], height: 320, weight: 1.3, minWidth: 300, xlabel: 't', ylabel: 'x', title: 'the solution $x(t)$' });
        const KX = [-2.5, -1.25, 0, 1.25, 2.5], KY = [1.0, -0.6, 0.5, 0.9, -1.1];
        const knots = KX.map((x, i) => sf.handle(x, KY[i], { color: 'accent', r: 6, constrain: (xx, yy) => [x, v.M.clamp(yy, -2.2, 2.2)] }));
        const X0 = sx.handle(0, -0.3, { color: 'gold', label: '$x_0$', labelPos: 'se', constrain: (x, y) => [0, v.M.clamp(y, -2.6, 2.6)] });
        let info = null;
        v.legend([['accent', 'graph of $f$'], ['gold', '$(x(t),\\dot x(t))$ and $x(t)$'], ['red', 'turnaround ($\\dot x = 0$ with a sign change)', { dot: true }]]);
        v.render(() => {
          amp.el.hidden = mode.value !== 'forced';
          const sp = spline(KX, knots.map((h) => h.y)), f = (x) => sp(v.M.clamp(x, -2.7, 2.7)) + (Math.abs(x) > 2.7 ? -Math.sign(x) * (Math.abs(x) - 2.7) : 0);
          const A = amp.value, x0 = X0.y;
          let pts; // [t, x, xdot]
          if (mode.value === 'line') pts = trace((t, x) => f(x), 0, x0, TM, { h: 0.02, cap: 1e3 }).map(([t, x]) => [t, x, f(x)]);
          else if (mode.value === 'forced') pts = trace((t, x) => f(x) + A * Math.cos(t), 0, x0, TM, { h: 0.01, cap: 1e3 }).map(([t, x]) => [t, x, f(x) + A * Math.cos(t)]);
          else pts = trace2((t, x, y) => [f(x) + y, -x], 0, [x0, 0], TM, 0.01).map(([t, x, y]) => [t, x, f(x) + y]);
          // left: graph of f, fixed points, the (x, ẋ) path
          sf.fn(f, { color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.07 });
          const zs = zerosOf(f, -2.7, 2.7, 400);
          if (mode.value === 'line') { phaseArrows(sf, f, zs, -2.7, 2.7, 0, { len: 28 }); for (const z of zs) { const c = classify(f, z); fpGlyph(v, sf, z, 0, c.type, c.dir > 0 ? Math.PI : 0); } }
          sf.clip(() => sf.path(pts.map((p) => [p[1], p[2]]), { color: 'gold', width: 2.4 }));
          const turns = [];
          for (let i = 1; i < pts.length; i++) if (pts[i - 1][2] * pts[i][2] < 0) turns.push(pts[i]);
          sf.clip(() => { for (const p of turns.slice(0, 60)) sf.dot(p[1], 0, { r: 3, color: 'red' }); });
          sf.dot(pts[0][1], pts[0][2], { r: 5, color: 'gold' });
          // right: x(t)
          if (mode.value === 'line') for (const z of zs) { const c = classify(f, z); sx.hline(z, { color: c.type === 'stable' ? 'green' : c.type === 'unstable' ? 'red' : 'orange', width: 1.2, dash: [6, 4], alpha: 0.7 }); }
          sx.clip(() => sx.path(pts.map((p) => [p[0], p[1]]), { color: 'gold', width: 2.6 }));
          sx.clip(() => { for (const p of turns) sx.dot(p[0], p[1], { r: 3.4, color: 'red' }); });
          let mono = true; for (let i = 2; i < pts.length; i++) if ((pts[i][1] - pts[i - 1][1]) * (pts[i - 1][1] - pts[0][1]) < -1e-12) { mono = false; break; }
          info = { turns: turns.length, mono, last: pts[pts.length - 1], zs, f };
        });
        v.readout(() => {
          if (!info) return '';
          const { turns, last, zs, f } = info;
          if (mode.value === 'line') {
            let near = null; for (const z of zs) if (near == null || Math.abs(z - last[1]) < Math.abs(near - last[1])) near = z;
            const goal = near != null && Math.abs(near - last[1]) < 0.05 ? String.raw` It creeps toward the fixed point $x^* = ${v.fix(near, 3)}$ (distance $${v.sci(Math.max(Math.abs(near - last[1]), 1e-16), 1)}$ at $t = ${TM}$) without ever reaching it.` : ' It leaves the window without turning.';
            return String.raw`Turnarounds of $x(t)$ on $0\le t\le ${TM}$: **${turns}**. Whatever the shape of $f$, $\dot x = f(x(t))$ keeps one sign: the gold path lies on the graph of $f$.` + goal;
          }
          if (mode.value === 'forced') return turns ? String.raw`Turnarounds: **${turns}**. With the forcing $A\cos t$ the velocity at a given $x$ depends on the time, so the gold path leaves the graph of $f$ and the solution oscillates.` : String.raw`No turnaround yet: raise the forcing amplitude $A$.`;
          return String.raw`Turnarounds: **${turns}**. With a second variable $y$ the velocity $\dot x = f(x)+y$ is not a function of $x$ alone; the trajectory circles in the plane and its projection $x(t)$ oscillates. Here $f(0) = ${v.fix(f(0), 2)}$ and the equilibrium is $(0, -f(0))$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Concept',
      name: 'Potentials for flows on the line',
      statement: String.raw`For $\dot x = f(x)$ with $f$ continuous on an interval, a *potential* is a function $V$ with $f = -V'$, for instance $V(x) = -\int_{x_0}^x f(s)\,ds$. Along every solution
$$\frac{d}{dt}V(x(t)) = V'(x)\,\dot x = -f(x(t))^2\le 0,$$
with equality only at fixed points: $V$ decreases strictly along non-constant solutions, so trajectories always move downhill. Fixed points are the critical points of $V$; local minima of $V$ are stable, local maxima unstable. The flow is that of a heavily damped particle, $m\ddot x + \dot x = -V'(x)$ in the limit of negligible mass $m\to0$.`,
      idea: String.raw`The chain rule gives $\dot V = -f^2$, so $V$ is a *Lyapunov function* for every scalar autonomous equation — something that fails in higher dimensions, where most vector fields are not gradients. Since $V$ can only decrease, a solution can never return to a level it has left: this is the impossibility of oscillations (1.9) in another guise, and a valley of $V$ traps every solution started in it. In the overdamped limit the inertial term is negligible and Newton's law $m\ddot x = -V'(x) - \dot x$ reduces to $\dot x = -V'(x) = f(x)$: position, not velocity, is set by the force.`,
      caption: String.raw`Drag the ball to a starting position on the potential and watch it roll; the lower panel plots $x(t)$. The orange curve is the solution of $\dot x = f(x)$, which the ball follows exactly. Raise the mass $m$ to add inertia: the hollow purple ball obeys $m\ddot x + \dot x = f(x)$, overshoots and oscillates in the valley, and approaches the first-order motion as $m\to0$. Tilt the potential with $h$ to merge a valley with a hill.`,
      deps: ['ode-1.7'],
      refs: ['Strogatz §2.7'],
      see: ['mech-3.3', 'ode-5.13', 'ode-5.8'],
      tags: ['potential', 'gradient flow', 'lyapunov function'],
      viz(v) {
        const POT = {
          dw: { label: 'double well $f = h + x - x^3$', f: (x, h) => h + x - x ** 3, V: (x, h) => -h * x - (x * x) / 2 + x ** 4 / 4, xr: [-1.62, 1.62], x0: -1.5 },
          wb: { label: 'washboard $f = h - \\sin x$', f: (x, h) => h - Math.sin(x), V: (x, h) => -h * x + 1 - Math.cos(x), xr: [-7, 7], x0: -2.6 },
        };
        const which = v.select('', Object.entries(POT).map(([value, o]) => ({ value, label: o.label })), 'dw', { onChange: (k) => { B.x = POT[k].x0; } });
        const hS = v.slider('tilt $h$', -0.6, 0.6, 0.15, { step: 0.01 });
        const mS = v.slider('mass $m$', 0, 1.5, 0.8, { step: 0.01 });
        const TM = 10, PER = 8;
        const sV = v.stage({ x: [-1.62, 1.62], y: [-0.6, 1.2], height: 280, full: true, xlabel: 'x', title: 'the potential $V(x) = -\\int f$' });
        const sx = v.stage({ x: [0, TM], y: [-1.62, 1.62], height: 190, full: true, xlabel: 't', ylabel: 'x', title: 'position against time' });
        const B = sV.handle(-1.5, 0, { color: 'gold', r: 7, constrain: (x) => { const E = POT[which.value]; const xx = v.M.clamp(x, E.xr[0] * 0.97, E.xr[1] * 0.97); return [xx, E.V(xx, hS.value)]; } });
        B.visible = false;
        let cache = { key: null }, info = null;
        v.legend([['orange', 'first order $\\dot x = f(x)$ (the ball)'], ['purple', 'with inertia $m\\ddot x+\\dot x = f(x)$', { dash: true }], ['green', 'valley = stable', { dot: true }], ['red', 'hill = unstable', { dot: true }]]);
        v.animate((tt) => {
          const E = POT[which.value], h = hS.value, m = mS.value, f = (x) => E.f(x, h), V = (x) => E.V(x, h);
          if (Math.abs(B.y - V(B.x)) > 1e-9 && !B.dragging) B.y = V(B.x);
          const x0 = B.x, key = `${which.value}|${h}|${m}|${x0}`;
          if (cache.key !== key) {
            const first = trace((t, x) => f(x), 0, x0, TM, { h: 0.005, cap: 1e3 });
            const inert = m > 0.001 ? trace2((t, x, u) => [u, (f(x) - u) / m], 0, [x0, 0], TM, Math.min(0.005, m / 20)) : null;
            let incr = -Infinity; for (let i = 1; i < first.length; i++) incr = Math.max(incr, V(first[i][1]) - V(first[i - 1][1]));
            let dev = 0; if (inert) for (const p of inert) dev = Math.max(dev, Math.abs(p[1] - at(first, p[0])));
            cache = { key, first, inert, incr, dev };
          }
          const { first, inert } = cache;
          // window for V
          const xs = v.M.linspace(E.xr[0], E.xr[1], 300), Vs = xs.map(V), lo = Math.min(...Vs), hi = Math.max(...Vs), pad = (hi - lo) * 0.12;
          sV.setView(E.xr, [lo - pad, hi + pad * 1.6]);
          sx.setView(null, E.xr);
          sV.fn(V, { color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.08, base: lo - pad });
          const zs = zerosOf(f, E.xr[0], E.xr[1], 600);
          for (const z of zs) { const c = classify(f, z); fpGlyph(v, sV, z, V(z), c.type, c.dir > 0 ? Math.PI : 0, 5.5); sx.hline(z, { color: c.type === 'stable' ? 'green' : 'red', width: 1.1, dash: [5, 4], alpha: 0.7 }); }
          // time
          const tau = ((tt % PER) / PER) * TM;
          sx.path(first, { color: 'orange', width: 2.6 });
          if (inert) sx.path(inert.map((p) => [p[0], p[1]]), { color: 'purple', width: 2, dash: [6, 4] });
          sx.vline(tau, { color: 'gold', width: 1, alpha: 0.5 });
          const xa = at(first, tau), xb = inert ? at(inert.map((p) => [p[0], p[1]]), tau) : NaN;
          sx.dot(tau, xa, { r: 5, color: 'orange' });
          if (isFinite(xb)) sx.dot(tau, xb, { r: 4.5, color: 'purple', hollow: true, width: 2 });
          // balls on the curve
          const R = 9, px = sV.X(1) - sV.X(0), py = sV.Y(0) - sV.Y(1);
          const put = (x, st) => {
            if (!isFinite(x)) return;
            const d = 1e-4, sl = (V(x + d) - V(x - d)) / (2 * d), tx = px, ty = -py * sl, tn = Math.hypot(tx, ty);
            const nx = ty / tn, ny = -tx / tn; // pixel normal pointing up (ny < 0)
            const X = sV.X(x) + nx * R * (ny < 0 ? 1 : -1), Y = sV.Y(V(x)) + ny * R * (ny < 0 ? 1 : -1);
            sV.dot(...sV.inv(X, Y), { r: R, ...st });
          };
          if (isFinite(xb)) put(xb, { color: 'purple', hollow: true, width: 2.4 });
          put(xa, { color: 'orange' });
          B.visible = true;
          info = { E, h, m, x0, xa, zs, f, V };
        }, { still: 0.4 });
        v.readout(() => {
          if (!info) return '';
          const { m, x0, f, V } = info, { first, incr, dev } = cache, xe = first[first.length - 1][1];
          let s1 = String.raw`$V$ along the solution fell from $V(x_0) = ${v.fix(V(x0), 4)}$ to $${v.fix(V(xe), 4)}$; its largest increase over any step is $${v.sci(Math.max(incr, 0) || 0, 1)}$ — it never goes uphill, since $\dot V = -f^2$.`;
          const d1 = v.M.deriv(f, xe, 1e-4);
          if (Math.abs(f(xe)) < 1e-3) s1 += String.raw` The ball settles at $x^* = ${v.fix(xe, 3)}$, a valley: $V''(x^*) = -f'(x^*) = ${v.fix(-d1, 3)} > 0$.`;
          if (m > 0.001) s1 += String.raw` With inertia $m = ${v.fix(m, 2)}$ the two motions differ by at most $${v.fix(dev, 3)}$; lower $m$ and the gap closes.`;
          else s1 += ' Mass zero: the purple ball is switched off.';
          return s1;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Model',
      name: 'Logistic growth with constant harvesting',
      statement: String.raw`A logistically growing stock harvested at a constant rate $h\ge0$ obeys $\dot x = rx(1 - x/K) - h$. For $h < rK/4$ there are two equilibria
$$x_\pm = \frac K2\Big(1\pm\sqrt{1 - 4h/rK}\Big),$$
the upper one stable and the lower one unstable: stocks above $x_-$ recover to $x_+$, stocks below $x_-$ collapse. As $h$ increases the two approach each other, merge at $x = K/2$ when $h = rK/4$ (the maximum sustainable yield) and disappear for $h > rK/4$ — a saddle-node bifurcation. Beyond it every population reaches $0$ in finite time; just past the threshold the decline is slow near $K/2$, where the vanished equilibria leave a bottleneck.`,
      scope: String.raw`A well-mixed stock with logistic regeneration and a fixed quota, deterministic and without delays. Real fisheries add noise, age structure and economic feedback, which make collapse occur even below $rK/4$.`,
      idea: String.raw`The equilibria are the intersections of the parabola $rx(1-x/K)$ with the horizontal line at height $h$; the phase line (1.7) shows that $\dot x>0$ between them and $\dot x<0$ outside, which gives their stability. Raising $h$ slides the line up until it touches the vertex at height $rK/4$, after which $\dot x<0$ everywhere and $\dot x\le rK/4 - h<0$ forces extinction in finite time. Completing the square, $\dot x = -\frac rK\big[(x - K/2)^2 + q^2\big]$ with $q^2 = \frac Kr(h - rK/4)$, so the time to fall from $x_0$ to $0$ is $\frac{K}{rq}\big[\arctan\frac{x_0 - K/2}{q} + \arctan\frac{K}{2q}\big]$, which grows like $\pi K/(rq)$ as $q\to0$.`,
      caption: String.raw`Drag the harvest line (or the slider) up toward $h = rK/4 = 0.25$. Left: growth $x(1-x)$ versus harvest; green where the stock grows, red where it declines, with the equilibria on the phase line. Right: stocks from several starting levels; a red cross marks extinction. Bottom: the bifurcation diagram — the stable (solid) and unstable (dashed) branches meet at the fold, and past it nothing survives. Units: $x$ in multiples of $K$, time in $1/r$.`,
      deps: ['ode-1.6', 'ode-1.7'],
      refs: ['Hirsch–Smale–Devaney ch. 1'],
      see: ['mathbio-1.12', 'mathbio-1.13', 'ode-8.3'],
      tags: ['harvesting', 'saddle-node bifurcation'],
      viz(v) {
        const hS = v.slider('harvest $h$', 0, 0.4, 0.2, { step: 0.001 });
        const TM = 25;
        const sL = v.stage({ x: [-0.08, 1.3], y: [-0.12, 0.45], height: 290, weight: 1, minWidth: 270, xlabel: 'x', title: 'growth $x(1-x)$ against harvest $h$' });
        const sR = v.stage({ x: [-2.2, TM], y: [-0.05, 1.25], height: 290, weight: 1.2, minWidth: 300, xlabel: 't', ylabel: 'x', title: 'stocks $x(t)$' });
        const sB = v.stage({ x: [0, 0.4], y: [-0.05, 1.1], height: 200, full: true, axes: 'box', xlabel: 'h', ylabel: 'x*', title: 'bifurcation diagram: equilibria against $h$' });
        const Hh = sL.handle(1.18, 0.2, { color: 'accent', label: '$h$', labelPos: 'n', constrain: (x, y) => [1.18, v.M.clamp(y, 0, 0.4)] });
        Hh.onDrag = (hd) => hS.set(+hd.y.toFixed(3));
        let info = null;
        v.legend([['green', 'stable equilibrium'], ['red', 'unstable equilibrium', { dash: true }], ['accent', 'growth and harvest'], ['muted', 'stock trajectories']]);
        v.render(() => {
          const h = hS.value, f = (x) => x * (1 - x) - h, F = (t, x) => f(x);
          if (!Hh.dragging) Hh.y = h;
          const disc = 1 - 4 * h, xp = disc >= 0 ? (1 + Math.sqrt(disc)) / 2 : NaN, xm = disc >= 0 ? (1 - Math.sqrt(disc)) / 2 : NaN;
          // left
          sL.clip(() => {
            sL.between((x) => Math.max(x * (1 - x), h), () => h, -0.08, 1.3, { fill: 'green', fillAlpha: 0.22, n: 300 });
            sL.between((x) => Math.min(x * (1 - x), h), () => h, -0.08, 1.3, { fill: 'red', fillAlpha: 0.14, n: 300 });
          });
          sL.fn((x) => x * (1 - x), { color: 'ink', width: 2.4 });
          sL.hline(h, { color: 'accent', width: 2.2 });
          sL.hline(0.25, { color: 'muted', width: 1, dash: [3, 4] });
          sL.text('rK/4', -0.06, 0.25, { color: 'muted', size: 11, align: 'left', dy: -9, math: true });
          const zs = disc > 1e-12 ? [xm, xp] : disc >= 0 ? [0.5] : [];
          phaseArrows(sL, f, zs, -0.08, 1.3, 0, { len: 30 });
          if (disc > 1e-12) {
            sL.line(xm, 0, xm, h, { color: 'red', width: 1, dash: [3, 3] }); sL.line(xp, 0, xp, h, { color: 'green', width: 1, dash: [3, 3] });
            fpGlyph(v, sL, xm, 0, 'unstable'); fpGlyph(v, sL, xp, 0, 'stable');
          } else if (disc >= 0) fpGlyph(v, sL, 0.5, 0, 'half', Math.PI);
          // right: trajectories, stopped at extinction
          if (disc > 1e-12) { sR.hline(xp, { color: 'green', width: 1.6 }); sR.hline(xm, { color: 'red', width: 1.4, dash: [6, 4] }); }
          sR.hline(0, { color: 'red', width: 1, alpha: 0.4 });
          const ext = [];
          for (const x0 of [0.08, 0.22, 0.4, 0.6, 0.8, 1.0, 1.2]) {
            const q = trace(F, 0, x0, TM, { h: 0.02, cap: 10, stop: (t, x) => x < 0 });
            let tE = NaN;
            if (q[q.length - 1][1] < 0) { const [ta, xa] = q[q.length - 2], [tb, xb] = q[q.length - 1]; tE = ta + ((0 - xa) * (tb - ta)) / (xb - xa); q[q.length - 1] = [tE, 0]; }
            sR.path(q, { color: x0 === 1.0 ? 'accent' : 'muted', width: x0 === 1.0 ? 2.6 : 1.5 });
            if (isFinite(tE)) { sR.text('✕', tE, 0, { color: 'red', size: 14, align: 'center' }); ext.push([x0, tE]); }
          }
          // bottom: bifurcation diagram
          sB.fn((x) => (1 + Math.sqrt(1 - 4 * x)) / 2, { domain: [0, 0.25], color: 'green', width: 2.6 });
          sB.fn((x) => (1 - Math.sqrt(1 - 4 * x)) / 2, { domain: [0, 0.25], color: 'red', width: 2, dash: [6, 4] });
          for (const hh of [0.06, 0.16, 0.33]) for (const [y0, y1] of hh < 0.25 ? [[1.05, (1 + Math.sqrt(1 - 4 * hh)) / 2 + 0.06], [0.5, (1 + Math.sqrt(1 - 4 * hh)) / 2 - 0.06], [(1 - Math.sqrt(1 - 4 * hh)) / 2 - 0.04, 0.02]] : [[0.95, 0.65], [0.4, 0.1]]) {
            if (Math.abs(y1 - y0) > 0.06) sB.arrow(hh, y0, hh, y1, { color: 'muted', width: 1.4, alpha: 0.7 });
          }
          sB.dot(0.25, 0.5, { r: 4, color: 'ink', label: 'fold', labelPos: 'e' });
          sB.vline(h, { color: 'accent', width: 1.6 });
          if (disc > 1e-12) { sB.dot(h, xp, { r: 5, color: 'green' }); sB.dot(h, xm, { r: 5, color: 'red', hollow: true, width: 2 }); }
          info = { h, xp, xm, disc, ext, zs };
        });
        v.readout(() => {
          if (!info) return '';
          const { h, xp, xm, disc, ext, zs } = info;
          if (disc > 1e-12) {
            const num = zerosOf((x) => x * (1 - x) - h, -0.1, 1.3, 400);
            return String.raw`$h = ${v.fix(h, 3)} < rK/4 = 0.25$: equilibria $x_- = ${v.fix(xm, 4)}$ (unstable) and $x_+ = ${v.fix(xp, 4)}$ (stable); found numerically as zeros of $\dot x$: ${num.map((z) => v.fix(z, 4)).join(', ')}. Stocks starting below $x_-$ collapse` + (ext.length ? ` (here ${ext.length} of 7 do)` : '') + '; the rest recover to $x_+$.';
          }
          const q = Math.sqrt(Math.max(h - 0.25, 1e-15)), Tex = (1 / q) * (Math.atan(0.5 / q) + Math.atan(0.5 / q));
          const e1 = ext.find(([x0]) => x0 === 1.0);
          if (disc >= 0 || !zs) return String.raw`$h = rK/4$: the two equilibria have merged into a half-stable point at $x = K/2$.`;
          return String.raw`$h = ${v.fix(h, 3)} > rK/4$: no equilibrium survives and every stock dies out in finite time. From $x_0 = K$: extinction at $t = ${e1 ? v.fix(e1[1], 3) : '>' + TM}$ (RK4) versus $\frac1q\big[\arctan\frac{1}{2q}+\arctan\frac{1}{2q}\big] = ${v.fix(Tex, 3)}$ with $q = \sqrt{h - 1/4} = ${v.fix(q, 3)}$. The slow passage near $x = 1/2$ is the ghost of the fold.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12',
      kind: 'Method',
      name: 'Exact equations and integrating factors',
      credit: 'Euler, 1734; Clairaut, 1739',
      statement: String.raw`Let $M, N$ be $C^1$ on a simply connected open set $\Omega\subset\R^2$. The equation $M(x,y)\,dx + N(x,y)\,dy = 0$ (that is, $dy/dx = -M/N$) is *exact* if there is a function $\Psi$ with $\Psi_x = M$, $\Psi_y = N$; then its solution curves are the level sets $\Psi(x,y) = C$. Exactness holds if and only if
$$\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}\quad\text{on }\Omega,$$
and then $\Psi(x,y) = \int_{\gamma} M\,dx + N\,dy$ along any path $\gamma$ from a base point. An *integrating factor* is a non-vanishing $\mu$ for which $\mu M\,dx + \mu N\,dy = 0$ is exact; it has the same solution curves. If $(M_y - N_x)/N$ depends on $x$ alone, $\mu = \exp\int (M_y-N_x)/N\,dx$ is one; similarly with $y$ and $(N_x - M_y)/M$.`,
      idea: String.raw`Along a solution curve the direction $(dx,dy)$ is orthogonal to $(M,N)$, so if $(M,N) = \nabla\Psi$ the curve is tangent to the level sets of $\Psi$. The condition $M_y = N_x$ is necessary by equality of mixed partials, and sufficient on a simply connected domain: it says the 1-form is closed, and closed forms there are exact (vcalc-5.6, pma-10.39), so the line integral defining $\Psi$ is path-independent; Green's theorem shows the defect directly, since $\oint M\,dx+N\,dy = \iint (N_x - M_y)\,dA$. An integrating factor must solve the PDE $(\mu M)_y = (\mu N)_x$; looking for $\mu$ depending on one variable only turns it into a linear ODE, solvable exactly when the quotient above has the stated form.`,
      caption: String.raw`The tint shows the exactness defect $\partial_y(\mu M) - \partial_x(\mu N)$ (red positive, blue negative) and the dots record the test on a grid (green = passes). Blue curves are true solutions (click to add more); orange dashed curves are the level sets of the potential $\Psi$ built by integrating along $x$ then $y$, through the same points. Slide the exponent $k$ of the integrating factor: at the right value the tint vanishes, every dot turns green, the circulation around the purple loop drops to $0$ and the level sets lock onto the solutions.`,
      deps: ['ode-1.3', 'vcalc-5.6'],
      refs: ['Teschl §1.4'],
      see: ['pma-10.39'],
      tags: ['exact equations', 'integrating factor'],
      viz(v) {
        const EX = {
          B: { label: '$(3xy+y^2)\\,dx + (x^2+xy)\\,dy$', M: (x, y) => 3 * x * y + y * y, N: (x, y) => x * x + x * y, mu: 'x', good: 1, xr: [0.15, 2.6], yr: [-2, 2], seeds: [[1, 0.8], [0.6, -0.5], [1.6, -0.9], [2, 0.3]], loop: [1.3, 1.1] },
          A: { label: '$(2xy+1)\\,dx + (x^2+3y^2)\\,dy$', M: (x, y) => 2 * x * y + 1, N: (x, y) => x * x + 3 * y * y, mu: 'x', good: 0, xr: [0.15, 2.6], yr: [-1.6, 1.6], seeds: [[0.5, 0.6], [1.2, -0.4], [2, -1.1], [1.8, 0.8]], loop: [1.4, 0.4] },
          C: { label: '$y\\,dx + (2x - ye^y)\\,dy$', M: (x, y) => y, N: (x, y) => 2 * x - y * Math.exp(y), mu: 'y', good: 1, xr: [-2, 2], yr: [0.15, 2.4], seeds: [[-1, 1], [0.5, 0.6], [1.2, 2.1], [-1.5, 0.4]], loop: [0.9, 1.0] },
        };
        let seeds = EX.B.seeds.map((p) => p.slice());
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'B', {
          onChange: (k) => { seeds = EX[k].seeds.map((p) => p.slice()); L.set(EX[k].loop[0], EX[k].loop[1]); },
        });
        const kS = v.slider('integrating factor exponent $k$', -2, 3, 0, { int: true });
        const s = v.stage({ x: EX.B.xr, y: EX.B.yr, height: 400, full: true, xlabel: 'x', ylabel: 'y' });
        const L = s.handle(EX.B.loop[0], EX.B.loop[1], { color: 'purple', r: 6 });
        s.onClick((x, y) => { if (Math.hypot(s.X(x) - s.X(L.x), s.Y(y) - s.Y(L.y)) < 14) return; seeds.push([x, y]); if (seeds.length > 8) seeds.shift(); });
        let info = null;
        v.legend([['accent', 'solution curves'], ['orange', 'level sets of $\\Psi$ (path $x$ then $y$)'], ['red', '$\\partial_y(\\mu M) - \\partial_x(\\mu N) > 0$', { area: true }], ['blue', '$< 0$', { area: true }], ['purple', 'loop for $\\oint \\mu M\\,dx + \\mu N\\,dy$']]);
        v.render(() => {
          const E = EX[which.value], k = kS.value;
          s.setView(E.xr, E.yr);
          const mu = (x, y) => Math.pow(E.mu === 'x' ? x : y, k);
          const P = (x, y) => mu(x, y) * E.M(x, y), Q = (x, y) => mu(x, y) * E.N(x, y);
          const D = (x, y) => { const e = 1e-4; return (P(x, y + e) - P(x, y - e)) / (2 * e) - (Q(x + e, y) - Q(x - e, y)) / (2 * e); };
          const red = v.rgb('red'), blue = v.rgb('blue');
          s.raster((x, y) => { const d = D(x, y), a = Math.min(1, Math.abs(d) / 4); if (a < 0.01) return null; const c = d > 0 ? red : blue; return [c[0], c[1], c[2], Math.round(95 * Math.sqrt(a))]; }, { res: 3, key: `${which.value}|${k}|${red.join()}` });
          // potential Ψ by cumulative trapezoid: along the bottom edge in x, then up each column in y
          const nx = 140, ny = 100, [x0, x1] = E.xr, [y0, y1] = E.yr, dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
          const G = new Float64Array((nx + 1) * (ny + 1));
          for (let i = 1; i <= nx; i++) G[i] = G[i - 1] + (dx * (P(x0 + (i - 1) * dx, y0) + P(x0 + i * dx, y0))) / 2;
          for (let i = 0; i <= nx; i++) { const x = x0 + i * dx; for (let j = 1; j <= ny; j++) G[j * (nx + 1) + i] = G[(j - 1) * (nx + 1) + i] + (dy * (Q(x, y0 + (j - 1) * dy) + Q(x, y0 + j * dy))) / 2; }
          const psi = (x, y) => {
            const u = v.M.clamp((x - x0) / dx, 0, nx - 1e-9), w = v.M.clamp((y - y0) / dy, 0, ny - 1e-9), i = Math.floor(u), j = Math.floor(w), a = u - i, b = w - j;
            const g = (ii, jj) => G[jj * (nx + 1) + ii];
            return (1 - a) * (1 - b) * g(i, j) + a * (1 - b) * g(i + 1, j) + (1 - a) * b * g(i, j + 1) + a * b * g(i + 1, j + 1);
          };
          // grid test
          let maxD = 0; const okPts = [], badPts = [];
          for (let i = 0; i < 13; i++) for (let j = 0; j < 9; j++) {
            const x = x0 + ((i + 0.5) * (x1 - x0)) / 13, y = y0 + ((j + 0.5) * (y1 - y0)) / 9, d = Math.abs(D(x, y)) / Math.max(1, Math.abs(P(x, y)) + Math.abs(Q(x, y)));
            maxD = Math.max(maxD, d); (d < 1e-6 ? okPts : badPts).push([x, y]);
          }
          s.dots(okPts, { r: 2.6, color: 'green' }); s.dots(badPts, { r: 2.6, color: 'red' });
          // solution curves: integral curves of (N, -M), unit speed in pixels
          const sx = s.X(1) - s.X(0), sy = s.Y(0) - s.Y(1);
          const curveFrom = (xs, ys, dir) => {
            const pts = [[xs, ys]]; let x = xs, y = ys;
            const dirAt = (x, y) => { const a = E.N(x, y) * sx, b = -E.M(x, y) * sy, n = Math.hypot(a, b); return n < 1e-9 ? null : [(dir * a) / n / sx, (dir * b) / n / sy]; };
            for (let i = 0; i < 1500; i++) {
              const d1 = dirAt(x, y); if (!d1) break;
              const d2 = dirAt(x + d1[0] * 1.5, y + d1[1] * 1.5); if (!d2) break;
              x += (d1[0] + d2[0]) * 1.5; y += (d1[1] + d2[1]) * 1.5; // Heun steps of 3 px
              if (x < x0 || x > x1 || y < y0 || y > y1) { pts.push([x, y]); break; }
              pts.push([x, y]);
              if (i > 20 && Math.hypot(s.X(x) - s.X(xs), s.Y(y) - s.Y(ys)) < 2.5) break;
            }
            return pts;
          };
          let spread = 0; const range = (() => { let lo = Infinity, hi = -Infinity; for (let i = 0; i < G.length; i += 7) { lo = Math.min(lo, G[i]); hi = Math.max(hi, G[i]); } return hi - lo || 1; })();
          for (const [xs, ys] of seeds) {
            const c = curveFrom(xs, ys, -1).reverse().concat(curveFrom(xs, ys, 1).slice(1));
            s.clip(() => s.path(c, { color: 'accent', width: 2.2 }));
            let lo = Infinity, hi = -Infinity; for (const [x, y] of c) if (x > x0 && x < x1 && y > y0 && y < y1) { const q = psi(x, y); lo = Math.min(lo, q); hi = Math.max(hi, q); }
            if (hi > lo) spread = Math.max(spread, (hi - lo) / range);
            s.contour(psi, [psi(xs, ys)], { color: 'orange', width: 1.7, res: 140 });
            s.dot(xs, ys, { r: 3.5, color: 'accent' });
          }
          // circulation around the loop and the double integral of the defect inside it
          // the loop is a circle of 46 px on screen, i.e. an ellipse with semi-axes rx, ry in data units
          const rx = 46 / sx, ry = 46 / sy;
          let circ = 0; const n = 600;
          for (let i = 0; i < n; i++) {
            const th = ((i + 0.5) / n) * 2 * Math.PI, x = L.x + rx * Math.cos(th), y = L.y + ry * Math.sin(th);
            circ += (P(x, y) * -rx * Math.sin(th) + Q(x, y) * ry * Math.cos(th)) * ((2 * Math.PI) / n);
          }
          let dbl = 0; const m = 60;
          for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
            const u = -1 + ((i + 0.5) * 2) / m, w = -1 + ((j + 0.5) * 2) / m;
            if (u * u + w * w <= 1) dbl += -D(L.x + rx * u, L.y + ry * w) * ((2 * rx) / m) * ((2 * ry) / m);
          }
          s.curve((th) => [L.x + rx * Math.cos(th), L.y + ry * Math.sin(th)], 0, 2 * Math.PI, { color: 'purple', width: 2.2, n: 90 });
          for (const th of [0.5, 0.5 + (2 * Math.PI) / 3, 0.5 + (4 * Math.PI) / 3]) {
            const xa = L.x + rx * Math.cos(th), ya = L.y + ry * Math.sin(th), xb = L.x + rx * Math.cos(th + 0.3), yb = L.y + ry * Math.sin(th + 0.3);
            s.arrow(xa, ya, xb, yb, { color: 'purple', width: 2.2 });
          }
          info = { k, E, maxD, circ, dbl, spread };
        });
        v.readout(() => {
          if (!info) return '';
          const { k, E, maxD, circ, dbl, spread } = info;
          const muTxt = k === 0 ? String.raw`$\mu = 1$` : String.raw`$\mu = ${E.mu}^{${k}}$`;
          const exact = maxD < 1e-6;
          let r = `${muTxt}: the test $\\partial_y(\\mu M) = \\partial_x(\\mu N)$ ${exact ? 'passes at every grid point' : `fails (largest relative defect $${v.fix(maxD, 3)}$)`}. Circulation around the loop $\\oint \\mu M\\,dx+\\mu N\\,dy = ${v.fix(circ, 5)}$, Green: $\\iint(\\partial_x(\\mu N) - \\partial_y(\\mu M))\\,dA = ${v.fix(dbl, 5)}$. `;
          r += exact ? String.raw`The form is exact: $\Psi$ is constant along each solution to $${v.fix(100 * spread, 2)}\%$ of its range, so its level sets *are* the solution curves.` : String.raw`Not exact: $\Psi$ changes by up to $${v.fix(100 * spread, 0)}\%$ of its range along a single solution, and its level sets cut across them. ` + (E.good !== 0 ? `Try $k = ${E.good}$.` : '');
          return r;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.13
    {
      num: '1.13',
      kind: 'Method',
      name: 'Bernoulli and Riccati equations',
      credit: 'Jacob Bernoulli, 1695 (solved by Leibniz, 1696); Riccati, 1724',
      statement: String.raw`(a) *Bernoulli.* For $n\ne 0,1$, the equation $\dot x = a(t)x + b(t)x^n$ becomes linear under the substitution $u = x^{1-n}$: on any interval where $x>0$,
$$\dot u = (1-n)\big(a(t)\,u + b(t)\big).$$
(b) *Riccati.* For $\dot x = q_0(t) + q_1(t)x + q_2(t)x^2$, if one solution $x_1$ is known, every other solution has the form $x = x_1 + 1/v$, where $v$ solves the linear equation
$$\dot v = -\big(q_1(t) + 2q_2(t)x_1(t)\big)v - q_2(t).$$
The general Riccati equation has no solution by quadratures; a single particular solution reduces it to a linear equation, and the zeros of $v$ are exactly the times at which $x$ blows up.`,
      idea: String.raw`Both are changes of the dependent variable chosen to cancel the nonlinearity. For Bernoulli, $\dot u = (1-n)x^{-n}\dot x = (1-n)(a x^{1-n} + b)$, and the power $x^{1-n}$ is exactly $u$; then 1.4 solves for $u$. For Riccati, subtracting the equations for $x$ and $x_1$ gives $\dot w = (q_1 + 2q_2x_1)w + q_2w^2$ for $w = x - x_1$: a Bernoulli equation with $n = 2$, linearized by $v = 1/w$. A good way to see why a substitution linearizes is to plot $\dot u$ against $u$: an autonomous equation is linear precisely when this graph is a straight line.`,
      caption: String.raw`**Bernoulli** (first three choices): the slider deforms the coordinate by $u_p = (x^p - 1)/p$ (with $u_0 = \ln x$), from $p = 1$ (the original $x$) to the Bernoulli exponent $p = 1-n$. Left: the solutions in the coordinate $u_p$. Right: $\dot u_p$ against $u_p$ — curved for most $p$, but a straight line exactly at $p = 1-n$, where the equation has become linear. **Riccati** (last choice): the known solution $x_1 = t$ (green) generates all others as $t + 1/v$; drag $x_0$ and watch the linear function $v(t)$ (right) — where it crosses zero, $x$ blows up.`,
      deps: ['ode-1.4'],
      refs: ['Teschl §1.4'],
      see: ['ode-1.6', 'ode-1.14'],
      tags: ['substitution', 'riccati equation'],
      viz(v) {
        const EQ = {
          n2: { label: '$\\dot x = x - x^2$', a: 1, b: -1, n: 2 },
          n3: { label: '$\\dot x = x - x^3$', a: 1, b: -1, n: 3 },
          nh: { label: '$\\dot x = \\sqrt{x} - x$', a: -1, b: 1, n: 0.5 },
          ric: { label: 'Riccati $\\dot x = 1 + tx - x^2$' },
        };
        const which = v.select('', Object.entries(EQ).map(([value, o]) => ({ value, label: o.label })), 'n2');
        const pS = v.slider('coordinate exponent $p$', -2.5, 1.5, 1, { step: 0.01 });
        const sL = v.stage({ x: [0, 6], y: [-1, 1], height: 320, weight: 1.25, minWidth: 300, xlabel: 't', ylabel: 'u', title: 'solutions' });
        let target = -1;
        const jump = v.button('Apply the Bernoulli substitution', () => pS.set(target));
        const sR = v.stage({ x: [-1, 1], y: [-1, 1], height: 320, weight: 1, minWidth: 260, xlabel: 'u', ylabel: 'u̇', title: 'the transformed equation' });
        const X0 = sL.handle(0, -0.9, { color: 'accent', label: '$x_0$', labelPos: 'ne', constrain: (x, y) => [0, v.M.clamp(Math.abs(y) < 0.05 ? 0.05 * Math.sign(y || 1) : y, -2.9, 4.8)] });
        const SQ = Math.sqrt(Math.PI / 2);
        let info = null;
        const legB = [['accent', 'solutions in the coordinate $u_p$'], ['orange', '$\\dot u_p$ against $u_p$'], ['muted', 'best straight line', { dash: true }]];
        const legR = [['green', 'known solution $x_1 = t$'], ['accent', '$x = t + 1/v$ (formula)'], ['gold', 'RK4 check', { dot: true }], ['purple', '$v(t)$, solving $\\dot v = tv + 1$'], ['red', 'blow-up: $v = 0$', { dash: true }]];
        let lastMode = null;
        v.render(() => {
          const ric = which.value === 'ric';
          pS.el.hidden = ric; jump.hidden = ric; X0.visible = ric;
          if (lastMode !== ric) { lastMode = ric; v.legend(ric ? legR : legB); sL.o.ylabel = ric ? 'x' : 'u'; sR.o.xlabel = ric ? 't' : 'u'; sR.o.ylabel = ric ? 'v' : 'u̇'; }
          if (!ric) {
            const { a, b, n } = EQ[which.value]; target = 1 - n;
            let p = pS.value; if (Math.abs(p - target) < 0.03) p = target;
            const U = (x) => (Math.abs(p) < 1e-9 ? Math.log(x) : (Math.pow(x, p) - 1) / p);
            const Udot = (x) => Math.pow(x, p - 1) * (a * x + b * Math.pow(x, n));
            const f = (t, x) => a * x + b * Math.pow(Math.max(x, 0), n);
            const x0s = [0.2, 0.45, 0.7, 1.35, 1.9, 2.5];
            const sols = x0s.map((x0) => trace(f, 0, x0, 6, { h: 0.01, cap: 1e3 }).map(([t, x]) => [t, U(x)]));
            let lo = Infinity, hi = -Infinity; for (const q of sols) for (const [, u] of q) { lo = Math.min(lo, u); hi = Math.max(hi, u); }
            const pad = (hi - lo) * 0.08 || 0.1;
            sL.setView([0, 6], [lo - pad, hi + pad]);
            sL.setTitle(p === target ? `solutions in the coordinate $u = x^{${v.fix(target, target % 1 ? 1 : 0)}}$-type: pure exponentials` : `solutions in the coordinate $u_p$, $p = ${v.fix(p, 2)}$`);
            sL.hline(0, { color: 'green', width: 1.2, dash: [5, 4] });
            sols.forEach((q, i) => sL.path(q, { color: 'accent', width: i === 2 ? 2.6 : 1.6, alpha: i === 2 ? 1 : 0.7 }));
            // phase plot u̇ against u
            const xs = v.M.linspace(0.18, 2.6, 160), pts = xs.map((x) => [U(x), Udot(x)]);
            let ulo = Infinity, uhi = -Infinity, dlo = Infinity, dhi = -Infinity;
            for (const [u, d] of pts) { ulo = Math.min(ulo, u); uhi = Math.max(uhi, u); dlo = Math.min(dlo, d); dhi = Math.max(dhi, d); }
            const fit = v.M.linreg(pts.map((q) => q[0]), pts.map((q) => q[1]));
            let dev = 0; for (const [u, d] of pts) dev = Math.max(dev, Math.abs(d - fit.predict(u)));
            const rel = dev / Math.max(1e-12, dhi - dlo);
            const pu = (uhi - ulo) * 0.08, pd = (dhi - dlo) * 0.1 || 0.1;
            sR.setView([ulo - pu, uhi + pu], [dlo - pd, dhi + pd]);
            sR.setTitle(`$\\dot u_p$ against $u_p$` + (rel < 1e-6 ? ' — a straight line: linear!' : ''));
            sR.fn((u) => fit.predict(u), { color: 'muted', width: 1.2, dash: [6, 4] });
            sR.path(pts, { color: rel < 1e-6 ? 'green' : 'orange', width: 2.8 });
            fpGlyph(v, sR, 0, 0, 'stable');
            // check pure exponentials at the target: u(t) = u(0) e^{λt}, λ = a p
            let expErr = NaN;
            if (rel < 1e-6) { const lam = fit.slope; expErr = 0; for (const q of sols) for (const [t, u] of q) expErr = Math.max(expErr, Math.abs(u - q[0][1] * Math.exp(lam * t))); }
            info = { ric, p, target, rel, slope: fit.slope, icpt: fit.intercept, expErr, n, a, b };
          } else {
            sL.setView([-0.25, 4], [-3, 5]); sR.setView([-0.25, 4], [-3, 6]);
            sL.setTitle('solutions of $\\dot x = 1 + tx - x^2$'); sR.setTitle('$v(t) = 1/(x - x_1)$ solves the linear $\\dot v = tv + 1$');
            const vOf = (x0, t) => Math.exp((t * t) / 2) * (1 / x0 + SQ * v.M.erf(t / Math.SQRT2));
            const blow = (x0) => (x0 < -1 / SQ ? v.M.bisect((t) => 1 / x0 + SQ * v.M.erf(t / Math.SQRT2), 0, 12) : NaN);
            sL.fn((t) => t, { color: 'green', width: 3 });
            for (const c of [-2.5, -1.5, -0.6, 0.6, 1.5, 2.8, 4.2]) {
              const T = blow(c);
              sL.fn((t) => t + 1 / vOf(c, t), { domain: [0, isFinite(T) ? T - 1e-6 : 4], color: 'muted', width: 1.2, alpha: 0.6 });
              sR.fn((t) => vOf(c, t), { color: 'purple', width: 1, alpha: 0.35 });
            }
            const x0 = X0.y, T = blow(x0);
            sL.fn((t) => t + 1 / vOf(x0, t), { domain: [0, isFinite(T) ? T - 1e-7 : 4], color: 'accent', width: 2.8 });
            const num = trace((t, x) => 1 + t * x - x * x, 0, x0, 4, { h: 0.005, cap: 1e4 });
            sL.clip(() => sL.dots(num.filter((_, i) => i % 30 === 15), { r: 2.8, color: 'gold' }));
            let err = 0; for (const [t, x] of num) if (Math.abs(x) < 50) err = Math.max(err, Math.abs(x - (t + 1 / vOf(x0, t))) / Math.max(1, Math.abs(x)));
            sR.hline(0, { color: 'ink', width: 1.2 });
            sR.fn((t) => vOf(x0, t), { color: 'purple', width: 2.8 });
            if (isFinite(T) && T < 4) { sL.vline(T, { color: 'red', width: 1.4, dash: [6, 4] }); sR.vline(T, { color: 'red', width: 1.4, dash: [6, 4] }); sR.dot(T, 0, { r: 5, color: 'red', label: 'v = 0', labelPos: 'se' }); }
            info = { ric, x0, T, err, numEsc: num.escape };
          }
        });
        v.readout(() => {
          if (!info) return '';
          if (!info.ric) {
            const { p, target, rel, slope, icpt, expErr, n } = info;
            const nTxt = n === 0.5 ? '1/2' : String(n);
            if (rel < 1e-6) return String.raw`$p = 1 - n = ${v.fix(target, target % 1 ? 1 : 0)}$ (here $n = ${nTxt}$): the transformed equation is $\dot u = ${v.fix(slope, 4)}\,u ${icpt < 0 ? '-' : '+'} ${v.fix(Math.abs(icpt), 4)}$ — linear. Every solution is a pure exponential $u(0)e^{${v.fix(slope, 2)}t}$, to within $${v.sci(Math.max(expErr, 1e-16), 1)}$.`;
            return String.raw`$p = ${v.fix(p, 2)}$: $\dot u_p$ is not an affine function of $u_p$ (largest deviation from the best straight line: $${v.fix(100 * rel, 1)}\%$ of its range), so the equation in this coordinate is still nonlinear. The Bernoulli exponent is $p = 1 - n = ${v.fix(target, target % 1 ? 1 : 0)}$.`;
          }
          const { x0, T, err } = info;
          let r = String.raw`$x(0) = ${v.fix(x0, 2)}$, so $v(0) = 1/x_0 = ${v.fix(1 / x0, 3)}$ and $v(t) = e^{t^2/2}\big(1/x_0 + \sqrt{\pi/2}\,\mathrm{erf}(t/\sqrt2)\big)$. The formula $x = t + 1/v$ matches RK4 to $${v.sci(Math.max(err, 1e-16), 1)}$.`;
          r += isFinite(T) ? String.raw` Since $x_0 < -1/\sqrt{\pi/2} = ${v.fix(-1 / SQ, 4)}$, $v$ has a zero at $t = ${v.fix(T, 4)}$ and the solution escapes to $-\infty$ there` + (info.numEsc != null ? String.raw` (RK4 escapes at $${v.fix(info.numEsc, 4)}$)` : '') + '.' : ' $v$ never vanishes for $t\\ge0$, so the solution exists for all $t\\ge0$ and approaches the known solution $x_1 = t$.';
          return r;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.14
    {
      num: '1.14',
      kind: 'Phenomenon',
      name: 'Finite-time blow-up',
      statement: String.raw`A solution of a perfectly smooth equation can cease to exist in finite time by escaping to infinity. For $\dot x = f(x)$ with $f>0$ on $[x_0,\infty)$, the solution from $x(0) = x_0$ reaches the level $X$ at time $t(X) = \int_{x_0}^{X} d\xi/f(\xi)$, so it blows up exactly when
$$T = \int_{x_0}^{\infty}\frac{d\xi}{f(\xi)} < \infty,$$
and then $x(t)\to\infty$ as $t\uparrow T$. For $f(x) = x^p$ with $p>1$ this gives $T = x_0^{1-p}/(p-1)$, which shrinks as $x_0$ grows; for $p\le1$ the solution exists for all time. Superlinear growth is necessary but not sufficient: $f(x) = (1+x)\ln(1+x)$ has $\int^\infty d\xi/f = \infty$ (Osgood's criterion), so its solutions grow doubly exponentially but never blow up.`,
      idea: String.raw`Separating variables (1.3) gives $t = \int_{x_0}^{x} d\xi/f(\xi)$: the time to climb from $x_0$ to $X$ is the area under $1/f$. If that area stays bounded as $X\to\infty$, infinitely many levels are crossed in finite total time. Local existence is unaffected — $x^2$ is smooth, even analytic — so blow-up is a *global* phenomenon that no local theorem can rule out; it is the reason the existence theorems of chapter 2 are local, and why maximal solutions are only guaranteed to leave every compact set (2.11). Linear growth bounds $|f(x)|\le a+b|x|$ prevent it (2.12).`,
      caption: String.raw`Drag $x_0$ and choose the growth law. Top: solutions from several starting values; the red dashed line is the blow-up time $T(x_0)$, which moves left as $x_0$ increases. Bottom left: $1/f$, with the area from $x_0$ onward shaded — that area *is* the time to reach infinity. Bottom right: the time $t(X)$ at which the solution reaches the level $X$, against $\log_{10}X$: it levels off at $T$ when there is blow-up and keeps climbing when there is none. Dots are RK4, curves exact.`,
      deps: ['ode-1.3'],
      refs: ['Teschl §1.3'],
      see: ['ode-2.11', 'ode-2.12', 'pde-12.2'],
      tags: ['blow-up', 'maximal solutions'],
      viz(v) {
        const LAW = {
          pow: { label: '$x^p$' },
          exp: { label: '$e^x$' },
          osg: { label: '$(1+x)\\ln(1+x)$' },
        };
        const which = v.select('$\\dot x = f(x) =$', Object.entries(LAW).map(([value, o]) => ({ value, label: o.label })), 'pow');
        const pS = v.slider('$p$', 0.5, 3, 1.5, { step: 0.01 });
        const s = v.stage({ x: [-0.15, 3], y: [0, 10], height: 280, full: true, xlabel: 't', ylabel: 'x', title: 'solutions and their blow-up times' });
        const sA = v.stage({ x: [0, 10], y: [0, 2.2], height: 210, weight: 1, minWidth: 260, xlabel: 'ξ', title: '$1/f(\\xi)$: area from $x_0$ to $\\infty$ = escape time' });
        const sT = v.stage({ x: [0, 16], y: [0, 3], height: 210, weight: 1, minWidth: 260, axes: 'box', xlabel: 'log₁₀ X', title: 'time $t(X)$ to reach the level $X$' });
        const H = s.handle(0, 1, { color: 'accent', label: '$x_0$', labelPos: 'e', constrain: (x, y) => [0, v.M.clamp(y, 0.3, 4)] });
        let info = null;
        v.legend([['accent', 'solution from $x_0$'], ['muted', 'other starting values'], ['red', 'blow-up time $T$', { dash: true }], ['gold', 'RK4', { dot: true }]]);
        v.render(() => {
          const law = which.value, p = pS.value;
          pS.el.hidden = law !== 'pow';
          const f = law === 'pow' ? (x) => Math.pow(x, p) : law === 'exp' ? (x) => Math.exp(x) : (x) => (1 + x) * Math.log(1 + x);
          const T = (x0) => (law === 'pow' ? (p > 1 + 1e-9 ? Math.pow(x0, 1 - p) / (p - 1) : Infinity) : law === 'exp' ? Math.exp(-x0) : Infinity);
          const tX = (x0, X) => law === 'pow' ? (Math.abs(p - 1) < 1e-9 ? Math.log(X / x0) : (Math.pow(x0, 1 - p) - Math.pow(X, 1 - p)) / (p - 1)) : law === 'exp' ? Math.exp(-x0) - Math.exp(-X) : Math.log(Math.log1p(X) / Math.log1p(x0));
          const xExact = (x0, t) => law === 'pow' ? (Math.abs(p - 1) < 1e-9 ? x0 * Math.exp(t) : Math.pow(Math.pow(x0, 1 - p) - (p - 1) * t, 1 / (1 - p))) : law === 'exp' ? -Math.log(Math.exp(-x0) - t) : Math.pow(1 + x0, Math.exp(t)) - 1;
          const x0 = H.y, TM = 3, F = (t, x) => f(x);
          // top panel
          for (const c of [0.5, 0.75, 1.5, 2.5, 3.5]) {
            const q = trace(F, 0, c, TM, { h: 0.01, cap: 1e3 });
            s.clip(() => s.path(q, { color: 'muted', width: 1.3, alpha: 0.6 }));
            const Tc = T(c); if (Tc < TM) s.line(Tc, 0, Tc, 0.35, { color: 'red', width: 2, alpha: 0.6 });
          }
          const q = trace(F, 0, x0, TM, { h: 0.005, cap: 1e3 });
          s.clip(() => s.path(q, { color: 'accent', width: 2.8 }));
          const T0 = T(x0);
          if (T0 < TM) { s.vline(T0, { color: 'red', width: 1.6, dash: [6, 4] }); s.text(`T = ${v.fix(T0, 3)}`, T0, 9.4, { color: 'red', size: 12, align: 'left', dx: 6 }); }
          // bottom left: 1/f and the tail area
          let ymax = 0; for (const xx of v.M.linspace(0.05, 10, 200)) ymax = Math.max(ymax, Math.min(1 / f(xx), 50));
          sA.setView(null, [0, Math.min(Math.max(1 / f(x0) * 1.3, 0.3), Math.max(ymax, 0.3))]);
          sA.fn((xx) => 1 / f(xx), { domain: [0.02, 10], color: 'ink', width: 2 });
          sA.fn((xx) => 1 / f(xx), { domain: [x0, 10], color: 'red', width: 2.4, fill: 'red', fillAlpha: 0.18 });
          sA.vline(x0, { color: 'accent', width: 1.4, dash: [3, 3] });
          const area10 = tX(x0, 10);
          // bottom right: t(X) against log10 X, exact and numerical
          const num = trace(F, 0, x0, 60, { h: 0.01, cap: 1e40, rel: 0.05 });
          const dots = [];
          for (let k = Math.ceil(Math.log10(x0) + 1e-9); k <= 16; k += 1) {
            const L = 10 ** k; let tc = NaN;
            for (let i = 1; i < num.length; i++) if (num[i - 1][1] < L && num[i][1] >= L) { const [ta, xa] = num[i - 1], [tb, xb] = num[i]; tc = ta + ((Math.log(L) - Math.log(xa)) * (tb - ta)) / (Math.log(xb) - Math.log(xa)); break; }
            if (isFinite(tc)) dots.push([k, tc]);
          }
          const tmax = Math.min(Math.max(isFinite(T0) ? T0 * 1.4 : tX(x0, 1e16) * 1.15, 0.5), 60);
          sT.setView([Math.min(0, Math.floor(Math.log10(x0))), 16], [0, tmax]);
          sT.fn((k) => tX(x0, 10 ** k), { domain: [Math.log10(x0), 16], color: 'accent', width: 2.4, n: 400 });
          if (isFinite(T0)) { sT.hline(T0, { color: 'red', width: 1.4, dash: [6, 4] }); sT.text('T', 16, T0, { color: 'red', align: 'right', dx: -6, dy: -9, math: true }); }
          sT.dots(dots, { r: 3, color: 'gold' });
          let err = 0; for (const [t, x] of q) if (x < 1e3) { const e = Math.abs(x - xExact(x0, t)) / Math.max(1, x); if (isFinite(e)) err = Math.max(err, e); }
          info = { law, p, x0, T0, area10, tX, err, numEsc: q.escape };
        });
        v.readout(() => {
          if (!info) return '';
          const { law, p, x0, T0, area10, tX, err } = info;
          const lev = [4, 8, 16, 32].map((k) => `$${v.fix(tX(x0, 10 ** k), 4)}$`).join(', ');
          let r = String.raw`Times to reach $10^4, 10^8, 10^{16}, 10^{32}$: ${lev}. `;
          if (isFinite(T0)) r += String.raw`They converge to $T = \int_{x_0}^\infty d\xi/f = ${v.fix(T0, 4)}$` + (law === 'pow' ? String.raw` $= x_0^{1-p}/(p-1)$` : String.raw` $= e^{-x_0}$`) + ' — infinitely many levels in finite time: blow-up.';
          else r += law === 'osg' ? String.raw`They keep growing (like $\ln\ln X$): $\int^\infty d\xi/((1+\xi)\ln(1+\xi))$ diverges, so despite doubly exponential growth $x = (1+x_0)^{e^t} - 1$ there is no blow-up.` : String.raw`They grow without bound: for $p = ${v.fix(p, 2)}\le 1$ the integral $\int^\infty \xi^{-p}d\xi$ diverges, and the solution exists for all time.`;
          r += String.raw` (Shaded area up to $\xi = 10$: $${v.fix(area10, 4)}$. RK4 vs exact: $${v.sci(Math.max(err, 1e-16), 1)}$.)`;
          return r;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.15
    {
      num: '1.15',
      kind: 'Paradox',
      name: 'Non-uniqueness without a Lipschitz condition',
      statement: String.raw`The initial value problem $\dot x = |x|^{\alpha}$, $x(0) = 0$, with $0<\alpha<1$, has infinitely many solutions on $[0,\infty)$: for every $c\ge0$,
$$x_c(t) = \begin{cases}0, & t\le c,\\ \big((1-\alpha)(t-c)\big)^{1/(1-\alpha)}, & t\ge c,\end{cases}$$
is a $C^1$ solution, and so is $x\equiv0$. The right-hand side is continuous but not Lipschitz at $0$: $|f(x)-f(0)|/|x| = |x|^{\alpha-1}\to\infty$. For $\alpha\ge1$ the solution is unique ($x\equiv 0$). The same mechanism runs backwards for Torricelli's leaky bucket $\dot h = -k\sqrt h$: an empty bucket could have emptied at any earlier time.`,
      idea: String.raw`Each $x_c$ is glued from two solutions — the equilibrium $0$ and the separated solution $(1-\alpha)(t-c)$ raised to $1/(1-\alpha)$ — that meet with matching value $0$ and matching slope $0$, so the glued function is still $C^1$ and solves the equation. Gluing is possible only because the separated solution *reaches* $0$ in finite (backward) time, which happens because $\int_0 d\xi/\xi^{\alpha}<\infty$ (1.3); for $\alpha\ge1$ that integral diverges and $0$ cannot be reached. The Lipschitz condition of chapter 2 is exactly what excludes this: it caps the relative speed $|f(x)-f(0)|/|x|$ near the equilibrium.`,
      caption: String.raw`Slide $\alpha$ (default $1/3$) and drag the departure time $c$ along the axis. Every blue curve leaves $0$ at a different time and *all* of them solve the same initial value problem; at $\alpha = 1$ the fan collapses to $x\equiv0$. The gold dots are RK4 started at $x(0) = 10^{-12}$: rounding-sized data pick out the $c\approx0$ member, while RK4 started at exactly $0$ stays there forever. Right: the Lipschitz quotient $|x|^{\alpha-1}$, unbounded as $x\to0$ when $\alpha<1$. *Leaky bucket* runs the paradox backwards.`,
      deps: ['ode-1.3'],
      refs: ['Strogatz §2.5'],
      see: ['ode-2.1', 'ode-2.4', 'ode-2.9'],
      tags: ['uniqueness', 'lipschitz condition'],
      viz(v) {
        const mode = v.select('', [{ value: 'abs', label: '$\\dot x = |x|^{\\alpha}$' }, { value: 'odd', label: '$\\dot x = \\operatorname{sgn}(x)|x|^{\\alpha}$' }, { value: 'bucket', label: 'leaky bucket $\\dot h = -\\sqrt h$' }], 'abs');
        const aS = v.slider('$\\alpha$', 0.1, 1.5, 1 / 3, { step: 0.01 });
        const tS = v.slider('time $\\tau$', 0, 6, 1.4, { step: 0.01 });
        const s = v.stage({ x: [-1, 6], y: [-2, 3], height: 330, weight: 1.6, minWidth: 330, xlabel: 't', ylabel: 'x', title: 'solutions with $x(0) = 0$' });
        const sR = v.stage({ x: [1e-6, 1], y: [1e-2, 1e4], xlog: true, ylog: true, height: 330, weight: 1, minWidth: 240, axes: 'box', xlabel: 'x', title: 'Lipschitz quotient $|x|^{\\alpha-1}$' });
        const C = s.handle(2, 0, { color: 'accent', label: '$c$', labelPos: 's', constrain: (x) => [v.M.clamp(x, 0, 5.8), 0] });
        let info = null, lastMode = null;
        v.render(() => {
          const md = mode.value, bucket = md === 'bucket';
          aS.el.hidden = bucket; tS.el.hidden = !bucket;
          if (lastMode !== md) {
            lastMode = md;
            if (bucket) {
              sR.setScale({ xlog: false, ylog: false, x: [0, 1], y: [0, 1.15] }); sR.setTicks([], []); sR.setTitle('the bucket at time $\\tau$');
              s.setView([-0.3, 6], [-0.2, 4.4]); s.setTitle('water depth $h(t)$: all of these are empty at $t = 5$');
              C.labelPos = 'ne'; C.label = '$T_e$'; C.set(3, 0); s.o.ylabel = 'h'; sR.o.xlabel = null;
              v.legend([['accent', 'depth $h(t)$ for different emptying times'], ['gold', 'the highlighted bucket'], ['red', 'observation: $h(5) = 0$']]);
            } else {
              sR.setScale({ xlog: true, ylog: true, x: [1e-6, 1], y: [1e-2, 1e4] }); sR.setTicks(null, null); sR.setTitle('Lipschitz quotient $|f(x) - f(0)|/|x| = |x|^{\\alpha-1}$');
              s.setView([-1, 6], [-2, 3]); s.setTitle('solutions with $x(0) = 0$'); C.label = '$c$'; C.labelPos = 's'; s.o.ylabel = 'x'; sR.o.xlabel = 'x';
              v.legend([['accent', 'solutions $x_c$ leaving $0$ at time $c$'], ...(md === 'abs' ? [['purple', 'solutions arriving at $0$']] : []), ['gold', 'RK4 from $x(0) = 10^{-12}$', { dot: true }]]);
            }
          }
          if (bucket) {
            // ḣ = -√h: h(t) = (Te - t)²/4 for t ≤ Te, 0 after
            const hOf = (Te, t) => (t < Te ? ((Te - t) * (Te - t)) / 4 : 0);
            for (let Te = 0.5; Te <= 4.51; Te += 0.5) s.fn((t) => hOf(Te, t), { domain: [-0.3, 6], color: 'accent', width: 1.4, alpha: 0.55 });
            const Te = C.x;
            s.fn((t) => hOf(Te, t), { domain: [-0.3, 6], color: 'gold', width: 3 });
            s.vline(5, { color: 'red', width: 1.4, dash: [6, 4] }); s.dot(5, 0, { r: 5, color: 'red' });
            s.text('h(5) = 0: when did it empty?', 5, 3.9, { color: 'red', size: 11.5, align: 'right', dx: -6 });
            const tau = tS.value, hT = hOf(Te, tau);
            s.vline(tau, { color: 'gold', width: 1, alpha: 0.5 }); s.dot(tau, hT, { r: 5, color: 'gold' });
            // bucket drawing (depth scaled by the largest initial depth in view)
            const H0 = Math.max(hOf(Te, 0), 1e-9), Hmax = Math.max(hOf(4.5, 0), H0), lev = Math.min(1, hT / Hmax);
            sR.rect(0.27, 0.18, 0.73, 0.18 + 0.82 * lev, { fill: 'blue', fillAlpha: 0.35, stroke: false });
            sR.path([[0.25, 1.05], [0.25, 0.16], [0.47, 0.16]], { color: 'ink', width: 3 });
            sR.path([[0.53, 0.16], [0.75, 0.16], [0.75, 1.05]], { color: 'ink', width: 3 });
            if (hT > 1e-6) { const sp = 0.3 + 0.7 * Math.sqrt(lev); for (let k = 0; k < 4; k++) sR.dot(0.5 + k * 0.02 * sp, 0.13 - k * 0.025, { r: 2.4, color: 'blue', ring: false }); }
            else sR.text('empty', 0.5, 0.3, { color: 'red', size: 12, align: 'center' });
            sR.text(`h = ${v.fix(hT, 3)}`, 0.5, 1.1, { color: 'ink', size: 12, align: 'center' });
            info = { bucket, Te, tau, hT };
            return;
          }
          const al = aS.value, f = md === 'abs' ? (x) => Math.pow(Math.abs(x), al) : (x) => Math.sign(x) * Math.pow(Math.abs(x), al);
          const leaves = al < 1 - 1e-9, e = 1 / (1 - al);
          const up = (c, t) => (t <= c ? 0 : Math.pow((1 - al) * (t - c), e));
          s.hline(0, { color: 'accent', width: 2 });
          if (leaves) {
            for (let c = 0; c <= 5.51; c += 0.5) {
              s.clip(() => s.fn((t) => up(c, t), { domain: [c, 6], color: 'accent', width: 1.4, alpha: 0.55 }));
              if (md === 'odd') s.clip(() => s.fn((t) => -up(c, t), { domain: [c, 6], color: 'accent', width: 1.4, alpha: 0.55 }));
            }
            if (md === 'abs') for (const a of [1.5, 3, 4.5]) s.clip(() => s.fn((t) => -Math.pow((1 - al) * (a - t), e), { domain: [-1, a], color: 'purple', width: 1.6, alpha: 0.8 }));
            s.clip(() => s.fn((t) => up(C.x, t), { domain: [-1, 6], color: 'accent', width: 3 }));
          }
          C.visible = leaves;
          // RK4 from exactly 0 and from 1e-12
          const z = trace((t, x) => f(x), 0, 0, 6, { h: 0.01 }), tiny = trace((t, x) => f(x), 0, 1e-12, 6, { h: 0.01, cap: 1e3, abs: 0 }); // purely relative steps resolve the take-off from 1e-12
          s.clip(() => s.dots(tiny.filter((p, i) => i % 25 === 0 && p[1] < 3.2), { r: 2.6, color: 'gold' }));
          const zMax = Math.max(...z.map((p) => Math.abs(p[1])));
          // integral check of the highlighted member: x(t) = ∫_c^t |x|^α
          let ierr = 0;
          // substitute u = c + s² to remove the square-root-type singularity of the integrand at u = c
          if (leaves) for (const t of [C.x + 0.5, C.x + 1.5, 5.9]) if (t > C.x && t <= 6) ierr = Math.max(ierr, Math.abs(up(C.x, t) - simpson((q) => 2 * q * f(up(C.x, C.x + q * q)), 0, Math.sqrt(t - C.x), 600)));
          // Lipschitz quotient
          sR.fn((x) => Math.pow(x, al - 1), { color: al < 1 ? 'red' : 'green', width: 2.6 });
          sR.hline(1, { color: 'muted', width: 1, dash: [4, 4] });
          info = { bucket, al, leaves, zMax, tiny, ierr, c: C.x, up, e };
        });
        v.readout(() => {
          if (!info) return '';
          if (info.bucket) {
            const { Te, tau, hT } = info;
            return String.raw`Torricelli: $\dot h = -\sqrt h$ (units with $k = 1$), $h(t) = (T_e - t)^2/4$ until the emptying time $T_e$, then $0$. The highlighted bucket started at depth $h(0) = ${v.fix((Te * Te) / 4, 3)}$ and empties at $T_e = ${v.fix(Te, 2)}$; at $\tau = ${v.fix(tau, 2)}$ its depth is $${v.fix(hT, 3)}$. Every curve shown ends in $h(5) = 0$, so the backward problem from an empty bucket has infinitely many solutions — the past cannot be recovered, because $\sqrt h$ is not Lipschitz at $0$.`;
          }
          const { al, leaves, zMax, tiny, ierr, c, up } = info;
          const xt = at(tiny, 3);
          if (!leaves) return String.raw`$\alpha = ${v.fix(al, 2)}\ge1$: $f$ is Lipschitz near $0$ (the quotient $|x|^{\alpha-1}$ stays bounded), the fan has collapsed, and $x\equiv0$ is the only solution with $x(0) = 0$. RK4 from $10^{-12}$ gives $x(3) = ${v.sci(Math.max(Math.abs(xt), 1e-300), 2)}$ — it stays negligible.`;
          return String.raw`$\alpha = ${v.fix(al, 2)}$: the highlighted solution sits at $0$ until $c = ${v.fix(c, 2)}$ and then leaves; it satisfies $x(t) = \int_c^t |x(s)|^\alpha ds$ to $${v.sci(Math.max(ierr, 1e-16), 1)}$. RK4 from exactly $0$ stays at $0$ ($\max|x| = ${v.fix(zMax, 0)}$); from $10^{-12}$ it gives $x(3) = ${v.fix(xt, 4)}$, against $x_0(3) = ${v.fix(up(0, 3), 4)}$ for the member leaving at $c = 0$. Near $0$ the Lipschitz quotient reaches $${v.sci(Math.pow(1e-6, al - 1), 2)}$ at $x = 10^{-6}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.16
    {
      num: '1.16',
      kind: 'Theorem',
      name: 'Periodic solutions of periodically forced equations',
      statement: String.raw`Let $f(t,x)$ be continuous, $C^1$ in $x$, and $T$-periodic in $t$. Define the *period map* (stroboscopic or Poincaré map) $P(x_0) = x(T;x_0)$, the value at time $T$ of the solution with $x(0) = x_0$, wherever that solution exists on $[0,T]$.
(a) The solution through $x_0$ is $T$-periodic if and only if $P(x_0) = x_0$, and then $x(t+kT) = x(t)$ for all $k$.
(b) $P$ is continuous and strictly increasing, with $P'(x^*) = \exp\int_0^T \partial_xf(t,x^*(t))\,dt$ along a periodic solution; $x^*$ attracts nearby solutions if $P'(x^*)<1$ and repels if $P'(x^*)>1$.
(c) If $a<b$ and $f(t,a) > 0 > f(t,b)$ for all $t$, then $P$ maps $[a,b]$ into itself, so (intermediate value theorem) there is a $T$-periodic solution with values in $[a,b]$.
Since $P$ is monotone, every solution that stays bounded converges to a periodic solution.`,
      idea: String.raw`Periodicity of $f$ makes $t\mapsto x(t+T)$ again a solution, so if $x(T) = x(0)$ uniqueness gives $x(t+T) = x(t)$: the whole problem reduces to the one-dimensional map $P$. Solutions of a scalar equation cannot cross, so $x_0<y_0$ implies $P(x_0)<P(y_0)$; continuity comes from continuous dependence on initial data. Differentiating in $x_0$ gives the linear variational equation $\dot y = \partial_xf\,y$, solved by the exponential formula — the scalar case of a Floquet multiplier. In (c) the interval is trapped: a solution starting in $[a,b]$ cannot leave it, since at the edges the field points inwards, so $g(x) = P(x) - x$ has $g(a)\ge0\ge g(b)$ and vanishes somewhere (pma-4.23). An increasing interval map has no cycles other than fixed points, hence the convergence.`,
      caption: String.raw`A logistic population is harvested seasonally at rate $h(1 + a\sin 2\pi t)$, with period $T = 1$. Left: solutions sampled once a year (dots); thick curves are the periodic solutions. Right: the period map $P$, its fixed points (green: stable, red: unstable) and a cobweb of yearly samples from $x_0$ (drag it). The shaded square is the trapping interval $[\tfrac12, 1]$ of part (c), present while $h(1+a)<\tfrac14$. Raise $h$ or $a$: the two fixed points merge and vanish, and every population crashes.`,
      deps: ['ode-1.7', 'pma-4.23', 'ode-1.11'],
      refs: ['Teschl §1.6'],
      see: ['ode-3.17', 'ode-2.6'],
      tags: ['period map', 'periodic forcing'],
      viz(v) {
        const hS = v.slider('mean harvest $h$', 0, 0.3, 0.14, { step: 0.001 });
        const aS = v.slider('seasonal amplitude $a$', 0, 0.95, 0.6, { step: 0.01 });
        const NY = 6;
        const sL = v.stage({ x: [-0.4, NY], y: [-0.15, 1.3], height: 320, weight: 1.35, minWidth: 320, xlabel: 't', ylabel: 'x', title: 'population over six seasons' });
        const sP = v.stage({ x: [-0.1, 1.25], y: [-0.1, 1.25], height: 320, weight: 1, minWidth: 270, equal: true, xlabel: 'x(0)', ylabel: 'x(T)', title: 'period map $P(x_0) = x(T; x_0)$' });
        const X0 = sP.handle(0.3, 0, { color: 'gold', label: '$x_0$', labelPos: 'nw', constrain: (x) => [v.M.clamp(x, -0.05, 1.2), 0] });
        let cache = { key: null }, info = null;
        v.legend([['accent', 'period map $P$'], ['green', 'stable periodic solution'], ['red', 'unstable periodic solution', { dash: true }], ['gold', 'yearly samples / cobweb'], ['teal', 'trapping interval', { area: true }]]);
        v.render(() => {
          const h = hS.value, a = aS.value;
          const f = (t, x) => x * (1 - x) - h * (1 + a * Math.sin(2 * Math.PI * t));
          const P = (x0) => { const q = trace(f, 0, x0, 1, { h: 0.01, cap: 50 }); return q.escape != null || q[q.length - 1][0] < 1 - 1e-9 ? NaN : q[q.length - 1][1]; };
          const key = `${h}|${a}`;
          if (cache.key !== key) {
            const xs = v.M.linspace(-0.1, 1.25, 136), Ps = xs.map(P);
            // fixed points: sign changes of P(x) - x, refined by bisection
            const fps = [];
            for (let i = 1; i < xs.length; i++) {
              const g0 = Ps[i - 1] - xs[i - 1], g1 = Ps[i] - xs[i];
              if (isFinite(g0) && isFinite(g1) && g0 * g1 < 0) {
                let lo = xs[i - 1], hi = xs[i], glo = g0;
                for (let k = 0; k < 44; k++) { const m = (lo + hi) / 2, gm = P(m) - m; if (gm * glo < 0) hi = m; else { lo = m; glo = gm; } }
                const xs0 = (lo + hi) / 2, ep = 1e-5, d = (P(xs0 + ep) - P(xs0 - ep)) / (2 * ep);
                const orbit = trace(f, 0, xs0, NY, { h: 0.005, cap: 50 });
                let integ = 0; const one = orbit.filter((p) => p[0] <= 1 + 1e-12);
                for (let j = 1; j < one.length; j++) integ += ((one[j][0] - one[j - 1][0]) * (1 - 2 * one[j][1] + 1 - 2 * one[j - 1][1])) / 2;
                fps.push({ x: xs0, d, floq: Math.exp(integ), orbit, ret: Math.abs(P(xs0) - xs0) });
              }
            }
            cache = { key, xs, Ps, fps };
          }
          const { xs, Ps, fps } = cache;
          // left: solutions and periodic orbits
          for (let k = 1; k < NY; k++) sL.vline(k, { color: 'grid', width: 1 });
          for (const c of [0.02, 0.15, 0.3, 0.5, 0.75, 1.0, 1.25]) {
            const q = trace(f, 0, c, NY, { h: 0.01, cap: 50 });
            sL.clip(() => sL.path(q, { color: 'muted', width: 1.1, alpha: 0.5 }));
          }
          for (const fp of fps) sL.clip(() => sL.path(fp.orbit, { color: fp.d < 1 ? 'green' : 'red', width: 3, dash: fp.d < 1 ? null : [7, 5] }));
          const x0 = X0.x, q0 = trace(f, 0, x0, NY, { h: 0.005, cap: 50 });
          sL.clip(() => sL.path(q0, { color: 'gold', width: 2.2 }));
          const samples = []; for (let k = 0; k <= NY; k++) { const xk = at(q0, k); if (isFinite(xk)) samples.push([k, xk]); }
          sL.clip(() => sL.dots(samples, { r: 4.2, color: 'gold' }));
          // right: period map, diagonal, trap, cobweb
          const trap = h > 0 && h * (1 + a) < 0.25;
          if (trap) sP.rect(0.5, 0.5, 1, 1, { fill: 'teal', fillAlpha: 0.12, color: 'teal', width: 1 });
          sP.line(-0.1, -0.1, 1.25, 1.25, { color: 'muted', width: 1.2, dash: [4, 4] });
          sP.path(xs.map((x, i) => (isFinite(Ps[i]) ? [x, Ps[i]] : null)), { color: 'accent', width: 2.6 });
          const cob = []; let xc = x0;
          for (let k = 0; k < 14 && isFinite(xc) && xc > -0.1; k++) { const y = P(xc); if (!isFinite(y)) break; cob.push([xc, xc], [xc, y]); xc = y; }
          sP.clip(() => sP.path([[x0, 0], ...cob], { color: 'gold', width: 1.5 }));
          for (const fp of fps) fpGlyph(v, sP, fp.x, fp.x, fp.d < 1 ? 'stable' : 'unstable');
          info = { h, a, fps, trap, samples };
        });
        v.readout(() => {
          if (!info) return '';
          const { h, a, fps, trap } = info;
          let r = '';
          if (!fps.length) r = String.raw`$P(x) < x$ for every $x$: no fixed point, hence no periodic solution — the yearly samples decrease every season and every population is driven to extinction.`;
          else r = `${fps.length} periodic solution${fps.length > 1 ? 's' : ''}: ` + fps.map((fp) => String.raw`$x^* = ${v.fix(fp.x, 4)}$ (${fp.d < 1 ? 'stable' : 'unstable'}; $P'(x^*) = ${v.fix(fp.d, 4)}$, Floquet formula $e^{\int_0^1(1-2x^*(t))dt} = ${v.fix(fp.floq, 4)}$; returns to within $${v.sci(Math.max(fp.ret, 1e-16), 1)}$)`).join(' · ') + '.';
          r += trap ? String.raw` Trap: $h(1+a) = ${v.fix(h * (1 + a), 3)} < \tfrac14$, so $f(t,\tfrac12) > 0 > f(t,1)$ for all $t$ and $P[\tfrac12,1]\subset[\tfrac12,1]$, which guarantees a fixed point there.` : String.raw` The trap condition $h(1+a) < \tfrac14$ fails ($${v.fix(h * (1 + a), 3)}$)` + (fps.length ? ', yet periodic solutions still exist: the condition is sufficient, not necessary.' : '.');
          return r;
        });
      },
    },
  ],
};
