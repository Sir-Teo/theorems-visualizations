// Classical Mechanics — Chapter 3: Work and energy (part b: 3.9–3.16)

// ---------- shared helpers ----------
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const vec = (s, x, y, u, w, k, st) => s.arrow(x, y, x + u * k, y + w * k, st);
function rk4step(f, t, y, h) {
  const k1 = f(t, y), y2 = y.map((v, i) => v + h / 2 * k1[i]), k2 = f(t + h / 2, y2), y3 = y.map((v, i) => v + h / 2 * k2[i]), k3 = f(t + h / 2, y3), y4 = y.map((v, i) => v + h * k3[i]), k4 = f(t + h, y4);
  return y.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
/** Root of g on [a, b] by bisection (g(a), g(b) of opposite signs). */
function bisect(g, a, b, n = 60) { let ga = g(a); for (let i = 0; i < n; i++) { const m = (a + b) / 2, gm = g(m); if ((gm > 0) === (ga > 0)) { a = m; ga = gm; } else b = m; } return (a + b) / 2; }
/** Turning points of a 1D motion with energy E starting at x0 inside [lo, hi]: {a, b} (null = no turning point on that side). */
function turning(U, E, x0, lo, hi, dx = 0.004) {
  const side = (dir) => { let x = x0; while (true) { const nx = x + dir * dx; if (nx < lo || nx > hi) return null; if (U(nx) >= E) return bisect((z) => U(z) - E, x, nx); x = nx; } };
  return { a: side(-1), b: side(1) };
}
/** Complete elliptic integral of the first kind K(k) by the arithmetic–geometric mean. */
function ellipK(k) { let a = 1, b = Math.sqrt(1 - k * k); for (let i = 0; i < 30; i++) { const t = (a + b) / 2; b = Math.sqrt(a * b); a = t; } return Math.PI / (2 * a); }
/** Zig-zag spring between two points. */
function spring(s, p, q, st = {}) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, n = st.coils ?? 14, amp = st.amp ?? 0.08, pts = [p];
  for (let j = 1; j < 2 * n; j++) { const a = 0.1 + 0.8 * j / (2 * n), w = j % 2 ? amp : -amp; pts.push([p[0] + dx * a + nx * w, p[1] + dy * a + ny * w]); }
  pts.push(q); s.path(pts, { color: st.color || 'muted', width: st.width ?? 1.4 });
}

export default {
  collection: 'mech',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9', kind: 'Model', name: 'Ballistic pendulum',
      statement: String.raw`A bullet of mass $m$ and speed $u$ embeds itself in a block of mass $M$ hanging from a light string of length $L$. Treat the impact as instantaneous: during it the string stays vertical, external forces deliver negligible impulse and **momentum is conserved**, so the block starts with $V = \dfrac{mu}{m+M}$. During the swing only gravity does work (the tension is perpendicular to the motion) and **mechanical energy is conserved**, so the block rises by $h = V^2/2g$. Measuring $h$ therefore gives
$$u = \frac{m+M}{m}\sqrt{2gh}.$$
The collision is perfectly inelastic: a fraction $M/(m+M)$ of the bullet’s kinetic energy is lost to heat and deformation, so assuming energy conservation through the impact grossly underestimates $u$.`,
      idea: String.raw`The motion has two stages governed by different conservation laws. In the short impact the internal forces are huge but the external impulse is negligible, so total momentum is conserved (mech-2.6) while kinetic energy is not; in the swing the forces are gravity (conservative) and tension (no work), so energy is conserved (3.6) while momentum is not (the string pulls). Chaining the two gives $u$; the kinetic energy ratio after/before is $\tfrac12(m+M)V^2 / \tfrac12mu^2 = m/(m+M)$.`,
      caption: String.raw`Set the bullet speed and the block mass and watch the impact in slow motion, then the swing. The bars (log scale) compare the bullet’s energy, the energy just after the impact and the potential energy at the top: the impact destroys almost all of it. The readout infers $u$ from the measured height in two ways.`,
      scope: String.raw`Holds when the impact time is much shorter than the pendulum period (no swing during the impact), air drag is negligible, and the string stays taut (swing below $90^\circ$).`,
      credit: 'Benjamin Robins, 1742',
      deps: ['mech-2.6', 'mech-3.6'],
      refs: ['Taylor §3.1', 'Taylor §4.2'],
      tags: ['momentum', 'energy', 'collisions'],
      viz(v) {
        const u = v.slider('bullet speed $u$ (m/s)', 100, 500, 350, { step: 5 });
        const Mb = v.slider('block mass $M$ (kg)', 1, 5, 2, { step: 0.1 });
        const m = 0.01, L = 1.5, g = 9.81, TI = 0.6;
        const s = v.stage({ x: [-2.1, 2.1], y: [-1.8, 0.12], equal: true, height: 320, axes: false, weight: 1.35 });
        const b = v.stage({ x: [-0.55, 4], y: [0.05, 5000], ylog: true, height: 320, axes: 'box', weight: 0.85, title: 'energy (J, log scale)', xticks: [] });
        let sim = null, key = '', ph = null;
        const solve = () => {
          const M = Mb.value, V = m * u.value / (m + M), out = []; let y = [0, V / L];
          for (let i = 0; i <= 2600; i++) { out.push(y[0]); y = rk4step((t, z) => [z[1], -g / L * Math.sin(z[0])], 0, y, 0.002); }
          const h = V * V / (2 * g); return { M, V, h, th: Math.acos(clamp(1 - h / L, -1, 1)), out };
        };
        const block = (th, w, hh) => { const c = [L * Math.sin(th), -L * Math.cos(th)], ex = [Math.cos(th), Math.sin(th)], ey = [-Math.sin(th), Math.cos(th)]; return [[-w, -hh], [w, -hh], [w, hh], [-w, hh]].map(([a, bb]) => [c[0] + a * ex[0] + bb * ey[0], c[1] + a * ex[1] + bb * ey[1]]); };
        v.animate((t) => {
          const kk = `${u.value}|${Mb.value}`; if (kk !== key) { key = kk; sim = solve(); }
          const { M, V, h, th, out } = sim, w = 0.12 + 0.03 * Math.sqrt(M), hh = 0.1 + 0.02 * Math.sqrt(M);
          const theta = t < TI ? 0 : out[Math.min(out.length - 1, Math.round((t - TI) / 0.002))];
          ph = t < TI ? 'before' : 'after';
          s.hline(0, { color: 'muted', width: 3 });
          s.curve((a) => [L * Math.sin(a), -L * Math.cos(a)], -th, th, { color: 'green', dash: [4, 4], width: 1.2 });
          s.hline(-L + h, { color: 'green', dash: [2, 4], width: 1 });
          s.hline(-L, { color: 'faint', dash: [2, 4], width: 1 });
          { const xm = L * Math.sin(th) + 0.3; s.line(xm, -L, xm, -L + h, { color: 'green', width: 1.6 }); s.line(xm - 0.06, -L, xm + 0.06, -L, { color: 'green', width: 1.6 }); s.line(xm - 0.06, -L + h, xm + 0.06, -L + h, { color: 'green', width: 1.6 }); s.text('h', xm + 0.1, -L + h / 2, { color: 'green', size: 13, math: true, baseline: 'middle' }); }
          s.line(0, 0, L * Math.sin(theta), -L * Math.cos(theta), { color: 'ink', width: 1.5 });
          s.poly(block(theta, w, hh), { fill: 'orange', fillAlpha: 0.6, color: 'orange', width: 1.5 });
          if (t < TI) { const x = -2.05 + (2.05 - w) * t / TI; s.line(x - 0.12, -L, x, -L, { color: 'gold', width: 4 }); s.corner('slow motion: bullet in flight', 'tl'); }
          else { const c = [L * Math.sin(theta), -L * Math.cos(theta)]; s.dot(c[0] - 0.6 * w * Math.cos(theta), c[1] - 0.6 * w * Math.sin(theta), { color: 'gold', r: 3 }); s.corner(`swing: θ = ${v.fix(theta * 180 / Math.PI, 1)}°`, 'tl'); }
          s.dot(0, 0, { color: 'ink', r: 3 });
          // energy bars
          const K0 = 0.5 * m * u.value ** 2, K1 = 0.5 * (m + M) * V * V, P = (m + M) * g * h;
          [[K0, 'gold', 'bullet'], [K1, 'accent', 'after'], [P, 'green', 'top'], [K0 - K1, 'red', 'lost']].forEach(([val, col, lab], i) => {
            b.rect(0.15 + i, 0.05, 0.85 + i, val, { fill: col, fillAlpha: 0.7, color: col });
            b.text(lab, 0.5 + i, val, { color: col, size: 11, align: 'center', dy: -10 });
          });
        }, { period: 6 });
        v.legend([['gold', 'bullet: $\\tfrac12 mu^2$', { area: true }], ['accent', 'just after impact: $\\tfrac12(m+M)V^2$', { area: true }], ['green', 'at the top: $(m+M)gh$', { area: true }], ['red', 'lost in the impact', { area: true }]]);
        v.readout(() => {
          if (!sim) return '';
          const { M, V, h, th } = sim, uT = (m + M) / m * Math.sqrt(2 * g * h), uW = Math.sqrt(2 * (m + M) * g * h / m);
          return `$m = 10$ g · $V = \\dfrac{mu}{m+M} = ${v.fix(V, 3)}$ m/s · $h = V^2/2g = ${v.fix(h * 100, 2)}$ cm ($\\theta_{\\max} = ${v.fix(th * 180 / Math.PI, 1)}^\\circ$) · kinetic energy lost in the impact: $\\tfrac{M}{m+M} = ${v.fix(100 * M / (m + M), 2)}\\%$ · from $h$: momentum + energy give $u = ${v.fix(uT, 1)}$ m/s ✓, energy alone would give $${v.fix(uW, 1)}$ m/s ✗`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10', kind: 'Definition', name: 'Energy diagrams and turning points',
      statement: String.raw`For a particle moving on a line in a potential $U(x)$ with conserved energy $E = \tfrac12 m\dot x^2 + U(x)$, the **energy diagram** is the graph of $U$ with the horizontal line at height $E$. Since $\tfrac12 m\dot x^2 = E - U(x) \ge 0$, the motion is confined to the **allowed region** $\{x : U(x) \le E\}$, and the speed at $x$ is $\sqrt{2(E - U(x))/m}$ — the gap between the line and the curve. A **turning point** is a point where $U(x) = E$: there the velocity vanishes and (if $U'(x)\ne 0$) reverses. If the connected component of the allowed region containing the particle is bounded, $[x_1, x_2]$, the motion is a periodic oscillation between the turning points; if it is unbounded, the particle escapes to infinity.`,
      idea: String.raw`Everything follows from conservation of energy (3.6) in one dimension: $E - U(x)$ is the kinetic energy, which cannot be negative. At a turning point $\dot x = 0$ while $m\ddot x = -U'(x)$ points back into the allowed region, so the particle reverses. A bounded component traps the particle forever, bouncing between the walls; each pass takes the same time, so the motion is periodic (its period is computed in 3.11). The same picture in the phase plane is the level curve $\tfrac12 m\dot x^2 + U(x) = E$.`,
      caption: String.raw`Drag the gold handle: its height is the energy $E$, its position the starting point. The allowed region is shaded, the turning points are marked, and the ball moves in sync — fastest where the gap $E - U$ (green bar) is largest. Right: the same motion in the phase plane, on its level curve. Raise $E$ over a barrier and watch the region merge or open to infinity.`,
      deps: ['mech-3.6'],
      refs: ['Taylor §4.6', 'Arnold §4'],
      tags: ['energy', 'one-dimensional motion'],
      viz(v) {
        const POTS = {
          dbl: { label: 'double well', U: (x) => (x * x - 1) ** 2, dU: (x) => 4 * x * (x * x - 1), x: [-2, 2], y: [-0.5, 2.6], h: [-1, 0.8] },
          morse: { label: 'Morse (diatomic molecule)', U: (x) => (1 - Math.exp(-(x - 1.2))) ** 2, dU: (x) => { const e = Math.exp(-(x - 1.2)); return 2 * (1 - e) * e; }, x: [0.35, 6], y: [-0.3, 2.2], h: [0.8, 0.6] },
          cubic: { label: 'metastable well', U: (x) => x * x - x * x * x / 3, dU: (x) => 2 * x - x * x, x: [-1.6, 3.7], y: [-1.6, 2.4], h: [-0.3, 1.1] },
        };
        const which = v.select('potential', Object.entries(POTS).map(([value, p]) => ({ value, label: p.label })), 'dbl', { onChange: (k) => { const P = POTS[k]; hd.set(P.h[0], P.h[1]); } });
        const cur = () => POTS[which.value];
        const s = v.stage({ x: [-2, 2], y: [-0.5, 2.6], height: 320, axes: 'box', xlabel: 'x', weight: 1.2, title: 'energy diagram' });
        const ph = v.stage({ x: [-2, 2], y: [-2.5, 2.5], height: 320, axes: 'box', xlabel: 'x', weight: 1, title: 'phase plane $(x, \\dot x)$' });
        const hd = s.handle(-1, 0.8, { color: 'gold', label: 'E', labelPos: 'ne', constrain: (x, y) => { const P = cur(), xx = clamp(x, P.x[0] + 0.05, P.x[1] - 0.05); return [xx, clamp(Math.max(y, P.U(xx) + 1e-3), P.y[0], P.y[1] - 0.05)]; } });
        let st = null, key = '', simT = 0, first = true, R = null;
        v.animate((t) => {
          const P = cur(); if (hd.y < P.U(hd.x) + 1e-3) hd.y = P.U(hd.x) + 1e-3; const E = hd.y, x0 = hd.x;
          s.setView(P.x, P.y); const vm = Math.sqrt(2 * (P.y[1] - Math.min(...Array.from({ length: 50 }, (_, i) => P.U(P.x[0] + (P.x[1] - P.x[0]) * i / 49))))); ph.setView(P.x, [-vm, vm]);
          const kk = `${which.value}|${x0.toFixed(4)}|${E.toFixed(4)}`;
          if (kk !== key || t < simT - 1e-9) { key = kk; st = { x: x0, v: Math.sqrt(Math.max(0, 2 * (E - P.U(x0)))), out: false }; simT = first ? 0 : t; first = false; }
          const dt = 1 / 1000; let n = 0;
          while (simT < t && n++ < 6000 && !st.out) { const a0 = -P.dU(st.x); st.x += st.v * dt + 0.5 * a0 * dt * dt; const a1 = -P.dU(st.x); st.v += 0.5 * (a0 + a1) * dt; simT += dt; if (st.x < P.x[0] || st.x > P.x[1]) st.out = true; }
          const tp = turning(P.U, E, x0, P.x[0], P.x[1]);
          const lo = tp.a ?? P.x[0], hi = tp.b ?? P.x[1];
          s.vband(lo, hi, { color: 'green', alpha: 0.08 });
          s.between(() => E, P.U, lo, hi, { fill: 'green', fillAlpha: 0.14 });
          s.fn(P.U, { color: 'ink', width: 2.6 });
          s.hline(E, { color: 'gold', width: 1.6 });
          for (const [z, lab] of [[tp.a, 'x₁'], [tp.b, 'x₂']]) if (z != null) { s.vline(z, { color: 'red', dash: [4, 4], width: 1 }); s.dot(z, E, { color: 'red', r: 5, label: lab, labelPos: 'n' }); }
          const xb = clamp(st.x, P.x[0], P.x[1]), Ub = P.U(xb);
          s.line(xb, Ub, xb, E, { color: 'green', width: 4, alpha: 0.8 });
          s.dot(xb, Ub, { color: 'accent', r: 8 });
          // phase plane
          for (let k = 1; k <= 7; k++) { const e = P.y[0] + (P.y[1] - P.y[0]) * k / 8; for (const sg of [1, -1]) ph.fn((x) => { const d = e - P.U(x); return d >= 0 ? sg * Math.sqrt(2 * d) : NaN; }, { color: 'faint', width: 1, n: 400 }); }
          for (const sg of [1, -1]) ph.fn((x) => { const d = E - P.U(x); return x >= lo - 1e-9 && x <= hi + 1e-9 && d >= -1e-9 ? sg * Math.sqrt(2 * Math.max(0, d)) : NaN; }, { color: 'gold', width: 2.4, n: 600 });
          ph.hline(0, { color: 'muted', width: 1 });
          ph.dot(xb, st.v, { color: 'accent', r: 6 });
          R = { E, tp, x: st.x, v: st.v, T: 0.5 * st.v * st.v, U: Ub, out: st.out };
        }, { period: 30 });
        v.legend([['ink', 'potential $U(x)$'], ['gold', 'energy line $E$ / level curve'], ['green', 'allowed region, gap $E - U = T$', { area: true }], ['red', 'turning points', { dash: true }]]);
        v.readout(() => {
          if (!R) return '';
          const { E, tp } = R, f = (z) => (z == null ? '\\infty' : v.fix(z, 3));
          const reg = tp.a != null && tp.b != null ? `bounded: oscillation between $x_1 = ${f(tp.a)}$ and $x_2 = ${f(tp.b)}$` : `unbounded on the ${tp.a == null ? 'left' : 'right'}: allowed region $[${tp.a == null ? '-\\infty' : f(tp.a)}, ${tp.b == null ? '\\infty' : f(tp.b)}]$ — the particle escapes`;
          return `$E = ${v.fix(E, 3)}$ · ${reg} · now $T + U = ${v.fix(R.T, 4)} + ${v.fix(R.U, 4)} = ${v.fix(R.T + R.U, 5)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11', kind: 'Method', name: 'Motion by quadrature: the energy integral',
      statement: String.raw`For one-dimensional motion in a potential $U$ with energy $E$, separating variables in $\dot x = \pm\sqrt{2(E - U(x))/m}$ gives the motion implicitly by a single integral (a *quadrature*):
$$t - t_0 = \int_{x_0}^{x}\frac{d\xi}{\sqrt{2(E - U(\xi))/m}} .$$
For an oscillation between simple turning points $x_1 < x_2$ (where $U'(x_i)\neq 0$) the integrand has integrable inverse-square-root singularities at the ends, and the period is
$$T(E) = 2\int_{x_1}^{x_2}\frac{dx}{\sqrt{2(E - U(x))/m}} = \sqrt{2m}\int_{x_1}^{x_2}\frac{dx}{\sqrt{E - U(x)}} .$$
It depends on $E$ unless the potential is harmonic near enough; as $E$ approaches the energy of an unstable equilibrium, $T(E)\to\infty$.`,
      idea: String.raw`Energy conservation (3.10) gives the speed as a function of position, so $dt = dx/|\dot x|$; integrating is the change-of-variables formula (pma-6.19) applied to the inverse function $x \mapsto t$. Near a simple turning point $E - U(x) \approx |U'(x_i)|\,|x - x_i|$, so the integrand behaves like $|x - x_i|^{-1/2}$, which is integrable. Numerically the substitution $x = c + w\sin\varphi$ removes the singularity. The two passes $x_1\to x_2$ and back take equal times, giving the factor 2.`,
      caption: String.raw`Choose a potential and drag the energy slider. Left: $x(t)$ obtained purely by evaluating the quadrature integral (curve) against a direct simulation of $m\ddot x = -U'(x)$ (dots). Right: the period $T(E)$ by quadrature, with the current energy marked, against the small-oscillation value $2\pi/\omega_0$ and a closed form.`,
      deps: ['mech-3.10', 'pma-6.19'],
      refs: ['Arnold §4', 'Taylor §4.6'],
      tags: ['energy', 'quadrature', 'period'],
      viz(v) {
        const LEM = 1.3110287771461; // ∫₀¹ du/√(1−u⁴)
        const POTS = {
          harm: { label: 'harmonic', U: (x) => x * x / 2, dU: (x) => x, xmin: 0, E: [0.05, 2], w0: 1, exact: () => 2 * Math.PI, ex: '2\\pi' },
          pend: { label: 'pendulum', U: (x) => 1 - Math.cos(x), dU: (x) => Math.sin(x), xmin: 0, E: [0.05, 1.995], w0: 1, exact: (E) => 4 * ellipK(Math.sqrt(E / 2)), ex: '4K\\big(\\sqrt{E/2}\\big)' },
          quart: { label: 'quartic $x^4/4$', U: (x) => x ** 4 / 4, dU: (x) => x ** 3, xmin: 0, E: [0.05, 2], w0: 0, exact: (E) => 4 * LEM * Math.pow(4 * E, 0.25) / Math.sqrt(2 * E), ex: '4\\varpi_0\\,(4E)^{1/4}/\\sqrt{2E}' },
          morse: { label: 'Morse', U: (x) => (1 - Math.exp(-x)) ** 2, dU: (x) => { const e = Math.exp(-x); return 2 * (1 - e) * e; }, xmin: 0, E: [0.02, 0.97], w0: Math.SQRT2, exact: (E) => Math.PI * Math.SQRT2 / Math.sqrt(1 - E), ex: '\\sqrt2\\,\\pi/\\sqrt{1-E}' },
        };
        const which = v.select('potential', Object.entries(POTS).map(([value, p]) => ({ value, label: p.label })), 'pend');
        const Ef = v.slider('energy (fraction of range)', 0, 1, 0.75, { step: 0.005 });
        const s = v.stage({ x: [0, 20], y: [-3, 3], height: 300, axes: 'box', xlabel: 't', weight: 1.3, title: '$x(t)$: quadrature (curve) vs simulation (dots)' });
        const g = v.stage({ x: [0, 2], y: [0, 20], height: 300, axes: 'box', xlabel: 'E', weight: 1, title: 'period $T(E)$' });
        const tps = (P, E) => { const f = (z) => P.U(z) - E; let b = P.xmin + 0.01; while (f(b) < 0 && b < P.xmin + 60) b += 0.05; let a = P.xmin - 0.01; while (f(a) < 0 && a > P.xmin - 60) a -= 0.05; return [bisect(f, a, P.xmin), bisect(f, P.xmin, b)]; };
        /** t(φ) on a grid via x = c + w sin φ (midpoint rule, m = 1); returns {xs, ts, T}. */
        const quad = (P, E, n = 400) => {
          const [x1, x2] = tps(P, E), c = (x1 + x2) / 2, w = (x2 - x1) / 2, h = Math.PI / n, xs = [x1], ts = [0]; let t = 0;
          for (let i = 0; i < n; i++) { const ph = -Math.PI / 2 + (i + 0.5) * h, x = c + w * Math.sin(ph), d = E - P.U(x); t += (d > 0 ? w * Math.cos(ph) / Math.sqrt(2 * d) : 0) * h; xs.push(c + w * Math.sin(ph + h / 2)); ts.push(t); }
          return { xs, ts, T: 2 * t, x1, x2 };
        };
        const curveCache = {};
        const Tcurve = (k) => { if (curveCache[k]) return curveCache[k]; const P = POTS[k], pts = []; for (let i = 0; i <= 90; i++) { const E = P.E[0] + (P.E[1] - P.E[0]) * i / 90; pts.push([E, quad(P, E, 240).T]); } return (curveCache[k] = pts); };
        let R = null;
        v.render(() => {
          const P = POTS[which.value], E = P.E[0] + (P.E[1] - P.E[0]) * Ef.value, Q = quad(P, E);
          // simulation (velocity Verlet from the left turning point)
          const dt = Q.T / 4000, tEnd = Math.max(2.2 * Q.T, 8); let x = Q.x1, vv = 0, tt = 0, Tsim = NaN, lastV = 0, cross = 0; const dots = [];
          const every = Math.max(1, Math.round(Q.T / 24 / dt)); let k = 0;
          while (tt < tEnd) { const a0 = -P.dU(x); x += vv * dt + 0.5 * a0 * dt * dt; const a1 = -P.dU(x); vv += 0.5 * (a0 + a1) * dt; tt += dt; k++;
            if (k % every === 0) dots.push([tt, x]);
            if (lastV > 0 && vv <= 0) cross++; if (lastV < 0 && vv >= 0 && cross >= 1 && isNaN(Tsim)) Tsim = tt - dt * vv / (vv - lastV); lastV = vv; }
          const amp = Math.max(Math.abs(Q.x1), Math.abs(Q.x2)) * 1.25;
          s.setView([0, tEnd], [-amp, amp]); s.hline(0, { color: 'faint', width: 1 });
          s.hline(Q.x1, { color: 'red', dash: [4, 4], width: 1 }); s.hline(Q.x2, { color: 'red', dash: [4, 4], width: 1 });
          const pts = []; for (let rep = 0; rep * Q.T < tEnd; rep++) { const t0 = rep * Q.T; Q.ts.forEach((t, i) => pts.push([t0 + t, Q.xs[i]])); Q.ts.slice().reverse().forEach((t, i) => pts.push([t0 + Q.T - t, Q.xs[Q.xs.length - 1 - i]])); }
          s.path(pts.filter((p) => p[0] <= tEnd), { color: 'accent', width: 2.4 });
          s.dots(dots, { color: 'gold', r: 3 });
          s.vline(Q.T, { color: 'green', dash: [3, 3], width: 1 }); s.text('T', Q.T, -amp * 0.9, { color: 'green', size: 12, dx: 5 });
          // T(E)
          const C = Tcurve(which.value), Tmax = Math.min(40, Math.max(...C.map((p) => p[1]))) * 1.15, Tmin = Math.min(...C.map((p) => p[1]));
          g.setView([0, P.E[1] * 1.04], [Math.max(0, Tmin * 0.6 - 0.5), Tmax]);
          g.path(C, { color: 'accent', width: 2.4 });
          g.fn((e) => P.exact(e), { color: 'purple', dash: [6, 4], width: 1.4, domain: [P.E[0], P.E[1]] });
          if (P.w0) g.hline(2 * Math.PI / P.w0, { color: 'green', dash: [3, 4], width: 1.2 });
          g.dot(E, Q.T, { color: 'gold', r: 6 });
          R = { E, T: Q.T, Tsim, ex: P.exact(E), P };
        });
        v.legend([['accent', 'quadrature'], ['gold', 'direct simulation', { dot: true }], ['purple', 'closed form', { dash: true }], ['green', 'small oscillations $2\\pi/\\omega_0$', { dash: true }], ['red', 'turning points', { dash: true }]]);
        v.readout(() => R ? `$E = ${v.fix(R.E, 4)}$ · $T_{\\text{quadrature}} = ${v.fix(R.T, 5)}$ · $T_{\\text{simulation}} = ${v.fix(R.Tsim, 5)}$ · closed form $${R.P.ex} = ${v.fix(R.ex, 5)}$${R.P.w0 ? ` · small-oscillation $2\\pi/\\omega_0 = ${v.fix(2 * Math.PI / R.P.w0, 4)}$` : ' · no small-oscillation limit ($U\'\'(0) = 0$): $T\\to\\infty$ as $E\\to 0$'}` : '');
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12', kind: 'Definition', name: 'Equilibria and their stability',
      statement: String.raw`A point $x^*$ is an **equilibrium** of the motion $m\ddot x = -U'(x)$ if $U'(x^*) = 0$: a particle placed there at rest stays there. It is **(Lyapunov) stable** if every motion starting close enough to $x^*$ with small enough velocity stays close to $x^*$ for all time, and **unstable** otherwise. A strict local minimum of $U$ is stable; if $U''(x^*) > 0$, small oscillations have angular frequency $\omega = \sqrt{U''(x^*)/m}$. If $U''(x^*) < 0$ (a maximum) the equilibrium is unstable and small displacements grow like $e^{\lambda t}$, $\lambda = \sqrt{-U''(x^*)/m}$. If $U''(x^*) = 0$ the second derivative decides nothing: at a horizontal inflection point the particle creeps away on the downhill side.`,
      idea: String.raw`Equilibria are critical points of $U$ (pma-5.8 says interior extrema are among them). Near a strict minimum the energy line just above $U(x^*)$ cuts out a small bounded allowed region (3.10), so a slightly disturbed particle stays trapped: stability. Linearising, $m\ddot\delta = -U''(x^*)\,\delta$ is a harmonic oscillator when $U'' > 0$ and exponential growth when $U'' < 0$. When $U''(x^*) = 0$ the linearisation is $\ddot\delta = 0$ — no information — and the next term $-\tfrac12U'''(x^*)\delta^2$ pushes the particle off one way, slowly at first.`,
      caption: String.raw`Pick an equilibrium of the potential and nudge the ball by $\delta$. Right: the actual displacement $x(t) - x^*$ (gold) against the linearised prediction (dashed). At the minima it oscillates with $\omega = \sqrt{U''}$; at the maximum it runs away like $\cosh\lambda t$; at the shelf ($U'' = 0$) linear theory predicts nothing happens, yet the ball creeps off to the right.`,
      deps: ['mech-3.10', 'pma-5.8'],
      refs: ['Taylor §4.6', 'Arnold §4'],
      tags: ['stability', 'equilibrium', 'energy'],
      viz(v) {
        const roots = [-1.5, -0.4, 0.8, 0.8, 1.8]; let c = [1];
        for (const r of roots) { const n = new Array(c.length + 1).fill(0); c.forEach((a, i) => { n[i + 1] += a; n[i] -= r * a; }); c = n; }
        const dU = (x) => c.reduce((acc, a, i) => acc + a * x ** i, 0), U = (x) => c.reduce((acc, a, i) => acc + a * x ** (i + 1) / (i + 1), 0), d2U = (x) => c.reduce((acc, a, i) => acc + (i ? i * a * x ** (i - 1) : 0), 0);
        const EQ = { a: { x: -1.5, label: 'deep minimum' }, b: { x: -0.4, label: 'maximum' }, c: { x: 0.8, label: 'shelf ($U\'\' = 0$)' }, d: { x: 1.8, label: 'shallow minimum' } };
        const which = v.select('equilibrium', Object.entries(EQ).map(([value, e]) => ({ value, label: e.label })), 'b');
        const dS = v.slider('nudge $\\delta$', -0.25, 0.25, 0.06, { step: 0.005 });
        const s = v.stage({ x: [-1.95, 2.25], y: [-2, 2.4], height: 320, axes: 'box', xlabel: 'x', weight: 1.15, title: '$U(x)$ with its equilibria' });
        const g = v.stage({ x: [0, 8], y: [-1.2, 1.2], height: 320, axes: 'box', xlabel: 't', weight: 1, title: 'displacement $x(t) - x^*$' });
        const TEND = 8, dt = 1 / 800; let sim = null, key = '', cur = 0;
        const solve = () => { const xs = EQ[which.value].x; let x = xs + dS.value, vv = 0; const out = [x - xs]; for (let i = 0; i < TEND / dt; i++) { const a0 = -dU(x); x += vv * dt + 0.5 * a0 * dt * dt; const a1 = -dU(x); vv += 0.5 * (a0 + a1) * dt; out.push(x - xs); } return { xs, out, k: d2U(xs) }; };
        v.animate((t) => {
          const kk = `${which.value}|${dS.value}`; if (kk !== key) { key = kk; sim = solve(); }
          const i = Math.min(sim.out.length - 1, Math.floor(t / dt)); cur = i;
          s.fn(U, { color: 'ink', width: 2.6 });
          for (const [k, e] of Object.entries(EQ)) { const kk2 = d2U(e.x), col = Math.abs(kk2) < 1e-9 ? 'orange' : kk2 > 0 ? 'green' : 'red'; s.dot(e.x, U(e.x), { color: col, r: k === which.value ? 6 : 4, hollow: k !== which.value }); }
          const xb = sim.xs + sim.out[i];
          s.vline(sim.xs, { color: 'faint', dash: [3, 3], width: 1 });
          if (xb > -1.95 && xb < 2.25) s.dot(xb, U(xb), { color: 'gold', r: 8 });
          // displacement vs prediction
          const d0 = dS.value, k = sim.k, w = Math.sqrt(Math.abs(k));
          const pred = (tt) => (Math.abs(k) < 1e-9 ? d0 : k > 0 ? d0 * Math.cos(w * tt) : d0 * Math.cosh(w * tt));
          g.hline(0, { color: 'faint', width: 1 });
          g.fn(pred, { color: Math.abs(k) < 1e-9 ? 'orange' : k > 0 ? 'green' : 'red', dash: [6, 4], width: 1.6, n: 600 });
          g.path(sim.out.filter((_, j) => j % 4 === 0).map((z, j) => [j * 4 * dt, z]), { color: 'gold', width: 1, alpha: 0.35 });
          g.path(sim.out.slice(0, i + 1).filter((_, j) => j % 4 === 0).map((z, j) => [j * 4 * dt, z]), { color: 'gold', width: 2.6 });
          g.dot(i * dt, sim.out[i], { color: 'gold', r: 4 });
        }, { period: TEND });
        v.legend([['green', 'stable ($U\'\' > 0$)', { dot: true }], ['red', 'unstable ($U\'\' < 0$)', { dot: true }], ['orange', 'degenerate ($U\'\' = 0$)', { dot: true }], ['gold', 'actual motion'], ['muted', 'linearised prediction', { dash: true }]]);
        v.readout(() => {
          if (!sim) return '';
          const k = sim.k, d = sim.out[cur];
          const kind = Math.abs(k) < 1e-9 ? `$U''(x^*) = 0$: the linearisation $\\ddot\\delta = 0$ predicts the ball stays put, but $U'(x) = -2.76\\,(x - x^*)^2 + \\dots \\le 0$ on both sides, so it creeps off to the right`
            : k > 0 ? `$U''(x^*) = ${v.fix(k, 3)} > 0$: stable, $\\omega = \\sqrt{U''} = ${v.fix(Math.sqrt(k), 3)}$, period $${v.fix(2 * Math.PI / Math.sqrt(k), 3)}$`
            : `$U''(x^*) = ${v.fix(k, 3)} < 0$: unstable, growth rate $\\lambda = \\sqrt{-U''} = ${v.fix(Math.sqrt(-k), 3)}$`;
          return `$x^* = ${v.fix(sim.xs, 2)}$ · ${kind} · now $x - x^* = ${v.fix(d, 4)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13', kind: 'Phenomenon', name: 'Escape velocity',
      statement: String.raw`A projectile launched from the surface of a spherical, airless planet of mass $M$ and radius $R$ escapes to infinity (never falls back) if and only if its total energy is non-negative,
$$\tfrac12 v_0^2 - \frac{GM}{R} \ge 0 \iff v_0 \ge v_{\text{esc}} = \sqrt{\frac{2GM}{R}},$$
independently of its mass and (as long as it clears the planet) of the launch direction. Launched radially with $v_0 < v_{\text{esc}}$, it rises to the turning point $r_{\max} = \dfrac{R}{1 - v_0^2/v_{\text{esc}}^2}$ and falls back; with $v_0 > v_{\text{esc}}$ it recedes with speed tending to $\sqrt{v_0^2 - v_{\text{esc}}^2}$. For the Earth $v_{\text{esc}} \approx 11.2$ km/s.`,
      idea: String.raw`Gravity is conservative with $U = -GMm/r$ (mech-1.17; 3.3), so $E = \tfrac12 mv^2 - GMm/r$ is constant (3.6). Since $U\to 0$ as $r\to\infty$ and $T\ge0$, a particle can reach arbitrarily large $r$ only if $E \ge 0$; if $E<0$ the energy diagram has a turning point where $-GMm/r = E$ (3.10). Conversely if $E \ge 0$ the speed never vanishes, so a radially launched particle keeps moving outward forever.`,
      caption: String.raw`Set the launch speed as a fraction of $v_{\text{esc}}$ (units $GM = R = 1$). The probe (top) and the energy diagram (bottom) share the same $r$-axis: the gold line is $E$, the gap down to $U = -GM/r$ is the kinetic energy, and the red turning point appears exactly when $E < 0$. Pick a body to see the speeds in km/s.`,
      scope: String.raw`Ignores air drag, the planet’s rotation and other bodies (the Sun’s gravity raises the speed needed to leave the solar system).`,
      deps: ['mech-3.6', 'mech-1.17'],
      refs: ['Taylor §4.8'],
      tags: ['gravity', 'energy'],
      viz(v) {
        const vf = v.slider('launch speed $v_0/v_{\\text{esc}}$', 0.5, 1.3, 0.92, { step: 0.005 });
        const C = v.M.CONST, BODIES = { moon: { label: 'Moon', M: 7.342e22, R: 1.7374e6 }, earth: { label: 'Earth', M: C.Mearth, R: C.Rearth }, jup: { label: 'Jupiter', M: 1.898e27, R: 6.9911e7 } };
        const body = v.select('body', Object.entries(BODIES).map(([value, b]) => ({ value, label: b.label })), 'earth');
        const XR = [0, 13];
        const sc = v.stage({ x: XR, y: [-1.3, 1.3], equal: false, height: 120, axes: false, full: true });
        const s = v.stage({ x: XR, y: [-1.15, 0.45], height: 260, axes: 'box', xlabel: 'r', full: true, title: 'energy diagram (per unit mass): $U(r) = -1/r$' });
        let st = null, key = '', simT = 0, first = true, R = null;
        const f = (t, z) => [z[1], -1 / (z[0] * z[0])];
        v.animate((t) => {
          const v0 = vf.value * Math.SQRT2, E = 0.5 * v0 * v0 - 1, rmax = E < 0 ? -1 / E : Infinity;
          const kk = vf.value + ''; const tau = 8 * t;
          if (kk !== key || tau < simT - 1e-9) { key = kk; st = [1, v0]; simT = first ? 0 : tau; first = false; }
          let n = 0; while (simT < tau && n++ < 20000) { const h = Math.min(0.01, 0.004 * st[0]); st = rk4step(f, 0, st, h); simT += h; if (st[0] <= 1) { st = [1, 0]; break; } }
          const r = st[0];
          // scene
          sc.circle(0, 0, 1, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.5 });
          sc.text('planet', 0.45, 0, { color: 'accent', size: 11, align: 'center' });
          if (isFinite(rmax) && rmax < XR[1]) { sc.vline(rmax, { color: 'red', dash: [4, 4], width: 1.2 }); }
          if (r < XR[1]) { sc.dot(r, 0, { color: 'gold', r: 6 }); vec(sc, r, 0, st[1], 0, 1.2, { color: 'ink', width: 1.6 }); }
          else sc.corner('escaped →', 'tr', { color: 'green' });
          // energy diagram
          s.vband(0, 1, { color: 'accent', alpha: 0.1 });
          s.hline(0, { color: 'muted', width: 1 });
          s.fn((x) => -1 / x, { color: 'ink', width: 2.4, domain: [1, XR[1]] });
          const hi = isFinite(rmax) ? Math.min(rmax, XR[1]) : XR[1];
          s.between(() => E, (x) => -1 / x, 1, hi, { fill: 'green', fillAlpha: 0.14 });
          s.line(1, E, XR[1], E, { color: 'gold', width: 2 });
          if (isFinite(rmax) && rmax < XR[1]) s.dot(rmax, E, { color: 'red', r: 5, label: 'turning point', labelPos: 'n' });
          if (r < XR[1]) { s.line(r, -1 / r, r, E, { color: 'green', width: 4, alpha: 0.8 }); s.dot(r, -1 / r, { color: 'gold', r: 6 }); }
          s.text(E >= 0 ? 'E ≥ 0: unbound' : 'E < 0: bound', XR[1] - 0.2, E, { color: 'gold', size: 12, align: 'right', dy: -10 });
          R = { E, rmax, r, v: st[1], v0 };
        }, { period: 14 });
        v.legend([['ink', 'potential energy $U(r) = -GM/r$'], ['gold', 'total energy $E$'], ['green', 'kinetic energy $E - U$', { area: true }], ['red', 'turning point $r_{\\max}$', { dash: true }]]);
        v.readout(() => {
          if (!R) return '';
          const B = BODIES[body.value], ve = Math.sqrt(2 * C.G * B.M / B.R) / 1000;
          return `$E = \\tfrac12 v_0^2 - 1 = ${v.fix(R.E, 4)}$ · ${R.E < 0 ? `bound: $r_{\\max} = 1/|E| = ${v.fix(R.rmax, 3)}\\,R$` : `escapes with $v_\\infty = \\sqrt{2E} = ${v.fix(Math.sqrt(2 * R.E), 3)}$`} · now $r = ${v.fix(R.r, 3)}$, $\\tfrac12\\dot r^2 - 1/r = ${v.fix(0.5 * R.v * R.v - 1 / R.r, 5)}$ · ${B.label}: $v_{\\text{esc}} = \\sqrt{2GM/R} = ${v.fix(ve, 2)}$ km/s, launch $${v.fix(ve * vf.value, 2)}$ km/s`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14', kind: 'Proposition', name: 'Loop-the-loop: the 5R/2 condition',
      statement: String.raw`A small block slides without friction down a ramp from rest at height $h$ and enters a vertical circular loop of radius $R$ at its lowest point. At angle $\theta$ from the bottom of the loop its speed satisfies $v^2 = 2g\big(h - R(1-\cos\theta)\big)$ and the normal force is
$$\frac{N}{m} = \frac{v^2}{R} + g\cos\theta = g\Big(\frac{2h}{R} - 2 + 3\cos\theta\Big).$$
The block stays on the track all the way round if and only if $N \ge 0$ at the top, i.e. $h \ge \tfrac52 R$. For $R < h < \tfrac52R$ it leaves the track where $\cos\theta = -\tfrac{2(h-R)}{3R}$ and falls inside the loop as a projectile; for $h \le R$ it never passes the quarter point and slides back.`,
      idea: String.raw`Energy conservation (3.6) gives $v^2$ at height $R(1-\cos\theta)$, since the normal force does no work. The radial component of Newton’s second law for circular motion (mech-1.3) reads $N - mg\cos(\pi - \theta) = mv^2/R$, giving $N$. The track can only push (mech-1.14), so the block stays on while $N\ge0$; $N$ is smallest at the top, where it equals $mg(2h/R - 5)$.`,
      caption: String.raw`Drag the release height. The block runs down the ramp and around the loop; the lower panel plots the normal force $N/mg$ around the loop for this $h$, with the block’s current angle. Below $h = 2.5R$ the curve dips below zero before the top: the block leaves the track there and falls inside the loop.`,
      deps: ['mech-3.6', 'mech-1.3', 'mech-1.14'],
      refs: ['Taylor §4.7'],
      tags: ['energy', 'circular motion', 'constraint forces'],
      viz(v) {
        const hS = v.slider('release height $h/R$', 0.8, 3.5, 2.25, { step: 0.01 });
        const gr = 1, RR = 1, XA = -4.5;
        const s = v.stage({ x: [-4.8, 3.2], y: [-0.3, 3.7], equal: true, height: 320, axes: false, weight: 1.4 });
        const g = v.stage({ x: [0, 2 * Math.PI], y: [-2, 6], height: 320, axes: 'box', xlabel: 'θ', weight: 1, title: 'normal force $N/mg$ around the loop', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π (top)'], [3 * Math.PI / 2, '3π/2'], [2 * Math.PI, '2π']] });
        const ramp = (x, h) => { const u = x / XA; return [h * u * u, 2 * h * u / XA, 2 * h / (XA * XA)]; }; // y, y', y''
        let st = null, key = '', simT = 0, first = true, trail = [], R = null;
        const reset = (h) => { st = { ph: 'ramp', x: XA + 1e-6, xd: 0, th: 0, w: 0, p: null, vv: null }; trail = []; };
        v.animate((t) => {
          const h = hS.value * RR, kk = h + '', tau = 1.6 * t;
          if (kk !== key || tau < simT - 1e-9) { key = kk; reset(h); simT = first ? 0 : tau; first = false; }
          const dt = 1 / 1000; let n = 0;
          while (simT < tau && n++ < 8000) {
            simT += dt;
            if (st.ph === 'ramp') {
              const f = (tt, z) => { const [, d, dd] = ramp(z[0], h); return [z[1], -(gr * d + d * dd * z[1] * z[1]) / (1 + d * d)]; };
              const z = rk4step(f, 0, [st.x, st.xd], dt); st.x = z[0]; st.xd = z[1];
              if (st.x >= 0) { st.ph = 'loop'; st.th = st.x / RR; st.w = st.xd / RR; }
              if (st.x < XA) { st.x = XA; st.xd = Math.abs(st.xd); }
            } else if (st.ph === 'loop') {
              const z = rk4step((tt, q) => [q[1], -gr / RR * Math.sin(q[0])], 0, [st.th, st.w], dt); st.th = z[0]; st.w = z[1];
              const N = RR * st.w * st.w + gr * Math.cos(st.th);
              if (st.th < 0) { st.ph = 'ramp'; st.x = st.th * RR; st.xd = st.w * RR; }
              else if (st.th >= 2 * Math.PI) { st.ph = 'exit'; st.x = (st.th - 2 * Math.PI) * RR; st.xd = st.w * RR; }
              else if (N < 0) { st.ph = 'fly'; st.p = [RR * Math.sin(st.th), RR * (1 - Math.cos(st.th))]; st.vv = [RR * st.w * Math.cos(st.th), RR * st.w * Math.sin(st.th)]; st.thOff = st.th; }
            } else if (st.ph === 'exit') { st.x += st.xd * dt; if (st.x > 3) st.x = 3; }
            else if (st.ph === 'fly') {
              st.vv[1] -= gr * dt; st.p = [st.p[0] + st.vv[0] * dt, st.p[1] + st.vv[1] * dt];
              if (Math.hypot(st.p[0], st.p[1] - RR) >= RR * 1.0005 || st.p[1] <= 0) st.ph = 'crash';
            }
            if (n % 20 === 0 && (st.ph === 'fly')) trail.push(st.p.slice());
          }
          // track
          s.fn((x) => ramp(x, h)[0], { color: 'ink', width: 3, domain: [XA, 0] });
          s.circle(0, RR, RR, { color: 'ink', width: 3 });
          s.line(0, 0, 3.2, 0, { color: 'ink', width: 3 });
          s.hline(2.5 * RR, { color: 'green', dash: [5, 4], width: 1.2 }); s.text('h = 5R/2', -4.7, 2.5 * RR, { color: 'green', size: 11, dy: -9 });
          s.dot(XA, h, { color: 'muted', r: 3 }); s.line(XA - 0.15, h, XA + 0.35, h, { color: 'muted', width: 1 });
          let pos, N = null;
          if (st.ph === 'ramp') pos = [st.x, ramp(st.x, h)[0]];
          else if (st.ph === 'loop') { pos = [RR * Math.sin(st.th), RR * (1 - Math.cos(st.th))]; N = RR * st.w * st.w + gr * Math.cos(st.th); }
          else if (st.ph === 'exit') pos = [st.x, 0];
          else pos = st.p;
          if (trail.length) s.path(trail, { color: 'red', dash: [3, 3], width: 1.5 });
          s.dot(pos[0], pos[1], { color: st.ph === 'fly' || st.ph === 'crash' ? 'red' : 'gold', r: 7 });
          if (N != null) { const nx = -Math.sin(st.th), ny = Math.cos(st.th); vec(s, pos[0], pos[1], nx, ny, 0.25 * Math.max(0, N), { color: 'purple', width: 2.2 }); }
          if (st.ph === 'crash') s.corner('fell off the track', 'tr', { color: 'red' });
          // N(θ)
          const Nf = (th) => 2 * h / RR - 2 + 3 * Math.cos(th);
          const vmax = (th) => 2 * (h - RR * (1 - Math.cos(th))) >= 0;
          g.hline(0, { color: 'muted', width: 1 }); g.vline(Math.PI, { color: 'faint', dash: [3, 3], width: 1 });
          g.fn((th) => (vmax(th) && Nf(th) >= 0 ? Nf(th) : NaN), { color: 'purple', width: 2.4, n: 400 });
          g.fn((th) => (vmax(th) && Nf(th) < 0 ? Nf(th) : NaN), { color: 'red', width: 2.4, dash: [5, 4], n: 400 });
          const thOff = h > RR && h < 2.5 * RR ? Math.acos(-2 * (h - RR) / (3 * RR)) : null;
          if (thOff) { g.dot(thOff, 0, { color: 'red', r: 5 }); g.dot(2 * Math.PI - thOff, 0, { color: 'red', r: 3, hollow: true }); }
          if (st.ph === 'loop') g.dot(st.th, Nf(st.th), { color: 'gold', r: 6 });
          R = { h, Ntop: Nf(Math.PI), thOff, ph: st.ph };
        }, { period: 12 });
        v.legend([['ink', 'track'], ['purple', 'normal force (track pushes)'], ['red', '$N<0$ required: the track cannot pull', { dash: true }], ['green', 'critical height $5R/2$', { dash: true }]]);
        v.readout(() => {
          if (!R) return '';
          const tail = R.h >= 2.5 * RR ? 'stays on the track all the way round' : R.h > RR ? `leaves the track at $\\theta = ${v.fix(R.thOff * 180 / Math.PI, 1)}^\\circ$ where $\\cos\\theta = -\\tfrac{2(h-R)}{3R}$` : 'never passes $\\theta = 90^\\circ$: slides back and forth';
          return `$h/R = ${v.fix(R.h / RR, 2)}$ · at the top $N/mg = 2h/R - 5 = ${v.fix(R.Ntop, 3)}$ · ${tail}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15', kind: 'Theorem', name: 'Energy of a system of interacting particles',
      statement: String.raw`Let $N$ particles interact through central pair forces derived from pair potentials, $\mathbf F_{ij} = -\nabla_{\mathbf r_i}U_{ij}(|\mathbf r_i - \mathbf r_j|)$ (force on $i$ due to $j$), and move in an external conservative field with potentials $U_i^{\text{ext}}(\mathbf r_i)$. Then the total energy
$$E = \sum_i \tfrac12 m_i|\mathbf v_i|^2 + \sum_{i<j} U_{ij}(|\mathbf r_i - \mathbf r_j|) + \sum_i U_i^{\text{ext}}(\mathbf r_i)$$
is conserved: each pair contributes **one** potential term, not two. Individual kinetic energies and individual pair energies change, but the total does not.`,
      idea: String.raw`Differentiate $E$ along the motion. $\tfrac{d}{dt}U_{ij} = \nabla_iU_{ij}\cdot\mathbf v_i + \nabla_jU_{ij}\cdot\mathbf v_j = -\mathbf F_{ij}\cdot\mathbf v_i - \mathbf F_{ji}\cdot\mathbf v_j$, using $\nabla_j U_{ij} = -\nabla_i U_{ij}$ — this is where Newton’s third law (mech-1.7) in its strong form enters. The kinetic terms give $\sum_i \mathbf F_i\cdot\mathbf v_i$ (3.2), with $\mathbf F_i$ the sum of all forces on $i$, and the two contributions cancel exactly, as do the external ones (3.3).`,
      caption: String.raw`Three particles: springs join 1–2 and 2–3, a Morse bond (repulsive core, attractive well) joins 1–3. Drag the hollow handles to set the starting positions. Right: the three kinetic energies trade back and forth with the pair energies, while the total stays flat. Break the third law and the total drifts.`,
      deps: ['mech-3.3', 'mech-1.7', 'mech-3.2'],
      refs: ['Taylor §4.9', 'Taylor §4.10'],
      tags: ['energy', 'many-body', 'conservation'],
      viz(v) {
        const brk = v.toggle('break the third law (particle 2 feels only half of bond 1–2)', false);
        const ms = [1, 1.5, 0.8], cols = ['accent', 'orange', 'purple'];
        const s = v.stage({ x: [-3, 3], y: [-2.1, 2.1], equal: true, height: 330, axes: false, weight: 1.1 });
        const g = v.stage({ x: [0, 20], y: [0, 4], height: 330, axes: 'box', xlabel: 't', weight: 1.2, title: 'energies' });
        const H = [[-1.2, -0.6], [1.1, -0.5], [0.0, 1.1]].map((p, i) => s.handle(p[0], p[1], { color: cols[i], r: 7, label: `${i + 1}`, labelPos: 'ne' }));
        const PAIRS = [
          { i: 0, j: 1, U: (r) => 1.5 * (r - 1.5) ** 2, dU: (r) => 3 * (r - 1.5), kind: 'spring' },
          { i: 1, j: 2, U: (r) => 1.0 * (r - 1.4) ** 2, dU: (r) => 2 * (r - 1.4), kind: 'spring' },
          { i: 0, j: 2, U: (r) => { const e = Math.exp(-1.8 * (r - 1.3)); return 1.2 * (1 - e) ** 2 - 1.2; }, dU: (r) => { const e = Math.exp(-1.8 * (r - 1.3)); return 2 * 1.2 * 1.8 * (1 - e) * e; }, kind: 'morse' },
        ];
        let st = null, key = '', simT = 0, first = true, hist = [];
        const forces = (P) => { const F = [[0, 0], [0, 0], [0, 0]]; for (const q of PAIRS) { const dx = P[q.i][0] - P[q.j][0], dy = P[q.i][1] - P[q.j][1], r = Math.hypot(dx, dy), f = -q.dU(r) / r; F[q.i][0] += f * dx; F[q.i][1] += f * dy; const sj = brk.value && q.i === 0 && q.j === 1 ? 0.5 : 1; F[q.j][0] -= sj * f * dx; F[q.j][1] -= sj * f * dy; } return F; };
        const energies = (P, V) => { const T = V.map((u, i) => 0.5 * ms[i] * (u[0] ** 2 + u[1] ** 2)), Up = PAIRS.map((q) => q.U(Math.hypot(P[q.i][0] - P[q.j][0], P[q.i][1] - P[q.j][1]))); return { T, Up, E: T[0] + T[1] + T[2] + Up[0] + Up[1] + Up[2] }; };
        v.animate((t) => {
          const kk = H.map((h) => `${h.x.toFixed(3)},${h.y.toFixed(3)}`).join(';') + brk.value;
          if (kk !== key || t < simT - 1e-9) {
            key = kk; const V = [[0.5, 0.9], [-0.3, -0.4], [0, 0]]; V[2] = [-(ms[0] * V[0][0] + ms[1] * V[1][0]) / ms[2], -(ms[0] * V[0][1] + ms[1] * V[1][1]) / ms[2]];
            st = { P: H.map((h) => [h.x, h.y]), V, F: null }; st.F = forces(st.P); simT = first ? 0 : t; first = false; hist = []; st.t0 = simT; st.E0 = energies(st.P, st.V).E;
          }
          const dt = 0.002; let n = 0;
          while (simT < t && n++ < 6000) {
            const { P, V, F } = st;
            for (let i = 0; i < 3; i++) { V[i][0] += 0.5 * dt * F[i][0] / ms[i]; V[i][1] += 0.5 * dt * F[i][1] / ms[i]; P[i][0] += dt * V[i][0]; P[i][1] += dt * V[i][1]; }
            st.F = forces(P); for (let i = 0; i < 3; i++) { V[i][0] += 0.5 * dt * st.F[i][0] / ms[i]; V[i][1] += 0.5 * dt * st.F[i][1] / ms[i]; }
            simT += dt; if (Math.round((simT - st.t0) / dt) % 10 === 0) { const e = energies(P, V); hist.push([simT - st.t0, e]); }
          }
          const { P } = st;
          for (const q of PAIRS) { if (q.kind === 'spring') spring(s, P[q.i], P[q.j], { color: 'muted' }); else s.line(P[q.i][0], P[q.i][1], P[q.j][0], P[q.j][1], { color: 'teal', dash: [2, 4], width: 2 }); }
          P.forEach((p, i) => s.dot(p[0], p[1], { color: cols[i], r: 7 + 4 * Math.cbrt(ms[i]) }));
          // energies
          const tnow = simT - st.t0, t0 = Math.max(0, tnow - 20);
          const all = hist.flatMap(([, e]) => [...e.T, e.E, e.Up[0] + e.Up[1] + e.Up[2]]), lo = Math.min(0, ...all), hi = Math.max(0.5, ...all);
          g.setView([t0, t0 + 20], [lo - 0.08 * (hi - lo), hi + 0.12 * (hi - lo)]);
          g.hline(0, { color: 'faint', width: 1 });
          for (let i = 0; i < 3; i++) g.path(hist.map(([tt, e]) => [tt, e.T[i]]), { color: cols[i], width: 1.4, alpha: 0.85 });
          g.path(hist.map(([tt, e]) => [tt, e.Up[0] + e.Up[1] + e.Up[2]]), { color: 'teal', width: 1.6, dash: [5, 3] });
          g.path(hist.map(([tt, e]) => [tt, e.E]), { color: 'ink', width: 3 });
        }, { period: 40 });
        v.legend([['accent', '$T_1$'], ['orange', '$T_2$'], ['purple', '$T_3$'], ['teal', 'pair energies $U_{12} + U_{23} + U_{13}$', { dash: true }], ['ink', 'total $E$']]);
        v.readout(() => {
          if (!st) return '';
          const e = energies(st.P, st.V), px = st.V.reduce((a, u, i) => a + ms[i] * u[0], 0), py = st.V.reduce((a, u, i) => a + ms[i] * u[1], 0);
          return `$T_1 + T_2 + T_3 = ${v.fix(e.T[0] + e.T[1] + e.T[2], 4)}$ · $U_{12} + U_{23} + U_{13} = ${v.fix(e.Up[0] + e.Up[1] + e.Up[2], 4)}$ · $E = ${v.fix(e.E, 5)}$ (start $${v.fix(st.E0, 5)}$, drift $${v.sci(Math.abs(e.E - st.E0) + 1e-16, 1)}$) · total momentum $(${v.fix(px, 4)}, ${v.fix(py, 4)})$${brk.value ? ' — **third law broken: neither is conserved**' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16', kind: 'Method', name: 'Mechanical similarity',
      statement: String.raw`If the potential energy is homogeneous of degree $k$ in the coordinates, $U(\lambda\mathbf r) = \lambda^kU(\mathbf r)$, then the equations of motion are invariant under the rescaling
$$\mathbf r \mapsto \lambda\mathbf r, \qquad t\mapsto \lambda^{1-k/2}\,t :$$
if $\mathbf r(t)$ is a motion, so is $\lambda\,\mathbf r(\lambda^{k/2-1}t)$. Hence geometrically similar orbits have times (periods) in the ratio $T'/T = (L'/L)^{1-k/2}$, velocities in the ratio $(L'/L)^{k/2}$ and energies in the ratio $(L'/L)^{k}$. For $k=2$ (harmonic) the period does not depend on the amplitude; for $k=-1$ (Newtonian gravity) $T^2\propto L^3$ — Kepler’s third law; for a uniform field ($k = 1$) the fall time scales as $\sqrt{L}$.`,
      idea: String.raw`Under $\mathbf r\to\lambda\mathbf r$, $t\to\tau t$ the acceleration scales by $\lambda/\tau^2$ while the force $-\nabla U$ scales by $\lambda^{k-1}$; Newton’s law is preserved iff $\lambda/\tau^2 = \lambda^{k-1}$, i.e. $\tau = \lambda^{1-k/2}$. No equation is solved: this uses only the form of the energy (3.11 shows periods are integrals of $1/\sqrt{E-U}$, which scale the same way). The rescaled initial condition simply generates the rescaled motion, by uniqueness of solutions.`,
      caption: String.raw`Choose the exponent $k$ of a central force $F = -r^{k-1}$ (potential $r^k/k$) and the scale $\lambda$. Orbit 2 (orange) is launched from $\lambda$ times as far with $\lambda^{k/2}$ times the speed; shrunk by $1/\lambda$ (dashed) it lies exactly on orbit 1, and the two bodies, run with their own clocks, stay on a common ray. Right: measured period ratios on log–log axes, with slope $1 - k/2$.`,
      deps: ['mech-3.11'],
      refs: ['Arnold §11'],
      tags: ['scaling', 'orbits', 'Kepler'],
      viz(v) {
        const kS = v.select('exponent $k$', [{ value: '4', label: '$k = 4$' }, { value: '2', label: '$k = 2$ (spring)' }, { value: '1', label: '$k = 1$' }, { value: '-1', label: '$k = -1$ (Kepler)' }], '-1');
        const lam = v.slider('scale $\\lambda$', 0.4, 2.2, 1.8, { step: 0.01 });
        const v0S = v.slider('launch speed / circular speed', 0.4, 0.9, 0.7, { step: 0.01 });
        const s = v.stage({ x: [-2.5, 2.5], y: [-2.3, 2.3], equal: true, height: 340, axes: false, weight: 1.25 });
        const g = v.stage({ x: [0.35, 3], y: [0.15, 8], xlog: true, ylog: true, height: 340, axes: 'box', xlabel: 'λ', weight: 1, title: 'period ratio $T(\\lambda)/T(1)$' });
        /** RK4 orbit from (L, 0) with speed (0, w): positions over two radial periods and the radial period. */
        const orbit = (k, L, w) => {
          const f = (t, z) => { const r = Math.hypot(z[0], z[1]), a = -Math.pow(r, k - 2); return [z[2], z[3], a * z[0], a * z[1]]; };
          let z = [L, 0, 0, w], t = 0, last = 0, crossings = []; const pts = [[L, 0]], ts = [0], dt = 0.002;
          for (let i = 0; i < 60000 && crossings.length < 4; i++) {
            z = rk4step(f, t, z, dt); t += dt; const vr = z[0] * z[2] + z[1] * z[3];
            if (i > 2 && Math.sign(vr) !== Math.sign(last) && last !== 0) crossings.push(t - dt * vr / (vr - last));
            last = vr; if (i % 4 === 0) { pts.push([z[0], z[1]]); ts.push(t); }
          }
          return { pts, ts, T: crossings[1], T2: crossings[3] };
        };
        const cache = {};
        const ladder = (k, w) => { const key = `${k}|${w}`; if (cache[key]) return cache[key]; const T1 = orbit(k, 1, w).T; return (cache[key] = [0.5, 0.7, 1.4, 2, 2.8].map((L) => [L, orbit(k, L, w * Math.pow(L, k / 2)).T / T1])); };
        let O = null, okey = '', R = null;
        v.animate((t) => {
          const k = +kS.value, L = lam.value, w = v0S.value, kk = `${k}|${L}|${w}`;
          if (kk !== okey) { okey = kk; O = { a: orbit(k, 1, w), b: orbit(k, L, w * Math.pow(L, k / 2)) }; }
          const { a, b } = O, view = Math.max(1.2, L) * 1.15; s.setView([-view, view], [-view, view]);
          const end = (o) => { const n = o.ts.findIndex((x) => x > o.T2); return n < 0 ? o.pts : o.pts.slice(0, n + 1); };
          const pa = end(a), pb = end(b);
          s.dot(0, 0, { color: 'ink', r: 4 });
          s.path(pa, { color: 'accent', width: 2.4 });
          s.path(pb, { color: 'orange', width: 2.4 });
          s.path(pb.map((p) => [p[0] / L, p[1] / L]), { color: 'orange', width: 1.4, dash: [5, 4] });
          // synchronized bodies: fraction u of two radial periods, each with its own clock
          const u = (t % 8) / 8, at = (o, tt) => { const i = Math.min(o.ts.length - 1, Math.max(0, o.ts.findIndex((x) => x >= tt))); return o.pts[i]; };
          const qa = at(a, u * a.T2), qb = at(b, u * b.T2), far = Math.hypot(...qb) > Math.hypot(...qa) ? qb : qa;
          s.line(0, 0, far[0] * 1.08, far[1] * 1.08, { color: 'faint', width: 1 });
          s.dot(qa[0], qa[1], { color: 'accent', r: 6 }); s.dot(qb[0], qb[1], { color: 'orange', r: 6 });
          // ladder
          const lad = ladder(k, w), ex = 1 - k / 2;
          g.fn((x) => Math.pow(x, ex), { color: 'green', width: 1.6, dash: [6, 4] });
          g.dots([[1, 1], ...lad], { color: 'ink', r: 4 });
          g.dot(L, b.T / a.T, { color: 'orange', r: 6 });
          R = { k, L, ratio: b.T / a.T, pred: Math.pow(L, ex), ex, Ta: a.T, Tb: b.T };
        }, { period: 8 });
        v.legend([['accent', 'orbit 1 from $r = 1$'], ['orange', 'orbit 2 from $r = \\lambda$'], ['orange', 'orbit 2 shrunk by $1/\\lambda$', { dash: true }], ['green', 'slope $1 - k/2$', { dash: true }], ['ink', 'measured ratios', { dot: true }]]);
        v.readout(() => R ? `radial periods $T_1 = ${v.fix(R.Ta, 4)}$, $T_2 = ${v.fix(R.Tb, 4)}$ · measured $T_2/T_1 = ${v.fix(R.ratio, 4)}$ vs $\\lambda^{1-k/2} = ${v.fix(R.L, 2)}^{${v.fix(R.ex, 1)}} = ${v.fix(R.pred, 4)}$${R.k === 2 ? ' — isochronous' : R.k === -1 ? ' — Kepler: $T^2\\propto a^3$' : ''}` : '');
      },
    },
  ],
};
