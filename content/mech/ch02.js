// Classical Mechanics — Chapter 2: Momentum and angular momentum

// ── shared helpers ────────────────────────────────────────────────────────────
const TAU = 2 * Math.PI;
const COLS = ['blue', 'orange', 'purple', 'teal', 'pink', 'gold', 'red'];

/** One-slot cache: recompute only when the key changes. */
function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }

/**
 * Velocity-Verlet for N point masses in d dimensions. force(x, v, t, F) ADDS forces into F (zeroed).
 * Velocity-dependent forces see the half-step predicted velocity. Records every `every` steps.
 * Pairwise forces entered as ±f keep the total momentum exact up to rounding.
 */
function nbody({ m, x, v, force, dt, T, every = 10, onStep }) {
  const N = m.length, d = x[0].length;
  x = x.map((p) => p.slice()); v = v.map((p) => p.slice());
  const zero = () => x.map(() => new Array(d).fill(0));
  let F = zero(); force(x, v, 0, F);
  const out = { t: [0], x: [x.map((p) => p.slice())], v: [v.map((p) => p.slice())], dt: dt * every };
  const steps = Math.round(T / dt);
  for (let n = 1; n <= steps; n++) {
    const vp = [];
    for (let i = 0; i < N; i++) {
      const row = [];
      for (let k = 0; k < d; k++) { v[i][k] += (0.5 * dt * F[i][k]) / m[i]; x[i][k] += dt * v[i][k]; row.push(v[i][k] + (0.5 * dt * F[i][k]) / m[i]); }
      vp.push(row);
    }
    const G = zero(); force(x, vp, n * dt, G);
    for (let i = 0; i < N; i++) for (let k = 0; k < d; k++) v[i][k] += (0.5 * dt * G[i][k]) / m[i];
    F = G;
    if (onStep) onStep(x, v, n * dt);
    if (n % every === 0) { out.t.push(n * dt); out.x.push(x.map((p) => p.slice())); out.v.push(v.map((p) => p.slice())); }
  }
  return out;
}

/** State of a recorded simulation at time t (linear interpolation between frames; i = nearest frame). */
function at(sim, t) {
  const n = sim.t.length - 1, u = Math.min(Math.max(t / sim.dt, 0), n);
  const i0 = Math.min(Math.floor(u), n - 1), f = u - i0;
  const mix = (A, B) => A.map((p, j) => p.map((c, k) => c + f * (B[j][k] - c)));
  return { i: f > 0.5 ? i0 + 1 : i0, t: Math.min(t, sim.t[n]), x: mix(sim.x[i0], sim.x[i0 + 1]), v: mix(sim.v[i0], sim.v[i0 + 1]) };
}

const sumP = (m, V) => V.reduce((s, p, i) => s.map((c, k) => c + m[i] * p[k]), V[0].map(() => 0));
const cmOf = (m, X) => { const Mt = m.reduce((a, b) => a + b, 0); return sumP(m, X).map((c) => c / Mt); };
const crossZ = (a, b) => a[0] * b[1] - a[1] * b[0];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const Lz = (m, X, V, o = [0, 0]) => X.reduce((s, p, i) => s + m[i] * crossZ([p[0] - o[0], p[1] - o[1]], V[i]), 0);
const KE = (m, V) => V.reduce((s, w, i) => s + 0.5 * m[i] * w.reduce((a, c) => a + c * c, 0), 0);

/** Range [lo, hi] of several arrays, padded, with a minimum span. */
function span(arrs, pad = 0.1, minSpan = 1) {
  let lo = Infinity, hi = -Infinity;
  for (const a of arrs) for (const y of a) { if (y < lo) lo = y; if (y > hi) hi = y; }
  if (hi - lo < minSpan) { const c = (hi + lo) / 2; lo = c - minSpan / 2; hi = c + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}

/** Polyline of (ts[k], ys[k]) for k ≤ upto. */
function series(s, ts, ys, upto, st) {
  const pts = []; for (let k = 0; k <= Math.min(upto, ts.length - 1); k++) pts.push([ts[k], ys[k]]);
  if (pts.length > 1) s.path(pts, st);
}

/** A mass drawn as a tinted disc of radius r (data units). */
function body(s, p, r, col, label) {
  s.circle(p[0], p[1], r, { fill: col, fillAlpha: 0.38, color: col, width: 1.6 });
  if (label) s.tex(label, p[0], p[1], { color: 'ink', size: 13, align: 'center', baseline: 'middle' });
}

function polyCentroid(P) {
  let A = 0, cx = 0, cy = 0;
  for (let i = 0; i < P.length; i++) {
    const [x0, y0] = P[i], [x1, y1] = P[(i + 1) % P.length], c = x0 * y1 - x1 * y0;
    A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
  }
  A /= 2; return { A, x: cx / (6 * A), y: cy / (6 * A) };
}
function inPoly(x, y, P) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const fmtSci = (v, x) => (Math.abs(x) < 1e-300 ? '0' : v.sci(x, 2));

export default {
  collection: 'mech',
  chapter: 2,
  title: 'Momentum and angular momentum',
  summary: String.raw`The third law makes internal forces cancel in pairs, so the total momentum of an isolated system is conserved and its centre of mass moves as if all the mass and all the external force were concentrated there. Collisions and rockets are the classic applications. The rotational analogue — angular momentum and torque — is conserved under central forces, which already forces planar motion and equal areas in equal times; for a system, internal torques cancel when the pair forces are central, and the total splits into the orbital motion of the centre of mass plus the spin about it.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Momentum and impulse',
      statement: String.raw`The **momentum** of a particle of mass $m$ and velocity $\mathbf v$ is $\mathbf p = m\mathbf v$; the momentum of a system is the vector sum of the momenta of its particles. With it, Newton's second law reads $\mathbf F = d\mathbf p/dt$. The **impulse** delivered by a force acting during $[t_1,t_2]$ is
$$\mathbf J = \int_{t_1}^{t_2}\mathbf F(t)\,dt ,$$
and integrating the second law gives the impulse–momentum theorem $\mathbf J = \mathbf p(t_2)-\mathbf p(t_1)$, whatever the time profile of the force. The **average force** over the interval is $\bar{\mathbf F} = \mathbf J/(t_2-t_1)$.`,
      idea: String.raw`Since $\mathbf F = \dot{\mathbf p}$ (the second law), the fundamental theorem of calculus turns the time integral of the force into the net change of momentum. Only the *area* under $F(t)$ matters, not its shape: a short hard blow and a long gentle push of equal area change the momentum by the same amount — which is why airbags, crumple zones and bent knees work by stretching $\Delta t$ to shrink the peak force.`,
      caption: String.raw`A ball arrives with momentum $p_0$ and is struck by the force pulse in the middle panel. Press play: the shaded area under $F(t)$ grows exactly as the momentum curve below climbs. Pick another shape, or choose *draw your own* and sketch $F(t)$ with the mouse; the dashed rectangle is the average force with the same area. Changing the mass changes $\Delta v$ but not $\Delta p$.`,
      deps: ['mech-1.6'],
      refs: ['Taylor §1.5'],
      tags: ['momentum', 'impulse'],
      viz(v) {
        const M = v.M;
        const shape = v.select('', [{ value: 'rect', label: 'rectangle' }, { value: 'tri', label: 'triangle' }, { value: 'sin', label: 'half-sine' }, { value: 'draw', label: 'draw your own' }], 'sin');
        const F0 = v.slider('peak force $F_0$ (N)', 2, 40, 20, { step: 0.5 });
        const tau = v.slider('duration (s)', 0.04, 0.8, 0.3, { step: 0.01 });
        const mass = v.slider('mass $m$ (kg)', 0.2, 2, 0.5, { step: 0.05 });
        const pin = v.slider('incoming $p_0$ (kg·m/s)', -4, 4, -2, { step: 0.1 });
        const s0 = v.stage({ x: [-3, 3], y: [-1, 1], height: 86, axes: false, full: true });
        const s1 = v.stage({ x: [-0.02, 1.07], y: [-2, 44], height: 200, axes: 'box', full: true, xlabel: 't (s)', ylabel: 'F (N)' });
        const s2 = v.stage({ x: [-0.02, 1.07], y: [-5, 5], height: 180, axes: 'box', full: true, xlabel: 't (s)', ylabel: 'p (kg·m/s)' });
        const NS = 100;
        const drawn = Array.from({ length: NS + 1 }, (_, i) => { const t = i / NS; return 24 * Math.exp(-(((t - 0.36) / 0.05) ** 2)) + 11 * Math.exp(-(((t - 0.62) / 0.09) ** 2)); });
        let ver = 0, last = null;
        s1.onDrag((x, y, ph) => {
          if (shape.value !== 'draw') return;
          const i = Math.round(M.clamp(x, 0, 1) * NS), f = M.clamp(y, 0, 42);
          if (!last || ph === 'start') drawn[i] = f;
          else { const [i0, f0] = last; for (let k = Math.min(i0, i); k <= Math.max(i0, i); k++) drawn[k] = i === i0 ? f : f0 + ((f - f0) * (k - i0)) / (i - i0); }
          last = ph === 'end' ? null : [i, f]; ver++;
        });
        const force = (t) => {
          if (shape.value === 'draw') { const u = M.clamp(t, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(u)); return drawn[i] + (drawn[i + 1] - drawn[i]) * (u - i); }
          const z = (t - (0.5 - tau.value / 2)) / tau.value;
          if (z < 0 || z >= 1) return 0;
          if (shape.value === 'rect') return F0.value;
          if (shape.value === 'tri') return F0.value * (1 - Math.abs(2 * z - 1));
          return F0.value * Math.sin(Math.PI * z);
        };
        const support = () => {
          if (shape.value !== 'draw') return [0.5 - tau.value / 2, 0.5 + tau.value / 2];
          let a = -1, b = -1; drawn.forEach((f, i) => { if (f > 0.05) { if (a < 0) a = i; b = i; } });
          return a < 0 ? [0.45, 0.55] : [Math.max(0, (a - 1) / NS), Math.min(1, (b + 1) / NS)];
        };
        const cache = memo();
        // RK4 on x' = p/m, p' = F(t), steps aligned with the pulse edges.
        const run = () => cache([shape.value, F0.value, tau.value, mass.value, pin.value, ver].join('|'), () => {
          const n = 2000, h = 1 / n, m = mass.value; let x = 0, p = pin.value; const ps = [p], xs = [0];
          for (let k = 0; k < n; k++) {
            const t = k * h, f1 = force(t), f2 = force(t + h / 2), f4 = force(t + h);
            x += ((h / 6) * (p + 2 * (p + (h / 2) * f1) + 2 * (p + (h / 2) * f2) + (p + h * f2))) / m;
            p += (h / 6) * (f1 + 4 * f2 + f4);
            ps.push(p); xs.push(x);
          }
          let Fmax = 5; for (let i = 0; i <= 400; i++) Fmax = Math.max(Fmax, force(i / 400));
          return { ps, xs, n, J: M.integrate(force, 0, 1, 4000), Fmax };
        });
        v.animate((t) => {
          const R = run(), ts = M.clamp(t / 3.4, 0, 1), k = Math.round(ts * R.n), [a, b] = support();
          const pNow = R.ps[k], xNow = R.xs[k], Fnow = force(ts);
          // ── ball strip
          const xlo = Math.min(...R.xs), xhi = Math.max(...R.xs), pad = Math.max(0.6, (xhi - xlo) * 0.25);
          s0.setView([xlo - pad, xhi + pad], [-1, 1]);
          const unit = (xhi - xlo + 2 * pad) / 14, px = s0.inv(14, 0)[0] - s0.inv(0, 0)[0];
          s0.hline(-0.55, { color: 'muted', width: 1.5 });
          for (let j = 0; j <= k; j += 100) s0.dot(R.xs[j], 0, { r: 3, color: 'faint' });
          if (Fnow > 0.01) s0.arrow(xNow - px - Fnow * unit * 0.12, 0, xNow - px, 0, { color: 'orange', width: 3 });
          s0.dot(xNow, 0, { r: 11, color: 'accent' });
          if (Math.abs(pNow) > 0.02) { s0.arrow(xNow, 0.62, xNow + pNow * unit, 0.62, { color: 'blue', width: 2.2 }); s0.tex('p', xNow + pNow * unit, 0.62, { color: 'blue', align: pNow > 0 ? 'left' : 'right', dx: pNow > 0 ? 5 : -5 }); }
          s0.corner(Fnow > 0.01 ? `F = ${v.fix(Fnow, 1)} N` : '', 'tl', { color: 'orange' });
          // ── force panel
          s1.setView(null, shape.value === 'draw' ? [-7, 44] : [-0.16 * R.Fmax, R.Fmax * 1.18]);
          const area = []; for (let i = 0; i <= 300; i++) { const tt = (ts * i) / 300; area.push([tt, force(tt)]); }
          area.push([ts, 0], [0, 0]);
          s1.poly(area, { fill: 'accent', fillAlpha: 0.24, stroke: false });
          const Fbar = R.J / (b - a);
          s1.rect(a, 0, b, Fbar, { color: 'orange', dash: [5, 4], width: 1.6 });
          s1.tex(String.raw`\bar F = J/\Delta t`, b, Fbar, { color: 'orange', align: 'left', baseline: 'bottom', dx: 6, dy: -2 });
          s1.fn(force, { domain: [0, 1], n: 900, color: 'accent', width: 2.4 });
          s1.vline(ts, { color: 'gold', width: 1.5 });
          s1.corner(`area so far: ${v.fix(M.integrate(force, 0, ts, 1200), 3)} N·s` + (shape.value === 'draw' ? ' — drag in this panel to draw F(t)' : ''), 'tr', { color: 'accent', weight: 600 });
          // ── momentum panel
          const [lo, hi] = span([R.ps, [0]], 0.24, 2);
          s2.setView(null, [lo, hi]);
          s2.hline(0, { color: 'faint' });
          s2.hline(pin.value, { color: 'muted', dash: [4, 4] }); s2.hline(R.ps[R.n], { color: 'muted', dash: [4, 4] });
          s2.path(R.ps.map((p, i) => [i / R.n, p]), { color: 'blue', alpha: 0.25, width: 1.5 });
          s2.path(R.ps.slice(0, k + 1).map((p, i) => [i / R.n, p]), { color: 'blue', width: 2.6 });
          s2.arrow(0.975, pin.value, 0.975, R.ps[R.n], { both: true, color: 'green', width: 1.6, head: 7 });
          s2.tex(String.raw`\Delta p`, 0.975, (pin.value + R.ps[R.n]) / 2, { color: 'green', align: 'right', dx: -7 });
          s2.vline(ts, { color: 'gold', width: 1.5 });
          s2.dot(ts, pNow, { color: 'gold', r: 5 });
          v.legend([['accent', 'force $F(t)$'], ['accent', 'impulse so far (area)', { area: true }], ['orange', 'average force', { dash: true }], ['blue', 'momentum $p(t)$']]);
        }, { period: 4.6, still: 3.8 });
        v.readout(() => {
          const R = run(), dp = R.ps[R.n] - pin.value, [a, b] = support();
          return String.raw`area under $F(t)$: $J = ${v.fix(R.J, 3)}$ N·s · change of momentum from integrating the motion: $\Delta p = ${v.fix(dp, 3)}$ kg·m/s · $\Delta v = \Delta p/m = ${v.fix(dp / mass.value, 2)}$ m/s · average force $\bar F = ${v.fix(R.J / (b - a), 1)}$ N over $\Delta t = ${v.fix(b - a, 2)}$ s`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Conservation of momentum',
      credit: 'Descartes, 1644; Newton, 1687',
      statement: String.raw`For a system of particles, $\dfrac{d\mathbf P}{dt} = \mathbf F_{\rm ext}$, where $\mathbf P = \sum_i m_i\mathbf v_i$ is the total momentum and $\mathbf F_{\rm ext}$ the sum of the external forces; the internal forces drop out provided they obey the third law, $\mathbf F_{ij} = -\mathbf F_{ji}$. In particular, the total momentum of an **isolated** system ($\mathbf F_{\rm ext}=0$) is constant, however violently its parts interact. Each component of $\mathbf P$ along which the external force vanishes is conserved separately.`,
      idea: String.raw`Add up the second law $\dot{\mathbf p}_i = \mathbf F_i^{\rm ext} + \sum_{j\ne i}\mathbf F_{ij}$ over all particles. The double sum of internal forces splits into pairs $\mathbf F_{ij}+\mathbf F_{ji}$, each zero by Newton's third law (1.7), leaving $\dot{\mathbf P} = \mathbf F_{\rm ext}$. Momentum is the quantity that internal forces can only pass around, never create.`,
      caption: String.raw`Six masses joined by springs vibrate, tumble and bump. On the right their momenta are laid tip to tail: the individual arrows swing wildly, but the closing green arrow $\mathbf P$ never moves. Switch on gravity or friction: the external force drags $\mathbf P$ away exactly as the readout's prediction says. *New system* draws another random molecule.`,
      deps: ['mech-2.1', 'mech-1.7'],
      refs: ['Taylor §3.1', 'Goldstein §1.2'],
      tags: ['momentum', 'conservation law'],
      viz(v) {
        const M = v.M;
        const ext = v.select('', [{ value: 'none', label: 'isolated' }, { value: 'grav', label: 'add gravity' }, { value: 'drag', label: 'add friction' }], 'none');
        let seed = 4; v.button('New system', () => { seed++; });
        const sA = v.stage({ x: [-6, 6], y: [-4.5, 4.5], equal: true, axes: false, height: 330, title: 'particles, springs and momenta $m_i\\mathbf v_i$' });
        const sB = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 330, title: 'momenta tip to tail; their sum is $\\mathbf P$' });
        const N = 6, T = 14, G = 0.03, GAM = 0.15, Ptar = [0.7, 0.3];
        const cache = memo(); let cur = null;
        const build = () => cache(seed + ext.value, () => {
          const r = v.rng(seed * 7 + 1), m = [], x = [], vel = [], rad = [];
          for (let i = 0; i < N; i++) {
            m.push(r.uniform(0.6, 2.4)); rad.push(0.2 * Math.sqrt(m[i]));
            const a = (TAU * i) / N + r.uniform(-0.3, 0.3), R = r.uniform(1.3, 2.3);
            x.push([R * Math.cos(a) - 0.5, R * Math.sin(a) + 1.1]); vel.push([r.normal() * 0.7, r.normal() * 0.7]);
          }
          const Mt = M.sum(m), P = sumP(m, vel);
          for (const w of vel) { w[0] += (Ptar[0] - P[0]) / Mt; w[1] += (Ptar[1] - P[1]) / Mt; }
          const springs = [];
          for (let i = 1; i < N; i++) springs.push([i, r.int(0, i - 1)]);
          for (let e = 0; e < 3; e++) { const i = r.int(0, N - 1), j = r.int(0, N - 1); if (i !== j && !springs.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) springs.push([i, j]); }
          springs.forEach((s) => s.push(Math.hypot(x[s[0]][0] - x[s[1]][0], x[s[0]][1] - x[s[1]][1]) * r.uniform(0.7, 1.3)));
          const mode = ext.value;
          const force = (X, V, t, F) => {
            for (const [i, j, L0] of springs) {
              const dx = X[j][0] - X[i][0], dy = X[j][1] - X[i][1], d = Math.hypot(dx, dy), f = (3 * (d - L0)) / d;
              F[i][0] += f * dx; F[i][1] += f * dy; F[j][0] -= f * dx; F[j][1] -= f * dy;
            }
            for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
              const dx = X[j][0] - X[i][0], dy = X[j][1] - X[i][1], d = Math.hypot(dx, dy), o = rad[i] + rad[j] - d;
              if (o > 0) { const f = (-300 * o) / d; F[i][0] += f * dx; F[i][1] += f * dy; F[j][0] -= f * dx; F[j][1] -= f * dy; }
            }
            if (mode === 'grav') for (let i = 0; i < N; i++) F[i][1] -= m[i] * G;
            if (mode === 'drag') for (let i = 0; i < N; i++) { F[i][0] -= GAM * m[i] * V[i][0]; F[i][1] -= GAM * m[i] * V[i][1]; }
          };
          const sim = nbody({ m, x, v: vel, force, dt: 0.002, T, every: 8 });
          let R = 1.5; const Ptrail = [], cm = [];
          sim.x.forEach((X, k) => {
            let s = [0, 0];
            sim.v[k].forEach((w, i) => { s = [s[0] + m[i] * w[0], s[1] + m[i] * w[1]]; R = Math.max(R, Math.abs(s[0]), Math.abs(s[1])); });
            Ptrail.push(s); cm.push(cmOf(m, X));
          });
          return { m, rad, springs, sim, R: R * 1.08, Ptrail, cm, Mt };
        });
        v.animate((t) => {
          const B = build(), f = at(B.sim, t), X = f.x, V = f.v;
          sB.setView([-B.R, B.R], [-B.R, B.R]);
          for (const [i, j] of B.springs) sA.line(X[i][0], X[i][1], X[j][0], X[j][1], { color: 'muted', width: 1.3, alpha: 0.55 });
          sA.path(B.cm.slice(0, f.i + 1), { color: 'green', dash: [4, 4], width: 1.4 });
          X.forEach((p, i) => body(sA, p, B.rad[i], COLS[i]));
          X.forEach((p, i) => sA.arrow(p[0], p[1], p[0] + 0.8 * B.m[i] * V[i][0], p[1] + 0.8 * B.m[i] * V[i][1], { color: COLS[i], width: 2 }));
          const C = cmOf(B.m, X);
          sA.dot(C[0], C[1], { r: 4.5, color: 'green', label: 'CM', labelPos: 'nw' });
          sA.corner({ none: 'no external force', grav: 'external: gravity on every mass', drag: 'external: friction on every mass' }[ext.value], 'tl', { color: ext.value === 'none' ? 'green' : 'red', weight: 600 });
          let s = [0, 0];
          V.forEach((w, i) => { const q = [s[0] + B.m[i] * w[0], s[1] + B.m[i] * w[1]]; sB.arrow(s[0], s[1], q[0], q[1], { color: COLS[i], width: 2, head: 8 }); s = q; });
          sB.path(B.Ptrail.slice(0, f.i + 1), { color: 'green', width: 1.5, alpha: 0.6 });
          sB.dot(B.Ptrail[0][0], B.Ptrail[0][1], { hollow: true, r: 7, color: 'muted' });
          sB.arrow(0, 0, s[0], s[1], { color: 'green', width: 3.6, head: 11 });
          sB.tex(String.raw`\mathbf P`, s[0], s[1], { color: 'green', dx: 8, dy: -10 });
          cur = { P: s, P0: B.Ptrail[0], t: f.t, Mt: B.Mt };
          v.legend([['green', 'total momentum $\\mathbf P$ (and its track)'], ['muted', '$\\mathbf P(0)$', { dot: true }]]);
        }, { period: T + 1.5, still: 6.5 });
        v.readout(() => {
          if (!cur) return '';
          const { P, P0, t, Mt } = cur, d = Math.hypot(P[0] - P0[0], P[1] - P0[1]);
          if (ext.value === 'none') return String.raw`$\mathbf P = (${v.fix(P[0], 4)},\ ${v.fix(P[1], 4)})$ kg·m/s, and $|\mathbf P(t)-\mathbf P(0)| = ${fmtSci(v, d)}$ — the spring and contact forces cancel in pairs, so only rounding error remains.`;
          if (ext.value === 'grav') return String.raw`$\Delta\mathbf P = (${v.fix(P[0] - P0[0], 3)},\ ${v.fix(P[1] - P0[1], 3)})$ kg·m/s; the external impulse $(0,\,-Mgt)$ predicts $(0,\ ${v.fix(-Mt * G * t, 3)})$ at $t = ${v.fix(t, 1)}$ s.`;
          return String.raw`$|\mathbf P(t)|/|\mathbf P(0)| = ${v.fix(Math.hypot(...P) / Math.hypot(...P0), 4)}$; friction $-\gamma m_i\mathbf v_i$ on every mass sums to $-\gamma\mathbf P$, predicting $e^{-\gamma t} = ${v.fix(Math.exp(-GAM * t), 4)}$ at $t = ${v.fix(t, 1)}$ s.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Centre of mass',
      credit: 'Archimedes, c. 250 BC',
      statement: String.raw`The **centre of mass** of particles of masses $m_1,\dots,m_N$ at positions $\mathbf r_1,\dots,\mathbf r_N$ is the mass-weighted average
$$\mathbf R = \frac1M\sum_{i=1}^N m_i\mathbf r_i,\qquad M = \sum_i m_i .$$
For a continuous body with mass density $\rho$ occupying a region $V$ (a volume, or an area for a lamina) it is $\mathbf R = \frac1M\int_V \rho(\mathbf r)\,\mathbf r\,dV$ with $M = \int_V\rho\,dV$. It does not depend on the choice of origin, and it need not lie inside the body.`,
      idea: String.raw`A weighted average of positions: shift the origin by $\mathbf a$ and every $\mathbf r_i$, hence $\mathbf R$, shifts by $\mathbf a$, so $\mathbf R$ is a genuine point of space. For a continuum the sum becomes a Riemann integral (computed below on a fine grid of cells). Its mechanical meaning: in uniform gravity the total torque of the weights about $\mathbf R$ vanishes, so a body supported at $\mathbf R$ balances, and a body hung from any point settles with $\mathbf R$ directly beneath it.`,
      caption: String.raw`Drag the corners of the lamina (or switch to point masses and drag them), and drag the red pin. The right panel hangs the body from the pin: it always settles with the centre of mass on the vertical plumb line through the pin. Put the pin on the centre of mass and the torque vanishes — the body balances in every orientation. For the L-shape the centre of mass lies outside the material.`,
      deps: ['pma-10.1'],
      refs: ['Taylor §3.3'],
      tags: ['centre of mass'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'lam', label: 'lamina' }, { value: 'pts', label: 'point masses' }], 'lam');
        const m1 = v.slider('$m_1$ (kg)', 0.2, 6, 3, { step: 0.1 });
        const sL = v.stage({ x: [-0.9, 4.3], y: [-0.7, 3.7], equal: true, height: 320, title: 'the body: drag corners or masses, and the pin' });
        const sR = v.stage({ x: [-3, 3], y: [-4, 1], equal: true, axes: false, height: 320, title: 'hung from the pin' });
        const lam = [[0, 0], [3.4, 0], [3.4, 1], [1, 1], [1, 3.2], [0, 3.2]].map((p) => sL.handle(p[0], p[1], { color: 'accent', r: 5.5 }));
        const pts = [[0.3, 0.3], [3.6, 0.5], [3, 3.1], [0.5, 2.7]].map((p, i) => sL.handle(p[0], p[1], { color: COLS[i], label: `m${'₁₂₃₄'[i]}`, labelPos: 'ne' }));
        const pin = sL.handle(0.5, 2.75, { color: 'red', label: 'pin', labelPos: 'nw' });
        const g = 9.81; let cur = null;
        const compute = () => {
          if (mode.value === 'lam') {
            const P = lam.map((h) => [h.x, h.y]), ex = polyCentroid(P);
            const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
            const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), n = 160, hx = (x1 - x0) / n, hy = (y1 - y0) / n;
            let A = 0, Sx = 0, Sy = 0;
            for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * hx; for (let j = 0; j < n; j++) { const y = y0 + (j + 0.5) * hy; if (inPoly(x, y, P)) { A++; Sx += x; Sy += y; } } }
            return { lam: true, P, c: [Sx / A, Sy / A], exact: [ex.x, ex.y], M: A * hx * hy };
          }
          const m = [m1.value, 1, 2, 1.5], X = pts.map((h) => [h.x, h.y]);
          return { lam: false, X, m, c: cmOf(m, X), M: M.sum(m) };
        };
        const drawBody = (s, C, tf) => {
          if (C.lam) { s.poly(C.P.map(tf), { fill: 'accent', fillAlpha: 0.24, color: 'accent', width: 2 }); return; }
          const Q = C.X.map(tf), pp = tf([pin.x, pin.y]);
          s.poly(Q, { color: 'muted', width: 1.4, alpha: 0.7 });
          Q.forEach((q) => s.line(pp[0], pp[1], q[0], q[1], { color: 'muted', width: 1, alpha: 0.5, dash: [3, 3] }));
          Q.forEach((q, i) => body(s, q, 0.08 + 0.07 * Math.sqrt(C.m[i]), COLS[i]));
        };
        v.render(() => {
          const lamMode = mode.value === 'lam';
          lam.forEach((h) => { h.visible = lamMode; }); pts.forEach((h) => { h.visible = !lamMode; }); m1.el.hidden = lamMode;
          const C = compute(), c = C.c, pp = [pin.x, pin.y]; cur = C;
          drawBody(sL, C, (p) => p);
          sL.line(c[0], -0.7, c[0], 3.7, { color: 'green', alpha: 0.35, dash: [3, 4] });
          sL.line(-0.9, c[1], 4.3, c[1], { color: 'green', alpha: 0.35, dash: [3, 4] });
          sL.dot(c[0], c[1], { r: 5.5, color: 'green' });
          sL.tex(String.raw`\mathbf R`, c[0], c[1], { color: 'green', dx: 8, dy: 4, baseline: 'top' });
          // hanging: rotate about the pin so that R is straight below it
          const d = [c[0] - pp[0], c[1] - pp[1]], dl = Math.hypot(d[0], d[1]), phi = dl < 1e-6 ? 0 : -Math.PI / 2 - Math.atan2(d[1], d[0]);
          const cs = Math.cos(phi), sn = Math.sin(phi);
          const rot = (p) => { const x = p[0] - pp[0], y = p[1] - pp[1]; return [cs * x - sn * y, sn * x + cs * y]; };
          let D = 0.8; (C.lam ? C.P : C.X).forEach((p) => { D = Math.max(D, Math.hypot(p[0] - pp[0], p[1] - pp[1])); });
          sR.setView([-D - 0.4, D + 0.4], [-D - 0.4, 0.75]);
          sR.line(-0.6, 0.6, 0.6, 0.6, { color: 'ink', width: 3 }); sR.line(0, 0.6, 0, 0, { color: 'ink', width: 1.5 });
          drawBody(sR, C, rot);
          sR.line(0, 0, 0, -D - 0.4, { color: 'green', dash: [6, 4], width: 1.5 });
          sR.dot(0, -dl, { r: 5.5, color: 'green' });
          sR.tex(String.raw`\mathbf R`, 0, -dl, { color: 'green', dx: 9, baseline: 'middle' });
          sR.dot(0, 0, { r: 5, color: 'red' });
          const balanced = dl < 0.06;
          sR.corner(balanced ? 'pin at the centre of mass: balances anyhow' : 'plumb line through the pin passes through R', 'bl', { color: balanced ? 'green' : 'muted', weight: balanced ? 600 : 400 });
        });
        v.readout(() => {
          if (!cur) return '';
          const C = cur, tq = -C.M * g * (C.c[0] - pin.x);
          const head = C.lam
            ? String.raw`midpoint rule on $160\times160$ cells: $\mathbf R = (${v.fix(C.c[0], 3)},\ ${v.fix(C.c[1], 3)})$; exact polygon formula: $(${v.fix(C.exact[0], 3)},\ ${v.fix(C.exact[1], 3)})$ m; mass $M = ${v.fix(C.M, 2)}$ kg at $1$ kg/m²`
            : String.raw`$\mathbf R = \sum m_i\mathbf r_i/M = (${v.fix(C.c[0], 3)},\ ${v.fix(C.c[1], 3)})$ m with $M = ${v.fix(C.M, 2)}$ kg`;
          return head + String.raw` · torque of gravity about the pin, body held as drawn: $\tau = -Mg\,(X - x_{\rm pin}) = ${v.fix(tq, 2)}$ N·m`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Motion of the centre of mass',
      statement: String.raw`For any system of particles whose internal forces obey the third law, the centre of mass moves like a single particle of mass $M$ acted on by the total external force:
$$M\ddot{\mathbf R} = \dot{\mathbf P} = \mathbf F_{\rm ext}.$$
Internal forces — explosions, springs, collisions between the parts — cannot change the motion of $\mathbf R$. In uniform gravity with no other external force, $\mathbf R$ follows the same parabola the unbroken body would have followed.`,
      idea: String.raw`Differentiate $M\mathbf R = \sum m_i\mathbf r_i$ twice: $M\ddot{\mathbf R} = \sum m_i\ddot{\mathbf r}_i = \dot{\mathbf P}$, and conservation of momentum (2.2) gives $\dot{\mathbf P} = \mathbf F_{\rm ext}$. In uniform gravity the external force is $M\mathbf g$ whatever the pieces do — but only until something else pushes on them, such as the ground under a landed fragment, or air drag that depends on each piece's size and speed.`,
      caption: String.raw`A 12 kg shell bursts into fragments in mid-flight. Press play: the pieces scatter, but the green centre of mass stays on the dashed parabola of an unexploded shell — until the first fragment lands and the ground starts pushing. Turn on air drag: the parabola fails, yet the readout shows $M\ddot{\mathbf R}$ still equals the total external force.`,
      deps: ['mech-2.3', 'mech-2.2'],
      refs: ['Taylor §3.3', 'Tong §1.3'],
      tags: ['centre of mass', 'momentum'],
      viz(v) {
        const M = v.M;
        const K = v.slider('fragments', 2, 7, 5, { int: true });
        const te = v.slider('burst time (s)', 0.5, 4, 2, { step: 0.05 });
        const blast = v.slider('blast speed (m/s)', 0, 16, 9, { step: 0.5 });
        const drag = v.toggle('air drag', false);
        let seed = 7; v.button('New burst', () => { seed++; });
        const s = v.stage({ x: [-4, 104], y: [-3, 50], equal: true, axes: 'box', height: 340, xlabel: 'x (m)', ylabel: 'y (m)' });
        const g = 9.81, Mt = 12, V0 = 32, ANG = (58 * Math.PI) / 180, C0 = 0.03, T = 7, DT = 0.002, EV = 10;
        const cache = memo(); let cur = null;
        const build = () => cache([K.value, te.value, blast.value, drag.value, seed].join('|'), () => {
          const r = v.rng(seed * 31 + K.value), k = K.value;
          const w = Array.from({ length: k }, () => r.uniform(0.5, 1.5)), ws = M.sum(w), m = w.map((x) => (Mt * x) / ws);
          let dv = m.map(() => { const a = r.uniform(0, TAU), sp = blast.value * r.uniform(0.5, 1.2); return [sp * Math.cos(a), sp * Math.sin(a)]; });
          const pm = sumP(m, dv); dv = dv.map((d) => [d[0] - pm[0] / Mt, d[1] - pm[1] / Mt]);
          const cd = m.map((mi) => C0 * Math.pow(mi / Mt, 2 / 3));
          const step = (p, u, c, mi) => {
            const sp = Math.hypot(u[0], u[1]), fx = drag.value ? -c * sp * u[0] : 0, fy = -mi * g + (drag.value ? -c * sp * u[1] : 0);
            u[0] += (DT * fx) / mi; u[1] += (DT * fy) / mi; p[0] += DT * u[0]; p[1] += DT * u[1]; return [fx, fy];
          };
          const gx = [0, 0], gv = [V0 * Math.cos(ANG), V0 * Math.sin(ANG)]; let gF = [0, -Mt * g], gLanded = false;
          let X = m.map(() => [0, 0]), Vv = m.map(() => gv.slice()), burst = false, ib = null;
          const landed = m.map(() => false);
          const out = { m, ghost: [[0, 0]], X: [X.map((p) => p.slice())], cm: [[0, 0]], Fext: [[0, -Mt * g]], land: [], dt: DT * EV };
          const n = Math.round(T / DT);
          for (let st = 1; st <= n; st++) {
            const t = st * DT; let F = [0, 0];
            if (!gLanded) { gF = step(gx, gv, C0, Mt); if (gx[1] < 0) { gx[1] = 0; gv[0] = gv[1] = 0; gLanded = true; gF = [0, 0]; } }
            if (!burst) {
              X = m.map(() => gx.slice()); Vv = m.map(() => gv.slice()); F = gF.slice();
              if (t >= te.value) { burst = true; ib = Math.ceil(st / EV); Vv = Vv.map((u, i) => [u[0] + dv[i][0], u[1] + dv[i][1]]); }
            } else {
              for (let i = 0; i < k; i++) {
                if (landed[i]) continue;
                const f = step(X[i], Vv[i], cd[i], m[i]);
                if (X[i][1] < 0) { X[i][1] = 0; Vv[i] = [0, 0]; landed[i] = true; out.land.push(t); } else { F[0] += f[0]; F[1] += f[1]; }
              }
            }
            if (st % EV === 0) { out.ghost.push(gx.slice()); out.X.push(X.map((p) => p.slice())); out.cm.push(cmOf(m, X)); out.Fext.push(F); }
          }
          out.ib = ib ?? out.X.length - 1;
          let x0 = -3, x1 = 60, y1 = 20;
          out.X.forEach((fr) => fr.forEach((p) => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }));
          out.ghost.forEach((p) => { x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
          out.vx = [x0 - 3, x1 + 3]; out.vy = [-3, y1 + 4];
          return out;
        });
        v.animate((t) => {
          const B = build(), n = B.X.length - 1, i = Math.round(M.clamp(t / B.dt, 0, n));
          s.setView(B.vx, B.vy);
          s.hband(B.vy[0] - 50, 0, { color: 'faint', alpha: 0.3 });
          s.path(B.ghost, { color: 'muted', dash: [6, 5], width: 1.4 });
          s.dot(B.ghost[i][0], B.ghost[i][1], { r: 8, hollow: true, color: 'muted' });
          s.path(B.X.slice(0, Math.min(i, B.ib) + 1).map((fr) => fr[0]), { color: 'ink', width: 2 });
          if (i >= B.ib) for (let j = 0; j < B.m.length; j++) s.path(B.X.slice(B.ib, i + 1).map((fr) => fr[j]), { color: COLS[j], width: 1.6, alpha: 0.8 });
          s.path(B.cm.slice(0, i + 1), { color: 'green', width: 2.6 });
          if (i >= B.ib && i < B.ib + 18) { const c = B.X[B.ib][0]; s.circle(c[0], c[1], 0.6 + (i - B.ib) * 0.35, { color: 'orange', width: 2, alpha: 1 - (i - B.ib) / 18 }); }
          if (i < B.ib) s.dot(B.X[i][0][0], B.X[i][0][1], { r: 7.5, color: 'ink' });
          else B.X[i].forEach((p, j) => s.dot(p[0], p[1], { r: 3.5 + 3.5 * Math.cbrt(B.m[j] / 2), color: COLS[j] }));
          const c = B.cm[i];
          s.dot(c[0], c[1], { r: 6, color: 'green', label: 'CM', labelPos: 'ne' });
          const landedNow = B.land.filter((tl) => tl <= i * B.dt + 1e-9).length;
          cur = { i, B, landedNow };
          v.legend([['green', 'centre of mass'], ['muted', 'unexploded shell', { dash: true }]]);
          s.corner(i < B.ib ? 'before the burst' : landedNow ? `${landedNow} fragment${landedNow > 1 ? 's' : ''} landed: the ground pushes` : 'all fragments in flight', 'tr', { color: i >= B.ib && landedNow ? 'red' : 'muted', weight: 600 });
        }, { period: T + 1, still: 3.6 });
        v.readout(() => {
          if (!cur) return '';
          const { i, B } = cur, n = B.X.length - 1, c = B.cm[i], gh = B.ghost[i], dist = Math.hypot(c[0] - gh[0], c[1] - gh[1]);
          let acc = '';
          const nearImpact = B.land.some((tl) => Math.abs(tl - i * B.dt) < 2.5 * B.dt) || Math.abs(i - B.ib) < 2;
          if (i > 0 && i < n && !nearImpact) {
            const a = [0, 1].map((k) => (Mt * (B.cm[i + 1][k] - 2 * c[k] + B.cm[i - 1][k])) / (B.dt * B.dt)), F = B.Fext[i];
            acc = String.raw` · measured $M\ddot{\mathbf R} = (${v.fix(a[0], 1)},\ ${v.fix(a[1], 1)})$ N, total external force $(${v.fix(F[0], 1)},\ ${v.fix(F[1], 1)})$ N`;
          } else if (i > 0 && i < n) acc = ' · (impulsive instant: a burst or a landing)';
          return String.raw`distance from the centre of mass to the unexploded shell: ${v.fix(dist, 2)} m` + acc;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Definition',
      name: 'Centre-of-mass frame',
      statement: String.raw`The **centre-of-mass frame** of a system is the reference frame moving with its centre of mass, $\mathbf V = \dot{\mathbf R} = \mathbf P/M$. Velocities in it are $\mathbf u_i' = \mathbf u_i - \mathbf V$ (a Galilean boost), so the total momentum vanishes: $\sum_i m_i\mathbf u_i' = 0$. For an isolated system it is an inertial frame. The kinetic energy splits as
$$K = \tfrac12 MV^2 + K',$$
the energy of the centre-of-mass motion plus the kinetic energy $K'$ measured in the centre-of-mass frame (König's theorem).`,
      idea: String.raw`The total momentum in a frame moving with velocity $\mathbf w$ is $\mathbf P - M\mathbf w$; it vanishes exactly for $\mathbf w = \mathbf V$. For an isolated system $\mathbf V$ is constant (2.4), so the boost is between inertial frames (1.8). Expanding $\tfrac12\sum m_i|\mathbf V+\mathbf u_i'|^2$, the cross term is $\mathbf V\cdot\sum m_i\mathbf u_i' = 0$. In the CM frame a two-body collision looks symmetric: the momenta are equal and opposite before and after.`,
      caption: String.raw`The same elastic collision in two frames. On the left (lab) $m_2$ starts at rest and the total momentum (green, at the centre of mass) points along the motion. On the right (CM frame) the two momentum arrows are always equal and opposite: the bodies approach and recede symmetrically, each with unchanged speed. Change the masses and the impact parameter $b$.`,
      deps: ['mech-2.4', 'mech-1.8'],
      refs: ['Taylor §3.3'],
      tags: ['centre of mass', 'reference frames'],
      viz(v) {
        const M = v.M;
        const m1s = v.slider('$m_1$ (kg)', 0.5, 4, 1, { step: 0.1 });
        const m2s = v.slider('$m_2$ (kg)', 0.5, 4, 2, { step: 0.1 });
        const bs = v.slider('impact parameter $b$ (m)', 0, 1.2, 0.45, { step: 0.01 });
        const sL = v.stage({ x: [-6, 6], y: [-3, 3], equal: true, axes: false, height: 290, title: 'lab frame' });
        const sC = v.stage({ x: [-6, 6], y: [-3, 3], equal: true, axes: false, height: 290, title: 'centre-of-mass frame' });
        const U = 1.2, T = 9, SC = 0.9;
        const cache = memo(); let cur = null;
        const build = () => cache([m1s.value, m2s.value, bs.value].join('|'), () => {
          const m = [m1s.value, m2s.value], rad = m.map((x) => 0.42 * Math.cbrt(x)), Mt = m[0] + m[1];
          const force = (X, Vv, t, F) => {
            const dx = X[1][0] - X[0][0], dy = X[1][1] - X[0][1], d = Math.hypot(dx, dy), o = rad[0] + rad[1] - d;
            if (o > 0) { const f = (-900 * o) / d; F[0][0] += f * dx; F[0][1] += f * dy; F[1][0] -= f * dx; F[1][1] -= f * dy; }
          };
          const sim = nbody({ m, x: [[-5, bs.value], [0, 0]], v: [[U, 0], [0, 0]], force, dt: 0.001, T, every: 10 });
          return { m, rad, Mt, sim, V: [(m[0] * U) / Mt, 0], cm: sim.x.map((X) => cmOf(m, X)) };
        });
        v.animate((t) => {
          const B = build(), f = at(B.sim, t), X = f.x, Vv = f.v, R = cmOf(B.m, X), m = B.m;
          // lab
          sL.path(B.cm.slice(0, f.i + 1), { color: 'green', dash: [4, 4], width: 1.3 });
          [0, 1].forEach((j) => sL.path(B.sim.x.slice(0, f.i + 1).map((fr) => fr[j]), { color: COLS[j], width: 1.5, alpha: 0.6 }));
          X.forEach((p, j) => body(sL, p, B.rad[j], COLS[j], `${j + 1}`));
          X.forEach((p, j) => { const q = [p[0] + SC * m[j] * Vv[j][0], p[1] + SC * m[j] * Vv[j][1]]; if (Math.hypot(Vv[j][0], Vv[j][1]) > 0.01) sL.arrow(p[0], p[1], q[0], q[1], { color: COLS[j], width: 2.2 }); });
          const P = sumP(m, Vv);
          sL.arrow(R[0], R[1] - 0.02, R[0] + SC * P[0], R[1] + SC * P[1] - 0.02, { color: 'green', width: 3 });
          sL.dot(R[0], R[1], { r: 4.5, color: 'green' });
          sL.tex(String.raw`\mathbf P`, R[0] + 0.5 * SC * P[0], R[1], { color: 'green', dy: -8, align: 'center', baseline: 'bottom' });
          // CM frame
          sC.hline(0, { color: 'faint' }); sC.vline(0, { color: 'faint' });
          [0, 1].forEach((j) => sC.path(B.sim.x.slice(0, f.i + 1).map((fr, k) => [fr[j][0] - B.cm[k][0], fr[j][1] - B.cm[k][1]]), { color: COLS[j], width: 1.5, alpha: 0.6 }));
          const Xc = X.map((p) => [p[0] - R[0], p[1] - R[1]]), Vc = Vv.map((w) => [w[0] - B.V[0], w[1] - B.V[1]]);
          Xc.forEach((p, j) => body(sC, p, B.rad[j], COLS[j], `${j + 1}`));
          Xc.forEach((p, j) => sC.arrow(p[0], p[1], p[0] + SC * m[j] * Vc[j][0], p[1] + SC * m[j] * Vc[j][1], { color: COLS[j], width: 2.2 }));
          sC.dot(0, 0, { r: 4.5, color: 'green' });
          sC.corner('green dot: centre of mass, where the total momentum P′ = 0', 'bl', { color: 'green' });
          cur = { P, Pc: sumP(m, Vc), K: KE(m, Vv), Kc: KE(m, Vc), V: B.V, Mt: B.Mt, sp: Vc.map((w) => Math.hypot(w[0], w[1])), sp0: [U - B.V[0], B.V[0]] };
          v.legend([[COLS[0], 'momentum of $m_1$'], [COLS[1], 'momentum of $m_2$'], ['green', 'total momentum']]);
        }, { period: T + 1, still: 6.2 });
        v.readout(() => {
          if (!cur) return '';
          const c = cur, KV = 0.5 * c.Mt * c.V[0] ** 2;
          return String.raw`lab: $\mathbf P = (${v.fix(c.P[0], 3)},\ ${v.fix(c.P[1], 3)})$ kg·m/s, $K = ${v.fix(c.K, 4)}$ J · CM frame: $\mathbf P' = (${v.fix(c.Pc[0], 3)},\ ${v.fix(c.Pc[1], 3)})$, $K' = ${v.fix(c.Kc, 4)}$ J · $K - K' = ${v.fix(c.K - c.Kc, 4)}$ J and $\tfrac12MV^2 = ${v.fix(KV, 4)}$ J · CM-frame speeds $|\mathbf u_1'| = ${v.fix(c.sp[0], 3)}$, $|\mathbf u_2'| = ${v.fix(c.sp[1], 3)}$ m/s (initially ${v.fix(c.sp0[0], 3)} and ${v.fix(c.sp0[1], 3)})`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Model',
      name: 'Collisions and the coefficient of restitution',
      credit: 'Newton, 1687 (experimental law of impact)',
      statement: String.raw`In a head-on collision of two bodies with velocities $u_1,u_2$ before and $v_1,v_2$ after, momentum is conserved, $m_1u_1+m_2u_2 = m_1v_1+m_2v_2$, and Newton's law of impact closes the problem: the separation speed is a fixed fraction of the approach speed,
$$v_2 - v_1 = e\,(u_1-u_2),\qquad 0\le e\le 1,$$
with the **coefficient of restitution** $e$ depending on the materials. $e=1$ is elastic (kinetic energy conserved), $e=0$ perfectly inelastic (the bodies move off together). The kinetic energy lost is $\Delta K = \tfrac12\mu(1-e^2)(u_1-u_2)^2$ with $\mu = m_1m_2/(m_1+m_2)$.`,
      idea: String.raw`During the brief impact the contact forces are internal and huge, so external forces are negligible and momentum is conserved (2.2). Momentum alone leaves one unknown; $e$ supplies it. In the centre-of-mass frame (2.5) both bodies simply reverse with their speeds scaled by $e$, so the energy there is multiplied by $e^2$ while $\tfrac12MV^2$ is untouched — giving the loss formula. Here the bumper is simulated as a spring with a damper tuned to $e$, and $e$ is then *measured* from the outgoing velocities.`,
      caption: String.raw`Two carts collide through a damped bumper. Slide $e$ from perfectly inelastic to elastic and change the masses: the green total momentum is flat through every collision, while the total kinetic energy steps down unless $e = 1$. Turn on track friction — an external force — and the momentum line starts to sag.`,
      scope: String.raw`Holds for short impacts in which external forces are negligible during contact. Real $e$ depends somewhat on impact speed and on the bodies' shapes, rotation and vibration.`,
      deps: ['mech-2.2', 'mech-2.5'],
      refs: ['Taylor §3.1'],
      tags: ['collisions', 'momentum', 'energy'],
      viz(v) {
        const M = v.M;
        const es = v.slider('restitution $e$', 0, 1, 0.6, { step: 0.01 });
        const m1s = v.slider('$m_1$ (kg)', 0.5, 4, 1, { step: 0.1 });
        const m2s = v.slider('$m_2$ (kg)', 0.5, 4, 2, { step: 0.1 });
        const u2s = v.slider('$u_2$ (m/s)', -2, 1, -0.5, { step: 0.05 });
        const fr = v.toggle('track friction', false);
        const sT = v.stage({ x: [-6, 6], y: [-0.45, 1.25], height: 150, axes: false, full: true });
        const sP = v.stage({ x: [0, 4.5], y: [-2, 3], height: 200, axes: 'box', xlabel: 't (s)', title: 'momentum (kg·m/s)' });
        const sK = v.stage({ x: [0, 4.5], y: [0, 3], height: 200, axes: 'box', xlabel: 't (s)', title: 'kinetic energy (J)' });
        const W = 0.8, KS = 4000, U1 = 2, T = 4.5, MU = 0.03, g = 9.81;
        const cache = memo(); let cur = null;
        const build = () => cache([es.value, m1s.value, m2s.value, u2s.value, fr.value].join('|'), () => {
          const m = [m1s.value, m2s.value], e = Math.max(es.value, 1e-9), le = Math.log(e);
          const zeta = -le / Math.sqrt(Math.PI ** 2 + le * le), mu = (m[0] * m[1]) / (m[0] + m[1]), c = 2 * zeta * Math.sqrt(KS * mu);
          const fric = fr.value;
          const force = (X, V, t, F) => {
            const d = X[0][0] - X[1][0] + W;
            if (d > 0) { const f = KS * d + c * (V[0][0] - V[1][0]); F[0][0] -= f; F[1][0] += f; }
            if (fric) for (let i = 0; i < 2; i++) F[i][0] -= MU * m[i] * g * Math.tanh(V[i][0] / 0.02);
          };
          let inC = false, vin = null, vout = null, tc = null;
          const onStep = (X, V, t) => {
            const d = X[0][0] - X[1][0] + W;
            if (d > 0 && !inC && vin === null) { inC = true; vin = [V[0][0], V[1][0]]; tc = t; }
            if (d <= 0 && inC) { inC = false; vout = [V[0][0], V[1][0]]; }
          };
          const sim = nbody({ m, x: [[-3], [0.2]], v: [[U1], [u2s.value]], force, dt: 2e-4, T, every: 25, onStep });
          const ts = sim.t, p1 = sim.v.map((V) => m[0] * V[0][0]), p2 = sim.v.map((V) => m[1] * V[1][0]);
          const P = p1.map((p, k) => p + p2[k]), K = sim.v.map((V) => KE(m, V));
          const last = sim.v[sim.v.length - 1];
          if (vout === null && vin !== null) vout = [last[0][0], last[1][0]];
          return { m, sim, ts, p1, p2, P, K, K1: sim.v.map((V) => 0.5 * m[0] * V[0][0] ** 2), K2: sim.v.map((V) => 0.5 * m[1] * V[1][0] ** 2), vin, vout, tc, mu, pr: span([p1, p2, P, [0]], 0.12, 1), kr: [0, Math.max(...K) * 1.15] };
        });
        v.animate((t) => {
          const B = build(), f = at(B.sim, t), i = f.i, X = f.x.map((p) => p[0]), Vv = f.v.map((w) => w[0]);
          sT.hline(-0.17, { color: 'muted', width: 2.5 });
          if (fr.value) sT.hband(-0.45, -0.17, { color: 'orange', alpha: 0.18 });
          X.forEach((x, j) => {
            const col = COLS[j];
            sT.rect(x - W / 2, -0.07, x + W / 2, 0.42, { fill: col, fillAlpha: 0.3, color: col, width: 1.8 });
            sT.dot(x - 0.24, -0.11, { r: 5, color: 'ink' }); sT.dot(x + 0.24, -0.11, { r: 5, color: 'ink' });
            sT.tex(`m_${j + 1}`, x, 0.17, { align: 'center', baseline: 'middle', size: 14 });
            if (Math.abs(Vv[j]) > 0.01) sT.arrow(x, 0.72, x + 0.6 * Vv[j], 0.72, { color: col, width: 2.2 });
            sT.text(`${v.fix(Vv[j], 2)} m/s`, x, 1.05, { align: 'center', color: col, size: 12 });
          });
          if (X[0] - X[1] + W > 0) sT.corner('in contact: bumper compressed', 'tl', { color: 'orange', weight: 600 });
          sP.setView(null, B.pr); sK.setView(null, B.kr);
          sP.hline(0, { color: 'faint' });
          series(sP, B.ts, B.p1, i, { color: COLS[0], width: 1.4, alpha: 0.75 });
          series(sP, B.ts, B.p2, i, { color: COLS[1], width: 1.4, alpha: 0.75 });
          series(sP, B.ts, B.P, i, { color: 'green', width: 2.8 });
          series(sK, B.ts, B.K1, i, { color: COLS[0], width: 1.4, alpha: 0.75 });
          series(sK, B.ts, B.K2, i, { color: COLS[1], width: 1.4, alpha: 0.75 });
          series(sK, B.ts, B.K, i, { color: 'purple', width: 2.8 });
          sP.vline(f.t, { color: 'gold', alpha: 0.6 }); sK.vline(f.t, { color: 'gold', alpha: 0.6 });
          cur = { B, i };
          v.legend([[COLS[0], 'cart 1'], [COLS[1], 'cart 2'], ['green', 'total momentum'], ['purple', 'total kinetic energy']]);
        }, { period: T + 0.8, still: 3.2 });
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, u = [U1, u2s.value], rel = u[0] - u[1];
          const em = B.vout && B.vin ? (B.vout[1] - B.vout[0]) / (B.vin[0] - B.vin[1]) : NaN;
          const lossPred = 0.5 * B.mu * (1 - es.value ** 2) * rel * rel;
          let s = String.raw`measured $e = (v_2'-v_1')/(u_1-u_2) = ${v.fix(em, 3)}$ · total momentum: start ${v.fix(B.P[0], 3)}, now ${v.fix(B.P[i], 3)} kg·m/s`;
          if (!fr.value) s += String.raw` · energy lost so far ${v.fix(B.K[0] - B.K[i], 3)} J; predicted for the collision $\tfrac12\mu(1-e^2)(u_1-u_2)^2 = ${v.fix(lossPred, 3)}$ J`;
          else s += ' · friction is an external force, so momentum is no longer conserved';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Model',
      name: 'Rocket equation',
      credit: 'Tsiolkovsky, 1903 (anticipated by Moore, 1813)',
      statement: String.raw`A rocket that ejects propellant at speed $u$ relative to itself, with no external force, obeys $m\,\dot v = -u\,\dot m$. Integrating from mass $m_0$ to $m$,
$$v - v_0 = u\ln\frac{m_0}{m}.$$
The speed gained depends only on the exhaust speed and the mass ratio, not on how fast the fuel is burned. Dropping empty tanks (staging) raises the mass ratio each later stage sees; with gravity during a vertical burn of duration $t_b$, the gain falls short by about $g\,t_b$.`,
      idea: String.raw`Apply conservation of momentum (2.2) to the rocket plus the parcel $dm$ it ejects in time $dt$: $mv = (m-dm)(v+dv) + dm\,(v-u)$, so $m\,dv = u\,dm$ to first order, and $dv/dm_{\rm burnt} = u/m$ integrates to a logarithm. Each kilogram of fuel gives more speed when the rocket is light, so carrying empty tanks to the end is wasteful — staging throws them away. The simulation ejects small parcels one at a time with exact momentum bookkeeping.`,
      caption: String.raw`The left panel is the mass budget (tonnes) of a 100 t rocket: fuel (orange) burns down, payload (gold) stays. On the right, velocity is plotted against the mass ratio $m_0/m$ on a log axis, where $u\ln(m_0/m)$ is a straight line. The two-stage rocket jumps sideways when it drops its empty first tank (speed unchanged, mass ratio up) and ends faster. Turn on gravity to see the gravity loss.`,
      scope: String.raw`Holds with no external force on the rocket (no gravity or drag) and a constant exhaust speed relative to the rocket; non-relativistic speeds.`,
      deps: ['mech-2.2'],
      refs: ['Taylor §3.2'],
      tags: ['momentum', 'rockets'],
      viz(v) {
        const M = v.M;
        const us = v.slider('exhaust speed $u$ (km/s)', 1, 4.5, 3, { step: 0.05 });
        const fs = v.slider('fuel fraction at lift-off', 0.5, 0.88, 0.8, { step: 0.01 });
        const stg = v.toggle('compare two stages', true);
        const grav = v.toggle('gravity (vertical launch)', false);
        const sA = v.stage({ x: [-0.25, 2.65], y: [-9, 112], height: 340, axes: false, weight: 0.8, title: 'mass budget (t)' });
        const sB = v.stage({ x: [1, 16], y: [0, 8], xlog: true, height: 340, axes: 'box', weight: 1.3, ylabel: 'v (km/s)', title: 'speed against mass ratio $m_0/m$ (log scale)' });
        const M0 = 1e5, TB = 120, DT = 0.05, TT = 140, g = 9.81;
        const fly = (two) => {
          const u = us.value * 1000, F = fs.value * M0, tank = 0.1 * F, pay = M0 - F - tank, b = F / TB;
          let m = M0, vel = 0, h = 0, fuel1 = two ? F / 2 : F, fuel2 = two ? F / 2 : 0;
          const tank1 = two ? tank / 2 : tank, tank2 = two ? tank / 2 : 0;
          let dropped = false, Pex = 0, mex = 0, Pd = 0, md = 0, tDrop = null, ground = 0;
          const fr = [];
          for (let s = 0; s <= TT / DT; s++) {
            const t = s * DT;
            if (s % 10 === 0) fr.push({ t, m, v: vel, f1: fuel1, f2: fuel2, dropped, P: m * vel + Pex + Pd, Mall: m + mex + md, ground });
            let dm = 0;
            if (fuel1 > 0) { dm = Math.min(b * DT, fuel1); fuel1 -= dm; } else if (fuel2 > 0) { dm = Math.min(b * DT, fuel2); fuel2 -= dm; }
            if (dm > 0) { Pex += dm * (vel - u); mex += dm; vel += (u * dm) / (m - dm); m -= dm; }
            if (two && !dropped && fuel1 <= 1e-9) { dropped = true; tDrop = t; m -= tank1; Pd += tank1 * vel; md += tank1; }
            if (grav.value) { vel -= g * DT; Pex -= mex * g * DT; Pd -= md * g * DT; }
            h += vel * DT;
            if (grav.value && h <= 0 && vel < 0) { ground += -vel * m; h = 0; vel = 0; }
          }
          return { fr, pay, tank1, tank2, F, tDrop, u, mf: m };
        };
        const cache = memo(); let cur = null;
        const build = () => cache([us.value, fs.value, grav.value].join('|'), () => {
          const A = fly(false), Bt = fly(true);
          const xmax = Math.max(M0 / A.mf, M0 / Bt.mf) * 1.15;
          const vmax = Math.max(...A.fr.map((f) => f.v), ...Bt.fr.map((f) => f.v), (A.u * Math.log(xmax)) / 1.0) / 1000;
          return { A, Bt, xmax, vmax: vmax * 1.08 };
        });
        const drawRocket = (x, R, f, tNow, label) => {
          const w = 0.24, k = 1 / 1000; let y = 0;
          const burning = f.f1 + f.f2 > 1e-6;
          if (burning) sA.poly([[x - w * 0.55, 0], [x + w * 0.55, 0], [x, -1.2 * us.value - 1.2]], { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 1 });
          const block = (tank, fuel, col) => {
            if (tank <= 0) return;
            sA.rect(x - w, y, x + w, y + (tank + fuel) * k, { color: 'muted', width: 1.4, fill: 'faint', fillAlpha: 0.25 });
            if (fuel > 0) sA.rect(x - w, y, x + w, y + fuel * k, { fill: 'orange', fillAlpha: 0.55, stroke: false });
            y += (tank + fuel) * k;
          };
          if (!f.dropped) block(R.tank1, f.f1, 'orange');
          else if (R.tDrop !== null) { const dt = tNow - R.tDrop, yy = -dt * 6, xx = x - 0.32 - dt * 0.01; if (yy > -60) sA.rect(xx - w * 0.8, yy, xx + w * 0.8, yy + R.tank1 * k, { color: 'muted', width: 1, dash: [3, 3], alpha: Math.max(0.15, 1 - dt / 12) }); }
          block(R.tank2, f.f2, 'orange');
          sA.rect(x - w, y, x + w, y + R.pay * k, { fill: 'gold', fillAlpha: 0.6, color: 'gold', width: 1.4 });
          y += R.pay * k;
          sA.poly([[x - w, y], [x + w, y], [x, y + 4]], { fill: 'gold', fillAlpha: 0.6, color: 'gold', width: 1.2 });
          sA.text(label, x, 109, { align: 'center', color: 'ink', size: 12.5 });
          sA.text(`${v.fix(f.m / 1000, 1)} t`, x, y + 9, { align: 'center', color: 'muted', size: 11.5 });
          sA.text(`v = ${v.fix(f.v / 1000, 2)} km/s`, x, y + 16, { align: 'center', color: 'accent', size: 12 });
        };
        v.animate((t) => {
          const B = build(), tNow = M.clamp((t / 9) * TT, 0, TT), k = Math.min(B.A.fr.length - 1, Math.round(tNow / (DT * 10)));
          const fa = B.A.fr[k], fb = B.Bt.fr[k], two = stg.value;
          drawRocket(two ? 0.55 : 1.2, B.A, fa, tNow, 'one stage');
          if (two) drawRocket(1.85, B.Bt, fb, tNow, 'two stages');
          sA.text(`t = ${v.fix(tNow, 0)} s`, 2.6, -6, { align: 'right', color: 'muted', size: 12 });
          sB.setView([1, B.xmax], [0, B.vmax]);
          sB.fn((x) => (B.A.u * Math.log(x)) / 1000, { domain: [1, B.xmax], color: 'muted', dash: [6, 5], width: 1.6 });
          const pathOf = (R, kk) => R.fr.slice(0, kk + 1).map((f) => [M0 / f.m, f.v / 1000]);
          sB.path(pathOf(B.A, k), { color: 'accent', width: 2.8 });
          sB.dot(M0 / fa.m, fa.v / 1000, { r: 5, color: 'accent' });
          if (two) {
            sB.path(pathOf(B.Bt, k), { color: 'purple', width: 2.8 });
            sB.dot(M0 / fb.m, fb.v / 1000, { r: 5, color: 'purple' });
            if (fb.dropped) { const j = B.Bt.fr.findIndex((f) => f.dropped); const f0 = B.Bt.fr[j]; sB.text('tank dropped', M0 / f0.m, f0.v / 1000, { color: 'purple', size: 11.5, align: 'left', dx: 4, dy: 12 }); }
          }
          cur = { B, k, tNow };
          v.legend([['muted', '$u\\ln(m_0/m)$', { dash: true }], ['accent', 'one stage (simulated)'], ...(two ? [['purple', 'two stages (simulated)']] : [])]);
        }, { period: 10.5, still: 9.5 });
        v.readout(() => {
          if (!cur) return '';
          const { B, k } = cur, A = B.A, Bt = B.Bt, u = A.u, fa = A.fr[k], fb = Bt.fr[k];
          const fA = u * Math.log(M0 / A.mf), m1a = M0 - Bt.F / 2;
          const fB = u * Math.log(M0 / m1a) + u * Math.log((m1a - Bt.tank1) / Bt.mf);
          const last = A.fr.length - 1;
          let s = String.raw`one stage: final $\Delta v$ = ${M.si(A.fr[last].v, 'm/s', 4)} simulated, $u\ln(m_0/m_f)$ = ${M.si(fA, 'm/s', 4)}`;
          if (stg.value) s += String.raw` · two stages: ${M.si(Bt.fr[last].v, 'm/s', 4)} simulated, sum of the stage formulas ${M.si(fB, 'm/s', 4)}`;
          if (!grav.value) s += String.raw` · total momentum of rocket + exhaust + dropped tank now: ${v.fix(fa.P, 3)} kg·m/s`;
          else s += String.raw` · gravity is external: one stage now at ${M.si(fa.v, 'm/s', 3)} against $u\ln(m_0/m)$ = ${M.si(u * Math.log(M0 / fa.m), 'm/s', 3)}; gravity loss so far $\le g\,t$ = ${M.si(g * cur.tNow, 'm/s', 3)}`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Definition',
      name: 'Angular momentum and torque',
      statement: String.raw`The **angular momentum** about a chosen origin $O$ of a particle at position $\mathbf r$ (measured from $O$) with momentum $\mathbf p$ is
$$\mathbf L = \mathbf r\times\mathbf p ,$$
and the **torque** about $O$ of a force $\mathbf F$ acting at $\mathbf r$ is $\boldsymbol\tau = \mathbf r\times\mathbf F$. Both depend on the choice of origin. For motion in a plane, $\mathbf L$ is perpendicular to it, with $|\mathbf L| = m\,r^2\dot\phi = p\,d$ where $d$ is the perpendicular distance from $O$ to the line of motion (the lever arm); $|\mathbf L|/2m$ is the rate at which $\mathbf r$ sweeps out area.`,
      idea: String.raw`In polar coordinates (1.2) only the transverse velocity $r\dot\phi$ contributes to $\mathbf r\times\mathbf v$, and the triangle swept in time $dt$ has area $\tfrac12 r\cdot r\,d\phi$, so $dA/dt = L/2m$. For a free particle, $\mathbf p$ is constant and the line of motion is fixed, so $p\,d$ — and hence $\mathbf L$ — is constant: equal areas in equal times along a straight line. Moving $O$ changes $d$, so the value changes, but it stays constant in time.`,
      caption: String.raw`A free particle moves along a straight line. Every 0.8 s the radius vector from $O$ sweeps a triangle; all have the same area $L\,\Delta t/2m$. Drag $O$, the start point or the velocity tip $v$: the value of $L$ changes with the origin and the lever arm $d$, but never with time. The 3D view shows $\mathbf L$ as a fixed vector perpendicular to the plane.`,
      deps: ['mech-2.1', 'mech-1.2'],
      refs: ['Taylor §3.4'],
      tags: ['angular momentum', 'torque'],
      viz(v) {
        const M = v.M;
        const sP = v.stage({ x: [-5, 5], y: [-3.6, 3.6], equal: true, height: 330, title: 'free particle, $m = 1$ kg' });
        const S3 = v.stage({ x: [-2, 2], y: [-1.8, 2.2], equal: true, axes: false, height: 330, title: '$\\mathbf L = \\mathbf r\\times\\mathbf p$ in 3D' });
        const sc = v.scene3(S3, { yaw: -0.75, pitch: 0.5, axis: 1.5, lim: 1.6 });
        const O = sP.handle(0, 0.9, { color: 'red', label: 'O', labelPos: 'n' });
        const A = sP.handle(-4.2, -2.6, { color: 'accent', label: 'start', labelPos: 'se' });
        const Wt = sP.handle(-3.2, -2.2, { color: 'orange', label: 'v', labelPos: 'n' });
        let ax = A.x, ay = A.y;
        A.onDrag = () => { Wt.set(Wt.x + A.x - ax, Wt.y + A.y - ay); ax = A.x; ay = A.y; };
        const DT = 0.8, T = 8, K3 = 0.3; let cur = null;
        v.animate((t) => {
          const tt = Math.min(t, T), o = [O.x, O.y], a = [A.x, A.y], w = [Wt.x - A.x, Wt.y - A.y];
          const r = (s) => [a[0] + w[0] * s, a[1] + w[1] * s];
          const wl = Math.hypot(w[0], w[1]) || 1e-9, ud = [w[0] / wl, w[1] / wl];
          sP.line(...r(-6), ...r(16), { color: 'faint', dash: [5, 5] });
          const nk = Math.floor(tt / DT + 1e-9);
          for (let k = 0; k < nk; k++) { const col = k % 2 ? 'teal' : 'accent'; sP.poly([o, r(k * DT), r((k + 1) * DT)], { fill: col, fillAlpha: 0.22, color: col, width: 1, alpha: 0.6 }); }
          if (tt > nk * DT) sP.poly([o, r(nk * DT), r(tt)], { fill: 'gold', fillAlpha: 0.25, stroke: false });
          const s0 = (o[0] - a[0]) * ud[0] + (o[1] - a[1]) * ud[1], foot = r(s0 / wl), d = Math.hypot(foot[0] - o[0], foot[1] - o[1]);
          sP.line(o[0], o[1], foot[0], foot[1], { color: 'orange', width: 1.8, dash: [4, 3] });
          sP.tex('d', (o[0] + foot[0]) / 2, (o[1] + foot[1]) / 2, { color: 'orange', dx: 6, dy: -4, baseline: 'bottom' });
          const p = r(tt);
          sP.arrow(o[0], o[1], p[0], p[1], { color: 'ink', width: 1.6 });
          sP.arrow(a[0], a[1], Wt.x, Wt.y, { color: 'orange', width: 2, alpha: 0.6 });
          sP.arrow(p[0], p[1], p[0] + w[0], p[1] + w[1], { color: 'orange', width: 2.4 });
          sP.dot(p[0], p[1], { r: 7, color: 'accent' });
          const L = crossZ([p[0] - o[0], p[1] - o[1]], w), L0 = crossZ([a[0] - o[0], a[1] - o[1]], w);
          const last = nk > 0 ? Math.abs(crossZ([r((nk - 1) * DT)[0] - o[0], r((nk - 1) * DT)[1] - o[1]], [r(nk * DT)[0] - o[0], r(nk * DT)[1] - o[1]])) / 2 : null;
          // 3D
          const R3 = (q) => [(q[0] - o[0]) * K3, (q[1] - o[1]) * K3, 0];
          sc.begin();
          sc.disc([1, 0, 0], [0, 1, 0], 1.4, { fill: 'faint', fillAlpha: 0.08, color: 'faint', grid: true });
          sc.line(R3(r(-2)), R3(r(10)), { color: 'faint', dash: true });
          const Lh = M.clamp(L * 0.28, -1.6, 1.6);
          sc.arrow([0, 0, 0], R3(p), { color: 'ink', width: 2 });
          sc.arrow(R3(p), R3([p[0] + w[0], p[1] + w[1]]), { color: 'orange' });
          sc.dot(R3(p), { r: 5.5, color: 'accent' });
          if (Math.abs(Lh) > 0.02) sc.arrow([0, 0, 0], [0, 0, Lh], { color: 'green', width: 3 });
          sc.tex(String.raw`\mathbf L`, [0, 0, Lh], { color: 'green', dx: 8, dy: -6 });
          sc.flush();
          cur = { L, L0, d, sp: wl, tt, last };
          v.legend([['accent', 'equal-time triangles', { area: true }], ['orange', 'velocity, lever arm $d$'], ['green', '$\\mathbf L$']]);
        }, { period: T + 1.2, still: 5.4 });
        v.readout(() => {
          if (!cur) return '';
          const c = cur;
          return String.raw`$L_z = (\mathbf r\times m\mathbf v)_z = ${v.fix(c.L, 4)}$ kg·m²/s at $t = ${v.fix(c.tt, 1)}$ s (it was ${v.fix(c.L0, 4)} at $t = 0$) · $m|\mathbf v|\,d = ${v.fix(c.sp * c.d, 4)}$` +
            (c.last !== null ? String.raw` · last triangle: ${v.fix(c.last, 4)} m², and $|L|\Delta t/2m = ${v.fix((Math.abs(c.L) * DT) / 2, 4)}$ m²` : '') + String.raw` · no force, so the torque $\mathbf r\times\mathbf F$ is $0$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Torque changes angular momentum',
      statement: String.raw`For a particle moving under a net force $\mathbf F$, the angular momentum about any fixed point $O$ obeys
$$\frac{d\mathbf L}{dt} = \boldsymbol\tau = \mathbf r\times\mathbf F .$$
In particular $\mathbf L$ is constant whenever the torque about $O$ vanishes, i.e. whenever the force is zero or its line of action passes through $O$.`,
      idea: String.raw`Differentiate $\mathbf L = \mathbf r\times m\dot{\mathbf r}$ by the product rule: $\dot{\mathbf L} = \dot{\mathbf r}\times m\dot{\mathbf r} + \mathbf r\times m\ddot{\mathbf r}$. The first term is zero (a vector crossed with itself) and Newton's second law (1.6) turns the second into $\mathbf r\times\mathbf F$. Only the component of the force perpendicular to $\mathbf r$, times the distance, matters — the force times its lever arm.`,
      caption: String.raw`The force on the particle is drawn with its line of action and lever arm $d$ from $O$. The right panel plots the simulated $L(t)$ (blue), the running integral of the torque $\int\tau\,dt$ (dashed orange, it lies on top), $\tau(t)$ itself (gold), and the tangent to $L$ with slope $\tau$ (green). Switch the force to *toward O*: the lever arm is zero and $L$ goes flat.`,
      deps: ['mech-2.8', 'mech-1.6'],
      refs: ['Taylor §3.4', 'Goldstein §1.2'],
      tags: ['angular momentum', 'torque'],
      viz(v) {
        const M = v.M;
        const mode = v.select('force', [{ value: 'const', label: 'constant' }, { value: 'central', label: 'toward O' }, { value: 'tang', label: 'sideways' }], 'const');
        const F0 = v.slider('$|\\mathbf F|$ (N)', 0, 0.6, 0.25, { step: 0.01 });
        const al = v.slider('direction of $\\mathbf F$ (°)', -180, 180, -150, { step: 1 });
        const s = v.stage({ x: [-7, 7], y: [-5, 5], equal: true, height: 330, title: 'particle, $m = 1$ kg' });
        const sL = v.stage({ x: [0, 8], y: [-3, 3], axes: 'box', height: 330, xlabel: 't (s)', title: 'angular momentum about O (kg·m²/s)' });
        const r0 = [2.5, -1.5], v0 = [-0.1, 0.7], T = 8;
        const Fof = (x) => {
          const f = F0.value;
          if (mode.value === 'const') { const a = (al.value * Math.PI) / 180; return [f * Math.cos(a), f * Math.sin(a)]; }
          const r = Math.hypot(x[0], x[1]) || 1;
          return mode.value === 'central' ? [(-f * x[0]) / r, (-f * x[1]) / r] : [(-f * x[1]) / r, (f * x[0]) / r];
        };
        const cache = memo(); let cur = null;
        const build = () => cache([mode.value, F0.value, al.value].join('|'), () => {
          const sim = nbody({ m: [1], x: [r0], v: [v0], force: (X, V, t, F) => { const f = Fof(X[0]); F[0][0] += f[0]; F[0][1] += f[1]; }, dt: 0.002, T, every: 10 });
          const L = sim.x.map((X, k) => crossZ(X[0], sim.v[k][0])), tq = sim.x.map((X) => crossZ(X[0], Fof(X[0])));
          const I = [L[0]]; for (let k = 1; k < L.length; k++) I.push(I[k - 1] + (0.5 * sim.dt * (tq[k] + tq[k - 1])));
          let x0 = -3, x1 = 3, y0 = -3, y1 = 3;
          sim.x.forEach((X) => { x0 = Math.min(x0, X[0][0]); x1 = Math.max(x1, X[0][0]); y0 = Math.min(y0, X[0][1]); y1 = Math.max(y1, X[0][1]); });
          return { sim, L, tq, I, view: [[x0 - 1, x1 + 1], [y0 - 1, y1 + 1]], lr: span([L, I, tq, [0]], 0.12, 1) };
        });
        v.animate((t) => {
          al.el.hidden = mode.value !== 'const';
          const B = build(), f = at(B.sim, t), i = f.i, p = f.x[0], F = Fof(p), Fl = Math.hypot(F[0], F[1]);
          s.setView(...B.view); sL.setView([0, T], B.lr);
          s.path(B.sim.x.map((X) => X[0]), { color: 'accent', width: 1.2, alpha: 0.25 });
          s.path(B.sim.x.slice(0, i + 1).map((X) => X[0]), { color: 'accent', width: 2.2 });
          s.arrow(0, 0, p[0], p[1], { color: 'muted', width: 1.4 });
          if (Fl > 1e-6) {
            const u = [F[0] / Fl, F[1] / Fl], sp = -(p[0] * u[0] + p[1] * u[1]), foot = [p[0] + sp * u[0], p[1] + sp * u[1]];
            s.line(p[0] - 30 * u[0], p[1] - 30 * u[1], p[0] + 30 * u[0], p[1] + 30 * u[1], { color: 'orange', dash: [5, 5], alpha: 0.6 });
            if (Math.hypot(...foot) > 0.05) { s.line(0, 0, foot[0], foot[1], { color: 'green', width: 2.2 }); s.tex('d', foot[0] / 2, foot[1] / 2, { color: 'green', dx: 6, dy: -4, baseline: 'bottom' }); }
            const sc = 4;
            s.arrow(p[0], p[1], p[0] + sc * F[0], p[1] + sc * F[1], { color: 'orange', width: 3 });
            s.tex(String.raw`\mathbf F`, p[0] + sc * F[0], p[1] + sc * F[1], { color: 'orange', dx: 6, dy: -6 });
          }
          s.dot(0, 0, { r: 5, color: 'red', label: 'O', labelPos: 'sw' });
          s.dot(p[0], p[1], { r: 7, color: 'accent' });
          sL.hline(0, { color: 'faint' });
          series(sL, B.sim.t, B.tq, i, { color: 'gold', width: 1.5 });
          series(sL, B.sim.t, B.L, i, { color: 'blue', width: 3 });
          series(sL, B.sim.t, B.I, i, { color: 'orange', width: 1.6, dash: [6, 5] });
          const ti = B.sim.t[i], Li = B.L[i], tqi = B.tq[i];
          sL.line(ti - 0.9, Li - 0.9 * tqi, ti + 0.9, Li + 0.9 * tqi, { color: 'green', width: 2 });
          sL.dot(ti, Li, { r: 4.5, color: 'blue' });
          cur = { B, i };
          v.legend([['blue', '$L(t)$ simulated'], ['orange', '$L(0)+\\int_0^t\\tau\\,dt$', { dash: true }], ['gold', 'torque $\\tau(t)$ (N·m)'], ['green', 'slope $\\tau$']]);
        }, { period: T + 1, still: 5 });
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, n = B.L.length - 1, j = M.clamp(i, 1, n - 1);
          const dL = (B.L[j + 1] - B.L[j - 1]) / (2 * B.sim.dt);
          return String.raw`at $t = ${v.fix(B.sim.t[j], 2)}$ s: $dL/dt = ${v.fix(dL, 4)}$ (finite difference of the simulated $L$), torque $\tau = (\mathbf r\times\mathbf F)_z = ${v.fix(B.tq[j], 4)}$ N·m · $L(t) - L(0) = ${v.fix(B.L[i] - B.L[0], 4)}$, $\int_0^t\tau\,dt = ${v.fix(B.I[i] - B.I[0], 4)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Central forces conserve angular momentum',
      credit: 'Kepler, 1609 (area law); Newton, 1687',
      statement: String.raw`If the force on a particle always points along the line through a fixed centre $O$ (a **central force**, $\mathbf F = f\,\hat{\mathbf r}$ with $f$ arbitrary — it may even depend on time or speed), then its angular momentum $\mathbf L$ about $O$ is constant. Consequently the motion stays in the fixed plane through $O$ perpendicular to $\mathbf L$ (if $\mathbf L\ne0$), and the radius vector sweeps equal areas in equal times; in particular $r\,v_\perp = |\mathbf L|/m$ is constant, so the particle speeds up transversally as $r$ shrinks.`,
      idea: String.raw`The torque $\mathbf r\times f\hat{\mathbf r}$ vanishes, so $\dot{\mathbf L} = 0$ by 2.9. Since $\mathbf r\cdot\mathbf L = \mathbf r\cdot(\mathbf r\times m\mathbf v) = 0$, the position is always perpendicular to the fixed vector $\mathbf L$: planar motion. The area rate $|\mathbf L|/2m$ (2.8) is constant — Kepler's second law, valid for every central force, not only gravity. A string reeled in through a hole pulls centrally however fast it is reeled.`,
      caption: String.raw`A ball on a string tied to $O$ is set moving with the orange initial velocity (drag its tip in 3D; drag the background to rotate) while the string is reeled in. The orbit stays on the green plane and $\mathbf L$ never moves, while $r$ shrinks and the speed grows; on the right $|\mathbf L|$ stays flat. Add uniform gravity or air drag — non-central forces — and the plane tilts or $|\mathbf L|$ decays.`,
      deps: ['mech-2.9'],
      refs: ['Taylor §3.4', 'Arnold §7'],
      tags: ['angular momentum', 'central forces'],
      viz(v) {
        const M = v.M;
        const reel = v.slider('reel-in speed (m/s)', 0, 0.12, 0.07, { step: 0.005 });
        const ext = v.select('extra force', [{ value: 'none', label: 'none' }, { value: 'grav', label: 'uniform gravity' }, { value: 'drag', label: 'air drag' }], 'none');
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: false, height: 360, title: 'orbit in 3D (drag the background to rotate)' });
        const sP = v.stage({ x: [0, 12], y: [0, 3], axes: 'box', height: 360, xlabel: 't (s)' });
        const sc = v.scene3(S, { yaw: -0.55, pitch: 0.42, axis: 1.8, lim: 2.4, hint: false });
        const r0 = [1.5, 0, 0];
        const hv = sc.handle([1.5, 0.95, 0.45], { color: 'orange', label: 'v₀' });
        const T = 12, DT = 5e-4, KS = 3000;
        const cache = memo(); let cur = null;
        const build = () => cache([reel.value, ext.value, ...hv.p.map((c) => c.toFixed(3))].join('|'), () => {
          const v0 = [hv.p[0] - r0[0], hv.p[1] - r0[1], hv.p[2] - r0[2]], c = reel.value, md = ext.value;
          const force = (X, V, t, F) => {
            const p = X[0], r = Math.hypot(p[0], p[1], p[2]), ell = Math.max(0.35, 1.5 - c * t);
            if (r > ell) { const f = (-KS * (r - ell)) / r; F[0][0] += f * p[0]; F[0][1] += f * p[1]; F[0][2] += f * p[2]; }
            if (md === 'grav') F[0][2] -= 0.6;
            if (md === 'drag') for (let k = 0; k < 3; k++) F[0][k] -= 0.12 * V[0][k];
          };
          const sim = nbody({ m: [1], x: [r0], v: [v0], force, dt: DT, T, every: 40 });
          const L = sim.x.map((X, k) => cross3(X[0], sim.v[k][0])), Lm = L.map((l) => Math.hypot(...l));
          const n0 = Lm[0] > 1e-9 ? L[0].map((c2) => c2 / Lm[0]) : [0, 0, 1];
          const r = sim.x.map((X) => Math.hypot(...X[0])), sp = sim.v.map((V) => Math.hypot(...V[0]));
          const off = sim.x.map((X) => Math.abs(X[0][0] * n0[0] + X[0][1] * n0[1] + X[0][2] * n0[2]));
          return { sim, L, Lm, n0, r, sp, off, yr: [0, Math.max(...Lm, ...r, ...sp) * 1.1] };
        });
        v.animate((t) => {
          const B = build(), f = at(B.sim, t), i = f.i, p = f.x[0], w = f.v[0];
          const n0 = B.n0, a0 = M.normalize(Math.abs(n0[2]) < 0.9 ? cross3(n0, [0, 0, 1]) : cross3(n0, [1, 0, 0])), b0 = cross3(n0, a0);
          sc.begin();
          sc.disc(a0, b0, 1.7, { fill: 'green', fillAlpha: 0.08, color: 'green', grid: true });
          sc.path(B.sim.x.slice(Math.max(0, i - 450), i + 1).map((X) => X[0]), { color: 'accent', width: 1.6 });
          sc.line([0, 0, 0], p, { color: 'muted', width: 1.4 }, 4);
          sc.arrow(r0, hv.p, { color: 'orange', width: 2, alpha: 0.7 });
          sc.arrow(p, [p[0] + 0.6 * w[0], p[1] + 0.6 * w[1], p[2] + 0.6 * w[2]], { color: 'blue', width: 2 });
          sc.dot(p, { r: 6, color: 'accent' });
          sc.dot([0, 0, 0], { r: 4, color: 'ink' });
          const L = B.L[i], Ls = 0.9 / Math.max(B.Lm[0], 1e-9);
          sc.arrow([0, 0, 0], L.map((c) => c * Ls), { color: 'green', width: 3 });
          sc.tex(String.raw`\mathbf L`, L.map((c) => c * Ls), { color: 'green', dx: 7, dy: -6 });
          sc.flush();
          sP.setView([0, T], B.yr);
          series(sP, B.sim.t, B.r, i, { color: 'orange', width: 2 });
          series(sP, B.sim.t, B.sp, i, { color: 'blue', width: 2 });
          series(sP, B.sim.t, B.Lm, i, { color: 'green', width: 3 });
          cur = { B, i };
          v.legend([['green', '$|\\mathbf L|$ (kg·m²/s)'], ['orange', 'string length $r$ (m)'], ['blue', 'speed $v$ (m/s)']]);
        }, { period: T + 1, still: 8 });
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, L = B.L[i], tilt = (Math.acos(M.clamp((L[0] * B.n0[0] + L[1] * B.n0[1] + L[2] * B.n0[2]) / Math.max(B.Lm[i], 1e-12), -1, 1)) * 180) / Math.PI;
          const offMax = Math.max(...B.off.slice(0, i + 1));
          return String.raw`$|\mathbf L| = ${v.fix(B.Lm[i], 4)}$ (start ${v.fix(B.Lm[0], 4)}) kg·m²/s · tilt of $\mathbf L$ from its start: ${v.fix(tilt, 3)}° · farthest the ball has been from the starting plane: ${v.fix(offMax, 4)} m · now $r = ${v.fix(B.r[i], 3)}$ m, $v = ${v.fix(B.sp[i], 3)}$ m/s`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'Internal torques cancel in a system',
      statement: String.raw`For a system of particles, the total angular momentum $\mathbf L = \sum_i \mathbf r_i\times\mathbf p_i$ about a fixed origin satisfies
$$\frac{d\mathbf L}{dt} = \boldsymbol\tau_{\rm ext} = \sum_i \mathbf r_i\times\mathbf F_i^{\rm ext},$$
provided the internal forces obey the **strong** form of the third law: $\mathbf F_{ij} = -\mathbf F_{ji}$ *and* both act along the line joining the particles. Then the total angular momentum of an isolated system is conserved. The weak form (equal and opposite only) is enough for momentum but not for angular momentum.`,
      idea: String.raw`Summing 2.9 over the particles, the internal torques come in pairs $\mathbf r_i\times\mathbf F_{ij} + \mathbf r_j\times\mathbf F_{ji} = (\mathbf r_i-\mathbf r_j)\times\mathbf F_{ij}$. This vanishes exactly when $\mathbf F_{ij}$ is parallel to $\mathbf r_i - \mathbf r_j$ — central pair forces. Otherwise the two forces have parallel but distinct lines of action and form a couple, which spins the system up although the total momentum is still conserved (the forces still cancel).`,
      caption: String.raw`Four masses are joined by springs. The highlighted pair shows its two forces and their lines of action. With central forces the lines coincide and the total $L_z$ (blue) stays flat. Switch to non-central pair forces that are still equal and opposite: the lines of action separate into a couple, $L_z$ drifts exactly as the integrated couples predict (dashed), while both components of $\mathbf P$ stay at zero.`,
      deps: ['mech-2.9', 'mech-1.7'],
      refs: ['Taylor §3.5', 'Goldstein §1.2'],
      tags: ['angular momentum', 'third law'],
      viz(v) {
        const M = v.M;
        const mode = v.select('pair forces', [{ value: 'central', label: 'central (strong third law)' }, { value: 'skew', label: 'non-central (weak law only)' }], 'central');
        const ss = v.slider('sideways part $s$ (N)', 0.05, 0.6, 0.25, { step: 0.01 });
        const sA = v.stage({ x: [-3.2, 3.2], y: [-2.7, 2.7], equal: true, axes: false, height: 320, title: 'pair forces and lines of action' });
        const sB = v.stage({ x: [0, 12], y: [-2, 4], axes: 'box', height: 320, xlabel: 't (s)', title: 'totals' });
        const m = [1, 2, 1.5, 1], T = 12, KS = 4;
        const X0 = [[-1.4, -0.9], [1.3, -1], [1.1, 1.1], [-1.2, 0.9]];
        let V0 = [[0.3, -0.5], [-0.1, 0.35], [-0.4, 0.2], [0.5, -0.2]];
        const C0 = cmOf(m, X0), Vc = cmOf(m, V0);
        const X0c = X0.map((p) => [p[0] - C0[0], p[1] - C0[1]]); V0 = V0.map((w) => [w[0] - Vc[0], w[1] - Vc[1]]);
        const pairs = []; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) pairs.push([i, j, 0.85 * Math.hypot(X0c[j][0] - X0c[i][0], X0c[j][1] - X0c[i][1])]);
        const pairF = (X, i, j, L0, s) => {
          const dx = X[j][0] - X[i][0], dy = X[j][1] - X[i][1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, fc = KS * (d - L0);
          return [fc * ux - s * uy, fc * uy + s * ux]; // force on i from j; on j it is the negative
        };
        const cache = memo(); let cur = null;
        const build = () => cache(mode.value + ss.value, () => {
          const s = mode.value === 'skew' ? ss.value : 0;
          const force = (X, V, t, F) => { for (const [i, j, L0] of pairs) { const f = pairF(X, i, j, L0, s); F[i][0] += f[0]; F[i][1] += f[1]; F[j][0] -= f[0]; F[j][1] -= f[1]; } };
          const sim = nbody({ m, x: X0c, v: V0, force, dt: 0.002, T, every: 10 });
          const L = sim.x.map((X, k) => Lz(m, X, sim.v[k])), P = sim.v.map((V) => sumP(m, V));
          const cpl = sim.x.map((X) => pairs.reduce((acc, [i, j, L0]) => acc + crossZ([X[i][0] - X[j][0], X[i][1] - X[j][1]], pairF(X, i, j, L0, s)), 0));
          const I = [L[0]]; for (let k = 1; k < L.length; k++) I.push(I[k - 1] + 0.5 * sim.dt * (cpl[k] + cpl[k - 1]));
          return { sim, L, P, I, Px: P.map((p) => p[0]), Py: P.map((p) => p[1]), yr: span([L, I, [0]], 0.15, 1.5), s };
        });
        v.animate((t) => {
          ss.el.hidden = mode.value !== 'skew';
          const B = build(), f = at(B.sim, t), X = f.x, i = f.i;
          for (const [a, b] of pairs) sA.line(X[a][0], X[a][1], X[b][0], X[b][1], { color: 'muted', width: a === 0 && b === 1 ? 2.2 : 1.2, alpha: a === 0 && b === 1 ? 0.9 : 0.45 });
          X.forEach((p, j) => body(sA, p, 0.16 + 0.07 * m[j], COLS[j]));
          const F01 = pairF(X, 0, 1, pairs[0][2], B.s), Fl = Math.hypot(F01[0], F01[1]);
          if (Fl > 1e-6) {
            const u = [F01[0] / Fl, F01[1] / Fl], sc = 1.4 / Math.max(Fl, 0.6);
            for (const [k, sg] of [[0, 1], [1, -1]]) {
              const p = X[k];
              sA.line(p[0] - 9 * u[0], p[1] - 9 * u[1], p[0] + 9 * u[0], p[1] + 9 * u[1], { color: COLS[k], dash: [5, 5], alpha: 0.7 });
              sA.arrow(p[0], p[1], p[0] + sg * sc * F01[0], p[1] + sg * sc * F01[1], { color: COLS[k], width: 3 });
            }
            const arm = Math.abs(crossZ([X[1][0] - X[0][0], X[1][1] - X[0][1]], u));
            sA.corner(arm < 1e-3 ? 'lines of action coincide: no couple' : `parallel lines ${v.fix(arm, 2)} m apart: a couple`, 'tl', { color: arm < 1e-3 ? 'green' : 'red', weight: 600 });
          }
          sB.setView([0, T], B.yr);
          sB.hline(0, { color: 'faint' });
          series(sB, B.sim.t, B.Px, i, { color: 'green', width: 2 });
          series(sB, B.sim.t, B.Py, i, { color: 'teal', width: 2, dash: [3, 3] });
          series(sB, B.sim.t, B.L, i, { color: 'blue', width: 3 });
          series(sB, B.sim.t, B.I, i, { color: 'orange', width: 1.6, dash: [6, 5] });
          cur = { B, i };
          v.legend([['blue', '$L_z$ (kg·m²/s)'], ['orange', '$L_z(0)+\\int\\sum$ couples', { dash: true }], ['green', '$P_x$'], ['teal', '$P_y$', { dash: true }]]);
        }, { period: T + 1, still: 9 });
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, dP = Math.hypot(B.P[i][0] - B.P[0][0], B.P[i][1] - B.P[0][1]);
          return String.raw`$|\mathbf P(t)-\mathbf P(0)| = ${fmtSci(v, dP)}$ kg·m/s (momentum is conserved either way) · $L_z(t)-L_z(0) = ${v.fix(B.L[i] - B.L[0], 4)}$ · integrated pair torques $\int\sum_{i<j}(\mathbf r_i-\mathbf r_j)\times\mathbf F_{ij}\,dt = ${v.fix(B.I[i] - B.I[0], 4)}$ kg·m²/s`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'Orbital plus spin angular momentum',
      statement: String.raw`Write $\mathbf r_i = \mathbf R + \mathbf r_i'$ and $\mathbf v_i = \mathbf V + \mathbf v_i'$ with $\mathbf R, \mathbf V$ the position and velocity of the centre of mass. Then the total angular momentum about a fixed origin splits as
$$\mathbf L = \underbrace{\mathbf R\times M\mathbf V}_{\text{orbital}} + \underbrace{\sum_i \mathbf r_i'\times m_i\mathbf v_i'}_{\text{spin about the CM}} .$$
Moreover the spin obeys $d\mathbf L_{\rm spin}/dt = \boldsymbol\tau_{\rm ext}'$, the external torque about the centre of mass — even though the centre of mass may accelerate. In uniform gravity that torque is zero, so the spin is constant while the orbital part changes at the rate $\mathbf R\times M\mathbf g$.`,
      idea: String.raw`Expand $\sum m_i(\mathbf R+\mathbf r_i')\times(\mathbf V+\mathbf v_i')$: the cross terms contain $\sum m_i\mathbf r_i' = 0$ and $\sum m_i\mathbf v_i' = 0$ (definition of the centre of mass, 2.3) and drop out. Differentiating the spin part, the fictitious force $-m_i\ddot{\mathbf R}$ of the accelerating CM frame has total torque $-(\sum m_i\mathbf r_i')\times\ddot{\mathbf R} = 0$, and internal torques cancel (2.11). Uniform gravity acts at the centre of mass, so it exerts no torque about it.`,
      caption: String.raw`A spinning dumbbell is thrown. The bars split its angular momentum about $O$ into the orbital part $\mathbf R\times M\mathbf V$ (blue) and the spin about the centre of mass (purple); stacked, they always match the directly computed total $\sum m_i\mathbf r_i\times\mathbf v_i$ (green). With gravity the spin bar is frozen while the orbital bar moves; set $g = 0$ and everything is constant. Drag $O$ to change the orbital part.`,
      deps: ['mech-2.11', 'mech-2.3'],
      refs: ['Taylor §10.1', 'Goldstein §1.2'],
      tags: ['angular momentum', 'centre of mass'],
      viz(v) {
        const M = v.M;
        const m2s = v.slider('$m_2$ (kg)', 0.3, 3, 2, { step: 0.1 });
        const ws = v.slider('spin $\\omega$ (rad/s)', -15, 15, 9, { step: 0.5 });
        const gs = v.slider('$g$ (m/s²)', 0, 9.8, 9.8, { step: 0.1 });
        const s = v.stage({ x: [-1.3, 5.3], y: [-0.5, 8.6], equal: true, height: 360, title: 'thrown dumbbell ($m_1 = 1$ kg, rod 0.7 m)' });
        const sb = v.stage({ x: [0, 4], y: [-3, 3], axes: false, height: 360, weight: 0.8, title: 'angular momentum about O (kg·m²/s)' });
        const O = s.handle(0, 0, { color: 'red', label: 'O', labelPos: 'sw' });
        const T = 1.3, ELL = 0.7, KS = 2e4, Vc = [3, 5.5], R0 = [0, 1];
        const cache = memo(); let cur = null;
        const build = () => cache([m2s.value, ws.value, gs.value].join('|'), () => {
          const m = [1, m2s.value], Mt = m[0] + m[1], w = ws.value, g = gs.value;
          const rel = [[(m[1] / Mt) * ELL, 0], [(-m[0] / Mt) * ELL, 0]];
          const x = rel.map((r) => [R0[0] + r[0], R0[1] + r[1]]), vel = rel.map((r) => [Vc[0] - w * r[1], Vc[1] + w * r[0]]);
          const force = (X, V, t, F) => {
            const dx = X[1][0] - X[0][0], dy = X[1][1] - X[0][1], d = Math.hypot(dx, dy), f = (KS * (d - ELL)) / d;
            F[0][0] += f * dx; F[0][1] += f * dy; F[1][0] -= f * dx; F[1][1] -= f * dy;
            F[0][1] -= m[0] * g; F[1][1] -= m[1] * g;
          };
          const sim = nbody({ m, x, v: vel, force, dt: 1e-4, T, every: 50 });
          return { m, Mt, sim, cm: sim.x.map((X) => cmOf(m, X)), g };
        });
        const parts = (B, X, V, o) => {
          const R = cmOf(B.m, X), Vv = cmOf(B.m, V);
          const orb = B.Mt * crossZ([R[0] - o[0], R[1] - o[1]], Vv);
          const spin = X.reduce((acc, p, i) => acc + B.m[i] * crossZ([p[0] - R[0], p[1] - R[1]], [V[i][0] - Vv[0], V[i][1] - Vv[1]]), 0);
          return { R, orb, spin, tot: Lz(B.m, X, V, o) };
        };
        v.animate((t) => {
          const B = build(), tt = M.clamp(t * 0.26, 0, T), f = at(B.sim, tt), X = f.x, V = f.v, o = [O.x, O.y];
          const all = B.sim.x.map((Xk, k) => parts(B, Xk, B.sim.v[k], o)), pr = parts(B, X, V, o);
          s.hband(-5, 0, { color: 'faint', alpha: 0.25 });
          s.path(B.cm, { color: 'green', alpha: 0.25, width: 1.2, dash: [4, 4] });
          [0, 1].forEach((j) => s.path(B.sim.x.slice(0, f.i + 1).map((Xk) => Xk[j]), { color: COLS[j], width: 1.3, alpha: 0.6 }));
          s.path(B.cm.slice(0, f.i + 1), { color: 'green', width: 2 });
          s.line(X[0][0], X[0][1], X[1][0], X[1][1], { color: 'ink', width: 3 });
          X.forEach((p, j) => body(s, p, 0.1 + 0.06 * B.m[j], COLS[j]));
          s.arrow(o[0], o[1], pr.R[0], pr.R[1], { color: 'blue', width: 1.6, dash: [5, 4] });
          s.tex(String.raw`\mathbf R`, (o[0] + pr.R[0]) / 2, (o[1] + pr.R[1]) / 2, { color: 'blue', dx: -12, align: 'right' });
          s.dot(pr.R[0], pr.R[1], { r: 4, color: 'green' });
          // bars
          let lo = 0, hi = 0; all.forEach((q) => { for (const y of [q.orb, q.spin, q.tot, q.orb + q.spin, q.orb]) { lo = Math.min(lo, y); hi = Math.max(hi, y); } });
          const pad = (hi - lo) * 0.12 + 0.2; sb.setView([0, 4], [lo - pad, hi + pad]);
          sb.hline(0, { color: 'muted' });
          const bar = (x0, y0, y1, col) => sb.rect(x0, Math.min(y0, y1), x0 + 0.7, Math.max(y0, y1), { fill: col, fillAlpha: 0.45, color: col, width: 1.4 });
          bar(0.25, 0, pr.orb, 'blue'); bar(1.2, 0, pr.spin, 'purple');
          bar(2.15, 0, pr.orb, 'blue'); bar(2.15, pr.orb, pr.orb + pr.spin, 'purple');
          bar(3.1, 0, pr.tot, 'green');
          const a0 = all[0];
          [[0.25, a0.orb], [1.2, a0.spin], [3.1, a0.tot]].forEach(([x0, y]) => sb.line(x0 - 0.08, y, x0 + 0.78, y, { color: 'ink', dash: [3, 3], width: 1.2 }));
          [['orbital', 0.6], ['spin', 1.55], ['sum', 2.5], ['Σ r×p', 3.45]].forEach(([lab, x0]) => sb.text(lab, x0, lo - pad, { align: 'center', baseline: 'bottom', dy: -4, color: 'muted', size: 11.5 }));
          cur = { pr, a0, B, R: pr.R, o, tt };
          v.legend([['blue', 'orbital $\\mathbf R\\times M\\mathbf V$'], ['purple', 'spin about the CM'], ['green', 'total $\\sum m_i\\mathbf r_i\\times\\mathbf v_i$'], ['ink', 'value at launch', { dash: true }]]);
        }, { period: 5.6, still: 3.3 });
        v.readout(() => {
          if (!cur) return '';
          const { pr, a0, B, R, o } = cur;
          return String.raw`orbital ${v.fix(pr.orb, 3)} + spin ${v.fix(pr.spin, 3)} = ${v.fix(pr.orb + pr.spin, 4)}; direct total ${v.fix(pr.tot, 4)} kg·m²/s · spin change since launch: ${v.fix(pr.spin - a0.spin, 4)} · torque of gravity about $O$, $-Mg\,(X - x_O) = ${v.fix(-B.Mt * B.g * (R[0] - o[0]), 3)}$ N·m drives the orbital part`;
        });
      },
    },
  ],
};
