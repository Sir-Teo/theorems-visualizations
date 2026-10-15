// Classical Mechanics — Chapter 1: Kinematics and Newton’s laws (items 1.10–1.18)

// ---------- shared helpers (this part) ----------
const G0 = 9.81; // m/s²
// Drag on a sphere of diameter D in air at STP (Taylor §2.1): f_lin = βDv, f_quad = γD²v².
const BETA = 1.6e-4, GAMMA = 0.25, RHO_W = 1000;
const vlen = (a) => Math.hypot(a[0], a[1]);
function vec(s, p, d, k, st) {
  if (vlen(d) * k < 1e-3) return;
  s.arrow(p[0], p[1], p[0] + k * d[0], p[1] + k * d[1], { width: 2.4, head: 9, ...st });
}
function sampleAt(ts, ys, t) {
  const n = ts.length; if (t <= ts[0]) return ys[0]; if (t >= ts[n - 1]) return ys[n - 1];
  let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= t) lo = m; else hi = m; }
  const w = (t - ts[lo]) / (ts[hi] - ts[lo]), A = ys[lo], B = ys[hi];
  return Array.isArray(A) ? A.map((x, i) => x + w * (B[i] - x)) : A + w * (B - A);
}
/**
 * Projectile with drag force −(b + c|v|)v (per unit mass: kb = b/m, kc = c/m), launched from (0, h) at speed v0, angle th.
 * Integrated with adaptive Dormand–Prince until it comes back to y = 0. → {pts: [[x,y]], ts, vs, R, T, H}.
 */
function flight(M, v0, th, kb, kc, h = 0) {
  const F = (t, s) => { const sp = Math.hypot(s[2], s[3]), k = kb + kc * sp; return [s[2], s[3], -k * s[2], -G0 - k * s[3]]; };
  const vy = v0 * Math.sin(th), Tv = (vy + Math.sqrt(vy * vy + 2 * G0 * h)) / G0 + 1e-3;
  const sol = M.rk45(F, 0, [0, h, v0 * Math.cos(th), vy], Tv, { tol: 1e-9, hmax: Tv / 60 });
  const pts = [], ts = [], vs = []; let R = null, T = Tv, H = h;
  for (let i = 0; i < sol.t.length; i++) {
    const s = sol.y[i];
    if (i > 0 && s[1] < 0 && sol.y[i - 1][1] >= 0) {
      const p = sol.y[i - 1], w = p[1] / (p[1] - s[1]);
      R = p[0] + w * (s[0] - p[0]); T = sol.t[i - 1] + w * (sol.t[i] - sol.t[i - 1]);
      pts.push([R, 0]); ts.push(T); vs.push([p[2] + w * (s[2] - p[2]), p[3] + w * (s[3] - p[3])]); break;
    }
    pts.push([s[0], s[1]]); ts.push(sol.t[i]); vs.push([s[2], s[3]]); H = Math.max(H, s[1]);
  }
  if (R == null) R = pts[pts.length - 1][0];
  return { pts, ts, vs, R, T, H };
}

export default {
  collection: 'mech',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Paradox',
      name: 'Norton’s dome',
      credit: 'Norton, 2003',
      statement: String.raw`A particle rests at the apex of a frictionless dome whose height below the apex, as a function of the arc length $r$ from the apex, is $h(r)=\frac{2}{3g}r^{3/2}$ (in units with $g=1$, for $0\le r\le1$). The tangential component of gravity gives the equation of motion $\ddot r=\sqrt r$. Besides the expected solution $r(t)\equiv0$, for every $T\ge0$
$$r(t)=\begin{cases}0,& t\le T,\\ \tfrac1{144}(t-T)^4,& t\ge T\end{cases}$$
is also a solution with the same initial data $r(0)=\dot r(0)=0$: Newton's laws do not determine *whether* or *when* the particle will slide off.`,
      idea: String.raw`Substituting gives $\ddot r=\frac{12}{144}(t-T)^2=\sqrt r$, and the two pieces join with matching $r$, $\dot r$ and $\ddot r$ at $t=T$. Uniqueness (1.9) fails because the force $\sqrt r$ is not Lipschitz at $r=0$: the ratio $\sqrt r/r$ is unbounded. In the phase plane the zero-energy curve $\dot r=\tfrac{2}{\sqrt3}r^{3/4}$ leaves the equilibrium, and the time to travel along it, $\int_0 dr/\dot r$, is *finite*. For a smooth summit ($\ddot r=r$) the same integral is $\int_0 dr/r=\infty$: the particle could only arrive after infinite time, so it never leaves. Whether this is a real failure of determinism or an artefact of an unphysical idealisation is debated.`,
      caption: String.raw`Slide the release time $T$: each choice is an exact solution, and the readout checks $\ddot r=\sqrt r$ numerically. The phase plane shows the energy curves; the gold state waits at the origin and then runs out along the zero-energy curve in finite time. Toggle *smooth the summit*: the force becomes Lipschitz, the only solution from rest is $r\equiv0$, and starting a hair away ($\varepsilon=10^{-2},\dots,10^{-8}$) only delays the departure by $\ln(1/\varepsilon)$.`,
      deps: ['mech-1.9'],
      see: ['ode-1.15'],
      refs: ['Arnold §1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Norton%27s_dome' },
      tags: ['determinism', 'ode'],
      viz(v) {
        const smooth = v.toggle('smooth the summit', false);
        const Ts = v.slider('release time $T$', 0, 4.5, 0.5, { step: 0.05 });
        const dome = v.stage({ x: [-0.95, 0.95], y: [-0.82, 0.2], equal: true, height: 270, axes: false, title: 'the dome (cross-section)', weight: 1.15 });
        const ph = v.stage({ x: [-1.1, 1.1], y: [-1.5, 1.5], height: 270, axes: true, title: 'phase plane $(r,\\dot r)$', weight: 1 });
        const rt = v.stage({ x: [0, 8], y: [0, 1.08], height: 200, axes: 'box', xlabel: 't', ylabel: 'r', full: true });
        const force = (r, sm) => (sm ? r : Math.sign(r) * Math.sqrt(Math.abs(r)));
        const pp = v.phasePlane(ph, {
          f: (x, y, t, p) => [y, force(x, p.sm)], params: { sm: () => (smooth.value ? 1 : 0) },
          field: 'arrows', nullclines: false, fixedPoints: false, click: false, both: false,
          H: (x, y, p) => y * y / 2 - (p.sm ? x * x / 2 : (2 / 3) * Math.pow(Math.abs(x), 1.5)), contours: [-0.5, -0.25, 0, 0.25, 0.5, 0.8],
        });
        const prof = (r, sm) => (sm ? [(Math.asin(r) + r * Math.sqrt(1 - r * r)) / 2, -r * r / 2, r] : [(2 / 3) * (1 - Math.pow(1 - r, 1.5)), -(2 / 3) * Math.pow(r, 1.5), Math.sqrt(r)]);
        const sol = (t, T) => (t <= T ? 0 : Math.pow(t - T, 4) / 144);
        const EPS = [1e-2, 1e-4, 1e-6, 1e-8];
        let st = null;
        v.animate((t) => {
          const sm = smooth.value, T = Ts.value, tau = (1.5 * t) % 9;
          Ts.el.hidden = sm;
          // the state now
          let r = 0, rd = 0;
          if (!sm) { r = Math.min(sol(tau, T), 1); rd = tau > T && r < 1 ? Math.pow(tau - T, 3) / 36 : 0; }
          // dome
          const R = (q) => prof(Math.min(q, 1), sm);
          dome.curve((q) => { const p = R(Math.abs(q)); return [Math.sign(q) * p[0], p[1]]; }, -1, 1, { color: 'ink', width: 2.4, n: 300 });
          dome.path([[-0.9, -0.8], [0.9, -0.8]], { color: 'faint', width: 4 });
          const P = R(r), sinp = P[2], cosp = Math.sqrt(Math.max(0, 1 - sinp * sinp)), rb = 0.045;
          dome.circle(P[0] + rb * sinp, P[1] + rb * cosp, rb, { fill: 'gold', fillAlpha: 1, color: 'gold' });
          if (r > 1e-6 && r < 1) vec(dome, [P[0] + rb * sinp, P[1] + rb * cosp], [cosp * sinp, -sinp * sinp], 0.35, { color: 'pink', width: 2, head: 7 });
          dome.corner(sm ? 'smooth summit h ∝ r²: force ∝ r' : 'summit h ∝ r³ᐟ²: force ∝ √r', 'tl', { color: sm ? 'green' : 'red', weight: 600 });
          // phase plane + state
          pp.draw();
          const e0 = (x) => (sm ? x : (2 / Math.sqrt(3)) * Math.pow(x, 0.75));
          ph.curve((q) => [q, e0(q)], 0, 1.1, { color: 'accent', width: 2.6, n: 200 });
          ph.curve((q) => [-q, e0(q)], 0, 1.1, { color: 'accent', width: 1.2, alpha: 0.5, n: 200 });
          ph.text('zero-energy curve', 0.3, e0(0.3), { color: 'accent', size: 11, dx: 6, dy: 12 });
          ph.dot(r, rd, { r: 6, color: 'gold' });
          // r(t)
          rt.setTitle(sm ? 'solutions from $r(0)=\\varepsilon$, $\\dot r(0)=0$: $r=\\varepsilon\\cosh t$ (the only one from $\\varepsilon=0$ is $r\\equiv0$)' : 'all of these solve $\\ddot r=\\sqrt r$ with $r(0)=\\dot r(0)=0$');
          if (!sm) {
            for (let T2 = 0; T2 <= 6; T2 += 0.5) rt.fn((q) => { const y = sol(q, T2); return y <= 1.06 ? y : NaN; }, { color: 'purple', width: 1, alpha: 0.35 });
            rt.fn((q) => { const y = sol(q, T); return y <= 1.06 ? y : NaN; }, { color: 'accent', width: 2.8 });
            rt.vline(T, { color: 'accent', dash: [4, 4], width: 1 });
          } else {
            EPS.forEach((e, i) => { rt.fn((q) => { const y = e * Math.cosh(q); return y <= 1.06 ? y : NaN; }, { color: 'purple', width: 1.4, alpha: 0.4 + 0.15 * i }); const tx = Math.acosh(0.9 / e); rt.text(`ε = 10⁻${2 * (i + 1)}`, tx, 0.9, { color: 'purple', size: 11, dx: 4 }); });
          }
          rt.hline(0, { color: 'green', width: 3 });
          rt.dot(tau, r, { r: 5, color: 'gold' });
          // residual of the chosen exact solution, and the escape-time integral along E = 0
          let res = 0;
          if (!sm) for (let q = 0.01; q < 8; q += 0.01) { const y = sol(q, T); if (y > 1) break; const h = 1e-3, ydd = (sol(q + h, T) - 2 * y + sol(q - h, T)) / (h * h); res = Math.max(res, Math.abs(ydd - Math.sqrt(y))); }
          // along E = 0: dt = dr / ṙ; dome: substitute r = u⁴ (removes the 0 singularity); smooth: from r = 10⁻⁸
          const esc = sm ? v.M.integrate((w) => 1, Math.log(1e-8), 0, 200) : v.M.integrate((u) => 4 * u ** 3 / ((2 / Math.sqrt(3)) * Math.pow(u, 3) + 1e-300), 1e-12, 1, 200);
          st = { sm, res, esc, r };
        }, { still: 3.8 });
        v.legend([['accent', 'chosen solution'], ['purple', 'other solutions'], ['green', '$r\\equiv0$'], ['gold', 'the particle', { dot: true }]]);
        v.readout(() => st && (st.sm
          ? `Smooth summit: $\\ddot r = r$ is Lipschitz, so $r\\equiv0$ is the **only** solution from rest. Time to creep from $r=10^{-8}$ to $r=1$ along the zero-energy curve: $\\int dr/r = ${v.fix(st.esc, 2)}$, and $\\to\\infty$ as the start approaches the apex.`
          : `Release at $T = ${v.fix(Ts.value, 2)}$: $\\max_t|\\ddot r-\\sqrt r| = ${v.sci(st.res, 1)}$ (finite differences), so it is a solution — as is every other $T$, and $r\\equiv0$. Time to slide from the apex to $r=1$ along the zero-energy curve: $\\int_0^1 dr/\\dot r = 2\\sqrt3 \\approx ${v.fix(st.esc, 3)}$, finite. Lipschitz ratio $\\sqrt r/r = 1/\\sqrt r\\to\\infty$.`));
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Model',
      name: 'Projectile motion in uniform gravity',
      credit: 'Galileo, 1638',
      statement: String.raw`A projectile moving under uniform gravity $\mathbf g=-g\hat{\mathbf y}$ alone, launched from the origin with speed $v_0$ at angle $\theta$, follows the parabola
$$x=v_0\cos\theta\,t,\qquad y=v_0\sin\theta\,t-\tfrac12gt^2 .$$
It lands after $T=2v_0\sin\theta/g$ at the range $R=v_0^2\sin2\theta/g$, which is largest at $\theta=45^\circ$; complementary angles $\theta$ and $90^\circ-\theta$ give the same range; and every point reachable at speed $v_0$ lies under the **safety parabola** $y=\frac{v_0^2}{2g}-\frac{g x^2}{2v_0^2}$, the envelope of all the trajectories.`,
      scope: String.raw`Holds when air resistance is negligible (dense, slow projectiles; see 1.12–1.13), over distances small compared with the Earth's radius (so $\mathbf g$ is uniform) and times short enough that the Earth's rotation does not matter. The 45° rule assumes launch and landing at the same height.`,
      idea: String.raw`With a constant force, Newton's second law (1.6) separates into two independent one-dimensional problems: uniform motion horizontally and uniform acceleration vertically. The range formula follows from the flight time; $\sin2\theta$ is symmetric about $45^\circ$. For a fixed target $(x,y)$ the launch angle solves a quadratic in $\tan\theta$, which has real roots exactly when the point lies under the safety parabola.`,
      caption: String.raw`Set the launch speed and angle. The trajectory is integrated numerically; the faint fan shows every angle in 5° steps and their envelope is the safety parabola (orange). The dashed purple path is the complementary angle, landing at the same spot. The right panel plots the range against the angle. Raise the launch height to leave the textbook regime: the best angle drops below 45° and complementary angles no longer agree.`,
      deps: ['mech-1.6'],
      refs: ['Taylor §1.6'],
      tags: ['projectiles', 'gravity'],
      viz(v) {
        const M = v.M, D2R = Math.PI / 180;
        const v0s = v.slider('$v_0$ (m/s)', 5, 20, 15, { step: 0.1 });
        const ths = v.slider('angle $\\theta$ (°)', 1, 89, 30, { step: 0.5 });
        const hs = v.slider('launch height $h$ (m)', 0, 12, 0, { step: 0.1 });
        const s = v.stage({ x: [-1, 48], y: [-0.5, 24], equal: true, height: 330, axes: 'box', xlabel: 'x (m)', ylabel: 'y (m)', weight: 1.5 });
        const r = v.stage({ x: [0, 90], y: [0, 50], height: 330, axes: 'box', xlabel: 'θ (°)', ylabel: 'range (m)', title: 'range vs angle', weight: 0.85, xticks: [0, 15, 30, 45, 60, 75, 90] });
        let key = '', fan = null, curve = null, st = null;
        v.animate((t) => {
          const v0 = v0s.value, th = ths.value * D2R, h = hs.value;
          const k = [v0, h].join();
          if (k !== key) {
            key = k;
            fan = []; for (let a = 5; a <= 85; a += 5) fan.push(flight(M, v0, a * D2R, 0, 0, h));
            curve = []; for (let a = 0.5; a <= 89.5; a += 0.5) curve.push([a, flight(M, v0, a * D2R, 0, 0, h).R]);
          }
          const cur = flight(M, v0, th, 0, 0, h), comp = flight(M, v0, (90 - ths.value) * D2R, 0, 0, h);
          const best = curve.reduce((b, p) => (p[1] > b[1] ? p : b), [0, -1]);
          const pred = (v0 * Math.cos(th) / G0) * (v0 * Math.sin(th) + Math.sqrt(v0 * v0 * Math.sin(th) ** 2 + 2 * G0 * h));
          const thBest = Math.asin(v0 / Math.sqrt(2 * v0 * v0 + 2 * G0 * h)) / D2R;
          st = { R: cur.R, pred, Rc: comp.R, T: cur.T, H: cur.H, best, thBest };
          // scene: fit the reachable region (safety parabola) of the current speed and height
          const Ytop = h + v0 * v0 / (2 * G0), Xreach = Math.sqrt(2 * v0 * v0 * Ytop / G0);
          s.setView([-0.04 * Xreach, Xreach * 1.04], [-0.05 * Ytop, Ytop * 1.08]);
          if (h > 0) s.rect(-0.04 * Xreach, 0, 0, h, { fill: 'muted', fillAlpha: 0.35, stroke: false });
          s.hline(0, { color: 'muted', width: 1.5 });
          for (const f of fan) s.path(f.pts, { color: 'muted', width: 1, alpha: 0.35 });
          s.fn((x) => h + v0 * v0 / (2 * G0) - G0 * x * x / (2 * v0 * v0), { domain: [0, Xreach], color: 'orange', width: 2, dash: [6, 4] });
          s.path(comp.pts, { color: 'purple', width: 2, dash: [5, 4] });
          s.path(cur.pts, { color: 'accent', width: 2.6 });
          const tau = Math.min(t % (cur.T + 1), cur.T), p = sampleAt(cur.ts, cur.pts, tau);
          s.dot(p[0], p[1], { r: 6, color: 'gold' });
          s.dot(cur.R, 0, { r: 5, color: 'accent', hollow: true });
          // range vs angle
          r.setView([0, 90], [0, Math.max(10, best[1] * 1.2)]);
          r.vline(45, { color: 'faint', dash: [3, 3] });
          r.path(curve, { color: 'accent', width: 2 });
          if (h === 0) r.fn((a) => v0 * v0 * Math.sin(2 * a * D2R) / G0, { domain: [0, 90], color: 'orange', dash: [6, 4], width: 1.4 });
          r.dot(best[0], best[1], { r: 5, color: 'green', label: `best ${v.fix(best[0], 1)}°`, labelPos: 'n' });
          r.dot(ths.value, cur.R, { r: 5, color: 'gold' });
          r.dot(90 - ths.value, comp.R, { r: 4, color: 'purple', hollow: true });
        }, { still: 0.9 });
        v.legend([['accent', 'trajectory (integrated)'], ['purple', 'complementary angle', { dash: true }], ['orange', 'safety parabola / $v_0^2\\sin2\\theta/g$', { dash: true }], ['muted', 'all angles, 5° apart']]);
        v.readout(() => st && `Simulated range $${v.fix(st.R, 3)}$ m vs formula $${v.fix(st.pred, 3)}$ m · complementary angle: $${v.fix(st.Rc, 3)}$ m · flight time $${v.fix(st.T, 3)}$ s, top height $${v.fix(st.H, 2)}$ m · best angle ${v.fix(st.best[0], 1)}° (theory ${v.fix(st.thBest, 2)}°)` + (hs.value > 0 ? ' — **launched from a height, so the 45° rule and the complementary-angle symmetry fail.**' : ''));
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Model',
      name: 'Linear air resistance',
      statement: String.raw`If the drag force is proportional to the velocity, $\mathbf f=-b\mathbf v$, a projectile of mass $m$ obeys $\dot{\mathbf v}=\mathbf g-k\mathbf v$ with $k=b/m$. The horizontal and vertical motions decouple and relax exponentially:
$$v_x=v_{x0}e^{-kt},\qquad v_y=-v_t+(v_{y0}+v_t)e^{-kt},\qquad v_t=\frac gk ,$$
so the projectile never travels further than $x_\infty=v_{x0}/k$ (a vertical asymptote of the path) and falls at the **terminal speed** $v_t$.`,
      scope: String.raw`Linear (Stokes) drag dominates when the Reynolds number is small — tiny or slow bodies: dust, fog droplets, Millikan's oil drops, motion in viscous liquids. For a sphere of diameter $D$ in air, $f_{\rm lin}=\beta Dv$ with $\beta\approx1.6\times10^{-4}$ N·s/m², while $f_{\rm quad}=\gamma D^2v^2$ with $\gamma\approx0.25$ N·s²/m⁴; the linear law is valid only when $\gamma Dv/\beta\ll1$.`,
      idea: String.raw`Because the drag is linear in $\mathbf v$, each component of Newton's second law (1.6) is a first-order linear ODE solved by an integrating factor; the exponential $e^{-kt}$ forgets the initial velocity on the time scale $1/k$. Integrating $v_x$ once more gives $x(t)=\frac{v_{x0}}{k}(1-e^{-kt})<x_\infty$. As $k\to0$ the exponentials expand to give back the vacuum parabola (1.11).`,
      caption: String.raw`Raise the drag rate $k$ and compare with the vacuum twin (dashed): the path steepens toward the vertical asymptote $x_\infty=v_{x0}/k$ (green). The right panel shows $v_y(t)$ relaxing to $-v_t$; the dashed curve is the closed-form solution, under the simulated one. Toggle *real droplet* to give the path to a water drop with this $k$ and both drag laws: at these speeds it is dominated by quadratic drag and the linear model fails.`,
      deps: ['mech-1.11'],
      refs: ['Taylor §2.2', 'Taylor §2.3'],
      tags: ['drag', 'projectiles'],
      viz(v) {
        const M = v.M, D2R = Math.PI / 180;
        const ks = v.slider('drag rate $k=b/m$ (s⁻¹)', 0.02, 3, 0.6, { step: 0.01 });
        const v0s = v.slider('$v_0$ (m/s)', 2, 25, 14, { step: 0.1 });
        const ths = v.slider('angle (°)', 10, 80, 50, { step: 0.5 });
        const real = v.toggle('real droplet (linear + quadratic drag)', false);
        const s = v.stage({ x: [0, 20], y: [0, 10], height: 330, axes: 'box', xlabel: 'x (m)', ylabel: 'y (m)', weight: 1.4 });
        const g = v.stage({ x: [0, 3], y: [-10, 10], height: 330, axes: 'box', xlabel: 't (s)', ylabel: 'm/s', title: 'vertical velocity $v_y(t)$', weight: 0.9 });
        let key = '', C = null, st = null;
        v.animate((t) => {
          const k = ks.value, v0 = v0s.value, th = ths.value * D2R;
          const kk = [k, v0, th, real.value].join();
          if (kk !== key) {
            key = kk;
            const lin = flight(M, v0, th, k, 0), vac = flight(M, v0, th, 0, 0);
            const D = Math.sqrt(6 * BETA / (RHO_W * Math.PI * k)), m = RHO_W * Math.PI * D ** 3 / 6;
            const drop = real.value ? flight(M, v0, th, BETA * D / m, GAMMA * D * D / m) : null;
            C = { lin, vac, drop, D, m };
          }
          const { lin, vac, drop, D } = C, vx0 = v0 * Math.cos(th), vy0 = v0 * Math.sin(th), vt = G0 / k, xinf = vx0 / k;
          // closed form at the simulated landing time
          const xA = (q) => vx0 / k * (1 - Math.exp(-k * q)), yA = (q) => (vy0 + vt) / k * (1 - Math.exp(-k * q)) - vt * q;
          const ratio = (GAMMA * D / BETA) * v0;
          st = { R: lin.R, xA: xA(lin.T), yA: yA(lin.T), T: lin.T, vt, xinf, D, ratio, Rd: drop ? drop.R : null };
          // view: fit the drag path, let the vacuum twin run off if it is much larger
          const X = Math.max(lin.R * 1.25, Math.min(vac.R * 1.04, xinf * 1.2)), Y = Math.max(lin.H * 1.35, Math.min(vac.H * 1.08, lin.H * 2.5));
          s.setView([-0.02 * X, X], [-0.04 * Y, Y]);
          s.hline(0, { color: 'muted', width: 1.4 });
          if (xinf < X) { s.vline(xinf, { color: 'green', dash: [6, 4], width: 1.6 }); s.text('x∞ = v₀ₓ/k', xinf, Y * 0.93, { color: 'green', size: 12, align: 'right', dx: -6 }); }
          s.path(vac.pts, { color: 'muted', width: 1.6, dash: [5, 4] });
          if (drop) s.path(drop.pts, { color: 'red', width: 2.2 });
          s.path(lin.pts, { color: 'accent', width: 2.6 });
          const tau = Math.min(t % (lin.T + 1), lin.T), p = sampleAt(lin.ts, lin.pts, tau), vv = sampleAt(lin.ts, lin.vs, tau);
          s.dot(p[0], p[1], { r: 6, color: 'gold' });
          // v_y(t)
          const Tm = Math.max(lin.T, 0.5) * 1.05;
          g.setView([0, Tm], [-Math.max(vt * 1.15, 2), Math.max(vy0 * 1.15, 2)]);
          g.hline(-vt, { color: 'green', dash: [6, 4], width: 1.5 });
          g.text(`terminal −g/k = −${v.fix(vt, 2)} m/s`, Tm, -vt, { color: 'green', size: 12, align: 'right', dy: -10 });
          g.fn((q) => vy0 - G0 * q, { domain: [0, Tm], color: 'muted', dash: [5, 4], width: 1.2 });
          g.path(lin.ts.map((q, i) => [q, lin.vs[i][1]]), { color: 'accent', width: 4, alpha: 0.6 });
          g.fn((q) => -vt + (vy0 + vt) * Math.exp(-k * q), { domain: [0, Tm], color: 'ink', dash: [4, 4], width: 1.4 });
          g.dot(tau, vv[1], { r: 5, color: 'gold' });
        }, { still: 1.1 });
        v.legend([['accent', 'linear drag (integrated)'], ['ink', 'closed form', { dash: true }], ['muted', 'vacuum', { dash: true }], ['red', 'real droplet']]);
        v.readout(() => st && `Landing at $t=${v.fix(st.T, 3)}$ s: simulated $x=${v.fix(st.R, 4)}$ m, closed form $x(t)=${v.fix(st.xA, 4)}$ m ($y = ${v.sci(st.yA, 1)}$) · asymptote $x_\\infty=${v.fix(st.xinf, 2)}$ m · terminal speed $g/k=${v.fix(st.vt, 2)}$ m/s. ` +
          `**Regime:** a water drop with this $k$ has $D=$ ${v.M.si(st.D, 'm')}; at $v_0$ its drag ratio is $f_{\\rm quad}/f_{\\rm lin}=\\gamma Dv/\\beta=${v.fix(st.ratio, 1)}$` + (st.ratio > 1 ? ' — quadratic drag dominates, so the linear model is not valid here' + (st.Rd != null ? ` (the real drop lands at $${v.fix(st.Rd, 2)}$ m)` : '') + '.' : ' — linear drag is a fair model.'));
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Model',
      name: 'Quadratic drag and terminal speed',
      statement: String.raw`For a body moving fast through air the drag is approximately quadratic, $\mathbf f=-c|\mathbf v|\mathbf v$ (for a sphere of diameter $D$, $c=\gamma D^2$ with $\gamma\approx0.25$ N·s²/m⁴). Falling from rest, the speed then obeys $m\dot v=mg-cv^2$, whose solution is
$$v(t)=v_t\tanh\frac{gt}{v_t},\qquad v_t=\sqrt{\frac{mg}{c}},$$
approaching the terminal speed within a few times $v_t/g$. For a thrown body the two components are coupled through $|\mathbf v|$, there is no closed form, and the launch angle that maximises the range falls below $45^\circ$ as drag becomes important ($v_0\gtrsim v_t$).`,
      scope: String.raw`Quadratic drag holds at large Reynolds number (roughly $10^3$–$10^5$ for spheres): balls, raindrops, falling people. Real bodies feel both terms, $f=\beta Dv+\gamma D^2v^2$; their ratio $\gamma Dv/\beta\approx1.6\times10^3\,Dv$ (SI) decides which dominates. At still higher speeds the drag crisis and compressibility change $c$.`,
      idea: String.raw`The vertical equation separates: $\int dv/(1-v^2/v_t^2)=gt$ integrates to the inverse hyperbolic tangent. The terminal speed is where drag balances weight. In two dimensions the drag on each component involves the full speed, so the motion must be integrated numerically; a low trajectory spends less time fighting drag, which favours flatter launches.`,
      caption: String.raw`Choose a body and a launch speed. Top: trajectories with full drag (linear + quadratic, integrated with an adaptive Runge–Kutta method) at the best angle and at 45°, and the vacuum path. Bottom left: falling from rest, the simulated speed sits on $v_t\tanh(gt/v_t)$ when quadratic drag dominates — but not for a fog droplet, which follows the linear law instead. Bottom right: range against angle, with the optimum marked.`,
      deps: ['mech-1.12'],
      refs: ['Taylor §2.4'],
      tags: ['drag', 'projectiles'],
      viz(v) {
        const M = v.M, D2R = Math.PI / 180;
        const OBJ = {
          ball: { label: 'baseball', D: 0.073, m: 0.145 },
          pong: { label: 'ping-pong ball', D: 0.04, m: 0.0027 },
          rain: { label: 'raindrop 2 mm', D: 0.002, m: RHO_W * Math.PI * 0.002 ** 3 / 6 },
          fog: { label: 'fog droplet 20 µm', D: 2e-5, m: RHO_W * Math.PI * 2e-5 ** 3 / 6 },
        };
        const obj = v.select('body', Object.entries(OBJ).map(([value, O]) => ({ value, label: O.label })), 'ball');
        const v0s = v.slider('launch speed $v_0$ (m/s)', 1, 60, 40, { step: 0.5 });
        const s = v.stage({ x: [0, 100], y: [0, 40], height: 260, axes: 'box', xlabel: 'x (m)', ylabel: 'y (m)', full: true });
        const fall = v.stage({ x: [0, 10], y: [0, 40], height: 220, axes: 'box', xlabel: 't (s)', ylabel: 'v (m/s)', title: 'falling from rest' });
        const ra = v.stage({ x: [0, 90], y: [0, 1.2], height: 220, axes: 'box', xlabel: 'θ (°)', ylabel: 'R / Rmax', title: 'range vs launch angle', xticks: [0, 15, 30, 45, 60, 75, 90] });
        let key = '', C = null, st = null;
        v.animate((t) => {
          const O = OBJ[obj.value], v0 = v0s.value, kb = BETA * O.D / O.m, kc = GAMMA * O.D * O.D / O.m;
          const kk = obj.value + ':' + v0;
          if (kk !== key) {
            key = kk;
            const sweep = []; for (let a = 2; a <= 88; a += 2) sweep.push([a, flight(M, v0, a * D2R, kb, kc).R]);
            const best = sweep.reduce((b, p) => (p[1] > b[1] ? p : b), [0, -1]);
            const fb = flight(M, v0, best[0] * D2R, kb, kc), f45 = flight(M, v0, 45 * D2R, kb, kc), vac = flight(M, v0, 45 * D2R, 0, 0);
            // falling from rest with both drag terms
            const vt = (-kb + Math.sqrt(kb * kb + 4 * kc * G0)) / (2 * kc), vq = Math.sqrt(G0 / kc), vl = G0 / kb;
            const Tf = 4.5 * Math.min(vq, vl) / G0;
            const fs = M.rk45((q, y) => -G0 + (kb + kc * Math.abs(y)) * -y, 0, 0, Tf, { tol: 1e-10, hmax: Tf / 200 });
            C = { sweep, best, fb, f45, vac, vt, vq, vl, Tf, fs };
          }
          const { sweep, best, fb, f45, vac, vt, vq, vl, Tf, fs } = C;
          const ratio = (GAMMA / BETA) * O.D * vt, ratio0 = (GAMMA / BETA) * O.D * v0;
          st = { best: best[0], Rb: best[1], R45: f45.R, Rv: vac.R, vt, vq, vl, ratio, ratio0, vsim: -fs.y[fs.y.length - 1] };
          // trajectories (view fits the drag paths; the vacuum path may run off)
          const X = Math.max(fb.R, f45.R) * 1.15, Y = Math.max(fb.H, f45.H) * 1.4;
          s.setView([-0.01 * X, X], [-0.03 * Y, Y]);
          s.hline(0, { color: 'muted', width: 1.4 });
          s.path(vac.pts, { color: 'muted', width: 1.5, dash: [5, 4] });
          s.path(f45.pts, { color: 'purple', width: 2, dash: [6, 3] });
          s.path(fb.pts, { color: 'accent', width: 2.6 });
          const tau = Math.min(t % (fb.T + 1), fb.T), p = sampleAt(fb.ts, fb.pts, tau);
          s.dot(p[0], p[1], { r: 6, color: 'gold' });
          s.corner(`best angle ${best[0]}°: R = ${v.M.si(best[1], 'm')}   ·   45°: R = ${v.M.si(f45.R, 'm')}   ·   vacuum: ${v.M.si(vac.R, 'm')}`, 'tr', { color: 'ink', size: 12 });
          // falling
          fall.setView([0, Tf], [0, Math.max(vt * 1.25, 1e-9)]);
          fall.hline(vt, { color: 'green', dash: [6, 4], width: 1.4 });
          fall.fn((q) => vq * Math.tanh(G0 * q / vq), { domain: [0, Tf], color: 'orange', dash: [6, 4], width: 1.6 });
          fall.fn((q) => vl * (1 - Math.exp(-G0 * q / vl)), { domain: [0, Tf], color: 'teal', dash: [3, 3], width: 1.6 });
          fall.path(fs.t.map((q, i) => [q, -fs.y[i]]), { color: 'accent', width: 3, alpha: 0.75 });
          // range vs angle
          ra.vline(45, { color: 'faint', dash: [3, 3] });
          ra.path(sweep.map(([a, R]) => [a, R / best[1]]), { color: 'accent', width: 2 });
          ra.fn((a) => Math.sin(2 * a * D2R), { domain: [0, 90], color: 'muted', dash: [5, 4], width: 1.2 });
          ra.dot(best[0], 1, { r: 5, color: 'green', label: `${best[0]}°`, labelPos: 'n' });
        }, { still: 1 });
        v.legend([['accent', 'full drag, integrated'], ['purple', '45°', { dash: true }], ['muted', 'vacuum', { dash: true }], ['orange', '$v_t\\tanh(gt/v_t)$', { dash: true }], ['teal', 'linear-drag law', { dash: true }], ['green', 'terminal speed', { dash: true }]]);
        v.readout(() => st && `Terminal speed: simulated ${v.M.si(st.vsim, 'm/s')}; quadratic prediction $\\sqrt{mg/c} =$ ${v.M.si(st.vq, 'm/s')}, linear prediction $mg/b =$ ${v.M.si(st.vl, 'm/s')}. Drag ratio $f_{\\rm quad}/f_{\\rm lin}$ at terminal speed: $${v.sci(st.ratio, 2)}$ → ` + (st.ratio > 3 ? '**quadratic regime**.' : st.ratio < 0.3 ? '**linear regime** — the tanh law fails.' : 'mixed regime.') + ` Best launch angle ${st.best}° (vacuum: 45°).`);
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Definition',
      name: 'Normal force and tension as constraint forces',
      statement: String.raw`A **constraint force** is whatever force a surface, rod or string must exert to keep a body obeying its constraint. A surface pushes perpendicular to itself with the **normal force** $N\ge0$, whose size is not given by any force law but by the requirement that the body not penetrate the surface: $N$ is fixed by Newton's second law with zero acceleration across the surface. A taut string pulls along itself with a **tension** $T\ge0$, determined likewise by the requirement that the string not stretch. Both are one-sided: if the required value would be negative, the body leaves the surface or the string goes slack, and the constraint stops acting.`,
      idea: String.raw`Write $m\mathbf a=\sum\mathbf F$ (1.6) in components across and along the constraint. Across a fixed surface $a_\perp=0$, so $N=mg\cos\theta-P_\perp$ adjusts itself to the other forces; with a string holding the block, $a_\parallel=0$ fixes $T$. By the third law (1.7) the block pushes back on the surface and on the string with equal and opposite forces. When the formula gives $N<0$ or $T<0$ the constraint is simply removed and the equations of free motion take over.`,
      caption: String.raw`Tilt the incline, drag the orange handle to push or pull on the block, and choose whether a rope holds it. The force polygon on the right adds the forces tip to tail; their sum (pink) is $m\mathbf a$. Watch $N$ change as you push, without anything “deciding” it — and pull the block away from the surface, or push it up the slope, to see the one-sided constraints let go.`,
      deps: ['mech-1.6', 'mech-1.7'],
      refs: ['Taylor §1.6', 'Goldstein §1.3'],
      tags: ['forces', 'constraints'],
      viz(v) {
        const M = v.M, D2R = Math.PI / 180, m = 2;
        const ths = v.slider('incline $\\theta$ (°)', 0, 60, 30, { step: 0.5 });
        const mode = v.select('', [{ value: 'free', label: 'free block' }, { value: 'rope', label: 'held by a rope' }], 'rope');
        const s = v.stage({ x: [-2.6, 2.6], y: [-1.2, 2.6], equal: true, height: 340, axes: false, weight: 1.35 });
        const fp = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 340, axes: false, title: 'force polygon', weight: 0.9 });
        const kF = 0.045; // m per N
        let pushOff = [-0.3, 0.12];
        const hp = s.handle(0, 0, { color: 'orange', label: 'P', constrain: (x, y) => [x, y] });
        hp.onDrag = () => { pushOff = [hp.x - cen[0], hp.y - cen[1]]; };
        let cen = [0, 0], st = null;
        v.render(() => {
          const th = ths.value * D2R, rope = mode.value === 'rope';
          // incline rising to the left, so "downhill" points down and to the right
          const base = [-2.3, -0.8], Lx = 4.4, top = [base[0], base[1] + Lx * Math.tan(th)];
          const down = [Math.cos(th), -Math.sin(th)], out = [Math.sin(th), Math.cos(th)];
          // block sits at arc length 1.9 from the top corner
          const sb = Math.min(1.9, 0.6 * Lx / Math.cos(th)), foot = [top[0] + down[0] * sb, top[1] + down[1] * sb], bs = 0.42;
          cen = [foot[0] + out[0] * bs / 2, foot[1] + out[1] * bs / 2];
          const P = [pushOff[0] / kF, pushOff[1] / kF]; // N: the handle sits at the tip of the drawn push arrow
          hp.x = cen[0] + pushOff[0]; hp.y = cen[1] + pushOff[1];
          const W = [0, -m * G0], Pn = P[0] * out[0] + P[1] * out[1], Ps = P[0] * down[0] + P[1] * down[1];
          let N = m * G0 * Math.cos(th) - Pn, an = 0, lift = false;
          if (N < 0) { N = 0; an = (Pn - m * G0 * Math.cos(th)) / m; lift = true; }
          let T = 0, as = G0 * Math.sin(th) + Ps / m, slack = false;
          if (rope) { T = m * G0 * Math.sin(th) + Ps; as = 0; if (T < 0) { T = 0; as = (m * G0 * Math.sin(th) + Ps) / m; slack = true; } }
          if (lift) { T = 0; as = (m * G0 * Math.sin(th) + Ps) / m; }
          const Nv = [N * out[0], N * out[1]], Tv = [-T * down[0], -T * down[1]], acc = [as * down[0] + an * out[0], as * down[1] + an * out[1]];
          st = { N, T, as, an, lift, slack, rope, Ngrav: m * G0 * Math.cos(th), Pn, Ps };
          // draw incline
          s.poly([base, [base[0] + Lx, base[1]], top], { fill: 'muted', fillAlpha: 0.22, color: 'muted' });
          if (th > 0.02) s.text(`θ = ${v.fix(ths.value, 1)}°`, base[0] + Lx, base[1] - 0.18, { color: 'muted', size: 12, align: 'right' });
          // block (rotated square)
          const lifted = lift ? 0.08 : 0, c0 = [cen[0] + out[0] * lifted, cen[1] + out[1] * lifted];
          const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [c0[0] + (a * down[0] + b * out[0]) * bs / 2, c0[1] + (a * down[1] + b * out[1]) * bs / 2]);
          s.poly(corners, { fill: 'accent', fillAlpha: 0.35, color: 'accent' });
          if (rope) { const anchor = [top[0] + down[0] * 0.05, top[1] + down[1] * 0.05], attach = [c0[0] - down[0] * bs / 2, c0[1] - down[1] * bs / 2]; s.line(anchor[0], anchor[1], attach[0], attach[1], { color: slack || lift ? 'faint' : 'purple', width: 2, dash: slack || lift ? [4, 4] : false }); s.dot(anchor[0], anchor[1], { r: 4, color: 'ink' }); }
          // forces at the block centre
          vec(s, c0, W, kF, { color: 'ink' });
          vec(s, c0, Nv, kF, { color: 'green' });
          if (T > 0) vec(s, c0, Tv, kF, { color: 'purple' });
          vec(s, c0, P, kF, { color: 'orange' });
          vec(s, c0, [m * acc[0], m * acc[1]], kF, { color: 'pink', width: 3 });
          s.tex('m\\mathbf g', c0[0] + kF * W[0], c0[1] + kF * W[1], { color: 'ink', dx: 6, dy: 8, size: 13 });
          if (N > 0) s.tex('\\mathbf N', c0[0] + kF * Nv[0], c0[1] + kF * Nv[1], { color: 'green', dx: 4, dy: -8, size: 13 });
          if (T > 0) s.tex('\\mathbf T', c0[0] + kF * Tv[0], c0[1] + kF * Tv[1], { color: 'purple', dx: -14, dy: -8, size: 13 });
          if (lift) s.corner('N would be negative: the block leaves the surface', 'tl', { color: 'red', weight: 600 });
          else if (slack) s.corner('T would be negative: the rope goes slack', 'tl', { color: 'red', weight: 600 });
          // force polygon
          const k2 = 0.05; let q = [-0.4, 1.1];
          const chain = [[W, 'ink'], [Nv, 'green'], [Tv, 'purple'], [P, 'orange']];
          const start = q;
          for (const [F, col] of chain) { if (vlen(F) < 1e-9) continue; vec(fp, q, F, k2, { color: col, width: 2.4, head: 8 }); q = [q[0] + k2 * F[0], q[1] + k2 * F[1]]; }
          if (vlen([q[0] - start[0], q[1] - start[1]]) > 0.02) vec(fp, start, [q[0] - start[0], q[1] - start[1]], 1, { color: 'pink', width: 2.6, dash: [5, 3] });
          else fp.dot(start[0], start[1], { r: 6, color: 'green', hollow: true });
          fp.dot(start[0], start[1], { r: 3, color: 'ink' });
          fp.corner(vlen([q[0] - start[0], q[1] - start[1]]) > 0.02 ? 'sum = m a (pink)' : 'polygon closes: a = 0', 'bl', { color: vlen([q[0] - start[0], q[1] - start[1]]) > 0.02 ? 'pink' : 'green', weight: 600 });
        });
        v.legend([['ink', 'weight $m\\mathbf g$'], ['green', 'normal force $\\mathbf N$'], ['purple', 'tension $\\mathbf T$'], ['orange', 'your push $\\mathbf P$'], ['pink', 'net force $m\\mathbf a$']]);
        v.readout(() => st && `$m=2$ kg. $N = ${v.fix(st.N, 2)}$ N (gravity alone would need $mg\\cos\\theta = ${v.fix(st.Ngrav, 2)}$ N; your push adds ${v.fix(-st.Pn, 2)} N across the surface)` + (st.rope ? ` · $T = ${v.fix(st.T, 2)}$ N` : '') + ` · acceleration along the slope $${v.fix(st.as, 3)}$ m/s², across it $${v.fix(st.an, 3)}$ m/s²` + (st.lift ? ' — **off the surface**.' : st.slack ? ' — **rope slack**.' : '.'));
      },
    },
    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15',
      kind: 'Law',
      name: 'Coulomb friction: static and kinetic',
      credit: 'Amontons, 1699; Coulomb, 1785',
      statement: String.raw`Between two dry surfaces pressed together with normal force $N$, the friction force $f$ lies in the contact plane and
- while they **stick**, takes whatever value (up to $|f|\le\mu_sN$) is needed to prevent sliding;
- while they **slide**, has magnitude $\mu_kN$ and opposes the relative velocity,

with coefficients $0\le\mu_k\le\mu_s$ that depend on the materials but, to a first approximation, not on the contact area or the sliding speed. A block on an incline therefore stays put until $\tan\theta=\mu_s$ and then slides with acceleration $g(\sin\theta-\mu_k\cos\theta)$.`,
      scope: String.raw`An empirical law for dry, unlubricated contact at moderate loads and speeds. It fails for lubricated or very clean surfaces, rubber (area- and speed-dependent), very low speeds (creep, rate-and-state friction) and microscopic contacts.`,
      idea: String.raw`Static friction is a constraint force like the normal force (1.14): it adjusts to keep the relative acceleration zero, but only up to a ceiling. On an incline, sticking requires $mg\sin\theta\le\mu_s mg\cos\theta$, i.e. $\tan\theta\le\mu_s$. Once sliding starts the friction drops to $\mu_kN<\mu_sN$, so the block lurches — the origin of stick–slip phenomena from squeaking doors to earthquakes.`,
      caption: String.raw`Press play: the incline tilts slowly. The block sticks while the friction (blue dot, right panel) grows exactly as large as the pull $mg\sin\theta$ along the diagonal; when it reaches the static ceiling $\mu_s mg\cos\theta$ the block breaks free, the friction drops to the kinetic level and the block accelerates. Move the $\mu$ sliders; with $\mu_k=\mu_s$ there is no drop.`,
      deps: ['mech-1.14'],
      refs: ['Taylor §1.6'],
      tags: ['friction', 'forces'],
      viz(v) {
        const D2R = Math.PI / 180;
        const mus = v.slider('$\\mu_s$', 0.1, 1, 0.6, { step: 0.01 });
        const muk = v.slider('$\\mu_k$', 0.05, 1, 0.4, { step: 0.01 });
        const s = v.stage({ x: [-2.4, 2.4], y: [-1, 2.6], equal: true, height: 330, axes: false, weight: 1.2 });
        const f = v.stage({ x: [0, 0.85], y: [0, 0.75], height: 330, axes: 'box', xlabel: 'pull / mg = sin θ', ylabel: 'friction / mg', title: 'friction vs applied force', weight: 1 });
        const RATE = 5 * D2R, TEND = 10, L = 3.2; // tilt rate (rad/s), duration (s), slope length (m)
        let key = '', sim = null, st = null;
        // integrate the block's slope coordinate with the stick/slip friction law (explicit, dt = 1 ms)
        const run = (ms, mk) => {
          const dt = 0.001, out = { t: [], th: [], x: [], v: [], f: [], slip: null };
          let x = 0, vv = 0, sticking = true;
          for (let t = 0; t <= TEND; t += dt) {
            const th = Math.min(RATE * t, 50 * D2R), pull = Math.sin(th), Nn = Math.cos(th); // per unit mg
            let fr;
            if (sticking) {
              if (pull <= ms * Nn) fr = pull; else { sticking = false; if (out.slip == null) out.slip = { t, th }; fr = mk * Nn; }
            } else fr = mk * Nn;
            if (!sticking && x < L) { const a = G0 * (pull - fr); vv += a * dt; x += vv * dt; }
            if (x >= L) { x = L; }
            out.t.push(t); out.th.push(th); out.x.push(x); out.v.push(vv); out.f.push(fr);
          }
          return out;
        };
        v.animate((t) => {
          const ms = mus.value, mk = Math.min(muk.value, ms);
          const kk = ms + ':' + mk;
          if (kk !== key) { key = kk; sim = run(ms, mk); }
          const tau = Math.min((t + 5) % (TEND + 1.5), TEND), i = Math.min(sim.t.length - 1, Math.round(tau / 0.001));
          const th = sim.th[i], x = sim.x[i], fr = sim.f[i], vv = sim.v[i];
          const i2 = Math.min(sim.t.length - 1, i + 20), i1 = Math.max(0, i - 20), aMeas = (sim.v[i2] - sim.v[i1]) / ((i2 - i1) * 0.001);
          st = { th, slip: sim.slip, sliding: sim.slip && tau >= sim.slip.t, aMeas, aPred: G0 * (Math.sin(th) - mk * Math.cos(th)), ms, mk, off: x >= L };
          // incline hinged at the right
          const hinge = [2.2, -0.8], Ls = 4.2, up = [-Math.cos(th), Math.sin(th)], down = [Math.cos(th), -Math.sin(th)], out = [Math.sin(th), Math.cos(th)];
          const topP = [hinge[0] + up[0] * Ls, hinge[1] + up[1] * Ls];
          s.poly([hinge, topP, [topP[0], hinge[1]]], { fill: 'muted', fillAlpha: 0.2, color: 'muted' });
          s.hline(-0.8, { color: 'faint', width: 2 });
          const sb = 0.5 + x, bs = 0.38, foot = [topP[0] + down[0] * sb, topP[1] + down[1] * sb], c = [foot[0] + out[0] * bs / 2, foot[1] + out[1] * bs / 2];
          const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [c[0] + (a * down[0] + b * out[0]) * bs / 2, c[1] + (a * down[1] + b * out[1]) * bs / 2]);
          s.poly(corners, { fill: st.sliding ? 'red' : 'accent', fillAlpha: 0.5, color: st.sliding ? 'red' : 'accent' });
          const kf = 0.9;
          vec(s, c, [Math.sin(th) * down[0], Math.sin(th) * down[1]], kf, { color: 'ink' });
          vec(s, [foot[0], foot[1]], [-fr * down[0], -fr * down[1]], kf, { color: 'blue', width: 3 });
          s.text(`θ = ${v.fix(th / D2R, 1)}°`, hinge[0] - 1.1, hinge[1] + 0.12, { color: 'muted', size: 12 });
          s.corner(st.sliding ? (st.off ? 'slid off the end' : 'slipping') : 'sticking', 'tl', { color: st.sliding ? 'red' : 'green', weight: 600 });
          // friction vs applied force
          f.path(sim.th.filter((q, j) => j % 10 === 0).map((q) => [Math.sin(q), ms * Math.cos(q)]), { color: 'orange', width: 1.4, dash: [5, 4] });
          f.path(sim.th.filter((q, j) => j % 10 === 0).map((q) => [Math.sin(q), mk * Math.cos(q)]), { color: 'purple', width: 1.4, dash: [5, 4] });
          const tr = []; for (let j = 0; j <= i; j += 10) tr.push([Math.sin(sim.th[j]), sim.f[j]]);
          f.path(tr, { color: 'blue', width: 2.6 });
          f.dot(Math.sin(th), fr, { r: 6, color: 'blue' });
          f.text('static ceiling μₛ cos θ', 0.12, ms * Math.cos(Math.asin(0.12)), { color: 'orange', size: 11, dy: -10 });
          f.text('kinetic μₖ cos θ', 0.12, mk * Math.cos(Math.asin(0.12)), { color: 'purple', size: 11, dy: -10 });
        }, { still: 7 });
        v.legend([['ink', 'pull along slope $mg\\sin\\theta$'], ['blue', 'friction'], ['orange', '$\\mu_s N$', { dash: true }], ['purple', '$\\mu_k N$', { dash: true }]]);
        v.readout(() => st && (`$\\theta = ${v.fix(st.th / D2R, 2)}°$. ` + (st.slip ? `Slip began at $\\theta = ${v.fix(st.slip.th / D2R, 2)}°$ vs $\\arctan\\mu_s = ${v.fix(Math.atan(st.ms) / D2R, 2)}°$ (tilt step 0.05°). ` : `Not yet slipping: $\\tan\\theta < \\mu_s$. `) + (st.sliding && !st.off ? `Measured acceleration $${v.fix(st.aMeas, 3)}$ m/s² vs $g(\\sin\\theta-\\mu_k\\cos\\theta) = ${v.fix(st.aPred, 3)}$ m/s².` : '') + (muk.value > mus.value ? ' ($\\mu_k$ is capped at $\\mu_s$.)' : '')));
      },
    },
    // ------------------------------------------------------------------ 1.16
    {
      num: '1.16',
      kind: 'Model',
      name: 'Atwood machine',
      credit: 'Atwood, 1784',
      statement: String.raw`Two masses $m_1>m_2$ hang from an inextensible massless string over a pulley. If the pulley is massless and frictionless the string has a single tension and the masses accelerate at
$$a=\frac{m_1-m_2}{m_1+m_2}\,g,\qquad T=\frac{2m_1m_2}{m_1+m_2}\,g,$$
with $m_2g<T<m_1g$. A pulley of moment of inertia $I$ and radius $R$ adds $I/R^2$ to the denominator of $a$, and then the tensions on the two sides differ: $T_1-T_2=Ia/R^2$.`,
      scope: String.raw`Assumes an inextensible string that does not slip on the pulley, a frictionless axle and negligible air resistance. Atwood built it to slow free fall down to a measurable rate.`,
      idea: String.raw`Apply the second law (1.6) to each mass along the string, $m_1a=m_1g-T_1$ and $m_2a=T_2-m_2g$; the string constraint (1.14) makes the accelerations equal and opposite, and the pulley's rotation gives $I\,a/R=R(T_1-T_2)$. Adding eliminates the tensions. The weight difference drives the whole system's inertia, which is why $a$ can be made as small as one likes.`,
      caption: String.raw`Choose the masses and the pulley's mass. The string is simulated honestly as a very stiff, slightly damped spring (no constraint is imposed), so the tension *emerges* from the dynamics. The measured acceleration (a least-squares fit of the simulated motion) and the mean tensions agree with the formulas, and the tension stays between the two weights.`,
      deps: ['mech-1.6', 'mech-1.14'],
      refs: ['Goldstein §1.6'],
      tags: ['forces', 'constraints'],
      viz(v) {
        const m1s = v.slider('$m_1$ (kg)', 0.5, 5, 3, { step: 0.05 });
        const m2s = v.slider('$m_2$ (kg)', 0.5, 5, 2, { step: 0.05 });
        const Ms = v.slider('pulley mass $M$ (kg)', 0, 4, 0, { step: 0.05 });
        const s = v.stage({ x: [-1.2, 1.2], y: [-2.3, 0.45], equal: true, height: 360, axes: false, weight: 0.8 });
        const pl = v.stage({ x: [0, 2], y: [0, 50], height: 360, axes: 'box', xlabel: 't (s)', ylabel: 'tension (N)', title: 'rope tensions from the simulation', weight: 1.3 });
        const R = 0.18, K = 2e4, TEND = 2;
        let key = '', sim = null, st = null;
        // state: [z1, z2, φ, z1', z2', φ'] (z down-positive); stiff-spring rope segments with internal damping
        const run = (m1, m2, Mp) => {
          const I = 0.5 * Mp * R * R, c1 = 2 * 0.3 * Math.sqrt(K * m1), c2 = 2 * 0.3 * Math.sqrt(K * m2);
          const massless = Mp < 1e-6;
          const tens = (y) => {
            if (massless) { const e = y[0] + y[1], ed = y[3] + y[4], T = Math.max(0, K * e + 0.5 * (c1 + c2) * ed); return [T, T]; }
            const e1 = y[0] - R * y[2], e2 = y[1] + R * y[2], e1d = y[3] - R * y[5], e2d = y[4] + R * y[5];
            return [Math.max(0, K * e1 + c1 * e1d), Math.max(0, K * e2 + c2 * e2d)];
          };
          const F = (y) => { const [T1, T2] = tens(y); return [y[3], y[4], y[5], G0 - T1 / m1, G0 - T2 / m2, massless ? 0 : R * (T1 - T2) / I]; };
          // start at rest with each segment pre-stretched to the static tension of its own weight average
          const T0 = 2 * m1 * m2 * G0 / (m1 + m2);
          let y = massless ? [T0 / K / 2, T0 / K / 2, 0, 0, 0, 0] : [T0 / K, T0 / K, 0, 0, 0, 0];
          const dt = 2e-4, out = { t: [], z1: [], z2: [], phi: [], T1: [], T2: [], dt };
          const add = (a, b, h) => a.map((x, i) => x + h * b[i]);
          for (let n = 0, t = 0; t <= TEND; n++, t = n * dt) {
            if (n % 10 === 0) { const [T1, T2] = tens(y); out.t.push(t); out.z1.push(y[0]); out.z2.push(y[1]); out.phi.push(y[2]); out.T1.push(T1); out.T2.push(T2); }
            if (Math.abs(y[0]) > 0.95 || Math.abs(y[1]) > 0.95) { out.stop = t; break; }
            const k1 = F(y), k2 = F(add(y, k1, dt / 2)), k3 = F(add(y, k2, dt / 2)), k4 = F(add(y, k3, dt));
            y = y.map((x, i) => x + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
          }
          // least-squares fit z1(t) ≈ z0 + v0 t + a t²/2 over the run (after the first 0.1 s of rope ringing)
          let S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0], Tm1 = 0, Tm2 = 0, cnt = 0;
          out.t.forEach((t, i) => { if (t < 0.1) return; const r = [1, t, t * t / 2]; for (let p = 0; p < 3; p++) { b[p] += r[p] * out.z1[i]; for (let q = 0; q < 3; q++) S[p][q] += r[p] * r[q]; } Tm1 += out.T1[i]; Tm2 += out.T2[i]; cnt++; });
          const sol = v.M.solve(S, b);
          out.a = sol[2]; out.Tm1 = Tm1 / cnt; out.Tm2 = Tm2 / cnt; out.I = I;
          return out;
        };
        v.animate((t) => {
          const m1 = m1s.value, m2 = m2s.value, Mp = Ms.value, kk = [m1, m2, Mp].join();
          if (kk !== key) { key = kk; sim = run(m1, m2, Mp); }
          const I = 0.5 * Mp * R * R, aP = (m1 - m2) * G0 / (m1 + m2 + I / (R * R)), T1P = m1 * (G0 - aP), T2P = m2 * (G0 + aP);
          st = { a: sim.a, aP, T1: sim.Tm1, T2: sim.Tm2, T1P, T2P, m1, m2 };
          const tEnd = sim.t[sim.t.length - 1], tau = Math.min(t % (tEnd + 1), tEnd);
          const z1 = sampleAt(sim.t, sim.z1, tau), z2 = sampleAt(sim.t, sim.z2, tau), phi = sampleAt(sim.t, sim.phi, tau);
          // apparatus
          s.line(-0.5, 0.35, 0.5, 0.35, { color: 'ink', width: 3 }); s.line(0, 0.35, 0, 0, { color: 'ink', width: 2 });
          s.circle(0, 0, R, { fill: 'muted', fillAlpha: 0.25 + 0.15 * Math.min(1, Mp / 2), color: 'ink', width: 1.6 });
          for (let k = 0; k < 3; k++) { const a = (Mp > 0 ? phi : (z1 - z2) / 2) / R + k * Math.PI / 3; s.line(-R * Math.cos(a), R * Math.sin(a), R * Math.cos(a), -R * Math.sin(a), { color: 'ink', width: 1 }); }
          const y1 = -1.0 - z1, y2 = -1.0 - z2, b1 = 0.16 * Math.cbrt(m1), b2 = 0.16 * Math.cbrt(m2);
          s.line(-R, 0, -R, y1 + b1, { color: 'ink', width: 1.4 }); s.line(R, 0, R, y2 + b2, { color: 'ink', width: 1.4 });
          s.rect(-R - b1, y1 - b1, -R + b1, y1 + b1, { fill: 'blue', fillAlpha: 0.75, color: 'blue' });
          s.rect(R - b2, y2 - b2, R + b2, y2 + b2, { fill: 'purple', fillAlpha: 0.75, color: 'purple' });
          s.tex('m_1', -R, y1, { color: 'panel', align: 'center', baseline: 'middle', size: 13 });
          s.tex('m_2', R, y2, { color: 'panel', align: 'center', baseline: 'middle', size: 13 });
          // tensions over time
          const top = Math.max(m1, m2) * G0 * 1.25;
          pl.setView([0, Math.max(tEnd, 0.3)], [0, top]);
          pl.hline(m1 * G0, { color: 'blue', dash: [6, 4], width: 1.2 }); pl.hline(m2 * G0, { color: 'purple', dash: [6, 4], width: 1.2 });
          pl.text('m₁g', Math.max(tEnd, 0.3), m1 * G0, { color: 'blue', size: 12, align: 'right', dy: -10 });
          pl.text('m₂g', Math.max(tEnd, 0.3), m2 * G0, { color: 'purple', size: 12, align: 'right', dy: 12 });
          pl.hline(T1P, { color: 'green', width: 1.2, dash: [2, 3] }); if (Mp > 0) pl.hline(T2P, { color: 'green', width: 1.2, dash: [2, 3] });
          pl.path(sim.t.map((q, i) => [q, sim.T1[i]]), { color: 'blue', width: 4, alpha: 0.6 });
          pl.path(sim.t.map((q, i) => [q, sim.T2[i]]), { color: 'purple', width: 1.8, dash: [6, 4] });
          pl.vline(tau, { color: 'gold', width: 1.4 });
        }, { still: 0.6 });
        v.legend([['blue', 'tension on $m_1$'], ['purple', 'tension on $m_2$'], ['green', 'predicted tension(s)'], ['gold', 'now']]);
        v.readout(() => st && `Fitted acceleration of $m_1$: $${v.fix(st.a, 4)}$ m/s² vs $\\dfrac{(m_1-m_2)g}{m_1+m_2+I/R^2} = ${v.fix(st.aP, 4)}$ m/s² · mean tensions $${v.fix(st.T1, 3)}$ / $${v.fix(st.T2, 3)}$ N vs $${v.fix(st.T1P, 3)}$ / $${v.fix(st.T2P, 3)}$ N · weights $m_1g = ${v.fix(st.m1 * G0, 2)}$ N, $m_2g = ${v.fix(st.m2 * G0, 2)}$ N.`);
      },
    },
    // ------------------------------------------------------------------ 1.17
    {
      num: '1.17',
      kind: 'Law',
      name: 'Newton’s law of universal gravitation',
      credit: 'Newton, 1687',
      statement: String.raw`Every two point masses attract each other along the line joining them with a force proportional to the product of the masses and inversely proportional to the square of their distance:
$$\mathbf F_{12}=-\frac{Gm_1m_2}{|\mathbf r_1-\mathbf r_2|^2}\,\frac{\mathbf r_1-\mathbf r_2}{|\mathbf r_1-\mathbf r_2|},\qquad G\approx6.674\times10^{-11}\ \mathrm{N\,m^2/kg^2}.$$
Forces from several masses add as vectors; equivalently a mass $m$ at $\mathbf r$ feels $m\mathbf g(\mathbf r)$ in the field $\mathbf g=-\nabla\Phi$, $\Phi(\mathbf r)=-\sum_i Gm_i/|\mathbf r-\mathbf r_i|$.`,
      scope: String.raw`Holds for point masses, and outside spherically symmetric bodies (shell theorem), when fields are weak and speeds small compared with $c$. General relativity corrects it near compact masses and at high precision (e.g. Mercury's perihelion).`,
      idea: String.raw`Newton matched the Moon's centripetal acceleration (1.3) with the fall of an apple scaled by $1/r^2$ (the Moon is about 60 Earth radii away, and $9.8/60^2\approx0.0027$ m/s²), and derived Kepler's laws from the inverse square. The force is central and obeys the strong third law (1.7). Far from a cluster of masses the field looks like that of a single point mass at its centre of mass.`,
      caption: String.raw`Drag the masses and the gold test mass; arrows show the field and contours the potential. The readout compares the force at the test mass with the force at twice the distance from the centre of mass along the same ray: for one mass the ratio is exactly 4. Switch on a second mass: close to the pair the field is not inverse-square, but the log–log plot on the right shows $|\mathbf g|\,r^2$ settling to $GM_{\rm tot}$ far away.`,
      deps: ['mech-1.6', 'mech-1.7'],
      refs: ['Arnold §3'],
      tags: ['gravity', 'forces'],
      viz(v) {
        const M = v.M;
        const two = v.select('', [{ value: 'one', label: 'one mass' }, { value: 'two', label: 'two masses' }], 'one');
        const s = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, height: 340, axes: false, weight: 1.35 });
        const lg = v.stage({ x: [0.2, 40], y: [1e-3, 30], xlog: true, ylog: true, height: 340, axes: 'box', xlabel: 'r (from c.m.)', ylabel: '|g|', title: 'field strength along the ray', weight: 1 });
        const F = v.fields(s, {
          law: '3d', G: 1, sources: [{ type: 'mass', x: -0.6, y: 0, m: 1, label: 'M₁' }, { type: 'mass', x: 0.9, y: 0.3, m: 0.6, label: 'M₂' }],
          lines: false, arrows: true, equipotentials: { n: 14 }, heat: 'magnitude',
        });
        const test = s.handle(1.6, -1.2, { color: 'gold', label: 'm', constrain: { x: [-2.9, 2.9], y: [-2.1, 2.1] } });
        let lastMode = null, st = null;
        v.render(() => {
          const isTwo = two.value === 'two';
          if (lastMode !== two.value) { lastMode = two.value; F.setStrength(1, isTwo ? 0.6 : 0); if (F.handles[1]) F.handles[1].visible = isTwo; }
          F.draw();
          const src = F.live().filter((q) => (q.m ?? 0) > 0), Mt = src.reduce((a, q) => a + q.m, 0);
          const cm = [src.reduce((a, q) => a + q.m * q.x, 0) / Mt, src.reduce((a, q) => a + q.m * q.y, 0) / Mt];
          const P = [test.x, test.y], d = [P[0] - cm[0], P[1] - cm[1]], r = vlen(d) || 1e-9, u = [d[0] / r, d[1] / r];
          const g1 = F.field(P[0], P[1]), P2 = [cm[0] + 2 * r * u[0], cm[1] + 2 * r * u[1]], g2 = F.field(P2[0], P2[1]);
          st = { g1: vlen(g1), g2: vlen(g2), r, Mt, isTwo };
          s.line(cm[0], cm[1], cm[0] + 3.5 * r * u[0], cm[1] + 3.5 * r * u[1], { color: 'muted', dash: [3, 4], width: 1 });
          s.dot(cm[0], cm[1], { r: 3.5, color: 'ink', label: 'c.m.', labelPos: 'sw' });
          const k = 0.8 / Math.max(vlen(g1), 1e-9); // the test-mass arrow is drawn 0.8 long; the 2r arrow at the same scale
          vec(s, P, g1, k, { color: 'gold', width: 3 });
          s.dot(P2[0], P2[1], { r: 4, color: 'orange', hollow: true, label: '2r', labelPos: 'ne' });
          vec(s, P2, g2, k, { color: 'orange', width: 2.4 });
          // log–log profile along the ray
          const rs = []; for (let q = 0; q <= 120; q++) rs.push(0.2 * Math.pow(200, q / 120));
          lg.path(rs.map((q) => { const g = F.field(cm[0] + q * u[0], cm[1] + q * u[1]); const val = vlen(g); return isFinite(val) && val > 0 ? [q, val] : null; }), { color: 'accent', width: 2.2 });
          lg.fn((q) => Mt / (q * q), { color: 'orange', dash: [6, 4], width: 1.6 });
          lg.dot(r, vlen(g1), { r: 6, color: 'gold' });
          lg.dot(2 * r, vlen(g2), { r: 5, color: 'orange', hollow: true });
        });
        F.legend([['gold', 'force on the test mass'], ['orange', 'at twice the distance'], ['accent', '$|\\mathbf g|$ along the ray'], ['orange', '$GM_{\\rm tot}/r^2$', { dash: true }]]);
        v.readout(() => st && `Units $G = M_1 = 1$. At $r = ${v.fix(st.r, 3)}$: $|\\mathbf g| = ${v.fix(st.g1, 4)}$; at $2r$: $${v.fix(st.g2, 4)}$; ratio $${v.fix(st.g1 / st.g2, 4)}$` + (st.isTwo ? ` (→ 4 far away; $|\\mathbf g|r^2/GM_{\\rm tot} = ${v.fix(st.g1 * st.r * st.r / st.Mt, 4)}$)` : ' — exactly 4') + `. In SI, at the Earth's surface $GM_\\oplus/R_\\oplus^2 = ${v.fix(v.M.CONST.G * v.M.CONST.Mearth / v.M.CONST.Rearth ** 2, 3)}$ m/s², at $2R_\\oplus$: $${v.fix(v.M.CONST.G * v.M.CONST.Mearth / (2 * v.M.CONST.Rearth) ** 2, 3)}$ m/s².`);
      },
    },
    // ------------------------------------------------------------------ 1.18
    {
      num: '1.18',
      kind: 'Model',
      name: 'Charged particle in a uniform magnetic field',
      statement: String.raw`A particle of charge $q$ and mass $m$ in a uniform magnetic field $\mathbf B=B\hat{\mathbf z}$ feels the force $q\mathbf v\times\mathbf B$. It moves on a **helix**: uniformly along $\mathbf B$, and on a circle of radius $r_L=mv_\perp/(|q|B)$ (the Larmor radius) across it, with the **cyclotron frequency** $\omega_c=|q|B/m$ — independent of the speed. With an additional uniform electric field $\mathbf E\perp\mathbf B$, the centre of the circle (the guiding centre) drifts with velocity
$$\mathbf v_d=\frac{\mathbf E\times\mathbf B}{B^2},$$
whatever the sign of the charge.`,
      scope: String.raw`Non-relativistic ($v\ll c$; otherwise $\omega_c=|q|B/(\gamma m)$), uniform static fields, radiation losses neglected. The basis of cyclotrons, mass spectrometers, magnetic confinement and the aurora.`,
      idea: String.raw`The magnetic force is perpendicular to $\mathbf v$, so it does no work and $|\mathbf v|$ is constant; its component along $\mathbf B$ vanishes, so $v_\parallel$ is constant. Across $\mathbf B$ the force has constant size $|q|v_\perp B$ and always points sideways — uniform circular motion (1.3) with $mv_\perp^2/r=|q|v_\perp B$, giving $r_L$ and $\omega_c=v_\perp/r_L$. In a frame moving at $\mathbf v_d$ the electric field disappears ($\mathbf E+\mathbf v_d\times\mathbf B=0$), so the motion is a circle carried along at $\mathbf v_d$.`,
      caption: String.raw`Drag the blue handle to set the initial velocity in 3D (drag the background to rotate). The path is integrated with the Boris scheme. The readout measures the cyclotron period from the simulation — change the speed and it does not move. Add a crossed electric field: the guiding centre (green) drifts at $E/B$, perpendicular to both fields; the right panel shows the projection across $\mathbf B$, a cycloid-like curve.`,
      deps: ['mech-1.6', 'mech-1.3'],
      see: ['em-7.1'],
      refs: ['Taylor §2.5', 'Taylor §2.7'],
      tags: ['electromagnetism', 'circular motion'],
      viz(v) {
        const M = v.M;
        const Es = v.slider('electric field $E$ (units of $B\\cdot$[speed])', 0, 0.12, 0, { step: 0.005 });
        const S = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, axes: false, height: 380, weight: 1.3 });
        const P2 = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: true, height: 380, title: 'projection across $\\mathbf B$ (x–y plane)', weight: 1 });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.32, axis: 1.9, lim: 2.6, labels: ['x', 'y', 'z'] });
        const TC = 2 * Math.PI, NT = 3, dt = TC / 240; // ω_c = qB/m = 1 → period 2π
        // The particle starts at r0, chosen so that its guiding centre starts on the z-axis (shifted by half the
        // drift); the handle is the tip of the initial velocity drawn from r0, i.e. h = r0 + v0 (an affine map of v0).
        let v0 = [0.8, 0, 0.12];
        const Tdraw = (vz) => Math.min(NT * TC, 1.7 / Math.max(1e-9, Math.abs(vz)));
        const start = (u, E) => [-(u[1] + E), u[0] + E * Tdraw(u[2]) / 2, 0];
        const hv = sc.handle(M.vadd(start(v0, 0), v0), {
          color: 'accent', label: 'v₀', lim: 2.6,
          snap: (p) => { const E = Es.value, T = Tdraw(p[2]), a = p[0] + E, b = p[1] - E * T / 2; v0 = [(a + b) / 2, (b - a) / 2, p[2]]; return p; },
        });
        let key = '', sim = null, st = null;
        // Boris pusher for q/m = 1, B = ẑ, E = E x̂
        const run = (u0, r0, E, n) => {
          const xs = [r0.slice()], us = [u0.slice()], ts = [0];
          let x = r0.slice(), u = u0.slice();
          const tb = dt / 2, sfac = 2 * tb / (1 + tb * tb);
          for (let i = 0; i < n; i++) {
            const vm = [u[0] + E * dt / 2, u[1], u[2]];
            const vp = [vm[0] + vm[1] * tb, vm[1] - vm[0] * tb, vm[2]];          // v' = v⁻ + v⁻ × t, t = (0, 0, tb)
            const vq = [vm[0] + vp[1] * sfac, vm[1] - vp[0] * sfac, vm[2]];      // v⁺ = v⁻ + v' × s
            u = [vq[0] + E * dt / 2, vq[1], vq[2]];
            x = [x[0] + u[0] * dt, x[1] + u[1] * dt, x[2] + u[2] * dt];
            xs.push(x); us.push(u); ts.push((i + 1) * dt);
          }
          return { xs, us, ts };
        };
        v.animate((t) => {
          const E = Es.value, r0 = start(v0, E), kk = [...v0, E].join();
          if (!hv.h.dragging) hv.p = M.vadd(r0, v0);
          if (kk !== key) { key = kk; sim = run(v0, r0, E, Math.round(NT * TC / dt)); }
          const { xs, us, ts } = sim, n = xs.length;
          // measurements on whole turns: period from upward zero crossings of v_x, drift from the y-displacement
          const ups = [];
          for (let i = 1; i < n; i++) { const a = us[i - 1][0], b = us[i][0]; if (a < 0 && b >= 0) ups.push(ts[i - 1] + dt * (-a / (b - a))); }
          const Tm = ups.length >= 2 ? (ups[ups.length - 1] - ups[0]) / (ups.length - 1) : NaN;
          const drift = (xs[n - 1][1] - xs[0][1]) / ts[n - 1];
          const xmin = Math.min(...xs.map((p) => p[0])), xmax = Math.max(...xs.map((p) => p[0]));
          st = { Tm, drift, E, rL: (xmax - xmin) / 2, rad: Math.hypot(v0[0], v0[1] + E), sp: M.norm(v0) };
          // guiding centre r + ((v − v_d)_y, −(v − v_d)_x), with v_d = (0, −E)
          const gc = (j) => [xs[j][0] + us[j][1] + E, xs[j][1] - us[j][0], xs[j][2]];
          const nd = Math.min(n, Math.round(Tdraw(v0[2]) / dt) + 1);
          sc.begin();
          for (const [gx, gy] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) sc.arrow([gx, gy, -1.8], [gx, gy, 1.8], { color: 'teal', width: 1.4, head: 7, alpha: 0.5, top: false });
          sc.tex('\\mathbf B', [1.6, 1.6, 1.95], { color: 'teal' });
          if (E > 0) { sc.arrow([-1.9, -1.9, -1.8], [-0.9, -1.9, -1.8], { color: 'red', width: 2 }); sc.tex('\\mathbf E', [-0.8, -1.9, -1.8], { color: 'red' }); }
          sc.path(xs.slice(0, nd).filter((p, i) => i % 2 === 0), { color: 'accent', width: 2 });
          sc.path(xs.slice(0, nd).map((_, j) => j).filter((j) => j % 8 === 0).map(gc), { color: 'green', width: 2, dash: [5, 4] });
          const i = Math.min(nd - 1, Math.round((t % Tdraw(v0[2])) / dt));
          sc.dot(xs[i], { r: 6, color: 'gold' });
          sc.dot(r0, { r: 3, color: 'ink' });
          sc.arrow(r0, M.vadd(r0, v0), { color: 'accent', width: 1.6 });
          sc.flush();
          // projection across B (all three turns)
          const q2 = xs.map((p) => [p[0], p[1]]);
          const R2 = Math.max(1, ...q2.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])))) * 1.12;
          P2.setView([-R2, R2], [-R2, R2]);
          P2.path(q2, { color: 'accent', width: 1.8 });
          P2.path(xs.map((_, j) => j).filter((j) => j % 4 === 0).map((j) => gc(j).slice(0, 2)), { color: 'green', width: 2, dash: [5, 4] });
          P2.dot(q2[i][0], q2[i][1], { r: 5, color: 'gold' });
        }, { still: 5 });
        v.legend([['accent', 'trajectory (Boris integrator)'], ['green', 'guiding centre', { dash: true }], ['teal', '$\\mathbf B$'], ['red', '$\\mathbf E$']]);
        v.readout(() => st && `Units $q/m = B = 1$. Speed $|\\mathbf v_0| = ${v.fix(st.sp, 3)}$: measured cyclotron period $${v.fix(st.Tm, 4)}$ vs $2\\pi m/(qB) = ${v.fix(2 * Math.PI, 4)}$ — independent of speed · Larmor radius measured $${v.fix(st.rL, 3)}$ vs $v_\\perp/\\omega_c = ${v.fix(st.rad, 3)}$ (in the drift frame) · drift speed $${v.fix(Math.abs(st.drift), 4)}$ vs $E/B = ${v.fix(st.E, 4)}$, along $-\\hat{\\mathbf y} = \\hat{\\mathbf E}\\times\\hat{\\mathbf B}$. For an electron in $B = 1$ mT: $T_c = 2\\pi m_e/(eB) =$ ${v.M.si(2 * Math.PI * v.M.CONST.me / (v.M.CONST.e * 1e-3), 's')}.`);
      },
    },
  ],
};
