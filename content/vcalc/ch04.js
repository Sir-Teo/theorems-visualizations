// Vector Calculus — Chapter 4: Multiple integrals
// Part 1 (4.1–4.6): Riemann sums in the plane, Fubini, general regions, the mean value theorem, the Jacobian and the change of variables formula.
import {
  tn, tf, simpson, polyArea, logInts, hills, DEG, TAU,
} from './ch04.shared.js';

const PI = Math.PI;

export default {
  collection: 'vcalc',
  chapter: 4,
  title: 'Multiple integrals',
  summary: String.raw`Double and triple integrals add up a density over a region, and Fubini’s theorem lets us compute them one variable at a time. The change of variables formula, with the Jacobian determinant as a local area factor, turns awkward regions into rectangles; polar, cylindrical and spherical coordinates are the standard cases. Mass, centre of mass and moments of inertia are the classic uses.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Double integral as a limit of Riemann sums',
      statement: String.raw`Let $R=[a,b]\times[c,d]$ and let $f:R\to\R$ be bounded. For a partition of $R$ into $n\times n$ congruent rectangles $R_{ij}$ put
$$L_n=\sum_{i,j}\Bigl(\inf_{R_{ij}}f\Bigr)\,|R_{ij}|,\qquad U_n=\sum_{i,j}\Bigl(\sup_{R_{ij}}f\Bigr)\,|R_{ij}|.$$
$f$ is **Riemann integrable** on $R$ if $U_n-L_n\to0$; the common limit is the **double integral** $\iint_R f\,dA$. Every Riemann sum $\sum f(\xi_{ij})|R_{ij}|$ with sample points $\xi_{ij}\in R_{ij}$ is squeezed between $L_n$ and $U_n$. (The general definition uses arbitrary partitions into rectangles; refining the equal grid is the picture, and it gives the same limit for integrable $f$.) Continuous functions, and bounded functions that are discontinuous only along finitely many curves, are integrable.`,
      idea: String.raw`This is the one-variable construction of pma-6.1 with rectangles in place of intervals (pma-10.1 does it for $k$-cells). Lower sums only increase and upper sums only decrease under refinement, so they always bracket the answer. For a continuous $f$ on the compact rectangle, uniform continuity makes $\sup-\inf$ small on every small cell, so the gap $U_n-L_n$ is at most (oscillation)$\times$(area). If $f$ jumps along a curve, only the cells meeting the curve contribute to the gap, and there are $O(n)$ of them of area $1/n^2$, so the gap is $O(1/n)$.`,
      caption: String.raw`Choose a function on the unit square and drag the grid size $n$. The left panel shows $f$ as a colour map (or the step functions whose integrals are $L_n$ and $U_n$); cells where $f$ varies a lot are outlined in orange. The right panel plots the gap $U_n-L_n$ against $n$ on log axes with the guide $c/n$: smooth functions and jump functions both close like $1/n$, the smooth one with a smaller constant. Extrema in each cell are found on a $5\times5$ sub-grid, so they are accurate for these gently varying functions rather than exact suprema.`,
      deps: ['pma-10.1', 'pma-6.1'],
      refs: ['Marsden–Tromba §5.2'],
      tags: ['Riemann sums', 'integral', 'definition'],
      viz(v) {
        const FUNS = {
          smooth: { f: (x, y) => 1.1 + Math.sin(3 * x) * Math.cos(2.2 * y) + 0.4 * x * y, label: 'smooth wave' },
          peak: { f: (x, y) => 2 * Math.exp(-14 * ((x - 0.62) ** 2 + (y - 0.4) ** 2)), label: 'one sharp peak' },
          jump: { f: (x, y) => ((x - 0.5) ** 2 + (y - 0.5) ** 2 < 0.2 ? 1.6 : 0.3), label: 'jump along a circle' },
        };
        const sel = v.select('function', Object.entries(FUNS).map(([k, o]) => ({ value: k, label: o.label })), 'smooth');
        const show = v.select('show', [{ value: 'f', label: '$f$' }, { value: 'lo', label: 'lower steps' }, { value: 'up', label: 'upper steps' }], 'f');
        const nS = v.slider('grid size $n\\times n$', 1, 48, 8, { int: true });
        const S = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'x', ylabel: 'y', title: 'the function and its grid' });
        const G = v.stage({ x: [1, 48], y: [1e-3, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'n', title: 'gap $U_n-L_n$ against $n$' });
        const cache = {};
        const extrema = (f, n) => {
          const lo = [], hi = [], k = 5;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            let a = Infinity, b = -Infinity;
            for (let p = 0; p <= k; p++) for (let q = 0; q <= k; q++) { const z = f((i + p / k) / n, (j + q / k) / n); if (z < a) a = z; if (z > b) b = z; }
            lo.push(a); hi.push(b);
          }
          return { lo, hi };
        };
        const table = (key) => {
          if (cache[key]) return cache[key];
          const f = FUNS[key].f, T = { L: [], U: [] };
          for (let n = 1; n <= 48; n++) {
            const e = extrema(f, n);
            T.L[n] = e.lo.reduce((s, z) => s + z, 0) / (n * n); T.U[n] = e.hi.reduce((s, z) => s + z, 0) / (n * n);
          }
          let s = 0; const N = 400;
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) s += f((i + 0.5) / N, (j + 0.5) / N);
          T.I = s / (N * N);
          return (cache[key] = T);
        };
        let info = {};
        v.render(() => {
          const key = sel.value, f = FUNS[key].f, n = nS.value, T = table(key), e = extrema(f, n);
          const mode = show.value;
          const val = (x, y) => {
            if (mode === 'f') return f(x, y);
            const i = Math.min(n - 1, Math.floor(x * n)), j = Math.min(n - 1, Math.floor(y * n));
            return (mode === 'lo' ? e.lo : e.hi)[i * n + j];
          };
          S.heat(val, { range: [-0.3, 2.3], cmap: 'theme', color: 'accent', res: 3, rect: [0, 0, 1, 1], key: `${key}|${mode}|${mode === 'f' ? 0 : n}` });
          const mx = Math.max(...e.hi.map((h, i) => h - e.lo[i]));
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            if (e.hi[i * n + j] - e.lo[i * n + j] > 0.5 * mx && n <= 30) S.rect(i / n, j / n, (i + 1) / n, (j + 1) / n, { color: 'orange', width: 1.4, fill: false, alpha: 0.9 });
          }
          if (n <= 30) for (let k = 0; k <= n; k++) { S.line(k / n, 0, k / n, 1, { color: 'ink', alpha: 0.35, width: 0.8 }); S.line(0, k / n, 1, k / n, { color: 'ink', alpha: 0.35, width: 0.8 }); }
          const ns = Array.from({ length: 48 }, (_, i) => i + 1);
          const gap = ns.map((m) => T.U[m] - T.L[m]);
          G.path(ns.map((m, i) => [m, Math.max(gap[i], 1e-6)]), { color: 'accent', width: 2 });
          const c = gap[0] > 0 ? gap[0] : 1;
          G.path(ns.map((m) => [m, c / m]), { color: 'muted', dash: true, width: 1.2 });
          G.dot(n, Math.max(T.U[n] - T.L[n], 1e-6), { color: 'gold', r: 6 });
          G.text('guide $c/n$', 14, c / 14 * 1.5, { color: 'muted', size: 12 });
          info = { L: T.L[n], U: T.U[n], I: T.I, n };
        });
        v.readout(() => `$L_n=${tf(info.L, 4)}\\le \\iint f\\,dA\\approx${tf(info.I, 4)}\\le U_n=${tf(info.U, 4)}$\n$n=${info.n}$: gap $U_n-L_n=${tf(info.U - info.L, 4)}$`);
      },
    },

    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Fubini’s theorem',
      statement: String.raw`Let $R=[a,b]\times[c,d]$ and let $f$ be continuous on $R$ (more generally bounded and integrable). Then the two iterated integrals exist and equal the double integral:
$$\iint_R f\,dA=\int_a^b\!\Bigl(\int_c^d f(x,y)\,dy\Bigr)dx=\int_c^d\!\Bigl(\int_a^b f(x,y)\,dx\Bigr)dy.$$
Geometrically, the volume under the graph is the integral of the slice areas $A(x)=\int_c^d f(x,y)\,dy$. The hypothesis cannot be dropped: if $f$ is not integrable the two iterated integrals may both exist and differ. For $f(x,y)=\dfrac{x^2-y^2}{(x^2+y^2)^2}$ on $(0,1]^2$ one gets $\int_0^1\!\int_0^1 f\,dy\,dx=\tfrac\pi4$ but $\int_0^1\!\int_0^1 f\,dx\,dy=-\tfrac\pi4$.`,
      idea: String.raw`For a partition, the lower sum for $f$ is at most the lower sum of the slice function $A$, which is at most its upper sum, which is at most the upper sum of $f$ (pma-10.2 gives the order-independence for continuous $f$ by the same squeeze). Since the outer two squeeze to the double integral (4.1), so do the middle ones. In the counterexample $f$ is unbounded near the origin and its positive and negative parts each have infinite integral; the answer then depends on the order in which $\infty-\infty$ is resolved, and the two iterated integrals are the two ways: the slice functions are $A(x)=\frac1{1+x^2}$ and $B(y)=-\frac1{1+y^2}$.`,
      caption: String.raw`Left: the integrand on the unit square. Drag the gold point: the vertical line is the slice $x=a$ and the horizontal line the slice $y=b$. Middle: the slice areas $A(x)$ with the part up to $a$ shaded; right: $B(y)$. For the smooth function the two totals agree. Switch to the classic function and the totals are $\pi/4$ and $-\pi/4$. Cutting a square of side $\delta$ out of the corner makes $f$ bounded and Fubini applies again: both orders give $0$ for every $\delta>0$ (the picture is antisymmetric), yet they jump to $\pm\pi/4$ as $\delta\to0$.`,
      deps: ['vcalc-4.1', 'pma-10.2'],
      refs: ['Marsden–Tromba §5.2'],
      credit: 'G. Fubini, 1907 (“Sugli integrali multipli”, Rend. Accad. Lincei)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fubini%27s_theorem' },
      tags: ['iterated integrals', 'slicing', 'counterexample'],
      viz(v) {
        const smooth = (x, y) => (x + 0.4) * Math.sin(3 * y) + 0.5;
        const classic = (x, y) => ((x * x - y * y) / (x * x + y * y) ** 2);
        const sel = v.select('integrand', [{ value: 'smooth', label: 'smooth $f$' }, { value: 'classic', label: '$\\frac{x^2-y^2}{(x^2+y^2)^2}$' }], 'smooth');
        const cut = v.slider('corner cut-out $\\delta$', 0, 0.5, 0, { step: 0.01 });
        const S = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'x', ylabel: 'y', title: 'integrand and slices' });
        const SA = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'x', title: '$A(x)=\\int f\\,dy$' });
        const SB = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'y', title: '$B(y)=\\int f\\,dx$' });
        const P = S.handle(0.55, 0.4, { color: 'gold', label: '(a,b)', constrain: { x: [0.005, 1], y: [0.005, 1] } });
        v.onCleanup(() => {});
        const A = (x, d) => {
          if (sel.value === 'smooth') return simpson((y) => smooth(x, y), 0, 1, 60);
          const base = 1 / (1 + x * x);
          return d > 0 && x < d ? base - d / (x * x + d * d) : base;
        };
        const B = (y, d) => {
          if (sel.value === 'smooth') return simpson((x) => smooth(x, y), 0, 1, 60);
          return -A(y, d);
        };
        let info = {};
        v.render(() => {
          const classicOn = sel.value === 'classic', d = classicOn ? cut.value : 0;
          cut.el.hidden = !classicOn;
          const f = classicOn ? (x, y) => (x < d && y < d ? NaN : classic(x, y)) : smooth;
          S.heat(f, { range: classicOn ? [-4, 4] : [-0.7, 1.7], cmap: 'theme-diverging', res: 3, rect: [0, 0, 1, 1], key: `${sel.value}|${d}` });
          if (classicOn && d > 0) S.rect(0, 0, d, d, { color: 'red', fill: 'red', fillAlpha: 0.25, width: 1.4 });
          S.vline(P.x, { color: 'orange', width: 2 }); S.hline(P.y, { color: 'green', width: 2 });
          const N = 400, xs = Array.from({ length: N + 1 }, (_, i) => (i + 0.5 * (i === 0)) / N);
          const as = xs.map((x) => A(Math.max(x, 1e-4), d)), bs = xs.map((x) => B(Math.max(x, 1e-4), d));
          const lim = (arr) => { const m = Math.max(...arr.map(Math.abs)); return Math.min(Math.max(m * 1.1, 0.5), 25); };
          const L = Math.max(lim(as), lim(bs));
          SA.setView([0, 1], [-L, L]); SB.setView([0, 1], [-L, L]);
          SA.hline(0, { color: 'muted', width: 1 });
          SA.fn((x) => A(Math.max(x, 1e-4), d), { domain: [0, 1], n: 500, color: 'orange', width: 2, fill: true, base: 0 });
          SA.between((x) => (x <= P.x ? A(Math.max(x, 1e-4), d) : 0), () => 0, 0, 1, { fill: 'orange', fillAlpha: 0.25 });
          SA.vline(P.x, { color: 'orange', dash: true });
          SB.hline(0, { color: 'muted', width: 1 });
          SB.fn((y) => B(Math.max(y, 1e-4), d), { domain: [0, 1], n: 500, color: 'green', width: 2, fill: true, base: 0 });
          SB.between((y) => (y <= P.y ? B(Math.max(y, 1e-4), d) : 0), () => 0, 0, 1, { fill: 'green', fillAlpha: 0.25 });
          SB.vline(P.y, { color: 'green', dash: true });
          const tot = (g) => simpson(g, 0, 1, 4000);
          info = { Ix: tot((x) => A(Math.max(x, 1e-6), d)), Iy: tot((y) => B(Math.max(y, 1e-6), d)), a: A(P.x, d), b: B(P.y, d), d };
        });
        v.readout(() => `$\\int_0^1\\!\\int_0^1 f\\,dy\\,dx=\\int_0^1 A=${tf(info.Ix, 4)}$ ; $\\int_0^1\\!\\int_0^1 f\\,dx\\,dy=\\int_0^1 B=${tf(info.Iy, 4)}$\n$A(${tf(P.x, 2)})=${tf(info.a, 3)}$, $B(${tf(P.y, 2)})=${tf(info.b, 3)}$ ; $\\pi/4=${tf(PI / 4, 4)}$`);
      },
    },

    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Method',
      name: 'Integrating over general regions',
      statement: String.raw`Let $f$ be continuous on a bounded region $D\subset\R^2$ whose boundary is a finite union of curves. If $D$ is **vertically simple**, $D=\{a\le x\le b,\ g(x)\le y\le h(x)\}$ with $g\le h$ continuous, then
$$\iint_D f\,dA=\int_a^b\!\int_{g(x)}^{h(x)}f(x,y)\,dy\,dx.$$
If $D$ is **horizontally simple**, $D=\{c\le y\le d,\ l(y)\le x\le r(y)\}$, then $\iint_D f\,dA=\int_c^d\!\int_{l(y)}^{r(y)}f\,dx\,dy$. A more complicated $D$ is cut into finitely many simple pieces and the integrals are added. The two descriptions of a region give different limits of integration but the same number; to see why, extend $f$ by $0$ outside $D$ and apply Fubini (4.2) on a rectangle containing $D$.`,
      idea: String.raw`Extend $f$ by zero to $\tilde f=f\cdot\mathbf 1_D$ on a rectangle $R\supset D$. $\tilde f$ is bounded and discontinuous only along $\partial D$, a set of zero area, so it is integrable (4.1) and Fubini (4.2) applies in either order. Integrating $\tilde f$ in $y$ over the whole of $[c,d]$ leaves exactly $\int_{g(x)}^{h(x)}f\,dy$ because $\tilde f=0$ outside the segment; the same in $x$ for the horizontal order. The practical work is turning a picture into limits: sweep a line across the region and record where it enters and leaves.`,
      caption: String.raw`Pick a region and an integrand. Drag the orange slider to sweep a vertical line (type I) or the green one to sweep a horizontal line (type II); the highlighted chords are the inner integration ranges. In the parabola–line region a horizontal sweep has one chord, but its left end switches from the parabola to the line at height $\tfrac14$, so the outer integral must be split there; the wavy band is cut into several chords at some heights. Both iterated integrals give the same number (to numerical accuracy).`,
      deps: ['vcalc-4.2'],
      refs: ['Marsden–Tromba §5.3'],
      tags: ['regions', 'limits of integration', 'iterated integrals'],
      viz(v) {
        const REG = {
          para: { label: 'parabola and line', g: (x) => x * x, h: (x) => x + 0.75, x: [-0.5, 1.5] },
          disc: { label: 'disc', g: (x) => -Math.sqrt(Math.max(0, 1 - x * x)), h: (x) => Math.sqrt(Math.max(0, 1 - x * x)), x: [-1, 1] },
          wave: { label: 'wavy band', g: (x) => -0.35 + 0.35 * Math.sin(4 * x), h: (x) => 1.1 + 0.35 * Math.cos(3.2 * x), x: [-1.3, 1.3] },
        };
        const FUN = { one: { f: () => 1, label: '$f=1$ (area)' }, xy: { f: (x, y) => x + 0.5 * y * y, label: '$f=x+\\tfrac12y^2$' } };
        const reg = v.select('region', Object.entries(REG).map(([k, o]) => ({ value: k, label: o.label })), 'para');
        const fun = v.select('integrand', Object.entries(FUN).map(([k, o]) => ({ value: k, label: o.label })), 'one');
        const sx = v.slider('vertical sweep $x$', -1.3, 1.5, 0.4, { step: 0.01 });
        const sy = v.slider('horizontal sweep $y$', -1.1, 2.3, 0.5, { step: 0.01 });
        const S = v.stage({ x: [-1.6, 1.8], y: [-1.3, 2.4], equal: true, axes: true, height: 400, weight: 1.3 });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 400, weight: 0.8, minWidth: 240, xlabel: 'sweep position', title: 'inner integral along the sweep' });
        const cache = {};
        const chordsAt = (R, y) => {
          const ins = (x) => y >= R.g(x) && y <= R.h(x);
          // bisect between an outside and an inside sample to find the boundary
          const edge = (a, b, leaving) => {
            let o = leaving ? b : a, n = leaving ? a : b;
            for (let k = 0; k < 40; k++) { const m = (o + n) / 2; if (ins(m)) n = m; else o = m; }
            return n;
          };
          // intervals of x in the region at height y, by scanning
          const [x0, x1] = R.x, N = 600, out = [];
          let start = null;
          for (let i = 0; i <= N; i++) {
            const x = x0 + ((x1 - x0) * i) / N, inside = y >= R.g(x) && y <= R.h(x);
            if (inside && start === null) start = i === 0 ? x : edge(x0 + ((x1 - x0) * (i - 1)) / N, x, false);
            if (!inside && start !== null) { out.push([start, edge(x0 + ((x1 - x0) * (i - 1)) / N, x, true)]); start = null; }
          }
          if (start !== null) out.push([start, x1]);
          return out;
        };
        const tables = (rk, fk) => {
          const key = rk + fk;
          if (cache[key]) return cache[key];
          const R = REG[rk], f = FUN[fk].f;
          const inner1 = (x) => simpson((y) => f(x, y), R.g(x), R.h(x), 80);
          const I1 = simpson(inner1, R.x[0], R.x[1], 400);
          let ymin = Infinity, ymax = -Infinity;
          for (let i = 0; i <= 400; i++) { const x = R.x[0] + ((R.x[1] - R.x[0]) * i) / 400; ymin = Math.min(ymin, R.g(x)); ymax = Math.max(ymax, R.h(x)); }
          const inner2 = (y) => chordsAt(R, y).reduce((s, [a, b]) => s + simpson((x) => f(x, y), a, b, 40), 0);
          const M = 600; let I2 = 0;
          for (let i = 0; i < M; i++) I2 += inner2(ymin + ((ymax - ymin) * (i + 0.5)) / M) * ((ymax - ymin) / M);
          return (cache[key] = { I1, I2, ymin, ymax, inner1, inner2 });
        };
        let info = {};
        v.render(() => {
          const R = REG[reg.value], f = FUN[fun.value].f, T = tables(reg.value, fun.value);
          const xa = R.x[0], xb = R.x[1];
          S.between(R.g, R.h, xa, xb, { fill: 'accent', fillAlpha: 0.14 });
          S.fn(R.g, { domain: [xa, xb], color: 'accent', width: 2 }); S.fn(R.h, { domain: [xa, xb], color: 'accent', width: 2 });
          S.segment([xa, R.g(xa)], [xa, R.h(xa)], { color: 'accent', width: 2 }); S.segment([xb, R.g(xb)], [xb, R.h(xb)], { color: 'accent', width: 2 });
          const x = Math.min(xb, Math.max(xa, sx.value));
          S.segment([x, R.g(x)], [x, R.h(x)], { color: 'orange', width: 4 });
          S.dot(x, R.g(x), { color: 'orange', r: 4 }); S.dot(x, R.h(x), { color: 'orange', r: 4 });
          S.vline(sx.value, { color: 'orange', width: 1, dash: true, alpha: 0.5 });
          const ch = chordsAt(R, sy.value);
          for (const [a, b] of ch) S.segment([a, sy.value], [b, sy.value], { color: 'green', width: 4 });
          S.hline(sy.value, { color: 'green', width: 1, dash: true, alpha: 0.5 });
          // inner integral plots
          const n1 = 200, pts1 = Array.from({ length: n1 + 1 }, (_, i) => { const t = xa + ((xb - xa) * i) / n1; return [t, T.inner1(t)]; });
          const pts2 = Array.from({ length: n1 + 1 }, (_, i) => { const t = T.ymin + ((T.ymax - T.ymin) * i) / n1; return [t, T.inner2(t)]; });
          const top = Math.max(...pts1.map((p) => p[1]), ...pts2.map((p) => p[1]), 0.1) * 1.1;
          const bot = Math.min(...pts1.map((p) => p[1]), ...pts2.map((p) => p[1]), 0) * 1.1;
          const lo = Math.min(xa, T.ymin), hi = Math.max(xb, T.ymax);
          Q.setView([lo, hi], [bot, top]);
          Q.path(pts1, { color: 'orange', width: 2 }); Q.path(pts2, { color: 'green', width: 2 });
          Q.dot(x, T.inner1(x), { color: 'orange', r: 5 }); Q.dot(sy.value, T.inner2(sy.value), { color: 'green', r: 5 });
          Q.hline(0, { color: 'muted' });
          info = { I1: T.I1, I2: T.I2, pieces: ch.length, inner1: T.inner1(x), inner2: T.inner2(sy.value) };
        });
        v.legend([['orange', 'vertical sweep $\\int f\\,dy$ vs $x$'], ['green', 'horizontal sweep $\\int f\\,dx$ vs $y$']]);
        v.readout(() => `vertical order: $\\int_a^b\\!\\int_g^h f\\,dy\\,dx=${tf(info.I1, 4)}$ ; horizontal order: $\\int\\!\\int f\\,dx\\,dy=${tf(info.I2, 4)}$\nthe horizontal line meets the region in ${info.pieces} chord${info.pieces === 1 ? '' : 's'}`);
      },
    },

    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Mean value theorem for integrals',
      statement: String.raw`Let $D\subset\R^2$ be a compact, connected region with positive area $|D|$ and let $f$ be continuous on $D$. Then there is a point $p\in D$ with
$$f(p)=\frac{1}{|D|}\iint_D f\,dA=:\bar f.$$
So the average value of a continuous function over a connected region is actually attained. Connectedness is essential: on two separate discs $D_{\pm}$ centred at $(\pm1.2,0)$, the function $f(x,y)=x$ has average $0$ but never takes the value $0$ on $D$.`,
      idea: String.raw`$f$ is continuous on a compact set, so it has a minimum $m$ and a maximum $M$ (pma-4.16), and $m|D|\le\iint_D f\,dA\le M|D|$ gives $m\le\bar f\le M$. A connected set is carried by a continuous function onto an interval (pma-4.22), so $f(D)$ contains the whole interval $[m,M]\ni\bar f$ and some point of $D$ takes the value $\bar f$. The same argument works for 1-D intervals, where it is the usual mean value theorem for integrals.`,
      caption: String.raw`Left: $f$ as a colour map over the region; the green curve is the level set $\{f=\bar f\}$ inside $D$, and the gold point can be dragged anywhere to compare $f(p)$ with $\bar f$. Right: the distribution of the values $f$ takes on $D$ (area-weighted histogram) with its mean marked. Switch to the two-disc region with $f=x$: the mean is $0$, but the histogram has a gap around $0$ and the level set is empty, so there is no point $p$.`,
      deps: ['vcalc-4.1', 'pma-4.23'],
      refs: ['Marsden–Tromba ch. 5'],
      tags: ['average value', 'connectedness', 'intermediate value'],
      viz(v) {
        const CASES = {
          one: { label: 'one disc, wavy $f$', inD: (x, y) => x * x + y * y <= 1.0, f: (x, y) => 0.6 * x + 0.4 * y + 0.5 * Math.sin(2.2 * x) * Math.cos(1.6 * y) + 0.35 * x * x, box: [-1.1, 1.1] },
          two: { label: 'two discs, $f=x$', inD: (x, y) => (x - 1.2) ** 2 + y * y <= 0.36 || (x + 1.2) ** 2 + y * y <= 0.36, f: (x) => x, box: [-1.9, 1.9] },
        };
        const sel = v.select('case', Object.entries(CASES).map(([k, o]) => ({ value: k, label: o.label })), 'one');
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.1, 1.1], equal: true, axes: 'box', gutter: true, height: 340, weight: 1.3, xlabel: 'x', ylabel: 'y', title: 'level set of $f$ at its average' });
        const H = v.stage({ x: [-1.5, 1.5], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 250, xlabel: 'value of f', title: 'values taken by $f$ on $D$' });
        const P = S.handle(0.3, 0.2, { color: 'gold', label: 'p' });
        const cache = {};
        const stats = (k) => {
          if (cache[k]) return cache[k];
          const C = CASES[k], N = 220, vals = [];
          let sum = 0, area = 0, mn = Infinity, mx = -Infinity;
          const [b0, b1] = [-1.9, 1.9], hx = (b1 - b0) / N, hy = 2.2 / N;
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            const x = b0 + (i + 0.5) * hx, y = -1.1 + (j + 0.5) * hy;
            if (C.inD(x, y)) { const z = C.f(x, y); vals.push(z); sum += z; area++; mn = Math.min(mn, z); mx = Math.max(mx, z); }
          }
          const A = area * hx * hy;
          const bw = (mx - mn) / 40, cnt = new Array(41).fill(0); for (const z of vals) cnt[Math.min(40, Math.floor((z - mn) / bw))]++;
          return (cache[k] = { mean: sum / area, area: A, vals, mn, mx, dmax: (Math.max(...cnt) / (vals.length * bw)) * 1.15 });
        };
        let info = {};
        v.render(() => {
          const C = CASES[sel.value], T = stats(sel.value), mean = T.mean;
          S.heat((x, y) => (C.inD(x, y) ? C.f(x, y) : NaN), { range: [-Math.max(Math.abs(T.mn), Math.abs(T.mx)), Math.max(Math.abs(T.mn), Math.abs(T.mx))], cmap: 'theme-diverging', res: 3, key: sel.value });
          S.contour((x, y) => (C.inD(x, y) ? C.f(x, y) : NaN), [mean], { color: 'green', width: 3, res: 220 });
          const inside = C.inD(P.x, P.y);
                    H.setView([T.mn - 0.1, T.mx + 0.1], [0, T.dmax]);
          H.hist(T.vals, { bins: 40, range: [T.mn, T.mx], density: true, color: 'accent', fillAlpha: 0.35 });
          H.vline(mean, { color: 'green', width: 2.5 });
          H.vline(T.mn, { color: 'red', dash: true, width: 1.2 }); H.vline(T.mx, { color: 'red', dash: true, width: 1.2 });
          if (inside) H.vline(C.f(P.x, P.y), { color: 'gold', width: 2 });
          info = { mean, fp: inside ? C.f(P.x, P.y) : NaN, mn: T.mn, mx: T.mx, A: T.area };
        });
        v.legend([['green', 'average $\\bar f$ and its level set'], ['gold', '$f(p)$'], ['red', 'min and max of $f$ on $D$', { dash: true }]]);
        v.readout(() => `$|D|=${tf(info.A, 3)}$, $\\bar f=\\frac1{|D|}\\iint_D f\\,dA=${tf(info.mean, 4)}$, range $[${tf(info.mn, 2)},\\,${tf(info.mx, 2)}]$\n$f(p)=${isNaN(info.fp) ? '\\text{(p outside D)}' : tf(info.fp, 4)}$`);
        v.onCleanup(() => {});
      },
    },

    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Jacobian as a local area factor',
      statement: String.raw`Let $\mathbf F:U\to\R^2$, $U\subset\R^2$ open, be $C^1$, $p\in U$, and let $Q_h$ be the square of side $h$ with corner $p$ (or centred at $p$). Then
$$\lim_{h\to0}\frac{\operatorname{area}\,\mathbf F(Q_h)}{h^2}=\bigl|\det D\mathbf F(p)\bigr|=\Bigl|\frac{\partial(x,y)}{\partial(u,v)}\Bigr|(p),$$
where $\mathbf F(u,v)=(x,y)$. In $\R^n$ the same holds with volumes. So the Jacobian determinant is the local factor by which $\mathbf F$ scales area, with sign recording whether orientation is preserved.`,
      idea: String.raw`Near $p$ the map is its linearisation up to $o(h)$: $\mathbf F(p+\mathbf s)=\mathbf F(p)+D\mathbf F(p)\mathbf s+o(|\mathbf s|)$ (pma-9.38 and differentiability). The linear map $D\mathbf F(p)$ takes the square to a parallelogram of area $|\det D\mathbf F(p)|\,h^2$ (rca-2.23: a linear map scales area by $|\det|$). The boundary of the true image lies within $o(h)$ of that parallelogram's boundary, which changes the area by $o(h^2)$ since the perimeter is $O(h)$. Where $\det D\mathbf F(p)=0$ the image collapses to a sliver and the ratio tends to $0$.`,
      caption: String.raw`Left: the $(u,v)$ plane with a small square you can drag (gold handle) and resize ($h$). Middle: its image under the chosen map (orange, curved) and the parallelogram spanned by the two columns of $D\mathbf F$ (dashed). Right: the ratio area/$h^2$ plotted for all $h$ on a log axis, tending to the green line $|\det D\mathbf F|$ as $h\to0$. Try the polar-type map $(u\cos v,u\sin v)$ near $u=0$ and the squaring map near the origin, where the Jacobian vanishes. The image area is computed by the shoelace formula on a polygon with 120 boundary points.`,
      deps: ['pma-9.38', 'rca-2.23'],
      refs: ['Marsden–Tromba §6.1'],
      tags: ['Jacobian', 'area', 'linearisation'],
      viz(v) {
        const MAPS = {
          polar: { label: '$(u\\cos v,\\,u\\sin v)$', F: (u, w) => [u * Math.cos(w), u * Math.sin(w)] },
          quad: { label: '$(u+0.3v^2,\\,v+0.3u^2)$', F: (u, w) => [u + 0.3 * w * w, w + 0.3 * u * u] },
          sq: { label: '$(u^2-v^2,\\,2uv)$', F: (u, w) => [u * u - w * w, 2 * u * w] },
          wave: { label: '$(u+0.3\\sin2v,\\,v+0.3\\sin2u)$', F: (u, w) => [u + 0.3 * Math.sin(2 * w), w + 0.3 * Math.sin(2 * u)] },
        };
        const sel = v.select('map $\\mathbf F$', Object.entries(MAPS).map(([k, o]) => ({ value: k, label: o.label })), 'quad');
        const hS = v.slider('side $h$', 0.01, 1.2, 0.5, { log: true, sig: 2 });
        const U = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: true, height: 330, weight: 1, minWidth: 240, title: '$(u,v)$ plane' });
        const X = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 330, weight: 1, minWidth: 240, title: 'image in the $(x,y)$ plane' });
        const Rt = v.stage({ x: [0.01, 1.2], y: [0, 3], xlog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 240, xlabel: 'side h', title: 'area of image / $h^2$' });
        const P = U.handle(0.4, 0.3, { color: 'gold', label: 'p', constrain: { x: [-1.5, 1.5], y: [-1.5, 1.5] } });
        const jac = (F, u, w) => {
          const e = 1e-5, a = F(u + e, w), b = F(u - e, w), c = F(u, w + e), d = F(u, w - e);
          const J = [[(a[0] - b[0]) / (2 * e), (c[0] - d[0]) / (2 * e)], [(a[1] - b[1]) / (2 * e), (c[1] - d[1]) / (2 * e)]];
          return J;
        };
        const img = (F, u, w, h) => {
          const pts = [], m = 30;
          for (let i = 0; i < m; i++) pts.push(F(u + (h * i) / m, w));
          for (let i = 0; i < m; i++) pts.push(F(u + h, w + (h * i) / m));
          for (let i = 0; i < m; i++) pts.push(F(u + h - (h * i) / m, w + h));
          for (let i = 0; i < m; i++) pts.push(F(u, w + h - (h * i) / m));
          return pts;
        };
        let info = {};
        v.render(() => {
          const F = MAPS[sel.value].F, u = P.x, w = P.y, h = hS.value;
          U.poly([[u, w], [u + h, w], [u + h, w + h], [u, w + h]], { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 2 });
          for (let k = -4; k <= 4; k++) { U.line(k * 0.4, -1.6, k * 0.4, 1.6, { color: 'grid', width: 1 }); U.line(-1.6, k * 0.4, 1.6, k * 0.4, { color: 'grid', width: 1 }); }
          for (let k = -4; k <= 4; k++) {
            X.path(Array.from({ length: 41 }, (_, i) => F(k * 0.4, -1.6 + (3.2 * i) / 40)), { color: 'grid', width: 1 });
            X.path(Array.from({ length: 41 }, (_, i) => F(-1.6 + (3.2 * i) / 40, k * 0.4)), { color: 'grid', width: 1 });
          }
          const im = img(F, u, w, h);
          X.poly(im, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 2 });
          const J = jac(F, u, w), p0 = F(u, w);
          const par = [p0, [p0[0] + J[0][0] * h, p0[1] + J[1][0] * h], [p0[0] + (J[0][0] + J[0][1]) * h, p0[1] + (J[1][0] + J[1][1]) * h], [p0[0] + J[0][1] * h, p0[1] + J[1][1] * h]];
          X.path(par, { close: true, color: 'blue', dash: true, width: 1.8 });
          X.arrow(p0[0], p0[1], par[1][0], par[1][1], { color: 'blue' }); X.arrow(p0[0], p0[1], par[3][0], par[3][1], { color: 'purple' });
          const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
          const hs = Array.from({ length: 70 }, (_, i) => 0.01 * Math.pow(120, i / 69));
          Rt.setView([0.01, 1.2], [0, Math.max(3, Math.abs(det) * 1.5)]);
          Rt.hline(Math.abs(det), { color: 'green', width: 2 });
          Rt.path(hs.map((q) => [q, Math.abs(polyArea(img(F, u, w, q))) / (q * q)]), { color: 'orange', width: 2 });
          const ar = Math.abs(polyArea(im));
          Rt.dot(h, ar / (h * h), { color: 'gold', r: 6 });
          info = { det, ar, h, ratio: ar / (h * h) };
        });
        v.legend([['orange', 'image of the square'], ['blue', 'parallelogram $D\\mathbf F\\cdot Q_h$', { dash: true }], ['green', '$|\\det D\\mathbf F(p)|$']]);
        v.readout(() => `area $\\mathbf F(Q_h)=${tf(info.ar, 4)}$, $h^2=${tf(info.h * info.h, 4)}$, ratio $=${tf(info.ratio, 4)}$ ; $|\\det D\\mathbf F(p)|=${tf(Math.abs(info.det), 4)}$`);
      },
    },

    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Change of variables formula',
      statement: String.raw`Let $\mathbf T:D^*\to D$ be a $C^1$ map of a bounded region $D^*\subset\R^2$ (open, with boundary of zero area) onto $D$ that is one-to-one with $\det D\mathbf T\neq0$ (it may fail on a set of zero area, such as the boundary or the origin of polar coordinates). If $f$ is continuous and bounded on $D$, then
$$\iint_D f(x,y)\,dx\,dy=\iint_{D^*} f\bigl(\mathbf T(u,v)\bigr)\,\Bigl|\frac{\partial(x,y)}{\partial(u,v)}\Bigr|\,du\,dv.$$
The same holds in $\R^n$. The absolute value of the Jacobian determinant is essential: omitting it computes the integral of the wrong quantity.`,
      idea: String.raw`Partition $D^*$ into small rectangles. By 4.5 the image of each is a curved cell whose area is $|J|\,\Delta u\,\Delta v$ up to a relative error that tends to $0$ uniformly. A Riemann sum for $\iint_D f$ built from those image cells is therefore a Riemann sum for the right-hand integrand, and both sides converge. Making this rigorous (pma-10.9, via the local inverse-function and partition-of-unity argument) takes care at the places where the Jacobian vanishes, which is why they must be a set of zero area.`,
      caption: String.raw`The map is applied to a rectangle in the $(u,v)$ plane (left) giving the curved grid on the right. Raise $n$ to refine the grid. Below, two Riemann sums of $f$ are compared with the true integral of $f$ over the image (dotted): the one weighted by the Jacobian $|J|\,\Delta u\Delta v$ converges to it, the unweighted sum $\sum f\,\Delta u\Delta v$ does not converge to it. Cell shading is proportional to the Jacobian, i.e. to the true area of each image cell. The "true value" is a $400\times400$ weighted sum, accurate to about the digits shown.`,
      deps: ['vcalc-4.5', 'pma-10.9'],
      refs: ['Marsden–Tromba §6.2'],
      credit: 'Euler, Lagrange and Jacobi (18th–19th century); the Jacobian form is Jacobi’s, 1841',
      verify: true,
      tags: ['change of variables', 'Jacobian', 'Riemann sums'],
      viz(v) {
        const MAPS = {
          polar: { label: 'polar', T: (u, w) => [u * Math.cos(w), u * Math.sin(w)], J: (u) => u, u: [0.5, 2], v: [0.2, 2.3] },
          para: { label: 'parabolic', T: (u, w) => [u * u - w * w, 2 * u * w], J: (u, w) => 4 * (u * u + w * w), u: [0.6, 1.5], v: [0.3, 1.2] },
          shear: { label: 'linear shear', T: (u, w) => [u + 0.6 * w, 0.8 * w], J: () => 0.8, u: [0, 1.6], v: [0, 1.2] },
        };
        const sel = v.select('map', Object.entries(MAPS).map(([k, o]) => ({ value: k, label: o.label })), 'polar');
        const fsel = v.select('integrand', [{ value: 'one', label: '$f=1$ (area)' }, { value: 'r2', label: '$f=x^2+y^2+1$' }], 'r2');
        const nS = v.slider('cells per side $n$', 2, 40, 6, { int: true });
        const U = v.stage({ x: [0, 2.6], y: [0, 2.6], equal: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 240, xlabel: 'u', ylabel: 'v', title: '$D^*$: the rectangle' });
        const X = v.stage({ x: [-3, 3], y: [-1, 3.2], equal: true, axes: true, height: 340, weight: 1.1, minWidth: 240, title: '$D$: the image' });
        const E = v.stage({ x: [2, 40], y: [1e-6, 5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 240, xlabel: 'n', title: 'relative error of the sums' });
        const cache = {};
        const sums = (key, fk, n) => {
          const M = MAPS[key], f = fk === 'one' ? () => 1 : (x, y) => x * x + y * y + 1;
          const [u0, u1] = M.u, [v0, v1] = M.v, du = (u1 - u0) / n, dv = (v1 - v0) / n;
          let sJ = 0, sN = 0;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const u = u0 + (i + 0.5) * du, w = v0 + (j + 0.5) * dv, p = M.T(u, w), fv = f(p[0], p[1]);
            sJ += fv * M.J(u, w) * du * dv; sN += fv * du * dv;
          }
          return { sJ, sN };
        };
        const truth = (key, fk) => { const k = key + fk; return cache[k] || (cache[k] = sums(key, fk, 400).sJ); };
        let info = {};
        v.render(() => {
          const key = sel.value, M = MAPS[key], n = nS.value, [u0, u1] = M.u, [v0, v1] = M.v;
          const I = truth(key, fsel.value), s = sums(key, fsel.value, n);
          const du = (u1 - u0) / n, dv = (v1 - v0) / n;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const a = u0 + i * du, b = u0 + (i + 1) * du, c = v0 + j * dv, d = v0 + (j + 1) * dv;
            const t = Math.min(1, M.J((a + b) / 2, (c + d) / 2) / (key === 'para' ? 7 : key === 'polar' ? 2 : 0.8));
            const col = v.mix('panel', 'orange', 0.15 + 0.7 * t);
            if (n <= 20) U.poly([[a, c], [b, c], [b, d], [a, d]], { fill: col, fillAlpha: 1, color: 'ink', width: 0.7 });
            else U.poly([[a, c], [b, c], [b, d], [a, d]], { fill: col, fillAlpha: 1, stroke: false });
            const q = 3, cell = [];
            for (let k = 0; k < q; k++) cell.push(M.T(a + (du * k) / q, c));
            for (let k = 0; k < q; k++) cell.push(M.T(b, c + (dv * k) / q));
            for (let k = 0; k < q; k++) cell.push(M.T(b - (du * k) / q, d));
            for (let k = 0; k < q; k++) cell.push(M.T(a, d - (dv * k) / q));
            if (n <= 20) X.poly(cell, { fill: col, fillAlpha: 1, color: 'ink', width: 0.7 });
            else X.poly(cell, { fill: col, fillAlpha: 1, stroke: false });
          }
          const ns = logInts(40, 18).filter((q) => q >= 2);
          const rel = (a) => Math.abs(a - I) / Math.abs(I);
          E.path(ns.map((q) => [q, Math.max(rel(sums(key, fsel.value, q).sJ), 1e-6)]), { color: 'green', width: 2 });
          E.path(ns.map((q) => [q, Math.max(rel(sums(key, fsel.value, q).sN), 1e-6)]), { color: 'red', width: 2 });
          E.dot(n, Math.max(rel(s.sJ), 1e-6), { color: 'green', r: 5 }); E.dot(n, Math.max(rel(s.sN), 1e-6), { color: 'red', r: 5 });
          info = { I, sJ: s.sJ, sN: s.sN, n };
        });
        v.legend([['green', 'with Jacobian: $\\sum f\\,|J|\\,\\Delta u\\Delta v$'], ['red', 'without: $\\sum f\\,\\Delta u\\Delta v$']]);
        v.readout(() => `$n=${info.n}$: $\\iint_D f\\,dA\\approx${tf(info.I, 4)}$ ; with $|J|$: $${tf(info.sJ, 4)}$ ; without: $${tf(info.sN, 4)}$`);
      },
    },
  ],
};
