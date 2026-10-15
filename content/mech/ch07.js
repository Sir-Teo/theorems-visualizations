// Classical Mechanics — Chapter 7: Symmetries and conservation laws

// ── shared helpers ────────────────────────────────────────────────────────────
const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** One-slot cache: recompute only when the key changes. */
function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }

/** Classical RK4 step for an array state. */
function rk4step(f, t, y, h) {
  const k1 = f(t, y), y2 = y.map((c, i) => c + (h / 2) * k1[i]), k2 = f(t + h / 2, y2);
  const y3 = y.map((c, i) => c + (h / 2) * k2[i]), k3 = f(t + h / 2, y3), y4 = y.map((c, i) => c + h * k3[i]), k4 = f(t + h, y4);
  return y.map((c, i) => c + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
/** RK4 from t = 0 to T in n steps, recording every `every` steps → {t: [], y: [], dt}. */
function rk4rec(f, y0, T, n, every = 1) {
  const h = T / n; let y = y0.slice(); const out = { t: [0], y: [y], dt: h * every };
  for (let k = 1; k <= n; k++) { y = rk4step(f, (k - 1) * h, y, h); if (k % every === 0) { out.t.push(k * h); out.y.push(y); } }
  return out;
}
/** Range [lo, hi] of several arrays, padded, with a minimum span. */
function span(arrs, pad = 0.1, minSpan = 1) {
  let lo = Infinity, hi = -Infinity;
  for (const a of arrs) for (const y of a) { if (!isFinite(y)) continue; if (y < lo) lo = y; if (y > hi) hi = y; }
  if (!isFinite(lo)) { lo = -1; hi = 1; }
  if (hi - lo < minSpan) { const c = (hi + lo) / 2; lo = c - minSpan / 2; hi = c + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
/** Polyline of (ts[k], ys[k]) for k ≤ upto. */
function series(s, ts, ys, upto, st) {
  const pts = []; for (let k = 0; k <= Math.min(upto, ts.length - 1); k++) pts.push([ts[k], ys[k]]);
  if (pts.length > 1) s.path(pts, st);
}
const maxDev = (a, upto = a.length - 1, ref = a[0]) => { let d = 0; for (let k = 0; k <= upto; k++) d = Math.max(d, Math.abs(a[k] - ref)); return d; };
/** TeX for a tiny number (use inside $…$). */
const sci = (v, x) => (Math.abs(x) < 1e-300 ? '0' : v.sci(x, 2));
/** Fixed decimals, or TeX scientific notation when that would print as zero (use inside $…$). */
const num = (v, x, d = 4) => (Math.abs(x) < 1e-30 ? '0' : Math.abs(x) >= 0.5 * 10 ** -d ? v.fix(x, d) : v.sci(x, 2));
/** Zigzag spring from p to q. */
function spring(s, p, q, st = {}) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, n = st.coils ?? 12, amp = st.amp ?? 0.08, pts = [p];
  const a0 = 0.12, a1 = 0.88;
  pts.push([p[0] + a0 * dx, p[1] + a0 * dy]);
  for (let j = 1; j < 2 * n; j++) { const a = a0 + ((a1 - a0) * j) / (2 * n), sg = j % 2 ? 1 : -1; pts.push([p[0] + a * dx + sg * amp * nx, p[1] + a * dy + sg * amp * ny]); }
  pts.push([p[0] + a1 * dx, p[1] + a1 * dy], q);
  s.path(pts, { color: st.color || 'muted', width: st.width ?? 1.5 });
}
/** Contour segments of U on a grid (marching squares), as a path with null breaks. */
function contourSegs(U, xr, yr, nx, ny, levels) {
  const dx = (xr[1] - xr[0]) / nx, dy = (yr[1] - yr[0]) / ny, G = [];
  for (let j = 0; j <= ny; j++) { const row = []; for (let i = 0; i <= nx; i++) row.push(U(xr[0] + i * dx, yr[0] + j * dy)); G.push(row); }
  const out = [];
  for (const c of levels) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = G[j][i], b = G[j][i + 1], e = G[j + 1][i + 1], d = G[j + 1][i];
    if (!isFinite(a + b + e + d)) continue;
    const X = xr[0] + i * dx, Y = yr[0] + j * dy, pts = [];
    const edge = (va, vb, xa, ya, xb, yb) => { if ((va < c) !== (vb < c)) { const t = (c - va) / (vb - va); pts.push([xa + t * (xb - xa), ya + t * (yb - ya)]); } };
    edge(a, b, X, Y, X + dx, Y); edge(b, e, X + dx, Y, X + dx, Y + dy); edge(e, d, X + dx, Y + dy, X, Y + dy); edge(d, a, X, Y + dy, X, Y);
    if (pts.length === 2) out.push(pts[0], pts[1], null);
    else if (pts.length === 4) out.push(pts[0], pts[1], null, pts[2], pts[3], null);
  }
  return out;
}
/** Potential landscape: tint (deeper = stronger) plus contour lines; `segs` from contourSegs (cache them). */
function landscape(v, s, U, o) {
  const C = v.rgb(o.color || 'accent'), lo = o.lo, hi = o.hi;
  s.raster((x, y) => {
    const u = U(x, y); if (!isFinite(u)) return [C[0], C[1], C[2], 0];
    const t = clamp(o.invert ? (u - lo) / (hi - lo) : (hi - u) / (hi - lo), 0, 1); return [C[0], C[1], C[2], (o.alpha ?? 95) * t];
  }, { res: 3, key: o.key + '|' + C.join(), id: o.id || 'pot' });
  if (o.segs) s.path(o.segs, { color: 'muted', width: 0.8, alpha: 0.45 });
}
/** Planar particle (m = 1) in a potential with gradient G: RK4 record. */
function planar(G, q0, v0, T, n, every = 1) {
  return rk4rec((t, S) => { const a = G(S[0], S[1]); return [S[2], S[3], -a[0], -a[1]]; }, [q0[0], q0[1], v0[0], v0[1]], T, n, every);
}

export default {
  collection: 'mech',
  chapter: 7,
  title: 'Symmetries and conservation laws',
  summary: String.raw`When a coordinate is absent from the Lagrangian its conjugate momentum is conserved, and Noether’s theorem turns every continuous symmetry of a Lagrangian into a conserved quantity — while a broken symmetry makes that quantity drift at exactly the rate of the generalized force along the symmetry. Homogeneity of space gives momentum, isotropy gives angular momentum, homogeneity of time gives the energy function, and Galilean boosts make the centre of mass coast: ten conserved quantities for every isolated system, with hidden extras such as the Runge–Lenz vector of the Kepler problem. Eliminating a cyclic coordinate leaves a one-dimensional effective potential, the tool used next for central forces and tops.`,
  items: [
    // ───────────────────────────────────────────────────────────── 7.1
    {
      num: '7.1',
      kind: 'Definition',
      name: 'Cyclic coordinates',
      statement: String.raw`A generalized coordinate $q_j$ is **cyclic** (or *ignorable*) for a Lagrangian $L(q,\dot q,t)$ if $L$ does not depend on it, $\partial L/\partial q_j = 0$, although it may depend on the velocity $\dot q_j$. Lagrange’s equation for $q_j$ then says
$$\frac{d}{dt}\,p_j = \frac{\partial L}{\partial q_j} = 0,\qquad p_j = \frac{\partial L}{\partial\dot q_j},$$
so the conjugate (generalized) momentum $p_j$ is a constant of the motion. In general $p_j$ is not $m\dot q_j$: it can mix several velocities and depend on the other coordinates. When $q_j$ does appear in $L$, $p_j$ changes at the rate of the generalized force $\partial L/\partial q_j$. Whether a coordinate is cyclic depends on the choice of coordinates.`,
      idea: String.raw`Lagrange’s equation for $q_j$ (6.6) is literally a statement about the time derivative of the generalized momentum (6.8): $\dot p_j = \partial L/\partial q_j$. If $L$ does not contain $q_j$, shifting $q_j$ by a constant changes nothing, and the right-hand side vanishes — the simplest continuous symmetry, which Noether’s theorem (7.3) generalizes. For a pendulum hanging from a cart on a frictionless rail, the cart position $x$ is cyclic, and the conserved $p_x = (M+m)\dot x + ml\dot\theta\cos\theta$ is the horizontal momentum of cart *and* bob, although the cart’s own velocity keeps changing.`,
      caption: String.raw`A pendulum hangs from a cart on a frictionless rail. Press play: the cart lurches to and fro ($(M+m)\dot x$, orange) but the generalized momentum $p_x = \partial L/\partial\dot x$ (blue) is flat, because $x$ does not appear in $L$ — and the centre of mass (green dots, every 0.5 s) advances in equal steps. Hook the cart to the wall with the spring $k$: $-\tfrac12kx^2$ puts $x$ into $L$, and $p_x$ now follows the running integral of $\partial L/\partial x = -kx$ (dashed).`,
      deps: ['mech-6.8', 'mech-6.6'],
      see: ['mech-6.10'],
      refs: ['Taylor §7.6', 'Goldstein §2.6'],
      tags: ['cyclic coordinates', 'generalized momentum', 'Lagrangian'],
      viz(v) {
        const Mc = 1, l = 1, g = 9.81, T = 8, DT = 0.001, EV = 10;
        const kS = v.slider('wall spring $k$ (N/m)', 0, 12, 0, { step: 0.25 });
        const mS = v.slider('bob mass $m$ (kg)', 0.2, 3, 1, { step: 0.05 });
        const thS = v.slider('release angle $\\theta_0$ (°)', 5, 100, 65, { step: 1 });
        const uS = v.slider('cart push $\\dot x_0$ (m/s)', -0.4, 0.4, 0.25, { step: 0.01 });
        const s = v.stage({ x: [-3.6, 3.6], y: [-1.12, 0.62], equal: true, axes: false, height: 230, full: true, title: 'cart $M = 1$ kg on a frictionless rail, pendulum $l = 1$ m' });
        const gp = v.stage({ x: [0, T], y: [-1, 1], axes: 'box', height: 220, full: true, xlabel: 't (s)', title: 'horizontal momenta (kg·m/s)' });
        const cache = memo(); let cur = null;
        const run = () => cache([kS.value, mS.value, thS.value, uS.value].join('|'), () => {
          const k = kS.value, m = mS.value, th0 = (thS.value * Math.PI) / 180, u = uS.value;
          // Lagrange's equations of L = ½(M+m)ẋ² + mlẋθ̇cosθ + ½ml²θ̇² + mgl cosθ − ½kx², plus ∫∂L/∂x dt
          const f = (t, S) => {
            const [x, th, xd, thd] = S, c = Math.cos(th), sn = Math.sin(th);
            const a11 = Mc + m, a12 = m * l * c, b1 = -k * x + m * l * thd * thd * sn, a21 = c, a22 = l, b2 = -g * sn, det = a11 * a22 - a12 * a21;
            return [xd, thd, (b1 * a22 - a12 * b2) / det, (a11 * b2 - a21 * b1) / det, -k * x];
          };
          const R = rk4rec(f, [(-u * T) / 2, th0, u, 0, 0], T, Math.round(T / DT), EV);
          const px = R.y.map((S) => (Mc + m) * S[2] + m * l * S[3] * Math.cos(S[1]));
          const pc = R.y.map((S) => (Mc + m) * S[2]);
          const pred = R.y.map((S) => px[0] + S[4]);
          const cm = R.y.map((S) => S[0] + (m * l * Math.sin(S[1])) / (Mc + m));
          return { ...R, px, pc, pred, cm, m, k, yr: span([px, pc, pred], 0.15, 0.6) };
        });
        v.animate((t) => {
          const R = run(), n = R.t.length - 1, i = Math.min(n, Math.round(Math.min(t, T) / R.dt));
          const [x, th, xd] = R.y[i], m = R.m, k = R.k, py = 0.18;
          // rail with sleepers, wall and spring
          s.line(-3.6, 0, 3.6, 0, { color: 'muted', width: 2 });
          for (let xx = -3.5; xx <= 3.51; xx += 0.5) s.line(xx, 0, xx - 0.07, -0.06, { color: 'faint', width: 1 });
          const wx = -3.45;
          s.line(wx, -0.03, wx, 0.5, { color: k > 0 ? 'ink' : 'faint', width: 3 });
          if (k > 0) spring(s, [wx, 0.2], [x - 0.3, 0.2], { coils: 13, amp: 0.055, color: 'purple', width: 1.6 });
          // centre of mass track
          s.line(-3.6, -1.02, 3.6, -1.02, { color: 'faint', width: 1 });
          const stepK = Math.round(0.5 / R.dt);
          for (let j = 0; j <= i; j += stepK) s.dot(R.cm[j], -1.02, { r: 2.8, color: 'green', alpha: 0.65, ring: false });
          s.dot(R.cm[i], -1.02, { r: 5, color: 'green' });
          s.text('centre of mass every 0.5 s', 3.5, -1.02, { size: 11, color: 'green', align: 'right', dy: -10 });
          // cart, pendulum
          s.rect(x - 0.3, 0.035, x + 0.3, 0.33, { fill: 'accent', fillAlpha: 0.28, color: 'accent', width: 1.6 });
          for (const wxo of [-0.18, 0.18]) s.circle(x + wxo, 0.035, 0.032, { fill: 'muted', fillAlpha: 0.9, color: 'muted', width: 1 });
          const bx = x + l * Math.sin(th), by = py - l * Math.cos(th);
          s.line(x, py, bx, by, { color: 'ink', width: 2 });
          s.circle(bx, by, 0.055 + 0.03 * Math.cbrt(m), { fill: 'orange', fillAlpha: 0.65, color: 'orange', width: 1.5 });
          s.dot(x, py, { r: 3, color: 'ink' });
          if (Math.abs(xd) > 0.02) { s.arrow(x, 0.47, x + 0.45 * xd, 0.47, { color: 'orange', width: 2.2, head: 8 }); s.tex('\\dot x', x + 0.45 * xd, 0.47, { color: 'orange', align: xd > 0 ? 'left' : 'right', dx: xd > 0 ? 5 : -5, size: 13 }); }
          s.corner(k > 0 ? `L contains x through −½kx²` : 'x is absent from L: cyclic', 'tl', { color: k > 0 ? 'red' : 'green', weight: 600 });
          // momenta
          gp.setView([0, T], R.yr);
          gp.hline(R.px[0], { color: 'faint', dash: [3, 4] });
          series(gp, R.t, R.pc, i, { color: 'orange', width: 2 });
          series(gp, R.t, R.px, i, { color: 'blue', width: 3.2 });
          series(gp, R.t, R.pred, i, { color: 'purple', width: 1.8, dash: [7, 5] });
          gp.dot(R.t[i], R.px[i], { r: 4.5, color: 'blue' });
          cur = { R, i };
        }, { period: T + 1.5, still: 6 });
        v.legend([['blue', '$p_x = \\partial L/\\partial\\dot x$'], ['purple', '$p_x(0)+\\int_0^t \\partial L/\\partial x\\,dt$', { dash: true }], ['orange', '$(M+m)\\dot x$'], ['green', 'centre of mass', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { R, i } = cur, dev = maxDev(R.px, i);
          let lo = Infinity, hi = -Infinity; for (let j = 0; j <= i; j++) { lo = Math.min(lo, R.pc[j]); hi = Math.max(hi, R.pc[j]); }
          if (R.k === 0) return String.raw`$x$ does not appear in $L$, so $\dot p_x = \partial L/\partial x = 0$: $p_x = (M+m)\dot x + ml\dot\theta\cos\theta = ${v.fix(R.px[i], 4)}$ kg·m/s at $t = ${v.fix(R.t[i], 2)}$ s (largest change so far $${sci(v, dev)}$), while $(M+m)\dot x$ has ranged over $[${v.fix(lo, 3)},\ ${v.fix(hi, 3)}]$`;
          return String.raw`the spring puts $-\tfrac12kx^2$ into $L$: $x$ is no longer cyclic and $\dot p_x = \partial L/\partial x = -kx$ · at $t = ${v.fix(R.t[i], 2)}$ s, $p_x(t)-p_x(0) = ${v.fix(R.px[i] - R.px[0], 5)}$ and $\int_0^t(-kx)\,dt = ${v.fix(R.y[i][4], 5)}$ kg·m/s`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.2
    {
      num: '7.2',
      kind: 'Definition',
      name: 'Continuous symmetries of a Lagrangian',
      statement: String.raw`A **continuous symmetry** of a Lagrangian $L(q,\dot q,t)$ is a family of transformations $q\mapsto Q(s,q)$, depending smoothly on a parameter $s$ with $Q(0,q) = q$, that leaves $L$ unchanged up to a total time derivative:
$$L\big(Q(s,q),\,\tfrac{d}{dt}Q(s,q),\,t\big) = L(q,\dot q,t) + \frac{d}{dt}F_s(q,t)$$
(it is enough that this holds to first order in $s$). The **generator** is the vector field $K(q) = \partial Q/\partial s\,|_{s=0}$. Translations $\mathbf r\mapsto\mathbf r + s\,\mathbf e$ and rotations are the basic examples. Because the action changes only by boundary terms (6.16), a symmetry maps solutions of Lagrange’s equations to solutions. The converse fails: a rescaling $\mathbf r\mapsto\lambda\mathbf r$, $t\mapsto\lambda^{1-k/2}t$ maps solutions to solutions for every potential homogeneous of degree $k$ (mechanical similarity) but multiplies the action by $\lambda^{1+k/2}$, so it is a symmetry of the action only when $k = -2$.`,
      idea: String.raw`If $L$ is unchanged (up to $dF/dt$) the action of the moved path differs from the action of the original by endpoint terms only, so stationary paths go to stationary paths by Hamilton’s principle (6.5, 6.16). Kinetic energy $\tfrac12m|\dot{\mathbf r}|^2$ is invariant under all rigid motions, so a translation or rotation is a symmetry exactly when the potential is invariant. Testing is concrete: move a trajectory and re-integrate the equations from the moved starting point — if the two curves coincide, the transformation respected the dynamics.`,
      caption: String.raw`The blue curve is a solution. The slider moves it by a translation, a rotation or a rescaling (wide orange band); the green curve is a fresh solution integrated from the moved starting point and velocity. Drag the start point and the velocity tip. In the round $-1/r$ field rotations keep green inside the band (gap at round-off level, right); translations do not. In the valley it is the other way round; in the lumpy field nothing works. Rescaling always works for the two homogeneous potentials, yet the readout shows the action is not invariant.`,
      deps: ['mech-6.6', 'mech-6.16'],
      see: ['mech-3.16'],
      refs: ['Tong §2.4', 'Arnold §20'],
      tags: ['symmetry', 'Lagrangian', 'transformations'],
      viz(v) {
        const W = [[-1, 0.4, 1.0, 0.8], [1.1, -0.3, 1.3, 0.9], [0.2, 1.4, 0.6, 0.6]];
        const lumpyU = (x, y) => 0.08 * (x * x + y * y) - W.reduce((a, [cx, cy, A, w]) => a + A * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (w * w)), 0);
        const lumpyG = (x, y) => W.reduce((g, [cx, cy, A, w]) => { const e = (2 * A * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (w * w))) / (w * w); return [g[0] + e * (x - cx), g[1] + e * (y - cy)]; }, [0.16 * x, 0.16 * y]);
        const POT = {
          kepler: { label: 'round: $U = -1/r$', U: (x, y) => -1 / Math.hypot(x, y), G: (x, y) => { const r = Math.max(Math.hypot(x, y), 0.03), r3 = r * r * r; return [x / r3, y / r3]; }, k: -1, ic: [1.75, 0, 0, 0.62], lo: -2.2, hi: -0.3, T: 9 },
          valley: { label: 'valley: $U = \\tfrac12 y^2$', U: (x, y) => 0.5 * y * y, G: (x, y) => [0, y], k: 2, ic: [-2.6, 0.9, 0.7, 0], lo: 0, hi: 3, T: 7 },
          lumpy: { label: 'lumpy', U: lumpyU, G: lumpyG, k: null, ic: [-1.7, 1.25, 0.55, -0.3], lo: -1.3, hi: 0.7, T: 7 },
        };
        let start = null, tip = null;
        const pot = v.select('potential', Object.entries(POT).map(([value, p]) => ({ value, label: p.label })), 'kepler', {
          onChange: (p) => { const c = POT[p].ic; start.set(c[0], c[1]); tip.set(c[0] + c[2], c[1] + c[3]); },
        });
        const tr = v.select('move it by', [{ value: 'translate', label: 'translation' }, { value: 'rotate', label: 'rotation' }, { value: 'scale', label: 'rescaling' }], 'rotate', { onChange: () => amt.set(amt.value) });
        const amt = v.slider('amount', -1, 1, 0.45, { step: 0.01, fmt: (x) => (tr.value === 'translate' ? `a = ${v.fix(2.2 * x, 2)}` : tr.value === 'rotate' ? `φ = ${Math.round(180 * x)}°` : `λ = ${v.fix(Math.pow(2, x), 2)}`) });
        const s = v.stage({ x: [-3.2, 3.2], y: [-2.4, 2.4], equal: true, axes: false, height: 340, weight: 1.35 });
        const gs = v.stage({ x: [0, 1], y: [1e-18, 100], ylog: true, axes: 'box', height: 340, xlabel: 'time / duration of the run', title: 'gap: moved curve vs. true solution' });
        start = s.handle(1.75, 0, { color: 'accent', label: 'start', labelPos: 'se' });
        tip = s.handle(1.75, 0.62, { color: 'accent', r: 6, label: 'v', labelPos: 'ne' });
        let sx = start.x, sy = start.y;
        start.onDrag = () => { tip.set(tip.x + start.x - sx, tip.y + start.y - sy); sx = start.x; sy = start.y; };
        const N = 1400;
        const segCache = {};
        const segs = (key, P) => (segCache[key] ||= contourSegs(P.U, [-3.4, 3.4], [-2.6, 2.6], 90, 70, Array.from({ length: 9 }, (_, j) => P.lo + ((j + 0.5) * (P.hi - P.lo)) / 9)));
        const xf = (kind, a, k) => {
          if (kind === 'translate') { const d = 2.2 * a; return { P: (p) => [p[0] + d, p[1]], V: (w) => w, mu: 1, d }; }
          if (kind === 'rotate') { const ph = Math.PI * a, c = Math.cos(ph), sn = Math.sin(ph), R = (p) => [c * p[0] - sn * p[1], sn * p[0] + c * p[1]]; return { P: R, V: R, mu: 1, ph }; }
          const lam = Math.pow(2, a), mu = k == null ? 1 : Math.pow(lam, 1 - k / 2);
          return { P: (p) => [lam * p[0], lam * p[1]], V: (w) => [(lam / mu) * w[0], (lam / mu) * w[1]], mu, lam };
        };
        const cache = memo(); let cur = null;
        const run = () => cache([pot.value, tr.value, amt.value, start.x, start.y, tip.x, tip.y].join('|'), () => {
          const P = POT[pot.value], X = xf(tr.value, amt.value, P.k);
          const q0 = [start.x, start.y], v0 = [tip.x - start.x, tip.y - start.y];
          sx = start.x; sy = start.y;
          const A = planar(P.G, q0, v0, P.T, N), B = planar(P.G, X.P(q0), X.V(v0), X.mu * P.T, N);
          const mp = A.y.map((S) => X.P([S[0], S[1]]));
          const gap = mp.map((p, n) => Math.hypot(p[0] - B.y[n][0], p[1] - B.y[n][1]));
          let dL = 0, S0 = 0, S1 = 0;
          const LA = A.y.map((S) => 0.5 * (S[2] ** 2 + S[3] ** 2) - P.U(S[0], S[1]));
          const LM = A.y.map((S) => { const p = X.P([S[0], S[1]]), w = X.V([S[2], S[3]]); return 0.5 * (w[0] ** 2 + w[1] ** 2) - P.U(p[0], p[1]); });
          for (let n = 0; n <= N; n++) { dL = Math.max(dL, Math.abs(LM[n] - LA[n])); const wgt = n === 0 || n === N ? 0.5 : 1; S0 += wgt * LA[n] * A.dt; S1 += wgt * LM[n] * A.dt * X.mu; }
          return { P, X, A, B, mp, gap, dL, ratio: S1 / S0, gapMax: Math.max(...gap), q0, v0 };
        });
        v.render(() => {
          amt.value = amt.value; // refresh the value label after a change of transformation
          const R = run(), P = R.P, X = R.X;
          landscape(v, s, P.U, { lo: P.lo, hi: P.hi, key: pot.value, segs: segs(pot.value, P) });
          // orbit of the start point under the family
          const q0 = R.q0, gq0 = X.P(q0);
          if (tr.value === 'rotate') { const r0 = Math.hypot(...q0), a0 = Math.atan2(q0[1], q0[0]); s.curve((u) => [r0 * Math.cos(a0 + u * X.ph), r0 * Math.sin(a0 + u * X.ph)], 0, 1, { color: 'muted', dash: [2, 4], width: 1.4 }); s.dot(0, 0, { r: 3, color: 'muted', label: 'O', labelPos: 'sw' }); }
          else s.line(q0[0], q0[1], gq0[0], gq0[1], { color: 'muted', dash: [2, 4], width: 1.4 });
          const A = R.A.y.map((S) => [S[0], S[1]]), B = R.B.y.map((S) => [S[0], S[1]]);
          s.path(A, { color: 'blue', width: 2.4 });
          s.path(R.mp, { color: 'orange', width: 9, alpha: 0.32 });
          s.path(B, { color: 'green', width: 2 });
          for (let n = 0; n <= N; n += N / 7) { s.dot(A[n][0], A[n][1], { r: 3, color: 'blue' }); s.dot(R.mp[n][0], R.mp[n][1], { r: 5, color: 'orange', alpha: 0.6, ring: false }); s.dot(B[n][0], B[n][1], { r: 2.6, color: 'green' }); }
          s.arrow(q0[0], q0[1], tip.x, tip.y, { color: 'accent', width: 2 });
          const gv = X.V(R.v0);
          s.arrow(gq0[0], gq0[1], gq0[0] + gv[0], gq0[1] + gv[1], { color: 'green', width: 2 });
          s.corner(R.gapMax < 1e-6 ? 'moved curve = a solution' : 'moved curve ≠ solution', 'tl', { color: R.gapMax < 1e-6 ? 'green' : 'red', weight: 600 });
          gs.path(R.gap.map((d, n) => [n / N, Math.max(d, 1e-17)]), { color: R.gapMax < 1e-6 ? 'green' : 'red', width: 2.2 });
          gs.hline(1e-6, { color: 'faint', dash: [4, 4] });
          cur = R;
        });
        v.legend([['blue', 'a solution $\\mathbf q(t)$'], ['orange', 'the moved curve', { area: true }], ['green', 'solution from the moved start'], ['muted', 'orbit of the start point', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const R = cur, ok = R.gapMax < 1e-6;
          let out = ok ? String.raw`largest gap $${sci(v, R.gapMax)}$: the moved curve **is** a solution` : String.raw`largest gap ${v.fix(R.gapMax, 3)}: the moved curve is **not** a solution`;
          if (tr.value !== 'scale') out += String.raw` · along the motion $\max_t |L(g\mathbf q, g\dot{\mathbf q}) - L(\mathbf q,\dot{\mathbf q})| = ${sci(v, R.dL)}$` + (R.dL < 1e-12 ? ' — $L$ is invariant: a symmetry' : ' — $L$ changes: not a symmetry');
          else if (R.P.k != null) out += String.raw` · action of the moved motion ÷ action of the original $= ${v.fix(R.ratio, 6)}$, and $\lambda^{1+k/2} = ${v.fix(Math.pow(R.X.lam, 1 + R.P.k / 2), 6)}$ ($k = ${R.P.k}$): the equations are invariant, the action is not (only $k=-2$ would leave it unchanged, see 7.3)`;
          else out += ' · this potential is not homogeneous, so no rescaling of time can rescue it';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.3
    {
      num: '7.3',
      kind: 'Theorem',
      name: 'Noether’s theorem',
      credit: 'Emmy Noether, 1918',
      statement: String.raw`Let $Q(s,q)$ be a one-parameter family of transformations with generator $K(q) = \partial Q/\partial s|_{s=0}$, under which $L(q,\dot q,t)$ changes, to first order in $s$, by a total derivative: $\delta L = \frac{d}{dt}F(q,t)$. Then along every solution of Lagrange’s equations the **Noether charge**
$$\mathcal Q = \sum_j p_j\,K_j(q) - F, \qquad p_j = \frac{\partial L}{\partial\dot q_j},$$
is constant. More generally, for any generator, $\dfrac{d\mathcal Q}{dt} = \delta L - \dot F$ along solutions: the charge drifts at exactly the rate at which the transformation fails to be a symmetry (for translations and rotations, the generalized force or torque along $K$). If the transformation also shifts time, $t\mapsto t + s\,\tau(t)$, the charge acquires the term $-h\,\tau$, with $h$ the energy function (7.6).`,
      idea: String.raw`Differentiate $\mathcal Q$ along a solution: $\frac{d}{dt}\sum p_jK_j = \sum\dot p_jK_j + \sum p_j\dot K_j = \sum\frac{\partial L}{\partial q_j}K_j + \sum\frac{\partial L}{\partial\dot q_j}\frac{d K_j}{dt}$, using Lagrange’s equations (6.6) for $\dot p_j$ (6.8). The right side is exactly the first-order change $\delta L$ of the Lagrangian under $q\mapsto q+sK$. So if $\delta L = \dot F$ the charge $\sum p_jK_j - F$ is constant, and if not, its drift *is* $\delta L$ — which the picture integrates and plots beside the charge. Cyclic coordinates (7.1) are the special case $K = \partial/\partial q_j$.`,
      caption: String.raw`Pick a symmetry. The particle moves in the shaded potential; faint arrows show the generator $K$, the green arrow $K$ at the particle and the purple arrow the force. Slide $\varepsilon$ to $0$: the potential becomes invariant and the charge (right, blue) stays on its starting value (dotted). With $\varepsilon > 0$ the symmetry is broken and the charge drifts — exactly along the dashed curve, the running integral of $\delta L$. In the Kepler mode the charge is the Runge–Lenz vector: fixed for $1/r$, and turning steadily under an extra $1/r^3$ force, while $L_z$ stays exact.`,
      deps: ['mech-7.2', 'mech-6.8', 'mech-6.6'],
      see: ['mech-8.10', 'mech-8.13', 'mech-3.16'],
      refs: ['Arnold §20', 'Tong §2.4'],
      tags: ['Noether', 'symmetry', 'conservation laws'],
      scope: String.raw`Holds for systems governed by a Lagrangian (including velocity-dependent potentials such as the magnetic one) and continuous, not discrete, symmetries. Dissipative forces outside the Lagrangian, such as friction, are not covered; with them the charges decay even when the potential is symmetric.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Noether%27s_theorem' },
      viz(v) {
        const MODES = {
          trans: {
            label: 'translation', qtex: 'p_x', rtex: String.raw`\partial L/\partial x`, title: 'Noether charge $p_x$ (translation in $x$)',
            U: (x, y, e) => 0.5 * y * y + 0.04 * e * x * x, G: (x, y, e) => [0.08 * e * x, y], gen: () => [1, 0],
            ic: [-4, 0.9, 0.5, 0], T: 16, n: 4000, every: 4, view: [[-5.6, 5.6], [-3, 3]], lo: 0, hi: 3.2, min: 0.3,
            Q: (S) => S[2], rate: (S, t, e, md) => [-md.G(S[0], S[1], e)[0], 0], brk: 'valley closed off by $\\varepsilon\\,0.04x^2$',
          },
          rot: {
            label: 'rotation', qtex: 'L_z', rtex: String.raw`\partial L/\partial\theta`, title: 'Noether charge $L_z$ (rotation about $O$)',
            U: (x, y, e) => { const r = Math.hypot(x, y); return 4 * (r - 1.6) ** 2 + 0.12 * e * (x * x * x - 3 * x * y * y); },
            G: (x, y, e) => { const r = Math.hypot(x, y) || 1e-9, c = (8 * (r - 1.6)) / r; return [c * x + 0.36 * e * (x * x - y * y), c * y - 0.72 * e * x * y]; },
            gen: (x, y) => [-y, x], ic: [1.6, 0, 0.45, 0.95], T: 30, n: 7500, every: 5, view: [[-3, 3], [-3, 3]], lo: -0.5, hi: 2.6, min: 0.3,
            Q: (S) => S[0] * S[3] - S[1] * S[2], rate: (S, t, e, md) => { const a = md.G(S[0], S[1], e); return [S[1] * a[0] - S[0] * a[1], 0]; }, brk: 'ring trough squeezed by $\\varepsilon\\,0.12\\,r^3\\cos3\\theta$',
          },
          scale: {
            label: 'scaling', qtex: String.raw`D = \mathbf r\cdot\mathbf p - 2Et`, rtex: String.raw`-(k+2)U`, title: 'Noether charge $D = \\mathbf r\\cdot\\mathbf p - 2Et$ (dilation)',
            U: (x, y, e) => 0.3 * Math.pow(Math.hypot(x, y), -2 + e),
            G: (x, y, e) => { const k = -2 + e, r = Math.max(Math.hypot(x, y), 1e-6), c = 0.3 * k * Math.pow(r, k - 2); return [c * x, c * y]; },
            gen: (x, y) => [x, y], ic: [-4.0, -2.42, 0.94, 0.34], T: 9.2, n: 4600, every: 5, view: [[-5, 5], [-3.4, 3.4]], lo: 0, hi: 0.6, min: 0.5, invert: true,
            Q: (S, t, e, md) => S[0] * S[2] + S[1] * S[3] - 2 * t * (0.5 * (S[2] ** 2 + S[3] ** 2) + md.U(S[0], S[1], e)),
            rate: (S, t, e, md) => [-e * md.U(S[0], S[1], e), 0], brk: 'repulsion $0.3\\,r^{k}$ with $k = -2+\\varepsilon$',
          },
          lrl: {
            label: 'Kepler: Runge–Lenz', qtex: String.raw`\arg\mathbf A`, rtex: String.raw`f\,\hat{\mathbf r}\times\mathbf L`, title: 'direction of the Runge–Lenz vector $\\mathbf A$ (°)',
            U: (x, y, e) => { const r = Math.hypot(x, y); return -1 / r - (0.06 * e) / (r * r); },
            G: (x, y, e) => { const r = Math.hypot(x, y), c = 1 / (r * r * r) + (0.12 * e) / (r * r * r * r); return [c * x, c * y]; },
            gen: null, ic: [1, 0, 0, 1.15], T: 60, n: 30000, every: 20, view: [[-2.6, 2.6], [-2.6, 2.6]], lo: -2.2, hi: -0.35, min: 8,
            A: (S) => { const r = Math.hypot(S[0], S[1]), L = S[0] * S[3] - S[1] * S[2]; return [S[3] * L - S[0] / r, -S[2] * L - S[1] / r]; },
            rate: (S, t, e) => { const r = Math.hypot(S[0], S[1]), L = S[0] * S[3] - S[1] * S[2], f = (-0.12 * e) / (r * r * r); return [(f * L * S[1]) / r, (-f * L * S[0]) / r]; },
            brk: 'extra attraction $\\varepsilon\\,0.12/r^3$',
          },
        };
        const mode = v.select('symmetry', Object.entries(MODES).map(([value, m]) => ({ value, label: m.label })), 'rot');
        const eS = v.slider('symmetry breaking $\\varepsilon$', 0, 1, 0.4, { step: 0.01 });
        const s = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 340, weight: 1.2 });
        const sq = v.stage({ x: [0, 10], y: [-1, 1], axes: 'box', height: 340, xlabel: 't' });
        const segCache = {};
        const cache = memo(); let cur = null;
        const run = () => cache(mode.value + '|' + eS.value, () => {
          const md = MODES[mode.value], e = eS.value;
          const f = (t, S) => { const a = md.G(S[0], S[1], e), r = md.rate(S, t, e, md); return [S[2], S[3], -a[0], -a[1], r[0], r[1]]; };
          const R = rk4rec(f, [...md.ic, 0, 0], md.T, md.n, md.every);
          let Qm, Qp, extra = {};
          if (mode.value === 'lrl') {
            const A0 = md.A(R.y[0]), unwrap = (arr) => { const o = [arr[0]]; for (let j = 1; j < arr.length; j++) { let d = arr[j] - arr[j - 1]; d -= 360 * Math.round(d / 360); o.push(o[j - 1] + d); } return o; };
            const As = R.y.map((S) => md.A(S));
            Qm = unwrap(As.map((A) => (Math.atan2(A[1], A[0]) * 180) / Math.PI));
            Qp = unwrap(R.y.map((S) => (Math.atan2(A0[1] + S[5], A0[0] + S[4]) * 180) / Math.PI));
            const Ls = R.y.map((S) => S[0] * S[3] - S[1] * S[2]), rr = R.y.map((S) => Math.hypot(S[0], S[1]));
            // perihelia: r·p crosses zero from − to +; the angle there is interpolated linearly between frames
            const rp = R.y.map((S) => S[0] * S[2] + S[1] * S[3]), ang = R.y.map((S) => (Math.atan2(S[1], S[0]) * 180) / Math.PI);
            const peri = [], pAng = [];
            if (Math.abs(rp[0]) < 1e-12) { peri.push(0); pAng.push(ang[0]); }
            for (let j = 1; j < rp.length; j++) if (rp[j - 1] < 0 && rp[j] >= 0) {
              const fr = -rp[j - 1] / (rp[j] - rp[j - 1]); let d = ang[j] - ang[j - 1]; d -= 360 * Math.round(d / 360);
              peri.push(j); pAng.push(ang[j - 1] + fr * d);
            }
            extra = { As, Ls, peri, pAng: unwrap(pAng.length ? pAng : [0]), L0: Ls[0] };
          } else {
            Qm = R.y.map((S, j) => md.Q(S, R.t[j], e, md));
            Qp = R.y.map((S) => Qm[0] + S[4]);
          }
          return { R, md, e, Qm, Qp, ...extra, yr: span([Qm, Qp], 0.15, md.min) };
        });
        v.animate((t) => {
          const B = run(), md = B.md, R = B.R, e = B.e, n = R.t.length - 1, i = Math.min(n, Math.round(((Math.min(t, 10) / 10) * md.T) / R.dt));
          s.setView(...md.view);
          const key = mode.value + '|' + e;
          const segs = (segCache[key] ||= contourSegs((x, y) => md.U(x, y, e), md.view[0], md.view[1], 80, 80, Array.from({ length: 10 }, (_, j) => md.lo + ((j + 0.5) * (md.hi - md.lo)) / 10)));
          landscape(v, s, (x, y) => md.U(x, y, e), { lo: md.lo, hi: md.hi, key, segs, invert: md.invert });
          if (md.gen) s.field(md.gen, { spacing: 46, color: 'muted', alpha: 0.32 });
          const pts = R.y.map((S) => [S[0], S[1]]);
          s.path(pts.slice(0, i + 1), { color: 'accent', width: 1.8 });
          const S = R.y[i], p = [S[0], S[1]];
          if (md.gen) {
            const K = md.gen(p[0], p[1]), Kl = Math.hypot(...K) || 1, a = md.G(p[0], p[1], e), F = [-a[0], -a[1]], Fl = Math.hypot(...F);
            s.arrow(p[0], p[1], p[0] + (0.75 * K[0]) / Kl, p[1] + (0.75 * K[1]) / Kl, { color: 'green', width: 2.4, head: 8 });
            s.tex('K', p[0] + (0.75 * K[0]) / Kl, p[1] + (0.75 * K[1]) / Kl, { color: 'green', dx: 6, dy: -4, size: 13 });
            if (Fl > 1e-3) { const sc = Math.min(1.1, 0.5 / Math.sqrt(Fl)); s.arrow(p[0], p[1], p[0] + sc * F[0], p[1] + sc * F[1], { color: 'purple', width: 2, head: 7 }); }
            if (mode.value !== 'trans') s.dot(0, 0, { r: 3.5, color: 'ink', label: 'O', labelPos: 'sw' });
          } else {
            s.dot(0, 0, { r: 6, color: 'gold' });
            for (const j of B.peri) if (j <= i) s.dot(R.y[j][0], R.y[j][1], { r: 3, color: 'red', ring: false });
            const tips = B.As.slice(0, i + 1).map((A) => [2.2 * A[0], 2.2 * A[1]]);
            s.path(tips, { color: 'green', width: 1.4, alpha: 0.6 });
            const A = B.As[i];
            s.arrow(0, 0, 2.2 * A[0], 2.2 * A[1], { color: 'green', width: 3 });
            s.tex('\\mathbf A', 2.2 * A[0], 2.2 * A[1], { color: 'green', dx: 8, dy: -6 });
          }
          s.dot(p[0], p[1], { r: 6, color: 'gold' });
          s.corner(e === 0 ? 'symmetric: δL = 0' : `broken: ${md.label === 'Kepler: Runge–Lenz' ? 'extra 1/r³ force' : 'δL ≠ 0'}`, 'tl', { color: e === 0 ? 'green' : 'red', weight: 600 });
          sq.setView([0, md.T], B.yr);
          sq.setTitle(md.title);
          sq.hline(B.Qm[0], { color: 'faint', dash: [3, 4] });
          series(sq, R.t, B.Qm, i, { color: 'blue', width: 3.2 });
          series(sq, R.t, B.Qp, i, { color: 'orange', width: 1.8, dash: [7, 5] });
          sq.dot(R.t[i], B.Qm[i], { r: 4.5, color: 'blue' });
          cur = { B, i };
        }, { period: 11.2, still: 9.6 });
        v.legend([['blue', 'Noether charge, measured'], ['orange', 'start $+\\int_0^t\\delta L\\,dt$ (predicted drift)', { dash: true }], ['green', 'generator $K$ / Runge–Lenz $\\mathbf A$'], ['purple', 'force $-\\nabla U$']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, md = B.md, R = B.R, tt = v.fix(R.t[i], 1);
          if (mode.value === 'lrl') {
            const beta = 0.12 * B.e, gam = Math.sqrt(1 - beta / (B.L0 * B.L0)), th = 360 * (1 / gam - 1);
            const np = B.pAng.length, meas = np > 1 ? (B.pAng[np - 1] - B.pAng[0]) / (np - 1) : NaN;
            return String.raw`at $t = ${tt}$: direction of $\mathbf A$ ${v.fix(B.Qm[i], 3)}° (start ${v.fix(B.Qm[0], 3)}°), predicted from $\int_0^t f(r)\,\hat{\mathbf r}\times\mathbf L\,dt$: ${v.fix(B.Qp[i], 3)}° · perihelion advance per orbit: measured ${isFinite(meas) ? v.fix(meas, 3) : '–'}°, theory $360^\circ(1/\gamma - 1) = ${v.fix(th, 3)}^\circ$ with $\gamma = \sqrt{1-\beta/L^2}$ · $L_z$ changed by $${sci(v, maxDev(B.Ls, i))}$ — rotations are still a symmetry, the hidden Kepler symmetry is not`;
          }
          const dQ = B.Qm[i] - B.Qm[0], I = R.y[i][4];
          return String.raw`at $t = ${tt}$: $${md.qtex} = ${v.fix(B.Qm[i], 4)}$ (start ${v.fix(B.Qm[0], 4)}) · change $${num(v, dQ, 5)}$ against $\int_0^t ${md.rtex}\,dt = ${num(v, I, 5)}$ (mismatch $${sci(v, Math.abs(dQ - I))}$)` +
            (B.e === 0 ? String.raw` · $\varepsilon = 0$: the potential is invariant, and the charge has stayed within $${sci(v, maxDev(B.Qm, i))}$ of its start` : String.raw` · symmetry broken by the ${md.brk}`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.4
    {
      num: '7.4',
      kind: 'Corollary',
      name: 'Homogeneity of space: conservation of momentum',
      statement: String.raw`If the Lagrangian of a system of particles is unchanged when every particle is displaced by the same vector $s\,\mathbf e$ — space is homogeneous in the direction $\mathbf e$, as for an isolated system with interactions depending only on relative positions — then the component of the total momentum along $\mathbf e$,
$$\mathbf P\cdot\mathbf e = \sum_i \frac{\partial L}{\partial\dot{\mathbf r}_i}\cdot\mathbf e ,$$
is conserved. If the potential does depend on the common position, $\dot{\mathbf P}\cdot\mathbf e = -\sum_i\partial U/\partial\mathbf r_i\cdot\mathbf e$: the total external force along $\mathbf e$. In a uniform vertical field the horizontal components of $\mathbf P$ are conserved, the vertical one is not.`,
      idea: String.raw`Apply Noether’s theorem (7.3) to the generator $K = (\mathbf e,\dots,\mathbf e)$: the charge is $\sum\mathbf p_i\cdot\mathbf e$. The kinetic energy is unchanged by a common displacement, so $\delta L = -\sum\nabla_iU\cdot\mathbf e$, which vanishes for internal forces (they depend on differences $\mathbf r_i - \mathbf r_j$) — the Lagrangian version of the third-law argument of 2.2. A flat floor and vertical gravity do not care where along the floor the system is; a corrugated floor does.`,
      caption: String.raw`A triatomic “molecule” of three unequal masses joined by springs is thrown spinning across a floor and bounces elastically. Bottom left: the total momentum $(P_x, P_y)$ traces a vertical line — gravity and a flat floor push only vertically, so $P_x$ never changes. Give the floor ripples: the floor now depends on $x$, every bounce kicks $P_x$, and the jumps match the integrated horizontal floor force (dashed, right).`,
      deps: ['mech-7.3', 'mech-2.2'],
      refs: ['Goldstein §2.6'],
      tags: ['momentum', 'symmetry', 'Noether'],
      viz(v) {
        const g = 9.81, KF = 4000, KS = 700, RB = 0.07, T = 8, DT = 2.5e-4, EV = 40;
        const A = v.slider('floor ripple amplitude (m)', 0, 0.3, 0, { step: 0.01 });
        const lam = v.slider('ripple wavelength (m)', 0.6, 3, 1.5, { step: 0.05 });
        const w0 = v.slider('initial spin (rad/s)', -8, 8, 5, { step: 0.5 });
        const s = v.stage({ x: [-0.6, 12.6], y: [-0.45, 2.7], equal: true, axes: false, height: 240, full: true, title: 'masses 1, 0.7 and 1.3 kg on springs, uniform gravity, elastic floor' });
        const sh = v.stage({ x: [0, 8], y: [-9, 9], axes: 'box', height: 260, title: 'total momentum $\\mathbf P$ (kg·m/s)' });
        const sp = v.stage({ x: [0, T], y: [0, 8], axes: 'box', height: 260, xlabel: 't (s)', weight: 1.35, title: 'horizontal momentum $P_x$ (kg·m/s)' });
        const m = [1, 0.7, 1.3], COL = ['blue', 'orange', 'purple'];
        const cache = memo(); let cur = null;
        const run = () => cache([A.value, lam.value, w0.value].join('|'), () => {
          const a = A.value, kk = TAU / lam.value, om = w0.value;
          const h = (x) => a * Math.sin(kk * x), hp = (x) => a * kk * Math.cos(kk * x);
          const side = 0.55, c0 = [0.55, 1.45], V0 = [1.35, 2.2];
          let x = [0, 1, 2].map((j) => { const ang = Math.PI / 2 + (j * TAU) / 3; return [c0[0] + (side / Math.sqrt(3)) * Math.cos(ang), c0[1] + (side / Math.sqrt(3)) * Math.sin(ang)]; });
          const cm = (X) => { let sx = 0, sy = 0; X.forEach((p, i) => { sx += m[i] * p[0]; sy += m[i] * p[1]; }); return [sx / 3, sy / 3]; };
          const R0 = cm(x);
          let vv = x.map((p) => [V0[0] - om * (p[1] - R0[1]), V0[1] + om * (p[0] - R0[0])]);
          const pairs = [[0, 1], [1, 2], [0, 2]], rest = pairs.map(([i, j]) => Math.hypot(x[i][0] - x[j][0], x[i][1] - x[j][1]));
          const F = [[0, 0], [0, 0], [0, 0]];
          const force = (X) => {
            for (const f of F) { f[0] = 0; f[1] = 0; }
            pairs.forEach(([i, j], q) => { const dx = X[j][0] - X[i][0], dy = X[j][1] - X[i][1], d = Math.hypot(dx, dy), fm = (KS * (d - rest[q])) / d; F[i][0] += fm * dx; F[i][1] += fm * dy; F[j][0] -= fm * dx; F[j][1] -= fm * dy; });
            let fx = 0;
            for (let i = 0; i < 3; i++) { F[i][1] -= m[i] * g; const pen = h(X[i][0]) + RB - X[i][1]; if (pen > 0) { const ux = -KF * pen * hp(X[i][0]); F[i][0] += ux; F[i][1] += KF * pen; fx += ux; } }
            return fx;
          };
          const Pof = () => [m[0] * vv[0][0] + m[1] * vv[1][0] + m[2] * vv[2][0], m[0] * vv[0][1] + m[1] * vv[1][1] + m[2] * vv[2][1]];
          let fx = force(x), I = 0;
          const out = { t: [0], x: [x.map((p) => p.slice())], P: [Pof()], I: [0], cm: [cm(x)], dt: DT * EV };
          const steps = Math.round(T / DT);
          for (let n = 1; n <= steps; n++) {
            for (let i = 0; i < 3; i++) { vv[i][0] += (0.5 * DT * F[i][0]) / m[i]; vv[i][1] += (0.5 * DT * F[i][1]) / m[i]; x[i][0] += DT * vv[i][0]; x[i][1] += DT * vv[i][1]; }
            const fx1 = force(x);
            for (let i = 0; i < 3; i++) { vv[i][0] += (0.5 * DT * F[i][0]) / m[i]; vv[i][1] += (0.5 * DT * F[i][1]) / m[i]; }
            I += 0.5 * DT * (fx + fx1); fx = fx1;
            if (n % EV === 0) { out.t.push(n * DT); out.x.push(x.map((p) => p.slice())); out.P.push(Pof()); out.I.push(I); out.cm.push(cm(x)); }
          }
          out.Px = out.P.map((p) => p[0]); out.Py = out.P.map((p) => p[1]); out.pred = out.I.map((c) => out.Px[0] + c); out.h = h;
          const [xl, xh] = span([out.Px], 0.25, 3), ym = Math.max(...out.Py.map(Math.abs)) * 1.15;
          out.hv = [[xl, xh], [-ym, ym]]; out.pr = span([out.Px, out.pred], 0.2, 1.2);
          let xa = -0.6, xb = 12.6; for (const X of out.x) for (const p of X) { xa = Math.min(xa, p[0] - 0.5); xb = Math.max(xb, p[0] + 0.5); }
          out.xv = [xa, xb];
          return out;
        });
        v.animate((t) => {
          const R = run(), n = R.t.length - 1, i = Math.min(n, Math.round(Math.min(t, T) / R.dt)), X = R.x[i];
          // floor
          const [xa, xb] = R.xv;
          s.setView([xa, xb], [-0.45, 2.7]);
          const fl = []; for (let k = 0; k <= 600; k++) { const xx = xa + ((xb - xa) * k) / 600; fl.push([xx, R.h(xx)]); }
          s.poly([[xa, -0.45], ...fl, [xb, -0.45]], { fill: 'muted', fillAlpha: 0.18, stroke: false });
          s.path(fl, { color: 'muted', width: 2 });
          s.path(R.cm.slice(0, i + 1), { color: 'green', width: 1.4, dash: [4, 4] });
          s.line(X[0][0], X[0][1], X[1][0], X[1][1], { color: 'muted', width: 2 }); s.line(X[1][0], X[1][1], X[2][0], X[2][1], { color: 'muted', width: 2 }); s.line(X[0][0], X[0][1], X[2][0], X[2][1], { color: 'muted', width: 2 });
          X.forEach((p, k) => s.circle(p[0], p[1], RB * Math.cbrt(m[k]), { fill: COL[k], fillAlpha: 0.55, color: COL[k], width: 1.5 }));
          s.dot(R.cm[i][0], R.cm[i][1], { r: 4, color: 'green' });
          // hodograph
          sh.setView(...R.hv);
          sh.hline(0, { color: 'faint' });
          sh.vline(R.Px[0], { color: 'green', dash: [5, 4], width: 1.4 });
          sh.tex('P_x(0)', R.Px[0], R.hv[1][1], { color: 'green', size: 12, dx: 5, dy: 12, align: 'left' });
          sh.tex('P_x', R.hv[0][1], 0, { color: 'muted', size: 13, align: 'right', dx: -6, dy: -10 });
          sh.tex('P_y', R.hv[0][0], R.hv[1][1], { color: 'muted', size: 13, align: 'left', dx: 30, dy: 12 });
          sh.path(R.P.slice(0, i + 1), { color: 'accent', width: 1.8 });
          sh.dot(R.Px[i], R.Py[i], { r: 5.5, color: 'gold' });
          // P_x(t)
          sp.setView([0, T], R.pr);
          series(sp, R.t, R.Px, i, { color: 'blue', width: 3.2 });
          series(sp, R.t, R.pred, i, { color: 'orange', width: 1.8, dash: [7, 5] });
          sp.dot(R.t[i], R.Px[i], { r: 4.5, color: 'blue' });
          cur = { R, i };
        }, { period: T + 1.2, still: 7.2 });
        v.legend([['blue', '$P_x$ measured'], ['orange', '$P_x(0) + \\int_0^t\\sum F_x^{\\rm floor}\\,dt$', { dash: true }], ['accent', 'path of $\\mathbf P$'], ['green', 'centre of mass']]);
        v.readout(() => {
          if (!cur) return '';
          const { R, i } = cur, dev = maxDev(R.Px, i);
          let lo = Infinity, hi = -Infinity; for (let j = 0; j <= i; j++) { lo = Math.min(lo, R.Py[j]); hi = Math.max(hi, R.Py[j]); }
          const head = A.value === 0
            ? String.raw`flat floor: $L$ is unchanged by sliding everything along $x$, so $P_x = ${v.fix(R.Px[i], 5)}$ kg·m/s stays put (largest change $${sci(v, dev)}$)`
            : String.raw`rippled floor: the floor potential depends on $x$ · $P_x(t)-P_x(0) = ${v.fix(R.Px[i] - R.Px[0], 5)}$, integrated horizontal floor force $${v.fix(R.I[i], 5)}$ kg·m/s`;
          return head + String.raw` · $P_y$ has ranged over $[${v.fix(lo, 2)},\ ${v.fix(hi, 2)}]$: gravity (and the floor) depend on $y$, so vertical translations are not a symmetry`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.5
    {
      num: '7.5',
      kind: 'Corollary',
      name: 'Isotropy of space: conservation of angular momentum',
      statement: String.raw`If the Lagrangian of a system of particles is unchanged when the whole system is rotated about an axis $\mathbf n$ through the origin — space is isotropic about $\mathbf n$, as for an isolated system or for a potential symmetric about that axis — then the component of the total angular momentum along the axis,
$$\mathbf L\cdot\mathbf n = \sum_i(\mathbf r_i\times\mathbf p_i)\cdot\mathbf n ,$$
is conserved. Each axis of symmetry gives one conserved component: a spherically symmetric potential conserves all of $\mathbf L$, a potential symmetric about the $z$-axis only $L_z$. Otherwise $\frac{d}{dt}(\mathbf L\cdot\mathbf n)$ equals the external torque about $\mathbf n$.`,
      idea: String.raw`An infinitesimal rotation moves each particle by $\delta\mathbf r_i = s\,\mathbf n\times\mathbf r_i$ and each velocity by $s\,\mathbf n\times\dot{\mathbf r}_i$. Kinetic energy is unchanged, so Noether’s theorem (7.3) applies whenever $U$ is invariant; the charge is $\sum\mathbf p_i\cdot(\mathbf n\times\mathbf r_i) = \mathbf n\cdot\sum\mathbf r_i\times\mathbf p_i$. The drift is $\delta L = -\sum\nabla_iU\cdot(\mathbf n\times\mathbf r_i) = \mathbf n\cdot\sum\mathbf r_i\times\mathbf F_i$, the torque — the result of 2.9 and 2.10, now explained by a symmetry.`,
      caption: String.raw`A particle in the 3D oscillator potential $U = \tfrac12(x^2 + \omega_y^2y^2 + \omega_z^2z^2)$, whose equipotential ellipsoid is drawn. Its angular momentum $\mathbf L$ is the green arrow; its tip leaves a trail. Round potential: all three components are constant and the tip stands still. Round about $z$: only $L_z$ survives and the tip moves in a horizontal plane. Triaxial: nothing survives. The dashed curves are $\mathbf L(0)+\int\boldsymbol\tau\,dt$.`,
      deps: ['mech-7.3', 'mech-2.10'],
      refs: ['Goldstein §2.6'],
      tags: ['angular momentum', 'symmetry', 'Noether'],
      viz(v) {
        const T = 25, DT = 0.005, EV = 4;
        const PRE = { sph: [1, 1], axi: [1, 1.35], tri: [0.8, 1.35] };
        let wy = null, wz = null;
        v.select('potential', [{ value: 'sph', label: 'round' }, { value: 'axi', label: 'round about $z$' }, { value: 'tri', label: 'triaxial' }], 'axi', { onChange: (p) => { wy.set(PRE[p][0]); wz.set(PRE[p][1]); } });
        wy = v.slider('$\\omega_y/\\omega_x$', 0.6, 1.6, 1, { step: 0.01 });
        wz = v.slider('$\\omega_z/\\omega_x$', 0.6, 1.6, 1.35, { step: 0.01 });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 360, title: 'orbit, equipotential and $\\mathbf L$ (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.34, axis: 1.55, lim: 2, hint: false });
        const sp = v.stage({ x: [0, T], y: [-1, 1], axes: 'box', height: 360, xlabel: 't', title: 'components of $\\mathbf L$' });
        const r0 = [1, 0.2, 0.3], v0 = [0.1, 0.8, 0.45];
        const cache = memo(); let cur = null;
        const run = () => cache(wy.value + '|' + wz.value, () => {
          const w2 = [1, wy.value ** 2, wz.value ** 2];
          const f = (t, Y) => {
            const F = [-w2[0] * Y[0], -w2[1] * Y[1], -w2[2] * Y[2]];
            return [Y[3], Y[4], Y[5], F[0], F[1], F[2], Y[1] * F[2] - Y[2] * F[1], Y[2] * F[0] - Y[0] * F[2], Y[0] * F[1] - Y[1] * F[0]];
          };
          const R = rk4rec(f, [...r0, ...v0, 0, 0, 0], T, Math.round(T / DT), EV);
          const L = R.y.map((Y) => [Y[1] * Y[5] - Y[2] * Y[4], Y[2] * Y[3] - Y[0] * Y[5], Y[0] * Y[4] - Y[1] * Y[3]]);
          const Lc = [0, 1, 2].map((k) => L.map((l) => l[k])), Pc = [0, 1, 2].map((k) => R.y.map((Y) => Lc[k][0] + Y[6 + k]));
          const E = 0.5 * (v0[0] ** 2 + v0[1] ** 2 + v0[2] ** 2) + 0.5 * (w2[0] * r0[0] ** 2 + w2[1] * r0[1] ** 2 + w2[2] * r0[2] ** 2);
          const ax = w2.map((w) => Math.sqrt((2 * E) / w));
          return { R, L, Lc, Pc, ax, w: [1, wy.value, wz.value], yr: span([...Lc, ...Pc], 0.2, 0.5), L0: Math.hypot(...L[0]) };
        });
        v.animate((t) => {
          const B = run(), R = B.R, n = R.t.length - 1, i = Math.min(n, Math.round(((Math.min(t, 12) / 12) * T) / R.dt));
          const ax = B.ax, ell = (u, v2, a, b) => Array.from({ length: 73 }, (_, k) => { const th = (TAU * k) / 72, p = [0, 0, 0]; p[u] = a * Math.cos(th); p[v2] = b * Math.sin(th); return p; });
          sc.begin();
          for (const [u, w] of [[0, 1], [1, 2], [0, 2]]) sc.path(ell(u, w, ax[u], ax[w]), { color: 'muted', width: 1, alpha: 0.5 });
          const pos = R.y.map((Y) => [Y[0], Y[1], Y[2]]);
          sc.path(pos.slice(Math.max(0, i - 360), i + 1), { color: 'accent', width: 1.6 });
          const k = 1.25 / B.L0, tips = B.L.slice(0, i + 1).map((l) => l.map((c) => c * k));
          sc.path(tips, { color: 'green', width: 1.3, alpha: 0.7 });
          sc.arrow([0, 0, 0], tips[i], { color: 'green', width: 3 });
          sc.tex('\\mathbf L', tips[i], { color: 'green', dx: 8, dy: -6 });
          sc.dot(pos[i], { r: 6, color: 'gold' });
          sc.flush();
          sp.setView([0, T], B.yr);
          sp.hline(0, { color: 'faint' });
          const C = ['purple', 'teal', 'blue'];
          for (let c = 0; c < 3; c++) { series(sp, R.t, B.Lc[c], i, { color: C[c], width: 2.8 }); series(sp, R.t, B.Pc[c], i, { color: 'ink', width: 1.1, dash: [5, 5], alpha: 0.75 }); }
          const late = R.t[i] > 0.85 * T;
          for (let c = 0; c < 3; c++) sp.tex(`L_${'xyz'[c]}`, R.t[i], B.Lc[c][i], { color: C[c], dx: late ? -8 : 6, dy: late ? -12 : 0, size: 13, align: late ? 'right' : 'left' });
          cur = { B, i };
        }, { period: 13.2, still: 11.5 });
        v.legend([['purple', '$L_x$'], ['teal', '$L_y$'], ['blue', '$L_z$'], ['ink', '$\\mathbf L(0) + \\int_0^t\\mathbf r\\times\\mathbf F\\,dt$', { dash: true }], ['green', '$\\mathbf L$ and its tip']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, w = B.w, axisSym = [w[1] === w[2], w[0] === w[2], w[0] === w[1]];
          const parts = [0, 1, 2].map((c) => {
            const d = maxDev(B.Lc[c], i), nm = `L_${'xyz'[c]}`;
            return d < 1e-9 ? String.raw`$${nm}$ constant (drift $${sci(v, d)}$${axisSym[c] ? `, $U$ round about $${'xyz'[c]}$` : ''})` : String.raw`$${nm}$ varies by up to ${v.fix(d, 3)}`;
          });
          let mis = 0; for (let c = 0; c < 3; c++) for (let j = 0; j <= i; j++) mis = Math.max(mis, Math.abs(B.Lc[c][j] - B.Pc[c][j]));
          return parts.join(' · ') + String.raw` · largest gap between $\mathbf L$ and $\mathbf L(0)+\int\boldsymbol\tau\,dt$: $${sci(v, mis)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.6
    {
      num: '7.6',
      kind: 'Definition',
      name: 'The energy function',
      statement: String.raw`The **energy function** (Jacobi’s integral) of a Lagrangian $L(q,\dot q,t)$ is
$$h(q,\dot q,t) = \sum_j \dot q_j\,\frac{\partial L}{\partial\dot q_j} - L = \sum_j p_j\dot q_j - L .$$
If $L = T_2 + T_1 + T_0 - U$ with $T_k$ homogeneous of degree $k$ in the velocities, Euler’s theorem on homogeneous functions gives $h = T_2 - T_0 + U$. In particular for a **natural** system — time-independent constraints, so $T = T_2$ is quadratic in $\dot q$, and a velocity-independent $U$ — the energy function is the mechanical energy, $h = T + U$. Terms linear in $\dot q$ (magnetic potentials, total derivatives) drop out of $h$.`,
      idea: String.raw`In one dimension, $h$ has a picture: at fixed $q$, $L$ is a function of the velocity, and $L - \dot q\,\partial L/\partial\dot q$ is the height at which its tangent line at $\dot q$ crosses the axis $\dot q = 0$. So $-h$ is that intercept — $h$ is the Legendre transform of $L$ in the velocity, the bridge to the Hamiltonian. For a parabola $\tfrac12m\dot q^2 - U$ the intercept is $-(\tfrac12m\dot q^2 + U)$; a linear term $b\,\dot q$ tilts the parabola without moving the intercept; a $\dot q$-independent $T_0$ shifts everything by the same amount and enters $h$ with the wrong sign.`,
      caption: String.raw`The blue curve is $L$ as a function of $\dot q$ at the current $q$; the gold point is the current velocity and the orange line its tangent, whose slope is $p$. The tangent meets the vertical axis at $-h$ (green). Press play: the curve heaves as $q$ changes, the point slides, yet the intercept stays on the dashed line — $h$ is conserved (7.7). Compare $T+U$ (red): equal for the pendulum and the gauge term, different for the spinning hoop, and off by the rest energy $mc^2$ for the relativistic oscillator.`,
      deps: ['mech-6.8'],
      see: ['mech-6.16', 'mech-12.2', 'pde-8.11'],
      refs: ['Goldstein §2.7'],
      tags: ['energy function', 'Legendre transform', 'Lagrangian'],
      viz(v) {
        const SYS = {
          pend: { label: 'pendulum', L: (q, w) => 0.5 * w * w + Math.cos(q), Lv: (q, w) => w, acc: (q) => -Math.sin(q), E: (q, w) => 0.5 * w * w - Math.cos(q), q0: 2.2 },
          gauge: { label: 'pendulum $+\\,\\frac{d}{dt}(b\\sin q)$', L: (q, w, b) => 0.5 * w * w + Math.cos(q) + b * w * Math.cos(q), Lv: (q, w, b) => w + b * Math.cos(q), acc: (q) => -Math.sin(q), E: (q, w) => 0.5 * w * w - Math.cos(q), q0: 2.2 },
          hoop: { label: 'bead on a spinning hoop', L: (q, w, b, W) => 0.5 * w * w + 0.5 * W * W * Math.sin(q) ** 2 + Math.cos(q), Lv: (q, w) => w, acc: (q, w, b, W) => (W * W * Math.cos(q) - 1) * Math.sin(q), E: (q, w, b, W) => 0.5 * w * w + 0.5 * W * W * Math.sin(q) ** 2 - Math.cos(q), q0: 2.4 },
          rel: { label: 'relativistic oscillator', L: (q, w) => -Math.sqrt(1 - w * w) - 0.5 * q * q, Lv: (q, w) => w / Math.sqrt(1 - w * w), acc: (q, w) => -q * (1 - w * w) ** 1.5, E: (q, w) => 1 / Math.sqrt(1 - w * w) - 1 + 0.5 * q * q, q0: 2 },
        };
        let qS = null;
        const sys = v.select('Lagrangian', Object.entries(SYS).map(([value, o]) => ({ value, label: o.label })), 'pend', { onChange: (k) => qS.set(SYS[k].q0) });
        qS = v.slider('amplitude $q_0$', 0.2, 3, 2.2, { step: 0.01 });
        const bS = v.slider('gauge term $b$', -1.5, 1.5, 1, { step: 0.05 });
        const wS = v.slider('hoop spin $\\omega$', 0, 2.5, 1.6, { step: 0.05 });
        const sL = v.stage({ x: [-3, 3], y: [-3, 4], axes: true, height: 340, weight: 1.3, xlabel: 'q̇', ylabel: 'L', title: '$L(q,\\dot q)$ at the current $q$, as a function of $\\dot q$' });
        const sE = v.stage({ x: [0, 20], y: [-1, 1], axes: 'box', height: 340, xlabel: 't', title: '$h$ and $T + U$ along the motion' });
        const T = 20, DT = 0.005, EV = 4;
        const cache = memo(); let cur = null;
        const run = () => cache([sys.value, qS.value, bS.value, wS.value].join('|'), () => {
          const o = SYS[sys.value], b = bS.value, W = wS.value;
          const R = rk4rec((t, S) => [S[1], o.acc(S[0], S[1], b, W)], [qS.value, 0], T, Math.round(T / DT), EV);
          const h = R.y.map(([q, w]) => w * o.Lv(q, w, b, W) - o.L(q, w, b, W)), E = R.y.map(([q, w]) => o.E(q, w, b, W));
          let wm = 0; for (const [, w] of R.y) wm = Math.max(wm, Math.abs(w));
          const wr = sys.value === 'rel' ? [-1.05, 1.05] : [-Math.max(1, wm * 1.3), Math.max(1, wm * 1.3)];
          let lo = Infinity, hi = -Infinity;
          for (let j = 0; j < R.y.length; j += 8) { const q = R.y[j][0]; for (let k = 0; k <= 40; k++) { const w = wr[0] * 0.999 + ((wr[1] - wr[0]) * 0.999 * k) / 40, L = o.L(q, w, b, W); if (isFinite(L)) { lo = Math.min(lo, L); hi = Math.max(hi, L); } } }
          lo = Math.min(lo, ...h.map((x) => -x), ...E.map((x) => -x)); hi = Math.max(hi, 0.3);
          const pad = 0.1 * (hi - lo);
          return { R, h, E, o, b, W, wr, yr: [lo - 2 * pad, hi + pad], er: span([h, E], 0.25, 0.5) };
        });
        v.animate((t) => {
          bS.el.hidden = sys.value !== 'gauge'; wS.el.hidden = sys.value !== 'hoop';
          const B = run(), R = B.R, o = B.o, n = R.t.length - 1, i = Math.min(n, Math.round(Math.min(t, T) / R.dt)), [q, w] = R.y[i];
          sL.setView(B.wr, B.yr);
          const Lw = (x) => o.L(q, x, B.b, B.W), L = Lw(w), p = o.Lv(q, w, B.b, B.W), icpt = L - p * w;
          if (sys.value === 'rel') { sL.vline(-1, { color: 'faint', dash: [3, 4] }); sL.vline(1, { color: 'faint', dash: [3, 4] }); }
          sL.hline(-B.h[0], { color: 'green', dash: [6, 4], width: 1.3, alpha: 0.8 });
          if (sys.value === 'hoop') { sL.hline(-B.E[i], { color: 'red', dash: [3, 3], width: 1.5 }); sL.text('−(T+U)', B.wr[1], -B.E[i], { color: 'red', size: 11, align: 'right', dy: 10 }); }
          sL.fn(Lw, { domain: sys.value === 'rel' ? [-0.9995, 0.9995] : B.wr, n: 400, color: 'blue', width: 2.6 });
          sL.line(B.wr[0], L + p * (B.wr[0] - w), B.wr[1], L + p * (B.wr[1] - w), { color: 'orange', width: 1.8 });
          sL.line(0, icpt, w, icpt, { color: 'muted', dash: [2, 3], width: 1.2 });
          sL.line(w, icpt, w, L, { color: 'muted', dash: [2, 3], width: 1.2 });
          if (Math.abs(w) > 0.15 * (B.wr[1] - B.wr[0]) / 2) sL.tex('\\dot q\\,p', w, (icpt + L) / 2, { color: 'muted', align: w > 0 ? 'left' : 'right', dx: w > 0 ? 5 : -5, size: 13 });
          sL.dot(w, L, { r: 6, color: 'gold' });
          sL.dot(0, icpt, { r: 6, color: 'green' });
          sL.tex('-h', 0, icpt, { color: 'green', align: w > 0 ? 'right' : 'left', dx: w > 0 ? -9 : 9, dy: 14, size: 14 });
          sL.corner(`q = ${v.fix(q, 2)},  p = ${v.fix(p, 3)}`, 'tl', { color: 'muted' });
          sE.setView([0, T], B.er);
          series(sE, R.t, B.h, i, { color: 'blue', width: 3 });
          series(sE, R.t, B.E, i, { color: 'red', width: 2, dash: [6, 4] });
          sE.dot(R.t[i], B.h[i], { r: 4.5, color: 'blue' });
          cur = { B, i };
        }, { period: T + 1, still: 4.6 });
        v.legend([['blue', '$L(\\dot q)$ / $h$'], ['orange', 'tangent, slope $p = \\partial L/\\partial\\dot q$'], ['green', 'intercept $-h = L - \\dot q\\,p$'], ['red', '$T + U$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, h = B.h[i], E = B.E[i];
          const note = {
            pend: ' — the same: $T = \\tfrac12\\dot q^2$ is quadratic in $\\dot q$',
            gauge: ' — the same: the added $b\\,\\dot q\\cos q$ is linear in $\\dot q$ (a total derivative, 6.16), tilts the parabola and drops out of $h$',
            hoop: String.raw` — different: the hoop’s motion adds $T_0 = \tfrac12\omega^2\sin^2q$, independent of $\dot q$, so $h = T_2 - T_0 + U$ and $h - (T+U) = -2T_0 = ${v.fix(h - E, 4)}$`,
            rel: String.raw` with $T = (\gamma-1)mc^2$: $h - (T+U) = mc^2 = ${v.fix(h - E, 6)}$ — $h = \gamma mc^2 + U$ is the relativistic energy, rest energy included`,
          }[sys.value];
          return String.raw`$h = \dot q\,\partial L/\partial\dot q - L = ${v.fix(h, 5)}$ (start ${v.fix(B.h[0], 5)}, largest change $${sci(v, maxDev(B.h, i))}$) · $T + U = ${v.fix(E, 5)}$` + note;
        });
      },
    },
  ],
};
