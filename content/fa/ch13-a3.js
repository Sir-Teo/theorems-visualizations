// Rudin, Functional Analysis — Chapter 13 (part 3): adjoints of sums, products and inverses, null spaces
// and ranges, symmetric operators, closability, T*T, essential self-adjointness, maximal symmetry
//
// Numbering note: recalled, not checked against the book; items carry `verify: true`.

function simpson(f, a, b, n) {
  if (!(b > a)) return 0;
  if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return s * h / 3;
}
function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const p10 = (k) => (k === 0 ? '1' : k === 1 ? '10' : '10' + (k < 0 ? '⁻' : '') + String(Math.abs(k)).split('').map((d) => SUP[+d]).join(''));
const decTicks = (lo, hi, step = 1) => { const t = []; for (let k = Math.ceil(lo / step) * step; k <= Math.floor(hi); k += step) t.push([k, p10(k)]); return t; };
/** Solve the tridiagonal system with sub-, main- and super-diagonals a, b, c (Thomas algorithm). */
function thomas(a, b, c, d) {
  const n = b.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
  cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
  x[n - 1] = dp[n - 1]; for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}

export default {
  book: 'fa',
  chapter: 13,
  items: [
    // ------------------------------------------------------------------ 13.2
    {
      num: '13.2',
      kind: 'Theorem',
      name: 'Adjoints reverse inclusions; adjoints of sums and products',
      statement: String.raw`Let $S$ and $T$ be densely defined operators in $H$.
(a) If $S\subset T$, then $T^*\subset S^*$.
(b) $(\alpha T)^*=\bar\alpha T^*$ for $\alpha\ne0$; and $(S+T)^*\supset S^*+T^*$, $(ST)^*\supset T^*S^*$ whenever $S+T$, resp. $ST$, is densely defined.
(c) If $S\in B(H)$, then $(S+T)^*=S^*+T^*$ and $(ST)^*=T^*S^*$.`,
      idea: String.raw`(a) If $y\in\mathscr D(T^*)$, then $x\mapsto(Sx,y)=(Tx,y)=(x,T^*y)$ is bounded on the smaller domain $\mathscr D(S)$, so $S^*y=T^*y$: fewer test vectors impose fewer conditions. (b) is the same bookkeeping, keeping track of where each side is defined. (c) For bounded $S$, $(STx,y)=(Tx,S^*y)$, which is bounded in $x$ exactly when $S^*y\in\mathscr D(T^*)$. That is the domain of $T^*S^*$.`,
      caption: String.raw`$T=-i\,d/dx$ on $L^2[0,1]$, with the domain fixed by a condition on the boundary values $(f(0),f(1))$ (real values for simplicity). Integration by parts gives $(Tf,g)-(f,T^*g)=-i\big(f(1)\bar g(1)-f(0)\bar g(0)\big)$. So $g\in\mathscr D(T^*)$ exactly when its boundary values make this vanish for **every** $f\in\mathscr D(T)$. Blue: the allowed boundary values of $f$. Green: those of $g\in\mathscr D(T^*)$. Enlarging $\mathscr D(T)$ (point → line → plane) shrinks $\mathscr D(T^*)$ (plane → line → point). For $f(1)=mf(0)$ the adjoint condition is $g(1)=g(0)/m$, and $T$ is self-adjoint exactly when $m=\pm1$. Drag $g$ and watch the boundary term.`,
      deps: ['fa-13.1'],
      tags: ['unbounded operators', 'adjoint', 'boundary conditions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const dom = v.select('$\\mathscr D(T)$', [{ value: 'zero', label: '$f(0)=f(1)=0$' }, { value: 'line', label: '$f(1)=m\\,f(0)$' }, { value: 'free', label: 'no condition' }], 'line', { onChange: (d) => { mS.el.hidden = d !== 'line'; } });
        const mS = v.slider('$m$', -3, 3, 0.5, { step: 0.01 });
        v.button('put $g$ in $\\mathscr D(T^*)$', () => { const d = dom.value, m = mS.value; if (d === 'free') hg.set(0, 0); else if (d === 'line') { const u = [m, 1], n = Math.hypot(...u), t = (hg.x * u[0] + hg.y * u[1]) / (n * n); hg.set(t * u[0], t * u[1]); } });
        const P = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 340, axes: true, title: 'boundary values $(\\varphi(0),\\varphi(1))$' });
        const F = v.stage({ x: [-0.03, 1.03], y: [-2.4, 2.4], height: 340, axes: true, title: 'a sample $f\\in\\mathscr D(T)$ (blue) and $g$ (orange)' });
        const hg = P.handle(0.9, 1.3, { color: 'orange', label: 'g' });
        let st = {};
        v.legend([['blue', 'boundary values allowed in $\\mathscr D(T)$'], ['green', 'boundary values allowed in $\\mathscr D(T^*)$']]);
        v.render(() => {
          const d = dom.value, m = mS.value, a = hg.x, b = hg.y;
          P.tex('\\varphi(0)', 1.6, 0.22, { color: 'muted', size: 13 }); P.tex('\\varphi(1)', 0.28, 1.85, { color: 'muted', size: 13 });
          let fp, ok;
          if (d === 'zero') {
            P.rect(-2.2, -2.2, 2.2, 2.2, { color: 'green', fill: 'green', fillAlpha: 0.1, stroke: false });
            P.dot(0, 0, { color: 'blue', r: 7 }); fp = [0, 0]; ok = true;
          } else if (d === 'free') {
            P.rect(-2.2, -2.2, 2.2, 2.2, { color: 'blue', fill: 'blue', fillAlpha: 0.1, stroke: false });
            P.dot(0, 0, { color: 'green', r: 7 });
            const n = Math.hypot(a, b) || 1; fp = [-a / n, b / n]; ok = Math.hypot(a, b) < 0.04;
          } else {
            const u = [1, m], n = Math.hypot(...u);
            P.line(-3 * u[0] / n, -3 * u[1] / n, 3 * u[0] / n, 3 * u[1] / n, { color: 'blue', width: 4, alpha: 0.75 });
            const w = [m, 1], nw = Math.hypot(...w);
            P.line(-3 * w[0] / nw, -3 * w[1] / nw, 3 * w[0] / nw, 3 * w[1] / nw, { color: 'green', width: 2.6, dash: Math.abs(Math.abs(m) - 1) < 0.01 ? [8, 6] : false });
            fp = [u[0] / n, u[1] / n]; ok = Math.abs(m * b - a) / nw < 0.03;
          }
          const beta = fp[1] * b - fp[0] * a;
          P.line(0, 0, a, b, { color: 'orange', width: 1, dash: [3, 3] });
          const f = (x) => fp[0] * (1 - x) + fp[1] * x + 1.1 * Math.sin(Math.PI * x);
          const g = (x) => a * (1 - x) + b * x + 0.6 * Math.sin(2 * Math.PI * x);
          F.fn(f, { color: 'blue', width: 2.4, domain: [0, 1] });
          F.fn(g, { color: 'orange', width: 2.4, domain: [0, 1] });
          [[0, f(0)], [1, f(1)]].forEach(([x, y]) => F.dot(x, y, { color: 'blue', r: 4.5 }));
          [[0, g(0)], [1, g(1)]].forEach(([x, y]) => F.dot(x, y, { color: 'orange', r: 4.5 }));
          st = { d, m, beta, ok };
        });
        v.readout(() => {
          const s = st, sa = s.d === 'line' && Math.abs(Math.abs(s.m) - 1) < 0.01;
          return `For the sample $f$: $f(1)g(1)-f(0)g(0)=${v.fix(s.beta, 3)}$. ` + (s.ok ? '$g\\in\\mathscr D(T^*)$: the boundary term vanishes for every $f\\in\\mathscr D(T)$.' : '$g\\notin\\mathscr D(T^*)$.') + (s.d === 'line' ? (sa ? ' Here $\\mathscr D(T^*)=\\mathscr D(T)$: **self-adjoint**.' : ` Adjoint condition $g(1)=g(0)/m$ with $1/m=${Math.abs(s.m) < 1e-3 ? '\\infty' : v.fix(1 / s.m, 3)}\\ne m$: not self-adjoint.`) : '');
        });
      },
    },
    // ------------------------------------------------------------------ 13.5
    {
      num: '13.5',
      kind: 'Theorem',
      name: 'The adjoint of the inverse: (T⁻¹)* = (T*)⁻¹',
      statement: String.raw`Let $T$ be densely defined and one-to-one, with dense range $\mathscr R(T)$. Then $T^*$ is one-to-one, and
$$(T^{-1})^*=(T^*)^{-1}.$$`,
      idea: String.raw`$T^{-1}$ is densely defined on $\mathscr R(T)$, so it has an adjoint. For $y\in\mathscr D(T^*)$ and $x=Tz$, $(T^{-1}x,T^*y)=(z,T^*y)=(Tz,y)=(x,y)$. So $T^*y\in\mathscr D((T^{-1})^*)$ and $(T^{-1})^*T^*y=y$. The symmetric computation with the roles exchanged gives $T^*(T^{-1})^*w=w$ for $w\in\mathscr D((T^{-1})^*)$. In graph language: inverting flips $(x,y)\mapsto(y,x)$, adjoining rotates and takes complements, and the two operations commute.`,
      caption: String.raw`$Tf=f'+af$ on $L^2[0,1]$ with $f(0)=0$. Then $T^{-1}g(x)=\int_0^xe^{-a(x-y)}g(y)\,dy$, a Volterra operator whose kernel lives below the diagonal (blue). Its adjoint has the mirrored kernel, above the diagonal (orange): $(T^{-1})^*h(x)=\int_x^1e^{-a(y-x)}h(y)\,dy$. Drag the point to compare $K(x,y)$ with the mirrored value. Right: for a bump $g$ (drag it), $u=(T^{-1})^*g$ (purple) satisfies $u(1)=0$ and $-u'+au=g$ (green dashed, by finite differences). That is, it inverts $T^*=-d/dx+a$ on $\{u(1)=0\}$. Faint blue: $T^{-1}g$, which starts at $0$ instead.`,
      deps: ['fa-13.1', 'fa-13.2'],
      tags: ['unbounded operators', 'adjoint', 'inverse'],
      verify: true,
      viz(v) {
        const M = v.M;
        const aS = v.slider('$a$ in $Tf=f\'+af$', -3, 3, 1.2, { step: 0.01 });
        const K = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 330, axes: 'box', xlabel: 'x', ylabel: 'y', title: 'kernels of $T^{-1}$ (below) and $(T^{-1})^*$ (above)' });
        const F = v.stage({ x: [0, 1], y: [-1, 1], height: 330, axes: true, title: '$u=(T^{-1})^*g$ inverts $T^*$' });
        const hp = K.handle(0.72, 0.3, { color: 'ink', label: '(x,y)' });
        const hc = F.handle(0.45, 0, { color: 'orange', label: 'g', labelPos: 's', constrain: (x) => [M.clamp(x, 0.15, 0.85), 0] });
        let st = {};
        v.legend([['blue', '$K(x,y)$, $T^{-1}$'], ['orange', '$K(y,x)$, $(T^{-1})^*$'], ['purple', '$u$'], ['green', '$T^*u=-u\'+au$', { dash: true }]]);
        v.render(() => {
          const a = aS.value, Kf = (x, y) => (y < x ? Math.exp(-a * (x - y)) : 0), top = Math.exp(Math.abs(a));
          const cb = v.rgb('blue'), co = v.rgb('orange');
          K.raster((x, y) => { const lo = y < x, val = lo ? Kf(x, y) : Kf(y, x), t = Math.min(1, val / top), c = lo ? cb : co; return [c[0], c[1], c[2], 25 + 200 * t]; }, { key: `k${a}`, res: 3 });
          K.line(0, 0, 1, 1, { color: 'ink', width: 1.2, dash: [4, 3] });
          K.dot(hp.y, hp.x, { color: 'ink', r: 4, hollow: true, label: '(y,x)', labelPos: 'ne' });
          K.line(hp.x, hp.y, hp.y, hp.x, { color: 'muted', width: 1, dash: [2, 3] });
          // u(x) = ∫_x^1 e^{−a(y−x)} g(y) dy and w = T^{-1} g, on a grid
          const n = 2400, h = 1 / n, c = hc.x, r = 0.12;
          const g = (x) => { const t = (x - c) / r, s = 1 - t * t; return s > 0 ? Math.E * Math.exp(-1 / s) : 0; };
          const xs = M.linspace(0, 1, n + 1), u = new Float64Array(n + 1), w = new Float64Array(n + 1);
          for (let i = n - 1; i >= 0; i--) u[i] = u[i + 1] * Math.exp(-a * h) + 0.5 * h * (g(xs[i]) + Math.exp(-a * h) * g(xs[i + 1]));
          for (let i = 1; i <= n; i++) w[i] = w[i - 1] * Math.exp(-a * h) + 0.5 * h * (g(xs[i]) + Math.exp(-a * h) * g(xs[i - 1]));
          const Tu = xs.map((x, i) => (i === 0 || i === n ? NaN : -(u[i + 1] - u[i - 1]) / (2 * h) + a * u[i]));
          F.setView(null, span([...u, ...w, 1, -0.1], 1, 0.1));
          F.fn(g, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.12, n: 600 });
          F.path(xs.map((x, i) => [x, w[i]]), { color: 'blue', width: 1.6, alpha: 0.5 });
          F.path(xs.map((x, i) => [x, u[i]]), { color: 'purple', width: 2.6 });
          F.path(xs.map((x, i) => [x, Tu[i]]), { color: 'green', width: 1.8, dash: [5, 4] });
          F.dot(1, u[n], { color: 'purple', r: 4.5 });
          let err = 0; for (let i = 2; i < n - 1; i++) err = Math.max(err, Math.abs(Tu[i] - g(xs[i])));
          st = { k1: Kf(hp.x, hp.y), k2: Kf(hp.y, hp.x), err, u1: u[n], u0: u[0] };
        });
        v.readout(() => {
          const s = st;
          return `Kernel of $T^{-1}$ at $(x,y)$: $${v.fix(s.k1, 4)}$; kernel of $(T^{-1})^*$ at the mirror point $(y,x)$: the same value, while $K(y,x)=${v.fix(s.k2, 4)}$, so $T^{-1}$ is not self-adjoint. $u(1)=${v.fix(s.u1, 4)}$, $\\max|T^*u-g|=${v.sci(s.err + 1e-17, 1)}$ (finite differences): $(T^{-1})^*=(T^*)^{-1}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 13.9
    {
      num: '13.9',
      kind: 'Theorem',
      name: 'Null spaces and ranges: N(T*) = R(T)^⊥',
      statement: String.raw`If $T$ is densely defined, then
$$\mathscr N(T^*)=\mathscr R(T)^\perp ,$$
so $\mathscr R(T)$ is dense iff $T^*$ is one-to-one. If moreover $T$ is closed, then $\mathscr N(T)=\mathscr R(T^*)^\perp$.`,
      idea: String.raw`$y\in\mathscr R(T)^\perp$ means $(Tx,y)=0=(x,0)$ for all $x\in\mathscr D(T)$, which says precisely that $y\in\mathscr D(T^*)$ and $T^*y=0$. For closed $T$ apply this to $T^*$, which is densely defined with $T^{**}=T$ (13.8). It is the unbounded version of 12.10. The range itself need not be closed; in the examples below it happens to be.`,
      caption: String.raw`$T=d/dx$ on $L^2[0,1]$ with four choices of domain. Drag the nodes of $g$. The adjoint $T^*=-d/dx$ carries the "dual" boundary condition. $\mathscr N(T^*)$ is the constants when $\mathscr D(T)$ is $\{f(0)=f(1)=0\}$ or periodic, and $\{0\}$ when it is antiperiodic or unrestricted. Top: $g$ split into its projection $Pg$ on $\mathscr N(T^*)$ (green) and the rest (purple). Bottom: an $f\in\mathscr D(T)$ with $Tf=g-Pg$, so $g-Pg\in\mathscr R(T)$. Its endpoints obey the chosen condition.`,
      deps: ['fa-13.8', 'fa-13.3'],
      see: ['fa-12.10'],
      tags: ['unbounded operators', 'adjoint', 'range'],
      verify: true,
      viz(v) {
        const M = v.M;
        const dom = v.select('$\\mathscr D(T)$', [{ value: 'zero', label: '$f(0)=f(1)=0$' }, { value: 'per', label: '$f(1)=f(0)$' }, { value: 'anti', label: '$f(1)=-f(0)$' }, { value: 'free', label: 'no condition' }], 'zero');
        const G = v.stage({ x: [0, 1], y: [-1.6, 2.1], height: 270, full: true, axes: true, title: '$g$ (drag the nodes) $=Pg+(g-Pg)$, with $Pg\\in\\mathscr N(T^*)$' });
        const Fs = v.stage({ x: [0, 1], y: [-1, 1], height: 210, full: true, axes: true, title: '$f\\in\\mathscr D(T)$ with $Tf=f\'=g-Pg$' });
        const NX = [0, 0.25, 0.5, 0.75, 1];
        const nodes = [0.8, 1.5, 0.2, 0.9, 1.3].map((y, k) => G.handle(NX[k], y, { color: 'blue', r: 5.5, constrain: (_, yy) => [NX[k], M.clamp(yy, -1.5, 2)] }));
        let st = {};
        v.legend([['blue', '$g$'], ['green', '$Pg$'], ['purple', '$g-Pg\\in\\mathscr R(T)$'], ['orange', '$f$']]);
        v.render(() => {
          const d = dom.value, Y = nodes.map((h) => h.y);
          const g = (x) => { const i = Math.min(3, Math.floor(x * 4)), t = x * 4 - i; return Y[i] * (1 - t) + Y[i + 1] * t; };
          const ig = (Y[0] / 2 + Y[1] + Y[2] + Y[3] + Y[4] / 2) / 4;    // ∫₀¹ g (trapezoid is exact for piecewise linear)
          const consts = d === 'zero' || d === 'per', Pg = consts ? ig : 0;
          const n = 400, xs = M.linspace(0, 1, n + 1), F = new Float64Array(n + 1);
          for (let i = 1; i <= n; i++) F[i] = F[i - 1] + (g(xs[i - 1]) + g(xs[i])) / 2 / n - Pg / n;
          const c0 = d === 'anti' ? -F[n] / 2 : 0;
          const f = Array.from(F, (y) => y + c0);
          G.fn(g, { color: 'blue', width: 2.4 });
          G.hline(Pg, { color: 'green', width: 2.2, dash: [6, 4] });
          G.fn((x) => g(x) - Pg, { color: 'purple', width: 1.8 });
          Fs.setView(null, span([...f, -0.2, 0.2], 0.6, 0.15));
          Fs.path(xs.map((x, i) => [x, f[i]]), { color: 'orange', width: 2.6 });
          Fs.dot(0, f[0], { color: 'orange', r: 5, label: `f(0)=${v.fix(f[0], 2)}`, labelPos: 'ne' });
          Fs.dot(1, f[n], { color: 'orange', r: 5, label: `f(1)=${v.fix(f[n], 2)}`, labelPos: 'nw' });
          st = { d, Pg, ig, f0: f[0], f1: f[n], consts };
        });
        v.readout(() => {
          const s = st;
          const nul = s.consts ? '$\\mathscr N(T^*)=$ constants, so $\\mathscr R(T)=\\{h:\\int_0^1h=0\\}$' : '$\\mathscr N(T^*)=\\{0\\}$, so $\\mathscr R(T)$ is dense (here all of $L^2$)';
          return nul + `. $\\int g=${v.fix(s.ig, 3)}$, $Pg=${v.fix(s.Pg, 3)}$; $f(0)=${v.fix(s.f0, 3)}$, $f(1)=${v.fix(s.f1, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 13.11
    {
      num: '13.11',
      kind: 'Theorem',
      name: 'Symmetric operators: everywhere defined, invertible, onto',
      statement: String.raw`Let $T$ be densely defined and symmetric.
(a) If $\mathscr D(T)=H$, then $T$ is self-adjoint and bounded (Hellinger–Toeplitz).
(b) If $T$ is self-adjoint and one-to-one, then $\mathscr R(T)$ is dense and $T^{-1}$ is self-adjoint.
(c) If $\mathscr R(T)$ is dense, then $T$ is one-to-one.
(d) If $\mathscr R(T)=H$, then $T$ is self-adjoint and $T^{-1}\in B(H)$.`,
      idea: String.raw`(a) $T\subset T^*$ and $T$ is defined everywhere, so $T=T^*$, which is closed (13.8); the closed graph theorem makes $T$ bounded. (c) If $Tx=0$, then $(x,Ty)=(Tx,y)=0$ for every $y\in\mathscr D(T)$, so $x\perp\mathscr R(T)$ and $x=0$. (b) $\mathscr R(T)^\perp=\mathscr N(T^*)=\mathscr N(T)=\{0\}$ (13.9), and $(T^{-1})^*=(T^*)^{-1}=T^{-1}$ (13.5). (d) By (c) $T$ is one-to-one, and $T^{-1}$ is symmetric and everywhere defined, hence bounded and self-adjoint by (a); then $T=(T^{-1})^{-1}$ is self-adjoint by (b). Differential operators are often studied through such bounded inverses, their Green's operators.`,
      caption: String.raw`$Tu=-u''+bu'+cu$ on $L^2[0,\pi]$ with $u(0)=u(\pi)=0$. Left: the kernel $G(x,y)$ of $T^{-1}$ (Green's function), computed by inverting a finite-difference matrix (red $>0$, blue $<0$). With $b=0$, $T$ is self-adjoint and $G(x,y)=G(y,x)$; drag the point to compare it with its mirror. A drift $b\ne0$ breaks self-adjointness and the symmetry of $G$. Right: $\sigma(T^{-1})=\{1/(k^2+c+b^2/4)\}$, accumulating only at $0$. As $c\to-1-b^2/4$, $T$ stops being one-to-one and $\norm{T^{-1}}$ blows up.`,
      deps: ['fa-13.8', 'fa-13.5', 'fa-13.9', 'fa-2.15'],
      tags: ['symmetric operators', 'self-adjoint operators', "Green's functions"],
      verify: true,
      viz(v) {
        const M = v.M;
        const cS = v.slider('$c$', -3.5, 3, 0.5, { step: 0.01 });
        const bS = v.slider('drift $b$', -2, 2, 0, { step: 0.01 });
        const L = v.stage({ x: [0, Math.PI], y: [0, Math.PI], equal: true, height: 330, axes: 'box', xlabel: 'x', ylabel: 'y', title: '$G(x,y)$, the kernel of $T^{-1}$' });
        const R = v.stage({ x: [-1.2, 1.2], y: [-1, 1], height: 330, weight: 0.8, axes: false, ticks: false, title: '$\\sigma(T^{-1})$ on $\\R$' });
        const hp = L.handle(2.2, 0.8, { color: 'ink', label: '(x,y)' });
        const n = 120, h = Math.PI / (n + 1);
        let cache = { key: '' }, st = {};
        v.render(() => {
          const c = cS.value, b = bS.value, key = `${c}|${b}`;
          if (cache.key !== key) {
            const A = new Float64Array(n), Bd = new Float64Array(n), Cd = new Float64Array(n);
            for (let i = 0; i < n; i++) { A[i] = -1 / (h * h) - b / (2 * h); Bd[i] = 2 / (h * h) + c; Cd[i] = -1 / (h * h) + b / (2 * h); }
            const Gm = [];
            for (let j = 0; j < n; j++) { const e = new Float64Array(n); e[j] = 1 / h; Gm.push(thomas(A, Bd, Cd, e)); }   // column j = G(·, y_j)
            let mx = 0, asym = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { mx = Math.max(mx, Math.abs(Gm[j][i])); asym = Math.max(asym, Math.abs(Gm[j][i] - Gm[i][j])); }
            cache = { key, Gm, mx, asym };
          }
          const { Gm, mx } = cache;
          const at = (x, y) => { const i = M.clamp(Math.round(x / h) - 1, 0, n - 1), j = M.clamp(Math.round(y / h) - 1, 0, n - 1); return Gm[j][i]; };
          L.heat((x, y) => at(x, y), { range: [-mx, mx], cmap: 'diverging', res: 3, key: `g${key}` });
          L.line(0, 0, Math.PI, Math.PI, { color: 'ink', width: 1, dash: [4, 3] });
          L.dot(hp.y, hp.x, { color: 'ink', r: 4, hollow: true, label: '(y,x)', labelPos: 'ne' });
          const shift = c + b * b / 4, mu = [];
          for (let k = 1; k <= 30; k++) mu.push(1 / (k * k + shift));
          const sc = 1 / Math.max(1, ...mu.map(Math.abs));
          R.line(-1.15, 0, 1.15, 0, { color: 'muted', width: 1.2 });
          R.text('0', 0, -0.12, { color: 'muted', size: 12 });
          mu.forEach((m, k) => R.dot(m * sc, 0, { color: 'purple', r: k < 4 ? 5 : 3 }));
          R.text(sc < 1 ? `scale ×${v.fmt(sc, 2)}` : 'scale ×1', 0, 0.6, { color: 'muted', size: 12 });
          st = { g1: at(hp.x, hp.y), g2: at(hp.y, hp.x), asym: cache.asym, mx, norm: Math.max(...mu.map(Math.abs)), shift, b };
        });
        v.readout(() => {
          const s = st;
          return `$G(x,y)=${v.fix(s.g1, 4)}$, $G(y,x)=${v.fix(s.g2, 4)}$ (largest asymmetry $${v.fix(s.asym, 4)}$). ` + (Math.abs(s.b) < 1e-9 ? 'Self-adjoint $T$: the kernel is symmetric, so $T^{-1}$ is self-adjoint. ' : 'With drift, $T$ is not self-adjoint and neither is $T^{-1}$. ') + `$\\|T^{-1}\\|\\ge\\rho(T^{-1})=${v.fix(s.norm, 3)}$` + (Math.abs(s.shift + 1) < 0.15 ? ' — close to an eigenvalue $0$ of $T$.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 13.12
    {
      num: '13.12',
      kind: 'Theorem',
      name: 'Closed operators: D(T*) is dense and T** = T',
      statement: String.raw`If $T$ is a closed, densely defined operator in $H$, then $\mathscr D(T^*)$ is dense and $T^{**}=T$. More generally, a densely defined $T$ has a closed extension (it is **closable**) if and only if $\mathscr D(T^*)$ is dense, and then $T^{**}=\overline T$, the operator whose graph is $\overline{\mathscr G(T)}$.`,
      idea: String.raw`$V(a,b)=(-b,a)$ is unitary with $V^2=-I$, so 13.8 gives $V\mathscr G(T^*)=(V^2\mathscr G(T))^\perp=\mathscr G(T)^\perp$. If $z\perp\mathscr D(T^*)$, then $(0,z)$ is orthogonal to every $(-T^*y,y)$, that is, to $V\mathscr G(T^*)=\mathscr G(T)^\perp$, so $(0,z)\in\overline{\mathscr G(T)}$. When the closure of the graph is again a graph, as it is for closed or closable $T$, this forces $z=0$. Applying 13.8 once more, $\mathscr G(T^{**})=(V\mathscr G(T^*))^\perp=\mathscr G(T)^{\perp\perp}=\overline{\mathscr G(T)}$.`,
      caption: String.raw`Two operators on $L^2[0,1]$ and a sequence $f_n\to0$. **Closable**: $Tf=f'$ on $C^1$ functions, $f_n=\frac1n\sin n\pi x$. $Tf_n=\pi\cos n\pi x$ does not converge, and for every $g\in\mathscr D(T^*)$ (a dense set; here $g=\sin^2\pi x$), $(Tf_n,g)=(f_n,T^*g)\to0$. So no limit other than $0$ is possible. **Not closable**: $Tf=f(0)\cdot1$ on $C[0,1]$, $f_n=(1-nx)^+$. Now $(f_n,Tf_n)\to(0,1)$: the closure of the graph contains $(0,1)$ and is not a graph. Correspondingly $\mathscr D(T^*)=\{g:\int_0^1g=0\}$ is not dense, since it misses the constants. Bottom: $\norm{f_n}$ and the Cauchy test $\norm{Tf_n-Tf_{2n}}$ against $n$.`,
      deps: ['fa-13.8', 'fa-13.1'],
      tags: ['closed operators', 'adjoint', 'graphs'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mode = v.select('$T$', [{ value: 'cl', label: "closable: $Tf=f'$" }, { value: 'nc', label: 'not closable: $Tf=f(0)\\cdot1$' }], 'nc');
        const nS = v.slider('$n$', 1, 400, 12, { int: true, log: true });
        const T = v.stage({ x: [0, 1], y: [-3.4, 3.4], height: 240, full: true, axes: true, title: '$f_n$ (blue) and $Tf_n$ (orange)' });
        const B = v.stage({ x: [0, Math.log10(400)], y: [-3, 1], height: 190, full: true, axes: 'box', xlabel: 'n', xticks: [[0, '1'], [1, '10'], [2, '100']], yticks: decTicks(-3, 1), title: '$\\|f_n\\|$ (blue) and $\\|Tf_n-Tf_{2n}\\|$ (orange), log scale' });
        let st = {};
        v.legend([['blue', '$f_n\\to0$'], ['orange', '$Tf_n$']]);
        v.render(() => {
          const cl = mode.value === 'cl', n = nS.value;
          const f = cl ? (x) => Math.sin(n * Math.PI * x) / n : (x) => Math.max(0, 1 - n * x);
          const Tf = cl ? (x) => Math.PI * Math.cos(n * Math.PI * x) : () => 1;
          T.setView(null, cl ? [-3.6, 3.6] : [-0.3, 1.4]);
          T.fn(Tf, { color: 'orange', width: 2, n: 1600 });
          T.fn(f, { color: 'blue', width: 2.6, n: 1600 });
          const ns = M.linspace(0, Math.log10(400), 120).map((l) => 10 ** l);
          const nf = (m) => (cl ? 1 / (m * Math.SQRT2) : 1 / Math.sqrt(3 * m)), cauchy = () => (cl ? Math.PI : 1e-3);
          B.path(ns.map((m) => [Math.log10(m), Math.log10(nf(m))]), { color: 'blue', width: 2.4 });
          B.path(ns.map((m) => [Math.log10(m), Math.log10(cauchy(m))]), { color: 'orange', width: 2.4 });
          if (!cl) B.text('Tfₙ = 1 for every n: exactly Cauchy', 1.3, -2.75, { color: 'orange', size: 12 });
          B.vline(Math.log10(n), { color: 'muted', width: 1, dash: [3, 3] });
          const g = (x) => Math.sin(Math.PI * x) ** 2, ip = simpson((x) => Tf(x) * g(x), 0, 1, 4000);
          st = { cl, n, nf: nf(n), ip };
        });
        v.readout(() => {
          const s = st;
          return s.cl ? `$\\|f_n\\|=${v.fix(s.nf, 4)}\\to0$, but $Tf_n$ is not Cauchy ($\\|Tf_n-Tf_{2n}\\|=\\pi$). For $g=\\sin^2\\pi x\\in\\mathscr D(T^*)$, $(Tf_n,g)=${v.sci(Math.abs(s.ip) + 1e-17, 2)}\\to0$: any limit of $Tf_n$ would be orthogonal to the dense set $\\mathscr D(T^*)$, hence $0$. $T$ is closable, and $T^{**}=\\overline T$.` : `$\\|f_n\\|=${v.fix(s.nf, 4)}\\to0$ while $Tf_n=1$: $(f_n,Tf_n)\\to(0,1)$, so $\\overline{\\mathscr G(T)}$ is not the graph of an operator. $\\mathscr D(T^*)=1^\\perp$ is not dense, and $T^{**}$ is not even defined.`;
        });
      },
    },
    // ------------------------------------------------------------------ 13.13
    {
      num: '13.13',
      kind: 'Theorem',
      name: 'von Neumann: I + T*T is invertible and T*T is self-adjoint',
      statement: String.raw`Let $T$ be closed and densely defined, and $Q=I+T^*T$ with $\mathscr D(Q)=\mathscr D(T^*T)$. Then $Q$ maps $\mathscr D(Q)$ one-to-one onto $H$, and
$$B=Q^{-1},\qquad C=TQ^{-1}$$
are bounded, with $\norm B\le1$, $\norm C\le1$, $B\ge0$. Moreover $T^*T$ is self-adjoint, and $\mathscr D(T^*T)$ is a core for $T$.`,
      idea: String.raw`By 13.8, $H\times H=V\mathscr G(T)\oplus\mathscr G(T^*)$. Split $(0,h)=(-Tx,x)+(y,T^*y)$. The first components give $y=Tx$, so $x\in\mathscr D(T^*T)$, and the second give $h=x+T^*Tx=Qx$. Orthogonality of the two pieces gives $\norm h^2=\norm x^2+2\norm{Tx}^2+\norm{T^*Tx}^2$, hence $\norm{Bh}=\norm x\le\norm h$ and $\norm{Ch}=\norm{Tx}\le\norm h$. $B$ is bounded, symmetric and everywhere defined, so self-adjoint (13.11(a)), and $T^*T=B^{-1}-I$ is self-adjoint by 13.11(b).`,
      caption: String.raw`$T=d/dx$ on $L^2[0,1]$, closed on either domain. The formal expression $T^*T=-d^2/dx^2$ is the same, but its boundary conditions are not. If $\mathscr D(T)$ has no condition, then $T^*=-d/dx$ with $u(0)=u(1)=0$, and $T^*T$ carries the **Neumann** conditions. If $\mathscr D(T)$ has $f(0)=f(1)=0$, then $T^*T$ is the **Dirichlet** Laplacian. Top: for $g$ (choose), $u=Bg$ solves $u-u''=g$ (purple), and $Cg=u'$ (green). Note the boundary behaviour. Bottom: the multipliers of $B$ and $C$ in the eigenbasis of $T^*T$, all $\le1$ and $\le\frac12$.`,
      deps: ['fa-13.8', 'fa-13.11', 'fa-13.12'],
      tags: ['closed operators', 'self-adjoint operators', 'boundary conditions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const dom = v.select('$\\mathscr D(T)$', [{ value: 'free', label: 'no condition (Neumann $T^*T$)' }, { value: 'dir', label: '$f(0)=f(1)=0$ (Dirichlet $T^*T$)' }], 'free');
        const gS = v.select('$g=$', [{ value: 'step', label: 'step' }, { value: 'ramp', label: '$x$' }, { value: 'spike', label: 'bump' }], 'step');
        const T = v.stage({ x: [0, 1], y: [-1, 1.4], height: 260, full: true, axes: true, title: '$g$ (gold), $u=Bg=(I+T^*T)^{-1}g$ (purple), $Cg=TBg=u\'$ (green)' });
        const Bs = v.stage({ x: [-0.6, 10.6], y: [-0.16, 1.1], height: 170, full: true, axes: 'box', xlabel: 'k', xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], title: 'multipliers of $B$ (purple) and $C$ (green) on the $k$-th eigenfunction' });
        const K = 120;
        let cache = { key: '' }, st = {};
        v.legend([['gold', '$g$'], ['purple', '$u=Bg$'], ['green', '$Cg$']]);
        v.render(() => {
          const free = dom.value === 'free', gk = gS.value, key = `${free}|${gk}`;
          const g = gk === 'step' ? (x) => (x < 0.6 ? 1 : -0.3) : gk === 'ramp' ? (x) => x : (x) => { const t = (x - 0.3) / 0.12, s = 1 - t * t; return s > 0 ? Math.E * Math.exp(-1 / s) : 0; };
          if (cache.key !== key) {
            const basis = (k, x) => (free ? (k === 0 ? 1 : Math.SQRT2 * Math.cos(k * Math.PI * x)) : Math.SQRT2 * Math.sin(k * Math.PI * x));
            const dbasis = (k, x) => (free ? (k === 0 ? 0 : -Math.SQRT2 * k * Math.PI * Math.sin(k * Math.PI * x)) : Math.SQRT2 * k * Math.PI * Math.cos(k * Math.PI * x));
            const ks = []; for (let k = free ? 0 : 1; k <= K; k++) ks.push(k);
            const co = ks.map((k) => simpson((x) => g(x) * basis(k, x), 0, 1, 3000));
            const xs = M.linspace(0, 1, 401);
            const u = xs.map((x) => ks.reduce((s, k, i) => s + co[i] / (1 + k * k * Math.PI * Math.PI) * basis(k, x), 0));
            const du = xs.map((x) => ks.reduce((s, k, i) => s + co[i] / (1 + k * k * Math.PI * Math.PI) * dbasis(k, x), 0));
            cache = { key, xs, u, du };
          }
          const { xs, u, du } = cache;
          T.setView(null, span([...u, ...du, -0.4, 1.1], 1, 0.08));
          T.fn(g, { color: 'gold', width: 2, fill: 'gold', fillAlpha: 0.1, n: 800 });
          T.path(xs.map((x, i) => [x, u[i]]), { color: 'purple', width: 2.6 });
          T.path(xs.map((x, i) => [x, du[i]]), { color: 'green', width: 2.2 });
          [0, 1].forEach((x) => { const i = x ? xs.length - 1 : 0; T.dot(x, free ? du[i] : u[i], { color: free ? 'green' : 'purple', r: 5 }); });
          for (let k = free ? 0 : 1; k <= 10; k++) {
            const bm = 1 / (1 + k * k * Math.PI * Math.PI), cm = k * Math.PI / (1 + k * k * Math.PI * Math.PI);
            Bs.rect(k - 0.36, 0, k - 0.02, bm, { color: 'purple', fill: 'purple', fillAlpha: 0.55 });
            Bs.rect(k + 0.02, 0, k + 0.36, cm, { color: 'green', fill: 'green', fillAlpha: 0.55 });
          }
          Bs.hline(0, { color: 'muted', width: 1 });
          Bs.hline(1, { color: 'purple', width: 1, dash: [4, 3] }); Bs.hline(0.5, { color: 'green', width: 1, dash: [4, 3] });
          st = { free, e0: free ? du[0] : u[0], e1: free ? du[du.length - 1] : u[u.length - 1] };
        });
        v.readout(() => {
          const s = st;
          return s.free ? `Neumann: $u'(0)=${v.fix(s.e0, 4)}$, $u'(1)=${v.fix(s.e1, 4)}$. $\\|B\\|=1$ (attained on constants, $k=0$), $\\|C\\|\\le\\frac12$.` : `Dirichlet: $u(0)=${v.fix(s.e0, 4)}$, $u(1)=${v.fix(s.e1, 4)}$. $\\|B\\|=1/(1+\\pi^2)$, $\\|C\\|\\le\\frac12$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 13.14
    {
      num: '13.14',
      kind: 'Theorem',
      name: 'Essential self-adjointness: dense ranges of T ± i',
      statement: String.raw`Let $T$ be symmetric and densely defined. The following are equivalent:
(a) $\overline T$ is self-adjoint ($T$ is **essentially self-adjoint**);
(b) $\mathscr R(T+iI)$ and $\mathscr R(T-iI)$ are dense;
(c) $\mathscr N(T^*-iI)=\mathscr N(T^*+iI)=\{0\}$.
In that case $\overline T$ is the only self-adjoint extension of $T$.`,
      idea: String.raw`(b)$\Leftrightarrow$(c) is 13.9 applied to $T\pm iI$. For symmetric $T$ the cross terms in $\norm{(T\pm i)x}^2$ are $\pm2\operatorname{Im}(Tx,x)=0$, so $\norm{(T\pm i)x}^2=\norm{Tx}^2+\norm x^2$. The same holds for the closure $\overline T$, so $\overline T\pm iI$ are one-to-one with closed ranges, namely the closures of $\mathscr R(T\pm iI)$. If these are dense, then $\mathscr R(\overline T\pm iI)=H$, and $\overline T$ is self-adjoint: for $y\in\mathscr D(\overline T^*)$ pick $x$ with $(\overline T+i)x=(\overline T^*+i)y$. Then $(\overline T^*+i)(y-x)=0$, and $\mathscr N(\overline T^*+i)=\mathscr R(\overline T-i)^\perp=\{0\}$, so $y=x$. Any self-adjoint extension $S$ satisfies $\overline T\subset S$, hence $S=S^*\subset\overline T^*=\overline T$.`,
      caption: String.raw`Test (c) on $C_c^\infty(I)$ for $T=-i\,d/dx$ or $T=-d^2/dx^2$. The candidates in $\mathscr N(T^*\mp i)$ are exponentials, whose moduli are drawn left: $e^{\mp x}$, or $e^{\pm x/\sqrt2}$ for the second-order operator. They count only if they are square-integrable on $I$; right: $\int|f|^2$ over growing pieces of $I$. On $\R$ nothing survives, so $T$ is essentially self-adjoint. On a half-line or an interval some survive, the deficiency indices $(n_+,n_-)$ are not $(0,0)$, and boundary conditions must be chosen.`,
      deps: ['fa-13.9', 'fa-13.11', 'fa-13.12'],
      tags: ['symmetric operators', 'essential self-adjointness', 'deficiency indices'],
      verify: true,
      viz(v) {
        const M = v.M;
        const op = v.select('$T=$', [{ value: 'd1', label: '$-i\\,d/dx$' }, { value: 'd2', label: '$-d^2/dx^2$' }], 'd1');
        const iv = v.select('$I=$', [{ value: 'unit', label: '$(0,1)$' }, { value: 'half', label: '$(0,\\infty)$' }, { value: 'line', label: '$\\R$' }], 'half');
        const L = v.stage({ x: [-6, 6], y: [0, 4], height: 300, axes: true, title: 'moduli of the solutions of $T^*f=\\pm if$ on $I$' });
        const R = v.stage({ x: [0, 6], y: [-1, 5], height: 300, axes: 'box', xlabel: 'X', yticks: decTicks(-1, 5), title: '$\\int_{I\\cap[-X,X]}|f|^2$ (log scale)' });
        let st = {};
        v.legend([['green', 'square-integrable on $I$: counts'], ['red', 'not in $L^2(I)$']]);
        v.render(() => {
          const d1 = op.value === 'd1', I = iv.value;
          const lo = I === 'line' ? -6 : 0, hi = I === 'unit' ? 1 : 6;
          L.setView([I === 'line' ? -6 : -0.3, I === 'unit' ? 1.05 : 6], [0, 4]);
          R.setView([0, I === 'unit' ? 1 : 6], [-1, 5]);
          // candidates: rates r with |f| = e^{r x}; first order: +i ↦ r=−1, −i ↦ r=+1; second order: each sign has r = ±1/√2
          const cands = d1 ? [{ r: -1, sgn: '+' }, { r: 1, sgn: '−' }] : [{ r: -Math.SQRT1_2, sgn: '+' }, { r: Math.SQRT1_2, sgn: '+' }, { r: -Math.SQRT1_2, sgn: '−' }, { r: Math.SQRT1_2, sgn: '−' }];
          const inL2 = (r) => (I === 'unit' ? true : I === 'half' ? r < 0 : false);
          const np = cands.filter((c) => c.sgn === '+' && inL2(c.r)).length, nm = cands.filter((c) => c.sgn === '−' && inL2(c.r)).length;
          L.vband(lo, hi, { color: 'muted', alpha: 0.06 });
          cands.forEach((c, k) => {
            const ok = inL2(c.r), dash = c.sgn === '−' ? [6, 4] : false;
            L.fn((x) => Math.exp(c.r * x), { domain: [lo, hi], color: ok ? 'green' : 'red', width: 2.4, dash });
            const Xs = M.linspace(0.02, I === 'unit' ? 1 : 6, 120);
            R.path(Xs.map((X) => { const a = Math.max(lo, -X), b = Math.min(hi, X); const val = Math.abs(c.r) < 1e-12 ? b - a : (Math.exp(2 * c.r * b) - Math.exp(2 * c.r * a)) / (2 * c.r); return [X, Math.log10(Math.max(1e-6, val))]; }), { color: ok ? 'green' : 'red', width: 2, dash });
          });
          st = { np, nm, I, d1 };
        });
        v.readout(() => {
          const s = st, esa = s.np === 0 && s.nm === 0;
          return `Deficiency indices $(n_+,n_-)=(${s.np},${s.nm})$ (solid: $T^*f=if$, dashed: $T^*f=-if$). ` + (esa ? '**Essentially self-adjoint**: $\\overline T$ is the unique self-adjoint extension.' : s.np === s.nm ? 'Not essentially self-adjoint; there are many self-adjoint extensions (choices of boundary condition).' : 'Not essentially self-adjoint, and since $n_+\\ne n_-$ there is no self-adjoint extension at all.');
        });
      },
    },
    // ------------------------------------------------------------------ 13.15
    {
      num: '13.15',
      kind: 'Theorem',
      name: 'Self-adjoint operators are maximally symmetric',
      statement: String.raw`If $T$ is self-adjoint and $S$ is a symmetric extension of $T$, then $S=T$. So a self-adjoint operator has no proper symmetric extension, and two different self-adjoint extensions of the same symmetric operator never contain one another.`,
      idea: String.raw`$T\subset S$ gives $S^*\subset T^*$ (13.2), so $T\subset S\subset S^*\subset T^*=T$ and all four coincide. The model case is $-i\,d/dx$ on $[0,1]$. On $\{f(0)=f(1)=0\}$ it is symmetric but not self-adjoint, and its self-adjoint extensions $T_\theta$ form a circle. None of them contains another, and each one is a dead end for further symmetric extension.`,
      caption: String.raw`On $L^2[0,1]$, $T=-i\,d/dx$ is symmetric on functions with $f(0)=f(1)=0$: the boundary term $f(1)\bar g(1)-f(0)\bar g(0)$ in integration by parts vanishes (left panel: $(Tf,g)-(f,Tg)$ for the test pair shown). It is not self-adjoint — $T^*$ needs no boundary condition at all. Choose "no condition" to see symmetry fail on the larger domain. Its self-adjoint extensions are the $T_\theta$ with $f(1)=e^{i\theta}f(0)$, whose eigenfunctions $e^{i(\theta+2\pi k)x}$ have eigenvalues $\theta+2\pi k$ (right) — a different spectrum for each $\theta$. Slide $\theta$ and watch the spectrum (dots) shift.`,
      deps: ['fa-13.3', 'fa-13.2'],
      tags: ['unbounded operators', 'self-adjoint operators', 'boundary conditions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const thS = v.slider('$\\theta$ in $f(1)=e^{i\\theta}f(0)$', 0, 6.28, 1.2, { step: 0.01 });
        const bc = v.select('domain of $f$, $g$', [{ value: 'zero', label: '$f(0)=f(1)=0$' }, { value: 'theta', label: '$f(1)=e^{i\\theta}f(0)$' }, { value: 'none', label: 'no condition' }], 'theta');
        const L = v.stage({ x: [0, 1], y: [-1.6, 1.6], height: 300, axes: true, title: '$\\mathrm{Re}\\,f$ (blue), $\\mathrm{Re}\\,g$ (orange) in the chosen domain' });
        const R = v.stage({ x: [-14, 14], y: [-1, 1], height: 300, axes: true, title: 'spectrum of $T_\\theta$: $\\{\\theta+2\\pi k\\}$' });
        let st = {};
        v.render(() => {
          const th = thS.value, key = bc.value;
          // f(x) = a(x) e^{iθx} with a(0)=a(1) ⇒ f(1) = e^{iθ} f(0); g similar with another profile
          const prof = (key === 'zero') ? [(x) => Math.sin(Math.PI * x) * (1 + 0.5 * x), (x) => Math.sin(2 * Math.PI * x) + 0.3 * Math.sin(Math.PI * x)]
            : (key === 'theta') ? [(x) => 1 + 0.4 * Math.cos(2 * Math.PI * x), (x) => 0.6 + 0.5 * Math.sin(2 * Math.PI * x)]
              : [(x) => 1 + 0.6 * x, (x) => 0.4 + x * x];
          const ph = key === 'none' ? 0 : th;
          const F = (x) => [prof[0](x) * Math.cos(ph * x), prof[0](x) * Math.sin(ph * x)], G = (x) => [prof[1](x) * Math.cos(ph * x), prof[1](x) * Math.sin(ph * x)];
          const d = (H, x) => { const h = 1e-5, a = H(x + h), b = H(x - h); return [(a[0] - b[0]) / (2 * h), (a[1] - b[1]) / (2 * h)]; };
          const Tf = (H, x) => { const q = d(H, x); return [q[1], -q[0]]; };     // −i·H'
          const ip = (A, B) => { let re = 0, im = 0; const n = 2000; for (let i = 0; i <= n; i++) { const x = Math.min(1 - 1e-5, Math.max(1e-5, i / n)), w = (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) / (3 * n), a = A(x), b = B(x); re += w * (a[0] * b[0] + a[1] * b[1]); im += w * (a[1] * b[0] - a[0] * b[1]); } return [re, im]; };
          const lhs = ip((x) => Tf(F, x), G), rhs = ip(F, (x) => Tf(G, x));
          const defect = Math.hypot(lhs[0] - rhs[0], lhs[1] - rhs[1]);
          L.fn((x) => F(x)[0], { color: 'blue', width: 2.4 });
          L.fn((x) => G(x)[0], { color: 'orange', width: 2.2 });
          L.corner(`|(Tf, g) − (f, Tg)| = ${v.fmt(defect, 3)}`, 'bl', { color: defect < 1e-4 ? 'green' : 'red', weight: 600 });
          for (let k = -3; k <= 2; k++) { const l = th + 2 * Math.PI * k; if (Math.abs(l) < 14) R.dot(l, 0, { color: 'purple', r: 5.5 }); }
          for (let k = -1; k <= 1; k++) { const l = th + 2 * Math.PI * k; R.text(v.fmt(l, 2), l, 0, { dy: -14, color: 'purple', size: 11, align: 'center' }); }
          st = { key, defect };
        });
        v.readout(() => {
          const s = st;
          const tag = { zero: 'symmetric (boundary terms vanish) but not self-adjoint: its adjoint drops the boundary conditions', theta: 'symmetric and in fact self-adjoint: $\\mathscr D(T_\\theta^*)=\\mathscr D(T_\\theta)$', none: 'not symmetric on this domain: the boundary term $-i\\,(f(1)\\bar g(1)-f(0)\\bar g(0))$ survives' }[s.key];
          return `$|(Tf,g)-(f,Tg)| = ${v.sci(s.defect + 1e-17, 2)}$ — ${tag}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 13.16
    {
      num: '13.16',
      kind: 'Theorem',
      name: 'Symmetric operators: ‖(T ± i)x‖² = ‖Tx‖² + ‖x‖²',
      statement: String.raw`If $T$ is symmetric, then
$$\norm{(T\pm iI)x}^2=\norm{Tx}^2+\norm x^2\qquad(x\in\mathscr D(T)).$$
Consequently $T\pm iI$ are one-to-one with $\norm{(T\pm iI)x}\ge\norm x$; $T$ is closed if and only if $\mathscr R(T+iI)$ is closed, if and only if $\mathscr R(T-iI)$ is closed; and if $\mathscr R(T+iI)=H$ or $\mathscr R(T-iI)=H$, then $T$ is maximally symmetric.`,
      idea: String.raw`Expand: $\norm{Tx\pm ix}^2=\norm{Tx}^2+\norm x^2\pm2\operatorname{Re}\big(-i(Tx,x)\big)$, and $(Tx,x)$ is real for symmetric $T$. The identity says that $x\mapsto(T+iI)x$ is an isometry of $\mathscr G(T)$ onto $\mathscr R(T+iI)$, if the graph carries the norm $(\norm x^2+\norm{Tx}^2)^{1/2}$. So one is complete exactly when the other is. If $\mathscr R(T+iI)=H$ and $S\supset T$ is symmetric, then for $x\in\mathscr D(S)$ pick $y\in\mathscr D(T)$ with $(T+i)y=(S+i)x$. Since $S+iI$ is one-to-one by the same identity, $x=y\in\mathscr D(T)$, so $S=T$. This is the analytic heart of the Cayley transform 13.19.`,
      caption: String.raw`$T=-i\,d/dx$ on $L^2[0,1]$ and a real $f$ with prescribed end values $f(0)=p$, $f(1)=q$ (sliders) and interior shape $A$. Bars: $\norm{Tf}^2+\norm f^2$ (stacked), $\norm{(T+i)f}^2$ and $\norm{(T-i)f}^2$. The cross terms are $\mp(q^2-p^2)$, so the identity holds exactly when $|q|=|p|$, which is when $f$ lies in a domain $\{f(1)=e^{i\theta}f(0)\}$ on which $T$ is symmetric. Push $q$ away from $\pm p$: the bars come apart.`,
      deps: ['fa-13.3', 'fa-13.8', 'fa-13.15'],
      tags: ['symmetric operators', 'closed operators'],
      verify: true,
      viz(v) {
        const M = v.M;
        const pS = v.slider('$p=f(0)$', -1.5, 1.5, 0.8, { step: 0.01 });
        const qS = v.slider('$q=f(1)$', -1.5, 1.5, 0.8, { step: 0.01 });
        const AS = v.slider('interior shape $A$', -2, 2, 1.2, { step: 0.01 });
        v.button('make $q=p$', () => qS.set(pS.value));
        const L = v.stage({ x: [0, 1], y: [-3, 3], height: 300, axes: true, title: '$f$ (blue) and $|Tf|=|f\'|$ (orange)' });
        const R = v.stage({ x: [0.3, 3.7], y: [0, 10], height: 300, axes: false, title: 'the three squared norms' });
        let st = {};
        v.legend([['orange', '$\\|Tf\\|^2$'], ['blue', '$\\|f\\|^2$'], ['purple', '$\\|(T\\pm i)f\\|^2$']]);
        v.render(() => {
          const p = pS.value, q = qS.value, A = AS.value;
          const f = (x) => p * (1 - x) + q * x + A * Math.sin(Math.PI * x) + 0.4 * A * Math.sin(3 * Math.PI * x);
          const fd = (x) => q - p + A * Math.PI * Math.cos(Math.PI * x) + 1.2 * A * Math.PI * Math.cos(3 * Math.PI * x);
          const nf = simpson((x) => f(x) ** 2, 0, 1, 2000), nT = simpson((x) => fd(x) ** 2, 0, 1, 2000);
          const np = simpson((x) => (f(x) - fd(x)) ** 2, 0, 1, 2000), nm = simpson((x) => (f(x) + fd(x)) ** 2, 0, 1, 2000);   // (T+i)f = i(f−f'), (T−i)f = −i(f+f')
          L.setView(null, span([...M.linspace(0, 1, 101).map(f), ...M.linspace(0, 1, 101).map((x) => Math.abs(fd(x)))], 2, 0.1));
          L.fn((x) => Math.abs(fd(x)), { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.1 });
          L.fn(f, { color: 'blue', width: 2.6 });
          L.dot(0, p, { color: 'blue', r: 5, label: 'p' }); L.dot(1, q, { color: 'blue', r: 5, label: 'q', labelPos: 'nw' });
          const top = Math.max(nT + nf, np, nm) * 1.12;
          R.setView(null, [-0.1 * top, top]);
          R.hline(0, { color: 'muted', width: 1 });
          R.rect(0.7, 0, 1.3, nT, { color: 'orange', fill: 'orange', fillAlpha: 0.55 });
          R.rect(0.7, nT, 1.3, nT + nf, { color: 'blue', fill: 'blue', fillAlpha: 0.55 });
          R.rect(1.7, 0, 2.3, np, { color: 'purple', fill: 'purple', fillAlpha: 0.55 });
          R.rect(2.7, 0, 3.3, nm, { color: 'purple', fill: 'purple', fillAlpha: 0.35 });
          R.hline(nT + nf, { color: 'ink', width: 1, dash: [4, 3] });
          [['‖Tf‖² + ‖f‖²', 1], ['‖(T+i)f‖²', 2], ['‖(T−i)f‖²', 3]].forEach(([t, x]) => R.text(t, x, -0.05 * top, { color: 'muted', size: 12, align: 'center' }));
          st = { nf, nT, np, nm, bd: q * q - p * p };
        });
        v.readout(() => {
          const s = st, sym = Math.abs(s.bd) < 1e-3;
          return `$\\|Tf\\|^2+\\|f\\|^2=${v.fix(s.nT + s.nf, 3)}$, $\\|(T+i)f\\|^2=${v.fix(s.np, 3)}$, $\\|(T-i)f\\|^2=${v.fix(s.nm, 3)}$; boundary term $q^2-p^2=${v.fix(s.bd, 3)}$. ` + (sym ? '**Equal**: on a symmetric domain $(Tf,f)$ is real and the cross terms cancel.' : 'Not equal: $f$ lies in no domain on which $T$ is symmetric.');
        });
      },
    },
  ],
};
