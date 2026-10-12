// Rudin, Principles of Mathematical Analysis — Chapter 10: Integration of Differential Forms
// Part 1 (10.1–10.7): integration over k-cells, supports, primitive mappings, flips.

/** Diverging colour ramp that fades to the panel colour at 0 (works in light and dark). t in [-1, 1]. */
function divRGB(v, pos = 'blue', neg = 'orange', gain = 0.85) {
  const P = v.rgb('panel'), A = v.rgb(pos), B = v.rgb(neg);
  return (t) => {
    if (!isFinite(t)) return null;
    const w = Math.pow(Math.min(1, Math.abs(t)), 0.75) * gain, C = t >= 0 ? A : B;
    return [P[0] + (C[0] - P[0]) * w, P[1] + (C[1] - P[1]) * w, P[2] + (C[2] - P[2]) * w];
  };
}
const themeKey = (v) => v.color('panel') + v.color('blue');
/** Numerical partial derivatives of a map F: R^2 -> R^2 at (x, y): [[D1F1, D2F1], [D1F2, D2F2]]. */
function jac2(F, x, y, h = 1e-5) {
  const a = F(x + h, y), b = F(x - h, y), c = F(x, y + h), d = F(x, y - h);
  return [[(a[0] - b[0]) / (2 * h), (c[0] - d[0]) / (2 * h)], [(a[1] - b[1]) / (2 * h), (c[1] - d[1]) / (2 * h)]];
}

export default {
  book: 'pma',
  chapter: 10,
  title: 'Integration of Differential Forms',
  summary: String.raw`Rudin builds integration in $\R^k$ from iterated one-variable integrals over cells, proves that the order does not matter, and derives the change-of-variables formula by factoring a smooth map locally into maps that move one coordinate at a time, glued together with partitions of unity. He then introduces differential forms as objects that are integrated over parametrized surfaces, with the exterior product, the exterior derivative $d$ (and $d^2=0$) and pullbacks under smooth maps. Simplexes and chains lead to Stokes' theorem $\int_{\Phi}d\omega=\int_{\partial\Phi}\omega$, which is then applied to closed and exact forms (the Poincaré lemma) and to the classical theorems of vector analysis of Green, Gauss and Stokes.`,
  items: [
    // ------------------------------------------------------------------ 10.1
    {
      num: '10.1',
      kind: 'Definition',
      name: 'The integral over a k-cell',
      statement: String.raw`Let $I^k\subset\R^k$ be the $k$-cell of points with $a_i\le x_i\le b_i$ ($1\le i\le k$), let $I^j$ be the $j$-cell cut out by the first $j$ of these inequalities, and let $f$ be real and continuous on $I^k$. Set $f_k=f$ and integrate out the last variable:
$$f_{k-1}(x_1,\dots,x_{k-1})=\int_{a_k}^{b_k}f_k(x_1,\dots,x_{k-1},x_k)\,dx_k .$$
By uniform continuity $f_{k-1}$ is continuous on $I^{k-1}$, so the step can be repeated, producing continuous $f_j$ on $I^j$ with $f_{j-1}$ the integral of $f_j$ in $x_j$ over $[a_j,b_j]$. After $k$ steps one is left with a number $f_0$, the **integral of $f$ over $I^k$**, written $\int_{I^k}f(\mathbf x)\,d\mathbf x$ or $\int_{I^k}f$.`,
      idea: String.raw`Everything is reduced to the one-variable Riemann integral of Chapter 6. The only thing to check is that each partial integral $f_{j-1}$ is again continuous, so that the next integral exists (6.8): if $|f_j(\mathbf x)-f_j(\mathbf y)|<\eps$ whenever $|\mathbf x-\mathbf y|<\delta$ (uniform continuity on the compact cell, 4.19), integrating over an interval of length $b_j-a_j$ gives $|f_{j-1}(\mathbf x')-f_{j-1}(\mathbf y')|\le(b_j-a_j)\eps$.`,
      caption: String.raw`Drag the orange point along the graph of $f_1$ (right) or rotate the 3D view. The orange face is the slice $x_1=c$ under the graph of $f$ on $I^2=[0,2]\times[0,1]$: its area is $f_1(c)$. Sweeping $c$ from $0$ to $2$ builds the solid under the graph, and the gold area $\int_0^c f_1$ grows to $f_0=\int_{I^2}f$.`,
      deps: ['pma-6.8', 'pma-4.19'],
      see: ['rca-8.8'],
      tags: ['multiple integrals', 'iterated integrals'],
      viz(v) {
        const M = v.M;
        const FN = {
          hill: { label: 'hill', f: (x, y) => 0.3 + 1.15 * Math.exp(-((x - 1.2) ** 2) / 0.3 - ((y - 0.55) ** 2) / 0.1) },
          wave: { label: 'wave', f: (x, y) => 0.75 + 0.45 * Math.sin(2.4 * x + 0.3) * Math.cos(3.2 * y) },
          ramp: { label: 'ramp', f: (x, y) => 0.2 + 0.3 * x + 0.6 * y * y },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'hill');
        const S3 = v.stage3d({ range: 1.22, height: 340, yaw: -0.62, pitch: 0.36, axes: false, title: 'the solid under $z=f(x_1,x_2)$, cut at $x_1=c$' });
        const P = v.stage({ x: [-0.08, 2.25], y: [0, 1.6], height: 340, axes: 'box', xlabel: 'x₁', title: '$f_1(x_1)=\\int_0^1 f(x_1,x_2)\\,dx_2$' });
        let cache = null, last = null;
        const f1 = (x) => M.integrate((y) => FN[which.value].f(x, y), 0, 1, 60);
        const h = P.handle(1.1, 1, { color: 'orange', constrain: (x) => { const c = M.clamp(x, 0, 2); return [c, f1(c)]; } });
        let st = {};
        v.legend([['accent', 'graph of $f$ over the swept part $[0,c]\\times[0,1]$', { area: true }], ['orange', 'slice $x_1=c$: area $f_1(c)$', { area: true }], ['gold', '$\\int_0^c f_1$', { area: true }]]);
        v.render(() => {
          const F = FN[which.value];
          if (last !== which.value) {
            last = which.value;
            const xs = M.linspace(0, 2, 161), ys = xs.map(f1);
            let zmax = 0; for (let i = 0; i <= 20; i++) for (let j = 0; j <= 10; j++) zmax = Math.max(zmax, F.f(i / 10, j / 10));
            cache = { xs, ys, L: M.integrate(f1, 0, 2, 80), zmax };
            P.setView(null, [0, Math.max(...ys) * 1.3]);
            h.y = f1(h.x);
          }
          const c = h.x, fc = f1(c);
          // ---- 3D
          const Zs = (z) => -0.55 + 1.15 * z / cache.zmax;
          const W = (x, y, z) => [x - 1, y - 0.5, Zs(z)];
          S3.path([W(0, 0, 0), W(2, 0, 0), W(2, 1, 0), W(0, 1, 0)], { color: 'muted', width: 1.3, close: true });
          S3.arrow(W(2, 0, 0), W(2.22, 0, 0), { color: 'muted', width: 1.2, head: 7 });
          S3.arrow(W(2, 1, 0), W(2, 1.3, 0), { color: 'muted', width: 1.2, head: 7 });
          S3.text('x₁', W(2.3, -0.1, 0), { math: true, color: 'muted' });
          S3.text('x₂', W(2.06, 1.38, 0), { math: true, color: 'muted' });
          S3.text('0', W(-0.05, -0.08, 0), { color: 'muted', size: 11 });
          if (c < 1.98) S3.surface((u, w) => W(u, w, F.f(u, w)), [c, 2], [0, 1], { nu: Math.max(2, Math.round((2 - c) * 8)), nv: 8, color: 'accent', alpha: 0.12, wire: true, shade: false });
          if (c > 0.02) {
            const nu = Math.max(2, Math.round(c * 11));
            S3.surface((u, w) => W(u, w, F.f(u, w)), [0, c], [0, 1], { nu, nv: 12, color: 'accent', alpha: 0.82, wire: true });
            for (let i = 0; i < nu; i++) { const u0 = c * i / nu, u1 = c * (i + 1) / nu; S3.poly([W(u0, 0, 0), W(u1, 0, 0), W(u1, 0, F.f(u1, 0)), W(u0, 0, F.f(u0, 0))], { fill: 'accent', fillAlpha: 0.22, stroke: false }); }
          }
          const n = 18, nz = 6;
          for (let j = 0; j < n; j++) {
            const y0 = j / n, y1 = (j + 1) / n, h0 = F.f(c, y0), h1 = F.f(c, y1);
            for (let q = 0; q < nz; q++) S3.poly([W(c, y0, h0 * q / nz), W(c, y1, h1 * q / nz), W(c, y1, h1 * (q + 1) / nz), W(c, y0, h0 * (q + 1) / nz)], { fill: 'orange', fillAlpha: 0.62, stroke: false, bias: -0.01 });
          }
          S3.curve((y) => W(c, y, F.f(c, y)), 0, 1, { color: 'orange', width: 2.6, n: 40, bias: -0.004 });
          S3.line(W(c, 0, 0), W(c, 1, 0), { color: 'orange', width: 2, bias: -0.004 });
          // ---- 2D: f1 and the swept area
          P.fn((x) => M.lerp(cache.ys[Math.min(159, Math.floor(x / 2 * 160))], cache.ys[Math.min(160, Math.floor(x / 2 * 160) + 1)], M.fract(x / 2 * 160)), { domain: [0, 2], color: 'accent', width: 2.4 });
          P.fn(f1, { domain: [0, c], n: 60, fill: 'gold', fillAlpha: 0.3, color: 'gold', width: 0.01 });
          P.line(c, 0, c, fc, { color: 'orange', width: 3 });
          P.tex('f_1(c)', c, fc / 2, { color: 'orange', align: 'left', dx: 7 });
          const run = c > 1e-6 ? M.integrate(f1, 0, c, 40) : 0;
          st = { c, fc, run, L: cache.L };
        });
        v.readout(() => `$c=${v.fix(st.c, 3)}$: $\\;f_1(c)=\\int_0^1 f(c,x_2)\\,dx_2=${v.fix(st.fc, 4)}$ (orange face), $\\;\\int_0^c f_1=${v.fix(st.run, 4)}$; $\\;$ at $c=2$ this becomes $f_0=\\int_{I^2}f=${v.fix(st.L, 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 10.2
    {
      num: '10.2',
      kind: 'Theorem',
      name: 'The order of iterated integration is irrelevant',
      statement: String.raw`Let $f$ be continuous on the $k$-cell $I^k$. Write $L(f)$ for the integral of Definition 10.1 (integrate in $x_k$, then $x_{k-1}$, …, then $x_1$) and $L'(f)$ for the number obtained by performing the $k$ one-variable integrations in any other order. Then $L(f)=L'(f)$.`,
      idea: String.raw`For a product $h(\mathbf x)=h_1(x_1)\cdots h_k(x_k)$ every order gives $\prod_j\int_{a_j}^{b_j}h_j$, so $L=L'$ on the algebra $\mathscr A$ of finite sums of such products. $\mathscr A$ separates points and contains the constants, so by Stone–Weierstrass (7.32) some $g\in\mathscr A$ has $\norm{f-g}_\infty<\eps$. Both $L$ and $L'$ are linear and satisfy $|L(u)|\le\operatorname{vol}(I^k)\norm u_\infty$, hence $|L(f)-L'(f)|\le|L(f-g)|+|L'(g-f)|\le2\operatorname{vol}(I^k)\,\eps$.`,
      caption: String.raw`Left: $f$ on the square $[0,1]^2$ (teal $>0$, pink $<0$). Drag the black point: the blue line is a slice $x_1=s$, the orange line a slice $x_2=t$. Right: the two inner integrals as functions of the remaining variable; their signed areas are $L(f)$ and $L'(f)$. They agree for every continuous $f$. The last choice is not continuous at $\mathbf 0$ (it is unbounded there): its two iterated integrals are $+\pi/4$ and $-\pi/4$.`,
      deps: ['pma-10.1', 'pma-7.32', 'pma-6.12'],
      see: ['rca-8.8'],
      tags: ['Fubini', 'iterated integrals', 'Stone–Weierstrass'],
      viz(v) {
        const M = v.M;
        const FN = {
          wave: { label: '$\\sin 3x_1\\cos 2x_2+x_1x_2$', f: (x, y) => Math.sin(3 * x) * Math.cos(2 * y) + x * y },
          bumps: { label: 'two bumps', f: (x, y) => 1.4 * Math.exp(-9 * ((x - 0.28) ** 2 + (y - 0.7) ** 2)) - 1.1 * Math.exp(-14 * ((x - 0.72) ** 2 + (y - 0.3) ** 2)) },
          exp: { label: '$x_1e^{x_1x_2}-1$', f: (x, y) => x * Math.exp(x * y) - 1 },
          sing: { label: '$\\frac{x_1^2-x_2^2}{(x_1^2+x_2^2)^2}$', f: (x, y) => (x * x - y * y) / (x * x + y * y) ** 2, A: (x) => 1 / (1 + x * x), B: (y) => -1 / (1 + y * y), bad: true },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'wave');
        const H = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 330, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', title: '$f$ on $I^2=[0,1]^2$ with two slices' });
        const P = v.stage({ x: [-0.03, 1.03], y: [-1, 1], height: 330, axes: true, title: 'inner integrals' });
        const p = H.handle(0.35, 0.6, { color: 'ink', constrain: { x: [0.01, 0.99], y: [0.01, 0.99] } });
        let cache = null, last = null, st = {};
        v.legend([['blue', '$A(x_1)=\\int_0^1 f(x_1,x_2)\\,dx_2$, area $L(f)$'], ['orange', '$B(x_2)=\\int_0^1 f(x_1,x_2)\\,dx_1$, area $L\'(f)$']]);
        v.render(() => {
          const F = FN[which.value];
          if (last !== which.value) {
            last = which.value;
            const A = F.A || ((x) => M.integrate((y) => F.f(x, y), 0, 1, 80));
            const B = F.B || ((y) => M.integrate((x) => F.f(x, y), 0, 1, 80));
            const xs = M.linspace(0, 1, 201);
            const As = xs.map(A), Bs = xs.map(B);
            let mx = 0; if (!F.bad) for (let i = 0; i <= 30; i++) for (let j = 0; j <= 30; j++) mx = Math.max(mx, Math.abs(F.f(i / 30, j / 30)));
            cache = { A, B, As, Bs, L: M.integrate(A, 0, 1, 200), Lp: M.integrate(B, 0, 1, 200), range: F.bad ? 6 : mx };
            const lo = Math.min(0, ...As, ...Bs), hi = Math.max(0, ...As, ...Bs), pad = 0.15 * (hi - lo || 1);
            P.setView(null, [lo - pad, hi + pad]);
          }
          const col = divRGB(v, 'teal', 'pink', 0.7);
          H.raster((x, y) => col(F.f(x, y) / cache.range), { key: which.value + themeKey(v), res: 2 });
          H.axes();
          H.vline(p.x, { color: 'blue', width: 2.4 });
          H.hline(p.y, { color: 'orange', width: 2.4 });
          if (F.bad) { H.dot(0, 0, { color: 'red', r: 5 }); H.corner('f is unbounded near 0', 'tr', { color: 'red', weight: 600 }); }
          const xs = M.linspace(0, 1, 201);
          P.path(xs.map((x, i) => [x, cache.As[i]]).concat([[1, 0], [0, 0]]), { fill: 'blue', fillAlpha: 0.13, stroke: false, close: true });
          P.path(xs.map((x, i) => [x, cache.Bs[i]]).concat([[1, 0], [0, 0]]), { fill: 'orange', fillAlpha: 0.13, stroke: false, close: true });
          P.path(xs.map((x, i) => [x, cache.As[i]]), { color: 'blue', width: 2.4 });
          P.path(xs.map((x, i) => [x, cache.Bs[i]]), { color: 'orange', width: 2.4 });
          const a = cache.A(p.x), b = cache.B(p.y);
          P.line(p.x, 0, p.x, a, { color: 'blue', width: 1.2, dash: [3, 3] });
          P.line(p.y, 0, p.y, b, { color: 'orange', width: 1.2, dash: [3, 3] });
          P.dot(p.x, a, { color: 'blue', r: 5, label: 'A(s)', labelPos: a >= 0 ? 'ne' : 'se' });
          P.dot(p.y, b, { color: 'orange', r: 5, label: 'B(t)', labelPos: b >= 0 ? 'ne' : 'se' });
          const same = Math.abs(cache.L - cache.Lp) < 1e-6;
          P.corner(same ? 'equal areas: L(f) = L′(f)' : 'L(f) ≠ L′(f)', 'tr', { color: same ? 'green' : 'red', weight: 600 });
          st = { s: p.x, t: p.y, a, b, L: cache.L, Lp: cache.Lp, same, bad: F.bad };
        });
        v.readout(() => `$A(${v.fix(st.s, 2)})=${v.fix(st.a, 3)}$, $\\;B(${v.fix(st.t, 2)})=${v.fix(st.b, 3)}$. $\\;L(f)=\\int_0^1A=${v.fix(st.L, 5)}$, $\\;L'(f)=\\int_0^1B=${v.fix(st.Lp, 5)}$` + (st.bad ? ' — here $f\\notin\\mathscr C(I^2)$, and the two orders give $\\pm\\pi/4=\\pm0.78540$.' : ' — the same number, as the theorem says.'));
      },
    },
    // ------------------------------------------------------------------ 10.3
    {
      num: '10.3',
      kind: 'Definition',
      name: 'Support; integrals of compactly supported functions',
      statement: String.raw`The **support** of a real or complex function $f$ on $\R^k$ is the closure of $\{\mathbf x\in\R^k: f(\mathbf x)\ne0\}$. If $f$ is continuous and its support is compact, choose any $k$-cell $I^k$ containing the support and put
$$\int_{\R^k}f=\int_{I^k}f .$$
The value does not depend on the cell chosen, because $f=0$ outside the support.`,
      idea: String.raw`If two cells both contain the support, compare each with a large cell containing both: the extra slabs only add integrals of the zero function, one variable at a time (10.1). Note that the support is a *closure*: points where $f$ vanishes but which are limits of points where it does not (like the dashed zero line below) still belong to it.`,
      caption: String.raw`Drag the two corners of the cell (orange). $f$ is continuous with compact support: two closed discs (dashed green). On the dotted segment inside the left disc $f=0$ (it separates the teal and pink parts), yet that segment still lies in the support, which is a closure. The right panel plots $\int_{\text{cell}}f$ as the right edge $b_1$ moves with the other edges fixed: once the cell contains the support the value stops changing.`,
      deps: ['pma-10.1', 'pma-10.2'],
      see: ['rca-2.9'],
      tags: ['support', 'multiple integrals'],
      viz(v) {
        const M = v.M;
        const bmp = (t) => (t < 1 ? Math.E * M.bump(t) : 0);
        const CA = [-1, 0.3], RA = 1.2, CB = [1.1, -0.65], RB = 0.9;
        const f = (x, y) => {
          const ra = Math.hypot(x - CA[0], y - CA[1]) / RA, rb = Math.hypot(x - CB[0], y - CB[1]) / RB;
          return (ra < 1 ? 1.5 * bmp(ra) * (0.3 + (x - CA[0]) / RA) : 0) + (rb < 1 ? 0.9 * bmp(rb) : 0);
        };
        const S = v.stage({ x: [-3, 3.2], y: [-2.3, 2.3], equal: true, height: 320, axes: true, title: '$f$, its support, and a cell $[a_1,b_1]\\times[a_2,b_2]$' });
        const B = v.stage({ x: [-3, 3.2], y: [-1, 1], height: 320, axes: 'box', xlabel: 'b₁', title: '$\\int_{\\text{cell}}f$ as a function of the right edge $b_1$' });
        const lo = S.handle(-2.6, -1.9, { color: 'orange', label: 'a', labelPos: 'sw' });
        const hi = S.handle(1.6, 1.9, { color: 'orange', label: 'b', labelPos: 'ne' });
        const total = M.integrate((x) => M.integrate((y) => f(x, y), -2.4, 2.4, 160), -2.4, 2.4, 160);
        const supp = { x0: CA[0] - RA, x1: CB[0] + RB, y0: CB[1] - RB, y1: CA[1] + RA };
        let st = {};
        v.legend([['teal', '$f>0$', { area: true }], ['pink', '$f<0$', { area: true }], ['green', '$\\operatorname{supp} f$', { dash: true }], ['orange', 'the cell']]);
        v.render(() => {
          const a1 = Math.min(lo.x, hi.x), b1 = Math.max(lo.x, hi.x), a2 = Math.min(lo.y, hi.y), b2 = Math.max(lo.y, hi.y);
          const col = divRGB(v, 'teal', 'pink', 0.8);
          S.raster((x, y) => { const z = f(x, y); return z === 0 ? null : col(z / 1.2); }, { key: themeKey(v), res: 2 });
          S.circle(CA[0], CA[1], RA, { color: 'green', width: 2, dash: [6, 4] });
          S.circle(CB[0], CB[1], RB, { color: 'green', width: 2, dash: [6, 4] });
          const zx = CA[0] - 0.3 * RA, zh = Math.sqrt(RA * RA - (zx - CA[0]) ** 2);
          S.line(zx, CA[1] - zh, zx, CA[1] + zh, { color: 'ink', width: 1.4, dash: [2, 4] });
          S.text('f = 0 on this segment', zx, CA[1] + zh + 0.22, { color: 'muted', size: 11.5, align: 'center' });
          const inside = a1 <= supp.x0 && b1 >= supp.x1 && a2 <= supp.y0 && b2 >= supp.y1;
          S.rect(a1, a2, b1, b2, { color: inside ? 'green' : 'orange', width: 2.4, fill: inside ? 'green' : 'orange', fillAlpha: 0.04 });
          const val = M.integrate((x) => M.integrate((y) => f(x, y), a2, b2, 90), a1, b1, 110);
          S.corner(inside ? 'cell ⊇ supp f' : 'cell cuts the support', 'tl', { color: inside ? 'green' : 'red', weight: 600 });
          B.corner(inside ? 'value = ∫ over ℝ²' : 'value still depends on the cell', 'tr', { color: inside ? 'green' : 'red', weight: 600 });
          // lower panel: I(b) for b in [a1, 3.2]
          const xs = M.linspace(a1, 3.2, 161), g = xs.map((x) => M.integrate((y) => f(x, y), a2, b2, 70));
          const I = [0]; for (let i = 1; i < xs.length; i++) I.push(I[i - 1] + (g[i] + g[i - 1]) / 2 * (xs[i] - xs[i - 1]));
          const mn = Math.min(0, ...I, total), mx = Math.max(0, ...I, total), pad = 0.15 * (mx - mn || 1);
          B.setView(null, [mn - pad, mx + 2.2 * pad]);
          B.hline(total, { color: 'green', dash: [5, 4], width: 1.3 });
          B.text('∫ over ℝ²', -2.8, total, { color: 'green', size: 11.5, baseline: 'bottom', dy: -3 });
          B.vband(supp.x1, 3.3, { color: 'green', alpha: 0.07 });
          B.path(xs.map((x, i) => [x, I[i]]), { color: 'accent', width: 2.2 });
          B.vline(b1, { color: 'orange', width: 1.2, dash: [3, 3] });
          B.dot(b1, val, { color: 'orange', r: 5 });
          st = { val, inside };
        });
        v.readout(() => `$\\int_{\\text{cell}}f=${v.fix(st.val, 4)}$, $\\quad\\int_{\\R^2}f=${v.fix(total, 4)}$` + (st.inside ? ' — every cell containing the support gives this value.' : ' — enlarge the cell until it contains both discs.'));
      },
    },
    // ------------------------------------------------------------------ 10.5
    {
      num: '10.5',
      kind: 'Definition',
      name: 'Primitive mapping',
      statement: String.raw`A map $G$ of an open set $E\subset\R^n$ into $\R^n$ is **primitive** if for some index $m$ and some real function $g$ on $E$
$$G(\mathbf x)=\sum_{i\ne m}x_i\mathbf e_i+g(\mathbf x)\mathbf e_m=\mathbf x+\big[g(\mathbf x)-x_m\big]\mathbf e_m\qquad(\mathbf x\in E):$$
$G$ changes at most the $m$-th coordinate. If $g$ is differentiable at $\mathbf a$, the matrix of $G'(\mathbf a)$ agrees with the identity except in row $m$, which is $\big((D_1g)(\mathbf a),\dots,(D_ng)(\mathbf a)\big)$. Hence $J_G(\mathbf a)=(D_mg)(\mathbf a)$, and $G'(\mathbf a)$ is invertible exactly when $(D_mg)(\mathbf a)\ne0$.`,
      idea: String.raw`Expanding $\det G'(\mathbf a)$ along any row $j\ne m$ (which is $\mathbf e_j$) leaves only the diagonal entry of row $m$, so the Jacobian is the single partial derivative $D_mg$. Primitive maps are the multivariable version of a one-variable substitution: on each line parallel to $\mathbf e_m$ the map acts as $x_m\mapsto g$, and that line is mapped into itself.`,
      caption: String.raw`Left: the domain, shaded by $J_G=D_mg$ (blue $>0$, red $<0$). Right: the image of the grid. Every point moves only in the direction $\mathbf e_m$ (gold arrows), so the lines parallel to $\mathbf e_m$ are mapped into themselves. Drag $\mathbf a$ to read $G'(\mathbf a)$. With the fold example $D_mg$ changes sign and the image grid folds over itself (red), where $G'$ fails to be invertible.`,
      deps: ['pma-9.36', 'pma-9.17'],
      tags: ['primitive mappings', 'Jacobian'],
      viz(v) {
        const M = v.M;
        const GF = {
          smooth: { label: 'gentle', g: (s, r) => s + 0.3 * Math.sin(2.5 * r) + 0.15 * s * s * s },
          shear: { label: 'shear', g: (s, r) => 1.25 * s + 0.45 * r * r - 0.3 },
          fold: { label: 'fold', g: (s, r) => s - 0.8 * s * s * s + 0.25 * r },
        };
        const which = v.select('$g$', Object.entries(GF).map(([value, o]) => ({ value, label: o.label })), 'smooth');
        const mm = v.select('$m$', [{ value: 2, label: '$m=2$' }, { value: 1, label: '$m=1$' }], 2);
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 320, title: 'domain $E$, shaded by $J_G=D_mg$' });
        const R = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 320, title: 'image $G(E)$' });
        const a = L.handle(0.45, 0.35, { color: 'gold', label: 'a', constrain: { x: [-1.1, 1.1], y: [-1.1, 1.1] } });
        let st = {};
        v.legend([['blue', 'grid lines $x_1=$ const'], ['orange', 'grid lines $x_2=$ const'], ['gold', 'motion $\\mathbf x\\mapsto G(\\mathbf x)$, parallel to $\\mathbf e_m$'], ['red', 'where $J_G<0$']]);
        v.render(() => {
          const g0 = GF[which.value].g, m = +mm.value;
          const g = (x, y) => (m === 2 ? g0(y, x) : g0(x, y));
          const G = (x, y) => (m === 2 ? [x, g(x, y)] : [g(x, y), y]);
          const Dm = (x, y) => (m === 2 ? (g(x, y + 1e-5) - g(x, y - 1e-5)) : (g(x + 1e-5, y) - g(x - 1e-5, y))) / 2e-5;
          // common view: the domain and its image
          let lo = [-1.1, -1.1], hi = [1.1, 1.1];
          for (const x of M.linspace(-1.1, 1.1, 23)) for (const y of M.linspace(-1.1, 1.1, 23)) { const q = G(x, y); lo = [Math.min(lo[0], q[0]), Math.min(lo[1], q[1])]; hi = [Math.max(hi[0], q[0]), Math.max(hi[1], q[1])]; }
          const pad = 0.08 * Math.max(hi[0] - lo[0], hi[1] - lo[1]);
          for (const S of [L, R]) S.setView([lo[0] - pad, hi[0] + pad], [lo[1] - pad, hi[1] + pad]);
          const col = divRGB(v, 'blue', 'red', 0.42);
          L.raster((x, y) => (Math.abs(x) <= 1.1 && Math.abs(y) <= 1.1 ? col(Dm(x, y) / 2) : null), { key: which.value + m + themeKey(v), res: 3 });
          const ticks = M.linspace(-1.1, 1.1, 12);
          for (const c of ticks) {
            L.line(c, -1.1, c, 1.1, { color: 'blue', width: 1, alpha: 0.55 });
            L.line(-1.1, c, 1.1, c, { color: 'orange', width: 1, alpha: 0.55 });
            R.line(c, -1.1, c, 1.1, { color: 'faint', width: 0.8, alpha: 0.5 });
            R.line(-1.1, c, 1.1, c, { color: 'faint', width: 0.8, alpha: 0.5 });
          }
          const seg = (fam, c, colr) => {
            const pts = M.linspace(-1.1, 1.1, 70).map((s) => (fam === 'v' ? [c, s] : [s, c]));
            for (let i = 0; i + 1 < pts.length; i++) {
              const p = pts[i], q = pts[i + 1], neg = Dm((p[0] + q[0]) / 2, (p[1] + q[1]) / 2) < 0;
              const P1 = G(...p), Q1 = G(...q);
              R.line(P1[0], P1[1], Q1[0], Q1[1], { color: neg ? 'red' : colr, width: neg ? 2 : 1.5 });
            }
          };
          for (const c of ticks) { seg('v', c, 'blue'); seg('h', c, 'orange'); }
          for (const x of M.linspace(-0.8, 0.8, 5)) for (const y of M.linspace(-0.8, 0.8, 5)) {
            const q = G(x, y); if (Math.hypot(q[0] - x, q[1] - y) > 0.03) R.arrow(x, y, q[0], q[1], { color: 'gold', width: 1.5, head: 6.5 });
          }
          const ga = G(a.x, a.y);
          R.dot(ga[0], ga[1], { color: 'gold', r: 5.5, label: 'G(a)', labelPos: 'ne' });
          R.dot(a.x, a.y, { color: 'gold', r: 3, hollow: true });
          R.line(a.x, a.y, ga[0], ga[1], { color: 'gold', width: 1.5, dash: [3, 3] });
          const d1 = (g(a.x + 1e-5, a.y) - g(a.x - 1e-5, a.y)) / 2e-5, d2 = (g(a.x, a.y + 1e-5) - g(a.x, a.y - 1e-5)) / 2e-5;
          const J = m === 2 ? d2 : d1;
          R.corner(Math.abs(J) > 0.02 ? 'Jacobian at a ≠ 0: G′(a) invertible' : 'Jacobian at a ≈ 0: G′(a) singular', 'tl', { color: Math.abs(J) > 0.02 ? 'green' : 'red', weight: 600 });
          st = { m, d1, d2, J };
        });
        v.readout(() => {
          const { m, d1, d2, J } = st; const f = (x) => v.fix(x, 3);
          const mat = m === 2 ? `\\begin{pmatrix}1&0\\\\ ${f(d1)}&${f(d2)}\\end{pmatrix}` : `\\begin{pmatrix}${f(d1)}&${f(d2)}\\\\ 0&1\\end{pmatrix}`;
          return `$G'(\\mathbf a)=${mat}$ (row ${m} is $\\nabla g(\\mathbf a)$), $\\quad J_G(\\mathbf a)=D_${m}g(\\mathbf a)=${f(J)}$` + (Math.abs(J) < 0.05 ? ' — nearly singular.' : J < 0 ? ' — invertible, but orientation-reversing; nearby the grid folds.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 10.6
    {
      num: '10.6',
      kind: 'Definition',
      name: 'Flips and the coordinate projections',
      statement: String.raw`A **flip** is a linear operator $B$ on $\R^n$ that interchanges two members $\mathbf e_i,\mathbf e_j$ of the standard basis and fixes all the others; equivalently, $B$ swaps the coordinates $x_i$ and $x_j$ of every point. The **projections** $P_0,\dots,P_n$ are defined by $P_0\mathbf x=\mathbf 0$ and $P_m\mathbf x=x_1\mathbf e_1+\dots+x_m\mathbf e_m$ ($1\le m\le n$); $P_m$ has range spanned by $\mathbf e_1,\dots,\mathbf e_m$ and null space spanned by $\mathbf e_{m+1},\dots,\mathbf e_n$.`,
      idea: String.raw`A flip is the reflection in the hyperplane $x_i=x_j$; it is its own inverse and $\det B=-1$, so it reverses orientation — which is harmless in the change-of-variables formula because only $|J|$ appears there. The projections $P_m$ let the proof of 10.7 say "the first $m$ coordinates have already been fixed": $\mathbf x=P_n\mathbf x$ is reached from $P_0\mathbf x=\mathbf 0$ by adding one coordinate at a time.`,
      caption: String.raw`Rotate the 3D view and move $\mathbf x$ with the sliders. The gold staircase visits $P_0\mathbf x,P_1\mathbf x,P_2\mathbf x,P_3\mathbf x=\mathbf x$, changing one coordinate per step. Choose a flip: $B\mathbf x$ (red) is the mirror image of $\mathbf x$ in the plane $x_i=x_j$ (shaded), the coloured frame at $\mathbf x$ becomes a left-handed frame at $B\mathbf x$, and on the right two coordinates trade places.`,
      deps: ['pma-9.33'],
      tags: ['linear algebra', 'primitive mappings'],
      viz(v) {
        const M = v.M;
        const pair = v.select('flip', [{ value: '01', label: '$x_1\\leftrightarrow x_2$' }, { value: '02', label: '$x_1\\leftrightarrow x_3$' }, { value: '12', label: '$x_2\\leftrightarrow x_3$' }], '01');
        const sx = [v.slider('$x_1$', -1, 1, 0.9, { step: 0.01 }), v.slider('$x_2$', -1, 1, 0.35, { step: 0.01 }), v.slider('$x_3$', -1, 1, 0.65, { step: 0.01 })];
        const S = v.stage3d({ range: 1.3, height: 340, yaw: 0.42, pitch: 0.33, labels: ['x₁', 'x₂', 'x₃'], weight: 1.4, title: 'the staircase $P_m\\mathbf x$ and the reflection $B$' });
        const Bp = v.stage({ x: [0.45, 3.55], y: [-1.15, 1.15], height: 340, axes: true, minWidth: 240, xticks: [[1, 'i = 1'], [2, 'i = 2'], [3, 'i = 3']], yticks: [-1, -0.5, 0.5, 1], title: 'coordinates of $\\mathbf x$ and $B\\mathbf x$' });
        const FR = ['blue', 'green', 'purple'];
        let st = {};
        v.legend([['gold', 'staircase $P_0\\mathbf x\\to P_1\\mathbf x\\to P_2\\mathbf x\\to P_3\\mathbf x$'], ['accent', '$\\mathbf x$', { area: true }], ['red', '$B\\mathbf x$', { area: true }], ['purple', 'mirror plane $x_i=x_j$', { area: true }]]);
        v.render(() => {
          const [i, j] = pair.value.split('').map(Number), k = 3 - i - j;
          const x = sx.map((s) => s.value);
          const Bv = (p) => { const q = p.slice(); q[i] = p[j]; q[j] = p[i]; return q; };
          const bx = Bv(x);
          // mirror plane spanned by e_k and (e_i + e_j)/√2
          const ek = [0, 0, 0]; ek[k] = 0.95; const d = [0, 0, 0]; d[i] = d[j] = 1.05 / Math.SQRT2;
          S.poly([M.vadd(ek, d), M.vadd(M.vscale(ek, -1), d), M.vsub(M.vscale(ek, -1), d), M.vsub(ek, d)], { fill: 'purple', fillAlpha: 0.1, color: 'purple', alpha: 0.45, width: 1 });
          // staircase
          const P = [[0, 0, 0]]; for (let m = 0; m < 3; m++) { const q = P[m].slice(); q[m] = x[m]; P.push(q); }
          S.path(P, { color: 'gold', width: 2.8 });
          P.forEach((q, m) => { if (m > 0 && m < 3) S.dot(q, { color: 'gold', r: 4.5, label: ['', 'P₁x', 'P₂x'][m] }); });
          S.dot([0, 0, 0], { color: 'gold', r: 3.5 });
          // x, Bx and the reflection segment
          S.line(x, bx, { color: 'red', width: 1.4, dash: [4, 4] });
          const fr = 0.3;
          for (let m = 0; m < 3; m++) {
            const e = [0, 0, 0]; e[m] = fr;
            S.arrow(x, M.vadd(x, e), { color: FR[m], width: 2.4, head: 7 });
            S.arrow(bx, M.vadd(bx, Bv(e)), { color: FR[m], width: 2.4, head: 7 });
          }
          S.dot(x, { color: 'accent', r: 6, label: 'x = P₃x' });
          S.dot(bx, { color: 'red', r: 6, label: 'Bx' });
          // coordinate bars
          for (let m = 0; m < 3; m++) {
            Bp.rect(m + 1 - 0.3, 0, m + 1 - 0.04, x[m], { fill: 'accent', fillAlpha: 0.7, stroke: false });
            Bp.rect(m + 1 + 0.04, 0, m + 1 + 0.3, bx[m], { fill: 'red', fillAlpha: 0.7, stroke: false });
          }
          Bp.arrow(i + 1 - 0.17, x[i], j + 1 + 0.17, x[i], { color: 'gold', width: 1.6, head: 7, dash: [4, 3] });
          Bp.arrow(j + 1 - 0.17, x[j], i + 1 + 0.17, x[j], { color: 'gold', width: 1.6, head: 7, dash: [4, 3] });
          Bp.corner(`B swaps x${'₁₂₃'[i]} and x${'₁₂₃'[j]}; x${'₁₂₃'[k]} stays`, 'br', { color: 'muted' });
          st = { i, j, x, bx };
        });
        v.readout(() => {
          const { i, j, x, bx } = st; const B = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; B[i][i] = B[j][j] = 0; B[i][j] = B[j][i] = 1;
          const f = (a) => v.fix(a, 2);
          return `$B=\\begin{pmatrix}${B.map((r) => r.join('&')).join('\\\\')}\\end{pmatrix}$, $\\;\\det B=-1$, $\\;B^2=I$. $\\quad\\mathbf x=(${x.map(f).join(',')})\\mapsto B\\mathbf x=(${bx.map(f).join(',')})$; $\\;P_1\\mathbf x=(${f(x[0])},0,0)$, $P_2\\mathbf x=(${f(x[0])},${f(x[1])},0)$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.7
    {
      num: '10.7',
      kind: 'Theorem',
      name: 'Local factorization into primitive maps and flips',
      statement: String.raw`Let $F$ be a $\mathscr C'$-mapping of an open set $E\subset\R^n$ into $\R^n$ with $\mathbf 0\in E$, $F(\mathbf 0)=\mathbf 0$ and $F'(\mathbf 0)$ invertible. Then on some neighbourhood of $\mathbf 0$
$$F(\mathbf x)=B_1\cdots B_{n-1}\,G_n\circ\cdots\circ G_1(\mathbf x),$$
where each $G_i$ is a primitive $\mathscr C'$-mapping on a neighbourhood of $\mathbf 0$ with $G_i(\mathbf 0)=\mathbf 0$ and $G_i'(\mathbf 0)$ invertible, and each $B_i$ is a flip or the identity.`,
      idea: String.raw`Induct on the number of coordinates already fixed. If $F_m=P_{m-1}+\sum_{i\ge m}\alpha_i\mathbf e_i$ near $\mathbf 0$, invertibility of $F_m'(\mathbf 0)$ gives some $k\ge m$ with $D_m\alpha_k(\mathbf 0)\ne0$. Let $B_m$ swap coordinates $m$ and $k$, and let $G_m$ replace $x_m$ by $\alpha_k(\mathbf x)$; $G_m$ is primitive with $J_{G_m}(\mathbf 0)\ne0$, so it has a local $\mathscr C'$ inverse by the inverse function theorem (9.24). Then $F_{m+1}=B_mF_mG_m^{-1}$ fixes one more coordinate. The flip is needed exactly when $D_m\alpha_m(\mathbf 0)=0$.`,
      caption: String.raw`Four snapshots of a neighbourhood of $\mathbf 0$ in $\R^2$ (blue/orange grid lines; the first is shaded purple where $J_{G_1}>0$, red where $J_{G_1}<0$). $G_1$ slides points horizontally, $G_2$ slides them vertically, and $B_1$ swaps the coordinates; the dashed green grid is $F$ applied directly, and it coincides with the result. Drag $\mathbf p$ and watch its L-shaped path. With $D_1F_1(\mathbf 0)=0$, choose "never flip": $J_{G_1}$ vanishes at $\mathbf 0$, $G_1$ folds the neighbourhood (red), and no primitive $G_2$ can exist. Large $r$ can break the factorization too — it is only local.`,
      deps: ['pma-10.5', 'pma-10.6', 'pma-9.24', 'pma-9.36', 'pma-9.15'],
      tags: ['primitive mappings', 'inverse function theorem'],
      viz(v) {
        const M = v.M;
        const EX = {
          a: { label: '$D_1F_1(\\mathbf 0)\\ne0$', F: (x, y) => [x + 0.35 * y + 0.3 * x * x - 0.15 * y * y, 0.25 * x + y + 0.4 * Math.sin(1.5 * x) * y + 0.25 * y * y] },
          b: { label: '$D_1F_1(\\mathbf 0)=0$', F: (x, y) => [0.9 * y + 0.4 * x * x + 0.2 * x * y, 0.85 * x - 0.3 * y + 0.25 * y * y] },
        };
        const which = v.select('$F$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'b');
        const mode = v.select('', [{ value: 'rudin', label: 'flip when needed' }, { value: 'never', label: 'never flip' }], 'rudin');
        const rad = v.slider('radius $r$', 0.15, 1.2, 0.6, { step: 0.01 });
        const TT = ['domain, shaded by $J_{G_1}$', 'after $G_1$: only $x_1$ moves', 'after $G_2$: only $x_2$ moves', 'after $B_1$: equals $F(\\mathbf x)$'];
        const P = TT.map((t) => v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 250, minWidth: 360, title: t }));
        const p = P[0].handle(0.3, 0.22, { color: 'gold', label: 'p' });
        let st = {};
        v.legend([['blue', 'images of $x_1=$ const'], ['orange', 'images of $x_2=$ const'], ['green', '$F$ applied directly', { dash: true }], ['gold', 'motion of points']]);
        v.render(() => {
          const F = EX[which.value].F, r = rad.value;
          p.x = M.clamp(p.x, -r, r); p.y = M.clamp(p.y, -r, r);
          const J0 = jac2(F, 0, 0);
          const k = mode.value === 'rudin' && Math.abs(J0[0][0]) < 1e-9 ? 1 : 0, o = 1 - k, flip = k === 1;
          const S1 = (x, y) => [F(x, y)[k], y];
          const S2 = (x, y) => { const z = F(x, y); return [z[k], z[o]]; };
          const S3 = (x, y) => { const z = S2(x, y); return flip ? [z[1], z[0]] : z; };
          const stages = [(x, y) => [x, y], S1, S2, S3];
          const JG1 = (x, y) => (F(x + 1e-5, y)[k] - F(x - 1e-5, y)[k]) / 2e-5;
          // does J_{G_1} vanish or change sign on the square?
          let jmin = Infinity, jmax = -Infinity;
          for (const x of M.linspace(-r, r, 21)) for (const y of M.linspace(-r, r, 21)) { const j = JG1(x, y); jmin = Math.min(jmin, j); jmax = Math.max(jmax, j); }
          const broken = jmin <= 0 && jmax >= 0;
          // grids
          const ls = M.linspace(-r, r, 9), ts = M.linspace(-r, r, 40);
          const lines = []; for (const c of ls) { lines.push({ fam: 'blue', pts: ts.map((t) => [c, t]) }); lines.push({ fam: 'orange', pts: ts.map((t) => [t, c]) }); }
          const imgs = stages.map((S) => lines.map((L) => ({ fam: L.fam, pts: L.pts.map((q) => S(q[0], q[1])) })));
          let bx = [Infinity, -Infinity], by = [Infinity, -Infinity];
          for (const I of imgs) for (const L of I) for (const q of L.pts) { bx = [Math.min(bx[0], q[0]), Math.max(bx[1], q[0])]; by = [Math.min(by[0], q[1]), Math.max(by[1], q[1])]; }
          const padx = 0.12 * (bx[1] - bx[0]), pady = 0.12 * (by[1] - by[0]);
          for (const S of P) S.setView([bx[0] - padx, bx[1] + padx], [by[0] - pady, by[1] + pady]);
          const col = divRGB(v, 'purple', 'red', 0.32);
          P[0].raster((x, y) => (Math.abs(x) <= r && Math.abs(y) <= r ? col(JG1(x, y) / 1.2) : null), { key: which.value + mode.value + r + themeKey(v), res: 3 });
          const nodes = []; for (const x of M.linspace(-0.75 * r, 0.75 * r, 4)) for (const y of M.linspace(-0.75 * r, 0.75 * r, 4)) nodes.push([x, y]);
          const corners = [[-0.75 * r, -0.75 * r], [0.75 * r, 0.75 * r], [-0.75 * r, 0.75 * r], [0.75 * r, -0.75 * r]];
          for (let s = 0; s < 4; s++) {
            const S = P[s];
            if (s > 0) for (const L of imgs[s - 1]) S.path(L.pts, { color: 'faint', width: 0.9, alpha: 0.7 });
            if (s === 3) for (const L of lines) S.path(L.pts.map((q) => F(q[0], q[1])), { color: 'green', width: 3.2, alpha: 0.55, dash: [5, 5] });
            for (const L of imgs[s]) S.path(L.pts, { color: L.fam, width: 1.5 });
            if (s === 3 && flip) S.line(-5, -5, 5, 5, { color: 'purple', width: 1.2, dash: [6, 4], alpha: 0.8 });
            if (s > 0) for (const q of s === 3 ? corners : nodes) { const A = stages[s - 1](...q), Bq = stages[s](...q); if (Math.hypot(Bq[0] - A[0], Bq[1] - A[1]) > 1e-3) S.arrow(A[0], A[1], Bq[0], Bq[1], { color: 'gold', width: 1.3, head: 6, alpha: 0.85 }); }
            const path = stages.slice(0, s + 1).map((T) => T(p.x, p.y));
            S.path(path, { color: 'gold', width: 2, dash: [4, 3] });
            const q = path[path.length - 1];
            S.dot(0, 0, { color: 'ink', r: 3 });
            if (s > 0) S.dot(q[0], q[1], { color: 'gold', r: 5.5 });
          }
          P[3].setTitle(flip ? 'after $B_1$ (swap $x_1\\leftrightarrow x_2$) $=F(\\mathbf x)$' : '$B_1=I$: already $G_2\\circ G_1=F$');
          if (broken) {
            P[0].corner('J_G₁ changes sign: G₁ is not 1-1 here', 'tl', { color: 'red', weight: 600 });
            P[2].corner('no primitive G₂ with G₂∘G₁ = F', 'tl', { color: 'red', weight: 600 });
          } else P[3].corner('matches F', 'tl', { color: 'green', weight: 600 });
          // independent check of J_{G_2} via a numerical inverse of G_1
          const inv1 = (y1, y2) => M.newton((s) => F(s, y2)[k] - y1, p.x, 40);
          const G2o = (y1, y2) => F(inv1(y1, y2), y2)[o];
          const q1 = S1(p.x, p.y);
          const jg1 = JG1(p.x, p.y), jg2 = broken ? NaN : (G2o(q1[0], q1[1] + 1e-5) - G2o(q1[0], q1[1] - 1e-5)) / 2e-5;
          const JF = jac2(F, p.x, p.y), jf = JF[0][0] * JF[1][1] - JF[0][1] * JF[1][0];
          st = { jg1, jg2, flip, jf, broken, k };
        });
        v.readout(() => {
          const s = st; if (s.broken) return `$J_{G_1}$ takes both signs on this neighbourhood, so $G_1$ is not invertible there. ` + (s.k === 0 && mode.value === 'never' ? 'Since $D_1F_1(\\mathbf 0)=0$, Rudin first applies a flip and lets $G_1$ replace $x_1$ by $F_2(\\mathbf x)$ instead.' : 'Shrink $r$.');
          return `At $\\mathbf p$: $J_{G_1}=${v.fix(s.jg1, 4)}$, $\\;J_{G_2}=${v.fix(s.jg2, 4)}$ (from a numerical inverse of $G_1$), $\\;\\det B_1=${s.flip ? -1 : 1}$; product $=${v.fix(s.jg1 * s.jg2 * (s.flip ? -1 : 1), 4)}$ $\\;=\\;J_F(\\mathbf p)=${v.fix(s.jf, 4)}$.`;
        });
      },
    },
  ],
};
