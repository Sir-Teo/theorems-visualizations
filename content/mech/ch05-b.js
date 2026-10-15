// Classical Mechanics — Chapter 5: The calculus of variations (part b: 5.8–5.14)

// ── shared helpers ────────────────────────────────────────────────────────────
const G = 9.81;
const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }
const sample = (f, n) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
/** Simpson's rule with n (even) intervals. */
function simpson(f, a, b, n = 400) { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3; }
/** Root of g on [a, b] by bisection (g(a), g(b) of opposite signs). */
function bisect(g, a, b, n = 70) { let ga = g(a); for (let i = 0; i < n; i++) { const m = (a + b) / 2, gm = g(m); if ((gm > 0) === (ga > 0)) { a = m; ga = gm; } else b = m; } return (a + b) / 2; }
/** Golden-section maximiser of a unimodal f on [a, b]. */
function goldenMax(f, a, b, n = 60) {
  const r = (Math.sqrt(5) - 1) / 2; let c = b - r * (b - a), d = a + r * (b - a), fc = f(c), fd = f(d);
  for (let i = 0; i < n; i++) { if (fc > fd) { b = d; d = c; fd = fc; c = b - r * (b - a); fc = f(c); } else { a = c; c = d; fc = fd; d = a + r * (b - a); fd = f(d); } }
  return (a + b) / 2;
}
/** Range [lo, hi] of several arrays, padded, with a minimum span. */
function span(arrs, pad = 0.1, minSpan = 1e-9) {
  let lo = Infinity, hi = -Infinity;
  for (const a of arrs) for (const y of a) { if (!isFinite(y)) continue; if (y < lo) lo = y; if (y > hi) hi = y; }
  if (!isFinite(lo)) { lo = -1; hi = 1; }
  if (hi - lo < minSpan) { const c = (hi + lo) / 2; lo = c - minSpan / 2; hi = c + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
/** Complete elliptic integral of the first kind K(k) by the arithmetic–geometric mean. */
function ellipK(k) { let a = 1, b = Math.sqrt(1 - k * k); for (let i = 0; i < 30; i++) { const t = (a + b) / 2; b = Math.sqrt(a * b); a = t; } return Math.PI / (2 * a); }
const v3 = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], sc: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]] };
v3.norm = (a) => Math.hypot(a[0], a[1], a[2]); v3.unit = (a) => v3.sc(a, 1 / v3.norm(a));

/** Arc-length table of a polyline, point at arc length s, and tangential gravity −g dy/ds there. */
function arcTable(pts) { const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, s, L: s[s.length - 1] }; }
function segOf(tab, s) { const S = tab.s; let lo = 0, hi = S.length - 1; if (s <= 0) return 0; if (s >= S[hi]) return hi - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; } return lo; }
function pointAt(tab, s) { const i = segOf(tab, s), ds = tab.s[i + 1] - tab.s[i], w = ds > 0 ? clamp((s - tab.s[i]) / ds, 0, 1) : 0, p = tab.pts[i], q = tab.pts[i + 1]; return [p[0] + (q[0] - p[0]) * w, p[1] + (q[1] - p[1]) * w]; }
function gAlong(tab, s) { const i = segOf(tab, s), ds = tab.s[i + 1] - tab.s[i]; return ds > 0 ? (-G * (tab.pts[i + 1][1] - tab.pts[i][1])) / ds : 0; }
/**
 * A bead released from rest at arc length s0 in a bowl (bottom at sBot): RK4 in time on s'' = −g dy/ds.
 * Returns the record s(t) (every `every` steps) and the first arrival time at the bottom (interpolated).
 */
function bowlRun(tab, s0, sBot, { dt = 2e-4, tmax = 4.2, every = 10 } = {}) {
  let s = s0, u = 0, t = 0, Tb = null; const rec = [s0], a = (x) => gAlong(tab, x);
  for (let n = 1; t < tmax; n++) {
    const k1u = a(s), k2s = u + (dt / 2) * k1u, k2u = a(s + (dt / 2) * u), k3s = u + (dt / 2) * k2u, k3u = a(s + (dt / 2) * k2s), k4s = u + dt * k3u, k4u = a(s + dt * k3s);
    const s1 = s + (dt / 6) * (u + 2 * k2s + 2 * k3s + k4s), u1 = u + (dt / 6) * (k1u + 2 * k2u + 2 * k3u + k4u);
    if (Tb == null && (s - sBot) * (s1 - sBot) <= 0 && s !== sBot) Tb = t + (dt * (s - sBot)) / (s - s1);
    s = s1; u = u1; t += dt;
    if (n % every === 0) rec.push(s);
  }
  return { rec, dtRec: dt * every, Tb };
}
function recAt(run, t) { const u = t / run.dtRec, i = clamp(Math.floor(u), 0, run.rec.length - 2); return run.rec[i] + (run.rec[i + 1] - run.rec[i]) * clamp(u - i, 0, 1); }

/** Centripetal Catmull–Rom point between p1 and p2. */
function crPoint(p0, p1, p2, p3, t) {
  const kd = (a, b) => Math.max(1e-6, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
  const t1 = kd(p0, p1), t2 = t1 + kd(p1, p2), t3 = t2 + kd(p2, p3), u = t1 + (t2 - t1) * t;
  const L = (a, b, ta, tb) => { const w = (u - ta) / (tb - ta); return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w]; };
  const A1 = L(p0, p1, 0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
  return L(L(A1, A2, 0, t2), L(A2, A3, t1, t3), t1, t2);
}
/** Smooth curve through P: closed (periodic) or open with reflected phantom ends. */
function spline(P, per = 16, closed = false) {
  const n = P.length, out = [];
  if (closed) { for (let i = 0; i < n; i++) for (let j = 0; j < per; j++) out.push(crPoint(P[(i - 1 + n) % n], P[i], P[(i + 1) % n], P[(i + 2) % n], j / per)); return out; }
  const Q = [[2 * P[0][0] - P[1][0], 2 * P[0][1] - P[1][1]], ...P, [2 * P[n - 1][0] - P[n - 2][0], 2 * P[n - 1][1] - P[n - 2][1]]];
  out.push(P[0].slice());
  for (let i = 1; i < Q.length - 2; i++) for (let j = 1; j <= per; j++) out.push(crPoint(Q[i - 1], Q[i], Q[i + 1], Q[i + 2], j / per));
  return out;
}
const shoelace = (P) => { let A = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; A += p[0] * q[1] - q[0] * p[1]; } return A / 2; };
const perim = (P, closed) => { let L = 0; for (let i = 0; i + 1 < P.length; i++) L += Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); if (closed) L += Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]); return L; };
function hull(P) {
  const pts = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
/** Catenary y = y0 + c cosh((x − x0)/c) of length ℓ through (x1,y1), (x2,y2) with x1 < x2 (needs ℓ > distance). */
function catenaryThrough(x1, y1, x2, y2, ell) {
  const D = x2 - x1, H = y2 - y1, need = Math.sqrt(Math.max(1e-12, ell * ell - H * H));
  const c = Math.exp(bisect((lc) => 2 * Math.exp(lc) * Math.sinh(D / (2 * Math.exp(lc))) - need, Math.log(D) - 8, Math.log(D) + 8, 90));
  const x0 = (x1 + x2) / 2 - c * Math.atanh(H / ell), y0 = y1 - c * Math.cosh((x1 - x0) / c);
  return { c, x0, y0, f: (x) => y0 + c * Math.cosh((x - x0) / c) };
}

export default {
  collection: 'mech',
  chapter: 5,
  items: [
    // ───────────────────────────────────────────────────────────── 5.8
    {
      num: '5.8',
      kind: 'Phenomenon',
      name: 'Tautochrone: the isochronous cycloid',
      credit: 'Christiaan Huygens, 1659 (published 1673)',
      statement: String.raw`On a frictionless track shaped as an inverted cycloid, generated by a circle of radius $R$ (so $x=R(\theta+\sin\theta)$, $y=R(1-\cos\theta)$, $|\theta|\le\pi$), a bead released from rest at **any** height reaches the bottom after the same time
$$T_{1/4}=\pi\sqrt{R/g},$$
and oscillates with period $4\pi\sqrt{R/g}$ independent of amplitude. Measured along the track from the bottom, the arc length $s$ obeys exactly $\ddot s=-\dfrac{g}{4R}\,s$. On a circular bowl the time grows with the release height, approaching the cycloid's value only for small oscillations.`,
      idea: String.raw`For the cycloid, $s=4R\sin(\theta/2)$ and the height is $y=R(1-\cos\theta)=s^2/(8R)$. The tangential component of gravity is $-g\,dy/ds=-gs/(4R)$: exactly linear in $s$, so the motion along the track is simple harmonic (mech-4.2) with $\omega^2=g/(4R)$ whatever the amplitude. The same cycloid that is quickest (5.7) is therefore also isochronous — the property Huygens used to build pendulum clocks whose rate does not depend on the swing.`,
      caption: String.raw`Beads start from rest at four heights in each bowl (drag the gold bead to change one of them). Press play: on the cycloid (left) all four reach the bottom together, every half-swing; on the circle with the same curvature at the bottom (right) the high ones lag behind. Every bead is simulated by integrating $\ddot s=-g\,dy/ds$ along its track; the lower panel plots the measured time to the bottom against the release height.`,
      scope: String.raw`Frictionless sliding (or a pendulum whose string wraps on cycloidal cheeks), uniform gravity. Friction and air drag spoil the isochronism slightly.`,
      deps: ['mech-5.7', 'mech-4.2'],
      refs: ['Taylor §6.3'],
      tags: ['tautochrone', 'cycloid', 'oscillations'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tautochrone_curve' },
      viz(v) {
        const R = 0.25, NP = 1600, SLOW = 3, COLS = ['blue', 'teal', 'purple', 'gold'];
        const cycPts = sample((u) => { const th = -Math.PI + TAU * u; return [R * (th + Math.sin(th)), R * (1 - Math.cos(th))]; }, NP);
        const ph0 = Math.acos(1 - (2 * R) / (4 * R));
        const cirPts = sample((u) => { const ph = -ph0 + 2 * ph0 * u; return [4 * R * Math.sin(ph), 4 * R * (1 - Math.cos(ph))]; }, NP);
        const tabs = [arcTable(cycPts), arcTable(cirPts)], sBot = tabs.map((t) => t.L / 2);
        // arc length (from the bottom) at a given release height, measured on each table
        const sOfH = (k, h) => { const tab = tabs[k]; return bisect((s) => pointAt(tab, sBot[k] + s)[1] - h, 0, tab.L / 2 - 1e-9, 60); };
        const sA = v.stage({ x: [-0.86, 0.86], y: [-0.13, 0.62], equal: true, axes: false, height: 230, title: 'cycloid bowl' });
        const sB = v.stage({ x: [-0.86, 0.86], y: [-0.13, 0.62], equal: true, axes: false, height: 230, title: 'circular bowl, same curvature at the bottom' });
        const sT = v.stage({ x: [0, 0.52], y: [0.488, 0.548], height: 190, full: true, axes: 'box', xlabel: 'release height (m)', ylabel: 'time to the bottom (s)', title: 'measured time to reach the bottom vs release height' });
        const gold = sA.handle(0, 0, { color: 'gold', r: 7, constrain: (x, y) => { let best = 0, bd = Infinity; for (let i = NP / 2; i <= NP; i += 4) { const p = cycPts[i], d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = i; } } const p = cycPts[clamp(best, NP / 2 + 20, NP - 2)]; return [p[0], p[1]]; } });
        { const p = pointAt(tabs[0], sBot[0] + sOfH(0, 0.47)); gold.x = p[0]; gold.y = p[1]; }
        const T14 = Math.PI * Math.sqrt(R / G);
        const cache = memo(), H3 = [0.03, 0.17, 0.33];
        const fixed = [0, 1].map((k) => H3.map((h) => bowlRun(tabs[k], sBot[k] + sOfH(k, h), sBot[k])));
        const build = () => cache(v.fix(gold.y, 5), () => {
          const hg = clamp(gold.y, 0.005, 2 * R - 0.002), hs = [...H3, hg];
          const runs = [0, 1].map((k) => [...fixed[k], bowlRun(tabs[k], sBot[k] + sOfH(k, hg), sBot[k])]);
          return { hs, runs };
        });
        // the curve of arrival times, sampled once
        const curve = [0, 1].map((k) => sample((u) => 0.004 + (2 * R - 0.008) * u, 16).map((h) => [h, bowlRun(tabs[k], sBot[k] + sOfH(k, h), sBot[k], { tmax: 0.9, every: 1000 }).Tb]));
        const circPred = (h) => { const ph = Math.acos(1 - h / (4 * R)); return ellipK(Math.sin(ph / 2)) * Math.sqrt((4 * R) / G); };
        let cur = null;
        v.animate((t) => {
          const Bd = build(), tau = t / SLOW;
          [sA, sB].forEach((s, k) => {
            const pts = k ? cirPts : cycPts;
            s.poly([...pts, [pts[pts.length - 1][0], 0], [pts[0][0], 0]], { fill: 'muted', fillAlpha: 0.12, stroke: false });
            s.path(pts, { color: 'ink', width: 2.6 });
            s.line(0, -0.02, 0, 0.56, { color: 'faint', dash: [3, 4] });
            Bd.runs[k].forEach((run, j) => { const g = pointAt(tabs[k], recAt(run, T14)); s.line(g[0], g[1] - 0.05, g[0], g[1] - 0.012, { color: COLS[j], width: 2.4 }); });
            s.text('ticks: where each bead is at t = π√(R/g)', 0, -0.06, { align: 'center', baseline: 'top', size: 11, color: 'muted' });
            Bd.runs[k].forEach((run, j) => {
              const p = pointAt(tabs[k], recAt(run, tau)), arrived = Math.abs(p[0]) < 0.012;
              const p0 = pointAt(tabs[k], run.rec[0]);
              if (!(k === 0 && j === 3)) s.dot(p0[0], p0[1], { r: 4, hollow: true, color: COLS[j] });
              s.dot(p[0], p[1], { r: 7.5, color: COLS[j] });
              if (arrived) s.circle(0, 0.0, 0.035, { color: COLS[j], width: 1.5, alpha: 0.6 });
            });
            s.corner(`t = ${v.fix(tau, 3)} s`, 'tl', { color: 'ink', weight: 600 });
          });
          sA.corner('all arrive together', 'tr', { color: 'green', weight: 600 });
          sB.corner('high beads arrive late', 'tr', { color: 'red', weight: 600 });
          // arrival-time chart
          sT.hline(T14, { color: 'green', width: 1.6, dash: [6, 4] });
          sT.fn(circPred, { domain: [0.002, 2 * R], color: 'red', width: 1.6, dash: [6, 4] });
          curve[0].forEach(([h, T]) => sT.dot(h, T, { r: 3.5, color: 'green' }));
          curve[1].forEach(([h, T]) => sT.dot(h, T, { r: 3.5, color: 'red' }));
          Bd.hs.forEach((h, j) => { sT.dot(h, Bd.runs[0][j].Tb, { r: 6, color: COLS[j] }); sT.dot(h, Bd.runs[1][j].Tb, { r: 6, color: COLS[j], hollow: true }); });
          sT.text('cycloid: π√(R/g) at every height', 0.36, T14, { align: 'right', baseline: 'top', dy: 6, color: 'green', size: 11.5 });
          sT.text('circle: K(k)·√(4R/g), rising with height', 0.36, circPred(0.36), { align: 'right', baseline: 'bottom', dy: -8, color: 'red', size: 11.5 });
          cur = Bd;
          v.legend([['green', 'cycloid (simulated)', { dot: true }], ['red', 'circle (simulated)', { dot: true }], ['green', 'predicted $\\pi\\sqrt{R/g}$', { dash: true }], ['red', 'predicted, elliptic integral', { dash: true }]]);
        }, { period: (8 * T14 * SLOW), still: T14 * SLOW });
        v.readout(() => {
          if (!cur) return '';
          const f = (r) => v.fix(r.Tb, 4);
          return String.raw`time to the bottom, released from heights ${cur.hs.map((h) => v.fix(100 * h, 0)).join(', ')} cm — cycloid: ${cur.runs[0].map(f).join(', ')} s, predicted $\pi\sqrt{R/g} = ${v.fix(T14, 4)}$ s for all · circle (radius $4R$): ${cur.runs[1].map(f).join(', ')} s, predicted ${cur.hs.map((h) => v.fix(circPred(h), 4)).join(', ')} s`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.9
    {
      num: '5.9',
      kind: 'Model',
      name: 'Soap film between two rings: the catenoid',
      credit: 'Euler, 1744 (catenoid); Goldschmidt, 1831 (discontinuous solution)',
      statement: String.raw`A soap film spanning two coaxial rings of radius $R$ a distance $2h$ apart minimises its area (surface tension times area is its energy). Among surfaces of revolution $r(x)$, $|x|\le h$, the area $A=2\pi\int_{-h}^{h}r\sqrt{1+r'^2}\,dx$ is stationary exactly for **catenoids** $r=c\cosh(x/c)$ with $c\cosh(h/c)=R$. This equation has two solutions when $h/R<0.6627$ (a shallow, stable catenoid and a deep, unstable one), one at $h/R\approx0.6627$, and none beyond. The two flat discs ($A=2\pi R^2$, the **Goldschmidt solution**) beat the stable catenoid once $h/R>0.5277$; past $0.6627$ no catenoid exists and the film must jump to the discs.`,
      idea: String.raw`The integrand $r\sqrt{1+r'^2}$ does not contain $x$, so Beltrami's identity (5.6) gives $r/\sqrt{1+r'^2}=c$, i.e. $r'=\sqrt{r^2/c^2-1}$, integrated by $r=c\cosh(x/c)$. Fitting both rings requires $c\cosh(h/c)=R$; the left side, as a function of $c$, has a positive minimum, which is why solutions disappear in pairs as the rings separate. The Goldschmidt discs are not a smooth graph $r(x)$ — they are the limit of collapsing profiles — which is why the Euler–Lagrange equation alone cannot see them.`,
      caption: String.raw`The film relaxes downhill on the area landscape below: it is drawn from a one-parameter family of trial surfaces (scaled catenaries through both rings), and its neck radius slides toward lower area. Drag the gold neck handle to deform it and let go; pull the rings apart with the slider or *Pull apart*. Below $h/R=0.6627$ the film settles in the stable catenoid (green); start it below the unstable one (red) or separate the rings further, and it collapses into two flat discs — the Goldschmidt jump. *New film* blows a fresh one.`,
      scope: String.raw`Static films (no gravity, no air-pressure difference) with surface tension uniform; real films also respond to drafts and evaporation, and the collapse itself is a fast hydrodynamic event, here caricatured as a slide down the area landscape.`,
      deps: ['mech-5.6'],
      refs: ['Goldstein §2.2'],
      tags: ['minimal surface', 'catenoid', 'stability'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Catenoid' },
      viz(v) {
        const R = 1, HC = 0.6627434193, HM = 0.5277;
        const hS = v.slider('ring half-separation $h/R$', 0.2, 0.8, 0.58, { step: 0.005 });
        let burst = false, pulling = false, r0 = 0.97, lastT = 0, hVal = 0.58, burstH = null;
        v.button('New film', () => { burst = false; pulling = false; r0 = 0.97; neck.y = r0; v.play(); });
        v.button('Pull apart', () => { pulling = true; if (burst) { burst = false; r0 = 0.97; } v.play(); });
        const s3 = v.stage({ x: [-1.45, 1.45], y: [-1.3, 1.3], equal: true, axes: false, height: 280, title: 'the film' });
        const sc = v.scene3(s3, { yaw: -0.95, pitch: 0.32, axes: false });
        const sP = v.stage({ x: [-0.95, 0.95], y: [-1.2, 1.2], equal: true, axes: false, height: 280, title: 'profile $r(x)$: drag the gold neck' });
        const sL = v.stage({ x: [0, 1], y: [1.5, 4], height: 185, full: true, axes: 'box', xlabel: 'neck radius r₀ / R', ylabel: 'area / πR²', title: 'the area landscape over the trial family $r(x)=R\\cosh(x/c)/\\cosh(h/c)$' });
        const neck = sP.handle(0, r0, { color: 'gold', r: 7, constrain: (x, y) => [0, clamp(y, 0.01, 0.995)] });
        neck.onDrag = () => { r0 = neck.y; burst = false; pulling = false; v.play(); };
        const prof = (h, n0) => { const c = h / Math.acosh(R / n0); return (x) => n0 * Math.cosh(x / c); };
        const area = (h, n0) => { if (n0 >= R) return 4 * Math.PI * R * h; const c = h / Math.acosh(R / n0); return 2 * Math.PI * simpson((x) => { const r = n0 * Math.cosh(x / c), rp = (n0 * Math.sinh(x / c)) / c; return r * Math.sqrt(1 + rp * rp); }, -h, h, 240); };
        const roots = (h) => { const g = (c) => c * Math.cosh(h / c) - R, out = []; let pc = 0.02, pv = g(pc); for (let c = 0.024; c < 1.2; c += 0.004) { const gv = g(c); if ((gv > 0) !== (pv > 0)) out.push(bisect(g, pc, c, 60)); pc = c; pv = gv; } return out; };
        const cache = memo();
        const land = (h) => cache(h, () => {
          const pts = sample((u) => 0.012 + 0.982 * u, 140).map((n0) => [n0, area(h, n0) / Math.PI]);
          return { pts, cats: roots(h).map((c) => ({ c, A: area(h, c) / Math.PI })) };
        });
        let cur = null;
        v.animate((t) => {
          let dt = t - lastT; lastT = t; if (!(dt > 0) || dt > 0.1) dt = 0;
          if (pulling && dt > 0) { hVal = Math.min(0.8, hVal + 0.05 * dt); hS.set(hVal); if (hVal >= 0.8 || burst) pulling = false; } else if (Math.abs(hS.value - hVal) > 0.003) hVal = hS.value;
          const h = hVal, L = land(h);
          if (!neck.dragging && !burst && dt > 0) {
            for (let k = 0; k < 4; k++) { const d = 1e-4, g = (area(h, Math.min(0.9995, r0 + d)) - area(h, Math.max(1e-3, r0 - d))) / (2 * d); r0 = clamp(r0 - (1.2 * dt / 4) * g / Math.PI, 0.005, 0.995); }
            if (r0 < 0.03) { burst = true; burstH = h; }
          }
          neck.y = burst ? 0.01 : r0; neck.visible = true;
          const f = prof(h, Math.max(r0, 0.005));
          // ── 3D film
          sc.begin();
          const NX = 18, NPH = 30;
          if (!burst) {
            for (let i = 0; i < NX; i++) {
              const xa = -h + (2 * h * i) / NX, xb = -h + (2 * h * (i + 1)) / NX, ra = f(xa), rb = f(xb);
              for (let j = 0; j < NPH; j++) {
                const a = (TAU * j) / NPH, b = (TAU * (j + 1)) / NPH;
                sc.poly([[xa, ra * Math.cos(a), ra * Math.sin(a)], [xb, rb * Math.cos(a), rb * Math.sin(a)], [xb, rb * Math.cos(b), rb * Math.sin(b)], [xa, ra * Math.cos(b), ra * Math.sin(b)]], { fill: 'teal', fillAlpha: 0.2, edge: false });
              }
            }
            for (let j = 0; j < 12; j++) { const a = (TAU * j) / 12; sc.path(sample((u) => { const x = -h + 2 * h * u, r = f(x); return [x, r * Math.cos(a), r * Math.sin(a)]; }, 24), { color: 'teal', width: 1, alpha: 0.55 }); }
            sc.path(sample((u) => [0, r0 * Math.cos(TAU * u), r0 * Math.sin(TAU * u)], 48), { color: 'gold', width: 2 });
          } else {
            for (const x of [-h, h]) { const disc = sample((u) => [x, R * Math.cos(TAU * u), R * Math.sin(TAU * u)], 48); sc.poly(disc, { fill: 'teal', fillAlpha: 0.28, edge: false }); }
          }
          for (const x of [-h, h]) sc.path(sample((u) => [x, R * Math.cos(TAU * u), R * Math.sin(TAU * u)], 64), { color: 'ink', width: 3 });
          sc.flush();
          s3.corner(burst ? 'collapsed: two flat discs' : 'film', 'tl', { color: burst ? 'red' : 'teal', weight: 600 });
          // ── profile
          for (const x of [-h, h]) sP.line(x, -R, x, R, { color: 'ink', width: 4 });
          L.cats.forEach((ct, i) => { const stable = i === L.cats.length - 1; const g = (x) => ct.c * Math.cosh(x / ct.c); for (const sg of [1, -1]) sP.fn((x) => sg * g(x), { domain: [-h, h], color: stable ? 'green' : 'red', width: 1.6, dash: [6, 4] }); });
          if (!burst) for (const sg of [1, -1]) sP.fn((x) => sg * f(x), { domain: [-h, h], color: 'teal', width: 3, fill: 'teal', fillAlpha: 0.08 });
          else for (const x of [-h, h]) sP.line(x, -R, x, R, { color: 'teal', width: 7, alpha: 0.5 });
          sP.line(-0.95, 0, 0.95, 0, { color: 'faint', dash: [3, 4] });
          sP.text('axis', 0.93, 0, { align: 'right', baseline: 'bottom', size: 11, color: 'muted', dy: -2 });
          // ── landscape
          const ys = L.pts.map((p) => p[1]), [lo, hi] = span([ys, [2]], 0.12, 0.3);
          sL.setView(null, [lo - 0.3 * (hi - lo), hi + 0.08 * (hi - lo)]);
          sL.hline(2, { color: 'orange', width: 1.6, dash: [6, 4] });
          sL.text('two flat discs: 2πR²', 0.01, 2, { align: 'left', baseline: 'top', dy: 4, color: 'orange', size: 11.5 });
          sL.path(L.pts, { color: 'teal', width: 2.4 });
          L.cats.forEach((ct, i) => { const stable = i === L.cats.length - 1; sL.dot(ct.c, ct.A, { r: 6, color: stable ? 'green' : 'red' }); sL.text(stable ? 'stable catenoid' : 'unstable catenoid', ct.c, ct.A, { color: stable ? 'green' : 'red', size: 11.5, weight: 600, align: 'center', baseline: stable ? 'top' : 'bottom', dy: stable ? 9 : -9 }); });
          const Anow = burst ? 2 : area(h, r0) / Math.PI;
          sL.dot(burst ? 0 : r0, Anow, { r: 7, color: 'gold' });
          cur = { h, r0, burst, cats: L.cats, Anow, burstH };
          v.legend([['teal', 'the film (trial surface)'], ['green', 'stable catenoid', { dash: true }], ['red', 'unstable catenoid', { dash: true }], ['orange', 'Goldschmidt discs', { dash: true }]]);
        }, { still: 2 });
        v.readout(() => {
          if (!cur) return '';
          const c = cur, st = c.cats.length ? c.cats[c.cats.length - 1] : null;
          const regime = c.h > HC ? String.raw`$h/R = ${v.fix(c.h, 3)} > 0.6627$: no catenoid exists, only the discs` : c.h > HM ? String.raw`$0.5277 < h/R = ${v.fix(c.h, 3)} < 0.6627$: the catenoid is only metastable — the discs have less area` : String.raw`$h/R = ${v.fix(c.h, 3)} < 0.5277$: the stable catenoid is the global minimum`;
          const film = c.burst ? String.raw`the film collapsed into two discs (area $2\pi R^2$) when $h/R$ was $${v.fix(c.burstH ?? c.h, 3)}$` : String.raw`film neck $r_0 = ${v.fix(c.r0, 4)}R$, area $${v.fix(c.Anow, 4)}\,\pi R^2$` + (st ? String.raw` · stable catenoid predicted by $c\cosh(h/c) = R$: neck $c = ${v.fix(st.c, 4)}R$, area $${v.fix(st.A, 4)}\,\pi R^2$` : '');
          return `${regime} · ${film} · discs: $2\\pi R^2$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.10
    {
      num: '5.10',
      kind: 'Method',
      name: 'Lagrange multipliers for constrained functionals',
      credit: 'Euler, 1744; Lagrange, 1788',
      statement: String.raw`To find extrema of $J[y]=\int_a^b f(x,y,y')\,dx$ among functions with fixed end values that also satisfy an **integral constraint** $K[y]=\int_a^b g(x,y,y')\,dx=\ell$, form $f-\lambda g$ with a constant $\lambda$ (the **Lagrange multiplier**). If $y$ is a constrained extremum and is not itself an extremal of $K$, then for some $\lambda$ it satisfies the Euler–Lagrange equation
$$\frac{\partial(f-\lambda g)}{\partial y}-\frac{d}{dx}\frac{\partial(f-\lambda g)}{\partial y'}=0 ,$$
with $\lambda$ fixed together with the integration constants by the boundary values and $K[y]=\ell$. The multiplier measures the sensitivity of the optimum to the constraint: $\lambda=dJ_{\rm opt}/d\ell$.`,
      idea: String.raw`Restrict to a two-parameter family $y+\varepsilon_1\eta_1+\varepsilon_2\eta_2$. In the $(\varepsilon_1,\varepsilon_2)$ plane the constraint $K=\ell$ is a curve, and at a constrained extremum the level curve of $J$ through the point must touch it: $\nabla J=\lambda\nabla K$ (the finite-dimensional multiplier rule, a consequence of the implicit function theorem, pma-9.28). With 5.4 the gradients are $\int(\text{EL of }f)\eta_i$ and $\int(\text{EL of }g)\eta_i$; equality for all $\eta_i$ is the Euler–Lagrange equation of $f-\lambda g$ (5.3). Moving along the constraint family shows $dJ_{\rm opt}=\lambda\,d\ell$.`,
      caption: String.raw`Problem: enclose the largest area $A=\int_{-1}^1y\,dx$ under a curve of fixed length $\ell$ from $(-1,0)$ to $(1,0)$. Left: the plane of trial curves $y=a(1-x^2)+0.4\,b\,(1-x^2)(5x^2-1)$ (the second shape reshapes the curve without adding area, so the level sets of $A=\tfrac43a$ are the vertical purple lines). The orange curve is the constraint $L=\ell$. Drag the gold point along the constraint: the area is largest exactly where a purple line touches the orange curve, i.e. where the gradients $\nabla A$ and $\nabla L$ are parallel; their ratio is $\lambda$. Right: the trial curve and the true optimum, a circular arc whose radius equals $\lambda$.`,
      deps: ['mech-5.4', 'pma-9.28'],
      refs: ['Goldstein §2.4'],
      tags: ['calculus of variations', 'constraints', 'Lagrange multiplier'],
      viz(v) {
        const ellS = v.slider('length $\\ell$', 2.15, 3.1, 2.6, { step: 0.01 });
        const sQ = v.stage({ x: [-1.3, 1.5], y: [-1.15, 1.15], equal: true, height: 330, axes: true, xlabel: 'a', ylabel: 'b', title: 'the plane of trial curves $(a, b)$' });
        const sY = v.stage({ x: [-1.15, 1.15], y: [-0.35, 1.4], equal: true, axes: true, height: 330, title: 'the curve $y(x)$ and its area' });
        const NQ = 120, A = (a, b) => (4 / 3) * a, gA = [4 / 3, 0];
        const L = (a, b) => simpson((x) => { const d = -2 * a * x + 0.4 * b * (12 * x - 20 * x * x * x); return Math.sqrt(1 + d * d); }, -1, 1, NQ);
        const gL = (a, b) => { const h = 1e-5; return [(L(a + h, b) - L(a - h, b)) / (2 * h), (L(a, b + h) - L(a, b - h)) / (2 * h)]; };
        const rAt = (th, ell) => { const c = Math.cos(th), s = Math.sin(th); return bisect((r) => L(r * c, r * s) - ell, 0, 6, 34); };
        const optimum = (ell) => { const th = goldenMax((t) => { const r = rAt(t, ell); return A(r * Math.cos(t), r * Math.sin(t)); }, -0.9, 0.9, 40); const r = rAt(th, ell); return [r * Math.cos(th), r * Math.sin(th)]; };
        const cache = memo(), cacheL = memo();
        const level = (ell) => sample((u) => { const th = TAU * u, r = rAt(th, ell); return [r * Math.cos(th), r * Math.sin(th)]; }, 150);
        const others = () => cacheL('x', () => [2.2, 2.6, 3.0, 3.4].map(level));
        const build = () => cache(ellS.value, () => {
          const ell = ellS.value, curve = level(ell), opt = optimum(ell), g = gL(opt[0], opt[1]);
          const d = 0.01, Ap = A(...optimum(ell + d)), Am = A(...optimum(ell - d));
          const th = bisect((t) => (2 * t) / Math.sin(t) - ell, 1e-6, Math.PI / 2, 80), Rarc = 1 / Math.sin(th), Aarc = Rarc * Rarc * (th - Math.sin(th) * Math.cos(th));
          return { ell, curve, opt, lam: Math.hypot(...gA) / Math.hypot(...g), dAdl: (Ap - Am) / (2 * d), Rarc, Aarc, th };
        });
        const hd = sQ.handle(0.5, -0.45, { color: 'gold', r: 7.5, constrain: (x, y) => { const th = Math.atan2(y, x), r = rAt(th, ellS.value); return [r * Math.cos(th), r * Math.sin(th)]; } });
        let lastEll = null, cur = null;
        v.render(() => {
          const Bd = build();
          if (lastEll !== Bd.ell) { const th = Math.atan2(hd.y, hd.x) || 0.3, r = rAt(th, Bd.ell); hd.x = r * Math.cos(th); hd.y = r * Math.sin(th); lastEll = Bd.ell; }
          // level lines of A (straight) and of L
          for (let k = -6; k <= 7; k++) sQ.vline(0.2 * k, { color: 'purple', width: 1, alpha: 0.25 });
          others().forEach((c) => sQ.path(c, { color: 'orange', width: 1, alpha: 0.3, close: true }));
          sQ.path(Bd.curve, { color: 'orange', width: 2.6, close: true });
          const Ah = A(hd.x, hd.y), Aopt = A(...Bd.opt);
          sQ.vline(Bd.opt[0], { color: 'green', width: 1.8, dash: [6, 4] });
          sQ.vline(hd.x, { color: 'purple', width: 2 });
          sQ.dot(Bd.opt[0], Bd.opt[1], { r: 5, color: 'green' });
          const g = gL(hd.x, hd.y), sa = 0.45 / Math.hypot(...gA), sl = 0.45 / Math.hypot(...g);
          sQ.arrow(hd.x, hd.y, hd.x + gA[0] * sa, hd.y + gA[1] * sa, { color: 'purple', width: 2.4 });
          sQ.arrow(hd.x, hd.y, hd.x + g[0] * sl, hd.y + g[1] * sl, { color: 'orange', width: 2.4 });
          sQ.tex(String.raw`\nabla A`, hd.x + gA[0] * sa, hd.y + gA[1] * sa, { color: 'purple', dx: 6, dy: -16, size: 14 });
          sQ.tex(String.raw`\nabla L`, hd.x + g[0] * sl, hd.y + g[1] * sl, { color: 'orange', dx: 16, dy: 12, size: 14 });
          const ang = Math.abs(Math.atan2(gA[0] * g[1] - gA[1] * g[0], gA[0] * g[0] + gA[1] * g[1]));
          sQ.corner(`angle between the gradients: ${v.fix((ang * 180) / Math.PI, 1)}°`, 'br', { color: ang < 0.01 ? 'green' : 'ink', weight: 600 });
          // the curve
          const y = (x) => hd.x * (1 - x * x) + 0.4 * hd.y * (1 - x * x) * (5 * x * x - 1);
          sY.hline(0, { color: 'ink', width: 1.5 });
          const Rr = Bd.Rarc, yc = -Rr * Math.cos(Bd.th);
          sY.curve((u) => { const p = -Bd.th + 2 * Bd.th * u; return [Rr * Math.sin(p), yc + Rr * Math.cos(p)]; }, 0, 1, { color: 'green', width: 2, dash: [6, 4] });
          sY.fn(y, { domain: [-1, 1], color: 'gold', width: 3, fill: 'gold', fillAlpha: 0.22 });
          sY.dot(-1, 0, { r: 5, color: 'ink' }); sY.dot(1, 0, { r: 5, color: 'ink' });
          sY.corner(`A = ${v.fix(Ah, 4)}   (best in family ${v.fix(Aopt, 4)}, circular arc ${v.fix(Bd.Aarc, 4)})`, 'bl', { color: 'ink' });
          cur = { Bd, Ah, Aopt, ang };
          v.legend([['orange', 'constraint $L[y]=\\ell$'], ['purple', 'level sets of $A$'], ['gold', 'your trial curve'], ['green', 'optimum: tangency / the circular arc', { dash: true }]]);
        });
        v.readout(() => {
          if (!cur) return '';
          const { Bd } = cur;
          return String.raw`at the tangency point $\nabla A = \lambda\nabla L$ with $\lambda = |\nabla A|/|\nabla L| = ${v.fix(Bd.lam, 4)}$; sensitivity of the best area to the length, $dA_{\rm opt}/d\ell = ${v.fix(Bd.dAdl, 4)}$ · the exact optimum is a circular arc of radius $${v.fix(Bd.Rarc, 4)}$, and the Euler–Lagrange equation of $y - \lambda\sqrt{1+y'^2}$ says its radius is $\lambda$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.11
    {
      num: '5.11',
      kind: 'Model',
      name: 'Hanging chain: the catenary',
      credit: 'Huygens, Leibniz and Johann Bernoulli, 1691',
      statement: String.raw`A uniform, perfectly flexible, inextensible chain of length $\ell$ and weight $\rho g$ per unit length, hanging from two supports, takes the shape that minimises its potential energy $U=\rho g\int y\,ds$ subject to the length constraint $\int ds=\ell$. The minimiser is a **catenary**
$$y=\lambda+c\cosh\frac{x-x_0}{c},$$
where $c$ and $x_0$ are fixed by the supports and the length, and $\lambda$ is the Lagrange multiplier of the length constraint. The tension at height $y$ is $T=\rho g\,(y-\lambda)$, and its horizontal component $\rho g c$ is the same all along the chain.`,
      idea: String.raw`With the multiplier (5.10) we extremise $\int(y-\lambda)\sqrt{1+y'^2}\,dx$, whose integrand has no explicit $x$. Beltrami's identity (5.6) gives $(y-\lambda)/\sqrt{1+y'^2}=c$, the same equation as for the soap film with $r$ replaced by $y-\lambda$: so the chain is a catenary whose "axis" sits at height $\lambda$. Changing $\ell$ changes $c$ and $\lambda$ but never the family. Force balance gives the same answer: the horizontal tension is constant and the vertical tension equals the weight of the chain below.`,
      caption: String.raw`A chain of 48 rigid links is simulated (Verlet steps with the link lengths enforced, gravity, light damping) — no catenary is imposed. Drag the two supports or change the length; the green dashed curve is the catenary predicted from the supports and the length alone, and the beads settle onto it. *Show parabola* overlays the parabola with the same sag: close for a shallow chain, clearly off for a deep one. The dotted line is the multiplier height $\lambda$: the tension at each bead is proportional to its height above it.`,
      scope: String.raw`Uniform, flexible, inextensible chain under its own weight only. A suspension-bridge cable carrying a uniform deck (load per horizontal metre) hangs as a parabola instead.`,
      deps: ['mech-5.10', 'mech-5.6'],
      refs: ['Goldstein Ex. 2.9', 'Goldstein §2.2'],
      tags: ['catenary', 'Lagrange multiplier', 'statics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Catenary' },
      viz(v) {
        const N = 48;
        const ellS = v.slider('chain length $\\ell$ (m)', 3.2, 6.5, 5, { step: 0.05 });
        const para = v.toggle('show parabola of equal sag', false);
        const s = v.stage({ x: [-2.3, 2.3], y: [-3.1, 0.8], equal: true, axes: false, height: 360, title: 'a simulated chain (beads) and the predicted catenary' });
        const near = (x, y, o) => { const dx = x - o.x, dy = y - o.y, d = Math.hypot(dx, dy), m = 0.97 * ellS.value; return d > m ? [o.x + (dx * m) / d, o.y + (dy * m) / d] : [x, y]; };
        let P1 = null, P2 = null;
        P1 = s.handle(-1.6, 0.35, { color: 'ink', label: 'support', labelPos: 'n', constrain: (x, y) => near(clamp(x, -2.25, P2.x - 0.3), clamp(y, -1.5, 0.7), P2) });
        P2 = s.handle(1.5, 0.0, { color: 'ink', label: 'support', labelPos: 'n', constrain: (x, y) => near(clamp(x, P1.x + 0.3, 2.25), clamp(y, -1.5, 0.7), P1) });
        let pos = [], prev = [];
        const reset = (sag) => {
          pos = []; prev = [];
          for (let i = 0; i <= N; i++) { const u = i / N, x = P1.x + (P2.x - P1.x) * u, y = P1.y + (P2.y - P1.y) * u - sag * Math.sin(Math.PI * u); pos.push([x, y]); prev.push([x, y]); }
        };
        const step = (dt, iters, damp) => {
          const l0 = ellS.value / N;
          for (let i = 1; i < N; i++) { const p = pos[i], q = prev[i], vx = (p[0] - q[0]) * damp, vy = (p[1] - q[1]) * damp; prev[i] = [p[0], p[1]]; pos[i] = [p[0] + vx, p[1] + vy - G * dt * dt]; }
          pos[0] = [P1.x, P1.y]; pos[N] = [P2.x, P2.y];
          for (let it = 0; it < iters; it++) {
            const fwd = it % 2 === 0;
            for (let kk = 0; kk < N; kk++) {
              const i = fwd ? kk : N - 1 - kk, a = pos[i], b = pos[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-9, diff = (d - l0) / d;
              const wa = i === 0 ? 0 : 1, wb = i + 1 === N ? 0 : 1; if (wa + wb === 0) continue;
              const cx = (dx * diff) / (wa + wb), cy = (dy * diff) / (wa + wb);
              if (wa) { a[0] += cx; a[1] += cy; } if (wb) { b[0] -= cx; b[1] -= cy; }
            }
          }
        };
        reset(1.2);
        for (let k = 0; k < 4000; k++) step(1 / 600, 40, 0.97); // settle once before the first frame
        v.button('Shake', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); for (let i = 1; i < N; i++) { prev[i][0] -= r.uniform(-0.02, 0.02); prev[i][1] -= r.uniform(-0.03, 0.05); } v.play(); });
        v.button('Drop from a hump', () => { reset(-0.6); v.play(); });
        let lastT = 0, cur = null, subDt = 1 / 600, snapPos = null, vmax = 0;
        // Gauss–Newton fit of y = y0 + c cosh((x − x0)/c) to the beads
        const fit = (start) => {
          let [x0, y0, c] = start;
          for (let it = 0; it < 12; it++) {
            const JtJ = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], Jtr = [0, 0, 0];
            for (const [x, y] of pos) {
              const u = (x - x0) / c, ch = Math.cosh(u), sh = Math.sinh(u), r = y - (y0 + c * ch);
              const J = [-sh, 1, ch - u * sh];
              for (let a = 0; a < 3; a++) { Jtr[a] += J[a] * r; for (let b = 0; b < 3; b++) JtJ[a][b] += J[a] * J[b]; }
            }
            const d = v.M.solve(JtJ, Jtr); if (!d || d.some((z) => !isFinite(z))) break;
            x0 += d[0]; y0 += d[1]; c = Math.max(0.05, c + d[2]);
          }
          return { x0, y0, c };
        };
        v.animate((t) => {
          let dt = t - lastT; lastT = t; if (!(dt > 0) || dt > 0.05) dt = 0;
          if (dt > 0 && !snapPos) snapPos = pos.map((p) => p.slice());
          if (dt > 0) { const n = 10; subDt = dt / n; for (let k = 0; k < n; k++) step(subDt, 40, 0.996); }
          pos[0] = [P1.x, P1.y]; pos[N] = [P2.x, P2.y];
          const cat = catenaryThrough(P1.x, P1.y, P2.x, P2.y, ellS.value), F = fit([cat.x0, cat.y0, cat.c]);
          s.hline(cat.y0, { color: 'purple', dash: [2, 4], width: 1.4 });
          const yb = s.bounds.y[0] + 0.08;
          if (cat.y0 > yb + 0.12) s.text(`λ = ${v.fix(cat.y0, 3)} m: tension ∝ height above this line`, -2.25, cat.y0, { color: 'purple', size: 11.5, baseline: 'bottom', dy: -3 });
          else s.text(`λ = ${v.fix(cat.y0, 3)} m (line below the panel): tension ∝ height above it`, -2.25, yb, { color: 'purple', size: 11.5, baseline: 'bottom' });
          let ymin = Infinity, xmin = 0; pos.forEach((p) => { if (p[1] < ymin) { ymin = p[1]; xmin = p[0]; } });
          let parDev = 0, parF = null;
          if (para.value) {
            const h1 = Math.max(1e-6, P1.y - ymin), h2 = Math.max(1e-6, P2.y - ymin), a = Math.sqrt(h1), b = Math.sqrt(h2), xm = (a * P2.x + b * P1.x) / (a + b), k = h1 / (xm - P1.x) ** 2;
            parF = (x) => ymin + k * (x - xm) ** 2; s.fn(parF, { domain: [P1.x, P2.x], color: 'red', width: 2, dash: [3, 3] });
            pos.forEach((p) => { parDev = Math.max(parDev, Math.abs(p[1] - parF(p[0]))); });
          }
          s.path(pos, { color: 'muted', width: 1.6 });
          // tension ∝ y − λ : colour the beads by it
          const Tmax = Math.max(...pos.map((p) => p[1] - cat.y0));
          pos.forEach((p, i) => { if (i > 0 && i < N) s.dot(p[0], p[1], { r: 3.4, color: v.mix('teal', 'orange', clamp((p[1] - cat.y0) / Tmax, 0, 1)) }); });
          s.fn(cat.f, { domain: [P1.x, P2.x], color: 'green', width: 2, dash: [7, 5] });
          let dev = 0, len = 0; pos.forEach((p, i) => { dev = Math.max(dev, Math.abs(p[1] - cat.f(p[0]))); if (i) len += Math.hypot(p[0] - pos[i - 1][0], p[1] - pos[i - 1][1]); });
          if (dt > 0 && snapPos) { vmax = 0; for (let i = 1; i < N; i++) vmax = Math.max(vmax, Math.hypot(pos[i][0] - snapPos[i][0], pos[i][1] - snapPos[i][1]) / dt); }
          if (dt > 0) snapPos = pos.map((p) => p.slice());
          s.corner(vmax < 0.003 ? 'at rest' : `moving: fastest bead ${v.fix(100 * vmax, 1)} cm/s`, 'tr', { color: vmax < 0.003 ? 'green' : 'orange', weight: 600 });
          cur = { cat, F, dev, len, parDev, para: para.value, sag: Math.min(P1.y, P2.y) - ymin, moving: vmax >= 0.003 };
          v.legend([['green', 'catenary predicted from supports and length', { dash: true }], ['teal', 'beads: low tension', { dot: true }], ['orange', 'high tension', { dot: true }], ...(para.value ? [['red', 'parabola, same sag', { dash: true }]] : [])]);
        }, { still: 1 });
        v.readout(() => {
          if (!cur) return '';
          const c = cur;
          return (c.moving ? 'still moving — wait for it to settle · ' : '') + String.raw`catenary parameter: fitted to the simulated beads $c = ${v.fix(c.F.c, 4)}$ m, predicted from supports and length $c = ${v.fix(c.cat.c, 4)}$ m · multiplier $\lambda = ${v.fix(c.cat.y0, 3)}$ m · largest bead offset from the prediction ${v.fix(1000 * c.dev, 1)} mm (simulated chain length ${v.fix(c.len, 4)} m vs ${v.fix(ellS.value, 2)} m)` + (c.para ? ` · parabola of equal sag misses by up to ${v.fix(1000 * c.parDev, 0)} mm` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.12
    {
      num: '5.12',
      kind: 'Theorem',
      name: 'Isoperimetric inequality (Dido’s problem)',
      credit: 'Known to the Greeks (Zenodorus, c. 150 BC); Steiner, 1838; first complete proofs Weierstrass and Schwarz, 1870s–1884',
      statement: String.raw`For every closed rectifiable curve in the plane of length $L$ enclosing a region of area $A$,
$$4\pi A\le L^2,$$
with equality only for circles. Equivalently, among closed curves of given length the circle encloses the most area. **Dido's problem** (a curve of length $L$ whose two ends lie on a straight coastline, enclosing area $A$ against it): $2\pi A\le L^2$, with equality only for a semicircle.`,
      idea: String.raw`Treat area as the objective and length as the constraint (5.10): the Euler–Lagrange equation of $A-\lambda L$ says the curvature is constant, $\kappa=1/\lambda$, so a smooth maximiser must be a circle. That alone presumes a maximiser exists; Steiner's geometric arguments (convexify — the convex hull has more area and less perimeter — then symmetrise) and later Hurwitz's Fourier-series proof close the gap. Dido's version follows by reflecting the curve in the coastline: the doubled curve is closed with length $2L$ and area $2A$.`,
      caption: String.raw`Drag the blue vertices to reshape the loop. The meter shows $4\pi A/L^2$: it never exceeds 1, and the green dashed circle of the same perimeter always encloses more. For a non-convex loop the dotted convex hull already does better. Press play to let the loop flow uphill in $4\pi A/L^2$ (numerical gradient ascent on the vertices): it rounds itself into a circle; restart to begin again. Switch to *Dido* to fence off land against a straight coast.`,
      deps: ['mech-5.10'],
      refs: ['Goldstein §2.4'],
      tags: ['isoperimetric', 'calculus of variations', 'geometry'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Isoperimetric_inequality' },
      viz(v) {
        let mode = 'closed';
        const sel = v.select('', [{ value: 'closed', label: 'closed loop' }, { value: 'dido', label: 'Dido: fence against a coast' }], 'closed', { onChange: (m) => { mode = m; } });
        const s = v.stage({ x: [-2.6, 2.6], y: [-2.2, 2.2], equal: true, axes: false, height: 350, weight: 1.7, title: 'drag the vertices; play to relax' });
        const sm = v.stage({ x: [0, 1], y: [-0.15, 1.12], axes: false, height: 350, minWidth: 170, weight: 0.55, title: 'isoperimetric ratio' });
        const C0 = [[-1.9, -0.6], [-0.9, -1.5], [0.4, -0.9], [1.7, -1.6], [2.1, 0.1], [1.1, 0.5], [1.5, 1.6], [-0.2, 1.3], [-1.3, 1.7]];
        const D0 = [[-2.2, 0], [-1.7, 1.2], [-0.6, 0.7], [0.3, 1.9], [1.2, 1.0], [2.0, 0.7], [2.3, 0]];
        const COAST = -1.5;
        const HC = C0.map((p) => s.handle(0.8 * p[0], 0.8 * p[1], { color: 'accent', constrain: { x: [-2.5, 2.5], y: [-2.1, 2.1] } }));
        const HD = D0.map((p, i) => s.handle(p[0], p[1] + COAST, { color: i === 0 || i === D0.length - 1 ? 'orange' : 'accent', constrain: i === 0 || i === D0.length - 1 ? (x) => [clamp(x, -2.5, 2.5), COAST] : (x, y) => [clamp(x, -2.5, 2.5), clamp(y, COAST + 0.02, 2.1)] }));
        const curveOf = (P, dido) => (dido ? spline(P, 18, false) : spline(P, 18, true));
        const ratio = (P, dido) => { const c = curveOf(P, dido), A = Math.abs(shoelace(dido ? c.map((p) => [p[0], p[1] - COAST]) : c)), L = perim(c, !dido); return { A, L, Q: ((dido ? 2 : 4) * Math.PI * A) / (L * L), c }; };
        let lastT = 0, snap = null, cur = null;
        const flow = (dt) => {
          const dido = mode === 'dido', H = dido ? HD : HC, P = H.map((h) => [h.x, h.y]), base = ratio(P, dido), d = 1e-4, grads = [];
          H.forEach((h, i) => {
            const g = [0, 0];
            for (const k of dido && (i === 0 || i === H.length - 1) ? [0] : [0, 1]) { const Q = P.map((p) => p.slice()); Q[i][k] += d; g[k] = (ratio(Q, dido).Q - base.Q) / d; }
            grads.push(g);
          });
          const eta = dt * base.L * base.L * 0.25;
          H.forEach((h, i) => { let dx = eta * grads[i][0], dy = eta * grads[i][1]; const m = Math.hypot(dx, dy); if (m > 0.04) { dx *= 0.04 / m; dy *= 0.04 / m; } h.x = clamp(h.x + dx, -2.5, 2.5); h.y = dido && (i === 0 || i === H.length - 1) ? COAST : clamp(h.y + dy, dido ? COAST + 0.02 : -2.1, 2.1); });
          // keep the length fixed: rescale about the centroid (Q is scale invariant, so this does not change it)
          const after = ratio(H.map((h) => [h.x, h.y]), dido), k = base.L / after.L;
          const cx = dido ? (H[0].x + H[H.length - 1].x) / 2 : H.reduce((a, h) => a + h.x, 0) / H.length, cy = dido ? COAST : H.reduce((a, h) => a + h.y, 0) / H.length;
          H.forEach((h) => { h.x = clamp(cx + (h.x - cx) * k, -2.5, 2.5); h.y = clamp(cy + (h.y - cy) * k, dido ? COAST : -2.1, 2.1); });
        };
        v.animate((t) => {
          const dido = mode === 'dido', H = dido ? HD : HC;
          HC.forEach((h) => { h.visible = !dido; }); HD.forEach((h) => { h.visible = dido; });
          if (t < lastT || t === 0) { if (snap && snap.mode === mode) snap.pts.forEach((p, i) => H[i].set(p[0], p[1])); snap = null; }
          let dt = t - lastT; lastT = t;
          if (dt > 0 && dt < 0.1) { if (!snap) snap = { mode, pts: H.map((h) => [h.x, h.y]) }; flow(dt); }
          const P = H.map((h) => [h.x, h.y]), R0 = ratio(P, dido);
          let hullQ = null;
          if (dido) {
            s.rect(-9, -9, 9, COAST, { fill: 'teal', fillAlpha: 0.18, stroke: false });
            s.hline(COAST, { color: 'teal', width: 2 });
            s.text('sea', -2.5, COAST - 0.3, { align: 'left', color: 'teal', size: 12, weight: 600 });
            const r = R0.L / Math.PI, xm = (P[0][0] + P[P.length - 1][0]) / 2;
            s.curve((u) => [xm + r * Math.cos(Math.PI * u), COAST + r * Math.sin(Math.PI * u)], 0, 1, { color: 'green', width: 2, dash: [7, 5] });
            s.poly([...R0.c, [P[P.length - 1][0], COAST], [P[0][0], COAST]], { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 3 });
            s.line(P[0][0], COAST, P[P.length - 1][0], COAST, { color: 'teal', width: 3 });
          } else {
            const cx = R0.c.reduce((a, p) => a + p[0], 0) / R0.c.length, cy = R0.c.reduce((a, p) => a + p[1], 0) / R0.c.length;
            s.circle(cx, cy, R0.L / TAU, { color: 'green', width: 2, dash: [7, 5] });
            const hc = hull(R0.c), hA = Math.abs(shoelace(hc)), hL = perim(hc, true); hullQ = (4 * Math.PI * hA) / (hL * hL);
            if (hullQ - R0.Q > 0.002) s.poly(hc, { color: 'purple', width: 1.4, dash: [2, 3] });
            s.poly(R0.c, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 3 });
          }
          // meter
          const Q = R0.Q;
          sm.rect(0.3, 0, 0.62, 1, { color: 'muted', width: 1.2 });
          sm.rect(0.3, 0, 0.62, Q, { fill: Q > 0.995 ? 'green' : 'accent', fillAlpha: 0.5, stroke: false });
          sm.line(0.2, 1, 0.72, 1, { color: 'green', width: 2 });
          sm.text(dido ? 'semicircle: 1' : 'circle: 1', 0.5, 1.02, { align: 'center', baseline: 'bottom', color: 'green', size: 12, weight: 600 });
          sm.text(v.fix(Q, 4), 0.66, Q, { align: 'left', color: 'ink', size: 13, weight: 700, baseline: Q > 0.92 ? 'top' : 'middle', dy: Q > 0.92 ? 6 : 0 });
          if (hullQ != null && hullQ - Q > 0.002) { sm.line(0.26, hullQ, 0.66, hullQ, { color: 'purple', width: 1.6, dash: [3, 3] }); sm.text('hull', 0.25, hullQ, { align: 'right', color: 'purple', size: 11 }); }
          for (const q of [0, 0.25, 0.5, 0.75]) sm.text(v.fix(q, 2), 0.27, q, { align: 'right', size: 10.5, color: 'muted' });
          sm.text(dido ? '2πA/L²' : '4πA/L²', 0.46, -0.07, { align: 'center', size: 12, color: 'ink' });
          cur = { dido, ...R0, hullQ };
          v.legend(dido
            ? [['accent', 'fenced land'], ['green', 'semicircle with the same fence length', { dash: true }], ['orange', 'fence ends (slide along the coast)', { dot: true }]]
            : [['accent', 'your loop'], ['green', 'circle of the same perimeter', { dash: true }], ['purple', 'convex hull', { dash: true }]]);
        }, { autoplay: false, still: 0 });
        v.readout(() => {
          if (!cur) return '';
          const c = cur;
          if (c.dido) return String.raw`fence length $L = ${v.fix(c.L, 3)}$, enclosed area $A = ${v.fix(c.A, 3)}$, semicircle with the same fence $L^2/2\pi = ${v.fix((c.L * c.L) / TAU, 3)}$ · $2\pi A/L^2 = ${v.fix(c.Q, 4)} \le 1$`;
          return String.raw`perimeter $L = ${v.fix(c.L, 3)}$, area $A = ${v.fix(c.A, 3)}$, circle of the same perimeter $L^2/4\pi = ${v.fix((c.L * c.L) / (2 * TAU), 3)}$ · $4\pi A/L^2 = ${v.fix(c.Q, 4)} \le 1$` + (c.hullQ - c.Q > 0.002 ? String.raw` · convex hull: $${v.fix(c.hullQ, 4)}$ (more area, less length)` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.13
    {
      num: '5.13',
      kind: 'Definition',
      name: 'Geodesics on surfaces',
      statement: String.raw`Let $S$ be a smooth surface in $\R^3$. A **geodesic** is a curve $\gamma$ on $S$ that is stationary for the length functional $L[\gamma]=\int|\gamma'(t)|\,dt$ among curves on $S$ with the same end points. Parametrised by arc length, the geodesics are exactly the curves whose acceleration is everywhere **normal** to the surface, $\gamma''\perp T_{\gamma}S$: they are the paths of a free particle constrained to $S$ by a frictionless normal force, and the "straightest" curves on $S$. In a parametrisation with metric $E\,du^2+2F\,du\,dv+G\,dv^2$ they solve the Euler–Lagrange equations of $\int\sqrt{E\dot u^2+2F\dot u\dot v+G\dot v^2}\,dt$. Examples: straight lines in the plane, helices on a cylinder, great circles on a sphere.`,
      idea: String.raw`Vary $\gamma$ within $S$ by $\varepsilon\eta$ with $\eta$ tangent to $S$: the first variation (5.4) of the length of a unit-speed curve is $-\int\gamma''\cdot\eta\,dt$, which vanishes for every tangent $\eta$ iff $\gamma''$ has no tangential part. A developable surface (cylinder, cone) can be unrolled onto the plane without stretching; lengths are unchanged, so geodesics become straight lines (5.5). The sphere cannot be unrolled, but central projection onto a tangent plane still sends great circles to straight lines. On any surface of revolution the normal force has no torque about the axis, so $r\cos\psi$ (Clairaut's relation) is constant.`,
      caption: String.raw`Choose a surface and drag the gold *aim* point in the flat chart on the right to set the starting direction; the slider sets the length. The geodesic is computed in space by integrating $\gamma''=-\frac{\gamma'^{\,T}H\gamma'}{|\nabla F|^2}\nabla F$ (a free bead held on the surface $F=0$ by a normal force) and then mapped to the chart: on the unrolled cylinder and cone, and in the central projection of the sphere, it lies on the straight dashed line. Drag the left panel to rotate.`,
      deps: ['mech-5.4', 'pma-6.27'],
      see: ['dg-9.1'],
      refs: ['Taylor §6.3', 'Arnold §12'],
      tags: ['geodesics', 'surfaces'],
      viz(v) {
        const SA = 0.42, CA = Math.sqrt(1 - SA * SA), TA = SA / CA, ZA = 1.35, RHO = 2.75, RS = 1.25, ZC = 1.45;
        const SURF = {
          cyl: { F: (p) => p[0] * p[0] + p[1] * p[1] - 1, grad: (p) => [2 * p[0], 2 * p[1], 0], hq: (w) => 2 * (w[0] * w[0] + w[1] * w[1]), start: [1, 0, -1.05], aim: [1.5, -0.84], view: [[-3.5, 3.5], [-2.1, 1.75]], inside: (p) => Math.abs(p[2]) < ZC },
          cone: { F: (p) => p[0] * p[0] + p[1] * p[1] - TA * TA * (p[2] - ZA) ** 2, grad: (p) => [2 * p[0], 2 * p[1], -2 * TA * TA * (p[2] - ZA)], hq: (w) => 2 * (w[0] * w[0] + w[1] * w[1]) - 2 * TA * TA * w[2] * w[2], start: [1.9 * SA, 0, ZA - 1.9 * CA], aim: [0.38, -1.0], view: [[-3, 3], [-3, 2.2]], inside: (p) => { const r = v3.norm(v3.sub(p, [0, 0, ZA])); return r > 0.06 && r < RHO && p[2] < ZA; } },
          sph: { F: (p) => v3.dot(p, p) - RS * RS, grad: (p) => v3.sc(p, 2), hq: (w) => 2 * v3.dot(w, w), start: [RS * Math.cos(0.45), 0, RS * Math.sin(0.45)], aim: [0.8, 0.55], view: [[-3, 3], [-2.6, 2.6]], inside: () => true },
        };
        const ssel = v.select('surface', [{ value: 'cyl', label: 'cylinder' }, { value: 'cone', label: 'cone' }, { value: 'sph', label: 'sphere' }], 'cyl');
        const lenS = v.slider('length of the geodesic', 1, 16, 9, { step: 0.1 });
        const s3 = v.stage({ x: [-1.9, 1.9], y: [-1.75, 1.75], equal: true, axes: false, height: 330, title: 'in space' });
        const sc = v.scene3(s3, { yaw: -0.75, pitch: 0.3, axes: false });
        const sC = v.stage({ x: [-3.5, 3.5], y: [-2.1, 1.75], equal: true, axes: false, height: 330, title: 'flat chart' });
        const aim = sC.handle(1.5, -0.84, { color: 'gold', r: 7.5, label: 'aim', labelPos: 'ne' });
        let lastS = null;
        // charts: 3D point (with unwrapped angle) → plane, and back
        const n0 = v3.unit(SURF.sph.start), e1 = [0, 1, 0], e2 = v3.cross(n0, e1);
        const chart = {
          cyl: { to: (p, th) => [th, p[2]], from: (q) => [Math.cos(q[0]), Math.sin(q[0]), q[1]] },
          cone: { to: (p, th) => { const r = v3.norm(v3.sub(p, [0, 0, ZA])), ph = th * SA; return [r * Math.sin(ph), -r * Math.cos(ph)]; }, from: (q) => { const r = Math.hypot(q[0], q[1]), th = Math.atan2(q[0], -q[1]) / SA; return [r * SA * Math.cos(th), r * SA * Math.sin(th), ZA - r * CA]; } },
          sph: { to: (p) => { const d = v3.dot(p, n0); return d > 0.12 * RS ? [(RS * v3.dot(p, e1)) / d, (RS * v3.dot(p, e2)) / d] : null; }, from: (q) => v3.sc(v3.unit(v3.add(v3.sc(n0, RS), v3.add(v3.sc(e1, q[0]), v3.sc(e2, q[1])))), RS) },
        };
        const cache = memo();
        const geo = () => cache([ssel.value, aim.x, aim.y, lenS.value].join('|'), () => {
          const S = SURF[ssel.value], C = chart[ssel.value], p0 = S.start, q0 = C.to(p0, 0);
          const dir = [aim.x - q0[0], aim.y - q0[1]], dl = Math.hypot(...dir) || 1, dd = 1e-5;
          const wr = v3.sub(C.from([q0[0] + (dd * dir[0]) / dl, q0[1] + (dd * dir[1]) / dl]), C.from([q0[0] - (dd * dir[0]) / dl, q0[1] - (dd * dir[1]) / dl]));
          const nh = v3.unit(S.grad(p0)), w0 = v3.unit(v3.sub(wr, v3.sc(nh, v3.dot(wr, nh)))); // tangent by construction
          const acc = (p, w) => { const g = S.grad(p); return v3.sc(g, -S.hq(w) / v3.dot(g, g)); };
          const h = 0.004, n = Math.round(lenS.value / h); let p = p0.slice(), w = w0.slice(), th = 0, prevA = Math.atan2(p[1], p[0]);
          const pts = [p0.slice()], cpts = [q0], Lz0 = p[0] * w[1] - p[1] * w[0]; let Fmax = 0, Lzd = 0, spd = 0, stop = false;
          for (let i = 0; i < n; i++) {
            const k1p = w, k1w = acc(p, w), p2 = v3.add(p, v3.sc(k1p, h / 2)), w2 = v3.add(w, v3.sc(k1w, h / 2)), k2w = acc(p2, w2), p3 = v3.add(p, v3.sc(w2, h / 2)), w3 = v3.add(w, v3.sc(k2w, h / 2)), k3w = acc(p3, w3), p4 = v3.add(p, v3.sc(w3, h)), w4 = v3.add(w, v3.sc(k3w, h)), k4w = acc(p4, w4);
            p = v3.add(p, v3.sc(v3.add(v3.add(k1p, v3.sc(w2, 2)), v3.add(v3.sc(w3, 2), w4)), h / 6));
            w = v3.add(w, v3.sc(v3.add(v3.add(k1w, v3.sc(k2w, 2)), v3.add(v3.sc(k3w, 2), k4w)), h / 6));
            if (!S.inside(p)) { stop = true; break; }
            const a = Math.atan2(p[1], p[0]); let da = a - prevA; da -= TAU * Math.round(da / TAU); th += da; prevA = a;
            if (i % 5 === 4) { pts.push(p.slice()); cpts.push(C.to(p, th)); }
            Fmax = Math.max(Fmax, Math.abs(S.F(p))); Lzd = Math.max(Lzd, Math.abs(p[0] * w[1] - p[1] * w[0] - Lz0)); spd = Math.max(spd, Math.abs(v3.norm(w) - 1));
          }
          // deviation of the chart image from the straight line through q0 along dir
          const ux = dir[0] / dl, uy = dir[1] / dl; let dev = 0, nOK = 0;
          for (const q of cpts) if (q) { dev = Math.max(dev, Math.abs((q[0] - q0[0]) * uy - (q[1] - q0[1]) * ux)); nOK++; }
          let plane = null; if (ssel.value === 'sph') { const nrm = v3.unit(v3.cross(p0, w0)); plane = Math.max(...pts.map((q) => Math.abs(v3.dot(q, nrm)))); }
          return { pts, cpts, q0, ux, uy, dev, Fmax, Lzd, spd, stop, plane, w0, nOK };
        });
        let cur = null;
        v.render(() => {
          const key = ssel.value, S = SURF[key];
          if (lastS !== key) { aim.x = S.aim[0]; aim.y = S.aim[1]; sC.setView(...S.view); lastS = key; }
          const Gd = geo();
          // ── 3D surface
          sc.begin();
          const quad = (f, nu, nv, u0, u1, w0, w1) => { for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = u0 + ((u1 - u0) * i) / nu, b = u0 + ((u1 - u0) * (i + 1)) / nu, c = w0 + ((w1 - w0) * j) / nv, d = w0 + ((w1 - w0) * (j + 1)) / nv; sc.poly([f(a, c), f(b, c), f(b, d), f(a, d)], { fill: 'accent', fillAlpha: 0.08, edge: false }); } };
          let fS;
          if (key === 'cyl') fS = (a, z) => [Math.cos(a), Math.sin(a), z];
          else if (key === 'cone') fS = (a, r) => [r * SA * Math.cos(a), r * SA * Math.sin(a), ZA - r * CA];
          else fS = (a, b) => [RS * Math.cos(b) * Math.cos(a), RS * Math.cos(b) * Math.sin(a), RS * Math.sin(b)];
          const [w0r, w1r] = key === 'cyl' ? [-ZC, ZC] : key === 'cone' ? [0.06, RHO] : [-Math.PI / 2, Math.PI / 2];
          quad(fS, 28, key === 'sph' ? 14 : 6, 0, TAU, w0r, w1r);
          for (let j = 0; j < 12; j++) { const a = (TAU * j) / 12; sc.path(sample((u) => fS(a, w0r + (w1r - w0r) * u), 24), { color: 'accent', width: 0.8, alpha: 0.35 }); }
          for (let k = 0; k <= (key === 'sph' ? 6 : 4); k++) { const b = w0r + ((w1r - w0r) * k) / (key === 'sph' ? 6 : 4); if (key === 'sph' && (k === 0 || k === 6)) continue; sc.path(sample((u) => fS(TAU * u, b), 48), { color: 'accent', width: 0.8, alpha: 0.35 }); }
          sc.path(Gd.pts, { color: 'gold', width: 2.8 });
          sc.dot(S.start, { r: 5, color: 'ink' });
          sc.arrow(S.start, v3.add(S.start, v3.sc(Gd.w0, 0.55)), { color: 'orange', width: 2.4, head: 8 });
          sc.flush();
          // ── chart
          if (key === 'cyl') {
            sC.rect(-Math.PI, -ZC, Math.PI, ZC, { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 1, alpha: 0.6 });
            for (const x of [-Math.PI, Math.PI]) sC.line(x, -ZC, x, ZC, { color: 'muted', dash: [4, 4], width: 1.4 });
            sC.text('unrolled cylinder: the left and right edges are the same seam,', 0, -ZC, { align: 'center', baseline: 'top', dy: 6, color: 'muted', size: 11.5 });
            sC.text('so the straight line re-enters from the other side', 0, -ZC, { align: 'center', baseline: 'top', dy: 21, color: 'muted', size: 11.5 });
          } else if (key === 'cone') {
            const wedge = TAU * SA;
            sC.poly([[0, 0], ...sample((u) => { const ph = -wedge / 2 + wedge * u; return [RHO * Math.sin(ph), -RHO * Math.cos(ph)]; }, 60)], { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1, alpha: 0.6 });
            for (let k = -3; k <= 3; k++) { const ph = wedge * (k + 0.5); sC.line(0, 0, RHO * Math.sin(ph), -RHO * Math.cos(ph), { color: 'muted', dash: [4, 4], width: 1 }); }
            sC.circle(0, 0, RHO, { color: 'accent', width: 1, alpha: 0.35 });
            sC.dot(0, 0, { r: 4, color: 'ink', label: 'apex', labelPos: 'n' });
            sC.corner('unrolled cone: copies of the sector side by side', 'tl', { color: 'muted', size: 11.5 });
            sC.corner('(shaded: one copy; dashed rays: the seam)', 'bl', { color: 'muted', size: 11.5 });
          } else {
            for (let j = 0; j < 12; j++) { const a = (TAU * j) / 12; sC.path(sample((u) => { const b = -Math.PI / 2 + Math.PI * u, p = [RS * Math.cos(b) * Math.cos(a), RS * Math.cos(b) * Math.sin(a), RS * Math.sin(b)]; return chart.sph.to(p); }, 120), { color: 'accent', width: 0.8, alpha: 0.4 }); }
            for (const b of [-60, -30, 0, 30, 60].map((d) => (d * Math.PI) / 180)) sC.path(sample((u) => chart.sph.to([RS * Math.cos(b) * Math.cos(TAU * u), RS * Math.cos(b) * Math.sin(TAU * u), RS * Math.sin(b)]), 200), { color: 'accent', width: 0.8, alpha: b === 0 ? 0.7 : 0.4 });
            sC.corner('central projection from the centre of the sphere:', 'tl', { color: 'muted', size: 11.5 });
            sC.corner('every great circle (meridians, equator) maps to a straight line', 'bl', { color: 'muted', size: 11.5 });
          }
          const q0 = Gd.q0, far = 60;
          if (key === 'cyl') {
            // wrap the unrolled plane onto one strip: copies of the straight line, clipped to the strip
            for (let k = -6; k <= 6; k++) {
              const x0 = q0[0] + TAU * k; let t0 = -far, t1 = far;
              const clip = (p, d, lo, hi) => { if (Math.abs(d) < 1e-12) { if (p < lo || p > hi) { t0 = 1; t1 = 0; } return; } let a = (lo - p) / d, b = (hi - p) / d; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); };
              clip(x0, Gd.ux, -Math.PI, Math.PI); clip(q0[1], Gd.uy, -ZC, ZC);
              if (t1 > t0) sC.line(x0 + t0 * Gd.ux, q0[1] + t0 * Gd.uy, x0 + t1 * Gd.ux, q0[1] + t1 * Gd.uy, { color: 'ink', width: 1.4, dash: [7, 5], alpha: 0.7 });
            }
            const wp = []; let prevX = null;
            for (const q of Gd.cpts) { const x = ((((q[0] + Math.PI) % TAU) + TAU) % TAU) - Math.PI; if (prevX != null && Math.abs(x - prevX) > Math.PI) wp.push(null); wp.push([x, q[1]]); prevX = x; }
            sC.path(wp, { color: 'gold', width: 3 });
          } else {
            sC.line(q0[0] - far * Gd.ux, q0[1] - far * Gd.uy, q0[0] + far * Gd.ux, q0[1] + far * Gd.uy, { color: 'ink', width: 1.4, dash: [7, 5], alpha: 0.7 });
            sC.path(Gd.cpts, { color: 'gold', width: 3 });
          }
          sC.dot(q0[0], q0[1], { r: 5, color: 'ink' });
          cur = { key, Gd };
          v.legend([['gold', 'geodesic (integrated in space)'], ['ink', 'straight line in the chart', { dash: true }], ['orange', 'initial velocity']]);
        });
        v.readout(() => {
          if (!cur) return '';
          const { key, Gd } = cur;
          const head = String.raw`largest distance of the mapped geodesic from the straight line: $${v.sci(Math.max(Gd.dev, 1e-16), 2)}$ · stays on the surface to $|F| < ${v.sci(Math.max(Gd.Fmax, 1e-16), 1)}$ · speed constant to $${v.sci(Math.max(Gd.spd, 1e-16), 1)}$ · Clairaut: angular momentum about the axis constant to $${v.sci(Math.max(Gd.Lzd, 1e-16), 1)}$`;
          const tail = key === 'sph' ? String.raw` · it is a great circle: its points lie in a plane through the centre to $${v.sci(Math.max(Gd.plane, 1e-16), 1)}$` : Gd.stop ? ' · (stopped at the edge of the surface)' : '';
          return head + tail;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 5.14
    {
      num: '5.14',
      kind: 'Theorem',
      name: 'Extremals need not minimise: conjugate points',
      credit: 'Jacobi, 1837',
      statement: String.raw`A solution of the Euler–Lagrange equation is stationary, but not necessarily a minimum. For $J[y]=\int f(x,y,y')\,dx$ the **second variation** along a variation $\eta$ is
$$\delta^2J=\int_a^b\big(f_{y'y'}\eta'^2+(f_{yy}-\tfrac{d}{dx}f_{yy'})\eta^2\big)\,dx ,$$
and a point $x=c$ is **conjugate** to $a$ if the Jacobi equation (the linearised Euler–Lagrange equation) has a nonzero solution vanishing at $a$ and $c$. If $f_{y'y'}>0$ (Legendre's condition) and there is no point conjugate to $a$ in $(a,b]$, the extremal is a weak local minimum; if there is one in $(a,b)$, it is not a minimum. **Example:** on the unit sphere a great-circle arc from the north pole is stationary for length; the south pole is conjugate to the north pole (all meridians meet there again), and an arc longer than $\pi$ is shortened by a suitable sideways deformation — for the variation $w=\varepsilon\sin(k\pi s/\ell)$ the change of length is $\tfrac14\varepsilon^2\ell\big(k^2\pi^2/\ell^2-1\big)+O(\varepsilon^4)$, negative for $k=1$ once $\ell>\pi$.`,
      idea: String.raw`Expand $J[y+\varepsilon\eta]$ to second order with Taylor's theorem (pma-5.15): the first-order term vanishes on an extremal, so the sign is decided by $\delta^2J$. On the sphere a sideways displacement $w(s)$ of a meridian changes length by $\tfrac12\int(w'^2-Kw^2)\,ds$ with curvature $K=1$: neighbouring great circles converge (the Jacobi field $\sin s$ vanishes again at $s=\pi$), and once the arc contains the conjugate point the $-w^2$ term can win. Beyond the south pole the arc is longer than going the other way round — yet it remains stationary.`,
      caption: String.raw`The green arc runs down a meridian from the north pole $N$ for length $\ell$; the faint meridians show how all geodesics from $N$ refocus at the south pole $S$, the conjugate point. The gold curve deforms the arc sideways by $w=\varepsilon\sin(k\pi s/\ell)$ with its ends fixed. Right: its change of length, computed by quadrature (dots) and predicted from the second variation (dashed). Push $\ell$ past $\pi$: the arc turns red and the deformation *shortens* it. The strip below shows the second-variation coefficient against $\ell$; with $k=2$ the sign change would need $\ell>2\pi$.`,
      deps: ['mech-5.13', 'pma-5.15'],
      refs: ['Arnold App. 11'],
      tags: ['geodesics', 'second variation', 'conjugate points'],
      viz(v) {
        const R = 1.25;
        const kS = v.select('deformation', [{ value: 1, label: 'one hump $k=1$' }, { value: 2, label: 'two humps $k=2$' }], 1);
        const lS = v.slider('arc length $\\ell$ (radians)', 0.4, 6.1, 4.0, { step: 0.01 });
        const eS = v.slider('sideways size $\\varepsilon$', -0.6, 0.6, 0.35, { step: 0.01 });
        const s3 = v.stage({ x: [-1.75, 1.75], y: [-1.65, 1.65], equal: true, axes: false, height: 320, title: 'meridian arcs from the north pole' });
        const sc = v.scene3(s3, { yaw: -1.05, pitch: 0.28, axes: false });
        const sE = v.stage({ x: [-0.62, 0.62], y: [-0.2, 0.2], height: 320, axes: 'box', xlabel: 'ε', ylabel: 'ΔL', xticks: [-0.4, -0.2, 0.2, 0.4], title: 'change of length vs $\\varepsilon$' });
        const sQ = v.stage({ x: [0, 6.3], y: [-1, 2], height: 150, full: true, axes: true, xlabel: 'ℓ', title: 'second-variation coefficient $\\tfrac14\\ell(k^2\\pi^2/\\ell^2-1)$ — measured $\\Delta L/\\varepsilon^2$ at $\\varepsilon=0.01$ (dots)', xticks: [[Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [2 * Math.PI, '2π']] });
        // exact length of the deformed arc (unit sphere): |P'|² = cos²w + w'²
        const dL = (ell, eps, k) => simpson((s) => { const w = eps * Math.sin((k * Math.PI * s) / ell), wp = ((eps * k * Math.PI) / ell) * Math.cos((k * Math.PI * s) / ell); const q = Math.cos(w) ** 2 + wp * wp; return (q - 1) / (Math.sqrt(q) + 1); }, 0, ell, 400);
        const coef = (ell, k) => 0.25 * ell * ((k * k * Math.PI * Math.PI) / (ell * ell) - 1);
        const cache = memo();
        const meas = () => cache(kS.value, () => sample((u) => 0.4 + 5.8 * u, 40).map((l) => [l, dL(l, 0.01, +kS.value) / 1e-4]));
        const pt = (s, w) => { const c = Math.cos(w), sn = Math.sin(w); return [R * c * Math.sin(s), R * sn, R * c * Math.cos(s)]; };
        let cur = null;
        v.render(() => {
          const ell = lS.value, eps = eS.value, k = +kS.value, past = ell > k * Math.PI;
          // ── sphere
          sc.begin();
          for (let i = 0; i < 24; i++) for (let j = 0; j < 12; j++) {
            const a0 = (TAU * i) / 24, a1 = (TAU * (i + 1)) / 24, b0 = -Math.PI / 2 + (Math.PI * j) / 12, b1 = -Math.PI / 2 + (Math.PI * (j + 1)) / 12, f = (a, b) => [R * Math.cos(b) * Math.cos(a), R * Math.cos(b) * Math.sin(a), R * Math.sin(b)];
            sc.poly([f(a0, b0), f(a1, b0), f(a1, b1), f(a0, b1)], { fill: 'accent', fillAlpha: 0.06, edge: false });
          }
          for (let j = 0; j < 12; j++) { const a = (TAU * j) / 12; sc.path(sample((u) => [R * Math.sin(Math.PI * u) * Math.cos(a), R * Math.sin(Math.PI * u) * Math.sin(a), R * Math.cos(Math.PI * u)], 40), { color: 'accent', width: 0.9, alpha: 0.3 }); }
          sc.path(sample((u) => [R * Math.cos(TAU * u), R * Math.sin(TAU * u), 0], 60), { color: 'accent', width: 0.9, alpha: 0.3 });
          if (ell > Math.PI) sc.path(sample((u) => pt(ell + (TAU - ell) * u, 0), 60), { color: 'teal', width: 2, dash: [5, 4] });
          sc.path(sample((u) => pt(ell * u, 0), 120), { color: past ? 'red' : 'green', width: 3.2 });
          sc.path(sample((u) => pt(ell * u, eps * Math.sin(k * Math.PI * u)), 160), { color: 'gold', width: 2.4 });
          sc.dot([0, 0, R], { r: 5.5, color: 'ink' }); sc.tex('N', [0, 0, R * 1.12], { color: 'ink', size: 15 });
          sc.dot([0, 0, -R], { r: 5.5, color: 'purple' }); sc.tex('S', [0, 0, -R * 1.14], { color: 'purple', size: 15 });
          sc.dot(pt(ell, 0), { r: 5.5, color: past ? 'red' : 'green' });
          sc.flush();
          s3.corner(ell > Math.PI ? 'past the conjugate point S' : 'before the conjugate point S', 'tl', { color: ell > Math.PI ? 'red' : 'green', weight: 600 });
          // ── ΔL(ε)
          const es = sample((u) => -0.6 + 1.2 * u, 48), ms = es.map((e) => dL(ell, e, k)), c = coef(ell, k);
          const [lo, hi] = span([ms, es.map((e) => c * e * e)], 0.15, 0.02);
          sE.setView(null, [lo, hi]);
          sE.hline(0, { color: 'faint' }); sE.vline(0, { color: 'faint' });
          sE.fn((e) => c * e * e, { color: past ? 'red' : 'green', width: 1.8, dash: [6, 4] });
          es.forEach((e, i) => sE.dot(e, ms[i], { r: 3, color: ms[i] < 0 ? 'red' : 'accent' }));
          const mNow = dL(ell, eps, k);
          sE.dot(eps, mNow, { r: 6.5, color: 'gold' });
          sE.corner(c < 0 ? 'every sideways bend shortens it' : 'every sideways bend lengthens it', 'tr', { color: c < 0 ? 'red' : 'green', weight: 600 });
          // ── coefficient vs ℓ
          const M = meas();
          sQ.setView(null, [-1.7, Math.max(2.2, coef(0.8, k))]);
          sQ.hline(0, { color: 'faint' });
          sQ.vline(k * Math.PI, { color: 'purple', dash: [4, 4], width: 1.4 });
          sQ.text(k === 1 ? 'conjugate point S' : 'ℓ = 2π', k * Math.PI, 1.9, { color: 'purple', size: 11.5, align: k === 1 ? 'left' : 'right', dx: k === 1 ? 5 : -5, baseline: 'top' });
          sQ.fn((l) => coef(l, k), { domain: [0.35, 6.25], color: 'ink', width: 1.6, dash: [6, 4] });
          M.forEach(([l, q]) => sQ.dot(l, q, { r: 3, color: q < 0 ? 'red' : 'green' }));
          sQ.dot(ell, coef(ell, k), { r: 6, color: 'gold' });
          cur = { ell, eps, k, mNow, pred: c * eps * eps, other: TAU - ell };
          v.legend([['green', 'stationary arc (before the conjugate point)'], ['red', 'stationary arc past it'], ['gold', 'deformed arc'], ['teal', 'the other way round', { dash: true }]]);
        });
        v.readout(() => {
          if (!cur) return '';
          const c = cur;
          return String.raw`$\ell = ${v.fix(c.ell, 3)}$, $\varepsilon = ${v.fix(c.eps, 2)}$: change of length by quadrature $${v.fix(c.mNow, 5)}$, second-variation prediction $\tfrac14\varepsilon^2\ell(k^2\pi^2/\ell^2-1) = ${v.fix(c.pred, 5)}$` + (c.ell > Math.PI ? String.raw` · the great circle the other way round has length $2\pi-\ell = ${v.fix(c.other, 3)} < \ell$` : '');
        });
      },
    },
  ],
};
