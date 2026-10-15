// Classical Mechanics — Chapter 6: Lagrangian mechanics

// ── shared helpers ────────────────────────────────────────────────────────────
const TAU = 2 * Math.PI;
const G = 9.81;
const DEG = Math.PI / 180;

/** One-slot cache: recompute only when the key changes. */
function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }

/** One classical RK4 step for an array state y' = f(t, y). */
function rk4step(f, t, y, h) {
  const n = y.length, k1 = f(t, y), z = new Array(n), out = new Array(n);
  for (let i = 0; i < n; i++) z[i] = y[i] + 0.5 * h * k1[i];
  const k2 = f(t + 0.5 * h, z);
  for (let i = 0; i < n; i++) z[i] = y[i] + 0.5 * h * k2[i];
  const k3 = f(t + 0.5 * h, z);
  for (let i = 0; i < n; i++) z[i] = y[i] + h * k3[i];
  const k4 = f(t + h, z);
  for (let i = 0; i < n; i++) out[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  return out;
}

/** RK4 from t = 0 to T with step dt, recording every `every` steps; stop(t, y) may end the run early. */
function integrate(f, y0, T, dt, every = 1, stop) {
  let y = y0.slice();
  const out = { t: [0], y: [y.slice()], dt: dt * every }, n = Math.round(T / dt);
  for (let k = 1; k <= n; k++) {
    y = rk4step(f, (k - 1) * dt, y, dt);
    if (k % every === 0) { out.t.push(k * dt); out.y.push(y); if (stop && stop(k * dt, y)) break; }
  }
  return out;
}

/** Index of the recorded frame nearest to time t. */
const frameAt = (sim, t) => Math.min(sim.t.length - 1, Math.max(0, Math.round(t / sim.dt)));

/** Polyline (ts[k], ys[k]) for k = from … upto. */
function series(s, ts, ys, upto, st, from = 0) {
  const pts = [];
  for (let k = Math.max(0, from); k <= Math.min(upto, ts.length - 1); k++) pts.push([ts[k], ys[k]]);
  if (pts.length > 1) s.path(pts, st);
}

/** Range [lo, hi] of several arrays, padded, with a minimum span. */
function span(arrs, pad = 0.1, minSpan = 1) {
  let lo = Infinity, hi = -Infinity;
  for (const a of arrs) for (const y of a) { if (!isFinite(y)) continue; if (y < lo) lo = y; if (y > hi) hi = y; }
  if (!isFinite(lo)) { lo = -minSpan / 2; hi = minSpan / 2; }
  if (hi - lo < minSpan) { const c = (hi + lo) / 2; lo = c - minSpan / 2; hi = c + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}

/** Solve A x = b for a small dense system (Gaussian elimination with partial pivoting). */
function solve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}

/**
 * The "Lagrange machine": given any smooth L(q, q̇, t) (q, q̇ arrays), return q̈ from the Euler–Lagrange equations
 * d/dt ∂L/∂q̇ = ∂L/∂q, i.e. solve  H q̈ = ∂L/∂q − (∂²L/∂q̇∂q) q̇ − ∂²L/∂q̇∂t  with H = ∂²L/∂q̇²,
 * every derivative taken by central differences of L itself (no hand-derived equations of motion).
 */
function lagrangeAccel(L, q, qd, t, hq = 1e-4, hv = 1e-3) {
  const n = q.length, Q = q.slice(), V = qd.slice(), Lq = (tt) => L(Q, V, tt);
  const H = [], rhs = [];
  for (let i = 0; i < n; i++) {
    Q[i] = q[i] + hq; const a = Lq(t); Q[i] = q[i] - hq; const b = Lq(t); Q[i] = q[i];
    let r = (a - b) / (2 * hq);
    for (let j = 0; j < n; j++) {
      V[i] = qd[i] + hv; Q[j] = q[j] + hq; const pp = Lq(t); Q[j] = q[j] - hq; const pm = Lq(t);
      V[i] = qd[i] - hv; const mm = Lq(t); Q[j] = q[j] + hq; const mp = Lq(t); Q[j] = q[j]; V[i] = qd[i];
      r -= ((pp - pm - mp + mm) / (4 * hq * hv)) * qd[j];
    }
    V[i] = qd[i] + hv; const tp = Lq(t + hq) - Lq(t - hq); V[i] = qd[i] - hv; const tm = Lq(t + hq) - Lq(t - hq); V[i] = qd[i];
    r -= (tp - tm) / (4 * hq * hv);
    rhs.push(r);
    const row = [];
    for (let j = 0; j < n; j++) {
      if (j < i) { row.push(H[j][i]); continue; }
      if (j === i) { V[i] = qd[i] + hv; const p = Lq(t); V[i] = qd[i] - hv; const m = Lq(t); V[i] = qd[i]; const c = Lq(t); row.push((p - 2 * c + m) / (hv * hv)); }
      else {
        V[i] = qd[i] + hv; V[j] = qd[j] + hv; const pp = Lq(t); V[j] = qd[j] - hv; const pm = Lq(t);
        V[i] = qd[i] - hv; const mm = Lq(t); V[j] = qd[j] + hv; const mp = Lq(t); V[i] = qd[i]; V[j] = qd[j];
        row.push((pp - pm - mp + mm) / (4 * hv * hv));
      }
    }
    H.push(row);
  }
  return solve(H, rhs);
}

/** Wrap an angle to (−π, π]. */
const wrap = (a) => a - TAU * Math.round(a / TAU);
const deg = (x) => `${Math.round(x)}°`.replace('-', '−');

/** Derivative of equally spaced samples (spacing h): 5-point central stencil, 3-point one-sided at the ends. */
function deriv5(arr, h) {
  const n = arr.length, out = new Array(n);
  for (let i = 0; i < n; i++) {
    if (i >= 2 && i < n - 2) out[i] = (arr[i - 2] - 8 * arr[i - 1] + 8 * arr[i + 1] - arr[i + 2]) / (12 * h);
    else if (i < 2) out[i] = (-3 * arr[i] + 4 * arr[i + 1] - arr[i + 2]) / (2 * h);
    else out[i] = (3 * arr[i] - 4 * arr[i - 1] + arr[i - 2]) / (2 * h);
  }
  return out;
}

/** Zigzag spring from p to q. */
function spring(s, p, q, o = {}) {
  const coils = o.coils ?? 9, amp = o.amp ?? 0.07, lead = o.lead ?? 0.1;
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const pts = [p, [p[0] + ux * L * lead, p[1] + uy * L * lead]], N = 2 * coils;
  for (let k = 1; k < N; k++) { const u = lead + ((1 - 2 * lead) * k) / N, sd = k % 2 ? 1 : -1; pts.push([p[0] + ux * L * u + nx * amp * sd, p[1] + uy * L * u + ny * amp * sd]); }
  pts.push([p[0] + ux * L * (1 - lead), p[1] + uy * L * (1 - lead)], q);
  s.path(pts, { color: o.color || 'muted', width: o.width ?? 1.6 });
}

/** Marching squares: zero set of F on an nx × ny grid, as one polyline list with null breaks. */
function contour(F, [x0, x1], [y0, y1], nx, ny) {
  const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny, V = [];
  for (let j = 0; j <= ny; j++) { const row = []; for (let i = 0; i <= nx; i++) row.push(F(x0 + i * dx, y0 + j * dy)); V.push(row); }
  const pts = [];
  const cut = (xa, ya, fa, xb, yb, fb) => { const t = fa / (fa - fb); return [xa + t * (xb - xa), ya + t * (yb - ya)]; };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = V[j][i], b = V[j][i + 1], c = V[j + 1][i + 1], d = V[j + 1][i];
    const X0 = x0 + i * dx, X1 = X0 + dx, Y0 = y0 + j * dy, Y1 = Y0 + dy, cr = [];
    if ((a > 0) !== (b > 0)) cr.push(cut(X0, Y0, a, X1, Y0, b));
    if ((b > 0) !== (c > 0)) cr.push(cut(X1, Y0, b, X1, Y1, c));
    if ((c > 0) !== (d > 0)) cr.push(cut(X1, Y1, c, X0, Y1, d));
    if ((d > 0) !== (a > 0)) cr.push(cut(X0, Y1, d, X0, Y0, a));
    if (cr.length === 2) pts.push(cr[0], cr[1], null);
    else if (cr.length === 4) {
      if (((a + b + c + d) / 4 > 0) === (a > 0)) pts.push(cr[0], cr[1], null, cr[2], cr[3], null);
      else pts.push(cr[0], cr[3], null, cr[1], cr[2], null);
    }
  }
  return pts;
}

/** Double pendulum with masses m1, m2 and lengths l1, l2; state [θ1, θ2, ω1, ω2] (angles from the downward vertical). */
function dpRates(m1, m2, l1, l2) {
  return (t, s) => {
    const [t1, t2, w1, w2] = s, d = t1 - t2, sd = Math.sin(d), cd = Math.cos(d), den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
    const a1 = (-G * (2 * m1 + m2) * Math.sin(t1) - m2 * G * Math.sin(t1 - 2 * t2) - 2 * sd * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * cd)) / (l1 * den);
    const a2 = (2 * sd * (w1 * w1 * l1 * (m1 + m2) + G * (m1 + m2) * Math.cos(t1) + w2 * w2 * l2 * m2 * cd)) / (l2 * den);
    return [w1, w2, a1, a2];
  };
}
function dpEnergy(m1, m2, l1, l2, s) {
  const [t1, t2, w1, w2] = s;
  const T = 0.5 * (m1 + m2) * l1 * l1 * w1 * w1 + 0.5 * m2 * l2 * l2 * w2 * w2 + m2 * l1 * l2 * w1 * w2 * Math.cos(t1 - t2);
  return T - (m1 + m2) * G * l1 * Math.cos(t1) - m2 * G * l2 * Math.cos(t2);
}

/** A mass drawn as a tinted disc (radius in pixels) with an optional TeX label. */
function bob(s, p, r, col, label) {
  s.dot(p[0], p[1], { r, color: col });
  if (label) s.tex(label, p[0], p[1], { color: 'ink', size: 12, dx: r + 7, dy: -r - 2 });
}

/** Angle arc of radius rr at centre c from the downward vertical to angle th (counter-clockwise positive). */
function angleArc(s, c, rr, th, col, label) {
  if (Math.abs(th) < 0.03) return;
  s.curve((u) => [c[0] + rr * Math.sin(u), c[1] - rr * Math.cos(u)], 0, th, { color: col, width: 1.4, n: 40 });
  s.line(c[0], c[1], c[0], c[1] - rr * 1.25, { color: 'faint', width: 1, dash: [3, 3] });
  if (label) s.tex(label, c[0] + rr * 1.45 * Math.sin(th / 2), c[1] - rr * 1.45 * Math.cos(th / 2), { color: col, size: 13 });
}

/** Pivot glyph: a short hatched bar. */
function pivot(s, x, y, w = 0.3) {
  s.line(x - w, y, x + w, y, { color: 'muted', width: 2.5 });
  for (let k = 0; k < 5; k++) { const u = x - w + (2 * w * (k + 0.5)) / 5; s.line(u, y, u + 0.07, y + 0.08, { color: 'muted', width: 1 }); }
}

export default {
  collection: 'mech',
  chapter: 6,
  title: 'Lagrangian mechanics',
  summary: String.raw`A system’s possible positions form a configuration space, often curved by constraints and best described by generalized coordinates; velocity constraints such as rolling may restrict how we move through it without shrinking it. D’Alembert’s principle removes the workless constraint forces, and Hamilton’s principle of stationary action packages the whole dynamics into one variational problem whose Euler–Lagrange equations are Lagrange’s equations — valid in every coordinate system and in agreement with Newton’s law with the constraint forces solved for. Generalized momenta and forces make Lagrange’s equations a generalized second law, and a coordinate absent from the Lagrangian has a conserved momentum. Classic examples (double Atwood machine, pendulum on a cart, bead on a rotating hoop, spherical pendulum) show the method’s power; Lagrange multipliers recover the constraint forces when we want them, velocity-dependent potentials handle magnetism, a dissipation function handles friction, and with no potential at all the motion simply runs along geodesics.`,
  items: [
    // ───────────────────────────────────────────────────────────── 6.1
    {
      num: '6.1',
      kind: 'Definition',
      name: 'Configuration space and degrees of freedom',
      statement: String.raw`The **configuration space** $Q$ of a mechanical system is the set of all positions the system can occupy that are compatible with its constraints. For $N$ particles in space subject to $k$ independent holonomic constraints (6.2), $Q$ is locally an $n$-dimensional smooth manifold, with
$$n = 3N - k$$
**degrees of freedom**: $n$ numbers are needed, and suffice, to pin down a configuration, and the state of motion at an instant is a point of $Q$ together with a velocity tangent to $Q$. A planar double pendulum has $2\cdot 2 - 2 = 2$ degrees of freedom; each angle lives on a circle, so its configuration space is the torus $T^2 = S^1\times S^1$, not a region of the plane.`,
      idea: String.raw`Each rigid rod is one equation between the coordinates of its ends, and where the constraints are independent (linearly independent gradients) the implicit function theorem (pma-9.28) lets $k$ of the $3N$ coordinates be solved for in terms of the others, so $Q$ has dimension $3N-k$. The global shape can still be curved or wrapped: an angle and the same angle plus $2\pi$ are one configuration, so two angles make a doughnut — or a square with opposite edges glued. Newton’s second law (mech-1.6) then moves a single point along a curve in $Q$; how many numbers it takes to describe that point is a property of the system, not of the coordinates chosen to describe it.`,
      caption: String.raw`Press play. The double pendulum (top left) moves while its state point (gold) runs over its configuration space: the torus of the two angles (top right; the blue circle is $\theta_2 = 0$, the orange one $\theta_1 = 0$; drag to rotate) and the same torus cut open into a square (bottom left), where leaving one edge means re-entering at the opposite one. The faint red twin starts $10^{-6}$ rad away: on the *wild* swing the two separate exponentially (red curve, log scale) while the RK4 energy error (blue) stays below $10^{-8}$ — the divergence is chaos, not numerical drift. On the *gentle* swing the gap barely grows.`,
      deps: ['mech-1.1', 'mech-1.6', 'pma-9.28'],
      refs: ['Arnold §17', 'Tong §2.3'],
      tags: ['configuration space', 'degrees of freedom', 'chaos'],
      viz(v) {
        const T = 30, DT = 0.001, EV = 10, R0 = 1.45, r0 = 0.62, ES = 3 * G;
        const PRE = { gentle: [32, 18], wild: [125, -40] };
        const preset = v.select('', [{ value: 'gentle', label: 'gentle swing' }, { value: 'wild', label: 'wild swing' }], 'wild', { onChange: (k) => { a1.set(PRE[k][0]); a2.set(PRE[k][1]); v.restart(); } });
        const a1 = v.slider('$\\theta_1(0)$', -180, 180, PRE.wild[0], { step: 1, fmt: deg, onChange: () => v.restart() });
        const a2 = v.slider('$\\theta_2(0)$', -180, 180, PRE.wild[1], { step: 1, fmt: deg, onChange: () => v.restart() });
        const twin = v.toggle('twin started $10^{-6}$ rad away', true);
        void preset;
        const sR = v.stage({ x: [-2.15, 2.15], y: [-2.15, 0.45], equal: true, height: 280, axes: false, minWidth: 380, title: 'real space: 4 coordinates, 2 rod constraints' });
        const s3 = v.stage3d({ range: 2.15, height: 280, yaw: -0.55, pitch: 0.95, axes: false, minWidth: 380, title: 'configuration space: the torus $T^2$' });
        const sQ = v.stage({ x: [-3.6, 3.6], y: [-3.6, 3.6], equal: true, height: 270, axes: false, minWidth: 380, title: 'the torus cut open: opposite edges glued' });
        const sE = v.stage({ x: [0, T], y: [1e-15, 10], ylog: true, height: 270, axes: 'box', minWidth: 380, xlabel: 't (s)', title: 'energy error and twin separation (log scale)' });
        const f = dpRates(1, 1, 1, 1), cache = memo();
        const sim = () => cache(`${a1.value}|${a2.value}`, () => {
          const y0 = [a1.value * DEG, a2.value * DEG, 0, 0];
          const A = integrate(f, y0, T, DT, EV), B = integrate(f, [y0[0] + 1e-6, y0[1], 0, 0], T, DT, EV);
          const E0 = dpEnergy(1, 1, 1, 1, y0);
          const dE = A.y.map((y) => Math.abs(dpEnergy(1, 1, 1, 1, y) - E0) / ES);
          const sep = A.y.map((y, k) => Math.hypot(wrap(y[0] - B.y[k][0]), wrap(y[1] - B.y[k][1])));
          const ts = [], ls = [];
          for (let k = 0; k < sep.length; k++) { if (sep[k] >= 0.1) break; if (sep[k] > 1e-5) { ts.push(A.t[k]); ls.push(Math.log(sep[k])); } }
          let lam = null;
          if (ts.length > 80) { const fit = v.M.linreg(ts, ls); if (fit.r2 > 0.75 && fit.slope > 0.25) lam = fit.slope; }
          return { A, B, dE, sep, lam };
        });
        const torus = (p, q, rr = r0) => [(R0 + rr * Math.cos(q)) * Math.cos(p), (R0 + rr * Math.cos(q)) * Math.sin(p), rr * Math.sin(q)];
        const bobs = (y) => { const p1 = [Math.sin(y[0]), -Math.cos(y[0])]; return [p1, [p1[0] + Math.sin(y[1]), p1[1] - Math.cos(y[1])]]; };
        const glue = (s) => {
          const e = Math.PI, a = 0.25;
          s.rect(-e, -e, e, e, { color: 'muted', width: 1.4, fill: 'accent', fillAlpha: 0.05 });
          s.line(-e, 0, e, 0, { color: 'blue', width: 1.2, alpha: 0.7 }); s.line(0, -e, 0, e, { color: 'orange', width: 1.2, alpha: 0.7 });
          for (const x of [-e, e]) s.arrow(x, -a, x, a, { color: 'muted', width: 2, head: 8 });
          for (const y of [-e, e]) { s.arrow(-a - 0.22, y, a - 0.22, y, { color: 'muted', width: 2, head: 8 }); s.arrow(-a + 0.22, y, a + 0.22, y, { color: 'muted', width: 2, head: 8 }); }
          s.text('−π', -e, -e - 0.12, { color: 'muted', size: 10.5, align: 'center', baseline: 'top' }); s.text('π', e, -e - 0.12, { color: 'muted', size: 10.5, align: 'center', baseline: 'top' });
          s.text('−π', -e - 0.12, -e, { color: 'muted', size: 10.5, align: 'right' }); s.text('π', -e - 0.12, e, { color: 'muted', size: 10.5, align: 'right' });
          s.tex('\\theta_1', e + 0.05, 0, { color: 'blue', align: 'left', size: 14 }); s.tex('\\theta_2', 0, e + 0.05, { color: 'orange', baseline: 'bottom', size: 14 });
        };
        v.animate((t) => {
          const S = sim(), k = frameAt(S.A, t), y = S.A.y[k], yb = S.B.y[k];
          // ── real space
          pivot(sR, 0, 0, 0.32);
          const trail = []; for (let j = Math.max(0, k - 250); j <= k; j++) trail.push(bobs(S.A.y[j])[1]);
          sR.path(trail, { color: 'gold', width: 1.6, alpha: 0.75 });
          if (twin.value) { const [q1, q2] = bobs(yb); sR.path([[0, 0], q1, q2], { color: 'red', width: 2, alpha: 0.4 }); sR.dot(q1[0], q1[1], { r: 6, color: 'red', alpha: 0.4, ring: false }); sR.dot(q2[0], q2[1], { r: 7, color: 'red', alpha: 0.4, ring: false }); }
          const [p1, p2] = bobs(y);
          angleArc(sR, [0, 0], 0.32, wrap(y[0]), 'blue', '\\theta_1');
          angleArc(sR, p1, 0.32, wrap(y[1]), 'orange', '\\theta_2');
          sR.path([[0, 0], p1, p2], { color: 'ink', width: 3 });
          sR.dot(0, 0, { r: 3.5, color: 'ink' });
          bob(sR, p1, 9, 'blue'); bob(sR, p2, 9, 'orange');
          // ── torus
          s3.surface((u, w) => torus(u, w), [0, TAU], [0, TAU], { nu: 36, nv: 18, color: 'accent', alpha: 0.2, wire: true });
          s3.curve((u) => torus(u, 0, r0 + 0.01), 0, TAU, { color: 'blue', width: 1.6, n: 120, bias: -0.01 });
          s3.curve((w) => torus(0, w, r0 + 0.01), 0, TAU, { color: 'orange', width: 1.6, n: 60, bias: -0.01 });
          const p3 = []; for (let j = Math.max(0, k - 700); j <= k; j++) { const yy = S.A.y[j]; p3.push(torus(yy[0], yy[1], r0 + 0.02)); }
          s3.path(p3, { color: 'gold', width: 2.4, bias: -0.03 });
          if (twin.value) s3.dot(torus(yb[0], yb[1], r0 + 0.03), { r: 5, color: 'red', alpha: 0.75 });
          s3.dot(torus(y[0], y[1], r0 + 0.03), { r: 6.5, color: 'gold' });
          // ── square
          glue(sQ);
          const sq = []; let prev = null;
          for (let j = Math.max(0, k - 1500); j <= k; j++) {
            const q = [wrap(S.A.y[j][0]), wrap(S.A.y[j][1])];
            if (prev && (Math.abs(q[0] - prev[0]) > Math.PI || Math.abs(q[1] - prev[1]) > Math.PI)) sq.push(null);
            sq.push(q); prev = q;
          }
          sQ.path(sq, { color: 'gold', width: 1.4, alpha: 0.85 });
          if (twin.value) sQ.dot(wrap(yb[0]), wrap(yb[1]), { r: 5, color: 'red', alpha: 0.75 });
          sQ.dot(wrap(y[0]), wrap(y[1]), { r: 6, color: 'gold' });
          // ── log panel
          series(sE, S.A.t, S.dE, k, { color: 'blue', width: 1.8 });
          if (twin.value) series(sE, S.A.t, S.sep, k, { color: 'red', width: 1.8 });
          sE.vline(S.A.t[k], { color: 'gold', width: 1.2 });
        }, { period: T, still: 14 });
        v.legend([['gold', 'state point $(\\theta_1,\\theta_2)$'], ['red', 'twin / separation $|\\Delta\\theta|$'], ['blue', 'energy error $|E(t)-E(0)|/3mg\\ell$']]);
        v.readout((t) => {
          const S = sim(), k = frameAt(S.A, t), y = S.A.y[k];
          let mx = 0; for (let j = 0; j <= k; j++) mx = Math.max(mx, S.dE[j]);
          const growth = twin.value ? (S.lam ? ` — it grows like $e^{\\lambda t}$ with $\\lambda \\approx ${v.fix(S.lam, 2)}\\ \\mathrm{s^{-1}}$ (chaos)` : ' — no exponential growth (regular motion)') : '';
          return String.raw`degrees of freedom: $2\times 2$ coordinates $-\ 2$ constraints $= 2$ · state $(\theta_1,\theta_2) = (${deg(wrap(y[0]) / DEG)}, ${deg(wrap(y[1]) / DEG)})$ · RK4 energy error so far $\le ${v.sci(Math.max(mx, 1e-16), 2)}$` + (twin.value ? String.raw` · twin separation $${v.sci(S.sep[k], 2)}$ rad${growth}` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.2
    {
      num: '6.2',
      kind: 'Definition',
      name: 'Holonomic constraints and generalized coordinates',
      statement: String.raw`A **holonomic constraint** is a relation $f(\mathbf r_1,\dots,\mathbf r_N,t) = 0$ among the positions (and possibly the time) alone. Suppose $k$ such constraints have linearly independent gradients at every point of their common zero set. Then the zero set is a smooth manifold of dimension $n = 3N-k$, and near each of its points it can be described by $n$ independent **generalized coordinates** $q_1,\dots,q_n$,
$$\mathbf r_i = \mathbf r_i(q_1,\dots,q_n,t),\qquad i = 1,\dots,N,$$
a smooth one-to-one parametrisation (a chart) whose Jacobian has rank $n$. Any $n$ such functions will do — angles, arc lengths, distances — and two charts are related by a smooth invertible change of variables. Where the gradients become dependent (for one constraint: where $\nabla f = 0$) the conclusion can fail.`,
      idea: String.raw`For a bead on a planar wire $f(x,y) = c$ the implicit function theorem (pma-9.28) says: if $\partial f/\partial y \ne 0$ at a point, the wire near it is a graph $y = g(x)$ and $x$ is a good coordinate; if $\partial f/\partial x\ne 0$, then $y$ is. Either way a small enough window sees a single arc, and any parameter along it (such as arc length) is a chart. At a saddle point of $f$ on the wire both partials vanish and the theorem says nothing — and indeed the level set through a saddle crosses itself: four arms leave every small window, and no single number can label nearby positions continuously. The constraint force $\lambda\nabla f$ is normal to the wire; allowed (virtual) displacements are tangent to it.`,
      caption: String.raw`The wire is the level set $f = c$ of $f(x,y) = (x^2-1)^2 + y^2$ (faint lines: other levels of $f$). Drag the gold bead along the wire; the dashed window around it is magnified on the right in coordinates along the tangent ($\xi$, green) and the normal ($\zeta$, orange, the direction of $\nabla f$). Where the wire is a single arc in the window it is a graph $\zeta = g(\xi)$, and $\xi$ is a generalized coordinate. Drag the bead into the crossing at the origin: there $\nabla f = 0$, four arms leave the window however small you make it, and no chart exists. Move $c$ off $1$ and the crossing opens into two loops or one.`,
      deps: ['mech-6.1', 'pma-9.28'],
      refs: ['Goldstein §1.3', 'Arnold §17'],
      tags: ['constraints', 'generalized coordinates', 'implicit function theorem'],
      viz(v) {
        const F = (x, y) => (x * x - 1) ** 2 + y * y;
        const grad = (x, y) => [4 * x * (x * x - 1), 2 * y];
        const cS = v.slider('level $c$ of the wire $f = c$', 0.4, 1.7, 1, { step: 0.01 });
        const rS = v.slider('window radius', 0.08, 0.5, 0.3, { step: 0.01 });
        const s = v.stage({ x: [-1.85, 1.85], y: [-1.5, 1.5], equal: true, height: 330, axes: false, weight: 1.45, title: 'the wire $(x^2-1)^2 + y^2 = c$' });
        const z = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, height: 330, axes: false, weight: 1, title: 'the window, magnified: is there a chart?' });
        const proj = (x, y, c = cS.value) => {
          for (let k = 0; k < 60; k++) {
            const [gx, gy] = grad(x, y), n2 = gx * gx + gy * gy, e = F(x, y) - c;
            if (Math.abs(e) < 1e-13 || n2 < 1e-16) break;
            let d = e / n2; const st = Math.abs(d) * Math.sqrt(n2); if (st > 0.2) d *= 0.2 / st;
            x -= d * gx; y -= d * gy;
          }
          return [x, y];
        };
        const bead = s.handle(0.6, 0.75, { color: 'gold', r: 8, constrain: (x, y) => proj(x, y) });
        const cache = memo();
        let info = null;
        v.render(() => {
          const c = cS.value, rho = rS.value;
          const [bx, by] = proj(bead.x, bead.y); bead.x = bx; bead.y = by;
          const B = s.bounds;
          const fam = cache(`${c}|${B.x}|${B.y}`, () => {
            const levels = [];
            for (let L = 0.25; L < 3; L += 0.25) if (Math.abs(L - c) > 0.08) levels.push(contour((x, y) => F(x, y) - L, B.x, B.y, 140, 110));
            return { levels, wire: contour((x, y) => F(x, y) - c, B.x, B.y, 360, 290) };
          });
          for (const L of fam.levels) s.path(L, { color: 'faint', width: 1, alpha: 0.7 });
          s.path(fam.wire, { color: 'accent', width: 3.2 });
          s.dot(0, 0, { r: 4.5, color: 'red', hollow: true });
          s.text('saddle of f (∇f = 0)', 0.16, 0, { color: 'red', size: 11, align: 'left' });
          const [gx, gy] = grad(bx, by), gn = Math.hypot(gx, gy);
          s.circle(bx, by, rho, { color: 'orange', dash: [5, 4], width: 1.5, fill: 'orange', fillAlpha: 0.07 });
          let tx = 1, ty = 0, nx = 0, ny = 1;
          if (gn > 1e-9) { nx = gx / gn; ny = gy / gn; tx = -ny; ty = nx; }
          if (gn > 0.02) {
            s.arrow(bx - tx * 0.42, by - ty * 0.42, bx + tx * 0.42, by + ty * 0.42, { color: 'green', width: 2.2, both: true });
            const L = Math.min(0.55, 0.12 + 0.12 * gn);
            s.arrow(bx, by, bx + nx * L, by + ny * L, { color: 'orange', width: 2.4 });
            s.tex('\\nabla f', bx + nx * L, by + ny * L, { color: 'orange', dx: nx * 14, dy: -ny * 14, size: 14 });
            s.tex('\\delta\\mathbf r', bx + tx * 0.42, by + ty * 0.42, { color: 'green', dx: tx * 16, dy: -ty * 14, size: 14 });
          }
          // arms leaving the window
          let arms = 0, prev = F(bx + rho, by) - c > 0;
          for (let k = 1; k <= 1440; k++) { const a = (TAU * k) / 1440, cur = F(bx + rho * Math.cos(a), by + rho * Math.sin(a)) - c > 0; if (cur !== prev) arms++; prev = cur; }
          // magnified window in tangent/normal coordinates
          const Floc = (xi, ze) => F(bx + rho * (xi * tx + ze * nx), by + rho * (xi * ty + ze * ny)) - c;
          z.circle(0, 0, 1, { color: 'orange', dash: [5, 4], width: 1.5, fill: 'orange', fillAlpha: 0.05 });
          z.line(-1.15, 0, 1.15, 0, { color: 'green', width: 1.2, alpha: 0.7 }); z.line(0, -1.15, 0, 1.15, { color: 'orange', width: 1.2, alpha: 0.7 });
          z.tex('\\xi', 1.12, 0, { color: 'green', dy: -12, size: 15 }); z.tex('\\zeta', 0, 1.12, { color: 'orange', dx: 12, size: 15 });
          const raw = contour(Floc, [-1.05, 1.05], [-1.05, 1.05], 170, 170), inside = [];
          for (let i = 0; i + 1 < raw.length; i += 3) { const a = raw[i], b = raw[i + 1]; if (a && b && Math.hypot(a[0], a[1]) <= 1 && Math.hypot(b[0], b[1]) <= 1) inside.push(a, b, null); }
          // try the graph ζ = g(ξ) by continuation from the bead
          let graphOK = gn > 1e-6, gpts = [[0, 0]];
          if (graphOK) {
            for (const dir of [1, -1]) {
              let ze = 0; const pts = [];
              for (let xi = dir * 0.01; Math.abs(xi) <= 1.0001; xi += dir * 0.01) {
                let ok = false;
                for (let it = 0; it < 30; it++) { const fz = Floc(xi, ze), d = (Floc(xi, ze + 1e-5) - Floc(xi, ze - 1e-5)) / 2e-5; if (Math.abs(d) < 1e-9) break; const st = fz / d; ze -= Math.max(-0.2, Math.min(0.2, st)); if (Math.abs(st) < 1e-11) { ok = true; break; } }
                if (!ok || Math.abs(ze) > 1.3) { if (xi * xi + ze * ze < 1) graphOK = false; break; }
                if (xi * xi + ze * ze > 1) break;
                pts.push([xi, ze]);
              }
              gpts = dir > 0 ? gpts.concat(pts) : pts.reverse().concat(gpts);
            }
          }
          const chart = arms === 2 && graphOK;
          z.path(inside, { color: chart ? 'accent' : 'red', width: 3.2 });
          if (chart) {
            z.path(gpts, { color: 'green', width: 1.6, dash: [6, 4] });
            for (let k = -4; k <= 4; k++) if (k) z.line(k / 5, -0.04, k / 5, 0.04, { color: 'green', width: 1.2 });
            z.corner('a single arc: the graph ζ = g(ξ); ξ is a chart', 'bl', { color: 'green', weight: 600 });
          } else z.corner(gn < 0.05 ? '∇f = 0: crossing arms, no chart' : 'not one graph: shrink the window', 'bl', { color: 'red', weight: 600 });
          z.dot(0, 0, { r: 6, color: 'gold' });
          info = { gn, arms, chart };
        });
        v.legend([['accent', 'the wire (constraint)'], ['green', 'tangent: virtual displacement $\\delta\\mathbf r$'], ['orange', '$\\nabla f$: direction of the constraint force']]);
        v.readout(() => {
          if (!info) return '';
          const { gn, arms, chart } = info;
          const tail = chart
            ? String.raw`one arc: $\xi$ (or arc length) is a generalized coordinate here — one constraint in the plane leaves $2-1 = 1$ degree of freedom`
            : gn < 0.05 ? String.raw`$\nabla f = 0$: the implicit function theorem does not apply, and no window, however small, sees a single arc`
              : 'the wire is smooth here, but the window is too big to see a single graph — shrink it';
          return String.raw`$|\nabla f|$ at the bead $= ${v.fix(gn, 3)}$ · arms leaving the window: ${arms} · ${tail}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.3
    {
      num: '6.3',
      kind: 'Definition',
      name: 'Nonholonomic constraints',
      statement: String.raw`A constraint is **nonholonomic** if it restricts the velocities but cannot be integrated to relations among the coordinates (and time) alone. The standard example is rolling without slipping: a vertical coin of radius $R$ with contact point $(x,y)$, heading $\varphi$ and rolling angle $\psi$ must satisfy
$$\dot x = R\dot\psi\cos\varphi,\qquad \dot y = R\dot\psi\sin\varphi .$$
These two linear conditions on the velocities are not the time derivatives of any relations $f(x,y,\varphi,\psi) = 0$: every configuration of the four-dimensional space $(x,y,\varphi,\psi)$ can be reached from every other. A nonholonomic constraint reduces the number of independent velocities (here from 4 to 2) without reducing the dimension of the configuration space.`,
      idea: String.raw`If the rolling constraints came from relations $f(x,y,\varphi,\psi) = 0$, the rolling angle would be a function of where the coin is and which way it points. It is not: two routes from $A$ to $B$ that arrive with the same position and heading leave rolling angles $\psi = L/R$ that differ by the difference of the path lengths divided by $R$, and an S-shaped manoeuvre shifts the coin sideways although it never slides sideways. (The obstruction is that the allowed motions do not commute: their Lie bracket points in a forbidden direction.) Confine the coin to a straight rail and the constraint *does* integrate: $\psi - x/R$ is constant, a holonomic constraint (6.2).`,
      caption: String.raw`Two coins roll from $A$ to $B$ along the blue and orange routes. Drag $B$, set its heading, and drag the four control points (they slide along the start and end headings) to reshape the routes; tick marks fall every quarter turn of the coin. At every instant a coin moves along its heading (green), never sideways (red) — yet it can arrive displaced sideways, and the two arrive with the same position and heading but different rolling angles (right). Switch on the rail: whatever the coins do, $\psi - x/R$ stays fixed, because the constraint has become holonomic.`,
      deps: ['mech-6.2', 'mech-6.1'],
      refs: ['Goldstein §1.3', 'Tong §2.3'],
      see: ['robot-10.3'],
      tags: ['constraints', 'nonholonomic', 'rolling'],
      viz(v) {
        const R = 0.3, A = [-2.35, -0.75], N = 1000, TR = 7;
        const phB = v.slider('heading at $B$', -180, 180, 0, { step: 1, fmt: deg });
        const rail = v.toggle('confine both coins to a straight rail', false);
        const s = v.stage({ x: [-2.95, 2.95], y: [-1.75, 1.75], equal: true, height: 330, axes: false, weight: 1.75, title: 'top view' });
        const cf = v.stage({ x: [-1.2, 1.2], y: [-2.55, 2.55], equal: true, height: 330, axes: false, weight: 0.6, minWidth: 170, title: 'the coins, face on' });
        let saved = null;
        const Bh = s.handle(2.05, 0.8, { color: 'ink', r: 7, label: 'B', labelPos: 'n', constrain: (x, y) => (rail.value ? [x, A[1]] : [x, y]) });
        const lens = { a1: 1.5, b1: 1.5, a2: 5.2, b2: 4.6 };
        const eB = () => (rail.value ? [1, 0] : [Math.cos(phB.value * DEG), Math.sin(phB.value * DEG)]);
        const H = [['a1', true, 'blue'], ['b1', false, 'blue'], ['a2', true, 'orange'], ['b2', false, 'orange']].map(([key, fromA, col]) => {
          const hd = s.handle(0, 0, { color: col, r: 6, constrain: (x, y) => {
            const P = fromA ? A : [Bh.x, Bh.y], e = fromA ? [1, 0] : eB(), sg = fromA ? 1 : -1;
            const u = Math.max(0.2, Math.min(6, sg * ((x - P[0]) * e[0] + (y - P[1]) * e[1])));
            lens[key] = u; return [P[0] + sg * u * e[0], P[1] + sg * u * e[1]];
          } });
          Object.assign(hd, { key, fromA }); return hd;
        });
        const bez = (P, u) => { const w = 1 - u, a = w * w * w, b = 3 * w * w * u, c = 3 * w * u * u, d = u * u * u; return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]]; };
        /** Sample a route: points, heading (unwrapped), signed rolled distance S (= Σ Δr·heading) and unsigned distance D. */
        const build = (pts, fixedHeading) => {
          const n = pts.length - 1, hd = [], S = [0], D = [0];
          for (let i = 0; i <= n; i++) {
            if (fixedHeading != null) { hd.push(fixedHeading); continue; }
            const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)]; hd.push(Math.atan2(b[1] - a[1], b[0] - a[0]));
          }
          for (let i = 1; i <= n; i++) {
            if (fixedHeading == null) hd[i] = hd[i - 1] + wrap(hd[i] - hd[i - 1]);
            const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], hm = (hd[i] + hd[i - 1]) / 2;
            S.push(S[i - 1] + dx * Math.cos(hm) + dy * Math.sin(hm)); D.push(D[i - 1] + Math.hypot(dx, dy));
          }
          return { pts, hd, S, D, L: S[n], len: D[n] };
        };
        const routes = () => {
          const B = [Bh.x, Bh.y];
          if (rail.value) {
            const lin = (p, q, n) => Array.from({ length: n + 1 }, (_, i) => [p[0] + ((q[0] - p[0]) * i) / n, p[1] + ((q[1] - p[1]) * i) / n]);
            const over = [B[0] + 0.85, A[1]];
            const r2 = lin(A, over, 750).concat(lin(over, B, 250).slice(1));
            return [build(lin(A, B, N), 0), build(r2, 0)];
          }
          const e = eB(), mk = (a, b) => { const P = [A, [A[0] + a, A[1]], [B[0] - b * e[0], B[1] - b * e[1]], B]; return build(Array.from({ length: N + 1 }, (_, i) => bez(P, i / N))); };
          return [mk(lens.a1, lens.b1), mk(lens.a2, lens.b2)];
        };
        const posAt = (r, frac) => { // constant speed along the route
          const target = frac * r.len; let lo = 0, hi = r.D.length - 1;
          while (hi - lo > 1) { const m = (lo + hi) >> 1; if (r.D[m] < target) lo = m; else hi = m; }
          return hi;
        };
        let cur = null;
        v.animate((t) => {
          if (rail.value && !saved) { saved = [Bh.x, Bh.y]; Bh.y = A[1]; }
          if (!rail.value && saved) { Bh.x = saved[0]; Bh.y = saved[1]; saved = null; }
          for (const hd of H) {
            hd.visible = !rail.value;
            const P = hd.fromA ? A : [Bh.x, Bh.y], e = hd.fromA ? [1, 0] : eB(), sg = hd.fromA ? 1 : -1;
            hd.x = P[0] + sg * lens[hd.key] * e[0]; hd.y = P[1] + sg * lens[hd.key] * e[1];
          }
          const RT = routes(), frac = Math.min(1, t / TR), cols = ['blue', 'orange'];
          if (rail.value) { s.line(-3.2, A[1] - 0.06, 3.2, A[1] - 0.06, { color: 'muted', width: 1.5 }); s.line(-3.2, A[1] + 0.06, 3.2, A[1] + 0.06, { color: 'muted', width: 1.5 }); }
          else for (const hd of H) s.line(hd.fromA ? A[0] : Bh.x, hd.fromA ? A[1] : Bh.y, hd.x, hd.y, { color: hd.color, width: 1, dash: [3, 4], alpha: 0.6 });
          RT.forEach((r, j) => {
            s.path(r.pts, { color: cols[j], width: 2.2, alpha: 0.85 });
            const q = (Math.PI / 2) * R; let next = q;
            for (let i = 1; i < r.pts.length; i++) {
              if (Math.abs(r.S[i]) >= next) {
                next += q; const p = r.pts[i], hh = r.hd[i], nx = -Math.sin(hh) * 0.06, ny = Math.cos(hh) * 0.06;
                s.line(p[0] - nx, p[1] - ny, p[0] + nx, p[1] + ny, { color: cols[j], width: 1.4 });
              }
            }
          });
          // start/end poses
          s.arrow(A[0] - 0.35, A[1], A[0] + 0.05, A[1], { color: 'ink', width: 2, head: 8 }); s.dot(A[0], A[1], { r: 5, color: 'ink' });
          s.tex('A', A[0], A[1], { color: 'ink', dx: -10, dy: 14 });
          const e = eB(); s.arrow(Bh.x - 0.35 * e[0], Bh.y - 0.35 * e[1], Bh.x + 0.05 * e[0], Bh.y + 0.05 * e[1], { color: 'ink', width: 2, head: 8 });
          cur = RT.map((r, j) => [r, j]).reverse().map(([r, j]) => {
            const i = posAt(r, frac), p = r.pts[i], hh = r.hd[i], c = Math.cos(hh), sn = Math.sin(hh);
            s.line(p[0] - R * c, p[1] - R * sn, p[0] + R * c, p[1] + R * sn, { color: cols[j], width: j ? 11 : 5, alpha: 0.95, cap: 'butt' });
            if (frac < 1) {
              s.arrow(p[0], p[1], p[0] + 0.55 * c, p[1] + 0.55 * sn, { color: 'green', width: 2, head: 7 });
              const fx = p[0] - 0.4 * sn, fy = p[1] + 0.4 * c;
              s.line(p[0], p[1], fx, fy, { color: 'red', width: 1.6, dash: [3, 3] });
              s.text('×', fx, fy, { color: 'red', size: 15, align: 'center', weight: 700 });
            }
            return { psi: r.S[i] / R, psiEnd: r.L / R, len: r.len, L: r.L, p, i, r };
          }).reverse();
          // coin faces
          cur.forEach((c, j) => {
            const cy = j === 0 ? 1.25 : -1.25, a = Math.PI / 2 - c.psi;
            cf.circle(0, cy, 0.9, { color: cols[j], width: 2.4, fill: cols[j], fillAlpha: 0.12 });
            for (let k = 0; k < 4; k++) { const b = a + (k * Math.PI) / 2; cf.line(0.78 * Math.cos(b), cy + 0.78 * Math.sin(b), 0.9 * Math.cos(b), cy + 0.9 * Math.sin(b), { color: cols[j], width: 1.2 }); }
            cf.line(0, cy, 0.9 * Math.cos(a), cy + 0.9 * Math.sin(a), { color: 'ink', width: 2.4 });
            cf.dot(0.9 * Math.cos(a), cy + 0.9 * Math.sin(a), { r: 5, color: 'gold' });
            cf.dot(0, cy, { r: 3, color: 'ink' });
            cf.tex(String.raw`\psi_${j + 1} = ${v.fix(c.psi, 2)}`, 0, cy - 1.07, { color: cols[j], size: 13 });
          });
        }, { period: TR + 2, still: TR + 0.5 });
        v.legend([['blue', 'route 1'], ['orange', 'route 2'], ['green', 'allowed: along the heading'], ['red', 'forbidden: sideways', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const [c1, c2] = cur;
          if (rail.value) {
            const res = cur.map((c) => Math.abs(c.psi - (c.p[0] - A[0]) / R));
            return String.raw`on the rail: route 1 rolls $${v.fix(c1.len, 2)}$, route 2 overshoots and rolls back ($${v.fix(c2.len, 2)}$ in all) · final rolling angles $\psi_1 = ${v.fix(c1.psiEnd, 3)}$, $\psi_2 = ${v.fix(c2.psiEnd, 3)}$ · along both, $|\psi - (x-x_A)/R| \le ${v.sci(Math.max(res[0], res[1], 1e-15), 1)}$: the constraint integrates to a relation among the coordinates — holonomic`;
          }
          const d = wrap(c1.psiEnd - c2.psiEnd), side = Bh.y - A[1];
          return String.raw`route 1: length $L_1 = ${v.fix(c1.len, 3)}$, rolling angle at $B$: $\psi_1 = L_1/R = ${v.fix(c1.psiEnd, 2)}$ · route 2: $L_2 = ${v.fix(c2.len, 3)}$, $\psi_2 = ${v.fix(c2.psiEnd, 2)}$ · same final $(x, y, \varphi)$, yet $\psi_1 - \psi_2 \equiv ${v.fix(d, 2)} \pmod{2\pi}$: $\psi$ is not a function of position and heading, so no relation $f(x,y,\varphi,\psi) = 0$ exists · $B$ is ${v.fix(Math.abs(side), 2)} to the ${side >= 0 ? 'left' : 'right'} of the start line, reached without sliding sideways`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.4
    {
      num: '6.4',
      kind: 'Principle',
      name: 'D’Alembert’s principle of virtual work',
      statement: String.raw`Split the force on each particle of a system into an applied part and a constraint part, $\mathbf F_i = \mathbf F_i^{(a)} + \mathbf R_i$. A **virtual displacement** $\delta\mathbf r_i$ is an infinitesimal change of configuration compatible with the constraints frozen at the instant $t$. If the constraint forces do no total virtual work, $\sum_i\mathbf R_i\cdot\delta\mathbf r_i = 0$ (ideal constraints: smooth surfaces and wires, rigid rods, rolling without slipping), then the motion satisfies
$$\sum_i\big(\mathbf F_i^{(a)} - m_i\ddot{\mathbf r}_i\big)\cdot\delta\mathbf r_i = 0\qquad\text{for every virtual displacement},$$
an equation from which the unknown constraint forces have disappeared. In equilibrium ($\ddot{\mathbf r}_i = 0$) it reduces to the principle of virtual work $\sum_i\mathbf F_i^{(a)}\cdot\delta\mathbf r_i = 0$.`,
      scope: String.raw`Holds for ideal (workless) constraints. Sliding friction does virtual work, so it must be counted among the applied forces, with its value supplied by a friction law.`,
      idea: String.raw`Newton’s second law (mech-1.6) gives $\mathbf F_i^{(a)} + \mathbf R_i - m_i\ddot{\mathbf r}_i = 0$ for each particle; dot with $\delta\mathbf r_i$ and add. The constraint forces drop out precisely because they are normal to the set of allowed configurations (mech-1.14): a smooth wire pushes perpendicular to itself, and a virtual displacement runs along it (6.2). Writing the $\delta\mathbf r_i$ through independent variations $\delta q_j$ of generalized coordinates then gives one equation per $\delta q_j$ — this is how Lagrange’s equations (6.6) are derived.`,
      caption: String.raw`A bead slides on a smooth wire under gravity, simulated from Newton’s law with the normal force solved for at every step. At the bead: weight (purple), normal force $\mathbf N$ (orange), d’Alembert’s inertial force $-m\ddot{\mathbf r}$ (dashed) and a virtual displacement $\delta\mathbf r$ along the wire (green; resize or reverse it with the slider). The bars give the virtual work of each: $\mathbf N\cdot\delta\mathbf r = 0$, so $(\mathbf F^{(a)} - m\ddot{\mathbf r})\cdot\delta\mathbf r = 0$ too, with $\ddot{\mathbf r}$ measured from the simulated velocities. Switch on friction: the reaction now has a part along the wire, and the d’Alembert sum (bottom plot) is no longer zero unless friction is moved to the applied side.`,
      deps: ['mech-6.2', 'mech-1.14', 'mech-1.6'],
      refs: ['Goldstein §1.4', 'Arnold §21'],
      tags: ['virtual work', 'constraint forces'],
      viz(v) {
        const m = 1, T = 14, DT = 0.001, EV = 2, K = 0.085;
        const h = (x) => 0.14 * x * x + 0.3 * Math.sin(1.6 * x + 0.5);
        const hp = (x) => 0.28 * x + 0.48 * Math.cos(1.6 * x + 0.5);
        const hpp = (x) => 0.28 - 0.768 * Math.sin(1.6 * x + 0.5);
        const x0 = v.slider('release point $x_0$', -2.8, 2.8, -2.5, { step: 0.05, onChange: () => v.restart() });
        const fr = v.toggle('friction on the wire', false);
        const mu = v.slider('friction coefficient $\\mu$', 0.02, 0.4, 0.12, { step: 0.01, onChange: () => v.restart() });
        const dS = v.slider('virtual displacement $\\delta s$ (m)', -1, 1, 0.7, { step: 0.05 });
        const s = v.stage({ x: [-3.2, 3.2], y: [-1.05, 2.0], equal: true, height: 290, axes: false, weight: 1.6, title: 'bead on a wire: forces at the bead' });
        const b = v.stage({ x: [0, 5], y: [-12, 12], height: 290, axes: false, weight: 0.95, title: 'virtual work along $\\delta\\mathbf r$ (J)' });
        const p = v.stage({ x: [0, T], y: [-4, 4], height: 170, axes: 'box', full: true, xlabel: 't (s)', title: 'per unit $\\delta s$: d’Alembert sum $(\\mathbf F^{(a)} - m\\ddot{\\mathbf r})\\cdot\\hat\\tau$ and $\\mathbf N\\cdot\\hat\\tau$ (N)' });
        const forces = (st, useF, muv) => {
          const [x, , vx, vy] = st, gx = -hp(x), n2 = gx * gx + 1, W = [0, -m * G];
          const lam = (m * hpp(x) * vx * vx - (gx * W[0] + W[1])) / n2, N = [lam * gx, lam];
          let f = [0, 0];
          if (useF) { const sp = Math.hypot(vx, vy), k = (muv * Math.abs(lam) * Math.sqrt(n2)) / Math.sqrt(sp * sp + 1e-4); f = [-k * vx, -k * vy]; }
          return { W, N, f, a: [(W[0] + N[0] + f[0]) / m, (W[1] + N[1] + f[1]) / m] };
        };
        const cache = memo();
        const sim = () => cache(`${x0.value}|${fr.value}|${mu.value}`, () => {
          const useF = fr.value, mv = mu.value;
          const S = integrate((t, st) => { const F = forces(st, useF, mv); return [st[2], st[3], F.a[0], F.a[1]]; }, [x0.value, h(x0.value), 0, 0], T, DT, EV);
          const n = S.t.length, res = [], nt = [], aM = [];
          const ax = deriv5(S.y.map((y) => y[2]), S.dt), ay = deriv5(S.y.map((y) => y[3]), S.dt); // measured from the velocities
          for (let k = 0; k < n; k++) {
            const a = [ax[k], ay[k]];
            const x = S.y[k][0], tl = Math.hypot(1, hp(x)), tau = [1 / tl, hp(x) / tl], F = forces(S.y[k], useF, mv);
            aM.push(a);
            res.push((F.W[0] - m * a[0]) * tau[0] + (F.W[1] - m * a[1]) * tau[1]);
            nt.push(F.N[0] * tau[0] + F.N[1] * tau[1]);
          }
          let drift = 0; for (const y of S.y) drift = Math.max(drift, Math.abs(y[1] - h(y[0])));
          return { S, res, nt, aM, drift, useF, mv };
        });
        let now = null;
        v.animate((t) => {
          const R = sim(), k = frameAt(R.S, t), st = R.S.y[k], [x, y] = st;
          const F = forces(st, R.useF, R.mv), a = R.aM[k], tl = Math.hypot(1, hp(x)), tau = [1 / tl, hp(x) / tl], ds = dS.value;
          s.fn(h, { domain: [-3.1, 3.1], color: 'muted', width: 4 });
          s.fn(h, { domain: [-3.1, 3.1], color: 'panel', width: 1.2, alpha: 0.8 });
          const arr = (vec, col, lab, o = {}) => {
            const L = Math.hypot(vec[0], vec[1]); if (L < 1e-6) return;
            s.arrow(x, y, x + K * vec[0], y + K * vec[1], { color: col, width: 2.4, head: 8, ...o });
            if (lab && K * L > 0.32) s.tex(lab, x + K * vec[0], y + K * vec[1], { color: col, size: 13, dx: (12 * vec[0]) / L, dy: (-12 * vec[1]) / L });
          };
          arr(F.W, 'purple', 'm\\mathbf g');
          arr(F.N, 'orange', '\\mathbf N');
          if (R.useF) arr(F.f, 'red', '\\mathbf f');
          arr([-m * a[0], -m * a[1]], 'ink', '-m\\ddot{\\mathbf r}', { dash: [5, 4], width: 1.8 });
          if (Math.abs(ds) > 0.01) {
            s.arrow(x, y, x + 0.8 * ds * tau[0], y + 0.8 * ds * tau[1], { color: 'green', width: 3, head: 9 });
            s.tex('\\delta\\mathbf r', x + 0.8 * ds * tau[0], y + 0.8 * ds * tau[1], { color: 'green', size: 13, dx: 0, dy: 15 });
          }
          s.dot(x, y, { r: 8, color: 'gold' });
          // bars
          const dr = [ds * tau[0], ds * tau[1]], dot = (u) => u[0] * dr[0] + u[1] * dr[1];
          const Wg = dot(F.W), Win = -m * dot(a), WN = dot(F.N), Wf = dot(F.f), sum = Wg + Win;
          const ok = Math.abs(sum) < 0.02;
          const bars = [['purple', '\\mathbf F^{(a)}\\!\\cdot\\delta\\mathbf r', Wg], ['ink', '-m\\ddot{\\mathbf r}\\cdot\\delta\\mathbf r', Win], [ok ? 'green' : 'red', '\\text{sum}', sum], ['orange', '\\mathbf N\\cdot\\delta\\mathbf r', WN], ['red', '\\mathbf f\\cdot\\delta\\mathbf r', Wf]];
          b.line(0, 0, 5, 0, { color: 'muted', width: 1 });
          b.vband(2.05, 2.95, { color: ok ? 'green' : 'red', alpha: 0.07 });
          bars.forEach(([c, lab, val], i) => {
            if (Math.abs(val) > 1e-9) b.rect(i + 0.22, 0, i + 0.78, Math.max(-11.5, Math.min(11.5, val)), { fill: c, fillAlpha: 0.55, color: c, width: 1.2 });
            b.tex(lab, i + 0.5, -11.3, { color: c, size: 11, baseline: 'bottom' });
            b.text(Math.abs(val) < 0.005 ? '0.00' : v.fix(val, 2), i + 0.5, val >= 0 ? Math.min(val, 9.5) + 0.6 : Math.max(val, -9) - 0.6, { color: c, size: 10.5, align: 'center', baseline: val >= 0 ? 'bottom' : 'top' });
          });
          // time plot
          p.hline(0, { color: 'faint' });
          series(p, R.S.t, R.nt, k, { color: 'orange', width: 1.6 });
          series(p, R.S.t, R.res, k, { color: R.useF ? 'red' : 'green', width: 2.2 });
          p.vline(R.S.t[k], { color: 'gold', width: 1.2 });
          now = { WN, Wf, sum, Wg, k };
        }, { period: T, still: 1.1 });
        v.legend([['purple', 'weight $m\\mathbf g$ (applied)'], ['orange', 'normal force $\\mathbf N$'], ['red', 'friction $\\mathbf f$'], ['ink', 'inertial force $-m\\ddot{\\mathbf r}$', { dash: true }], ['green', 'virtual displacement / d’Alembert sum']]);
        v.readout(() => {
          if (!now) return '';
          const R = sim();
          let mx = 0, mn = 0; for (let j = 2; j <= Math.max(2, now.k); j++) { mx = Math.max(mx, Math.abs(R.res[j])); mn = Math.max(mn, Math.abs(R.nt[j])); }
          const z4 = (x) => v.fix(Math.abs(x) < 5e-5 ? 0 : x, 4);
          const head = String.raw`$\mathbf N\cdot\delta\mathbf r = ${z4(now.WN)}$ J (largest $|\mathbf N\cdot\hat\tau|$ so far $${v.sci(Math.max(mn, 1e-16), 1)}$ N) · $(\mathbf F^{(a)} - m\ddot{\mathbf r})\cdot\delta\mathbf r = ${z4(now.sum)}$ J`;
          return R.useF
            ? head + String.raw` · friction: $\mathbf f\cdot\delta\mathbf r = ${v.fix(now.Wf, 3)}$ J $\ne 0$, so the d’Alembert sum without friction fails (largest residual ${v.fix(mx, 2)} N per unit $\delta s$); with $\mathbf f$ counted as applied it is $${z4(now.sum + now.Wf)}$`
            : head + String.raw` — zero to finite-difference accuracy (largest $${v.sci(Math.max(mx, 1e-16), 1)}$ N per unit $\delta s$): the workless normal force has dropped out`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.5
    {
      num: '6.5',
      kind: 'Principle',
      name: 'Hamilton’s principle of stationary action',
      statement: String.raw`Let a system with Lagrangian $L(q,\dot q,t) = T - U$ (kinetic minus potential energy, in any generalized coordinates) move from configuration $q_a$ at time $t_a$ to $q_b$ at time $t_b$. Among all smooth paths $q(t)$ with these endpoints, the actual motion makes the **action**
$$S[q] = \int_{t_a}^{t_b} L\big(q(t),\dot q(t),t\big)\,dt$$
stationary: for every variation $\eta(t)$ with $\eta(t_a) = \eta(t_b) = 0$,
$$S[q + \varepsilon\eta] - S[q] = O(\varepsilon^2)\qquad(\varepsilon\to 0).$$
Conversely, a path with this property satisfies the equations of motion. For short enough time intervals the actual path is a minimum of $S$; over longer ones it is in general only stationary (a saddle), once a conjugate point has been passed.`,
      scope: String.raw`Holonomic systems whose forces derive from a potential, possibly time- or velocity-dependent (6.14); dissipative forces need extra terms (6.15).`,
      idea: String.raw`To first order, $S[q+\varepsilon\eta]-S[q] = \varepsilon\int(\partial_q L\,\eta + \partial_{\dot q}L\,\dot\eta)\,dt$; integrating by parts with $\eta$ vanishing at the ends turns this into $\varepsilon\int\big(\partial_q L - \tfrac{d}{dt}\partial_{\dot q}L\big)\eta\,dt$, which vanishes for every $\eta$ exactly when the Euler–Lagrange equation holds (mech-5.4). For $L = \tfrac12 m\dot q^2 - U(q)$ that equation is $m\ddot q = -U'(q)$, Newton’s law for a conservative force (mech-3.3). The second-order term $\tfrac{\varepsilon^2}{2}\int(m\dot\eta^2 - U''\eta^2)\,dt$ is positive for short times, where $\dot\eta$ dominates; for a spring it turns negative for $\eta = \sin(\pi t/T)$ once $T$ exceeds half a period — the conjugate point of mech-5.14.`,
      caption: String.raw`Green: the true path $q(t)$ between fixed endpoints. Drag the three gold handles to deform it into $q+\eta$; the action of the whole family $q + \varepsilon\eta$ is plotted against $\varepsilon$ (bottom left), with the second-order prediction dashed. The curve is flat at $\varepsilon = 0$: the change is of second order, and the log–log plot (bottom right) shows slope 2. Switch to a *wrong* base path (red) and the slope becomes 1 — a first-order change. For the spring, stretch the duration past half a period ($T > 0.5$ s): the action now *decreases* for some deformations, so the true path is a saddle, not a minimum.`,
      deps: ['mech-5.4', 'mech-3.3', 'mech-6.1'],
      refs: ['Goldstein §2.1', 'Taylor §7.1'],
      credit: 'Hamilton, 1834',
      tags: ['action', 'variational principle'],
      viz(v) {
        const NI = 400, W2 = 4 * Math.PI * Math.PI;
        const SYS = {
          ball: { U: (q) => G * q, dU: (q, d) => G * d, U1: () => G, U2: () => 0, eta: [0.6, 0.85, 0.35] },
          spring: { U: (q) => 0.5 * W2 * q * q, dU: (q, d) => W2 * d * (q + 0.5 * d), U1: (q) => W2 * q, U2: () => W2, eta: [0.3, 0.4, 0.18] },
          pend: { U: (q) => W2 * (1 - Math.cos(q)), dU: (q, d) => 2 * W2 * Math.sin(q + d / 2) * Math.sin(d / 2), U1: (q) => W2 * Math.sin(q), U2: (q) => W2 * Math.cos(q), eta: [0.5, 0.7, 0.3] },
        };
        const sys = v.select('system', [{ value: 'ball', label: 'thrown ball' }, { value: 'spring', label: 'mass on a spring' }, { value: 'pend', label: 'pendulum, large swing' }], 'ball', { onChange: (k) => { eta = SYS[k].eta.slice(); } });
        const TT = v.slider('duration $T$ (s)', 0.2, 2, 1.2, { step: 0.01 });
        const wrong = v.toggle('start from a wrong path', false);
        let eta = SYS.ball.eta.slice();
        const sq = v.stage({ x: [0, 1.2], y: [-1, 2], height: 230, axes: 'box', full: true, xlabel: 't (s)', ylabel: 'q', title: 'paths with fixed endpoints' });
        const sS = v.stage({ x: [-1.6, 1.6], y: [-0.1, 1], height: 230, axes: 'box', xlabel: 'ε', title: 'action change $\\Delta S(\\varepsilon) = S[q+\\varepsilon\\eta]-S[q]$' });
        const sL = v.stage({ x: [1e-3, 1.6], y: [1e-8, 10], xlog: true, ylog: true, height: 230, axes: 'box', xlabel: 'ε', title: '$|\\Delta S|$ against $\\varepsilon$, log–log' });
        const hs = [1, 2, 3].map((j) => sq.handle(0, 0, { color: 'gold', r: 7, constrain: (x, y) => [hs ? hs[j - 1].x : x, y], onDrag: (h) => { eta[j - 1] = h.y - base().b[(j * NI) / 4]; } }));
        const cache = memo();
        /** True path and base path on the Simpson grid. */
        const base = () => cache(`${sys.value}|${TT.value}|${wrong.value}`, () => {
          const T = TT.value, k = sys.value, ts = [], q = [], qd = [];
          for (let i = 0; i <= NI; i++) ts.push((T * i) / NI);
          if (k === 'ball') for (const t of ts) { q.push(0.5 * G * t * (T - t)); qd.push(0.5 * G * (T - 2 * t)); }
          else if (k === 'spring') for (const t of ts) { q.push(Math.cos(TAU * t)); qd.push(-TAU * Math.sin(TAU * t)); }
          else {
            let y = [2.6, 0]; const f = (t, s) => [s[1], -W2 * Math.sin(s[0])], h = T / NI / 4;
            q.push(y[0]); qd.push(y[1]);
            for (let i = 0; i < NI; i++) { for (let j = 0; j < 4; j++) y = rk4step(f, 0, y, h); q.push(y[0]); qd.push(y[1]); }
          }
          let b = q, bd = qd;
          if (wrong.value) {
            if (k === 'ball') { b = q.map((x) => x / 2); bd = qd.map((x) => x / 2); }
            else { const q0 = q[0], q1 = q[NI]; b = ts.map((t) => q0 + ((q1 - q0) * t) / T); bd = ts.map(() => (q1 - q0) / T); }
          }
          return { T, ts, q, qd, b, bd };
        });
        /** η(t) = Σ c_k sin(kπt/T) through the three handle offsets. */
        const etaFn = () => {
          const S = [1, 2, 3].map((j) => [1, 2, 3].map((k) => Math.sin((k * Math.PI * j) / 4)));
          const c = solve(S, eta), T = TT.value;
          return { f: (t) => c.reduce((s, ck, k) => s + ck * Math.sin(((k + 1) * Math.PI * t) / T), 0), d: (t) => c.reduce((s, ck, k) => s + ck * (((k + 1) * Math.PI) / T) * Math.cos(((k + 1) * Math.PI * t) / T), 0) };
        };
        let cur = null;
        v.render(() => {
          const B = base(), Sy = SYS[sys.value], T = B.T, E = etaFn();
          const et = B.ts.map(E.f), etd = B.ts.map(E.d), w = (i) => ((i === 0 || i === NI ? 1 : i % 2 ? 4 : 2) * T) / (3 * NI);
          const dS = (eps) => { let s = 0; for (let i = 0; i <= NI; i++) s += w(i) * (eps * B.bd[i] * etd[i] + 0.5 * eps * eps * etd[i] * etd[i] - Sy.dU(B.b[i], eps * et[i])); return s; };
          let S0 = 0, d1 = 0, d2 = 0;
          for (let i = 0; i <= NI; i++) { S0 += w(i) * (0.5 * B.bd[i] ** 2 - Sy.U(B.b[i])); d1 += w(i) * (B.bd[i] * etd[i] - Sy.U1(B.b[i]) * et[i]); d2 += w(i) * 0.5 * (etd[i] ** 2 - Sy.U2(B.b[i]) * et[i] ** 2); }
          // q–t panel
          const pert = B.b.map((x, i) => x + et[i]);
          const [lo, hi] = span([B.q, B.b, pert], 0.12, 0.6);
          sq.setView([-0.03 * T, 1.06 * T], [lo, hi]);
          hs.forEach((h, j) => { h.x = ((j + 1) * T) / 4; h.y = B.b[((j + 1) * NI) / 4] + eta[j]; });
          const P = (arr) => arr.map((y, i) => [B.ts[i], y]);
          sq.poly(P(B.b).concat(P(pert).reverse()), { fill: 'gold', fillAlpha: 0.1, stroke: false });
          sq.path(P(B.q), { color: 'green', width: wrong.value ? 1.6 : 2.8, dash: wrong.value ? [6, 4] : null });
          if (wrong.value) sq.path(P(B.b), { color: 'red', width: 2.6 });
          sq.path(P(pert), { color: 'gold', width: 2.4 });
          sq.dot(0, B.b[0], { r: 5, color: 'ink' }); sq.dot(T, B.b[NI], { r: 5, color: 'ink' });
          // ΔS(ε)
          const es = v.M.linspace(-1.6, 1.6, 161), ys = es.map(dS), pr = es.map((e) => e * d1 + e * e * d2);
          const [l2, h2] = span([ys, pr, [0]], 0.1, 1e-6);
          sS.setView(null, [l2, h2]);
          sS.hline(0, { color: 'faint' }); sS.vline(0, { color: 'faint' });
          if (Math.abs(d1) > 1e-6) sS.line(-1.6, -1.6 * d1, 1.6, 1.6 * d1, { color: 'muted', width: 1, dash: [3, 3] });
          sS.path(es.map((e, i) => [e, ys[i]]), { color: 'gold', width: 2.8 });
          sS.path(es.map((e, i) => [e, pr[i]]), { color: 'purple', width: 1.6, dash: [6, 4] });
          sS.dot(0, 0, { r: 5, color: wrong.value ? 'red' : 'green' });
          const one = dS(1), up = dS(1.05) > dS(0.95); sS.dot(1, one, { r: 5, color: 'gold', label: 'your path', labelPos: up ? 'se' : 'ne', labelColor: 'gold', math: false });
          // log–log
          const el = v.M.linspace(-3, Math.log10(1.6), 70).map((u) => 10 ** u), yl = el.map((e) => Math.abs(dS(e)));
          let ymin = Infinity, ymax = 0; for (const y of yl) if (y > 0) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
          if (!(ymax > 0)) { ymin = 1e-12; ymax = 1; }
          const lo3 = 10 ** Math.floor(Math.log10(ymin) - 0.3), hi3 = 10 ** Math.ceil(Math.log10(ymax) + 0.3);
          sL.setView(null, [lo3, hi3]);
          const anchor = (yl[0] || 1e-9) / 4;
          for (const [pw, lab] of [[1, 'slope 1'], [2, 'slope 2']]) {
            const g = (e) => anchor * (e / el[0]) ** pw;
            sL.path(el.map((e) => [e, g(e)]), { color: 'faint', width: 1.2, dash: [4, 4] });
            const ex = 10 ** (-1.6 + (pw - 1) * 0.5); if (g(ex) > lo3 * 2 && g(ex) < hi3 / 2) sL.text(lab, ex, g(ex), { color: 'muted', size: 10.5, dy: 10 });
          }
          sL.path(el.map((e, i) => [e, yl[i]]), { color: 'gold', width: 2.6 });
          cur = { S0, one, d1, d2, T, slope: Math.log(yl[20] / yl[0]) / Math.log(el[20] / el[0]) };
        });
        v.legend([['green', 'true path'], ['red', 'wrong base path'], ['gold', 'deformed path $q+\\eta$ / $\\Delta S$'], ['purple', 'prediction $\\varepsilon\\,\\delta S + \\varepsilon^2\\delta^2 S$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { S0, one, d1, d2, T, slope } = cur;
          let s = String.raw`$S[q] = ${v.fix(S0, 4)}$ J·s · $\Delta S$ for your path $= ${v.fix(one, 4)}$ · first variation $\delta S = ${v.sci(Math.abs(d1) < 1e-11 ? 0 : d1, 3)}$ · second variation $\tfrac12\int(\dot\eta^2 - U''\eta^2)\,dt = ${v.fix(d2, 4)}$ · small-$\varepsilon$ slope on the log–log plot: ${v.fix(slope, 2)}`;
          if (sys.value === 'spring' && !wrong.value) {
            const m1 = (T / 4) * ((Math.PI * Math.PI) / (T * T) - W2);
            s += m1 < 0 ? String.raw` · $T$ exceeds half a period (0.5 s): for $\eta = \sin(\pi t/T)$ the second variation is $${v.fix(m1, 3)} < 0$ — the true path is a saddle of $S$` : String.raw` · $T < 0.5$ s: every deformation raises $S$ (a minimum)`;
          }
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.6
    {
      num: '6.6',
      kind: 'Theorem',
      name: 'Lagrange’s equations',
      statement: String.raw`Let a system of particles be subject to ideal holonomic constraints (6.2, 6.4), possibly time-dependent, and described by generalized coordinates $q_1,\dots,q_n$, and let the applied forces derive from a potential $U(q,t)$. With $L(q,\dot q,t) = T - U$, where the kinetic energy $T$ is expressed through the $q_j$ and $\dot q_j$, the motion satisfies
$$\frac{d}{dt}\frac{\partial L}{\partial\dot q_j} - \frac{\partial L}{\partial q_j} = 0,\qquad j = 1,\dots,n:$$
$n$ second-order ODEs with no constraint forces in them. For applied forces with generalized components $Q_j = \sum_i\mathbf F_i^{(a)}\cdot\partial\mathbf r_i/\partial q_j$ the equations read $\tfrac{d}{dt}\,\partial T/\partial\dot q_j - \partial T/\partial q_j = Q_j$.`,
      idea: String.raw`Two routes lead here. From d’Alembert’s principle (6.4): write $\delta\mathbf r_i = \sum_j(\partial\mathbf r_i/\partial q_j)\,\delta q_j$, use $\partial\dot{\mathbf r}_i/\partial\dot q_j = \partial\mathbf r_i/\partial q_j$ to recognise $\sum_i m_i\ddot{\mathbf r}_i\cdot\partial\mathbf r_i/\partial q_j$ as $\tfrac{d}{dt}\partial T/\partial\dot q_j - \partial T/\partial q_j$, and use the independence of the $\delta q_j$. From Hamilton’s principle (6.5): the Euler–Lagrange equations of the action are exactly these. Either way the workless constraint forces never appear — and Newton’s law (mech-1.6) in Cartesian coordinates, with the constraint forces solved for as unknowns, must give the same motion.`,
      caption: String.raw`Pick a system. Left: Newton’s second law in Cartesian coordinates, with the constraint forces (rod tensions, rope tension) solved for at every step and drawn as arrows. Right: Lagrange’s equations in generalized coordinates (angles, or rope length and angle), with no constraint force anywhere. Both are integrated by RK4 with the same step. Bottom: the distance between the two predicted positions (log scale) is the integrator’s own truncation error — halve the step and it drops sixteenfold, as it must for a fourth-order method — and grows only as fast as the dynamics amplifies any tiny difference; the Newtonian run’s constraint error stays tiny as well.`,
      deps: ['mech-6.5', 'mech-6.4', 'mech-1.6'],
      refs: ['Taylor §7.3', 'Goldstein §2.3'],
      credit: 'Lagrange, 1788',
      tags: ['Lagrangian', 'equations of motion'],
      viz(v) {
        const T = 20, KF = 0.03, FR = 0.008;
        const MU = 1.2, PX = 0.4, LT = 2.1, TH = 60 * DEG; // swinging Atwood: mass ratio, pulley offset, rope length, start angle
        const AS = 0.15, OM = 2.8, D1 = 90 * DEG, D2 = 0; // shaken support: amplitude, frequency; double pendulum start
        const sysSel = v.select('system', [{ value: 'dp', label: 'double pendulum' }, { value: 'sam', label: 'swinging Atwood machine' }, { value: 'shake', label: 'pendulum on a shaken support' }], 'dp');
        const dtS = v.select('RK4 step', [{ value: 0.004, label: '4 ms' }, { value: 0.002, label: '2 ms' }, { value: 0.001, label: '1 ms' }], 0.002);
        const sN = v.stage({ x: [-2.2, 2.2], y: [-2.3, 0.6], equal: true, height: 290, axes: false, title: 'Newton: Cartesian coordinates + constraint forces' });
        const sL = v.stage({ x: [-2.2, 2.2], y: [-2.3, 0.6], equal: true, height: 290, axes: false, title: 'Lagrange: generalized coordinates only' });
        const sD = v.stage({ x: [0, T], y: [1e-16, 1], ylog: true, height: 180, axes: 'box', full: true, xlabel: 't (s)', title: 'distance between the Newtonian and Lagrangian positions, and the Newtonian constraint error' });
        const SYS = {
          dp: {
            view: [[-2.2, 2.2], [-2.3, 0.5]],
            lag: { f: dpRates(1, 1, 1, 1), y0: [D1, D2, 0, 0] },
            pos: (y) => { const p1 = [Math.sin(y[0]), -Math.cos(y[0])]; return [p1, [p1[0] + Math.sin(y[1]), p1[1] - Math.cos(y[1])]]; },
            newt: {
              y0: () => { const p1 = [Math.sin(D1), -Math.cos(D1)], p2 = [p1[0] + Math.sin(D2), p1[1] - Math.cos(D2)]; return [...p1, ...p2, 0, 0, 0, 0]; },
              lam: (s) => {
                const [x1, y1, x2, y2, u1, w1, u2, w2] = s, dx = x2 - x1, dy = y2 - y1, du = u2 - u1, dw = w2 - w1;
                const a = x1 * x1 + y1 * y1, bb = -(x1 * dx + y1 * dy), d = 2 * (dx * dx + dy * dy), r1 = u1 * u1 + w1 * w1 - G * y1, r2 = du * du + dw * dw, det = a * d - bb * bb;
                return [(r1 * d - bb * r2) / det, (a * r2 - bb * r1) / det];
              },
              f(t, s) {
                const [l1, l2] = this.lam(s), [x1, y1, x2, y2, u1, w1, u2, w2] = s, dx = x2 - x1, dy = y2 - y1;
                return [u1, w1, u2, w2, -l1 * x1 + l2 * dx, -G - l1 * y1 + l2 * dy, -l2 * dx, -G - l2 * dy];
              },
              pos: (s) => [[s[0], s[1]], [s[2], s[3]]],
              err: (s) => Math.max(Math.abs(Math.hypot(s[0], s[1]) - 1), Math.abs(Math.hypot(s[2] - s[0], s[3] - s[1]) - 1)),
              forces: (s, lam) => { const [l1, l2] = lam, dx = s[2] - s[0], dy = s[3] - s[1]; return [[[s[0], s[1]], [-l1 * s[0], -l1 * s[1]], 'T_1'], [[s[0], s[1]], [l2 * dx, l2 * dy], ''], [[s[2], s[3]], [-l2 * dx, -l2 * dy], 'T_2']]; },
              text: (lam, s) => { const dx = s[2] - s[0], dy = s[3] - s[1]; return String.raw`rod tensions now $T_1 = ${v.fix(lam[0] * Math.hypot(s[0], s[1]), 2)}$ N, $T_2 = ${v.fix(lam[1] * Math.hypot(dx, dy), 2)}$ N`; },
            },
          },
          sam: {
            view: [[-1.9, 2.3], [-2.3, 0.5]],
            lag: { f: (t, s) => { const [r, th, rd, thd] = s; return [rd, thd, (r * thd * thd - G * (MU - Math.cos(th))) / (1 + MU), (-G * Math.sin(th) - 2 * rd * thd) / r]; }, y0: [1, TH, 0, 0] },
            pos: (y) => [[PX + y[0] * Math.sin(y[1]), -y[0] * Math.cos(y[1])], [-PX, -(LT - y[0])]],
            newt: {
              y0: () => [Math.sin(TH), -Math.cos(TH), -(LT - 1), 0, 0, 0],
              lam: (s) => { const [x, y, , vx, vy] = s, r = Math.hypot(x, y), px = x / r, py = y / r, pv = px * vx + py * vy, w = (vx * vx + vy * vy - pv * pv) / r; return [(-G * py + w + G) / (1 + 1 / MU)]; },
              f(t, s) { const [Tn] = this.lam(s), r = Math.hypot(s[0], s[1]); return [s[3], s[4], s[5], (-Tn * s[0]) / r, -G - (Tn * s[1]) / r, -G + Tn / MU]; },
              pos: (s) => [[PX + s[0], s[1]], [-PX, s[2]]],
              err: (s) => Math.abs(Math.hypot(s[0], s[1]) - s[2] - LT),
              forces: (s, lam) => { const r = Math.hypot(s[0], s[1]); return [[[PX + s[0], s[1]], [(-lam[0] * s[0]) / r, (-lam[0] * s[1]) / r], 'T'], [[-PX, s[2]], [0, lam[0]], 'T']]; },
              text: (lam) => String.raw`rope tension now $T = ${v.fix(lam[0], 2)}$ N (counterweight $${MU}m$)`,
            },
          },
          shake: {
            view: [[-1.5, 1.5], [-1.3, 0.55]],
            lag: { f: (t, s) => [s[1], -G * Math.sin(s[0]) + AS * OM * OM * Math.sin(OM * t) * Math.cos(s[0])], y0: [0.25, 0] },
            sup: (t) => AS * Math.sin(OM * t),
            pos(y, t) { return [[this.sup(t) + Math.sin(y[0]), -Math.cos(y[0])]]; },
            newt: {
              y0: () => [Math.sin(0.25), -Math.cos(0.25), AS * OM, 0],
              lam: (s, t) => { const sx = AS * Math.sin(OM * t), sv = AS * OM * Math.cos(OM * t), sa = -AS * OM * OM * Math.sin(OM * t), dx = s[0] - sx, dy = s[1], du = s[2] - sv, dw = s[3]; return [(dx * -sa + dy * -G + du * du + dw * dw) / (dx * dx + dy * dy)]; },
              f(t, s) { const [l] = this.lam(s, t), dx = s[0] - AS * Math.sin(OM * t); return [s[2], s[3], -l * dx, -G - l * s[1]]; },
              pos: (s) => [[s[0], s[1]]],
              err: (s, t) => Math.abs(Math.hypot(s[0] - AS * Math.sin(OM * t), s[1]) - 1),
              forces: (s, lam, t) => { const dx = s[0] - AS * Math.sin(OM * t); return [[[s[0], s[1]], [-lam[0] * dx, -lam[0] * s[1]], 'T']]; },
              text: (lam) => String.raw`rod tension now $T = ${v.fix(lam[0], 2)}$ N`,
            },
          },
        };
        const cache = memo();
        const sim = () => cache(`${sysSel.value}|${dtS.value}`, () => {
          const S = SYS[sysSel.value], dt = dtS.value, ev = Math.round(FR / dt);
          const L = integrate(S.lag.f, S.lag.y0, T, dt, ev), Nw = integrate((t, y) => S.newt.f(t, y), S.newt.y0(), T, dt, ev);
          const gap = [], err = [];
          for (let k = 0; k < L.t.length; k++) {
            const a = S.pos(L.y[k], L.t[k]), b = S.newt.pos(Nw.y[k]);
            gap.push(Math.max(...a.map((p, i) => Math.hypot(p[0] - b[i][0], p[1] - b[i][1]))));
            err.push(S.newt.err(Nw.y[k], Nw.t[k]));
          }
          return { S, L, Nw, gap, err };
        });
        const drawSys = (st, P, key, t, y) => {
          if (key === 'dp') { pivot(st, 0, 0); st.path([[0, 0], P[0], P[1]], { color: 'ink', width: 3 }); bob(st, P[0], 9, 'blue'); bob(st, P[1], 9, 'orange'); }
          else if (key === 'sam') {
            for (const x of [PX, -PX]) { st.line(x, 0, x, 0.32, { color: 'muted', width: 2 }); st.circle(x, 0, 0.09, { color: 'muted', width: 2, fill: 'panel', fillAlpha: 1 }); }
            st.line(-0.6, 0.32, 0.6, 0.32, { color: 'muted', width: 3 });
            st.curve((u) => [PX * Math.cos(u), 0.09 * Math.sin(u) + 0.0], 0, Math.PI, { color: 'ink', width: 1.4, n: 30 });
            st.path([[PX, 0], P[0]], { color: 'ink', width: 1.6 }); st.line(-PX, 0, -PX, P[1][1], { color: 'ink', width: 1.6 });
            bob(st, P[0], 8, 'blue'); st.rect(-PX - 0.13, P[1][1] - 0.14, -PX + 0.13, P[1][1] + 0.14, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1.5 });
          } else {
            const sx = SYS.shake.sup(t);
            st.line(-1.2, 0.09, 1.2, 0.09, { color: 'faint', width: 2 });
            st.rect(sx - 0.2, 0, sx + 0.2, 0.17, { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1.4 });
            st.path([[sx, 0], P[0]], { color: 'ink', width: 3 }); bob(st, P[0], 10, 'blue');
          }
          void y;
        };
        let now = null;
        v.animate((t) => {
          const R = sim(), S = R.S, key = sysSel.value, k = frameAt(R.L, t), tt = R.L.t[k];
          for (const st of [sN, sL]) st.setView(S.view[0], S.view[1]);
          const yL = R.L.y[k], yN = R.Nw.y[k], PL = S.pos(yL, tt), PN = S.newt.pos(yN);
          // trails
          const trail = (st, f) => { const pts = []; for (let j = Math.max(0, k - 220); j <= k; j++) pts.push(f(j)); st.path(pts, { color: 'gold', width: 1.4, alpha: 0.6 }); };
          const last = PL.length - (key === 'sam' ? 2 : 1);
          trail(sN, (j) => S.newt.pos(R.Nw.y[j])[last]); trail(sL, (j) => S.pos(R.L.y[j], R.L.t[j])[last]);
          drawSys(sN, PN, key, tt, yN);
          const lam = S.newt.lam(yN, tt);
          for (const [p, F, lab] of S.newt.forces(yN, lam, tt)) {
            sN.arrow(p[0], p[1], p[0] + KF * F[0], p[1] + KF * F[1], { color: 'orange', width: 2.4, head: 8 });
            if (lab) sN.tex(lab, p[0] + KF * F[0], p[1] + KF * F[1], { color: 'orange', size: 13, dx: 10, dy: -8 });
          }
          drawSys(sL, PL, key, tt, yL);
          if (key === 'dp') { angleArc(sL, [0, 0], 0.32, wrap(yL[0]), 'blue', '\\theta_1'); angleArc(sL, PL[0], 0.32, wrap(yL[1]), 'orange', '\\theta_2'); }
          else if (key === 'sam') { angleArc(sL, [PX, 0], 0.3, wrap(yL[1]), 'blue', '\\theta'); const m = [(PX + PL[0][0]) / 2, PL[0][1] / 2]; sL.tex('r', m[0], m[1], { color: 'blue', dx: 10 * Math.cos(yL[1]), dy: -10 * Math.sin(yL[1]) - 4, size: 14 }); }
          else angleArc(sL, [SYS.shake.sup(tt), 0], 0.3, wrap(yL[0]), 'blue', '\\theta');
          sL.corner(key === 'dp' ? `θ₁ = ${deg(wrap(yL[0]) / DEG)}, θ₂ = ${deg(wrap(yL[1]) / DEG)}` : key === 'sam' ? `r = ${v.fix(yL[0], 3)} m, θ = ${deg(wrap(yL[1]) / DEG)}` : `θ = ${deg(wrap(yL[0]) / DEG)}`, 'bl', { color: 'blue' });
          // log panel
          series(sD, R.L.t, R.gap, k, { color: 'accent', width: 2 });
          series(sD, R.L.t, R.err, k, { color: 'purple', width: 1.5, alpha: 0.8 });
          sD.vline(tt, { color: 'gold', width: 1.2 });
          now = { k, lam, yN, tt };
        }, { period: T, still: 9 });
        v.legend([['orange', 'constraint forces (Newton only)'], ['accent', 'distance between the two predictions'], ['purple', 'Newtonian constraint error']]);
        v.readout(() => {
          if (!now) return '';
          const R = sim(); let g = 0, e = 0;
          for (let j = 0; j <= now.k; j++) { g = Math.max(g, R.gap[j]); e = Math.max(e, R.err[j]); }
          return String.raw`RK4 step ${dtS.value * 1000} ms · largest distance between the Newtonian and the Lagrangian positions so far: $${v.sci(Math.max(g, 1e-17), 2)}$ m · Newtonian constraint error so far: $${v.sci(Math.max(e, 1e-17), 2)}$ m · ${R.S.newt.text(now.lam, now.yN)} — a by-product of Newton’s method that Lagrange never needed`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.7
    {
      num: '6.7',
      kind: 'Theorem',
      name: 'Lagrange’s equations hold in any coordinates',
      statement: String.raw`Lagrange’s equations have the same form in every system of generalized coordinates. If $q = q(\tilde q, t)$ is a smooth change of coordinates with invertible Jacobian $\partial q/\partial\tilde q$, and
$$\tilde L(\tilde q,\dot{\tilde q},t) = L\big(q(\tilde q,t),\ \dot q(\tilde q,\dot{\tilde q},t),\ t\big)$$
is the same Lagrangian written in the new variables, then $q(t)$ solves the Euler–Lagrange equations of $L$ if and only if $\tilde q(t)$ solves those of $\tilde L$. In contrast, the form $m\ddot q_j = -\partial U/\partial q_j$ of Newton’s law holds only in Cartesian coordinates.`,
      idea: String.raw`Hamilton’s principle (6.5) is coordinate-free: the action of a path is a number that does not depend on the labels we put on configurations, so a path is stationary in one description iff it is stationary in any other, and the stationary paths are exactly the solutions of the Euler–Lagrange equations. A direct proof uses the chain rule (pma-9.15): $\partial\dot q_k/\partial\dot{\tilde q}_j = \partial q_k/\partial\tilde q_j$, from which the Euler–Lagrange expressions transform as $\tilde E_j = \sum_k(\partial q_k/\partial\tilde q_j)\,E_k$ — by an invertible matrix, so they vanish together. The velocity-dependent terms this produces in curvilinear coordinates (the centrifugal $mr\dot\theta^2$, the $2mr\dot r\dot\theta$ term) are exactly what the naive componentwise $F = ma$ leaves out.`,
      caption: String.raw`A particle moves in a lopsided potential well (ink: integrated in Cartesian coordinates). Choose a coordinate system — polar, elliptic or parabolic; its grid is drawn on the plane. The motion is integrated again from the Euler–Lagrange equations of $L = T - U$ written in those coordinates and mapped back (gold dots): it lies on the Cartesian path. The equations are built by finite-differencing $L$ itself, with no coordinate-specific formulas. Right: the same motion as a curve in the coordinate plane, where it looks quite different. Turn on the *naive* equations $\ddot q_j = -\partial U/\partial q_j$ (red) to see what treating curvilinear coordinates like Cartesian ones does.`,
      deps: ['mech-6.6', 'pma-9.15'],
      refs: ['Tong §2.2', 'Taylor §7.1'],
      tags: ['coordinates', 'covariance'],
      viz(v) {
        const CX = 1.75, CY = 1.25, T = 15, DT = 0.005, EV = 4;
        const U = (x, y) => { const u = x - CX, w = y - CY; return 0.5 * (u * u + 1.8 * w * w) + 0.3 * u * u * w; };
        const dU = (x, y) => { const u = x - CX, w = y - CY; return [u + 0.6 * u * w, 1.8 * w + 0.3 * u * u]; };
        const ch = Math.cosh, sh = Math.sinh, cs = Math.cos, sn = Math.sin;
        const C = {
          polar: { names: ['r', 'θ'], X: (q) => [q[0] * cs(q[1]), q[0] * sn(q[1])], J: (q) => [[cs(q[1]), -q[0] * sn(q[1])], [sn(q[1]), q[0] * cs(q[1])]], inv: (p) => [Math.hypot(p[0], p[1]), Math.atan2(p[1], p[0])],
            g1: v.M.linspace(0.25, 4.5, 18), r1: [-0.3, 1.9], g2: v.M.linspace(-0.26, 1.83, 9), r2: [0, 4.6] },
          ell: { names: ['μ', 'ν'], X: (q) => [ch(q[0]) * cs(q[1]), sh(q[0]) * sn(q[1])], J: (q) => [[sh(q[0]) * cs(q[1]), -ch(q[0]) * sn(q[1])], [ch(q[0]) * sn(q[1]), sh(q[0]) * cs(q[1])]],
            inv: (p) => { const d1 = Math.hypot(p[0] + 1, p[1]), d2 = Math.hypot(p[0] - 1, p[1]); return [Math.acosh((d1 + d2) / 2), Math.acos(Math.max(-1, Math.min(1, (d1 - d2) / 2)))]; },
            g1: v.M.linspace(0.15, 2.25, 15), r1: [0, Math.PI], g2: v.M.linspace(Math.PI / 24, (23 * Math.PI) / 24, 23), r2: [0, 2.4] },
          par: { names: ['σ', 'τ'], X: (q) => [(q[0] * q[0] - q[1] * q[1]) / 2, q[0] * q[1]], J: (q) => [[q[0], -q[1]], [q[1], q[0]]], inv: (p) => { const r = Math.hypot(p[0], p[1]); return [Math.sqrt(r + p[0]), Math.sign(p[1] || 1) * Math.sqrt(r - p[0])]; },
            g1: v.M.linspace(0.2, 3, 15), r1: [0, 3], g2: v.M.linspace(0.2, 3, 15), r2: [0, 3] },
        };
        const sel = v.select('coordinates', [{ value: 'polar', label: 'polar $(r,\\theta)$' }, { value: 'ell', label: 'elliptic $(\\mu,\\nu)$' }, { value: 'par', label: 'parabolic $(\\sigma,\\tau)$' }], 'polar');
        const naive = v.toggle('naive $\\ddot q_j = -\\partial U/\\partial q_j$', false);
        const s = v.stage({ x: [0, 3.1], y: [0.15, 2.4], equal: true, height: 320, axes: false, weight: 1.25, title: 'the plane, with the coordinate grid' });
        const sq = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', weight: 1, title: 'the same motion in the coordinate plane' });
        const r0 = [CX + 0.55, CY], v0 = [0.15, 0.6];
        const cart = memo(), curv = new Map();
        const ref = () => cart(1, () => integrate((t, z) => { const g = dU(z[0], z[1]); return [z[2], z[3], -g[0], -g[1]]; }, [...r0, ...v0], T, DT, EV));
        const run = (key, isNaive) => {
          const id = key + isNaive; if (curv.has(id)) return curv.get(id);
          const c = C[key], q0 = c.inv(r0), qd0 = solve(c.J(q0), v0);
          const L = (q, qd) => { const J = c.J(q), vx = J[0][0] * qd[0] + J[0][1] * qd[1], vy = J[1][0] * qd[0] + J[1][1] * qd[1], X = c.X(q); return 0.5 * (vx * vx + vy * vy) - U(X[0], X[1]); };
          const f = isNaive
            ? (t, z) => { const q = [z[0], z[1]], X = c.X(q), J = c.J(q), g = dU(X[0], X[1]); return [z[2], z[3], -(J[0][0] * g[0] + J[1][0] * g[1]), -(J[0][1] * g[0] + J[1][1] * g[1])]; }
            : (t, z) => { const a = lagrangeAccel(L, [z[0], z[1]], [z[2], z[3]], t); return [z[2], z[3], a[0], a[1]]; };
          const S = integrate(f, [...q0, ...qd0], T, DT, EV, (t, z) => !(Math.abs(z[0]) < 50 && Math.abs(z[1]) < 50));
          const P = S.y.map((z) => c.X([z[0], z[1]])), Rf = ref();
          let gap = 0; for (let k = 0; k < P.length; k++) gap = Math.max(gap, Math.hypot(P[k][0] - Rf.y[k][0], P[k][1] - Rf.y[k][1]));
          const out = { S, P, gap }; curv.set(id, out); return out;
        };
        let now = null;
        v.animate((t) => {
          const key = sel.value, c = C[key], Rf = ref(), Cv = run(key, false), Nv = naive.value ? run(key, true) : null;
          const k = frameAt(Rf, t);
          // grid
          s.clip(() => {
            for (const a of c.g1) s.curve((u) => c.X([a, u]), c.r1[0], c.r1[1], { color: 'blue', width: 1, alpha: 0.35, n: 120 });
            for (const b of c.g2) s.curve((u) => c.X([u, b]), c.r2[0], c.r2[1], { color: 'orange', width: 1, alpha: 0.35, n: 120 });
          });
          s.path(Rf.y.map((z) => [z[0], z[1]]), { color: 'ink', width: 1.2, alpha: 0.25 });
          s.path(Rf.y.slice(0, k + 1).map((z) => [z[0], z[1]]), { color: 'ink', width: 2 });
          const dots = []; for (let j = 0; j <= Math.min(k, Cv.P.length - 1); j += 6) dots.push(Cv.P[j]);
          s.dots(dots, { r: 2.6, color: 'gold' });
          if (Nv) { s.path(Nv.P.slice(0, Math.min(k, Nv.P.length - 1) + 1), { color: 'red', width: 2 }); const pn = Nv.P[Math.min(k, Nv.P.length - 1)]; s.dot(pn[0], pn[1], { r: 6, color: 'red' }); }
          s.dot(Rf.y[k][0], Rf.y[k][1], { r: 7, color: 'ink' });
          const pc = Cv.P[Math.min(k, Cv.P.length - 1)]; s.dot(pc[0], pc[1], { r: 4, color: 'gold' });
          s.corner(`grid: ${c.names[0]} = const (blue), ${c.names[1]} = const (orange)`, 'tl', { color: 'muted' });
          // coordinate plane
          const q1 = Cv.S.y.map((z) => z[0]), q2 = Cv.S.y.map((z) => z[1]);
          const arrs1 = [q1], arrs2 = [q2];
          if (Nv) { const n1 = Nv.S.y.map((z) => z[0]).filter((x) => Math.abs(x) < 8), n2 = Nv.S.y.map((z) => z[1]).filter((x) => Math.abs(x) < 8); arrs1.push(n1); arrs2.push(n2); }
          sq.setView(span(arrs1, 0.08, 0.2), span(arrs2, 0.12, 0.2));
          sq.path(Cv.S.y.map((z) => [z[0], z[1]]), { color: 'gold', width: 1.6, alpha: 0.5 });
          sq.path(Cv.S.y.slice(0, k + 1).map((z) => [z[0], z[1]]), { color: 'gold', width: 2.2 });
          if (Nv) { const kk = Math.min(k, Nv.S.y.length - 1); sq.path(Nv.S.y.slice(0, kk + 1).map((z) => [z[0], z[1]]), { color: 'red', width: 1.8 }); sq.dot(Nv.S.y[kk][0], Nv.S.y[kk][1], { r: 5, color: 'red' }); }
          const zc = Cv.S.y[Math.min(k, Cv.S.y.length - 1)]; sq.dot(zc[0], zc[1], { r: 6, color: 'gold' });
          sq.corner(`horizontal: ${c.names[0]}, vertical: ${c.names[1]}`, 'tr', { color: 'muted' });
          now = { gap: Cv.gap, ngap: Nv ? Nv.gap : null, key };
        }, { period: T, still: 9.5 });
        v.legend([['ink', 'Cartesian solution'], ['gold', 'curvilinear Euler–Lagrange solution, mapped back', { dot: true }], ['red', 'naive $\\ddot q = -\\partial U/\\partial q$']]);
        v.readout(() => {
          if (!now) return '';
          const nm = { polar: 'polar', ell: 'elliptic', par: 'parabolic' }[now.key];
          return String.raw`largest distance between the ${nm} Euler–Lagrange solution (mapped back) and the Cartesian one over ${T} s: $${v.sci(now.gap, 2)}$ (the well is about 1 wide) — the same motion` + (now.ngap != null ? String.raw` · the naive equations miss by up to $${v.fix(Math.min(now.ngap, 99), 2)}$: they drop the velocity terms of $\tfrac{d}{dt}\partial L/\partial\dot q$ and the metric factors` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.8
    {
      num: '6.8',
      kind: 'Definition',
      name: 'Generalized momenta and forces',
      statement: String.raw`For a Lagrangian $L(q,\dot q,t)$, the **generalized momentum** conjugate to $q_j$ is
$$p_j = \frac{\partial L}{\partial\dot q_j},$$
and the **generalized force** is $Q_j = \partial L/\partial q_j$ (for $L = T - U$ with $T$ independent of $q_j$ this is $-\partial U/\partial q_j$). Lagrange’s equations then read $\dot p_j = Q_j$. The units depend on the coordinate: for a length, $p_j$ is a linear momentum and $Q_j$ a force; for an angle, an angular momentum and a torque. A generalized momentum is in general not the mass times the velocity of any one body. If $L$ does not contain $q_j$ — a **cyclic** (ignorable) coordinate — then $Q_j = 0$ and $p_j$ is conserved.`,
      idea: String.raw`Lagrange’s equation (6.6) is literally $\tfrac{d}{dt}p_j = Q_j$, a generalized second law. Because $T$ couples the coordinates, $p_j$ collects the contribution of every particle that moves when $q_j$ changes: for a block on a free wedge, moving the wedge carries the block along, so $p_X = (M+m)\dot X + m\dot s\cos\alpha$ is the total horizontal momentum, not $M\dot X$. Nothing in the Lagrangian depends on $X$ (the floor is smooth and level), so $p_X$ is constant — a first glimpse of the link between symmetry and conservation (7.1, 7.3).`,
      caption: String.raw`A block on a spring slides on a wedge that itself slides on a smooth floor (the view follows the centre of mass; floor marks show the motion). Coordinates: the wedge position $X$ and the block’s distance $s$ along the incline. Top plot: $p_X = \partial L/\partial\dot X$ (green) is a live constant while the wedge’s own $M\dot X$ (blue) and the block’s horizontal momentum (orange) trade back and forth. Bottom: the measured rates $\dot p_s$, $\dot p_X$ (dots) sit on the generalized forces $Q_s$, $Q_X$ (lines). Tie the wedge to a wall with a spring: $L$ now contains $X$, and $p_X$ oscillates with $\dot p_X = -KX$.`,
      deps: ['mech-6.6'],
      refs: ['Taylor §7.6'],
      tags: ['generalized momentum', 'cyclic coordinate'],
      viz(v) {
        const Mw = 3, HH = 1.4, T = 12, DT = 0.002, EV = 5, KW = 14;
        const mr = v.slider('block mass $m/M$', 0.1, 2, 0.5, { step: 0.05 });
        const al = v.slider('incline angle $\\alpha$', 22, 55, 35, { step: 1, fmt: deg });
        const wall = v.toggle('tie the wedge to a wall (spring $K$)', false);
        const s = v.stage({ x: [-3, 3], y: [-0.25, 1.75], equal: true, height: 220, axes: false, full: true });
        const p1 = v.stage({ x: [0, T], y: [-2, 2], height: 180, axes: 'box', xlabel: 't (s)', title: 'horizontal momenta (kg·m/s)' });
        const p2 = v.stage({ x: [0, T], y: [-5, 5], height: 180, axes: 'box', xlabel: 't (s)', title: 'rates $\\dot p_j$ (dots) and forces $Q_j=\\partial L/\\partial q_j$ (lines)' });
        const cache = memo();
        const sim = () => cache(`${mr.value}|${al.value}|${wall.value}`, () => {
          const m = mr.value * Mw, a = al.value * DEG, ca = Math.cos(a), sa = Math.sin(a), k = 9 * m, K = wall.value ? KW : 0;
          const Linc = HH / sa, s0 = Linc / 2 - (m * G * sa) / k;
          const f = (t, z) => { const [X, sv, Xd, sd] = z, r = solve([[Mw + m, m * ca], [m * ca, m]], [-K * X, m * G * sa - k * (sv - s0)]); return [Xd, sd, r[0], r[1]]; };
          const S = integrate(f, [0, Linc / 2 - 0.3, 0, 0.9], T, DT, EV);
          const pX = [], pS = [], MX = [], mB = [], QX = [], QS = [];
          for (const [X, sv, Xd, sd] of S.y) { pX.push((Mw + m) * Xd + m * sd * ca); pS.push(m * (sd + Xd * ca)); MX.push(Mw * Xd); mB.push(m * (Xd + sd * ca)); QX.push(-K * X); QS.push(m * G * sa - k * (sv - s0)); }
          return { S, m, a, ca, sa, Linc, s0, K, pX, pS, MX, mB, QX, QS, dX: deriv5(pX, S.dt), dS: deriv5(pS, S.dt) };
        });
        let now = null;
        v.animate((t) => {
          const R = sim(), k = frameAt(R.S, t), [X, sv] = R.S.y[k], base = HH / Math.tan(R.a), X0 = -base / 2;
          const xw = X0 + X, xc = (Mw * (xw + base / 3) + R.m * (xw + sv * R.ca)) / (Mw + R.m), xc0 = (Mw * (X0 + base / 3) + R.m * (X0 + (R.Linc / 2 - 0.3) * R.ca)) / (Mw + R.m);
          const cam = R.K ? 0 : xc - xc0;
          s.setView([-3 + cam, 3 + cam], [-0.25, 1.75]);
          // floor with marks
          s.line(-4 + cam, 0, 4 + cam, 0, { color: 'muted', width: 2 });
          for (let x = Math.floor((cam - 4) / 0.5) * 0.5; x < cam + 4; x += 0.5) s.line(x, 0, x - 0.1, -0.1, { color: 'faint', width: 1 });
          if (R.K) { const xwall = X0 - 0.9; s.rect(xwall - 0.12, 0, xwall, 1.1, { fill: 'muted', fillAlpha: 0.35, color: 'muted' }); spring(s, [xwall, HH / 3], [xw, HH / 3], { coils: 7, amp: 0.06 }); }
          s.poly([[xw, 0], [xw + base, 0], [xw, HH]], { fill: 'blue', fillAlpha: 0.22, color: 'blue', width: 1.8 });
          const C = [xw + sv * R.ca, HH - sv * R.sa], tv = [R.ca, -R.sa], nv = [R.sa, R.ca], bs = 0.3;
          const corner = (u, w) => [C[0] + u * tv[0] + w * nv[0], C[1] + u * tv[1] + w * nv[1]];
          const anc = [xw + (bs / 2) * nv[0], HH + (bs / 2) * nv[1]];
          s.line(xw, HH, anc[0], anc[1], { color: 'purple', width: 2 });
          spring(s, anc, corner(-bs / 2, bs / 2), { coils: 8, amp: 0.05, color: 'purple' });
          s.poly([corner(-bs / 2, 0), corner(bs / 2, 0), corner(bs / 2, bs), corner(-bs / 2, bs)], { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1.6 });
          s.line(xc, -0.2, xc, 1.7, { color: 'green', width: 1.2, dash: [4, 4] });
          s.tex('X', xw + 0.06, 0.12, { color: 'blue', size: 13, align: 'left' });
          s.tex('s', ...corner(0, bs + 0.12), { color: 'orange', size: 13 });
          // momenta
          p1.setView(null, span([R.pX, R.MX, R.mB], 0.12, 0.6));
          p1.hline(0, { color: 'faint' });
          series(p1, R.S.t, R.MX, k, { color: 'blue', width: 1.8 });
          series(p1, R.S.t, R.mB, k, { color: 'orange', width: 1.8 });
          series(p1, R.S.t, R.pX, k, { color: 'green', width: 2.8 });
          p1.vline(R.S.t[k], { color: 'gold', width: 1.2 });
          // Lagrange's equations
          p2.setView(null, span([R.QS, R.QX], 0.12, 1));
          p2.hline(0, { color: 'faint' });
          series(p2, R.S.t, R.QS, k, { color: 'purple', width: 1.8 });
          series(p2, R.S.t, R.QX, k, { color: 'green', width: 1.8 });
          const ds = [], dx = []; for (let j = 1; j <= k; j += 12) { ds.push([R.S.t[j], R.dS[j]]); dx.push([R.S.t[j], R.dX[j]]); }
          p2.dots(ds, { r: 2.6, color: 'purple' }); p2.dots(dx, { r: 2.6, color: 'green' });
          p2.vline(R.S.t[k], { color: 'gold', width: 1.2 });
          now = { k };
        }, { period: T, still: 7 });
        v.legend([['green', '$p_X = (M+m)\\dot X + m\\dot s\\cos\\alpha$'], ['blue', 'wedge’s $M\\dot X$'], ['orange', 'block’s $m(\\dot X + \\dot s\\cos\\alpha)$'], ['purple', '$Q_s$, $\\dot p_s$ (block coordinate)']]);
        v.readout(() => {
          if (!now) return '';
          const R = sim(), k = now.k, sd = R.S.y[k][3];
          let dev = 0, lo = Infinity, hi = -Infinity, mis = 0;
          for (let j = 0; j < R.pX.length; j++) { dev = Math.max(dev, Math.abs(R.pX[j] - R.pX[0])); lo = Math.min(lo, R.MX[j]); hi = Math.max(hi, R.MX[j]); }
          for (let j = 2; j < R.pS.length - 2; j++) mis = Math.max(mis, Math.abs(R.dS[j] - R.QS[j]) / (1 + Math.abs(R.QS[j])), Math.abs(R.dX[j] - R.QX[j]) / (1 + Math.abs(R.QX[j])));
          const pxPart = R.K
            ? String.raw`$L$ contains $X$ through $\tfrac12 KX^2$: $p_X$ now swings by $${v.fix(dev, 3)}$ kg·m/s, at the rate $\dot p_X = Q_X = -KX$`
            : String.raw`$p_X = ${v.fix(R.pX[k], 4)}$ kg·m/s, constant to $${v.sci(Math.max(dev, 1e-16), 1)}$ ($X$ is cyclic), while $M\dot X$ alone ranges over $[${v.fix(lo, 2)}, ${v.fix(hi, 2)}]$`;
          return pxPart + String.raw` · $p_s = m(\dot s + \dot X\cos\alpha) = ${v.fix(R.pS[k], 3)}$ vs $m\dot s = ${v.fix(R.m * sd, 3)}$ · Lagrange’s equations $\dot p_j = Q_j$ hold to $${v.sci(mis, 1)}$ (relative; finite-difference rates)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.9
    {
      num: '6.9',
      kind: 'Model',
      name: 'Double Atwood machine',
      statement: String.raw`A rope over a fixed pulley carries a mass $m_1$ on one side and a movable pulley on the other; over the movable pulley runs a second rope carrying $m_2$ and $m_3$. With massless frictionless pulleys and inextensible ropes there are two degrees of freedom: $x$, the descent of $m_1$, and $y$, the descent of $m_2$ relative to the movable pulley. The Lagrangian is
$$L = \tfrac12 m_1\dot x^2 + \tfrac12 m_2(\dot x-\dot y)^2 + \tfrac12 m_3(\dot x+\dot y)^2 + g\big(m_1x - m_2(x-y) - m_3(x+y)\big),$$
and Lagrange’s equations give constant accelerations:
$$\begin{pmatrix} m_1+m_2+m_3 & m_3-m_2\\ m_3-m_2 & m_2+m_3\end{pmatrix}\begin{pmatrix}\ddot x\\ \ddot y\end{pmatrix} = g\begin{pmatrix} m_1-m_2-m_3\\ m_2-m_3\end{pmatrix}.$$
In particular $m_1$ stays at rest exactly when $4/m_1 = 1/m_2 + 1/m_3$ — not when $m_1 = m_2+m_3$.`,
      scope: String.raw`Massless, frictionless pulleys and massless inextensible ropes, until a mass reaches a pulley or the floor.`,
      idea: String.raw`With the rope lengths fixed, the heights of all three masses are functions of $x$ and $y$ (the movable pulley rises by $x$; $m_2$ and $m_3$ move by $\mp y$ relative to it), so $T$ and $U$ follow at once and Lagrange’s equations (6.6) need no tensions. The Newtonian route — the Atwood machine (mech-1.16) twice over — introduces the two tensions as unknowns, uses $T_1 = 2T_2$ for the massless movable pulley and two rope-length conditions, and solves six linear equations; the accelerations agree, with the tensions as a by-product. An unequal pair $m_2\ne m_3$ accelerates, so it pulls on the movable pulley with less than its weight, $2T_2 = 4m_2m_3g/(m_2+m_3)$ while the pulley is held still — hence the harmonic-mean balance condition.`,
      caption: String.raw`Set the three masses and press play: the machine runs on Lagrange’s equations, with tension arrows (from the Newtonian solution) on the ropes and green acceleration arrows beside the masses. Right: in the configuration plane $(x,y)$ the motion is a ray from the start, inside the polygon of positions where no mass hits a pulley or the floor. The readout compares the accelerations from Lagrange’s equations, from the tension-by-tension Newtonian solution and as measured from the run. The default has $m_1 = m_2+m_3$, yet $m_1$ sinks; find the balance $4/m_1 = 1/m_2+1/m_3$.`,
      deps: ['mech-6.6', 'mech-1.16'],
      refs: ['Taylor §7.5'],
      tags: ['Atwood machine', 'pulleys'],
      viz(v) {
        const rA = 0.5, rB = 0.3, Y1 = -1.75, YB = -1.1, D2 = 1.65, D3 = 0.7, FL = -3.45, HB = 0.17, GAP = 0.05, TMAX = 2.6, SLOW = 0.4;
        const m1 = v.slider('$m_1$ (kg)', 0.2, 5, 3, { step: 0.05, onChange: () => v.restart() });
        const m2 = v.slider('$m_2$ (kg)', 0.2, 5, 1, { step: 0.05, onChange: () => v.restart() });
        const m3 = v.slider('$m_3$ (kg)', 0.2, 5, 2, { step: 0.05, onChange: () => v.restart() });
        const s = v.stage({ x: [-1.3, 1.6], y: [-3.6, 0.8], equal: true, height: 380, axes: false, weight: 1.05, title: 'the machine' });
        const c = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 380, axes: 'box', weight: 1, xlabel: 'x', ylabel: 'y', title: 'configuration plane $(x, y)$' });
        // half-planes a·x + b·y ≤ c describing the allowed configurations
        const HP = [[-1, 0, -rA - GAP - Y1 - HB], [1, 0, Y1 - HB - FL], [1, 0, -rA - GAP - rB - YB], [0, -1, D2 - HB - rB - GAP], [-1, 1, YB - D2 - HB - FL], [0, 1, D3 - HB - rB - GAP], [-1, -1, YB - D3 - HB - FL]];
        const inside = (x, y) => HP.every(([a, b, cc]) => a * x + b * y <= cc + 1e-12);
        const polygon = () => {
          let P = [[-9, -9], [9, -9], [9, 9], [-9, 9]];
          for (const [a, b, cc] of HP) {
            const out = [], val = (p) => a * p[0] + b * p[1] - cc;
            for (let i = 0; i < P.length; i++) {
              const p = P[i], q = P[(i + 1) % P.length], vp = val(p), vq = val(q);
              if (vp <= 0) out.push(p);
              if ((vp <= 0) !== (vq <= 0)) { const t = vp / (vp - vq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
            }
            P = out;
          }
          return P;
        };
        const POLY = polygon();
        const cache = memo();
        const model = () => cache(`${m1.value}|${m2.value}|${m3.value}`, () => {
          const a = m1.value, b = m2.value, d = m3.value;
          const acc = solve([[a + b + d, d - b], [d - b, b + d]], [G * (a - b - d), G * (b - d)]);
          // Newton: unknowns [A1, AB, A2, A3, T1, T2] (accelerations upward)
          const Nw = solve([[a, 0, 0, 0, -1, 0], [0, 0, 0, 0, 1, -2], [0, 0, b, 0, 0, -1], [0, 0, 0, d, 0, -1], [1, 1, 0, 0, 0, 0], [0, -2, 1, 1, 0, 0]], [-a * G, 0, -b * G, -d * G, 0, 0]);
          const S = integrate((t, z) => [z[2], z[3], acc[0], acc[1]], [0, 0, 0, 0], TMAX, 0.005, 2, (t, z) => !inside(z[0], z[1]));
          let kStop = S.t.length - 1; if (!inside(S.y[kStop][0], S.y[kStop][1])) kStop = Math.max(0, kStop - 1);
          return { acc, Nw, S, kStop };
        });
        let now = null;
        v.animate((t) => {
          const Mo = model(), k = Math.min(frameAt(Mo.S, t), Mo.kStop), [x, y] = Mo.S.y[k], T1 = Mo.Nw[4], T2 = Mo.Nw[5];
          const y1 = Y1 - x, yB = YB + x, y2 = yB - D2 - y, y3 = yB - D3 + y, xB = rA, x2 = rA - rB, x3 = rA + rB;
          const [xa, ya] = Mo.acc, A = [-xa, xa - ya, xa + ya], ms = [m1.value, m2.value, m3.value];
          // ceiling, pulleys and ropes
          s.line(-0.9, 0.68, 0.9, 0.68, { color: 'muted', width: 3 }); for (let q = -0.85; q < 0.9; q += 0.15) s.line(q, 0.68, q + 0.08, 0.76, { color: 'muted', width: 1 });
          s.line(0, 0.68, 0, 0, { color: 'muted', width: 2 });
          s.circle(0, 0, rA, { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.12 }); s.dot(0, 0, { r: 3, color: 'ink' });
          s.curve((u) => [rA * Math.cos(u), rA * Math.sin(u)], 0, Math.PI, { color: 'ink', width: 1.6, n: 40 });
          s.line(-rA, 0, -rA, y1 + HB, { color: 'ink', width: 1.6 });
          s.line(rA, 0, rA, yB + rB + 0.12, { color: 'ink', width: 1.6 }); s.line(rA, yB + rB + 0.12, rA, yB, { color: 'muted', width: 2 });
          s.circle(xB, yB, rB, { color: 'ink', width: 2, fill: 'muted', fillAlpha: 0.12 }); s.dot(xB, yB, { r: 3, color: 'ink' });
          s.curve((u) => [xB + rB * Math.cos(u), yB + rB * Math.sin(u)], 0, Math.PI, { color: 'ink', width: 1.6, n: 30 });
          s.line(x2, yB, x2, y2 + HB, { color: 'ink', width: 1.6 }); s.line(x3, yB, x3, y3 + HB, { color: 'ink', width: 1.6 });
          s.line(-1.2, FL, 1.5, FL, { color: 'muted', width: 2 });
          const blocks = [[-rA, y1, 'blue', 'm_1'], [x2, y2, 'orange', 'm_2'], [x3, y3, 'purple', 'm_3']];
          blocks.forEach(([bx, by, col, lab], i) => {
            const w = 0.11 * Math.sqrt(ms[i]) + 0.04;
            s.rect(bx - w, by - HB, bx + w, by + HB, { fill: col, fillAlpha: 0.5, color: col, width: 1.6 });
            s.tex(lab, bx, by, { color: 'ink', size: 12 });
            const al = A[i] * 0.1, side = i === 2 ? 1 : -1, ax = bx + side * (w + 0.09);
            if (Math.abs(al) > 0.005) s.arrow(ax, by - al / 2, ax, by + al / 2, { color: 'green', width: 2.4, head: Math.min(8, 4 + 40 * Math.abs(al)) });
            s.text(v.fix(Math.abs(A[i]), 2), ax, by - Math.abs(al) / 2 - 0.05, { color: 'green', size: 10, align: 'center', baseline: 'top' });
          });
          // tension arrows on the ropes (just above each block, and on the hook of pulley B)
          const tk = 0.02;
          s.arrow(-rA, y1 + HB, -rA, y1 + HB + T1 * tk, { color: 'orange', width: 2.4, head: 7 }); s.tex('T_1', -rA, y1 + HB + T1 * tk, { color: 'orange', size: 12, dx: -14 });
          s.arrow(x2, y2 + HB, x2, y2 + HB + T2 * tk, { color: 'orange', width: 2.4, head: 7 });
          s.arrow(x3, y3 + HB, x3, y3 + HB + T2 * tk, { color: 'orange', width: 2.4, head: 7 }); s.tex('T_2', x3, y3 + HB + T2 * tk, { color: 'orange', size: 12, dx: 14 });
          // configuration plane
          const xs = POLY.map((p) => p[0]), ys = POLY.map((p) => p[1]);
          c.setView(span([xs], 0.12, 1), span([ys], 0.12, 1));
          c.poly(POLY, { fill: 'green', fillAlpha: 0.08, color: 'green', width: 1.4 });
          c.hline(0, { color: 'faint' }); c.vline(0, { color: 'faint' });
          const an = Math.hypot(xa, ya);
          if (an > 1e-6) c.arrow(0, 0, (0.6 * xa) / an, (0.6 * ya) / an, { color: 'ink', width: 1.4, dash: [4, 3], head: 7 });
          c.path(Mo.S.y.slice(0, k + 1).map((z) => [z[0], z[1]]), { color: 'gold', width: 3 });
          c.dot(0, 0, { r: 4, color: 'ink' }); c.dot(x, y, { r: 6.5, color: 'gold' });
          now = { k, Mo };
        }, { period: TMAX, speed: SLOW, still: 0.6 });
        v.legend([['orange', 'rope tensions (Newton)'], ['green', 'accelerations (m/s²)'], ['gold', 'path in configuration space'], ['green', 'allowed configurations', { area: true }]]);
        v.readout(() => {
          if (!now) return '';
          const { Mo, k } = now, [xa, ya] = Mo.acc, L = [-xa, xa - ya, xa + ya], N = [Mo.Nw[0], Mo.Nw[2], Mo.Nw[3]];
          const tm = Mo.S.t[Math.max(k, 1)], z = Mo.S.y[Math.max(k, 1)], meas = [-z[0], z[0] - z[1], z[0] + z[1]].map((d) => (2 * d) / (tm * tm));
          const f = (a) => a.map((u) => v.fix(Math.abs(u) < 5e-13 ? 0 : u, 3)).join(',\\ ');
          return String.raw`accelerations (up positive, m/s²) of $(m_1, m_2, m_3)$ — Lagrange: $(${f(L)})$ · Newton, with $T_1 = ${v.fix(Mo.Nw[4], 2)}$ N, $T_2 = ${v.fix(Mo.Nw[5], 2)}$ N: $(${f(N)})$ · measured from the run: $(${f(meas)})$ · $4/m_1 = ${v.fix(4 / m1.value, 3)}$ vs $1/m_2 + 1/m_3 = ${v.fix(1 / m2.value + 1 / m3.value, 3)}$ — ${Math.abs(L[0]) < 0.02 ? 'balanced: $m_1$ stays put' : L[0] < 0 ? '$m_1$ sinks' : '$m_1$ rises'}`;
        });
      },
    },
  ],
};
