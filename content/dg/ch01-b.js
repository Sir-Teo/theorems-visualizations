// Differential Geometry of Curves & Surfaces — Chapter 1: Plane curves (part b: 1.9–1.15)
import { TAU, clamp, simpson, frame, arcTable, nearestT, circum, arcPts, rk4 } from './ch01.shared.js';

const PI = Math.PI;

export default {
  collection: 'dg',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Proposition',
      name: 'Constant curvature means a line or a circle',
      statement: String.raw`Let $\beta: I \to \R^2$ be a unit-speed plane curve with constant signed curvature $\kappa \equiv \kappa_0$ on an interval. If $\kappa_0 = 0$, $\beta$ is a segment of a straight line. If $\kappa_0 \neq 0$, $\beta$ is an arc of the circle of radius $1/|\kappa_0|$ centred at $\beta(s_0) + \frac{1}{\kappa_0}N(s_0)$, traversed counterclockwise when $\kappa_0 > 0$ and clockwise when $\kappa_0 < 0$. Constancy matters: for $\kappa(s) = \kappa_0 + \varepsilon s$ with $\varepsilon \neq 0$ the curve is a spiral, not a circle.`,
      idea: String.raw`By the fundamental theorem (dg-1.8) the curve is determined by $\kappa$ up to a rigid motion, and a circle of radius $1/\kappa_0$ already has that curvature, so every curve of curvature $\kappa_0$ is a rigid image of it, hence a circle. Directly: the centre of curvature $c = \beta + N/\kappa_0$ has $c' = T + \frac{1}{\kappa_0}(-\kappa_0 T) = 0$, so it is a fixed point at distance $1/|\kappa_0|$ from the curve. For $\kappa_0 = 0$ one has $T' = 0$, so $T$ is constant and $\beta$ is a line.`,
      caption: String.raw`Choose $\kappa$ and drag the three blue, orange and teal starting points and their direction arrows: every start gives a circle of radius $1/|\kappa|$ (dashed), centred on the normal side, and a line when $\kappa = 0$. The right plot shows each curve's distance from its own initial centre of curvature: flat at $1/|\kappa|$. Now turn on the **break it** slider $\varepsilon$ so that the curvature drifts, $\kappa_0 + \varepsilon s$: the curves spiral, and the distances from the initial centre drift away from the constant.`,
      deps: ['dg-1.8'],
      refs: ['Pressley Ch. 2'],
      tags: ['curvature', 'circle', 'line'],
      viz(v) {
        const kS = v.slider('curvature $\\kappa$', -2, 2, 0.8, { step: 0.01 });
        const LS = v.slider('length $L$', 1, 14, 7, { step: 0.1 });
        const eS = v.slider('break it: $\\kappa(s) = \\kappa + \\varepsilon s$, $\\varepsilon$', 0, 0.25, 0, { step: 0.005 });
        const S = v.stage({ x: [-6.4, 6.4], y: [-4.6, 4.6], equal: true, axes: false, height: 380, title: 'curves of curvature $\\kappa$ from three starts' });
        const D = v.stage({ x: [0, 14], y: [0, 3], axes: 'box', gutter: true, height: 380, weight: 0.75, minWidth: 240, xlabel: 'arc length $s$', ylabel: '$|\\beta - c_0|$', title: 'distance from the initial centre of curvature' });
        const starts = [
          { x: -3.6, y: -1.6, a: 0.4, color: 'blue' },
          { x: 0.8, y: 2.2, a: 3.4, color: 'orange' },
          { x: 3.2, y: -2.3, a: 1.9, color: 'teal' },
        ];
        const TL = 0.95;
        starts.forEach((st, i) => {
          const b = S.handle(st.x, st.y, { color: st.color, r: 7 });
          const t = S.handle(st.x + TL * Math.cos(st.a), st.y + TL * Math.sin(st.a), {
            color: st.color, r: 5,
            constrain: (x, y) => { st.a = Math.atan2(y - b.y, x - b.x); return [b.x + TL * Math.cos(st.a), b.y + TL * Math.sin(st.a)]; },
          });
          b.onDrag = () => t.set(b.x + TL * Math.cos(st.a), b.y + TL * Math.sin(st.a));
          st.b = b; st.t = t;
        });
        v.render(() => {
          const k0 = kS.value, L = LS.value, eps = eS.value;
          let worst = 0, top = 1 / Math.max(Math.abs(k0), 0.5);
          const lines = [];
          for (const st of starts) {
            const p0 = [st.b.x, st.b.y];
            const n = 280, h = L / n;
            const states = rk4((s, y) => [Math.cos(y[2]), Math.sin(y[2]), k0 + eps * s], 0, [p0[0], p0[1], st.a], h, n);
            const pts = states.map((q) => [q[0], q[1]]);
            S.path(pts, { color: st.color, width: 3 });
            S.arrow(p0[0], p0[1], p0[0] + TL * Math.cos(st.a), p0[1] + TL * Math.sin(st.a), { color: st.color, width: 2 });
            const Nn = [-Math.sin(st.a), Math.cos(st.a)];
            const line = [];
            if (Math.abs(k0) > 1e-3) {
              const c0 = [p0[0] + Nn[0] / k0, p0[1] + Nn[1] / k0], R = 1 / Math.abs(k0);
              S.circle(c0[0], c0[1], R, { color: st.color, alpha: 0.35, width: 1.2, dash: true });
              S.dot(c0[0], c0[1], { r: 3.5, color: st.color });
              pts.forEach((p, i) => { const d = Math.hypot(p[0] - c0[0], p[1] - c0[1]); line.push([i * h, d]); worst = Math.max(worst, Math.abs(d - R) / R); top = Math.max(top, d * 1.1); });
            } else {
              pts.forEach((p, i) => { const d = Math.abs((p[0] - p0[0]) * -Math.sin(st.a) + (p[1] - p0[1]) * Math.cos(st.a)); line.push([i * h, d]); worst = Math.max(worst, d); top = Math.max(top, d * 1.1); });
            }
            lines.push([st.color, line]);
          }
          D.setView([0, L], [0, Math.min(top, 12) * 1.05]);
          if (Math.abs(k0) > 1e-3) D.hline(1 / Math.abs(k0), { color: 'faint', dash: true });
          for (const [c, line] of lines) D.path(line, { color: c, width: 2.4 });
          D.setLabels('arc length $s$', Math.abs(k0) > 1e-3 ? '$|\\beta - c_0|$' : 'distance from the line');
          v.readout(() => Math.abs(k0) > 1e-3
            ? `$\\kappa=${v.fix(k0, 2)}$: radius $1/|\\kappa| = ${v.fix(1 / Math.abs(k0), 3)}$, turning ${k0 > 0 ? 'counterclockwise' : 'clockwise'}\nlargest relative deviation of any point from its circle: $${v.sci(worst + 1e-16, 2)}$ ${eps === 0 ? '(numerical zero: every curve is a circle)' : '— with $\\varepsilon>0$ the curvature is no longer constant and the curves spiral'}`
            : `$\\kappa=0$: all three curves are straight; largest distance from the initial tangent line: $${v.sci(worst + 1e-16, 2)}$ ${eps === 0 ? '' : '— with $\\varepsilon>0$ they bend into a clothoid'}`);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Proposition',
      name: 'Curvature of graphs and implicit curves',
      statement: String.raw`(a) The graph $y = f(x)$ of a $C^2$ function, oriented by increasing $x$, has signed curvature
$$\kappa = \frac{f''}{(1 + f'^2)^{3/2}}.$$
(b) Let $F$ be $C^2$ and $c$ a regular value, i.e. $\nabla F \neq 0$ on the level curve $\{F = c\}$. Oriented by the tangent $T = (-F_y, F_x)/|\nabla F|$, the level curve has signed curvature
$$\kappa = \frac{F_y^2F_{xx} - 2F_xF_yF_{xy} + F_x^2F_{yy}}{(F_x^2 + F_y^2)^{3/2}}.$$
If $\nabla F$ vanishes at a point of the level set (a critical level, such as the crossing of $x^2 - y^2 = 0$), the level set need not be a curve there and the formula breaks down.`,
      idea: String.raw`(a) is the general formula of dg-1.4 for $\alpha(x) = (x, f(x))$, where $x' = 1$, $y' = f'$, $y'' = f''$. For (b), the implicit function theorem (pma-9.28) writes the level curve locally as a graph $y = g(x)$ with $g' = -F_x/F_y$; differentiating $F(x, g(x)) = c$ twice gives $g''$ in terms of the second partials, and substituting into (a) yields the formula. Its sign convention is that of the tangent $(-F_y, F_x)$, which turns left when the circle $x^2 + y^2 = r^2$ is traversed counterclockwise.`,
      caption: String.raw`Type a function $f(x)$ or a function $F(x,y)$ and a level $c$, and drag the gold point along the curve. The green circle is built from the formula; the dashed orange circle passes through three points of the curve at distance $h$ apart (found independently, by projecting onto the level set), and the two radii agree to about $h^2$. In graph mode the dashed teal line is the function $\kappa(x)$. Try $x^2 - y^2$ at level $c = 0$ to see the formula break at the critical point.`,
      deps: ['dg-1.4', 'pma-9.28'],
      refs: ['Pressley Ch. 2'],
      tags: ['curvature', 'graph', 'implicit curve'],
      viz(v) {
        const mode = v.select('curve', [{ value: 'graph', label: 'graph $y=f(x)$' }, { value: 'imp', label: 'level curve $F(x,y)=c$' }], 'graph');
        const fIn = v.input('$f(x)=$', 'sin(x) + x/3', { vars: ['x'], width: 230 });
        const FIn = v.input('$F(x,y)=$', 'x^2/4 + y^2', { vars: ['x', 'y'], width: 230 });
        const cS = v.slider('level $c$', 0, 4, 1, { step: 0.01 });
        const hS = v.slider('three-point spacing $h$', 0.002, 0.8, 0.2, { log: true });
        const S = v.stage({ x: [-5.2, 5.2], y: [-3.4, 3.4], equal: true, axes: true, height: 400, title: 'curve, osculating circle from the formula (green) and from three points (orange)' });
        const P = S.handle(1, 1, { color: 'gold', r: 8 });
        const gradF = (F, x, y, e = 1e-4) => [(F(x + e, y) - F(x - e, y)) / (2 * e), (F(x, y + e) - F(x, y - e)) / (2 * e)];
        const project = (F, c, x, y) => {
          for (let i = 0; i < 30; i++) { const val = F(x, y) - c, g = gradF(F, x, y), n2 = g[0] * g[0] + g[1] * g[1]; if (!(n2 > 1e-12) || !Number.isFinite(val)) break; x -= (val * g[0]) / n2; y -= (val * g[1]) / n2; if (Math.abs(val) < 1e-13) break; }
          return [x, y];
        };
        v.render(() => {
          const g = mode.value === 'graph'; fIn.el.hidden = !g; FIn.el.hidden = g; cS.el.hidden = g;
          const f = fIn.fn, F = FIn.fn, c = cS.value, hh = hS.value;
          let p, T, kForm, ok = true, err = '';
          if (g) {
            if (!f) { v.readout(() => 'the formula for $f$ has an error — see the message above'); return; }
            p = [clamp(P.x, -5, 5), 0]; p[1] = f(p[0]); P.set(p[0], p[1]);
            S.fn((x) => f(x), { color: 'ink', width: 2.6 });
            const e = 1e-3, d1 = (f(p[0] + e) - f(p[0] - e)) / (2 * e), d2 = (f(p[0] + e) - 2 * p[1] + f(p[0] - e)) / (e * e);
            kForm = d2 / Math.pow(1 + d1 * d1, 1.5); const m = Math.hypot(1, d1); T = [1 / m, d1 / m];
            S.fn((x) => { const a = (f(x + e) - f(x - e)) / (2 * e), b = (f(x + e) - 2 * f(x) + f(x - e)) / (e * e); return b / Math.pow(1 + a * a, 1.5); }, { color: 'teal', width: 1.6, dash: true });
          } else {
            if (!F) { v.readout(() => 'the formula for $F$ has an error — see the message above'); return; }
            p = project(F, c, P.x, P.y); P.set(p[0], p[1]);
            S.contour((x, y) => F(x, y), [c], { color: 'ink', width: 2.6, res: 220 });
            const gr = gradF(F, p[0], p[1]), gm = Math.hypot(...gr), e = 1e-3;
            if (!(gm > 1e-6)) { ok = false; err = 'the gradient vanishes here, so the level set need not be a curve and the formula does not apply'; kForm = NaN; T = [1, 0]; }
            else {
              const Fx = gr[0], Fy = gr[1], Fxx = (F(p[0] + e, p[1]) - 2 * F(p[0], p[1]) + F(p[0] - e, p[1])) / (e * e), Fyy = (F(p[0], p[1] + e) - 2 * F(p[0], p[1]) + F(p[0], p[1] - e)) / (e * e);
              const Fxy = (F(p[0] + e, p[1] + e) - F(p[0] + e, p[1] - e) - F(p[0] - e, p[1] + e) + F(p[0] - e, p[1] - e)) / (4 * e * e);
              kForm = (Fy * Fy * Fxx - 2 * Fx * Fy * Fxy + Fx * Fx * Fyy) / (gm * gm * gm); T = [-Fy / gm, Fx / gm];
            }
          }
          S.arrow(p[0], p[1], p[0] + 0.8 * T[0], p[1] + 0.8 * T[1], { color: 'blue', width: 2.2 });
          // three-point circle, independent of the formula
          let q1, q2;
          if (g) { q1 = [p[0] - hh, f(p[0] - hh)]; q2 = [p[0] + hh, f(p[0] + hh)]; }
          else { q1 = project(F, c, p[0] - hh * T[0], p[1] - hh * T[1]); q2 = project(F, c, p[0] + hh * T[0], p[1] + hh * T[1]); }
          const ci = circum(q1, p, q2);
          let kCirc = NaN;
          if (ci) { kCirc = (Math.sign(T[0] * (ci.c[1] - p[1]) - T[1] * (ci.c[0] - p[0])) || 1) / ci.R; S.circle(ci.c[0], ci.c[1], ci.R, { color: 'orange', width: 2, dash: true }); for (const q of [q1, q2]) S.dot(q[0], q[1], { r: 4, color: 'orange' }); }
          if (Number.isFinite(kForm) && Math.abs(kForm) > 1e-4) {
            const N = [-T[1], T[0]], R = 1 / Math.abs(kForm), sg = Math.sign(kForm), c0 = [p[0] + sg * N[0] * R, p[1] + sg * N[1] * R];
            S.circle(c0[0], c0[1], R, { color: 'green', width: 2.4, fill: 'green', fillAlpha: 0.06 }); S.dot(c0[0], c0[1], { r: 3.5, color: 'green' });
          }
          v.readout(() => ok
            ? `formula: $\\kappa = ${v.fix(kForm, 5)}$ · three-point circle: $\\kappa \\approx ${Number.isFinite(kCirc) ? v.fix(kCirc, 5) : '0'}$ (spacing $h=${v.fix(hh, 3)}$) · difference $${v.sci(Math.abs(kForm - (Number.isFinite(kCirc) ? kCirc : 0)) + 1e-16, 2)}$`
            : err);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Definition',
      name: 'The Euler spiral (clothoid)',
      statement: String.raw`The **Euler spiral** or **clothoid** is the plane curve whose signed curvature is proportional to arc length, $\kappa(s) = a s$ with $a > 0$. By the fundamental theorem (dg-1.8), starting at the origin along the $x$-axis it is
$$\beta(s) = \left(\int_0^s \cos\tfrac{a u^2}{2}\,du,\ \int_0^s \sin\tfrac{a u^2}{2}\,du\right),$$
the Fresnel integrals. As $s \to \pm\infty$ it winds ever more tightly, with infinite length, towards the two limit points $\pm\frac12\sqrt{\pi/a}\,(1, 1)$. Because the curvature grows at a constant rate, it is used as a **transition curve** between a straight road or rail and a circular arc of radius $R$: with $a = 1/(R\,L_s)$ the curvature rises from $0$ to $1/R$ over the length $L_s$.`,
      idea: String.raw`The tangent angle is $\theta(s) = \int_0^s \kappa = a s^2/2$, so $\beta' = (\cos\frac{as^2}{2}, \sin\frac{as^2}{2})$ and integrating gives the Fresnel integrals (dg-1.8). They converge as $s \to \infty$ because the angle $as^2/2$ oscillates ever faster, so the contributions of successive loops form an alternating series with decreasing terms: $\int_0^\infty \cos\frac{au^2}{2}\,du = \frac12\sqrt{\pi/a}$ by the classical Fresnel limit. A vehicle at constant speed with a steering wheel turning at a constant rate follows exactly such a curve.`,
      caption: String.raw`Left: the clothoid for $s \in [-L, L]$; slide the sharpness $a$ and watch it spiral into the two red limit points, whose coordinates are computed by the formula $\frac12\sqrt{\pi/a}$. Middle: a road with straight stretch, transition spiral of length $L_s$ and circular arc of radius $R$ (illustrative metres); with $L_s = 0$ the curvature jumps from $0$ to $1/R$ at once, which would need an instantaneous turn of the steering wheel. Right: the curvature profile $\kappa(s)$ along the road. The readout compares the measured lateral shift of the arc with the engineers' approximation $L_s^2/(24R)$.`,
      deps: ['dg-1.8'],
      refs: ['Pressley Ch. 2'],
      tags: ['clothoid', 'Fresnel integrals', 'transition curve'],
      credit: 'Euler, 1744 (as a curve of the elastica); Cornu, 1874',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euler_spiral' },
      viz(v) {
        const aS = v.slider('sharpness $a$ in $\\kappa=as$', 0.2, 4, 1, { step: 0.01, log: true });
        const LS = v.slider('spiral half-length $L$', 1, 8, 5, { step: 0.1 });
        const RS = v.slider('road radius $R$ (m)', 40, 200, 100, { step: 1 });
        const TS = v.slider('transition length $L_s$ (m)', 0, 150, 60, { step: 1 });
        const S = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], equal: true, axes: true, height: 360, title: 'the Euler spiral' });
        const Rd = v.stage({ x: [-80, 220], y: [-30, 130], equal: true, axes: false, height: 360, weight: 1.15, minWidth: 280, title: 'road: straight, transition, circular arc' });
        const K = v.stage({ x: [-80, 220], y: [0, 0.03], axes: 'box', gutter: true, height: 360, weight: 0.8, minWidth: 240, xlabel: 'distance along road $s$ (m)', ylabel: '$\\kappa$ (1/m)', title: 'curvature along the road' });
        v.render(() => {
          const a = aS.value, L = LS.value;
          // cumulative Fresnel integrals for s in [0, L]
          const n = 500, h = L / n, pos = [[0, 0]];
          for (let i = 1; i <= n; i++) {
            const s0 = (i - 1) * h, s1 = i * h, sm = (s0 + s1) / 2, f = (u, g) => g((a * u * u) / 2);
            pos.push([pos[i - 1][0] + (h / 6) * (f(s0, Math.cos) + 4 * f(sm, Math.cos) + f(s1, Math.cos)), pos[i - 1][1] + (h / 6) * (f(s0, Math.sin) + 4 * f(sm, Math.sin) + f(s1, Math.sin))]);
          }
          const neg = pos.map(([x, y]) => [-x, -y]);
          const lim = 0.5 * Math.sqrt(PI / a);
          const R2 = Math.max(0.9, 1.15 * Math.max(...pos.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])))), lim * 1.2);
          S.setView([-R2, R2], [-R2, R2]);
          S.path(pos, { color: 'accent', width: 2.6 }); S.path(neg, { color: 'accent', width: 2.6 });
          for (const sg of [-1, 1]) { S.dot(sg * lim, sg * lim, { r: 5, color: 'red' }); }
          S.tex(`(${v.fix(lim, 3)},\\,${v.fix(lim, 3)})`, lim, lim + 0.12 * R2, { color: 'red', align: 'right' });
          // road
          const R = RS.value, Ls = TS.value, phiMax = 1.45;
          const th = (s) => (s <= 0 ? 0 : Ls > 0 && s < Ls ? (s * s) / (2 * R * Ls) : (Ls / (2 * R)) + (s - Ls) / R);
          const sEnd = Ls + R * (phiMax - Ls / (2 * R));
          const kap = (s) => (s <= 0 ? 0 : Ls > 0 && s < Ls ? s / (R * Ls) : 1 / R);
          const m = 600, ds = sEnd / m, pts = [[0, 0]];
          for (let i = 1; i <= m; i++) { const s0 = (i - 1) * ds, s1 = i * ds, sm = (s0 + s1) / 2; pts.push([pts[i - 1][0] + (ds / 6) * (Math.cos(th(s0)) + 4 * Math.cos(th(sm)) + Math.cos(th(s1))), pts[i - 1][1] + (ds / 6) * (Math.sin(th(s0)) + 4 * Math.sin(th(sm)) + Math.sin(th(s1)))]); }
          Rd.line(-80, 0, 0, 0, { color: 'accent', width: 3 });
          Rd.path(pts.slice(0, Math.max(2, Math.round((Ls / sEnd) * m) + 1)), { color: 'green', width: 4 });
          Rd.path(pts.slice(Math.round((Ls / sEnd) * m)), { color: 'accent', width: 3 });
          // the circular arc continued backwards to show its shift from the straight line
          const ce = pts[Math.round((Ls / sEnd) * m)], te = th(Ls), cc = [ce[0] - R * Math.sin(te), ce[1] + R * Math.cos(te)];
          Rd.circle(cc[0], cc[1], R, { color: 'faint', width: 1.2, dash: true });
          const shift = cc[1] - R; // lateral offset of the circle's lowest point from the straight tangent line
          Rd.dot(cc[0], cc[1] - R, { r: 4, color: 'orange' });
          Rd.line(cc[0], 0, cc[0], cc[1] - R, { color: 'orange', width: 2 });
          Rd.tex('p', cc[0] + 6, (cc[1] - R) / 2 + 4, { color: 'orange' });
          // curvature profile
          K.setView([-80, 220], [0, Math.max(0.0125, 1.25 / R)]);
          K.path([[-80, 0], [0, 0], ...(Ls > 0 ? [[0, 0], [Ls, 1 / R]] : [[0, 0], [0, 1 / R]]), [sEnd, 1 / R]], { color: 'accent', width: 2.6 });
          K.fn(() => 1 / R, { domain: [-80, 220], color: 'faint', dash: true, width: 1 });
          void kap;
          const approx = (Ls * Ls) / (24 * R), V = 80 / 3.6;
          v.readout(() => `spiral limit points: $\\pm\\frac12\\sqrt{\\pi/a} = \\pm${v.fix(lim, 4)}$ (distance of the end from it at $s=L$: $${v.fix(Math.hypot(pos[n][0] - lim, pos[n][1] - lim), 3)}$)\nroad with $R=${R}$ m and $L_s=${Ls}$ m: steering rate $d\\kappa/ds = ${Ls > 0 ? v.sci(1 / (R * Ls), 2) : '\\infty'}$ m$^{-2}$; lateral jerk at 80 km/h: ${Ls > 0 ? '$' + v.fix(V * V * V / (R * Ls), 2) + '$ m/s³' : 'unbounded'} (illustrative)\nlateral shift of the arc $p = ${v.fix(shift, 3)}$ m (measured) vs $L_s^2/(24R) = ${v.fix(approx, 3)}$ m`);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12',
      kind: 'Definition',
      name: 'The logarithmic spiral',
      statement: String.raw`The **logarithmic** (equiangular) spiral is the curve $r = a\,e^{b\theta}$ in polar coordinates, $a > 0$, $b \neq 0$. (i) It meets every ray from the origin at the same angle $\psi$, with $\cot\psi = b$. (ii) Scaling by $\lambda > 0$ about the origin maps it to itself, and equals a rotation by $(\ln\lambda)/b$; so it is **self-similar**. (iii) Its curvature at distance $r$ from the pole is $\kappa = \dfrac{1}{r\sqrt{1 + b^2}}$, inversely proportional to $r$. (iv) The arc length from the pole (reached as $\theta \to -\infty$ when $b > 0$) to the point at distance $r$ is finite, $r\sqrt{1+b^2}/b$, although the curve winds around the pole infinitely often. For $b = 0$ it degenerates to a circle.`,
      idea: String.raw`In polar form $\beta'(\theta) = e^{b\theta} a\,(b\cos\theta - \sin\theta,\ b\sin\theta + \cos\theta)$: the radial component is $b$ times the transverse one, which gives the constant angle. Replacing $\theta$ by $\theta + \varphi$ multiplies $r$ by $e^{b\varphi}$, which is the self-similarity. Plugging into $\kappa = (x'y'' - y'x'')/|\beta'|^3$ gives (iii), and $|\beta'| = r\sqrt{1+b^2}$ integrated from $-\infty$ gives (iv) because $\int_{-\infty}^{\theta} e^{b u}\,du$ converges.`,
      caption: String.raw`Drag the gold point along the spiral and change $b$. The tangent (blue) always makes the same angle $\psi$ with the radius (gold arc), whatever the point. The dashed gold curve is the spiral magnified by $\lambda$ and rotated by $\ln\lambda/b$: it lies on top of the original, and the readout gives the largest gap between the two. The right panel plots the curvature against $r$ on logarithmic axes: a straight line of slope $-1$. The length from the pole is measured by summing chords and compared with $r\sqrt{1+b^2}/b$.`,
      deps: ['dg-1.4'],
      refs: ['Pressley Ch. 1'],
      tags: ['logarithmic spiral', 'self-similarity', 'equiangular'],
      credit: 'Descartes, 1638 (equiangular property); J. Bernoulli, spira mirabilis',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Logarithmic_spiral' },
      viz(v) {
        const A = 0.25;
        const bS = v.slider('growth rate $b$ in $r=ae^{b\\theta}$', 0.04, 0.6, 0.2, { step: 0.005 });
        const lS = v.slider('magnification $\\lambda$', 1, 8, 2.5, { step: 0.01, log: true });
        const S = v.stage({ x: [-4.8, 4.8], y: [-3.7, 3.7], equal: true, axes: false, height: 380, title: 'equiangular spiral' });
        const K = v.stage({ x: [0.01, 10], y: [0.05, 200], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, weight: 0.75, minWidth: 240, xlabel: '$r$', ylabel: '$\\kappa$', title: 'curvature against distance (log–log)' });
        let th = 9;
        const P = S.handle(0, 0, {
          color: 'gold', r: 8,
          constrain: (x, y) => { const b = bS.value, r = Math.hypot(x, y) || 1e-6, phi = Math.atan2(y, x), est = Math.log(r / A) / b, k = Math.round((est - phi) / TAU); th = clamp(phi + TAU * k, -40, 40); const rr = A * Math.exp(b * th); return [rr * Math.cos(th), rr * Math.sin(th)]; },
        });
        const sp = (b, t) => { const r = A * Math.exp(b * t); return [r * Math.cos(t), r * Math.sin(t)]; };
        v.render(() => {
          const b = bS.value, lam = lS.value, rMax = 4.6;
          const t1 = Math.log(rMax / A) / b, t0 = Math.log(0.004 / A) / b;
          th = clamp(th, t0, t1);
          const p = sp(b, th); P.set(p[0], p[1]);
          const n = Math.min(4000, Math.ceil(((t1 - t0) / TAU) * 80));
          S.curve((t) => sp(b, t), t0, t1, { n, color: 'accent', width: 2.6 });
          // magnified, rotated copy
          const phi = Math.log(lam) / b, ca = Math.cos(phi), sa = Math.sin(phi);
          const cop = (t) => { const q = sp(b, t); return [lam * (ca * q[0] - sa * q[1]), lam * (sa * q[0] + ca * q[1])]; };
          const tc = Math.log(rMax / (A * lam)) / b; // keep the copy inside the window
          S.curve(cop, Math.max(t0, Math.log(0.004 / A) / b), tc, { n, color: 'gold', width: 1.8, dash: true });
          let gap = 0; for (let i = 0; i <= 300; i++) { const t = t0 + ((tc - t0) * i) / 300, q = cop(t), rr = Math.hypot(q[0], q[1]), est = Math.log(rr / A) / b, d = Math.atan2(Math.sin(Math.atan2(q[1], q[0]) - est), Math.cos(Math.atan2(q[1], q[0]) - est)); gap = Math.max(gap, rr * Math.abs(d)); }
          const f = frame((t) => sp(b, t), th, 1e-4), er = [Math.cos(th), Math.sin(th)];
          const psi = Math.acos(clamp((f.T[0] * er[0] + f.T[1] * er[1]), -1, 1));
          S.segment([0, 0], p, { color: 'muted', dash: true });
          S.arrow(p[0], p[1], p[0] + 0.9 * f.T[0], p[1] + 0.9 * f.T[1], { color: 'blue', width: 2.4 });
          S.arrow(p[0], p[1], p[0] + 0.9 * er[0], p[1] + 0.9 * er[1], { color: 'muted', width: 1.4 });
          const ar = Math.atan2(er[1], er[0]);
          S.path(arcPts(p[0], p[1], 0.5, ar, ar + psi * Math.sign(f.T[0] * er[1] - f.T[1] * er[0]) * -1, 24), { color: 'gold', width: 2.4 });
          S.dot(0, 0, { r: 4, color: 'ink' });
          // log-log curvature
          K.fn((r) => 1 / (r * Math.sqrt(1 + b * b)), { domain: [0.01, 10], color: 'accent', width: 2.4 });
          K.dot(Math.hypot(...p), Math.abs(f.kappa), { r: 6, color: 'gold' });
          // length from the pole, by chords
          let len = 0, prev = sp(b, t0); const m = 4000; for (let i = 1; i <= m; i++) { const q = sp(b, t0 + ((th - t0) * i) / m); len += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; }
          const r = Math.hypot(...p);
          v.readout(() => `angle between tangent and radius: $\\psi = ${v.fix((psi * 180) / PI, 3)}^\\circ$ vs. $\\operatorname{arccot} b = ${v.fix((Math.atan2(1, b) * 180) / PI, 3)}^\\circ$ (same at every point)\n$\\kappa\\,r = ${v.fix(Math.abs(f.kappa) * r, 4)}$ vs. $1/\\sqrt{1+b^2} = ${v.fix(1 / Math.sqrt(1 + b * b), 4)}$ · the magnified, rotated copy deviates from the spiral by at most $${v.sci(gap + 1e-16, 2)}$\nlength from the pole $= ${v.fix(len, 4)}$ vs. $r\\sqrt{1+b^2}/b = ${v.fix((r * Math.sqrt(1 + b * b)) / b, 4)}$ (finite!)`);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.13
    {
      num: '1.13',
      kind: 'Definition',
      name: 'The tractrix',
      statement: String.raw`A **tractrix** is the path of an object $Q$ attached by a taut leash of fixed length $a$ to a point $P$ that is moved along a straight line, when $Q$ starts at distance $a$ from the line, perpendicular to it. At every moment the leash is tangent to the path, and the segment of the tangent from the curve to the line has constant length $a$ — this property defines the curve. Taking the line as the $x$-axis,
$$\beta(t) = \bigl(a(t - \tanh t),\ a\,\operatorname{sech} t\bigr),\qquad t \ge 0,$$
and the axis is an asymptote: the curve approaches it but never reaches it, and the point $(0,a)$ is a cusp when the symmetric branch is added. If $P$ moves along a curved path instead, the object follows a more general pursuit curve, with the same tangent leash.`,
      idea: String.raw`The leash is tangent because the object is dragged: it can only move along the direction of the leash, so its velocity is the projection of $P$'s velocity onto the leash. If $Q = (x,y)$ and the leash makes angle $\varphi$ with the axis, tangency and $|PQ| = a$ give $dy/dx = -\tan\varphi$ with $y = a\sin\varphi$, i.e. $dy/dx = -y/\sqrt{a^2 - y^2}$. Integrating this ordinary differential equation (pma-6.21) gives the parametrization above.`,
      caption: String.raw`Drag the gold puller along its path (a straight line, a sine wave, a circle). The object (blue) is simulated step by step from the rule "move only along the leash, keeping its length", which is not the formula of the curve. On the straight line the simulated path is compared with $(a(t-\tanh t),\,a\,\operatorname{sech}t)$, and the tangent of the path is extended down to the axis: it always has length $a$. The leash length slider rescales everything. Leashes at earlier moments are shown faintly.`,
      deps: ['dg-1.1'],
      refs: ['do Carmo §1-3'],
      tags: ['tractrix', 'pursuit curve', 'asymptote'],
      credit: 'Perrault, 1670; Huygens, 1692',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tractrix' },
      viz(v) {
        const aS = v.slider('leash length $a$', 0.5, 2.5, 1.5, { step: 0.01 });
        const sel = v.select('path of the puller', [{ value: 'line', label: 'straight line' }, { value: 'sine', label: 'sine wave' }, { value: 'circle', label: 'circle' }], 'line');
        const S = v.stage({ x: [-1.4, 11], y: [-3.6, 3.6], equal: true, axes: false, height: 380, title: 'puller $P$ (gold), object $Q$ (blue)' });
        const paths = {
          line: { r: (u) => [u, 0], u1: 10, view: [[-1.4, 11], [-3.6, 3.6]] },
          sine: { r: (u) => [u, Math.sin(0.9 * u)], u1: 10, view: [[-1.4, 11], [-3.6, 3.6]] },
          circle: { r: (u) => [2.4 * Math.cos(u), 2.4 * Math.sin(u)], u1: TAU - 0.02, view: [[-6, 6], [-4.6, 4.6]] },
        };
        const tabs = {}; const tab = (k) => (tabs[k] ??= arcTable(paths[k].r, 0, paths[k].u1, 800));
        let u = 4;
        const P = S.handle(4, 0, { color: 'gold', r: 8, constrain: (x, y) => { const k = sel.value; u = nearestT(tab(k), paths[k].r, x, y); return paths[k].r(u); } });
        v.render(() => {
          const k = sel.value, pa = paths[k], a = aS.value;
          S.setView(...pa.view);
          S.curve(pa.r, 0, pa.u1, { n: 400, color: 'faint', width: 2, dash: true });
          if (k === 'line') S.hline(0, { color: 'muted', width: 1.2 });
          u = clamp(u, 0.0001, pa.u1); P.set(...pa.r(u));
          // stateless pursuit simulation from u = 0 to the current u
          const n = Math.max(2, Math.min(1500, Math.ceil(u / 0.006)));
          const p0 = pa.r(0), p1 = pa.r(0.001), tg = [p1[0] - p0[0], p1[1] - p0[1]], tm = Math.hypot(...tg);
          let q = [p0[0] + (-tg[1] / tm) * a, p0[1] + (tg[0] / tm) * a];
          let pp = p0; const trail = [q.slice()], ps = [p0], leashes = [];
          for (let i = 1; i <= n; i++) {
            const pn = pa.r((u * i) / n), dx = pn[0] - pp[0], dy = pn[1] - pp[1];
            let ex = pp[0] - q[0], ey = pp[1] - q[1]; const em = Math.hypot(ex, ey); ex /= em; ey /= em;
            const proj = ex * dx + ey * dy; q = [q[0] + ex * proj, q[1] + ey * proj];
            let fx = pn[0] - q[0], fy = pn[1] - q[1]; const fm = Math.hypot(fx, fy); q = [pn[0] - (fx / fm) * a, pn[1] - (fy / fm) * a];
            trail.push(q.slice()); ps.push(pn); pp = pn;
            if (i % Math.max(1, Math.round(n / 14)) === 0) leashes.push([pn, q.slice()]);
          }
          for (const [pn, qn] of leashes) S.segment(pn, qn, { color: 'gold', alpha: 0.28, width: 1.2 });
          S.path(trail, { color: 'accent', width: 3 });
          S.segment([P.x, P.y], q, { color: 'gold', width: 3 });
          S.dot(q[0], q[1], { r: 6, color: 'accent' });
          // independent checks: tangency of the path to the leash and tangent length to the axis
          let maxAng = 0; for (let i = 3; i < trail.length; i++) { const a1 = [trail[i][0] - trail[i - 1][0], trail[i][1] - trail[i - 1][1]], b1 = [ps[i][0] - trail[i][0], ps[i][1] - trail[i][1]]; const c = Math.abs(a1[0] * b1[1] - a1[1] * b1[0]) / (Math.hypot(...a1) * Math.hypot(...b1) + 1e-300); maxAng = Math.max(maxAng, Math.asin(Math.min(1, c))); }
          let txt = `largest angle between the object's path and its leash: $${v.sci(maxAng + 1e-12, 2)}$ rad (the leash is tangent) · leash length $|PQ| = ${v.fix(Math.hypot(P.x - q[0], P.y - q[1]), 4)}$`;
          if (k === 'line' && trail.length > 4) {
            const last = trail[trail.length - 1], prv = trail[trail.length - 2], d = [last[0] - prv[0], last[1] - prv[1]], tlen = Math.abs(last[1] / (d[1] / Math.hypot(...d)));
            const T = u / a, ex = [a * (T - Math.tanh(T)), a / Math.cosh(T)];
            S.curve((t) => [a * (t - Math.tanh(t)), a / Math.cosh(t)], 0, Math.max(0.01, T), { n: 200, color: 'green', width: 1.4, dash: true });
            S.segment(last, [last[0] + (d[0] / d[1]) * -last[1], 0], { color: 'green', width: 1.6, dash: true });
            txt += `\nlength of the tangent from $Q$ to the axis: $${v.fix(tlen, 3)}$ (should be $a=${v.fix(a, 3)}$) · distance from the formula $(a(t-\\tanh t),\\,a\\operatorname{sech}t)$ at $t=${v.fix(T, 2)}$: $${v.sci(Math.hypot(ex[0] - q[0], ex[1] - q[1]) + 1e-12, 2)}$`;
          }
          v.readout(() => txt);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.14
    {
      num: '1.14',
      kind: 'Definition',
      name: 'The catenary',
      statement: String.raw`The **catenary** is the graph $y = a\cosh(x/a)$, $a > 0$. Its curvature is $\kappa = \dfrac{1}{a\cosh^2(x/a)} = \dfrac{a}{y^2}$, largest ($1/a$) at the lowest point and decaying exponentially. It is the shape of a perfectly flexible, inextensible, uniform chain hanging at rest under gravity from two supports: through two points at horizontal distance $D$ and height difference $h$ with a chain of length $\ell > \sqrt{D^2 + h^2}$, the chain takes the form $a\cosh((x - x_0)/a) + c$ where $a$ solves $\sqrt{\ell^2 - h^2} = 2a\sinh(D/2a)$. It is not a parabola, although for shallow sag the two are close.`,
      idea: String.raw`Balance of forces on a piece of chain: the horizontal tension component $H$ is constant and the vertical component equals the weight $\rho g s$ of the chain between the lowest point and the arc length $s$, so $y' = \rho g s/H = s/a$ with $a = H/(\rho g)$. Since $ds = \sqrt{1+y'^2}\,dx$, the function $y'$ solves $y'' = \frac1a\sqrt{1 + y'^2}$, whose solution is $y' = \sinh(x/a)$ (dg-1.4 gives the curvature $y''/(1 + y'^2)^{3/2} = 1/(a\cosh^2)$). A parabola would arise instead if the weight were distributed uniformly along $x$ rather than along the arc, as on a suspension bridge deck.`,
      caption: String.raw`A chain of 22 equal links with a mass at each joint falls under gravity and settles (watch it ring down; it is a physical simulation with damping, not the formula). Drag either support, or change the chain length: the settled polygon follows the green catenary $a\cosh((x-x_0)/a)+c$ whose parameter $a$ is computed from the supports and the measured chain length. Switch on the parabola with the same lowest point and curvature there: it drifts away from the chain farther out, especially for a deep sag.`,
      deps: ['dg-1.4'],
      refs: ['do Carmo §1-3'],
      tags: ['catenary', 'hyperbolic cosine', 'equilibrium'],
      credit: 'Jacob Bernoulli posed it, 1690; solved by Leibniz, Huygens and Johann Bernoulli, 1691',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Catenary' },
      viz(v) {
        const N = 22, G = 9.8;
        const LS = v.slider('chain length $\\ell$', 6.5, 12, 8, { step: 0.05 });
        const par = v.toggle('compare with a parabola', false);
        const S = v.stage({ x: [-6.5, 6.5], y: [-6.2, 3.2], equal: true, axes: false, height: 400, title: 'hanging chain (simulated) and catenary (green)' });
        const hA = S.handle(-3, 1.4, { color: 'gold', r: 8, label: 'A', constrain: { x: [-5.6, -0.6], y: [-1, 2.6] } });
        const hB = S.handle(3, 1.4, { color: 'gold', r: 8, label: 'B', constrain: { x: [0.6, 5.6], y: [-1, 2.6] } });
        const sim = v.sim(
          () => { const st = { x: [], y: [], px: [], py: [] }; for (let i = 0; i <= N; i++) { const u = i / N, x = hA.x + (hB.x - hA.x) * u, y = hA.y + (hB.y - hA.y) * u - 1.6 * Math.sin(PI * u); st.x.push(x); st.y.push(y); st.px.push(x); st.py.push(y); } return st; },
          (st, dt) => {
            const damp = 0.965, ell = LS.value / N;
            for (let i = 1; i < N; i++) { const vx = (st.x[i] - st.px[i]) * damp, vy = (st.y[i] - st.py[i]) * damp; st.px[i] = st.x[i]; st.py[i] = st.y[i]; st.x[i] += vx; st.y[i] += vy - G * dt * dt; }
            for (let it = 0; it < 90; it++) {
              st.x[0] = hA.x; st.y[0] = hA.y; st.x[N] = hB.x; st.y[N] = hB.y;
              for (let k = 0; k < N; k++) {
                const i = it % 2 ? N - 1 - k : k, j = i + 1, dx = st.x[j] - st.x[i], dy = st.y[j] - st.y[i], d = Math.hypot(dx, dy) || 1e-9, diff = (d - ell) / d;
                const wi = i === 0 ? 0 : 1, wj = j === N ? 0 : 1, ws = wi + wj; if (!ws) continue;
                st.x[i] += (dx * diff * wi) / ws; st.y[i] += (dy * diff * wi) / ws; st.x[j] -= (dx * diff * wj) / ws; st.y[j] -= (dy * diff * wj) / ws;
              }
            }
            st.x[0] = hA.x; st.y[0] = hA.y; st.x[N] = hB.x; st.y[N] = hB.y;
          },
          { dt: 1 / 120, maxSteps: 4000 },
        );
        // the catenary through A and B with chain length ell: returns {a, x0, c} (null when the chain is taut)
        const catenary = (A, B, ell) => {
          const D = B[0] - A[0], hh = B[1] - A[1], tgt = Math.sqrt(Math.max(0, ell * ell - hh * hh));
          if (!(tgt > D * (1 + 1e-9))) return null;
          let lo = 1e-3, hi = 1e5; for (let i = 0; i < 200; i++) { const m = Math.sqrt(lo * hi), val = 2 * m * Math.sinh(D / (2 * m)); if (val > tgt) lo = m; else hi = m; }
          const a = Math.sqrt(lo * hi), x0 = D / 2 - a * Math.asinh(hh / tgt), c = A[1] - a * Math.cosh(-x0 / a);
          return { a, x0: A[0] + x0, c, D };
        };
        v.animate((t) => {
          sim.advance(t);
          const st = sim.state, A = [hA.x, hA.y], B = [hB.x, hB.y];
          const pts = st.x.map((x, i) => [x, st.y[i]]);
          let Lm = 0; for (let i = 1; i <= N; i++) Lm += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          const cat = catenary(A, B, Lm);
          if (cat) {
            S.curve((x) => [x, cat.a * Math.cosh((x - cat.x0) / cat.a) + cat.c], A[0], B[0], { n: 200, color: 'green', width: 4, alpha: 0.4 });
            if (par.value) S.curve((x) => [x, cat.c + cat.a + ((x - cat.x0) * (x - cat.x0)) / (2 * cat.a)], A[0], B[0], { n: 200, color: 'red', width: 2, dash: true });
          }
          S.path(pts, { color: 'accent', width: 2.4 });
          S.dots(pts.slice(1, N), { r: 3.6, color: 'ink' });
          // deviations from the catenary and curvature at the lowest node
          let rms = 0, mx = 0; if (cat) { pts.forEach(([x, y]) => { const d = Math.abs(y - (cat.a * Math.cosh((x - cat.x0) / cat.a) + cat.c)); rms += d * d; mx = Math.max(mx, d); }); rms = Math.sqrt(rms / pts.length); }
          let low = 1; pts.forEach((p, i) => { if (i > 0 && i < N && p[1] < pts[low][1]) low = i; });
          const ci = circum(pts[low - 1], pts[low], pts[low + 1]);
          let prm = 0; if (cat) { pts.forEach(([x, y]) => { const yp = cat.c + cat.a + ((x - cat.x0) ** 2) / (2 * cat.a), d = Math.abs(y - yp); prm = Math.max(prm, d); }); }
          const settle = Math.hypot(st.x[Math.round(N / 2)] - st.px[Math.round(N / 2)], st.y[Math.round(N / 2)] - st.py[Math.round(N / 2)]);
          v.readout(() => cat
            ? `catenary parameter $a = ${v.fix(cat.a, 3)}$ (from supports and measured length $${v.fix(Lm, 3)}$) · chain nodes off the catenary: rms $${v.fix(rms, 4)}$, max $${v.fix(mx, 4)}$ ${settle > 2e-4 ? '— still swinging, wait for it to settle' : ''}\ncurvature at the lowest node: chain $${ci ? v.fix(1 / ci.R, 3) : '0'}$ vs. $a/(y-c)^2 = ${v.fix(cat.a / ((pts[low][1] - cat.c) ** 2), 3)}$ (maximum $1/a = ${v.fix(1 / cat.a, 3)}$)${par.value ? `\nparabola with the same vertex and vertex curvature: farthest from the chain by $${v.fix(prm, 3)}$` : ''}`
            : `the supports are as far apart as the chain is long: it is taut and straight — the catenary degenerates to a segment`);
        }, { still: 10 });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.15
    {
      num: '1.15',
      kind: 'Proposition',
      name: 'The cycloid: brachistochrone and tautochrone',
      statement: String.raw`The **cycloid** is the path of a point on the rim of a circle of radius $R$ rolling on a line: $x = R(\theta - \sin\theta)$, $y = R(1 - \cos\theta)$. Consider a bead sliding without friction in uniform gravity $g$ along a wire, starting from rest. (**Brachistochrone**) Among all curves joining $A$ to a lower point $B$ not vertically below $A$, the arc of an (inverted) cycloid with a cusp at $A$ passing through $B$ gives the shortest time of descent, $\theta_B\sqrt{R/g}$. (**Tautochrone**) On an inverted cycloid, a bead released from rest at any point reaches the lowest point in the same time, $\pi\sqrt{R/g}$, independent of the starting height.`,
      idea: String.raw`Energy conservation gives the speed $v = \sqrt{2g(y_A - y)}$ at depth below the start, independent of the path. For the tautochrone, parametrize by $\theta$ with arc length $ds = 2R\sin(\theta/2)\,d\theta$ and speed $\sqrt{2gR(\cos\theta_0 - \cos\theta)}$ from the start $\theta_0$; the substitution $u = \cos(\theta/2)/\cos(\theta_0/2)$ turns the time integral into $\sqrt{R/g}\int_{0}^{1}\frac{2\,du}{\sqrt{1-u^2}}=\pi\sqrt{R/g}$, independent of $\theta_0$. For the brachistochrone, Johann Bernoulli used Fermat's principle: the bead's motion is like a light ray in a medium where the speed is $\sqrt{2gy}$, so Snell's law forces $\sin\alpha / v$ to be constant along the path ($\alpha$ the angle from the vertical), i.e. $y(1 + y'^2) = \text{const}$, which the cycloid satisfies.`,
      caption: String.raw`Left: drag $B$ and the control point of the purple curve. Three frictionless beads start together from rest at $A$: down the cycloid through $A$ and $B$ (blue), down the straight chord (red) and down your curve (purple); their descent times are computed by integrating $ds/v$ with the exact energy speed. The cycloid always arrives first, even when the straight line looks shorter, and the readout compares its numerical time with the exact $\theta_B\sqrt{R/g}$. Right: three beads released at different heights on an inverted cycloid all reach the bottom together, at $\pi\sqrt{R/g}$ (shown here in slow motion).`,
      deps: ['dg-1.4'],
      refs: ['do Carmo §1-3'],
      tags: ['cycloid', 'brachistochrone', 'tautochrone'],
      credit: 'Huygens (tautochrone), 1659; Johann Bernoulli posed the brachistochrone, 1696; solved 1697 by Newton, Leibniz, Jakob Bernoulli, l\'Hôpital and von Tschirnhaus',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Brachistochrone_curve' },
      viz(v) {
        const g = 9.8, SLOW = 0.45;
        const S = v.stage({ x: [-0.5, 6.8], y: [-3.9, 0.8], equal: true, axes: false, height: 340, title: 'race from rest at $A$ to $B$' });
        const T = v.stage({ x: [-0.3, 5.1], y: [-1.9, 0.4], equal: true, axes: false, height: 340, weight: 0.85, minWidth: 260, title: 'tautochrone: release from three heights' });
        const hB = S.handle(4.4, -2.3, { color: 'gold', r: 8, label: 'B', constrain: { x: [0.5, 6.2], y: [-3.5, -0.3] } });
        const hC = S.handle(0.7, -2.4, { color: 'purple', r: 7, constrain: { x: [-0.3, 6.5], y: [-3.7, -0.05] } });
        v.legend([['blue', 'cycloid'], ['red', 'straight line'], ['purple', 'your curve']]);
        // descent table: polyline from rest at pts[0]; v² = 2g(y0 − y) is linear along each chord, so each chord has uniform acceleration
        const descent = (pts) => {
          const y0 = pts[0][1], sp = (p) => Math.sqrt(Math.max(0, 2 * g * (y0 - p[1]))), T0 = [0], seg = [];
          for (let i = 1; i < pts.length; i++) { const ds = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), v1 = sp(pts[i - 1]), v2 = sp(pts[i]), dt = (2 * ds) / (v1 + v2 || 1e-12); seg.push({ ds, v1, v2, dt }); T0.push(T0[i - 1] + dt); }
          return { pts, T: T0, seg, total: T0[T0.length - 1] };
        };
        const at = (D, t) => {
          if (t >= D.total) return D.pts[D.pts.length - 1];
          let lo = 0, hi = D.T.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (D.T[m] <= t) lo = m; else hi = m; }
          const sg = D.seg[lo], tau = t - D.T[lo], acc = (sg.v2 - sg.v1) / sg.dt, f = Math.min(1, (sg.v1 * tau + 0.5 * acc * tau * tau) / sg.ds);
          return [D.pts[lo][0] + f * (D.pts[lo + 1][0] - D.pts[lo][0]), D.pts[lo][1] + f * (D.pts[lo + 1][1] - D.pts[lo][1])];
        };
        const Rt = 0.75, cyc = (th0, th1, R, n = 500) => { const o = []; for (let i = 0; i <= n; i++) { const th = th0 + ((th1 - th0) * i) / n; o.push([R * (th - Math.sin(th)), -R * (1 - Math.cos(th))]); } return o; };
        const rel = [0.7, 1.6, 2.5], relC = ['orange', 'teal', 'pink'];
        const tauto = rel.map((th0) => descent(cyc(th0, PI, Rt, 600)));
        v.animate((t) => {
          const tau = t * SLOW;
          // brachistochrone race
          const B = [hB.x, hB.y], m = -B[1] / B[0];
          let lo = 1e-6, hi = TAU - 1e-6; for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2, r = (1 - Math.cos(mid)) / (mid - Math.sin(mid)); if (r > m) lo = mid; else hi = mid; }
          const thB = (lo + hi) / 2, R = B[0] / (thB - Math.sin(thB));
          const cy = descent(cyc(0, thB, R, 700));
          const ln = descent(Array.from({ length: 401 }, (_, i) => [(B[0] * i) / 400, (B[1] * i) / 400]));
          const C = [hC.x, hC.y], bz = descent(Array.from({ length: 701 }, (_, i) => { const u = i / 700; return [2 * u * (1 - u) * C[0] + u * u * B[0], 2 * u * (1 - u) * C[1] + u * u * B[1]]; }));
          S.curve((u) => [2 * u * (1 - u) * C[0] + u * u * B[0], 2 * u * (1 - u) * C[1] + u * u * B[1]], 0, 1, { n: 200, color: 'purple', width: 2.2 });
          S.segment([0, 0], B, { color: 'red', width: 2.2 });
          S.path(cy.pts, { color: 'blue', width: 2.6 });
          S.dot(0, 0, { r: 5, color: 'ink', label: 'A', labelPos: 'nw' });
          for (const [D, c] of [[ln, 'red'], [bz, 'purple'], [cy, 'blue']]) { const p = at(D, tau); S.dot(p[0], p[1], { r: 7, color: c }); }
          // tautochrone
          T.path(cyc(0, TAU, Rt, 300), { color: 'blue', width: 2.2, alpha: 0.7 });
          tauto.forEach((D, i) => { const p = at(D, tau), p0 = D.pts[0]; T.dot(p0[0], p0[1], { r: 3, color: relC[i], hollow: true }); T.dot(p[0], p[1], { r: 7, color: relC[i] }); });
          const exact = Math.sqrt(Rt / g) * PI;
          v.readout(() => `descent times: cycloid $${v.fix(cy.total, 4)}$ s (exact $\\theta_B\\sqrt{R/g} = ${v.fix(thB * Math.sqrt(R / g), 4)}$ s) · straight line $${v.fix(ln.total, 4)}$ s · your curve $${v.fix(bz.total, 4)}$ s → the cycloid wins by $${v.fix(Math.min(ln.total, bz.total) - cy.total, 4)}$ s\ntautochrone: times to the bottom from three heights $${tauto.map((D) => v.fix(D.total, 4)).join('$, $')}$ s, all equal to $\\pi\\sqrt{R/g} = ${v.fix(exact, 4)}$ s (here $R=${Rt}$ m, $g=9.8$ m/s²)`);
        }, { period: 3.4, still: 1.2 });
      },
    },
  ],
};
