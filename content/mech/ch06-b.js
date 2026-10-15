// Classical Mechanics — Chapter 6: Lagrangian mechanics (part b: 6.10–6.17)

// ── shared helpers (this part file cannot import from ch06.js) ───────────────
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

const frameAt = (sim, t) => Math.min(sim.t.length - 1, Math.max(0, Math.round(t / sim.dt)));

function series(s, ts, ys, upto, st, from = 0) {
  const pts = [];
  for (let k = Math.max(0, from); k <= Math.min(upto, ts.length - 1); k++) pts.push([ts[k], ys[k]]);
  if (pts.length > 1) s.path(pts, st);
}

function span(arrs, pad = 0.1, minSpan = 1) {
  let lo = Infinity, hi = -Infinity;
  for (const a of arrs) for (const y of a) { if (!isFinite(y)) continue; if (y < lo) lo = y; if (y > hi) hi = y; }
  if (!isFinite(lo)) { lo = -minSpan / 2; hi = minSpan / 2; }
  if (hi - lo < minSpan) { const c = (hi + lo) / 2; lo = c - minSpan / 2; hi = c + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}

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
 * Lagrange machine: q̈ from the Euler–Lagrange equations of any smooth L(q, q̇, t), solving
 * H q̈ = ∂L/∂q − (∂²L/∂q̇∂q) q̇ − ∂²L/∂q̇∂t with every derivative a central difference of L itself.
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

const wrap = (a) => a - TAU * Math.round(a / TAU);
const deg = (x) => `${Math.round(x)}°`.replace('-', '−');

/** Derivative of equally spaced samples: 5-point central stencil, 3-point one-sided at the ends. */
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

/** Horizontal dashpot from x0 to x1 at height y (cylinder on the left, piston rod on the right). */
function dashpot(s, x0, x1, y, col = 'muted') {
  const L = x1 - x0, c0 = x0 + 0.1 * L, c1 = x0 + 0.55 * L, h = 0.07, pis = Math.min(c1 - 0.02, x0 + 0.42 * L);
  s.line(x0, y, c0, y, { color: col, width: 1.6 });
  s.path([[c1, y + h], [c0, y + h], [c0, y - h], [c1, y - h]], { color: col, width: 1.6 });
  s.line(pis, y - h * 0.8, pis, y + h * 0.8, { color: col, width: 2.4 });
  s.line(pis, y, x1, y, { color: col, width: 1.6 });
}

/** Simpson's rule for f on [a, b] with n (even) intervals. */
function simpson(f, a, b, n = 200) {
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

export default {
  collection: 'mech',
  chapter: 6,
  items: [
    // ───────────────────────────────────────────────────────────── 6.10
    {
      num: '6.10',
      kind: 'Model',
      name: 'Pendulum hanging from a sliding cart',
      statement: String.raw`A pendulum of length $\ell$ and bob mass $m$ hangs from a cart of mass $M$ that slides without friction on a horizontal rail. With the cart position $X$ and the pendulum angle $\theta$ as generalized coordinates,
$$L = \tfrac12(M+m)\dot X^2 + m\ell\dot X\dot\theta\cos\theta + \tfrac12 m\ell^2\dot\theta^2 + mg\ell\cos\theta .$$
$X$ is cyclic, so the horizontal momentum $p_X = (M+m)\dot X + m\ell\dot\theta\cos\theta$ is conserved and, starting from rest, the horizontal centre of mass never moves: the cart recoils against every swing, and the bob moves on an arc of an ellipse with horizontal semi-axis $M\ell/(M+m)$. Small oscillations have angular frequency
$$\omega = \sqrt{\frac{g}{\ell}\Big(1+\frac mM\Big)},$$
faster than the fixed-support value $\sqrt{g/\ell}$.`,
      scope: String.raw`Frictionless rail and pivot, massless rod; the frequency formula holds for small swings (the energy integral gives the period at any amplitude).`,
      idea: String.raw`Lagrange’s equations (6.6) give $(M+m)\ddot X + m\ell(\ddot\theta\cos\theta - \dot\theta^2\sin\theta) = 0$ and $\ell\ddot\theta + \ddot X\cos\theta + g\sin\theta = 0$. The first says $\dot p_X = 0$ — the motion of the centre of mass under no horizontal force (mech-2.4). Eliminating $\ddot X$ and linearising in $\theta$ gives $\ell\ddot\theta\,M/(M+m) = -g\theta$: the bob swings about the fixed centre of mass with an effective length $\ell M/(M+m)$, hence the higher frequency. Clamping the cart restores a fixed support, and the rail must then push sideways, so the centre of mass oscillates.`,
      caption: String.raw`Release the pendulum and watch the cart recoil. The dashed green line is the horizontal centre of mass: it does not move (bottom plot, green), and the bob runs along the dashed ellipse around it. Faint ghosts show earlier positions. Change the mass ratio: the readout compares the measured period with the energy-integral prediction, the small-swing formula and the fixed-support period. Clamp the cart and the centre of mass starts to swing.`,
      deps: ['mech-6.6', 'mech-2.4'],
      refs: ['Taylor ch. 7'],
      tags: ['pendulum', 'cyclic coordinate', 'centre of mass'],
      viz(v) {
        const L = 1, Mc = 1, T = 20, DT = 0.002, EV = 5;
        const mr = v.slider('mass ratio $m/M$', 0.05, 4, 1, { step: 0.05, onChange: () => v.restart() });
        const th0 = v.slider('release angle $\\theta_0$', 5, 120, 40, { step: 1, fmt: deg, onChange: () => v.restart() });
        const clamp = v.toggle('clamp the cart', false);
        const s = v.stage({ x: [-1.8, 1.8], y: [-1.22, 0.42], equal: true, height: 270, full: true, axes: false });
        const p = v.stage({ x: [0, T], y: [-1, 1], height: 180, full: true, axes: 'box', xlabel: 't (s)', title: 'horizontal positions (m): cart $X$, bob, centre of mass' });
        const cache = memo();
        const sim = () => cache(`${mr.value}|${th0.value}|${clamp.value}`, () => {
          const m = mr.value, a0 = th0.value * DEG, cl = clamp.value, mu = cl ? 0 : m / (Mc + m);
          const f = cl ? (t, y) => [0, y[3], 0, (-G / L) * Math.sin(y[1])]
            : (t, y) => { const [, th, , thd] = y, c = Math.cos(th), sn = Math.sin(th), r = solve([[Mc + m, m * L * c], [c, L]], [m * L * thd * thd * sn, -G * sn]); return [y[2], thd, r[0], r[1]]; };
          const S = integrate(f, [-mu * L * Math.sin(a0), a0, 0, 0], T, DT, EV);
          const X = [], xb = [], xc = [];
          for (const y of S.y) { X.push(y[0]); xb.push(y[0] + L * Math.sin(y[1])); xc.push((Mc * y[0] + m * (y[0] + L * Math.sin(y[1]))) / (Mc + m)); }
          // period from upward zero crossings of θ
          const cr = [];
          for (let k = 1; k < S.t.length; k++) { const a = S.y[k - 1][1], b = S.y[k][1]; if (a < 0 && b >= 0) cr.push(S.t[k - 1] + (S.dt * -a) / (b - a)); }
          const Tm = cr.length > 1 ? (cr[cr.length - 1] - cr[0]) / (cr.length - 1) : NaN;
          const kk = Math.sin(a0 / 2);
          const Tq = 4 * simpson((ph) => { const th = 2 * Math.asin(kk * Math.sin(ph)); return Math.sqrt((L * (1 - mu * Math.cos(th) ** 2)) / G) / Math.sqrt(1 - kk * kk * Math.sin(ph) ** 2); }, 0, Math.PI / 2, 400);
          let drift = 0; for (const x of xc) drift = Math.max(drift, Math.abs(x - xc[0]));
          return { S, X, xb, xc, Tm, Tq, Ts: TAU * Math.sqrt((L * (1 - mu)) / G), Tf: TAU * Math.sqrt(L / G), drift, m, mu, a0 };
        });
        const cart = (x, alpha) => {
          s.rect(x - 0.26, 0.05, x + 0.26, 0.25, { fill: 'blue', fillAlpha: 0.3 * alpha, color: 'blue', alpha, width: 1.6 });
          for (const dx of [-0.16, 0.16]) s.circle(x + dx, 0.045, 0.04, { color: 'ink', alpha, width: 1.4, fill: 'panel', fillAlpha: 1 });
        };
        v.animate((t) => {
          const R = sim(), k = frameAt(R.S, t), y = R.S.y[k], X = y[0], th = y[1];
          s.line(-2.4, 0, 2.4, 0, { color: 'muted', width: 2 }); s.line(-2.4, -0.012, 2.4, -0.012, { color: 'muted', width: 1, alpha: 0.5 });
          s.line(R.xc[k], -1.25, R.xc[k], 0.45, { color: 'green', width: 1.4, dash: [5, 4] });
          s.text('centre of mass', R.xc[k], 0.36, { color: 'green', size: 11, align: 'center' });
          for (let g = 4; g >= 1; g--) {
            const j = k - g * 25; if (j < 0) continue;
            const yy = R.S.y[j], bx = yy[0] + L * Math.sin(yy[1]), by = -L * Math.cos(yy[1]), al = 0.12 + 0.05 * (4 - g);
            cart(yy[0], al); s.line(yy[0], 0, bx, by, { color: 'ink', width: 1.5, alpha: al }); s.dot(bx, by, { r: 8, color: 'orange', alpha: al, ring: false });
          }
          const tr = []; for (let j = Math.max(0, k - 250); j <= k; j++) tr.push([R.xb[j], -L * Math.cos(R.S.y[j][1])]);
          s.path(tr, { color: 'gold', width: 3, alpha: 0.45 });
          if (R.drift < 1e-6) {
            const ax = (1 - R.mu) * L, amax = Math.min(Math.PI, R.a0 * 1.05);
            s.curve((u) => [R.xc[0] + ax * Math.sin(u), -L * Math.cos(u)], -amax, amax, { color: 'purple', width: 1.6, dash: [5, 4], n: 120 });
          }
          cart(X, 1);
          const bx = X + L * Math.sin(th), by = -L * Math.cos(th);
          s.line(X, 0, bx, by, { color: 'ink', width: 2.6 }); s.dot(X, 0, { r: 3.5, color: 'ink' });
          s.dot(bx, by, { r: 7 + 4 * Math.sqrt(R.m), color: 'orange' });
          if (clamp.value) s.text('clamped', X - 0.3, 0.15, { color: 'red', size: 11, align: 'right', weight: 600 });
          // plot
          p.setView(null, span([R.X, R.xb, R.xc], 0.12, 0.4));
          p.hline(0, { color: 'faint' });
          series(p, R.S.t, R.xb, k, { color: 'orange', width: 1.6 });
          series(p, R.S.t, R.X, k, { color: 'blue', width: 1.8 });
          series(p, R.S.t, R.xc, k, { color: 'green', width: 2.6 });
          p.vline(R.S.t[k], { color: 'gold', width: 1.2 });
        }, { period: T, still: 6.3 });
        v.legend([['blue', 'cart $X$'], ['orange', 'bob'], ['green', 'horizontal centre of mass'], ['purple', 'predicted bob path (ellipse)', { dash: true }]]);
        v.readout(() => {
          const R = sim();
          const head = String.raw`period: measured $${v.fix(R.Tm, 4)}$ s · energy-integral prediction $${v.fix(R.Tq, 4)}$ s · small-swing formula ${clamp.value ? '$2\\pi\\sqrt{\\ell/g}' : '$2\\pi\\sqrt{\\ell M/g(M+m)}'} = ${v.fix(R.Ts, 4)}$ s · fixed support $2\pi\sqrt{\ell/g} = ${v.fix(R.Tf, 4)}$ s`;
          return head + (clamp.value
            ? String.raw` · clamped: the rail pushes sideways and the centre of mass swings by $\pm${v.fix(R.drift / 2, 3)}$ m`
            : String.raw` · horizontal centre of mass constant to $${v.sci(Math.max(R.drift, 1e-17), 1)}$ m ($p_X$ conserved)`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.11
    {
      num: '6.11',
      kind: 'Model',
      name: 'Bead on a rotating hoop: a pitchfork bifurcation',
      statement: String.raw`A bead slides without friction on a circular hoop of radius $R$ that is driven to spin at constant angular velocity $\omega$ about its vertical diameter. With $\theta$ the angle from the bottom,
$$L = \tfrac12 mR^2(\dot\theta^2 + \omega^2\sin^2\theta) + mgR\cos\theta,\qquad \ddot\theta = \sin\theta\Big(\omega^2\cos\theta - \frac gR\Big).$$
The motion is that of a particle in the effective potential $U_{\rm eff}(\theta) = -mgR\cos\theta - \tfrac12 mR^2\omega^2\sin^2\theta$. For $\omega < \omega_c = \sqrt{g/R}$ the bottom $\theta = 0$ is the only stable equilibrium, with small-oscillation frequency $\sqrt{g/R - \omega^2}$. At $\omega = \omega_c$ it loses stability and two stable equilibria branch off at
$$\cos\theta^* = \frac{g}{R\omega^2},$$
with frequency $\omega\sin\theta^*$: a supercritical pitchfork bifurcation.`,
      scope: String.raw`Frictionless bead, hoop spun at exactly constant $\omega$ by a motor; with a little friction the bead settles at the stable equilibrium.`,
      idea: String.raw`The constraint is time-dependent (the hoop moves), but Lagrange’s equations (6.6) still hold. Since $L$ has no explicit $t$, the Jacobi integral $\tfrac12 mR^2\dot\theta^2 + U_{\rm eff}$ is conserved (it is not the energy: the motor does work, 7.8), so the analysis is that of a one-dimensional energy diagram (mech-3.12): equilibria are critical points of $U_{\rm eff}$ and the stable ones are its minima. $U_{\rm eff}''(0) = mR(g - R\omega^2)$ changes sign at $\omega_c$, and the new minima where $\cos\theta = g/R\omega^2$ appear symmetrically — the pitchfork. The centrifugal term $\tfrac12 mR^2\omega^2\sin^2\theta$ is exactly what one would add by hand in the rotating frame (9.6).`,
      caption: String.raw`Spin the hoop with the slider. Left: the bead on the spinning hoop (green dots: stable equilibria). Middle: the effective potential with the bead and its level $\tfrac12 R\dot\theta^2/g + U_{\rm eff}/mgR$; the bottom turns from a well into a hump at $\omega = \omega_c$. Bottom: the pitchfork diagram of equilibria against spin (solid stable, dashed unstable), with the bead’s angle. With light friction the bead settles on a branch; press *nudge* to kick it, or switch friction off and watch the Jacobi integral stay constant. The readout compares measured and predicted equilibrium angles and oscillation periods.`,
      deps: ['mech-6.6', 'mech-3.12'],
      refs: ['Taylor §7.5', 'Tong §2.5'],
      see: ['ode-8.5'],
      tags: ['bifurcation', 'stability', 'effective potential'],
      viz(v) {
        const R = 0.5, WC = Math.sqrt(G / R), B = 0.8;
        const wS = v.slider('spin $\\omega/\\omega_c$', 0, 2.5, 1.6, { step: 0.01 });
        const damp = v.toggle('light friction', true);
        let st = [0.25, 0], phi = 0, lastT = null, hist = [], trail = [];
        v.button('Nudge the bead', () => { st = [st[0], st[1] + 4]; });
        const s3 = v.stage3d({ range: 0.72, height: 290, yaw: -0.55, pitch: 0.22, axes: false, title: 'the spinning hoop' });
        const sU = v.stage({ x: [-Math.PI, Math.PI], y: [-2, 1.4], height: 290, axes: 'box', xlabel: 'θ', xticks: [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], title: 'effective potential $U_{\\rm eff}/mgR$' });
        const sP = v.stage({ x: [0, 2.5], y: [-3.85, 3.5], height: 220, full: true, axes: 'box', xlabel: 'ω/ωc', yticks: [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], title: 'equilibria $\\theta$ against spin: the pitchfork' });
        const rhs = (w, b) => (t, y) => [y[1], Math.sin(y[0]) * (w * w * Math.cos(y[0]) - G / R) - b * y[1]];
        const P3 = (th, ph) => [R * Math.sin(th) * Math.cos(ph), R * Math.sin(th) * Math.sin(ph), -R * Math.cos(th)];
        const ueff = (th, x) => -Math.cos(th) - 0.5 * x * x * Math.sin(th) ** 2;
        let info = null;
        v.animate((t) => {
          if (lastT === null || t < lastT) { st = [0.25, 0]; phi = 0; lastT = 0; hist = []; trail = []; }
          let dt = Math.min(t - lastT, 60); lastT = t;
          const x = wS.value, w = x * WC, F = rhs(w, damp.value ? B : 0);
          while (dt > 1e-9) { const d = Math.min(dt, 0.02), n = Math.ceil(d / 0.002); for (let i = 0; i < n; i++) st = rk4step(F, 0, st, d / n); phi += w * d; dt -= d; hist.push([t - dt, st[0], st[1]]); }
          while (hist.length && hist[0][0] < t - 12) hist.shift();
          const th = st[0];
          // ── 3D hoop
          s3.line([0, 0, -0.68], [0, 0, 0.68], { color: 'muted', width: 1.4, dash: [4, 4] });
          s3.arrow([0, 0, 0.6], [0, 0, 0.68], { color: 'muted', width: 1.4 });
          s3.curve((a) => P3(a, phi), 0, TAU, { color: 'ink', width: 2.6, n: 90 });
          s3.curve((a) => [0.12 * Math.cos(a), 0.12 * Math.sin(a), 0.6], 0, 1.6 * Math.PI, { color: 'muted', width: 1.2, n: 30 });
          s3.text('ω', [0.18, 0, 0.63], { color: 'muted', math: true });
          const eq = x <= 1 ? [0] : [Math.acos(1 / (x * x)), -Math.acos(1 / (x * x))];
          for (const e of eq) s3.dot(P3(e, phi), { r: 4, color: 'green' });
          trail.push(P3(th, phi)); if (trail.length > 90) trail.shift();
          s3.path(trail, { color: 'gold', width: 1.4, alpha: 0.55 });
          s3.dot(P3(th, phi), { r: 7, color: 'gold' });
          // ── effective potential
          let lo = 0; for (let a = -Math.PI; a <= Math.PI; a += 0.02) lo = Math.min(lo, ueff(a, x));
          sU.setView(null, [lo - 0.25, 1.35]);
          sU.fn((a) => ueff(a, x), { color: 'accent', width: 2.4, domain: [-Math.PI, Math.PI] });
          const hJ = (0.5 * R * st[1] * st[1]) / G + ueff(th, x);
          sU.hline(hJ, { color: 'gold', width: 1.2, dash: [5, 4] });
          for (const e of eq) sU.dot(e, ueff(e, x), { r: 4.5, color: 'green' });
          if (x > 1) sU.dot(0, ueff(0, x), { r: 4.5, color: 'red', hollow: true });
          sU.dot(wrap(th), ueff(th, x), { r: 7, color: 'gold' });
          // ── pitchfork
          sP.line(0, 0, 1, 0, { color: 'green', width: 2.6 }); sP.line(1, 0, 2.5, 0, { color: 'red', width: 1.8, dash: [6, 4] });
          for (const sg of [1, -1]) {
            sP.fn((u) => sg * Math.acos(1 / (u * u)), { domain: [1, 2.5], color: 'green', width: 2.6 });
            sP.line(0, sg * Math.PI, 2.5, sg * Math.PI, { color: 'red', width: 1.6, dash: [6, 4] });
          }
          sP.vline(x, { color: 'gold', width: 1.2 });
          sP.dot(x, wrap(th), { r: 6.5, color: 'gold' });
          info = { x, w, th, hJ };
        }, { still: 7 });
        v.legend([['green', 'stable equilibrium'], ['red', 'unstable', { dash: true }], ['gold', 'bead (and its Jacobi level)'], ['accent', '$U_{\\rm eff}$']]);
        v.readout(() => {
          if (!info) return '';
          const { x, w, th } = info, b = damp.value ? B : 0;
          const thS = x > 1 ? Math.acos(1 / (x * x)) : 0;
          const Om2 = x < 1 ? G / R - w * w : w * w * Math.sin(thS) ** 2, Wd = Om2 - (b * b) / 4;
          const pred = Wd > 0 ? TAU / Math.sqrt(Wd) : NaN;
          // measured period from successive maxima of θ in the last 12 s
          const pk = [];
          for (let i = 1; i < hist.length - 1; i++) if (hist[i][1] > hist[i - 1][1] && hist[i][1] >= hist[i + 1][1]) pk.push(hist[i][0]);
          const pl = pk.slice(-4), meas = pl.length >= 3 ? (pl[pl.length - 1] - pl[0]) / (pl.length - 1) : NaN;
          const settled = Math.abs(st[1]) < 0.01;
          let s = String.raw`$\omega = ${v.fix(x, 2)}\,\omega_c$ · predicted stable equilibria: ` + (x <= 1 ? String.raw`the bottom only` : String.raw`$\theta^* = \pm\arccos(g/R\omega^2) = \pm${v.fix(thS / DEG, 2)}°$ (bottom unstable)`);
          s += String.raw` · bead at $\theta = ${v.fix(wrap(th) / DEG, 2)}°$` + (settled ? ' (settled)' : '');
          if (isFinite(pred)) s += String.raw` · small-oscillation period: predicted $${v.fix(pred, 3)}$ s` + (isFinite(meas) && Math.abs(wrap(th) - (x > 1 ? Math.sign(th) * thS : 0)) < 0.6 && !settled ? String.raw`, measured $${v.fix(meas, 3)}$ s` : '');
          if (!damp.value) s += String.raw` · Jacobi integral $\tfrac12R\dot\theta^2/g + U_{\rm eff}/mgR = ${v.fix(info.hJ, 6)}$ (conserved)`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.12
    {
      num: '6.12',
      kind: 'Model',
      name: 'Spherical pendulum',
      statement: String.raw`A bob of mass $m$ on a massless rod of length $\ell$, free to swing in any direction about a fixed pivot, moves on a sphere. In spherical angles ($\theta$ from the downward vertical, azimuth $\varphi$),
$$L = \tfrac12 m\ell^2(\dot\theta^2 + \sin^2\theta\,\dot\varphi^2) + mg\ell\cos\theta .$$
$\varphi$ is cyclic, so $p_\varphi = m\ell^2\sin^2\theta\,\dot\varphi$ (the vertical angular momentum) is conserved, as is the energy; $\theta$ then oscillates between two turning angles, and the horizontal projection of the path is a rosette whose apsides advance. The conical pendulum $\dot\varphi^2 = g/(\ell\cos\theta)$ and the planar pendulum $p_\varphi = 0$ are special cases. For small oscillations with horizontal semi-axes $a, b$ the apsides advance in the sense of the motion by $\tfrac{3\pi}{8}\,ab/\ell^2$ from one maximum of the horizontal radius to the next.`,
      scope: String.raw`Frictionless pivot and massless rigid rod; the apsidal-advance formula is the small-amplitude limit.`,
      idea: String.raw`Rotational symmetry about the vertical makes $\varphi$ a cyclic coordinate, so $p_\varphi$ is a live constant (6.8), just like the angular momentum of a central force (mech-2.10). Substituting it into the energy leaves one-dimensional motion in $\theta$ with an effective potential (7.12). To lowest order the bob is an isotropic two-dimensional oscillator, whose orbits are fixed ellipses; the first nonlinear correction makes the ellipse precess slowly, at the rate $\tfrac38\,\omega_0\,ab/\ell^2$. Here the motion is integrated in Cartesian coordinates with the rod tension as a Lagrange multiplier, so the conservation of $p_\varphi$ is a check, not an input.`,
      caption: String.raw`The bob is simulated in 3D (drag to rotate) with the rod tension solved for at every step. Right: the view from above, with each maximum of the horizontal radius marked (red) — successive maxima advance around the circle. Set the release angle and the initial sideways speed as a fraction of the conical-pendulum value: 1 gives a conical pendulum (a circle), 0 a planar swing (a line), in between a rosette. The readout keeps $p_\varphi$ and $E$ as live constants and compares the measured apsidal advance with the small-amplitude prediction.`,
      deps: ['mech-6.6', 'mech-2.10'],
      refs: ['Tong §2.5'],
      tags: ['pendulum', 'precession', 'cyclic coordinate'],
      viz(v) {
        const Lr = 1, T = 40, DT = 0.002, EV = 5;
        const th0 = v.slider('release angle $\\theta_0$', 5, 80, 35, { step: 1, fmt: deg });
        const fr = v.slider('sideways speed / conical speed', -1.4, 1.4, 0.45, { step: 0.01 });
        const s3 = v.stage3d({ range: 1.15, height: 320, yaw: -0.7, pitch: 0.3, axes: false, title: 'the bob on its sphere' });
        const sT = v.stage({ x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, height: 320, axes: false, title: 'seen from above: apsides advance' });
        const cache = memo();
        const sim = () => cache(`${th0.value}|${fr.value}`, () => {
          const a = th0.value * DEG, wc = Math.sqrt(G / (Lr * Math.cos(a))), phd = fr.value * wc;
          const f = (t, s) => { const [x, y, z, u, w, q] = s, lam = -(u * u + w * w + q * q - G * z) / (x * x + y * y + z * z); return [u, w, q, lam * x, lam * y, -G + lam * z]; };
          const S = integrate(f, [Lr * Math.sin(a), 0, -Lr * Math.cos(a), 0, Lr * Math.sin(a) * phd, 0], T, DT, EV);
          const pphi = [], E = [], rho = [], drift = [];
          for (const [x, y, z, u, w, q] of S.y) { pphi.push(x * w - y * u); E.push(0.5 * (u * u + w * w + q * q) + G * z); rho.push(Math.hypot(x, y)); drift.push(Math.abs(Math.hypot(x, y, z) - Lr)); }
          const maxima = [];
          for (let k = 1; k < rho.length - 1; k++) if (rho[k] > rho[k - 1] && rho[k] >= rho[k + 1]) {
            const d = rho[k - 1] - 2 * rho[k] + rho[k + 1], off = d < 0 ? (0.5 * (rho[k - 1] - rho[k + 1])) / d : 0, j = off > 0 ? k : k - 1, fo = off > 0 ? off : 1 + off;
            const P = S.y[j], Q = S.y[j + 1], px = P[0] + fo * (Q[0] - P[0]), py = P[1] + fo * (Q[1] - P[1]);
            maxima.push({ k, t: S.t[k], ang: Math.atan2(py, px), x: px, y: py });
          }
          const sgn = Math.sign(pphi[0]) || 0, adv = [];
          for (let i = 1; i < maxima.length; i++) adv.push(sgn * wrap(maxima[i].ang - maxima[i - 1].ang - Math.PI));
          let aMax = 0, bMin = Infinity; for (const r of rho) { aMax = Math.max(aMax, r); bMin = Math.min(bMin, r); }
          const pred = ((3 * Math.PI) / 8) * aMax * bMin / (Lr * Lr);
          return { S, pphi, E, rho, drift, maxima, adv, aMax, bMin, pred, wc };
        });
        v.animate((t) => {
          const R = sim(), k = frameAt(R.S, t), [x, y, z] = R.S.y[k];
          s3.surface((u, w) => [Lr * Math.sin(u) * Math.cos(w), Lr * Math.sin(u) * Math.sin(w), -Lr * Math.cos(u)], [0, Math.PI / 2], [0, TAU], { nu: 9, nv: 24, color: 'accent', alpha: 0.1, wire: true, shade: false });
          s3.line([0, 0, 0], [0, 0, -1.1], { color: 'faint', width: 1, dash: [4, 4] });
          s3.curve((w) => [Math.cos(w), Math.sin(w), 0], 0, TAU, { color: 'faint', width: 1, n: 60 });
          const tr = []; for (let j = Math.max(0, k - 900); j <= k; j++) tr.push(R.S.y[j].slice(0, 3));
          s3.path(tr, { color: 'gold', width: 1.6, alpha: 0.85 });
          s3.line([0, 0, 0], [x, y, z], { color: 'ink', width: 2.4 });
          s3.dot([0, 0, 0], { r: 3.5, color: 'ink' });
          s3.dot([x, y, z], { r: 8, color: 'orange' });
          // top view
          sT.circle(0, 0, Lr, { color: 'faint', width: 1, dash: [3, 4] });
          sT.line(-1.05, 0, 1.05, 0, { color: 'faint', width: 1 }); sT.line(0, -1.05, 0, 1.05, { color: 'faint', width: 1 });
          const tp = []; for (let j = Math.max(0, k - 800); j <= k; j++) tp.push([R.S.y[j][0], R.S.y[j][1]]);
          sT.path(tp, { color: 'gold', width: 1.4, alpha: 0.8 });
          for (const mx of R.maxima) if (mx.k <= k && mx.k > k - 800) { sT.line(0, 0, mx.x, mx.y, { color: 'red', width: 1, alpha: 0.35 }); sT.dot(mx.x, mx.y, { r: 3.5, color: 'red' }); }
          sT.dot(x, y, { r: 6.5, color: 'orange' });
        }, { period: T, still: 26 });
        v.legend([['gold', 'path of the bob'], ['red', 'maxima of the horizontal radius (apsides)'], ['orange', 'bob']]);
        v.readout((t) => {
          const R = sim(), k = frameAt(R.S, t);
          let dp = 0, dE = 0, dr = 0;
          for (let j = 0; j <= k; j++) { dp = Math.max(dp, Math.abs(R.pphi[j] - R.pphi[0])); dE = Math.max(dE, Math.abs(R.E[j] - R.E[0])); dr = Math.max(dr, R.drift[j]); }
          const n = R.adv.length, avg = n ? R.adv.reduce((a, b) => a + b, 0) / n : NaN;
          const tail = Math.abs(fr.value) < 0.005 ? 'planar swing: $p_\\varphi = 0$, the path is a line through the centre and nothing precesses'
            : Math.abs(Math.abs(fr.value) - 1) < 0.01 ? String.raw`conical pendulum: the bob circles at $\dot\varphi = \sqrt{g/\ell\cos\theta_0} = ${v.fix(R.wc, 3)}$ rad/s and $\theta$ stays put`
              : String.raw`apsidal advance between successive maxima: measured $${v.fix(avg / DEG, 2)}°$ (average of ${n}), small-amplitude prediction $\tfrac{3\pi}{8}ab/\ell^2 = ${v.fix(R.pred / DEG, 2)}°$ with $a = ${v.fix(R.aMax, 3)}$, $b = ${v.fix(R.bMin, 3)}$`;
          return String.raw`$p_\varphi/m = x\dot y - y\dot x = ${v.fix(R.pphi[k], 5)}$ m²/s, constant to $${v.sci(Math.max(dp, 1e-16), 1)}$ · energy constant to $${v.sci(Math.max(dE, 1e-16), 1)}$ · rod-length error $${v.sci(Math.max(dr, 1e-16), 1)}$ · ${tail}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.13
    {
      num: '6.13',
      kind: 'Method',
      name: 'Lagrange multipliers and constraint forces',
      statement: String.raw`To find a constraint force, keep the constrained coordinate and impose the constraint $f(q,t) = 0$ with a multiplier. The equations of motion become
$$\frac{d}{dt}\frac{\partial L}{\partial\dot q_j} - \frac{\partial L}{\partial q_j} = \lambda\,\frac{\partial f}{\partial q_j},\qquad f(q,t) = 0,$$
$n+1$ equations for the $n$ coordinates and $\lambda(t)$; the generalized force of constraint is $\lambda\,\partial f/\partial q_j$. For a particle on a smooth sphere of radius $R$ with $f = r - R$, the multiplier is the normal force, $\lambda = m(g\cos\theta - R\dot\theta^2)$ for $\theta$ measured from the top. A one-sided constraint (a surface that can push but not pull) holds only while $\lambda \ge 0$: a particle sliding from the top of a smooth hemisphere leaves it where $\lambda = 0$, at $\cos\theta = \tfrac23$ when it starts from rest at the top, and at $\cos\theta = \tfrac13(2\cos\theta_0 + v_0^2/gR)$ in general.`,
      idea: String.raw`The multiplier rule for constrained extrema (mech-5.10) carries over to the action: stationarity of $\int L\,dt$ among paths satisfying $f = 0$ is stationarity of $\int(L + \lambda f)\,dt$ among all paths, which adds $\lambda\,\partial f/\partial q_j$ to Lagrange’s equations (6.6). For the sphere the radial equation $m\ddot r - mr\dot\theta^2 + mg\cos\theta = \lambda$ with $\ddot r = 0$ gives $\lambda$; energy conservation gives $R\dot\theta^2 = v_0^2/R + 2g(\cos\theta_0 - \cos\theta)$, so $\lambda = mg(3\cos\theta - 2\cos\theta_0) - mv_0^2/R$, which reaches zero at the angle quoted. After that the same equations with $\lambda = 0$ describe free flight.`,
      caption: String.raw`A particle slides from near the top of a smooth hemisphere. The equations in $(r,\theta)$ with the multiplier are integrated; the orange arrows are $\lambda$ times the outward normal — the normal force — drawn along the path and plotted against $\theta$ on the right (solid: from the multiplier; dashed: the energy prediction). Where $\lambda$ reaches zero the surface would have to pull, so the particle leaves and flies on a parabola. Change the start angle and speed; switch to a *bead on a wire* (two-sided constraint) and $\lambda$ simply turns negative as the bead goes round.`,
      deps: ['mech-6.6', 'mech-5.10'],
      refs: ['Taylor §7.10', 'Goldstein §2.4'],
      tags: ['constraint forces', 'Lagrange multiplier'],
      viz(v) {
        const R = 1;
        const th0 = v.slider('start angle $\\theta_0$', 0.5, 40, 3, { step: 0.5, fmt: (x) => `${v.fix(x, 1)}°` });
        const v0 = v.slider('start speed $v_0/\\sqrt{gR}$', 0, 1.2, 0, { step: 0.01 });
        const mode = v.select('', [{ value: 'one', label: 'smooth hemisphere (one-sided)' }, { value: 'two', label: 'bead on a wire (two-sided)' }], 'one');
        const s = v.stage({ x: [-1.4, 2.3], y: [-0.2, 1.7], equal: true, height: 300, axes: false, weight: 1.25, title: 'the multiplier is the normal force' });
        const pl = v.stage({ x: [0, 100], y: [-3, 1.2], height: 300, axes: 'box', weight: 1, xlabel: 'θ (°)', title: '$\\lambda/mg$ along the motion' });
        const cache = memo();
        const sim = () => cache(`${th0.value}|${v0.value}|${mode.value}`, () => {
          const two = mode.value === 'two', a0 = th0.value * DEG, vv = v0.value * Math.sqrt(G * R);
          const lamOf = (y) => G * Math.cos(y[1]) - y[0] * y[3] * y[3]; // per unit mass, on the surface
          const fOn = (t, y) => [0, y[3], 0, (G / R) * Math.sin(y[1])];
          const fOff = (t, y) => [y[2], y[3], y[0] * y[3] * y[3] - G * Math.cos(y[1]), (G * Math.sin(y[1]) - 2 * y[2] * y[3]) / y[0]];
          const dt = 0.001, out = { t: [0], y: [[R, a0, 0, vv / R]], lam: [], on: [true] };
          let y = out.y[0], t = 0, on = lamOf(y) > 0 || two, tDep = on ? null : 0, yDep = on ? null : y;
          if (!on) out.on[0] = false;
          out.lam.push(on ? lamOf(y) : 0);
          while (t < 6) {
            let yn = rk4step(on ? fOn : fOff, t, y, dt), h = dt;
            if (on && !two && lamOf(yn) < 0) {
              let lo = 0, hi = dt;
              for (let it = 0; it < 50; it++) { const mid = (lo + hi) / 2; if (lamOf(rk4step(fOn, t, y, mid)) > 0) lo = mid; else hi = mid; }
              h = (lo + hi) / 2; yn = rk4step(fOn, t, y, h); on = false; tDep = t + h; yDep = yn;
            }
            t += h; y = yn;
            out.t.push(t); out.y.push(y); out.on.push(on); out.lam.push(on ? lamOf(y) : 0);
            if (!on && y[0] * Math.cos(y[1]) < 0) break;
            if (two && y[1] > a0 + TAU) break;
          }
          return { ...out, tDep, yDep, two, a0, vv };
        });
        const idx = (S, t) => { let lo = 0, hi = S.t.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S.t[m] < t) lo = m; else hi = m; } return hi; };
        const pos = (y) => [y[0] * Math.sin(y[1]), y[0] * Math.cos(y[1])];
        v.animate((t) => {
          const S = sim(), tEnd = S.t[S.t.length - 1], k = idx(S, Math.min(t, tEnd)), y = S.y[k], two = S.two;
          // scene
          s.setView(two ? [-1.6, 1.6] : [-1.4, 2.3], two ? [-1.25, 1.55] : [-0.2, 1.7]);
          const kf = two ? 0.16 : 0.3;
          if (!two) s.line(-2, 0, 2.8, 0, { color: 'muted', width: 2 });
          if (two) s.circle(0, 0, R, { color: 'ink', width: 2.4 });
          else { s.poly(Array.from({ length: 61 }, (_, i) => [R * Math.cos((Math.PI * i) / 60), R * Math.sin((Math.PI * i) / 60)]), { fill: 'blue', fillAlpha: 0.18, color: 'blue', width: 2 }); }
          const path = []; for (let j = 0; j <= k; j++) path.push(pos(S.y[j]));
          s.path(path, { color: 'gold', width: 2, alpha: 0.9 });
          let nextA = Math.ceil(S.y[0][1] / (8 * DEG)) * 8 * DEG;
          for (let j = 0; j <= k; j++) {
            if (!S.on[j] || S.y[j][1] < nextA) continue; nextA += 8 * DEG;
            const p = pos(S.y[j]), n = [Math.sin(S.y[j][1]), Math.cos(S.y[j][1])], L = S.lam[j] / G;
            if (Math.abs(L) > 0.02) s.arrow(p[0], p[1], p[0] + kf * L * n[0], p[1] + kf * L * n[1], { color: 'orange', width: 1.4, alpha: 0.55, head: 6 });
          }
          const p = pos(y);
          if (S.on[k]) { const n = [Math.sin(y[1]), Math.cos(y[1])], L = S.lam[k] / G; if (Math.abs(L) > 0.01) s.arrow(p[0], p[1], p[0] + kf * L * n[0], p[1] + kf * L * n[1], { color: 'orange', width: 2.6, head: 9 }); }
          if (S.yDep) { const q = pos(S.yDep); s.dot(q[0], q[1], { r: 4, color: 'red' }); s.line(0, 0, q[0], q[1], { color: 'red', width: 1, dash: [4, 4] }); s.text('leaves here', q[0], q[1], { color: 'red', size: 11, dx: 8, dy: -10 }); }
          s.dot(p[0], p[1], { r: 7, color: 'gold' });
          // λ plot against θ (degrees)
          const thMax = two ? 360 : 100;
          pl.setView([0, thMax], two ? [-6.5, 1.5] : [-3, 1.3]);
          pl.setTicks(two ? [0, 90, 180, 270, 360] : null, null);
          if (!two) pl.rect(0, -10, thMax, 0, { fill: 'red', fillAlpha: 0.06, stroke: false });
          pl.hline(0, { color: 'muted', width: 1 });
          const c0 = Math.cos(S.a0), w2 = (S.vv * S.vv) / (G * R);
          pl.fn((d) => 3 * Math.cos(d * DEG) - 2 * c0 - w2, { color: 'orange', width: 1.4, dash: [5, 4], domain: [th0.value, thMax] });
          const pts = []; for (let j = 0; j <= k; j++) if (S.on[j]) pts.push([S.y[j][1] / DEG, S.lam[j] / G]);
          pl.path(pts, { color: 'orange', width: 2.8 });
          if (S.yDep) { const d = S.yDep[1] / DEG; pl.vline(d, { color: 'red', width: 1.2, dash: [4, 3] }); pl.dot(d, 0, { r: 5, color: 'red' }); }
          if (!two) pl.text('a surface cannot pull: λ < 0', thMax * 0.04, -2.6, { color: 'red', size: 11 });
        }, { period: 4, still: 1.9 });
        v.legend([['orange', 'normal force $\\lambda\\,\\hat{\\mathbf r}$ / multiplier $\\lambda$'], ['orange', 'energy prediction $mg(3\\cos\\theta - 2\\cos\\theta_0) - mv_0^2/R$', { dash: true }], ['gold', 'path']]);
        v.readout(() => {
          const S = sim(), pred = (2 * Math.cos(S.a0) + (S.vv * S.vv) / (G * R)) / 3;
          if (S.two) {
            let mn = Infinity; for (const l of S.lam) mn = Math.min(mn, l);
            return String.raw`two-sided constraint: the wire holds the bead all the way round; $\lambda$ goes negative where it must pull inward (minimum $\lambda/mg = ${v.fix(mn / G, 3)}$) — it is simply the force needed to keep $r = R$`;
          }
          if (!S.yDep) return 'the particle stays on the surface in the time shown';
          const cm = Math.cos(S.yDep[1]);
          return String.raw`leaves the surface where the multiplier reaches zero: measured $\theta = ${v.fix(S.yDep[1] / DEG, 3)}°$, $\cos\theta = ${v.fix(cm, 5)}$ · predicted $\cos\theta = \tfrac13\big(2\cos\theta_0 + v_0^2/gR\big) = ${v.fix(Math.min(pred, 1), 5)}$` + (S.tDep === 0 ? ' (already at the start: $v_0^2 > gR\\cos\\theta_0$)' : (th0.value <= 0.5 && v0.value === 0 ? ' — essentially the textbook 2/3' : ''));
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.14
    {
      num: '6.14',
      kind: 'Model',
      name: 'Charged particle: velocity-dependent potential',
      statement: String.raw`A particle of charge $q$ and mass $m$ in electromagnetic potentials $\phi(\mathbf r,t)$, $\mathbf A(\mathbf r,t)$ has the Lagrangian
$$L = \tfrac12 m|\dot{\mathbf r}|^2 - q\phi + q\,\dot{\mathbf r}\cdot\mathbf A ,$$
whose Euler–Lagrange equations are exactly the Lorentz-force law $m\ddot{\mathbf r} = q(\mathbf E + \dot{\mathbf r}\times\mathbf B)$ with $\mathbf E = -\nabla\phi - \partial_t\mathbf A$ and $\mathbf B = \nabla\times\mathbf A$. The canonical momentum is $\mathbf p = m\dot{\mathbf r} + q\mathbf A$, not $m\dot{\mathbf r}$. A gauge transformation $\mathbf A\to\mathbf A + \nabla\chi$, $\phi\to\phi - \partial_t\chi$ changes $L$ by the total derivative $q\,d\chi/dt$: the motion is unchanged, but the canonical momentum shifts by $q\nabla\chi$, and which coordinates are cyclic depends on the gauge.`,
      idea: String.raw`Compute $\tfrac{d}{dt}\partial L/\partial\dot{\mathbf r} = m\ddot{\mathbf r} + q(\partial_t\mathbf A + (\dot{\mathbf r}\cdot\nabla)\mathbf A)$ and $\partial L/\partial\mathbf r = -q\nabla\phi + q\nabla(\dot{\mathbf r}\cdot\mathbf A)$; the vector identity $\nabla(\dot{\mathbf r}\cdot\mathbf A) - (\dot{\mathbf r}\cdot\nabla)\mathbf A = \dot{\mathbf r}\times(\nabla\times\mathbf A)$ turns Lagrange’s equations (6.6) into the Lorentz law, the uniform-field case of which is cyclotron motion (mech-1.18). The magnetic term is a *velocity-dependent potential*: it does no work but bends the path. Since a gauge change adds a total time derivative, it leaves the motion alone (6.16). In the Landau gauge $\mathbf A = (0, Bx, 0)$ the coordinate $y$ is absent from $L$, so $p_y = m\dot y + qBx$ is conserved — it labels the centre of the cyclotron orbit.`,
      caption: String.raw`A charge circles in a uniform magnetic field $B$ (out of the page), drifting if you add an electric field $E$ along $x$. Blue: integrated from $L$ in the symmetric gauge $\mathbf A = \tfrac12 B(-y, x)$; gold dashes: integrated from $L$ in the gauge you choose (its $\mathbf A$ is drawn as faint arrows) — the paths coincide. Right: the canonical momentum $p_y$ in both gauges and the mechanical momentum $m\dot y$ (the same in both). In the Landau gauge $\mathbf A = (0, Bx)$, $p_y$ is a live constant; in the others it oscillates — conservation laws read off from $L$ depend on the gauge, the motion does not.`,
      deps: ['mech-6.6', 'mech-1.18'],
      refs: ['Taylor §7.9', 'Goldstein §1.5'],
      tags: ['electromagnetism', 'gauge', 'canonical momentum'],
      viz(v) {
        const B = 1, T = 8 * Math.PI, DT = 0.005, EV = 4;
        const GA = {
          land: { label: 'Landau $\\mathbf A = (0, Bx)$', A: (x, y) => [0, B * x] },
          land2: { label: 'Landau $\\mathbf A = (-By, 0)$', A: (x, y) => [-B * y, 0] },
          wavy: { label: '$\\chi = 0.8\\sin x\\cos y$', A: (x, y) => [-0.5 * B * y + 0.8 * Math.cos(x) * Math.cos(y), 0.5 * B * x - 0.8 * Math.sin(x) * Math.sin(y)] },
        };
        const sel = v.select('second gauge', Object.entries(GA).map(([value, g]) => ({ value, label: g.label })), 'land');
        const Ef = v.slider('electric field $E$ along $x$', 0, 0.5, 0.2, { step: 0.01 });
        const s = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 330, axes: false, weight: 1.1, title: 'the orbit, from two different Lagrangians' });
        const pl = v.stage({ x: [0, T], y: [-2, 2], height: 330, axes: 'box', weight: 1, xlabel: 't', title: 'canonical $p_y$ (two gauges) and mechanical $m\\dot y$' });
        const As = (x, y) => [-0.5 * B * y, 0.5 * B * x];
        const cache = memo();
        const sim = () => cache(`${sel.value}|${Ef.value}`, () => {
          const E = Ef.value, mk = (A) => (q, qd) => { const a = A(q[0], q[1]); return 0.5 * (qd[0] * qd[0] + qd[1] * qd[1]) + E * q[0] + qd[0] * a[0] + qd[1] * a[1]; };
          const run = (L) => integrate((t, z) => { const a = lagrangeAccel(L, [z[0], z[1]], [z[2], z[3]], t); return [z[2], z[3], a[0], a[1]]; }, [0.5, 1, 1.2, 0], T, DT, EV);
          const S1 = run(mk(As)), S2 = run(mk(GA[sel.value].A));
          const py1 = S1.y.map((z) => z[3] + As(z[0], z[1])[1]), py2 = S2.y.map((z) => z[3] + GA[sel.value].A(z[0], z[1])[1]), mv = S1.y.map((z) => z[3]);
          let gap = 0; for (let k = 0; k < S1.y.length; k++) gap = Math.max(gap, Math.hypot(S1.y[k][0] - S2.y[k][0], S1.y[k][1] - S2.y[k][1]));
          return { S1, S2, py1, py2, mv, gap };
        });
        v.animate((t) => {
          const R = sim(), k = frameAt(R.S1, t), Aq = GA[sel.value].A;
          const xs = R.S1.y.map((z) => z[0]), ys = R.S1.y.map((z) => z[1]), xr = span([xs], 0.1, 2.5), yr = span([ys], 0.1, 2.5);
          s.setView(xr, yr);
          const b = s.bounds, nx = 9, ny = 9;
          for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
            const x = b.x[0] + ((i + 0.5) / (nx + 1)) * (b.x[1] - b.x[0]), y = b.y[0] + ((j + 0.5) / (ny + 1)) * (b.y[1] - b.y[0]), a = Aq(x, y), sc = 0.12;
            s.arrow(x - (sc * a[0]) / 2, y - (sc * a[1]) / 2, x + (sc * a[0]) / 2, y + (sc * a[1]) / 2, { color: 'orange', width: 1.1, alpha: 0.45, head: 5 });
          }
          s.text('B ⊙', b.x[1], b.y[1], { color: 'muted', size: 12, align: 'right', dx: -8, dy: 12 });
          s.path(R.S1.y.map((z) => [z[0], z[1]]), { color: 'blue', width: 1.2, alpha: 0.2 });
          s.path(R.S1.y.slice(0, k + 1).map((z) => [z[0], z[1]]), { color: 'blue', width: 3, alpha: 0.75 });
          s.path(R.S2.y.slice(0, k + 1).map((z) => [z[0], z[1]]), { color: 'gold', width: 1.8, dash: [6, 5] });
          const z = R.S1.y[k]; s.dot(z[0], z[1], { r: 6.5, color: 'blue' });
          s.arrow(z[0], z[1], z[0] + 0.5 * z[2], z[1] + 0.5 * z[3], { color: 'ink', width: 1.6, head: 7 });
          pl.setView(null, span([R.py1, R.py2, R.mv], 0.12, 1));
          pl.hline(0, { color: 'faint' });
          series(pl, R.S1.t, R.mv, k, { color: 'ink', width: 1.4, dash: [4, 3] });
          series(pl, R.S1.t, R.py1, k, { color: 'blue', width: 2 });
          series(pl, R.S2.t, R.py2, k, { color: 'gold', width: 2.6 });
          pl.vline(R.S1.t[k], { color: 'gold', width: 1.2 });
        }, { period: T, still: 15 });
        v.legend([['blue', 'symmetric gauge: path and $p_y$'], ['gold', 'second gauge: path and $p_y$'], ['ink', 'mechanical $m\\dot y$', { dash: true }], ['orange', '$\\mathbf A$ of the second gauge']]);
        v.readout((t) => {
          const R = sim(), k = frameAt(R.S1, t);
          let d1 = 0, d2 = 0; for (let j = 0; j <= k; j++) { d1 = Math.max(d1, Math.abs(R.py1[j] - R.py1[0])); d2 = Math.max(d2, Math.abs(R.py2[j] - R.py2[0])); }
          const cyc = sel.value === 'land' ? String.raw` — $y$ is cyclic in this gauge, so $p_y = m\dot y + qBx$ is conserved` : sel.value === 'land2' ? String.raw` — here $x$ would be cyclic were it not for $\phi = -Ex$` : '';
          return String.raw`largest distance between the two paths: $${v.sci(R.gap, 2)}$ (orbit radius 1.2) · $p_y$ varies by $${v.fix(d1, 3)}$ in the symmetric gauge and by $${v.sci(Math.max(d2, 1e-16), 2)}$ in the second${cyc} · drift speed measured $${v.fix(Math.abs(R.S1.y[R.S1.y.length - 1][1] - R.S1.y[0][1]) / T, 3)}$ vs $E/B = ${v.fix(Ef.value / B, 3)}$ (over four whole turns)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.15
    {
      num: '6.15',
      kind: 'Definition',
      name: 'Rayleigh dissipation function',
      statement: String.raw`If the frictional forces are linear in the velocities, $\mathbf F_i^{\rm fr} = -k_i\,\dot{\mathbf r}_i$ (or, more generally, derive from a quadratic form), they can be written as $Q_j^{\rm fr} = -\partial\mathcal F/\partial\dot q_j$ for the **Rayleigh dissipation function**
$$\mathcal F = \tfrac12\sum_i k_i|\dot{\mathbf r}_i|^2 = \tfrac12\sum_{j,l} b_{jl}(q)\,\dot q_j\dot q_l ,$$
and Lagrange’s equations become $\tfrac{d}{dt}\partial L/\partial\dot q_j - \partial L/\partial q_j + \partial\mathcal F/\partial\dot q_j = 0$. For a natural system the mechanical energy then decays at exactly twice the dissipation function, $dE/dt = -2\mathcal F$. If instead $\mathcal F$ is homogeneous of degree $n$ in the velocities (quadratic drag gives $n = 3$), $dE/dt = -n\mathcal F$.`,
      idea: String.raw`With $Q_j^{\rm fr}$ in Lagrange’s equations (6.6), the energy equation becomes $dE/dt = \sum_j\dot q_j Q_j^{\rm fr} = -\sum_j\dot q_j\,\partial\mathcal F/\partial\dot q_j$, and Euler’s theorem on homogeneous functions turns this sum into $n\mathcal F$ — so $2\mathcal F$ for linear friction, the damped oscillator’s $b\dot x^2$ (mech-4.7). A dashpot between two masses contributes $\tfrac12 b(\dot x_2 - \dot x_1)^2$, a single term that produces equal and opposite forces on the two.`,
      caption: String.raw`Two masses joined by springs to a wall and to each other, with a dashpot to the wall ($b_1$) and one between the masses ($b_2$). The friction forces are obtained by differentiating $\mathcal F$ numerically and fed into Lagrange’s equations. Left plot: the measured rate of energy loss $-dE/dt$ (dots, differentiated from the simulated energy) lies on $2\mathcal F$ (line) at every instant. Switch to quadratic dampers: the dots move onto $3\mathcal F$ — the factor is the degree of homogeneity.`,
      deps: ['mech-6.6', 'mech-4.7'],
      refs: ['Goldstein §1.5'],
      credit: 'Rayleigh, 1873',
      tags: ['dissipation', 'damping', 'energy'],
      viz(v) {
        const k1 = 6, k2 = 4, m1 = 1, m2 = 1, T = 14, DT = 0.002, EV = 5;
        const b1 = v.slider('dashpot to the wall $b_1$', 0, 1, 0.15, { step: 0.01 });
        const b2 = v.slider('dashpot between the masses $b_2$', 0, 1, 0.12, { step: 0.01 });
        const law = v.select('damping law', [{ value: 1, label: 'linear: $\\mathcal F = \\tfrac12 b v^2$' }, { value: 2, label: 'quadratic: $\\mathcal F = \\tfrac13 b|v|^3$' }], 1);
        const s = v.stage({ x: [-0.2, 4.4], y: [-0.55, 0.65], equal: true, height: 160, full: true, axes: false });
        const pw = v.stage({ x: [0, T], y: [0, 1], height: 230, axes: 'box', xlabel: 't (s)', title: 'power lost: $-dE/dt$ (dots) vs $n\\mathcal F$' });
        const en = v.stage({ x: [0, T], y: [0, 1], height: 230, axes: 'box', xlabel: 't (s)', title: 'mechanical energy $E$ (J)' });
        const cache = memo();
        const sim = () => cache(`${b1.value}|${b2.value}|${law.value}`, () => {
          const B1 = b1.value, B2 = b2.value, n = law.value + 1;
          const Fd = (v1, v2) => { const w = v2 - v1; return n === 2 ? 0.5 * B1 * v1 * v1 + 0.5 * B2 * w * w : (B1 * Math.abs(v1) ** 3 + B2 * Math.abs(w) ** 3) / 3; };
          const h = 1e-6, dF = (v1, v2) => [(Fd(v1 + h, v2) - Fd(v1 - h, v2)) / (2 * h), (Fd(v1, v2 + h) - Fd(v1, v2 - h)) / (2 * h)];
          const f = (t, z) => { const [x1, x2, v1, v2] = z, d = dF(v1, v2); return [v1, v2, (-k1 * x1 + k2 * (x2 - x1) - d[0]) / m1, (-k2 * (x2 - x1) - d[1]) / m2]; };
          const S = integrate(f, [0.35, -0.3, 0, 0], T, DT, EV);
          const E = S.y.map(([x1, x2, v1, v2]) => 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2 + 0.5 * k1 * x1 * x1 + 0.5 * k2 * (x2 - x1) ** 2);
          const F = S.y.map((z) => Fd(z[2], z[3])), dE = deriv5(E, S.dt).map((x) => -x);
          let num = 0, den = 0; for (let i = 2; i < E.length - 2; i++) { num += dE[i] * F[i]; den += F[i] * F[i]; }
          return { S, E, F, dE, n, ratio: num / den };
        });
        let now = null;
        v.animate((t) => {
          const R = sim(), k = frameAt(R.S, t), [x1, x2] = R.S.y[k], p1 = 1.4 + x1, p2 = 3.0 + x2, hb = 0.2;
          s.rect(-0.2, -0.5, 0, 0.6, { fill: 'muted', fillAlpha: 0.35, color: 'muted' });
          s.line(-0.2, -0.5, 4.4, -0.5, { color: 'muted', width: 1.5 });
          spring(s, [0, 0.2], [p1 - hb, 0.2], { coils: 8, amp: 0.06 }); spring(s, [p1 + hb, 0.2], [p2 - hb, 0.2], { coils: 8, amp: 0.06 });
          dashpot(s, 0, p1 - hb, -0.18, 'orange'); dashpot(s, p1 + hb, p2 - hb, -0.18, 'purple');
          s.rect(p1 - hb, -0.34, p1 + hb, 0.34, { fill: 'blue', fillAlpha: 0.35, color: 'blue', width: 1.6 }); s.tex('m_1', p1, 0, { size: 13 });
          s.rect(p2 - hb, -0.34, p2 + hb, 0.34, { fill: 'blue', fillAlpha: 0.35, color: 'blue', width: 1.6 }); s.tex('m_2', p2, 0, { size: 13 });
          s.text('b₁', (p1 - hb) / 2, -0.38, { color: 'orange', size: 11, align: 'center' }); s.text('b₂', (p1 + p2) / 2, -0.38, { color: 'purple', size: 11, align: 'center' });
          const nF = R.F.map((x) => R.n * x), lim = Math.max(...nF, ...R.dE.slice(2, -2)) * 1.1 || 1;
          pw.setView(null, [-0.04 * lim, lim]);
          series(pw, R.S.t, nF, k, { color: 'accent', width: 2.2 });
          if (R.n === 3) series(pw, R.S.t, R.F.map((x) => 2 * x), k, { color: 'muted', width: 1.2, dash: [4, 4] });
          const d = []; for (let j = 2; j <= Math.min(k, R.E.length - 3); j += 6) d.push([R.S.t[j], R.dE[j]]);
          pw.dots(d, { r: 2.6, color: 'red' });
          pw.vline(R.S.t[k], { color: 'gold', width: 1.2 });
          en.setView(null, [0, R.E[0] * 1.08]);
          series(en, R.S.t, R.E, k, { color: 'green', width: 2.4 });
          en.vline(R.S.t[k], { color: 'gold', width: 1.2 });
          now = { k };
        }, { period: T, still: 4.5 });
        v.legend([['red', 'measured $-dE/dt$', { dot: true }], ['accent', '$n\\mathcal F$ ($n$ = degree in the velocities)'], ['muted', '$2\\mathcal F$, for comparison', { dash: true }], ['green', 'energy']]);
        v.readout(() => {
          if (!now) return '';
          const R = sim(), k = Math.min(Math.max(now.k, 2), R.E.length - 3);
          return String.raw`now: $-dE/dt = ${v.fix(R.dE[k], 4)}$ W, $\mathcal F = ${v.fix(R.F[k], 4)}$ W, ratio $${v.fix(R.F[k] > 1e-9 ? R.dE[k] / R.F[k] : NaN, 4)}$ · least-squares ratio $(-dE/dt)/\mathcal F$ over the whole run: $${v.fix(R.ratio, 5)}$ — the degree of homogeneity of $\mathcal F$ in the velocities is ${R.n}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.16
    {
      num: '6.16',
      kind: 'Theorem',
      name: 'Adding a total derivative leaves the motion unchanged',
      statement: String.raw`Let $F(q,t)$ be any smooth function and $L'(q,\dot q,t) = L(q,\dot q,t) + \dfrac{d}{dt}F(q,t) = L + \sum_j\dfrac{\partial F}{\partial q_j}\dot q_j + \dfrac{\partial F}{\partial t}$. Then $L$ and $L'$ have the same Euler–Lagrange equations, hence the same motions. For every path with endpoints $q(t_a) = q_a$, $q(t_b) = q_b$ the actions differ only by an endpoint term,
$$S'[q] = S[q] + F(q_b,t_b) - F(q_a,t_a),$$
which is the same for all competing paths. The converse also holds locally: if $L' - L$ has identically vanishing Euler–Lagrange expressions, it is a total derivative.`,
      idea: String.raw`Integrate: $\int_{t_a}^{t_b}\tfrac{dF}{dt}\,dt = F(q_b,t_b) - F(q_a,t_a)$ by the fundamental theorem of calculus. Since Hamilton’s principle (6.5) compares paths with fixed endpoints, adding a constant to every action cannot change which path is stationary. One can also check directly that the Euler–Lagrange expression of $\dot F = F_q\dot q + F_t$ vanishes: $\tfrac{d}{dt}F_q - (F_{qq}\dot q + F_{qt}) = 0$, using the equality of mixed partials. Gauge transformations of the electromagnetic Lagrangian (6.14) and the generating functions of canonical transformations (12.11) are instances.`,
      caption: String.raw`An anharmonic oscillator, $L = \tfrac12\dot q^2 - \tfrac12 q^2 - \tfrac14 q^4$. Pick a function $F$ and its strength $a$; the motion is integrated from $L$ (blue) and from $L' = L + dF/dt$ (gold dashes) by the same finite-difference Lagrange machine — the curves coincide. Right: the action of a family of paths with fixed endpoints, $q^* + \varepsilon\sin(\pi t/T)$; $S'(\varepsilon)$ is $S(\varepsilon)$ shifted rigidly by $F(q_b,T) - F(q_a,0)$, so both are stationary at the true path $\varepsilon = 0$. Switch on *not a total derivative* (adds $\tfrac a2 q^2$, a change of spring constant): the motion changes (red) and the minimum moves away from $\varepsilon = 0$.`,
      deps: ['mech-6.5'],
      refs: ['Goldstein Deriv. 1.8'],
      tags: ['action', 'gauge', 'Lagrangian'],
      viz(v) {
        const T = 14, DT = 0.005, EV = 2, TW = 1.2, NW = 200;
        const FS = {
          qt: { label: '$F = a\\,q\\,t$', F: (q, t) => q * t, Fq: (q, t) => t, Ft: (q) => q },
          sin: { label: '$F = a\\sin 2q$', F: (q) => Math.sin(2 * q), Fq: (q) => 2 * Math.cos(2 * q), Ft: () => 0 },
          qqc: { label: '$F = a\\,q^2\\cos t$', F: (q, t) => q * q * Math.cos(t), Fq: (q, t) => 2 * q * Math.cos(t), Ft: (q, t) => -q * q * Math.sin(t) },
        };
        const sel = v.select('', Object.entries(FS).map(([value, f]) => ({ value, label: f.label })), 'qt');
        const aS = v.slider('strength $a$', -2, 2, 1.2, { step: 0.05 });
        const brk = v.toggle('not a total derivative: add $\\tfrac a2 q^2$', false);
        const sq = v.stage({ x: [0, T], y: [-1.6, 1.6], height: 280, axes: 'box', weight: 1.25, xlabel: 't', title: 'the motion from $L$ and from $L\'$' });
        const sa = v.stage({ x: [-1, 1], y: [0, 1], height: 280, axes: 'box', weight: 1, xlabel: 'ε', title: 'actions of paths with fixed endpoints' });
        const L0 = (q, qd) => 0.5 * qd[0] * qd[0] - 0.5 * q[0] * q[0] - 0.25 * q[0] ** 4;
        const cache = memo();
        const sim = () => cache(`${sel.value}|${aS.value}|${brk.value}`, () => {
          const a = aS.value, Fn = FS[sel.value];
          const L1 = (q, qd, t) => L0(q, qd) + a * (Fn.Fq(q[0], t) * qd[0] + Fn.Ft(q[0], t));
          const Lb = (q, qd) => L0(q, qd) + 0.5 * a * q[0] * q[0];
          const run = (L) => integrate((t, z) => [z[1], lagrangeAccel(L, [z[0]], [z[1]], t)[0]], [1.2, 0], T, DT, EV);
          const SA = run(L0), SB = run(L1), SC = brk.value ? run(Lb) : null;
          let gap = 0; for (let k = 0; k < SA.y.length; k++) gap = Math.max(gap, Math.abs(SA.y[k][0] - SB.y[k][0]));
          // true path on [0, TW] at the Simpson nodes (from L), and the actions of the family
          const ts = [], qs = [], vs = []; let z = [1.2, 0]; const h = TW / NW, fz = (t, y) => [y[1], -y[0] - y[0] ** 3];
          for (let i = 0; i <= NW; i++) { ts.push(i * h); qs.push(z[0]); vs.push(z[1]); for (let j = 0; j < 4; j++) z = rk4step(fz, 0, z, h / 4); }
          const act = (L, eps) => simpson((t) => { const i = Math.round(t / h), q = qs[i] + eps * Math.sin((Math.PI * t) / TW), qd = vs[i] + eps * (Math.PI / TW) * Math.cos((Math.PI * t) / TW); return L([q], [qd], t); }, 0, TW, NW);
          const es = v.M.linspace(-1, 1, 81);
          const S0 = es.map((e) => act(L0, e)), S1 = es.map((e) => act(L1, e)), S2 = brk.value ? es.map((e) => act(Lb, e)) : null;
          const shift = a * (Fn.F(qs[NW], TW) - Fn.F(qs[0], 0));
          return { SA, SB, SC, gap, es, S0, S1, S2, shift };
        });
        v.animate((t) => {
          const R = sim(), k = frameAt(R.SA, t);
          sq.hline(0, { color: 'faint' });
          sq.vband(0, TW, { color: 'accent', alpha: 0.06 });
          sq.path(R.SA.y.map((z, i) => [R.SA.t[i], z[0]]), { color: 'blue', width: 1.2, alpha: 0.22 });
          if (R.SC) { sq.path(R.SC.y.map((z, i) => [R.SC.t[i], z[0]]), { color: 'red', width: 1.2, alpha: 0.22 }); series(sq, R.SC.t, R.SC.y.map((z) => z[0]), k, { color: 'red', width: 2 }); }
          series(sq, R.SA.t, R.SA.y.map((z) => z[0]), k, { color: 'blue', width: 3.2, alpha: 0.75 });
          series(sq, R.SB.t, R.SB.y.map((z) => z[0]), k, { color: 'gold', width: 1.8, dash: [6, 5] });
          sq.dot(R.SA.t[k], R.SA.y[k][0], { r: 5.5, color: 'blue' });
          sq.text('← window used for the actions', TW + 0.12, 1.42, { color: 'muted', size: 10.5 });
          const arrs = [R.S0, R.S1]; if (R.S2) arrs.push(R.S2);
          sa.setView(null, span(arrs, 0.1, 0.3));
          const P = (A) => R.es.map((e, i) => [e, A[i]]);
          sa.vline(0, { color: 'faint' });
          sa.path(P(R.S0), { color: 'blue', width: 2.6 });
          sa.path(P(R.S1), { color: 'gold', width: 2.6 });
          if (R.S2) { sa.path(P(R.S2), { color: 'red', width: 2.2 }); let im = 0; R.S2.forEach((x, i) => { if (x < R.S2[im]) im = i; }); sa.dot(R.es[im], R.S2[im], { r: 5, color: 'red' }); }
          const i0 = 40; sa.dot(0, R.S0[i0], { r: 5, color: 'blue' }); sa.dot(0, R.S1[i0], { r: 5, color: 'gold' });
          if (Math.abs(R.shift) > 0.02) sa.arrow(0.55, R.S0[62], 0.55, R.S0[62] + R.shift, { color: 'green', width: 1.8, head: 7 });
        }, { period: T, still: 9 });
        v.legend([['blue', '$L$'], ['gold', '$L\' = L + dF/dt$', { dash: true }], ['red', '$L + \\tfrac a2 q^2$ (not a total derivative)'], ['green', 'endpoint term $F(q_b,T)-F(q_a,0)$']]);
        v.readout(() => {
          const R = sim(), d = [0, 40, 80].map((i) => R.S1[i] - R.S0[i]);
          let s = String.raw`largest difference between the motions from $L$ and $L'$: $${v.sci(Math.max(R.gap, 1e-16), 2)}$ · $S' - S$ at $\varepsilon = -1, 0, 1$: $${d.map((x) => v.fix(x, 6)).join(',\\ ')}$ — all equal to $F(q_b,T) - F(q_a,0) = ${v.fix(R.shift, 6)}$`;
          if (R.S2) { let im = 0; R.S2.forEach((x, i) => { if (x < R.S2[im]) im = i; }); let g2 = 0; for (let k = 0; k < R.SA.y.length; k++) g2 = Math.max(g2, Math.abs(R.SA.y[k][0] - R.SC.y[k][0])); s += String.raw` · with $\tfrac a2 q^2$ added the motion changes by up to $${v.fix(g2, 3)}$ and the action’s minimum moves to $\varepsilon \approx ${v.fix(R.es[im], 3)}$`; }
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 6.17
    {
      num: '6.17',
      kind: 'Theorem',
      name: 'Purely kinetic Lagrangians: free motion is geodesic',
      statement: String.raw`Let the configuration space carry the kinetic-energy metric, $T = \tfrac12\sum_{j,k} g_{jk}(q)\,\dot q_j\dot q_k$, and suppose there is no potential, $L = T$. Then the Euler–Lagrange equations are the geodesic equations
$$\ddot q_i + \sum_{j,k}\Gamma^i_{jk}(q)\,\dot q_j\dot q_k = 0$$
of that metric: the motion has constant speed ($T$ is conserved) and runs along geodesics, which are locally the shortest curves between their points. For a frictionless bead on a surface in space, feeling only the normal force, this means the bead follows the surface’s geodesics, its acceleration is everywhere normal to the surface, and on a surface of revolution Clairaut’s relation holds: $\rho\sin\psi$ is constant, where $\rho$ is the distance from the axis and $\psi$ the angle between the velocity and the meridian.`,
      idea: String.raw`For $L = T$ the energy function is $T$ itself and $L$ has no explicit $t$, so $T$ — the squared speed — is conserved (mech-3.6). A constant-speed curve that makes $\int T\,dt$ stationary also makes the length $\int\sqrt{2T}\,dt$ stationary, so solutions of Lagrange’s equations (6.6) are geodesics (mech-5.13); writing out $\tfrac{d}{dt}(g_{ik}\dot q_k) = \tfrac12\partial_i g_{jk}\dot q_j\dot q_k$ gives the Christoffel symbols. On a surface of revolution the azimuth $\varphi$ is cyclic, so $p_\varphi = \rho^2\dot\varphi$ is constant (6.8), and dividing by the constant speed gives Clairaut’s $\rho\sin\psi$. Add a potential (gravity) and the speed and $\rho\sin\psi$ stop being constant — although $p_\varphi$ still is.`,
      caption: String.raw`A bead with no forces but the normal reaction slides on a surface; the motion is integrated from $L = \tfrac12|\dot{\mathbf X}|^2$ in the surface’s own coordinates by the finite-difference Lagrange machine. Choose the surface and the launch angle (from the meridian; for the saddle, from the $x$-axis); drag to rotate. The red arrow is the measured acceleration: it sticks straight out of the surface. Right: the speed and, on surfaces of revolution, Clairaut’s $\rho\sin\psi$ — both flat. Switch on gravity: both start to vary, while $p_\varphi = \rho^2\dot\varphi$ stays constant.`,
      deps: ['mech-6.6', 'mech-5.13', 'mech-3.6'],
      refs: ['Tong §2.5', 'Arnold §45'],
      see: ['dg-9.6', 'dg-9.4'],
      tags: ['geodesics', 'metric', 'Clairaut'],
      viz(v) {
        const T = 14, DT = 0.005, EV = 4, GZ = 0.6;
        const SF = {
          sphere: { label: 'sphere', rev: true, X: ([a, b]) => [Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b), Math.cos(a)], J: ([a, b]) => [[Math.cos(a) * Math.cos(b), -Math.sin(a) * Math.sin(b)], [Math.cos(a) * Math.sin(b), Math.sin(a) * Math.cos(b)], [-Math.sin(a), 0]],
            q0: [Math.PI / 2, 0], v0: (psi) => [-Math.cos(psi), Math.sin(psi)], dom: [[0.03, Math.PI - 0.03], [-1e9, 1e9]], rng: [[0, Math.PI], [0, TAU]], phiIdx: 1 },
          torus: { label: 'torus', rev: true, X: ([u, w]) => [(1 + 0.45 * Math.cos(w)) * Math.cos(u), (1 + 0.45 * Math.cos(w)) * Math.sin(u), 0.45 * Math.sin(w)], J: ([u, w]) => [[-(1 + 0.45 * Math.cos(w)) * Math.sin(u), -0.45 * Math.sin(w) * Math.cos(u)], [(1 + 0.45 * Math.cos(w)) * Math.cos(u), -0.45 * Math.sin(w) * Math.sin(u)], [0, 0.45 * Math.cos(w)]],
            q0: [0, 0], v0: (psi) => [Math.sin(psi) / 1.45, Math.cos(psi) / 0.45], dom: [[-1e9, 1e9], [-1e9, 1e9]], rng: [[0, TAU], [0, TAU]], phiIdx: 0 },
          saddle: { label: 'saddle', rev: false, X: ([x, y]) => [x, y, 0.35 * (x * x - y * y)], J: ([x, y]) => [[1, 0], [0, 1], [0.7 * x, -0.7 * y]],
            q0: [-1.1, -0.35], v0: (psi) => [0.4 * Math.cos(psi), 0.4 * Math.sin(psi)], dom: [[-1.35, 1.35], [-1.35, 1.35]], rng: [[-1.3, 1.3], [-1.3, 1.3]] },
          vase: { label: 'vase', rev: true, X: ([z, p]) => { const r = 0.55 + 0.22 * Math.sin(2.2 * z); return [r * Math.cos(p), r * Math.sin(p), z]; }, J: ([z, p]) => { const r = 0.55 + 0.22 * Math.sin(2.2 * z), dr = 0.484 * Math.cos(2.2 * z); return [[dr * Math.cos(p), -r * Math.sin(p)], [dr * Math.sin(p), r * Math.cos(p)], [1, 0]]; },
            q0: [Math.PI / 4.4, 0], v0: (psi) => [Math.cos(psi), Math.sin(psi) / 0.77], dom: [[-1.3, 1.5], [-1e9, 1e9]], rng: [[-1.25, 1.45], [0, TAU]], phiIdx: 1 },
        };
        const sel = v.select('surface', Object.entries(SF).map(([value, f]) => ({ value, label: f.label })), 'torus');
        const psiS = v.slider('launch angle $\\psi_0$', 15, 165, 55, { step: 1, fmt: deg });
        const grav = v.toggle('add gravity (a potential)', false);
        const s3 = v.stage3d({ range: 1.6, height: 330, yaw: -0.7, pitch: 0.55, axes: false, weight: 1.2, title: 'free motion on a surface' });
        const pl = v.stage({ x: [0, T], y: [0, 1.5], height: 330, axes: 'box', weight: 1, xlabel: 't', title: 'speed $|\\mathbf v|$ and Clairaut’s $\\rho\\sin\\psi$' });
        const cache = memo();
        const sim = () => cache(`${sel.value}|${psiS.value}|${grav.value}`, () => {
          const S = SF[sel.value], g = grav.value ? GZ : 0;
          const L = (q, qd) => { const J = S.J(q), vx = J[0][0] * qd[0] + J[0][1] * qd[1], vy = J[1][0] * qd[0] + J[1][1] * qd[1], vz = J[2][0] * qd[0] + J[2][1] * qd[1]; return 0.5 * (vx * vx + vy * vy + vz * vz) - g * S.X(q)[2]; };
          const out = S.dom;
          const R = integrate((t, z) => { const a = lagrangeAccel(L, [z[0], z[1]], [z[2], z[3]], t); return [z[2], z[3], a[0], a[1]]; }, [...S.q0, ...S.v0(psiS.value * DEG)], T, DT, EV,
            (t, z) => z[0] < out[0][0] || z[0] > out[0][1] || z[1] < out[1][0] || z[1] > out[1][1]);
          const P = R.y.map((z) => S.X([z[0], z[1]])), h = R.dt, n = P.length;
          const speed = [], clair = [], pphi = [], atan = [], acc = [];
          for (let k = 0; k < n; k++) {
            const z = R.y[k], J = S.J([z[0], z[1]]), vv = [0, 1, 2].map((i) => J[i][0] * z[2] + J[i][1] * z[3]), sp = Math.hypot(...vv);
            speed.push(sp);
            if (S.rev) { const rho = Math.hypot(P[k][0], P[k][1]), lz = P[k][0] * vv[1] - P[k][1] * vv[0]; pphi.push(lz); clair.push(Math.abs(lz) / sp); }
            let a = [0, 0, 0];
            if (k >= 2 && k < n - 2) a = [0, 1, 2].map((i) => (-P[k - 2][i] + 16 * P[k - 1][i] - 30 * P[k][i] + 16 * P[k + 1][i] - P[k + 2][i]) / (12 * h * h));
            const nrm = [J[1][0] * J[2][1] - J[2][0] * J[1][1], J[2][0] * J[0][1] - J[0][0] * J[2][1], J[0][0] * J[1][1] - J[1][0] * J[0][1]], nl = Math.hypot(...nrm) || 1, nn = nrm.map((c) => c / nl);
            const an = a[0] * nn[0] + a[1] * nn[1] + a[2] * nn[2], at = [a[0] - an * nn[0], a[1] - an * nn[1], a[2] - an * nn[2]];
            acc.push(a); atan.push(Math.hypot(...at) / (Math.hypot(...a) || 1));
          }
          return { R, P, speed, clair, pphi, atan, acc, S };
        });
        v.animate((t) => {
          const D = sim(), S = D.S, k = Math.min(frameAt(D.R, t), D.P.length - 1), P = D.P[k];
          s3.surface((a, b) => S.X([a, b]), S.rng[0], S.rng[1], { nu: 28, nv: 18, color: 'accent', alpha: 0.2, wire: true });
          s3.path(D.P.slice(0, k + 1), { color: 'gold', width: 2.4, bias: -0.04 });
          if (k >= 2 && k < D.P.length - 2) { const a = D.acc[k], al = Math.hypot(...a), sc = Math.min(0.5, 0.35 / (al || 1)) * al; if (al > 1e-6) s3.arrow(P, [P[0] + (sc * a[0]) / al, P[1] + (sc * a[1]) / al, P[2] + (sc * a[2]) / al], { color: 'red', width: 2.4, bias: -0.1 }); }
          const z = D.R.y[k], J = S.J([z[0], z[1]]), vv = [0, 1, 2].map((i) => 0.35 * (J[i][0] * z[2] + J[i][1] * z[3]));
          s3.arrow(P, [P[0] + vv[0], P[1] + vv[1], P[2] + vv[2]], { color: 'green', width: 2.2, bias: -0.1 });
          s3.dot(P, { r: 6, color: 'gold', bias: -0.1 });
          const arrs = [D.speed]; if (S.rev) arrs.push(D.clair);
          pl.setView(null, span(arrs.map((a) => a.concat([0])), 0.1, 0.4));
          pl.hline(0, { color: 'faint' });
          series(pl, D.R.t, D.speed, k, { color: 'green', width: 2.4 });
          if (S.rev) series(pl, D.R.t, D.clair, k, { color: 'purple', width: 2.4 });
          pl.vline(D.R.t[Math.min(k, D.R.t.length - 1)], { color: 'gold', width: 1.2 });
          if (D.P.length < D.R.t.length || D.R.t[D.R.t.length - 1] < T - 1e-6) pl.corner('the path left the patch shown', 'tr', { color: 'muted' });
        }, { period: T, still: 9 });
        v.legend([['gold', 'path'], ['green', 'velocity / speed'], ['red', 'acceleration (normal to the surface)'], ['purple', 'Clairaut $\\rho\\sin\\psi$']]);
        v.readout((t) => {
          const D = sim(), k = Math.min(frameAt(D.R, t), D.P.length - 1);
          let ds = 0, dc = 0, dp = 0, at = 0;
          for (let j = 0; j <= k; j++) { ds = Math.max(ds, Math.abs(D.speed[j] - D.speed[0])); if (D.S.rev) { dc = Math.max(dc, Math.abs(D.clair[j] - D.clair[0])); dp = Math.max(dp, Math.abs(D.pphi[j] - D.pphi[0])); } if (j >= 2 && j < D.P.length - 2) at = Math.max(at, D.atan[j]); }
          let s = String.raw`speed varies by $${v.sci(Math.max(ds, 1e-16), 1)}$ · tangential part of the measured acceleration $\le ${v.sci(Math.max(at, 1e-16), 1)}$ of its size`;
          s += D.S.rev ? String.raw` · $\rho\sin\psi = ${v.fix(D.clair[k], 5)}$, varying by $${v.sci(Math.max(dc, 1e-16), 1)}$ · $p_\varphi = \rho^2\dot\varphi$ varies by $${v.sci(Math.max(dp, 1e-16), 1)}$` : ' · the saddle has no rotational symmetry, so no Clairaut integral';
          if (grav.value) s += ' — gravity is a potential: the path is no longer a geodesic, but the azimuthal symmetry still conserves $p_\\varphi$';
          return s;
        });
      },
    },
  ],
};
