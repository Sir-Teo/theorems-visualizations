// Differential Geometry of Curves & Surfaces — Chapter 1: Plane curves (part a: 1.1–1.8)
import { TAU, clamp, simpson, frame, arcTable, tOfS, sOfT, nearestT, circum, arcPts, ell, catmull, zeros } from './ch01.shared.js';

const PI = Math.PI;

export default {
  collection: 'dg',
  chapter: 1,
  title: 'Plane curves',
  summary: String.raw`A regular curve can be reparametrized by arc length, and then all of its local geometry is captured by one function: the signed curvature, the rate at which the tangent turns. The osculating circle, evolutes and parallel curves are read off from it, and the fundamental theorem says that curvature determines the curve up to a rigid motion. Classical curves — tractrix, catenary, cycloid, clothoid — each solve a geometric or physical problem.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Parametrized and regular curves',
      statement: String.raw`A **parametrized (differentiable) curve** is a smooth map $\alpha: I \to \R^2$ from an interval; its **trace** is the image set. It is **regular** if the velocity never vanishes, $\alpha'(t) \neq 0$ for every $t \in I$. At a regular point the trace has a tangent line, spanned by $\alpha'(t)$, and the unit tangent $T = \alpha'/|\alpha'|$ varies smoothly. Regularity is a property of the **map**, not of the trace: the same smooth trace can be given a parametrization that stalls (speed $0$) at some instant, and a trace with a corner or cusp can only arise from a parametrization that stalls.`,
      idea: String.raw`Differentiability of $\alpha$ alone says nothing about the picture, because the chain rule gives $(\alpha\circ\varphi)' = (\alpha'\circ\varphi)\,\varphi'$ (pma-5.16): changing the clock $\varphi$ rescales the velocity by $\varphi'$ and can make it vanish where $\alpha'$ did not. Conversely, if $\alpha'(t_0) \neq 0$ the curve leaves $\alpha(t_0)$ in a definite direction on both sides, so no cusp can form; a cusp needs the velocity to reverse through $0$, as in $(t^2, t^3)$ where $\alpha'(t) = (2t, 3t^2)$.`,
      caption: String.raw`Choose a trace and slide the **clock distortion** $w$: the time map $\varphi(t) = (1-w)\,t + w\,t^3$ changes how fast the beads (equal steps of $t$) travel, but never the trace. The right panel plots the speed $|\alpha'(t)|$. At $w = 1$ the circle is still a perfectly smooth trace although its speed touches $0$ at $t = 0$, so "regular" fails. The semicubical parabola $(u^2, u^3)$ has a cusp for every $w$, and the cubed line $(u^3, u^3)$ has no corner at all. The readout compares the unit velocities just before and after the stall: $-1$ means the curve turned back on itself.`,
      deps: ['pma-5.16'],
      refs: ['do Carmo §1-2', 'do Carmo §1-3'],
      tags: ['regular curve', 'velocity', 'cusp'],
      credit: 'Neile, 1657 (rectification of the semicubical parabola)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Semicubical_parabola' },
      viz(v) {
        const C = {
          circle: { r: (u) => [Math.cos(PI * u), Math.sin(PI * u)], dr: (u) => [-PI * Math.sin(PI * u), PI * Math.cos(PI * u)], name: 'circle' },
          cusp: { r: (u) => [1.4 * u * u - 0.7, 1.4 * u * u * u], dr: (u) => [2.8 * u, 4.2 * u * u], name: 'semicubical parabola $(u^2,u^3)$' },
          line: { r: (u) => [1.6 * u * u * u, 0.9 * u * u * u], dr: (u) => [4.8 * u * u, 2.7 * u * u], name: 'cubed line $(u^3,u^3)$' },
        };
        const sel = v.select('trace', [{ value: 'circle', label: 'circle' }, { value: 'cusp', label: 'cusp $(u^2,u^3)$' }, { value: 'line', label: 'line $(u^3,u^3)$' }], 'circle');
        const wS = v.slider('clock distortion $w$', 0, 1, 0.6, { step: 0.01 });
        const S = v.stage({ x: [-1.6, 1.6], y: [-1.45, 1.45], equal: true, axes: false, height: 340, title: 'trace and velocity vectors at equal steps of $t$' });
        const G = v.stage({ x: [-1, 1], y: [0, 6], axes: 'box', gutter: true, height: 340, weight: 0.75, minWidth: 240, xlabel: '$t$', ylabel: 'speed $|\\alpha\'(t)|$', });
        const phi = (t, w) => (1 - w) * t + w * t * t * t, dphi = (t, w) => 1 - w + 3 * w * t * t;
        const vel = (c, t, w) => { const d = c.dr(phi(t, w)), k = dphi(t, w); return [d[0] * k, d[1] * k]; };
        v.render(() => {
          const c = C[sel.value], w = wS.value;
          const sp = (t) => Math.hypot(...vel(c, t, w));
          let top = 0; for (let i = 0; i <= 200; i++) top = Math.max(top, sp(-1 + i / 100));
          // arrow scale: the longest arrow is about 0.55
          const k = 0.55 / (top || 1);
          S.curve((t) => c.r(phi(t, w)), -1, 1, { n: 400, color: 'ink', width: 2 });
          for (let i = 0; i <= 10; i++) {
            const t = -1 + i / 5, p = c.r(phi(t, w)), u = vel(c, t, w);
            const small = Math.hypot(...u) < 1e-6;
            S.arrow(p[0], p[1], p[0] + k * u[0], p[1] + k * u[1], { color: small ? 'red' : 'orange', width: 2 });
            S.dot(p[0], p[1], { r: small ? 6 : 3.5, color: small ? 'red' : 'accent' });
          }
          G.setView([-1, 1], [0, Math.max(0.5, top * 1.12)]);
          G.fn(sp, { n: 400, color: 'accent', width: 2.2 });
          G.hline(0, { color: 'faint' });
          const s0 = sp(0); if (s0 < 1e-6) G.dot(0, 0, { r: 6, color: 'red' });
          let mn = Infinity; for (let i = 0; i <= 400; i++) mn = Math.min(mn, sp(-1 + i / 200));
          const e = 1e-3, a = vel(c, -e, w), b = vel(c, e, w), d = (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b));
          v.readout(() => `minimum speed on $[-1,1]$: $${v.fix(mn, 4)}$  ${mn > 1e-6 ? '— **regular**' : '— **not regular** (speed $0$ at $t=0$)'}\n$\\hat v(0^-)\\cdot\\hat v(0^+) = ${v.fix(d, 3)}$  ${d < 0 ? '— the trace has a **cusp**' : '— the trace has no corner or cusp'}`);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Arc length',
      statement: String.raw`For a regular curve $\alpha: [a,b] \to \R^2$ the **length** is the supremum of the lengths of inscribed polygons $\sum_i |\alpha(t_i) - \alpha(t_{i-1})|$ over all partitions $a = t_0 < \dots < t_n = b$. For $C^1$ curves this supremum is finite and equals $\int_a^b |\alpha'(t)|\,dt$, and the **arc-length function** $s(t) = \int_a^t |\alpha'(u)|\,du$ is the length of the part of the curve traversed so far. The hypothesis that $\alpha$ is $C^1$ matters: the Koch curve is continuous but its inscribed polygons have unbounded length (it is not **rectifiable**).`,
      idea: String.raw`Each chord is at most the integral of the speed over its subinterval (pma-6.27: $|\int f| \le \int |f|$ for vector-valued $f$), so the polygon lengths are bounded by $\int |\alpha'|$. Refining a partition can only add chord length (triangle inequality), and uniform continuity of $\alpha'$ makes the polygon sums approach the Riemann sums of the speed. For the Koch curve each step replaces every segment by four segments of one third the length, multiplying the polygon length by $4/3$ forever.`,
      caption: String.raw`Pick a curve and raise the number of polygon vertices $n$. The orange polygon is inscribed at equal parameter steps; its length (gold dots, right) always stays below, and climbs to, the integral of the speed (green line, computed independently by Simpson's rule). For the cycloid arch the exact length is $8$, for the Koch curve the polygon lengths $(4/3)^k$ grow without bound: there is no limit to compare with.`,
      deps: ['dg-1.1', 'pma-6.27'],
      refs: ['do Carmo §1-3', 'Pressley Ch. 1'],
      tags: ['arc length', 'rectifiable', 'Koch curve'],
      credit: 'Koch, 1904 (the snowflake curve)',
      viz(v) {
        const R = {
          rose: { r: (t) => { const q = 1 + 0.35 * Math.cos(3 * t); return [1.35 * q * Math.cos(t), 1.35 * q * Math.sin(t)]; }, t0: 0, t1: TAU, closed: true },
          cyc: { r: (t) => [0.62 * (t - Math.sin(t)) - 1.95, 0.62 * (1 - Math.cos(t)) - 0.6], t0: 0, t1: TAU, closed: false },
        };
        const sel = v.select('curve', [{ value: 'rose', label: 'closed rose' }, { value: 'cyc', label: 'cycloid arch' }, { value: 'koch', label: 'Koch curve' }], 'rose');
        const nS = v.slider('vertices $n$', 2, 120, 8, { int: true });
        const kS = v.slider('Koch generation $k$', 0, 6, 2, { int: true });
        const S = v.stage({ x: [-2.2, 2.2], y: [-1.9, 1.9], equal: true, axes: false, height: 340, title: 'inscribed polygon' });
        const G = v.stage({ x: [0, 120], y: [0, 10], axes: 'box', gutter: true, height: 340, weight: 0.85, minWidth: 250, xlabel: 'vertices $n$', ylabel: '$L_n$', title: 'polygon length against $n$' });
        // Koch curve, generation k, on the base segment from (-2, -0.9) to (2, -0.9)
        const koch = (k) => {
          let pts = [[-2, -0.8], [2, -0.8]];
          for (let g = 0; g < k; g++) {
            const out = [];
            for (let i = 0; i < pts.length - 1; i++) {
              const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], dx = (x1 - x0) / 3, dy = (y1 - y0) / 3;
              const a = [x0 + dx, y0 + dy], b = [x0 + 2 * dx, y0 + 2 * dy];
              const apex = [a[0] + dx * 0.5 - dy * Math.sqrt(3) / 2, a[1] + dy * 0.5 + dx * Math.sqrt(3) / 2];
              out.push([x0, y0], a, apex, b);
            }
            out.push(pts[pts.length - 1]); pts = out;
          }
          return pts;
        };
        const polyLen = (pts, closed) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (closed) s += Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]); return s; };
        const cache = {};
        const info = (key) => {
          if (cache[key]) return cache[key];
          const c = R[key], r = c.r;
          const speed = (t) => { const f = frame(r, t); return f.speed; };
          const exact = simpson(speed, c.t0, c.t1, 2000);
          const lens = [0, 0];
          for (let n = 2; n <= 120; n++) { const pts = []; for (let i = 0; i <= n; i++) pts.push(r(c.t0 + ((c.t1 - c.t0) * (c.closed && i === n ? 0 : i)) / n)); lens.push(polyLen(pts, false)); }
          return (cache[key] = { exact, lens });
        };
        v.render(() => {
          const key = sel.value;
          nS.el.hidden = key === 'koch'; kS.el.hidden = key !== 'koch';
          if (key === 'koch') {
            const k = kS.value, pts = koch(k);
            S.setView([-2.2, 2.2], [-1.9, 1.9]);
            S.path(pts, { color: 'orange', width: k > 4 ? 1.1 : 2 });
            if (k < 4) S.dots(pts, { r: 3, color: 'gold' });
            G.setView([-0.4, 6.4], [0, 54]); G.setLabels('generation $k$', '$L_k$');
            const xs = []; for (let i = 0; i <= 6; i++) xs.push([i, polyLen(koch(i), false)]);
            G.path(xs, { color: 'muted', width: 1 }); G.dots(xs, { r: 4, color: 'gold' });
            G.fn((x) => 4 * Math.pow(4 / 3, x), { domain: [0, 6.4], color: 'red', dash: true, width: 1.2 });
            G.dot(k, polyLen(pts, false), { r: 6.5, color: 'orange' });
            v.readout(() => `Koch curve, generation $k=${k}$: $4^{${k}}=${4 ** k}$ segments, polygon length $(4/3)^{${k}}\\cdot 4 = ${v.fix(polyLen(pts, false), 3)}$ — and $(4/3)^k\\to\\infty$: no finite length, because the curve is **not rectifiable**.`);
            return;
          }
          const c = R[key], I = info(key), n = nS.value;
          const bx = c.r(0);
          if (key === 'cyc') S.setView([-2.2, 2.2], [-1.2, 1.9]); else S.setView([-2.2, 2.2], [-1.9, 1.9]);
          S.curve(c.r, c.t0, c.t1, { n: 500, color: 'ink', width: 3, alpha: 0.35 });
          const pts = []; for (let i = 0; i <= n; i++) pts.push(c.r(c.t0 + ((c.t1 - c.t0) * i) / n));
          S.path(pts, { color: 'orange', width: 2.2 });
          if (n <= 60) S.dots(pts, { r: 3.2, color: 'gold' });
          G.setView([0, 122], [0, I.exact * 1.15]); G.setLabels('vertices $n$', '$L_n$');
          G.hline(I.exact, { color: 'green', width: 1.6 });
          G.tex(`\\int|\\alpha'|\\,dt=${v.fix(I.exact, 4)}`, 118, I.exact * 1.06, { color: 'green', align: 'right' });
          const xs = []; for (let m = 2; m <= 120; m++) xs.push([m, I.lens[m]]);
          G.path(xs, { color: 'muted', width: 1.2 });
          G.dot(n, I.lens[n], { r: 6, color: 'gold' });
          void bx;
          const L = n >= 2 ? I.lens[n] : 0;
          v.readout(() => `inscribed polygon with $n=${n}$ chords: length $${v.fix(L, 5)}$ · $\\int_a^b|\\alpha'|\\,dt = ${v.fix(I.exact, 5)}$ · deficit $${v.sci(I.exact - L, 2)}$ ${I.exact - L >= -1e-9 ? '(never negative)' : ''}${key === 'cyc' ? '\n exact value for the cycloid arch of a circle of radius $r$ is $8r$; here $r=0.62$, so $8r = ' + v.fix(8 * 0.62, 4) + '$' : ''}`);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Theorem',
      name: 'Reparametrization by arc length',
      statement: String.raw`Let $\alpha: I \to \R^2$ be a regular $C^k$ curve ($k \ge 1$) and $s(t) = \int_{t_0}^t |\alpha'|$. Then $s: I \to s(I)$ is a $C^k$ diffeomorphism, and $\beta = \alpha \circ s^{-1}$ is a curve with the same trace and $|\beta'(s)| = 1$ for all $s$: the **arc-length** (unit-speed) parametrization. It is unique up to the choice of origin $s_0$ and orientation $s \mapsto \pm s + s_0$. If $\alpha$ is not regular, $s$ need not be invertible and the statement fails.`,
      idea: String.raw`By the fundamental theorem of calculus (pma-6.21) $s'(t) = |\alpha'(t)|$, which is continuous and $> 0$ by regularity; so $s$ is strictly increasing, and by the inverse function theorem its inverse is as smooth as $s$. The chain rule then gives $\beta'(s) = \alpha'(t)/s'(t)$, a vector of length $1$. Any other unit-speed parametrization of the same trace differs by $\pm s + c$ because speed $1$ forces the new arclength function to be $\pm(s - s_0)$.`,
      caption: String.raw`Beads are placed at equal steps of the parameter. On a curve traversed at uneven speed they bunch up where it moves slowly. Switch on **arc-length parametrization** and the same number of beads spreads evenly along the curve (equal chords on straight stretches, equal arcs everywhere), while the speed plot flattens to the constant $1$. The speed shown on the right is measured from the beads' positions by a finite difference, not assumed.`,
      deps: ['dg-1.2', 'pma-6.21'],
      refs: ['do Carmo §1-3', 'Pressley Ch. 1'],
      tags: ['arc length', 'reparametrization', 'unit speed'],
      viz(v) {
        const C = {
          ellipse: { r: (t) => [2 * Math.cos(t), 0.75 * Math.sin(t)], t0: 0, t1: TAU, name: 'ellipse' },
          parab: { r: (t) => [t, 0.55 * t * t * t - 0.4 * t], t0: -1.9, t1: 1.9, name: 'cubic' },
          spiral: { r: (t) => [0.22 * t * Math.cos(t), 0.22 * t * Math.sin(t)], t0: 0.3, t1: 4 * PI, name: 'Archimedean spiral' },
        };
        const sel = v.select('curve', [{ value: 'ellipse', label: 'ellipse' }, { value: 'parab', label: 'cubic' }, { value: 'spiral', label: 'spiral' }], 'ellipse');
        const nS = v.slider('beads', 6, 48, 20, { int: true });
        const arcT = v.toggle('arc-length parametrization', false);
        const S = v.stage({ x: [-2.8, 2.8], y: [-1.9, 1.9], equal: true, axes: false, height: 330, title: 'beads at equal parameter steps' });
        const G = v.stage({ x: [0, 1], y: [0, 4], axes: 'box', gutter: true, height: 330, weight: 0.8, minWidth: 250, xlabel: 'parameter (fraction of its range)', ylabel: 'speed $|\\gamma\'|$', title: 'speed of the parametrization' });
        const tabs = {}; const tab = (k) => (tabs[k] ??= arcTable(C[k].r, C[k].t0, C[k].t1, 3000));
        v.render(() => {
          const key = sel.value, c = C[key], T = tab(key), n = nS.value, arc = arcT.value;
          // the parametrization γ(u), u ∈ [0, 1]
          const gam = arc ? (u) => c.r(tOfS(T, u * T.L)) : (u) => c.r(c.t0 + u * (c.t1 - c.t0));
          const speed = (u) => { const h = 1e-3, a = gam(clamp(u + h, 0, 1)), b = gam(clamp(u - h, 0, 1)); return Math.hypot(a[0] - b[0], a[1] - b[1]) / (clamp(u + h, 0, 1) - clamp(u - h, 0, 1)) / T.L; };
          S.setTitle(arc ? 'beads at equal arc-length steps' : 'beads at equal parameter steps');
          S.curve(c.r, c.t0, c.t1, { n: 600, color: 'ink', width: 2.5, alpha: 0.5 });
          const pts = []; for (let i = 0; i <= n; i++) pts.push(gam(i / n));
          S.dots(pts, { r: 4.5, color: arc ? 'green' : 'orange' });
          const ch = []; for (let i = 1; i <= n; i++) ch.push(Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
          // speed plot, normalised so that unit speed reads 1
          let top = 1.2; const sp = []; for (let i = 0; i <= 200; i++) { const q = speed(i / 200); sp.push(q); top = Math.max(top, q * 1.1); }
          G.setView([0, 1], [0, arc ? 2 : top]);
          G.hline(1, { color: 'green', dash: true, width: 1.2 });
          G.curve((u) => [u, speed(u)], 0, 1, { n: 200, color: 'accent', width: 2.4 });
          const inner = ch.slice(0, n); const mx = Math.max(...inner), mn = Math.min(...inner);
          v.readout(() => `speed (in units of mean speed): min $${v.fix(Math.min(...sp), 3)}$, max $${v.fix(Math.max(...sp), 3)}$ ${arc ? '— constant $=1$' : ''}\nlongest / shortest gap between neighbouring beads: $${v.fix(mx / mn, 2)}$ ${arc ? '(only the chord-versus-arc effect remains)' : ''}\ntotal length $L=${v.fix(T.L, 4)}$`);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Signed curvature of a plane curve',
      statement: String.raw`Let $\beta(s)$ be a unit-speed plane curve with tangent $T = \beta'$ and normal $N = JT$, where $J$ is the rotation by $+90^\circ$. Since $|T| = 1$, $T' \perp T$, so $T' = \kappa N$ for a unique function $\kappa(s)$, the **signed curvature**; equivalently, if $T = (\cos\theta, \sin\theta)$ for a smooth angle function $\theta(s)$, then $\kappa = \theta'$. For an arbitrary regular parametrization,
$$\kappa = \frac{x'y'' - y'x''}{(x'^2 + y'^2)^{3/2}}.$$
$\kappa > 0$ where the curve turns left (counterclockwise), $\kappa < 0$ where it turns right, and reversing the orientation changes the sign. $\kappa$ is unchanged by rigid motions that preserve orientation.`,
      idea: String.raw`Differentiating $\langle T,T\rangle = 1$ gives $\langle T',T\rangle = 0$, so in the plane $T'$ is a multiple of $N$. Lifting the angle: $T = (\cos\theta,\sin\theta)$ gives $T' = \theta'(-\sin\theta,\cos\theta) = \theta' N$. The general formula comes from the chain rule applied to $\theta$ and $s$: $\kappa = \theta'(t)/s'(t)$ with $\theta = \operatorname{atan2}(y',x')$, available because reparametrization by arc length exists (dg-1.3).`,
      caption: String.raw`Drag the gold point along the curve. The blue arrow is the unit tangent $T$, the green arrow the normal $N$ (always a left turn from $T$). The dial shows the tangent direction $\theta$, and the right plot shows $\kappa(s)$: its zeros (red) are the **inflection points** where the curve crosses from bending left to bending right. The readout compares the formula with $d\theta/ds$ measured from the actual turning of the tangent. Switch the ellipse to clockwise and the sign of $\kappa$ flips.`,
      deps: ['dg-1.3'],
      refs: ['do Carmo §1-5', 'Pressley Ch. 2'],
      tags: ['curvature', 'tangent', 'inflection'],
      viz(v) {
        const C = {
          wave: { r: (t) => [t, 0.95 * Math.sin(1.35 * t)], t0: -3.3, t1: 3.3 },
          ccw: { r: (t) => [2 * Math.cos(t), 1.2 * Math.sin(t)], t0: 0, t1: TAU },
          cw: { r: (t) => [2 * Math.cos(t), -1.2 * Math.sin(t)], t0: 0, t1: TAU },
          cubic: { r: (t) => [t, 0.35 * t * t * t - 0.9 * t], t0: -2.6, t1: 2.6 },
        };
        const sel = v.select('curve', [{ value: 'wave', label: 'sine wave' }, { value: 'cubic', label: 'cubic' }, { value: 'ccw', label: 'ellipse ↺' }, { value: 'cw', label: 'ellipse ↻' }], 'wave');
        const S = v.stage({ x: [-3.6, 3.6], y: [-2.3, 2.3], equal: true, axes: false, height: 320, title: 'curve with tangent $T$ and normal $N$' });
        const K = v.stage({ x: [0, 10], y: [-2, 2], axes: 'box', gutter: true, height: 320, weight: 0.9, minWidth: 250, xlabel: 'arc length $s$', ylabel: '$\\kappa(s)$', title: 'signed curvature' });
        const D = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, axes: false, height: 320, weight: 0.5, minWidth: 190, title: 'tangent direction $\\theta$' });
        let tab = null, key = null, tc = 0, info = null;
        const build = () => {
          const c = C[sel.value]; key = sel.value;
          tab = arcTable(c.r, c.t0, c.t1, 1500);
          const ks = tab.t.map((t) => frame(c.r, t).kappa);
          info = { ks, inflect: zeros(tab.s, ks).map((s) => tOfS(tab, s)), kmax: Math.max(0.6, ...ks.map(Math.abs)) };
          tc = c.t0 + (c.t1 - c.t0) * 0.3;
        };
        build();
        const P = S.handle(0, 0, { color: 'gold', r: 8, constrain: (x, y) => { const c = C[sel.value]; tc = nearestT(tab, c.r, x, y); return c.r(tc); } });
        v.render(() => {
          if (key !== sel.value) { build(); }
          const c = C[sel.value], f = frame(c.r, tc);
          P.set(f.p[0], f.p[1]);
          S.curve(c.r, c.t0, c.t1, { n: 500, color: 'ink', width: 2.6 });
          for (const t of info.inflect) { const q = c.r(t); S.dot(q[0], q[1], { r: 5.5, color: 'red' }); }
          S.arrow(f.p[0], f.p[1], f.p[0] + 0.9 * f.T[0], f.p[1] + 0.9 * f.T[1], { color: 'blue', width: 2.5 });
          S.arrow(f.p[0], f.p[1], f.p[0] + 0.9 * f.N[0], f.p[1] + 0.9 * f.N[1], { color: 'green', width: 2.5 });
          S.tex('T', f.p[0] + 1.02 * f.T[0], f.p[1] + 1.02 * f.T[1], { color: 'blue' });
          S.tex('N', f.p[0] + 1.02 * f.N[0], f.p[1] + 1.02 * f.N[1], { color: 'green' });
          const sc = sOfT(tab, tc);
          K.setView([0, tab.L], [-info.kmax * 1.2, info.kmax * 1.2]);
          K.hline(0, { color: 'faint' });
          const pts = tab.s.map((s, i) => [s, info.ks[i]]);
          K.path(pts, { color: 'accent', width: 2.4 });
          for (const t of info.inflect) K.dot(sOfT(tab, t), 0, { r: 5, color: 'red' });
          K.vline(sc, { color: 'gold', width: 1.4 });
          K.dot(sc, f.kappa, { r: 6, color: 'gold' });
          // direction dial
          D.circle(0, 0, 1, { color: 'faint' });
          const th = Math.atan2(f.T[1], f.T[0]);
          D.arrow(0, 0, f.T[0], f.T[1], { color: 'blue', width: 2.5 });
          D.arrow(0, 0, f.N[0], f.N[1], { color: 'green', width: 1.5 });
          D.line(0, 0, 1, 0, { color: 'muted', dash: true });
          D.path(arcPts(0, 0, 0.4, 0, th < 0 ? th + TAU : th, 40), { color: 'gold', width: 2 });
          D.tex(`\\theta=${v.fix((th < 0 ? th + TAU : th) * 180 / PI, 0)}^\\circ`, 0, -1.25, { color: 'gold' });
          // independent check: turning of the tangent over a short arc
          const ds = 1e-3 * tab.L, ta = tOfS(tab, clamp(sc - ds, 0, tab.L)), tb = tOfS(tab, clamp(sc + ds, 0, tab.L));
          const Ta = frame(c.r, ta).T, Tb = frame(c.r, tb).T;
          const dth = Math.atan2(Ta[0] * Tb[1] - Ta[1] * Tb[0], Ta[0] * Tb[0] + Ta[1] * Tb[1]);
          const chord = (a, b) => Math.hypot(...[0, 1].map((i) => c.r(b)[i] - c.r(a)[i]));
          const meas = dth / chord(ta, tb);
          v.readout(() => `$\\kappa = (x'y''-y'x'')/|\\alpha'|^3 = ${v.fix(f.kappa, 4)}$ · measured turning rate $\\Delta\\theta/\\Delta s = ${v.fix(meas, 4)}$ · the curve is turning **${Math.abs(f.kappa) < 0.01 ? 'neither way (inflection)' : f.kappa > 0 ? 'left' : 'right'}**\n${info.inflect.length} inflection point${info.inflect.length === 1 ? '' : 's'} marked in red (zeros of $\\kappa$)`);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Osculating circle and centre of curvature',
      statement: String.raw`Let $\beta$ be a unit-speed plane curve with $\kappa(s_0) \neq 0$. The **osculating circle** at $\beta(s_0)$ is the circle with centre $c(s_0) = \beta(s_0) + \frac{1}{\kappa(s_0)}N(s_0)$ and radius $\rho = 1/|\kappa(s_0)|$, the **radius of curvature**; $c$ is the **centre of curvature**. It is the circle that agrees with the curve to second order: it has the same point, tangent and curvature. It is also the limit of the circle through $\beta(s_0 - h)$, $\beta(s_0)$ and $\beta(s_0+h)$ as $h \to 0$. Where $\kappa = 0$ the circle degenerates to the tangent line.`,
      idea: String.raw`Write $\beta(s_0+h) - \beta(s_0) = hT + \tfrac{h^2}{2}\kappa N + O(h^3)$ by Taylor's theorem (pma-5.15 with the definition of $\kappa$). The same expansion holds for the circle of radius $1/\kappa$ tangent to $T$ on the side of $N$, so the curve and that circle differ by $O(h^3)$. A circle through three nearby points of the curve is determined by their osculation order, so as $h \to 0$ its radius tends to $1/|\kappa|$.`,
      caption: String.raw`Drag the gold point around the ellipse. The **orange** circle passes through three points of the ellipse at parameter distance $h$ either side; shrink $h$ and it merges into the **green** osculating circle, centred on the normal at the distance $1/\kappa$. The readout shows the radii converging like $h^2$. The circle is smallest at the ends of the major axis, where the ellipse bends the most, and largest at the ends of the minor axis. Tick the box to see the osculating circles at 24 points.`,
      deps: ['dg-1.4', 'pma-5.15'],
      refs: ['Pressley Ch. 2'],
      tags: ['osculating circle', 'curvature', 'ellipse'],
      credit: 'Leibniz, 1686 (circulus osculans)',
      viz(v) {
        const A = 2;
        const bS = v.slider('minor semi-axis $b$', 0.4, 1.9, 1, { step: 0.01 });
        const hS = v.slider('spacing $h$', 0.002, 1.5, 0.7, { log: true });
        const fam = v.toggle('osculating circles at 24 points', false);
        const S = v.stage({ x: [-5.2, 5.2], y: [-5.6, 2.6], equal: true, axes: false, height: 380, title: 'ellipse, three-point circle (orange), osculating circle (green)' });
        const Rg = v.stage({ x: [0, TAU], y: [0, 6], axes: 'box', gutter: true, height: 350, weight: 0.75, minWidth: 240, xlabel: 'parameter $t$', ylabel: '$\\rho$', xticks: [[0, '0'], [PI / 2, 'π/2'], [PI, 'π'], [1.5 * PI, '3π/2'], [TAU, '2π']], title: 'radius of curvature' });
        let tc = 0.9;
        const P = S.handle(0, 0, { color: 'gold', r: 8, constrain: (x, y) => { tc = Math.atan2(y / bS.value, x / A); return ell.p(A, bS.value, tc); } });
        v.render(() => {
          const b = bS.value, h = hS.value, r = (t) => ell.p(A, b, t);
          P.set(...r(tc));
          S.curve(r, 0, TAU, { n: 400, color: 'ink', width: 2.6 });
          if (fam.value) for (let i = 0; i < 24; i++) { const t = (TAU * i) / 24, k = ell.kappa(A, b, t), N = ell.N(A, b, t), p = r(t); S.circle(p[0] + N[0] / k, p[1] + N[1] / k, 1 / k, { color: 'green', alpha: 0.28, width: 1 }); }
          const k = ell.kappa(A, b, tc), N = ell.N(A, b, tc), p = r(tc), rho = 1 / k, c = [p[0] + N[0] * rho, p[1] + N[1] * rho];
          S.circle(c[0], c[1], rho, { color: 'green', width: 2.4, fill: 'green', fillAlpha: 0.07 });
          S.segment(p, c, { color: 'green', dash: true });
          S.dot(c[0], c[1], { r: 4.5, color: 'green' });
          S.tex('c', c[0] + 0.15, c[1] + 0.2, { color: 'green' });
          const q1 = r(tc - h), q2 = r(tc + h), ci = circum(q1, p, q2);
          if (ci) S.circle(ci.c[0], ci.c[1], ci.R, { color: 'orange', width: 2, dash: true });
          for (const q of [q1, q2]) S.dot(q[0], q[1], { r: 4.5, color: 'orange' });
          // radius of curvature graph
          let top = 0; for (let i = 0; i <= 100; i++) top = Math.max(top, 1 / ell.kappa(A, b, (TAU * i) / 100));
          Rg.setView([0, TAU], [0, top * 1.15]);
          Rg.fn((t) => 1 / ell.kappa(A, b, t), { domain: [0, TAU], color: 'accent', width: 2.4 });
          Rg.vline(((tc % TAU) + TAU) % TAU, { color: 'gold', width: 1.3 }); Rg.dot(((tc % TAU) + TAU) % TAU, rho, { r: 6, color: 'gold' });
          Rg.hline(b * b / A, { color: 'faint', dash: true }); Rg.hline(A * A / b, { color: 'faint', dash: true });
          const ex = ci ? ci.R / rho - 1 : NaN;
          v.readout(() => `$1/\\kappa = ${v.fix(rho, 4)}$ (centre $c=(${v.fix(c[0], 3)},${v.fix(c[1], 3)})$) · three-point radius $${ci ? v.fix(ci.R, 4) : '\\infty'}$ · relative gap $${v.sci(Math.abs(ex), 2)}$ for $h=${v.fix(h, 3)}$ (it shrinks like $h^2$)\nextreme radii: $b^2/a = ${v.fix(b * b / A, 3)}$ and $a^2/b = ${v.fix(A * A / b, 3)}$`);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Evolutes and involutes',
      statement: String.raw`The **evolute** of a regular plane curve $\beta$ with $\kappa \neq 0$ is the locus of its centres of curvature, $e(s) = \beta(s) + \frac{1}{\kappa(s)}N(s)$. Where $\kappa' \neq 0$, $e$ is regular and its tangent line at $e(s)$ is the normal line of $\beta$ at $\beta(s)$; at the **vertices** ($\kappa' = 0$) the evolute has cusps. An **involute** of a curve $e$ is a curve whose normal lines are the tangent lines of $e$: the path of the end of a taut string unwound from $e$. The curve $\beta$ is an involute of its evolute: on each arc where $\kappa'$ has constant sign, $\beta(s)$ lies at the distance $|\rho(s)| = |\rho(s_1)| + \text{(arc length of } e \text{ from } s_1\text{ to } s)$ from $e(s)$ along the tangent.`,
      idea: String.raw`Differentiating $e = \beta + \rho N$ with $N' = -\kappa T$ gives $e' = \rho' N$, a multiple of the normal: so $e$ moves exactly along the normal lines of $\beta$, which therefore envelope $e$. Moreover $|e'| = |\rho'|$, so the length of an arc of the evolute equals the change of $\rho$, which is exactly how the free length of a taut string unwinding from $e$ changes. Hence the string end traces $\beta$; the zeros of $\rho'$ (vertices) are where the evolute turns back.`,
      caption: String.raw`Drag the gold point. The gold segment is the normal at the point, which touches the evolute (orange) at the centre of curvature: it is the taut string. The thick orange arc is the part of the evolute already "wrapped", measured from the cusp where the string is shortest. Its length is added to the string, and the string end then reproduces the ellipse; the readout shows how closely, computed from the evolute alone with no use of the ellipse's formula. The four cusps of the evolute sit under the four vertices of the ellipse.`,
      deps: ['dg-1.5'],
      refs: ['Pressley Ch. 2'],
      tags: ['evolute', 'involute', 'envelope'],
      credit: 'Huygens, Horologium oscillatorium, 1673',
      viz(v) {
        const A = 2;
        const bS = v.slider('minor semi-axis $b$', 0.35, 1.8, 1.1, { step: 0.01 });
        const allT = v.toggle('involute of the whole evolute (green)', true);
        const S = v.stage({ x: [-3.6, 3.6], y: [-2.5, 2.5], equal: true, axes: false, height: 360, title: 'ellipse, its evolute and the taut string' });
        const Rg = v.stage({ x: [0, TAU], y: [0, 8], axes: 'box', gutter: true, height: 360, weight: 0.75, minWidth: 240, xlabel: 'parameter $t$', ylabel: '$\\rho,\\ c+\\sigma$', xticks: [[0, '0'], [PI / 2, 'π/2'], [PI, 'π'], [1.5 * PI, '3π/2'], [TAU, '2π']], title: 'string length $\\rho$ and wrapped length $\\sigma$' });
        let tc = 0.8;
        const P = S.handle(0, 0, { color: 'gold', r: 8, constrain: (x, y) => { tc = ((Math.atan2(y / bS.value, x / A) % TAU) + TAU) % TAU; return ell.p(A, bS.value, tc); } });
        // the involute of the evolute, built from the evolute alone: arcs between its cusps
        const E = (b, t) => ell.centre(A, b, t);
        const involute = (b, t0) => {
          let t = t0;
          const q = Math.min(3, Math.floor(t / (PI / 2)));
          const tb = q === 0 ? 0 : q === 3 ? TAU : PI;     // the vertex where the string is shortest
          if (Math.abs(t - tb) < 1e-5) t = tb + (q === 0 || q === 2 ? 1 : -1) * 1e-5;
          const e0 = E(b, tb), p0 = ell.p(A, b, tb);
          const c = Math.hypot(p0[0] - e0[0], p0[1] - e0[1]);  // initial free length
          const m = 240; let sig = 0, prev = e0;
          for (let i = 1; i <= m; i++) { const e = E(b, tb + ((t - tb) * i) / m); sig += Math.hypot(e[0] - prev[0], e[1] - prev[1]); prev = e; }
          const et = E(b, t), gap = t - tb, d = (gap === 0 ? 1e-6 : Math.sign(gap) * Math.min(1e-4, Math.abs(gap) / 2)), eb = E(b, t - d);
          void gap;
          let U = gap === 0 ? [eb[0] - et[0], eb[1] - et[1]] : [et[0] - eb[0], et[1] - eb[1]]; const m2 = Math.hypot(...U) || 1; U = [U[0] / m2, U[1] / m2];
                    return { pt: [et[0] - (c + sig) * U[0], et[1] - (c + sig) * U[1]], sig, c, tb, et };
        };
        v.render(() => {
          const b = bS.value, r = (t) => ell.p(A, b, t);
          P.set(...r(tc));
          S.curve(r, 0, TAU, { n: 400, color: 'ink', width: 2.6 });
          S.curve((t) => E(b, t), 0, TAU, { n: 600, color: 'orange', width: 2 });
          for (let i = 0; i < 4; i++) { const e = E(b, (i * PI) / 2); S.dot(e[0], e[1], { r: 4.5, color: 'red' }); }
          let maxErr = 0;
          if (allT.value) {
            const pts = []; for (let i = 0; i <= 160; i++) { const t = (TAU * i) / 160 * 0.99999; const I = involute(b, t); pts.push(I.pt); const p = r(t); maxErr = Math.max(maxErr, Math.hypot(I.pt[0] - p[0], I.pt[1] - p[1])); }
            S.path(pts, { color: 'green', width: 4, alpha: 0.35 });
          }
          const I = involute(b, tc), e = I.et;
          // wrapped part of the evolute
          S.curve((u) => E(b, u), I.tb, tc, { n: 120, color: 'orange', width: 5 });
          S.segment(I.pt, e, { color: 'gold', width: 3 });
          S.dot(e[0], e[1], { r: 4.5, color: 'orange' });
          S.dot(I.pt[0], I.pt[1], { r: 3, color: 'green' });
          const rho = (t) => 1 / ell.kappa(A, b, t);
          Rg.setView([0, TAU], [0, Math.max(rho(PI / 2), rho(0)) * 1.15]);
          Rg.fn(rho, { domain: [0, TAU], color: 'accent', width: 2.4 });
          const sigCurve = (t) => involute(b, t).sig + involute(b, t).c;
          Rg.fn(sigCurve, { domain: [0.001, TAU - 0.001], color: 'green', width: 1.6, dash: true });
          Rg.vline(tc, { color: 'gold' }); Rg.dot(tc, rho(tc), { r: 6, color: 'gold' });
          const p = r(tc);
          v.readout(() => `string length (distance from $e$ to the point) $\\rho = ${v.fix(rho(tc), 4)}$ = shortest radius $c = ${v.fix(I.c, 3)}$ + wrapped evolute length $\\sigma = ${v.fix(I.sig, 4)}$ (sum $${v.fix(I.c + I.sig, 4)}$)\nunwound end vs. ellipse point: distance $${v.sci(Math.hypot(I.pt[0] - p[0], I.pt[1] - p[1]) + 1e-12, 2)}$${allT.value ? ` · largest gap over the whole ellipse $${v.sci(maxErr + 1e-12, 2)}$` : ''}`);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Definition',
      name: 'Parallel curves',
      statement: String.raw`The **parallel curve** at distance $d$ of a plane curve $\beta$ (unit speed) is $\beta_d(s) = \beta(s) + d\,N(s)$. Its velocity is $\beta_d' = (1 - d\kappa)\,T$, so it is regular exactly where $1 - d\kappa \neq 0$, i.e. where the offset distance differs from the radius of curvature $1/\kappa$. For a closed convex curve with $N$ pointing inwards and $0 \le d <\rho_{\min}$ the parallel curve is regular and simple, with length $L - 2\pi d$. At $d = 1/\kappa(s_0)$ the parallel curve has a singular point (a cusp, on the evolute) and for larger $d$ it develops a swallowtail and its length no longer follows that formula.`,
      idea: String.raw`Differentiating $\beta + dN$ and using $N' = -\kappa T$ gives $(1 - d\kappa)T$, so tangent lines of $\beta_d$ are those of $\beta$ and the segment joining corresponding points is a common normal of length $|d|$. Integrating $|1-d\kappa|$ over the curve gives length $L - d\int\kappa = L - 2\pi d$ as long as $1 - d\kappa > 0$ (total curvature $2\pi$, the turning-tangent theorem to come). When $d$ passes $1/\kappa(s_0)$ the sign of $1 - d\kappa$ changes, the tangent flips, and a cusp is born on the evolute.`,
      caption: String.raw`Slide the offset $d$ (positive pushes inward, negative outward). The right plot shows $1 - d\kappa(t)$ along the ellipse: while it stays positive the parallel curve (green) is a smooth, regular curve. When $d$ reaches the smallest radius of curvature $b^2/a$ it touches zero and cusps (red) appear, located on the evolute (orange, switch on to see). The measured length of the parallel curve follows $L - 2\pi d$ exactly until then; beyond it the identity fails.`,
      deps: ['dg-1.5'],
      refs: ['Pressley Ch. 2'],
      tags: ['parallel curve', 'offset', 'cusp'],
      viz(v) {
        const A = 2;
        const bS = v.slider('minor semi-axis $b$', 0.4, 1.8, 1, { step: 0.01 });
        const dS = v.slider('offset $d$', -2, 3.4, 0.35, { step: 0.01 });
        const evo = v.toggle('show the evolute', true);
        const S = v.stage({ x: [-4, 4], y: [-3.4, 3.4], equal: true, axes: false, height: 380, title: 'ellipse and its parallel curve $\\beta + dN$' });
        const G = v.stage({ x: [0, TAU], y: [-3, 2], axes: 'box', gutter: true, height: 380, weight: 0.75, minWidth: 240, xlabel: 'parameter $t$', ylabel: '$1-d\\kappa(t)$', xticks: [[0, '0'], [PI / 2, 'π/2'], [PI, 'π'], [1.5 * PI, '3π/2'], [TAU, '2π']], title: 'speed factor of the parallel curve' });
        v.render(() => {
          const b = bS.value, d = dS.value;
          const par = (t) => { const p = ell.p(A, b, t), N = ell.N(A, b, t); return [p[0] + d * N[0], p[1] + d * N[1]]; };
          const g = (t) => 1 - d * ell.kappa(A, b, t);
          S.curve((t) => ell.p(A, b, t), 0, TAU, { n: 400, color: 'ink', width: 2.4 });
          if (evo.value) S.curve((t) => ell.centre(A, b, t), 0, TAU, { n: 500, color: 'orange', width: 1.6 });
          S.curve(par, 0, TAU, { n: 800, color: 'green', width: 2.8 });
          const n = 2000, ts = [], gs = []; for (let i = 0; i <= n; i++) { const t = (TAU * i) / n; ts.push(t); gs.push(g(t)); }
          const cz = zeros(ts, gs); for (const t of cz) { const q = par(t); S.dot(q[0], q[1], { r: 5.5, color: 'red' }); }
          let L0 = 0, Ld = 0, pp = ell.p(A, b, 0), qq = par(0);
          for (let i = 1; i <= n; i++) { const t = ts[i], p = ell.p(A, b, t), q = par(t); L0 += Math.hypot(p[0] - pp[0], p[1] - pp[1]); Ld += Math.hypot(q[0] - qq[0], q[1] - qq[1]); pp = p; qq = q; }
          const gmin = Math.min(...gs), gmax = Math.max(...gs);
          G.setView([0, TAU], [Math.min(-0.5, gmin * 1.15), Math.max(1.5, gmax * 1.15)]);
          G.hline(0, { color: 'red', width: 1.2 });
          G.curve((t) => [t, g(t)], 0, TAU, { n: 300, color: 'accent', width: 2.4 });
          for (const t of cz) G.dot(t, 0, { r: 4.5, color: 'red' });
          const rmin = b * b / A;
          v.readout(() => `smallest radius of curvature $b^2/a = ${v.fix(rmin, 3)}$ · $\\min(1-d\\kappa) = ${v.fix(gmin, 3)}$ → ${cz.length ? `**${cz.length} cusps**: the parallel curve is no longer regular` : '**regular**'}\nlength of $\\beta_d$ (measured): $${v.fix(Ld, 4)}$ · $L - 2\\pi d = ${v.fix(L0 - TAU * d, 4)}$ ${cz.length === 0 ? '(agree)' : '(the identity fails once cusps appear)'}`);
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Theorem',
      name: 'Fundamental theorem of plane curves',
      statement: String.raw`Let $\kappa: [0,L] \to \R$ be continuous. Then there is a unit-speed plane curve $\beta: [0,L] \to \R^2$ whose signed curvature is $\kappa$, given by
$$\beta(s) = \beta(0) + \left(\int_0^s \cos\theta,\ \int_0^s \sin\theta\right), \qquad \theta(s) = \theta_0 + \int_0^s \kappa(u)\,du.$$
Any other unit-speed curve with the same curvature function is obtained from this one by a rotation and translation (an orientation-preserving rigid motion of the plane): $\beta(0)$ and $\theta_0$ are the only freedom.`,
      idea: String.raw`Integrating $\theta' = \kappa$ and then $\beta' = (\cos\theta,\sin\theta)$ (pma-6.21) constructs the curve and shows that the curvature is what was prescribed. For uniqueness, two unit-speed curves with the same $\kappa$ have tangent angles differing by a constant $\theta_0$; rotating one by $\theta_0$ makes the angles equal, hence the velocities equal, hence the curves equal after a translation.`,
      caption: String.raw`Drag the six gold handles in the right panel to draw the curvature $\kappa(s)$; the curve on the left is rebuilt live by integrating twice. Slide the constant $c$ added to $\kappa$: with $\kappa \equiv 0$ the curve is a straight line, and adding a constant bends it into a circle; a rising $\kappa$ gives a spiral that tightens. Drag the start point and the initial angle: the shape never changes, only its position, because $\kappa$ already says everything. The readout recovers $\kappa$ from the turning of the rebuilt polygon.`,
      deps: ['dg-1.4', 'pma-6.21'],
      refs: ['Pressley Ch. 2'],
      tags: ['curvature', 'rigid motion', 'integration'],
      credit: 'Euler (intrinsic equation of a plane curve); modern form: Bonnet',
      verify: true,
      viz(v) {
        const L = 10, xs = [0, 2, 4, 6, 8, 10];
        const presets = {
          wave: [0.5, 0.9, -0.4, -0.9, 0.3, 0.9],
          ramp: [0, 0.25, 0.5, 0.75, 1.0, 1.25],
          zero: [0, 0, 0, 0, 0, 0],
        };
        const sel = v.select('start from', [{ value: 'wave', label: 'wavy $\\kappa$' }, { value: 'ramp', label: 'linear ramp (spiral)' }, { value: 'zero', label: '$\\kappa=0$' }], 'ramp', {
          onChange: (k) => hs.forEach((h, i) => h.set(xs[i], presets[k][i])),
        });
        const cS = v.slider('add a constant $c$ to $\\kappa$', -1.5, 1.5, 0, { step: 0.01 });
        const thS = v.slider('initial angle $\\theta_0$ (°)', -180, 180, 20, { step: 1 });
        const S = v.stage({ x: [-5, 5], y: [-5, 5], equal: true, axes: false, height: 380, title: 'the curve rebuilt from $\\kappa$' });
        const K = v.stage({ x: [0, L], y: [-1.8, 1.8], axes: 'box', gutter: true, height: 380, weight: 0.8, minWidth: 260, xlabel: 'arc length $s$', ylabel: '$\\kappa(s)$', title: 'drag the handles: curvature' });
        const hs = xs.map((x, i) => K.handle(x, presets.ramp[i], { color: 'gold', r: 7, constrain: (_x, y) => [x, clamp(y, -1.7, 1.7)] }));
        const P0 = S.handle(-2.5, -3, { color: 'accent', r: 8, label: 'β(0)' });
        const kap = (s) => catmull(xs, hs.map((h) => h.y), s) + cS.value;
        v.render(() => {
          const N = 1200, ds = L / N, th0 = (thS.value * PI) / 180;
          const th = [th0], pts = [[P0.x, P0.y]];
          for (let i = 1; i <= N; i++) {
            const s0 = (i - 1) * ds, s1 = i * ds;
            th.push(th[i - 1] + (ds / 2) * (kap(s0) + kap(s1)));
          }
          // position: Simpson on each step (midpoint angle by averaging)
          for (let i = 1; i <= N; i++) {
            const dth = th[i] - th[i - 1], tm = (th[i - 1] + th[i]) / 2;
            const chord = Math.abs(dth) < 1e-9 ? ds : (ds * Math.sin(dth / 2)) / (dth / 2);
            pts.push([pts[i - 1][0] + chord * Math.cos(tm), pts[i - 1][1] + chord * Math.sin(tm)]);
          }
          S.path(pts, { color: 'accent', width: 3 });
          S.arrow(P0.x, P0.y, P0.x + 0.9 * Math.cos(th0), P0.y + 0.9 * Math.sin(th0), { color: 'orange', width: 2.5 });
          const e = pts[N]; S.dot(e[0], e[1], { r: 5, color: 'green' });
          // κ graph
          K.hline(0, { color: 'faint' });
          K.fn(kap, { domain: [0, L], color: 'accent', width: 2.6 });
          if (cS.value !== 0) K.fn((s) => kap(s) - cS.value, { domain: [0, L], color: 'faint', width: 1.4, dash: true });
          // recover κ from the rebuilt polygon (turn of the chord direction divided by chord length)
          let err = 0;
          for (let i = 5; i < N - 5; i += 7) {
            const a = pts[i - 1], b = pts[i], c = pts[i + 1];
            const u1 = [b[0] - a[0], b[1] - a[1]], u2 = [c[0] - b[0], c[1] - b[1]];
            const turn = Math.atan2(u1[0] * u2[1] - u1[1] * u2[0], u1[0] * u2[0] + u1[1] * u2[1]);
            const kr = turn / ((Math.hypot(...u1) + Math.hypot(...u2)) / 2);
            err = Math.max(err, Math.abs(kr - kap(i * ds)));
          }
          const total = th[N] - th0;
          v.readout(() => `total turning $\\int_0^L\\kappa\\,ds = ${v.fix(total, 3)}$ rad $= ${v.fix(total / TAU, 3)}$ turns · end point at distance $${v.fix(Math.hypot(e[0] - P0.x, e[1] - P0.y), 3)}$ from the start\n$\\kappa$ recovered from the rebuilt curve differs from the input by at most $${v.sci(err, 2)}$ · mean $\\kappa$ = ${v.fix(total / L, 3)}`);
        });
      },
    },
  ],
};
