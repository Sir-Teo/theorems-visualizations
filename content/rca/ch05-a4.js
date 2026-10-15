// Rudin, Real and Complex Analysis — Chapter 5, part 4: consequences of the Hahn–Banach theorem (5.19–5.21).

// barycentric interpolation at the Chebyshev points x_j = cos(jπ/N), j = 0..N
function chebInterp(f, N) {
  const xs = [], fs = [], ws = [];
  for (let j = 0; j <= N; j++) { const x = Math.cos(Math.PI * j / N); xs.push(x); fs.push(f(x)); ws.push((j % 2 ? -1 : 1) * (j === 0 || j === N ? 0.5 : 1)); }
  return (x) => {
    let num = 0, den = 0;
    for (let j = 0; j <= N; j++) { const d = x - xs[j]; if (Math.abs(d) < 1e-14) return fs[j]; const t = ws[j] / d; num += t * fs[j]; den += t; }
    return num / den;
  };
}
const dualExp = (p) => (p === 1 ? Infinity : p === Infinity ? 1 : p / (p - 1));

export default {
  collection: 'rca',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.19
    {
      num: '5.19',
      kind: 'Theorem',
      name: 'Closure of a subspace via annihilating functionals',
      statement: String.raw`Let $M$ be a linear subspace of a normed linear space $X$ and let $x_0\in X$. Then $x_0$ lies in the closure $\overline M$ if and only if there is **no** bounded linear functional $f$ on $X$ with $f(x)=0$ for all $x\in M$ but $f(x_0)\ne0$.`,
      idea: String.raw`If $x_0\in\overline M$ and $f$ vanishes on $M$, continuity forces $f(x_0)=0$. Conversely, if $x_0\notin\overline M$, then $\delta=\inf_{x\in M}\norm{x-x_0}>0$. On $M+\C x_0$ define $f(x+\lambda x_0)=\lambda\delta$; it vanishes on $M$ and has norm at most $1$, because $\norm{x+\lambda x_0}\ge\abs\lambda\delta$. The Hahn–Banach theorem (5.16) extends it to all of $X$.`,
      caption: String.raw`$X=C[-1,1]$ with the sup norm and $M$ = the even polynomials, whose closure is the even continuous functions. Choose $x_0$ and the degree. For even $x_0$ (also $|x|$, which is not in $M$) even polynomials approximate it ever better, and every functional killing $M$ kills $x_0$. For other $x_0$ the error never drops below $\norm{x_{0,\mathrm{odd}}}_\infty$, and the functional $\Lambda g=\frac12\bigl(g(t^*)-g(-t^*)\bigr)$ — two half point masses — vanishes on $M$ but not at $x_0$.`,
      deps: ['rca-5.16'],
      see: ['fa-3.5', 'fa-3.4'],
      tags: ['Hahn–Banach', 'closure', 'duality'],
      viz(v) {
        const M = v.M;
        const FN = {
          abs: { label: '$|x|$', f: (x) => Math.abs(x) },
          cos: { label: '$\\cos 4x$', f: (x) => Math.cos(4 * x) },
          exp: { label: '$e^{x}$', f: (x) => Math.exp(x) },
          mix: { label: '$x^2+0.6x^3$', f: (x) => x * x + 0.6 * x * x * x },
        };
        const which = v.select('$x_0$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const nS = v.slider('degree $2n$, $n=$', 1, 12, 4, { int: true });
        const top = v.stage({ x: [-1.05, 1.05], y: [-1.2, 2.9], height: 240, full: true, axes: 'box', title: '$x_0$ and its even polynomial approximant $p\\in M$ of degree $2n$' });
        const E = v.stage({ x: [0.3, 12.7], y: [0, 1], height: 220, axes: 'box', xticks: [1, 3, 5, 7, 9, 11].map((n) => [n, String(2 * n)]), title: '$\\|x_0-p\\|_\\infty$ against the degree' });
        const A = v.stage({ x: [-1.2, 1.2], y: [-1.35, 1.35], height: 220, axes: 'box', title: 'the odd part $x_{0,\\mathrm{odd}}$ and the functional $\\Lambda$' });
        const xs = M.linspace(-1, 1, 801);
        let st = null;
        v.render(() => {
          const F = FN[which.value], f = F.f, n = nS.value;
          const fe = (x) => (f(x) + f(-x)) / 2, fo = (x) => (f(x) - f(-x)) / 2;
          const errs = []; let pN = null;
          for (let k = 1; k <= 12; k++) {
            const p = chebInterp(fe, 2 * k);
            errs.push([k, Math.max(...xs.map((x) => Math.abs(f(x) - p(x))))]);
            if (k === n) pN = p;
          }
          const ko = M.argmax(xs, (x) => Math.abs(fo(x))), ts = Math.abs(xs[ko]), dist = Math.abs(fo(xs[ko]));
          const even = dist < 1e-9;
          // top
          const ys = xs.map(f).concat(xs.map(pN));
          top.setView(null, [Math.min(...ys) - 0.25, Math.max(...ys) + 0.3]);
          top.between(f, pN, -1, 1, { fill: 'red', fillAlpha: 0.14 });
          top.fn(f, { domain: [-1, 1], color: 'ink', width: 2.4 });
          top.fn(pN, { domain: [-1, 1], color: 'green', width: 2 });
          top.tex('x_0', 0.92, f(0.92), { color: 'ink', align: 'right', baseline: 'bottom', dx: -4, dy: -4 });
          // errors
          const ymax = Math.max(...errs.map((e) => e[1]), dist) * 1.15 + 1e-3;
          E.setView(null, [-0.12 * ymax, ymax]);
          if (!even) { E.hline(dist, { color: 'red', width: 1.6, dash: [6, 4] }); E.tex('\\operatorname{dist}(x_0,\\overline M)=\\|x_{0,\\mathrm{odd}}\\|_\\infty', 12.5, dist, { align: 'right', baseline: 'bottom', dy: -4, color: 'red', size: 13 }); }
          E.path(errs, { color: even ? 'green' : 'red', width: 1.6 });
          E.dots(errs, { r: 3, color: even ? 'green' : 'red' });
          E.dot(n, errs[n - 1][1], { color: 'gold', r: 6 });
          // annihilating functional
          A.fn(fo, { domain: [-1, 1], color: 'purple', width: 2.2 });
          const tt = even ? 0.6 : ts;
          A.line(tt, 0, tt, 0.5, { color: 'gold', width: 3 }); A.dot(tt, 0.5, { color: 'gold', r: 5 });
          A.line(-tt, 0, -tt, -0.5, { color: 'gold', width: 3 }); A.dot(-tt, -0.5, { color: 'gold', r: 5 });
          A.tex('+\\tfrac12\\delta_{t^*}', tt, 0.5, { color: 'gold', align: tt > 0.6 ? 'right' : 'center', dx: tt > 0.6 ? -8 : 0, baseline: 'bottom', dy: -6, size: 13 });
          A.tex('-\\tfrac12\\delta_{-t^*}', -tt, -0.5, { color: 'gold', align: tt > 0.6 ? 'left' : 'center', dx: tt > 0.6 ? 8 : 0, baseline: 'top', dy: 6, size: 13 });
          if (!even) A.dot(ts, fo(ts), { color: 'red', r: 4.5 });
          st = { even, dist, err: errs[n - 1][1], lam: fo(tt), tt, n };
        });
        v.legend([['ink', '$x_0$'], ['green', 'even polynomial $p$'], ['red', '$|x_0-p|$', { area: true }], ['purple', 'odd part of $x_0$'], ['gold', '$\\Lambda=\\tfrac12(\\delta_{t^*}-\\delta_{-t^*})$, $\\|\\Lambda\\|=1$, $\\Lambda|_M=0$']]);
        v.readout(() => {
          if (!st) return '';
          const head = `degree $${2 * st.n}$: $\\|x_0-p\\|_\\infty = ${v.fix(st.err, 4)}$. `;
          return head + (st.even
            ? `$x_0$ is even: the error tends to $0$, so $x_0\\in\\overline M$, and every functional vanishing on $M$ — e.g. $\\Lambda$ with $t^*=${v.fix(st.tt, 2)}$ — gives $\\Lambda x_0 = ${v.fix(st.lam, 4)}$.`
            : `$\\Lambda x_0 = x_{0,\\mathrm{odd}}(t^*) = ${v.fix(st.lam, 4)} \\ne 0$ with $t^*=${v.fix(st.tt, 3)}$, so $x_0\\notin\\overline M$; indeed no even $p$ gets closer than $${v.fix(st.dist, 4)}$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 5.20
    {
      num: '5.20',
      kind: 'Theorem',
      name: 'Norming functionals exist',
      statement: String.raw`If $X$ is a normed linear space and $x_0\in X$, $x_0\ne0$, then there is a bounded linear functional $f$ on $X$ with $\norm f=1$ and $f(x_0)=\norm{x_0}$.`,
      idea: String.raw`On the one-dimensional subspace $\C x_0$ put $f(\lambda x_0)=\lambda\norm{x_0}$; it has norm exactly $1$ there. Extend it by the Hahn–Banach theorem (5.16) without increasing the norm.`,
      caption: String.raw`$X=C[0,1]$; drag the four points that shape $x_0$ and choose the norm. The green object represents a norming functional: for the sup norm, a point mass $\pm\delta_{t^*}$ at a point where $|x_0|$ is largest; for the $L^1$ norm, integration against $\operatorname{sgn}x_0$; for the $L^2$ norm, the inner product with $x_0/\norm{x_0}_2$. In each case $\norm f=1$ and $f(x_0)$ equals $\norm{x_0}$ exactly.`,
      deps: ['rca-5.16'],
      see: ['fa-3.3', 'fa-4.3'],
      tags: ['Hahn–Banach', 'duality'],
      viz(v) {
        const M = v.M;
        const nm = v.select('norm', [{ value: 'sup', label: '$\\|\\cdot\\|_\\infty$' }, { value: 'l1', label: '$\\|\\cdot\\|_1$' }, { value: 'l2', label: '$\\|\\cdot\\|_2$' }], 'sup');
        const top = v.stage({ x: [-0.03, 1.03], y: [-1.3, 1.3], height: 250, full: true, axes: 'box', title: 'the vector $x_0\\in C[0,1]$' });
        const bot = v.stage({ x: [-0.03, 1.03], y: [-1.5, 1.5], height: 210, full: true, axes: 'box', title: 'a norming functional $f$, $\\|f\\|=1$, drawn as a measure / density' });
        const XS = [0, 1 / 3, 2 / 3, 1];
        const H = [[0, -0.35], [1 / 3, 0.75], [2 / 3, -0.55], [1, 0.3]].map(([x, y]) => top.handle(x, y, { color: 'ink', r: 6, constrain: (xx, yy) => [x, M.clamp(yy, -1.1, 1.1)] }));
        const xs = M.linspace(0, 1, 1201);
        let st = null;
        v.render(() => {
          const x0 = M.lagrange(XS, H.map((h) => h.y));
          const vals = xs.map(x0);
          const k = M.argmax(vals, (y) => Math.abs(y)), ts = xs[k], sup = Math.abs(vals[k]);
          const l1 = M.integrate((x) => Math.abs(x0(x)), 0, 1, 1200);
          const l2 = Math.sqrt(M.integrate((x) => x0(x) ** 2, 0, 1, 1200));
          const m = nm.value;
          const ymax = Math.max(1.2, sup * 1.15);
          top.setView(null, [-ymax, ymax]);
          if (m === 'sup') top.hband(-sup, sup, { color: 'accent', alpha: 0.08, edges: true });
          if (m === 'l1') top.fn((x) => Math.abs(x0(x)), { domain: [0, 1], color: 'accent', width: 1, fill: 'accent', fillAlpha: 0.15, dash: [4, 4] });
          if (m === 'l2') top.fn((x) => x0(x) ** 2, { domain: [0, 1], color: 'accent', width: 1, fill: 'accent', fillAlpha: 0.15, dash: [4, 4] });
          top.fn(x0, { domain: [0, 1], color: 'ink', width: 2.4 });
          if (m === 'sup') top.dot(ts, vals[k], { color: 'green', r: 5, label: 't*', labelPos: vals[k] > 0 ? 'n' : 's' });
          top.tex('x_0', 0.06, x0(0.06), { color: 'ink', baseline: 'bottom', dy: -8 });
          // the functional (x0 repeated faintly for reference)
          let fx = 0, norm = 0;
          const faintX0 = (sc) => bot.fn((x) => x0(x) * sc, { domain: [0, 1], color: 'muted', width: 1.2, dash: [4, 4], alpha: 0.7 });
          if (m === 'sup') {
            const sg = Math.sign(vals[k]) || 1;
            bot.setView(null, [-1.5, 1.5]);
            faintX0(1);
            bot.line(ts, 0, ts, sg, { color: 'green', width: 4 });
            bot.dot(ts, sg, { color: 'green', r: 6 });
            bot.tex(sg > 0 ? '+\\delta_{t^*}' : '-\\delta_{t^*}', ts, sg, { color: 'green', align: ts > 0.8 ? 'right' : 'left', dx: ts > 0.8 ? -10 : 10, size: 15 });
            fx = sg * vals[k]; norm = sup;
          } else if (m === 'l1') {
            bot.setView(null, [-1.5, 1.5]);
            faintX0(1);
            bot.fn((x) => Math.sign(x0(x)), { domain: [0, 1], color: 'green', width: 2.4, fill: 'green', fillAlpha: 0.18, n: 2000 });
            bot.tex('\\operatorname{sgn} x_0', 0.02, 1.25, { color: 'green', align: 'left', size: 14 });
            fx = M.integrate((x) => x0(x) * Math.sign(x0(x)), 0, 1, 1200); norm = l1;
          } else {
            const g = (x) => x0(x) / l2;
            const gm = Math.max(...xs.map((x) => Math.abs(g(x))));
            bot.setView(null, [-gm * 1.2, gm * 1.2]);
            bot.fn(g, { domain: [0, 1], color: 'green', width: 2.4, fill: 'green', fillAlpha: 0.18 });
            bot.tex('x_0/\\|x_0\\|_2', 0.02, gm * 1.0, { color: 'green', align: 'left', size: 14 });
            fx = M.integrate((x) => x0(x) * g(x), 0, 1, 1200); norm = l2;
          }
          st = { m, fx, norm };
        });
        v.legend([['ink', '$x_0$ (dashed copy below)'], ['accent', 'what the norm measures', { area: true }], ['green', 'norming functional $f$']]);
        v.readout(() => {
          if (!st) return '';
          const dual = { sup: '\\text{total mass } 1', l1: '\\|\\operatorname{sgn}x_0\\|_\\infty = 1', l2: '\\|x_0/\\|x_0\\|_2\\|_2 = 1' }[st.m];
          return `$\\|f\\| = 1$ $(${dual})$, $\\quad f(x_0) = ${v.fix(st.fx, 4)} = \\|x_0\\| = ${v.fix(st.norm, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.21
    {
      num: '5.21',
      kind: 'Corollary',
      name: 'The dual norms the space and separates its points',
      statement: String.raw`Let $X$ be a normed linear space and $X^*$ the space of bounded linear functionals on $X$. For every $x\in X$,
$$\norm{x}=\sup\{\abs{f(x)}:\ f\in X^*,\ \norm f\le1\},$$
and the supremum is attained. Consequently $X^*$ separates points (if $x\ne y$ some $f\in X^*$ has $f(x)\ne f(y)$), and the evaluation map $x\mapsto\hat x$, $\hat x(f)=f(x)$, embeds $X$ isometrically into the dual of $X^*$.`,
      idea: String.raw`$\abs{f(x)}\le\norm f\norm x$ gives "$\ge$", and a norming functional from 5.20 attains equality. Apply this to $x-y$ to separate points; the isometry statement is the norm formula read as $\norm{\hat x}=\norm{x}$.`,
      caption: String.raw`$X=\R^2$ with the $\ell^p$ norm. Left: each grey segment is a piece of a level set $\{f=1\}$ of a functional on the dual unit sphere, drawn where it touches the ball; the half-planes $\{f\le1\}$ together carve out the unit ball. Drag $x$ (and $y$). Right: the values $f_\varphi(x)$ as $f_\varphi$ runs once around the dual unit sphere; their maximum is exactly $\norm{x}_p$, attained at the green functional, whose level line through $x$ is drawn. The functional that norms $x-y$ separates $x$ from $y$.`,
      deps: ['rca-5.20'],
      see: ['fa-4.3'],
      verify: true,
      tags: ['duality', 'Hahn–Banach'],
      viz(v) {
        const M = v.M;
        const sel = v.select('$p$', [{ value: '1', label: '$1$' }, { value: '1.5', label: '$\\tfrac32$' }, { value: '2', label: '$2$' }, { value: '4', label: '$4$' }, { value: 'inf', label: '$\\infty$' }], '4');
        const L = v.stage({ x: [-1.9, 1.9], y: [-1.6, 1.6], equal: true, height: 330, axes: false, title: 'unit ball $=\\bigcap\\{f\\le1\\}$ over $\\|f\\|=1$' });
        const R = v.stage({ x: [0, 2 * Math.PI], y: [-1.6, 1.6], height: 330, axes: 'box', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [3 * Math.PI / 2, '3π/2'], [2 * Math.PI, '2π']], title: '$\\varphi\\mapsto f_\\varphi(x)$ over the dual unit sphere' });
        const hx = L.handle(1.25, 0.5, { color: 'blue', label: 'x' });
        const hy = L.handle(-0.6, 0.85, { color: 'purple', label: 'y' });
        let st = null;
        v.render(() => {
          const p = sel.value === 'inf' ? Infinity : +sel.value, q = dualExp(p);
          // dual unit sphere, parametrised by the angle φ
          const NS = 720, phis = M.linspace(0, 2 * Math.PI, NS + 1);
          const dual = phis.map((ph) => { const c = Math.cos(ph), s = Math.sin(ph), r = 1 / M.norm([c, s], q); return [r * c, r * s]; });
          const ball = M.unitBall(p, 480);
          for (let k = 0; k < NS; k += 15) {
            const a = dual[k], an = Math.hypot(a[0], a[1]), t = [-a[1] / an, a[0] / an];
            const P0 = ball[M.argmax(ball, (b) => a[0] * b[0] + a[1] * b[1])];
            L.line(P0[0] - 0.55 * t[0], P0[1] - 0.55 * t[1], P0[0] + 0.55 * t[0], P0[1] + 0.55 * t[1], { color: 'muted', width: 1, alpha: 0.55 });
          }
          L.poly(ball, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 2 });
          const x = [hx.x, hx.y], y = [hy.x, hy.y], nx = M.norm(x, p);
          const vals = dual.map((a) => a[0] * x[0] + a[1] * x[1]);
          const kb = M.argmax(vals), ab = dual[kb];
          // scaled ball through x and the norming level line
          L.poly(ball.map(([u, w]) => [u * nx, w * nx]), { color: 'blue', width: 1.2, dash: [5, 4] });
          const abn = Math.hypot(ab[0], ab[1]), nb = [ab[0] / abn, ab[1] / abn], tb = [-nb[1], nb[0]];
          L.line(x[0] - 4 * tb[0], x[1] - 4 * tb[1], x[0] + 4 * tb[0], x[1] + 4 * tb[1], { color: 'green', width: 2 });
          // separation of x and y: the functional norming x - y
          const d = [x[0] - y[0], x[1] - y[1]];
          const kd = M.argmax(dual, (a) => a[0] * d[0] + a[1] * d[1]), ad = dual[kd];
          const adn = Math.hypot(ad[0], ad[1]), nd = [ad[0] / adn, ad[1] / adn], td = [-nd[1], nd[0]];
          L.line(y[0] - 4 * td[0], y[1] - 4 * td[1], y[0] + 4 * td[0], y[1] + 4 * td[1], { color: 'purple', width: 1.2, dash: [3, 4] });
          L.line(x[0] - 4 * td[0], x[1] - 4 * td[1], x[0] + 4 * td[0], x[1] + 4 * td[1], { color: 'purple', width: 1.2, dash: [3, 4] });
          // right panel
          const mx = Math.max(1.3, nx * 1.2);
          R.setView(null, [-mx, mx]);
          R.path(phis.map((ph, i) => [ph, vals[i]]), { color: 'blue', width: 2.2 });
          R.hline(nx, { color: 'green', width: 1.4, dash: [6, 4] });
          R.hline(-nx, { color: 'green', width: 1, dash: [3, 4], alpha: 0.6 });
          R.dot(phis[kb], vals[kb], { color: 'green', r: 6 });
          R.text(`‖x‖ = ${v.fix(nx, 3)}`, 2 * Math.PI - 0.1, nx, { align: 'right', dy: -10, color: 'green', size: 12 });
          st = { p, nx, max: vals[kb], fxmy: ad[0] * d[0] + ad[1] * d[1], ab };
        });
        v.legend([['muted', 'pieces of the lines $\\{f=1\\}$, $\\|f\\|=1$'], ['blue', 'sphere of radius $\\|x\\|$', { dash: true }], ['green', 'norming functional at $x$'], ['purple', 'level lines of the functional separating $x$, $y$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const ps = st.p === Infinity ? '\\infty' : st.p;
          return `$\\max_\\varphi f_\\varphi(x) = ${v.fix(st.max, 4)} = \\|x\\|_{${ps}}$ (the sphere is sampled at 720 points); the functional norming $x-y$ gives $f(x)-f(y) = \\|x-y\\| = ${v.fix(st.fxmy, 4)} \\ne 0$.`;
        });
      },
    },
  ],
};
