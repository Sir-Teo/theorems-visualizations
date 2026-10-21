// Rudin, Real and Complex Analysis — Chapter 12, part 2: the Phragmén–Lindelöf method (12.7–12.9),
// an interpolation theorem (12.11) and a converse of the maximum modulus theorem (12.13).
// 12.1, 12.10 and 12.12 are taken to be expository paragraphs; see the verify flags below.

const TAU = 2 * Math.PI;
const blend = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
// theme-aware diverging colour for a log-modulus L: blue where |f| < 1, red where |f| > 1, panel at |f| = 1
function divRGB(pal, L, scale) {
  if (!isFinite(L)) return L > 0 ? pal.red : pal.blue;
  const t = 1 - Math.exp(-Math.abs(L) / scale);
  return blend(pal.panel, L > 0 ? pal.red : pal.blue, 0.04 + 0.66 * t);
}
const palette = (v) => ({ panel: v.rgb('panel'), red: v.rgb('red'), blue: v.rgb('blue'), green: v.rgb('green'), ink: v.rgb('ink') });
// ℓ^a-norm with a = 1/p in [0, 1] (a = 0 is the sup norm), for vectors in the plane
function lpn(u, w, a) {
  u = Math.abs(u); w = Math.abs(w); const m = Math.max(u, w);
  if (m === 0) return 0; if (a <= 1e-9) return m;
  return m * Math.pow(Math.pow(u / m, 1 / a) + Math.pow(w / m, 1 / a), a);
}
// operator norm of a 2×2 matrix with nonnegative entries from ℓ^{1/a} to ℓ^{1/b}: the sup is attained on
// nonnegative vectors, so a dense sweep of the quarter-sphere plus a golden-section refinement is exact to ~1e-12.
function opNorm(T, a, b, n = 64) {
  const f = (th) => { const c = Math.cos(th), s = Math.sin(th), nx = lpn(c, s, a); return lpn((T[0][0] * c + T[0][1] * s) / nx, (T[1][0] * c + T[1][1] * s) / nx, b); };
  let best = -1, bt = 0;
  for (let i = 0; i <= n; i++) { const th = (Math.PI / 2) * i / n, val = f(th); if (val > best) { best = val; bt = th; } }
  let lo = Math.max(0, bt - Math.PI / 2 / n), hi = Math.min(Math.PI / 2, bt + Math.PI / 2 / n);
  for (let k = 0; k < 28; k++) { const m1 = lo + (hi - lo) * 0.382, m2 = lo + (hi - lo) * 0.618; if (f(m1) < f(m2)) lo = m1; else hi = m2; }
  const thm = (lo + hi) / 2, vm = f(thm);
  return vm >= best ? { norm: vm, th: thm } : { norm: best, th: bt };
}

export default {
  collection: 'rca',
  chapter: 12,
  items: [
    // ------------------------------------------------------------------ 12.7 lemma: bounded on a strip
    {
      num: '12.7',
      kind: 'Lemma',
      name: 'Maximum modulus on a strip, for bounded functions',
      statement: String.raw`Let $\Omega=\{x+iy:\ a<x<b\}$ be a vertical strip with closure $\bar\Omega$. Suppose $f$ is continuous on $\bar\Omega$, holomorphic in $\Omega$, and bounded: $\abs{f(z)}<B$ in $\Omega$ for some $B<\infty$. If $\abs{f(z)}\le1$ for every $z$ on the boundary $\partial\Omega$, then $\abs{f(z)}\le1$ for every $z\in\Omega$.`,
      idea: String.raw`The maximum modulus theorem (10.24) cannot be applied to the unbounded region directly, so damp $f$ at infinity: for $\eps>0$ put $h_\eps(z)=1/(1+\eps(z-a))$. Since $\Re(1+\eps(z-a))\ge1$ on $\bar\Omega$, $\abs{h_\eps}\le1$ there, and $\abs{h_\eps(x+iy)}\le1/(\eps\abs y)$. Hence $\abs{fh_\eps}\le1$ on $\partial\Omega$ and on the horizontal sides $\abs y=B/\eps$ of a rectangle; the maximum modulus theorem on that rectangle gives $\abs{fh_\eps}\le1$ inside it, every point lies in such a rectangle, and $\eps\to0$ finishes the proof.`,
      caption: String.raw`The strip $0<x<1$ is shaded by $\log\abs{fh_\eps}$ (blue $<1$, red $>1$); the right panel plots, at each height $y$, the largest value across the strip on a $\log_{10}$ scale. The damping $h_\eps$ pushes $\abs{fh_\eps}$ below the dashed bound $B/(\eps\abs y)$, so on the green rectangle $\abs y\le B/\eps$ the boundary values are $\le1$. The second example, $\exp(e^{-i\pi(z-1/2)})$, equals $1$ in modulus on both edges but grows like a double exponential: it is not bounded, no $h_\eps$ helps, and the conclusion fails.`,
      deps: ['rca-10.24'],
      tags: ['Phragmén–Lindelöf', 'maximum modulus', 'strip'],
      verify: true,
      viz(v) {
        const M = v.M;
        const EX = {
          bdd: { label: String.raw`bounded: $f=\dfrac{1}{1+(z+\frac12)^2}$`, logf: (x, y) => { const u = x + 0.5, re = 1 + u * u - y * y, im = 2 * u * y; return -0.5 * Math.log(re * re + im * im); } },
          unb: { label: String.raw`unbounded: $f=\exp\!\big(e^{-i\pi(z-\frac12)}\big)$`, logf: (x, y) => Math.exp(Math.PI * y) * Math.cos(Math.PI * (x - 0.5)) },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'bdd');
        const eps = v.slider(String.raw`$\varepsilon$ in $h_\varepsilon(z)=\dfrac{1}{1+\varepsilon z}$`, 0.17, 3, 0.4, { log: true, decimals: 2 });
        const damp = v.toggle(String.raw`multiply by $h_\varepsilon$`, true);
        const Y = 6, LN10 = Math.log(10);
        const L = v.stage({ x: [-0.3, 1.3], y: [-Y, Y], height: 380, axes: 'box', xticks: [0, 0.5, 1], weight: 1, title: String.raw`the strip, shaded by $\log\abs{f h_\varepsilon}$` });
        const R = v.stage({ x: [-2.6, 2.6], y: [-Y, Y], height: 380, axes: 'box', xticks: [[-2, '0.01'], [-1, '0.1'], [0, '1'], [1, '10'], [2, '100']], weight: 0.8, minWidth: 230, title: String.raw`$\max_{0\le x\le1}\abs{\,\cdot\,}$ at height $y$` });
        const zH = L.handle(0.62, 1.1, { color: 'gold', label: 'z', constrain: (x, y) => [M.clamp(x, 0.01, 0.99), M.clamp(y, -Y + 0.2, Y - 0.2)] });
        const logh = (x, y, e) => -0.5 * Math.log((1 + e * x) ** 2 + (e * y) ** 2);
        v.legend([['ink', '$\\abs f$'], ['accent', String.raw`$\abs{fh_\varepsilon}$`], ['orange', String.raw`bound $B/(\varepsilon\abs y)$`, { dash: true }], ['green', String.raw`rectangle $\abs y\le B/\varepsilon$`, { dash: true }]]);
        // B = sup |f| over the strip (numerically, |y| ≤ 40)
        const supB = {};
        for (const k of Object.keys(EX)) {
          let s = -Infinity, bx = 0, by = 0;
          for (let i = 0; i <= 2000; i++) for (let j = 0; j <= 20; j++) { const l = EX[k].logf(j / 20, -40 + 80 * i / 2000); if (l > s) { s = l; bx = j / 20; by = -40 + 80 * i / 2000; } }
          for (let h = 0.02; h > 1e-7; h *= 0.7) for (const [dx, dy] of [[h, 0], [-h, 0], [0, h], [0, -h]]) {
            const x = M.clamp(bx + dx, 0, 1), y = by + dy, l = EX[k].logf(x, y); if (l > s) { s = l; bx = x; by = y; }
          }
          supB[k] = s;
        }
        let st = null;
        v.render(() => {
          const E = EX[which.value], e = eps.value, D = damp.value, pal = palette(v);
          const B = Math.exp(supB[which.value]), bounded = isFinite(B) && supB[which.value] < 50;
          const val = (x, y) => E.logf(x, y) + (D ? logh(x, y, e) : 0);
          L.raster((x, y) => (x < 0 || x > 1 ? null : divRGB(pal, val(x, y), 2.5)), { key: `${which.value}|${e}|${D}|${pal.panel}`, res: 2 });
          L.axes();
          L.vline(0, { color: 'ink', width: 2.2 }); L.vline(1, { color: 'ink', width: 2.2 });
          const Yr = bounded ? B / e : Infinity;
          if (D && bounded && Yr < Y) {
            L.rect(0, -Yr, 1, Yr, { color: 'green', width: 2.2, dash: [7, 4] });
            for (const s of [-1, 1]) R.hline(s * Yr, { color: 'green', width: 1.6, dash: [7, 4] });
          }
          // profiles across the strip
          const ys = M.linspace(-Y, Y, 361), xs = M.linspace(0, 1, 41);
          const pf = [], pfh = [], pb = [];
          let edgeMax = -Infinity;
          for (const y of ys) {
            let a = -Infinity, b = -Infinity;
            for (const x of xs) { const l = E.logf(x, y); a = Math.max(a, l); b = Math.max(b, l + logh(x, y, e)); }
            const clip = (q) => Math.min(2.55, q / LN10);
            pf.push([clip(a), y]); pfh.push([clip(b), y]);
            pb.push(Math.abs(y) > 0.05 && bounded ? [Math.max(-2.6, Math.log10(B / (e * Math.abs(y)))), y] : null);
          }
          if (D && bounded) {
            for (const y of [-Yr, Yr]) for (const x of xs) edgeMax = Math.max(edgeMax, E.logf(x, y) + logh(x, y, e));
            for (const x of [0, 1]) for (const y of ys) if (Math.abs(y) <= Yr) edgeMax = Math.max(edgeMax, E.logf(x, y) + logh(x, y, e));
          }
          R.vband(0, 3, { color: 'red', alpha: 0.06 });
          R.vline(0, { color: 'green', width: 1.6, dash: [6, 4] });
          if (D && bounded) R.path(pb, { color: 'orange', width: 1.8, dash: [6, 4] });
          R.path(pf, { color: 'ink', width: 2 });
          if (D) R.path(pfh, { color: 'accent', width: 2.4 });
          if (!bounded) { R.arrow(1.6, 1.2, 2.45, 1.2, { color: 'red', width: 2 }); R.text('→ ∞', 1.7, 1.75, { color: 'red', size: 13 }); }
          // the test point
          const lz = E.logf(zH.x, zH.y), lzh = lz + logh(zH.x, zH.y, e);
          R.hline(zH.y, { color: 'gold', width: 1, dash: [2, 3] });
          st = { bounded, B, Yr, edgeMax, lz, lzh, e, D, unb: which.value === 'unb' };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const z = `at $z$: $\\abs{f(z)} = ${s.lz > 600 ? `e^{${v.fmt(s.lz, 3)}}` : s.lz > 6 ? v.sci(Math.exp(s.lz), 4) : v.fmt(Math.exp(s.lz), 4)}$`;
          if (!s.bounded) return `${z}. Here $\\abs f=1$ on both edges, yet $\\abs{f(\\tfrac12+iy)}=\\exp(e^{\\pi y})$: $f$ is not bounded, so the hypothesis $B<\\infty$ fails, no rectangle works, and indeed $\\abs f>1$ inside.`;
          if (!s.D) return `${z} $\\le 1$, with $B=\\sup_\\Omega\\abs f = ${v.fix(s.B, 4)}$. Switch the damping on to see the rectangle of the proof.`;
          return `$B = ${v.fix(s.B, 4)}$; on the boundary of the rectangle $\\abs y\\le B/\\varepsilon = ${v.fix(s.Yr, 2)}$, $\\;\\max\\abs{fh_\\varepsilon} = ${v.fix(Math.exp(s.edgeMax), 4)} \\le 1$, so $\\abs{fh_\\varepsilon}\\le1$ inside. ${z} $\\le1$ $\\;(\\abs{fh_\\varepsilon(z)} = ${v.fix(Math.exp(s.lzh), 4)})$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 12.8 three lines
    {
      num: '12.8',
      kind: 'Theorem',
      name: 'Hadamard three-lines theorem: log M(x) is convex',
      statement: String.raw`Let $\Omega=\{x+iy:\ a<x<b\}$, and let $f$ be continuous and bounded on $\bar\Omega$ and holomorphic in $\Omega$. Put
$$M(x)=\sup\{\abs{f(x+iy)}:\ -\infty<y<\infty\}\qquad(a\le x\le b).$$
Then for $a<x<b$
$$M(x)^{\,b-a}\le M(a)^{\,b-x}\,M(b)^{\,x-a};$$
that is, $\log M$ lies below the chord joining its end values — $\log M$ is a convex function on $[a,b]$.`,
      idea: String.raw`If $M(a),M(b)>0$, divide $f$ by the zero-free entire function $g(z)=M(a)^{(b-z)/(b-a)}M(b)^{(z-a)/(b-a)}$, whose modulus on the line $\Re z=x$ is exactly the chord value $M(a)^{(b-x)/(b-a)}M(b)^{(x-a)/(b-a)}$. Then $f/g$ is bounded on the strip and has modulus at most $1$ on both edges, so Lemma 12.7 gives $\abs{f/g}\le1$ everywhere — which is the inequality. (If $M(a)$ or $M(b)$ vanishes, replace it by $\delta>0$ and let $\delta\to0$.) Applying the result to sub-strips gives convexity of $\log M$.`,
      caption: String.raw`Pick $f$ and drag the vertical line. Left: the strip $0<x<1$ shaded by $\log\abs f$; the gold dot marks where the supremum $M(x_0)$ is attained on the line (computed over $\abs y\le40$). Right: $\log M(x)$ (blue) never rises above the chord (green); $e^{1.5z}$ gives equality, $e^{3(z-1/2)^2}$ even dips below both edge values. Switch on the division by $g$ to see the proof: then both edges are $\le1$ and Lemma 12.7 applies.`,
      deps: ['rca-12.7'],
      tags: ['three lines', 'convexity', 'strip'],
      viz(v) {
        const M = v.M;
        const EX = {
          gauss: { label: '$e^{z^2}$', logf: (x, y) => x * x - y * y },
          bowl: { label: String.raw`$e^{3(z-\frac12)^2}$`, logf: (x, y) => 3 * ((x - 0.5) ** 2 - y * y) },
          lin: { label: '$e^{1.5z}$', logf: (x) => 1.5 * x },
          rat: { label: String.raw`$\frac{1}{(z+0.4)(z-1.3-0.8i)}$`, logf: (x, y) => -0.5 * Math.log(((x + 0.4) ** 2 + y * y) * ((x - 1.3) ** 2 + (y - 0.8) ** 2)) },
        };
        const which = v.select('$f$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'rat');
        const div = v.toggle(String.raw`divide by $g(z)=M(0)^{1-z}M(1)^{z}$`, false);
        const L = v.stage({ x: [-0.12, 1.12], y: [-2.3, 2.3], height: 340, axes: 'box', xticks: [0, 0.5, 1], title: String.raw`the strip, shaded by $\log\abs{f}$` });
        const R = v.stage({ x: [-0.1, 1.1], y: [-1, 1], height: 340, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], xlabel: 'x', title: String.raw`$\log M(x)$ and the chord` });
        const xH = L.handle(0.5, -2.05, { color: 'accent', label: 'x₀', constrain: (x) => [M.clamp(x, 0.02, 0.98), -2.05] });
        v.legend([['accent', String.raw`$\log M(x)$`], ['green', 'chord $(1-x)\\log M(0)+x\\log M(1)$', { dash: true }], ['gold', 'where the sup is attained; gap to the chord']]);
        const YS = M.linspace(-40, 40, 1601);
        // sup over y of log|f(x+iy)|, with the maximiser
        function supAt(E, x) {
          let best = -Infinity, by = 0;
          for (const y of YS) { const l = E.logf(x, y); if (l > best) { best = l; by = y; } }
          let lo = by - 0.05, hi = by + 0.05;
          for (let k = 0; k < 30; k++) { const m1 = lo + (hi - lo) * 0.382, m2 = lo + (hi - lo) * 0.618; if (E.logf(x, m1) < E.logf(x, m2)) lo = m1; else hi = m2; }
          const ym = (lo + hi) / 2, lm = E.logf(x, ym);
          return lm >= best ? [lm, ym] : [best, by];
        }
        let cache = {}, st = null;
        v.render(() => {
          const k = which.value, E = EX[k], D = div.value, pal = palette(v);
          if (!cache[k]) { const xs = M.linspace(0, 1, 121); cache[k] = { xs, lm: xs.map((x) => supAt(E, x)[0]) }; }
          const { xs, lm } = cache[k];
          const L0 = lm[0], L1 = lm[lm.length - 1], chord = (x) => (1 - x) * L0 + x * L1;
          L.setTitle(D ? String.raw`the strip, shaded by $\log\abs{f/g}$` : String.raw`the strip, shaded by $\log\abs{f}$`);
          L.raster((x, y) => (x < 0 || x > 1 ? null : divRGB(pal, E.logf(x, y) - (D ? chord(x) : 0), 1)), { key: `${k}|${D}|${pal.panel}`, res: 2 });
          L.axes();
          L.vline(0, { color: 'ink', width: 2.2 }); L.vline(1, { color: 'ink', width: 2.2 });
          const x0 = xH.x, [l0, y0] = supAt(E, x0);
          L.vline(x0, { color: 'accent', width: 1.8, dash: [6, 4] });
          if (k !== 'lin' && Math.abs(y0) < 2.25) L.dot(x0, y0, { color: 'gold', r: 6 });
          if (k === 'lin') L.text('|f| constant on each line', x0, 1.5, { color: 'ink', size: 12, align: 'center' });
          // right panel
          const vals = lm.map((l, i) => l - (D ? chord(xs[i]) : 0));
          const ch = (x) => (D ? 0 : chord(x));
          const lo = Math.min(...vals, ch(0), ch(1)), hi = Math.max(...vals, ch(0), ch(1));
          const pad = Math.max(0.25, (hi - lo) * 0.18);
          R.setView(null, [lo - pad, hi + pad]);
          R.setTitle(D ? String.raw`$\log M_{f/g}(x)\le0$: Lemma 12.7 applies` : String.raw`$\log M(x)$ and the chord`);
          R.between((x) => ch(x), (x) => vals[Math.round(x * 120)], 0, 1, { fill: 'green', fillAlpha: 0.1, n: 120 });
          R.fn(ch, { domain: [0, 1], color: 'green', width: 2, dash: [7, 4] });
          R.path(xs.map((x, i) => [x, vals[i]]), { color: 'accent', width: 2.6 });
          const v0 = l0 - (D ? chord(x0) : 0);
          R.line(x0, v0, x0, ch(x0), { color: 'gold', width: 2.4 });
          R.dot(x0, v0, { color: 'accent', r: 5 }); R.dot(x0, ch(x0), { color: 'green', r: 4.5 });
          R.dot(0, ch(0), { color: 'ink', r: 4, label: D ? '' : 'log M(0)', labelPos: 'n', labelSize: 13 });
          R.dot(1, ch(1), { color: 'ink', r: 4, label: D ? '' : 'log M(1)', labelPos: 'n', labelSize: 13 });
          st = { x0, l0, c0: chord(x0), L0, L1, y0, lin: k === 'lin' };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$M(x_0) = ${v.fmt(Math.exp(s.l0), 4)}$${s.lin ? '' : ` (attained at $y = ${v.fix(s.y0, 2)}$)`} $\\;\\le\\; M(0)^{1-x_0}M(1)^{x_0} = ${v.fmt(Math.exp(s.L0), 4)}^{${v.fix(1 - s.x0, 2)}}\\cdot${v.fmt(Math.exp(s.L1), 4)}^{${v.fix(s.x0, 2)}} = ${v.fmt(Math.exp(s.c0), 4)}$ — gap in $\\log$: $${v.fix(s.c0 - s.l0, 4)}\\ge0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 12.9 Phragmén–Lindelöf
    {
      num: '12.9',
      kind: 'Theorem',
      name: 'Phragmén–Lindelöf theorem in a strip',
      credit: 'Phragmén & Lindelöf, 1908',
      statement: String.raw`Let $\Omega=\{x+iy:\ \abs y<\pi/2\}$, and let $f$ be continuous on $\bar\Omega$ and holomorphic in $\Omega$, with $\abs{f(z)}\le1$ on $\partial\Omega$. Suppose there are constants $\alpha<1$ and $A<\infty$ such that
$$\abs{f(x+iy)}<\exp\{A\exp(\alpha\abs x)\}\qquad(x+iy\in\Omega).$$
Then $\abs{f(z)}\le1$ for all $z\in\Omega$. The condition $\alpha<1$ cannot be weakened to $\alpha=1$: $f(z)=\exp(e^z)$ has modulus $1$ on $\partial\Omega$ and is unbounded on the real axis.`,
      idea: String.raw`Pick $\beta$ with $\alpha<\beta<1$ and damp with $h_\eps(z)=\exp\{-\eps(e^{\beta z}+e^{-\beta z})\}$. For $\abs y\le\pi/2$, $\Re(e^{\beta z}+e^{-\beta z})=(e^{\beta x}+e^{-\beta x})\cos\beta y\ge\delta(e^{\beta x}+e^{-\beta x})$ with $\delta=\cos(\beta\pi/2)>0$, so $\abs{h_\eps}\le1$ on $\bar\Omega$ and $\abs{fh_\eps}\le\exp\{Ae^{\alpha\abs x}-\eps\delta(e^{\beta x}+e^{-\beta x})\}\to0$ as $\abs x\to\infty$, because $\beta>\alpha$. The maximum modulus theorem (10.24) on long rectangles gives $\abs{fh_\eps}\le1$; let $\eps\to0$. Both inequalities $\beta>\alpha$ and $\beta<1$ are needed, which is why $\alpha<1$ is sharp.`,
      caption: String.raw`The test family is $f(z)=\exp\big(e^{i\varphi}e^{\alpha z}\big)$, which obeys the growth bound with exponent $\alpha$. Drag the gold point in the $(\alpha,\varphi)$-diagram: green = edges $\le1$ and $f$ bounded by $1$, red = edges $\le1$ but $f$ unbounded, grey = the edge hypothesis fails. Left of $\alpha=1$ there is no red — that is the theorem; the red wedge starts exactly at $\exp(e^z)$. Bottom right: on a log scale the proof's damping (teal, slope $\beta$) overtakes the allowed growth (orange, slope $\alpha$) only when $\alpha<\beta<1$.`,
      deps: ['rca-10.24'],
      tags: ['Phragmén–Lindelöf', 'growth', 'strip'],
      viz(v) {
        const M = v.M, H = Math.PI / 2;
        const S = v.stage({ x: [-3, 4.5], y: [-2.05, 2.05], height: 220, full: true, axes: 'box', xlabel: 'x', yticks: [[0, '0']], title: String.raw`the strip $\abs y<\pi/2$, shaded by $\log\abs f$ (blue: $\abs f<1$, red: $\abs f>1$); edges green where $\abs f\le1$` });
        const D = v.stage({ x: [0, 2], y: [-H, 3 * H], height: 280, axes: 'box', xticks: [0, 0.5, 1, 1.5, 2], yticks: [[-H, '−π/2'], [0, '0'], [H, 'π/2'], [Math.PI, 'π'], [3 * H, '3π/2']], xlabel: 'α', ylabel: 'φ', title: String.raw`hypotheses for $\exp(e^{i\varphi}e^{\alpha z})$` });
        const P = v.stage({ x: [0, 7], y: [-4, 6], height: 280, axes: 'box', xlabel: '|x|', title: String.raw`proof: $\log$ of growth vs damping` });
        const beta = v.slider(String.raw`damping exponent $\beta$`, 0.1, 1.4, 0.85, { step: 0.01 });
        const eps = v.slider(String.raw`$\varepsilon$`, 0.005, 1, 0.05, { log: true, decimals: 3 });
        const hd = D.handle(1, 0, {
          color: 'gold', r: 8,
          constrain: (x, y) => {
            let a = M.clamp(x, 0.05, 2), p = M.clamp(y, -H, 3 * H);
            if (Math.abs(a - 1) < 0.025) a = 1;
            for (const c of [0, Math.PI]) if (Math.abs(p - c) < 0.07) p = c;
            return [a, p];
          },
        });
        const edgeOK = (a, p) => Math.cos(p + a * H) <= 1e-9 && Math.cos(p - a * H) <= 1e-9;
        const bounded = (a, p) => {
          const lo = p - a * H, hi = p + a * H;
          if (Math.ceil(lo / TAU - 1e-12) <= Math.floor(hi / TAU + 1e-12)) return false;
          return Math.max(Math.cos(lo), Math.cos(hi)) <= 1e-9;
        };
        v.legend([['green', String.raw`edge with $\abs f\le1$ / bounded`], ['red', String.raw`edge with $\abs f>1$ / unbounded`], ['gold', String.raw`$(\alpha,\varphi)$`], ['orange', String.raw`$\log$ of the growth $e^{\alpha\abs x}$`], ['teal', String.raw`$\log$ of the damping $\varepsilon\delta(e^{\beta x}+e^{-\beta x})$`]]);
        let st = null;
        v.render(() => {
          const a = hd.x, p = hd.y, pal = palette(v);
          const logf = (x, y) => Math.exp(a * x) * Math.cos(a * y + p);
          // --- strip
          S.raster((x, y) => (Math.abs(y) > H ? null : divRGB(pal, logf(x, y), 2)), { key: `${a}|${p}|${pal.panel}`, res: 2 });
          S.axes();
          S.tex(String.raw`y=\tfrac{\pi}{2}`, -2.95, H, { align: 'left', baseline: 'bottom', dy: -5, size: 13 });
          S.tex(String.raw`y=-\tfrac{\pi}{2}`, -2.95, -H, { align: 'left', baseline: 'top', dy: 5, size: 13 });
          for (const s of [-1, 1]) {
            const ok = [], bad = [];
            for (const x of M.linspace(-3, 4.5, 301)) { const good = logf(x, s * H) <= 1e-9; ok.push(good ? [x, s * H] : null); bad.push(good ? null : [x, s * H]); }
            S.path(ok, { color: 'green', width: 4 }); S.path(bad, { color: 'red', width: 4 });
          }
          // --- hypothesis diagram
          D.raster((x, y) => {
            if (!edgeOK(x, y)) return blend(pal.panel, pal.ink, 0.07);
            return bounded(x, y) ? blend(pal.panel, pal.green, 0.45) : blend(pal.panel, pal.red, 0.45);
          }, { key: `diag|${pal.panel}`, res: 2 });
          D.axes();
          D.vline(1, { color: 'ink', width: 1.4, dash: [6, 4] });
          D.text('bounded by 1', 0.42, Math.PI + 0.12, { color: 'green', size: 12, align: 'center' });
          D.text('edges ≤ 1, unbounded', 1.55, -0.1, { color: 'red', size: 12, align: 'center' });
          D.text('α < 1: the theorem', 0.5, 3 * H - 0.25, { color: 'ink', size: 12, align: 'center' });
          // --- proof panel (logs of the two exponents as functions of |x|)
          const b = beta.value, e = eps.value, delta = Math.cos(b * H);
          P.fn((x) => a * x, { color: 'orange', width: 2.4 });
          if (delta > 1e-6) P.fn((x) => Math.log(e * delta) + Math.log(Math.exp(b * x) + Math.exp(-b * x)), { color: 'teal', width: 2.4 });
          let cross = null;
          if (delta > 1e-6 && b > a) {
            for (const x of M.linspace(0, 40, 4001)) if (Math.log(e * delta) + Math.log(Math.exp(b * x) + Math.exp(-b * x)) > a * x) { cross = x; break; }
            if (cross != null && cross < 7) { P.vband(cross, 8, { color: 'green', alpha: 0.1 }); P.vline(cross, { color: 'green', width: 1, dash: [3, 3] }); }
          }
          P.corner(delta <= 1e-6 ? 'β ≥ 1: δ = cos(βπ/2) ≤ 0, h_ε blows up on the edges' : b <= a ? 'β ≤ α: the damping never catches up' : `damping wins for |x| > ${cross == null ? '40' : v.fmt(cross, 3)}`, 'tl', { color: delta <= 1e-6 || b <= a ? 'red' : 'green', weight: 600 });

          let sup = -Infinity;
          for (const x of M.linspace(-3, 4.5, 151)) for (const y of M.linspace(-H, H, 31)) sup = Math.max(sup, logf(x, y));
          st = { a, p, eo: edgeOK(a, p), bd: bounded(a, p), sup };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = `$\\alpha = ${v.fix(s.a, 2)}$, $\\varphi = ${v.fix(s.p, 2)}$: `;
          if (!s.eo) return head + 'the boundary hypothesis $\\abs f\\le1$ on $\\partial\\Omega$ fails (red edge), so the theorem says nothing.';
          if (s.bd) return head + `edges $\\le1$${s.a < 1 ? ' and $\\alpha<1$' : ''}, and indeed $\\abs f\\le1$ throughout the strip (largest value seen: $${v.fmt(Math.exp(s.sup), 4)}$).`;
          return head + `edges $\\le1$, but $\\alpha ${s.a === 1 ? '=' : '>'} 1$ violates the growth condition — and $f$ is unbounded (on the strip shown, $\\abs f$ reaches $e^{${v.fmt(s.sup, 3)}}$). ${s.a === 1 && s.p === 0 ? 'This is $\\exp(e^z)$, the example showing $\\alpha<1$ is sharp.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 12.11 interpolation
    {
      num: '12.11',
      kind: 'Theorem',
      name: 'Riesz–Thorin interpolation theorem',
      credit: 'M. Riesz & Thorin, 1927',
      statement: String.raw`Let $(X,\mu)$ and $(Y,\nu)$ be $\sigma$-finite measure spaces, let $1\le p_0,p_1,q_0,q_1\le\infty$, and let $T$ be a linear map, defined on the complex simple functions on $X$ that vanish outside sets of finite measure, with values measurable functions on $Y$, such that
$$\norm{Tf}_{q_0}\le M_0\norm{f}_{p_0},\qquad\norm{Tf}_{q_1}\le M_1\norm{f}_{p_1}.$$
For $0<t<1$ define $p_t,q_t$ by $\dfrac1{p_t}=\dfrac{1-t}{p_0}+\dfrac t{p_1}$ and $\dfrac1{q_t}=\dfrac{1-t}{q_0}+\dfrac t{q_1}$. Then
$$\norm{Tf}_{q_t}\le M_0^{1-t}M_1^{t}\,\norm{f}_{p_t}$$
for all such $f$; so, when $p_t<\infty$, $T$ extends to a bounded operator $L^{p_t}(\mu)\to L^{q_t}(\nu)$ of norm at most $M_0^{1-t}M_1^t$. In other words, $\log\norm{T}_{p\to q}$ is a convex function of $(1/p,1/q)$.`,
      idea: String.raw`Fix simple $f$ and $g$ normalised in $L^{p_t}$ and $L^{q_t'}$. Let the exponents of $\abs f$ and $\abs g$ depend linearly on a complex variable $z$, giving simple functions $f_z,g_z$ with $f_t=f$, $g_t=g$, and put $F(z)=\int (Tf_z)\,g_z\,d\nu$. Then $F$ is a finite sum of exponentials — entire and bounded on $0\le\Re z\le1$ — and Hölder's inequality (3.5) gives $\abs F\le M_0$ on $\Re z=0$ and $\abs F\le M_1$ on $\Re z=1$. The three-lines theorem (12.8) yields $\abs{F(t)}=\abs{\int (Tf)g}\le M_0^{1-t}M_1^t$, and taking the supremum over $g$ recovers $\norm{Tf}_{q_t}$ (density of simple functions, 3.13).`,
      caption: String.raw`A finite instance: $T$ is a $2\times2$ matrix with nonnegative entries (drag its columns $Te_1,Te_2$ in the middle panel), so its norms between the $\ell^p$ spaces of $\C^2$ can be computed exactly. Left: the Riesz diagram — $\log\norm{T}_{p\to q}$ over $(1/p,1/q)$ — with draggable endpoints; the gold point moves along the segment as $t$ varies. Middle: the $\ell^{p_t}$ unit ball, its image, and the smallest $\ell^{q_t}$ ball containing it. Bottom: $\log\norm T_{p_t\to q_t}$ stays under the chord. The Hausdorff–Young preset interpolates $(1,\infty)$ and $(2,2)$, the classical application.`,
      deps: ['rca-12.8', 'rca-3.5', 'rca-3.13'],
      see: ['rca-6.16'],
      tags: ['interpolation', 'Lp spaces', 'three lines'],
      verify: true,
      viz(v) {
        const M = v.M;
        const preset = v.select('endpoints', [
          { value: 'schur', label: String.raw`$(1,1)$ and $(\infty,\infty)$` },
          { value: 'hy', label: String.raw`$(1,\infty)$ and $(2,2)$` },
          { value: 'mix', label: String.raw`$(\tfrac54,4)$ and $(4,\tfrac54)$` },
        ], 'schur', { onChange: (k) => setPreset(k) });
        const tS = v.slider('$t$', 0, 1, 0.4, { step: 0.005 });
        const Q = v.stage({ x: [-0.08, 1.1], y: [-0.08, 1.14], equal: true, height: 300, axes: 'box', xticks: [[0, '0'], [0.5, '½'], [1, '1']], yticks: [[0, '0'], [0.5, '½'], [1, '1']], xlabel: '1/p', ylabel: '1/q', weight: 0.9, minWidth: 240, title: String.raw`Riesz diagram: $\log\norm{T}_{p\to q}$` });
        const G = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 300, axes: true, weight: 1.1, title: String.raw`$\ell^{p_t}$ ball, its image, and the $\ell^{q_t}$ ball of radius $\norm T$` });
        const C = v.stage({ x: [-0.02, 1.02], y: [-1, 1], height: 170, full: true, axes: 'box', xlabel: 't', title: String.raw`$\log\norm{T}_{p_t\to q_t}$ (blue) under the chord $(1-t)\log M_0+t\log M_1$ (green)` });
        const P0 = Q.handle(1, 1, { color: 'purple', label: 'P₀', constrain: { x: [0, 1], y: [0, 1] } });
        const P1 = Q.handle(0, 0, { color: 'teal', label: 'P₁', labelPos: 'ne', constrain: { x: [0, 1], y: [0, 1] } });
        const c1 = G.handle(1.0, 0.2, { color: 'orange', label: 'Te₁', constrain: { x: [0, 1.2], y: [0, 1.2] } });
        const c2 = G.handle(0.45, 0.85, { color: 'pink', label: 'Te₂', constrain: { x: [0, 1.2], y: [0, 1.2] } });
        function setPreset(k) {
          const P = { schur: [[1, 1], [0, 0]], hy: [[1, 0], [0.5, 0.5]], mix: [[0.8, 0.25], [0.25, 0.8]] }[k];
          P0.set(P[0][0], P[0][1]); P1.set(P[1][0], P[1][1]);
        }
        v.legend([['accent', String.raw`image of the $\ell^{p_t}$ ball`, { area: true }], ['orange', String.raw`$\ell^{p_t}$ unit ball`], ['green', String.raw`$\ell^{q_t}$ ball of radius $\norm{T}_{p_t\to q_t}$`, { dash: true }], ['gold', 'extremal vector and its image']]);
        const ballPts = (a, r = 1, n = 200) => M.linspace(0, TAU, n + 1).map((th) => { const c = Math.cos(th), s = Math.sin(th), k = r / lpn(c, s, a); return [c * k, s * k]; });
        let st = null;
        v.render(() => {
          const T = [[c1.x, c2.x], [c1.y, c2.y]];
          const pal = palette(v);
          // Riesz diagram heat map (log-norm, centred on its own range)
          const key = `${T}|${pal.panel}`;
          let lo = Infinity, hi = -Infinity;
          for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) { const l = Math.log(opNorm(T, i / 6, j / 6, 24).norm); lo = Math.min(lo, l); hi = Math.max(hi, l); }
          Q.raster((x, y) => {
            if (x < 0 || x > 1 || y < 0 || y > 1) return null;
            const l = Math.log(opNorm(T, x, y, 24).norm);
            const c = M.cmap((l - lo) / (hi - lo + 1e-9), 'viridis');
            return blend(c, pal.panel, 0.2);
          }, { key, res: 6 });
          Q.rect(0, 0, 1, 1, { color: 'ink', width: 1.4 });
          const a0 = P0.x, b0 = P0.y, a1 = P1.x, b1 = P1.y, t = tS.value;
          Q.line(a0, b0, a1, b1, { color: 'panel', width: 5 });
          Q.line(a0, b0, a1, b1, { color: 'ink', width: 2 });
          const at = (1 - t) * a0 + t * a1, bt = (1 - t) * b0 + t * b1;
          Q.dot(at, bt, { color: 'gold', r: 6.5 });
          // the curve along the segment
          const ts = M.linspace(0, 1, 81);
          const lt = ts.map((s) => Math.log(opNorm(T, (1 - s) * a0 + s * a1, (1 - s) * b0 + s * b1).norm));
          const L0 = lt[0], L1 = lt[lt.length - 1], chord = (s) => (1 - s) * L0 + s * L1;
          const lo2 = Math.min(...lt, L0, L1), hi2 = Math.max(...lt, L0, L1), pad = Math.max(0.12, (hi2 - lo2) * 0.25);
          C.setView(null, [lo2 - pad, hi2 + pad]);
          C.between(chord, (s) => lt[Math.round(s * 80)], 0, 1, { fill: 'green', fillAlpha: 0.12, n: 80 });
          C.fn(chord, { domain: [0, 1], color: 'green', width: 2, dash: [7, 4] });
          C.path(ts.map((s, i) => [s, lt[i]]), { color: 'accent', width: 2.6 });
          const cur = opNorm(T, at, bt);
          C.line(t, Math.log(cur.norm), t, chord(t), { color: 'gold', width: 2.4 });
          C.dot(t, Math.log(cur.norm), { color: 'gold', r: 5.5 });
          C.dot(0, L0, { color: 'purple', r: 5, label: 'log M₀', labelPos: 'ne', labelSize: 12 });
          C.dot(1, L1, { color: 'teal', r: 5, label: 'log M₁', labelPos: 'nw', labelSize: 12 });
          // geometry: ℓ^{p_t} ball, image, ℓ^{q_t} ball of radius ‖T‖
          const ball = ballPts(at), img = ball.map(([x, y]) => [T[0][0] * x + T[0][1] * y, T[1][0] * x + T[1][1] * y]);
          G.poly(ballPts(bt, cur.norm), { color: 'green', width: 2, dash: [7, 4], fill: 'green', fillAlpha: 0.06 });
          G.poly(ball, { color: 'orange', width: 2 });
          G.poly(img, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.22 });
          const th = cur.th, cx = Math.cos(th), sx = Math.sin(th), nx = lpn(cx, sx, at), xv = [cx / nx, sx / nx];
          const yv = [T[0][0] * xv[0] + T[0][1] * xv[1], T[1][0] * xv[0] + T[1][1] * xv[1]];
          for (const sg of [1, -1]) { G.dot(sg * xv[0], sg * xv[1], { color: 'gold', r: 4.5 }); G.dot(sg * yv[0], sg * yv[1], { color: 'gold', r: 5.5 }); }
          G.arrow(0, 0, T[0][0], T[1][0], { color: 'orange', width: 1.6, head: 8 });
          G.arrow(0, 0, T[0][1], T[1][1], { color: 'pink', width: 1.6, head: 8 });
          const pS = (a) => (a < 1e-6 ? '\\infty' : v.fmt(1 / a, 3));
          st = { pt: pS(at), qt: pS(bt), n: cur.norm, bound: Math.exp(chord(t)), M0: Math.exp(L0), M1: Math.exp(L1), t, convex: Math.max(...lt.slice(1, -1).map((l, i) => l - chord(ts[i + 1]))) };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$t=${v.fix(s.t, 3)}$: $\\;p_t = ${s.pt}$, $q_t = ${s.qt}$; $\\;\\norm{T}_{p_t\\to q_t} = ${v.fix(s.n, 4)}\\;\\le\\; M_0^{1-t}M_1^{t} = ${v.fix(s.M0, 3)}^{${v.fix(1 - s.t, 2)}}\\cdot${v.fix(s.M1, 3)}^{${v.fix(s.t, 2)}} = ${v.fix(s.bound, 4)}$. Over $0<t<1$: $\\;\\max_t\\big(\\log\\norm T_{p_t\\to q_t}-\\text{chord}\\big) = ${v.fix(s.convex, 5)}\\le0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 12.13 converse
    {
      num: '12.13',
      kind: 'Theorem',
      name: 'A converse of the maximum modulus theorem',
      statement: String.raw`Let $\mathscr M$ be a complex vector space of continuous functions on the closed unit disc $\bar U$ such that
(a) $\mathscr M$ contains the constants, and $zf\in\mathscr M$ whenever $f\in\mathscr M$ (so $\mathscr M$ is closed under multiplication by polynomials);
(b) every $f\in\mathscr M$ satisfies the maximum modulus inequality $\abs{f(a)}\le\norm{f}_T=\max_{T}\abs f$ for all $a\in U$.
Then every $f\in\mathscr M$ is holomorphic in $U$.`,
      idea: String.raw`By (b), $f\mapsto f(a)$ has norm $\le1$ on $\mathscr M$ viewed inside $C(T)$, so (Hahn–Banach and Riesz, 5.23) there is a positive measure $\mu_a$ on $T$ with $f(a)=\int f\,d\mu_a$ for all $f\in\mathscr M$. By (a) this holds for every polynomial, and such a representing measure is unique: it is the Poisson measure (5.24, 5.25). Hence every member of $\mathscr M$ is the Poisson integral of its boundary values, i.e. harmonic in $U$. Apply this to $f$ and to $zf$: if both are harmonic then $0=\Delta(zf)=4\,\partial(z\bar\partial f)=4\bar\partial f$, so $f$ satisfies the Cauchy–Riemann equation.`,
      caption: String.raw`Pick a continuous $f$. The space $\mathscr M$ generated by $1$ and $f$ under (a) contains $g=P+Qf$ for all polynomials $P,Q$; the readout shows a specific $g$ (scaled by $\lambda$). Left: the surface $\abs{g}$ over $\bar U$ with the rim $\abs g$ on $T$ in green. For every non-holomorphic choice and a suitable $\lambda$ (the readout says when), $\abs g$ peaks *inside* the disc, so (b) fails; for $z^2$ it always peaks on the rim. Right: the proof — drag $a$ and compare $f(a)$, $af(a)$ with the Poisson integrals of their boundary values (weight $P_a$ shown on the rim). The shading is the defect $\abs{af(a)-P[\zeta f](a)}+\abs{f(a)-P[f](a)}$.`,
      deps: ['rca-5.23', 'rca-5.24', 'rca-5.25'],
      see: ['rca-10.24', 'rca-11.5'],
      tags: ['maximum modulus', 'Poisson integral', 'converse'],
      verify: true,
      viz(v) {
        const M = v.M, { Cx } = M;
        // f as a polynomial in z and z̄: [coef, m, n] ↦ coef·z^m z̄^n; witness g = P + Q f
        const EX = {
          conj: { label: String.raw`$\bar z$`, f: [[1, 0, 1]], P: (l) => [1], Q: (l) => [0, -l], PQ: String.raw`P=1,\ Q=-\lambda z` },
          re: { label: String.raw`$\Re z$`, f: [[0.5, 1, 0], [0.5, 0, 1]], P: (l) => [1, 0, l], Q: (l) => [0, -2 * l], PQ: String.raw`P=1+\lambda z^2,\ Q=-2\lambda z` },
          abs2: { label: String.raw`$\abs z^2$`, f: [[1, 1, 1]], P: () => [1], Q: (l) => [-l], PQ: String.raw`P=1,\ Q=-\lambda` },
          mix: { label: String.raw`$z+0.3\bar z^2$`, f: [[1, 1, 0], [0.3, 0, 2]], P: (l) => [1, 0, 0, l / 0.3], Q: (l) => [0, 0, -l / 0.3], PQ: String.raw`P=1+\tfrac{\lambda}{0.3}z^3,\ Q=-\tfrac{\lambda}{0.3}z^2` },
          hol: { label: String.raw`$z^2$ (holomorphic)`, f: [[1, 2, 0]], P: () => [1], Q: (l) => [0, -l], PQ: String.raw`P=1,\ Q=-\lambda z` },
        };
        const which = v.select('$f$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'conj');
        const lam = v.slider(String.raw`$\lambda$`, 0, 2.5, 0.8, { step: 0.01 });
        const S3 = v.stage3d({ height: 340, range: 1.45, yaw: -0.75, pitch: 0.5, labels: ['x', 'y', '|g|'], title: String.raw`the surface $\abs{g(z)}$ over $\bar U$; rim = values on $T$` });
        const D = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 340, axes: false, title: String.raw`proof: $f$, $zf$ vs. the Poisson integrals $P[f]$, $P[\zeta f]$` });
        const aH = D.handle(0.35, 0.3, { color: 'gold', label: 'a', constrain: (x, y) => { const r = Math.hypot(x, y); return r <= 0.9 ? [x, y] : [x * 0.9 / r, y * 0.9 / r]; } });
        const pw = (z, k) => (k === 0 ? new Cx(1, 0) : z.pow(k));
        const evalF = (mono, z) => mono.reduce((s, [c, m, n]) => s.add(pw(z, m).mul(pw(z.conj(), n)).scale(c)), new Cx(0, 0));
        // Poisson integral of ζ^m ζ̄^n = ζ^{m−n} on T, evaluated at a: a^k (k ≥ 0) or ā^{−k}
        const poissonF = (mono, a) => mono.reduce((s, [c, m, n]) => s.add((m >= n ? pw(a, m - n) : pw(a.conj(), n - m)).scale(c)), new Cx(0, 0));
        const shift = (mono) => mono.map(([c, m, n]) => [c, m + 1, n]);
        const poly = (cs, z) => cs.reduceRight((s, c) => s.mul(z).add(new Cx(c, 0)), new Cx(0, 0));
        let st = null;
        v.render(() => {
          const E = EX[which.value], l = lam.value, P = E.P(l), Q = E.Q(l), pal = palette(v);
          const g = (z) => poly(P, z).add(poly(Q, z).mul(evalF(E.f, z)));
          // ---- 3D surface of |g|
          let rimMax = 0, inMax = 0, inAt = [0, 0];
          for (let i = 0; i < 360; i++) rimMax = Math.max(rimMax, g(Cx.polar(1, TAU * i / 360)).abs());
          for (let i = 0; i <= 40; i++) for (let j = 0; j < 72; j++) { const z = Cx.polar(0.999 * i / 40, TAU * j / 72), m = g(z).abs(); if (m > inMax) { inMax = m; inAt = [z.re, z.im]; } }
          const hs = 1 / Math.max(1, inMax, rimMax);
          const violate = inMax > rimMax * (1 + 1e-6) + 1e-9;
          S3.surface((r, th) => { const z = Cx.polar(r, th); return [z.re, z.im, g(z).abs() * hs]; }, [0, 1], [0, TAU], {
            nu: 18, nv: 48, alpha: 0.9,
            colorFn: (r, th, p) => v.mix('blue', 'gold', Math.min(1, p[2] / Math.max(1e-9, Math.max(inMax, rimMax) * hs))),
          });
          S3.curve((th) => { const z = Cx.polar(1, th); return [z.re, z.im, g(z).abs() * hs]; }, 0, TAU, { color: 'green', width: 3, n: 120, bias: -0.05 });
          S3.curve((th) => [Math.cos(th), Math.sin(th), 0], 0, TAU, { color: 'muted', width: 1, n: 90 });
          if (violate) S3.dot([inAt[0], inAt[1], inMax * hs], { color: 'red', r: 6, label: 'interior max', bias: -0.2 });
          // ---- proof panel: defect heat map, Poisson weight on the rim
          const zf = shift(E.f);
          const defect = (z) => evalF(E.f, z).sub(poissonF(E.f, z)).abs() + evalF(zf, z).sub(poissonF(zf, z)).abs();
          D.raster((x, y) => {
            if (x * x + y * y >= 1) return null;
            const d = defect(new Cx(x, y));
            return d < 1e-9 ? blend(pal.panel, pal.green, 0.18) : blend(pal.panel, pal.red, 0.12 + 0.6 * (1 - Math.exp(-d * 2)));
          }, { key: `${which.value}|${pal.panel}`, res: 2 });
          const a = new Cx(aH.x, aH.y), r2 = a.abs2();
          let pmax = 0; const pk = [];
          for (let i = 0; i < 180; i++) { const t = TAU * i / 180, pv = (1 - r2) / (1 - 2 * (a.re * Math.cos(t) + a.im * Math.sin(t)) + r2); pk.push(pv); pmax = Math.max(pmax, pv); }
          for (let i = 0; i < 180; i++) {
            const t0 = TAU * i / 180, t1 = TAU * (i + 1) / 180;
            D.line(Math.cos(t0), Math.sin(t0), Math.cos(t1), Math.sin(t1), { color: 'accent', width: 2 + 9 * pk[i] / pmax, alpha: 0.25 + 0.75 * pk[i] / pmax, cap: 'butt' });
          }
          D.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          D.text('Poisson weight Pₐ on T', 0, -1.09, { color: 'accent', size: 12, align: 'center' });
          const fa = evalF(E.f, a), pfa = poissonF(E.f, a), afa = evalF(zf, a), pzf = poissonF(zf, a);
          st = { E, rimMax, inMax, violate, fa, pfa, afa, pzf, hol: which.value === 'hol', l };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const c = (w) => w.toString(3).replace('i', '\\,i');
          const verdict = s.violate
            ? `$\\sup_U\\abs g = ${v.fix(s.inMax, 3)} > \\norm{g}_T = ${v.fix(s.rimMax, 3)}$: this $g\\in\\mathscr M$ breaks (b), so no space containing $f$ satisfies the hypotheses.`
            : `$\\sup_U\\abs g = ${v.fix(s.inMax, 3)}\\le\\norm{g}_T = ${v.fix(s.rimMax, 3)}$${s.hol ? ' — for holomorphic $f$ every $P+Qf$ is holomorphic, and (b) is the maximum modulus theorem.' : ' for this $\\lambda$; try another.'}`;
          return `$g = P+Qf$ with $${s.E.PQ}$. ${verdict} $\\;$ At $a$: $f(a) = ${c(s.fa)}$ vs $P[f](a) = ${c(s.pfa)}$; $\\;af(a) = ${c(s.afa)}$ vs $P[\\zeta f](a) = ${c(s.pzf)}$.`;
        });
      },
    },
  ],
};
