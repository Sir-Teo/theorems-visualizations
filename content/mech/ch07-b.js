// Classical Mechanics — Chapter 7: Symmetries and conservation laws (part b: 7.7–7.12)

// ── shared helpers (duplicated from ch07.js: content modules cannot import) ─────────
const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }
function rk4step(f, t, y, h) {
  const k1 = f(t, y), y2 = y.map((c, i) => c + (h / 2) * k1[i]), k2 = f(t + h / 2, y2);
  const y3 = y.map((c, i) => c + (h / 2) * k2[i]), k3 = f(t + h / 2, y3), y4 = y.map((c, i) => c + h * k3[i]), k4 = f(t + h, y4);
  return y.map((c, i) => c + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
/** RK4 from t = 0 to T in n steps, recording every `every` steps → {t: [], y: [], dt}. `post` may project the state after each step. */
function rk4rec(f, y0, T, n, every = 1, post) {
  const h = T / n; let y = y0.slice(); const out = { t: [0], y: [y], dt: h * every };
  for (let k = 1; k <= n; k++) { y = rk4step(f, (k - 1) * h, y, h); if (post) y = post(y); if (k % every === 0) { out.t.push(k * h); out.y.push(y); } }
  return out;
}
function span(arrs, pad = 0.1, minSpan = 1) {
  let lo = Infinity, hi = -Infinity;
  for (const a of arrs) for (const y of a) { if (!isFinite(y)) continue; if (y < lo) lo = y; if (y > hi) hi = y; }
  if (!isFinite(lo)) { lo = -1; hi = 1; }
  if (hi - lo < minSpan) { const c = (hi + lo) / 2; lo = c - minSpan / 2; hi = c + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
function series(s, ts, ys, upto, st) {
  const pts = []; for (let k = 0; k <= Math.min(upto, ts.length - 1); k++) pts.push([ts[k], ys[k]]);
  if (pts.length > 1) s.path(pts, st);
}
const maxDev = (a, upto = a.length - 1, ref = a[0]) => { let d = 0; for (let k = 0; k <= upto; k++) d = Math.max(d, Math.abs(a[k] - ref)); return d; };
const rangeOf = (a, upto = a.length - 1) => { let lo = Infinity, hi = -Infinity; for (let k = 0; k <= upto; k++) { lo = Math.min(lo, a[k]); hi = Math.max(hi, a[k]); } return [lo, hi]; };
const sci = (v, x) => (Math.abs(x) < 1e-300 ? '0' : v.sci(x, 2));
const num = (v, x, d = 4) => (Math.abs(x) < 1e-30 ? '0' : Math.abs(x) >= 0.5 * 10 ** -d ? v.fix(x, d) : v.sci(x, 2));
function spring(s, p, q, st = {}) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, n = st.coils ?? 12, amp = st.amp ?? 0.08, pts = [p];
  const a0 = 0.1, a1 = 0.9;
  pts.push([p[0] + a0 * dx, p[1] + a0 * dy]);
  for (let j = 1; j < 2 * n; j++) { const a = a0 + ((a1 - a0) * j) / (2 * n), sg = j % 2 ? 1 : -1; pts.push([p[0] + a * dx + sg * amp * nx, p[1] + a * dy + sg * amp * ny]); }
  pts.push([p[0] + a1 * dx, p[1] + a1 * dy], q);
  s.path(pts, { color: st.color || 'muted', width: st.width ?? 1.5 });
}

export default {
  collection: 'mech',
  chapter: 7,
  items: [
    // ───────────────────────────────────────────────────────────── 7.7
    {
      num: '7.7',
      kind: 'Theorem',
      name: 'Homogeneity of time: conservation of energy',
      statement: String.raw`Along every solution of Lagrange’s equations the energy function $h = \sum_j\dot q_j\,\partial L/\partial\dot q_j - L$ (7.6) changes at the rate
$$\frac{dh}{dt} = -\frac{\partial L}{\partial t}.$$
Hence if $L$ does not depend explicitly on time — the system is invariant under time translations $t\mapsto t+s$ — then $h$ is conserved. For a natural system $h = T+U$ and this is conservation of mechanical energy (3.6). A Lagrangian with an explicit time dependence, such as a spring whose stiffness is varied from outside, $L = \tfrac12m\dot x^2 - \tfrac12k(t)x^2$, conserves no energy: $\dot h = \tfrac12\dot k\,x^2$, the power delivered by whoever changes $k$.`,
      idea: String.raw`By the chain rule $\frac{dL}{dt} = \sum\frac{\partial L}{\partial q_j}\dot q_j + \sum\frac{\partial L}{\partial\dot q_j}\ddot q_j + \frac{\partial L}{\partial t}$; replacing $\partial L/\partial q_j$ by $\frac{d}{dt}\partial L/\partial\dot q_j$ (Lagrange’s equations, 6.6) turns the two sums into $\frac{d}{dt}\sum\dot q_j\,\partial L/\partial\dot q_j$, so $\frac{d}{dt}h = -\partial L/\partial t$. This is Noether’s theorem (7.3) for the time shift $t\mapsto t+s$, whose charge is $-h$. If $k$ is changed slowly compared with the period, $h$ changes but $h/\omega$ is almost constant — an adiabatic invariant; changed at twice the natural frequency, $h$ grows exponentially (parametric resonance, 4.17).`,
      caption: String.raw`A mass on a spring whose stiffness $k(t)$ is changed from outside (the spring thickens as it stiffens). Constant $k$: the phase-space ellipse is frozen and $h$ is flat. Modulated, ramped or jumped $k$: the ellipse breathes and $h$ moves — and the dashed curve, $h(0)+\int_0^t\tfrac12\dot k\,x^2\,dt$, follows it exactly. Try $\Omega = 2\omega_0$ for parametric resonance, or the slow ramp to watch $h/\omega$ stay put.`,
      deps: ['mech-7.6', 'mech-7.3', 'mech-6.6'],
      see: ['mech-4.17', 'mech-3.6'],
      refs: ['Goldstein §2.7', 'Taylor §7.8'],
      tags: ['energy', 'time translation', 'Noether'],
      viz(v) {
        const T = 40, DT = 0.004, EV = 5;
        const mode = v.select('stiffness $k(t)$', [{ value: 'const', label: 'constant' }, { value: 'mod', label: 'modulated' }, { value: 'ramp', label: 'slow ramp' }, { value: 'jump', label: 'sudden jump' }], 'mod');
        const eS = v.slider('size of the change $\\varepsilon$', 0, 1, 0.35, { step: 0.01 });
        const oS = v.slider('modulation frequency $\\Omega/\\omega_0$', 0.2, 3, 1.3, { step: 0.01 });
        const s1 = v.stage({ x: [-3.3, 3.3], y: [-0.42, 0.45], equal: true, axes: false, height: 120, full: true });
        const s2 = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: true, height: 300, weight: 0.85, title: 'phase space $(x, p)$' });
        const s3 = v.stage({ x: [0, T], y: [0, 1], axes: 'box', height: 300, weight: 1.3, xlabel: 't', title: 'energy function $h = \\tfrac12p^2 + \\tfrac12k(t)\\,x^2$' });
        const kfun = (md, e, Om) => {
          if (md === 'const') return [() => 1, () => 0];
          if (md === 'mod') return [(t) => 1 + e * Math.sin(Om * t), (t) => e * Om * Math.cos(Om * t)];
          if (md === 'ramp') return [(t) => { const u = t / T; return 1 + 3 * e * u * u * (3 - 2 * u); }, (t) => { const u = t / T; return (18 * e * u * (1 - u)) / T; }];
          const w = 0.08; return [(t) => 1 + e * (1 + Math.tanh((t - T / 2) / w)), (t) => e / (w * Math.cosh((t - T / 2) / w) ** 2)];
        };
        const cache = memo(); let cur = null;
        const run = () => cache([mode.value, eS.value, oS.value].join('|'), () => {
          const [k, kd] = kfun(mode.value, eS.value, oS.value);
          const R = rk4rec((t, S) => [S[1], -k(t) * S[0], 0.5 * kd(t) * S[0] * S[0]], [1, 0, 0], T, Math.round(T / DT), EV);
          const K = R.t.map(k), h = R.y.map((S, j) => 0.5 * S[1] * S[1] + 0.5 * K[j] * S[0] * S[0]), pred = R.y.map((S) => h[0] + S[2]);
          let xm = 0.5, pm = 0.5; for (const S of R.y) { xm = Math.max(xm, Math.abs(S[0])); pm = Math.max(pm, Math.abs(S[1])); }
          const [lo, hi] = span([h, pred], 0.08, 0.25), band = 0.32 * (hi - lo), [klo, khi] = rangeOf(K);
          return { R, K, h, pred, xm, pm, lo, hi, band, klo, khi };
        });
        v.animate((t) => {
          oS.el.hidden = mode.value !== 'mod';
          const B = run(), R = B.R, n = R.t.length - 1, i = Math.min(n, Math.round(((Math.min(t, 13.4) / 13.4) * T) / R.dt));
          const [x, p] = R.y[i], k = B.K[i];
          // spring and mass
          const sx = 2.1 / B.xm, X = x * sx, wx = -3.15;
          s1.line(wx, -0.32, wx, 0.32, { color: 'ink', width: 3 });
          for (let yy = -0.3; yy <= 0.3; yy += 0.1) s1.line(wx, yy, wx - 0.1, yy - 0.08, { color: 'muted', width: 1 });
          s1.line(-3.15, -0.3, 3.3, -0.3, { color: 'faint', width: 1 });
          s1.vline(0, { color: 'faint', dash: [3, 4] });
          spring(s1, [wx, 0], [X - 0.25, 0], { coils: 14, amp: 0.09, color: 'purple', width: 0.8 + 1.6 * k });
          s1.rect(X - 0.25, -0.22, X + 0.25, 0.22, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.6 });
          s1.corner(`k(t) = ${v.fix(k, 3)} k₀`, 'tr', { color: 'purple', weight: 600 });
          // phase space
          const W = Math.max(B.xm * Math.sqrt(Math.max(B.khi, 1)), B.pm) * 1.12;
          s2.setView([-W, W], [-W, W]);
          const ell = (hh, kk) => (u) => [Math.sqrt((2 * hh) / kk) * Math.cos(u), Math.sqrt(2 * hh) * Math.sin(u)];
          s2.curve(ell(B.h[0], B.K[0]), 0, TAU, { color: 'faint', dash: [4, 4], width: 1.2 });
          s2.path(R.y.slice(Math.max(0, i - 600), i + 1).map((S) => [S[0], S[1]]), { color: 'accent', width: 1.2, alpha: 0.45 });
          s2.curve(ell(B.h[i], k), 0, TAU, { color: 'blue', width: 2.2 });
          s2.dot(x, p, { r: 5.5, color: 'gold' });
          s2.tex('x', W, 0, { color: 'muted', align: 'right', dx: -4, dy: -12, size: 13 });
          s2.tex('p', 0, W, { color: 'muted', align: 'left', dx: 6, dy: 10, size: 13 });
          // h(t) with k(t) in a band underneath
          const lo = B.lo - B.band * 1.15;
          s3.setView([0, T], [lo, B.hi]);
          const kmap = (kk) => lo + 0.08 * B.band + (B.khi - B.klo > 1e-9 ? ((kk - B.klo) / (B.khi - B.klo)) * 0.84 * B.band : 0.42 * B.band);
          s3.hline(B.lo - 0.08 * B.band, { color: 'faint', width: 1 });
          series(s3, R.t, B.K.map(kmap), n, { color: 'purple', width: 1.2, alpha: 0.35 });
          series(s3, R.t, B.K.map(kmap), i, { color: 'purple', width: 1.6 });
          s3.text('k(t)', T, kmap(B.K[n]), { color: 'purple', size: 11, dx: -6, dy: -9, math: true, align: 'right' });
          s3.hline(B.h[0], { color: 'faint', dash: [3, 4] });
          series(s3, R.t, B.h, i, { color: 'blue', width: 3.2 });
          series(s3, R.t, B.pred, i, { color: 'orange', width: 1.8, dash: [7, 5] });
          s3.dot(R.t[i], B.h[i], { r: 4.5, color: 'blue' });
          cur = { B, i };
        }, { period: 14.6, still: 12.2 });
        v.legend([['blue', '$h$ measured / energy ellipse'], ['orange', '$h(0) + \\int_0^t\\tfrac12\\dot k\\,x^2\\,dt = h(0) - \\int_0^t\\partial L/\\partial t\\,dt$', { dash: true }], ['purple', '$k(t)$']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, R = B.R, tt = v.fix(R.t[i], 1);
          if (mode.value === 'const' || eS.value === 0) return String.raw`$L = \tfrac12\dot x^2 - \tfrac12kx^2$ has no explicit $t$: $h = ${v.fix(B.h[i], 5)}$ at $t = ${tt}$ (largest change $${sci(v, maxDev(B.h, i))}$)`;
          let out = String.raw`$\partial L/\partial t = -\tfrac12\dot k\,x^2 \ne 0$ · at $t = ${tt}$: $h - h(0) = ${num(v, B.h[i] - B.h[0], 5)}$, $\int_0^t\tfrac12\dot k\,x^2\,dt = ${num(v, R.y[i][2], 5)}$ (mismatch $${sci(v, Math.abs(B.h[i] - B.pred[i]))}$)`;
          if (mode.value === 'ramp') out += String.raw` · adiabatic invariant $h/\omega$: ${v.fix(B.h[0], 4)} at the start, ${v.fix(B.h[i] / Math.sqrt(B.K[i]), 4)} now, while $h$ itself went from ${v.fix(B.h[0], 3)} to ${v.fix(B.h[i], 3)}`;
          if (mode.value === 'mod') out += Math.abs(oS.value - 2) < 0.15 ? String.raw` · $\Omega\approx2\omega_0$: parametric resonance, $h$ has grown ×${v.fix(B.h[i] / B.h[0], 2)}` : ` · set Ω/ω₀ near 2 for parametric resonance`;
          if (mode.value === 'jump') { const j = Math.round(T / 2 / R.dt); out += String.raw` · across the jump of $k$, $h$ changed by ${v.fix(B.h[Math.min(j + 10, B.h.length - 1)] - B.h[Math.max(j - 10, 0)], 4)} $\approx\tfrac12\Delta k\,x^2$ with $x$ at that moment`; }
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.8
    {
      num: '7.8',
      kind: 'Proposition',
      name: 'When the energy function is not the energy',
      statement: String.raw`If the coordinates are tied to a frame or constraint that is moved by a prescribed motion, the kinetic energy contains terms $T_1$, $T_0$ linear in and independent of $\dot q$, and the energy function $h = T_2 - T_0 + U$ differs from the energy $E = T + U$. The two conservation questions then separate: $h$ is conserved whenever $L$ has no explicit time dependence, while $E$ changes by the work of the agency that drives the constraint. For a bead of mass $m$ on a hoop of radius $R$ forced to spin at constant $\omega$ about its vertical diameter,
$$h = \tfrac12mR^2\big(\dot\theta^2 - \omega^2\sin^2\theta\big) - mgR\cos\theta = \text{const},\qquad \frac{dE}{dt} = \tau_{\rm motor}\,\omega .$$
If instead the hoop spins freely (moment of inertia $I$), its angle is a genuine coordinate, the Lagrangian is natural, and $h$ is again the total energy.`,
      idea: String.raw`Measured in the inertial frame the bead’s speed squared is $R^2(\dot\theta^2 + \omega^2\sin^2\theta)$, so $T_2 = \tfrac12mR^2\dot\theta^2$ and $T_0 = \tfrac12mR^2\omega^2\sin^2\theta$. Since $L$ does not contain $t$, $h$ is conserved (7.7) — it is the energy of the bead in the rotating frame, centrifugal potential included. But the bead’s angular momentum about the axis, $mR^2\omega\sin^2\theta$, changes as it climbs, so the motor must exert a torque and does work $\int\tau\omega\,dt = mR^2\omega^2(\sin^2\theta - \sin^2\theta_0)$ — exactly $E - h$ up to a constant.`,
      caption: String.raw`A bead slides without friction on a hoop that a motor spins at fixed $\omega$. Right: $h$ (blue) is flat while the energy $T+U$ (orange) swings, and the running work done by the motor (dashed) accounts for every swing. Above $\omega = \sqrt{g/R}$ the bead settles around the green ring of stable equilibrium (6.11). Switch to a freely spinning hoop: now $\omega$ varies, the total energy is $h$ and is flat, and the bead and hoop trade energy.`,
      deps: ['mech-7.7', 'mech-6.11', 'mech-7.6'],
      refs: ['Goldstein §2.7'],
      tags: ['energy function', 'constraints', 'rotating frame'],
      credit: 'Jacobi (the integral h)',
      viz(v) {
        const g = 9.81, Rh = 1, m = 1, I0 = 0.4, T = 8, DT = 0.001, EV = 10;
        const mode = v.select('hoop', [{ value: 'motor', label: 'driven at fixed $\\omega$' }, { value: 'free', label: 'spinning freely' }], 'motor');
        const om = v.slider('spin $\\omega$ (rad/s)', 0, 8, 5, { step: 0.1 });
        const th0 = v.slider('release angle $\\theta_0$ (°)', 5, 120, 25, { step: 1 });
        const S = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.5], equal: true, axes: false, height: 340, title: 'bead on a hoop, $R = 1$ m, $m = 1$ kg' });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.3, axis: 1.3, lim: 1.5, hint: false, axes: false });
        const sp = v.stage({ x: [0, T], y: [-1, 1], axes: 'box', height: 340, weight: 1.2, xlabel: 't (s)', title: 'energies (J)' });
        const cache = memo(); let cur = null;
        const run = () => cache([mode.value, om.value, th0.value].join('|'), () => {
          const w0 = om.value, a0 = (th0.value * Math.PI) / 180, mR2 = m * Rh * Rh, n = Math.round(T / DT);
          if (mode.value === 'motor') {
            const R = rk4rec((t, Y) => { const s = Math.sin(Y[0]), c = Math.cos(Y[0]); return [Y[1], (w0 * w0 * c - g / Rh) * s, 2 * mR2 * w0 * w0 * s * c * Y[1]]; }, [a0, 0, 0], T, n, EV);
            const E = R.y.map(([th, thd]) => 0.5 * mR2 * (thd * thd + w0 * w0 * Math.sin(th) ** 2) - m * g * Rh * Math.cos(th));
            const h = R.y.map(([th, thd]) => 0.5 * mR2 * (thd * thd - w0 * w0 * Math.sin(th) ** 2) - m * g * Rh * Math.cos(th));
            const EW = R.y.map((Y) => E[0] + Y[2]), phi = R.t.map((t) => w0 * t), w = R.t.map(() => w0);
            return { R, E, h, EW, phi, w, yr: span([E, h, EW], 0.12, 1) };
          }
          const Lz = (I0 + mR2 * Math.sin(a0) ** 2) * w0;
          const wof = (th) => Lz / (I0 + mR2 * Math.sin(th) ** 2);
          const R = rk4rec((t, Y) => { const s = Math.sin(Y[0]), c = Math.cos(Y[0]), w = wof(Y[0]); return [Y[1], (w * w * c - g / Rh) * s, w]; }, [a0, 0, 0], T, n, EV);
          const w = R.y.map((Y) => wof(Y[0]));
          const Eb = R.y.map(([th, thd], j) => 0.5 * mR2 * (thd * thd + w[j] * w[j] * Math.sin(th) ** 2) - m * g * Rh * Math.cos(th));
          const Kh = w.map((x) => 0.5 * I0 * x * x), Et = Eb.map((e, j) => e + Kh[j]);
          const Lzs = R.y.map((Y, j) => (I0 + mR2 * Math.sin(Y[0]) ** 2) * w[j]);
          return { R, Eb, Kh, Et, w, Lzs, phi: R.y.map((Y) => Y[2]), yr: span([Eb, Kh, Et], 0.12, 1) };
        });
        v.animate((t) => {
          const B = run(), R = B.R, n = R.t.length - 1, i = Math.min(n, Math.round(Math.min(t, T) / R.dt)), th = R.y[i][0], ph = B.phi[i];
          const hoopPt = (s, p) => [Rh * Math.sin(s) * Math.cos(p), Rh * Math.sin(s) * Math.sin(p), -Rh * Math.cos(s)];
          sc.begin();
          sc.line([0, 0, -1.3], [0, 0, 1.25], { color: 'muted', width: 1.6 }, 12);
          sc.poly([[-0.12, -0.12, 1.25], [0.12, -0.12, 1.25], [0.12, 0.12, 1.25], [-0.12, 0.12, 1.25]], { fill: 'muted', fillAlpha: 0.5, color: 'muted' });
          const arc = []; for (let k = 0; k <= 30; k++) { const a = ph + (1.5 * Math.PI * k) / 30; arc.push([0.32 * Math.cos(a), 0.32 * Math.sin(a), 1.12]); }
          sc.path(arc.slice(0, -2), { color: 'orange', width: 2 });
          sc.arrow(arc[arc.length - 3], arc[arc.length - 1], { color: 'orange', width: 2, head: 7 });
          if (mode.value === 'motor' && B.w[0] ** 2 > g / Rh) {
            const ts = Math.acos(g / (Rh * B.w[0] ** 2)), ring = [];
            for (let k = 0; k <= 60; k++) ring.push([Rh * Math.sin(ts) * Math.cos((TAU * k) / 60), Rh * Math.sin(ts) * Math.sin((TAU * k) / 60), -Rh * Math.cos(ts)]);
            sc.path(ring, { color: 'green', width: 1.4, dash: [4, 4] });
          }
          const hoop = []; for (let k = 0; k <= 80; k++) hoop.push(hoopPt((TAU * k) / 80, ph));
          sc.path(hoop, { color: 'accent', width: 3 });
          const trail = []; for (let j = Math.max(0, i - 150); j <= i; j++) trail.push(hoopPt(R.y[j][0], B.phi[j]));
          sc.path(trail, { color: 'gold', width: 1.6, alpha: 0.7 });
          sc.dot(hoopPt(th, ph), { r: 7, color: 'gold' });
          sc.flush();
          S.corner(`ω = ${v.fix(B.w[i], 2)} rad/s`, 'tl', { color: 'orange', weight: 600 });
          sp.setView([0, T], B.yr);
          if (mode.value === 'motor') {
            series(sp, R.t, B.E, i, { color: 'orange', width: 2.6 });
            series(sp, R.t, B.EW, i, { color: 'purple', width: 1.8, dash: [7, 5] });
            series(sp, R.t, B.h, i, { color: 'blue', width: 3.2 });
            sp.dot(R.t[i], B.h[i], { r: 4.5, color: 'blue' });
          } else {
            series(sp, R.t, B.Eb, i, { color: 'orange', width: 2.6 });
            series(sp, R.t, B.Kh, i, { color: 'purple', width: 2 });
            series(sp, R.t, B.Et, i, { color: 'blue', width: 3.2 });
            sp.dot(R.t[i], B.Et[i], { r: 4.5, color: 'blue' });
          }
          v.legend(mode.value === 'motor'
            ? [['blue', '$h = T_2 - T_0 + U$'], ['orange', '$E = T + U$ of the bead'], ['purple', '$E(0) + \\int_0^t\\tau_{\\rm motor}\\,\\omega\\,dt$', { dash: true }], ['green', 'stable ring', { dash: true }]]
            : [['blue', '$h$ = total energy'], ['orange', 'energy of the bead'], ['purple', 'kinetic energy of the hoop $\\tfrac12I\\omega^2$']]);
          cur = { B, i };
        }, { period: T + 1, still: 6.5 });
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, tt = v.fix(B.R.t[i], 2);
          if (mode.value === 'motor') {
            const [lo, hi] = rangeOf(B.E, i), w0 = B.w[0];
            return String.raw`at $t = ${tt}$ s: $h = ${v.fix(B.h[i], 4)}$ J (largest change $${sci(v, maxDev(B.h, i))}$) · $E = T+U = ${v.fix(B.E[i], 3)}$ J, so far in $[${v.fix(lo, 2)},\ ${v.fix(hi, 2)}]$ · $E - E(0) = ${num(v, B.E[i] - B.E[0], 4)}$ J and the motor’s work $\int\tau\omega\,dt = ${num(v, B.R.y[i][2], 4)}$ J` +
              (w0 * w0 > g / Rh ? String.raw` · $\omega^2 > g/R$: stable ring at $\theta^* = \arccos(g/R\omega^2) = ${v.fix((Math.acos(g / (Rh * w0 * w0)) * 180) / Math.PI, 1)}^\circ$` : String.raw` · $\omega^2 < g/R$: the bottom is stable`);
          }
          const [lo, hi] = rangeOf(B.Eb, i);
          return String.raw`free hoop ($I = 0.4$ kg·m²): $h = E_{\rm total} = ${v.fix(B.Et[i], 4)}$ J (largest change $${sci(v, maxDev(B.Et, i))}$) · the bead alone has ranged over $[${v.fix(lo, 2)},\ ${v.fix(hi, 2)}]$ J · $L_z = (I + mR^2\sin^2\theta)\,\omega = ${v.fix(B.Lzs[i], 4)}$ kg·m²/s (change $${sci(v, maxDev(B.Lzs, i))}$) while $\omega$ varies`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.9
    {
      num: '7.9',
      kind: 'Corollary',
      name: 'Galilean boosts: the centre of mass moves uniformly',
      statement: String.raw`For an isolated system of particles with interactions depending only on relative positions, the Galilean boost $\mathbf r_i\mapsto\mathbf r_i + s\,\mathbf u\,t$ changes the Lagrangian only by a total derivative, $\delta L = \frac{d}{dt}\big(s\,\mathbf u\cdot M\mathbf R\big)$ to first order, where $M$ is the total mass and $\mathbf R$ the centre of mass. The corresponding Noether charge is
$$\mathbf K = M\mathbf R - \mathbf P\,t ,$$
and its conservation, together with that of $\mathbf P$, says exactly that the centre of mass moves uniformly: $\mathbf R(t) = \mathbf R(0) + (\mathbf P/M)\,t$. The value of $\mathbf K$ is the same in every inertial frame whose origin coincides at $t = 0$. An external force $\mathbf F$ makes $\mathbf K$ drift at the rate $\dot{\mathbf K} = -t\,\mathbf F$.`,
      idea: String.raw`Under the boost each velocity gains $s\mathbf u$, so $T$ changes by $s\,\mathbf u\cdot\sum m_i\dot{\mathbf r}_i = \frac{d}{dt}(s\,\mathbf u\cdot M\mathbf R)$ to first order, while relative positions — and the internal potential — do not change. Noether’s theorem with $F = s\,\mathbf u\cdot M\mathbf R$ (7.3, 6.16) gives the charge $\sum\mathbf p_i\cdot\mathbf u\,t - \mathbf u\cdot M\mathbf R$, i.e. $-\mathbf u\cdot\mathbf K$. Differentiating, $\dot{\mathbf K} = M\dot{\mathbf R} - \mathbf P - t\dot{\mathbf P} = -t\,\dot{\mathbf P}$, which vanishes when $\mathbf P$ is conserved (7.4, 2.4). Galilean relativity (1.8) is the statement that the boosted motion is again a solution.`,
      caption: String.raw`Two masses joined by a spring move along a line; time runs upward. Their world lines wiggle but the green world line of the centre of mass is straight. Slide $u$ to watch from a moving frame: everything shears, the thin dashed lines — the equations solved afresh from the boosted start — fall exactly on the sheared world lines, and $K = MX - Pt$ (right) keeps its value. Turn on the external trap: the centre of mass bends, re-solving in the moving frame no longer reproduces the motion, and $K$ drifts along $-\int t\,F\,dt$ (dashed).`,
      deps: ['mech-7.3', 'mech-1.8', 'mech-2.4', 'mech-6.16'],
      refs: ['Tong §2.4'],
      tags: ['Galilean invariance', 'centre of mass', 'Noether'],
      viz(v) {
        const T = 10, DT = 0.002, EV = 5, ks = 8, l0 = 1.2, m1 = 1;
        const m2S = v.slider('mass ratio $m_2/m_1$', 0.3, 3, 1.6, { step: 0.05 });
        const kap = v.slider('external trap $\\kappa$ (s⁻²)', 0, 0.5, 0, { step: 0.01 });
        const uS = v.slider('frame velocity $u$ (m/s)', -1, 1, 0.45, { step: 0.01 });
        const st = v.stage({ x: [-3, 7], y: [0, T], axes: 'box', height: 360, weight: 1.15, xlabel: 'x (m)', ylabel: 't (s)', title: 'world lines seen from the frame moving at $u$' });
        const sk = v.stage({ x: [0, T], y: [-1, 1], axes: 'box', height: 360, xlabel: 't (s)', title: 'boost charge $K = MX - Pt$ (kg·m)' });
        const cache = memo(); let cur = null;
        const sim = (m2, kk, x0, v0) => rk4rec((t, S) => {
          const f = ks * (S[1] - S[0] - l0), F1 = -kk * m1 * S[0], F2 = -kk * m2 * S[1];
          return [S[2], S[3], (f + F1) / m1, (-f + F2) / m2, -t * (F1 + F2)];
        }, [x0[0], x0[1], v0[0], v0[1], 0], T, Math.round(T / DT), EV);
        const run = () => cache([m2S.value, kap.value, uS.value].join('|'), () => {
          const m2 = m2S.value, kk = kap.value, u = uS.value, M = m1 + m2;
          const x0 = [-0.3, 1.4], v0 = [0.9, -0.1];
          const A = sim(m2, kk, x0, v0), B = sim(m2, kk, x0, [v0[0] - u, v0[1] - u]);
          const W = A.y.map((S, j) => [S[0] - u * A.t[j], S[1] - u * A.t[j]]);          // true motion seen from the moving frame
          const X = W.map((w) => (m1 * w[0] + m2 * w[1]) / M);
          const P = A.y.map((S) => m1 * (S[2] - u) + m2 * (S[3] - u));
          const MX = X.map((x) => M * x), Pt = P.map((p, j) => p * A.t[j]), K = MX.map((mx, j) => mx - Pt[j]), pred = A.y.map((S) => K[0] + S[4]);
          const gap = Math.max(...W.map((w, j) => Math.max(Math.abs(w[0] - B.y[j][0]), Math.abs(w[1] - B.y[j][1]))));
          const xs = [...W.map((w) => w[0]), ...W.map((w) => w[1]), ...B.y.map((S) => S[0]), ...B.y.map((S) => S[1])];
          const [xl, xh] = span([xs], 0.06, 3);
          return { A, B, W, X, P, MX, Pt, K, pred, gap, M, m2, kk, u, V0: P[0] / M, xv: [xl, xh], kr: span([MX, Pt, K, pred], 0.1, 1) };
        });
        v.animate((t) => {
          const C = run(), A = C.A, n = A.t.length - 1, i = Math.min(n, Math.round(Math.min(t, T) / A.dt)), ts = A.t;
          st.setView(C.xv, [0, T]);
          st.line(C.X[0], 0, C.X[0] + C.V0 * T, T, { color: 'green', dash: [3, 5], width: 1.2, alpha: 0.7 });
          for (const [k, col] of [[0, 'blue'], [1, 'orange']]) {
            st.path(C.W.map((w, j) => [w[k], ts[j]]), { color: col, width: 1.2, alpha: 0.3 });
            st.path(C.W.slice(0, i + 1).map((w, j) => [w[k], ts[j]]), { color: col, width: 2.6 });
            st.path(C.B.y.slice(0, i + 1).map((S, j) => [S[k], ts[j]]), { color: 'ink', width: 1.1, dash: [4, 4] });
          }
          st.path(C.X.slice(0, i + 1).map((x, j) => [x, ts[j]]), { color: 'green', width: 3 });
          st.hline(ts[i], { color: 'gold', width: 1.2, alpha: 0.7 });
          st.line(C.W[i][0], ts[i], C.W[i][1], ts[i], { color: 'muted', width: 2 });
          st.dot(C.W[i][0], ts[i], { r: 6, color: 'blue' });
          st.dot(C.W[i][1], ts[i], { r: 4 + 3 * Math.cbrt(C.m2), color: 'orange' });
          st.dot(C.X[i], ts[i], { r: 4.5, color: 'green' });
          if (C.kk > 0) { st.line(0, 0, -C.u * T, T, { color: 'red', alpha: 0.7, dash: [2, 3], width: 1.4 }); st.text('trap centre', -C.u * T, T, { color: 'red', size: 11, align: C.u > 0 ? 'left' : 'right', dx: C.u > 0 ? 4 : -4, dy: 12 }); }
          sk.setView([0, T], C.kr);
          series(sk, ts, C.MX, i, { color: 'green', width: 2 });
          series(sk, ts, C.Pt, i, { color: 'purple', width: 2 });
          series(sk, ts, C.K, i, { color: 'blue', width: 3.2 });
          series(sk, ts, C.pred, i, { color: 'orange', width: 1.8, dash: [7, 5] });
          sk.dot(ts[i], C.K[i], { r: 4.5, color: 'blue' });
          cur = { C, i };
        }, { period: T + 1.2, still: 8.5 });
        v.legend([['blue', '$m_1$ / $K = MX - Pt$'], ['orange', '$m_2$ / $K(0) - \\int_0^t t\\,F_{\\rm ext}\\,dt$'], ['green', 'centre of mass / $MX$'], ['purple', '$Pt$'], ['ink', 're-solved from the boosted start', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { C, i } = cur, tt = v.fix(C.A.t[i], 2);
          const head = String.raw`at $t = ${tt}$ s in the frame moving at $u = ${v.fix(C.u, 2)}$: $K = MX - Pt = ${v.fix(C.K[i], 4)}$ kg·m (start ${v.fix(C.K[0], 4)})`;
          if (C.kk === 0) return head + String.raw` · largest change $${sci(v, maxDev(C.K, i))}$, so $X(t) = X(0) + (P/M)\,t$ with $P/M = ${v.fix(C.V0, 3)}$ m/s · boosted start re-solved: largest gap $${sci(v, C.gap)}$ m — a symmetry`;
          return head + String.raw` · trap on: $K - K(0) = ${num(v, C.K[i] - C.K[0], 4)}$, $-\int_0^t t\,F_{\rm ext}\,dt = ${num(v, C.A.y[i][4], 4)}$ · re-solving in the moving frame misses by ${v.fix(C.gap, 3)} m: the trap picks out a rest frame`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.10
    {
      num: '7.10',
      kind: 'Proposition',
      name: 'Screw symmetry and its conserved combination',
      statement: String.raw`Suppose the potential is invariant under the screw motions $\theta\mapsto\theta + s$, $z\mapsto z + \frac{h}{2\pi}s$ about the $z$-axis — a rotation combined with a translation along the axis, with pitch $h$ (the rise per turn; $h<0$ for a left-handed screw) — for instance $U$ depends on $\theta$ and $z$ only through $\theta - 2\pi z/h$, as for a helical groove. Then neither $L_z$ nor $p_z$ need be conserved, but the combination
$$\mathcal Q = L_z + \frac{h}{2\pi}\,p_z$$
is. With a wrong coefficient $h'$, $\frac{d}{dt}\big(L_z + \frac{h'}{2\pi}p_z\big) = \big(1 - \frac{h'}{h}\big)\,\tau_z$, where $\tau_z$ is the torque about the axis.`,
      idea: String.raw`The generator of the screw is $K = \partial_\theta + \frac{h}{2\pi}\partial_z$; kinetic energy is invariant under rotations and axial translations, so Noether’s theorem (7.3) gives the charge $p_\theta + \frac{h}{2\pi}p_z$ with $p_\theta = L_z$. Directly: a groove depending on $\psi = \theta - 2\pi z/h$ pushes with torque $\tau_z = -\partial U/\partial\theta = -U'(\psi)$ and axial force $F_z = -\partial U/\partial z = \frac{2\pi}{h}U'(\psi)$, so $\tau_z + \frac{h}{2\pi}F_z = 0$. Unrolling the cylinder makes it plain: the screw becomes a translation along the groove, and $\mathcal Q$ is the momentum along it.`,
      caption: String.raw`A particle slides on a cylinder ($a = 1$) cut by a helical groove; left in 3D, middle unrolled, where the groove is a family of straight lines and the faint arrows show the screw generator. It rocks across the groove while drifting along it: $L_z$ (purple) and $\frac{h}{2\pi}p_z$ (teal) swing in opposition and their sum (blue) is flat. Change the pitch or the handedness — the conserved mix changes with it. Use the mismatch slider to try a wrong coefficient: the sum then drifts, exactly as the dashed prediction says.`,
      deps: ['mech-7.3', 'mech-7.4', 'mech-7.5'],
      refs: ['Goldstein Ex. 2.19'],
      tags: ['symmetry', 'Noether', 'helix'],
      viz(v) {
        const a = 1, V0 = 0.5, T = 30, DT = 0.005, EV = 4, ZL = 1.75;
        const hand = v.select('groove', [{ value: 'R', label: 'right-handed' }, { value: 'L', label: 'left-handed' }], 'R');
        const hS = v.slider('pitch $|h|$ (rise per turn)', 1, 4, 2.4, { step: 0.05 });
        const dS = v.slider("try a wrong mix: $h' - h$", -2, 2, 0, { step: 0.05 });
        const S3 = v.stage({ x: [-1.55, 1.55], y: [-2.05, 2.05], equal: true, axes: false, height: 340, title: 'cylinder with a helical groove' });
        const sc = v.scene3(S3, { yaw: -0.45, pitch: 0.22, axis: 1.2, lim: 2, hint: false, axes: false });
        const su = v.stage({ x: [-Math.PI, Math.PI], y: [-ZL, ZL], equal: true, axes: 'box', height: 340, xlabel: 'aθ', title: 'unrolled: $a\\theta$ across, $z$ up' });
        const sp = v.stage({ x: [0, T], y: [-1, 1], axes: 'box', height: 230, full: true, xlabel: 't', title: "the screw charge $L_z + \\frac{h'}{2\\pi}p_z$ and its parts" });
        const cache = memo(); let cur = null;
        const run = () => cache([hand.value, hS.value, dS.value].join('|'), () => {
          const h = (hand.value === 'R' ? 1 : -1) * hS.value, hp = h + dS.value, c = (2 * Math.PI) / h;
          const nrm = Math.hypot(2 * Math.PI * a, h), d = [(2 * Math.PI * a) / nrm, h / nrm], nn = [-h / nrm, (2 * Math.PI * a) / nrm];
          const vel = [1.0 * nn[0] + 0.13 * d[0], 1.0 * nn[1] + 0.13 * d[1]];
          const z0 = -(0.13 * T * d[1]) / 2, th0 = c * z0;
          const f = (t, Y) => { const s = Math.sin(Y[0] - c * Y[1]); return [Y[2], Y[3], (-V0 * s) / (a * a), c * V0 * s, V0 * s * (hp / h - 1)]; };
          const R = rk4rec(f, [th0, z0, vel[0] / a, vel[1], 0], T, Math.round(T / DT), EV);
          const Lz = R.y.map((Y) => a * a * Y[2]), Pz = R.y.map((Y) => (hp / (2 * Math.PI)) * Y[3]), Q = Lz.map((l, j) => l + Pz[j]), pred = R.y.map((Y) => Q[0] + Y[4]);
          const Qtrue = R.y.map((Y) => a * a * Y[2] + (h / (2 * Math.PI)) * Y[3]);
          return { R, h, hp, c, Lz, Pz, Q, pred, Qtrue, yr: span([Lz, Pz, Q, pred], 0.12, 0.4) };
        });
        v.animate((t) => {
          const B = run(), R = B.R, n = R.t.length - 1, i = Math.min(n, Math.round(((Math.min(t, 12) / 12) * T) / R.dt)), h = B.h, c = B.c;
          const P3 = (th, z) => [a * Math.cos(th), a * Math.sin(th), z];
          // 3D cylinder
          sc.begin();
          for (const z of [-ZL, 0, ZL]) { const ring = []; for (let k = 0; k <= 60; k++) ring.push(P3((TAU * k) / 60, z)); sc.path(ring, { color: 'faint', width: 1 }); }
          for (let k = 0; k < 12; k++) sc.line(P3((TAU * k) / 12, -ZL), P3((TAU * k) / 12, ZL), { color: 'faint', width: 0.8, alpha: 0.6 }, 6);
          const groove = []; for (let k = 0; k <= 240; k++) { const z = -ZL + (2 * ZL * k) / 240; groove.push(P3(c * z, z)); }
          sc.path(groove, { color: 'orange', width: 2.2, alpha: 0.85 });
          const tr = R.y.slice(Math.max(0, i - 500), i + 1).map((Y) => P3(Y[0], Y[1]));
          sc.path(tr, { color: 'accent', width: 1.8 });
          sc.dot(P3(R.y[i][0], R.y[i][1]), { r: 6.5, color: 'gold' });
          sc.arrow([0, 0, -ZL - 0.25], [0, 0, ZL + 0.35], { color: 'muted', width: 1.4, head: 7 });
          sc.flush();
          // unrolled
          su.field(() => [a, h / (2 * Math.PI)], { spacing: 46, color: 'muted', alpha: 0.3 });
          su.clip(() => {
            for (let k = -9; k <= 9; k++) {
              su.line(a * (c * -3 + TAU * k), -3, a * (c * 3 + TAU * k), 3, { color: 'orange', width: 2, alpha: 0.85 });
              su.line(a * (c * -3 + TAU * k + Math.PI), -3, a * (c * 3 + TAU * k + Math.PI), 3, { color: 'orange', width: 1, dash: [3, 4], alpha: 0.5 });
            }
          });
          const wrap = (th) => a * (((th + Math.PI) % TAU + TAU) % TAU - Math.PI);
          const pts = []; let prev = null;
          for (let j = Math.max(0, i - 500); j <= i; j++) { const p = [wrap(R.y[j][0]), R.y[j][1]]; if (prev && Math.abs(p[0] - prev[0]) > Math.PI * a) pts.push(null); pts.push(p); prev = p; }
          su.path(pts, { color: 'accent', width: 1.8 });
          su.dot(wrap(R.y[i][0]), R.y[i][1], { r: 6, color: 'gold' });
          su.corner('groove bottom ─  ridge ┄', 'tl', { color: 'orange', size: 11 });
          // charges
          sp.setView([0, T], B.yr);
          sp.hline(0, { color: 'faint' });
          series(sp, R.t, B.Lz, i, { color: 'purple', width: 2 });
          series(sp, R.t, B.Pz, i, { color: 'teal', width: 2 });
          series(sp, R.t, B.Q, i, { color: 'blue', width: 3.2 });
          series(sp, R.t, B.pred, i, { color: 'orange', width: 1.8, dash: [7, 5] });
          sp.dot(R.t[i], B.Q[i], { r: 4.5, color: 'blue' });
          cur = { B, i };
        }, { period: 13.2, still: 11.4 });
        v.legend([['purple', '$L_z = ma^2\\dot\\theta$'], ['teal', "$\\frac{h'}{2\\pi}\\,p_z$"], ['blue', "$L_z + \\frac{h'}{2\\pi}p_z$"], ['orange', "start $+\\int_0^t(1-\\frac{h'}{h})\\,\\tau_z\\,dt$", { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, tt = v.fix(B.R.t[i], 1), dQ = B.Q[i] - B.Q[0];
          const [ll, lh] = rangeOf(B.Lz, i), pz = B.R.y.map((Y) => Y[3]), [pl, ph] = rangeOf(pz, i);
          const head = String.raw`pitch $h = ${v.fix(B.h, 2)}$ (${B.h > 0 ? 'right' : 'left'}-handed), coefficient $h'/2\pi = ${v.fix(B.hp / (2 * Math.PI), 4)}$ · at $t = ${tt}$: $L_z + \frac{h'}{2\pi}p_z = ${v.fix(B.Q[i], 4)}$ (start ${v.fix(B.Q[0], 4)})`;
          if (dS.value === 0) return head + String.raw` — conserved to $${sci(v, maxDev(B.Q, i))}$, while $L_z$ has ranged over $[${v.fix(ll, 3)},\ ${v.fix(lh, 3)}]$ and $p_z$ over $[${v.fix(pl, 3)},\ ${v.fix(ph, 3)}]$`;
          return head + String.raw` — wrong mix: change $${num(v, dQ, 4)}$, predicted $\int(1-\frac{h'}{h})\tau_z\,dt = ${num(v, B.R.y[i][4], 4)}$; the right mix $L_z + \frac{h}{2\pi}p_z$ still holds to $${sci(v, maxDev(B.Qtrue, i))}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.11
    {
      num: '7.11',
      kind: 'Theorem',
      name: 'Ten classical conservation laws',
      statement: String.raw`For an isolated system of point particles in three dimensions whose interactions depend only on relative positions (and are invariant under rotations), the Lagrangian is invariant under the ten-parameter Galilean group of time translations (1), space translations (3), rotations (3) and boosts (3). Correspondingly, ten functions are constant along every motion:
$$E,\qquad \mathbf P = \sum\mathbf p_i,\qquad \mathbf L = \sum\mathbf r_i\times\mathbf p_i,\qquad \mathbf K = M\mathbf R - \mathbf P\,t .$$
An external field preserves exactly those charges whose symmetries it respects: a uniform field along $z$ keeps $E$, $P_x$, $P_y$, $L_z$, $K_x$, $K_y$; a static central field keeps $E$ and $\mathbf L$; a time-dependent central field keeps only $\mathbf L$.`,
      idea: String.raw`Each conservation law is Noether’s theorem (7.3) for one generator: homogeneity of time gives $E$ (7.7), of space gives $\mathbf P$ (7.4), isotropy gives $\mathbf L$ (7.5), and boosts give $\mathbf K$ (7.9). For the Newtonian three-body problem Bruns (1887) proved that every algebraic integral is a function of these ten; special systems may have more (the Runge–Lenz vector of Kepler’s problem, 7.3), and the three-body problem (8.20) shows how little ten integrals do for $N\ge3$. Breaking a symmetry with an external field removes precisely its charge.`,
      caption: String.raw`Five bodies attract by softened gravity, integrated with velocity Verlet. Right: one lane per conserved quantity, showing its change since $t = 0$ (lane height = a typical size of that quantity). With no outside world all ten lanes stay flat — the energy only to the tiny bounded error of the integrator. Switch on a uniform field, a central pull, or a pulsating pull, and watch exactly the predicted lanes turn red. *New cluster* draws another random cluster.`,
      deps: ['mech-7.4', 'mech-7.5', 'mech-7.7', 'mech-7.9'],
      see: ['mech-8.20'],
      refs: ['Arnold §10', 'Tong §2.4'],
      tags: ['conservation laws', 'Galilean group', 'N-body'],
      scope: String.raw`Holds for isolated systems in Newtonian mechanics with Galilean-invariant interactions; in special relativity the boost charge becomes the relativistic centre-of-energy theorem, and the group is the ten-parameter Poincaré group.`,
      viz(v) {
        const N = 5, SOFT = 0.15, T = 16, DT = 0.001, EV = 20;
        const ext = v.select('outside world', [{ value: 'none', label: 'none (isolated)' }, { value: 'unif', label: 'uniform field' }, { value: 'cent', label: 'central pull' }, { value: 'puls', label: 'pulsating pull' }], 'none');
        let seed = 4;
        v.button('New cluster', () => { seed++; });
        const S = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, axes: false, height: 380, title: 'five bodies (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axis: 1.5, lim: 2, hint: false });
        const sd = v.stage({ x: [0, 1], y: [0, 10], axes: false, height: 380, weight: 1.25, title: 'change of each quantity since $t = 0$' });
        const NAMES = ['E', 'P_x', 'P_y', 'P_z', 'L_x', 'L_y', 'L_z', 'K_x', 'K_y', 'K_z'];
        const GROUP = { 0: 'time shift', 1: 'translations', 4: 'rotations', 7: 'boosts' };
        const KEEP = { none: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], unif: [1, 1, 1, 0, 0, 0, 1, 1, 1, 0], cent: [1, 0, 0, 0, 1, 1, 1, 0, 0, 0], puls: [0, 0, 0, 0, 1, 1, 1, 0, 0, 0] };
        const COL = ['blue', 'orange', 'purple', 'teal', 'pink'];
        const cache = memo(); let cur = null;
        const run = () => cache(ext.value + '|' + seed, () => {
          const rng = v.rng(seed), md = ext.value, gz = 0.25, kap0 = 0.15;
          const m = Array.from({ length: N }, () => 0.5 + rng());
          let x = Array.from({ length: N }, () => { let p; do { p = [rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1]; } while (Math.hypot(...p) > 1); return p; });
          let vv = Array.from({ length: N }, () => [rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1]);
          const M = m.reduce((s, c) => s + c, 0);
          const cmv = (A) => [0, 1, 2].map((k) => A.reduce((s, p, i) => s + m[i] * p[k], 0) / M);
          const c0 = cmv(x), w0 = cmv(vv);
          x = x.map((p) => p.map((c, k) => c - c0[k])); vv = vv.map((p) => p.map((c, k) => c - w0[k]));
          vv = vv.map((p, i) => [p[0] - 0.45 * x[i][1], p[1] + 0.45 * x[i][0], p[2]]);   // add a net spin about z
          let U0 = 0, T0 = 0;
          for (let i = 0; i < N; i++) { T0 += 0.5 * m[i] * (vv[i][0] ** 2 + vv[i][1] ** 2 + vv[i][2] ** 2); for (let j = i + 1; j < N; j++) U0 -= (m[i] * m[j]) / Math.sqrt((x[i][0] - x[j][0]) ** 2 + (x[i][1] - x[j][1]) ** 2 + (x[i][2] - x[j][2]) ** 2 + SOFT * SOFT); }
          const sv = Math.sqrt((0.4 * -U0) / T0);
          const Vb = [0.12, 0.06, 0.03];
          vv = vv.map((p) => p.map((c, k) => c * sv + Vb[k])); x = x.map((p) => p.map((c, k) => c - (Vb[k] * T) / 2));
          const kap = (t) => (md === 'cent' ? kap0 : md === 'puls' ? kap0 * (1 + 0.8 * Math.sin(1.3 * t)) : 0);
          const F = x.map(() => [0, 0, 0]);
          const force = (X, t) => {
            for (const f of F) { f[0] = 0; f[1] = 0; f[2] = 0; }
            for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
              const d = [X[j][0] - X[i][0], X[j][1] - X[i][1], X[j][2] - X[i][2]], r2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2] + SOFT * SOFT, f = (m[i] * m[j]) / (r2 * Math.sqrt(r2));
              for (let k = 0; k < 3; k++) { F[i][k] += f * d[k]; F[j][k] -= f * d[k]; }
            }
            const kk = kap(t);
            for (let i = 0; i < N; i++) { if (md === 'unif') F[i][2] -= m[i] * gz; if (kk) for (let k = 0; k < 3; k++) F[i][k] -= kk * m[i] * X[i][k]; }
          };
          const charges = (X, V, t) => {
            let E = 0; const P = [0, 0, 0], L = [0, 0, 0], R = [0, 0, 0], kk = kap(t);
            for (let i = 0; i < N; i++) {
              const p = V[i].map((c) => m[i] * c), r = X[i];
              E += 0.5 * m[i] * (V[i][0] ** 2 + V[i][1] ** 2 + V[i][2] ** 2);
              if (md === 'unif') E += m[i] * gz * r[2];
              if (kk) E += 0.5 * kk * m[i] * (r[0] ** 2 + r[1] ** 2 + r[2] ** 2);
              for (let j = i + 1; j < N; j++) E -= (m[i] * m[j]) / Math.sqrt((r[0] - X[j][0]) ** 2 + (r[1] - X[j][1]) ** 2 + (r[2] - X[j][2]) ** 2 + SOFT * SOFT);
              for (let k = 0; k < 3; k++) { P[k] += p[k]; R[k] += m[i] * r[k]; }
              L[0] += r[1] * p[2] - r[2] * p[1]; L[1] += r[2] * p[0] - r[0] * p[2]; L[2] += r[0] * p[1] - r[1] * p[0];
            }
            return [E, ...P, ...L, R[0] - P[0] * t, R[1] - P[1] * t, R[2] - P[2] * t];
          };
          force(x, 0);
          const out = { t: [0], x: [x.map((p) => p.slice())], Q: [charges(x, vv, 0)], dt: DT * EV };
          const steps = Math.round(T / DT);
          for (let s = 1; s <= steps; s++) {
            for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++) { vv[i][k] += (0.5 * DT * F[i][k]) / m[i]; x[i][k] += DT * vv[i][k]; }
            force(x, s * DT);
            for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++) vv[i][k] += (0.5 * DT * F[i][k]) / m[i];
            if (s % EV === 0) { out.t.push(s * DT); out.x.push(x.map((p) => p.slice())); out.Q.push(charges(x, vv, s * DT)); }
          }
          const rr = Math.sqrt(out.x[0].reduce((s, p) => s + p.reduce((a, c) => a + c * c, 0), 0) / N);
          const vr = Math.sqrt((2 * T0 * sv * sv) / M);
          const scale = [Math.abs(T0 * sv * sv) + Math.abs(U0), ...[0, 0, 0].map(() => M * vr), ...[0, 0, 0].map(() => M * rr * vr), ...[0, 0, 0].map(() => M * rr)];
          const dev = out.Q[0].map((q0, c) => out.Q.map((Q) => Q[c] - q0));
          return { ...out, m, M, scale, dev, md };
        });
        v.animate((t) => {
          const B = run(), n = B.t.length - 1, i = Math.min(n, Math.round(((Math.min(t, 12) / 12) * T) / B.dt)), X = B.x[i];
          sc.begin();
          if (B.md === 'unif') for (const p of [[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]]) sc.arrow([p[0], p[1], 1.3], [p[0], p[1], 0.8], { color: 'red', width: 1.6, head: 7, alpha: 0.7 });
          if (B.md === 'cent' || B.md === 'puls') { sc.dot([0, 0, 0], { r: 5, color: 'red' }); for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) sc.arrow(d.map((c) => 1.6 * c), d.map((c) => 1.15 * c), { color: 'red', width: 1.4, head: 6, alpha: 0.6 }); }
          for (let b = 0; b < N; b++) sc.path(B.x.slice(Math.max(0, i - 150), i + 1).map((Y) => Y[b]), { color: COL[b], width: 1.3, alpha: 0.7 });
          const cm = (Y) => [0, 1, 2].map((k) => Y.reduce((s, p, j) => s + B.m[j] * p[k], 0) / B.M);
          sc.path(B.x.slice(0, i + 1).filter((_, j) => j % 4 === 0).map(cm), { color: 'green', width: 1.4, dash: [3, 3] });
          for (let b = 0; b < N; b++) sc.dot(X[b], { r: 3 + 3 * B.m[b], color: COL[b] });
          sc.dot(cm(X), { r: 4, color: 'green' });
          sc.flush();
          // dashboard
          const keep = KEEP[B.md], x0 = 0.15, x1 = 0.76;
          for (let c = 0; c < 10; c++) {
            const yc = 9.5 - c, ok = maxDev(B.dev[c], i, 0) / B.scale[c] < 1e-3, col = ok ? 'green' : 'red';
            if (GROUP[c] != null && c) sd.line(0, yc + 0.5, 1, yc + 0.5, { color: 'faint', width: 1 });
            sd.line(x0, yc, x1, yc, { color: 'faint', width: 1, dash: [2, 3] });
            sd.tex(NAMES[c], 0.02, yc, { color: col, size: 14, baseline: 'middle' });
            if (GROUP[c] != null) sd.text(GROUP[c], x0 + 0.005, yc + 0.47, { color: 'muted', size: 10, baseline: 'top', align: 'left' });
            const pts = []; for (let j = 0; j <= i; j++) pts.push([x0 + ((x1 - x0) * B.t[j]) / T, yc + 0.4 * clamp(B.dev[c][j] / B.scale[c], -1, 1)]);
            if (pts.length > 1) sd.path(pts, { color: col, width: 1.8 });
            const md = maxDev(B.dev[c], i, 0);
            sd.tex(md < 1e-300 ? '0' : v.sci(md, 1), 0.985, yc, { color: col, size: 12, align: 'right', baseline: 'middle' });
            if (!keep[c] && ok && i > 10) sd.text('(not yet)', x1 + 0.01, yc + 0.3, { color: 'faint', size: 9, align: 'left' });
          }
          cur = { B, i };
        }, { period: 13, still: 12 });
        v.legend([['green', 'conserved (change below 0.1 % of its scale)'], ['red', 'not conserved'], ['muted', 'right column: largest change so far']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, keep = KEEP[B.md];
          const ok = B.dev.map((d, c) => maxDev(d, i, 0) / B.scale[c] < 1e-3), cnt = ok.filter(Boolean).length;
          const relE = maxDev(B.dev[0], i, 0) / B.scale[0];
          const why = { none: 'all ten symmetries of the Galilean group hold', unif: 'the field along $z$ spoils $z$-translations, rotations about horizontal axes and $z$-boosts', cent: 'a fixed centre spoils all translations and boosts, but not rotations about it or time shifts', puls: 'a pulsating centre spoils time shifts as well, leaving only rotations' }[B.md];
          return String.raw`conserved at $t = ${v.fix(B.t[i], 1)}$: **${cnt} of 10** (predicted ${keep.reduce((s, c) => s + c, 0)}) — ${why} · energy error of the integrator: $${sci(v, relE)}$ of its scale; $\mathbf P$, $\mathbf L$, $\mathbf K$ exact to round-off when kept`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 7.12
    {
      num: '7.12',
      kind: 'Method',
      name: 'Eliminating a cyclic coordinate: effective potential',
      statement: String.raw`If $\phi$ is cyclic, its momentum $p_\phi$ is a constant fixed by the initial data, and the remaining coordinates obey the equations of the **Routhian** $\mathcal R = L - p_\phi\dot\phi$, with $\dot\phi$ eliminated in favour of $p_\phi$. For a natural system with one remaining coordinate this means one-dimensional motion in an **effective potential**. For the spherical pendulum ($\theta$ from the downward vertical, length $l$),
$$\tfrac12ml^2\dot\theta^2 + U_{\rm eff}(\theta) = E,\qquad U_{\rm eff}(\theta) = \frac{p_\phi^2}{2ml^2\sin^2\theta} - mgl\cos\theta ,$$
so $\theta$ oscillates between the two roots of $U_{\rm eff}(\theta) = E$ (energy diagram, 3.10) while $\phi$ advances at $\dot\phi = p_\phi/(ml^2\sin^2\theta)$. The centrifugal term must enter with a plus sign: substituting $\dot\phi$ into $L$ instead of into $E$ (or $\mathcal R$) reverses it and gives wrong motion.`,
      idea: String.raw`With $p_\phi$ fixed (7.1), the energy $E = \tfrac12ml^2(\dot\theta^2 + \sin^2\theta\,\dot\phi^2) - mgl\cos\theta$ depends on $\theta$ and $\dot\theta$ alone once $\dot\phi = p_\phi/(ml^2\sin^2\theta)$ is inserted, so the energy-diagram analysis of 3.10–3.11 applies to $\theta$. In $L$ the same substitution flips the sign of the $\dot\phi^2$ term, because $L$ is stationary at fixed $\phi$-endpoints, not at fixed $p_\phi$; Routh’s $\mathcal R = L - p_\phi\dot\phi$ restores the right sign. The same reduction drives the central-force problem (8.3) and the heavy top.`,
      caption: String.raw`A spherical pendulum seen from above traces a rosette. Right: the effective potential for the current $p_\phi$, the energy line and its two turning points; the green band on the left is the ring those turning points allow, and the simulated bob never leaves it, touching both edges. Change the start angle and the two speeds. Then switch to “the Lagrangian (wrong)”: the centrifugal barrier turns into a pit, the predicted band (red) misses the motion entirely.`,
      deps: ['mech-7.1', 'mech-3.10', 'mech-6.12'],
      see: ['mech-8.3'],
      refs: ['Tong §2.5', 'Goldstein §3.3'],
      tags: ['effective potential', 'cyclic coordinates', 'Routhian'],
      credit: 'Routh, 1877',
      viz(v) {
        const g = 9.81, l = 1, m = 1, T = 10, DT = 0.001, EV = 10, D = 180 / Math.PI;
        const how = v.select('put $p_\\phi$ into', [{ value: 'E', label: 'the energy (right)' }, { value: 'L', label: 'the Lagrangian (wrong)' }], 'E');
        const thS = v.slider('start angle $\\theta_0$ (°)', 10, 140, 50, { step: 1 });
        const phS = v.slider('azimuthal speed $\\dot\\phi_0$ (rad/s)', 0, 8, 4.2, { step: 0.05 });
        const tdS = v.slider('polar speed $\\dot\\theta_0$ (rad/s)', -4, 4, 1.5, { step: 0.05 });
        const st = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, axes: false, height: 340, title: 'bob seen from above ($l = 1$ m)' });
        const su = v.stage({ x: [0, 180], y: [-12, 20], axes: 'box', height: 340, weight: 1.25, xlabel: 'θ (°)', title: 'effective potential (J) along $\\theta$' });
        const cache = memo(); let cur = null;
        const run = () => cache([thS.value, phS.value, tdS.value].join('|'), () => {
          const a0 = thS.value / D, pd = phS.value, td = tdS.value;
          const r0 = [l * Math.sin(a0), 0, -l * Math.cos(a0)], v0 = [l * td * Math.cos(a0), l * Math.sin(a0) * pd, l * td * Math.sin(a0)];
          const f = (t, Y) => { const mu = (Y[3] * Y[3] + Y[4] * Y[4] + Y[5] * Y[5] - g * Y[2]) / (l * l); return [Y[3], Y[4], Y[5], -mu * Y[0], -mu * Y[1], -g - mu * Y[2]]; };
          const post = (Y) => { const r = Math.hypot(Y[0], Y[1], Y[2]), u = [Y[0] / r, Y[1] / r, Y[2] / r], vr = Y[3] * u[0] + Y[4] * u[1] + Y[5] * u[2]; return [l * u[0], l * u[1], l * u[2], Y[3] - vr * u[0], Y[4] - vr * u[1], Y[5] - vr * u[2]]; };
          const R = rk4rec(f, [...r0, ...v0], T, Math.round(T / DT), EV, post);
          const th = R.y.map((Y) => Math.acos(clamp(-Y[2] / l, -1, 1)) * D), pphi = R.y.map((Y) => m * (Y[0] * Y[4] - Y[1] * Y[3]));
          const E = 0.5 * m * (v0[0] ** 2 + v0[1] ** 2 + v0[2] ** 2) - m * g * l * Math.cos(a0);
          return { R, th, pphi, p: pphi[0], E, a0, td, meas: rangeOf(th) };
        });
        // turning points of a 1D energy function W(θ) = U(θ) − E, searched outward from θ0 (degrees)
        const turning = (U, E, a0) => {
          const find = (dir) => {
            let x = a0 * D, step = 0.25 * dir;
            if (U(x) > E) return null;
            while (x + step > 0.01 && x + step < 179.99) {
              if (U(x + step) > E) { let lo = x, hi = x + step; for (let k = 0; k < 50; k++) { const mid = (lo + hi) / 2; if (U(mid) > E) hi = mid; else lo = mid; } return (lo + hi) / 2; }
              x += step;
            }
            return dir < 0 ? 0 : 180;
          };
          return [find(-1), find(1)];
        };
        v.animate((t) => {
          const B = run(), R = B.R, n = R.t.length - 1, i = Math.min(n, Math.round(Math.min(t, T) / R.dt)), right = how.value === 'E';
          const cf = (thd) => (B.p * B.p) / (2 * m * l * l * Math.sin(thd / D) ** 2), Ub = (thd) => -m * g * l * Math.cos(thd / D);
          const U = (thd) => (right ? cf(thd) : -cf(thd)) + Ub(thd);
          const E1 = 0.5 * m * l * l * B.td * B.td + U(B.a0 * D);          // energy of the one-dimensional model
          const [ta, tb] = B.p === 0 && right ? [0, turning(U, E1, B.a0)[1]] : turning(U, E1, B.a0);
          const col = right ? 'green' : 'red';
          // top view
          const rad = (thd) => l * Math.sin(thd / D);
          const rlo = Math.min(rad(ta), rad(tb)), rhi = ta <= 90 && tb >= 90 ? l : Math.max(rad(ta), rad(tb));
          const circ = (r) => Array.from({ length: 97 }, (_, k) => [r * Math.cos((TAU * k) / 96), r * Math.sin((TAU * k) / 96)]);
          st.rings([circ(rhi), circ(Math.max(rlo, 1e-4))], { fill: col, fillAlpha: 0.16, color: col, width: 1.2, evenodd: true });
          st.path(circ(l), { color: 'faint', width: 1 });
          st.path(R.y.slice(0, i + 1).map((Y) => [Y[0], Y[1]]), { color: 'accent', width: 1.4 });
          const Y = R.y[i];
          st.line(0, 0, Y[0], Y[1], { color: 'muted', width: 1.5 });
          st.dot(0, 0, { r: 3, color: 'ink' });
          st.dot(Y[0], Y[1], { r: 6.5, color: 'gold' });
          st.corner(right ? 'predicted ring ✓' : 'predicted ring ✗', 'tl', { color: col, weight: 600 });
          // effective potential
          const samp = []; for (let k = 2; k <= 178; k++) samp.push(U(k));
          const fin = samp.filter(isFinite), umin = Math.max(Math.min(...fin, E1), E1 - 20), hi = E1 + Math.max(4, 0.8 * (E1 - umin)), lo = umin - 0.15 * (hi - umin);
          su.setView([0, 180], [lo, hi]);
          su.fn(Ub, { domain: [0, 180], color: 'muted', dash: [4, 4], width: 1.2 });
          su.fn((x) => (right ? cf(x) : -cf(x)) + lo + 0.02 * (hi - lo), { domain: [1, 179], color: 'purple', dash: [2, 3], width: 1.1, alpha: 0.7 });
          if (isFinite(ta) && isFinite(tb)) su.between(U, () => E1, Math.max(ta, 0.5), Math.min(tb, 179.5), { fill: col, fillAlpha: 0.16 });
          su.fn(U, { domain: [0.5, 179.5], n: 600, color: right ? 'blue' : 'red', width: 2.6 });
          su.hline(E1, { color: 'gold', width: 1.6 });
          for (const tp of [ta, tb]) if (tp > 0.01 && tp < 179.99) su.dot(tp, E1, { r: 5.5, color: col });
          const [ml, mh] = B.meas;
          su.vline(ml, { color: 'accent', dash: [3, 3], width: 1.2 }); su.vline(mh, { color: 'accent', dash: [3, 3], width: 1.2 });
          su.dot(B.th[i], E1, { r: 5, color: 'gold' });
          if (right) su.line(B.th[i], U(B.th[i]), B.th[i], E1, { color: 'gold', width: 1.4, dash: [2, 2] });
          su.text('E', 178, E1, { color: 'gold', size: 12, align: 'right', dy: -9, math: true });
          cur = { B, i, ta, tb, right, E1 };
        }, { period: T + 1, still: 9 });
        v.legend([['blue', '$U_{\\rm eff} = \\frac{p_\\phi^2}{2ml^2\\sin^2\\theta} - mgl\\cos\\theta$'], ['muted', '$-mgl\\cos\\theta$', { dash: true }], ['purple', 'centrifugal term (shifted)', { dash: true }], ['gold', 'energy, current $\\theta$'], ['accent', 'simulated range of $\\theta$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { B, i, ta, tb, right } = cur, [ml, mh] = B.meas;
          const fmtT = (x) => (x <= 0.01 ? '0°' : x >= 179.99 ? '180°' : `${v.fix(x, 2)}°`);
          const head = String.raw`$p_\phi = ml^2\sin^2\theta\,\dot\phi = ${v.fix(B.p, 4)}$ kg·m²/s (change $${sci(v, maxDev(B.pphi, i))}$)`;
          if (right) return head + String.raw` · turning points of $U_{\rm eff}$: $\theta\in[$${fmtT(ta)}, ${fmtT(tb)}$]$ · the 3D simulation swept $[$${fmtT(ml)}, ${fmtT(mh)}$]$`;
          const fall = ta <= 0.01 || tb >= 179.99;
          return head + String.raw` · with the sign flipped the “barrier” is a pit: predicted $\theta\in[$${fmtT(ta)}, ${fmtT(tb)}$]$${fall ? ' (falls into a pole)' : ''}, but the pendulum swept $[$${fmtT(ml)}, ${fmtT(mh)}$]$ — eliminate $\phi$ in $E$ or in the Routhian $L - p_\phi\dot\phi$, not in $L$`;
        });
      },
    },
  ],
};
