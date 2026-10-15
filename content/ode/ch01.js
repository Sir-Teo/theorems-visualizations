// Ordinary Differential Equations & Dynamical Systems — Chapter 1: First-order equations and flows on the line

// ---------- shared helpers ----------
/** One classical Runge–Kutta step for the scalar equation x' = f(t, x). */
function rk4s(f, t, x, h) {
  const k1 = f(t, x), k2 = f(t + h / 2, x + (h / 2) * k1), k3 = f(t + h / 2, x + (h / 2) * k2), k4 = f(t + h, x + h * k3);
  return x + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}
/**
 * Integrate x' = f(t, x) from (t0, x0) toward t1 (either direction) with RK4. The step is at most h and small enough
 * that x changes by only a few per cent per step, so a blow-up is followed closely. Stops once |x| > cap and records
 * the time in out.escape. → [[t, x], …]
 */
function trace(f, t0, x0, t1, o = {}) {
  const h = o.h ?? 0.01, cap = o.cap ?? 1e3, dir = t1 >= t0 ? 1 : -1, out = [[t0, x0]];
  let t = t0, x = x0;
  for (let i = 0; i < (o.max ?? 40000); i++) {
    const rem = (t1 - t) * dir; if (rem <= 1e-12) break;
    const sp = Math.abs(f(t, x));
    const dt = Math.min(h, rem, (0.04 * Math.abs(x) + 0.02) / (sp || 1e-300));
    const xn = rk4s(f, t, x, dir * dt);
    if (!isFinite(xn) || Math.abs(xn) > cap) { out.escape = t + dir * dt; break; }
    t += dir * dt; x = xn; out.push([t, x]);
  }
  return out;
}
/** Linear interpolation in a trajectory [[t, x], …] (t increasing or decreasing); NaN outside its time range. */
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
/** Slope field of x' = f(t, x): a short segment of slope f at every grid point (spacing in pixels). */
function slopeField(s, f, st = {}) {
  const sp = st.spacing ?? 24, L = sp * (st.len ?? 0.36), sx = s.X(1) - s.X(0), sy = s.Y(0) - s.Y(1), pts = [];
  for (let py = sp / 2; py < s.height; py += sp) for (let px = sp / 2; px < s.width; px += sp) {
    const [t, x] = s.inv(px, py), m = f(t, x);
    if (!isFinite(m)) continue;
    const dx = sx, dy = -sy * m, n = Math.hypot(dx, dy), ux = (dx / n) * L, uy = (dy / n) * L;
    pts.push(s.inv(px - ux, py - uy), s.inv(px + ux, py + uy), null);
  }
  s.path(pts, { color: st.color ?? 'muted', width: st.width ?? 1.3, alpha: st.alpha ?? 0.6 });
}
/** Zeros of f on [a, b]: sign changes on an n-point grid, refined by bisection. */
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
/** Type of the fixed point z of x' = f(x) from the signs of f on either side: stable, unstable or half-stable. */
function classify(f, z, d = 1e-3) {
  const l = f(z - d), r = f(z + d);
  if (l > 0 && r < 0) return { type: 'stable', dir: 0 };
  if (l < 0 && r > 0) return { type: 'unstable', dir: 0 };
  return { type: 'half', dir: l + r > 0 ? 1 : -1 };
}
/** Fixed-point glyph: filled green = stable, hollow red = unstable, half-filled orange = half-stable
 *  (`fill` = canvas angle of the filled half: π = left, 0 = right, π/2 = below, −π/2 = above). */
function fpGlyph(v, s, x, y, type, fill = Math.PI, r = 6) {
  if (type === 'stable') { s.dot(x, y, { r, color: 'green' }); return; }
  if (type === 'unstable') { s.dot(x, y, { r, color: 'red', hollow: true, width: 2.2 }); return; }
  s.dot(x, y, { r, color: 'orange', hollow: true, width: 2.2 });
  const c = s.ctx, X = s.X(x), Y = s.Y(y);
  c.save(); c.beginPath(); c.moveTo(X, Y); c.arc(X, Y, r - 0.6, fill - Math.PI / 2, fill + Math.PI / 2); c.closePath(); c.fillStyle = v.color('orange'); c.fill(); c.restore();
}
/** Arrows of the flow x' = f(x) along a phase line, one per interval between consecutive fixed points.
 *  Horizontal line at height `at` (data x along the axis) or, with vertical: true, a vertical line at t = at. */
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
/** Natural cubic spline through (xs[i], ys[i]) (xs increasing). */
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
/** a, a + d, a + 2d, … up to b (inclusive, with a little slack). */
function arange(a, b, d) { const out = []; for (let x = a; x <= b + d * 1e-6; x += d) out.push(+x.toFixed(10)); return out; }
/** Composite Simpson integral of g over [a, b] (signed; n even). */
function simpson(g, a, b, n = 400) {
  if (a === b) return 0;
  const hh = (b - a) / n; let s = g(a) + g(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * g(a + i * hh);
  return (s * hh) / 3;
}

export default {
  collection: 'ode',
  chapter: 1,
  title: 'First-order equations and flows on the line',
  summary: String.raw`An ordinary differential equation prescribes a velocity at every time and state, and a solution is a curve that obeys it at each instant. For one autonomous equation $\dot x = f(x)$ the whole story can be read off a phase line: solutions slide monotonically toward or away from fixed points, can never oscillate, and behave like an overdamped ball rolling down a potential. The classical techniques — separation of variables, integrating factors, exact equations, the Bernoulli and Riccati substitutions — solve the standard models of growth, decay and harvesting exactly. Two warnings appear early: solutions can blow up in finite time, and without a Lipschitz condition they need not be unique. Periodic forcing is handled by the period (stroboscopic) map, whose fixed points are the periodic solutions.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Ordinary differential equations and initial value problems',
      statement: String.raw`A first-order *ordinary differential equation* (ODE) is a relation
$$\dot x = f(t, x),$$
where $f: U\to\R^n$ is defined on an open set $U\subset\R\times\R^n$ of times and states. A *solution* is a differentiable map $\varphi: I\to\R^n$ on an open interval $I$ such that $(t,\varphi(t))\in U$ and
$$\varphi'(t) = f\big(t,\varphi(t)\big)\quad\text{for every } t\in I:$$
at each instant the velocity of the curve is the one $f$ prescribes at its current time and state. The equation is *autonomous* if $f$ does not depend on $t$, and *linear* if $f$ is affine in $x$. An *initial value problem* (IVP) adds the condition $x(t_0) = x_0$ for a given point $(t_0,x_0)\in U$.

An equation of order $k$, $x^{(k)} = F(t,x,\dot x,\dots,x^{(k-1)})$, is equivalent to the first-order system for $y = (x,\dot x,\dots,x^{(k-1)})$, so first-order systems cover every case.`,
      idea: String.raw`The definition turns a law of motion into geometry: $f$ attaches a velocity to every (time, state) pair, and a solution is a curve that follows these instructions at every moment. Prescribing $x(t_0)$ fixes the starting point; the derivative there is then forced to equal $f(t_0,x_0)$, and integrating the local instructions produces the whole curve. Whether this singles out exactly one curve, and for how long it lives, is the subject of chapter 2. Already $\dot x = x^2$ shows that a solution may exist only on a bounded interval: $\varphi(t) = x_0/(1-x_0(t-t_0))$ escapes to infinity at $t_0+1/x_0$. The derivative is the one of pma-5.1, taken componentwise.`,
      caption: String.raw`Pick a right-hand side and drag the initial point $(t_0,x_0)$: the solution through it is integrated forward and backward and redrawn live. Slide $\tau$ to move along the curve. The gold tangent has slope exactly $f(\tau,x(\tau))$, and the side panel shows the velocity field $f(\tau,\cdot)$ along the state line at that instant. Click anywhere to keep extra solutions for comparison.`,
      deps: ['pma-5.1'],
      refs: ['Teschl §1.2'],
      see: ['ode-2.4', 'ode-2.11'],
      tags: ['initial value problem', 'solutions'],
      viz(v) {
        const RHS = {
          lin: { label: '$t - x$', f: (t, x) => t - x, exact: (t, t0, x0) => t - 1 + (x0 - t0 + 1) * Math.exp(-(t - t0)) },
          per: { label: '$x\\sin t$', f: (t, x) => x * Math.sin(t), exact: (t, t0, x0) => x0 * Math.exp(Math.cos(t0) - Math.cos(t)) },
          sq: { label: '$x^2$', f: (t, x) => x * x, exact: (t, t0, x0) => x0 / (1 - x0 * (t - t0)), blow: true },
          ric: { label: '$t^2 - x^2$', f: (t, x) => t * t - x * x, exact: null, blow: true },
        };
        const which = v.select('$\\dot x = f(t,x) =$', Object.entries(RHS).map(([value, o]) => ({ value, label: o.label })), 'per');
        const tau = v.slider('$\\tau$', -2, 6, 2.0, { step: 0.01 });
        const s = v.stage({ x: [-2, 6], y: [-3, 3], height: 340, weight: 2.3, minWidth: 360, xlabel: 't', ylabel: 'x', title: 'solutions in the $(t,x)$ plane' });
        const sv = v.stage({ x: [-4, 4], y: [-3, 3], height: 340, weight: 1, minWidth: 190, xlabel: 'ẋ', ylabel: 'x', title: 'velocity $f(\\tau,x)$ against state $x$' });
        const P = s.handle(0.6, 0.35, { color: 'accent', label: '$(t_0,x_0)$', labelPos: 'nw' });
        const pins = [[-1, -1.6], [0.8, 2.2]];
        const PIN = ['teal', 'purple', 'orange', 'pink', 'blue'];
        s.onClick((t, x) => {
          if (Math.hypot(s.X(t) - s.X(P.x), s.Y(x) - s.Y(P.y)) < 16) return;
          pins.push([t, x]); if (pins.length > 5) pins.shift();
        });
        v.button('Clear kept solutions', () => { pins.length = 0; });
        const solve = (E, t0, x0) => {
          const cap = E.blow ? 1e4 : 1e7;
          return { fw: trace(E.f, t0, x0, 6, { h: 0.01, cap }), bw: trace(E.f, t0, x0, -2, { h: 0.01, cap }) };
        };
        let info = null;
        v.legend([['accent', 'the solution of the IVP'], ['gold', 'tangent of slope $f(\\tau,x(\\tau))$'], ['teal', 'kept solutions'], ['red', 'escape time', { dash: true }]]);
        v.render(() => {
          const E = RHS[which.value], t0 = P.x, x0 = P.y;
          const sol = solve(E, t0, x0);
          const full = sol.bw.slice().reverse().concat(sol.fw.slice(1));
          s.clip(() => {
            pins.forEach(([a, b], i) => { const q = solve(E, a, b); s.path(q.bw.slice().reverse().concat(q.fw.slice(1)), { color: PIN[i % PIN.length], width: 1.6, alpha: 0.75 }); s.dot(a, b, { r: 3.2, color: PIN[i % PIN.length] }); });
            s.path(full, { color: 'accent', width: 2.8 });
          });
          const esc = [];
          if (E.blow) for (const k of ['fw', 'bw']) if (sol[k].escape != null) { esc.push(sol[k].escape); s.vline(sol[k].escape, { color: 'red', dash: [6, 4], width: 1.4 }); s.text(k === 'fw' ? 'x → ±∞' : '±∞ ← x', sol[k].escape, 2.75, { color: 'red', size: 11.5, align: k === 'fw' ? 'right' : 'left', dx: k === 'fw' ? -5 : 5 }); }
          // tangent at τ
          const T = tau.value, xT = at(full, T), m = isFinite(xT) ? E.f(T, xT) : NaN;
          if (isFinite(xT)) {
            const sx = s.X(1) - s.X(0), sy = s.Y(0) - s.Y(1), dx = sx, dy = sy * m, nn = Math.hypot(dx, dy), L = 52;
            s.line(T - (L * dx) / nn / sx, xT - (L * dy) / nn / sy, T + (L * dx) / nn / sx, xT + (L * dy) / nn / sy, { color: 'gold', width: 2.4 });
            s.dot(T, xT, { r: 5, color: 'gold' });
          }
          s.vline(T, { color: 'gold', width: 1, alpha: 0.45, dash: [2, 4] });
          // side panel: the velocity field at time τ along the state line
          const xs = v.M.linspace(-3, 3, 121);
          let V = 1; for (const x of xs) { const q = Math.abs(E.f(T, x)); if (isFinite(q)) V = Math.max(V, q); }
          V = Math.min(V * 1.15, 60);
          sv.setView([-V, V], [-3, 3]);
          for (let x = -2.75; x <= 2.76; x += 0.5) { const q = E.f(T, x); if (Math.abs(q) > V * 0.03) sv.arrow(0, x, q, x, { color: 'orange', alpha: 0.35, width: 1.4 }); }
          sv.path(xs.map((x) => [E.f(T, x), x]), { color: 'orange', width: 2.2 });
          sv.vline(0, { color: 'ink', width: 1.6 });
          sv.tex('f(\\tau,x)', V * 0.95, 2.7, { color: 'orange', align: 'right', size: 14 });
          if (isFinite(xT) && Math.abs(xT) < 3) {
            sv.line(0, xT, m, xT, { color: 'gold', width: 2.6 });
            sv.dot(m, xT, { r: 4, color: 'gold' });
            sv.dot(0, xT, { r: 6, color: 'gold', label: 'x(τ)', labelPos: m > 0 ? 'w' : 'e' });
          }
          info = { E, t0, x0, sol, full, T, xT, m, esc };
        });
        v.readout(() => {
          if (!info) return '';
          const { E, t0, x0, sol, T, xT, m, esc } = info, f0 = E.f(t0, x0);
          let s1 = String.raw`IVP $x(${v.fix(t0, 2)}) = ${v.fix(x0, 2)}$: the curve must leave this point with slope $f(t_0,x_0) = ${v.fix(f0, 3)}$.`;
          if (isFinite(xT)) s1 += String.raw` At $\tau = ${v.fix(T, 2)}$: $x(\tau) = ${v.fix(xT, 4)}$ and $\dot x(\tau) = f(\tau,x(\tau)) = ${v.fix(m, 3)}$.`;
          else s1 += String.raw` The solution does not reach $\tau = ${v.fix(T, 2)}$.`;
          if (E.exact) {
            let err = 0;
            for (const k of ['fw', 'bw']) for (const [t, x] of sol[k]) if (Math.abs(x) < 1e3) { const e = Math.abs(x - E.exact(t, t0, x0)) / Math.max(1, Math.abs(x)); if (isFinite(e)) err = Math.max(err, e); }
            s1 += String.raw` RK4 agrees with the exact solution to relative error $${v.sci(Math.max(err, 1e-16), 1)}$.`;
          } else {
            let res = 0; const F = info.full;
            for (let i = 0; i + 1 < F.length; i++) { const [ta, xa] = F[i], [tb, xb] = F[i + 1]; if (Math.abs(xa) > 20 || tb === ta) continue; res = Math.max(res, Math.abs((xb - xa) / (tb - ta) - (E.f(ta, xa) + E.f(tb, xb)) / 2)); }
            s1 += String.raw` No elementary formula exists; the computed curve satisfies $\dot x = f$ to $${v.sci(Math.max(res, 1e-16), 1)}$ (trapezoid residual).`;
          }
          if (esc.length) {
            s1 += ` The solution exists only on a bounded interval: it escapes to infinity at $t \\approx ${esc.map((e) => v.fix(e, 3)).join('$ and $')}$`;
            if (which.value === 'sq' && x0 !== 0) s1 += String.raw` (exactly $t_0 + 1/x_0 = ${v.fix(t0 + 1 / x0, 3)}$)`;
            s1 += '.';
          } else s1 += ' It is defined on the whole window.';
          return s1;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Concept',
      name: 'Direction fields',
      statement: String.raw`For a scalar equation $\dot x = f(t,x)$, the *direction field* (slope field) attaches to each point $(t,x)$ of the plane a short line segment of slope $f(t,x)$. A differentiable curve $t\mapsto(t,x(t))$ is a solution exactly when it is tangent to the field at every one of its points. The *isoclines* $\{(t,x): f(t,x) = c\}$ are the curves along which all segments share the slope $c$; the zero isocline separates the region where solutions rise from the region where they fall.`,
      idea: String.raw`The definition of a solution (1.1) is a pointwise condition — the slope of the graph at $(t,x(t))$ equals $f(t,x(t))$ — so solutions can be recognised, and sketched, by eye without solving anything. The field shows where solutions are funnelled together (below the parabola $x^2 = t$ for $\dot x = x^2 - t$) and where they are torn apart (above it). An isocline is generally *not* a solution, since solutions cross it with slope $c$ while it may have another slope; but an isocline that is itself tangent to the field is one, like the line $x = t+1$ for $\dot x = x - t$, which is the isocline of slope $1$.`,
      caption: String.raw`Drag across the field to draw a curve freehand: it is coloured green where it is tangent to the field (within $8^\circ$), gold where it is close and red where it cuts across. Click a point to launch the true solution through it. Turn on the isoclines to see the curves of constant slope.`,
      deps: ['ode-1.1'],
      refs: ['Hirsch–Smale–Devaney ch. 1'],
      tags: ['direction field', 'isoclines'],
      viz(v) {
        const FIELDS = {
          funnel: { label: '$x^2 - t$', f: (t, x) => x * x - t, seeds: [[2.2, 0.6], [-1, -2.9], [3, 1.85]], stroke: { at: [1.8, 1.45], span: [-1.5, 4.8], bump: [0.9, 0.5] } },
          line: { label: '$x - t$', f: (t, x) => x - t, seeds: [[-3, -2], [0, 0.6], [0, 1.4]], stroke: { at: [-3, -2.1], span: [-3, 2], bump: [-1.2, 0.5] } },
          bell: { label: '$-t\\,x$', f: (t, x) => -t * x, seeds: [[0, 2.6], [0, -1.5]], stroke: { at: [-2.3, 0.15], span: [-2.3, 3], bump: [0.2, 0.7] } },
        };
        const mkStroke = (F) => {
          const { at: [ts, xs], span: [ta, tb], bump: [tc, amp] } = F.stroke;
          const q = trace(F.f, ts, xs, ta, { h: 0.04, cap: 50 }).reverse().concat(trace(F.f, ts, xs, tb, { h: 0.04, cap: 50 }).slice(1));
          return q.filter(([, x], i) => i % 2 === 0 && Math.abs(x) < 3.2).map(([t, x]) => [t, x + amp * Math.exp(-(((t - tc) / 0.55) ** 2))]);
        };
        let stroke = [], prev = null, launched = [];
        const reset = (k) => { stroke = mkStroke(FIELDS[k]); launched = FIELDS[k].seeds.map((p) => p.slice()); };
        const which = v.select('$\\dot x =$', Object.entries(FIELDS).map(([value, o]) => ({ value, label: o.label })), 'funnel', { onChange: (k) => reset(k) });
        const iso = v.toggle('isoclines', false);
        const s = v.stage({ x: [-3, 5], y: [-3, 3], height: 380, full: true, xlabel: 't', ylabel: 'x' });
        reset('funnel');
        s.onDrag((t, x, ph) => {
          if (ph === 'start') { prev = stroke; stroke = [[t, x]]; return; }
          if (ph === 'move') { const l = stroke[stroke.length - 1]; if (Math.hypot(s.X(t) - s.X(l[0]), s.Y(x) - s.Y(l[1])) > 2) stroke.push([t, x]); return; }
          // a short gesture is a click: launch a solution and keep the previous drawing
          let ext = 0; for (const p of stroke) ext = Math.max(ext, Math.hypot(s.X(p[0]) - s.X(stroke[0][0]), s.Y(p[1]) - s.Y(stroke[0][1])));
          if (ext < 8) { stroke = prev || []; launched.push([t, x]); if (launched.length > 8) launched.shift(); }
        });
        v.button('Clear', () => { stroke = []; launched = []; });
        let stats = null;
        v.legend([['green', 'tangent to the field'], ['gold', 'within 20°'], ['red', 'cuts across'], ['accent', 'launched solutions']]);
        v.render(() => {
          const F = FIELDS[which.value], f = F.f;
          if (iso.value) {
            for (const c of [-2, -1, 1, 2]) s.contour(f, [c], { color: 'purple', width: 1.2, dash: [5, 4], res: 90 });
            s.contour(f, [0], { color: 'purple', width: 2, res: 90 });
          }
          slopeField(s, f, { spacing: 23 });
          if (iso.value) {
            // label each isocline where it crosses the vertical line t = 4.2 (or the top edge)
            for (const c of [-2, -1, 0, 1, 2]) {
              const g = (x) => f(4.2, x) - c, zs = zerosOf(g, -2.9, 2.9, 120);
              if (zs.length) s.text(c === 0 ? 'slope 0' : `slope ${c > 0 ? c : '−' + -c}`, 4.25, zs[zs.length - 1], { color: 'purple', size: 11, align: 'left', dy: -8 });
            }
          }
          s.clip(() => {
            for (const [t0, x0] of launched) {
              const a = trace(f, t0, x0, 5.2, { h: 0.01, cap: 40 }), b = trace(f, t0, x0, -3.2, { h: 0.01, cap: 40 });
              s.path(b.reverse().concat(a), { color: 'accent', width: 2.2 });
              s.dot(t0, x0, { r: 3.5, color: 'accent' });
            }
          });
          // freehand curve, coloured by its angle to the field
          stats = null;
          if (stroke.length > 1) {
            const P = stroke.map(([t, x]) => [s.X(t), s.Y(x)]), R = [P[0]];
            let acc = 0;
            for (let i = 1; i < P.length; i++) {
              const seg = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); acc += seg;
              if (acc >= 7) { R.push(P[i]); acc = 0; }
            }
            if (R.length > 2) {
              const sx = s.X(1) - s.X(0), sy = s.Y(0) - s.Y(1);
              let good = 0, tot = 0, worst = 0, run = [], runCol = null;
              const flush = () => { if (run.length > 1) s.path(run.map((q) => s.inv(q[0], q[1])), { color: runCol, width: 4 }); };
              for (let i = 0; i + 1 < R.length; i++) {
                const a = R[Math.max(0, i - 1)], b = R[Math.min(R.length - 1, i + 2)];
                const ux = b[0] - a[0], uy = b[1] - a[1];
                const mid = s.inv((R[i][0] + R[i + 1][0]) / 2, (R[i][1] + R[i + 1][1]) / 2), m = f(mid[0], mid[1]);
                const wx = sx, wy = -sy * m;
                const cosA = Math.abs(ux * wx + uy * wy) / (Math.hypot(ux, uy) * Math.hypot(wx, wy) || 1), ang = (Math.acos(Math.min(1, cosA)) * 180) / Math.PI;
                const len = Math.hypot(R[i + 1][0] - R[i][0], R[i + 1][1] - R[i][1]);
                tot += len; if (ang < 8) good += len; worst = Math.max(worst, ang);
                const col = ang < 8 ? 'green' : ang < 20 ? 'gold' : 'red';
                if (col !== runCol) { flush(); run = [R[i]]; runCol = col; }
                run.push(R[i + 1]);
              }
              flush();
              stats = { frac: tot ? good / tot : 0, worst };
            }
          }
        });
        v.readout(() => {
          const zero = which.value === 'line' ? String.raw`The isocline of slope $1$ is the line $x = t+1$, and it is a solution.` : which.value === 'funnel' ? String.raw`The zero isocline is the parabola $x^2 = t$: solutions rise outside it and fall inside it.` : String.raw`The zero isocline is the pair of axes $t = 0$, $x = 0$; every solution $x_0e^{-t^2/2}$ peaks on $t = 0$.`;
          if (!stats) return `Draw a curve across the field. ${zero}`;
          return String.raw`Your curve is tangent to the field (within $8^\circ$) along $${v.fix(100 * stats.frac, 0)}\%$ of its length; worst angle $${v.fix(stats.worst, 0)}^\circ$. ` + (stats.frac > 0.97 ? 'It is (numerically) a solution. ' : 'Where it is red it is not following any solution. ') + zero;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Method',
      name: 'Separation of variables',
      credit: 'Leibniz and Johann Bernoulli, 1691–1694',
      statement: String.raw`Consider $\dot x = g(t)\,h(x)$ with $g$ continuous on an interval $I$ and $h$ continuous on an interval $J$. Every zero $x^*$ of $h$ gives a constant solution $x\equiv x^*$. On a subinterval where $h\neq0$, let $G$ be an antiderivative of $g$ and $H$ an antiderivative of $1/h$. Then the solution with $x(t_0) = x_0$ (where $h(x_0)\ne0$) is given implicitly by
$$H(x(t)) - H(x_0) = G(t) - G(t_0),\qquad\text{i.e.}\qquad \int_{x_0}^{x(t)}\frac{d\xi}{h(\xi)} = \int_{t_0}^{t} g(s)\,ds,$$
as long as $x(t)$ stays in the interval where $h\ne0$; since $H$ is strictly monotone there, this determines $x(t) = H^{-1}(H(x_0) + G(t) - G(t_0))$. The solution curves are the level sets of $H(x) - G(t)$.`,
      idea: String.raw`If $x$ is a solution and $h(x(t))\ne 0$, then $\frac{d}{dt}H(x(t)) = \dot x/h(x) = g(t)$, so $H(x(t)) - G(t)$ has zero derivative and is constant — the fundamental theorem of calculus (pma-6.21) does the rest. The formal rule “$dx/h(x) = g\,dt$, integrate both sides” is this computation. Dividing by $h$ loses the constant solutions at the zeros of $h$; they must be added back by hand. Uniqueness can fail at those zeros when $1/h$ is not integrable there (1.15), but when $\int d\xi/h$ diverges at $x^*$ no other solution can reach $x^*$ in finite time.`,
      caption: String.raw`Drag the initial point. The faint curves are level sets of $H(x) - G(t)$; the gold dots are an RK4 solution, and they run exactly along a level set. Slide $t_1$: the two lower panels shade $\int_{t_0}^{t_1} g$ and $\int_{x_0}^{x(t_1)} d\xi/h$, which are always equal. Red dashed lines are the constant solutions that division by $h$ throws away.`,
      deps: ['ode-1.1', 'pma-6.21'],
      refs: ['Teschl §1.4'],
      tags: ['explicit solutions', 'separable equations'],
      viz(v) {
        const EX = {
          logcos: {
            label: '$x(1-x)\\cos t$', g: Math.cos, h: (x) => x * (1 - x), G: Math.sin, H: (x) => Math.log(Math.abs(x / (1 - x))),
            sing: [0, 1], lost: [0, 1], x: [-0.45, 1.45], t: [0, 12.6], P: [1.6, 0.5], t1: 4.4, lv: arange(-0.4, 1.4, 0.1), hy: [-12, 12],
          },
          tx2: {
            label: '$t\\,x^2$', g: (t) => t, h: (x) => x * x, G: (t) => (t * t) / 2, H: (x) => -1 / x,
            sing: [0], lost: [0], x: [-2.5, 3], t: [-3, 3], P: [-1.5, 0.6], t1: 0.8, lv: arange(-2.4, 2.9, 0.25), hy: [0, 12],
          },
          circ: {
            label: '$-t/x$', g: (t) => -t, h: (x) => 1 / x, G: (t) => (-t * t) / 2, H: (x) => (x * x) / 2,
            sing: [0], lost: [], x: [-2.6, 2.6], t: [-6, 6], P: [-1, 1.6], t1: 1.2, lv: arange(0.25, 7, 0.25), hy: [-2.8, 2.8],
          },
        };
        const which = v.select('$\\dot x = g(t)h(x) =$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'logcos', {
          onChange: (k) => { const E = EX[k]; P.set(E.P[0], E.P[1]); t1.set(E.t1); },
        });
        const t1 = v.slider('$t_1$', -6, 12.6, EX.logcos.t1, { step: 0.01 });
        const s = v.stage({ x: EX.logcos.t, y: EX.logcos.x, height: 290, full: true, xlabel: 't', ylabel: 'x', title: 'level sets of $H(x)-G(t)$ and a numerical solution' });
        const sg = v.stage({ x: EX.logcos.t, y: [-1.3, 1.3], height: 170, axes: true, xlabel: 't', title: '$g(t)$ and $\\int_{t_0}^{t_1} g\\,dt$' });
        const sh = v.stage({ x: EX.logcos.x, y: [-12, 12], height: 170, axes: true, xlabel: 'x', title: '$1/h(x)$ and $\\int_{x_0}^{x(t_1)} d\\xi/h$' });
        const P = s.handle(EX.logcos.P[0], EX.logcos.P[1], { color: 'accent', label: '$(t_0,x_0)$', labelPos: 'ne' });
        let info = null, lastK = null;
        v.legend([['faint', 'level sets of $H(x)-G(t)$'], ['gold', 'RK4 solution', { dot: true }], ['red', 'constant solutions lost by dividing by $h$', { dash: true }], ['teal', 'equal signed areas', { area: true }]]);
        v.render(() => {
          const E = EX[which.value], f = (t, x) => E.g(t) * E.h(x);
          if (lastK !== which.value) {
            lastK = which.value;
            let tr = E.t;
            if (which.value === 'circ') { const r = (s.width / s.height) * (E.x[1] - E.x[0]) / 2; tr = [-r, r]; }
            s.setView(tr, E.x); sg.setView(tr, null); sh.setView(E.x, E.hy);
            E.tr = tr;
          }
          const tr = E.tr;
          // keep the handle off the singular lines
          for (const z of E.sing) if (Math.abs(P.y - z) < 0.04) P.y = z + (P.y >= z ? 0.04 : -0.04);
          const t0 = P.x, x0 = P.y;
          const near = (x) => E.sing.some((z) => Math.abs(x - z) < 0.012 * (E.x[1] - E.x[0]));
          const Phi = (t, x) => (near(x) ? NaN : E.H(x) - E.G(t));
          // one level set through each of a row of evenly spaced points on the line t = 0, so the curves are evenly spread
          const levels = E.lv.filter((x) => !E.sing.some((z) => Math.abs(x - z) < 1e-9)).map((x) => E.H(x) - E.G(0));
          s.contour(Phi, levels, { color: 'faint', width: 1.1, res: 150 });
          for (const z of E.lost) { s.hline(z, { color: 'red', width: 1.6, dash: [7, 5] }); s.text('h(x) = 0', tr[1], z, { color: 'red', size: 11, align: 'right', dx: -6, dy: 10 }); }
          if (which.value === 'circ') s.hline(0, { color: 'orange', width: 1, dash: [2, 4] });
          // numerical solution, stopped near the singular lines (where the slope blows up for -t/x)
          const g2 = (t, x) => (near(x) && which.value === 'circ' ? NaN : f(t, x));
          const fw = trace(g2, t0, x0, tr[1], { h: 0.01, cap: 60 }), bw = trace(g2, t0, x0, tr[0], { h: 0.01, cap: 60 });
          const full = bw.slice().reverse().concat(fw.slice(1));
          s.clip(() => {
            s.path(full, { color: 'gold', width: 1.4, alpha: 0.6 });
            s.dots(full.filter((_, i) => i % 14 === 0), { r: 2.6, color: 'gold' });
          });
          // the time t1, clamped to the interval of existence
          const lo = full[0][0], hi = full[full.length - 1][0], T1 = v.M.clamp(t1.value, lo, hi), x1 = at(full, T1);
          s.dot(T1, x1, { r: 5.5, color: 'teal', label: 'x(t₁)', labelPos: 'se' });
          s.vline(T1, { color: 'teal', width: 1, dash: [3, 4], alpha: 0.7 });
          // lower left: ∫ g dt
          sg.fn(E.g, { color: 'ink', width: 1.8 });
          sg.fn(E.g, { domain: [Math.min(t0, T1), Math.max(t0, T1)], color: 'teal', width: 2.4, fill: 'teal', fillAlpha: 0.25 });
          sg.vline(t0, { color: 'accent', width: 1.2, dash: [3, 3] }); sg.vline(T1, { color: 'teal', width: 1.2, dash: [3, 3] });
          // lower right: ∫ dξ/h
          const ih = (x) => 1 / E.h(x);
          sh.fn(ih, { color: 'ink', width: 1.8 });
          sh.fn(ih, { domain: [Math.min(x0, x1), Math.max(x0, x1)], color: 'teal', width: 2.4, fill: 'teal', fillAlpha: 0.25 });
          for (const z of E.lost) sh.vline(z, { color: 'red', width: 1.2, dash: [6, 4] });
          sh.vline(x0, { color: 'accent', width: 1.2, dash: [3, 3] }); sh.vline(x1, { color: 'teal', width: 1.2, dash: [3, 3] });
          const Ig = simpson(E.g, t0, T1, 600), Ih = simpson(ih, x0, x1, 600);
          let drift = 0; const c0 = E.H(x0) - E.G(t0);
          for (const [t, x] of full) drift = Math.max(drift, Math.abs(E.H(x) - E.G(t) - c0));
          info = { Ig, Ih, drift, lo, hi, tr, T1, clamped: Math.abs(T1 - t1.value) > 1e-9 };
        });
        v.readout(() => {
          if (!info) return '';
          const { Ig, Ih, drift, lo, hi, tr, clamped } = info;
          let r = String.raw`$\int_{t_0}^{t_1} g(s)\,ds = ${v.fix(Ig, 5)}$ and $\int_{x_0}^{x(t_1)} \frac{d\xi}{h(\xi)} = ${v.fix(Ih, 5)}$. Along the whole RK4 solution $H(x)-G(t)$ stays constant to $${v.sci(Math.max(drift, 1e-16), 1)}$.`;
          const ends = [];
          if (lo > tr[0] + 0.02) ends.push(`$t = ${v.fix(lo, 2)}$`);
          if (hi < tr[1] - 0.02) ends.push(`$t = ${v.fix(hi, 2)}$`);
          if (ends.length) r += ` The solution ends at ${ends.join(' and ')}` + (which.value === 'circ' ? ', where it reaches $x = 0$ with a vertical tangent and $f = -t/x$ is undefined.' : ', where it escapes to infinity.') + (clamped ? ' ($t_1$ is clamped to this interval.)' : '');
          return r;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Method',
      name: 'Linear equations and integrating factors',
      credit: 'Leibniz, 1694; Euler',
      statement: String.raw`Let $a, b$ be continuous on an interval $I\ni t_0$. The linear equation $\dot x + a(t)\,x = b(t)$ has, for each $x_0$, exactly one solution on all of $I$ with $x(t_0) = x_0$, namely
$$x(t) = e^{-A(t)}\Big(x_0 + \int_{t_0}^{t} e^{A(s)}\,b(s)\,ds\Big),\qquad A(t) = \int_{t_0}^{t} a(s)\,ds.$$
It is the sum of the solution $x_0e^{-A(t)}$ of the homogeneous equation and the particular solution $x_p$ with $x_p(t_0) = 0$. The difference of any two solutions solves the homogeneous equation, so if $a(t)\ge\alpha>0$ all solutions approach one another like $e^{-\alpha (t-t_0)}$.`,
      idea: String.raw`Multiplying by the *integrating factor* $\mu(t) = e^{A(t)}$ turns the left side into an exact derivative: $\mu(\dot x + a x) = (\mu x)'$, because $\dot\mu = a\mu$. So $(\mu x)' = \mu b$, and integrating from $t_0$ (pma-6.21) gives the formula; conversely the formula solves the equation by direct differentiation, and the same computation shows any solution must equal it. Linearity is what makes this possible: in $y = \mu x$ the equation no longer involves $y$ on the right, so solutions differ only by constants $y$-wise, i.e. by multiples of $e^{-A}$ in $x$. Solutions never blow up, since the formula is finite on all of $I$.`,
      caption: String.raw`Choose the forcing $b(t)$ and the coefficient $a(t) = a_0 + a_1\sin t$, and drag $x_0$. Top: the solution (blue) is the sum of the homogeneous part $x_0e^{-A}$ (purple, dashed) and the particular solution $x_p$ (orange); gold dots are an independent RK4 solution; faint curves start from other $x_0$. Bottom: on a log scale, the distance of every solution to $x_p$ is $|x_0|e^{-A(t)}$ — parallel curves decaying at the mean rate $a_0$. Make $a_0$ negative and they diverge instead.`,
      deps: ['ode-1.3'],
      refs: ['Teschl §1.4'],
      tags: ['linear equations', 'integrating factor'],
      viz(v) {
        const B = {
          one: { label: '$1$', b: () => 1 },
          cos: { label: '$2\\cos 2t$', b: (t) => 2 * Math.cos(2 * t) },
          ramp: { label: '$t/4$', b: (t) => t / 4 },
        };
        const bSel = v.select('$b(t) =$', Object.entries(B).map(([value, o]) => ({ value, label: o.label })), 'cos');
        const a0 = v.slider('$a_0$', -0.4, 2, 0.6, { step: 0.01 });
        const a1 = v.slider('$a_1$', 0, 1.5, 0.5, { step: 0.01 });
        const T = 12;
        const s = v.stage({ x: [-0.4, T], y: [-3, 4], height: 300, full: true, xlabel: 't', ylabel: 'x', title: 'solutions of $\\dot x + a(t)x = b(t)$' });
        const sl = v.stage({ x: [-0.4, T], y: [1e-5, 10], ylog: true, height: 175, full: true, xlabel: 't', title: 'distance to the particular solution, $|x(t) - x_p(t)|$ (log scale)' });
        const H = s.handle(0, 2.6, { color: 'accent', label: '$x_0$', labelPos: 'e', constrain: (x, y) => [0, v.M.clamp(y, -2.9, 3.9)] });
        let info = null;
        v.legend([['accent', '$x = x_0e^{-A} + x_p$'], ['purple', 'homogeneous $x_0e^{-A(t)}$', { dash: true }], ['orange', 'particular $x_p$'], ['gold', 'RK4 check', { dot: true }], ['muted', 'other $x_0$']]);
        v.render(() => {
          const b = B[bSel.value].b, A0 = a0.value, A1 = a1.value;
          const a = (t) => A0 + A1 * Math.sin(t), Aint = (t) => A0 * t + A1 * (1 - Math.cos(t));
          // the formula: x = e^{-A}(x0 + I(t)), I(t) = ∫0^t e^{A} b  (cumulative trapezoid on a fine grid)
          const N = 4800, h = T / N, ts = new Float64Array(N + 1), I = new Float64Array(N + 1);
          let prevV = b(0); ts[0] = 0;
          for (let i = 1; i <= N; i++) { const t = i * h, val = Math.exp(Aint(t)) * b(t); ts[i] = t; I[i] = I[i - 1] + (h * (prevV + val)) / 2; prevV = val; }
          const sol = (x0, i) => Math.exp(-Aint(ts[i])) * (x0 + I[i]);
          const curve = (g, step = 12) => { const pts = []; for (let i = 0; i <= N; i += step) pts.push([ts[i], g(i)]); return pts; };
          const x0 = H.y;
          s.clip(() => {
            for (let c = -3; c <= 4; c += 1) s.path(curve((i) => sol(c, i)), { color: 'muted', width: 1.1, alpha: 0.5 });
            s.path(curve((i) => x0 * Math.exp(-Aint(ts[i]))), { color: 'purple', width: 2, dash: [6, 4] });
            s.path(curve((i) => sol(x0, i)), { color: 'accent', width: 3.4 });
            s.path(curve((i) => sol(0, i)), { color: 'orange', width: 1.8 });
          });
          const F = (t, x) => b(t) - a(t) * x, num = trace(F, 0, x0, T, { h: 0.01, cap: 1e9 });
          s.clip(() => s.dots(num.filter((_, i) => i % 40 === 20), { r: 2.8, color: 'gold' }));
          let err = 0;
          for (const [t, x] of num) { const i = Math.round(t / h); if (Math.abs(ts[i] - t) < 1e-9) err = Math.max(err, Math.abs(x - sol(x0, i)) / Math.max(1, Math.abs(x))); }
          // lower: distances to x_p
          for (let c = -3; c <= 4; c += 1) if (c) sl.path(curve((i) => Math.abs(c) * Math.exp(-Aint(ts[i]))), { color: 'muted', width: 1.1, alpha: 0.6 });
          sl.path(curve((i) => Math.abs(x0) * Math.exp(-Aint(ts[i]))), { color: 'accent', width: 2.6 });
          const numD = num.filter((_, i) => i % 40 === 20).map(([t, x]) => { const i = Math.round(t / h); return [t, Math.abs(x - sol(0, i))]; });
          sl.dots(numD, { r: 2.8, color: 'gold' });
          sl.fn((t) => Math.exp(-A0 * t), { color: 'ink', width: 1.2, dash: [5, 4] });
          sl.tex('e^{-a_0t}', T - 0.25, Math.exp(-A0 * (T - 0.25)), { color: 'ink', size: 13, align: 'right', baseline: 'top', dy: 4 });
          const rate = (Aint(0) - Aint(T)) / T;
          info = { err, rate, A0, xpT: sol(0, N) };
        });
        v.readout(() => {
          if (!info) return '';
          const { err, rate, A0 } = info;
          let r = String.raw`Integrating-factor formula (with the integral done by quadrature) versus RK4: relative difference $${v.sci(Math.max(err, 1e-16), 1)}$. Every solution approaches $x_p$ like $e^{-A(t)}$; over $[0,${T}]$ the average decay rate is $-\tfrac1T\ln e^{-A(T)} = ${v.fix(-rate, 3)}$.`;
          r += A0 > 0 ? ' Since the mean of $a$ is positive, all initial conditions forget their start and converge to one forced response.' : A0 < 0 ? ' With a negative mean coefficient the homogeneous part grows: solutions fan out instead of converging.' : '';
          return r;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Model',
      name: 'Exponential growth and decay',
      credit: 'Malthus, 1798 (population); Rutherford & Soddy, 1902 (radioactivity)',
      statement: String.raw`A quantity whose rate of change is proportional to its current size, $\dot x = kx$, evolves as
$$x(t) = x_0e^{kt}.$$
For $k>0$ it grows by a factor $2$ in every time interval of length $T_2 = \ln 2/k$ (the doubling time), wherever it starts; for $k<0$ it halves every $T_{1/2} = \ln2/|k|$ (the half-life) and tends to the stable fixed point $0$; for $k = 0$ every state is a fixed point. On a logarithmic axis every solution is a straight line of slope $k$.`,
      scope: String.raw`Holds while the per-capita (or per-unit) rate $k$ is constant: a population with unlimited resources, a large sample of radioactive nuclei, money under continuous compounding, the early phase of an epidemic or a chain reaction. Real growth eventually saturates (1.6).`,
      idea: String.raw`The equation is linear with constant coefficient, so 1.4 (or separation, 1.3) gives $x_0e^{kt}$; the key fact is that the exponential is its own derivative (rca-0.3). The doubling time is independent of the starting value because the law is *scale-free*: if $x(t)$ is a solution, so is $cx(t)$, and $x(t+T)/x(t) = e^{kT}$ depends only on $T$. Equivalently $\ln x$ grows linearly, which is why exponential data look straight on a log scale.`,
      caption: String.raw`Slide the rate $k$ through zero and drag the initial value $x_0$. The dashed ladder marks the times at which the solution has doubled (or halved) once, twice, three times; the steps are all equal to $\ln 2/|k|$. Switch to a log axis and every solution becomes a straight line of slope $k$. Right: the phase line of $\dot x = kx$, with $0$ turning from repelling to attracting as $k$ changes sign.`,
      deps: ['ode-1.4', 'rca-0.3'],
      refs: ['Hirsch–Smale–Devaney ch. 1'],
      see: ['mathbio-1.2', 'mathbio-1.3'],
      tags: ['exponential growth', 'half-life'],
      viz(v) {
        const k = v.slider('rate $k$', -1, 1, 0.35, { step: 0.01 });
        const lg = v.toggle('log axis', false);
        const T = 10;
        const s = v.stage({ x: [-0.4, T], y: [0, 8.4], height: 320, weight: 2.3, minWidth: 360, xlabel: 't', ylabel: 'x', title: 'solutions of $\\dot x = kx$' });
        const sp = v.stage({ x: [-2, 8.4], y: [-3, 3], height: 320, weight: 1, minWidth: 200, xlabel: 'x', ylabel: 'ẋ', title: 'phase line' });
        const H = s.handle(0, 1, { color: 'accent', label: '$x_0$', labelPos: 'e', constrain: (x, y) => [0, v.M.clamp(y, 0.05, 8)] });
        let info = null, lastLog = null;
        v.legend([['accent', '$x_0e^{kt}$'], ['muted', '$2x_0e^{kt}$, $x_0e^{kt}/2$'], ['orange', 'doubling / halving ladder', { dash: true }]]);
        v.render(() => {
          if (lastLog !== lg.value) { lastLog = lg.value; s.setScale({ ylog: lg.value, y: lg.value ? [0.02, 100] : [0, 8.4] }); }
          const K = k.value, x0 = H.y, f = (t, x) => K * x;
          const num = trace(f, 0, x0, T, { h: 0.005, cap: 1e6 });
          s.clip(() => {
            for (const c of [0.25, 0.5, 2, 4]) s.fn((t) => c * x0 * Math.exp(K * t), { color: 'muted', width: 1.1, alpha: 0.6 });
            s.path(num, { color: 'accent', width: 2.8 });
          });
          // ladder: times at which the numerical solution crosses x0·2^{±n}
          const cross = [];
          if (Math.abs(K) > 1e-3) {
            const fac = K > 0 ? 2 : 0.5;
            for (let n = 1; n <= 12; n++) {
              const L = x0 * fac ** n; let tc = NaN;
              for (let i = 1; i < num.length; i++) { const [ta, xa] = num[i - 1], [tb, xb] = num[i]; if ((xa - L) * (xb - L) <= 0 && xa !== xb) { tc = ta + ((L - xa) * (tb - ta)) / (xb - xa); break; } }
              if (!isFinite(tc)) break;
              cross.push([tc, L]);
            }
            const yb = s.bounds.y[0], ytop = s.bounds.y[1];
            cross.forEach(([tc, L], i) => {
              if (L > ytop || L < yb) return;
              const prevT = i ? cross[i - 1][0] : 0, prevL = i ? cross[i - 1][1] : x0;
              s.line(prevT, prevL, tc, prevL, { color: 'orange', width: 1.4, dash: [5, 4] });
              s.line(tc, prevL, tc, L, { color: 'orange', width: 1.4, dash: [5, 4] });
              s.line(tc, L, tc, yb, { color: 'orange', width: 0.8, alpha: 0.35 });
              s.dot(tc, L, { r: 3.6, color: 'orange' });
              if (i < 4 && (s.X(tc) - s.X(prevT)) > 26) s.text(i === 0 ? 'T' : `${i + 1}T`, tc, yb, { color: 'orange', size: 11.5, align: 'center', baseline: 'bottom', dy: -3 });
            });
          }
          // phase line
          sp.setView(null, [-Math.max(1, Math.abs(K) * 8.4), Math.max(1, Math.abs(K) * 8.4)]);
          sp.fn((x) => K * x, { color: 'accent', width: 2.4 });
          const zs = Math.abs(K) > 1e-3 ? [0] : [];
          if (zs.length) phaseArrows(sp, (x) => K * x, zs, -2, 8.4, 0);
          if (Math.abs(K) > 1e-3) fpGlyph(v, sp, 0, 0, K < 0 ? 'stable' : 'unstable');
          else sp.text('every x is a fixed point', 3.2, 0, { color: 'muted', size: 11.5, align: 'center', dy: -12 });
          sp.dot(x0, K * x0, { r: 5, color: 'gold' });
          const steps = cross.map(([tc], i) => tc - (i ? cross[i - 1][0] : 0));
          info = { K, steps, x0, err: num.reduce((m, [t, x]) => Math.max(m, Math.abs(x - x0 * Math.exp(K * t)) / Math.max(1e-12, x0 * Math.exp(K * t))), 0) };
        });
        v.readout(() => {
          if (!info) return '';
          const { K, steps, err } = info;
          if (Math.abs(K) <= 1e-3) return String.raw`$k = 0$: $\dot x = 0$, every solution is constant and no doubling time exists. Slide $k$ either way.`;
          const word = K > 0 ? 'doubling time' : 'half-life';
          const meas = steps.length ? steps.slice(0, 5).map((d) => v.fix(d, 3)).join(', ') : '—';
          return String.raw`$k = ${v.fix(K, 2)}$: measured ${word} on each rung of the ladder: ${meas}; predicted $\ln 2/|k| = ${v.fix(Math.LN2 / Math.abs(K), 3)}$. The rungs are equal, whatever $x_0$ is. RK4 matches $x_0e^{kt}$ to relative error $${v.sci(Math.max(err, 1e-16), 1)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Model',
      name: 'Logistic growth',
      credit: 'Verhulst, 1838',
      statement: String.raw`The logistic equation $\dot x = rx\,(1 - x/K)$ with growth rate $r>0$ and carrying capacity $K>0$ models growth whose per-capita rate $r(1-x/K)$ falls linearly as the population fills its environment. Its solution with $x(0) = x_0 > 0$ is
$$x(t) = \frac{K}{1 + \big(K/x_0 - 1\big)e^{-rt}},$$
which tends to $K$ as $t\to\infty$ for every $x_0>0$: $x = 0$ is an unstable fixed point and $x = K$ a stable one. A population starting below $K/2$ follows an S-shaped curve whose inflection point, where growth is fastest ($\dot x = rK/4$), is at $x = K/2$, reached at time $t^* = \frac1r\ln(K/x_0 - 1)$.`,
      scope: String.raw`A single population with a fixed environment, no age structure, no delays and no randomness; large enough that it can be treated as a continuous quantity. Laboratory cultures of yeast and bacteria fit well; many wild populations do not.`,
      idea: String.raw`The equation is separable (1.3): partial fractions give $\int \frac{dx}{x(1-x/K)} = \ln\frac{x}{K-x}$, so $\frac{x}{K-x}$ grows like $e^{rt}$, which rearranges to the formula. (It is also a Bernoulli equation: $u = 1/x$ satisfies the *linear* equation $\dot u = r/K - ru$, see 1.13.) The phase-line picture explains everything without the formula: $f(x) = rx(1-x/K)$ is a downward parabola, positive between its zeros $0$ and $K$, so solutions climb monotonically to $K$; the speed $\dot x = f(x)$ is greatest at the vertex $x = K/2$, which is therefore where $\ddot x = f'(x)f(x)$ changes sign.`,
      caption: String.raw`Drag the initial population $x_0$ and change $r$ and $K$. A gold dot runs along the solution (left) and simultaneously along the parabola $\dot x = f(x)$ (right): it moves fastest at the vertex $x = K/2$, which is exactly the inflection point of the S-curve. Faint curves start from other $x_0$, including above $K$.`,
      deps: ['ode-1.3'],
      refs: ['Strogatz §2.3', 'Hirsch–Smale–Devaney ch. 1'],
      see: ['mathbio-1.4', 'mathbio-1.6', 'ode-1.13'],
      tags: ['logistic equation', 'population models'],
      viz(v) {
        const r = v.slider('$r$', 0.3, 2, 0.9, { step: 0.01 });
        const K = v.slider('$K$', 0.6, 2, 1.6, { step: 0.01 });
        const TM = 12;
        const s = v.stage({ x: [-0.5, TM], y: [0, 2.6], height: 320, weight: 1.6, minWidth: 330, xlabel: 't', ylabel: 'x', title: 'population $x(t)$' });
        const sp = v.stage({ x: [-0.15, 2.6], y: [-0.5, 1.15], height: 320, weight: 1, minWidth: 250, xlabel: 'x', ylabel: 'ẋ', title: 'phase line: $\\dot x = rx(1 - x/K)$' });
        const H = s.handle(0, 0.08, { color: 'accent', label: '$x_0$', labelPos: 'e', constrain: (x, y) => [0, v.M.clamp(y, 0.02, 2.55)] });
        let cache = { key: null }, info = null;
        v.legend([['accent', 'solution from $x_0$'], ['gold', 'state at time $\\tau$', { dot: true }], ['orange', '$x = K/2$ (inflection)', { dash: true }], ['green', '$x = K$', { dash: true }]]);
        v.animate((tt) => {
          const R = r.value, Kv = K.value, x0 = H.y, f = (t, x) => R * x * (1 - x / Kv);
          const key = `${R}|${Kv}|${x0}`;
          if (cache.key !== key) {
            const num = trace(f, 0, x0, TM, { h: 0.005, cap: 1e6 });
            let err = 0; for (const [t, x] of num) err = Math.max(err, Math.abs(x - Kv / (1 + (Kv / x0 - 1) * Math.exp(-R * t))));
            // measured inflection: time of the largest speed f(x) along the numerical solution
            let im = 0, best = -Infinity; num.forEach(([, x], i) => { const q = f(0, x); if (q > best) { best = q; im = i; } });
            const fan = [0.03, 0.3, 0.6, 1.0, 1.4, 2.0, 2.5].map((c) => trace(f, 0, c, TM, { h: 0.02, cap: 1e6 }));
            let tInf = NaN;
            if (im > 0 && im < num.length - 1) { // refine the maximum of the speed by a parabola through three samples
              const [ta, xa] = num[im - 1], [tb, xb] = num[im], [tc, xc] = num[im + 1], ya = f(0, xa), yb = f(0, xb), yc = f(0, xc);
              const den = (ta - tb) * (ta - tc) * (tb - tc), A = (tc * (yb - ya) + tb * (ya - yc) + ta * (yc - yb)) / den, Bq = (tc * tc * (ya - yb) + tb * tb * (yc - ya) + ta * ta * (yb - yc)) / den;
              tInf = A < 0 ? -Bq / (2 * A) : tb;
            }
            cache = { key, num, err, tInf, fan };
          }
          const { num, fan } = cache;
          s.hline(Kv, { color: 'green', width: 1.4, dash: [6, 4] });
          s.hline(Kv / 2, { color: 'orange', width: 1.2, dash: [4, 4] });
          s.text('K', TM, Kv, { color: 'green', align: 'right', dx: -6, dy: -10, math: true });
          s.text('K/2', TM, Kv / 2, { color: 'orange', align: 'right', dx: -6, dy: -10, math: true });
          for (const q of fan) s.path(q, { color: 'muted', width: 1.1, alpha: 0.55 });
          s.path(num, { color: 'accent', width: 2.8 });
          const tPred = x0 < Kv / 2 ? Math.log(Kv / x0 - 1) / R : NaN;
          if (isFinite(tPred) && tPred < TM) s.dot(tPred, Kv / 2, { r: 5, color: 'orange', hollow: true, width: 2.2 });
          // moving state
          const tau = ((tt % 8) / 8) * TM, xt = at(num, tau);
          s.vline(tau, { color: 'gold', width: 1, alpha: 0.4 });
          s.dot(tau, xt, { r: 6, color: 'gold' });
          // phase line
          sp.setView(null, [-0.6 * ((R * Kv) / 4), 1.35 * ((R * Kv) / 4)]);
          sp.fn((x) => f(0, x), { color: 'accent', width: 2.4 });
          sp.vline(Kv / 2, { color: 'orange', width: 1.2, dash: [4, 4] });
          phaseArrows(sp, (x) => f(0, x), [0, Kv], 0, 2.6, 0);
          fpGlyph(v, sp, 0, 0, 'unstable'); fpGlyph(v, sp, Kv, 0, 'stable');
          sp.dot(Kv / 2, (R * Kv) / 4, { r: 3.5, color: 'orange', label: 'rK/4', labelPos: 'ne' });
          sp.line(xt, 0, xt, f(0, xt), { color: 'gold', width: 2 });
          sp.dot(xt, f(0, xt), { r: 6, color: 'gold' });
          info = { R, Kv, x0, tPred, tau, xt };
        }, { still: 3.2 });
        v.readout(() => {
          if (!info) return '';
          const { R, Kv, x0, tPred } = info, { err, tInf } = cache;
          let s1 = String.raw`Closed form $K/(1+(K/x_0-1)e^{-rt})$ vs RK4: max difference $${v.sci(Math.max(err, 1e-16), 1)}$. Fastest growth $\max\dot x = rK/4 = ${v.fix((R * Kv) / 4, 4)}$ at $x = K/2 = ${v.fix(Kv / 2, 3)}$.`;
          if (isFinite(tPred)) s1 += String.raw` Inflection time: predicted $t^* = \tfrac1r\ln(K/x_0-1) = ${v.fix(tPred, 3)}$, measured (largest speed along the solution) $${isFinite(tInf) ? v.fix(tInf, 3) : '—'}$.`;
          else s1 += x0 > Kv ? ' Starting above $K$, the population decays monotonically to $K$: no inflection.' : ' Starting above $K/2$ the curve is concave from the start: no inflection.';
          return s1;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Phase line, fixed points and stability',
      statement: String.raw`For an autonomous scalar equation $\dot x = f(x)$ with $f$ continuously differentiable, the *phase line* is the $x$-axis with the direction of motion marked: to the right where $f>0$, to the left where $f<0$. A *fixed point* (equilibrium) is a zero $x^*$ of $f$; it corresponds to the constant solution $x\equiv x^*$. A fixed point is *stable* (attracting) if nearby solutions converge to it, *unstable* if nearby solutions move away, and *half-stable* if it attracts from one side and repels on the other. Every solution is monotone and either tends to a fixed point or leaves every bounded set; so the phase line, together with the signs of $f$, determines the qualitative behaviour of all solutions.`,
      idea: String.raw`Between two consecutive zeros $f$ has constant sign (intermediate value theorem), so a solution starting there moves monotonically in that direction. It cannot reach or cross the zero in finite time, because the constant solution sits there and solutions of a $C^1$ equation are unique (chapter 2); a bounded monotone solution converges, and its limit must be a zero of $f$ (otherwise it would keep moving at speed close to $f(\text{limit})\ne0$). Stability is then read from the sign pattern of $f$ around $x^*$: $+$ on the left and $-$ on the right means attracting.`,
      caption: String.raw`Shape $f$ by dragging the blue handles (or switch to *drag the zeros* and move the fixed points themselves; push two zeros together to make a half-stable point). Left: the graph of $f$ with the phase line on the axis — filled green dots are stable, hollow red unstable, half-filled orange half-stable. Right: solutions $x(t)$ from many starting values, with the same phase line drawn vertically: each solution slides monotonically toward the nearest stable point in the direction of the arrow.`,
      deps: ['ode-1.1'],
      refs: ['Strogatz §2.2'],
      see: ['mathbio-1.5'],
      tags: ['phase line', 'stability', 'fixed points'],
      viz(v) {
        const mode = v.select('', [{ value: 'shape', label: 'shape $f$ with handles' }, { value: 'zeros', label: 'drag the zeros' }], 'shape');
        const flip = v.toggle('flip $f \\to -f$', false, { onChange: () => { for (const h of knots) h.y = -h.y; } });
        const sf = v.stage({ x: [-3.25, 3.25], y: [-2.5, 2.5], height: 330, weight: 1.15, minWidth: 300, xlabel: 'x', ylabel: 'ẋ = f(x)', title: '$\\dot x = f(x)$ and its phase line' });
        const sx = v.stage({ x: [-0.7, 6], y: [-3, 3], height: 330, weight: 1, minWidth: 260, xlabel: 't', ylabel: 'x', title: 'solutions $x(t)$' });
        const KX = [-3, -2, -1, 0, 1, 2, 3], KY = [1.6, -0.3, -1.2, 0.4, 1.3, 0.2, -1.6];
        const knots = KX.map((x, i) => sf.handle(x, KY[i], { color: 'accent', r: 6, constrain: (xx, yy) => [x, v.M.clamp(yy, -2.4, 2.4)] }));
        const roots = [-1.8, 0.3, 1.9].map((r) => sf.handle(r, 0, { color: 'purple', r: 6.5, constrain: (xx) => [v.M.clamp(xx, -2.85, 2.85), 0] }));
        roots.forEach((hd) => { hd.onDrag = (me) => { for (const o of roots) if (o !== me && Math.abs(o.x - me.x) < 0.12) me.x = o.x; }; });
        let info = null;
        v.legend([['green', 'stable', { dot: true }], ['red', 'unstable', { dot: true }], ['orange', 'half-stable', { dot: true }], ['accent', 'solutions']]);
        v.render(() => {
          const sg = flip.value ? -1 : 1, shape = mode.value === 'shape';
          knots.forEach((h) => { h.visible = shape; }); roots.forEach((h) => { h.visible = !shape; });
          let f, zs;
          if (shape) {
            const sp = spline(KX, knots.map((h) => h.y)); // the toggle negates the handles themselves
            f = sp;
            zs = zerosOf(f, -3, 3, 600);
          } else {
            const rs = roots.map((h) => h.x);
            f = (x) => -sg * 0.3 * (x - rs[0]) * (x - rs[1]) * (x - rs[2]);
            zs = [...new Set(rs.map((q) => +q.toFixed(9)))].sort((p, q) => p - q);
          }
          const cls = zs.map((z) => ({ z, ...classify(f, z, 1e-3) }));
          // left: graph, shading by sign
          sf.fn(f, { color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.08 });
          phaseArrows(sf, f, zs, -3, 3, 0, { len: 30 });
          for (const c of cls) fpGlyph(v, sf, c.z, 0, c.type, c.dir > 0 ? Math.PI : 0, shape ? 6.5 : 10);
          // right: solutions from a fan of initial values
          const F = (t, x) => f(x);
          for (const x0 of v.M.linspace(-2.9, 2.9, 19)) {
            if (zs.some((z) => Math.abs(z - x0) < 1e-9)) continue;
            sx.clip(() => sx.path(trace(F, 0, x0, 6, { h: 0.02, cap: 1e3 }), { color: 'accent', width: 1.5, alpha: 0.8 }));
          }
          for (const c of cls) {
            sx.line(0, c.z, 6, c.z, { color: c.type === 'stable' ? 'green' : c.type === 'unstable' ? 'red' : 'orange', width: 1.8, dash: c.type === 'stable' ? null : [6, 4] });
          }
          sx.vline(-0.35, { color: 'ink', width: 1.2 });
          phaseArrows(sx, f, zs, -3, 3, -0.35, { vertical: true, len: 28 });
          for (const c of cls) fpGlyph(v, sx, -0.35, c.z, c.type, c.dir > 0 ? Math.PI / 2 : -Math.PI / 2, 6.5);
          info = { cls, f };
        });
        v.readout(() => {
          if (!info) return '';
          const { cls, f } = info;
          if (!cls.length) return String.raw`$f$ has no zeros in view: every solution moves the same way forever (or until it leaves the window). Drag $f$ across the axis to create fixed points.`;
          const name = { stable: 'stable', unstable: 'unstable', half: 'half-stable' };
          const list = cls.map((c) => String.raw`$x^* = ${v.fix(c.z, 2)}$ (${name[c.type]}, $f'(x^*) = ${v.fix(v.M.deriv(f, c.z, 1e-4), 2)}$)`).join(' · ');
          return `${cls.length} fixed point${cls.length > 1 ? 's' : ''}: ${list}. Each sign change of $f$ from $+$ to $-$ is attracting, from $-$ to $+$ repelling; between fixed points solutions are monotone.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Theorem',
      name: 'Linear stability analysis in one dimension',
      statement: String.raw`Let $f$ be $C^1$ near a fixed point $x^*$ of $\dot x = f(x)$, and put $\lambda = f'(x^*)$.
(a) If $\lambda<0$, $x^*$ is asymptotically stable: there is $\delta>0$ such that every solution with $|x(0)-x^*|<\delta$ converges to $x^*$, and for each $\eps>0$ eventually $|x(t)-x^*|\le Ce^{(\lambda+\eps)t}$.
(b) If $\lambda>0$, $x^*$ is unstable: small perturbations grow like $e^{\lambda t}$ until they leave a neighbourhood of $x^*$.
(c) If $\lambda = 0$, the linearization decides nothing: $\dot x = -x^3$, $\dot x = x^3$ and $\dot x = x^2$ all have $f'(0) = 0$ but $0$ is stable, unstable and half-stable respectively.

In all cases $\frac{d}{dt}\ln|x(t)-x^*|\to\lambda$ as the perturbation tends to $0$: $1/|\lambda|$ is the characteristic time scale near $x^*$.`,
      idea: String.raw`Write $x = x^* + \eta$. Taylor's theorem (pma-5.15) gives $\dot\eta = f(x^*+\eta) = \lambda\eta + o(\eta)$, so as long as $\eta$ is small the perturbation obeys the linear equation $\dot\eta = \lambda\eta$ up to a relative error that tends to $0$: $\frac{d}{dt}\ln|\eta| = f(x^*+\eta)/\eta\to\lambda$. If $\lambda\ne0$ this error cannot change the sign of $\dot\eta/\eta$ near $x^*$, so the sign of $\lambda$ decides stability as on the phase line (1.7). When $\lambda = 0$ the neglected term is the whole story, and the higher-order terms decide.`,
      caption: String.raw`Pick $f$ and drag the handle to one of its fixed points; set the size $\delta_0$ of the perturbation. Left: $f$ with its tangent line of slope $\lambda = f'(x^*)$ (turn on *zoom* to see that near $x^*$ the graph is indistinguishable from the tangent). Right, on a log scale: $|x(t)-x^*|$ for perturbations $\pm\delta_0$, against the linear prediction $\delta_0e^{\lambda t}$ (dashed). Shrink $\delta_0$ and the measured rate converges to $\lambda$; for $\pm x^3$ the dashed line is flat and tells you nothing.`,
      deps: ['ode-1.7', 'pma-5.15'],
      refs: ['Strogatz §2.4'],
      see: ['mathbio-1.5', 'ode-6.3'],
      tags: ['linearization', 'stability'],
      viz(v) {
        const FS = {
          logi: { label: '$x(1-x)$', f: (x) => x * (1 - x), df: (x) => 1 - 2 * x, zs: [0, 1], xr: [-0.7, 1.7], z0: 1 },
          sin: { label: '$\\sin x$', f: Math.sin, df: Math.cos, zs: [-Math.PI, 0, Math.PI], xr: [-4.3, 4.3], z0: Math.PI },
          cs: { label: '$-x^3$', f: (x) => -(x ** 3), df: (x) => -3 * x * x, zs: [0], xr: [-1.4, 1.4], z0: 0 },
          cu: { label: '$x^3$', f: (x) => x ** 3, df: (x) => 3 * x * x, zs: [0], xr: [-1.4, 1.4], z0: 0 },
          sq: { label: '$x^2$', f: (x) => x * x, df: (x) => 2 * x, zs: [0], xr: [-1.4, 1.4], z0: 0 },
        };
        const which = v.select('$f(x) =$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'logi', { onChange: (k) => { P.set(FS[k].z0, 0); } });
        const d0 = v.slider('$\\delta_0$', 0.001, 0.5, 0.25, { log: true });
        const zoom = v.toggle('zoom onto $x^*$', false);
        const sf = v.stage({ x: [-0.7, 1.7], y: [-1, 1], height: 320, weight: 1, minWidth: 270, xlabel: 'x', title: '$f$ and its tangent at $x^*$' });
        const sl = v.stage({ x: [0, 8], y: [1e-5, 4], ylog: true, height: 320, weight: 1.2, minWidth: 300, axes: 'box', xlabel: 't', title: 'perturbation $|x(t)-x^*|$ (log scale)' });
        const P = sf.handle(1, 0, { color: 'accent', label: '$x^*$', labelPos: 's', constrain: (x) => { const zs = FS[which.value].zs; let b = zs[0]; for (const z of zs) if (Math.abs(z - x) < Math.abs(b - x)) b = z; return [b, 0]; } });
        let info = null;
        v.legend([['accent', '$x(0) = x^*+\\delta_0$'], ['purple', '$x(0) = x^*-\\delta_0$'], ['ink', 'linear prediction $\\delta_0e^{\\lambda t}$', { dash: true }], ['orange', 'tangent line']]);
        v.render(() => {
          const E = FS[which.value], z = P.x, lam = E.df(z), D = d0.value;
          // left panel
          let xr = E.xr;
          if (zoom.value) xr = [z - 3 * D, z + 3 * D];
          let ymax = 0; for (const x of v.M.linspace(xr[0], xr[1], 200)) ymax = Math.max(ymax, Math.abs(E.f(x)));
          ymax = Math.max(ymax, zoom.value ? 1e-9 : 0.2) * 1.25;
          sf.setView(xr, [-ymax, ymax]);
          sf.vband(z - D, z + D, { color: 'gold', alpha: 0.12 });
          sf.fn((x) => lam * (x - z), { color: 'orange', width: 1.8, dash: [6, 4] });
          sf.fn(E.f, { color: 'accent', width: 2.6 });
          for (const q of E.zs) if (q > xr[0] && q < xr[1]) { const c = classify(E.f, q, 1e-4); fpGlyph(v, sf, q, 0, c.type, c.dir > 0 ? Math.PI : 0); }
          // right panel: |δ(t)| for ± perturbations
          const F = (t, x) => E.f(x), TM = 8, out = [];
          for (const [sgn, col] of [[1, 'accent'], [-1, 'purple']]) {
            const q = trace(F, 0, z + sgn * D, TM, { h: 0.005, cap: 1e3 });
            const pts = q.map(([t, x]) => [t, Math.abs(x - z)]);
            sl.path(pts, { color: col, width: sgn > 0 ? 2.6 : 2 });
            out.push({ sgn, q, rate: Math.log(Math.abs(at(q, 1) - z) / D) });
          }
          sl.fn((t) => D * Math.exp(lam * t), { color: 'ink', width: 1.3, dash: [6, 4] });
          sl.hline(D, { color: 'gold', width: 1, alpha: 0.5 });
          sl.text('δ₀', 8, D, { color: 'gold', align: 'right', dx: -4, dy: -9, size: 12 });
          info = { E, z, lam, D, out, key: which.value };
        });
        v.readout(() => {
          if (!info) return '';
          const { z, lam, D, out, key } = info;
          const rates = out.map((o) => (isFinite(o.rate) ? v.fix(o.rate, 4) : '∞')).join(', ');
          let s1 = String.raw`$x^* = ${v.fix(z, 3)}$, $\lambda = f'(x^*) = ${v.fix(lam, 3)}$. Measured rate $\ln\big(|\delta(1)|/\delta_0\big)$ for $\pm\delta_0$: ${rates}`;
          if (Math.abs(lam) > 1e-9) {
            s1 += ` → $${v.fix(lam, 3)}$ as $\\delta_0\\to0$. ` + (lam < 0 ? 'Perturbations decay: $x^*$ is stable.' : 'Perturbations grow until the nonlinearity saturates them: $x^*$ is unstable.');
          } else if (key === 'cs') s1 += String.raw`. The test is silent ($\lambda = 0$), yet $x^*$ is stable: exactly $\delta(t) = \delta_0/\sqrt{1+2\delta_0^2t}$, a slow algebraic decay ($${v.fix(D / Math.sqrt(1 + 2 * D * D * 8), 4)}$ at $t = 8$).`;
          else if (key === 'cu') s1 += String.raw`. The test is silent ($\lambda = 0$), yet $x^*$ is unstable: $\delta(t) = \delta_0/\sqrt{1-2\delta_0^2t}$ even blows up at $t = 1/(2\delta_0^2) = ${v.fix(1 / (2 * D * D), 2)}$.`;
          else s1 += String.raw`. The test is silent ($\lambda = 0$): $x^* = 0$ is half-stable, attracting from the left ($\delta(t) = \delta_0/(1+\delta_0t)$) and repelling on the right (blow-up at $t = 1/\delta_0$).`;
          return s1;
        });
      },
    },
  ],
};
