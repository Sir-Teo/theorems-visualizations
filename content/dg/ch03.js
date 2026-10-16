// Differential Geometry of Curves & Surfaces — Chapter 3: Global properties of curves (3.1–3.6; 3.7–3.12 in ch03-b.js)
import {
  TAU, clamp, plot, plane, hueAlong, fourier2, ringPts, sampleClosed, crossings, rayCount, windingAbout, periodicExtrema, SHAPES,
} from './ch03.shared.js';

const PI = Math.PI;

export default {
  collection: 'dg',
  chapter: 3,
  title: 'Global properties of curves',
  summary: String.raw`Global theorems relate the local quantity curvature to the shape of a closed curve as a whole. A simple closed curve turns exactly once, encloses at most the area of a circle of the same length, and has at least four vertices. Integral geometry recovers length by counting random line crossings, and in space, total curvature at least $2\pi$, or more than $4\pi$ for knots, ties geometry to topology.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Closed and simple closed curves',
      statement: String.raw`A **closed curve** is a regular parametrized curve $\alpha:[a,b]\to\R^2$ of class $C^\infty$ with $\alpha(a)=\alpha(b)$ and $\alpha^{(j)}(a)=\alpha^{(j)}(b)$ for all $j\ge 1$: it can be continued periodically with period $b-a$ and is then smooth everywhere, with no corner where it closes up. It is **simple** if it has no other self-intersections: $\alpha(t)=\alpha(t')$ with $t,t'\in[a,b)$ forces $t=t'$. By the Jordan curve theorem the complement of a simple closed curve in the plane has exactly two connected components, a bounded **interior** and an unbounded exterior, and the curve is the boundary of each. A point is in the interior exactly when a ray from it crosses the curve (transversally) an odd number of times.`,
      idea: String.raw`The definition is only about the periodic extension: closing up with matching derivatives is what lets one speak of the *total* behaviour of the tangent around the curve (dg-3.2) without a corner contributing a jump. Simplicity is a statement about a map from the circle, $S^1\to\R^2$, being injective; that such a curve separates the plane into two regions is the Jordan curve theorem (top-10.5), which is deep in general but elementary for the piecewise-linear curves a computer draws, where the odd–even ray count decides the interior. The theorems of this chapter all concern simple closed curves, and the pictures here show what goes wrong without simplicity.`,
      caption: String.raw`Choose a shape, or pick **freehand** and drag across the picture to draw your own loop (it is closed by a chord at the end). Red dots mark self-intersections and the count is read out. The even–odd shading is the Jordan interior when the curve is simple. Drag the gold point $q$: the ray to the right counts crossings (gold dots) and the readout compares parity with the winding number about $q$. The pentagram and the trefoil diagram show that a closed curve can have many crossings; a freehand loop has a corner where the chord closes it, so strictly it is closed but not $C^\infty$ there.`,
      deps: ['dg-1.1', 'top-10.5'],
      refs: ['do Carmo §1-7', 'Pressley Ch. 3'],
      tags: ['closed curves', 'Jordan curve'],
      credit: 'C. Jordan, 1887 (Veblen gave a proof usually regarded as the first fully rigorous one, 1905)',
      viz(v) {
        const poly = (f, m = 360) => Array.from({ length: m }, (_, i) => f((TAU * i) / m));
        const SH = {
          circle: () => poly(SHAPES.circle.f),
          ellipse: () => poly(SHAPES.ellipse.f),
          figure8: () => poly(SHAPES.figure8.f),
          limacon: () => poly(SHAPES.limacon.f),
          trefoil: () => poly((t) => { const r = 1.15 + 0.32 * Math.cos(3 * t); return [r * Math.cos(2 * t), r * Math.sin(2 * t)]; }),
          pentagram: () => Array.from({ length: 5 }, (_, j) => [1.55 * Math.cos(PI / 2 + (4 * PI * j) / 5), 1.55 * Math.sin(PI / 2 + (4 * PI * j) / 5) - 0.1]),
        };
        const sel = v.select('curve', [
          { value: 'circle', label: 'circle' }, { value: 'ellipse', label: 'ellipse' }, { value: 'limacon', label: 'limaçon' }, { value: 'figure8', label: 'eight (0)' },
          { value: 'trefoil', label: 'trefoil diagram' }, { value: 'pentagram', label: 'pentagram' }, { value: 'free', label: 'freehand' },
        ], 'limacon');
        const S = plane(v, { title: 'closed curve, crossings, interior', height: 410, weight: 1.35 });
        const q = S.handle(0.55, 0.15, { color: 'gold', r: 8, label: 'q', labelPos: 'ne' });
        let raw = [], free = [], drawing = false;
        S.onDrag((x, y, phase) => {
          if (sel.value !== 'free') return;
          if (phase === 'start') { raw = [[x, y]]; drawing = true; }
          else if (phase === 'move' && drawing) { const l = raw[raw.length - 1]; if (Math.hypot(x - l[0], y - l[1]) > 0.02) raw.push([x, y]); }
          else if (phase === 'end') {
            drawing = false;
            if (raw.length > 6) {
              // resample by arc length to 300 points (closing chord included)
              const pts = raw.concat([raw[0]]); const cum = [0];
              for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
              const out = []; let j = 0;
              for (let i = 0; i < 300; i++) {
                const d = (cum[cum.length - 1] * i) / 300;
                while (j < cum.length - 2 && cum[j + 1] < d) j++;
                const w = (d - cum[j]) / (cum[j + 1] - cum[j] || 1);
                out.push([pts[j][0] + w * (pts[j + 1][0] - pts[j][0]), pts[j][1] + w * (pts[j + 1][1] - pts[j][1])]);
              }
              free = out;
            }
            raw = [];
          }
          v.invalidate();
        });
        v.button('clear drawing', () => { free = []; raw = []; });
        let info = { n: 0, ray: 0, wind: 0, empty: true };
        v.render(() => {
          let P = sel.value === 'free' ? free : SH[sel.value]();
          if (sel.value === 'free' && drawing && raw.length > 1) { S.path(raw, { color: 'accent', width: 2.2 }); }
          if (!P || P.length < 3) { info = { empty: true, n: 0 }; S.corner(sel.value === 'free' ? 'drag in the picture to draw a loop' : '', 'tl'); return; }
          const X = crossings(P), qq = [q.x, q.y], ray = rayCount(P, qq), wind = windingAbout(P, qq);
          S.rings([P], { evenodd: true, fill: X.length ? 'orange' : 'green', fillAlpha: 0.2, stroke: false });
          S.path(P, { close: true, color: 'accent', width: 2.8 });
          // the ray and its crossings
          const hits = [];
          for (let i = 0; i < P.length; i++) {
            const a = P[i], b = P[(i + 1) % P.length];
            if ((a[1] > qq[1]) !== (b[1] > qq[1])) { const x = a[0] + ((qq[1] - a[1]) / (b[1] - a[1])) * (b[0] - a[0]); if (x > qq[0]) hits.push(x); }
          }
          S.segment(qq, [2.2, qq[1]], { color: 'gold', width: 1.6, dash: [6, 5] });
          for (const x of hits) S.dot(x, qq[1], { color: 'gold', r: 4.5 });
          for (const x of X) S.dot(x[0], x[1], { color: 'red', r: 5 });
          info = { n: X.length, ray, wind, empty: false };
        });
        v.legend([['red', 'self-intersection'], ['gold', 'ray crossing'], ['green', 'interior of a simple curve', { area: true }], ['orange', 'even–odd region of a non-simple curve', { area: true }]]);
        v.readout(() => {
          if (info.empty) return 'no curve yet: choose a shape, or draw one';
          const simple = info.n === 0;
          return String.raw`self-intersections: $${info.n}$ → ${simple ? '**simple** closed curve: the shaded region is its Jordan interior' : 'closed but **not simple**'}
ray from $q$ crosses the curve $${info.ray}$ times (${info.ray % 2 ? 'odd' : 'even'}) · winding number of the curve about $q$: $${info.wind}$ · ${simple ? (info.ray % 2 ? 'odd ⇒ $q$ is inside' : 'even ⇒ $q$ is outside') : 'for a curve with crossings, parity and winding number still agree mod 2'}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Rotation index',
      statement: String.raw`Let $\alpha:[0,L]\to\R^2$ be a closed curve parametrized by arc length, with unit tangent $T(s)=(\cos\theta(s),\sin\theta(s))$. The angle function $\theta$ can be chosen continuous (and then is unique up to adding a multiple of $2\pi$), and since $T(L)=T(0)$ the total change $\theta(L)-\theta(0)$ is a multiple of $2\pi$. The **rotation index** (or turning number) of $\alpha$ is the integer
$$ \operatorname{rot}(\alpha) = \frac{\theta(L)-\theta(0)}{2\pi} = \frac1{2\pi}\int_0^L \kappa_s(s)\,ds , $$
where $\kappa_s=\theta'$ is the signed curvature. It is the number of times the tangent vector winds around the origin, i.e. the degree of the map $T:S^1\to S^1$; reversing the orientation changes its sign.`,
      idea: String.raw`Because $T=(\cos\theta,\sin\theta)$ and $T'=\kappa_s N$ (dg-1.4), the derivative of any continuous angle function is the signed curvature, so the net turning is the integral of $\kappa_s$. Since $T$ returns to its starting value, that integral must be a whole number of full turns. This is the winding number of the closed curve $T$ about $0$ (top-9.5), so it is unchanged under any deformation that keeps the tangent non-zero, i.e. through regular curves; it can jump only when $\alpha'$ passes through $0$.`,
      caption: String.raw`The curve is $z(t)=e^{it}+b\,e^{ikt}$. Move the position slider (or press play) and watch the tangent direction on the dial: its angle is traced as a spiral that moves outwards one ring per turn, and the plot on the right is the accumulated turning $\theta/2\pi$. Change $k$ and $b$: for $|bk|<1$ the first term dominates and the index is $1$; for $|bk|>1$ the second dominates and the index is $k$. At $|bk|=1$ the velocity $z'$ vanishes (the curve has a cusp) and the index jumps. The two numbers in the readout, the winding of the tangent and $\frac1{2\pi}\int\kappa\,ds$, are always the same integer.`,
      deps: ['dg-1.4', 'top-9.5'],
      refs: ['do Carmo §1-7'],
      tags: ['rotation index', 'curvature'],
      viz(v) {
        const kS = v.slider('$k$', -3, 5, 3, { step: 1, int: true });
        const bS = v.slider('$b$', 0, 0.95, 0.6, { step: 0.005 });
        const uS = v.slider('position $t/2\\pi$', 0, 1, 0.3, { step: 0.001 });
        const S = plane(v, { x: [-2.5, 2.5], y: [-2.05, 2.05], title: 'the curve $z=e^{it}+b\\,e^{ikt}$ and its tangent', height: 400, weight: 1.3 });
        const D = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 400, weight: 0.95, minWidth: 250, title: 'the tangent direction on the dial' });
        const P = plot(v, { x: [0, 1], y: [-1.2, 1.2], xlabel: '$t/2\\pi$', ylabel: '$\\theta/2\\pi$', title: 'accumulated turning', height: 400, weight: 0.85 });
        const PER = 14;
        let smp = null, key = '', pos = 0.3;
        const ev = (k, b) => (t) => ({
          p: [Math.cos(t) + b * Math.cos(k * t), Math.sin(t) + b * Math.sin(k * t)],
          d1: [-Math.sin(t) - b * k * Math.sin(k * t), Math.cos(t) + b * k * Math.cos(k * t)],
          d2: [-Math.cos(t) - b * k * k * Math.cos(k * t), -Math.sin(t) - b * k * k * Math.sin(k * t)],
        });
        v.animate((t) => {
          if (v.playing) uS.set((t / PER) % 1);
          const k = kS.value, b = bS.value;
          const kk = `${k}|${b}`;
          if (kk !== key) { key = kk; smp = sampleClosed(ev(k, b), 720); }
          const m = smp.m, i = Math.round(uS.value * m) % m, th0 = smp.th[0];
          pos = uS.value;
          S.path(smp.P, { close: true, color: 'muted', width: 1.4 });
          // coloured part up to the current position
          S.path(smp.P.slice(0, i + 1), { color: 'accent', width: 3 });
          const p = smp.P[i], T = smp.T[i];
          S.arrow(p[0], p[1], p[0] + 0.7 * T[0], p[1] + 0.7 * T[1], { color: 'orange', width: 2.6 });
          S.dot(p[0], p[1], { color: 'gold', r: 6 });
          // dial
          D.circle(0, 0, 1, { color: 'faint', width: 1.2, fill: false });
          for (let a = 0; a < 4; a++) D.line(0, 0, Math.cos((a * PI) / 2), Math.sin((a * PI) / 2), { color: 'grid', width: 1 });
          const spiral = [];
          for (let j = 0; j <= i; j++) { const turn = (smp.th[j] - th0) / TAU; spiral.push([(1 + 0.16 * turn) * Math.cos(smp.th[j]), (1 + 0.16 * turn) * Math.sin(smp.th[j])]); }
          D.path(spiral, { color: 'orange', width: 2.6 });
          D.arrow(0, 0, Math.cos(smp.th[i]), Math.sin(smp.th[i]), { color: 'orange', width: 2.4 });
          D.dot(spiral[spiral.length - 1][0], spiral[spiral.length - 1][1], { color: 'gold', r: 6 });
          D.dot(Math.cos(th0), Math.sin(th0), { color: 'ink', r: 4, hollow: true, label: 'start', labelPos: 'e' });
          // turning plot
          const us = [], ths = [];
          for (let j = 0; j <= m; j += 4) { us.push(j / m); ths.push((smp.th[j] - th0) / TAU); }
          const lo = Math.min(-1.2, ...ths) - 0.15, hi = Math.max(1.2, ...ths) + 0.15;
          P.setView([0, 1], [lo, hi]);
          P.path(us.map((u, j) => [u, ths[j]]), { color: 'faint', width: 1.8 });
          P.path(us.filter((u) => u <= pos).map((u, j) => [u, ths[j]]), { color: 'orange', width: 2.8 });
          P.dot(pos, (smp.th[i] - th0) / TAU, { color: 'gold', r: 6 });
          P.hline(smp.rot, { color: 'green', alpha: 0.7, dash: true });
        }, { period: PER, still: 4.2 });
        v.readout(() => {
          if (!smp) return '';
          const k = kS.value, b = bS.value, pred = Math.abs(b * k) > 1 ? k : 1, near = Math.abs(Math.abs(b * k) - 1) < 0.03;
          return String.raw`turning of the tangent: $(\theta(L)-\theta(0))/2\pi = ${v.fix((smp.th[smp.m] - smp.th[0]) / TAU, 4)}$ · $\frac1{2\pi}\int\kappa\,ds = ${v.fix(smp.rot, 4)}$ → rotation index $\mathbf{${Math.round(smp.rot)}}$ (prediction from $|bk|=${v.fix(Math.abs(b * k), 3)}$: $${pred}$)
speed $|z'|$ is at least $${v.fix(smp.minSp, 3)}$ along the curve${near ? ' — nearly zero: the curve is almost singular and the index is about to jump' : ''}`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Theorem of turning tangents (Hopf’s Umlaufsatz)',
      statement: String.raw`The rotation index of a simple closed plane curve is $+1$ if the curve is traversed counter-clockwise (so that its interior lies on the left) and $-1$ if it is traversed clockwise. Equivalently, the tangent of a simple closed curve makes exactly one full turn, $\int_0^L\kappa_s\,ds=\pm2\pi$. Curves with self-intersections can have any integer rotation index, e.g. $0$ for a figure eight and $2$ for a limaçon with an inner loop; the hypothesis of simplicity is essential.`,
      idea: String.raw`Hopf's proof studies the direction of the secant $\bigl(\alpha(t)-\alpha(s)\bigr)/|\alpha(t)-\alpha(s)|$ over the triangle $0\le s\le t\le L$. Because $\alpha$ is simple, the secant never vanishes except on the diagonal $s=t$, where it is replaced by the tangent, so its angle is a continuous function on a contractible region and the total change of that angle around the boundary of the triangle is $0$. Put the lowest point of the curve at $s=0$, with horizontal tangent: along the edge $s=0$ the secant turns from the tangent direction through the upper half-plane to the opposite direction, an angle $\pi$, and along the edge $t=L$ it turns by another $\pi$. The remaining side is the diagonal, which carries the tangent, so $\theta(L)-\theta(0)=2\pi$. The winding-number language of dg-3.2 and top-9.5 explains why this integer cannot change under regular deformation.`,
      caption: String.raw`Drag the nine orange points: the smooth closed curve through them is redrawn, and the plot shows the accumulated tangent turning against arc length; for a simple curve it always ends at exactly $\pm1$ full turn. Pull the curve across itself and watch the crossing counter: the index stays whatever it was (a regular deformation cannot change it) until the curve is no longer simple, and then values other than $\pm1$ become possible. Use the presets, reverse the direction, or press **throw 300 random curves** for a tally: no simple curve in it has an index other than $\pm1$.`,
      deps: ['dg-3.2', 'dg-3.1'],
      refs: ['do Carmo §1-7', 'do Carmo Ch. 5'],
      tags: ['rotation index', 'turning tangents'],
      credit: 'H. Hopf, 1935 (Compositio Math. 2); the smooth case was known earlier',
      scope: String.raw`Closed curves of class $C^1$ (here $C^\infty$) with $\alpha'\neq0$; the curve must be simple. The statement about interiors on the left uses the Jordan curve theorem.`,
      viz(v) {
        const N = 9;
        const S = plane(v, { title: 'drag the orange points', height: 410, weight: 1.3 });
        const P = plot(v, { x: [0, 1], y: [-2.5, 2.5], xlabel: 'arc length $s/L$', ylabel: '$\\theta/2\\pi$', title: 'turning of the tangent', height: 410, weight: 0.8 });
        const presets = { egg: SHAPES.egg, bean: SHAPES.bean, limacon: SHAPES.limacon, figure8: SHAPES.figure8, rosette: SHAPES.rosette };
        const hs = ringPts(presets.egg.f, N).map((p) => S.handle(p[0], p[1], { color: 'orange', r: 7 }));
        const sel = v.select('preset', [{ value: 'egg', label: 'egg' }, { value: 'bean', label: 'bean' }, { value: 'rosette', label: 'rosette' }, { value: 'figure8', label: 'eight (0)' }, { value: 'limacon', label: 'limaçon with loop' }], 'egg', {
          onChange: (val) => { ringPts(presets[val].f, N).forEach((p, i) => hs[i].set(p[0], p[1])); },
        });
        const rev = v.toggle('reverse direction', false);
        const rng = v.rng(2024);
        const tally = { simple: {}, loops: {}, skipped: 0 };
        const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };
        v.button('throw 300 random curves', () => {
          for (let n = 0; n < 300; n++) {
            const pts = [], jit = 0.9 + 1.4 * rng.uniform(0, 1);
            for (let j = 0; j < N; j++) { const r = 0.4 + 1.4 * rng.uniform(0, 1), a = (TAU * j) / N + (rng.uniform(0, 1) - 0.5) * jit; pts.push([r * Math.cos(a), 0.9 * r * Math.sin(a)]); }
            if (rng.uniform(0, 1) < 0.5) pts.reverse();
            const sm = sampleClosed(fourier2(pts), 720);
            if (sm.minSp < 0.05) { tally.skipped++; continue; }
            const simple = crossings(sm.P).length === 0;
            bump(simple ? tally.simple : tally.loops, Math.round(sm.rot));
          }
        });
        v.button('reset tally', () => { tally.simple = {}; tally.loops = {}; tally.skipped = 0; });
        let info = { n: 0, rot: 0 };
        v.render(() => {
          const f0 = fourier2(hs.map((h) => [h.x, h.y]));
          const f = rev.value ? (t) => { const e = f0(-t); return { p: e.p, d1: [-e.d1[0], -e.d1[1]], d2: e.d2 }; } : f0;
          const sm = sampleClosed(f, 720), X = crossings(sm.P.filter((_, i) => i % 2 === 0));
          const cols = []; for (let i = 0; i < sm.m; i++) cols.push(hueAlong(v, i / sm.m));
          for (let i = 0; i < sm.m; i++) S.segment(sm.P[i], sm.P[(i + 1) % sm.m], { color: cols[i], width: 3.2 });
          for (const x of X) S.dot(x[0], x[1], { color: 'red', r: 5 });
          const a = sm.P[0], d = sm.T[0];
          S.arrow(a[0], a[1], a[0] + 0.5 * d[0], a[1] + 0.5 * d[1], { color: 'ink', width: 2.2 });
          const pts = []; for (let i = 0; i <= sm.m; i += 4) pts.push([sm.s[i] / sm.L, (sm.th[i] - sm.th[0]) / TAU]);
          P.setView([0, 1], [Math.min(-1.5, ...pts.map((p) => p[1])) - 0.2, Math.max(1.5, ...pts.map((p) => p[1])) + 0.2]);
          P.hline(1, { color: 'green', alpha: 0.5, dash: true }); P.hline(-1, { color: 'green', alpha: 0.5, dash: true });
          P.path(pts, { color: 'accent', width: 2.8 });
          info = { n: X.length, rot: sm.rot, sp: sm.minSp };
        });
        v.readout(() => {
          const fmt = (o) => Object.keys(o).sort((a, b) => a - b).map((k) => `index ${k}: ${o[k]}`).join(', ') || 'none yet';
          return String.raw`self-intersections: $${info.n}$ · rotation index $\frac1{2\pi}\int\kappa\,ds = ${v.fix(info.rot, 3)}$ ${info.n === 0 ? '→ **simple**: index $=\\pm1$ as the theorem says' : '→ not simple, so any integer is allowed'}
random tally — simple curves: ${fmt(tally.simple)}; curves with crossings: ${fmt(tally.loops)}${tally.skipped ? `; ${tally.skipped} skipped (nearly singular)` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Whitney–Graustein theorem',
      statement: String.raw`Two regular closed plane curves can be deformed into one another through regular closed curves (a *regular homotopy*: every curve of the deformation is $C^\infty$ with non-vanishing velocity, depending smoothly on the deformation parameter) if and only if they have the same rotation index. Thus the rotation index is a complete invariant: the regular homotopy classes of regular closed curves in the plane are in bijection with $\mathbb Z$. The curves need not be simple, and they may cross themselves during the deformation.`,
      idea: String.raw`Necessity is dg-3.2: the index is an integer that depends continuously on the curve as long as $\alpha'\ne0$, so it is constant along a regular homotopy. For sufficiency, describe a curve by its tangent angle: $\alpha'=e^{i\theta}-c$, where the constant $c=\frac1{2\pi}\int_0^{2\pi} e^{i\theta}$ is exactly what makes the curve close up. If two curves have the same index, $\theta_0$ and $\theta_1$ both gain $2\pi k$ and the straight-line path $\theta_u=(1-u)\theta_0+u\theta_1$ is periodic for every $u$; since $|c_u|<1$ unless $\theta_u$ is constant, the velocity $e^{i\theta_u}-c_u$ never vanishes. (This explicit path is one convenient way to see the theorem.) Curves of different index would have to pass through a curve with $\alpha'=0$ somewhere.`,
      caption: String.raw`Pick curve A and curve B (the number in brackets is the rotation index) and slide $u$ from 0 to 1. In the **tangent-angle** deformation the curve stays regular all the way when the two indices agree, and the plot of the smallest speed along the curve stays above zero. Switch to the **straight-line** deformation (average the two position functions) and, for curves of different index, the smallest speed must reach zero at some moment: the tool marks that curve in red, with the point where the tangent vanishes. If the indices differ no regular deformation exists, so the tangent-angle option is replaced by the straight-line one.`,
      deps: ['dg-3.2', 'top-8.1'],
      refs: ['do Carmo §1-7'],
      tags: ['rotation index', 'regular homotopy'],
      credit: 'H. Whitney, 1937 (Compositio Math. 4), who credits W. C. Graustein with suggesting the theorem and its proof',
      scope: String.raw`Closed plane curves that are regular ($C^\infty$ with $\alpha'\ne0$). For curves in a surface or in $\R^3$ the classification is different.`,
      viz(v) {
        const NT = 360, sc = 1.25, dtau = TAU / NT;
        const PRE = {
          circle: { label: 'circle (1)', th: (t) => t },
          wavy: { label: 'wavy circle (1)', th: (t) => t + 1.4 * Math.sin(3 * t) },
          eight: { label: 'eight (0)', th: (t) => 2.2 * Math.sin(t) },
          bean: { label: 'peanut (0)', th: (t) => 1.6 * Math.sin(t) },
          loop: { label: 'one loop (2)', th: (t) => 2 * t + 0.9 * Math.sin(t) },
          loop3: { label: 'two loops (3)', th: (t) => 3 * t + 0.6 * Math.sin(2 * t) },
          rev: { label: 'reversed (−1)', th: (t) => -t + 0.5 * Math.sin(2 * t) },
        };
        const opts = Object.keys(PRE).map((k) => ({ value: k, label: PRE[k].label }));
        const edgeAngles = (E) => {
          let tot = 0;
          for (let j = 0; j < NT; j++) {
            const a = E[j], b = E[(j + 1) % NT];
            tot += Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
          }
          return tot / TAU;
        };
        // each preset: edge vectors e^{iθ} − c (before scaling) and its rotation index
        const cache = {};
        const prep = (k) => cache[k] || (cache[k] = (() => {
          const th = Array.from({ length: NT }, (_, j) => PRE[k].th(j * dtau));
          const c = [th.reduce((s, t) => s + Math.cos(t), 0) / NT, th.reduce((s, t) => s + Math.sin(t), 0) / NT];
          const E = th.map((t) => [Math.cos(t) - c[0], Math.sin(t) - c[1]]);
          return { th, E, rot: Math.round(edgeAngles(E)) };
        })());
        const selA = v.select('curve A', opts, 'eight');
        const selB = v.select('curve B', opts, 'bean');
        const mode = v.select('deformation', [{ value: 'angle', label: 'tangent-angle path' }, { value: 'line', label: 'straight-line path' }], 'angle');
        const uS = v.slider('$u$ (from A to B)', 0, 1, 0.5, { step: 0.001 });
        const S = plane(v, { title: 'deforming A into B (A grey, B dashed)', height: 400, weight: 1.25 });
        const Pl = plot(v, { x: [0, 1], y: [0, 1.6], xlabel: '$u$', ylabel: 'smallest speed', title: 'smallest speed $\\min|\\alpha_u^{\\prime}|$ along the path', height: 400, weight: 0.85 });
        const edges = (a, b, u, md) => {
          if (md === 'line') return a.E.map((e, j) => [(1 - u) * e[0] + u * b.E[j][0], (1 - u) * e[1] + u * b.E[j][1]]);
          const th = a.th.map((t, j) => (1 - u) * t + u * b.th[j]);
          const c = [th.reduce((s, t) => s + Math.cos(t), 0) / NT, th.reduce((s, t) => s + Math.sin(t), 0) / NT];
          return th.map((t) => [Math.cos(t) - c[0], Math.sin(t) - c[1]]);
        };
        const pos = (E) => {
          const P = [[0, 0]];
          for (let j = 0; j < NT - 1; j++) P.push([P[j][0] + sc * E[j][0] * dtau, P[j][1] + sc * E[j][1] * dtau]);
          const cx = P.reduce((s, p) => s + p[0], 0) / NT, cy = P.reduce((s, p) => s + p[1], 0) / NT;
          return P.map((p) => [p[0] - cx, p[1] - cy]);
        };
        const minSp = (E) => { let m = Infinity, j0 = 0; E.forEach((e, j) => { const q = Math.hypot(e[0], e[1]); if (q < m) { m = q; j0 = j; } }); return [m, j0]; };
        let curve = null, key = '', info = {};
        v.render(() => {
          const a = prep(selA.value), b = prep(selB.value), same = a.rot === b.rot;
          const md = same ? mode.value : 'line';
          if (!same && mode.value !== 'line') mode.set('line');
          const k = `${selA.value}|${selB.value}|${md}`;
          if (k !== key) {
            key = k; curve = [];
            for (let i = 0; i <= 100; i++) curve.push([i / 100, minSp(edges(a, b, i / 100, md))[0]]);
            Pl.setView([0, 1], [0, Math.max(1.6, ...curve.map((p) => p[1])) * 1.05]);
          }
          const u = uS.value, E = edges(a, b, u, md), P = pos(E);
          S.path(pos(a.E), { close: true, color: 'faint', width: 2 });
          S.path(pos(b.E), { close: true, color: 'faint', width: 2, dash: [5, 5] });
          const [ms, j0] = minSp(E), bad = ms < 0.06, rot = edgeAngles(E);
          S.path(P, { close: true, color: bad ? 'red' : 'accent', width: 3.2 });
          if (bad) S.dot(P[j0][0], P[j0][1], { color: 'red', r: 7, hollow: true });
          S.dot(P[0][0], P[0][1], { color: 'gold', r: 5 });
          Pl.path(curve, { color: md === 'angle' ? 'green' : 'orange', width: 2.8 });
          Pl.hline(0.06, { color: 'red', alpha: 0.5, dash: true });
          Pl.dot(u, ms, { color: 'gold', r: 6 });
          info = { ms, bad, rot, ra: a.rot, rb: b.rot, md, same };
        });
        v.readout(() => String.raw`index of A: $${info.ra}$, index of B: $${info.rb}$ · path: **${info.md === 'angle' ? 'tangent-angle deformation' : 'straight-line deformation'}**${info.same ? '' : ' (indices differ: no regular deformation exists)'}
at this $u$: smallest speed $${v.fix(info.ms, 3)}$ · rotation index of the curve shown: $${v.fix(Math.abs(info.rot) < 5e-3 ? 0 : info.rot, 2)}$${info.bad ? ' — **the velocity vanishes here: a cusp, so the curve is no longer regular**' : ''}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Isoperimetric inequality',
      statement: String.raw`If a simple closed plane curve has length $L$ and encloses area $A$, then
$$L^2 \;\ge\; 4\pi A .$$
Equality holds exactly when the curve is a circle. Equivalently, among all closed curves of a given length the circle encloses the greatest area, and among all those enclosing a given area it has the least length. The same proof, with $A$ the signed area $\frac12\oint(x\,dy-y\,dx)$, gives $L^2\ge 4\pi |A|$ for every closed curve, simple or not.`,
      idea: String.raw`Parametrize by $\theta\in[0,2\pi]$ proportionally to arc length and expand $z=x+iy=\sum c_k e^{ik\theta}$ in a Fourier series. Constant speed $L/2\pi$ and Parseval give $\sum k^2|c_k|^2=(L/2\pi)^2$, while Green's formula (the signed area, as in dg-3.1's interior) gives $A=\pi\sum k|c_k|^2$. Subtracting,
$$L^2-4\pi A \;=\; 4\pi^2\sum_{k\in\mathbb Z}(k^2-k)\,|c_k|^2 \;\ge 0,$$
since $k^2-k\ge 0$ for every integer and vanishes only for $k=0,1$, i.e. for $z=c_0+c_1e^{i\theta}$, a circle. The length is the integral of the speed (dg-1.2), which is the only place geometry of the curve enters. This is Hurwitz's Fourier-series proof of 1902; Steiner's 1838 symmetrization argument was historically the first attack.`,
      caption: String.raw`Drag the nine orange points to reshape a closed curve (blue); the dashed grey circle has the same length, and its area is $L^2/4\pi$. The readout shows $L$, $A$ and the deficit $L^2-4\pi A\ge0$. The bar chart on the right is the proof: each bar is one term $4\pi^2(k^2-k)|c_k|^2$ of the Fourier expansion of the curve (parametrized by arc length), all non-negative, summing to the deficit; the terms $k=0,1$ (green, height zero) cost nothing because they describe a circle. Press **round off** to move the points half-way towards a regular circle: the bars shrink to zero.`,
      deps: ['dg-3.1', 'dg-1.2'],
      refs: ['do Carmo §1-7', 'Pressley Ch. 3'],
      tags: ['isoperimetric', 'Fourier series'],
      credit: 'Steiner, 1838 (symmetrization); Hurwitz, 1902 (Fourier-series proof)',
      scope: String.raw`Rectifiable closed plane curves; $A$ is the enclosed area for a simple curve, the winding-number-weighted area otherwise.`,
      viz(v) {
        const N = 9, M = 256, KR = [-6, 10];
        const S = plane(v, { title: 'the curve and the circle of equal length', height: 400, weight: 1.15 });
        const B = v.stage({ x: [KR[0] - 0.6, KR[1] + 0.6], y: [0, 1], axes: 'box', gutter: true, height: 400, weight: 0.95, minWidth: 260, xlabel: 'Fourier index $k$', ylabel: '$4\\pi^2(k^2-k)|c_k|^2$', title: 'where the deficit comes from' });
        const presets = { bean: SHAPES.bean, egg: SHAPES.egg, ellipse: SHAPES.ellipse, rosette: SHAPES.rosette, limacon: SHAPES.limacon };
        const hs = ringPts(presets.bean.f, N).map((p) => S.handle(p[0], p[1], { color: 'orange', r: 7 }));
        v.select('shape', [{ value: 'bean', label: 'bean' }, { value: 'egg', label: 'egg' }, { value: 'ellipse', label: 'ellipse' }, { value: 'rosette', label: 'rosette' }, { value: 'limacon', label: 'loop' }], 'bean', {
          onChange: (val) => ringPts(presets[val].f, N).forEach((p, i) => hs[i].set(p[0], p[1])),
        });
        v.button('round off', () => {
          const c = [hs.reduce((s, h) => s + h.x, 0) / N, hs.reduce((s, h) => s + h.y, 0) / N];
          const R = hs.reduce((s, h) => s + Math.hypot(h.x - c[0], h.y - c[1]), 0) / N, a0 = Math.atan2(hs[0].y - c[1], hs[0].x - c[0]);
          hs.forEach((h, j) => h.set(0.5 * h.x + 0.5 * (c[0] + R * Math.cos(a0 + (TAU * j) / N)), 0.5 * h.y + 0.5 * (c[1] + R * Math.sin(a0 + (TAU * j) / N))));
        });
        let info = {};
        v.render(() => {
          const f = fourier2(hs.map((h) => [h.x, h.y])), sm = sampleClosed(f, 1440);
          const sgn = sm.A >= 0 ? 1 : -1, A = Math.abs(sm.A), L = sm.L;
          // resample at M equal arc-length steps
          const z = []; let j = 0;
          for (let i = 0; i < M; i++) {
            const d = (L * i) / M;
            while (j < sm.m - 1 && sm.s[j + 1] < d) j++;
            const w = (d - sm.s[j]) / (sm.s[j + 1] - sm.s[j] || 1), p = sm.P[j], q = sm.P[(j + 1) % sm.m];
            z.push([p[0] + w * (q[0] - p[0]), p[1] + w * (q[1] - p[1])]);
          }
          const vals = [], ks = [];
          let sum = 0;
          for (let k = KR[0]; k <= KR[1]; k++) {
            let re = 0, im = 0;
            for (let i = 0; i < M; i++) { const a = (-k * TAU * i) / M, c = Math.cos(a), s = Math.sin(a); re += z[i][0] * c - z[i][1] * s; im += z[i][0] * s + z[i][1] * c; }
            re /= M; im /= M;
            const val = 4 * PI * PI * (k * k - sgn * k) * (re * re + im * im);
            vals.push(val); ks.push(k); sum += val;
          }
          const cen = [z.reduce((s, p) => s + p[0], 0) / M, z.reduce((s, p) => s + p[1], 0) / M], Rc = L / TAU;
          S.circle(cen[0], cen[1], Rc, { color: 'muted', dash: [6, 5], width: 1.8 });
          const X = crossings(sm.P.filter((_, i) => i % 3 === 0));
          S.path(sm.P, { close: true, color: 'accent', width: 3.2, fill: 'accent', fillAlpha: 0.1 });
          for (const x of X) S.dot(x[0], x[1], { color: 'red', r: 5 });
          const ymax = Math.max(0.05, ...vals) * 1.15;
          B.setView([KR[0] - 0.6, KR[1] + 0.6], [0, ymax]);
          B.bars(vals, { x0: KR[0], dx: 1, color: (val, i) => (ks[i] === 0 || ks[i] === 1 ? 'green' : 'orange') });
          B.setTicks(Array.from({ length: KR[1] - KR[0] + 1 }, (_, i) => KR[0] + i).filter((k) => k % 2 === 0), null);
          info = { L, A, deficit: L * L - 4 * PI * A, sum, ratio: (4 * PI * A) / (L * L), X: X.length };
        });
        v.readout(() => String.raw`$L=${v.fix(info.L, 3)}$ · $A=${v.fix(info.A, 3)}$ · $L^2-4\pi A = ${v.fix(info.deficit, 4)}\ \ge 0$ · $4\pi A/L^2=${v.fix(info.ratio, 4)}$ (equals 1 only for a circle)
sum of the bars: $${v.fix(info.sum, 4)}$ — it equals the deficit (the difference is the sampling error)${info.X ? ` · the curve crosses itself ${info.X} time(s): $A$ is then the winding-number-weighted area` : ''}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Definition',
      name: 'Convex curves and vertices',
      statement: String.raw`A simple closed plane curve is **convex** if it lies entirely on one side of each of its tangent lines. For a regular simple closed curve oriented counter-clockwise this holds exactly when the signed curvature never changes sign: $\kappa_s\ge0$ everywhere. A **vertex** is a point where the curvature has a critical point, $\kappa_s'(s)=0$; in particular every local maximum and local minimum of $\kappa_s$ is a vertex. The circle is the degenerate case in which every point is a vertex.`,
      idea: String.raw`If $\kappa_s\ge0$ the tangent angle $\theta(s)$ is non-decreasing, and by the turning-tangents theorem (dg-3.3) it increases by exactly $2\pi$ over the curve. So the curve always bends the same way and every direction occurs as a tangent direction once: it cannot cross one of its own tangent lines. Conversely, a point where $\kappa_s$ changes sign is an inflection, where the tangent line passes from one side of the curve to the other, so a curve on one side of all its tangent lines has $\kappa_s\ge0$. Vertices are the critical points of the periodic function $\kappa_s$, which exist in any case: a continuous periodic function attains a maximum and a minimum, so every closed curve has at least two (dg-3.7 asks for four).`,
      caption: String.raw`Drag the orange points, or pick a preset. The curvature $\kappa(s)$ is plotted below the curve; red dots mark its local maxima and blue dots its local minima, copied onto the curve. Slide the position: the tangent line at the gold point is drawn green when the whole curve lies on one side of it and red when it separates part of the curve from the rest. The readout counts, over 240 tangent lines, how many are crossed; it is $0$ exactly when $\kappa\ge0$ everywhere, i.e. for convex curves (try the bean). The ellipse has 4 vertices and the circle has curvature that never varies.`,
      deps: ['dg-1.4'],
      refs: ['do Carmo §1-7'],
      tags: ['convexity', 'vertices'],
      viz(v) {
        const N = 9;
        const S = plane(v, { title: 'curve with its vertices', height: 400, weight: 1.2 });
        const P = plot(v, { x: [0, 1], y: [-1, 1], xlabel: 'arc length $s/L$', ylabel: '$\\kappa_s$', title: 'signed curvature', height: 400, weight: 0.95 });
        const presets = { ellipse: SHAPES.ellipse, egg: SHAPES.egg, bean: SHAPES.bean, circle: SHAPES.circle, rosette: SHAPES.rosette };
        const hs = ringPts(presets.ellipse.f, N).map((p) => S.handle(p[0], p[1], { color: 'orange', r: 7 }));
        v.select('preset', [{ value: 'ellipse', label: 'ellipse' }, { value: 'egg', label: 'egg' }, { value: 'bean', label: 'bean (not convex)' }, { value: 'rosette', label: 'rosette' }, { value: 'circle', label: 'circle' }], 'ellipse', {
          onChange: (val) => ringPts(presets[val].f, N).forEach((p, i) => hs[i].set(p[0], p[1])),
        });
        const uS = v.slider('tangent at $s/L$', 0, 1, 0.12, { step: 0.001 });
        v.legend([['red', 'curvature maximum'], ['blue', 'curvature minimum'], ['green', 'tangent line with the curve on one side'], ['red', 'tangent line crossing the curve', { dash: true }]]);
        let info = {};
        v.render(() => {
          const sm = sampleClosed(fourier2(hs.map((h) => [h.x, h.y])), 480), m = sm.m;
          const kmax = Math.max(...sm.kappa.map(Math.abs)), tol = Math.max(2e-3 * kmax, 1e-3);
          const ex = periodicExtrema(sm.kappa.slice(0, m), tol);
          const kmin = Math.min(...sm.kappa.slice(0, m)), kmx = Math.max(...sm.kappa.slice(0, m));
          const X = crossings(sm.P.filter((_, i) => i % 2 === 0));
          // tangent lines: sample 240 of them and test which sides the curve lies on
          const D = 240, step = m / D; let bad = 0;
          const side = (i) => {
            const p = sm.P[i], T = sm.T[i]; let pos = 0, neg = 0;
            for (let j = 0; j < m; j += 2) { const d = -(sm.P[j][0] - p[0]) * T[1] + (sm.P[j][1] - p[1]) * T[0]; if (d > 1e-7) pos++; else if (d < -1e-7) neg++; }
            return pos > 0 && neg > 0;
          };
          for (let i = 0; i < D; i++) if (side(Math.floor(i * step))) bad++;
          S.path(sm.P, { close: true, color: 'accent', width: 3.2 });
          const i = Math.round(uS.value * m) % m, p = sm.P[i], T = sm.T[i], cross = side(i);
          S.clip(() => S.segment([p[0] - 5 * T[0], p[1] - 5 * T[1]], [p[0] + 5 * T[0], p[1] + 5 * T[1]], { color: cross ? 'red' : 'green', width: 1.8, dash: cross ? [6, 5] : false }));
          S.dot(p[0], p[1], { color: 'gold', r: 6 });
          for (const j of ex.max) S.dot(sm.P[j][0], sm.P[j][1], { color: 'red', r: 6 });
          for (const j of ex.min) S.dot(sm.P[j][0], sm.P[j][1], { color: 'blue', r: 6 });
          const lo = Math.min(kmin, 0), hi = kmx, pad = 0.15 * (hi - lo || 1);
          P.setView([0, 1], [lo - pad, hi + pad]);
          P.hline(0, { color: 'muted', alpha: 0.6 });
          P.path(sm.kappa.map((k, j) => [sm.s[j] / sm.L, k]), { color: 'ink', width: 2.6 });
          for (const j of ex.max) P.dot(sm.s[j] / sm.L, sm.kappa[j], { color: 'red', r: 6 });
          for (const j of ex.min) P.dot(sm.s[j] / sm.L, sm.kappa[j], { color: 'blue', r: 6 });
          P.dot(sm.s[i] / sm.L, sm.kappa[i], { color: 'gold', r: 6 });
          info = { kmin, kmx, bad, D, nmax: ex.max.length, nmin: ex.min.length, simple: X.length === 0, rot: sm.rot, flat: ex.max.length === 0 };
        });
        v.readout(() => String.raw`$\kappa_s$ runs from $${v.fix(info.kmin, 3)}$ to $${v.fix(info.kmx, 3)}$ · ${info.flat ? '$\\kappa_s$ is constant: every point is a vertex' : `vertices found: $${info.nmax}$ maxima and $${info.nmin}$ minima of $\\kappa_s$`}
tangent lines that cut the curve: $${info.bad}$ of $${info.D}$ → ${info.simple ? (info.bad === 0 ? '**convex**' : '**not convex** (and $\\kappa_s<0$ somewhere: ' + (info.kmin < -1e-6 ? 'yes' : 'no') + ')') : 'the curve crosses itself, so it is not simple and the definition does not apply'}`);
      },
    },
  ],
};
